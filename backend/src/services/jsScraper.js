const { chromium } = require('playwright');
const cheerio = require('cheerio');
const { parseSections } = require('./sectionParser');

async function scrapeWithJS(url) {
  const errors = [];
  let meta = {
    title: '',
    description: '',
    language: '',
    canonical: null
  };
  let sections = [];
  const interactions = {
    clicks: [],
    scrolls: 0,
    pages: [url]
  };

  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Scroll to trigger lazy loading (depth >= 3)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForTimeout(1000);
      interactions.scrolls++;
    }

    // Try clicking "Load more" or "Show more" buttons
    const loadMoreSelectors = [
      'button:has-text("Load more")',
      'button:has-text("Show more")',
      'button:has-text("See more")',
      'a:has-text("Load more")',
      '[class*="load-more"]',
      '[class*="show-more"]'
    ];

    for (const selector of loadMoreSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          interactions.clicks.push({ selector, success: true });
          await page.waitForTimeout(2000);
          break;
        }
      } catch (clickError) {
        // Ignore click errors
      }
    }

    // Try clicking tabs if present
    const tabSelectors = [
      '[role="tab"]',
      '.tab',
      '[class*="tab-"]'
    ];

    for (const selector of tabSelectors) {
      try {
        const tabs = await page.$$(selector);
        if (tabs.length > 1) {
          await tabs[1].click();
          interactions.clicks.push({ selector, success: true });
          await page.waitForTimeout(1500);
          break;
        }
      } catch (tabError) {
        // Ignore tab errors
      }
    }

    // Handle pagination (try to go to next page)
    const paginationSelectors = [
      'a[aria-label="Next"]',
      'a:has-text("Next")',
      '.pagination a:last-child',
      '[class*="next"]'
    ];

    for (const selector of paginationSelectors) {
      try {
        const nextLink = await page.$(selector);
        if (nextLink) {
          const href = await nextLink.getAttribute('href');
          if (href && !href.startsWith('#')) {
            interactions.pages.push(href);
            interactions.clicks.push({ selector, success: true });
            break;
          }
        }
      } catch (paginationError) {
        // Ignore pagination errors
      }
    }

    // Get final HTML content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract meta information
    meta.title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || '';
    meta.description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    meta.language = $('html').attr('lang') || '';
    meta.canonical = $('link[rel="canonical"]').attr('href') || null;

    // Parse sections
    sections = parseSections($, url);

  } catch (error) {
    errors.push({
      message: error.message,
      phase: 'render'
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { meta, sections, interactions, errors };
}

module.exports = { scrapeWithJS };

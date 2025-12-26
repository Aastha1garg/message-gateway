const express = require('express');
const router = express.Router();
const { validateUrl } = require('../utils/urlValidator');
const { scrapeStatic } = require('../services/staticScraper');
const { scrapeWithJS } = require('../services/jsScraper');
const ScrapeResult = require('../models/ScrapeResult');

router.post('/scrape', async (req, res) => {
  const { url } = req.body;
  const errors = [];
  
  // Validate URL
  const urlValidation = validateUrl(url);
  if (!urlValidation.valid) {
    return res.status(400).json({
      result: null,
      errors: [{ message: urlValidation.error, phase: 'validate' }]
    });
  }

  const scrapedAt = new Date().toISOString();
  let result = {
    url,
    scrapedAt,
    meta: {
      title: '',
      description: '',
      language: '',
      canonical: null
    },
    sections: [],
    interactions: {
      clicks: [],
      scrolls: 0,
      pages: []
    },
    errors: []
  };

  try {
    // Try static scraping first
    console.log(`[Static] Scraping: ${url}`);
    const staticResult = await scrapeStatic(url);
    
    result.meta = staticResult.meta;
    result.sections = staticResult.sections;
    result.errors.push(...staticResult.errors);

    // Check if content is sufficient
    const totalText = result.sections.reduce((acc, s) => acc + (s.content?.text?.length || 0), 0);
    const hasMainContent = result.sections.some(s => 
      s.type === 'hero' || s.type === 'section' || s.content?.headings?.length > 0
    );

    // Fallback to JS rendering if content is insufficient
    if (totalText < 200 || !hasMainContent || result.sections.length === 0) {
      console.log(`[JS Fallback] Content insufficient, using Playwright...`);
      
      try {
        const jsResult = await scrapeWithJS(url);
        
        // Merge results, preferring JS-rendered content
        if (jsResult.sections.length > result.sections.length) {
          result.sections = jsResult.sections;
        }
        if (jsResult.meta.title && !result.meta.title) {
          result.meta = jsResult.meta;
        }
        
        result.interactions = jsResult.interactions;
        result.errors.push(...jsResult.errors);
      } catch (jsError) {
        result.errors.push({
          message: `JS rendering failed: ${jsError.message}`,
          phase: 'render'
        });
      }
    }

    // Store result in MongoDB (optional)
    try {
      await ScrapeResult.create({
        url,
        scrapedAt,
        meta: result.meta,
        sectionsCount: result.sections.length,
        errors: result.errors
      });
    } catch (dbError) {
      // Silently ignore DB errors
      console.warn('Failed to store result:', dbError.message);
    }

    res.json({ result });

  } catch (error) {
    console.error('Scrape error:', error.message);
    result.errors.push({
      message: error.message,
      phase: 'fetch'
    });
    res.json({ result });
  }
});

module.exports = router;

const axios = require('axios');
const cheerio = require('cheerio');
const { parseSections } = require('./sectionParser');

async function scrapeStatic(url) {
  const errors = [];
  let meta = {
    title: '',
    description: '',
    language: '',
    canonical: null
  };
  let sections = [];

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      maxRedirects: 5
    });

    const html = response.data;
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
      phase: 'fetch'
    });
  }

  return { meta, sections, errors };
}

module.exports = { scrapeStatic };

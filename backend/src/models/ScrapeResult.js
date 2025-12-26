const mongoose = require('mongoose');

const scrapeResultSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    index: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  meta: {
    title: String,
    description: String,
    language: String,
    canonical: String
  },
  sectionsCount: {
    type: Number,
    default: 0
  },
  errors: [{
    message: String,
    phase: String
  }]
}, {
  timestamps: true
});

// Index for querying recent scrapes
scrapeResultSchema.index({ scrapedAt: -1 });

module.exports = mongoose.model('ScrapeResult', scrapeResultSchema);

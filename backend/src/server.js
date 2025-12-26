const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scraper';

// MongoDB connection (optional - app works without it)
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.warn('MongoDB connection failed (scraping will still work):', err.message);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}/`);
  console.log(`Health check at http://localhost:${PORT}/healthz`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');

const healthRoutes = require('./routes/health');
const scrapeRoutes = require('./routes/scrape');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/', healthRoutes);
app.use('/', scrapeRoutes);

// Serve frontend for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    result: null,
    errors: [{ message: err.message, phase: 'server' }]
  });
});

module.exports = app;

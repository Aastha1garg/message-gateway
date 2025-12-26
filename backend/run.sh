#!/bin/bash

echo "=== Universal Website Scraper MVP ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js LTS."
    exit 1
fi

echo "Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Install Playwright browsers
echo ""
echo "Installing Playwright browsers..."
npx playwright install chromium

# Set default environment variables if not set
export PORT=${PORT:-8000}
export MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/scraper"}
export LOG_LEVEL=${LOG_LEVEL:-"info"}

echo ""
echo "Starting server on http://localhost:$PORT"
echo "MongoDB URI: $MONGODB_URI"
echo ""

# Start server
node src/server.js

# Universal Website Scraper MVP

A full-stack web application that scrapes websites (static and JS-rendered) and returns structured JSON data.

## Features

- ✅ Static scraping using axios + cheerio
- ✅ JS rendering fallback using Playwright
- ✅ Automatic content detection and section grouping
- ✅ Click/scroll/pagination interactions (depth ≥ 3)
- ✅ Clean JSON output with structured sections
- ✅ Modern web UI with JSON viewer
- ✅ Download results as JSON file

## How to Run

```bash
# Make the run script executable
chmod +x run.sh

# Run the application
./run.sh
```

The server will start on http://localhost:8000

## API Endpoints

### GET /healthz

Health check endpoint.

```bash
curl http://localhost:8000/healthz
```

Response:
```json
{ "status": "ok" }
```

### POST /scrape

Scrape a website and return structured data.

```bash
curl -X POST http://localhost:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Test URLs

The following URLs were used for testing:

1. **Static Site**: `https://example.com`
   - Simple HTML page, no JavaScript required
   - Fast scraping with cheerio only

2. **JS-Heavy Site**: `https://quotes.toscrape.com/js/`
   - Content loaded via JavaScript
   - Requires Playwright fallback
   - Tests dynamic content extraction

3. **Pagination Site**: `https://news.ycombinator.com`
   - Multiple pages of content
   - Tests pagination link detection
   - Tests "More" link clicking

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8000 | Server port |
| MONGODB_URI | mongodb://localhost:27017/scraper | MongoDB connection string |
| LOG_LEVEL | info | Logging verbosity |

## Known Limitations

1. **Playwright Browser Size**: First run downloads Chromium (~150MB)
2. **Timeout**: Complex sites may take up to 60 seconds
3. **Authentication**: Cannot scrape sites requiring login
4. **CAPTCHAs**: Cannot bypass CAPTCHA challenges
5. **Rate Limiting**: May be blocked by aggressive rate limiters
6. **Iframes**: Content inside iframes is not extracted
7. **Shadow DOM**: Shadow DOM content may not be fully captured

## Response Format

```json
{
  "result": {
    "url": "https://example.com",
    "scrapedAt": "2025-01-15T10:00:00.000Z",
    "meta": {
      "title": "Example Domain",
      "description": "...",
      "language": "en",
      "canonical": null
    },
    "sections": [
      {
        "id": "section-0",
        "type": "hero",
        "label": "Example Domain",
        "sourceUrl": "https://example.com",
        "content": {
          "headings": ["Example Domain"],
          "text": "This domain is for use in illustrative examples...",
          "links": [{ "text": "More information", "href": "..." }],
          "images": [],
          "lists": [],
          "tables": []
        },
        "rawHtml": "<div>...</div>",
        "truncated": false
      }
    ],
    "interactions": {
      "clicks": [],
      "scrolls": 3,
      "pages": ["https://example.com"]
    },
    "errors": []
  }
}
```

## Technology Stack

- **Backend**: Node.js + Express.js
- **Static Scraping**: axios + cheerio
- **JS Rendering**: Playwright (Chromium)
- **Database**: MongoDB (optional, for logging)
- **Frontend**: Vanilla HTML/CSS/JS

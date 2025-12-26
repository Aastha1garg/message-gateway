# Design Notes

## Static vs JS Fallback Strategy

The scraper uses a two-phase approach:

### Phase 1: Static Scraping (Fast Path)
1. Fetch HTML using axios with realistic User-Agent
2. Parse with cheerio (fast, no browser needed)
3. Extract meta tags, headings, and sections

### Phase 2: JS Fallback (Triggered Conditionally)
The system falls back to Playwright when:
- Total extracted text < 200 characters
- No main content sections found
- Zero sections after parsing

This strategy optimizes for speed while ensuring JS-rendered content is captured.

## Wait Strategy in Playwright

```javascript
await page.goto(url, { 
  waitUntil: 'networkidle',  // Wait for network to be idle
  timeout: 60000              // 60 second max timeout
});
await page.waitForTimeout(2000); // Additional 2s buffer for late-loading content
```

**Rationale**: `networkidle` catches most AJAX content, but some sites trigger delayed renders. The 2-second buffer catches these edge cases without excessive waiting.

## Click/Scroll Strategy

### Scrolling (Depth ≥ 3)
```javascript
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  await page.waitForTimeout(1000);
}
```
- Scrolls 3 times (one viewport height each)
- 1-second pause allows lazy-loaded content to appear
- Records scroll count in `interactions.scrolls`

### Click Detection
The scraper attempts clicks on:
1. "Load more" / "Show more" buttons
2. Tab elements (clicks second tab if multiple exist)
3. Pagination "Next" links

**Priority Order**:
1. Load more buttons (highest priority for infinite scroll)
2. Tabs (for tabbed content sections)
3. Pagination (for multi-page content)

### Recording
All successful interactions are logged:
```javascript
interactions: {
  clicks: [{ selector: 'button:has-text("Load more")', success: true }],
  scrolls: 3,
  pages: ['https://example.com', 'https://example.com/page2']
}
```

## Section Grouping & Labels

### Semantic Element Priority
1. `<header>`, `<nav>` → type: "nav"
2. `[class*="hero"]` → type: "hero"
3. `<main>`, `<section>`, `<article>` → type: "section"
4. `[class*="pricing"]` → type: "pricing"
5. `[class*="faq"]` → type: "faq"
6. `<ul>`, `<ol>` → type: "list"
7. `[class*="grid"]` → type: "grid"
8. `<footer>` → type: "footer"

### Label Generation
Labels are derived in order:
1. First heading inside the section (h1-h6)
2. Semantic type name (e.g., "Navigation", "Footer")
3. Fallback: "Section {n}"

### Heading-Based Fallback
If no semantic elements found, sections are created by:
1. Finding all h1-h3 headings
2. Grouping following content until next heading
3. Creating section per heading group

## Noise Filtering

### Removed Elements
Before text extraction, the following are stripped:
- `<script>` tags
- `<style>` tags
- `<noscript>` tags

### Content Limits
- Text: max 2000 characters per section
- Links: max 50 per section
- Images: max 20 per section
- Lists: max 10 per section
- Tables: max 5 per section
- Link text: max 100 characters
- Image alt: max 200 characters

## HTML Truncation

```javascript
const MAX_RAW_HTML_LENGTH = 2000;

let rawHtml = $.html($el);
const truncated = rawHtml.length > MAX_RAW_HTML_LENGTH;
if (truncated) {
  rawHtml = rawHtml.substring(0, MAX_RAW_HTML_LENGTH) + '...';
}
```

**Rationale**: 
- Keeps response size manageable
- 2000 chars usually captures the structure
- `truncated: true` flag signals incomplete HTML
- Useful for debugging without overwhelming the response

## URL Resolution

All relative URLs are converted to absolute:
```javascript
function resolveUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href; // Return as-is if invalid
  }
}
```

Applied to:
- All links (`a[href]`)
- All images (`img[src]`)
- Canonical URLs

## Error Handling Philosophy

1. **Never crash**: All errors are caught and logged
2. **Partial results**: Return whatever was extracted
3. **Phase tagging**: Errors include phase (fetch, render, parse)
4. **Graceful degradation**: If JS rendering fails, static results are still returned

Example error handling:
```javascript
try {
  // Attempt operation
} catch (error) {
  result.errors.push({
    message: error.message,
    phase: 'render'
  });
  // Continue with partial results
}
```

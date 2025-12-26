# Design Notes

## Static vs JS Fallback
The scraper first attempts static HTML scraping using HTTP requests and Cheerio to parse the DOM.
If the extracted content appears insufficient (very little text, missing main sections, or empty body),
the system falls back to Playwright to render the page with JavaScript enabled and then re-parses the
rendered HTML using the same section parsing logic.

## Wait Strategy for JS
- [x] Network idle  
- [ ] Fixed sleep  
- [ ] Wait for selectors  

When using Playwright, the scraper waits for network activity to settle (`networkidle`) before
extracting the page content to ensure JavaScript-rendered elements are fully loaded.

## Click & Scroll Strategy
- Click flows implemented: None  
- Scroll / pagination approach: Infinite scrolling  
- Stop conditions: Maximum of 3 scroll operations or timeout  

To explore content beyond the initial viewport, the scraper performs vertical scrolling up to a depth
of 3 scrolls, waiting between scrolls to allow additional content to load.

## Section Grouping & Labels
The DOM is grouped into sections using semantic landmarks such as `header`, `nav`, `section`, and
`footer`, as well as heading tags (`h1`–`h3`).  
If a section does not contain an explicit heading, a fallback label is generated using the first
5–7 words of the section’s text content.

## Noise Filtering & Truncation
Basic noise filtering is applied to ignore obvious non-content elements such as cookie banners and
overlays where possible.  
The `rawHtml` field for each section is truncated to a fixed character limit to keep responses
manageable, and the `truncated` flag is set accordingly.

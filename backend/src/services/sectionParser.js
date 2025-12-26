const MAX_RAW_HTML_LENGTH = 2000;

function parseSections($, baseUrl) {
  const sections = [];
  let sectionIndex = 0;

  // Define semantic elements to look for
  const semanticSelectors = [
    { selector: 'header', type: 'nav' },
    { selector: 'nav', type: 'nav' },
    { selector: 'main', type: 'section' },
    { selector: '[class*="hero"]', type: 'hero' },
    { selector: '[class*="Hero"]', type: 'hero' },
    { selector: 'section', type: 'section' },
    { selector: 'article', type: 'section' },
    { selector: '[class*="pricing"]', type: 'pricing' },
    { selector: '[class*="Pricing"]', type: 'pricing' },
    { selector: '[class*="faq"]', type: 'faq' },
    { selector: '[class*="FAQ"]', type: 'faq' },
    { selector: 'ul, ol', type: 'list' },
    { selector: '[class*="grid"]', type: 'grid' },
    { selector: 'footer', type: 'footer' }
  ];

  // Track processed elements to avoid duplicates
  const processed = new Set();

  for (const { selector, type } of semanticSelectors) {
    $(selector).each((_, element) => {
      const $el = $(element);
      const elHtml = $.html(element);
      
      // Skip if already processed or too small
      if (processed.has(elHtml.substring(0, 100))) return;
      if ($el.text().trim().length < 10) return;
      
      processed.add(elHtml.substring(0, 100));

      const section = extractSectionContent($, $el, baseUrl, sectionIndex, type);
      if (section.content.text.length > 0 || section.content.headings.length > 0) {
        sections.push(section);
        sectionIndex++;
      }
    });
  }

  // If no semantic sections found, try grouping by headings
  if (sections.length === 0) {
    $('h1, h2, h3').each((_, heading) => {
      const $heading = $(heading);
      const headingText = $heading.text().trim();
      
      if (!headingText) return;

      // Get following content until next heading
      let content = '';
      let $next = $heading.next();
      
      while ($next.length && !$next.is('h1, h2, h3')) {
        content += $next.text().trim() + ' ';
        $next = $next.next();
      }

      const section = {
        id: `section-${sectionIndex}`,
        type: 'section',
        label: headingText.substring(0, 50),
        sourceUrl: baseUrl,
        content: {
          headings: [headingText],
          text: content.trim().substring(0, 1000),
          links: [],
          images: [],
          lists: [],
          tables: []
        },
        rawHtml: '',
        truncated: false
      };

      sections.push(section);
      sectionIndex++;
    });
  }

  return sections;
}

function extractSectionContent($, $el, baseUrl, index, type) {
  // Extract headings
  const headings = [];
  $el.find('h1, h2, h3, h4, h5, h6').each((_, h) => {
    const text = $(h).text().trim();
    if (text) headings.push(text);
  });

  // Extract text content (remove script/style)
  const $clone = $el.clone();
  $clone.find('script, style, noscript').remove();
  const text = $clone.text().replace(/\s+/g, ' ').trim().substring(0, 2000);

  // Extract links
  const links = [];
  $el.find('a[href]').each((_, a) => {
    const $a = $(a);
    const href = $a.attr('href');
    const linkText = $a.text().trim();
    
    if (href && linkText && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({
        text: linkText.substring(0, 100),
        href: resolveUrl(href, baseUrl)
      });
    }
  });

  // Extract images
  const images = [];
  $el.find('img[src]').each((_, img) => {
    const $img = $(img);
    const src = $img.attr('src');
    const alt = $img.attr('alt') || '';
    
    if (src) {
      images.push({
        src: resolveUrl(src, baseUrl),
        alt: alt.substring(0, 200)
      });
    }
  });

  // Extract lists
  const lists = [];
  $el.find('ul, ol').each((_, list) => {
    const items = [];
    $(list).find('> li').each((_, li) => {
      const itemText = $(li).text().trim();
      if (itemText) items.push(itemText.substring(0, 200));
    });
    if (items.length > 0) lists.push(items);
  });

  // Extract tables
  const tables = [];
  $el.find('table').each((_, table) => {
    const rows = [];
    $(table).find('tr').each((_, tr) => {
      const cells = [];
      $(tr).find('th, td').each((_, cell) => {
        cells.push($(cell).text().trim().substring(0, 100));
      });
      if (cells.length > 0) rows.push(cells);
    });
    if (rows.length > 0) tables.push(rows);
  });

  // Get raw HTML (truncated)
  let rawHtml = $.html($el);
  const truncated = rawHtml.length > MAX_RAW_HTML_LENGTH;
  if (truncated) {
    rawHtml = rawHtml.substring(0, MAX_RAW_HTML_LENGTH) + '...';
  }

  // Generate label
  const label = headings[0] || 
                (type === 'nav' ? 'Navigation' : 
                 type === 'footer' ? 'Footer' :
                 type === 'hero' ? 'Hero Section' :
                 `Section ${index + 1}`);

  return {
    id: `section-${index}`,
    type,
    label: label.substring(0, 100),
    sourceUrl: baseUrl,
    content: {
      headings: headings.slice(0, 10),
      text,
      links: links.slice(0, 50),
      images: images.slice(0, 20),
      lists: lists.slice(0, 10),
      tables: tables.slice(0, 5)
    },
    rawHtml,
    truncated
  };
}

function resolveUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

module.exports = { parseSections };

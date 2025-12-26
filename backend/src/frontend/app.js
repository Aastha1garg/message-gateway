// DOM Elements
const urlInput = document.getElementById('urlInput');
const scrapeBtn = document.getElementById('scrapeBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const metaContent = document.getElementById('metaContent');
const sectionCount = document.getElementById('sectionCount');
const sectionsAccordion = document.getElementById('sectionsAccordion');
const interactionsContent = document.getElementById('interactionsContent');
const errorsContainer = document.getElementById('errorsContainer');
const errorsList = document.getElementById('errorsList');
const downloadBtn = document.getElementById('downloadBtn');
const toggleJsonBtn = document.getElementById('toggleJsonBtn');
const jsonOutput = document.getElementById('jsonOutput');

let currentResult = null;

// Event Listeners
scrapeBtn.addEventListener('click', handleScrape);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleScrape();
});
downloadBtn.addEventListener('click', handleDownload);
toggleJsonBtn.addEventListener('click', toggleJsonView);

async function handleScrape() {
  const url = urlInput.value.trim();
  
  if (!url) {
    showError('Please enter a URL');
    return;
  }

  // Reset UI
  hideError();
  hideResult();
  showLoading();
  setButtonLoading(true);

  try {
    const response = await fetch('/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.message || 'Scraping failed';
      showError(errorMsg);
      return;
    }

    currentResult = data.result;
    displayResult(data.result);

  } catch (error) {
    console.error('Scrape error:', error);
    showError(`Request failed: ${error.message}`);
  } finally {
    hideLoading();
    setButtonLoading(false);
  }
}

function displayResult(result) {
  // Display metadata
  metaContent.innerHTML = `
    <div class="meta-item">
      <span class="meta-label">Title:</span>
      <span class="meta-value">${escapeHtml(result.meta.title) || 'N/A'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Description:</span>
      <span class="meta-value">${escapeHtml(result.meta.description) || 'N/A'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Language:</span>
      <span class="meta-value">${escapeHtml(result.meta.language) || 'N/A'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Canonical:</span>
      <span class="meta-value">${result.meta.canonical ? `<a href="${escapeHtml(result.meta.canonical)}" target="_blank" rel="noopener">${escapeHtml(result.meta.canonical)}</a>` : 'N/A'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Scraped At:</span>
      <span class="meta-value">${new Date(result.scrapedAt).toLocaleString()}</span>
    </div>
  `;

  // Display sections
  sectionCount.textContent = result.sections.length;
  sectionsAccordion.innerHTML = result.sections.map((section, index) => `
    <div class="accordion-item" data-index="${index}">
      <div class="accordion-header" onclick="toggleAccordion(${index})">
        <span class="accordion-icon">▶</span>
        <span class="accordion-title">${escapeHtml(section.label)}</span>
        <span class="accordion-type">${escapeHtml(section.type)}</span>
      </div>
      <div class="accordion-content">
        <pre class="section-json">${escapeHtml(JSON.stringify(section, null, 2))}</pre>
      </div>
    </div>
  `).join('');

  // Display interactions
  interactionsContent.innerHTML = `
    <div class="interaction-stat">
      <div class="stat-value">${result.interactions.scrolls}</div>
      <div class="stat-label">Scrolls</div>
    </div>
    <div class="interaction-stat">
      <div class="stat-value">${result.interactions.clicks.length}</div>
      <div class="stat-label">Clicks</div>
    </div>
    <div class="interaction-stat">
      <div class="stat-value">${result.interactions.pages.length}</div>
      <div class="stat-label">Pages Visited</div>
    </div>
  `;

  // Display errors if any
  if (result.errors && result.errors.length > 0) {
    errorsContainer.hidden = false;
    errorsList.innerHTML = result.errors.map(err => 
      `<li>[${escapeHtml(err.phase)}] ${escapeHtml(err.message)}</li>`
    ).join('');
  } else {
    errorsContainer.hidden = true;
  }

  // Prepare JSON output
  jsonOutput.textContent = JSON.stringify(result, null, 2);
  jsonOutput.hidden = true;
  toggleJsonBtn.textContent = 'Show JSON';

  showResult();
}

function toggleAccordion(index) {
  const item = document.querySelector(`.accordion-item[data-index="${index}"]`);
  if (item) {
    item.classList.toggle('open');
  }
}

function toggleJsonView() {
  const isHidden = jsonOutput.hidden;
  jsonOutput.hidden = !isHidden;
  toggleJsonBtn.textContent = isHidden ? 'Hide JSON' : 'Show JSON';
}

function handleDownload() {
  if (!currentResult) return;

  const blob = new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scrape-result-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// UI Helpers
function showError(message) {
  errorMessage.textContent = message;
  errorSection.hidden = false;
}

function hideError() {
  errorSection.hidden = true;
}

function showLoading() {
  loadingSection.hidden = false;
}

function hideLoading() {
  loadingSection.hidden = true;
}

function showResult() {
  resultSection.hidden = false;
}

function hideResult() {
  resultSection.hidden = true;
}

function setButtonLoading(loading) {
  scrapeBtn.disabled = loading;
  scrapeBtn.querySelector('.btn-text').hidden = loading;
  scrapeBtn.querySelector('.btn-loading').hidden = !loading;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Make toggleAccordion globally available
window.toggleAccordion = toggleAccordion;

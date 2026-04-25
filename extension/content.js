// Extracts job description from page and injects score badge
function extractJobDescription() {
  const selectors = [
    '.job-view-layout',           // LinkedIn
    '.jobsearch-JobComponent',    // Indeed
    '[data-testid="jobDescriptionText"]'
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) return el.innerText
  }
  return document.body.innerText.substring(0, 5000)
}

function injectBadge(score, recommendation, ghostRisk) {
  const existing = document.getElementById('ghost-job-badge')
  if (existing) existing.remove()

  const colors = {
    'Apply': '#22c55e',
    'Network First': '#eab308',
    'Low Priority': '#f97316',
    'Skip': '#ef4444',
  }

  const badge = document.createElement('div')
  badge.id = 'ghost-job-badge'
  badge.style.cssText = `
    position: fixed; top: 80px; right: 20px; z-index: 99999;
    background: #18181b; border: 1px solid #3f3f46;
    border-radius: 12px; padding: 12px 16px; min-width: 160px;
    font-family: system-ui; box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  `
  badge.innerHTML = `
    <div style="font-size:11px;color:#a1a1aa;margin-bottom:4px">Ghost Job Detector</div>
    <div style="font-size:28px;font-weight:900;color:white">${score}</div>
    <div style="font-size:11px;color:#a1a1aa">Legitimacy Score</div>
    <div style="margin-top:8px;font-size:12px;font-weight:bold;color:${colors[recommendation] || '#fff'}">${recommendation}</div>
    <div style="font-size:11px;color:#ef4444">${ghostRisk}% ghost risk</div>
  `
  document.body.appendChild(badge)
}

// Run on page load
const desc = extractJobDescription()
chrome.storage.local.get(['analyzer_enabled'], (res) => {
  if (res.analyzer_enabled !== false) {
    chrome.runtime.sendMessage({ type: 'ANALYZE', description: desc }, (result) => {
      if (result) injectBadge(result.score, result.recommendation, result.ghostRisk)
    })
  }
})
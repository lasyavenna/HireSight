document.getElementById('analyze-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => document.body.innerText.substring(0, 5000),
    }, (results) => {
      if (!results?.[0]?.result) return
      const result = analyzeJob(results[0].result)
      const colors = { 'Apply': '#22c55e', 'Network First': '#eab308', 'Low Priority': '#f97316', 'Skip': '#ef4444' }
      document.getElementById('result').innerHTML = `
        <div class="score">${result.score}</div>
        <div style="font-size:12px;color:#a1a1aa">Legitimacy Score · ${result.ghostRisk}% ghost risk</div>
        <div class="rec" style="color:${colors[result.recommendation]}">${result.recommendation}</div>
      `
    })
  })
})
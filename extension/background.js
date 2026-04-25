// Load analyzer and handle messages
importScripts('analyzer.js')

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ANALYZE') {
    const result = analyzeJob(msg.description)
    sendResponse(result)
  }
  return true
})
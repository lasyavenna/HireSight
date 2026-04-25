// Service worker — keeps extension alive and handles cross-origin fetch if needed

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ apiUrl: "" });
});

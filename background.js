chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    if (!data.highlights) {
      chrome.storage.local.set({ highlights: [] });
    }
  });
});

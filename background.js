chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-panel') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    // Try sidebar content script first; fall back to native side panel
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, () => {
      if (chrome.runtime.lastError) {
        chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
      }
    });
  }
});

/* global chrome */

chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  // Auto-open panel on first install
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-panel') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

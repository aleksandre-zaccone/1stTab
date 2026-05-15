/* global chrome */

async function toggleSidebarInActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, () => {
    void chrome.runtime.lastError; // suppress "no receiver" errors on chrome:// pages
  });
}

// Toolbar icon click → toggle sidebar
chrome.action.onClicked.addListener(toggleSidebarInActiveTab);

// Alt+Shift+P → toggle sidebar
chrome.commands.onCommand.addListener(command => {
  if (command === 'open-panel') toggleSidebarInActiveTab();
});

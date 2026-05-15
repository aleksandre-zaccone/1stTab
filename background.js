chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-panel') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

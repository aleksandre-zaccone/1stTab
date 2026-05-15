/* global chrome */
(function () {
  'use strict';

  // Skip extension pages and avoid double-injection
  if (
    location.protocol === 'chrome-extension:' ||
    document.getElementById('sttab-sidebar')
  ) return;

  let pos  = 'right';
  let open = false;

  chrome.storage.sync.get({ sidebarPos: 'right', sidebarOpen: false }, prefs => {
    pos  = prefs.sidebarPos;
    open = prefs.sidebarOpen;
    mount();
  });

  function mount() {
    const wrap = document.createElement('div');
    wrap.id = 'sttab-sidebar';
    sync(wrap);

    const tab = document.createElement('button');
    tab.id = 'sttab-tab';
    tab.setAttribute('aria-label', 'Toggle 1stTab panel');
    tab.addEventListener('click', toggle);

    const frame = document.createElement('iframe');
    frame.id    = 'sttab-frame';
    frame.src   = chrome.runtime.getURL('panel.html') + '?mode=sidebar';
    frame.title = '1stTab';

    wrap.appendChild(tab);
    wrap.appendChild(frame);
    document.documentElement.appendChild(wrap);
  }

  function sync(el) {
    el = el || document.getElementById('sttab-sidebar');
    if (!el) return;
    el.dataset.pos  = pos;
    el.dataset.open = open ? '1' : '0';
  }

  function toggle() {
    open = !open;
    sync();
    chrome.storage.sync.set({ sidebarOpen: open });
  }

  // Messages from the panel iframe (position switch, close)
  window.addEventListener('message', evt => {
    if (!evt.data || evt.data.src !== '1sttab') return;
    if (evt.data.action === 'setPos') {
      pos = evt.data.value;
      sync();
      chrome.storage.sync.set({ sidebarPos: pos });
    }
    if (evt.data.action === 'close') {
      open = false;
      sync();
      chrome.storage.sync.set({ sidebarOpen: false });
    }
  });

  // Keyboard shortcut relayed from background.js
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === 'toggleSidebar') toggle();
  });
})();

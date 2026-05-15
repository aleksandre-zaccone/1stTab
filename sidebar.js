/* global chrome */
(function () {
  'use strict';

  if (
    location.protocol === 'chrome-extension:' ||
    document.getElementById('sttab-sidebar')
  ) return;

  const MIN_W = 280;
  const MAX_W = 700;
  const DEFAULT_W = 400;

  let pos    = 'right';
  let open   = false;
  let width  = DEFAULT_W;

  chrome.storage.sync.get(
    { sidebarPos: 'right', sidebarOpen: false, sidebarWidth: DEFAULT_W },
    prefs => {
      pos   = prefs.sidebarPos;
      open  = prefs.sidebarOpen;
      width = prefs.sidebarWidth;
      mount();
    }
  );

  function mount() {
    // Overlay (captures mouse during resize so iframe doesn't steal events)
    const overlay = document.createElement('div');
    overlay.id = 'sttab-overlay';
    document.documentElement.appendChild(overlay);

    const wrap = document.createElement('div');
    wrap.id = 'sttab-sidebar';

    // Toggle tab
    const tab = document.createElement('button');
    tab.id = 'sttab-tab';
    tab.setAttribute('aria-label', 'Toggle 1stTab panel');
    tab.addEventListener('click', toggle);

    // Iframe wrapper (needed for relative positioning of resize handle)
    const frameWrap = document.createElement('div');
    frameWrap.id = 'sttab-frame-wrap';
    frameWrap.style.cssText = 'position:relative;height:100%;flex-shrink:0;';

    // Resize handle
    const handle = document.createElement('div');
    handle.id = 'sttab-resize';
    handle.addEventListener('mousedown', onResizeStart);

    // Iframe
    const frame = document.createElement('iframe');
    frame.id    = 'sttab-frame';
    frame.src   = chrome.runtime.getURL('panel.html') + '?mode=sidebar';
    frame.title = '1stTab';

    frameWrap.appendChild(handle);
    frameWrap.appendChild(frame);
    wrap.appendChild(tab);
    wrap.appendChild(frameWrap);
    document.documentElement.appendChild(wrap);

    sync(wrap);
  }

  function sync(el) {
    el = el || document.getElementById('sttab-sidebar');
    if (!el) return;
    el.dataset.pos  = pos;
    el.dataset.open = open ? '1' : '0';
    el.style.setProperty('--sttab-w', width + 'px');
    // Also update the frame-wrap width
    const fw = document.getElementById('sttab-frame-wrap');
    if (fw) fw.style.width = width + 'px';
  }

  function toggle() {
    open = !open;
    sync();
    chrome.storage.sync.set({ sidebarOpen: open });
  }

  // ── Resize ──────────────────────────────────────────────────────────────────
  let resizing = false;
  let startX   = 0;
  let startW   = 0;

  function onResizeStart(e) {
    e.preventDefault();
    resizing = true;
    startX   = e.clientX;
    startW   = width;
    const sidebar = document.getElementById('sttab-sidebar');
    if (sidebar) sidebar.dataset.resizing = '1';
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup',   onResizeEnd);
  }

  function onResizeMove(e) {
    if (!resizing) return;
    const dx = pos === 'right'
      ? startX - e.clientX   // dragging left = wider
      : e.clientX - startX;  // dragging right = wider
    width = Math.min(MAX_W, Math.max(MIN_W, startW + dx));
    sync();
  }

  function onResizeEnd() {
    resizing = false;
    const sidebar = document.getElementById('sttab-sidebar');
    if (sidebar) delete sidebar.dataset.resizing;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup',   onResizeEnd);
    chrome.storage.sync.set({ sidebarWidth: width });
  }

  // ── Messages from the panel iframe ──────────────────────────────────────────
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

  // ── Keyboard shortcut relayed from background.js ─────────────────────────
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === 'toggleSidebar') toggle();
  });
})();

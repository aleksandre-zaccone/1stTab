/* global chrome */
(function () {
  'use strict';

  if (
    location.protocol === 'chrome-extension:' ||
    document.getElementById('sttab-sidebar')
  ) return;

  const MIN_W     = 280;
  const MAX_W     = 700;
  const DEFAULT_W = 400;

  let pos   = 'right';
  let open  = false;
  let width = DEFAULT_W;

  chrome.storage.sync.get(
    { sidebarPos: 'right', sidebarOpen: false, sidebarWidth: DEFAULT_W },
    prefs => {
      pos   = prefs.sidebarPos;
      open  = prefs.sidebarOpen;
      width = prefs.sidebarWidth;
      mount();
    }
  );

  // ── Build DOM ────────────────────────────────────────────────────────────────

  function mount() {
    // Overlay blocks iframe from swallowing mouse events during resize
    const overlay = document.createElement('div');
    overlay.id = 'sttab-overlay';
    document.documentElement.appendChild(overlay);

    const sidebar = document.createElement('div');
    sidebar.id = 'sttab-sidebar';

    const tab = document.createElement('button');
    tab.id = 'sttab-tab';
    tab.setAttribute('aria-label', 'Toggle 1stTab panel');
    tab.addEventListener('click', toggle);

    const frameWrap = document.createElement('div');
    frameWrap.id = 'sttab-frame-wrap';

    const handle = document.createElement('div');
    handle.id = 'sttab-resize';
    handle.addEventListener('mousedown', startResize);

    const frame = document.createElement('iframe');
    frame.id    = 'sttab-frame';
    frame.src   = chrome.runtime.getURL('panel.html') + '?mode=sidebar';
    frame.title = '1stTab';

    frameWrap.appendChild(handle);
    frameWrap.appendChild(frame);
    sidebar.appendChild(tab);
    sidebar.appendChild(frameWrap);
    document.documentElement.appendChild(sidebar);

    applyStyles();
  }

  // ── Apply all dynamic styles via JS (avoids CSS custom-property issues) ─────

  function applyStyles() {
    const sidebar   = document.getElementById('sttab-sidebar');
    const frameWrap = document.getElementById('sttab-frame-wrap');
    const frame     = document.getElementById('sttab-frame');
    if (!sidebar) return;

    // Position anchor
    if (pos === 'right') {
      sidebar.style.right        = '0';
      sidebar.style.left         = 'auto';
      sidebar.style.flexDirection = 'row-reverse';
      sidebar.style.transform    = open ? 'translateX(0)' : `translateX(${width}px)`;
    } else {
      sidebar.style.left         = '0';
      sidebar.style.right        = 'auto';
      sidebar.style.flexDirection = 'row';
      sidebar.style.transform    = open ? 'translateX(0)' : `translateX(-${width}px)`;
    }

    // Dataset for CSS pseudo-selectors (hover, border-radius, shadow)
    sidebar.dataset.pos = pos;

    // Widths
    if (frameWrap) {
      frameWrap.style.width = width + 'px';
    }
    if (frame) {
      frame.style.width = width + 'px';
    }
  }

  // ── Toggle open / closed ─────────────────────────────────────────────────────

  function toggle() {
    open = !open;
    applyStyles();
    chrome.storage.sync.set({ sidebarOpen: open });
  }

  // ── Resize ───────────────────────────────────────────────────────────────────

  let resizing = false;
  let startX   = 0;
  let startW   = 0;

  function startResize(e) {
    e.preventDefault();
    resizing = true;
    startX   = e.clientX;
    startW   = width;
    const sidebar = document.getElementById('sttab-sidebar');
    if (sidebar) sidebar.dataset.resizing = '1';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  function onMove(e) {
    if (!resizing) return;
    const delta = pos === 'right'
      ? startX - e.clientX   // drag left → wider
      : e.clientX - startX;  // drag right → wider
    width = Math.max(MIN_W, Math.min(MAX_W, startW + delta));
    applyStyles();
  }

  function onUp() {
    resizing = false;
    const sidebar = document.getElementById('sttab-sidebar');
    if (sidebar) delete sidebar.dataset.resizing;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
    chrome.storage.sync.set({ sidebarWidth: width });
  }

  // ── Messages from the panel iframe ───────────────────────────────────────────

  window.addEventListener('message', evt => {
    if (!evt.data || evt.data.src !== '1sttab') return;
    if (evt.data.action === 'setPos') {
      pos = evt.data.value;
      applyStyles();
      chrome.storage.sync.set({ sidebarPos: pos });
    }
    if (evt.data.action === 'close') {
      open = false;
      applyStyles();
      chrome.storage.sync.set({ sidebarOpen: false });
    }
  });

  // ── Keyboard shortcut from background.js ─────────────────────────────────────

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === 'toggleSidebar') toggle();
  });
})();

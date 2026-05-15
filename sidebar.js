/* global chrome */
(function () {
  'use strict';

  if (location.protocol === 'chrome-extension:') return;
  if (document.getElementById('sttab-sb')) return;

  var MIN_W = 280, MAX_W = 700, DEFAULT_W = 400, TAB_W = 28;
  var pos = 'right', open = true, width = DEFAULT_W; // open=true by default for testing
  var sb, tab, frame, inner, handle;

  // Wait for body if not ready yet
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  function init() {
    chrome.storage.sync.get(
      { sidebarPos: 'right', sidebarWidth: DEFAULT_W },
      function (prefs) {
        pos   = prefs.sidebarPos;
        width = prefs.sidebarWidth;
        // Always start open so user can see it immediately
        open  = true;
        build();
      }
    );
  }

  function build() {
    sb = document.createElement('div');
    sb.id = 'sttab-sb';

    tab = document.createElement('button');
    tab.id = 'sttab-tab';
    tab.type = 'button';
    tab.addEventListener('click', toggle, true);

    inner = document.createElement('div');
    inner.id = 'sttab-inner';

    handle = document.createElement('div');
    handle.id = 'sttab-handle';
    handle.addEventListener('mousedown', startResize, true);

    frame = document.createElement('iframe');
    frame.id = 'sttab-frame';
    frame.src = chrome.runtime.getURL('panel.html') + '?mode=sidebar';
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('scrolling', 'no');

    inner.appendChild(handle);
    inner.appendChild(frame);
    sb.appendChild(tab);
    sb.appendChild(inner);
    document.body.appendChild(sb);

    paint();
  }

  function paint() {
    if (!sb) return;

    /* ── Sidebar ── */
    sb.style.position      = 'fixed';
    sb.style.top           = '0';
    sb.style.bottom        = '0';
    sb.style.height        = '100vh';
    sb.style.display       = 'flex';
    sb.style.alignItems    = 'stretch';
    sb.style.zIndex        = '2147483647';
    sb.style.margin        = '0';
    sb.style.padding       = '0';
    sb.style.border        = 'none';
    sb.style.background    = 'transparent';
    sb.style.boxSizing     = 'border-box';
    sb.style.transition    = 'transform 0.25s ease';
    sb.style.overflow      = 'visible';

    if (pos === 'right') {
      sb.style.right         = '0';
      sb.style.left          = 'auto';
      sb.style.flexDirection = 'row-reverse';
      sb.style.transform     = open ? 'translateX(0)' : 'translateX(' + width + 'px)';
    } else {
      sb.style.left          = '0';
      sb.style.right         = 'auto';
      sb.style.flexDirection = 'row';
      sb.style.transform     = open ? 'translateX(0)' : 'translateX(-' + width + 'px)';
    }

    /* ── Tab ── */
    tab.style.display        = 'flex';
    tab.style.alignItems     = 'center';
    tab.style.justifyContent = 'center';
    tab.style.flexShrink     = '0';
    tab.style.width          = TAB_W + 'px';
    tab.style.height         = '100%';
    tab.style.background     = '#1976d2';
    tab.style.color          = '#ffffff';
    tab.style.border         = 'none';
    tab.style.outline        = 'none';
    tab.style.padding        = '0';
    tab.style.margin         = '0';
    tab.style.cursor         = 'pointer';
    tab.style.writingMode    = 'vertical-rl';
    tab.style.fontSize       = '11px';
    tab.style.fontWeight     = '700';
    tab.style.fontFamily     = 'Arial, sans-serif';
    tab.style.letterSpacing  = '0.1em';
    tab.style.userSelect     = 'none';
    tab.style.zIndex         = '1';
    tab.style.position       = 'relative';
    tab.style.borderRadius   = pos === 'right' ? '8px 0 0 8px' : '0 8px 8px 0';
    tab.textContent          = '1stTab';

    /* ── Inner panel wrapper ── */
    inner.style.position   = 'relative';
    inner.style.width      = width + 'px';
    inner.style.height     = '100%';
    inner.style.flexShrink = '0';
    inner.style.overflow   = 'hidden';
    inner.style.background = '#fafafa';
    inner.style.boxShadow  = pos === 'right'
      ? '-4px 0 20px rgba(0,0,0,0.2)'
      : '4px 0 20px rgba(0,0,0,0.2)';

    /* ── Iframe ── */
    frame.style.display  = 'block';
    frame.style.width    = '100%';
    frame.style.height   = '100%';
    frame.style.border   = 'none';

    /* ── Resize handle ── */
    handle.style.position = 'absolute';
    handle.style.top      = '0';
    handle.style.bottom   = '0';
    handle.style.width    = '6px';
    handle.style.zIndex   = '2';
    handle.style.cursor   = 'ew-resize';
    handle.style.background = 'transparent';
    if (pos === 'right') {
      handle.style.left  = '0';
      handle.style.right = 'auto';
    } else {
      handle.style.right = '0';
      handle.style.left  = 'auto';
    }
  }

  function toggle() {
    open = !open;
    chrome.storage.sync.set({ sidebarOpen: open });
    paint();
  }

  /* ── Resize ── */
  var resizing = false, startX = 0, startW = 0;

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    startX   = e.clientX;
    startW   = width;
    frame.style.pointerEvents = 'none';
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup',   onUp,   true);
  }

  function onMove(e) {
    if (!resizing) return;
    var delta = pos === 'right' ? startX - e.clientX : e.clientX - startX;
    width = Math.max(MIN_W, Math.min(MAX_W, startW + delta));
    inner.style.width = width + 'px';
  }

  function onUp() {
    if (!resizing) return;
    resizing = false;
    frame.style.pointerEvents = '';
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('mouseup',   onUp,   true);
    chrome.storage.sync.set({ sidebarWidth: width });
  }

  /* ── Messages from iframe ── */
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.src !== '1sttab') return;
    if (e.data.action === 'setPos') {
      pos = e.data.value;
      paint();
      chrome.storage.sync.set({ sidebarPos: pos });
    }
    if (e.data.action === 'close') {
      open = false;
      paint();
      chrome.storage.sync.set({ sidebarOpen: false });
    }
  });

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.action === 'toggleSidebar') toggle();
  });
}());

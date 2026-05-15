/* global chrome */
(function () {
  'use strict';

  if (
    location.protocol === 'chrome-extension:' ||
    document.getElementById('sttab-sb')
  ) return;

  const MIN_W     = 280;
  const MAX_W     = 700;
  const DEFAULT_W = 400;
  const TAB_W     = 28;

  let pos   = 'right';
  let open  = false;
  let width = DEFAULT_W;

  chrome.storage.sync.get(
    { sidebarPos: 'right', sidebarOpen: false, sidebarWidth: DEFAULT_W },
    function (prefs) {
      pos   = prefs.sidebarPos;
      open  = prefs.sidebarOpen;
      width = prefs.sidebarWidth;
      build();
    }
  );

  /* ── Elements ── */
  var sb, tab, frame, handle;

  function build() {
    sb = document.createElement('div');
    sb.id = 'sttab-sb';

    tab = document.createElement('button');
    tab.id = 'sttab-tab';
    tab.textContent = '1stTab';
    tab.onclick = toggle;

    var inner = document.createElement('div');
    inner.id = 'sttab-inner';

    handle = document.createElement('div');
    handle.id = 'sttab-handle';
    handle.onmousedown = startResize;

    frame = document.createElement('iframe');
    frame.id  = 'sttab-iframe';
    frame.src = chrome.runtime.getURL('panel.html') + '?mode=sidebar';

    inner.appendChild(handle);
    inner.appendChild(frame);
    sb.appendChild(tab);
    sb.appendChild(inner);

    // Append to body so we inherit the viewport stacking context cleanly
    document.body.appendChild(sb);

    render();
  }

  /* ── Apply all visual state ── */
  function render() {
    if (!sb) return;

    var totalW = width + TAB_W;

    /* Sidebar container */
    sb.style.cssText = [
      'position:fixed',
      'top:0',
      'bottom:0',
      'height:100vh',
      'display:flex',
      'align-items:stretch',
      'z-index:2147483647',
      'box-shadow:none',
      'margin:0',
      'padding:0',
      'border:none',
      'background:transparent',
      'box-sizing:border-box',
      'transition:transform 0.25s cubic-bezier(0.4,0,0.2,1)',
    ].join(';');

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

    /* Toggle tab */
    tab.style.cssText = [
      'all:unset',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-shrink:0',
      'width:' + TAB_W + 'px',
      'height:100%',
      'background:#1976d2',
      'color:#fff',
      'font:700 11px/1 Arial,sans-serif',
      'letter-spacing:0.1em',
      'writing-mode:vertical-rl',
      'cursor:pointer',
      'user-select:none',
      'box-sizing:border-box',
      pos === 'right'
        ? 'border-radius:8px 0 0 8px'
        : 'border-radius:0 8px 8px 0',
    ].join(';');

    /* Inner container (holds handle + iframe) */
    var inner = document.getElementById('sttab-inner');
    if (inner) {
      inner.style.cssText = [
        'position:relative',
        'width:' + width + 'px',
        'height:100%',
        'flex-shrink:0',
        'overflow:hidden',
        'box-sizing:border-box',
      ].join(';');
    }

    /* Iframe */
    frame.style.cssText = [
      'display:block',
      'width:' + width + 'px',
      'height:100%',
      'border:none',
      'background:#fafafa',
    ].join(';');

    /* Resize handle */
    handle.style.cssText = [
      'position:absolute',
      'top:0',
      'bottom:0',
      'width:6px',
      'z-index:10',
      'cursor:ew-resize',
      'background:transparent',
      pos === 'right' ? 'left:0' : 'right:0',
    ].join(';');
  }

  /* ── Toggle ── */
  function toggle() {
    open = !open;
    render();
    chrome.storage.sync.set({ sidebarOpen: open });
  }

  /* ── Resize ── */
  var resizing = false;
  var startX = 0;
  var startW = 0;

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    startX   = e.clientX;
    startW   = width;
    // Disable iframe pointer events so it doesn't swallow mousemove
    frame.style.pointerEvents = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  function onMove(e) {
    if (!resizing) return;
    var delta = pos === 'right'
      ? startX - e.clientX
      : e.clientX - startX;
    width = Math.max(MIN_W, Math.min(MAX_W, startW + delta));
    render();
  }

  function onUp() {
    if (!resizing) return;
    resizing = false;
    frame.style.pointerEvents = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
    chrome.storage.sync.set({ sidebarWidth: width });
  }

  /* ── Messages from panel iframe ── */
  window.addEventListener('message', function (evt) {
    if (!evt.data || evt.data.src !== '1sttab') return;
    if (evt.data.action === 'setPos') {
      pos = evt.data.value;
      render();
      chrome.storage.sync.set({ sidebarPos: pos });
    }
    if (evt.data.action === 'close') {
      open = false;
      render();
      chrome.storage.sync.set({ sidebarOpen: false });
    }
  });

  /* ── Keyboard toggle from background.js ── */
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.action === 'toggleSidebar') toggle();
  });
}());

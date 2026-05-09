/* global React, ReactDOM, chrome,
   useStorage, STORAGE_KEYS, SEED_FOLDERS, SEED_BOOKMARKS,
   faviconUrl, colorForString, initialFromUrl */

const { useState, useEffect, useCallback } = React;

// ── Favicon with fallback tile ─────────────────────────────────────────────
function Favicon({ url, name }) {
  const src = faviconUrl(url, 32);
  const bg  = colorForString(url);
  const initial = initialFromUrl(url, name);
  const [ok, setOk] = useState(!!src);

  useEffect(() => { setOk(!!src); }, [src]);

  if (ok && src) {
    return React.createElement('img', {
      className: 'panel-bm-favicon',
      src,
      alt: '',
      onError: () => setOk(false),
    });
  }
  return React.createElement('span', {
    className: 'panel-bm-favicon-fallback',
    style: { background: bg },
  }, initial);
}

// ── Single folder section ──────────────────────────────────────────────────
function Folder({ folder, bookmarks }) {
  const [open, setOpen] = useState(true);

  if (!bookmarks.length) return null;

  return React.createElement('div', { className: 'panel-folder' },
    React.createElement('div', {
      className: 'panel-folder-header',
      onClick: () => setOpen(o => !o),
    },
      React.createElement('span', {
        className: `panel-folder-chevron ${open ? 'open' : ''}`,
      }, '▶'),
      React.createElement('span', { className: 'panel-folder-icon' }, '📁'),
      React.createElement('span', { className: 'panel-folder-name' }, folder.name),
      React.createElement('span', { className: 'panel-folder-count' }, bookmarks.length),
    ),
    open && React.createElement('div', { className: 'panel-bm-list' },
      bookmarks.map(bm =>
        React.createElement('a', {
          key: bm.id,
          href: bm.url,
          className: 'panel-bm',
          title: bm.url,
          target: '_blank',
          rel: 'noreferrer',
        },
          React.createElement(Favicon, { url: bm.url, name: bm.name }),
          React.createElement('span', { className: 'panel-bm-name' }, bm.name || bm.url),
        )
      )
    )
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
function PanelApp() {
  const [folders]   = useStorage(STORAGE_KEYS.folders,   SEED_FOLDERS);
  const [bookmarks] = useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  // Filter bookmarks by search query
  const filtered = q
    ? bookmarks.filter(bm =>
        bm.name?.toLowerCase().includes(q) ||
        bm.url?.toLowerCase().includes(q) ||
        bm.tags?.some(t => t.toLowerCase().includes(q))
      )
    : bookmarks;

  // Group by folder; preserve folder order
  const byFolder = {};
  filtered.forEach(bm => {
    if (!byFolder[bm.folderId]) byFolder[bm.folderId] = [];
    byFolder[bm.folderId].push(bm);
  });

  const activeFolders = folders.filter(f => byFolder[f.id]?.length);

  return React.createElement('div', { className: 'panel-root' },

    // Header
    React.createElement('header', { className: 'panel-header' },
      React.createElement('span', { className: 'panel-logo' },
        '1st', React.createElement('span', { className: 'panel-logo-dot' }, 'Tab')
      ),
    ),

    // Search
    React.createElement('div', { className: 'panel-search-wrap' },
      React.createElement('input', {
        type: 'search',
        className: 'panel-search',
        placeholder: 'Search bookmarks…',
        value: query,
        onChange: e => setQuery(e.target.value),
      })
    ),

    // Bookmark tree
    React.createElement('div', { className: 'panel-body' },
      activeFolders.length === 0
        ? React.createElement('p', { className: 'panel-empty' },
            q ? 'No bookmarks match your search.' : 'No bookmarks yet.'
          )
        : activeFolders.map(folder =>
            React.createElement(Folder, {
              key: folder.id,
              folder,
              bookmarks: byFolder[folder.id],
            })
          )
    ),

    // Footer
    React.createElement('div', { className: 'panel-footer' },
      `${filtered.length} bookmark${filtered.length !== 1 ? 's' : ''}`
    )
  );
}

ReactDOM.render(React.createElement(PanelApp), document.getElementById('root'));

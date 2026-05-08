// ============================
// Standalone bookmark manager page
// ============================
function ManagerPageApp() {
  const [folders, setFolders]     = useState(() => loadJSON(STORAGE_KEYS.folders, SEED_FOLDERS));
  const [bookmarks, setBookmarks] = useState(() => loadJSON(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS));
  const [activeFolderId, setActiveFolderId] = useState(() => folders[0]?.id || 'f-work');
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => saveJSON(STORAGE_KEYS.folders,   folders),   [folders]);
  useEffect(() => saveJSON(STORAGE_KEYS.bookmarks, bookmarks), [bookmarks]);

  // Read saved tweaks from localStorage and apply theme immediately
  const savedTweaks = useMemo(() => ({
    ...(window.__TWEAK_DEFAULTS || { mode: 'material-light' }),
    ...loadJSON('dash.tweaks', {}),
  }), []);
  const mode = savedTweaks.mode || 'material-light';

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    if (mode === 'arcade') {
      document.documentElement.setAttribute('data-arcade', savedTweaks.arcade || 'synthwave');
    } else {
      document.documentElement.removeAttribute('data-arcade');
    }
    const on = (mode === 'arcade') && (savedTweaks.scanlines !== false);
    document.documentElement.style.setProperty('--scan-on', on ? '1' : '0');

    // Apply saved background — same logic as app.jsx
    const prefs    = { ...DEFAULT_PREFS, ...loadJSON(STORAGE_KEYS.prefs, {}) };
    const bgUploads = loadJSON(STORAGE_KEYS.bgUploads, []);
    const upload   = bgUploads.find(u => u.id === prefs.bgId);
    const builtin  = BUILTIN_BACKGROUNDS.find(b => b.id === prefs.bgId);
    function setGlobalBg(css) {
      let el = document.getElementById('dash-bg-style');
      if (!el) { el = document.createElement('style'); el.id = 'dash-bg-style'; document.head.appendChild(el); }
      // :root:root:root body = specificity 0,3,1 — beats all theme overrides
      el.textContent = css ? `:root:root:root body { ${css} }` : '';
    }
    if (upload) {
      setGlobalBg(`background-image: url("${upload.url}") !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; background-repeat: no-repeat !important;`);
    } else if (builtin) {
      setGlobalBg(`background: ${builtin.value} !important; background-size: auto !important;`);
    } else {
      setGlobalBg('');
      document.body.setAttribute('data-bg', mode === 'arcade' ? (savedTweaks.background || 'floor') : 'solid');
    }
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(t => t === msg ? null : t), 1800);
  }

  function saveBookmark() {
    let { id, folderId, name, url, description, tags, pinned } = editingBookmark;
    name = (name||'').trim(); url = (url||'').trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const tagArr = Array.isArray(tags) ? tags : (tags||'').split(',').map(s => s.trim()).filter(Boolean);
    if (id) {
      setBookmarks(bookmarks.map(b => b.id === id
        ? { ...b, folderId, name, url, description, tags: tagArr, pinned: !!pinned } : b));
      showToast('Saved');
    } else {
      setBookmarks([...bookmarks, {
        id: uid(), folderId, name, url, description, tags: tagArr,
        pinned: !!pinned, visits: 0, lastVisited: Date.now(),
      }]);
      showToast('Bookmark added');
    }
    setEditingBookmark(null);
  }

  return (
    <div className="app">

      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot"></span>
          <div className="brand-text">
            {mode === 'arcade'
              ? <span className="brand-main">★ ARCADE NET ★</span>
              : <span className="brand-main">Dashboard</span>
            }
            <span className="brand-sub">Bookmark Manager</span>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="btn text" href="newtab.html">← Dashboard</a>
        </div>
      </header>

      {/* ── FULL-PAGE MANAGER ── */}
      <BookmarkManager
        folders={folders} setFolders={setFolders}
        bookmarks={bookmarks} setBookmarks={setBookmarks}
        activeFolderId={activeFolderId} setActiveFolderId={setActiveFolderId}
        onClose={() => { window.location.href = 'newtab.html'; }}
        onEditBookmark={(b) => setEditingBookmark({ ...b, tags: (b.tags||[]).join(', ') })}
        showToast={showToast}
        fullPage={true}
      />

      {editingBookmark && (
        <ManagerBookmarkDialog
          value={editingBookmark} folders={folders}
          onChange={setEditingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={saveBookmark}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// BookmarkDialog for the manager page (same as in app.jsx)
function ManagerBookmarkDialog({ value, folders, onChange, onClose, onSave }) {
  const v = value;
  const set = (k, val) => onChange({ ...v, [k]: val });
  return (
    <div className="modal-backdrop" style={{zIndex:1100}} onMouseDown={(e) => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:480}}>
        <div className="modal-head">
          <h2 className="modal-title">{v.id ? 'Edit bookmark' : 'New bookmark'}</h2>
          <button className="icon-btn" onClick={onClose}><Icon.close/></button>
        </div>
        <div className="form">
          <div className="field"><label>Name</label><input autoFocus value={v.name} onChange={e=>set('name',e.target.value)} placeholder="Project tracker"/></div>
          <div className="field"><label>URL</label><input value={v.url} onChange={e=>set('url',e.target.value)} placeholder="https://example.com"/></div>
          <div className="field"><label>Description (optional)</label>
            <textarea value={v.description||''} onChange={e=>set('description',e.target.value)} placeholder="Why you saved this…" rows={3}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field" style={{margin:0}}><label>Folder</label>
              <select value={v.folderId} onChange={e=>set('folderId',e.target.value)}>
                {folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="field" style={{margin:0}}><label>Tags (comma-separated)</label>
              <input value={Array.isArray(v.tags)?v.tags.join(', '):(v.tags||'')} onChange={e=>set('tags',e.target.value)} placeholder="daily, news"/>
            </div>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:8,marginTop:6,fontSize:13,color:'var(--text-2)'}}>
            <input type="checkbox" checked={!!v.pinned} onChange={e=>set('pinned',e.target.checked)}/> Pin to top
          </label>
        </div>
        <div className="modal-footer" style={{justifyContent:'flex-end',gap:8}}>
          <button className="btn text" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ManagerPageApp/>);

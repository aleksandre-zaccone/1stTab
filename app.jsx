// ============================
// Background helper — injects a <style> tag that wins over all !important rules
// ============================
function setGlobalBg(css) {
  let el = document.getElementById('dash-bg-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'dash-bg-style';
    document.head.appendChild(el);
  }
  // :root:root body has same specificity as :root[data-mode] body (0,2,1)
  // but our injected <style> appears later in DOM → wins when !important + same specificity
  el.textContent = css ? `:root:root body { ${css} }` : '';
}

// ============================
// App shell
// ============================
function useTheme(prefTheme) {
  useEffect(() => {
    const apply = () => {
      let mode = prefTheme;
      if (mode === 'auto') mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', mode);
    };
    apply();
    if (prefTheme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [prefTheme]);
}

function greetingFor(now) {
  const h = now.getHours();
  if (h < 5)  return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function App() {
  const [folders, setFolders]     = useState(() => loadJSON(STORAGE_KEYS.folders, SEED_FOLDERS));
  const [bookmarks, setBookmarks] = useState(() => loadJSON(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS));
  const [zones, setZones]         = useState(() => loadJSON(STORAGE_KEYS.zones, defaultZones()));
  const [prefs, setPrefs]         = useState(() => ({ ...DEFAULT_PREFS, ...loadJSON(STORAGE_KEYS.prefs, {}) }));
  const [activeFolderId, setActiveFolderId] = useState('f-all');
  const [view, setView]           = useState(() => loadJSON('dash.view', 'grid'));
  const [editingZones, setEditingZones]       = useState(false);
  const [editingCity, setEditingCity]         = useState(false);
  const [editingName, setEditingName]         = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [settingsOpen, setSettingsOpen]       = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => saveJSON(STORAGE_KEYS.folders,   folders),   [folders]);
  useEffect(() => saveJSON(STORAGE_KEYS.bookmarks, bookmarks), [bookmarks]);
  useEffect(() => saveJSON(STORAGE_KEYS.zones,     zones),     [zones]);
  useEffect(() => saveJSON(STORAGE_KEYS.prefs,     prefs),     [prefs]);
  useEffect(() => saveJSON('dash.view',             view),      [view]);

  const initTweaks = {
    ...(window.__TWEAK_DEFAULTS || { mode: 'material-light', background: 'floor', arcade: 'pacmaze', scanlines: true }),
    ...loadJSON('dash.tweaks', {}),
  };
  const [tweaks, setTweak] = useTweaks(initTweaks);
  const mode = tweaks.mode || 'material-light';

  useEffect(() => saveJSON('dash.tweaks', tweaks), [tweaks]);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    if (mode === 'arcade') {
      document.documentElement.setAttribute('data-arcade', tweaks.arcade || 'synthwave');
    } else {
      document.documentElement.removeAttribute('data-arcade');
    }
  }, [mode, tweaks.arcade]);

  useEffect(() => {
    const uploads = prefs.bgUploads || [];
    const upload  = uploads.find(u => u.id === prefs.bgId);
    const builtin = BUILTIN_BACKGROUNDS.find(b => b.id === prefs.bgId);

    if (upload) {
      setGlobalBg(`background: url("${upload.url}") center/cover fixed no-repeat !important;`);
      document.body.setAttribute('data-bg', 'custom');
    } else if (builtin) {
      setGlobalBg(`background: ${builtin.value} !important; background-size: auto !important;`);
      document.body.setAttribute('data-bg', builtin.id);
    } else {
      setGlobalBg('');
      document.body.setAttribute('data-bg', mode === 'arcade' ? (tweaks.background || 'floor') : 'solid');
    }
  }, [mode, tweaks.background, prefs.bgId, prefs.bgUploads]);

  useEffect(() => {
    const on = (mode === 'arcade') && (tweaks.scanlines !== false);
    document.documentElement.style.setProperty('--scan-on', on ? '1' : '0');
  }, [mode, tweaks.scanlines]);

  useTheme(prefs.theme);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(t => t === msg ? null : t), 1800);
  }
  function toggleUnits() { setPrefs({ ...prefs, units: prefs.units === 'F' ? 'C' : 'F' }); }

  function openBookmark(b) {
    setBookmarks(bookmarks.map(x => x.id === b.id ? { ...x, lastVisited: Date.now() } : x));
    window.open(b.url, '_blank', 'noreferrer');
  }
  function startQuickAdd() {
    const folderId = activeFolderId === 'f-all' ? (folders[0]?.id || 'f-work') : activeFolderId;
    setEditingBookmark({ folderId, name: '', url: '', description: '', tags: [], pinned: false });
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

  function onSearchSubmit(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    const url = /^https?:\/\//i.test(q) ? q
      : q.includes('.') && !q.includes(' ') ? 'https://' + q
      : 'https://www.google.com/search?q=' + encodeURIComponent(q);
    window.open(url, '_blank', 'noreferrer');
  }

  const now = useNow(60000);

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
            <span className="brand-sub">
              {greetingFor(now)},{' '}
              <span className="brand-name" onClick={() => setEditingName(true)} title="Click to change">{prefs.name}</span>
              {' · '}
              {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}
            </span>
          </div>
        </div>

        <form className="topbar-search" onSubmit={onSearchSubmit}>
          <Icon.search size={18}/>
          <input
            name="q"
            placeholder={mode === 'arcade' ? 'SEARCH OR ENTER URL' : 'Search Google or enter URL'}
            autoComplete="off"
          />
          <span className="search-engine">{mode === 'arcade' ? '↵ GO' : '↵'}</span>
        </form>

        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings" title="Settings">
            <Icon.settings size={20}/>
          </button>
          <a className="icon-btn" href="manager.html" aria-label="Manage bookmarks" title="Manage bookmarks">
            <Icon.folder size={20}/>
          </a>
        </div>
      </header>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="main-layout">
        <aside className="sidebar sidebar-left">
          <ClocksPanel zones={zones} onEditZones={() => setEditingZones(true)}/>
        </aside>

        <main className="main-content">
          <BookmarksHero
            folders={folders}
            bookmarks={bookmarks}
            activeFolderId={activeFolderId}
            setActiveFolderId={setActiveFolderId}
            view={view}
            setView={setView}
            onOpenManager={() => { window.location.href = 'manager.html'; }}
            onAddQuick={startQuickAdd}
            onOpenBookmark={openBookmark}
          />
        </main>

        <aside className="sidebar sidebar-right">
          <WeatherPanel
            city={prefs.weatherCity}
            units={prefs.units}
            onToggleUnits={toggleUnits}
            onEditCity={() => setEditingCity(true)}
          />
        </aside>
      </div>

      <footer className="foot">
        {mode === 'arcade'
          ? `★ ${bookmarks.length} BOOKMARKS · ${folders.length} FOLDERS · STORED LOCALLY ★`
          : `${bookmarks.length} bookmarks · ${folders.length} folders · stored locally`
        }
      </footer>

      {/* ── DIALOGS ── */}
      {editingBookmark && (
        <BookmarkDialog
          value={editingBookmark} folders={folders}
          onChange={setEditingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={saveBookmark}
        />
      )}
      {editingZones && (
        <ZonesDialog zones={zones} setZones={setZones} onClose={() => setEditingZones(false)}/>
      )}
      {editingCity && (
        <EditDialog title="Weather location" onClose={() => setEditingCity(false)} onSave={() => setEditingCity(false)}>
          <div className="field">
            <label>City</label>
            <input autoFocus value={prefs.weatherCity} onChange={e => setPrefs({...prefs, weatherCity: e.target.value})}/>
          </div>
          <p style={{fontSize:12, color:'var(--text-3)', margin:0}}>Uses mock data — any city name is shown verbatim.</p>
        </EditDialog>
      )}
      {editingName && (
        <EditDialog title="Your name" onClose={() => setEditingName(false)} onSave={() => setEditingName(false)}>
          <div className="field">
            <label>Display name</label>
            <input autoFocus value={prefs.name} onChange={e => setPrefs({...prefs, name: e.target.value})}/>
          </div>
        </EditDialog>
      )}
      {settingsOpen && (
        <SettingsDialog tweaks={tweaks} setTweak={setTweak} prefs={prefs} setPrefs={setPrefs} onClose={() => setSettingsOpen(false)}/>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Mode"/>
        <TweakRadio label="Theme" value={mode} onChange={(v) => setTweak('mode', v)}
          options={[
            { value: 'material-light', label: 'Light' },
            { value: 'material-dark',  label: 'Dark' },
            { value: 'arcade',         label: 'Arcade' },
          ]}
        />
        {mode === 'arcade' && (<>
          <TweakSection label="Arcade Cabinet"/>
          <TweakSelect label="Style" value={tweaks.arcade || 'synthwave'} onChange={(v) => setTweak('arcade', v)}
            options={[
              { value: 'synthwave', label: 'Synthwave (pink/cyan)' },
              { value: 'pacmaze',   label: 'Pac-Maze (yellow/blue)' },
              { value: 'gameboy',   label: 'Game Boy (4-shade green)' },
              { value: 'galaga',    label: 'Galaga (deep space)' },
              { value: 'tron',      label: 'Tron (cyan/orange)' },
              { value: 'hotlava',   label: 'Hot Lava (red/orange)' },
            ]}
          />
          <TweakSection label="Background"/>
          <TweakRadio label="Style" value={tweaks.background || 'floor'} onChange={(v) => setTweak('background', v)}
            options={[
              { value: 'solid', label: 'Solid' }, { value: 'gradient', label: 'Glow' },
              { value: 'grid',  label: 'Grid'  }, { value: 'floor',    label: 'Floor' },
              { value: 'dotted', label: 'Dots' },
            ]}
          />
          <TweakSection label="CRT"/>
          <TweakToggle label="Scanlines + vignette" value={tweaks.scanlines !== false} onChange={(v) => setTweak('scanlines', v)}/>
        </>)}
      </TweaksPanel>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ===== Bookmark dialog =====
function BookmarkDialog({ value, folders, onChange, onClose, onSave }) {
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
          <div className="field"><label>Description (optional)</label><textarea value={v.description||''} onChange={e=>set('description',e.target.value)} placeholder="Why you saved this…" rows={3}/></div>
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

// ===== Zones dialog =====
const COMMON_ZONES = [
  'America/Los_Angeles','America/Denver','America/Chicago','America/New_York','America/Toronto','America/Sao_Paulo',
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid','Europe/Athens','Europe/Moscow',
  'Africa/Lagos','Africa/Cairo','Asia/Dubai','Asia/Karachi','Asia/Kolkata','Asia/Bangkok','Asia/Singapore','Asia/Shanghai','Asia/Tokyo','Asia/Seoul',
  'Australia/Sydney','Pacific/Auckland','Pacific/Honolulu',
];
function ZonesDialog({ zones, setZones, onClose }) {
  const [list, setList] = useState(zones);
  const update = (i, patch) => setList(list.map((z,idx) => idx===i ? {...z,...patch} : z));
  const save   = () => { setZones(list); onClose(); };
  const add    = () => {
    if (list.length >= 3) return;
    setList([...list, { id:'z-'+Math.random().toString(36).slice(2,6), label:'Custom', tz:'Europe/London' }]);
  };
  const remove = (i) => { if (i===0) return; setList(list.filter((_,idx)=>idx!==i)); };
  return (
    <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:480}}>
        <div className="modal-head"><h2 className="modal-title">Time zones</h2><button className="icon-btn" onClick={onClose}><Icon.close/></button></div>
        <div className="form">
          {list.map((z,i) => (
            <div key={z.id} style={{display:'grid',gridTemplateColumns:'1fr 1.4fr auto',gap:8,marginBottom:10,alignItems:'end'}}>
              <div className="field" style={{margin:0}}><label>{i===0?'Primary label':'Label'}</label>
                <input value={z.label} onChange={e=>update(i,{label:e.target.value})}/>
              </div>
              <div className="field" style={{margin:0}}><label>Time zone</label>
                <select value={z.tz} onChange={e=>update(i,{tz:e.target.value})}>
                  {[z.tz,...COMMON_ZONES.filter(t=>t!==z.tz)].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button className="icon-btn" onClick={()=>remove(i)} disabled={i===0}
                style={{opacity:i===0?.3:1,marginBottom:2}} aria-label="Remove"><Icon.trash size={16}/></button>
            </div>
          ))}
          {list.length < 3 && <button className="btn text" onClick={add}><Icon.plus size={14}/> Add another</button>}
        </div>
        <div className="modal-footer" style={{justifyContent:'flex-end',gap:8}}>
          <button className="btn text" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ===== Settings dialog =====
function SettingsDialog({ tweaks, setTweak, prefs, setPrefs, onClose }) {
  const mode = tweaks.mode || 'material-light';
  const isArcade = mode === 'arcade';
  const bgInputRef = useRef(null);

  function handleBgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploads = prefs.bgUploads || [];
    if (uploads.length >= 5) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 1920, MAX_H = 1080;
        let w = img.width, h = img.height;
        if (w > MAX_W || h > MAX_H) {
          const r = Math.min(MAX_W / w, MAX_H / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const url = canvas.toDataURL('image/jpeg', 0.82);
        const id = 'upload-' + Date.now();
        const label = file.name.replace(/\.[^.]+$/, '').slice(0, 14) || 'Photo';
        setPrefs(p => ({
          ...p,
          bgUploads: [...(p.bgUploads || []), { id, label, url }],
          bgId: id,
        }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeUpload(id) {
    const newUploads = (prefs.bgUploads || []).filter(u => u.id !== id);
    const newBgId = prefs.bgId === id ? 'bg-dark' : prefs.bgId;
    setPrefs({ ...prefs, bgUploads: newUploads, bgId: newBgId });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <div className="modal-head"><h2 className="modal-title">Settings</h2><button className="icon-btn" onClick={onClose}><Icon.close/></button></div>
        <div className="form" style={{maxHeight:'70vh',overflow:'auto'}}>
          <div className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <div className="field"><label>Theme</label>
              <div className="seg-group">
                {[{v:'material-light',l:'Light'},{v:'material-dark',l:'Dark'},{v:'arcade',l:'Arcade'}].map(o=>(
                  <button key={o.v} className={'seg-btn'+(mode===o.v?' active':'')} onClick={()=>setTweak('mode',o.v)}>{o.l}</button>
                ))}
              </div>
            </div>
            {isArcade && (<>
              <div className="field"><label>Arcade cabinet</label>
                <select value={tweaks.arcade||'synthwave'} onChange={e=>setTweak('arcade',e.target.value)}>
                  <option value="synthwave">Synthwave (pink/cyan)</option>
                  <option value="pacmaze">Pac-Maze (yellow/blue)</option>
                  <option value="gameboy">Game Boy (4-shade green)</option>
                  <option value="galaga">Galaga (deep space)</option>
                  <option value="tron">Tron (cyan/orange)</option>
                  <option value="hotlava">Hot Lava (red/orange)</option>
                </select>
              </div>
              <div className="field"><label>Background</label>
                <div className="seg-group">
                  {[{v:'solid',l:'Solid'},{v:'gradient',l:'Glow'},{v:'grid',l:'Grid'},{v:'floor',l:'Floor'},{v:'dotted',l:'Dots'}].map(o=>(
                    <button key={o.v} className={'seg-btn'+((tweaks.background||'floor')===o.v?' active':'')} onClick={()=>setTweak('background',o.v)}>{o.l}</button>
                  ))}
                </div>
              </div>
              <label className="settings-toggle">
                <input type="checkbox" checked={tweaks.scanlines!==false} onChange={e=>setTweak('scanlines',e.target.checked)}/>
                <span>CRT scanlines + vignette</span>
              </label>
            </>)}
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">Background</h3>
            <div className="bg-picker">
              {/* Built-in backgrounds */}
              {BUILTIN_BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  className={'bg-thumb' + (prefs.bgId === bg.id ? ' active' : '')}
                  onClick={() => setPrefs({ ...prefs, bgId: bg.id })}
                  title={bg.label}
                >
                  <span className="bg-thumb-img" style={{background: bg.value}}/>
                  <span className="bg-thumb-label">{bg.label}</span>
                  {prefs.bgId === bg.id && <span className="bg-check">✓</span>}
                </button>
              ))}

              {/* Uploaded backgrounds */}
              {(prefs.bgUploads || []).map(up => (
                <button
                  key={up.id}
                  className={'bg-thumb' + (prefs.bgId === up.id ? ' active' : '')}
                  onClick={() => setPrefs({ ...prefs, bgId: up.id })}
                  title={up.label}
                >
                  <span className="bg-thumb-img" style={{backgroundImage:`url("${up.url}")`,backgroundSize:'cover',backgroundPosition:'center'}}/>
                  <span className="bg-thumb-label">{up.label}</span>
                  {prefs.bgId === up.id && <span className="bg-check">✓</span>}
                  <span className="bg-thumb-del" onClick={e => { e.stopPropagation(); removeUpload(up.id); }} title="Remove">×</span>
                </button>
              ))}

              {/* Upload slot — shown while < 5 uploads */}
              {(prefs.bgUploads || []).length < 5 && (
                <button className="bg-thumb bg-thumb-add" onClick={() => bgInputRef.current?.click()} title="Upload image">
                  <span className="bg-thumb-img bg-thumb-add-icon">
                    <Icon.upload size={20}/>
                  </span>
                  <span className="bg-thumb-label">Upload</span>
                </button>
              )}

              <input ref={bgInputRef} type="file" accept="image/*" hidden onChange={handleBgUpload}/>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Profile</h3>
            <div className="field"><label>Display name</label><input value={prefs.name} onChange={e=>setPrefs({...prefs,name:e.target.value})}/></div>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">Weather</h3>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
              <div className="field" style={{margin:0}}><label>City</label><input value={prefs.weatherCity} onChange={e=>setPrefs({...prefs,weatherCity:e.target.value})}/></div>
              <div className="field" style={{margin:0}}><label>Units</label>
                <div className="seg-group">
                  <button className={'seg-btn'+(prefs.units==='F'?' active':'')} onClick={()=>setPrefs({...prefs,units:'F'})}>°F</button>
                  <button className={'seg-btn'+(prefs.units==='C'?' active':'')} onClick={()=>setPrefs({...prefs,units:'C'})}>°C</button>
                </div>
              </div>
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">Search</h3>
            <p className="settings-help">Uses <strong>Google</strong>. Type a query to search, or paste a URL to open directly.</p>
          </div>
        </div>
        <div className="modal-footer" style={{justifyContent:'flex-end'}}><button className="btn primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

// EditDialog is defined in manager.jsx (loaded before app.jsx)
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

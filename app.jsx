var { useState, useEffect, useMemo, useCallback, useRef } = React;

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
  // :root:root:root body = specificity 0,3,1 — beats every theme rule in dashboard.css
  // and wins on source order since this <style> is appended after the <link> stylesheet
  el.textContent = css ? `:root:root:root body { ${css} }` : '';
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
  const greetings = {
    late:   ['Working late', 'Burning the midnight oil', 'Night owl mode', 'Still at it?'],
    early:  ['Rise and shine', 'Early bird catches the worm', 'Good morning', 'Ready for the day?'],
    morning:['Good morning', 'Have a productive morning', 'Morning, friend', 'Top of the morning'],
    midday: ['Good afternoon', 'Keep up the momentum', 'Doing great', 'Midday focus'],
    evening:['Good evening', 'Winding down', 'Evening, friend', 'Time to relax'],
  };

  let group = 'evening';
  if (h < 5)  group = 'late';
  else if (h < 9)  group = 'early';
  else if (h < 12) group = 'morning';
  else if (h < 18) group = 'midday';

  const list = greetings[group];
  // Simple deterministic pick based on the hour and day so it doesn't change on every re-render
  const seed = h + now.getDate();
  return list[seed % list.length];
}

function App() {
  const [folders, setFolders]       = window.useStorage(STORAGE_KEYS.folders, SEED_FOLDERS, false);
  const [bookmarks, setBookmarks]   = window.useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS, false);
  const [zones, setZones]           = window.useStorage(STORAGE_KEYS.zones, defaultZones(), true);
  const [prefsRaw, setPrefsRaw]     = window.useStorage(STORAGE_KEYS.prefs, {}, true);
  const [bgUploads, setBgUploads]   = window.useStorage(STORAGE_KEYS.bgUploads, [], false);
  const [activeFolderId, setActiveFolderId] = useState('f-all');
  const [view, setView]             = window.useStorage('dash.view', 'grid', true);
  const [editingZones, setEditingZones]       = useState(false);
  const [editingCity, setEditingCity]         = useState(false);
  const [editingName, setEditingName]         = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [settingsOpen, setSettingsOpen]       = useState(false);
  const [toast, setToast] = useState(null);

  const prefs = { ...DEFAULT_PREFS, ...prefsRaw };
  const setPrefs = useCallback((newVal) => {
    setPrefsRaw(prevRaw => {
      const merged = { ...DEFAULT_PREFS, ...prevRaw };
      return typeof newVal === 'function' ? newVal(merged) : newVal;
    });
  }, [setPrefsRaw]);

  const initTweaks = {
    ...(window.__TWEAK_DEFAULTS || { mode: 'material-light', background: 'floor', arcade: 'pacmaze', scanlines: true }),
    ...loadJSON('dash.tweaks', {}),
  };
  const [tweaks, setTweak] = useTweaks(initTweaks);
  const mode = tweaks.mode || 'material-light';

  // tweaks are now handled by useStorage inside useTweaks

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    if (mode === 'arcade') {
      document.documentElement.setAttribute('data-arcade', tweaks.arcade || 'synthwave');
    } else {
      document.documentElement.removeAttribute('data-arcade');
    }
  }, [mode, tweaks.arcade]);

  useEffect(() => {
    const upload  = bgUploads.find(u => u.id === prefs.bgId);
    const builtin = BUILTIN_BACKGROUNDS.find(b => b.id === prefs.bgId);

    if (upload) {
      setGlobalBg(`background-image: url("${upload.url}") !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; background-repeat: no-repeat !important;`);
      document.body.setAttribute('data-bg', 'custom');
    } else if (builtin) {
      setGlobalBg(`background: ${builtin.value} !important; background-size: auto !important;`);
      document.body.setAttribute('data-bg', builtin.id);
    } else {
      setGlobalBg('');
      document.body.setAttribute('data-bg', mode === 'arcade' ? (tweaks.background || 'floor') : 'solid');
    }
  }, [mode, tweaks.background, prefs.bgId, bgUploads]);

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
  const searchRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(prev => !prev);
      }
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function onSearchSubmit(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    const isUrl = /^https?:\/\//i.test(q) || (q.includes('.') && !q.includes(' '));
    if (isUrl) {
      window.open(/^https?:\/\//i.test(q) ? q : 'https://' + q, '_blank', 'noreferrer');
      return;
    }
    
    let searchUrl = 'https://www.google.com/search?q=';
    if (prefs.searchEngine === 'duckduckgo') searchUrl = 'https://duckduckgo.com/?q=';
    else if (prefs.searchEngine === 'bing') searchUrl = 'https://www.bing.com/search?q=';
    else if (prefs.searchEngine === 'brave') searchUrl = 'https://search.brave.com/search?q=';
    
    window.open(searchUrl + encodeURIComponent(q), '_blank', 'noreferrer');
  }

  const now = (window.useNow || useNow)(60000);

  const fontUrl = useMemo(() => {
    if (!prefs.fontFamily || prefs.fontFamily === 'default') return null;
    const fonts = {
      'Inter': 'Inter:wght@400;500;700',
      'Roboto': 'Roboto:wght@400;500;700',
      'Outfit': 'Outfit:wght@400;500;700',
      'VT323': 'VT323',
    };
    if (fonts[prefs.fontFamily]) {
      return `https://fonts.googleapis.com/css2?family=${fonts[prefs.fontFamily]}&display=swap`;
    }
    return null;
  }, [prefs.fontFamily]);

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      {prefs.fontFamily && prefs.fontFamily !== 'default' && (
        <style dangerouslySetInnerHTML={{__html: `
          :root[data-mode="material-light"] body,
          :root[data-mode="material-dark"] body,
          body, .brand, .clock-time, .clock-label, .greeting, .greeting-sub, .clock-off, .btn {
            font-family: '${prefs.fontFamily}', sans-serif !important;
          }
        `}}/>
      )}
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
            ref={searchRef}
            name="q"
            placeholder={mode === 'arcade' ? 'SEARCH OR ENTER URL' : 'Search Google or enter URL'}
            autoComplete="off"
          />
          <span className="search-engine">{mode === 'arcade' ? '↵ GO' : '↵'}</span>
        </form>

        <div className="topbar-actions">
          <a className="icon-btn" href={chrome.runtime.getURL('settings.html')} aria-label="Settings" title="Settings">
            <Icon.settings size={20}/>
          </a>
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


      <QuoteWidget />

      <footer className="foot">
        {mode === 'arcade'
          ? `★ ${bookmarks.length} BOOKMARKS · ${folders.length} FOLDERS · STORED LOCALLY ★`
          : `${bookmarks.length} bookmarks · ${folders.length} folders · stored locally`
        }
      </footer>
    </div>

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
    </>
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
          <div style={{display:'grid',gridTemplateColumns:'48px 1fr',gap:12}}>
            <div className="field"><label>Icon</label><input value={v.emoji||''} onChange={e=>set('emoji',e.target.value)} maxLength={2} style={{textAlign:'center',padding:'0',fontSize:'16px'}} placeholder="⭐"/></div>
            <div className="field"><label>Name</label><input autoFocus value={v.name} onChange={e=>set('name',e.target.value)} placeholder="Project tracker"/></div>
          </div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

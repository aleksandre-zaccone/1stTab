var { useState, useMemo, useEffect, useCallback, useRef } = React;

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

function setGlobalBg(css) {
  let el = document.getElementById('dash-bg-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'dash-bg-style';
    document.head.appendChild(el);
  }
  el.textContent = css ? `:root:root:root body { ${css} }` : '';
}

function SettingsPage() {
  const [prefsRaw, setPrefsRaw]     = window.useStorage(window.STORAGE_KEYS.prefs, {}, true);
  const [bgUploads, setBgUploads]   = window.useStorage(window.STORAGE_KEYS.bgUploads, [], false);
  const initTweaks = {
    ...(window.__TWEAK_DEFAULTS || { mode: 'material-light', background: 'floor', arcade: 'pacmaze', scanlines: true }),
    ...window.loadJSON('dash.tweaks', {}),
  };
  const [tweaks, setTweak] = window.useTweaks(initTweaks);

  const prefs = { ...window.DEFAULT_PREFS, ...prefsRaw };
  const mode = tweaks.mode || 'material-light';

  useTheme(prefs.theme);

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
    const builtin = window.BUILTIN_BACKGROUNDS.find(b => b.id === prefs.bgId);

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
  const setPrefs = useCallback((newVal) => {
    setPrefsRaw(prevRaw => {
      const merged = { ...window.DEFAULT_PREFS, ...prevRaw };
      return typeof newVal === 'function' ? newVal(merged) : newVal;
    });
  }, [setPrefsRaw]);

  const isArcade = mode === 'arcade';
  const bgInputRef = useRef(null);
  const importRef = useRef(null);

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (window.confirm("Are you sure? This will overwrite your current settings and bookmarks.")) {
        window.importAllData(ev.target.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleBgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgUploads.length >= 5) return;
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
        setBgUploads(prev => [...prev, { id, label, url }]);
        setPrefs(p => ({ ...p, bgId: id }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeUpload(id) {
    setBgUploads(prev => prev.filter(u => u.id !== id));
    if (prefs.bgId === id) setPrefs({ ...prefs, bgId: 'bg-dark' });
  }

  return (
    <div className="settings-container">
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <a href="newtab.html" className="btn primary">Back to Dashboard</a>
      </header>

      <div className="form">
        <div className="settings-section">
          <h3 className="settings-section-title">Keyboard Shortcuts</h3>
          <div className="shortcut-grid">
            <span className="kbd">/</span> <span>Focus Search Bar</span>
            <span className="kbd">Ctrl + K</span> <span>Focus Search Bar</span>
            <span className="kbd">Ctrl + ,</span> <span>Open Settings (this page)</span>
            <span className="kbd">Esc</span> <span>Close Dialogs</span>
          </div>
        </div>

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
            {window.BUILTIN_BACKGROUNDS.map(bg => (
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
            {(bgUploads || []).map(up => (
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
            {(bgUploads || []).length < 5 && (
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
          <h3 className="settings-section-title">Typography</h3>
          <div className="field">
            <label>Font Family</label>
            <select value={prefs.fontFamily || 'default'} onChange={e => setPrefs({...prefs, fontFamily: e.target.value})}>
              <option value="default">System Default</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="VT323">VT323 (Retro)</option>
            </select>
          </div>
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
          <h3 className="settings-section-title">Search Engine</h3>
          <div className="field">
            <select value={prefs.searchEngine || 'google'} onChange={e => setPrefs({...prefs, searchEngine: e.target.value})}>
              <option value="google">Google</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="bing">Bing</option>
              <option value="brave">Brave</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Data & Sync</h3>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button className="btn text" onClick={() => window.exportAllData()}>Export Backup</button>
            <button className="btn text" onClick={() => importRef.current?.click()}>Import Backup</button>
            <input ref={importRef} type="file" accept=".json" hidden onChange={handleImport}/>
            <button className="btn text" onClick={() => window.importChromeBookmarks()}>Import Chrome Bookmarks</button>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SettingsPage />);
r(<SettingsPage />);

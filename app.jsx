var { useState, useEffect, useMemo, useCallback, useRef } = React;

/**
 * App shell
 */
function useTheme(prefTheme, arcadeGame) {
  useEffect(() => {
    const apply = () => {
      let mode = prefTheme || 'light';
      document.documentElement.setAttribute('data-theme', mode);
      if (mode === 'arcade' && arcadeGame) {
        document.documentElement.setAttribute('data-arcade-game', arcadeGame);
      } else {
        document.documentElement.removeAttribute('data-arcade-game');
      }
    };
    apply();
  }, [prefTheme, arcadeGame]);
}

function greetingFor(now, name, templates) {
  const h = now.getHours();
  let timeOfDay = 'evening';
  if (h < 5)       timeOfDay = 'night';
  else if (h < 12) timeOfDay = 'morning';
  else if (h < 18) timeOfDay = 'afternoon';

  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const safeName = name || 'Friend';

  if (Array.isArray(templates) && templates.length > 0) {
    const valid = templates.map(s => (s || '').trim()).filter(Boolean);
    if (valid.length) {
      // Deterministic pick per hour so it doesn't change every render
      const idx = (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate() + h) % valid.length;
      return valid[idx]
        .replace(/\{name\}/g, safeName)
        .replace(/\{day\}/g, day)
        .replace(/\{time\}/g, timeOfDay);
    }
  }

  const lead = timeOfDay === 'night' ? 'Still up' : ('Good ' + timeOfDay);
  return `${lead}, ${safeName}`;
}

function renderRail(active, setPrimary) {
  return (
    <nav className="side-rail">
      <a href="newtab.html" className="rail-brand" title="1stTab">1</a>
      <button className={"rail-item" + (active === "bookmarks" ? " active" : "")} onClick={() => setPrimary("bookmarks")} title="Bookmarks">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v16l-6-4-6 4z"/></svg>
        <span className="rail-lbl">Saved</span>
      </button>
      <button className={"rail-item" + (active === "reader" ? " active" : "")} onClick={() => setPrimary("reader")} title="RSS Reader">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14"/><circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        <span className="rail-lbl">Reader</span>
      </button>
      <div className="rail-spacer"></div>
      <a href="settings.html" className="rail-item" title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8M4.6 9a1.6 1.6 0 0 0-.3-1.8M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>
      </a>
    </nav>
  );
}

function App() {
  const [name, setName] = useState('Friend');
  const [theme, setTheme] = useState('light');
  const [arcadeGame, setArcadeGame] = useState('pacman');
  const [widgets, setWidgets] = useState({ left: ['time', 'notes'], right: ['weather', 'todo', 'finance'] });
  const [searchQ, setSearchQ] = useState('');
  const [greetings, setGreetings] = useState([]);
  const [dragState, setDragState] = useState(null); // { id, fromCol }
  const [dropHint, setDropHint] = useState(null);   // { col, index }
  const [focusMode, setFocusMode] = useState(false);
  const [searchHits, setSearchHits] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSel, setSearchSel] = useState(0);
  const searchInputRef = useRef(null);

  const [primaryView, setPrimaryView] = useState("bookmarks");
  const setPrimary = useCallback((v) => {
    setPrimaryView(v);
    window.setStorage("nt.primaryView", v);
  }, []);

  // Custom hook for now
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Load initial storage
  useEffect(() => {
    window.getStorage(window.STORAGE_KEYS.name, 'Friend').then(setName);
    window.getStorage(window.STORAGE_KEYS.theme, 'light').then(setTheme);
    window.getStorage(window.STORAGE_KEYS.arcadeGame, 'pacman').then(setArcadeGame);
    window.getStorage(window.STORAGE_KEYS.widgets, { left: ['time', 'notes'], right: ['weather', 'todo'] }).then(setWidgets);
    window.getStorage(window.STORAGE_KEYS.greetings, []).then(setGreetings);
    window.getStorage("nt.primaryView", "bookmarks").then(setPrimaryView);
  }, []);

  // Live updates from storage (custom CSS, greetings, widget layout)
  useEffect(() => {
    if (!chrome?.storage?.onChanged) return;
    const handler = (changes) => {
      if (changes[window.STORAGE_KEYS.greetings]) {
        setGreetings(changes[window.STORAGE_KEYS.greetings].newValue || []);
      }
      if (changes[window.STORAGE_KEYS.widgets]) {
        setWidgets(changes[window.STORAGE_KEYS.widgets].newValue || { left: [], right: [] });
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Inject Custom CSS as a <style> tag, reactively
  useEffect(() => {
    let styleEl = document.getElementById('user-custom-css');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'user-custom-css';
      document.head.appendChild(styleEl);
    }
    const apply = (css) => { styleEl.textContent = css || ''; };
    window.getStorage(window.STORAGE_KEYS.customCSS, '').then(apply);
    if (!chrome?.storage?.onChanged) return;
    const handler = (changes) => {
      if (changes[window.STORAGE_KEYS.customCSS]) apply(changes[window.STORAGE_KEYS.customCSS].newValue || '');
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const persistWidgets = useCallback((next) => {
    setWidgets(next);
    window.setStorage(window.STORAGE_KEYS.widgets, next);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      // Esc: leave focus mode, close dropdowns
      if (e.key === 'Escape') {
        if (focusMode) { setFocusMode(false); e.preventDefault(); return; }
        if (searchOpen) { setSearchOpen(false); e.preventDefault(); return; }
        if (target && target.blur) target.blur();
        return;
      }
      // Ctrl/Cmd+,  → settings
      if (mod && e.key === ',') {
        e.preventDefault();
        window.location.href = 'settings.html';
        return;
      }
      // Ctrl/Cmd+K → focus search
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (inField) return;
      // /  → focus search
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      // F  → toggle focus mode
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFocusMode(v => !v);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, searchOpen]);

  // Live bookmark search dropdown
  useEffect(() => {
    const q = searchQ.trim();
    if (!q) { setSearchHits([]); setSearchOpen(false); return; }
    if (!chrome?.bookmarks?.search) return;
    let cancelled = false;
    chrome.bookmarks.search(q, (results) => {
      if (cancelled) return;
      const hits = (results || []).filter(r => r.url).slice(0, 8);
      setSearchHits(hits);
      setSearchOpen(hits.length > 0);
      setSearchSel(0);
    });
    return () => { cancelled = true; };
  }, [searchQ]);

  const handleDragStart = (e, id, fromCol) => {
    setDragState({ id, fromCol });
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch (_) {}
  };
  const handleDragEnd = () => { setDragState(null); setDropHint(null); };
  const handleDragOver = (e, col) => {
    if (!dragState) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const colItems = widgets[col] || [];
    const dropzone = e.currentTarget.closest('.dropzone');
    let index = colItems.length;
    if (dropzone) {
      const widgetEls = Array.from(dropzone.querySelectorAll('.widget:not(.dragging)'));
      for (let i = 0; i < widgetEls.length; i++) {
        const rect = widgetEls[i].getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (e.clientY < middleY) {
          index = i;
          break;
        }
      }
    }

    const { id, fromCol } = dragState;
    const sourceIdx = colItems.indexOf(id);
    // If hovering over itself or its native placement boundary, do not show a gap.
    if (fromCol === col && (index === sourceIdx || index === sourceIdx + 1)) {
      setDropHint(null);
    } else {
      setDropHint({ col, index });
    }
  };

  const handleDrop = (e, col) => {
    if (!dragState) return;
    e.preventDefault();
    const { id, fromCol } = dragState;

    const colItems = widgets[col] || [];
    const dropzone = e.currentTarget.closest('.dropzone');
    let index = colItems.length;
    if (dropzone) {
      const widgetEls = Array.from(dropzone.querySelectorAll('.widget:not(.dragging)'));
      for (let i = 0; i < widgetEls.length; i++) {
        const rect = widgetEls[i].getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (e.clientY < middleY) {
          index = i;
          break;
        }
      }
    }

    const next = { left: [...widgets.left], right: [...widgets.right] };
    const sourceIdx = next[fromCol].indexOf(id);
    if (sourceIdx !== -1) next[fromCol].splice(sourceIdx, 1);

    let insertAt = index;
    if (fromCol === col && sourceIdx !== -1 && sourceIdx < index) {
      insertAt = index - 1;
    }
    if (insertAt < 0) insertAt = 0;
    if (insertAt > next[col].length) insertAt = next[col].length;

    next[col].splice(insertAt, 0, id);
    persistWidgets(next);
    handleDragEnd();
  };

  useTheme(theme, arcadeGame);

  const openHit = (hit) => {
    if (!hit?.url) return;
    window.location.href = hit.url;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    // If a dropdown hit is highlighted, open it instead of web search
    if (searchOpen && searchHits[searchSel]) { openHit(searchHits[searchSel]); return; }
    window.getStorage(window.STORAGE_KEYS.searchEngine, 'google').then(engine => {
      const urls = {
        google: 'https://google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://bing.com/search?q=',
        brave: 'https://search.brave.com/search?q='
      };
      window.location.href = (urls[engine] || urls.google) + encodeURIComponent(searchQ);
    });
  };

  const onSearchKey = (e) => {
    if (!searchOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchSel(i => Math.min(i + 1, searchHits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchSel(i => Math.max(i - 1, 0)); }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : (theme === 'dark' ? 'arcade' : 'light');
    setTheme(next);
    window.setStorage(window.STORAGE_KEYS.theme, next);
  };

  const widgetFor = (id) => {
    switch(id) {
      case 'time':     return <window.ClocksWidget />;
      case 'notes':    return <window.NotesWidget />;
      case 'weather':  return <window.WeatherWidget />;
      case 'todo':     return <window.TodoWidget />;
      case 'pomodoro': return <window.PomodoroWidget />;
      case 'crypto':   return <window.CryptoWidget />;
      case 'fx':       return <window.FXWidget />;
      case 'history':  return <window.HistoryWidget />;
      case 'stocks':   return <window.StockWidget />;
      case 'quote':    return <window.QuoteWidget />;
      default: return null;
    }
  };

  const renderColumn = (col) => {
    const items = widgets[col] || [];
    const isHinted = dropHint && dropHint.col === col;
    const isDraggingActive = !!dragState;
    return (
      <div
        className={'dropzone col ' + col + '-col' + (isDraggingActive ? ' dropzone-active' : '') + (isHinted ? ' drag-over' : '')}
        onDragOver={(e) => handleDragOver(e, col)}
        onDrop={(e) => handleDrop(e, col)}
      >
        {items.map((id, idx) => (
          <React.Fragment key={id}>
            <div className={'drop-indicator' + (isHinted && dropHint.index === idx ? ' show' : '')} />
            <div
              className={'widget' + (dragState?.id === id ? ' dragging' : '')}
              draggable
              onDragStart={(e) => handleDragStart(e, id, col)}
              onDragEnd={handleDragEnd}
            >
              {widgetFor(id)}
            </div>
          </React.Fragment>
        ))}
        <div className={'drop-indicator' + (isHinted && dropHint.index === items.length ? ' show' : '')} />
        {items.length === 0 && <div className="dropzone-empty">Drop widget here</div>}
      </div>
    );
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('en-US', options);
    // Week number calculation
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    
    const [weekday, monthDay] = dateStr.split(', ');
    return (
      <span className="brand-sub">
        <b>{weekday}, {monthDay}</b> · Week {weekNum}
      </span>
    );
  };

  return (
    <>
      {renderRail(primaryView, setPrimary)}
      {primaryView === "reader" ? (
        <div className="app-reader">
          <window.ReaderApp />
        </div>
      ) : dashboardView()}
    </>
  );

  function dashboardView() {
    return (
      <div className={'app' + (focusMode ? ' focus-mode' : '')}>
        {focusMode && (
        <div className="focus-overlay" onClick={() => setFocusMode(false)}>
          <div className="focus-time">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
          <div className="focus-date">{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div className="focus-hint">Press <kbd>F</kbd> or click anywhere to exit</div>
        </div>
      )}
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot"></div>
          <div className="brand-text">
            <div className="brand-title">{greetingFor(now, name, greetings)}</div>
            {formatDate(now)}
          </div>
        </div>

        <div className="search-wrap">
          <form className="search" onSubmit={handleSearch}>
            <Icon.search size={16} style={{color: 'var(--text-mute)'}} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bookmarks or the web…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={onSearchKey}
              onFocus={() => searchHits.length > 0 && setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
            />
            <div className="kbd">⌘K</div>
          </form>
          {searchOpen && searchHits.length > 0 && (
            <div className="search-dropdown">
              {searchHits.map((h, i) => (
                <button
                  key={h.id}
                  className={'search-hit' + (i === searchSel ? ' active' : '')}
                  onMouseDown={(e) => { e.preventDefault(); openHit(h); }}
                  onMouseEnter={() => setSearchSel(i)}
                >
                  <img className="search-hit-fav" src={window.faviconUrl(h.url, 16)} alt="" onError={(e)=>{e.target.style.visibility='hidden';}} />
                  <div className="search-hit-text">
                    <div className="search-hit-title">{h.title || h.url}</div>
                    <div className="search-hit-host">{(() => { try { return new URL(h.url).hostname; } catch { return h.url; } })()}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="topbar-right" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Icon.sun size={20}/> : <Icon.moon size={20}/>}
          </button>
          <a href="manager.html" className="icon-btn" aria-label="Bookmarks">
            <Icon.folder size={20}/>
          </a>
          <a href="settings.html" className="icon-btn" aria-label="Settings">
            <Icon.settings size={20}/>
          </a>
        </div>
      </header>

      <div className="quote-subsearch">
        <window.QuoteWidget />
      </div>

      <main className={"main-grid" + (dragState ? " drag-active" : "")}>
        {renderColumn('left')}

        <div className="main-col">
          <window.BookmarksHero />
        </div>

        {renderColumn('right')}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-mute)'}}>
          Stored locally · 1stTab v1.0.0
        </div>
      </footer>
    </div>
    );
  }
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);

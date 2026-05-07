// ============================
// Bookmarks hero — list/grid views, rich metadata, inline search
// ============================
function BookmarksHero({
  folders, bookmarks, activeFolderId, setActiveFolderId,
  view, setView,                // 'grid' | 'list'
  onOpenManager, onAddQuick, onOpenBookmark,
}) {
  const [query, setQuery] = useState('');

  const isAll = activeFolderId === 'f-all';
  const folderItems = isAll ? bookmarks : bookmarks.filter(b => b.folderId === activeFolderId);
  const q = query.trim().toLowerCase();
  const items = !q ? folderItems : folderItems.filter(b =>
    b.name.toLowerCase().includes(q)
    || (b.description||'').toLowerCase().includes(q)
    || hostnameOf(b.url).toLowerCase().includes(q)
    || (b.tags||[]).some(t => t.toLowerCase().includes(q))
  );

  // Pinned float to top within each folder view
  const sorted = [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

  const pinnedAcrossAll = bookmarks.filter(b => b.pinned).slice(0, 6);

  return (
    <div className="hero-card">
      {/* HEADER */}
      <div className="hero-head">
        <div className="hero-title-row">
          <h2 className="hero-title">Bookmarks</h2>
          <span className="hero-count">{bookmarks.length} saved · {folders.length} folders</span>
        </div>

        <div className="hero-tools">
          <div className="search-input hero-search">
            <Icon.search size={16}/>
            <input
              placeholder="Search bookmarks, tags, sites…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="icon-btn" style={{width:24,height:24}} onClick={() => setQuery('')} aria-label="Clear">
                <Icon.close size={14}/>
              </button>
            )}
          </div>
          <div className="view-toggle" role="tablist" aria-label="View">
            <button
              className={"view-btn" + (view === 'grid' ? ' active' : '')}
              onClick={() => setView('grid')}
              title="Grid view" role="tab" aria-selected={view==='grid'}
            ><Icon.gridIcon size={16}/></button>
            <button
              className={"view-btn" + (view === 'list' ? ' active' : '')}
              onClick={() => setView('list')}
              title="List view" role="tab" aria-selected={view==='list'}
            ><Icon.listIcon size={16}/></button>
          </div>
          <button className="btn" onClick={onAddQuick}><Icon.plus size={14}/> Add</button>
          <button className="btn text" onClick={onOpenManager}><Icon.settings size={14}/> Manage</button>
        </div>
      </div>

      {/* PINNED STRIP */}
      {!query && pinnedAcrossAll.length > 0 && (
        <div className="pinned-strip">
          <div className="pinned-label">
            <Icon.pin size={11}/> <span>Pinned</span>
          </div>
          <div className="pinned-row">
            {pinnedAcrossAll.map(b => (
              <button key={b.id} className="pinned-tile" onClick={() => onOpenBookmark(b)} title={b.name}>
                <BookmarkFavicon url={b.url} name={b.name} size={28}/>
                <span className="pinned-name">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOLDER TABS */}
      <div className="hero-tabs" role="tablist">
        <button
          key="f-all"
          className={"hero-tab" + (isAll ? " active" : "")}
          onClick={() => setActiveFolderId('f-all')}
          role="tab"
          aria-selected={isAll}
        >
          <Icon.gridIcon size={14}/>
          <span>All</span>
          <span className="count">{bookmarks.length}</span>
        </button>
        {folders.map(f => {
          const count = bookmarks.filter(b => b.folderId === f.id).length;
          return (
            <button
              key={f.id}
              className={"hero-tab" + (f.id === activeFolderId ? " active" : "")}
              onClick={() => setActiveFolderId(f.id)}
              role="tab"
              aria-selected={f.id === activeFolderId}
            >
              <Icon.folder size={14}/>
              <span>{f.name}</span>
              <span className="count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* BODY */}
      {sorted.length === 0 ? (
        <div className="empty">
          {query ? `No matches for "${query}".` : 'No bookmarks in this folder yet.'}
          {!query && (
            <>
              {' '}
              <button className="btn text" onClick={onAddQuick} style={{padding:'0 6px'}}>Add one</button>
            </>
          )}
        </div>
      ) : view === 'grid' ? (
        <BookmarkGrid items={sorted} onOpen={onOpenBookmark}/>
      ) : (
        <BookmarkListView items={sorted} folders={folders} onOpen={onOpenBookmark}/>
      )}
    </div>
  );
}

// ----- Grid card -----
function BookmarkGrid({ items, onOpen }) {
  return (
    <div className="bm-grid">
      {items.map(b => (
        <button key={b.id} className="bm-card" onClick={() => onOpen(b)}>
          <div className="bm-card-head">
            <BookmarkFavicon url={b.url} name={b.name} size={32}/>
            {b.pinned && <span className="bm-pin"><Icon.pin size={10}/></span>}
          </div>
          <div className="bm-card-name">{b.name}</div>
          <div className="bm-card-host">{hostnameOf(b.url)}</div>
          {b.description && (
            <div className="bm-card-desc">{b.description}</div>
          )}
          <div className="bm-card-foot">
            <div className="bm-tags">
              {(b.tags || []).slice(0, 3).map(t => (
                <span key={t} className="bm-tag">#{t}</span>
              ))}
            </div>
            <span className="bm-time">{relativeTime(b.lastVisited)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ----- List row -----
function BookmarkListView({ items, folders, onOpen }) {
  const folderName = (id) => folders.find(f => f.id === id)?.name || '';
  return (
    <div className="bm-list">
      {items.map(b => (
        <button key={b.id} className="bm-list-row" onClick={() => onOpen(b)}>
          <BookmarkFavicon url={b.url} name={b.name} size={36}/>
          <div className="bm-list-main">
            <div className="bm-list-name-row">
              <span className="bm-list-name">{b.name}</span>
              {b.pinned && <span className="bm-pin inline"><Icon.pin size={10}/></span>}
              {(b.tags || []).slice(0, 4).map(t => (
                <span key={t} className="bm-tag">#{t}</span>
              ))}
            </div>
            {b.description && <div className="bm-list-desc">{b.description}</div>}
            <div className="bm-list-host">{hostnameOf(b.url)}</div>
          </div>
          <div className="bm-list-meta">
            <div className="bm-list-folder">{folderName(b.folderId)}</div>
            <div className="bm-list-time">{relativeTime(b.lastVisited)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ----- Favicon (real via Google S2 service, with letter fallback) -----
function BookmarkFavicon({ url, name, size = 32 }) {
  const [errored, setErrored] = useState(false);
  const src = faviconUrl(url, size * 2);
  if (errored || !src) {
    return (
      <span
        className="bm-favicon-fallback"
        style={{
          width: size, height: size,
          background: colorForString(url),
          fontSize: Math.max(11, Math.round(size * 0.42)),
        }}
      >{initialFromUrl(url, name)}</span>
    );
  }
  return (
    <span className="bm-favicon" style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        width={Math.round(size*0.7)}
        height={Math.round(size*0.7)}
        onError={() => setErrored(true)}
        loading="lazy"
      />
    </span>
  );
}

window.BookmarksHero = BookmarksHero;
window.BookmarkFavicon = BookmarkFavicon;

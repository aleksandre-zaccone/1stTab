var { useState, useMemo, useEffect, useCallback, useRef } = React;

// ============================
// Bookmarks hero — list/grid views, rich metadata, inline search
// ============================
function BookmarksHero({
  folders, bookmarks, activeFolderId, setActiveFolderId,
  view, setView,                // 'grid' | 'list'
  onOpenManager, onAddQuick, onOpenBookmark,
}) {
  const [query, setQuery] = useState('');

  const sortedFolders = useMemo(() => {
    const list = [];
    const childrenMap = {};
    for (const f of folders) {
      const pid = f.parentId || null;
      if (!childrenMap[pid]) childrenMap[pid] = [];
      childrenMap[pid].push(f);
    }
    function walk(parentId, depth) {
      const children = childrenMap[parentId] || [];
      for (const c of children) {
        list.push({ ...c, depth });
        walk(c.id, depth + 1);
      }
    }
    walk(null, 0);
    const addedIds = new Set(list.map(l => l.id));
    for (const f of folders) {
      if (!addedIds.has(f.id)) {
        list.push({ ...f, depth: 0 });
        walk(f.id, 1);
      }
    }
    return list;
  }, [folders]);

  const isAll = activeFolderId === 'f-all';
  
  // Recursively get all subfolder IDs for a given folder
  function getSubfolderIds(folderId) {
    let ids = [folderId];
    for (const f of folders) {
      if (f.parentId === folderId) {
        ids = ids.concat(getSubfolderIds(f.id));
      }
    }
    return ids;
  }

  const activeIds = isAll ? [] : getSubfolderIds(activeFolderId);
  const folderItems = isAll ? bookmarks : bookmarks.filter(b => activeIds.includes(b.folderId));

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
  
  // Only show top-level folders as tabs
  const topLevelFolders = folders.filter(f => !f.parentId);

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
                <BookmarkFavicon url={b.url} name={b.name} emoji={b.emoji} size={28}/>
                <span className="pinned-name">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID VIEW TABS */}
      {view === 'grid' && (
        <div className="hero-tabs" role="tablist">
          <button
            className={"hero-tab" + (isAll ? " active" : "")}
            onClick={() => setActiveFolderId('f-all')}
            role="tab"
            aria-selected={isAll}
          >
            <Icon.gridIcon size={14}/>
            <span>All</span>
            <span className="count">{bookmarks.length}</span>
          </button>
          {topLevelFolders.map(f => {
            const ids = getSubfolderIds(f.id);
            const count = bookmarks.filter(b => ids.includes(b.folderId)).length;
            return (
              <button
                key={f.id}
                className={"hero-tab" + (activeIds.includes(f.id) || f.id === activeFolderId ? " active" : "")}
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
      )}

      {/* BODY SPLIT */}
      <div className={"hero-body-split " + view}>
        {view === 'list' && (
          <div className="hero-sidebar">
            <div className="folder-rail" style={{border: 'none', background: 'transparent'}}>
              <div
                className={"folder-row" + (isAll ? " active" : "")}
                onClick={() => setActiveFolderId('f-all')}
              >
                <Icon.gridIcon size={14}/>
                <span style={{flex:1}}>All</span>
                <span className="folder-count">{bookmarks.length}</span>
              </div>
              {sortedFolders.map(f => {
                const ids = getSubfolderIds(f.id);
                const count = bookmarks.filter(b => ids.includes(b.folderId)).length;
                return (
                  <div
                    key={f.id}
                    className={"folder-row" + (activeIds.includes(f.id) || f.id === activeFolderId ? " active" : "")}
                    onClick={() => setActiveFolderId(f.id)}
                    style={{ paddingLeft: 12 + (f.depth * 16) }}
                  >
                    <Icon.folder size={14}/>
                    <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{f.name}</span>
                    <span className="folder-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="hero-main">
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
      </div>
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
            <BookmarkFavicon url={b.url} name={b.name} emoji={b.emoji} size={32}/>
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
          <BookmarkFavicon url={b.url} name={b.name} emoji={b.emoji} size={36}/>
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
function BookmarkFavicon({ url, name, emoji, size = 32 }) {
  const [errored, setErrored] = useState(false);
  if (emoji) {
    return (
      <span className="bm-favicon-fallback" style={{
        width: size, height: size, background: 'transparent',
        color: 'inherit', border: 'none',
        fontSize: Math.round(size * 0.6)
      }}>{emoji}</span>
    );
  }
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

function QuickLinks({ bookmarks, onOpen }) {
  const topVisited = useMemo(() => {
    return [...bookmarks]
      .filter(b => b.visits > 0)
      .sort((a, b) => (b.visits || 0) - (a.visits || 0))
      .slice(0, 8);
  }, [bookmarks]);

  if (topVisited.length === 0) return null;

  return (
    <div className="quick-links">
      <div className="quick-links-head">
        <Icon.zap size={14}/>
        <span>Frequent</span>
      </div>
      <div className="quick-links-grid">
        {topVisited.map(b => (
          <button key={b.id} className="quick-link-item" onClick={() => onOpen(b)} title={`${b.name} (${b.visits} visits)`}>
            <BookmarkFavicon url={b.url} name={b.name} emoji={b.emoji} size={24} />
            <span className="quick-link-name">{b.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
window.QuickLinks = QuickLinks;

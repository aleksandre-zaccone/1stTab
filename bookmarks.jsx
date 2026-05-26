var { useState, useMemo, useEffect, useCallback, useRef } = React;

/**
 * Bookmarks Card (Main Column)
 */
function BookmarksHero() {
  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [bookmarkMeta, setBookmarkMeta] = useState({});
  const [activeFolderId, setActiveFolderId] = useState('1'); // Root usually '1'
  const [view, setView] = useState('list');
  const [query, setQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState([]);

  // Load data
  const refresh = useCallback(async () => {
    const [tree, meta] = await Promise.all([
      window.Bookmarks.getTree(),
      window.getStorage(window.STORAGE_KEYS.bookmarkMeta, {})
    ]);
    
    // Flatten tree to list of folders and bookmarks
    const f = [];
    const b = [];
    function walk(nodes) {
      for (const node of nodes) {
        if (node.children) {
          f.push(node);
          walk(node.children);
        } else {
          b.push(node);
        }
      }
    }
    walk(tree);
    setFolders(f);
    setBookmarks(b);
    setBookmarkMeta(meta);
  }, []);

  useEffect(() => {
    refresh();
    chrome.bookmarks.onCreated.addListener(refresh);
    chrome.bookmarks.onRemoved.addListener(refresh);
    chrome.bookmarks.onChanged.addListener(refresh);
    chrome.bookmarks.onMoved.addListener(refresh);
    const storageListener = (changes) => {
      if (changes[window.STORAGE_KEYS.bookmarkMeta]) {
        setBookmarkMeta(changes[window.STORAGE_KEYS.bookmarkMeta].newValue || {});
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => {
      chrome.bookmarks.onCreated.removeListener(refresh);
      chrome.bookmarks.onRemoved.removeListener(refresh);
      chrome.bookmarks.onChanged.removeListener(refresh);
      chrome.bookmarks.onMoved.removeListener(refresh);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, [refresh]);

  // View state persistence
  useEffect(() => {
    window.getStorage(window.STORAGE_KEYS.view, 'list').then(setView);
    window.getStorage(window.STORAGE_KEYS.folder, 'all').then(setActiveFolderId);
    // Default: Bookmarks Bar + Other expanded so users see their tree
    window.getStorage(window.STORAGE_KEYS.treeExpanded, ['1', '2']).then(setExpandedFolders);
  }, []);

  const handleSetView = (v) => {
    setView(v);
    window.setStorage(window.STORAGE_KEYS.view, v);
  };

  const handleSetFolder = (id) => {
    setActiveFolderId(id);
    window.setStorage(window.STORAGE_KEYS.folder, id);
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    const next = expandedFolders.includes(id) 
      ? expandedFolders.filter(x => x !== id)
      : [...expandedFolders, id];
    setExpandedFolders(next);
    window.setStorage(window.STORAGE_KEYS.treeExpanded, next);
  };

  // Folder descendant index: { folderId: Set<allDescendantFolderIds incl self> }
  const folderDescendantIds = useMemo(() => {
    const childMap = {};
    for (const f of folders) {
      if (!childMap[f.parentId]) childMap[f.parentId] = [];
      childMap[f.parentId].push(f.id);
    }
    const result = {};
    for (const f of folders) {
      const ids = new Set([f.id]);
      const stack = [...(childMap[f.id] || [])];
      while (stack.length) {
        const x = stack.pop();
        if (ids.has(x)) continue;
        ids.add(x);
        for (const c of (childMap[x] || [])) stack.push(c);
      }
      result[f.id] = ids;
    }
    return result;
  }, [folders]);

  // Filter logic
  const filtered = useMemo(() => {
    let items = bookmarks;
    if (activeFolderId !== 'all') {
      const allowed = folderDescendantIds[activeFolderId] || new Set([activeFolderId]);
      items = items.filter(x => allowed.has(x.parentId));
    }
    const q = query.toLowerCase().trim();
    if (q) {
      items = items.filter(x =>
        x.title.toLowerCase().includes(q) ||
        x.url.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      const pa = bookmarkMeta[a.id]?.pinned ? 0 : 1;
      const pb = bookmarkMeta[b.id]?.pinned ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [bookmarks, bookmarkMeta, activeFolderId, query, folderDescendantIds]);

  const pinned = bookmarks.filter(b => bookmarkMeta[b.id]?.pinned);

  const togglePin = async (id) => {
    const next = { ...bookmarkMeta, [id]: { ...(bookmarkMeta[id] || {}), pinned: !bookmarkMeta[id]?.pinned } };
    setBookmarkMeta(next);
    await window.setStorage(window.STORAGE_KEYS.bookmarkMeta, next);
  };

  return (
    <div className="card hero-card">
      {/* Header */}
      <div className="card-head" style={{marginBottom: 20}}>
        <div style={{display:'flex', alignItems:'baseline', gap:10}}>
          <h2 style={{fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: 0}}>Bookmarks</h2>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-mute)'}}>
            {bookmarks.length} saved · {folders.length} folders
          </span>
        </div>
        <a href="manager.html" className="card-action">Manage →</a>
      </div>

      {/* Controls Row */}
      <div className="bm-controls" style={{display:'flex', gap:12, marginBottom: 20}}>
        <div className="bm-search" style={{flex: 1, display:'flex', alignItems:'center', gap:10, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius: 999, padding:'0 14px', height: 36}}>
          <Icon.search size={15} style={{color:'var(--text-mute)'}}/>
          <input 
            type="text" 
            placeholder="Filter bookmarks..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{background:'none', border:0, outline:0, fontSize: 13.5, width:'100%'}}
          />
        </div>
        <div className="view-toggle" style={{display:'flex', background:'var(--surface-2)', borderRadius: 8, padding: 2}}>
          <button 
            className={view === 'list' ? 'active' : ''} 
            onClick={() => handleSetView('list')}
            style={{padding: '4px 8px', borderRadius: 6}}
          >
            <Icon.listIcon size={16}/>
          </button>
          <button 
            className={view === 'grid' ? 'active' : ''} 
            onClick={() => handleSetView('grid')}
            style={{padding: '4px 8px', borderRadius: 6}}
          >
            <Icon.gridIcon size={16}/>
          </button>
        </div>

      </div>

      {/* Pinned Row */}
      {pinned.length > 0 && (
        <div className="pinned-row">
          {pinned.map(b => (
            <div key={b.id} className="pin-chip">
              <a href={b.url} className="pin-chip-link">
                <div className="pin-chip-fav" style={{background: bookmarkMeta[b.id]?.color || 'var(--surface-2)'}}>
                  {bookmarkMeta[b.id]?.initial || b.title[0]}
                </div>
                <span className="pin-chip-name">{b.title}</span>
              </a>
              <button
                className="pin-chip-x"
                title="Unpin"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(b.id); }}
              ><Icon.close size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div className={"bm-body " + (view === 'grid' ? 'grid-mode' : 'list-mode')} style={{display:'grid', gridTemplateColumns: view === 'list' ? '280px 1fr' : '1fr', gap: 24}}>
        
        {view === 'list' && (
          <div className="bm-tree">
            <div
              className={"tree-node tree-node-all" + (activeFolderId === 'all' ? ' selected' : '')}
              onClick={() => handleSetFolder('all')}
            >
              <span className="tree-chevron placeholder"><ChevronGlyph /></span>
              <span className="tree-icon"><Icon.zap size={15}/></span>
              <span className="tree-label">All Bookmarks</span>
              <span className="tree-count">{bookmarks.length}</span>
            </div>
            {folders.filter(f => f.parentId === '0').map(f => (
              <TreeNode
                key={f.id}
                node={f}
                depth={0}
                activeId={activeFolderId}
                onSelect={handleSetFolder}
                expandedIds={expandedFolders}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        )}

        <div className={view === 'grid' ? 'bm-grid' : 'bm-list'} style={{display: view === 'grid' ? 'grid' : 'block', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10}}>
          {filtered.map(b => (
            <BookmarkItem
              key={b.id}
              bookmark={b}
              meta={bookmarkMeta[b.id]}
              view={view}
              isPinned={!!bookmarkMeta[b.id]?.pinned}
              onTogglePin={() => togglePin(b.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{textAlign:'center', padding: 40, color:'var(--text-faint)', fontSize: 13}}>
              No bookmarks found
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ChevronGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3.5 2 6.5 5 3.5 8" />
    </svg>
  );
}

function TreeNode({ node, depth, activeId, onSelect, expandedIds, onToggle }) {
  const isExpanded = expandedIds.includes(node.id);
  const isSelected = activeId === node.id;
  const subFolders = (node.children || []).filter(c => c.children);
  const directBookmarkCount = (node.children || []).filter(c => c.url).length;
  const hasChildren = subFolders.length > 0;

  return (
    <div className="tree-group">
      <div
        className={"tree-node" + (isSelected ? ' selected' : '')}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => onSelect(node.id)}
      >
        <span
          className={"tree-chevron" + (isExpanded ? ' expanded' : '') + (hasChildren ? '' : ' placeholder')}
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(e, node.id); }}
        >
          <ChevronGlyph />
        </span>
        <span className="tree-icon"><Icon.folder size={15}/></span>
        <span className="tree-label">{node.title || '(untitled)'}</span>
        {directBookmarkCount > 0 && <span className="tree-count">{directBookmarkCount}</span>}
      </div>
      {isExpanded && hasChildren && (
        <div className="tree-children">
          {subFolders.map(c => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookmarkItem({ bookmark, meta, view, isPinned, onTogglePin }) {
  const host = useMemo(() => {
    try { return new URL(bookmark.url).hostname.replace('www.', ''); }
    catch(e) { return ''; }
  }, [bookmark.url]);

  const pinBtn = (
    <button
      className={'bm-pin-btn' + (isPinned ? ' active' : '')}
      title={isPinned ? 'Unpin' : 'Pin'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin && onTogglePin(); }}
    >
      <Icon.pin size={13} />
    </button>
  );

  if (view === 'grid') {
    return (
      <div className="bm-card-wrap" style={{display: 'flex', height: '100%'}}>
        <a href={bookmark.url} className="bm-card" style={{flex: 1, padding: 14, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius: 12, display:'flex', flexDirection:'column', gap:8, textDecoration:'none', color:'inherit', height: '100%', boxSizing: 'border-box'}}>
          <div style={{width:32, height:32, borderRadius:8, background: meta?.color || 'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 600, color: 'var(--text)'}}>
            <window.BookmarkIcon url={bookmark.url} title={bookmark.title} meta={meta} />
          </div>
          <div style={{fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
            {bookmark.title}
          </div>
          <div style={{fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--text-mute)', marginTop: 'auto'}}>{host}</div>
        </a>
        {pinBtn}
      </div>
    );
  }

  return (
    <div className="bm-row-wrap">
      <a href={bookmark.url} className="bm-row" style={{display:'grid', gridTemplateColumns:'36px 1fr auto auto', gap:14, padding: 12, borderRadius: 12, alignItems:'center', textDecoration:'none', color:'inherit'}}>
        <div style={{width:36, height:36, borderRadius:10, background: meta?.color || 'var(--surface-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 600, color: 'var(--text)'}}>
          <window.BookmarkIcon url={bookmark.url} title={bookmark.title} meta={meta} />
        </div>
        <div style={{overflow:'hidden'}}>
          <div style={{fontSize: 14, fontWeight: 500, display:'flex', alignItems:'center', gap:8}}>
            {bookmark.title}
            {meta?.tag && <span style={{fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--accent-text)', background:'var(--accent-soft)', padding:'1px 6px', borderRadius:4}}>{meta.tag}</span>}
          </div>
          <div style={{fontSize: 12.5, color:'var(--text-mute)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{meta?.desc}</div>
        </div>
        <div style={{fontFamily:'var(--font-mono)', fontSize: 11.5, color:'var(--text-mute)', textAlign:'right'}}>{host}</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--text-faint)', textAlign:'right', whiteSpace:'nowrap'}}>
          {new Date(bookmark.dateAdded).toLocaleDateString()}
        </div>
      </a>
      {pinBtn}
    </div>
  );
}

window.BookmarksHero = BookmarksHero;

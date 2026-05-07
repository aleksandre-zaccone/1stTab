// ============================
// Bookmark manager modal — folders + drag/drop + import/export.
// Editing/creating delegates to the parent via onEditBookmark.
// ============================
function BookmarkManager({
  folders, setFolders,
  bookmarks, setBookmarks,
  activeFolderId, setActiveFolderId,
  onClose, onEditBookmark, showToast,
  fullPage = false,
}) {
  const [query, setQuery] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks
      .filter(b => b.folderId === activeFolderId)
      .filter(b => !q
        || b.name.toLowerCase().includes(q)
        || b.url.toLowerCase().includes(q)
        || (b.description||'').toLowerCase().includes(q)
        || (b.tags||[]).some(t => t.toLowerCase().includes(q))
      );
  }, [bookmarks, activeFolderId, query]);

  function addFolder() { setEditingFolder({ name: '' }); }
  function saveFolder() {
    const name = (editingFolder.name||'').trim();
    if (!name) { setEditingFolder(null); return; }
    if (editingFolder.id) {
      setFolders(folders.map(f => f.id === editingFolder.id ? { ...f, name } : f));
    } else {
      const id = 'f-' + Math.random().toString(36).slice(2,7);
      setFolders([...folders, { id, name }]);
      setActiveFolderId(id);
    }
    setEditingFolder(null);
  }
  function deleteFolder(id) {
    if (folders.length <= 1) { showToast('Keep at least one folder.'); return; }
    if (!confirm('Delete this folder and all its bookmarks?')) return;
    const remaining = folders.filter(f => f.id !== id);
    setFolders(remaining);
    setBookmarks(bookmarks.filter(b => b.folderId !== id));
    if (activeFolderId === id) setActiveFolderId(remaining[0].id);
  }

  function addBookmark() {
    onEditBookmark({ folderId: activeFolderId, name: '', url: '', description: '', tags: [], pinned: false });
  }
  function deleteBookmark(id) {
    setBookmarks(bookmarks.filter(b => b.id !== id));
    showToast('Bookmark deleted');
  }
  function togglePin(id) {
    setBookmarks(bookmarks.map(b => b.id === id ? { ...b, pinned: !b.pinned } : b));
  }

  // drag reorder within folder
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  function onDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function onDragOver(e, id) {
    e.preventDefault();
    if (!dragId.current || dragId.current === id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOverId(id);
    setDragPos((e.clientY - rect.top) < rect.height / 2 ? 'above' : 'below');
  }
  function onDrop(e, id) {
    e.preventDefault();
    const from = dragId.current;
    if (!from || from === id) { reset(); return; }
    const list = [...bookmarks];
    const fi = list.findIndex(b => b.id === from);
    if (fi < 0) { reset(); return; }
    const [moved] = list.splice(fi, 1);
    let insertAt = list.findIndex(b => b.id === id);
    if (insertAt < 0) { setBookmarks([...list, moved]); reset(); return; }
    if (dragPos === 'below') insertAt += 1;
    list.splice(insertAt, 0, moved);
    setBookmarks(list); reset();
  }
  function reset() { dragId.current = null; setDragOverId(null); setDragPos(null); }
  function onDropOnFolder(e, fid) {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    setBookmarks(bookmarks.map(b => b.id === id ? { ...b, folderId: fid } : b));
    showToast('Moved to ' + (folders.find(f => f.id === fid)?.name || 'folder'));
    reset();
  }

  // import / export
  function exportJSON() {
    const data = { version: 2, exportedAt: new Date().toISOString(), folders, bookmarks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported');
  }
  function triggerImport() { fileInputRef.current?.click(); }
  async function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.folders) || !Array.isArray(data.bookmarks)) throw new Error('bad shape');
      const merge = confirm('OK = Merge with existing.\nCancel = Replace everything.');
      if (merge) {
        const efIds = new Set(folders.map(f => f.id));
        const ebIds = new Set(bookmarks.map(b => b.id));
        setFolders([...folders, ...data.folders.filter(f => !efIds.has(f.id))]);
        setBookmarks([...bookmarks, ...data.bookmarks.filter(b => !ebIds.has(b.id))]);
      } else {
        setFolders(data.folders); setBookmarks(data.bookmarks);
        if (data.folders[0]) setActiveFolderId(data.folders[0].id);
      }
      showToast('Imported');
    } catch {
      showToast('Import failed: invalid JSON');
    } finally { e.target.value = ''; }
  }

  const innerContent = (
    <>
        <div className="modal-head">
          <h2 className="modal-title">Bookmark manager</h2>
          {!fullPage && <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.close/></button>}
        </div>

        <div className="modal-toolbar">
          <div className="search-input">
            <Icon.search size={16}/>
            <input placeholder="Search bookmarks…" value={query} onChange={e => setQuery(e.target.value)}/>
          </div>
          <button className="btn primary" onClick={addBookmark}>
            <Icon.plus size={14}/> Add bookmark
          </button>
        </div>

        <div className="modal-body">
          <div className="folder-rail">
            {folders.map(f => (
              <div
                key={f.id}
                className={
                  "folder-row" +
                  (f.id === activeFolderId ? " active" : "") +
                  (dragId.current && dragOverId === '__folder-' + f.id ? " dragover" : "")
                }
                onClick={() => setActiveFolderId(f.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverId('__folder-' + f.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => onDropOnFolder(e, f.id)}
              >
                <Icon.folder size={14}/>
                <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{f.name}</span>
                <span className="folder-count">{bookmarks.filter(b => b.folderId === f.id).length}</span>
                <button className="folder-edit" onClick={(e) => { e.stopPropagation(); setEditingFolder({ id: f.id, name: f.name }); }} aria-label="Edit folder"><Icon.edit size={12}/></button>
                {folders.length > 1 && (
                  <button className="folder-edit" onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }} aria-label="Delete folder" style={{right: 28}}><Icon.trash size={12}/></button>
                )}
              </div>
            ))}
            <button className="folder-row folder-add" onClick={addFolder}>
              <Icon.plus size={14}/> New folder
            </button>
          </div>

          <div className="bookmark-list">
            {filtered.length === 0 ? (
              <div className="empty">{query ? 'No matches.' : 'No bookmarks here yet.'}</div>
            ) : filtered.map(b => (
              <div
                key={b.id}
                className={
                  "bookmark-row" +
                  (dragId.current === b.id ? " dragging" : "") +
                  (dragOverId === b.id && dragPos === 'above' ? " drop-above" : "") +
                  (dragOverId === b.id && dragPos === 'below' ? " drop-below" : "")
                }
                draggable
                onDragStart={(e) => onDragStart(e, b.id)}
                onDragOver={(e) => onDragOver(e, b.id)}
                onDrop={(e) => onDrop(e, b.id)}
                onDragEnd={reset}
              >
                <span className="bookmark-handle" aria-hidden><Icon.drag/></span>
                <BookmarkFavicon url={b.url} name={b.name} size={32}/>
                <div className="bookmark-meta">
                  <p className="bookmark-name">
                    {b.name}
                    {b.pinned && <span className="bm-pin inline" style={{marginLeft:6}}><Icon.pin size={10}/></span>}
                  </p>
                  <p className="bookmark-url">{hostnameOf(b.url)}{b.description ? ' · ' + b.description : ''}</p>
                </div>
                <div className="bookmark-actions">
                  <button className="icon-btn" onClick={() => togglePin(b.id)} aria-label="Pin" title={b.pinned ? 'Unpin' : 'Pin'}>
                    <Icon.pin size={14}/>
                  </button>
                  <button className="icon-btn" onClick={() => onEditBookmark(b)} aria-label="Edit"><Icon.edit size={14}/></button>
                  <button className="icon-btn" onClick={() => deleteBookmark(b.id)} aria-label="Delete"><Icon.trash size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <span>{bookmarks.length} bookmarks · {folders.length} folders</span>
          <div className="modal-footer-actions">
            <input ref={fileInputRef} type="file" accept="application/json" onChange={importJSON} hidden/>
            <button className="btn" onClick={triggerImport}><Icon.upload size={14}/> Import JSON</button>
            <button className="btn" onClick={exportJSON}><Icon.download size={14}/> Export JSON</button>
          </div>
        </div>

        {editingFolder && (
          <EditDialog
            title={editingFolder.id ? 'Rename folder' : 'New folder'}
            onClose={() => setEditingFolder(null)}
            onSave={saveFolder}
          >
            <div className="field">
              <label>Folder name</label>
              <input autoFocus value={editingFolder.name} onChange={e => setEditingFolder({...editingFolder, name: e.target.value})} placeholder="Reading"/>
            </div>
          </EditDialog>
        )}
    </>
  );

  if (fullPage) {
    return <div className="manager-full" role="main">{innerContent}</div>;
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        {innerContent}
      </div>
    </div>
  );
}

function EditDialog({ title, onClose, onSave, children }) {
  return (
    <div className="modal-backdrop" style={{zIndex: 1100}} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth: 420}}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.close/></button>
        </div>
        <div className="form">{children}</div>
        <div className="modal-footer" style={{justifyContent:'flex-end', gap: 8}}>
          <button className="btn text" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

window.BookmarkManager = BookmarkManager;
window.EditDialog = EditDialog;

function BookmarkManager({
  folders,
  setFolders,
  bookmarks,
  setBookmarks,
  activeFolderId,
  setActiveFolderId,
  onClose,
  onEditBookmark,
  showToast,
  fullPage = false
}) {
  const [query, setQuery] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const fileInputRef = useRef(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks.filter((b) => b.folderId === activeFolderId).filter(
      (b) => !q || b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q) || (b.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [bookmarks, activeFolderId, query]);
  function addFolder() {
    setEditingFolder({ name: "" });
  }
  function saveFolder() {
    const name = (editingFolder.name || "").trim();
    if (!name) {
      setEditingFolder(null);
      return;
    }
    if (editingFolder.id) {
      setFolders(folders.map((f) => f.id === editingFolder.id ? { ...f, name } : f));
    } else {
      const id = "f-" + Math.random().toString(36).slice(2, 7);
      setFolders([...folders, { id, name }]);
      setActiveFolderId(id);
    }
    setEditingFolder(null);
  }
  function deleteFolder(id) {
    if (folders.length <= 1) {
      showToast("Keep at least one folder.");
      return;
    }
    if (!confirm("Delete this folder and all its bookmarks?")) return;
    const remaining = folders.filter((f) => f.id !== id);
    setFolders(remaining);
    setBookmarks(bookmarks.filter((b) => b.folderId !== id));
    if (activeFolderId === id) setActiveFolderId(remaining[0].id);
  }
  function addBookmark() {
    onEditBookmark({ folderId: activeFolderId, name: "", url: "", description: "", tags: [], pinned: false });
  }
  function deleteBookmark(id) {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
    showToast("Bookmark deleted");
  }
  function togglePin(id) {
    setBookmarks(bookmarks.map((b) => b.id === id ? { ...b, pinned: !b.pinned } : b));
  }
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  function onDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  function onDragOver(e, id) {
    e.preventDefault();
    if (!dragId.current || dragId.current === id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOverId(id);
    setDragPos(e.clientY - rect.top < rect.height / 2 ? "above" : "below");
  }
  function onDrop(e, id) {
    e.preventDefault();
    const from = dragId.current;
    if (!from || from === id) {
      reset();
      return;
    }
    const list = [...bookmarks];
    const fi = list.findIndex((b) => b.id === from);
    if (fi < 0) {
      reset();
      return;
    }
    const [moved] = list.splice(fi, 1);
    let insertAt = list.findIndex((b) => b.id === id);
    if (insertAt < 0) {
      setBookmarks([...list, moved]);
      reset();
      return;
    }
    if (dragPos === "below") insertAt += 1;
    list.splice(insertAt, 0, moved);
    setBookmarks(list);
    reset();
  }
  function reset() {
    dragId.current = null;
    setDragOverId(null);
    setDragPos(null);
  }
  function onDropOnFolder(e, fid) {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    setBookmarks(bookmarks.map((b) => b.id === id ? { ...b, folderId: fid } : b));
    showToast("Moved to " + (folders.find((f) => f.id === fid)?.name || "folder"));
    reset();
  }
  function exportJSON() {
    const data = { version: 2, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), folders, bookmarks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookmarks-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported");
  }
  function triggerImport() {
    fileInputRef.current?.click();
  }
  async function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.folders) || !Array.isArray(data.bookmarks)) throw new Error("bad shape");
      const merge = confirm("OK = Merge with existing.\nCancel = Replace everything.");
      if (merge) {
        const efIds = new Set(folders.map((f) => f.id));
        const ebIds = new Set(bookmarks.map((b) => b.id));
        setFolders([...folders, ...data.folders.filter((f) => !efIds.has(f.id))]);
        setBookmarks([...bookmarks, ...data.bookmarks.filter((b) => !ebIds.has(b.id))]);
      } else {
        setFolders(data.folders);
        setBookmarks(data.bookmarks);
        if (data.folders[0]) setActiveFolderId(data.folders[0].id);
      }
      showToast("Imported");
    } catch {
      showToast("Import failed: invalid JSON");
    } finally {
      e.target.value = "";
    }
  }
  const innerContent = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, "Bookmark manager"), !fullPage && /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "modal-toolbar" }, /* @__PURE__ */ React.createElement("div", { className: "search-input" }, /* @__PURE__ */ React.createElement(Icon.search, { size: 16 }), /* @__PURE__ */ React.createElement("input", { placeholder: "Search bookmarks\u2026", value: query, onChange: (e) => setQuery(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: addBookmark }, /* @__PURE__ */ React.createElement(Icon.plus, { size: 14 }), " Add bookmark")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "folder-rail" }, folders.map((f) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: f.id,
      className: "folder-row" + (f.id === activeFolderId ? " active" : "") + (dragId.current && dragOverId === "__folder-" + f.id ? " dragover" : ""),
      onClick: () => setActiveFolderId(f.id),
      onDragOver: (e) => {
        e.preventDefault();
        setDragOverId("__folder-" + f.id);
      },
      onDragLeave: () => setDragOverId(null),
      onDrop: (e) => onDropOnFolder(e, f.id)
    },
    /* @__PURE__ */ React.createElement(Icon.folder, { size: 14 }),
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.name),
    /* @__PURE__ */ React.createElement("span", { className: "folder-count" }, bookmarks.filter((b) => b.folderId === f.id).length),
    /* @__PURE__ */ React.createElement("button", { className: "folder-edit", onClick: (e) => {
      e.stopPropagation();
      setEditingFolder({ id: f.id, name: f.name });
    }, "aria-label": "Edit folder" }, /* @__PURE__ */ React.createElement(Icon.edit, { size: 12 })),
    folders.length > 1 && /* @__PURE__ */ React.createElement("button", { className: "folder-edit", onClick: (e) => {
      e.stopPropagation();
      deleteFolder(f.id);
    }, "aria-label": "Delete folder", style: { right: 28 } }, /* @__PURE__ */ React.createElement(Icon.trash, { size: 12 }))
  )), /* @__PURE__ */ React.createElement("button", { className: "folder-row folder-add", onClick: addFolder }, /* @__PURE__ */ React.createElement(Icon.plus, { size: 14 }), " New folder")), /* @__PURE__ */ React.createElement("div", { className: "bookmark-list" }, filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "empty" }, query ? "No matches." : "No bookmarks here yet.") : filtered.map((b) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: b.id,
      className: "bookmark-row" + (dragId.current === b.id ? " dragging" : "") + (dragOverId === b.id && dragPos === "above" ? " drop-above" : "") + (dragOverId === b.id && dragPos === "below" ? " drop-below" : ""),
      draggable: true,
      onDragStart: (e) => onDragStart(e, b.id),
      onDragOver: (e) => onDragOver(e, b.id),
      onDrop: (e) => onDrop(e, b.id),
      onDragEnd: reset
    },
    /* @__PURE__ */ React.createElement("span", { className: "bookmark-handle", "aria-hidden": true }, /* @__PURE__ */ React.createElement(Icon.drag, null)),
    /* @__PURE__ */ React.createElement(BookmarkFavicon, { url: b.url, name: b.name, size: 32 }),
    /* @__PURE__ */ React.createElement("div", { className: "bookmark-meta" }, /* @__PURE__ */ React.createElement("p", { className: "bookmark-name" }, b.name, b.pinned && /* @__PURE__ */ React.createElement("span", { className: "bm-pin inline", style: { marginLeft: 6 } }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 10 }))), /* @__PURE__ */ React.createElement("p", { className: "bookmark-url" }, hostnameOf(b.url), b.description ? " \xB7 " + b.description : "")),
    /* @__PURE__ */ React.createElement("div", { className: "bookmark-actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => togglePin(b.id), "aria-label": "Pin", title: b.pinned ? "Unpin" : "Pin" }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 14 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => onEditBookmark(b), "aria-label": "Edit" }, /* @__PURE__ */ React.createElement(Icon.edit, { size: 14 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => deleteBookmark(b.id), "aria-label": "Delete" }, /* @__PURE__ */ React.createElement(Icon.trash, { size: 14 })))
  )))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer" }, /* @__PURE__ */ React.createElement("span", null, bookmarks.length, " bookmarks \xB7 ", folders.length, " folders"), /* @__PURE__ */ React.createElement("div", { className: "modal-footer-actions" }, /* @__PURE__ */ React.createElement("input", { ref: fileInputRef, type: "file", accept: "application/json", onChange: importJSON, hidden: true }), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: triggerImport }, /* @__PURE__ */ React.createElement(Icon.upload, { size: 14 }), " Import JSON"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: exportJSON }, /* @__PURE__ */ React.createElement(Icon.download, { size: 14 }), " Export JSON"))), editingFolder && /* @__PURE__ */ React.createElement(
    EditDialog,
    {
      title: editingFolder.id ? "Rename folder" : "New folder",
      onClose: () => setEditingFolder(null),
      onSave: saveFolder
    },
    /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Folder name"), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: editingFolder.name, onChange: (e) => setEditingFolder({ ...editingFolder, name: e.target.value }), placeholder: "Reading" }))
  ));
  if (fullPage) {
    return /* @__PURE__ */ React.createElement("div", { className: "manager-full", role: "main" }, innerContent);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", role: "dialog", "aria-modal": "true" }, innerContent));
}
function EditDialog({ title, onClose, onSave, children }) {
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", style: { zIndex: 1100 }, onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 420 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, title), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form" }, children), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: onSave }, "Save"))));
}
window.BookmarkManager = BookmarkManager;
window.EditDialog = EditDialog;

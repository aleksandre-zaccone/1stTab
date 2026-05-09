var { useState, useMemo, useEffect, useCallback, useRef } = React;
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
    const addedIds = new Set(list.map((l) => l.id));
    for (const f of folders) {
      if (!addedIds.has(f.id)) {
        list.push({ ...f, depth: 0 });
        walk(f.id, 1);
      }
    }
    return list;
  }, [folders]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks.filter((b) => b.folderId === activeFolderId).filter(
      (b) => !q || b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q) || (b.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [bookmarks, activeFolderId, query]);
  function addFolder() {
    setEditingFolder({ name: "", parentId: activeFolderId });
  }
  function saveFolder() {
    const name = (editingFolder.name || "").trim();
    if (!name) {
      setEditingFolder(null);
      return;
    }
    const pid = editingFolder.parentId || null;
    if (editingFolder.id) {
      setFolders(folders.map((f) => f.id === editingFolder.id ? { ...f, name, parentId: pid } : f));
    } else {
      const id = "f-" + Math.random().toString(36).slice(2, 7);
      setFolders([...folders, { id, name, parentId: pid }]);
      setActiveFolderId(id);
    }
    setEditingFolder(null);
  }
  function deleteFolder(id) {
    if (folders.length <= 1) {
      showToast("Keep at least one folder.");
      return;
    }
    if (!confirm("Delete this folder, its subfolders, and all their bookmarks?")) return;
    const toDelete = /* @__PURE__ */ new Set([id]);
    let added;
    do {
      added = false;
      for (const f of folders) {
        if (toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          added = true;
        }
      }
    } while (added);
    const remaining = folders.filter((f) => !toDelete.has(f.id));
    setFolders(remaining);
    setBookmarks(bookmarks.filter((b) => !toDelete.has(b.folderId)));
    if (toDelete.has(activeFolderId) && remaining.length > 0) setActiveFolderId(remaining[0].id);
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
  const dragType = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  function onDragStart(e, type, id) {
    dragId.current = id;
    dragType.current = type;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  function onDragOver(e, type, id) {
    e.preventDefault();
    if (!dragId.current) return;
    if (dragType.current === "bookmark" && type === "folder") {
      setDragOverId("__folder-" + id);
      setDragPos("move");
      return;
    }
    if (dragType.current === "folder" && type === "folder") {
      if (dragId.current === id) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      if (relY > rect.height * 0.25 && relY < rect.height * 0.75) {
        setDragOverId("__folder-" + id);
        setDragPos("move");
      } else {
        const pos = relY < rect.height / 2 ? "above" : "below";
        setDragOverId(id);
        setDragPos(pos);
      }
    }
    if (dragType.current === "bookmark" && type === "bookmark") {
      if (dragId.current === id) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = e.clientY - rect.top < rect.height / 2 ? "above" : "below";
      setDragOverId(id);
      setDragPos(pos);
    }
  }
  function onDrop(e, type, id) {
    e.preventDefault();
    const from = dragId.current;
    if (!from) {
      reset();
      return;
    }
    if (dragType.current === "bookmark") {
      if (type === "folder" || type === "folder" && dragPos === "move") {
        setBookmarks(bookmarks.map((b) => b.id === from ? { ...b, folderId: id } : b));
        showToast("Moved to " + (folders.find((f) => f.id === id)?.name || "folder"));
      } else if (type === "bookmark") {
        if (from === id) {
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
        if (dragPos === "below") insertAt += 1;
        list.splice(insertAt, 0, moved);
        setBookmarks(list);
      }
    } else if (dragType.current === "folder" && type === "folder") {
      if (from === id) {
        reset();
        return;
      }
      const isDescendant = (parentId, childId) => {
        let current = folders.find((f) => f.id === childId);
        while (current && current.parentId) {
          if (current.parentId === parentId) return true;
          current = folders.find((f) => f.id === current.parentId);
        }
        return false;
      };
      if (isDescendant(from, id)) {
        showToast("Cannot move a folder into its own subfolder.");
        reset();
        return;
      }
      if (dragPos === "move") {
        setFolders(folders.map((f) => f.id === from ? { ...f, parentId: id } : f));
        showToast("Moved into " + (folders.find((f) => f.id === id)?.name || "folder"));
      } else {
        const list = [...folders];
        const fi = list.findIndex((f) => f.id === from);
        const [moved] = list.splice(fi, 1);
        let insertAt = list.findIndex((f) => f.id === id);
        if (dragPos === "below") insertAt += 1;
        const targetFolder = folders.find((f) => f.id === id);
        moved.parentId = targetFolder.parentId;
        list.splice(insertAt, 0, moved);
        setFolders(list);
      }
    }
    reset();
  }
  function reset() {
    dragId.current = null;
    dragType.current = null;
    setDragOverId(null);
    setDragPos(null);
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
  const innerContent = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, "Bookmark manager"), !fullPage && /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "modal-toolbar" }, /* @__PURE__ */ React.createElement("div", { className: "search-input" }, /* @__PURE__ */ React.createElement(Icon.search, { size: 16 }), /* @__PURE__ */ React.createElement("input", { placeholder: "Search bookmarks\u2026", value: query, onChange: (e) => setQuery(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: addBookmark }, /* @__PURE__ */ React.createElement(Icon.plus, { size: 14 }), " Add bookmark")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "folder-rail" }, sortedFolders.map((f) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: f.id,
      className: "folder-row" + (f.id === activeFolderId ? " active" : "") + (dragId.current === f.id ? " dragging" : "") + (dragOverId === "__folder-" + f.id ? " dragover" : "") + (dragOverId === f.id && dragPos === "above" ? " drop-above" : "") + (dragOverId === f.id && dragPos === "below" ? " drop-below" : ""),
      style: {
        paddingLeft: 12 + f.depth * 16,
        "--indent": 12 + f.depth * 16 + "px"
      },
      onClick: () => setActiveFolderId(f.id),
      draggable: f.id !== "f-favorites",
      onDragStart: (e) => onDragStart(e, "folder", f.id),
      onDragOver: (e) => onDragOver(e, "folder", f.id),
      onDrop: (e) => onDrop(e, "folder", f.id),
      onDragEnd: reset
    },
    /* @__PURE__ */ React.createElement("span", { className: "bookmark-handle", "aria-hidden": true, style: { marginRight: 0 } }, /* @__PURE__ */ React.createElement(Icon.drag, null)),
    /* @__PURE__ */ React.createElement(Icon.folder, { size: 14 }),
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.name),
    /* @__PURE__ */ React.createElement("span", { className: "folder-count" }, bookmarks.filter((b) => b.folderId === f.id).length),
    /* @__PURE__ */ React.createElement("button", { className: "folder-edit", onClick: (e) => {
      e.stopPropagation();
      setEditingFolder({ id: f.id, name: f.name, parentId: f.parentId });
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
      onDragStart: (e) => onDragStart(e, "bookmark", b.id),
      onDragOver: (e) => onDragOver(e, "bookmark", b.id),
      onDrop: (e) => onDrop(e, "bookmark", b.id),
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
    /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Folder name"), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: editingFolder.name, onChange: (e) => setEditingFolder({ ...editingFolder, name: e.target.value }), placeholder: "Reading" })),
    /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Parent folder"), /* @__PURE__ */ React.createElement("select", { value: editingFolder.parentId || "", onChange: (e) => setEditingFolder({ ...editingFolder, parentId: e.target.value || null }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "None (Top level)"), sortedFolders.filter((f) => f.id !== editingFolder.id).map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, "\xA0\xA0".repeat(f.depth), f.name))))
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

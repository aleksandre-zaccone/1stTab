var { useState, useMemo, useEffect, useCallback, useRef } = React;
const ICON = {
  chevron: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 11, height: p.size || 11, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "9 18 15 12 9 6" })),
  folder: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })),
  star: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 14, height: p.size || 14, viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("polygon", { points: "12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" })),
  link: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 11, height: p.size || 11, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ React.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })),
  grid: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 16, height: p.size || 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })),
  list: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 16, height: p.size || 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "6", x2: "21", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "12", x2: "21", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "18", x2: "21", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" }))
};
function BookmarkManagerApp() {
  const [tree, setTree] = useState([]);
  const [meta, setMeta] = window.useStorage("nt.bookmarkMeta", {}, true);
  const [activeFolderId, setActiveFolderId] = useState("1");
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(["1", "2"]);
  const [draggedFolderId, setDraggedFolderId] = useState(null);
  const [draggedBookmarkId, setDraggedBookmarkId] = useState(null);
  const [toast, setToast] = useState(null);
  const refreshTree = useCallback(async () => {
    const results = await window.Bookmarks.getTree();
    setTree(results[0].children || []);
  }, []);
  useEffect(() => {
    refreshTree();
    chrome.bookmarks.onCreated.addListener(refreshTree);
    chrome.bookmarks.onRemoved.addListener(refreshTree);
    chrome.bookmarks.onChanged.addListener(refreshTree);
    chrome.bookmarks.onMoved.addListener(refreshTree);
    return () => {
      chrome.bookmarks.onCreated.removeListener(refreshTree);
      chrome.bookmarks.onRemoved.removeListener(refreshTree);
      chrome.bookmarks.onChanged.removeListener(refreshTree);
      chrome.bookmarks.onMoved.removeListener(refreshTree);
    };
  }, [refreshTree]);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => prev === msg ? null : prev), 1500);
  };
  const allBookmarks = useMemo(() => {
    const list = [];
    const walk = (nodes) => {
      for (const node of nodes) {
        if (node.url) list.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(tree);
    return list;
  }, [tree]);
  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = allBookmarks;
    if (activeFolderId !== "all") {
      const walk = (nodes) => {
        for (const node of nodes) {
          if (node.id === activeFolderId) return node.children || [];
          if (node.children) {
            const found = walk(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const folderChildren = walk(tree) || [];
      list = folderChildren.filter((node) => node.url);
    }
    if (q) {
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    }
    return list;
  }, [allBookmarks, tree, activeFolderId, searchQuery]);
  const stats = useMemo(() => {
    let folders = 0;
    const walk = (nodes) => {
      for (const node of nodes) {
        if (!node.url) folders++;
        if (node.children) walk(node.children);
      }
    };
    walk(tree);
    return { bookmarks: allBookmarks.length, folders };
  }, [tree, allBookmarks]);
  const toggleExpand = (id) => {
    setExpandedFolders((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const handleDelete = async (id) => {
    if (confirm("Delete this bookmark?")) {
      await window.Bookmarks.remove(id);
      showToast("Bookmark deleted");
    }
  };
  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} bookmarks?`)) {
      for (const id of selectedIds) await window.Bookmarks.remove(id);
      setSelectedIds([]);
      showToast("Bookmarks deleted");
    }
  };
  const handleSaveFolder = async (data) => {
    try {
      if (editingFolder && editingFolder.id) {
        await window.Bookmarks.update(editingFolder.id, { title: data.title });
        if (editingFolder.parentId && editingFolder.parentId !== data.parentId) {
          await window.Bookmarks.move(editingFolder.id, { parentId: data.parentId });
          showToast("Folder updated and moved");
        } else {
          showToast("Folder updated");
        }
      } else {
        await window.Bookmarks.create({ title: data.title, parentId: data.parentId });
        showToast("Folder created");
      }
      setEditingFolder(null);
      await refreshTree();
    } catch (err) {
      console.error("Save folder failed:", err);
      showToast("Could not save folder: " + (err.message || "unknown error"));
    }
  };
  const handleDeleteFolder = async (id, title) => {
    if (confirm(`Delete folder "${title}" and all its bookmarks?`)) {
      try {
        await window.Bookmarks.removeTree(id);
        if (activeFolderId === id) setActiveFolderId("all");
        showToast("Folder deleted");
        await refreshTree();
      } catch (err) {
        console.error("Delete folder failed:", err);
        showToast("Could not delete folder: " + (err.message || "unknown error"));
      }
    }
  };
  const findNode = (nodes, id) => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  const isDescendant = (parent, childId) => {
    if (!parent || !parent.children) return false;
    for (const child of parent.children) {
      if (child.id === childId) return true;
      if (child.children && isDescendant(child, childId)) return true;
    }
    return false;
  };
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedFolderId(id);
  };
  const handleBookmarkDragStart = (e, id) => {
    e.dataTransfer.setData("text/bookmarkId", id);
    setDraggedBookmarkId(id);
  };
  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (draggedFolderId) {
      if (draggedFolderId === targetId) return;
      const draggedNode = findNode(tree, draggedFolderId);
      if (draggedNode && isDescendant(draggedNode, targetId)) return;
    }
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const bookmarkId = e.dataTransfer.getData("text/bookmarkId") || draggedBookmarkId;
    if (bookmarkId) {
      setDraggedBookmarkId(null);
      try {
        await window.Bookmarks.move(bookmarkId, { parentId: targetId });
        showToast("Bookmark moved");
        await refreshTree();
      } catch (err) {
        console.error("Bookmark drag move failed:", err);
        showToast("Could not move bookmark: " + err.message);
      }
      return;
    }
    const folderId = e.dataTransfer.getData("text/plain") || draggedFolderId;
    setDraggedFolderId(null);
    if (!folderId || folderId === targetId) return;
    const draggedNode = findNode(tree, folderId);
    if (draggedNode && isDescendant(draggedNode, targetId)) {
      showToast("Cannot move folder inside itself");
      return;
    }
    try {
      await window.Bookmarks.move(folderId, { parentId: targetId });
      showToast("Folder moved");
      await refreshTree();
    } catch (err) {
      console.error("Folder drag move failed:", err);
      showToast("Could not move folder: " + err.message);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-dot" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "brand-title" }, "Dashboard"), /* @__PURE__ */ React.createElement("div", { className: "brand-sub" }, "Bookmark Manager"))), /* @__PURE__ */ React.createElement("div", { className: "topbar-right" }, /* @__PURE__ */ React.createElement("a", { className: "back-link", href: "newtab.html" }, /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "19", y1: "12", x2: "5", y2: "12" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 19 5 12 12 5" })), "Dashboard"))), /* @__PURE__ */ React.createElement("div", { className: "manager-card" }, /* @__PURE__ */ React.createElement("div", { className: "manager-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "manager-title" }, "Bookmark manager"), /* @__PURE__ */ React.createElement("span", { className: "manager-stats" }, stats.bookmarks, " bookmarks \xB7 ", stats.folders, " folders"))), /* @__PURE__ */ React.createElement("div", { className: "search-row" }, /* @__PURE__ */ React.createElement("label", { className: "search-box" }, /* @__PURE__ */ React.createElement(window.Icon.search, { size: 16 }), /* @__PURE__ */ React.createElement("input", { placeholder: "Search bookmarks\u2026", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "add-btn", onClick: () => setEditingBookmark({ title: "", url: "", parentId: activeFolderId === "all" ? "1" : activeFolderId }) }, /* @__PURE__ */ React.createElement(window.Icon.plus, { size: 13, strokeWidth: 2.6 }), "Add bookmark")), selectedIds.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "status-row", style: { marginBottom: 22, padding: "10px 16px", background: "var(--accent-soft)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 500, color: "var(--accent-text)" } }, selectedIds.length, " selected"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: () => setSelectedIds([]) }, "Clear"), /* @__PURE__ */ React.createElement("button", { className: "btn danger-ghost", onClick: handleBulkDelete }, "Delete"))), /* @__PURE__ */ React.createElement("div", { className: "split" }, /* @__PURE__ */ React.createElement("aside", { className: "tree" }, /* @__PURE__ */ React.createElement("style", null, `
              .tree-node .tree-actions {
                opacity: 0;
                pointer-events: none;
                margin-left: auto;
                display: flex;
                gap: 4px;
              }
              .tree-node:hover .tree-actions {
                opacity: 1 !important;
                pointer-events: auto !important;
              }
              .tree-actions button {
                background: none;
                border: 0;
                padding: 2px;
                cursor: pointer;
                color: var(--text-mute);
                display: inline-flex;
                align-items: center;
                transition: color 0.12s;
              }
              .tree-actions button:hover {
                color: var(--text) !important;
              }
              .tree-actions button.danger:hover {
                color: var(--danger) !important;
              }
              .tree-node.drag-over {
                background: var(--accent-soft) !important;
                outline: 2px dashed var(--accent) !important;
                outline-offset: -2px;
              }
            `), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-mute)" } }, "Folders"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn ghost icon-only",
      onClick: () => setEditingFolder({ title: "", parentId: "1" }),
      title: "Add Folder",
      style: { padding: 4, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }
    },
    /* @__PURE__ */ React.createElement(window.Icon.plus, { size: 14 })
  )), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `tree-node ${activeFolderId === "all" ? "selected" : ""}`,
      onClick: () => setActiveFolderId("all"),
      onDragOver: (e) => e.preventDefault(),
      onDrop: async (e) => {
        e.preventDefault();
        const bookmarkId = e.dataTransfer.getData("text/bookmarkId") || draggedBookmarkId;
        if (bookmarkId) {
          setDraggedBookmarkId(null);
          try {
            await window.Bookmarks.move(bookmarkId, { parentId: "1" });
            showToast("Bookmark moved to Bookmarks Bar");
            await refreshTree();
          } catch (err) {
            showToast("Could not move bookmark: " + err.message);
          }
          return;
        }
        const id = e.dataTransfer.getData("text/plain") || draggedFolderId;
        if (!id) return;
        try {
          await window.Bookmarks.move(id, { parentId: "1" });
          showToast("Folder moved to Bookmarks Bar");
          await refreshTree();
        } catch (err) {
          showToast("Could not move folder: " + err.message);
        }
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "tree-chevron placeholder" }, ICON.chevron({})),
    /* @__PURE__ */ React.createElement("span", { className: "tree-icon" }, ICON.star({})),
    /* @__PURE__ */ React.createElement("span", { className: "tree-label" }, "All Bookmarks")
  ), tree.map((node) => /* @__PURE__ */ React.createElement(
    TreeNode,
    {
      key: node.id,
      node,
      depth: 0,
      activeId: activeFolderId,
      setActiveId: setActiveFolderId,
      expanded: expandedFolders,
      onToggle: toggleExpand,
      onAddFolder: (parentId) => setEditingFolder({ title: "", parentId }),
      onEditFolder: (folder) => setEditingFolder(folder),
      onDeleteFolder: handleDeleteFolder,
      draggedId: draggedFolderId,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: `list ${viewMode === "grid" ? "grid-mode" : ""}` }, filteredBookmarks.map((bm) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: bm.id,
      className: "bm-row",
      draggable: true,
      onDragStart: (e) => handleBookmarkDragStart(e, bm.id)
    },
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: selectedIds.includes(bm.id),
        onChange: (e) => setSelectedIds((prev) => e.target.checked ? [...prev, bm.id] : prev.filter((id) => id !== bm.id)),
        style: { marginRight: 0 }
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "bm-fav", style: { background: meta[bm.id]?.color || "#f0f0f0", color: "var(--text)" } }, /* @__PURE__ */ React.createElement(window.BookmarkIcon, { url: bm.url, title: bm.title, meta: meta[bm.id] })),
    /* @__PURE__ */ React.createElement("div", { className: "bm-info", onClick: () => window.open(bm.url) }, /* @__PURE__ */ React.createElement("div", { className: "bm-name" }, bm.title, bm.url.includes("google.com") && /* @__PURE__ */ React.createElement("span", { className: "bm-pin" }, ICON.link({}))), /* @__PURE__ */ React.createElement("div", { className: "bm-meta" }, /* @__PURE__ */ React.createElement("span", { className: "host" }, new URL(bm.url).hostname), /* @__PURE__ */ React.createElement("span", { className: "sep" }, "\xB7"), /* @__PURE__ */ React.createElement("span", { className: "desc" }, meta[bm.id]?.desc || bm.url))),
    /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: meta[bm.id]?.pinned ? "pinned" : "",
        title: meta[bm.id]?.pinned ? "Unpin" : "Pin",
        onClick: () => setMeta((prev) => ({
          ...prev,
          [bm.id]: { ...prev[bm.id] || {}, pinned: !prev[bm.id]?.pinned }
        }))
      },
      /* @__PURE__ */ React.createElement(Icon.pin, { size: 14 })
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditingBookmark(bm), title: "Edit" }, /* @__PURE__ */ React.createElement(Icon.edit, { size: 14 })), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => handleDelete(bm.id), title: "Delete" }, /* @__PURE__ */ React.createElement(Icon.trash, { size: 14 })))
  )), filteredBookmarks.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty" }, "No bookmarks found.")))), editingBookmark && /* @__PURE__ */ React.createElement(
    EditModal,
    {
      bookmark: editingBookmark,
      meta: meta[editingBookmark.id] || {},
      onClose: () => setEditingBookmark(null),
      onSave: async (data) => {
        try {
          let savedId = editingBookmark.id;
          if (savedId) {
            await window.Bookmarks.update(savedId, { title: data.title, url: data.url });
            if (editingBookmark.parentId !== data.parentId) {
              await window.Bookmarks.move(savedId, { parentId: data.parentId });
            }
          } else {
            const node = await window.Bookmarks.create({ title: data.title, url: data.url, parentId: data.parentId });
            if (!node || !node.id) throw new Error("Chrome did not return a created bookmark");
            savedId = node.id;
          }
          setMeta((prev) => ({
            ...prev,
            [savedId]: {
              ...prev[savedId] || {},
              desc: data.desc,
              tag: data.tag,
              color: data.color,
              icon: data.icon,
              pinned: !!data.pinned
            }
          }));
          setEditingBookmark(null);
          await refreshTree();
          showToast(editingBookmark.id ? "Updated" : "Bookmark added");
        } catch (err) {
          console.error("Save bookmark failed:", err);
          showToast("Could not save: " + (err.message || "unknown error"));
        }
      },
      tree
    }
  ), editingFolder && /* @__PURE__ */ React.createElement(
    FolderModal,
    {
      folder: editingFolder,
      onClose: () => setEditingFolder(null),
      onSave: handleSaveFolder,
      tree
    }
  ), toast && /* @__PURE__ */ React.createElement("div", { className: `toast show` }, toast));
}
function TreeNode({
  node,
  depth,
  activeId,
  setActiveId,
  expanded,
  onToggle,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  draggedId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) {
  if (node.url) return null;
  const isExpanded = expanded.includes(node.id);
  const isSelected = activeId === node.id;
  const hasChildren = node.children && node.children.some((c) => !c.url);
  const isProtected = node.id === "1" || node.id === "2" || node.id === "3";
  return /* @__PURE__ */ React.createElement("div", { className: "tree-row" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `tree-node ${isSelected ? "selected" : ""}`,
      style: { paddingLeft: 8 + depth * 12, display: "flex", alignItems: "center" },
      onClick: () => setActiveId(node.id),
      draggable: !isProtected,
      onDragStart: (e) => onDragStart(e, node.id),
      onDragOver: (e) => onDragOver(e, node.id),
      onDragLeave,
      onDrop: (e) => onDrop(e, node.id)
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `tree-chevron ${isExpanded ? "expanded" : ""} ${hasChildren ? "" : "placeholder"}`,
        onClick: (e) => {
          e.stopPropagation();
          onToggle(node.id);
        }
      },
      ICON.chevron({})
    ),
    /* @__PURE__ */ React.createElement("span", { className: "tree-icon" }, ICON.folder({})),
    /* @__PURE__ */ React.createElement("span", { className: "tree-label" }, node.title),
    /* @__PURE__ */ React.createElement("div", { className: "tree-actions" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          onAddFolder(node.id);
        },
        title: "Create subfolder"
      },
      /* @__PURE__ */ React.createElement(window.Icon.plus, { size: 12 })
    ), !isProtected && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          onEditFolder(node);
        },
        title: "Rename folder"
      },
      /* @__PURE__ */ React.createElement(window.Icon.edit, { size: 12 })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "danger",
        onClick: (e) => {
          e.stopPropagation();
          onDeleteFolder(node.id, node.title);
        },
        title: "Delete folder and contents"
      },
      /* @__PURE__ */ React.createElement(window.Icon.trash, { size: 12 })
    )))
  ), hasChildren && isExpanded && /* @__PURE__ */ React.createElement("div", { className: "tree-children open" }, node.children.map((c) => /* @__PURE__ */ React.createElement(
    TreeNode,
    {
      key: c.id,
      node: c,
      depth: depth + 1,
      activeId,
      setActiveId,
      expanded,
      onToggle,
      onAddFolder,
      onEditFolder,
      onDeleteFolder,
      draggedId,
      onDragStart,
      onDragOver,
      onDragLeave,
      onDrop
    }
  ))));
}
function FolderPickerNode({ node, depth, selectedId, onSelect, currentEditingFolderId }) {
  if (node.url) return null;
  if (node.id === currentEditingFolderId) return null;
  const isSelected = selectedId === node.id;
  const subFolders = (node.children || []).filter((c) => !c.url && c.id !== currentEditingFolderId);
  const hasChildren = subFolders.length > 0;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "block" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 8px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12.5px",
        background: isSelected ? "var(--accent-soft)" : "transparent",
        color: isSelected ? "var(--accent-text)" : "var(--text-2)",
        fontWeight: isSelected ? "500" : "normal",
        marginLeft: `${depth * 14}px`,
        marginBottom: "2px",
        transition: "background 0.12s, color 0.12s"
      },
      onClick: () => onSelect(node.id)
    },
    /* @__PURE__ */ React.createElement("span", { style: { color: isSelected ? "var(--accent)" : "var(--text-mute)", display: "inline-flex", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }))),
    /* @__PURE__ */ React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 } }, node.title || "(untitled)"),
    isSelected && /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", color: "var(--accent)" } }, /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" })))
  ), hasChildren && subFolders.map((c) => /* @__PURE__ */ React.createElement(
    FolderPickerNode,
    {
      key: c.id,
      node: c,
      depth: depth + 1,
      selectedId,
      onSelect,
      currentEditingFolderId
    }
  )));
}
function FolderModal({ folder, onClose, onSave, tree }) {
  const [title, setTitle] = useState(folder.title || "");
  const [parentId, setParentId] = useState(folder.parentId || "1");
  const [saving, setSaving] = useState(false);
  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && !saving;
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        parentId
      });
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop open", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, folder.id ? "Edit Folder" : "Add Folder"), /* @__PURE__ */ React.createElement("button", { className: "modal-close", onClick: onClose }, /* @__PURE__ */ React.createElement(window.Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Folder Name"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "input",
      value: title,
      onChange: (e) => setTitle(e.target.value),
      placeholder: "e.g. Work, Inspiration, Recipes",
      autoFocus: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Parent Folder"), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "8px",
        maxHeight: "180px",
        overflowY: "auto",
        background: "var(--surface)",
        marginTop: "6px"
      }
    },
    tree.map((node) => /* @__PURE__ */ React.createElement(
      FolderPickerNode,
      {
        key: node.id,
        node,
        depth: 0,
        selectedId: parentId,
        onSelect: setParentId,
        currentEditingFolderId: folder.id
      }
    ))
  ))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("div", null), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: onClose, disabled: saving }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: handleSave, disabled: !canSave }, saving ? "Saving\u2026" : "Save")))));
}
const COLOR_SWATCHES = [
  "#cc785c",
  "#2f6feb",
  "#15803d",
  "#9334e6",
  "#d93025",
  "#0b8043",
  "#f9ab00",
  "#1a73e8",
  "#b80672",
  "#5f6368"
];
function normalizeUrl(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) || s.startsWith("chrome://") || s.startsWith("about:")) return s;
  return "https://" + s;
}
function isValidUrl(s) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}
function EditModal({ bookmark, meta, onClose, onSave, tree }) {
  const [title, setTitle] = useState(bookmark.title || "");
  const [url, setUrl] = useState(bookmark.url || "");
  const [parentId, setParentId] = useState(bookmark.parentId || "1");
  const [desc, setDesc] = useState(meta?.desc || "");
  const [tag, setTag] = useState(meta?.tag || "");
  const [color, setColor] = useState(meta?.color || COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(meta?.icon || "none");
  const [pinned, setPinned] = useState(!!meta?.pinned);
  const [saving, setSaving] = useState(false);
  const folders = useMemo(() => {
    const list = [];
    const walk = (nodes, prefix = "") => {
      for (const node of nodes) {
        if (!node.url) {
          list.push({ id: node.id, title: prefix + node.title });
          if (node.children) walk(node.children, prefix + node.title + " / ");
        }
      }
    };
    walk(tree);
    return list;
  }, [tree]);
  const trimmedTitle = title.trim();
  const normalizedUrl = normalizeUrl(url);
  const urlOk = !!normalizedUrl && isValidUrl(normalizedUrl);
  const titleOk = trimmedTitle.length > 0;
  const canSave = titleOk && urlOk && !saving;
  const urlError = url.trim() && !urlOk ? "Enter a valid URL (e.g. example.com)" : "";
  const titleError = !titleOk ? "Name is required" : "";
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        url: normalizedUrl,
        parentId,
        desc: desc.trim(),
        tag: tag.trim(),
        color,
        icon,
        pinned
      });
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop open", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal modal-wide", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, bookmark.id ? "Edit Bookmark" : "Add Bookmark"), /* @__PURE__ */ React.createElement("button", { className: "modal-close", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "bm-preview" }, /* @__PURE__ */ React.createElement("div", { className: "bm-preview-fav", style: { background: color, color: "var(--text)" } }, /* @__PURE__ */ React.createElement(window.BookmarkIcon, { url, title, meta: { icon } })), /* @__PURE__ */ React.createElement("div", { className: "bm-preview-text" }, /* @__PURE__ */ React.createElement("div", { className: "bm-preview-title" }, title || "New bookmark"), /* @__PURE__ */ React.createElement("div", { className: "bm-preview-host" }, (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url || "example.com";
    }
  })())), pinned && /* @__PURE__ */ React.createElement("span", { className: "bm-preview-pin" }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 12 }), " Pinned")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Name"), /* @__PURE__ */ React.createElement("input", { className: "input" + (titleError && title !== "" ? " invalid" : ""), value: title, onChange: (e) => setTitle(e.target.value), autoFocus: true }), titleError && title.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "field-err" }, titleError)), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "URL"), /* @__PURE__ */ React.createElement("input", { className: "input" + (urlError ? " invalid" : ""), value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://example.com" }), urlError && /* @__PURE__ */ React.createElement("div", { className: "field-err" }, urlError)), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Description"), /* @__PURE__ */ React.createElement("textarea", { className: "textarea", rows: 2, value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "Why you saved this\u2026" })), /* @__PURE__ */ React.createElement("div", { className: "field-row cols-21" }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Folder"), /* @__PURE__ */ React.createElement("select", { className: "select", value: parentId, onChange: (e) => setParentId(e.target.value) }, folders.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.title)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Tag"), /* @__PURE__ */ React.createElement("input", { className: "input", value: tag, onChange: (e) => setTag(e.target.value), placeholder: "news" }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Tile color"), /* @__PURE__ */ React.createElement("div", { className: "color-row" }, COLOR_SWATCHES.map((c) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: c,
      type: "button",
      className: "color-swatch" + (color === c ? " selected" : ""),
      style: { background: c },
      onClick: () => setColor(c),
      "aria-label": c
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Icon"), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))",
        gap: "8px",
        marginTop: "6px"
      }
    },
    Object.keys(window.BOOKMARK_ICONS).map((iconKey) => {
      const isSelected = icon === iconKey;
      const iconSvg = window.BOOKMARK_ICONS[iconKey];
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: iconKey,
          type: "button",
          title: iconKey === "none" ? "Use Favicon" : iconKey,
          onClick: () => setIcon(iconKey),
          style: {
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
            background: isSelected ? "var(--accent-soft)" : "var(--surface-2)",
            color: isSelected ? "var(--accent-text)" : "var(--text)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s"
          }
        },
        iconKey === "none" ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", fontWeight: 600 } }, "AUTO") : iconSvg
      );
    })
  )), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: "14px 0 0 0" } }, /* @__PURE__ */ React.createElement("label", { className: "pin-toggle", style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: pinned, onChange: (e) => setPinned(e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, "Pin to dashboard")))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("div", null), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: onClose, disabled: saving }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: handleSave, disabled: !canSave }, saving ? "Saving\u2026" : "Save")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(BookmarkManagerApp, null));

var { useState, useMemo, useEffect, useCallback, useRef } = React;
function BookmarksHero() {
  const [bookmarks, setBookmarks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [bookmarkMeta, setBookmarkMeta] = useState({});
  const [activeFolderId, setActiveFolderId] = useState("1");
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState([]);
  const refresh = useCallback(async () => {
    const [tree, meta] = await Promise.all([
      window.Bookmarks.getTree(),
      window.getStorage(window.STORAGE_KEYS.bookmarkMeta, {})
    ]);
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
  useEffect(() => {
    window.getStorage(window.STORAGE_KEYS.view, "list").then(setView);
    window.getStorage(window.STORAGE_KEYS.folder, "all").then(setActiveFolderId);
    window.getStorage(window.STORAGE_KEYS.treeExpanded, ["1", "2"]).then(setExpandedFolders);
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
    const next = expandedFolders.includes(id) ? expandedFolders.filter((x) => x !== id) : [...expandedFolders, id];
    setExpandedFolders(next);
    window.setStorage(window.STORAGE_KEYS.treeExpanded, next);
  };
  const folderDescendantIds = useMemo(() => {
    const childMap = {};
    for (const f of folders) {
      if (!childMap[f.parentId]) childMap[f.parentId] = [];
      childMap[f.parentId].push(f.id);
    }
    const result = {};
    for (const f of folders) {
      const ids = /* @__PURE__ */ new Set([f.id]);
      const stack = [...childMap[f.id] || []];
      while (stack.length) {
        const x = stack.pop();
        if (ids.has(x)) continue;
        ids.add(x);
        for (const c of childMap[x] || []) stack.push(c);
      }
      result[f.id] = ids;
    }
    return result;
  }, [folders]);
  const filtered = useMemo(() => {
    let items = bookmarks;
    if (activeFolderId !== "all") {
      const allowed = folderDescendantIds[activeFolderId] || /* @__PURE__ */ new Set([activeFolderId]);
      items = items.filter((x) => allowed.has(x.parentId));
    }
    const q = query.toLowerCase().trim();
    if (q) {
      items = items.filter(
        (x) => x.title.toLowerCase().includes(q) || x.url.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      const pa = bookmarkMeta[a.id]?.pinned ? 0 : 1;
      const pb = bookmarkMeta[b.id]?.pinned ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [bookmarks, bookmarkMeta, activeFolderId, query, folderDescendantIds]);
  const pinned = bookmarks.filter((b) => bookmarkMeta[b.id]?.pinned);
  const togglePin = async (id) => {
    const next = { ...bookmarkMeta, [id]: { ...bookmarkMeta[id] || {}, pinned: !bookmarkMeta[id]?.pinned } };
    setBookmarkMeta(next);
    await window.setStorage(window.STORAGE_KEYS.bookmarkMeta, next);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "card hero-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 10 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 } }, "Bookmarks"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-mute)" } }, bookmarks.length, " saved \xB7 ", folders.length, " folders")), /* @__PURE__ */ React.createElement("a", { href: "manager.html", className: "card-action" }, "Manage \u2192")), /* @__PURE__ */ React.createElement("div", { className: "bm-controls", style: { display: "flex", gap: 12, marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "bm-search", style: { flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "0 14px", height: 36 } }, /* @__PURE__ */ React.createElement(Icon.search, { size: 15, style: { color: "var(--text-mute)" } }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Filter bookmarks...",
      value: query,
      onChange: (e) => setQuery(e.target.value),
      style: { background: "none", border: 0, outline: 0, fontSize: 13.5, width: "100%" }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "view-toggle", style: { display: "flex", background: "var(--surface-2)", borderRadius: 8, padding: 2 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: view === "list" ? "active" : "",
      onClick: () => handleSetView("list"),
      style: { padding: "4px 8px", borderRadius: 6 }
    },
    /* @__PURE__ */ React.createElement(Icon.listIcon, { size: 16 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: view === "grid" ? "active" : "",
      onClick: () => handleSetView("grid"),
      style: { padding: "4px 8px", borderRadius: 6 }
    },
    /* @__PURE__ */ React.createElement(Icon.gridIcon, { size: 16 })
  ))), pinned.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "pinned-row" }, pinned.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, className: "pin-chip" }, /* @__PURE__ */ React.createElement("a", { href: b.url, className: "pin-chip-link" }, /* @__PURE__ */ React.createElement("div", { className: "pin-chip-fav", style: { background: bookmarkMeta[b.id]?.color || "var(--surface-2)" } }, bookmarkMeta[b.id]?.initial || b.title[0]), /* @__PURE__ */ React.createElement("span", { className: "pin-chip-name" }, b.title)), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "pin-chip-x",
      title: "Unpin",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(b.id);
      }
    },
    /* @__PURE__ */ React.createElement(Icon.close, { size: 12 })
  )))), /* @__PURE__ */ React.createElement("div", { className: "bm-body " + (view === "grid" ? "grid-mode" : "list-mode"), style: { display: "grid", gridTemplateColumns: view === "list" ? "280px 1fr" : "1fr", gap: 24 } }, view === "list" && /* @__PURE__ */ React.createElement("div", { className: "bm-tree" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "tree-node tree-node-all" + (activeFolderId === "all" ? " selected" : ""),
      onClick: () => handleSetFolder("all")
    },
    /* @__PURE__ */ React.createElement("span", { className: "tree-chevron placeholder" }, /* @__PURE__ */ React.createElement(ChevronGlyph, null)),
    /* @__PURE__ */ React.createElement("span", { className: "tree-icon" }, /* @__PURE__ */ React.createElement(Icon.zap, { size: 15 })),
    /* @__PURE__ */ React.createElement("span", { className: "tree-label" }, "All Bookmarks"),
    /* @__PURE__ */ React.createElement("span", { className: "tree-count" }, bookmarks.length)
  ), folders.filter((f) => f.parentId === "0").map((f) => /* @__PURE__ */ React.createElement(
    TreeNode,
    {
      key: f.id,
      node: f,
      depth: 0,
      activeId: activeFolderId,
      onSelect: handleSetFolder,
      expandedIds: expandedFolders,
      onToggle: toggleExpand
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: view === "grid" ? "bm-grid" : "bm-list", style: { display: view === "grid" ? "grid" : "block", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 } }, filtered.map((b) => /* @__PURE__ */ React.createElement(
    BookmarkItem,
    {
      key: b.id,
      bookmark: b,
      meta: bookmarkMeta[b.id],
      view,
      isPinned: !!bookmarkMeta[b.id]?.pinned,
      onTogglePin: () => togglePin(b.id)
    }
  )), filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: 40, color: "var(--text-faint)", fontSize: 13 } }, "No bookmarks found"))));
}
function ChevronGlyph() {
  return /* @__PURE__ */ React.createElement("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "3.5 2 6.5 5 3.5 8" }));
}
function TreeNode({ node, depth, activeId, onSelect, expandedIds, onToggle }) {
  const isExpanded = expandedIds.includes(node.id);
  const isSelected = activeId === node.id;
  const subFolders = (node.children || []).filter((c) => c.children);
  const directBookmarkCount = (node.children || []).filter((c) => c.url).length;
  const hasChildren = subFolders.length > 0;
  return /* @__PURE__ */ React.createElement("div", { className: "tree-group" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "tree-node" + (isSelected ? " selected" : ""),
      style: { paddingLeft: 8 + depth * 14 },
      onClick: () => onSelect(node.id)
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "tree-chevron" + (isExpanded ? " expanded" : "") + (hasChildren ? "" : " placeholder"),
        onClick: (e) => {
          e.stopPropagation();
          if (hasChildren) onToggle(e, node.id);
        }
      },
      /* @__PURE__ */ React.createElement(ChevronGlyph, null)
    ),
    /* @__PURE__ */ React.createElement("span", { className: "tree-icon" }, /* @__PURE__ */ React.createElement(Icon.folder, { size: 15 })),
    /* @__PURE__ */ React.createElement("span", { className: "tree-label" }, node.title || "(untitled)"),
    directBookmarkCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "tree-count" }, directBookmarkCount)
  ), isExpanded && hasChildren && /* @__PURE__ */ React.createElement("div", { className: "tree-children" }, subFolders.map((c) => /* @__PURE__ */ React.createElement(
    TreeNode,
    {
      key: c.id,
      node: c,
      depth: depth + 1,
      activeId,
      onSelect,
      expandedIds,
      onToggle
    }
  ))));
}
function BookmarkItem({ bookmark, meta, view, isPinned, onTogglePin }) {
  const host = useMemo(() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch (e) {
      return "";
    }
  }, [bookmark.url]);
  const pinBtn = /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "bm-pin-btn" + (isPinned ? " active" : ""),
      title: isPinned ? "Unpin" : "Pin",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onTogglePin && onTogglePin();
      }
    },
    /* @__PURE__ */ React.createElement(Icon.pin, { size: 13 })
  );
  if (view === "grid") {
    return /* @__PURE__ */ React.createElement("div", { className: "bm-card-wrap", style: { display: "flex", height: "100%" } }, /* @__PURE__ */ React.createElement("a", { href: bookmark.url, className: "bm-card", style: { flex: 1, padding: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 8, textDecoration: "none", color: "inherit", height: "100%", boxSizing: "border-box" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 8, background: meta?.color || "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--text)" } }, /* @__PURE__ */ React.createElement(window.BookmarkIcon, { url: bookmark.url, title: bookmark.title, meta })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, bookmark.title), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-mute)", marginTop: "auto" } }, host)), pinBtn);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "bm-row-wrap" }, /* @__PURE__ */ React.createElement("a", { href: bookmark.url, className: "bm-row", style: { display: "grid", gridTemplateColumns: "36px 1fr auto auto", gap: 14, padding: 12, borderRadius: 12, alignItems: "center", textDecoration: "none", color: "inherit" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: meta?.color || "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--text)" } }, /* @__PURE__ */ React.createElement(window.BookmarkIcon, { url: bookmark.url, title: bookmark.title, meta })), /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 } }, bookmark.title, meta?.tag && /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--accent-text)", background: "var(--accent-soft)", padding: "1px 6px", borderRadius: 4 } }, meta.tag)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "var(--text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, meta?.desc)), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-mute)", textAlign: "right" } }, host), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", textAlign: "right", whiteSpace: "nowrap" } }, new Date(bookmark.dateAdded).toLocaleDateString())), pinBtn);
}
window.BookmarksHero = BookmarksHero;

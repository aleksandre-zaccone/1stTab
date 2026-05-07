function BookmarksHero({
  folders,
  bookmarks,
  activeFolderId,
  setActiveFolderId,
  view,
  setView,
  // 'grid' | 'list'
  onOpenManager,
  onAddQuick,
  onOpenBookmark
}) {
  const [query, setQuery] = useState("");
  const isAll = activeFolderId === "f-all";
  const folderItems = isAll ? bookmarks : bookmarks.filter((b) => b.folderId === activeFolderId);
  const q = query.trim().toLowerCase();
  const items = !q ? folderItems : folderItems.filter(
    (b) => b.name.toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q) || hostnameOf(b.url).toLowerCase().includes(q) || (b.tags || []).some((t) => t.toLowerCase().includes(q))
  );
  const sorted = [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  const pinnedAcrossAll = bookmarks.filter((b) => b.pinned).slice(0, 6);
  return /* @__PURE__ */ React.createElement("div", { className: "hero-card" }, /* @__PURE__ */ React.createElement("div", { className: "hero-head" }, /* @__PURE__ */ React.createElement("div", { className: "hero-title-row" }, /* @__PURE__ */ React.createElement("h2", { className: "hero-title" }, "Bookmarks"), /* @__PURE__ */ React.createElement("span", { className: "hero-count" }, bookmarks.length, " saved \xB7 ", folders.length, " folders")), /* @__PURE__ */ React.createElement("div", { className: "hero-tools" }, /* @__PURE__ */ React.createElement("div", { className: "search-input hero-search" }, /* @__PURE__ */ React.createElement(Icon.search, { size: 16 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      placeholder: "Search bookmarks, tags, sites\u2026",
      value: query,
      onChange: (e) => setQuery(e.target.value)
    }
  ), query && /* @__PURE__ */ React.createElement("button", { className: "icon-btn", style: { width: 24, height: 24 }, onClick: () => setQuery(""), "aria-label": "Clear" }, /* @__PURE__ */ React.createElement(Icon.close, { size: 14 }))), /* @__PURE__ */ React.createElement("div", { className: "view-toggle", role: "tablist", "aria-label": "View" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "view-btn" + (view === "grid" ? " active" : ""),
      onClick: () => setView("grid"),
      title: "Grid view",
      role: "tab",
      "aria-selected": view === "grid"
    },
    /* @__PURE__ */ React.createElement(Icon.gridIcon, { size: 16 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "view-btn" + (view === "list" ? " active" : ""),
      onClick: () => setView("list"),
      title: "List view",
      role: "tab",
      "aria-selected": view === "list"
    },
    /* @__PURE__ */ React.createElement(Icon.listIcon, { size: 16 })
  )), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: onAddQuick }, /* @__PURE__ */ React.createElement(Icon.plus, { size: 14 }), " Add"), /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onOpenManager }, /* @__PURE__ */ React.createElement(Icon.settings, { size: 14 }), " Manage"))), !query && pinnedAcrossAll.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "pinned-strip" }, /* @__PURE__ */ React.createElement("div", { className: "pinned-label" }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 11 }), " ", /* @__PURE__ */ React.createElement("span", null, "Pinned")), /* @__PURE__ */ React.createElement("div", { className: "pinned-row" }, pinnedAcrossAll.map((b) => /* @__PURE__ */ React.createElement("button", { key: b.id, className: "pinned-tile", onClick: () => onOpenBookmark(b), title: b.name }, /* @__PURE__ */ React.createElement(BookmarkFavicon, { url: b.url, name: b.name, size: 28 }), /* @__PURE__ */ React.createElement("span", { className: "pinned-name" }, b.name))))), /* @__PURE__ */ React.createElement("div", { className: "hero-tabs", role: "tablist" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      key: "f-all",
      className: "hero-tab" + (isAll ? " active" : ""),
      onClick: () => setActiveFolderId("f-all"),
      role: "tab",
      "aria-selected": isAll
    },
    /* @__PURE__ */ React.createElement(Icon.gridIcon, { size: 14 }),
    /* @__PURE__ */ React.createElement("span", null, "All"),
    /* @__PURE__ */ React.createElement("span", { className: "count" }, bookmarks.length)
  ), folders.map((f) => {
    const count = bookmarks.filter((b) => b.folderId === f.id).length;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: f.id,
        className: "hero-tab" + (f.id === activeFolderId ? " active" : ""),
        onClick: () => setActiveFolderId(f.id),
        role: "tab",
        "aria-selected": f.id === activeFolderId
      },
      /* @__PURE__ */ React.createElement(Icon.folder, { size: 14 }),
      /* @__PURE__ */ React.createElement("span", null, f.name),
      /* @__PURE__ */ React.createElement("span", { className: "count" }, count)
    );
  })), sorted.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "empty" }, query ? `No matches for "${query}".` : "No bookmarks in this folder yet.", !query && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onAddQuick, style: { padding: "0 6px" } }, "Add one"))) : view === "grid" ? /* @__PURE__ */ React.createElement(BookmarkGrid, { items: sorted, onOpen: onOpenBookmark }) : /* @__PURE__ */ React.createElement(BookmarkListView, { items: sorted, folders, onOpen: onOpenBookmark }));
}
function BookmarkGrid({ items, onOpen }) {
  return /* @__PURE__ */ React.createElement("div", { className: "bm-grid" }, items.map((b) => /* @__PURE__ */ React.createElement("button", { key: b.id, className: "bm-card", onClick: () => onOpen(b) }, /* @__PURE__ */ React.createElement("div", { className: "bm-card-head" }, /* @__PURE__ */ React.createElement(BookmarkFavicon, { url: b.url, name: b.name, size: 32 }), b.pinned && /* @__PURE__ */ React.createElement("span", { className: "bm-pin" }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 10 }))), /* @__PURE__ */ React.createElement("div", { className: "bm-card-name" }, b.name), /* @__PURE__ */ React.createElement("div", { className: "bm-card-host" }, hostnameOf(b.url)), b.description && /* @__PURE__ */ React.createElement("div", { className: "bm-card-desc" }, b.description), /* @__PURE__ */ React.createElement("div", { className: "bm-card-foot" }, /* @__PURE__ */ React.createElement("div", { className: "bm-tags" }, (b.tags || []).slice(0, 3).map((t) => /* @__PURE__ */ React.createElement("span", { key: t, className: "bm-tag" }, "#", t))), /* @__PURE__ */ React.createElement("span", { className: "bm-time" }, relativeTime(b.lastVisited))))));
}
function BookmarkListView({ items, folders, onOpen }) {
  const folderName = (id) => folders.find((f) => f.id === id)?.name || "";
  return /* @__PURE__ */ React.createElement("div", { className: "bm-list" }, items.map((b) => /* @__PURE__ */ React.createElement("button", { key: b.id, className: "bm-list-row", onClick: () => onOpen(b) }, /* @__PURE__ */ React.createElement(BookmarkFavicon, { url: b.url, name: b.name, size: 36 }), /* @__PURE__ */ React.createElement("div", { className: "bm-list-main" }, /* @__PURE__ */ React.createElement("div", { className: "bm-list-name-row" }, /* @__PURE__ */ React.createElement("span", { className: "bm-list-name" }, b.name), b.pinned && /* @__PURE__ */ React.createElement("span", { className: "bm-pin inline" }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 10 })), (b.tags || []).slice(0, 4).map((t) => /* @__PURE__ */ React.createElement("span", { key: t, className: "bm-tag" }, "#", t))), b.description && /* @__PURE__ */ React.createElement("div", { className: "bm-list-desc" }, b.description), /* @__PURE__ */ React.createElement("div", { className: "bm-list-host" }, hostnameOf(b.url))), /* @__PURE__ */ React.createElement("div", { className: "bm-list-meta" }, /* @__PURE__ */ React.createElement("div", { className: "bm-list-folder" }, folderName(b.folderId)), /* @__PURE__ */ React.createElement("div", { className: "bm-list-time" }, relativeTime(b.lastVisited))))));
}
function BookmarkFavicon({ url, name, size = 32 }) {
  const [errored, setErrored] = useState(false);
  const src = faviconUrl(url, size * 2);
  if (errored || !src) {
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "bm-favicon-fallback",
        style: {
          width: size,
          height: size,
          background: colorForString(url),
          fontSize: Math.max(11, Math.round(size * 0.42))
        }
      },
      initialFromUrl(url, name)
    );
  }
  return /* @__PURE__ */ React.createElement("span", { className: "bm-favicon", style: { width: size, height: size } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src,
      alt: "",
      width: Math.round(size * 0.7),
      height: Math.round(size * 0.7),
      onError: () => setErrored(true),
      loading: "lazy"
    }
  ));
}
window.BookmarksHero = BookmarksHero;
window.BookmarkFavicon = BookmarkFavicon;

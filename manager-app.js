var { useState, useMemo, useEffect, useCallback, useRef } = React;
function ManagerPageApp() {
  const [folders, setFolders] = window.useStorage(STORAGE_KEYS.folders, SEED_FOLDERS, false);
  const [bookmarks, setBookmarks] = window.useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS, false);
  const [activeFolderId, setActiveFolderId] = useState(() => folders[0]?.id || "f-favorites");
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [toast, setToast] = useState(null);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast((t) => t === msg ? null : t), 1800);
  }
  function saveBookmark() {
    let { id, folderId, name, url, description, tags, pinned } = editingBookmark;
    name = (name || "").trim();
    url = (url || "").trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const tagArr = Array.isArray(tags) ? tags : (tags || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (id) {
      setBookmarks(bookmarks.map((b) => b.id === id ? { ...b, folderId, name, url, description, tags: tagArr, pinned: !!pinned } : b));
      showToast("Saved");
    } else {
      setBookmarks([...bookmarks, {
        id: uid(),
        folderId,
        name,
        url,
        description,
        tags: tagArr,
        pinned: !!pinned,
        visits: 0,
        lastVisited: Date.now()
      }]);
      showToast("Bookmark added");
    }
    setEditingBookmark(null);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("span", { className: "brand-dot" }), /* @__PURE__ */ React.createElement("div", { className: "brand-text" }, /* @__PURE__ */ React.createElement("span", { className: "brand-main" }, "Dashboard"), /* @__PURE__ */ React.createElement("span", { className: "brand-sub" }, "Bookmark Manager"))), /* @__PURE__ */ React.createElement("div", { className: "topbar-actions" }, /* @__PURE__ */ React.createElement("a", { className: "btn text", href: "newtab.html" }, "\u2190 Dashboard"))), /* @__PURE__ */ React.createElement(
    BookmarkManager,
    {
      folders,
      setFolders,
      bookmarks,
      setBookmarks,
      activeFolderId,
      setActiveFolderId,
      onClose: () => {
        window.location.href = "newtab.html";
      },
      onEditBookmark: (b) => setEditingBookmark({ ...b, tags: (b.tags || []).join(", ") }),
      showToast,
      fullPage: true
    }
  ), editingBookmark && /* @__PURE__ */ React.createElement(
    ManagerBookmarkDialog,
    {
      value: editingBookmark,
      folders,
      onChange: setEditingBookmark,
      onClose: () => setEditingBookmark(null),
      onSave: saveBookmark
    }
  ), toast && /* @__PURE__ */ React.createElement("div", { className: "toast" }, toast));
}
function ManagerBookmarkDialog({ value, folders, onChange, onClose, onSave }) {
  const v = value;
  const set = (k, val) => onChange({ ...v, [k]: val });
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", style: { zIndex: 1100 }, onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 480 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, v.id ? "Edit bookmark" : "New bookmark"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form" }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "48px 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Icon"), /* @__PURE__ */ React.createElement("input", { value: v.emoji || "", onChange: (e) => set("emoji", e.target.value), maxLength: 2, style: { textAlign: "center", padding: "0", fontSize: "16px" }, placeholder: "\u2B50" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Name"), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: v.name, onChange: (e) => set("name", e.target.value), placeholder: "Project tracker" }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "URL"), /* @__PURE__ */ React.createElement("input", { value: v.url, onChange: (e) => set("url", e.target.value), placeholder: "https://example.com" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Description (optional)"), /* @__PURE__ */ React.createElement("textarea", { value: v.description || "", onChange: (e) => set("description", e.target.value), placeholder: "Why you saved this\u2026", rows: 3 })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Folder"), /* @__PURE__ */ React.createElement("select", { value: v.folderId, onChange: (e) => set("folderId", e.target.value) }, folders.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Tags (comma-separated)"), /* @__PURE__ */ React.createElement("input", { value: Array.isArray(v.tags) ? v.tags.join(", ") : v.tags || "", onChange: (e) => set("tags", e.target.value), placeholder: "daily, news" }))), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!v.pinned, onChange: (e) => set("pinned", e.target.checked) }), " Pin to top")), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: onSave }, "Save"))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ManagerPageApp, null));

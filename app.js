var { useState, useEffect, useMemo, useCallback, useRef } = React;
{
  const translations = {
    "settings": "Settings",
    "bookmarks": "Bookmarks",
    "notes": "Notes",
    "todo": "To-Do",
    "search": "Search",
    "quick_links": "Quick Links",
    "daily_background": "Daily Background",
    "quote_of_the_day": "Quote of the Day",
    "add_new_bookmark": "Add New Bookmark",
    "edit_bookmark": "Edit Bookmark",
    "delete_bookmark": "Delete Bookmark",
    "save": "Save",
    "cancel": "Cancel",
    "import_bookmarks": "Import Chrome Bookmarks",
    "export_settings": "Export Settings",
    "import_settings": "Import Settings",
    "custom_font": "Custom Font",
    "select_font": "Select Font",
    "character_count": "Character Count",
    "add_note": "Add Note",
    "add_todo": "Add To-Do",
    "clear_completed": "Clear Completed",
    "search_placeholder": "Search...",
    "no_bookmarks_found": "No bookmarks found.",
    "no_notes_found": "No notes found.",
    "no_todos_found": "No to-dos found.",
    "dashboard_title": "Dashboard",
    "greeting_late": "Good evening",
    "greeting_early": "Good morning",
    "greeting_morning": "Good morning",
    "greeting_midday": "Good afternoon",
    "greeting_evening": "Good evening",
    "stored_locally": "Stored locally ({count} bookmarks, {folders} folders)",
    "manage_bookmarks": "Manage Bookmarks",
    "click_to_change": "Click to change",
    "search_or_enter_url": "Search or enter URL",
    "your_name": "Your name",
    "display_name": "Display name",
    "city": "City",
    "mock_data_note": "Uses mock data \u2014 any city name is shown verbatim.",
    "custom_font_label": "Custom Font",
    "select_font_label": "Select Font",
    "icon_picker_aria_label": "Icon Picker",
    "use_website_favicon": "Use Website Favicon",
    "custom_placeholder": "Custom",
    "bookmark_name_label": "Name",
    "bookmark_url_label": "URL",
    "bookmark_description_label": "Description (optional)",
    "bookmark_folder_label": "Folder",
    "bookmark_tags_label": "Tags (comma-separated)",
    "pin_to_top_label": "Pin to top",
    "edit_bookmark_title": "Edit bookmark",
    "new_bookmark_title": "New bookmark",
    "time_zones_title": "Time zones",
    "zone_label_label": "Label",
    "time_zone_label": "Time zone",
    "add_another_button": "Add another",
    "cancel_button": "Cancel",
    "save_button": "Save",
    "brand_main_text": "Dashboard",
    "arcade_net_title": "\u2605 ARCADE NET \u2605"
  };
  const _t = (key, params) => {
    let value = key.split(".").reduce((obj, k) => obj?.[k], translations);
    if (typeof value === "string") {
      if (params) {
        for (const param in params) {
          value = value.replace(`{${param}}`, params[param]);
        }
      }
      return value;
    }
    return key;
  };
  window.useI18n = () => ({ t: _t });
}
function setGlobalBg(css) {
  let el = document.getElementById("dash-bg-style");
  if (!el) {
    el = document.createElement("style");
    el.id = "dash-bg-style";
    document.head.appendChild(el);
  }
  el.textContent = css ? `:root:root:root body { ${css} }` : "";
}
function useTheme(prefTheme) {
  useEffect(() => {
    const apply = () => {
      let mode = prefTheme;
      if (mode === "auto") mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", mode);
    };
    apply();
    if (prefTheme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [prefTheme]);
}
function greetingFor(now, t) {
  const h = now.getHours();
  let group = "evening";
  if (h < 5) group = "late";
  else if (h < 9) group = "early";
  else if (h < 12) group = "morning";
  else if (h < 18) group = "midday";
  return t(`greeting_${group}`);
}
function App() {
  const { t } = window.useI18n();
  const [folders, setFolders] = window.useStorage(STORAGE_KEYS.folders, SEED_FOLDERS, false);
  const [bookmarks, setBookmarks] = window.useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS, false);
  const [zones, setZones] = window.useStorage(STORAGE_KEYS.zones, defaultZones(), true);
  const [prefsRaw, setPrefsRaw] = window.useStorage(STORAGE_KEYS.prefs, {}, true);
  const [bgUploads, setBgUploads] = window.useStorage(STORAGE_KEYS.bgUploads, [], false);
  const [activeFolderId, setActiveFolderId] = useState("f-all");
  const [view, setView] = window.useStorage("dash.view", "grid", true);
  const [editingZones, setEditingZones] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const prefs = { ...DEFAULT_PREFS, ...prefsRaw };
  const setPrefs = useCallback((newVal) => {
    setPrefsRaw((prevRaw) => {
      const merged = { ...DEFAULT_PREFS, ...prevRaw };
      return typeof newVal === "function" ? newVal(merged) : newVal;
    });
  }, [setPrefsRaw]);
  const initTweaks = {
    ...window.__TWEAK_DEFAULTS || { mode: "material-light", background: "floor", arcade: "pacmaze", scanlines: true },
    ...loadJSON("dash.tweaks", {})
  };
  const [tweaks, setTweak] = useTweaks(initTweaks);
  const mode = tweaks.mode || "material-light";
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    if (mode === "arcade") {
      document.documentElement.setAttribute("data-arcade", tweaks.arcade || "synthwave");
    } else {
      document.documentElement.removeAttribute("data-arcade");
    }
  }, [mode, tweaks.arcade]);
  useEffect(() => {
    const upload = bgUploads.find((u) => u.id === prefs.bgId);
    const builtin = BUILTIN_BACKGROUNDS.find((b) => b.id === prefs.bgId);
    if (upload) {
      setGlobalBg(`background-image: url("${upload.url}") !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; background-repeat: no-repeat !important;`);
      document.body.setAttribute("data-bg", "custom");
    } else if (builtin) {
      if (builtin.id === "bg-daily") {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const url = `https://picsum.photos/seed/${today}/1920/1080`;
        setGlobalBg(`background-image: url("${url}") !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; background-repeat: no-repeat !important;`);
      } else {
        setGlobalBg(`background: ${builtin.value} !important; background-size: auto !important;`);
      }
      document.body.setAttribute("data-bg", builtin.id);
    } else {
      setGlobalBg("");
      document.body.setAttribute("data-bg", mode === "arcade" ? tweaks.background || "floor" : "solid");
    }
  }, [mode, tweaks.background, prefs.bgId, bgUploads]);
  useEffect(() => {
    const on = mode === "arcade" && tweaks.scanlines !== false;
    document.documentElement.style.setProperty("--scan-on", on ? "1" : "0");
  }, [mode, tweaks.scanlines]);
  useTheme(prefs.theme);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast((t2) => t2 === msg ? null : t2), 1800);
  }
  function toggleUnits() {
    setPrefs({ ...prefs, units: prefs.units === "F" ? "C" : "F" });
  }
  function openBookmark(b) {
    setBookmarks(bookmarks.map((x) => x.id === b.id ? { ...x, visits: (x.visits || 0) + 1, lastVisited: Date.now() } : x));
    window.open(b.url, "_blank", "noreferrer");
  }
  function startQuickAdd() {
    const folderId = activeFolderId === "f-all" ? folders[0]?.id || "f-work" : activeFolderId;
    setEditingBookmark({ folderId, name: "", url: "", description: "", tags: [], pinned: false });
  }
  function saveBookmark() {
    let { id, folderId, name, url, description, tags, pinned, emoji } = editingBookmark;
    name = (name || "").trim();
    url = (url || "").trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const tagArr = Array.isArray(tags) ? tags : (tags || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (id) {
      setBookmarks(bookmarks.map((b) => b.id === id ? { ...b, folderId, name, url, description, tags: tagArr, pinned: !!pinned, emoji } : b));
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
        lastVisited: Date.now(),
        emoji
      }]);
      showToast("Bookmark added");
    }
    setEditingBookmark(null);
  }
  const searchRef = useRef(null);
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
      if (e.key === "/" || (e.metaKey || e.ctrlKey) && e.key === "k") {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  function onSearchSubmit(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    const isUrl = /^https?:\/\//i.test(q) || q.includes(".") && !q.includes(" ");
    if (isUrl) {
      window.open(/^https?:\/\//i.test(q) ? q : "https://" + q, "_blank", "noreferrer");
      return;
    }
    let searchUrl = "https://www.google.com/search?q=";
    if (prefs.searchEngine === "duckduckgo") searchUrl = "https://duckduckgo.com/?q=";
    else if (prefs.searchEngine === "bing") searchUrl = "https://www.bing.com/search?q=";
    else if (prefs.searchEngine === "brave") searchUrl = "https://search.brave.com/search?q=";
    window.open(searchUrl + encodeURIComponent(q), "_blank", "noreferrer");
  }
  const now = (window.useNow || useNow)(6e4);
  const fontUrl = useMemo(() => {
    if (!prefs.fontFamily || prefs.fontFamily === "default") return null;
    const fonts = {
      "Inter": "Inter:wght@400;500;700",
      "Roboto": "Roboto:wght@400;500;700",
      "Outfit": "Outfit:wght@400;500;700",
      "VT323": "VT323"
    };
    if (fonts[prefs.fontFamily]) {
      return `https://fonts.googleapis.com/css2?family=${fonts[prefs.fontFamily]}&display=swap`;
    }
    return null;
  }, [prefs.fontFamily]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, fontUrl && /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: fontUrl }), prefs.fontFamily && prefs.fontFamily !== "default" && /* @__PURE__ */ React.createElement("style", { dangerouslySetInnerHTML: { __html: `
          :root[data-mode="material-light"] body,
          :root[data-mode="material-dark"] body,
          body, .brand, .clock-time, .clock-label, .greeting, .greeting-sub, .clock-off, .btn {
            font-family: '${prefs.fontFamily}', sans-serif !important;
          }
        ` } }), /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("span", { className: "brand-dot" }), /* @__PURE__ */ React.createElement("div", { className: "brand-text" }, mode === "arcade" ? /* @__PURE__ */ React.createElement("span", { className: "brand-main" }, t("arcade_net_title")) : /* @__PURE__ */ React.createElement("span", { className: "brand-main" }, t("dashboard_title") || "Dashboard"), /* @__PURE__ */ React.createElement("span", { className: "brand-sub" }, greetingFor(now, t), ", ", /* @__PURE__ */ React.createElement("span", { className: "brand-name", onClick: () => setEditingName(true), title: t("click_to_change") }, prefs.name), " ", t("brand_sub_text_date_separator"), " ", new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(now)))), /* @__PURE__ */ React.createElement("form", { className: "topbar-search", onSubmit: onSearchSubmit }, /* @__PURE__ */ React.createElement(Icon.search, { size: 18 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: searchRef,
      name: "q",
      placeholder: mode === "arcade" ? t("search_or_enter_url") : t("search_placeholder"),
      autoComplete: "off"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "search-engine" }, mode === "arcade" ? "\u21B5 GO" : "\u21B5")), /* @__PURE__ */ React.createElement("div", { className: "topbar-actions" }, /* @__PURE__ */ React.createElement("a", { className: "icon-btn", href: chrome.runtime.getURL("settings.html"), "aria-label": t("settings"), title: t("settings") }, /* @__PURE__ */ React.createElement(Icon.settings, { size: 20 })), /* @__PURE__ */ React.createElement("a", { className: "icon-btn", href: "manager.html", "aria-label": t("manage_bookmarks"), title: t("manage_bookmarks") }, /* @__PURE__ */ React.createElement(Icon.folder, { size: 20 })))), /* @__PURE__ */ React.createElement("div", { className: "main-layout" }, /* @__PURE__ */ React.createElement("aside", { className: "sidebar sidebar-left" }, /* @__PURE__ */ React.createElement(ClocksPanel, { zones, onEditZones: () => setEditingZones(true) })), /* @__PURE__ */ React.createElement("main", { className: "hero-main" }, /* @__PURE__ */ React.createElement(QuickLinks, { bookmarks, onOpen: openBookmark }), /* @__PURE__ */ React.createElement(
    BookmarksHero,
    {
      folders,
      bookmarks,
      activeFolderId,
      setActiveFolderId,
      view,
      setView,
      onOpenManager: () => {
        window.location.href = "manager.html";
      },
      onAddQuick: startQuickAdd,
      onOpenBookmark: openBookmark
    }
  )), /* @__PURE__ */ React.createElement("aside", { className: "sidebar sidebar-right" }, /* @__PURE__ */ React.createElement(
    WeatherPanel,
    {
      city: prefs.weatherCity,
      units: prefs.units,
      onToggleUnits: toggleUnits,
      onEditCity: () => setEditingCity(true)
    }
  ), /* @__PURE__ */ React.createElement(TodoWidget, null), /* @__PURE__ */ React.createElement(NotesWidget, null))), /* @__PURE__ */ React.createElement(QuoteWidget, null), /* @__PURE__ */ React.createElement("footer", { className: "foot" }, mode === "arcade" ? t("arcade_net_title") : t("stored_locally", { count: bookmarks.length, folders: folders.length }))), editingBookmark && /* @__PURE__ */ React.createElement(
    BookmarkDialog,
    {
      value: editingBookmark,
      folders,
      onChange: setEditingBookmark,
      onClose: () => setEditingBookmark(null),
      onSave: saveBookmark
    }
  ), editingZones && /* @__PURE__ */ React.createElement(ZonesDialog, { zones, setZones, onClose: () => setEditingZones(false) }), editingCity && /* @__PURE__ */ React.createElement(EditDialog, { title: t("your_name"), onClose: () => setEditingCity(false), onSave: () => setEditingCity(false) }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, t("city")), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: prefs.weatherCity, onChange: (e) => setPrefs({ ...prefs, weatherCity: e.target.value }) })), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "var(--text-3)", margin: 0 } }, t("mock_data_note"))), editingName && /* @__PURE__ */ React.createElement(EditDialog, { title: t("your_name"), onClose: () => setEditingName(false), onSave: () => setEditingName(false) }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, t("display_name")), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: prefs.name, onChange: (e) => setPrefs({ ...prefs, name: e.target.value }) }))), /* @__PURE__ */ React.createElement(TweaksPanel, { title: t("custom_font_label") }, " ", /* @__PURE__ */ React.createElement(TweakSection, { label: "Mode" }), /* @__PURE__ */ React.createElement(
    TweakRadio,
    {
      label: "Theme",
      value: mode,
      onChange: (v) => setTweak("mode", v),
      options: [
        { value: "material-light", label: "Light" },
        { value: "material-dark", label: "Dark" },
        { value: "arcade", label: "Arcade" }
      ]
    }
  ), mode === "arcade" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TweakSection, { label: "Arcade Cabinet" }), /* @__PURE__ */ React.createElement(
    TweakSelect,
    {
      label: "Style",
      value: tweaks.arcade || "synthwave",
      onChange: (v) => setTweak("arcade", v),
      options: [
        { value: "synthwave", label: "Synthwave (pink/cyan)" },
        { value: "pacmaze", label: "Pac-Maze (yellow/blue)" },
        { value: "gameboy", label: "Game Boy (4-shade green)" },
        { value: "galaga", label: "Galaga (deep space)" },
        { value: "tron", label: "Tron (cyan/orange)" },
        { value: "hotlava", label: "Hot Lava (red/orange)" }
      ]
    }
  ), /* @__PURE__ */ React.createElement(TweakSection, { label: "Background" }), /* @__PURE__ */ React.createElement(
    TweakRadio,
    {
      label: "Style",
      value: tweaks.background || "floor",
      onChange: (v) => setTweak("background", v),
      options: [
        { value: "solid", label: "Solid" },
        { value: "gradient", label: "Glow" },
        { value: "grid", label: "Grid" },
        { value: "floor", label: "Floor" },
        { value: "dotted", label: "Dots" }
      ]
    }
  ), /* @__PURE__ */ React.createElement(TweakSection, { label: "CRT" }), /* @__PURE__ */ React.createElement(TweakToggle, { label: "Scanlines + vignette", value: tweaks.scanlines !== false, onChange: (v) => setTweak("scanlines", v) }))), toast && /* @__PURE__ */ React.createElement("div", { className: "toast" }, toast));
}
const PRESET_ICONS = ["\u{1F310}", "\u2B50", "\u{1F680}", "\u{1F4FA}", "\u{1F4E7}", "\u{1F4DD}", "\u{1F4B0}", "\u{1F6D2}", "\u{1F3AE}", "\u{1F3E0}"];
function BookmarkDialog({ value, folders, onChange, onClose, onSave }) {
  const v = value;
  const set = (k, val) => onChange({ ...v, [k]: val });
  const { t } = window.useI18n();
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", style: { zIndex: 1100 }, onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 480 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, v.id ? t("edit_bookmark_title") : t("new_bookmark_title")), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, t("bookmark_name_label")), " ", /* @__PURE__ */ React.createElement("div", { className: "icon-picker" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "icon-picker-btn" + (!v.emoji ? " active" : ""),
      onClick: () => set("emoji", null),
      title: t("use_website_favicon")
    },
    v.url ? /* @__PURE__ */ React.createElement(BookmarkFavicon, { url: v.url, name: v.name, size: 18 }) : /* @__PURE__ */ React.createElement(Icon.search, { size: 14 })
  ), PRESET_ICONS.map((icon) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: icon,
      className: "icon-picker-btn" + (v.emoji === icon ? " active" : ""),
      onClick: () => set("emoji", icon)
    },
    icon
  )), /* @__PURE__ */ React.createElement("div", { className: "icon-picker-custom" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: PRESET_ICONS.includes(v.emoji) || !v.emoji ? "" : v.emoji,
      onChange: (e) => set("emoji", e.target.value),
      placeholder: t("custom_placeholder"),
      maxLength: 2
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, t("bookmark_name_label")), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: v.name, onChange: (e) => set("name", e.target.value), placeholder: "Project tracker" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, t("bookmark_url_label")), /* @__PURE__ */ React.createElement("input", { value: v.url, onChange: (e) => set("url", e.target.value), placeholder: "https://example.com" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, t("bookmark_description_label")), /* @__PURE__ */ React.createElement("textarea", { value: v.description || "", onChange: (e) => set("description", e.target.value), placeholder: "Why you saved this\u2026", rows: 3 })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, t("bookmark_folder_label")), /* @__PURE__ */ React.createElement("select", { value: v.folderId, onChange: (e) => set("folderId", e.target.value) }, folders.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, t("bookmark_tags_label")), /* @__PURE__ */ React.createElement("input", { value: Array.isArray(v.tags) ? v.tags.join(", ") : v.tags || "", onChange: (e) => set("tags", e.target.value), placeholder: "daily, news" }))), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!v.pinned, onChange: (e) => set("pinned", e.target.checked) }), " ", t("pin_to_top_label"))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onClose }, t("cancel_button")), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: onSave }, t("save_button")))));
}
const COMMON_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Athens",
  "Europe/Moscow",
  "Africa/Lagos",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu"
];
function ZonesDialog({ zones, setZones, onClose }) {
  const [list, setList] = useState(zones);
  const update = (i, patch) => setList(list.map((z, idx) => idx === i ? { ...z, ...patch } : z));
  const save = () => {
    setZones(list);
    onClose();
  };
  const add = () => {
    if (list.length >= 3) return;
    setList([...list, { id: "z-" + Math.random().toString(36).slice(2, 6), label: "Custom", tz: "Europe/London" }]);
  };
  const remove = (i) => {
    if (i === 0) return;
    setList(list.filter((_, idx) => idx !== i));
  };
  const { t } = window.useI18n();
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 480 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, t("time_zones_title")), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form" }, list.map((z, i) => /* @__PURE__ */ React.createElement("div", { key: z.id, style: { display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 8, marginBottom: 10, alignItems: "end" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, i === 0 ? t("zone_label_label") : t("zone_label_label")), " ", /* @__PURE__ */ React.createElement("input", { value: z.label, onChange: (e) => update(i, { label: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, t("time_zone_label")), /* @__PURE__ */ React.createElement("select", { value: z.tz, onChange: (e) => update(i, { tz: e.target.value }) }, [z.tz, ...COMMON_ZONES.filter((t2) => t2 !== z.tz)].map((t2) => /* @__PURE__ */ React.createElement("option", { key: t2, value: t2 }, t2)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "icon-btn",
      onClick: () => remove(i),
      disabled: i === 0,
      style: { opacity: i === 0 ? 0.3 : 1, marginBottom: 2 },
      "aria-label": "Remove"
    },
    /* @__PURE__ */ React.createElement(Icon.trash, { size: 16 })
  ))), list.length < 3 && /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: add }, /* @__PURE__ */ React.createElement(Icon.plus, { size: 14 }), " ", t("add_another_button"))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onClose }, t("cancel_button")), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: save }, t("save_button")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));

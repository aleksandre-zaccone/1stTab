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
function greetingFor(now) {
  const h = now.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
function App() {
  const [folders, setFolders] = useState(() => loadJSON(STORAGE_KEYS.folders, SEED_FOLDERS));
  const [bookmarks, setBookmarks] = useState(() => loadJSON(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS));
  const [zones, setZones] = useState(() => loadJSON(STORAGE_KEYS.zones, defaultZones()));
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...loadJSON(STORAGE_KEYS.prefs, {}) }));
  const [bgUploads, setBgUploads] = useState(() => loadJSON(STORAGE_KEYS.bgUploads, []));
  const [activeFolderId, setActiveFolderId] = useState("f-all");
  const [view, setView] = useState(() => loadJSON("dash.view", "grid"));
  const [editingZones, setEditingZones] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => saveJSON(STORAGE_KEYS.folders, folders), [folders]);
  useEffect(() => saveJSON(STORAGE_KEYS.bookmarks, bookmarks), [bookmarks]);
  useEffect(() => saveJSON(STORAGE_KEYS.zones, zones), [zones]);
  useEffect(() => saveJSON(STORAGE_KEYS.prefs, prefs), [prefs]);
  useEffect(() => saveJSON(STORAGE_KEYS.bgUploads, bgUploads), [bgUploads]);
  useEffect(() => saveJSON("dash.view", view), [view]);
  const initTweaks = {
    ...window.__TWEAK_DEFAULTS || { mode: "material-light", background: "floor", arcade: "pacmaze", scanlines: true },
    ...loadJSON("dash.tweaks", {})
  };
  const [tweaks, setTweak] = useTweaks(initTweaks);
  const mode = tweaks.mode || "material-light";
  useEffect(() => saveJSON("dash.tweaks", tweaks), [tweaks]);
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
      setGlobalBg(`background: ${builtin.value} !important; background-size: auto !important;`);
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
    setTimeout(() => setToast((t) => t === msg ? null : t), 1800);
  }
  function toggleUnits() {
    setPrefs({ ...prefs, units: prefs.units === "F" ? "C" : "F" });
  }
  function openBookmark(b) {
    setBookmarks(bookmarks.map((x) => x.id === b.id ? { ...x, lastVisited: Date.now() } : x));
    window.open(b.url, "_blank", "noreferrer");
  }
  function startQuickAdd() {
    const folderId = activeFolderId === "f-all" ? folders[0]?.id || "f-work" : activeFolderId;
    setEditingBookmark({ folderId, name: "", url: "", description: "", tags: [], pinned: false });
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
  function onSearchSubmit(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    const url = /^https?:\/\//i.test(q) ? q : q.includes(".") && !q.includes(" ") ? "https://" + q : "https://www.google.com/search?q=" + encodeURIComponent(q);
    window.open(url, "_blank", "noreferrer");
  }
  const now = useNow(6e4);
  return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("span", { className: "brand-dot" }), /* @__PURE__ */ React.createElement("div", { className: "brand-text" }, mode === "arcade" ? /* @__PURE__ */ React.createElement("span", { className: "brand-main" }, "\u2605 ARCADE NET \u2605") : /* @__PURE__ */ React.createElement("span", { className: "brand-main" }, "Dashboard"), /* @__PURE__ */ React.createElement("span", { className: "brand-sub" }, greetingFor(now), ",", " ", /* @__PURE__ */ React.createElement("span", { className: "brand-name", onClick: () => setEditingName(true), title: "Click to change" }, prefs.name), " \xB7 ", new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(now)))), /* @__PURE__ */ React.createElement("form", { className: "topbar-search", onSubmit: onSearchSubmit }, /* @__PURE__ */ React.createElement(Icon.search, { size: 18 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      name: "q",
      placeholder: mode === "arcade" ? "SEARCH OR ENTER URL" : "Search Google or enter URL",
      autoComplete: "off"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "search-engine" }, mode === "arcade" ? "\u21B5 GO" : "\u21B5")), /* @__PURE__ */ React.createElement("div", { className: "topbar-actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setSettingsOpen(true), "aria-label": "Settings", title: "Settings" }, /* @__PURE__ */ React.createElement(Icon.settings, { size: 20 })), /* @__PURE__ */ React.createElement("a", { className: "icon-btn", href: "manager.html", "aria-label": "Manage bookmarks", title: "Manage bookmarks" }, /* @__PURE__ */ React.createElement(Icon.folder, { size: 20 })))), /* @__PURE__ */ React.createElement("div", { className: "main-layout" }, /* @__PURE__ */ React.createElement("aside", { className: "sidebar sidebar-left" }, /* @__PURE__ */ React.createElement(ClocksPanel, { zones, onEditZones: () => setEditingZones(true) })), /* @__PURE__ */ React.createElement("main", { className: "main-content" }, /* @__PURE__ */ React.createElement(
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
  ))), /* @__PURE__ */ React.createElement("footer", { className: "foot" }, mode === "arcade" ? `\u2605 ${bookmarks.length} BOOKMARKS \xB7 ${folders.length} FOLDERS \xB7 STORED LOCALLY \u2605` : `${bookmarks.length} bookmarks \xB7 ${folders.length} folders \xB7 stored locally`), editingBookmark && /* @__PURE__ */ React.createElement(
    BookmarkDialog,
    {
      value: editingBookmark,
      folders,
      onChange: setEditingBookmark,
      onClose: () => setEditingBookmark(null),
      onSave: saveBookmark
    }
  ), editingZones && /* @__PURE__ */ React.createElement(ZonesDialog, { zones, setZones, onClose: () => setEditingZones(false) }), editingCity && /* @__PURE__ */ React.createElement(EditDialog, { title: "Weather location", onClose: () => setEditingCity(false), onSave: () => setEditingCity(false) }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "City"), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: prefs.weatherCity, onChange: (e) => setPrefs({ ...prefs, weatherCity: e.target.value }) })), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "var(--text-3)", margin: 0 } }, "Uses mock data \u2014 any city name is shown verbatim.")), editingName && /* @__PURE__ */ React.createElement(EditDialog, { title: "Your name", onClose: () => setEditingName(false), onSave: () => setEditingName(false) }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Display name"), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: prefs.name, onChange: (e) => setPrefs({ ...prefs, name: e.target.value }) }))), settingsOpen && /* @__PURE__ */ React.createElement(
    SettingsDialog,
    {
      tweaks,
      setTweak,
      prefs,
      setPrefs,
      bgUploads,
      setBgUploads,
      onClose: () => setSettingsOpen(false)
    }
  ), /* @__PURE__ */ React.createElement(TweaksPanel, { title: "Tweaks" }, /* @__PURE__ */ React.createElement(TweakSection, { label: "Mode" }), /* @__PURE__ */ React.createElement(
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
function BookmarkDialog({ value, folders, onChange, onClose, onSave }) {
  const v = value;
  const set = (k, val) => onChange({ ...v, [k]: val });
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", style: { zIndex: 1100 }, onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 480 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, v.id ? "Edit bookmark" : "New bookmark"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Name"), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: v.name, onChange: (e) => set("name", e.target.value), placeholder: "Project tracker" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "URL"), /* @__PURE__ */ React.createElement("input", { value: v.url, onChange: (e) => set("url", e.target.value), placeholder: "https://example.com" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Description (optional)"), /* @__PURE__ */ React.createElement("textarea", { value: v.description || "", onChange: (e) => set("description", e.target.value), placeholder: "Why you saved this\u2026", rows: 3 })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Folder"), /* @__PURE__ */ React.createElement("select", { value: v.folderId, onChange: (e) => set("folderId", e.target.value) }, folders.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name)))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Tags (comma-separated)"), /* @__PURE__ */ React.createElement("input", { value: Array.isArray(v.tags) ? v.tags.join(", ") : v.tags || "", onChange: (e) => set("tags", e.target.value), placeholder: "daily, news" }))), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!v.pinned, onChange: (e) => set("pinned", e.target.checked) }), " Pin to top")), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: onSave }, "Save"))));
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
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 480 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, "Time zones"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form" }, list.map((z, i) => /* @__PURE__ */ React.createElement("div", { key: z.id, style: { display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 8, marginBottom: 10, alignItems: "end" } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, i === 0 ? "Primary label" : "Label"), /* @__PURE__ */ React.createElement("input", { value: z.label, onChange: (e) => update(i, { label: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Time zone"), /* @__PURE__ */ React.createElement("select", { value: z.tz, onChange: (e) => update(i, { tz: e.target.value }) }, [z.tz, ...COMMON_ZONES.filter((t) => t !== z.tz)].map((t) => /* @__PURE__ */ React.createElement("option", { key: t, value: t }, t)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "icon-btn",
      onClick: () => remove(i),
      disabled: i === 0,
      style: { opacity: i === 0 ? 0.3 : 1, marginBottom: 2 },
      "aria-label": "Remove"
    },
    /* @__PURE__ */ React.createElement(Icon.trash, { size: 16 })
  ))), list.length < 3 && /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: add }, /* @__PURE__ */ React.createElement(Icon.plus, { size: 14 }), " Add another")), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: save }, "Save"))));
}
function SettingsDialog({ tweaks, setTweak, prefs, setPrefs, bgUploads, setBgUploads, onClose }) {
  const mode = tweaks.mode || "material-light";
  const isArcade = mode === "arcade";
  const bgInputRef = useRef(null);
  function handleBgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgUploads.length >= 5) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 1920, MAX_H = 1080;
        let w = img.width, h = img.height;
        if (w > MAX_W || h > MAX_H) {
          const r = Math.min(MAX_W / w, MAX_H / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const url = canvas.toDataURL("image/jpeg", 0.82);
        const id = "upload-" + Date.now();
        const label = file.name.replace(/\.[^.]+$/, "").slice(0, 14) || "Photo";
        setBgUploads((prev) => [...prev, { id, label, url }]);
        setPrefs((p) => ({ ...p, bgId: id }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function removeUpload(id) {
    setBgUploads((prev) => prev.filter((u) => u.id !== id));
    if (prefs.bgId === id) setPrefs({ ...prefs, bgId: "bg-dark" });
  }
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose() }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h2", { className: "modal-title" }, "Settings"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(Icon.close, null))), /* @__PURE__ */ React.createElement("div", { className: "form", style: { maxHeight: "70vh", overflow: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Appearance"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Theme"), /* @__PURE__ */ React.createElement("div", { className: "seg-group" }, [{ v: "material-light", l: "Light" }, { v: "material-dark", l: "Dark" }, { v: "arcade", l: "Arcade" }].map((o) => /* @__PURE__ */ React.createElement("button", { key: o.v, className: "seg-btn" + (mode === o.v ? " active" : ""), onClick: () => setTweak("mode", o.v) }, o.l)))), isArcade && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Arcade cabinet"), /* @__PURE__ */ React.createElement("select", { value: tweaks.arcade || "synthwave", onChange: (e) => setTweak("arcade", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "synthwave" }, "Synthwave (pink/cyan)"), /* @__PURE__ */ React.createElement("option", { value: "pacmaze" }, "Pac-Maze (yellow/blue)"), /* @__PURE__ */ React.createElement("option", { value: "gameboy" }, "Game Boy (4-shade green)"), /* @__PURE__ */ React.createElement("option", { value: "galaga" }, "Galaga (deep space)"), /* @__PURE__ */ React.createElement("option", { value: "tron" }, "Tron (cyan/orange)"), /* @__PURE__ */ React.createElement("option", { value: "hotlava" }, "Hot Lava (red/orange)"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Background"), /* @__PURE__ */ React.createElement("div", { className: "seg-group" }, [{ v: "solid", l: "Solid" }, { v: "gradient", l: "Glow" }, { v: "grid", l: "Grid" }, { v: "floor", l: "Floor" }, { v: "dotted", l: "Dots" }].map((o) => /* @__PURE__ */ React.createElement("button", { key: o.v, className: "seg-btn" + ((tweaks.background || "floor") === o.v ? " active" : ""), onClick: () => setTweak("background", o.v) }, o.l)))), /* @__PURE__ */ React.createElement("label", { className: "settings-toggle" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: tweaks.scanlines !== false, onChange: (e) => setTweak("scanlines", e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, "CRT scanlines + vignette")))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Background"), /* @__PURE__ */ React.createElement("div", { className: "bg-picker" }, BUILTIN_BACKGROUNDS.map((bg) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: bg.id,
      className: "bg-thumb" + (prefs.bgId === bg.id ? " active" : ""),
      onClick: () => setPrefs({ ...prefs, bgId: bg.id }),
      title: bg.label
    },
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-img", style: { background: bg.value } }),
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-label" }, bg.label),
    prefs.bgId === bg.id && /* @__PURE__ */ React.createElement("span", { className: "bg-check" }, "\u2713")
  )), (bgUploads || []).map((up) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: up.id,
      className: "bg-thumb" + (prefs.bgId === up.id ? " active" : ""),
      onClick: () => setPrefs({ ...prefs, bgId: up.id }),
      title: up.label
    },
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-img", style: { backgroundImage: `url("${up.url}")`, backgroundSize: "cover", backgroundPosition: "center" } }),
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-label" }, up.label),
    prefs.bgId === up.id && /* @__PURE__ */ React.createElement("span", { className: "bg-check" }, "\u2713"),
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-del", onClick: (e) => {
      e.stopPropagation();
      removeUpload(up.id);
    }, title: "Remove" }, "\xD7")
  )), (bgUploads || []).length < 5 && /* @__PURE__ */ React.createElement("button", { className: "bg-thumb bg-thumb-add", onClick: () => bgInputRef.current?.click(), title: "Upload image" }, /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-img bg-thumb-add-icon" }, /* @__PURE__ */ React.createElement(Icon.upload, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-label" }, "Upload")), /* @__PURE__ */ React.createElement("input", { ref: bgInputRef, type: "file", accept: "image/*", hidden: true, onChange: handleBgUpload }))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Profile"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Display name"), /* @__PURE__ */ React.createElement("input", { value: prefs.name, onChange: (e) => setPrefs({ ...prefs, name: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Weather"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "City"), /* @__PURE__ */ React.createElement("input", { value: prefs.weatherCity, onChange: (e) => setPrefs({ ...prefs, weatherCity: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Units"), /* @__PURE__ */ React.createElement("div", { className: "seg-group" }, /* @__PURE__ */ React.createElement("button", { className: "seg-btn" + (prefs.units === "F" ? " active" : ""), onClick: () => setPrefs({ ...prefs, units: "F" }) }, "\xB0F"), /* @__PURE__ */ React.createElement("button", { className: "seg-btn" + (prefs.units === "C" ? " active" : ""), onClick: () => setPrefs({ ...prefs, units: "C" }) }, "\xB0C"))))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Search"), /* @__PURE__ */ React.createElement("p", { className: "settings-help" }, "Uses ", /* @__PURE__ */ React.createElement("strong", null, "Google"), ". Type a query to search, or paste a URL to open directly."))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: onClose }, "Done"))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));

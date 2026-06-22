var { useState, useMemo, useEffect, useCallback, useRef } = React;
const PANES = [
  { id: "general", label: "General", keywords: "profile display name greeting", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" })) },
  { id: "appearance", label: "Appearance", keywords: "theme dark light arcade clock face digital analog background wallpaper typography font geist outfit vt323", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "13.5", cy: "6.5", r: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "17.5", cy: "10.5", r: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "8.5", cy: "7.5", r: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "6.5", cy: "12.5", r: "0.5", fill: "currentColor" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2A10 10 0 0 0 2 12c0 5.5 4.5 10 10 10a3 3 0 0 0 3-3v-1a2 2 0 0 1 2-2h1a4 4 0 0 0 4-4 10 10 0 0 0-10-10z" })) },
  { id: "widgets", label: "Widgets", keywords: "widgets time notes weather todo bookmarks quote toggle", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "9" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "5" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "12", width: "7", height: "9" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "16", width: "7", height: "5" })) },
  { id: "weather", label: "Weather", keywords: "weather city units fahrenheit celsius", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M17.5 19a4.5 4.5 0 1 0 0-9 6 6 0 0 0-11.5 2" }), /* @__PURE__ */ React.createElement("path", { d: "M3 19h14" })) },
  { id: "shortcuts", label: "Shortcuts", keywords: "keyboard shortcuts hotkeys cmd ctrl", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" })) },
  { id: "data", label: "Data & sync", keywords: "data sync export import backup chrome bookmarks json google drive", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" }), /* @__PURE__ */ React.createElement("path", { d: "M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" })) },
  { id: "advanced", label: "Advanced", keywords: "custom css code api key advanced developer", icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "16 18 22 12 16 6" }), /* @__PURE__ */ React.createElement("polyline", { points: "8 6 2 12 8 18" })) },
  { id: "plus", label: "Plus", keywords: "plus pro upgrade premium subscription license activate", isPlus: true, icon: (p) => /* @__PURE__ */ React.createElement("svg", { width: p.size || 15, height: p.size || 15, viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.4 5.8 22l2.4-8.1L2 9.4h7.6z" })) }
];
function SettingsApp() {
  const [activePane, setActivePane] = useState(() => location.hash.replace("#", "") || "general");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [name, setName] = window.useStorage(window.STORAGE_KEYS.name, "Friend", true);
  const [theme, setTheme] = window.useStorage(window.STORAGE_KEYS.theme, "light", true);
  const [arcadeGame, setArcadeGame] = window.useStorage(window.STORAGE_KEYS.arcadeGame, "synthwave", true);
  const [unit, setUnit] = window.useStorage(window.STORAGE_KEYS.unit, "F", true);
  const [widgets, setWidgets] = window.useStorage(window.STORAGE_KEYS.widgets, { left: ["time", "notes"], right: ["weather", "todo", "finance"] }, true);
  const [customCSS, setCustomCSS] = window.useStorage(window.STORAGE_KEYS.customCSS, "", false);
  const [plus, setPlus] = window.useStorage(window.STORAGE_KEYS.plus, { active: false }, false);
  const [claudeKey, setClaudeKey] = window.useStorage(window.STORAGE_KEYS.claudeKey, "", false);
  const [openaiKey, setOpenaiKey] = window.useStorage(window.STORAGE_KEYS.openaiKey, "", false);
  const [geminiKey, setGeminiKey] = window.useStorage(window.STORAGE_KEYS.geminiKey, "", false);
  const [aiProvider, setAiProvider] = window.useStorage(window.STORAGE_KEYS.aiProvider, "claude", false);
  const [finnhubKey, setFinnhubKey] = window.useStorage(window.STORAGE_KEYS.finnhubKey, "", false);
  const [licenseKey, setLicenseKey] = useState("");
  const [driveEmail, setDriveEmail] = window.useStorage(window.STORAGE_KEYS.driveEmail, "", false);
  const [autoBackup, setAutoBackup] = window.useStorage(window.STORAGE_KEYS.autoBackup, "off", false);
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [greetings, setGreetings] = window.useStorage(window.STORAGE_KEYS.greetings, [], true);
  const [fontFamily, setFontFamily] = window.useStorage(window.STORAGE_KEYS.fontFamily, "default", true);
  const [weatherCity, setWeatherCity] = window.useStorage(window.STORAGE_KEYS.weatherCity, "San Francisco", true);
  const [clockFace, setClockFace] = window.useStorage(window.STORAGE_KEYS.clockFace, "digital", true);
  const [bgId, setBgId] = window.useStorage(window.STORAGE_KEYS.bgId, "bg-light", true);
  useEffect(() => {
    const handleHashChange = () => setActivePane(location.hash.replace("#", "") || "general");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "arcade") {
      document.documentElement.setAttribute("data-arcade-game", arcadeGame);
    } else {
      document.documentElement.removeAttribute("data-arcade-game");
    }
  }, [theme, arcadeGame]);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => prev === msg ? null : prev), 1500);
  };
  const fetchBackups = useCallback(() => {
    if (!plus.active || !driveEmail) return;
    setLoadingBackups(true);
    chrome.runtime.sendMessage({ action: "list-backups" }, (res) => {
      setLoadingBackups(false);
      if (res && res.backups) {
        setBackups(res.backups);
      }
    });
  }, [plus.active, driveEmail]);
  useEffect(() => {
    if (activePane === "plus") {
      fetchBackups();
    }
  }, [activePane, fetchBackups]);
  const connectDrive = () => {
    chrome.runtime.sendMessage({ action: "drive-connect" }, (res) => {
      if (res && res.email) {
        setDriveEmail(res.email);
        showToast("Google Drive connected!");
      } else {
        showToast("Connection failed: " + (res?.error || "unknown error"));
      }
    });
  };
  const disconnectDrive = () => {
    chrome.runtime.sendMessage({ action: "drive-disconnect" }, (res) => {
      if (res && res.ok) {
        setDriveEmail("");
        setBackups([]);
        showToast("Google Drive disconnected");
      } else {
        showToast("Disconnection failed: " + (res?.error || "unknown error"));
      }
    });
  };
  const performBackup = () => {
    setBackingUp(true);
    chrome.runtime.sendMessage({ action: "backup-now" }, (res) => {
      setBackingUp(false);
      if (res && res.ok) {
        showToast("Backed up!");
        fetchBackups();
      } else {
        showToast("Backup failed: " + (res?.error || "unknown error"));
      }
    });
  };
  const restoreBackup = (fileId) => {
    if (!confirm("Restoring will overwrite all current settings, bookmarks, notes, and tasks. Proceed?")) return;
    chrome.runtime.sendMessage({ action: "restore-backup", fileId }, async (res) => {
      if (res && res.data) {
        await window.importAllData(JSON.stringify(res.data));
        showToast("Restore complete!");
      } else {
        showToast("Restore failed: " + (res?.error || "unknown error"));
      }
    });
  };
  const filteredPanes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PANES;
    return PANES.filter((p) => p.label.toLowerCase().includes(q) || p.keywords.toLowerCase().includes(q));
  }, [searchQuery]);
  const handleToggleWidget = (id) => {
    setWidgets((prev) => {
      const next = { ...prev };
      const all = [...prev.left || [], ...prev.right || []];
      if (all.includes(id)) {
        next.left = (prev.left || []).filter((w) => w !== id);
        next.right = (prev.right || []).filter((w) => w !== id);
      } else {
        next.right = [...prev.right || [], id];
      }
      return next;
    });
    showToast("Settings saved");
  };
  const isWidgetEnabled = (id) => {
    return [...widgets.left || [], ...widgets.right || []].includes(id);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-dot" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "brand-title" }, "1stTab"), /* @__PURE__ */ React.createElement("div", { className: "brand-sub" }, "Settings"))), /* @__PURE__ */ React.createElement("a", { className: "back-link", href: "newtab.html" }, /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "19", y1: "12", x2: "5", y2: "12" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 19 5 12 12 5" })), "Dashboard")), /* @__PURE__ */ React.createElement("div", { className: "settings-shell" }, /* @__PURE__ */ React.createElement("aside", { className: "side-nav" }, /* @__PURE__ */ React.createElement("label", { className: "nav-search" }, /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" })), /* @__PURE__ */ React.createElement("input", { placeholder: "Search settings\u2026", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })), /* @__PURE__ */ React.createElement("nav", { className: "nav-list" }, filteredPanes.map((p) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      className: `nav-item ${activePane === p.id ? "active" : ""} ${p.isPlus ? "nav-plus" : ""}`,
      onClick: () => {
        setActivePane(p.id);
        location.hash = p.id;
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "nav-icon" }, p.icon({})),
    p.label,
    p.isPlus && /* @__PURE__ */ React.createElement("span", { className: "nav-tag" }, "PRO")
  ))), filteredPanes.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "nav-empty" }, "No settings match.")), /* @__PURE__ */ React.createElement("main", null, activePane === "general" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "General"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Your name and greeting templates.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Profile")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Display name"), /* @__PURE__ */ React.createElement("input", { className: "input", value: name, onChange: (e) => {
    setName(e.target.value);
    showToast("Saved");
  } })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Custom greeting templates"), /* @__PURE__ */ React.createElement("div", { className: "field-help" }, "One per line. Variables: ", /* @__PURE__ */ React.createElement("code", null, "{name}"), " ", /* @__PURE__ */ React.createElement("code", null, "{day}"), " ", /* @__PURE__ */ React.createElement("code", null, "{time}"), "."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "textarea",
      value: greetings.join("\n"),
      onChange: (e) => {
        setGreetings(e.target.value.split("\n"));
        showToast("Saved");
      },
      placeholder: "Good morning, {name}!\nReady to conquer {day}?\nHello, {name} \u2014 it's {time}."
    }
  )))), activePane === "appearance" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "Appearance ", plus.active && /* @__PURE__ */ React.createElement("span", { className: "badge-plus", style: { verticalAlign: "middle", marginLeft: 8 } }, "Plus active")), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Theme, clock face, background, and typography.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Theme")), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "seg-group full" }, ["light", "dark", "arcade"].map((v) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: v,
      className: `seg-btn ${theme === v ? "active" : ""}`,
      onClick: () => {
        setTheme(v);
        showToast("Saved");
      }
    },
    v.charAt(0).toUpperCase() + v.slice(1)
  ))))), theme === "arcade" && /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Arcade cabinet"), /* @__PURE__ */ React.createElement("span", { className: "badge-plus", style: { marginLeft: 8 } }, "Plus")), /* @__PURE__ */ React.createElement("div", { className: "section-desc" }, "Pick a classic arcade game."), /* @__PURE__ */ React.createElement("div", { className: "arcade-picker" }, [
    { id: "synthwave", name: "Synthwave", sub: "Pink & cyan on midnight purple", bg: "radial-gradient(circle at 30% 30%, #ff5dac 0%, transparent 50%), radial-gradient(circle at 70% 70%, #6a96f1 0%, transparent 55%), #0e0a1a", color: "#ff5dac" },
    { id: "pacman", name: "Pac-Maze", sub: "Yellow & red on deep navy", bg: "#00002a", color: "#ffe800" },
    { id: "gameboy", name: "Game Boy", sub: "4-shade green LCD palette", bg: "#9bbc0f", color: "#0f380f" },
    { id: "galaga", name: "Galaga", sub: "White & magenta on deep black", bg: "#050010", color: "#ff3cee" },
    { id: "tron", name: "Tron", sub: "Electric blue grid", bg: "#000a14", color: "#00bfff" },
    { id: "hotlava", name: "Hot Lava", sub: "Red & orange on near-black", bg: "#0a0000", color: "#ff4422" },
    { id: "invaders", name: "Space Invaders", sub: "CRT green on black", bg: "#000", color: "#33ff33" },
    { id: "dkong", name: "Donkey Kong", sub: "Orange & brown", bg: "#1a0700", color: "#ff4500" }
  ].map((g) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: g.id,
      className: `arcade-card ${arcadeGame === g.id ? "selected" : ""}`,
      onClick: () => {
        setArcadeGame(g.id);
        showToast("Saved");
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "arcade-preview", style: { background: g.bg } }, /* @__PURE__ */ React.createElement("div", { className: "arcade-preview-text", style: { color: g.color, top: "50%", left: "50%", transform: "translate(-50%, -50%)" } }, g.name.toUpperCase())),
    /* @__PURE__ */ React.createElement("div", { className: "arcade-meta" }, /* @__PURE__ */ React.createElement("div", { className: "arcade-name" }, g.name), /* @__PURE__ */ React.createElement("div", { className: "arcade-sub" }, g.sub))
  )))), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Clock face ", plus.active && /* @__PURE__ */ React.createElement("span", { className: "badge-plus", style: { marginLeft: 8 } }, "Plus"))), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "seg-group full" }, [
    { v: "digital", l: "Digital" },
    { v: "analog-min", l: "Analog \u2014 Minimal" },
    { v: "analog-retro", l: "Analog \u2014 Retro" },
    { v: "analog-pixel", l: "Analog \u2014 Pixel" }
  ].map((o) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: o.v,
      className: `seg-btn ${clockFace === o.v ? "active" : ""}`,
      onClick: () => {
        setClockFace(o.v);
        showToast("Saved");
      }
    },
    o.l
  ))))), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Background")), /* @__PURE__ */ React.createElement("div", { className: "bg-picker" }, window.BUILTIN_BACKGROUNDS.map((bg) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: bg.id,
      className: `bg-thumb ${bgId === bg.id ? "selected" : ""}`,
      onClick: () => {
        setBgId(bg.id);
        showToast("Saved");
      },
      title: bg.label
    },
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-img", style: { background: bg.value } }),
    /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-label" }, bg.label)
  )))), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Typography")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Font family"), /* @__PURE__ */ React.createElement("select", { className: "select", value: fontFamily, onChange: (e) => {
    setFontFamily(e.target.value);
    showToast("Saved");
  } }, /* @__PURE__ */ React.createElement("option", { value: "default" }, "System default \xB7 Geist"), /* @__PURE__ */ React.createElement("option", { value: "Outfit" }, "Outfit"), /* @__PURE__ */ React.createElement("option", { value: "VT323" }, "VT323 (retro pixel)"))))), activePane === "widgets" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "Widgets"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Pick which widgets show on your dashboard.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, [
    { id: "time", name: "World Clocks", hint: "Time zones across the world." },
    { id: "weather", name: "Weather", hint: "Current conditions and 5-day forecast." },
    { id: "todo", name: "To-Do List", hint: "Lightweight task list for the day." },
    { id: "notes", name: "Quick Notes", hint: "Scratchpad that auto-saves." },
    { id: "pomodoro", name: "Pomodoro Timer", hint: "25-min work / 5-min break sessions." },
    { id: "crypto", name: "Crypto Ticker", hint: "BTC, ETH, SOL prices from CoinGecko." },
    { id: "fx", name: "FX Rates", hint: "Currency exchange rates." },
    { id: "history", name: "Browser History", hint: "Your last 10 visited pages." },
    { id: "stocks", name: "Stock Quotes", hint: "Plus \xB7 Live stock prices via Finnhub." }
  ].map((w) => /* @__PURE__ */ React.createElement("div", { key: w.id, className: "toggle-row" }, /* @__PURE__ */ React.createElement("div", { className: "info" }, /* @__PURE__ */ React.createElement("div", { className: "name" }, w.name), /* @__PURE__ */ React.createElement("div", { className: "hint" }, w.hint)), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `toggle ${isWidgetEnabled(w.id) ? "on" : ""}`,
      onClick: () => handleToggleWidget(w.id)
    }
  ))))), activePane === "weather" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "Weather"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Where and how to display the current conditions.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "field-row cols-21" }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "input", value: weatherCity, onChange: (e) => {
    setWeatherCity(e.target.value);
    showToast("Saved");
  } })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Units"), /* @__PURE__ */ React.createElement("div", { className: "seg-group full" }, /* @__PURE__ */ React.createElement("button", { className: `seg-btn ${unit === "F" ? "active" : ""}`, onClick: () => {
    setUnit("F");
    showToast("Saved");
  } }, "\xB0F"), /* @__PURE__ */ React.createElement("button", { className: `seg-btn ${unit === "C" ? "active" : ""}`, onClick: () => {
    setUnit("C");
    showToast("Saved");
  } }, "\xB0C")))))), activePane === "shortcuts" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "Keyboard shortcuts"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Move around without touching the mouse.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "shortcut-grid" }, /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "/"), " ", /* @__PURE__ */ React.createElement("span", { className: "desc" }, "Focus search bar"), /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "\u2318 K"), " ", /* @__PURE__ */ React.createElement("span", { className: "desc" }, "Focus search bar"), /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "\u2318 ,"), " ", /* @__PURE__ */ React.createElement("span", { className: "desc" }, "Open settings (this page)"), /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "Esc"), " ", /* @__PURE__ */ React.createElement("span", { className: "desc" }, "Close dialogs")))), activePane === "data" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "Data & sync"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Move your settings, notes, and tasks between browsers.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Manual backup")), /* @__PURE__ */ React.createElement("div", { className: "btn-row" }, /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: () => window.exportAllData() }, /* @__PURE__ */ React.createElement(window.Icon.download, { size: 14 }), " Export backup"), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: () => document.getElementById("importFile").click() }, /* @__PURE__ */ React.createElement(window.Icon.upload, { size: 14 }), " Import backup"), /* @__PURE__ */ React.createElement("input", { type: "file", id: "importFile", accept: ".json", hidden: true, onChange: (e) => {
    const f = e.target.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => window.importAllData(ev.target.result);
      reader.readAsText(f);
    }
  } }), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: () => window.importChromeBookmarks() }, /* @__PURE__ */ React.createElement(window.Icon.folder, { size: 14 }), " Import Chrome bookmarks")))), activePane === "advanced" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "Advanced"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Custom styling and developer integrations.")), /* @__PURE__ */ React.createElement("section", { className: "section" }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Custom CSS")), /* @__PURE__ */ React.createElement("div", { className: "section-desc" }, "Override any style on the dashboard."), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "code-editor",
      value: customCSS,
      onChange: (e) => setCustomCSS(e.target.value),
      spellCheck: "false",
      placeholder: "/* Try it */\n.card { border-radius: 24px; }"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "btn-row", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: () => showToast("CSS applied") }, "Apply")))), activePane === "plus" && /* @__PURE__ */ React.createElement("div", { className: "pane active" }, /* @__PURE__ */ React.createElement("div", { className: "pane-head" }, /* @__PURE__ */ React.createElement("div", { className: "pane-title" }, "1stTab Plus"), /* @__PURE__ */ React.createElement("div", { className: "pane-sub" }, "Unlock the full new-tab experience.")), plus.active ? /* @__PURE__ */ React.createElement("div", { className: "plus-hero", style: { background: "linear-gradient(135deg, #1a153b 0%, #0d0921 100%)", border: "1px solid #4a3e7d" } }, /* @__PURE__ */ React.createElement("div", { className: "plus-eyebrow", style: { color: "#d4af37" } }, "\u2605 Plus \xB7 Active"), /* @__PURE__ */ React.createElement("div", { className: "plus-title", style: { color: "#fff" } }, "You have unlocked 1stTab Plus!"), /* @__PURE__ */ React.createElement("div", { className: "plus-desc", style: { color: "#b3accf" } }, "Enjoy analog clock faces, custom backgrounds, cross-device sync, and unlimited custom CSS. Activated as ", plus.email || "developer@local", "."), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: () => {
    setPlus({ active: false });
    setDriveEmail("");
    setBackups([]);
    showToast("Plus deactivated");
  }, style: { marginTop: 12, borderColor: "#4a3e7d", color: "#b3accf", cursor: "pointer" } }, "Deactivate License")) : /* @__PURE__ */ React.createElement("div", { className: "plus-hero" }, /* @__PURE__ */ React.createElement("div", { className: "plus-eyebrow" }, "\u2605 Plus \xB7 $19 / year"), /* @__PURE__ */ React.createElement("div", { className: "plus-title" }, "A new tab worth saving for."), /* @__PURE__ */ React.createElement("div", { className: "plus-desc" }, "Activate a license key to unlock analog clock faces, custom backgrounds, cross-device sync, and unlimited custom CSS."), /* @__PURE__ */ React.createElement("div", { className: "activate-row" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "input",
      placeholder: "XXXX-XXXX-XXXX-XXXX",
      value: licenseKey,
      onChange: (e) => setLicenseKey(e.target.value),
      style: { fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", maxWidth: 280, background: "var(--surface)" }
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn-gold", onClick: () => {
    if (licenseKey.length > 5) {
      chrome.runtime.sendMessage({ action: "verify-license", key: licenseKey }, (res) => {
        if (res && res.active) {
          setPlus({ active: true, key: licenseKey, email: res.email, verifiedAt: Date.now() });
          showToast("Plus activated!");
        } else {
          showToast("Activation failed: " + (res?.error || "invalid key"));
        }
      });
    } else {
      showToast("Key must be longer than 5 characters");
    }
  } }, "\u2605 Activate Plus"))), plus.active && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "section", style: { marginTop: 28 } }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Google Drive")), /* @__PURE__ */ React.createElement("div", { className: "section-desc" }, "Connect your Google account to unlock cloud backups, Calendar, and Tasks sync."), driveEmail ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-mute)", marginBottom: 2 } }, "Connected as"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, fontWeight: 600, color: "var(--green)" } }, driveEmail)), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: disconnectDrive, style: { cursor: "pointer" } }, "Disconnect")) : /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: connectDrive, style: { cursor: "pointer" } }, "Connect Google Drive")), driveEmail && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "section", style: { marginTop: 28 } }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "Auto-backup")), /* @__PURE__ */ React.createElement("div", { className: "section-desc" }, "Silently back up your settings, notes, and tasks automatically."), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "select",
      value: autoBackup,
      onChange: (e) => {
        setAutoBackup(e.target.value);
        chrome.runtime.sendMessage({ action: "set-auto-backup", value: e.target.value });
        showToast("Auto-backup preference saved");
      },
      style: { maxWidth: 240 }
    },
    /* @__PURE__ */ React.createElement("option", { value: "off" }, "Off"),
    /* @__PURE__ */ React.createElement("option", { value: "daily" }, "Once per day")
  ))), /* @__PURE__ */ React.createElement("section", { className: "section", style: { marginTop: 28 } }, /* @__PURE__ */ React.createElement("div", { className: "section-head", style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "section-title", style: { margin: 0 } }, "Backup & Restore"), /* @__PURE__ */ React.createElement("button", { className: "btn primary", onClick: performBackup, disabled: backingUp, style: { cursor: backingUp ? "not-allowed" : "pointer" } }, backingUp ? "Backing up\u2026" : "Back up now")), /* @__PURE__ */ React.createElement("div", { className: "section-desc" }, "Up to 5 recent backups stored securely in your private Drive AppData folder."), loadingBackups ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0", color: "var(--text-mute)", fontSize: 13 } }, "Loading backups\u2026") : backups.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0", color: "var(--text-mute)", fontSize: 13 } }, "No backups found in Google Drive.") : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 8, marginTop: 12 } }, backups.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, fontWeight: 500 } }, new Date(b.createdTime || b.name.split("-")[3] * 1).toLocaleString()), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "var(--text-mute)", fontFamily: "var(--font-mono)", marginTop: 2 } }, (b.size / 1024).toFixed(1), " KB")), /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: () => restoreBackup(b.id), style: { cursor: "pointer" } }, "Restore"))))))), /* @__PURE__ */ React.createElement("section", { className: "section", style: { marginTop: 28 } }, /* @__PURE__ */ React.createElement("div", { className: "section-head" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, "AI & API Keys")), /* @__PURE__ */ React.createElement("div", { className: "section-desc" }, "Stored locally on this device only \u2014 never sent anywhere except the named API."), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "AI Provider"), /* @__PURE__ */ React.createElement("div", { className: "field-help" }, "Choose which AI to use for the Bookmark Assistant."), /* @__PURE__ */ React.createElement("select", { className: "select", value: aiProvider, onChange: (e) => {
    setAiProvider(e.target.value);
    showToast("Saved");
  }, style: { maxWidth: 240 } }, /* @__PURE__ */ React.createElement("option", { value: "claude" }, "Anthropic Claude"), /* @__PURE__ */ React.createElement("option", { value: "openai" }, "OpenAI ChatGPT"), /* @__PURE__ */ React.createElement("option", { value: "gemini" }, "Google Gemini"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Claude API Key"), /* @__PURE__ */ React.createElement("div", { className: "field-help" }, "Get one at ", /* @__PURE__ */ React.createElement("code", null, "console.anthropic.com"), "."), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "input",
      value: claudeKey,
      onChange: (e) => {
        setClaudeKey(e.target.value);
        showToast("Saved");
      },
      placeholder: "sk-ant-\u2026",
      style: { fontFamily: "var(--font-mono)" }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "OpenAI API Key"), /* @__PURE__ */ React.createElement("div", { className: "field-help" }, "Get one at ", /* @__PURE__ */ React.createElement("code", null, "platform.openai.com"), "."), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "input",
      value: openaiKey,
      onChange: (e) => {
        setOpenaiKey(e.target.value);
        showToast("Saved");
      },
      placeholder: "sk-proj-\u2026",
      style: { fontFamily: "var(--font-mono)" }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Gemini API Key"), /* @__PURE__ */ React.createElement("div", { className: "field-help" }, "Get one at ", /* @__PURE__ */ React.createElement("code", null, "aistudio.google.com"), "."), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "input",
      value: geminiKey,
      onChange: (e) => {
        setGeminiKey(e.target.value);
        showToast("Saved");
      },
      placeholder: "AIza\u2026",
      style: { fontFamily: "var(--font-mono)" }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "field-label" }, "Finnhub API Key"), /* @__PURE__ */ React.createElement("div", { className: "field-help" }, "For the Stock Quotes widget. Free tier at ", /* @__PURE__ */ React.createElement("code", null, "finnhub.io"), " (60 calls/min)."), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "input",
      value: finnhubKey,
      onChange: (e) => {
        setFinnhubKey(e.target.value);
        showToast("Saved");
      },
      placeholder: "c0XXXXXXXXXXXXX",
      style: { fontFamily: "var(--font-mono)" }
    }
  )))))), toast && /* @__PURE__ */ React.createElement("div", { className: `toast ${toast ? "show" : ""}` }, toast));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(SettingsApp, null));

var { useState, useMemo, useEffect, useCallback, useRef } = React;
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
function setGlobalBg(css) {
  let el = document.getElementById("dash-bg-style");
  if (!el) {
    el = document.createElement("style");
    el.id = "dash-bg-style";
    document.head.appendChild(el);
  }
  el.textContent = css ? `:root:root:root body { ${css} }` : "";
}
function SettingsPage() {
  const [prefsRaw, setPrefsRaw] = window.useStorage(window.STORAGE_KEYS.prefs, {}, true);
  const [bgUploads, setBgUploads] = window.useStorage(window.STORAGE_KEYS.bgUploads, [], false);
  const initTweaks = {
    ...window.__TWEAK_DEFAULTS || { mode: "material-light", background: "floor", arcade: "pacmaze", scanlines: true },
    ...window.loadJSON("dash.tweaks", {})
  };
  const [tweaks, setTweak] = window.useTweaks(initTweaks);
  const prefs = { ...window.DEFAULT_PREFS, ...prefsRaw };
  const mode = tweaks.mode || "material-light";
  useTheme(prefs.theme);
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
    const builtin = window.BUILTIN_BACKGROUNDS.find((b) => b.id === prefs.bgId);
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
  const setPrefs = useCallback((newVal) => {
    setPrefsRaw((prevRaw) => {
      const merged = { ...window.DEFAULT_PREFS, ...prevRaw };
      return typeof newVal === "function" ? newVal(merged) : newVal;
    });
  }, [setPrefsRaw]);
  const isArcade = mode === "arcade";
  const bgInputRef = useRef(null);
  const importRef = useRef(null);
  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (window.confirm("Are you sure? This will overwrite your current settings and bookmarks.")) {
        window.importAllData(ev.target.result);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
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
          const r2 = Math.min(MAX_W / w, MAX_H / h);
          w = Math.round(w * r2);
          h = Math.round(h * r2);
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
  return /* @__PURE__ */ React.createElement("div", { className: "settings-container" }, /* @__PURE__ */ React.createElement("header", { className: "settings-header" }, /* @__PURE__ */ React.createElement("h1", { className: "settings-title" }, "Settings"), /* @__PURE__ */ React.createElement("a", { href: "newtab.html", className: "btn primary" }, "Back to Dashboard")), /* @__PURE__ */ React.createElement("div", { className: "form" }, /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Keyboard Shortcuts"), /* @__PURE__ */ React.createElement("div", { className: "shortcut-grid" }, /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "/"), " ", /* @__PURE__ */ React.createElement("span", null, "Focus Search Bar"), /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "Ctrl + K"), " ", /* @__PURE__ */ React.createElement("span", null, "Focus Search Bar"), /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "Ctrl + ,"), " ", /* @__PURE__ */ React.createElement("span", null, "Open Settings (this page)"), /* @__PURE__ */ React.createElement("span", { className: "kbd" }, "Esc"), " ", /* @__PURE__ */ React.createElement("span", null, "Close Dialogs"))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Appearance"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Theme"), /* @__PURE__ */ React.createElement("div", { className: "seg-group" }, [{ v: "material-light", l: "Light" }, { v: "material-dark", l: "Dark" }, { v: "arcade", l: "Arcade" }].map((o) => /* @__PURE__ */ React.createElement("button", { key: o.v, className: "seg-btn" + (mode === o.v ? " active" : ""), onClick: () => setTweak("mode", o.v) }, o.l)))), isArcade && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Arcade cabinet"), /* @__PURE__ */ React.createElement("select", { value: tweaks.arcade || "synthwave", onChange: (e) => setTweak("arcade", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "synthwave" }, "Synthwave (pink/cyan)"), /* @__PURE__ */ React.createElement("option", { value: "pacmaze" }, "Pac-Maze (yellow/blue)"), /* @__PURE__ */ React.createElement("option", { value: "gameboy" }, "Game Boy (4-shade green)"), /* @__PURE__ */ React.createElement("option", { value: "galaga" }, "Galaga (deep space)"), /* @__PURE__ */ React.createElement("option", { value: "tron" }, "Tron (cyan/orange)"), /* @__PURE__ */ React.createElement("option", { value: "hotlava" }, "Hot Lava (red/orange)"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Background"), /* @__PURE__ */ React.createElement("div", { className: "seg-group" }, [{ v: "solid", l: "Solid" }, { v: "gradient", l: "Glow" }, { v: "grid", l: "Grid" }, { v: "floor", l: "Floor" }, { v: "dotted", l: "Dots" }].map((o) => /* @__PURE__ */ React.createElement("button", { key: o.v, className: "seg-btn" + ((tweaks.background || "floor") === o.v ? " active" : ""), onClick: () => setTweak("background", o.v) }, o.l)))), /* @__PURE__ */ React.createElement("label", { className: "settings-toggle" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: tweaks.scanlines !== false, onChange: (e) => setTweak("scanlines", e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, "CRT scanlines + vignette")))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Background"), /* @__PURE__ */ React.createElement("div", { className: "bg-picker" }, window.BUILTIN_BACKGROUNDS.map((bg) => /* @__PURE__ */ React.createElement(
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
  )), (bgUploads || []).length < 5 && /* @__PURE__ */ React.createElement("button", { className: "bg-thumb bg-thumb-add", onClick: () => bgInputRef.current?.click(), title: "Upload image" }, /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-img bg-thumb-add-icon" }, /* @__PURE__ */ React.createElement(Icon.upload, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "bg-thumb-label" }, "Upload")), /* @__PURE__ */ React.createElement("input", { ref: bgInputRef, type: "file", accept: "image/*", hidden: true, onChange: handleBgUpload }))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Profile"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Display name"), /* @__PURE__ */ React.createElement("input", { value: prefs.name, onChange: (e) => setPrefs({ ...prefs, name: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Typography"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Font Family"), /* @__PURE__ */ React.createElement("select", { value: prefs.fontFamily || "default", onChange: (e) => setPrefs({ ...prefs, fontFamily: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "default" }, "System Default"), /* @__PURE__ */ React.createElement("option", { value: "Inter" }, "Inter"), /* @__PURE__ */ React.createElement("option", { value: "Roboto" }, "Roboto"), /* @__PURE__ */ React.createElement("option", { value: "Outfit" }, "Outfit"), /* @__PURE__ */ React.createElement("option", { value: "VT323" }, "VT323 (Retro)")))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Weather"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "City"), /* @__PURE__ */ React.createElement("input", { value: prefs.weatherCity, onChange: (e) => setPrefs({ ...prefs, weatherCity: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "field", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Units"), /* @__PURE__ */ React.createElement("div", { className: "seg-group" }, /* @__PURE__ */ React.createElement("button", { className: "seg-btn" + (prefs.units === "F" ? " active" : ""), onClick: () => setPrefs({ ...prefs, units: "F" }) }, "\xB0F"), /* @__PURE__ */ React.createElement("button", { className: "seg-btn" + (prefs.units === "C" ? " active" : ""), onClick: () => setPrefs({ ...prefs, units: "C" }) }, "\xB0C"))))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Search Engine"), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("select", { value: prefs.searchEngine || "google", onChange: (e) => setPrefs({ ...prefs, searchEngine: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "google" }, "Google"), /* @__PURE__ */ React.createElement("option", { value: "duckduckgo" }, "DuckDuckGo"), /* @__PURE__ */ React.createElement("option", { value: "bing" }, "Bing"), /* @__PURE__ */ React.createElement("option", { value: "brave" }, "Brave")))), /* @__PURE__ */ React.createElement("div", { className: "settings-section" }, /* @__PURE__ */ React.createElement("h3", { className: "settings-section-title" }, "Data & Sync"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: () => window.exportAllData() }, "Export Backup"), /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: () => importRef.current?.click() }, "Import Backup"), /* @__PURE__ */ React.createElement("input", { ref: importRef, type: "file", accept: ".json", hidden: true, onChange: handleImport }), /* @__PURE__ */ React.createElement("button", { className: "btn text", onClick: () => window.importChromeBookmarks() }, "Import Chrome Bookmarks")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(SettingsPage, null));
r(/* @__PURE__ */ React.createElement(SettingsPage, null));

var { useState, useEffect, useMemo, useCallback, useRef } = React;
function useTheme(prefTheme, arcadeGame) {
  useEffect(() => {
    const apply = () => {
      let mode = prefTheme || "light";
      document.documentElement.setAttribute("data-theme", mode);
      if (mode === "arcade" && arcadeGame) {
        document.documentElement.setAttribute("data-arcade-game", arcadeGame);
      } else {
        document.documentElement.removeAttribute("data-arcade-game");
      }
    };
    apply();
  }, [prefTheme, arcadeGame]);
}
function greetingFor(now, name, templates) {
  const h = now.getHours();
  let timeOfDay = "evening";
  if (h < 5) timeOfDay = "night";
  else if (h < 12) timeOfDay = "morning";
  else if (h < 18) timeOfDay = "afternoon";
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const safeName = name || "Friend";
  if (Array.isArray(templates) && templates.length > 0) {
    const valid = templates.map((s) => (s || "").trim()).filter(Boolean);
    if (valid.length) {
      const idx = (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate() + h) % valid.length;
      return valid[idx].replace(/\{name\}/g, safeName).replace(/\{day\}/g, day).replace(/\{time\}/g, timeOfDay);
    }
  }
  const lead = timeOfDay === "night" ? "Still up" : "Good " + timeOfDay;
  return `${lead}, ${safeName}`;
}
function App() {
  const [name, setName] = useState("Friend");
  const [theme, setTheme] = useState("light");
  const [arcadeGame, setArcadeGame] = useState("pacman");
  const [widgets, setWidgets] = useState({ left: ["time", "notes"], right: ["weather", "todo", "finance"] });
  const [searchQ, setSearchQ] = useState("");
  const [greetings, setGreetings] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [dropHint, setDropHint] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [searchHits, setSearchHits] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSel, setSearchSel] = useState(0);
  const searchInputRef = useRef(null);
  const [now, setNow] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    window.getStorage(window.STORAGE_KEYS.name, "Friend").then(setName);
    window.getStorage(window.STORAGE_KEYS.theme, "light").then(setTheme);
    window.getStorage(window.STORAGE_KEYS.arcadeGame, "pacman").then(setArcadeGame);
    window.getStorage(window.STORAGE_KEYS.widgets, { left: ["time", "notes"], right: ["weather", "todo"] }).then(setWidgets);
    window.getStorage(window.STORAGE_KEYS.greetings, []).then(setGreetings);
  }, []);
  useEffect(() => {
    if (!chrome?.storage?.onChanged) return;
    const handler = (changes) => {
      if (changes[window.STORAGE_KEYS.greetings]) {
        setGreetings(changes[window.STORAGE_KEYS.greetings].newValue || []);
      }
      if (changes[window.STORAGE_KEYS.widgets]) {
        setWidgets(changes[window.STORAGE_KEYS.widgets].newValue || { left: [], right: [] });
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);
  useEffect(() => {
    let styleEl = document.getElementById("user-custom-css");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "user-custom-css";
      document.head.appendChild(styleEl);
    }
    const apply = (css) => {
      styleEl.textContent = css || "";
    };
    window.getStorage(window.STORAGE_KEYS.customCSS, "").then(apply);
    if (!chrome?.storage?.onChanged) return;
    const handler = (changes) => {
      if (changes[window.STORAGE_KEYS.customCSS]) apply(changes[window.STORAGE_KEYS.customCSS].newValue || "");
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);
  const persistWidgets = useCallback((next) => {
    setWidgets(next);
    window.setStorage(window.STORAGE_KEYS.widgets, next);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Escape") {
        if (focusMode) {
          setFocusMode(false);
          e.preventDefault();
          return;
        }
        if (searchOpen) {
          setSearchOpen(false);
          e.preventDefault();
          return;
        }
        if (target && target.blur) target.blur();
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        window.location.href = "settings.html";
        return;
      }
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (inField) return;
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setFocusMode((v) => !v);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode, searchOpen]);
  useEffect(() => {
    const q = searchQ.trim();
    if (!q) {
      setSearchHits([]);
      setSearchOpen(false);
      return;
    }
    if (!chrome?.bookmarks?.search) return;
    let cancelled = false;
    chrome.bookmarks.search(q, (results) => {
      if (cancelled) return;
      const hits = (results || []).filter((r) => r.url).slice(0, 8);
      setSearchHits(hits);
      setSearchOpen(hits.length > 0);
      setSearchSel(0);
    });
    return () => {
      cancelled = true;
    };
  }, [searchQ]);
  const handleDragStart = (e, id, fromCol) => {
    setDragState({ id, fromCol });
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch (_) {
    }
  };
  const handleDragEnd = () => {
    setDragState(null);
    setDropHint(null);
  };
  const handleDragOver = (e, col) => {
    if (!dragState) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const colItems = widgets[col] || [];
    const dropzone = e.currentTarget.closest(".dropzone");
    let index = colItems.length;
    if (dropzone) {
      const widgetEls = Array.from(dropzone.querySelectorAll(".widget:not(.dragging)"));
      for (let i = 0; i < widgetEls.length; i++) {
        const rect = widgetEls[i].getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (e.clientY < middleY) {
          index = i;
          break;
        }
      }
    }
    const { id, fromCol } = dragState;
    const sourceIdx = colItems.indexOf(id);
    if (fromCol === col && (index === sourceIdx || index === sourceIdx + 1)) {
      setDropHint(null);
    } else {
      setDropHint({ col, index });
    }
  };
  const handleDrop = (e, col) => {
    if (!dragState) return;
    e.preventDefault();
    const { id, fromCol } = dragState;
    const colItems = widgets[col] || [];
    const dropzone = e.currentTarget.closest(".dropzone");
    let index = colItems.length;
    if (dropzone) {
      const widgetEls = Array.from(dropzone.querySelectorAll(".widget:not(.dragging)"));
      for (let i = 0; i < widgetEls.length; i++) {
        const rect = widgetEls[i].getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (e.clientY < middleY) {
          index = i;
          break;
        }
      }
    }
    const next = { left: [...widgets.left], right: [...widgets.right] };
    const sourceIdx = next[fromCol].indexOf(id);
    if (sourceIdx !== -1) next[fromCol].splice(sourceIdx, 1);
    let insertAt = index;
    if (fromCol === col && sourceIdx !== -1 && sourceIdx < index) {
      insertAt = index - 1;
    }
    if (insertAt < 0) insertAt = 0;
    if (insertAt > next[col].length) insertAt = next[col].length;
    next[col].splice(insertAt, 0, id);
    persistWidgets(next);
    handleDragEnd();
  };
  useTheme(theme, arcadeGame);
  const openHit = (hit) => {
    if (!hit?.url) return;
    window.location.href = hit.url;
  };
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    if (searchOpen && searchHits[searchSel]) {
      openHit(searchHits[searchSel]);
      return;
    }
    window.getStorage(window.STORAGE_KEYS.searchEngine, "google").then((engine) => {
      const urls = {
        google: "https://google.com/search?q=",
        duckduckgo: "https://duckduckgo.com/?q=",
        bing: "https://bing.com/search?q=",
        brave: "https://search.brave.com/search?q="
      };
      window.location.href = (urls[engine] || urls.google) + encodeURIComponent(searchQ);
    });
  };
  const onSearchKey = (e) => {
    if (!searchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchSel((i) => Math.min(i + 1, searchHits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchSel((i) => Math.max(i - 1, 0));
    }
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "arcade" : "light";
    setTheme(next);
    window.setStorage(window.STORAGE_KEYS.theme, next);
  };
  const widgetFor = (id) => {
    switch (id) {
      case "time":
        return /* @__PURE__ */ React.createElement(window.ClocksWidget, null);
      case "notes":
        return /* @__PURE__ */ React.createElement(window.NotesWidget, null);
      case "weather":
        return /* @__PURE__ */ React.createElement(window.WeatherWidget, null);
      case "todo":
        return /* @__PURE__ */ React.createElement(window.TodoWidget, null);
      case "pomodoro":
        return /* @__PURE__ */ React.createElement(window.PomodoroWidget, null);
      case "crypto":
        return /* @__PURE__ */ React.createElement(window.CryptoWidget, null);
      case "fx":
        return /* @__PURE__ */ React.createElement(window.FXWidget, null);
      case "history":
        return /* @__PURE__ */ React.createElement(window.HistoryWidget, null);
      case "stocks":
        return /* @__PURE__ */ React.createElement(window.StockWidget, null);
      case "quote":
        return /* @__PURE__ */ React.createElement(window.QuoteWidget, null);
      default:
        return null;
    }
  };
  const renderColumn = (col) => {
    const items = widgets[col] || [];
    const isHinted = dropHint && dropHint.col === col;
    const isDraggingActive = !!dragState;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "dropzone col " + col + "-col" + (isDraggingActive ? " dropzone-active" : "") + (isHinted ? " drag-over" : ""),
        onDragOver: (e) => handleDragOver(e, col),
        onDrop: (e) => handleDrop(e, col)
      },
      items.map((id, idx) => /* @__PURE__ */ React.createElement(React.Fragment, { key: id }, /* @__PURE__ */ React.createElement("div", { className: "drop-indicator" + (isHinted && dropHint.index === idx ? " show" : "") }), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "widget" + (dragState?.id === id ? " dragging" : ""),
          draggable: true,
          onDragStart: (e) => handleDragStart(e, id, col),
          onDragEnd: handleDragEnd
        },
        widgetFor(id)
      ))),
      /* @__PURE__ */ React.createElement("div", { className: "drop-indicator" + (isHinted && dropHint.index === items.length ? " show" : "") }),
      items.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "dropzone-empty" }, "Drop widget here")
    );
  };
  const formatDate = (date) => {
    const options = { weekday: "long", month: "long", day: "numeric" };
    const dateStr = date.toLocaleDateString("en-US", options);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 864e5;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    const [weekday, monthDay] = dateStr.split(", ");
    return /* @__PURE__ */ React.createElement("span", { className: "brand-sub" }, /* @__PURE__ */ React.createElement("b", null, weekday, ", ", monthDay), " \xB7 Week ", weekNum);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "app" + (focusMode ? " focus-mode" : "") }, focusMode && /* @__PURE__ */ React.createElement("div", { className: "focus-overlay", onClick: () => setFocusMode(false) }, /* @__PURE__ */ React.createElement("div", { className: "focus-time" }, now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })), /* @__PURE__ */ React.createElement("div", { className: "focus-date" }, now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })), /* @__PURE__ */ React.createElement("div", { className: "focus-hint" }, "Press ", /* @__PURE__ */ React.createElement("kbd", null, "F"), " or click anywhere to exit")), /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-dot" }), /* @__PURE__ */ React.createElement("div", { className: "brand-text" }, /* @__PURE__ */ React.createElement("div", { className: "brand-title" }, greetingFor(now, name, greetings)), formatDate(now))), /* @__PURE__ */ React.createElement("div", { className: "search-wrap" }, /* @__PURE__ */ React.createElement("form", { className: "search", onSubmit: handleSearch }, /* @__PURE__ */ React.createElement(Icon.search, { size: 16, style: { color: "var(--text-mute)" } }), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: searchInputRef,
      type: "text",
      placeholder: "Search bookmarks or the web\u2026",
      value: searchQ,
      onChange: (e) => setSearchQ(e.target.value),
      onKeyDown: onSearchKey,
      onFocus: () => searchHits.length > 0 && setSearchOpen(true),
      onBlur: () => setTimeout(() => setSearchOpen(false), 120)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "kbd" }, "\u2318K")), searchOpen && searchHits.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "search-dropdown" }, searchHits.map((h, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: h.id,
      className: "search-hit" + (i === searchSel ? " active" : ""),
      onMouseDown: (e) => {
        e.preventDefault();
        openHit(h);
      },
      onMouseEnter: () => setSearchSel(i)
    },
    /* @__PURE__ */ React.createElement("img", { className: "search-hit-fav", src: window.faviconUrl(h.url, 16), alt: "", onError: (e) => {
      e.target.style.visibility = "hidden";
    } }),
    /* @__PURE__ */ React.createElement("div", { className: "search-hit-text" }, /* @__PURE__ */ React.createElement("div", { className: "search-hit-title" }, h.title || h.url), /* @__PURE__ */ React.createElement("div", { className: "search-hit-host" }, (() => {
      try {
        return new URL(h.url).hostname;
      } catch {
        return h.url;
      }
    })()))
  )))), /* @__PURE__ */ React.createElement("div", { className: "topbar-right", style: { display: "flex", gap: 8, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: toggleTheme, "aria-label": "Toggle theme" }, theme === "dark" ? /* @__PURE__ */ React.createElement(Icon.sun, { size: 20 }) : /* @__PURE__ */ React.createElement(Icon.moon, { size: 20 })), /* @__PURE__ */ React.createElement("a", { href: "manager.html", className: "icon-btn", "aria-label": "Bookmarks" }, /* @__PURE__ */ React.createElement(Icon.folder, { size: 20 })), /* @__PURE__ */ React.createElement("a", { href: "settings.html", className: "icon-btn", "aria-label": "Settings" }, /* @__PURE__ */ React.createElement(Icon.settings, { size: 20 })))), /* @__PURE__ */ React.createElement("div", { className: "quote-subsearch" }, /* @__PURE__ */ React.createElement(window.QuoteWidget, null)), /* @__PURE__ */ React.createElement("main", { className: "main-grid" + (dragState ? " drag-active" : "") }, renderColumn("left"), /* @__PURE__ */ React.createElement("div", { className: "main-col" }, /* @__PURE__ */ React.createElement(window.BookmarksHero, null)), renderColumn("right")), /* @__PURE__ */ React.createElement("footer", { className: "footer" }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-mute)" } }, "Stored locally \xB7 1stTab v1.0.0")));
}
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(/* @__PURE__ */ React.createElement(App, null));

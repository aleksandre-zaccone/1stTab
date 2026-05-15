const { useState, useEffect, useRef, useMemo } = React;
function fmtBytes(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
  if (b >= 1e6) return (b / 1e6).toFixed(0) + " MB";
  return (b / 1e3).toFixed(0) + " KB";
}
function formatTime(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);
  return {
    hour: parts.find((p) => p.type === "hour")?.value || "",
    minute: parts.find((p) => p.type === "minute")?.value || "",
    dayPeriod: parts.find((p) => p.type === "dayPeriod")?.value || ""
  };
}
function tzOffsetLabel(date, tz) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value || tz;
}
const DEFAULT_ORDER = ["tabs", "bookmarks", "system"];
const DEFAULT_OPEN = { tabs: true, bookmarks: true, system: false };
function loadLayout() {
  try {
    return {
      order: JSON.parse(localStorage.getItem("panel.order") || "null") || DEFAULT_ORDER,
      open: JSON.parse(localStorage.getItem("panel.open") || "null") || DEFAULT_OPEN
    };
  } catch {
    return { order: DEFAULT_ORDER, open: DEFAULT_OPEN };
  }
}
function useNow() {
  const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(t);
  }, []);
  return now;
}
function useTabs() {
  const [tabs, setTabs] = useState([]);
  useEffect(() => {
    const refresh = () => chrome.tabs.query({}, setTabs);
    refresh();
    chrome.tabs.onCreated.addListener(refresh);
    chrome.tabs.onRemoved.addListener(refresh);
    chrome.tabs.onUpdated.addListener(refresh);
    chrome.tabs.onActivated.addListener(refresh);
    return () => {
      chrome.tabs.onCreated.removeListener(refresh);
      chrome.tabs.onRemoved.removeListener(refresh);
      chrome.tabs.onUpdated.removeListener(refresh);
      chrome.tabs.onActivated.removeListener(refresh);
    };
  }, []);
  return tabs;
}
function useCpuUsage(active) {
  const [pct, setPct] = useState(null);
  const prev = useRef(null);
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      chrome.system.cpu.getInfo((info) => {
        const cores = info.processors;
        if (!prev.current) {
          prev.current = cores.map((c) => ({ ...c.usage }));
          return;
        }
        let busy = 0, total = 0;
        cores.forEach((core, i) => {
          const p = prev.current[i], c = core.usage;
          const du = c.user - p.user, dk = c.kernel - p.kernel, di = c.idle - p.idle;
          busy += du + dk;
          total += du + dk + di;
        });
        prev.current = cores.map((c) => ({ ...c.usage }));
        if (total > 0) setPct(Math.min(100, Math.round(busy / total * 100)));
      });
    };
    tick();
    const id = setInterval(tick, 2e3);
    return () => clearInterval(id);
  }, [active]);
  return pct;
}
function useMemoryInfo(active) {
  const [mem, setMem] = useState(null);
  useEffect(() => {
    if (!active) return;
    const tick = () => chrome.system.memory.getInfo(setMem);
    tick();
    const id = setInterval(tick, 2e3);
    return () => clearInterval(id);
  }, [active]);
  return mem;
}
function useStorageInfo(active) {
  const [info, setInfo] = useState([]);
  useEffect(() => {
    if (!active) return;
    chrome.system.storage.getInfo(setInfo);
  }, [active]);
  return info;
}
function ClocksStrip() {
  const now = useNow();
  const [zones] = useStorage(STORAGE_KEYS.zones, defaultZones(), true);
  return React.createElement(
    "div",
    { className: "panel-clocks" },
    zones.map((z) => {
      const { hour, minute, dayPeriod } = formatTime(now, z.tz);
      const offset = tzOffsetLabel(now, z.tz);
      return React.createElement(
        "div",
        { key: z.id, className: "panel-clock-item" },
        React.createElement("span", { className: "panel-clock-label" }, z.label),
        React.createElement(
          "span",
          { className: "panel-clock-time" },
          `${hour}:${minute}`,
          React.createElement("span", { className: "panel-clock-period" }, ` ${dayPeriod}`)
        ),
        React.createElement("span", { className: "panel-clock-offset" }, offset)
      );
    })
  );
}
function BmFavicon({ url, name }) {
  const src = faviconUrl(url, 32);
  const bg = colorForString(url);
  const initial = initialFromUrl(url, name);
  const [ok, setOk] = useState(!!src);
  useEffect(() => {
    setOk(!!src);
  }, [src]);
  if (ok && src) {
    return React.createElement("img", {
      className: "panel-bm-favicon",
      src,
      alt: "",
      onError: () => setOk(false)
    });
  }
  return React.createElement("span", {
    className: "panel-bm-favicon-fallback",
    style: { background: bg }
  }, initial);
}
function PanelSection({ id, title, icon, open, onToggle, onDragStart, onDragOver, onDrop, onDragEnd, dragging, children }) {
  return React.createElement(
    "div",
    {
      className: `panel-section${dragging ? " panel-section--dragging" : ""}`,
      onDragOver: (e) => {
        e.preventDefault();
        onDragOver(id);
      },
      onDrop: () => onDrop(id)
    },
    React.createElement(
      "div",
      {
        className: "panel-sec-header",
        draggable: true,
        onDragStart: () => onDragStart(id),
        onDragEnd,
        onClick: onToggle
      },
      React.createElement("span", { className: "panel-sec-drag", title: "Drag to reorder" }, "\u283F"),
      React.createElement("span", { className: "panel-sec-icon" }, icon),
      React.createElement("span", { className: "panel-sec-title" }, title),
      React.createElement("span", { className: `panel-sec-chevron${open ? " open" : ""}` }, "\u203A")
    ),
    open && React.createElement("div", { className: "panel-sec-body" }, children)
  );
}
function TabItem({ tab }) {
  function switchTo() {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
  }
  function close(e) {
    e.stopPropagation();
    chrome.tabs.remove(tab.id);
  }
  function toggleMute(e) {
    e.stopPropagation();
    chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted });
  }
  function togglePin(e) {
    e.stopPropagation();
    chrome.tabs.update(tab.id, { pinned: !tab.pinned });
  }
  return React.createElement(
    "div",
    {
      className: `panel-tab${tab.active ? " panel-tab--active" : ""}`,
      onClick: switchTo,
      title: tab.url
    },
    tab.favIconUrl ? React.createElement("img", { className: "panel-tab-fav", src: tab.favIconUrl, alt: "", onError: (e) => {
      e.target.style.display = "none";
    } }) : React.createElement("span", { className: "panel-tab-fav panel-tab-fav--empty" }),
    React.createElement("span", { className: "panel-tab-title" }, tab.title || tab.url),
    React.createElement(
      "div",
      { className: "panel-tab-actions" },
      React.createElement("button", {
        className: `panel-tab-btn${tab.pinned ? " active" : ""}`,
        onClick: togglePin,
        title: tab.pinned ? "Unpin" : "Pin"
      }, "\u{1F4CC}"),
      React.createElement("button", {
        className: `panel-tab-btn${tab.mutedInfo?.muted ? " active" : ""}`,
        onClick: toggleMute,
        title: tab.mutedInfo?.muted ? "Unmute" : "Mute"
      }, tab.mutedInfo?.muted ? "\u{1F507}" : "\u{1F50A}"),
      React.createElement("button", {
        className: "panel-tab-btn panel-tab-close",
        onClick: close,
        title: "Close tab"
      }, "\xD7")
    )
  );
}
function TabsSection({ open }) {
  const allTabs = useTabs();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? allTabs.filter((t) => t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)) : allTabs;
  const byWindow = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (!map[t.windowId]) map[t.windowId] = [];
      map[t.windowId].push(t);
    });
    return map;
  }, [filtered]);
  const windowIds = Object.keys(byWindow);
  return React.createElement(
    "div",
    { className: "panel-tabs-wrap" },
    React.createElement(
      "div",
      { className: "panel-sec-search-wrap" },
      React.createElement("input", {
        type: "search",
        className: "panel-sec-search",
        placeholder: "Search tabs\u2026",
        value: query,
        onChange: (e) => setQuery(e.target.value)
      })
    ),
    allTabs.length === 0 ? React.createElement("p", { className: "panel-sec-empty" }, "No open tabs.") : windowIds.map(
      (wid, i) => React.createElement(
        "div",
        { key: wid, className: "panel-window" },
        windowIds.length > 1 && React.createElement("div", { className: "panel-window-label" }, `Window ${i + 1}`),
        byWindow[wid].map((tab) => React.createElement(TabItem, { key: tab.id, tab }))
      )
    )
  );
}
function BmFolder({ folder, bookmarks }) {
  const [open, setOpen] = useState(false);
  if (!bookmarks.length) return null;
  return React.createElement(
    "div",
    { className: "panel-folder" },
    React.createElement(
      "div",
      {
        className: "panel-folder-header",
        onClick: () => setOpen((o) => !o)
      },
      React.createElement("span", { className: `panel-folder-chevron${open ? " open" : ""}` }, "\u25B6"),
      React.createElement("span", { className: "panel-folder-icon" }, "\u{1F4C1}"),
      React.createElement("span", { className: "panel-folder-name" }, folder.name),
      React.createElement("span", { className: "panel-folder-count" }, bookmarks.length)
    ),
    open && React.createElement(
      "div",
      { className: "panel-bm-list" },
      bookmarks.map(
        (bm) => React.createElement(
          "a",
          {
            key: bm.id,
            href: bm.url,
            className: "panel-bm",
            title: bm.url,
            target: "_blank",
            rel: "noreferrer"
          },
          React.createElement(BmFavicon, { url: bm.url, name: bm.name }),
          React.createElement("span", { className: "panel-bm-name" }, bm.name || bm.url)
        )
      )
    )
  );
}
function BookmarksSection() {
  const [folders] = useStorage(STORAGE_KEYS.folders, SEED_FOLDERS);
  const [bookmarks] = useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? bookmarks.filter(
    (bm) => bm.name?.toLowerCase().includes(q) || bm.url?.toLowerCase().includes(q) || bm.tags?.some((t) => t.toLowerCase().includes(q))
  ) : bookmarks;
  const byFolder = {};
  filtered.forEach((bm) => {
    if (!byFolder[bm.folderId]) byFolder[bm.folderId] = [];
    byFolder[bm.folderId].push(bm);
  });
  const activeFolders = folders.filter((f) => byFolder[f.id]?.length);
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { className: "panel-sec-search-wrap" },
      React.createElement("input", {
        type: "search",
        className: "panel-sec-search",
        placeholder: "Search bookmarks\u2026",
        value: query,
        onChange: (e) => setQuery(e.target.value)
      })
    ),
    activeFolders.length === 0 ? React.createElement("p", { className: "panel-sec-empty" }, q ? "No matches." : "No bookmarks yet.") : activeFolders.map((f) => React.createElement(BmFolder, { key: f.id, folder: f, bookmarks: byFolder[f.id] }))
  );
}
function SysBar({ pct, color }) {
  return React.createElement(
    "div",
    { className: "panel-sys-bar-bg" },
    React.createElement("div", {
      className: "panel-sys-bar-fill",
      style: { width: `${pct}%`, background: color || "var(--md-primary, #1976d2)" }
    })
  );
}
function SystemSection({ open }) {
  const cpu = useCpuUsage(open);
  const mem = useMemoryInfo(open);
  const drives = useStorageInfo(open);
  const memPct = mem ? Math.round((mem.capacity - mem.availableCapacity) / mem.capacity * 100) : 0;
  const memUsed = mem ? fmtBytes(mem.capacity - mem.availableCapacity) : "\u2014";
  const memTotal = mem ? fmtBytes(mem.capacity) : "\u2014";
  const cpuColor = cpu > 80 ? "#e53935" : cpu > 50 ? "#fb8c00" : "var(--md-primary, #1976d2)";
  return React.createElement(
    "div",
    { className: "panel-sys" },
    // CPU
    React.createElement(
      "div",
      { className: "panel-sys-metric" },
      React.createElement(
        "div",
        { className: "panel-sys-row" },
        React.createElement("span", { className: "panel-sys-label" }, "CPU"),
        React.createElement("span", { className: "panel-sys-value" }, cpu === null ? "\u2026" : `${cpu}%`)
      ),
      React.createElement(SysBar, { pct: cpu ?? 0, color: cpuColor })
    ),
    // RAM
    mem && React.createElement(
      "div",
      { className: "panel-sys-metric" },
      React.createElement(
        "div",
        { className: "panel-sys-row" },
        React.createElement("span", { className: "panel-sys-label" }, "RAM"),
        React.createElement("span", { className: "panel-sys-value" }, `${memUsed} / ${memTotal}`)
      ),
      React.createElement(SysBar, { pct: memPct })
    ),
    // Storage drives
    drives.length > 0 && React.createElement(
      "div",
      { className: "panel-sys-drives" },
      React.createElement("div", { className: "panel-sys-drives-title" }, "Storage"),
      drives.map(
        (d) => React.createElement(
          "div",
          { key: d.id, className: "panel-sys-drive" },
          React.createElement("span", { className: "panel-sys-drive-name" }, d.name || d.type),
          React.createElement("span", { className: "panel-sys-drive-cap" }, fmtBytes(d.capacity))
        )
      )
    )
  );
}
const SECTION_META = {
  tabs: { title: "Tabs", icon: "\u2B1C" },
  bookmarks: { title: "Bookmarks", icon: "\u{1F516}" },
  system: { title: "System", icon: "\u{1F4BB}" }
};
function PanelApp() {
  const initial = loadLayout();
  const [order, setOrder] = useState(initial.order);
  const [open, setOpen] = useState(initial.open);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  function toggleSection(id) {
    const next = { ...open, [id]: !open[id] };
    setOpen(next);
    localStorage.setItem("panel.open", JSON.stringify(next));
  }
  function onDragStart(id) {
    setDragId(id);
  }
  function onDragOver(id) {
    if (id !== dragId) setOverId(id);
  }
  function onDrop(id) {
    if (!dragId || dragId === id) return;
    const next = [...order];
    const from = next.indexOf(dragId);
    const to = next.indexOf(id);
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setOrder(next);
    localStorage.setItem("panel.order", JSON.stringify(next));
    setDragId(null);
    setOverId(null);
  }
  function onDragEnd() {
    setDragId(null);
    setOverId(null);
  }
  function detach() {
    chrome.windows.create({
      url: chrome.runtime.getURL("panel.html"),
      type: "popup",
      width: 360,
      height: 680,
      focused: true
    });
  }
  function renderSection(id) {
    const meta = SECTION_META[id];
    const isOpen = !!open[id];
    return React.createElement(
      PanelSection,
      {
        key: id,
        id,
        open: isOpen,
        title: meta.title,
        icon: meta.icon,
        dragging: overId === id,
        onToggle: () => toggleSection(id),
        onDragStart,
        onDragOver,
        onDrop,
        onDragEnd
      },
      id === "tabs" && React.createElement(TabsSection, { open: isOpen }),
      id === "bookmarks" && React.createElement(BookmarksSection),
      id === "system" && React.createElement(SystemSection, { open: isOpen })
    );
  }
  return React.createElement(
    "div",
    { className: "panel-root" },
    // Header
    React.createElement(
      "header",
      { className: "panel-header" },
      React.createElement(
        "span",
        { className: "panel-logo" },
        "1st",
        React.createElement("span", { className: "panel-logo-dot" }, "Tab")
      ),
      React.createElement(
        "div",
        { className: "panel-header-actions" },
        React.createElement("button", {
          className: "panel-icon-btn",
          onClick: detach,
          title: "Open as floating window"
        }, "\u29C9")
      )
    ),
    // Clocks
    React.createElement(ClocksStrip),
    // Sections (reorderable)
    React.createElement(
      "div",
      { className: "panel-body" },
      order.map((id) => renderSection(id))
    ),
    // Footer
    React.createElement(
      "div",
      { className: "panel-footer" },
      "Alt+Shift+P to open \xB7 drag sections to reorder"
    )
  );
}
ReactDOM.render(React.createElement(PanelApp), document.getElementById("root"));

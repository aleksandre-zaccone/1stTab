const { useState, useEffect, useRef, useMemo } = React;
function fmtBytes(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
  if (b >= 1e6) return (b / 1e6).toFixed(0) + " MB";
  return (b / 1e3).toFixed(0) + " KB";
}
function BmFavicon({ url, name, size = 16 }) {
  const src = faviconUrl(url, size * 2);
  const [ok, setOk] = useState(!!src);
  useEffect(() => {
    setOk(!!src);
  }, [src]);
  if (ok && src) {
    return React.createElement("img", {
      className: "p-bm-fav",
      src,
      alt: "",
      style: { width: `${size}px`, height: `${size}px`, flexShrink: 0 },
      onError: () => setOk(false)
    });
  }
  return React.createElement("span", {
    className: "material-symbols-outlined",
    style: { fontSize: `${size}px`, opacity: 0.6, flexShrink: 0 }
  }, "public");
}
function BookmarkNode({ node, depth = 0, searchQuery = "" }) {
  const isFolder = !!node.children;
  const [open, setOpen] = useState(depth < 1);
  const filteredChildren = useMemo(() => {
    if (!isFolder) return null;
    if (!searchQuery) return node.children;
    const matches = (n) => {
      if (n.title?.toLowerCase().includes(searchQuery)) return true;
      if (n.url?.toLowerCase().includes(searchQuery)) return true;
      if (n.children) return n.children.some(matches);
      return false;
    };
    return node.children.filter(matches);
  }, [node.children, searchQuery, isFolder]);
  if (searchQuery && isFolder && !filteredChildren?.length) return null;
  if (node.id === "0") {
    return React.createElement(
      "div",
      null,
      (node.children || []).map(
        (child) => React.createElement(BookmarkNode, { key: child.id, node: child, depth, searchQuery })
      )
    );
  }
  const handleClick = (e) => {
    if (isFolder) setOpen(!open);
    else if (node.url) window.open(node.url, "_blank");
  };
  return React.createElement(
    "div",
    { className: "p-tree-node" },
    React.createElement(
      "div",
      {
        className: `p-tree-row ${isFolder ? "p-tree-row--folder" : "p-tree-row--item"}`,
        style: { paddingLeft: `${depth * 16 + 10}px` },
        onClick: handleClick
      },
      isFolder ? React.createElement("span", {
        className: `p-tree-chevron material-symbols-outlined ${open ? "open" : ""}`,
        style: { fontSize: "16px" }
      }, "chevron_right") : React.createElement("span", { style: { width: "16px" } }),
      isFolder ? React.createElement("span", {
        className: "material-symbols-outlined p-tree-icon",
        style: { fontSize: "18px", color: "var(--accent-blue)" }
      }, open ? "folder_open" : "folder") : React.createElement(BmFavicon, { url: node.url, name: node.title }),
      React.createElement("span", { className: "p-tree-text" }, node.title || (isFolder ? "Folder" : "Bookmark"))
    ),
    isFolder && open && React.createElement(
      "div",
      { className: "p-tree-children" },
      filteredChildren.map(
        (child) => React.createElement(BookmarkNode, { key: child.id, node: child, depth: depth + 1, searchQuery })
      )
    )
  );
}
function buildPluginBookmarksTree(folders, bookmarks) {
  const folderMap = {};
  folders.forEach((f) => {
    folderMap[f.id] = {
      id: f.id,
      title: f.name,
      children: []
    };
  });
  const pluginRoot = {
    id: "plugin-root",
    title: "1stTab Dashboard",
    children: []
  };
  bookmarks.forEach((b) => {
    const node = {
      id: b.id,
      title: b.name,
      url: b.url
    };
    const folderNode = folderMap[b.folderId];
    if (folderNode) {
      folderNode.children.push(node);
    } else {
      pluginRoot.children.push(node);
    }
  });
  folders.forEach((f) => {
    const folderNode = folderMap[f.id];
    if (f.parentId && folderMap[f.parentId]) {
      folderMap[f.parentId].children.push(folderNode);
    } else {
      pluginRoot.children.push(folderNode);
    }
  });
  return pluginRoot;
}
function BookmarksContent() {
  const [bookmarks] = window.useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS, false);
  const [folders] = window.useStorage(STORAGE_KEYS.folders, SEED_FOLDERS, false);
  const [tree, setTree] = useState(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      chrome.bookmarks.getTree((res) => {
        if (res && res[0]) {
          const chromeRoot = { ...res[0] };
          const pluginSubtree = buildPluginBookmarksTree(folders || [], bookmarks || []);
          chromeRoot.children = [pluginSubtree, ...chromeRoot.children || []];
          setTree([chromeRoot]);
        } else {
          setTree(res);
        }
      });
    } else {
      const pluginSubtree = buildPluginBookmarksTree(folders || [], bookmarks || []);
      setTree([{ id: "0", title: "Root", children: [pluginSubtree] }]);
    }
  }, [bookmarks, folders]);
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      { className: "p-search-wrap" },
      React.createElement("input", {
        type: "search",
        className: "p-search",
        placeholder: "Search bookmarks\u2026",
        value: query,
        onChange: (e) => setQuery(e.target.value)
      })
    ),
    React.createElement(
      "div",
      { className: "p-scroll p-tree-root" },
      tree ? tree.length > 0 ? React.createElement(BookmarkNode, { node: tree[0], searchQuery: q }) : React.createElement("p", { className: "p-empty" }, "No bookmarks found.") : React.createElement("p", { className: "p-empty" }, "Loading bookmarks\u2026")
    )
  );
}
const CAL_COLORS = {
  "1": "#7986CB",
  "2": "#33B679",
  "3": "#8E24AA",
  "4": "#E67C73",
  "5": "#F6BF26",
  "6": "#F4511E",
  "7": "#039BE5",
  "8": "#616161",
  "9": "#3F51B5",
  "10": "#0B8043",
  "11": "#D50000"
};
function fmtEventTime(ev) {
  if (ev.start?.date) return "All day";
  const fmt = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${fmt(ev.start?.dateTime)} \u2013 ${fmt(ev.end?.dateTime)}`;
}
function groupEventsByDate(events) {
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const map = {};
  events.forEach((ev) => {
    const key = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
    if (!key) return;
    (map[key] = map[key] || []).push(ev);
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([key, evs]) => {
    const d = /* @__PURE__ */ new Date(key + "T00:00:00");
    const diff = Math.round((d - today) / 864e5);
    const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    return { key, label, events: evs };
  });
}
function fmtDueDate(due) {
  const d = new Date(due);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 864e5);
  if (diff < 0) return `Overdue \xB7 ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}
function PlusGate({ feature }) {
  return /* @__PURE__ */ React.createElement("div", { className: "p-plus-gate" }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined p-plus-gate-icon" }, "lock"), /* @__PURE__ */ React.createElement("p", { className: "p-plus-gate-text" }, /* @__PURE__ */ React.createElement("strong", null, feature), " requires 1stTab Plus with Google Drive connected."), /* @__PURE__ */ React.createElement("a", { href: "settings.html", target: "_blank", rel: "noopener noreferrer", className: "p-plus-gate-btn" }, "Open Settings"));
}
function CalendarContent() {
  const [plus] = window.useStorage("1stTab.plus", { active: false }, false);
  const [driveEmail] = window.useStorage("1stTab.driveEmail", null, false);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isPlus = plus?.active;
  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const result = await chrome.runtime.sendMessage({ action: "cal-events" });
      if (result.error) throw new Error(result.error);
      setEvents(result.events || []);
    } catch (e) {
      setError("Could not load events.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!isPlus || !driveEmail) return;
    fetchEvents();
    const id = setInterval(fetchEvents, 15 * 60 * 1e3);
    return () => clearInterval(id);
  }, [isPlus, driveEmail]);
  if (!isPlus || !driveEmail) return /* @__PURE__ */ React.createElement(PlusGate, { feature: "Google Calendar" });
  const grouped = groupEventsByDate(events || []);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "p-section-hd" }, /* @__PURE__ */ React.createElement("span", null, "Google Calendar"), /* @__PURE__ */ React.createElement("button", { className: "p-icon-btn", onClick: fetchEvents, disabled: loading, title: "Refresh" }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 16 } }, "refresh"))), /* @__PURE__ */ React.createElement("div", { className: "p-scroll" }, loading && events === null && /* @__PURE__ */ React.createElement("p", { className: "p-empty" }, "Loading events\u2026"), error && /* @__PURE__ */ React.createElement("div", { className: "p-error" }, error, /* @__PURE__ */ React.createElement("button", { className: "p-retry-btn", onClick: fetchEvents }, "Retry")), !loading && !error && grouped.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "p-empty" }, "No upcoming events in the next 4 days."), grouped.map(({ key, label, events: dayEvs }) => /* @__PURE__ */ React.createElement("div", { key, className: "p-cal-day" }, /* @__PURE__ */ React.createElement("div", { className: "p-cal-day-hd" }, label), dayEvs.map((ev) => /* @__PURE__ */ React.createElement(
    "a",
    {
      key: ev.id,
      className: "p-cal-event",
      href: ev.htmlLink,
      target: "_blank",
      rel: "noopener noreferrer"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "p-cal-event-dot",
        style: { backgroundColor: CAL_COLORS[ev.colorId] || "var(--accent-blue)" }
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "p-cal-event-body" }, /* @__PURE__ */ React.createElement("div", { className: "p-cal-event-title" }, ev.summary || "(no title)"), /* @__PURE__ */ React.createElement("div", { className: "p-cal-event-time" }, fmtEventTime(ev)))
  )))), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: "p-cal-add",
      href: "https://calendar.google.com/calendar/r/eventedit",
      target: "_blank",
      rel: "noopener noreferrer"
    },
    "+ Add event"
  )));
}
function TasksContent() {
  const [plus] = window.useStorage("1stTab.plus", { active: false }, false);
  const [driveEmail] = window.useStorage("1stTab.driveEmail", null, false);
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);
  const isPlus = plus?.active;
  async function fetchTasks() {
    setError(null);
    try {
      const result = await chrome.runtime.sendMessage({ action: "tasks-list" });
      if (result.error) throw new Error(result.error);
      setTasks(result.tasks || []);
    } catch (e) {
      setError("Could not load tasks.");
    }
  }
  useEffect(() => {
    if (!isPlus || !driveEmail) return;
    fetchTasks();
  }, [isPlus, driveEmail]);
  if (!isPlus || !driveEmail) return /* @__PURE__ */ React.createElement(PlusGate, { feature: "Google Tasks" });
  async function handleComplete(taskId) {
    setTasks((prev) => prev?.filter((t) => t.id !== taskId));
    await chrome.runtime.sendMessage({ action: "tasks-complete", taskId });
    fetchTasks();
  }
  async function handleAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    setNewTitle("");
    const result = await chrome.runtime.sendMessage({ action: "tasks-add", title });
    if (result?.task) {
      setTasks((prev) => [result.task, ...prev || []]);
    } else {
      await fetchTasks();
    }
    setAdding(false);
    inputRef.current?.focus();
  }
  const openTasks = (tasks || []).filter((t) => t.status !== "completed");
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("form", { onSubmit: handleAdd, className: "p-task-add-form" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: inputRef,
      className: "p-search p-task-add-input",
      placeholder: "Add a task\u2026",
      value: newTitle,
      onChange: (e) => setNewTitle(e.target.value),
      disabled: adding
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "p-task-add-btn",
      disabled: adding || !newTitle.trim()
    },
    "Add"
  )), /* @__PURE__ */ React.createElement("div", { className: "p-scroll" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-error" }, error, /* @__PURE__ */ React.createElement("button", { className: "p-retry-btn", onClick: fetchTasks }, "Retry")), tasks === null && !error && /* @__PURE__ */ React.createElement("p", { className: "p-empty" }, "Loading tasks\u2026"), tasks !== null && openTasks.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "p-empty" }, "No open tasks \u2014 add one above!"), openTasks.map((task) => /* @__PURE__ */ React.createElement("div", { key: task.id, className: "p-task-item" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "p-task-cb",
      onChange: () => handleComplete(task.id)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "p-task-body" }, /* @__PURE__ */ React.createElement("div", { className: "p-task-title" }, task.title), task.due && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "p-task-due",
      style: { color: new Date(task.due) < /* @__PURE__ */ new Date() ? "#d93025" : void 0 }
    },
    fmtDueDate(task.due)
  ))))));
}
function TabsContent() {
  const [tabs, setTabs] = useState([]);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  function loadTabs() {
    chrome.tabs.query({}, (t) => setTabs(t || []));
  }
  function loadRecent() {
    chrome.sessions.getRecentlyClosed({ maxResults: 8 }, (s) => {
      setRecent((s || []).filter((x) => x.tab).map((x) => x.tab));
    });
  }
  useEffect(() => {
    loadTabs();
    loadRecent();
    chrome.tabs.onUpdated.addListener(loadTabs);
    chrome.tabs.onCreated.addListener(loadTabs);
    chrome.tabs.onRemoved.addListener(loadTabs);
    return () => {
      chrome.tabs.onUpdated.removeListener(loadTabs);
      chrome.tabs.onCreated.removeListener(loadTabs);
      chrome.tabs.onRemoved.removeListener(loadTabs);
    };
  }, []);
  const q = query.toLowerCase();
  const filtered = tabs.filter(
    (t) => !q || t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)
  );
  const byWindow = {};
  filtered.forEach((t) => (byWindow[t.windowId] = byWindow[t.windowId] || []).push(t));
  const winIds = Object.keys(byWindow);
  async function switchTo(tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "p-search-wrap" }, /* @__PURE__ */ React.createElement("input", { className: "p-search", type: "search", placeholder: "Search tabs\u2026", value: query, onChange: (e) => setQuery(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "p-scroll" }, winIds.map((wid, wi) => /* @__PURE__ */ React.createElement("div", { key: wid }, winIds.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "p-tab-group-hd" }, "Window ", wi + 1), byWindow[wid].map((tab) => /* @__PURE__ */ React.createElement("div", { key: tab.id, className: `p-tab-row${tab.active ? " p-tab-row--active" : ""}`, onClick: () => switchTo(tab) }, /* @__PURE__ */ React.createElement("img", { className: "p-tab-fav", src: tab.favIconUrl || "", alt: "", onError: (e) => {
    e.target.style.display = "none";
  } }), /* @__PURE__ */ React.createElement("div", { className: "p-tab-info" }, /* @__PURE__ */ React.createElement("div", { className: "p-tab-title" }, tab.title || "Loading\u2026")), /* @__PURE__ */ React.createElement("div", { className: "p-tab-actions" }, tab.audible && /* @__PURE__ */ React.createElement("button", { className: "p-icon-btn", onClick: (e) => {
    e.stopPropagation();
    chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted });
  }, title: tab.mutedInfo?.muted ? "Unmute" : "Mute" }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 14 } }, tab.mutedInfo?.muted ? "volume_off" : "volume_up")), /* @__PURE__ */ React.createElement("button", { className: "p-icon-btn", onClick: (e) => {
    e.stopPropagation();
    chrome.tabs.remove(tab.id);
  }, title: "Close" }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 14 } }, "close"))))))), recent.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "p-tab-group-hd" }, "Recently Closed"), recent.slice(0, 5).map((tab, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "p-tab-row p-tab-row--closed", onClick: () => chrome.sessions.restore(tab.sessionId) }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 14, opacity: 0.4, flexShrink: 0 } }, "history"), /* @__PURE__ */ React.createElement("div", { className: "p-tab-info" }, /* @__PURE__ */ React.createElement("div", { className: "p-tab-title" }, tab.title || tab.url))))), filtered.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "p-empty" }, "No tabs match.")));
}
function SystemContent() {
  const [cpu, setCpu] = useState(null);
  const [mem, setMem] = useState(null);
  const [storage, setStorage] = useState(null);
  const prevCpuRef = useRef(null);
  function refresh() {
    if (chrome.system?.cpu) {
      chrome.system.cpu.getInfo((info) => {
        const prev = prevCpuRef.current;
        prevCpuRef.current = info;
        if (prev) {
          let used = 0, elapsed = 0;
          info.processors.forEach((p, i) => {
            const c = p.usage, o = prev.processors[i]?.usage || {};
            const delta = (c.total || 0) - (o.total || 0);
            const idle = (c.idle || 0) - (o.idle || 0);
            elapsed += delta;
            used += delta - idle;
          });
          setCpu(elapsed > 0 ? Math.min(100, Math.round(used / elapsed * 100)) : 0);
        }
      });
    }
    if (chrome.system?.memory) {
      chrome.system.memory.getInfo((info) => setMem({ used: info.capacity - info.availableCapacity, total: info.capacity }));
    }
    if (chrome.system?.storage) {
      chrome.system.storage.getInfo((drives) => setStorage(drives || []));
    }
  }
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2e3);
    return () => clearInterval(id);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "p-sys" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "p-sys-row" }, /* @__PURE__ */ React.createElement("span", null, "CPU"), /* @__PURE__ */ React.createElement("span", null, cpu !== null ? `${cpu}%` : "\u2026")), /* @__PURE__ */ React.createElement("div", { className: "p-sys-bar-bg" }, /* @__PURE__ */ React.createElement("div", { className: "p-sys-bar-fill", style: { width: `${cpu || 0}%`, background: cpu > 80 ? "#d93025" : void 0 } }))), mem && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "p-sys-row" }, /* @__PURE__ */ React.createElement("span", null, "RAM"), /* @__PURE__ */ React.createElement("span", null, fmtBytes(mem.used), " / ", fmtBytes(mem.total))), /* @__PURE__ */ React.createElement("div", { className: "p-sys-bar-bg" }, /* @__PURE__ */ React.createElement("div", { className: "p-sys-bar-fill", style: { width: `${Math.round(mem.used / mem.total * 100)}%` } }))), (storage || []).map((d) => /* @__PURE__ */ React.createElement("div", { key: d.id }, /* @__PURE__ */ React.createElement("div", { className: "p-sys-row" }, /* @__PURE__ */ React.createElement("span", null, d.name || "Disk"), /* @__PURE__ */ React.createElement("span", null, fmtBytes(d.capacity - d.availableCapacity), " / ", fmtBytes(d.capacity))), /* @__PURE__ */ React.createElement("div", { className: "p-sys-bar-bg" }, /* @__PURE__ */ React.createElement("div", { className: "p-sys-bar-fill", style: { width: `${Math.round((d.capacity - d.availableCapacity) / d.capacity * 100)}%` } })))));
}
function AIContent() {
  const [plus] = window.useStorage("1stTab.plus", { active: false }, false);
  const [aiProvider, setAiProvider] = window.useStorage("1stTab.aiProvider", "claude", false);
  const [claudeKey] = window.useStorage("1stTab.claudeKey", "", false);
  const [claudeModel, setClaudeModel] = window.useStorage("1stTab.claudeModel", "claude-3-5-haiku-20241022", false);
  const [openaiKey] = window.useStorage("1stTab.openaiKey", "", false);
  const [openaiModel, setOpenaiModel] = window.useStorage("1stTab.openaiModel", "gpt-4o-mini", false);
  const [geminiKey] = window.useStorage("1stTab.geminiKey", "", false);
  const [geminiModel, setGeminiModel] = window.useStorage("1stTab.geminiModel", "gemini-1.5-flash", false);
  const apiKey = aiProvider === "openai" ? openaiKey : aiProvider === "gemini" ? geminiKey : claudeKey;
  const modelId = aiProvider === "openai" ? openaiModel : aiProvider === "gemini" ? geminiModel : claudeModel;
  const [bookmarks] = window.useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS, false);
  const [folders] = window.useStorage(STORAGE_KEYS.folders, SEED_FOLDERS, false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamicGeminiModels, setDynamicGeminiModels] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (geminiKey) {
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey.trim()}`).then((res) => res.json()).then((data) => {
        if (data && data.models) {
          const valid = data.models.filter((m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")).map((m) => m.name.replace("models/", ""));
          if (valid.length > 0) {
            setDynamicGeminiModels(valid);
          }
        }
      }).catch((err) => console.error("Failed to fetch Gemini models:", err));
    }
  }, [geminiKey]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  if (!plus?.active) return /* @__PURE__ */ React.createElement(PlusGate, { feature: "AI Bookmark Assistant" });
  async function handleProviderChange(e) {
    const [newProvider, newModelId] = e.target.value.split(":");
    if (newProvider === aiProvider && newModelId === modelId) return;
    if (messages.length === 0) {
      if (newProvider === "claude") setClaudeModel(newModelId);
      if (newProvider === "openai") setOpenaiModel(newModelId);
      if (newProvider === "gemini") setGeminiModel(newModelId);
      setAiProvider(newProvider);
      return;
    }
    setLoading(true);
    try {
      const summaryMsg = { role: "user", content: "Summarize the key points, context, and decisions made in this conversation so far so another AI can continue it seamlessly. Be extremely concise." };
      const response = await chrome.runtime.sendMessage({
        action: "ai-assistant",
        provider: aiProvider,
        apiKey,
        modelId,
        userMsg: summaryMsg,
        ctx: "",
        // Don't need bookmark context for summarization
        messages
      });
      if (response.error) throw new Error(response.error);
      const data = response.data;
      const summaryText = data.content?.[0]?.text || "Conversation summarized.";
      const providerName = newProvider === "openai" ? "ChatGPT" : newProvider === "gemini" ? "Gemini" : "Claude";
      setMessages([{ role: "assistant", content: `[Switched to ${providerName} (${newModelId})]

Context from previous model:
${summaryText}` }]);
    } catch (err) {
      console.error("Failed to summarize:", err);
      const providerName = newProvider === "openai" ? "ChatGPT" : newProvider === "gemini" ? "Gemini" : "Claude";
      setMessages([{ role: "assistant", content: `[Switched to ${providerName} (${newModelId})]

(Failed to summarize previous context).` }]);
    } finally {
      if (newProvider === "claude") setClaudeModel(newModelId);
      if (newProvider === "openai") setOpenaiModel(newModelId);
      if (newProvider === "gemini") setGeminiModel(newModelId);
      setAiProvider(newProvider);
      setLoading(false);
    }
  }
  const header = /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 500 } }, "AI Model"), /* @__PURE__ */ React.createElement("select", { value: `${aiProvider}:${modelId}`, onChange: handleProviderChange, disabled: loading, style: { fontSize: 13, padding: "4px 8px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", maxWidth: 180 } }, /* @__PURE__ */ React.createElement("optgroup", { label: "Anthropic" }, /* @__PURE__ */ React.createElement("option", { value: "claude:claude-3-5-haiku-20241022" }, "Claude 3.5 Haiku"), /* @__PURE__ */ React.createElement("option", { value: "claude:claude-3-5-sonnet-20241022" }, "Claude 3.5 Sonnet")), /* @__PURE__ */ React.createElement("optgroup", { label: "OpenAI" }, /* @__PURE__ */ React.createElement("option", { value: "openai:gpt-4o-mini" }, "GPT-4o mini"), /* @__PURE__ */ React.createElement("option", { value: "openai:gpt-4o" }, "GPT-4o"), /* @__PURE__ */ React.createElement("option", { value: "openai:gpt-3.5-turbo" }, "GPT-3.5 Turbo")), /* @__PURE__ */ React.createElement("optgroup", { label: "Google Gemini" }, dynamicGeminiModels.length > 0 ? dynamicGeminiModels.map((m) => /* @__PURE__ */ React.createElement("option", { key: m, value: `gemini:${m}` }, m)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "gemini:gemini-3.0-flash" }, "Gemini 3.0 Flash"), /* @__PURE__ */ React.createElement("option", { value: "gemini:gemini-2.5-flash" }, "Gemini 2.5 Flash"), /* @__PURE__ */ React.createElement("option", { value: "gemini:gemini-2.0-flash" }, "Gemini 2.0 Flash"), /* @__PURE__ */ React.createElement("option", { value: "gemini:gemini-1.5-flash" }, "Gemini 1.5 Flash")))));
  if (!apiKey) {
    const providerName = aiProvider === "openai" ? "OpenAI" : aiProvider === "gemini" ? "Gemini" : "Claude";
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100%" } }, header, /* @__PURE__ */ React.createElement("div", { className: "p-plus-gate", style: { flex: 1 } }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined p-plus-gate-icon" }, "key"), /* @__PURE__ */ React.createElement("p", { className: "p-plus-gate-text" }, "Add your ", providerName, " API key in ", /* @__PURE__ */ React.createElement("strong", null, "Settings \u2192 Plus \u2192 AI"), "."), /* @__PURE__ */ React.createElement("a", { href: "settings.html", target: "_blank", rel: "noopener noreferrer", className: "p-plus-gate-btn" }, "Open Settings")));
  }
  async function handleSend(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    const userMsg = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    function scoreBookmark(b) {
      if (tokens.length === 0) return 1;
      const haystack = [
        b.name || "",
        b.url || "",
        (b.tags || []).join(" "),
        b.description || "",
        folders.find((f) => f.id === b.folderId)?.name || ""
      ].join(" ").toLowerCase();
      return tokens.reduce((score, tok) => score + (haystack.includes(tok) ? 1 : 0), 0);
    }
    const scoredBookmarks = (bookmarks || []).map((b) => ({ b, score: scoreBookmark(b) })).sort((a, z) => z.score - a.score).slice(0, 30).map(({ b }) => b);
    const ctx = scoredBookmarks.map((b) => {
      const f = folders.find((x) => x.id === b.folderId);
      return `${b.name} (${b.url}) \u2014 folder: ${f?.name || "?"} \u2014 tags: ${(b.tags || []).join(", ")} \u2014 ${b.description || ""}`;
    }).join("\n");
    try {
      const response = await chrome.runtime.sendMessage({
        action: "ai-assistant",
        provider: aiProvider,
        apiKey,
        modelId,
        userMsg,
        ctx,
        messages
      });
      if (response.error) throw new Error(response.error);
      const data = response.data;
      setMessages((prev) => [...prev, { role: "assistant", content: data.content?.[0]?.text || "(no response)" }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100%" } }, header, /* @__PURE__ */ React.createElement("div", { className: "p-scroll p-ai-messages", style: { flex: 1, overflowY: "auto" } }, messages.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "p-ai-hint" }, /* @__PURE__ */ React.createElement("p", { style: { marginBottom: 8 } }, "Ask about your bookmarks:"), /* @__PURE__ */ React.createElement("p", { className: "p-ai-example" }, '"Find my React articles"'), /* @__PURE__ */ React.createElement("p", { className: "p-ai-example" }, '"What did I save about travel?"'), /* @__PURE__ */ React.createElement("p", { className: "p-ai-example" }, '"Summarize my Work folder"')), messages.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `p-ai-msg p-ai-msg--${m.role}`, style: { whiteSpace: "pre-wrap" } }, m.content)), loading && /* @__PURE__ */ React.createElement("div", { className: "p-ai-msg p-ai-msg--assistant p-ai-typing" }, "\u2026"), /* @__PURE__ */ React.createElement("div", { ref: bottomRef })), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSend, className: "p-ai-form" }, /* @__PURE__ */ React.createElement("input", { ref: inputRef, className: "p-search", placeholder: "Ask about your bookmarks\u2026", value: input, onChange: (e) => setInput(e.target.value), disabled: loading }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "p-task-add-btn", disabled: loading || !input.trim() }, /* @__PURE__ */ React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: 16 } }, "send"))));
}
const NAV = [
  { id: "bookmarks", label: "Bookmarks", icon: "bookmarks" },
  { id: "calendar", label: "Calendar", icon: "calendar_today" },
  { id: "tasks", label: "Tasks", icon: "task_alt" },
  { id: "tabs", label: "Tabs", icon: "tab" },
  { id: "system", label: "System", icon: "monitor_heart" },
  { id: "ai", label: "AI Assistant", icon: "smart_toy" }
];
function PanelApp() {
  const [active, setActive] = useState("bookmarks");
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setActive("bookmarks");
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  function toggle(id) {
    setActive((prev) => prev === id ? null : id);
  }
  return React.createElement(
    "div",
    { className: `p-root${active ? " p-root--open" : ""}` },
    React.createElement(
      "nav",
      { className: "p-nav" },
      React.createElement(
        "div",
        { className: "p-nav-items" },
        NAV.map(
          (item) => React.createElement(
            "button",
            {
              key: item.id,
              className: `p-nav-btn${active === item.id ? " active" : ""}`,
              onClick: () => toggle(item.id),
              title: item.label
            },
            React.createElement("span", { className: "p-nav-icon material-symbols-outlined" }, item.icon)
          )
        )
      ),
      React.createElement(
        "div",
        { className: "p-nav-bottom" },
        React.createElement(
          "button",
          {
            className: "p-nav-btn",
            title: "Open as popup window",
            onClick: () => chrome.windows.create({ url: chrome.runtime.getURL("panel.html"), type: "popup", width: 400, height: 650 })
          },
          React.createElement("span", { className: "p-nav-icon material-symbols-outlined" }, "open_in_new")
        )
      )
    ),
    React.createElement(
      "div",
      { className: "p-content" },
      active === "bookmarks" && React.createElement(BookmarksContent),
      active === "calendar" && React.createElement(CalendarContent),
      active === "tasks" && React.createElement(TasksContent),
      active === "tabs" && React.createElement(TabsContent),
      active === "system" && React.createElement(SystemContent),
      active === "ai" && React.createElement(AIContent)
    )
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(PanelApp));

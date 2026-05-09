const STORAGE_KEYS = {
  bookmarks: "dash.bookmarks.v3",
  // bumped: fresh 5-bookmark seed
  folders: "dash.folders.v3",
  // bumped: single Favorites folder
  zones: "dash.zones.v1",
  prefs: "dash.prefs.v1",
  bgUploads: "dash.bgUploads.v1"
};
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
  }
}
function exportAllData() {
  const data = {};
  for (const key of Object.values(STORAGE_KEYS)) data[key] = loadJSON(key);
  data["dash.tweaks"] = loadJSON("dash.tweaks");
  data["dash.view"] = loadJSON("dash.view");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `1stTab-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
async function importAllData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const syncKeys = [STORAGE_KEYS.prefs, STORAGE_KEYS.zones, "dash.tweaks", "dash.view"];
    for (const [k, v] of Object.entries(data)) {
      saveJSON(k, v);
      if (typeof chrome !== "undefined" && chrome.storage) {
        const area = syncKeys.includes(k) ? chrome.storage.sync : chrome.storage.local;
        await new Promise((r) => area.set({ [k]: v }, r));
      }
    }
    window.location.reload();
  } catch (e) {
    alert("Invalid backup file.");
  }
}
async function importChromeBookmarks() {
  if (typeof chrome === "undefined" || !chrome.bookmarks) {
    alert("Bookmarks API not available.");
    return;
  }
  chrome.bookmarks.getTree((tree) => {
    const existingFolders = loadJSON(STORAGE_KEYS.folders, window.SEED_FOLDERS || []);
    const existingBookmarks = loadJSON(STORAGE_KEYS.bookmarks, window.SEED_BOOKMARKS || []);
    const importFolderId = "f-" + Date.now();
    existingFolders.push({ id: importFolderId, name: "Chrome Import", parentId: null });
    let newBookmarks = [];
    function traverse(nodes, parentFolderId) {
      for (const node of nodes) {
        if (node.children) {
          const folderName = node.title || "Folder";
          let nextParentId = parentFolderId;
          if (node.title) {
            nextParentId = "f-" + Math.random().toString(36).slice(2, 9);
            existingFolders.push({
              id: nextParentId,
              name: folderName,
              parentId: parentFolderId
            });
          }
          traverse(node.children, nextParentId);
        } else if (node.url) {
          newBookmarks.push({
            id: "b-" + Math.random().toString(36).slice(2, 9),
            folderId: parentFolderId,
            name: node.title || (node.url.split("/")[2] || "Bookmark"),
            url: node.url,
            description: "",
            tags: [],
            pinned: false,
            visits: 0,
            lastVisited: Date.now()
          });
        }
      }
    }
    traverse(tree, importFolderId);
    saveJSON(STORAGE_KEYS.folders, existingFolders);
    saveJSON(STORAGE_KEYS.bookmarks, [...existingBookmarks, ...newBookmarks]);
    if (chrome.storage) {
      chrome.storage.local.set({
        [STORAGE_KEYS.folders]: existingFolders,
        [STORAGE_KEYS.bookmarks]: [...existingBookmarks, ...newBookmarks]
      });
    }
    alert(`Imported ${newBookmarks.length} bookmarks into "Chrome Import" folder!`);
    window.location.reload();
  });
}
function useStorage(key, fallback, isSync = false) {
  const [val, setVal] = React.useState(() => {
    const local = loadJSON(key, void 0);
    if (local !== void 0) return local;
    return fallback;
  });
  React.useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      const area = isSync ? chrome.storage.sync : chrome.storage.local;
      area.get(key, (res) => {
        if (res[key] !== void 0) {
          setVal(res[key]);
          saveJSON(key, res[key]);
        }
      });
      const listener = (changes, changedArea) => {
        if (changedArea === (isSync ? "sync" : "local") && changes[key]) {
          const newVal = changes[key].newValue !== void 0 ? changes[key].newValue : fallback;
          setVal(newVal);
          saveJSON(key, newVal);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, [key, isSync]);
  const setValue = React.useCallback((newVal) => {
    setVal((prev) => {
      const valueToStore = typeof newVal === "function" ? newVal(prev) : newVal;
      saveJSON(key, valueToStore);
      if (typeof chrome !== "undefined" && chrome.storage) {
        const area = isSync ? chrome.storage.sync : chrome.storage.local;
        area.set({ [key]: valueToStore });
      }
      return valueToStore;
    });
  }, [key, isSync]);
  return [val, setValue];
}
const TILE_COLORS = [
  "#1a73e8",
  "#188038",
  "#b06000",
  "#9334e6",
  "#d93025",
  "#1967d2",
  "#137333",
  "#a142f4",
  "#c5221f",
  "#f9ab00",
  "#0b8043",
  "#5f6368",
  "#185abc",
  "#b80672"
];
function colorForString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}
function initialFromUrl(url, name) {
  if (name) return name.trim()[0]?.toUpperCase() || "?";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "")[0].toUpperCase();
  } catch {
    return "?";
  }
}
function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
const SEED_FOLDERS = [
  { id: "f-favorites", name: "Favorites" }
];
function uid() {
  return "b-" + Math.random().toString(36).slice(2, 9);
}
const SEED_BOOKMARKS = [
  // ===== Favorites (5 curated) =====
  {
    id: uid(),
    folderId: "f-favorites",
    name: "Claude AI",
    url: "https://claude.ai",
    description: "AI assistant by Anthropic.",
    tags: ["ai"],
    pinned: true,
    visits: 0,
    lastVisited: Date.now()
  },
  {
    id: uid(),
    folderId: "f-favorites",
    name: "Google Gemini",
    url: "https://gemini.google.com",
    description: "Google AI assistant.",
    tags: ["ai"],
    pinned: true,
    visits: 0,
    lastVisited: Date.now()
  },
  {
    id: uid(),
    folderId: "f-favorites",
    name: "Google",
    url: "https://google.com",
    description: "Search the web.",
    tags: ["search"],
    pinned: true,
    visits: 0,
    lastVisited: Date.now()
  },
  {
    id: uid(),
    folderId: "f-favorites",
    name: "YouTube",
    url: "https://youtube.com",
    description: "Watch and discover videos.",
    tags: ["video"],
    pinned: true,
    visits: 0,
    lastVisited: Date.now()
  },
  {
    id: uid(),
    folderId: "f-favorites",
    name: "GitHub",
    url: "https://github.com",
    description: "Code hosting and collaboration.",
    tags: ["dev"],
    pinned: true,
    visits: 0,
    lastVisited: Date.now()
  }
];
function faviconUrl(url, size = 64) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=${size}`;
  } catch {
    return null;
  }
}
function relativeTime(ms) {
  if (!ms) return "never";
  const diff = Date.now() - ms;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return Math.round(diff / 6e4) + "m ago";
  if (diff < 864e5) return Math.round(diff / 36e5) + "h ago";
  if (diff < 30 * 864e5) return Math.round(diff / 864e5) + "d ago";
  return Math.round(diff / (30 * 864e5)) + "mo ago";
}
function defaultZones() {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
  return [
    { id: "z-local", label: "Local", tz: local, primary: true },
    { id: "z-ny", label: "New York", tz: "America/New_York" },
    { id: "z-tk", label: "Tokyo", tz: "Asia/Tokyo" }
  ];
}
const BUILTIN_BACKGROUNDS = [
  {
    id: "bg-dark",
    label: "Dark",
    value: "linear-gradient(160deg, #07061a 0%, #110c30 100%)"
  },
  {
    id: "bg-cosmos",
    label: "Cosmos",
    // Multi-layer radial gradients — vivid purple/teal/rose nebula on deep black
    value: [
      "radial-gradient(ellipse at 18% 28%, rgba(120,0,200,0.7) 0%, transparent 45%)",
      "radial-gradient(ellipse at 82% 72%, rgba(0,120,220,0.6) 0%, transparent 45%)",
      "radial-gradient(ellipse at 55% 15%, rgba(220,0,100,0.45) 0%, transparent 38%)",
      "radial-gradient(ellipse at 30% 80%, rgba(0,180,160,0.35) 0%, transparent 38%)",
      "#04000f"
    ].join(", ")
  },
  {
    id: "bg-sunset",
    label: "Sunset",
    // Dark-blue sky → purple → crimson → orange → golden horizon
    value: "linear-gradient(170deg, #0c0a2e 0%, #481060 22%, #a82848 45%, #e05020 68%, #f0a020 88%, #ffe060 100%)"
  },
  {
    id: "bg-ocean",
    label: "Ocean",
    // Surface light to deep abyss
    value: "linear-gradient(180deg, #0a3a6e 0%, #0a5090 28%, #0a6aaa 55%, #062050 80%, #020c20 100%)"
  },
  {
    id: "bg-forest",
    label: "Forest",
    // Canopy to forest floor — vivid greens
    value: "linear-gradient(170deg, #0a2a05 0%, #1a5010 25%, #2a7015 50%, #154010 75%, #061805 100%)"
  },
  {
    id: "bg-light",
    label: "Light",
    // Soft blue-to-lavender-to-peach gradient
    value: "linear-gradient(135deg, #ddeeff 0%, #f8f4ff 45%, #ffeedd 100%)"
  }
];
const DEFAULT_PREFS = {
  name: "Friend",
  units: "F",
  theme: "auto",
  weatherCity: "San Francisco",
  bgId: "bg-light"
  // default: light gradient matches the default Material Light theme
};
function buildMockWeather(city, units) {
  const now = /* @__PURE__ */ new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const seed = (doy * 9301 + 49297) % 233280;
  const r = (n) => (seed + n * 1117) % 233280 / 233280;
  const tempF = Math.round(58 + r(1) * 24);
  const tempC = Math.round((tempF - 32) * 5 / 9);
  const conds = [
    { key: "sunny", desc: "Sunny", icon: "wSun" },
    { key: "partly", desc: "Partly cloudy", icon: "wPartly" },
    { key: "cloudy", desc: "Cloudy", icon: "wCloud" },
    { key: "rain", desc: "Light rain", icon: "wRain" }
  ];
  const cond = conds[Math.floor(r(2) * conds.length)];
  const hiF = tempF + Math.floor(r(3) * 6) + 2;
  const loF = tempF - Math.floor(r(4) * 8) - 2;
  const hiC = Math.round((hiF - 32) * 5 / 9);
  const loC = Math.round((loF - 32) * 5 / 9);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const forecast = Array.from({ length: 5 }, (_, i) => {
    const d = (today + i + 1) % 7;
    const t = Math.round(56 + r(10 + i) * 26);
    const c = conds[Math.floor(r(20 + i) * conds.length)];
    return { day: days[d], tempF: t, tempC: Math.round((t - 32) * 5 / 9), icon: c.icon };
  });
  return {
    city,
    temp: units === "F" ? tempF : tempC,
    desc: cond.desc,
    icon: cond.icon,
    hi: units === "F" ? hiF : hiC,
    lo: units === "F" ? loF : loC,
    humidity: 40 + Math.floor(r(5) * 40),
    wind: 4 + Math.floor(r(6) * 14),
    visibility: 8 + Math.floor(r(7) * 4),
    forecast: forecast.map((f) => ({ ...f, temp: units === "F" ? f.tempF : f.tempC }))
  };
}
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.importChromeBookmarks = importChromeBookmarks;
window.STORAGE_KEYS = STORAGE_KEYS;
window.loadJSON = loadJSON;
window.saveJSON = saveJSON;
window.useStorage = useStorage;
window.colorForString = colorForString;
window.initialFromUrl = initialFromUrl;
window.hostnameOf = hostnameOf;
window.SEED_FOLDERS = SEED_FOLDERS;
window.SEED_BOOKMARKS = SEED_BOOKMARKS;
window.uid = uid;
window.defaultZones = defaultZones;
window.DEFAULT_PREFS = DEFAULT_PREFS;
window.BUILTIN_BACKGROUNDS = BUILTIN_BACKGROUNDS;
window.buildMockWeather = buildMockWeather;
window.faviconUrl = faviconUrl;
window.relativeTime = relativeTime;

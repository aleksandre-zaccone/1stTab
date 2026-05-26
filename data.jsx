// ============================
// Storage helpers + seed data
// ============================

// Use chrome.storage.sync for small settings that should roam
// Use chrome.storage.local for large data or cache (notes, weather, favicon)
const STORAGE_KEYS = {
  theme: 'nt.theme',
  arcadeGame: 'nt.arcadeGame',
  unit: 'nt.unit',
  name: 'nt.name',
  searchEngine: 'nt.searchEngine',
  widgets: 'nt.widgets',
  todos: 'nt.todos',
  zones: 'nt.zones',
  tab: 'nt.tab',
  folder: 'nt.folder',
  view: 'nt.view',
  treeExpanded: 'nt.treeExpanded',
  bookmarkMeta: 'nt.bookmarkMeta', // { [bookmarkId]: { tag, desc, color, initial, pinned } }
  notes: 'nt.notes',
  weatherCache: 'nt.weatherCache',
  faviconCache: 'nt.faviconCache',
  customCSS: 'nt.customCSS',
  greetings: 'nt.greetings',
  fontFamily: 'nt.fontFamily',
  weatherCity: 'nt.weatherCity',
  clockFace: 'nt.clockFace',
  bgId: 'nt.bgId',
  pomodoroWork: 'dash.pomodoro.work',
  pomodoroBreak: 'dash.pomodoro.break',
  crypto: 'dash.crypto',
  fx: 'dash.fx',
  stocks: 'dash.stocks',
  tweaks: 'dash.tweaks',
  plus: '1stTab.plus',
  driveEmail: '1stTab.driveEmail',
  autoBackup: '1stTab.autoBackup',
  claudeKey: '1stTab.claudeKey',
  claudeModel: '1stTab.claudeModel',
  openaiKey: '1stTab.openaiKey',
  openaiModel: '1stTab.openaiModel',
  geminiKey: '1stTab.geminiKey',
  geminiModel: '1stTab.geminiModel',
  aiProvider: '1stTab.aiProvider',
  finnhubKey: '1stTab.finnhubKey',
  bgUploads: 'dash.bgUploads'
};

const SYNC_KEYS = [
  'nt.theme', 'nt.arcadeGame', 'nt.unit', 'nt.name', 'nt.searchEngine',
  'nt.widgets', 'nt.todos', 'nt.zones', 'nt.tab', 'nt.folder',
  'nt.view', 'nt.treeExpanded', 'nt.bookmarkMeta',
  'nt.greetings', 'nt.fontFamily', 'nt.weatherCity', 'nt.clockFace', 'nt.bgId',
  'dash.pomodoro.work', 'dash.pomodoro.break', 'dash.crypto', 'dash.fx', 'dash.stocks', 'dash.tweaks',
  '1stTab.plus'
];

const LOCAL_KEYS = [
  'nt.notes', 'nt.weatherCache', 'nt.faviconCache', 'nt.customCSS',
  '1stTab.driveEmail', '1stTab.autoBackup', '1stTab.claudeKey', '1stTab.claudeModel', '1stTab.openaiKey', '1stTab.openaiModel', '1stTab.geminiKey', '1stTab.geminiModel', '1stTab.aiProvider', '1stTab.finnhubKey',
  'dash.bgUploads'
];

/**
 * Get data from chrome.storage
 */
async function getStorage(key, fallback) {
  return new Promise((resolve) => {
    const area = SYNC_KEYS.includes(key) ? chrome.storage.sync : chrome.storage.local;
    area.get(key, (result) => {
      if (result[key] === undefined) {
        // Fallback to localStorage for migration or default
        const lsValue = localStorage.getItem(key);
        if (lsValue !== null) {
          try {
            const parsed = JSON.parse(lsValue);
            resolve(parsed);
          } catch(e) {
            resolve(lsValue);
          }
        } else {
          resolve(fallback);
        }
      } else {
        resolve(result[key]);
      }
    });
  });
}

/**
 * Set data in chrome.storage
 */
async function setStorage(key, value) {
  return new Promise((resolve) => {
    const area = SYNC_KEYS.includes(key) ? chrome.storage.sync : chrome.storage.local;
    area.set({ [key]: value }, () => {
      // Also update localStorage as a hint for the no-FOUC script
      if (key === 'nt.theme' || key === 'nt.arcadeGame') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      resolve();
    });
  });
}

/**
 * Bookmarks API Wrappers
 */
function wrapBookmarkCall(fn) {
  return (...args) => new Promise((resolve, reject) => {
    try {
      fn(...args, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Bookmarks API error'));
        } else {
          resolve(result);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

const Bookmarks = {
  getTree:     wrapBookmarkCall(chrome.bookmarks.getTree.bind(chrome.bookmarks)),
  getSubTree:  wrapBookmarkCall(chrome.bookmarks.getSubTree.bind(chrome.bookmarks)),
  getChildren: wrapBookmarkCall(chrome.bookmarks.getChildren.bind(chrome.bookmarks)),
  search:      wrapBookmarkCall(chrome.bookmarks.search.bind(chrome.bookmarks)),
  create:      wrapBookmarkCall(chrome.bookmarks.create.bind(chrome.bookmarks)),
  update:      wrapBookmarkCall(chrome.bookmarks.update.bind(chrome.bookmarks)),
  move:        wrapBookmarkCall(chrome.bookmarks.move.bind(chrome.bookmarks)),
  remove:      wrapBookmarkCall(chrome.bookmarks.remove.bind(chrome.bookmarks)),
  removeTree:  wrapBookmarkCall(chrome.bookmarks.removeTree.bind(chrome.bookmarks)),
};

function exportAllData() {
  chrome.storage.sync.get(null, (syncData) => {
    chrome.storage.local.get(null, (localData) => {
      const allData = { ...syncData, ...localData };
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        chrome.bookmarks.getTree((bookmarkTree) => {
          allData['chrome.bookmarks.tree'] = bookmarkTree;
          const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `1stTab-backup-${new Date().toISOString().slice(0,10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        });
      } else {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `1stTab-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  });
}

async function importAllData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    if (data['chrome.bookmarks.tree'] && typeof chrome !== 'undefined' && chrome.bookmarks) {
      const roots = {};
      
      function traverseRoots(node) {
        if (node.id === '1' || node.id === '2' || node.id === '3') {
          roots[node.id] = node;
        }
        if (node.children) {
          for (const child of node.children) {
            traverseRoots(child);
          }
        }
      }
      
      const tree = data['chrome.bookmarks.tree'];
      if (Array.isArray(tree)) {
        tree.forEach(traverseRoots);
      } else if (tree) {
        traverseRoots(tree);
      }
      
      const idMap = {};
      
      async function clearFolder(folderId) {
        try {
          const children = await new Promise(r => chrome.bookmarks.getChildren(folderId, r));
          if (children) {
            for (const child of children) {
              await new Promise(r => chrome.bookmarks.removeTree(child.id, r));
            }
          }
        } catch (e) {
          console.warn(`Failed to clear folder ${folderId}:`, e);
        }
      }
      
      async function recreateNode(importedNode, newParentId) {
        if (importedNode.url) {
          const newNode = await new Promise(resolve => {
            chrome.bookmarks.create({
              parentId: newParentId,
              title: importedNode.title,
              url: importedNode.url
            }, resolve);
          });
          if (newNode) {
            idMap[importedNode.id] = newNode.id;
          }
        } else {
          let targetParentId = newParentId;
          if (importedNode.id !== '1' && importedNode.id !== '2' && importedNode.id !== '3') {
            const newNode = await new Promise(resolve => {
              chrome.bookmarks.create({
                parentId: newParentId,
                title: importedNode.title
              }, resolve);
            });
            if (newNode) {
              idMap[importedNode.id] = newNode.id;
              targetParentId = newNode.id;
            } else {
              return;
            }
          } else {
            idMap[importedNode.id] = importedNode.id;
            targetParentId = importedNode.id;
          }
          
          if (importedNode.children) {
            for (const child of importedNode.children) {
              await recreateNode(child, targetParentId);
            }
          }
        }
      }
      
      if (roots['1']) {
        await clearFolder('1');
        await recreateNode(roots['1'], '1');
      }
      if (roots['2']) {
        await clearFolder('2');
        await recreateNode(roots['2'], '2');
      }
      if (roots['3']) {
        await clearFolder('3');
        await recreateNode(roots['3'], '3');
      }
      
      const oldMeta = data['nt.bookmarkMeta'];
      if (oldMeta && typeof oldMeta === 'object') {
        const newMeta = {};
        for (const [oldId, meta] of Object.entries(oldMeta)) {
          const newId = idMap[oldId];
          if (newId) {
            newMeta[newId] = meta;
          } else if (oldId === '1' || oldId === '2' || oldId === '3') {
            newMeta[oldId] = meta;
          }
        }
        data['nt.bookmarkMeta'] = newMeta;
      }
    }
    
    const syncObj = {};
    const localObj = {};
    
    for (const [k, v] of Object.entries(data)) {
      if (SYNC_KEYS.includes(k)) syncObj[k] = v;
      else if (LOCAL_KEYS.includes(k)) localObj[k] = v;
      
      if (k === 'nt.theme' || k === 'nt.arcadeGame') localStorage.setItem(k, v);
      else localStorage.setItem(k, JSON.stringify(v));
    }
    
    await Promise.all([
      new Promise(r => chrome.storage.sync.set(syncObj, r)),
      new Promise(r => chrome.storage.local.set(localObj, r))
    ]);
    
    window.location.reload();
  } catch (e) {
    console.error("Error during restore:", e);
    alert("Invalid backup file or restore failed.");
  }
}

async function importChromeBookmarks() {
  if (typeof chrome === 'undefined' || !chrome.bookmarks) {
    alert("Bookmarks API not available.");
    return;
  }
  
  chrome.bookmarks.getTree((tree) => {
    const existingFolders = loadJSON(STORAGE_KEYS.folders, window.SEED_FOLDERS || []);
    const existingBookmarks = loadJSON(STORAGE_KEYS.bookmarks, window.SEED_BOOKMARKS || []);
    
    const importFolderId = 'f-' + Date.now();
    existingFolders.push({ id: importFolderId, name: 'Chrome Import', parentId: null });

    let newBookmarks = [];
    
    function traverse(nodes, parentFolderId) {
      for (const node of nodes) {
        // Skip the root nodes if they are empty, or create folders for them
        if (node.children) {
          // If it has a title, it's a folder (Chrome root folders also have titles like "Bookmarks Bar")
          const folderName = node.title || 'Folder';
          // Root node often has no title, we skip making a folder for the absolute root and just pass the importFolderId
          let nextParentId = parentFolderId;
          if (node.title) {
            nextParentId = 'f-' + Math.random().toString(36).slice(2, 9);
            existingFolders.push({
              id: nextParentId,
              name: folderName,
              parentId: parentFolderId
            });
          }
          traverse(node.children, nextParentId);
        } else if (node.url) {
          newBookmarks.push({
            id: 'b-' + Math.random().toString(36).slice(2, 9),
            folderId: parentFolderId,
            name: node.title || (node.url.split('/')[2] || 'Bookmark'),
            url: node.url,
            description: '',
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

// ============================
// i18n / Translation Helpers
// ============================
window.translations = {};
let i18nLoaded = false;
const i18nCallbacks = new Set();

async function initI18n() {
  try {
    const resp = await fetch(chrome.runtime.getURL('en.json'));
    const data = await resp.json();
    window.translations = data?.translation || data;
    i18nLoaded = true;
    i18nCallbacks.forEach(cb => cb());
  } catch (e) {
    console.warn('i18n load failed, falling back to keys');
  }
}
initI18n();

function t(key, params = {}) {
  const parts = key.split('.');
  let val = window.translations;
  for (const p of parts) {
    val = val?.[p];
    if (val === undefined) break;
  }
  if (val === undefined) return key; // Fallback to key
  
  // Simple interpolation: {{count}} -> params.count
  let str = String(val);
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`{{${k}}}`, 'g'), v);
  });
  return str;
}

function useI18n() {
  const [, setLoaded] = React.useState(i18nLoaded);
  React.useEffect(() => {
    if (i18nLoaded) return;
    const cb = () => setLoaded(true);
    i18nCallbacks.add(cb);
    return () => i18nCallbacks.delete(cb);
  }, []);
  return { t, loaded: i18nLoaded };
}

window.t = t;
window.useI18n = useI18n;

// React Hook for cross-device sync and local persistence
function useStorage(key, fallback, isSyncOverride) {
  const isSync = isSyncOverride !== undefined ? isSyncOverride : SYNC_KEYS.includes(key);
  const [val, setVal] = React.useState(() => {
    const local = loadJSON(key, undefined);
    if (local !== undefined) return local;
    return fallback;
  });

  React.useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const area = isSync ? chrome.storage.sync : chrome.storage.local;
      area.get(key, (res) => {
        if (res[key] !== undefined) {
          setVal(res[key]);
          saveJSON(key, res[key]);
        } else {
          // Explicitly seed storage with default fallback values on first load
          area.set({ [key]: fallback });
          saveJSON(key, fallback);
        }
      });

      const listener = (changes, changedArea) => {
        if (changedArea === (isSync ? 'sync' : 'local') && changes[key]) {
          const newVal = changes[key].newValue !== undefined ? changes[key].newValue : fallback;
          setVal(newVal);
          saveJSON(key, newVal);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, [key, isSync]);

  const setValue = React.useCallback((newVal) => {
    setVal(prev => {
      const valueToStore = typeof newVal === 'function' ? newVal(prev) : newVal;
      saveJSON(key, valueToStore);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const area = isSync ? chrome.storage.sync : chrome.storage.local;
        area.set({ [key]: valueToStore });
      }
      return valueToStore;
    });
  }, [key, isSync]);

  return [val, setValue];
}

// Stable color from string for favicon tile
const TILE_COLORS = [
  '#1a73e8', '#188038', '#b06000', '#9334e6', '#d93025',
  '#1967d2', '#137333', '#a142f4', '#c5221f', '#f9ab00',
  '#0b8043', '#5f6368', '#185abc', '#b80672'
];
function colorForString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}
function initialFromUrl(url, name) {
  if (name) return name.trim()[0]?.toUpperCase() || '?';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '')[0].toUpperCase();
  } catch { return '?'; }
}
function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./,''); }
  catch { return url; }
}

// Seed data — 5 curated bookmarks shown on first install
const SEED_FOLDERS = [
  { id: 'f-favorites', name: 'Favorites' },
];
function uid() { return 'b-' + Math.random().toString(36).slice(2, 9); }
const SEED_BOOKMARKS = [
  // ===== Favorites (5 curated) =====
  { id: uid(), folderId: 'f-favorites', name: 'Claude AI',    url: 'https://claude.ai',
    description: 'AI assistant by Anthropic.', tags: ['ai'], pinned: true, visits: 0, lastVisited: Date.now() },
  { id: uid(), folderId: 'f-favorites', name: 'Google Gemini', url: 'https://gemini.google.com',
    description: 'Google AI assistant.',        tags: ['ai'], pinned: true, visits: 0, lastVisited: Date.now() },
  { id: uid(), folderId: 'f-favorites', name: 'Google',        url: 'https://google.com',
    description: 'Search the web.',             tags: ['search'], pinned: true, visits: 0, lastVisited: Date.now() },
  { id: uid(), folderId: 'f-favorites', name: 'YouTube',       url: 'https://youtube.com',
    description: 'Watch and discover videos.',  tags: ['video'], pinned: true, visits: 0, lastVisited: Date.now() },
  { id: uid(), folderId: 'f-favorites', name: 'GitHub',        url: 'https://github.com',
    description: 'Code hosting and collaboration.', tags: ['dev'], pinned: true, visits: 0, lastVisited: Date.now() },
];

// Use Google's high-resolution faviconV2 API by default (safely scrapes Apple Touch Icons and scales beautifully).
// Fallback to S2 or native offline Chrome API when needed.
function faviconUrl(url, size = 128) {
  try {
    const u = new URL(url);
    // gstatic faviconV2 retrieves Apple Touch Icons and offers crisp, high-DPI sizing (up to 256px)
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(u.origin)}&size=${size}`;
  } catch { return null; }
}



function relativeTime(ms) {
  if (!ms) return 'never';
  const diff = Date.now() - ms;
  if (diff < 60e3) return 'just now';
  if (diff < 3600e3) return Math.round(diff/60e3) + 'm ago';
  if (diff < 86400e3) return Math.round(diff/3600e3) + 'h ago';
  if (diff < 30*86400e3) return Math.round(diff/86400e3) + 'd ago';
  return Math.round(diff/(30*86400e3)) + 'mo ago';
}

// Default time zones (local + 2)
function defaultZones() {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  return [
    { id: 'z-local', label: 'Local',  tz: local,             primary: true },
    { id: 'z-ny',    label: 'New York', tz: 'America/New_York' },
    { id: 'z-tk',    label: 'Tokyo',    tz: 'Asia/Tokyo' },
  ];
}

// Built-in background presets (value = CSS background property value)
const BUILTIN_BACKGROUNDS = [
  {
    id: 'bg-dark',
    label: 'Dark',
    value: 'linear-gradient(160deg, #07061a 0%, #110c30 100%)',
  },
  {
    id: 'bg-cosmos',
    label: 'Cosmos',
    // Multi-layer radial gradients — vivid purple/teal/rose nebula on deep black
    value: [
      'radial-gradient(ellipse at 18% 28%, rgba(120,0,200,0.7) 0%, transparent 45%)',
      'radial-gradient(ellipse at 82% 72%, rgba(0,120,220,0.6) 0%, transparent 45%)',
      'radial-gradient(ellipse at 55% 15%, rgba(220,0,100,0.45) 0%, transparent 38%)',
      'radial-gradient(ellipse at 30% 80%, rgba(0,180,160,0.35) 0%, transparent 38%)',
      '#04000f',
    ].join(', '),
  },
  {
    id: 'bg-sunset',
    label: 'Sunset',
    // Dark-blue sky → purple → crimson → orange → golden horizon
    value: 'linear-gradient(170deg, #0c0a2e 0%, #481060 22%, #a82848 45%, #e05020 68%, #f0a020 88%, #ffe060 100%)',
  },
  {
    id: 'bg-ocean',
    label: 'Ocean',
    // Surface light to deep abyss
    value: 'linear-gradient(180deg, #0a3a6e 0%, #0a5090 28%, #0a6aaa 55%, #062050 80%, #020c20 100%)',
  },
  {
    id: 'bg-forest',
    label: 'Forest',
    // Canopy to forest floor — vivid greens
    value: 'linear-gradient(170deg, #0a2a05 0%, #1a5010 25%, #2a7015 50%, #154010 75%, #061805 100%)',
  },
  {
    id: 'bg-light',
    label: 'Light',
    // Soft blue-to-lavender-to-peach gradient
    value: 'linear-gradient(135deg, #ddeeff 0%, #f8f4ff 45%, #ffeedd 100%)',
  },
  {
    id: 'bg-daily',
    label: 'Daily',
    // Value will be dynamically replaced or handled in app.jsx
    value: 'url("https://picsum.photos/1920/1080?grayscale&blur=2")', // fallback
  },
];

const DEFAULT_PREFS = {
  name: 'Friend',
  units: 'F',
  theme: 'auto',
  weatherCity: 'San Francisco',
  bgId: 'bg-light', // default: light gradient matches the default Material Light theme
};

// Mock weather (deterministic-ish based on day-of-year)
function buildMockWeather(city, units) {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
  const seed = (doy * 9301 + 49297) % 233280;
  const r = (n) => ((seed + n*1117) % 233280) / 233280;

  const tempF = Math.round(58 + r(1) * 24); // 58-82F
  const tempC = Math.round((tempF - 32) * 5/9);
  const conds = [
    { key: 'sunny',  desc: 'Sunny',          icon: 'wSun' },
    { key: 'partly', desc: 'Partly cloudy',  icon: 'wPartly' },
    { key: 'cloudy', desc: 'Cloudy',         icon: 'wCloud' },
    { key: 'rain',   desc: 'Light rain',     icon: 'wRain' },
  ];
  const cond = conds[Math.floor(r(2) * conds.length)];

  const hiF = tempF + Math.floor(r(3) * 6) + 2;
  const loF = tempF - Math.floor(r(4) * 8) - 2;
  const hiC = Math.round((hiF - 32) * 5/9);
  const loC = Math.round((loF - 32) * 5/9);

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const forecast = Array.from({length: 5}, (_, i) => {
    const d = (today + i + 1) % 7;
    const t = Math.round(56 + ((r(10+i) * 26)));
    const c = conds[Math.floor(r(20+i) * conds.length)];
    return { day: days[d], tempF: t, tempC: Math.round((t-32)*5/9), icon: c.icon };
  });

  return {
    city,
    temp: units === 'F' ? tempF : tempC,
    desc: cond.desc,
    icon: cond.icon,
    hi: units === 'F' ? hiF : hiC,
    lo: units === 'F' ? loF : loC,
    humidity: 40 + Math.floor(r(5) * 40),
    wind: 4 + Math.floor(r(6) * 14),
    visibility: 8 + Math.floor(r(7) * 4),
    forecast: forecast.map(f => ({ ...f, temp: units === 'F' ? f.tempF : f.tempC })),
  };
}

// ─── Plus Tier Helpers ────────────────────────────────────────────────────────

function isPlusUser() {
  return loadJSON('1stTab.plus', { active: false }).active === true;
}

function requirePlus(featureName, callback) {
  if (isPlusUser()) { callback(); return; }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'open-settings', hash: 'plus' }).catch(() => {});
  }
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined') return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

const BOOKMARK_ICONS = {
  none: null,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  github: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
  code: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  google: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.24 0 9.59-3.79 10-8.82H12v-3.18h13.2a12.86 12.86 0 0 0-.2-1A10 10 0 0 0 12 2z"/></svg>,
  youtube: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  game: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="3"/></svg>,
  music: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  video: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  cart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  terminal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  hash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
};

function BookmarkIcon({ url, title, meta }) {
  // srcStage can be: 0 (high-res google api), 1 (native offline extension api), 2 (text fallback)
  const [srcStage, setSrcStage] = React.useState(0);
  const selectedIconSvg = meta?.icon && meta.icon !== 'none' ? BOOKMARK_ICONS[meta.icon] : null;

  if (selectedIconSvg) {
    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'currentColor'
        }}
      >
        {selectedIconSvg}
      </div>
    );
  }

  // 1. Google High-Res FaviconV2 CDN (provides up to 256px crisp icons, Apple Touch Icons)
  if (srcStage === 0) {
    try {
      const u = new URL(url);
      const highResUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(u.origin)}&size=128`;
      return (
        <img 
          src={highResUrl} 
          onError={() => setSrcStage(1)} 
          alt=""
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }}
        />
      );
    } catch {
      // If URL parsing fails, immediately go to text fallback
      const firstLetter = title ? title.trim()[0]?.toUpperCase() : '?';
      return <span>{firstLetter}</span>;
    }
  }

  // 2. Native Chrome Extension Favicon API (offline-capable backup, but often 16x16 cached and pixelated)
  if (srcStage === 1) {
    try {
      const u = new URL(url);
      let nativeUrl = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`;
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        nativeUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(u.href)}&size=128`;
      }
      return (
        <img 
          src={nativeUrl} 
          onError={() => setSrcStage(2)} 
          alt=""
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }}
        />
      );
    } catch {
      const firstLetter = title ? title.trim()[0]?.toUpperCase() : '?';
      return <span>{firstLetter}</span>;
    }
  }

  // 3. Text Fallback (First letter of the bookmark name)
  const firstLetter = title ? title.trim()[0]?.toUpperCase() : '?';
  return <span>{firstLetter}</span>;
}

window.Bookmarks = Bookmarks;
window.loadJSON = loadJSON;
window.saveJSON = saveJSON;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.importChromeBookmarks = importChromeBookmarks;
window.STORAGE_KEYS = STORAGE_KEYS;
window.useStorage = useStorage;
window.isPlusUser = isPlusUser;
window.requirePlus = requirePlus;
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
window.BOOKMARK_ICONS = BOOKMARK_ICONS;
window.BookmarkIcon = BookmarkIcon;

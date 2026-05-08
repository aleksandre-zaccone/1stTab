// ============================
// Storage helpers + seed data
// ============================
const STORAGE_KEYS = {
  bookmarks: 'dash.bookmarks.v3',  // bumped: fresh 5-bookmark seed
  folders:   'dash.folders.v3',    // bumped: single Favorites folder
  zones:     'dash.zones.v1',
  prefs:     'dash.prefs.v1',
  bgUploads: 'dash.bgUploads.v1',
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
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
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

// Try to use real favicons via Google's public S2 favicon service (works without an extension).
function faviconUrl(url, size = 64) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=${size}`;
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

window.STORAGE_KEYS = STORAGE_KEYS;
window.loadJSON = loadJSON;
window.saveJSON = saveJSON;
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

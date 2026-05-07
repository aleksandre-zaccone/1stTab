// ============================
// Storage helpers + seed data
// ============================
const STORAGE_KEYS = {
  bookmarks: 'dash.bookmarks.v2',
  folders:   'dash.folders.v2',
  zones:     'dash.zones.v1',
  prefs:     'dash.prefs.v1',
  bgUploads: 'dash.bgUploads.v1',  // separate key — keeps large image data away from prefs
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

// Seed bookmarks (a sensible default a fresh user would expect)
const SEED_FOLDERS = [
  { id: 'f-work',     name: 'Work' },
  { id: 'f-reading',  name: 'Reading' },
  { id: 'f-tools',    name: 'Tools' },
  { id: 'f-personal', name: 'Personal' },
];
function uid() { return 'b-' + Math.random().toString(36).slice(2, 9); }
// Bookmarks now carry richer metadata: description, tags, lastVisited, visits, pinned.
const NOW_MS = Date.now();
const DAY = 86400000;
const SEED_BOOKMARKS = [
  // ===== Work (10) =====
  { id: uid(), folderId: 'f-work', name: 'Project tracker', url: 'https://example.com/tracker',
    description: 'Sprint board and active tickets for the design platform team.',
    tags: ['daily','team'], pinned: true, visits: 142, lastVisited: NOW_MS - 2*3600e3 },
  { id: uid(), folderId: 'f-work', name: 'Team handbook', url: 'https://example.com/handbook',
    description: 'Onboarding, processes, RFC index, and meeting cadence.',
    tags: ['docs'], visits: 38, lastVisited: NOW_MS - 4*DAY },
  { id: uid(), folderId: 'f-work', name: 'Design specs', url: 'https://figma.com/file/specs',
    description: 'Component library and spec sheets for the current quarter.',
    tags: ['design','specs'], visits: 86, lastVisited: NOW_MS - 1*DAY },
  { id: uid(), folderId: 'f-work', name: 'Standup notes', url: 'https://example.com/standup',
    description: 'Rolling weekly standup notes and blockers log.',
    tags: ['notes'], visits: 24, lastVisited: NOW_MS - 6*3600e3 },
  { id: uid(), folderId: 'f-work', name: 'Roadmap Q3', url: 'https://example.com/roadmap',
    description: 'Quarterly objectives, milestones, and dependency map.',
    tags: ['planning'], visits: 54, lastVisited: NOW_MS - 3*DAY },
  { id: uid(), folderId: 'f-work', name: 'Slack', url: 'https://slack.com',
    description: 'Team chat, channels, and DM threads.',
    tags: ['daily','chat'], pinned: true, visits: 1240, lastVisited: NOW_MS - 5*60e3 },
  { id: uid(), folderId: 'f-work', name: 'Google Docs', url: 'https://docs.google.com',
    description: 'Shared docs, briefs, and meeting agendas.',
    tags: ['docs'], visits: 210, lastVisited: NOW_MS - 90*60e3 },
  { id: uid(), folderId: 'f-work', name: 'Zoom', url: 'https://zoom.us',
    description: 'Meeting room launcher and recordings library.',
    tags: ['meetings'], visits: 88, lastVisited: NOW_MS - 7*3600e3 },
  { id: uid(), folderId: 'f-work', name: 'Confluence', url: 'https://example.atlassian.net/wiki',
    description: 'Internal wiki, runbooks, and architecture docs.',
    tags: ['docs','wiki'], visits: 47, lastVisited: NOW_MS - 2*DAY },
  { id: uid(), folderId: 'f-work', name: 'Analytics', url: 'https://analytics.google.com',
    description: 'Product metrics dashboards and funnel reports.',
    tags: ['data'], visits: 62, lastVisited: NOW_MS - 18*3600e3 },

  // ===== Reading (10) =====
  { id: uid(), folderId: 'f-reading', name: 'Hacker News', url: 'https://news.ycombinator.com',
    description: 'Tech news and discussion — front page check.',
    tags: ['news','daily'], pinned: true, visits: 412, lastVisited: NOW_MS - 30*60e3 },
  { id: uid(), folderId: 'f-reading', name: 'The Verge', url: 'https://theverge.com',
    description: 'Tech, science, art, and culture reporting.',
    tags: ['news'], visits: 67, lastVisited: NOW_MS - 2*DAY },
  { id: uid(), folderId: 'f-reading', name: 'A List Apart', url: 'https://alistapart.com',
    description: 'Long-form articles on web design and standards.',
    tags: ['design','longread'], visits: 12, lastVisited: NOW_MS - 12*DAY },
  { id: uid(), folderId: 'f-reading', name: 'Ars Technica', url: 'https://arstechnica.com',
    description: 'Deep dives on tech, science, and policy.',
    tags: ['news','tech'], visits: 44, lastVisited: NOW_MS - 1*DAY },
  { id: uid(), folderId: 'f-reading', name: 'Wired', url: 'https://wired.com',
    description: 'Culture, business, and tech features.',
    tags: ['news','culture'], visits: 22, lastVisited: NOW_MS - 5*DAY },
  { id: uid(), folderId: 'f-reading', name: 'The New York Times', url: 'https://nytimes.com',
    description: 'World news, opinion, and analysis.',
    tags: ['news','daily'], visits: 198, lastVisited: NOW_MS - 6*3600e3 },
  { id: uid(), folderId: 'f-reading', name: 'Substack', url: 'https://substack.com',
    description: 'Newsletter inbox and subscriptions.',
    tags: ['longread','newsletters'], visits: 71, lastVisited: NOW_MS - 14*3600e3 },
  { id: uid(), folderId: 'f-reading', name: 'Pocket', url: 'https://getpocket.com',
    description: 'Read-later queue across devices.',
    tags: ['queue'], visits: 33, lastVisited: NOW_MS - 3*DAY },
  { id: uid(), folderId: 'f-reading', name: 'Medium', url: 'https://medium.com',
    description: 'Essays, tutorials, and personal blogs.',
    tags: ['longread'], visits: 19, lastVisited: NOW_MS - 8*DAY },
  { id: uid(), folderId: 'f-reading', name: 'Smashing Magazine', url: 'https://smashingmagazine.com',
    description: 'Practical articles on UX, CSS, and frontend.',
    tags: ['design','dev'], visits: 28, lastVisited: NOW_MS - 6*DAY },

  // ===== Tools (10) =====
  { id: uid(), folderId: 'f-tools', name: 'GitHub', url: 'https://github.com',
    description: 'Source control, PRs, and CI status across repositories.',
    tags: ['dev','daily'], pinned: true, visits: 980, lastVisited: NOW_MS - 10*60e3 },
  { id: uid(), folderId: 'f-tools', name: 'Figma', url: 'https://figma.com',
    description: 'Design files, prototypes, and live multiplayer.',
    tags: ['design'], visits: 320, lastVisited: NOW_MS - 1*3600e3 },
  { id: uid(), folderId: 'f-tools', name: 'Notion', url: 'https://notion.so',
    description: 'Knowledge base, planning docs, and personal notes.',
    tags: ['docs','notes'], visits: 188, lastVisited: NOW_MS - 5*3600e3 },
  { id: uid(), folderId: 'f-tools', name: 'Linear', url: 'https://linear.app',
    description: 'Issue tracker for engineering and design tasks.',
    tags: ['dev'], visits: 154, lastVisited: NOW_MS - 8*3600e3 },
  { id: uid(), folderId: 'f-tools', name: 'Vercel', url: 'https://vercel.com',
    description: 'Deployments, previews, and edge config.',
    tags: ['dev','deploy'], visits: 92, lastVisited: NOW_MS - 4*3600e3 },
  { id: uid(), folderId: 'f-tools', name: 'CodeSandbox', url: 'https://codesandbox.io',
    description: 'In-browser sandboxes for prototyping.',
    tags: ['dev','prototype'], visits: 41, lastVisited: NOW_MS - 2*DAY },
  { id: uid(), folderId: 'f-tools', name: 'Stack Overflow', url: 'https://stackoverflow.com',
    description: 'Q&A for programming problems.',
    tags: ['dev','reference'], visits: 215, lastVisited: NOW_MS - 22*3600e3 },
  { id: uid(), folderId: 'f-tools', name: 'MDN Web Docs', url: 'https://developer.mozilla.org',
    description: 'Web platform reference for HTML, CSS, JS.',
    tags: ['dev','docs'], visits: 178, lastVisited: NOW_MS - 12*3600e3 },
  { id: uid(), folderId: 'f-tools', name: 'Postman', url: 'https://postman.com',
    description: 'API client, collections, and environments.',
    tags: ['dev','api'], visits: 64, lastVisited: NOW_MS - 1*DAY },
  { id: uid(), folderId: 'f-tools', name: 'Excalidraw', url: 'https://excalidraw.com',
    description: 'Quick whiteboard sketches and diagrams.',
    tags: ['design','sketch'], visits: 53, lastVisited: NOW_MS - 16*3600e3 },

  // ===== Personal (10) =====
  { id: uid(), folderId: 'f-personal', name: 'Calendar', url: 'https://calendar.google.com',
    description: 'Personal and shared schedules.',
    tags: ['life'], pinned: true, visits: 220, lastVisited: NOW_MS - 45*60e3 },
  { id: uid(), folderId: 'f-personal', name: 'Recipes', url: 'https://example.com/recipes',
    description: 'Saved recipes — weeknight meals and weekend baking.',
    tags: ['life','food'], visits: 18, lastVisited: NOW_MS - 9*DAY },
  { id: uid(), folderId: 'f-personal', name: 'Gmail', url: 'https://mail.google.com',
    description: 'Personal inbox and labels.',
    tags: ['life','mail'], visits: 540, lastVisited: NOW_MS - 20*60e3 },
  { id: uid(), folderId: 'f-personal', name: 'YouTube', url: 'https://youtube.com',
    description: 'Subscriptions, watch later, and music.',
    tags: ['life','video'], visits: 380, lastVisited: NOW_MS - 3*3600e3 },
  { id: uid(), folderId: 'f-personal', name: 'Spotify', url: 'https://open.spotify.com',
    description: 'Playlists, podcasts, and discovery.',
    tags: ['life','music'], visits: 290, lastVisited: NOW_MS - 90*60e3 },
  { id: uid(), folderId: 'f-personal', name: 'Reddit', url: 'https://reddit.com',
    description: 'Subreddits and saved threads.',
    tags: ['life','social'], visits: 410, lastVisited: NOW_MS - 70*60e3 },
  { id: uid(), folderId: 'f-personal', name: 'Goodreads', url: 'https://goodreads.com',
    description: 'Reading list, ratings, and recommendations.',
    tags: ['life','books'], visits: 24, lastVisited: NOW_MS - 11*DAY },
  { id: uid(), folderId: 'f-personal', name: 'Letterboxd', url: 'https://letterboxd.com',
    description: 'Movie diary and watchlist.',
    tags: ['life','film'], visits: 36, lastVisited: NOW_MS - 4*DAY },
  { id: uid(), folderId: 'f-personal', name: 'Maps', url: 'https://maps.google.com',
    description: 'Saved places, directions, and trip planning.',
    tags: ['life','travel'], visits: 102, lastVisited: NOW_MS - 22*3600e3 },
  { id: uid(), folderId: 'f-personal', name: 'Strava', url: 'https://strava.com',
    description: 'Runs, rides, and weekly training log.',
    tags: ['life','fitness'], visits: 58, lastVisited: NOW_MS - 30*3600e3 },
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
  bgId: 'bg-dark',  // selected background: builtin ID or upload ID
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

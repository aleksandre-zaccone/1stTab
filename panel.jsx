/* global React, ReactDOM, chrome,
   useStorage, STORAGE_KEYS, SEED_FOLDERS, SEED_BOOKMARKS,
   faviconUrl, colorForString, initialFromUrl, defaultZones */

const { useState, useEffect, useRef, useMemo } = React;

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtBytes(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(0) + ' MB';
  return (b / 1e3).toFixed(0) + ' KB';
}

function formatTime(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(date);
  return {
    hour:      parts.find(p => p.type === 'hour')?.value      || '',
    minute:    parts.find(p => p.type === 'minute')?.value    || '',
    dayPeriod: parts.find(p => p.type === 'dayPeriod')?.value || '',
  };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
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
      chrome.system.cpu.getInfo(info => {
        const cores = info.processors;
        if (!prev.current) { prev.current = cores.map(c => ({ ...c.usage })); return; }
        let busy = 0, total = 0;
        cores.forEach((core, i) => {
          const p = prev.current[i], c = core.usage;
          const du = c.user - p.user, dk = c.kernel - p.kernel, di = c.idle - p.idle;
          busy += du + dk; total += du + dk + di;
        });
        prev.current = cores.map(c => ({ ...c.usage }));
        if (total > 0) setPct(Math.min(100, Math.round((busy / total) * 100)));
      });
    };
    tick();
    const id = setInterval(tick, 2000);
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
    const id = setInterval(tick, 2000);
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

// ─── Bookmark favicon ────────────────────────────────────────────────────────

function BmFavicon({ url, name }) {
  const src = faviconUrl(url, 32);
  const bg  = colorForString(url);
  const initial = initialFromUrl(url, name);
  const [ok, setOk] = useState(!!src);
  useEffect(() => { setOk(!!src); }, [src]);
  if (ok && src) {
    return React.createElement('img', {
      className: 'p-bm-fav', src, alt: '', onError: () => setOk(false),
    });
  }
  return React.createElement('span', {
    className: 'p-bm-fav p-bm-fav--tile',
    style: { background: bg },
  }, initial);
}

// ─── Bookmarks section ───────────────────────────────────────────────────────

function BmFolder({ folder, bookmarks }) {
  const [open, setOpen] = useState(false);
  if (!bookmarks.length) return null;
  return React.createElement('div', { className: 'p-folder' },
    React.createElement('div', {
      className: 'p-folder-hd',
      onClick: () => setOpen(o => !o),
    },
      React.createElement('span', { className: `p-chevron${open ? ' open' : ''}` }, '›'),
      React.createElement('span', { className: 'p-folder-icon' }, '📁'),
      React.createElement('span', { className: 'p-folder-name' }, folder.name),
      React.createElement('span', { className: 'p-folder-count' }, bookmarks.length),
    ),
    open && React.createElement('div', { className: 'p-bm-list' },
      bookmarks.map(bm =>
        React.createElement('a', {
          key: bm.id, href: bm.url, className: 'p-bm',
          title: bm.url, target: '_blank', rel: 'noreferrer',
        },
          React.createElement(BmFavicon, { url: bm.url, name: bm.name }),
          React.createElement('span', { className: 'p-bm-name' }, bm.name || bm.url),
        )
      )
    )
  );
}

function BookmarksPanel() {
  const [folders]   = useStorage(STORAGE_KEYS.folders,   SEED_FOLDERS);
  const [bookmarks] = useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = q
    ? bookmarks.filter(bm =>
        bm.name?.toLowerCase().includes(q) ||
        bm.url?.toLowerCase().includes(q)
      )
    : bookmarks;

  const byFolder = {};
  filtered.forEach(bm => {
    if (!byFolder[bm.folderId]) byFolder[bm.folderId] = [];
    byFolder[bm.folderId].push(bm);
  });

  return React.createElement('div', { className: 'p-panel' },
    React.createElement('div', { className: 'p-panel-hd' },
      React.createElement('span', { className: 'p-panel-title' }, 'Bookmarks'),
      React.createElement('span', { className: 'p-panel-count' }, bookmarks.length),
    ),
    React.createElement('div', { className: 'p-search-wrap' },
      React.createElement('input', {
        type: 'search',
        className: 'p-search',
        placeholder: 'Search bookmarks…',
        value: query,
        onChange: e => setQuery(e.target.value),
      })
    ),
    React.createElement('div', { className: 'p-scroll' },
      folders.filter(f => byFolder[f.id]?.length).map(f =>
        React.createElement(BmFolder, { key: f.id, folder: f, bookmarks: byFolder[f.id] })
      ),
      filtered.length === 0 && React.createElement('p', { className: 'p-empty' },
        q ? 'No matches.' : 'No bookmarks yet.'
      )
    )
  );
}

// ─── Tabs section ────────────────────────────────────────────────────────────

function TabItem({ tab }) {
  function switchTo() {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
  }
  function close(e) { e.stopPropagation(); chrome.tabs.remove(tab.id); }
  function toggleMute(e) { e.stopPropagation(); chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted }); }
  function togglePin(e)  { e.stopPropagation(); chrome.tabs.update(tab.id, { pinned: !tab.pinned }); }

  return React.createElement('div', {
    className: `p-tab${tab.active ? ' p-tab--active' : ''}`,
    onClick: switchTo,
    title: tab.url,
  },
    tab.favIconUrl
      ? React.createElement('img', { className: 'p-tab-fav', src: tab.favIconUrl, alt: '',
          onError: e => { e.target.style.display = 'none'; } })
      : React.createElement('span', { className: 'p-tab-fav p-tab-fav--empty' }),
    React.createElement('span', { className: 'p-tab-title' }, tab.title || tab.url),
    React.createElement('div', { className: 'p-tab-actions' },
      React.createElement('button', { className: `p-tab-btn${tab.pinned ? ' on' : ''}`, onClick: togglePin, title: 'Pin' }, '📌'),
      React.createElement('button', { className: `p-tab-btn${tab.mutedInfo?.muted ? ' on' : ''}`, onClick: toggleMute, title: 'Mute' }, '🔇'),
      React.createElement('button', { className: 'p-tab-btn p-tab-close', onClick: close, title: 'Close' }, '×'),
    )
  );
}

function TabsPanel() {
  const allTabs = useTabs();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = q
    ? allTabs.filter(t => t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q))
    : allTabs;

  const byWindow = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      if (!map[t.windowId]) map[t.windowId] = [];
      map[t.windowId].push(t);
    });
    return map;
  }, [filtered]);

  const windowIds = Object.keys(byWindow);

  return React.createElement('div', { className: 'p-panel' },
    React.createElement('div', { className: 'p-panel-hd' },
      React.createElement('span', { className: 'p-panel-title' }, 'Open Tabs'),
      React.createElement('span', { className: 'p-panel-count' }, allTabs.length),
    ),
    React.createElement('div', { className: 'p-search-wrap' },
      React.createElement('input', {
        type: 'search', className: 'p-search',
        placeholder: 'Search tabs…', value: query,
        onChange: e => setQuery(e.target.value),
      })
    ),
    React.createElement('div', { className: 'p-scroll' },
      filtered.length === 0
        ? React.createElement('p', { className: 'p-empty' }, 'No tabs found.')
        : windowIds.map((wid, i) =>
            React.createElement('div', { key: wid },
              windowIds.length > 1 &&
                React.createElement('div', { className: 'p-win-label' }, `Window ${i + 1}`),
              byWindow[wid].map(t => React.createElement(TabItem, { key: t.id, tab: t }))
            )
          )
    )
  );
}

// ─── Clocks section ──────────────────────────────────────────────────────────

function ClocksPanel() {
  const now = useNow();
  const [zones] = useStorage(STORAGE_KEYS.zones, defaultZones(), true);

  return React.createElement('div', { className: 'p-panel' },
    React.createElement('div', { className: 'p-panel-hd' },
      React.createElement('span', { className: 'p-panel-title' }, 'World Clocks'),
    ),
    React.createElement('div', { className: 'p-scroll' },
      zones.map(z => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: z.tz, hour: 'numeric', minute: '2-digit',
          second: '2-digit', hour12: true,
        }).formatToParts(now);
        const hour   = parts.find(p => p.type === 'hour')?.value || '';
        const minute = parts.find(p => p.type === 'minute')?.value || '';
        const second = parts.find(p => p.type === 'second')?.value || '';
        const period = parts.find(p => p.type === 'dayPeriod')?.value || '';
        const offset = new Intl.DateTimeFormat('en-US', {
          timeZone: z.tz, timeZoneName: 'shortOffset',
        }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';

        return React.createElement('div', { key: z.id, className: 'p-clock' },
          React.createElement('div', { className: 'p-clock-label' }, z.label),
          React.createElement('div', { className: 'p-clock-time' },
            `${hour}:${minute}:${second} `,
            React.createElement('span', { className: 'p-clock-period' }, period),
          ),
          React.createElement('div', { className: 'p-clock-offset' }, offset),
        );
      })
    )
  );
}

// ─── System section ──────────────────────────────────────────────────────────

function SysBar({ pct, color }) {
  return React.createElement('div', { className: 'p-sys-bar-bg' },
    React.createElement('div', {
      className: 'p-sys-bar-fill',
      style: { width: `${pct}%`, background: color || '#1976d2' },
    })
  );
}

function SystemPanel() {
  const cpu    = useCpuUsage(true);
  const mem    = useMemoryInfo(true);
  const drives = useStorageInfo(true);

  const memPct   = mem ? Math.round(((mem.capacity - mem.availableCapacity) / mem.capacity) * 100) : 0;
  const memUsed  = mem ? fmtBytes(mem.capacity - mem.availableCapacity) : '—';
  const memTotal = mem ? fmtBytes(mem.capacity) : '—';
  const cpuColor = cpu > 80 ? '#e53935' : cpu > 50 ? '#fb8c00' : '#1976d2';

  return React.createElement('div', { className: 'p-panel' },
    React.createElement('div', { className: 'p-panel-hd' },
      React.createElement('span', { className: 'p-panel-title' }, 'System'),
    ),
    React.createElement('div', { className: 'p-scroll' },
      React.createElement('div', { className: 'p-sys' },
        React.createElement('div', { className: 'p-sys-metric' },
          React.createElement('div', { className: 'p-sys-row' },
            React.createElement('span', { className: 'p-sys-label' }, 'CPU'),
            React.createElement('span', { className: 'p-sys-val' }, cpu === null ? '…' : `${cpu}%`),
          ),
          React.createElement(SysBar, { pct: cpu ?? 0, color: cpuColor }),
        ),
        mem && React.createElement('div', { className: 'p-sys-metric' },
          React.createElement('div', { className: 'p-sys-row' },
            React.createElement('span', { className: 'p-sys-label' }, 'RAM'),
            React.createElement('span', { className: 'p-sys-val' }, `${memUsed} / ${memTotal}`),
          ),
          React.createElement(SysBar, { pct: memPct }),
        ),
        drives.length > 0 && React.createElement('div', { className: 'p-sys-drives' },
          React.createElement('div', { className: 'p-sys-drives-title' }, 'Storage'),
          drives.map(d =>
            React.createElement('div', { key: d.id, className: 'p-sys-drive' },
              React.createElement('span', { className: 'p-sys-drive-name' }, d.name || d.type),
              React.createElement('span', null, fmtBytes(d.capacity)),
            )
          )
        ),
      )
    )
  );
}

// ─── Nav definition ─────────────────────────────────────────────────────────

const NAV = [
  { id: 'bookmarks', label: 'Bookmarks', emoji: '🔖' },
  { id: 'tabs',      label: 'Tabs',      emoji: '⬜' },
  { id: 'clocks',    label: 'Clocks',    emoji: '🕐' },
  { id: 'system',    label: 'System',    emoji: '💻' },
];

// ─── Root app ────────────────────────────────────────────────────────────────

function PanelApp() {
  const [active, setActive] = useState('bookmarks');

  return React.createElement('div', { className: 'p-root' },

    // Vertical icon nav (Gmail-style)
    React.createElement('nav', { className: 'p-nav' },
      React.createElement('div', { className: 'p-nav-logo' },
        React.createElement('span', { className: 'p-nav-logo-text' }, '1st'),
      ),
      React.createElement('div', { className: 'p-nav-items' },
        NAV.map(item =>
          React.createElement('button', {
            key: item.id,
            className: `p-nav-btn${active === item.id ? ' active' : ''}`,
            onClick: () => setActive(item.id),
            title: item.label,
          },
            React.createElement('span', { className: 'p-nav-icon' }, item.emoji),
            React.createElement('span', { className: 'p-nav-label' }, item.label),
          )
        )
      ),
    ),

    // Content area
    React.createElement('main', { className: 'p-main' },
      active === 'bookmarks' && React.createElement(BookmarksPanel),
      active === 'tabs'      && React.createElement(TabsPanel),
      active === 'clocks'    && React.createElement(ClocksPanel),
      active === 'system'    && React.createElement(SystemPanel),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(PanelApp)
);

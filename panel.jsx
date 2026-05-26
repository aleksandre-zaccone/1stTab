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

// ─── Favicon ────────────────────────────────────────────────────────────────

function BmFavicon({ url, name, size = 16 }) {
  const src = faviconUrl(url, size * 2);
  const [ok, setOk] = useState(!!src);
  useEffect(() => { setOk(!!src); }, [src]);

  if (ok && src) {
    return React.createElement('img', {
      className: 'p-bm-fav',
      src,
      alt: '',
      style: { width: `${size}px`, height: `${size}px`, flexShrink: 0 },
      onError: () => setOk(false)
    });
  }
  return React.createElement('span', {
    className: 'material-symbols-outlined',
    style: { fontSize: `${size}px`, opacity: 0.6, flexShrink: 0 }
  }, 'public');
}

// ─── Bookmarks Tree ─────────────────────────────────────────────────────────

function BookmarkNode({ node, depth = 0, searchQuery = '' }) {
  const isFolder = !!node.children;
  // Auto-open root children (Bookmark Bar, etc.)
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
  // Hide the actual root node (id: '0')
  if (node.id === '0') {
    return React.createElement('div', null, 
      (node.children || []).map(child => 
        React.createElement(BookmarkNode, { key: child.id, node: child, depth, searchQuery })
      )
    );
  }

  const handleClick = (e) => {
    if (isFolder) setOpen(!open);
    else if (node.url) window.open(node.url, '_blank');
  };

  return React.createElement('div', { className: 'p-tree-node' },
    React.createElement('div', {
      className: `p-tree-row ${isFolder ? 'p-tree-row--folder' : 'p-tree-row--item'}`,
      style: { paddingLeft: `${depth * 16 + 10}px` },
      onClick: handleClick
    },
      isFolder ? React.createElement('span', {
        className: `p-tree-chevron material-symbols-outlined ${open ? 'open' : ''}`,
        style: { fontSize: '16px' }
      }, 'chevron_right') : React.createElement('span', { style: { width: '16px' } }),
      
      isFolder ? React.createElement('span', {
        className: 'material-symbols-outlined p-tree-icon',
        style: { fontSize: '18px', color: 'var(--accent-blue)' }
      }, open ? 'folder_open' : 'folder') : React.createElement(BmFavicon, { url: node.url, name: node.title }),
      
      React.createElement('span', { className: 'p-tree-text' }, node.title || (isFolder ? 'Folder' : 'Bookmark'))
    ),
    isFolder && open && React.createElement('div', { className: 'p-tree-children' },
      filteredChildren.map(child =>
        React.createElement(BookmarkNode, { key: child.id, node: child, depth: depth + 1, searchQuery })
      )
    )
  );
}

function buildPluginBookmarksTree(folders, bookmarks) {
  const folderMap = {};
  folders.forEach(f => {
    folderMap[f.id] = {
      id: f.id,
      title: f.name,
      children: []
    };
  });

  const pluginRoot = {
    id: 'plugin-root',
    title: '1stTab Dashboard',
    children: []
  };

  // Map bookmarks into their respective folders
  bookmarks.forEach(b => {
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

  // Nest folders under their parents, or under the root
  folders.forEach(f => {
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
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.getTree((res) => {
        if (res && res[0]) {
          // Clone the root node to avoid mutating cached structures
          const chromeRoot = { ...res[0] };
          const pluginSubtree = buildPluginBookmarksTree(folders || [], bookmarks || []);
          // Merge the custom dashboard subtree as the first child
          chromeRoot.children = [pluginSubtree, ...(chromeRoot.children || [])];
          setTree([chromeRoot]);
        } else {
          setTree(res);
        }
      });
    } else {
      // Fallback for non-extension environments (dev testing)
      const pluginSubtree = buildPluginBookmarksTree(folders || [], bookmarks || []);
      setTree([{ id: '0', title: 'Root', children: [pluginSubtree] }]);
    }
  }, [bookmarks, folders]);

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'p-search-wrap' },
      React.createElement('input', {
        type: 'search', className: 'p-search', placeholder: 'Search bookmarks…',
        value: query, onChange: e => setQuery(e.target.value)
      })
    ),
    React.createElement('div', { className: 'p-scroll p-tree-root' },
      tree ? (
        tree.length > 0 ? 
          React.createElement(BookmarkNode, { node: tree[0], searchQuery: q }) : 
          React.createElement('p', { className: 'p-empty' }, 'No bookmarks found.')
      ) : React.createElement('p', { className: 'p-empty' }, 'Loading bookmarks…')
    )
  );
}

// ─── Calendar & Tasks Helpers ────────────────────────────────────────────────

const CAL_COLORS = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
  '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#616161',
  '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
};

function fmtEventTime(ev) {
  if (ev.start?.date) return 'All day';
  const fmt = t => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${fmt(ev.start?.dateTime)} – ${fmt(ev.end?.dateTime)}`;
}

function groupEventsByDate(events) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const map = {};
  events.forEach(ev => {
    const key = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
    if (!key) return;
    (map[key] = map[key] || []).push(ev);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, evs]) => {
      const d = new Date(key + 'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      const label = diff === 0 ? 'Today'
        : diff === 1 ? 'Tomorrow'
        : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      return { key, label, events: evs };
    });
}

function fmtDueDate(due) {
  const d = new Date(due);
  const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return `Overdue · ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

// ─── Plus Gate ────────────────────────────────────────────────────────────────

function PlusGate({ feature }) {
  return (
    <div className="p-plus-gate">
      <span className="material-symbols-outlined p-plus-gate-icon">lock</span>
      <p className="p-plus-gate-text">
        <strong>{feature}</strong> requires 1stTab Plus with Google Drive connected.
      </p>
      <a href="settings.html" target="_blank" rel="noopener noreferrer" className="p-plus-gate-btn">
        Open Settings
      </a>
    </div>
  );
}

// ─── Google Calendar ──────────────────────────────────────────────────────────

function CalendarContent() {
  const [plus] = window.useStorage('1stTab.plus', { active: false }, false);
  const [driveEmail] = window.useStorage('1stTab.driveEmail', null, false);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPlus = plus?.active;

  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const result = await chrome.runtime.sendMessage({ action: 'cal-events' });
      if (result.error) throw new Error(result.error);
      setEvents(result.events || []);
    } catch (e) {
      setError('Could not load events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isPlus || !driveEmail) return;
    fetchEvents();
    const id = setInterval(fetchEvents, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [isPlus, driveEmail]);

  if (!isPlus || !driveEmail) return <PlusGate feature="Google Calendar" />;

  const grouped = groupEventsByDate(events || []);

  return (
    <>
      <div className="p-section-hd">
        <span>Google Calendar</span>
        <button className="p-icon-btn" onClick={fetchEvents} disabled={loading} title="Refresh">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
        </button>
      </div>
      <div className="p-scroll">
        {loading && events === null && <p className="p-empty">Loading events…</p>}
        {error && (
          <div className="p-error">
            {error}
            <button className="p-retry-btn" onClick={fetchEvents}>Retry</button>
          </div>
        )}
        {!loading && !error && grouped.length === 0 && (
          <p className="p-empty">No upcoming events in the next 4 days.</p>
        )}
        {grouped.map(({ key, label, events: dayEvs }) => (
          <div key={key} className="p-cal-day">
            <div className="p-cal-day-hd">{label}</div>
            {dayEvs.map(ev => (
              <a
                key={ev.id}
                className="p-cal-event"
                href={ev.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  className="p-cal-event-dot"
                  style={{ backgroundColor: CAL_COLORS[ev.colorId] || 'var(--accent-blue)' }}
                />
                <div className="p-cal-event-body">
                  <div className="p-cal-event-title">{ev.summary || '(no title)'}</div>
                  <div className="p-cal-event-time">{fmtEventTime(ev)}</div>
                </div>
              </a>
            ))}
          </div>
        ))}
        <a
          className="p-cal-add"
          href="https://calendar.google.com/calendar/r/eventedit"
          target="_blank"
          rel="noopener noreferrer"
        >
          + Add event
        </a>
      </div>
    </>
  );
}

// ─── Google Tasks ─────────────────────────────────────────────────────────────

function TasksContent() {
  const [plus] = window.useStorage('1stTab.plus', { active: false }, false);
  const [driveEmail] = window.useStorage('1stTab.driveEmail', null, false);
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  const isPlus = plus?.active;

  async function fetchTasks() {
    setError(null);
    try {
      const result = await chrome.runtime.sendMessage({ action: 'tasks-list' });
      if (result.error) throw new Error(result.error);
      setTasks(result.tasks || []);
    } catch (e) {
      setError('Could not load tasks.');
    }
  }

  useEffect(() => {
    if (!isPlus || !driveEmail) return;
    fetchTasks();
  }, [isPlus, driveEmail]);

  if (!isPlus || !driveEmail) return <PlusGate feature="Google Tasks" />;

  async function handleComplete(taskId) {
    setTasks(prev => prev?.filter(t => t.id !== taskId));
    await chrome.runtime.sendMessage({ action: 'tasks-complete', taskId });
    fetchTasks();
  }

  async function handleAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    setNewTitle('');
    const result = await chrome.runtime.sendMessage({ action: 'tasks-add', title });
    if (result?.task) {
      setTasks(prev => [result.task, ...(prev || [])]);
    } else {
      await fetchTasks();
    }
    setAdding(false);
    inputRef.current?.focus();
  }

  const openTasks = (tasks || []).filter(t => t.status !== 'completed');

  return (
    <>
      <form onSubmit={handleAdd} className="p-task-add-form">
        <input
          ref={inputRef}
          className="p-search p-task-add-input"
          placeholder="Add a task…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          disabled={adding}
        />
        <button
          type="submit"
          className="p-task-add-btn"
          disabled={adding || !newTitle.trim()}
        >
          Add
        </button>
      </form>
      <div className="p-scroll">
        {error && (
          <div className="p-error">
            {error}
            <button className="p-retry-btn" onClick={fetchTasks}>Retry</button>
          </div>
        )}
        {tasks === null && !error && <p className="p-empty">Loading tasks…</p>}
        {tasks !== null && openTasks.length === 0 && (
          <p className="p-empty">No open tasks — add one above!</p>
        )}
        {openTasks.map(task => (
          <div key={task.id} className="p-task-item">
            <input
              type="checkbox"
              className="p-task-cb"
              onChange={() => handleComplete(task.id)}
            />
            <div className="p-task-body">
              <div className="p-task-title">{task.title}</div>
              {task.due && (
                <div
                  className="p-task-due"
                  style={{ color: new Date(task.due) < new Date() ? '#d93025' : undefined }}
                >
                  {fmtDueDate(task.due)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Tab Management ───────────────────────────────────────────────────────────

function TabsContent() {
  const [tabs, setTabs] = useState([]);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState([]);

  function loadTabs() { chrome.tabs.query({}, t => setTabs(t || [])); }
  function loadRecent() {
    chrome.sessions.getRecentlyClosed({ maxResults: 8 }, s => {
      setRecent((s || []).filter(x => x.tab).map(x => x.tab));
    });
  }

  useEffect(() => {
    loadTabs(); loadRecent();
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
  const filtered = tabs.filter(t =>
    !q || t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)
  );

  const byWindow = {};
  filtered.forEach(t => (byWindow[t.windowId] = byWindow[t.windowId] || []).push(t));
  const winIds = Object.keys(byWindow);

  async function switchTo(tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  }

  return (
    <>
      <div className="p-search-wrap">
        <input className="p-search" type="search" placeholder="Search tabs…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="p-scroll">
        {winIds.map((wid, wi) => (
          <div key={wid}>
            {winIds.length > 1 && <div className="p-tab-group-hd">Window {wi + 1}</div>}
            {byWindow[wid].map(tab => (
              <div key={tab.id} className={`p-tab-row${tab.active ? ' p-tab-row--active' : ''}`} onClick={() => switchTo(tab)}>
                <img className="p-tab-fav" src={tab.favIconUrl || ''} alt="" onError={e => { e.target.style.display = 'none'; }} />
                <div className="p-tab-info">
                  <div className="p-tab-title">{tab.title || 'Loading…'}</div>
                </div>
                <div className="p-tab-actions">
                  {tab.audible && (
                    <button className="p-icon-btn" onClick={e => { e.stopPropagation(); chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted }); }} title={tab.mutedInfo?.muted ? 'Unmute' : 'Mute'}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{tab.mutedInfo?.muted ? 'volume_off' : 'volume_up'}</span>
                    </button>
                  )}
                  <button className="p-icon-btn" onClick={e => { e.stopPropagation(); chrome.tabs.remove(tab.id); }} title="Close">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {recent.length > 0 && (
          <div>
            <div className="p-tab-group-hd">Recently Closed</div>
            {recent.slice(0, 5).map((tab, i) => (
              <div key={i} className="p-tab-row p-tab-row--closed" onClick={() => chrome.sessions.restore(tab.sessionId)}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, opacity: 0.4, flexShrink: 0 }}>history</span>
                <div className="p-tab-info"><div className="p-tab-title">{tab.title || tab.url}</div></div>
              </div>
            ))}
          </div>
        )}
        {filtered.length === 0 && <p className="p-empty">No tabs match.</p>}
      </div>
    </>
  );
}

// ─── System Monitor ───────────────────────────────────────────────────────────

function SystemContent() {
  const [cpu, setCpu] = useState(null);
  const [mem, setMem] = useState(null);
  const [storage, setStorage] = useState(null);
  const prevCpuRef = useRef(null);

  function refresh() {
    if (chrome.system?.cpu) {
      chrome.system.cpu.getInfo(info => {
        const prev = prevCpuRef.current;
        prevCpuRef.current = info;
        if (prev) {
          let used = 0, elapsed = 0;
          info.processors.forEach((p, i) => {
            const c = p.usage, o = prev.processors[i]?.usage || {};
            const delta = (c.total || 0) - (o.total || 0);
            const idle = (c.idle || 0) - (o.idle || 0);
            elapsed += delta; used += (delta - idle);
          });
          setCpu(elapsed > 0 ? Math.min(100, Math.round(used / elapsed * 100)) : 0);
        }
      });
    }
    if (chrome.system?.memory) {
      chrome.system.memory.getInfo(info => setMem({ used: info.capacity - info.availableCapacity, total: info.capacity }));
    }
    if (chrome.system?.storage) {
      chrome.system.storage.getInfo(drives => setStorage(drives || []));
    }
  }

  useEffect(() => { refresh(); const id = setInterval(refresh, 2000); return () => clearInterval(id); }, []);

  return (
    <div className="p-sys">
      <div>
        <div className="p-sys-row"><span>CPU</span><span>{cpu !== null ? `${cpu}%` : '…'}</span></div>
        <div className="p-sys-bar-bg"><div className="p-sys-bar-fill" style={{ width: `${cpu || 0}%`, background: cpu > 80 ? '#d93025' : undefined }} /></div>
      </div>
      {mem && (
        <div>
          <div className="p-sys-row"><span>RAM</span><span>{fmtBytes(mem.used)} / {fmtBytes(mem.total)}</span></div>
          <div className="p-sys-bar-bg"><div className="p-sys-bar-fill" style={{ width: `${Math.round(mem.used / mem.total * 100)}%` }} /></div>
        </div>
      )}
      {(storage || []).map(d => (
        <div key={d.id}>
          <div className="p-sys-row"><span>{d.name || 'Disk'}</span><span>{fmtBytes(d.capacity - d.availableCapacity)} / {fmtBytes(d.capacity)}</span></div>
          <div className="p-sys-bar-bg"><div className="p-sys-bar-fill" style={{ width: `${Math.round((d.capacity - d.availableCapacity) / d.capacity * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

// ─── AI Bookmark Assistant ────────────────────────────────────────────────────

function AIContent() {
  const [plus] = window.useStorage('1stTab.plus', { active: false }, false);
  const [aiProvider, setAiProvider] = window.useStorage('1stTab.aiProvider', 'claude', false);
  const [claudeKey] = window.useStorage('1stTab.claudeKey', '', false);
  const [claudeModel, setClaudeModel] = window.useStorage('1stTab.claudeModel', 'claude-3-5-haiku-20241022', false);
  const [openaiKey] = window.useStorage('1stTab.openaiKey', '', false);
  const [openaiModel, setOpenaiModel] = window.useStorage('1stTab.openaiModel', 'gpt-4o-mini', false);
  const [geminiKey] = window.useStorage('1stTab.geminiKey', '', false);
  const [geminiModel, setGeminiModel] = window.useStorage('1stTab.geminiModel', 'gemini-1.5-flash', false);
  const apiKey = aiProvider === 'openai' ? openaiKey : aiProvider === 'gemini' ? geminiKey : claudeKey;
  const modelId = aiProvider === 'openai' ? openaiModel : aiProvider === 'gemini' ? geminiModel : claudeModel;
  const [bookmarks] = window.useStorage(STORAGE_KEYS.bookmarks, SEED_BOOKMARKS, false);
  const [folders] = window.useStorage(STORAGE_KEYS.folders, SEED_FOLDERS, false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dynamicGeminiModels, setDynamicGeminiModels] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (geminiKey) {
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey.trim()}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.models) {
            const valid = data.models
              .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace('models/', ''));
            if (valid.length > 0) {
              setDynamicGeminiModels(valid);
            }
          }
        })
        .catch(err => console.error('Failed to fetch Gemini models:', err));
    }
  }, [geminiKey]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!plus?.active) return <PlusGate feature="AI Bookmark Assistant" />;

  async function handleProviderChange(e) {
    const [newProvider, newModelId] = e.target.value.split(':');
    
    // Check if there is an actual change
    if (newProvider === aiProvider && newModelId === modelId) return;

    if (messages.length === 0) {
      if (newProvider === 'claude') setClaudeModel(newModelId);
      if (newProvider === 'openai') setOpenaiModel(newModelId);
      if (newProvider === 'gemini') setGeminiModel(newModelId);
      setAiProvider(newProvider);
      return;
    }

    setLoading(true);
    try {
      const summaryMsg = { role: 'user', content: 'Summarize the key points, context, and decisions made in this conversation so far so another AI can continue it seamlessly. Be extremely concise.' };
      
      const response = await chrome.runtime.sendMessage({
        action: 'ai-assistant',
        provider: aiProvider,
        apiKey,
        modelId,
        userMsg: summaryMsg,
        ctx: '', // Don't need bookmark context for summarization
        messages
      });
      
      if (response.error) throw new Error(response.error);
      const data = response.data;
      const summaryText = data.content?.[0]?.text || 'Conversation summarized.';
      
      const providerName = newProvider === 'openai' ? 'ChatGPT' : newProvider === 'gemini' ? 'Gemini' : 'Claude';
      setMessages([{ role: 'assistant', content: `[Switched to ${providerName} (${newModelId})]\n\nContext from previous model:\n${summaryText}` }]);
    } catch (err) {
      console.error('Failed to summarize:', err);
      const providerName = newProvider === 'openai' ? 'ChatGPT' : newProvider === 'gemini' ? 'Gemini' : 'Claude';
      setMessages([{ role: 'assistant', content: `[Switched to ${providerName} (${newModelId})]\n\n(Failed to summarize previous context).` }]);
    } finally {
      if (newProvider === 'claude') setClaudeModel(newModelId);
      if (newProvider === 'openai') setOpenaiModel(newModelId);
      if (newProvider === 'gemini') setGeminiModel(newModelId);
      setAiProvider(newProvider);
      setLoading(false);
    }
  }

  const header = (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>AI Model</span>
      <select value={`${aiProvider}:${modelId}`} onChange={handleProviderChange} disabled={loading} style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', maxWidth: 180 }}>
        <optgroup label="Anthropic">
          <option value="claude:claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
          <option value="claude:claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
        </optgroup>
        <optgroup label="OpenAI">
          <option value="openai:gpt-4o-mini">GPT-4o mini</option>
          <option value="openai:gpt-4o">GPT-4o</option>
          <option value="openai:gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </optgroup>
        <optgroup label="Google Gemini">
          {dynamicGeminiModels.length > 0 ? dynamicGeminiModels.map(m => (
            <option key={m} value={`gemini:${m}`}>{m}</option>
          )) : (
            <>
              <option value="gemini:gemini-3.0-flash">Gemini 3.0 Flash</option>
              <option value="gemini:gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini:gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini:gemini-1.5-flash">Gemini 1.5 Flash</option>
            </>
          )}
        </optgroup>
      </select>
    </div>
  );

  if (!apiKey) {
    const providerName = aiProvider === 'openai' ? 'OpenAI' : aiProvider === 'gemini' ? 'Gemini' : 'Claude';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {header}
        <div className="p-plus-gate" style={{ flex: 1 }}>
          <span className="material-symbols-outlined p-plus-gate-icon">key</span>
          <p className="p-plus-gate-text">Add your {providerName} API key in <strong>Settings → Plus → AI</strong>.</p>
          <a href="settings.html" target="_blank" rel="noopener noreferrer" className="p-plus-gate-btn">Open Settings</a>
        </div>
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput(''); setLoading(true);
    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);

    // Smart relevance filter — score each bookmark against the user's query tokens
    // so the AI context always reflects intent, not just insertion order.
    const tokens = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    function scoreBookmark(b) {
      if (tokens.length === 0) return 1;
      const haystack = [
        b.name || '',
        b.url || '',
        (b.tags || []).join(' '),
        b.description || '',
        (folders.find(f => f.id === b.folderId)?.name) || '',
      ].join(' ').toLowerCase();
      return tokens.reduce((score, tok) => score + (haystack.includes(tok) ? 1 : 0), 0);
    }
    const scoredBookmarks = (bookmarks || [])
      .map(b => ({ b, score: scoreBookmark(b) }))
      .sort((a, z) => z.score - a.score)
      .slice(0, 30) // Top 30 most relevant
      .map(({ b }) => b);

    const ctx = scoredBookmarks.map(b => {
      const f = folders.find(x => x.id === b.folderId);
      return `${b.name} (${b.url}) — folder: ${f?.name || '?'} — tags: ${(b.tags || []).join(', ')} — ${b.description || ''}`;
    }).join('\n');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'ai-assistant',
        provider: aiProvider,
        apiKey,
        modelId,
        userMsg,
        ctx,
        messages
      });
      
      if (response.error) throw new Error(response.error);
      const data = response.data;
      setMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || '(no response)' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {header}
      <div className="p-scroll p-ai-messages" style={{ flex: 1, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="p-ai-hint">
            <p style={{ marginBottom: 8 }}>Ask about your bookmarks:</p>
            <p className="p-ai-example">"Find my React articles"</p>
            <p className="p-ai-example">"What did I save about travel?"</p>
            <p className="p-ai-example">"Summarize my Work folder"</p>
          </div>
        )}
        {messages.map((m, i) => <div key={i} className={`p-ai-msg p-ai-msg--${m.role}`} style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>)}
        {loading && <div className="p-ai-msg p-ai-msg--assistant p-ai-typing">…</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-ai-form">
        <input ref={inputRef} className="p-search" placeholder="Ask about your bookmarks…" value={input} onChange={e => setInput(e.target.value)} disabled={loading} />
        <button type="submit" className="p-task-add-btn" disabled={loading || !input.trim()}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
        </button>
      </form>
    </div>
  );
}

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV = [
  { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmarks' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar_today' },
  { id: 'tasks', label: 'Tasks', icon: 'task_alt' },
  { id: 'tabs', label: 'Tabs', icon: 'tab' },
  { id: 'system', label: 'System', icon: 'monitor_heart' },
  { id: 'ai', label: 'AI Assistant', icon: 'smart_toy' },
];

// ─── Root ────────────────────────────────────────────────────────────────────

function PanelApp() {
  const [active, setActive] = useState('bookmarks');

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setActive('bookmarks');
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  function toggle(id) {
    setActive(prev => prev === id ? null : id);
  }

  return React.createElement('div', { className: `p-root${active ? ' p-root--open' : ''}` },
    React.createElement('nav', { className: 'p-nav' },
      React.createElement('div', { className: 'p-nav-items' },
        NAV.map(item =>
          React.createElement('button', {
            key: item.id,
            className: `p-nav-btn${active === item.id ? ' active' : ''}`,
            onClick: () => toggle(item.id),
            title: item.label,
          },
            React.createElement('span', { className: 'p-nav-icon material-symbols-outlined' }, item.icon)
          )
        )
      ),
      React.createElement('div', { className: 'p-nav-bottom' },
        React.createElement('button', {
          className: 'p-nav-btn',
          title: 'Open as popup window',
          onClick: () => chrome.windows.create({ url: chrome.runtime.getURL('panel.html'), type: 'popup', width: 400, height: 650 }),
        },
          React.createElement('span', { className: 'p-nav-icon material-symbols-outlined' }, 'open_in_new')
        )
      ),
    ),
    React.createElement('div', { className: 'p-content' },
      active === 'bookmarks' && React.createElement(BookmarksContent),
      active === 'calendar' && React.createElement(CalendarContent),
      active === 'tasks' && React.createElement(TasksContent),
      active === 'tabs' && React.createElement(TabsContent),
      active === 'system' && React.createElement(SystemContent),
      active === 'ai' && React.createElement(AIContent),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PanelApp));

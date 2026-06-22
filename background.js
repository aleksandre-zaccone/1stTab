/* global chrome */

chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  // Auto-open panel on first install
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});

  chrome.alarms.create('licenseCheck', { periodInMinutes: 1440 });
  chrome.alarms.create('autoBackup', { periodInMinutes: 1440, delayInMinutes: 2 });

  await seedDefaultBookmarks();
});

async function seedDefaultBookmarks() {
  const FLAG = '1stTab.seeded';
  const existing = await chrome.storage.local.get(FLAG);
  if (existing[FLAG]) return;

  const SEEDS = [
    { title: 'Claude AI',    url: 'https://claude.ai',           color: '#cc785c', initial: 'C' },
    { title: 'Google Gemini',url: 'https://gemini.google.com',   color: '#8e75d1', initial: 'G' },
    { title: 'Google',       url: 'https://google.com',          color: '#4285f4', initial: 'G' },
    { title: 'YouTube',      url: 'https://youtube.com',         color: '#ff0000', initial: 'Y' },
    { title: 'GitHub',       url: 'https://github.com',          color: '#24292e', initial: 'G' },
  ];

  try {
    const folder = await new Promise((resolve, reject) => {
      chrome.bookmarks.create({ parentId: '1', title: '1stTab' }, (node) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(node);
      });
    });

    const metaUpdates = {};
    for (const seed of SEEDS) {
      const node = await new Promise((resolve, reject) => {
        chrome.bookmarks.create({ parentId: folder.id, title: seed.title, url: seed.url }, (n) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(n);
        });
      });
      metaUpdates[node.id] = {
        pinned: true,
        color: seed.color,
        initial: seed.initial,
        desc: seed.url.replace(/^https?:\/\//, ''),
      };
    }

    const cur = await chrome.storage.sync.get('nt.bookmarkMeta');
    const merged = { ...(cur['nt.bookmarkMeta'] || {}), ...metaUpdates };
    await chrome.storage.sync.set({ 'nt.bookmarkMeta': merged });
    await chrome.storage.local.set({ [FLAG]: true });
  } catch (e) {
    console.warn('1stTab seed bookmarks failed:', e);
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-panel') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// ─── Media Tab Tracking ─────────────────────────────────────────────────────────

async function updateMediaTabs(tabId, isAudible) {
  const data = await chrome.storage.session.get('mediaTabIds');
  let ids = data.mediaTabIds || [];
  if (isAudible) {
    if (!ids.includes(tabId)) {
      ids.push(tabId);
      await chrome.storage.session.set({ mediaTabIds: ids });
    }
  } else {
    if (ids.includes(tabId)) {
      ids = ids.filter(id => id !== tabId);
      await chrome.storage.session.set({ mediaTabIds: ids });
    }
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.audible !== undefined) {
    updateMediaTabs(tabId, changeInfo.audible);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.session.get('mediaTabIds');
  let ids = data.mediaTabIds || [];
  if (ids.includes(tabId)) {
    await chrome.storage.session.set({ mediaTabIds: ids.filter(id => id !== tabId) });
  }
});

async function initMediaTabs() {
  const tabs = await chrome.tabs.query({ audible: true });
  await chrome.storage.session.set({ mediaTabIds: tabs.map(t => t.id) });
}

chrome.runtime.onStartup.addListener(initMediaTabs);
chrome.runtime.onInstalled.addListener(initMediaTabs);

// ─── Plus Licensing ────────────────────────────────────────────────────────────

const VERIFY_URL = 'https://us-central1-1sttab.cloudfunctions.net/verify';

async function verifyLicense(key) {
  // Dev/test bypass — works offline, no server needed
  if (key === '1STTAB-DEV-PLUS') {
    const plusData = { active: true, expiry: null, key, email: 'developer@local', verifiedAt: Date.now() };
    await chrome.storage.local.set({ '1stTab.plus': plusData });
    return { active: true, email: 'developer@local' };
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    const plusData = data.active
      ? { active: true, expiry: data.expiry, key, email: data.email, verifiedAt: Date.now() }
      : { active: false, key };
    await chrome.storage.local.set({ '1stTab.plus': plusData });
    return data;
  } catch (e) {
    return { active: false, error: e.message };
  }
}

// ─── Google Drive API ──────────────────────────────────────────────────────────

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
];

const ALL_DASH_KEYS = [
  'nt.theme', 'nt.arcadeGame', 'nt.unit', 'nt.name',
  'nt.widgets', 'nt.todos', 'nt.zones', 'nt.tab', 'nt.folder',
  'nt.view', 'nt.treeExpanded', 'nt.bookmarkMeta',
  'nt.greetings', 'nt.fontFamily', 'nt.weatherCity', 'nt.clockFace', 'nt.bgId',
  'dash.pomodoro.work', 'dash.pomodoro.break', 'dash.crypto', 'dash.fx', 'dash.stocks', 'dash.tweaks',
  'nt.notes', 'nt.customCSS', '1stTab.plus', '1stTab.claudeKey', '1stTab.finnhubKey'
];

function getDriveToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive, scopes: DRIVE_SCOPES }, token => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(token);
    });
  });
}

async function getConnectedEmail(token) {
  const r = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await r.json();
  return d.email || null;
}

async function collectAllData() {
  const [localData, syncData, bookmarkTree] = await Promise.all([
    new Promise(r => chrome.storage.local.get(ALL_DASH_KEYS, r)),
    new Promise(r => chrome.storage.sync.get(ALL_DASH_KEYS, r)),
    new Promise(resolve => chrome.bookmarks.getTree(resolve)),
  ]);
  const merged = { ...localData, ...syncData };
  merged['1stTab.backup.meta'] = { timestamp: Date.now() };
  merged['chrome.bookmarks.tree'] = bookmarkTree;
  return merged;
}

async function driveUpload(token, jsonData) {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `1stTab-backup-${date}-${Date.now()}.json`;
  const boundary = 'BOUNDARY_1STTAB_V1';
  const metaPart = JSON.stringify({ name: filename, parents: ['appDataFolder'] });
  const bodyPart = JSON.stringify(jsonData);
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metaPart,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    bodyPart,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  return await res.json();
}

async function driveListBackups(token) {
  const q = encodeURIComponent("name contains '1stTab-backup'");
  const fields = encodeURIComponent('files(id,name,createdTime,size)');
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=${fields}&orderBy=createdTime+desc&q=${q}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const json = await res.json();
  return json.files || [];
}

async function driveGetFile(token, fileId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive get failed: ${res.status}`);
  return await res.json();
}

async function driveDeleteFile(token, fileId) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function pruneOldBackups(token) {
  const files = await driveListBackups(token);
  for (const f of files.slice(5)) await driveDeleteFile(token, f.id);
}

async function performDriveBackup() {
  const stored = (await chrome.storage.local.get('1stTab.plus'))['1stTab.plus'] || {};
  if (!stored.active) return { ok: false, error: 'Not a Plus user' };
  try {
    const token = await getDriveToken(false);
    const data = await collectAllData();
    const file = await driveUpload(token, data);
    await pruneOldBackups(token);
    const now = Date.now();
    await chrome.storage.local.set({
      '1stTab.lastBackup': now,
      '1stTab.backupStatus': { ok: true, ts: now, name: file.name },
    });
    return { ok: true, fileId: file.id, name: file.name };
  } catch (err) {
    await chrome.storage.local.set({
      '1stTab.backupStatus': { ok: false, ts: Date.now(), error: err.message },
    });
    throw err;
  }
}

// ─── Alarms ────────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === 'licenseCheck') {
    const stored = (await chrome.storage.local.get('1stTab.plus'))['1stTab.plus'] || {};
    if (stored.key) verifyLicense(stored.key).catch(() => {});
  }
  if (name === 'autoBackup') {
    const [plusData, settingData] = await Promise.all([
      chrome.storage.local.get('1stTab.plus'),
      chrome.storage.local.get('1stTab.autoBackup'),
    ]);
    const plus = plusData['1stTab.plus'] || {};
    const autoBackup = settingData['1stTab.autoBackup'] || 'off';
    if (plus.active && autoBackup === 'daily') {
      performDriveBackup().catch(async (err) => {
        // Already persisted in performDriveBackup, but log for diagnostics
        console.warn('[1stTab] Auto-backup failed:', err.message);
      });
    }
  }
});

// ─── Message Handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'verify-license') {
    verifyLicense(msg.key).then(sendResponse).catch(e => sendResponse({ active: false, error: e.message }));
    return true;
  }

  if (msg.action === 'drive-connect') {
    getDriveToken(true)
      .then(async token => {
        const email = await getConnectedEmail(token);
        if (email) await chrome.storage.local.set({ '1stTab.driveEmail': email });
        return { email };
      })
      .then(sendResponse)
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.action === 'drive-disconnect') {
    chrome.identity.clearAllCachedAuthTokens(() => {
      chrome.storage.local.remove('1stTab.driveEmail', () => sendResponse({ ok: true }));
    });
    return true;
  }

  if (msg.action === 'backup-now') {
    performDriveBackup()
      .then(sendResponse)
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.action === 'list-backups') {
    getDriveToken(true)
      .then(token => driveListBackups(token))
      .then(backups => sendResponse({ backups }))
      .catch(e => sendResponse({ backups: [], error: e.message }));
    return true;
  }

  if (msg.action === 'restore-backup') {
    getDriveToken(true)
      .then(token => driveGetFile(token, msg.fileId))
      .then(data => sendResponse({ data }))
      .catch(e => sendResponse({ data: null, error: e.message }));
    return true;
  }

  if (msg.action === 'set-auto-backup') {
    chrome.storage.local.set({ '1stTab.autoBackup': msg.value }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === 'cal-events') {
    getCalendarEvents().then(events => sendResponse({ events })).catch(e => sendResponse({ events: [], error: e.message }));
    return true;
  }

  if (msg.action === 'tasks-list') {
    getTasksList().then(tasks => sendResponse({ tasks })).catch(e => sendResponse({ tasks: [], error: e.message }));
    return true;
  }

  if (msg.action === 'tasks-complete') {
    completeTask(msg.taskId).then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.action === 'tasks-add') {
    addTask(msg.title).then(task => sendResponse({ ok: true, task })).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.action === 'crypto-prices') {
    getCryptoPrices(msg.coins).then(data => sendResponse({ data })).catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.action === 'fx-rates') {
    getFXRates(msg.base).then(data => sendResponse({ data })).catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.action === 'stock-quotes') {
    const { symbols, apiKey } = msg;
    Promise.all((symbols || []).map(s => getStockQuote(s, apiKey).then(d => ({ symbol: s, ...d }))))
      .then(quotes => sendResponse({ quotes }))
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.action === 'history-recent') {
    chrome.history.search({ text: '', maxResults: msg.count || 10 }, items => sendResponse({ items: items || [] }));
    return true;
  }

  if (msg.action === 'ai-assistant') {
    const { provider, apiKey, modelId, userMsg, ctx, messages } = msg;
    const systemPrompt = `You help users find and understand their saved bookmarks. Their bookmarks:\n\n${ctx}\n\nAnswer concisely.`;
    
    let fetchPromise;

    if (provider === 'openai') {
      fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.trim()}` },
        body: JSON.stringify({
          model: modelId || 'gpt-4o-mini',
          max_tokens: 512,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            userMsg
          ],
        }),
      }).then(async res => {
        if (!res.ok) {
          let errStr = `API ${res.status}`;
          try { const errBody = await res.json(); errStr = errBody.error?.message || JSON.stringify(errBody); } catch (e) {}
          throw new Error(errStr);
        }
        const data = await res.json();
        return { content: [{ text: data.choices?.[0]?.message?.content }] };
      });
    } else if (provider === 'gemini') {
      const geminiMessages = [...messages, userMsg].map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      
      fetchPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-1.5-flash'}:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: 512 }
        }),
      }).then(async res => {
        if (!res.ok) {
          let errStr = `API ${res.status}`;
          try { const errBody = await res.json(); errStr = errBody.error?.message || JSON.stringify(errBody); } catch (e) {}
          throw new Error(errStr);
        }
        const data = await res.json();
        return { content: [{ text: data.candidates?.[0]?.content?.parts?.[0]?.text }] };
      });
    } else {
      fetchPromise = fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': apiKey.trim(), 
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: modelId || 'claude-3-5-haiku-20241022',
          max_tokens: 512,
          system: systemPrompt,
          messages: [...messages, userMsg],
        }),
      }).then(async res => {
        if (!res.ok) {
          let errStr = `API ${res.status}`;
          try { const errBody = await res.json(); errStr = errBody.error?.message || JSON.stringify(errBody); } catch (e) {}
          throw new Error(errStr);
        }
        return res.json();
      });
    }

    fetchPromise
      .then(data => sendResponse({ data }))
      .catch(err => sendResponse({ error: err.message }));
      
    return true;
  }
});

// ─── Google Calendar API ───────────────────────────────────────────────────────

async function calFetch(token, path, opts = {}) {
  const res = await fetch('https://www.googleapis.com/calendar/v3' + path, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`Calendar API ${res.status}`);
  return res.json();
}

async function getCalendarEvents() {
  const token = await getDriveToken(false);
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 4 * 86400000).toISOString();
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '50' });
  const data = await calFetch(token, `/calendars/primary/events?${params}`);
  return data.items || [];
}

// ─── Google Tasks API ──────────────────────────────────────────────────────────

async function tasksFetch(token, path, opts = {}) {
  const res = await fetch('https://www.googleapis.com/tasks/v1' + path, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 204) return {};
  if (!res.ok) throw new Error(`Tasks API ${res.status}`);
  return res.json();
}

async function getTasksList() {
  const token = await getDriveToken(false);
  const params = new URLSearchParams({ showCompleted: 'false', maxResults: '100' });
  const data = await tasksFetch(token, `/lists/@default/tasks?${params}`);
  return data.items || [];
}

async function completeTask(taskId) {
  const token = await getDriveToken(false);
  return tasksFetch(token, `/lists/@default/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });
}

async function addTask(title) {
  const token = await getDriveToken(false);
  return tasksFetch(token, '/lists/@default/tasks', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// ─── Finance APIs ──────────────────────────────────────────────────────────────

async function getCryptoPrices(coins) {
  const ids = (coins || ['bitcoin', 'ethereum', 'solana']).join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return res.json();
}

async function getFXRates(base) {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base || 'USD'}`);
  if (!res.ok) throw new Error(`FX API ${res.status}`);
  return res.json();
}

async function getStockQuote(symbol, apiKey) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  );
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  return res.json();
}

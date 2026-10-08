export const META_KEY = 'bookmarks.metadata.v1';
export const SNAPSHOT_KEY = 'bookmarks.legacyMetadataSnapshot.v1';
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);
const cleanString = (x, limit = 2000) => typeof x === 'string' ? x.slice(0, limit) : '';
export function normalizeMeta(value) {
  const v = value && typeof value === 'object' ? value : {};
  const tags = Array.isArray(v.tags) ? v.tags : [v.tag || ''];
  return { tags: [...new Set(tags.map(x => cleanString(x, 80).trim()).filter(Boolean))].slice(0, 30),
    note: cleanString(v.note || v.desc, 10000), pinned: Boolean(v.pinned), color: cleanString(v.color, 50), initial: cleanString(v.initial, 10) };
}
export function indexTree(tree) {
  const nodes = new Map(), bookmarks = [], folders = [];
  function walk(list, parent = null, managed = false) {
    for (const item of list) {
      const node = { ...item, parentId: item.parentId ?? parent, managed: managed || item.unmodifiable === 'managed' };
      nodes.set(node.id, node);
      if (node.url) bookmarks.push(node); else folders.push(node);
      if (node.children) walk(node.children, node.id, node.managed);
    }
  }
  walk(tree); return { nodes, bookmarks, folders };
}
export function safeUrl(raw) {
  const s = String(raw || '').trim();
  const u = new URL(/^[a-z][a-z\d+.-]*:/i.test(s) ? s : `https://${s}`);
  if (!['http:', 'https:', 'ftp:'].includes(u.protocol) || !u.hostname) throw new Error('Use an http, https, or ftp URL.');
  return u.href;
}
export function searchBookmarks(tree, metadata, { query = '', folder = '', tag = '', domain = '', favorites = false } = {}) {
  const idx = indexTree(tree), q = query.trim().toLocaleLowerCase(), d = domain.trim().toLocaleLowerCase();
  return idx.bookmarks.filter(b => {
    const m = normalizeMeta(metadata[b.id]);
    if (folder) {
      let parent = b.parentId; let found = false;
      while (parent) { if (parent === folder) { found = true; break; } parent = idx.nodes.get(parent)?.parentId; }
      if (!found) return false;
    }
    let host = ''; try { host = new URL(b.url).hostname.toLowerCase(); } catch {}
    return (!q || `${b.title}\n${b.url}\n${m.tags.join(' ')}\n${m.note}`.toLocaleLowerCase().includes(q)) &&
      (!tag || m.tags.includes(tag)) && (!d || host === d || host.endsWith(`.${d}`)) && (!favorites || m.pinned);
  });
}
export class BookmarkLibrary {
  constructor(api) { this.api = api; this.queue = Promise.resolve(); }
  serialize(task) { const locked = () => globalThis.navigator?.locks ? navigator.locks.request('1sttab-library-write', task) : task(); const result = this.queue.then(locked); this.queue = result.catch(() => {}); return result; }
  async load() {
    const tree = await this.api.bookmarks.getTree();
    const data = await this.api.storage.local.get(META_KEY);
    const metadata = data[META_KEY]?.items || {};
    return { tree, metadata, ...indexTree(tree) };
  }
  async migrate() {
    return this.serialize(async () => {
      const local = await this.api.storage.local.get([META_KEY, SNAPSHOT_KEY, 'nt.bookmarkMeta']);
      if (local[META_KEY]?.version === 1) return;
      const sync = await this.api.storage.sync.get('nt.bookmarkMeta');
      const legacy = { ...(sync['nt.bookmarkMeta'] || {}), ...(local['nt.bookmarkMeta'] || {}) };
      // Save untouched input first; a failed second write leaves migration retryable.
      if (!local[SNAPSHOT_KEY]) await this.api.storage.local.set({ [SNAPSHOT_KEY]: { local: local['nt.bookmarkMeta'] || {}, sync: sync['nt.bookmarkMeta'] || {}, createdAt: new Date().toISOString() } });
      const idx = indexTree(await this.api.bookmarks.getTree()), items = {};
      for (const [id, v] of Object.entries(legacy)) if (!unsafeKeys.has(id) && idx.nodes.get(id)?.url) items[id] = normalizeMeta(v);
      await this.api.storage.local.set({ [META_KEY]: { version: 1, items } });
      // Keep legacy keys and snapshot: never delete recovery data during migration.
    });
  }
  async setMeta(id, value) {
    return this.serialize(async () => {
      const state = await this.load(); this.editable(state, id);
      if (!state.nodes.get(id).url) throw new Error('Notes and tags belong to a bookmark.');
      await this.api.storage.local.set({ [META_KEY]: { version: 1, items: { ...state.metadata, [id]: normalizeMeta(value) } } });
    });
  }
  editable(state, id) {
    const n = state.nodes.get(id);
    if (!n) throw new Error('This item no longer exists. Refresh and try again.');
    if (n.managed || !n.parentId || (!n.url && !state.nodes.get(n.parentId)?.parentId)) throw new Error('Chrome root and managed folders cannot be edited.');
    return n;
  }
  destination(state, id) {
    const n = state.nodes.get(id);
    if (!n || n.url || n.managed || !n.parentId) throw new Error('Choose a writable bookmark folder.');
    return n;
  }
  async create({ parentId, title, url }) {
    return this.serialize(async () => {
      const s = await this.load(); this.destination(s, parentId);
      return this.api.bookmarks.create({ parentId, title: cleanString(title, 500) || (url ? safeUrl(url) : 'New folder'), ...(url ? { url: safeUrl(url) } : {}) });
    });
  }
  async update(id, changes) {
    return this.serialize(async () => {
      const s = await this.load(), n = this.editable(s, id);
      if ('url' in changes && !n.url) throw new Error('A folder cannot become a bookmark.');
      return this.api.bookmarks.update(id, { title: cleanString(changes.title, 500), ...(n.url && 'url' in changes ? { url: safeUrl(changes.url) } : {}) });
    });
  }
  async backup(reason) {
    const s = await this.load(); const snapshot = { version: 1, createdAt: new Date().toISOString(), reason, tree: s.tree, metadata: s.metadata };
    // Failure to save backup aborts the subsequent destructive operation.
    await this.api.storage.local.set({ 'bookmarks.lastBackup.v1': snapshot }); return snapshot;
  }
  async move(ids, parentId) {
    return this.serialize(async () => {
      const s = await this.load(); this.destination(s, parentId);
      ids = [...new Set(ids)];
      for (const id of ids) {
        this.editable(s, id); let p = parentId;
        while (p) { if (p === id) throw new Error('A folder cannot move inside itself.'); p = s.nodes.get(p)?.parentId; }
      }
      await this.backup('Before moving bookmarks');
      const applied = [];
      try { for (const id of ids) { await this.api.bookmarks.move(id, { parentId }); applied.push(id); } }
      catch (e) { throw new Error(`${applied.length} of ${ids.length} items moved. Backup retained. ${e.message}`); }
    });
  }
  async remove(ids) {
    return this.serialize(async () => {
      const s = await this.load(); ids = [...new Set(ids)]; for (const id of ids) this.editable(s, id);
      const chosen = new Set(ids);
      ids = ids.filter(id => { let p = s.nodes.get(id).parentId; while (p) { if (chosen.has(p)) return false; p = s.nodes.get(p)?.parentId; } return true; });
      await this.backup('Before deleting bookmarks');
      let applied = 0;
      try { for (const id of ids) { const n = s.nodes.get(id); await (n.url ? this.api.bookmarks.remove(id) : this.api.bookmarks.removeTree(id)); applied++; } }
      catch(e) { throw new Error(`${applied} of ${ids.length} items deleted. Backup retained. ${e.message}`); }
    });
  }
  async reorder(ids, targetId, after = false) {
    return this.serialize(async () => {
      const s = await this.load(), target = this.editable(s, targetId);
      if (!target.url) throw new Error('Choose a bookmark to sort beside.');
      const chosen = new Set(ids);
      if (!chosen.size || chosen.has(targetId)) return;
      for (const id of chosen) {
        const n = this.editable(s, id);
        if (!n.url || n.parentId !== target.parentId) throw new Error('Sort bookmarks in the same folder. Drop onto a folder to move them.');
      }
      const original = s.nodes.get(target.parentId).children.map(n => n.id);
      const moving = original.filter(id => chosen.has(id));
      const desired = original.filter(id => !chosen.has(id));
      desired.splice(desired.indexOf(targetId) + (after ? 1 : 0), 0, ...moving);
      if (desired.every((id, i) => id === original[i])) return;
      // Fix the prefix by moving items earlier only; this also preserves folder siblings.
      const current = [...original], steps = [];
      for (let i = 0; i < desired.length; i++) {
        if (current[i] === desired[i]) continue;
        this.editable(s, desired[i]);
        const from = current.indexOf(desired[i]);
        steps.push({ id: desired[i], index: i });
        current.splice(i, 0, current.splice(from, 1)[0]);
      }
      await this.backup('Before sorting bookmarks');
      let applied = 0;
      try {
        for (const step of steps) { await this.api.bookmarks.move(step.id, { parentId: target.parentId, index: step.index }); applied++; }
      } catch (e) { throw new Error(`${applied} sorting steps applied. Backup retained. ${e.message}`); }
    });
  }
  subscribe(listener) {
    const events = ['onCreated','onRemoved','onChanged','onMoved','onChildrenReordered','onImportEnded'].map(k => this.api.bookmarks[k]).filter(Boolean);
    for (const e of events) e.addListener(listener);
    const storageListener = (changes, area) => { if (area === 'local' && (changes[META_KEY] || changes['bookmarks.preferences.v1'])) listener(); };
    this.api.storage.onChanged.addListener(storageListener);
    return () => { for (const e of events) e.removeListener(listener); this.api.storage.onChanged.removeListener(storageListener); };
  }
}

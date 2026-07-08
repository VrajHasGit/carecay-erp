import { apiFetch, buildPath, routeFor } from './shared';

export function getFirestore(app, _dbName) {
  return { __firestore: true, app };
}

function refPath(parent, segments) {
  const base = parent && (parent.__type === 'collection' || parent.__type === 'doc') ? parent.path : '';
  return buildPath([base, ...segments]);
}

export function collection(parent, ...segments) {
  return { __type: 'collection', path: refPath(parent, segments) };
}

export function doc(parent, ...segments) {
  if (segments.length === 0) {
    if (!parent || parent.__type !== 'collection') {
      throw new Error('doc() with no id requires a CollectionReference');
    }
    return { __type: 'doc', path: buildPath([parent.path, crypto.randomUUID()]) };
  }
  return { __type: 'doc', path: refPath(parent, segments) };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

// ── Query constraints (applied client-side after fetching the collection) ──
export function where(field, op, value) {
  return { __type: 'where', field, op, value };
}
export function orderBy(field, direction = 'asc') {
  return { __type: 'orderBy', field, direction };
}
export function limit(n) {
  return { __type: 'limit', n };
}
export function query(collectionRef, ...constraints) {
  return { __type: 'query', path: collectionRef.path, constraints };
}

function applyConstraints(docs, constraints = []) {
  let result = [...docs];
  for (const c of constraints) {
    if (c.__type === 'where') {
      result = result.filter(d => {
        const v = d[c.field];
        switch (c.op) {
          case '==': return v === c.value;
          case '!=': return v !== c.value;
          case '>': return v > c.value;
          case '>=': return v >= c.value;
          case '<': return v < c.value;
          case '<=': return v <= c.value;
          case 'in': return Array.isArray(c.value) && c.value.includes(v);
          case 'array-contains': return Array.isArray(v) && v.includes(c.value);
          default: return true;
        }
      });
    } else if (c.__type === 'orderBy') {
      result.sort((a, b) => {
        const av = a[c.field], bv = b[c.field];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return c.direction === 'desc' ? -cmp : cmp;
      });
    } else if (c.__type === 'limit') {
      result = result.slice(0, c.n);
    }
  }
  return result;
}

function toSnapshotDocs(items) {
  return items.map(item => ({
    id: item.id,
    data: () => {
      const { id, ...rest } = item;
      return rest;
    },
    exists: () => true,
  }));
}

async function fetchCollection(path) {
  const route = routeFor(path);
  return apiFetch(route.url);
}

export async function getDocs(refOrQuery) {
  const isQuery = refOrQuery.__type === 'query';
  const path = refOrQuery.path;
  const items = await fetchCollection(path);
  const filtered = isQuery ? applyConstraints(items, refOrQuery.constraints) : items;
  const docs = toSnapshotDocs(filtered);
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb) => docs.forEach(cb),
  };
}

export async function getDoc(docRef) {
  const route = routeFor(docRef.path);
  const data = await apiFetch(route.url);
  if (!data) {
    return { exists: () => false, id: route.id, data: () => undefined };
  }
  const { id, ...rest } = data;
  return { exists: () => true, id, data: () => rest };
}

export async function addDoc(collectionRef, data) {
  const route = routeFor(collectionRef.path);
  const { id } = await apiFetch(route.url, { method: 'POST', body: JSON.stringify(data) });
  return { __type: 'doc', path: buildPath([collectionRef.path, id]), id };
}

export async function setDoc(docRef, data, options = {}) {
  const route = routeFor(docRef.path);
  const merge = options.merge !== false && options.merge !== undefined ? true : !!options.merge;
  const qs = route.subName ? '' : `?merge=${merge}`;
  await apiFetch(`${route.url}${qs}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function updateDoc(docRef, data) {
  const route = routeFor(docRef.path);
  await apiFetch(route.url, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteDoc(docRef) {
  const route = routeFor(docRef.path);
  await apiFetch(route.url, { method: 'DELETE' });
}

// ── onSnapshot: emulated via polling (this is a local single-machine app) ──
const POLL_INTERVAL_MS = 3000;

export function onSnapshot(refOrQuery, onNext, onError) {
  let stopped = false;
  const isQuery = refOrQuery.__type === 'query';
  const path = refOrQuery.path;

  async function tick() {
    if (stopped) return;
    try {
      const items = await fetchCollection(path);
      const filtered = isQuery ? applyConstraints(items, refOrQuery.constraints) : items;
      onNext({ docs: toSnapshotDocs(filtered) });
    } catch (e) {
      onError && onError(e);
    }
  }

  tick();
  const handle = setInterval(tick, POLL_INTERVAL_MS);
  return () => {
    stopped = true;
    clearInterval(handle);
  };
}

// ── writeBatch: replayed sequentially on commit (local tool, atomicity not critical) ──
export function writeBatch(_db) {
  const ops = [];
  return {
    set(ref, data, options) {
      ops.push(() => setDoc(ref, data, options));
      return this;
    },
    update(ref, data) {
      ops.push(() => updateDoc(ref, data));
      return this;
    },
    delete(ref) {
      ops.push(() => deleteDoc(ref));
      return this;
    },
    async commit() {
      for (const op of ops) await op();
    },
  };
}

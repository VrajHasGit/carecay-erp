export const API_BASE = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:4000';

function authHeaders() {
  const token = localStorage.getItem('cc_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.code = body.error;
    throw err;
  }
  return res.json();
}

export function buildPath(parts) {
  return parts.filter(p => p !== undefined && p !== null && p !== '').join('/');
}

export function segmentsOf(path) {
  return path.split('/').filter(Boolean);
}

// Maps a Firestore-style path to this backend's REST route.
export function routeFor(path) {
  const segs = segmentsOf(path);
  if (segs.length === 1) {
    return { kind: 'collection', url: `/api/col/${segs[0]}`, collection: segs[0] };
  }
  if (segs.length === 2) {
    return { kind: 'doc', url: `/api/col/${segs[0]}/${segs[1]}`, collection: segs[0], id: segs[1] };
  }
  if (segs.length === 3) {
    return {
      kind: 'collection',
      url: `/api/col/${segs[0]}/${segs[1]}/sub/${segs[2]}`,
      collection: segs[0], parentId: segs[1], subName: segs[2],
    };
  }
  if (segs.length === 4) {
    return {
      kind: 'doc',
      url: `/api/col/${segs[0]}/${segs[1]}/sub/${segs[2]}/${segs[3]}`,
      collection: segs[0], parentId: segs[1], subName: segs[2], id: segs[3],
    };
  }
  throw new Error(`Unsupported path depth: ${path}`);
}

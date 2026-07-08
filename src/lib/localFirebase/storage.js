import { apiFetch, API_BASE } from './shared';

export function getStorage(app) {
  return { __storage: true, app };
}

export function ref(_storage, path) {
  return { __type: 'storageRef', path, _resolvedUrl: null };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadBytes(storageRef, file) {
  const parts = storageRef.path.split('/');
  const name = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join('/') || 'documents';
  const dataBase64 = await fileToBase64(file);
  const { url } = await apiFetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ name, folder, dataBase64 }),
  });
  storageRef._resolvedUrl = `${API_BASE}${url}`;
  return { ref: storageRef, metadata: { name } };
}

export async function getDownloadURL(storageRef) {
  if (!storageRef._resolvedUrl) throw new Error('No uploaded file for this storage ref');
  return storageRef._resolvedUrl;
}

import { apiFetch } from './shared';

const listeners = new Set();
let currentUser = null; // { uid, email, displayName }
let initialized = false;

function notify() {
  listeners.forEach(cb => cb(currentUser));
}

async function bootstrap() {
  const token = localStorage.getItem('cc_token');
  const savedUser = localStorage.getItem('cc_authuser');
  if (token && savedUser) {
    try {
      await apiFetch('/api/auth/me');
      currentUser = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_authuser');
      currentUser = null;
    }
  }
  initialized = true;
  notify();
}
const bootstrapPromise = bootstrap();

export function getAuth(_app) {
  return { __auth: true };
}

export function onAuthStateChanged(_auth, callback) {
  listeners.add(callback);
  if (initialized) callback(currentUser);
  else bootstrapPromise.then(() => callback(currentUser));
  return () => listeners.delete(callback);
}

export async function signInWithEmailAndPassword(_auth, email, password) {
  const { token, user } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('cc_token', token);
  localStorage.setItem('cc_authuser', JSON.stringify(user));
  currentUser = user;
  notify();
  return { user };
}

export async function signOut(_auth) {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_authuser');
  currentUser = null;
  notify();
}

export async function sendPasswordResetEmail(_auth, _email) {
  throw new Error('Password reset is not available in local mode. Ask an admin to reset it via User Management.');
}

// Used by UserMgmt.jsx to create a new account without disturbing the admin's own session.
export async function createUserWithEmailAndPassword(_auth, email, password) {
  const user = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return { user };
}

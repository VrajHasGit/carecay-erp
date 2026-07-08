import { db } from '../firebase';
import {
  collection, doc, getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { createNotification } from './notificationService';

// ── Collections ──
export const COL = {
  users: 'users',
  pur_inq: 'pur_inq',
  val: 'val',
  pfu: 'pfu',
  pcl: 'pcl',
  ob: 'ob',
  sal_inq: 'sal_inq',
  sfu: 'sfu',
  scl: 'scl',
  sob: 'sob',
  stk: 'stk',
  ws: 'ws',
  pay: 'pay',
  del: 'del',
  doc: 'doc',
  cust: 'cust',
  dn: 'dn',
  gp: 'gp',
  sp: 'sp',
  td: 'td',
  fin: 'fin',
  exp_rec: 'exp_rec',
  gst_inv: 'gst_inv',
  targets: 'targets',
  feedback: 'feedback',
  tasks: 'tasks',
  settings: 'settings',
  counters: 'counters',
};

// ── Sanitize: strip undefined values so Firebase never crashes ──
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) clean[key] = obj[key];
  });
  return clean;
}

const EXEMPT_KEYS = ['password', 'pw', 'appr_pw', 'email', 'loginId', 'lid', 'image', 'stage', 'status', 'stat', 'pf_stat', 'pStatus', 'dc_stat', 'exec', 'mode', 'seq', 'ws_jstat', 'ws_pstat', 'jStat', 'pStat', 'category', 'expType'];

function capitalizeData(obj) {
  if (typeof obj === 'string') {
    return obj.toUpperCase();
  }
  if (Array.isArray(obj)) {
    return obj.map(item => capitalizeData(item));
  }
  if (obj && typeof obj === 'object') {
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      return obj;
    }
    const clean = {};
    for (const key in obj) {
      if (EXEMPT_KEYS.includes(key) || key.toLowerCase().endsWith('url') || key.toLowerCase().endsWith('id') || key === 'id' || key.toLowerCase().endsWith('date')) {
        clean[key] = obj[key];
      } else {
        clean[key] = capitalizeData(obj[key]);
      }
    }
    return clean;
  }
  return obj;
}

// ── Generic getAll ──
export async function getAll(colName) {
  try {
    const snap = await getDocs(collection(db, colName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(`getAll(${colName}):`, e);
    return [];
  }
}

// ── Generic getById ──
export async function getById(colName, id) {
  try {
    const snap = await getDoc(doc(db, colName, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.error(`getById(${colName}, ${id}):`, e);
    return null;
  }
}

// ── Generic add (with optional notification) ──
export async function addRecord(colName, data, notificationMeta) {
  try {
    const ref = await addDoc(collection(db, colName), {
      ...capitalizeData(sanitize(data)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Fire notification if meta provided
    if (notificationMeta) {
      createNotification({ collection: colName, action: 'created', ...notificationMeta });
    }
    return ref.id;
  } catch (e) {
    console.error(`addRecord(${colName}):`, e);
    throw e;
  }
}

// ── Generic update (with optional notification) ──
export async function updateRecord(colName, id, data, notificationMeta) {
  try {
    await setDoc(doc(db, colName, id), {
      ...capitalizeData(sanitize(data)),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    // Fire notification if meta provided
    if (notificationMeta) {
      createNotification({ collection: colName, action: 'updated', ...notificationMeta });
    }
  } catch (e) {
    console.error(`updateRecord(${colName}, ${id}):`, e);
    throw e;
  }
}

// ── Generic delete ──
export async function deleteRecord(colName, id) {
  try {
    await deleteDoc(doc(db, colName, id));
  } catch (e) {
    console.error(`deleteRecord(${colName}, ${id}):`, e);
    throw e;
  }
}

// ── Counter management ──
export async function getNextCounter(key) {
  try {
    const ref = doc(db, 'counters', 'main');
    const snap = await getDoc(ref);
    let counters = snap.exists() ? snap.data() : {};
    const next = (counters[key] || 0) + 1;
    await setDoc(ref, { ...counters, [key]: next }, { merge: true });
    return next;
  } catch (e) {
    console.error(`getNextCounter(${key}):`, e);
    return Math.floor(Math.random() * 9000) + 1000;
  }
}

// ── Settings ──
export async function getSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    return {};
  }
}

export async function saveSettings(data) {
  try {
    await setDoc(doc(db, 'settings', 'main'), data, { merge: true });
  } catch (e) {
    console.error('saveSettings:', e);
  }
}

// ── Realtime listener ──
export function subscribeCollection(colName, callback) {
  return onSnapshot(collection(db, colName), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

// ── Storage ──
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFileToStorage(file, folder = 'documents') {
  try {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, name: file.name };
  } catch (e) {
    console.error('uploadFileToStorage:', e);
    throw e;
  }
}

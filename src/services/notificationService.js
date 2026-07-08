import { db } from '../firebase';
import {
  collection, addDoc, updateDoc, doc,
  serverTimestamp, query, where, orderBy,
  limit, onSnapshot, getDocs, writeBatch
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════
// ROLE ROUTING MATRIX — defines who sees what
// ═══════════════════════════════════════════════════════════
const ROLE_ROUTES = {
  pur_inq:   ['Admin', 'Partner', 'Manager', 'Closer', 'Executive'],
  val:       ['Admin', 'Partner', 'Manager', 'Valuator', 'Executive'],
  pfu:       ['Admin', 'Partner', 'Manager', 'Closer', 'Executive'],
  pcl:       ['Admin', 'Partner', 'Manager', 'Closer'],
  ob:        ['Admin', 'Partner', 'Manager', 'Closer'],
  pay:       ['Admin', 'Partner', 'Manager'],
  doc:       ['Admin', 'Partner', 'Manager', 'Closer'],
  stk:       ['Admin', 'Partner', 'Manager', 'Workshop', 'Sales'],
  ws:        ['Admin', 'Partner', 'Manager', 'Workshop'],
  exp_rec:   ['Admin', 'Partner', 'Manager'],
  sal_inq:   ['Admin', 'Partner', 'Manager', 'Sales'],
  sfu:       ['Admin', 'Partner', 'Manager', 'Sales'],
  td:        ['Admin', 'Partner', 'Manager', 'Sales'],
  scl:       ['Admin', 'Partner', 'Manager', 'Sales'],
  sob:       ['Admin', 'Partner', 'Manager', 'Sales'],
  fin:       ['Admin', 'Partner', 'Manager', 'Sales'],
  del:       ['Admin', 'Partner', 'Manager', 'Sales'],
  gst_inv:   ['Admin', 'Partner', 'Manager'],
  gp:        ['Admin', 'Partner', 'Manager', 'Sales'],
  dn:        ['Admin', 'Partner', 'Manager', 'Sales'],
  users:     ['Admin', 'Partner'],
  targets:   ['Admin', 'Partner', 'Manager'],
  tasks:     ['Admin', 'Partner', 'Manager'],
  feedback:  ['Admin', 'Partner', 'Manager'],
  targets:   ['Admin', 'Partner', 'Manager', 'Sales'],
  sale_doc:  ['Admin', 'Partner', 'Manager', 'Sales'],
};

// Icon + color presets per collection
const COLLECTION_THEME = {
  pur_inq:  { icon: 'fa-car-side',              color: '#FF6B00' },
  val:      { icon: 'fa-magnifying-glass-dollar', color: '#8B5CF6' },
  pfu:      { icon: 'fa-phone-volume',           color: '#F59E0B' },
  pcl:      { icon: 'fa-handshake',              color: '#10B981' },
  ob:       { icon: 'fa-file-pen',               color: '#3B82F6' },
  pay:      { icon: 'fa-money-bill-wave',        color: '#059669' },
  doc:      { icon: 'fa-file-contract',          color: '#6366F1' },
  stk:      { icon: 'fa-warehouse',              color: '#0891B2' },
  ws:       { icon: 'fa-screwdriver-wrench',     color: '#D97706' },
  exp_rec:  { icon: 'fa-receipt',                color: '#DC2626' },
  sal_inq:  { icon: 'fa-tags',                   color: '#06B6D4' },
  sfu:      { icon: 'fa-comments',               color: '#8B5CF6' },
  td:       { icon: 'fa-road',                   color: '#14B8A6' },
  scl:      { icon: 'fa-trophy',                 color: '#F59E0B' },
  sob:      { icon: 'fa-clipboard-list',         color: '#3B82F6' },
  fin:      { icon: 'fa-landmark',               color: '#7C3AED' },
  del:      { icon: 'fa-truck',                  color: '#059669' },
  gst_inv:  { icon: 'fa-file-invoice',           color: '#EC4899' },
  gp:       { icon: 'fa-door-open',              color: '#0EA5E9' },
  dn:       { icon: 'fa-file-lines',             color: '#64748B' },
  users:    { icon: 'fa-user-shield',            color: '#EF4444' },
  targets:  { icon: 'fa-bullseye',               color: '#F97316' },
  tasks:    { icon: 'fa-list-check',             color: '#22D3EE' },
  feedback: { icon: 'fa-comment-dots',           color: '#A78BFA' },
  cust:     { icon: 'fa-users',                  color: '#2DD4BF' },
};

// Human-readable collection names
const COLLECTION_LABELS = {
  pur_inq: 'Purchase Inquiry',
  val: 'Valuation',
  pfu: 'Purchase Follow-Up',
  pcl: 'Purchase Closer',
  ob: 'Order Booking',
  pay: 'Payment',
  doc: 'Purchase Documents',
  stk: 'Car Stock',
  ws: 'Workshop',
  exp_rec: 'Expense',
  sal_inq: 'Sales Inquiry',
  sfu: 'Sales Follow-Up',
  td: 'Test Drive',
  scl: 'Sales Closer',
  sob: 'Sales Order Booking',
  fin: 'Finance',
  del: 'Delivery',
  gst_inv: 'GST Invoice',
  gp: 'Gate Pass',
  dn: 'Delivery Note',
  users: 'User Management',
  targets: 'Target',
  tasks: 'Task',
  feedback: 'Feedback',
  cust: 'Customer',
  sale_doc: 'Sale Documents',
};

// Route paths for navigation
const COLLECTION_LINKS = {
  pur_inq: '/purchase-inquiry',
  val: '/valuation',
  pfu: '/purchase-follow',
  pcl: '/purchase-closer',
  ob: '/purchase-booking',
  pay: '/payment',
  doc: '/purchase-documents',
  stk: '/stock',
  ws: '/workshop',
  exp_rec: '/expenses',
  sal_inq: '/sales-inquiry',
  sfu: '/sales-follow',
  td: '/test-drive',
  scl: '/sales-closer',
  sob: '/sales-booking',
  fin: '/finance',
  del: '/delivery',
  gst_inv: '/gst-invoice',
  gp: '/gate-pass',
  dn: '/delivery-note',
  users: '/user-mgmt',
  targets: '/targets',
  tasks: '/tasks',
  cust: '/customers',
};

// ═══════════════════════════════════════════════════════════
// CREATE NOTIFICATION
// ═══════════════════════════════════════════════════════════
export async function createNotification(meta) {
  if (!meta || !meta.collection) return;

  try {
    const theme = COLLECTION_THEME[meta.collection] || { icon: 'fa-bell', color: '#6366F1' };
    const targetRoles = ROLE_ROUTES[meta.collection] || ['Admin'];

    const notifDoc = {
      type: meta.collection,
      action: meta.action || 'created',
      title: meta.title || `${COLLECTION_LABELS[meta.collection] || meta.collection} ${meta.action || 'Updated'}`,
      message: meta.message || '',
      icon: meta.icon || theme.icon,
      color: meta.color || theme.color,
      link: meta.link || COLLECTION_LINKS[meta.collection] || '/',
      targetRoles,
      actor: meta.actor || { id: 'system', name: 'System', role: 'System' },
      carInfo: meta.carInfo || null,
      read: {},  // userId → true map, starts empty = unread for all
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'notifications'), notifDoc);
  } catch (e) {
    // Silently fail — notifications should never block the main operation
    console.warn('createNotification failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// MARK NOTIFICATION AS READ
// ═══════════════════════════════════════════════════════════
export async function markNotificationRead(notifId, userId) {
  if (!notifId || !userId) return;
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      [`read.${userId}`]: true,
    });
  } catch (e) {
    console.warn('markNotificationRead failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// MARK ALL AS READ
// ═══════════════════════════════════════════════════════════
export async function markAllNotificationsRead(notifIds, userId) {
  if (!notifIds?.length || !userId) return;
  try {
    const batch = writeBatch(db);
    notifIds.forEach(id => {
      batch.update(doc(db, 'notifications', id), {
        [`read.${userId}`]: true,
      });
    });
    await batch.commit();
  } catch (e) {
    console.warn('markAllNotificationsRead failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// CLEAR NOTIFICATION (Per User)
// ═══════════════════════════════════════════════════════════
export async function clearNotification(notifId, userId) {
  if (!notifId || !userId) return;
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      [`cleared.${userId}`]: true,
    });
  } catch (e) {
    console.warn('clearNotification failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// CLEAR ALL NOTIFICATIONS (Per User)
// ═══════════════════════════════════════════════════════════
export async function clearAllNotifications(notifIds, userId) {
  if (!notifIds?.length || !userId) return;
  try {
    const batch = writeBatch(db);
    notifIds.forEach(id => {
      batch.update(doc(db, 'notifications', id), {
        [`cleared.${userId}`]: true,
      });
    });
    await batch.commit();
  } catch (e) {
    console.warn('clearAllNotifications failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIBE TO NOTIFICATIONS (real-time)
// ═══════════════════════════════════════════════════════════
export function subscribeNotifications(callback) {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(150)
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notifs);
  }, (err) => {
    console.warn('subscribeNotifications error:', err.message);
  });
}

// ═══════════════════════════════════════════════════════════
// CATEGORY HELPERS (for tab filtering in the UI)
// ═══════════════════════════════════════════════════════════
export const NOTIF_CATEGORIES = {
  purchase: ['pur_inq', 'val', 'pfu', 'pcl', 'ob', 'pay', 'doc'],
  sales:    ['sal_inq', 'sfu', 'td', 'scl', 'sob', 'fin', 'del', 'gst_inv', 'gp', 'dn', 'sale_doc'],
  workshop: ['ws', 'stk', 'exp_rec'],
  admin:    ['users', 'targets', 'tasks', 'feedback', 'cust'],
};

export function getNotifCategory(type) {
  for (const [cat, cols] of Object.entries(NOTIF_CATEGORIES)) {
    if (cols.includes(type)) return cat;
  }
  return 'other';
}

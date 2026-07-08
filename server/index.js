import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'carecay-local-dev-secret-change-me';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

const newId = () => crypto.randomUUID();

// ────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'auth/invalid-email' });
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'auth/user-not-found' });
  const ok = await bcrypt.compare(password, user.pw_hash);
  if (!ok) return res.status(401).json({ error: 'auth/wrong-password' });
  const token = jwt.sign({ uid: user.uid, email: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { uid: user.uid, email: user.username } });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'auth/invalid-email' });
  const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [email]);
  if (existing[0]) return res.status(409).json({ error: 'auth/email-already-in-use' });
  const pw_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, pw_hash, role) VALUES (?, ?, ?)',
    [email, pw_hash, role || 'Sales']
  );
  const uid = `u_${result.insertId}`;
  await pool.query('UPDATE users SET uid = ? WHERE id = ?', [uid, result.insertId]);
  res.json({ uid, email });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'auth/no-token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'auth/invalid-token' });
  }
}

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ────────────────────────────────────────────────────────────
// GENERIC RECORDS (collections)
// ────────────────────────────────────────────────────────────
app.get('/api/col/:collection', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT rec_id, data FROM records WHERE collection = ?',
    [req.params.collection]
  );
  res.json(rows.map(r => ({ id: r.rec_id, ...r.data })));
});

app.get('/api/col/:collection/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT rec_id, data FROM records WHERE collection = ? AND rec_id = ?',
    [req.params.collection, req.params.id]
  );
  if (!rows[0]) return res.json(null);
  res.json({ id: rows[0].rec_id, ...rows[0].data });
});

app.post('/api/col/:collection', async (req, res) => {
  const id = req.body.id || newId();
  const data = { ...req.body };
  delete data.id;
  await pool.query(
    `INSERT INTO records (pk, collection, rec_id, data) VALUES (NULL, ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = CAST(? AS JSON), updated_at = NOW()`,
    [req.params.collection, id, JSON.stringify(data), JSON.stringify(data)]
  );
  res.json({ id });
});

// setDoc (merge true/false) — full or shallow-merged upsert
app.put('/api/col/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const merge = req.query.merge !== 'false';
  const incoming = { ...req.body };
  delete incoming.id;

  if (merge) {
    const [rows] = await pool.query(
      'SELECT data FROM records WHERE collection = ? AND rec_id = ?',
      [collection, id]
    );
    const existing = rows[0]?.data || {};
    const merged = { ...existing, ...incoming };
    await pool.query(
      `INSERT INTO records (pk, collection, rec_id, data) VALUES (NULL, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE data = CAST(? AS JSON), updated_at = NOW()`,
      [collection, id, JSON.stringify(merged), JSON.stringify(merged)]
    );
  } else {
    await pool.query(
      `INSERT INTO records (pk, collection, rec_id, data) VALUES (NULL, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE data = CAST(? AS JSON), updated_at = NOW()`,
      [collection, id, JSON.stringify(incoming), JSON.stringify(incoming)]
    );
  }
  res.json({ id });
});

// updateDoc — supports dot-path partial keys, e.g. { "read.user123": true }
app.patch('/api/col/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const entries = Object.entries(req.body);
  if (!entries.length) return res.json({ id });

  const setClauses = [];
  const params = [];
  for (const [key, value] of entries) {
    const jsonPath = '$.' + key.split('.').join('.');
    setClauses.push(`'${jsonPath}', CAST(? AS JSON)`);
    params.push(JSON.stringify(value));
  }
  params.push(collection, id);

  await pool.query(
    `UPDATE records SET data = JSON_SET(data, ${setClauses.join(', ')}), updated_at = NOW()
     WHERE collection = ? AND rec_id = ?`,
    params
  );
  res.json({ id });
});

app.delete('/api/col/:collection/:id', async (req, res) => {
  await pool.query('DELETE FROM records WHERE collection = ? AND rec_id = ?', [req.params.collection, req.params.id]);
  res.json({ ok: true });
});

// ────────────────────────────────────────────────────────────
// SUBCOLLECTIONS (media)
// ────────────────────────────────────────────────────────────
app.get('/api/col/:collection/:parentId/sub/:subName', async (req, res) => {
  const { collection, parentId, subName } = req.params;
  const [rows] = await pool.query(
    'SELECT id, data FROM media WHERE parent_collection = ? AND parent_id = ? AND sub_collection = ?',
    [collection, parentId, subName]
  );
  res.json(rows.map(r => ({ id: r.id, ...r.data })));
});

app.post('/api/col/:collection/:parentId/sub/:subName', async (req, res) => {
  const { collection, parentId, subName } = req.params;
  const id = req.body.id || newId();
  const data = { ...req.body };
  delete data.id;
  await pool.query(
    `INSERT INTO media (id, parent_collection, parent_id, sub_collection, data) VALUES (?, ?, ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = CAST(? AS JSON)`,
    [id, collection, parentId, subName, JSON.stringify(data), JSON.stringify(data)]
  );
  res.json({ id });
});

app.put('/api/col/:collection/:parentId/sub/:subName/:subId', async (req, res) => {
  const { collection, parentId, subName, subId } = req.params;
  const data = { ...req.body };
  delete data.id;
  await pool.query(
    `INSERT INTO media (id, parent_collection, parent_id, sub_collection, data) VALUES (?, ?, ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = CAST(? AS JSON)`,
    [subId, collection, parentId, subName, JSON.stringify(data), JSON.stringify(data)]
  );
  res.json({ id: subId });
});

app.get('/api/col/:collection/:parentId/sub/:subName/:subId', async (req, res) => {
  const { collection, parentId, subName, subId } = req.params;
  const [rows] = await pool.query(
    'SELECT id, data FROM media WHERE parent_collection = ? AND parent_id = ? AND sub_collection = ? AND id = ?',
    [collection, parentId, subName, subId]
  );
  if (!rows[0]) return res.json(null);
  res.json({ id: rows[0].id, ...rows[0].data });
});

app.delete('/api/col/:collection/:parentId/sub/:subName/:subId', async (req, res) => {
  const { collection, parentId, subName, subId } = req.params;
  await pool.query(
    'DELETE FROM media WHERE parent_collection = ? AND parent_id = ? AND sub_collection = ? AND id = ?',
    [collection, parentId, subName, subId]
  );
  res.json({ ok: true });
});

app.delete('/api/col/:collection/:parentId/sub/:subName', async (req, res) => {
  const { collection, parentId, subName } = req.params;
  await pool.query(
    'DELETE FROM media WHERE parent_collection = ? AND parent_id = ? AND sub_collection = ?',
    [collection, parentId, subName]
  );
  res.json({ ok: true });
});

// ────────────────────────────────────────────────────────────
// COUNTERS
// ────────────────────────────────────────────────────────────
app.post('/api/counters/:key/next', async (req, res) => {
  const { key } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('INSERT IGNORE INTO counters (name, value) VALUES (?, 0)', [key]);
    await conn.query('UPDATE counters SET value = value + 1 WHERE name = ?', [key]);
    const [rows] = await conn.query('SELECT value FROM counters WHERE name = ?', [key]);
    await conn.commit();
    res.json({ value: rows[0].value });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// ────────────────────────────────────────────────────────────
// FILE UPLOAD (local disk, replaces Firebase Storage)
// ────────────────────────────────────────────────────────────
app.post('/api/upload', async (req, res) => {
  const { name, folder, dataBase64 } = req.body;
  const safeFolder = (folder || 'documents').replace(/[^a-zA-Z0-9_-]/g, '');
  const dir = path.join(UPLOAD_DIR, safeFolder);
  fs.mkdirSync(dir, { recursive: true });
  const ext = (name || 'file').split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(dir, fileName), Buffer.from(dataBase64, 'base64'));
  res.json({ url: `/uploads/${safeFolder}/${fileName}`, name });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Carecay local API listening on http://localhost:${PORT}`));

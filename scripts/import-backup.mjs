/**
 * Imports a Carecay Excel backup into Firestore.
 *
 *   node scripts/import-backup.mjs <backup.xlsx>            # dry run
 *   node scripts/import-backup.mjs <backup.xlsx> --commit   # writes
 *
 * Signs in with CARECAY_EMAIL / CARECAY_PASSWORD so the security rules apply
 * to the import exactly as they do to the app — no service account key needed.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, writeBatch, setDoc, getDoc } from 'firebase/firestore';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// sheet -> { counter key used by getNextCounter, column holding the human ID }
const SHEETS = {
  pur_inq: { counter: 'pur', idField: 'inqId' },
  val:     { counter: 'val', idField: 'valId' },
  pfu:     { counter: 'pfu', idField: 'pfuId' },
  pcl:     { counter: 'pcl', idField: 'pclId' },
  ob:      { counter: 'ob',  idField: 'obId' },
  sfu:     { counter: 'sfu', idField: 'sfuId' },
  stk:     { counter: 'stk', idField: 'stkId' },
  pay:     { counter: 'pay', idField: 'payId' },
  doc:     { counter: 'doc', idField: 'docId' },
};

function readEnvLocal() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) throw new Error('.env.local not found — run this from the project root.');
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

// Excel gives every blank cell as null; the app reads missing and null alike.
function clean(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k !== 'field_id' && v !== null && v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

function trailingNumber(value) {
  const m = String(value ?? '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const xlsxPath = args.find(a => !a.startsWith('--'));
if (!xlsxPath) {
  console.error('Usage: node scripts/import-backup.mjs <backup.xlsx> [--commit]');
  process.exit(1);
}

const email = process.env.CARECAY_EMAIL;
const password = process.env.CARECAY_PASSWORD;
if (commit && (!email || !password)) {
  console.error('Set CARECAY_EMAIL and CARECAY_PASSWORD before using --commit.');
  process.exit(1);
}

const wb = XLSX.readFile(xlsxPath);
const plan = [];
const counters = {};

for (const [sheet, meta] of Object.entries(SHEETS)) {
  if (!wb.Sheets[sheet]) continue;
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
  let highest = 0;
  for (const row of rows) {
    const id = row.field_id || row[meta.idField];
    if (!id) {
      console.warn(`  ! ${sheet}: skipping a row with no field_id or ${meta.idField}`);
      continue;
    }
    plan.push({ collection: sheet, id: String(id), data: clean(row) });
    highest = Math.max(highest, trailingNumber(row[meta.idField]));
  }
  if (highest > 0) counters[meta.counter] = highest;
}

console.log(`\n${commit ? 'IMPORTING' : 'DRY RUN — nothing will be written'}\n`);
for (const sheet of Object.keys(SHEETS)) {
  const n = plan.filter(p => p.collection === sheet).length;
  if (n) console.log(`  ${sheet.padEnd(10)} ${String(n).padStart(3)} documents`);
}
console.log(`\n  counters/main -> ${JSON.stringify(counters)}`);
console.log(`\n  ${plan.length} documents total`);

if (!commit) {
  console.log('\nRe-run with --commit to write these to Firestore.\n');
  process.exit(0);
}

const env = readEnvLocal();
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

console.log(`\nSigning in as ${email} ...`);
await signInWithEmailAndPassword(getAuth(app), email, password);
console.log('Signed in.\n');

for (let i = 0; i < plan.length; i += 400) {
  const chunk = plan.slice(i, i + 400);
  const batch = writeBatch(db);
  for (const { collection, id, data } of chunk) batch.set(doc(db, collection, id), data);
  await batch.commit();
  console.log(`  wrote ${i + chunk.length}/${plan.length}`);
}

// Merge so a counter already ahead of the backup is never rewound.
const ref = doc(db, 'counters', 'main');
const existing = (await getDoc(ref)).data() || {};
const merged = { ...existing };
for (const [key, value] of Object.entries(counters)) {
  merged[key] = Math.max(existing[key] || 0, value);
}
await setDoc(ref, merged, { merge: true });
console.log(`\n  counters/main updated`);

console.log('\nDone.\n');
process.exit(0);

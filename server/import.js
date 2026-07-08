import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const BACKUP_FILE = process.argv[2] || 'C:/Users/vraj1/Downloads/carecay_full_backup_2026-06-26 (3).xlsx';

// sheet name -> { counterKey, idField }
const COLLECTION_META = {
  pur_inq: { counterKey: 'pur', idField: 'inqId' },
  val:     { counterKey: 'val', idField: 'valId' },
  pfu:     { counterKey: 'pfu', idField: 'pfuId' },
  pcl:     { counterKey: 'pcl', idField: 'pclId' },
  ob:      { counterKey: 'ob',  idField: 'obId' },
  sfu:     { counterKey: 'sfu', idField: 'sfuId' },
  stk:     { counterKey: 'stk', idField: 'stkId' },
  pay:     { counterKey: 'pay', idField: 'payId' },
  doc:     { counterKey: 'doc', idField: 'docId' },
};

function maxSuffix(value) {
  if (!value) return 0;
  const m = String(value).match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function upsertRecord(collection, recId, data) {
  await pool.query(
    `INSERT INTO records (pk, collection, rec_id, data) VALUES (NULL, ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = CAST(? AS JSON), updated_at = NOW()`,
    [collection, recId, JSON.stringify(data), JSON.stringify(data)]
  );
}

async function bumpCounter(key, value) {
  await pool.query(
    `INSERT INTO counters (name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = GREATEST(value, VALUES(value))`,
    [key, value]
  );
}

async function main() {
  const wb = XLSX.readFile(BACKUP_FILE);
  console.log(`Reading ${BACKUP_FILE}`);
  console.log('Sheets:', wb.SheetNames.join(', '));

  const report = {};

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });
    if (sheetName === 'users') {
      for (const row of rows) {
        const uid = row.field_id;
        const email = row.email;
        const plainPassword = row.password || 'changeme123';
        const pw_hash = await bcrypt.hash(plainPassword, 10);
        await pool.query(
          `INSERT INTO users (username, pw_hash, role, uid) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE pw_hash = VALUES(pw_hash), role = VALUES(role)`,
          [email, pw_hash, row.role || 'Sales', uid]
        );
        const { field_id, password, ...profile } = row;
        await upsertRecord('users', uid, profile);
        await bumpCounter('USR', maxSuffix(row.userId));
      }
      report.users = rows.length;
      continue;
    }

    const meta = COLLECTION_META[sheetName];
    if (!meta) {
      console.log(`Skipping unmapped sheet: ${sheetName}`);
      continue;
    }
    let maxNum = 0;
    for (const row of rows) {
      const recId = row.field_id || row[meta.idField] || crypto.randomUUID();
      const { field_id, ...data } = row;
      await upsertRecord(sheetName, recId, data);
      maxNum = Math.max(maxNum, maxSuffix(row[meta.idField]));
    }
    if (maxNum > 0) await bumpCounter(meta.counterKey, maxNum);
    report[sheetName] = rows.length;
  }

  console.log('\nImport complete:');
  console.table(report);

  const [counterRows] = await pool.query('SELECT * FROM counters ORDER BY name');
  console.log('\nCounters now:');
  console.table(counterRows);

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

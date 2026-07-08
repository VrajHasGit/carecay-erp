import { db } from '../firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

// ── NOTE: User seeding removed ──
// Firebase Auth accounts cannot be batch-created from the client SDK.
// Users must be created via:
//   1. The "Add User" flow in User Management (creates both Firebase Auth + Firestore profile)
//   2. Firebase Console → Authentication → Add User
//
// After creating a user in Firebase Auth, add their Firestore profile:
//   Collection: users/{uid}
//   Fields: { name, lid, email, role, branch, mobile, status: 'Active' }

const SETTINGS = {
  compName: 'Carecay Private Limited',
  compShort: 'CARECAY',
  tagline: 'Carecay Pvt. Ltd.',
  gst: '24AAACC1234F1Z5',
  address: 'SG Highway, Ahmedabad, Gujarat - 380051',
  phone: '+91 9876543210',
  email: 'info@carecay.in',
  branches: ['SG Highway', 'Vastral', 'Head Office'],
  theme: 'black-darkblue',
  font: 'Inter',
};

/**
 * Seed Firestore with settings and counters only.
 * User accounts must be created through Firebase Auth.
 */
export async function seedFirestore() {
  try {
    const batch = writeBatch(db);

    // Seed settings
    batch.set(doc(db, 'settings', 'main'), SETTINGS);

    // Seed counters
    batch.set(doc(db, 'counters', 'main'), {
      pur: 0, val: 0, pfu: 0, pcl: 0, ob: 0,
      sal: 0, sfu: 0, scl: 0, sob: 0, stk: 0,
      ws: 0, pay: 0, del: 0, doc: 0, cust: 0,
      dn: 0, gp: 0, sp: 0, td: 0, usr: 0,
      fin: 0, exp_rec: 0, gst_inv: 0, tgt: 0,
    });

    await batch.commit();
    console.log('✅ Firestore settings & counters seeded successfully');
    return { success: true };
  } catch (e) {
    console.error('Seed error:', e);
    return { success: false, error: e.message };
  }
}

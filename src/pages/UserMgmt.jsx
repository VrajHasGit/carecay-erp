import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth, toEmail } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate } from '../utils/helpers';
import { UserModal } from '../components/modals/UserModal';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

const roleClass = (role) => {
  const map = {
    Admin: 'role-admin', Partner: 'role-partner', Manager: 'role-manager',
    Closer: 'role-closer', Executive: 'role-executive', Sales: 'role-sales',
    Valuator: 'role-valuator', Workshop: 'role-workshop',
  };
  return map[role] || 'role-sales';
};

const MODULES = [
  'Purchase Inquiry', 'Valuation', 'Follow-Up', 'Purchase Closer', 'Order Booking',
  'Stock', 'Workshop', 'Sales Inquiry', 'Sales Closer', 'Sales OB',
  'Payment', 'Delivery', 'Documents', 'Reports', 'Settings',
];

const PERMS = {
  Admin:    MODULES,
  Partner:  MODULES,
  Manager:  MODULES.filter(m => m !== 'Settings'),
  Closer:   ['Purchase Inquiry', 'Purchase Closer', 'Stock', 'Workshop', 'Payment', 'Purchase Documents'],
  Executive:['Purchase Inquiry', 'Valuation', 'Follow-Up', 'Stock', 'Payment', 'Purchase Documents'],
  Sales:    ['Sales Inquiry', 'Follow-Up', 'Sales Closer', 'Sales OB', 'Delivery', 'Sale Documents'],
  Valuator: ['Purchase Inquiry', 'Valuation', 'Stock'],
  Workshop: ['Workshop', 'Stock'],
};

/**
 * Create a Firebase Auth account using a secondary app instance
 * so the current admin user doesn't get logged out.
 */
async function createAuthUser(email, password) {
  // Use the same Firebase config from env
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };
  const secondaryApp = initializeApp(config, 'SecondaryApp');
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return { success: true, uid: credential.user.uid };
  } catch (e) {
    console.error('createAuthUser error:', e);
    const errorMap = {
      'auth/email-already-in-use': 'An account with this Login ID already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Invalid email format.',
    };
    return { success: false, error: errorMap[e.code] || e.message };
  } finally {
    await deleteApp(secondaryApp);
  }
}

const UserMgmt = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.users || [];
  const filtered = useMemo(() => records.filter(r =>
    !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  ), [records, search]);

  const counts = useMemo(() => ({
    admin: records.filter(u => u.role === 'Admin' || u.role === 'Partner').length,
    mgr: records.filter(u => u.role === 'Manager').length,
    sales: records.filter(u => u.role === 'Closer' || u.role === 'Executive' || u.role === 'Sales').length,
    val: records.filter(u => u.role === 'Valuator').length,
    ws: records.filter(u => u.role === 'Workshop').length,
  }), [records]);

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };

      if (editRec) {
        // ── Update existing user (Firestore profile only) ──
        await updateRecord('users', editRec.id, fd, {
          title: 'User Updated',
          message: (fd.name || '') + ' — ' + (fd.role || ''),
          link: '/user-mgmt',
          actor,
        });
        showToast('User updated!');
      } else {
        // ── Create new user: Firebase Auth + Firestore profile ──
        const email = toEmail(fd.lid);
        const password = fd.password || fd.pw || 'carecay123'; // default password

        if (!fd.lid || !fd.lid.trim()) {
          showToast('Login ID is required.', 'error');
          return;
        }

        if (password.length < 6) {
          showToast('Password must be at least 6 characters.', 'error');
          return;
        }

        // Create Firebase Auth account
        const authResult = await createAuthUser(email, password);
        if (!authResult.success) {
          showToast(authResult.error || 'Failed to create auth account.', 'error');
          return;
        }

        // Generate a clean USR-YYYY-XXXX userId
        const cnt = await getNextCounter('USR');
        const userId = genId('USR', cnt);

        // Save Firestore profile keyed by Firebase Auth UID
        const profileData = {
          name: fd.name || '',
          lid: fd.lid || '',
          email: email,
          userId: userId,
          pw: password, // Saving for Admin visibility since emails are often fake
          role: fd.role || 'Sales',
          branch: fd.branch || 'Head Office',
          mobile: fd.mobile || '',
          status: fd.status || 'Active',
          date: fd.date || today(),
          uid: authResult.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Use UID as the document ID for easy lookup
        await setDoc(doc(db, 'users', authResult.uid), profileData);

        showToast('User added: ' + fd.name);
      }
      await refresh('users');
      setIsModalOpen(false);
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm(`Deactivate user "${rec.name}"? They will no longer be able to login.`)) return;
    try {
      // Soft-delete: set status to Inactive (can't delete Firebase Auth accounts from client SDK)
      await updateRecord('users', rec.id, { status: 'Inactive' });
      await refresh('users');
      showToast('User deactivated.', 'info');
    } catch (e) {
      showToast('Failed to deactivate.', 'error');
    }
  };

  const canAccess = (role, mod) => PERMS[role] && PERMS[role].includes(mod);

  return (
    <div className="page on" id="pg_usermgmt">
      {toast && (
        <div className="toast-wrap">
          <div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}>
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
              <i className="fa fa-shield-halved"></i>
            </div>
            User Management
          </h1>
          <p>Role-based access control — Admin · Manager · Sales · Valuator · Workshop</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editData={editRec}
          initialMode={modalMode}
        />
      )}

      {/* Firebase Auth Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(124,58,237,0.08))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 12,
        color: 'var(--text2)',
      }}>
        <i className="fa fa-shield-check" style={{ color: '#6366F1', fontSize: 16 }}></i>
        <div>
          <b style={{ color: 'var(--text)' }}>Firebase Authentication Enabled</b>
          <span style={{ opacity: 0.7, marginLeft: 8 }}>
            — Users login via Firebase Auth. Roles & permissions managed in Firestore.
          </span>
        </div>
      </div>

      {/* Role Count KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { lbl: 'Admins', val: counts.admin, color: '#7C3AED', icon: 'fa-star' },
          { lbl: 'Managers', val: counts.mgr, color: '#2563EB', icon: 'fa-briefcase' },
          { lbl: 'Sales', val: counts.sales, color: '#059669', icon: 'fa-user-tie' },
          { lbl: 'Valuators', val: counts.val, color: '#E85D04', icon: 'fa-magnifying-glass' },
          { lbl: 'Workshop', val: counts.ws, color: '#15803D', icon: 'fa-wrench' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="tc" style={{ marginBottom: 16 }}>
        <div className="tc-hdr">
          <div className="tc-title">
            Users
            <span style={{ background: 'var(--bl5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>
              {records.length}
            </span>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User ID</th><th>Name</th><th>Role</th><th>Login ID</th><th>Email</th><th>Branch</th><th>Mobile</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <b style={{ color: 'var(--bl5)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>
                      {r.userId || r.id?.slice(0, 12)}
                    </b>
                  </td>
                  <td><b>{r.name}</b></td>
                  <td><span className={`role-pill ${roleClass(r.role)}`}>{r.role}</span></td>
                  <td>
                    <code style={{ fontSize: 11, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--text2)' }}>
                      {r.lid || '—'}
                    </code>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {r.email || (r.lid ? `${r.lid}@carecay.in` : '—')}
                    </span>
                  </td>
                  <td>{r.branch || '—'}</td>
                  <td>{r.mobile || '—'}</td>
                  <td>
                    <span className={`badge ${r.status === 'Active' ? 'b-won' : 'b-lost'}`}>
                      {r.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="act-grp">
                      <button className="btn-icon bi-view" title="View Details" onClick={() => { setEditRec(r); setModalMode('view'); setIsModalOpen(true); }}>
                        <i className="fa fa-eye"></i>
                      </button>
                      <button className="btn-icon bi-del" title={r.status === 'Active' ? 'Deactivate' : 'Already Inactive'} onClick={() => handleDelete(r)} disabled={r.status !== 'Active'}>
                        <i className="fa fa-user-slash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="empty">
                    <i className="fa fa-user-shield"></i><br />No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            <i className="fa fa-key" style={{ color: 'var(--or1)', marginRight: 6 }}></i>
            Role Permissions Matrix
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {['Admin', 'Partner', 'Manager', 'Sales', 'Valuator', 'Workshop'].map(role => (
                  <th key={role}><span className={`role-pill ${roleClass(role)}`}>{role}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod}>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{mod}</td>
                  {['Admin', 'Partner', 'Manager', 'Sales', 'Valuator', 'Workshop'].map(role => (
                    <td key={role} style={{ textAlign: 'center' }}>
                      {canAccess(role, mod)
                        ? <i className="fa fa-check" style={{ color: 'var(--success)' }}></i>
                        : <i className="fa fa-times" style={{ color: 'var(--border2)' }}></i>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserMgmt;

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate } from '../utils/helpers';
import { CustModal } from '../components/modals/CustModal';

const Customers = () => {
  const { data, refresh } = useData();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.cust || [];

  // Compute transaction count per customer from other collections
  const custTxns = useMemo(() => {
    const purInq = data.pur_inq || [];
    const salInq = data.sal_inq || [];
    const map = {};
    [...purInq, ...salInq].forEach(r => {
      const name = r.buyerName || r.sellerName || r.name;
      if (name) map[name] = (map[name] || 0) + 1;
    });
    return map;
  }, [data]);

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || (r.name || '').toLowerCase().includes(q)
      || (r.mobile || '').includes(q)
      || (r.email || '').toLowerCase().includes(q)
      || (r.city || '').toLowerCase().includes(q)
      || (r.custId || '').toLowerCase().includes(q);
    const matchType = !typeFilter || r.type === typeFilter;
    return matchSearch && matchType;
  }), [records, search, typeFilter]);

  const handleSave = async (fd) => {
    try {
      if (editRec) { await updateRecord('cust', editRec.id, fd); showToast('Customer updated!'); }
      else {
        const cnt = await getNextCounter('CUST');
        await addRecord('cust', { ...fd, custId: genId('CUST', cnt), date: fd.date || today() });
        showToast('Customer added!');
      }
      await refresh('cust'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm(`Delete customer "${rec.name}"?`)) return;
    try { await deleteRecord('cust', rec.id); await refresh('cust'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleWhatsApp = (r) => {
    const msg = encodeURIComponent(`Hello ${r.name}, thank you for choosing Carecay! — Carecay Pvt. Ltd.`);
    window.open(`https://wa.me/91${r.mobile}?text=${msg}`, '_blank');
  };

  const buyers = records.filter(r => r.type === 'Buyer').length;
  const sellers = records.filter(r => r.type === 'Seller').length;

  return (
    <div className="page on" id="pg_customers">
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
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
              <i className="fa fa-users"></i>
            </div>
            Customers
          </h1>
          <p>Customer database and CRM — Buyers · Sellers · Contact History</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search name / mobile / city…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="flt" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Buyer">Buyer</option>
            <option value="Seller">Seller</option>
          </select>
        </div>
      </div>

      {isModalOpen && (
        <CustModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editData={editRec}
        />
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { icon: 'fa-users', val: records.length, lbl: 'Total Customers', color: '#059669' },
          { icon: 'fa-user-check', val: buyers, lbl: 'Buyers', color: '#1A56DB' },
          { icon: 'fa-user-tag', val: sellers, lbl: 'Sellers', color: '#E85D04' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Customers Table */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            Customers
            <span style={{ background: 'var(--success)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>
              {records.length}
            </span>
          </div>
          <div className="tc-acts">
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              Showing {filtered.length} of {records.length}
            </span>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Cust ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Alt Mobile</th>
                <th>Email</th>
                <th>City</th>
                <th>State</th>
                <th>Txns</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const txns = custTxns[r.name] || 0;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--success)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>
                      {r.custId || r.id?.slice(0, 12)}
                    </td>
                    <td>
                      <span className={`badge ${r.type === 'Buyer' ? 'b-new' : 'b-prog'}`}>{r.type || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.name || '—'}</td>
                    <td>
                      {r.mobile ? (
                        <a href={`tel:${r.mobile}`} style={{ color: 'var(--info)', textDecoration: 'none' }}>{r.mobile}</a>
                      ) : '—'}
                    </td>
                    <td style={{ color: 'var(--text3)' }}>{r.altMobile || '—'}</td>
                    <td style={{ color: 'var(--text3)' }}>{r.email || '—'}</td>
                    <td>{r.city || '—'}</td>
                    <td>{r.state || '—'}</td>
                    <td>
                      {txns > 0 ? (
                        <span style={{ background: 'var(--or5)', color: 'var(--or1)', fontWeight: 700, padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>
                          {txns}
                        </span>
                      ) : <span style={{ color: 'var(--text3)' }}>0</span>}
                    </td>
                    <td>
                      <div className="act-grp">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}>
                          <i className="fa fa-pen"></i>
                        </button>
                        {r.mobile && (
                          <button className="btn-icon" title="WhatsApp" onClick={() => handleWhatsApp(r)}
                            style={{ background: '#25D366', color: '#fff' }}>
                            <i className="fa-brands fa-whatsapp"></i>
                          </button>
                        )}
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}>
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="10" className="empty">
                    <i className="fa fa-users"></i><br />
                    {search || typeFilter ? 'No customers match your search.' : 'No customers yet. Click "Add Customer" to begin.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { SobModal } from '../components/modals/SobModal';

const SalesBooking = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.sob || [];

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (r.sob_cname || r.buyerName || '').toLowerCase().includes(q) ||
      (r.sob_regn || r.regNo || '').toLowerCase().includes(q) ||
      (r.sob_stkid || '').toLowerCase().includes(q) ||
      (r.sobId || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (r.status || 'Pending') === statusFilter;
    return matchSearch && matchStatus;
  }), [records, search, statusFilter]);

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('sob', editRec.id, fd, { title: 'Sales Booking Updated', message: (fd.sob_bname || fd.buyerName || '') + ' — ' + (fd.sob_regn || fd.regNo || ''), link: '/sales-booking', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('sob'); await addRecord('sob', { ...fd, sobId: genId('SOB', cnt), date: fd.sob_date || today(), status: 'Pending' }, { title: 'Sales Booking', message: (fd.sob_bname || fd.buyerName || '') + ' — ' + (fd.sob_regn || fd.regNo || ''), link: '/sales-booking', actor }); showToast('Sales booking added!'); }
      await refresh('sob'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete this booking?')) return;
    try { await deleteRecord('sob', rec.id); await refresh('sob'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleMarkDelivered = async (rec) => {
    if (!await window.confirm(`Mark ${rec.sob_cname || rec.buyerName}'s booking as Delivered?`)) return;
    try {
      await updateRecord('sob', rec.id, { status: 'Delivered' });

      // Also mark stock as Sold if stock ID is available
      if (rec.sob_stkid) {
        const stk = (data.stk || []).find(s => s.stkId === rec.sob_stkid);
        if (stk) await updateRecord('stk', stk.id, { status: 'Sold', soldDate: today() });
      }

      await refresh('sob');
      await refresh('stk');
      showToast('Marked as Delivered! 🎉');
    } catch (e) { showToast('Failed.', 'error'); }
  };

  const handlePrintRecord = (r) => {
    setEditRec(r);
    setIsModalOpen(true);
  };

  const handleSendToCloser = async (rec) => {
    if (rec.sob_sclid) { showToast('Already sent to Sales Closer.', 'info'); return; }
    if (!await window.confirm(`Send ${rec.sob_cname || rec.buyerName} to Sales Closer?`)) return;
    try {
      const stkRec = rec.sob_stkid ? (data.stk || []).find(s => (s.stkId || s.id) === rec.sob_stkid) : null;
      const [mmMake, ...mmRest] = (rec.sob_mm || '').split(' ');
      const make = stkRec?.make || stkRec?.sk_make || mmMake || '';
      const model = stkRec?.model || stkRec?.sk_model || mmRest.join(' ') || '';

      const cnt = await getNextCounter('scl');
      const sclId = genId('SCL', cnt);
      await addRecord('scl', {
        sclId,
        sc_inqid: rec.sob_sinid || '',
        sc_stkid: rec.sob_stkid || '',
        sc_bname: rec.sob_cname || rec.buyerName || '',
        sc_mob: rec.sob_cont || rec.mobile || '',
        sc_make: make,
        sc_model: model,
        sc_year: rec.sob_year || '',
        sc_regn: rec.sob_regn || '',
        sc_mrp: rec.sob_saleprice || '',
        sc_tok: rec.sob_token || '',
        sc_date: today(),
        sc_stat: 'Confirmed',
      });
      await updateRecord('sob', rec.id, { sob_sclid: sclId });

      showToast('Sent to Sales Closer! 🏆');
      await refresh('sob');
      await refresh('scl');
    } catch (e) {
      showToast('Failed to send to closer.', 'error');
    }
  };

  // KPIs
  const totalBookings = records.length;
  const pending = records.filter(r => !r.status || r.status === 'Pending').length;
  const delivered = records.filter(r => r.status === 'Delivered').length;
  const rowTotal = (r) => parseFloat(r.total) || ((parseFloat(r.sob_saleprice) || 0) + (parseFloat(r.sob_rto) || 0));
  const totalValue = useMemo(() => records.reduce((a, r) => a + rowTotal(r), 0), [records]);
  const totalToken = useMemo(() => records.reduce((a, r) => a + (parseFloat(r.sob_token) || 0), 0), [records]);
  const totalBalance = totalValue - totalToken;

  return (
    <div className="page on" id="pg_sal_booking">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' }}><i className="fa fa-clipboard-list"></i></div>Sales Order Booking</h1><p>Sales order booking and delivery management</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search buyer / stock ID / reg…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="flt" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option>Pending</option><option>Confirmed</option><option>Delivered</option><option>Cancelled</option>
          </select>
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Booking</button>
        </div>
      </div>
      {isModalOpen && <SobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-clipboard-list', val: totalBookings, lbl: 'Total Bookings', color: '#7C3AED' },
          { icon: 'fa-hourglass-half', val: pending, lbl: 'Pending', color: '#F59E0B' },
          { icon: 'fa-truck', val: delivered, lbl: 'Delivered', color: '#22C55E' },
          { icon: 'fa-indian-rupee-sign', val: fmt(totalValue), lbl: 'Total Booking Value', color: '#E85D04' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val" style={{ fontSize: typeof k.val === 'string' && k.val.length > 8 ? 14 : undefined }}>{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      {totalBookings > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div className="pl-card"><div className="pl-val" style={{ color: 'var(--success)' }}>{fmt(totalToken)}</div><div className="pl-lbl">TOTAL TOKEN RECEIVED</div></div>
          <div className="pl-card"><div className="pl-val" style={{ color: totalBalance > 0 ? 'var(--warn)' : 'var(--success)' }}>{fmt(totalBalance)}</div><div className="pl-lbl">TOTAL BALANCE</div></div>
          <div className="pl-card"><div className="pl-val" style={{ color: 'var(--bl5)' }}>{totalBookings > 0 ? Math.round((delivered / totalBookings) * 100) : 0}%</div><div className="pl-lbl">DELIVERY RATE</div></div>
        </div>
      )}

      <div className="tc">
        <div className="tc-hdr"><div className="tc-title"><i className="fa fa-clipboard-list" style={{ color: '#7C3AED' }}></i> Sales Order Bookings <span style={{ background: '#7C3AED', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span></div></div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table id="tbl_sob">
            <thead><tr><th>SOB ID</th><th>Inq ID</th><th>Stock ID</th><th>Date</th><th>Buyer</th><th>Reg No.</th><th>Vehicle</th><th>Total Amount</th><th>Token</th><th>Balance</th><th>Delivery</th><th>Status</th><th style={{ minWidth: 200 }}>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const total = rowTotal(r);
                const token = parseFloat(r.sob_token) || 0;
                const bal = total - token;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: '#7C3AED', fontFamily: "'Space Grotesk',sans-serif" }}>{r.sobId || r.id?.slice(0, 12)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text2)' }}>{r.sob_sinid || r.sob_inqid || '—'}</td>
                    <td>
                      {r.sob_stkid ? (
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#059669', fontSize: 10, background: 'rgba(5,150,105,.1)', padding: '2px 8px', borderRadius: 10 }}>{r.sob_stkid}</span>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.sob_date || r.date)}</td>
                    <td style={{ fontWeight: 600 }}>{r.sob_cname || r.buyerName}</td>
                    <td style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: 'var(--or1)' }}>{r.sob_regn || r.regNo || '—'}</td>
                    <td>{r.sob_mm || `${r.make || ''} ${r.model || ''}`}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(total)}</td>
                    <td style={{ color: 'var(--bl5)', fontWeight: 600 }}>{token ? fmt(token) : '—'}</td>
                    <td style={{ color: bal > 0 ? 'var(--warn)' : 'var(--success)', fontWeight: 700 }}>{fmt(bal)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{r.sob_edd ? fmtDate(r.sob_edd) : '—'}</td>
                    <td><span className={`badge ${statusBadge(r.status || 'Pending')}`}>{r.status || 'Pending'}</span></td>
                    <td>
                      <div className="act-grp">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                        <button className="btn-icon bi-print" title="Print" onClick={() => handlePrintRecord(r)}><i className="fa fa-print"></i></button>
                        <button className="btn-icon" title={r.sob_sclid ? `Already sent: ${r.sob_sclid}` : 'Send to Sales Closer'} disabled={!!r.sob_sclid}
                          onClick={() => handleSendToCloser(r)}
                          style={{ background: r.sob_sclid ? 'rgba(0,0,0,.06)' : 'rgba(34,197,94,.1)', color: r.sob_sclid ? 'var(--text3)' : 'var(--success)', opacity: r.sob_sclid ? 0.6 : 1, cursor: r.sob_sclid ? 'not-allowed' : 'pointer' }}>
                          <i className="fa fa-trophy"></i>
                        </button>
                        {(r.status !== 'Delivered') && (
                          <button className="btn-icon" title="Mark Delivered" onClick={() => handleMarkDelivered(r)}
                            style={{ background: 'rgba(34,197,94,.1)', color: 'var(--success)' }}>
                            <i className="fa fa-truck"></i>
                          </button>
                        )}
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="13" className="empty"><i className="fa fa-clipboard-list"></i><br />{search || statusFilter ? 'No results found' : 'No sales bookings yet. Click "Add Booking" to create one.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} of {records.length} bookings</span>
        </div>
      </div>
    </div>
  );
};
export default SalesBooking;

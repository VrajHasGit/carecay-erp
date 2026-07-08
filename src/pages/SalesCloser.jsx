import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt } from '../utils/helpers';
import { SclModal } from '../components/modals/SclModal';
import { FinModal } from '../components/modals/FinModal';

const SalesCloser = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data.scl || [];

  // Auto-fix missing IDs
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (!r.sclId) {
          const cnt = await getNextCounter('scl');
          await updateRecord('scl', r.id, { sclId: genId('SCL', cnt) });
          fixed = true;
        }
      }
      if (fixed) refresh('scl');
    };
    if (records.length > 0) fixIds();
  }, [records]);

  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (r.sclId || '').toLowerCase().includes(q) ||
        (r.sc_stkid || '').toLowerCase().includes(q) ||
        (r.sc_bname || r.buyerName || '').toLowerCase().includes(q) ||
        (r.sc_regn || r.regNo || '').toLowerCase().includes(q);
    }
    if (r.stage && r.stage !== 'Closer') return false;
    return true;
  });

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('scl', editRec.id, fd, { title: 'Sales Closer Updated', message: (fd.sc_bname || fd.buyerName || '') + ' — ' + (fd.sc_veh || ''), link: '/sales-closer', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('scl'); await addRecord('scl', { ...fd, sclId: genId('SCL', cnt), date: fd.sc_date || today() }, { title: 'Sales Deal', message: (fd.sc_bname || fd.buyerName || '') + ' — ' + (fd.sc_veh || ''), link: '/sales-closer', actor }); showToast('Sales deal added!'); }
      await refresh('scl'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete this deal?')) return;
    try { await deleteRecord('scl', rec.id); await refresh('scl'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const [quickModal, setQuickModal] = useState({ type: null, sclId: null, rec: null });
  const closeQuickModal = () => setQuickModal({ type: null, sclId: null, rec: null });

  const handleSendToFinance = async (rec) => {
    if (!await window.confirm(`Create Finance / Loan file for ${rec.sc_bname || rec.buyerName}?`)) return;
    setQuickModal({ type: 'fin', sclId: rec.id, rec });
  };

  // KPIs
  const totalDeals = filtered.length;
  const totalRevenue = useMemo(() => filtered.reduce((a, r) => a + (parseFloat(r.final) || 0), 0), [filtered]);
  const totalProfit = useMemo(() => filtered.reduce((a, r) => a + (parseFloat(r.profit) || 0), 0), [filtered]);
  const avgDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

  return (
    <div className="page on" id="pg_sal_closer">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}><i className="fa fa-trophy"></i></div>Sales Closer</h1><p>Finalize sales deals and record confirmed orders</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search buyer / stock ID / reg…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Deal</button>
        </div>
      </div>
      {isModalOpen && <SclModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <FinModal 
        isOpen={quickModal.type === 'fin'} 
        onClose={closeQuickModal} 
        quickData={quickModal.rec ? {
          fin_inqid: quickModal.rec.sc_inqid || '',
          fin_cname: quickModal.rec.sc_bname || quickModal.rec.buyerName || '',
          fin_mob: quickModal.rec.sc_mob || quickModal.rec.mobile || '',
          fin_veh: `${quickModal.rec.sc_make || ''} ${quickModal.rec.sc_model || ''}`.trim(),
          fin_regn: quickModal.rec.sc_regn || quickModal.rec.regNo || '',
          fin_sp: quickModal.rec.final || quickModal.rec.sc_price || ''
        } : null} 
      />

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-trophy', val: totalDeals, lbl: 'Total Deals', color: '#059669' },
          { icon: 'fa-indian-rupee-sign', val: fmt(totalRevenue), lbl: 'Total Revenue', color: '#E85D04' },
          { icon: 'fa-chart-line', val: fmt(totalProfit), lbl: 'Total Profit', color: totalProfit >= 0 ? '#22C55E' : '#EF4444' },
          { icon: 'fa-calculator', val: fmt(avgDealValue), lbl: 'Avg Deal Value', color: '#4A7CDE' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val" style={{ fontSize: typeof k.val === 'string' && k.val.length > 8 ? 14 : undefined }}>{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      <div className="tc">
        <div className="tc-hdr"><div className="tc-title"><i className="fa fa-trophy" style={{ color: 'var(--success)' }}></i> Sales Deals <span style={{ background: 'var(--success)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span></div></div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table id="tbl_scl">
            <thead><tr><th>ID</th><th>Inq ID</th><th>Close Date</th><th>Buyer Name</th><th>Reg No.</th><th>Vehicle</th><th>Agreed Price</th><th>Token Paid</th><th>Balance</th><th>Payment Status</th><th>Profit</th><th style={{ minWidth: 140 }}>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const price = parseFloat(r.sc_price) || parseFloat(r.final) || 0;
                const tokenAmt = parseFloat(r.sc_tok) || 0;
                const paidTotal = Array.isArray(r.payments) && r.payments.length > 0
                  ? r.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
                  : 0;
                const remBal = price - tokenAmt - paidTotal;

                let pStatus = 'New Deal';
                if (price > 0) pStatus = remBal <= 0 ? 'Paid in Full' : 'Pending Payment';

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--success)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.sclId || r.id?.slice(0, 12)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text2)' }}>{r.sc_inqid || '—'}</td>
                    <td>{fmtDate(r.sc_date || r.date)}</td>
                    <td style={{ fontWeight: 600 }}>{r.sc_bname || r.buyerName}</td>
                    <td className="plate">{r.sc_regn || r.regNo || '—'}</td>
                    <td>{r.sc_make || r.make} {r.sc_model || r.model}</td>
                    <td className="amt-or">{fmt(price)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(tokenAmt)}</td>
                    <td style={{ color: remBal > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(remBal)}</td>
                    <td><span className={`badge ${pStatus === 'Paid in Full' ? 'suc' : pStatus === 'Pending Payment' ? 'wrn' : 'blu'}`}>{pStatus}</span></td>
                    <td className={r.profit > 0 ? 'profit-pos' : r.profit < 0 ? 'profit-neg' : ''}>{r.profit ? fmt(r.profit) : '—'}</td>
                    <td>
                      <div className="act-grp">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                        <button className="btn-icon bi-next" style={{ background: '#4A7CDE', color: '#fff' }} title="Send to Finance / Loan" onClick={() => handleSendToFinance(r)}><i className="fa fa-landmark"></i></button>
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="12" className="empty"><i className="fa fa-trophy"></i><br />{search ? 'No results found' : 'No sales deals yet. Click "Add Deal" to create one.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} deals</span>
        </div>
      </div>
    </div>
  );
};
export default SalesCloser;

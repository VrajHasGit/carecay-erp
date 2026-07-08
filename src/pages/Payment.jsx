import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { PayModal } from '../components/modals/PayModal';
import { DelModal } from '../components/modals/DelModal';
import { DocModal } from '../components/modals/DocModal';

const Payment = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data.pay || [];
  
  // Auto-fix 2025 IDs and malformed IDs to 2026
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (r.payId && String(r.payId).includes('2025-')) {
          const newId = String(r.payId).replace('2025-', '2026-');
          await updateRecord('pay', r.id, { payId: newId });
          fixed = true;
        } else if (!r.payId || !String(r.payId).startsWith('PAY-')) {
          const cnt = await getNextCounter('pay');
          const newId = genId('PAY', cnt);
          await updateRecord('pay', r.id, { payId: newId });
          fixed = true;
        }
      }
      if (fixed) refresh('pay');
    };
    fixIds();
  }, [records, refresh]);

  const filtered = records.filter(r => {
    const matchType = !typeFilter || r.type === typeFilter;
    if (!matchType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.payId || '').toLowerCase().includes(q) ||
        (r.py_inqid || r.inqId || '').toLowerCase().includes(q) ||
        (r.name || r.pay_party || r.party || '').toLowerCase().includes(q) ||
        (r.regNo || '').toLowerCase().includes(q);
    }
    if (r.stage && r.stage !== 'Payment') return false;
    return true;
  });
  const totalIn = records.filter(r=>r.type==='Purchase').reduce((a,r)=>a+(r.amount||0),0);
  const totalOut = records.filter(r=>r.type==='Sale').reduce((a,r)=>a+(r.amount||0),0);
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('pay', editRec.id, fd, { title: 'Payment Updated', message: '₹' + (fd.pay_amt || fd.amount || '') + ' — ' + (fd.pay_party || fd.party || ''), link: '/payment', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('pay'); await addRecord('pay', {...fd, payId: genId('PAY', cnt), date: fd.date||today()}, { title: 'Payment Recorded', message: '₹' + (fd.pay_amt || fd.amount || '') + ' — ' + (fd.pay_party || fd.party || ''), link: '/payment', actor }); showToast('Payment added!'); }
      await refresh('pay'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('pay', rec.id); await refresh('pay'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  
  const [quickModal, setQuickModal] = useState({ type: null, payId: null });
  const closeQuickModal = () => setQuickModal({ type: null, payId: null });

  const markShifted = async (targetStage, recId) => {
    const rec = data.pay.find(r => r.id === recId || r.payId === recId);
    if (rec) {
      try {
        await updateRecord('pay', rec.id, { stage: targetStage });
        await refresh('pay');
        showToast(`Shifted to ${targetStage}`);
        closeQuickModal();
      } catch (e) {
        showToast('Failed to shift', 'error');
      }
    }
  };

  return (
    <div className="page on" id="pg_payment">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-credit-card"></i></div>Payment</h1><p>Purchase and sale payment tracking</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search name / reg…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="flt" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="">All Types</option><option value="Purchase">Purchase</option><option value="Sale">Sale</option>
          </select>
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Payment</button>
        </div>
      </div>
      {isModalOpen && <PayModal isOpen={isModalOpen} onClose={()=>{setIsModalOpen(false);setEditRec(null);}} onSave={handleSave} editRecord={editRec} />}
      <DelModal isOpen={quickModal.type === 'del'} onClose={closeQuickModal} onSuccess={() => markShifted('Delivery', quickModal.payId)} quickId={quickModal.payId} />
      <DocModal isOpen={quickModal.type === 'doc'} onClose={closeQuickModal} onSuccess={() => markShifted('Documents', quickModal.payId)} quickId={quickModal.payId} />

      {/* Summary cards */}
      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        <div className="kpi">
          <div className="kpi-icon">💸</div>
          <div className="kpi-val">{fmt(filtered.reduce((a,r)=>a+(Number(r.amount||r.py_amt)||0),0))}</div>
          <div className="kpi-lbl">Total Received</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">⏳</div>
          <div className="kpi-val">{fmt(filtered.reduce((a,r)=>a+((Number(r.bal||r.py_bal)>0)?Number(r.bal||r.py_bal):0),0))}</div>
          <div className="kpi-lbl">Total Pending</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">🪙</div>
          <div className="kpi-val">{filtered.filter(r=>(r.type||r.py_type)==='Token' || (r.type||r.py_type)==='Token Payment').length}</div>
          <div className="kpi-lbl">Token Payments</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">💳</div>
          <div className="kpi-val">{filtered.length}</div>
          <div className="kpi-lbl">Transactions</div>
        </div>
      </div>

      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Payments <span style={{background:'var(--or1)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          <table id="tbl_pay">
            <thead><tr><th>Payment ID</th><th>Inq ID</th><th>Booking ID</th><th>Seller/Buyer</th><th>Reg No.</th><th>Date</th><th>Type</th><th>Amount ₹</th><th>Mode</th><th>Cheque/UTR</th><th>Bank</th><th>Total Amt ₹</th><th>Prev Paid ₹</th><th>Balance ₹</th><th>Hold Pay</th><th>Authorized By</th><th style={{ minWidth: 100 }}>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--or1)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.payId||r.id?.slice(0,12)}</td>
                  <td style={{fontWeight:600,color:'var(--text2)'}}>{r.py_inqid || '—'}</td>
                  <td>{r.obId || r.py_obid || r.py_sobid || '—'}</td>
                  <td style={{fontWeight:600}}>{r.name || r.py_name || '—'}</td>
                  <td>{r.regNo || r.py_regn || '—'}</td>
                  <td>{fmtDate(r.date || r.py_date)}</td>
                  <td>{r.type || r.py_type || '—'}</td>
                  <td className="amt-or">{fmt(r.amount || r.py_amt)}</td>
                  <td>{r.mode || r.py_mode || '—'}</td>
                  <td>{r.ref || r.py_ref || '—'}</td>
                  <td>{r.bank || r.py_bank || '—'}</td>
                  <td>{fmt(r.total || r.py_total)}</td>
                  <td>{fmt(r.prev || r.py_prev)}</td>
                  <td style={{color: (r.bal || r.py_bal || 0) > 0 ? 'var(--warn)' : 'var(--success)', fontWeight: 600}}>{fmt(r.bal || r.py_bal || 0)}</td>
                  <td>{r.hold || r.py_hold || '—'}</td>
                  <td>{r.auth || r.py_auth || '—'}</td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    {r.type === 'Purchase' && <button className="btn-icon bi-next" title="Send to Documents" onClick={() => setQuickModal({ type: 'doc', payId: r.id })}><i className="fa fa-file-lines"></i></button>}
                    {r.type === 'Sale' && <button className="btn-icon bi-next" title="Send to Delivery" onClick={() => setQuickModal({ type: 'del', payId: r.id })}><i className="fa fa-truck"></i></button>}
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              )) : <tr><td colSpan="16" className="empty"><i className="fa fa-credit-card"></i><br />{search||typeFilter?'No results found':'No payment records yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Payment;

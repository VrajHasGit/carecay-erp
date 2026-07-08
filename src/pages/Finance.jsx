import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { FinModal } from '../components/modals/FinModal';

const Finance = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data['fin'] || [];
  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.finId || '').toLowerCase().includes(q) ||
      (r.fin_inqid || r.inqId || '').toLowerCase().includes(q) ||
      (r.fin_bname || r.buyerName || '').toLowerCase().includes(q) ||
      (r.fin_regn || r.regNo || '').toLowerCase().includes(q) ||
      (r.fin_bank || '').toLowerCase().includes(q);
  });
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('fin', editRec.id, fd, { title: 'Finance Updated', message: (fd.fin_bname || fd.buyerName || '') + ' — ' + (fd.fin_bank || ''), link: '/finance', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('FIN'); await addRecord('fin', {...fd, finId: genId('FIN', cnt), date: fd.date||today()}, { title: 'Finance Applied', message: (fd.fin_bname || fd.buyerName || '') + ' — ' + (fd.fin_bank || ''), link: '/finance', actor }); showToast('Finance / Loan record added!'); }
      await refresh('fin'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('fin', rec.id); await refresh('fin'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  return (
    <div className="page on" id="pg_finance">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-landmark"></i></div>Finance / Loan</h1><p>Vehicle finance and loan management</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Record</button>
        </div>
      </div>
      {isModalOpen && <FinModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Finance / Loan <span style={{background:'var(--bl5)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          {filtered.length === 0 ? (
            <div className="empty" style={{padding:48}}>
              <i className="fa fa-landmark" style={{fontSize:36,color:'var(--border2)',display:'block',marginBottom:12}}></i>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text2)',marginBottom:8}}>No records yet</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>Click "Add Record" to create your first Finance / Loan entry.</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--bl5)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.finId||r.id?.slice(0,12)}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td>{r.name||r.buyerName||r.sellerName||r.regNo||'—'}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status||'—'}</span></td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default Finance;

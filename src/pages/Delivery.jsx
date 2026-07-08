import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { DelModal } from '../components/modals/DelModal';
import { DocModal } from '../components/modals/DocModal';

const Delivery = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data.del || [];
  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (r.delId || '').toLowerCase().includes(q) ||
        (r.buyerName || '').toLowerCase().includes(q) ||
        (r.regNo || '').toLowerCase().includes(q);
    }
    if (r.stage && r.stage !== 'Delivery') return false;
    return true;
  });
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('del', editRec.id, fd, { title: 'Delivery Updated', message: (fd.del_bname || fd.buyerName || '') + ' — ' + (fd.del_regn || fd.regNo || ''), link: '/delivery', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('del'); await addRecord('del', {...fd, delId: genId('DEL', cnt), date: fd.date||today()}, { title: 'Delivery Scheduled', message: (fd.del_bname || fd.buyerName || '') + ' — ' + (fd.del_regn || fd.regNo || ''), link: '/delivery', actor }); showToast('Delivery added!'); }
      await refresh('del'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('del', rec.id); await refresh('del'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  
  const handlePrintRecord = (r) => {
    setEditRec(r);
    setIsModalOpen(true);
  };


  const [quickModal, setQuickModal] = useState({ type: null, delId: null });
  const closeQuickModal = () => setQuickModal({ type: null, delId: null });

  const markShifted = async (targetStage, recId) => {
    const rec = data.del.find(r => r.id === recId || r.delId === recId);
    if (rec) {
      try {
        await updateRecord('del', rec.id, { stage: targetStage });
        await refresh('del');
        showToast(`Shifted to ${targetStage}`);
        closeQuickModal();
      } catch (e) {
        showToast('Failed to shift', 'error');
      }
    }
  };

  return (
    <div className="page on" id="pg_delivery">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-truck"></i></div>Delivery</h1><p>Vehicle delivery and handover records</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Delivery</button>
        </div>
      </div>
      {isModalOpen && <DelModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <DocModal isOpen={quickModal.type === 'doc'} onClose={closeQuickModal} onSuccess={() => markShifted('Documents', quickModal.delId)} quickObId={quickModal.delId} />
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Deliveries <span style={{background:'var(--success)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          <table id="tbl_del">
            <thead><tr><th>Del ID</th><th>Date</th><th>Buyer</th><th>Reg No.</th><th>Vehicle</th><th>Del Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--success)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.delId||r.id?.slice(0,12)}</td>
                  <td>{fmtDate(r.date)}</td><td style={{fontWeight:600}}>{r.buyerName}</td>
                  <td style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:'var(--or1)'}}>{r.regNo}</td>
                  <td>{r.make} {r.model}</td>
                  <td>{r.delDate?fmtDate(r.delDate):'—'}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-print" title="Print" onClick={()=>handlePrintRecord(r)}><i className="fa fa-print"></i></button>
                    <button className="btn-icon bi-next" title="Send to Documents" onClick={() => setQuickModal({ type: 'doc', delId: r.id })}><i className="fa fa-folder-open"></i></button>
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              )) : <tr><td colSpan="8" className="empty"><i className="fa fa-truck"></i><br />{search?'No results found':'No delivery records yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Delivery;

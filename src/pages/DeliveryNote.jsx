import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { DnModal } from '../components/modals/DnModal';

const DeliveryNote = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data.dn || [];
  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.dnId || '').toLowerCase().includes(q) ||
      (r.buyerName || r.customer || '').toLowerCase().includes(q) ||
      (r.regNo || r.dn_regn || '').toLowerCase().includes(q);
  });
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('dn', editRec.id, fd, { title: 'Delivery Note Updated', message: (fd.dn_bname || fd.buyerName || '') + ' — ' + (fd.dn_regn || fd.regNo || ''), link: '/delivery-note', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('dn'); await addRecord('dn', {...fd, dnId: genId('DN', cnt), date: fd.date||today()}, { title: 'Delivery Note Created', message: (fd.dn_bname || fd.buyerName || '') + ' — ' + (fd.dn_regn || fd.regNo || ''), link: '/delivery-note', actor }); showToast('Delivery note added!'); }
      await refresh('dn'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('dn', rec.id); await refresh('dn'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  
  const handlePrintRecord = (r) => {
    setEditRec(r);
    setIsModalOpen(true);
  };

  return (
    <div className="page on" id="pg_delivery_note">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon" style={{background:'linear-gradient(135deg,#0891B2,#06B6D4)'}}><i className="fa fa-file-lines"></i></div>Delivery Note</h1><p>Vehicle handover note — Customer · Vehicle · Accessories · Signature</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Delivery Note</button>
        </div>
      </div>
      {isModalOpen && <DnModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Delivery Notes <span style={{background:'var(--info)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          <table id="tbl_dn">
            <thead><tr><th>DN ID</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Reg No.</th><th>Handover By</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--info)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.dnId||r.id?.slice(0,12)}</td>
                  <td>{fmtDate(r.date)}</td><td style={{fontWeight:600}}>{r.buyerName||r.customer}</td>
                  <td>{r.make} {r.model}</td>
                  <td style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:'var(--or1)'}}>{r.regNo}</td>
                  <td>{r.handoverBy||'—'}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-print" title="Print" onClick={()=>handlePrintRecord(r)}><i className="fa fa-print"></i></button>
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              )) : <tr><td colSpan="8" className="empty"><i className="fa fa-file-lines"></i><br />{search?'No results found':'No delivery notes yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DeliveryNote;

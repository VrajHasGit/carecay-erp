import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { GstModal } from '../components/modals/GstModal';

const GstInvoice = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data['gst_inv'] || [];
  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.gstId || '').toLowerCase().includes(q) ||
      (r.gst_inqid || r.inqId || '').toLowerCase().includes(q) ||
      (r.gst_bname || r.buyerName || '').toLowerCase().includes(q) ||
      (r.gst_regn || r.regNo || '').toLowerCase().includes(q);
  });
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('gst_inv', editRec.id, fd, { title: 'GST Invoice Updated', message: (fd.gst_bname || '') + ' — ' + (fd.gst_regn || fd.regNo || ''), link: '/gst-invoice', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('GST'); await addRecord('gst_inv', {...fd, gstId: genId('GST', cnt), date: fd.date||today()}, { title: 'GST Invoice Generated', message: (fd.gst_bname || '') + ' — ' + (fd.gst_regn || fd.regNo || ''), link: '/gst-invoice', actor }); showToast('GST Invoice record added!'); }
      await refresh('gst_inv'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('gst_inv', rec.id); await refresh('gst_inv'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  return (
    <div className="page on" id="pg_gstinvoice">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-file-invoice"></i></div>GST Invoice</h1><p>Generate and manage GST invoices</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Record</button>
        </div>
      </div>
      {isModalOpen && <GstModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">GST Invoice <span style={{background:'var(--purple)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          {filtered.length === 0 ? (
            <div className="empty" style={{padding:48}}>
              <i className="fa fa-file-invoice" style={{fontSize:36,color:'var(--border2)',display:'block',marginBottom:12}}></i>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text2)',marginBottom:8}}>No records yet</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>Click "Add Record" to create your first GST Invoice entry.</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--purple)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.gstId||r.id?.slice(0,12)}</td>
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
export default GstInvoice;

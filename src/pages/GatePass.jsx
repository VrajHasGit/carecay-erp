import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, statusBadge } from '../utils/helpers';
import { GpModal } from '../components/modals/GpModal';

const GatePass = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data.gp || [];
  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.gpId || '').toLowerCase().includes(q) ||
      (r.regNo || r.gp_regn || '').toLowerCase().includes(q) ||
      (r.driverName || r.gp_driver || '').toLowerCase().includes(q) ||
      (r.gp_bname || '').toLowerCase().includes(q);
  });
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('gp', editRec.id, fd, { title: 'Gate Pass Updated', message: (fd.gp_bname || '') + ' — ' + (fd.gp_regn || fd.regNo || ''), link: '/gate-pass', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('gp'); await addRecord('gp', {...fd, gpId: genId('GP', cnt), date: fd.date||today()}, { title: 'Gate Pass Created', message: (fd.gp_bname || '') + ' — ' + (fd.gp_regn || fd.regNo || ''), link: '/gate-pass', actor }); showToast('Gate pass added!'); }
      await refresh('gp'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('gp', rec.id); await refresh('gp'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  
  const handlePrintRecord = (r) => {
    setEditRec(r);
    setIsModalOpen(true);
  };

  return (
    <div className="page on" id="pg_gate_pass">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-door-open"></i></div>Gate Pass</h1><p>Vehicle gate pass generation and tracking</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search reg / driver…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Gate Pass</button>
        </div>
      </div>
      {isModalOpen && <GpModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Gate Passes <span style={{background:'var(--or1)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          <table id="tbl_gp">
            <thead><tr><th>GP ID</th><th>Date</th><th>Reg No.</th><th>Vehicle</th><th>Type</th><th>Driver</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--or1)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.gpId||r.id?.slice(0,12)}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:'var(--or1)'}}>{r.regNo}</td>
                  <td>{r.make} {r.model}</td>
                  <td>{r.type||'—'}</td>
                  <td>{r.driverName||'—'}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-print" title="Print" onClick={()=>handlePrintRecord(r)}><i className="fa fa-print"></i></button>
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              )) : <tr><td colSpan="8" className="empty"><i className="fa fa-door-open"></i><br />{search?'No results found':'No gate passes yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default GatePass;

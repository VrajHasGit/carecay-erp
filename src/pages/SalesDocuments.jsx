import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate } from '../utils/helpers';
import { SaleDocModal } from '../components/modals/SaleDocModal';

const SalesDocuments = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.sale_doc || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.sale_doc, location.state?.autoOpenId]);
  
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data['sale_doc'] || [];

  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (r.docId || '').toLowerCase().includes(q) ||
        (r.sd_obid || '').toLowerCase().includes(q) ||
        (r.sd_cname || '').toLowerCase().includes(q) ||
        (r.sd_regn || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      let savedId;
      if (editRec) { 
        await updateRecord('sale_doc', editRec.id, fd, { title: 'Sale Documents Updated', message: (fd.sd_regn || '') + ' — ' + (fd.sd_cname || ''), link: '/sale-documents', actor }); 
        showToast('Updated!'); 
        savedId = editRec.id || editRec.docId;
      } else { 
        const cnt = await getNextCounter('sale_doc'); 
        savedId = genId('SDOC', cnt);
        await addRecord('sale_doc', {...fd, docId: savedId, date: fd.date||today()}, { title: 'Sale Documents Added', message: (fd.sd_regn || '') + ' — ' + (fd.sd_cname || ''), link: '/sale-documents', actor }); 
        showToast('Sale Documents record added!'); 
      }
      await refresh('sale_doc'); 
      setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('sale_doc', rec.id); await refresh('sale_doc'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  
  return (
    <div className="page on" id="pg_sale_documents">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{background: '#3B82F6', color: '#fff'}}><i className="fa fa-file-contract"></i></div>
            SALE DOCUMENTS
          </h1>
          <p style={{textTransform: 'uppercase'}}>SALES INVOICE · RTO TRANSFER · INSURANCE TRANSFER · DELIVERY NOTE · GATE PASS · PAYMENT RECEIPT</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn-pri" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Record</button>
        </div>
      </div>
      
      {isModalOpen && <SaleDocModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Sale Documents <span style={{background:'var(--info)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          {filtered.length === 0 ? (
            <div className="empty" style={{padding:48}}>
              <i className="fa fa-file-contract" style={{fontSize:36,color:'var(--border2)',display:'block',marginBottom:12}}></i>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text2)',marginBottom:8}}>No records yet</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>Click "Add Record" to create your first Sale Documents entry.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>DOC ID</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>SALES OB ID</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>CUSTOMER NAME</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>REG NO.</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>DATE</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>INVOICE</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>RTO TRANS</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>INS TRANS</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>DEL NOTE</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>GATE PASS</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>PAYMENT</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>STATUS</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>VERIFIED BY</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>{filtered.map(r => {
                const hasMissing = !r.sd_inv || !r.sd_rto || !r.sd_ins || !r.sd_dn || !r.sd_gp || !r.sd_pay;
                const isComplete = r.sd_stat?.toUpperCase() === 'COMPLETE';
                return (
                <tr key={r.id} style={isComplete ? { backgroundColor: 'rgba(16, 185, 129, 0.05)' } : (hasMissing ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {})}>
                  <td style={{fontWeight:500,color:'var(--text)',fontFamily:"'Inter',sans-serif"}}>{r.docId||r.id?.slice(0,12)}</td>
                  <td>{r.sd_obid||'—'}</td>
                  <td style={{fontWeight:600}}>{r.sd_cname||'—'}</td>
                  <td style={{fontWeight:600}}>{r.sd_regn||'—'}</td>
                  <td>{r.sd_date||fmtDate(r.date)}</td>
                  <td style={{color: r.sd_inv ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.sd_inv ? (r.sdu_inv ? <a href={r.sdu_inv} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.sd_rto ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.sd_rto ? (r.sdu_rto ? <a href={r.sdu_rto} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.sd_ins ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.sd_ins ? (r.sdu_ins ? <a href={r.sdu_ins} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.sd_dn ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.sd_dn ? (r.sdu_dn ? <a href={r.sdu_dn} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.sd_gp ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.sd_gp ? (r.sdu_gp ? <a href={r.sdu_gp} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.sd_pay ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.sd_pay ? (r.sdu_pay ? <a href={r.sdu_pay} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td>
                    <div style={{color: r.sd_stat?.toUpperCase() === 'COMPLETE' ? '#10B981' : '#D97706', fontSize: 10, fontWeight: 700, textTransform: 'uppercase'}}>{r.sd_stat||'INCOMPLETE'}</div>
                  </td>
                  <td>{r.sd_verby||'-'}</td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              );
              })}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default SalesDocuments;

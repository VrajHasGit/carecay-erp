import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { DocModal } from '../components/modals/DocModal';
import { WsModal } from '../components/modals/WsModal';
import { StkModal } from '../components/modals/StkModal';

const PurchaseDocuments = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.doc || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.doc, location.state?.autoOpenId]);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data['doc'] || [];

  useEffect(() => {
    const migrateDocs = async () => {
      const docsWithoutId = records.filter(r => !r.docId);
      if (docsWithoutId.length > 0) {
        console.log('Migrating', docsWithoutId.length, 'docs...');
        for (const doc of docsWithoutId) {
          const cnt = await getNextCounter('doc');
          const newDocId = genId('DOC', cnt);
          await updateRecord('doc', doc.id, { docId: newDocId });
        }
        refresh('doc');
      }
    };
    if (records && records.length) migrateDocs();
  }, [records]);

  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (r.docId || '').toLowerCase().includes(q) ||
        (r.dc_obid || r.inqId || '').toLowerCase().includes(q) ||
        (r.dc_cname || '').toLowerCase().includes(q) ||
        (r.dc_regn || '').toLowerCase().includes(q);
    }
    if (r.stage && (r.stage === 'Workshop' || r.stage === 'Stock' || r.stage === 'OrderBooking')) return false;
    return true;
  });
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      let savedId;
      if (editRec) { 
        await updateRecord('doc', editRec.id, fd, { title: 'Purchase Documents Updated', message: (fd.dc_regn || fd.regNo || '') + ' — ' + (fd.dc_cname || ''), link: '/purchase-documents', actor }); 
        showToast('Updated!'); 
        savedId = editRec.id || editRec.docId;
      } else { 
        const cnt = await getNextCounter('doc'); 
        savedId = genId('DOC', cnt);
        await addRecord('doc', {...fd, docId: savedId, date: fd.date||today()}, { title: 'Purchase Documents Added', message: (fd.dc_regn || fd.regNo || '') + ' — ' + (fd.dc_cname || ''), link: '/purchase-documents', actor }); 
        showToast('Documents record added!'); 
      }
      await refresh('doc'); 
      setIsModalOpen(false);

      if (fd.dc_stat === 'Complete' && (!editRec || editRec.dc_stat !== 'Complete')) {
        setTimeout(() => setQuickModal({ type: 'stk', docId: savedId }), 100);
      }
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('doc', rec.id); await refresh('doc'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  
  const handleSendToBooking = async (rec) => {
    if (!await window.confirm(`Create Order Booking for ${rec.dc_regn || 'this vehicle'}?`)) return;
    try {
      const cleanRegn = (s) => (s || '').replace(/[\s-]/g, '').toLowerCase();
      const pfu = (data.pfu || []).find(p => {
        if (rec.dc_obid && (p.pf_inqid || '').toLowerCase() === rec.dc_obid.toLowerCase()) return true;
        if (rec.dc_regn) {
          const pInq = (data.pur_inq || []).find(i => (i.inqId || i.pi_inqid) === p.pf_inqid);
          if (pInq && cleanRegn(pInq.regNo || pInq.pi_regn) === cleanRegn(rec.dc_regn)) return true;
        }
        return false;
      });
      let pfuPrice = pfu ? (pfu.pf_close || pfu.pf_nego || pfu.pf_offer) : '';
      if (pfu && pfu.followUps && pfu.followUps.length > 0) {
        for (let i = pfu.followUps.length - 1; i >= 0; i--) {
          if (pfu.followUps[i].dealPrice) { pfuPrice = pfu.followUps[i].dealPrice; break; }
          else if (pfu.followUps[i].offer && !pfuPrice) pfuPrice = pfu.followUps[i].offer;
        }
      }
      const pcl = (data.pcl || []).find(p => p.pc_inqid === rec.dc_obid || p.pc_regn === rec.dc_regn);
      const purchasePrice = pcl ? (pcl.pc_price || pcl.amount) : (pfuPrice || rec.dc_pp || rec.dc_price || '');

      const cnt = await getNextCounter('ob');
      const obId = genId('OB', cnt);
      
      const inq = (data.pur_inq || []).find(i => (i.inqId || i.pi_inqid) === rec.dc_obid || cleanRegn(i.regNo || i.pi_regn) === cleanRegn(rec.dc_regn));
      const mm = inq ? `${inq.make || ''} ${inq.model || ''}`.trim() : (rec.dc_carinfo || '').split('·')[0].trim();

      const obData = {
        obId,
        date: today(),
        stage: 'OrderBooking',
        ob_inqid: rec.dc_obid || '',
        ob_regn: rec.dc_regn || '',
        ob_cname: rec.dc_cname || '',
        ob_pp: purchasePrice,
        ob_doc_stat: rec.dc_stat || 'Pending',
        ob_mm: mm
      };
      
      await addRecord('ob', obData);
      await updateRecord('doc', rec.id, { stage: 'OrderBooking' });
      await refresh('ob');
      await refresh('doc');
      showToast('Order booking created!');
    } catch (e) {
      showToast('Failed to create booking', 'error');
    }
  };
  
  const [quickModal, setQuickModal] = useState({ type: null, docId: null });
  const closeQuickModal = () => setQuickModal({ type: null, docId: null });

  const markShifted = async (targetStage, recId) => {
    const rec = data.doc.find(r => r.id === recId || r.docId === recId);
    if (rec) {
      try {
        await updateRecord('doc', rec.id, { stage: targetStage });
        await refresh('doc');
        showToast(`Shifted to ${targetStage}`);
        closeQuickModal();
      } catch (e) {
        showToast('Failed to shift', 'error');
      }
    }
  };
  return (
    <div className="page on" id="pg_purchase_documents">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{background: '#3B82F6', color: '#fff'}}><i className="fa fa-folder"></i></div>
            PURCHASE DOCUMENTS
          </h1>
          <p style={{textTransform: 'uppercase'}}>RC · INSURANCE · PUC · PAN · AADHAAR · FORM 29/30/28/35 · NOC · GST</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Record</button>
        </div>
      </div>
      {isModalOpen && <DocModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <WsModal isOpen={quickModal.type === 'ws'} onClose={closeQuickModal} onSuccess={() => markShifted('Workshop', quickModal.docId)} quickDocId={quickModal.docId} />
      <StkModal isOpen={quickModal.type === 'stk'} onClose={closeQuickModal} onSuccess={() => markShifted('Stock', quickModal.docId)} quickDocId={quickModal.docId} />
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Purchase Documents <span style={{background:'var(--info)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          {filtered.length === 0 ? (
            <div className="empty" style={{padding:48}}>
              <i className="fa fa-file-contract" style={{fontSize:36,color:'var(--border2)',display:'block',marginBottom:12}}></i>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text2)',marginBottom:8}}>No records yet</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>Click "Add Record" to create your first Purchase Documents entry.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>DOC ID</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>PURCHASE INQUIRY ID</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>SELLER NAME</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>REG NO.</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>DATE</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>RC</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>INSURANCE</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>PUC</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>PAN</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>AADHAAR</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>FRM 29</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>FRM 30</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>NOC BANK</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>SPARE KEY</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>STATUS</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>VERIFIED BY</th>
                  <th style={{textTransform:'uppercase',fontSize:10,color:'var(--text3)'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>{filtered.map(r => {
                const hasMissing = !r.dc_rc || !r.dc_ins || !r.dc_noc || !r.dc_f29 || !r.dc_f30;
                const isComplete = r.dc_stat?.toUpperCase() === 'COMPLETE';
                return (
                <tr key={r.id} style={isComplete ? { backgroundColor: 'rgba(16, 185, 129, 0.05)' } : (hasMissing ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {})}>
                  <td style={{fontWeight:500,color:'var(--text)',fontFamily:"'Inter',sans-serif"}}>{r.docId||r.id?.slice(0,12)}</td>
                  <td>{r.dc_obid||'—'}</td>
                  <td style={{fontWeight:600}}>{r.dc_cname||'—'}</td>
                  <td style={{fontWeight:600}}>{r.dc_regn||'—'}</td>
                  <td>{r.dc_date||fmtDate(r.date)}</td>
                  <td style={{color: r.dc_rc ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_rc ? (r.dcu_rc ? <a href={r.dcu_rc} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_ins ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_ins ? (r.dcu_ins ? <a href={r.dcu_ins} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_puc ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_puc ? (r.dcu_puc ? <a href={r.dcu_puc} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_pan ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_pan ? (r.dcu_pan ? <a href={r.dcu_pan} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_adh ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_adh ? (r.dcu_adh ? <a href={r.dcu_adh} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_f29 ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_f29 ? (r.dcu_f29 ? <a href={r.dcu_f29} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_f30 ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_f30 ? (r.dcu_f30 ? <a href={r.dcu_f30} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td style={{color: r.dc_noc ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_noc ? (r.dcu_noc ? <a href={r.dcu_noc} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌ NOC'}</td>
                  <td style={{color: r.dc_key ? '#10B981' : '#EF4444', fontWeight: 600}}>{r.dc_key ? (r.dcu_key ? <a href={r.dcu_key} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>✅ <i className="fa fa-external-link" style={{fontSize: 9, color:'#3B82F6'}}></i></a> : '✅') : '❌'}</td>
                  <td>
                    <div style={{color: r.dc_stat?.toUpperCase() === 'COMPLETE' ? '#10B981' : '#D97706', fontSize: 10, fontWeight: 700, textTransform: 'uppercase'}}>{r.dc_stat||'INCOMPLETE'}</div>
                  </td>
                  <td>{r.dc_verby||'-'}</td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-next" title="Send to Order Booking" onClick={()=>handleSendToBooking(r)}><i className="fa fa-clipboard-list"></i></button>
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
export default PurchaseDocuments;

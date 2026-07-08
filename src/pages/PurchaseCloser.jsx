import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { PclModal } from '../components/modals/PclModal';


const PurchaseCloser = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.pcl || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.pcl, location.state?.autoOpenId]);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => { setToast({msg, type}); setTimeout(() => setToast(null), 3500); };

  const records = data.pcl || [];
  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (r.pclId || '').toLowerCase().includes(q) ||
        (r.pc_inqid || r.inqId || '').toLowerCase().includes(q) ||
        (r.sellerName || r.pc_sname || '').toLowerCase().includes(q) ||
        (r.pc_regn || r.regNo || '').toLowerCase().includes(q);
    }
    if (r.stage && r.stage.toLowerCase() !== 'closer') return false;
    return true;
  });

  // Auto-fix missing IDs
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (!r.pclId) {
          const cnt = await getNextCounter('pcl');
          await updateRecord('pcl', r.id, { pclId: genId('PCL', cnt) });
          fixed = true;
        }
      }
      if (fixed) refresh('pcl');
    };
    if (records.length > 0) fixIds();
  }, [records]);

  const handleSave = async (formData) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      const nm = formData.sellerName || formData.pc_sname || '';
      const car = `${formData.make || ''} ${formData.model || ''}`.trim() || formData.pc_veh || '';
      if (editRec) { await updateRecord('pcl', editRec.id, formData, { title: 'Purchase Closer Updated', message: `${nm} — ${car}`, link: '/purchase-closer', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('pcl'); await addRecord('pcl', {...formData, pclId: genId('PCL', cnt), date: formData.date||today()}, { title: 'Purchase Deal', message: `${nm} — ${car}`, link: '/purchase-closer', actor }); showToast('Purchase closer added!'); }
      await refresh('pcl'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete?')) return;
    try { await deleteRecord('pcl', rec.id); await refresh('pcl'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); }
  };

  const [quickModal, setQuickModal] = useState({ type: null, pclId: null });
  const closeQuickModal = () => setQuickModal({ type: null, pclId: null });

  const markShifted = async (targetStage, recId) => {
    const rec = data.pcl.find(r => r.id === recId || r.pclId === recId);
    if (rec) {
      try {
        await updateRecord('pcl', rec.id, { stage: targetStage });
        await refresh('pcl');
        if (targetStage === 'OrderBooking') await refresh('ob');
        showToast(`Shifted to ${targetStage}`);
        closeQuickModal();
      } catch (e) {
        showToast('Failed to shift', 'error');
      }
    }
  };

  const handleSendToStock = async (rec) => {
    if (!await window.confirm(`Send ${rec.pc_regn || rec.regNo || 'this vehicle'} to Car Stock?`)) return;
    try {
      const cnt = await getNextCounter('stk');
      const stkId = genId('STK', cnt);
      
      // Resolve full vehicle details from the linked inquiry
      const linkedInqId = rec.pc_inqid || rec.inqId || '';
      const linkedInq = linkedInqId ? (data.pur_inq || []).find(i => i.inqId === linkedInqId || i.id === linkedInqId) : null;
      
      const vehStr = rec.pc_veh || '';
      const vehParts = vehStr.split(' ');
      const resolvedMake = linkedInq?.make || rec.make || vehParts[0] || '';
      const resolvedModel = linkedInq?.model || rec.model || vehParts.slice(1).join(' ') || '';
      
      const stkData = {
        stkId,
        regNo: rec.pc_regn || linkedInq?.regNo || rec.regNo || '',
        make: resolvedMake,
        model: resolvedModel,
        variant: linkedInq?.variant || rec.variant || '',
        year: linkedInq?.year || rec.year || '',
        fuel: linkedInq?.fuel || rec.fuel || '',
        trans: linkedInq?.trans || rec.trans || '',
        color: linkedInq?.color || rec.color || '',
        km: linkedInq?.km || rec.km || '',
        status: 'Workshop Pending',
        pDate: rec.pc_date || rec.date || today(),
        linkedCloser: rec.pclId || rec.id,
        inqId: linkedInqId,
        pp: rec.pc_price || rec.amount || 0
      };
      
      await addRecord('stk', stkData);
      await updateRecord('pcl', rec.id, { stage: 'Stock' });
      await refresh('stk');
      await refresh('pcl');
      showToast('Vehicle sent to Stock!');
    } catch (e) {
      showToast('Failed to send to stock', 'error');
    }
  };

  return (
    <div className="page on" id="pg_pur_closer">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-handshake"></i></div>Purchase Closer</h1><p>Finalize purchase deals and order confirmations</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Closer</button>
        </div>
      </div>
      {isModalOpen && <PclModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}

      
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Purchase Closer Records <span style={{background:'var(--or1)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ID</th><th>Inq ID</th><th>Closer Date</th><th>Seller Name</th><th>Reg No.</th><th>Vehicle</th><th>Agreed Price</th><th>Token Paid</th><th>Balance</th><th>Payment Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                let basePrice = parseFloat(r.pc_price) || parseFloat(r.amount) || 0;
                let closerDate = r.pc_date || r.date;
                
                const linkedInqId = r.pc_inqid || r.inqId || '';
                const linkedInq = linkedInqId ? (data.pur_inq || []).find(i => i.inqId === linkedInqId || i.id === linkedInqId) : null;
                const dispName = r.pc_sname || linkedInq?.sellerName || r.sellerName || '—';
                const dispRegn = r.pc_regn || linkedInq?.regNo || r.regNo || '—';
                const dispVeh = r.pc_veh || (linkedInq ? `${linkedInq.make || ''} ${linkedInq.model || ''}`.trim() : '') || `${r.make || ''} ${r.model || ''}`.trim() || '—';

                const pfuRec = data.pfu?.find(p => p.pf_inqid === linkedInqId);
                if (pfuRec && Array.isArray(pfuRec.followUps)) {
                  const cwFu = [...pfuRec.followUps].reverse().find(fu => fu.stat === 'Closed-Won');
                  if (cwFu) {
                    if (cwFu.date) closerDate = cwFu.date;
                    if (cwFu.dealPrice && basePrice === 0) basePrice = parseFloat(cwFu.dealPrice) || 0;
                  }
                }

                const price = basePrice;
                const token = parseFloat(r.pc_tok) || 0;
                const paidTotal = Array.isArray(r.payments) && r.payments.length > 0
                  ? r.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
                  : (parseFloat(r.pc_p1)||0) + (parseFloat(r.pc_p2)||0) + (parseFloat(r.pc_p3)||0);
                const remBal = price - token - paidTotal;
                
                let pStatus = 'New Deal';
                if (price > 0) {
                  if (remBal <= 0) pStatus = 'Paid in Full';
                  else pStatus = 'Pending Payment';
                }
                

                return (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--or1)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.pclId||r.id?.slice(0,12)}</td>
                  <td style={{fontWeight:600,color:'var(--text2)'}}>{linkedInqId || '—'}</td>
                  <td>{fmtDate(closerDate)}</td>
                  <td>{dispName}</td>
                  <td className="plate">{dispRegn}</td>
                  <td>{dispVeh}</td>
                  <td className="amt-or">{fmt(price)}</td>
                  <td style={{color: 'var(--success)', fontWeight: 600}}>{fmt(token)}</td>
                  <td style={{color: remBal > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600}}>{fmt(remBal)}</td>
                  <td><span className={`badge ${pStatus === 'Paid in Full' ? 'suc' : pStatus === 'Pending Payment' ? 'wrn' : 'blu'}`}>{pStatus}</span></td>
                  <td><div className="act-grp">
                      <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                      <button className="btn-icon bi-next" style={{ background: remBal <= 0 ? 'var(--success)' : '#d1d5db', color: '#fff', opacity: remBal <= 0 ? 1 : 0.5, cursor: remBal <= 0 ? 'pointer' : 'not-allowed' }} disabled={remBal > 0} title={remBal <= 0 ? "Send to Stock" : "Clear balance before sending to stock"} onClick={() => remBal <= 0 && handleSendToStock(r)}><i className="fa fa-warehouse"></i></button>
                      <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              )}) : <tr><td colSpan="9" className="empty"><i className="fa fa-handshake"></i><br />{search?'No results found':'No purchase closer records yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCloser;

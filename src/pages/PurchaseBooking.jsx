import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { ObModal } from '../components/modals/ObModal';
import { DocModal } from '../components/modals/DocModal';
import { PayModal } from '../components/modals/PayModal';
import { DelModal } from '../components/modals/DelModal';
import { RcDetailsModal } from '../components/modals/RcDetailsModal';

const PurchaseBooking = () => {
  const { data, refresh } = useData();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.ob || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.ob, location.state?.autoOpenId]);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.ob || [];
  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      return (r.obId || '').toLowerCase().includes(q) ||
        (r.ob_inqid || r.inqId || '').toLowerCase().includes(q) ||
        (r.sellerName || r.ob_cname || r.ob_bname || '').toLowerCase().includes(q) ||
        (r.regNo || r.ob_regn || r.ob_vnum || '').toLowerCase().includes(q);
    }
    if (r.stage && r.stage.toLowerCase() !== 'orderbooking') return false;
    const inqId = r.ob_inqid || r.inqId || '';
    if (inqId && data.pcl?.some(p => p.pc_inqid === inqId || p.inqId === inqId)) return false;
    return true;
  });

  // Auto-fix missing IDs
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (!r.obId) {
          const cnt = await getNextCounter('ob');
          await updateRecord('ob', r.id, { obId: genId('OB', cnt) });
          fixed = true;
        }
      }
      if (fixed) refresh('ob');
    };
    if (records.length > 0) fixIds();
  }, [records]);

  const handleSave = async (formData) => {
    try {
      if (editRec) {
        await updateRecord('ob', editRec.id, formData);
        showToast('Updated!');
      } else {
        const cnt = await getNextCounter('ob');
        await addRecord('ob', { ...formData, obId: genId('OB', cnt), date: formData.ob_date || today() });
        showToast('Order booking added!');
      }
      await refresh('ob');
      setIsModalOpen(false);
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete this order booking?')) return;
    try {
      await deleteRecord('ob', rec.id);
      await refresh('ob');
      showToast('Deleted.', 'info');
    } catch (e) {
      showToast('Delete failed.', 'error');
    }
  };

  const handleSendToCloser = async (rec) => {
    if (!await window.confirm(`Send Order Booking for ${rec.ob_cname || 'this vehicle'} to Purchase Closer?`)) return;
    try {
      const cnt = await getNextCounter('pcl');
      const pclId = genId('PCL', cnt);
      
      // Resolve full details from linked inquiry
      const linkedInqId = rec.ob_inqid || rec.inqId || '';
      const linkedInq = linkedInqId ? (data.pur_inq || []).find(i => i.inqId === linkedInqId || i.id === linkedInqId) : null;
      
      const pclData = {
        pclId,
        pc_date: today(),
        status: 'Pending',
        stage: 'Closer',
        pc_inqid: linkedInqId,
        pc_sname: rec.ob_cname || linkedInq?.sellerName || rec.sellerName || rec.ob_bname || '',
        pc_veh: rec.ob_mm || (linkedInq ? `${linkedInq.make || ''} ${linkedInq.model || ''}`.trim() : '') || (rec.make ? `${rec.make} ${rec.model || ''}` : '') || '',
        pc_regn: rec.ob_regn || linkedInq?.regNo || rec.regNo || rec.ob_vnum || '',
        pc_price: rec.ob_pp || rec.pp || rec.tcp || ''
      };
      
      await addRecord('pcl', pclData);
      await updateRecord('ob', rec.id, { stage: 'Closer' });
      
      if (linkedInqId && linkedInq) {
        await updateRecord('pur_inq', linkedInq.id, { stage: 'Closer' });
        await refresh('pur_inq');
      }
      
      await refresh('pcl');
      await refresh('ob');
      showToast('Sent to Purchase Closer!');
    } catch (e) {
      showToast('Failed to send to Purchase Closer', 'error');
    }
  };

  const [quickModal, setQuickModal] = useState({ type: null, obId: null });
  const closeQuickModal = () => setQuickModal({ type: null, obId: null });

  const markShifted = async (targetStage, recId) => {
    const rec = data.ob.find(r => r.id === recId || r.obId === recId);
    if (rec) {
      try {
        await updateRecord('ob', rec.id, { stage: targetStage });
        await refresh('ob');
        if (targetStage === 'Documents') await refresh('doc');
        if (targetStage === 'Documents') await refresh('doc');
        if (targetStage === 'Payment') await refresh('pay');
        if (targetStage === 'Delivery') await refresh('del');
        showToast(`Shifted to ${targetStage}`);
        closeQuickModal();
      } catch (e) {
        showToast('Failed to shift', 'error');
      }
    }
  };

  const handlePrintRecord = (r) => {
    // Open the modal in edit mode and trigger print
    setEditRec(r);
    setIsModalOpen(true);
  };

  return (
    <div className="page on" id="pg_pur_booking">
      {toast && (
        <div className="toast-wrap">
          <div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}>
            <i className={`fa ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}`}></i>
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon"><i className="fa fa-file-pen"></i></div>
            Order Booking
          </h1>
          <p>Purchase order bookings — Client · Vehicle · Costs · Signatures</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search by name / reg / ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Booking</button>
        </div>
      </div>

      {isModalOpen && (
        <ObModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editData={editRec}
        />
      )}
      <DocModal
        isOpen={quickModal.type === 'doc'}
        onClose={closeQuickModal}
        onSuccess={() => markShifted('Documents', quickModal.obId)}
        quickObId={quickModal.obId}
      />
      <PayModal
        isOpen={quickModal.type === 'pay'}
        onClose={closeQuickModal}
        onSuccess={() => markShifted('Payment', quickModal.obId)}
        quickId={quickModal.obId}
        type="purchase"
      />
      <DelModal
        isOpen={quickModal.type === 'del'}
        onClose={closeQuickModal}
        onSuccess={() => markShifted('Delivery', quickModal.obId)}
        quickId={quickModal.obId}
      />
      <RcDetailsModal isOpen={quickModal.type === 'rc'} onClose={closeQuickModal} inqId={quickModal.inqId} />

      {/* KPI Strip */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi">
          <div className="kpi-icon"><i className="fa fa-file-pen" style={{ color: 'var(--or1)' }}></i></div>
          <div className="kpi-val">{records.length}</div>
          <div className="kpi-lbl">Total Bookings</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><i className="fa fa-indian-rupee-sign" style={{ color: 'var(--success)' }}></i></div>
          <div className="kpi-val" style={{ fontSize: 18 }}>
            {records.length ? fmt(records.reduce((s, r) => s + (Number(r.ob_pp) || Number(r.pp) || 0), 0)) : '—'}
          </div>
          <div className="kpi-lbl">Total Purchase Value</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><i className="fa fa-calculator" style={{ color: 'var(--bl5)' }}></i></div>
          <div className="kpi-val" style={{ fontSize: 18 }}>
            {records.length ? fmt(records.reduce((s, r) => s + (Number(r.tcp) || 0), 0)) : '—'}
          </div>
          <div className="kpi-lbl">Total Cost Price (TCP)</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon"><i className="fa fa-check-circle" style={{ color: 'var(--success)' }}></i></div>
          <div className="kpi-val">{records.filter(r => r.ob_doc_stat === 'Complete').length}</div>
          <div className="kpi-lbl">Docs Complete</div>
        </div>
      </div>

      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            Order Bookings
            <span style={{ background: 'var(--or1)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span>
          </div>
        </div>
        <div className="tbl-wrap">
          <table id="tbl_ob">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Inq ID</th>
                <th>Date</th>
                <th>Seller / Client</th>
                <th>Reg No.</th>
                <th>Vehicle</th>
                <th>Purchase Price</th>
                <th>TCP</th>
                <th>Doc Status</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const linkedInqId = r.ob_inqid || r.inqId || '';
                const linkedInq = linkedInqId ? (data.pur_inq || []).find(i => i.inqId === linkedInqId || i.id === linkedInqId) : null;
                const dispName = r.ob_cname || linkedInq?.sellerName || r.sellerName || r.ob_bname || '—';
                const dispRegn = r.ob_regn || linkedInq?.regNo || r.regNo || r.ob_vnum || '—';
                return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk',sans-serif" }}>
                    {r.obId || r.id?.slice(0, 12)}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {linkedInqId || '—'}
                  </td>
                  <td>{fmtDate(r.date || r.ob_date)}</td>
                  <td style={{ fontWeight: 600 }}>{dispName}</td>
                  <td style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
                    {dispRegn}
                  </td>
                  <td>
                    {(() => {
                      let mm = (r.ob_mm || '').trim() || (r.make ? `${r.make} ${r.model || ''}`.trim() : '');
                      if (!mm) {
                        const inqId = r.ob_inqid || r.inqId || '';
                        const cleanRegn = (s) => (s || '').replace(/[\s-]/g, '').toLowerCase();
                        const reg = cleanRegn(r.ob_regn || r.regNo);
                        const inq = (data.pur_inq || []).find(i => 
                          (inqId && (i.inqId || i.pi_inqid) === inqId) ||
                          (reg && cleanRegn(i.regNo || i.pi_regn) === reg)
                        );
                        if (inq) mm = `${inq.make || ''} ${inq.model || ''}`.trim();
                      }
                      return mm || '—';
                    })()}
                  </td>
                  <td className="amt-or">
                    {(() => {
                      let dispPrice = r.ob_pp || r.pp || '';
                      if (!dispPrice) {
                        const inqId = r.ob_inqid || r.inqId || '';
                        const cleanRegn = (s) => (s || '').replace(/[\s-]/g, '').toLowerCase();
                        const reg = cleanRegn(r.ob_regn || r.regNo);
                        const pfu = (data.pfu || []).find(p => {
                          if (inqId && (p.pf_inqid || '').toLowerCase() === inqId.toLowerCase()) return true;
                          if (reg) {
                            const pInq = (data.pur_inq || []).find(i => (i.inqId || i.pi_inqid) === p.pf_inqid);
                            if (pInq && cleanRegn(pInq.regNo || pInq.pi_regn) === reg) return true;
                          }
                          return false;
                        });
                        if (pfu && pfu.followUps && pfu.followUps.length > 0) {
                          for (let i = pfu.followUps.length - 1; i >= 0; i--) {
                            if (pfu.followUps[i].dealPrice) { dispPrice = pfu.followUps[i].dealPrice; break; }
                            else if (pfu.followUps[i].offer && !dispPrice) dispPrice = pfu.followUps[i].offer;
                          }
                        } 
                        if (!dispPrice && pfu) {
                          dispPrice = pfu.pf_close || pfu.pf_nego || pfu.pf_offer || '';
                        }
                      }
                      return fmt(dispPrice);
                    })()}
                  </td>
                  <td className="amt-or">{fmt(r.tcp || r.ob_tcp)}</td>
                  <td>
                    {(() => {
                      const cleanRegn = (s) => (s || '').replace(/[\s-]/g, '').toLowerCase();
                      let docRec = null;
                      const allDocs = data.doc || [];
                      for (const d of allDocs) {
                        if (r.obId && d.dc_obid === r.obId) { docRec = d; break; }
                        if (r.ob_inqid && d.dc_obid === r.ob_inqid) {
                          if (!docRec || docRec.dc_stat !== 'Complete') docRec = d;
                        }
                      }
                      if (!docRec && r.ob_regn) {
                        const reg = cleanRegn(r.ob_regn);
                        const regDocs = allDocs.filter(d => cleanRegn(d.dc_regn) === reg);
                        docRec = regDocs.find(d => d.dc_stat === 'Complete') || regDocs[regDocs.length - 1];
                      }
                      const stat = docRec ? (docRec.dc_stat || 'Pending') : (r.ob_doc_stat || 'Pending');
                      return (
                        <span className={`badge ${stat === 'Complete' ? 'b-won' : stat === 'Partial' ? 'b-prog' : 'b-pend'}`}>
                          {stat}
                        </span>
                      );
                    })()}
                  </td>
                  <td>{r.ob_branch || r.branch || 'SG Highway'}</td>
                  <td>
                    <div className="act-grp">
                      {(() => {
                        const inqRec = data.pur_inq?.find(p => p.inqId === (r.ob_inqid || r.inqId) || p.id === (r.ob_inqid || r.inqId));
                        const isRcEdited = inqRec?.rcEdited === true;
                        return (
                          <button className="btn-icon bi-edit" style={{ background: isRcEdited ? 'var(--border)' : 'var(--or1)', color: isRcEdited ? 'var(--text3)' : '#fff', cursor: isRcEdited ? 'not-allowed' : 'pointer' }} title={isRcEdited ? "RC Details Already Edited" : "Edit Customer Details (As per RC)"} onClick={() => { if (!isRcEdited) setQuickModal({ type: 'rc', inqId: r.ob_inqid || r.inqId }); }} disabled={isRcEdited}><i className="fa fa-id-card"></i></button>
                        );
                      })()}
                      <button className="btn-icon bi-print" title="Print Booking" onClick={() => handlePrintRecord(r)}>
                        <i className="fa fa-print"></i>
                      </button>
                      <button className="btn-icon bi-next" style={{ background: 'var(--bl5)', color: '#fff' }} title="Send to Purchase Closer" onClick={() => handleSendToCloser(r)}>
                        <i className="fa fa-handshake"></i>
                      </button>
                      <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}>
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : (
                <tr>
                  <td colSpan="11" className="empty">
                    <i className="fa fa-file-pen"></i><br />
                    {search ? 'No results found' : 'No order bookings yet. Click "Add Booking" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} of {records.length} bookings</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseBooking;

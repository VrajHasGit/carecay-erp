import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, statusBadge, ageDays } from '../utils/helpers';
import { PurInqModal } from '../components/modals/PurInqModal';

const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type === 'success' ? 'suc' : type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}>
    <i className={`fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
  </div>
);

const PurchaseInquiry = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.pur_inq || []).find(r => r.id === autoId);
    if (rec) { setEditRecord(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.pur_inq, location.state?.autoOpenId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const allInquiries = data.pur_inq || [];
  const inquiries = allInquiries.filter(r => !search && (!r.stage || r.stage === 'Inquiry') || search);

  const filtered = inquiries.filter(inq => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (inq.inqId || '').toLowerCase().includes(q) ||
      (inq.sellerName || '').toLowerCase().includes(q) ||
      (inq.regNo || '').toLowerCase().includes(q) ||
      (inq.mobile || '').includes(q) ||
      (inq.make || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || inq.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => { setEditRecord(null); setIsModalOpen(true); };
  const handleEdit = (rec) => { setEditRecord(rec); setIsModalOpen(true); };

  const handleSave = async (formData, shiftToValuation = false) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      const carLabel = `${formData.make || ''} ${formData.model || ''}`.trim();
      const targetStage = shiftToValuation ? 'Valuation' : (editRecord?.stage || 'Inquiry');
      
      let currentInqId = editRecord?.inqId;

      if (editRecord) {
        await updateRecord('pur_inq', editRecord.id, {
          ...formData,
          stage: targetStage,
          updatedBy: actor.name,
        }, {
          title: 'Purchase Inquiry Updated',
          message: `${formData.sellerName} — ${carLabel}`,
          link: '/purchase-inquiry',
          actor,
          carInfo: { make: formData.make, model: formData.model, regNo: formData.regNo },
        });
        showToast('Purchase inquiry updated!');
      } else {
        currentInqId = formData.inqId || genId('INQ', await getNextCounter('pur'));
        await addRecord('pur_inq', {
          ...formData,
          inqId: currentInqId,
          date: formData.date || today(),
          status: formData.status || 'New',
          createdBy: actor.name,
          updatedBy: actor.name,
          stage: targetStage,
        }, {
          title: 'New Purchase Inquiry',
          message: `${formData.sellerName} — ${carLabel}`,
          link: '/purchase-inquiry',
          actor,
          carInfo: { make: formData.make, model: formData.model, regNo: formData.regNo },
        });
        showToast('Purchase inquiry added!');
      }

      if (shiftToValuation) {
        const valCnt = await getNextCounter('val');
        const valId = genId('VAL', valCnt);
        await addRecord('val', {
          valId,
          v_inqid: currentInqId,
          v_date: today(),
          v_vnum: [formData.regState, formData.regRto, formData.regSeries, formData.regNum].filter(Boolean).join('-').toUpperCase(),
          v_cname: formData.sellerName || '',
          v_cont: formData.mobile || '',
          v_km: formData.km || '',
          v_make: formData.make || '',
          v_model: formData.model || '',
          v_var: formData.variant || '',
          v_year: formData.year || '',
          v_fuel: formData.fuel || '',
          v_own: formData.owners || '',
          v_rc: false, v_svc: false, v_acc: false, v_tyre: "Good", v_eng: "Good",
          v_ovr: "Good", v_stat: "Pending", v_nextfu: formData.nextFU || "", v_rem: formData.remarks || "",
          v_media: [],
          date: today(),
          stage: 'Valuation'
        });
        await refresh('val');
      }

      await refresh('pur_inq');
      setIsModalOpen(false);
    } catch (e) {
      showToast('Failed to save: ' + e.message, 'error');
    }
  };


  const handleDelete = async (rec) => {
    if (!await window.confirm(`Delete inquiry for ${rec.sellerName}?`)) return;
    try {
      await deleteRecord('pur_inq', rec.id);
      await refresh('pur_inq');
      showToast('Inquiry deleted.', 'info');
    } catch (e) {
      showToast('Delete failed.', 'error');
    }
  };

  const handleWhatsApp = (rec) => {
    const msg = encodeURIComponent(
      `Hello ${rec.sellerName}, we are following up regarding your ${rec.make} ${rec.model} (${rec.year}). Please let us know if you're still interested in selling. — Carecay`
    );
    window.open(`https://wa.me/91${rec.mobile}?text=${msg}`, '_blank');
  };

  const handleReminder = async (rec) => {
    const date = window.prompt(`Set Next Follow-Up Date for ${rec.sellerName} (YYYY-MM-DD):`, rec.nextFU || today());
    if (date) {
      try {
        await updateRecord('pur_inq', rec.id, { nextFU: date });
        await refresh('pur_inq');
        showToast(`Reminder set for ${date}`);
      } catch (e) {
        showToast('Failed to set reminder', 'error');
      }
    }
  };

  const handleShiftToValuation = async (inq) => {
    if (!await window.confirm(`Send ${inq.sellerName}'s inquiry to Valuation?`)) return;
    try {
      const valCnt = await getNextCounter('val');
      const valId = genId('VAL', valCnt);
      await addRecord('val', {
        valId,
        v_inqid: inq.inqId || inq.id,
        v_date: today(),
        v_vnum: inq.regNo || '',
        v_cname: inq.sellerName || '',
        v_cont: inq.mobile || '',
        v_make: inq.make || '',
        v_model: inq.model || '',
        v_var: inq.variant || '',
        v_year: inq.year || '',
        v_fuel: inq.fuel || '',
        v_km: inq.km || '',
        v_own: inq.owners || '',
        v_status: 'Scheduled',
        v_media: [],
        date: today(),
        stage: 'Valuation'
      });
      await updateRecord('pur_inq', inq.id, { stage: 'Valuation' });
      await refresh('val');
      await refresh('pur_inq');
      showToast('Sent to Valuation!');
    } catch (e) {
      showToast('Failed to send to valuation.', 'error');
    }
  };


  const exportToExcel = () => {
    const headers = ['Inquiry ID', 'Date', 'Source', 'Seller Name', 'Mobile', 'Make', 'Model', 'Variant', 'Year', 'Fuel', 'Trans', 'Color', 'KM', 'Owners', 'Reg No', 'Assigned', 'Status', 'Next FU'];
    const rows = filtered.map(r => [
      r.inqId || '', r.date || '', r.source || '', r.sellerName || '', r.mobile || '',
      r.make || '', r.model || '', r.variant || '', r.year || '', r.fuel || '', r.trans || '', r.color || '',
      r.km || '', r.owners || '', r.regNo || '', r.assigned || '', r.status || '', r.nextFU || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Purchase_Inquiries.csv'; a.click();
  };

  return (
    <div className="page on" id="pg_pur_inq">
      {toast && (
        <div className="toast-wrap">
          <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="ph">
        <div className="ph-left">
          <h1><div className="ph-icon"><i className="fa fa-car"></i></div> Purchase Inquiry</h1>
          <p>All purchase inquiries · {filtered.length} records</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search name / mobile / make…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="flt" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Closed-Won">Closed-Won</option>
            <option value="Closed-Lost">Closed-Lost</option>
            <option value="Hold">Hold</option>
          </select>
          <button className="btn btn-out btn-sm" onClick={exportToExcel}><i className="fa fa-file-csv"></i> Export</button>
          <button className="btn btn-or" onClick={handleAdd}><i className="fa fa-plus"></i> Add Inquiry</button>
        </div>
      </div>

      <PurInqModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRecord} />

      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            <i className="fa fa-car-side" style={{ color: 'var(--or1)' }}></i> Purchase Inquiries
            <span style={{ background: 'var(--or1)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span>
          </div>
        </div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table id="tbl_pur">
            <thead>
              <tr>
                <th>Inquiry ID</th>
                <th>Date</th>
                <th>Source</th>
                <th>Seller Name</th>
                <th>Mobile</th>
                <th>Make</th>
                <th>Model</th>
                <th>Variant</th>
                <th>Year</th>
                <th>Fuel</th>
                <th>Trans.</th>
                <th>Color</th>
                <th>KM</th>
                <th>Owners</th>
                <th>Reg No.</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Next FU</th>
                <th style={{ minWidth: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(inq => {
                const fuDays = inq.nextFU ? ageDays(inq.nextFU) : null;
                const isOverdue = fuDays !== null && inq.nextFU < today() && inq.status === 'In-Progress';
                return (
                  <tr key={inq.id} className={isOverdue ? 'doc-alert-row' : ''}>
                    <td><span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: 'var(--or1)' }}>{inq.inqId || inq.id?.slice(0, 12)}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inq.date)}</td>
                    <td>{inq.source}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{inq.sellerName}</td>
                    <td><a href={`tel:${inq.mobile}`} style={{ color: 'var(--info)', textDecoration: 'none' }}>{inq.mobile}</a></td>
                    <td style={{ fontWeight: 600 }}>{inq.make}</td>
                    <td>{inq.model}</td>
                    <td>{inq.variant || '—'}</td>
                    <td>{inq.year || '—'}</td>
                    <td>{inq.fuel || '—'}</td>
                    <td>{inq.trans || '—'}</td>
                    <td>{inq.color || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{inq.km ? `${Number(inq.km).toLocaleString('en-IN')} km` : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{inq.owners || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{inq.regNo || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{inq.assigned}</td>
                    <td><span className={`badge ${statusBadge(inq.status)}`}>{inq.status || 'New'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {inq.nextFU ? (
                        <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--text2)', fontWeight: isOverdue ? 700 : 400 }}>
                          {isOverdue && <i className="fa fa-exclamation-triangle" style={{ marginRight: 4 }}></i>}
                          {fmtDate(inq.nextFU)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="act-grp act-grp-3">
                        <button className="btn-icon bi-edit" title="Edit Inquiry" onClick={() => handleEdit(inq)}><i className="fa fa-pen"></i></button>
                        <button className="btn-icon" title="Setup Reminder" onClick={() => handleReminder(inq)} style={{ background: 'rgba(124,58,237,.1)', color: '#7C3AED' }}><i className="fa fa-bell"></i></button>
                        {inq.mobile && (
                          <button className="btn-icon btn-wa" title="WhatsApp" onClick={() => handleWhatsApp(inq)} style={{ background: '#25D366', color: '#fff' }}><i className="fa-brands fa-whatsapp"></i></button>
                        )}
                        <button className="btn-icon bi-next" title="Send to Valuation" onClick={() => handleShiftToValuation(inq)}><i className="fa fa-arrow-right"></i></button>
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(inq)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="19" className="empty"><i className="fa fa-search"></i><br />{search || statusFilter ? 'No results match your search' : 'No purchase inquiries yet. Click "Add Inquiry" to create one.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} of {inquiries.length} inquiries</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInquiry;

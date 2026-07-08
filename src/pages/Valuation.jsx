import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { ValModal } from '../components/modals/ValModal';

import { PclModal } from '../components/modals/PclModal';
import MediaViewer from '../components/MediaViewer';
import { loadMediaFromFirestore } from '../utils/uploadMedia';

const Valuation = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickModal, setQuickModal] = useState({ type: null, inqId: null });
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewer, setViewer] = useState(null); // { media: [], index: 0 }
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.val || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.val, location.state?.autoOpenId]);

  const records = data.val || [];
  const filtered = records.filter(r => {
    if (!search && r.stage && r.stage !== 'Valuation') return false;
    const q = search.toLowerCase();
    return !search ||
      (r.valId || '').toLowerCase().includes(q) ||
      (r.v_inqid || '').toLowerCase().includes(q) ||
      (r.sellerName || r.v_cname || '').toLowerCase().includes(q) ||
      (r.regNo || r.v_vnum || '').toLowerCase().includes(q) ||
      (r.make || r.v_make || '').toLowerCase().includes(q);
  });

  // Auto-fix missing IDs
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (!r.valId) {
          const cnt = await getNextCounter('val');
          await updateRecord('val', r.id, { valId: genId('VAL', cnt) });
          fixed = true;
        }
      }
      if (fixed) refresh('val');
    };
    if (records.length > 0) fixIds();
  }, [records]);

  const handleSave = async (formData, shiftToPfu = false) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      const carLabel = `${formData.make || formData.v_make || ''} ${formData.model || formData.v_model || ''}`.trim();
      let savedId = null;
      let newFormData = { ...formData };
      if (shiftToPfu) {
        newFormData.stage = 'Purchase FollowUp';
      }

      if (editRec) {
        await updateRecord('val', editRec.id, newFormData, {
          title: 'Valuation Updated',
          message: `${newFormData.sellerName || newFormData.v_cname || ''} — ${carLabel}`,
          link: '/valuation', actor,
          carInfo: { make: newFormData.make, model: newFormData.model, regNo: newFormData.regNo },
        });
        savedId = editRec.id;
        showToast('Valuation updated!');
      } else {
        const cnt = await getNextCounter('val');
        const valId = genId('VAL', cnt);
        savedId = await addRecord('val', { ...newFormData, valId, date: newFormData.date || today() }, {
          title: 'New Valuation',
          message: `${newFormData.sellerName || newFormData.v_cname || ''} — ${carLabel}`,
          link: '/valuation', actor,
          carInfo: { make: newFormData.make, model: newFormData.model, regNo: newFormData.regNo },
        });
        showToast('Valuation added!');
      }

      if (shiftToPfu) {
        const pfCnt = await getNextCounter('pfu');
        await addRecord('pfu', {
          pfId: genId('PFU', pfCnt),
          pf_inqid: newFormData.v_inqid || '',
          valId: savedId,
          pf_sname: newFormData.v_cname || newFormData.sellerName || '',
          pf_smob: newFormData.v_cont || newFormData.mobile || '',
          pf_veh: newFormData.v_make || '',
          pf_model: newFormData.v_model || '',
          pf_var: newFormData.v_var || '',
          pf_year: newFormData.v_year || '',
          pf_fuel: newFormData.v_fuel || 'Petrol',
          pf_km: newFormData.v_km || '',
          pf_own: newFormData.v_own || '1st',
          pf_date: today(),
          pf_stat: 'Interested',
          pf_seq: '1st Call',
          pf_mode: 'Call',
          pf_rem: newFormData.v_rem || ''
        });

        if (newFormData.v_inqid) {
          const inqRec = data.pur_inq?.find(r => r.inqId === newFormData.v_inqid);
          if (inqRec) {
            await updateRecord('pur_inq', inqRec.id, { stage: 'Purchase FollowUp' });
          }
        }
      }

      await refresh('val');
      if (shiftToPfu) { await refresh('pfu'); await refresh('pur_inq'); }
      setIsModalOpen(false);
      return savedId;
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };


  const handleDelete = async (rec) => {
    if (!await window.confirm(`Delete valuation?`)) return;
    try { await deleteRecord('val', rec.id); await refresh('val'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const valToFU = async (r) => {
    if (!await window.confirm(`Send ${r.sellerName || r.v_cname || 'this'}'s valuation to Purchase Follow-up?`)) return;
    try {
      const pfCnt = await getNextCounter('pfu');
      await addRecord('pfu', {
        pfId: genId('PFU', pfCnt),
        pf_inqid: r.v_inqid || '',
        valId: r.id,
        pf_sname: r.sellerName || r.v_cname || '',
        pf_smob: r.mobile || r.v_cont || '',
        pf_veh: r.make || r.v_make || '',
        pf_model: r.model || r.v_model || '',
        pf_var: r.variant || r.v_var || '',
        pf_year: r.year || r.v_year || '',
        pf_fuel: r.fuel || r.v_fuel || 'Petrol',
        pf_km: r.km || r.v_km || '',
        pf_own: r.owners || r.v_own || '1st',
        pf_date: today(),
        pf_stat: 'Interested',
        pf_seq: '1st Call',
        pf_mode: 'Call',
        pf_rem: r.remarks || r.v_rem || '',
        followUps: []
      });

      await updateRecord('val', r.id, { stage: 'Purchase FollowUp' });

      if (r.v_inqid) {
        const inqRec = data.pur_inq?.find(inq => inq.inqId === r.v_inqid);
        if (inqRec) {
          await updateRecord('pur_inq', inqRec.id, { stage: 'Purchase FollowUp' });
        }
      }
      
      await refresh('val');
      await refresh('pfu');
      await refresh('pur_inq');
      showToast('Sent to Purchase Follow-up!');
    } catch (e) {
      showToast('Failed to send: ' + e.message, 'error');
    }
  };

  const closeQuickModal = () => setQuickModal({ type: null, inqId: null, valId: null });

  const markShifted = async (targetStage, recId) => {
    const rec = data.val.find(r => r.id === recId || r.valId === recId);
    if (rec) {
      try {
        await updateRecord('val', rec.id, { stage: targetStage });
        await refresh('val');
        showToast(`Shifted to ${targetStage}`);
        closeQuickModal();
      } catch (e) {
        showToast('Failed to shift', 'error');
      }
    }
  };

  const openViewer = async (record) => {
    if (!record?.id) return;
    try {
      // Load from sub-collection (new approach)
      const subMedia = await loadMediaFromFirestore('val', record.id);
      
      // Fallback for older records where media was stored directly in the document
      const directMedia = Array.isArray(record.v_media) ? record.v_media : [];
      
      const allMedia = [...subMedia, ...directMedia.filter(m => m.url)];

      if (allMedia.length > 0) {
        setViewer({ media: allMedia, index: 0 });
      } else {
        showToast('No photos found. Try editing the record to add photos.', 'info');
      }
    } catch (e) {
      showToast('Failed to load media', 'error');
    }
  };

  return (
    <div className="page on" id="pg_valuation">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left">
          <h1><div className="ph-icon"><i className="fa fa-magnifying-glass-dollar"></i></div>Valuation</h1>
          <p>Vehicle valuation & price assessment</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Valuation</button>
        </div>
      </div>

      {isModalOpen && <ValModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <PclModal isOpen={quickModal.type === 'pcl'} onClose={closeQuickModal} onSuccess={() => markShifted('Closer', quickModal.valId)} quickInqId={quickModal.inqId} />

      {/* Media Viewer Lightbox */}
      {viewer && (
        <MediaViewer
          media={viewer.media}
          index={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}

      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Valuation Records <span style={{ background: 'var(--or1)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span></div></div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Val ID</th><th>Inq ID</th><th>Date</th><th>Seller</th><th>Vehicle</th><th>Reg No.</th><th>Fuel & KM</th><th>Condition</th><th>Media</th><th>Remarks</th><th style={{ minWidth: 160 }}>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const mediaCount = r.v_media_count || (r.v_media || []).length;
                return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.valId || r.id?.slice(0, 12)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text2)' }}>{r.v_inqid || '—'}</td>
                  <td>{fmtDate(r.date || r.v_date)}</td>
                  <td style={{ fontWeight: 600 }}>{r.sellerName || r.v_cname}</td>
                  <td>{r.make || r.v_make} {r.model || r.v_model} ({r.year || r.v_year})</td>
                  <td style={{ fontWeight: 600 }}>{r.regNo || r.v_vnum || '—'}</td>
                  <td>{r.v_fuel || '—'} <br/><span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.v_km ? r.v_km + ' km' : '—'}</span></td>
                  <td>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>Eng: {r.v_eng || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>Tyre: {r.v_tyre || '—'}</div>
                  </td>
                  <td>
                    {mediaCount > 0 ? (
                      <span
                        className="media-badge media-badge-has"
                        onClick={() => openViewer(r)}
                        title={`View ${mediaCount} file${mediaCount > 1 ? 's' : ''}`}
                      >
                        <i className="fa fa-images"></i> {mediaCount}
                      </span>
                    ) : (
                      <span className="media-badge media-badge-none">
                        <i className="fa fa-image" style={{ opacity: 0.5 }}></i> 0
                      </span>
                    )}
                    {r.v_vid_link && (
                      <a href={r.v_vid_link} target="_blank" rel="noreferrer" className="media-badge media-badge-has" style={{ marginLeft: 6, background: 'rgba(239,68,68,.15)', color: '#EF4444', textDecoration: 'none' }} title="Play Video">
                        <i className="fa fa-play"></i>
                      </a>
                    )}
                  </td>
                  <td>{r.remarks || r.v_rem || '—'}</td>
                    <td>
                      <div className="act-grp">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                        <button className="btn-icon bi-next" title="Send to Purchase Follow-up" onClick={() => valToFU(r)}><i className="fa fa-arrow-right"></i></button>
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                </tr>
                );
              }) : (
                <tr><td colSpan="10" className="empty"><i className="fa fa-magnifying-glass-dollar"></i><br />{search ? 'No results found' : 'No valuation records yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Valuation;


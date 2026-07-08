import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { SfuModal } from '../components/modals/SfuModal';

const SalesFollowUp = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const [sentIds, setSentIds] = useState(new Set());
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data.sfu || [];

  // Auto-fix missing IDs
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (!r.sfuId) {
          const cnt = await getNextCounter('sfu');
          await updateRecord('sfu', r.id, { sfuId: genId('SFU', cnt) });
          fixed = true;
        }
      }
      if (fixed) refresh('sfu');
    };
    if (records.length > 0) fixIds();
  }, [records]);

  const getLastFu = (r) => (r.followUps && r.followUps.length > 0) ? r.followUps[r.followUps.length - 1] : r;

  const filtered = records.filter(r => {
    if (sentIds.has(r.id)) return false;
    const isWon = r.sf_stat === 'Closed-Won' || r.status === 'Closed-Won';
    if (isWon) return false;

    if (search) {
      const q = search.toLowerCase();
      return (r.sfuId || '').toLowerCase().includes(q) ||
        (r.sf_stkid || '').toLowerCase().includes(q) ||
        (r.sf_cname || r.buyerName || '').toLowerCase().includes(q) ||
        (r.sf_mob || r.mobile || '').includes(q) ||
        (r.sf_regn || r.regNo || '').toLowerCase().includes(q) ||
        (r.sf_make || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      const vehicle = `${fd.sf_make || ''} ${fd.sf_model || ''}`.trim();
      if (editRec) { await updateRecord('sfu', editRec.id, fd, { title: 'Sales Follow-Up Updated', message: (fd.sf_cname || '') + ' — ' + vehicle, link: '/sales-follow', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('sfu'); await addRecord('sfu', { ...fd, sfuId: genId('SFU', cnt), date: fd.date || today() }, { title: 'Sales Follow-Up Added', message: (fd.sf_cname || '') + ' — ' + vehicle, link: '/sales-follow', actor }); showToast('Follow-up added!'); }
      await refresh('sfu'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete this follow-up record?')) return;
    try { await deleteRecord('sfu', rec.id); await refresh('sfu'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleWA = (r) => {
    const vehicle = r.sf_make ? ` regarding the ${r.sf_make} ${r.sf_model || ''}` : '';
    const m = encodeURIComponent(`Hello ${r.sf_cname || r.buyerName}, following up on your car inquiry${vehicle} at Carecay.`);
    window.open(`https://wa.me/91${r.sf_mob || r.mobile}?text=${m}`, '_blank');
  };

  const handleSendToBooking = async (rec) => {
    if (!await window.confirm(`Send ${rec.sf_cname || rec.buyerName} to Sales Order Booking?`)) return;
    try {
      // Immediately remove from the list (optimistic UI)
      setSentIds(prev => new Set([...prev, rec.id]));

      // Update follow-up status
      await updateRecord('sfu', rec.id, { sf_stat: 'Closed-Won' });

      // Auto-create order booking record
      const exists = rec.sf_inqid ? data.sob?.find(p => p.sob_sinid === rec.sf_inqid) : false;
      if (!exists) {
        const cnt = await getNextCounter('sob');
        await addRecord('sob', {
          sobId: genId('SOB', cnt),
          sob_sinid: rec.sf_inqid || '',
          sob_stkid: rec.sf_stkid || '',
          sob_cname: rec.sf_cname || rec.buyerName || '',
          sob_cont: rec.sf_mob || rec.mobile || '',
          sob_mm: [rec.sf_make, rec.sf_model].filter(Boolean).join(' '),
          sob_year: rec.sf_year || '',
          sob_regn: rec.sf_regn || '',
          sob_saleprice: rec.sf_budget || '',
          sob_date: today(),
          status: 'Pending',
        });
      }

      // Update parent inquiry status
      const inqRec = data.sal_inq?.find(i => i.salId === rec.sf_inqid);
      if (inqRec) await updateRecord('sal_inq', inqRec.id, { status: 'Closed-Won' });

      showToast('Sent to Sales Order Booking! 📋 Navigating...');
      await refresh('sfu');
      await refresh('sob');
      await refresh('sal_inq');
      setTimeout(() => navigate('/sales-booking'), 800);
    } catch (e) {
      showToast('Failed to send to order booking.', 'error');
    }
  };


  // KPIs
  const interested = records.filter(r => r.sf_stat === 'Interested').length;
  const callback = records.filter(r => r.sf_stat === 'Callback').length;
  const won = records.filter(r => r.sf_stat === 'Closed-Won').length;
  const overdue = records.filter(r => {
    const lastFu = getLastFu(r);
    const nfd = lastFu.nfd || r.sf_nfd;
    return nfd && nfd < today() && r.sf_stat !== 'Closed-Won' && lastFu.stat !== 'Closed-Won' && r.sf_stat !== 'Closed-Lost';
  }).length;

  return (
    <div className="page on" id="pg_sal_follow">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}><i className="fa fa-comments"></i></div>Sales Follow-Up</h1><p>Follow-up on sales inquiries and buyer contacts</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search buyer / stock ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Follow-Up</button>
        </div>
      </div>
      {isModalOpen && <SfuModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} onSendToBooking={handleSendToBooking} />}

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-heart', val: interested, lbl: 'Interested', color: '#4A7CDE' },
          { icon: 'fa-phone-flip', val: callback, lbl: 'Callback', color: '#F59E0B' },
          { icon: 'fa-handshake', val: won, lbl: 'Closed Won', color: '#22C55E' },
          { icon: 'fa-triangle-exclamation', val: overdue, lbl: 'Overdue F/U', color: '#EF4444' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      <div className="tc">
        <div className="tc-hdr"><div className="tc-title"><i className="fa fa-comments" style={{ color: 'var(--warn)' }}></i> Sales Follow-Ups <span style={{ background: 'var(--bl5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span></div></div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table id="tbl_sfu">
            <thead><tr><th>ID</th><th>Inq ID</th><th>Stock ID</th><th>Date</th><th>Buyer</th><th>Mobile</th><th>Vehicle</th><th>Status</th><th>Next F/U</th><th>Notes</th><th style={{ minWidth: 180 }}>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const lastFu = getLastFu(r);
                const nfd = lastFu.nfd || r.sf_nfd;
                const isOverdue = nfd && nfd < today() && r.sf_stat !== 'Closed-Won' && lastFu.stat !== 'Closed-Won' && r.sf_stat !== 'Closed-Lost' && r.sf_stat !== 'Not Interested';
                return (
                  <tr key={r.id} className={isOverdue ? 'doc-alert-row' : ''}>
                    <td style={{ fontWeight: 700, color: 'var(--bl5)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.sfuId || r.id?.slice(0, 12)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text2)' }}>{r.sf_inqid || '—'}</td>
                    <td>
                      {r.sf_stkid ? (
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#059669', fontSize: 10, background: 'rgba(5,150,105,.1)', padding: '2px 8px', borderRadius: 10 }}>{r.sf_stkid}</span>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(lastFu.date || r.date)}</td>
                    <td style={{ fontWeight: 600 }}>{r.sf_cname || r.buyerName}</td>
                    <td><a href={`tel:${r.sf_mob || r.mobile}`} style={{ color: 'var(--info)', textDecoration: 'none' }}>{r.sf_mob || r.mobile}</a></td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>{r.sf_make || ''} {r.sf_model || ''} {r.sf_year ? `(${r.sf_year})` : ''}</td>
                    <td><span className={`badge ${statusBadge(lastFu.stat || r.sf_stat || r.status)}`}>{lastFu.stat || r.sf_stat || r.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {nfd ? (
                        <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--text2)', fontWeight: isOverdue ? 700 : 400 }}>
                          {isOverdue && <i className="fa fa-exclamation-triangle" style={{ marginRight: 4 }}></i>}
                          {fmtDate(nfd)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text3)' }}>{lastFu.rem || r.sf_rem || r.notes || '—'}</td>
                    <td>
                      <div className="act-grp">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                        <button className="btn-icon bi-next" title="Send to Order Booking" onClick={() => handleSendToBooking(r)}><i className="fa fa-clipboard-list"></i></button>
                        {(r.sf_mob || r.mobile) && <button className="btn-icon" title="WhatsApp" onClick={() => handleWA(r)} style={{ background: '#25D366', color: '#fff' }}><i className="fa-brands fa-whatsapp"></i></button>}
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="11" className="empty"><i className="fa fa-comments"></i><br />{search ? 'No results found' : 'No follow-up records yet. Click "Add Follow-Up" to create one.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} of {records.length} follow-ups</span>
        </div>
      </div>
    </div>
  );
};
export default SalesFollowUp;

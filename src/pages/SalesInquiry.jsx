import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { SalInqModal } from '../components/modals/SalInqModal';
import { exportToExcel } from '../utils/exportData';

const PAGE_SIZE = 20;

/* ── Stage Tab definitions ───────────────────────── */
const STAGES = [
  { id: '', label: 'All' },
  { id: 'New', label: 'New' },
  { id: 'In-Progress', label: 'Follow-Up' },
  { id: 'Negotiation', label: 'Negotiation' },
  { id: 'Closed-Won', label: 'Won' },
  { id: 'Closed-Lost', label: 'Lost' },
  { id: 'Hold', label: 'Hold' },
];
const SOURCES = ['Walk-in', 'Phone', 'Website', 'OLX', 'Referral', 'WhatsApp', 'Social Media'];

/* ── Pagination ──────────────────────────────────── */
function Paginate({ total, page, setPage }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const nums = [...Array(pages).keys()].map(i => i + 1);
  return (
    <div className="pagination">
      <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
      {nums.filter(n => n === 1 || n === pages || Math.abs(n - page) <= 2).map((n, i, arr) => (
        <React.Fragment key={n}>
          {i > 0 && arr[i - 1] !== n - 1 && <span style={{ color: 'var(--text3)', padding: '0 4px' }}>…</span>}
          <button className={`pg-btn ${page === n ? 'on' : ''}`} onClick={() => setPage(n)}>{n}</button>
        </React.Fragment>
      ))}
      <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
    </div>
  );
}

const SalesInquiry = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const inquiries = data.sal_inq || [];

  // Stage counts for tabs
  const stageCounts = useMemo(() => {
    const counts = { '': inquiries.length };
    STAGES.slice(1).forEach(s => { counts[s.id] = inquiries.filter(r => r.status === s.id).length; });
    return counts;
  }, [inquiries]);

  const filtered = useMemo(() => {
    return inquiries.filter(inq => {
      if (inq.stage && inq.stage !== 'Inquiry') return false;
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (inq.buyerName || '').toLowerCase().includes(q) ||
        (inq.mobile || '').includes(q) ||
        (inq.salId || '').toLowerCase().includes(q) ||
        (inq.makePref || '').toLowerCase().includes(q) ||
        (inq.linkedStock || '').toLowerCase().includes(q);
      const matchStage = !activeStage || inq.status === activeStage;
      const matchSource = !sourceFilter || inq.source === sourceFilter;
      return matchSearch && matchStage && matchSource;
    });
  }, [inquiries, search, activeStage, sourceFilter]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const handleSave = async (formData) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRecord) { await updateRecord('sal_inq', editRecord.id, { ...formData, updatedBy: actor.name }); showToast('Sales inquiry updated!'); }
      else {
        const salId = formData.salId || genId('SIN', await getNextCounter('sal'));
        await addRecord('sal_inq', { ...formData, salId, date: formData.date || today(), status: formData.status || 'New', createdBy: actor.name, updatedBy: actor.name }, { title: 'New Sales Inquiry', message: (formData.buyerName || '') + ' — ' + (formData.makePref || '') + ' ' + (formData.model || ''), link: '/sales-inquiry', actor });
        showToast('Sales inquiry added!');
      }
      await refresh('sal_inq'); setIsModalOpen(false);
    } catch (e) { showToast('Failed to save: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm(`Delete inquiry for ${rec.buyerName}?\n\nThis cannot be undone.`)) return;
    try { await deleteRecord('sal_inq', rec.id); await refresh('sal_inq'); showToast('Inquiry deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleWhatsApp = (rec) => {
    const vehicle = rec.linkedStock ? ` We have a ${rec.makePref || ''} ${rec.model || ''} ready for you.` : '';
    const msg = encodeURIComponent(`Hello ${rec.buyerName}, thank you for your interest at Carecay.${vehicle} Please visit or call us!`);
    window.open(`https://wa.me/91${rec.mobile}?text=${msg}`, '_blank');
  };

  const handleSetFU = async (rec) => {
    const date = window.prompt(`Set Next Follow-Up Date for ${rec.buyerName} (YYYY-MM-DD):`, rec.nextFU || today());
    if (date) {
      try { await updateRecord('sal_inq', rec.id, { nextFU: date }); await refresh('sal_inq'); showToast(`Reminder set for ${date}`); }
      catch (e) { showToast('Failed.', 'error'); }
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) return showToast('No data to export.', 'info');
    const rows = filtered.map(r => ({
      'Inquiry ID': r.salId, 'Date Received': r.date, 'Customer Name': r.buyerName,
      Phone: r.mobile, Email: r.email || '', 'Interested In': r.makePref || '',
      'Linked Stock ID': r.linkedStock || '', Source: r.source, 'Budget (INR)': r.budget,
      'Assigned To': r.assignedTo || '', Stage: r.status, 'Last Contact Date': r.lastContact || '',
      'Next Follow-Up Date': r.nextFU || '', 'Interactions Count': (r.timeline || []).length,
    }));
    exportToExcel(rows, `sales_inquiries_${today()}.xlsx`);
  };

  const handleShiftToFollowUp = async (inq) => {
    if (!await window.confirm(`Send ${inq.buyerName}'s inquiry to Sales Follow-Up?`)) return;
    try {
      const cnt = await getNextCounter('sfu');
      await addRecord('sfu', {
        sfuId: genId('SFU', cnt),
        sf_inqid: inq.salId || inq.id,
        sf_stkid: inq.linkedStock || '',
        sf_cname: inq.buyerName || '',
        sf_mob: inq.mobile || '',
        sf_make: inq.makePref || '',
        sf_model: inq.model || '',
        sf_year: inq.yearFrom || inq.yearTo || '',
        sf_budget: inq.budget || '',
        sf_fuel: inq.fuel && inq.fuel !== 'Any' ? inq.fuel : '',
        sf_exec: inq.assigned || 'Ritesh Shah',
        sf_stat: 'Interested',
        followUps: [],
        date: today(),
        stage: 'Follow-Up',
      });
      await updateRecord('sal_inq', inq.id, { stage: 'Follow-Up' });
      await refresh('sfu');
      await refresh('sal_inq');
      showToast('Sent to Sales Follow-Up!');
    } catch (e) {
      showToast('Failed to send to follow-up.', 'error');
    }
  };

  // KPI strip
  const newCount = inquiries.filter(r => r.status === 'New').length;
  const inProgress = inquiries.filter(r => r.status === 'In-Progress').length;
  const wonCount = inquiries.filter(r => r.status === 'Closed-Won').length;
  const overdueFU = inquiries.filter(r => r.nextFU && r.nextFU < today() && r.status !== 'Closed-Won' && r.status !== 'Closed-Lost').length;
  const linkedCount = inquiries.filter(r => r.linkedStock).length;

  return (
    <div className="page on" id="pg_sal_inq">
      {toast && (
        <div className="toast-wrap">
          <div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}>
            <i className="fa fa-check-circle"></i>
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="ph">
        <div className="ph-left">
          <h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#2563EB,#4A7CDE)' }}><i className="fa fa-tag"></i></div>Sales Inquiry</h1>
          <p>Buyer pipeline · Budget · Preferred vehicle · Follow-up tracking</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search buyer / mobile / stock ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="flt" value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}>
            <option value="">All Sources</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-out btn-sm" onClick={handleExport}><i className="fa fa-file-csv"></i> Export</button>
          <button className="btn btn-or" onClick={() => { setEditRecord(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Inquiry</button>
        </div>
      </div>

      <SalInqModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRecord} />

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-sparkles', val: newCount, lbl: 'New Inquiries', color: '#4A7CDE' },
          { icon: 'fa-phone-volume', val: inProgress, lbl: 'In Follow-Up', color: '#F59E0B' },
          { icon: 'fa-handshake', val: wonCount, lbl: 'Closed Won', color: '#22C55E' },
          { icon: 'fa-link', val: linkedCount, lbl: 'Linked to Stock', color: '#059669' },
          { icon: 'fa-triangle-exclamation', val: overdueFU, lbl: 'Overdue Follow-Ups', color: '#EF4444' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Stage Tabs */}
      <div className="stage-tabs">
        {STAGES.map(s => (
          <button key={s.id} className={`stage-tab ${activeStage === s.id ? 'active' : ''}`}
            onClick={() => { setActiveStage(s.id); setPage(1); }}>
            {s.label}
            <span className="stage-count">{stageCounts[s.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title"><i className="fa fa-tags" style={{ color: 'var(--bl5)' }}></i> Sales Inquiries
            <span style={{ background: 'var(--bl5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span>
          </div>
          <div className="tc-acts" style={{ fontSize: 11, color: 'var(--text3)' }}>
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
        </div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table id="tbl_sal">
            <thead>
              <tr>
                <th>Inq ID</th><th>Date</th><th>Source</th><th>Buyer Name</th><th>Mobile</th>
                <th>Budget</th><th>Interest</th><th>Stock ID</th><th>Stage</th><th>Next F/U</th>
                <th>Timeline</th><th style={{ minWidth: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(inq => {
                const isOverdue = inq.nextFU && inq.nextFU < today() && inq.status !== 'Closed-Won' && inq.status !== 'Closed-Lost';
                const timelineCount = (inq.timeline || []).length;
                return (
                  <tr key={inq.id} className={isOverdue ? 'doc-alert-row' : ''}>
                    <td style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: 'var(--bl5)' }}>{inq.salId || inq.id?.slice(0, 12)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inq.date)}</td>
                    <td>{inq.source ? <span className="badge b-info" style={{ fontSize: 9 }}>{inq.source}</span> : '—'}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{inq.buyerName}</td>
                    <td><a href={`tel:${inq.mobile}`} style={{ color: 'var(--info)', textDecoration: 'none' }}>{inq.mobile}</a></td>
                    <td className="amt-or">{fmt(inq.budget)}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 11 }}>
                      {(inq.carPrefs && inq.carPrefs.length > 0)
                        ? inq.carPrefs.map(p => `${p.make || ''} ${p.model || ''}`.trim()).filter(Boolean).join(', ') || '—'
                        : `${inq.makePref || '—'} ${inq.model || ''}`}
                    </td>
                    <td>
                      {inq.linkedStock ? (
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#059669', fontSize: 10, background: 'rgba(5,150,105,.1)', padding: '2px 8px', borderRadius: 10 }}>{inq.linkedStock}</span>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 10 }}>Not linked</span>}
                    </td>
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
                      {timelineCount > 0 ? (
                        <span style={{ background: 'rgba(74,124,222,.1)', color: 'var(--bl5)', fontWeight: 700, padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>
                          {timelineCount} {timelineCount === 1 ? 'entry' : 'entries'}
                        </span>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 10 }}>No log</span>}
                    </td>
                    <td>
                      <div className="act-grp act-grp-3">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRecord(inq); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                        <button className="btn-icon bi-next" title="Send to Sales Follow-Up" onClick={() => handleShiftToFollowUp(inq)}><i className="fa fa-arrow-right"></i></button>
                        <button className="btn-icon" title="Set Follow-Up Reminder" onClick={() => handleSetFU(inq)} style={{ background: 'rgba(124,58,237,.1)', color: '#7C3AED' }}><i className="fa fa-bell"></i></button>
                        {inq.mobile && (
                          <button className="btn-icon btn-wa" title="WhatsApp" onClick={() => handleWhatsApp(inq)}
                            style={{ background: '#25D366', color: '#fff' }}>
                            <i className="fa-brands fa-whatsapp"></i>
                          </button>
                        )}
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(inq)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="12" className="empty">
                  <i className="fa fa-search"></i><br />
                  {search || activeStage || sourceFilter ? 'No inquiries match your filters.' : 'No sales inquiries yet. Click "Add Inquiry" to create one.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} of {inquiries.length} inquiries</span>
          <Paginate total={filtered.length} page={page} setPage={setPage} />
        </div>
      </div>
    </div>
  );
};

export default SalesInquiry;

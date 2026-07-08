import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, ageDays } from '../utils/helpers';
import { WsModal } from '../components/modals/WsModal';
import { exportToExcel } from '../utils/exportData';
import CustomSelect from '../components/CustomSelect';

const PAGE_SIZE = 20;

/* ── Paginate ────────────────────────────────────── */
function Paginate({ total, page, setPage }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
      {[...Array(pages).keys()].map(i => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 2).map((n, i, arr) => (
        <React.Fragment key={n}>
          {i > 0 && arr[i - 1] !== n - 1 && <span style={{ color: 'var(--text3)', padding: '0 4px' }}>…</span>}
          <button className={`pg-btn ${page === n ? 'on' : ''}`} onClick={() => setPage(n)}>{n}</button>
        </React.Fragment>
      ))}
      <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
    </div>
  );
}

const Workshop = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const isManager = ['admin', 'manager', 'partner'].includes((currentUser?.role || '').toLowerCase());

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [certifyRec, setCertifyRec] = useState(null);
  const [certifyStatus, setCertifyStatus] = useState('Pending');
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.ws || [];
  const stock = data.stk || [];

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (r.wsId || '').toLowerCase().includes(q) ||
      (r.ws_inqid || r.inqId || '').toLowerCase().includes(q) ||
      (r.ws_vnum || r.regNo || '').toLowerCase().includes(q) ||
      (r.ws_cname || r.customerName || '').toLowerCase().includes(q) ||
      (r.ws_make || r.make || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (r.ws_jstat || r.jStat) === statusFilter;
    return matchSearch && matchStatus;
  }), [records, search, statusFilter]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const activeCount = records.filter(r => ['Open', 'In Process'].includes(r.ws_jstat || r.jStat)).length;
  const doneCount = records.filter(r => (r.ws_jstat || r.jStat) === 'Complete').length;
  const totalCost = records.filter(r => (r.ws_jstat || r.jStat) !== 'Complete').reduce((s, r) => s + (parseFloat(r.total || (Number(r.ws_pc || 0) + Number(r.ws_lc || 0))) || 0), 0);
  const avgAge = (() => {
    const active = records.filter(r => (r.ws_jstat || r.jStat) !== 'Complete' && (r.date || r.ws_indate));
    if (!active.length) return 0;
    return Math.round(active.reduce((s, r) => s + ageDays(r.date || r.ws_indate), 0) / active.length);
  })();

  const chartData = useMemo(() => {
    const counts = {};
    records.filter(r => (r.ws_jstat || r.jStat) !== 'Complete').forEach(r => {
      const type = r.ws_wtype || r.jobType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const PIE_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#6366F1'];

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('ws', editRec.id, fd, { title: 'Workshop Job Updated', message: (fd.ws_vnum || fd.regNo || '') + ' — ' + (fd.ws_make || fd.make || '') + ' ' + (fd.ws_model || fd.model || ''), link: '/workshop', actor }); showToast('Updated!'); }
      else { 
        let wsId = fd.wsId;
        if (!wsId) {
          const cnt = await getNextCounter('ws'); 
          wsId = genId('JC', cnt);
        }
        await addRecord('ws', { ...fd, wsId, date: fd.ws_indate || fd.date || today(), tasks: fd.tasks || [] }, { title: 'Workshop Job Created', message: (fd.ws_vnum || fd.regNo || '') + ' — ' + (fd.ws_wtype || fd.jobType || ''), link: '/workshop', actor }); 
        showToast('Workshop job added!'); 
      }
      await refresh('ws'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm(`Delete job ${rec.wsId} for ${rec.regNo}?`)) return;
    try { await deleteRecord('ws', rec.id); await refresh('ws'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleReadyToList = (rec) => {
    setCertifyRec(rec);
    setCertifyStatus('Pending');
  };

  const handleCertifySubmit = async () => {
    const rec = certifyRec;
    if (certifyStatus === 'Yes') {
      // Send to Car Stock as Ready for Sale
      const stkRec = stock.find(s => s.regNo === (rec.ws_vnum || rec.regNo) || s.stkId === (rec.ws_stkid || rec.linkedStk));
      if (stkRec) {
        try {
          await updateRecord('stk', stkRec.id, { status: 'Ready for Sale', certified: 'Yes', refurbDone: today() });
          await refresh('stk');
          showToast(`${rec.ws_vnum || rec.regNo} is now listed as "Ready for Sale" in Stock! ✨`);
        } catch (e) { showToast('Failed to update stock.', 'error'); setCertifyRec(null); return; }
      } else {
        showToast(`No matching stock record found for ${rec.ws_vnum || rec.regNo}.`, 'info');
      }
      try {
        await deleteRecord('ws', rec.id);
        await refresh('ws');
      } catch (e) { showToast('Failed to finalize workshop record.', 'error'); }
    } else {
      // Stay in Workshop — just save certification status
      try {
        await updateRecord('ws', rec.id, { certified: certifyStatus });
        await refresh('ws');
        showToast(`Certification set to "${certifyStatus}" — car remains in Workshop.`, 'info');
      } catch (e) { showToast('Failed to save certification.', 'error'); }
    }
    setCertifyRec(null);
  };

  const handleExport = () => {
    if (filtered.length === 0) return showToast('No data to export.', 'info');
    const rows = filtered.map(r => ({
      'Job ID': r.wsId, 'Date': r.date || r.ws_indate, 'Reg No': r.ws_vnum || r.regNo, Make: r.ws_make || r.make, Model: r.ws_model || r.model,
      'Total Cost (INR)': r.total || (Number(r.ws_pc || 0) + Number(r.ws_lc || 0)), 'Technician': r.ws_tech || r.tech || '',
      Status: r.ws_jstat || r.jStat, Notes: r.ws_rem || r.notes || '',
    }));
    exportToExcel(rows, `workshop_jobs_${today()}.xlsx`);
  };

  return (
    <div className="page on" id="pg_workshop">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}

      <div className="ph">
        <div className="ph-left">
          <h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}><i className="fa fa-screwdriver-wrench"></i></div>Workshop / Refurb</h1>
          <p>Vehicle workshop jobs · Task checklists · Ready-to-list cross-update</p>
        </div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search reg / make…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <CustomSelect className="flt" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
            <option value="">All Status</option>
            <option value="Open">Open</option><option value="In Process">In Process</option><option value="Complete">Complete</option>
          </CustomSelect>
          <button className="btn btn-out btn-sm" onClick={handleExport}><i className="fa fa-file-csv"></i> Export</button>
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Job</button>
        </div>
      </div>

      {isModalOpen && <WsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}

      {/* ── Certification Modal ── */}
      {certifyRec && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '400px', borderRadius: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'certSlideIn .2s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Space Grotesk',sans-serif" }}>
                <i className="fa fa-certificate" style={{ color: 'var(--or1)' }}></i> Certify Vehicle
              </h3>
              <button onClick={() => setCertifyRec(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: 'rgba(232,93,4,0.07)', border: '1px solid rgba(232,93,4,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 8 }}>
                <i className="fa fa-car" style={{ color: 'var(--or1)', marginTop: 2 }}></i>
                <span><strong style={{ color: 'var(--text)' }}>{certifyRec.ws_vnum || certifyRec.regNo}</strong> — {certifyRec.ws_make || certifyRec.make} {certifyRec.ws_model || certifyRec.model}</span>
              </div>
              <div className="fg">
                <label>Certified Status</label>
                <CustomSelect value={certifyStatus} onChange={e => setCertifyStatus(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="Pending">⏳ Pending</option>
                  <option value="Yes">✅ Yes — Send to Car Stock</option>
                  <option value="No">❌ No — Keep in Workshop</option>
                </CustomSelect>
              </div>
              {certifyStatus === 'Yes' && (
                <div style={{ marginTop: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#059669', display: 'flex', gap: 6 }}>
                  <i className="fa fa-circle-check"></i>
                  <span>Car will be moved to <strong>Car Stock</strong> as <strong>Ready for Sale</strong> and removed from Workshop.</span>
                </div>
              )}
              {certifyStatus !== 'Yes' && (
                <div style={{ marginTop: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#B45309', display: 'flex', gap: 6 }}>
                  <i className="fa fa-clock"></i>
                  <span>Car will <strong>remain in Workshop</strong>. Certification status will be saved.</span>
                </div>
              )}
            </div>
            <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setCertifyRec(null)} style={{ padding: '9px 20px', borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleCertifySubmit} style={{ padding: '9px 20px', borderRadius: 9, background: certifyStatus === 'Yes' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,var(--or1),var(--or2))', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                {certifyStatus === 'Yes' ? '🚀 Send to Stock' : '💾 Save Status'}
              </button>
            </div>
          </div>
          <style>{`@keyframes certSlideIn { from { opacity:0; transform:scale(.92) translateY(-10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-tools', val: activeCount, lbl: 'Active Jobs', color: '#F59E0B' },
          { icon: 'fa-circle-check', val: doneCount, lbl: 'Completed', color: '#22C55E' },
          { icon: 'fa-clock', val: `${avgAge}d`, lbl: 'Avg Job Age', color: '#4A7CDE' },
          { icon: 'fa-indian-rupee-sign', val: fmt(totalCost), lbl: 'Active Job Cost', color: '#C8A84B' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val" style={{ fontSize: k.icon === 'fa-indian-rupee-sign' ? 13 : undefined }}>{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      {chartData.length > 0 && (
        <div className="tc" style={{ marginBottom: 16 }}>
          <div className="tc-hdr">
            <div className="tc-title">📊 Active Jobs by Type</div>
          </div>
          <div style={{ height: 250, width: '100%', padding: '10px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            <i className="fa fa-screwdriver-wrench" style={{ color: 'var(--warn)' }}></i> Workshop Jobs
            <span style={{ background: 'var(--warn)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{activeCount} Active</span>
          </div>
          <div className="tc-acts" style={{ fontSize: 11, color: 'var(--text3)' }}>
            {`${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </div>
        </div>
        <div className="tbl-wrap">
          <table id="tbl_ws">
            <thead>
              <tr>
                <th>Job ID</th><th>Inq ID</th><th>Date</th><th>Reg No.</th><th>Vehicle</th>
                <th>Total Cost</th><th>Status</th><th>Notes</th>
                <th style={{ minWidth: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(r => {
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--warn)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.wsId || `JC-${String(Array.from(r.id || '').reduce((a,c) => a + c.charCodeAt(0), 0)).padStart(4, '0')}`}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text2)' }}>{r.ws_inqid || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.date || r.ws_indate)}</td>
                      <td style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: 'var(--or1)' }}>{r.ws_vnum || r.regNo}</td>
                      <td>{r.ws_make || r.make} {r.ws_model || r.model}</td>
                      <td className="amt-or">{fmt(r.total || (Number(r.ws_pc || 0) + Number(r.ws_lc || 0)))}</td>
                      <td><span className={`badge ${(r.ws_jstat || r.jStat) === 'Open' ? 'b-open' : (r.ws_jstat || r.jStat) === 'In Process' ? 'b-prog' : 'b-complete'}`}>{r.ws_jstat || r.jStat}</span></td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.ws_prob || r.ws_rem || r.notes}>{r.ws_prob || r.ws_rem || r.notes || '—'}</td>
                      <td>
                        <div className="act-grp">
                          <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                          {isManager && !r.readyToList && (
                            <button className="btn-icon" title="Finalize & Release to Showroom" onClick={() => handleReadyToList(r)}
                              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 2px 6px rgba(16,185,129,0.1)' }}>
                              <i className="fa fa-wand-magic-sparkles"></i>
                            </button>
                          )}
                          {r.readyToList && <span title="Listed in Stock" style={{ color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center' }}><i className="fa fa-circle-check"></i></span>}
                          <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              }) : (
                <tr><td colSpan="9" className="empty">
                  <i className="fa fa-screwdriver-wrench"></i><br />
                  {search || statusFilter ? 'No results found.' : 'No workshop jobs yet. Click "Add Job" to begin.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} jobs</span>
          <Paginate total={filtered.length} page={page} setPage={setPage} />
        </div>
      </div>
    </div>
  );
};

export default Workshop;

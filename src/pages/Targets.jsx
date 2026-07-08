import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmt } from '../utils/helpers';
import { TgtModal } from '../components/modals/TgtModal';

const MONTHS = (() => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}-${d.getFullYear()}`;
    months.push(key);
  }
  return months;
})();

const Targets = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.targets || [];
  const monthRecords = useMemo(() => records.filter(r => r.month === selectedMonth), [records, selectedMonth]);

  // Compute actuals from live data
  const purActual = useMemo(() => {
    const purInq = data.pur_inq || [];
    return purInq.filter(r => r.status === 'Closed-Won').length;
  }, [data]);

  const salActual = useMemo(() => {
    const salInq = data.sal_inq || [];
    return salInq.filter(r => r.status === 'Closed-Won').length;
  }, [data]);

  const revActual = useMemo(() => {
    const scl = data.scl || [];
    return scl.reduce((a, r) => a + (parseFloat(r.final) || 0), 0);
  }, [data]);

  const collectionActual = useMemo(() => {
    const pay = data.pay || [];
    return pay.reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);
  }, [data]);

  // Summary targets from records
  const summary = useMemo(() => {
    const totals = { purTarget: 0, salTarget: 0, revTarget: 0, collTarget: 0 };
    monthRecords.forEach(r => {
      totals.purTarget += parseFloat(r.purTarget) || 0;
      totals.salTarget += parseFloat(r.salTarget) || 0;
      totals.revTarget += parseFloat(r.revTarget) || 0;
      totals.collTarget += parseFloat(r.collTarget) || 0;
    });
    return totals;
  }, [monthRecords]);

  const pct = (actual, target) => target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;

  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('targets', editRec.id, fd, { title: 'Target Updated', message: (fd.userName || fd.name || '') + ' — ' + (fd.month || ''), link: '/targets', actor }); showToast('Target updated!'); }
      else {
        const cnt = await getNextCounter('TGT');
        await addRecord('targets', { ...fd, tgtId: genId('TGT', cnt), date: fd.date || today(), month: fd.month || selectedMonth }, { title: 'Target Set', message: (fd.userName || fd.name || '') + ' — ' + (fd.month || selectedMonth || ''), link: '/targets', actor });
        showToast('Target added!');
      }
      await refresh('targets'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete target?')) return;
    try { await deleteRecord('targets', rec.id); await refresh('targets'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const summaryItems = [
    { lbl: 'PURCHASE CLOSURES', icon: 'fa-car-side', color: '#E85D04', target: summary.purTarget, actual: purActual, unit: '' },
    { lbl: 'SALES CLOSURES', icon: 'fa-trophy', color: '#059669', target: summary.salTarget, actual: salActual, unit: '' },
    { lbl: 'REVENUE (₹)', icon: 'fa-sack-dollar', color: '#7C3AED', target: summary.revTarget, actual: revActual, unit: '₹' },
    { lbl: 'COLLECTION (₹)', icon: 'fa-wallet', color: '#0891B2', target: summary.collTarget, actual: collectionActual, unit: '₹' },
  ];

  return (
    <div className="page on" id="pg_targets">
      {toast && (
        <div className="toast-wrap">
          <div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}>
            <span style={{ flex: 1 }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
              <i className="fa fa-bullseye"></i>
            </div>
            Targets & Achievements
          </h1>
          <p>Monthly targets vs actual — Sales · Purchase · Revenue · Collection</p>
        </div>
        <div className="ph-actions">
          <select className="flt" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {isModalOpen && (
        <TgtModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editData={editRec}
        />
      )}

      {/* Summary Progress Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {summaryItems.map((s, i) => {
          const p = pct(s.actual, s.target);
          const fmt_n = (v) => s.unit === '₹' ? `₹${Number(v).toLocaleString('en-IN')}` : v;
          return (
            <div key={i} className="tgt-card">
              <div className="tgt-head">
                <div className="tgt-title">
                  <i className={`fa ${s.icon}`} style={{ color: s.color, marginRight: 6 }}></i>
                  {s.lbl}
                </div>
                <div className="tgt-pct" style={{ color: p >= 100 ? 'var(--success)' : p >= 60 ? 'var(--warn)' : 'var(--danger)' }}>
                  {p}%
                </div>
              </div>
              <div className="tgt-bar-track">
                <div
                  className="tgt-bar-fill"
                  style={{
                    width: `${p}%`,
                    background: p >= 100 ? 'var(--success)' : p >= 60
                      ? 'linear-gradient(90deg,#F59E0B,#D97706)'
                      : `linear-gradient(90deg,${s.color},${s.color}cc)`,
                  }}
                />
              </div>
              <div className="tgt-nums">
                <span>Actual: <b>{fmt_n(s.actual)}</b></span>
                <span>Target: <b>{s.target > 0 ? fmt_n(s.target) : '—'}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team-wise Target vs Achievement table */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            <i className="fa fa-users" style={{ color: 'var(--or1)', marginRight: 6 }}></i>
            Team-wise Target vs Achievement — {selectedMonth}
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Pur Target</th>
                <th>Pur Actual</th>
                <th>Sal Target</th>
                <th>Sal Actual</th>
                <th>Rev Target ₹</th>
                <th>Rev Actual ₹</th>
                <th>Achievement %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.length > 0 ? monthRecords.map(r => {
                // Compute actuals for this specific employee
                const empPurActual = (data.pur_inq || []).filter(x => x.assigned === r.employee && x.status === 'Closed-Won').length;
                const empSalActual = (data.sal_inq || []).filter(x => x.assigned === r.employee && x.status === 'Closed-Won').length;
                const empRevActual = (data.scl || []).filter(x => x.assigned === r.employee || x.doneBy === r.employee)
                                                      .reduce((a, x) => a + (parseFloat(x.final) || 0), 0);
                const totalTarget = (parseFloat(r.purTarget) || 0) + (parseFloat(r.salTarget) || 0);
                const totalActual = empPurActual + empSalActual;
                const achPct = totalTarget > 0 ? Math.min(100, Math.round(totalActual / totalTarget * 100)) : 0;

                return (
                  <tr key={r.id}>
                    <td><b>{r.employee || '—'}</b></td>
                    <td>{r.role || '—'}</td>
                    <td>{r.branch || '—'}</td>
                    <td>{r.purTarget || '—'}</td>
                    <td style={{ color: empPurActual >= (r.purTarget || 0) ? 'var(--success)' : 'var(--warn)', fontWeight: 700 }}>{empPurActual}</td>
                    <td>{r.salTarget || '—'}</td>
                    <td style={{ color: empSalActual >= (r.salTarget || 0) ? 'var(--success)' : 'var(--warn)', fontWeight: 700 }}>{empSalActual}</td>
                    <td className="amt-or">{r.revTarget ? fmt(r.revTarget) : '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(empRevActual)}</td>
                    <td>
                      <b style={{ color: achPct >= 100 ? 'var(--success)' : achPct >= 60 ? 'var(--warn)' : 'var(--danger)' }}>
                        {achPct}%
                      </b>
                    </td>
                    <td>
                      <div className="act-grp">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}>
                          <i className="fa fa-pen"></i>
                        </button>
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}>
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="11" className="empty">
                    <i className="fa fa-bullseye"></i><br />No targets set for {selectedMonth}. Click "Set Target" to add.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Targets;

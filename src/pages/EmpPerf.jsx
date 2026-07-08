import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { fmt, initials } from '../utils/helpers';

// Role colour classes matching CSS
const roleClass = (role) => {
  const map = {
    Admin: 'role-admin', Partner: 'role-partner', Manager: 'role-manager',
    Closer: 'role-closer', Executive: 'role-executive', Sales: 'role-sales',
    Valuator: 'role-valuator', Workshop: 'role-workshop',
  };
  return map[role] || 'role-sales';
};

const EmpPerf = () => {
  const { data } = useData();

  const users = data.users || [];
  const purInqData = data.pur_inq || [];
  const salInqData = data.sal_inq || [];
  const pclData = data.pcl || [];
  const sclData = data.scl || [];

  const empData = useMemo(() => {
    return users
      .filter(u => (u.status === 'Active' || u.status === undefined) && u.role !== 'Admin' && !u.isTest)
      .map(u => {
        const name = u.name;
        const purInq = purInqData.filter(r => r.assigned === name).length;
        const salInq = salInqData.filter(r => r.assigned === name).length;
        const purDeals = pclData.filter(r => (r.doneBy === name || r.assigned === name) && r.status === 'Confirmed').length;
        const salDeals = sclData.filter(r => (r.doneBy === name || r.assigned === name) && r.status === 'Confirmed').length;
        const deals = purDeals + salDeals;
        const rev = sclData.filter(r => r.doneBy === name || r.assigned === name)
                           .reduce((a, r) => a + (parseFloat(r.final) || 0), 0)
                    + pclData.filter(r => r.doneBy === name || r.assigned === name)
                             .reduce((a, r) => a + (parseFloat(r.agreedPrice) || 0), 0);
        const total = purInq + salInq || 1;
        const conv = Math.round((deals / total) * 100);
        return { id: u.id, name, role: u.role || 'Staff', purInq, salInq, deals, rev, conv };
      });
  }, [data]);

  return (
    <div className="page on" id="pg_empperf">
      {/* Page Header */}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' }}>
              <i className="fa fa-user-tie"></i>
            </div>
            Employee Performance
          </h1>
          <p>Sales team performance — Inquiries · Deals · Revenue · Conversion</p>
        </div>
      </div>

      {/* Employee Performance Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, marginBottom: 20 }}>
        {empData.length > 0 ? empData.map((e, i) => (
          <div key={i} className="emp-perf-card">
            <div className="emp-avatar-lg">{initials(e.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{e.name}</div>
              <div style={{ marginTop: 3 }}>
                <span className={`role-pill ${roleClass(e.role)}`}>{e.role}</span>
              </div>
            </div>
            <div className="emp-stat">
              <div className="emp-stat-v">{e.deals}</div>
              <div className="emp-stat-l">DEALS</div>
            </div>
            <div className="emp-stat">
              <div className="emp-stat-v" style={{ fontSize: 13 }}>{fmt(e.rev).replace('₹', '')}</div>
              <div className="emp-stat-l">REV ₹</div>
            </div>
            <div className="emp-stat">
              <div className="emp-stat-v" style={{ color: e.conv > 50 ? 'var(--success)' : 'var(--warn)' }}>
                {e.conv}%
              </div>
              <div className="emp-stat-l">CONV.</div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1/-1' }}>
            <div className="tc">
              <div className="empty" style={{ padding: 48 }}>
                <i className="fa fa-user-tie" style={{ fontSize: 36, color: 'var(--border2)', display: 'block', marginBottom: 12 }}></i>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>No employees yet</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Add users in User Management to see performance data.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Performance Table */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            <i className="fa fa-table-columns" style={{ color: 'var(--or1)', marginRight: 6 }}></i>
            Detailed Performance Table
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Pur Inq</th>
                <th>Sal Inq</th>
                <th>Deals</th>
                <th>Revenue ₹</th>
                <th>Conversion %</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {empData.length > 0 ? empData.map((e, i) => (
                <tr key={i}>
                  <td><b>{e.name}</b></td>
                  <td><span className={`role-pill ${roleClass(e.role)}`}>{e.role}</span></td>
                  <td>{e.purInq}</td>
                  <td>{e.salInq}</td>
                  <td><b>{e.deals}</b></td>
                  <td className="amt-or">{fmt(e.rev)}</td>
                  <td>
                    <b style={{ color: e.conv > 50 ? 'var(--success)' : 'var(--warn)' }}>{e.conv}%</b>
                  </td>
                  <td style={{ color: '#F59E0B' }}>
                    {'★'.repeat(Math.min(5, Math.max(1, Math.round(e.conv / 20))))}
                    {'☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(1, Math.round(e.conv / 20)))))}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="empty">
                    <i className="fa fa-chart-line"></i><br />No employee data available
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

export default EmpPerf;

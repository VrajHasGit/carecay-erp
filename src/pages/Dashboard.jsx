import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../contexts/DataContext';
import { fmt, fmtDate, ageDays } from '../utils/helpers';

const Dashboard = () => {
  const { data, loading } = useData();
  const navigate = useNavigate();

  const kpis = useMemo(() => {
    const stk = data.stk || [];
    const pur_inq = data.pur_inq || [];
    const sal_inq = data.sal_inq || [];
    const scl = data.scl || [];
    const pcl = data.pcl || [];
    const ws = data.ws || [];

    const inStock = stk.filter(r => r.status === 'In Stock').length;
    const totalRevenue = scl.reduce((a, r) => a + (r.final || 0), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const mthRevenue = scl
      .filter(r => (r.date || '').startsWith(thisMonth))
      .reduce((a, r) => a + (r.final || 0), 0);
    const pendingPur = pur_inq.filter(r => r.status === 'In-Progress').length;
    const pendingSal = sal_inq.filter(r => r.status === 'In-Progress').length;
    const totalPendFU = pur_inq.filter(r => r.stage !== 'Closed' && r.fu).length + sal_inq.filter(r => r.stage !== 'Closed' && r.fu).length;
    const wsOpen = ws.filter(r => (r.ws_jstat || r.jStat) === 'Open' || (r.ws_jstat || r.jStat) === 'In Process').length;
    const totalDeals = scl.length + pcl.length;
    const avgAge = stk.length > 0
      ? Math.round(stk.reduce((a, r) => a + ageDays(r.pDate), 0) / stk.length)
      : 0;

    return { inStock, totalRevenue, mthRevenue, pendingPur, pendingSal, totalPendFU, wsOpen, totalDeals, avgAge };
  }, [data]);

  const recentPurInq = useMemo(() => (data.pur_inq || []).slice(-5).reverse(), [data.pur_inq]);
  const recentSalInq = useMemo(() => (data.sal_inq || []).slice(-5).reverse(), [data.sal_inq]);

  const KPI_COLORS = [
    'linear-gradient(135deg,#059669,#10B981)',
    'linear-gradient(135deg,#0891B2,#06B6D4)',
    'linear-gradient(135deg,#7C3AED,#8B5CF6)',
    'linear-gradient(135deg,#D97706,#F59E0B)',
    'linear-gradient(135deg,#DC2626,#EF4444)',
    'linear-gradient(135deg,#1A56DB,#2563EB)',
    'linear-gradient(135deg,#065F46,#059669)',
    'linear-gradient(135deg,#9D174D,#EC4899)',
  ];

  const kpiCards = [
    { icon: 'fa fa-warehouse', val: kpis.inStock, lbl: 'Vehicles in Stock', trend: '+3 this week', up: true, link: '/stock' },
    { icon: 'fa fa-sack-dollar', val: fmt(kpis.mthRevenue), lbl: 'Revenue (MTD)', trend: fmt(kpis.totalRevenue) + ' total', up: true, link: '/reports' },
    { icon: 'fa fa-car-side', val: kpis.pendingPur, lbl: 'Active Purchase Inq', trend: 'In-Progress', up: null, link: '/purchase-inquiry' },
    { icon: 'fa fa-tags', val: kpis.pendingSal, lbl: 'Active Sales Inq', trend: 'In-Progress', up: null, link: '/sales-inquiry' },
    { icon: 'fa fa-handshake', val: kpis.totalDeals, lbl: 'Deals Closed', trend: 'All time', up: true, link: '/sales-closer' },
    { icon: 'fa fa-screwdriver-wrench', val: kpis.wsOpen, lbl: 'Workshop Jobs (Open)', trend: 'Active jobs', up: null, link: '/workshop' },
    { icon: 'fa fa-clock', val: `${kpis.avgAge}d`, lbl: 'Avg. Stock Age', trend: 'Days in inventory', up: kpis.avgAge < 45, link: '/stock' },
    { icon: 'fa fa-indian-rupee-sign', val: fmt(kpis.totalRevenue), lbl: 'Total Revenue', trend: 'All time', up: true, link: '/reports' },
  ];

  const chartData = useMemo(() => {
    const months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.toISOString().slice(0, 7);
      months[m] = { name: m, Sales: 0, Purchases: 0 };
    }
    (data.scl || []).forEach(r => {
      const m = (r.date || '').slice(0, 7);
      if (months[m]) months[m].Sales += parseFloat(r.final || 0);
    });
    (data.pcl || []).forEach(r => {
      const m = (r.date || '').slice(0, 7);
      if (months[m]) months[m].Purchases += parseFloat(r.agreedPrice || 0);
    });
    return Object.values(months).map(m => ({
      ...m,
      name: new Date(m.name + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })
    }));
  }, [data]);

  return (
    <div className="page on" id="pg_dashboard">
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon"><i className="fa fa-chart-pie"></i></div>
            Dashboard
          </h1>
          <p>Live overview of your dealership operations</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out btn-sm" onClick={() => window.print()}>
            <i className="fa fa-print"></i> Print
          </button>
          <button className="btn btn-or btn-sm" onClick={() => navigate('/purchase-inquiry')}>
            <i className="fa fa-plus"></i> New Inquiry
          </button>
        </div>
      </div>

      {/* WhatsApp Bulk Follow-up Banner */}
      {kpis.totalPendFU > 0 && (
        <div className="s12-wa-banner" onClick={() => alert(`Redirecting to WhatsApp Bulk Sender for ${kpis.totalPendFU} pending follow-ups...`)}>
          <span className="s12-wa-banner-icon">📱</span>
          <div className="s12-wa-banner-body">
            <div className="s12-wa-banner-title">WhatsApp Bulk Follow-Up</div>
            <div className="s12-wa-banner-sub">{kpis.totalPendFU} active inquiry customer{kpis.totalPendFU > 1 ? 's' : ''} pending follow-up</div>
          </div>
          <span className="s12-wa-banner-badge">{kpis.totalPendFU} Pending</span>
          <button className="s12-wa-banner-btn"><i className="fa-brands fa-whatsapp"></i> Send Follow-ups</button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid" id="kpiGrid">
        {kpiCards.map((k, i) => (
          <div
            key={i}
            className="kpi"
            style={{ background: KPI_COLORS[i % KPI_COLORS.length], border: 'none', cursor: 'pointer' }}
            onClick={() => navigate(k.link)}
          >
            <div className="kpi-icon" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <i className={k.icon}></i>
            </div>
            <div className="kpi-val" style={{ color: '#fff' }}>
              {loading ? '…' : k.val}
            </div>
            <div className="kpi-lbl" style={{ color: 'rgba(255,255,255,0.75)' }}>{k.lbl}</div>
            {k.trend && (
              <div className="kpi-trend" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {k.up === true && <i className="fa fa-arrow-trend-up"></i>}
                {k.up === false && <i className="fa fa-arrow-trend-down"></i>}
                {' '}{k.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      <div className="tc" style={{ marginBottom: 20 }}>
        <div className="tc-hdr">
          <div className="tc-title">📊 Revenue & Purchases (6 Months)</div>
        </div>
        <div style={{ height: 300, width: '100%', padding: '20px 20px 0 0' }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border2)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} tick={{ fontSize: 12, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => fmt(v)} cursor={{ fill: 'var(--border)' }} contentStyle={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }} />
              <Bar dataKey="Sales" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Purchases" fill="var(--or1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Tables */}
      <div className="dash-grid">
        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title">📥 Recent Purchase Inquiries</div>
            <div className="tc-acts">
              <button className="btn btn-out btn-sm" onClick={() => navigate('/purchase-inquiry')}>
                View All
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="qt">
              <thead>
                <tr>
                  <th>ID</th><th>Date</th><th>Seller</th><th>Vehicle</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurInq.length > 0 ? recentPurInq.map(r => (
                  <tr key={r.id} onClick={() => navigate('/purchase-inquiry')} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--or1)', fontWeight: 600 }}>{r.inqId || r.id?.slice(0, 10)}</td>
                    <td>{fmtDate(r.date)}</td>
                    <td>{r.sellerName}</td>
                    <td>{r.make} {r.model}</td>
                    <td><span className={`badge b-${(r.status || 'new').toLowerCase().replace(' ', '-').replace('-', '')}`}>{r.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="empty"><i className="fa fa-inbox"></i><br />No purchase inquiries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title">🏷 Recent Sales Inquiries</div>
            <div className="tc-acts">
              <button className="btn btn-out btn-sm" onClick={() => navigate('/sales-inquiry')}>
                View All
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="qt">
              <thead>
                <tr>
                  <th>ID</th><th>Buyer</th><th>Budget</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSalInq.length > 0 ? recentSalInq.map(r => (
                  <tr key={r.id} onClick={() => navigate('/sales-inquiry')} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--bl5)', fontWeight: 600 }}>{r.salId || r.id?.slice(0, 10)}</td>
                    <td>{r.buyerName}</td>
                    <td>{fmt(r.budget)}</td>
                    <td><span className={`badge b-${(r.status || 'new').toLowerCase().replace(' ', '-').replace('-', '')}`}>{r.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="empty"><i className="fa fa-inbox"></i><br />No sales inquiries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">🚗 Car Stock Overview</div>
          <div className="tc-acts">
            <button className="btn btn-or btn-sm" onClick={() => navigate('/stock')}>
              <i className="fa fa-warehouse"></i> View Stock
            </button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="qt">
            <thead>
              <tr>
                <th>Reg No.</th><th>Make/Model</th><th>Year</th><th>KM</th><th>TCP</th><th>Selling Price</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.stk || []).slice(0, 5).map(r => (
                <tr key={r.id} onClick={() => navigate('/stock')} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk', sans-serif" }}>{r.regNo}</td>
                  <td>{r.make} {r.model} {r.variant}</td>
                  <td>{r.year}</td>
                  <td>{r.km ? `${Number(r.km).toLocaleString('en-IN')} km` : '—'}</td>
                  <td className="amt-or">{fmt(r.tcp)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(r.sp)}</td>
                  <td><span className={`badge b-${(r.status || 'new').toLowerCase().replace(' ', '')}`}>{r.status}</span></td>
                </tr>
              ))}
              {(data.stk || []).length === 0 && (
                <tr><td colSpan="7" className="empty"><i className="fa fa-car-side"></i><br />No stock records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

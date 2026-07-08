import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { fmt, fmtDate, statusBadge } from '../utils/helpers';

const PurchaseDashboard = () => {
  const { data } = useData();
  const navigate = useNavigate();
  const pur = data.pur_inq || [];
  const val = data.val || [];
  const pcl = data.pcl || [];
  const stk = data.stk || [];
  const ws = data.ws || [];
  const pay = data.pay || [];

  const stats = useMemo(() => ({
    total: pur.length,
    newInq: pur.filter(r => r.status === 'New').length,
    inProgress: pur.filter(r => r.status === 'In-Progress').length,
    won: pur.filter(r => r.status === 'Closed-Won').length,
    lost: pur.filter(r => r.status === 'Closed-Lost').length,
    stock: stk.filter(r => r.status === 'In Stock').length,
    wsOpen: ws.filter(r => (r.ws_jstat || r.jStat) === 'Open' || (r.ws_jstat || r.jStat) === 'In Process').length,
    valCount: val.length,
    totalPurchase: pcl.reduce((a, r) => a + (parseFloat(r.agreedPrice) || 0), 0),
    totalPaid: pay.filter(r => r.type === 'purchase').reduce((a, r) => a + (parseFloat(r.amount) || 0), 0),
    totalWSCost: ws.reduce((a, r) => a + (parseFloat(r.ws_est || r.total || (Number(r.ws_pc || 0) + Number(r.ws_lc || 0))) || 0), 0),
    avgPurchase: pcl.length > 0 ? pcl.reduce((a, r) => a + (parseFloat(r.agreedPrice) || 0), 0) / pcl.length : 0,
  }), [data]);

  const recentInq = useMemo(() => pur.slice(-5).reverse(), [pur]);
  const recentVal = useMemo(() => val.slice(-5).reverse(), [val]);
  const recentPcl = useMemo(() => pcl.slice(-5).reverse(), [pcl]);
  const wsJobs = useMemo(() => ws.filter(r => (r.ws_jstat || r.jStat) === 'Open' || (r.ws_jstat || r.jStat) === 'In Process').slice(0, 5), [ws]);
  const stockList = useMemo(() => stk.filter(r => r.status === 'In Stock' || r.status === 'Refurb').slice(0, 8), [stk]);

  const ageDays = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  };

  const ageBadge = (days) => {
    if (days <= 30) return <span className="age-0">{days}d</span>;
    if (days <= 60) return <span className="age-31">{days}d</span>;
    if (days <= 90) return <span className="age-61">{days}d</span>;
    return <span className="age-91">{days}d</span>;
  };

  return (
    <div className="page on" id="pg_pur_dashboard">
      {/* Page Header */}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
              <i className="fa fa-cart-flatbed-suitcase"></i>
            </div>
            Purchase Dashboard
          </h1>
          <p>Purchase pipeline live overview — Inquiries · Valuation · Closers · Stock</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out btn-sm" onClick={() => window.location.reload()}>
            <i className="fa fa-rotate"></i> Refresh
          </button>
          <button className="btn btn-or" onClick={() => navigate('/purchase-inquiry')}>
            <i className="fa fa-plus"></i> New Inquiry
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {[
          { icon: 'fa-car-side', val: stats.total, lbl: 'Total Inquiries', color: '#E85D04', link: '/purchase-inquiry' },
          { icon: 'fa-hourglass-half', val: stats.inProgress, lbl: 'In-Progress', color: '#D97706', link: '/purchase-inquiry' },
          { icon: 'fa-check-circle', val: stats.won, lbl: 'Closed Won', color: '#059669', link: '/purchase-closer' },
          { icon: 'fa-magnifying-glass-dollar', val: stats.valCount, lbl: 'Valuations', color: '#7C3AED', link: '/valuation' },
          { icon: 'fa-warehouse', val: stats.stock, lbl: 'In Stock', color: '#1A56DB', link: '/stock' },
          { icon: 'fa-screwdriver-wrench', val: stats.wsOpen, lbl: 'WS Open Jobs', color: '#0891B2', link: '/workshop' },
          { icon: 'fa-handshake', val: pcl.length, lbl: 'Purchase Deals', color: '#065F46', link: '/purchase-closer' },
          { icon: 'fa-times-circle', val: stats.lost, lbl: 'Closed Lost', color: '#DC2626', link: '/purchase-inquiry' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ background: `linear-gradient(135deg, ${k.color}, ${k.color}bb)`, border: 'none', cursor: 'pointer' }} onClick={() => navigate(k.link)}>
            <div className="kpi-icon" style={{ color: 'rgba(255,255,255,.8)' }}><i className={`fa ${k.icon}`}></i></div>
            <div className="kpi-val" style={{ color: '#fff' }}>{k.val}</div>
            <div className="kpi-lbl" style={{ color: 'rgba(255,255,255,.75)' }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* P&L Summary Row */}
      <div className="pl-grid" style={{ gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'TOTAL PURCHASE VALUE', val: fmt(stats.totalPurchase), color: 'var(--or1)' },
          { lbl: 'TOTAL PAYMENTS MADE', val: fmt(stats.totalPaid), color: 'var(--success)' },
          { lbl: 'WORKSHOP COST', val: fmt(stats.totalWSCost), color: 'var(--warn)' },
          { lbl: 'AVG PURCHASE PRICE', val: fmt(stats.avgPurchase), color: 'var(--info)' },
        ].map((p, i) => (
          <div key={i} className="pl-card">
            <div className="pl-val" style={{ color: p.color }}>{p.val}</div>
            <div className="pl-lbl">{p.lbl}</div>
          </div>
        ))}
      </div>

      {/* Recent Inquiries + Recent Valuations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title">📋 Recent Purchase Inquiries</div>
            <div className="tc-acts">
              <button className="btn btn-or btn-sm" onClick={() => navigate('/purchase-inquiry')}>View All</button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>Seller</th><th>Vehicle</th><th>Status</th><th>Next FU</th></tr></thead>
              <tbody>
                {recentInq.length > 0 ? recentInq.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase-inquiry')}>
                    <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>{r.inqId || r.id?.slice(0, 10)}</td>
                    <td style={{ fontWeight: 600 }}>{r.sellerName}</td>
                    <td>{r.make} {r.model}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                    <td style={{ color: 'var(--text3)' }}>{r.nextFU ? fmtDate(r.nextFU) : '—'}</td>
                  </tr>
                )) : <tr><td colSpan="5" className="empty">No inquiries yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title"><i className="fa fa-magnifying-glass-chart" style={{ color: 'var(--or1)', marginRight: 6 }}></i>Recent Valuations</div>
            <div className="tc-acts">
              <button className="btn btn-or btn-sm" onClick={() => navigate('/valuation')}>View All</button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Val ID</th><th>Vehicle</th><th>Our Price</th><th>Status</th></tr></thead>
              <tbody>
                {recentVal.length > 0 ? recentVal.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/valuation')}>
                    <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>{r.valId || r.id?.slice(0, 10)}</td>
                    <td>{r.make} {r.model} {r.year && `(${r.year})`}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{r.ourPrice ? fmt(r.ourPrice) : '—'}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status || 'Pending'}</span></td>
                  </tr>
                )) : <tr><td colSpan="4" className="empty">No valuations yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Closers + Workshop Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title"><i className="fa fa-handshake" style={{ color: 'var(--or1)', marginRight: 6 }}></i>Purchase Closers</div>
            <div className="tc-acts">
              <button className="btn btn-or btn-sm" onClick={() => navigate('/purchase-closer')}>View All</button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>Seller</th><th>Vehicle</th><th>Price</th><th>Status</th></tr></thead>
              <tbody>
                {recentPcl.length > 0 ? recentPcl.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase-closer')}>
                    <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>{r.pclId || r.id?.slice(0, 10)}</td>
                    <td style={{ fontWeight: 600 }}>{r.sellerName}</td>
                    <td>{r.make} {r.model}</td>
                    <td className="amt-or">{fmt(r.agreedPrice)}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status || '—'}</span></td>
                  </tr>
                )) : <tr><td colSpan="5" className="empty">No closers yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title"><i className="fa fa-wrench" style={{ color: 'var(--or1)', marginRight: 6 }}></i>Workshop Status</div>
            <div className="tc-acts">
              <button className="btn btn-or btn-sm" onClick={() => navigate('/workshop')}>View All</button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Job#</th><th>Vehicle</th><th>Work Type</th><th>Status</th></tr></thead>
              <tbody>
                {wsJobs.length > 0 ? wsJobs.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/workshop')}>
                    <td style={{ fontWeight: 700, color: 'var(--bl5)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 11 }}>{r.wsId || r.jobId || r.id?.slice(0, 10)}</td>
                    <td>{r.ws_make || r.make} {r.ws_model || r.model}</td>
                    <td>{r.ws_wtype || r.wtype || '—'}</td>
                    <td><span className={`badge ${statusBadge(r.ws_jstat || r.jStat)}`}>{r.ws_jstat || r.jStat || '—'}</span></td>
                  </tr>
                )) : <tr><td colSpan="4" className="empty">No open workshop jobs</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Car Stock Table */}
      <div className="tc" style={{ marginBottom: 20 }}>
        <div className="tc-hdr">
          <div className="tc-title"><i className="fa fa-warehouse" style={{ color: 'var(--or1)', marginRight: 6 }}></i>Car Stock — Ready / In Progress</div>
          <div className="tc-acts">
            <button className="btn btn-or btn-sm" onClick={() => navigate('/stock')}>View All Stock</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>Reg No.</th><th>Vehicle</th><th>Year</th><th>KM</th><th>TCP</th><th>Status</th><th>Days In Stock</th></tr>
            </thead>
            <tbody>
              {stockList.length > 0 ? stockList.map(r => {
                const rawMake = (r.make || '').trim();
                const rMake = rawMake.split(' ')[0].toUpperCase();
                const extraFromMake = rawMake.substring(rMake.length).trim();
                const rawModel = (r.model || '').trim();
                const rModelWords = (extraFromMake + ' ' + rawModel).split(' ').filter(Boolean);
                const rModel = [...new Set(rModelWords)].join(' ');
                
                return (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/stock')}>
                  <td style={{ fontWeight: 700, color: 'var(--bl5)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.regNo || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{rMake} {rModel}</td>
                  <td>{r.year || '—'}</td>
                  <td>{r.km ? `${parseInt(r.km).toLocaleString('en-IN')} km` : '—'}</td>
                  <td className="amt-or">{fmt(r.tcp || r.sk_tcp || (Number(r.sk_pp||r.pp||r.purchasePrice||0)+Number(r.sk_refurb||r.refurb||0)+Number(r.sk_rto||r.rto||0)+Number(r.sk_ins||r.ins||0)))}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                  <td>{ageBadge(ageDays(r.stockDate || r.createdAt))}</td>
                </tr>
                );
              }) : <tr><td colSpan="7" className="empty"><i className="fa fa-warehouse"></i><br />No stock yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDashboard;

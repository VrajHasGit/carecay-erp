import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { fmt, fmtDate } from '../utils/helpers';

const Reports = () => {
  const { data } = useData();
  const stk = data.stk || [];
  const scl = data.scl || [];
  const pcl = data.pcl || [];
  const pur = data.pur_inq || [];
  const sal = data.sal_inq || [];
  const ws = data.ws || [];
  const pay = data.pay || [];

  const stats = useMemo(() => {
    const totalSales = scl.reduce((a, r) => a + (r.final || 0), 0);
    const totalPurchase = pcl.reduce((a, r) => a + (r.amount || 0), 0);
    const totalProfit = scl.reduce((a, r) => a + (r.profit || 0), 0);
    const totalWsCost = ws.reduce((a, r) => a + (r.total || 0), 0);
    const byMake = {};
    stk.forEach(r => { byMake[r.make] = (byMake[r.make] || 0) + 1; });
    const byStatus = {};
    stk.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    const byFuel = {};
    stk.forEach(r => { byFuel[r.fuel] = (byFuel[r.fuel] || 0) + 1; });
    return { totalSales, totalPurchase, totalProfit, totalWsCost, byMake, byStatus, byFuel };
  }, [data]);

  const KPI = ({ icon, val, lbl, color }) => (
    <div className="kpi" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none' }}>
      <div className="kpi-icon" style={{ color: 'rgba(255,255,255,.8)' }}><i className={`fa ${icon}`}></i></div>
      <div className="kpi-val" style={{ color: '#fff' }}>{val}</div>
      <div className="kpi-lbl" style={{ color: 'rgba(255,255,255,.75)' }}>{lbl}</div>
    </div>
  );

  return (
    <div className="page on" id="pg_reports">
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-chart-bar"></i></div>Reports</h1><p>Business analytics and performance reports</p></div>
        <div className="ph-actions">
          <button className="btn btn-out btn-sm" onClick={() => window.print()}><i className="fa fa-print"></i> Print</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI icon="fa-sack-dollar" val={fmt(stats.totalSales)} lbl="Total Sales Revenue" color="#059669" />
        <KPI icon="fa-money-bill-wave" val={fmt(stats.totalPurchase)} lbl="Total Purchase Cost" color="#D97706" />
        <KPI icon="fa-chart-line" val={fmt(stats.totalProfit)} lbl="Total Profit" color="#7C3AED" />
        <KPI icon="fa-car-side" val={scl.length} lbl="Cars Sold" color="#1A56DB" />
        <KPI icon="fa-warehouse" val={stk.filter(r => r.status === 'In Stock').length} lbl="Current Stock" color="#0891B2" />
        <KPI icon="fa-screwdriver-wrench" val={fmt(stats.totalWsCost)} lbl="Workshop Costs" color="#DC2626" />
        <KPI icon="fa-handshake" val={pur.filter(r => r.status === 'Closed-Won').length} lbl="Purchase Won" color="#059669" />
        <KPI icon="fa-trophy" val={sal.filter(r => r.status === 'Closed-Won').length} lbl="Sales Won" color="#D97706" />
      </div>

      <div className="dash-grid">
        {/* Stock by Make */}
        <div className="tc">
          <div className="tc-hdr"><div className="tc-title">Stock by Make</div></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Make</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(stats.byMake).length > 0
                  ? Object.entries(stats.byMake).sort((a, b) => b[1] - a[1]).map(([make, cnt]) => (
                    <tr key={make}>
                      <td style={{ fontWeight: 600 }}>{make}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(cnt / stk.length) * 100}%`, height: '100%', background: 'var(--or1)', borderRadius: 3 }} />
                          </div>
                          <b style={{ color: 'var(--or1)', minWidth: 20 }}>{cnt}</b>
                        </div>
                      </td>
                    </tr>
                  ))
                  : <tr><td colSpan="2" className="empty">No stock data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock by Status */}
        <div className="tc">
          <div className="tc-hdr"><div className="tc-title">Stock by Status</div></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(stats.byStatus).length > 0
                  ? Object.entries(stats.byStatus).map(([status, cnt]) => (
                    <tr key={status}>
                      <td><span className={`badge b-${(status || 'new').toLowerCase().replace(' ', '')}`}>{status}</span></td>
                      <td><b style={{ color: 'var(--or1)' }}>{cnt}</b></td>
                    </tr>
                  ))
                  : <tr><td colSpan="2" className="empty">No stock data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Recent Sales Deals</div></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Deal ID</th><th>Date</th><th>Buyer</th><th>Vehicle</th><th>Final Price</th><th>Profit</th></tr></thead>
            <tbody>
              {scl.length > 0 ? scl.slice(0, 10).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontFamily: "'Space Grotesk',sans-serif" }}>{r.sclId || r.id?.slice(0, 12)}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td style={{ fontWeight: 600 }}>{r.buyerName}</td>
                  <td>{r.make} {r.model}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(r.final)}</td>
                  <td className={r.profit > 0 ? 'profit-pos' : 'profit-neg'}>{fmt(r.profit)}</td>
                </tr>
              )) : <tr><td colSpan="6" className="empty">No sales deals yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

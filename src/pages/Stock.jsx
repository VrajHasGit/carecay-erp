import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge, ageDays } from '../utils/helpers';
import { StkModal } from '../components/modals/StkModal';
import { WsModal } from '../components/modals/WsModal';
import { VtModal } from '../components/modals/VtModal';
import { QrModal } from '../components/modals/QrModal';
import { StkPhotosModal } from '../components/modals/StkPhotosModal';
import { QuotationModal } from '../components/modals/QuotationModal';
import CustomSelect from '../components/CustomSelect';
import { exportToExcel } from '../utils/exportData';
import { loadMediaFromFirestore } from '../utils/uploadMedia';

const PAGE_SIZE = 20;

/* ── Colour swatch map ───────────────────────────── */
const COLOUR_MAP = {
  white:'#F8F8F8', black:'#111', silver:'#C0C0C0', grey:'#808080', gray:'#808080',
  red:'#EF4444', blue:'#3B82F6', green:'#22C55E', yellow:'#F59E0B', orange:'#F97316',
  brown:'#92400E', maroon:'#800000', gold:'#C8A84B', beige:'#E8D5B7', cream:'#FFFDD0',
  navy:'#1E3A6B', purple:'#7C3AED', pink:'#EC4899', champagne:'#F7E7CE',
};
function colourHex(c) { if (!c) return '#888'; const k = c.toLowerCase().trim(); for (const [key, val] of Object.entries(COLOUR_MAP)) { if (k.includes(key)) return val; } return '#888'; }

/* ── Days-in-stock badge ─────────────────────────── */
function DaysInStock({ pDate }) {
  if (!pDate) return <span style={{ color: 'var(--text3)' }}>—</span>;
  const d = ageDays(pDate);
  const color = d < 30 ? 'var(--success)' : d < 60 ? 'var(--warn)' : 'var(--danger)';
  return <span style={{ background: `${color}18`, color, fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: "'Space Grotesk',sans-serif" }}>{d}d</span>;
}

/* ── Pagination helper ───────────────────────────── */
function Paginate({ total, page, setPage }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const nums = [...Array(pages).keys()].map(i => i + 1);
  return (
    <div className="pagination">
      <button className="pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
      <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
      {nums.filter(n => n === 1 || n === pages || Math.abs(n - page) <= 2).map((n, i, arr) => (
        <React.Fragment key={n}>
          {i > 0 && arr[i - 1] !== n - 1 && <span style={{ color: 'var(--text3)', padding: '0 4px' }}>…</span>}
          <button className={`pg-btn ${page === n ? 'on' : ''}`} onClick={() => setPage(n)}>{n}</button>
        </React.Fragment>
      ))}
      <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
      <button className="pg-btn" disabled={page === pages} onClick={() => setPage(pages)}>»</button>
    </div>
  );
}

function StkCardImage({ r }) {
  const [frontUrl, setFrontUrl] = useState(null);
  useEffect(() => {
    loadMediaFromFirestore('stk', r.id).then(media => {
      const front = media.find(m => m.name === 'Front');
      if (front?.url) setFrontUrl(front.url);
    }).catch(console.error);
  }, [r.id]);

  return (
    <div className="stk-card-img" style={frontUrl ? { backgroundImage: `url(${frontUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
      {!frontUrl && <i className="fa fa-car-side" style={{ color: 'var(--text3)' }}></i>}
      <div className="stk-status-overlay">
        <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
      </div>
    </div>
  );
}

const Stock = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const location = useLocation();
  const isAdmin = ['admin', 'manager'].includes((currentUser?.role || '').toLowerCase());

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [transFilter, setTransFilter] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [page, setPage] = useState(1);
  const [quotRec, setQuotRec] = useState(null);

  React.useEffect(() => {
    const migrate = async () => {
      const recordsToMigrate = data.stk?.filter(r => !r.stkId || !r.stkId.startsWith('STK-'));
      if (recordsToMigrate && recordsToMigrate.length > 0) {
        for (const rec of recordsToMigrate) {
          const cnt = await getNextCounter('stk');
          const newStkId = genId('STK', cnt);
          await updateRecord('stk', rec.id, { stkId: newStkId });
        }
        await refresh('stk');
      }
    };
    if (data.stk && data.stk.length > 0) migrate();
  }, [data.stk, refresh]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickModal, setQuickModal] = useState({ type: null, stkId: null });
  const [editRec, setEditRec] = useState(null);
  const [photoModalRec, setPhotoModalRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.stk || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.stk, location.state?.autoOpenId]);

  const rawStock = data.stk || [];
  // Exclude only Sold from the main table view
  const stock = rawStock.filter(r => r.status !== 'Sold');

  // Unique makes for filter
  const makes = useMemo(() => [...new Set(stock.map(r => r.make).filter(Boolean))].sort(), [stock]);

  // Filtered records
  const filtered = useMemo(() => {
    const source = search ? rawStock : stock;
    return source.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (r.stkId || '').toLowerCase().includes(q) ||
        (r.inqId || r.sk_inqid || '').toLowerCase().includes(q) ||
        (r.regNo || r.sk_regn || '').toLowerCase().includes(q) ||
        (r.make || '').toLowerCase().includes(q) ||
        (r.model || '').toLowerCase().includes(q) ||
        (r.color || '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchMake = !makeFilter || r.make === makeFilter;
      const matchFuel = !fuelFilter || r.fuel === fuelFilter;
      const matchTrans = !transFilter || (r.trans || r.sk_trans || '').toLowerCase().includes(transFilter.toLowerCase());
      const matchYearFrom = !yearFrom || parseInt(r.year) >= parseInt(yearFrom);
      const matchYearTo = !yearTo || parseInt(r.year) <= parseInt(yearTo);
      const sp = parseFloat(r.sp || r.sk_sp) || 0;
      const matchPriceMin = !priceMin || sp >= parseFloat(priceMin) * 100000;
      const matchPriceMax = !priceMax || sp <= parseFloat(priceMax) * 100000;
      return matchSearch && matchStatus && matchMake && matchFuel && matchTrans &&
             matchYearFrom && matchYearTo && matchPriceMin && matchPriceMax;
    });
  }, [rawStock, stock, search, statusFilter, makeFilter, fuelFilter, transFilter, yearFrom, yearTo, priceMin, priceMax]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // KPI cards
  const inStock = rawStock.filter(r => r.status === 'In Stock' || r.status === 'Ready for Sale').length;
  const sold = rawStock.filter(r => r.status === 'Sold').length;
  const refurb = rawStock.filter(r => r.status === 'Refurb' || r.status === 'Under Refurb' || r.status === 'Workshop').length;
  const totalValue = stock.filter(r => r.status === 'In Stock' || r.status === 'Ready for Sale').reduce((s, r) => s + (parseFloat(r.sp || r.sk_sp) || 0), 0);

  const chartData = useMemo(() => {
    const makesCount = {};
    stock.filter(r => r.status === 'In Stock' || r.status === 'Ready for Sale').forEach(r => {
      let m = (r.make || 'Other').trim();
      m = m.split(' ')[0].toUpperCase();
      makesCount[m] = (makesCount[m] || 0) + 1;
    });
    return Object.entries(makesCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 makes
  }, [stock]);

  const PIE_COLORS = ['#E85D04', '#F4A261', '#E9C46A', '#2A9D8F', '#264653'];

  const clearFilters = () => { setSearch(''); setStatusFilter(''); setMakeFilter(''); setFuelFilter(''); setTransFilter(''); setYearFrom(''); setYearTo(''); setPriceMin(''); setPriceMax(''); setPage(1); };
  const hasFilter = search || statusFilter || makeFilter || fuelFilter || transFilter || yearFrom || yearTo || priceMin || priceMax;

  const handleSave = async (formData) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('stk', editRec.id, formData, { title: 'Stock Updated', message: (formData.sk_regn || formData.regNo || '') + ' — ' + (formData.sk_make || formData.make || '') + ' ' + (formData.sk_model || formData.model || ''), link: '/stock', actor }); showToast('Stock updated!'); }
      else {
        const cnt = await getNextCounter('stk');
        const stkId = genId('STK', cnt);
        const pp = parseFloat(formData.sk_pp || formData.pp || 0);
        const refurb = parseFloat(formData.sk_refurb || formData.refurb || 0);
        const rto = parseFloat(formData.sk_rto || formData.rto || 0);
        const ins = parseFloat(formData.sk_ins || formData.ins || 0);
        const tcp = pp + refurb + rto + ins;
        const sp = parseFloat(formData.sk_sp || formData.sp || 0);
        const profit = sp - tcp;
        await addRecord('stk', { ...formData, stkId, regNo: formData.sk_regn || formData.regNo, make: formData.sk_make || formData.make, model: formData.sk_model || formData.model, variant: formData.sk_var || formData.variant, year: formData.sk_year || formData.year, fuel: formData.sk_fuel || formData.fuel, trans: formData.sk_trans || formData.trans, color: formData.sk_color || formData.color, km: formData.sk_km || formData.km, status: formData.sk_stat || formData.status || 'In Stock', pDate: formData.sk_pdate || formData.pDate || today(), pp, refurb, rto, ins, tcp, sp, profit }, { title: 'Car Added to Stock', message: (formData.sk_regn || formData.regNo || '') + ' — ' + (formData.sk_make || formData.make || '') + ' ' + (formData.sk_model || formData.model || ''), link: '/stock', actor, carInfo: { make: formData.sk_make || formData.make, model: formData.sk_model || formData.model, regNo: formData.sk_regn || formData.regNo } });
        showToast('Stock record added!');
      }
      await refresh('stk'); setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm(`Delete stock for ${rec.regNo}?\n\nThis cannot be undone.`)) return;
    try { await deleteRecord('stk', rec.id); await refresh('stk'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleMarkSold = async (rec) => {
    if (!await window.confirm(`Mark ${rec.regNo} (${rec.make} ${rec.model}) as Sold?`)) return;
    try {
      await updateRecord('stk', rec.id, { status: 'Sold', soldDate: today() });
      await refresh('stk');
      showToast(`${rec.regNo} marked as Sold! ✅`);
    } catch (e) { showToast('Failed to mark as sold.', 'error'); }
  };

  const handleSendToWorkshop = async (rec) => {
    if (!await window.confirm(`Send ${rec.regNo} to Workshop?`)) return;
    try {
      const cnt = await getNextCounter('ws');
      const wsId = genId('JC', cnt);
      await addRecord('ws', {
        wsId,
        ws_stkid: rec.stkId || rec.id,
        ws_inqid: rec.inqId || rec.sk_inqid || '',
        ws_vnum: rec.regNo || rec.sk_regn || '',
        ws_make: rec.make || rec.sk_make || '',
        ws_model: rec.model || rec.sk_model || '',
        ws_km: rec.km || rec.sk_km || '',
        ws_indate: today(),
        date: today(),
        ws_wtype: "General Service",
        ws_jstat: 'Open',
        ws_pstat: 'Pending',
        ws_lc: 0,
        ws_pc: 0,
        ws_est: 0,
        total: 0,
        tasks: []
      });
      await updateRecord('stk', rec.id, { status: 'Workshop' });
      await refresh('ws');
      await refresh('stk');
      showToast(`${rec.regNo} moved to Workshop! ✅`);
    } catch (e) { showToast('Failed to move to workshop.', 'error'); }
  };

const handleExport = () => {
    if (filtered.length === 0) return showToast('No data to export.', 'info');
    const rows = filtered.map(r => ({
      'Stock ID': r.stkId || r.id,
      'Reg No': r.regNo, Make: r.make, Model: r.model, 'Mfg Year': r.year,
      'Passing Year': r.ryear || r.sk_ryear || r.regYear || '',
      Variant: r.variant, Colour: r.color, Fuel: r.fuel, Transmission: r.trans,
      'Odometer (km)': r.km, 'Insurance': r.sk_insval || r.insval || r.insVal ? (r.sk_insval || r.insval || r.insVal) : 'No', 'Location': r.loc || r.sk_loc || '',
      ...(isAdmin ? { 'Selling Price (INR)': r.sp || r.sk_sp } : {}),
      Status: r.status, 'Purchase Date': r.pDate,
      'Days in Stock': r.pDate ? ageDays(r.pDate) : '',
    }));
    exportToExcel(rows, `car_stock_${today()}.xlsx`);
  };

  const closeQuickModal = () => setQuickModal({ type: null, stkId: null });
  const thisYear = new Date().getFullYear();

  return (
    <div className="page on" id="pg_stock">
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
          <h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#E85D04,#F97316)' }}><i className="fa fa-warehouse"></i></div>Car Stock</h1>
          <p>Vehicle inventory · {stock.length} total records · {inStock} available</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out btn-sm" onClick={handleExport}><i className="fa fa-file-csv"></i> Export CSV</button>
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Vehicle</button>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <StkModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      <WsModal isOpen={quickModal.type === 'ws'} onClose={closeQuickModal} stockDocId={quickModal.docId} stockIdForWs={quickModal.stkId} onSuccess={async () => { closeQuickModal(); await refresh('ws'); await refresh('stk'); showToast('Job card created! Car moved to Workshop.'); }} />
      <VtModal isOpen={quickModal.type === 'vt'} onClose={closeQuickModal} stkId={quickModal.stkId} />
      <QrModal isOpen={quickModal.type === 'qr'} onClose={closeQuickModal} stkId={quickModal.stkId} />
      <QuotationModal isOpen={!!quotRec} onClose={() => setQuotRec(null)} stockRec={quotRec} />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-warehouse', val: inStock, lbl: 'In Stock', color: '#4A7CDE' },
          { icon: 'fa-circle-check', val: sold, lbl: 'Sold', color: '#22C55E' },
          { icon: 'fa-wrench', val: refurb, lbl: 'In Refurb', color: '#F59E0B' },
          { icon: 'fa-indian-rupee-sign', val: `₹${(totalValue / 100000).toFixed(1)}L`, lbl: 'Available Value', color: '#C8A84B' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      {inStock > 0 && (
        <div className="tc" style={{ marginBottom: 16 }}>
          <div className="tc-hdr">
            <div className="tc-title">📊 Available Stock by Make (Top 5)</div>
          </div>
          <div style={{ height: 250, width: '100%', padding: '10px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        {/* Row 1 — search + status + make + fuel + year */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="srch" placeholder="🔍 Search reg / make / model…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: '1 1 160px', minWidth: 160 }} />
          <CustomSelect className="flt" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ minWidth: 120 }}>
            <option value="">All Status</option>
            <option>In Stock</option><option>Ready for Sale</option><option>Refurb</option><option>Under Refurb</option><option>Workshop</option><option>On Hold</option><option>Cancelled</option>
          </CustomSelect>
          <CustomSelect className="flt" value={makeFilter} onChange={e => { setMakeFilter(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
            <option value="">All Makes</option>
            {makes.map(m => <option key={m}>{m}</option>)}
          </CustomSelect>
          <CustomSelect className="flt" value={fuelFilter} onChange={e => { setFuelFilter(e.target.value); setPage(1); }} style={{ minWidth: 110 }}>
            <option value="">All Fuel</option>
            <option>Petrol</option><option>Diesel</option><option>EV</option><option>Hybrid</option><option>CNG</option>
          </CustomSelect>
          <input className="flt" type="number" placeholder="Year From" value={yearFrom} onChange={e => { setYearFrom(e.target.value); setPage(1); }} style={{ width: 96 }} min="1990" max={thisYear} />
          <input className="flt" type="number" placeholder="Year To" value={yearTo} onChange={e => { setYearTo(e.target.value); setPage(1); }} style={{ width: 96 }} min="1990" max={thisYear} />
          {/* View Toggle — pushed right */}
          <div className="view-toggle" style={{ marginLeft: 'auto' }}>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List View"><i className="fa fa-list"></i></button>
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid View"><i className="fa fa-grip"></i></button>
          </div>
        </div>

        {/* Row 2 — budget + transmission + KM + location + clear */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Budget range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 8px', height: 36 }}>
            <i className="fa fa-indian-rupee-sign" style={{ fontSize: 10, color: 'var(--or1)', opacity: .8 }}></i>
            <input
              type="number" placeholder="Min (L)" value={priceMin}
              onChange={e => { setPriceMin(e.target.value); setPage(1); }}
              style={{ width: 72, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', padding: 0 }}
              min="0" step="0.5"
            />
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>–</span>
            <input
              type="number" placeholder="Max (L)" value={priceMax}
              onChange={e => { setPriceMax(e.target.value); setPage(1); }}
              style={{ width: 72, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', padding: 0 }}
              min="0" step="0.5"
            />
            <span style={{ color: 'var(--text3)', fontSize: 10, whiteSpace: 'nowrap' }}>Lakh</span>
          </div>
          {/* Transmission */}
          <CustomSelect className="flt" value={transFilter} onChange={e => { setTransFilter(e.target.value); setPage(1); }} style={{ minWidth: 120 }}>
            <option value="">All Trans.</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
            <option value="Semi">Semi-Auto</option>
          </CustomSelect>
          {hasFilter && (
            <button className="btn btn-out btn-sm" onClick={clearFilters} style={{ whiteSpace: 'nowrap' }}>
              <i className="fa fa-xmark"></i> Clear Filters
            </button>
          )}
          {hasFilter && (
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 2 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── LIST VIEW ───────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="tc">
          <div className="tc-hdr">
            <div className="tc-title"><i className="fa fa-warehouse" style={{ color: 'var(--or1)' }}></i> Car Stock
              <span style={{ background: 'var(--or1)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span>
            </div>
            <div className="tc-acts" style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', alignItems: 'center' }}>
              <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            </div>
          </div>
          <div className="tbl-wrap">
            <table id="tbl_stk">
              <thead>
                <tr>
                  <th>Stock ID</th><th>Inq ID</th><th>Reg No.</th><th>Make / Model</th><th>Mfg - Reg Year</th>
                  <th>Fuel</th><th>Trans.</th><th>Colour</th><th>KM</th><th>Insurance</th><th>Location</th>
                  {isAdmin && <><th>Selling Price</th></>}
                  <th>Days</th><th>Status</th><th style={{ minWidth: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map(r => {
                  const linkedInqId = r.inqId || r.sk_inqid || '';
                  const linkedInq = linkedInqId ? (data.pur_inq || []).find(i => i.inqId === linkedInqId || i.id === linkedInqId) : null;
                  const rawMake = (r.make || r.sk_make || linkedInq?.make || '').trim();
                  const rMake = rawMake.split(' ')[0].toUpperCase();
                  const extraFromMake = rawMake.substring(rMake.length).trim();
                  const rawModel = (r.model || r.sk_model || linkedInq?.model || '').trim();
                  // Deduplicate words if make and model overlap
                  const rModelWords = (extraFromMake + ' ' + rawModel).split(' ').filter(Boolean);
                  const rModel = [...new Set(rModelWords)].join(' ');
                  
                  const rVariant = r.variant || r.sk_var || linkedInq?.variant || '';
                  const rYear = r.year || r.sk_year || linkedInq?.year || '';
                  const rFuel = r.fuel || r.sk_fuel || linkedInq?.fuel || '';
                  const rColor = r.color || r.sk_color || linkedInq?.color || '';
                  const rKm = r.km || r.sk_km || linkedInq?.km || '';
                  const rRegNo = r.regNo || r.sk_regn || linkedInq?.regNo || '';
                  const wsJobs = (data.ws || []).filter(ws => ws.ws_stkid === (r.stkId || r.id) || ws.ws_vnum === rRegNo);
                  const activeWsJob = wsJobs.find(ws => ws.ws_jstat !== 'Complete') || wsJobs[wsJobs.length - 1];
                  return (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: 'var(--bl5)', fontSize: 10 }}>{r.stkId || r.id?.slice(0, 12)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text2)' }}>
                      {(() => {
                        const explicitInq = r.sk_inqid?.startsWith('INQ-') ? r.sk_inqid : (r.sk_inqid && !r.sk_inqid.startsWith('DOC-') ? r.sk_inqid : null);
                        if (explicitInq) return explicitInq;
                        if (linkedInqId && !linkedInqId.startsWith('DOC-')) return linkedInqId;
                        const matchReg = rRegNo;
                        if (matchReg && data.pur_inq) {
                          const rn = matchReg.replace(/\s/g, '').toUpperCase();
                          const inq = data.pur_inq.find(i => (i.regNo || i.inq_regn || '').replace(/\s/g, '').toUpperCase() === rn);
                          if (inq) return inq.inqId || inq.id;
                        }
                        return '—';
                      })()}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--or1)', fontFamily: "'Space Grotesk',sans-serif" }}>{rRegNo}</td>
                    <td><span style={{ fontWeight: 600 }}>{rMake}</span> {rModel}<br /><small style={{ color: 'var(--text3)' }}>{rVariant}</small></td>
                    <td>{(rYear || '—')} - {(r.ryear || r.sk_ryear || linkedInq?.ryear || linkedInq?.regYear || '—')}</td>
                    <td>{rFuel ? <span className="badge b-prog">{rFuel}</span> : '—'}</td>
                    <td>{r.trans || r.sk_trans || linkedInq?.trans || linkedInq?.transmission || '—'}</td>
                    <td>
                      {rColor ? (
                        <div className="colour-dot">
                          <div className="colour-dot-swatch" style={{ background: colourHex(rColor) }}></div>
                          {rColor}
                        </div>
                      ) : '—'}
                    </td>
                    <td>{rKm ? `${Number(rKm).toLocaleString('en-IN')} km` : '—'}</td>
                    <td>{r.insval || r.sk_insval || r.insVal || 'No'}</td>
                    <td>{r.loc || r.sk_loc || '—'}</td>
                    {isAdmin && <>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(r.sp || r.sk_sp)}</td>
                    </>}
                    <td><DaysInStock pDate={r.pDate || r.sk_pdate} /></td>
                    <td>
                      <span className={`badge ${statusBadge(r.status || r.sk_stat || 'In Stock')}`}>{r.status || r.sk_stat || 'In Stock'}</span>
                      {activeWsJob && (
                        <div style={{ marginTop: 3 }}>
                          <span style={{ display: 'inline-block', background: 'rgba(245,158,11,.15)', color: '#B45309', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, letterSpacing: '.4px' }}>
                            🔧 {activeWsJob.ws_jstat || 'Open'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="act-grp act-grp-3">
                        <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                        {r.status !== 'Sold' && <button className="btn-icon" title="Mark as Sold" onClick={() => handleMarkSold(r)} style={{ background: 'rgba(34,197,94,.12)', color: 'var(--success)' }}><i className="fa fa-circle-check"></i></button>}
                        <button className="btn-icon bi-next" title="Send to Workshop" onClick={() => handleSendToWorkshop(r)}><i className="fa fa-wrench"></i></button>
                        <button className="btn-icon" style={{ background: 'rgba(236,72,153,.12)', color: 'var(--pink)' }} title="Upload Photos" onClick={() => setPhotoModalRec(r)}><i className="fa fa-camera"></i></button>
                        <button className="btn-icon" style={{ background: 'rgba(200,168,75,.13)', color: '#B8860B' }} title="Generate Quotation" onClick={() => setQuotRec(r)}><i className="fa fa-file-invoice-dollar"></i></button>
                        <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                )}) : (
                  <tr><td colSpan="13" className="empty">
                    <i className="fa fa-warehouse"></i><br />
                    {hasFilter ? 'No vehicles match your filters. Try clearing filters.' : 'No stock records yet. Click "Add Vehicle" to begin.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="tc-foot">
            <span className="pg-info">Showing {filtered.length} vehicles (page {page})</span>
            <Paginate total={filtered.length} page={page} setPage={setPage} />
          </div>
        </div>
      )}

      {/* ── GRID VIEW ───────────────────────────────────── */}
      {viewMode === 'grid' && (
        <>
          {filtered.length === 0 ? (
            <div className="tc"><div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
              <i className="fa fa-warehouse" style={{ fontSize: 36, opacity: .3, display: 'block', marginBottom: 12 }}></i>
              {hasFilter ? 'No vehicles match your filters.' : 'No stock records yet.'}
            </div></div>
          ) : (
            <>
              <div className="stock-grid">
                {paginated.map(r => (
                  <div key={r.id} className="stk-card" style={{ position: 'relative' }}>
                    <StkCardImage r={r} />
                    <div className="stk-card-body">
                      <div className="stk-card-title">{r.make} {r.model}</div>
                      <div className="stk-card-sub">
                        <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{r.year} · {r.variant || 'Standard'}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text2)', fontWeight: 500 }}>
                          <span><i className="fa fa-id-card-clip" style={{opacity:0.6, marginRight: 4}}></i> {r.regNo || '—'}</span>
                          <span><i className="fa fa-gauge" style={{opacity:0.6, marginRight: 4}}></i> {r.km ? `${Number(r.km).toLocaleString('en-IN')} km` : '—'}</span>
                          <span><i className="fa fa-gear" style={{opacity:0.6, marginRight: 4}}></i> {r.trans || r.sk_trans || '—'}</span>
                        </div>
                        <div style={{ marginTop: 6, color: 'var(--text3)', fontSize: 10 }}>Stock ID: {r.stkId || r.id?.slice(0, 12)}</div>
                      </div>
                      <div className="stk-card-price">{fmt(r.sp || r.sk_sp)}</div>
                      <div className="stk-card-pills">
                        {r.fuel && <span className="badge b-prog" style={{ fontSize: 9 }}>{r.fuel}</span>}
                        {r.color && (
                          <div className="colour-dot" style={{ padding: '1px 6px', fontSize: 9 }}>
                            <div className="colour-dot-swatch" style={{ background: colourHex(r.color) }}></div>
                            {r.color}
                          </div>
                        )}
                        <DaysInStock pDate={r.pDate} />
                      </div>
                    </div>
                    {/* Make Quotation — appears only on hover */}
                    <div className="stk-card-quot-hover">
                      <button
                        onClick={() => setQuotRec(r)}
                        style={{ background: 'linear-gradient(135deg,rgba(200,168,75,.95),rgba(184,134,11,.9))', border: 'none', color: '#fff', fontWeight: 700, fontSize: 11, padding: '7px 14px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(200,168,75,0.4)', letterSpacing: '.3px', whiteSpace: 'nowrap' }}
                      >
                        <i className="fa fa-file-invoice-dollar"></i> Make Quotation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tc-foot">
                <span className="pg-info">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <Paginate total={filtered.length} page={page} setPage={setPage} />
              </div>
            </>
          )}
        </>
      )}

      {/* Modals */}
      {photoModalRec && (
        <StkPhotosModal 
          isOpen={true} 
          onClose={() => setPhotoModalRec(null)} 
          stkRec={photoModalRec} 
          onSaved={() => {
            showToast('Photos saved successfully!');
            refresh('stk');
          }}
        />
      )}
    </div>
  );
};

export default Stock;

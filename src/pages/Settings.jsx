import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getSettings, saveSettings, addRecord, updateRecord, deleteRecord } from '../services/db';
import { seedFirestore } from '../utils/seedData';
import { exportMultipleToExcel } from '../utils/exportData';
import { today, fmt } from '../utils/helpers';


/* ── Theme + Font meta ─────────────────────────────────────── */
const THEMES = [
  { id: 'black-darkblue', name: 'OBSIDIAN', desc: 'Dark / Blue', sidebar: '#000000', content: '#04060D', accent: '#1A56DB' },
  { id: 'navy-white', name: 'NAVY MERIDIAN', desc: 'Light / Navy', sidebar: '#1B2A4A', content: '#F4F7FC', accent: '#1D4ED8' },
  { id: 'black-gold', name: 'OBSIDIAN GOLD', desc: 'Light / Gold', sidebar: '#111111', content: '#F7F4EC', accent: '#B8860B' },
  { id: 'darkblue-orange', name: 'APOLLO VUE', desc: 'Light / Orange', sidebar: '#0D2B4E', content: '#F0F5FF', accent: '#E85D04' },
  { id: 'white-green', name: 'EVERGREEN', desc: 'Light / Green', sidebar: '#0D2B22', content: '#F0F5F4', accent: '#059669' },
  { id: 'grey-blue', name: 'STEEL STORM', desc: 'Light / Grey Blue', sidebar: '#1A2638', content: '#F2F5F8', accent: '#3D5A80' },
  { id: 'maroon-cream', name: 'CRIMSON VELVET', desc: 'Light / Maroon', sidebar: '#2D0B11', content: '#FDF8F0', accent: '#7B1D2C' }
];
const FONTS = [
  { id: 'inter', name: 'INTER SYSTEM',       desc: 'Dashboard-first', sample: 'Aa' },
  { id: 'sora',  name: 'SORA EXECUTIVE',     desc: 'Luxury-forward',  sample: 'Aa' },
  { id: 'space', name: 'SPACE GROTESK',      desc: 'Industrial-bold', sample: 'Aa' },
  { id: 'geist', name: 'PLUS JAKARTA SANS',  desc: 'Technical-precise',sample: 'Aa' },
];
const FONT_FAMILIES = {
  inter: "'Inter',sans-serif",
  sora:  "'Sora','DM Sans',sans-serif",
  space: "'Space Grotesk','Outfit',sans-serif",
  geist: "'Plus Jakarta Sans','Outfit',sans-serif",
};
const GOOGLE_FONT_URLS = {
  sora:  'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap',
  space: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@400;500&display=swap',
  geist: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500&display=swap',
};

function applyTheme(themeId) {
  document.body.setAttribute('data-theme', themeId);
  localStorage.setItem('cc_theme', themeId);
}
function applyFont(fontId) {
  document.body.setAttribute('data-font', fontId);
  localStorage.setItem('cc_font', fontId);
  // Dynamically load Google Font if not Inter
  const linkId = 'dyn-font-link';
  let link = document.getElementById(linkId);
  if (GOOGLE_FONT_URLS[fontId]) {
    if (!link) { link = document.createElement('link'); link.id = linkId; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = GOOGLE_FONT_URLS[fontId];
  } else if (link) { link.remove(); }
}

/* ── Default GST rates ─────────────────────────────────────── */
const DEFAULT_GST_RATES = [
  { id: 'gst_28', rate: 28, category: 'New Vehicles', hsn: '8703', active: true, cess: 22 },
  { id: 'gst_12', rate: 12, category: 'Used Vehicles', hsn: '8703', active: true, cess: 0 },
  { id: 'gst_18', rate: 18, category: 'Services / Workshop', hsn: '9987', active: true, cess: 0 },
  { id: 'gst_5',  rate: 5,  category: 'Insurance', hsn: '9971', active: true, cess: 0 },
  { id: 'gst_0',  rate: 0,  category: 'Exempted', hsn: '—', active: false, cess: 0 },
];
const DEFAULT_PARTNERS = [
  { id: 'p1', name: 'HDFC Bank — Car Loan', base: 8.75, maxTenure: 84, maxLTV: 85, fee: '0.5% + GST', active: true },
  { id: 'p2', name: 'SBI Car Loan', base: 8.50, maxTenure: 84, maxLTV: 90, fee: '0.25% + GST', active: true },
  { id: 'p3', name: 'ICICI Bank Auto Loan', base: 9.0, maxTenure: 72, maxLTV: 80, fee: '0.75% + GST', active: false },
];

/* ─────────────────────────────────────────────────────────────
   MAIN SETTINGS COMPONENT
─────────────────────────────────────────────────────────────── */
const Settings = () => {
  const { currentUser, logout } = useAuth();
  const { data } = useData();

  const [settings, setSettings] = useState({ compName: 'Carecay Private Limited', compShort: 'CARECAY', tagline: 'Carecay Pvt. Ltd.', gst: '', address: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Theme/Font state (live from body attributes)
  const [activeTheme, setActiveTheme] = useState(document.body.getAttribute('data-theme') || 'navy-white');
  const [activeFont, setActiveFont] = useState(document.body.getAttribute('data-font') || 'space');

  // GST state
  const [gstRates, setGstRates] = useState(DEFAULT_GST_RATES);
  const [cessEnabled, setCessEnabled] = useState(false);
  const [gstSaving, setGstSaving] = useState(false);

  // Finance state
  const [partners, setPartners] = useState(DEFAULT_PARTNERS);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', base: '', maxTenure: 84, maxLTV: 85, fee: '' });

  // EMI Calculator
  const [emi, setEmi] = useState({ price: '', down: '', rate: '', tenure: 36 });
  const emiCalc = useMemo(() => {
    const p = parseFloat(emi.price) - parseFloat(emi.down || 0);
    const r = parseFloat(emi.rate) / 100 / 12;
    const n = parseInt(emi.tenure);
    if (!p || !r || !n || p <= 0) return null;
    const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = monthly * n;
    const totalInterest = totalPayable - p;
    return { monthly: Math.round(monthly), totalInterest: Math.round(totalInterest), totalPayable: Math.round(totalPayable), loanAmt: Math.round(p) };
  }, [emi]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    getSettings().then(s => { if (s && Object.keys(s).length) setSettings(prev => ({ ...prev, ...s })); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await saveSettings(settings); showToast('Settings saved!'); }
    catch (e) { showToast('Failed: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };
  const handleSeed = async () => {
    if (!await window.confirm('Re-seed all users and settings to Firestore?')) return;
    setSeeding(true);
    try { const ok = await seedFirestore(); showToast(ok ? 'Firestore seeded!' : 'Seeding failed.', ok ? 'success' : 'error'); }
    catch (e) { showToast('Error: ' + e.message, 'error'); }
    finally { setSeeding(false); }
  };
  const handleGstSave = async () => {
    setGstSaving(true);
    try { await saveSettings({ gst_rates: gstRates, cess_enabled: cessEnabled }); showToast('GST config saved!'); }
    catch (e) { showToast('Failed: ' + e.message, 'error'); }
    finally { setGstSaving(false); }
  };

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isManager = currentUser?.role?.toLowerCase() === 'manager';

  if (loading) return <div className="page on"><div style={{ padding: 48, textAlign: 'center' }}><i className="car-spinner" style={{ fontSize: 24, color: 'var(--or1)' }}></i></div></div>;

  const TABS = [
    { id: 'general', label: 'General', icon: 'fa-building' },
    { id: 'appearance', label: 'Appearance', icon: 'fa-palette' },
    ...(isAdmin || isManager ? [{ id: 'gst', label: 'GST Config', icon: 'fa-percent' }] : []),
    ...(isAdmin || isManager ? [{ id: 'finance', label: 'Finance & Loans', icon: 'fa-landmark' }] : []),
    { id: 'account', label: 'My Account', icon: 'fa-user-circle' },
    ...(isAdmin ? [{ id: 'danger', label: 'Admin Tools', icon: 'fa-triangle-exclamation' }] : []),
  ];

  return (
    <div className="page on" id="pg_settings">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}

      {/* Header */}
      <div className="ph">
        <div className="ph-left">
          <h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#4A7CDE,#2563EB)' }}><i className="fa fa-gear"></i></div>Settings</h1>
          <p>ERP configuration · Appearance · GST · Finance · Preferences</p>
        </div>
        {activeTab === 'general' && (
          <div className="ph-actions">
            <button className="btn btn-or" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save Settings</>}
            </button>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="stage-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`stage-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            <i className={`fa ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: GENERAL ─────────────────────────────────── */}
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="tc">
            <div className="tc-hdr"><div className="tc-title"><i className="fa fa-building" style={{ color: 'var(--or1)' }}></i> Company Information</div></div>
            <div className="m-body" style={{ padding: 20 }}>
              <div className="grid1"><div className="fg"><label>Company Name *</label><input value={settings.compName || ''} onChange={e => setSettings(p => ({ ...p, compName: e.target.value }))} placeholder="Carecay Private Limited" /></div></div>
              <div className="grid2">
                <div className="fg"><label>Short Name</label><input value={settings.compShort || ''} onChange={e => setSettings(p => ({ ...p, compShort: e.target.value }))} placeholder="CARECAY" /></div>
                <div className="fg"><label>Tagline</label><input value={settings.tagline || ''} onChange={e => setSettings(p => ({ ...p, tagline: e.target.value }))} placeholder="Tagline" /></div>
              </div>
              <div className="grid2">
                <div className="fg"><label>GSTIN</label><input value={settings.gst || ''} onChange={e => setSettings(p => ({ ...p, gst: e.target.value }))} placeholder="24AAACC1234F1Z5" /></div>
                <div className="fg"><label>Phone</label><input value={settings.phone || ''} onChange={e => setSettings(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" /></div>
              </div>
              <div className="grid1"><div className="fg"><label>Email</label><input value={settings.email || ''} onChange={e => setSettings(p => ({ ...p, email: e.target.value }))} placeholder="info@carecay.in" /></div></div>
              <div className="grid1"><div className="fg"><label>Address</label><textarea rows="2" value={settings.address || ''} onChange={e => setSettings(p => ({ ...p, address: e.target.value }))} placeholder="Full dealership address" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: 8, fontFamily: 'inherit', fontSize: 12, color: 'var(--text)', resize: 'none' }} /></div></div>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: 'fa-car-side', label: 'Total Stock', val: (data.stk || []).length, color: 'var(--or1)' },
              { icon: 'fa-users', label: 'Total Customers', val: (data.cust || []).length, color: 'var(--success)' },
              { icon: 'fa-user-tie', label: 'System Users', val: (data.users || []).length, color: 'var(--bl5)' },
              { icon: 'fa-tags', label: 'Active Inquiries', val: (data.sal_inq || []).filter(r => r.status === 'New' || r.status === 'In-Progress').length, color: 'var(--warn)' },
            ].map((k, i) => (
              <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
                <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
                <div className="kpi-val">{k.val}</div>
                <div className="kpi-lbl">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: APPEARANCE ──────────────────────────────── */}
      {activeTab === 'appearance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Colour Theme Picker */}
          <div className="tc">
            <div className="tc-hdr"><div className="tc-title"><i className="fa fa-palette" style={{ color: 'var(--or1)' }}></i> Colour Theme</div></div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Changes apply immediately. Your preference is saved locally.</p>
              <div className="picker-grid">
                {THEMES.map(t => (
                  <div key={t.id} className={`picker-card ${activeTheme === t.id ? 'active' : ''}`}
                    onClick={() => { setActiveTheme(t.id); applyTheme(t.id); showToast(`Theme: ${t.name}`, 'info'); }}>
                    <div className="picker-preview">
                      <div className="picker-preview-top" style={{ background: t.sidebar }}></div>
                      <div className="picker-preview-bottom" style={{ background: t.content }}>
                        <div style={{ height: 8, background: t.accent, margin: 6, borderRadius: 3, width: '60%' }}></div>
                      </div>
                    </div>
                    <div className="picker-name">{t.name}</div>
                    <div className="picker-desc">{t.desc}</div>
                    <div className="picker-check"><i className="fa fa-check"></i></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Font Picker */}
          <div className="tc">
            <div className="tc-hdr"><div className="tc-title"><i className="fa fa-font" style={{ color: 'var(--bl5)' }}></i> Font System</div></div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Font loads from Google Fonts. Applied instantly.</p>
              <div className="picker-grid">
                {FONTS.map(f => (
                  <div key={f.id} className={`picker-card ${activeFont === f.id ? 'active' : ''}`}
                    onClick={() => { setActiveFont(f.id); applyFont(f.id); showToast(`Font: ${f.name}`, 'info'); }}>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONT_FAMILIES[f.id], color: 'var(--or1)', marginBottom: 4, letterSpacing: '-0.03em' }}>{f.sample}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: FONT_FAMILIES[f.id], marginBottom: 4 }}>The quick brown fox</div>
                    <div className="picker-name">{f.name}</div>
                    <div className="picker-desc">{f.desc}</div>
                    <div className="picker-check"><i className="fa fa-check"></i></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GST CONFIG ─────────────────────────────── */}
      {activeTab === 'gst' && (isAdmin || isManager) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="tc">
            <div className="tc-hdr">
              <div className="tc-title"><i className="fa fa-percent" style={{ color: 'var(--or1)' }}></i> GST Rates Configuration</div>
              <div className="tc-acts">
                <button className="btn btn-or btn-sm" onClick={handleGstSave} disabled={gstSaving}>
                  {gstSaving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save All Changes</>}
                </button>
              </div>
            </div>
            {/* CESS Toggle */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Enable CESS on Vehicles</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Mid-size: +17% · Large: +20% · SUV: +22%</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 22, background: cessEnabled ? 'var(--success)' : 'var(--border)', borderRadius: 11, position: 'relative', transition: '.2s', cursor: 'pointer' }} onClick={() => setCessEnabled(v => !v)}>
                  <div style={{ width: 18, height: 18, background: '#fff', borderRadius: 9, position: 'absolute', top: 2, left: cessEnabled ? 18 : 2, transition: '.2s' }}></div>
                </div>
                <span style={{ fontSize: 11, color: cessEnabled ? 'var(--success)' : 'var(--text3)', fontWeight: 700 }}>{cessEnabled ? 'ON' : 'OFF'}</span>
              </label>
            </div>
            {/* Rate rows */}
            {gstRates.map((r, i) => (
              <div key={r.id} className="gst-rate-row">
                <input className="gst-rate-input" type="number" value={r.rate} onChange={e => setGstRates(prev => prev.map((x, j) => j === i ? { ...x, rate: +e.target.value } : x))} min="0" max="100" />
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>%</span>
                <input style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', fontSize: 12 }} value={r.category} onChange={e => setGstRates(prev => prev.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} />
                <input style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text3)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', fontSize: 11 }} value={r.hsn} onChange={e => setGstRates(prev => prev.map((x, j) => j === i ? { ...x, hsn: e.target.value } : x))} placeholder="HSN" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ width: 32, height: 18, background: r.active ? 'var(--success)' : 'var(--border)', borderRadius: 9, position: 'relative', transition: '.2s', cursor: 'pointer' }}
                    onClick={() => setGstRates(prev => prev.map((x, j) => j === i ? { ...x, active: !x.active } : x))}>
                    <div style={{ width: 14, height: 14, background: '#fff', borderRadius: 7, position: 'absolute', top: 2, left: r.active ? 16 : 2, transition: '.2s' }}></div>
                  </div>
                  <span style={{ fontSize: 9, color: r.active ? 'var(--success)' : 'var(--text3)', fontWeight: 700 }}>{r.active ? 'ON' : 'OFF'}</span>
                </label>
                <button onClick={() => setGstRates(prev => prev.filter((_, j) => j !== i))} style={{ background: 'rgba(239,68,68,.1)', border: 'none', color: 'var(--danger)', borderRadius: 5, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                  <i className="fa fa-trash"></i>
                </button>
              </div>
            ))}
            <div style={{ padding: 12 }}>
              <button className="btn btn-out btn-sm" onClick={() => setGstRates(prev => [...prev, { id: `gst_${Date.now()}`, rate: 0, category: 'New Category', hsn: '', active: true, cess: 0 }])}>
                <i className="fa fa-plus"></i> Add Rate
              </button>
            </div>
          </div>
          {/* GST Summary Preview */}
          <div className="tc">
            <div className="tc-hdr"><div className="tc-title"><i className="fa fa-chart-pie" style={{ color: 'var(--success)' }}></i> Monthly GST Summary</div></div>
            <div style={{ padding: 20 }}>
              {[
                { label: 'Output GST (Collected)', val: '₹3,42,800', color: 'var(--success)' },
                { label: 'Input GST (Paid on Parts)', val: '₹48,200', color: 'var(--warn)' },
                { label: 'Net GST Liability', val: '₹2,94,600', color: 'var(--or1)' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: r.color }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-out btn-sm" onClick={() => showToast('GSTR-1 export coming soon.', 'info')}><i className="fa fa-file-csv"></i> Export GSTR-1</button>
                <button className="btn btn-out btn-sm" onClick={() => showToast('GSTR-3B export coming soon.', 'info')}><i className="fa fa-file-csv"></i> Export GSTR-3B</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FINANCE & LOANS ─────────────────────────── */}
      {activeTab === 'finance' && (isAdmin || isManager) && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {partners.map(p => (
              <div key={p.id} className="fin-partner-card" style={{ opacity: p.active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="fin-partner-name">{p.name}</div>
                  <span className={`badge ${p.active ? 'b-new' : 'b-cncl'}`} style={{ fontSize: 9 }}>{p.active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="fin-partner-meta">Finance Partner</div>
                {[
                  { label: 'Base Rate', val: `${p.base}% p.a.` },
                  { label: 'Max Tenure', val: `${p.maxTenure} months` },
                  { label: 'Max LTV', val: `${p.maxLTV}% of on-road` },
                  { label: 'Processing Fee', val: p.fee },
                ].map((r, i) => (
                  <div key={i} className="fin-partner-row">
                    <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button className="btn btn-out btn-sm" style={{ flex: 1 }} onClick={() => setPartners(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))}>
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-icon bi-del" onClick={() => { if (window.confirm(`Remove ${p.name}?`)) setPartners(prev => prev.filter(x => x.id !== p.id)); }}>
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            <div className="fin-partner-card" style={{ border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', opacity: .7, minHeight: 180 }} onClick={() => setShowAddPartner(true)}>
              <i className="fa fa-plus" style={{ fontSize: 20, color: 'var(--text3)' }}></i>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Add Partner</span>
            </div>
          </div>

          {/* Add partner form */}
          {showAddPartner && (
            <div className="tc" style={{ marginBottom: 20 }}>
              <div className="tc-hdr"><div className="tc-title"><i className="fa fa-plus" style={{ color: 'var(--success)' }}></i> New Finance Partner</div></div>
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Partner Name', key: 'name', placeholder: 'e.g. Axis Bank Car Loan' },
                  { label: 'Base Rate (% p.a.)', key: 'base', placeholder: '9.5', type: 'number' },
                  { label: 'Max Tenure (months)', key: 'maxTenure', placeholder: '84', type: 'number' },
                  { label: 'Max LTV (%)', key: 'maxLTV', placeholder: '85', type: 'number' },
                  { label: 'Processing Fee', key: 'fee', placeholder: '0.5% + GST' },
                ].map(f => (
                  <div key={f.key} className="fg">
                    <label>{f.label}</label>
                    <input type={f.type || 'text'} value={newPartner[f.key] || ''} onChange={e => setNewPartner(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
                <button className="btn btn-or" onClick={() => {
                  if (!newPartner.name) return showToast('Partner name required', 'error');
                  setPartners(prev => [...prev, { ...newPartner, id: `p_${Date.now()}`, active: true, base: +newPartner.base, maxTenure: +newPartner.maxTenure, maxLTV: +newPartner.maxLTV }]);
                  setShowAddPartner(false); setNewPartner({ name: '', base: '', maxTenure: 84, maxLTV: 85, fee: '' });
                  showToast('Partner added!');
                }}><i className="fa fa-check"></i> Add Partner</button>
                <button className="btn btn-out" onClick={() => setShowAddPartner(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* EMI Calculator */}
          <div className="tc">
            <div className="tc-hdr"><div className="tc-title"><i className="fa fa-calculator" style={{ color: 'var(--bl5)' }}></i> EMI Calculator</div></div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div className="grid2" style={{ marginBottom: 12 }}>
                  <div className="fg"><label>Vehicle Price (₹)</label><input type="number" placeholder="e.g. 750000" value={emi.price} onChange={e => setEmi(p => ({ ...p, price: e.target.value }))} /></div>
                  <div className="fg"><label>Down Payment (₹)</label><input type="number" placeholder="e.g. 150000" value={emi.down} onChange={e => setEmi(p => ({ ...p, down: e.target.value }))} /></div>
                </div>
                <div className="grid2" style={{ marginBottom: 12 }}>
                  <div className="fg"><label>Interest Rate (% p.a.)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="number" step="0.25" placeholder="e.g. 8.75" value={emi.rate} onChange={e => setEmi(p => ({ ...p, rate: e.target.value }))} style={{ flex: 1 }} />
                      <select style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', fontSize: 10 }} onChange={e => e.target.value && setEmi(p => ({ ...p, rate: e.target.value }))}>
                        <option value="">Partner</option>
                        {partners.filter(p => p.active).map(p => <option key={p.id} value={p.base}>{p.base}%</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="fg"><label>Tenure (months)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {[12, 24, 36, 48, 60, 72, 84].map(t => (
                        <button key={t} onClick={() => setEmi(p => ({ ...p, tenure: t }))}
                          style={{ padding: '3px 10px', border: `1px solid ${emi.tenure === t ? 'var(--or1)' : 'var(--border)'}`, borderRadius: 5, background: emi.tenure === t ? 'var(--or1)' : 'transparent', color: emi.tenure === t ? '#fff' : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontWeight: emi.tenure === t ? 700 : 400 }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* EMI Result */}
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {emiCalc ? (<>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>EMI per month</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 800, color: 'var(--or1)', marginBottom: 16 }}>₹{emiCalc.monthly.toLocaleString('en-IN')}</div>
                  {[
                    { label: 'Loan Amount', val: `₹${emiCalc.loanAmt.toLocaleString('en-IN')}` },
                    { label: 'Total Interest', val: `₹${emiCalc.totalInterest.toLocaleString('en-IN')}` },
                    { label: 'Total Payable', val: `₹${emiCalc.totalPayable.toLocaleString('en-IN')}` },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                      <span style={{ fontWeight: 700 }}>{r.val}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-out btn-sm" onClick={() => { const msg = `EMI Breakdown:\nLoan: ₹${emiCalc.loanAmt.toLocaleString('en-IN')}\nTenure: ${emi.tenure} months @ ${emi.rate}%\nMonthly EMI: ₹${emiCalc.monthly.toLocaleString('en-IN')}\nTotal Payable: ₹${emiCalc.totalPayable.toLocaleString('en-IN')}\n\n— Carecay Pvt. Ltd.`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); }}>
                      <i className="fa-brands fa-whatsapp"></i> Share
                    </button>
                  </div>
                </>) : (
                  <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    <i className="fa fa-calculator" style={{ fontSize: 28, opacity: .3, display: 'block', marginBottom: 8 }}></i>
                    <div style={{ fontSize: 12 }}>Enter vehicle price, down payment and rate to calculate EMI</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MY ACCOUNT ──────────────────────────────── */}
      {activeTab === 'account' && (
        <div style={{ maxWidth: 480 }}>
          <div className="tc">
            <div className="tc-hdr"><div className="tc-title"><i className="fa fa-user-circle" style={{ color: 'var(--bl5)' }}></i> My Account</div></div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,var(--or1),var(--or2))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk',sans-serif" }}>
                  {(currentUser?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', fontFamily: "'Space Grotesk',sans-serif" }}>{currentUser?.name || 'Administrator'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{currentUser?.role} · {currentUser?.branch}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Login ID: <b style={{ color: 'var(--or1)' }}>{currentUser?.lid}</b></div>
                </div>
              </div>
              <button className="btn btn-out" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', width: '100%', marginBottom: 8 }} onClick={() => { logout(); window.location.href = '/login'; }}>
                <i className="fa fa-right-from-bracket"></i> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ADMIN TOOLS ─────────────────────────────── */}
      {activeTab === 'danger' && isAdmin && (
        <div style={{ maxWidth: 480 }}>
          <div className="tc" style={{ border: '1px solid rgba(239,68,68,.3)' }}>
            <div className="tc-hdr" style={{ borderBottom: '1px solid rgba(239,68,68,.3)' }}>
              <div className="tc-title" style={{ color: 'var(--danger)' }}><i className="fa fa-triangle-exclamation"></i> Admin Tools</div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16, fontSize: 11, color: 'var(--text3)' }}>
                <i className="fa fa-circle-info" style={{ color: 'var(--danger)', marginRight: 6 }}></i>
                These operations affect the live Firestore database. Use with caution.
              </div>
              <button className="btn btn-out" onClick={handleSeed} disabled={seeding} style={{ fontSize: 11, width: '100%', marginBottom: 12 }}>
                {seeding ? <><i className="car-spinner"></i> Seeding…</> : <><i className="fa fa-database"></i> Re-Seed Firestore (Sample Data)</>}
              </button>
              <button className="btn" onClick={() => exportMultipleToExcel(data, `carecay_full_backup_${today()}.xlsx`)} style={{ fontSize: 11, width: '100%', background: 'var(--bl5)', color: '#fff', border: 'none' }}>
                <i className="fa fa-file-export"></i> Export Full System Data (Excel)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

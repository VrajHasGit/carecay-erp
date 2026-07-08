import React, { useState, useEffect } from 'react';
import { today, genId } from '../../utils/helpers';
import { getNextCounter } from '../../services/db';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MAKES, MODELS, YEARS, CITIES, FUELS, TRANS, COLORS } from '../../utils/constants';

const INIT = {
  salId: '',
  source: 'Walk-in', sourceName: '', sourceNumber: '', nameSource: '', date: today(), branch: 'SG Highway', teleCallerName: '',
  buyerName: '', mobile: '', altMobile: '', email: '', city: '', state: 'Gujarat', address: '',
  budget: '', makePref: '', model: '', fuel: 'Any', trans: 'Any', color: 'Any',
  km: '', yearFrom: '', yearTo: '', assigned: 'Ritesh Shah', status: 'New', nextFU: '', updatedBy: '', remarks: '',
  linkedStock: ''
};

export const SalInqModal = ({ isOpen, onClose, onSave, editData }) => {
  const { currentUser } = useAuth();
  const { data } = useData();
  const [formData, setFormData] = useState(INIT);
  const [saving, setSaving] = useState(false);

  // ── Stock picker (search works on Registration Number) ──
  const [stockQuery, setStockQuery] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);

  // ── Car Preference (make + model, multi-add) ──
  const [carPrefs, setCarPrefs] = useState([{ make: '', model: '' }]);
  const [carModelLists, setCarModelLists] = useState([[]]);

  // ── Partner Name (multi-add, same pattern as Purchase Inquiry) ──
  const [partnerOptions, setPartnerOptions] = useState([
    'Rajan Desai', 'Ritesh Shah', 'Kalpesh Joshi', 'Marut Dandawala', 'Isha Dashraniya', 'Pinal Desai', 'Other'
  ]);
  const [addingPartnerIndex, setAddingPartnerIndex] = useState(null);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [partnerSelections, setPartnerSelections] = useState(['']);

  const availableStock = (data?.stk || []).filter(r => r.status === 'In Stock' || r.status === 'Ready for Sale');

  useEffect(() => {
    if (!isOpen) return;
    setStockQuery('');
    setShowStockDropdown(false);
    setBrowseAll(false);

    if (editData) {
      const pSelections = editData.nameSource ? editData.nameSource.split(',').map(s => s.trim()) : [''];
      setPartnerSelections(pSelections);
      setPartnerOptions(p => {
        const newP = [...p];
        pSelections.forEach(ps => { if (ps && !newP.includes(ps)) newP.push(ps); });
        return newP;
      });

      const prefs = editData.carPrefs?.length ? editData.carPrefs : [{ make: editData.makePref || '', model: editData.model || '' }];
      setCarPrefs(prefs);
      setCarModelLists(prefs.map(p => MODELS[p.make] || []));

      setFormData({ ...INIT, ...editData, nameSource: pSelections.join(', ') });
    } else {
      setPartnerSelections(['']);
      setCarPrefs([{ make: '', model: '' }]);
      setCarModelLists([[]]);
      let mounted = true;
      getNextCounter('sal').then(cnt => {
        if (mounted) setFormData({ ...INIT, date: today(), salId: genId('SIN', cnt) });
      });
      return () => { mounted = false; };
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  // ── Car Preference handlers ──
  const setCarPrefField = (idx, field, val) => {
    setCarPrefs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val, ...(field === 'make' ? { model: '' } : {}) } : p));
    if (field === 'make') {
      setCarModelLists(prev => prev.map((m, i) => i === idx ? (MODELS[val] || []) : m));
    }
  };
  const addCarPref = () => {
    setCarPrefs(prev => [...prev, { make: '', model: '' }]);
    setCarModelLists(prev => [...prev, []]);
  };
  const removeCarPref = (idx) => {
    setCarPrefs(prev => prev.filter((_, i) => i !== idx));
    setCarModelLists(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Stock picker ──
  const filteredStock = (() => {
    const q = stockQuery.trim().toLowerCase();
    if (!q) return browseAll ? availableStock.slice(0, 8) : [];
    return availableStock.filter(s => {
      const regNo = (s.regNo || s.sk_regn || '').toLowerCase();
      const make = (s.make || s.sk_make || '').toLowerCase();
      const model = (s.model || s.sk_model || '').toLowerCase();
      const stkId = (s.stkId || s.id || '').toLowerCase();
      return regNo.includes(q) || stkId.includes(q) || make.includes(q) || model.includes(q);
    }).slice(0, 8);
  })();

  const linkedStockRec = formData.linkedStock
    ? (data?.stk || []).find(s => (s.stkId || s.id) === formData.linkedStock)
    : null;

  const handlePickStock = (stk) => {
    const stkId = stk.stkId || stk.id;
    const make = stk.make || stk.sk_make || '';
    const model = stk.model || stk.sk_model || '';
    setFormData(prev => ({
      ...prev,
      linkedStock: stkId,
      fuel: stk.fuel || stk.sk_fuel || prev.fuel,
      trans: stk.trans || stk.sk_trans || prev.trans,
      color: stk.color || stk.sk_color || prev.color,
      yearFrom: stk.year || stk.sk_year || prev.yearFrom,
      yearTo: stk.year || stk.sk_year || prev.yearTo,
      km: stk.km || stk.sk_km || prev.km,
      budget: stk.sprice || stk.sp || stk.sk_sp || prev.budget,
    }));
    setCarPrefs(prev => {
      const next = [...prev];
      next[0] = { make, model };
      return next;
    });
    setCarModelLists(prev => {
      const next = [...prev];
      next[0] = MODELS[make] || [];
      return next;
    });
    setStockQuery('');
    setShowStockDropdown(false);
    setBrowseAll(false);
  };

  const clearLinkedStock = () => set('linkedStock', '');

  const handleSave = async () => {
    if (!formData.buyerName.trim()) return alert('Buyer Name is required.');
    setSaving(true);
    try {
      const cleanPrefs = carPrefs.filter(p => p.make || p.model);
      await onSave({
        ...formData,
        carPrefs: cleanPrefs,
        makePref: cleanPrefs[0]?.make || '',
        model: cleanPrefs[0]?.model || '',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay on" id="m_sal_inq">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🏷️</div>
          <h3>{editData ? 'Edit Sales Inquiry' : 'New Sales Inquiry'}</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          {/* Inquiry Details */}
          <div className="sect-lbl"><i className="fa fa-circle-info"></i> Inquiry Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Inquiry ID</label>
              <input value={formData.salId} readOnly placeholder="Generating..." style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
            </div>
            <div className="fg">
              <label>Inquiry Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} />
            </div>
            <div className="fg">
              <label>Branch</label>
              <select name="branch" value={formData.branch} onChange={handleChange}>
                <option>SG Highway</option><option>Vastral</option><option>Head Office</option>
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Inquiry Source *</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                <option>Walk-in</option><option>Call</option><option>Online</option>
                <option>Reference</option><option>Dealer</option><option>Partner</option><option>OLX</option>
                <option>Carwale</option><option>WhatsApp</option><option>Social Media</option>
              </select>
            </div>
            <div className="fg">
              <label>Source Name</label>
              <input name="sourceName" value={formData.sourceName} onChange={handleChange} placeholder="Source Name" disabled={formData.source === 'Walk-in'} />
            </div>
            <div className="fg">
              <label>Source Number</label>
              <input name="sourceNumber" value={formData.sourceNumber} onChange={handleChange} type="tel" maxLength="10" placeholder="Source Number" disabled={formData.source === 'Walk-in'} />
            </div>
            <div className="fg">
              <label>Telecaller Name</label>
              <input name="teleCallerName" value={formData.teleCallerName} onChange={handleChange} placeholder="Name" disabled={!['Online', 'OLX', 'Carwale'].includes(formData.source)} />
            </div>
          </div>
          <div className="grid1">
            <div className="fg">
              <label>Partner Name</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partnerSelections.map((selection, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    {addingPartnerIndex !== index ? (
                      <select
                        value={selection}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setAddingPartnerIndex(index);
                            setNewPartnerName('');
                          } else {
                            const newSelections = [...partnerSelections];
                            newSelections[index] = e.target.value;
                            setPartnerSelections(newSelections);
                            set('nameSource', newSelections.filter(Boolean).join(', '));
                          }
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="">-- Select --</option>
                        {partnerOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--or1)' }}>+ Create New Partner...</option>
                      </select>
                    ) : (
                      <>
                        <input
                          value={newPartnerName}
                          onChange={e => setNewPartnerName(e.target.value)}
                          placeholder="Enter partner name..."
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <button type="button" className="btn btn-or" style={{ padding: '0 12px' }} onClick={() => {
                          if (newPartnerName.trim()) {
                            setPartnerOptions(prev => [...prev, newPartnerName.trim()]);
                            const newSelections = [...partnerSelections];
                            newSelections[index] = newPartnerName.trim();
                            setPartnerSelections(newSelections);
                            set('nameSource', newSelections.filter(Boolean).join(', '));
                          }
                          setAddingPartnerIndex(null);
                          setNewPartnerName('');
                        }} title="Save Partner">✓</button>
                        <button type="button" className="btn btn-out" style={{ padding: '0 12px' }} onClick={() => {
                          setAddingPartnerIndex(null);
                          setNewPartnerName('');
                        }} title="Cancel">✕</button>
                      </>
                    )}
                    {index === partnerSelections.length - 1 && addingPartnerIndex !== index && (
                      <button type="button" className="btn btn-out" style={{ padding: '0 12px' }} onClick={() => setPartnerSelections([...partnerSelections, ''])} title="Add another partner">+</button>
                    )}
                    {partnerSelections.length > 1 && addingPartnerIndex !== index && (
                      <button type="button" className="btn btn-out" style={{ padding: '0 12px', color: 'red' }} onClick={() => {
                        const newSelections = partnerSelections.filter((_, i) => i !== index);
                        setPartnerSelections(newSelections);
                        set('nameSource', newSelections.filter(Boolean).join(', '));
                      }} title="Remove partner">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="sect-lbl"><i className="fa fa-user"></i> Buyer Details</div>
          <div className="grid3">
            <div className="fg"><label>Buyer Name *</label>
              <input name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="fg"><label>Mobile *</label>
              <input name="mobile" value={formData.mobile} onChange={handleChange} type="tel" maxLength="10" placeholder="10 digit" />
            </div>
            <div className="fg"><label>Alt Mobile</label>
              <input name="altMobile" value={formData.altMobile} onChange={handleChange} type="tel" maxLength="10" placeholder="Optional" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="email@example.com" />
            </div>
            <div className="fg"><label>City</label>
              <select name="city" value={formData.city} onChange={handleChange}>
                <option value="">Select City</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg"><label>State</label>
              <input name="state" value={formData.state} readOnly
                style={{ background: 'rgba(16,185,129,.08)', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 600 }} />
            </div>
          </div>
          <div className="grid1"><div className="fg"><label>Address</label>
            <input name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
          </div></div>

          {/* Stock Link */}
          <div className="sect-lbl"><i className="fa fa-warehouse"></i> Link Stock Vehicle</div>
          {formData.linkedStock ? (
            <div style={{ background: 'rgba(5,150,105,.07)', border: '1px solid rgba(5,150,105,.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa fa-car-side" style={{ color: '#059669', fontSize: 16 }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {linkedStockRec ? `${linkedStockRec.make || linkedStockRec.sk_make || ''} ${linkedStockRec.model || linkedStockRec.sk_model || ''}`.trim() : formData.linkedStock}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>
                  {linkedStockRec ? `${linkedStockRec.regNo || linkedStockRec.sk_regn || '—'} · ${formData.linkedStock}` : 'Linked'}
                </div>
              </div>
              <button onClick={clearLinkedStock} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }} title="Unlink vehicle"><i className="fa fa-xmark"></i></button>
            </div>
          ) : (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={stockQuery}
                  onChange={e => { setStockQuery(e.target.value); setShowStockDropdown(true); setBrowseAll(false); }}
                  onFocus={() => setShowStockDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStockDropdown(false), 150)}
                  placeholder="Search by Registration Number / Stock ID / Make / Model…"
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(5,150,105,.4)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => { setBrowseAll(b => !b); setShowStockDropdown(true); setStockQuery(''); }}
                  className="btn btn-out btn-sm"
                  style={{ whiteSpace: 'nowrap', borderColor: '#059669', color: '#059669' }}
                >
                  <i className="fa fa-list"></i> {browseAll ? 'Close' : 'Browse All'}
                </button>
              </div>
              {showStockDropdown && (stockQuery.trim() || browseAll) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 20px rgba(0,0,0,.15)', maxHeight: 220, overflowY: 'auto' }}>
                  {filteredStock.length > 0 ? filteredStock.map(stk => (
                    <div key={stk.id} onMouseDown={() => handlePickStock(stk)}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border2)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontWeight: 700, color: '#059669', fontFamily: "'Space Grotesk',sans-serif", minWidth: 110 }}>{stk.regNo || stk.sk_regn || '—'}</span>
                      <span style={{ fontWeight: 600 }}>{stk.make || stk.sk_make} {stk.model || stk.sk_model}</span>
                      <span style={{ color: 'var(--text3)' }}>({stk.year || stk.sk_year})</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 700 }}>₹{Number(stk.sprice || stk.sp || stk.sk_sp || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No matching vehicle in stock.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Car Preference */}
          <div className="sect-lbl"><i className="fa fa-car"></i> Car Preference</div>
          <div className="grid1">
            <div className="fg">
              <label>Make &amp; Model {formData.linkedStock && <span style={{ color: '#059669', fontSize: 10 }}>⚡ from Stock</span>}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {carPrefs.map((pref, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    <select value={pref.make} onChange={e => setCarPrefField(index, 'make', e.target.value)} style={{ flex: 1 }} disabled={!!formData.linkedStock}>
                      <option value="">Any Brand</option>
                      {MAKES.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select value={pref.model} onChange={e => setCarPrefField(index, 'model', e.target.value)} style={{ flex: 1 }} disabled={!pref.make || !!formData.linkedStock}>
                      <option value="">Any Model</option>
                      {(carModelLists[index] || []).map(m => <option key={m}>{m}</option>)}
                      {pref.make && !MODELS[pref.make] && pref.model && <option value={pref.model}>{pref.model}</option>}
                      <option value="Other">Other</option>
                    </select>
                    {index === carPrefs.length - 1 && !formData.linkedStock && (
                      <button type="button" className="btn btn-out" style={{ padding: '0 12px' }} onClick={addCarPref} title="Add another car preference">+</button>
                    )}
                    {carPrefs.length > 1 && !formData.linkedStock && (
                      <button type="button" className="btn btn-out" style={{ padding: '0 12px', color: 'red' }} onClick={() => removeCarPref(index)} title="Remove">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Budget ₹</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleChange} placeholder="Max budget" />
            </div>
            <div className="fg"><label>Fuel Preference</label>
              <select name="fuel" value={formData.fuel} onChange={handleChange}>
                <option>Any</option>
                {FUELS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="fg"><label>Transmission</label>
              <select name="trans" value={formData.trans} onChange={handleChange}>
                <option>Any</option>
                {TRANS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Color Preference</label>
              <select name="color" value={formData.color} onChange={handleChange}>
                <option>Any</option>
                {COLORS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg"><label>Year From</label>
              <select name="yearFrom" value={formData.yearFrom} onChange={handleChange}>
                <option value="">Any</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg"><label>Year To</label>
              <select name="yearTo" value={formData.yearTo} onChange={handleChange}>
                <option value="">Any</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Assignment */}
          <div className="sect-lbl"><i className="fa fa-list-check"></i> Assignment & Status</div>
          <div className="grid3">
            <div className="fg"><label>Executive</label>
              <select name="assigned" value={formData.assigned} onChange={handleChange}>
                <option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option>
                <option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option>
                <option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option>
              </select>
            </div>
            <div className="fg"><label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option>New</option><option>In-Progress</option><option>Closed-Won</option><option>Closed-Lost</option><option>Hold</option>
              </select>
            </div>
            <div className="fg"><label>Next Follow-Up Date</label>
              <input type="date" name="nextFU" value={formData.nextFU} onChange={handleChange} />
            </div>
          </div>
          <div className="grid2">
            <div className="fg">
              <label>Updated By</label>
              <input value={editData?.updatedBy || currentUser?.name || ''} readOnly style={{ background: 'var(--bg-card-hover)', color: 'var(--text2)', cursor: 'not-allowed' }} placeholder="User name" />
            </div>
            <div className="fg"><label>Remarks</label>
              <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Additional notes…" />
            </div>
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save Inquiry</>}
          </button>
        </div>
      </div>
    </div>
  );
};

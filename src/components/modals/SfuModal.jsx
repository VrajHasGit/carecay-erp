import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useData } from '../../contexts/DataContext';
import { autoFillFromSalInq, autoFillFromStockId } from '../../utils/relations';
import { FUELS, OWNERS } from '../../utils/constants';
import { uploadAudioToStorage } from '../../utils/uploadMedia';

const EXEC_OPTIONS = ['Ritesh Shah', 'Rajan Desai', 'Kalpesh Joshi', 'Marut Dandawala', 'Isha Dashraniya', 'Pinal Desai', 'Mittal Mehta', 'Amisha Dave', 'Dipti'];
const normalizeExec = (val) => EXEC_OPTIONS.find(n => n.toUpperCase() === (val || '').toUpperCase()) || val || 'Ritesh Shah';

const BLANK = {
  sf_inqid: '', sf_stkid: '', sf_cname: '', sf_mob: '', sf_budget: '',
  sf_make: '', sf_model: '', sf_var: '', sf_year: '', sf_fuel: 'Petrol',
  sf_km: '', sf_own: '1st', sf_regn: '', sf_testDrive: 'No',
  followUps: []
};

export const SfuModal = ({ isOpen, onClose, onSave, editData, quickInqId, onSendToBooking }) => {
  const { data: ctxData } = useData();
  const [formData, setFormData] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState('');
  const [expandedSection, setExpandedSection] = useState('customer'); // 'customer', 'followups'
  const [audioFiles, setAudioFiles] = useState({}); // { index: File }
  const [buyerPrefs, setBuyerPrefs] = useState(null); // full preference set from linked Sales Inquiry
  const [assignedExec, setAssignedExec] = useState(''); // locked from inquiry's assignedTo
  const [showDealStockDropdown, setShowDealStockDropdown] = useState(false);
  const [dealBrowseAll, setDealBrowseAll] = useState(false);

  const getFilteredDealStock = (query) => {
    const available = (ctxData?.stk || []).filter(r => r.status === 'In Stock' || r.status === 'Ready for Sale');
    const q = (query || '').trim().toLowerCase();
    if (!q) return dealBrowseAll ? available.slice(0, 8) : [];
    return available.filter(s => {
      const regNo = (s.regNo || s.sk_regn || '').toLowerCase();
      const make = (s.make || s.sk_make || '').toLowerCase();
      const model = (s.model || s.sk_model || '').toLowerCase();
      const stkId = (s.stkId || s.id || '').toLowerCase();
      return regNo.includes(q) || stkId.includes(q) || make.includes(q) || model.includes(q);
    }).slice(0, 8);
  };

  const lookupSalInq = async (id) => {
    if (!id) return null;
    const local = (ctxData?.sal_inq || []).find(r =>
      (r.salId || '').toLowerCase() === id.toLowerCase() ||
      (r.id || '').toLowerCase() === id.toLowerCase()
    );
    if (local) return local;
    return await autoFillFromSalInq(id);
  };

  const lookupStock = async (id) => {
    if (!id) return null;
    const local = (ctxData?.stk || []).find(r =>
      (r.stkId || '').toLowerCase() === id.toLowerCase() ||
      (r.id || '').toLowerCase() === id.toLowerCase()
    );
    if (local) return local;
    return await autoFillFromStockId(id);
  };

  const applyInqAutoFill = async (id) => {
    const d = await lookupSalInq(id);
    if (d) {
      const exec = d.assignedTo || d.assigned || '';
      if (exec) setAssignedExec(exec);
      setFormData(prev => ({
        ...prev,
        sf_cname: d.buyerName || prev.sf_cname,
        sf_mob: d.mobile || prev.sf_mob,
        sf_budget: d.budget || prev.sf_budget,
        sf_make: d.makePref || prev.sf_make,
        sf_model: d.model || prev.sf_model,
        sf_year: d.yearFrom || d.yearTo || prev.sf_year,
        sf_stkid: d.linkedStock || prev.sf_stkid,
      }));
      setBuyerPrefs({
        carPrefs: (d.carPrefs && d.carPrefs.length) ? d.carPrefs : ((d.makePref || d.model) ? [{ make: d.makePref, model: d.model }] : []),
        budget: d.budget, fuel: d.fuel, trans: d.trans, color: d.color,
        km: d.km, yearFrom: d.yearFrom, yearTo: d.yearTo, city: d.city,
      });
      setAutoFillMsg(`✅ Auto-filled from: ${d.buyerName || id}`);
      setTimeout(() => setAutoFillMsg(''), 4000);
      if (d.linkedStock) applyStockAutoFill(d.linkedStock);
    } else {
      setBuyerPrefs(null);
    }
  };

  const applyStockAutoFill = async (id) => {
    const d = await lookupStock(id);
    if (d) {
      setFormData(prev => ({
        ...prev,
        sf_make: d.make || d.sk_make || prev.sf_make,
        sf_model: d.model || d.sk_model || prev.sf_model,
        sf_var: d.variant || d.sk_var || prev.sf_var,
        sf_year: d.year || d.sk_year || prev.sf_year,
        sf_fuel: d.fuel || d.sk_fuel || prev.sf_fuel,
        sf_km: d.km || d.sk_km || prev.sf_km,
        sf_own: d.owners || d.sk_own || prev.sf_own,
        sf_regn: d.regNo || d.sk_regn || prev.sf_regn,
        sf_budget: d.sprice || d.sp || d.sk_sp || prev.sf_budget,
      }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAutoFillMsg('');
      setExpandedSection('customer');
      setAudioFiles({});
      setBuyerPrefs(null);
      setAssignedExec('');

      if (editData) {
        const migrated = { ...BLANK, ...editData };
        if (!migrated.followUps) migrated.followUps = [];
        migrated.followUps = migrated.followUps.map(fu => ({ ...fu, isSaved: true, exec: normalizeExec(fu.exec) }));
        setFormData(migrated);
        if (migrated.sf_inqid) applyInqAutoFill(migrated.sf_inqid);
        else if (migrated.sf_stkid) applyStockAutoFill(migrated.sf_stkid);
      } else if (quickInqId) {
        setFormData({ ...BLANK, sf_inqid: quickInqId });
        applyInqAutoFill(quickInqId);
      } else {
        setFormData(BLANK);
      }
    }
  }, [isOpen, editData, quickInqId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'sf_inqid' && value.length >= 3) applyInqAutoFill(value);
    if (name === 'sf_stkid' && value.length >= 3) applyStockAutoFill(value);
  };

  const handleFollowUpChange = (index, field, value) => {
    const newFollowUps = formData.followUps.map((fu, i) => {
      if (i === index) return { ...fu, [field]: value };
      if (index === 0 && field === 'exec' && !fu.isSaved) return { ...fu, exec: value };
      return fu;
    });
    setFormData(prev => ({ ...prev, followUps: newFollowUps }));
  };

  const handleDiscussedCarChange = (idx, cIdx, field, value) => {
    const newFollowUps = [...formData.followUps];
    const fu = { ...newFollowUps[idx] };
    const cars = fu.discussedCars ? [...fu.discussedCars] : [];
    if (!cars[cIdx]) cars[cIdx] = { car: '', offer: '', expectation: '' };
    cars[cIdx] = { ...cars[cIdx], [field]: value };
    fu.discussedCars = cars;
    newFollowUps[idx] = fu;
    setFormData(prev => ({ ...prev, followUps: newFollowUps }));
  };

  const addDiscussedCar = (idx) => {
    const newFollowUps = [...formData.followUps];
    const fu = { ...newFollowUps[idx] };
    fu.discussedCars = [...(fu.discussedCars || [{ car: fu.car || '', offer: fu.offer || '', expectation: fu.exp || '' }]), { car: '', offer: '', expectation: '' }];
    newFollowUps[idx] = fu;
    setFormData(prev => ({ ...prev, followUps: newFollowUps }));
  };

  const removeDiscussedCar = (idx, cIdx) => {
    const newFollowUps = [...formData.followUps];
    const fu = { ...newFollowUps[idx] };
    if (fu.discussedCars && fu.discussedCars.length > 1) {
      fu.discussedCars = fu.discussedCars.filter((_, i) => i !== cIdx);
    } else {
      fu.discussedCars = [{ car: '', offer: '', expectation: '' }];
    }
    newFollowUps[idx] = fu;
    setFormData(prev => ({ ...prev, followUps: newFollowUps }));
  };

  const addFollowUp = () => {
    if (formData.followUps.length >= 8) return;
    const previousExec = assignedExec || (formData.followUps.length > 0 ? formData.followUps[0].exec : '');
    
    let prefillCar = '';
    if (formData.sf_stkid) {
      prefillCar = [formData.sf_make, formData.sf_model, formData.sf_regn].filter(Boolean).join(' ');
    }

    setFormData(prev => ({
      ...prev,
      followUps: [...prev.followUps, {
        date: new Date().toISOString().split('T')[0],
        time: "", mode: "Call", seq: `${prev.followUps.length + 1}${['st','nd','rd','th'][Math.min(prev.followUps.length, 3)]} Call`,
        stat: "Interested", nfd: "", exec: previousExec, rem: "", audioUrl: "", audioName: "",
        discussedCars: [{ car: prefillCar, offer: '', expectation: '' }], dealPrice: ""
      }]
    }));
    setExpandedSection('followups');
  };

  const handleAudioChange = (index, e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFiles(prev => ({ ...prev, [index]: e.target.files[0] }));
    }
  };

  const uploadPendingAudio = async (followUps) => {
    const next = [...followUps];
    for (let i = 0; i < next.length; i++) {
      if (audioFiles[i]) {
        const url = await uploadAudioToStorage(audioFiles[i], formData.sf_inqid || 'sfu');
        next[i].audioUrl = url;
        next[i].audioName = audioFiles[i].name;
      }
    }
    return next;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rawFollowUps = await uploadPendingAudio(formData.followUps);
      const newFollowUps = assignedExec
        ? rawFollowUps.map(fu => ({ ...fu, exec: assignedExec }))
        : rawFollowUps;
      const lastFu = newFollowUps.length > 0 ? newFollowUps[newFollowUps.length - 1] : null;
      const latestStat = lastFu?.stat || formData.sf_stat || 'Interested';
      const dataToSave = { ...formData, followUps: newFollowUps, sf_stat: latestStat };

      if (onSave) {
        await onSave(dataToSave);
      } else {
        if (editData) {
          await updateDoc(doc(db, 'sfu', editData.id), dataToSave);
        } else {
          await addDoc(collection(db, 'sfu'), { ...dataToSave, createdAt: new Date().toISOString() });
        }
        onClose();
      }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSendToBooking = async () => {
    if (!await window.confirm('Save changes and send this inquiry to Sales Order Booking?')) return;
    setSaving(true);
    try {
      const rawFollowUps2 = await uploadPendingAudio(formData.followUps);
      const newFollowUps = assignedExec
        ? rawFollowUps2.map(fu => ({ ...fu, exec: assignedExec }))
        : rawFollowUps2;
      const lastFu = newFollowUps.length > 0 ? newFollowUps[newFollowUps.length - 1] : null;
      const latestStat = lastFu?.stat || formData.sf_stat || 'Closed-Won';
      const dataToSave = { ...formData, followUps: newFollowUps, sf_stat: latestStat };

      let savedRec = { ...dataToSave };
      if (!editData) {
        const docRef = await addDoc(collection(db, 'sfu'), { ...dataToSave, createdAt: new Date().toISOString() });
        savedRec.id = docRef.id;
      } else {
        await updateDoc(doc(db, 'sfu', editData.id), dataToSave);
        savedRec.id = editData.id;
      }

      if (onSendToBooking) await onSendToBooking(savedRec);
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save and send to order booking.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sec) => setExpandedSection(prev => prev === sec ? '' : sec);

  const lastFuStat = formData.followUps.length > 0 ? formData.followUps[formData.followUps.length - 1].stat : '';
  const canSendToBooking = lastFuStat === 'Closed-Won';

  return (
    <div className="overlay on" id="m_sfu">
      <div className="mbox" style={{ maxWidth: '800px' }}>
        <div className="m-hdr">
          <div className="m-hdr-icon">💬</div>
          <h3>Sales Follow-Up</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body" style={{ padding: '16px' }}>
          {autoFillMsg && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoFillMsg}
            </div>
          )}

          {/* ACCORDION 1: CUSTOMER & VEHICLE INFO */}
          <div className="accordion-section" style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="accordion-header" onClick={() => toggleSection('customer')} style={{ padding: '12px 16px', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
              <span><i className="fa fa-user" style={{marginRight: 8, color: 'var(--or1)'}}></i> Customer & Vehicle Info</span>
              <span>{expandedSection === 'customer' ? '▲' : '▼'}</span>
            </div>
            {expandedSection === 'customer' && (
              <div className="accordion-content" style={{ padding: '16px', background: 'var(--bg)' }}>
                <div className="grid3">
                  <div className="fg"><label>Sales Inquiry ID <span style={{color:"var(--or1)",fontSize:"10px"}}>⚡ Auto-Fill</span></label><input name="sf_inqid" value={formData.sf_inqid} onChange={handleChange} placeholder="SIN-2025-0001" disabled={!!editData || !!quickInqId} /></div>
                  <div className="fg"><label>Stock ID <span style={{color:"#059669",fontSize:"10px"}}>⚡ Auto-Fill</span></label><input name="sf_stkid" value={formData.sf_stkid} onChange={handleChange} placeholder="STK-2025-0001" disabled={!!editData} /></div>
                  <div className="fg"><label>Budget ₹</label><input type="number" name="sf_budget" value={formData.sf_budget} onChange={handleChange} placeholder="0" /></div>
                </div>
                <div className="grid3">
                  <div className="fg"><label>Customer Name</label><input name="sf_cname" value={formData.sf_cname} onChange={handleChange} placeholder="Auto-filled" disabled={!!formData.sf_inqid} /></div>
                  <div className="fg"><label>Customer Mobile</label><input name="sf_mob" value={formData.sf_mob} onChange={handleChange} type="tel" placeholder="Mobile" disabled={!!formData.sf_inqid} /></div>
                  <div className="fg">
                    <label>Test Drive Given?</label>
                    <select name="sf_testDrive" value={formData.sf_testDrive} onChange={handleChange}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                </div>

                {buyerPrefs && (buyerPrefs.carPrefs?.length > 0 || buyerPrefs.budget || buyerPrefs.fuel || buyerPrefs.trans || buyerPrefs.color || buyerPrefs.km || buyerPrefs.yearFrom || buyerPrefs.yearTo) && (
                  <div style={{ marginTop: 10, background: 'rgba(245,158,11,.06)', border: '1px dashed var(--or1)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--or1)', marginBottom: 8 }}>
                      <i className="fa fa-star" style={{ marginRight: 6 }}></i> Buyer's Preferences (from Sales Inquiry)
                    </div>
                    {buyerPrefs.carPrefs?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {buyerPrefs.carPrefs.map((p, i) => (
                          <span key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                            <i className="fa fa-car" style={{ marginRight: 5, color: 'var(--or1)' }}></i>
                            {p.make || 'Any Brand'} {p.model || 'Any Model'}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 12, color: 'var(--text2)' }}>
                      {buyerPrefs.budget && <span><b>Budget:</b> ₹{Number(buyerPrefs.budget).toLocaleString('en-IN')}</span>}
                      {buyerPrefs.fuel && buyerPrefs.fuel !== 'Any' && <span><b>Fuel:</b> {buyerPrefs.fuel}</span>}
                      {buyerPrefs.trans && buyerPrefs.trans !== 'Any' && <span><b>Transmission:</b> {buyerPrefs.trans}</span>}
                      {buyerPrefs.color && buyerPrefs.color !== 'Any' && <span><b>Color:</b> {buyerPrefs.color}</span>}
                      {buyerPrefs.km && <span><b>Max KM:</b> {Number(buyerPrefs.km).toLocaleString('en-IN')}</span>}
                      {(buyerPrefs.yearFrom || buyerPrefs.yearTo) && <span><b>Year:</b> {buyerPrefs.yearFrom || 'Any'} – {buyerPrefs.yearTo || 'Any'}</span>}
                      {buyerPrefs.city && <span><b>City:</b> {buyerPrefs.city}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 2: FOLLOW-UPS */}
          <div className="accordion-section" style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="accordion-header" onClick={() => toggleSection('followups')} style={{ padding: '12px 16px', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
              <span><i className="fa fa-list-check" style={{marginRight: 8, color: 'var(--primary)'}}></i> Follow-Ups ({formData.followUps.length}/8)</span>
              <span>{expandedSection === 'followups' ? '▲' : '▼'}</span>
            </div>
            {expandedSection === 'followups' && (
              <div className="accordion-content" style={{ padding: '16px', background: 'var(--bg)' }}>
                {formData.followUps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>No follow-ups recorded yet.</div>
                ) : (
                  formData.followUps.map((fu, idx) => (
                    <div key={idx} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: idx < formData.followUps.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{background: 'var(--primary)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12}}>{idx + 1}</span>
                        Follow Up - {fu.seq || `${idx+1} Call`}
                      </h4>
                      <div className="grid3">
                        <div className="fg"><label>Date *</label><input type="date" value={fu.date} onChange={(e) => handleFollowUpChange(idx, 'date', e.target.value)} disabled={fu.isSaved} /></div>
                        <div className="fg"><label>Time</label><input type="time" value={fu.time} onChange={(e) => handleFollowUpChange(idx, 'time', e.target.value)} disabled={fu.isSaved} /></div>
                        <div className="fg"><label>Mode</label><select value={fu.mode} onChange={(e) => handleFollowUpChange(idx, 'mode', e.target.value)} disabled={fu.isSaved}><option>Call</option><option>WhatsApp</option><option>Visit</option><option>Email</option><option>SMS</option></select></div>
                      </div>
                      <div className="grid3">
                        <div className="fg"><label>Status</label><select value={fu.stat} onChange={(e) => handleFollowUpChange(idx, 'stat', e.target.value)} disabled={fu.isSaved}><option>Interested</option><option>Not Interested</option><option>Callback</option><option>Site Visit</option><option>Price Nego</option><option>Closed-Won</option><option>Closed-Lost</option></select></div>
                        <div className="fg"><label>Next Follow-Up</label><input type="date" value={fu.stat?.startsWith('Closed') ? '' : fu.nfd} onChange={(e) => handleFollowUpChange(idx, 'nfd', e.target.value)} disabled={fu.isSaved || fu.stat?.startsWith('Closed')} /></div>
                        <div className="fg">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            Executive
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <i className="fa fa-lock" style={{ fontSize: 9 }}></i> from Inquiry
                            </span>
                          </label>
                          <input
                            value={assignedExec || fu.exec || ''}
                            readOnly
                            style={{ background: 'var(--surface)', cursor: 'not-allowed', color: 'var(--text2)' }}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 10, background: 'var(--bg2)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                           <label style={{ margin: 0, fontWeight: 600, color: 'var(--primary)' }}>Cars Discussed</label>
                           {!fu.isSaved && !formData.sf_stkid && (
                             <button type="button" onClick={() => addDiscussedCar(idx)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><i className="fa fa-plus"></i> Add Car</button>
                           )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 30px', gap: 8, fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>
                           <div>Car Discussed</div>
                           <div>Offered Price ₹</div>
                           <div>Customer Expectation ₹</div>
                           <div></div>
                        </div>
                        {(fu.discussedCars && fu.discussedCars.length > 0 ? fu.discussedCars : [{ car: fu.car || '', offer: fu.offer || '', expectation: fu.exp || '' }]).map((c, cIdx) => (
                           <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 30px', gap: 8, marginBottom: 8 }}>
                             <input type="text" value={c.car} onChange={(e) => handleDiscussedCarChange(idx, cIdx, 'car', e.target.value)} placeholder="Model / Reg No" disabled={fu.isSaved || !!formData.sf_stkid} style={{ padding: '6px 8px', fontSize: 12 }} />
                             <input type="number" value={c.offer} onChange={(e) => handleDiscussedCarChange(idx, cIdx, 'offer', e.target.value)} placeholder="0" disabled={fu.isSaved} style={{ padding: '6px 8px', fontSize: 12 }} />
                             <input type="number" value={c.expectation} onChange={(e) => handleDiscussedCarChange(idx, cIdx, 'expectation', e.target.value)} placeholder="0" disabled={fu.isSaved} style={{ padding: '6px 8px', fontSize: 12 }} />
                             {!fu.isSaved && (!formData.sf_stkid || fu.discussedCars?.length > 1) && (
                               <button type="button" onClick={() => removeDiscussedCar(idx, cIdx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa fa-times"></i></button>
                             )}
                           </div>
                        ))}
                      </div>
                      {fu.stat === 'Closed-Won' && (
                        <div style={{ marginTop: 10, background: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
                          <div className="grid2">
                            <div className="fg" style={{ position: 'relative' }}>
                              <label style={{ color: 'var(--success)', fontWeight: 600 }}>Find Deal Vehicle (Stock) *</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input type="text" value={fu.finalRegn || ''} 
                                  onChange={(e) => {
                                    handleFollowUpChange(idx, 'finalRegn', e.target.value.toUpperCase());
                                    handleFollowUpChange(idx, 'fetchedCarDetails', null);
                                    setShowDealStockDropdown(true);
                                    setDealBrowseAll(false);
                                  }} 
                                  onFocus={() => setShowDealStockDropdown(true)}
                                  onBlur={() => setTimeout(() => setShowDealStockDropdown(false), 150)}
                                  placeholder="Search Reg No / Stock ID / Make…" disabled={fu.isSaved} style={{ borderColor: 'var(--success)', flex: 1 }} />
                                <button type="button" className="btn btn-out btn-sm" onClick={() => { setDealBrowseAll(b => !b); setShowDealStockDropdown(true); handleFollowUpChange(idx, 'finalRegn', ''); handleFollowUpChange(idx, 'fetchedCarDetails', null); }} disabled={fu.isSaved} style={{ borderColor: 'var(--success)', color: 'var(--success)', padding: '0 12px' }}><i className="fa fa-list"></i> {dealBrowseAll ? 'Close' : 'Browse'}</button>
                              </div>
                              {showDealStockDropdown && (!fu.isSaved) && (fu.finalRegn || dealBrowseAll) && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 20px rgba(0,0,0,.15)', maxHeight: 220, overflowY: 'auto' }}>
                                  {getFilteredDealStock(fu.finalRegn).length > 0 ? getFilteredDealStock(fu.finalRegn).map(stk => (
                                    <div key={stk.id} onMouseDown={() => {
                                      handleFollowUpChange(idx, 'finalRegn', stk.regNo || stk.sk_regn || stk.stkId || stk.id);
                                      handleFollowUpChange(idx, 'fetchedCarDetails', {
                                        stkId: stk.stkId || stk.id || 'N/A',
                                        make: stk.make || stk.sk_make || 'N/A',
                                        model: stk.model || stk.sk_model || 'N/A',
                                        color: stk.color || stk.sk_color || 'N/A'
                                      });
                                      setShowDealStockDropdown(false);
                                      setDealBrowseAll(false);
                                    }}
                                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border2)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}
                                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,.06)'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                      <span style={{ fontWeight: 700, color: '#059669', fontFamily: "'Space Grotesk',sans-serif", minWidth: 110 }}>{stk.regNo || stk.sk_regn || '—'}</span>
                                      <span style={{ fontWeight: 600 }}>{stk.make || stk.sk_make} {stk.model || stk.sk_model}</span>
                                      <span style={{ color: 'var(--text3)' }}>({stk.stkId || stk.id})</span>
                                      <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 700 }}>₹{Number(stk.sprice || stk.sp || stk.sk_sp || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                  )) : (
                                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No matching vehicle in stock.</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="fg">
                              <label style={{ color: 'var(--success)', fontWeight: 600 }}>Deal Close Price ₹ *</label>
                              <input type="number" value={fu.dealPrice || ''} onChange={(e) => handleFollowUpChange(idx, 'dealPrice', e.target.value)} placeholder="Final agreed amount" disabled={fu.isSaved} style={{ borderColor: 'var(--success)' }} />
                            </div>
                          </div>
                          {fu.fetchedCarDetails && (
                            <div style={{marginTop: 10, fontSize: 12, color: 'var(--text)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
                               <div><strong style={{color: 'var(--text3)'}}>Stock ID</strong><br/>{fu.fetchedCarDetails.stkId}</div>
                               <div><strong style={{color: 'var(--text3)'}}>Make</strong><br/>{fu.fetchedCarDetails.make}</div>
                               <div><strong style={{color: 'var(--text3)'}}>Model</strong><br/>{fu.fetchedCarDetails.model}</div>
                               <div><strong style={{color: 'var(--text3)'}}>Color</strong><br/>{fu.fetchedCarDetails.color}</div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="fg" style={{ marginTop: 10 }}>
                        <label>Remarks / Notes</label>
                        <textarea value={fu.rem} onChange={(e) => handleFollowUpChange(idx, 'rem', e.target.value)} rows="2" placeholder="Discussion summary..." style={{width: '100%', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'}} disabled={fu.isSaved} />
                      </div>
                      <div className="fg" style={{ marginTop: 10, background: 'var(--bg2)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="fa fa-microphone" style={{color: 'var(--danger)'}}></i> Call Recording (Voice Note)</label>
                        {fu.audioUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                            <audio src={fu.audioUrl} controls style={{ height: 36 }} />
                            {fu.audioUrl.startsWith('data:') ? (
                              <a href={fu.audioUrl} download={fu.audioName || 'audio.mp3'} style={{ fontSize: 12, color: 'var(--or1)' }}>Download</a>
                            ) : (
                              <a href={fu.audioUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--or1)' }}>Download</a>
                            )}
                          </div>
                        ) : (
                          <div style={{ marginTop: 6 }}>
                            <input type="file" accept="audio/*" onChange={(e) => handleAudioChange(idx, e)} style={{ fontSize: 13 }} disabled={fu.isSaved} />
                            {audioFiles[idx] && (
                              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontSize: 12, color: 'var(--success)' }}>Ready to upload: {audioFiles[idx].name}</span>
                                <audio src={URL.createObjectURL(audioFiles[idx])} controls style={{ height: 36 }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {!formData.followUps.some(fu => fu.stat === 'Closed-Won' || fu.stat === 'Closed-Lost') && formData.followUps.length < 8 && (
                  <button onClick={addFollowUp} className="btn btn-out" style={{ width: '100%', padding: 12, borderStyle: 'dashed', marginTop: 10 }}>
                    <i className="fa fa-plus"></i> Add Follow-Up
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
};

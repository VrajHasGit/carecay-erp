import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useData } from '../../contexts/DataContext';
import { autoFillFromInq } from '../../utils/relations';
import { FUELS, OWNERS } from '../../utils/constants';
import { uploadAudioToStorage } from '../../utils/uploadMedia';

export const PfuModal = ({ isOpen, onClose, onSave, editData, quickInqId, onSendToCloser }) => {
  const { data: ctxData } = useData();
  const [formData, setFormData] = useState({
    pf_inqid: "", pf_sname: "", pf_smob: "", pf_veh: "", pf_var: "",
    pf_year: "", pf_fuel: "Petrol", pf_km: "", pf_own: "1st",
    pf_inqid: "", pf_sname: "", pf_smob: "", pf_veh: "", pf_var: "",
    pf_year: "", pf_fuel: "Petrol", pf_km: "", pf_own: "1st",
    followUps: []
  });
  
  const [saving, setSaving] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState('');
  const [expandedSection, setExpandedSection] = useState('customer'); // 'customer', 'followups'
  const [audioFiles, setAudioFiles] = useState({}); // { index: File }

  const EXEC_OPTIONS = ['Ritesh Shah', 'Rajan Desai', 'Kalpesh Joshi', 'Marut Dandawala', 'Isha Dashraniya', 'Pinal Desai', 'Mittal Mehta', 'Amisha Dave', 'Dipti'];
  const normalizeExec = (val) => EXEC_OPTIONS.find(n => n.toUpperCase() === (val || '').toUpperCase()) || val || 'Ritesh Shah';

  const lookupInquiry = async (inqId) => {
    if (!inqId) return null;
    const local = (ctxData?.pur_inq || []).find(r =>
      (r.inqId || '').toLowerCase() === inqId.toLowerCase() ||
      (r.id || '').toLowerCase() === inqId.toLowerCase()
    );
    if (local) return local;
    return await autoFillFromInq(inqId);
  };

  const applyAutoFill = async (inqId) => {
    const inqData = await lookupInquiry(inqId);
    if (inqData) {
      setFormData(prev => ({
        ...prev,
        pf_sname: inqData.sellerName || prev.pf_sname,
        pf_smob: inqData.mobile || prev.pf_smob,
        pf_veh: inqData.make ? `${inqData.make} ${inqData.model || ''}`.trim() : prev.pf_veh,
        pf_var: inqData.variant || prev.pf_var,
        pf_year: inqData.year || prev.pf_year,
        pf_fuel: inqData.fuel || prev.pf_fuel,
        pf_km: inqData.km || prev.pf_km,
        pf_own: inqData.owners || prev.pf_own,
      }));
      setAutoFillMsg(`✅ Auto-filled from: ${inqData.sellerName || inqId}`);
      setTimeout(() => setAutoFillMsg(''), 4000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAutoFillMsg('');
      setExpandedSection('customer');
      setAudioFiles({});
      
      if (editData) {
        const migratedData = { ...editData };
        // Migrate legacy flat structure to followUps array
        if (!migratedData.followUps && (migratedData.pf_date || migratedData.pf_time || migratedData.pf_rem)) {
          migratedData.followUps = [{
            date: migratedData.pf_date || "",
            time: migratedData.pf_time || "",
            mode: migratedData.pf_mode || "Call",
            seq: migratedData.pf_seq || "1st Call",
            stat: migratedData.pf_stat || "Interested",
            nfd: migratedData.pf_nfd || "",
            exec: migratedData.pf_exec || "Ritesh Shah",
            rem: migratedData.pf_rem || "",
            exp: migratedData.pf_exp || "",
            offer: migratedData.pf_offer || "",
            dealPrice: migratedData.pf_close || migratedData.pf_nego || ""
          }];
          delete migratedData.pf_date; delete migratedData.pf_time; delete migratedData.pf_mode;
          delete migratedData.pf_seq; delete migratedData.pf_stat; delete migratedData.pf_nfd;
          delete migratedData.pf_exec; delete migratedData.pf_rem; delete migratedData.pf_exp; delete migratedData.pf_offer; delete migratedData.pf_close; delete migratedData.pf_nego;
        }
        if (!migratedData.followUps) migratedData.followUps = [];
        
        // Mark existing follow-ups as saved/locked; normalize exec casing from old uppercase saves
        migratedData.followUps = migratedData.followUps.map(fu => ({ ...fu, isSaved: true, exec: normalizeExec(fu.exec) }));

        const inqIdToUse = migratedData.pf_inqid || migratedData.inqId || '';
        setFormData({ ...migratedData, pf_inqid: inqIdToUse });
        if (inqIdToUse) applyAutoFill(inqIdToUse);
      } else if (quickInqId) {
        setFormData({
          pf_inqid: quickInqId, pf_sname: "", pf_smob: "", pf_veh: "", pf_var: "",
          pf_year: "", pf_fuel: "Petrol", pf_km: "", pf_own: "1st", followUps: []
        });
        applyAutoFill(quickInqId);
      } else {
        setFormData({
          pf_inqid: "", pf_sname: "", pf_smob: "", pf_veh: "", pf_var: "",
          pf_year: "", pf_fuel: "Petrol", pf_km: "", pf_own: "1st", followUps: []
        });
      }
    }
  }, [isOpen, editData, quickInqId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'pf_inqid' && value.length >= 3) {
      applyAutoFill(value);
    }
  };

  const handleFollowUpChange = (index, field, value) => {
    const newFollowUps = formData.followUps.map((fu, i) => {
      if (i === index) return { ...fu, [field]: value };
      if (index === 0 && field === 'exec' && !fu.isSaved) return { ...fu, exec: value };
      return fu;
    });
    setFormData(prev => ({ ...prev, followUps: newFollowUps }));
  };

  const addFollowUp = () => {
    if (formData.followUps.length >= 4) return;
    const previousExec = formData.followUps.length > 0 ? formData.followUps[0].exec : "Ritesh Shah";
    setFormData(prev => ({
      ...prev,
      followUps: [...prev.followUps, {
        date: new Date().toISOString().split('T')[0],
        time: "", mode: "Call", seq: `${prev.followUps.length + 1}${['st','nd','rd','th'][Math.min(prev.followUps.length, 3)]} Call`,
        stat: "Interested", nfd: "", exec: previousExec, rem: "", audioUrl: "", audioName: "",
        exp: "", offer: "", dealPrice: ""
      }]
    }));
    setExpandedSection('followups');
  };

  const handleAudioChange = (index, e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFiles(prev => ({ ...prev, [index]: e.target.files[0] }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newFollowUps = [...formData.followUps];
      // Upload any newly selected audio files
      for (let i = 0; i < newFollowUps.length; i++) {
        if (audioFiles[i]) {
          const url = await uploadAudioToStorage(audioFiles[i], formData.pf_inqid || 'pfu');
          newFollowUps[i].audioUrl = url;
          newFollowUps[i].audioName = audioFiles[i].name;
        }
      }
      
      // Sync pf_stat from the last follow-up so filter & table display work correctly
      const lastFu = newFollowUps.length > 0 ? newFollowUps[newFollowUps.length - 1] : null;
      const latestStat = lastFu?.stat || formData.pf_stat || 'Interested';
      const dataToSave = { ...formData, followUps: newFollowUps, pf_stat: latestStat };

      // Always delegate DB write to parent via onSave — avoid double-write + capitalization corruption
      if (onSave) {
        await onSave(dataToSave);
      } else {
        // Fallback: write directly only when no parent handler
        if (editData) {
          await updateDoc(doc(db, 'pfu', editData.id), dataToSave);
        } else {
          await addDoc(collection(db, 'pfu'), { ...dataToSave, createdAt: new Date().toISOString() });
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

  const handleSaveAndSendToCloser = async () => {
    if (!await window.confirm('Save changes and send this inquiry to closer?')) return;
    setSaving(true);
    try {
      const newFollowUps = [...formData.followUps];
      for (let i = 0; i < newFollowUps.length; i++) {
        if (audioFiles[i]) {
          const url = await uploadAudioToStorage(audioFiles[i], formData.pf_inqid || 'pfu');
          newFollowUps[i].audioUrl = url;
          newFollowUps[i].audioName = audioFiles[i].name;
        }
      }
      // Sync pf_stat from the last follow-up
      const lastFu2 = newFollowUps.length > 0 ? newFollowUps[newFollowUps.length - 1] : null;
      const latestStat2 = lastFu2?.stat || formData.pf_stat || 'Closed-Won';
      const dataToSave = { ...formData, followUps: newFollowUps, pf_stat: latestStat2 };

      // Delegate write to onSendToCloser (parent handles DB) to avoid double-write
      let savedRec = { ...dataToSave };
      if (!editData) {
        const docRef = await addDoc(collection(db, 'pfu'), { ...dataToSave, createdAt: new Date().toISOString() });
        savedRec.id = docRef.id;
      } else {
        savedRec.id = editData.id;
      }

      if (onSendToCloser) {
        await onSendToCloser(savedRec);
      }
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save and send to closer.');
    } finally {
      setSaving(false);
    }
  };

  const getValRemarks = () => {
    if (!formData.pf_inqid) return '';
    const valRec = (ctxData?.val || []).find(r => r.v_inqid === formData.pf_inqid);
    return valRec ? (valRec.remarks || valRec.v_rem || '') : '';
  };
  const valRemarks = getValRemarks();

  const toggleSection = (sec) => {
    setExpandedSection(prev => prev === sec ? '' : sec);
  };

  return (
    <div className="overlay on" id="m_pfu">
      <div className="mbox" style={{ maxWidth: '800px' }}>
        <div className="m-hdr">
          <div className="m-hdr-icon">📞</div>
          <h3>Purchase Follow-Up</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body" style={{ padding: '16px' }}>
          {autoFillMsg && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoFillMsg}
            </div>
          )}

          {/* ACCORDION 1: CUSTOMER INFO */}
          <div className="accordion-section" style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="accordion-header" onClick={() => toggleSection('customer')} style={{ padding: '12px 16px', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
              <span><i className="fa fa-user" style={{marginRight: 8, color: 'var(--or1)'}}></i> Customer & Vehicle Info</span>
              <span>{expandedSection === 'customer' ? '▲' : '▼'}</span>
            </div>
            {expandedSection === 'customer' && (
              <div className="accordion-content" style={{ padding: '16px', background: 'var(--bg)' }}>
                <div className="grid3">
                  <div className="fg"><label>Inquiry ID <span style={{color:"var(--or1)",fontSize:"10px"}}>⚡ Auto-Fill</span></label><input name="pf_inqid" value={formData.pf_inqid} onChange={handleChange} placeholder="INQ-2025-0001" disabled={!!editData || !!quickInqId} /></div>
                  <div className="fg"><label>Seller Name</label><input name="pf_sname" value={formData.pf_sname} onChange={handleChange} placeholder="Auto-filled" disabled={!!formData.pf_inqid} /></div>
                  <div className="fg"><label>Seller Mobile</label><input name="pf_smob" value={formData.pf_smob} onChange={handleChange} type="tel" placeholder="Mobile" disabled={!!formData.pf_inqid} /></div>
                </div>
                <div className="grid3">
                  <div className="fg"><label>Vehicle Make/Model</label><input name="pf_veh" value={formData.pf_veh} onChange={handleChange} placeholder="Make Model Year" disabled={!!formData.pf_inqid} /></div>
                  <div className="fg"><label>Variant</label><input name="pf_var" value={formData.pf_var} onChange={handleChange} placeholder="Variant" disabled={!!formData.pf_inqid} /></div>
                  <div className="fg"><label>Year</label><input name="pf_year" value={formData.pf_year} onChange={handleChange} placeholder="Year" type="number" disabled={!!formData.pf_inqid} /></div>
                </div>
                <div className="grid3">
                  <div className="fg">
                    <label>Fuel Type</label>
                    <select name="pf_fuel" value={formData.pf_fuel} onChange={handleChange} disabled={!!formData.pf_inqid}>
                      {FUELS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>KM Driven</label><input name="pf_km" value={formData.pf_km} onChange={handleChange} type="number" placeholder="KM" disabled={!!formData.pf_inqid} /></div>
                  <div className="fg">
                    <label>Owners</label>
                    <select name="pf_own" value={formData.pf_own} onChange={handleChange} disabled={!!formData.pf_inqid}>
                      {OWNERS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                {valRemarks && (
                  <div className="fg" style={{ marginTop: 8 }}>
                    <label><span style={{background: 'var(--or1)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, marginRight: 6}}>Valuator Remarks</span></label>
                    <textarea value={valRemarks} disabled rows="2" style={{width: '100%', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', resize: 'none'}} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 2: PRICE DETAILS (Removed - now per follow-up) */}
          {/* ACCORDION 3: FOLLOW-UPS */}
          <div className="accordion-section" style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="accordion-header" onClick={() => toggleSection('followups')} style={{ padding: '12px 16px', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
              <span><i className="fa fa-list-check" style={{marginRight: 8, color: 'var(--primary)'}}></i> Follow-Ups ({formData.followUps.length}/4)</span>
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
                        <div className="fg"><label>Status</label><select value={fu.stat} onChange={(e) => handleFollowUpChange(idx, 'stat', e.target.value)} disabled={fu.isSaved}><option>Interested</option><option>Not Interested</option><option>Callback</option><option>Price Nego</option><option>Closed-Won</option><option>Closed-Lost</option></select></div>
                        <div className="fg"><label>Next Follow-Up</label><input type="date" value={fu.stat?.startsWith('Closed') ? '' : fu.nfd} onChange={(e) => handleFollowUpChange(idx, 'nfd', e.target.value)} disabled={fu.isSaved || fu.stat?.startsWith('Closed')} /></div>
                        <div className="fg"><label>Executive</label><select value={fu.exec} onChange={(e) => handleFollowUpChange(idx, 'exec', e.target.value)} disabled={fu.isSaved || idx > 0}><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option><option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option></select></div>
                      </div>
                      <div className="grid3" style={{ marginTop: 10 }}>
                        <div className="fg"><label>Customer Expectation ₹</label><input type="number" value={fu.exp || ''} onChange={(e) => handleFollowUpChange(idx, 'exp', e.target.value)} placeholder="0" disabled={fu.isSaved} /></div>
                        <div className="fg"><label>Offer Price ₹</label><input type="number" value={fu.offer || ''} onChange={(e) => handleFollowUpChange(idx, 'offer', e.target.value)} placeholder="0" disabled={fu.isSaved} /></div>
                        <div className="fg">
                          <label>Difference (Offer - Exp.) ₹</label>
                          <div style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: (Number(fu.offer || 0) - Number(fu.exp || 0)) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            ₹ {(Number(fu.offer || 0) - Number(fu.exp || 0)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      {fu.stat === 'Closed-Won' && (
                        <div className="fg" style={{ marginTop: 10, background: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
                          <label style={{ color: 'var(--success)', fontWeight: 600 }}>Deal Close Price ₹ *</label>
                          <input type="number" value={fu.dealPrice || ''} onChange={(e) => handleFollowUpChange(idx, 'dealPrice', e.target.value)} placeholder="Final agreed amount" disabled={fu.isSaved} style={{ borderColor: 'var(--success)' }} />
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
                
                {!formData.followUps.some(fu => fu.stat === 'Closed-Won' || fu.stat === 'Closed-Lost') && formData.followUps.length < 4 && (
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

import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { addRecord, updateRecord, getNextCounter } from '../../services/db';
import { genId, today } from '../../utils/helpers';
import { autoFillFromInq } from '../../utils/relations';
import { MAKES, MODELS, YEARS, FUELS, OWNERS } from '../../utils/constants';
import { processFiles, saveMediaToFirestore, loadMediaFromFirestore, deleteMediaFromFirestore, isImage } from '../../utils/uploadMedia';
import MediaViewer from '../MediaViewer';

export const ValModal = ({ isOpen, onClose, onSave, onSuccess, editData, quickInqId }) => {
  const { data } = useData();
  const [formData, setFormData] = useState({
    v_inqid: "", v_date: "", v_vnum: "", v_cname: "", v_cont: "", v_km: "",
    v_make: "", v_model: "", v_var: "", v_year: "", v_fuel: "", v_own: "",
    v_rc: false, v_ins: false, v_key2: false, v_war: false, v_inv: false,
    v_tyre: "100%", v_eng: "Good",
    v_ovr: "Good", v_stat: "Pending", v_nextfu: "", v_rem: "", v_valname: "",
    v_ref_cost: "",
    v_media: []
  });
  
  const [saving, setSaving] = useState(false);
  const [modelOptions, setModelOptions] = useState([]);
  const [autoFillMsg, setAutoFillMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewer, setViewer] = useState(null);

  // ── In-memory lookup first, Firestore fallback ──
  const lookupInquiry = async (inqId) => {
    if (!inqId) return null;
    const local = (data?.pur_inq || []).find(r =>
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
        v_cname: inqData.sellerName || prev.v_cname || "",
        v_cont: inqData.mobile || prev.v_cont || "",
        v_make: inqData.make || prev.v_make || "",
        v_model: inqData.model || prev.v_model || "",
        v_var: inqData.variant || prev.v_var || "",
        v_year: inqData.year || prev.v_year || "",
        v_fuel: inqData.fuel || prev.v_fuel || "",
        v_km: inqData.km || prev.v_km || "",
        v_vnum: inqData.regNo || prev.v_vnum || "",
        v_own: inqData.owners || prev.v_own || "",
        v_rem: inqData.remarks || prev.v_rem || "",
        v_valname: inqData.valuator || prev.v_valname || "",
      }));
      setModelOptions(MODELS[inqData.make] || []);
      setAutoFillMsg(`✅ Auto-filled from: ${inqData.sellerName || inqId}`);
      setTimeout(() => setAutoFillMsg(''), 4000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAutoFillMsg('');
      if (editData) {
        const inqIdToUse = editData.v_inqid || editData.inqId || '';
        const defaultData = {
          v_inqid: "", v_date: new Date().toISOString().split('T')[0], v_vnum: "", v_cname: "", v_cont: "", v_km: "",
          v_make: "", v_model: "", v_var: "", v_year: "", v_fuel: "Petrol", v_own: "1st",
          v_rc: false, v_ins: false, v_key2: false, v_war: false, v_inv: false, v_tyre: "100%", v_eng: "Good",
          v_ovr: "Good", v_stat: "Pending", v_nextfu: "", v_rem: "", v_valname: "", v_ref_cost: "",
          v_media: []
        };
        setFormData({ ...defaultData, ...editData, v_media: [], v_inqid: inqIdToUse });
        setModelOptions(MODELS[editData.v_make] || []);
        if (inqIdToUse) applyAutoFill(inqIdToUse);
        // Load media from Firestore sub-collection
        if (editData.id) {
          loadMediaFromFirestore('val', editData.id).then(media => {
            if (media.length > 0) {
              setFormData(prev => ({ ...prev, v_media: media }));
            }
          });
        }
      } else if (quickInqId) {
        setFormData(prev => ({ ...prev, v_inqid: quickInqId, v_media: [] }));
        applyAutoFill(quickInqId);
      } else {
        setFormData({
          v_inqid: "", v_date: new Date().toISOString().split('T')[0], v_vnum: "", v_cname: "", v_cont: "", v_km: "",
          v_make: "", v_model: "", v_var: "", v_year: "", v_fuel: "Petrol", v_own: "1st",
          v_rc: false, v_ins: false, v_key2: false, v_war: false, v_inv: false, v_tyre: "100%", v_eng: "Good",
          v_ovr: "Good", v_stat: "Pending", v_nextfu: "", v_rem: "", v_valname: "", v_ref_cost: "",
          v_media: []
        });
        setModelOptions([]);
      }
    }
  }, [isOpen, editData, quickInqId]);

  if (!isOpen) return null;

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (name === 'v_make') {
      setModelOptions(MODELS[value] || []);
      setFormData(prev => ({ ...prev, v_model: '' }));
    }

    if (name === 'v_inqid' && value.length >= 3) {
      applyAutoFill(value);
    }
  };

  // ── Media Processing (INSTANT — no server upload) ──
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus(`Compressing ${files.length} photo${files.length > 1 ? 's' : ''}...`);

    try {
      // Process all files in browser (compress + base64) — NO server calls!
      const processed = await processFiles(files);

      setFormData(prev => ({
        ...prev,
        v_media: [...(prev.v_media || []), ...processed],
      }));

      setUploadProgress(100);
      setUploadStatus(`✅ ${processed.length} photo${processed.length > 1 ? 's' : ''} ready`);
      setTimeout(() => setUploadStatus(''), 2000);
    } catch (err) {
      console.error('Processing error:', err);
      alert(`Failed to process files: ${err.message}`);
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteMedia = async (index) => {
    const media = formData.v_media || [];
    const item = media[index];
    if (!item) return;
    if (!await window.confirm(`Delete ${item.name}?`)) return;

    // If it has a docId, it's saved in Firestore — delete it
    if (item.docId && editData?.id) {
      try {
        await deleteMediaFromFirestore('val', editData.id, item.docId);
      } catch (e) {
        console.warn('Delete from Firestore failed:', e);
      }
    }
    setFormData(prev => ({
      ...prev,
      v_media: prev.v_media.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (shiftToPfu = false) => {
    setSaving(true);
    try {
      // Separate media data from the main form (don't store base64 in main doc)
      const mediaItems = formData.v_media || [];
      const newMediaItems = mediaItems.filter(m => !m.docId);
      const savedDoc = { ...formData, v_media: [], v_media_count: mediaItems.length };
      
      // Clean undefined values to prevent Firestore errors
      Object.keys(savedDoc).forEach(key => {
        if (savedDoc[key] === undefined) {
          delete savedDoc[key];
        }
      });

      let docId;
      if (editData && editData.id) {
        docId = editData.id;
        if (onSave) { await onSave(savedDoc, shiftToPfu); } else { await updateRecord('val', editData.id, savedDoc); }
      } else {
        const cnt = await getNextCounter('val');
        const valId = genId('VAL', cnt);
        const fullDoc = { ...savedDoc, valId, date: formData.date || today() };
        if (onSave) {
          docId = await onSave(fullDoc, shiftToPfu);
        } else {
          const newId = await addRecord('val', fullDoc);
          docId = newId;
          if (onSuccess) await onSuccess();
        }
      }

      // Save new media items to Firestore sub-collection
      if (docId && newMediaItems.length > 0) {
        await saveMediaToFirestore('val', docId, newMediaItems);
      }

      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const mediaItems = formData.v_media || [];

  return (
    <div className="overlay on" id="m_val">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🔍</div>
          <h3>Vehicle Valuation</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          {/* Auto-fill success banner */}
          {autoFillMsg && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoFillMsg}
            </div>
          )}

          <div className="grid3">
            <div className="fg"><label>Inquiry ID <span style={{color:"var(--or1)",fontSize:"10px"}}>⚡ Auto-Fill</span></label><input name="v_inqid" value={formData.v_inqid} onChange={handleChange} placeholder="INQ-2025-0001" disabled={!!editData} /></div>
            <div className="fg"><label>Valuation Date</label><input type="date" name="v_date" value={formData.v_date} onChange={handleChange} /></div>
            <div className="fg"><label>Vehicle Number</label><input name="v_vnum" value={formData.v_vnum} onChange={handleChange} placeholder="GJ-01-AB-1234" disabled={!!formData.v_inqid} /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Customer Name</label><input name="v_cname" value={formData.v_cname} onChange={handleChange} placeholder="Name" disabled={!!formData.v_inqid} /></div>
            <div className="fg"><label>Contact No.</label><input name="v_cont" value={formData.v_cont} onChange={handleChange} type="tel" placeholder="Mobile" disabled={!!formData.v_inqid} /></div>
            <div className="fg"><label>Valuator Name</label><input name="v_valname" value={formData.v_valname || ''} onChange={handleChange} placeholder="Valuator Name" /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>KM Driven</label><input name="v_km" value={formData.v_km} onChange={handleChange} type="number" placeholder="KM" disabled={!!formData.v_inqid} /></div>
            <div className="fg">
              <label>Make</label>
              <select name="v_make" value={formData.v_make} onChange={handleChange} disabled={!!formData.v_inqid}>
                <option value="">Select Brand</option>
                {MAKES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Model</label>
              <select name="v_model" value={formData.v_model} onChange={handleChange} disabled={!!formData.v_inqid}>
                <option value="">Select Model</option>
                {modelOptions.map(m => <option key={m}>{m}</option>)}
                {!MODELS[formData.v_make] && formData.v_make && <option value={formData.v_model}>{formData.v_model}</option>}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="fg"><label>Variant</label><input name="v_var" value={formData.v_var} onChange={handleChange} placeholder="Variant" disabled={!!formData.v_inqid} /></div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Year</label>
              <select name="v_year" value={formData.v_year} onChange={handleChange} disabled={!!formData.v_inqid}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Fuel Type</label>
              <select name="v_fuel" value={formData.v_fuel} onChange={handleChange} disabled={!!formData.v_inqid}>
                <option value="">Select Fuel</option>
                {FUELS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Owner Serial</label>
              <select name="v_own" value={formData.v_own} onChange={handleChange} disabled={!!formData.v_inqid}>
                {OWNERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          
          <div className="sect-lbl"><i className="fa fa-clipboard-check"></i> Inspection Checklist</div>
          <div className="chk-grid">
            <label className="chk-item"><input type="checkbox" name="v_rc" checked={formData.v_rc} onChange={handleChange} /><span>RC Available</span></label>
            <label className="chk-item"><input type="checkbox" name="v_ins" checked={formData.v_ins} onChange={handleChange} /><span>Insurance</span></label>
            <label className="chk-item"><input type="checkbox" name="v_key2" checked={formData.v_key2} onChange={handleChange} /><span>Second Key</span></label>
            <label className="chk-item"><input type="checkbox" name="v_war" checked={formData.v_war} onChange={handleChange} /><span>Warranty</span></label>
            <label className="chk-item"><input type="checkbox" name="v_inv" checked={formData.v_inv} onChange={handleChange} /><span>Invoice</span></label>
          </div>
          
          <div className="grid3">
            <div className="fg"><label>Tyre Condition</label><select name="v_tyre" value={formData.v_tyre} onChange={handleChange}><option>100%</option><option>80%</option><option>60%</option><option>40%</option><option>20%</option></select></div>
            <div className="fg"><label>Engine Condition</label><select name="v_eng" value={formData.v_eng} onChange={handleChange}><option>Average</option><option>Good</option><option>Excellent</option><option>Repair Required</option></select></div>
            <div className="fg"><label>Overall Condition</label><select name="v_ovr" value={formData.v_ovr} onChange={handleChange}><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select></div>
          </div>

          {/* ── Inspection Photos & Videos ── */}
          <div className="sect-lbl"><i className="fa fa-camera"></i> Inspection Photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: 14 }}>
            
            {/* Photos Board */}
            <div style={{
              border: '2px dashed var(--border2)',
              borderRadius: 'var(--radius)',
              padding: uploading ? '12px 16px' : '16px',
              textAlign: 'center',
              background: 'var(--surface2)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
              onClick={() => !uploading && document.getElementById('val_photo_input').click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--bl1)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border2)';
                const dt = e.dataTransfer;
                if (dt.files.length) {
                  const input = document.getElementById('val_photo_input');
                  const newDt = new DataTransfer();
                  Array.from(dt.files).forEach(f => newDt.items.add(f));
                  input.files = newDt.files;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
            >
              <input
                id="val_photo_input"
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              {uploading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <i className="car-spinner" style={{ color: 'var(--bl1)' }}></i>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--text2)' }}>
                      {uploadStatus || `Uploading... ${uploadProgress}%`}
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--bl1)', transition: 'width 0.2s ease-out' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <i className="fa fa-image" style={{ fontSize: 24, color: 'var(--text3)', marginBottom: 6 }}></i>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                    Upload Photos
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>
                    Click or drop JPG, PNG
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Media Thumbnails */}
          {mediaItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 8,
              marginBottom: 14,
            }}>
              {mediaItems.map((item, i) => (
                <div key={i} 
                  className="val-media-thumb"
                  onClick={() => setViewer({ media: mediaItems, index: i })}
                  style={{
                    position: 'relative',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: '#000',
                    aspectRatio: '1',
                    cursor: 'pointer',
                  }}
                  title="Click to view"
                >
                  {isImage(item.type || item.url || item.name) ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)' }}>
                      <i className="fa fa-file" style={{ fontSize: 24, color: 'var(--text3)' }}></i>
                    </div>
                  )}
                  {/* File name */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    padding: '16px 6px 4px', fontSize: 9, color: '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {item.name}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteMedia(i); }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(220,38,38,.85)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      width: 22, height: 22, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10,
                    }}
                    title="Delete"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid3" style={{ marginBottom: 20 }}>
            <div className="fg" style={{ gridColumn: 'span 2' }}>
              <label>Valuator Remarks</label>
              <textarea 
                name="v_rem" 
                value={formData.v_rem} 
                onChange={handleChange} 
                rows="4" 
                placeholder="Add valuator remarks here (max 1000 words)..." 
                style={{ width: '100%', resize: 'vertical', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
              />
            </div>
            <div className="fg">
              <label>Tentative Refurb Cost (₹)</label>
              <input 
                name="v_ref_cost" 
                type="number"
                value={formData.v_ref_cost || ''} 
                onChange={handleChange} 
                placeholder="e.g. 15000" 
              />
            </div>
          </div>

          <div className="fg" style={{ marginBottom: 20 }}>
            <label>Video Link (Google Drive / YouTube)</label>
            <input 
              name="v_vid_link" 
              value={formData.v_vid_link || ''} 
              onChange={handleChange} 
              placeholder="https://drive.google.com/..." 
            />
          </div>

          <div className="grid3">
            <div className="fg"><label>Status</label><select name="v_stat" value={formData.v_stat} onChange={handleChange}><option>Pending</option><option>Done</option><option>Cancelled</option><option>Follow Up</option></select></div>
            {['Pending', 'Follow Up'].includes(formData.v_stat) && (
              <div className="fg"><label>Date <span style={{color:"var(--or1)",fontSize:"10px"}}>📅</span></label><input type="date" name="v_nextfu" value={formData.v_nextfu} onChange={handleChange} /></div>
            )}
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={() => handleSave(false)} disabled={saving || uploading}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save</>}
          </button>
        </div>
      </div>

      {viewer && (
        <MediaViewer 
          media={viewer.media} 
          initialIndex={viewer.index} 
          onClose={() => setViewer(null)} 
        />
      )}
    </div>
  );
};

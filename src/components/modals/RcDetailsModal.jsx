import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateRecord } from '../../services/db';
import { useData } from '../../contexts/DataContext';
import { CITIES, MAKES, MODELS, YEARS, FUELS, TRANS, COLORS, OWNERS } from '../../utils/constants';

export const RcDetailsModal = ({ isOpen, onClose, inqId }) => {
  const { data, refresh } = useData();
  const [formData, setFormData] = useState({});
  const [models, setModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [inqDocId, setInqDocId] = useState(null);

  useEffect(() => {
    if (isOpen && inqId) {
      const inqRec = data.pur_inq?.find(r => r.inqId === inqId || r.id === inqId);
      if (inqRec) {
        setFormData({ ...inqRec });
        setInqDocId(inqRec.id);
        if (inqRec.make && MODELS[inqRec.make]) {
          setModels(MODELS[inqRec.make]);
        }
      }
    }
  }, [isOpen, inqId, data.pur_inq]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleMakeChange = (e) => {
    const make = e.target.value;
    setFormData(p => ({ ...p, make, model: '' }));
    setModels(MODELS[make] || []);
  };

  const handleSave = async () => {
    if (!inqDocId) {
      alert("Error: Original Inquiry record not found.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'pur_inq', inqDocId), { ...formData, rcEdited: true });
      
      const valRecs = data.val?.filter(v => v.v_inqid === inqId || v.inqId === inqId) || [];
      for (const v of valRecs) {
        await updateRecord('val', v.id, { v_cname: formData.sellerName, sellerName: formData.sellerName, v_vnum: formData.regNo, regNo: formData.regNo, v_make: formData.make, make: formData.make, v_model: formData.model, model: formData.model });
      }

      const obRecs = data.ob?.filter(o => o.ob_inqid === inqId || o.inqId === inqId) || [];
      for (const o of obRecs) {
        await updateRecord('ob', o.id, { ob_cname: formData.sellerName, sellerName: formData.sellerName, ob_regn: formData.regNo, regNo: formData.regNo, ob_mm: `${formData.make} ${formData.model}`.trim() });
      }

      const pclRecs = data.pcl?.filter(p => p.pc_inqid === inqId || p.inqId === inqId) || [];
      for (const p of pclRecs) {
        await updateRecord('pcl', p.id, { pc_sname: formData.sellerName, sellerName: formData.sellerName, pc_regn: formData.regNo, regNo: formData.regNo, pc_veh: `${formData.make} ${formData.model}`.trim() });
      }

      const docRecs = data.doc?.filter(d => d.d_inqid === inqId || d.inqId === inqId) || [];
      for (const d of docRecs) {
        await updateRecord('doc', d.id, { d_sname: formData.sellerName, sellerName: formData.sellerName, d_regn: formData.regNo, regNo: formData.regNo, d_veh: `${formData.make} ${formData.model}`.trim() });
      }

      await refresh('pur_inq');
      await refresh('val');
      await refresh('ob');
      await refresh('pcl');
      await refresh('doc');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to update RC details');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay on" id="m_rc_details">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">📝</div>
          <h3>Fill as per RC Book</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid var(--warn)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 13, color: 'var(--warn)', fontWeight: 600, marginBottom: 14 }}>
            <i className="fa fa-triangle-exclamation"></i> Verify and update seller and vehicle details exactly as they appear in the RC Book. These verified details will be used throughout the rest of the project.
          </div>

          <div className="sect-lbl"><i className="fa fa-user"></i> Seller Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Seller Name *</label>
              <input name="sellerName" value={formData.sellerName || ''} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="fg">
              <label>Mobile *</label>
              <input name="mobile" value={formData.mobile || ''} onChange={handleChange} placeholder="10 digit" type="tel" maxLength="10" />
            </div>
            <div className="fg">
              <label>Alt Mobile</label>
              <input name="altMobile" value={formData.altMobile || ''} onChange={handleChange} placeholder="Optional" type="tel" maxLength="10" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Email</label>
              <input name="email" value={formData.email || ''} onChange={handleChange} type="email" placeholder="email@example.com" />
            </div>
            <div className="fg">
              <label>City</label>
              <select name="city" value={formData.city || ''} onChange={handleChange}>
                <option value="">Select City</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>State</label>
              <input name="state" value={formData.state || ''} onChange={handleChange} placeholder="State" />
            </div>
          </div>
          <div className="grid1">
            <div className="fg">
              <label>Address</label>
              <input name="address" value={formData.address || ''} onChange={handleChange} placeholder="Full address" />
            </div>
          </div>

          <div className="sect-lbl"><i className="fa fa-car"></i> Vehicle Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Vehicle Make *</label>
              <select name="make" value={formData.make || ''} onChange={handleMakeChange}>
                <option value="">Select Brand</option>
                {MAKES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Vehicle Model *</label>
              <select name="model" value={formData.model || ''} onChange={handleChange}>
                <option value="">Select Model</option>
                {models.map(m => <option key={m}>{m}</option>)}
                {!MODELS[formData.make] && formData.make && <option value={formData.model}>{formData.model}</option>}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="fg">
              <label>Variant</label>
              <input name="variant" value={formData.variant || ''} onChange={handleChange} placeholder="VXI / ZXI / SX" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Mfg Year</label>
              <select name="year" value={formData.year || ''} onChange={handleChange}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Reg Year</label>
              <select name="regYear" value={formData.regYear || ''} onChange={handleChange}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Fuel Type</label>
              <select name="fuel" value={formData.fuel || ''} onChange={handleChange}>
                <option value="">Fuel</option>
                {FUELS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Transmission</label>
              <select name="trans" value={formData.trans || ''} onChange={handleChange}>
                <option value="">Transmission</option>
                {TRANS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Color</label>
              <select name="color" value={formData.color || ''} onChange={handleChange}>
                <option value="">Color</option>
                {COLORS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>KM Driven</label>
              <input name="km" value={formData.km || ''} onChange={handleChange} type="number" placeholder="45000" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Owners</label>
              <select name="owners" value={formData.owners || ''} onChange={handleChange}>
                <option value="">Owners</option>
                {OWNERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Reg No *</label>
              <input name="regNo" value={formData.regNo || ''} onChange={handleChange} placeholder="GJ01XX1234" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="fg"></div>
          </div>

          <div className="sect-lbl"><i className="fa fa-shield-halved"></i> Insurance & Loan Details</div>
          <div className="grid2">
            <div className="fg">
              <label>Insurance</label>
              <select name="insuranceStatus" value={formData.insuranceStatus || ''} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="fg">
              <label>Insurance Valid Till</label>
              <input type="date" name="insurance" value={formData.insurance || ''} onChange={handleChange} disabled={formData.insuranceStatus !== 'Yes'} />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Hypothecation (Loan)</label>
              <select name="hypothecation" value={formData.hypothecation || ''} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="fg">
              <label>Bank Name</label>
              <input name="loanBank" value={formData.loanBank || ''} onChange={handleChange} placeholder="Bank name" disabled={formData.hypothecation !== 'Yes'} />
            </div>
            <div className="fg">
              <label>Loan Outstanding</label>
              <input name="loan" value={formData.loan || ''} onChange={handleChange} placeholder="Amount" type="number" disabled={formData.hypothecation !== 'Yes'} />
            </div>
          </div>

        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save RC Details</>}
          </button>
        </div>
      </div>
    </div>
  );
};

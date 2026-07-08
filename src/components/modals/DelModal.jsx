import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { autoFillFromSob, autoFillFromOb } from '../../utils/relations';
import { today } from '../../utils/helpers';

export const DelModal = ({ isOpen, onClose, onSave, onSuccess, editData, quickId }) => {
  const blank = {
    dl_obid: '', dl_cname: '', dl_mob: '', dl_veh: '', dl_regn: '',
    dl_make: '', dl_model: '', dl_year: '',
    dl_exp: '', dl_act: '', dl_by: 'Ritesh Shah',
    dl_stat: 'Scheduled', dl_rem: ''
  };

  const [formData, setFormData] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setFormData({ ...blank, ...editData });
    } else if (quickId) {
      setFormData({ ...blank, dl_obid: quickId });
      doFill(quickId);
    } else {
      setFormData(blank);
    }
  }, [isOpen, editData, quickId]);

  if (!isOpen) return null;

  const doFill = async (id) => {
    if (!id || id.length < 5) return;
    setFilling(true);
    // Try Sales Order Booking first (SOB), then Purchase Order Booking (OB)
    let d = await autoFillFromSob(id);
    if (!d) d = await autoFillFromOb(id);
    if (d) {
      setFormData(prev => ({
        ...prev,
        dl_cname: d.buyerName || d.customerName || d.sellerName || prev.dl_cname,
        dl_mob: d.mobile || d.buyerMob || d.sellerMob || prev.dl_mob,
        dl_veh: d.make && d.model ? `${d.make} ${d.model}` : prev.dl_veh,
        dl_make: d.make || prev.dl_make,
        dl_model: d.model || prev.dl_model,
        dl_year: d.year || prev.dl_year,
        dl_regn: d.regNo || prev.dl_regn,
        dl_exp: d.expectedDate || d.pc_edd || prev.dl_exp,
      }));
    }
    setFilling(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'dl_obid') doFill(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editData && editData.id) {
        await updateDoc(doc(db, 'del', editData.id), { ...formData, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, 'del'), { ...formData, createdAt: new Date().toISOString() });
      }
      if (onSave) await onSave(formData);
      else if (onSuccess) { onSuccess(); onClose(); }
      else onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay on" id="m_del">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🚚</div>
          <h3>Delivery Record</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="grid3">
            <div className="fg">
              <label>
                Booking ID
                <span style={{ color: 'var(--or1)', fontSize: 10, marginLeft: 4 }}>
                  {filling ? '⏳ Loading…' : '⚡ Auto-Fill (SOB / OB)'}
                </span>
              </label>
              <input name="dl_obid" value={formData.dl_obid} onChange={handleChange} placeholder="SOB-2025-0001 / OB-2025-0001" />
            </div>
            <div className="fg"><label>Customer Name <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="dl_cname" value={formData.dl_cname} onChange={handleChange} placeholder="Buyer name" /></div>
            <div className="fg"><label>Mobile <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input type="tel" name="dl_mob" value={formData.dl_mob} onChange={handleChange} placeholder="Mobile" /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Make <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="dl_make" value={formData.dl_make} onChange={handleChange} placeholder="Maruti" /></div>
            <div className="fg"><label>Model <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="dl_model" value={formData.dl_model} onChange={handleChange} placeholder="Swift VXI" /></div>
            <div className="fg"><label>Year <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="dl_year" value={formData.dl_year} onChange={handleChange} placeholder="2022" /></div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Registration No. <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label>
              <input name="dl_regn" value={formData.dl_regn} onChange={handleChange} placeholder="GJ-01-AB-1234" style={{ fontWeight: 700, color: 'var(--or2)' }} />
            </div>
            <div className="fg"><label>Expected Delivery Date <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input type="date" name="dl_exp" value={formData.dl_exp} onChange={handleChange} /></div>
            <div className="fg"><label>Actual Delivery Date</label><input type="date" name="dl_act" value={formData.dl_act} onChange={handleChange} /></div>
          </div>
          <div className="grid2">
            <div className="fg"><label>Delivered By</label>
              <select name="dl_by" value={formData.dl_by} onChange={handleChange}>
                <option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option>
                <option>Maruut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option>
                <option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option>
              </select>
            </div>
            <div className="fg"><label>Delivery Status</label>
              <select name="dl_stat" value={formData.dl_stat} onChange={handleChange}>
                <option>Scheduled</option><option>Delivered</option><option>Delayed</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid1"><div className="fg"><label>Remarks</label><input name="dl_rem" value={formData.dl_rem} onChange={handleChange} placeholder="Notes" /></div></div>
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

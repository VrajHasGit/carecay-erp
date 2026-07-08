import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const TgtModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
  "tg_month": "",
  "tg_emp": "",
  "tg_branch": "",
  "tg_pur_tgt": "",
  "tg_sal_tgt": "",
  "tg_buy_tgt": "",
  "tg_sell_tgt": "",
  "tg_rev_tgt": "",
  "tg_col_tgt": "",
  "tg_rem": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'tgt'), { ...formData, createdAt: new Date().toISOString() });
      if (onSave) { await onSave(formData); } else { onClose(); }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_tgt">
 <div className="mbox" style={{"maxWidth":"640px"}}>
  <div className="m-hdr"><div className="m-hdr-icon">🎯</div><h3>Set Monthly Target</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   <div className="grid3">
    <div className="fg"><label>Month *</label><select id="tg_month" name="tg_month" value={formData['tg_month'] || ''} onChange={handleChange}>
     <option>Jun-2025</option><option>May-2025</option><option>Apr-2025</option><option>Mar-2025</option><option>Feb-2025</option><option>Jan-2025</option>
    </select></div>
    <div className="fg"><label>Employee *</label><select id="tg_emp" name="tg_emp" value={formData['tg_emp'] || ''} onChange={handleChange}>
     <option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option><option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option><option>All Team</option>
    </select></div>
    <div className="fg"><label>Branch</label><select id="tg_branch" name="tg_branch" value={formData['tg_branch'] || ''} onChange={handleChange}><option>SG Highway</option><option>Vastral</option><option>Head Office</option><option>All</option></select></div>
   </div>
   <div className="sect-lbl"><i className="fa fa-bullseye"></i> Target Numbers</div>
   <div className="grid2">
    <div className="fg"><label>Purchase Inquiries Target</label><input type="number" id="tg_pur_tgt" name="tg_pur_tgt" value={formData['tg_pur_tgt'] || ''} onChange={handleChange} placeholder="0" /></div>
    <div className="fg"><label>Sales Inquiries Target</label><input type="number" id="tg_sal_tgt" name="tg_sal_tgt" value={formData['tg_sal_tgt'] || ''} onChange={handleChange} placeholder="0" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Cars Purchased Target</label><input type="number" id="tg_buy_tgt" name="tg_buy_tgt" value={formData['tg_buy_tgt'] || ''} onChange={handleChange} placeholder="0" /></div>
    <div className="fg"><label>Cars Sold Target</label><input type="number" id="tg_sell_tgt" name="tg_sell_tgt" value={formData['tg_sell_tgt'] || ''} onChange={handleChange} placeholder="0" /></div>
    <div className="fg"><label>Revenue Target ₹</label><input type="number" id="tg_rev_tgt" name="tg_rev_tgt" value={formData['tg_rev_tgt'] || ''} onChange={handleChange} placeholder="0" /></div>
   </div>
   <div className="grid2">
    <div className="fg"><label>Collection Target ₹</label><input type="number" id="tg_col_tgt" name="tg_col_tgt" value={formData['tg_col_tgt'] || ''} onChange={handleChange} placeholder="0" /></div>
    <div className="fg"><label>Remarks</label><input id="tg_rem" name="tg_rem" value={formData['tg_rem'] || ''} onChange={handleChange} placeholder="Notes for this target" /></div>
   </div>
  </div>
  <div className="m-foot"><button className="btn btn-out"  onClick={onClose}>Cancel</button><button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save Target</button></div>
 </div>
</div>
  );
};


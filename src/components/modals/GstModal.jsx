import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const GstModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
  "gi_type": "",
  "gi_date": "",
  "gi_sobid": "",
  "gi_bname": "",
  "gi_bmob": "",
  "gi_baddr": "",
  "gi_gstin": "",
  "gi_regn": "",
  "gi_mm": "",
  "gi_year": "",
  "gi_chassis": "",
  "gi_engine": "",
  "gi_color": "",
  "gi_sp": "",
  "gi_gstrate": "",
  "gi_rem": "",
  "gi_stat": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'gst'), { ...formData, createdAt: new Date().toISOString() });
      if (onSave) { await onSave(formData); } else { onClose(); }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_gst">
 <div className="mbox">
  <div className="m-hdr"><div className="m-hdr-icon">📃</div><h3>Generate GST Invoice / Bill of Sale</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   <div className="sect-lbl"><i className="fa fa-file-invoice"></i> Invoice Details</div>
   <div className="grid3">
    <div className="fg"><label>Invoice Type *</label><select id="gi_type" name="gi_type" value={formData['gi_type'] || ''} onChange={handleChange}><option>Tax Invoice</option><option>Bill of Sale</option><option>Proforma Invoice</option></select></div>
    <div className="fg"><label>Invoice Date *</label><input type="date" id="gi_date" name="gi_date" value={formData['gi_date'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>SOB / Booking ID</label><input id="gi_sobid" name="gi_sobid" value={formData['gi_sobid'] || ''} onChange={handleChange} placeholder="SOB-2025-0001"  /></div>
   </div>
   <div className="sect-lbl"><i className="fa fa-user"></i> Buyer / Seller Details</div>
   <div className="grid2">
    <div className="fg"><label>Buyer Name *</label><input id="gi_bname" name="gi_bname" value={formData['gi_bname'] || ''} onChange={handleChange} placeholder="Customer full name" /></div>
    <div className="fg"><label>Buyer Mobile</label><input type="tel" id="gi_bmob" name="gi_bmob" value={formData['gi_bmob'] || ''} onChange={handleChange} placeholder="10-digit" maxLength="10" /></div>
   </div>
   <div className="grid2">
    <div className="fg"><label>Buyer Address</label><input id="gi_baddr" name="gi_baddr" value={formData['gi_baddr'] || ''} onChange={handleChange} placeholder="Full address" /></div>
    <div className="fg"><label>Buyer GSTIN</label><input id="gi_gstin" name="gi_gstin" value={formData['gi_gstin'] || ''} onChange={handleChange} placeholder="22AAAAA0000A1Z5 (if applicable)" style={{"textTransform":"uppercase"}} /></div>
   </div>
   <div className="sect-lbl"><i className="fa fa-car"></i> Vehicle Details</div>
   <div className="grid3">
    <div className="fg"><label>Reg No. *</label><input id="gi_regn" name="gi_regn" value={formData['gi_regn'] || ''} onChange={handleChange} placeholder="GJ-01-AB-1234" style={{"textTransform":"uppercase"}} /></div>
    <div className="fg"><label>Make / Model</label><input id="gi_mm" name="gi_mm" value={formData['gi_mm'] || ''} onChange={handleChange} placeholder="Maruti Swift VXI" /></div>
    <div className="fg"><label>Year</label><input id="gi_year" name="gi_year" value={formData['gi_year'] || ''} onChange={handleChange} placeholder="2020" type="number" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Chassis No.</label><input id="gi_chassis" name="gi_chassis" value={formData['gi_chassis'] || ''} onChange={handleChange} placeholder="MA3FJEB1S00123456" /></div>
    <div className="fg"><label>Engine No.</label><input id="gi_engine" name="gi_engine" value={formData['gi_engine'] || ''} onChange={handleChange} placeholder="K10C1234567" /></div>
    <div className="fg"><label>Color</label><input id="gi_color" name="gi_color" value={formData['gi_color'] || ''} onChange={handleChange} placeholder="White" /></div>
   </div>
   <div className="sect-lbl"><i className="fa fa-indian-rupee-sign"></i> Pricing & GST (Auto-Calc)</div>
   <div className="grid3">
    <div className="fg"><label>Sale Price ₹ *</label><input type="number" id="gi_sp" name="gi_sp" value={formData['gi_sp'] || ''} onChange={handleChange} placeholder="0"  /></div>
    <div className="fg"><label>GST Rate</label><select id="gi_gstrate" name="gi_gstrate" value={formData['gi_gstrate'] || ''} onChange={handleChange} >
     <option value="0">0% (Exempt)</option><option value="5">5%</option><option value="12">12%</option><option value="18" selected>18%</option><option value="28">28%</option>
    </select></div>
    <div className="fg"><label>GST Amount ₹ (Auto)</label><div className="calc-out" id="gi_gstamt">₹ 0</div></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>CGST ₹ (Auto)</label><div className="calc-out" id="gi_cgst">₹ 0</div></div>
    <div className="fg"><label>SGST ₹ (Auto)</label><div className="calc-out" id="gi_sgst">₹ 0</div></div>
    <div className="fg"><label>Total Invoice Amount ₹ (Auto)</label><div className="calc-out" id="gi_total" style={{"fontSize":"16px"}}>₹ 0</div></div>
   </div>
   <div className="grid2">
    <div className="fg"><label>Remarks</label><input id="gi_rem" name="gi_rem" value={formData['gi_rem'] || ''} onChange={handleChange} placeholder="Any special notes" /></div>
    <div className="fg"><label>Status</label><select id="gi_stat" name="gi_stat" value={formData['gi_stat'] || ''} onChange={handleChange}><option>Draft</option><option>Generated</option><option>Printed</option><option>Cancelled</option></select></div>
   </div>
  </div>
  <div className="m-foot">
   <button className="btn btn-out"  onClick={onClose}>Cancel</button>
   <button className="btn btn-out" ><i className="fa fa-print"></i> Print Invoice</button>
   <button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save Invoice</button>
  </div>
 </div>
</div>
  );
};


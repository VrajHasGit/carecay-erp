import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const GpModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
  "gp_id": "",
  "gp_date": "",
  "gp_purpose": "",
  "gp_refid": "",
  "gp_regn": "",
  "gp_mm": "",
  "gp_out": "",
  "gp_exp_ret": "",
  "gp_in": "",
  "gp_km_out": "",
  "gp_km_in": "",
  "gp_fuel": "",
  "gp_dname": "",
  "gp_dmob": "",
  "gp_dl": "",
  "gp_dest": "",
  "gp_auth": "",
  "gp_stat": "",
  "gp_rem": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'gp'), { ...formData, createdAt: new Date().toISOString() });
      if (onSave) { await onSave(formData); } else { onClose(); }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_gp">
 <div className="mbox" style={{"maxWidth":"780px"}}>
  <div className="m-hdr"><div className="m-hdr-icon">🚪</div><h3>Gate Pass</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   <div className="grid3">
    <div className="fg"><label>Gate Pass No.</label><input id="gp_id" name="gp_id" value={formData['gp_id'] || ''} onChange={handleChange} placeholder="GP-2025-0001" readOnly /></div>
    <div className="fg"><label>Date *</label><input type="date" id="gp_date" name="gp_date" value={formData['gp_date'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Purpose *</label><select id="gp_purpose" name="gp_purpose" value={formData['gp_purpose'] || ''} onChange={handleChange} ><option>Sale Delivery</option><option>Test Drive</option><option>Workshop</option><option>RTO</option><option>Insurance</option><option>Other</option></select></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Booking/Ref ID <span style={{"color":"var(--or1)","fontSize":"10px"}}>⚡ Auto-Fill</span></label><input id="gp_refid" name="gp_refid" value={formData['gp_refid'] || ''} onChange={handleChange} placeholder="SOB-2025-0001"  /></div>
    <div className="fg"><label>Registration No. *</label><input id="gp_regn" name="gp_regn" value={formData['gp_regn'] || ''} onChange={handleChange} placeholder="GJ-01-AB-1234" style={{"fontWeight":"700","color":"var(--or2)"}} /></div>
    <div className="fg"><label>Make / Model</label><input id="gp_mm" name="gp_mm" value={formData['gp_mm'] || ''} onChange={handleChange} placeholder="Maruti Swift VXI" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Out Date & Time</label><input type="datetime-local" id="gp_out" name="gp_out" value={formData['gp_out'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Expected Return</label><input type="datetime-local" id="gp_exp_ret" name="gp_exp_ret" value={formData['gp_exp_ret'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Actual Return Time</label><input type="datetime-local" id="gp_in" name="gp_in" value={formData['gp_in'] || ''} onChange={handleChange} /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Odometer Out (KM)</label><input type="number" id="gp_km_out" name="gp_km_out" value={formData['gp_km_out'] || ''} onChange={handleChange} placeholder="52000" /></div>
    <div className="fg"><label>Odometer In (KM)</label><input type="number" id="gp_km_in" name="gp_km_in" value={formData['gp_km_in'] || ''} onChange={handleChange} placeholder="" /></div>
    <div className="fg"><label>Fuel Level Out</label><select id="gp_fuel" name="gp_fuel" value={formData['gp_fuel'] || ''} onChange={handleChange}><option>Empty</option><option>1/4</option><option>1/2</option><option>3/4</option><option>Full</option></select></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Driver Name *</label><input id="gp_dname" name="gp_dname" value={formData['gp_dname'] || ''} onChange={handleChange} placeholder="Full name of driver" /></div>
    <div className="fg"><label>Driver Mobile</label><input id="gp_dmob" name="gp_dmob" value={formData['gp_dmob'] || ''} onChange={handleChange} placeholder="10-digit mobile" maxLength="10" /></div>
    <div className="fg"><label>Driving Licence No.</label><input id="gp_dl" name="gp_dl" value={formData['gp_dl'] || ''} onChange={handleChange} placeholder="GJ01-20100012345" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Destination / Route</label><input id="gp_dest" name="gp_dest" value={formData['gp_dest'] || ''} onChange={handleChange} placeholder="RTO Ahmedabad / Customer Addr" /></div>
    <div className="fg"><label>Authorized By</label><select id="gp_auth" name="gp_auth" value={formData['gp_auth'] || ''} onChange={handleChange}><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option><option>Isha Dashraniya</option></select></div>
    <div className="fg"><label>Status</label><select id="gp_stat" name="gp_stat" value={formData['gp_stat'] || ''} onChange={handleChange}><option>Out</option><option>Returned</option><option>Cancelled</option></select></div>
   </div>
   <div className="fg"><label>Remarks</label><input id="gp_rem" name="gp_rem" value={formData['gp_rem'] || ''} onChange={handleChange} placeholder="Any special notes" /></div>
  </div>
  <div className="m-foot">
   <button className="btn btn-out"  onClick={onClose}>Cancel</button>
   <button className="btn btn-bl" ><i className="fa fa-print"></i> Print</button>
   <button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save</button>
  </div>
 </div>
</div>
  );
};


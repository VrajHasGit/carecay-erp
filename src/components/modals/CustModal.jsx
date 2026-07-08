import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const CustModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
  "cu_type": "",
  "cu_name": "",
  "cu_mob": "",
  "cu_amob": "",
  "cu_email": "",
  "cu_city": "",
  "cu_state": "",
  "cu_pin": "",
  "cu_addr": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'cust'), { ...formData, createdAt: new Date().toISOString() });
      if (onSave) { await onSave(formData); } else { onClose(); }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_cust">
 <div className="mbox"><div className="m-hdr"><div className="m-hdr-icon">👥</div><h3>Customer</h3><button className="m-close" onClick={onClose} >✕</button></div>
 <div className="m-body">
  <div className="grid2"><div className="fg"><label>Customer Type</label><select id="cu_type" name="cu_type" value={formData['cu_type'] || ''} onChange={handleChange}><option>Buyer</option><option>Seller</option></select></div><div className="fg"><label>Full Name *</label><input id="cu_name" name="cu_name" value={formData['cu_name'] || ''} onChange={handleChange} placeholder="Full name" /></div></div>
  <div className="grid3"><div className="fg"><label>Mobile *</label><input id="cu_mob" name="cu_mob" value={formData['cu_mob'] || ''} onChange={handleChange} type="tel" placeholder="Primary" /></div><div className="fg"><label>Alt Mobile</label><input id="cu_amob" name="cu_amob" value={formData['cu_amob'] || ''} onChange={handleChange} type="tel" placeholder="10 digit (optional)" maxLength="10"  pattern="[0-9]{10}" /></div><div className="fg"><label>Email</label><input id="cu_email" name="cu_email" value={formData['cu_email'] || ''} onChange={handleChange} type="email" placeholder="Email" /></div></div>
  <div className="grid3"><div className="fg"><label>City</label><select id="cu_city" name="cu_city" value={formData['cu_city'] || ''} onChange={handleChange} >
<option value="">Select City</option>
<option>Ahmedabad</option>
<option>Surat</option>
<option>Vadodara</option>
<option>Rajkot</option>
<option>Bhavnagar</option>
<option>Jamnagar</option>
<option>Junagadh</option>
<option>Gandhinagar</option>
<option>Anand</option>
<option>Nadiad</option>
<option>Mehsana</option>
<option>Surendranagar</option>
<option>Bharuch</option>
<option>Vapi</option>
<option>Navsari</option>
<option>Morbi</option>
<option>Gondal</option>
<option>Botad</option>
<option>Amreli</option>
<option>Porbandar</option>
<option>Dwarka</option>
<option>Veraval</option>
<option>Upleta</option>
<option>Jetpur</option>
<option>Wankaner</option>
<option>Dhoraji</option>
<option>Jam Jodhpur</option>
<option>Keshod</option>
<option>Visavadar</option>
<option>Talaja</option>
<option>Mahuva</option>
<option>Palitana</option>
<option>Sihor</option>
<option>Anjar</option>
<option>Bhuj</option>
<option>Gandhidham</option>
<option>Mandvi</option>
<option>Mundra</option>
<option>Rapar</option>
<option>Patan</option>
<option>Unjha</option>
<option>Visnagar</option>
<option>Kadi</option>
<option>Kalol</option>
<option>Sanand</option>
<option>Bavla</option>
<option>Dholka</option>
<option>Dholera</option>
<option>Khambhat</option>
<option>Ankleshwar</option>
<option>Dahej</option>
<option>Jambusar</option>
<option>Olpad</option>
<option>Bardoli</option>
<option>Vyara</option>
<option>Kamrej</option>
<option>Other</option>
</select></div><div className="fg"><label>State</label><input id="cu_state" name="cu_state" value={formData['cu_state'] || ''} onChange={handleChange} placeholder="State" value="Gujarat" readOnly style={{"background":"rgba(16,185,129,.08)","borderColor":"var(--success)","color":"var(--success)","fontWeight":"600"}} /></div><div className="fg"><label>Pincode</label><input id="cu_pin" name="cu_pin" value={formData['cu_pin'] || ''} onChange={handleChange} placeholder="Pincode" /></div></div>
  <div className="grid1"><div className="fg"><label>Address</label><textarea id="cu_addr" name="cu_addr" value={formData['cu_addr'] || ''} onChange={handleChange} placeholder="Full address…"></textarea></div></div>
 </div>
 <div className="m-foot"><button className="btn btn-out"  onClick={onClose}>Cancel</button><button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save</button></div></div>
</div>
  );
};


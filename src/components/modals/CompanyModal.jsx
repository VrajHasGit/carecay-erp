import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const CompanyModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
  "ec_name": "",
  "ec_tag": "",
  "ec_logo": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'company'), { ...formData, createdAt: new Date().toISOString() });
      alert('Record saved successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_company">
 <div className="mbox" style={{"maxWidth":"460px"}}><div className="m-hdr"><div className="m-hdr-icon">🏢</div><h3>Edit Company Profile</h3><button className="m-close" onClick={onClose} >✕</button></div>
 <div className="m-body">
  <div className="fg" style={{"marginBottom":"12px"}}><label>Company Name</label><input id="ec_name" name="ec_name" value={formData['ec_name'] || ''} onChange={handleChange} placeholder="Company name" /></div>
  <div className="fg" style={{"marginBottom":"12px"}}><label>Tagline</label><input id="ec_tag" name="ec_tag" value={formData['ec_tag'] || ''} onChange={handleChange} placeholder="Tagline" /></div>
  <div className="fg" style={{"marginBottom":"12px"}}><label>Logo Emoji</label><input id="ec_logo" name="ec_logo" value={formData['ec_logo'] || ''} onChange={handleChange} maxLength="4" placeholder="🚗" /></div>
 </div>
 <div className="m-foot"><button className="btn btn-out"  onClick={onClose}>Cancel</button><button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save</button></div></div>
</div>
  );
};

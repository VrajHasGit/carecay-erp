import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const PrintInvModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'print_inv'), { ...formData, createdAt: new Date().toISOString() });
      alert('Record saved successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_print_inv" style={{"zIndex":"10000"}}>
 <div className="mbox" style={{"maxWidth":"700px","maxHeight":"92vh","overflowY":"auto"}}>
  <div className="m-hdr" style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
   <div style={{"display":"flex","alignItems":"center","gap":"10px"}}><div className="m-hdr-icon">🖨️</div><h3>Invoice Preview</h3></div>
   <div style={{"display":"flex","gap":"8px"}}>
    <button className="btn btn-or" onClick={handleSave} ><i className="fa fa-print"></i> Print</button>
    <button className="m-close" onClick={onClose} >✕</button>
   </div>
  </div>
  <div id="inv_preview_body" style={{"padding":"24px","fontFamily":"'Plus Jakarta Sans',sans-serif"}}></div>
 </div>
</div>
  );
};

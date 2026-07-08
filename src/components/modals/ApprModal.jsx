import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const ApprModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
  "appr_pw": "",
  "appr_rem": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'appr'), { ...formData, createdAt: new Date().toISOString() });
      alert('Record saved successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_appr">
 <div className="mbox" style={{"maxWidth":"500px"}}>
  <div className="m-hdr"><div className="m-hdr-icon">✅</div><h3>Manager Approval Required</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   <div id="appr_details" style={{"marginBottom":"16px","background":"var(--or5)","border":"1px solid var(--or3)","borderRadius":"var(--radius)","padding":"12px","fontSize":"12px"}}></div>
   <div className="fg"><label>Manager Password</label><input type="password" id="appr_pw" name="appr_pw" value={formData['appr_pw'] || ''} onChange={handleChange} placeholder="Enter manager password" style={{"width":"100%"}} /></div>
   <div className="fg"><label>Approval Remarks</label><input id="appr_rem" name="appr_rem" value={formData['appr_rem'] || ''} onChange={handleChange} placeholder="Reason / notes" style={{"width":"100%"}} /></div>
  </div>
  <div className="m-foot">
   <button className="btn btn-out" style={{"borderColor":"var(--danger)","color":"var(--danger)"}} ><i className="fa fa-times"></i> Reject</button>
   <button className="btn btn-or" onClick={handleSave} ><i className="fa fa-check"></i> Approve</button>
  </div>
 </div>
</div>
  );
};

import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const FeedbackModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
  "fb_delid": "",
  "fb_cname": "",
  "fb_sales": "",
  "fb_veh": "",
  "fb_comment": "",
  "fb_ref": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'feedback'), { ...formData, createdAt: new Date().toISOString() });
      alert('Record saved successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_feedback">
 <div className="mbox" style={{"maxWidth":"500px"}}>
  <div className="m-hdr"><div className="m-hdr-icon">⭐</div><h3>Customer Feedback & Rating</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   <div className="grid2"><div className="fg"><label>Delivery ID</label><input id="fb_delid" name="fb_delid" value={formData['fb_delid'] || ''} onChange={handleChange} placeholder="DEL-2025-0001" style={{"width":"100%"}} /></div><div className="fg"><label>Customer Name</label><input id="fb_cname" name="fb_cname" value={formData['fb_cname'] || ''} onChange={handleChange} placeholder="Customer name" style={{"width":"100%"}} /></div></div>
   <div className="fg" style={{"marginBottom":"14px"}}>
    <label>Overall Rating</label>
    <div className="star-rating" id="fb_stars" style={{"marginTop":"6px"}}>
     <span className="star" >★</span><span className="star" >★</span><span className="star" >★</span><span className="star" >★</span><span className="star" >★</span>
    </div>
   </div>
   <div className="grid2"><div className="fg"><label>Sales Experience</label><select id="fb_sales" name="fb_sales" value={formData['fb_sales'] || ''} onChange={handleChange}><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select></div><div className="fg"><label>Vehicle Condition</label><select id="fb_veh" name="fb_veh" value={formData['fb_veh'] || ''} onChange={handleChange}><option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option></select></div></div>
   <div className="fg"><label>Comments</label><textarea id="fb_comment" name="fb_comment" value={formData['fb_comment'] || ''} onChange={handleChange} rows="3" placeholder="Customer feedback..." style={{"width":"100%","background":"var(--bg)","border":"1px solid var(--border2)","borderRadius":"var(--radius-sm)","padding":"8px","fontFamily":"inherit","fontSize":"12px","color":"var(--text)","resize":"vertical"}}></textarea></div>
   <div className="fg"><label>Will recommend Carecay?</label><select id="fb_ref" name="fb_ref" value={formData['fb_ref'] || ''} onChange={handleChange}><option>Yes, definitely</option><option>Maybe</option><option>No</option></select></div>
  </div>
  <div className="m-foot"><button className="btn btn-out"  onClick={onClose}>Cancel</button><button className="btn btn-or" onClick={handleSave} ><i className="fa fa-star"></i> Save Feedback</button></div>
 </div>
</div>
  );
};

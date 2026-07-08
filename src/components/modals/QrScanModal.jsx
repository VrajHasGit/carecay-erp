import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const QrScanModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'qr_scan'), { ...formData, createdAt: new Date().toISOString() });
      alert('Record saved successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_qr_scan">
 <div className="mbox" style={{"maxWidth":"400px","borderRadius":"20px","overflow":"hidden"}}>
  <div style={{"background":"linear-gradient(135deg,#0D2B22,#1a4030)","padding":"20px 20px 0 20px","position":"relative"}}>
   <button className="m-close" onClick={onClose}  style={{"position":"absolute","top":"14px","right":"14px","background":"rgba(255,255,255,.15)","color":"#fff","border":"none","width":"32px","height":"32px","borderRadius":"50%","fontSize":"16px","cursor":"pointer","display":"flex","alignItems":"center","justifyContent":"center"}}>✕</button>
   <div style={{"display":"flex","alignItems":"center","gap":"12px","marginBottom":"16px"}}>
    <div style={{"width":"46px","height":"46px","background":"linear-gradient(135deg,#E85D04,#F97316)","borderRadius":"12px","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"22px","flexShrink":"0"}}>🚗</div>
    <div>
     <div id="qrs_badge" style={{"display":"inline-block","fontSize":"10px","fontWeight":"700","letterSpacing":".8px","padding":"2px 10px","borderRadius":"20px","marginBottom":"4px","background":"rgba(255,255,255,.15)","color":"#fff"}}></div>
     <div id="qrs_title" style={{"fontSize":"18px","fontWeight":"800","color":"#fff","lineHeight":"1.2"}}></div>
     <div id="qrs_variant" style={{"fontSize":"12px","color":"rgba(255,255,255,.65)","marginTop":"2px"}}></div>
    </div>
   </div>
   
   <div style={{"background":"rgba(255,255,255,.1)","borderRadius":"10px","padding":"10px 14px","marginBottom":"-1px","display":"flex","alignItems":"center","justifyContent":"space-between"}}>
    <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
     <i className="fa fa-id-card" style={{"color":"rgba(255,255,255,.5)","fontSize":"12px"}}></i>
     <span id="qrs_regno" style={{"fontFamily":"'Space Grotesk',sans-serif","fontSize":"15px","fontWeight":"700","color":"#fff","letterSpacing":".5px"}}></span>
    </div>
    <div id="qrs_year_fuel" style={{"fontSize":"12px","color":"rgba(255,255,255,.65)"}}></div>
   </div>
  </div>
  
  <div className="m-body" style={{"padding":"16px","background":"var(--bg)"}}>
   
   <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"10px","marginBottom":"12px"}}>
    <div style={{"background":"var(--surface)","border":"1px solid var(--border)","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
     <div style={{"fontSize":"10px","color":"var(--text3)","fontWeight":"600","letterSpacing":".5px","textTransform":"uppercase","marginBottom":"4px"}}><i className="fa fa-gauge-high" style={{"marginRight":"4px"}}></i>Odometer</div>
     <div id="qrs_km" style={{"fontFamily":"'Space Grotesk',sans-serif","fontSize":"20px","fontWeight":"800","color":"var(--text)"}}></div>
     <div style={{"fontSize":"10px","color":"var(--text3)"}}>kilometres</div>
    </div>
    <div style={{"background":"var(--surface)","border":"1px solid var(--border)","borderRadius":"12px","padding":"14px","textAlign":"center"}}>
     <div style={{"fontSize":"10px","color":"var(--text3)","fontWeight":"600","letterSpacing":".5px","textTransform":"uppercase","marginBottom":"4px"}}><i className="fa fa-tag" style={{"marginRight":"4px"}}></i>TCP Price</div>
     <div id="qrs_tcp" style={{"fontFamily":"'Space Grotesk',sans-serif","fontSize":"20px","fontWeight":"800","color":"var(--or1)"}}></div>
     <div style={{"fontSize":"10px","color":"var(--text3)"}}>total cost price</div>
    </div>
   </div>
   
   <div id="qrs_sp_wrap" style={{"background":"linear-gradient(135deg,#ECFDF5,#D1FAE5)","border":"1.5px solid #6EE7B7","borderRadius":"12px","padding":"14px 18px","display":"flex","alignItems":"center","justifyContent":"space-between","marginBottom":"12px"}}>
    <div>
     <div style={{"fontSize":"10px","color":"#059669","fontWeight":"700","letterSpacing":".5px","textTransform":"uppercase"}}><i className="fa fa-indian-rupee-sign" style={{"marginRight":"4px"}}></i>Selling Price</div>
     <div id="qrs_sp" style={{"fontFamily":"'Space Grotesk',sans-serif","fontSize":"26px","fontWeight":"800","color":"#047857","lineHeight":"1.1"}}></div>
    </div>
    <div style={{"fontSize":"32px","opacity":".3"}}>💰</div>
   </div>
   
   <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","background":"var(--surface)","border":"1px solid var(--border)","borderRadius":"10px","padding":"10px 14px","marginBottom":"12px"}}>
    <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
     <i className="fa fa-barcode" style={{"color":"var(--text3)","fontSize":"13px"}}></i>
     <span style={{"fontSize":"11px","color":"var(--text3)","fontWeight":"600"}}>Stock ID</span>
    </div>
    <span id="qrs_id" style={{"fontFamily":"'Space Grotesk',sans-serif","fontSize":"13px","fontWeight":"700","color":"var(--bl5)"}}></span>
   </div>
   
   <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","background":"var(--surface)","border":"1px solid var(--border)","borderRadius":"10px","padding":"10px 14px"}}>
    <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
     <i className="fa fa-circle-info" style={{"color":"var(--text3)","fontSize":"13px"}}></i>
     <span style={{"fontSize":"11px","color":"var(--text3)","fontWeight":"600"}}>Current Status</span>
    </div>
    <span id="qrs_status"></span>
   </div>
   
   <div style={{"textAlign":"center","marginTop":"14px","fontSize":"10px","color":"var(--text3)"}}>
    <i className="fa fa-shield-halved" style={{"marginRight":"4px","color":"var(--or1)"}}></i>Carecay ERP · Verified Stock Profile
   </div>
  </div>
 </div>
</div>
  );
};

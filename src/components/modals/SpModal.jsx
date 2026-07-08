import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const SpModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
  "sp_id": "",
  "sp_inq_date": "",
  "sp_branch": "",
  "sp_cname": "",
  "sp_mob": "",
  "sp_email": "",
  "sp_addr": "",
  "sp_city": "",
  "sp_src": "",
  "sp_regn": "",
  "sp_make": "",
  "sp_model": "",
  "sp_variant": "",
  "sp_year": "",
  "sp_color": "",
  "sp_fuel": "",
  "sp_trans": "",
  "sp_km": "",
  "sp_ask": "",
  "sp_price": "",
  "sp_disc": "",
  "sp_rto": "",
  "sp_ins_ch": "",
  "sp_other_ch": "",
  "sp_total": "",
  "sp_token": "",
  "sp_balance": "",
  "sp_fin_req": "",
  "sp_bank": "",
  "sp_loan": "",
  "sp_dp": "",
  "sp_emi": "",
  "sp_tenure": "",
  "sp_roi": "",
  "sp_case": "",
  "sp_fin_stat": "",
  "sp_pay_mode": "",
  "sp_paid": "",
  "sp_utr": "",
  "sp_pay_bank": "",
  "sp_pay_date": "",
  "sp_pay_stat": "",
  "sp_rc": "",
  "sp_ins_doc": "",
  "sp_puc_doc": "",
  "sp_f29": "",
  "sp_f30": "",
  "sp_noc": "",
  "sp_pan": "",
  "sp_aadh": "",
  "sp_ins_exp": "",
  "sp_obid": "",
  "sp_dn": "",
  "sp_gp": "",
  "sp_del_exp": "",
  "sp_del_act": "",
  "sp_del_by": "",
  "sp_exec": "",
  "sp_stage": "",
  "sp_priority": "",
  "sp_rem": ""
});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'sp'), { ...formData, createdAt: new Date().toISOString() });
      if (onSave) { await onSave(formData); } else { onClose(); }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_sp">
 <div className="mbox" style={{"maxWidth":"960px"}}>
  <div className="m-hdr"><div className="m-hdr-icon" style={{"background":"linear-gradient(135deg,#7C3AED,#A78BFA)"}}>📊</div><h3>AA Sale Process — Full Record</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   
   <div style={{"background":"rgba(124,58,237,.12)","border":"1px solid rgba(124,58,237,.3)","borderRadius":"8px","padding":"10px 14px","marginBottom":"16px","fontSize":"12px","color":"#C4B5FD"}}>
    <i className="fa fa-circle-info" style={{"color":"#A78BFA"}}></i> Ek hi form mein puri sale process track karo — Inquiry se Delivery tak
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","marginBottom":"8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>â‘  SALES INQUIRY</div>
   <div className="grid3">
    <div className="fg"><label>SP Number</label><input id="sp_id" name="sp_id" value={formData['sp_id'] || ''} onChange={handleChange} placeholder="SP-2025-0001" readOnly /></div>
    <div className="fg"><label>Inquiry Date *</label><input type="date" id="sp_inq_date" name="sp_inq_date" value={formData['sp_inq_date'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Branch *</label><select id="sp_branch" name="sp_branch" value={formData['sp_branch'] || ''} onChange={handleChange}><option>Ahmedabad Main</option><option>Ahmedabad East</option><option>Ahmedabad West</option><option>Gandhinagar</option><option>Surat</option><option>Rajkot</option></select></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Customer Name *</label><input id="sp_cname" name="sp_cname" value={formData['sp_cname'] || ''} onChange={handleChange} placeholder="Full name" /></div>
    <div className="fg"><label>Mobile *</label><input id="sp_mob" name="sp_mob" value={formData['sp_mob'] || ''} onChange={handleChange} placeholder="10-digit mobile" maxLength="10" /></div>
    <div className="fg"><label>Email</label><input type="email" id="sp_email" name="sp_email" value={formData['sp_email'] || ''} onChange={handleChange} placeholder="email@example.com" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Address</label><input id="sp_addr" name="sp_addr" value={formData['sp_addr'] || ''} onChange={handleChange} placeholder="Customer address" /></div>
    <div className="fg"><label>City</label><input id="sp_city" name="sp_city" value={formData['sp_city'] || ''} onChange={handleChange} placeholder="Ahmedabad" /></div>
    <div className="fg"><label>Lead Source</label><select id="sp_src" name="sp_src" value={formData['sp_src'] || ''} onChange={handleChange}><option>Walk-In</option><option>Phone Call</option><option>WhatsApp</option><option>OLX</option><option>CarDekho</option><option>Cars24</option><option>Referral</option><option>Website</option><option>Instagram</option><option>Facebook</option></select></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>② VEHICLE & REQUIREMENT</div>
   <div className="grid3">
    <div className="fg"><label>Registration No.</label><input id="sp_regn" name="sp_regn" value={formData['sp_regn'] || ''} onChange={handleChange} placeholder="GJ-01-AB-1234" style={{"fontWeight":"700","color":"var(--or2)"}} /></div>
    <div className="fg"><label>Make</label><input id="sp_make" name="sp_make" value={formData['sp_make'] || ''} onChange={handleChange} placeholder="Maruti / Hyundai" /></div>
    <div className="fg"><label>Model</label><input id="sp_model" name="sp_model" value={formData['sp_model'] || ''} onChange={handleChange} placeholder="Swift / i20" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Variant</label><input id="sp_variant" name="sp_variant" value={formData['sp_variant'] || ''} onChange={handleChange} placeholder="VXI / Asta" /></div>
    <div className="fg"><label>Year</label><input type="number" id="sp_year" name="sp_year" value={formData['sp_year'] || ''} onChange={handleChange} placeholder="2019" min="2000" max="2030" /></div>
    <div className="fg"><label>Color</label><input id="sp_color" name="sp_color" value={formData['sp_color'] || ''} onChange={handleChange} placeholder="White / Silver" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Fuel Type</label><select id="sp_fuel" name="sp_fuel" value={formData['sp_fuel'] || ''} onChange={handleChange}><option>Petrol</option><option>Diesel</option><option>CNG</option><option>Electric</option><option>Hybrid</option></select></div>
    <div className="fg"><label>Transmission</label><select id="sp_trans" name="sp_trans" value={formData['sp_trans'] || ''} onChange={handleChange}><option>Manual</option><option>Automatic</option><option>AMT</option></select></div>
    <div className="fg"><label>KM Reading</label><input type="number" id="sp_km" name="sp_km" value={formData['sp_km'] || ''} onChange={handleChange} placeholder="52000" /></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>③ PRICING & DEAL</div>
   <div className="grid3">
    <div className="fg"><label>Asking Price ₹</label><input type="number" id="sp_ask" name="sp_ask" value={formData['sp_ask'] || ''} onChange={handleChange} placeholder="450000" /></div>
    <div className="fg"><label>Sale Price ₹</label><input type="number" id="sp_price" name="sp_price" value={formData['sp_price'] || ''} onChange={handleChange} placeholder="420000"  /></div>
    <div className="fg"><label>Discount ₹</label><input type="number" id="sp_disc" name="sp_disc" value={formData['sp_disc'] || ''} onChange={handleChange} placeholder="0"  /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>RTO / Transfer Charges ₹</label><input type="number" id="sp_rto" name="sp_rto" value={formData['sp_rto'] || ''} onChange={handleChange} placeholder="5000"  /></div>
    <div className="fg"><label>Insurance Charges ₹</label><input type="number" id="sp_ins_ch" name="sp_ins_ch" value={formData['sp_ins_ch'] || ''} onChange={handleChange} placeholder="8000"  /></div>
    <div className="fg"><label>Other Charges ₹</label><input type="number" id="sp_other_ch" name="sp_other_ch" value={formData['sp_other_ch'] || ''} onChange={handleChange} placeholder="0"  /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Total Amount ₹</label><input type="number" id="sp_total" name="sp_total" value={formData['sp_total'] || ''} onChange={handleChange} placeholder="Auto-calc" readOnly style={{"color":"var(--or2)","fontWeight":"700"}} /></div>
    <div className="fg"><label>Token Amount ₹</label><input type="number" id="sp_token" name="sp_token" value={formData['sp_token'] || ''} onChange={handleChange} placeholder="10000"  /></div>
    <div className="fg"><label>Balance ₹</label><input type="number" id="sp_balance" name="sp_balance" value={formData['sp_balance'] || ''} onChange={handleChange} placeholder="Auto-calc" readOnly style={{"color":"#F87171","fontWeight":"700"}} /></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>④ FINANCE / LOAN</div>
   <div className="grid3">
    <div className="fg"><label>Finance Required</label><select id="sp_fin_req" name="sp_fin_req" value={formData['sp_fin_req'] || ''} onChange={handleChange} ><option>No</option><option>Yes</option></select></div>
    <div className="fg"><label>Bank / NBFC Name</label><input id="sp_bank" name="sp_bank" value={formData['sp_bank'] || ''} onChange={handleChange} placeholder="HDFC / SBI / Mahindra Finance" /></div>
    <div className="fg"><label>Loan Amount ₹</label><input type="number" id="sp_loan" name="sp_loan" value={formData['sp_loan'] || ''} onChange={handleChange} placeholder="300000" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Down Payment ₹</label><input type="number" id="sp_dp" name="sp_dp" value={formData['sp_dp'] || ''} onChange={handleChange} placeholder="120000" /></div>
    <div className="fg"><label>EMI ₹</label><input type="number" id="sp_emi" name="sp_emi" value={formData['sp_emi'] || ''} onChange={handleChange} placeholder="8500" /></div>
    <div className="fg"><label>Tenure (Months)</label><input type="number" id="sp_tenure" name="sp_tenure" value={formData['sp_tenure'] || ''} onChange={handleChange} placeholder="36" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>ROI %</label><input type="number" id="sp_roi" name="sp_roi" value={formData['sp_roi'] || ''} onChange={handleChange} step="0.01" placeholder="12.5" /></div>
    <div className="fg"><label>File No. / Case No.</label><input id="sp_case" name="sp_case" value={formData['sp_case'] || ''} onChange={handleChange} placeholder="HDFC-2025-00123" /></div>
    <div className="fg"><label>Finance Status</label><select id="sp_fin_stat" name="sp_fin_stat" value={formData['sp_fin_stat'] || ''} onChange={handleChange}><option>Not Applied</option><option>Applied</option><option>Approved</option><option>Disbursed</option><option>Rejected</option></select></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>⑤ PAYMENT DETAILS</div>
   <div className="grid3">
    <div className="fg"><label>Payment Mode</label><select id="sp_pay_mode" name="sp_pay_mode" value={formData['sp_pay_mode'] || ''} onChange={handleChange}><option>Cash</option><option>NEFT/RTGS</option><option>Cheque</option><option>UPI</option><option>DD</option><option>Mixed</option></select></div>
    <div className="fg"><label>Amount Paid ₹</label><input type="number" id="sp_paid" name="sp_paid" value={formData['sp_paid'] || ''} onChange={handleChange} placeholder="0"  /></div>
    <div className="fg"><label>Cheque / UTR No.</label><input id="sp_utr" name="sp_utr" value={formData['sp_utr'] || ''} onChange={handleChange} placeholder="UTR / Cheque number" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Bank Name</label><input id="sp_pay_bank" name="sp_pay_bank" value={formData['sp_pay_bank'] || ''} onChange={handleChange} placeholder="SBI / HDFC" /></div>
    <div className="fg"><label>Payment Date</label><input type="date" id="sp_pay_date" name="sp_pay_date" value={formData['sp_pay_date'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Payment Status</label><select id="sp_pay_stat" name="sp_pay_stat" value={formData['sp_pay_stat'] || ''} onChange={handleChange}><option>Pending</option><option>Partial</option><option>Full</option></select></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>⑥ DOCUMENTS</div>
   <div className="grid3">
    <div className="fg"><label>RC Book</label><select id="sp_rc" name="sp_rc" value={formData['sp_rc'] || ''} onChange={handleChange}><option>Pending</option><option>Original</option><option>Smart Card</option><option>Transferred</option></select></div>
    <div className="fg"><label>Insurance</label><select id="sp_ins_doc" name="sp_ins_doc" value={formData['sp_ins_doc'] || ''} onChange={handleChange}><option>Pending</option><option>Transferred</option><option>New Policy</option></select></div>
    <div className="fg"><label>PUC</label><select id="sp_puc_doc" name="sp_puc_doc" value={formData['sp_puc_doc'] || ''} onChange={handleChange}><option>Pending</option><option>Valid</option><option>Renewed</option></select></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Form 29</label><select id="sp_f29" name="sp_f29" value={formData['sp_f29'] || ''} onChange={handleChange}><option>Pending</option><option>Submitted</option></select></div>
    <div className="fg"><label>Form 30</label><select id="sp_f30" name="sp_f30" value={formData['sp_f30'] || ''} onChange={handleChange}><option>Pending</option><option>Submitted</option></select></div>
    <div className="fg"><label>NOC (if Hypothecation)</label><select id="sp_noc" name="sp_noc" value={formData['sp_noc'] || ''} onChange={handleChange}><option>NA</option><option>Pending</option><option>Received</option></select></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Buyer PAN</label><input id="sp_pan" name="sp_pan" value={formData['sp_pan'] || ''} onChange={handleChange} placeholder="ABCDE1234F" /></div>
    <div className="fg"><label>Buyer Aadhaar (Last 4)</label><input id="sp_aadh" name="sp_aadh" value={formData['sp_aadh'] || ''} onChange={handleChange} placeholder="XXXX" maxLength="4" /></div>
    <div className="fg"><label>Insurance Valid Till</label><input type="date" id="sp_ins_exp" name="sp_ins_exp" value={formData['sp_ins_exp'] || ''} onChange={handleChange} /></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>⑦ DELIVERY</div>
   <div className="grid3">
    <div className="fg"><label>Booking ID</label><input id="sp_obid" name="sp_obid" value={formData['sp_obid'] || ''} onChange={handleChange} placeholder="SOB-2025-0001" /></div>
    <div className="fg"><label>Delivery Note No.</label><input id="sp_dn" name="sp_dn" value={formData['sp_dn'] || ''} onChange={handleChange} placeholder="DN-2025-0001" /></div>
    <div className="fg"><label>Gate Pass No.</label><input id="sp_gp" name="sp_gp" value={formData['sp_gp'] || ''} onChange={handleChange} placeholder="GP-2025-0001" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Scheduled Delivery Date</label><input type="date" id="sp_del_exp" name="sp_del_exp" value={formData['sp_del_exp'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Actual Delivery Date</label><input type="date" id="sp_del_act" name="sp_del_act" value={formData['sp_del_act'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Delivered By</label><select id="sp_del_by" name="sp_del_by" value={formData['sp_del_by'] || ''} onChange={handleChange}><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option><option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option></select></div>
   </div>

   
   <div style={{"fontSize":"11px","color":"var(--or1)","fontWeight":"700","letterSpacing":".8px","textTransform":"uppercase","margin":"14px 0 8px","paddingBottom":"4px","borderBottom":"1px solid rgba(232,93,4,.3)"}}>⑧ CURRENT STATUS</div>
   <div className="grid3">
    <div className="fg"><label>Sales Executive</label><select id="sp_exec" name="sp_exec" value={formData['sp_exec'] || ''} onChange={handleChange}><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option><option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option></select></div>
    <div className="fg"><label>Current Stage</label><select id="sp_stage" name="sp_stage" value={formData['sp_stage'] || ''} onChange={handleChange}><option>Sales Inquiry</option><option>Follow-Up</option><option>Test Drive</option><option>Closer</option><option>Order Booking</option><option>Finance</option><option>Payment</option><option>Documents</option><option>Delivery Note</option><option>Gate Pass</option><option>Delivered</option></select></div>
    <div className="fg"><label>Priority</label><select id="sp_priority" name="sp_priority" value={formData['sp_priority'] || ''} onChange={handleChange}><option>Normal</option><option>Hot Lead</option><option>Cold Lead</option><option>Urgent</option></select></div>
   </div>
   <div className="grid1"><div className="fg"><label>Remarks / Notes</label><textarea id="sp_rem" name="sp_rem" value={formData['sp_rem'] || ''} onChange={handleChange} rows="2" placeholder="Any notes, pending items, special instructions..." style={{"width":"100%","background":"rgba(255,255,255,.05)","border":"1px solid rgba(255,255,255,.1)","borderRadius":"6px","color":"var(--text1)","padding":"8px","fontSize":"13px","resize":"vertical"}}></textarea></div></div>
  </div>
  <div className="m-foot">
   <button className="btn btn-out"  onClick={onClose}>Cancel</button>
   <button className="btn btn-bl" ><i className="fa fa-print"></i> Print Format</button>
   <button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save</button>
  </div>
 </div>
</div>
  );
};


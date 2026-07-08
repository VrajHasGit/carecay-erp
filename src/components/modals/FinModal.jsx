import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const BLANK = {
  fin_date: "", fin_cname: "", fin_mob: "", fin_sobid: "", fin_veh: "",
  fin_regn: "", fin_bank: "SBI", fin_sp: "", fin_dp: "", fin_roi: "",
  fin_ten: "36", fin_stat: "Applied", fin_disd: "", fin_exec: "",
  fin_fileno: "", fin_rem: ""
};

export const FinModal = ({ isOpen, onClose, onSave, editData, quickData }) => {
  const [formData, setFormData] = useState(BLANK);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({ ...BLANK, ...editData });
      } else if (quickData) {
        setFormData({ ...BLANK, ...quickData, fin_date: new Date().toISOString().split('T')[0] });
      } else {
        setFormData({ ...BLANK, fin_date: new Date().toISOString().split('T')[0] });
      }
    }
  }, [isOpen, editData, quickData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (onSave) { 
        await onSave(formData); 
      } else {
        if (editData) {
          await updateDoc(doc(db, 'fin', editData.id), formData);
        } else {
          await addDoc(collection(db, 'fin'), { ...formData, createdAt: new Date().toISOString() });
        }
        onClose(); 
      }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="overlay" id="m_fin">
 <div className="mbox">
  <div className="m-hdr"><div className="m-hdr-icon">🏦</div><h3>Finance / Loan File</h3><button className="m-close" onClick={onClose} >✕</button></div>
  <div className="m-body">
   <div className="sect-lbl"><i className="fa fa-user"></i> Customer & Vehicle</div>
   <div className="grid3">
    <div className="fg"><label>Date *</label><input type="date" id="fin_date" name="fin_date" value={formData['fin_date'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Customer Name *</label><input id="fin_cname" name="fin_cname" value={formData['fin_cname'] || ''} onChange={handleChange} placeholder="Customer name" /></div>
    <div className="fg"><label>Mobile *</label><input type="tel" id="fin_mob" name="fin_mob" value={formData['fin_mob'] || ''} onChange={handleChange} placeholder="10-digit" maxLength="10" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>SOB / Booking ID</label><input id="fin_sobid" name="fin_sobid" value={formData['fin_sobid'] || ''} onChange={handleChange} placeholder="SOB-2025-0001"  /></div>
    <div className="fg"><label>Vehicle (Make/Model)</label><input id="fin_veh" name="fin_veh" value={formData['fin_veh'] || ''} onChange={handleChange} placeholder="Maruti Swift VXI 2020" /></div>
    <div className="fg"><label>Reg No.</label><input id="fin_regn" name="fin_regn" value={formData['fin_regn'] || ''} onChange={handleChange} placeholder="GJ-01-AB-1234" /></div>
   </div>
   <div className="sect-lbl"><i className="fa fa-landmark"></i> Loan Details (Auto-Calc)</div>
   <div className="grid3">
    <div className="fg"><label>Bank / NBFC *</label><select id="fin_bank" name="fin_bank" value={formData['fin_bank'] || ''} onChange={handleChange}>
     <option>SBI</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option>
     <option>Kotak Bank</option><option>Yes Bank</option><option>Bank of Baroda</option>
     <option>Mahindra Finance</option><option>Shriram Finance</option><option>HDB Financial</option>
     <option>Bajaj Finserv</option><option>Cholamandalam</option><option>IDFC First</option><option>Other</option>
    </select></div>
    <div className="fg"><label>Vehicle Sale Price ₹</label><input type="number" id="fin_sp" name="fin_sp" value={formData['fin_sp'] || ''} onChange={handleChange} placeholder="0"  /></div>
    <div className="fg"><label>Down Payment ₹</label><input type="number" id="fin_dp" name="fin_dp" value={formData['fin_dp'] || ''} onChange={handleChange} placeholder="0"  /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Loan Amount ₹ (Auto)</label><div className="calc-out" id="fin_lamt">₹ 0</div></div>
    <div className="fg"><label>Rate of Interest % (p.a.)</label><input type="number" id="fin_roi" name="fin_roi" value={formData['fin_roi'] || ''} onChange={handleChange} placeholder="9.5" step="0.1"  /></div>
    <div className="fg"><label>Tenure (Months)</label><select id="fin_ten" name="fin_ten" value={formData['fin_ten'] || ''} onChange={handleChange} >
     <option>12</option><option>18</option><option>24</option><option>36</option><option>48</option><option>60</option><option>72</option><option>84</option>
    </select></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>EMI ₹ (Auto)</label><div className="calc-out" id="fin_emi">₹ 0</div></div>
    <div className="fg"><label>Total Interest ₹ (Auto)</label><div className="calc-out" id="fin_tint">₹ 0</div></div>
    <div className="fg"><label>Total Payable ₹ (Auto)</label><div className="calc-out" id="fin_tpay">₹ 0</div></div>
   </div>
   <div className="sect-lbl"><i className="fa fa-file-signature"></i> Application & Status</div>
   <div className="grid3">
    <div className="fg"><label>Status *</label><select id="fin_stat" name="fin_stat" value={formData['fin_stat'] || ''} onChange={handleChange}><option>Applied</option><option>Approved</option><option>Disbursed</option><option>Rejected</option><option>Closed</option></select></div>
    <div className="fg"><label>Disbursement Date</label><input type="date" id="fin_disd" name="fin_disd" value={formData['fin_disd'] || ''} onChange={handleChange} /></div>
    <div className="fg"><label>Executive (DSA)</label><input id="fin_exec" name="fin_exec" value={formData['fin_exec'] || ''} onChange={handleChange} placeholder="Agent name" /></div>
   </div>
   <div className="grid2">
    <div className="fg"><label>File Number</label><input id="fin_fileno" name="fin_fileno" value={formData['fin_fileno'] || ''} onChange={handleChange} placeholder="Bank file/loan no." /></div>
    <div className="fg"><label>Remarks</label><input id="fin_rem" name="fin_rem" value={formData['fin_rem'] || ''} onChange={handleChange} placeholder="Notes" /></div>
   </div>
  </div>
  <div className="m-foot"><button className="btn btn-out"  onClick={onClose}>Cancel</button><button className="btn btn-or" onClick={handleSave} ><i className="fa fa-save"></i> Save</button></div>
 </div>
</div>
  );
};


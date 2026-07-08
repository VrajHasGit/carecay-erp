import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const PurchaseInquiryModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    source: 'Walk-in',
    date: new Date().toISOString().split('T')[0],
    sellerName: '',
    mobile: '',
    city: '',
    make: '',
    model: '',
    status: 'New'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await addDoc(collection(db, 'pur_inq'), formData);
      alert('Inquiry saved successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving inquiry", error);
      alert('Error saving data');
    }
  };

  return (
    <div className="overlay" style={{ display: 'flex' }}>
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🚗</div>
          <h3>Purchase Inquiry</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="sect-lbl"><i className="fa fa-circle-info"></i> Inquiry Details</div>
          <div className="grid3">
            <div className="fg"><label>Inquiry Source *</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                <option>Walk-in</option><option>Call</option><option>Online</option>
              </select>
            </div>
            <div className="fg"><label>Inquiry Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} />
            </div>
          </div>
          <div className="sect-lbl"><i className="fa fa-user"></i> Seller Details</div>
          <div className="grid3">
            <div className="fg"><label>Seller Name *</label>
              <input name="sellerName" value={formData.sellerName} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="fg"><label>Seller Mobile *</label>
              <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10 digit mobile" maxLength="10" />
            </div>
            <div className="fg"><label>City *</label>
              <input name="city" value={formData.city} onChange={handleChange} placeholder="City" />
            </div>
          </div>
          <div className="sect-lbl"><i className="fa fa-car"></i> Vehicle Details</div>
          <div className="grid3">
            <div className="fg"><label>Vehicle Make *</label>
              <input name="make" value={formData.make} onChange={handleChange} placeholder="Make" />
            </div>
            <div className="fg"><label>Vehicle Model *</label>
              <input name="model" value={formData.model} onChange={handleChange} placeholder="Model" />
            </div>
            <div className="fg"><label>Inquiry Status *</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option>New</option><option>In-Progress</option><option>Closed-Won</option>
              </select>
            </div>
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose}>Cancel</button>
          <button className="btn btn-or" onClick={handleSave}><i className="fa fa-save"></i> Save Inquiry</button>
        </div>
      </div>
    </div>
  );
};

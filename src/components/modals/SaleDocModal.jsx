import React, { useState, useEffect } from 'react';
import { today } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export const SaleDocModal = ({ isOpen, onClose, onSave, editData }) => {
  const { currentUser } = useAuth();
  const { data } = useData();

  const [fd, setFd] = useState({
    date: today(),
    sd_obid: '',
    sd_regn: '',
    sd_cname: '',
    sd_inv: false,
    sdu_inv: '',
    sd_rto: false,
    sdu_rto: '',
    sd_ins: false,
    sdu_ins: '',
    sd_dn: false,
    sdu_dn: '',
    sd_gp: false,
    sdu_gp: '',
    sd_pay: false,
    sdu_pay: '',
    sd_stat: 'Incomplete',
    sd_verby: ''
  });

  useEffect(() => {
    if (editData) {
      setFd(prev => ({ ...prev, ...editData }));
    } else {
      setFd(prev => ({ ...prev, date: today() }));
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFd(prev => {
      const nf = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      // Auto complete status logic
      if (
        nf.sd_inv && nf.sd_rto && nf.sd_ins && 
        nf.sd_dn && nf.sd_gp && nf.sd_pay &&
        nf.sd_stat !== 'Complete'
      ) {
        nf.sd_stat = 'Complete';
        if (!nf.sd_verby) {
          nf.sd_verby = currentUser?.name || 'Admin';
        }
      } else if (
        (!nf.sd_inv || !nf.sd_rto || !nf.sd_ins || !nf.sd_dn || !nf.sd_gp || !nf.sd_pay) && 
        nf.sd_stat === 'Complete'
      ) {
        nf.sd_stat = 'Incomplete';
      }
      
      // Auto-fill customer info based on OB ID
      if (name === 'sd_obid' && value) {
        const ob = (data.sob || []).find(r => r.sobId === value || r.id === value);
        if (ob) {
          if (!nf.sd_regn) nf.sd_regn = ob.sob_regn || '';
          if (!nf.sd_cname) nf.sd_cname = ob.sob_cname || ob.sob_buyer || '';
        }
      }

      return nf;
    });
  };

  const handleURLChange = (name, val) => {
    setFd(prev => ({ ...prev, [name]: val }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h2>{editData ? 'Edit Sale Documents' : 'Add Sale Documents'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={fd.date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Sales Order Booking ID</label>
              <input type="text" name="sd_obid" value={fd.sd_obid} onChange={handleChange} placeholder="e.g. SOB-101" />
            </div>
            <div className="form-group">
              <label>Vehicle Reg No.</label>
              <input type="text" name="sd_regn" value={fd.sd_regn} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Customer Name</label>
              <input type="text" name="sd_cname" value={fd.sd_cname} onChange={handleChange} />
            </div>
          </div>

          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border)' }}></div>
          <h3 style={{ fontSize: 13, marginBottom: 15, color: 'var(--text2)', textTransform: 'uppercase' }}>Checklist & Attachments</h3>
          
          <div className="form-grid">
            <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
              <input type="checkbox" name="sd_inv" checked={fd.sd_inv} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <div style={{ flex: 1 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Sales Invoice</label>
                <input type="text" placeholder="G-Drive Link / URL" value={fd.sdu_inv} onChange={(e) => handleURLChange('sdu_inv', e.target.value)} style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
              <input type="checkbox" name="sd_rto" checked={fd.sd_rto} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <div style={{ flex: 1 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>RTO Transfer Receipt</label>
                <input type="text" placeholder="G-Drive Link / URL" value={fd.sdu_rto} onChange={(e) => handleURLChange('sdu_rto', e.target.value)} style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
              <input type="checkbox" name="sd_ins" checked={fd.sd_ins} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <div style={{ flex: 1 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Insurance Transfer</label>
                <input type="text" placeholder="G-Drive Link / URL" value={fd.sdu_ins} onChange={(e) => handleURLChange('sdu_ins', e.target.value)} style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }} />
              </div>
            </div>
            
            <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
              <input type="checkbox" name="sd_dn" checked={fd.sd_dn} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <div style={{ flex: 1 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Signed Delivery Note</label>
                <input type="text" placeholder="G-Drive Link / URL" value={fd.sdu_dn} onChange={(e) => handleURLChange('sdu_dn', e.target.value)} style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
              <input type="checkbox" name="sd_gp" checked={fd.sd_gp} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <div style={{ flex: 1 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Signed Gate Pass</label>
                <input type="text" placeholder="G-Drive Link / URL" value={fd.sdu_gp} onChange={(e) => handleURLChange('sdu_gp', e.target.value)} style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 8 }}>
              <input type="checkbox" name="sd_pay" checked={fd.sd_pay} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <div style={{ flex: 1 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Payment Receipt</label>
                <input type="text" placeholder="G-Drive Link / URL" value={fd.sdu_pay} onChange={(e) => handleURLChange('sdu_pay', e.target.value)} style={{ marginTop: 6, fontSize: 11, padding: '4px 8px' }} />
              </div>
            </div>
          </div>

          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border)' }}></div>

          <div className="form-grid">
            <div className="form-group">
              <label>Overall Status</label>
              <select name="sd_stat" value={fd.sd_stat} onChange={handleChange}>
                <option value="Incomplete">Incomplete</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div className="form-group">
              <label>Verified By</label>
              <input type="text" name="sd_verby" value={fd.sd_verby} onChange={handleChange} placeholder="e.g. Admin Name" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-sec" onClick={onClose}>Cancel</button>
          <button className="btn-pri" onClick={() => onSave(fd)}>Save Documents</button>
        </div>
      </div>
    </div>
  );
};

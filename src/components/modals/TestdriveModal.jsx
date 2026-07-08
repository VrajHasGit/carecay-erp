import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { autoFillFromSalInq, autoFillFromStock, autoFillFromStockId } from '../../utils/relations';
import { today } from '../../utils/helpers';

export const TestdriveModal = ({ isOpen, onClose, onSave, editData, quickInqId }) => {
  const blank = {
    td_date: today(), td_time: '10:00', td_dur: '30 mins',
    td_cname: '', td_mob: '', td_sinid: '',
    td_regn: '', td_mm: '', td_year: '', td_stkid: '',
    td_kmbefore: '', td_kmafter: '', td_dby: 'Ritesh Shah',
    td_stat: 'Scheduled', td_fb: '-', td_rem: '',
    td_lic: '', td_licver: false, td_cancel: ''
  };

  const [formData, setFormData] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setFormData({ ...blank, ...editData });
    } else if (quickInqId) {
      setFormData({ ...blank, td_sinid: quickInqId });
      doFillFromInq(quickInqId);
    } else {
      setFormData(blank);
    }
  }, [isOpen, editData, quickInqId]);

  if (!isOpen) return null;

  const doFillFromInq = async (id) => {
    if (!id || id.length < 5) return;
    setFilling('inq');
    const d = await autoFillFromSalInq(id);
    if (d) {
      setFormData(prev => ({
        ...prev,
        td_cname: d.buyerName || d.customerName || prev.td_cname,
        td_mob: d.mobile || d.buyerMob || prev.td_mob,
      }));
    }
    setFilling('');
  };

  const doFillFromRegNo = async (regNo) => {
    if (!regNo || regNo.length < 6) return;
    setFilling('reg');
    const d = await autoFillFromStock(regNo);
    if (d) {
      setFormData(prev => ({
        ...prev,
        td_mm: d.make && d.model ? `${d.make} ${d.model}` : prev.td_mm,
        td_year: d.year || prev.td_year,
        td_stkid: d.stkId || prev.td_stkid,
        td_kmbefore: d.km || prev.td_kmbefore,
      }));
    }
    setFilling('');
  };

  const doFillFromStkId = async (stkId) => {
    if (!stkId || stkId.length < 5) return;
    setFilling('stk');
    const d = await autoFillFromStockId(stkId);
    if (d) {
      setFormData(prev => ({
        ...prev,
        td_mm: d.make && d.model ? `${d.make} ${d.model}` : prev.td_mm,
        td_year: d.year || prev.td_year,
        td_regn: d.regNo || prev.td_regn,
        td_kmbefore: d.km || prev.td_kmbefore,
      }));
    }
    setFilling('');
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'td_sinid') doFillFromInq(value);
    if (name === 'td_regn') doFillFromRegNo(value);
    if (name === 'td_stkid') doFillFromStkId(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editData && editData.id) {
        await updateDoc(doc(db, 'td', editData.id), { ...formData, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, 'td'), { ...formData, createdAt: new Date().toISOString() });
      }
      if (onSave) await onSave(formData);
      else onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const Tag = ({ text }) => (
    <span style={{ color: 'var(--or1)', fontSize: 10, marginLeft: 4 }}>
      {filling ? '⏳' : '⚡'} {text}
    </span>
  );

  return (
    <div className="overlay on" id="m_testdrive">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🚗</div>
          <h3>Schedule Test Drive</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="grid3">
            <div className="fg"><label>Date *</label><input type="date" name="td_date" value={formData.td_date} onChange={handleChange} /></div>
            <div className="fg"><label>Time *</label><input type="time" name="td_time" value={formData.td_time} onChange={handleChange} /></div>
            <div className="fg"><label>Duration</label>
              <select name="td_dur" value={formData.td_dur} onChange={handleChange}>
                <option>15 mins</option><option>30 mins</option><option>45 mins</option><option>60 mins</option>
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Sales Inquiry ID <Tag text="Auto-Fill Buyer" /></label>
              <input name="td_sinid" value={formData.td_sinid} onChange={handleChange} placeholder="SIN-2025-0001" />
            </div>
            <div className="fg"><label>Customer Name *</label><input name="td_cname" value={formData.td_cname} onChange={handleChange} placeholder="Customer name" /></div>
            <div className="fg"><label>Mobile *</label><input type="tel" name="td_mob" value={formData.td_mob} onChange={handleChange} placeholder="10-digit mobile" maxLength="10" /></div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Stock ID <Tag text="Auto-Fill Vehicle" /></label>
              <input name="td_stkid" value={formData.td_stkid} onChange={handleChange} placeholder="STK-2025-0001" />
            </div>
            <div className="fg">
              <label>Vehicle (Reg No.) <Tag text="Auto-Fill from Stock" /></label>
              <input name="td_regn" value={formData.td_regn} onChange={handleChange} placeholder="GJ-01-AB-1234" />
            </div>
            <div className="fg"><label>Make / Model <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="td_mm" value={formData.td_mm} onChange={handleChange} placeholder="Maruti Swift VXI" /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Year <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="td_year" value={formData.td_year} onChange={handleChange} placeholder="2022" /></div>
            <div className="fg"><label>KM Before <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto from Stock</span></label><input type="number" name="td_kmbefore" value={formData.td_kmbefore} onChange={handleChange} placeholder="52000" /></div>
            <div className="fg"><label>KM After</label><input type="number" name="td_kmafter" value={formData.td_kmafter} onChange={handleChange} /></div>
          </div>
          <div className="grid2">
            <div className="fg"><label>Driving License No. *</label><input name="td_lic" value={formData.td_lic} onChange={handleChange} placeholder="XX-00-00000000000" /></div>
            <div className="fg" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <input type="checkbox" name="td_licver" checked={formData.td_licver} onChange={handleChange} style={{ width: 'auto', height: 'auto' }} />
              <label style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>License Verified (Original Check)</label>
            </div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Driven By</label>
              <select name="td_dby" value={formData.td_dby} onChange={handleChange}>
                <option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option>
                <option>Maruut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option>
                <option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option>
              </select>
            </div>
            <div className="fg"><label>Status</label>
              <select name="td_stat" value={formData.td_stat} onChange={handleChange}>
                <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
            <div className="fg"><label>Customer Feedback</label>
              <select name="td_fb" value={formData.td_fb} onChange={handleChange}>
                <option>-</option><option>Very Interested</option><option>Interested</option>
                <option>Not Interested</option><option>Need Time</option>
              </select>
            </div>
          </div>
          {formData.td_stat === 'Cancelled' && (
            <div className="grid1"><div className="fg"><label>Cancel Reason *</label><input name="td_cancel" value={formData.td_cancel} onChange={handleChange} placeholder="Reason for cancellation" /></div></div>
          )}
          <div className="fg"><label>Remarks</label><input name="td_rem" value={formData.td_rem} onChange={handleChange} placeholder="Notes" /></div>
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
};

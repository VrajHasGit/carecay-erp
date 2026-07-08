import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { today, genId } from '../../utils/helpers';
import { getNextCounter } from '../../services/db';
import { MAKES, MODELS, YEARS, CITIES, FUELS, TRANS, COLORS, OWNERS } from '../../utils/constants';

const INIT = {
  inqId: '',
  source: 'Walk-in', sourceName: '', sourceNumber: '', nameSource: '', date: today(),
  teleCallerName: '', branch: 'SG Highway',
  sellerName: '', mobile: '', altMobile: '', email: '', city: '', state: 'Gujarat', address: '',
  make: '', model: '', variant: '', year: '', regYear: '', fuel: 'Petrol', trans: 'Manual',
  color: 'White', km: '', owners: '1st', regState: '', regRto: '', regSeries: '', regNum: '', rto: '', insuranceStatus: 'No', insurance: '', 
  hypothecation: 'No', loanBank: '', loan: '',
  assigned: 'Ritesh Shah', status: 'New', nextFU: '', updatedBy: '', remarks: ''
};

export const PurInqModal = ({ isOpen, onClose, onSave, editData }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(INIT);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState([]);
  const [partnerOptions, setPartnerOptions] = useState([
    'Rajan Desai', 'Ritesh Shah', 'Kalpesh Joshi', 'Marut Dandawala', 'Isha Dashraniya', 'Pinal Desai', 'Other'
  ]);
  const [addingPartnerIndex, setAddingPartnerIndex] = useState(null);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [partnerSelections, setPartnerSelections] = useState(['']);

  useEffect(() => {
    if (editData) {
      const pSelections = editData.nameSource ? editData.nameSource.split(',').map(s => s.trim()) : [''];
      setPartnerSelections(pSelections);
      const regParts = editData.regNo ? editData.regNo.split('-') : [];
      setFormData({ 
        ...INIT, 
        ...editData,
        nameSource: pSelections.join(', '),
        hypothecation: editData.loan === 'Yes' || editData.loan === 'No' ? editData.loan : editData.hypothecation || 'No',
        loan: editData.loan === 'Yes' || editData.loan === 'No' ? '' : editData.loan,
        insuranceStatus: editData.insurance ? 'Yes' : 'No',
        regState: regParts[0] || '',
        regRto: regParts[1] || '',
        regSeries: regParts[2] || '',
        regNum: regParts[3] || ''
      });
      setModels(MODELS[editData.make] || []);
      setPartnerOptions(p => {
         const newP = [...p];
         pSelections.forEach(ps => {
            if(ps && !newP.includes(ps)) newP.push(ps);
         })
         return newP;
      });
    } else {
      setPartnerSelections(['']);
      setModels([]);
      if (isOpen) {
        let mounted = true;
        getNextCounter('pur').then(cnt => {
          if (mounted) {
            setFormData({ ...INIT, date: today(), inqId: genId('INQ', cnt) });
          }
        });
        return () => { mounted = false; };
      } else {
        setFormData({ ...INIT, date: today() });
      }
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleMakeChange = (e) => {
    const make = e.target.value;
    set('make', make);
    setModels(MODELS[make] || []);
    set('model', '');
  };

  const handleSave = async (shiftToVal = false) => {
    if (!formData.sellerName.trim()) return alert('Seller Name is required.');
    if (!formData.make) return alert('Vehicle Make is required.');
    setSaving(true);
    try {
      const parts = [formData.regState, formData.regRto, formData.regSeries, formData.regNum].filter(Boolean);
      const regNo = parts.length > 0 ? parts.join('-').toUpperCase() : '';
      await onSave({ ...formData, regNo }, shiftToVal);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay on" id="m_pur_inq">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🚗</div>
          <h3>{editData ? 'Edit Purchase Inquiry' : 'New Purchase Inquiry'}</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          {/* Inquiry Details */}
          <div className="sect-lbl"><i className="fa fa-circle-info"></i> Inquiry Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Inquiry ID</label>
              <input name="inqId" value={formData.inqId} onChange={handleChange} placeholder="Generating..." readOnly style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
            </div>
            <div className="fg">
              <label>Inquiry Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} />
            </div>
            <div className="fg">
              <label>Branch</label>
              <select name="branch" value={formData.branch} onChange={handleChange}>
                <option>SG Highway</option>
                <option>Vastral</option>
                <option>Navrangpura</option>
                <option>Mithakali</option>
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Inquiry Source *</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                <option>Walk-in</option><option>Call</option><option>Online</option>
                <option>Reference</option><option>Dealer</option><option>Partner</option><option>OLX</option>
                <option>Carwale</option><option>WhatsApp</option>
              </select>
            </div>
            <div className="fg">
              <label>Source Name</label>
              <input name="sourceName" value={formData.sourceName} onChange={handleChange} placeholder="Source Name" disabled={formData.source === 'Walk-in'} />
            </div>
            <div className="fg">
              <label>Source Number</label>
              <input name="sourceNumber" value={formData.sourceNumber} onChange={handleChange} type="tel" maxLength="10" placeholder="Source Number" disabled={formData.source === 'Walk-in'} />
            </div>
            <div className="fg">
              <label>Telecaller Name</label>
              <input name="teleCallerName" value={formData.teleCallerName} onChange={handleChange} placeholder="Name" disabled={!['Online', 'OLX', 'Carwale'].includes(formData.source)} />
            </div>
          </div>
          <div className="grid1">
            <div className="fg">
              <label>Partner Name</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partnerSelections.map((selection, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    {addingPartnerIndex !== index ? (
                      <select 
                        value={selection} 
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setAddingPartnerIndex(index);
                            setNewPartnerName('');
                          } else {
                            const newSelections = [...partnerSelections];
                            newSelections[index] = e.target.value;
                            setPartnerSelections(newSelections);
                            set('nameSource', newSelections.filter(Boolean).join(', '));
                          }
                        }} 
                        style={{ flex: 1 }}
                      >
                        <option value="">-- Select --</option>
                        {partnerOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--or1)' }}>+ Create New Partner...</option>
                      </select>
                    ) : (
                      <>
                        <input 
                          value={newPartnerName} 
                          onChange={e => setNewPartnerName(e.target.value)} 
                          placeholder="Enter partner name..." 
                          style={{ flex: 1 }} 
                          autoFocus
                        />
                        <button type="button" className="btn btn-or" style={{ padding: '0 12px' }} onClick={() => {
                          if (newPartnerName.trim()) {
                            setPartnerOptions(prev => [...prev, newPartnerName.trim()]);
                            const newSelections = [...partnerSelections];
                            newSelections[index] = newPartnerName.trim();
                            setPartnerSelections(newSelections);
                            set('nameSource', newSelections.filter(Boolean).join(', '));
                          }
                          setAddingPartnerIndex(null);
                          setNewPartnerName('');
                        }} title="Save Partner">✓</button>
                        <button type="button" className="btn btn-out" style={{ padding: '0 12px' }} onClick={() => {
                          setAddingPartnerIndex(null);
                          setNewPartnerName('');
                        }} title="Cancel">✕</button>
                      </>
                    )}
                    {index === partnerSelections.length - 1 && addingPartnerIndex !== index && (
                      <button type="button" className="btn btn-out" style={{ padding: '0 12px' }} onClick={() => setPartnerSelections([...partnerSelections, ''])} title="Add another partner">+</button>
                    )}
                    {partnerSelections.length > 1 && addingPartnerIndex !== index && (
                      <button type="button" className="btn btn-out" style={{ padding: '0 12px', color: 'red' }} onClick={() => {
                        const newSelections = partnerSelections.filter((_, i) => i !== index);
                        setPartnerSelections(newSelections);
                        set('nameSource', newSelections.filter(Boolean).join(', '));
                      }} title="Remove partner">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seller Details */}
          <div className="sect-lbl"><i className="fa fa-user"></i> Seller Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Seller Name *</label>
              <input name="sellerName" value={formData.sellerName} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="fg">
              <label>Mobile *</label>
              <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10 digit" type="tel" maxLength="10" />
            </div>
            <div className="fg">
              <label>Alt Mobile</label>
              <input name="altMobile" value={formData.altMobile} onChange={handleChange} placeholder="Optional" type="tel" maxLength="10" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="email@example.com" />
            </div>
            <div className="fg">
              <label>City</label>
              <select name="city" value={formData.city} onChange={handleChange}>
                <option value="">Select City</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>State</label>
              <input name="state" value={formData.state} readOnly
                style={{ background: 'rgba(16,185,129,.08)', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 600 }} />
            </div>
          </div>
          <div className="grid1">
            <div className="fg">
              <label>Address</label>
              <input name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="sect-lbl"><i className="fa fa-car"></i> Vehicle Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Vehicle Make *</label>
              <select name="make" value={formData.make} onChange={handleMakeChange}>
                <option value="">Select Brand</option>
                {MAKES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Vehicle Model *</label>
              <select name="model" value={formData.model} onChange={handleChange}>
                <option value="">Select Model</option>
                {models.map(m => <option key={m}>{m}</option>)}
                {!MODELS[formData.make] && formData.make && <option value={formData.model}>{formData.model}</option>}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="fg">
              <label>Variant</label>
              <input name="variant" value={formData.variant} onChange={handleChange} placeholder="VXI / ZXI / SX" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Mfg Year</label>
              <select name="year" value={formData.year} onChange={handleChange}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Reg Year</label>
              <select name="regYear" value={formData.regYear} onChange={handleChange}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Fuel Type</label>
              <select name="fuel" value={formData.fuel} onChange={handleChange}>
                {FUELS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Transmission</label>
              <select name="trans" value={formData.trans} onChange={handleChange}>
                {TRANS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Color</label>
              <select name="color" value={formData.color} onChange={handleChange}>
                {COLORS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>KM Driven</label>
              <input name="km" value={formData.km} onChange={handleChange} type="number" placeholder="45000" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Owners</label>
              <select name="owners" value={formData.owners} onChange={handleChange}>
                {OWNERS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px', background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <i className="fa fa-id-card" style={{ color: 'var(--or1)' }}></i> Registration Number
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>State</label>
                <input name="regState" value={formData.regState} onChange={handleChange} placeholder="SS" maxLength={2} style={{ textTransform: 'uppercase', textAlign: 'center', background: 'var(--bg)' }} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RTO No.</label>
                <input name="regRto" value={formData.regRto} onChange={handleChange} placeholder="NN" maxLength={2} style={{ textAlign: 'center', background: 'var(--bg)' }} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Series</label>
                <input name="regSeries" value={formData.regSeries} onChange={handleChange} placeholder="PP" maxLength={3} style={{ textTransform: 'uppercase', textAlign: 'center', background: 'var(--bg)' }} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Number</label>
                <input name="regNum" value={formData.regNum} onChange={handleChange} placeholder="XXXX" maxLength={4} style={{ textAlign: 'center', background: 'var(--bg)' }} />
              </div>
            </div>
            
            <div className="fg" style={{ marginTop: '16px', marginBottom: 0 }}>
              <label style={{ fontSize: '11px', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final Reg No.</label>
              <input 
                value={[formData.regState, formData.regRto, formData.regSeries, formData.regNum].filter(Boolean).join('-').toUpperCase()} 
                readOnly 
                placeholder="SS-NN-PP-XXXX"
                style={{ 
                  background: 'rgba(16,185,129,.08)', 
                  borderColor: 'var(--success)', 
                  color: 'var(--success)', 
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '1px'
                }} 
              />
            </div>
          </div>
          <div className="grid2">
            <div className="fg">
              <label>Insurance</label>
              <select name="insuranceStatus" value={formData.insuranceStatus} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="fg">
              <label>Insurance Valid Till</label>
              <input type="date" name="insurance" value={formData.insurance} onChange={handleChange} disabled={formData.insuranceStatus !== 'Yes'} />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Hypothecation</label>
              <select name="hypothecation" value={formData.hypothecation} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="fg">
              <label>Bank Name</label>
              <input name="loanBank" value={formData.loanBank} onChange={handleChange} placeholder="Bank name" disabled={formData.hypothecation !== 'Yes'} />
            </div>
            <div className="fg">
              <label>Loan Outstanding</label>
              <input name="loan" value={formData.loan} onChange={handleChange} placeholder="Amount" type="number" disabled={formData.hypothecation !== 'Yes'} />
            </div>
          </div>

          {/* Assignment */}
          <div className="sect-lbl"><i className="fa fa-list-check"></i> Assignment & Status</div>
          <div className="grid3">
            <div className="fg">
              <label>Assigned To *</label>
              <select name="assigned" value={formData.assigned} onChange={handleChange}>
                <option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option>
                <option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option>
                <option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option><option>Admin</option>
              </select>
            </div>
            <div className="fg">
              <label>Status *</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option>New</option><option>In-Progress</option><option>Closed-Won</option>
                <option>Closed-Lost</option><option>Hold</option>
              </select>
            </div>
            <div className="fg">
              <label>Next Follow-Up Date</label>
              <input type="date" name="nextFU" value={formData.nextFU} onChange={handleChange} />
            </div>
          </div>
          <div className="grid2">
            <div className="fg">
              <label>Updated By</label>
              <input name="updatedBy" value={editData?.updatedBy || currentUser?.name || ''} readOnly style={{ background: 'var(--bg-card-hover)', color: 'var(--text2)', cursor: 'not-allowed' }} placeholder="User name" />
            </div>
            <div className="fg">
              <label>Remarks</label>
              <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Notes" />
            </div>
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save Inquiry</>}
          </button>
        </div>
      </div>
    </div>
  );
};

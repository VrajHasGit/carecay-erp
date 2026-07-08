import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { processFiles } from '../../utils/uploadMedia';
import { printDocument } from '../../utils/helpers';

export const COMMON_CATEGORIES = [
  'Rent', 'Salary', 'Utilities', 'Marketing', 'Office Supplies', 'Business Insurance',
  'Bank Charges', 'Software / Subscriptions', 'Travel & Conveyance', 'Legal & Professional',
  'Fuel', 'Miscellaneous'
];

export const CAR_CATEGORIES = [
  'Workshop / Repair', 'Spare Parts', 'Detailing / Cleaning', 'RTO / Registration',
  'Vehicle Insurance', 'Transport / Logistics', 'Accessories', 'Penalty / Fine',
  'Parking / Storage', 'Other Car Expense'
];

const BRANCHES = ['SG Highway', 'Vastral', 'Head Office'];
const PAYEES = ['Ritesh Shah', 'Rajan Desai', 'Kalpesh Joshi', 'Marut Dandawala', 'Isha Dashraniya', 'Pinal Desai', 'Mittal Mehta', 'Amisha Dave', 'Dipti', 'Petty Cash'];

const emptyForm = () => ({
  expType: 'Common',
  date: new Date().toISOString().split('T')[0],
  category: '',
  branch: 'SG Highway',
  stkId: '', regNo: '', carMake: '', carModel: '', carYear: '',
  description: '',
  amount: '',
  paidBy: 'Petty Cash',
  payMethod: 'Cash',
  receiptNo: '',
  reference: '',
  notes: '',
  billPhotos: [],
  voucherNo: '',
  clientName: 'Carecay Pvt. Ltd.',
  voucherStatus: 'Done',
});

export const ExpModal = ({ isOpen, onClose, onSave, editData }) => {
  const { data } = useData();
  const [formData, setFormData] = useState(editData ? { ...emptyForm(), ...editData, billPhotos: editData.billPhotos || [] } : emptyForm());
  const [carQuery, setCarQuery] = useState('');
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchType = (type) => {
    if (type === formData.expType) return;
    setFormData(prev => ({
      ...prev,
      expType: type,
      category: '',
      ...(type === 'Common' ? { stkId: '', regNo: '', carMake: '', carModel: '', carYear: '' } : {}),
    }));
    setCarQuery('');
  };

  const stkList = data?.stk || [];
  const filteredCars = (() => {
    if (!carQuery.trim()) return [];
    const q = carQuery.toLowerCase();
    return stkList.filter(s => {
      const regNo = (s.regNo || s.sk_regn || '').toLowerCase();
      const make = (s.make || s.sk_make || '').toLowerCase();
      const model = (s.model || s.sk_model || '').toLowerCase();
      const stkId = (s.stkId || s.id || '').toLowerCase();
      return regNo.includes(q) || make.includes(q) || model.includes(q) || stkId.includes(q);
    }).slice(0, 8);
  })();

  const selectCar = (s) => {
    setFormData(prev => ({
      ...prev,
      stkId: s.stkId || s.id,
      regNo: s.regNo || s.sk_regn || '',
      carMake: s.make || s.sk_make || '',
      carModel: s.model || s.sk_model || '',
      carYear: s.year || s.sk_year || '',
    }));
    setCarQuery('');
    setShowCarDropdown(false);
  };

  const clearCar = () => setFormData(prev => ({ ...prev, stkId: '', regNo: '', carMake: '', carModel: '', carYear: '' }));

  const processIncomingFiles = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const processed = await processFiles(fileList);
      setFormData(prev => ({ ...prev, billPhotos: [...(prev.billPhotos || []), ...processed] }));
    } catch (err) {
      console.error('Bill upload failed:', err);
      alert('Failed to process file(s).');
    }
    setUploading(false);
  };

  const handleBillInput = (e) => { processIncomingFiles(e.target.files); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processIncomingFiles(e.dataTransfer.files); };
  const removeBillPhoto = (idx) => setFormData(prev => ({ ...prev, billPhotos: prev.billPhotos.filter((_, i) => i !== idx) }));

  const isCar = formData.expType === 'Car';
  const categories = isCar ? CAR_CATEGORIES : COMMON_CATEGORIES;

  const handleSaveBtn = async () => {
    if (!formData.amount || !formData.description) return alert('Description and Amount are required.');
    if (!formData.category) return alert('Please select a category.');
    if (isCar && !formData.stkId) return alert('Please select the vehicle this expense belongs to.');
    setSaving(true);
    try {
      if (onSave) await onSave({ ...formData });
    } catch (error) {
      console.error('Error saving record: ', error);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateVoucher = () => {
    if (!formData.amount || !formData.paidBy.trim() || !formData.description.trim()) {
      return alert('Amount, Paid By and Description are required to generate a voucher.');
    }

    const amt = Number(formData.amount).toLocaleString('en-IN') + '/-';

    const customStyles = `
  .print-header { display: none !important; }
  body { background: #e0e0e0; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
  .no-print { width: 800px; margin-bottom: 20px; }
  .voucher-container {
    width: 800px;
    min-height: 520px;
    background: #fff;
    padding: 20px 30px;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    color: #000;
    border: 1px solid #ccc;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  @media print {
    body { background: #fff; padding: 0; display: block; margin: 0; }
    .no-print { display: none !important; }
    .voucher-container {
      width: 100%;
      height: 148mm;
      border: none;
      box-shadow: none;
      padding: 10mm;
      box-sizing: border-box;
    }
    @page { size: A4 portrait; margin: 0; }
  }

  .v-header-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .v-logo img { height: 80px; object-fit: contain; }

  .v-top-right { text-align: right; }
  .v-title-box { background: #333; color: #fff; padding: 4px 10px; font-size: 20px; font-weight: bold; display: inline-block; letter-spacing: 1px; border-radius: 2px; margin-bottom: 10px; }

  .v-row-right { display: flex; justify-content: flex-end; align-items: flex-end; gap: 30px; font-size: 14px; font-weight: 600; }
  .v-line { border-bottom: 1px solid #000; display: inline-block; padding-left: 10px; font-weight: 600; }

  .v-row-company { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 15px; }

  .v-amount-box { display: flex; align-items: center; border: 2px solid #333; height: 34px; }
  .v-rs { background: #333; color: #fff; padding: 0 10px; height: 100%; display: flex; align-items: center; font-weight: bold; font-size: 16px; }

  .v-row { display: flex; align-items: flex-end; margin-bottom: 15px; font-size: 14px; width: 100%; }
  .v-label { white-space: nowrap; margin-right: 10px; font-weight: 500; }

  .v-pay-by { border: 1.5px solid #333; display: inline-block; padding: 4px 10px; margin-top: 5px; font-size: 13px; font-weight: 600; }

  .v-sign-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1.5px solid #333; }
  .v-sign-table td { border: 1.5px solid #333; height: 60px; vertical-align: top; padding: 4px 6px; font-size: 12px; font-weight: 600; position: relative; }

  .v-footer { text-align: center; margin-top: 15px; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; }
`;

    const reference = formData.reference || formData.receiptNo || '';

    const htmlContent = `
<div class="no-print" style="background: #fff3cd; color: #856404; padding: 10px 15px; border-radius: 4px; border: 1px solid #ffeeba; margin-bottom: 20px; font-weight: bold; width: 800px; text-align: center; font-size: 13px;">
  ⚠️ IMPORTANT: Ensure your print settings are set to "Paper Size: A4" and "Layout: Portrait". The voucher will print on the top half of the page.
</div>
<div class="voucher-container">
  <div class="v-header-grid">
    <div class="v-logo">
      <img src="/logo.png" alt="Carecay" />
    </div>
    <div class="v-top-right">
      <div class="v-title-box">Cash Voucher</div>
      <div class="v-row-right">
        <div>V.No. : <span class="v-line" style="width:120px; margin-bottom:2px;">${formData.voucherNo || ''}</span></div>
        <div>Date : <span class="v-line" style="width:120px; margin-bottom:2px; font-weight: bold; padding-left: 5px;">${formData.date ? formData.date.split('-').reverse().join('/') : ''}</span></div>
      </div>
    </div>
  </div>

  <div class="v-row-company">
    <div style="font-size: 15px; font-weight: 600; display:flex; align-items: flex-end; white-space: nowrap; margin-left: 5px;">
      For Company Carecay Pvt Ltd
    </div>
    <div class="v-amount-box">
      <div class="v-rs">Rs.</div>
      <div style="width: 140px; text-align: center; font-weight: bold; font-size: 18px;">${amt}</div>
    </div>
  </div>

  <div class="v-row">
    <span class="v-label">Pay To :</span>
    <span class="v-line" style="flex:1;">${formData.paidBy || '______________________'}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Purpose :</span>
    <span class="v-line" style="flex:1;">${formData.description}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Client Name:</span>
    <span class="v-line" style="flex:1;">${formData.clientName}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Category :</span>
    <span class="v-line" style="flex:1;">${formData.category || ''}</span>
    <span class="v-label" style="margin-left: 30px;">Reference :</span>
    <span class="v-line" style="flex:1;">${reference}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Remarks :</span>
    <span class="v-line" style="flex:1;">${formData.notes || ''}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Payment Status :</span>
    <span class="v-line" style="flex:1;">${formData.voucherStatus}</span>
  </div>

  <div class="v-pay-by">
    Pay by : ${(formData.payMethod || 'CASH').toUpperCase()}
  </div>

  <table class="v-sign-table">
    <tr>
      <td style="width: 25%;">Authorised by :</td>
      <td style="width: 25%;">Executive :</td>
      <td style="width: 25%;">Officer :</td>
      <td style="width: 25%; padding:0;">
        <div style="position:absolute; bottom:4px; right:4px; font-size:10px; font-weight:normal;">Receiver Signature</div>
      </td>
    </tr>
  </table>

  <div class="v-footer">● FOR OFFICE INTERNAL USE ONLY ●</div>
</div>
`;

    const safeVNo = (formData.voucherNo || 'VOUCHER').replace(/[^a-zA-Z0-9_-]/g, '-');
    const safePayTo = (formData.paidBy || 'PAYEE').replace(/[^a-zA-Z0-9_ -]/g, '-');
    const docTitle = `Expense-Voucher-${safeVNo}-${safePayTo}`.replace(/\s+/g, '-');

    const downloadOpts = { jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' } };
    printDocument(docTitle, htmlContent, customStyles, downloadOpts);
  };

  const TYPE_CARDS = [
    { key: 'Common', icon: 'fa-building', title: 'Common Expense', sub: 'Business overhead — rent, salary, marketing…' },
    { key: 'Car', icon: 'fa-car', title: 'Car-Specific Expense', sub: 'Tied to one vehicle — repair, RTO, accessories…' },
  ];

  return (
    <div className="overlay on" id="m_exp">
      <div className="mbox" style={{ maxWidth: 760 }}>
        <div className="m-hdr"><div className="m-hdr-icon">🧾</div><h3>{editData ? 'Edit Expense' : 'Add Expense'}</h3><button className="m-close" onClick={onClose}>✕</button></div>
        <div className="m-body">

          {/* ── Expense Type Selector ───────────────────────── */}
          <div className="sect-lbl"><i className="fa fa-layer-group"></i> What kind of expense is this?</div>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 22,
            padding: 18, marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {TYPE_CARDS.map(card => {
                const active = formData.expType === card.key;
                return (
                  <button key={card.key} type="button" onClick={() => switchType(card.key)}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--or1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    style={{
                      cursor: 'pointer', borderRadius: 18, padding: '36px 24px', position: 'relative',
                      border: active ? '3px solid var(--or1)' : '1.5px solid var(--border2)',
                      background: active ? 'rgba(232,93,4,.1)' : 'var(--surface)',
                      boxShadow: active ? '0 10px 28px rgba(232,93,4,.22)' : '0 1px 4px rgba(0,0,0,.04)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14,
                      transition: '.18s', fontFamily: 'inherit', width: '100%',
                    }}>
                    {active && (
                      <div style={{
                        position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: '50%',
                        background: 'var(--or1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      }}><i className="fa fa-check"></i></div>
                    )}
                    <div style={{
                      width: 76, height: 76, borderRadius: 20, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                      background: active ? 'linear-gradient(135deg,var(--or1),var(--or2))' : 'var(--surface2)',
                      color: active ? '#fff' : 'var(--text3)',
                    }}><i className={`fa ${card.icon}`}></i></div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: active ? 'var(--or1)' : 'var(--text)' }}>{card.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 7, lineHeight: 1.5 }}>{card.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid3">
            <div className="fg"><label>Date *</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} /></div>
            <div className="fg"><label>Description *</label><input name="description" value={formData.description || ''} onChange={handleChange} placeholder="What was the expense for?" /></div>
            <div className="fg"><label>Amount ₹ *</label><input type="number" name="amount" value={formData.amount || ''} onChange={handleChange} placeholder="0" /></div>
          </div>

          {/* ── Type-specific block ─────────────────────────── */}
          {!isCar ? (
            <div className="grid2">
              <div className="fg"><label>Branch *</label>
                <select name="branch" value={formData.branch || ''} onChange={handleChange}>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="fg"><label>Category *</label>
                <select name="category" value={formData.category || ''} onChange={handleChange}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="sect-lbl"><i className="fa fa-car"></i> Linked Vehicle</div>
              {formData.stkId ? (
                <div style={{
                  background: 'rgba(232,93,4,.07)', border: '1px solid rgba(232,93,4,.3)', borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <i className="fa fa-car-side" style={{ color: 'var(--or1)', fontSize: 16 }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{formData.carMake} {formData.carModel} {formData.carYear ? `(${formData.carYear})` : ''}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>{formData.regNo} · {formData.stkId}</div>
                  </div>
                  <button onClick={clearCar} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }} title="Change vehicle"><i className="fa fa-xmark"></i></button>
                </div>
              ) : (
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <input
                    value={carQuery}
                    onChange={e => { setCarQuery(e.target.value); setShowCarDropdown(true); }}
                    onFocus={() => setShowCarDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCarDropdown(false), 150)}
                    placeholder="Search by Reg No / Stock ID / Make / Model…"
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '8px 11px', fontFamily: 'inherit', fontSize: 12 }}
                  />
                  {showCarDropdown && carQuery.trim() && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4,
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 8px 20px rgba(0,0,0,.15)', maxHeight: 220, overflowY: 'auto',
                    }}>
                      {filteredCars.length > 0 ? filteredCars.map(s => (
                        <div key={s.id} onMouseDown={() => selectCar(s)}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border2)', fontSize: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{s.make || s.sk_make} {s.model || s.sk_model}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>{s.regNo || s.sk_regn} · {s.stkId || s.id}</div>
                        </div>
                      )) : (
                        <div style={{ padding: '10px 12px', fontSize: 11.5, color: 'var(--text3)', textAlign: 'center' }}>No matching vehicle found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="grid2">
                <div className="fg"><label>Category *</label>
                  <select name="category" value={formData.category || ''} onChange={handleChange}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg"><label>Branch</label>
                  <select name="branch" value={formData.branch || ''} onChange={handleChange}>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="grid3">
            <div className="fg"><label>Paid By</label>
              <select name="paidBy" value={formData.paidBy || ''} onChange={handleChange}>
                {PAYEES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="fg"><label>Payment Mode</label>
              <select name="payMethod" value={formData.payMethod || ''} onChange={handleChange}>
                <option>Cash</option><option>UPI</option><option>NEFT</option><option>Card</option>
              </select>
            </div>
            <div className="fg"><label>Receipt No.</label><input name="receiptNo" value={formData.receiptNo || ''} onChange={handleChange} placeholder="Bill / voucher number" /></div>
          </div>

          {!isCar && (
            <div className="grid1">
              <div className="fg"><label>Reference / Invoice No.</label><input name="reference" value={formData.reference || ''} onChange={handleChange} placeholder="Vendor invoice / reference number" /></div>
            </div>
          )}

          <div className="grid1">
            <div className="fg"><label>Notes</label><textarea rows={2} name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Additional notes…" /></div>
          </div>

          <div className="sect-lbl"><i className="fa fa-file-invoice-dollar"></i> Voucher Details</div>
          <div className="grid3">
            <div className="fg"><label>Voucher No.</label><input name="voucherNo" value={formData.voucherNo || ''} onChange={handleChange} placeholder="Optional" /></div>
            <div className="fg"><label>Client / Company Name</label><input name="clientName" value={formData.clientName || ''} onChange={handleChange} /></div>
            <div className="fg"><label>Payment Status</label>
              <select name="voucherStatus" value={formData.voucherStatus || 'Done'} onChange={handleChange}>
                <option>Done</option><option>Pending</option>
              </select>
            </div>
          </div>
          <div className="fg" style={{ marginBottom: 20 }}>
            <button type="button" className="btn btn-out" style={{ width: '100%', color: 'var(--or1)', borderColor: 'var(--or1)', height: '40px', fontWeight: '700' }} onClick={handleGenerateVoucher} title="Generate Voucher">
              <i className="fa fa-print"></i> Generate Voucher
            </button>
          </div>

          <div className="sect-lbl"><i className="fa fa-image"></i> Bill / Receipt Photos</div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--or1)' : 'var(--border)'}`, borderRadius: 'var(--radius)',
              padding: 16, textAlign: 'center', cursor: 'pointer', transition: '.2s', marginBottom: 10,
              background: dragOver ? 'rgba(232,93,4,.06)' : 'transparent',
            }}>
            {uploading ? (
              <><i className="car-spinner" style={{ fontSize: 20 }}></i><div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Processing…</div></>
            ) : (
              <>
                <i className="fa fa-cloud-upload-alt" style={{ fontSize: 24, color: 'var(--text3)', display: 'block', marginBottom: 6 }}></i>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Drag & Drop or <b style={{ color: 'var(--or1)' }}>Click to Upload</b> Bill / Receipt Photos</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>JPG, PNG — Multiple files allowed</div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleBillInput} />
          </div>
          {formData.billPhotos?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {formData.billPhotos.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: 70, height: 70, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border2)' }}>
                  <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeBillPhoto(i)} style={{
                    position: 'absolute', top: 2, right: 2, background: 'rgba(220,38,38,.9)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><i className="fa fa-xmark"></i></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={handleSaveBtn} disabled={saving || uploading}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save Expense</>}
          </button>
        </div>
      </div>
    </div>
  );
};

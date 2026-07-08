import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useData } from '../../contexts/DataContext';
import { addRecord, updateRecord, getNextCounter } from '../../services/db';
import { genId, today, printDocument } from '../../utils/helpers';
import { autoFillFromInq } from '../../utils/relations';

export const PclModal = ({ isOpen, onClose, onSave, onSuccess, editData, quickInqId }) => {
  const { data: ctxData } = useData();
  const [formData, setFormData] = useState({
    pc_inqid: "", pc_sname: "", pc_veh: "", pc_date: "", pc_type: "Direct Purchase",
    pc_stat: "Confirmed", pc_pp: "", pc_rto: "", pc_price: "", pc_tok: "", payments: [],
    pc_newcar: "",
    pc_loan: "No", pc_lbank: "", pc_tokd: "", pc_dby: "Ritesh Shah", pc_mgr: "",
    pc_edd: "", pc_cncl: "", pc_rem: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState('');
  const [hiddenPayments, setHiddenPayments] = useState({});
  const toggleHidePayment = (idx) => {
    setHiddenPayments(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // In-memory lookup first, Firestore fallback
  const lookupInquiry = async (inqId) => {
    if (!inqId) return null;
    const local = (ctxData?.pur_inq || []).find(r =>
      (r.inqId || '').toLowerCase() === inqId.toLowerCase() ||
      (r.id || '').toLowerCase() === inqId.toLowerCase()
    );
    if (local) return local;
    return await autoFillFromInq(inqId);
  };

  const applyAutoFill = async (inqId) => {
    const inqData = await lookupInquiry(inqId);
    let finalDate = "";
    let finalDealPrice = "";
    
    if (ctxData?.pfu) {
      const pfuRec = ctxData.pfu.find(r => (r.pf_inqid || '').toLowerCase() === (inqId || '').toLowerCase());
      if (pfuRec && pfuRec.followUps) {
        const cwFu = [...pfuRec.followUps].reverse().find(fu => fu.stat === 'Closed-Won');
        if (cwFu) {
          if (cwFu.date) finalDate = cwFu.date;
          if (cwFu.dealPrice) finalDealPrice = cwFu.dealPrice;
        }
      }
    }
    
    let obRto = "";
    if (ctxData?.ob) {
      const cleanRegn = (s) => (s || '').replace(/[\s-]/g, '').toLowerCase();
      const inqRegn = cleanRegn(inqData?.regNo || inqData?.pi_regn);
      const obRec = ctxData.ob.find(r => {
        if (inqId && (r.ob_inqid || '').toLowerCase() === (inqId || '').toLowerCase()) return true;
        if (inqRegn && cleanRegn(r.ob_regn) === inqRegn) return true;
        return false;
      });
      if (obRec && obRec.ob_rto) {
        obRto = obRec.ob_rto;
      }
    }

    if (inqData) {
      setFormData(prev => ({
        ...prev,
        pc_sname: inqData.sellerName || prev.pc_sname,
        pc_veh: inqData.make ? `${inqData.make} ${inqData.model || ''} ${inqData.year || ''}`.trim() : prev.pc_veh,
        pc_mob: inqData.mobile || prev.pc_mob,
        pc_make: inqData.make || prev.pc_make,
        pc_model: inqData.model || prev.pc_model,
        pc_year: inqData.year || prev.pc_year,
        pc_fuel: inqData.fuel || prev.pc_fuel,
        pc_km: inqData.km || prev.pc_km,
        pc_regn: inqData.regNo || prev.pc_regn,
        pc_date: prev.pc_date || finalDate || today(),
        pc_pp: prev.pc_pp || finalDealPrice,
        pc_rto: obRto || prev.pc_rto || '',
        pc_loan: inqData.hypothecation || prev.pc_loan,
        pc_lbank: inqData.loanBank || prev.pc_lbank,
      }));
      setAutoFillMsg(`✅ Auto-filled from: ${inqData.sellerName || inqId}`);
      setTimeout(() => setAutoFillMsg(''), 4000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAutoFillMsg('');
      if (editData) {
        const inqIdToUse = editData.pc_inqid || editData.inqId || '';
        const ppToUse = editData.pc_pp !== undefined ? editData.pc_pp : editData.pc_price;
        setFormData({ ...editData, pc_inqid: inqIdToUse, pc_pp: ppToUse, pc_rto: editData.pc_rto || '' });
        if (inqIdToUse) applyAutoFill(inqIdToUse);
      } else if (quickInqId) {
        setFormData(prev => ({ ...prev, pc_inqid: quickInqId }));
        applyAutoFill(quickInqId);
      } else {
        setFormData({
          pc_inqid: "", pc_sname: "", pc_veh: "", pc_date: new Date().toISOString().split('T')[0], pc_type: "Direct Purchase",
          pc_stat: "Confirmed", pc_pp: "", pc_rto: "", pc_price: "", pc_tok: "", payments: [],
          pc_newcar: "",
          pc_loan: "No", pc_lbank: "", pc_tokd: "", pc_dby: "Ritesh Shah", pc_mgr: "",
          pc_edd: "", pc_cncl: "", pc_rem: ""
        });
      }
    }
  }, [isOpen, editData, quickInqId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'pc_inqid' && value.length >= 3) {
      applyAutoFill(value);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => {
        const pp = Number(prev.pc_pp) || 0;
        const rto = Number(prev.pc_rto) || 0;
        if (pp > 0) {
          const expected = String(pp - rto);
          if (prev.pc_price !== expected) {
            return { ...prev, pc_price: expected };
          }
        }
        return prev;
      });
    }
  }, [formData.pc_pp, formData.pc_rto, isOpen]);

  const addPayment = () => {
    setFormData(prev => ({
      ...prev,
      payments: [...(prev.payments || []), { mode: 'CASH', amount: '', status: 'Pending', remarks: '', newCarDetails: '', date: new Date().toISOString().split('T')[0], payTo: prev.pc_sname || '' }]
    }));
  };

  const handlePaymentChange = (idx, field, val) => {
    setFormData(prev => {
      const pmts = [...(prev.payments || [])];
      
      if (field === 'amount') {
        const p = Number(prev.pc_price || 0);
        const t = Number(prev.pc_tok || 0);
        const others = pmts.reduce((s, pmt, i) => i !== idx ? s + Number(pmt.amount || 0) : s, 0);
        const max = p - t - others;
        if (Number(val) > max) {
          val = max > 0 ? String(max) : '';
        }
      }

      pmts[idx] = { ...pmts[idx], [field]: val };
      return { ...prev, payments: pmts };
    });
  };

  const removePayment = (index) => {
    const updated = (formData.payments || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, payments: updated }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editData && editData.id) {
        if (onSave) { await onSave(formData); } else { await updateRecord('pcl', editData.id, formData); }
      } else {
        const cnt = await getNextCounter('pcl');
        const pclId = genId('PCL', cnt);
        if (onSave) { await onSave({...formData, pclId}); } 
        else {
          await addRecord('pcl', { ...formData, pclId, date: formData.date || today() });
          if (onSuccess) await onSuccess();
        }
      }
      onClose();
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewVoucher = (idx) => {
    const pmt = formData.payments[idx] || {};
    const amt = pmt.amount ? Number(pmt.amount).toLocaleString('en-IN') + '/-' : '';
    let sname = formData.pc_sname || '';
    if (pmt.mode === 'NEW CAR') {
      sname = `Carecay Cars Pvt Ltd C/o, ${formData.pc_sname || ''}, ${pmt.newCarDetails || ''}`.trim().replace(/,\s*$/, "");
    } else if (formData.pc_loan === 'Yes') {
      sname = `${formData.pc_sname || ''} - ${formData.pc_lbank || ''}`;
    }
    const car = formData.pc_veh || '';
    const regNo = formData.pc_regn || '';
    const remarks = pmt.remarks || '';
    const status = pmt.status || 'Done';
    const payMode = pmt.mode || 'CASH';
    const price = Number(formData.pc_price || 0);
    const token = Number(formData.pc_tok || 0);
    const paidThroughThis = (formData.payments || []).slice(0, idx + 1).reduce((s, p) => s + Number(p.amount || 0), 0);
    const ledgerBal = (price - token - paidThroughThis).toLocaleString('en-IN') + '/-';

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
        <div>V.No. : <span class="v-line" style="width:120px; margin-bottom:2px;"></span></div>
        <div>Date : <span class="v-line" style="width:120px; margin-bottom:2px; font-weight: bold; padding-left: 5px;">${pmt.date ? pmt.date.split('-').reverse().join('/') : new Date().toLocaleDateString('en-GB')}</span></div>
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
    <span class="v-line" style="flex:1;">${pmt.payTo !== undefined ? pmt.payTo : formData.pc_sname || "______________________"}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Purpose :</span> 
    <span class="v-line" style="flex:1;">Used Car Purchase</span>
  </div>

  <div class="v-row">
    <span class="v-label">Client Name:</span> 
    <span class="v-line" style="flex:1;">Carecay Pvt. Ltd.</span>
  </div>

  <div class="v-row">
    <span class="v-label">Car :</span> 
    <span class="v-line" style="flex:1;">${car}</span>
    <span class="v-label" style="margin-left: 30px;">Reg No :</span> 
    <span class="v-line" style="flex:1;">${regNo}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Remarks :</span> 
    <span class="v-line" style="flex:1;">${remarks}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Payment Status :</span> 
    <span class="v-line" style="flex:1;">${status}</span>
    <span class="v-label" style="margin-left: 30px;">Ledger Bal :</span> 
    <span class="v-line" style="width: 250px;">${ledgerBal}</span>
  </div>

  <div class="v-pay-by">
    Pay by : ${payMode}
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
    
    const paymentNum = `Payment-${idx + 1}`;
    const safeInqId = (formData.pc_inqid || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '-');
    const safeRegNo = (formData.pc_regn || 'NO-REG').replace(/[^a-zA-Z0-9_-]/g, '-');
    const safeVeh = (formData.pc_veh || 'NO-VEHICLE').replace(/[^a-zA-Z0-9_ -]/g, '-');
    const safeSeller = (formData.pc_sname || 'NO-SELLER').replace(/[^a-zA-Z0-9_ -]/g, '-');
    const docTitle = `${paymentNum}-${safeInqId}-${safeRegNo}-${safeVeh}-${safeSeller}`.replace(/\s+/g, '-');

    const downloadOpts = { jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' } };
    printDocument(docTitle, htmlContent, customStyles, downloadOpts);
  };

  const price = Number(formData.pc_price || 0);
  const token = Number(formData.pc_tok || 0);
  const totalPaid = (formData.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  const balPending = price - token;
  const remBal = price - token - totalPaid;

  return (
    <div className="overlay on" id="m_pcl">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🤝</div>
          <h3>Purchase Closer</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          {autoFillMsg && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoFillMsg}
            </div>
          )}
          <div className="grid3">
            <div className="fg"><label>Inquiry ID <span style={{color:"var(--or1)",fontSize:"10px"}}>⚡ Auto-Fill</span></label><input name="pc_inqid" value={formData.pc_inqid} onChange={handleChange} placeholder="INQ-2025-0001" disabled={!!editData || !!quickInqId} /></div>
            <div className="fg"><label>Seller Name</label><input name="pc_sname" value={formData.pc_sname} onChange={handleChange} placeholder="Name" disabled={!!editData || !!quickInqId} /></div>
            <div className="fg"><label>Vehicle Details</label><input name="pc_veh" value={formData.pc_veh} onChange={handleChange} placeholder="Make Model Year" disabled={!!editData || !!quickInqId} /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Closer Date *</label><input type="date" name="pc_date" value={formData.pc_date} onChange={handleChange} disabled /></div>
          </div>
          <div className="sect-lbl" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa fa-indian-rupee-sign"></i> Price & Payment (Auto-Calc)
            {(() => {
              const pmts = formData.payments || [];
              const lastPmt = pmts.length > 0 ? pmts[pmts.length - 1] : null;
              const canAddPayment = !lastPmt || lastPmt.status === 'Done';
              return (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button type="button" onClick={addPayment} disabled={!canAddPayment} className="btn btn-out" style={{ padding: '2px 8px', fontSize: 12, height: 26, opacity: canAddPayment ? 1 : 0.5, cursor: canAddPayment ? 'pointer' : 'not-allowed' }} title={canAddPayment ? 'Add Payment' : 'Complete previous payment first'}>
                    <i className="fa fa-plus"></i> Add New Payment
                  </button>
                </div>
              );
            })()}
          </div>
          <div className="grid3">
            <div className="fg"><label>Purchase Price ₹</label><input type="number" name="pc_pp" value={formData.pc_pp} onChange={handleChange} placeholder="0" /></div>
            <div className="fg"><label>RTO Challan (Deduct) ₹</label><input type="number" name="pc_rto" value={formData.pc_rto} onChange={handleChange} placeholder="0" readOnly style={{ background: 'rgba(16,185,129,.08)' }} /></div>
            <div className="fg">
              <label>Final Agreed Price ₹</label>
              <input type="number" name="pc_price" value={formData.pc_price} onChange={handleChange} placeholder="0" readOnly style={{ background: 'rgba(16,185,129,.08)', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 700 }} />
            </div>
          </div>
          <div className="grid2" style={{ marginTop: 14 }}>
            <div className="fg"><label>Token Paid ₹</label><input type="number" name="pc_tok" value={formData.pc_tok} onChange={handleChange} placeholder="0" /></div>
            <div className="fg"><label>Remaining Balance ₹ (Auto)</label><div className="calc-out" style={{ color: remBal > 0 ? 'var(--warn)' : 'var(--success)' }}>₹ {remBal.toLocaleString('en-IN')}</div></div>
          </div>
          {(formData.payments || []).map((pmt, idx) => (
            <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: idx < (formData.payments.length - 1) ? '1px dashed var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: 'var(--or1)', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Payment {idx + 1} {pmt.status === 'Done' && <span style={{color:'var(--success)', marginLeft: 8}}><i className="fa fa-lock"></i> Locked</span>}</span>
                <button type="button" onClick={() => toggleHidePayment(idx)} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 4 }} title={hiddenPayments[idx] ? "Show" : "Hide"}>
                  <i className={`fa ${hiddenPayments[idx] ? 'fa-eye' : 'fa-eye-slash'}`}></i> {hiddenPayments[idx] ? 'Show' : 'Hide'}
                </button>
                {pmt.status !== 'Done' && <button type="button" onClick={() => removePayment(idx)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }} title="Remove">✕</button>}
              </div>
              {!hiddenPayments[idx] && (
                <>
                  <div className="grid4">
                <div className="fg">
                  <label>Mode</label>
                  <select value={pmt.mode} onChange={e => handlePaymentChange(idx, 'mode', e.target.value)} disabled={pmt.status === 'Done'}>
                    <option>CASH</option>
                    <option>CHEQUE</option>
                    <option>ONLINE</option>
                    <option value="NEW CAR">NEW CAR</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Amount ₹</label>
                  <input type="number" value={pmt.amount} onChange={e => handlePaymentChange(idx, 'amount', e.target.value)} placeholder="0" disabled={pmt.status === 'Done' && (formData.pc_loan !== 'Yes' || (editData?.payments?.[idx]?.amount))} />
                </div>
                <div className="fg">
                  <label>Payment Date</label>
                  <input type="date" value={pmt.date || ''} onChange={e => handlePaymentChange(idx, 'date', e.target.value)} disabled={pmt.status === 'Done'} />
                </div>
                <div className="fg">
                  <label>Pay To</label>
                  <input type="text" value={pmt.payTo !== undefined ? pmt.payTo : formData.pc_sname || ''} onChange={e => handlePaymentChange(idx, 'payTo', e.target.value)} placeholder="Payee Name" disabled={pmt.status === 'Done'} />
                </div>
              </div>
              {pmt.mode === 'NEW CAR' && (
                <div className="fg">
                  <label>New Car Make & Model</label>
                  <input type="text" value={pmt.newCarDetails || ''} onChange={e => handlePaymentChange(idx, 'newCarDetails', e.target.value)} placeholder="e.g. Hyundai Creta 2024" disabled={pmt.status === 'Done'} />
                </div>
              )}
              <div className="grid2">
                <div className="fg">
                  <label>Remarks</label>
                  <input type="text" value={pmt.remarks || ''} onChange={e => handlePaymentChange(idx, 'remarks', e.target.value)} placeholder="Remarks" disabled={pmt.status === 'Done'} />
                </div>
                <div className="fg">
                  <label>Status</label>
                  <select value={pmt.status || 'Done'} onChange={e => handlePaymentChange(idx, 'status', e.target.value)} disabled={pmt.status === 'Done'}>
                    <option>Done</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>
                  <div className="fg" style={{ marginTop: '10px' }}>
                    <button type="button" className="btn btn-out" style={{ width: '100%', color: 'var(--or1)', borderColor: 'var(--or1)', height: '40px', fontWeight: '700' }} onClick={() => handlePreviewVoucher(idx)} title="Preview Voucher">
                      <i className="fa fa-print"></i> Preview Voucher
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

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

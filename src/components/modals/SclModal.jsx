import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { autoFillFromSalInq, autoFillFromStockId, autoFillFromStock } from '../../utils/relations';
import { today, printDocument } from '../../utils/helpers';

export const SclModal = ({ isOpen, onClose, onSave, editData, quickInqId }) => {
  const { data: ctxData } = useData();
  const blank = {
    sc_inqid: '', sc_stkid: '', sc_bname: '', sc_mob: '',
    sc_make: '', sc_model: '', sc_regn: '', sc_year: '',
    sc_date: today(), sc_stat: 'Confirmed', sc_mrp: '', sc_disc: '',
    sc_price: '', sc_tok: '', payments: [],
    sc_tcp: '', sc_rem: '', sc_dby: 'Ritesh Shah',
  };

  const [formData, setFormData] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState('');
  const [hiddenPayments, setHiddenPayments] = useState({});
  const toggleHidePayment = (idx) => setHiddenPayments(prev => ({ ...prev, [idx]: !prev[idx] }));

  const lookupSalInq = async (id) => {
    if (!id) return null;
    const local = (ctxData?.sal_inq || []).find(r =>
      (r.salId || '').toLowerCase() === id.toLowerCase() ||
      (r.id || '').toLowerCase() === id.toLowerCase()
    );
    if (local) return local;
    return await autoFillFromSalInq(id);
  };

  const doFillFromSalInq = async (id) => {
    if (!id || id.length < 5) return;
    setFilling('inq');
    const d = await lookupSalInq(id);
    if (d) {
      const pref = (d.carPrefs && d.carPrefs[0]) || { make: d.makePref, model: d.model };
      setFormData(prev => ({
        ...prev,
        sc_bname: d.buyerName || prev.sc_bname,
        sc_mob: d.mobile || prev.sc_mob,
        sc_make: pref.make || prev.sc_make,
        sc_model: pref.model || prev.sc_model,
        sc_year: d.yearFrom || d.yearTo || prev.sc_year,
        sc_mrp: d.budget || prev.sc_mrp,
        sc_stkid: d.linkedStock || prev.sc_stkid,
      }));
      if (d.linkedStock) doFillFromStkId(d.linkedStock);
    }
    setFilling('');
  };

  const doFillFromStkId = async (id) => {
    if (!id || id.length < 5) return;
    setFilling('stk');
    const d = await autoFillFromStockId(id);
    if (d) {
      setFormData(prev => ({
        ...prev,
        sc_make: d.make || d.sk_make || prev.sc_make,
        sc_model: d.model || d.sk_model || prev.sc_model,
        sc_year: d.year || d.sk_year || prev.sc_year,
        sc_regn: d.regNo || d.sk_regn || prev.sc_regn,
        sc_mrp: d.sprice || d.sp || d.sk_sp || prev.sc_mrp,
        sc_tcp: d.tcp || (Number(d.sk_pp || d.pp || 0) + Number(d.sk_refurb || d.refurb || 0) + Number(d.sk_rto || d.rto || 0) + Number(d.sk_ins || d.ins || 0)) || prev.sc_tcp,
      }));
    }
    setFilling('');
  };

  const doFillFromRegNo = async (regNo) => {
    if (!regNo || regNo.length < 5) return;
    setFilling('reg');
    const d = await autoFillFromStock(regNo);
    if (d) {
      setFormData(prev => ({
        ...prev,
        sc_make: d.make || prev.sc_make,
        sc_model: d.model || prev.sc_model,
        sc_year: d.year || prev.sc_year,
        sc_stkid: d.stkId || prev.sc_stkid,
        sc_mrp: d.sprice || d.sp || d.tcp || prev.sc_mrp,
        sc_tcp: d.tcp || (Number(d.sk_pp || d.pp || 0) + Number(d.sk_refurb || d.refurb || 0) + Number(d.sk_rto || d.rto || 0) + Number(d.sk_ins || d.ins || 0)) || prev.sc_tcp,
      }));
    }
    setFilling('');
  };

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setFormData({ ...blank, ...editData });
    } else if (quickInqId) {
      setFormData({ ...blank, sc_inqid: quickInqId });
      doFillFromSalInq(quickInqId);
    } else {
      setFormData(blank);
    }
    setHiddenPayments({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData, quickInqId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'sc_inqid') doFillFromSalInq(value);
    if (name === 'sc_stkid') doFillFromStkId(value);
    if (name === 'sc_regn') doFillFromRegNo(value);
  };

  // Auto-calc Final Agreed Price = MRP - Discount
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => {
        const mrp = Number(prev.sc_mrp) || 0;
        const disc = Number(prev.sc_disc) || 0;
        if (mrp > 0) {
          const expected = String(mrp - disc);
          if (prev.sc_price !== expected) return { ...prev, sc_price: expected };
        }
        return prev;
      });
    }
  }, [formData.sc_mrp, formData.sc_disc, isOpen]);

  const addPayment = () => {
    setFormData(prev => ({
      ...prev,
      payments: [...(prev.payments || []), { mode: 'CASH', amount: '', status: 'Pending', remarks: '', newCarDetails: '', date: new Date().toISOString().split('T')[0], payTo: prev.sc_bname || '' }]
    }));
  };

  const handlePaymentChange = (idx, field, val) => {
    setFormData(prev => {
      const pmts = [...(prev.payments || [])];
      if (field === 'amount') {
        const p = Number(prev.sc_price || 0);
        const t = Number(prev.sc_tok || 0);
        const others = pmts.reduce((s, pmt, i) => i !== idx ? s + Number(pmt.amount || 0) : s, 0);
        const max = p - t - others;
        if (Number(val) > max) val = max > 0 ? String(max) : '';
      }
      pmts[idx] = { ...pmts[idx], [field]: val };
      return { ...prev, payments: pmts };
    });
  };

  const removePayment = (index) => {
    const updated = (formData.payments || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, payments: updated }));
  };

  const mrp = Number(formData.sc_mrp || 0);
  const disc = Number(formData.sc_disc || 0);
  const final = mrp - disc;
  const price = Number(formData.sc_price || 0);
  const token = Number(formData.sc_tok || 0);
  const totalPaid = (formData.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const remBal = price - token - totalPaid;
  const tcp = Number(formData.sc_tcp || 0);
  const profit = tcp > 0 ? final - tcp : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, final, total: price, profit };
      if (onSave) await onSave(payload);
      else onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewReceipt = (idx) => {
    const pmt = formData.payments[idx] || {};
    const amt = pmt.amount ? Number(pmt.amount).toLocaleString('en-IN') + '/-' : '';
    let bname = formData.sc_bname || '';
    if (pmt.mode === 'NEW CAR') {
      bname = `${formData.sc_bname || ''}, Trade-in: ${pmt.newCarDetails || ''}`.trim().replace(/,\s*$/, "");
    }
    const car = `${formData.sc_make || ''} ${formData.sc_model || ''}`.trim();
    const regNo = formData.sc_regn || '';
    const remarks = pmt.remarks || '';
    const status = pmt.status || 'Done';
    const payMode = pmt.mode || 'CASH';
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
  ⚠️ IMPORTANT: Ensure your print settings are set to "Paper Size: A4" and "Layout: Portrait". The receipt will print on the top half of the page.
</div>
<div class="voucher-container">
  <div class="v-header-grid">
    <div class="v-logo">
      <img src="/logo.png" alt="Carecay" />
    </div>
    <div class="v-top-right">
      <div class="v-title-box">Cash Receipt</div>
      <div class="v-row-right">
        <div>R.No. : <span class="v-line" style="width:120px; margin-bottom:2px;"></span></div>
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
    <span class="v-label">Received From :</span>
    <span class="v-line" style="flex:1;">${pmt.payTo !== undefined ? pmt.payTo : bname || "______________________"}</span>
  </div>

  <div class="v-row">
    <span class="v-label">Purpose :</span>
    <span class="v-line" style="flex:1;">Used Car Sale</span>
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
    Received By : ${payMode}
  </div>

  <table class="v-sign-table">
    <tr>
      <td style="width: 25%;">Authorised by :</td>
      <td style="width: 25%;">Executive :</td>
      <td style="width: 25%;">Officer :</td>
      <td style="width: 25%; padding:0;">
        <div style="position:absolute; bottom:4px; right:4px; font-size:10px; font-weight:normal;">Cashier Signature</div>
      </td>
    </tr>
  </table>

  <div class="v-footer">● FOR OFFICE INTERNAL USE ONLY ●</div>
</div>
`;

    const paymentNum = `Payment-${idx + 1}`;
    const safeInqId = (formData.sc_inqid || 'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g, '-');
    const safeRegNo = (formData.sc_regn || 'NO-REG').replace(/[^a-zA-Z0-9_-]/g, '-');
    const safeVeh = (car || 'NO-VEHICLE').replace(/[^a-zA-Z0-9_ -]/g, '-');
    const safeBuyer = (formData.sc_bname || 'NO-BUYER').replace(/[^a-zA-Z0-9_ -]/g, '-');
    const docTitle = `Receipt-${paymentNum}-${safeInqId}-${safeRegNo}-${safeVeh}-${safeBuyer}`.replace(/\s+/g, '-');

    const downloadOpts = { jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' } };
    printDocument(docTitle, htmlContent, customStyles, downloadOpts);
  };

  const Tag = ({ text }) => (
    <span style={{ color: 'var(--or1)', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>
      {filling ? '⏳' : '⚡'} {text}
    </span>
  );

  return (
    <div className="overlay on" id="m_scl">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🏆</div>
          <h3>Sales Closer</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="grid3">
            <div className="fg">
              <label>Sales Inquiry ID <Tag text="Auto-Fill Buyer" /></label>
              <input name="sc_inqid" value={formData.sc_inqid} onChange={handleChange} placeholder="SIN-2025-0001" disabled={!!editData || !!quickInqId} />
            </div>
            <div className="fg"><label>Buyer Name</label><input name="sc_bname" value={formData.sc_bname} onChange={handleChange} placeholder="Name" disabled={!!editData || !!quickInqId} /></div>
            <div className="fg"><label>Vehicle Details</label><input value={`${formData.sc_make || ''} ${formData.sc_model || ''} ${formData.sc_year || ''}`.trim()} readOnly placeholder="Make Model Year" style={{ background: 'rgba(0,0,0,0.05)' }} /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Close Date *</label><input type="date" name="sc_date" value={formData.sc_date} onChange={handleChange} disabled /></div>
            <div className="fg">
              <label>Stock ID <span style={{ color: '#059669', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{filling === 'stk' ? '⏳' : '⚡'} Auto-Fill Vehicle</span></label>
              <input name="sc_stkid" value={formData.sc_stkid} onChange={handleChange} placeholder="STK-2025-0001" />
            </div>
            <div className="fg">
              <label>Reg No. <span style={{ color: '#059669', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{filling === 'reg' ? '⏳' : '⚡'} Auto-Fill from Stock</span></label>
              <input name="sc_regn" value={formData.sc_regn} onChange={handleChange} placeholder="GJ-01-AB-1234" />
            </div>
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
            <div className="fg"><label>MRP / Listed Price ₹</label><input type="number" name="sc_mrp" value={formData.sc_mrp} onChange={handleChange} placeholder="0" /></div>
            <div className="fg"><label>Discount ₹</label><input type="number" name="sc_disc" value={formData.sc_disc} onChange={handleChange} placeholder="0" /></div>
            <div className="fg">
              <label>Final Agreed Price ₹</label>
              <input type="number" value={formData.sc_price} readOnly placeholder="0" style={{ background: 'rgba(16,185,129,.08)', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 700 }} />
            </div>
          </div>
          <div className="grid2" style={{ marginTop: 14 }}>
            <div className="fg"><label>Token Paid ₹</label><input type="number" name="sc_tok" value={formData.sc_tok} onChange={handleChange} placeholder="0" /></div>
            <div className="fg"><label>Remaining Balance ₹ (Auto)</label><div className="calc-out" style={{ color: remBal > 0 ? 'var(--warn)' : 'var(--success)' }}>₹ {remBal.toLocaleString('en-IN')}</div></div>
          </div>

          {/* Profit Preview */}
          {tcp > 0 && (
            <div style={{ background: profit >= 0 ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${profit >= 0 ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`, borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text3)', marginBottom: 4 }}>💰 Estimated Profit</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Sale Price ₹{final.toLocaleString('en-IN')} − TCP ₹{tcp.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN')}
              </div>
            </div>
          )}

          {(formData.payments || []).map((pmt, idx) => (
            <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: idx < (formData.payments.length - 1) ? '1px dashed var(--border)' : 'none', marginTop: 12 }}>
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
                        <option value="NEW CAR">TRADE-IN</option>
                      </select>
                    </div>
                    <div className="fg">
                      <label>Amount ₹</label>
                      <input type="number" value={pmt.amount} onChange={e => handlePaymentChange(idx, 'amount', e.target.value)} placeholder="0" disabled={pmt.status === 'Done'} />
                    </div>
                    <div className="fg">
                      <label>Payment Date</label>
                      <input type="date" value={pmt.date || ''} onChange={e => handlePaymentChange(idx, 'date', e.target.value)} disabled={pmt.status === 'Done'} />
                    </div>
                    <div className="fg">
                      <label>Received From</label>
                      <input type="text" value={pmt.payTo !== undefined ? pmt.payTo : formData.sc_bname || ''} onChange={e => handlePaymentChange(idx, 'payTo', e.target.value)} placeholder="Payer Name" disabled={pmt.status === 'Done'} />
                    </div>
                  </div>
                  {pmt.mode === 'NEW CAR' && (
                    <div className="fg">
                      <label>Trade-In Vehicle Make & Model</label>
                      <input type="text" value={pmt.newCarDetails || ''} onChange={e => handlePaymentChange(idx, 'newCarDetails', e.target.value)} placeholder="e.g. Hyundai i10 2018" disabled={pmt.status === 'Done'} />
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
                    <button type="button" className="btn btn-out" style={{ width: '100%', color: 'var(--or1)', borderColor: 'var(--or1)', height: '40px', fontWeight: '700' }} onClick={() => handlePreviewReceipt(idx)} title="Preview Receipt">
                      <i className="fa fa-print"></i> Preview Receipt
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="grid1" style={{ marginTop: 10 }}><div className="fg"><label>Remarks</label><input name="sc_rem" value={formData.sc_rem} onChange={handleChange} placeholder="Notes" /></div></div>
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

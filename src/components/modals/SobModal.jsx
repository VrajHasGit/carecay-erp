import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { today, printDocument } from '../../utils/helpers';

const YEAR_OPTS = Array.from({ length: 26 }, (_, i) => 2025 - i);

function fmt(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_NAMES_GUJ = ['રવિવાર','સોમવાર','મંગળવાર','બુધવાર','ગુરૂવાર','શુક્રવાર','શનિવાર'];

function getDayName(iso, guj = false) {
  if (!iso) return '';
  const d = new Date(iso);
  return (guj ? DAY_NAMES_GUJ : DAY_NAMES)[d.getDay()];
}

function fmtDateDN(iso) {
  if (!iso) return '';
  const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}-${MON_SHORT[d.getMonth()]}-${d.getFullYear()}`;
}

function numToWords(n) {
  const num = Math.round(Number(n));
  if (!n || isNaN(num) || num === 0) return '';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function conv(x) {
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x/10)] + (x%10 ? ' '+ones[x%10] : '');
    return ones[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' '+conv(x%100) : '');
  }
  let r = '', x = num;
  if (x >= 10000000) { r += conv(Math.floor(x/10000000)) + ' Crore '; x %= 10000000; }
  if (x >= 100000)   { r += conv(Math.floor(x/100000))   + ' Lakh ';  x %= 100000; }
  if (x >= 1000)     { r += conv(Math.floor(x/1000))     + ' Thousand '; x %= 1000; }
  if (x > 0)           r += conv(x);
  return r.trim() + ' Only';
}

function u(val, minWidth = '80px') {
  return val
    ? `<u style="min-width:${minWidth};text-align:center;display:inline-block;font-weight:bold">${val}</u>`
    : `<u style="min-width:${minWidth};display:inline-block">&nbsp;</u>`;
}

export const SobModal = ({ isOpen, onClose, onSave, onSuccess, editData, quickSclId }) => {
  const { data } = useData();

  const emptyForm = {
    sob_sclid: '', sob_sinid: '', sob_stkid: '', sob_date: today(),
    sob_cname: '', sob_cont: '', sob_email: '', sob_addr: '', sob_branch: 'SG Highway',
    sob_mm: '', sob_color: 'White', sob_fuel: 'Petrol',
    sob_chas: '', sob_eng: '', sob_regn: '', sob_year: '', sob_own: '1st Owner', sob_km: '',
    sob_instype: 'Comprehensive', sob_insname: '', sob_insval: '',
    sob_exec: 'Ritesh Shah', sob_partner: '', sob_support: '',
    sob_saleprice: '', sob_rto: '',
    sob_tsc: '', sob_ins_amt: '', sob_ext_war: '', sob_oth_exp: '',
    sob_brkname: '', sob_brkno: '', sob_brkamt: '',
    sob_token: '', sob_clrdate: '',
    sob_rem: '',
    sob_doc_stat: 'Pending',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [autoFillMsg, setAutoFillMsg] = useState('');

  // Auto-fill from Stock
  const autoFillFromStkId = useCallback((stkId) => {
    if (!stkId || !data?.stk) return;
    const stk = (data.stk || []).find(r =>
      (r.stkId || r.id || '').toLowerCase() === stkId.toLowerCase()
    );
    if (stk) {
      const ownMap = { '1st': '1st Owner', '2nd': '2nd Owner', '3rd': '3rd Owner', '4th': '4th+ Owner', '4th+': '4th+ Owner' };
      const rawOwn = stk.owners || stk.sk_own || stk.own || '';
      const mappedOwn = ownMap[rawOwn] || rawOwn;
      setFormData(prev => ({
        ...prev,
        sob_stkid: stkId,
        sob_mm: [stk.make || stk.sk_make, stk.model || stk.sk_model].filter(Boolean).join(' ') || prev.sob_mm,
        sob_color: stk.color || stk.sk_color || prev.sob_color,
        sob_fuel: stk.fuel || stk.sk_fuel || prev.sob_fuel,
        sob_chas: stk.sk_chas || stk.chassis || prev.sob_chas,
        sob_eng: stk.sk_eng || stk.engine || prev.sob_eng,
        sob_regn: stk.regNo || stk.sk_regn || prev.sob_regn,
        sob_year: stk.year || stk.sk_year || prev.sob_year,
        sob_km: stk.km || stk.sk_km || prev.sob_km,
        sob_own: mappedOwn || prev.sob_own,
        sob_insval: stk.sk_insval || stk.insval || stk.insVal || prev.sob_insval,
        sob_saleprice: prev.sob_saleprice || stk.sprice || stk.sp || stk.sk_sp,
        sob_partner: prev.sob_partner || stk.partner || stk.sk_partner || stk.ob_pname || stk.pc_pname,
        sob_oth_exp: (Number(stk.refurb) || 0) + (Number(stk.rto) || 0) + (Number(stk.ins) || 0) || prev.sob_oth_exp,
      }));
    }
  }, [data]);

  // Auto-fill from Sales Inquiry
  const autoFillFromSinId = useCallback((inqId) => {
    if (!inqId || !data?.sal_inq) return;
    const inq = (data.sal_inq || []).find(r =>
      (r.salId || r.id || '').toLowerCase() === inqId.toLowerCase()
    );
    if (inq) {
      let dealStkId = inq.linkedStock;
      let dealPriceFromSfu = null;
      const sfuRec = (data?.sfu || []).find(s => (s.sf_inqid || '').toLowerCase() === inqId.toLowerCase() || (s.id || '').toLowerCase() === inqId.toLowerCase());
      if (sfuRec && sfuRec.followUps) {
         const closedFu = sfuRec.followUps.find(f => f.stat === 'Closed-Won');
         if (closedFu) {
            if (closedFu.dealPrice) dealPriceFromSfu = closedFu.dealPrice;
            // fetchedCarDetails.stkId is the most reliable source (set when user picks from dropdown)
            const fetched = closedFu.fetchedCarDetails;
            if (fetched?.stkId && fetched.stkId !== 'N/A') {
              dealStkId = fetched.stkId;
            } else if (closedFu.finalRegn) {
              const norm = s => (s || '').replace(/[\s-]/g, '').toLowerCase();
              const stk = (data.stk || []).find(s =>
                norm(s.regNo || s.sk_regn) === norm(closedFu.finalRegn) ||
                norm(s.stkId || s.id) === norm(closedFu.finalRegn)
              );
              if (stk) dealStkId = stk.stkId || stk.id;
            }
         }
      }

      const pref = (inq.carPrefs && inq.carPrefs[0]) || { make: inq.makePref, model: inq.model };
      setFormData(prev => ({
        ...prev,
        sob_sinid: inqId,
        sob_cname: inq.buyerName || prev.sob_cname,
        sob_cont: inq.mobile || prev.sob_cont,
        sob_email: inq.email || prev.sob_email,
        sob_addr: inq.address || prev.sob_addr,
        sob_branch: inq.branch || prev.sob_branch,
        sob_mm: [pref.make, pref.model].filter(Boolean).join(' ') || prev.sob_mm,
        sob_exec: inq.assigned || prev.sob_exec,
        sob_partner: inq.nameSource || prev.sob_partner,
        ...(dealPriceFromSfu ? { sob_saleprice: dealPriceFromSfu } : {}),
      }));
      if (dealStkId) setTimeout(() => autoFillFromStkId(dealStkId), 100);
      setAutoFillMsg(`✅ Auto-filled from Inquiry: ${inq.buyerName || inqId}`);
      setTimeout(() => setAutoFillMsg(''), 3000);
    }
  }, [data, autoFillFromStkId]);

  // Auto-fill from Sales Closer
  const autoFillFromSclId = useCallback((sclId) => {
    if (!sclId || !data?.scl) return;
    const scl = (data.scl || []).find(r =>
      (r.sclId || r.id || '').toLowerCase() === sclId.toLowerCase()
    );
    if (scl) {
      setFormData(prev => ({
        ...prev,
        sob_sclid: sclId,
        sob_sinid: scl.sc_inqid || prev.sob_sinid,
        sob_stkid: scl.sc_stkid || prev.sob_stkid,
        sob_cname: scl.sc_bname || prev.sob_cname,
        sob_cont: scl.sc_mob || prev.sob_cont,
        sob_mm: [scl.sc_make, scl.sc_model].filter(Boolean).join(' ') || prev.sob_mm,
        sob_regn: scl.sc_regn || prev.sob_regn,
        sob_year: scl.sc_year || prev.sob_year,
        sob_saleprice: scl.final || scl.sc_mrp || prev.sob_saleprice,
      }));
      const linkedInqId = scl.sc_inqid || '';
      if (linkedInqId) setTimeout(() => autoFillFromSinId(linkedInqId), 100);
      else if (scl.sc_stkid) setTimeout(() => autoFillFromStkId(scl.sc_stkid), 100);
      setAutoFillMsg(`✅ Auto-filled from Closer: ${scl.sc_bname || sclId}`);
      setTimeout(() => setAutoFillMsg(''), 3000);
    }
  }, [data, autoFillFromSinId, autoFillFromStkId]);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({ ...emptyForm, ...editData });
        if (editData.sob_sinid) setTimeout(() => autoFillFromSinId(editData.sob_sinid), 100);
      } else if (quickSclId) {
        autoFillFromSclId(quickSclId);
      } else {
        setFormData({ ...emptyForm, sob_date: today() });
      }
      setAutoFillMsg('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData, quickSclId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSclIdBlur = () => { if (formData.sob_sclid) autoFillFromSclId(formData.sob_sclid); };
  const handleSinIdBlur = () => { if (formData.sob_sinid) autoFillFromSinId(formData.sob_sinid); };
  const handleStkIdBlur = () => { if (formData.sob_stkid) autoFillFromStkId(formData.sob_stkid); };

  // Sale Price + additions
  const calcTotal = () => {
    const sp = Number(formData.sob_saleprice) || 0;
    const rto = Number(formData.sob_rto) || 0;
    const tsc = Number(formData.sob_tsc) || 0;
    const insAmt = Number(formData.sob_ins_amt) || 0;
    const extWar = Number(formData.sob_ext_war) || 0;
    const othExp = Number(formData.sob_oth_exp) || 0;
    return sp + rto + tsc + insAmt + extWar + othExp;
  };

  const handlePrintOrderBooking = () => {
    const total = calcTotal();

    const customStyles = `
      .pf-wrap { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #111; font-size: 11px; line-height: 1.3; }
      .pf-header { text-align: center; border-bottom: 2px solid #1a2542; padding-bottom: 6px; margin-bottom: 10px; }
      .pf-title { font-size: 20px; font-weight: 800; color: #1a2542; letter-spacing: 1px; margin: 0; }
      .pf-subtitle { font-size: 11px; font-weight: 600; color: #555; margin-top: 2px; text-transform: uppercase; letter-spacing: 2px; }
      .pf-meta { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; border-bottom: 1px solid #eaeaea; padding-bottom: 6px; }
      .pf-meta-item { display: flex; flex-direction: column; }
      .pf-meta-lbl { font-weight: 600; color: #666; text-transform: uppercase; font-size: 9px; }
      .pf-meta-val { font-weight: bold; font-size: 13px; }
      .pf-section { margin-bottom: 10px; }
      .pf-section-title { font-size: 12px; font-weight: bold; color: #1a2542; text-transform: uppercase; border-bottom: 1px solid #1a2542; padding-bottom: 2px; margin-bottom: 6px; }
      .pf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; }
      .pf-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 12px; }
      .pf-field { display: flex; flex-direction: column; }
      .pf-lbl { font-size: 9px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 1px; }
      .pf-val { font-size: 11px; font-weight: 500; border-bottom: 1px dashed #ccc; padding-bottom: 0px; min-height: 15px; }
      .pf-totals { background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 6px; }
      .pf-totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
      .pf-totals-row.grand { font-size: 14px; font-weight: bold; color: #1a2542; border-top: 2px solid #e2e8f0; padding-top: 6px; margin-top: 6px; }
      .pf-signs { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eaeaea; }
      .pf-sign-box { text-align: center; width: 40%; }
      .pf-sign-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 6px; }
      .pf-sign-lbl { font-weight: bold; font-size: 10px; text-transform: uppercase; }
      @media print {
        @page { size: A4; margin: 8mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .pf-totals { background: #f8fafc !important; }
      }
    `;

    const htmlContent = `
      <div class="pf-wrap">
        <div class="pf-header">
          <h1 class="pf-title">CARECAY PRIVATE LIMITED</h1>
          <div class="pf-subtitle">USED CAR SALES BOOKING FORM</div>
        </div>

        <div class="pf-meta">
          <div class="pf-meta-item">
            <span class="pf-meta-lbl">Document No.</span>
            <span class="pf-meta-val">${formData.sobId || 'DRAFT'}</span>
          </div>
          <div class="pf-meta-item">
            <span class="pf-meta-lbl">Date</span>
            <span class="pf-meta-val">${formData.sob_date || ''}</span>
          </div>
          <div class="pf-meta-item">
            <span class="pf-meta-lbl">Branch</span>
            <span class="pf-meta-val">${formData.sob_branch || 'SG Highway'}</span>
          </div>
        </div>

        <div class="pf-section">
          <div class="pf-section-title">Client Details</div>
          <div class="pf-grid-3">
            <div class="pf-field" style="grid-column: span 2;">
              <span class="pf-lbl">Client Name</span>
              <span class="pf-val">${formData.sob_cname || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Contact No.</span>
              <span class="pf-val">${formData.sob_cont || ''}</span>
            </div>
            <div class="pf-field" style="grid-column: span 3;">
              <span class="pf-lbl">Client Address</span>
              <span class="pf-val">${formData.sob_addr || ''}</span>
            </div>
          </div>
        </div>

        <div class="pf-section">
          <div class="pf-section-title">Car Details</div>
          <div class="pf-grid">
            <div class="pf-field">
              <span class="pf-lbl">Model & Maker's Name</span>
              <span class="pf-val">${formData.sob_mm || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Registration No.</span>
              <span class="pf-val">${formData.sob_regn || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Color</span>
              <span class="pf-val">${formData.sob_color || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Manufacturing Year</span>
              <span class="pf-val">${formData.sob_year || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Fuel Type</span>
              <span class="pf-val">${formData.sob_fuel || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Ownership Type</span>
              <span class="pf-val">${formData.sob_own || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Chassis No.</span>
              <span class="pf-val">${formData.sob_chas || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Engine No.</span>
              <span class="pf-val">${formData.sob_eng || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Mileage (KM)</span>
              <span class="pf-val">${formData.sob_km || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Partner Name</span>
              <span class="pf-val">${formData.sob_partner || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Insurance Company</span>
              <span class="pf-val">${formData.sob_insname || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Insurance Type & Validity</span>
              <span class="pf-val">${formData.sob_instype || ''} ${formData.sob_insval ? '— Valid till ' + formData.sob_insval : ''}</span>
            </div>
          </div>
        </div>

        <div class="pf-section">
          <div class="pf-section-title">Personnel</div>
          <div class="pf-grid">
            <div class="pf-field">
              <span class="pf-lbl">Sales Executive</span>
              <span class="pf-val">${formData.sob_exec || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Support Partner</span>
              <span class="pf-val">${formData.sob_support || ''}</span>
            </div>
            <div class="pf-field">
              <span class="pf-lbl">Broker Name & No.</span>
              <span class="pf-val">${formData.sob_brkname || 'NA'} ${formData.sob_brkno ? '— ' + formData.sob_brkno : ''}</span>
            </div>
          </div>
        </div>

        <div class="pf-section">
          <div class="pf-section-title">Deal Summary</div>
          <div class="pf-totals">
            <div class="pf-totals-row">
              <span>Sale Price</span>
              <span>₹${Number(formData.sob_saleprice || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="pf-totals-row">
              <span>RTO Charge</span>
              <span>+ ${formData.sob_rto || '0'}</span>
            </div>
            <div class="pf-totals-row grand">
              <span>TOTAL AMOUNT</span>
              <span>₹${total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div class="pf-section">
          <div class="pf-section-title">Remarks</div>
          <div class="pf-val" style="min-height: 40px; border-bottom: none;">${formData.sob_rem || ''}</div>
        </div>

        <div class="pf-signs">
          <div class="pf-sign-box">
            <div class="pf-sign-line"></div>
            <div class="pf-sign-lbl">Client Signature</div>
          </div>
          <div class="pf-sign-box">
            <div class="pf-sign-line"></div>
            <div class="pf-sign-lbl">Sales HOD Signature</div>
          </div>
        </div>
      </div>
    `;

    const title = formData.sobId || formData.sob_sclid || formData.sob_sinid || 'SOB-Draft';
    printDocument(title, htmlContent, customStyles);
  };

  const dnStyles = `
      .dn-wrap { font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; color: #000; font-size: 11px; }
      .dn-head { text-align: center; margin-bottom: 8px; position: relative; display: flex; align-items: center; justify-content: center; min-height: 55px; }
      .dn-logo { position: absolute; left: 0; top: 0; height: 55px; object-fit: contain; }
      .dn-head-title { background: #333; color: #fff; padding: 4px 20px; border-radius: 30px; display: inline-block; font-size: 14px; font-weight: bold; }
      .dn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .dn-box { border: 2px solid #333; border-radius: 4px; position: relative; padding-top: 10px; }
      .dn-box-title { background: #333; color: #fff; text-align: center; font-weight: bold; padding: 2px 10px; border-radius: 20px; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 11px; }
      .dn-field { display: flex; border-top: 2px solid #333; }
      .dn-lbl { padding: 3px 6px; font-weight: bold; white-space: nowrap; font-size: 10px; }
      .dn-val { padding: 3px 6px; flex-grow: 1; font-weight: bold; font-size: 10px; }
      .dn-box-content { padding: 8px 8px 4px 8px; min-height: 40px; text-align:center; font-weight:bold; font-size: 12px; line-height: 1.3; }
      .dn-text { line-height: 1.4; text-align: justify; margin-bottom: 10px; font-size: 12px; }
      .dn-text u { border-bottom: 1px dotted #000; text-decoration: none; font-weight: bold; padding: 0 10px; display:inline-block; min-width: 50px; text-align:center; }
      .dn-terms { margin-top: 5px; }
      .dn-terms ul { padding-left: 20px; margin-top: 3px; line-height: 1.3; font-size: 11px; }
      .dn-terms li { margin-bottom: 3px; text-align: justify; }
      .dn-signs { display: flex; justify-content: space-between; margin-top: 30px; }
      .dn-sign-block { width: 45%; font-size: 11px; }
      .dn-sign-line { border-bottom: 1px dotted #000; display: inline-block; width: 60%; margin-left: 10px; }
      @media print {
        @page { size: A4; margin: 8mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0 !important; }
        .dn-head-title, .dn-box-title { background: #333 !important; color: #fff !important; }
      }
  `;

  const handlePrintDeliveryNote = () => {
    const htmlContent = `
      <div class="dn-wrap">
        <div class="dn-head">
          <img src="/logo.png" class="dn-logo" alt="Carecay Logo" />
          <div class="dn-head-title">વેચાણ ખત અને ડીલીવરી નોટ</div>
        </div>

        <div class="dn-grid">
          <div style="border: 2px solid #333; display: flex;">
            <div class="dn-lbl">ગાડી નંબર:</div>
            <div class="dn-val">${formData.sob_regn || ''}</div>
          </div>
          <div style="border: 2px solid #333; display: flex;">
            <div class="dn-lbl">તારીખ :</div>
            <div class="dn-val">${fmtDateDN(formData.sob_date)}</div>
            <div class="dn-lbl" style="border-left: 2px solid #333">વાર:</div>
            <div class="dn-val">${getDayName(formData.sob_date, true)}</div>
          </div>
        </div>

        <div class="dn-grid">
          <div class="dn-box">
            <div class="dn-box-title">વાહન વેચાણ આપનાર</div>
            <div class="dn-box-content">
              CARECAY PVT. LTD<br/>
              Mumatpura Road, Off. S. G. Highway,<br/>
              Nr. Cafe De Italiano,<br/>
              Ahmedabad-(380058)
            </div>
            <div class="dn-field">
              <div class="dn-lbl">મો. નંબર :</div>
              <div class="dn-val" style="border-left: 2px solid #333">94 84 88 22 22</div>
            </div>
          </div>

          <div class="dn-box">
            <div class="dn-box-title">વાહન ખરીદ લેનાર</div>
            <div class="dn-box-content" style="text-align:left; font-size:14px">
              ${formData.sob_cname || ''}<br/>
              ${formData.sob_addr || ''}
            </div>
            <div class="dn-field">
              <div class="dn-lbl">મો. નંબર :</div>
              <div class="dn-val" style="border-left: 2px solid #333">${formData.sob_cont || ''}</div>
            </div>
          </div>
        </div>

        <div class="dn-text">
          અમો CARECAY PVT. LTD અમારી માલિકી અને હક્ક ભોગવટાનું વાહન જેનો આર.ટી.ઓ. રજીસ્ટ્રેશન નંબર ${u(formData.sob_regn,'120px')} છે
          અને તેનું મોડલ ${u(formData.sob_mm,'140px')} ગાડીનો પ્રકાર ${u(formData.sob_fuel,'60px')} એન્જિન નં ${u(formData.sob_eng,'120px')}
          તથા ચેસીસ નં ${u(formData.sob_chas,'120px')} છે.
          તે વાહન આજરોજ રૂા. ${u(formData.sob_saleprice,'100px')} દલાલી રૂા. ${u(formData.sob_brkamt,'80px')}
          ટેક્સ રૂા. ${u('','60px')} તથા ટ્રાન્સફરનો/ડ્યુના રૂા ${u(formData.sob_rto,'80px')} મળી ટોટલ રૂા ${u(calcTotal(),'100px')}
          અંકે રૂા ${u(numToWords(calcTotal()),'220px')} માં ઉપર જણાવેલ પાર્ટીને વેચાણ
          આપેલ છે. તેના બાના પેટે રૂા. ${u(formData.sob_token,'100px')} અંકે રૂા. ${u(numToWords(formData.sob_token),'200px')}
          રોકડા/ચેક મળેલ છે બાકી નીકળતા રૂા ${u(calcTotal() && formData.sob_token ? calcTotal() - Number(formData.sob_token) : '','100px')} મોડામાં મોડા
          તા ${u(fmtDateDN(formData.sob_clrdate),'100px')} સુધીમાં ચૂકતે હિસાબે કરવાના રહેશે.
          ગાડીના ખરીદ-વેચાણ પેટે નીચે લખેલ શરતો અ મને બંને પાર્ટીએ વાંચેલ છે. અને બંધન કર્તા રહેશે તે જાણીને અમે સહી કરેલ છે.
        </div>

        <div class="dn-head" style="margin-top: 30px;">
          <div class="dn-head-title" style="padding:4px 20px; font-size:16px;">શરતો - નિયમો</div>
        </div>
        <div class="dn-terms">
          <ul>
            <li>સદર સોદો અમો બંને પાર્ટીએ રાજીખુશીથી સમજી વિચારી અક્કલ, હોશિયારીથી, બીનકેફીપણામાંથી કોઈનના ધાક ધમકી કે દબાણ વગર કર્યો છે.</li>
            <li>સદર વાહનનો આજરોજ પહેલાનું કોઈ પણ પ્રકારનું આર.ટી.ઓ. ટેક્સ મેમો કે કોઇપણ પ્રકારનો બેન્ક કે પેઢીનું દેવું નીકળશે કે કોઈપણ પ્રકારનો પોલીસ કેસ કે સંબંધિત તમામ જવાબદારી તા. ........................................ સુધી તથા તમામ જવાબદારી વાહન વેચનાર (CARECAY PVT. LTD) ની રહેશે અને ત્યારબાદ તા........................................ થી તમામ જવાબદારી ખરીદનારની રહેશે.</li>
            <li>સદર વાહન ખરીદનારે પોતાની રીતે જોઈ, તપાસી, રોડ ટેસ્ટ લઈ ચકાસણી કરી ખરીદ કરેલ છે. તેથી પાછળથી કોઈ પણ પ્રકારની ફરિયાદ સાંભળવામાં આવશે નહીં.</li>
            <li>સરદાર વાહનનો સોદો કોઈપણ સંજોગોમાં કેન્સલ થશે નહીં અને જો સોદો કેન્સલ થશે તો બાનાની આપેલી રકમ પરત મળશે નહીં તેવું બરાબર જાણીએ છીએ.</li>
            <li>સદર વાહનો કબજો આજ રોજ એટલે કે તા. <strong>${fmtDateDN(formData.sob_date)}</strong> (${getDayName(formData.sob_date, true)}) અને સમય........................................થી લેનાર પાર્ટીએ લીધેલ છે. જેથી અત્યાર પછી આ વાહન ચોરી, આગ, અકસ્માત કે ગુનાહિત કાર્યમાં ફરશે તો તેની જવાબદારી ખરીદ લેનાર પાર્ટીની રહેશે. ગાડીનો ઇન્સ્યોરન્સ ટ્રાન્સફરની અથવા નવો લેવાની તમામ જવાબદારી ખરીદનાર પાર્ટીની રહેશે. તથા ગાડીના ટ્રાન્સફર માટેનો થતો ટેક્સ ખરીદનાર પાર્ટીએ અલગથી આપવાનો રહેશે.</li>
            <li>ગાડીના કિલોમીટરની કોઈ પણ જવાબદારી આપવામાં આવતી નથી કાયદાકીય ક્ષેત્ર અમદાવાદ/........................................ રહેશે.</li>
          </ul>
        </div>

        <div class="dn-signs">
          <div class="dn-sign-block">
            <div style="margin-bottom: 30px;">વાહન વેચનારની સહી (CARECAY) <span class="dn-sign-line"></span></div>
            <div>સાક્ષીની સહી <span class="dn-sign-line"></span></div>
          </div>
          <div class="dn-sign-block">
            <div style="margin-bottom: 30px;">વાહન લેનારની સહી <span class="dn-sign-line"></span></div>
            <div>સાક્ષીની સહી <span class="dn-sign-line"></span></div>
          </div>
        </div>

      </div>
    `;

    const title = 'DN-' + (formData.sobId || formData.sob_sclid || formData.sob_sinid || 'Draft');
    printDocument(title, htmlContent, dnStyles, null, true);
  };

  const handlePrintDeliveryNoteEnglish = () => {
    const htmlContent = `
      <div class="dn-wrap">
        <div class="dn-head">
          <img src="/logo.png" class="dn-logo" alt="Carecay Logo" />
          <div class="dn-head-title">SALE DEED AND DELIVERY NOTE</div>
        </div>

        <div class="dn-grid">
          <div style="border: 2px solid #333; display: flex;">
            <div class="dn-lbl">Vehicle No:</div>
            <div class="dn-val">${formData.sob_regn || ''}</div>
          </div>
          <div style="border: 2px solid #333; display: flex;">
            <div class="dn-lbl">Date :</div>
            <div class="dn-val">${fmtDateDN(formData.sob_date)}</div>
            <div class="dn-lbl" style="border-left: 2px solid #333">Day:</div>
            <div class="dn-val">${getDayName(formData.sob_date)}</div>
          </div>
        </div>

        <div class="dn-grid">
          <div class="dn-box">
            <div class="dn-box-title">Vehicle Seller</div>
            <div class="dn-box-content">
              CARECAY PVT. LTD<br/>
              Mumatpura Road, Off. S. G. Highway,<br/>
              Nr. Cafe De Italiano,<br/>
              Ahmedabad-(380058)
            </div>
            <div class="dn-field">
              <div class="dn-lbl">Mobile No :</div>
              <div class="dn-val" style="border-left: 2px solid #333">94 84 88 22 22</div>
            </div>
          </div>

          <div class="dn-box">
            <div class="dn-box-title">Vehicle Buyer</div>
            <div class="dn-box-content" style="text-align:left; font-size:14px">
              ${formData.sob_cname || ''}<br/>
              ${formData.sob_addr || ''}
            </div>
            <div class="dn-field">
              <div class="dn-lbl">Mobile No :</div>
              <div class="dn-val" style="border-left: 2px solid #333">${formData.sob_cont || ''}</div>
            </div>
          </div>
        </div>

        <div class="dn-text">
          We, CARECAY PVT. LTD, have sold our fully owned vehicle with RTO Registration No ${u(formData.sob_regn,'120px')}
          and Model ${u(formData.sob_mm,'140px')}, Fuel Type ${u(formData.sob_fuel,'60px')}, Engine No ${u(formData.sob_eng,'120px')}
          and Chassis No ${u(formData.sob_chas,'120px')}.
          The vehicle is sold today for Rs. ${u(formData.sob_saleprice,'100px')}, Brokerage Rs. ${u(formData.sob_brkamt,'80px')},
          Tax Rs. ${u('','60px')} and Transfer dues Rs. ${u(formData.sob_rto,'80px')} making a total of Rs. ${u(calcTotal(),'100px')}
          (in words Rs. ${u(numToWords(calcTotal()),'220px')}) to the above mentioned party.
          As token amount Rs. ${u(formData.sob_token,'100px')} (in words Rs. ${u(numToWords(formData.sob_token),'200px')})
          has been received in Cash/Cheque. The pending balance of Rs. ${u(calcTotal() && formData.sob_token ? calcTotal() - Number(formData.sob_token) : '','100px')} will be paid and cleared
          by Date ${u(fmtDateDN(formData.sob_clrdate),'100px')} at the latest.
          Both parties have read and agreed to the terms and conditions written below for the sale of the car and have signed with full understanding.
        </div>

        <div class="dn-head" style="margin-top: 30px;">
          <div class="dn-head-title" style="padding:4px 20px; font-size:16px;">Terms and Conditions</div>
        </div>
        <div class="dn-terms">
          <ul>
            <li>This deal has been made by both parties willfully, with full understanding, in sound mind, without intoxication, and without any fear, threat, or pressure from anyone.</li>
            <li>Any R.T.O. tax memo, bank or financial institution loan/dues, or police case related to this vehicle prior to today will remain the total responsibility of the Seller (CARECAY PVT. LTD) until Date ........................................ and after Date ........................................ the entire responsibility will lie with the Buyer.</li>
            <li>The Buyer has personally checked, inspected the said vehicle, taken a road test, and verified it before purchase. Therefore, no future complaints will be entertained.</li>
            <li>We clearly understand that the deal for this vehicle will not be canceled under any circumstances, and if canceled, the token amount paid will not be refunded.</li>
            <li>The possession of the said vehicle has been taken over by the purchasing party today on Date <strong>${fmtDateDN(formData.sob_date)}</strong> (${getDayName(formData.sob_date)}) at Time ........................................ Therefore, if this vehicle is involved in any theft, fire, accident, or criminal activity hereafter, the purchasing party will be responsible. The entire responsibility of transferring or getting new insurance for the car will lie with the purchasing party. The purchasing party must separately pay the tax applicable for the car transfer.</li>
            <li>No guarantee is provided regarding the kilometers of the car. The legal jurisdiction will be Ahmedabad/.........................................</li>
          </ul>
        </div>

        <div class="dn-signs">
          <div class="dn-sign-block">
            <div style="margin-bottom: 30px;">Vehicle Seller's Signature (CARECAY) <span class="dn-sign-line"></span></div>
            <div>Witness Signature <span class="dn-sign-line"></span></div>
          </div>
          <div class="dn-sign-block">
            <div style="margin-bottom: 30px;">Vehicle Buyer's Signature <span class="dn-sign-line"></span></div>
            <div>Witness Signature <span class="dn-sign-line"></span></div>
          </div>
        </div>

      </div>
    `;

    const title = 'DN-ENG-' + (formData.sobId || formData.sob_sclid || formData.sob_sinid || 'Draft');
    printDocument(title, htmlContent, dnStyles, null, true);
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave({ ...formData, total: calcTotal() });
      } else if (onSuccess) {
        onSuccess();
        onClose();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving record: ', error);
      alert('Failed to save record.');
    }
  };

  const total = calcTotal();

  return (
    <div className="overlay on" id="m_sob">
      <div className="mbox" style={{ maxWidth: 900 }}>
        <div className="m-hdr">
          <div className="m-hdr-icon"><i className="fa fa-clipboard-list"></i></div>
          <h3>Sales Order Booking</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">

          {autoFillMsg && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoFillMsg}
            </div>
          )}

          {/* ID Row */}
          <div className="grid3">
            <div className="fg">
              <label>Sales Closer ID <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto-Fill</span></label>
              <input name="sob_sclid" value={formData.sob_sclid || ''} onChange={handleChange} onBlur={handleSclIdBlur} placeholder="SCL-2026-0001" disabled={!!editData || !!quickSclId} />
            </div>
            <div className="fg">
              <label>Sales Inquiry ID <span style={{ color: 'var(--bl5)', fontSize: 10 }}>⚡ Auto-Fill All</span></label>
              <input name="sob_sinid" value={formData.sob_sinid || ''} onChange={handleChange} onBlur={handleSinIdBlur} placeholder="SIN-2026-0001" disabled={!!editData || !!quickSclId || !!formData.sob_sclid} />
            </div>
            <div className="fg">
              <label>Stock ID <span style={{ color: '#059669', fontSize: 10 }}>⚡ Auto-Fill Vehicle</span></label>
              <input name="sob_stkid" value={formData.sob_stkid || ''} onChange={handleChange} onBlur={handleStkIdBlur} placeholder="STK-2026-0001" disabled={!!editData || !!quickSclId} />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Booking Date</label>
              <input type="date" name="sob_date" value={formData.sob_date || ''} onChange={handleChange} disabled={!!editData} />
            </div>
            {editData && (
              <div className="fg">
                <label style={{ color: 'var(--or1)', fontWeight: 700 }}>Fix / Edit Booking ID</label>
                <input name="sobId" value={formData.sobId || ''} onChange={handleChange} placeholder="SOB-2026-0001" style={{ border: '1px dashed var(--or1)', background: 'var(--bg)' }} disabled />
              </div>
            )}
          </div>

          {/* Client Details */}
          <div className="sect-lbl"><i className="fa fa-user"></i> Client Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Client Name *</label>
              <input name="sob_cname" value={formData.sob_cname || ''} onChange={handleChange} placeholder="Full name" disabled={!!formData.sob_sinid || !!formData.sob_sclid} />
            </div>
            <div className="fg">
              <label>Contact No. *</label>
              <input name="sob_cont" value={formData.sob_cont || ''} onChange={handleChange} type="tel" placeholder="Mobile" disabled={!!formData.sob_sinid || !!formData.sob_sclid} />
            </div>
            <div className="fg">
              <label>Email ID</label>
              <input name="sob_email" value={formData.sob_email || ''} onChange={handleChange} type="email" placeholder="Email" disabled={!!formData.sob_sinid || !!formData.sob_sclid} />
            </div>
          </div>
          <div className="grid2">
            <div className="fg">
              <label>Client Address</label>
              <input name="sob_addr" value={formData.sob_addr || ''} onChange={handleChange} placeholder="Address" disabled={!!formData.sob_sinid || !!formData.sob_sclid} />
            </div>
            <div className="fg">
              <label>Branch</label>
              <select name="sob_branch" value={formData.sob_branch || ''} onChange={handleChange}>
                <option>SG Highway</option><option>Vastral</option><option>Head Office</option>
              </select>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="sect-lbl"><i className="fa fa-car"></i> Vehicle Details {formData.sob_stkid && <span style={{ color: '#059669', fontSize: 10, marginLeft: 8 }}>⚡ Auto-filled from Stock</span>}</div>
          <div className="grid3">
            <div className="fg">
              <label>Make & Model</label>
              <input name="sob_mm" value={formData.sob_mm || ''} onChange={handleChange} placeholder="Maruti Swift VXI" disabled={!!formData.sob_stkid} />
            </div>
            <div className="fg">
              <label>Color</label>
              <select name="sob_color" value={formData.sob_color || ''} onChange={handleChange} disabled={!!formData.sob_stkid}>
                <option>White</option><option>Silver</option><option>Grey</option><option>Black</option><option>Red</option><option>Blue</option><option>Brown</option><option>Orange</option><option>Yellow</option><option>Green</option><option>Other</option>
              </select>
            </div>
            <div className="fg">
              <label>Fuel Type</label>
              <select name="sob_fuel" value={formData.sob_fuel || ''} onChange={handleChange} disabled={!!formData.sob_stkid}>
                <option>Petrol</option><option>Diesel</option><option>CNG</option><option>Electric</option><option>Hybrid</option><option>Petrol+CNG</option>
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Chassis No.</label>
              <input name="sob_chas" value={formData.sob_chas || ''} onChange={handleChange} placeholder="17-char VIN" />
            </div>
            <div className="fg">
              <label>Engine No.</label>
              <input name="sob_eng" value={formData.sob_eng || ''} onChange={handleChange} placeholder="Engine number" />
            </div>
            <div className="fg">
              <label>Registration No.</label>
              <input name="sob_regn" value={formData.sob_regn || ''} onChange={handleChange} placeholder="GJ-01-AB-1234" style={{ textTransform: 'uppercase' }} disabled={!!formData.sob_stkid} />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Mfg Year</label>
              <select name="sob_year" value={formData.sob_year || ''} onChange={handleChange} disabled={!!formData.sob_stkid}>
                <option value="">Year</option>
                {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Ownership Type</label>
              <select name="sob_own" value={formData.sob_own || ''} onChange={handleChange}>
                <option>1st Owner</option><option>2nd Owner</option><option>3rd Owner</option><option>4th+ Owner</option>
              </select>
            </div>
            <div className="fg">
              <label>Mileage (KM)</label>
              <input name="sob_km" value={formData.sob_km || ''} onChange={handleChange} type="number" placeholder="KM" disabled={!!formData.sob_stkid} />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Insurance Type</label>
              <select name="sob_instype" value={formData.sob_instype || ''} onChange={handleChange}>
                <option>Comprehensive</option><option>Third Party</option><option>Zero Dep</option>
              </select>
            </div>
            <div className="fg">
              <label>Insurance Company Name</label>
              <input name="sob_insname" value={formData.sob_insname || ''} onChange={handleChange} placeholder="Insurance Company" />
            </div>
            <div className="fg">
              <label>Insurance Validity</label>
              <input type="date" name="sob_insval" value={formData.sob_insval || ''} onChange={handleChange} />
            </div>
          </div>

          {/* Personnel Details */}
          <div className="sect-lbl"><i className="fa fa-user-tie"></i> Personnel Details</div>
          <div className="grid3">
            <div className="fg">
              <label>Sales Executive</label>
              <input name="sob_exec" value={formData.sob_exec || ''} onChange={handleChange} placeholder="Executive Name" />
            </div>
            <div className="fg">
              <label>Partner Name {(formData.sob_sinid || formData.sob_sclid) && <span style={{ color: 'var(--bl5)', fontSize: 10 }}>⚡ From Inquiry</span>}</label>
              <input name="sob_partner" value={formData.sob_partner || ''} onChange={handleChange} placeholder="Partner Name" disabled={!!formData.sob_sinid || !!formData.sob_sclid} />
            </div>
            <div className="fg">
              <label>Support Partner</label>
              <input name="sob_support" value={formData.sob_support || ''} onChange={handleChange} placeholder="Support Partner" />
            </div>
          </div>

          {/* Cost Calculation */}
          <div className="sect-lbl"><i className="fa fa-calculator"></i> Cost Calculation (Auto)</div>
          <div className="grid3">
            <div className="fg">
              <label>Sale Price {(formData.sob_sinid || formData.sob_sclid) && <span style={{ color: 'var(--success)', fontSize: 10 }}>⚡ Final Deal Price (locked)</span>}</label>
              <input type="number" name="sob_saleprice" value={formData.sob_saleprice || ''} onChange={handleChange} placeholder="0" disabled={!!formData.sob_sinid || !!formData.sob_sclid} />
            </div>
            <div className="fg">
              <label>RTO Charge</label>
              <input type="number" name="sob_rto" value={formData.sob_rto || ''} onChange={handleChange} placeholder="0" />
            </div>
            <div className="fg">
              <label>TSC</label>
              <input type="number" name="sob_tsc" value={formData.sob_tsc || ''} onChange={handleChange} placeholder="0" />
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Insurance</label>
              <input type="number" name="sob_ins_amt" value={formData.sob_ins_amt || ''} onChange={handleChange} placeholder="0" />
            </div>
            <div className="fg">
              <label>Extended Warranty</label>
              <input type="number" name="sob_ext_war" value={formData.sob_ext_war || ''} onChange={handleChange} placeholder="0" />
            </div>
            <div className="fg">
              <label>Other Expenses</label>
              <input type="number" name="sob_oth_exp" value={formData.sob_oth_exp || ''} onChange={handleChange} placeholder="From Purchase" disabled />
            </div>
          </div>
          <div className="grid2">
            <div className="fg">
              <label>Token / Advance Received <span style={{color:'var(--or1)',fontSize:10}}>⚡ Appears in DN</span></label>
              <input type="number" name="sob_token" value={formData.sob_token || ''} onChange={handleChange} placeholder="0" />
            </div>
            <div className="fg">
              <label>Balance Clear By Date <span style={{color:'var(--or1)',fontSize:10}}>⚡ Appears in DN</span></label>
              <input type="date" name="sob_clrdate" value={formData.sob_clrdate || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="calc-panel">
            <div className="calc-row"><span className="cl">Sale Price</span><span>{fmt(formData.sob_saleprice)}</span></div>
            <div className="calc-row"><span className="cl">RTO Charge</span><span style={{color:'var(--success)'}}>+ {fmt(formData.sob_rto)}</span></div>
            <div className="calc-row"><span className="cl">TSC</span><span style={{color:'var(--success)'}}>+ {fmt(formData.sob_tsc)}</span></div>
            <div className="calc-row"><span className="cl">Insurance</span><span style={{color:'var(--success)'}}>+ {fmt(formData.sob_ins_amt)}</span></div>
            <div className="calc-row"><span className="cl">Extended Warranty</span><span style={{color:'var(--success)'}}>+ {fmt(formData.sob_ext_war)}</span></div>
            <div className="calc-row"><span className="cl">Other Expenses</span><span style={{color:'var(--success)'}}>+ {fmt(formData.sob_oth_exp)}</span></div>
            <div className="calc-row"><span>TOTAL AMOUNT</span><span style={{ color: 'var(--or1)', fontSize: 16 }}>{fmt(total)}</span></div>
            {formData.sob_token && <div className="calc-row"><span className="cl">Token Received</span><span style={{color:'var(--success)'}}>- {fmt(formData.sob_token)}</span></div>}
            {formData.sob_token && <div className="calc-row"><span>Pending Balance</span><span style={{color:'var(--danger)',fontSize:14}}>{fmt(total - Number(formData.sob_token))}</span></div>}
          </div>

          {/* Broker */}
          <div className="grid3" style={{ marginTop: 14 }}>
            <div className="fg">
              <label>Broker Name</label>
              <input name="sob_brkname" value={formData.sob_brkname || ''} onChange={handleChange} placeholder="Broker" />
            </div>
            <div className="fg">
              <label>Broker Mobile</label>
              <input name="sob_brkno" value={formData.sob_brkno || ''} onChange={handleChange} type="tel" placeholder="Mobile" />
            </div>
            <div className="fg">
              <label>Brokerage Amt</label>
              <input name="sob_brkamt" value={formData.sob_brkamt || ''} onChange={handleChange} type="number" placeholder="Amount" />
            </div>
          </div>
          <div className="grid1">
            <div className="fg">
              <label>Remark</label>
              <input name="sob_rem" value={formData.sob_rem || ''} onChange={handleChange} placeholder="Notes" />
            </div>
          </div>

          {/* Document Checklist */}
          <div className="sect-lbl" style={{ marginTop: 10 }}>
            <i className="fa fa-file-contract"></i> Document Checklist
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>(Auto-fetched from Sale Documents tab)</span>
          </div>
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
            {(() => {
              const allDocs = data?.sale_doc || [];
              const docRec = allDocs.find(d => d.sd_obid === formData.sobId) ||
                allDocs.find(d => d.sd_obid === formData.sob_sclid) ||
                allDocs.find(d => d.sd_regn && formData.sob_regn && d.sd_regn.replace(/[\s-]/g,'').toLowerCase() === formData.sob_regn.replace(/[\s-]/g,'').toLowerCase());
              return [
                ['sd_inv', 'Sales Invoice'], ['sd_rto', 'RTO Transfer Receipt'], ['sd_ins', 'Insurance Transfer'],
                ['sd_dn', 'Signed Delivery Note'], ['sd_gp', 'Signed Gate Pass'], ['sd_pay', 'Payment Receipt'],
              ].map(([key, label]) => {
                const isAvail = docRec ? !!docRec[key] : false;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text2)', cursor: 'not-allowed' }}>
                    <span style={{ color: isAvail ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>{isAvail ? '✅' : '❌'}</span> {label}
                  </div>
                );
              });
            })()}
          </div>
          <div className="grid2" style={{ marginTop: 10 }}>
            <div className="fg">
              <label>Document Status</label>
              {(() => {
                const allDocs = data?.sale_doc || [];
                const docRec = allDocs.find(d => d.sd_obid === formData.sobId) ||
                  allDocs.find(d => d.sd_obid === formData.sob_sclid) ||
                  allDocs.find(d => d.sd_regn && formData.sob_regn && d.sd_regn.replace(/[\s-]/g,'').toLowerCase() === formData.sob_regn.replace(/[\s-]/g,'').toLowerCase());
                const stat = docRec ? (docRec.sd_stat || 'Incomplete') : (formData.sob_doc_stat || 'Pending');
                return <input value={stat} disabled style={{ fontWeight: 'bold', color: stat === 'Complete' ? '#10B981' : '#D97706', cursor: 'not-allowed' }} />;
              })()}
            </div>
            <div></div>
          </div>
        </div>

        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose}>Cancel</button>
          <button className="btn btn-bl" onClick={handlePrintOrderBooking} type="button">
            <i className="fa fa-print"></i> Preview Order Booking
          </button>
          <button className="btn btn-or" onClick={handlePrintDeliveryNote} type="button">
            <i className="fa fa-file-invoice"></i> DN (GUJ)
          </button>
          <button className="btn btn-or" onClick={handlePrintDeliveryNoteEnglish} type="button">
            <i className="fa fa-file-invoice"></i> DN (ENG)
          </button>
          <button className="btn btn-bl" style={{ background: 'var(--success)' }} onClick={handleSave}>
            <i className="fa fa-save"></i> Save Booking
          </button>
        </div>
      </div>
    </div>
  );
};

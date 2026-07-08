import { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { deleteRecord, updateRecord } from '../services/db';
import { fmtDate, ageDays, fmt, printDocument } from '../utils/helpers';

/* ── Pipeline stage definitions ─────────────────── */
const PIPE = [
  { key: 'inq', label: 'INQ', color: '#f97316', icon: 'fa-car-side',                title: 'Purchase Inquiry'  },
  { key: 'val', label: 'VAL', color: '#8b5cf6', icon: 'fa-magnifying-glass-dollar',  title: 'Valuation'         },
  { key: 'pfu', label: 'FU',  color: '#3b82f6', icon: 'fa-phone-volume',             title: 'Follow-Up'         },
  { key: 'doc', label: 'DOC', color: '#f59e0b', icon: 'fa-file-contract',            title: 'Documents'         },
  { key: 'ob',  label: 'OB',  color: '#7c3aed', icon: 'fa-file-pen',                 title: 'Order Booking'     },
  { key: 'pcl', label: 'PCL', color: '#06b6d4', icon: 'fa-handshake',               title: 'Purchase Closer'   },
  { key: 'stk', label: 'STK', color: '#22c55e', icon: 'fa-warehouse',                title: 'Car Stock'         },
];

/* ── Compute last reached stage ─────────────────── */
function getLastReached({ val, pfu, doc, pcl, ob, stk }) {
  if (stk) return { label: 'Car Stock',          path: '/stock'             };
  if (pcl) return { label: 'Purchase Closer',    path: '/purchase-closer'   };
  if (ob)  return { label: 'Order Booking',      path: '/purchase-booking'  };
  if (doc) return { label: 'Documents',          path: '/purchase-documents'         };
  if (pfu) return { label: 'Purchase Follow-Up', path: '/purchase-follow'   };
  if (val) return { label: 'Valuation',          path: '/valuation'         };
  return   { label: 'Purchase Inquiry',          path: '/purchase-inquiry'  };
}

/* ── Print helpers ──────────────────────────────── */
const DAY_NAMES    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_NAMES_GUJ = ['àª°àªµàª¿àªµàª¾àª°','àª¸à«‹àª®àªµàª¾àª°','àª®àª‚àª—àª³àªµàª¾àª°','àª¬à«àª§àªµàª¾àª°','àª—à«àª°à«‚àªµàª¾àª°','àª¶à«àª•à«àª°àªµàª¾àª°','àª¶àª¨àª¿àªµàª¾àª°'];
const MON_SHORT    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function getDayName(iso, guj = false) {
  if (!iso) return '';
  return (guj ? DAY_NAMES_GUJ : DAY_NAMES)[new Date(iso).getDay()];
}
function fmtDateDN(iso) {
  if (!iso) return '';
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

function printObBooking(ob) {
  if (!ob) return;
  const total = Number(ob.ob_pp || 0) - Number(ob.ob_rto || 0);
  const css = `
    .pf-wrap{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;color:#111;font-size:11px;line-height:1.3}
    .pf-header{text-align:center;border-bottom:2px solid #1a2542;padding-bottom:6px;margin-bottom:10px}
    .pf-title{font-size:20px;font-weight:800;color:#1a2542;letter-spacing:1px;margin:0}
    .pf-subtitle{font-size:11px;font-weight:600;color:#555;margin-top:2px;text-transform:uppercase;letter-spacing:2px}
    .pf-meta{display:flex;justify-content:space-between;margin-bottom:10px;font-size:11px;border-bottom:1px solid #eaeaea;padding-bottom:6px}
    .pf-meta-item{display:flex;flex-direction:column}
    .pf-meta-lbl{font-weight:600;color:#666;text-transform:uppercase;font-size:9px}
    .pf-meta-val{font-weight:bold;font-size:13px}
    .pf-section{margin-bottom:10px}
    .pf-section-title{font-size:12px;font-weight:bold;color:#1a2542;text-transform:uppercase;border-bottom:1px solid #1a2542;padding-bottom:2px;margin-bottom:6px}
    .pf-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 12px}
    .pf-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px}
    .pf-field{display:flex;flex-direction:column}
    .pf-lbl{font-size:9px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:1px}
    .pf-val{font-size:11px;font-weight:500;border-bottom:1px dashed #ccc;min-height:15px}
    .pf-totals{background:#f8fafc;padding:10px;border-radius:6px;border:1px solid #e2e8f0;margin-top:6px}
    .pf-totals-row{display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px}
    .pf-totals-row.grand{font-size:14px;font-weight:bold;color:#1a2542;border-top:2px solid #e2e8f0;padding-top:6px;margin-top:6px}
    .pf-signs{display:flex;justify-content:space-between;margin-top:20px;padding-top:10px;border-top:1px solid #eaeaea}
    .pf-sign-box{text-align:center;width:40%}
    .pf-sign-line{border-bottom:1px solid #000;height:30px;margin-bottom:6px}
    .pf-sign-lbl{font-weight:bold;font-size:10px;text-transform:uppercase}
    @media print{@page{size:A4;margin:8mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.pf-totals{background:#f8fafc!important}}
  `;
  const html = `<div class="pf-wrap">
    <div class="pf-header"><h1 class="pf-title">CARECAY PRIVATE LIMITED</h1><div class="pf-subtitle">USED CAR PURCHASE BOOKING FORM</div></div>
    <div class="pf-meta">
      <div class="pf-meta-item"><span class="pf-meta-lbl">Document No.</span><span class="pf-meta-val">${ob.obId||'DRAFT'}</span></div>
      <div class="pf-meta-item"><span class="pf-meta-lbl">Date</span><span class="pf-meta-val">${ob.ob_date||''}</span></div>
      <div class="pf-meta-item"><span class="pf-meta-lbl">Branch</span><span class="pf-meta-val">${ob.ob_branch||'SG Highway'}</span></div>
    </div>
    <div class="pf-section"><div class="pf-section-title">Client Details</div><div class="pf-grid-3">
      <div class="pf-field" style="grid-column:span 2"><span class="pf-lbl">Client Name</span><span class="pf-val">${ob.ob_cname||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Contact No.</span><span class="pf-val">${ob.ob_cont||''}</span></div>
      <div class="pf-field" style="grid-column:span 3"><span class="pf-lbl">Client Address</span><span class="pf-val">${ob.ob_addr||''}</span></div>
    </div></div>
    <div class="pf-section"><div class="pf-section-title">Car Details</div><div class="pf-grid">
      <div class="pf-field"><span class="pf-lbl">Model & Maker's Name</span><span class="pf-val">${ob.ob_mm||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Registration No.</span><span class="pf-val">${ob.ob_regn||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Color</span><span class="pf-val">${ob.ob_color||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Manufacturing Year</span><span class="pf-val">${ob.ob_year||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Fuel Type</span><span class="pf-val">${ob.ob_fuel||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Ownership Type</span><span class="pf-val">${ob.ob_ownt||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Chassis No.</span><span class="pf-val">${ob.ob_chas||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Engine No.</span><span class="pf-val">${ob.ob_eng||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Mileage (KM)</span><span class="pf-val">${ob.ob_km||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Partner Name</span><span class="pf-val">${ob.ob_pname||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Insurance Company</span><span class="pf-val">${ob.ob_insname||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Insurance Type & Validity</span><span class="pf-val">${ob.ob_instype||''} ${ob.ob_insval?'— Valid till '+ob.ob_insval:''}</span></div>
    </div></div>
    <div class="pf-section"><div class="pf-section-title">Inspection and Evaluation</div><div class="pf-grid">
      <div class="pf-field"><span class="pf-lbl">Valuator Name</span><span class="pf-val">${ob.ob_val||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Car Received Date</span><span class="pf-val">${ob.ob_recv||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">Executive Name</span><span class="pf-val">${ob.ob_exname||''}</span></div>
      <div class="pf-field"><span class="pf-lbl">NOC Required</span><span class="pf-val">NO</span></div>
      <div class="pf-field"><span class="pf-lbl">Broker Name & No.</span><span class="pf-val">${ob.ob_brkname||'NA'} ${ob.ob_brkno?'— '+ob.ob_brkno:''}</span></div>
    </div></div>
    <div class="pf-section"><div class="pf-section-title">Deal Summary</div><div class="pf-totals">
      <div class="pf-totals-row"><span>Purchase Price</span><span>₹${Number(ob.ob_pp||0).toLocaleString('en-IN')}</span></div>
      <div class="pf-totals-row"><span>RTO Challan (Deduction)</span><span style="color:red">- ${ob.ob_rto||'0'}</span></div>
      <div class="pf-totals-row grand"><span>TOTAL COST (TCP)</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    </div></div>
    <div class="pf-section"><div class="pf-section-title">Remarks</div><div class="pf-val" style="min-height:40px;border-bottom:none">${ob.ob_rem||''}</div></div>
    <div class="pf-signs">
      <div class="pf-sign-box"><div class="pf-sign-line"></div><div class="pf-sign-lbl">Purchase Partner Signature</div></div>
      <div class="pf-sign-box"><div class="pf-sign-line"></div><div class="pf-sign-lbl">Purchase HOD Signature</div></div>
    </div>
  </div>`;
  printDocument(ob.obId || ob.ob_clid || ob.ob_inqid || 'OB-Draft', html, css);
}

const DN_CSS = `
  .dn-wrap{font-family:'Arial',sans-serif;max-width:800px;margin:0 auto;color:#000;font-size:11px}
  .dn-head{text-align:center;margin-bottom:8px;position:relative;display:flex;align-items:center;justify-content:center;min-height:55px}
  .dn-logo{position:absolute;left:0;top:0;height:55px;object-fit:contain}
  .dn-head-title{background:#333;color:#fff;padding:4px 20px;border-radius:30px;display:inline-block;font-size:14px;font-weight:bold}
  .dn-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
  .dn-box{border:2px solid #333;border-radius:4px;position:relative;padding-top:10px}
  .dn-box-title{background:#333;color:#fff;text-align:center;font-weight:bold;padding:2px 10px;border-radius:20px;position:absolute;top:-12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px}
  .dn-field{display:flex;border-top:2px solid #333}
  .dn-lbl{padding:3px 6px;font-weight:bold;white-space:nowrap;font-size:10px}
  .dn-val{padding:3px 6px;flex-grow:1;font-weight:bold;font-size:10px}
  .dn-box-content{padding:8px 8px 4px 8px;min-height:40px;text-align:center;font-weight:bold;font-size:12px;line-height:1.3}
  .dn-text{line-height:1.4;text-align:justify;margin-bottom:10px;font-size:12px}
  .dn-text u{border-bottom:1px dotted #000;text-decoration:none;font-weight:bold;padding:0 10px;display:inline-block;min-width:50px;text-align:center}
  .dn-terms{margin-top:5px}
  .dn-terms ul{padding-left:20px;margin-top:3px;line-height:1.3;font-size:11px}
  .dn-terms li{margin-bottom:3px;text-align:justify}
  .dn-signs{display:flex;justify-content:space-between;margin-top:30px}
  .dn-sign-block{width:45%;font-size:11px}
  .dn-sign-line{border-bottom:1px dotted #000;display:inline-block;width:60%;margin-left:10px}
  @media print{@page{size:A4;margin:8mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0!important}.dn-head-title,.dn-box-title{background:#333!important;color:#fff!important}}
`;

function printDnGuj(ob) {
  if (!ob) return;
  const total = Number(ob.ob_pp || 0) - Number(ob.ob_rto || 0);
  const html = `<div class="dn-wrap">
    <div class="dn-head"><img src="/logo.png" class="dn-logo" alt="Carecay Logo"/><div class="dn-head-title">àªµà«‡àªšàª¾àª£ àª–àª¤ àª…àª¨à«‡ àª¡à«€àª²à«€àªµàª°à«€ àª¨à«‹àªŸ</div></div>
    <div class="dn-grid">
      <div style="border:2px solid #333;display:flex"><div class="dn-lbl">àª—àª¾àª¡à«€ àª¨àª‚àª¬àª°:</div><div class="dn-val">${ob.ob_regn||''}</div></div>
      <div style="border:2px solid #333;display:flex">
        <div class="dn-lbl">àª¤àª¾àª°à«€àª– :</div><div class="dn-val">${fmtDateDN(ob.ob_date)}</div>
        <div class="dn-lbl" style="border-left:2px solid #333">àªµàª¾àª°:</div><div class="dn-val">${getDayName(ob.ob_date,true)}</div>
      </div>
    </div>
    <div class="dn-grid">
      <div class="dn-box"><div class="dn-box-title">àªµàª¾àª¹àª¨ àªµà«‡àªšàª¾àª£ àª†àªªàª¨àª¾àª°</div>
        <div class="dn-box-content" style="text-align:left;font-size:14px">${ob.ob_cname||''}<br/>${ob.ob_addr||''}</div>
        <div class="dn-field"><div class="dn-lbl">àª®à«‹. àª¨àª‚àª¬àª° :</div><div class="dn-val" style="border-left:2px solid #333">${ob.ob_cont||''}</div></div>
      </div>
      <div class="dn-box"><div class="dn-box-title">àªµàª¾àª¹àª¨ àª–àª°à«€àª¦ àª²à«‡àª¨àª¾àª°</div>
        <div class="dn-box-content">CARECAY PVT. LTD<br/>Mumatpura Road, Off. S. G. Highway,<br/>Nr. Cafe De Italiano,<br/>Ahmedabad-(380058)</div>
        <div class="dn-field"><div class="dn-lbl">àª®à«‹. àª¨àª‚àª¬àª° :</div><div class="dn-val" style="border-left:2px solid #333">94 84 88 22 22</div></div>
      </div>
    </div>
    <div class="dn-text">
      àª…àª®à«‹àª àª…àª®àª¾àª°à«€ àª®àª¾àª²àª¿àª•à«€ àª…àª¨à«‡ àª¹àª•à«àª• àª­à«‹àª—àªµàªŸàª¾àª¨à«àª‚ àªµàª¾àª¹àª¨ àªœà«‡àª¨à«‹ àª†àª°.àªŸà«€.àª“. àª°àªœà«€àª¸à«àªŸà«àª°à«‡àª¶àª¨ àª¨àª‚àª¬àª° ${u(ob.ob_regn,'120px')} àª›à«‡
      àª…àª¨à«‡ àª¤à«‡àª¨à«àª‚ àª®à«‹àª¡àª² ${u(ob.ob_mm,'140px')} àª—àª¾àª¡à«€àª¨à«‹ àªªà«àª°àª•àª¾àª° ${u(ob.ob_fuel,'60px')} àªàª¨à«àªœàª¿àª¨ àª¨àª‚ ${u(ob.ob_eng,'120px')}
      àª¤àª¥àª¾ àªšà«‡àª¸à«€àª¸ àª¨àª‚ ${u(ob.ob_chas,'120px')} àª›à«‡.
      àª¤à«‡ àªµàª¾àª¹àª¨ àª†àªœàª°à«‹àªœ àª°à«‚àª¾. ${u(ob.ob_pp,'100px')} àª¦àª²àª¾àª²à«€ àª°à«‚àª¾. ${u(ob.ob_brkamt,'80px')}
      àªŸà«‡àª•à«àª¸ àª°à«‚àª¾. ${u('','60px')} àª¤àª¥àª¾ àªŸà«àª°àª¾àª¨à«àª¸àª«àª°àª¨à«‹/àª¡à«àª¯à«àª¨àª¾ àª°à«‚àª¾ ${u(ob.ob_rto,'80px')} àª®àª³à«€ àªŸà«‹àªŸàª² àª°à«‚àª¾ ${u(total,'100px')}
      àª…àª‚àª•à«‡ àª°à«‚àª¾ ${u(numToWords(total),'220px')} àª®àª¾àª‚ àª‰àªªàª° àªœàª£àª¾àªµà«‡àª² àªªàª¾àª°à«àªŸà«€àª¨à«‡ àªµà«‡àªšàª¾àª£
      àª†àªªà«‡àª² àª›à«‡. àª¤à«‡àª¨àª¾ àª¬àª¾àª¨àª¾ àªªà«‡àªŸà«‡ àª°à«‚àª¾. ${u(ob.ob_token,'100px')} àª…àª‚àª•à«‡ àª°à«‚àª¾. ${u(numToWords(ob.ob_token),'200px')}
      àª°à«‹àª•àª¡àª¾/àªšà«‡àª• àª®àª³à«‡àª² àª›à«‡ àª¬àª¾àª•à«€ àª¨à«€àª•àª³àª¤àª¾ àª°à«‚àª¾ ${u(total&&ob.ob_token?total-Number(ob.ob_token):'','100px')} àª®à«‹àª¡àª¾àª®àª¾àª‚ àª®à«‹àª¡àª¾
      àª¤àª¾ ${u(fmtDateDN(ob.ob_clrdate),'100px')} àª¸à«àª§à«€àª®àª¾àª‚ àªšà«‚àª•àª¤à«‡ àª¹àª¿àª¸àª¾àª¬à«‡ àª•àª°àªµàª¾àª¨àª¾ àª°àª¹à«‡àª¶à«‡.
      àª—àª¾àª¡à«€àª¨àª¾ àª–àª°à«€àª¦-àªµà«‡àªšàª¾àª£ àªªà«‡àªŸà«‡ àª¨à«€àªšà«‡ àª²àª–à«‡àª² àª¶àª°àª¤à«‹ àª… àª®àª¨à«‡ àª¬àª‚àª¨à«‡ àªªàª¾àª°à«àªŸà«€àª àªµàª¾àª‚àªšà«‡àª² àª›à«‡. àª…àª¨à«‡ àª¬àª‚àª§àª¨ àª•àª°à«àª¤àª¾ àª°àª¹à«‡àª¶à«‡ àª¤à«‡ àªœàª¾àª£à«€àª¨à«‡ àª…àª®à«‡ àª¸àª¹à«€ àª•àª°à«‡àª² àª›à«‡.
    </div>
    <div class="dn-head" style="margin-top:30px"><div class="dn-head-title" style="padding:4px 20px;font-size:16px;">àª¶àª°àª¤à«‹ - àª¨àª¿àª¯àª®à«‹</div></div>
    <div class="dn-terms"><ul>
      <li>àª¸àª¦àª° àª¸à«‹àª¦à«‹ àª…àª®à«‹ àª¬àª‚àª¨à«‡ àªªàª¾àª°à«àªŸà«€àª àª°àª¾àªœà«€àª–à«àª¶à«€àª¥à«€ àª¸àª®àªœà«€ àªµàª¿àªšàª¾àª°à«€ àª…àª•à«àª•àª², àª¹à«‹àª¶àª¿àª¯àª¾àª°à«€àª¥à«€, àª¬à«€àª¨àª•à«‡àª«à«€àªªàª£àª¾àª®àª¾àª‚àª¥à«€ àª•à«‹àªˆàª¨àª¨àª¾ àª§àª¾àª• àª§àª®àª•à«€ àª•à«‡ àª¦àª¬àª¾àª£ àªµàª—àª° àª•àª°à«àª¯à«‹ àª›à«‡.</li>
      <li>àª¸àª¦àª° àªµàª¾àª¹àª¨àª¨à«‹ àª†àªœàª°à«‹àªœ àªªàª¹à«‡àª²àª¾àª¨à«àª‚ àª•à«‹àªˆ àªªàª£ àªªà«àª°àª•àª¾àª°àª¨à«àª‚ àª†àª°.àªŸà«€.àª“. àªŸà«‡àª•à«àª¸ àª®à«‡àª®à«‹ àª•à«‡ àª•à«‹àª‡àªªàª£ àªªà«àª°àª•àª¾àª°àª¨à«‹ àª¬à«‡àª¨à«àª• àª•à«‡ àªªà«‡àª¢à«€àª¨à«àª‚ àª¦à«‡àªµà«àª‚ àª¨à«€àª•àª³àª¶à«‡ àª•à«‡ àª•à«‹àªˆàªªàª£ àªªà«àª°àª•àª¾àª°àª¨à«‹ àªªà«‹àª²à«€àª¸ àª•à«‡àª¸ àª•à«‡ àª¸àª‚àª¬àª‚àª§àª¿àª¤ àª¤àª®àª¾àª® àªœàªµàª¾àª¬àª¦àª¾àª°à«€ àª¤àª¾. ........................................ àª¸à«àª§à«€ àª¤àª¥àª¾ àª¤àª®àª¾àª® àªœàªµàª¾àª¬àª¦àª¾àª°à«€ àªµàª¾àª¹àª¨ àªµà«‡àªšàª¨àª¾àª°àª¨à«€ àª°àª¹à«‡àª¶à«‡.</li>
      <li>àª¸àª¦àª° àªµàª¾àª¹àª¨ àª…àª®à«‹àª àª…àª®àª¾àª°à«€ àª°à«€àª¤à«‡ àªœà«‹àªˆ, àª¤àªªàª¾àª¸à«€ àª…àª®àª¾àª°àª¾ àª«à«‹àª°àª®à«‡àª¨, àª¡à«àª°àª¾àªˆàªµàª°, àª¦àª²àª¾àª² àªµàª¿àª—à«‡àª°à«‡àª¨à«‡ àª¬àª°àª¾àª¬àª° àªšàª¾àª°à«‡ àª¤àª°àª«àª¥à«€ àª¬àª¤àª¾àªµà«€ àª°à«‹àª¡ àªŸà«‡àª¸à«àªŸ àª²àªˆ àªšàª•àª¾àª¸àª£à«€ àª•àª°à«€ àª–àª°à«€àª¦ àª•àª°à«‡àª² àª›à«‡.</li>
      <li>àª¸àª¦àª° àªµàª¾àª¹àª¨àª¨à«‹ àª¸à«‹àª¦à«‹ àª•à«‹àªˆàªªàª£ àª¸àª‚àªœà«‹àª—à«‹àª®àª¾àª‚ àª•à«‡àª¨à«àª¸àª² àª¥àª¶à«‡ àª¨àª¹à«€àª‚ àª…àª¨à«‡ àªœà«‹ àª¸à«‹àª¦à«‹ àª•à«‡àª¨à«àª¸àª² àª¥àª¶à«‡ àª¤à«‹ àª¬àª¾àª¨àª¾àª¨à«€ àª†àªªà«‡àª²à«€ àª°àª•àª® àªªàª°àª¤ àª®àª³àª¶à«‡ àª¨àª¹à«€àª‚.</li>
      <li>àª¸àª¦àª° àªµàª¾àª¹àª¨à«‹ àª•àª¬àªœà«‹ àª†àªœ àª°à«‹àªœ àªàªŸàª²à«‡ àª•à«‡ àª¤àª¾. <strong>${fmtDateDN(ob.ob_date)}</strong> (${getDayName(ob.ob_date,true)}) àª…àª¨à«‡ àª¸àª®àª¯........................................àª¥à«€ àª²à«‡àª¨àª¾àª° àªªàª¾àª°à«àªŸà«€àª àª²à«€àª§à«‡àª² àª›à«‡.</li>
      <li>àª—àª¾àª¡à«€àª¨àª¾ àª•àª¿àª²à«‹àª®à«€àªŸàª°àª¨à«€ àª•à«‹àªˆ àªªàª£ àªœàªµàª¾àª¬àª¦àª¾àª°à«€ àª†àªªàªµàª¾àª®àª¾àª‚ àª†àªµàª¤à«€ àª¨àª¥à«€. àª•àª¾àª¯àª¦àª¾àª•à«€àª¯ àª•à«àª·à«‡àª¤à«àª° àª…àª®àª¦àª¾àªµàª¾àª¦/........................................ àª°àª¹à«‡àª¶à«‡.</li>
    </ul></div>
    <div class="dn-signs">
      <div class="dn-sign-block"><div style="margin-bottom:30px">àªµàª¾àª¹àª¨ àªµà«‡àªšàª¨àª¾àª°àª¨à«€ àª¸àª¹à«€ <span class="dn-sign-line"></span></div><div>àª¸àª¾àª•à«àª·à«€àª¨à«€ àª¸àª¹à«€ <span class="dn-sign-line"></span></div></div>
      <div class="dn-sign-block"><div style="margin-bottom:30px">àªµàª¾àª¹àª¨ àª²à«‡àª¨àª¾àª°àª¨à«€ àª¸àª¹à«€ <span class="dn-sign-line"></span></div><div>àª¸àª¾àª•à«àª·à«€àª¨à«€ àª¸àª¹à«€ <span class="dn-sign-line"></span></div></div>
    </div>
  </div>`;
  printDocument('DN-' + (ob.obId || ob.ob_clid || ob.ob_inqid || 'Draft'), html, DN_CSS, null, true);
}

function printDnEng(ob) {
  if (!ob) return;
  const total = Number(ob.ob_pp || 0) - Number(ob.ob_rto || 0);
  const html = `<div class="dn-wrap">
    <div class="dn-head"><img src="/logo.png" class="dn-logo" alt="Carecay Logo"/><div class="dn-head-title">SALE DEED AND DELIVERY NOTE</div></div>
    <div class="dn-grid">
      <div style="border:2px solid #333;display:flex"><div class="dn-lbl">Vehicle No:</div><div class="dn-val">${ob.ob_regn||''}</div></div>
      <div style="border:2px solid #333;display:flex">
        <div class="dn-lbl">Date :</div><div class="dn-val">${fmtDateDN(ob.ob_date)}</div>
        <div class="dn-lbl" style="border-left:2px solid #333">Day:</div><div class="dn-val">${getDayName(ob.ob_date)}</div>
      </div>
    </div>
    <div class="dn-grid">
      <div class="dn-box"><div class="dn-box-title">Vehicle Seller</div>
        <div class="dn-box-content" style="text-align:left;font-size:14px">${ob.ob_cname||''}<br/>${ob.ob_addr||''}</div>
        <div class="dn-field"><div class="dn-lbl">Mobile No :</div><div class="dn-val" style="border-left:2px solid #333">${ob.ob_cont||''}</div></div>
      </div>
      <div class="dn-box"><div class="dn-box-title">Vehicle Buyer</div>
        <div class="dn-box-content">CARECAY PVT. LTD<br/>Mumatpura Road, Off. S. G. Highway,<br/>Nr. Cafe De Italiano,<br/>Ahmedabad-(380058)</div>
        <div class="dn-field"><div class="dn-lbl">Mobile No :</div><div class="dn-val" style="border-left:2px solid #333">94 84 88 22 22</div></div>
      </div>
    </div>
    <div class="dn-text">
      We have sold our fully owned vehicle with RTO Registration No ${u(ob.ob_regn,'120px')}
      and Model ${u(ob.ob_mm,'140px')}, Fuel Type ${u(ob.ob_fuel,'60px')}, Engine No ${u(ob.ob_eng,'120px')}
      and Chassis No ${u(ob.ob_chas,'120px')}.
      The vehicle is sold today for Rs. ${u(ob.ob_pp,'100px')}, Brokerage Rs. ${u(ob.ob_brkamt,'80px')},
      Tax Rs. ${u('','60px')} and Transfer dues Rs. ${u(ob.ob_rto,'80px')} making a total of Rs. ${u(total,'100px')}
      (in words Rs. ${u(numToWords(total),'220px')}) to the above mentioned party.
      As token amount Rs. ${u(ob.ob_token,'100px')} (in words Rs. ${u(numToWords(ob.ob_token),'200px')})
      has been received in Cash/Cheque. The pending balance of Rs. ${u(total&&ob.ob_token?total-Number(ob.ob_token):'','100px')} will be paid and cleared
      by Date ${u(fmtDateDN(ob.ob_clrdate),'100px')} at the latest.
    </div>
    <div class="dn-head" style="margin-top:30px"><div class="dn-head-title" style="padding:4px 20px;font-size:16px;">Terms and Conditions</div></div>
    <div class="dn-terms"><ul>
      <li>This deal has been made by both parties willfully, with full understanding, in sound mind, without any fear, threat, or pressure from anyone.</li>
      <li>Any R.T.O. tax memo, bank or financial institution loan/dues, or police case related to this vehicle prior to today will remain the total responsibility of the Seller.</li>
      <li>We have personally checked and inspected the said vehicle from all sides through our foreman, driver, broker, etc., taken a road test, verified it, and then purchased it. Therefore, no future complaints will be entertained.</li>
      <li>We clearly understand that the deal for this vehicle will not be canceled under any circumstances, and if canceled, the token amount paid will not be refunded.</li>
      <li>The possession of the said vehicle has been taken over by the purchasing party today on Date <strong>${fmtDateDN(ob.ob_date)}</strong> (${getDayName(ob.ob_date)}). The entire responsibility of transferring or getting new insurance for the car will lie with the purchasing party.</li>
      <li>No guarantee is provided regarding the kilometers of the car. Legal jurisdiction will be Ahmedabad.</li>
    </ul></div>
    <div class="dn-signs">
      <div class="dn-sign-block"><div style="margin-bottom:30px">Vehicle Seller's Signature <span class="dn-sign-line"></span></div><div>Witness Signature <span class="dn-sign-line"></span></div></div>
      <div class="dn-sign-block"><div style="margin-bottom:30px">Vehicle Buyer's Signature <span class="dn-sign-line"></span></div><div>Witness Signature <span class="dn-sign-line"></span></div></div>
    </div>
  </div>`;
  printDocument('DN-ENG-' + (ob.obId || ob.ob_clid || ob.ob_inqid || 'Draft'), html, DN_CSS, null, true);
}

function printPclVoucher(pmt, pcl, idx) {
  if (!pmt || !pcl) return;
  const amt = pmt.amount ? Number(pmt.amount).toLocaleString('en-IN') + '/-' : '';
  let sname = pcl.pc_sname || '';
  if (pmt.mode === 'NEW CAR') {
    sname = `Carecay Cars Pvt Ltd C/o, ${pcl.pc_sname||''}, ${pmt.newCarDetails||''}`.trim().replace(/,\s*$/,'');
  } else if (pcl.pc_loan === 'Yes') {
    sname = `${pcl.pc_sname||''} - ${pcl.pc_lbank||''}`;
  }
  const car = pcl.pc_veh || '';
  const regNo = pcl.pc_regn || '';
  const remarks = pmt.remarks || '';
  const status = pmt.status || 'Done';
  const payMode = pmt.mode || 'CASH';
  const price = Number(pcl.pc_price || 0);
  const token = Number(pcl.pc_tok || 0);
  const paidThroughThis = (pcl.payments || []).slice(0, idx + 1).reduce((s, p) => s + Number(p.amount || 0), 0);
  const ledgerBal = (price - token - paidThroughThis).toLocaleString('en-IN') + '/-';
  const css = `
    .print-header{display:none!important}
    body{background:#e0e0e0;margin:0;padding:20px;display:flex;flex-direction:column;align-items:center}
    .no-print{width:800px;margin-bottom:20px}
    .voucher-container{width:800px;min-height:520px;background:#fff;padding:20px 30px;box-sizing:border-box;font-family:Arial,sans-serif;color:#000;border:1px solid #ccc;box-shadow:0 4px 12px rgba(0,0,0,.1)}
    @media print{body{background:#fff;padding:0;display:block;margin:0}.no-print{display:none!important}.voucher-container{width:100%;height:148mm;border:none;box-shadow:none;padding:10mm;box-sizing:border-box}@page{size:A4 portrait;margin:0}}
    .v-header-grid{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
    .v-logo img{height:80px;object-fit:contain}
    .v-top-right{text-align:right}
    .v-title-box{background:#333;color:#fff;padding:4px 10px;font-size:20px;font-weight:bold;display:inline-block;letter-spacing:1px;border-radius:2px;margin-bottom:10px}
    .v-row-right{display:flex;justify-content:flex-end;align-items:flex-end;gap:30px;font-size:14px;font-weight:600}
    .v-line{border-bottom:1px solid #000;display:inline-block;padding-left:10px;font-weight:600}
    .v-row-company{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:15px}
    .v-amount-box{display:flex;align-items:center;border:2px solid #333;height:34px}
    .v-rs{background:#333;color:#fff;padding:0 10px;height:100%;display:flex;align-items:center;font-weight:bold;font-size:16px}
    .v-row{display:flex;align-items:flex-end;margin-bottom:15px;font-size:14px;width:100%}
    .v-label{white-space:nowrap;margin-right:10px;font-weight:500}
    .v-pay-by{border:1.5px solid #333;display:inline-block;padding:4px 10px;margin-top:5px;font-size:13px;font-weight:600}
    .v-sign-table{width:100%;border-collapse:collapse;margin-top:10px;border:1.5px solid #333}
    .v-sign-table td{border:1.5px solid #333;height:60px;vertical-align:top;padding:4px 6px;font-size:12px;font-weight:600;position:relative}
    .v-footer{text-align:center;margin-top:15px;font-size:12px;font-weight:bold;letter-spacing:1.5px}
  `;
  const html = `
<div class="no-print" style="background:#fff3cd;color:#856404;padding:10px 15px;border-radius:4px;border:1px solid #ffeeba;margin-bottom:20px;font-weight:bold;width:800px;text-align:center;font-size:13px;">
  ⚠️ IMPORTANT: Set print settings to Paper Size: A4, Layout: Portrait.
</div>
<div class="voucher-container">
  <div class="v-header-grid">
    <div class="v-logo"><img src="/logo.png" alt="Carecay"/></div>
    <div class="v-top-right">
      <div class="v-title-box">Cash Voucher</div>
      <div class="v-row-right">
        <div>V.No. : <span class="v-line" style="width:120px;margin-bottom:2px;"></span></div>
        <div>Date : <span class="v-line" style="width:120px;margin-bottom:2px;font-weight:bold;padding-left:5px;">${pmt.date?pmt.date.split('-').reverse().join('/'):new Date().toLocaleDateString('en-GB')}</span></div>
      </div>
    </div>
  </div>
  <div class="v-row-company">
    <div style="font-size:15px;font-weight:600;display:flex;align-items:flex-end;white-space:nowrap;margin-left:5px;">For Company Carecay Pvt Ltd</div>
    <div class="v-amount-box"><div class="v-rs">Rs.</div><div style="width:140px;text-align:center;font-weight:bold;font-size:18px;">${amt}</div></div>
  </div>
  <div class="v-row"><span class="v-label">Pay To :</span><span class="v-line" style="flex:1;">${pmt.payTo!==undefined?pmt.payTo:sname||'______________________'}</span></div>
  <div class="v-row"><span class="v-label">Purpose :</span><span class="v-line" style="flex:1;">Used Car Purchase</span></div>
  <div class="v-row"><span class="v-label">Client Name:</span><span class="v-line" style="flex:1;">Carecay Pvt. Ltd.</span></div>
  <div class="v-row"><span class="v-label">Car :</span><span class="v-line" style="flex:1;">${car}</span><span class="v-label" style="margin-left:30px;">Reg No :</span><span class="v-line" style="flex:1;">${regNo}</span></div>
  <div class="v-row"><span class="v-label">Remarks :</span><span class="v-line" style="flex:1;">${remarks}</span></div>
  <div class="v-row"><span class="v-label">Payment Status :</span><span class="v-line" style="flex:1;">${status}</span><span class="v-label" style="margin-left:30px;">Ledger Bal :</span><span class="v-line" style="width:250px;">${ledgerBal}</span></div>
  <div class="v-pay-by">Pay by : ${payMode}</div>
  <table class="v-sign-table"><tr>
    <td style="width:25%">Authorised by :</td>
    <td style="width:25%">Executive :</td>
    <td style="width:25%">Officer :</td>
    <td style="width:25%;padding:0;"><div style="position:absolute;bottom:4px;right:4px;font-size:10px;font-weight:normal;">Receiver Signature</div></td>
  </tr></table>
  <div class="v-footer">● FOR OFFICE INTERNAL USE ONLY ●</div>
</div>`;
  const paymentNum = `Payment-${idx+1}`;
  const safeInqId  = (pcl.pc_inqid||'UNKNOWN').replace(/[^a-zA-Z0-9_-]/g,'-');
  const safeRegNo  = (pcl.pc_regn||'NO-REG').replace(/[^a-zA-Z0-9_-]/g,'-');
  const safeVeh    = (pcl.pc_veh||'NO-VEHICLE').replace(/[^a-zA-Z0-9_ -]/g,'-');
  const safeSeller = (pcl.pc_sname||'NO-SELLER').replace(/[^a-zA-Z0-9_ -]/g,'-');
  const docTitle   = `${paymentNum}-${safeInqId}-${safeRegNo}-${safeVeh}-${safeSeller}`.replace(/\s+/g,'-');
  printDocument(docTitle, html, css, { jsPDF:{ unit:'mm', format:'a5', orientation:'landscape' } });
}

/* ── Checkbox-style pipeline progress ───────────── */
function PipelineChecklist({ reached }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap' }}>
      {PIPE.map((s) => {
        const done = reached[s.key];
        return (
          <div key={s.key} title={s.title}
            style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 13, height: 13, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${done ? s.color : 'var(--border)'}`,
              background: done ? s.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}>
              {done && <i className="fa fa-check" style={{ color: '#fff', fontSize: 7 }}></i>}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: done ? s.color : 'var(--text3)' }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type === 'success' ? 'suc' : type === 'error' ? 'err' : 'inf'}`}
    style={{ display: 'flex' }}>
    <i className={`fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose}
      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
  </div>
);

/* ── Resume Modal ────────────────────────────────── */
function ResumeModal({ target, onContinue, onStartOver, onClose }) {
  if (!target) return null;
  const { inq, lastStage } = target;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '28px 32px', width: 420, maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0,0,0,.4)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
            <i className="fa fa-rotate-right" style={{ color: 'var(--or1)', marginRight: 8 }}></i>
            Resume Inquiry
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>
            {inq.inqId} — {inq.sellerName} · {inq.make} {inq.model}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onContinue} style={{
            background: 'var(--or1)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)',
            padding: '13px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}>
            <i className="fa fa-play" style={{ fontSize: 11, flexShrink: 0 }}></i>
            <div>
              <div>Continue from last stage</div>
              <div style={{ fontWeight: 400, fontSize: 11, opacity: .85, marginTop: 2 }}>
                Opens: {lastStage.label}
              </div>
            </div>
          </button>
          <button onClick={onStartOver} style={{
            background: 'rgba(239,68,68,.07)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--radius)',
            padding: '13px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}>
            <i className="fa fa-rotate-left" style={{ fontSize: 11, flexShrink: 0 }}></i>
            <div>
              <div>Start Over</div>
              <div style={{ fontWeight: 400, fontSize: 11, opacity: .8, marginTop: 2 }}>
                Resets inquiry stage to 'Inquiry' — linked records are kept
              </div>
            </div>
          </button>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 20px',
            cursor: 'pointer', color: 'var(--text3)', fontWeight: 600, fontSize: 12,
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Key-value row inside expansion cards ────────── */
function Row({ label, val }) {
  if (val === undefined || val === null || val === '') return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 12, gap: 8,
    }}>
      <span style={{ color: 'var(--text3)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{val}</span>
    </div>
  );
}

/* ── "Not yet reached" placeholder ──────────────── */
function EmptyStage() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 11 }}>
      <i className="fa fa-circle-xmark" style={{ fontSize: 22, opacity: .2, display: 'block', marginBottom: 6 }}></i>
      Not yet reached
    </div>
  );
}

/* ── Stage card wrapper with Edit button ─────────── */
function StageCard({ title, icon, color, active, navPath, children }) {
  const navigate = useNavigate();
  return (
    <div style={{
      background: active ? 'var(--bg)' : 'var(--surface)',
      border: `1px solid ${active ? color + '50' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '12px 14px',
      opacity: active ? 1 : 0.55,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 10, paddingBottom: 8,
        borderBottom: `2px solid ${active ? color : 'var(--border)'}`,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className={`fa ${icon}`} style={{ color, fontSize: 12 }}></i>
        </div>
        <span style={{ fontWeight: 700, fontSize: 12, color: active ? 'var(--text)' : 'var(--text3)', flex: 1 }}>
          {title}
        </span>
        {active && navPath && (
          <button
            onClick={() => navigate(navPath)}
            title={`Edit in ${title}`}
            style={{
              background: `${color}15`, color, border: `1px solid ${color}30`,
              borderRadius: 5, padding: '3px 9px', cursor: 'pointer',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            }}>
            <i className="fa fa-pen" style={{ fontSize: 8 }}></i> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Full expansion panel (6 stage cards in 3×2 grid) */
function ExpansionPanel({ inq, val, pfu, pcl, ob, doc, stk }) {
  const lastFu = pfu?.followUps?.length > 0 ? pfu.followUps[pfu.followUps.length - 1] : null;
  const paidTotal = Array.isArray(pcl?.payments) && pcl.payments.length > 0
    ? pcl.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    : (parseFloat(pcl?.pc_p1 || 0) + parseFloat(pcl?.pc_p2 || 0) + parseFloat(pcl?.pc_p3 || 0));
  const agreedPrice = parseFloat(pcl?.pc_price || pcl?.amount || 0);
  const balance = agreedPrice - (parseFloat(pcl?.pc_tok || 0)) - paidTotal;

  return (
    <div style={{
      background: 'var(--surface)', padding: '16px 20px',
      borderTop: '1px solid var(--border)',
      borderBottom: '3px solid var(--or1)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>

        {/* 1 — Inquiry */}
        <StageCard title="Purchase Inquiry" icon="fa-car-side" color="#f97316" active={true} navPath="/purchase-inquiry">
          <Row label="INQ ID"         val={inq.inqId} />
          <Row label="Date"           val={fmtDate(inq.date)} />
          <Row label="Source"         val={inq.source} />
          <Row label="Vehicle"        val={[inq.make, inq.model, inq.year].filter(Boolean).join(' ')} />
          <Row label="Fuel / Trans"   val={[inq.fuel, inq.trans].filter(Boolean).join(' / ')} />
          <Row label="KM"             val={inq.km ? `${Number(inq.km).toLocaleString('en-IN')} km` : ''} />
          <Row label="Owners"         val={inq.owners} />
          <Row label="Reg No."        val={inq.regNo} />
          <Row label="Status"         val={inq.status} />
          <Row label="Next Follow-Up" val={fmtDate(inq.nextFU)} />
          <Row label="Assigned To"    val={inq.assigned} />
          {inq.remarks && <Row label="Remarks" val={inq.remarks} />}
        </StageCard>

        {/* 2 — Valuation */}
        <StageCard title="Valuation" icon="fa-magnifying-glass-dollar" color="#8b5cf6"
          active={!!val} navPath={val ? '/valuation' : null}>
          {val ? <>
            <Row label="Val ID"      val={val.valId} />
            <Row label="Date"        val={fmtDate(val.v_date || val.date)} />
            <Row label="KM"          val={val.v_km ? `${Number(val.v_km).toLocaleString('en-IN')} km` : ''} />
            <Row label="Engine"      val={val.v_eng} />
            <Row label="Tyres"       val={val.v_tyre} />
            <Row label="Overall"     val={val.v_ovr} />
            <Row label="RC"          val={val.v_rc  ? '✅ Present' : '❌ Missing'} />
            <Row label="Service"     val={val.v_svc ? '✅ Present' : '❌ Missing'} />
            <Row label="Val Status"  val={val.v_stat} />
            {val.v_rem && <Row label="Remarks" val={val.v_rem} />}
          </> : <EmptyStage />}
        </StageCard>

        {/* 3 — Purchase Follow-Up */}
        <StageCard title="Purchase Follow-Up" icon="fa-phone-volume" color="#3b82f6"
          active={!!pfu} navPath={pfu ? '/purchase-follow' : null}>
          {pfu ? <>
            <Row label="PFU ID"      val={pfu.pfuId || pfu.pfId} />
            <Row label="Date"        val={fmtDate(pfu.pf_date)} />
            <Row label="Status"      val={pfu.pf_stat} />
            <Row label="Follow-Ups"  val={pfu.followUps?.length ? `${pfu.followUps.length} entries` : ''} />
            {lastFu && <>
              <Row label="Last Date"   val={fmtDate(lastFu.date)} />
              <Row label="Last Status" val={lastFu.stat} />
              <Row label="Last Offer"  val={lastFu.offer    ? fmt(lastFu.offer)    : ''} />
              <Row label="Deal Price"  val={lastFu.dealPrice ? fmt(lastFu.dealPrice) : ''} />
              <Row label="Executive"   val={lastFu.exec} />
              <Row label="Next F/U"    val={fmtDate(lastFu.nfd || lastFu.nextFU)} />
            </>}
          </> : <EmptyStage />}
        </StageCard>

        {/* 4 — Documents */}
        <StageCard title="Documents" icon="fa-file-contract" color="#f59e0b"
          active={!!doc} navPath={doc ? '/purchase-documents' : null}>
          {doc ? <>
            <Row label="DOC ID"    val={doc.docId} />
            <Row label="Date"      val={doc.dc_date || fmtDate(doc.date)} />
            <Row label="Status"    val={doc.dc_stat} />
            <Row label="RC"        val={doc.dc_rc  ? '✅' : '❌'} />
            <Row label="Insurance" val={doc.dc_ins ? '✅' : '❌'} />
            <Row label="PUC"       val={doc.dc_puc ? '✅' : '❌'} />
            <Row label="PAN"       val={doc.dc_pan ? '✅' : '❌'} />
            <Row label="Aadhaar"   val={doc.dc_adh ? '✅' : '❌'} />
            <Row label="Form 29"   val={doc.dc_f29 ? '✅' : '❌'} />
            <Row label="Form 30"   val={doc.dc_f30 ? '✅' : '❌'} />
            <Row label="NOC"       val={doc.dc_noc ? '✅' : '❌'} />
            <Row label="Spare Key" val={doc.dc_key ? '✅' : '❌'} />
            {doc.dc_verby && <Row label="Verified By" val={doc.dc_verby} />}
          </> : <EmptyStage />}
        </StageCard>

        {/* 5 — Order Booking */}
        <StageCard title="Order Booking" icon="fa-file-pen" color="#7c3aed"
          active={!!ob} navPath={ob ? '/purchase-booking' : null}>
          {ob ? <>
            <Row label="OB ID"      val={ob.obId} />
            <Row label="Date"       val={fmtDate(ob.ob_date || ob.date)} />
            <Row label="Branch"     val={ob.ob_branch} />
            <Row label="Client"     val={ob.ob_cname} />
            <Row label="Model"      val={ob.ob_mm} />
            <Row label="Reg No."    val={ob.ob_regn} />
            <Row label="Chassis"    val={ob.ob_chas} />
            <Row label="Engine"     val={ob.ob_eng} />
            <Row label="Purchase ₹" val={fmt(ob.ob_pp)} />
            <Row label="RTO"        val={ob.ob_rto ? `- ₹${Number(ob.ob_rto).toLocaleString('en-IN')}` : ''} />
            <Row label="TCP"        val={fmt(Number(ob.ob_pp||0) - Number(ob.ob_rto||0))} />
            <Row label="Token"      val={fmt(ob.ob_token)} />
            <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'OB Form',  fn: () => printObBooking(ob) },
                { label: 'DN (àª—à«àªœ)', fn: () => printDnGuj(ob)     },
                { label: 'DN (Eng)', fn: () => printDnEng(ob)     },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn} style={{
                  background: 'rgba(124,58,237,.1)', color: '#7c3aed',
                  border: '1px solid rgba(124,58,237,.25)', borderRadius: 4,
                  padding: '4px 9px', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <i className="fa fa-print" style={{ fontSize: 9 }}></i> {label}
                </button>
              ))}
            </div>
          </> : <EmptyStage />}
        </StageCard>

        {/* 6 — Purchase Closer */}
        <StageCard title="Purchase Closer" icon="fa-handshake" color="#06b6d4"
          active={!!pcl} navPath={pcl ? '/purchase-closer' : null}>
          {pcl ? <>
            <Row label="PCL ID"       val={pcl.pclId} />
            <Row label="Date"         val={fmtDate(pcl.pc_date || pcl.date)} />
            <Row label="Agreed Price" val={fmt(agreedPrice)} />
            <Row label="Token Paid"   val={fmt(pcl.pc_tok)} />
            <Row label="Total Paid"   val={fmt(paidTotal)} />
            <Row label="Balance"      val={balance > 0 ? fmt(balance) : '✅ Cleared'} />
            <Row label="Pay Status"   val={balance <= 0 ? 'Paid in Full' : 'Pending'} />
            {Array.isArray(pcl.payments) && pcl.payments.length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 5, letterSpacing: .5 }}>PAYMENTS</div>
                {pcl.payments.map((pmt, idx) => (
                  <div key={idx} style={{
                    background: 'var(--surface)', borderRadius: 5,
                    padding: '6px 8px', marginBottom: 5,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                      <span style={{ fontWeight: 700 }}>
                        #{idx + 1} · {pmt.mode || 'CASH'} · ₹{Number(pmt.amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: pmt.status === 'Done' ? '#22c55e' : '#f59e0b',
                      }}>
                        {pmt.status || 'Pending'}
                      </span>
                    </div>
                    {pmt.date && (
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{fmtDate(pmt.date)}</div>
                    )}
                    {pmt.remarks && (
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{pmt.remarks}</div>
                    )}
                    <button
                      onClick={() => printPclVoucher(pmt, pcl, idx)}
                      style={{
                        marginTop: 5, background: 'rgba(6,182,212,.08)', color: '#06b6d4',
                        border: '1px solid rgba(6,182,212,.2)', borderRadius: 4,
                        padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      <i className="fa fa-print" style={{ fontSize: 9 }}></i> Preview Voucher
                    </button>
                  </div>
                ))}
              </div>
            )}
          </> : <EmptyStage />}
        </StageCard>

        {/* 6 — Car Stock */}
        <StageCard title="Car Stock" icon="fa-warehouse" color="#22c55e"
          active={!!stk} navPath={stk ? '/stock' : null}>
          {stk ? <>
            <Row label="STK ID"        val={stk.stkId} />
            <Row label="Status"        val={stk.status} />
            <Row label="Reg No."       val={stk.regNo} />
            <Row label="Purchase Date" val={fmtDate(stk.pDate)} />
            <Row label="Days in Stock" val={stk.pDate ? `${ageDays(stk.pDate)} days` : ''} />
            <Row label="TCP"           val={fmt(stk.tcp)} />
            <Row label="Selling Price" val={fmt(stk.sp || stk.sk_sp)} />
            <Row label="Profit"        val={stk.profit ? fmt(stk.profit) : ''} />
          </> : <EmptyStage />}
        </StageCard>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
const PurchaseSearch = () => {
  const { data, refresh } = useData();
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [expandedId, setExpandedId]   = useState(null);
  const [resumeTarget, setResumeTarget] = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Build one aggregate object per inquiry */
  const aggregated = useMemo(() => (data.pur_inq || []).map(inq => {
    const id  = inq.inqId || inq.id;
    const val = (data.val || []).find(v => v.v_inqid === id);
    const pfu = (data.pfu || []).find(p => p.pf_inqid === id);
    const pcl = (data.pcl || []).find(p => (p.pc_inqid || p.inqId) === id);
    const ob  = (data.ob  || []).find(o => (o.ob_inqid || o.inqId) === id);
    const doc = (data.doc || []).find(d => (d.dc_obid  || d.inqId) === id);
    const stk = (data.stk || []).find(s => s.inqId === id);
    return { inq, val, pfu, pcl, ob, doc, stk, id };
  }), [data]);

  /* Search + stage filter */
  const filtered = useMemo(() => aggregated.filter(({ inq, stk }) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (inq.inqId      || '').toLowerCase().includes(q) ||
      (inq.sellerName || '').toLowerCase().includes(q) ||
      (inq.regNo      || '').toLowerCase().includes(q) ||
      (inq.mobile     || '').includes(q) ||
      (stk?.regNo     || '').toLowerCase().includes(q) ||
      (inq.make       || '').toLowerCase().includes(q);
    const matchStage = !stageFilter || (inq.stage || 'Inquiry') === stageFilter;
    return matchSearch && matchStage;
  }), [aggregated, search, stageFilter]);

  /* KPIs */
  const total  = aggregated.length;
  const won    = aggregated.filter(({ inq }) => inq.stage === 'Stock' || inq.status === 'Closed-Won').length;
  const lost   = aggregated.filter(({ inq }) => inq.status === 'Closed-Lost').length;
  const active = total - won - lost;

  /* ── Permanently delete inquiry + all linked records ── */
  const handleDelete = async (row, e) => {
    e.stopPropagation();
    const { inq, val, pfu, doc, pcl, ob, stk } = row;
    const linked = [val && 'Valuation', pfu && 'Follow-Up', doc && 'Documents',
      pcl && 'Closer', ob && 'Order Booking', stk && 'Stock'].filter(Boolean);
    const msg = `Permanently delete ALL data for:\n\n${inq.inqId} — ${inq.sellerName}\n${inq.make} ${inq.model}`
      + (linked.length ? `\n\nAlso deletes: ${linked.join(', ')}` : '')
      + '\n\nThis CANNOT be undone.';
    if (!await window.confirm(msg)) return;
    try {
      await Promise.all([
        deleteRecord('pur_inq', inq.id),
        val && deleteRecord('val', val.id),
        pfu && deleteRecord('pfu', pfu.id),
        doc && deleteRecord('doc', doc.id),
        pcl && deleteRecord('pcl', pcl.id),
        ob  && deleteRecord('ob',  ob.id),
        stk && deleteRecord('stk', stk.id),
      ].filter(Boolean));
      await Promise.all([
        refresh('pur_inq'), refresh('val'), refresh('pfu'),
        refresh('doc'), refresh('pcl'), refresh('ob'), refresh('stk'),
      ]);
      showToast(`${inq.inqId} and all linked records deleted.`, 'info');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  /* ── Resume modal ── */
  const handleResumeClick = (row, e) => {
    e.stopPropagation();
    const lastStage = getLastReached(row);
    const idMap = {
      '/stock':            row.stk?.id,
      '/purchase-closer':  row.pcl?.id,
      '/purchase-booking': row.ob?.id,
      '/purchase-documents':        row.doc?.id,
      '/purchase-follow':  row.pfu?.id,
      '/valuation':        row.val?.id,
      '/purchase-inquiry': row.inq?.id,
    };
    setResumeTarget({ ...row, lastStage, autoOpenId: idMap[lastStage.path] });
  };

  const handleContinue = () => {
    if (!resumeTarget) return;
    navigate(
      resumeTarget.lastStage.path,
      resumeTarget.autoOpenId ? { state: { autoOpenId: resumeTarget.autoOpenId } } : undefined
    );
    setResumeTarget(null);
  };

  const handleStartOver = async () => {
    if (!resumeTarget) return;
    const { inq } = resumeTarget;
    if (!await window.confirm(
      `Reset ${inq.inqId} back to Inquiry stage?\n\nLinked stage records (Valuation, Follow-Up, etc.) are kept but the inquiry stage resets to 'Inquiry'.`
    )) return;
    try {
      await updateRecord('pur_inq', inq.id, { stage: 'Inquiry' });
      await refresh('pur_inq');
      setResumeTarget(null);
      showToast('Inquiry reset to Inquiry stage.', 'info');
      navigate('/purchase-inquiry');
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="page on" id="pg_pur_search">
      {toast && (
        <div className="toast-wrap">
          <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <ResumeModal
        target={resumeTarget}
        onContinue={handleContinue}
        onStartOver={handleStartOver}
        onClose={() => setResumeTarget(null)}
      />

      {/* ── Page Header ─────────────────────────────── */}
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#f97316,#7c3aed)' }}>
              <i className="fa fa-magnifying-glass"></i>
            </div>
            Purchase Pipeline Search
          </h1>
          <p>Track every inquiry across the full pipeline — INQ → VAL → FU → DOC → PCL → STK</p>
        </div>
        <div className="ph-actions">
          <input
            className="srch"
            placeholder="🔍 INQ ID / Seller Name / Reg No…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <select className="flt" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            <option value="Inquiry">Inquiry</option>
            <option value="Valuation">Valuation</option>
            <option value="Purchase FollowUp">Follow-Up</option>
            <option value="Closer">Closer</option>
            <option value="OrderBooking">Order Booking</option>
            <option value="Stock">In Stock</option>
          </select>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'Total Inquiries', val: total,  color: '#f97316', icon: 'fa-list'         },
          { lbl: 'Active',          val: active, color: '#3b82f6', icon: 'fa-circle-notch' },
          { lbl: 'Closed-Won',      val: won,    color: '#22c55e', icon: 'fa-check-circle' },
          { lbl: 'Closed-Lost',     val: lost,   color: '#ef4444', icon: 'fa-xmark-circle' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Pipeline Legend ──────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginRight: 4 }}>PIPELINE:</span>
        {PIPE.map((s, i) => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 5,
              background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}40`,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <i className={`fa ${s.icon}`} style={{ fontSize: 9 }}></i>{s.title}
            </span>
            {i < PIPE.length - 1 && (
              <i className="fa fa-arrow-right" style={{ fontSize: 9, color: 'var(--text3)', opacity: .5 }}></i>
            )}
          </span>
        ))}
      </div>

      {/* ── Main Table ───────────────────────────────── */}
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">
            <i className="fa fa-magnifying-glass" style={{ color: 'var(--or1)' }}></i>
            {' '}All Purchase Inquiries
            <span style={{
              background: 'var(--or1)', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8,
            }}>{filtered.length}</span>
          </div>
          <div className="tc-acts" style={{ fontSize: 11, color: 'var(--text3)' }}>
            Click any row to expand full stage details · Use Edit buttons inside to navigate each stage
          </div>
        </div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 24 }}></th>
                <th>INQ ID</th>
                <th>Date</th>
                <th>Seller Name</th>
                <th>Mobile</th>
                <th>Vehicle</th>
                <th>Reg No.</th>
                <th>Pipeline Progress</th>
                <th>Age</th>
                <th style={{ minWidth: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(({ inq, val, pfu, pcl, ob, doc, stk, id }) => {
                const isExpanded = expandedId === id;
                const reached = {
                  inq: true,
                  val: !!val,
                  pfu: !!pfu,
                  doc: !!doc,
                  ob: !!ob,
                  pcl: !!pcl,
                  stk: !!stk,
                };
                const days  = inq.date ? ageDays(inq.date) : null;
                const regNo = inq.regNo || stk?.regNo || '—';
                const row   = { inq, val, pfu, pcl, ob, doc, stk, id };

                return (
                  <Fragment key={id}>
                    <tr
                      style={{
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(249,115,22,.04)' : undefined,
                        borderLeft: `3px solid ${isExpanded ? '#f97316' : 'transparent'}`,
                        transition: 'background .15s',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                    >
                      <td>
                        <i className={`fa fa-chevron-${isExpanded ? 'down' : 'right'}`}
                          style={{ fontSize: 9, color: isExpanded ? 'var(--or1)' : 'var(--text3)' }} />
                      </td>
                      <td style={{
                        fontWeight: 700, color: 'var(--or1)',
                        fontFamily: "'Space Grotesk',sans-serif", fontSize: 11,
                      }}>
                        {inq.inqId || inq.id?.slice(0, 12)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(inq.date)}</td>
                      <td style={{ fontWeight: 600 }}>{inq.sellerName || '—'}</td>
                      <td>
                        {inq.mobile ? (
                          <a href={`tel:${inq.mobile}`} onClick={e => e.stopPropagation()}
                            style={{ color: 'var(--info)', textDecoration: 'none', fontSize: 12 }}>
                            {inq.mobile}
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{inq.make} {inq.model}</span>
                        {inq.year && (
                          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>
                            {inq.year}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: 'var(--or1)' }}>
                        {regNo}
                      </td>
                      <td><PipelineChecklist reached={reached} /></td>
                      <td>
                        {days !== null ? (
                          <span style={{
                            fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
                            background: days > 60 ? 'rgba(239,68,68,.1)' : days > 30 ? 'rgba(245,158,11,.1)' : 'rgba(34,197,94,.1)',
                            color:      days > 60 ? '#ef4444'            : days > 30 ? '#f59e0b'              : '#22c55e',
                          }}>{days}d</span>
                        ) : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            title="Resume / Continue Inquiry"
                            onClick={e => handleResumeClick(row, e)}
                            style={{
                              background: 'rgba(249,115,22,.1)', color: 'var(--or1)',
                              border: 'none', borderRadius: 5, width: 28, height: 28,
                              cursor: 'pointer', fontSize: 11,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            <i className="fa fa-rotate-right"></i>
                          </button>
                          <button
                            title="Permanently Delete All Records"
                            onClick={e => handleDelete(row, e)}
                            style={{
                              background: 'rgba(239,68,68,.1)', color: '#ef4444',
                              border: 'none', borderRadius: 5, width: 28, height: 28,
                              cursor: 'pointer', fontSize: 11,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="10" style={{ padding: 0 }}>
                          <ExpansionPanel inq={inq} val={val} pfu={pfu} pcl={pcl} ob={ob} doc={doc} stk={stk} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              }) : (
                <tr>
                  <td colSpan="10" className="empty">
                    <i className="fa fa-magnifying-glass" style={{ fontSize: 32, marginBottom: 8, display: 'block' }}></i>
                    {search || stageFilter ? 'No inquiries match your search.' : 'No purchase inquiries found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">Showing {filtered.length} of {total} inquiries</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSearch;

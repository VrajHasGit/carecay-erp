import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { autoFillFromOb, autoFillFromSob } from '../../utils/relations';
import { today, printDocument } from '../../utils/helpers';

export const PayModal = ({ isOpen, onClose, onSave, onSuccess, editData, quickId, type }) => {
  const emptyForm = {
    py_inqid: '',
    py_obid: '',
    py_sobid: '',
    py_name: '',
    py_contact: '',
    py_regn: '',
    py_mm: '',
    py_finbank: '',
    py_finamt: '',
    py_date: today(),
    py_type: 'Full Payment',
    py_mode: 'NEFT',
    py_ref: '',
    py_bank: '',
    py_pto: '',
    py_pby: 'Admin',
    py_amt: '',
    py_total: '',
    py_prev: '',
    py_hold: '',
    py_auth: 'Admin',
    py_rem: ''
  };

  const [formData, setFormData] = useState(emptyForm);
  const [autoFillMsg, setAutoFillMsg] = useState('');

  const fillFromOb = async (obId) => {
    if (!obId) return;
    const data = await autoFillFromOb(obId);
    if (data) {
      setFormData(prev => ({
        ...prev,
        py_inqid: data.ob_inqid || data.inqId || prev.py_inqid,
        py_name: data.ob_cname || data.sellerName || prev.py_name,
        py_contact: data.ob_cont || data.mobile || prev.py_contact,
        py_regn: data.ob_regn || data.regNo || prev.py_regn,
        py_mm: data.ob_mm || data.make || prev.py_mm,
        py_total: data.tcp || data.ob_tcp || data.ob_pp || data.pp || prev.py_total,
        py_type: 'Purchase', // Auto-set for purchase
      }));
      setAutoFillMsg('⚡ Auto-filled from Purchase Booking');
      setTimeout(() => setAutoFillMsg(''), 3000);
    }
  };

  const fillFromSob = async (sobId) => {
    if (!sobId) return;
    const data = await autoFillFromSob(sobId);
    if (data) {
      setFormData(prev => ({
        ...prev,
        py_inqid: data.sob_inqid || data.inqId || prev.py_inqid,
        py_name: data.sob_cname || data.buyerName || prev.py_name,
        py_contact: data.sob_cont || data.mobile || prev.py_contact,
        py_regn: data.sob_regn || data.regNo || prev.py_regn,
        py_mm: data.sob_mm || data.make || prev.py_mm,
        py_total: data.sob_total || data.totalAmt || prev.py_total,
        py_finbank: data.sob_finbank || prev.py_finbank,
        py_finamt: data.sob_finamt || prev.py_finamt,
        py_type: 'Sale', // Auto-set for sale
      }));
      setAutoFillMsg('⚡ Auto-filled from Sales Booking');
      setTimeout(() => setAutoFillMsg(''), 3000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({ ...emptyForm, ...editData });
      } else if (quickId) {
        const initData = { ...emptyForm, py_date: today() };
        if (type === 'sale') {
          initData.py_sobid = quickId;
          initData.py_type = 'Sale';
          setFormData(initData);
          fillFromSob(quickId);
        } else {
          initData.py_obid = quickId;
          initData.py_type = 'Purchase';
          setFormData(initData);
          fillFromOb(quickId);
        }
      } else {
        setFormData({ ...emptyForm });
      }
    }
  }, [isOpen, editData, quickId, type]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePrintVechanKhat = async () => {
    let ob = {};
    if (formData.py_obid) {
      ob = (await autoFillFromOb(formData.py_obid)) || {};
    } else if (formData.py_sobid) {
      ob = (await autoFillFromSob(formData.py_sobid)) || {};
    }

    const sellerName  = ob.ob_cname || ob.client || formData.py_name || '____________________';
    const buyerName   = 'CARECAY PVT. LTD.';
    const buyerAddr   = 'Mumatpura Road, Off. S. G. Highway, Nr. Cafe De Italiano, Ahmedabad-(380058)';
    const address     = ob.ob_addr || ob.address || '_____________________';
    const contact     = ob.ob_cont || ob.contact || '___________';
    const regNo       = ob.ob_regn || ob.regNo || formData.py_regn || '____________________';
    const make        = ob.ob_mm || ob.mm || formData.py_mm || '____________________';
    const chassis     = ob.ob_chas || ob.chassis || '____________________';
    const engine      = ob.ob_eng || ob.engine || '____________________';
    const year        = ob.ob_year || ob.year || '____';
    const fuel        = ob.ob_fuel || ob.fuel || '____';
    const color       = ob.ob_color || ob.color || '____';
    const km          = ob.ob_km ? Number(ob.ob_km).toLocaleString('en-IN') : (ob.km ? Number(ob.km).toLocaleString('en-IN') : '____');
    const owners      = ob.ob_ownt || ob.ownerType || '____';
    const insType     = ob.ob_instype || ob.insType || '—';
    const insVal      = ob.ob_insval || ob.insVal || '';
    const rtoName     = ob.ob_rtoname || ob.rtoName || '—';
    const hpa         = ob.ob_hpa || ob.hpa || '—';

    const totalAmt    = Number(formData.py_total) || Number(ob.ob_total) || Number(ob.total) || 0;
    const paidAmt     = Number(formData.py_amt) || 0;
    const prevPaid    = Number(formData.py_prev) || 0;
    const balance     = totalAmt - prevPaid - paidAmt;
    const payMode     = formData.py_mode || '____';
    const payRef      = formData.py_ref || '____';
    const payBank     = formData.py_bank || '____';
    const payDate     = formData.py_date || today();
    const auth        = formData.py_auth || '____';

    const fmt2 = n => n ? '₹ '+Number(n).toLocaleString('en-IN') : '₹ 0';

    const customStyles = `
  h1.vh-title{text-align:center;font-size:18px;font-weight:900;letter-spacing:2px;border:3px solid #000;padding:8px 20px;display:inline-block;margin:0 auto 16px;background:#000;color:#fff}
  .title-row{text-align:center;margin-bottom:14px}
  .top-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
  .box{border:1.5px solid #000;padding:8px 10px;border-radius:2px}
  .box-label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:4px}
  .box-val{font-size:13px;font-weight:700}
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  td,th{border:1px solid #333;padding:5px 8px;font-size:11.5px;vertical-align:top}
  th{background:#333;color:#fff;font-size:10px;letter-spacing:1px;text-align:center;font-weight:700}
  .label{color:#555;font-size:10px}
  .total-row td{background:#000;color:#fff;font-weight:800;font-size:13px}
  .terms{font-size:10px;line-height:1.6;margin-bottom:12px;border:1px solid #ccc;padding:10px;background:#f9f9f9}
  .terms ul{padding-left:16px;margin-top:4px}
  .terms li{margin-bottom:3px}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
  .sig-box{text-align:center}
  .sig-line{border-top:1.5px solid #000;margin:0 auto;width:80%;margin-top:40px;padding-top:5px;font-size:10px;font-weight:700;letter-spacing:.5px}
  .photo-box{border:1px solid #000;width:80px;height:90px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;margin:0 auto}
`;

    const htmlContent = `
<div class="title-row"><h1 class="vh-title">વેચાણ ખત અને ડીલીવરી નોટ</h1></div>
<div class="top-grid">
  <div class="box"><div class="box-label">ગાડી નં.</div><div class="box-val">${regNo}</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div class="box"><div class="box-label">તારીખ</div><div class="box-val">${payDate}</div></div>
    <div class="box"><div class="box-label">વાર</div><div class="box-val">${new Date().toLocaleDateString('gu-IN',{weekday:'long'})||''}</div></div>
  </div>
</div>
<div class="top-grid">
  <div class="box">
    <div class="box-label">🏷️ વાહન વેચાણ આપનાર (Seller)</div>
    <div class="box-val" style="margin-top:6px">${sellerName}</div>
    <div style="margin-top:6px;font-size:11px;color:#555">સરનામું: ${address}</div>
    <div style="margin-top:4px;font-size:11px;color:#555">મો. નં.: ${contact}</div>
  </div>
  <div class="box">
    <div class="box-label">🏢 વાહન ખરીદ લેનાર (Buyer)</div>
    <div class="box-val" style="margin-top:6px">${buyerName}</div>
    <div style="margin-top:6px;font-size:10px;color:#555">${buyerAddr}</div>
    <div style="margin-top:4px;font-size:11px;color:#555">મો. નં.: ___________</div>
  </div>
</div>

<table>
  <tr><th colspan="6">🚗 વાહન વિગત (Vehicle Details)</th></tr>
  <tr>
    <td class="label">મેક/મોડેલ</td><td><b>${make}</b></td>
    <td class="label">રજી. નં.</td><td><b>${regNo}</b></td>
    <td class="label">વર્ષ</td><td><b>${year}</b></td>
  </tr>
  <tr>
    <td class="label">ચેસિસ નં.</td><td>${chassis}</td>
    <td class="label">એન્જિન નં.</td><td>${engine}</td>
    <td class="label">ઇંધણ</td><td>${fuel}</td>
  </tr>
  <tr>
    <td class="label">રંગ</td><td>${color}</td>
    <td class="label">કિ.મી.</td><td>${km}</td>
    <td class="label">માલિક</td><td>${owners}</td>
  </tr>
  <tr>
    <td class="label">વીમો</td><td>${insType} ${insVal?'('+insVal+')':''}</td>
    <td class="label">RTO</td><td>${rtoName}</td>
    <td class="label">HPA</td><td>${hpa}</td>
  </tr>
</table>

<table>
  <tr><th colspan="2">💰 ચૂકવણી વિગત (Payment Details)</th></tr>
  <tr><td style="width:60%">વાહન ખરીદ કિંમત (Purchase Price)</td><td style="text-align:right"><b>${fmt2(totalAmt)}</b></td></tr>
  <tr><td>અગાઉ ચૂકવેલ (Previously Paid)</td><td style="text-align:right">${fmt2(prevPaid)}</td></tr>
  <tr><td>આ ચૂકવણી (This Payment) — ${payMode}${payRef&&payRef!=='____'?' / '+payRef:''}</td><td style="text-align:right">${fmt2(paidAmt)}</td></tr>
  <tr class="total-row"><td>બાકી બેલેન્સ (Balance Pending)</td><td style="text-align:right">${fmt2(balance)}</td></tr>
</table>

<table>
  <tr><th colspan="2">🏦 ભુગતાન માધ્યમ (Payment Mode)</th></tr>
  <tr><td style="width:40%">ભુગતાન મોડ</td><td>${payMode}</td></tr>
  <tr><td>બેન્ક / ચેક / UTR</td><td>${payBank} / ${payRef}</td></tr>
  <tr><td>અધિકૃત દ્વારા</td><td>${auth}</td></tr>
</table>

<div class="terms">
  <b>શરતો-નિયમો (Terms & Conditions):</b>
  <ul>
    <li>સદર સોદો અમો બંને પાર્ટીઓ રાજીખુશીથી સમજી વિચારી, હોશિયારીથી, બીનકદેફીણામાંથી કોઈનના ઘાક ધમકી કે દબાણ વગર કર્યો છે.</li>
    <li>સદર વાહનનું આજરોજ પહેલાનું કોઈ પ્રકારનું R.T.O., ટેક્ષ મેમો, બેન્ક/પેટીનું દેવું, પોલીસ કેસ કે સંબંધિત તમામ જવાબદારી ખરીદ-વેચનારની રહેશે.</li>
    <li>સદર વાહન અમોએ અમારી રીતે જોઈ, ટ્રાઈ કરી ખરીદ કરેલ છે — ચાલક, ડ્રાઇવર, દલાલ, વિગેરે ચારે તરફ જવાબ નહીં.</li>
    <li>સદર વાહનનો સોદો કોઈ પણ સંજોગોમાં કૅન્સલ નહીં — અને જો સોદો કૅન્સલ થશે તો બાનાની આપેલ રકમ પરત મળશે નહીં.</li>
    <li>ગાડીની ઇન્શ્યોરન્સ ટ્રાન્સફર, નવો લેવાની, ટ્રાન્સફર/ટ્રેક્સ — ખરીદ-નારની જ જવાબદારી. ગાડીના ટ્રાન્સફર માટે ટ્રેક્સ ખરીદ-નારની જ જવાબદારી.</li>
    <li>ગાડીના કિલોમીટરની કોઈ પ્રકારની જવાબદારી ક્ષેત્ર અમદાવાદ / CARECAY PVT. LTD. ની રહેશે નહીં.</li>
  </ul>
</div>

<div class="sig-grid">
  <div class="sig-box">
    <div style="font-size:11px;color:#555;margin-bottom:6px">વાહન વેચનારની સહી / Seller Signature</div>
    <div class="sig-line">વાહન વેચનારની સહી</div>
  </div>
  <div class="sig-box">
    <div style="font-size:11px;color:#555;margin-bottom:6px">વાહન લેનારની સહી / Buyer Signature</div>
    <div class="sig-line">CARECAY PVT. LTD.</div>
  </div>
</div>
<div class="sig-grid" style="margin-top:18px">
  <div class="sig-box">
    <div class="sig-line">સાક્ષીની સહી — 1</div>
  </div>
  <div class="sig-box">
    <div class="sig-line">સાક્ષીની સહી — 2</div>
  </div>
</div>
<div style="text-align:right;margin-top:20px">
  <div class="photo-box">વાહન લેનારનો ફોટો</div>
</div>`;

    const title = editData?.id ? `PAY-${editData.id.slice(0,6).toUpperCase()}` : (formData.py_obid || formData.py_sobid || regNo);
    printDocument(title, htmlContent, customStyles);
  };

  const handleBlurOb = () => { if (formData.py_obid) fillFromOb(formData.py_obid); };
  const handleBlurSob = () => { if (formData.py_sobid) fillFromSob(formData.py_sobid); };

  const handleSave = async () => {
    try {
      const amt = Number(formData.py_amt) || 0;
      const total = Number(formData.py_total) || 0;
      const prev = Number(formData.py_prev) || 0;
      const bal = total - (prev + amt);
      
      const recordToSave = { 
        ...formData, 
        amount: amt, 
        total: total, 
        bal: bal,
        type: formData.py_type === 'Purchase' || formData.py_type === 'Sale' ? formData.py_type : (formData.py_sobid ? 'Sale' : 'Purchase'),
        name: formData.py_name,
        regNo: formData.py_regn,
        mode: formData.py_mode,
        status: bal <= 0 ? 'Clear' : 'Pending',
        date: formData.py_date
      };

      if (editData?.id) {
        await updateDoc(doc(db, 'pay', editData.id), recordToSave);
      } else {
        await addDoc(collection(db, 'pay'), { ...recordToSave, createdAt: new Date().toISOString() });
      }
      
      if (onSave) { await onSave(recordToSave); } 
      else if (onSuccess) { onSuccess(); } 
      else { onClose(); }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  const amt = Number(formData.py_amt) || 0;
  const total = Number(formData.py_total) || 0;
  const prev = Number(formData.py_prev) || 0;
  const bal = total - (prev + amt);

  return (
    <div className="overlay" id="m_pay">
      <div className="mbox" style={{ maxWidth: 800 }}>
        <div className="m-hdr">
          <div className="m-hdr-icon">💳</div>
          <h3>Payment Record</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          
          {autoFillMsg && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid #10B981', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoFillMsg}
            </div>
          )}

          <div style={{ background: 'rgba(255,107,0,.07)', border: '1px solid rgba(255,107,0,.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="fg" style={{ margin: 0 }}>
              <label style={{ color: 'var(--bl5)', fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}><span style={{ color: 'var(--or1)', marginRight: 4 }}>⚡</span>ORDER BOOKING ID (OB)</label>
              <input id="py_obid" name="py_obid" value={formData.py_obid} onChange={handleChange} onBlur={handleBlurOb} placeholder="OB-2026-0001" style={{ background: 'var(--bg)', border: '1px solid rgba(37,99,235,.5)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 12, width: '100%' }} />
            </div>
            <div className="fg" style={{ margin: 0 }}>
              <label style={{ color: '#059669', fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}><span style={{ color: 'var(--or1)', marginRight: 4 }}>⚡</span>SALES ORDER BOOKING ID (SOB)</label>
              <input id="py_sobid" name="py_sobid" value={formData.py_sobid} onChange={handleChange} onBlur={handleBlurSob} placeholder="SOB-2026-0001" style={{ background: 'var(--bg)', border: '1px solid rgba(5,150,105,.5)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontFamily: 'inherit', fontSize: 12, width: '100%' }} />
            </div>
          </div>

          <div className="grid3">
            <div className="fg"><label>Buyer/Seller Name</label><input name="py_name" value={formData.py_name} onChange={handleChange} placeholder="Name" /></div>
            <div className="fg"><label>Mobile</label><input name="py_contact" value={formData.py_contact} onChange={handleChange} placeholder="Contact No." /></div>
            <div className="fg"><label>Vehicle Reg No. <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="py_regn" value={formData.py_regn} onChange={handleChange} placeholder="GJ-01-AB-1234" /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Car Details <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="py_mm" value={formData.py_mm} onChange={handleChange} placeholder="Make Model" /></div>
            <div className="fg"><label>Finance Bank <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input name="py_finbank" value={formData.py_finbank} onChange={handleChange} placeholder="Bank name" /></div>
            <div className="fg"><label>Finance Amount ₹ <span style={{ color: 'var(--or1)', fontSize: 10 }}>⚡ Auto</span></label><input type="number" name="py_finamt" value={formData.py_finamt} onChange={handleChange} placeholder="0" /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Payment Date *</label><input type="date" name="py_date" value={formData.py_date} onChange={handleChange} /></div>
            <div className="fg"><label>Payment Type *</label>
              <select name="py_type" value={formData.py_type} onChange={handleChange}>
                <option value="Purchase">Purchase (Money Out)</option>
                <option value="Sale">Sale (Money In)</option>
                <option value="Token">Token</option>
                <option value="Part Payment">Part Payment</option>
                <option value="Full Payment">Full Payment</option>
                <option value="Finance Disbursement">Finance Disbursement</option>
                <option value="Refund">Refund</option>
              </select>
            </div>
            <div className="fg"><label>Payment Mode</label>
              <select name="py_mode" value={formData.py_mode} onChange={handleChange}>
                <option>Cash</option><option>NEFT</option><option>RTGS</option><option>UPI</option><option>Cheque</option><option>DD</option>
              </select>
            </div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Cheque / UTR Number</label><input name="py_ref" value={formData.py_ref} onChange={handleChange} placeholder="Reference No." /></div>
          </div>
          <div className="grid3">
            <div className="fg"><label>Bank Name</label><input name="py_bank" value={formData.py_bank} onChange={handleChange} placeholder="Bank name" /></div>
            <div className="fg"><label>Paid To</label><input name="py_pto" value={formData.py_pto} onChange={handleChange} placeholder="Receiver name / account" /></div>
            <div className="fg"><label>Paid By</label>
              <select name="py_pby" value={formData.py_pby} onChange={handleChange}>
                <option>Admin</option><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option>
              </select>
            </div>
          </div>

          <div className="sect-lbl"><i className="fa fa-calculator"></i> Amount Calculation — AUTO</div>
          <div className="grid3">
            <div className="fg"><label>Payment Amount ₹ *</label><input type="number" name="py_amt" value={formData.py_amt} onChange={handleChange} placeholder="0" /></div>
            <div className="fg"><label>Total Deal Amount ₹</label><input type="number" name="py_total" value={formData.py_total} onChange={handleChange} placeholder="0" /></div>
            <div className="fg"><label>Previously Paid ₹</label><input type="number" name="py_prev" value={formData.py_prev} onChange={handleChange} placeholder="0" /></div>
          </div>
          <div className="calc-panel">
            <div className="calc-row"><span className="cl">Total Amount</span><span>₹ {total.toLocaleString('en-IN')}</span></div>
            <div className="calc-row"><span className="cl">Previously Paid</span><span>₹ {prev.toLocaleString('en-IN')}</span></div>
            <div className="calc-row"><span className="cl">This Payment</span><span>₹ {amt.toLocaleString('en-IN')}</span></div>
            <div className="calc-row"><span style={{ color: bal > 0 ? 'var(--warn)' : 'var(--success)' }}>{bal > 0 ? 'BALANCE PENDING' : 'CLEARED'}</span><span style={{ color: bal > 0 ? 'var(--warn)' : 'var(--success)' }}>₹ {bal.toLocaleString('en-IN')}</span></div>
          </div>

          <div className="grid3" style={{ marginTop: 14 }}>
            <div className="fg"><label>Hold Payment</label><input name="py_hold" value={formData.py_hold} onChange={handleChange} placeholder="NOC / RC / Key pending?" /></div>
            <div className="fg"><label>Authorized By</label>
              <select name="py_auth" value={formData.py_auth} onChange={handleChange}>
                <option>Admin</option><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option>
              </select>
            </div>
            <div className="fg"><label>Remarks</label><input name="py_rem" value={formData.py_rem} onChange={handleChange} placeholder="Notes" /></div>
          </div>
        </div>
          <div className="m-foot">
            <button className="btn btn-bl" onClick={handlePrintVechanKhat}><i className="fa fa-file-contract"></i> વેચાણખત / Delivery Note</button>
            <button className="btn btn-out" onClick={onClose}>Cancel</button>
            <button className="btn btn-or" onClick={handleSave}><i className="fa fa-save"></i> Record Payment</button>
          </div>
      </div>
    </div>
  );
};

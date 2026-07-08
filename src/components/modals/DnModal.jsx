import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { addRecord, updateRecord, getNextCounter } from '../../services/db';
import { genId, today, printDocument } from '../../utils/helpers';

export const DnModal = ({ isOpen, onClose, onSave, editData }) => {
  const { data } = useData();

  const blank = {
    dn_obid: '', dn_id: '', dn_date: today(),
    dn_cname: '', dn_mob: '', dn_addr: '',
    dn_regn: '', dn_mm: '', dn_yrclr: '',
    dn_km: '', dn_fuel: 'Empty', dn_bat: 'Good',
    dn_keys: '1', dn_tools: 'Yes', dn_spare: 'Yes',
    dn_jack: 'Yes', dn_manual: 'Yes', dn_acc: '',
    dn_rc: 'Original', dn_ins: 'Transferred', dn_puc: 'Given',
    dn_f28: 'NA', dn_f29: 'Given', dn_f30: 'Given',
    dn_ins_exp: '', dn_puc_exp: '', dn_fc_exp: '',
    dn_by: 'Ritesh Shah', dn_stat: 'Draft', dn_rem: ''
  };

  const [formData, setFormData] = useState(blank);

  // Load editData into form
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setFormData({ ...blank, ...editData, dn_id: editData.dnId || editData.dn_id || '' });
    } else {
      setFormData({ ...blank, dn_date: today() });
    }
  }, [isOpen, editData]);

  // Auto-fill from SOB (Sales Order Booking) when Booking ID is entered
  useEffect(() => {
    const obid = (formData.dn_obid || '').trim();
    if (!obid || obid.length < 5) return;

    const sob = (data.sob || []).find(r =>
      (r.sobId || '').toLowerCase() === obid.toLowerCase()
    );

    if (sob) {
      const mm = (sob.sob_mm || `${sob.make || ''} ${sob.model || ''}`.trim()).trim();
      const yrclr = [sob.sob_year || sob.year, sob.sob_color || sob.color].filter(Boolean).join(' / ');

      setFormData(prev => ({
        ...prev,
        dn_cname:  sob.sob_cname  || sob.sob_bname  || sob.buyerName || prev.dn_cname,
        dn_mob:    sob.sob_cont   || sob.mob         || prev.dn_mob,
        dn_addr:   sob.sob_addr   || sob.addr        || prev.dn_addr,
        dn_regn:   sob.sob_regn   || sob.regNo       || prev.dn_regn,
        dn_mm:     mm             || prev.dn_mm,
        dn_yrclr:  yrclr          || prev.dn_yrclr,
        dn_km:     sob.sob_km     || sob.km          || prev.dn_km,
        dn_fuel:   sob.sob_fuel   || sob.fuel        || prev.dn_fuel,
        dn_by:     sob.sob_exec   || prev.dn_by,
      }));
      return;
    }

    // Fallback: try to match by reg no in stk
    const rn = obid.replace(/\s/g, '').toUpperCase();
    const stk = (data.stk || []).find(r =>
      ((r.sk_regn || r.regNo) || '').replace(/\s/g, '').toUpperCase() === rn
    );
    if (stk) {
      const mm = `${stk.sk_make || stk.make || ''} ${stk.sk_model || stk.model || ''}`.trim();
      const yrclr = [stk.sk_year || stk.year, stk.sk_color || stk.color].filter(Boolean).join(' / ');
      setFormData(prev => ({
        ...prev,
        dn_regn:  stk.sk_regn  || stk.regNo || prev.dn_regn,
        dn_mm:    mm            || prev.dn_mm,
        dn_yrclr: yrclr         || prev.dn_yrclr,
        dn_km:    stk.sk_km    || stk.km    || prev.dn_km,
        dn_fuel:  stk.sk_fuel  || stk.fuel  || prev.dn_fuel,
      }));
    }
  }, [formData.dn_obid, data.sob, data.stk]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const aliases = {
        buyerName: formData.dn_cname,
        customer:  formData.dn_cname,
        regNo:     formData.dn_regn,
        make:      (formData.dn_mm || '').split(' ')[0],
        model:     (formData.dn_mm || '').split(' ').slice(1).join(' '),
        handoverBy: formData.dn_by,
        status:    formData.dn_stat,
        date:      formData.dn_date || today(),
      };
      const payload = { ...formData, ...aliases };

      if (editData && editData.id) {
        await updateRecord('dn', editData.id, payload);
      } else {
        const cnt = await getNextCounter('dn');
        const dnId = genId('DN', cnt);
        await addRecord('dn', { ...payload, dnId, dn_id: dnId });
        setFormData(prev => ({ ...prev, dn_id: dnId }));
      }

      if (onSave) { await onSave({ ...payload, dnId: formData.dn_id || editData?.dnId || editData?.dn_id }); }
      else { onClose(); }
    } catch (error) {
      console.error('Error saving DN:', error);
      alert('Failed to save record.');
    }
  };

  const handlePrint = () => {
    // Date helpers for the PDF
    const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MON_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const MON_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const fmtFull = (iso) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MON_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    };
    const fmtShort = (iso) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return `${String(d.getDate()).padStart(2,'0')}-${MON_SHORT[d.getMonth()]}-${d.getFullYear()}`;
    };
    const dayName = (iso) => iso ? DAY_NAMES[new Date(iso).getDay()] : '—';

    const customStyles = `
      .section { margin-bottom: 16px; }
      .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #1A56DB; border-bottom: 1px solid #1A56DB; padding-bottom: 4px; margin-bottom: 10px; }
      .doc-title { font-size: 16px; font-weight: 700; text-align: center; background: #1A56DB; color: #fff; padding: 8px; border-radius: 4px; margin-bottom: 4px; letter-spacing: 1px; }
      .doc-subtitle { font-size: 10px; text-align: center; color: #555; margin-bottom: 14px; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #444; }
      .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .field { margin-bottom: 8px; }
      .field label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: .5px; display: block; margin-bottom: 2px; }
      .field .value { font-size: 12px; font-weight: 600; color: #111; border-bottom: 1px dotted #ccc; padding-bottom: 3px; min-height: 18px; }
      .field .value.highlight { color: #1A56DB; }
      .sign-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
      .sign-box { text-align: center; }
      .sign-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 50px; font-size: 10px; color: #555; }
      .badge-id { display: inline-block; background: #1A56DB; color: #fff; padding: 3px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; }
      .possession-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
      .possession-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1D4ED8; letter-spacing: .5px; }
      .possession-val { font-size: 13px; font-weight: 700; color: #1E40AF; }
      .possession-day { font-size: 11px; color: #3B82F6; margin-top: 2px; }
    `;

    const dnNum = formData.dn_id || formData.dnId || editData?.dnId || 'DN-Draft';

    const htmlContent = `
        <div class="doc-title">VEHICLE DELIVERY NOTE</div>
        <div class="doc-subtitle">CARECAY PRIVATE LIMITED — Used Car Dealership</div>

        <div class="info-row">
          <span>DN Number: <span class="badge-id">${dnNum}</span></span>
          ${formData.dn_obid ? `<span>Booking ID: <strong>${formData.dn_obid}</strong></span>` : ''}
          <span>Date: <strong>${fmtShort(formData.dn_date)}</strong></span>
        </div>

        <!-- Car Possession Date — prominent box -->
        <div class="possession-box">
          <div>
            <div class="possession-label">Car Possession Date</div>
            <div class="possession-val">${fmtFull(formData.dn_date)}</div>
            <div class="possession-day">Day: ${dayName(formData.dn_date)}</div>
          </div>
          <div style="text-align:right">
            <div class="possession-label">Delivered By</div>
            <div class="possession-val" style="color:#059669">${formData.dn_by || '—'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="grid">
            <div class="field"><label>Customer Name</label><div class="value">${formData.dn_cname || '—'}</div></div>
            <div class="field"><label>Mobile</label><div class="value">${formData.dn_mob || '—'}</div></div>
            <div class="field"><label>Address</label><div class="value">${formData.dn_addr || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Vehicle Details</div>
          <div class="grid">
            <div class="field"><label>Registration No.</label><div class="value highlight">${formData.dn_regn || '—'}</div></div>
            <div class="field"><label>Make / Model</label><div class="value">${formData.dn_mm || '—'}</div></div>
            <div class="field"><label>Year / Color</label><div class="value">${formData.dn_yrclr || '—'}</div></div>
          </div>
          <div class="grid">
            <div class="field"><label>KM at Delivery</label><div class="value">${formData.dn_km ? Number(formData.dn_km).toLocaleString('en-IN') + ' km' : '—'}</div></div>
            <div class="field"><label>Fuel Level</label><div class="value">${formData.dn_fuel || '—'}</div></div>
            <div class="field"><label>Battery Condition</label><div class="value">${formData.dn_bat || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Keys &amp; Accessories</div>
          <div class="grid">
            <div class="field"><label>No. of Keys</label><div class="value">${formData.dn_keys || '—'}</div></div>
            <div class="field"><label>Tool Kit</label><div class="value">${formData.dn_tools || '—'}</div></div>
            <div class="field"><label>Spare Tyre</label><div class="value">${formData.dn_spare || '—'}</div></div>
          </div>
          <div class="grid">
            <div class="field"><label>Jack</label><div class="value">${formData.dn_jack || '—'}</div></div>
            <div class="field"><label>Owner Manual</label><div class="value">${formData.dn_manual || '—'}</div></div>
            <div class="field"><label>Charger / Accessories</label><div class="value">${formData.dn_acc || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Documents Given to Buyer</div>
          <div class="grid">
            <div class="field"><label>RC Book</label><div class="value">${formData.dn_rc || '—'}</div></div>
            <div class="field"><label>Insurance</label><div class="value">${formData.dn_ins || '—'}</div></div>
            <div class="field"><label>PUC Certificate</label><div class="value">${formData.dn_puc || '—'}</div></div>
          </div>
          <div class="grid">
            <div class="field"><label>Form 28 (NOC)</label><div class="value">${formData.dn_f28 || '—'}</div></div>
            <div class="field"><label>Form 29</label><div class="value">${formData.dn_f29 || '—'}</div></div>
            <div class="field"><label>Form 30</label><div class="value">${formData.dn_f30 || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Document Expiry Dates</div>
          <div class="grid">
            <div class="field"><label>Insurance Valid Till</label><div class="value">${fmtShort(formData.dn_ins_exp)}</div></div>
            <div class="field"><label>PUC Valid Till</label><div class="value">${fmtShort(formData.dn_puc_exp)}</div></div>
            <div class="field"><label>Fitness Certificate (FC)</label><div class="value">${fmtShort(formData.dn_fc_exp)}</div></div>
          </div>
        </div>

        ${formData.dn_rem ? `<div class="section"><div class="section-title">Remarks</div><p style="font-size:12px;color:#444;margin:0">${formData.dn_rem}</p></div>` : ''}

        <div style="font-size:11px;color:#555;border-top:1px dashed #ccc;padding-top:8px;margin-top:8px">
          I hereby acknowledge that I have received the above vehicle and all mentioned items/documents in satisfactory condition on
          <strong>${fmtFull(formData.dn_date)}</strong>.
        </div>

        <div class="sign-section">
          <div class="sign-box"><div class="sign-line">Customer Signature &amp; Date<br><span style="font-size:9px;color:#888">${formData.dn_cname || ''}</span></div></div>
          <div class="sign-box"><div class="sign-line">Authorised Signatory<br><span style="font-size:9px;color:#888">${formData.dn_by || 'Carecay Pvt. Ltd.'}</span></div></div>
        </div>
    `;

    printDocument(dnNum, htmlContent, customStyles);
  };

  return (
    <div className="overlay" id="m_dn">
 <div className="mbox" style={{"maxWidth":"860px"}}>
  <div className="m-hdr"><div className="m-hdr-icon">📋</div><h3>Delivery Note</h3><button className="m-close" onClick={onClose}>✕</button></div>
  <div className="m-body">
   <div style={{"background":"rgba(8,145,178,.1)","border":"1px solid rgba(8,145,178,.3)","borderRadius":"8px","padding":"10px 14px","marginBottom":"14px","fontSize":"12px","color":"#67E8F9"}}>
    <i className="fa fa-bolt" style={{"color":"var(--or1)"}}></i> Booking ID (SOB-...) dalo → Customer, Vehicle auto-fill ho jayega
   </div>
   <div className="grid3">
    <div className="fg"><label>Booking ID <span style={{"color":"var(--or1)","fontSize":"10px"}}>⚡ Auto-Fill</span></label><input id="dn_obid" name="dn_obid" value={formData['dn_obid'] || ''} onChange={handleChange} placeholder="SOB-2025-0001"  /></div>
    <div className="fg"><label>DN Number</label><input id="dn_id" name="dn_id" value={formData['dn_id'] || ''} onChange={handleChange} placeholder="Auto-generated" readOnly style={{"background":"var(--surface2)","color":"var(--text2)"}} /></div>
    <div className="fg"><label>Date *</label><input type="date" id="dn_date" name="dn_date" value={formData['dn_date'] || ''} onChange={handleChange} /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Customer Name</label><input id="dn_cname" name="dn_cname" value={formData['dn_cname'] || ''} onChange={handleChange} placeholder="Full name" /></div>
    <div className="fg"><label>Mobile</label><input id="dn_mob" name="dn_mob" value={formData['dn_mob'] || ''} onChange={handleChange} placeholder="10-digit mobile" maxLength="10" /></div>
    <div className="fg"><label>Address</label><input id="dn_addr" name="dn_addr" value={formData['dn_addr'] || ''} onChange={handleChange} placeholder="Customer address" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>Registration No.</label><input id="dn_regn" name="dn_regn" value={formData['dn_regn'] || ''} onChange={handleChange} placeholder="GJ-01-AB-1234" style={{"fontWeight":"700","color":"var(--or2)"}} /></div>
    <div className="fg"><label>Make / Model</label><input id="dn_mm" name="dn_mm" value={formData['dn_mm'] || ''} onChange={handleChange} placeholder="Maruti Swift VXI" /></div>
    <div className="fg"><label>Year / Color</label><input id="dn_yrclr" name="dn_yrclr" value={formData['dn_yrclr'] || ''} onChange={handleChange} placeholder="2020 / White" /></div>
   </div>
   <div className="grid3">
    <div className="fg"><label>KM at Delivery</label><input type="number" id="dn_km" name="dn_km" value={formData['dn_km'] || ''} onChange={handleChange} placeholder="52000" /></div>
    <div className="fg"><label>Fuel Level</label><select id="dn_fuel" name="dn_fuel" value={formData['dn_fuel'] || ''} onChange={handleChange}><option>Empty</option><option>1/4</option><option>1/2</option><option>3/4</option><option>Full</option></select></div>
    <div className="fg"><label>Battery Condition</label><select id="dn_bat" name="dn_bat" value={formData['dn_bat'] || ''} onChange={handleChange}><option>Good</option><option>Weak</option><option>New</option></select></div>
   </div>
   <fieldset style={{"border":"1px solid rgba(255,255,255,.1)","borderRadius":"8px","padding":"12px","marginBottom":"12px"}}>
    <legend style={{"color":"var(--or1)","fontSize":"11px","fontWeight":"700","padding":"0 8px"}}>KEYS &amp; ACCESSORIES</legend>
    <div className="grid3">
     <div className="fg"><label>No. of Keys</label><select id="dn_keys" name="dn_keys" value={formData['dn_keys'] || ''} onChange={handleChange}><option>1</option><option>2</option><option>3</option></select></div>
     <div className="fg"><label>Tool Kit</label><select id="dn_tools" name="dn_tools" value={formData['dn_tools'] || ''} onChange={handleChange}><option>Yes</option><option>No</option><option>Partial</option></select></div>
     <div className="fg"><label>Spare Tyre</label><select id="dn_spare" name="dn_spare" value={formData['dn_spare'] || ''} onChange={handleChange}><option>Yes</option><option>No</option></select></div>
    </div>
    <div className="grid3">
     <div className="fg"><label>Jack</label><select id="dn_jack" name="dn_jack" value={formData['dn_jack'] || ''} onChange={handleChange}><option>Yes</option><option>No</option></select></div>
     <div className="fg"><label>Owner Manual</label><select id="dn_manual" name="dn_manual" value={formData['dn_manual'] || ''} onChange={handleChange}><option>Yes</option><option>No</option></select></div>
     <div className="fg"><label>Charger / Accessories</label><input id="dn_acc" name="dn_acc" value={formData['dn_acc'] || ''} onChange={handleChange} placeholder="Mat, Sunfilm, etc." /></div>
    </div>
   </fieldset>
   <fieldset style={{"border":"1px solid rgba(255,255,255,.1)","borderRadius":"8px","padding":"12px","marginBottom":"12px"}}>
    <legend style={{"color":"var(--or1)","fontSize":"11px","fontWeight":"700","padding":"0 8px"}}>DOCUMENTS GIVEN TO BUYER</legend>
    <div className="grid3">
     <div className="fg"><label>RC Book</label><select id="dn_rc" name="dn_rc" value={formData['dn_rc'] || ''} onChange={handleChange}><option>Original</option><option>Smart Card</option><option>Pending</option></select></div>
     <div className="fg"><label>Insurance</label><select id="dn_ins" name="dn_ins" value={formData['dn_ins'] || ''} onChange={handleChange}><option>Transferred</option><option>New Policy</option><option>Pending</option></select></div>
     <div className="fg"><label>PUC Certificate</label><select id="dn_puc" name="dn_puc" value={formData['dn_puc'] || ''} onChange={handleChange}><option>Given</option><option>Pending</option></select></div>
    </div>
    <div className="grid3">
     <div className="fg"><label>Form 28 (NOC)</label><select id="dn_f28" name="dn_f28" value={formData['dn_f28'] || ''} onChange={handleChange}><option>Given</option><option>NA</option><option>Pending</option></select></div>
     <div className="fg"><label>Form 29</label><select id="dn_f29" name="dn_f29" value={formData['dn_f29'] || ''} onChange={handleChange}><option>Given</option><option>Pending</option></select></div>
     <div className="fg"><label>Form 30</label><select id="dn_f30" name="dn_f30" value={formData['dn_f30'] || ''} onChange={handleChange}><option>Given</option><option>Pending</option></select></div>
    </div>
   </fieldset>
   <fieldset style={{"border":"1px solid rgba(255,255,255,.1)","borderRadius":"8px","padding":"12px","marginBottom":"12px"}}>
    <legend style={{"color":"var(--or1)","fontSize":"11px","fontWeight":"700","padding":"0 8px"}}>DOCUMENT EXPIRY DATES</legend>
    <div className="grid3">
     <div className="fg"><label>Insurance Valid Till</label><input type="date" id="dn_ins_exp" name="dn_ins_exp" value={formData['dn_ins_exp'] || ''} onChange={handleChange} /></div>
     <div className="fg"><label>PUC Valid Till</label><input type="date" id="dn_puc_exp" name="dn_puc_exp" value={formData['dn_puc_exp'] || ''} onChange={handleChange} /></div>
     <div className="fg"><label>Fitness Certificate (FC)</label><input type="date" id="dn_fc_exp" name="dn_fc_exp" value={formData['dn_fc_exp'] || ''} onChange={handleChange} /></div>
    </div>
   </fieldset>
   <div className="grid3">
    <div className="fg"><label>Delivered By</label><select id="dn_by" name="dn_by" value={formData['dn_by'] || ''} onChange={handleChange}><option>Ritesh Shah</option><option>Rajan Desai</option><option>Kalpesh Joshi</option><option>Marut Dandawala</option><option>Isha Dashraniya</option><option>Pinal Desai</option><option>Mittal Mehta</option><option>Amisha Dave</option><option>Dipti</option></select></div>
    <div className="fg"><label>Status</label><select id="dn_stat" name="dn_stat" value={formData['dn_stat'] || ''} onChange={handleChange}><option>Draft</option><option>Issued</option><option>Signed</option></select></div>
    <div className="fg"><label>Remarks</label><input id="dn_rem" name="dn_rem" value={formData['dn_rem'] || ''} onChange={handleChange} placeholder="Notes / pending items" /></div>
   </div>
  </div>
  <div className="m-foot">
   <button className="btn btn-out" onClick={onClose}>Cancel</button>
   <button className="btn btn-bl" onClick={handlePrint}><i className="fa fa-print"></i> Print</button>
   <button className="btn btn-or" onClick={handleSave}><i className="fa fa-save"></i> Save</button>
  </div>
 </div>
</div>
  );
};

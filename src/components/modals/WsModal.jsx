import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { autoFillFromInq, autoFillFromStock, autoFillFromStockId, autoFillFromVal } from '../../utils/relations';
import { MAKES, MODELS } from '../../utils/constants';

const DISABLED_STYLE = { background: 'var(--surface2)', cursor: 'not-allowed', opacity: 0.8 };

export const WsModal = ({ isOpen, onClose, onSave, onSuccess, editData, quickInqId, quickDocId, stockDocId, stockIdForWs }) => {
  const [formData, setFormData] = useState({
    ws_stkid: "", ws_inqid: "", ws_vnum: "", ws_indate: "", ws_km: "", ws_make: "",
    ws_model: "", ws_cname: "", ws_cont: "", ws_wtype: "General Service",
    ws_tech: "", ws_manager: "", ws_parts: "", ws_pstat: "Pending", ws_jstat: "Open", ws_del: "",
    ws_qc: "", ws_act: "", ws_rem: "", ws_dp: [], ws_mw: [], ws_val_refurb: ""
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        const properMake = MAKES.find(m => m.toLowerCase() === (editData.ws_make || '').toLowerCase()) || editData.ws_make || '';
        const properModel = (MODELS[properMake] || []).find(m => m.toLowerCase() === (editData.ws_model || '').toLowerCase()) || editData.ws_model || '';
        const toTitleCase = (str) => {
          if (!str) return str;
          return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        };
        setFormData({
          ...editData,
          ws_make: properMake,
          ws_model: properModel,
          ws_dp: editData.ws_dp || [],
          ws_mw: editData.ws_mw || [],
          ws_manager: editData.ws_manager || "",
          ws_val_refurb: editData.ws_val_refurb || "",
          ws_pstat: toTitleCase(editData.ws_pstat || editData.pStat || "Pending"),
          ws_jstat: toTitleCase(editData.ws_jstat || editData.jStat || "Open")
        });
        setModelOptions(MODELS[properMake] || []);
        
        const locks = new Set();
        if (editData.ws_stkid) locks.add('ws_stkid');
        if (editData.ws_inqid) locks.add('ws_inqid');
        if (editData.ws_vnum) locks.add('ws_vnum');
        if (editData.ws_make) locks.add('ws_make');
        if (editData.ws_model) locks.add('ws_model');
        if (editData.ws_km) locks.add('ws_km');
        if (editData.ws_cname) locks.add('ws_cname');
        if (editData.ws_cont) locks.add('ws_cont');
        if (editData.ws_del) locks.add('ws_del');
        setPrefilled(locks);

        if (editData.ws_inqid && !editData.ws_val_refurb) {
          autoFillFromVal(editData.ws_inqid).then(valData => {
            if (valData && valData.v_ref_cost) {
              setFormData(prev => ({ ...prev, ws_val_refurb: valData.v_ref_cost }));
            }
          });
        }

        // If make is blank in the stored record, recover it from stock or inquiry
        if (!properMake) {
          const recoverMakeModel = (rawMake, rawModel) => {
            const m = MAKES.find(x => x.toLowerCase() === rawMake.toLowerCase()) || rawMake;
            const mo = (MODELS[m] || []).find(x => x.toLowerCase() === rawModel.toLowerCase()) || rawModel;
            if (m) { setFormData(prev => ({ ...prev, ws_make: m, ws_model: mo })); setModelOptions(MODELS[m] || []); }
          };
          const stkId = editData.ws_stkid;
          const inqId = editData.ws_inqid;
          if (stkId) {
            autoFillFromStockId(stkId).then(stkData => {
              if (stkData) {
                const rm = (stkData.make || stkData.sk_make || '').trim();
                const rmo = (stkData.model || stkData.sk_model || '').trim();
                if (rm) { recoverMakeModel(rm, rmo); return; }
              }
              if (inqId) autoFillFromInq(inqId).then(inqData => {
                if (inqData) recoverMakeModel((inqData.make || '').trim(), (inqData.model || '').trim());
              });
            });
          } else if (inqId) {
            autoFillFromInq(inqId).then(inqData => {
              if (inqData) recoverMakeModel((inqData.make || '').trim(), (inqData.model || '').trim());
            });
          }
        }
      } else if (quickInqId) {
        setFormData(prev => ({ ...prev, ws_inqid: quickInqId }));
        autoFillFromInq(quickInqId).then(inqData => {
          if (inqData) {
            const properMake = MAKES.find(m => m.toLowerCase() === (inqData.make || '').toLowerCase()) || inqData.make || '';
            const properModel = (MODELS[properMake] || []).find(m => m.toLowerCase() === (inqData.model || '').toLowerCase()) || inqData.model || '';
            setFormData(prev => ({
              ...prev,
              ws_make: properMake,
              ws_model: properModel,
              ws_cname: inqData.sellerName || '',
              ws_cont: inqData.mobile || '',
              ws_vnum: inqData.regNo || '',
              ws_km: inqData.km || '',
            }));
            setModelOptions(MODELS[properMake] || []);
            setPrefilled(new Set(['ws_make', 'ws_model', 'ws_cname', 'ws_cont', 'ws_vnum', 'ws_km']));
            autoFillFromVal(quickInqId).then(valData => {
              if (valData && valData.v_ref_cost) {
                setFormData(prev => ({ ...prev, ws_val_refurb: valData.v_ref_cost }));
              }
            });
          }
        });
      } else if (quickDocId) {
        setFormData(prev => ({ ...prev, ws_inqid: quickDocId }));
        setPrefilled(new Set());
      } else if (stockIdForWs) {
        setFormData(prev => ({ ...prev, ws_stkid: stockIdForWs }));
        autoFillFromStockId(stockIdForWs).then(stkData => {
          if (stkData) {
            const rawMake = (stkData.make || stkData.sk_make || '').trim();
            const properMake = MAKES.find(m => m.toLowerCase() === rawMake.toLowerCase()) || rawMake;
            const rawModel = (stkData.model || stkData.sk_model || '').trim();
            const properModel = (MODELS[properMake] || []).find(m => m.toLowerCase() === rawModel.toLowerCase()) || rawModel;
            const rawKm = stkData.km || stkData.sk_km || '';
            const rawRegNo = stkData.regNo || stkData.sk_regn || '';
            const inqId = stkData.inqId || stkData.sk_inqid || '';
            if (inqId) {
              autoFillFromInq(inqId).then(inqData => {
                // If stock had no make, fall back to inquiry's make
                const inqRawMake = inqData ? (inqData.make || '').trim() : '';
                const finalMake = properMake || MAKES.find(m => m.toLowerCase() === inqRawMake.toLowerCase()) || inqRawMake;
                const inqRawModel = inqData ? (inqData.model || '').trim() : '';
                const finalModel = properModel || (MODELS[finalMake] || []).find(m => m.toLowerCase() === inqRawModel.toLowerCase()) || inqRawModel;
                setFormData(prev => ({
                  ...prev,
                  ws_inqid: inqId,
                  ws_make: finalMake,
                  ws_model: finalModel,
                  ws_km: rawKm || (inqData ? inqData.km || '' : ''),
                  ws_vnum: rawRegNo,
                  ws_cname: inqData ? inqData.sellerName || '' : '',
                  ws_cont: inqData ? inqData.mobile || '' : ''
                }));
                setModelOptions(MODELS[finalMake] || []);
                setPrefilled(new Set(['ws_stkid', 'ws_inqid', 'ws_make', 'ws_model', 'ws_vnum', 'ws_km', 'ws_cname', 'ws_cont']));
                autoFillFromVal(inqId).then(valData => {
                  if (valData && valData.v_ref_cost) {
                    setFormData(prev => ({ ...prev, ws_val_refurb: valData.v_ref_cost }));
                  }
                });
              });
            } else {
              setFormData(prev => ({
                ...prev,
                ws_inqid: '',
                ws_make: properMake,
                ws_model: properModel,
                ws_km: rawKm,
                ws_vnum: rawRegNo
              }));
              setModelOptions(MODELS[properMake] || []);
              setPrefilled(new Set(['ws_stkid', ...(properMake ? ['ws_make', 'ws_model'] : []), 'ws_vnum', ...(rawKm ? ['ws_km'] : [])]));
            }
          }
        });
      } else {
        setFormData({
          ws_stkid: "", ws_inqid: "", ws_vnum: "", ws_indate: new Date().toISOString().split('T')[0], ws_km: "", ws_make: "",
          ws_model: "", ws_cname: "", ws_cont: "", ws_wtype: "General Service",
          ws_tech: "", ws_manager: "", ws_parts: "", ws_pstat: "Pending", ws_jstat: "Open", ws_del: "",
          ws_qc: "", ws_act: "", ws_rem: "", ws_dp: [], ws_mw: [], ws_val_refurb: ""
        });
        setModelOptions([]);
        setPrefilled(new Set());
      }
    }
  }, [isOpen, editData, quickInqId, quickDocId, stockIdForWs]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'ws_make') {
      setModelOptions(MODELS[value] || []);
      setFormData(prev => ({ ...prev, ws_model: '' }));
    }

    if (name === 'ws_stkid' && value.length >= 5) {
      autoFillFromStockId(value.toUpperCase()).then(stkData => {
        if (stkData) {
          const rawMake = (stkData.make || stkData.sk_make || '').trim();
          const properMake = MAKES.find(m => m.toLowerCase() === rawMake.toLowerCase()) || rawMake;
          const rawModel = (stkData.model || stkData.sk_model || '').trim();
          const properModel = (MODELS[properMake] || []).find(m => m.toLowerCase() === rawModel.toLowerCase()) || rawModel;
          const rawKm = stkData.km || stkData.sk_km || '';
          const rawRegNo = stkData.regNo || stkData.sk_regn || '';
          const inqId = stkData.inqId || stkData.sk_inqid || '';
          if (inqId) {
            autoFillFromInq(inqId).then(inqData => {
              const inqRawMake = inqData ? (inqData.make || '').trim() : '';
              const finalMake = properMake || MAKES.find(m => m.toLowerCase() === inqRawMake.toLowerCase()) || inqRawMake;
              const inqRawModel = inqData ? (inqData.model || '').trim() : '';
              const finalModel = properModel || (MODELS[finalMake] || []).find(m => m.toLowerCase() === inqRawModel.toLowerCase()) || inqRawModel;
              setFormData(prev => ({
                ...prev,
                ws_inqid: inqId || prev.ws_inqid,
                ws_make: finalMake,
                ws_model: finalModel,
                ws_km: rawKm || (inqData ? inqData.km || '' : '') || prev.ws_km,
                ws_vnum: rawRegNo || prev.ws_vnum,
                ws_cname: (inqData && inqData.sellerName) || prev.ws_cname,
                ws_cont: (inqData && inqData.mobile) || prev.ws_cont,
              }));
              setModelOptions(MODELS[finalMake] || []);
              setPrefilled(prev => new Set([...prev, 'ws_make', 'ws_model', 'ws_vnum', 'ws_km', 'ws_cname', 'ws_cont', 'ws_inqid']));
              autoFillFromVal(inqId).then(valData => {
                if (valData && valData.v_ref_cost) {
                  setFormData(prev => ({ ...prev, ws_val_refurb: valData.v_ref_cost }));
                }
              });
            });
          } else {
            setFormData(prev => ({
              ...prev,
              ws_make: properMake,
              ws_model: properModel,
              ws_km: rawKm || prev.ws_km,
              ws_vnum: rawRegNo || prev.ws_vnum,
            }));
            setModelOptions(MODELS[properMake] || []);
            setPrefilled(prev => new Set([...prev, 'ws_make', 'ws_model', 'ws_vnum', 'ws_km']));
          }
        }
      });
    }

    if (name === 'ws_inqid' && value.length >= 5) {
      autoFillFromInq(value.toUpperCase()).then(inqData => {
        if (inqData) {
          const properMake = MAKES.find(m => m.toLowerCase() === (inqData.make || prev.ws_make || '').toLowerCase()) || inqData.make || prev.ws_make || '';
          const properModel = (MODELS[properMake] || []).find(m => m.toLowerCase() === (inqData.model || prev.ws_model || '').toLowerCase()) || inqData.model || prev.ws_model || '';
          setFormData(prev => ({
            ...prev,
            ws_make: properMake,
            ws_model: properModel,
            ws_cname: inqData.sellerName || prev.ws_cname,
            ws_cont: inqData.mobile || prev.ws_cont,
            ws_vnum: inqData.regNo || prev.ws_vnum,
            ws_km: inqData.km || prev.ws_km,
          }));
          setModelOptions(MODELS[properMake] || []);
          setPrefilled(prev => new Set([...prev, 'ws_make', 'ws_model', 'ws_cname', 'ws_cont', 'ws_vnum', 'ws_km']));
          autoFillFromVal(value.toUpperCase()).then(valData => {
            if (valData && valData.v_ref_cost) {
              setFormData(prev => ({ ...prev, ws_val_refurb: valData.v_ref_cost }));
            }
          });
        }
      });
    }

    if (name === 'ws_vnum' && value.length >= 6) {
      autoFillFromStock(value.toUpperCase()).then(stkData => {
        if (stkData) {
          const rawMake = (stkData.make || stkData.sk_make || '').trim();
          const properMake = MAKES.find(m => m.toLowerCase() === rawMake.toLowerCase()) || rawMake;
          const rawModel = (stkData.model || stkData.sk_model || '').trim();
          const properModel = (MODELS[properMake] || []).find(m => m.toLowerCase() === rawModel.toLowerCase()) || rawModel;
          const rawKm = stkData.km || stkData.sk_km || '';
          const inqId = stkData.inqId || stkData.sk_inqid || '';
          if (inqId) {
            autoFillFromInq(inqId).then(inqData => {
              setFormData(prev => ({
                ...prev,
                ws_inqid: inqId || prev.ws_inqid,
                ws_make: properMake,
                ws_model: properModel,
                ws_km: rawKm || prev.ws_km,
                ws_cname: (inqData && inqData.sellerName) || prev.ws_cname,
                ws_cont: (inqData && inqData.mobile) || prev.ws_cont,
              }));
              setModelOptions(MODELS[properMake] || []);
              setPrefilled(prev => new Set([...prev, 'ws_make', 'ws_model', 'ws_km', 'ws_cname', 'ws_cont', 'ws_inqid']));
              autoFillFromVal(inqId).then(valData => {
                if (valData && valData.v_ref_cost) {
                  setFormData(prev => ({ ...prev, ws_val_refurb: valData.v_ref_cost }));
                }
              });
            });
          } else {
            setFormData(prev => ({
              ...prev,
              ws_make: properMake,
              ws_model: properModel,
              ws_km: rawKm || prev.ws_km,
            }));
            setModelOptions(MODELS[properMake] || []);
            setPrefilled(prev => new Set([...prev, 'ws_make', 'ws_model', 'ws_km']));
          }
        }
      });
    }
  };

  const handleSave = async (moveToWorkshop = false) => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave({
          ...formData,
          ws_lc: dpTotal,
          ws_pc: mechTotal,
          ws_est: dpTotal + mechTotal,
          total: dpTotal + mechTotal
        });
      } else {
        const { getNextCounter } = await import('../../services/db');
        const { genId } = await import('../../utils/helpers');
        let wsId = formData.wsId;
        if (!wsId) {
          const cnt = await getNextCounter('ws');
          wsId = genId('JC', cnt);
        }
        await addDoc(collection(db, 'ws'), {
          ...formData,
          wsId,
          ws_lc: dpTotal,
          ws_pc: mechTotal,
          ws_est: dpTotal + mechTotal,
          total: dpTotal + mechTotal,
          date: formData.ws_indate || new Date().toISOString().split('T')[0],
          tasks: formData.tasks || [],
          createdAt: new Date().toISOString()
        });
        if (moveToWorkshop === true && stockDocId) {
          await updateDoc(doc(db, 'stk', stockDocId), { status: 'Under Refurb', updatedAt: new Date().toISOString() });
        }
        if (onSuccess) { onSuccess(); } else { onClose(); }
      }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const pf = (field) => prefilled.has(field);

  const addDpRow = () => setFormData(prev => ({ ...prev, ws_dp: [...(prev.ws_dp || []), { name: '', qty: '', cost: '' }] }));
  const updateDpRow = (i, field, val) => setFormData(prev => ({ ...prev, ws_dp: prev.ws_dp.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));
  const removeDpRow = (i) => setFormData(prev => ({ ...prev, ws_dp: prev.ws_dp.filter((_, idx) => idx !== i) }));
  const dpRows = formData.ws_dp || [];
  const dpTotal = dpRows.reduce((sum, r) => sum + (Number(r.qty || 0) * Number(r.cost || 0)), 0);

  const addMwRow = () => setFormData(prev => ({ ...prev, ws_mw: [...(prev.ws_mw || []), { name: '', qty: '', cost: '' }] }));
  const updateMwRow = (i, field, val) => setFormData(prev => ({ ...prev, ws_mw: prev.ws_mw.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));
  const removeMwRow = (i) => setFormData(prev => ({ ...prev, ws_mw: prev.ws_mw.filter((_, idx) => idx !== i) }));
  const mwRows = formData.ws_mw || [];
  const mechTotal = mwRows.reduce((sum, r) => sum + (Number(r.qty || 0) * Number(r.cost || 0)), 0);

  const grandTotal = dpTotal + mechTotal;

  return (
    <div className="overlay on" id="m_ws">
      <div className="mbox">
        <div className="m-hdr">
          <div className="m-hdr-icon">🔧</div>
          <h3>Workshop / Refurbishment Job Card</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div style={{background:"rgba(255,107,0,.07)",border:"1px solid rgba(255,107,0,.25)",borderRadius:"var(--radius-sm)",padding:"10px 14px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"18px"}}>⚡</span>
            <div style={{display:"flex",gap:"10px",width:"100%"}}>
              <div className="fg" style={{margin:"0",flex:"1"}}>
                <label style={{color:"var(--or3)",fontSize:"10px",fontWeight:"700",letterSpacing:".8px",textTransform:"uppercase",marginBottom:"4px",display:"block"}}>Stock ID {pf('ws_stkid') && <span style={{color:"var(--success)"}}>⚡ AUTO-FILLED</span>}</label>
                <input name="ws_stkid" value={formData.ws_stkid} onChange={handleChange} placeholder="STK-2025-0001" style={pf('ws_stkid') ? {...DISABLED_STYLE, width:"100%", padding:"8px 12px"} : {background:"var(--bg)",border:"1px solid rgba(255,107,0,.4)",color:"var(--text)",borderRadius:"var(--radius-sm)",padding:"8px 12px",fontFamily:"inherit",fontSize:"12px",width:"100%"}} disabled={pf('ws_stkid')} />
              </div>
              <div className="fg" style={{margin:"0",flex:"1"}}>
                <label style={{color:"var(--or3)",fontSize:"10px",fontWeight:"700",letterSpacing:".8px",textTransform:"uppercase",marginBottom:"4px",display:"block"}}>Purchase INQ ID {pf('ws_inqid') && <span style={{color:"var(--success)"}}>⚡ AUTO-FILLED</span>}</label>
                <input name="ws_inqid" value={formData.ws_inqid} onChange={handleChange} placeholder="INQ-2025-0001" style={pf('ws_inqid') ? {...DISABLED_STYLE, width:"100%", padding:"8px 12px"} : {background:"var(--bg)",border:"1px solid rgba(255,107,0,.4)",color:"var(--text)",borderRadius:"var(--radius-sm)",padding:"8px 12px",fontFamily:"inherit",fontSize:"12px",width:"100%"}} disabled={pf('ws_inqid')} />
              </div>
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Vehicle Number * <span style={{color:"var(--or1)",fontSize:"10px"}}>⚡ Auto-Fill by RegNo</span></label>
              <input name="ws_vnum" value={formData.ws_vnum} onChange={handleChange} placeholder="GJ-01-AB-1234"
                disabled={pf('ws_vnum')} style={pf('ws_vnum') ? DISABLED_STYLE : {}} />
            </div>
            <div className="fg"><label>In Date *</label><input type="date" name="ws_indate" value={formData.ws_indate} onChange={handleChange} /></div>
            <div className="fg"><label>KM Reading {pf('ws_km') && <span style={{color:"var(--success)",fontSize:"9px",fontWeight:700}}>⚡ AUTO-FILLED</span>}</label><input type="number" name="ws_km" value={formData.ws_km} onChange={handleChange} placeholder="Current KM" disabled={pf('ws_km')} style={pf('ws_km') ? DISABLED_STYLE : {}} /></div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Make {pf('ws_make') && <span style={{color:"var(--success)",fontSize:"9px",fontWeight:700}}>⚡ AUTO-FILLED</span>}</label>
              <select name="ws_make" value={formData.ws_make} onChange={handleChange}
                disabled={pf('ws_make')} style={pf('ws_make') ? DISABLED_STYLE : {}}>
                <option value="">Select Brand</option>
                {MAKES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Model {pf('ws_model') && <span style={{color:"var(--success)",fontSize:"9px",fontWeight:700}}>⚡ AUTO-FILLED</span>}</label>
              <select name="ws_model" value={formData.ws_model} onChange={handleChange}
                disabled={pf('ws_model')} style={pf('ws_model') ? DISABLED_STYLE : {}}>
                <option value="">Select Model</option>
                {modelOptions.map(m => <option key={m}>{m}</option>)}
                {!MODELS[formData.ws_make] && formData.ws_make && <option value={formData.ws_model}>{formData.ws_model}</option>}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="fg"><label>Manager</label>
              <select name="ws_manager" value={formData.ws_manager} onChange={handleChange}>
                <option value="">Select Manager</option>
                <option>Jaimin Shah</option>
                <option>Ronak Mehta</option>
              </select>
            </div>
          </div>
          <div className="sect-lbl"><i className="fa fa-paint-brush"></i> Denting / Painting</div>
          {(() => {
            const TH = {padding:'9px 12px',textAlign:'left',fontSize:'11px',color:'var(--text3)',fontWeight:700,letterSpacing:'.6px',border:'1px solid var(--border)'};
            const TD0 = {border:'1px solid var(--border)',padding:'0'};
            const INPUT = {width:'100%',border:'none',background:'transparent',color:'var(--text)',fontFamily:'inherit',fontSize:'13px',outline:'none',padding:'8px 10px',boxSizing:'border-box'};
            return (
            <div style={{marginBottom:'12px'}}>
              <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid var(--border)'}}>
                <thead>
                  <tr style={{background:'var(--surface2)'}}>
                    <th style={TH}>Part Name</th>
                    <th style={{...TH,width:'90px'}}>Qty</th>
                    <th style={{...TH,width:'120px'}}>Cost ₹</th>
                    <th style={{...TH,width:'120px'}}>Total ₹</th>
                    <th style={{width:'36px',border:'1px solid var(--border)'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {dpRows.length === 0 && (
                    <tr><td colSpan={5} style={{border:'1px solid var(--border)',padding:'12px',textAlign:'center',fontSize:'12px',color:'var(--text3)',fontStyle:'italic'}}>No items — click + Add Part</td></tr>
                  )}
                  {dpRows.map((row, i) => {
                    const rowTotal = Number(row.qty||0) * Number(row.cost||0);
                    return (
                    <tr key={i}>
                      <td style={TD0}><input value={row.name} onChange={e => updateDpRow(i,'name',e.target.value)} placeholder="e.g. Hood paint, Bumper…" style={INPUT} /></td>
                      <td style={TD0}><input type="number" value={row.qty} onChange={e => updateDpRow(i,'qty',e.target.value)} placeholder="0" style={INPUT} /></td>
                      <td style={TD0}><input type="number" value={row.cost} onChange={e => updateDpRow(i,'cost',e.target.value)} placeholder="0" style={INPUT} /></td>
                      <td style={{...TD0,padding:'8px 10px',fontWeight:600,color:'var(--text)',fontSize:'13px'}}>₹ {rowTotal.toLocaleString('en-IN')}</td>
                      <td style={{border:'1px solid var(--border)',textAlign:'center',padding:'4px'}}>
                        <button type="button" onClick={() => removeDpRow(i)} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:'14px',padding:'2px 5px',lineHeight:1}}>✕</button>
                      </td>
                    </tr>
                    );
                  })}
                  {dpRows.length > 0 && (
                    <tr style={{background:'var(--surface2)'}}>
                      <td colSpan={3} style={{border:'1px solid var(--border)',padding:'8px 12px',fontSize:'12px',fontWeight:700,color:'var(--text3)'}}>Labour Cost (D&P Total)</td>
                      <td style={{border:'1px solid var(--border)',padding:'8px 12px',fontSize:'13px',fontWeight:700,color:'var(--text)'}}>₹ {dpTotal.toLocaleString('en-IN')}</td>
                      <td style={{border:'1px solid var(--border)'}}></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{marginTop:'6px'}}>
                <button type="button" onClick={addDpRow} style={{background:'none',border:'1px dashed var(--border2)',borderRadius:'var(--radius-sm)',color:'var(--or3)',cursor:'pointer',padding:'5px 14px',fontSize:'12px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px'}}>
                  <span style={{fontSize:'16px',lineHeight:1,fontWeight:400}}>+</span> Add Part
                </button>
              </div>
            </div>
            );
          })()}

          <div className="sect-lbl"><i className="fa fa-wrench"></i> Mechanical Work</div>
          {(() => {
            const TH = {padding:'9px 12px',textAlign:'left',fontSize:'11px',color:'var(--text3)',fontWeight:700,letterSpacing:'.6px',border:'1px solid var(--border)'};
            const TD0 = {border:'1px solid var(--border)',padding:'0'};
            const INPUT = {width:'100%',border:'none',background:'transparent',color:'var(--text)',fontFamily:'inherit',fontSize:'13px',outline:'none',padding:'8px 10px',boxSizing:'border-box'};
            return (
            <div style={{marginBottom:'12px'}}>
              <table style={{width:'100%',borderCollapse:'collapse',border:'1px solid var(--border)'}}>
                <thead>
                  <tr style={{background:'var(--surface2)'}}>
                    <th style={TH}>Part Name</th>
                    <th style={{...TH,width:'90px'}}>Qty</th>
                    <th style={{...TH,width:'120px'}}>Cost ₹</th>
                    <th style={{...TH,width:'120px'}}>Total ₹</th>
                    <th style={{width:'36px',border:'1px solid var(--border)'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {mwRows.length === 0 && (
                    <tr><td colSpan={5} style={{border:'1px solid var(--border)',padding:'12px',textAlign:'center',fontSize:'12px',color:'var(--text3)',fontStyle:'italic'}}>No items — click + Add Part</td></tr>
                  )}
                  {mwRows.map((row, i) => {
                    const rowTotal = Number(row.qty||0) * Number(row.cost||0);
                    return (
                    <tr key={i}>
                      <td style={TD0}><input value={row.name} onChange={e => updateMwRow(i,'name',e.target.value)} placeholder="e.g. Engine oil, Brake pads…" style={INPUT} /></td>
                      <td style={TD0}><input type="number" value={row.qty} onChange={e => updateMwRow(i,'qty',e.target.value)} placeholder="0" style={INPUT} /></td>
                      <td style={TD0}><input type="number" value={row.cost} onChange={e => updateMwRow(i,'cost',e.target.value)} placeholder="0" style={INPUT} /></td>
                      <td style={{...TD0,padding:'8px 10px',fontWeight:600,color:'var(--text)',fontSize:'13px'}}>₹ {rowTotal.toLocaleString('en-IN')}</td>
                      <td style={{border:'1px solid var(--border)',textAlign:'center',padding:'4px'}}>
                        <button type="button" onClick={() => removeMwRow(i)} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:'14px',padding:'2px 5px',lineHeight:1}}>✕</button>
                      </td>
                    </tr>
                    );
                  })}
                  {mwRows.length > 0 && (
                    <tr style={{background:'var(--surface2)'}}>
                      <td colSpan={3} style={{border:'1px solid var(--border)',padding:'8px 12px',fontSize:'12px',fontWeight:700,color:'var(--text3)'}}>Estimated Cost (Mech Total)</td>
                      <td style={{border:'1px solid var(--border)',padding:'8px 12px',fontSize:'13px',fontWeight:700,color:'var(--text)'}}>₹ {mechTotal.toLocaleString('en-IN')}</td>
                      <td style={{border:'1px solid var(--border)'}}></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{marginTop:'6px'}}>
                <button type="button" onClick={addMwRow} style={{background:'none',border:'1px dashed var(--border2)',borderRadius:'var(--radius-sm)',color:'var(--or3)',cursor:'pointer',padding:'5px 14px',fontSize:'12px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px'}}>
                  <span style={{fontSize:'16px',lineHeight:1,fontWeight:400}}>+</span> Add Part
                </button>
              </div>
            </div>
            );
          })()}

          <div className="sect-lbl"><i className="fa fa-calculator"></i> Cost Summary — AUTO</div>
          <div className="grid3">
            <div className="fg"><label>Labour Cost ₹ (D&P — AUTO)</label><div className="calc-out">₹ {dpTotal.toLocaleString('en-IN')}</div></div>
            <div className="fg"><label>Estimated Cost ₹ (Mech — AUTO)</label><div className="calc-out">₹ {mechTotal.toLocaleString('en-IN')}</div></div>
            <div className="fg"><label>Total Cost ₹ (AUTO)</label><div className="calc-out" style={{fontWeight:800,color:'var(--or1)'}}>₹ {grandTotal.toLocaleString('en-IN')}</div></div>
          </div>
          {formData.ws_val_refurb && (
            <div style={{marginBottom:'12px'}}>
              <div className="fg"><label>Tentative Refurb Cost (By Valuator)</label><div className="calc-out" style={{background:'rgba(255,107,0,.08)',color:'var(--or1)',border:'1px dashed var(--or1)'}}>{`₹ ${Number(formData.ws_val_refurb).toLocaleString('en-IN')}`}</div></div>
            </div>
          )}
          <div className="grid2">
            <div className="fg"><label>Payment Status</label><select name="ws_pstat" value={formData.ws_pstat} onChange={handleChange}><option>Pending</option><option>Paid</option></select></div>
            <div className="fg"><label>Job Status</label><select name="ws_jstat" value={formData.ws_jstat} onChange={handleChange}><option>Open</option><option>In Process</option><option>Complete</option></select></div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Expected Delivery Date {pf('ws_del') && <span style={{ color: 'var(--success)', fontSize: 9, fontWeight: 700 }}>⚡ LOCKED — SET ONCE</span>}</label>
              <input type="date" name="ws_del" value={formData.ws_del} onChange={handleChange} disabled={pf('ws_del')} style={pf('ws_del') ? DISABLED_STYLE : {}} />
            </div>
            <div className="fg"><label>Actual Delivery Date</label><input type="date" name="ws_act" value={formData.ws_act} onChange={handleChange} /></div>
            <div className="fg"><label>Quality Checked By</label><input name="ws_qc" value={formData.ws_qc} onChange={handleChange} placeholder="QC name" /></div>
          </div>
          <div className="grid1">
            <div className="fg"><label>Remarks</label><input name="ws_rem" value={formData.ws_rem} onChange={handleChange} placeholder="Extra notes" /></div>
          </div>
        </div>
        <div className="m-foot">
          <button className="btn btn-out" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-or" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-save"></i> Save Job Card</>}
          </button>
          {stockDocId && (
            <button className="btn btn-or" onClick={() => handleSave(true)} disabled={saving} style={{ background: 'var(--bl5)', borderColor: 'var(--bl5)' }}>
              {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-share"></i> Save & Move to Workshop</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

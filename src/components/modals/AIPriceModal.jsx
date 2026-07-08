import React, { useState, useMemo, useEffect } from 'react';
import { updateRecord } from '../../services/db';


const AI_PROVIDERS = [
  { id:'gemini',     name:'Gemini',     symbol:'✦', brand:'#4285F4', grad:'linear-gradient(135deg,#4285F4,#34A853)', getUrl: p => `https://gemini.google.com/app?q=${encodeURIComponent(p)}`, desc:'Best for Indian market'       },
  { id:'claude',     name:'Claude',     symbol:'◆', brand:'#D97706', grad:'linear-gradient(135deg,#D97706,#F59E0B)', getUrl: p => `https://claude.ai/new?q=${encodeURIComponent(p)}`,        desc:'Deep reasoning & analysis'    },
  { id:'chatgpt',    name:'ChatGPT',    symbol:'◉', brand:'#10A37F', grad:'linear-gradient(135deg,#10A37F,#06D6A0)', getUrl: p => `https://chatgpt.com/?q=${encodeURIComponent(p)}`,          desc:'Wide market knowledge'        },
  { id:'grok',       name:'Grok',       symbol:'✗', brand:'#1D9BF0', grad:'linear-gradient(135deg,#1D9BF0,#7C3AED)', getUrl: p => `https://grok.com/?q=${encodeURIComponent(p)}`,             desc:'Real-time market data'        },
  { id:'perplexity', name:'Perplexity', symbol:'⊕', brand:'#20B2AA', grad:'linear-gradient(135deg,#20B2AA,#2196F3)', getUrl: p => `https://www.perplexity.ai/?q=${encodeURIComponent(p)}`,    desc:'Research-backed pricing'     },
  { id:'meta',       name:'Meta AI',    symbol:'∞', brand:'#0668E1', grad:'linear-gradient(135deg,#0668E1,#E040FB)', getUrl: p => `https://www.meta.ai/?q=${encodeURIComponent(p)}`,          desc:'Quick estimates'             },
];

/* ── prompt builder ── */
function buildPrompt(rec) {
  const f  = (k1, k2, k3, fb='—') => {
    if (rec[k1]) return rec[k1];
    if (k2 && rec[k2]) return rec[k2];
    if (k3 && rec[k3]) return rec[k3];
    return fb;
  };
  const ck = v => v ? '✅ Yes' : '❌ No';
  return `You are an expert used car valuation specialist in the Indian automotive market.

Please provide a detailed PURCHASE price valuation for the vehicle below.
I am a used car dealer looking to BUY this vehicle from a seller.

═══════════════════════════════════
VEHICLE DETAILS
═══════════════════════════════════
Make / Brand   : ${f('make', 'v_make', 'pf_veh')}
Model          : ${f('model', 'v_model', 'pf_model')}
Variant        : ${f('variant', 'v_var', null, 'Unknown')}
Year           : ${f('year', 'v_year', 'pf_year')}
Fuel Type      : ${f('fuel', 'v_fuel', 'pf_fuel')}
Registration # : ${f('regNo', 'v_vnum', 'pf_reg')}
KM Driven      : ${f('km', 'v_km', 'pf_km')} km
Owner History  : ${f('owners', 'v_own', 'pf_own')} owner

═══════════════════════════════════
INSPECTION REPORT
═══════════════════════════════════
Overall Condition   : ${f('overallCondition', 'v_ovr', 'pf_ovr')}
Engine Condition    : ${f('engineCondition', 'v_eng', 'pf_eng')}
Tyre Condition      : ${f('tyreCondition', 'v_tyre', 'pf_tyre')}
RC Available        : ${ck(rec.rcAvailable||rec.v_rc||rec.pf_rc)}
Insurance           : ${ck(rec.insuranceStatus==='Yes'||rec.v_ins||rec.pf_ins)}
Second Key          : ${ck(rec.secondKey||rec.v_key2||rec.pf_key2)}
Warranty            : ${ck(rec.warranty||rec.v_war||rec.pf_war)}
Invoice             : ${ck(rec.invoice||rec.v_inv||rec.pf_inv)}

═══════════════════════════════════
SELLER EXPECTATIONS
═══════════════════════════════════
Seller's Expected Price : ₹${rec.expectedPrice||rec.v_expPrice||'Not disclosed'}
Remarks / Notes         : ${f('v_rem')||f('remarks')}

═══════════════════════════════════
PLEASE PROVIDE:
═══════════════════════════════════
1. 📊 Fair Market Value Range (Low / Mid / High) in ₹
2. 💡 Recommended PURCHASE OFFER PRICE with justification
3. ⚠️  Key risk factors affecting the price
4. 🔍 Comparable market listings if known
5. ✅ Final recommendation: Should I buy at seller's asking price?

Use Indian number format (Lakh/Crore) for all values.`;
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
export const AIPriceModal = ({ isOpen, onClose, record, onSavePrice }) => {
  const [selectedAI,  setSelectedAI]  = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [aiResult,    setAiResult]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedAI(null);
      setCopied(false);
      setAiResult(record?.aiSuggestion || '');
      setSaved(!!record?.aiSuggestion);
    }
  }, [isOpen, record]);


  const prompt   = useMemo(() => record ? buildPrompt(record) : '',          [record]);

  if (!isOpen || !record) return null;

  const vMake  = record.make || record.v_make || record.pf_veh || '';
  const vModel = record.model || record.v_model || record.pf_model || '';
  const vYear  = record.year || record.v_year || record.pf_year || '';
  
  const vehicle = `${vMake} ${vModel} ${vYear ? `(${vYear})` : ''}`.trim() || 'Unknown Vehicle';

  const fallbackCopyText = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      // Must be rendered on screen but invisible to work reliably
      ta.style.position = 'fixed';
      ta.style.left = '0';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      console.error('Fallback copy failed', e);
      return false;
    }
  };

  const doCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(prompt)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          // Fallback if clipboard API rejects
          fallbackCopyText(prompt);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        });
    } else {
      // Direct fallback
      fallbackCopyText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyAndOpen = () => {
    if (!selectedAI) return;
    // 1. Open window synchronously to avoid popup blocker
    window.open(selectedAI.getUrl(prompt), '_blank', 'noopener,noreferrer');
    // 2. Perform copy
    doCopy();
  };

  const handleSaveResult = async () => {
    if (!aiResult.trim() || !record.id) return;
    setSaving(true);
    try { await onSavePrice({ aiSuggestion: aiResult }); setSaved(true); }
    catch (e) { console.error(e); }
    finally   { setSaving(false); }
  };

  /* ── shared inline styles using CSS vars ── */
  const S = {
    /* modal chrome */
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    box:     { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:760, maxHeight:'94vh', overflowY:'auto', boxShadow:'var(--shadow)', display:'flex', flexDirection:'column' },

    /* header */
    hdr:      { padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:'var(--surface)', zIndex:2, background:'linear-gradient(135deg, var(--sb-top), var(--bl2))' },
    hdrIcon:  { width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,var(--or1),var(--or2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
    hdrTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'#fff', margin:0 },
    hdrSub:   { fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2, fontWeight:400, textTransform:'none', letterSpacing:0 },
    closeBtn: { marginLeft:'auto', width:30, height:30, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:6, color:'rgba(255,255,255,.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'.15s', flexShrink:0 },

    /* body */
    body:  { padding:'20px 22px', flex:1 },

    /* section label */
    secLbl: { fontSize:9, color:'var(--text3)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 },

    /* prompt box */
    promptBox: { background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', fontSize:11, color:'var(--text2)', overflow:'auto', maxHeight:180, whiteSpace:'pre-wrap', fontFamily:"'Space Grotesk',monospace", lineHeight:1.6, margin:0 },

    /* AI grid */
    aiGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 },

    /* paste area */
    textarea: { width:'100%', minHeight:100, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', color:'var(--text)', fontSize:12, fontFamily:'inherit', resize:'vertical', outline:'none', lineHeight:1.6, boxSizing:'border-box', transition:'.2s' },

    /* action row */
    foot: { display:'flex', gap:8, justifyContent:'flex-end', marginTop:10 },

    /* generic outlined button */
    btnOut: { background:'transparent', border:'1px solid var(--border2)', borderRadius:'var(--radius-sm)', padding:'8px 18px', color:'var(--text2)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', transition:'.15s' },

    /* primary gradient button */
    btnPri: { background:'linear-gradient(135deg,var(--or1),var(--or2))', border:'none', borderRadius:'var(--radius-sm)', padding:'9px 20px', color:'#fff', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'.2s', letterSpacing:'.3px' },
  };



  return (
    <div style={S.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={S.box}>

        {/* ── HEADER ── */}
        <div style={S.hdr}>
          <div style={S.hdrIcon}>🤖</div>
          <div style={{ flex:1 }}>
            <div style={S.hdrTitle}>AI Price Suggestion</div>
            <div style={S.hdrSub}>{vehicle}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>

            {/* AI provider grid */}
            <div style={S.secLbl}>🤖 Choose Your AI Assistant</div>
            <div style={S.aiGrid}>
              {AI_PROVIDERS.map(ai => {
                const sel = selectedAI?.id===ai.id;
                return (
                  <button key={ai.id} onClick={() => setSelectedAI(ai)} style={{
                    background:    sel ? ai.grad : 'var(--surface2)',
                    border:        `2px solid ${sel ? ai.brand : 'var(--border)'}`,
                    borderRadius:  'var(--radius-lg)',
                    padding:       '14px 12px',
                    cursor:        'pointer',
                    textAlign:     'center',
                    transition:    '.2s',
                    outline:       'none',
                    boxShadow:     sel ? `0 0 0 3px ${ai.brand}33, 0 8px 24px ${ai.brand}22` : 'none',
                    transform:     sel ? 'translateY(-3px)' : 'none',
                  }}>
                    <div style={{fontSize:22, marginBottom:6, color: sel?'#fff':ai.brand}}>{ai.symbol}</div>
                    <div style={{fontWeight:800, fontSize:12, color: sel?'#fff':'var(--text)', marginBottom:3, fontFamily:"'Space Grotesk',sans-serif"}}>{ai.name}</div>
                    <div style={{fontSize:9, color: sel?'rgba(255,255,255,.75)':'var(--text3)', letterSpacing:'.3px'}}>{ai.desc}</div>
                    {sel && <div style={{marginTop:6, fontSize:9, background:'rgba(255,255,255,.2)', borderRadius:10, padding:'2px 8px', color:'#fff', fontWeight:700}}>✓ SELECTED</div>}
                  </button>
                );
              })}
            </div>

            {/* Prompt preview */}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                <div style={S.secLbl}>📋 Auto-Generated Valuation Prompt</div>
                <button
                  onClick={doCopy}
                  style={{...S.btnOut, padding:'4px 12px', fontSize:10}}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Only'}
                </button>
              </div>
              <pre style={S.promptBox}>{prompt}</pre>
            </div>

            {/* Open AI button */}
            <button
              onClick={handleCopyAndOpen}
              disabled={!selectedAI}
              style={{
                width:'100%', padding:13, border:'none', borderRadius:'var(--radius)', cursor: selectedAI?'pointer':'not-allowed',
                background:  selectedAI ? selectedAI.grad : 'var(--surface2)',
                color:       selectedAI ? '#fff' : 'var(--text3)',
                fontFamily:  "'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, letterSpacing:'.5px',
                transition:  '.2s', marginBottom:20,
                boxShadow:   selectedAI ? `0 6px 24px ${selectedAI.brand}44` : 'none',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}
            >
              {copied
                ? '✅ Copied! Opening…'
                : selectedAI
                  ? `📋 Copy Prompt & Open ${selectedAI.name} →`
                  : '← Select an AI provider above first'}
            </button>

            {/* Log AI result */}
            <div style={{borderTop:'1px solid var(--border)', paddingTop:16}}>
              <div style={{...S.secLbl, marginBottom:8}}>📥 Paste AI Response to Save</div>
              <textarea
                value={aiResult}
                onChange={e => { setAiResult(e.target.value); setSaved(false); }}
                placeholder="Paste the AI's valuation response here… It will be saved to this record."
                style={S.textarea}
                onFocus={e  => e.target.style.borderColor='var(--or1)'}
                onBlur={e   => e.target.style.borderColor='var(--border)'}
              />
              <div style={S.foot}>
                <button style={S.btnOut} onClick={onClose}>Close</button>
                <button
                  onClick={handleSaveResult}
                  disabled={!aiResult.trim()||saving||saved}
                  style={{
                    ...S.btnPri,
                    background: saved
                      ? 'var(--surface2)'
                      : aiResult.trim()
                        ? 'linear-gradient(135deg,var(--or1),var(--or2))'
                        : 'var(--surface2)',
                    color: saved ? 'var(--success)' : aiResult.trim() ? '#fff' : 'var(--text3)',
                    border: saved ? '1px solid var(--border2)' : 'none',
                    cursor: aiResult.trim()&&!saving&&!saved ? 'pointer' : 'not-allowed',
                  }}
                >
                  {saving ? <><i className="car-spinner"/> Saving…</>
                          : saved  ? '✅ Saved to Record'
                          : <><i className="fa fa-save"/> Save AI Result</>}
                </button>
              </div>
            </div>
          </div>

      </div>
    </div>
  );
};

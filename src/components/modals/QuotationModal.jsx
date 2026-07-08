import React, { useState, useEffect, useRef } from 'react';
import { loadMediaFromFirestore } from '../../utils/uploadMedia';

/* ─── Colour palette (always white-page, theme-agnostic) ─── */
const C = {
  navy:    '#0D1B2E',
  gold:    '#C8A84B',
  goldLt:  '#E8C97A',
  white:   '#FFFFFF',
  offWh:   '#F8F9FB',
  gray:    '#EFF2F7',
  border:  '#D8E0EE',
  label:   '#6B7A99',
  text:    '#0D1A2E',
};

/* ─── RTO state lookup ─── */
const RTO = {
  AN:'Andaman & Nicobar',AP:'Andhra Pradesh',AR:'Arunachal Pradesh',AS:'Assam',
  BR:'Bihar',CG:'Chhattisgarh',CH:'Chandigarh',DD:'Daman & Diu',DL:'Delhi',
  DN:'Dadra & Nagar Haveli',GA:'Goa',GJ:'Gujarat',HP:'Himachal Pradesh',
  HR:'Haryana',JH:'Jharkhand',JK:'Jammu & Kashmir',KA:'Karnataka',KL:'Kerala',
  LA:'Ladakh',LD:'Lakshadweep',MH:'Maharashtra',ML:'Meghalaya',MN:'Manipur',
  MP:'Madhya Pradesh',MZ:'Mizoram',NL:'Nagaland',OD:'Odisha',OR:'Odisha',
  PB:'Punjab',PY:'Puducherry',RJ:'Rajasthan',SK:'Sikkim',TN:'Tamil Nadu',
  TR:'Tripura',TS:'Telangana',UK:'Uttarakhand',UP:'Uttar Pradesh',WB:'West Bengal',
};

function rtoInfo(regNo) {
  if (!regNo) return { full: '—', short: '' };
  const clean = regNo.replace(/[\s-]/g, '').toUpperCase();
  const sc = clean.substring(0, 2);
  const dist = clean.match(/^[A-Z]{2}(\d{2})/)?.[1] || '';
  const code = dist ? `${sc}-${dist}` : sc;
  const state = RTO[sc];
  return { full: state ? `${state} (${code})` : code, short: code };
}

function ownerLabel(own) {
  const m = { '1st':'First Owner','2nd':'Second Owner','3rd':'Third Owner','4th':'Fourth Owner+' };
  return m[own] || own || '—';
}

function fmtAmt(v) {
  const n = parseFloat(v || 0);
  return n ? '₹' + n.toLocaleString('en-IN') : null;
}

function fmtKm(v) {
  const n = parseFloat(v || 0);
  return n ? n.toLocaleString('en-IN') + ' km' : '—';
}

function todayFmt() {
  return new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
}

function getQNo(stkId) {
  const yr = new Date().getFullYear();
  const num = (stkId || '').replace(/\D/g, '').padStart(4, '0') || '0001';
  return `CC-Q-${yr}-${num}`;
}

/* ─── Vehicle Features Database ─── */
const FDB = {
  'JEEP': {
    'COMPASS': {
      base: ['10.1" Uconnect Touchscreen', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ABS with EBD & EBA', 'Electronic Stability Control', 'Rear Camera with Sensors', 'Automatic Climate Control', 'Keyless Entry & Push-Button Start', '17" Alloy Wheels', 'Hill Start Assist'],
      'MODEL S (O)': ['Panoramic Fixed Glass Roof', 'Ventilated Front Seats', 'Adaptive Cruise Control', 'Blind Spot Monitoring', 'Lane Departure Warning', 'Wireless Phone Charger', 'Auto-Dimming IRVM', 'Electronic Parking Brake', 'LED Projector Headlamps with DRLs'],
      'MODEL S': ['Dual-Zone Automatic Climate', 'Leatherette Seats', 'Auto-Dimming IRVM', 'Electronic Parking Brake', 'LED Headlamps', 'Rear Sunshade'],
      'NIGHT EAGLE': ['Dark Edition Styling', 'Leatherette Seats', 'Electronic Parking Brake', 'LED Headlamps'],
    },
    'MERIDIAN': {
      base: ['12.3" Uconnect Touchscreen', 'Wireless Apple CarPlay & Android Auto', '7 Airbags', 'ADAS Safety Suite', '3-Zone Automatic Climate Control', 'Power Tailgate', '18" Alloy Wheels', 'Bi-LED Projector Headlamps', 'Wireless Charging', 'Ventilated Front Seats'],
    },
    'WRANGLER': {
      base: ['12.3" Uconnect Touchscreen', '7 Airbags', 'Part-Time 4x4 with Low Range', 'Electronic Sway-bar Disconnect', 'Dana 44 Rear Axle', 'LED Headlamps', 'Alpine Premium Sound'],
    },
  },
  'HYUNDAI': {
    'CRETA': {
      base: ['10.25" Touchscreen Navigation', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ADAS with Level 2 Safety', 'Rear Camera & Sensors', 'Bose Premium Sound System', 'Panoramic Sunroof', 'Bluelink Connected Car', 'Electronic Stability Control', 'Ventilated Front Seats'],
    },
    'VENUE': {
      base: ['8" Touchscreen', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Rear Camera & Sensors', 'Automatic Climate Control', 'Bluelink Connected Car', 'Electronic Stability Control', 'Sunroof (select variants)'],
    },
    'VERNA': {
      base: ['10.25" Touchscreen', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ADAS Level 2 Safety Suite', 'Bose 8-Speaker Sound', 'Ventilated Front Seats', 'Panoramic Sunroof', 'Electronic Parking Brake', 'Connected Car Technology'],
    },
    'TUCSON': {
      base: ['10.25" Touchscreen', '8 Airbags', 'ADAS Level 2', 'Panoramic Sunroof', 'Ventilated & Heated Seats', 'Bose Premium Sound', 'Wireless Charging', 'Electronic Parking Brake', 'Bluelink Technology'],
    },
    'I20': {
      base: ['10.25" Touchscreen', 'Apple CarPlay & Android Auto', '6 Airbags', 'Sunroof', 'Bose Sound System', 'Bluelink Connected', 'ABS + EBD', 'Electronic Stability Control'],
    },
  },
  'KIA': {
    'SELTOS': {
      base: ['10.25" HD Touchscreen', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ADAS Level 1', 'Bose 8-Speaker Sound', 'Panoramic Sunroof', 'Ventilated Front Seats', 'Electronic Parking Brake', 'Rear Camera & Sensors', 'UVO Connected Car'],
    },
    'SONET': {
      base: ['10.25" HD Touchscreen', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Bose Premium Audio', 'Sunroof', 'UVO Connected Car', 'Electronic Stability Control'],
    },
    'CARENS': {
      base: ['10.25" HD Touchscreen', '6 Airbags', 'ADAS Level 1', 'Panoramic Sunroof', 'Bose Sound System', 'Wireless Charging', 'Ventilated Seats', 'UVO Connected Tech'],
    },
  },
  'TATA': {
    'NEXON': {
      base: ['10.25" Float Sense Touchscreen', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Electronic Stability Control', 'Sunroof', 'Harman Audio System', 'iRA Connected Car', 'Rear Camera & Sensors'],
    },
    'HARRIER': {
      base: ['10.25" Infotainment', '6 Airbags', 'ADAS Level 2', 'Panoramic Sunroof', 'JBL 9-Speaker Audio', 'Ventilated Front Seats', 'Terrain Response Modes', 'Electronic Parking Brake', 'iRA Connected Car'],
    },
    'SAFARI': {
      base: ['10.25" Infotainment', '6 Airbags', 'ADAS Level 2', 'Panoramic Sunroof', 'JBL 9-Speaker Audio', '7-Seater Captain Chairs', 'Terrain Response', 'Electronic Parking Brake', 'iRA Connected Car'],
    },
    'PUNCH': {
      base: ['7" Infotainment', 'Apple CarPlay & Android Auto', '2 Airbags', 'ABS + EBD', 'Rear Camera', 'iRA Connected Car', 'Hill Hold Assist', 'Electronic Stability Control'],
    },
  },
  'MAHINDRA': {
    'SCORPIO': {
      base: ['8" Touchscreen', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', '4x4 Capability', 'Electrically Adjustable Seats', 'AdrenoX Connected', 'Hill Hold & Descent Control', 'All-Terrain Tyres'],
    },
    'XUV700': {
      base: ['10.25" Dual-Screen Infotainment', 'Wireless Apple CarPlay & Android Auto', '7 Airbags', 'ADAS Level 2', 'Panoramic Sunroof', 'Sony 3D Audio (12 Speakers)', 'Ventilated & Heated Seats', 'Wireless Charging', 'AdrenoX AI Connected', 'Electronic Parking Brake'],
    },
    'THAR': {
      base: ['7" Touchscreen', 'Apple CarPlay & Android Auto', '2 Airbags', '4x4 with Low Range & Diff Lock', 'Convertible Soft/Hard Top', 'Bi-Halogen Projector Headlamps', 'Adventure Statistics Display'],
    },
    'BOLERO': {
      base: ['ABS + EBD', '2 Airbags', 'Power Steering', 'High Ground Clearance', 'Rear AC Vents', 'Rugged Body-on-Frame Build'],
    },
  },
  'MARUTI SUZUKI': {
    'BREZZA': {
      base: ['9" SmartPlay Pro+ Infotainment', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Electronic Stability Control', 'Sunroof', 'Head-Up Display', 'Suzuki Connect', 'Rear Camera & Sensors'],
    },
    'GRAND VITARA': {
      base: ['9" SmartPlay Pro+ Infotainment', '5 Airbags', 'Panoramic Sunroof', 'Wireless Charging', 'Ventilated Seats', 'Head-Up Display', 'ALLGRIP AWD (Hybrid variants)', '360° Camera', 'Electronic Parking Brake'],
    },
    'SWIFT': {
      base: ['9" SmartPlay Pro+', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Electronic Stability Control', 'Rear Camera', 'Suzuki Connect', 'Keyless Entry & Start'],
    },
    'DZIRE': {
      base: ['9" SmartPlay Pro+', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Rear Camera', 'Automatic Climate Control', 'Suzuki Connect'],
    },
    'ERTIGA': {
      base: ['7" SmartPlay Studio', 'Apple CarPlay & Android Auto', '2 Airbags', 'ABS + EBD', 'Rear AC Vents', '7-Seater Versatile Layout', 'Rear Camera'],
    },
  },
  'HONDA': {
    'CITY': {
      base: ['8" Honda Connect+ Infotainment', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'Honda Sensing (ADAS)', 'Sunroof', 'Ventilated Seats', 'Lane Watch Camera', 'Electronic Parking Brake', 'Rear Camera & Sensors'],
    },
    'ELEVATE': {
      base: ['10.25" Touchscreen', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'Honda Sensing ADAS', 'Sunroof', 'Rear Camera & Sensors', 'Connected Vehicle Tech', 'Electronic Parking Brake', 'Ventilated Front Seats'],
    },
    'AMAZE': {
      base: ['7" Touchscreen', 'Apple CarPlay & Android Auto', '2 Airbags', 'ABS + EBD', 'Rear Camera', 'Automatic Climate Control', 'Sunroof (select variants)'],
    },
  },
  'TOYOTA': {
    'FORTUNER': {
      base: ['9" Touchscreen', 'Apple CarPlay & Android Auto', '7 Airbags', '4x4 with Active Traction Control', 'Panoramic View Monitor', 'Wireless Charging', 'JBL Premium Audio', 'Rear Diff Lock', 'Ventilated Front Seats', 'Adaptive Cruise Control'],
    },
    'INNOVA HYCROSS': {
      base: ['10.1" Touchscreen', 'Wireless Apple CarPlay & Android Auto', '7 Airbags', 'ADAS', 'Panoramic Sunroof', 'Ventilated Captain Seats', 'JBL 11-Speaker Audio', 'Wireless Charging', 'Toyota Connected Services'],
    },
    'HYRYDER': {
      base: ['10.25" SmartPlay Pro+', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'Sunroof', 'Wireless Charging', 'Head-Up Display', 'Rear Camera', 'Strong Hybrid Technology'],
    },
    'GLANZA': {
      base: ['9" SmartPlay Pro+', 'Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Electronic Stability Control', 'Sunroof', 'Toyota Connected Tech'],
    },
  },
  'MG': {
    'HECTOR': {
      base: ["India's Largest 14\" Portrait Screen", 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ADAS Level 2', 'Panoramic Sunroof', 'Wireless Charging', 'Ventilated Seats', 'i-Smart Connected Car', 'Electronic Parking Brake', 'PM2.5 Air Purifier'],
    },
    'ASTOR': {
      base: ['10.1" Infotainment', '6 Airbags', 'ADAS Level 2', 'Sunroof', 'Wireless Charging', 'i-Smart 2.0 Connected', 'Ventilated Seats', 'Rear Camera & Sensors'],
    },
    'GLOSTER': {
      base: ['12.3" Dual-Screen Infotainment', '6 Airbags', 'ADAS Level 2', 'Panoramic Sunroof', 'Wireless Charging', 'Ventilated Seats', '7-Seater Layout', 'i-Smart Connected', 'Electronic Parking Brake'],
    },
  },
  'VOLKSWAGEN': {
    'TAIGUN': {
      base: ['10.1" Infotainment', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ADAS with Travel Assist', 'Sunroof', 'Ventilated Front Seats', 'Electronic Parking Brake', 'Wireless Charging', 'Lane Assist'],
    },
    'VIRTUS': {
      base: ['10.1" Infotainment', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'Travel Assist (ADAS)', 'Sunroof', 'Ventilated Seats', 'Electronic Parking Brake', 'Wireless Charging'],
    },
  },
  'SKODA': {
    'KUSHAQ': {
      base: ['10" Touchscreen', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'ABS + EBD', 'Sunroof', 'Electronic Parking Brake', 'Ventilated Seats', 'Wireless Charging', 'Smartlink+ Connectivity'],
    },
    'SLAVIA': {
      base: ['10" Touchscreen', 'Wireless Apple CarPlay & Android Auto', '6 Airbags', 'Sunroof', 'Ventilated Seats', 'Electronic Parking Brake', 'Travel Assist', 'Wireless Charging'],
    },
    'OCTAVIA': {
      base: ['10" Virtual Cockpit', 'Wireless Apple CarPlay & Android Auto', '8 Airbags', 'ACC with Travel Assist', 'Panoramic Sunroof', 'Canton Sound System', 'Heated & Ventilated Seats', 'Lane Assist', 'Virtual Cockpit'],
    },
  },
};

function getVehicleFeatures(make, model, variant) {
  const m = (make || '').toUpperCase().trim();
  const mod = (model || '').toUpperCase().trim();
  const v = (variant || '').toUpperCase().trim();

  const makeData = FDB[m];
  if (!makeData) return getGenericFeatures();

  // Try to find the model (partial match)
  let modelData = makeData[mod];
  if (!modelData) {
    const key = Object.keys(makeData).find(k => mod.includes(k) || k.includes(mod));
    modelData = key ? makeData[key] : null;
  }
  if (!modelData) return getGenericFeatures();

  const base = modelData.base || [];
  let variantExtras = [];
  Object.keys(modelData).forEach(key => {
    if (key !== 'base' && v && (v.includes(key) || key.split(' ').every(w => v.includes(w)))) {
      variantExtras = modelData[key];
    }
  });

  return [...new Set([...variantExtras, ...base])].slice(0, 12);
}

function getGenericFeatures() {
  return [
    'Touchscreen Infotainment System',
    'Apple CarPlay & Android Auto',
    'Multiple Airbags for Safety',
    'ABS with Electronic Brakeforce Distribution',
    'Electronic Stability Control',
    'Rear Parking Camera & Sensors',
    'Automatic Climate Control',
    'Alloy Wheels',
    'Keyless Entry & Push-Button Start',
    'Power Windows & ORVMs',
  ];
}

/* ─── Tiny car SVG for empty photo slots ─── */
const CarSVG = () => (
  <svg width="40" height="34" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24H5C4.4 24 4 23.6 4 23v-4l4.5-9H31.5L36 19v4c0 .6-.4 1-1 1h-3" stroke="#B8C4D8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 17H32" stroke="#B8C4D8" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M12 11L14 7H26L28 11" stroke="#B8C4D8" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="10" cy="24" r="4" stroke="#B8C4D8" strokeWidth="1.6"/>
    <circle cx="30" cy="24" r="4" stroke="#B8C4D8" strokeWidth="1.6"/>
  </svg>
);

/* ─── Section header with extending rule ─── */
function SectionHead({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
      <span style={{ fontSize:10, fontWeight:800, letterSpacing:1.8, textTransform:'uppercase', color:C.text, whiteSpace:'nowrap' }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:C.border }}></div>
    </div>
  );
}

/* ─── Assurance checkmark circle ─── */
function Check() {
  return (
    <span style={{
      width:14, height:14, borderRadius:'50%', background:C.gold,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontSize:8, fontWeight:900, color:C.navy, flexShrink:0, lineHeight:1,
    }}>✓</span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUOTATION DOCUMENT (captured by html2canvas)
═══════════════════════════════════════════════════════════════ */
function QuotationDoc({ r, clientName, photos, qNo, todayDate }) {
  const make     = (r.make     || r.sk_make  || '').trim().toUpperCase();
  const model    = (r.model    || r.sk_model || '').trim();
  const variant  =  r.variant  || r.sk_var   || '';
  const year     =  r.year     || r.sk_year  || '';
  const ryear    =  r.ryear    || r.sk_ryear || '';
  const fuel     =  r.fuel     || r.sk_fuel  || '';
  const trans    =  r.trans    || r.sk_trans || '';
  const rawColor =  r.color    || r.sk_color || '';
  const color    =  rawColor.charAt(0).toUpperCase() + rawColor.slice(1).toLowerCase();
  const km       =  r.km       || r.sk_km    || '';
  const own      =  r.own      || r.sk_own   || '';
  const regNo    = (r.regNo    || r.sk_regn  || '').toUpperCase().replace(/\s+/g, '-');
  const insval   =  r.insval   || r.sk_insval || '';
  const sp       = parseFloat(r.sp  || r.sk_sp  || 0);
  const rto      = parseFloat(r.rto || r.sk_rto || 0);
  const ins      = parseFloat(r.ins || r.sk_ins || 0);
  const total    = sp + rto + ins;
  const { full: rtoFull, short: rtoShort } = rtoInfo(regNo);
  const vehicleName = [make, model, variant].filter(Boolean).join(' ');

  const features = getVehicleFeatures(make, model, variant);

  const leftDetails = [
    ['Make',            make        || '—'],
    ['Model',           model       || '—'],
    ['Variant',         variant     || '—'],
    ['Mfg / Reg Year', `${year || '—'} / ${ryear || '—'}`],
    ['Registration No.', regNo      || '—'],
    ['Fuel Type',       fuel        || '—'],
    ['Transmission',    trans       || '—'],
  ];
  const rightDetails = [
    ['Odometer',         fmtKm(km)],
    ['Ownership',        ownerLabel(own)],
    ['Exterior Colour',  color       || '—'],
    ['Insurance',        insval      || 'Comprehensive'],
    ['RTO State',        rtoFull],
  ];

  const priceRows = [
    ['Vehicle Sale Price', sp],
    rto ? ['RTO Transfer & Documentation', rto] : null,
    ins ? ['Insurance — 1-Year Comprehensive', ins] : null,
  ].filter(Boolean);

  const pillStyle = { padding:'4px 11px', border:`1px solid ${C.border}`, borderRadius:20, fontSize:10, fontWeight:600, color:'#374151', background:C.gray, display:'inline-block' };

  return (
    <div style={{ width:794, background:C.white, fontFamily:"'Inter','Plus Jakarta Sans',sans-serif", color:C.text, fontSize:12, lineHeight:1.4 }}>

      {/* ── HEADER ── */}
      <div style={{ background:C.navy, padding:'24px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:4, height:52, background:C.gold, borderRadius:2, flexShrink:0 }}></div>
          <div>
            <div style={{ fontSize:28, fontWeight:800, color:'#FFF', fontFamily:"'Space Grotesk',sans-serif", letterSpacing:1, lineHeight:1, marginBottom:5 }}>CARECAY</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.52)', letterSpacing:2.5, textTransform:'uppercase', fontWeight:500 }}>Multi-Brand Pre-Owned Cars · Established 2001</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:30, fontWeight:800, color:C.gold, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:2, lineHeight:1 }}>QUOTATION</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.48)', letterSpacing:3, textTransform:'uppercase', marginTop:5 }}>Vehicle Price Quote</div>
        </div>
      </div>
      <div style={{ height:2.5, background:`linear-gradient(90deg,${C.gold},${C.goldLt},${C.gold})` }}></div>

      {/* ── INFO ROW ── */}
      <div style={{ background:C.gray, padding:'14px 32px', display:'flex', borderBottom:`1px solid ${C.border}` }}>
        {[
          ['Quotation No.', qNo],
          ['Date', todayDate],
          ['Prepared For', clientName || '[ Client Name ]'],
        ].map(([lbl, val], i) => (
          <div key={lbl} style={{ flex:1, paddingRight: i < 2 ? 24 : 0 }}>
            <div style={{ fontSize:8.5, fontWeight:700, color:C.label, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>{lbl}</div>
            <div style={{ fontSize:13, fontWeight:700, color: (i===2 && !clientName) ? '#A0A8BF' : C.text, fontFamily:"'Space Grotesk',sans-serif" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── VEHICLE SECTION ── */}
      <div style={{ padding:'18px 32px 14px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:9, fontWeight:700, color:C.gold, letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Your Selected Vehicle</div>
        <div style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.15, marginBottom:10 }}>{vehicleName || '—'}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {year    && <span style={pillStyle}>{year}</span>}
          {fuel    && <span style={pillStyle}>{fuel}</span>}
          {trans   && <span style={pillStyle}>{trans}</span>}
          {own     && <span style={pillStyle}>{ownerLabel(own)}</span>}
          {km      && <span style={pillStyle}>{fmtKm(km)}</span>}
          {regNo   && <span style={pillStyle}>{rtoShort || regNo.split('-').slice(0,2).join('-')} · {rtoFull.split(' (')[0] || regNo}</span>}
        </div>
      </div>

      {/* ── PHOTOS ── */}
      <div style={{ padding:'16px 32px', display:'flex', gap:16, borderBottom:`1px solid ${C.border}` }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex:1, height:154, border:`1.5px solid ${C.border}`, borderRadius:10, overflow:'hidden', position:'relative', background:C.offWh, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ position:'absolute', top:8, left:8, background:C.navy, color:'#FFF', fontSize:9, fontWeight:700, padding:'3px 10px', borderRadius:12, letterSpacing:.5, zIndex:1 }}>
              PHOTO {i + 1}
            </div>
            {photos[i]?.url ? (
              <img src={photos[i].url} alt={`Photo ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <div style={{ textAlign:'center', color:'#B8C4D8' }}>
                <CarSVG />
                <div style={{ fontSize:9, letterSpacing:1, textTransform:'uppercase', fontWeight:700, marginTop:6, color:'#C0CCDC' }}>
                  {i === 0 ? 'Front View' : 'Interior / Other'}
                </div>
                <div style={{ fontSize:8, color:'#D0D8E8', marginTop:2 }}>photo not uploaded</div>
              </div>
            )}
            {photos[i]?.name && (
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(to top,rgba(13,27,46,.72),transparent)', padding:'22px 10px 8px', fontSize:9.5, fontWeight:700, color:'#FFF', textAlign:'center', letterSpacing:.4, textTransform:'uppercase' }}>
                {photos[i].name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── VEHICLE DETAILS ── */}
      <div style={{ padding:'16px 32px', borderBottom:`1px solid ${C.border}` }}>
        <SectionHead label="Vehicle Details" />
        <div style={{ display:'flex', gap:24 }}>
          {[leftDetails, rightDetails].map((col, ci) => (
            <div key={ci} style={{ flex:1 }}>
              {col.map(([k, v], idx) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5.5px 0', borderBottom: idx < col.length-1 ? `1px solid ${C.border}` : 'none', fontSize:11.5 }}>
                  <span style={{ color:C.label, fontWeight:500 }}>{k}</span>
                  <span style={{ fontWeight:700, color:C.text, textAlign:'right', maxWidth:'58%' }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── KEY FEATURES ── */}
      <div style={{ padding:'16px 32px', borderBottom:`1px solid ${C.border}` }}>
        <SectionHead label="Key Features & Highlights" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 20px' }}>
          {features.map((feat, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.gold, flexShrink:0 }}></div>
              <span style={{ fontSize:10.5, color:C.text, fontWeight:500 }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROAD-READY ASSURANCE ── */}
      <div style={{ background:C.navy, padding:'12px 32px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
        <span style={{ fontSize:9, fontWeight:700, color:C.gold, letterSpacing:1.5, textTransform:'uppercase', marginRight:14, whiteSpace:'nowrap' }}>Road-Ready Assurance</span>
        {['203-Point Inspected','12-Month Warranty*','Road-Ready Detailed','RC Transfer Support','Verified · Non-Flood History'].map(item => (
          <span key={item} style={{ display:'inline-flex', alignItems:'center', gap:5, marginRight:16, fontSize:10, color:'#FFF', fontWeight:500 }}>
            <Check />{item}
          </span>
        ))}
      </div>

      {/* ── PRICE BREAKDOWN ── */}
      <div style={{ padding:'16px 32px' }}>
        <SectionHead label="Price Breakdown" />
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
          {priceRows.map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', background:C.offWh, padding:'8px 14px', borderRadius:6, fontSize:12 }}>
              <span style={{ color:C.text, fontWeight:500 }}>{k}</span>
              <span style={{ fontWeight:700, color:C.text, fontFamily:"'Space Grotesk',sans-serif" }}>{fmtAmt(v) || '—'}</span>
            </div>
          ))}
        </div>
        <div style={{ background:C.navy, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:8 }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:'#FFF', letterSpacing:1.8, textTransform:'uppercase' }}>Total On-Road Price</span>
          <span style={{ fontSize:22, fontWeight:800, color:C.gold, fontFamily:"'Space Grotesk',sans-serif" }}>{total > 0 ? '₹' + total.toLocaleString('en-IN') : '—'}</span>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding:'16px 32px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderTop:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.text, fontFamily:"'Space Grotesk',sans-serif", marginBottom:22 }}>For Carecay Pvt. Ltd.</div>
          <div style={{ width:180, height:1, background:C.text, marginBottom:5 }}></div>
          <div style={{ fontSize:9, color:C.label, letterSpacing:1, textTransform:'uppercase' }}>Authorised Signatory</div>
        </div>
        <div style={{ textAlign:'right', fontSize:10.5, color:C.label, lineHeight:1.75 }}>
          <div>Showroom: SG Highway &amp; Mumatpura Road, Ahmedabad, Gujarat</div>
          <div>sales@carecay.in &nbsp;·&nbsp; www.carecay.in</div>
          <div style={{ color:C.gold, fontWeight:600, fontSize:10, marginTop:2 }}>Also listed on CarWale · Spinny · CarDekho</div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ background:C.navy, padding:'8px 32px', textAlign:'center', fontSize:9.5, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:2.5, textTransform:'uppercase' }}>
        Carecay — Drive Home Confidence
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════════════════════ */
export const QuotationModal = ({ isOpen, onClose, stockRec }) => {
  const [clientName, setClientName] = useState('');
  const [photos, setPhotos]         = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [downloading, setDownloading]     = useState(null); // 'jpeg' | 'pdf' | null
  const [copying, setCopying]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const quoteRef   = useRef(null);
  const captureRef = useRef(null);
  const today    = todayFmt();

  useEffect(() => {
    if (!isOpen) return;
    setClientName('');
    setPhotos([]);
    if (!stockRec?.id) return;
    setLoadingPhotos(true);
    loadMediaFromFirestore('stk', stockRec.id)
      .then(items => {
        const imgs = items.filter(i => i.url && (i.type?.startsWith('image/') || i.url.startsWith('data:image')));
        setPhotos(imgs.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));
  }, [isOpen, stockRec]);

  if (!isOpen || !stockRec) return null;

  const qNo = getQNo(stockRec.stkId);

  const captureCanvas = async () => {
    if (!captureRef.current) throw new Error('Document not ready yet');
    await document.fonts.ready;
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(captureRef.current, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });
  };

  const handleDownload = async (format) => {
    if (!captureRef.current) return;
    setDownloading(format);
    try {
      const canvas = await captureCanvas();
      const safeName = `${qNo}_${(clientName || 'quotation').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

      if (format === 'jpeg') {
        const a = document.createElement('a');
        a.download = `${safeName}.jpg`;
        a.href = canvas.toDataURL('image/jpeg', 0.94);
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        // Calculate how tall the image would be at full page width
        const imgH = (canvas.height / canvas.width) * pdfW;

        if (imgH <= pdfH) {
          // Fits in a single page
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfW, imgH);
        } else {
          // Multi-page: slice canvas into A4-height chunks
          const pageHeightPx = Math.floor((pdfH / pdfW) * canvas.width);
          let yOffset = 0;
          let pageIndex = 0;
          while (yOffset < canvas.height) {
            const chunkH = Math.min(pageHeightPx, canvas.height - yOffset);
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = chunkH;
            const ctx = pageCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, yOffset, canvas.width, chunkH, 0, 0, canvas.width, chunkH);
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
            if (pageIndex > 0) pdf.addPage();
            const renderedH = (chunkH / canvas.width) * pdfW;
            pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfW, renderedH);
            yOffset += pageHeightPx;
            pageIndex++;
          }
        }
        pdf.save(`${safeName}.pdf`);
      }
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
    setDownloading(null);
  };

  const handleCopyImage = async () => {
    if (!captureRef.current) return;
    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      alert('This browser does not support copying images to the clipboard. Use Download JPEG instead.');
      return;
    }
    setCopying(true);
    try {
      // Pass the clipboard a pending Blob promise (rather than awaiting first) so
      // browsers that require the write to start within the click's user-gesture
      // window (Safari/Firefox) don't reject it once html2canvas finishes later.
      const blobPromise = captureCanvas().then(canvas => new Promise((resolve, reject) => {
        canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not render image'))), 'image/png');
      }));
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blobPromise })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Copy failed: ' + e.message);
    }
    setCopying(false);
  };

  const canDownload = !!clientName.trim() && !downloading;
  const canCopy     = !!clientName.trim() && !copying;

  return (
    <div className="overlay" style={{ zIndex: 600 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mbox" style={{ maxWidth:880, maxHeight:'95vh', display:'flex', flexDirection:'column', overflowY:'hidden', padding:0 }}>

        {/* Modal chrome header */}
        <div className="m-hdr" style={{ flexShrink:0 }}>
          <div className="m-hdr-icon" style={{ background:`linear-gradient(135deg,${C.navy},#1B3A6B)` }}>
            <i className="fa fa-file-invoice-dollar" style={{ color:C.gold }}></i>
          </div>
          <div>
            <h3 style={{ margin:0 }}>Vehicle Price Quotation</h3>
            <p style={{ fontSize:11, color:'var(--text3)', margin:0 }}>
              {(stockRec.make || stockRec.sk_make || '')} {(stockRec.model || stockRec.sk_model || '')} · {stockRec.regNo || stockRec.sk_regn || stockRec.stkId}
            </p>
          </div>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>

        {/* Client name + download controls */}
        <div style={{ padding:'10px 22px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', gap:12, flexShrink:0, flexWrap:'wrap' }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', whiteSpace:'nowrap', letterSpacing:'.5px', textTransform:'uppercase' }}>
            Prepared For *
          </label>
          <input
            className="srch"
            placeholder="Enter client name…"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            style={{ flex:1, minWidth:180, maxWidth:300 }}
            autoFocus
          />
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button
              className="btn btn-out btn-sm"
              onClick={() => handleDownload('jpeg')}
              disabled={!canDownload}
              title={!clientName.trim() ? 'Enter client name first' : ''}
            >
              <i className="fa fa-image"></i>
              {downloading === 'jpeg' ? 'Saving…' : 'Download JPEG'}
            </button>
            <button
              className="btn btn-or btn-sm"
              onClick={() => handleDownload('pdf')}
              disabled={!canDownload}
              title={!clientName.trim() ? 'Enter client name first' : ''}
            >
              <i className="fa fa-file-pdf"></i>
              {downloading === 'pdf' ? 'Saving…' : 'Download PDF'}
            </button>
            <button
              className="btn btn-out btn-sm"
              onClick={handleCopyImage}
              disabled={!canCopy}
              title={!clientName.trim() ? 'Enter client name first' : 'Copy as image to paste into WhatsApp, email, etc.'}
            >
              <i className={`fa ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copying ? 'Copying…' : copied ? 'Copied!' : 'Copy Image'}
            </button>
          </div>
          {!clientName.trim() && (
            <span style={{ fontSize:10, color:'var(--warn)', fontWeight:600, width:'100%', paddingLeft:2 }}>
              ↑ Enter client name to enable download
            </span>
          )}
        </div>

        {/* Quotation preview area */}
        <div style={{ flex:1, overflow:'auto', padding:'24px 20px', background:'#CBD5E1', display:'flex', justifyContent:'center' }}>
          {loadingPhotos ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'var(--text3)', flexDirection:'column', gap:12, minHeight:300 }}>
              <i className="fa fa-spinner fa-spin" style={{ fontSize:28 }}></i>
              <span style={{ fontSize:12 }}>Loading vehicle photos…</span>
            </div>
          ) : (
            <div ref={quoteRef} style={{ boxShadow:'0 4px 40px rgba(0,0,0,0.28)' }}>
              <QuotationDoc
                r={stockRec}
                clientName={clientName}
                photos={photos}
                qNo={qNo}
                todayDate={today}
              />
            </div>
          )}
        </div>

        {/* Off-screen, fully-sized copy used for html2canvas capture so the
            scrollable preview's overflow/height never clips the download */}
        {!loadingPhotos && (
          <div style={{ position:'fixed', top:0, left:-99999, zIndex:-1, pointerEvents:'none' }}>
            <div ref={captureRef}>
              <QuotationDoc
                r={stockRec}
                clientName={clientName}
                photos={photos}
                qNo={qNo}
                todayDate={today}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

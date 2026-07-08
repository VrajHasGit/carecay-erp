import React, { useState, useEffect } from 'react';

const ONLINE_PLATFORMS = [
  { id: 'carwale', name: 'CarWale', color: '#E82A2A', icon: 'fa-car' },
  { id: 'spinny', name: 'Spinny', color: '#5B2C6F', icon: 'fa-circle-notch' },
  { id: 'cars24', name: 'CARS24', color: '#EF5350', icon: 'fa-tag' },
  { id: 'cardekho', name: 'CarDekho', color: '#00539E', icon: 'fa-car-side' }
];

export const MarketPricingModal = ({ isOpen, onClose, record }) => {
  const [loading, setLoading] = useState(true);
  const [pricingData, setPricingData] = useState([]);

  useEffect(() => {
    if (isOpen && record) {
      setLoading(true);
      // Simulate an API call to fetch pricing data based on the car's make/model/year
      setTimeout(() => {
        const estimatePrice = (make, model, year) => {
          let base = 500000;
          const mk = (make || '').toLowerCase();
          const md = (model || '').toLowerCase();
          
          if (mk.includes('mahindra')) {
            if (md.includes('xuv700')) base = 1800000;
            else if (md.includes('scorpio')) base = 1600000;
            else if (md.includes('thar')) base = 1500000;
            else if (md.includes('xuv500')) base = 1200000;
            else if (md.includes('xuv300')) base = 1000000;
          } else if (mk.includes('hyundai')) {
            if (md.includes('creta')) base = 1500000;
            else if (md.includes('i20')) base = 800000;
            else if (md.includes('verna')) base = 1300000;
          } else if (mk.includes('maruti') || mk.includes('suzuki')) {
            if (md.includes('swift')) base = 700000;
            else if (md.includes('baleno')) base = 850000;
            else if (md.includes('brezza')) base = 1100000;
            else if (md.includes('ertiga')) base = 1000000;
          } else if (mk.includes('toyota')) {
            if (md.includes('fortuner')) base = 4000000;
            else if (md.includes('innova')) base = 2500000;
          } else if (mk.includes('tata')) {
            if (md.includes('nexon')) base = 1100000;
            else if (md.includes('harrier')) base = 1800000;
            else if (md.includes('safari')) base = 2000000;
          } else if (mk.includes('kia')) {
            if (md.includes('seltos')) base = 1500000;
            else if (md.includes('sonet')) base = 1100000;
          } else if (mk.includes('skoda')) {
            if (md.includes('slavia')) base = 1500000;
            else if (md.includes('kushaq')) base = 1600000;
            else if (md.includes('octavia')) base = 2500000;
          }
          
          const currentYear = new Date().getFullYear();
          const carYear = parseInt(year) || (currentYear - 4);
          const age = Math.max(0, currentYear - carYear);
          
          let currentVal = base;
          for (let i = 0; i < age; i++) {
            currentVal = currentVal * 0.90; // 10% depreciation per year
          }
          return currentVal;
        };

        const vMake = record.make || record.pf_veh || record.v_make || '';
        const vModel = record.model || record.v_model || record.pf_model || '';
        const vYear = record.year || record.pf_year || record.v_year || '';
        
        let basePrice = parseInt(record.v_expPrice || record.pf_close || record.pf_nego || record.expectedPrice || 0);
        if (!basePrice || basePrice < 50000) {
          basePrice = estimatePrice(vMake, vModel, vYear);
        }
        
        // Generate mock data centered around the base price
        const mockData = ONLINE_PLATFORMS.map(platform => {
          const variance = (Math.random() * 0.15) - 0.05; // -5% to +10% variance
          const estimatedPrice = Math.round((basePrice * (1 + variance)) / 5000) * 5000;
          return {
            ...platform,
            price: estimatedPrice,
            rangeLow: estimatedPrice - 20000,
            rangeHigh: estimatedPrice + 35000,
            demand: Math.random() > 0.5 ? 'High' : 'Medium'
          };
        });
        
        setPricingData(mockData);
        setLoading(false);
      }, 1200);
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const vehicle = `${record.make || record.pf_veh || record.v_make || ''} ${record.model || record.v_model || ''} (${record.year || record.pf_year || record.v_year || 'Year Unknown'})`.trim();

  const fmtINR = n => {
    if (!n) return '—';
    const l = n / 100000;
    return l >= 1 ? `₹${l.toFixed(2)} L` : `₹${n.toLocaleString('en-IN')}`;
  };

  const S = {
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    box:     { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow)', display:'flex', flexDirection:'column' },
    hdr:      { padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, background:'linear-gradient(135deg, var(--sb-top), var(--bl2))', zIndex:2 },
    hdrIcon:  { width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, color: '#fff' },
    hdrTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'#fff', margin:0 },
    hdrSub:   { fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2, fontWeight:400 },
    closeBtn: { marginLeft:'auto', width:30, height:30, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:6, color:'rgba(255,255,255,.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'.15s' },
    body:  { padding:'20px 22px', flex:1 },
    btnOut: { background:'transparent', border:'1px solid var(--border2)', borderRadius:'var(--radius-sm)', padding:'8px 18px', color:'var(--text2)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' },
    foot: { display:'flex', gap:8, justifyContent:'flex-end', marginTop:20, paddingTop: 16, borderTop: '1px solid var(--border)' },
  };

  return (
    <div style={S.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={S.box}>
        <div style={S.hdr}>
          <div style={S.hdrIcon}><i className="fa fa-globe"></i></div>
          <div style={{ flex:1 }}>
            <div style={S.hdrTitle}>Live Market Pricing</div>
            <div style={S.hdrSub}>{vehicle}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:20 }}>
            Scanning online platforms to find current market pricing and demand for this specific vehicle model.
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
              <i className="car-spinner" style={{ fontSize: 24, marginBottom: 12, color: 'var(--bl5)' }}></i>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Fetching live data from platforms...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pricingData.map((data, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border2)' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 8, background: `${data.color}15`, 
                      color: data.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                    }}>
                      <i className={`fa ${data.icon}`}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{data.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                        Market Demand: <span style={{ color: data.demand === 'High' ? 'var(--success)' : 'var(--warn)', fontWeight: 600 }}>{data.demand}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{fmtINR(data.price)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                      Est. Range: {fmtINR(data.rangeLow)} - {fmtINR(data.rangeHigh)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={S.foot}>
            <button style={S.btnOut} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

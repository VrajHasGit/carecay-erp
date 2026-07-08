import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { fmtDate, fmt } from '../../utils/helpers';

export const VtModal = ({ isOpen, onClose, stkId }) => {
  const { data } = useData();

  const vehicle = useMemo(() => {
    if (!stkId || !data?.stk) return null;
    return data.stk.find(r => r.stkId === stkId || r.id === stkId);
  }, [stkId, data]);

  const reg = vehicle?.regNo || vehicle?.sk_regn;
  const sId = vehicle?.stkId || vehicle?.id;

  const valRecord = useMemo(() => {
    if (!data?.val || !reg) return null;
    return data.val.find(v => v.v_regn === reg || v.regNo === reg);
  }, [data?.val, reg]);

  const wsRecords = useMemo(() => {
    if (!data?.ws || !sId) return [];
    return data.ws.filter(w => w.stkId === sId || w.w_car === sId);
  }, [data?.ws, sId]);

  const purInqRecord = useMemo(() => {
    if (!data?.pur_inq || !reg) return null;
    return data.pur_inq.find(i => i.regNo === reg || i.id === sId);
  }, [data?.pur_inq, reg, sId]);

  const ordRecord = useMemo(() => {
    if (!data?.ord || !sId) return null;
    return data.ord.find(o => o.o_car === sId || o.stkId === sId);
  }, [data?.ord, sId]);

  if (!isOpen) return null;

  const InfoItem = ({ label, value, icon, color = 'var(--text)' }) => (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, fontSize: '14px', flexShrink: 0 }}>
        <i className={`fa ${icon}`}></i>
      </div>
      <div>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif" }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="overlay" id="m_vt" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="mbox" style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="m-hdr" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--sb-top), var(--bl2))' }}>
          <div className="m-hdr-icon" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}><i className="fa fa-clipboard-list"></i></div>
          <div style={{ flex: 1 }}>
            <h3 id="vt_title" style={{ color: '#fff', margin: 0, fontSize: 16 }}>Vehicle History Report</h3>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{vehicle ? `${vehicle.make} ${vehicle.model} - ${vehicle.regNo}` : 'Loading...'}</div>
          </div>
          <button className="m-close" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)' }}>✕</button>
        </div>
        
        <div className="m-body" style={{ overflowY: 'auto', padding: '24px' }}>
          {!vehicle ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>Loading vehicle data...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <InfoItem 
                  label="When it was Purchased" 
                  value={vehicle.pDate ? fmtDate(vehicle.pDate) : 'Unknown'} 
                  icon="fa-money-bill-wave" 
                  color="#10B981" 
                />
                <InfoItem 
                  label="Addition of Car Stock Date" 
                  value={fmtDate(vehicle.createdAt || vehicle.pDate || new Date().toISOString())} 
                  icon="fa-warehouse" 
                  color="#3B82F6" 
                />
                <InfoItem 
                  label="Previous Owners" 
                  value={vehicle.owners || vehicle.sk_own || vehicle.v_own || '1st Owner'} 
                  icon="fa-users" 
                  color="#F59E0B" 
                />
                <InfoItem 
                  label="Purchase Inquiry Date" 
                  value={purInqRecord ? fmtDate(purInqRecord.date || purInqRecord.createdAt) : 'No Inquiries Yet'} 
                  icon="fa-comment-dots" 
                  color="#8B5CF6" 
                />
                <InfoItem 
                  label="Purchase Valuation Date" 
                  value={valRecord ? fmtDate(valRecord.v_date || valRecord.date || valRecord.createdAt) : 'Not Evaluated Yet'} 
                  icon="fa-clipboard-check" 
                  color="#6366F1" 
                />
                <InfoItem 
                  label="Order Booking Date" 
                  value={ordRecord ? fmtDate(ordRecord.o_date || ordRecord.orderDate || ordRecord.createdAt) : 'Not Booked Yet'} 
                  icon="fa-file-invoice-dollar" 
                  color="#EC4899" 
                />
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ color: '#F97316', fontSize: '16px' }}><i className="fa fa-wrench"></i></div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', fontFamily: "'Space Grotesk',sans-serif" }}>Workshop Work Done</div>
                </div>
                
                {wsRecords.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wsRecords.map((w, i) => (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{w.w_desc || w.jobDesc || 'General Service'}</span>
                          <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 600 }}>{fmtDate(w.w_date || w.jobDate || w.createdAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text2)' }}>
                          <span><strong>Cost:</strong> {fmt(w.w_cost || w.cost || 0)}</span>
                          <span><strong>Status:</strong> <span style={{ color: w.status === 'Completed' ? 'var(--success)' : 'var(--warn)' }}>{w.status || w.w_stat || 'Pending'}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text3)', fontSize: '12px', padding: '16px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    No workshop work has been recorded for this vehicle.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

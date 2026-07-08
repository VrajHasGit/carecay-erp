import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { TestdriveModal } from '../components/modals/TestdriveModal';

const TestDrive = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [gridDate, setGridDate] = useState(today());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const records = data['td'] || [];
  
  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.tdId || '').toLowerCase().includes(q) ||
      (r.td_bname || r.buyerName || '').toLowerCase().includes(q) ||
      (r.td_regn || r.regNo || '').toLowerCase().includes(q) ||
      (r.td_mob || r.mobile || '').includes(q);
  });
  
  const gridRecords = records.filter(r => r.td_date === gridDate);
  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const handleSave = async (fd) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editRec) { await updateRecord('td', editRec.id, fd, { title: 'Test Drive Updated', message: (fd.td_bname || fd.buyerName || '') + ' — ' + (fd.td_regn || fd.regNo || ''), link: '/test-drive', actor }); showToast('Updated!'); }
      else { const cnt = await getNextCounter('TD'); await addRecord('td', {...fd, tdId: genId('TD', cnt), date: fd.date||today()}, { title: 'Test Drive Scheduled', message: (fd.td_bname || fd.buyerName || '') + ' — ' + (fd.td_regn || fd.regNo || ''), link: '/test-drive', actor }); showToast('Test Drive record added!'); }
      await refresh('td'); setIsModalOpen(false);
    } catch(e) { showToast('Failed: '+e.message, 'error'); }
  };
  const handleDelete = async (rec) => { if (!await window.confirm('Delete?')) return; try { await deleteRecord('td', rec.id); await refresh('td'); showToast('Deleted.', 'info'); } catch(e) { showToast('Delete failed.', 'error'); } };
  return (
    <div className="page on" id="pg_testdrive">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type==='success'?'suc':'err'}`} style={{display:'flex'}}><span style={{flex:1}}>{toast.msg}</span><button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-road"></i></div>Test Drive</h1><p>Schedule and manage test drives</p></div>
        <div className="ph-actions">
          <div className="view-toggles" style={{display:'flex', background:'var(--bg)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', overflow:'hidden'}}>
            <button style={{padding:'8px 12px', background:viewMode==='list'?'var(--or1)':'transparent', color:viewMode==='list'?'#fff':'var(--text)', border:'none', cursor:'pointer'}} onClick={()=>setViewMode('list')}><i className="fa fa-list"></i></button>
            <button style={{padding:'8px 12px', background:viewMode==='grid'?'var(--or1)':'transparent', color:viewMode==='grid'?'#fff':'var(--text)', border:'none', cursor:'pointer'}} onClick={()=>setViewMode('grid')}><i className="fa fa-calendar-day"></i></button>
          </div>
          {viewMode === 'list' && <input className="srch" placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} />}
          {viewMode === 'grid' && <input type="date" className="srch" value={gridDate} onChange={e=>setGridDate(e.target.value)} />}
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Record</button>
        </div>
      </div>
      {isModalOpen && <TestdriveModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSave={handleSave} editData={editRec} />}
      
      {viewMode === 'list' ? (
        <div className="tc">
          <div className="tc-hdr"><div className="tc-title">Test Drive <span style={{background:'var(--success)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,marginLeft:8}}>{filtered.length}</span></div></div>
          <div className="tbl-wrap">
          {filtered.length === 0 ? (
            <div className="empty" style={{padding:48}}>
              <i className="fa fa-road" style={{fontSize:36,color:'var(--border2)',display:'block',marginBottom:12}}></i>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text2)',marginBottom:8}}>No records yet</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>Click "Add Record" to create your first Test Drive entry.</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:700,color:'var(--success)',fontFamily:"'Space Grotesk',sans-serif"}}>{r.tdId||r.id?.slice(0,12)}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td>{r.name||r.buyerName||r.sellerName||r.regNo||'—'}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status||'—'}</span></td>
                  <td><div className="act-grp">
                    <button className="btn-icon bi-edit" title="Edit" onClick={()=>{setEditRec(r);setIsModalOpen(true);}}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-del" title="Delete" onClick={()=>handleDelete(r)}><i className="fa fa-trash"></i></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
      ) : (
      <div className="tc" style={{background:'transparent', border:'none'}}>
        <div style={{display:'grid', gridTemplateColumns:'80px 1fr', gap:10}}>
          {timeSlots.map(time => {
            const slotRecords = gridRecords.filter(r => (r.td_time||'').startsWith(time.split(':')[0]));
            return (
              <React.Fragment key={time}>
                <div style={{textAlign:'right', padding:'10px 10px 10px 0', color:'var(--text2)', fontWeight:600, borderBottom:'1px solid var(--border)'}}>{time}</div>
                <div style={{borderBottom:'1px solid var(--border)', padding:'10px 0', display:'flex', gap:'10px', flexWrap:'wrap', minHeight:'60px'}}>
                  {slotRecords.length > 0 ? slotRecords.map(r => (
                    <div key={r.id} onClick={()=>{setEditRec(r);setIsModalOpen(true);}} style={{background:'var(--bg)', border:'1px solid var(--border2)', borderLeft:`4px solid ${r.td_stat==='Completed'?'var(--success)':r.td_stat==='Cancelled'?'var(--warn)':'var(--or1)'}`, padding:'10px', borderRadius:'var(--radius-sm)', cursor:'pointer', width:'250px', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                      <div style={{fontSize:'12px', color:'var(--text2)', marginBottom:'4px'}}><strong>{r.td_cname||r.name}</strong> • {r.td_mob}</div>
                      <div style={{fontSize:'13px', fontWeight:600, color:'var(--text)'}}>{r.td_mm} ({r.td_regn})</div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px'}}>
                        <span style={{fontSize:'11px', background:'var(--border)', padding:'2px 6px', borderRadius:'4px'}}>{r.td_dur}</span>
                        <span className={`badge ${statusBadge(r.td_stat)}`} style={{fontSize:'10px'}}>{r.td_stat}</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{color:'var(--border2)', fontStyle:'italic', fontSize:'13px', alignSelf:'center'}}>Available</div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
export default TestDrive;

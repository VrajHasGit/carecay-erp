import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate, fmt, statusBadge } from '../utils/helpers';
import { PfuModal } from '../components/modals/PfuModal';
import { AIPriceModal } from '../components/modals/AIPriceModal';
import { MarketPricingModal } from '../components/modals/MarketPricingModal';
import MediaViewer from '../components/MediaViewer';
import { loadMediaFromFirestore } from '../utils/uploadMedia';

const PurchaseFollowUp = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);

  useEffect(() => {
    const autoId = location.state?.autoOpenId;
    if (!autoId) return;
    const rec = (data.pfu || []).find(r => r.id === autoId);
    if (rec) { setEditRec(rec); setIsModalOpen(true); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [data.pfu, location.state?.autoOpenId]);
  const [toast, setToast] = useState(null);
  const [aiRec, setAiRec] = useState(null);
  const [marketRec, setMarketRec] = useState(null);
  const [viewer, setViewer] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const records = data.pfu || [];
  const filtered = records.filter(r => {
    if (search) {
      // When searching: show all records matching the search fields
      const q = search.toLowerCase();
      return (r.pfuId || r.pfId || '').toLowerCase().includes(q) ||
        (r.pf_inqid || '').toLowerCase().includes(q) ||
        (r.sellerName || r.pf_sname || '').toLowerCase().includes(q) ||
        (r.mobile || r.pf_smob || '').includes(q) ||
        (r.pf_veh || r.make || '').toLowerCase().includes(q);
    }
    // Without search: apply all normal filters
    if (r.stage && (r.stage === 'Closer' || r.stage === 'Documents')) return false;
    if (r.pf_inqid) {
      const inPcl = data.pcl?.some(p => p.inqId === r.pf_inqid || p.pc_inqid === r.pf_inqid);
      const inDoc = data.doc?.some(d => d.inqId === r.pf_inqid || d.dc_obid === r.pf_inqid);
      if (inPcl || inDoc) return false;
    }
    const stat = (r.pf_stat || '').toLowerCase();
    if (stat === 'closed-lost') return false;
    const followUps = r.followUps || [];
    if (followUps.length > 0) {
      const lastStat = (followUps[followUps.length - 1].stat || '').toLowerCase();
      if (lastStat === 'closed-lost') return false;
    }
    return true;
  });

  // Auto-fix missing IDs
  useEffect(() => {
    let fixed = false;
    const fixIds = async () => {
      for (const r of records) {
        if (!r.pfuId) {
          const cnt = await getNextCounter('pfu');
          await updateRecord('pfu', r.id, { pfuId: genId('PFU', cnt) });
          fixed = true;
        }
      }
      if (fixed) refresh('pfu');
    };
    if (records.length > 0) fixIds();
  }, [records]);

  const handleSave = async (formData) => {
    try {
      let recId = editRec ? editRec.id : null;
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      const sellerName = formData.pf_sname || formData.sellerName || '';

      // Determine status from the last follow-up entry
      const followUps = formData.followUps || [];
      const lastFu = followUps.length > 0 ? followUps[followUps.length - 1] : null;
      const latestStat = lastFu?.stat || formData.pf_stat || 'Interested';

      // Sync pf_stat top-level field so filters and table displays work
      const dataToSave = { ...formData, pf_stat: latestStat };

      if (editRec) { 
        await updateRecord('pfu', editRec.id, dataToSave, {
          title: 'Follow-Up Updated', message: `${sellerName} — ${formData.pf_veh || ''}`,
          link: '/purchase-follow', actor,
        }); 
        showToast('Updated!'); 
      } else { 
        const cnt = await getNextCounter('pfu'); 
        recId = await addRecord('pfu', { ...dataToSave, pfuId: genId('PFU', cnt), date: formData.date || today() }, {
          title: 'New Follow-Up', message: `${sellerName} — ${formData.pf_veh || ''}`,
          link: '/purchase-follow', actor,
        }); 
        showToast('Follow-up added!'); 
      }

      const statLower = latestStat.toLowerCase();
      const isLost = statLower === 'closed-lost';

      // Closed-Won: Just save the status — do NOT move to closer yet.
      // The user will click "Print & Send to Closer" button to move it.

      if (isLost) {
        const inqRec = data.pur_inq?.find(i => i.inqId === formData.pf_inqid);
        if (inqRec) await deleteRecord('pur_inq', inqRec.id);
        if (recId) await deleteRecord('pfu', recId);
      }

      await refresh('pfu');
      if (isLost) await refresh('pur_inq');
      setIsModalOpen(false);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleDelete = async (rec) => {
    if (!await window.confirm('Delete?')) return;
    try { await deleteRecord('pfu', rec.id); await refresh('pfu'); showToast('Deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const handleWhatsApp = (rec) => {
    const msg = encodeURIComponent(`Hello ${rec.sellerName || rec.pf_sname}, following up on your ${rec.make || rec.pf_veh}. — Carecay`);
    window.open(`https://wa.me/91${rec.mobile || rec.pf_smob}?text=${msg}`, '_blank');
  };

  const showAIPrice = (r) => {
    const valRec = data.val?.find(v => v.v_inqid === r.pf_inqid) || {};
    setAiRec({ ...valRec, ...r });
  };
  const handleSaveAI = async ({ aiSuggestion }) => {
    if (!aiRec?.id) return;
    await updateRecord('pfu', aiRec.id, { aiSuggestion });
    await refresh('pfu');
    showToast('AI suggestion saved to record!');
  };

  const showMarketPrice = (r) => setMarketRec(r);

  // ─── Print Deal Summary & Send to Closer ───
  const handlePrintAndSend = async (rec) => {
    try {
      const followUps = rec.followUps || [];
      const lastFu = followUps.length > 0 ? followUps[followUps.length - 1] : {};
      const sellerName = rec.sellerName || rec.pf_sname || '';
      const mobile = rec.mobile || rec.pf_smob || '';
      const vehicle = `${rec.make || rec.pf_veh || ''} ${rec.model || rec.pf_model || ''}`.trim();
      const variant = rec.variant || rec.pf_var || '';
      const year = rec.year || rec.pf_year || '';
      const fuel = rec.fuel || rec.pf_fuel || '';
      const km = rec.km || rec.pf_km || '';
      const dealPrice = lastFu.dealPrice || rec.pf_close || rec.pf_nego || '0';
      const exec = lastFu.exec || '';
      const dealDate = lastFu.date || today();

      // Open print window with deal summary
      const printWin = window.open('', '_blank', 'width=800,height=600');
      printWin.document.write(`<!DOCTYPE html><html><head><title>Deal Summary</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; color: #f97316; }
          .header .company { font-size: 14px; color: #64748b; text-align: right; }
          .deal-badge { display: inline-block; background: #10b981; color: #fff; padding: 4px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; padding: 10px 14px; background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
          td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
          td.val { font-weight: 600; }
          .price-row td { font-size: 20px; font-weight: 700; color: #f97316; }
          .sign-row { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
          .sign-box { text-align: center; width: 200px; }
          .sign-line { border-top: 1px solid #1e293b; padding-top: 8px; font-size: 12px; color: #64748b; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style></head><body>
        <div class="header">
          <h1>Deal Summary</h1>
          <div class="company"><strong>Carecay Pvt Ltd</strong><br/>Purchase Department</div>
        </div>
        <div class="deal-badge">DEAL CLOSED — WON</div>
        <table>
          <tr><th style="width:35%">Field</th><th>Details</th></tr>
          <tr><td>Inquiry ID</td><td class="val">${rec.pf_inqid || ''}</td></tr>
          <tr><td>Seller Name</td><td class="val">${sellerName}</td></tr>
          <tr><td>Mobile</td><td class="val">${mobile}</td></tr>
          <tr><td>Vehicle</td><td class="val">${vehicle} ${variant}</td></tr>
          <tr><td>Year / Fuel</td><td class="val">${year} / ${fuel}</td></tr>
          <tr><td>KM Driven</td><td class="val">${km ? Number(km).toLocaleString('en-IN') + ' km' : ''}</td></tr>
          <tr><td>Deal Date</td><td class="val">${dealDate}</td></tr>
          <tr><td>Executive</td><td class="val">${exec}</td></tr>
          <tr class="price-row"><td>Agreed Deal Price</td><td>Rs. ${Number(dealPrice).toLocaleString('en-IN')}</td></tr>
        </table>
        <div class="sign-row">
          <div class="sign-box"><div class="sign-line">Seller Signature</div></div>
          <div class="sign-box"><div class="sign-line">Authorized By</div></div>
        </div>
        <div class="footer">Generated on ${new Date().toLocaleDateString('en-IN')} — Carecay Pvt Ltd</div>
        <script>window.onload = function(){ window.print(); }<\/script>
        </body></html>`);
      printWin.document.close();

      // Create Purchase Closer record
      const exists = data.pcl?.find(p => p.inqId === rec.pf_inqid || p.pc_inqid === rec.pf_inqid);
      if (!exists && rec.pf_inqid) {
        const cnt = await getNextCounter('pcl');
        await addRecord('pcl', {
          pclId: genId('PCL', cnt),
          pc_inqid: rec.pf_inqid,
          inqId: rec.pf_inqid,
          pc_sname: sellerName,
          sellerName: sellerName,
          mobile: mobile,
          make: rec.make || (rec.pf_veh ? rec.pf_veh.split(' ')[0] : ''),
          model: rec.model || (rec.pf_veh ? rec.pf_veh.split(' ').slice(1).join(' ') : ''),
          year: year,
          fuel: fuel,
          km: km,
          owners: rec.owners || rec.pf_own || '',
          pc_price: dealPrice,
          agreedPrice: dealPrice,
          status: 'Pending',
          stage: 'Closer',
        });
      }

      // Mark pfu as sent to closer so it disappears from list
      await updateRecord('pfu', rec.id, { stage: 'Closer', pf_stat: 'Closed-Won' });

      // Update inquiry
      const inqRec = data.pur_inq?.find(i => i.inqId === rec.pf_inqid);
      if (inqRec) await updateRecord('pur_inq', inqRec.id, { status: 'Closed-Won', stage: 'Closer' });

      await refresh('pfu');
      await refresh('pcl');
      await refresh('pur_inq');
      showToast('Deal printed & sent to Purchase Closer!');
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  };

  const handleSendToCloser = async (rec) => {
    if (!await window.confirm('Send this inquiry to closer?')) return;
    try {
      await updateRecord('pfu', rec.id, { pf_stat: 'Closed-Won', stage: 'Closer' });
      const inqRec = data.pur_inq?.find(i => i.inqId === rec.pf_inqid);
      if (inqRec) await updateRecord('pur_inq', inqRec.id, { status: 'Closed-Won', stage: 'Closer' });
      
      const exists = data.pcl?.find(p => p.inqId === rec.pf_inqid || p.pc_inqid === rec.pf_inqid);
      if (!exists && rec.pf_inqid) {
        const cnt = await getNextCounter('pcl');
        await addRecord('pcl', {
           pclId: genId('PCL', cnt),
           pc_inqid: rec.pf_inqid,
           inqId: rec.pf_inqid,
           pc_sname: rec.sellerName || rec.pf_sname || '',
           sellerName: rec.sellerName || rec.pf_sname || '',
           mobile: rec.mobile || rec.pf_smob || '',
           make: rec.make || (rec.pf_veh ? rec.pf_veh.split(' ')[0] : ''),
           model: rec.model || (rec.pf_veh ? rec.pf_veh.split(' ').slice(1).join(' ') : ''),
           year: rec.year || rec.pf_year || '',
           fuel: rec.fuel || rec.pf_fuel || '',
           km: rec.km || rec.pf_km || '',
           owners: rec.owners || rec.pf_own || '',
           pc_price: rec.pf_close || rec.pf_nego || '',
           agreedPrice: rec.pf_close || rec.pf_nego || '',
           status: 'Pending',
           stage: 'Closer',
        });
      }
      showToast('Sent to Closer!');
      await refresh('pfu');
      await refresh('pcl');
      await refresh('pur_inq');
    } catch (e) {
      showToast('Error sending to closer.', 'error');
    }
  };

  const openViewer = async (valRec) => {
    if (!valRec?.id) { showToast('No photos found.', 'info'); return; }
    try {
      const subMedia = await loadMediaFromFirestore('val', valRec.id);
      const directMedia = Array.isArray(valRec.v_media) ? valRec.v_media : [];
      const allMedia = [...subMedia, ...directMedia.filter(m => m.url)];
      if (allMedia.length > 0) { setViewer({ media: allMedia, index: 0 }); }
      else { showToast('No photos found.', 'info'); }
    } catch (e) { showToast('Failed to load media', 'error'); }
  };

  const handleVerifyDocs = async (rec) => {
    if (!await window.confirm('Send this inquiry to verify documents?')) return;
    try {
      await updateRecord('pfu', rec.id, { pf_stat: 'Closed-Won', stage: 'Closer' });
      const inqRec = data.pur_inq?.find(i => i.inqId === rec.pf_inqid);
      if (inqRec) await updateRecord('pur_inq', inqRec.id, { status: 'Closed-Won' });
      
      const exists = data.doc?.find(d => d.dc_obid === rec.pf_inqid || d.inqId === rec.pf_inqid);
      if (!exists && rec.pf_inqid) {
        const docCnt = await getNextCounter('doc');
        const docId = genId('DOC', docCnt);
        await addRecord('doc', {
           docId, inqId: rec.pf_inqid, dc_obid: rec.pf_inqid,
           dc_cname: rec.sellerName || rec.pf_sname || inqRec?.sellerName || '',
           dc_regn: rec.regNo || inqRec?.regNo || '',
           dc_carinfo: (rec.make || inqRec?.make || (rec.pf_veh ? rec.pf_veh.split(' ')[0] : '')) + ' ' + (rec.model || inqRec?.model || (rec.pf_veh ? rec.pf_veh.split(' ').slice(1).join(' ') : '')),
           dc_date: new Date().toISOString().split('T')[0], dc_stat: 'Pending'
        });
      }
      showToast('Sent to Documents!');
      await refresh('pfu'); await refresh('doc'); await refresh('pur_inq');
    } catch (e) { showToast('Failed to send to documents.', 'error'); }
  };

  // Helper: check if record has Closed-Won status
  const isClosedWon = (r) => {
    const stat = (r.pf_stat || '').toLowerCase();
    if (stat === 'closed-won') return true;
    const followUps = r.followUps || [];
    if (followUps.length > 0) return (followUps[followUps.length - 1].stat || '').toLowerCase() === 'closed-won';
    return false;
  };

  return (
    <div className="page on" id="pg_pur_follow">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : 'err'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}
      <div className="ph">
        <div className="ph-left"><h1><div className="ph-icon"><i className="fa fa-phone-volume"></i></div>Purchase Follow-Up</h1><p>Follow-up on purchase inquiries and seller contacts</p></div>
        <div className="ph-actions">
          <input className="srch" placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-or" onClick={() => { setEditRec(null); setIsModalOpen(true); }}><i className="fa fa-plus"></i> Add Follow-Up</button>
        </div>
      </div>
      {isModalOpen && <PfuModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editData={editRec} onSendToCloser={handleSendToCloser} />}
      <AIPriceModal isOpen={!!aiRec} onClose={() => setAiRec(null)} record={aiRec} onSavePrice={handleSaveAI} />
      <MarketPricingModal isOpen={!!marketRec} onClose={() => setMarketRec(null)} record={marketRec} />
      
      <div className="tc">
        <div className="tc-hdr"><div className="tc-title">Purchase Follow-Ups <span style={{ background: 'var(--or1)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{filtered.length}</span></div></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Inquiry</th><th>Date</th><th>Seller / Mobile</th><th>Vehicle Make & Model</th><th>Media</th><th>Status</th><th>Offer ₹</th><th>Difference ₹</th><th>Executive</th><th>Next F/U</th><th>AI Price</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(r => {
                const lastFu = (r.followUps && r.followUps.length > 0) ? r.followUps[r.followUps.length - 1] : r;
                const won = isClosedWon(r);
                return (
                <tr key={r.id} style={won ? { background: 'rgba(16,185,129,0.06)', borderLeft: '3px solid #10b981' } : {}}>
                  <td style={{ fontWeight: 600, color: 'var(--text2)', fontSize: 12 }}>{r.pf_inqid || '—'}</td>
                  <td>{fmtDate(lastFu.date || lastFu.pf_date)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.sellerName || r.pf_sname}</div>
                    <a href={`tel:${r.mobile || r.pf_smob}`} style={{ color: 'var(--info)', textDecoration: 'none', fontSize: 12 }}>{r.mobile || r.pf_smob}</a>
                  </td>
                  <td>{r.make || r.pf_veh} <span style={{ fontSize: 12, color: 'var(--text2)' }}>{r.model || r.pf_model}</span></td>
                  <td>
                    {(() => {
                      const valRec = data.val?.find(v => v.v_inqid === r.pf_inqid);
                      const mediaCount = valRec ? (valRec.v_media_count || (valRec.v_media || []).length) : 0;
                      if (mediaCount > 0) {
                        return (
                          <span className="media-badge media-badge-has" onClick={() => openViewer(valRec)} title={`View ${mediaCount} file${mediaCount > 1 ? 's' : ''}`}>
                            <i className="fa fa-images"></i> {mediaCount}
                          </span>
                        );
                      }
                      return <span className="media-badge media-badge-none"><i className="fa fa-image" style={{ opacity: 0.5 }}></i> 0</span>;
                    })()}
                  </td>
                  <td><span className={`badge ${statusBadge(lastFu.stat || lastFu.status || lastFu.pf_stat)}`}>{lastFu.stat || lastFu.status || lastFu.pf_stat}</span></td>
                  <td style={{ fontWeight: 600 }}>{lastFu.offer ? `₹${Number(lastFu.offer).toLocaleString('en-IN')}` : '—'}</td>
                  <td style={{ fontWeight: 600, color: (Number(lastFu.offer || 0) - Number(lastFu.exp || 0)) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {lastFu.offer && lastFu.exp ? `₹${(Number(lastFu.offer) - Number(lastFu.exp)).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text2)' }}>{lastFu.exec || '—'}</td>
                  <td>{won ? <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 12 }}>Deal Won ✅</span> : (lastFu.nfd || lastFu.nextFU || lastFu.pf_nfd ? fmtDate(lastFu.nfd || lastFu.nextFU || lastFu.pf_nfd) : '—')}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.aiSuggestion || ''}>{r.aiSuggestion || '—'}</td>
                  <td>
                    <div className="act-grp">
                      <button className="btn-icon bi-edit" title="Edit" onClick={() => { setEditRec(r); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                      {won && (
                        <button className="btn-icon" title="Send to Documents" onClick={() => handleVerifyDocs(r)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}><i className="fa fa-file-contract"></i></button>
                      )}
                      <button className="btn-icon" style={{ background: 'rgba(124,58,237,.12)', color: '#7C3AED' }} onClick={() => showAIPrice(r)} title="AI Price Suggestion"><i className="fa fa-robot"></i></button>
                      <button className="btn-icon" style={{ background: 'rgba(59,130,246,.12)', color: '#3B82F6' }} onClick={() => showMarketPrice(r)} title="Market Pricing Data"><i className="fa fa-globe"></i></button>
                      {(r.mobile || r.pf_smob) && <button className="btn-icon" title="WhatsApp" onClick={() => handleWhatsApp(r)} style={{ background: '#25D366', color: '#fff' }}><i className="fa-brands fa-whatsapp"></i></button>}
                      <button className="btn-icon bi-del" title="Delete" onClick={() => handleDelete(r)}><i className="fa fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              )}) : (
                <tr><td colSpan="12" className="empty"><i className="fa fa-phone-volume"></i><br />{search ? 'No results found' : 'No follow-up records yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {viewer && (
        <MediaViewer
          media={viewer.media}
          index={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};

export default PurchaseFollowUp;

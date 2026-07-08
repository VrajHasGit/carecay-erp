import { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { deleteRecord, updateRecord } from '../services/db';
import { fmtDate, ageDays, fmt } from '../utils/helpers';

/* ── Pipeline stage definitions (8 stages) ───────── */
const PIPE = [
  { key: 'inq',  label: 'INQ',  color: '#2563eb', icon: 'fa-tag',              title: 'Sales Inquiry'  },
  { key: 'sfu',  label: 'FU',   color: '#f59e0b', icon: 'fa-comments',         title: 'Follow-Up'      },
  { key: 'sob',  label: 'SOB',  color: '#7c3aed', icon: 'fa-clipboard-list',   title: 'Order Booking'  },
  { key: 'scl',  label: 'SCL',  color: '#22c55e', icon: 'fa-trophy',           title: 'Sales Closer'   },
  { key: 'fin',  label: 'FIN',  color: '#6366f1', icon: 'fa-building-columns', title: 'Finance / Loan' },
  { key: 'sdoc', label: 'DOC',  color: '#f97316', icon: 'fa-file-contract',    title: 'Sale Documents' },
  { key: 'gp',   label: 'GP',   color: '#ec4899', icon: 'fa-door-open',        title: 'Gate Pass'      },
  { key: 'del',  label: 'DEL',  color: '#06b6d4', icon: 'fa-truck',            title: 'Delivery'       },
];

function getLastReached({ sfu, sob, scl, fin, sdoc, gp, del }) {
  if (del)  return { label: 'Delivery',        path: '/delivery'       };
  if (gp)   return { label: 'Gate Pass',       path: '/gate-pass'      };
  if (sdoc) return { label: 'Sale Documents',  path: '/sale-documents' };
  if (fin)  return { label: 'Finance / Loan',  path: '/finance'        };
  if (scl)  return { label: 'Sales Closer',    path: '/sales-closer'   };
  if (sob)  return { label: 'Order Booking',   path: '/sales-booking'  };
  if (sfu)  return { label: 'Sales Follow-Up', path: '/sales-follow'   };
  return          { label: 'Sales Inquiry',    path: '/sales-inquiry'  };
}

/* ── Toast ───────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type === 'success' ? 'suc' : type === 'error' ? 'err' : 'inf'}`}
    style={{ display: 'flex' }}>
    <i className={`fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
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
            <i className="fa fa-rotate-right" style={{ color: '#2563eb', marginRight: 8 }}></i>
            Resume Sales Inquiry
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>
            {inq.salId} — {inq.buyerName} · {inq.makePref || inq.model || ''}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onContinue} style={{
            background: '#2563eb', color: '#fff',
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
                Resets inquiry to 'New' — linked records are kept
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

/* ── Key-value row ───────────────────────────────── */
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
      opacity: active ? 1 : 0.5,
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

/* ── Pipeline progress checklist (8 boxes) ───────── */
function PipelineChecklist({ reached }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      {PIPE.map(s => {
        const done = reached[s.key];
        return (
          <div key={s.key} title={s.title} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${done ? s.color : 'var(--border)'}`,
              background: done ? s.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}>
              {done && <i className="fa fa-check" style={{ color: '#fff', fontSize: 7 }}></i>}
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: done ? s.color : 'var(--text3)' }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Full 8-stage expansion panel ────────────────── */
function ExpansionPanel({ inq, sfu, sob, scl, fin, sdoc, gp, del }) {
  const lastFu = sfu?.followUps?.length > 0 ? sfu.followUps[sfu.followUps.length - 1] : null;

  /* SCL payment tracker */
  const sclPaidTotal = Array.isArray(scl?.payments)
    ? scl.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) : 0;
  const sclAgreed  = parseFloat(scl?.sc_mrp || scl?.sc_price || 0);
  const sclToken   = parseFloat(scl?.sc_tok || 0);
  const sclBalance = sclAgreed - sclToken - sclPaidTotal;

  /* Finance loan calc */
  const finLoan = parseFloat(fin?.fin_sp || 0) - parseFloat(fin?.fin_dp || 0);

  return (
    <div style={{
      background: 'var(--surface)', padding: '16px 20px',
      borderTop: '1px solid var(--border)',
      borderBottom: '3px solid #2563eb',
    }}>
      {/* Row 1: INQ · FU · SOB · SCL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>

        {/* 1 — Sales Inquiry */}
        <StageCard title="Sales Inquiry" icon="fa-tag" color="#2563eb" active={true} navPath="/sales-inquiry">
          <Row label="INQ ID"        val={inq.salId} />
          <Row label="Date"          val={fmtDate(inq.date)} />
          <Row label="Source"        val={inq.source} />
          <Row label="Interested In" val={[inq.makePref, inq.model].filter(Boolean).join(' ')} />
          <Row label="Budget"        val={inq.budget ? fmt(inq.budget) : ''} />
          <Row label="Year Pref."    val={[inq.yearFrom, inq.yearTo].filter(Boolean).join(' – ')} />
          <Row label="Linked Stock"  val={inq.linkedStock} />
          <Row label="Stage"         val={inq.status} />
          <Row label="Next F/U"      val={fmtDate(inq.nextFU)} />
          <Row label="Assigned To"   val={inq.assignedTo || inq.assigned} />
          {inq.remarks && <Row label="Remarks" val={inq.remarks} />}
        </StageCard>

        {/* 2 — Sales Follow-Up */}
        <StageCard title="Sales Follow-Up" icon="fa-comments" color="#f59e0b"
          active={!!sfu} navPath={sfu ? '/sales-follow' : null}>
          {sfu ? <>
            <Row label="SFU ID"      val={sfu.sfuId} />
            <Row label="Buyer"       val={sfu.sf_cname} />
            <Row label="Mobile"      val={sfu.sf_mob} />
            <Row label="Vehicle"     val={[sfu.sf_make, sfu.sf_model, sfu.sf_year].filter(Boolean).join(' ')} />
            <Row label="Reg No."     val={sfu.sf_regn} />
            <Row label="Follow-Ups"  val={sfu.followUps?.length ? `${sfu.followUps.length} entries` : ''} />
            <Row label="Status"      val={sfu.sf_stat} />
            {lastFu && <>
              <Row label="Last Date"   val={fmtDate(lastFu.date)} />
              <Row label="Last Status" val={lastFu.stat} />
              <Row label="Cust. Offer" val={lastFu.exp       ? fmt(lastFu.exp)       : ''} />
              <Row label="Our Offer"   val={lastFu.offer     ? fmt(lastFu.offer)     : ''} />
              <Row label="Deal Price"  val={lastFu.dealPrice ? fmt(lastFu.dealPrice) : ''} />
              <Row label="Executive"   val={lastFu.exec} />
              <Row label="Next F/U"    val={fmtDate(lastFu.nfd)} />
            </>}
          </> : <EmptyStage />}
        </StageCard>

        {/* 3 — Sales Order Booking */}
        <StageCard title="Order Booking" icon="fa-clipboard-list" color="#7c3aed"
          active={!!sob} navPath={sob ? '/sales-booking' : null}>
          {sob ? <>
            <Row label="SOB ID"      val={sob.sobId} />
            <Row label="Date"        val={fmtDate(sob.sob_date || sob.date)} />
            <Row label="Branch"      val={sob.sob_branch} />
            <Row label="Client"      val={sob.sob_cname} />
            <Row label="Contact"     val={sob.sob_cont} />
            <Row label="Vehicle"     val={sob.sob_mm} />
            <Row label="Reg No."     val={sob.sob_regn} />
            <Row label="Year"        val={sob.sob_year} />
            <Row label="Colour"      val={sob.sob_color} />
            <Row label="Fuel"        val={sob.sob_fuel} />
            <Row label="Sale Price"  val={sob.sob_saleprice ? fmt(sob.sob_saleprice) : ''} />
            <Row label="Token"       val={sob.sob_token     ? fmt(sob.sob_token)     : ''} />
            <Row label="Clear Date"  val={fmtDate(sob.sob_clrdate)} />
            <Row label="Executive"   val={sob.sob_exec} />
            {sob.sob_rem && <Row label="Remarks" val={sob.sob_rem} />}
          </> : <EmptyStage />}
        </StageCard>

        {/* 4 — Sales Closer */}
        <StageCard title="Sales Closer" icon="fa-trophy" color="#22c55e"
          active={!!scl} navPath={scl ? '/sales-closer' : null}>
          {scl ? <>
            <Row label="SCL ID"      val={scl.sclId} />
            <Row label="Date"        val={fmtDate(scl.sc_date || scl.date)} />
            <Row label="Buyer"       val={scl.sc_bname} />
            <Row label="Mobile"      val={scl.sc_mob} />
            <Row label="Vehicle"     val={[scl.sc_make, scl.sc_model, scl.sc_year].filter(Boolean).join(' ')} />
            <Row label="Reg No."     val={scl.sc_regn} />
            <Row label="MRP"         val={sclAgreed ? fmt(sclAgreed) : ''} />
            <Row label="Token Paid"  val={sclToken  ? fmt(sclToken)  : ''} />
            {sclPaidTotal > 0 && <Row label="Total Paid" val={fmt(sclPaidTotal)} />}
            {sclAgreed > 0 && <Row label="Balance"
              val={sclBalance > 0 ? fmt(sclBalance) : '✅ Cleared'} />}
            <Row label="Status"      val={scl.sc_stat || scl.status} />
            {Array.isArray(scl.payments) && scl.payments.length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 5, letterSpacing: .5 }}>PAYMENTS</div>
                {scl.payments.map((pmt, idx) => (
                  <div key={idx} style={{
                    background: 'var(--surface)', borderRadius: 5,
                    padding: '5px 7px', marginBottom: 4, border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ fontWeight: 700 }}>
                        #{idx + 1} · {pmt.mode || 'CASH'} · ₹{Number(pmt.amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pmt.status === 'Done' ? '#22c55e' : '#f59e0b' }}>
                        {pmt.status || 'Pending'}
                      </span>
                    </div>
                    {pmt.date && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{fmtDate(pmt.date)}</div>}
                    {pmt.remarks && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{pmt.remarks}</div>}
                  </div>
                ))}
              </div>
            )}
          </> : <EmptyStage />}
        </StageCard>
      </div>

      {/* Row 2: FIN · SDOC · GP · DEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>

        {/* 5 — Finance / Loan */}
        <StageCard title="Finance / Loan" icon="fa-building-columns" color="#6366f1"
          active={!!fin} navPath={fin ? '/finance' : null}>
          {fin ? <>
            <Row label="FIN ID"      val={fin.finId} />
            <Row label="Date"        val={fmtDate(fin.fin_date || fin.date)} />
            <Row label="Customer"    val={fin.fin_cname} />
            <Row label="Mobile"      val={fin.fin_mob} />
            <Row label="Vehicle"     val={fin.fin_veh} />
            <Row label="Reg No."     val={fin.fin_regn} />
            <Row label="Bank / NBFC" val={fin.fin_bank} />
            <Row label="Sale Price"  val={fin.fin_sp ? fmt(fin.fin_sp) : ''} />
            <Row label="Down Pmt."   val={fin.fin_dp  ? fmt(fin.fin_dp)  : ''} />
            <Row label="Loan Amount" val={finLoan > 0  ? fmt(finLoan)     : ''} />
            <Row label="ROI %"       val={fin.fin_roi ? `${fin.fin_roi}%` : ''} />
            <Row label="Tenure"      val={fin.fin_ten  ? `${fin.fin_ten} months` : ''} />
            <Row label="Status"      val={fin.fin_stat} />
            <Row label="Disbursed"   val={fmtDate(fin.fin_disd)} />
            <Row label="File No."    val={fin.fin_fileno} />
            <Row label="Executive"   val={fin.fin_exec} />
            {fin.fin_rem && <Row label="Remarks" val={fin.fin_rem} />}
          </> : <EmptyStage />}
        </StageCard>

        {/* 6 — Sale Documents */}
        <StageCard title="Sale Documents" icon="fa-file-contract" color="#f97316"
          active={!!sdoc} navPath={sdoc ? '/sale-documents' : null}>
          {sdoc ? <>
            <Row label="DOC ID"    val={sdoc.docId} />
            <Row label="Date"      val={fmtDate(sdoc.date)} />
            <Row label="SOB Ref."  val={sdoc.sd_obid} />
            <Row label="Customer"  val={sdoc.sd_cname} />
            <Row label="Reg No."   val={sdoc.sd_regn} />
            <Row label="Invoice"   val={sdoc.sd_inv   ? '✅ Done' : '❌ Pending'} />
            <Row label="RTO"       val={sdoc.sd_rto   ? '✅ Done' : '❌ Pending'} />
            <Row label="Insurance" val={sdoc.sd_ins   ? '✅ Done' : '❌ Pending'} />
            <Row label="Del. Note" val={sdoc.sd_dn    ? '✅ Done' : '❌ Pending'} />
            <Row label="Gate Pass" val={sdoc.sd_gp    ? '✅ Done' : '❌ Pending'} />
            <Row label="Payment"   val={sdoc.sd_pay   ? '✅ Done' : '❌ Pending'} />
            <Row label="Status"    val={sdoc.sd_stat} />
            {sdoc.sd_verby && <Row label="Verified By" val={sdoc.sd_verby} />}
          </> : <EmptyStage />}
        </StageCard>

        {/* 7 — Gate Pass */}
        <StageCard title="Gate Pass" icon="fa-door-open" color="#ec4899"
          active={!!gp} navPath={gp ? '/gate-pass' : null}>
          {gp ? <>
            <Row label="GP ID"       val={gp.gpId} />
            <Row label="Date"        val={fmtDate(gp.gp_date || gp.date)} />
            <Row label="Purpose"     val={gp.gp_purpose} />
            <Row label="Reg No."     val={gp.gp_regn || gp.regNo} />
            <Row label="Vehicle"     val={gp.gp_mm} />
            <Row label="Out"         val={gp.gp_out   ? gp.gp_out.replace('T', ' ').slice(0, 16)   : ''} />
            <Row label="Exp. Return" val={gp.gp_exp_ret ? gp.gp_exp_ret.replace('T', ' ').slice(0, 16) : ''} />
            <Row label="In"          val={gp.gp_in    ? gp.gp_in.replace('T', ' ').slice(0, 16)    : ''} />
            <Row label="KM Out"      val={gp.gp_km_out ? `${Number(gp.gp_km_out).toLocaleString('en-IN')} km` : ''} />
            <Row label="KM In"       val={gp.gp_km_in  ? `${Number(gp.gp_km_in).toLocaleString('en-IN')} km`  : ''} />
            <Row label="Fuel"        val={gp.gp_fuel} />
            <Row label="Driver"      val={gp.gp_dname || gp.driverName} />
            <Row label="Driver Mob." val={gp.gp_dmob} />
            <Row label="Destination" val={gp.gp_dest} />
            <Row label="Auth. By"    val={gp.gp_auth} />
            <Row label="Status"      val={gp.gp_stat || gp.status} />
            {gp.gp_rem && <Row label="Remarks" val={gp.gp_rem} />}
          </> : <EmptyStage />}
        </StageCard>

        {/* 8 — Delivery */}
        <StageCard title="Delivery" icon="fa-truck" color="#06b6d4"
          active={!!del} navPath={del ? '/delivery' : null}>
          {del ? <>
            <Row label="DEL ID"      val={del.delId} />
            <Row label="Date"        val={fmtDate(del.date)} />
            <Row label="SOB Ref."    val={del.dl_obid} />
            <Row label="Customer"    val={del.dl_cname || del.buyerName} />
            <Row label="Mobile"      val={del.dl_mob} />
            <Row label="Vehicle"     val={del.dl_veh || [del.dl_make, del.dl_model, del.dl_year].filter(Boolean).join(' ')} />
            <Row label="Reg No."     val={del.dl_regn || del.regNo} />
            <Row label="Exp. Date"   val={fmtDate(del.dl_exp)} />
            <Row label="Actual Date" val={fmtDate(del.dl_act)} />
            <Row label="Delivered By" val={del.dl_by} />
            <Row label="Status"      val={del.dl_stat || del.status} />
            {del.dl_rem && <Row label="Remarks" val={del.dl_rem} />}
          </> : <EmptyStage />}
        </StageCard>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
const SalesSearch = () => {
  const { data, refresh } = useData();
  const navigate = useNavigate();
  const [search, setSearch]             = useState('');
  const [stageFilter, setStageFilter]   = useState('');
  const [expandedId, setExpandedId]     = useState(null);
  const [resumeTarget, setResumeTarget] = useState(null);
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Build one aggregate object per sales inquiry */
  const aggregated = useMemo(() => (data.sal_inq || []).map(inq => {
    const id    = inq.salId || inq.id;
    const sfu   = (data.sfu      || []).find(r => r.sf_inqid === id);
    const sob   = (data.sob      || []).find(r => r.sob_sinid === id || r.sob_inqid === id);
    const scl   = (data.scl      || []).find(r => r.sc_inqid === id);
    const fin   = (data.fin      || []).find(r => r.fin_inqid === id);
    const sobId = sob?.sobId || sob?.id;
    const sdoc  = sob ? (data.sale_doc || []).find(r => r.sd_obid === sobId) : null;
    const gp    = sob ? (data.gp       || []).find(r => r.gp_refid === sobId) : null;
    const del   = sob ? (data.del      || []).find(r => r.dl_obid  === sobId) : null;
    const stk   = (data.stk      || []).find(s => s.stkId === inq.linkedStock);
    return { inq, sfu, sob, scl, fin, sdoc, gp, del, stk, id };
  }), [data]);

  /* Search + stage filter */
  const filtered = useMemo(() => aggregated.filter(({ inq, sfu, scl, sob, sdoc, del }) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (inq.salId       || '').toLowerCase().includes(q) ||
      (inq.buyerName   || '').toLowerCase().includes(q) ||
      (inq.mobile      || '').includes(q) ||
      (inq.makePref    || '').toLowerCase().includes(q) ||
      (inq.model       || '').toLowerCase().includes(q) ||
      (inq.linkedStock || '').toLowerCase().includes(q) ||
      (sfu?.sf_cname   || '').toLowerCase().includes(q) ||
      (sfu?.sf_regn    || '').toLowerCase().includes(q) ||
      (scl?.sc_bname   || '').toLowerCase().includes(q) ||
      (scl?.sc_regn    || '').toLowerCase().includes(q) ||
      (sob?.sob_regn   || '').toLowerCase().includes(q) ||
      (sob?.sob_cname  || '').toLowerCase().includes(q) ||
      (sdoc?.sd_regn   || '').toLowerCase().includes(q) ||
      (sdoc?.sd_cname  || '').toLowerCase().includes(q) ||
      (del?.dl_regn    || '').toLowerCase().includes(q) ||
      (del?.dl_cname   || '').toLowerCase().includes(q);
    const matchStage = !stageFilter || (inq.status || 'New') === stageFilter;
    return matchSearch && matchStage;
  }), [aggregated, search, stageFilter]);

  /* KPIs */
  const total    = aggregated.length;
  const won      = aggregated.filter(({ inq }) => inq.status === 'Closed-Won').length;
  const lost     = aggregated.filter(({ inq }) => inq.status === 'Closed-Lost').length;
  const active   = total - won - lost;
  const withFin  = aggregated.filter(({ fin  }) => !!fin ).length;
  const withGp   = aggregated.filter(({ gp   }) => !!gp  ).length;
  const withDel  = aggregated.filter(({ del  }) => !!del ).length;

  /* Cascade delete — all 7 linked collections */
  const handleDelete = async (row, e) => {
    e.stopPropagation();
    const { inq, sfu, sob, scl, fin, sdoc, gp, del } = row;
    const linked = [
      sfu  && 'Follow-Up',
      sob  && 'Order Booking',
      scl  && 'Sales Closer',
      fin  && 'Finance',
      sdoc && 'Sale Documents',
      gp   && 'Gate Pass',
      del  && 'Delivery',
    ].filter(Boolean);
    const msg = `Permanently delete ALL data for:\n\n${inq.salId} — ${inq.buyerName}`
      + (linked.length ? `\n\nAlso deletes: ${linked.join(', ')}` : '')
      + '\n\nThis CANNOT be undone.';
    if (!await window.confirm(msg)) return;
    try {
      await Promise.all([
        deleteRecord('sal_inq',  inq.id),
        sfu  && deleteRecord('sfu',      sfu.id),
        sob  && deleteRecord('sob',      sob.id),
        scl  && deleteRecord('scl',      scl.id),
        fin  && deleteRecord('fin',      fin.id),
        sdoc && deleteRecord('sale_doc', sdoc.id),
        gp   && deleteRecord('gp',       gp.id),
        del  && deleteRecord('del',      del.id),
      ].filter(Boolean));
      await Promise.all([
        refresh('sal_inq'), refresh('sfu'), refresh('sob'),
        refresh('scl'), refresh('fin'), refresh('sale_doc'),
        refresh('gp'), refresh('del'),
      ]);
      showToast(`${inq.salId} and all linked records deleted.`, 'info');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  /* Resume modal */
  const handleResumeClick = (row, e) => {
    e.stopPropagation();
    const lastStage = getLastReached(row);
    const idMap = {
      '/delivery':       row.del?.id,
      '/gate-pass':      row.gp?.id,
      '/sale-documents': row.sdoc?.id,
      '/finance':        row.fin?.id,
      '/sales-closer':   row.scl?.id,
      '/sales-booking':  row.sob?.id,
      '/sales-follow':   row.sfu?.id,
      '/sales-inquiry':  row.inq?.id,
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
      `Reset ${inq.salId} back to Inquiry stage?\n\nLinked records are kept but the inquiry status resets to 'New'.`
    )) return;
    try {
      await updateRecord('sal_inq', inq.id, { status: 'New', stage: 'Inquiry' });
      await refresh('sal_inq');
      setResumeTarget(null);
      showToast('Inquiry reset to New.', 'info');
      navigate('/sales-inquiry');
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="page on" id="pg_sal_search">
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
            <div className="ph-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#06b6d4)' }}>
              <i className="fa fa-magnifying-glass"></i>
            </div>
            Sales Pipeline Search
          </h1>
          <p>Track every inquiry across all 8 stages — INQ → FU → SOB → SCL → FIN → SDOC → GP → DEL</p>
        </div>
        <div className="ph-actions">
          <input
            className="srch"
            placeholder="🔍 INQ ID / Buyer / Reg No. / Mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <select className="flt" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            <option value="New">New</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed-Won">Closed-Won</option>
            <option value="Closed-Lost">Closed-Lost</option>
            <option value="Hold">Hold</option>
          </select>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'Total',        val: total,   color: '#2563eb', icon: 'fa-list'           },
          { lbl: 'Active',       val: active,  color: '#f59e0b', icon: 'fa-circle-notch'   },
          { lbl: 'Closed-Won',   val: won,     color: '#22c55e', icon: 'fa-check-circle'   },
          { lbl: 'Closed-Lost',  val: lost,    color: '#ef4444', icon: 'fa-xmark-circle'   },
          { lbl: 'Financed',     val: withFin, color: '#6366f1', icon: 'fa-building-columns'},
          { lbl: 'Gate Pass',    val: withGp,  color: '#ec4899', icon: 'fa-door-open'      },
          { lbl: 'Delivered',    val: withDel, color: '#06b6d4', icon: 'fa-truck'          },
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
            <i className="fa fa-magnifying-glass" style={{ color: '#2563eb' }}></i>
            {' '}All Sales Inquiries
            <span style={{
              background: '#2563eb', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8,
            }}>{filtered.length}</span>
          </div>
          <div className="tc-acts" style={{ fontSize: 11, color: 'var(--text3)' }}>
            Click any row to expand all 8 pipeline stages · Edit buttons navigate directly to each stage
          </div>
        </div>
        <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 24 }}></th>
                <th>INQ ID</th>
                <th>Date</th>
                <th>Buyer Name</th>
                <th>Mobile</th>
                <th>Vehicle / Interest</th>
                <th>Budget</th>
                <th>Pipeline Progress</th>
                <th>Status</th>
                <th>Age</th>
                <th style={{ minWidth: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(({ inq, sfu, sob, scl, fin, sdoc, gp, del, stk, id }) => {
                const isExpanded = expandedId === id;
                const reached = {
                  inq:  true,
                  sfu:  !!sfu,
                  sob:  !!sob,
                  scl:  !!scl,
                  fin:  !!fin,
                  sdoc: !!sdoc,
                  gp:   !!gp,
                  del:  !!del,
                };
                const days = inq.date ? ageDays(inq.date) : null;
                const regNo = scl?.sc_regn || sob?.sob_regn || sfu?.sf_regn || del?.dl_regn || stk?.regNo || '';
                const vehicleLabel = regNo
                  ? <><span style={{ fontWeight: 700, color: '#2563eb', fontFamily: "'Space Grotesk',sans-serif" }}>{regNo}</span>
                      {(scl?.sc_make || sob?.sob_mm || inq.makePref) &&
                        <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 6 }}>
                          {scl ? [scl.sc_make, scl.sc_model].filter(Boolean).join(' ') : sob?.sob_mm || inq.makePref}
                        </span>
                      }
                    </>
                  : <span style={{ color: 'var(--text3)' }}>{[inq.makePref, inq.model].filter(Boolean).join(' ') || '—'}</span>;

                const row = { inq, sfu, sob, scl, fin, sdoc, gp, del, stk, id };

                return (
                  <Fragment key={id}>
                    <tr
                      style={{
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(37,99,235,.04)' : undefined,
                        borderLeft: `3px solid ${isExpanded ? '#2563eb' : 'transparent'}`,
                        transition: 'background .15s',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                    >
                      <td>
                        <i className={`fa fa-chevron-${isExpanded ? 'down' : 'right'}`}
                          style={{ fontSize: 9, color: isExpanded ? '#2563eb' : 'var(--text3)' }} />
                      </td>
                      <td style={{
                        fontWeight: 700, color: '#2563eb',
                        fontFamily: "'Space Grotesk',sans-serif", fontSize: 11,
                      }}>
                        {inq.salId || inq.id?.slice(0, 12)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(inq.date)}</td>
                      <td style={{ fontWeight: 600 }}>{inq.buyerName || '—'}</td>
                      <td>
                        {inq.mobile ? (
                          <a href={`tel:${inq.mobile}`} onClick={e => e.stopPropagation()}
                            style={{ color: 'var(--info)', textDecoration: 'none', fontSize: 12 }}>
                            {inq.mobile}
                          </a>
                        ) : '—'}
                      </td>
                      <td>{vehicleLabel}</td>
                      <td className="amt-or">{inq.budget ? fmt(inq.budget) : '—'}</td>
                      <td><PipelineChecklist reached={reached} /></td>
                      <td>
                        <span className={`badge ${
                          inq.status === 'Closed-Won'  ? 'b-success' :
                          inq.status === 'Closed-Lost' ? 'b-danger'  :
                          inq.status === 'Hold'        ? 'b-warn'    : 'b-info'
                        }`}>{inq.status || 'New'}</span>
                        {del && (
                          <div style={{ marginTop: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#06b6d4', background: '#06b6d412', padding: '1px 6px', borderRadius: 10 }}>
                              <i className="fa fa-truck" style={{ marginRight: 3 }}></i>Delivered
                            </span>
                          </div>
                        )}
                      </td>
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
                              background: 'rgba(37,99,235,.1)', color: '#2563eb',
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
                        <td colSpan="11" style={{ padding: 0 }}>
                          <ExpansionPanel
                            inq={inq} sfu={sfu} sob={sob} scl={scl}
                            fin={fin} sdoc={sdoc} gp={gp} del={del}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              }) : (
                <tr>
                  <td colSpan="11" className="empty">
                    <i className="fa fa-magnifying-glass" style={{ fontSize: 32, marginBottom: 8, display: 'block' }}></i>
                    {search || stageFilter ? 'No inquiries match your search.' : 'No sales inquiries found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tc-foot">
          <span className="pg-info">
            Showing {filtered.length} of {total} inquiries
            {(search || stageFilter) && filtered.length !== total && (
              <span style={{ color: 'var(--text3)', marginLeft: 6 }}>(filtered)</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesSearch;

/**
 * nativeDialogOverride.js
 * Pure vanilla JS override of window.confirm / alert / prompt.
 * Reads live CSS variables so it always matches the active theme.
 * Called from main.jsx before React renders.
 */

function v(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function showDialog({ type, message, defaultValue }) {
  return new Promise((resolve) => {
    const isAlert  = type === 'alert';
    const isPrompt = type === 'prompt';

    /* ── Theme tokens (live from CSS vars) ── */
    const bg      = v('--surface')  || '#15162c';
    const surface2= v('--surface2') || '#1e2040';
    const border  = v('--border')   || '#2d3058';
    const text    = v('--text')     || '#f1f1f5';
    const text2   = v('--text2')    || '#9ca3c0';
    const text3   = v('--text3')    || '#6b7280';
    const or1     = v('--or1')      || '#e85d04';
    const or2     = v('--or2')      || '#f48c06';

    const parts = String(message || '').split('\n');
    const title = parts[0] || '';
    const body  = parts.slice(1).join('\n').trim();

    /* ── Icon SVG per type ── */
    const iconColor = isAlert ? '#EF4444' : or1;
    const iconBg    = isAlert ? 'rgba(239,68,68,.14)' : 'rgba(232,93,4,.13)';
    const iconSvg = isAlert
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
      : isPrompt
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${or1}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${or1}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`;

    const headerLabel = isAlert ? 'Notice' : isPrompt ? 'Input Required' : 'Confirm Action';
    const okLabel     = isAlert ? 'OK'     : isPrompt ? 'Submit'         : 'Confirm';

    /* ── Inject animation keyframes once ── */
    if (!document.getElementById('_cdStyles')) {
      const s = document.createElement('style');
      s.id = '_cdStyles';
      s.textContent = [
        '@keyframes _cdBgIn{from{opacity:0}to{opacity:1}}',
        '@keyframes _cdCardIn{from{opacity:0;transform:scale(.88) translateY(-16px)}to{opacity:1;transform:scale(1) translateY(0)}}',
        '#_cdOverlay *{font-family:"Space Grotesk","Inter",system-ui,sans-serif}',
        '#_cdOverlay button{transition:background .15s,box-shadow .15s,opacity .15s}',
        '#_cdOverlay button:hover{filter:brightness(1.12)}',
        '#_cdOverlay button:active{transform:scale(.97)}',
      ].join('');
      document.head.appendChild(s);
    }

    /* ── Overlay ── */
    const overlay = document.createElement('div');
    overlay.id = '_cdOverlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0',
      `z-index:999996`,
      'background:rgba(0,0,0,.52)',
      'backdrop-filter:blur(7px)',
      '-webkit-backdrop-filter:blur(7px)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'animation:_cdBgIn .18s ease',
      'padding:16px',
    ].join(';');

    /* ── Card ── */
    const card = document.createElement('div');
    card.style.cssText = [
      `background:${bg}`,
      'width:100%', 'max-width:420px',
      'border-radius:20px',
      `border:1px solid ${border}`,
      'box-shadow:0 32px 80px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.04) inset',
      'overflow:hidden',
      'animation:_cdCardIn .22s cubic-bezier(.34,1.45,.64,1)',
    ].join(';');

    /* ── Header bar with gradient accent ── */
    card.innerHTML = `
      <div style="background:linear-gradient(135deg,${or1},${or2});padding:3px 0 0;border-radius:20px 20px 0 0"></div>
      <div style="padding:20px 24px 16px;display:flex;align-items:center;gap:12px">
        <div style="width:38px;height:38px;border-radius:12px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${border}">${iconSvg}</div>
        <div style="flex:1">
          <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${text3};margin-bottom:2px">${type === 'confirm' ? 'Action Required' : type === 'alert' ? 'Notice' : 'Input'}</div>
          <div style="font-size:15px;font-weight:700;color:${text}">${headerLabel}</div>
        </div>
        <button id="_cdX" style="background:${surface2};border:1px solid ${border};color:${text3};width:28px;height:28px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">✕</button>
      </div>

      <div style="padding:0 24px 20px">
        <div style="background:${surface2};border:1px solid ${border};border-radius:12px;padding:14px 16px">
          <div style="font-weight:600;font-size:13px;color:${text};line-height:1.5">${title}</div>
          ${body ? `<div style="margin-top:6px;font-size:12px;color:${text2};line-height:1.6">${body.replace(/\n/g,'<br>')}</div>` : ''}
          ${isPrompt ? `<input id="_cdInp" value="${(defaultValue||'').replace(/"/g,'&quot;')}" style="margin-top:12px;width:100%;padding:10px 13px;background:${bg};border:1.5px solid ${border};border-radius:9px;color:${text};font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s" placeholder="Type here…"/>` : ''}
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;align-items:center">
          ${!isAlert ? `<button id="_cdNo" style="padding:10px 22px;border-radius:11px;background:${surface2};border:1px solid ${border};color:${text2};font-weight:600;font-size:12px;cursor:pointer;letter-spacing:.02em">Cancel</button>` : ''}
          <button id="_cdYes" style="padding:10px 24px;border-radius:11px;background:linear-gradient(135deg,${or1},${or2});border:none;color:#fff;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(232,93,4,.35);letter-spacing:.03em">${okLabel}</button>
        </div>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    /* ── Focus input ── */
    const inp = card.querySelector('#_cdInp');
    if (inp) {
      setTimeout(() => { inp.focus(); inp.select(); }, 60);
      inp.addEventListener('focus', () => {
        inp.style.borderColor = or1;
        inp.style.boxShadow = `0 0 0 3px rgba(232,93,4,.15)`;
      });
      inp.addEventListener('blur', () => {
        inp.style.borderColor = border;
        inp.style.boxShadow = 'none';
      });
    }

    /* ── Resolve & animate out ── */
    function done(result) {
      overlay.style.transition = 'opacity .14s';
      card.style.transition = 'opacity .14s, transform .14s';
      overlay.style.opacity = '0';
      card.style.opacity = '0';
      card.style.transform = 'scale(.96) translateY(-6px)';
      setTimeout(() => { overlay.parentNode?.removeChild(overlay); }, 150);
      resolve(result);
    }

    /* ── Button wiring ── */
    card.querySelector('#_cdYes').addEventListener('click',   () => done(isPrompt ? (inp?.value ?? '') : true));
    card.querySelector('#_cdNo')?.addEventListener('click',   () => done(isPrompt ? null : false));
    card.querySelector('#_cdX').addEventListener('click',     () => done(isPrompt ? null : false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) done(isPrompt ? null : false); });
    if (inp) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(inp.value); });

    /* ── Global keyboard ── */
    function onKey(e) {
      if (e.key === 'Escape') { cleanup(); done(isPrompt ? null : false); }
      if (e.key === 'Enter' && !isPrompt && document.activeElement !== inp) { cleanup(); done(true); }
    }
    function cleanup() { window.removeEventListener('keydown', onKey); }
    window.addEventListener('keydown', onKey);
  });
}

export function installDialogOverride() {
  window.confirm = (msg)          => showDialog({ type: 'confirm', message: msg });
  window.alert   = (msg)          => showDialog({ type: 'alert',   message: msg });
  window.prompt  = (msg, def = '') => showDialog({ type: 'prompt',  message: msg, defaultValue: def });
}
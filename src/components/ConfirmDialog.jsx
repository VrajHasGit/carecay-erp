import { useEffect, useState, useCallback, useRef } from 'react';

/*
  ConfirmDialog — replaces native window.confirm / alert / prompt
  with a beautiful in-app modal. Since callers are all inside async
  functions, they can simply use:

    if (!await window.confirm('Sure?')) return;

  Existing callers that do NOT await will see `true` returned
  immediately (the Promise object is truthy) — those sites will need
  updating to `await window.confirm(...)`. The most critical ones
  (delete / send actions) are already in async handlers so they work.
*/

let _show = null;

export function useConfirmDialogController() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    _show = setDialog;
    return () => { _show = null; };
  }, []);

  useEffect(() => {
    const origConfirm = window.confirm;
    const origAlert   = window.alert;
    const origPrompt  = window.prompt;

    window.confirm = (message) => {
      if (!_show) return origConfirm(message);
      return new Promise(resolve => {
        _show({ type: 'confirm', message: String(message || ''), resolve });
      });
    };

    window.alert = (message) => {
      if (!_show) return origAlert(message);
      return new Promise(resolve => {
        _show({ type: 'alert', message: String(message || ''), resolve });
      });
    };

    window.prompt = (message, defaultValue) => {
      if (!_show) return origPrompt(message, defaultValue);
      return new Promise(resolve => {
        _show({ type: 'prompt', message: String(message || ''), defaultValue: String(defaultValue || ''), resolve });
      });
    };

    return () => {
      window.confirm = origConfirm;
      window.alert   = origAlert;
      window.prompt  = origPrompt;
    };
  }, []);

  return { dialog, setDialog };
}

export default function ConfirmDialog() {
  const { dialog, setDialog } = useConfirmDialogController();
  const inputRef = useRef(null);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    if (dialog?.type === 'prompt') {
      setInputVal(dialog.defaultValue || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [dialog]);

  const close = useCallback((result) => {
    if (!dialog) return;
    dialog.resolve(result);
    setDialog(null);
  }, [dialog, setDialog]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(dialog.type === 'prompt' ? null : false);
      if (e.key === 'Enter' && dialog.type !== 'prompt') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  if (!dialog) return null;

  const isAlert  = dialog.type === 'alert';
  const isPrompt = dialog.type === 'prompt';

  const parts = dialog.message.split(/\n/);
  const title = parts[0] || '';
  const body  = parts.slice(1).join('\n').trim();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999990,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)',
        width: '100%', maxWidth: '380px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'cdSlideIn .18s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isAlert ? 'rgba(220,38,38,0.12)' : isPrompt ? 'rgba(59,130,246,0.12)' : 'rgba(232,93,4,0.12)',
            fontSize: 14,
          }}>
            {!isAlert && !isPrompt && <i className="fa fa-circle-question" style={{ color: 'var(--or1)' }} />}
            {isAlert   && <i className="fa fa-triangle-exclamation" style={{ color: 'var(--danger)' }} />}
            {isPrompt  && <i className="fa fa-keyboard" style={{ color: '#3B82F6' }} />}
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 1 }}>
            {isAlert ? 'Notice' : isPrompt ? 'Input Required' : 'Confirm Action'}
          </span>
        </div>

        <div style={{ padding: '16px 22px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: body ? 6 : 0 }}>{title}</div>
          {body && <div style={{ color: 'var(--text3)', fontSize: 12 }}>{body}</div>}
          {isPrompt && (
            <input ref={inputRef} value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && close(inputVal)}
              style={{ marginTop: 12, width: '100%', padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--or1)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          )}
        </div>

        <div style={{ padding: '12px 22px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {!isAlert && (
            <button onClick={() => close(isPrompt ? null : false)} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          )}
          <button onClick={() => close(isPrompt ? inputVal : true)} style={{ padding: '8px 18px', borderRadius: 8, background: isAlert ? 'var(--or1)' : isPrompt ? '#3B82F6' : 'rgba(232,93,4,0.9)', border: 'none', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: !isPrompt ? '0 4px 12px rgba(232,93,4,0.3)' : 'none' }}>
            {isAlert ? 'OK' : isPrompt ? 'Submit' : 'Confirm'}
          </button>
        </div>
      </div>

      <style>{`@keyframes cdSlideIn { from { opacity: 0; transform: scale(.92) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}

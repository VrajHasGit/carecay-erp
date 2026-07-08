import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [role="combobox"], [role="option"], [tabindex="0"], .btn, .sb-item, .kpi, .stk-card, .task-card, .pg-btn, .picker-card, .qr-card, .chk-item, .date-pill, .stage-tab, .view-toggle button, .tb-btn, .tb-menu';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // mx/my = target mouse pos; dx/dy = dot pos (lerp 0.9); rx/ry = ring pos (lerp 0.14)
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('cc-ready');
    };
    const onLeave = () => document.body.classList.remove('cc-ready');
    const onEnter = () => document.body.classList.add('cc-ready');

    function loop() {
      rx += (mx - rx) * 0.11; ry += (my - ry) * 0.11;  // ring: trailing drift
      // dot snaps to exact cursor — no lerp, always centered in ring
      dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    const onDown = (e) => {
      const r = document.createElement('div');
      r.className = 'cc-ripple';
      r.style.left = e.clientX + 'px';
      r.style.top  = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 700);
    };

    const onOver = (e) => {
      if (e.target.closest(INTERACTIVE)) {
        ring.classList.add('is-hover');
        dot.classList.add('is-hide');
      }
    };
    const onOut = (e) => {
      if (!e.target.closest(INTERACTIVE)) return;
      const to = e.relatedTarget;
      if (to?.closest?.(INTERACTIVE)) return;
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hide');
    };

    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', onEnter);
    window.addEventListener('mousedown',  onDown);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mousedown',  onDown);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      document.body.classList.remove('cc-ready');
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hide');
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cc-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cc-ring" aria-hidden="true" />
    </>
  );
}

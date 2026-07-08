import { useState, useRef, useEffect } from "react";

/**
 * CustomSelect — div-based dropdown that stays inside the web layer
 * so the custom cursor (cursor:none + cc-dot/ring) works on all states.
 */
export default function CustomSelect({
  value, onChange, children,
  className = "", style = {},
  disabled = false, placeholder = "Select…", id,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  /* ── Collect <option> children ── */
  const options = [];
  const collect = (nodes) => {
    if (!nodes) return;
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    arr.forEach(c => {
      if (!c) return;
      if (c.type === "option") {
        options.push({
          value: c.props.value !== undefined ? c.props.value : c.props.children,
          label: c.props.children,
        });
      } else if (c.props?.children) {
        collect(c.props.children);
      }
    });
  };
  collect(children);

  const selected = options.find(o => String(o.value) === String(value ?? ""));
  const label    = selected ? selected.label : <span style={{ color: "var(--text3)" }}>{placeholder}</span>;

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    // use capture so we catch it before child handlers
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);

  /* ── Keyboard navigation ── */
  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); return; }
    if (e.key === "Escape") { setOpen(false); return; }
    const idx = options.findIndex(o => String(o.value) === String(value ?? ""));
    if (e.key === "ArrowDown" && idx < options.length - 1) pick(options[idx + 1]);
    if (e.key === "ArrowUp"   && idx > 0)                  pick(options[idx - 1]);
  };

  const pick = (opt) => {
    setOpen(false);
    onChange?.({ target: { value: opt.value } });
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", display: "block", userSelect: "none", ...style }}
      className={className}
    >
      {/* ── Trigger ── */}
      <div
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onKeyDown}
        onMouseDown={(e) => {
          if (disabled) return;
          e.preventDefault(); // prevent focus-blur cycle
          setOpen(v => !v);
        }}
        style={{
          width: "100%",
          background: "var(--bg)",
          border: `1px solid ${open ? "var(--or1)" : "var(--border)"}`,
          boxShadow: open ? "0 0 0 3px rgba(232,93,4,.1)" : "none",
          borderRadius: "var(--radius-sm, 6px)",
          padding: "8px 30px 8px 11px",
          fontSize: 12,
          color: "var(--text)",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          opacity: disabled ? 0.65 : 1,
          transition: "border-color .2s, box-shadow .2s",
          outline: "none",
          boxSizing: "border-box",
          position: "relative",
          minHeight: 34,
          fontFamily: "inherit",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {/* caret */}
        <span style={{
          position: "absolute", right: 9, top: "50%",
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: "transform .2s",
          color: "var(--text3)",
          fontSize: 9,
          pointerEvents: "none",
          lineHeight: 1,
        }}>▼</span>
      </div>

      {/* ── Dropdown list ── */}
      {open && !disabled && (
        <div
          role="listbox"
          onMouseDown={e => e.stopPropagation()} // prevent outside-click handler
          style={{
            position: "absolute",
            top: "calc(100% + 3px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm, 6px)",
            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
            zIndex: 999997, // just below cc-dot/ring (999998/999999) but above everything else
            maxHeight: 230,
            overflowY: "auto",
            padding: "3px 0",
            overscrollBehavior: "contain",
          }}
        >
          {options.map((opt, i) => {
            const isSel = String(opt.value) === String(value ?? "");
            return (
              <div
                key={i}
                role="option"
                aria-selected={isSel}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(opt);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: isSel ? "var(--or1)" : "var(--text)",
                  background: isSel ? "rgba(232,93,4,.08)" : "transparent",
                  fontWeight: isSel ? 600 : 400,
                  transition: "background .1s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
              >
                {isSel && <span style={{ fontSize: 9, opacity: .7 }}>✓</span>}
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
// Small components used everywhere. Import from here, never redefine inline.

export function Bar({ value, max, color, h }) {
  h = h || 6;
  var pct = Math.min(((value || 0) / (max || 1)) * 100, 100);
  return (
    <div style={{ width:"100%", background:"rgba(255,255,255,0.08)", borderRadius:h, height:h, overflow:"hidden" }}>
      <div style={{ width:pct+"%", background:color, height:"100%", borderRadius:h, transition:"width 0.4s" }} />
    </div>
  );
}

export function Tag({ children, color }) {
  return (
    <span style={{
      background:   color + "22",
      border:       "1px solid " + color + "55",
      color:        color,
      fontSize:     10,
      padding:      "1px 7px",
      borderRadius: 20,
      fontWeight:   700,
      display:      "inline-block",
    }}>
      {children}
    </span>
  );
}

export function Btn({ children, onClick, color, small, outline, disabled, style: s }) {
  color = color || "#7EB8F7";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={Object.assign({
        background:   outline ? "transparent" : color + (small ? "dd" : ""),
        border:       "1.5px solid " + color,
        borderRadius: 8,
        padding:      small ? "4px 10px" : "8px 18px",
        color:        outline ? color : "#0d0f1a",
        fontWeight:   700,
        cursor:       disabled ? "not-allowed" : "pointer",
        fontSize:     small ? 11 : 13,
        opacity:      disabled ? 0.5 : 1,
        transition:   "all 0.15s",
        fontFamily:   "inherit",
      }, s || {})}
    >
      {children}
    </button>
  );
}

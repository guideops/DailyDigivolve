// ─── DigiSprite — pixel art Digimon renderer ──────────────────────────────────
// Pure SVG, no image files required.
// Props:
//   digimonId  — species id string e.g. "agumon"
//   mood       — "happy" | "sad" | "angry" | "stoic" | "sleepy"
//   size       — number (px), default 64
//   animate    — boolean, default true (gentle float animation)

const SPRITE_COLORS = {
  agumon:    { body:"#F7C27E", acc:"#E8A030", cheek:"#FFB3C6" },
  gabumon:   { body:"#8ecfff", acc:"#5ba4cf", cheek:"#b3d9ff" },
  guilmon:   { body:"#E85040", acc:"#C03020", cheek:"#FF8070" },
  palmon:    { body:"#5cb85c", acc:"#3d8b3d", cheek:"#90ee90" },
  coronamon: { body:"#FFA040", acc:"#FF6600", cheek:"#FFD080" },
  default:   { body:"#B8A0E8", acc:"#8060C0", cheek:"#D0B8F8" },
};

function getColors(id) {
  if (!id) return SPRITE_COLORS.default;
  var base = id.replace(/_x$/, "").replace(/_alts$/, "");
  for (var key in SPRITE_COLORS) {
    if (base.startsWith(key)) return SPRITE_COLORS[key];
  }
  return SPRITE_COLORS.default;
}

export default function DigiSprite({ digimonId, mood, size, animate, stageOverride }) {
  mood    = mood    || "happy";
  size    = size    || 64;
  animate = animate !== false;

  // Determine visual complexity from stage
  var stage   = stageOverride || "Rookie";
  var isMega  = stage === "Mega" || stage === "Ultra";
  var isUlt   = stage === "Ultimate";
  var isX     = digimonId && digimonId.endsWith("_x");

  var c          = getColors(digimonId);
  var eyeColor   = mood === "angry" ? "#cc2222" : "#1a1a2e";
  var cheekColor = mood === "sad"   ? "#9090b0" : mood === "angry" ? "#ff5555" : c.cheek;

  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      style={{ imageRendering:"pixelated", filter:"drop-shadow(0 3px 8px "+c.body+"55)", display:"block" }}
    >
      {/* Ground shadow */}
      <ellipse cx="32" cy="62" rx="13" ry="3" fill="rgba(0,0,0,0.15)" />

      {/* Armour overlay for Mega+ */}
      {isMega && <rect x="18" y="26" width="28" height="22" rx="4" fill={c.acc} opacity="0.45" />}

      {/* Body */}
      <rect x="20" y="28" width="24" height="22" rx="5" fill={c.body} />

      {/* Head */}
      <rect x="15" y="11" width="34" height="24" rx="8" fill={c.body} />

      {/* Ears vs horns */}
      {(isMega || isUlt)
        ? <g>
            <rect x="19" y="4"  width="6" height="12" rx="3" fill={c.acc} transform="rotate(-12 22 10)" />
            <rect x="39" y="4"  width="6" height="12" rx="3" fill={c.acc} transform="rotate(12 42 10)" />
          </g>
        : <g>
            <rect x="9"  y="13" width="8" height="10" rx="4" fill={c.body} />
            <rect x="47" y="13" width="8" height="10" rx="4" fill={c.body} />
          </g>
      }

      {/* Eyes */}
      {mood === "sleepy"
        ? <g>
            <rect x="19" y="21" width="8" height="2" rx="1" fill={eyeColor} />
            <rect x="37" y="21" width="8" height="2" rx="1" fill={eyeColor} />
          </g>
        : <g>
            <rect x="19" y="17" width="8" height="9" rx="3" fill={eyeColor} />
            <rect x="37" y="17" width="8" height="9" rx="3" fill={eyeColor} />
            <rect x="20" y="18" width="3" height="3" fill="white" />
            <rect x="38" y="18" width="3" height="3" fill="white" />
            {mood === "angry" && <g>
              <rect x="17" y="15" width="12" height="3" rx="1" fill={eyeColor} transform="rotate(-14 23 16)" />
              <rect x="35" y="15" width="12" height="3" rx="1" fill={eyeColor} transform="rotate(14 41 16)" />
            </g>}
          </g>
      }

      {/* Cheeks */}
      <rect x="15" y="27" width="7" height="4" rx="2" fill={cheekColor} opacity="0.5" />
      <rect x="42" y="27" width="7" height="4" rx="2" fill={cheekColor} opacity="0.5" />

      {/* Mouth */}
      {mood === "happy"  && <path d="M25 31 Q32 38 39 31" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === "sad"    && <path d="M25 35 Q32 28 39 35" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === "angry"  && <path d="M25 35 Q32 29 39 35" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {(mood === "stoic" || mood === "sleepy") && <rect x="25" y="32" width="14" height="2.5" rx="1.25" fill={eyeColor} />}

      {/* Arms */}
      <rect x="7"  y="30" width="14" height="7" rx="3" fill={c.body} />
      <rect x="43" y="30" width="14" height="7" rx="3" fill={c.body} />
      {isMega && <g>
        <rect x="6"  y="36" width="6" height="3" rx="1" fill={c.acc} />
        <rect x="52" y="36" width="6" height="3" rx="1" fill={c.acc} />
      </g>}

      {/* Legs */}
      <rect x="21" y="48" width="9"  height="11" rx="3" fill={c.body} />
      <rect x="34" y="48" width="9"  height="11" rx="3" fill={c.body} />

      {/* Tail */}
      <path d="M33 51 Q46 60 50 55" stroke={c.body} strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* X badge */}
      {isX && <g>
        <circle cx="50" cy="14" r="6" fill={c.acc} opacity="0.9" />
        <text x="50" y="18" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">X</text>
      </g>}

      {/* Float animation */}
      {animate && (
        <animateTransform
          attributeName="transform" type="translate"
          values="0,0;0,-3;0,0" dur="2s"
          repeatCount="indefinite" additive="sum"
        />
      )}
    </svg>
  );
}

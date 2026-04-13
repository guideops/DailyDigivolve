// ─── DigiEgg — animated digitama sprite ───────────────────────────────────────
// Each digitama PNG is a 48×16 horizontal strip with 3 frames (16×16 each):
//   Frame 0 — egg idle 1
//   Frame 1 — egg idle 2  (idle cycles between 0 and 1)
//   Frame 2 — hatch frame (plays once on confirmation)
//
// Props:
//   eggFile    — normalized filename without .png, e.g. "botamon_agumon_greymon"
//   label      — display name shown below the egg
//   desc       — flavour text shown below the label
//   selected   — boolean — shows gold selection ring
//   onClick    — click handler (for egg selection)
//   phase      — "idle" | "hatching" | "hatched"
//   size       — display px for one frame (default 96 = 6× pixel scale)
//   onHatched  — callback fired after the hatch frame finishes playing

import { useState, useEffect, useRef } from "react";

export default function DigiEgg({
  eggFile, label, desc, selected, onClick, phase = "idle", size = 96, onHatched,
}) {
  var [frame, setFrame]   = useState(0);
  var [shaking, setShake] = useState(false);
  var timer = useRef(null);
  var hatchTimer = useRef(null);

  useEffect(function() {
    clearInterval(timer.current);
    clearTimeout(hatchTimer.current);

    if (phase === "hatching") {
      // Brief shake before the hatch frame
      setShake(true);
      hatchTimer.current = setTimeout(function() {
        setShake(false);
        setFrame(2);
        // Give the hatch frame ~900ms of screen time then call back
        hatchTimer.current = setTimeout(function() {
          if (onHatched) onHatched();
        }, 900);
      }, 400);
      return;
    }

    if (phase === "hatched") {
      setFrame(2);
      return;
    }

    // Idle: alternate between frames 0 and 1 at 2 fps
    setFrame(0);
    timer.current = setInterval(function() {
      setFrame(function(f) { return f === 0 ? 1 : 0; });
    }, 500);
    return function() {
      clearInterval(timer.current);
      clearTimeout(hatchTimer.current);
    };
  }, [phase]);

  // The PNG is 48×16 (3 frames). Scale to `size` px per frame.
  var bgX = -frame * size;

  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "20px 18px 16px",
        border: selected ? "2px solid #FFD700" : "2px solid #2a2d3a",
        boxShadow: selected ? "0 0 18px rgba(255,215,0,0.35), 4px 4px 0 #FFD700"
                            : "3px 3px 0 #2a2d3a",
        background: selected ? "rgba(255,215,0,0.06)" : "#161a22",
        transition: "border 0.15s, box-shadow 0.15s, background 0.15s",
        userSelect: "none",
        minWidth: size + 48,
        animation: shaking ? "eggShake 0.4s ease" : undefined,
      }}
    >
      {/* Egg sprite */}
      <div
        style={{
          width: size,
          height: size,
          backgroundImage: `url('/sprites/digitama/${eggFile}.png')`,
          backgroundSize: `${3 * size}px ${size}px`,
          backgroundPosition: `${bgX}px 0px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          filter: phase === "hatching" && frame === 2 ? "brightness(2) drop-shadow(0 0 12px #FFD700)" : undefined,
          transition: frame === 2 ? "filter 0.2s" : undefined,
        }}
      />
      {label && (
        <div style={{
          color: "#e8eaf0", fontWeight: 900, fontSize: 11,
          letterSpacing: 1, textAlign: "center", textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
      {desc && (
        <div style={{
          color: "#8a90a8", fontSize: 10, textAlign: "center",
          maxWidth: 160, lineHeight: 1.55,
        }}>
          {desc}
        </div>
      )}
    </div>
  );
}

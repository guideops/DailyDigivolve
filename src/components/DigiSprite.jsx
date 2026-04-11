// ─── DigiSprite — animated PNG sprite with SVG fallback ───────────────────────
// Props:
//   digimonId  — species id, e.g. "agumon"
//   mood       — controls which animation frames play (PNG) and eye shape (SVG fallback)
//                "happy" | "sleepy" | "eat" | "angry" | "sad" | "hurt" | "attack"
//                default (idle/walk) plays Walk 1–2 frames
//   size       — number (px), default 64
//   animate    — boolean, default true
//
// Standard 3×4 grid frame layout (48×64px sheet, 16×16 per frame):
//   Row 0: [0] Walk 1   [1] Walk 2   [2] Eat 1
//   Row 1: [3] Eat 2    [4] Sleep 1  [5] Sleep 2
//   Row 2: [6] Refuse   [7] Happy    [8] Angry
//   Row 3: [9] Hurt 1  [10] Hurt 2  [11] Attack
//
// Taomon exception: sheet mode, 8 frames walk-only — always plays frames 0–1.

import { useState, useEffect, useRef } from "react";
import { getSpriteConfig } from "../data/sprites.js";
import { DIGIMON_MAP } from "../data/digimon.js";

// Frame ranges for the standard 3×4 grid
var ANIM_FRAMES = {
  walk:   [0, 1],
  eat:    [2, 3],
  sleep:  [4, 5],
  refuse: [6],
  happy:  [7],
  angry:  [8],
  hurt:   [9, 10],
  attack: [11],
};

function moodToAnim(mood) {
  switch (mood) {
    case "happy":  return "happy";
    case "sleepy": return "sleep";
    case "eat":    return "eat";
    case "angry":  return "angry";
    case "sad":
    case "stoic":  return "refuse";
    case "hurt":   return "hurt";
    case "attack": return "attack";
    default:       return "walk";
  }
}

// ── PNG sprite component ───────────────────────────────────────────────────────
function PngFrames({ id, config, size, animate, mood }) {
  // For grid mode, pick the correct frame subset based on mood
  // Taomon (sheet mode) always walks — ignore mood
  var frames = (config.mode === "grid") ? (ANIM_FRAMES[moodToAnim(mood)] || ANIM_FRAMES.walk) : null;
  var [frameIdx, setFrameIdx] = useState(0);
  const timer = useRef(null);

  useEffect(function() {
    setFrameIdx(0);
    var len = frames ? frames.length : (config.frameCount || 1);
    if (!animate || len <= 1) return;
    clearInterval(timer.current);
    timer.current = setInterval(function() {
      setFrameIdx(function(i) { return (i + 1) % len; });
    }, Math.round(1000 / (config.fps || 6)));
    return function() { clearInterval(timer.current); };
  }, [id, animate, config.frameCount, config.fps, mood]);

  var spritePath = config.spriteId || id;

  if (config.mode === "grid") {
    var cols   = config.cols   || 3;
    var frameW = config.frameW || 16;
    var frameH = config.frameH || 16;
    var scale  = size / frameW;
    var absFrame = frames[frameIdx % frames.length];
    var col  = absFrame % cols;
    var row  = Math.floor(absFrame / cols);
    return (
      <div style={{
        width:              size,
        height:             size,
        backgroundImage:    "url(/sprites/" + spritePath + ".png)",
        backgroundRepeat:   "no-repeat",
        backgroundSize:     (config.cols * frameW * scale) + "px " + (config.rows * frameH * scale) + "px",
        backgroundPosition: (-col * frameW * scale) + "px " + (-row * frameH * scale) + "px",
        imageRendering:     "pixelated",
        flexShrink:         0,
      }} />
    );
  }

  if (config.mode === "sheet") {
    // Taomon and other sheet-only sprites: horizontal strip, walk frames 0–1
    var walkFrame = frameIdx % Math.min(2, config.frameCount);
    var pct = config.frameCount > 1 ? (walkFrame / (config.frameCount - 1)) * 100 : 0;
    return (
      <div style={{
        width:    size,
        height:   size,
        backgroundImage:    "url(/sprites/" + spritePath + ".png)",
        backgroundRepeat:   "no-repeat",
        backgroundSize:     (config.frameCount * 100) + "% 100%",
        backgroundPosition: pct + "% 0",
        imageRendering:     "pixelated",
        flexShrink:         0,
      }} />
    );
  }

  // "frames" mode — individual PNGs
  return (
    <img
      src={"/sprites/" + spritePath + "/" + frameIdx + ".png"}
      width={size}
      height={size}
      draggable={false}
      style={{ imageRendering:"pixelated", display:"block", objectFit:"contain", flexShrink:0 }}
      alt={id}
    />
  );
}

// ── SVG fallback — pixel art placeholder (keeps working before PNGs arrive) ───
var FALLBACK_COLORS = {
  // Agumon/Fire lines
  agumon:"#F7C27E",      greymon:"#E8A030",    metalgreymon:"#C0C0C0",  wargreymon:"#C03020",
  // Patamon/Holy
  patamon:"#FFA0A0",     angemon:"#FFE066",     magnaangemon:"#B8D8FF",  seraphimon:"#E0D0FF",
  // Salamon/Holy Maiden
  salamon:"#FFE0C0",     gatomon:"#E0E0E0",     angewomon:"#FFD0E8",     magnadramon:"#FF80C0", ophanimon:"#80C0FF",
  // Gabumon/Wolf
  gabumon:"#8ECFFF",     garurumon:"#7EB8F7",   weregarurumon:"#5090D0", metalgarurumon:"#90B0D0",
  // Tentomon/Insect
  tentomon:"#FF8040",    kabuterimon:"#E07000",  megakabuterimon:"#C05000", herculeskabuterimon:"#A04000",
  // Palmon/Plant
  palmon:"#5CB85C",      togemon:"#3D8B3D",      lillymon:"#90D080",      rosemon:"#FF6688",
  // Veemon/Dragon Man
  veemon:"#4080FF",      exveemon:"#2060E0",     aeroveedramon:"#1040C0", ulforceveedramon:"#C0E0FF",
  // Guilmon/Dragon
  guilmon:"#E85040",     growlmon:"#C03020",     megagargomon:"#608040",  gallantmon:"#C0A000",
  // Lopmon/Earth
  lopmon_it:"#D09060",   lopmon:"#B07040",       antylamon:"#906030",     saviorhuckmon:"#FF6030",
  // Renamon/Fox
  renamon:"#FFD080",     kyubimon:"#FFA040",     taomon:"#FF8020",        sakuyamon:"#FF6088",
  // Babies/In-Training
  default:"#B8A0E8",
};

function getFallbackColor(id) {
  if (!id) return FALLBACK_COLORS.default;
  return FALLBACK_COLORS[id] || FALLBACK_COLORS.default;
}

function SvgFallback({ digimonId, mood, size, animate }) {
  var info  = DIGIMON_MAP[digimonId];
  var stage = info ? info.stage : "Rookie";
  var body  = getFallbackColor(digimonId);
  var acc   = body; // slightly different accent
  var isMega = stage === "Mega" || stage === "Ultra";
  var isUlt  = stage === "Ultimate";
  var isBaby = stage === "Baby" || stage === "In-Training";
  var eyeColor   = mood === "angry" ? "#cc2222" : "#1a1a2e";
  var cheekColor = mood === "sad"   ? "#9090b0" : mood === "angry" ? "#ff5555" : body + "cc";

  // Babies are just a small round blob
  if (isBaby) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64"
        style={{ imageRendering:"pixelated", display:"block" }}>
        <ellipse cx="32" cy="62" rx="10" ry="2" fill="rgba(0,0,0,0.15)" />
        <circle cx="32" cy="34" r="20" fill={body} />
        {mood !== "sleepy"
          ? <g>
              <circle cx="24" cy="31" r="4" fill={eyeColor} />
              <circle cx="40" cy="31" r="4" fill={eyeColor} />
              <circle cx="23" cy="30" r="1.5" fill="white" />
              <circle cx="39" cy="30" r="1.5" fill="white" />
            </g>
          : <g>
              <rect x="20" y="30" width="8" height="2" rx="1" fill={eyeColor} />
              <rect x="36" y="30" width="8" height="2" rx="1" fill={eyeColor} />
            </g>
        }
        {mood === "happy" && <path d="M26 37 Q32 43 38 37" stroke={eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" />}
        {mood === "sad"   && <path d="M26 40 Q32 34 38 40" stroke={eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" />}
        {(mood === "stoic" || mood === "angry") && <rect x="26" y="38" width="12" height="2" rx="1" fill={eyeColor} />}
        {animate && (
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-4;0,0" dur="2.2s" repeatCount="indefinite" additive="sum" />
        )}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64"
      style={{ imageRendering:"pixelated", filter:"drop-shadow(0 3px 8px " + body + "55)", display:"block" }}>
      <ellipse cx="32" cy="62" rx="13" ry="3" fill="rgba(0,0,0,0.15)" />
      {isMega && <rect x="18" y="26" width="28" height="22" rx="4" fill={acc} opacity="0.45" />}
      <rect x="20" y="28" width="24" height="22" rx="5" fill={body} />
      <rect x="15" y="11" width="34" height="24" rx="8" fill={body} />
      {(isMega || isUlt)
        ? <g>
            <rect x="19" y="4" width="6" height="12" rx="3" fill={acc} transform="rotate(-12 22 10)" />
            <rect x="39" y="4" width="6" height="12" rx="3" fill={acc} transform="rotate(12 42 10)" />
          </g>
        : <g>
            <rect x="9"  y="13" width="8" height="10" rx="4" fill={body} />
            <rect x="47" y="13" width="8" height="10" rx="4" fill={body} />
          </g>
      }
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
      <rect x="15" y="27" width="7" height="4" rx="2" fill={cheekColor} opacity="0.5" />
      <rect x="42" y="27" width="7" height="4" rx="2" fill={cheekColor} opacity="0.5" />
      {mood === "happy"  && <path d="M25 31 Q32 38 39 31" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === "sad"    && <path d="M25 35 Q32 28 39 35" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === "angry"  && <path d="M25 35 Q32 29 39 35" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {(mood === "stoic" || mood === "sleepy") && <rect x="25" y="32" width="14" height="2.5" rx="1.25" fill={eyeColor} />}
      <rect x="7"  y="30" width="14" height="7" rx="3" fill={body} />
      <rect x="43" y="30" width="14" height="7" rx="3" fill={body} />
      <rect x="21" y="48" width="9"  height="11" rx="3" fill={body} />
      <rect x="34" y="48" width="9"  height="11" rx="3" fill={body} />
      <path d="M33 51 Q46 60 50 55" stroke={body} strokeWidth="4" fill="none" strokeLinecap="round" />
      {animate && (
        <animateTransform attributeName="transform" type="translate"
          values="0,0;0,-3;0,0" dur="2s" repeatCount="indefinite" additive="sum" />
      )}
    </svg>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function DigiSprite({ digimonId, mood, size, animate }) {
  mood    = mood    || "happy";
  size    = size    || 64;
  animate = animate !== false;

  var config = getSpriteConfig(digimonId);

  // State: null = still probing, true = PNG confirmed, false = use SVG
  var [pngReady, setPngReady] = useState(null);

  useEffect(function() {
    if (!config) { setPngReady(false); return; }
    setPngReady(null);
    var spritePath = config.spriteId || digimonId;
    // grid and sheet modes: single PNG file; frames mode: numbered files
    var src = (config.mode === "sheet" || config.mode === "grid")
      ? "/sprites/" + spritePath + ".png"
      : "/sprites/" + spritePath + "/0.png";
    var img = new window.Image();
    img.onload  = function() { setPngReady(true); };
    img.onerror = function() { setPngReady(false); };
    img.src = src;
  }, [digimonId]);

  // While probing, show SVG immediately so there's no blank flash
  if (pngReady !== true || !config) {
    return <SvgFallback digimonId={digimonId} mood={mood} size={size} animate={animate} />;
  }

  return (
    <PngFrames
      id={digimonId}
      config={config}
      size={size}
      animate={animate}
      mood={mood}
    />
  );
}

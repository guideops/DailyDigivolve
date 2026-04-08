// ─── Sprite configuration ──────────────────────────────────────────────────────
//
// HOW TO ADD YOUR SPRITES
// ────────────────────────
// 1. Put your PNG frames inside:  public/sprites/{digimon-id}/
//    Name them:  0.png  1.png  2.png  3.png  … (zero-indexed)
//
// 2. Update the entry below:
//    frameCount — how many frames you have
//    fps        — animation speed (frames per second). 4–6 for slow idle, 8–12 for action
//
// SPRITE SHEET MODE (single image, frames side-by-side)
// ────────────────────────────────────────────────────────
// Put the sheet at:  public/sprites/{digimon-id}.png
// Change the entry to:  { mode:"sheet", frameCount:4, frameW:64, frameH:64, fps:6 }
// frameW = width in pixels of ONE frame in the sheet.
// frameH = height of the sheet (same as one frame for a horizontal strip).
//
// SHARED SPRITES (lopmon_it uses the same images as lopmon)
// ────────────────────────────────────────────────────────
// Add  spriteId:"other-id"  to point to a different folder.
//
// FALLBACK
// ────────────
// Any Digimon NOT listed here (or whose PNG fails to load) automatically
// falls back to the SVG placeholder — so you can add sprites gradually.

export const SPRITE_CONFIG = {

  // ── Shared Baby & In-Training ─────────────────────────────────────────────
  botamon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  // 48×64 sprite sheet → 3 cols × 4 rows of 16×16 frames
  koromon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  punimon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  tokomon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  poyomon:             { mode:"frames", frameCount:2, fps:4 },
  nyaromon:            { mode:"frames", frameCount:2, fps:4 },
  pabumon:             { mode:"frames", frameCount:2, fps:4 },
  bukamon:             { mode:"frames", frameCount:2, fps:4 },
  kuramon:             { mode:"frames", frameCount:2, fps:4 },
  tsunomon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  viximon:             { mode:"frames", frameCount:2, fps:4 },
  vmon:                { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  jyarimon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  gigimon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  pagumon:             { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  lopmon_it:           { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6, spriteId:"lopmon" },
  chibimon:            { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  tanemon:             { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  sunmon:              { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  // nyokimon has no PNG yet — will use SVG fallback

  // ── Line 11 — Terriermon / Brave Heart ────────────────────────────────────
  // zerimon, gummymon have no PNG yet — SVG fallback
  terriermon:          { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  gargomon:            { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  rapidmon:            { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  megagargomon:        { mode:"grid",   cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 1 — Agumon / Fire Dragon ─────────────────────────────────────────
  agumon:              { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  greymon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  metalgreymon:        { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  wargreymon:          { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:8 },

  // ── Line 2 — Patamon / Holy Wind ──────────────────────────────────────────
  patamon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  angemon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  magnaangemon:        { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  seraphimon:          { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 3 — Salamon / Holy Maiden ────────────────────────────────────────
  salamon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  tailmon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  angewomon:           { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  magnadramon:         { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  ophanimon:           { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 4 — Gabumon / Ice Wolf ───────────────────────────────────────────
  gabumon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  garurumon:           { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  weregarurumon:       { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  metalgarurumon:      { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 5 — Tentomon / Thunder Insect ────────────────────────────────────
  tentomon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  kabuterimon:         { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  megakabuterimon:     { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  herculeskabuterimon: { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 6 — Palmon / Plant ───────────────────────────────────────────────
  palmon:              { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  togemon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  lillymon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  rosemon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 7 — Veemon / Dragon Man ──────────────────────────────────────────
  veemon:              { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  exveemon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  aeroveedramon:       { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  ulforceveedramon:    { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 8 — Guilmon / Dragon Virus ───────────────────────────────────────
  guilmon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  growlmon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  wargrowlmon:         { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  gallantmon:          { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 9 — Lopmon / Earth Guardian ──────────────────────────────────────
  lopmon:              { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  antylamon:           { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  cherubimon:          { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Line 10 — Renamon / Fox Mystic ────────────────────────────────────────
  renamon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  kyubimon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  taomon:              { mode:"sheet", frameCount:8, frameW:16, frameH:16, fps:6 },
  sakuyamon:           { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },

  // ── Legacy / Fusion ───────────────────────────────────────────────────────
  omnimon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  coronamon:           { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  firamon:             { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
  flaremon:            { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 },
};

// Returns config or null (component falls back to SVG when null)
export function getSpriteConfig(id) {
  return SPRITE_CONFIG[id] || null;
}

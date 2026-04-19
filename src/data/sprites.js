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

const G  = { mode:"grid", cols:3, rows:4, frameCount:12, frameW:16, frameH:16, fps:6 };
const S1 = { mode:"sheet", frameCount:1, frameW:16, frameH:16, fps:1 };

export const SPRITE_CONFIG = {

  // ── Baby stages ───────────────────────────────────────────────────────────
  botamon:             { ...G },
  chicomon:            { ...G },
  choromon:            { ...G },
  cocomon:             { ...G },
  curimon:             { ...G },
  dodomon:             { ...G },
  dokimon:             { ...G },
  jyarimon:            { ...G },
  ketomon:             { ...G },
  leafmon:             { ...G },
  mokumon:             { ...G },
  nyokimon:            { ...G },
  pabumon:             { ...G },
  paomon:              { ...G },
  pichimon:            { ...G },
  punimon:             { ...G },
  pusumon:             { ...G },
  relemon:             { ...G },
  yukimibotamon:       { ...G },
  zerimon:             { ...G },
  zulumon:             { ...G },
  // no sprites: poyomon (SVG fallback)

  // ── In-Training stages ────────────────────────────────────────────────────
  koromon:             { ...G },
  chibimon:            { ...G },
  caprimon:            { ...G },
  chocomon:            { ...G },
  gurimon:             { ...G },
  dorimon:             { ...G },
  bibimon:             { ...G },
  hopmon:              { ...S1 },
  minomon:             { ...G },
  petitmeramon:        { ...G },
  motimon:             { ...G },
  xiamon:              { ...G },
  bukamon:             { ...G },
  pusurimon:           { ...G },
  viximon:             { ...G },
  nyaromon:            { ...G },
  moonmon:             { ...G },
  gummymon:            { ...G },
  pagumon:             { ...G },
  wanyamon:            { ...G },
  tokomon:             { ...G },
  tsunomon:            { ...G },
  sunmon:              { ...G },
  tanemon:             { ...G },
  gigimon:             { ...G },
  // lopmon_it shares lopmon sprite
  lopmon_it:           { ...G, spriteId:"lopmon" },
  // no sprites: kuramon (SVG fallback)

  // ── Agumon line — Fire Dragon ─────────────────────────────────────────────
  agumon:              { ...G },
  greymon:             { ...G },
  metalgreymon:        { ...G },
  wargreymon:          { ...G, fps:8 },
  geomon:              { ...G },                  // alt champion
  tyranomon:           { ...G },                  // alt champion (SVG if no file)
  geogramon:           { ...G },
  rizegreymon:         { ...G },
  shinegreymon:        { ...S1 },
  victorygreymon:      { ...S1 },

  // ── Black Agumon line ─────────────────────────────────────────────────────
  black_agumon:        { ...G },
  greymon_blue:        { ...G },
  metalgreymon_virus:  { ...G },
  skullgreymon:        { ...G },
  blackwargreymon:     { ...G, fps:8 },
  blitzgreymon:        { ...G, fps:8 },

  // ── Omnimon fusions ───────────────────────────────────────────────────────
  omnimon:             { ...G, fps:8 },
  omnimon_alts:        { ...G, fps:8 },

  // ── Gabumon line — Ice Wolf ───────────────────────────────────────────────
  gabumon:             { ...G },
  garurumon:           { ...G },
  weregarurumon:       { ...G },
  metalgarurumon:      { ...G, fps:8 },
  cresgaru:            { ...G },                   // CresGarurumon — DNA fusion Mega
  zeedgarurumon:       { ...S1 },                  // Ultra — 16×16 single frame

  // ── Patamon line — Holy Wind ──────────────────────────────────────────────
  patamon:             { ...G },
  angemon:             { ...G },
  magnaangemon:        { ...G },
  seraphimon:          { ...G, fps:8 },

  // ── Salamon line — Holy Maiden ────────────────────────────────────────────
  salamon:             { ...G },
  tailmon:             { ...G },
  angewomon:           { ...G },
  magnadramon:         { ...G, fps:8 },
  ophanimon:           { ...G, fps:8 },

  // ── Tentomon line — Thunder Insect ────────────────────────────────────────
  tentomon:            { ...G },
  kabuterimon:         { ...G },
  megakabuterimon:     { ...G },
  herculeskabuterimon: { ...G, fps:8 },

  // ── Palmon line — Plant ───────────────────────────────────────────────────
  palmon:              { ...G },
  togemon:             { ...G },
  lillymon:            { ...G },
  rosemon:             { ...G, fps:8 },

  // ── Piyomon line — Flame Bird ─────────────────────────────────────────────
  pyokomon:            { ...G },
  piyomon:             { ...G },
  birdramon:           { ...G },
  garudamon:           { ...G },
  phoenixmon:          { ...G, fps:8 },

  // ── Veemon line — Dragon Man ──────────────────────────────────────────────
  veemon:              { ...G },
  exveemon:            { ...G },
  veedramon:           { ...G },
  aeroveedramon:       { ...G },
  ulforceveedramon:    { ...G, fps:8 },
  paildramon:          { ...G },                  // DNA fusion display
  imperialdramon_fm:   { ...G, fps:8 },
  imperialdramon_pm:   { ...G, fps:8 },           // Ultra

  // ── Guilmon line — Dragon Virus ───────────────────────────────────────────
  guilmon:             { ...G },
  growlmon:            { ...G },
  wargrowlmon:         { ...G },
  gallantmon:          { ...G, fps:8 },
  black_guilmon:       { ...G },
  black_growlmon:      { ...G },
  black_wargrowlmon:   { ...G },
  megidramon:          { ...G, fps:8 },

  // ── Wormmon line — Insect Knight ──────────────────────────────────────────
  // leafmon / minomon: already listed above in In-Training
  wormmon:             { ...G },
  stingmon:            { ...S1 },
  jewelbeemon:         { ...S1 },
  banchostingmon:      { ...S1 },

  // ── Terriermon line — Brave Heart ─────────────────────────────────────────
  terriermon:          { ...G },
  gargomon:            { ...G },
  rapidmon:            { ...G },
  megagargomon:        { ...G },
  rapidmon_armor:      { ...G },

  // ── Lopmon line — Earth Guardian ──────────────────────────────────────────
  lopmon:              { ...G },
  turuiemon:           { ...G },
  andiramon:           { ...G },
  andiramon_virus:     { ...G },
  cherubimon:          { ...G, fps:8 },
  cherubimon_vice:     { ...G, fps:8 },

  // ── Renamon line — Fox Mystic ─────────────────────────────────────────────
  renamon:             { ...G },
  kyubimon:            { ...G },
  taomon:              { mode:"sheet", frameCount:8, frameW:16, frameH:16, fps:6 },
  sakuyamon:           { ...G, fps:8 },

  // ── Gomamon line — Sea ────────────────────────────────────────────────────
  // pichimon / bukamon: already listed above in Baby/In-Training
  gomamon:             { ...G },
  ikkakumon:           { ...G },
  zudomon:             { ...G },
  vikemon:             { ...G, fps:8 },
  plesiomon:           { ...G },
  aegisdramon:         { ...G, fps:8 },           // Ultra
  mojyamon:            { ...G },
  pixiemon:            { ...G },
  shakomon:            { ...G },
  shellmon:            { ...G },
  whamon:              { ...G },
  marinangemon:        { ...G },
  jijimon:             { mode:"frames", frameCount:12, fps:6 },

  // ── Betamon line — Sea Dragon ─────────────────────────────────────────────
  betamon:             { mode:"frames", frameCount:12, fps:6 },
  seadramon:           { ...G },
  airdramon:           { ...G },
  megaseadramon:       { ...G },
  megadramon:          { ...G },
  metalseadramon:      { ...G, fps:8 },
  machinedramon:       { ...G, fps:8 },
  gigaseadramon:       { ...G, fps:8 },           // Ultra

  // ── Kokuwamon line — Machine ──────────────────────────────────────────────
  // choromon / caprimon: already listed above
  kokuwamon:           { ...G },
  guardromon:          { ...G },
  andromon:            { ...G },
  hiandromon:          { ...G, fps:8 },
  kuwagamon:           { ...G },
  okuwamon:            { ...G },
  grandiskuwagamon:    { ...G, fps:8 },

  // ── Commandramon line — Military ─────────────────────────────────────────
  // choromon / caprimon: shared
  commandramon:        { ...G },
  hi_commandramon:     { ...G },
  tankermon:           { ...G },
  cargodramon:         { ...G },
  deckerdramon:        { ...G },
  brigadramon:         { ...G },
  darkdramon:          { ...G },

  // ── Dorumon line — Metal Grail ────────────────────────────────────────────
  // dodomon / dorimon: already listed above
  dorumon:             { ...G },
  dorugamon:           { ...G },
  doruguremon:         { ...G },
  alphamon:            { ...G, fps:8 },
  drimogemon:          { ...G },
  giromon:             { ...G },
  // hiandromon: already listed above

  // ── Pulsemon line — Electro ───────────────────────────────────────────────
  // dokimon / bibimon: already listed above
  pulsemon:            { ...G },
  bulkmon:             { mode:"frames", frameCount:12, fps:6 },
  boutmon:             { ...G },
  kazuchimon:          { ...G, fps:8 },

  // ── Monodramon line — Cyber Dragon ───────────────────────────────────────
  // ketomon / hopmon: already listed above
  monodramon:          { ...G },
  strikedramon:        { ...S1 },
  justimon:            { ...S1 },
  cyberdramon:         { ...G, fps:8 },

  // ── Candlemon line — Flame ────────────────────────────────────────────────
  // mokumon / petitmeramon: already listed above
  candlemon:           { ...G },
  meramon:             { ...G },
  bluemeramon:         { ...G },
  skullmeramon:        { ...G },
  boltmon:             { ...G, fps:8 },

  // ── Vorvomon line — Volcanic ──────────────────────────────────────────────
  vorvomon:            { ...G },
  lavorvomon:          { ...G },
  lavogaritamon:       { ...G },
  volcanicdramon:      { ...G, fps:8 },

  // ── Coronamon line — Solar ────────────────────────────────────────────────
  // mokumon / sunmon: already listed above
  coronamon:           { ...G },
  firamon:             { ...G },
  flaremon:            { ...G },
  apollomon:           { ...G, fps:8 },

  // ── Lunamon line — Lunar ──────────────────────────────────────────────────
  // yukimibotamon / moonmon: already listed above
  lunamon:             { ...G },
  lekismon:            { ...G },
  crescemon:           { ...G },
  dianamon:            { ...G, fps:8 },
  gracenovamon:        { ...G, fps:8 },           // DNA fusion

  // ── Labramon line — Dog Guardian ─────────────────────────────────────────
  // paomon / xiamon: already listed above
  labramon:            { ...G },
  dobermon:            { ...G },
  seasarmon:           { ...G },
  cerberumon:          { ...G, fps:8 },

  // ── Gammamon line — Gamma ─────────────────────────────────────────────────
  // curimon / gurimon: already listed above
  gammamon:            { ...G },
  betelgammamon:       { ...G },
  kausgammamon:        { ...G },
  wezengammamon:       { ...G },
  gulusgammamon:       { ...G },
  canoweissmon:        { ...G },
  siriusmon:           { ...G, fps:8 },
  regulusmon:          { ...G },
  arcturusmon:         { ...G, fps:8 },

  // ── Herissmon line — Shield Beast ────────────────────────────────────────
  // pusumon / pusurimon: already listed above
  herissmon:           { ...G },
  filmon:              { ...G },
  stefilmon:           { ...G },
  rasenmon:            { ...G, fps:8 },

  // ── Gaomon line — Steel Fang ──────────────────────────────────────────────
  // botamon / wanyamon: already listed above
  gaomon:              { ...G },
  gaogamon:            { ...G },
  machgaogamon:        { ...G },
  miragegaogamon:      { ...S1 },
  // zeedgarurumon: already listed above (Ultra)

  // ── Neglect lines ─────────────────────────────────────────────────────────
  numemon:             { ...G },
  sukamon:             { ...G },
  etemon:              { ...G },
  metal_etemon:        { ...G, fps:8 },
  king_etemon:         { ...G, fps:8 },
  platinum_sukamon:    { ...G },
  king_sukamon:        { ...G, fps:8 },
  monzaemon:           { ...G },
  warumonzaemon:       { ...G, fps:8 },
  gold_numemon:        { ...G },
  blackkingnumemon:    { ...G },

};

// Returns config or null (component falls back to SVG when null)
export function getSpriteConfig(id) {
  return SPRITE_CONFIG[id] || null;
}

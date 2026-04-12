// ─── Game constants ────────────────────────────────────────────────────────────

export const STAGE_COLOR = {
  Baby:          "#FFB3C6",
  "In-Training": "#FFD580",
  Rookie:        "#7EF797",
  Champion:      "#7EB8F7",
  Ultimate:      "#B8A0E8",
  Mega:          "#FF9940",
  Ultra:         "#FFD700",
};

export const TYPE_COLOR = {
  Vaccine: "#7EB8F7",
  Virus:   "#FF7070",
  Data:    "#FFD700",
  Free:    "#aaa",
  Unknown: "#888",
};

export const ATTR_COLOR = {
  Fire:    "#FF6B35",
  Water:   "#5BA4CF",
  Earth:   "#8B6914",
  Thunder: "#FFD700",
  Plant:   "#4CAF50",
  Light:   "#FFE066",
  Dark:    "#9B59B6",
  Neutral: "#aaa",
  None:    "#888",
};

// ── Task templates (replaces categories) ─────────────────────────────────────
export const TASK_TEMPLATES = [
  "Workout", "Deep Work", "Recovery", "Maintenance",
  "Social", "Reflection", "Challenge", "Neutral",
];

// Template → Crest map
export const TEMPLATE_CREST_MAP = {
  "Workout":    { primary: "Courage",     secondary: "Care" },
  "Deep Work":  { primary: "Knowledge",   secondary: "Reliability" },
  "Recovery":   { primary: "Care",        secondary: "Light" },
  "Maintenance":{ primary: "Reliability", secondary: "Light" },
  "Social":     { primary: "Friendship",  secondary: "Care" },
  "Reflection": { primary: "Sincerity",   secondary: "Knowledge" },
  "Challenge":  { primary: "Courage",     secondary: "Hope" },
  "Neutral":    { primary: null,          secondary: null },
};

// Crest definitions
export const CREST_INFO = {
  Courage:     { color: "#FF6B35", icon: "🔥", desc: "Facing challenges head-on" },
  Knowledge:   { color: "#B8A0E8", icon: "📚", desc: "Learning and deep focus" },
  Reliability: { color: "#7EB8F7", icon: "⚙️",  desc: "Consistency and discipline" },
  Care:        { color: "#FF9EB5", icon: "💗",  desc: "Nurturing and recovery" },
  Friendship:  { color: "#7EF797", icon: "🤝",  desc: "Connection and community" },
  Sincerity:   { color: "#FFD580", icon: "✨",  desc: "Honest reflection" },
  Hope:        { color: "#FFD700", icon: "⭐",  desc: "Dreaming and pushing limits" },
  Light:       { color: "#FFE066", icon: "☀️",  desc: "Wellness and balance" },
};

// Crest gain per task (primary / secondary points)
export const CREST_GAIN = {
  Easy:   { primary: 1, secondary: 0 },
  Medium: { primary: 2, secondary: 1 },
  Hard:   { primary: 3, secondary: 1 },
};

export const CREST_DAILY_CAP = 15; // max crest points per crest per day

// ── Roles ──────────────────────────────────────────────────────────────────────
export const ROLES = {
  Balanced:  { color: "#8a90a8", icon: "◈",  desc: "Flexible — no penalty in any mode" },
  Striker:   { color: "#FF6B35", icon: "⚔",  desc: "High Power, high aggression" },
  Guardian:  { color: "#7EB8F7", icon: "🛡",  desc: "High Guard, team protection" },
  Tactician: { color: "#B8A0E8", icon: "🎯",  desc: "High Focus, strategic advantage" },
  Support:   { color: "#7EF797", icon: "💚",  desc: "Boosts allies, heals, enables" },
  Vanguard:  { color: "#FFD700", icon: "⚡",  desc: "Power + Momentum — all-out assault" },
  Scholar:   { color: "#FFD580", icon: "📖",  desc: "Focus + Knowledge — tactical genius" },
};

// ── Personalities ─────────────────────────────────────────────────────────────
export const PERSONALITIES = [
  { id:"durable",  label:"Durable",  color:"#7EF797", crestAffinity:"Care",        battleBonus:{ Guard:   0.07 } },
  { id:"lively",   label:"Lively",   color:"#5BA4CF", crestAffinity:"Friendship",  battleBonus:{ Momentum:0.07 } },
  { id:"fighter",  label:"Fighter",  color:"#FF6B35", crestAffinity:"Courage",     battleBonus:{ Power:   0.07 } },
  { id:"defender", label:"Defender", color:"#7EB8F7", crestAffinity:"Reliability", battleBonus:{ Guard:   0.05, Focus: 0.02 } },
  { id:"brainy",   label:"Brainy",   color:"#B8A0E8", crestAffinity:"Knowledge",   battleBonus:{ Focus:   0.07 } },
  { id:"nimble",   label:"Nimble",   color:"#FFD700", crestAffinity:"Hope",        battleBonus:{ Momentum:0.05, Power: 0.02 } },
];

// ── Task XP ───────────────────────────────────────────────────────────────────
export const PRIORITY_XP    = { Low: 0.5, Medium: 1.0, High: 1.5 };
export const DIFF_XP        = { Easy: 0.5, Medium: 1.0, Hard: 1.5 };
export const BASE_XP        = 100;
export const STREAK_XP_CAP  = 2.0;

// ── Task options ──────────────────────────────────────────────────────────────
export const CATEGORIES   = TASK_TEMPLATES; // alias for any code still referencing CATEGORIES
export const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const PRIORITIES   = ["Low","Medium","High"];
export const DIFFICULTIES = ["Easy","Medium","Hard"];

export const PRIORITY_COLORS = {
  Low:    "#7EB8F7",
  Medium: "#FFD700",
  High:   "#FF9940",
  Urgent: "#FF4444",
};

// ── Evolution requirements (bond replaces ABI) ────────────────────────────────
// crestMatch: minimum fraction of ideal crest match (0–1)
// partnerVow: minimum match fraction for bond to override crest requirement
export const EVO_REQUIREMENTS = {
  "In-Training": { level: 3,  bond: 0  },
  "Rookie":      { level: 6,  bond: 5  },
  "Champion":    { level: 10, bond: 20, crestMatch: 0.50, partnerVow: 0.25 },
  "Ultimate":    { level: 25, bond: 40, crestMatch: 0.60, partnerVow: 0.30 },
  "Mega":        { level: 50, bond: 60, crestMatch: 0.70, partnerVow: 0.35 },
  "Ultra":       { level: 70, bond: 80, crestMatch: 0.75, partnerVow: 0.40 },
};

// ── Stamina ───────────────────────────────────────────────────────────────────
export const STAMINA_MAX            = 100;
export const STAMINA_REGEN_PER_HOUR = 10;
export const STAMINA_FOOD_CAP       = 100; // max stamina from food per day

export const STAMINA_COSTS = {
  bot_easy:   10,
  bot_medium: 15,
  bot_hard:   20,
};

// ── Food items (shown in Shop) ────────────────────────────────────────────────
export const FOOD_ITEMS = [
  { id:"meal_apple",   name:"Apple",       icon:"🍎", cost:50,  stamina:20, bond:0.5, type:"meal",  desc:"A refreshing snack." },
  { id:"meal_onigiri", name:"Onigiri",     icon:"🍙", cost:80,  stamina:25, bond:0.5, type:"meal",  desc:"Hearty rice-ball fuel." },
  { id:"treat_cake",   name:"DigiCake",    icon:"🍰", cost:150, stamina:40, bond:1,   type:"treat", desc:"A delicious treat!" },
  { id:"treat_ramen",  name:"Ramen Bowl",  icon:"🍜", cost:200, stamina:50, bond:1,   type:"treat", desc:"The tamer's favorite." },
];

// ── Other shop items ──────────────────────────────────────────────────────────
export const SHOP_ITEMS = [
  { id:"exp",    name:"EXP Booster +500",    cost:1000, icon:"⭐", category:"upgrade" },
  { id:"random", name:"Random Digimon",      cost:2000, icon:"🎲", category:"special" },
  { id:"xab",    name:"X-Antibody",          cost:3000, icon:"✖️", category:"special" },
  { id:"pers",   name:"Personality Changer", cost:2000, icon:"🎭", category:"special" },
  { id:"vow",    name:"Partner Vow",         cost:1500, icon:"🔮", category:"special",
    desc:"Enables Partner Vow evolution even if crest alignment is below ideal." },
  { id:"crest_boost", name:"Crest Catalyst", cost:500, icon:"💎", category:"upgrade",
    desc:"+3 to your lowest active crest (1 per week)." },
];

// ── Neglect system ────────────────────────────────────────────────────────────
// Speech shown in the pet stage bubble when neglected (random pick per level)
export const NEGLECT_SPEECH = {
  quiet:    ["...been managing on my own.", "you've been busy, huh?", "i kept the routine going.", "good to see you."],
  dormant:  ["...it's been a while.", "i wasn't sure you'd come back.", "did something happen?", "i've been... different lately."],
  unstable: ["...something was shifting inside me.", "the quiet got very loud.", "i almost gave up waiting.", "a darker path started calling."],
  critical: ["...you left me for a long time.", "i changed while you were gone.", "the bond we had has faded.", "i'm not the same partner you left."],
};

// ── Campaign / Raid system ────────────────────────────────────────────────────
// Template → which raid stat that task type trains
export const TEMPLATE_RAID_STAT = {
  "Workout":     "power",
  "Challenge":   "power",
  "Deep Work":   "focus",
  "Reflection":  "focus",
  "Maintenance": "guard",
  "Recovery":    "guard",
  "Social":      "momentum",
  "Neutral":     null,  // contributes average of all stats
};

// Difficulty → damage multiplier
export const RAID_DIFF_MULT = { Easy: 1.0, Medium: 1.5, Hard: 2.5 };

// Active boss event definition
export const CURRENT_RAID = {
  id:        "venom-myotismon-2026-04",
  name:      "VenomMyotismon",
  title:     "Virus of the Dark Net",
  attr:      "Dark",
  type:      "Demon Lord",
  stage:     "Mega",
  bossHp:    10000,
  startDate: "2026-04-12",
  endDate:   "2026-04-26",
  reward:    { eggId: "shadow", name: "Shadow DigiEgg", desc: "A dark egg pulsing with DemiDevimon's data. Raise it to forge your own dark-type partner." },
  // Phases triggered at these damage-fraction thresholds
  phases: [
    { name: "Dark Surge",       threshold: 0.25, dominant: "power",    color: "#9B59B6",
      desc:  "VenomMyotismon unleashes raw dark energy. Power attacks deal +50% bonus damage." },
    { name: "Virus Barrier",    threshold: 0.50, dominant: "focus",    color: "#7EB8F7",
      desc:  "A data barrier seals the boss. Focus breaches weak points — other attacks halved." },
    { name: "Bat Swarm",        threshold: 0.75, dominant: "momentum", color: "#FF6B35",
      desc:  "Crimson bat swarms overwhelm the team. Momentum keeps combo chains alive." },
    { name: "Eclipse",          threshold: 0.90, dominant: "guard",    color: "#FFD700",
      desc:  "Darkness consumes everything. Guard protects your progress from the eclipse drain." },
    { name: "Final Virus Burst",threshold: 1.00, dominant: "power",    color: "#FF4444",
      desc:  "VenomMyotismon is cornered. All stats amplified. Finish it — NOW." },
  ],
};

// ── Party ─────────────────────────────────────────────────────────────────────
export const MAX_PARTY_SIZE = 9;

// ── Battle rewards ────────────────────────────────────────────────────────────
export const BATTLE_REWARDS = {
  Easy:   { win: 60,  loss: 30 },
  Medium: { win: 80,  loss: 25 },
  Hard:   { win: 120, loss: 15 },
};

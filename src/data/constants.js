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

// Two paths depending on behavioral fingerprint (see calcNeglectPath in engine.js):
//   sukamon → tamer abandoned the partner (low Care/Friendship + low bond)
//   numemon  → tamer burned out and withdrew (low Courage/Reliability)
//
// Each path has a redemption branch and a non-redemption branch.
// Redemption is triggered when the tamer completes the Reconnection Arc (3 tasks).
export const NEGLECT_PATHS = {
  sukamon: {
    label:       "The Abandoned Path",
    description: "Your partner felt ignored and lost. A chaotic darkness crept in.",
    champion:    "sukamon",
    // Redemption branch (Reconnection Arc completed)
    redemption: {
      ultimate: "etemon",
      mega:     ["king_etemon", "metal_etemon"],  // player chooses at Mega
    },
    // Non-redemption branch
    nonRedemption: {
      ultimate: "platinum_sukamon",
      mega:     "king_sukamon",
    },
  },
  numemon: {
    label:       "The Burnout Path",
    description: "Your partner withdrew into itself, growing reclusive and withdrawn.",
    champion:    "numemon",
    // Redemption branch
    redemption: {
      ultimate: "monzaemon",
      mega:     "warumonzaemon",
    },
    // Non-redemption branch
    nonRedemption: {
      ultimate: "gold_numemon",
      mega:     "blackkingnumemon",
    },
  },
};

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

// ── Onboarding: Jijimon quiz ──────────────────────────────────────────────────
// 5 questions, each option awards +1 to a single crest.
// After all 5 answers the top crest determines which 2 eggs are offered.
export const QUIZ_QUESTIONS = [
  {
    question: "How do you usually power through a tough week?",
    options: [
      { text: "Push straight through — setbacks don't stop me", crest: "Courage" },
      { text: "Stick to my routine no matter what", crest: "Reliability" },
      { text: "Lean on friends and people I trust", crest: "Friendship" },
      { text: "Take breaks when I need them — staying healthy comes first", crest: "Care" },
    ],
  },
  {
    question: "What kind of tasks feel most natural to you?",
    options: [
      { text: "Deep focus — research, learning, problem-solving", crest: "Knowledge" },
      { text: "Physical challenges — workouts, hands-on effort", crest: "Courage" },
      { text: "Supporting others — checking in, helping, coordinating", crest: "Care" },
      { text: "Building habits — daily consistency, ticking every box", crest: "Reliability" },
    ],
  },
  {
    question: "After a big win, what's your first move?",
    options: [
      { text: "Journal it — I like to reflect honestly on how it went", crest: "Sincerity" },
      { text: "Share it — wins are better celebrated together", crest: "Friendship" },
      { text: "Rest and recharge — recovery is part of the process", crest: "Light" },
      { text: "Set the next goal — there's always something bigger ahead", crest: "Hope" },
    ],
  },
  {
    question: "Which describes you at your absolute best?",
    options: [
      { text: "Brave — I go first, even when it's scary", crest: "Courage" },
      { text: "Curious — I want to understand how everything works", crest: "Knowledge" },
      { text: "Honest — I don't pretend to be something I'm not", crest: "Sincerity" },
      { text: "A dreamer — always reaching for something beyond the horizon", crest: "Hope" },
    ],
  },
  {
    question: "Your ideal everyday life looks like...",
    options: [
      { text: "Balanced, calm and healthy — steady days, no drama", crest: "Light" },
      { text: "Full of discovery — something new every single day", crest: "Knowledge" },
      { text: "Connected — surrounded by people who matter to me", crest: "Friendship" },
      { text: "Meaningful challenges — every day a chance to grow", crest: "Courage" },
    ],
  },
];

// All unique egg options — used for the tamer's free-choice third egg.
// file: normalized PNG name in public/sprites/digitama/ (without .png)
// hatchId: baby digimon species ID that spawns when this egg hatches
export const ALL_EGGS = [
  { file:"botamon_agumon_greymon",        label:"Agumon",       hatchId:"botamon",  crest:"Courage",     desc:"Fire type. The Greymon legend begins here." },
  { file:"botamon_agumon2006_geogreymon", label:"Agumon '06",   hatchId:"botamon",  crest:"Courage",     desc:"A modern flame. GeoGreymon's path." },
  { file:"jyarimon_guilmon",              label:"Guilmon",      hatchId:"jyarimon", crest:"Courage",     desc:"Wild dragon, fueled by burning courage." },
  { file:"chicomon_veemon",               label:"Veemon",       hatchId:"chicomon", crest:"Courage",     desc:"V-Spirit ready. ExVeemon awaits." },
  { file:"jyarimon_blackguilmon",         label:"BlackGuilmon", hatchId:"jyarimon", crest:"Courage",     desc:"Dark dragon variant. Walks a fiercer path." },
  { file:"pichimon_tentomon",             label:"Tentomon",     hatchId:"pichimon", crest:"Knowledge",   desc:"Inquisitive insect. A mind built for discovery." },
  { file:"relemon_renamon",               label:"Renamon",      hatchId:"relemon",  crest:"Knowledge",   desc:"Sharp and disciplined. Masters every skill." },
  { file:"choromon_commandramon",         label:"Commandramon", hatchId:"choromon", crest:"Reliability", desc:"Disciplined soldier. Order and persistence." },
  { file:"pounimon_gabumon",              label:"Gabumon",      hatchId:"punimon",  crest:"Reliability", desc:"Loyal and steady — never misses a day." },
  { file:"botamon_gaomon",               label:"Gaomon",       hatchId:"botamon",  crest:"Reliability", desc:"Training-focused. MachGaogamon's origin." },
  { file:"nyokimon_piyomon",              label:"Piyomon",      hatchId:"nyokimon", crest:"Care",        desc:"Warm and nurturing. Heals and protects." },
  { file:"cocomon_lopmon",               label:"Lopmon",       hatchId:"cocomon",  crest:"Care",        desc:"Gentle and caring. Built for lasting bonds." },
  { file:"botamon_betamon",              label:"Betamon",      hatchId:"botamon",  crest:"Care",        desc:"Water type with a quiet, gentle strength." },
  { file:"pichimon_gomamon",             label:"Gomamon",      hatchId:"pichimon", crest:"Friendship",  desc:"Cheerful and social — every tamer's companion." },
  { file:"zerimon_terriermon",           label:"Terriermon",   hatchId:"zerimon",  crest:"Friendship",  desc:"Energetic and loyal. Better with friends." },
  { file:"leafmon_wormmon",              label:"Wormmon",      hatchId:"leafmon",  crest:"Friendship",  desc:"Devoted and determined. Stingmon's seed." },
  { file:"yuramon_palmon",               label:"Palmon",       hatchId:"nyokimon", crest:"Sincerity",   desc:"Pure-hearted. Grows where truth is planted." },
  { file:"poyomon_patamon",              label:"Patamon",      hatchId:"punimon",  crest:"Hope",        desc:"Small but mighty — a guardian in the making." },
  { file:"dokimon_pulsemon",             label:"Pulsemon",     hatchId:"dokimon",  crest:"Hope",        desc:"Electric with possibility. Always reaching." },
  { file:"mokumon_vorvomon",             label:"Vorvomon",     hatchId:"mokumon",  crest:"Light",       desc:"Warm and radiant. A flame of balance." },
  { file:"mokujmon_candlemon",           label:"Candlemon",    hatchId:"mokumon",  crest:"Light",       desc:"Flickering spirit. Knowledge through flame." },
];

// Crest → 2 determined eggs offered after the quiz (both given to the tamer)
// file: normalized PNG name in public/sprites/digitama/ (without .png)
// hatchId: baby digimon species ID that spawns when this egg hatches
export const CREST_EGGS = {
  Courage: [
    { file:"botamon_agumon_greymon", label:"Agumon's Egg",      hatchId:"botamon",  desc:"A fierce fire type. The Greymon legend begins here." },
    { file:"jyarimon_guilmon",       label:"Guilmon's Egg",     hatchId:"jyarimon", desc:"A wild dragon fueled by a tamer's burning courage." },
  ],
  Knowledge: [
    { file:"pichimon_tentomon",      label:"Tentomon's Egg",    hatchId:"pichimon", desc:"An inquisitive insect with a mind built for discovery." },
    { file:"relemon_renamon",        label:"Renamon's Egg",     hatchId:"relemon",  desc:"A sharp-eyed fox who masters every skill she pursues." },
  ],
  Reliability: [
    { file:"choromon_commandramon",  label:"Commandramon's Egg",hatchId:"choromon", desc:"A disciplined soldier built on order and persistence." },
    { file:"pounimon_gabumon",       label:"Gabumon's Egg",     hatchId:"punimon",  desc:"Loyal and steady — a partner who never misses a day." },
  ],
  Care: [
    { file:"nyokimon_piyomon",       label:"Piyomon's Egg",     hatchId:"nyokimon", desc:"Warm and nurturing — a partner who heals and protects." },
    { file:"cocomon_lopmon",         label:"Lopmon's Egg",      hatchId:"cocomon",  desc:"Gentle and caring — built for the bonds that matter most." },
  ],
  Friendship: [
    { file:"pichimon_gomamon",       label:"Gomamon's Egg",     hatchId:"pichimon", desc:"Cheerful and social — every tamer's favourite companion." },
    { file:"zerimon_terriermon",     label:"Terriermon's Egg",  hatchId:"zerimon",  desc:"Energetic and loyal — best enjoyed with others close by." },
  ],
  Sincerity: [
    { file:"nyokimon_piyomon",       label:"Piyomon's Egg",     hatchId:"nyokimon", desc:"Open-hearted and sincere — says exactly what she feels." },
    { file:"relemon_renamon",        label:"Renamon's Egg",     hatchId:"relemon",  desc:"True to herself — unyielding, honest, and disciplined." },
  ],
  Hope: [
    { file:"poyomon_patamon",        label:"Patamon's Egg",     hatchId:"punimon",  desc:"Small but mighty — a guardian angel waiting to bloom." },
    { file:"dokimon_pulsemon",       label:"Pulsemon's Egg",    hatchId:"dokimon",  desc:"Electric with possibility — always chasing the next peak." },
  ],
  Light: [
    { file:"poyomon_patamon",        label:"Patamon's Egg",     hatchId:"punimon",  desc:"A gentle light that guides even in the darkest of days." },
    { file:"mokumon_vorvomon",       label:"Vorvomon's Egg",    hatchId:"mokumon",  desc:"Warm and radiant — a flame of balance and wellbeing." },
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

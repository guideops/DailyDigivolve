// ─── Game constants ────────────────────────────────────────────────────────────
// All hardcoded values in one place.
// Change a number here and it updates everywhere automatically.

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

export const PERSONALITIES = [
  { id:"durable",  stat:"HP",  label:"Durable",  bonus:0.05, color:"#7EF797" },
  { id:"lively",   stat:"SP",  label:"Lively",   bonus:0.05, color:"#5BA4CF" },
  { id:"fighter",  stat:"ATK", label:"Fighter",  bonus:0.05, color:"#FF6B35" },
  { id:"defender", stat:"DEF", label:"Defender", bonus:0.05, color:"#7EB8F7" },
  { id:"brainy",   stat:"INT", label:"Brainy",   bonus:0.05, color:"#B8A0E8" },
  { id:"nimble",   stat:"SPD", label:"Nimble",   bonus:0.05, color:"#FFD700" },
];

// Task XP multipliers
export const PRIORITY_XP = { Low: 0.5, Medium: 1.0, High: 1.5 };
export const DIFF_XP     = { Easy: 0.5, Medium: 1.0, Hard: 1.5 };
export const DIFF_STATS  = { Easy: 1, Medium: 1, Hard: 2 };
export const BASE_XP     = 100;
export const STREAK_XP_CAP = 2.0;

// Task options
export const CATEGORIES   = ["Work","Personal","Health","Study","Creative","Social","Other"];
export const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const PRIORITIES   = ["Low","Medium","High","Urgent"];
export const DIFFICULTIES = ["Easy","Medium","Hard"];

export const PRIORITY_COLORS = {
  Low:    "#7EB8F7",
  Medium: "#FFD700",
  High:   "#FF9940",
  Urgent: "#FF4444",
};

// Party limits
export const MAX_PARTY_SIZE = 9;

// Store bit rewards
export const BATTLE_REWARDS = {
  Easy:   { win: 60,  loss: 30 },
  Medium: { win: 80,  loss: 25 },
  Hard:   { win: 120, loss: 15 },
};

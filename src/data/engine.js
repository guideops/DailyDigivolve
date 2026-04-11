// ─── Game engine — pure functions, no React ────────────────────────────────────

import { DIGIMON_MAP } from './digimon.js';
import {
  PERSONALITIES, PRIORITY_XP, DIFF_XP, BASE_XP, STREAK_XP_CAP,
  EVO_REQUIREMENTS, CREST_INFO, TEMPLATE_CREST_MAP, CREST_GAIN, CREST_DAILY_CAP,
  STAMINA_MAX, STAMINA_REGEN_PER_HOUR,
} from './constants.js';

// ── Battle stats (new 4-stat system) ─────────────────────────────────────────
// Power, Guard, Focus, Momentum replace HP/ATK/DEF/INT/SP/SPD in the UI.
// Internal HP is still used for battle resource tracking.
export function calcBattleStats(digi) {
  var info = DIGIMON_MAP[digi.speciesId];
  if (!info) return { Power: 50, Guard: 30, Focus: 30, Momentum: 40, HP: 100 };
  var lvl  = digi.level || 1;
  var scale = 1 + (lvl - 1) * 0.03;
  var pers  = PERSONALITIES.find(function(p){ return p.id === digi.personality; }) || PERSONALITIES[0];
  var bonus = pers.battleBonus || {};

  var raw = {
    Power:    Math.floor((info.atk || 50) * scale),
    Guard:    Math.floor(((info.def || 45) * 0.8 + (info.hp || 100) * 0.1) * scale * 0.5),
    Focus:    Math.floor(((info.int || 35) * 1.2 + (info.sp || 50) * 0.3) * scale * 0.7),
    Momentum: Math.floor((info.spd || 50) * 0.9 * scale),
    HP:       Math.floor((info.hp || 100) * scale),
  };

  // Apply personality battle bonuses
  ["Power","Guard","Focus","Momentum"].forEach(function(s) {
    if (bonus[s]) raw[s] = Math.floor(raw[s] * (1 + bonus[s]));
  });

  return raw;
}

// ── Battle damage ─────────────────────────────────────────────────────────────
export function calcBattleDamage(attacker, defender) {
  var as = calcBattleStats(attacker);
  var ds = calcBattleStats(defender);
  var base = Math.max(1, as.Power * 1.2 - ds.Guard * 0.8);
  var critChance = Math.min(0.30, as.Focus / 200);
  var crit = Math.random() < critChance ? 1.5 : 1.0;
  var variance = 0.85 + Math.random() * 0.30;
  return Math.max(1, Math.floor(base * crit * variance));
}

// ── XP reward ─────────────────────────────────────────────────────────────────
export function calcXpReward(task, streakDays) {
  var pri    = PRIORITY_XP[task.priority]  || 1.0;
  var diff   = DIFF_XP[task.difficulty]    || 1.0;
  var streak = Math.min(1 + ((streakDays || 0) * 0.1), STREAK_XP_CAP);
  return Math.floor(BASE_XP * pri * diff * streak);
}

// ── Crest gain for completing a task ─────────────────────────────────────────
// Returns { primary, secondary, primaryCrest, secondaryCrest } or null for Neutral
export function calcCrestGain(template, difficulty) {
  var map  = TEMPLATE_CREST_MAP[template] || TEMPLATE_CREST_MAP["Neutral"];
  var gain = CREST_GAIN[difficulty] || CREST_GAIN["Easy"];
  if (!map.primary) return null;
  return {
    primaryCrest:   map.primary,
    secondaryCrest: map.secondary || null,
    primary:        gain.primary,
    secondary:      gain.secondary,
  };
}

// ── Crest profile calculation ─────────────────────────────────────────────────
// crestHistory: [{ date, primaryCrest, secondaryCrest, primary, secondary }, ...]
// windowDays: rolling window (default 14)
export function calcCrestProfile(crestHistory, windowDays) {
  windowDays = windowDays || 14;
  var cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  var recent = (crestHistory || []).filter(function(e) {
    return new Date(e.date).getTime() >= cutoff;
  });

  var totals = {};
  Object.keys(CREST_INFO).forEach(function(c){ totals[c] = 0; });

  recent.forEach(function(entry) {
    if (entry.primaryCrest)   totals[entry.primaryCrest]   = (totals[entry.primaryCrest]   || 0) + (entry.primary   || 0);
    if (entry.secondaryCrest) totals[entry.secondaryCrest] = (totals[entry.secondaryCrest] || 0) + (entry.secondary || 0);
  });

  var maxPoints = Math.max.apply(null, Object.values(totals).concat([1]));
  var percentages = {};
  Object.keys(totals).forEach(function(c) {
    percentages[c] = Math.round((totals[c] / maxPoints) * 100);
  });

  var sorted = Object.entries(totals).sort(function(a, b){ return b[1] - a[1]; });
  var primary   = sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
  var secondary = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

  return { totals: totals, percentages: percentages, primary: primary, secondary: secondary };
}

// ── Crest match score against a target's ideal crests ────────────────────────
// Returns 0.0–1.0 (1.0 = perfect match)
export function calcCrestMatch(crestProfile, crestReq) {
  if (!crestReq || !crestProfile || !crestProfile.percentages) return 0;
  var pcts = crestProfile.percentages;
  var primaryPct   = (pcts[crestReq.primary]   || 0) / 100;
  var secondaryPct = crestReq.secondary ? (pcts[crestReq.secondary] || 0) / 100 : 0;
  if (!crestReq.secondary) return primaryPct;
  return primaryPct * 0.70 + secondaryPct * 0.30;
}

// ── Evolution eligibility ─────────────────────────────────────────────────────
// Returns { eligible, vow, reason, matchPct }
// eligible: true if fully eligible
// vow: true if Partner Vow could bridge the gap (not fully eligible but close)
export function checkEvoEligible(digi, bond, crestProfile, targetId) {
  var targetInfo = DIGIMON_MAP[targetId];
  if (!targetInfo) return { eligible: false, reason: "Unknown target" };
  if (targetInfo.fusionOf) return { eligible: false, reason: "Requires DNA Digivolution" };

  var req = EVO_REQUIREMENTS[targetInfo.stage];
  if (!req) return { eligible: false, reason: "No requirements defined" };

  if (digi.level < req.level) {
    return { eligible: false, reason: "Need Lv." + req.level };
  }
  if ((bond || 0) < (req.bond || 0)) {
    return { eligible: false, reason: "Need Bond " + req.bond };
  }

  if (req.crestMatch && targetInfo.crestReq) {
    var match = calcCrestMatch(crestProfile, targetInfo.crestReq);
    var matchPct = Math.round(match * 100);
    if (match >= req.crestMatch) {
      return { eligible: true, matchPct: matchPct };
    }
    // Partner Vow threshold
    if (match >= (req.partnerVow || 0)) {
      return { eligible: false, vow: true, matchPct: matchPct, reason: "Partner Vow eligible (" + matchPct + "% match)" };
    }
    return { eligible: false, vow: false, matchPct: matchPct, reason: "Crest match " + matchPct + "% (need " + Math.round(req.crestMatch * 100) + "%)" };
  }

  return { eligible: true, matchPct: 100 };
}

// ── Apply XP gain ─────────────────────────────────────────────────────────────
export function applyXpGain(digi, gainedXp) {
  var xp     = digi.exp + gainedXp;
  var level  = digi.level;
  var needed = digi.expNeeded;
  while (xp >= needed) {
    xp    -= needed;
    level += 1;
    needed = Math.floor(needed * 1.2);
  }
  return { exp: xp, level: level, expNeeded: needed };
}

// ── Stamina regen ─────────────────────────────────────────────────────────────
// Returns current stamina accounting for passive regen since lastUpdate
export function calcCurrentStamina(savedStamina, lastUpdateISO) {
  if (!lastUpdateISO) return savedStamina;
  var hoursPassed = (Date.now() - new Date(lastUpdateISO).getTime()) / (1000 * 60 * 60);
  var regen = Math.floor(hoursPassed * STAMINA_REGEN_PER_HOUR);
  return Math.min(STAMINA_MAX, (savedStamina || 0) + regen);
}

// ── Bond gain ─────────────────────────────────────────────────────────────────
export function clampBond(v) { return Math.min(100, Math.max(0, Math.round(v * 10) / 10)); }

// ── Create a new Digimon ──────────────────────────────────────────────────────
export function newDigimon(speciesId, overrides) {
  var info = DIGIMON_MAP[speciesId];
  if (!info) return null;
  var pers = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
  return Object.assign({
    uid:        Date.now() + "_" + Math.random().toString(36).slice(2),
    speciesId:  speciesId,
    name:       info.name,
    level:      1,
    exp:        0,
    expNeeded:  100,
    bonusStats: {},
    abi:        0,         // legacy field, kept for DB compat
    personality:pers.id,
    discovered: [speciesId],
    inFarm:     false,
    hasXAntibody: false,
    isXForm:    false,
  }, overrides || {});
}

// ── Stage ordering ────────────────────────────────────────────────────────────
var STAGE_ORDER = ["Baby","In-Training","Rookie","Champion","Ultimate","Mega","Ultra"];
export function stageIndex(stage) {
  var i = STAGE_ORDER.indexOf(stage);
  return i >= 0 ? i : 2;
}

// ── Legacy shims (kept so existing code compiles) ─────────────────────────────
export function calcStats(digi) {
  // Returns battle stats under old names for any code not yet updated
  var bs = calcBattleStats(digi);
  return { HP: bs.HP, SP: bs.Focus, ATK: bs.Power, DEF: bs.Guard, INT: bs.Focus, SPD: bs.Momentum };
}
export function abiCap() { return 999; }
export function totalBonusStats() { return 0; }
export function calcStatReward() { return 0; } // stat points removed

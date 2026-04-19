// ─── Game engine — pure functions, no React ────────────────────────────────────

import { DIGIMON_MAP } from './digimon.js';
import {
  PERSONALITIES, PRIORITY_XP, DIFF_XP, BASE_XP, STREAK_XP_CAP,
  EVO_REQUIREMENTS, CREST_INFO, TEMPLATE_CREST_MAP, CREST_GAIN, CREST_DAILY_CAP,
  STAMINA_MAX, STAMINA_REGEN_PER_HOUR, CREST_STAGE_EVO_REQ,
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
// opts: { focusBonus, momentumDouble }
// Returns { damage, crit }
export function calcBattleDamage(attacker, defender, opts) {
  var as = calcBattleStats(attacker);
  var ds = calcBattleStats(defender);
  var base = Math.max(1, as.Power * 1.2 - ds.Guard * 0.8);
  var critChance = Math.min(0.30, as.Focus / 200);
  if (opts && opts.focusBonus) critChance = Math.min(0.80, critChance + 0.40);
  var crit = Math.random() < critChance;
  var critMult = crit ? 1.6 : 1.0;
  var variance = 0.85 + Math.random() * 0.30;
  var damage = Math.max(1, Math.floor(base * critMult * variance));
  return { damage: damage, crit: crit };
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

  var totalPoints = Object.values(totals).reduce(function(s, v){ return s + v; }, 0) || 1;
  var percentages = {};
  Object.keys(totals).forEach(function(c) {
    percentages[c] = Math.round((totals[c] / totalPoints) * 100);
  });

  var sorted = Object.entries(totals).sort(function(a, b){ return b[1] - a[1]; });
  var primary   = sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
  var secondary = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

  return { totals: totals, percentages: percentages, primary: primary, secondary: secondary };
}

// ── Evolution eligibility ─────────────────────────────────────────────────────
// Returns { eligible, reason, primaryStage, primaryNeed, secondaryStage, secondaryNeed }
export function checkEvoEligible(digi, bond, _crestProfile, targetId) {
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

  if (req.crestStage && targetInfo.crestReq) {
    var stages   = digi.crestStages || {};
    var stageReq = CREST_STAGE_EVO_REQ[targetInfo.stage] || {};
    var primaryStage   = stages[targetInfo.crestReq.primary]   || 0;
    var secondaryStage = targetInfo.crestReq.secondary ? (stages[targetInfo.crestReq.secondary] || 0) : null;
    var primaryNeed    = stageReq.primary   || 0;
    var secondaryNeed  = stageReq.secondary || 0;

    if (primaryStage < primaryNeed) {
      return { eligible: false, reason: targetInfo.crestReq.primary + " Stage " + primaryNeed + " needed", primaryStage, primaryNeed, secondaryStage, secondaryNeed };
    }
    if (secondaryStage !== null && secondaryStage < secondaryNeed) {
      return { eligible: false, reason: targetInfo.crestReq.secondary + " Stage " + secondaryNeed + " needed", primaryStage, primaryNeed, secondaryStage, secondaryNeed };
    }
    return { eligible: true, primaryStage, primaryNeed, secondaryStage, secondaryNeed };
  }

  return { eligible: true };
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

// ── Neglect path determination ────────────────────────────────────────────────
// Returns "sukamon" or "numemon" based on the tamer's behavioral fingerprint.
//
// Sukamon path  → tamer abandoned their partner (low Care + low Friendship crests,
//                 low bond). The Digimon felt ignored and went feral / chaotic.
// Numemon path  → tamer burned themselves out (low Courage + low Reliability crests,
//                 moderate bond). The Digimon withdrew and became reclusive.
//
// Score is 0–100.  > 50  → Sukamon;  ≤ 50 → Numemon.
export function calcNeglectPath(crestProfile, bond) {
  var pcts = (crestProfile && crestProfile.percentages) || {};
  var bondVal = Math.max(0, Math.min(100, bond || 0));

  // Abandonment indicators (push toward Sukamon)
  var carePct       = pcts["Care"]       || 0;  // nurturing tasks
  var friendshipPct = pcts["Friendship"] || 0;  // social engagement
  var avgAbandon    = (carePct + friendshipPct) / 2;  // 0-100

  // Burnout indicators (push toward Numemon)
  var couragePct     = pcts["Courage"]     || 0;  // active challenges
  var reliabilityPct = pcts["Reliability"] || 0;  // consistent maintenance
  var avgBurnout     = (couragePct + reliabilityPct) / 2;  // 0-100

  // Low abandonment scores and low bond → Sukamon (ignored)
  // Low burnout scores with any bond → Numemon (withdrew)
  // We convert into an "abandonment score": higher = more likely Sukamon
  var abandonScore = (100 - avgAbandon) * 0.55   // low care/friendship → +score
                   + (100 - bondVal)    * 0.45;  // low bond strongly indicates neglect/abandonment

  var burnoutScore = (100 - avgBurnout) * 0.60   // low courage/reliability → +score
                   + bondVal            * 0.40;  // retaining some bond → burnout not abandonment

  // Whichever score is higher determines the path
  return abandonScore >= burnoutScore ? "sukamon" : "numemon";
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

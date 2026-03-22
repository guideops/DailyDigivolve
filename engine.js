// ─── Game engine — pure functions, no React ────────────────────────────────────
// These functions contain all game logic.
// They are pure JS — no React imports, no side effects.
// This means they can also be copied into a Cloudflare Worker for server-side
// validation later, without any changes.

import { DIGIMON_MAP, DIGIMON_DB } from './digimon.js';
import { PERSONALITIES, PRIORITY_XP, DIFF_XP, DIFF_STATS, BASE_XP, STREAK_XP_CAP } from './constants.js';

// ── Stat calculation ──────────────────────────────────────────────────────────
export function calcStats(digi) {
  var info = DIGIMON_MAP[digi.speciesId];
  if (!info) return { HP:100, SP:50, ATK:50, DEF:50, INT:50, SPD:50 };
  var pers = PERSONALITIES.find(function(p) { return p.id === digi.personality; }) || PERSONALITIES[0];
  var lvl  = digi.level || 1;
  var stats = {};
  ["HP","SP","ATK","DEF","INT","SPD"].forEach(function(s) {
    var base   = info[s.toLowerCase()] || 50;
    var growth = base * (lvl - 1) * 0.03;
    var bonus  = (digi.bonusStats || {})[s] || 0;
    var raw    = Math.floor(base + growth + bonus);
    stats[s]   = pers.stat === s ? Math.floor(raw * (1 + pers.bonus)) : raw;
  });
  return stats;
}

// ── ABI cap ───────────────────────────────────────────────────────────────────
export function abiCap(digi) {
  return 50 + ((digi.abi || 0) / 2);
}

// ── Total bonus stats allocated ───────────────────────────────────────────────
export function totalBonusStats(digi) {
  var b = digi.bonusStats || {};
  return (b.HP||0) + (b.SP||0) + (b.ATK||0) + (b.DEF||0) + (b.INT||0) + (b.SPD||0);
}

// ── XP reward for completing a task ──────────────────────────────────────────
export function calcXpReward(task, streakDays) {
  var pri    = PRIORITY_XP[task.priority]   || 1.0;
  var diff   = DIFF_XP[task.difficulty]     || 1.0;
  var streak = Math.min(1 + ((streakDays || 0) * 0.1), STREAK_XP_CAP);
  return Math.floor(BASE_XP * pri * diff * streak);
}

// ── Stat reward for completing a task ────────────────────────────────────────
export function calcStatReward(task) {
  return DIFF_STATS[task.difficulty] || 1;
}

// ── Level up calculation ─────────────────────────────────────────────────────
// Returns { xp, level, expNeeded } after applying gained XP
export function applyXpGain(digi, gainedXp) {
  var xp      = digi.exp + gainedXp;
  var level   = digi.level;
  var needed  = digi.expNeeded;
  while (xp >= needed) {
    xp     -= needed;
    level  += 1;
    needed  = Math.floor(needed * 1.2);
  }
  return { exp: xp, level: level, expNeeded: needed };
}

// ── Create a new Digimon ──────────────────────────────────────────────────────
export function newDigimon(speciesId, overrides) {
  var info = DIGIMON_MAP[speciesId];
  if (!info) return null;
  var pers = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
  return Object.assign({
    uid:         Date.now() + "_" + Math.random().toString(36).slice(2),
    speciesId:   speciesId,
    name:        info.name,
    level:       1,
    exp:         0,
    expNeeded:   100,
    bonusStats:  { HP:0, SP:0, ATK:0, DEF:0, INT:0, SPD:0 },
    savedStats:  0,
    abi:         0,
    personality: pers.id,
    discovered:  [speciesId],
    inFarm:      false,
    hasXAntibody:false,
    isXForm:     false,
  }, overrides || {});
}

// ── Battle damage formula ────────────────────────────────────────────────────
export function calcDamage(attackerStats, defenderStats) {
  return Math.max(1, Math.floor(
    attackerStats.ATK * 1.2
    - defenderStats.DEF * 0.5
    + Math.random() * 20
  ));
}

// ── Stage index (for evolution visual) ───────────────────────────────────────
var STAGE_ORDER = ["Baby","In-Training","Rookie","Champion","Ultimate","Mega","Ultra"];
export function stageIndex(stage) {
  var i = STAGE_ORDER.indexOf(stage);
  return i >= 0 ? i : 2;
}

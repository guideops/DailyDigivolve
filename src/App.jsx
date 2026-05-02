// ─── App.jsx ──────────────────────────────────────────────────────────────────
import { supabase } from './lib/supabase.js';
import { useState, useEffect, useMemo, useRef } from "react";
import DigiSprite from "./components/DigiSprite.jsx";
import DigiEgg from "./components/DigiEgg.jsx";
import OnboardingFlow from "./components/OnboardingFlow.jsx";
import { Bar } from "./components/ui.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import HearthPage from "./pages/HearthPage.jsx";
import { DIGIMON_MAP } from "./data/digimon.js";
import {
  STAGE_COLOR, ATTR_COLOR, PRIORITY_COLORS, TASK_TEMPLATES, DAYS_OF_WEEK,
  CREST_INFO, ROLES, PERSONALITIES, MAX_PARTY_SIZE, BATTLE_REWARDS,
  STAMINA_MAX, STAMINA_COSTS, FOOD_ITEMS, SHOP_ITEMS, STAMINA_FOOD_CAP, EVO_REQUIREMENTS,
  CURRENT_RAID, TEMPLATE_RAID_STAT, RAID_DIFF_MULT, NEGLECT_SPEECH, NEGLECT_PATHS, ALL_EGGS,
  CREST_STAGE_COSTS, CREST_STAGE_EVO_REQ, LOGIN_REWARDS,
  TAMER_XP_PER_LEVEL, TAMER_TASK_XP, TAMER_UNLOCKS,
} from "./data/constants.js";
import {
  calcBattleStats, calcBattleDamage, calcXpReward, applyXpGain, newDigimon,
  calcCrestGain, calcCrestProfile, checkEvoEligible, calcCurrentStamina, clampBond,
  calcNeglectPath,
} from "./data/engine.js";

// ── Design tokens ─────────────────────────────────────────────────────────────
var T = {
  bg:"#0d0f14", bgPanel:"#111318", bgCard:"#161a22", border:"#2a2d3a",
  pixelBorder:"#7EB8F7", text:"#e8eaf0", textMid:"#8a90a8", textDim:"#4a5070",
  coral:"#FF6B6B", teal:"#4ECDC4", lavender:"#C3B1E1", mint:"#A8E6CF",
  gold:"#FFD700", red:"#FF4444", green:"#5CB85C", pink:"#FF9EB5",
};
var PCOL = { Low:T.lavender, Medium:T.teal, High:T.coral, Urgent:T.red };

// ── Background definitions ─────────────────────────────────────────────────────
var BACKGROUNDS = [
  { id:"default",        label:"Digital Dark",   thumb:null,                              url:null,                              category:"default",
    story:"In the beginning there was only data and darkness. The first Digimon arose from these primordial streams, and the Digital World bloomed from that quiet void into everything we know today." },
  { id:"morning_blu",    label:"Morning Blue",   thumb:"/backgrounds/bg_morning_blu.jpg", url:"/backgrounds/bg_morning_blu.jpg", category:"morning",
    story:"In the age of Morning Blue skies, Angemon descended from the Server Continent and peace-loving Digimon came out to greet the dawn. Birdramon soared overhead, her great wings catching the first golden light of a new era." },
  { id:"night_pur",      label:"Night Purple",   thumb:"/backgrounds/bg_night_pur.jpg",   url:"/backgrounds/bg_night_pur.jpg",   category:"night",
    story:"During the Night Purple hours, Wizardmon would wander the data streams alone — a curious wanderer who carried every secret of the Digital World in his heart, yet never once forgot a single friend he made along the way." },
  { id:"file_island",    label:"File Island",    thumb:"/backgrounds/bg_file_island.jpg", url:"/backgrounds/bg_file_island.jpg", category:"forest",
    story:"Ah, File Island... the cradle of so many stories. It is where Agumon first met his Tamer, where Gabumon sang to the frozen wind, and where the bonds between humans and Digimon were first truly forged. I always feel at home when I think of it." },
  { id:"server_savanna", label:"Server Savanna", thumb:"/backgrounds/bg_server_savanna.jpg", url:"/backgrounds/bg_server_savanna.jpg", category:"plains",
    story:"The Server Continent stretches wide and golden under an open sky, where Garurumon runs free on silver paws. Not far from here, Elecmon tends lovingly to the in-training Digimon of Primary Village — a warm and bustling nursery full of life." },
  { id:"net_ocean",      label:"Net Ocean",      thumb:"/backgrounds/bg_net_ocean.jpg",   url:"/backgrounds/bg_net_ocean.jpg",   category:"ocean",
    story:"The Net Ocean holds more mysteries than even I can count, little one. Gomamon makes friends with every wave that crosses its path, and somewhere deep in the ancient currents, Seadramon guards secrets older than the Digital World itself." },
  { id:"folder_tundra",  label:"Folder Tundra",  thumb:"/backgrounds/bg_folder_tundra.jpg", url:"/backgrounds/bg_folder_tundra.jpg", category:"snow",
    story:"The Folder Continent's northern tundra is cold, but its heart is always warm. Frigimon and Yukidarumon keep each other company through the long winters, sharing stories much like you and I do now. Good company makes any cold bearable." },
  { id:"ancient_ruins",  label:"Ancient Ruins",  thumb:"/backgrounds/bg_ancient_ruins.jpg", url:"/backgrounds/bg_ancient_ruins.jpg", category:"ruins",
    story:"These ruins speak of an age before Tamers, when Leomon stood alone as guardian of justice and Meramon's eternal flames lit the sky red. Much was lost in the ancient wars... but the courage those Digimon showed endures in every heart to this day." },
];

function px(c){ return { border:"2px solid "+(c||T.pixelBorder), boxShadow:"3px 3px 0 "+(c||T.pixelBorder) }; }

// ── Nav ───────────────────────────────────────────────────────────────────────
// FILEHAVEN = tamer productivity + alignment (tasks, week, crests)
// P.E.T = where Digimon data lives (team, farm, dex)
// CYBERSPACE = Digimon combat & social dimension (patch, breach, store, network)
var NAV_GROUPS = [
  { id:"filehaven",  label:"P.E.T",      icon:"📟",
    pages:[
      { id:"team",     label:"TEAM",      icon:"◈" },
      { id:"digifarm", label:"FARM",      icon:"🌿" },
      { id:"digidex",  label:"DIGIDEX",   icon:"📖" },
    ]
  },
  { id:"pet",        label:"FILEHAVEN",   icon:"🗂",
    pages:[
      { id:"tasks",    label:"TASKS",     icon:"☑" },
      { id:"weekly",   label:"WEEK",      icon:"📅" },
      { id:"crests",   label:"CRESTS",    icon:"💎" },
    ]
  },
  { id:"cyberspace", label:"CYBERSPACE", icon:"🌐",
    pages:[
      { id:"battle",   label:"PATCH",     icon:"⚔" },
      { id:"campaign", label:"BREACH",    icon:"☠" },
      { id:"store",    label:"STORE",     icon:"🛒" },
      { id:"network",  label:"NETWORK",   icon:"🔗" },
      { id:"hearth",   label:"HEARTH",    icon:"🏡" },
    ]
  },
];

// ── Crest icon component — renders the actual crest image ────────────────────
function CrestIcon({ ci, size }) {
  if (!ci) return null;
  var px = typeof size === "number" ? size : parseInt(size) || 20;
  if (ci.img) {
    return <img src={ci.img} alt="" style={{ width:px, height:px, objectFit:"contain", display:"inline-block", verticalAlign:"middle" }}/>;
  }
  return <span style={{ fontSize:px }}>{ci.icon}</span>;
}

// ── Crest Compass — reusable alignment radar using crest PNG icons ────────────
// Props: crestProfile { primary, secondary, percentages }, size (px, default 220)
var COMPASS_CRESTS = ["Courage","Friendship","Knowledge","Sincerity","Light","Care","Reliability","Hope"];
var COMPASS_ANGLES = [
  -Math.PI/2,    // N  — Courage
  -Math.PI/4,    // NE — Friendship
   0,            // E  — Knowledge
   Math.PI/4,    // SE — Sincerity
   Math.PI/2,    // S  — Light
   3*Math.PI/4,  // SW — Care
   Math.PI,      // W  — Reliability
  -3*Math.PI/4,  // NW — Hope
];
function CrestCompass({ crestProfile, size }) {
  size = size || 220;
  var half    = size / 2;
  var outerR  = half * 0.76;  // icons sit here
  var polyR   = half * 0.65;  // polygon max radius
  var pcts    = (crestProfile && crestProfile.percentages) || {};
  var maxVal  = Math.max.apply(null, COMPASS_CRESTS.map(function(n){ return pcts[n]||0; }).concat([1]));
  var primary = crestProfile && crestProfile.primary;
  var secondary = crestProfile && crestProfile.secondary;

  var polyPts = COMPASS_CRESTS.map(function(n, i){
    var frac = (pcts[n]||0) / maxVal;
    var r    = frac * polyR;
    return (half + r * Math.cos(COMPASS_ANGLES[i])).toFixed(1) + "," +
           (half + r * Math.sin(COMPASS_ANGLES[i])).toFixed(1);
  }).join(" ");

  var priColor = primary ? CREST_INFO[primary].color : "#ffffff";

  return (
    <svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{ overflow:"visible",display:"block" }}>
      <defs>
        {COMPASS_CRESTS.map(function(name){
          var ci = CREST_INFO[name];
          return (
            <filter key={name} id={"cc-glow-"+name+"-"+size} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feFlood floodColor={ci.color} floodOpacity="0.8" result="col"/>
              <feComposite in="col" in2="blur" operator="in" result="glow"/>
              <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          );
        })}
      </defs>

      {/* Reference rings */}
      {[0.33, 0.66, 1].map(function(f){
        return <circle key={f} cx={half} cy={half} r={polyR*f} fill="none" stroke="#1e1e2e" strokeWidth="1" strokeDasharray={f===1?"3 5":"2 6"}/>;
      })}

      {/* Axis spokes */}
      {COMPASS_ANGLES.map(function(ang, i){
        return (
          <line key={i} x1={half} y1={half}
            x2={(half + outerR * Math.cos(ang)).toFixed(1)}
            y2={(half + outerR * Math.sin(ang)).toFixed(1)}
            stroke="#1a1a2a" strokeWidth="1"/>
        );
      })}

      {/* Alignment polygon */}
      <polygon points={polyPts}
        fill={priColor+"22"} stroke={priColor+"77"} strokeWidth="1.5"/>

      {/* Crest icons */}
      {COMPASS_CRESTS.map(function(name, i){
        var ci      = CREST_INFO[name];
        var frac    = (pcts[name]||0) / maxVal;
        var isPrim  = name === primary;
        var isSec   = name === secondary;
        var iconSz  = isPrim ? Math.round(size*0.13) : isSec ? Math.round(size*0.10) : Math.max(Math.round(size*0.06), Math.round(size*0.06 + frac*size*0.04));
        var opacity = isPrim ? 1 : isSec ? 0.85 : Math.max(0.18, frac * 0.88);
        var nx = half + outerR * Math.cos(COMPASS_ANGLES[i]);
        var ny = half + outerR * Math.sin(COMPASS_ANGLES[i]);
        return (
          <g key={name} opacity={opacity} filter={isPrim || isSec ? "url(#cc-glow-"+name+"-"+size+")" : undefined}>
            <image href={ci.img}
              x={nx - iconSz/2} y={ny - iconSz/2}
              width={iconSz} height={iconSz}
              style={{ imageRendering:"pixelated" }}/>
          </g>
        );
      })}

      {/* Centre dot */}
      <circle cx={half} cy={half} r={size*0.022} fill={priColor} opacity="0.65"/>
    </svg>
  );
}

// ── Crest-based tamer titles ──────────────────────────────────────────────────
var CREST_TITLES = {
  Courage:"Brave Tamer", Knowledge:"Scholar Tamer", Reliability:"Steadfast Tamer",
  Care:"Healer Tamer", Friendship:"Bonded Tamer", Sincerity:"Sincere Tamer",
  Hope:"Dreamer Tamer", Light:"Radiant Tamer",
};

// ── Jijimon dialogue ──────────────────────────────────────────────────────────
var JIJIMON_LINES = {
  crest_intro:   "Crests reveal your natural path, but the bond between tamer and partner can still shape destiny.",
  evo_ready:     "Your partner grows stronger with every completed task. A new form is within reach — the path is clear.",
  partner_vow:   "Your natural alignment suggests one path, but you can still guide your partner toward another. That is the power of the tamer bond.",
  first_feed:    "Feed your partner. Fuel your battles. A well-rested companion fights with heart.",
  shop_tips:     "Earned every crest through tasks? Wonderful. Missing one due to life? The shop helps you catch up without compromising your identity.",
  stamina_low:   "Your partner needs fuel before heading into battle. Time for a meal, tamer!",
  neglect_warn:  "Your partner has grown quiet. But it is never too late to rebuild what was lost.",
};

// ── Catch-up prompt lines (Jijimon speaks on return after missed tasks) ──────
var CATCHUP_LINES = [
  "Hey, tamer... I noticed some quests went unlogged yesterday. No judgment — life gets in the way. If you got them done when I wasn't watching, say the word. Those rewards are still yours.",
  "Before we dive into today — yesterday left a few loose threads. Did any of those tasks actually happen? Claim what you earned. It counts.",
  "Ahem! A tamer's work doesn't vanish just because the clock moved on. Some quests from yesterday went unrecorded. Did you complete any of them? Let's settle the books.",
  "You're back. Good. I kept a list of what was unfinished yesterday. If the work got done — even quietly, even imperfectly — the rewards are waiting for you. No guilt. Just claim them.",
];

// ── Neglect reconnect messages (personality × severity) ───────────────────────
var RECONNECT_MSG = {
  durable: {
    dormant:  function(n,d){ return n+" endured "+d+" days alone. Worn but standing. Welcome back, Tamer — let's rebuild this."; },
    unstable: function(n,d){ return n+" held on for "+d+" days. Something shifted inside, but the connection isn't gone yet. Don't let it slip further."; },
    critical: function(n,d){ return n+" waited "+d+" days in the dark. The bond has grown cold — a corrupted path is forming. You can still turn this around."; },
  },
  lively: {
    dormant:  function(n,d){ return d+" days?! "+n+" was SO bored! But hey — you're back! Let's GO! 💥"; },
    unstable: function(n,d){ return n+" has been alone for "+d+" days and things got... weird. Complete a few tasks and we'll snap out of it!"; },
    critical: function(n,d){ return d+" days is a LONG time. "+n+" changed while you were gone. There's a dark energy building. Let's beat it back together!"; },
  },
  fighter: {
    dormant:  function(n,d){ return d+" days without a fight. "+n+" kept training alone. Now that you're back — let's finish what we started."; },
    unstable: function(n,d){ return n+" fought off "+d+" days of doubt. There's a darker edge now. Channel it — don't lose it."; },
    critical: function(n,d){ return d+" days. "+n+" almost broke. The darkness is close. Fight it — or embrace a different kind of strength."; },
  },
  defender: {
    dormant:  function(n,d){ return n+" kept watch for "+d+" days. Everything is still here. Ready when you are, Tamer."; },
    unstable: function(n,d){ return d+" days of waiting. "+n+"'s guard is still up — but the cracks are showing. Let's patch them together."; },
    critical: function(n,d){ return n+" guarded this bond alone for "+d+" days. The walls are crumbling. A shadow has settled in. Together, we rebuild."; },
  },
  brainy: {
    dormant:  function(n,d){ return n+" computed the probability of your return for "+d+" days. Glad to report — you made it. Let's recalibrate."; },
    unstable: function(n,d){ return d+" days of solitary processing. "+n+"'s patterns shifted into unusual states. Reconnect before further drift."; },
    critical: function(n,d){ return d+" days produced unexpected emergent behavior in "+n+". A corruption branch formed. Intervention is available."; },
  },
  nimble: {
    dormant:  function(n,d){ return n+" kept moving for "+d+" days — but it wasn't the same without you! Back in action now! ✨"; },
    unstable: function(n,d){ return d+" days and "+n+" started running in circles. Something strange stirred. Let's find our rhythm again!"; },
    critical: function(n,d){ return d+" days... "+n+" moved through the dark alone. A shadow kept pace. You can outrun it — if we start now."; },
  },
};

// ── Battle helper functions (pure, module-scope) ───────────────────────────────
var MG_SYMBOLS = ["★","◈","▲","◆","⚡","◉"];

function buildMinigame(type) {
  if (type === "digicode") {
    var tiles = [0,1,2,3].map(function(i){ return MG_SYMBOLS[i]; });
    var answer = Math.floor(Math.random() * 4);
    return { type:"digicode", tiles:tiles, answer:answer, phase:"reveal" };
  }
  if (type === "timing") {
    return { type:"timing", phase:"input", startedAt:Date.now(), zoneStart:32, zoneEnd:68, answer:"zone" };
  }
  // guard
  var dirs = ["↑","↓","←","→"];
  var answer = Math.floor(Math.random() * 4);
  return { type:"guard", dirs:dirs, answer:answer, phase:"reveal" };
}

function resolveRoundLogic(bs, mgResult) {
  bs = JSON.parse(JSON.stringify(bs));
  var alivePlayers = bs.playerTeam.filter(function(p){ return p.currentHp > 0; });
  var aliveEnemies = bs.enemyTeam.filter(function(e){ return e.currentHp > 0; });
  if (!alivePlayers.length || !aliveEnemies.length) return bs;

  var attacker = alivePlayers[0];
  var as = calcBattleStats(attacker);
  var focusBonus = mgResult === "focus_success";
  var momentumBonus = mgResult === "momentum_success";
  var guardBlock = mgResult === "guard_success";

  // Pick target — first alive enemy
  var defender = aliveEnemies[0];

  // Player attacks
  var r1 = calcBattleDamage(attacker, defender, { focusBonus:focusBonus });
  defender.currentHp = Math.max(0, defender.currentHp - r1.damage);
  bs.log = [attacker.name+" → "+defender.name+"  −"+r1.damage+(r1.crit?" CRIT!":"")].concat(bs.log).slice(0,8);

  // Momentum double-strike
  var momentumChance = Math.min(0.35, as.Momentum / 200);
  if (momentumBonus || Math.random() < momentumChance) {
    aliveEnemies = bs.enemyTeam.filter(function(e){ return e.currentHp > 0; });
    if (aliveEnemies.length > 0) {
      var r2 = calcBattleDamage(attacker, aliveEnemies[0], {});
      aliveEnemies[0].currentHp = Math.max(0, aliveEnemies[0].currentHp - r2.damage);
      bs.log = ["⚡ Double strike! −"+r2.damage].concat(bs.log).slice(0,8);
    }
  }

  // Passive: Smolder burn DoT
  var attInfo = DIGIMON_MAP[attacker.speciesId];
  if (attInfo && attInfo.passive && attInfo.passive.toLowerCase().includes("smolder")) {
    bs.burnDot = bs.burnDot || {};
    var burnKey = defender.uid || defender.speciesId;
    bs.burnDot[burnKey] = { rounds:3, dmg:Math.max(1, Math.floor(as.Power * 0.12)) };
    bs.log = ["🔥 "+defender.name+" ignited!"].concat(bs.log).slice(0,8);
  }

  // Apply active burn ticks
  if (bs.burnDot) {
    bs.enemyTeam.forEach(function(e) {
      var key = e.uid || e.speciesId;
      if (bs.burnDot[key] && e.currentHp > 0) {
        e.currentHp = Math.max(0, e.currentHp - bs.burnDot[key].dmg);
        bs.log = ["🔥 "+e.name+" −"+bs.burnDot[key].dmg+" (burn)"].concat(bs.log).slice(0,8);
        bs.burnDot[key].rounds--;
        if (bs.burnDot[key].rounds <= 0) delete bs.burnDot[key];
      }
    });
  }

  // Enemy counter-attack
  aliveEnemies = bs.enemyTeam.filter(function(e){ return e.currentHp > 0; });
  if (aliveEnemies.length > 0) {
    var en = aliveEnemies[0];
    var tgt = bs.playerTeam.filter(function(p){ return p.currentHp > 0; })[0];
    if (tgt) {
      var er = calcBattleDamage(en, tgt, {});
      var finalDmg = guardBlock ? Math.max(1, Math.floor(er.damage * 0.18)) : er.damage;
      tgt.currentHp = Math.max(0, tgt.currentHp - finalDmg);
      bs.log = [en.name+" → "+tgt.name+"  −"+finalDmg+(guardBlock?" (BLOCKED!)":"")].concat(bs.log).slice(0,8);
    }
  }

  // Signature skill fires once when attacker HP < 50%
  if (!bs.sigFired && attacker.currentHp < attacker.maxHp * 0.5 && attInfo && attInfo.signature) {
    bs.sigFired = true;
    var sigDmg = Math.floor(as.Power * 2.2);
    var sigTarget = bs.enemyTeam.filter(function(e){ return e.currentHp > 0; })[0];
    if (sigTarget) {
      sigTarget.currentHp = Math.max(0, sigTarget.currentHp - sigDmg);
      bs.log = ["💫 "+attacker.name+" uses "+attInfo.signature.split("—")[0].trim()+"! −"+sigDmg].concat(bs.log).slice(0,8);
    }
  }

  // Check end condition
  var won  = bs.enemyTeam.every(function(e){ return e.currentHp <= 0; });
  var lost = bs.playerTeam.every(function(p){ return p.currentHp <= 0; });
  if (won || lost) {
    var rw = BATTLE_REWARDS[bs.difficulty] || { win:60, loss:25 };
    bs._earn = won ? rw.win : rw.loss;
    bs.log = [(won?"⚔ Victory! ":"💀 Defeated... ")+"+" + bs._earn+"🪙"].concat(bs.log).slice(0,8);
    bs.phase = won ? "won" : "lost";
  }

  return bs;
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App({ session }) {
  var [page,             setPage]             = useState("dashboard");
  var [party,            setParty]            = useState([]);
  var [farm,             setFarm]             = useState([]);
  var [bits,             setBits]             = useState(350);
  var [allDisc,          setAllDisc]          = useState([]);
  var [tasks,            setTasks]            = useState([]);
  var [allTasks,         setAllTasks]         = useState([]); // unfiltered — used by week view for recurring tasks on non-today days
  var [weeklyDigimon,    setWeeklyDigimon]    = useState({});
  var [speech,           setSpeech]           = useState("finish your tasks!");
  var [showSpeech,       setShowSpeech]       = useState(false);
  var speechDismissTimer = useRef(null);
  var [actLog,           setActLog]           = useState([{ icon:"⭐", text:"DailyDigivolve started! Welcome, Tamer.", time:"JUST NOW" }]);
  var [toast,            setToast]            = useState(null);
  var [evoAnim,          setEvoAnim]          = useState(null);
  var [battleState,      setBattleState]      = useState(null);
  var [selectedBg,       setSelectedBg]       = useState("default");
  // New systems
  // bond is per-digimon — derived from the active (party[0]) digimon's bond field
  var [stamina,          setStamina]          = useState(STAMINA_MAX);
  var [lastStaminaUpdate,setLastStaminaUpdate]= useState(null);
  var [crestHistory,     setCrestHistory]     = useState([]);
  var [foodStaminaToday, setFoodStaminaToday] = useState(0);
  var [bondActionsToday, setBondActionsToday] = useState({ date:null, tasks:0, play:0 });
  var [jijimonModal,     setJijimonModal]     = useState(null);
  var [showFeedPanel,    setShowFeedPanel]    = useState(false);
  var [jijimonSeen,      setJijimonSeen]      = useState(function(){
    try { return JSON.parse(localStorage.getItem('jijimon_seen')||'{}'); } catch { return {}; }
  });
  var [pomodoroState,    setPomodoroState]    = useState(null);
  // pomodoroState: null | { phase:'setup'|'running'|'done', timeLeft, totalSeconds, template, duration }
  var [showTamerProfile, setShowTamerProfile] = useState(false);
  var [tamerName,        setTamerName]        = useState("Tamer");
  var [editingName,      setEditingName]      = useState(false);
  var [tamerLocation,    setTamerLocation]    = useState("");
  var [editingLocation,  setEditingLocation]  = useState(false);
  var [petX,             setPetX]             = useState(0);   // horizontal offset px in pet stage
  var [petFacingRight,   setPetFacingRight]   = useState(false);
  var [digidexEntry,     setDigidexEntry]     = useState(null); // selected digimon for detail modal
  var [loginStreak,      setLoginStreak]      = useState(0);
  var [digitamaCredits,  setDigitamaCredits]  = useState(0);
  var [showDigitamaModal,setShowDigitamaModal]= useState(false);
  var [confirmReset,     setConfirmReset]     = useState(false);
  var [dedigivolveConfirm, setDedigivolveConfirm] = useState(null); // { uid, prevId } | null
  var [petSummary,        setPetSummary]        = useState(null);  // uid of digimon whose summary modal is open
  // raidState: null | { raidId, totalDamage, raidLog:[{date,damage,taskTitle,stat,phase}] }
  var [raidState,        setRaidState]        = useState(null);
  var [raidHit,          setRaidHit]          = useState(null); // { damage, stat } flashed on task complete
  // neglectData: null | { level, daysAbsent, inArc, arcTasksDone, arcGoal, sukamonRisk, sukamonAccepted }
  var [neglectData,      setNeglectData]      = useState(null);
  var [showReconnectModal, setShowReconnectModal] = useState(false);
  var [showSukamonModal,   setShowSukamonModal]   = useState(false);
  var [openGroup,          setOpenGroup]          = useState(null); // id of open nav group dropdown
  var [collapsedStages,    setCollapsedStages]    = useState({});   // stage → true when header is collapsed
  // sleepState: null | { phase:'countdown'|'sleeping', startedAt:ISO, wakeTime:"HH:MM", sleepDate:"YYYY-MM-DD" }
  var [sleepState,       setSleepState]       = useState(null);
  var [showRestModal,    setShowRestModal]    = useState(false);
  var [sleepLog,         setSleepLog]         = useState([]);
  var [wakeGreeting,     setWakeGreeting]     = useState(null); // shown once on wake
  // Onboarding — true while the first-run wizard is active
  var [showOnboarding,   setShowOnboarding]   = useState(null); // null = not yet determined
  var [appReady,         setAppReady]         = useState(false);
  // Midnight tick — updates so daily counters reset without a page reload
  var [midnightTick,     setMidnightTick]     = useState(0);
  // Catch-up modal — tasks missed yesterday
  var [showCatchupModal, setShowCatchupModal] = useState(false);
  var [catchupTasks,     setCatchupTasks]     = useState([]);
  var [catchupChecked,   setCatchupChecked]   = useState({});
  var catchupLineRef = useRef(CATCHUP_LINES[0]);
  // Mobile layout detection
  var [isMobile, setIsMobile] = useState(function(){
    // Manual override takes priority; otherwise auto-detect by viewport width
    if (localStorage.getItem('dv_force_mobile') === 'true') return true;
    return window.innerWidth <= 768;
  });
  var [mobilePopup, setMobilePopup] = useState(null);
  // Quick-add task modal (launched from dashboard)
  var [showQuickAdd,     setShowQuickAdd]     = useState(false);
  var [quickAddForm,     setQuickAddForm]     = useState({ title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:"" });
  // Adopt-egg shop flow
  var [showAdoptEgg,     setShowAdoptEgg]     = useState(false);
  var [adoptEggSel,      setAdoptEggSel]      = useState(null);   // selected ALL_EGGS entry
  var [adoptEggPhase,    setAdoptEggPhase]    = useState('select'); // 'select'|'hatching'|'hatched'
  var [adoptHatchedDigi, setAdoptHatchedDigi] = useState(null);   // hatched digimon object
  var [jijiPrompt,       setJijiPrompt]       = useState(null);   // { type:'leader'|'swap'|'swapPick', newDigi }

  // Crest materials + login rewards
  var [crestMaterials,       setCrestMaterials]       = useState({});
  var [loginDay,             setLoginDay]             = useState(0);
  var [lastLoginRewardDate,  setLastLoginRewardDate]  = useState(null);
  var [armorDigiCount,       setArmorDigiCount]       = useState(0);
  var [showLoginReward,      setShowLoginReward]      = useState(false);
  var [pendingLoginReward,   setPendingLoginReward]   = useState(null);
  var [loginRewardSel,       setLoginRewardSel]       = useState(null); // chosen crest for selector rewards
  var [showRewardCalendar,   setShowRewardCalendar]   = useState(false);
  var [calendarPage,         setCalendarPage]         = useState(0); // 0 = days 1-30, 1 = days 31-60
  // Tamer level
  var [tamerLevel,           setTamerLevel]           = useState(1);
  var [tamerXp,              setTamerXp]              = useState(0);

  var [mgActive, setMgActive] = useState(null); // active brain-game minigame state

  var dragIdx          = useRef(null);
  var navCloseTimer    = useRef(null); // delay before closing a nav dropdown on mouse-leave
  var digiMutRef       = useRef(0);   // count of in-flight digimon DB mutations
  var battleAdvTimerRef = useRef(null); // auto-advance round timeout
  var mgTimerRef       = useRef(null); // minigame auto-fail timeout
  var userId  = session.user.id;

  // Posts a message to the SW if it's active — used to schedule/cancel background notifications
  function postToSW(msg) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
    }
  }

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(function() {
    async function load() {
      // Version check — forces PWA to reload fresh code when the app is updated
      var DV_VER = '10';
      var stored = localStorage.getItem('dv_ver');
      localStorage.setItem('dv_ver', DV_VER);
      if (stored && stored !== DV_VER) { window.location.reload(); return; }

      var today = new Date().toISOString().split('T')[0];
      var [{ data:profile }, { data:digimonData }, { data:tasksData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('digimon').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
      ]);

      if (profile) {
        setBits(profile.bits || 350);
        setTamerName(profile.display_name || "Tamer");
        setTamerLocation(profile.location || "");
        setSelectedBg(profile.background_id || "default");
        setWeeklyDigimon(profile.weekly_digimon || {});

        // Stamina with regen
        var lastUpd = profile.last_stamina_update || new Date().toISOString();
        var curStam = calcCurrentStamina(profile.stamina ?? STAMINA_MAX, lastUpd);
        setStamina(curStam);
        setLastStaminaUpdate(lastUpd);
        setCrestHistory(profile.crest_history || []);

        // Daily reset
        var lastReset = profile.last_day_reset || today;
        if (lastReset !== today) {
          setFoodStaminaToday(0);
          setBondActionsToday({ date:today, tasks:0, play:0 });
          // Save reset to DB
          await supabase.from('profiles').update({
            food_stamina_today: 0,
            bond_actions_today: { date:today, tasks:0, play:0 },
            last_day_reset: today,
            stamina: curStam,
            last_stamina_update: new Date().toISOString(),
          }).eq('id', userId);
        } else {
          setFoodStaminaToday(profile.food_stamina_today || 0);
          var bad = profile.bond_actions_today || {};
          setBondActionsToday(bad.date === today ? bad : { date:today, tasks:0, play:0 });
          // Save regen'd stamina back
          if (curStam !== (profile.stamina ?? STAMINA_MAX)) {
            await supabase.from('profiles').update({
              stamina: curStam, last_stamina_update: new Date().toISOString(),
            }).eq('id', userId);
          }
        }

        // Login streak + bond
        var lastLogin  = profile.last_login_date || today;
        var curStreak  = profile.login_streak    || 0;
        var curCreds   = profile.digitama_credits || 0;

        // ── Neglect detection (read BEFORE lastLogin updates to today) ────────
        var daysSinceLogin = Math.max(0, Math.floor((new Date(today) - new Date(lastLogin)) / 86400000));
        var storedNeglect  = profile.neglect_state || null;
        if (daysSinceLogin >= 3 || (storedNeglect && storedNeglect.inArc)) {
          var neglLevel = daysSinceLogin >= 14 ? "critical"
                        : daysSinceLogin >= 7  ? "unstable"
                        : daysSinceLogin >= 3  ? "dormant"
                        : "quiet";
          var isReturn  = daysSinceLogin >= 7 && lastLogin !== today;
          var wasInArc  = storedNeglect && storedNeglect.inArc;
          // Determine neglect path from behavioral fingerprint
          var neglCrestProfile = calcCrestProfile(profile.crest_history || []);
          var neglPath = storedNeglect && storedNeglect.neglectPath
            ? storedNeglect.neglectPath                           // keep path once set
            : calcNeglectPath(neglCrestProfile, profile.bond || 0);
          var nd = {
            level:            neglLevel,
            daysAbsent:       daysSinceLogin > 0 ? daysSinceLogin : (storedNeglect ? storedNeglect.daysAbsent : 0),
            inArc:            isReturn || wasInArc,
            arcStart:         wasInArc ? storedNeglect.arcStart : (isReturn ? today : null),
            arcTasksDone:     wasInArc ? (storedNeglect.arcTasksDone || 0) : 0,
            arcGoal:          3,
            neglectPath:      neglPath,
            sukamonRisk:      (daysSinceLogin >= 14 || (storedNeglect && storedNeglect.sukamonRisk)) && (profile.bond || 0) < 40,
            sukamonOffered:   storedNeglect ? (storedNeglect.sukamonOffered || false) : false,
            sukamonAccepted:  storedNeglect ? (storedNeglect.sukamonAccepted || false) : false,
          };
          setNeglectData(nd);
          // Show reconnect modal on first return from 7+ days (not if already in arc)
          if (isReturn && !wasInArc) setShowReconnectModal(true);
          // Show Sukamon modal after reconnect if risk and not yet offered
          if (nd.sukamonRisk && !nd.sukamonOffered && !isReturn) setShowSukamonModal(true);
          // Neglect speech
          var nsp = NEGLECT_SPEECH[neglLevel] || NEGLECT_SPEECH.quiet;
          // Neglect speech always surfaces — partner has something to say on return
          showSpeechBubble(nsp[Math.floor(Math.random() * nsp.length)]);
          await supabase.from('profiles').update({ neglect_state: nd }).eq('id', userId);
        } else if (storedNeglect && !storedNeglect.inArc) {
          // Previously neglected but arc done — clear
          await supabase.from('profiles').update({ neglect_state: null }).eq('id', userId);
        }
        // ─────────────────────────────────────────────────────────────────────

        if (lastLogin !== today) {
          var yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          var prevMilestone = Math.floor(curStreak / 30);
          curStreak = (lastLogin === yest) ? curStreak + 1 : 1;
          var earned = Math.floor(curStreak / 30) - prevMilestone;
          if (earned > 0) { curCreds += earned; setShowDigitamaModal(true); }
          // Login +2 bond goes to the active digimon (party[0] by sort_order), not the profile
          var activeRaw = digimonData && digimonData.filter(function(d){ return !d.in_farm; })[0];
          if (activeRaw) {
            var loginBond = clampBond((activeRaw.bond || 0) + 2);
            await supabase.from('digimon').update({ bond: loginBond }).eq('id', activeRaw.id);
            await supabase.from('profiles').update({ bond: loginBond }).eq('id', userId); // leaderboard snapshot
          }
          await supabase.from('profiles').update({
            last_login_date: today, login_streak: curStreak,
            digitama_credits: curCreds,
          }).eq('id', userId);
        }
        setLoginStreak(curStreak);
        setDigitamaCredits(curCreds);

        // Raid state — reset if raidId doesn't match current event
        var rs = profile.raid_state || null;
        if (rs && rs.raidId !== CURRENT_RAID.id) rs = null;
        setRaidState(rs || { raidId: CURRENT_RAID.id, totalDamage: 0, raidLog: [] });

        // Sleep state
        setSleepLog(profile.sleep_log || []);
        var ss = profile.sleep_state || null;
        // If app was killed during the 2-min countdown, promote to sleeping on restore
        if (ss && ss.phase === 'countdown') {
          var countdownElapsed = Date.now() - new Date(ss.startedAt).getTime();
          if (countdownElapsed >= 2 * 60 * 1000) {
            ss = Object.assign({}, ss, { phase: 'sleeping' });
            await supabase.from('profiles').update({ sleep_state: ss }).eq('id', userId);
          } else {
            setSleepState(ss);
            var countdownLeft = 2 * 60 * 1000 - countdownElapsed;
            setTimeout(async function() {
              var sleeping = Object.assign({}, ss, { phase: 'sleeping' });
              setSleepState(sleeping);
              await supabase.from('profiles').update({ sleep_state: sleeping }).eq('id', userId);
            }, countdownLeft);
          }
        }
        if (ss && ss.phase === 'sleeping') {
          var now = new Date();
          var [wh, wm] = (ss.wakeTime || "07:00").split(':').map(Number);
          var wakeDateTime = new Date(now); wakeDateTime.setHours(wh, wm, 0, 0);
          // Anchor wake time to after bedtime — alarm for "07:00" set at 11 PM is next-day
          if (wakeDateTime.getTime() <= new Date(ss.startedAt).getTime()) {
            wakeDateTime.setDate(wakeDateTime.getDate() + 1);
          }
          if (now >= wakeDateTime) {
            handleWakeUp(ss, profile.sleep_log || [], false);
          } else {
            setSleepState(ss);
          }
        }

        // Restore pomodoro state — handles app killed mid-session or cross-device sync
        var ps = profile.pomodoro_state || null;
        if (ps && ps.phase === 'running') {
          var pomoRemaining = Math.max(0, Math.floor((ps.endTime - Date.now()) / 1000));
          if (pomoRemaining <= 0) {
            // Timer expired while app was closed — mark done and notify
            setPomodoroState(Object.assign({}, ps, { phase:'done', timeLeft:0 }));
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('Session Complete! 🎉', {
                body: (ps.template || 'Focus') + ' session done — claim your reward!',
                icon: '/icon-192.png',
              });
            }
          } else {
            setPomodoroState(Object.assign({}, ps, { timeLeft: pomoRemaining }));
          }
        }

        // Crest materials + login rewards
        setCrestMaterials(profile.crest_materials || {});
        setArmorDigiCount(profile.armor_digi_count || 0);
        setTamerLevel(profile.tamer_level || 1);
        setTamerXp(profile.tamer_xp || 0);
        var storedLoginDay = profile.login_day || 0;
        var storedRewardDate = profile.last_login_reward_date || null;
        setLoginDay(storedLoginDay);
        setLastLoginRewardDate(storedRewardDate);
        // Check if a login reward is available (past 5am, new calendar day, days remaining)
        var nowLR = new Date();
        var todayLR = nowLR.getFullYear()+'-'+String(nowLR.getMonth()+1).padStart(2,'0')+'-'+String(nowLR.getDate()).padStart(2,'0');
        if (nowLR.getHours() >= 5 && storedRewardDate !== todayLR && storedLoginDay < 60) {
          setPendingLoginReward(LOGIN_REWARDS[storedLoginDay]); // 0-indexed, storedLoginDay is current day count
          setShowLoginReward(true);
        }
      }

      if (digimonData && digimonData.length > 0) {
        var mapped = digimonData.map(function(d) { return {
          uid: d.id, speciesId: d.species_id, name: d.name, level: d.level,
          exp: d.exp, expNeeded: d.exp_needed, abi: d.abi || 0,
          personality: d.personality, bonusStats: d.bonus_stats || {},
          discovered: d.discovered || [], inFarm: d.in_farm, isXForm: d.is_x_form,
          bond: d.bond || 0, crestStages: d.crest_stages || {},
        }; });
        var partyRows = mapped.filter(function(d){ return !d.inFarm; });
        var farmRows  = mapped.filter(function(d){ return d.inFarm; });
        // Self-heal: corrupt in_farm=false rows can inflate party past cap
        if (partyRows.length > MAX_PARTY_SIZE) {
          var overflow = partyRows.slice(MAX_PARTY_SIZE);
          partyRows = partyRows.slice(0, MAX_PARTY_SIZE);
          farmRows = farmRows.concat(overflow.map(function(d){ return Object.assign({}, d, { inFarm:true }); }));
          await Promise.all(overflow.map(function(d){ return supabase.from('digimon').update({ in_farm:true }).eq('id', d.uid); }));
        }
        setParty(partyRows);
        setFarm(farmRows);
        var allD = [...new Set(digimonData.flatMap(function(d){ return d.discovered || []; }))];
        setAllDisc(allD);
      } else {
        // No Digimon found — show onboarding if this user hasn't completed it yet
        var onboardKey = 'dv_onboarding_' + userId;
        if (!localStorage.getItem(onboardKey)) {
          setShowOnboarding(true);
          setAppReady(true);
          return; // skip loading tasks/profile further — onboarding handles first starter
        }
        // Onboarding was completed but starter is missing (edge case) — create a botamon
        var starter = newDigimon('botamon', {});
        var { data:newDigi } = await supabase.from('digimon').insert({
          user_id: userId, species_id: starter.speciesId, name: starter.name,
          level: 1, exp: 0, exp_needed: 100, abi: 0, personality: starter.personality,
          bonus_stats: {}, discovered: ['botamon'], in_farm: false, sort_order: 0,
        }).select().single();
        if (newDigi) setParty([Object.assign({}, starter, { uid:newDigi.id })]);
      }

      if (tasksData) {
        var todayDay  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
        var _ld = new Date(); var todayDate = _ld.getFullYear()+'-'+String(_ld.getMonth()+1).padStart(2,'0')+'-'+String(_ld.getDate()).padStart(2,'0');
        function mapTask(t) {
          var stale = (t.type === 'daily' || t.type === 'recurring')
            && t.done && t.last_completed_date !== todayDate;
          return {
            id: t.id, title: t.title,
            template: t.category || 'Neutral',
            priority: t.priority, difficulty: t.difficulty, type: t.type,
            notes: t.notes || '', done: stale ? false : (t.done || false),
            streak: t.streak || 0,
            lastCompletedDate: t.last_completed_date || null,
            daysOfWeek: t.days_of_week || [], dueDate: t.due_date || null,
          };
        }
        setTasks(tasksData.filter(function(t) {
          if (t.type !== 'recurring') return true;
          if (!t.days_of_week || !t.days_of_week.length) return true;
          return t.days_of_week.includes(todayDay);
        }).map(mapTask));
        setAllTasks(tasksData.map(mapTask)); // full list for week view
      }
      // ── Carryover tasks prompt (past 5am local time, once per day) ───────────
      if (tasksData) {
        var nowLocal   = new Date();
        var localHour  = nowLocal.getHours();
        // Local date strings — consistent with how task last_completed_date is stored
        var todayLocalStr = nowLocal.getFullYear()+'-'+String(nowLocal.getMonth()+1).padStart(2,'0')+'-'+String(nowLocal.getDate()).padStart(2,'0');
        var _ydCup = new Date(nowLocal); _ydCup.setDate(_ydCup.getDate()-1);
        var yestLocalStr  = _ydCup.getFullYear()+'-'+String(_ydCup.getMonth()+1).padStart(2,'0')+'-'+String(_ydCup.getDate()).padStart(2,'0');
        var yestDay    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][_ydCup.getDay()];
        var catchupKey = 'dv_catchup_' + userId;
        // Check both localStorage (fast, device-local) AND Supabase profile (cross-device)
        var lastCatchupLocal = localStorage.getItem(catchupKey);
        var lastCatchupServer = profile ? (profile.catchup_last_seen || null) : null;
        var alreadySeenToday = (lastCatchupLocal === todayLocalStr) || (lastCatchupServer === todayLocalStr);

        if (localHour >= 5 && !alreadySeenToday) {
          var missedRaw = tasksData.filter(function(t) {
            if (t.type === 'daily') return t.last_completed_date !== yestLocalStr;
            if (t.type === 'recurring') {
              var days = t.days_of_week || [];
              return days.includes(yestDay) && t.last_completed_date !== yestLocalStr;
            }
            if (t.type === 'once') return t.due_date === yestLocalStr && !t.done;
            return false;
          });
          if (missedRaw.length > 0) {
            setCatchupTasks(missedRaw.map(function(t) {
              return {
                id: t.id, title: t.title, template: t.category || 'Neutral',
                priority: t.priority, difficulty: t.difficulty, type: t.type,
                streak: t.streak || 0, dueDate: t.due_date || null,
                lastCompletedDate: t.last_completed_date || null,
              };
            }));
            catchupLineRef.current = CATCHUP_LINES[Math.floor(Math.random() * CATCHUP_LINES.length)];
            setCatchupChecked({});
            setShowCatchupModal(true);
            // Mark seen for today in both localStorage and Supabase — skipping won't re-show it
            localStorage.setItem(catchupKey, todayLocalStr);
            supabase.from('profiles').update({ catchup_last_seen: todayLocalStr }).eq('id', userId);
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      setShowOnboarding(false);
      setAppReady(true);
    }
    load();
  }, [userId]);

  // ── Live sync — refresh display state from DB without re-running init logic ──
  async function refreshData() {
    if (!userId) return;
    var today = new Date().toISOString().split('T')[0]; // UTC — used for profile-level date comparisons (bond_actions_today, etc.)
    var _rld = new Date(); var todayLocal = _rld.getFullYear()+'-'+String(_rld.getMonth()+1).padStart(2,'0')+'-'+String(_rld.getDate()).padStart(2,'0');
    var [{ data:profile }, { data:digimonData }, { data:tasksData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('digimon').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    ]);
    if (profile) {
      setBits(profile.bits || 350);
      if (profile.display_name) setTamerName(profile.display_name);
      if (profile.location !== undefined) setTamerLocation(profile.location || "");
      setSelectedBg(profile.background_id || "default");
      setCrestHistory(profile.crest_history || []);
      setCrestMaterials(profile.crest_materials || {});
      setLoginDay(profile.login_day || 0);
      setLastLoginRewardDate(profile.last_login_reward_date || null);
      setArmorDigiCount(profile.armor_digi_count || 0);
      setTamerLevel(profile.tamer_level || 1);
      setTamerXp(profile.tamer_xp || 0);
      setWeeklyDigimon(profile.weekly_digimon || {});
      setLoginStreak(profile.login_streak || 0);
      setDigitamaCredits(profile.digitama_credits || 0);
      var lastUpd = profile.last_stamina_update || new Date().toISOString();
      setStamina(calcCurrentStamina(profile.stamina ?? STAMINA_MAX, lastUpd));
      setLastStaminaUpdate(lastUpd);
      setFoodStaminaToday(profile.food_stamina_today || 0);
      var bad = profile.bond_actions_today || {};
      setBondActionsToday(bad.date === today ? bad : { date:today, tasks:0, play:0 });
      var rs = profile.raid_state || null;
      if (rs && rs.raidId !== CURRENT_RAID.id) rs = null;
      setRaidState(rs || { raidId: CURRENT_RAID.id, totalDamage: 0, raidLog: [] });
      setSleepLog(profile.sleep_log || []);
      // Check if sleep alarm fired while app was backgrounded (interval was killed)
      var ss3 = profile.sleep_state || null;
      if (ss3 && ss3.phase === 'sleeping') {
        var now3 = new Date();
        var [wh3, wm3] = (ss3.wakeTime || "07:00").split(':').map(Number);
        var wakeDT3 = new Date(now3); wakeDT3.setHours(wh3, wm3, 0, 0);
        if (wakeDT3.getTime() <= new Date(ss3.startedAt).getTime()) wakeDT3.setDate(wakeDT3.getDate() + 1);
        if (now3 >= wakeDT3) {
          handleWakeUp(ss3, profile.sleep_log || [], false);
        } else {
          setSleepState(ss3);
        }
      }
    }
    if (digimonData && digimonData.length > 0) {
      var mapped = digimonData.map(function(d) { return {
        uid: d.id, speciesId: d.species_id, name: d.name, level: d.level,
        exp: d.exp, expNeeded: d.exp_needed, abi: d.abi || 0,
        personality: d.personality, bonusStats: d.bonus_stats || {},
        discovered: d.discovered || [], inFarm: d.in_farm, isXForm: d.is_x_form,
        bond: d.bond || 0, crestStages: d.crest_stages || {},
      }; });
      var partyRows2 = mapped.filter(function(d){ return !d.inFarm; });
      var farmRows2  = mapped.filter(function(d){ return d.inFarm; });
      if (partyRows2.length > MAX_PARTY_SIZE) {
        var overflow2 = partyRows2.slice(MAX_PARTY_SIZE);
        partyRows2 = partyRows2.slice(0, MAX_PARTY_SIZE);
        farmRows2 = farmRows2.concat(overflow2.map(function(d){ return Object.assign({}, d, { inFarm:true }); }));
        await Promise.all(overflow2.map(function(d){ return supabase.from('digimon').update({ in_farm:true }).eq('id', d.uid); }));
      }
      if (digiMutRef.current === 0) {
        setParty(partyRows2);
        setFarm(farmRows2);
      }
      var allD = [...new Set(digimonData.flatMap(function(d){ return d.discovered || []; }))];
      setAllDisc(allD);
    }
    if (tasksData) {
      var todayDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
      setTasks(tasksData.filter(function(t) {
        if (t.type !== 'recurring') return true;
        if (!t.days_of_week || !t.days_of_week.length) return true;
        return t.days_of_week.includes(todayDay);
      }).map(function(t) {
        var stale = (t.type === 'daily' || t.type === 'recurring')
          && t.done && t.last_completed_date !== todayLocal;
        return {
          id: t.id, title: t.title, template: t.category || 'Neutral',
          priority: t.priority, difficulty: t.difficulty, type: t.type,
          notes: t.notes || '', done: stale ? false : (t.done || false),
          streak: t.streak || 0, lastCompletedDate: t.last_completed_date || null,
          daysOfWeek: t.days_of_week || [], dueDate: t.due_date || null,
        };
      }));
      setAllTasks(tasksData.map(function(t) {
        var stale = (t.type === 'daily' || t.type === 'recurring')
          && t.done && t.last_completed_date !== todayLocal;
        return {
          id: t.id, title: t.title, template: t.category || 'Neutral',
          priority: t.priority, difficulty: t.difficulty, type: t.type,
          notes: t.notes || '', done: stale ? false : (t.done || false),
          streak: t.streak || 0, lastCompletedDate: t.last_completed_date || null,
          daysOfWeek: t.days_of_week || [], dueDate: t.due_date || null,
        };
      }));
    }
  }

  // Refresh when tab regains visibility (e.g. switching back from mobile browser)
  useEffect(function() {
    function onVisible() { if (document.visibilityState === 'visible') refreshData(); }
    document.addEventListener('visibilitychange', onVisible);
    return function() { document.removeEventListener('visibilitychange', onVisible); };
  }, [userId]);

  // ── Supabase Realtime — surgical payload handlers (no extra DB queries) ────────
  // Applies only the changed row directly from the event payload so there's no
  // race condition between local optimistic state and concurrent refreshData calls.

  function applyProfilePayload(payload) {
    var p = payload.new;
    if (!p) return;
    var today = new Date().toISOString().split('T')[0];
    setBits(p.bits ?? 350);
    if (p.display_name) setTamerName(p.display_name);
    setSelectedBg(p.background_id || "default");
    setCrestHistory(p.crest_history || []);
    if (p.tamer_level != null) setTamerLevel(p.tamer_level);
    if (p.tamer_xp    != null) setTamerXp(p.tamer_xp);
    setWeeklyDigimon(p.weekly_digimon || {});
    setLoginStreak(p.login_streak || 0);
    setDigitamaCredits(p.digitama_credits || 0);
    var lastUpd = p.last_stamina_update || new Date().toISOString();
    setStamina(calcCurrentStamina(p.stamina ?? STAMINA_MAX, lastUpd));
    setLastStaminaUpdate(lastUpd);
    setFoodStaminaToday(p.food_stamina_today || 0);
    var bad = p.bond_actions_today || {};
    setBondActionsToday(bad.date === today ? bad : { date:today, tasks:0, play:0 });
    var rs = p.raid_state || null;
    if (rs && rs.raidId !== CURRENT_RAID.id) rs = null;
    setRaidState(rs || { raidId: CURRENT_RAID.id, totalDamage: 0, raidLog: [] });
    setSleepLog(p.sleep_log || []);
    // Cross-device pomodoro sync — another tab/device started or claimed a session
    var ps2 = p.pomodoro_state || null;
    if (ps2 && ps2.phase === 'running') {
      var rem2 = Math.max(0, Math.floor((ps2.endTime - Date.now()) / 1000));
      setPomodoroState(function(cur) {
        // Don't overwrite if this is the same session (same endTime within 5s)
        if (cur && cur.phase === 'running' && Math.abs((cur.endTime||0) - ps2.endTime) < 5000) return cur;
        if (rem2 <= 0) return Object.assign({}, ps2, { phase:'done', timeLeft:0 });
        return Object.assign({}, ps2, { timeLeft: rem2 });
      });
    } else if (!ps2) {
      // Reward was claimed on another device — clear done state here too
      setPomodoroState(function(cur) { return (cur && cur.phase === 'done') ? null : cur; });
    }
  }

  function applyTaskPayload(payload) {
    var _atd = new Date(); var today = _atd.getFullYear()+'-'+String(_atd.getMonth()+1).padStart(2,'0')+'-'+String(_atd.getDate()).padStart(2,'0');
    var todayDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
    if (payload.eventType === 'DELETE') {
      var oldId = payload.old && payload.old.id;
      if (oldId) {
        setTasks(function(ts) { return ts.filter(function(t) { return t.id !== oldId; }); });
        setAllTasks(function(ts) { return ts.filter(function(t) { return t.id !== oldId; }); });
      }
      return;
    }
    var t = payload.new;
    if (!t) return;
    var stale = (t.type === 'daily' || t.type === 'recurring') && t.done && t.last_completed_date !== today;
    var mapped = {
      id: t.id, title: t.title, template: t.category || 'Neutral',
      priority: t.priority, difficulty: t.difficulty, type: t.type,
      notes: t.notes || '', done: stale ? false : (t.done || false),
      streak: t.streak || 0, lastCompletedDate: t.last_completed_date || null,
      daysOfWeek: t.days_of_week || [], dueDate: t.due_date || null,
    };
    // allTasks always gets the update (no day filter)
    setAllTasks(function(ts) {
      var idx = ts.findIndex(function(x) { return x.id === mapped.id; });
      if (idx >= 0) return ts.map(function(task) { return task.id === mapped.id ? mapped : task; });
      return ts.concat([mapped]);
    });
    // tasks filtered to today's recurring only
    if (t.type === 'recurring' && t.days_of_week && t.days_of_week.length && !t.days_of_week.includes(todayDay)) {
      setTasks(function(ts) { return ts.filter(function(task) { return task.id !== t.id; }); });
      return;
    }
    setTasks(function(ts) {
      var idx = ts.findIndex(function(x) { return x.id === mapped.id; });
      if (idx >= 0) return ts.map(function(task) { return task.id === mapped.id ? mapped : task; });
      return ts.concat([mapped]);
    });
  }

  function applyDigimonPayload(payload) {
    if (payload.eventType === 'UPDATE' && digiMutRef.current > 0) return;
    if (payload.eventType === 'DELETE') {
      var oldId = payload.old && payload.old.id;
      if (!oldId) return;
      setParty(function(p) { return p.filter(function(d) { return d.uid !== oldId; }); });
      setFarm(function(f) { return f.filter(function(d) { return d.uid !== oldId; }); });
      return;
    }
    var d = payload.new;
    if (!d) return;
    var mapped = {
      uid: d.id, speciesId: d.species_id, name: d.name, level: d.level,
      exp: d.exp, expNeeded: d.exp_needed, abi: d.abi || 0,
      personality: d.personality, bonusStats: d.bonus_stats || {},
      discovered: d.discovered || [], inFarm: d.in_farm, isXForm: d.is_x_form,
      bond: d.bond || 0, crestStages: d.crest_stages || {},
    };
    if (d.in_farm) {
      setParty(function(p) { return p.filter(function(x) { return x.uid !== mapped.uid; }); });
      setFarm(function(f) {
        var idx = f.findIndex(function(x) { return x.uid === mapped.uid; });
        return idx >= 0 ? f.map(function(x) { return x.uid === mapped.uid ? mapped : x; }) : f.concat([mapped]);
      });
    } else {
      setFarm(function(f) { return f.filter(function(x) { return x.uid !== mapped.uid; }); });
      setParty(function(p) {
        var idx = p.findIndex(function(x) { return x.uid === mapped.uid; });
        if (idx >= 0) return p.map(function(x) { return x.uid === mapped.uid ? mapped : x; });
        // Only accept INSERTs from sources we trust (evolve/adopt updates an existing row)
        if (payload.eventType === 'INSERT' && p.length >= MAX_PARTY_SIZE) return p;
        if (payload.eventType === 'INSERT') return p.concat([mapped]);
        return p; // UPDATE for unknown uid — ignore
      });
    }
    if (d.discovered && d.discovered.length) {
      setAllDisc(function(prev) { return [...new Set(prev.concat(d.discovered))]; });
    }
  }

  useEffect(function() {
    if (!userId) return;
    var channel = supabase.channel('user-sync-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles',
          filter: 'id=eq.' + userId }, applyProfilePayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks',
          filter: 'user_id=eq.' + userId }, applyTaskPayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digimon',
          filter: 'user_id=eq.' + userId }, applyDigimonPayload)
      .subscribe();
    return function() { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Midnight reset — re-tick so daily counters clear without a reload ────────
  useEffect(function() {
    var now = new Date();
    var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    var msLeft = midnight.getTime() - now.getTime();
    var id = setTimeout(function() {
      // Reset done flag for daily/recurring tasks so they appear pending again
      setTasks(function(ts) {
        return ts.map(function(t) {
          if ((t.type === 'daily' || t.type === 'recurring') && t.done) {
            return Object.assign({}, t, { done: false });
          }
          return t;
        });
      });
      setMidnightTick(function(n) { return n + 1; });
    }, msLeft);
    return function() { clearTimeout(id); };
  }, [midnightTick]);

  // ── Mobile resize detection ──────────────────────────────────────────────────
  useEffect(function() {
    function onResize() {
      if (localStorage.getItem('dv_force_mobile') === 'true') return; // respect manual override
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', onResize);
    return function() { window.removeEventListener('resize', onResize); };
  }, []);

  // ── Pomodoro countdown ───────────────────────────────────────────────────────
  useEffect(function() {
    if (!pomodoroState || pomodoroState.phase !== 'running') return;
    var id = setTimeout(function() {
      setPomodoroState(function(ps) {
        if (!ps || ps.phase !== 'running') return ps;
        // Derive remaining from absolute endTime so background pauses don't lose time
        var next = Math.max(0, Math.floor((ps.endTime - Date.now()) / 1000));
        if (next <= 0) {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Session Complete! 🎉', {
              body: (ps.template || 'Focus') + ' session done — claim your reward in DailyDigivolve!',
              icon: '/icon-192.png',
            });
          }
          return Object.assign({}, ps, { phase:'done', timeLeft:0 });
        }
        return Object.assign({}, ps, { timeLeft: next });
      });
    }, 1000);
    return function() { clearTimeout(id); };
  }, [pomodoroState]);

  // Schedule SW notification whenever a new pomodoro session starts or is restored
  var _pomoEndTime = pomodoroState && pomodoroState.phase === 'running' ? pomodoroState.endTime : null;
  useEffect(function() {
    if (!_pomoEndTime) return;
    var template = pomodoroState ? pomodoroState.template : 'Focus';
    postToSW({
      type: 'SCHEDULE_TIMER', id: 'pomodoro', endTime: _pomoEndTime,
      title: 'Session Complete! 🎉',
      body: (template || 'Focus') + ' session done — open DailyDigivolve to claim your reward!',
    });
  }, [_pomoEndTime]);

  // Correct timer and fire notification immediately when returning from background
  useEffect(function() {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      setPomodoroState(function(ps) {
        if (!ps || ps.phase !== 'running') return ps;
        var remaining = Math.max(0, Math.floor((ps.endTime - Date.now()) / 1000));
        if (remaining <= 0) {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Session Complete! 🎉', {
              body: (ps.template || 'Focus') + ' session done — claim your reward in DailyDigivolve!',
              icon: '/icon-192.png',
            });
          }
          return Object.assign({}, ps, { phase:'done', timeLeft:0 });
        }
        return Object.assign({}, ps, { timeLeft: remaining });
      });
    }
    document.addEventListener('visibilitychange', onVisible);
    return function() { document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  // ── Wake alarm polling (checks every minute if alarm time reached) ────────────
  useEffect(function() {
    if (!sleepState || sleepState.phase !== 'sleeping') return;
    var interval = setInterval(function() {
      var now = new Date();
      var [wh, wm] = (sleepState.wakeTime || "07:00").split(':').map(Number);
      var wakeDateTime = new Date(now); wakeDateTime.setHours(wh, wm, 0, 0);
      // Anchor wake time to after bedtime — alarm for "07:00" set at 11 PM is next-day
      if (wakeDateTime.getTime() <= new Date(sleepState.startedAt).getTime()) {
        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
      }
      if (now >= wakeDateTime) {
        clearInterval(interval);
        handleWakeUp(sleepState, sleepLog, false);
      }
    }, 15000);
    return function() { clearInterval(interval); };
  }, [sleepState, sleepLog]);

  // ── Partner walk-around — moves left/right in pet stage, flips when going right ─
  var _petDirRef = useRef(false); // false=left, true=right
  useEffect(function() {
    var cancelled = false;
    var MAX = 72; // max px offset from centre (stage ~260px wide, sprite 84px)
    function step() {
      if (cancelled) return;
      if (Math.random() < 0.35) { setTimeout(step, 1500 + Math.random() * 2000); return; }
      var move = 14 + Math.random() * 22;
      var dir  = _petDirRef.current ? 1 : -1;
      setPetX(function(x) {
        var next = x + dir * move;
        if (next > MAX)  { _petDirRef.current = false; setPetFacingRight(false); return MAX; }
        if (next < -MAX) { _petDirRef.current = true;  setPetFacingRight(true);  return -MAX; }
        // 20 % chance to randomly turn around — stay in place so transition doesn't drift the wrong way
        if (Math.random() < 0.20) {
          _petDirRef.current = !_petDirRef.current;
          setPetFacingRight(_petDirRef.current);
          return x;
        }
        return next;
      });
      setTimeout(step, 900 + Math.random() * 1300);
    }
    var t = setTimeout(step, 600);
    return function() { cancelled = true; clearTimeout(t); };
  }, []);

  // ── Rotate queued speech every 5 min (bubble only shows on click, not auto) ─
  var IDLE_LINES = [
    "finish your tasks! 📋","you can do it! 💪","i believe in you ✨",
    "getting stronger! ⚡","great job! 🔥","let's go, tamer! 🎮",
    "don't forget to rest too 💤","one task at a time 🌟",
  ];
  useEffect(function() {
    var t = setInterval(function() {
      setSpeech(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]);
    }, 5 * 60 * 1000); // every 5 minutes, silently refresh the text
    return function() { clearInterval(t); };
  }, []);

  // ── Battle auto-advance ───────────────────────────────────────────────────────
  useEffect(function() {
    if (!battleState || battleState.phase !== "fight" || mgActive) {
      clearTimeout(battleAdvTimerRef.current);
      return;
    }
    var capturedBs   = battleState;
    var capturedBits = bits;
    battleAdvTimerRef.current = setTimeout(async function() {
      var round  = (capturedBs.round || 0) + 1;
      var nextBs = Object.assign({}, capturedBs, { round:round });
      if (round % 2 === 0) {
        // Brain game round
        var types = ["digicode","timing","guard"];
        var type  = types[Math.floor(Math.random() * types.length)];
        setBattleState(nextBs);
        setMgActive(buildMinigame(type));
      } else {
        var resolved = resolveRoundLogic(nextBs, null);
        setBattleState(resolved);
        if ((resolved.phase === "won" || resolved.phase === "lost") && resolved._earn) {
          var newBits = capturedBits + resolved._earn;
          setBits(newBits);
          await supabase.from('profiles').update({ bits:newBits }).eq('id', userId);
        }
      }
    }, 2200);
    return function() { clearTimeout(battleAdvTimerRef.current); };
  }, [battleState, mgActive]);

  // ── Minigame reveal → input transition ───────────────────────────────────────
  useEffect(function() {
    if (!mgActive || mgActive.phase !== "reveal") return;
    var t = setTimeout(function() {
      setMgActive(function(mg) { return mg ? Object.assign({}, mg, { phase:"input" }) : null; });
    }, 900);
    return function() { clearTimeout(t); };
  }, [mgActive]);

  // ── Minigame auto-fail ────────────────────────────────────────────────────────
  useEffect(function() {
    if (!mgActive || mgActive.phase !== "input") return;
    var capturedBs   = battleState;
    var capturedBits = bits;
    var t = setTimeout(async function() {
      setMgActive(null);
      if (!capturedBs) return;
      var resolved = resolveRoundLogic(capturedBs, "fail");
      setBattleState(resolved);
      if ((resolved.phase === "won" || resolved.phase === "lost") && resolved._earn) {
        var newBits = capturedBits + resolved._earn;
        setBits(newBits);
        await supabase.from('profiles').update({ bits:newBits }).eq('id', userId);
      }
    }, 2500);
    mgTimerRef.current = t;
    return function() { clearTimeout(t); };
  }, [mgActive]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  var activeDigi  = party[0];
  var activeInfo  = activeDigi ? DIGIMON_MAP[activeDigi.speciesId] : null;
  // Bond is per-digimon; only party[0] (activeDigi) can gain bond — farm digimon cannot
  var bond = activeDigi ? (activeDigi.bond || 0) : 0;

  // Updates the active digimon's bond in both React state and DB.
  // Only call when activeDigi is present (party has at least one member).
  async function updateActiveBond(newBond) {
    if (!activeDigi) return;
    setParty(function(p) {
      if (!p.length) return p;
      return [Object.assign({}, p[0], { bond: newBond })].concat(p.slice(1));
    });
    var { error } = await supabase.from('digimon').update({ bond: newBond }).eq('id', activeDigi.uid);
    if (error) console.error('[bond] digimon update failed:', error.message);
    // Keep profiles.bond in sync for friends leaderboard display
    supabase.from('profiles').update({ bond: newBond }).eq('id', userId);
  }

  var streak      = tasks.reduce(function(m,t){ return Math.max(m, t.streak||0); }, 0);
  var accent      = activeInfo ? (ATTR_COLOR[activeInfo.attr]||T.teal) : T.teal;
  var pendTasks       = tasks.filter(function(t){ return !t.done; });
  var todayStr        = new Date().toISOString().split('T')[0];
  var doneToday       = tasks.filter(function(t){ return t.done && t.lastCompletedDate === todayStr; });
  // Active task count = pending + completed today (excludes old once-off completions from previous days)
  var activeTodayTotal = pendTasks.length + doneToday.length;
  var xpToday         = doneToday.reduce(function(s,t){ return s + calcXpReward(t, streak); }, 0);
  var todayKey        = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];

  var crestProfile = useMemo(function() {
    return calcCrestProfile(crestHistory, 14);
  }, [crestHistory]);

  var playUsedToday   = bondActionsToday.play  || 0;
  var taskBondToday   = bondActionsToday.tasks || 0;
  var playAvailable   = doneToday.length >= 3 && playUsedToday < 3;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function addLog(icon, text) {
    setActLog(function(l){ return [{ icon, text, time:"JUST NOW" }].concat(l.slice(0,7)); });
  }
  function toast_(msg, color) {
    setToast({ msg, color:color||T.green });
    setTimeout(function(){ setToast(null); }, 2800);
  }
  // Show speech bubble for 30 s then auto-hide
  function showSpeechBubble(text) {
    if (text) setSpeech(text);
    setShowSpeech(true);
    clearTimeout(speechDismissTimer.current);
    speechDismissTimer.current = setTimeout(function(){ setShowSpeech(false); }, 30000);
  }
  function toggleMobileView() {
    var force = localStorage.getItem('dv_force_mobile') === 'true';
    if (force) {
      localStorage.removeItem('dv_force_mobile');
      setIsMobile(window.innerWidth <= 768);
    } else {
      localStorage.setItem('dv_force_mobile', 'true');
      setIsMobile(true);
    }
  }
  function triggerJijimon(key) {
    if (jijimonSeen[key]) return;
    setJijimonModal({ key, msg: JIJIMON_LINES[key] || "" });
  }
  function dismissJijimon(forever) {
    if (!jijimonModal) return;
    if (forever) {
      var updated = Object.assign({}, jijimonSeen, { [jijimonModal.key]: true });
      setJijimonSeen(updated);
      localStorage.setItem('jijimon_seen', JSON.stringify(updated));
    }
    setJijimonModal(null);
  }

  // ── Reset team ───────────────────────────────────────────────────────────────
  async function resetToStarters() {
    var { data:existing } = await supabase.from('digimon').select('id').eq('user_id', userId);
    if (existing && existing.length > 0) {
      await supabase.from('digimon').delete().in('id', existing.map(function(x){ return x.id; }));
    }
    setParty([]);
    setFarm([]);
    setAllDisc([]);
    // Reset bond back to zero for all digimon (fresh start)
    await supabase.from('profiles').update({ bond: 0 }).eq('id', userId);
    // Clear onboarding flag so the Jijimon quiz + egg selection fires again
    localStorage.removeItem('dv_onboarding_' + userId);
    setConfirmReset(false);
    setShowOnboarding(true);
  }

  async function hatchDigitama(eggId) {
    var HATCH_MAP = {
      flame:  'koromon',
      beast:  'tsunomon',
      dragon: 'gigimon',
      nature: 'tanemon',
      holy:   'sunmon',
    };
    var speciesId = HATCH_MAP[eggId] || 'koromon';
    var s = newDigimon(speciesId, {});
    var { data:newDigi } = await supabase.from('digimon').insert({
      user_id: userId, species_id: speciesId, name: s.name,
      level: 1, exp: 0, exp_needed: 100, abi: 0,
      personality: s.personality, bonus_stats: s.bonusStats,
      discovered: [speciesId], in_farm: false, sort_order: 0,
    }).select().single();
    if (newDigi) {
      var hatched = Object.assign({}, s, { uid: newDigi.id });
      setParty(function(p){ return [hatched].concat(p).slice(0, 3); });
      setAllDisc(function(d){ return d.includes(speciesId) ? d : d.concat([speciesId]); });
    }
    var newCreds = Math.max(0, digitamaCredits - 1);
    setDigitamaCredits(newCreds);
    await supabase.from('profiles').update({ digitama_credits: newCreds }).eq('id', userId);
    if (newCreds <= 0) setShowDigitamaModal(false);
    toast_("Welcome, " + s.name + "! 🥚→✨", T.gold);
  }

  // ── Sleep / REST system ──────────────────────────────────────────────────────
  var SLEEP_GOODNIGHT = {
    durable:  function(name){ return name + " will stand guard even in dreams. Sleep well, Tamer."; },
    lively:   function(name){ return "Ahh~ even " + name + " needs to recharge! Sweet dreams! 💤"; },
    fighter:  function(name){ return name + " rests so tomorrow's battles can be won. Good night!"; },
    defender: function(name){ return name + " keeps watch while you sleep. Rest easy, Tamer."; },
    brainy:   function(name){ return "Sleep consolidates memory and growth. " + name + " understands. Good night."; },
    nimble:   function(name){ return name + " is already curled up! Time to rest, Tamer~ ✨"; },
  };
  var SLEEP_GOODMORNING = {
    durable:  function(name){ return name + " is ready! A new day of missions awaits, Tamer!"; },
    lively:   function(name){ return "GOOD MORNING! " + name + " is fully charged and raring to go! ⚡"; },
    fighter:  function(name){ return name + " slept like a champion. Time to conquer today!"; },
    defender: function(name){ return "Morning, Tamer. " + name + " protected your rest well. Ready when you are."; },
    brainy:   function(name){ return "Rise and process! " + name + " has been thinking of today's strategy. 🧠"; },
    nimble:   function(name){ return name + " springs awake! Let's go, Tamer — today's waiting!"; },
  };

  function getSleepMsg(map, fallback) {
    if (!activeDigi) return fallback;
    var fn = map[activeDigi.personality];
    return fn ? fn(activeDigi.name) : fallback;
  }

  async function startRest(wakeTime) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    var now = new Date();
    var ss = {
      phase: 'countdown',
      startedAt: now.toISOString(),
      wakeTime: wakeTime,
      sleepDate: now.toISOString().split('T')[0],
    };
    setSleepState(ss);
    setShowRestModal(false);
    showSpeechBubble(getSleepMsg(SLEEP_GOODNIGHT, "good night... 💤"));
    await supabase.from('profiles').update({ sleep_state: ss }).eq('id', userId);
    // After 2 minutes, transition to sleeping phase; immediately wake if alarm already passed (short naps)
    setTimeout(async function() {
      var sleeping = Object.assign({}, ss, { phase: 'sleeping' });
      setSleepState(sleeping);
      await supabase.from('profiles').update({ sleep_state: sleeping }).eq('id', userId);
      var now2 = new Date();
      var _wh = wakeTime.split(':').map(Number)[0]; var _wm = wakeTime.split(':').map(Number)[1];
      var wakeCheck = new Date(now2); wakeCheck.setHours(_wh, _wm, 0, 0);
      if (wakeCheck.getTime() <= new Date(ss.startedAt).getTime()) wakeCheck.setDate(wakeCheck.getDate() + 1);
      if (now2 >= wakeCheck) { handleWakeUp(sleeping, null, false); }
    }, 2 * 60 * 1000);
    // Schedule SW notification for wake time (best-effort background alarm)
    var [wh, wm] = wakeTime.split(':').map(Number);
    var wakeDate = new Date(now); wakeDate.setHours(wh, wm, 0, 0);
    // Push to next day only if wake time is at or before sleep start (overnight case)
    if (wakeDate.getTime() <= now.getTime()) wakeDate.setDate(wakeDate.getDate() + 1);
    postToSW({
      type: 'SCHEDULE_TIMER', id: 'sleep-wake',
      endTime: wakeDate.getTime(),
      title: 'Rise and shine! 🌅',
      body: 'Your rest is complete — open DailyDigivolve to start your day!',
    });
  }

  function playWakeChime() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Three rising tones — gentle morning chime
      [[523, 0], [659, 0.18], [784, 0.36]].forEach(function(pair) {
        var freq = pair[0]; var when = pair[1];
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + when);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + when + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + when + 0.6);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.7);
      });
    } catch (_) {}
  }

  async function handleWakeUp(ss, log, isManual) {
    postToSW({ type: 'CANCEL_TIMER', id: 'sleep-wake' });
    if (!isManual) playWakeChime();
    var now = new Date();
    var bedtimeDate = new Date(ss.startedAt);
    var durationMins = Math.round((now - bedtimeDate) / 60000);
    var entry = {
      date: now.toISOString().split('T')[0],
      bedtime: bedtimeDate.toTimeString().slice(0,5),
      waketime: now.toTimeString().slice(0,5),
      alarmTime: ss.wakeTime,
      durationMins: durationMins,
    };
    var newLog = [entry].concat(log || sleepLog).slice(0, 30);
    setSleepLog(newLog);
    setSleepState(null);
    var greeting = isManual
      ? (activeDigi ? "...yawn... good morning, Tamer 🌅" : "good morning! 🌅")
      : getSleepMsg(SLEEP_GOODMORNING, "good morning! time to shine! 🌅");
    showSpeechBubble(greeting);
    setWakeGreeting({ msg: greeting, duration: durationMins, entry });
    await supabase.from('profiles').update({
      sleep_state: null,
      sleep_log: newLog,
    }).eq('id', userId);
  }

  // ── Background ───────────────────────────────────────────────────────────────
  async function saveBackground(bgId) {
    setSelectedBg(bgId);
    await supabase.from('profiles').update({ background_id: bgId }).eq('id', userId);
  }

  // ── Tamer name ──────────────────────────────────────────────────────────────
  async function saveTamerName(name) {
    var trimmed = name.trim().slice(0, 20);
    if (!trimmed) { setEditingName(false); return; }
    setTamerName(trimmed);
    setEditingName(false);
    var { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', userId);
    if (error) toast_("Name save failed — try again", T.coral);
  }

  // ── Tamer location ──────────────────────────────────────────────────────────
  async function saveTamerLocation(loc) {
    var trimmed = (loc || "").trim().slice(0, 50);
    setTamerLocation(trimmed);
    setEditingLocation(false);
    await supabase.from('profiles').update({ location: trimmed }).eq('id', userId);
  }

  // ── Set party leader ────────────────────────────────────────────────────────
  async function setLeader(uid) {
    var idx = party.findIndex(function(d){ return d.uid === uid; });
    if (idx <= 0) return;
    var newParty = [party[idx]].concat(party.filter(function(_,i){ return i!==idx; }));
    setParty(newParty);
    // Persist new sort_order
    await Promise.all(newParty.map(function(d, i){
      return supabase.from('digimon').update({ sort_order: i }).eq('id', d.uid);
    }));
    toast_(newParty[0].name + " is now party leader! ★", accent);
  }

  // ── Neglect helpers ──────────────────────────────────────────────────────────
  async function clearNeglect() {
    setNeglectData(null);
    await supabase.from('profiles').update({ neglect_state: null }).eq('id', userId);
    toast_("Bond restored! Your partner is back. 💗", T.pink);
    updateActiveBond(clampBond(bond + 15));
    addLog("💗", activeDigi ? activeDigi.name + " reconnection arc complete!" : "Reconnection arc complete!");
  }

  async function acceptSukamon() {
    var nd = Object.assign({}, neglectData, { sukamonAccepted: true, sukamonOffered: true });
    var nPath = NEGLECT_PATHS[nd.neglectPath] || NEGLECT_PATHS.sukamon;
    setNeglectData(nd);
    setShowSukamonModal(false);
    await supabase.from('profiles').update({ neglect_state: nd }).eq('id', userId);
    toast_("Dark path accepted. " + (DIGIMON_MAP[nPath.champion] ? DIGIMON_MAP[nPath.champion].name : "Neglect") + " evolution available.", "#9B59B6");
    addLog("💀", "Dark path opened (" + nPath.label + "). Neglect evolution available in TEAM.");
  }

  async function rejectSukamon() {
    var nd = Object.assign({}, neglectData, { sukamonOffered: true, sukamonAccepted: false });
    setNeglectData(nd);
    setShowSukamonModal(false);
    await supabase.from('profiles').update({ neglect_state: nd }).eq('id', userId);
    toast_("Fighting the corruption. Complete 3 tasks to recover. 💗", T.teal);
  }

  // ── Raid contribution ────────────────────────────────────────────────────────
  function calcRaidContrib(task, digi) {
    if (!digi) return { damage: 0, stat: "power" };
    var bs      = calcBattleStats(digi);
    var raidStat = TEMPLATE_RAID_STAT[task.template] || null;
    var statVal  = raidStat
      ? bs[raidStat.charAt(0).toUpperCase() + raidStat.slice(1)]
      : Math.round((bs.Power + bs.Guard + bs.Focus + bs.Momentum) / 4);
    var diffMult = RAID_DIFF_MULT[task.difficulty] || 1.0;
    // Current phase bonus: +50% if task stat matches phase dominant
    var phaseFrac = raidState ? raidState.totalDamage / CURRENT_RAID.bossHp : 0;
    var phaseIdx  = CURRENT_RAID.phases.findIndex(function(p){ return phaseFrac < p.threshold; });
    if (phaseIdx < 0) phaseIdx = CURRENT_RAID.phases.length - 1;
    var phase     = CURRENT_RAID.phases[phaseIdx];
    var phaseMult = (phase && raidStat && phase.dominant === raidStat) ? 1.5 : 1.0;
    var damage    = Math.max(1, Math.round(statVal * diffMult * phaseMult));
    return { damage, stat: raidStat || "power", phase: phase ? phase.name : "" };
  }

  // ── Dedigivolve ─────────────────────────────────────────────────────────────
  async function confirmDedigivolve() {
    if (!dedigivolveConfirm) return;
    var { uid, prevId } = dedigivolveConfirm;
    var digi = party.find(function(d){ return d.uid === uid; }) || farm.find(function(d){ return d.uid === uid; });
    if (!digi || !prevId) return;
    var prevInfo = DIGIMON_MAP[prevId];
    if (!prevInfo) return;
    await supabase.from('digimon').update({ species_id: prevId, name: prevInfo.name }).eq('id', uid);
    function updateList(list) {
      return list.map(function(d) {
        if (d.uid !== uid) return d;
        return Object.assign({}, d, { speciesId: prevId, name: prevInfo.name });
      });
    }
    setParty(updateList);
    setFarm(updateList);
    setDedigivolveConfirm(null);
    toast_(digi.name + " returned to " + prevInfo.name + ".", T.lavender);
    addLog("↩", digi.name + " dedigivolved to " + prevInfo.name + ".");
  }

  // ── Complete task ────────────────────────────────────────────────────────────
  async function completeTask(id) {
    var task = tasks.find(function(t){ return t.id === id; });
    if (!task || task.done) return;

    var dayDigiUid = weeklyDigimon[todayKey];
    var hasBoost   = dayDigiUid && activeDigi && dayDigiUid === activeDigi.uid;
    var baseXp     = calcXpReward(task, streak);
    var xp         = hasBoost ? Math.floor(baseXp * 1.5) : baseXp;
    var today      = new Date().toISOString().split('T')[0]; // UTC — for bond/crest/profile dates
    var _ctd = new Date(); var todayLocal = _ctd.getFullYear()+'-'+String(_ctd.getMonth()+1).padStart(2,'0')+'-'+String(_ctd.getDate()).padStart(2,'0');
    var _yd = new Date(_ctd); _yd.setDate(_yd.getDate()-1);
    var yestLocal = _yd.getFullYear()+'-'+String(_yd.getMonth()+1).padStart(2,'0')+'-'+String(_yd.getDate()).padStart(2,'0');
    // Streak only continues if completed yesterday; any gap resets to 1
    var newStreak = (task.lastCompletedDate === yestLocal) ? (task.streak||0)+1 : 1;

    // Silent daily cap — task completion still records but yields no stat gains above 300
    var completedTodayCount = tasks.filter(function(t){ return t.done && t.lastCompletedDate === todayLocal; }).length;
    var statGainAllowed = completedTodayCount < 300;

    // Crest gain
    var cg = calcCrestGain(task.template, task.difficulty);
    var newHistory = crestHistory;
    if (cg && statGainAllowed) {
      newHistory = crestHistory.concat([{
        date: today,
        primaryCrest:   cg.primaryCrest,
        secondaryCrest: cg.secondaryCrest,
        primary:        cg.primary,
        secondary:      cg.secondary,
      }]);
      // Trim to 60 days
      var cutoff = Date.now() - 60 * 86400000;
      newHistory = newHistory.filter(function(e){ return new Date(e.date).getTime() >= cutoff; });
      setCrestHistory(newHistory);
    }

    // Bond gain (max 5 task bonds/day) — only active digimon (party[0]) gains bond
    var newBond = bond;
    var newTaskBond = taskBondToday;
    if (statGainAllowed && taskBondToday < 5) {
      newBond = clampBond(bond + 0.5);
      newTaskBond = taskBondToday + 1;
    }

    var newBAT = Object.assign({}, bondActionsToday, { tasks: newTaskBond, date: today });
    setBondActionsToday(newBAT);

    // Update task — use local date so week view column comparison (also local) matches
    await supabase.from('tasks').update({
      done: true, streak: newStreak,
      last_completed_date: todayLocal,
    }).eq('id', id);
    var applyComplete = function(t) {
      return t.id===id ? Object.assign({},t,{done:true,streak:newStreak,lastCompletedDate:todayLocal}) : t;
    };
    setTasks(function(ts){ return ts.map(applyComplete); });
    setAllTasks(function(ts){ return ts.map(applyComplete); });

    // XP to all party members equally (farm Digimon excluded — not in party array)
    if (activeDigi && statGainAllowed) {
      var partyResults = party.map(function(d) {
        return applyXpGain(d, xp);
      });
      await Promise.all(party.map(function(d, i) {
        var r = partyResults[i];
        var upd = { exp: r.exp, level: r.level, exp_needed: r.expNeeded };
        if (i === 0 && newBond !== bond) upd.bond = newBond; // write bond atomically with exp to avoid Realtime race
        return supabase.from('digimon').update(upd).eq('id', d.uid);
      }));
      setParty(function(p){ return p.map(function(d, i){
        var merged = Object.assign({}, d, partyResults[i]);
        if (i === 0 && newBond !== bond) merged.bond = newBond;
        return merged;
      }); });
    }

    // Raid auto-contribution
    var contrib = calcRaidContrib(task, activeDigi);
    var newRaid = null;
    if (contrib.damage > 0 && raidState) {
      var prevDmg = raidState.totalDamage;
      var newDmg  = Math.min(CURRENT_RAID.bossHp, prevDmg + contrib.damage);
      var logEntry = { date: today, damage: contrib.damage, taskTitle: task.title, stat: contrib.stat, phase: contrib.phase };
      newRaid = {
        raidId:      CURRENT_RAID.id,
        totalDamage: newDmg,
        raidLog:     [logEntry].concat(raidState.raidLog || []).slice(0, 30),
      };
      setRaidState(newRaid);
      setRaidHit({ damage: contrib.damage, stat: contrib.stat });
      setTimeout(function(){ setRaidHit(null); }, 2200);
    }

    // Apply bond gain to active digimon (state only — DB write is bundled into the exp update below)
    if (newBond !== bond) {
      setParty(function(p) {
        if (!p.length) return p;
        return [Object.assign({}, p[0], { bond: newBond })].concat(p.slice(1));
      });
    }

    // Tamer XP gain
    var txpGain = statGainAllowed ? (TAMER_TASK_XP[task.difficulty] || 20) : 0;
    var newTamerXp = tamerXp + txpGain;
    var newTamerLevel = tamerLevel;
    while (newTamerXp >= TAMER_XP_PER_LEVEL) { newTamerXp -= TAMER_XP_PER_LEVEL; newTamerLevel += 1; }
    if (newTamerLevel > tamerLevel) {
      toast_("Tamer Level " + newTamerLevel + "! 🌟", T.gold);
      addLog("🌟", "Tamer reached Level " + newTamerLevel + "!");
    }
    setTamerLevel(newTamerLevel);
    setTamerXp(newTamerXp);

    // Crest materials gain (same mapping as crest history, drives the stage system)
    var newMatsFromTask = Object.assign({}, crestMaterials);
    if (cg && statGainAllowed) {
      if (cg.primaryCrest && cg.primary > 0) {
        newMatsFromTask[cg.primaryCrest] = (newMatsFromTask[cg.primaryCrest] || 0) + cg.primary;
      }
      if (cg.secondaryCrest && cg.secondary > 0) {
        newMatsFromTask[cg.secondaryCrest] = (newMatsFromTask[cg.secondaryCrest] || 0) + cg.secondary;
      }
      setCrestMaterials(newMatsFromTask);
    }

    // Save profile updates
    var profileUpdate = {
      bond_actions_today: newBAT,
      crest_history: newHistory,
      crest_materials: newMatsFromTask,
      tamer_level: newTamerLevel,
      tamer_xp: newTamerXp,
    };
    if (newRaid) profileUpdate.raid_state = newRaid;
    await supabase.from('profiles').update(profileUpdate).eq('id', userId);

    showSpeechBubble("great job! +" + xp + " XP 🔥");
    addLog("✅", '"' + task.title + '" +' + xp + " XP" + (hasBoost?" ⚡1.5x":"") + (cg?" ["+cg.primaryCrest+"]":"") + (contrib.damage>0?" ⚔+"+contrib.damage:""));
    toast_("Task done!  +" + xp + " EXP" + (hasBoost?" ⚡1.5x":"") + (cg?"  "+CREST_INFO[cg.primaryCrest].icon+" "+cg.primaryCrest:""));

    // Neglect reconnection arc advancement
    if (neglectData && neglectData.inArc) {
      var newArcDone = (neglectData.arcTasksDone || 0) + 1;
      var arcDone    = newArcDone >= neglectData.arcGoal;
      var updatedNeglect = Object.assign({}, neglectData, { arcTasksDone: newArcDone, inArc: !arcDone });
      setNeglectData(updatedNeglect);
      await supabase.from('profiles').update({ neglect_state: arcDone ? null : updatedNeglect }).eq('id', userId);
      if (arcDone) {
        clearNeglect();
      } else {
        toast_("Reconnection Arc: " + newArcDone + "/" + neglectData.arcGoal + " tasks 💗", T.pink);
      }
    }

    // Jijimon triggers
    if (crestHistory.length === 0 && cg) triggerJijimon('crest_intro');
  }

  // ── Claim catch-up rewards for tasks completed yesterday but not logged ──────
  async function claimCatchupRewards() {
    var claimed = catchupTasks.filter(function(t){ return catchupChecked[t.id]; });
    setShowCatchupModal(false);
    if (claimed.length === 0) return;

    var _ydC = new Date(); _ydC.setDate(_ydC.getDate()-1);
    var yestLocalC = _ydC.getFullYear()+'-'+String(_ydC.getMonth()+1).padStart(2,'0')+'-'+String(_ydC.getDate()).padStart(2,'0');
    var _d2C = new Date(); _d2C.setDate(_d2C.getDate()-2);
    var dayB4YestC = _d2C.getFullYear()+'-'+String(_d2C.getMonth()+1).padStart(2,'0')+'-'+String(_d2C.getDate()).padStart(2,'0');
    var yest       = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    var totalXp    = 0;
    var newBond    = bond;
    var newHistory = crestHistory.slice();
    var newTaskBond = taskBondToday;

    for (var i = 0; i < claimed.length; i++) {
      var ct = claimed[i];
      // Streak continues only if last completed the day before yesterday (consecutive with yesterday)
      var ctStreak = (ct.lastCompletedDate === dayB4YestC) ? (ct.streak||0)+1 : 1;
      totalXp += calcXpReward(ct, ctStreak);

      var cg = calcCrestGain(ct.template, ct.difficulty);
      if (cg) {
        newHistory.push({
          date: yest,
          primaryCrest:   cg.primaryCrest,
          secondaryCrest: cg.secondaryCrest,
          primary:        cg.primary,
          secondary:      cg.secondary,
        });
      }

      if (newTaskBond < 5) { newBond = clampBond(newBond + 0.5); newTaskBond++; }

      await supabase.from('tasks').update({
        last_completed_date: yestLocalC,
        streak: ctStreak,
      }).eq('id', ct.id);
    }

    // Trim crest history to 60 days
    var cutoff = Date.now() - 60 * 86400000;
    newHistory = newHistory.filter(function(e){ return new Date(e.date).getTime() >= cutoff; });
    setCrestHistory(newHistory);
    if (newBond !== bond) updateActiveBond(newBond);
    var today = new Date().toISOString().split('T')[0];
    var newBAT = Object.assign({}, bondActionsToday, { tasks: newTaskBond, date: today });
    setBondActionsToday(newBAT);

    // Apply XP to all party members
    if (activeDigi && totalXp > 0) {
      var partyResults = party.map(function(d){ return applyXpGain(d, totalXp); });
      await Promise.all(party.map(function(d, idx) {
        var r = partyResults[idx];
        return supabase.from('digimon').update({ exp: r.exp, level: r.level, exp_needed: r.expNeeded }).eq('id', d.uid);
      }));
      setParty(function(p){ return p.map(function(d, idx){ return Object.assign({}, d, partyResults[idx]); }); });
    }

    await supabase.from('profiles').update({ crest_history: newHistory, bond_actions_today: newBAT }).eq('id', userId);

    addLog("🌟", "Carryover tasks claimed! +" + totalXp + " XP across " + claimed.length + " task(s)");
    toast_("Carryover rewards claimed! +" + totalXp + " XP 🌟", T.gold);
  }

  // ── Evolution ─────────────────────────────────────────────────────────────────
  async function evolve(uid, targetId) {
    var info = DIGIMON_MAP[targetId];
    if (!info) return;
    var digi = party.find(function(d){ return d.uid===uid; });
    if (!digi) return;
    var { eligible, vow } = checkEvoEligible(digi, digi.bond || 0, crestProfile, targetId);
    if (!eligible && !vow) return;
    if (vow) {
      // Consume Partner Vow item check could go here
    }
    var nd = digi.discovered.indexOf(targetId)<0 ? digi.discovered.concat([targetId]) : digi.discovered;
    digiMutRef.current += 1;
    await supabase.from('digimon').update({
      species_id: targetId, name: info.name,
      level: 1, exp: 0, exp_needed: 100,
      discovered: nd,
    }).eq('id', uid);
    setParty(function(p){ return p.map(function(d){
      if (d.uid!==uid) return d;
      return Object.assign({},d,{speciesId:targetId,name:info.name,level:1,exp:0,expNeeded:100,discovered:nd});
    }); });
    setTimeout(function(){ digiMutRef.current = Math.max(0, digiMutRef.current - 1); }, 3000);
    setAllDisc(function(p){ return p.indexOf(targetId)<0?p.concat([targetId]):p; });
    setEvoAnim(targetId);
    addLog("✨", info.name + " digivolved!");
    toast_(info.name + " digivolved!", "#FFD700");
  }

  // ── Feed ──────────────────────────────────────────────────────────────────────
  async function feedFood(food) {
    if (bits < food.cost) { toast_("Not enough bits!", "#FF8080"); return; }
    var addable = Math.min(food.stamina, STAMINA_FOOD_CAP - foodStaminaToday);
    if (addable <= 0) { toast_("Daily food stamina cap reached!", "#FF8080"); return; }
    var newStam = Math.min(STAMINA_MAX, stamina + addable);
    var newBond = clampBond(bond + food.bond);
    var newBits = bits - food.cost;
    var newFoodCap = foodStaminaToday + addable;
    var today = new Date().toISOString().split('T')[0];

    setStamina(newStam); setBits(newBits);
    setFoodStaminaToday(newFoodCap); setShowFeedPanel(false);
    showSpeechBubble(food.type==="treat" ? "best tamer ever 🎉" : "nom nom nom 🍎");
    await updateActiveBond(newBond);

    await supabase.from('profiles').update({
      stamina: newStam, last_stamina_update: new Date().toISOString(),
      bits: newBits, food_stamina_today: newFoodCap,
    }).eq('id', userId);

    addLog("🍎", "Fed " + food.name + " +" + addable + " Stamina");
    toast_("+" + addable + " Stamina 🍎  +" + food.bond + " Bond", T.pink);
    if (!jijimonSeen['first_feed']) triggerJijimon('first_feed');
  }

  // ── Play ──────────────────────────────────────────────────────────────────────
  async function playAction() {
    if (!playAvailable) return;
    var today = new Date().toISOString().split('T')[0];
    var newBAT = Object.assign({}, bondActionsToday, { play: playUsedToday + 1, date: today });
    var bonded = party.map(function(d) {
      return Object.assign({}, d, { bond: clampBond((d.bond || 0) + 1) });
    });
    setParty(bonded);
    await Promise.all(bonded.map(function(d) {
      return supabase.from('digimon').update({ bond: d.bond }).eq('id', d.uid);
    }));
    if (bonded.length > 0) supabase.from('profiles').update({ bond: bonded[0].bond }).eq('id', userId);
    setBondActionsToday(newBAT);
    showSpeechBubble("yay let's play! 🎮");
    addLog("🎮", "Played with " + (activeDigi ? activeDigi.name : "partner") + " +1 Bond");
    toast_("+1 Bond 🎮  " + (2-playUsedToday) + " plays left today", T.teal);
    await supabase.from('profiles').update({ bond_actions_today: newBAT }).eq('id', userId);
  }

  // ── Pomodoro ──────────────────────────────────────────────────────────────────
  function openPomodoroSetup() {
    setPomodoroState({ phase:'setup', template:'Deep Work', duration:25 });
  }
  function beginPomodoro() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    var ps = pomodoroState;
    if (!ps) return;
    var secs = (ps.duration || 25) * 60;
    var newState = {
      phase: 'running', timeLeft: secs, totalSeconds: secs,
      endTime: Date.now() + secs * 1000,
      template: ps.template || 'Deep Work', duration: ps.duration || 25,
    };
    setPomodoroState(newState);
    // Persist for cross-device sync and survival across app restarts
    var persisted = { phase:'running', endTime:newState.endTime, totalSeconds:newState.totalSeconds, template:newState.template, duration:newState.duration };
    supabase.from('profiles').update({ pomodoro_state: persisted }).eq('id', userId);
  }
  async function claimPomodoroReward() {
    if (!pomodoroState || pomodoroState.phase !== 'done') return;
    var today = new Date().toISOString().split('T')[0];
    var template = pomodoroState.template;
    // Crest gain (equivalent to a Medium task)
    var cg = calcCrestGain(template, 'Medium');
    var newHistory = crestHistory;
    if (cg) {
      newHistory = crestHistory.concat([{ date:today, primaryCrest:cg.primaryCrest, secondaryCrest:cg.secondaryCrest, primary:cg.primary, secondary:cg.secondary }]);
      var cutoff = Date.now() - 60*86400000;
      newHistory = newHistory.filter(function(e){ return new Date(e.date).getTime()>=cutoff; });
      setCrestHistory(newHistory);
    }
    var newBond = clampBond(bond + 1);
    var xpGain  = Math.floor((pomodoroState.totalSeconds / 60) * 3); // 3 XP per minute
    var newBits = bits + 75;
    setBits(newBits);
    if (activeDigi) {
      var result = applyXpGain(activeDigi, xpGain);
      await supabase.from('digimon').update({ exp:result.exp, level:result.level, exp_needed:result.expNeeded, bond:newBond }).eq('id', activeDigi.uid);
      setParty(function(p){ return p.map(function(d,i){ return i===0?Object.assign({},d,result,{bond:newBond}):d; }); });
    } else {
      await updateActiveBond(newBond);
    }
    await supabase.from('profiles').update({ bits:newBits, crest_history:newHistory, pomodoro_state:null }).eq('id', userId);
    postToSW({ type: 'CANCEL_TIMER', id: 'pomodoro' });
    showSpeechBubble("training complete! 💪");
    addLog("⏱", "Focus session: " + template + "  +" + xpGain + " XP  +1💗" + (cg?"  "+CREST_INFO[cg.primaryCrest].icon:""));
    toast_("Session complete! +" + xpGain + " XP  +1 Bond  +75🪙", T.mint);
    setPomodoroState(null);
  }

  // ── Farm controls ─────────────────────────────────────────────────────────────
  function sendToFarm(uid) {
    if (party.length <= 1) return;
    var d = party.find(function(x){ return x.uid===uid; });
    if (!d) return;
    supabase.from('digimon').update({ in_farm:true }).eq('id', uid);
    setParty(function(p){ return p.filter(function(x){ return x.uid!==uid; }); });
    setFarm(function(f){ return f.concat([Object.assign({},d,{inFarm:true})]); });
    toast_(d.name + " sent to DigiFarm.");
  }
  async function recallFromFarm(uid) {
    if (party.length >= MAX_PARTY_SIZE) { toast_("Party full!", "#FF8080"); return; }
    var d = farm.find(function(x){ return x.uid===uid; });
    if (!d) return;
    var { error } = await supabase.from('digimon').update({ in_farm:false }).eq('id', uid);
    if (error) { toast_("Recall failed — try again", "#FF8080"); return; }
    setFarm(function(f){ return f.filter(function(x){ return x.uid!==uid; }); });
    setParty(function(p){ return p.length >= MAX_PARTY_SIZE ? p : p.concat([Object.assign({},d,{inFarm:false})]); });
    toast_(d.name + " recalled!");
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────────
  async function addTask(t) {
    var { data } = await supabase.from('tasks').insert({
      user_id: userId, title: t.title,
      category: t.template, // store template in category column
      priority: t.priority, difficulty: t.difficulty, type: t.type,
      notes: t.notes, days_of_week: t.daysOfWeek||[], due_date: t.dueDate||null,
      done: false, streak: 0,
    }).select().single();
    if (data) setTasks(function(ts){ return ts.concat([{
      id:data.id, title:data.title, template:data.category||'Neutral',
      priority:data.priority, difficulty:data.difficulty, type:data.type,
      notes:data.notes||'', done:false, streak:0,
      daysOfWeek:data.days_of_week||[], dueDate:data.due_date||null,
    }]); });
    toast_('Task added!');
  }
  async function editTask(id, updates) {
    await supabase.from('tasks').update({
      title:updates.title, category:updates.template,
      priority:updates.priority, difficulty:updates.difficulty, type:updates.type,
      notes:updates.notes, days_of_week:updates.daysOfWeek||[], due_date:updates.dueDate||null,
    }).eq('id', id);
    setTasks(function(ts){ return ts.map(function(t){ return t.id===id?Object.assign({},t,updates):t; }); });
  }
  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(function(ts){ return ts.filter(function(t){ return t.id!==id; }); });
    toast_('Task deleted.', '#FF8080');
  }
  async function rescheduleTask(id, newDate) {
    await supabase.from('tasks').update({ due_date:newDate||null }).eq('id', id);
    setTasks(function(ts){ return ts.map(function(t){ return t.id===id?Object.assign({},t,{dueDate:newDate||null}):t; }); });
  }
  async function assignWeeklyDigimon(day, uid) {
    var updated = Object.assign({}, weeklyDigimon, { [day]: uid||null });
    setWeeklyDigimon(updated);
    await supabase.from('profiles').update({ weekly_digimon:updated }).eq('id', userId);
  }

  // ── Battle ────────────────────────────────────────────────────────────────────
  async function startBattle(diff) {
    var cost = STAMINA_COSTS["bot_"+diff.toLowerCase()] || 10;
    if (stamina < cost) { triggerJijimon('stamina_low'); toast_("Not enough Stamina! Need "+cost+" ⚡","#FF8080"); return; }
    var candidates = Object.values(DIGIMON_MAP).filter(function(d){
      return diff==="Easy"?(d.stage==="Rookie"||d.stage==="In-Training"):
             diff==="Medium"?(d.stage==="Champion"):
             (d.stage==="Ultimate"||d.stage==="Mega");
    });
    var enemies = [0,1,2].map(function(){
      var id  = candidates[Math.floor(Math.random()*candidates.length)].id;
      var lvl = diff==="Easy"?Math.ceil(Math.random()*4):diff==="Medium"?4+Math.ceil(Math.random()*5):9+Math.ceil(Math.random()*6);
      var tmp = newDigimon(id,{level:lvl});
      var bs  = calcBattleStats(tmp);
      return Object.assign({},tmp,{currentHp:bs.HP, maxHp:bs.HP, isEnemy:true});
    });
    var playerTeam = party.slice(0,3).map(function(d){
      var bs = calcBattleStats(d);
      return Object.assign({},d,{currentHp:bs.HP, maxHp:bs.HP});
    });
    var newStam = Math.max(0, stamina - cost);
    var newLastUpdate = new Date().toISOString();
    setStamina(newStam);
    setLastStaminaUpdate(newLastUpdate);
    // Await the write so the DB reflects the cost before any Realtime echo can restore the old value
    await supabase.from('profiles').update({ stamina:newStam, last_stamina_update:newLastUpdate, bits:bits }).eq('id', userId);
    setBattleState({ playerTeam, enemyTeam:enemies, log:[], phase:"fight", round:0, difficulty:diff });
  }

  async function handleMgAnswer(answer) {
    if (!mgActive || mgActive.phase !== "input") return;
    clearTimeout(mgTimerRef.current);
    var correct = (answer === mgActive.answer);
    var result  = correct
      ? (mgActive.type === "digicode" ? "focus_success"
       : mgActive.type === "timing"   ? "momentum_success"
       : "guard_success")
      : "fail";
    // Flash result phase briefly
    setMgActive(function(mg) { return mg ? Object.assign({}, mg, { phase: correct ? "success" : "wrong" }) : null; });
    var capturedBs   = battleState;
    var capturedBits = bits;
    setTimeout(async function() {
      setMgActive(null);
      if (!capturedBs) return;
      var resolved = resolveRoundLogic(capturedBs, result);
      setBattleState(resolved);
      if ((resolved.phase === "won" || resolved.phase === "lost") && resolved._earn) {
        var newBits = capturedBits + resolved._earn;
        setBits(newBits);
        await supabase.from('profiles').update({ bits:newBits }).eq('id', userId);
      }
    }, 650);
  }

  function handleTimingTap() {
    if (!mgActive || mgActive.phase !== "input" || mgActive.type !== "timing") return;
    var pos = Math.min(100, ((Date.now() - mgActive.startedAt) / 2000) * 100);
    var inZone = pos >= mgActive.zoneStart && pos <= mgActive.zoneEnd;
    // For timing, pass "zone" (correct) or "miss" (wrong) as the answer
    handleMgAnswer(inZone ? "zone" : "miss");
  }

  // ── Buy shop item ────────────────────────────────────────────────────────────
  async function buyShopItem(item) {
    if (bits < item.cost) { toast_("Not enough bits!","#FF8080"); return; }
    var newBits = bits - item.cost;
    setBits(newBits);
    await supabase.from('profiles').update({ bits:newBits }).eq('id', userId);
    if (item.id === 'adopt_egg') {
      setShowAdoptEgg(true);
      setAdoptEggSel(null);
      setAdoptEggPhase('select');
      return;
    }
    toast_("Purchased: " + item.name, "#FFD700");
    addLog("🛒", "Bought " + item.name);
  }

  // ── Claim login day reward ───────────────────────────────────────────────────
  async function claimLoginReward(selectedCrest) {
    if (!pendingLoginReward) return;
    var reward = pendingLoginReward;
    var nextDay = loginDay + 1;
    var newMats = Object.assign({}, crestMaterials);
    var newBits = bits + (reward.bits || 0);
    var newArmorDigi = armorDigiCount + (reward.armorDigi || 0);

    if (reward.material) {
      newMats[reward.material.crest] = (newMats[reward.material.crest] || 0) + reward.material.amount;
    }
    if (reward.materialSelector && selectedCrest) {
      newMats[selectedCrest] = (newMats[selectedCrest] || 0) + reward.materialSelector.amount;
    }

    var nowLR = new Date();
    var todayLR = nowLR.getFullYear()+'-'+String(nowLR.getMonth()+1).padStart(2,'0')+'-'+String(nowLR.getDate()).padStart(2,'0');

    setBits(newBits);
    setCrestMaterials(newMats);
    setArmorDigiCount(newArmorDigi);
    setLoginDay(nextDay);
    setLastLoginRewardDate(todayLR);
    setShowLoginReward(false);
    setPendingLoginReward(null);
    setLoginRewardSel(null);

    await supabase.from('profiles').update({
      bits: newBits,
      crest_materials: newMats,
      login_day: nextDay,
      last_login_reward_date: todayLR,
      armor_digi_count: newArmorDigi,
    }).eq('id', userId);

    toast_("Day " + nextDay + " login reward claimed! 🎁", T.gold);
    addLog("🎁", "Login Day " + nextDay + " reward claimed");

    // Open egg selector after claiming if digitamaSelector reward
    if (reward.digitamaSelector) {
      setTimeout(function(){ setShowAdoptEgg(true); setAdoptEggSel(null); setAdoptEggPhase('select'); }, 400);
    }
  }

  // ── Spend crest materials to advance a digimon's crest stage ────────────────
  async function spendCrestMaterial(digiUid, crestName) {
    var digi = party.find(function(d){ return d.uid === digiUid; }) || farm.find(function(d){ return d.uid === digiUid; });
    if (!digi) return;
    var stages = digi.crestStages || {};
    var currentStage = stages[crestName] || 0;
    if (currentStage >= CREST_STAGE_COSTS.length) { toast_("Max stage reached!", T.gold); return; }
    var cost = CREST_STAGE_COSTS[currentStage];
    var available = crestMaterials[crestName] || 0;
    if (available < cost) { toast_("Need " + cost + " " + crestName + " materials (have " + available + ")", T.coral); return; }

    var newStages = Object.assign({}, stages, { [crestName]: currentStage + 1 });
    var newMats   = Object.assign({}, crestMaterials, { [crestName]: available - cost });
    var ci = CREST_INFO[crestName];

    var updateDigi = function(d){ return d.uid === digiUid ? Object.assign({}, d, { crestStages: newStages }) : d; };
    setParty(function(p){ return p.map(updateDigi); });
    setFarm(function(f){ return f.map(updateDigi); });
    setCrestMaterials(newMats);

    await supabase.from('digimon').update({ crest_stages: newStages }).eq('id', digiUid);
    await supabase.from('profiles').update({ crest_materials: newMats }).eq('id', userId);

    toast_(digi.name + ": " + crestName + " Stage " + (currentStage+1) + " ✦", ci ? ci.color : T.gold);
    addLog("💎", digi.name + " " + crestName + " Stage " + (currentStage + 1) + " unlocked");
  }

  // ── Adopt-egg: start hatch animation ─────────────────────────────────────────
  function doAdoptHatch() {
    if (!adoptEggSel) return;
    setAdoptEggPhase('hatching');
  }

  // ── Adopt-egg: fired by DigiEgg onHatched after animation plays ──────────────
  async function onAdoptHatched() {
    var speciesId = adoptEggSel.hatchId;
    var s = newDigimon(speciesId, {});
    // Determine farm placement BEFORE the INSERT so the DB row has the correct
    // in_farm value from the start — avoids a realtime race where the INSERT
    // event (always in_farm:false) triggers applyDigimonPayload to add the
    // Digimon to the party before the follow-up update can correct it.
    var partyFull = party.length >= MAX_PARTY_SIZE;
    var { data:newDigi } = await supabase.from('digimon').insert({
      user_id: userId, species_id: speciesId, name: s.name,
      level: 1, exp: 0, exp_needed: 100, abi: 0,
      personality: s.personality, bonus_stats: s.bonusStats || {},
      discovered: [speciesId], in_farm: partyFull, sort_order: partyFull ? farm.length : party.length,
    }).select().single();
    if (!newDigi) { toast_("Something went wrong.", "#FF8080"); setShowAdoptEgg(false); return; }

    var hatched = Object.assign({}, s, { uid: newDigi.id, inFarm: partyFull });
    setAdoptHatchedDigi(hatched);
    setAdoptEggPhase('hatched');
    setAllDisc(function(d){ return d.includes(speciesId) ? d : d.concat([speciesId]); });

    if (!partyFull) {
      setParty(function(p){ return p.concat([hatched]); });
    } else {
      setFarm(function(f){ return f.concat([hatched]); });
    }

    toast_('Welcome, ' + s.name + '! 🥚→✨', T.gold);
    addLog('🥚', 'Adopted ' + s.name + ' from a Digitama');

    setTimeout(function() {
      setShowAdoptEgg(false);
      if (partyFull) {
        setJijiPrompt({ type:'swap', newDigi:hatched });
      } else {
        setJijiPrompt({ type:'leader', newDigi:hatched });
      }
    }, 900);
  }

  // ── Adopt-egg: swap a party member out for the hatched digimon ───────────────
  async function adoptSwapIn(partyMemberUid) {
    var newDigi = jijiPrompt && jijiPrompt.newDigi;
    var member  = party.find(function(x){ return x.uid === partyMemberUid; });
    if (!newDigi || !member) return;
    await supabase.from('digimon').update({ in_farm:true  }).eq('id', partyMemberUid);
    await supabase.from('digimon').update({ in_farm:false }).eq('id', newDigi.uid);
    setParty(function(p){ return p.filter(function(x){ return x.uid !== partyMemberUid; }).concat([Object.assign({}, newDigi, { inFarm:false })]); });
    setFarm(function(f){ return f.filter(function(x){ return x.uid !== newDigi.uid; }).concat([Object.assign({}, member, { inFarm:true })]); });
    toast_(member.name + ' sent to farm. ' + newDigi.name + ' joined the party!', T.teal);
    setJijiPrompt({ type:'leader', newDigi:newDigi });
  }

  // ── Evolution banner helper ──────────────────────────────────────────────────
  var evoTargets = useMemo(function() {
    if (!activeInfo || !activeDigi) return [];
    return (activeInfo.evolvesTo||[]).filter(function(id){
      var t = DIGIMON_MAP[id];
      if (!t||t.fusionOf) return false;
      var { eligible, vow } = checkEvoEligible(activeDigi, bond, crestProfile, id);
      return eligible || vow;
    });
  }, [activeDigi, activeInfo, bond, crestProfile]);

  // ── CSS ───────────────────────────────────────────────────────────────────────
  var css = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:${T.bg}; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px; }
    select option { background:${T.bgCard}; color:${T.text}; }
    input, select, textarea, button { font-family:'Nunito',sans-serif; }
    .px8  { font-family:'Press Start 2P',monospace; font-size:8px; }
    .px9  { font-family:'Press Start 2P',monospace; font-size:9px; }
    .px10 { font-family:'Press Start 2P',monospace; font-size:10px; }
    .px12 { font-family:'Press Start 2P',monospace; font-size:12px; }
    @keyframes bob      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes sleepBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fadeUp   { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes slideUp  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes evoIn    { 0%{opacity:0;transform:scale(0.88)} 100%{opacity:1;transform:scale(1)} }
    @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes floatUp  { from{transform:translateY(100vh) rotate(0deg);opacity:0.12} to{transform:translateY(-10vh) rotate(180deg);opacity:0} }
    @keyframes jijiIn   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes zzzFloat { 0%{opacity:0;transform:translateY(0) scale(0.8)} 30%{opacity:0.9} 100%{opacity:0;transform:translateY(-48px) scale(1.2)} }
    @keyframes timingSlide { from{left:0%} to{left:calc(100% - 18px)} }
    .mg-tile { font-family:'Press Start 2P',monospace; font-size:14px; padding:14px 10px; border:2px solid #2a2d3a; background:#161a22; cursor:pointer; transition:all 0.1s; flex:1; text-align:center; }
    .mg-tile:hover { background:#1e2330; }
    .mg-tile.reveal { border-color:#FFD700; background:#2a2200; color:#FFD700; box-shadow:0 0 10px #FFD700aa; }
    .mg-tile.correct { border-color:#5CB85C; background:#0a200a; color:#5CB85C; }
    .mg-tile.wrong   { border-color:#FF4444; background:#200a0a; color:#FF4444; }
    .page-in { animation: slideUp 0.22s ease; }
    .pcard { background:${T.bgCard}; border:2px solid ${T.border}; box-shadow:3px 3px 0 ${T.border}; }
    .nav-pill { font-family:'Press Start 2P',monospace; font-size:7px; padding:7px 11px; border:2px solid ${T.border}; background:transparent; cursor:pointer; color:${T.textMid}; transition:all 0.1s; white-space:nowrap; }
    .nav-pill:hover,.nav-pill.active { background:${T.bgCard}; color:${T.text}; transform:translate(-1px,-1px); box-shadow:2px 2px 0 ${T.border}; }
    .nav-pill.active { border-color:var(--accent); color:var(--accent); box-shadow:2px 2px 0 var(--accent); }
    .nav-pill.group-active { border-color:var(--accent); color:var(--accent); }
    .nav-drop-item { font-family:'Press Start 2P',monospace; font-size:8px; padding:10px 12px; border:none; border-bottom:1px solid ${T.border}; background:${T.bgPanel}; cursor:pointer; color:${T.textMid}; text-align:left; width:100%; transition:background 0.1s; display:flex; align-items:center; gap:7px; }
    .nav-drop-item:last-child { border-bottom:none; }
    .nav-drop-item:hover { background:${T.bgCard}; color:${T.text}; }
    .nav-drop-item.active { color:var(--accent); background:${T.bgCard}; }
    .task-card { background:${T.bgCard}; border:2px solid ${T.border}; box-shadow:3px 3px 0 ${T.border}; padding:13px 14px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:all 0.12s; position:relative; overflow:hidden; }
    .task-card:hover { transform:translate(-2px,-2px); box-shadow:5px 5px 0 ${T.border}; }
    .task-card.done  { opacity:0.45; }
    .task-card::before { content:''; position:absolute; left:0;top:0;bottom:0; width:4px; }
    .tc-high::before   { background:${T.coral}; }
    .tc-medium::before { background:${T.teal}; }
    .tc-low::before    { background:${T.lavender}; }
    .tc-urgent::before { background:${T.red}; }
    .task-check { width:22px; height:22px; border:2px solid ${T.border}; background:${T.bgPanel}; display:grid; place-items:center; flex-shrink:0; cursor:pointer; transition:background 0.1s; }
    .task-check.checked { background:${T.teal}; }
    .pet-btn { font-family:'Press Start 2P',monospace; font-size:7px; padding:9px 6px; border:2px solid ${T.border}; cursor:pointer; text-align:center; display:flex; align-items:center; justify-content:center; gap:4px; transition:all 0.1s; }
    .pet-btn:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 ${T.border}; }
    .pet-btn:active { transform:translate(2px,2px); box-shadow:none !important; }
    .pet-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
    .task-tab { font-family:'Press Start 2P',monospace; font-size:7px; padding:8px 12px; cursor:pointer; border:none; border-right:2px solid ${T.border}; background:${T.bgCard}; color:${T.textMid}; transition:all 0.1s; }
    .task-tab:last-child { border-right:none; }
    .task-tab.active { background:${T.bg}; color:var(--accent); }
    .inv-slot { aspect-ratio:1; border:2px solid ${T.border}; background:${T.bgPanel}; display:grid; place-items:center; font-size:18px; cursor:pointer; transition:all 0.1s; position:relative; }
    .inv-slot:hover { transform:translate(-1px,-1px); box-shadow:2px 2px 0 ${T.border}; background:${T.bgCard}; }
    .digi-card { background:${T.bgCard}; border:2px solid ${T.border}; padding:12px; cursor:grab; transition:all 0.12s; }
    .digi-card:hover { border-color:var(--accent); box-shadow:2px 2px 0 var(--accent); }
    .battle-tile { background:${T.bgCard}; border:2px solid ${T.border}; padding:12px; text-align:center; cursor:pointer; transition:all 0.12s; }
    .battle-tile.enemy:hover { border-color:${T.coral}; box-shadow:2px 2px 0 ${T.coral}; }
    .battle-tile.player.active { border-color:var(--accent); box-shadow:2px 2px 0 var(--accent); }
    .store-row { background:${T.bgCard}; border:2px solid ${T.border}; padding:12px 14px; display:flex; align-items:center; gap:12px; transition:all 0.12s; }
    .store-row:hover { border-color:${T.gold}; box-shadow:2px 2px 0 ${T.gold}; }
    .particle { position:fixed; pointer-events:none; width:6px; height:6px; border:1.5px solid ${T.border}; opacity:0.08; animation:floatUp linear infinite; }
    .sec-label { font-family:'Press Start 2P',monospace; font-size:7px; color:${T.textDim}; display:flex; align-items:center; gap:10px; padding:4px 0; }
    .sec-label::after { content:''; flex:1; height:1px; background:${T.border}; opacity:0.6; }
    .sec-title { font-family:'Press Start 2P',monospace; font-size:8px; color:${T.text}; margin-bottom:12px; display:flex; align-items:center; gap:10px; }
    .sec-title::after { content:''; flex:1; height:2px; background:${T.border}; }
    .evo-banner { background:linear-gradient(90deg,#1a1f3a,#1f2a3a,#1a1f3a); background-size:200% auto; animation:shimmer 3s linear infinite; border:2px solid ${T.lavender}; box-shadow:3px 3px 0 ${T.lavender}; padding:10px 14px; display:flex; align-items:center; gap:10px; cursor:pointer; }
    .crest-bar-fill { height:100%; transition:width 0.8s ease; position:relative; }
    .crest-bar-fill::after { content:''; position:absolute; top:2px; left:3px; right:3px; height:3px; background:rgba(255,255,255,0.25); }
    .main-grid { display:grid; grid-template-columns:300px 1fr 260px; min-height:calc(100vh - 64px); position:relative; z-index:1; }
    @media (max-width:1200px) { .main-grid { grid-template-columns:260px 1fr; } .right-col { display:none !important; } }
    @media (max-width:768px)  { .main-grid { grid-template-columns:1fr; } .main-content { padding:12px !important; } }
    @media (max-width:480px)  { .nav-pill { font-size:7px; padding:7px 9px; } .nav-drop-item { font-size:7px; } .px8 { font-size:8px; } .px12 { font-size:12px; } }

    /* ── Mobile native layout ── */
    /* CSS safety net — fires even before JS class applies */
    @media (max-width:768px) {
      nav.top-nav { display:none !important; }
      .mob-tab-bar { display:flex !important; }
      .main-grid { display:flex !important; flex-direction:column !important; height:calc(100vh - 60px) !important; min-height:unset !important; overflow:hidden !important; }
      .right-col { display:none !important; }
      .left-col  { display:none !important; }
      .main-content { flex:1 !important; overflow-y:auto !important; min-height:0 !important; padding:12px 14px 16px !important; }
    }
    /* JS-class driven — for manual override on larger screens */
    .is-mobile nav.top-nav { display:none !important; }
    .is-mobile .main-grid { display:flex !important; flex-direction:column !important; height:calc(100vh - 60px) !important; min-height:unset !important; overflow:hidden !important; }
    .is-mobile .right-col  { display:none !important; }
    .is-mobile .left-col   { display:none !important; }
    .is-mobile .main-content { flex:1 !important; overflow-y:auto !important; min-height:0 !important; padding:12px 14px 16px !important; }

    /* PET tab — left-col fills the screen, main-content hidden */
    .is-mobile.pet-page .left-col,
    .pet-page .left-col { display:flex !important; flex:1 !important; min-height:0 !important; overflow-y:auto !important; border-right:none !important; padding:0 !important; }
    .is-mobile.pet-page .main-content,
    .pet-page .main-content { display:none !important; }

    /* Mobile compact character strip */
    .mob-char-strip { display:none; }
    .is-mobile:not(.pet-page) .mob-char-strip { display:flex !important; position:sticky; top:0; z-index:150; }

    /* Mobile bottom tab bar */
    .mob-tab-bar { display:none; position:fixed; bottom:0; left:0; right:0; z-index:250; height:60px; }
    .is-mobile .mob-tab-bar { display:flex !important; }
    .mob-tab-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; flex:1; border:none; background:transparent; cursor:pointer; padding:4px 2px; border-top:2.5px solid transparent; transition:color 0.1s; font-family:inherit; }
  `;

  // ── Onboarding completion handler ────────────────────────────────────────────
  // ids: array of up to 3 baby species IDs (e.g. ["botamon","jyarimon","pichimon"])
  async function handleOnboardingComplete(ids) {
    // Guard against double-insertion (e.g. refresh mid-onboarding)
    var { data: alreadyOwned } = await supabase.from('digimon').select('id').eq('user_id', userId).limit(1);
    if (alreadyOwned && alreadyOwned.length > 0) {
      localStorage.setItem('dv_onboarding_' + userId, '1');
      setShowOnboarding(false);
      setPage('tasks');
      return;
    }
    var idList = Array.isArray(ids) ? ids.filter(Boolean) : ids ? [ids] : [];
    var newParty = [];
    for (var i = 0; i < idList.length; i++) {
      var sid = idList[i];
      var d   = newDigimon(sid);
      if (!d) continue;
      var row = {
        user_id: userId, species_id: d.speciesId, name: d.name,
        level: 1, exp: 0, exp_needed: 100, abi: 0, personality: d.personality,
        bonus_stats: {}, discovered: [sid], in_farm: false, sort_order: i,
      };
      var { data:saved } = await supabase.from('digimon').insert(row).select().single();
      if (saved) newParty.push(Object.assign({}, d, { uid: saved.id, inFarm: false }));
    }
    // If nothing was created, fall back to botamon so the app isn't empty
    if (newParty.length === 0) {
      var fallback = newDigimon('botamon');
      var { data:fb } = await supabase.from('digimon').insert({
        user_id: userId, species_id: 'botamon', name: fallback.name,
        level: 1, exp: 0, exp_needed: 100, abi: 0, personality: fallback.personality,
        bonus_stats: {}, discovered: ['botamon'], in_farm: false, sort_order: 0,
      }).select().single();
      if (fb) newParty.push(Object.assign({}, fallback, { uid: fb.id }));
    }
    setParty(newParty);
    setFarm([]);
    // Seed discovered list so all 3 starters appear in the Digidex immediately
    setAllDisc(idList.filter(Boolean));
    localStorage.setItem('dv_onboarding_' + userId, '1');
    setShowOnboarding(false);
    setPage('tasks');
  }

  // ── Loading / onboarding gates ────────────────────────────────────────────────
  if (!appReady) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", color:T.textMid, fontFamily:"'Nunito',sans-serif", fontSize:11, letterSpacing:2 }}>
        LOADING...
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        tamerName={tamerName}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  var activeBg = BACKGROUNDS.find(function(b){ return b.id === selectedBg; }) || BACKGROUNDS[0];

  return (
    <div className={"dv-app" + (isMobile ? " is-mobile" : "") + (isMobile && page === 'dashboard' ? " pet-page" : "")} style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Nunito',sans-serif", "--accent":accent }}>
      <style>{css}</style>

      {/* Particles */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden" }} aria-hidden="true">
        {[{l:"5%",d:"12s",c:T.teal},{l:"18%",d:"9s",c:T.lavender,dd:"2s"},{l:"35%",d:"15s",c:accent,dd:"4s"},{l:"58%",d:"11s",c:T.coral,dd:"1s"},{l:"74%",d:"14s",c:T.mint,dd:"6s"},{l:"90%",d:"10s",c:T.gold,dd:"3s"}].map(function(p,i){
          return <div key={i} className="particle" style={{ left:p.l, animationDuration:p.d, animationDelay:p.dd||"0s", background:p.c }}/>;
        })}
      </div>

      {/* ── QUICK-ADD TASK MODAL ──────────────────────────────────────────── */}
      {showQuickAdd && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:700,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto",WebkitOverflowScrolling:"touch" }}
          onClick={function(e){ if(e.target===e.currentTarget){ document.activeElement?.blur(); setShowQuickAdd(false); setQuickAddForm({title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:""}); } }}>
          <div style={{ width:"100%",maxWidth:480,marginTop:"auto",marginBottom:"auto" }}>
            <div style={{ background:T.bgCard,border:"2px solid "+accent,boxShadow:"4px 4px 0 "+accent,padding:"16px 16px 0",marginBottom:0 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                <div className="px12" style={{ color:accent }}>NEW TASK</div>
                <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 4px" }}
                  onClick={function(){ document.activeElement?.blur(); setShowQuickAdd(false); setQuickAddForm({title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:""}); }}>×</button>
              </div>
            </div>
            <TaskForm
              form={quickAddForm}
              setForm={setQuickAddForm}
              accent={accent}
              T={T}
              label="ADD TASK"
              onSubmit={function(){
                if(!quickAddForm.title.trim()) return;
                document.activeElement?.blur();
                window.scrollTo(0,0);
                addTask(quickAddForm);
                setShowQuickAdd(false);
                setQuickAddForm({title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:""});
              }}
              onCancel={function(){
                document.activeElement?.blur();
                setShowQuickAdd(false);
                setQuickAddForm({title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:""});
              }}
            />
          </div>
        </div>
      )}

      {/* ── ADOPT EGG MODAL ──────────────────────────────────────────────── */}
      {showAdoptEgg && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:720,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"24px 16px 80px",overflowY:"auto" }}>
          <div className="px10" style={{ color:T.gold,letterSpacing:3,marginBottom:4,marginTop:8 }}>ADOPT AN EGG</div>
          <div style={{ fontSize:13,fontWeight:700,color:T.textMid,marginBottom:20,textAlign:"center" }}>
            {adoptEggPhase==='select'  ? 'Choose a Digitama to bring home:'
             :adoptEggPhase==='hatching'? 'Hatching…'
             : 'Welcome to the family!'}
          </div>

          {/* ── Egg picker ── */}
          {adoptEggPhase==='select' && (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,width:"100%",maxWidth:560,marginBottom:20,maxHeight:"60vh",overflowY:"auto",paddingRight:4 }}>
                {ALL_EGGS.map(function(egg){
                  return (
                    <DigiEgg
                      key={egg.file}
                      eggFile={egg.file}
                      label={egg.label}
                      desc={egg.crest}
                      selected={!!(adoptEggSel && adoptEggSel.file===egg.file)}
                      onClick={function(){ setAdoptEggSel(egg); }}
                      phase="idle"
                      size={64}
                    />
                  );
                })}
              </div>
              {adoptEggSel && (
                <div style={{ marginBottom:12,padding:"10px 16px",background:T.bgCard,border:"1.5px solid "+T.gold,maxWidth:360,width:"100%",textAlign:"center" }}>
                  <div style={{ fontSize:13,fontWeight:800,color:T.gold,marginBottom:4 }}>{adoptEggSel.label}</div>
                  <div style={{ fontSize:11,color:T.textMid }}>{adoptEggSel.desc}</div>
                </div>
              )}
              <div style={{ display:"flex",gap:10 }}>
                <button className="px8"
                  disabled={!adoptEggSel}
                  onClick={doAdoptHatch}
                  style={{ padding:"11px 26px",background:adoptEggSel?T.gold+"22":"transparent",border:"2px solid "+(adoptEggSel?T.gold:T.textDim),color:adoptEggSel?T.gold:T.textDim,cursor:adoptEggSel?"pointer":"not-allowed",fontSize:"12px",boxShadow:adoptEggSel?"2px 2px 0 "+T.gold:"none" }}>
                  HATCH EGG
                </button>
                <button className="px8"
                  onClick={function(){ setShowAdoptEgg(false); }}
                  style={{ padding:"11px 18px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}>
                  CANCEL
                </button>
              </div>
            </>
          )}

          {/* ── Hatch animation ── */}
          {(adoptEggPhase==='hatching'||adoptEggPhase==='hatched') && adoptEggSel && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>
              <DigiEgg
                eggFile={adoptEggSel.file}
                label={adoptEggSel.label}
                phase={adoptEggPhase}
                size={120}
                onHatched={onAdoptHatched}
              />
              {adoptEggPhase==='hatching' && (
                <div className="px8" style={{ color:T.gold,fontSize:"10px",animation:"blink 1s step-end infinite" }}>HATCHING…</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── JIJIMON INTERACTIVE PROMPT (adopt-egg flow) ─────────────────── */}
      {jijiPrompt && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:715,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 40px" }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,maxWidth:520,width:"calc(100% - 32px)",padding:0,animation:"jijiIn 0.3s ease",overflow:"hidden" }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(90deg,#1a1800,#1f1f0a)",borderBottom:"2px solid "+T.gold,padding:"10px 16px",display:"flex",alignItems:"center",gap:10 }}>
              <img src="/sprites/jijimon.gif" alt="Jijimon" style={{ width:36,height:36,objectFit:"contain",imageRendering:"pixelated",flexShrink:0 }}/>
              <div className="px9" style={{ color:T.gold }}>JIJIMON</div>
            </div>
            {/* Body */}
            <div style={{ padding:"18px 20px" }}>

              {/* Prompt: make leader */}
              {jijiPrompt.type==='leader' && (
                <>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text,lineHeight:1.7,marginBottom:18 }}>
                    "{jijiPrompt.newDigi.name} has joined your party! Would you like to make them your party leader?"
                  </div>
                  <div style={{ display:"flex",gap:10 }}>
                    <button className="px8" onClick={function(){ setLeader(jijiPrompt.newDigi.uid); setJijiPrompt(null); }}
                      style={{ padding:"8px 20px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"12px",boxShadow:"2px 2px 0 "+T.gold }}>
                      YES, LEAD!
                    </button>
                    <button className="px8" onClick={function(){ setJijiPrompt(null); }}
                      style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}>
                      NO THANKS
                    </button>
                  </div>
                </>
              )}

              {/* Prompt: party full — offer swap */}
              {jijiPrompt.type==='swap' && (
                <>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text,lineHeight:1.7,marginBottom:18 }}>
                    "Your party is full! {jijiPrompt.newDigi.name} has been sent to the DigiFarm for now. Would you like to swap them in for a party member?"
                  </div>
                  <div style={{ display:"flex",gap:10 }}>
                    <button className="px8" onClick={function(){ setJijiPrompt({ type:'swapPick', newDigi:jijiPrompt.newDigi }); }}
                      style={{ padding:"8px 20px",background:T.teal+"22",border:"2px solid "+T.teal,color:T.teal,cursor:"pointer",fontSize:"12px",boxShadow:"2px 2px 0 "+T.teal }}>
                      YES, SWAP IN
                    </button>
                    <button className="px8" onClick={function(){ setJijiPrompt(null); }}
                      style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}>
                      LEAVE IN FARM
                    </button>
                  </div>
                </>
              )}

              {/* Prompt: pick which party member to replace */}
              {jijiPrompt.type==='swapPick' && (
                <>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text,lineHeight:1.7,marginBottom:14 }}>
                    "Who should make way for {jijiPrompt.newDigi.name}? Tap a party member to send them to the DigiFarm."
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:14 }}>
                    {party.map(function(m){
                      return (
                        <button key={m.uid} onClick={function(){ adoptSwapIn(m.uid); }}
                          style={{ background:T.bgPanel,border:"2px solid "+T.border,padding:"10px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",transition:"border-color 0.1s" }}
                          onMouseOver={function(e){ e.currentTarget.style.borderColor=T.coral; }}
                          onMouseOut={function(e){ e.currentTarget.style.borderColor=T.border; }}>
                          <DigiSprite digimonId={m.speciesId} size={36} animate={false}/>
                          <div>
                            <div style={{ fontSize:13,fontWeight:800,color:T.text }}>{m.name}</div>
                            <div className="px8" style={{ fontSize:"10px",color:T.textMid,marginTop:2 }}>Lv.{m.level} · → Farm</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button className="px8" onClick={function(){ setJijiPrompt(null); }}
                    style={{ padding:"7px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"11px" }}>
                    CANCEL — LEAVE IN FARM
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── JIJIMON MODAL ─────────────────────────────────────────────────── */}
      {jijimonModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.80)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 40px" }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,maxWidth:520,width:"calc(100% - 32px)",padding:0,animation:"jijiIn 0.3s ease",overflow:"hidden" }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(90deg,#1a1800,#1f1f0a)",borderBottom:"2px solid "+T.gold,padding:"10px 16px",display:"flex",alignItems:"center",gap:10 }}>
              <img src="/sprites/jijimon.gif" alt="Jijimon" style={{ width:36,height:36,objectFit:"contain",imageRendering:"pixelated",flexShrink:0 }}/>
              <div className="px9" style={{ color:T.gold }}>JIJIMON</div>
              <div style={{ flex:1 }}/>
              <button onClick={function(){ dismissJijimon(false); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 4px" }}>×</button>
            </div>
            {/* Body */}
            <div style={{ padding:"18px 20px" }}>
              <div style={{ fontSize:14,fontWeight:700,color:T.text,lineHeight:1.7,marginBottom:18 }}>
                "{jijimonModal.msg}"
              </div>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <button className="px8" onClick={function(){ dismissJijimon(false); }} style={{ padding:"8px 18px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"12px",boxShadow:"2px 2px 0 "+T.gold }}>GOT IT</button>
                <button className="px8" onClick={function(){ dismissJijimon(true); }} style={{ padding:"8px 14px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}>HIDE TIPS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED PANEL ────────────────────────────────────────────────────── */}
      {showFeedPanel && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.60)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.pink,boxShadow:"4px 4px 0 "+T.pink,padding:16,width:"100%",maxWidth:320,animation:"jijiIn 0.2s ease",maxHeight:"90vh",overflowY:"auto" }}>
            <div className="px9" style={{ color:T.pink,marginBottom:12 }}>🍎 FEED PARTNER</div>
            <div style={{ fontSize:11,color:T.textMid,marginBottom:12 }}>
              Stamina: {stamina}/{STAMINA_MAX} · Food cap: {Math.max(0,STAMINA_FOOD_CAP-foodStaminaToday)} left today
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
              {FOOD_ITEMS.map(function(food) {
                var canAfford = bits >= food.cost;
                var capLeft = STAMINA_FOOD_CAP - foodStaminaToday;
                return (
                  <div key={food.id} className="store-row" style={{ padding:"10px 12px",borderColor:canAfford&&capLeft>0?T.pink:T.border,cursor:canAfford&&capLeft>0?"pointer":"not-allowed",opacity:canAfford&&capLeft>0?1:0.4 }}
                    onClick={function(){ if(canAfford&&capLeft>0) feedFood(food); }}>
                    <span style={{ fontSize:20 }}>{food.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:800 }}>{food.name}</div>
                      <div className="px8" style={{ color:T.textMid,fontSize:"11px",marginTop:2 }}>+{food.stamina}⚡  +{food.bond}💗</div>
                    </div>
                    <div className="px8" style={{ color:canAfford?T.gold:T.textDim,fontSize:"11px" }}>{food.cost}🪙</div>
                  </div>
                );
              })}
            </div>
            <button className="px8" onClick={function(){ setShowFeedPanel(false); }} style={{ padding:"7px 14px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"11px" }}>CLOSE</button>
          </div>
        </div>
      )}

      {/* ── POMODORO MODAL ────────────────────────────────────────────────── */}
      {pomodoroState && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:610,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.mint,boxShadow:"4px 4px 0 "+T.mint,width:"100%",maxWidth:380,animation:"jijiIn 0.3s ease",overflow:"hidden" }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(90deg,#0a1a10,#0f1f12)",borderBottom:"2px solid "+T.mint,padding:"10px 16px",display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:16 }}>⏱</span>
              <div className="px9" style={{ color:T.mint }}>FOCUS TRAINING</div>
              <div style={{ flex:1 }}/>
              {pomodoroState.phase !== 'running' && (
                <button onClick={function(){ setPomodoroState(null); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"0 4px" }}>×</button>
              )}
            </div>

            {/* ── Setup ── */}
            {pomodoroState.phase === 'setup' && (
              <div style={{ padding:20,display:"flex",flexDirection:"column",gap:14 }}>
                <div>
                  <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"12px" }}>TRAINING TYPE</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {["Workout","Deep Work","Recovery","Maintenance","Social","Reflection","Challenge","Wellness"].map(function(t){
                      var cg = calcCrestGain(t,'Medium');
                      var ci = cg ? CREST_INFO[cg.primaryCrest] : null;
                      var sel = pomodoroState.template === t;
                      return (
                        <button key={t} className="px8" onClick={function(){ setPomodoroState(function(ps){ return Object.assign({},ps,{template:t}); }); }}
                          style={{ padding:"5px 9px",border:"2px solid "+(sel?(ci?ci.color:T.mint):T.border),background:sel?(ci?ci.color+"22":T.mint+"22"):"transparent",color:sel?(ci?ci.color:T.mint):T.textMid,cursor:"pointer",fontSize:"11px" }}>
                          {ci&&<><CrestIcon ci={ci} size={13}/>{" "}</>}{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"12px" }}>DURATION</div>
                  <div style={{ display:"flex",gap:8 }}>
                    {[15,25,50].map(function(d){
                      var sel = pomodoroState.duration === d;
                      return (
                        <button key={d} className="px8" onClick={function(){ setPomodoroState(function(ps){ return Object.assign({},ps,{duration:d}); }); }}
                          style={{ flex:1,padding:"9px 0",border:"2px solid "+(sel?T.mint:T.border),background:sel?T.mint+"22":"transparent",color:sel?T.mint:T.textMid,cursor:"pointer",fontSize:"11px" }}>
                          {d} MIN
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Reward preview */}
                <div style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"10px 12px" }}>
                  <div className="px8" style={{ color:T.textDim,marginBottom:6,fontSize:"11px" }}>ON COMPLETION</div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontSize:12,fontWeight:700,color:T.gold }}>+{(pomodoroState.duration||25)*3} XP</span>
                    <span style={{ fontSize:12,fontWeight:700,color:T.pink }}>+1 Bond</span>
                    <span style={{ fontSize:12,fontWeight:700,color:T.gold }}>+75🪙</span>
                    {(function(){
                      var cg = calcCrestGain(pomodoroState.template,'Medium');
                      if (!cg) return null;
                      var ci = CREST_INFO[cg.primaryCrest];
                      return <span style={{ fontSize:12,fontWeight:700,color:ci.color,display:"inline-flex",alignItems:"center",gap:4 }}><CrestIcon ci={ci} size={13}/> +{cg.primary} {cg.primaryCrest}</span>;
                    })()}
                  </div>
                </div>
                <button className="px8" onClick={beginPomodoro} style={{ padding:"12px",background:T.mint,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontSize:"12px",fontWeight:900,boxShadow:"2px 2px 0 "+T.border }}>
                  START SESSION ⚡
                </button>
              </div>
            )}

            {/* ── Running ── */}
            {pomodoroState.phase === 'running' && (
              <div style={{ padding:24,textAlign:"center" }}>
                {/* Circular progress */}
                <div style={{ position:"relative",width:160,height:160,margin:"0 auto 16px" }}>
                  <svg width={160} height={160} style={{ transform:"rotate(-90deg)" }}>
                    <circle cx={80} cy={80} r={68} fill="none" stroke={T.border} strokeWidth={9}/>
                    <circle cx={80} cy={80} r={68} fill="none" stroke={T.mint} strokeWidth={9}
                      strokeDasharray={String(2*Math.PI*68)}
                      strokeDashoffset={String(2*Math.PI*68*(1-pomodoroState.timeLeft/pomodoroState.totalSeconds))}
                      style={{ transition:"stroke-dashoffset 1s linear" }}/>
                  </svg>
                  <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                    <div className="px12" style={{ color:T.mint,letterSpacing:2 }}>
                      {String(Math.floor(pomodoroState.timeLeft/60)).padStart(2,'0')}:{String(pomodoroState.timeLeft%60).padStart(2,'0')}
                    </div>
                    <div className="px8" style={{ color:T.textDim,marginTop:6,fontSize:"10px" }}>REMAINING</div>
                  </div>
                </div>
                <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:4 }}>{pomodoroState.template} Session</div>
                {(function(){
                  var cg = calcCrestGain(pomodoroState.template,'Medium');
                  if (!cg) return null;
                  var ci = CREST_INFO[cg.primaryCrest];
                  return <div style={{ fontSize:11,color:ci.color,marginBottom:16,display:"flex",alignItems:"center",gap:4,justifyContent:"center" }}><CrestIcon ci={ci} size={13}/> Building {cg.primaryCrest} crest</div>;
                })()}
                {activeDigi && <div style={{ marginBottom:16 }}><DigiSprite digimonId={activeDigi.speciesId} size={52} mood="happy"/></div>}
                <div style={{ fontSize:11,color:T.textDim,marginBottom:16,fontStyle:"italic" }}>Stay focused — your partner is counting on you.</div>
                <button className="px8" onClick={function(){ setPomodoroState(null); }}
                  style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"11px" }}>
                  ABANDON SESSION
                </button>
              </div>
            )}

            {/* ── Done ── */}
            {pomodoroState.phase === 'done' && (
              <div style={{ padding:24,textAlign:"center" }}>
                <div style={{ fontSize:48,marginBottom:10 }}>💪</div>
                <div className="px10" style={{ color:T.mint,marginBottom:8,letterSpacing:2 }}>SESSION COMPLETE!</div>
                <div style={{ fontSize:12,color:T.textMid,marginBottom:18,lineHeight:1.7 }}>
                  {Math.floor(pomodoroState.totalSeconds/60)} minutes of focused training.<br/>Your partner grows stronger!
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20 }}>
                  {[
                    { label:"+"+(Math.floor(pomodoroState.totalSeconds/60)*3)+" XP", color:T.gold },
                    { label:"+1 Bond", color:T.pink },
                    { label:"+75🪙",   color:T.gold },
                  ].map(function(r){
                    return <div key={r.label} style={{ padding:"7px 12px",border:"2px solid "+r.color,color:r.color,background:r.color+"18",fontWeight:900,fontSize:13 }}>{r.label}</div>;
                  })}
                  {(function(){
                    var cg = calcCrestGain(pomodoroState.template,'Medium');
                    if(!cg)return null;
                    var ci=CREST_INFO[cg.primaryCrest];
                    return <div style={{ padding:"7px 12px",border:"2px solid "+ci.color,color:ci.color,background:ci.color+"18",fontWeight:900,fontSize:13,display:"flex",alignItems:"center",gap:6 }}><CrestIcon ci={ci} size={16}/> +{cg.primary}</div>;
                  })()}
                </div>
                <button className="px8" onClick={claimPomodoroReward}
                  style={{ padding:"11px 28px",background:T.mint,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontSize:"12px",boxShadow:"2px 2px 0 "+T.border }}>
                  CLAIM REWARDS ★
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAMER PROFILE ─────────────────────────────────────────────────── */}
      {showTamerProfile && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:610,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={function(e){ if(e.target===e.currentTarget)setShowTamerProfile(false); }}>
          <div style={{ background:T.bgCard,border:"2px solid "+accent,boxShadow:"4px 4px 0 "+accent,width:"100%",maxWidth:500,animation:"jijiIn 0.3s ease",overflow:"hidden",maxHeight:"90vh",overflowY:"auto" }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(90deg,#1a1400,#1a1a00)",borderBottom:"2px solid "+accent,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:2 }}>
              <span style={{ fontSize:16 }}>✦</span>
              <div className="px9" style={{ color:accent }}>TAMER PROFILE</div>
              <div style={{ flex:1 }}/>
              <button onClick={function(){ setShowTamerProfile(false); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"0 4px" }}>×</button>
            </div>

            <div style={{ padding:20,display:"flex",flexDirection:"column",gap:16 }}>
              {/* Identity */}
              <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:64,height:64,border:"2px solid "+accent,background:T.bgPanel,display:"grid",placeItems:"center",flexShrink:0,boxShadow:"3px 3px 0 "+accent }}>
                  {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={52} mood="happy"/>}
                </div>
                <div style={{ flex:1 }}>
                  {editingName ? (
                    <form style={{ display:"flex",gap:6,alignItems:"center" }} onSubmit={function(e){ e.preventDefault(); saveTamerName(e.target.elements.name.value); }}>
                      <input name="name" defaultValue={tamerName} maxLength={20} autoFocus
                        style={{ fontFamily:"'Press Start 2P',monospace",fontSize:11,color:T.text,background:T.bgPanel,border:"2px solid "+accent,padding:"4px 8px",outline:"none",width:130 }}/>
                      <button type="submit" style={{ background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",padding:"4px 8px",fontFamily:"'Press Start 2P',monospace",fontSize:"11px" }}>✓</button>
                      <button type="button" onClick={function(){ setEditingName(false); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:14 }}>×</button>
                    </form>
                  ) : (
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ fontSize:20,fontWeight:900,color:T.text }}>{tamerName}</div>
                      <button onClick={function(){ setEditingName(true); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:11,padding:0 }} title="Edit name">✏</button>
                    </div>
                  )}
                  <div className="px8" style={{ color:accent,marginTop:3,fontSize:"11px" }}>
                    {crestProfile.primary ? (CREST_TITLES[crestProfile.primary]||"DigiDestined") : "Novice DigiDestined"}
                  </div>
                  <div style={{ fontSize:11,color:T.textMid,marginTop:5 }}>
                    DigiDestined since {new Date(session.user.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"10px 14px" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:6 }}>TAMER LOCATION</div>
                {editingLocation ? (
                  <form style={{ display:"flex",gap:6,alignItems:"center" }}
                    onSubmit={function(e){ e.preventDefault(); saveTamerLocation(e.target.elements.loc.value); }}>
                    <input name="loc" defaultValue={tamerLocation} maxLength={50} autoFocus placeholder="e.g. Tokyo, Japan"
                      style={{ fontFamily:"'Press Start 2P',monospace",fontSize:10,color:T.text,background:T.bgCard,border:"2px solid "+accent,padding:"4px 8px",outline:"none",flex:1,minWidth:0 }}/>
                    <button type="submit" style={{ background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",padding:"4px 8px",fontFamily:"'Press Start 2P',monospace",fontSize:"10px" }}>✓</button>
                    <button type="button" onClick={function(){ setEditingLocation(false); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:14,padding:"0 2px" }}>×</button>
                  </form>
                ) : (
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ fontSize:12,color:tamerLocation?T.text:T.textDim }}>{tamerLocation || "Not set"}</div>
                    <button onClick={function(){ setEditingLocation(true); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:11,padding:0 }} title="Edit location">✏</button>
                  </div>
                )}
                <div style={{ fontSize:"9px",color:T.textDim,marginTop:5,lineHeight:1.5 }}>Used to identify your local time zone for carryover tasks</div>
              </div>

              {/* Stats grid */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {[
                  { label:"TAMER LEVEL",    val:"Lv."+tamerLevel+" ("+tamerXp+"/"+TAMER_XP_PER_LEVEL+" XP)", color:T.gold },
                  { label:"PARTNER",        val:activeDigi?activeDigi.name:"—",                  color:accent },
                  { label:"BOND STRENGTH",  val:Math.round(bond)+"/100",                          color:T.pink },
                  { label:"LOGIN STREAK",   val:loginStreak+" days 🔥",                           color:T.coral },
                  { label:"TODAY'S TASKS",  val:doneToday.length+" completed",                   color:T.green },
                  { label:"DIGIMON KNOWN",  val:allDisc.length+"/"+Object.keys(DIGIMON_MAP).length, color:T.lavender },
                ].map(function(s){
                  return (
                    <div key={s.label} style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"10px 12px" }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:5 }}>{s.label}</div>
                      <div style={{ fontSize:14,fontWeight:900,color:s.color }}>{s.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Crest identity block */}
              {crestProfile.primary && (
                <div style={{ background:T.bgPanel,border:"1.5px solid "+(CREST_INFO[crestProfile.primary].color),padding:"12px 14px",display:"flex",gap:12,alignItems:"center",boxShadow:"2px 2px 0 "+(CREST_INFO[crestProfile.primary].color) }}>
                  <div style={{ fontSize:36 }}><CrestIcon ci={CREST_INFO[crestProfile.primary]} size={44}/></div>
                  <div style={{ flex:1 }}>
                    <div className="px8" style={{ color:T.textDim,fontSize:"11px",marginBottom:4 }}>PRIMARY CREST</div>
                    <div style={{ fontSize:17,fontWeight:900,color:CREST_INFO[crestProfile.primary].color }}>{crestProfile.primary}</div>
                    <div style={{ fontSize:11,color:T.textMid,marginTop:3 }}>{CREST_INFO[crestProfile.primary].desc}</div>
                  </div>
                  {crestProfile.secondary&&<>
                    <div style={{ width:1,height:44,background:T.border,flexShrink:0 }}/>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:26 }}><CrestIcon ci={CREST_INFO[crestProfile.secondary]} size={32}/></div>
                      <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginTop:4 }}>SUPPORT</div>
                      <div style={{ fontSize:11,fontWeight:800,color:CREST_INFO[crestProfile.secondary].color,marginTop:2 }}>{crestProfile.secondary}</div>
                    </div>
                  </>}
                </div>
              )}

              {/* Crest Compass */}
              <div>
                <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"12px" }}>CREST COMPASS</div>
                <div style={{ display:"flex",justifyContent:"center" }}>
                  <CrestCompass crestProfile={crestProfile} size={280}/>
                </div>
              </div>

              {/* Lore flavour */}
              <div style={{ background:"linear-gradient(135deg,#1a1400,#1a1a00)",border:"1.5px solid "+T.gold+"44",padding:"12px 14px" }}>
                <div className="px8" style={{ color:T.gold,marginBottom:6,fontSize:"11px" }}>✦ TAMER'S OATH</div>
                <div style={{ fontSize:12,color:T.textMid,lineHeight:1.7,fontStyle:"italic" }}>
                  "I will complete my missions, nurture my partner, and face every challenge with courage. The Digital World grows alongside me."
                </div>
              </div>

              {/* Hearth callout — Journey & Background moved to Babamon's Hearth */}
              <div style={{ background:"linear-gradient(135deg,#1a0f00,#1a1400)",border:"1.5px solid #FFB34744",padding:"14px 16px",display:"flex",flexDirection:"column",gap:8 }}>
                <div className="px8" style={{ color:"#FFB347",fontSize:"11px" }}>🏡 BABAMON'S HEARTH</div>
                <div style={{ fontSize:11,color:"#c8b89a",lineHeight:1.6 }}>Visit Babamon to relive your Digivolution Journey, hear Digimon tales, and set your world backdrop.</div>
                <button className="px8"
                  onClick={function(){ setShowTamerProfile(false); setPage("hearth"); }}
                  style={{ alignSelf:"flex-start",padding:"6px 12px",background:"#FFB34722",border:"1.5px solid #FFB34788",color:"#FFB347",cursor:"pointer",fontSize:"10px" }}>
                  Go to Hearth →
                </button>
              </div>

              {/* Danger zone */}
              <div style={{ borderTop:"1px solid "+T.coral+"44",paddingTop:12,marginTop:4 }}>
                <div className="px8" style={{ color:T.textDim,marginBottom:8,fontSize:"10px" }}>DANGER ZONE</div>
                <button className="px8" style={{ width:"100%",padding:"9px 12px",background:T.coral+"11",border:"1.5px solid "+T.coral+"88",color:T.coral,cursor:"pointer",fontSize:"11px",textAlign:"left" }}
                  onClick={function(){ setShowTamerProfile(false); setConfirmReset(true); }}>
                  ⚠ RESET TEAM — Release all Digimon and start fresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM RESET ────────────────────────────────────────────────── */}
      {confirmReset && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:620,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.coral,boxShadow:"4px 4px 0 "+T.coral,padding:28,maxWidth:360,textAlign:"center",display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ fontSize:36 }}>⚠️</div>
            <div className="px10" style={{ color:T.coral }}>RESET TEAM?</div>
            <div style={{ fontSize:12,fontWeight:700,color:T.textMid,lineHeight:1.6 }}>
              All current Digimon will be released. You will receive a Digitama to choose a new starting partner. This cannot be undone.
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <button className="px8" style={{ padding:"8px 16px",background:T.coral+"22",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"12px" }}
                onClick={resetToStarters}>CONFIRM RESET</button>
              <button className="px8" style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}
                onClick={function(){ setConfirmReset(false); }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECONNECT ARC MODAL ──────────────────────────────────────────── */}
      {showReconnectModal && neglectData && (function(){
        var nlvl2  = neglectData.level;
        var days2  = neglectData.daysAbsent;
        var pers2  = activeDigi && activeDigi.personality;
        var msgFns = pers2 && RECONNECT_MSG[pers2] ? RECONNECT_MSG[pers2] : RECONNECT_MSG.durable;
        var msgFn  = msgFns[nlvl2] || msgFns.dormant;
        var msg2   = activeDigi ? msgFn(activeDigi.name, days2) : "Your partner survived alone. Welcome back, Tamer.";
        var borderC = nlvl2==="critical"?"#cc2222":nlvl2==="unstable"?"#9B59B6":T.textDim;
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:640,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
            <div style={{ background:T.bgCard,border:"2px solid "+borderC,boxShadow:"4px 4px 0 "+borderC,maxWidth:440,width:"100%",padding:0,overflow:"hidden",animation:"jijiIn 0.3s ease" }}>
              {/* Header */}
              <div style={{ background:borderC+"22",borderBottom:"2px solid "+borderC+"44",padding:"16px 20px",display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ fontSize:36 }}>{nlvl2==="critical"?"💀":nlvl2==="unstable"?"😶":nlvl2==="dormant"?"💤":"😌"}</div>
                <div>
                  <div className="px10" style={{ color:borderC }}>
                    {nlvl2==="critical"?"CORRUPTION RISK"
                    :nlvl2==="unstable"?"PARTNER UNSTABLE"
                    :nlvl2==="dormant"?"PARTNER DORMANT"
                    :"PARTNER QUIET"}
                  </div>
                  <div className="px8" style={{ color:T.textMid,fontSize:"10px",marginTop:2 }}>{days2} days absent — reconnection arc begins</div>
                </div>
              </div>
              {/* Partner portrait */}
              {activeDigi && (
                <div style={{ display:"flex",justifyContent:"center",padding:"16px 20px 0" }}>
                  <DigiSprite digimonId={activeDigi.speciesId} size={72} animate mood={nlvl2==="critical"||nlvl2==="unstable"?"hurt":"sad"}/>
                </div>
              )}
              {/* Message */}
              <div style={{ padding:"14px 20px 0" }}>
                <div style={{ fontSize:13,fontWeight:700,color:T.text,lineHeight:1.7,fontStyle:"italic" }}>"{msg2}"</div>
              </div>
              {/* Recovery info */}
              <div style={{ padding:"14px 20px",background:T.bgPanel,margin:"14px 20px",border:"1.5px solid "+T.border }}>
                <div className="px8" style={{ color:T.textMid,fontSize:"10px",marginBottom:8 }}>RECONNECTION ARC</div>
                <div style={{ fontSize:11,color:T.textMid,lineHeight:1.6 }}>Complete <strong style={{ color:T.pink }}>3 tasks</strong> to restore the bond. Your partner survived alone — and changed. Guide them forward.</div>
                <div style={{ display:"flex",gap:6,marginTop:10,flexWrap:"wrap" }}>
                  <span className="px8" style={{ padding:"3px 8px",border:"1.5px solid "+T.teal,color:T.teal,fontSize:"10px" }}>→ Bond restored +15</span>
                  <span className="px8" style={{ padding:"3px 8px",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"10px" }}>→ Normal path continues</span>
                </div>
              </div>
              {neglectData.sukamonRisk && (
                <div style={{ padding:"0 20px 14px" }}>
                  <div style={{ padding:"10px 12px",background:"#9B59B622",border:"2px solid #9B59B6" }}>
                    <div className="px8" style={{ color:"#9B59B6",fontSize:"10px",marginBottom:4 }}>⚠ CORRUPTION RISK DETECTED</div>
                    <div style={{ fontSize:11,color:T.textMid,lineHeight:1.6 }}>Bond was low ({Math.round(bond)}/100) and absence was long. A darker evolution path is forming. You'll face a choice.</div>
                  </div>
                </div>
              )}
              <div style={{ padding:"0 20px 20px" }}>
                <button className="px8" style={{ width:"100%",padding:"10px",background:borderC+"22",border:"2px solid "+borderC,color:borderC,cursor:"pointer",fontSize:"12px" }}
                  onClick={function(){
                    setShowReconnectModal(false);
                    if (neglectData && neglectData.sukamonRisk && !neglectData.sukamonOffered) {
                      setTimeout(function(){ setShowSukamonModal(true); }, 400);
                    }
                  }}>
                  BEGIN RECONNECTION ARC ✦
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── NEGLECT PATH MODAL (Sukamon or Numemon) ───────────────────────── */}
      {showSukamonModal && neglectData && (function(){
        var nPath    = NEGLECT_PATHS[neglectData.neglectPath] || NEGLECT_PATHS.sukamon;
        var isSuka   = neglectData.neglectPath !== "numemon";
        var spriteId = nPath.champion;  // sukamon or numemon
        var darkMsg  = isSuka
          ? "Your partner's data grew chaotic during the long absence. It felt abandoned — and something darker answered. You can embrace this path, or fight your way back."
          : "Your partner withdrew into itself during your absence. The routines slipped away and a reclusive form took hold. Choose to accept this path, or rebuild what was lost.";
        var embraceLabel = isSuka ? "EMBRACE THE DARK" : "ACCEPT WITHDRAWAL";
        var embraceDesc  = isSuka
          ? "Sukamon path unlocked. High Power, chaotic nature. Redemption arc still possible."
          : "Numemon path unlocked. Reclusive but resilient. Redemption arc still possible.";
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:641,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
            <div style={{ background:T.bgCard,border:"2px solid #9B59B6",boxShadow:"4px 4px 0 #9B59B6",maxWidth:400,width:"100%",padding:0,overflow:"hidden",animation:"jijiIn 0.3s ease" }}>
              <div style={{ background:"linear-gradient(135deg,#100010,#180018,#100010)",borderBottom:"2px solid #9B59B644",padding:"20px",textAlign:"center" }}>
                <div style={{ fontSize:48,marginBottom:8 }}>{isSuka ? "💀" : "🌑"}</div>
                <div className="px10" style={{ color:"#9B59B6",letterSpacing:2 }}>A DARKER PATH OPENS</div>
                <div style={{ fontSize:10,color:T.textMid,marginTop:4 }}>{nPath.label}</div>
              </div>
              <div style={{ padding:"20px" }}>
                <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}>
                  <DigiSprite digimonId={spriteId} size={56} animate mood="angry"/>
                </div>
                <div style={{ fontSize:12,fontWeight:700,color:T.text,lineHeight:1.7,marginBottom:14 }}>
                  {darkMsg}
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
                  <div style={{ padding:"10px 12px",background:"#9B59B622",border:"1.5px solid #9B59B6" }}>
                    <div className="px8" style={{ color:"#9B59B6",fontSize:"10px",marginBottom:4 }}>{embraceLabel}</div>
                    <div style={{ fontSize:10,color:T.textMid,lineHeight:1.5 }}>{embraceDesc}</div>
                  </div>
                  <div style={{ padding:"10px 12px",background:T.pink+"22",border:"1.5px solid "+T.pink }}>
                    <div className="px8" style={{ color:T.pink,fontSize:"10px",marginBottom:4 }}>REBUILD THE BOND</div>
                    <div style={{ fontSize:10,color:T.textMid,lineHeight:1.5 }}>Fight the corruption. Complete the Reconnection Arc. Normal path continues + Bond +15.</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <button className="px8" style={{ flex:1,padding:"9px",background:"#9B59B622",border:"2px solid #9B59B6",color:"#9B59B6",cursor:"pointer",fontSize:"11px" }}
                    onClick={acceptSukamon}>{isSuka ? "EMBRACE IT 💀" : "ACCEPT IT 🌑"}</button>
                  <button className="px8" style={{ flex:1,padding:"9px",background:T.pink+"22",border:"2px solid "+T.pink,color:T.pink,cursor:"pointer",fontSize:"11px" }}
                    onClick={rejectSukamon}>FIGHT IT 💗</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── DEDIGIVOLVE CONFIRM ──────────────────────────────────────────── */}
      {dedigivolveConfirm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.90)",zIndex:620,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.coral,boxShadow:"4px 4px 0 "+T.coral,padding:28,maxWidth:380,textAlign:"center",display:"flex",flexDirection:"column",gap:16,animation:"jijiIn 0.2s ease" }}>
            <div style={{ fontSize:32 }}>↩</div>
            <div className="px10" style={{ color:T.coral }}>DEDIGIVOLVE?</div>
            <div style={{ display:"flex",justifyContent:"center",gap:18,alignItems:"center",padding:"12px 0" }}>
              <div style={{ textAlign:"center" }}>
                {(function(){ var _dd = party.find(function(d){return d.uid===dedigivolveConfirm.uid;})||farm.find(function(d){return d.uid===dedigivolveConfirm.uid;}); return _dd ? <DigiSprite digimonId={_dd.speciesId} size={56} animate mood="sad"/> : null; })()}
                <div style={{ fontSize:11,fontWeight:800,color:T.text,marginTop:4 }}>{dedigivolveConfirm.digiName}</div>
              </div>
              <div style={{ fontSize:22,color:T.coral }}>→</div>
              <div style={{ textAlign:"center" }}>
                <DigiSprite digimonId={dedigivolveConfirm.prevId} size={56} animate mood="walk"/>
                <div style={{ fontSize:11,fontWeight:800,color:T.text,marginTop:4 }}>{dedigivolveConfirm.prevName}</div>
              </div>
            </div>
            <div style={{ fontSize:12,fontWeight:700,color:T.textMid,lineHeight:1.6 }}>
              {dedigivolveConfirm.digiName} will revert to {dedigivolveConfirm.prevName}.<br/>
              <span style={{ color:T.coral }}>This cannot be undone.</span> Use this to switch digivolution branches.
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <button className="px8" style={{ padding:"8px 16px",background:T.coral+"22",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"12px" }}
                onClick={confirmDedigivolve}>CONFIRM</button>
              <button className="px8" style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}
                onClick={function(){ setDedigivolveConfirm(null); }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIGITAMA MODAL ───────────────────────────────────────────────── */}
      {showDigitamaModal && digitamaCredits > 0 && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:615,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto" }}>
          <div style={{ fontSize:48,marginBottom:8 }}>🥚</div>
          <div className="px10" style={{ color:T.gold,letterSpacing:3,marginBottom:4 }}>CHOOSE YOUR PARTNER</div>
          <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:24,textAlign:"center",maxWidth:380 }}>
            Select a Digitama to hatch your new partner:
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20,maxWidth:480 }}>
            {[
              { id:"flame",  label:"Flame",  color:"#FF6B35", shimmer:"#FFD700", desc:"Agumon line" },
              { id:"beast",  label:"Beast",  color:"#7EB8F7", shimmer:"#C3B1E1", desc:"Gabumon line" },
              { id:"dragon", label:"Dragon", color:"#C3B1E1", shimmer:"#FF9EB5", desc:"Guilmon line" },
              { id:"nature", label:"Nature", color:"#5CB85C", shimmer:"#A8E6CF", desc:"Palmon line" },
              { id:"holy",   label:"Holy",   color:"#FFE066", shimmer:"#FFFFFF", desc:"Coronamon line" },
            ].map(function(egg){
              return (
                <button key={egg.id} onClick={function(){ hatchDigitama(egg.id); }}
                  style={{ background:"transparent",border:"2px solid "+egg.color,boxShadow:"3px 3px 0 "+egg.color,padding:14,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,fontFamily:"'Press Start 2P',monospace" }}>
                  <svg width={48} height={58} viewBox="0 0 48 58">
                    <ellipse cx="24" cy="32" rx="18" ry="23" fill={egg.color} opacity="0.9"/>
                    <ellipse cx="17" cy="22" rx="5" ry="8"  fill="rgba(255,255,255,0.3)"/>
                    <ellipse cx="24" cy="32" rx="18" ry="23" fill="none" stroke={egg.shimmer} strokeWidth="1.5" opacity="0.7"/>
                  </svg>
                  <div style={{ fontSize:"11px",color:egg.color,fontWeight:900 }}>{egg.label}</div>
                  <div style={{ fontSize:"10px",color:T.textMid,textAlign:"center" }}>{egg.desc}</div>
                </button>
              );
            })}
          </div>
          {party.length > 0 && (
            <button className="px8" style={{ padding:"8px 20px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}
              onClick={function(){ setShowDigitamaModal(false); }}>SAVE FOR LATER</button>
          )}
          {party.length === 0 && (
            <div className="px8" style={{ color:T.coral,marginTop:4,fontSize:"11px" }}>You must choose a partner to continue</div>
          )}
          {digitamaCredits > 1 && <div className="px8" style={{ color:T.gold,marginTop:8,fontSize:"11px" }}>×{digitamaCredits} eggs available — each pick uses 1</div>}
        </div>
      )}

      {/* ── REST MODAL ───────────────────────────────────────────────────── */}
      {showRestModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:620,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
          onClick={function(e){ if(e.target===e.currentTarget)setShowRestModal(false); }}>
          <RestModal
            sleepState={sleepState}
            sleepLog={sleepLog}
            activeDigi={activeDigi}
            T={T}
            accent={accent}
            onStart={startRest}
            onWake={function(){ handleWakeUp(sleepState, sleepLog, true); setShowRestModal(false); }}
            onClose={function(){ setShowRestModal(false); }}
          />
        </div>
      )}

      {/* ── WAKE GREETING ────────────────────────────────────────────────── */}
      {wakeGreeting && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:625,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={function(){ setWakeGreeting(null); }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,padding:28,maxWidth:380,textAlign:"center",display:"flex",flexDirection:"column",gap:14,animation:"jijiIn 0.3s ease" }}>
            <div style={{ fontSize:36 }}>🌅</div>
            <div className="px10" style={{ color:T.gold }}>GOOD MORNING!</div>
            {activeDigi && (
              <div style={{ display:"flex",justifyContent:"center",marginBottom:4 }}>
                <DigiSprite digimonId={activeDigi.speciesId} size={64} mood="happy"/>
              </div>
            )}
            <div style={{ fontSize:12,fontWeight:700,color:T.text,lineHeight:1.7 }}>
              {wakeGreeting.msg}
            </div>
            <div style={{ display:"flex",gap:16,justifyContent:"center",background:T.bgPanel,padding:"10px 14px",border:"1px solid "+T.border }}>
              <div style={{ textAlign:"center" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:3 }}>SLEEP TIME</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.lavender }}>
                  {Math.floor(wakeGreeting.duration/60)}h {wakeGreeting.duration%60}m
                </div>
              </div>
              <div style={{ width:1,background:T.border }}/>
              <div style={{ textAlign:"center" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:3 }}>BEDTIME</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.teal }}>
                  {wakeGreeting.entry&&wakeGreeting.entry.bedtime}
                </div>
              </div>
              <div style={{ width:1,background:T.border }}/>
              <div style={{ textAlign:"center" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:3 }}>WAKE</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.gold }}>
                  {wakeGreeting.entry&&wakeGreeting.entry.waketime}
                </div>
              </div>
            </div>
            <button className="px8" style={{ padding:"8px 20px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"12px" }}
              onClick={function(){ setWakeGreeting(null); }}>
              START THE DAY ✦
            </button>
          </div>
        </div>
      )}

      {/* ── LOGIN REWARD MODAL ───────────────────────────────────────────── */}
      {showLoginReward && pendingLoginReward && (function(){
        var reward = pendingLoginReward;
        var isSelector = !!reward.materialSelector;
        var isDigitama  = !!reward.digitamaSelector;
        var canClaim = !isSelector || loginRewardSel;
        var isMilestone = reward.day === 30 || reward.day === 60;
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:636,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}>
            <div style={{ background:T.bgCard,border:"3px solid "+(isMilestone?T.gold:T.teal),boxShadow:"4px 4px 0 "+(isMilestone?T.gold:T.teal),maxWidth:420,width:"100%",animation:"jijiIn 0.3s ease" }}>
              {/* Header */}
              <div style={{ background:(isMilestone?T.gold:T.teal)+"18",borderBottom:"2px solid "+(isMilestone?T.gold:T.teal)+"44",padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ fontSize:isMilestone?36:28 }}>{isMilestone?"🎁":"📅"}</div>
                <div>
                  <div className="px10" style={{ color:isMilestone?T.gold:T.teal }}>
                    {isMilestone ? "MILESTONE REWARD" : "DAILY LOGIN REWARD"}
                  </div>
                  <div style={{ fontSize:11,color:T.textMid }}>Day {loginDay + 1} of 60</div>
                </div>
              </div>
              {/* Rewards list */}
              <div style={{ padding:"16px 18px",display:"flex",flexDirection:"column",gap:10 }}>
                {reward.bits > 0 && (
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.gold+"12",border:"1.5px solid "+T.gold }}>
                    <span style={{ fontSize:22 }}>🪙</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:900,color:T.gold }}>+{reward.bits} Bits</div>
                    </div>
                  </div>
                )}
                {reward.material && (function(){
                  var ci = CREST_INFO[reward.material.crest];
                  return (
                    <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:ci.color+"12",border:"1.5px solid "+ci.color }}>
                      <CrestIcon ci={ci} size={22}/>
                      <div>
                        <div style={{ fontSize:13,fontWeight:900,color:ci.color }}>+{reward.material.amount} {reward.material.crest} Materials</div>
                        <div style={{ fontSize:10,color:T.textDim }}>Spend to unlock crest stages on your partner</div>
                      </div>
                    </div>
                  );
                })()}
                {isDigitama && (
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.pink+"18",border:"1.5px solid "+T.pink }}>
                    <span style={{ fontSize:22 }}>🥚</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:900,color:T.pink }}>Digitama Egg Selector</div>
                      <div style={{ fontSize:10,color:T.textDim }}>Choose any egg to hatch a new partner</div>
                    </div>
                  </div>
                )}
                {reward.armorDigi > 0 && (
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.lavender+"18",border:"1.5px solid "+T.lavender }}>
                    <span style={{ fontSize:22 }}>⚔️</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:900,color:T.lavender }}>×{reward.armorDigi} Armor Digivolution Item</div>
                      <div style={{ fontSize:10,color:T.textDim }}>Unlocks a special armor digivolution form</div>
                    </div>
                  </div>
                )}
                {/* Material selector */}
                {isSelector && (
                  <div style={{ marginTop:4 }}>
                    <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"11px" }}>
                      CHOOSE ×{reward.materialSelector.amount} CREST MATERIAL
                    </div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                      {Object.entries(CREST_INFO).map(function([name, ci]){
                        var sel = loginRewardSel === name;
                        return (
                          <button key={name}
                            onClick={function(){ setLoginRewardSel(name); }}
                            style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",background:sel?ci.color+"30":"transparent",border:"2px solid "+(sel?ci.color:T.border),color:sel?ci.color:T.textMid,cursor:"pointer",fontSize:"11px",fontWeight:sel?900:400 }}>
                            <CrestIcon ci={ci} size={14}/>{name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Claim button */}
              <div style={{ padding:"0 18px 16px" }}>
                <button
                  onClick={function(){ claimLoginReward(loginRewardSel); }}
                  disabled={!canClaim}
                  style={{ width:"100%",padding:"10px 0",background:canClaim?(isMilestone?T.gold:T.teal)+"22":"transparent",border:"2px solid "+(canClaim?(isMilestone?T.gold:T.teal):T.border),color:canClaim?(isMilestone?T.gold:T.teal):T.textDim,cursor:canClaim?"pointer":"not-allowed",fontFamily:"inherit",fontSize:"12px",fontWeight:900 }}>
                  {isSelector && !loginRewardSel ? "SELECT A CREST FIRST" : (isDigitama ? "CLAIM & SELECT EGG →" : "CLAIM REWARD")}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LOGIN REWARD CALENDAR ────────────────────────────────────────── */}
      {showRewardCalendar && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:637,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}
          onClick={function(){ setShowRewardCalendar(false); }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,maxWidth:520,width:"100%",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column" }}
            onClick={function(e){ e.stopPropagation(); }}>
            {/* Header */}
            <div style={{ background:T.gold+"18",borderBottom:"2px solid "+T.gold+"44",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div>
                <div className="px10" style={{ color:T.gold }}>LOGIN REWARD CALENDAR</div>
                <div style={{ fontSize:11,color:T.textMid }}>Day {loginDay} of 60 completed</div>
              </div>
              <button onClick={function(){ setShowRewardCalendar(false); }} style={{ background:"transparent",border:"none",color:T.textMid,cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
            {/* Calendar grid */}
            <div style={{ overflowY:"auto",padding:"14px 16px" }}>
              {/* Page nav */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                <button onClick={function(){ setCalendarPage(0); }} disabled={calendarPage===0}
                  style={{ background:"transparent",border:"1.5px solid "+(calendarPage===0?T.border:T.gold),color:calendarPage===0?T.textDim:T.gold,cursor:calendarPage===0?"default":"pointer",padding:"3px 10px",fontSize:13,lineHeight:1 }}>◀</button>
                <span style={{ fontSize:11,color:T.textMid }}>Days {calendarPage===0?"1–30":"31–60"}</span>
                <button onClick={function(){ setCalendarPage(1); }} disabled={calendarPage===1}
                  style={{ background:"transparent",border:"1.5px solid "+(calendarPage===1?T.border:T.gold),color:calendarPage===1?T.textDim:T.gold,cursor:calendarPage===1?"default":"pointer",padding:"3px 10px",fontSize:13,lineHeight:1 }}>▶</button>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4 }}>
                {LOGIN_REWARDS.filter(function(r){ return calendarPage===0 ? r.day<=30 : r.day>30; }).map(function(r){
                  var isPast    = r.day <= loginDay;
                  var isToday   = r.day === loginDay + 1;
                  var isMile    = r.day === 30 || r.day === 60;
                  var isWeek7   = r.day % 7 === 0;
                  var borderCol = isPast ? T.textDim : isToday ? T.teal : isMile ? T.gold : isWeek7 ? T.lavender : T.border;
                  var bg        = isPast ? T.textDim+"10" : isToday ? T.teal+"18" : isMile ? T.gold+"18" : isWeek7 ? T.lavender+"12" : T.bgPanel;
                  var iconEl = isPast
                    ? <span style={{ fontSize:14 }}>✓</span>
                    : r.digitamaSelector
                      ? <span style={{ fontSize:14 }}>🥚</span>
                      : r.armorDigi
                        ? <span style={{ fontSize:14 }}>⚔️</span>
                        : r.materialSelector
                          ? <span style={{ fontSize:14 }}>💫</span>
                          : r.material
                            ? <CrestIcon ci={CREST_INFO[r.material.crest]} size={16} />
                            : <span style={{ fontSize:14 }}>🪙</span>;
                  return (
                    <div key={r.day} style={{ border:"1.5px solid "+borderCol,background:bg,padding:"6px 4px",textAlign:"center",position:"relative",opacity:isPast?0.5:1 }}>
                      <div style={{ fontSize:9,color:isPast?T.textDim:isToday?T.teal:isMile?T.gold:T.textMid,fontWeight:isToday||isMile?900:400,marginBottom:2 }}>{r.day}</div>
                      <div style={{ lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:16 }}>{iconEl}</div>
                      {r.bits > 0 && !isPast && <div style={{ fontSize:8,color:T.gold,marginTop:1 }}>+{r.bits}</div>}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginTop:12 }}>
                {[
                  { col:T.teal,    label:"Today" },
                  { col:T.lavender,label:"Week Bonus" },
                  { col:T.gold,    label:"Milestone (Day 30/60)" },
                ].map(function(l){
                  return <div key={l.label} style={{ display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.textDim }}>
                    <div style={{ width:10,height:10,background:l.col+"44",border:"1px solid "+l.col }}/>
                    {l.label}
                  </div>;
                })}
                <div style={{ fontSize:10,color:T.textDim,marginLeft:"auto" }}>💫 = Pick any crest · 🥚 = Choose egg</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CATCH-UP MODAL (Jijimon — missed yesterday's tasks) ─────────── */}
      {showCatchupModal && catchupTasks.length > 0 && (function(){
        var jijiLine = catchupLineRef.current;
        var anyChecked = catchupTasks.some(function(t){ return catchupChecked[t.id]; });
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:635,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}>
            <div style={{ background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,maxWidth:440,width:"100%",overflow:"hidden",animation:"jijiIn 0.3s ease" }}>

              {/* Header */}
              <div style={{ background:T.gold+"18",borderBottom:"2px solid "+T.gold+"44",padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ fontSize:30 }}>📋</div>
                <div>
                  <div className="px10" style={{ color:T.gold }}>CARRYOVER TASKS</div>
                  <div className="px8" style={{ color:T.textMid,fontSize:"10px",marginTop:2 }}>Uncollected rewards — claim what's yours</div>
                </div>
              </div>

              {/* Jijimon portrait + speech */}
              <div style={{ padding:"16px 18px 0",display:"flex",gap:14,alignItems:"flex-start" }}>
                <div style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                  <div style={{ width:56,height:56,border:"2px solid "+T.gold,background:"#1a1500",display:"grid",placeItems:"center",overflow:"hidden" }}>
                    <DigiSprite digimonId="jijimon" size={52} mood="idle" animate/>
                  </div>
                  <div className="px8" style={{ color:T.gold,fontSize:"9px",textAlign:"center" }}>JIJIMON</div>
                </div>
                <div style={{ background:T.bgPanel,border:"1.5px solid "+T.gold+"66",padding:"10px 13px",flex:1,position:"relative" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:T.text,lineHeight:1.75,fontStyle:"italic" }}>
                    "{jijiLine}"
                  </div>
                  {/* speech bubble tail */}
                  <div style={{ position:"absolute",left:-8,top:14,width:0,height:0,borderTop:"6px solid transparent",borderBottom:"6px solid transparent",borderRight:"8px solid "+T.gold+"66" }}/>
                </div>
              </div>

              {/* Task checklist */}
              <div style={{ padding:"14px 18px 0" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:8 }}>DID YOU COMPLETE ANY OF THESE YESTERDAY?</div>
                <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:220,overflowY:"auto" }}>
                  {catchupTasks.map(function(t) {
                    var checked = !!catchupChecked[t.id];
                    var diffColor = t.difficulty==="Hard"?T.coral:t.difficulty==="Easy"?T.teal:T.gold;
                    return (
                      <button key={t.id}
                        onClick={function(){ setCatchupChecked(function(prev){ var next=Object.assign({},prev); next[t.id]=!prev[t.id]; return next; }); }}
                        style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:checked?T.gold+"18":T.bgPanel,border:"1.5px solid "+(checked?T.gold:T.border),cursor:"pointer",textAlign:"left",width:"100%",transition:"background 0.15s" }}>
                        {/* Checkbox */}
                        <div style={{ width:16,height:16,border:"2px solid "+(checked?T.gold:T.textDim),background:checked?T.gold:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000" }}>
                          {checked ? "✓" : ""}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:11,fontWeight:700,color:checked?T.text:T.textMid,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
                          <div style={{ display:"flex",gap:6,marginTop:3,flexWrap:"wrap" }}>
                            <span className="px8" style={{ fontSize:"9px",color:diffColor }}>{t.difficulty || "Medium"}</span>
                            <span className="px8" style={{ fontSize:"9px",color:T.textDim }}>{t.template}</span>
                            {t.type==="once"&&t.dueDate && <span className="px8" style={{ fontSize:"9px",color:T.coral }}>Due {t.dueDate}</span>}
                          </div>
                        </div>
                        {checked && <div style={{ fontSize:14,flexShrink:0 }}>⭐</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reward preview */}
              {anyChecked && (function(){
                var n = catchupTasks.filter(function(t){ return catchupChecked[t.id]; }).length;
                return (
                  <div style={{ margin:"12px 18px 0",padding:"9px 12px",background:T.gold+"11",border:"1.5px solid "+T.gold+"44",display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ fontSize:18 }}>🌟</div>
                    <div style={{ fontSize:10,fontWeight:700,color:T.gold,lineHeight:1.6 }}>
                      Claiming rewards for <strong>{n}</strong> task{n!==1?"s":""} — XP, Bond, and Crest points from yesterday.
                    </div>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div style={{ padding:"14px 18px 18px",display:"flex",gap:10 }}>
                <button className="px8" style={{ flex:1,padding:"10px",background:anyChecked?T.gold+"22":"transparent",border:"2px solid "+(anyChecked?T.gold:T.textDim),color:anyChecked?T.gold:T.textDim,cursor:"pointer",fontSize:"11px" }}
                  onClick={claimCatchupRewards}>
                  {anyChecked ? "CLAIM REWARDS ✦" : "CLAIM REWARDS"}
                </button>
                <button className="px8" style={{ padding:"10px 14px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"11px" }}
                  onClick={function(){ setShowCatchupModal(false); }}>
                  SKIP
                </button>
              </div>
              <div style={{ padding:"0 18px 14px",textAlign:"center" }}>
                <div style={{ fontSize:"10px",color:T.textDim,lineHeight:1.6 }}>No guilt either way. Yesterday's effort still shaped who you are today.</div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── DIGIDEX DETAIL MODAL ─────────────────────────────────────────── */}
      {digidexEntry && (function(){
        var d = DIGIMON_MAP[digidexEntry];
        if (!d) return null;
        var known = allDisc.includes(digidexEntry);
        var stCol = STAGE_COLOR[d.stage] || "#aaa";
        var role  = ROLES[d.role] || ROLES.Balanced;
        // Build reverse map: who evolves INTO this?
        var allDigi = Object.values(DIGIMON_MAP);
        var prevIds = allDigi.filter(function(x){ return x.evolvesTo && x.evolvesTo.includes(digidexEntry); }).map(function(x){ return x.id; });
        var nextIds = d.evolvesTo || [];
        var evoReq  = EVO_REQUIREMENTS[d.stage] || {};
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:630,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}
            onClick={function(e){ if(e.target===e.currentTarget) setDigidexEntry(null); }}>
            <div style={{ background:T.bgCard,border:"2px solid "+stCol,boxShadow:"4px 4px 0 "+stCol,maxWidth:480,width:"100%",display:"flex",flexDirection:"column",gap:0,overflow:"hidden",maxHeight:"calc(100vh - 32px)",overflowY:"auto" }}>

              {/* Header */}
              <div style={{ background:stCol+"18",borderBottom:"2px solid "+stCol+"44",padding:"18px 20px",display:"flex",alignItems:"center",gap:16 }}>
                <DigiSprite digimonId={digidexEntry} size={72} animate={false} mood="walk"/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18,fontWeight:900,color:known?T.text:T.textDim,marginBottom:4 }}>{d.name}</div>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                    <span className="px8" style={{ padding:"2px 8px",background:stCol+"33",border:"1.5px solid "+stCol,color:stCol,fontSize:"10px" }}>{d.stage}</span>
                    <span className="px8" style={{ padding:"2px 8px",border:"1.5px solid "+T.border,color:T.textMid,fontSize:"10px" }}>{d.type}</span>
                    <span className="px8" style={{ padding:"2px 8px",border:"1.5px solid "+(ATTR_COLOR[d.attr]||T.border),color:ATTR_COLOR[d.attr]||T.textMid,fontSize:"10px" }}>{d.attr}</span>
                    {known&&<span className="px8" style={{ padding:"2px 8px",background:role.color+"22",border:"1.5px solid "+role.color,color:role.color,fontSize:"10px" }}>{role.icon} {d.role}</span>}
                  </div>
                </div>
                <button onClick={function(){ setDigidexEntry(null); }}
                  style={{ background:"transparent",border:"2px solid "+T.border,color:T.textMid,fontSize:16,cursor:"pointer",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
              </div>

              {known ? (
                <div style={{ padding:"16px 20px",display:"flex",flexDirection:"column",gap:14 }}>

                  {/* Profile description */}
                  {d.desc && (
                    <div style={{ padding:"10px 13px",background:T.bgPanel,border:"1px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:5,letterSpacing:"0.05em" }}>PROFILE</div>
                      <div style={{ fontSize:11,color:T.textMid,lineHeight:1.75,fontStyle:"italic" }}>{d.desc}</div>
                    </div>
                  )}

                  {/* Battle Stats */}
                  <div>
                    <div className="px8" style={{ color:T.textDim,marginBottom:8,fontSize:"10px" }}>BATTLE STATS</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                      {[["HP",d.hp,T.coral],["SP",d.sp,T.teal],["ATK",d.atk,T.gold],["DEF",d.def,T.lavender],["INT",d.int,"#88BBFF"],["SPD",d.spd,T.mint]].map(function(s){
                        return (
                          <div key={s[0]} style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"6px 8px",textAlign:"center" }}>
                            <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:3 }}>{s[0]}</div>
                            <div style={{ fontSize:13,fontWeight:900,color:s[2] }}>{s[1]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Passive & Signature */}
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <div style={{ padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:4 }}>PASSIVE</div>
                      <div style={{ fontSize:11,fontWeight:700,color:T.text,lineHeight:1.5 }}>{d.passive}</div>
                    </div>
                    <div style={{ padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:4 }}>SIGNATURE MOVE</div>
                      <div style={{ fontSize:11,fontWeight:700,color:T.gold,lineHeight:1.5 }}>{d.signature}</div>
                    </div>
                  </div>

                  {/* Crest Requirement (for THIS form) */}
                  {d.crestReq && (
                    <div style={{ padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:8 }}>IDEAL CREST ALIGNMENT</div>
                      <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                        {[["Primary",d.crestReq.primary],d.crestReq.secondary?["Secondary",d.crestReq.secondary]:null].filter(Boolean).map(function(cr){
                          var ci = CREST_INFO[cr[1]];
                          return (
                            <div key={cr[0]} style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 10px",border:"1.5px solid "+(ci?ci.color:T.border),background:(ci?ci.color:"#888")+"18" }}>
                              {ci&&<CrestIcon ci={ci} size={18}/>}
                              <div>
                                <div className="px8" style={{ color:T.textDim,fontSize:"9px" }}>{cr[0]}</div>
                                <div style={{ fontSize:11,fontWeight:800,color:ci?ci.color:T.textMid }}>{cr[1]}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Digivolution Chain */}
                  <div>
                    <div className="px8" style={{ color:T.textDim,marginBottom:8,fontSize:"10px" }}>DIGIVOLUTION CHAIN</div>

                    {/* Evolves From */}
                    {prevIds.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:6 }}>EVOLVES FROM</div>
                        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                          {prevIds.map(function(pid){
                            var pi = DIGIMON_MAP[pid];
                            if (!pi) return null;
                            var pKnown = allDisc.includes(pid);
                            return (
                              <div key={pid} onClick={function(e){ e.stopPropagation(); setDigidexEntry(pid); }}
                                style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T.bgPanel,border:"1.5px solid "+(pKnown?STAGE_COLOR[pi.stage]+"66":T.border),cursor:"pointer",opacity:pKnown?1:0.5 }}>
                                <DigiSprite digimonId={pid} size={32} animate={false} mood="walk"/>
                                <div>
                                  <div style={{ fontSize:10,fontWeight:800,color:pKnown?T.text:T.textDim }}>{pi.name}</div>
                                  <div className="px8" style={{ color:STAGE_COLOR[pi.stage]||"#aaa",fontSize:"9px" }}>{pi.stage}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Arrow */}
                    {prevIds.length > 0 && nextIds.length > 0 && (
                      <div style={{ textAlign:"center",color:stCol,fontSize:14,marginBottom:10 }}>↓</div>
                    )}

                    {/* Current */}
                    <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:stCol+"18",border:"2px solid "+stCol,marginBottom:nextIds.length>0?10:0 }}>
                      <DigiSprite digimonId={digidexEntry} size={40} animate={false} mood="walk"/>
                      <div>
                        <div style={{ fontSize:12,fontWeight:900,color:T.text }}>{d.name}</div>
                        <div className="px8" style={{ color:stCol,fontSize:"9px" }}>{d.stage} • {d.type} • {d.attr}</div>
                      </div>
                      <span className="px8" style={{ marginLeft:"auto",padding:"2px 6px",background:role.color+"22",border:"1.5px solid "+role.color,color:role.color,fontSize:"9px" }}>{role.icon} {d.role}</span>
                    </div>

                    {/* Evolves To */}
                    {nextIds.length > 0 && (
                      <div>
                        <div style={{ textAlign:"center",color:T.textDim,fontSize:14,marginBottom:8 }}>↓</div>
                        <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:6 }}>EVOLVES INTO</div>
                        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                          {nextIds.map(function(nid){
                            var ni = DIGIMON_MAP[nid];
                            if (!ni) return null;
                            var nKnown = allDisc.includes(nid);
                            var nStCol = STAGE_COLOR[ni.stage] || "#aaa";
                            var nReq   = EVO_REQUIREMENTS[ni.stage] || {};
                            var cr     = ni.crestReq;
                            return (
                              <div key={nid} onClick={function(e){ e.stopPropagation(); setDigidexEntry(nid); }}
                                style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+(nKnown?nStCol+"66":T.border),cursor:"pointer",opacity:nKnown?1:0.55 }}>
                                <DigiSprite digimonId={nid} size={40} animate={false} mood="walk"/>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:11,fontWeight:800,color:nKnown?T.text:T.textDim }}>{ni.name}</div>
                                  <div className="px8" style={{ color:nStCol,fontSize:"9px",marginBottom:4 }}>{ni.stage}</div>
                                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                                    {nReq.level&&<span className="px8" style={{ color:T.textMid,fontSize:"9px" }}>Lv.{nReq.level}</span>}
                                    {nReq.bond&&<span className="px8" style={{ color:T.teal,fontSize:"9px" }}>Bond {nReq.bond}</span>}
                                    {nReq.crestStage&&cr&&(function(){ var sr=CREST_STAGE_EVO_REQ[ni.stage]||{}; return <span className="px8" style={{ color:CREST_INFO[cr.primary]?CREST_INFO[cr.primary].color:T.textMid,fontSize:"9px",display:"inline-flex",alignItems:"center",gap:2 }}><CrestIcon ci={CREST_INFO[cr.primary]} size={9}/> Stg {sr.primary||0}</span>; })()}
                                  </div>
                                </div>
                                <div style={{ color:nStCol,fontSize:12 }}>›</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                /* Undiscovered */
                <div style={{ padding:"32px 20px",textAlign:"center",color:T.textDim }}>
                  <div style={{ fontSize:48,marginBottom:12 }}>?</div>
                  <div className="px8" style={{ fontSize:"12px",marginBottom:6 }}>UNIDENTIFIED DIGIMON</div>
                  <div style={{ fontSize:11,lineHeight:1.6,color:T.textDim }}>This Digimon has not yet been discovered. Digivolve your partner or explore to encounter new species.</div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* ── EVOLUTION OVERLAY ─────────────────────────────────────────────── */}
      {evoAnim && (
        <div onClick={function(){ setEvoAnim(null); }}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 28px",cursor:"pointer",animation:"evoIn 0.6s ease forwards" }}>
          <div style={{ fontSize:52,marginBottom:16 }}>✨</div>
          <DigiSprite digimonId={evoAnim} size={128} mood="happy"/>
          <div className="px10" style={{ marginTop:24,color:accent,letterSpacing:4 }}>DIGIVOLUTION</div>
          <div style={{ marginTop:10,fontSize:24,fontWeight:900 }}>{DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].name}</div>
          <div className="px8" style={{ marginTop:6,color:T.textMid }}>{DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].stage}</div>
          {DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].desc&&(
            <div style={{ marginTop:18,maxWidth:340,fontSize:11,color:T.textDim,lineHeight:1.75,fontStyle:"italic",textAlign:"center" }}>
              {DIGIMON_MAP[evoAnim].desc}
            </div>
          )}
          <div className="px8" style={{ marginTop:28,color:T.textDim,fontSize:"10px",letterSpacing:"0.1em" }}>TAP TO CONTINUE</div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",background:T.bgCard,border:"2px solid "+toast.color,boxShadow:"3px 3px 0 "+toast.color,padding:"9px 20px",zIndex:300,whiteSpace:"nowrap",animation:"slideUp 0.2s ease",color:toast.color,fontWeight:700,fontSize:13 }}>
          {toast.msg}
        </div>
      )}

      {/* Click-outside overlay to close nav dropdowns — must sit BELOW nav z-index (200) so dropdown at z:400 inside nav stays clickable */}
      {openGroup && <div style={{ position:"fixed",inset:0,zIndex:190 }} onClick={function(){ setOpenGroup(null); }}/>}

      {/* ── TOP NAV ───────────────────────────────────────────────────────── */}
      <nav className="top-nav" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 28px",background:T.bgPanel,borderBottom:"2px solid "+T.border,boxShadow:"0 2px 0 "+T.border,position:"sticky",top:0,zIndex:200,gap:12,flexWrap:"wrap" }}>
        <div className="px12" style={{ display:"flex",alignItems:"center",gap:10,color:T.text }}>
          <div style={{ width:10,height:10,background:accent,border:"2px solid "+T.border,animation:"blink 1.2s step-end infinite",display:"inline-block" }}/>
          DAILY<span style={{ color:accent }}>DIGIVOLVE</span>
        </div>
        <div style={{ display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",flexShrink:1,minWidth:0 }}>
          {/* Grouped dropdowns (P.E.T + FILEHAVEN) */}
          {NAV_GROUPS.slice(0,2).map(function(g){
            var isOpen    = openGroup === g.id;
            var hasActive = g.pages.some(function(p){ return p.id === page; });
            var activeLabel = hasActive ? g.pages.find(function(p){ return p.id===page; }).label : null;
            return (
              <div key={g.id} style={{ position:"relative" }}
                onMouseEnter={function(){ clearTimeout(navCloseTimer.current); setOpenGroup(g.id); }}
                onMouseLeave={function(){ navCloseTimer.current = setTimeout(function(){ setOpenGroup(null); }, 150); }}>
                <button
                  className={"nav-pill"+(hasActive?" group-active":"")+(isOpen?" active":"")}
                  onClick={function(){ setOpenGroup(isOpen ? null : g.id); }}>
                  {g.icon} {activeLabel ? g.label+" · "+activeLabel : g.label}
                  <span style={{ marginLeft:5,fontSize:"8px",opacity:0.6 }}>{isOpen?"▲":"▼"}</span>
                </button>
                {isOpen && (
                  <div style={{ position:"absolute",top:"100%",left:0,zIndex:400,border:"2px solid "+T.pixelBorder,boxShadow:"3px 3px 0 "+T.pixelBorder,minWidth:130,overflow:"hidden" }}>
                    {g.pages.map(function(p){
                      return (
                        <button key={p.id} className={"nav-drop-item"+(page===p.id?" active":"")}
                          onClick={function(){ setPage(p.id); setOpenGroup(null); }}>
                          <span style={{ width:14,textAlign:"center",flexShrink:0 }}>{p.icon}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* CHAT — standalone */}
          <button className={"nav-pill"+(page==="chat"?" active":"")}
            onClick={function(){ setPage("chat"); setOpenGroup(null); }}>
            💬 CHAT
          </button>

          {/* CYBERSPACE — grouped dropdown */}
          {(function(){
            var g = NAV_GROUPS[2];
            var isOpen    = openGroup === g.id;
            var hasActive = g.pages.some(function(p){ return p.id === page; });
            var activeLabel = hasActive ? g.pages.find(function(p){ return p.id===page; }).label : null;
            return (
              <div key={g.id} style={{ position:"relative" }}
                onMouseEnter={function(){ clearTimeout(navCloseTimer.current); setOpenGroup(g.id); }}
                onMouseLeave={function(){ navCloseTimer.current = setTimeout(function(){ setOpenGroup(null); }, 150); }}>
                <button
                  className={"nav-pill"+(hasActive?" group-active":"")+(isOpen?" active":"")}
                  onClick={function(){ setOpenGroup(isOpen ? null : g.id); }}>
                  {g.icon} {activeLabel ? g.label+" · "+activeLabel : g.label}
                  <span style={{ marginLeft:5,fontSize:"8px",opacity:0.6 }}>{isOpen?"▲":"▼"}</span>
                </button>
                {isOpen && (
                  <div style={{ position:"absolute",top:"100%",left:0,zIndex:400,border:"2px solid "+T.pixelBorder,boxShadow:"3px 3px 0 "+T.pixelBorder,minWidth:130,overflow:"hidden" }}>
                    {g.pages.map(function(p){
                      return (
                        <button key={p.id} className={"nav-drop-item"+(page===p.id?" active":"")}
                          onClick={function(){ setPage(p.id); setOpenGroup(null); }}>
                          <span style={{ width:14,textAlign:"center",flexShrink:0 }}>{p.icon}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* HOME — standalone */}
          <button className={"nav-pill"+(page==="dashboard"?" active":"")}
            onClick={function(){ setPage("dashboard"); setOpenGroup(null); }}>
            ⌂ HOME
          </button>

          {/* MOBILE toggle */}
          <button className={"nav-pill"+(isMobile?" active":"")}
            onClick={function(){ toggleMobileView(); setOpenGroup(null); }}
            title={isMobile?"Switch to desktop layout":"Switch to mobile layout"}>
            📱 {isMobile?"DESKTOP":"MOBILE"}
          </button>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,border:"2px solid "+T.border,background:T.bgCard,display:"grid",placeItems:"center" }}>
            {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={26} animate={false}/>}
          </div>
          <span style={{ cursor:"pointer" }} onClick={function(){ setShowTamerProfile(true); }}>
            <span style={{ fontWeight:800,fontSize:13,borderBottom:"1px dashed "+T.textDim }}>{tamerName}</span>
            <span className="px8" style={{ marginLeft:5,color:T.gold,fontSize:"10px" }}>Lv{tamerLevel}</span>
          </span>
          <div className="px8" style={{ color:T.gold }}>🪙{bits}</div>
          <div className="px8" style={{ color:"#4ECDC4" }}>⚡{stamina}</div>
          <button onClick={function(){ supabase.auth.signOut(); }} style={{ fontFamily:"'Press Start 2P',monospace",fontSize:"11px",padding:"5px 9px",background:"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.35)",cursor:"pointer" }}>SIGN OUT</button>
        </div>
      </nav>

      {/* ── THREE COLUMN LAYOUT ───────────────────────────────────────────── */}
      <div className="main-grid">

        {/* ═══ LEFT — PET PANEL ══════════════════════════════════════════ */}
        <aside className="left-col" style={{ background:T.bgPanel,borderRight:"2px solid "+T.border,padding:"24px 20px",display:"flex",flexDirection:"column",gap:14,overflowY:"auto" }}>

          {/* Pet stage */}
          {(function(){
            var isMobileHome = isMobile && page === "dashboard";
            var isSleeping  = sleepState && sleepState.phase === 'sleeping';
            var isCountdown = sleepState && sleepState.phase === 'countdown';
            // Neglect visual state
            var nlvl    = neglectData ? neglectData.level : null;
            var isNeglected = !!nlvl;
            var neglectBorderColor = nlvl === "critical" ? "#cc2222"
                                   : nlvl === "unstable" ? "#9B59B6"
                                   : nlvl === "dormant"  ? T.textDim
                                   : T.border;
            var neglectFilter = nlvl === "critical" ? "grayscale(0.6) brightness(0.65)"
                              : nlvl === "unstable" ? "grayscale(0.4) brightness(0.72)"
                              : nlvl === "dormant"  ? "grayscale(0.2) brightness(0.82)"
                              : "none";
            var stageBg = isSleeping
              ? "linear-gradient(160deg,#050810 0%,#080510 50%,#050810 100%)"
              : nlvl === "critical" ? "linear-gradient(160deg,#150005 0%,#100010 50%,#080008 100%)"
              : nlvl === "unstable" ? "linear-gradient(160deg,#0d0015 0%,#0a0012 50%,#0d000d 100%)"
              : nlvl === "dormant"  ? "linear-gradient(160deg,#0a0f16 0%,#080d14 50%,#0a0d14 100%)"
              : "linear-gradient(160deg,#0d1a2a 0%,#0a1520 50%,#120d20 100%)";
            // Overlay tint applied on top of background images to keep neglect/sleep states readable
            var bgOverlay = isSleeping ? "rgba(5,8,16,0.55)"
              : nlvl === "critical"  ? "rgba(21,0,5,0.62)"
              : nlvl === "unstable"  ? "rgba(13,0,21,0.58)"
              : nlvl === "dormant"   ? "rgba(10,15,22,0.50)"
              : "rgba(13,26,42,0.45)";
            var stageAccent = isSleeping ? T.lavender : isNeglected ? neglectBorderColor : T.border;
            return (
              <div style={{ background:activeBg.url?undefined:stageBg, backgroundImage:activeBg.url?"url("+activeBg.url+")":undefined, backgroundSize:activeBg.url?"cover":undefined, backgroundPosition:activeBg.url?"center top":undefined, backgroundRepeat:activeBg.url?"no-repeat":undefined, border:isMobileHome?"none":"2px solid "+stageAccent, boxShadow:isMobileHome?"none":"3px 3px 0 "+stageAccent, height:isMobileHome?"58vh":200, display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",position:"relative",overflow:"hidden",paddingBottom:14,filter:isSleeping?"none":neglectFilter }}>
                {/* Dark tint over background images — keeps neglect/sleep states readable */}
                {activeBg.url && <div style={{ position:"absolute",inset:0,background:bgOverlay,zIndex:0,pointerEvents:"none" }}/>}
                {/* Star field (always) / deeper at night */}
                <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(126,184,247,"+(isSleeping?"0.28":"0.12")+") 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none" }}/>
                {/* Mobile home: stats overlay at top */}
                {isMobileHome && (
                  <div style={{ position:"absolute",top:0,left:0,right:0,background:"rgba(13,15,20,0.78)",padding:"8px 12px",zIndex:4,display:"flex",flexDirection:"column",gap:5 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span className="px10" style={{ color:T.text,fontSize:"10px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{activeDigi&&activeDigi.name}</span>
                      <span className="px8" style={{ background:accent,border:"1px solid "+T.border,padding:"2px 6px",color:T.bg,flexShrink:0,fontSize:"8px" }}>LV.{activeDigi&&activeDigi.level}</span>
                      <span className="px8" style={{ fontSize:"8px",color:"#4ECDC4",flexShrink:0 }}>⚡{stamina}</span>
                      <span className="px8" style={{ fontSize:"8px",color:T.pink,flexShrink:0 }}>💗{Math.round(bond)}</span>
                    </div>
                    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                      <span className="px8" style={{ fontSize:"8px",color:T.gold,flexShrink:0 }}>⭐XP</span>
                      <div style={{ height:4,background:"rgba(255,255,255,0.15)",border:"1px solid "+T.border,overflow:"hidden",flex:1 }}>
                        <div style={{ width:activeDigi?Math.min((activeDigi.exp/activeDigi.expNeeded)*100,100)+"%":"0%",height:"100%",background:T.gold }}/>
                      </div>
                    </div>
                    {neglectData && (
                      <div className="px8" style={{ fontSize:"8px",color:neglectData.level==="critical"?"#cc2222":neglectData.level==="unstable"?"#9B59B6":T.textDim }}>
                        {neglectData.level==="critical"?"⚠ CORRUPTION RISK":neglectData.level==="unstable"?"💀 PARTNER UNSTABLE":neglectData.level==="dormant"?"😶 PARTNER DORMANT":"... PARTNER QUIET"}
                      </div>
                    )}
                  </div>
                )}
                {/* Moon when sleeping */}
                {isSleeping && (
                  <div style={{ position:"absolute",top:10,right:14,fontSize:20,opacity:0.85,zIndex:2 }}>🌙</div>
                )}
                {/* Zzz floating bubbles when sleeping */}
                {isSleeping && (
                  <div style={{ position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:3,overflow:"hidden" }}>
                    {["z","Z","Z"].map(function(z,i){
                      return (
                        <span key={i} style={{
                          position:"absolute",
                          left:(38+i*18)+"%",
                          bottom:(30+i*18)+"%",
                          fontSize:(11+i*4)+"px",
                          color:T.lavender,
                          fontWeight:900,
                          animation:"zzzFloat "+(2.2+i*0.8)+"s ease-in-out "+(i*0.7)+"s infinite",
                          opacity:0,
                        }}>{z}</span>
                      );
                    })}
                  </div>
                )}
                {/* Speech bubble — appears on click, auto-hides after 30 s */}
                {showSpeech && (
                  <div style={{ position:"absolute",top:isMobileHome?"38%":10,left:"50%",background:T.bgCard,border:"2px solid "+(isSleeping?T.lavender:accent),boxShadow:"2px 2px 0 "+(isSleeping?T.lavender:accent),padding:"5px 10px",zIndex:4,animation:"fadeUp 0.3s ease",transform:"translateX(-50%)",maxWidth:220,whiteSpace:"normal",textAlign:"center",cursor:"pointer" }}
                    onClick={function(){ setShowSpeech(false); clearTimeout(speechDismissTimer.current); }}>
                    <span className="px8" style={{ color:isSleeping?T.lavender:accent,fontSize:"11px" }}>{speech}</span>
                    <div style={{ position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"6px solid "+(isSleeping?T.lavender:accent) }}/>
                  </div>
                )}
                {/* Raid hit flash — pops above the sprite when a task is completed */}
                {raidHit && (function(){
                  var sc = { power:"#FF6B35",guard:"#7EB8F7",focus:"#B8A0E8",momentum:"#FFD700" }[raidHit.stat]||"#FF6B35";
                  var si = { power:"⚔",guard:"🛡",focus:"🎯",momentum:"⚡" }[raidHit.stat]||"⚔";
                  return (
                    <div style={{ position:"absolute",top:54,right:8,zIndex:5,background:"rgba(0,0,0,0.88)",border:"2px solid "+sc,boxShadow:"2px 2px 0 "+sc,padding:"4px 9px",animation:"slideUp 0.2s ease",pointerEvents:"none" }}>
                      <div className="px8" style={{ color:sc,fontSize:"11px",whiteSpace:"nowrap" }}>{si} -{raidHit.damage} VenomMyotismon</div>
                    </div>
                  );
                })()}
                {/* Sprite — walks left/right when idle, sleepy when resting */}
                <div style={{
                    position:"absolute",
                    bottom:isMobileHome?"13%":20, zIndex:2,
                    left:"50%",
                    transform:"translateX(calc(-50% + "+petX+"px))",
                    transition:isSleeping?"none":"transform 0.9s ease-in-out",
                    cursor:"pointer",
                  }}
                  onClick={function(){
                    if (isSleeping || isCountdown) { handleWakeUp(sleepState, sleepLog, true); return; }
                    showSpeechBubble(null); // show current speech for 30 s
                  }}>
                  <div style={{ transform:"scaleX("+((!isSleeping&&!isCountdown&&petFacingRight)?-1:1)+")", transformOrigin:"bottom center" }}>
                  <div style={{ animation:isSleeping?"sleepBob 4s ease-in-out infinite":"bob 2s ease-in-out infinite" }}>
                  {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={isMobileHome?130:84}
                    animate
                    mood={isSleeping||isCountdown?"sleepy"
                      :showFeedPanel?"eat"
                      :nlvl==="critical"||nlvl==="unstable"?"hurt"
                      :nlvl==="dormant"?"sad"
                      :bond>=90?"happy"
                      :"walk"}/>}
                  </div>
                  </div>
                </div>
                {/* Mobile home: action buttons on left + right sides */}
                {isMobileHome && (function(){
                  var leftBtns = [
                    { icon:"🍎", label:"FEED",  color:T.pink,    onClick:function(){ setShowFeedPanel(true); }, disabled:false },
                    { icon:"💤", label:sleepState?"ZZZ":"REST",  color:T.lavender, onClick:function(){ setShowRestModal(true); }, disabled:false },
                  ];
                  var rightBtns = [
                    { icon:"🎮", label:playUsedToday>=3?"DONE":("PLAY("+(3-playUsedToday)+")"), color:playAvailable?T.teal:T.textDim, onClick:playAction, disabled:!playAvailable },
                    { icon:"⏱", label:"TRAIN", color:T.mint,    onClick:openPomodoroSetup, disabled:false },
                  ];
                  var btnStyle = function(b){ return { display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,width:52,padding:"7px 4px",background:"rgba(13,15,20,0.82)",border:"1.5px solid "+(b.disabled?T.border:b.color),color:b.disabled?T.textDim:b.color,cursor:b.disabled?"default":"pointer",fontFamily:"inherit",opacity:b.disabled?0.5:1 }; };
                  return (
                    <>
                      <div style={{ position:"absolute",left:8,top:"42%",transform:"translateY(-50%)",zIndex:4,display:"flex",flexDirection:"column",gap:8 }}>
                        {leftBtns.map(function(b){ return (
                          <button key={b.label} disabled={b.disabled} onClick={b.onClick} style={btnStyle(b)}>
                            <span style={{ fontSize:18 }}>{b.icon}</span>
                            <span className="px8" style={{ fontSize:"6px",lineHeight:1.1,textAlign:"center" }}>{b.label}</span>
                          </button>
                        ); })}
                      </div>
                      <div style={{ position:"absolute",right:8,top:"42%",transform:"translateY(-50%)",zIndex:4,display:"flex",flexDirection:"column",gap:8 }}>
                        {rightBtns.map(function(b){ return (
                          <button key={b.label} disabled={b.disabled} onClick={b.onClick} style={btnStyle(b)}>
                            <span style={{ fontSize:18 }}>{b.icon}</span>
                            <span className="px8" style={{ fontSize:"6px",lineHeight:1.1,textAlign:"center" }}>{b.label}</span>
                          </button>
                        ); })}
                      </div>
                    </>
                  );
                })()}
                {/* Ground strip — only for default background */}
                {!activeBg.url && <div style={{ position:"absolute",bottom:0,left:0,right:0,height:36,background:"repeating-linear-gradient(90deg,"+(isSleeping?T.lavender:T.teal)+"22 0px,"+(isSleeping?T.lavender:T.teal)+"22 16px,"+(isSleeping?T.lavender:T.teal)+"11 16px,"+(isSleeping?T.lavender:T.teal)+"11 32px)",zIndex:1 }}/>}
                {/* Wake hint when sleeping */}
                {isSleeping && (
                  <div style={{ position:"absolute",bottom:42,left:0,right:0,textAlign:"center",zIndex:3 }}>
                    <span className="px8" style={{ color:T.lavender,fontSize:"10px",opacity:0.7 }}>tap to wake early</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Mobile home: task preview panel below the background scene */}
          {(isMobile && page==="dashboard") && (function(){
            var prioOrder = { Urgent:0, High:1, Medium:2, Low:3 };
            var prioColor = { Urgent:"#FF4444", High:T.pink, Medium:T.gold, Low:T.teal };
            var prioBadge = { Urgent:"URG", High:"HIGH", Medium:"MED", Low:"LOW" };
            var mobilePendTasks = tasks.filter(function(t){ return !t.done; }).sort(function(a,b){ return ((prioOrder[a.priority]??99)-(prioOrder[b.priority]??99)); });
            return (
              <div style={{ height:"calc(42vh - 0px)",background:T.bgCard,borderTop:"1px solid "+T.border,display:"flex",flexDirection:"column",overflow:"hidden" }}>
                {/* Header */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:"1px solid "+T.border,flexShrink:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span className="px8" style={{ color:T.text,fontSize:"10px",letterSpacing:"0.05em" }}>TASKS</span>
                    <span className="px8" style={{ color:T.textDim,fontSize:"9px" }}>{mobilePendTasks.length} pending</span>
                  </div>
                  <button onClick={function(){ setShowQuickAdd(true); }}
                    style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:"rgba(13,15,20,0.6)",border:"1.5px solid "+accent,color:accent,cursor:"pointer",fontFamily:"inherit" }}>
                    <span style={{ fontSize:12 }}>+</span>
                    <span className="px8" style={{ fontSize:"8px" }}>NEW</span>
                  </button>
                </div>
                {/* Scrollable task list */}
                <div style={{ overflowY:"auto",flex:1,padding:"4px 0" }}>
                  {mobilePendTasks.length===0 && (
                    <div style={{ padding:"16px 12px",textAlign:"center" }}>
                      <span className="px8" style={{ color:T.textDim,fontSize:"9px" }}>No pending tasks — tap + NEW to add one</span>
                    </div>
                  )}
                  {mobilePendTasks.map(function(t){
                    var pc = prioColor[t.priority]||T.textDim;
                    var pb = prioBadge[t.priority]||t.priority;
                    return (
                      <div key={t.id}
                        onClick={function(){ setPage("dashboard"); }}
                        style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:"1px solid "+T.bgCard,cursor:"pointer",background:"transparent" }}>
                        <div style={{ width:6,height:6,borderRadius:"50%",background:pc,flexShrink:0 }}/>
                        <span className="px8" style={{ color:T.text,fontSize:"9px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</span>
                        <span className="px8" style={{ color:pc,fontSize:"7px",border:"1px solid "+pc,padding:"1px 4px",flexShrink:0 }}>{pb}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Name + Level */}
          {!(isMobile && page==="dashboard") && (
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div className="px10" style={{ color:T.text }}>{activeDigi&&activeDigi.name}</div>
            <div className="px8" style={{ background:accent,border:"2px solid "+T.border,padding:"3px 8px",boxShadow:"2px 2px 0 "+T.border,color:T.bg }}>LV.{activeDigi&&activeDigi.level}</div>
          </div>
          )}

          {/* Stat bars: XP / Stamina / Bond */}
          {!(isMobile && page==="dashboard") && (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {[
              { label:"⭐ XP",      val:activeDigi?activeDigi.exp:0,  max:activeDigi?activeDigi.expNeeded:100, color:T.gold },
              { label:"⚡ STAMINA", val:stamina,                        max:STAMINA_MAX,                         color:"#4ECDC4" },
              { label:"💗 BOND",    val:bond,                           max:100,                                 color:T.pink },
            ].map(function(s){
              return (
                <div key={s.label} style={{ display:"flex",flexDirection:"column",gap:4 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}>
                    <span className="px8" style={{ color:T.textMid }}>{s.label}</span>
                    <span className="px8" style={{ color:T.textMid }}>{Math.round(s.val)}/{s.max}</span>
                  </div>
                  <div style={{ height:10,background:T.bgCard,border:"2px solid "+T.border,overflow:"hidden" }}>
                    <div className="crest-bar-fill" style={{ width:Math.min((s.val/s.max)*100,100)+"%",background:s.color }}/>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Raid mini-widget */}
          {!(isMobile && page==="dashboard") && (function(){
            var rs2   = raidState || { totalDamage:0 };
            var frac2 = Math.min(1, (rs2.totalDamage||0) / CURRENT_RAID.bossHp);
            var phaseIdx2 = CURRENT_RAID.phases.findIndex(function(p){ return frac2 < p.threshold; });
            if (phaseIdx2 < 0) phaseIdx2 = CURRENT_RAID.phases.length - 1;
            var phase2 = CURRENT_RAID.phases[phaseIdx2];
            return (
              <div style={{ background:"linear-gradient(135deg,#0d0010,#110014)",border:"2px solid #9B59B6",padding:"10px 12px",cursor:"pointer" }}
                onClick={function(){ setPage("campaign"); }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <div className="px8" style={{ color:"#9B59B6",fontSize:"10px" }}>☠ BREACH</div>
                  <div className="px8" style={{ color:phase2.color,fontSize:"10px" }}>{phase2.name}</div>
                </div>
                <div style={{ height:6,background:T.bgCard,border:"1.5px solid #9B59B6",overflow:"hidden",marginBottom:4 }}>
                  <div style={{ width:(frac2*100)+"%",height:"100%",background:"linear-gradient(90deg,#9B59B6,#cc0000)",transition:"width 0.4s ease" }}/>
                </div>
                <div className="px8" style={{ color:T.textDim,fontSize:"9px" }}>{(rs2.totalDamage||0).toLocaleString()} / {CURRENT_RAID.bossHp.toLocaleString()} dmg dealt — tap to view</div>
              </div>
            );
          })()}

          {/* Neglect / Reconnection Arc widget */}
          {!(isMobile && page==="dashboard") && neglectData && (
            <div style={{ background:neglectData.level==="critical"?"linear-gradient(135deg,#1a0005,#150010)":neglectData.level==="unstable"?"linear-gradient(135deg,#0d0015,#110010)":"linear-gradient(135deg,#0d0d0d,#111118)", border:"2px solid "+(neglectData.level==="critical"?"#cc2222":neglectData.level==="unstable"?"#9B59B6":T.textDim), padding:"10px 12px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                <div className="px8" style={{ color:neglectData.level==="critical"?"#cc2222":neglectData.level==="unstable"?"#9B59B6":T.textMid, fontSize:"10px" }}>
                  {neglectData.level==="critical"?"⚠ CORRUPTION RISK"
                  :neglectData.level==="unstable"?"💀 PARTNER UNSTABLE"
                  :neglectData.level==="dormant"?"😶 PARTNER DORMANT"
                  :"... PARTNER QUIET"}
                </div>
                {neglectData.inArc && (
                  <div className="px8" style={{ color:T.pink,fontSize:"10px" }}>RECONNECTION ARC</div>
                )}
              </div>
              {neglectData.inArc ? (
                <div>
                  <div style={{ height:6,background:T.bgCard,border:"1.5px solid "+T.pink,overflow:"hidden",marginBottom:4 }}>
                    <div style={{ width:((neglectData.arcTasksDone/neglectData.arcGoal)*100)+"%",height:"100%",background:T.pink,transition:"width 0.4s ease" }}/>
                  </div>
                  <div className="px8" style={{ color:T.textDim,fontSize:"9px" }}>{neglectData.arcTasksDone}/{neglectData.arcGoal} tasks — complete to restore bond</div>
                </div>
              ) : (
                <div className="px8" style={{ color:T.textDim,fontSize:"9px" }}>{neglectData.daysAbsent} days absent — complete tasks to reconnect</div>
              )}
              {neglectData.sukamonRisk && neglectData.sukamonAccepted && (
                <div className="px8" style={{ color:"#9B59B6",fontSize:"9px",marginTop:4 }}>💀 Sukamon evo available in TEAM page</div>
              )}
            </div>
          )}

          {/* Crest alignment mini */}
          {!(isMobile && page==="dashboard") && <div style={{ background:T.bgCard,border:"2px solid "+T.border,padding:"10px 12px" }}>
            <div className="px8" style={{ color:T.textMid,marginBottom:8 }}>CREST ALIGNMENT</div>
            {crestProfile.primary ? (
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                  <CrestIcon ci={CREST_INFO[crestProfile.primary]} size={14}/>
                  <span style={{ fontSize:10,fontWeight:800,color:CREST_INFO[crestProfile.primary].color }}>{crestProfile.primary}</span>
                  <span className="px8" style={{ color:T.textDim,marginLeft:"auto" }}>PRIMARY</span>
                </div>
                {crestProfile.secondary && (
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <CrestIcon ci={CREST_INFO[crestProfile.secondary]} size={12}/>
                    <span style={{ fontSize:10,fontWeight:700,color:CREST_INFO[crestProfile.secondary].color }}>{crestProfile.secondary}</span>
                    <span className="px8" style={{ color:T.textDim,marginLeft:"auto" }}>SUPPORT</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize:11,color:T.textDim,fontStyle:"italic" }}>Complete tasks to build alignment.</div>
            )}
          </div>}

          {/* Pet action buttons */}
          {!(isMobile && page==="dashboard") && <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            <button className="pet-btn" style={{ background:T.pink+"22",borderColor:T.pink,color:T.pink }} onClick={function(){ setShowFeedPanel(true); }}>
              🍎 FEED
            </button>
            <button className="pet-btn" style={{ background:playAvailable?T.teal+"22":T.bgCard,borderColor:playAvailable?T.teal:T.border,color:playAvailable?T.teal:T.textDim }}
              disabled={!playAvailable} onClick={playAction}>
              🎮 {playUsedToday>=3?"DONE":`PLAY (${3-playUsedToday})`}
            </button>
            <button className="pet-btn" style={{ background:sleepState?T.lavender+"44":T.lavender+"22",borderColor:T.lavender,color:T.lavender }}
              onClick={function(){ setShowRestModal(true); }}>
              {sleepState ? "💤 SLEEPING" : "💤 REST"}
            </button>
            <button className="pet-btn" style={{ background:T.mint+"22",borderColor:T.mint,color:T.mint }}
              onClick={openPomodoroSetup}>
              ⏱ TRAIN
            </button>
          </div>}
          {!(isMobile && page==="dashboard") && !playAvailable && doneToday.length < 3 && (
            <div style={{ fontSize:11,color:T.textDim,textAlign:"center",fontStyle:"italic" }}>
              Complete {3-doneToday.length} more task{3-doneToday.length!==1?"s":""} to unlock Play
            </div>
          )}

          {/* Evolution banner — checks any party member, not just leader */}
          {!(isMobile && page==="dashboard") && (function(){
            var readyDigi = party.find(function(d){
              var di = DIGIMON_MAP[d.speciesId];
              if (!di || !di.evolvesTo) return false;
              return di.evolvesTo.some(function(id){
                var t = DIGIMON_MAP[id]; if (!t || t.fusionOf) return false;
                return checkEvoEligible(d, d.bond || 0, crestProfile, id).eligible;
              });
            });
            if (!readyDigi) return null;
            var readyInfo = DIGIMON_MAP[readyDigi.speciesId];
            return (
              <div className="evo-banner" onClick={function(){ setPage("team"); }}>
                <span style={{ fontSize:18 }}>✨</span>
                <div style={{ flex:1 }}>
                  <div className="px8" style={{ color:T.lavender }}>EVOLUTION READY</div>
                  <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:3 }}>{readyInfo ? readyInfo.name : readyDigi.name} → Team tab</div>
                </div>
                <span style={{ color:T.lavender,fontWeight:900 }}>→</span>
              </div>
            );
          })()}

        </aside>

        {/* ═══ MIDDLE — MAIN CONTENT ══════════════════════════════════════ */}
        <main className="main-content" style={{ padding:"24px 28px",display:"flex",flexDirection:"column",gap:18,overflowY:"auto" }}>

          {/* ── MOBILE COMPACT CHARACTER STRIP (non-pet pages) ──────────── */}
          <div className="mob-char-strip" style={{ background:T.bgPanel,borderBottom:"2px solid "+T.border,padding:"9px 0",alignItems:"center",gap:11,marginBottom:6 }}>
            <div style={{ flexShrink:0 }}>
              {activeDigi && <DigiSprite digimonId={activeDigi.speciesId} size={42} animate mood="walk"/>}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4 }}>
                <span className="px10" style={{ color:T.text,fontSize:"10px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{activeDigi && activeDigi.name}</span>
                <span className="px8" style={{ background:accent,border:"1px solid "+T.border,padding:"2px 6px",color:T.bg,flexShrink:0,fontSize:"8px" }}>LV.{activeDigi && activeDigi.level}</span>
              </div>
              <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                <div style={{ height:4,background:T.bgCard,border:"1px solid "+T.border,overflow:"hidden",flex:1 }}>
                  <div style={{ width:activeDigi ? Math.min((activeDigi.exp/activeDigi.expNeeded)*100,100)+"%" : "0%",height:"100%",background:T.gold }}/>
                </div>
                <span className="px8" style={{ fontSize:"8px",color:T.gold,flexShrink:0 }}>XP</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:10,flexShrink:0 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13 }}>⚡</div>
                <div className="px8" style={{ fontSize:"8px",color:"#4ECDC4" }}>{stamina}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13 }}>💗</div>
                <div className="px8" style={{ fontSize:"8px",color:T.pink }}>{Math.round(bond)}</div>
              </div>
            </div>
          </div>

          <div key={page} className="page-in">

            {/* ── DASHBOARD ────────────────────────────────────────────── */}
            {page==="dashboard"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
                {/* Stat row */}
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                  {[
                    { icon:"🔥", val:streak,                              label:"day streak" },
                    { icon:"✅", val:doneToday.length+"/"+activeTodayTotal, label:"done today" },
                    { icon:"⭐", val:"+"+xpToday,                         label:"XP today"   },
                  ].map(function(s){
                    return (
                      <div key={s.label} className="pcard" style={{ padding:14,display:"flex",alignItems:"center",gap:12 }}>
                        <div style={{ fontSize:26 }}>{s.icon}</div>
                        <div>
                          <div className="px12" style={{ color:T.text }}>{s.val}</div>
                          <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:4 }}>{s.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Crest alignment widget — tendency strips */}
                <div className="pcard" style={{ padding:14 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                    <div className="px9">CREST ALIGNMENT</div>
                    <div className="px8" style={{ color:T.textMid }}>14-day</div>
                  </div>
                  {(function(){
                    var totals = crestProfile.totals || {};
                    var sorted = Object.entries(CREST_INFO)
                      .map(function(e){ return { name:e[0], ci:e[1], val:totals[e[0]]||0 }; })
                      .sort(function(a,b){ return b.val - a.val; });
                    var maxVal = Math.max.apply(null, sorted.map(function(s){ return s.val; }).concat([1]));
                    var hasAny = sorted.some(function(s){ return s.val > 0; });
                    if (!hasAny) return (
                      <div style={{ fontSize:10,color:T.textDim,fontStyle:"italic" }}>Complete tasks to reveal your alignment.</div>
                    );
                    return (
                      <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                        {sorted.filter(function(s){ return s.val > 0; }).map(function(s){
                          var isPrim = s.name === crestProfile.primary;
                          var isSec  = s.name === crestProfile.secondary;
                          var barPct = (s.val / maxVal) * 100;
                          var opacity = isPrim ? 1 : isSec ? 0.82 : Math.max(0.35, barPct / 100 * 0.9);
                          return (
                            <div key={s.name} style={{ display:"flex",alignItems:"center",gap:8,opacity:opacity }}>
                              <div style={{ width:16,height:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                                <CrestIcon ci={s.ci} size={14}/>
                              </div>
                              <span style={{ width:70,fontSize:10,fontWeight:isPrim?900:700,color:s.ci.color,flexShrink:0,lineHeight:1 }}>
                                {s.name}{isPrim&&<span style={{ color:T.gold,marginLeft:3,fontSize:8 }}>★</span>}{isSec&&<span style={{ color:T.textMid,marginLeft:3,fontSize:8 }}>◆</span>}
                              </span>
                              <div style={{ flex:1,height:6,background:T.bgPanel,border:"1px solid "+T.border,position:"relative",overflow:"hidden" }}>
                                <div style={{ position:"absolute",inset:0,width:barPct+"%",background:s.ci.color,transition:"width 0.7s ease" }}/>
                              </div>
                              <span style={{ width:22,fontSize:10,fontWeight:800,color:isPrim?s.ci.color:T.textDim,textAlign:"right",flexShrink:0 }}>{s.val}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Tasks header */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
                  <div>
                    <div className="px12">TODAY'S QUESTS</div>
                    <div style={{ fontSize:13,fontWeight:700,color:T.textMid,marginTop:4 }}>{pendTasks.length} remaining</div>
                  </div>
                  <button className="px8" onClick={function(){ setShowQuickAdd(true); }} style={{ padding:"9px 14px",background:T.coral,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,color:"white",cursor:"pointer" }}>+ NEW TASK</button>
                </div>

                {/* Priority task list */}
                {[["High","Urgent"],["Medium"],["Low"]].map(function(pris){
                  var label = pris[0]==="High"?"⚡ HIGH / URGENT":pris[0]==="Medium"?"🌿 MEDIUM":"💜 LOW";
                  var tlist = pendTasks.filter(function(t){ return pris.indexOf(t.priority)>=0; });
                  if (!tlist.length) return null;
                  return (
                    <div key={label} style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      <div className="sec-label">{label}</div>
                      {tlist.map(function(t){
                        var xp = calcXpReward(t,streak);
                        var stars = t.difficulty==="Hard"?3:t.difficulty==="Medium"?2:1;
                        var cg = calcCrestGain(t.template, t.difficulty);
                        return (
                          <div key={t.id} className={"task-card tc-"+(t.priority||"low").toLowerCase()}>
                            <div className={"task-check"+(t.done?" checked":"")} onClick={function(e){ e.stopPropagation(); completeTask(t.id); }}>
                              {t.done&&<span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span>}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:14,fontWeight:800 }}>{t.title}</div>
                              <div style={{ display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center" }}>
                                {cg&&<span style={{ display:"inline-flex",alignItems:"center" }}><CrestIcon ci={CREST_INFO[cg.primaryCrest]} size={14}/></span>}
                                <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.border,color:T.textMid,background:T.bgPanel,fontSize:"11px" }}>{t.template}</span>
                                <span className="px8" style={{ padding:"2px 6px",background:"#2a2000",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"11px" }}>+{xp} XP</span>
                                <span style={{ fontSize:11,fontWeight:700,color:t.type==="daily"?T.teal:T.textDim }}>{t.type}</span>
                              </div>
                            </div>
                            <div style={{ display:"flex",gap:2,flexShrink:0 }}>
                              {[1,2,3,4].map(function(n){ return <span key={n} style={{ fontSize:12,color:n<=stars?T.gold:T.textDim }}>★</span>; })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {doneToday.length>0&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <div className="sec-label">✓ COMPLETED</div>
                    {doneToday.slice(0,5).map(function(t){
                      return (
                        <div key={t.id} className="task-card done tc-low">
                          <div className="task-check checked"><span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span></div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14,fontWeight:800,color:T.textMid,textDecoration:"line-through" }}>{t.title}</div>
                          </div>
                          <span className="px8" style={{ fontSize:"11px",color:T.green }}>DONE</span>
                        </div>
                      );
                    })}
                    {doneToday.length>5&&(
                      <div className="px8" style={{ textAlign:"center",color:T.textDim,fontSize:"11px",padding:"6px 0" }}>
                        +{doneToday.length-5} more — view all in FILEHAVEN → TASKS
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TASKS ────────────────────────────────────────────────── */}
            {page==="tasks"&&(
              <TasksPage tasks={tasks} onComplete={completeTask} onAdd={addTask} onEdit={editTask} onDelete={deleteTask} onReschedule={rescheduleTask} accent={accent} streak={streak} T={T}/>
            )}

            {/* ── WEEKLY ───────────────────────────────────────────────── */}
            {page==="weekly"&&(
              <WeeklyPlannerPage tasks={allTasks} party={party} farm={farm} weeklyDigimon={weeklyDigimon} onAssignDigimon={assignWeeklyDigimon} onReschedule={rescheduleTask} onComplete={completeTask} accent={accent} T={T}/>
            )}

            {/* ── CRESTS ───────────────────────────────────────────────── */}
            {page==="crests"&&(
              <CrestsPage crestProfile={crestProfile} crestHistory={crestHistory} crestMaterials={crestMaterials} loginDay={loginDay} activeDigi={activeDigi} activeInfo={activeInfo} bond={bond} T={T} accent={accent} isMobile={isMobile} onGoTeam={function(){ setPage("team"); }}/>
            )}

            {/* ── TEAM ─────────────────────────────────────────────────── */}
            {page==="team"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">PARTNER EVOLUTION TERMINAL</div>
                  <span className="px8" style={{ color:accent }}>{party.length}/{MAX_PARTY_SIZE}</span>
                </div>
                {party.map(function(digi,i){
                  var inf2 = DIGIMON_MAP[digi.speciesId];
                  var pers = PERSONALITIES.find(function(p){ return p.id===digi.personality; });
                  var evoList = (inf2&&inf2.evolvesTo||[]).map(function(id){
                    var ti = DIGIMON_MAP[id]; if(!ti||ti.fusionOf) return null;
                    var check = checkEvoEligible(digi, digi.bond || 0, crestProfile, id);
                    return { id, info:ti, ...check };
                  }).filter(Boolean);
                  var anyEvoReady = evoList.some(function(e){ return e.eligible; });

                  return (
                    <div key={digi.uid} className="pcard" style={{ padding:"12px 14px",borderColor:i===0?accent:T.border,boxShadow:"3px 3px 0 "+(i===0?accent:T.border) }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        {/* Sprite with leader star */}
                        <div style={{ position:"relative",flexShrink:0 }}>
                          <DigiSprite digimonId={digi.speciesId} size={52} animate mood="walk"/>
                          {i===0&&<div style={{ position:"absolute",top:-5,right:-5,background:accent,border:"2px solid "+T.border,width:16,height:16,display:"grid",placeItems:"center",fontSize:8,color:T.bg,fontWeight:900 }}>★</div>}
                        </div>
                        {/* Name + info */}
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap" }}>
                            <span className="px10" style={{ fontSize:"13px" }}>{digi.name}</span>
                            <span className="px8" style={{ padding:"1px 6px",border:"1.5px solid "+(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),color:(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),fontSize:"9px" }}>{inf2&&inf2.stage}</span>
                            {pers&&<span className="px8" style={{ padding:"1px 5px",border:"1.5px solid "+pers.color,color:pers.color,fontSize:"9px" }}>{pers.label}</span>}
                            {anyEvoReady&&<span style={{ fontSize:"10px",color:T.gold,fontWeight:900 }}>✦ READY</span>}
                          </div>
                          <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:6 }}>Lv.{digi.level} · Bond {Math.round(digi.bond||0)} · {inf2&&inf2.type}</div>
                          <Bar value={digi.exp} max={digi.expNeeded} color={accent} h={5}/>
                        </div>
                        {/* Summary button */}
                        <button
                          onClick={function(){ setPetSummary(digi.uid); }}
                          className="px8"
                          style={{ flexShrink:0,padding:"8px 10px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"11px",lineHeight:1 }}>
                          INFO ▸
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* ── Digimon Summary Modal ──────────────────────────────── */}
                {petSummary && (function(){
                  var digi = party.find(function(d){ return d.uid===petSummary; });
                  if (!digi) { setPetSummary(null); return null; }
                  var inf2  = DIGIMON_MAP[digi.speciesId];
                  var bs    = calcBattleStats(digi);
                  var role  = inf2 && ROLES[inf2.role] ? ROLES[inf2.role] : ROLES.Balanced;
                  var pers  = PERSONALITIES.find(function(p){ return p.id===digi.personality; });
                  var partyIdx = party.findIndex(function(d){ return d.uid===digi.uid; });
                  var evoList2 = (inf2&&inf2.evolvesTo||[]).map(function(id){
                    var ti = DIGIMON_MAP[id]; if(!ti||ti.fusionOf) return null;
                    var check = checkEvoEligible(digi, digi.bond||0, crestProfile, id);
                    return { id, info:ti, ...check };
                  }).filter(Boolean);

                  // Stat bar: scale to stage-appropriate max for relative visual
                  var STAGE_MAX = { "Baby":50, "In-Training":90, "Rookie":160, "Champion":260, "Ultimate":380, "Mega":520 };
                  var statMax = STAGE_MAX[inf2&&inf2.stage] || 160;
                  var renderStatBar = function(label, value, color) {
                    var pct = Math.min(100, Math.round((value / statMax) * 100));
                    return (
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
                        <span className="px8" style={{ width:32,fontSize:"10px",color:T.textDim,textAlign:"right",flexShrink:0 }}>{label}</span>
                        <div style={{ flex:1,height:7,background:T.bgPanel,border:"1px solid "+T.border,position:"relative" }}>
                          <div style={{ position:"absolute",inset:0,width:pct+"%",background:color,transition:"width 0.5s ease" }}/>
                        </div>
                        <span className="px8" style={{ width:28,fontSize:"10px",color:color,fontWeight:800,textAlign:"right",flexShrink:0 }}>{value}</span>
                      </div>
                    );
                  };

                  return (
                    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:640,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"68px 16px 16px" }}>
                      <div style={{ background:T.bgCard,border:"2px solid "+(partyIdx===0?accent:T.border),boxShadow:"4px 4px 0 "+(partyIdx===0?accent:T.border),maxWidth:440,width:"100%",position:"relative",display:"flex",flexDirection:"column",maxHeight:"90vh" }}>

                        {/* Close */}
                        <button onClick={function(){ setPetSummary(null); }}
                          style={{ position:"absolute",top:10,right:12,background:"transparent",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,lineHeight:1 }}>✕</button>

                        {/* Header — sprite + identity */}
                        <div style={{ padding:"20px 20px 14px",display:"flex",gap:16,alignItems:"flex-start",borderBottom:"1px solid "+T.border }}>
                          <div style={{ position:"relative",flexShrink:0 }}>
                            <DigiSprite digimonId={digi.speciesId} size={72} animate mood="walk"/>
                            {partyIdx===0&&<div style={{ position:"absolute",top:-6,right:-6,background:accent,border:"2px solid "+T.border,width:18,height:18,display:"grid",placeItems:"center",fontSize:9,color:T.bg,fontWeight:900 }}>★</div>}
                          </div>
                          <div style={{ flex:1 }}>
                            <div className="px12" style={{ marginBottom:6 }}>{digi.name}</div>
                            <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:6 }}>
                              <span className="px8" style={{ padding:"2px 7px",border:"1.5px solid "+(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),color:(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),fontSize:"9px" }}>{inf2&&inf2.stage}</span>
                              {inf2&&inf2.type&&<span className="px8" style={{ padding:"2px 7px",border:"1.5px solid "+T.border,color:T.textMid,fontSize:"9px" }}>{inf2.type}</span>}
                              {pers&&<span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+pers.color,color:pers.color,fontSize:"9px" }}>{pers.label}</span>}
                              <span className="px8" style={{ padding:"2px 7px",border:"2px solid "+role.color,color:role.color,background:role.color+"18",fontSize:"9px" }}>{role.icon} {inf2&&inf2.role||"Balanced"}</span>
                            </div>
                            <div className="px8" style={{ color:T.textDim,fontSize:"10px" }}>Lv.{digi.level} · Bond {Math.round(digi.bond||0)}</div>
                          </div>
                        </div>

                        <div style={{ padding:"14px 20px",display:"flex",flexDirection:"column",gap:16,overflowY:"auto",flex:1 }}>

                          {/* Description */}
                          {inf2&&inf2.desc&&(
                            <div>
                              <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:6,letterSpacing:"0.05em" }}>PROFILE</div>
                              <div style={{ fontSize:11,color:T.textMid,lineHeight:1.75,fontStyle:"italic",padding:"10px 12px",background:T.bgPanel,border:"1px solid "+T.border }}>
                                {inf2.desc}
                              </div>
                            </div>
                          )}

                          {/* Combat stats */}
                          <div>
                            <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:8,letterSpacing:"0.05em" }}>COMBAT</div>
                            {renderStatBar("PWR", bs.Power,    "#FF6B35")}
                            {renderStatBar("GRD", bs.Guard,    "#7EB8F7")}
                            {renderStatBar("FOC", bs.Focus,    "#B8A0E8")}
                            {renderStatBar("MTM", bs.Momentum, "#FFD700")}
                            {inf2&&inf2.passive&&(
                              <div style={{ marginTop:8,padding:"7px 10px",background:T.bgPanel,border:"1px solid "+T.border }}>
                                <span style={{ fontSize:10,color:T.mint,fontWeight:700 }}>Passive — </span>
                                <span style={{ fontSize:10,color:T.textMid }}>{inf2.passive}</span>
                              </div>
                            )}
                            {inf2&&inf2.signature&&(
                              <div style={{ marginTop:5,padding:"7px 10px",background:T.bgPanel,border:"1px solid "+T.border }}>
                                <span style={{ fontSize:10,color:T.gold,fontWeight:700 }}>Signature — </span>
                                <span style={{ fontSize:10,color:T.textMid }}>{inf2.signature}</span>
                              </div>
                            )}
                          </div>

                          {/* XP + Crest stages */}
                          <div>
                            <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:8,letterSpacing:"0.05em" }}>GROWTH</div>
                            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                              <span className="px8" style={{ color:T.textMid,fontSize:"10px" }}>⭐ XP</span>
                              <span className="px8" style={{ color:T.textMid,fontSize:"10px" }}>{digi.exp} / {digi.expNeeded}</span>
                            </div>
                            <Bar value={digi.exp} max={digi.expNeeded} color={accent} h={7}/>

                            {inf2&&inf2.crestReq&&(function(){
                              var cr = inf2.crestReq;
                              var stages = digi.crestStages || {};
                              var crests = [cr.primary, cr.secondary].filter(Boolean);
                              return (
                                <div style={{ marginTop:10 }}>
                                  <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:6 }}>CREST STAGES</div>
                                  {crests.map(function(cname){
                                    var ci      = CREST_INFO[cname];
                                    var stage   = stages[cname] || 0;
                                    var maxStg  = CREST_STAGE_COSTS.length;
                                    var cost    = stage < maxStg ? CREST_STAGE_COSTS[stage] : null;
                                    var avail   = crestMaterials[cname] || 0;
                                    var canSpend= cost !== null && avail >= cost;
                                    return (
                                      <div key={cname} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:T.bgPanel,border:"1px solid "+T.border,marginBottom:4 }}>
                                        <CrestIcon ci={ci} size={13}/>
                                        <span style={{ fontSize:11,fontWeight:800,color:ci.color,flex:1 }}>{cname}</span>
                                        {[...Array(maxStg)].map(function(_,si){
                                          return <div key={si} style={{ width:10,height:10,background:si<stage?ci.color:T.bgPanel,border:"1.5px solid "+(si<stage?ci.color:T.border) }}/>;
                                        })}
                                        {cost !== null && (
                                          <button className="px8" disabled={!canSpend}
                                            onClick={function(){ spendCrestMaterial(digi.uid, cname); }}
                                            style={{ padding:"3px 7px",background:canSpend?ci.color+"22":"transparent",border:"1.5px solid "+(canSpend?ci.color:T.border),color:canSpend?ci.color:T.textDim,cursor:canSpend?"pointer":"not-allowed",fontSize:"10px" }}>
                                            +1 ({avail}/{cost})
                                          </button>
                                        )}
                                        {cost===null&&<span className="px8" style={{ fontSize:"10px",color:T.gold }}>MAX</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Corruption evolution */}
                          {neglectData&&neglectData.sukamonRisk&&neglectData.sukamonAccepted&&inf2&&(inf2.stage==="In-Training"||inf2.stage==="Rookie")&&(
                            <div style={{ padding:"8px 10px",background:"linear-gradient(135deg,#100010,#180010)",border:"2px solid #9B59B6" }}>
                              <div className="px8" style={{ color:"#9B59B6",fontSize:"10px",marginBottom:6 }}>💀 CORRUPTION EVOLUTION</div>
                              <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                                <DigiSprite digimonId="sukamon" size={28} animate mood="walk"/>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:12,fontWeight:900,color:"#9B59B6" }}>Sukamon</div>
                                  <div className="px8" style={{ color:T.textDim,fontSize:"10px" }}>Rookie · Virus · Dark</div>
                                </div>
                                <button className="px8" style={{ padding:"5px 10px",background:"#9B59B622",border:"2px solid #9B59B6",color:"#9B59B6",cursor:"pointer",fontSize:"11px" }}
                                  onClick={function(){ evolve(digi.uid,"sukamon"); setPetSummary(null); }}>CORRUPT →</button>
                              </div>
                              <div style={{ fontSize:10,color:T.textDim,marginTop:5,fontStyle:"italic" }}>The data has warped. A darker form calls.</div>
                            </div>
                          )}

                          {/* Evolutions */}
                          {evoList2.length > 0 && (
                            <div>
                              <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginBottom:8,letterSpacing:"0.05em" }}>DIGIVOLUTION</div>
                              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                                {evoList2.map(function(evo){
                                  var canEvo   = evo.eligible;
                                  var ci       = evo.info.crestReq ? CREST_INFO[evo.info.crestReq.primary] : null;
                                  var ci2      = evo.info.crestReq&&evo.info.crestReq.secondary ? CREST_INFO[evo.info.crestReq.secondary] : null;
                                  var req      = EVO_REQUIREMENTS[evo.info.stage] || {};
                                  var stageReq = CREST_STAGE_EVO_REQ[evo.info.stage] || {};
                                  var btnCol   = canEvo ? T.gold : T.textDim;
                                  return (
                                    <div key={evo.id} style={{ background:T.bgPanel,border:"1.5px solid "+(canEvo?T.gold:T.border),padding:"10px 12px" }}>
                                      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                                        <DigiSprite digimonId={evo.id} size={32} animate mood="walk"/>
                                        <div style={{ flex:1 }}>
                                          <div style={{ fontSize:13,fontWeight:900,color:btnCol }}>{evo.info.name}</div>
                                          <div className="px8" style={{ color:STAGE_COLOR[evo.info.stage]||"#aaa",fontSize:"10px" }}>{evo.info.stage} · {evo.info.type}</div>
                                        </div>
                                        {canEvo&&(
                                          <button className="px8"
                                            style={{ padding:"6px 12px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"11px",fontWeight:800 }}
                                            onClick={function(){ evolve(digi.uid,evo.id); setPetSummary(null); }}>
                                            DIGIVOLVE →
                                          </button>
                                        )}
                                      </div>
                                      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                                        <span className="px8" style={{ fontSize:"10px",color:digi.level>=req.level?T.green:T.coral }}>Lv.{req.level} {digi.level>=req.level?"✓":"✗ ("+digi.level+")"}</span>
                                        {req.bond>0&&<span className="px8" style={{ fontSize:"10px",color:(digi.bond||0)>=req.bond?T.green:T.coral }}>Bond {req.bond} {(digi.bond||0)>=req.bond?"✓":"✗ ("+Math.round(digi.bond||0)+")"}</span>}
                                        {ci&&(function(){
                                          var stg=( digi.crestStages||{})[evo.info.crestReq.primary]||0,need=stageReq.primary||0,met=stg>=need;
                                          return <span className="px8" style={{ fontSize:"10px",color:met?T.green:T.coral,display:"inline-flex",alignItems:"center",gap:3 }}><CrestIcon ci={ci} size={10}/> Stage {need} {met?"✓":"✗("+stg+")"}</span>;
                                        })()}
                                        {ci2&&(function(){
                                          var stg=(digi.crestStages||{})[evo.info.crestReq.secondary]||0,need=stageReq.secondary||0,met=stg>=need;
                                          return <span className="px8" style={{ fontSize:"10px",color:met?T.green:T.coral,display:"inline-flex",alignItems:"center",gap:3 }}><CrestIcon ci={ci2} size={10}/> Stage {need} {met?"✓":"✗("+stg+")"}</span>;
                                        })()}
                                        {!canEvo&&evo.reason&&<span className="px8" style={{ fontSize:"10px",color:T.coral }}>{evo.reason}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Party controls */}
                          <div style={{ display:"flex",gap:8,flexWrap:"wrap",paddingTop:4 }}>
                            {partyIdx>0&&<button className="px8" style={{ flex:1,padding:"8px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"11px" }} onClick={function(){ setLeader(digi.uid); setPetSummary(null); }}>★ SET LEADER</button>}
                            {party.length>1&&<button className="px8" style={{ flex:1,padding:"8px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"11px" }} onClick={function(){ sendToFarm(digi.uid); setPetSummary(null); }}>→ FARM</button>}
                            {(function(){
                              var allDigi2=Object.values(DIGIMON_MAP);
                              var prevIds2=allDigi2.filter(function(x){ return x.evolvesTo&&x.evolvesTo.includes(digi.speciesId); }).map(function(x){ return x.id; });
                              if(!prevIds2.length) return null;
                              var prevId2=prevIds2[0];
                              return (
                                <button className="px8" style={{ flex:1,padding:"8px",background:T.coral+"18",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"11px" }}
                                  onClick={function(){ setDedigivolveConfirm({ uid:digi.uid,prevId:prevId2,digiName:digi.name,prevName:(DIGIMON_MAP[prevId2]&&DIGIMON_MAP[prevId2].name)||prevId2 }); setPetSummary(null); }}>
                                  ↩ DEDIGIVOLVE
                                </button>
                              );
                            })()}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── DIGIFARM ─────────────────────────────────────────────── */}
            {page==="digifarm"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">DIGIFARM</div>
                  <span className="px8" style={{ color:T.mint }}>{farm.length} stored</span>
                </div>
                {farm.length===0
                  ? <div className="pcard" style={{ padding:40,textAlign:"center",color:T.textMid }}>No Digimon in the farm yet.</div>
                  : farm.map(function(d){
                    var fi = DIGIMON_MAP[d.speciesId];
                    return (
                      <div key={d.uid} className="pcard" style={{ padding:14,display:"flex",alignItems:"center",gap:14 }}>
                        <DigiSprite digimonId={d.speciesId} size={54} animate mood="walk"/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800,fontSize:14 }}>{d.name}</div>
                          <div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"11px" }}>Lv.{d.level} · {fi&&fi.stage} · {fi&&fi.role}</div>
                        </div>
                        <button className="px8" style={{ padding:"7px 12px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"11px" }} onClick={function(){ recallFromFarm(d.uid); }}>RECALL</button>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* ── PATCH ────────────────────────────────────────────────── */}
            {page==="battle"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">PATCH ARENA</div>
                  <div className="px8" style={{ color:"#4ECDC4" }}>⚡ {stamina}/{STAMINA_MAX}</div>
                </div>

                {/* ── Difficulty select ── */}
                {!battleState&&(
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                    {["Easy","Medium","Hard"].map(function(diff){
                      var r    = BATTLE_REWARDS[diff]||{win:60,loss:25};
                      var cost = STAMINA_COSTS["bot_"+diff.toLowerCase()]||10;
                      var c    = diff==="Easy"?T.green:diff==="Medium"?T.gold:T.coral;
                      var ok   = stamina >= cost;
                      return (
                        <div key={diff} className="pcard" style={{ padding:20,textAlign:"center",cursor:ok?"pointer":"not-allowed",borderColor:c,boxShadow:"3px 3px 0 "+c,opacity:ok?1:0.55 }} onClick={function(){ if(ok) startBattle(diff); }}>
                          <div className="px10" style={{ color:c,marginBottom:8 }}>{diff.toUpperCase()}</div>
                          <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginBottom:4 }}>Win {r.win}🪙</div>
                          <div style={{ fontSize:11,fontWeight:700,color:T.textDim,marginBottom:8 }}>Loss {r.loss}🪙</div>
                          <div className="px8" style={{ color:"#4ECDC4",fontSize:"11px" }}>Costs {cost} ⚡</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Fight screen ── */}
                {battleState&&battleState.phase==="fight"&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

                    {/* Minigame overlay */}
                    {mgActive&&(function(){
                      var mg = mgActive;
                      var isReveal  = mg.phase === "reveal";
                      var isInput   = mg.phase === "input";
                      var isSuccess = mg.phase === "success";
                      var isWrong   = mg.phase === "wrong";
                      var titleMap  = { digicode:"FOCUS CHECK", timing:"MOMENTUM BURST", guard:"GUARD WALL" };
                      var colorMap  = { digicode:"#B8A0E8", timing:"#FFD700", guard:"#4ECDC4" };
                      var mgColor   = colorMap[mg.type] || T.teal;
                      return (
                        <div className="pcard" style={{ padding:18,borderColor:mgColor,boxShadow:"0 0 18px "+mgColor+"55",animation:"slideUp 0.18s ease" }}>
                          <div className="px9" style={{ color:mgColor,marginBottom:14,letterSpacing:"0.12em" }}>
                            {isSuccess?"✓ SUCCESS!":isWrong?"✗ MISS!":titleMap[mg.type]}
                          </div>
                          {/* DigiCode */}
                          {mg.type==="digicode"&&(
                            <div>
                              <div style={{ fontSize:11,color:T.textMid,marginBottom:12 }}>
                                {isInput?"Tap the tile that glowed!":isSuccess?"Critical hit incoming!":isWrong?"Miss — no Focus bonus":"Watch carefully..."}
                              </div>
                              <div style={{ display:"flex",gap:8 }}>
                                {mg.tiles.map(function(sym,i){
                                  var cls = "mg-tile"
                                    + (isReveal && i===mg.answer ? " reveal" : "")
                                    + (isSuccess && i===mg.answer ? " correct" : "")
                                    + (isWrong   && i===mg.answer ? " correct" : "");
                                  return (
                                    <div key={i} className={cls}
                                      onClick={function(){ if(isInput) handleMgAnswer(i); }}>
                                      {sym}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {/* Timing bar */}
                          {mg.type==="timing"&&(
                            <div>
                              <div style={{ fontSize:11,color:T.textMid,marginBottom:12 }}>
                                {isSuccess?"Perfect timing! Double-strike!":isWrong?"Too early or too late!":"Tap STOP in the green zone!"}
                              </div>
                              <div style={{ position:"relative",height:36,background:T.bgPanel,border:"2px solid "+T.border,overflow:"hidden",cursor:"pointer",borderRadius:2 }}
                                onClick={handleTimingTap}>
                                {/* Green zone */}
                                <div style={{ position:"absolute",top:0,bottom:0,left:mg.zoneStart+"%",width:(mg.zoneEnd-mg.zoneStart)+"%",background:"#5CB85C33",borderLeft:"2px solid #5CB85C",borderRight:"2px solid #5CB85C" }}/>
                                {/* Moving dot — CSS animation drives position */}
                                {(isInput||isReveal)&&<div style={{ position:"absolute",top:4,width:18,height:26,background:mgColor,borderRadius:2,animation:"timingSlide 2s linear forwards",animationPlayState:isInput?"running":"paused" }}/>}
                                <div className="px8" style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",color:T.textMid,fontSize:"10px",pointerEvents:"none" }}>TAP!</div>
                              </div>
                            </div>
                          )}
                          {/* Guard wall */}
                          {mg.type==="guard"&&(
                            <div>
                              <div style={{ fontSize:11,color:T.textMid,marginBottom:12 }}>
                                {isSuccess?"Attack blocked! Damage cut!":isWrong?"Took full damage!":"Block the incoming attack!"}
                              </div>
                              <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
                                {mg.dirs.map(function(dir,i){
                                  var isAnswer = i===mg.answer;
                                  var cls = "mg-tile"
                                    + (isReveal&&isAnswer ? " reveal" : "")
                                    + ((isSuccess||isWrong)&&isAnswer ? (isSuccess?" correct":" correct") : "");
                                  return (
                                    <div key={i} className={cls} style={{ fontSize:20,padding:"12px 8px",maxWidth:68 }}
                                      onClick={function(){ if(isInput) handleMgAnswer(i); }}>
                                      {dir}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Enemy team */}
                    <div className="sec-label">ENEMY TEAM</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                      {battleState.enemyTeam.map(function(e,i){
                        var ebs = calcBattleStats(e);
                        return (
                          <div key={i} className="battle-tile enemy" style={{ opacity:e.currentHp<=0?0.3:1 }}>
                            <DigiSprite digimonId={e.speciesId} size={48} mood={e.currentHp<=0?"sad":"angry"} animate={e.currentHp>0}/>
                            <div className="px8" style={{ marginTop:5,marginBottom:4,fontSize:"10px" }}>{e.name}</div>
                            <Bar value={e.currentHp} max={e.maxHp} color={T.coral} h={5}/>
                            <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:5 }}>
                              <div style={{ textAlign:"center" }}><div style={{ fontSize:11,fontWeight:900,color:"#FF6B35" }}>{ebs.Power}</div><div className="px8" style={{ fontSize:"9px",color:T.textDim }}>PWR</div></div>
                              <div style={{ textAlign:"center" }}><div style={{ fontSize:11,fontWeight:900,color:"#7EB8F7" }}>{ebs.Guard}</div><div className="px8" style={{ fontSize:"9px",color:T.textDim }}>GRD</div></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Battle log */}
                    <div className="pcard" style={{ padding:"10px 12px",maxHeight:120,overflowY:"auto" }}>
                      {battleState.log.length===0
                        ? <div style={{ fontSize:11,color:T.textMid }}>Battle beginning...</div>
                        : battleState.log.map(function(l,i){
                            return <div key={i} style={{ fontSize:11,color:i===0?T.text:T.textMid,padding:"2px 0",borderBottom:"1px solid "+T.border }}>{l}</div>;
                          })
                      }
                    </div>

                    {/* Player team */}
                    <div className="sec-label" style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span>YOUR TEAM</span>
                      <span style={{ color:T.textDim,fontSize:"9px",fontFamily:"'Press Start 2P',monospace" }}>RND {battleState.round||0}</span>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                      {battleState.playerTeam.map(function(p,i){
                        var pbs   = calcBattleStats(p);
                        var pInfo = DIGIMON_MAP[p.speciesId];
                        var alive = p.currentHp > 0;
                        return (
                          <div key={i} className="battle-tile player" style={{ opacity:alive?1:0.3 }}>
                            <DigiSprite digimonId={p.speciesId} size={48} mood={alive?"attack":"sad"} animate={alive}/>
                            <div className="px8" style={{ marginTop:5,marginBottom:4,fontSize:"10px" }}>{p.name}</div>
                            <Bar value={p.currentHp} max={p.maxHp} color={T.green} h={5}/>
                            <div style={{ display:"flex",justifyContent:"space-around",marginTop:5 }}>
                              {[["PWR",pbs.Power,"#FF6B35"],["GRD",pbs.Guard,"#7EB8F7"],["FOC",pbs.Focus,"#B8A0E8"],["MTM",pbs.Momentum,"#FFD700"]].map(function(s){
                                return <div key={s[0]} style={{ textAlign:"center" }}><div style={{ fontSize:10,fontWeight:900,color:s[2] }}>{s[1]}</div><div className="px8" style={{ fontSize:"8px",color:T.textDim }}>{s[0]}</div></div>;
                              })}
                            </div>
                            {pInfo&&pInfo.passive&&<div style={{ fontSize:"8px",color:T.mint,marginTop:3,fontStyle:"italic",lineHeight:1.3,textAlign:"center" }}>{pInfo.passive.split("—")[0].trim()}</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Auto-battle hint */}
                    {!mgActive&&<div style={{ textAlign:"center",fontSize:"10px",color:T.textDim,fontFamily:"'Press Start 2P',monospace",animation:"blink 1.4s ease infinite" }}>AUTO FIGHTING...</div>}
                  </div>
                )}

                {/* ── Victory / Defeat ── */}
                {battleState&&(battleState.phase==="won"||battleState.phase==="lost")&&(
                  <div className="pcard" style={{ padding:40,textAlign:"center" }}>
                    <div style={{ fontSize:42,marginBottom:12 }}>{battleState.phase==="won"?"🏆":"💀"}</div>
                    <div className="px12" style={{ color:battleState.phase==="won"?T.green:T.coral,marginBottom:8 }}>{battleState.phase==="won"?"VICTORY!":"DEFEATED"}</div>
                    <div style={{ fontSize:12,color:T.textMid,marginBottom:20 }}>{battleState.log[0]}</div>
                    <button className="px8" style={{ padding:"10px 20px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"12px" }} onClick={function(){ setBattleState(null); setMgActive(null); }}>RETURN</button>
                  </div>
                )}
              </div>
            )}

            {/* ── CHAT ─────────────────────────────────────────────────── */}
            {page==="chat"&&activeDigi&&(
              <ChatPage digimon={Object.assign({},activeDigi,{stage:activeInfo?activeInfo.stage:"Rookie",streak,hp:75})} tasks={tasks}/>
            )}

            {/* ── STORE ────────────────────────────────────────────────── */}
            {page==="store"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">JIJIMON'S SHOP</div>
                  <div className="px8" style={{ color:T.gold }}>🪙 {bits} BITS</div>
                </div>
                <div style={{ fontSize:12,fontWeight:700,color:T.textMid }}>Earn bits by winning Patch Arena battles and completing tasks.</div>

                {/* Food section */}
                <div>
                  <div className="sec-label">🍎 FOOD — restores Stamina</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:8 }}>
                    {FOOD_ITEMS.map(function(food){
                      var ok = bits >= food.cost && (STAMINA_FOOD_CAP - foodStaminaToday) > 0;
                      return (
                        <div key={food.id} className="store-row" style={{ borderColor:ok?T.pink:T.border }}>
                          <span style={{ fontSize:24,flexShrink:0 }}>{food.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14,fontWeight:800 }}>{food.name}</div>
                            <div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"11px" }}>+{food.stamina}⚡ Stamina  ·  +{food.bond}💗 Bond  ·  {food.desc}</div>
                          </div>
                          <button className="px8" style={{ padding:"7px 12px",background:ok?T.pink+"22":"transparent",border:"2px solid "+(ok?T.pink:T.textDim),color:ok?T.pink:T.textDim,cursor:ok?"pointer":"not-allowed",fontSize:"11px",boxShadow:ok?"2px 2px 0 "+T.pink:"none" }}
                            onClick={function(){ if(ok) feedFood(food); }}>
                            {food.cost}🪙
                          </button>
                        </div>
                      );
                    })}
                    {STAMINA_FOOD_CAP-foodStaminaToday<=0&&<div style={{ fontSize:11,color:T.textDim,fontStyle:"italic",padding:"4px 0" }}>Daily food stamina cap reached. Resets tomorrow.</div>}
                  </div>
                </div>

                {/* Upgrades */}
                <div>
                  <div className="sec-label">⭐ UPGRADES & SPECIAL</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:8 }}>
                    {SHOP_ITEMS.map(function(item){
                      var ok = bits >= item.cost;
                      return (
                        <div key={item.id} className="store-row">
                          <span style={{ fontSize:24,flexShrink:0 }}>{item.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14,fontWeight:800 }}>{item.name}</div>
                            {item.desc&&<div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"11px" }}>{item.desc}</div>}
                          </div>
                          <button className="px8" style={{ padding:"7px 12px",background:ok?T.gold+"22":"transparent",border:"2px solid "+(ok?T.gold:T.textDim),color:ok?T.gold:T.textDim,cursor:ok?"pointer":"not-allowed",fontSize:"11px",boxShadow:ok?"2px 2px 0 "+T.gold:"none" }}
                            onClick={function(){ if(ok) buyShopItem(item); }}>
                            {item.cost}🪙
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── BREACH ───────────────────────────────────────────────── */}
            {page==="campaign"&&(function(){
              var raid     = CURRENT_RAID;
              var rs       = raidState || { totalDamage: 0, raidLog: [] };
              var dmg      = rs.totalDamage || 0;
              var bossHp   = raid.bossHp;
              var frac     = Math.min(1, dmg / bossHp);
              var pct      = Math.round(frac * 100);
              var defeated = frac >= 1;
              // Which phase are we in?
              var phaseIdx = raid.phases.findIndex(function(p){ return frac < p.threshold; });
              if (phaseIdx < 0) phaseIdx = raid.phases.length - 1;
              var phase    = raid.phases[phaseIdx];
              // Days remaining
              var endDate  = new Date(raid.endDate);
              var now2     = new Date();
              var daysLeft = Math.max(0, Math.ceil((endDate - now2) / 86400000));
              // Partner stats
              var bs       = activeDigi ? calcBattleStats(activeDigi) : null;
              var STAT_ICONS = { power:"⚔", guard:"🛡", focus:"🎯", momentum:"⚡" };
              var STAT_LABELS = { power:"Power", guard:"Guard", focus:"Focus", momentum:"Momentum" };
              var STAT_COLORS = { power:"#FF6B35", guard:"#7EB8F7", focus:"#B8A0E8", momentum:"#FFD700" };
              return (
                <div style={{ display:"flex",flexDirection:"column",gap:18 }}>

                  {/* Boss header */}
                  <div style={{ background:"linear-gradient(135deg,#0d0010,#150015,#0d0010)",border:"2px solid #9B59B6",boxShadow:"4px 4px 0 #9B59B6",padding:20,position:"relative",overflow:"hidden" }}>
                    {/* Star field */}
                    <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(155,89,182,0.18) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
                    <div style={{ display:"flex",gap:18,alignItems:"center",position:"relative" }}>
                      {/* Boss portrait */}
                      <div style={{ width:90,height:90,flexShrink:0,position:"relative",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <img src="/sprites/breach_boss_venommyotismon.gif" alt="VenomMyotismon" style={{ width:90,height:90,objectFit:"contain",imageRendering:"pixelated" }}/>
                        {!defeated && <div style={{ position:"absolute",top:-4,right:-4,width:10,height:10,background:"#cc0000",borderRadius:"50%",animation:"blink 0.8s step-end infinite" }}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div className="px8" style={{ color:"#9B59B6",fontSize:"10px",marginBottom:4 }}>COMMUNITY BREACH BOSS — {raid.type} / {raid.attr}</div>
                        <div style={{ fontSize:22,fontWeight:900,color:T.text,letterSpacing:1,marginBottom:4 }}>{raid.name}</div>
                        <div style={{ fontSize:12,fontWeight:700,color:"#9B59B6",fontStyle:"italic",marginBottom:10 }}>"{raid.title}"</div>
                        <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
                          {defeated
                            ? <span className="px8" style={{ padding:"3px 10px",background:"#FFD70033",border:"2px solid #FFD700",color:"#FFD700",fontSize:"11px" }}>★ DEFEATED</span>
                            : <span className="px8" style={{ padding:"3px 10px",background:"#cc000033",border:"2px solid #cc0000",color:"#cc0000",fontSize:"11px" }}>⚡ ACTIVE BREACH</span>
                          }
                          <span className="px8" style={{ color:T.textMid,fontSize:"11px" }}>{daysLeft > 0 ? daysLeft+" days remaining" : "Event ended"}</span>
                          <span className="px8" style={{ color:T.textDim,fontSize:"11px" }}>{raid.startDate} — {raid.endDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boss HP bar */}
                  <div className="pcard" style={{ padding:16 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                      <div className="px8" style={{ fontSize:"11px",color:T.textMid }}>COMMUNITY BOSS HP</div>
                      <div className="px8" style={{ color:defeated?"#FFD700":T.coral,fontSize:"12px" }}>{dmg.toLocaleString()} / {bossHp.toLocaleString()}</div>
                    </div>
                    {/* Phase markers */}
                    <div style={{ position:"relative",height:20,background:T.bgPanel,border:"2px solid "+T.border,overflow:"hidden",marginBottom:6 }}>
                      <div style={{ width:pct+"%",height:"100%",background:defeated?"linear-gradient(90deg,#FFD700,#FF9940)":"linear-gradient(90deg,#9B59B6,#cc0000)",transition:"width 0.5s ease",position:"relative" }}>
                        <div style={{ position:"absolute",top:2,left:3,right:3,height:4,background:"rgba(255,255,255,0.2)" }}/>
                      </div>
                      {/* Phase threshold lines */}
                      {raid.phases.slice(0,-1).map(function(p,i){
                        return (
                          <div key={i} style={{ position:"absolute",top:0,bottom:0,left:(p.threshold*100)+"%",width:2,background:p.color,opacity:0.8,zIndex:2 }}/>
                        );
                      })}
                    </div>
                    {/* Phase labels below bar */}
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
                      {raid.phases.map(function(p,i){
                        var isActive = i === phaseIdx && !defeated;
                        return (
                          <div key={i} style={{ textAlign:"center",opacity:isActive?1:0.4 }}>
                            <div className="px8" style={{ color:isActive?p.color:T.textDim,fontSize:"9px",fontWeight:isActive?900:400 }}>{p.name.toUpperCase()}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active phase callout */}
                    {!defeated && (
                      <div style={{ padding:"10px 14px",background:phase.color+"18",border:"2px solid "+phase.color,display:"flex",gap:10,alignItems:"center" }}>
                        <div style={{ fontSize:18,color:phase.color,flexShrink:0 }}>{STAT_ICONS[phase.dominant]}</div>
                        <div>
                          <div className="px8" style={{ color:phase.color,fontSize:"11px",marginBottom:3 }}>PHASE: {phase.name.toUpperCase()} — {STAT_LABELS[phase.dominant].toUpperCase()} ADVANTAGE</div>
                          <div style={{ fontSize:11,color:T.textMid,lineHeight:1.5 }}>{phase.desc}</div>
                        </div>
                      </div>
                    )}
                    {defeated && (
                      <div style={{ padding:"14px",background:"#FFD70018",border:"2px solid #FFD700",textAlign:"center" }}>
                        <div style={{ fontSize:24,marginBottom:6 }}>🏆</div>
                        <div className="px10" style={{ color:"#FFD700",marginBottom:6 }}>VENOM MYOTISMON DEFEATED!</div>
                        <div style={{ fontSize:12,color:T.textMid,lineHeight:1.6,marginBottom:10 }}>{raid.reward.desc}</div>
                        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                          <div style={{ fontSize:32 }}>🥚</div>
                          <div>
                            <div style={{ fontWeight:800,fontSize:13 }}>{raid.reward.name}</div>
                            <div className="px8" style={{ color:T.textDim,fontSize:"10px" }}>REWARD UNLOCKED</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Partner contribution stats */}
                  {activeDigi && bs && (
                    <div className="pcard" style={{ padding:16 }}>
                      <div className="px8" style={{ color:T.textDim,marginBottom:12,fontSize:"10px" }}>YOUR PARTNER'S RAID CONTRIBUTION</div>
                      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                        <DigiSprite digimonId={activeDigi.speciesId} size={44} animate mood="walk"/>
                        <div>
                          <div style={{ fontSize:13,fontWeight:800 }}>{activeDigi.name}</div>
                          <div className="px8" style={{ color:T.textMid,fontSize:"11px" }}>Lv.{activeDigi.level} · Active Partner</div>
                        </div>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        {["power","guard","focus","momentum"].map(function(s){
                          var key = s.charAt(0).toUpperCase()+s.slice(1);
                          var val = bs[key];
                          var isDominant = !defeated && phase && phase.dominant === s;
                          return (
                            <div key={s} style={{ padding:"10px",background:isDominant?STAT_COLORS[s]+"22":T.bgPanel,border:"2px solid "+(isDominant?STAT_COLORS[s]:T.border),position:"relative" }}>
                              {isDominant && <div className="px8" style={{ position:"absolute",top:4,right:4,color:STAT_COLORS[s],fontSize:"9px" }}>★ ACTIVE</div>}
                              <div style={{ fontSize:22,marginBottom:4 }}>{STAT_ICONS[s]}</div>
                              <div style={{ fontSize:20,fontWeight:900,color:STAT_COLORS[s] }}>{val}</div>
                              <div className="px8" style={{ color:T.textDim,fontSize:"10px",marginTop:2 }}>{STAT_LABELS[s].toUpperCase()}</div>
                              {isDominant && <div className="px8" style={{ color:STAT_COLORS[s],fontSize:"9px",marginTop:3 }}>+50% phase bonus</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Task type guide */}
                      <div style={{ marginTop:12,padding:"10px 12px",background:T.bgPanel,border:"1px solid "+T.border }}>
                        <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:8 }}>TASK → RAID STAT GUIDE</div>
                        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                          {[
                            ["Workout / Challenge","power"],
                            ["Deep Work / Reflection","focus"],
                            ["Maintenance / Recovery / Wellness","guard"],
                            ["Social","momentum"],
                          ].map(function(row){
                            var isDom = !defeated && phase && phase.dominant === row[1];
                            return (
                              <div key={row[0]} style={{ display:"flex",alignItems:"center",gap:8,opacity:isDom?1:0.6 }}>
                                <span style={{ fontSize:12,color:STAT_COLORS[row[1]] }}>{STAT_ICONS[row[1]]}</span>
                                <span style={{ fontSize:10,fontWeight:700,color:isDom?T.text:T.textMid }}>{row[0]}</span>
                                <span className="px8" style={{ marginLeft:"auto",color:STAT_COLORS[row[1]],fontSize:"10px" }}>{STAT_LABELS[row[1]]}{ isDom?" ★":""}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raid log */}
                  {rs.raidLog && rs.raidLog.length > 0 && (
                    <div className="pcard" style={{ padding:16 }}>
                      <div className="px8" style={{ color:T.textDim,marginBottom:10,fontSize:"10px" }}>YOUR RAID LOG</div>
                      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                        {rs.raidLog.slice(0,15).map(function(entry,i){
                          var sc = STAT_COLORS[entry.stat] || "#aaa";
                          return (
                            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.bgPanel,border:"1px solid "+T.border }}>
                              <div style={{ fontSize:14,color:sc,flexShrink:0 }}>{STAT_ICONS[entry.stat]||"⚔"}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:11,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{entry.taskTitle}</div>
                                {entry.phase && <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginTop:1 }}>{entry.phase} · {entry.date}</div>}
                              </div>
                              <div style={{ fontSize:13,fontWeight:900,color:sc,flexShrink:0 }}>+{entry.damage}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* ── DIGIDEX ──────────────────────────────────────────────── */}
            {page==="digidex"&&(function(){
              var stages = ["Baby","In-Training","Rookie","Champion","Ultimate","Mega","Ultra"];
              var allDigi = Object.values(DIGIMON_MAP);
              var byStage = {};
              stages.forEach(function(s){ byStage[s]=[]; });
              allDigi.forEach(function(d){ if(byStage[d.stage]) byStage[d.stage].push(d); });
              return (
                <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div className="px12">DIGIDEX</div>
                    <span className="px8" style={{ color:accent }}>{allDisc.length}/{allDigi.length} discovered</span>
                  </div>
                  <Bar value={allDisc.length} max={allDigi.length} color={accent} h={8}/>
                  {stages.map(function(stage){
                    var group = byStage[stage];
                    if (!group||group.length===0) return null;
                    var stCol     = STAGE_COLOR[stage]||"#aaa";
                    var collapsed = !!collapsedStages[stage];
                    var discovered = group.filter(function(d){return allDisc.includes(d.id);}).length;
                    return (
                      <div key={stage}>
                        <div
                          onClick={function(){ setCollapsedStages(function(prev){ var n=Object.assign({},prev); n[stage]=!prev[stage]; return n; }); }}
                          className="px8"
                          style={{ color:stCol,marginBottom:collapsed?0:10,fontSize:"12px",borderBottom:"1px solid "+T.border,paddingBottom:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none" }}>
                          <span>{stage.toUpperCase()} — {discovered}/{group.length}</span>
                          <span style={{ fontSize:"9px",opacity:0.7,marginLeft:8 }}>{collapsed?"▶":"▼"}</span>
                        </div>
                        {!collapsed && (
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8,marginTop:10 }}>
                            {group.map(function(d){
                              var known = allDisc.includes(d.id);
                              var role  = ROLES[d.role]||ROLES.Balanced;
                              var dCol  = STAGE_COLOR[d.stage]||"#aaa";
                              return (
                                <div key={d.id} onClick={function(e){ e.stopPropagation(); setDigidexEntry(d.id); }}
                                  style={{ padding:10,textAlign:"center",background:T.bgCard,border:"1.5px solid "+(known?dCol+"66":T.border),cursor:"pointer",transition:"border-color 0.15s",opacity:known?1:0.45 }}>
                                  <div style={{ display:"flex",justifyContent:"center",marginBottom:5,height:48,alignItems:"flex-end" }}>
                                    <DigiSprite digimonId={d.id} size={44} animate={false} mood="walk"/>
                                  </div>
                                  <div style={{ fontSize:9,fontWeight:800,color:known?T.text:T.textDim,marginBottom:2 }}>{d.name}</div>
                                  <div className="px8" style={{ color:dCol,fontSize:"10px" }}>{d.stage}</div>
                                  {known&&<div className="px8" style={{ color:role.color,marginTop:2,fontSize:"10px" }}>{role.icon} {d.role}</div>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── NETWORK ──────────────────────────────────────────────── */}
            {page==="network"&&(
              <NetworkPage userId={userId} accent={accent} T={T}/>
            )}

            {/* ── HEARTH ───────────────────────────────────────────────── */}
            {page==="hearth"&&(
              <HearthPage
                allDisc={allDisc}
                party={party}
                farm={farm}
                selectedBg={selectedBg}
                saveBackground={saveBackground}
                DIGIMON_MAP={DIGIMON_MAP}
                BACKGROUNDS={BACKGROUNDS}
                tamerName={tamerName}
                setPage={setPage}
                loginDay={loginDay}
                LOGIN_REWARDS={LOGIN_REWARDS}
                CREST_INFO={CREST_INFO}
              />
            )}

          </div>
        </main>

        {/* ═══ RIGHT — LOG + PARTY ════════════════════════════════════════ */}
        <aside className="right-col" style={{ background:T.bgPanel,borderLeft:"2px solid "+T.border,padding:"24px 18px",display:"flex",flexDirection:"column",gap:22,overflowY:"auto" }}>

          {/* Daily Quest */}
          <div>
            <div className="sec-title">DAILY QUEST</div>
            <div style={{ background:"linear-gradient(135deg,#1a1a00,#1f1800)",border:"2px solid "+T.gold,boxShadow:"3px 3px 0 "+T.gold,padding:14 }}>
              <div className="px8" style={{ color:T.gold,marginBottom:6 }}>🗡 PRODUCTIVITY WARRIOR</div>
              <div style={{ fontSize:12,fontWeight:700,color:T.textMid,marginBottom:10,lineHeight:1.5 }}>Complete 5 tasks to earn a Rare Treat!</div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ flex:1,height:10,background:T.bgCard,border:"1.5px solid "+T.border,overflow:"hidden" }}>
                  <div style={{ width:Math.min((doneToday.length/5)*100,100)+"%",height:"100%",background:T.coral }}/>
                </div>
                <div className="px8" style={{ color:T.gold,fontSize:"11px" }}>{doneToday.length}/5</div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <div className="sec-title">ACTIVITY LOG</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {actLog.map(function(entry,i){
                return (
                  <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                    <div style={{ width:24,height:24,border:"2px solid "+T.border,display:"grid",placeItems:"center",fontSize:12,flexShrink:0,background:T.bgCard }}>{entry.icon}</div>
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:T.textMid,lineHeight:1.5 }}>{entry.text}</div>
                      <div className="px8" style={{ color:T.textDim,marginTop:2,fontSize:"10px" }}>{entry.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Party */}
          <div>
            <div className="sec-title">PARTY</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {party.map(function(d,i){
                var inf2 = DIGIMON_MAP[d.speciesId];
                var role = inf2&&ROLES[inf2.role]?ROLES[inf2.role]:ROLES.Balanced;
                return (
                  <div key={d.uid} className="digi-card" style={{ display:"flex",alignItems:"center",gap:10,borderColor:i===0?accent:T.border }}
                    draggable onDragStart={function(){ dragIdx.current=i; }}
                    onDrop={function(){ if(dragIdx.current!==null&&dragIdx.current!==i){ setParty(function(p){ var a=p.slice(); var tmp=a[dragIdx.current]; a[dragIdx.current]=a[i]; a[i]=tmp; return a; }); } dragIdx.current=null; }}
                    onDragOver={function(e){ e.preventDefault(); }}>
                    <DigiSprite digimonId={d.speciesId} size={32} animate mood="walk"/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:800 }}>{d.name}</div>
                      <div className="px8" style={{ color:role.color,fontSize:"9px",marginTop:2 }}>{role.icon} {inf2&&inf2.role}</div>
                    </div>
                    {i===0&&<span className="px8" style={{ color:accent,fontSize:"11px" }}>★</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>
      </div>

      {/* ── MOBILE GROUP POPUPS (slides up above tab bar) ──────────────── */}
      {isMobile && mobilePopup && (
        <>
          <div style={{ position:"fixed",inset:0,zIndex:230,background:"rgba(0,0,0,0.55)" }}
            onClick={function(){ setMobilePopup(null); }}/>
          <div style={{ position:"fixed",bottom:60,left:0,right:0,zIndex:235,background:T.bgPanel,borderTop:"2px solid "+T.border,padding:"16px 16px 20px",animation:"slideUp 0.2s ease" }}>
            {mobilePopup === "pet" && (
              <>
                <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:12 }}>P.E.T.</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  {[
                    { id:"team",     icon:"◈",  label:"TEAM" },
                    { id:"digifarm", icon:"🌿", label:"FARM" },
                    { id:"digidex",  icon:"📖", label:"DIGIDEX" },
                  ].map(function(item){
                    var isAct = page === item.id;
                    return (
                      <button key={item.id}
                        onClick={function(){ setPage(item.id); setMobilePopup(null); }}
                        style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:isAct?accent+"22":T.bgCard,border:"1.5px solid "+(isAct?accent:T.border),cursor:"pointer",color:isAct?accent:T.textMid,fontFamily:"inherit",transition:"all 0.1s" }}>
                        <span style={{ fontSize:20 }}>{item.icon}</span>
                        <span className="px8" style={{ fontSize:"9px" }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {mobilePopup === "filehaven" && (
              <>
                <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:12 }}>FILEHAVEN</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  {[
                    { id:"tasks",  icon:"☑",  label:"TASKS" },
                    { id:"weekly", icon:"📅", label:"WEEK" },
                    { id:"crests", icon:"💎", label:"CRESTS" },
                  ].map(function(item){
                    var isAct = page === item.id;
                    return (
                      <button key={item.id}
                        onClick={function(){ setPage(item.id); setMobilePopup(null); }}
                        style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:isAct?accent+"22":T.bgCard,border:"1.5px solid "+(isAct?accent:T.border),cursor:"pointer",color:isAct?accent:T.textMid,fontFamily:"inherit",transition:"all 0.1s" }}>
                        <span style={{ fontSize:20 }}>{item.icon}</span>
                        <span className="px8" style={{ fontSize:"9px" }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {mobilePopup === "cyberspace" && (
              <>
                <div className="px8" style={{ color:T.textDim,fontSize:"9px",marginBottom:12 }}>CYBERSPACE</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                  {[
                    { id:"battle",   icon:"⚔",  label:"PATCH" },
                    { id:"campaign", icon:"☠",  label:"BREACH" },
                    { id:"store",    icon:"🛒", label:"STORE" },
                    { id:"network",  icon:"🔗", label:"NETWORK" },
                    { id:"hearth",   icon:"🏡", label:"HEARTH" },
                  ].map(function(item){
                    var isAct = page === item.id;
                    return (
                      <button key={item.id}
                        onClick={function(){ setPage(item.id); setMobilePopup(null); }}
                        style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:isAct?accent+"22":T.bgCard,border:"1.5px solid "+(isAct?accent:T.border),cursor:"pointer",color:isAct?accent:T.textMid,fontFamily:"inherit",transition:"all 0.1s" }}>
                        <span style={{ fontSize:20 }}>{item.icon}</span>
                        <span className="px8" style={{ fontSize:"9px" }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {localStorage.getItem('dv_force_mobile') === 'true' && (
              <button className="px8"
                onClick={function(){ toggleMobileView(); setMobilePopup(null); }}
                style={{ marginTop:14,width:"100%",padding:"10px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                🖥 SWITCH TO DESKTOP VIEW
              </button>
            )}
          </div>
        </>
      )}

      {/* ── MOBILE BOTTOM TAB BAR ────────────────────────────────────── */}
      {(function(){
        var petPageIds       = ["team","digifarm","digidex"];
        var filehavenPageIds = ["tasks","weekly","crests"];
        var cyberspacePageIds= ["battle","campaign","store","network","hearth"];
        var TABS = [
          { id:"pet",        icon:"📟", label:"P.E.T.",    popup:"pet" },
          { id:"filehaven",  icon:"🗂", label:"FILEHAVEN", popup:"filehaven" },
          { id:"chat",       icon:"💬", label:"CHAT",      page:"chat" },
          { id:"cyberspace", icon:"🌐", label:"CYBERSPACE",popup:"cyberspace" },
          { id:"home",       icon:"🐾", label:"HOME",      page:"dashboard" },
        ];
        return (
          <div className="mob-tab-bar" style={{ background:T.bgPanel,borderTop:"2px solid "+T.border }}>
            {TABS.map(function(tab){
              var isActive;
              if (tab.popup) {
                isActive = mobilePopup === tab.popup ||
                  (!mobilePopup && (
                    (tab.popup==="pet"        && petPageIds.includes(page)) ||
                    (tab.popup==="filehaven"  && filehavenPageIds.includes(page)) ||
                    (tab.popup==="cyberspace" && cyberspacePageIds.includes(page))
                  ));
              } else {
                isActive = !mobilePopup && page === tab.page;
              }
              return (
                <button key={tab.id} className="mob-tab-btn"
                  style={{ borderTopColor:isActive?accent:"transparent",color:isActive?accent:T.textMid }}
                  onClick={function(){
                    if (tab.popup) {
                      setMobilePopup(function(v){ return v===tab.popup ? null : tab.popup; });
                    } else {
                      setPage(tab.page);
                      setMobilePopup(null);
                    }
                  }}>
                  <div style={{ fontSize:21 }}>{tab.icon}</div>
                  <div className="px8" style={{ fontSize:"8px" }}>{tab.label}</div>
                </button>
              );
            })}
          </div>
        );
      })()}

    </div>
  );
}

// ── RadarChart (SVG, no deps) ─────────────────────────────────────────────────
function RadarChart({ percentages, T }) {
  var CRESTS = ["Courage","Hope","Knowledge","Reliability","Care","Friendship","Sincerity","Light"];
  var cx = 110, cy = 110, r = 80, n = CRESTS.length;
  function pt(i, pct) {
    var a = (i / n) * 2 * Math.PI - Math.PI / 2;
    var d = r * Math.min(pct, 100) / 100;
    return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
  }
  function outerPt(i) { return pt(i, 100); }
  var dataPoints  = CRESTS.map(function(c,i){ return pt(i, percentages[c]||0); });
  var outerPoints = CRESTS.map(function(_,i){ return outerPt(i); });
  var poly = dataPoints.map(function(p){ return p[0].toFixed(1)+","+p[1].toFixed(1); }).join(" ");
  var grids = [25,50,75,100];
  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      {/* Grid rings */}
      {grids.map(function(g){
        var gpts = CRESTS.map(function(_,i){ var p=pt(i,g); return p[0].toFixed(1)+","+p[1].toFixed(1); }).join(" ");
        return <polygon key={g} points={gpts} fill="none" stroke={T.border} strokeWidth={1} opacity={0.7}/>;
      })}
      {/* Axis lines */}
      {outerPoints.map(function(p,i){
        return <line key={i} x1={cx} y1={cy} x2={p[0].toFixed(1)} y2={p[1].toFixed(1)} stroke={T.border} strokeWidth={1} opacity={0.6}/>;
      })}
      {/* Data fill */}
      <polygon points={poly} fill="rgba(78,205,196,0.18)" stroke="#4ECDC4" strokeWidth={2}/>
      {/* Data dots */}
      {dataPoints.map(function(p,i){
        var ci = CREST_INFO[CRESTS[i]];
        return <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={4} fill={ci.color} stroke={T.bgCard} strokeWidth={1.5}/>;
      })}
      {/* Labels */}
      {outerPoints.map(function(p,i){
        var ci = CREST_INFO[CRESTS[i]];
        var lx = parseFloat((cx + (r+18) * Math.cos((i/n)*2*Math.PI - Math.PI/2)).toFixed(1));
        var ly = parseFloat((cy + (r+18) * Math.sin((i/n)*2*Math.PI - Math.PI/2)).toFixed(1));
        var sz = 16;
        return ci.img
          ? <image key={i} href={ci.img} x={lx-sz/2} y={ly-sz/2} width={sz} height={sz}/>
          : <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill={ci.color}>{ci.icon}</text>;
      })}
    </svg>
  );
}

// ── CrestsPage ────────────────────────────────────────────────────────────────
function CrestsPage({ crestProfile, crestHistory, crestMaterials, loginDay, activeDigi, activeInfo, bond, T, accent, isMobile, onGoTeam }) {
  var windowDays = 14;
  var today = new Date().toISOString().split('T')[0];
  var todayEntries = crestHistory.filter(function(e){ return e.date===today; });
  var todayCounts = {}; // { crestName: { primary: n, secondary: n } }
  todayEntries.forEach(function(e){
    if (e.primaryCrest) {
      if (!todayCounts[e.primaryCrest]) todayCounts[e.primaryCrest] = { primary:0, secondary:0 };
      todayCounts[e.primaryCrest].primary += e.primary||0;
    }
    if (e.secondaryCrest && (e.secondary||0) > 0) {
      if (!todayCounts[e.secondaryCrest]) todayCounts[e.secondaryCrest] = { primary:0, secondary:0 };
      todayCounts[e.secondaryCrest].secondary += e.secondary||0;
    }
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
      <div className="px12">CREST ALIGNMENT</div>

      {/* Primary / Secondary callout */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        {[
          { role:"Primary Crest",   key:crestProfile.primary },
          { role:"Supporting Crest",key:crestProfile.secondary },
        ].map(function(slot){
          var ci = slot.key ? CREST_INFO[slot.key] : null;
          return (
            <div key={slot.role} className="pcard" style={{ padding:16,borderColor:ci?ci.color:T.border,boxShadow:"3px 3px 0 "+(ci?ci.color:T.border) }}>
              <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"12px" }}>{slot.role.toUpperCase()}</div>
              {ci ? (
                <div>
                  <div style={{ marginBottom:8 }}><CrestIcon ci={ci} size={48}/></div>
                  <div style={{ fontSize:18,fontWeight:900,color:ci.color }}>{slot.key}</div>
                  <div style={{ fontSize:11,color:T.textMid,marginTop:4 }}>{ci.desc}</div>
                </div>
              ) : (
                <div style={{ fontSize:11,color:T.textDim,fontStyle:"italic" }}>Complete tasks to determine alignment.</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tendency Strips */}
      <div className="pcard" style={{ padding:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <div className="px9">ALIGNMENT PROFILE</div>
          <div style={{ fontSize:11,color:T.textMid }}>Rolling {windowDays}-day window</div>
        </div>
        {(function(){
          var totals = crestProfile.totals || {};
          var sorted = Object.entries(CREST_INFO)
            .map(function(e){ return { name:e[0], ci:e[1], val:totals[e[0]]||0 }; })
            .sort(function(a,b){ return b.val - a.val; });
          var maxVal = sorted[0] ? Math.max(sorted[0].val, 1) : 1;
          var hasAny = sorted.some(function(s){ return s.val > 0; });

          if (!hasAny) return (
            <div style={{ textAlign:"center",fontSize:11,color:T.textDim,fontStyle:"italic",padding:"12px 0" }}>
              Complete tasks to reveal your alignment.
            </div>
          );

          return (
            <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
              {sorted.map(function(s){
                var isPrim = s.name === crestProfile.primary;
                var isSec  = s.name === crestProfile.secondary;
                var barPct = (s.val / maxVal) * 100;
                var opacity = s.val === 0 ? 0.2 : isPrim ? 1 : isSec ? 0.82 : Math.max(0.35, barPct / 100 * 0.9);
                return (
                  <div key={s.name} style={{ display:"flex",alignItems:"center",gap:10,opacity:opacity }}>
                    <div style={{ width:20,height:20,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <CrestIcon ci={s.ci} size={18}/>
                    </div>
                    <span style={{ width:84,fontSize:11,fontWeight:isPrim?900:700,color:s.ci.color,flexShrink:0,lineHeight:1 }}>
                      {s.name}
                      {isPrim && <span style={{ color:T.gold,marginLeft:4,fontSize:9 }}>★</span>}
                      {isSec  && <span style={{ color:T.textMid,marginLeft:4,fontSize:9 }}>◆</span>}
                    </span>
                    <div style={{ flex:1,height:8,background:T.bgPanel,border:"1px solid "+T.border,position:"relative",overflow:"hidden" }}>
                      <div style={{ position:"absolute",inset:0,width:barPct+"%",background:s.ci.color,transition:"width 0.7s ease" }}/>
                      <div style={{ position:"absolute",top:1,left:2,right:2,height:3,background:"rgba(255,255,255,0.15)",pointerEvents:"none" }}/>
                    </div>
                    <span style={{ width:26,fontSize:10,fontWeight:800,color:isPrim?s.ci.color:T.textDim,textAlign:"right",flexShrink:0 }}>
                      {s.val > 0 ? s.val : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Today's crest activity */}
      <div className="pcard" style={{ padding:14 }}>
        <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"12px" }}>TODAY'S CREST ACTIVITY</div>
        {Object.keys(todayCounts).length > 0 ? (
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            {Object.entries(todayCounts).map(function([name,counts]){
              var ci = CREST_INFO[name];
              var hasPrimary   = counts.primary > 0;
              var hasSecondary = counts.secondary > 0;
              return (
                <div key={name} style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:"1.5px solid "+ci.color,background:ci.color+"18" }}>
                  <CrestIcon ci={ci} size={16}/>
                  <div style={{ display:"flex",flexDirection:"column",gap:1 }}>
                    <span style={{ fontSize:11,fontWeight:800,color:ci.color,lineHeight:1 }}>{name}</span>
                    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                      {hasPrimary&&<span className="px8" style={{ color:ci.color }}>+{counts.primary}</span>}
                      {hasSecondary&&(
                        <span className="px8" style={{ color:ci.color,opacity:0.65 }}>
                          {hasPrimary?"+"+counts.secondary+" sec":"+"+counts.secondary+" sec"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize:11,color:T.textDim,fontStyle:"italic" }}>No crest tasks completed yet today.</div>
        )}
      </div>

      {/* Crest materials stockpile */}
      <div className="pcard" style={{ padding:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div className="px8" style={{ color:T.textMid,fontSize:"12px" }}>CREST MATERIALS</div>
          <div style={{ fontSize:10,color:T.textDim }}>Login Day {loginDay}/60</div>
        </div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {Object.entries(CREST_INFO).map(function([name, ci]){
            var amount = (crestMaterials && crestMaterials[name]) || 0;
            return (
              <div key={name} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 9px",border:"1.5px solid "+(amount>0?ci.color:T.border),background:amount>0?ci.color+"12":T.bgPanel }}>
                <CrestIcon ci={ci} size={13}/>
                <span style={{ fontSize:11,color:amount>0?ci.color:T.textDim,fontWeight:amount>0?800:400 }}>{name}</span>
                <span className="px8" style={{ fontSize:"10px",color:amount>0?ci.color:T.textDim,marginLeft:2 }}>×{amount}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:10,color:T.textDim,fontStyle:"italic" }}>Spend on your partner's Crest Stages in the Team tab.</div>
        </div>
      </div>

      {/* Evolution path hint — now shows crest stage requirements */}
      {activeInfo&&activeInfo.evolvesTo&&activeInfo.evolvesTo.length>0&&(
        <div className="pcard" style={{ padding:14 }}>
          <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"12px" }}>EVOLUTION PATHS FROM {(activeDigi&&activeDigi.name)||"PARTNER"}</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {activeInfo.evolvesTo.map(function(id){
              var ti = DIGIMON_MAP[id];
              if (!ti||ti.fusionOf) return null;
              var cr = ti.crestReq;
              if (!cr) return null;
              var pci = CREST_INFO[cr.primary];
              var sci = cr.secondary ? CREST_INFO[cr.secondary] : null;
              var stageReq = CREST_STAGE_EVO_REQ[ti.stage] || {};
              var digiStages = (activeDigi && activeDigi.crestStages) || {};
              var pStage = digiStages[cr.primary] || 0;
              var sStage = sci ? (digiStages[cr.secondary] || 0) : null;
              var pMet   = pStage >= (stageReq.primary || 0);
              var sMet   = sStage === null || sStage >= (stageReq.secondary || 0);
              return (
                <div key={id} style={{ padding:"10px 12px",background:T.bgPanel,border:"2px solid "+(pMet&&sMet?T.gold:T.border) }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                    <DigiSprite digimonId={id} size={36} animate mood="walk"/>
                    <div>
                      <div style={{ fontSize:13,fontWeight:800 }}>{ti.name}</div>
                      <div className="px8" style={{ color:STAGE_COLOR[ti.stage]||"#aaa",fontSize:"10px" }}>{ti.stage}</div>
                    </div>
                    {pMet&&sMet&&<span className="px8" style={{ marginLeft:"auto",padding:"3px 8px",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"10px" }}>READY ✓</span>}
                  </div>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    <span className="px8" style={{ fontSize:"10px",color:pMet?T.green:T.coral,display:"inline-flex",alignItems:"center",gap:3 }}>
                      <CrestIcon ci={pci} size={11}/> Stage {stageReq.primary||0} {pMet?"✓":"✗("+pStage+")"}
                    </span>
                    {sci&&<span className="px8" style={{ fontSize:"10px",color:sMet?T.green:T.coral,display:"inline-flex",alignItems:"center",gap:3 }}>
                      <CrestIcon ci={sci} size={11}/> Stage {stageReq.secondary||0} {sMet?"✓":"✗("+sStage+")"}
                    </span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="px8" style={{ marginTop:12,padding:"8px 14px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"11px" }} onClick={onGoTeam}>
            GO TO TEAM →
          </button>
        </div>
      )}
    </div>
  );
}

// ── NetworkPage ───────────────────────────────────────────────────────────────
function NetworkPage({ userId, accent, T }) {
  var [tab,         setTab]         = useState("friends");   // "friends" | "pvp"
  var [searchId,    setSearchId]    = useState("");
  var [searchResult,setSearchResult]= useState(null);  // null | "loading" | { found, profile } | "error"
  var [friends,     setFriends]     = useState([]);
  var [loadedOnce,  setLoadedOnce]  = useState(false);
  var [pvpInvites,  setPvpInvites]  = useState([]);    // placeholder for future invite system

  // supabase is imported at the top of this module — accessible directly
  var sb = supabase;

  useEffect(function() {
    if (!userId || loadedOnce) return;
    setLoadedOnce(true);
    loadFriends();
  }, [userId]);

  async function loadFriends() {
    if (!sb) return;
    var { data } = await sb.from('friends')
      .select('friend_id, profiles:friend_id(display_name, login_streak, bond)')
      .eq('user_id', userId);
    if (data) setFriends(data.map(function(r) {
      return { id: r.friend_id, name: r.profiles?.display_name || "Tamer", streak: r.profiles?.login_streak || 0, bond: r.profiles?.bond || 0 };
    }));
  }

  async function searchUser() {
    var q = searchId.trim();
    if (!q || !sb) return;
    setSearchResult("loading");
    // search by user UUID or display_name
    var { data } = await sb.from('profiles')
      .select('id, display_name, login_streak')
      .or('id.eq.' + q + ',display_name.ilike.' + q)
      .neq('id', userId)
      .limit(1)
      .single();
    if (data) {
      // check if already friends
      var { data: existing } = await sb.from('friends').select('id').eq('user_id', userId).eq('friend_id', data.id).single();
      setSearchResult({ found: true, profile: data, alreadyFriend: !!existing });
    } else {
      setSearchResult({ found: false });
    }
  }

  async function addFriend(profile) {
    if (!sb) return;
    await sb.from('friends').upsert({ user_id: userId, friend_id: profile.id });
    setFriends(function(f) { return f.concat([{ id: profile.id, name: profile.display_name || "Tamer", streak: profile.login_streak || 0, bond: 0 }]); });
    setSearchResult(Object.assign({}, searchResult, { alreadyFriend: true }));
  }

  async function removeFriend(friendId) {
    if (!sb) return;
    await sb.from('friends').delete().eq('user_id', userId).eq('friend_id', friendId);
    setFriends(function(f) { return f.filter(function(x) { return x.id !== friendId; }); });
  }

  var inputSt = { background:T.bgPanel,border:"2px solid "+T.border,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"'Nunito',sans-serif",boxSizing:"border-box" };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div className="px12">🔗 NETWORK</div>
        <div className="px8" style={{ color:T.textMid }}>{friends.length} connections</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"2px 2px 0 "+T.border,width:"fit-content" }}>
        {[["friends","CONNECTIONS"],["pvp","FRIENDLY PVP"]].map(function(pair){
          var active = tab === pair[0];
          return (
            <button key={pair[0]} className="task-tab"
              style={{ background:active?T.bg:T.bgCard,color:active?accent:T.textMid }}
              onClick={function(){ setTab(pair[0]); }}>{pair[1]}</button>
          );
        })}
      </div>

      {/* ── CONNECTIONS tab ── */}
      {tab==="friends"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

          {/* Search */}
          <div className="pcard" style={{ padding:14 }}>
            <div className="px8" style={{ color:accent,marginBottom:10,fontSize:"11px" }}>ADD BY USER ID OR NAME</div>
            <div style={{ display:"flex",gap:8 }}>
              <input
                value={searchId}
                onChange={function(e){ setSearchId(e.target.value); setSearchResult(null); }}
                onKeyDown={function(e){ if(e.key==="Enter") searchUser(); }}
                placeholder="Enter user ID or display name…"
                style={Object.assign({},inputSt,{flex:1})}
              />
              <button className="px8"
                style={{ padding:"9px 16px",background:accent,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontWeight:800,fontSize:"12px",flexShrink:0 }}
                onClick={searchUser}>SEARCH</button>
            </div>

            {/* Search result */}
            {searchResult==="loading"&&(
              <div style={{ marginTop:10,fontSize:12,color:T.textMid }}>Searching…</div>
            )}
            {searchResult&&searchResult!=="loading"&&!searchResult.found&&(
              <div style={{ marginTop:10,fontSize:12,color:T.coral }}>No tamer found with that ID or name.</div>
            )}
            {searchResult&&searchResult.found&&(
              <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:12,background:T.bgCard,border:"2px solid "+T.border,padding:"10px 14px" }}>
                <div style={{ width:36,height:36,background:accent+"22",border:"2px solid "+accent,display:"grid",placeItems:"center",fontSize:18,flexShrink:0 }}>🧑</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:800 }}>{searchResult.profile.display_name||"Tamer"}</div>
                  <div className="px8" style={{ color:T.textMid,fontSize:"10px",marginTop:2 }}>🔥 {searchResult.profile.login_streak||0} day streak</div>
                </div>
                {searchResult.alreadyFriend
                  ? <span className="px8" style={{ color:T.mint,fontSize:"11px" }}>✓ CONNECTED</span>
                  : <button className="px8"
                      style={{ padding:"7px 14px",background:accent,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontSize:"11px",fontWeight:800 }}
                      onClick={function(){ addFriend(searchResult.profile); }}>+ CONNECT</button>
                }
              </div>
            )}
          </div>

          {/* Friends list */}
          {friends.length===0
            ? <div className="pcard" style={{ padding:32,textAlign:"center",color:T.textMid }}>Your network is empty. Search for tamers to connect.</div>
            : friends.map(function(f){
                return (
                  <div key={f.id} className="pcard" style={{ padding:"12px 14px",display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ width:38,height:38,background:T.bgPanel,border:"2px solid "+T.border,display:"grid",placeItems:"center",fontSize:18,flexShrink:0 }}>🧑</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:800 }}>{f.name}</div>
                      <div style={{ display:"flex",gap:10,marginTop:4 }}>
                        <span className="px8" style={{ color:T.coral,fontSize:"10px" }}>🔥 {f.streak}d streak</span>
                        <span className="px8" style={{ color:T.pink,fontSize:"10px" }}>💗 Bond {Math.round(f.bond)}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                      <button className="px8"
                        style={{ padding:"6px 12px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"11px" }}
                        onClick={function(){ setTab("pvp"); }}>⚔ CHALLENGE</button>
                      <button
                        style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:16,padding:"4px 6px",lineHeight:1 }}
                        onClick={function(){ removeFriend(f.id); }} title="Remove">×</button>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── FRIENDLY PVP tab ── */}
      {tab==="pvp"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div className="pcard" style={{ padding:20,textAlign:"center" }}>
            <div style={{ fontSize:32,marginBottom:10 }}>⚔</div>
            <div className="px12" style={{ color:accent,marginBottom:8 }}>FRIENDLY PVP</div>
            <div style={{ fontSize:12,fontWeight:700,color:T.textMid,lineHeight:1.7,maxWidth:380,margin:"0 auto" }}>
              Challenge friends from your Network to a Patch battle. Your team's real-world stats — built from tasks you've completed — determine your power.
            </div>
            <div style={{ marginTop:18,display:"flex",flexDirection:"column",gap:10 }}>
              {friends.length===0
                ? <div style={{ fontSize:12,color:T.textDim }}>Add connections first to issue a challenge.</div>
                : friends.map(function(f){
                    return (
                      <div key={f.id} style={{ display:"flex",alignItems:"center",gap:12,background:T.bgCard,border:"2px solid "+T.border,padding:"10px 14px" }}>
                        <div style={{ fontSize:18,flexShrink:0 }}>🧑</div>
                        <div style={{ flex:1,textAlign:"left" }}>
                          <div style={{ fontSize:13,fontWeight:800 }}>{f.name}</div>
                          <div className="px8" style={{ color:T.coral,fontSize:"10px",marginTop:2 }}>🔥 {f.streak}d streak</div>
                        </div>
                        <button className="px8"
                          style={{ padding:"7px 14px",background:T.coral,border:"2px solid "+T.border,color:"white",cursor:"pointer",fontSize:"11px",fontWeight:800 }}>
                          ⚔ SEND CHALLENGE
                        </button>
                      </div>
                    );
                  })
              }
            </div>
            {pvpInvites.length>0&&(
              <div style={{ marginTop:16,borderTop:"2px solid "+T.border,paddingTop:14 }}>
                <div className="px8" style={{ color:T.gold,marginBottom:10 }}>INCOMING CHALLENGES</div>
                {pvpInvites.map(function(inv,i){
                  return (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:10,background:T.bgCard,border:"2px solid "+T.gold,padding:"10px 14px",marginBottom:8 }}>
                      <div style={{ flex:1,fontSize:12,fontWeight:700 }}>{inv.from} challenged you!</div>
                      <button className="px8" style={{ padding:"6px 12px",background:accent,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontSize:"11px" }}>ACCEPT</button>
                      <button className="px8" style={{ padding:"6px 10px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"11px" }}>DECLINE</button>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop:20,fontSize:11,color:T.textDim,fontStyle:"italic" }}>
              Live PvP matchmaking coming soon — invites and async challenge mode are next.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TasksPage ─────────────────────────────────────────────────────────────────
function TasksPage({ tasks, onComplete, onAdd, onEdit, onDelete, onReschedule, accent, streak, T }) {
  var [filterTpl,      setFilterTpl]      = useState("All");
  var [filterType,     setFilterType]     = useState("All");
  var [showAdd,        setShowAdd]        = useState(false);
  var [editId,         setEditId]         = useState(null);
  var [visibleDone,    setVisibleDone]    = useState(5);
  var [detailTask,     setDetailTask]     = useState(null);
  var [expandedCards,  setExpandedCards]  = useState({});
  var [form, setForm] = useState({ title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:"" });

  function toggleCardExpand(id, e) {
    e.stopPropagation();
    setExpandedCards(function(prev){ return Object.assign({}, prev, { [id]: !prev[id] }); });
  }

  function reset(){ setForm({title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:""}); }
  function submitAdd(){ if(!form.title.trim())return; document.activeElement?.blur(); window.scrollTo(0,0); onAdd(form); reset(); setShowAdd(false); }
  function submitEdit(){ if(!editId||!form.title.trim())return; document.activeElement?.blur(); window.scrollTo(0,0); onEdit(editId,form); setEditId(null); reset(); }
  function startEdit(t){ setDetailTask(null); setEditId(t.id); setForm({title:t.title,template:t.template||"Neutral",priority:t.priority,difficulty:t.difficulty,type:t.type,notes:t.notes||"",daysOfWeek:t.daysOfWeek||[],dueDate:t.dueDate||""}); }

  var typeColor = { once:T.lavender, daily:T.teal, recurring:T.mint };
  var PRIO_ORDER = { Urgent:0, High:1, Medium:2, Low:3 };
  var filtered  = tasks.filter(function(t){ return (filterTpl==="All"||t.template===filterTpl)&&(filterType==="All"||t.type===filterType); });
  var pendTasks = filtered.filter(function(t){ return !t.done; }).sort(function(a,b){
    return (PRIO_ORDER[a.priority]??99) - (PRIO_ORDER[b.priority]??99);
  });
  var compTasks = filtered.filter(function(t){ return t.done; }).sort(function(a,b){
    var da = a.lastCompletedDate || '0000-00-00';
    var db = b.lastCompletedDate || '0000-00-00';
    if (da > db) return -1;
    if (da < db) return 1;
    return 0;
  });
  var MAX_DONE  = 50;
  var TPL_CREST_CI = {
    "Workout":    CREST_INFO["Courage"],
    "Deep Work":  CREST_INFO["Knowledge"],
    "Recovery":   CREST_INFO["Care"],
    "Maintenance":CREST_INFO["Reliability"],
    "Social":     CREST_INFO["Friendship"],
    "Reflection": CREST_INFO["Sincerity"],
    "Challenge":  CREST_INFO["Hope"],
    "Wellness":   CREST_INFO["Light"],
    "Neutral":    null,
  };

  // Detail popup for a pending task
  var dt = detailTask;
  var dtXp   = dt ? calcXpReward(dt, streak) : 0;
  var dtCg   = dt ? calcCrestGain(dt.template, dt.difficulty) : null;
  var dtStars = dt ? (dt.difficulty==="Hard"?3:dt.difficulty==="Medium"?2:1) : 0;

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {/* Template filter */}
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"2px 2px 0 "+T.border,flexShrink:0,flexWrap:"wrap" }}>
          {["All","Workout","Deep Work","Recovery","Maintenance","Social","Reflection","Challenge","Wellness","Neutral"].map(function(c){
            var a=filterTpl===c;
            var ci=TPL_CREST_CI[c];
            return (
              <button key={c} title={c} className="task-tab"
                style={{ background:a?T.bgCard:T.bg,outline:a?"2px solid "+accent:"none",outlineOffset:"-2px",padding:"5px 7px",minWidth:0,display:"flex",alignItems:"center",justifyContent:"center" }}
                onClick={function(){ setFilterTpl(c); setVisibleDone(5); }}>
                {c==="All"
                  ? <span className="px8" style={{ color:a?accent:T.textMid,fontSize:"10px" }}>ALL</span>
                  : ci ? <CrestIcon ci={ci} size={18}/> : <span style={{ fontSize:13,color:a?accent:T.textDim }}>○</span>
                }
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"2px 2px 0 "+T.border,flexShrink:0 }}>
          {["All","once","daily","recurring"].map(function(tp){
            var a=filterType===tp;
            return <button key={tp} className="task-tab" style={{ background:a?T.bg:T.bgCard,color:a?accent:T.textMid }} onClick={function(){ setFilterType(tp); setVisibleDone(5); }}>{tp==="once"?"ONE-TIME":tp.toUpperCase()}</button>;
          })}
        </div>
      </div>

      {showAdd&&!editId&&<TaskForm form={form} setForm={setForm} onSubmit={submitAdd} onCancel={function(){document.activeElement?.blur();setShowAdd(false);reset();}} label="ADD TASK" accent={accent} T={T}/>}
      {!showAdd&&!editId&&(
        <button className="px8" style={{ padding:"11px 18px",background:T.coral,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,color:"white",cursor:"pointer",textAlign:"left",fontSize:"12px" }} onClick={function(){setShowAdd(true);}}>+ NEW TASK</button>
      )}

      {filtered.length===0&&<div className="pcard" style={{ padding:40,textAlign:"center",color:T.textMid }}>No tasks found.</div>}

      {pendTasks.map(function(t){
        var tci  = TPL_CREST_CI[t.template];
        var txp  = calcXpReward(t, streak);
        var tcg  = calcCrestGain(t.template, t.difficulty);
        var expanded = !!expandedCards[t.id];
        return (
          <div key={t.id}>
            {editId===t.id
              ? <TaskForm form={form} setForm={setForm} onSubmit={submitEdit} onCancel={function(){document.activeElement?.blur();setEditId(null);reset();}} label="SAVE" accent={accent} T={T}/>
              : (
                <div className={"task-card tc-"+(t.priority||"low").toLowerCase()} style={{ cursor:"pointer" }}
                  onClick={function(e){
                    if (e.target.closest('.task-check')||e.target.closest('button')) return;
                    setDetailTask(detailTask&&detailTask.id===t.id ? null : t);
                  }}>
                  <div className="task-check" onClick={function(e){ e.stopPropagation(); onComplete(t.id); }}></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      {tci&&<CrestIcon ci={tci} size={14}/>}
                      <div style={{ fontSize:14,fontWeight:800 }}>{t.title}</div>
                    </div>
                    {expanded&&(
                      <div style={{ display:"flex",gap:5,marginTop:6,flexWrap:"wrap",alignItems:"center" }}>
                        <span className="px8" style={{ padding:"2px 6px",background:T.bgPanel,border:"1.5px solid "+(typeColor[t.type]||T.border),color:typeColor[t.type]||T.textMid,fontSize:"10px" }}>{t.type==="once"?"ONE-TIME":t.type.toUpperCase()}</span>
                        <span className="px8" style={{ padding:"2px 6px",background:"#1a1500",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"10px" }}>+{txp} XP</span>
                        {tcg&&<span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+(CREST_INFO[tcg.primaryCrest]?.color||T.border),color:CREST_INFO[tcg.primaryCrest]?.color||T.textMid,background:T.bgPanel,fontSize:"10px",display:"inline-flex",alignItems:"center",gap:3 }}><CrestIcon ci={CREST_INFO[tcg.primaryCrest]} size={10}/>+{tcg.primary} {tcg.primaryCrest}</span>}
                        <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+(PCOL[t.priority]||T.border),color:PCOL[t.priority]||T.text,background:T.bgPanel,fontSize:"10px" }}>{t.priority.toUpperCase()}</span>
                      </div>
                    )}
                    {((t.streak||0)>0||t.dueDate)&&(
                      <div style={{ display:"flex",gap:6,marginTop:4,alignItems:"center" }}>
                        {(t.streak||0)>0&&<span className="px8" style={{ color:T.coral,fontSize:"11px" }}>🔥 {t.streak}D</span>}
                        {t.dueDate&&t.type==='once'&&<span className="px8" style={{ color:T.teal,fontSize:"11px" }}>📅 {t.dueDate}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex",gap:2,alignItems:"center",flexShrink:0 }}>
                    <button style={{ background:"none",border:"none",color:expanded?accent:T.textDim,cursor:"pointer",fontSize:13,padding:"2px 5px",lineHeight:1 }} title="Toggle rewards" onClick={function(e){ toggleCardExpand(t.id,e); }}>◈</button>
                    <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:14,padding:"2px 4px" }} onClick={function(e){e.stopPropagation();startEdit(t);}}>✏</button>
                    <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"2px 4px",lineHeight:1 }} onClick={function(e){e.stopPropagation();onDelete(t.id);}}>×</button>
                  </div>
                </div>
              )
            }
          </div>
        );
      })}

      {/* ── Task detail popup ─────────────────────────────────────────────── */}
      {dt&&!editId&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 28px" }}
          onClick={function(){ setDetailTask(null); }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.border,boxShadow:"4px 4px 0 "+T.border,maxWidth:480,width:"calc(100% - 32px)",padding:20,display:"flex",flexDirection:"column",gap:14 }}
            onClick={function(e){ e.stopPropagation(); }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
              <div style={{ fontSize:15,fontWeight:900,color:T.text,lineHeight:1.4 }}>{dt.title}</div>
              <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20,padding:0,lineHeight:1,flexShrink:0 }} onClick={function(){ setDetailTask(null); }}>×</button>
            </div>
            {dt.notes&&<div style={{ fontSize:12,color:T.textMid,lineHeight:1.6 }}>{dt.notes}</div>}
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
              <span className="px8" style={{ padding:"3px 8px",border:"1.5px solid "+T.border,color:T.textMid,background:T.bgPanel,fontSize:"11px" }}>{dt.template}</span>
              <span className="px8" style={{ padding:"3px 8px",background:T.bgPanel,border:"1.5px solid "+(typeColor[dt.type]||T.border),color:typeColor[dt.type]||T.textMid,fontSize:"11px" }}>{dt.type==="once"?"ONE-TIME":dt.type.toUpperCase()}</span>
              <span className="px8" style={{ padding:"3px 8px",border:"1.5px solid "+(PCOL[dt.priority]||T.border),color:PCOL[dt.priority]||T.text,background:T.bgPanel,fontSize:"11px" }}>{dt.priority.toUpperCase()}</span>
              <span className="px8" style={{ padding:"3px 8px",background:"#1a1500",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"11px" }}>+{dtXp} XP</span>
              {dtCg&&<span className="px8" style={{ padding:"3px 8px",border:"1.5px solid "+(CREST_INFO[dtCg.primaryCrest]?.color||T.border),color:CREST_INFO[dtCg.primaryCrest]?.color||T.textMid,background:T.bgPanel,fontSize:"11px",display:"inline-flex",alignItems:"center",gap:4 }}><CrestIcon ci={CREST_INFO[dtCg.primaryCrest]} size={12}/>+{dtCg.primary} {dtCg.primaryCrest}</span>}
              <span style={{ display:"inline-flex",gap:2 }}>{[1,2,3].map(function(n){return <span key={n} style={{ fontSize:12,color:n<=dtStars?T.gold:T.textDim }}>★</span>;})}</span>
              {(dt.streak||0)>0&&<span className="px8" style={{ color:T.coral,fontSize:"11px" }}>🔥 {dt.streak}D streak</span>}
              {dt.dueDate&&dt.type==='once'&&<span className="px8" style={{ color:T.teal,fontSize:"11px" }}>📅 {dt.dueDate}</span>}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button className="px8" style={{ flex:1,padding:"10px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"12px",fontWeight:800 }}
                onClick={function(){ onComplete(dt.id); setDetailTask(null); }}>
                ✓ COMPLETE
              </button>
              <button className="px8" style={{ padding:"10px 14px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"12px" }}
                onClick={function(){ startEdit(dt); }}>
                ✏ EDIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Completed tasks ───────────────────────────────────────────────── */}
      {compTasks.length>0&&(
        <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:4 }}>
          <div className="sec-label">✓ COMPLETED ({compTasks.length})</div>
          {compTasks.slice(0, visibleDone).map(function(t){
            return (
              <div key={t.id} className="task-card done tc-low">
                <div className="task-check checked"><span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:T.textMid,textDecoration:"line-through" }}>{t.title}</div>
                  {(t.streak||0)>0&&<span className="px8" style={{ color:T.coral,fontSize:"11px",marginTop:2,display:"block" }}>🔥 {t.streak}D streak</span>}
                </div>
                <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"2px 4px",lineHeight:1 }} onClick={function(){onDelete(t.id);}}>×</button>
              </div>
            );
          })}
          {visibleDone < Math.min(compTasks.length, MAX_DONE) && (
            <button className="px8" style={{ padding:"9px 16px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"11px",alignSelf:"center" }}
              onClick={function(){ setVisibleDone(function(n){ return Math.min(n+5, MAX_DONE); }); }}>
              LOAD MORE ({Math.min(compTasks.length, MAX_DONE) - visibleDone} remaining)
            </button>
          )}
          {compTasks.length > MAX_DONE && visibleDone >= MAX_DONE && (
            <div className="px8" style={{ textAlign:"center",color:T.textDim,fontSize:"11px",padding:"4px 0" }}>
              Showing most recent {MAX_DONE} completed tasks
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── WeeklyPlannerPage ─────────────────────────────────────────────────────────
function WeeklyPlannerPage({ tasks, party, farm, weeklyDigimon, onAssignDigimon, onReschedule, onComplete, accent, T }) {
  var [showDaily,     setShowDaily]     = useState(true);
  var [showRecurring, setShowRecurring] = useState(true);
  var [showDone,      setShowDone]      = useState(false);
  var today = new Date();
  var todayDayIdx = today.getDay(); // 0=Sun … 6=Sat
  var ALL_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  // Rotate so today is always leftmost; show today + next 6 days
  var DAYS = Array.from({length:7}, function(_,i){ return ALL_DAYS[(todayDayIdx+i)%7]; });
  var weekDates = Array.from({length:7}, function(_,i){ var d=new Date(today); d.setDate(today.getDate()+i); return d; });
  // Use local date strings to avoid UTC-shift bugs (e.g. Sunday midnight local = Saturday UTC)
  function localISO(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  var todayStr = localISO(today);
  var allDigimon = party.concat(farm);
  var BUSY_COLOR = ['#7EF797','#FFD700','#FF9940','#FF4444'];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8 }}>
        <div>
          <div className="px12">WEEKLY PLANNER</div>
          <div style={{ fontSize:10,fontWeight:700,color:T.textMid,marginTop:4 }}>
            {weekDates[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {weekDates[6].toLocaleDateString('en-US',{month:'short',day:'numeric'})}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <span style={{ fontFamily:"'Press Start 2P',monospace",fontSize:"8px",color:T.textDim }}>SHOW</span>
          <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"2px 2px 0 "+T.border }}>
            {[
              { key:"daily",     label:"DAILY",  active:showDaily,     set:setShowDaily,     color:T.teal },
              { key:"recurring", label:"RECUR",  active:showRecurring, set:setShowRecurring, color:T.mint },
              { key:"done",      label:"DONE",   active:showDone,      set:setShowDone,      color:T.lavender },
            ].map(function(btn){
              return (
                <button key={btn.key}
                  onClick={function(){ btn.set(function(v){ return !v; }); }}
                  style={{ fontFamily:"'Press Start 2P',monospace",fontSize:"8px",padding:"5px 9px",cursor:"pointer",
                    border:"none",borderRight:"1px solid "+T.border,
                    background:btn.active?btn.color+"28":"transparent",
                    color:btn.active?btn.color:T.textDim }}>
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {(function(){
        var pending = tasks.filter(function(t){ return !t.done&&t.dueDate; });
        var unscheduled = tasks.filter(function(t){ return !t.done&&!t.dueDate&&t.type==='once'; });
        return (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div style={{ background:T.coral+"18",border:"2px solid "+T.coral,padding:"10px 14px" }}>
              <div className="px8" style={{ color:T.coral,marginBottom:3,fontSize:"12px" }}>📋 REMAINING THIS WEEK</div>
              <div style={{ fontSize:22,fontWeight:900 }}>{pending.length}</div>
            </div>
            <div style={{ background:T.textDim+"18",border:"2px solid "+T.border,padding:"10px 14px" }}>
              <div className="px8" style={{ color:T.textMid,marginBottom:3,fontSize:"12px" }}>📭 UNSCHEDULED</div>
              <div style={{ fontSize:22,fontWeight:900 }}>{unscheduled.length}</div>
            </div>
          </div>
        );
      })()}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,overflowX:"auto" }}>
        {weekDates.map(function(date,i){
          var dateStr   = localISO(date);
          var dayLabel  = DAYS[i];
          var isToday   = dateStr===todayStr;
          var WEEK_PRIO = { Urgent:0, High:1, Medium:2, Low:3 };
          var dayTasks  = tasks.filter(function(t){
            if (t.dueDate===dateStr) return true;
            if (showDaily && t.type==='daily') return true;
            if (showRecurring && t.type==='recurring' && (t.daysOfWeek||[]).includes(dayLabel)) return true;
            return false;
          }).map(function(t){
            // Per-day done: daily/recurring are only done if completed on this specific date
            var doneOnThisDay = (t.type==='daily'||t.type==='recurring')
              ? t.lastCompletedDate===dateStr
              : t.done;
            return Object.assign({},t,{done:doneOnThisDay});
          }).sort(function(a,b){
            // Pending tasks first, then by priority
            if (a.done !== b.done) return a.done ? 1 : -1;
            return (WEEK_PRIO[a.priority]??99) - (WEEK_PRIO[b.priority]??99);
          });
          var pendCount = dayTasks.filter(function(t){ return !t.done; }).length;
          var busyColor = BUSY_COLOR[pendCount===0?0:pendCount<=2?1:pendCount<=4?2:3];
          var assignedDigi = allDigimon.find(function(d){ return d.uid===weeklyDigimon[dayLabel]; });
          return (
            <div key={dayLabel} style={{ minWidth:130,background:T.bgCard,border:"2px solid "+(isToday?accent:T.border),boxShadow:"3px 3px 0 "+(isToday?accent:T.border),display:"flex",flexDirection:"column",overflow:"hidden" }}>
              <div style={{ background:isToday?accent+"22":T.bgPanel,padding:"8px 10px",borderBottom:"2px solid "+T.border }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px8" style={{ color:isToday?accent:T.text,fontSize:"12px" }}>{dayLabel}</div>
                  <div style={{ width:8,height:8,background:busyColor,border:"1px solid "+T.border }}/>
                </div>
                <div style={{ fontSize:10,fontWeight:700,color:T.textMid,marginTop:2 }}>{date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
              </div>
              <div style={{ padding:"8px 10px",borderBottom:"2px solid "+T.border,background:T.bgPanel }}>
                {assignedDigi ? (
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <DigiSprite digimonId={assignedDigi.speciesId} size={28} animate mood="walk"/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:10,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{assignedDigi.name}</div>
                      <div className="px8" style={{ color:T.gold,fontSize:"10px" }}>⚡1.5x XP</div>
                    </div>
                    <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:12,padding:0 }} onClick={function(){ onAssignDigimon(dayLabel,null); }}>×</button>
                  </div>
                ) : (
                  <select defaultValue="" onChange={function(e){ if(e.target.value) onAssignDigimon(dayLabel,e.target.value); }} style={{ width:"100%",background:T.bgPanel,border:"1.5px solid "+T.border,padding:"4px 6px",color:T.textMid,fontSize:11,cursor:"pointer",fontFamily:"'Nunito',sans-serif",outline:"none" }}>
                    <option value="" disabled>+ Assign</option>
                    {party.length>0&&<optgroup label="Party">{party.map(function(d){return <option key={d.uid} value={d.uid}>{d.name}</option>;})}</optgroup>}
                    {farm.length>0&&<optgroup label="Farm">{farm.map(function(d){return <option key={d.uid} value={d.uid}>{d.name}</option>;})}</optgroup>}
                  </select>
                )}
              </div>
              <div style={{ padding:"8px 10px",display:"flex",flexDirection:"column",gap:6,flex:1 }}>
                {(function(){
                  var visible = showDone ? dayTasks : dayTasks.filter(function(t){ return !t.done; });
                  if (visible.length===0) {
                    var allDone = dayTasks.length>0 && dayTasks.every(function(t){ return t.done; });
                    return <div style={{ fontSize:10,color:allDone?T.teal:T.textDim,fontStyle:"italic" }}>{allDone?"✓ All done":"No tasks"}</div>;
                  }
                  return visible.map(function(t){
                    var isDaily     = t.type==='daily';
                    var isRecurring = t.type==='recurring';
                    var borderCol   = t.done?T.border:isDaily?T.lavender:isRecurring?T.mint:T.teal;
                    var typeLabel   = isDaily?"⟳ DAILY":isRecurring?"↻ RECURRING":t.template;
                    return (
                      <div key={t.id+'-'+dateStr} style={{ background:t.done?T.bgPanel:T.bgCard,border:"1.5px solid "+borderCol,padding:"5px 7px",opacity:t.done?0.5:1 }}>
                        <div style={{ display:"flex",alignItems:"flex-start",gap:5 }}>
                          <div style={{ width:14,height:14,border:"1.5px solid "+(t.done?T.teal:T.border),background:t.done?T.teal:"transparent",display:"grid",placeItems:"center",flexShrink:0,cursor:"pointer",marginTop:1 }} onClick={function(){ if(!t.done)onComplete(t.id); }}>
                            {t.done&&<span style={{ fontSize:9,color:"white",lineHeight:1,fontWeight:900 }}>✓</span>}
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:11,fontWeight:700,color:t.done?T.textMid:T.text,textDecoration:t.done?"line-through":"none",lineHeight:1.3,wordBreak:"break-word" }}>{t.title}</div>
                            <div style={{ fontSize:9,fontWeight:700,color:T.textDim,marginTop:2 }}>{typeLabel}</div>
                          </div>
                        </div>
                        {!t.done&&t.type==='once'&&(
                          <input type="date" defaultValue={t.dueDate||""} onBlur={function(e){ if(e.target.value&&e.target.value!==t.dueDate) onReschedule(t.id,e.target.value); }}
                            style={{ width:"100%",marginTop:5,background:T.bgPanel,border:"1px solid "+T.border,padding:"3px 5px",color:T.textMid,fontSize:10,outline:"none",fontFamily:"'Nunito',sans-serif",colorScheme:"dark" }}/>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          );
        })}
      </div>
      {(function(){
        var unscheduled = tasks.filter(function(t){ return !t.done&&!t.dueDate&&t.type==='once'; });
        if (!unscheduled.length) return null;
        return (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div className="sec-label">📭 UNSCHEDULED TASKS</div>
            {unscheduled.map(function(t){
              return (
                <div key={t.id} style={{ background:T.bgCard,border:"2px solid "+T.border,padding:"10px 14px",display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:700 }}>{t.title}</div>
                    <div style={{ fontSize:11,color:T.textMid,marginTop:2 }}>{t.priority} · {t.template}</div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span className="px8" style={{ color:T.textDim,fontSize:"11px" }}>DUE:</span>
                    <input type="date" defaultValue="" onBlur={function(e){ if(e.target.value) onReschedule(t.id,e.target.value); }}
                      style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"5px 8px",color:T.text,fontSize:12,outline:"none",fontFamily:"'Nunito',sans-serif",colorScheme:"dark" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ── TaskForm ──────────────────────────────────────────────────────────────────
function TaskForm({ form, setForm, onSubmit, onCancel, label, accent, T }) {
  var inputSt = { background:T.bgPanel,border:"2px solid "+T.border,padding:"9px 12px",color:T.text,fontSize:16,outline:"none",width:"100%",fontFamily:"'Nunito',sans-serif",boxSizing:"border-box" };
  var selSt   = Object.assign({},inputSt,{cursor:"pointer"});
  var TEMPLATES = ["Workout","Deep Work","Recovery","Maintenance","Social","Reflection","Challenge","Wellness","Neutral"];
  var cg = calcCrestGain(form.template, form.difficulty);
  var PCOL = { Low:"#C3B1E1", Medium:"#4ECDC4", High:"#FF6B6B", Urgent:"#FF4444" };

  return (
    <div style={{ background:T.bgCard,border:"2px solid "+accent,boxShadow:"3px 3px 0 "+accent,padding:16,display:"flex",flexDirection:"column",gap:10 }}>
      <input value={form.title} onChange={function(e){setForm(function(f){return Object.assign({},f,{title:e.target.value});});}} onKeyDown={function(e){if(e.key==="Enter")onSubmit();}} placeholder="Task title..." autoFocus style={inputSt}/>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <select value={form.type} onChange={function(e){setForm(function(f){return Object.assign({},f,{type:e.target.value});});}} style={Object.assign({},selSt,{flex:1,minWidth:100})}>
          <option value="once">One-Time</option><option value="daily">Daily</option><option value="recurring">Recurring</option>
        </select>
        <select value={form.template} onChange={function(e){setForm(function(f){return Object.assign({},f,{template:e.target.value});});}} style={Object.assign({},selSt,{flex:1,minWidth:120})}>
          {TEMPLATES.map(function(c){return <option key={c}>{c}</option>;})}
        </select>
        <select value={form.priority} onChange={function(e){setForm(function(f){return Object.assign({},f,{priority:e.target.value});});}} style={Object.assign({},selSt,{flex:1,minWidth:80,color:PCOL[form.priority]||"#e8eaf0"})}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <select value={form.difficulty} onChange={function(e){setForm(function(f){return Object.assign({},f,{difficulty:e.target.value});});}} style={Object.assign({},selSt,{flex:1,minWidth:80})}>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>
      {/* Crest preview */}
      {cg && (
        <div style={{ display:"flex",gap:8,alignItems:"center",padding:"8px 10px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
          <CrestIcon ci={CREST_INFO[cg.primaryCrest]} size={15}/>
          <span style={{ fontSize:11,fontWeight:700,color:CREST_INFO[cg.primaryCrest]?.color }}>+{cg.primary} {cg.primaryCrest}</span>
          {cg.secondaryCrest&&cg.secondary>0&&<>
            <span style={{ color:T.textDim }}>·</span>
            <span style={{ fontSize:11,fontWeight:700,color:CREST_INFO[cg.secondaryCrest]?.color }}>+{cg.secondary} {cg.secondaryCrest}</span>
          </>}
          <span style={{ fontSize:11,color:T.textDim,marginLeft:"auto" }}>on complete</span>
        </div>
      )}
      {form.type==="recurring"&&(
        <div style={{ display:"flex",gap:4,flexWrap:"wrap",alignItems:"center" }}>
          <span className="px8" style={{ color:T.textMid,fontSize:"12px" }}>DAYS:</span>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(function(d){
            var on=(form.daysOfWeek||[]).indexOf(d)>=0;
            return <button key={d} className="px8" style={{ padding:"4px 8px",border:"1.5px solid "+(on?accent:T.border),background:on?accent+"22":"transparent",color:on?accent:T.textDim,cursor:"pointer",fontSize:"11px" }}
              onClick={function(){setForm(function(f){var dw=f.daysOfWeek||[];return Object.assign({},f,{daysOfWeek:on?dw.filter(function(x){return x!==d;}):dw.concat([d])});});}}>{d}</button>;
          })}
        </div>
      )}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <span className="px8" style={{ color:T.textMid,fontSize:"12px",whiteSpace:"nowrap" }}>DUE DATE:</span>
        <input type="date" value={form.dueDate||""} onChange={function(e){setForm(function(f){return Object.assign({},f,{dueDate:e.target.value||null});});}} style={Object.assign({},inputSt,{flex:1,colorScheme:"dark"})}/>
        {form.dueDate&&<button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:16,padding:"0 4px",flexShrink:0 }} onClick={function(){setForm(function(f){return Object.assign({},f,{dueDate:null});});}}>×</button>}
      </div>
      <textarea value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});});}} placeholder="Notes (optional)..." rows={2} style={Object.assign({},inputSt,{resize:"vertical"})}/>
      <div style={{ display:"flex",gap:8 }}>
        <button className="px8" style={{ padding:"9px 18px",background:accent,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontWeight:800,fontSize:"12px",boxShadow:"2px 2px 0 "+T.border }} onClick={onSubmit}>{label}</button>
        <button className="px8" style={{ padding:"9px 14px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"12px" }} onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

// ── REST Modal ────────────────────────────────────────────────────────────────
function RestModal({ sleepState, sleepLog, activeDigi, T, accent, onStart, onWake, onClose }) {
  function defaultWake() {
    var d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() < 30 ? 0 : 30);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }
  var [wakeTime, setWakeTime] = useState(defaultWake);
  var isSleeping = sleepState && (sleepState.phase === 'sleeping' || sleepState.phase === 'countdown');

  var PRESETS = (function() {
    var now = Date.now();
    return [
      { label:"+30m", mins:30 },
      { label:"+1h",  mins:60 },
      { label:"+2h",  mins:120 },
      { label:"+4h",  mins:240 },
      { label:"+8h",  mins:480 },
    ].map(function(p) {
      var d = new Date(now + p.mins * 60 * 1000);
      d.setSeconds(0, 0);
      var val = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
      return { label: p.label, val: val };
    });
  }());

  function fmtDuration(mins) {
    if (mins < 60) return mins + "m";
    return Math.floor(mins/60) + "h " + (mins%60) + "m";
  }

  var isAndroid = /Android/i.test(navigator.userAgent);
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function openNativeAlarm() {
    var parts = wakeTime.split(':').map(Number);
    var h = parts[0]; var m = parts[1];
    if (isAndroid) {
      // Android intent — opens Clock app with alarm pre-filled; user taps Save
      var url = 'intent://set_alarm#Intent;action=android.intent.action.SET_ALARM;' +
        'S.android.intent.extra.alarm.MESSAGE=DailyDigivolve%20Wake%20Up;' +
        'i.android.intent.extra.alarm.HOUR=' + h + ';' +
        'i.android.intent.extra.alarm.MINUTES=' + m + ';' +
        'B.android.intent.extra.alarm.SKIP_UI=false;end';
      window.location.href = url;
    } else if (isIOS) {
      // iOS has no alarm creation URL — just open Clock so user can set it manually
      window.location.href = 'clock://';
    }
  }

  return (
    <div style={{ background:T.bgCard,border:"2px solid "+T.lavender,boxShadow:"4px 4px 0 "+T.lavender,width:"100%",maxWidth:440,animation:"jijiIn 0.3s ease",overflow:"hidden" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(90deg,#0d0820,#08050d)",borderBottom:"2px solid "+T.lavender,padding:"10px 16px",display:"flex",alignItems:"center",gap:10 }}>
        <span style={{ fontSize:16 }}>🌙</span>
        <div className="px9" style={{ color:T.lavender }}>REST & SLEEP TRACKER</div>
        <div style={{ flex:1 }}/>
        <button onClick={onClose} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"0 4px" }}>×</button>
      </div>

      <div style={{ padding:20,display:"flex",flexDirection:"column",gap:16 }}>

        {/* Current state */}
        {isSleeping ? (
          <div style={{ background:T.bgPanel,border:"1.5px solid "+T.lavender,padding:"14px 16px",display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ fontSize:32 }}>💤</div>
            <div style={{ flex:1 }}>
              <div className="px8" style={{ color:T.lavender,marginBottom:4,fontSize:"11px" }}>
                {sleepState.phase === 'countdown' ? "WINDING DOWN..." : "SLEEPING"}
              </div>
              <div style={{ fontSize:12,color:T.textMid }}>
                {sleepState.phase === 'countdown'
                  ? (activeDigi ? activeDigi.name + " is settling in..." : "Getting sleepy...")
                  : "Alarm set for " + sleepState.wakeTime
                }
              </div>
              {activeDigi && (
                <div style={{ fontSize:11,color:T.textDim,marginTop:3 }}>
                  Bedtime: {new Date(sleepState.startedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </div>
              )}
            </div>
            <DigiSprite digimonId={activeDigi&&activeDigi.speciesId} size={44} mood="sleepy" animate={false}/>
          </div>
        ) : (
          <div style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"12px 14px" }}>
            <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"11px" }}>SET WAKE-UP ALARM</div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
              <input
                type="time"
                value={wakeTime}
                onChange={function(e){ setWakeTime(e.target.value||"07:00"); }}
                style={{ fontFamily:"'Press Start 2P',monospace",fontSize:18,fontWeight:900,color:T.lavender,background:T.bgCard,border:"2px solid "+T.lavender,padding:"8px 12px",outline:"none",colorScheme:"dark",flex:1 }}
              />
            </div>
            {/* Quick presets */}
            <div className="px8" style={{ color:T.textDim,marginBottom:6,fontSize:"10px" }}>QUICK SELECT</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {PRESETS.map(function(p){
                return (
                  <button key={p.val}
                    className="px8"
                    style={{ padding:"5px 10px",background:wakeTime===p.val?T.lavender+"33":"transparent",border:"1.5px solid "+(wakeTime===p.val?T.lavender:T.border),color:wakeTime===p.val?T.lavender:T.textMid,cursor:"pointer",fontSize:"11px" }}
                    onClick={function(){ setWakeTime(p.val); }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action */}
        {isSleeping ? (
          <button className="px8"
            style={{ padding:"10px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"12px" }}
            onClick={onWake}>
            ☀ WAKE UP EARLY
          </button>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <button className="px8"
              style={{ padding:"10px",background:T.lavender+"22",border:"2px solid "+T.lavender,color:T.lavender,cursor:"pointer",fontSize:"12px" }}
              onClick={function(){ onStart(wakeTime); }}>
              🌙 BEGIN REST — ALARM {wakeTime}
            </button>
            {(isAndroid || isIOS) && (
              <button className="px8"
                onClick={openNativeAlarm}
                style={{ padding:"9px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
                <span>⏰</span>
                <span>{isAndroid ? 'SET IN CLOCK APP — ' + wakeTime : 'OPEN CLOCK APP (SET MANUALLY)'}</span>
              </button>
            )}
            {isIOS && (
              <div style={{ fontSize:10,color:T.textDim,textAlign:"center",lineHeight:1.6 }}>
                iOS doesn't allow apps to create alarms automatically. Set {wakeTime} manually in Clock as a backup.
              </div>
            )}
          </div>
        )}

        {/* Sleep log */}
        {sleepLog.length > 0 && (
          <div>
            <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"11px" }}>SLEEP HISTORY</div>
            <div style={{ display:"flex",flexDirection:"column",gap:4,maxHeight:160,overflowY:"auto" }}>
              {sleepLog.slice(0,7).map(function(entry,i){
                return (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,background:T.bgPanel,padding:"7px 10px",border:"1px solid "+T.border,fontSize:11 }}>
                    <div style={{ color:T.textDim,minWidth:72 }}>{entry.date}</div>
                    <div style={{ color:T.lavender,minWidth:40 }}>{entry.bedtime}</div>
                    <span style={{ color:T.textDim }}>→</span>
                    <div style={{ color:T.teal,minWidth:40 }}>{entry.waketime}</div>
                    <div style={{ marginLeft:"auto",color:T.gold,fontWeight:900 }}>{fmtDuration(entry.durationMins)}</div>
                  </div>
                );
              })}
            </div>
            {sleepLog.length > 0 && (function(){
              var recent = sleepLog.slice(0,7);
              var avg = Math.round(recent.reduce(function(s,e){ return s+e.durationMins; },0) / recent.length);
              return (
                <div style={{ marginTop:8,padding:"7px 10px",background:T.bgPanel,border:"1px solid "+T.lavender+"44",display:"flex",justifyContent:"space-between" }}>
                  <span className="px8" style={{ color:T.textDim,fontSize:"10px" }}>7-DAY AVG SLEEP</span>
                  <span style={{ color:T.lavender,fontWeight:900,fontSize:12 }}>{fmtDuration(avg)}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

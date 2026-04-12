// ─── App.jsx ──────────────────────────────────────────────────────────────────
import { supabase } from './lib/supabase.js';
import { useState, useEffect, useMemo, useRef } from "react";
import DigiSprite from "./components/DigiSprite.jsx";
import { Bar } from "./components/ui.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { DIGIMON_MAP } from "./data/digimon.js";
import {
  STAGE_COLOR, ATTR_COLOR, PRIORITY_COLORS, TASK_TEMPLATES, DAYS_OF_WEEK,
  CREST_INFO, ROLES, PERSONALITIES, MAX_PARTY_SIZE, BATTLE_REWARDS,
  STAMINA_MAX, STAMINA_COSTS, FOOD_ITEMS, SHOP_ITEMS, STAMINA_FOOD_CAP, EVO_REQUIREMENTS,
  CURRENT_RAID, TEMPLATE_RAID_STAT, RAID_DIFF_MULT,
} from "./data/constants.js";
import {
  calcBattleStats, calcBattleDamage, calcXpReward, applyXpGain, newDigimon,
  calcCrestGain, calcCrestProfile, checkEvoEligible, calcCurrentStamina, clampBond,
} from "./data/engine.js";

// ── Design tokens ─────────────────────────────────────────────────────────────
var T = {
  bg:"#0d0f14", bgPanel:"#111318", bgCard:"#161a22", border:"#2a2d3a",
  pixelBorder:"#7EB8F7", text:"#e8eaf0", textMid:"#8a90a8", textDim:"#4a5070",
  coral:"#FF6B6B", teal:"#4ECDC4", lavender:"#C3B1E1", mint:"#A8E6CF",
  gold:"#FFD700", red:"#FF4444", green:"#5CB85C", pink:"#FF9EB5",
};
var PCOL = { Low:T.lavender, Medium:T.teal, High:T.coral, Urgent:T.red };

function px(c){ return { border:"2px solid "+(c||T.pixelBorder), boxShadow:"3px 3px 0 "+(c||T.pixelBorder) }; }

// ── Nav ───────────────────────────────────────────────────────────────────────
var NAV = [
  { id:"dashboard", label:"HOME",    icon:"⌂" },
  { id:"tasks",     label:"TASKS",   icon:"☑" },
  { id:"weekly",    label:"WEEK",    icon:"📅" },
  { id:"crests",    label:"CRESTS",  icon:"💎" },
  { id:"team",      label:"TEAM",    icon:"◈" },
  { id:"digifarm",  label:"FARM",    icon:"🌿" },
  { id:"battle",    label:"BATTLE",  icon:"⚔" },
  { id:"campaign",  label:"RAID",    icon:"☠" },
  { id:"chat",      label:"CHAT",    icon:"💬" },
  { id:"store",     label:"STORE",   icon:"🛒" },
  { id:"digidex",   label:"DIGIDEX", icon:"📖" },
];

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

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App({ session }) {
  var [page,             setPage]             = useState("dashboard");
  var [party,            setParty]            = useState([]);
  var [farm,             setFarm]             = useState([]);
  var [bits,             setBits]             = useState(350);
  var [allDisc,          setAllDisc]          = useState([]);
  var [tasks,            setTasks]            = useState([]);
  var [weeklyDigimon,    setWeeklyDigimon]    = useState({});
  var [speech,           setSpeech]           = useState("finish your tasks!");
  var [actLog,           setActLog]           = useState([{ icon:"⭐", text:"DailyDigivolve started! Welcome, Tamer.", time:"JUST NOW" }]);
  var [toast,            setToast]            = useState(null);
  var [evoAnim,          setEvoAnim]          = useState(null);
  var [battleState,      setBattleState]      = useState(null);
  // New systems
  var [bond,             setBond]             = useState(0);
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
  var [petX,             setPetX]             = useState(0);   // horizontal offset px in pet stage
  var [petFacingRight,   setPetFacingRight]   = useState(false);
  var [digidexEntry,     setDigidexEntry]     = useState(null); // selected digimon for detail modal
  var [loginStreak,      setLoginStreak]      = useState(0);
  var [digitamaCredits,  setDigitamaCredits]  = useState(0);
  var [showDigitamaModal,setShowDigitamaModal]= useState(false);
  var [confirmReset,     setConfirmReset]     = useState(false);
  var [dedigivolveConfirm, setDedigivolveConfirm] = useState(null); // { uid, prevId } | null
  // raidState: null | { raidId, totalDamage, raidLog:[{date,damage,taskTitle,stat,phase}] }
  var [raidState,        setRaidState]        = useState(null);
  var [raidHit,          setRaidHit]          = useState(null); // { damage, stat } flashed on task complete
  // sleepState: null | { phase:'countdown'|'sleeping', startedAt:ISO, wakeTime:"HH:MM", sleepDate:"YYYY-MM-DD" }
  var [sleepState,       setSleepState]       = useState(null);
  var [showRestModal,    setShowRestModal]    = useState(false);
  var [sleepLog,         setSleepLog]         = useState([]);
  var [wakeGreeting,     setWakeGreeting]     = useState(null); // shown once on wake

  var dragIdx = useRef(null);
  var userId  = session.user.id;

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(function() {
    async function load() {
      var today = new Date().toISOString().split('T')[0];
      var [{ data:profile }, { data:digimonData }, { data:tasksData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('digimon').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
      ]);

      if (profile) {
        setBits(profile.bits || 350);
        setTamerName(profile.display_name || "Tamer");
        setWeeklyDigimon(profile.weekly_digimon || {});
        setBond(profile.bond || 0);

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
        if (lastLogin !== today) {
          var yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          var prevMilestone = Math.floor(curStreak / 30);
          curStreak = (lastLogin === yest) ? curStreak + 1 : 1;
          var earned = Math.floor(curStreak / 30) - prevMilestone;
          if (earned > 0) { curCreds += earned; setShowDigitamaModal(true); }
          var loginBond = clampBond((profile.bond || 0) + 2);
          setBond(loginBond);
          await supabase.from('profiles').update({
            last_login_date: today, login_streak: curStreak,
            digitama_credits: curCreds, bond: loginBond,
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
        if (ss && ss.phase === 'sleeping') {
          var now = new Date();
          var [wh, wm] = (ss.wakeTime || "07:00").split(':').map(Number);
          var wakeToday = new Date(now); wakeToday.setHours(wh, wm, 0, 0);
          // If wake time is earlier than current time, it may be AM the next day context — check sleepDate
          if (ss.sleepDate !== today) { wakeToday.setDate(wakeToday.getDate()); }
          if (now >= wakeToday) {
            // Wake time has passed — greet and clear sleep
            handleWakeUp(ss, profile.sleep_log || [], false);
          } else {
            setSleepState(ss);
          }
        }
      }

      if (digimonData && digimonData.length > 0) {
        var mapped = digimonData.map(function(d) { return {
          uid: d.id, speciesId: d.species_id, name: d.name, level: d.level,
          exp: d.exp, expNeeded: d.exp_needed, abi: d.abi || 0,
          personality: d.personality, bonusStats: d.bonus_stats || {},
          discovered: d.discovered || [], inFarm: d.in_farm, isXForm: d.is_x_form,
        }; });
        setParty(mapped.filter(function(d){ return !d.inFarm; }));
        setFarm(mapped.filter(function(d){ return d.inFarm; }));
        var allD = [...new Set(digimonData.flatMap(function(d){ return d.discovered || []; }))];
        setAllDisc(allD);
      } else {
        var starter = newDigimon('agumon', {});
        var { data:newDigi } = await supabase.from('digimon').insert({
          user_id: userId, species_id: starter.speciesId, name: starter.name,
          level: 1, exp: 0, exp_needed: 100, abi: 0, personality: starter.personality,
          bonus_stats: {}, discovered: ['agumon'], in_farm: false, sort_order: 0,
        }).select().single();
        if (newDigi) setParty([Object.assign({}, starter, { uid:newDigi.id })]);
      }

      if (tasksData) {
        var todayDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
        setTasks(tasksData.filter(function(t) {
          if (t.type !== 'recurring') return true;
          if (!t.days_of_week || !t.days_of_week.length) return true;
          return t.days_of_week.includes(todayDay);
        }).map(function(t) { return {
          id: t.id, title: t.title,
          template: t.category || 'Neutral', // category column stores template values
          priority: t.priority, difficulty: t.difficulty, type: t.type,
          notes: t.notes || '', done: t.done, streak: t.streak || 0,
          daysOfWeek: t.days_of_week || [], dueDate: t.due_date || null,
        }; }));
      }
    }
    load();
  }, [userId]);

  // ── Pomodoro countdown ───────────────────────────────────────────────────────
  useEffect(function() {
    if (!pomodoroState || pomodoroState.phase !== 'running') return;
    var id = setTimeout(function() {
      setPomodoroState(function(ps) {
        if (!ps || ps.phase !== 'running') return ps;
        var next = ps.timeLeft - 1;
        if (next <= 0) return Object.assign({}, ps, { phase:'done', timeLeft:0 });
        return Object.assign({}, ps, { timeLeft: next });
      });
    }, 1000);
    return function() { clearTimeout(id); };
  }, [pomodoroState]);

  // ── Wake alarm polling (checks every minute if alarm time reached) ────────────
  useEffect(function() {
    if (!sleepState || sleepState.phase !== 'sleeping') return;
    var interval = setInterval(function() {
      var now = new Date();
      var [wh, wm] = (sleepState.wakeTime || "07:00").split(':').map(Number);
      var wakeTime = new Date(now); wakeTime.setHours(wh, wm, 0, 0);
      if (now >= wakeTime) {
        clearInterval(interval);
        handleWakeUp(sleepState, sleepLog, false);
      }
    }, 60000);
    return function() { clearInterval(interval); };
  }, [sleepState, sleepLog]);

  // ── Partner walk-around — moves left/right in pet stage, flips when going right ─
  var _petDirRef = useRef(false); // false=left, true=right
  useEffect(function() {
    var cancelled = false;
    var MAX = 72; // max px offset from centre (stage ~260px wide, sprite 84px)
    function step() {
      if (cancelled) return;
      var move = 14 + Math.random() * 22;
      var dir  = _petDirRef.current ? 1 : -1;
      setPetX(function(x) {
        var next = x + dir * move;
        if (next > MAX)  { _petDirRef.current = false; setPetFacingRight(false); return MAX; }
        if (next < -MAX) { _petDirRef.current = true;  setPetFacingRight(true);  return -MAX; }
        // 20 % chance to randomly turn around
        if (Math.random() < 0.20) {
          _petDirRef.current = !_petDirRef.current;
          setPetFacingRight(_petDirRef.current);
        }
        return next;
      });
      setTimeout(step, 900 + Math.random() * 1300);
    }
    var t = setTimeout(step, 600);
    return function() { cancelled = true; clearTimeout(t); };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  var activeDigi  = party[0];
  var activeInfo  = activeDigi ? DIGIMON_MAP[activeDigi.speciesId] : null;
  var streak      = tasks.reduce(function(m,t){ return Math.max(m, t.streak||0); }, 0);
  var accent      = activeInfo ? (ATTR_COLOR[activeInfo.attr]||T.teal) : T.teal;
  var pendTasks   = tasks.filter(function(t){ return !t.done; });
  var doneTasks   = tasks.filter(function(t){ return  t.done; });
  var xpToday     = doneTasks.reduce(function(s,t){ return s + calcXpReward(t, streak); }, 0);
  var todayKey    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];

  var crestProfile = useMemo(function() {
    return calcCrestProfile(crestHistory, 14);
  }, [crestHistory]);

  var playUsedToday   = bondActionsToday.play  || 0;
  var taskBondToday   = bondActionsToday.tasks || 0;
  var playAvailable   = doneTasks.length >= 3 && playUsedToday < 3;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function addLog(icon, text) {
    setActLog(function(l){ return [{ icon, text, time:"JUST NOW" }].concat(l.slice(0,7)); });
  }
  function toast_(msg, color) {
    setToast({ msg, color:color||T.green });
    setTimeout(function(){ setToast(null); }, 2800);
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
    var newCreds = digitamaCredits + 1;
    setDigitamaCredits(newCreds);
    await supabase.from('profiles').update({ digitama_credits: newCreds }).eq('id', userId);
    setConfirmReset(false);
    setShowDigitamaModal(true);
    toast_("Choose your new partner! 🥚", "#FFD700");
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
    var now = new Date();
    var ss = {
      phase: 'countdown',
      startedAt: now.toISOString(),
      wakeTime: wakeTime,
      sleepDate: now.toISOString().split('T')[0],
    };
    setSleepState(ss);
    setShowRestModal(false);
    setSpeech(getSleepMsg(SLEEP_GOODNIGHT, "good night... 💤"));
    await supabase.from('profiles').update({ sleep_state: ss }).eq('id', userId);
    // After 2 minutes, transition to sleeping phase
    setTimeout(async function() {
      var sleeping = Object.assign({}, ss, { phase: 'sleeping' });
      setSleepState(sleeping);
      await supabase.from('profiles').update({ sleep_state: sleeping }).eq('id', userId);
    }, 2 * 60 * 1000);
  }

  async function handleWakeUp(ss, log, isManual) {
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
    setSpeech(greeting);
    setWakeGreeting({ msg: greeting, duration: durationMins, entry });
    await supabase.from('profiles').update({
      sleep_state: null,
      sleep_log: newLog,
    }).eq('id', userId);
  }

  // ── Tamer name ──────────────────────────────────────────────────────────────
  async function saveTamerName(name) {
    var trimmed = name.trim().slice(0, 20) || "Tamer";
    setTamerName(trimmed);
    setEditingName(false);
    await supabase.from('profiles').update({ display_name: trimmed }).eq('id', userId);
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

    // Crest gain
    var cg = calcCrestGain(task.template, task.difficulty);
    var today = new Date().toISOString().split('T')[0];
    var newHistory = crestHistory;
    if (cg) {
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

    // Bond gain (max 5 task bonds/day)
    var newBond = bond;
    var newTaskBond = taskBondToday;
    if (taskBondToday < 5) {
      newBond = clampBond(bond + 0.5);
      newTaskBond = taskBondToday + 1;
      setBond(newBond);
    }

    var newBAT = Object.assign({}, bondActionsToday, { tasks: newTaskBond, date: today });
    setBondActionsToday(newBAT);

    // Update task
    await supabase.from('tasks').update({
      done: true, streak: (task.streak||0)+1,
      last_completed_date: today,
    }).eq('id', id);
    setTasks(function(ts){ return ts.map(function(t){
      return t.id===id ? Object.assign({},t,{done:true,streak:(t.streak||0)+1}) : t;
    }); });

    // XP to active Digimon
    if (activeDigi) {
      var result = applyXpGain(activeDigi, xp);
      await supabase.from('digimon').update({
        exp: result.exp, level: result.level, exp_needed: result.expNeeded,
      }).eq('id', activeDigi.uid);
      setParty(function(p){ return p.map(function(d,i){
        return i===0 ? Object.assign({},d,result) : Object.assign({},d,applyXpGain(d,Math.floor(xp*0.3)));
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

    // Save profile updates
    var profileUpdate = {
      bond: newBond,
      bond_actions_today: newBAT,
      crest_history: newHistory,
    };
    if (newRaid) profileUpdate.raid_state = newRaid;
    await supabase.from('profiles').update(profileUpdate).eq('id', userId);

    setSpeech("great job! +" + xp + " XP 🔥");
    addLog("✅", '"' + task.title + '" +' + xp + " XP" + (hasBoost?" ⚡1.5x":"") + (cg?" ["+cg.primaryCrest+"]":"") + (contrib.damage>0?" ⚔+"+contrib.damage:""));
    toast_("Task done!  +" + xp + " EXP" + (hasBoost?" ⚡1.5x":"") + (cg?"  "+CREST_INFO[cg.primaryCrest].icon+" "+cg.primaryCrest:""));

    // Jijimon triggers
    if (crestHistory.length === 0 && cg) triggerJijimon('crest_intro');
  }

  // ── Evolution ─────────────────────────────────────────────────────────────────
  async function evolve(uid, targetId) {
    var info = DIGIMON_MAP[targetId];
    if (!info) return;
    var digi = party.find(function(d){ return d.uid===uid; });
    if (!digi) return;
    var { eligible, vow } = checkEvoEligible(digi, bond, crestProfile, targetId);
    if (!eligible && !vow) return;
    if (vow) {
      // Consume Partner Vow item check could go here
    }
    var nd = digi.discovered.indexOf(targetId)<0 ? digi.discovered.concat([targetId]) : digi.discovered;
    await supabase.from('digimon').update({
      species_id: targetId, name: info.name,
      level: 1, exp: 0, exp_needed: 100,
      discovered: nd,
    }).eq('id', uid);
    setParty(function(p){ return p.map(function(d){
      if (d.uid!==uid) return d;
      return Object.assign({},d,{speciesId:targetId,name:info.name,level:1,exp:0,expNeeded:100,discovered:nd});
    }); });
    setAllDisc(function(p){ return p.indexOf(targetId)<0?p.concat([targetId]):p; });
    setEvoAnim(targetId);
    setTimeout(function(){ setEvoAnim(null); }, 3200);
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

    setStamina(newStam); setBond(newBond); setBits(newBits);
    setFoodStaminaToday(newFoodCap); setShowFeedPanel(false);
    setSpeech(food.type==="treat" ? "best tamer ever 🎉" : "nom nom nom 🍎");

    await supabase.from('profiles').update({
      stamina: newStam, last_stamina_update: new Date().toISOString(),
      bond: newBond, bits: newBits, food_stamina_today: newFoodCap,
    }).eq('id', userId);

    addLog("🍎", "Fed " + food.name + " +" + addable + " Stamina");
    toast_("+" + addable + " Stamina 🍎  +" + food.bond + " Bond", T.pink);
    if (!jijimonSeen['first_feed']) triggerJijimon('first_feed');
  }

  // ── Play ──────────────────────────────────────────────────────────────────────
  async function playAction() {
    if (!playAvailable) return;
    var newBond = clampBond(bond + 1);
    var today = new Date().toISOString().split('T')[0];
    var newBAT = Object.assign({}, bondActionsToday, { play: playUsedToday + 1, date: today });
    setBond(newBond); setBondActionsToday(newBAT);
    setSpeech("yay let's play! 🎮");
    addLog("🎮", "Played with " + (activeDigi ? activeDigi.name : "partner") + " +1 Bond");
    toast_("+1 Bond 🎮  " + (2-playUsedToday) + " plays left today", T.teal);
    await supabase.from('profiles').update({
      bond: newBond, bond_actions_today: newBAT,
    }).eq('id', userId);
  }

  // ── Pomodoro ──────────────────────────────────────────────────────────────────
  function openPomodoroSetup() {
    setPomodoroState({ phase:'setup', template:'Deep Work', duration:25 });
  }
  function beginPomodoro() {
    setPomodoroState(function(ps) {
      if (!ps) return ps;
      var secs = (ps.duration || 25) * 60;
      return { phase:'running', timeLeft:secs, totalSeconds:secs, template:ps.template||'Deep Work' };
    });
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
    setBond(newBond); setBits(newBits);
    if (activeDigi) {
      var result = applyXpGain(activeDigi, xpGain);
      await supabase.from('digimon').update({ exp:result.exp, level:result.level, exp_needed:result.expNeeded }).eq('id', activeDigi.uid);
      setParty(function(p){ return p.map(function(d,i){ return i===0?Object.assign({},d,result):d; }); });
    }
    await supabase.from('profiles').update({ bond:newBond, bits:newBits, crest_history:newHistory }).eq('id', userId);
    setSpeech("training complete! 💪");
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
  function recallFromFarm(uid) {
    if (party.length >= MAX_PARTY_SIZE) { toast_("Party full!", "#FF8080"); return; }
    var d = farm.find(function(x){ return x.uid===uid; });
    if (!d) return;
    supabase.from('digimon').update({ in_farm:false }).eq('id', uid);
    setFarm(function(f){ return f.filter(function(x){ return x.uid!==uid; }); });
    setParty(function(p){ return p.concat([Object.assign({},d,{inFarm:false})]); });
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
  function startBattle(diff) {
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
    setStamina(newStam);
    supabase.from('profiles').update({ stamina:newStam, last_stamina_update:new Date().toISOString() }).eq('id', userId);
    setBattleState({ playerTeam, enemyTeam:enemies, log:[], phase:"fight", selected:0, difficulty:diff });
  }

  function battleAttack(idx) {
    if (!battleState||battleState.phase!=="fight") return;
    var bs = JSON.parse(JSON.stringify(battleState));
    var att = bs.playerTeam[bs.selected];
    var def = bs.enemyTeam[idx];
    if (!att||!def||def.currentHp<=0) return;
    var dmg = calcBattleDamage(att, def);
    def.currentHp = Math.max(0, def.currentHp - dmg);
    bs.log = [att.name + " → " + def.name + "  −" + dmg].concat(bs.log).slice(0,6);
    var aliveE = bs.enemyTeam.filter(function(e){ return e.currentHp>0; });
    if (aliveE.length > 0) {
      var en  = aliveE[Math.floor(Math.random()*aliveE.length)];
      var tgt = bs.playerTeam.filter(function(p){ return p.currentHp>0; })[0];
      if (tgt) {
        var edm = calcBattleDamage(en, tgt);
        tgt.currentHp = Math.max(0, tgt.currentHp - edm);
        bs.log = [en.name + " → " + tgt.name + "  −" + edm].concat(bs.log).slice(0,6);
      }
    }
    var won  = bs.enemyTeam.every(function(e){ return e.currentHp<=0; });
    var lost = bs.playerTeam.every(function(p){ return p.currentHp<=0; });
    if (won||lost) {
      var r    = BATTLE_REWARDS[bs.difficulty]||{win:60,loss:25};
      var earn = won ? r.win : r.loss;
      setBits(function(b){ return b+earn; });
      supabase.from('profiles').update({ bits: bits+earn }).eq('id', userId);
      bs.log = [(won?"⚔ Victory! ":"💀 Defeated... ")+"+" + earn + "🪙"].concat(bs.log);
      bs.phase = won ? "won" : "lost";
    }
    setBattleState(bs);
  }

  // ── Buy shop item ────────────────────────────────────────────────────────────
  async function buyShopItem(item) {
    if (bits < item.cost) { toast_("Not enough bits!","#FF8080"); return; }
    var newBits = bits - item.cost;
    setBits(newBits);
    await supabase.from('profiles').update({ bits:newBits }).eq('id', userId);
    toast_("Purchased: " + item.name, "#FFD700");
    addLog("🛒", "Bought " + item.name);
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
    @keyframes evoIn    { 0%,100%{opacity:0;transform:scale(0.75)} 35%,65%{opacity:1;transform:scale(1)} }
    @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes floatUp  { from{transform:translateY(100vh) rotate(0deg);opacity:0.12} to{transform:translateY(-10vh) rotate(180deg);opacity:0} }
    @keyframes jijiIn   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes zzzFloat { 0%{opacity:0;transform:translateY(0) scale(0.8)} 30%{opacity:0.9} 100%{opacity:0;transform:translateY(-48px) scale(1.2)} }
    .page-in { animation: slideUp 0.22s ease; }
    .pcard { background:${T.bgCard}; border:2px solid ${T.border}; box-shadow:3px 3px 0 ${T.border}; }
    .nav-pill { font-family:'Press Start 2P',monospace; font-size:7px; padding:7px 11px; border:2px solid ${T.border}; background:transparent; cursor:pointer; color:${T.textMid}; transition:all 0.1s; }
    .nav-pill:hover,.nav-pill.active { background:${T.bgCard}; color:${T.text}; transform:translate(-1px,-1px); box-shadow:2px 2px 0 ${T.border}; }
    .nav-pill.active { border-color:var(--accent); color:var(--accent); box-shadow:2px 2px 0 var(--accent); }
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
    @media (max-width:1080px) { .right-col { display:none !important; } }
    @media (max-width:700px)  { .left-col  { display:none !important; } .main-content { padding:12px; } }
  `;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Nunito',sans-serif", "--accent":accent }}>
      <style>{css}</style>

      {/* Particles */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden" }} aria-hidden="true">
        {[{l:"5%",d:"12s",c:T.teal},{l:"18%",d:"9s",c:T.lavender,dd:"2s"},{l:"35%",d:"15s",c:accent,dd:"4s"},{l:"58%",d:"11s",c:T.coral,dd:"1s"},{l:"74%",d:"14s",c:T.mint,dd:"6s"},{l:"90%",d:"10s",c:T.gold,dd:"3s"}].map(function(p,i){
          return <div key={i} className="particle" style={{ left:p.l, animationDuration:p.d, animationDelay:p.dd||"0s", background:p.c }}/>;
        })}
      </div>

      {/* ── JIJIMON MODAL ─────────────────────────────────────────────────── */}
      {jijimonModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.80)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 40px" }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,maxWidth:520,width:"calc(100% - 32px)",padding:0,animation:"jijiIn 0.3s ease",overflow:"hidden" }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(90deg,#1a1800,#1f1f0a)",borderBottom:"2px solid "+T.gold,padding:"10px 16px",display:"flex",alignItems:"center",gap:10 }}>
              {/* JIJIMON SPRITE — replace this div with <DigiSprite digimonId="jijimon" size={36}/> once sprite is added */}
              <div style={{ width:36,height:36,border:"2px solid "+T.gold,background:"#1a1500",display:"grid",placeItems:"center",fontSize:18,flexShrink:0 }}>💭</div>
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
                <button className="px8" onClick={function(){ dismissJijimon(false); }} style={{ padding:"8px 18px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"7px",boxShadow:"2px 2px 0 "+T.gold }}>GOT IT</button>
                <button className="px8" onClick={function(){ dismissJijimon(true); }} style={{ padding:"8px 14px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"7px" }}>HIDE TIPS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED PANEL ────────────────────────────────────────────────────── */}
      {showFeedPanel && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.60)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"flex-start",paddingLeft:320 }}>
          <div style={{ background:T.bgCard,border:"2px solid "+T.pink,boxShadow:"4px 4px 0 "+T.pink,padding:16,width:260,animation:"jijiIn 0.2s ease" }}>
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
                      <div className="px8" style={{ color:T.textMid,fontSize:"6px",marginTop:2 }}>+{food.stamina}⚡  +{food.bond}💗</div>
                    </div>
                    <div className="px8" style={{ color:canAfford?T.gold:T.textDim,fontSize:"6px" }}>{food.cost}🪙</div>
                  </div>
                );
              })}
            </div>
            <button className="px8" onClick={function(){ setShowFeedPanel(false); }} style={{ padding:"7px 14px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"6px" }}>CLOSE</button>
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
                  <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"7px" }}>TRAINING TYPE</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {["Workout","Deep Work","Recovery","Maintenance","Social","Reflection","Challenge"].map(function(t){
                      var cg = calcCrestGain(t,'Medium');
                      var ci = cg ? CREST_INFO[cg.primaryCrest] : null;
                      var sel = pomodoroState.template === t;
                      return (
                        <button key={t} className="px8" onClick={function(){ setPomodoroState(function(ps){ return Object.assign({},ps,{template:t}); }); }}
                          style={{ padding:"5px 9px",border:"2px solid "+(sel?(ci?ci.color:T.mint):T.border),background:sel?(ci?ci.color+"22":T.mint+"22"):"transparent",color:sel?(ci?ci.color:T.mint):T.textMid,cursor:"pointer",fontSize:"6px" }}>
                          {ci&&ci.icon} {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"7px" }}>DURATION</div>
                  <div style={{ display:"flex",gap:8 }}>
                    {[15,25,50].map(function(d){
                      var sel = pomodoroState.duration === d;
                      return (
                        <button key={d} className="px8" onClick={function(){ setPomodoroState(function(ps){ return Object.assign({},ps,{duration:d}); }); }}
                          style={{ flex:1,padding:"9px 0",border:"2px solid "+(sel?T.mint:T.border),background:sel?T.mint+"22":"transparent",color:sel?T.mint:T.textMid,cursor:"pointer",fontSize:"6px" }}>
                          {d} MIN
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Reward preview */}
                <div style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"10px 12px" }}>
                  <div className="px8" style={{ color:T.textDim,marginBottom:6,fontSize:"6px" }}>ON COMPLETION</div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontSize:12,fontWeight:700,color:T.gold }}>+{(pomodoroState.duration||25)*3} XP</span>
                    <span style={{ fontSize:12,fontWeight:700,color:T.pink }}>+1 Bond</span>
                    <span style={{ fontSize:12,fontWeight:700,color:T.gold }}>+75🪙</span>
                    {(function(){
                      var cg = calcCrestGain(pomodoroState.template,'Medium');
                      if (!cg) return null;
                      var ci = CREST_INFO[cg.primaryCrest];
                      return <span style={{ fontSize:12,fontWeight:700,color:ci.color }}>{ci.icon} +{cg.primary} {cg.primaryCrest}</span>;
                    })()}
                  </div>
                </div>
                <button className="px8" onClick={beginPomodoro} style={{ padding:"12px",background:T.mint,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontSize:"7px",fontWeight:900,boxShadow:"2px 2px 0 "+T.border }}>
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
                    <div className="px8" style={{ color:T.textDim,marginTop:6,fontSize:"5px" }}>REMAINING</div>
                  </div>
                </div>
                <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:4 }}>{pomodoroState.template} Session</div>
                {(function(){
                  var cg = calcCrestGain(pomodoroState.template,'Medium');
                  if (!cg) return null;
                  var ci = CREST_INFO[cg.primaryCrest];
                  return <div style={{ fontSize:11,color:ci.color,marginBottom:16 }}>{ci.icon} Building {cg.primaryCrest} crest</div>;
                })()}
                {activeDigi && <div style={{ marginBottom:16 }}><DigiSprite digimonId={activeDigi.speciesId} size={52} mood="happy"/></div>}
                <div style={{ fontSize:11,color:T.textDim,marginBottom:16,fontStyle:"italic" }}>Stay focused — your partner is counting on you.</div>
                <button className="px8" onClick={function(){ setPomodoroState(null); }}
                  style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"6px" }}>
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
                    return <div style={{ padding:"7px 12px",border:"2px solid "+ci.color,color:ci.color,background:ci.color+"18",fontWeight:900,fontSize:13 }}>{ci.icon} +{cg.primary}</div>;
                  })()}
                </div>
                <button className="px8" onClick={claimPomodoroReward}
                  style={{ padding:"11px 28px",background:T.mint,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontSize:"7px",boxShadow:"2px 2px 0 "+T.border }}>
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
                      <button type="submit" style={{ background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",padding:"4px 8px",fontFamily:"'Press Start 2P',monospace",fontSize:"6px" }}>✓</button>
                      <button type="button" onClick={function(){ setEditingName(false); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:14 }}>×</button>
                    </form>
                  ) : (
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ fontSize:20,fontWeight:900,color:T.text }}>{tamerName}</div>
                      <button onClick={function(){ setEditingName(true); }} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:11,padding:0 }} title="Edit name">✏</button>
                    </div>
                  )}
                  <div className="px8" style={{ color:accent,marginTop:3,fontSize:"6px" }}>
                    {crestProfile.primary ? (CREST_TITLES[crestProfile.primary]||"DigiDestined") : "Novice DigiDestined"}
                  </div>
                  <div style={{ fontSize:11,color:T.textMid,marginTop:5 }}>
                    DigiDestined since {new Date(session.user.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {[
                  { label:"PARTNER",        val:activeDigi?activeDigi.name:"—",                  color:accent },
                  { label:"PARTNER LEVEL",  val:activeDigi?"Lv."+activeDigi.level:"—",           color:T.gold },
                  { label:"BOND STRENGTH",  val:Math.round(bond)+"/100",                          color:T.pink },
                  { label:"LOGIN STREAK",   val:loginStreak+" days 🔥",                           color:T.coral },
                  { label:"TODAY'S TASKS",  val:doneTasks.length+" completed",                   color:T.green },
                  { label:"DIGIMON KNOWN",  val:allDisc.length+"/"+Object.keys(DIGIMON_MAP).length, color:T.lavender },
                ].map(function(s){
                  return (
                    <div key={s.label} style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"10px 12px" }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"5px",marginBottom:5 }}>{s.label}</div>
                      <div style={{ fontSize:14,fontWeight:900,color:s.color }}>{s.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Crest identity block */}
              {crestProfile.primary && (
                <div style={{ background:T.bgPanel,border:"1.5px solid "+(CREST_INFO[crestProfile.primary].color),padding:"12px 14px",display:"flex",gap:12,alignItems:"center",boxShadow:"2px 2px 0 "+(CREST_INFO[crestProfile.primary].color) }}>
                  <div style={{ fontSize:36 }}>{CREST_INFO[crestProfile.primary].icon}</div>
                  <div style={{ flex:1 }}>
                    <div className="px8" style={{ color:T.textDim,fontSize:"6px",marginBottom:4 }}>PRIMARY CREST</div>
                    <div style={{ fontSize:17,fontWeight:900,color:CREST_INFO[crestProfile.primary].color }}>{crestProfile.primary}</div>
                    <div style={{ fontSize:11,color:T.textMid,marginTop:3 }}>{CREST_INFO[crestProfile.primary].desc}</div>
                  </div>
                  {crestProfile.secondary&&<>
                    <div style={{ width:1,height:44,background:T.border,flexShrink:0 }}/>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:26 }}>{CREST_INFO[crestProfile.secondary].icon}</div>
                      <div className="px8" style={{ color:T.textDim,fontSize:"5px",marginTop:4 }}>SUPPORT</div>
                      <div style={{ fontSize:11,fontWeight:800,color:CREST_INFO[crestProfile.secondary].color,marginTop:2 }}>{crestProfile.secondary}</div>
                    </div>
                  </>}
                </div>
              )}

              {/* Radar chart */}
              <div>
                <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"7px" }}>CREST RADAR</div>
                <div style={{ display:"flex",justifyContent:"center" }}>
                  <RadarChart percentages={crestProfile.percentages||{}} T={T}/>
                </div>
              </div>

              {/* DigiDestined journey */}
              {allDisc.length > 0 && (
                <div>
                  <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"7px" }}>DIGIVOLUTION JOURNEY</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {allDisc.map(function(id){
                      var di = DIGIMON_MAP[id]; if(!di) return null;
                      return (
                        <div key={id} title={di.name} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 8px",border:"1.5px solid "+T.border,background:T.bgPanel }}>
                          <DigiSprite digimonId={id} size={28} animate mood="walk"/>
                          <div className="px8" style={{ color:T.textMid,fontSize:"5px" }}>{di.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lore flavour */}
              <div style={{ background:"linear-gradient(135deg,#1a1400,#1a1a00)",border:"1.5px solid "+T.gold+"44",padding:"12px 14px" }}>
                <div className="px8" style={{ color:T.gold,marginBottom:6,fontSize:"6px" }}>✦ TAMER'S OATH</div>
                <div style={{ fontSize:12,color:T.textMid,lineHeight:1.7,fontStyle:"italic" }}>
                  "I will complete my missions, nurture my partner, and face every challenge with courage. The Digital World grows alongside me."
                </div>
              </div>

              {/* Danger zone */}
              <div style={{ borderTop:"1px solid "+T.coral+"44",paddingTop:12,marginTop:4 }}>
                <div className="px8" style={{ color:T.textDim,marginBottom:8,fontSize:"5px" }}>DANGER ZONE</div>
                <button className="px8" style={{ width:"100%",padding:"9px 12px",background:T.coral+"11",border:"1.5px solid "+T.coral+"88",color:T.coral,cursor:"pointer",fontSize:"6px",textAlign:"left" }}
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
              <button className="px8" style={{ padding:"8px 16px",background:T.coral+"22",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"7px" }}
                onClick={resetToStarters}>CONFIRM RESET</button>
              <button className="px8" style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"7px" }}
                onClick={function(){ setConfirmReset(false); }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

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
              <button className="px8" style={{ padding:"8px 16px",background:T.coral+"22",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"7px" }}
                onClick={confirmDedigivolve}>CONFIRM</button>
              <button className="px8" style={{ padding:"8px 16px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"7px" }}
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
                  <div style={{ fontSize:"6px",color:egg.color,fontWeight:900 }}>{egg.label}</div>
                  <div style={{ fontSize:"5px",color:T.textMid,textAlign:"center" }}>{egg.desc}</div>
                </button>
              );
            })}
          </div>
          {party.length > 0 && (
            <button className="px8" style={{ padding:"8px 20px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"7px" }}
              onClick={function(){ setShowDigitamaModal(false); }}>SAVE FOR LATER</button>
          )}
          {party.length === 0 && (
            <div className="px8" style={{ color:T.coral,marginTop:4,fontSize:"6px" }}>You must choose a partner to continue</div>
          )}
          {digitamaCredits > 1 && <div className="px8" style={{ color:T.gold,marginTop:8,fontSize:"6px" }}>×{digitamaCredits} eggs available — each pick uses 1</div>}
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
                <div className="px8" style={{ color:T.textDim,fontSize:"5px",marginBottom:3 }}>SLEEP TIME</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.lavender }}>
                  {Math.floor(wakeGreeting.duration/60)}h {wakeGreeting.duration%60}m
                </div>
              </div>
              <div style={{ width:1,background:T.border }}/>
              <div style={{ textAlign:"center" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"5px",marginBottom:3 }}>BEDTIME</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.teal }}>
                  {wakeGreeting.entry&&wakeGreeting.entry.bedtime}
                </div>
              </div>
              <div style={{ width:1,background:T.border }}/>
              <div style={{ textAlign:"center" }}>
                <div className="px8" style={{ color:T.textDim,fontSize:"5px",marginBottom:3 }}>WAKE</div>
                <div style={{ fontSize:13,fontWeight:900,color:T.gold }}>
                  {wakeGreeting.entry&&wakeGreeting.entry.waketime}
                </div>
              </div>
            </div>
            <button className="px8" style={{ padding:"8px 20px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"7px" }}
              onClick={function(){ setWakeGreeting(null); }}>
              START THE DAY ✦
            </button>
          </div>
        </div>
      )}

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
                <DigiSprite digimonId={digidexEntry} size={72} animate={known} mood="walk"/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18,fontWeight:900,color:known?T.text:T.textDim,marginBottom:4 }}>{d.name}</div>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                    <span className="px8" style={{ padding:"2px 8px",background:stCol+"33",border:"1.5px solid "+stCol,color:stCol,fontSize:"5px" }}>{d.stage}</span>
                    <span className="px8" style={{ padding:"2px 8px",border:"1.5px solid "+T.border,color:T.textMid,fontSize:"5px" }}>{d.type}</span>
                    <span className="px8" style={{ padding:"2px 8px",border:"1.5px solid "+(ATTR_COLOR[d.attr]||T.border),color:ATTR_COLOR[d.attr]||T.textMid,fontSize:"5px" }}>{d.attr}</span>
                    {known&&<span className="px8" style={{ padding:"2px 8px",background:role.color+"22",border:"1.5px solid "+role.color,color:role.color,fontSize:"5px" }}>{role.icon} {d.role}</span>}
                  </div>
                </div>
                <button onClick={function(){ setDigidexEntry(null); }}
                  style={{ background:"transparent",border:"2px solid "+T.border,color:T.textMid,fontSize:16,cursor:"pointer",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✕</button>
              </div>

              {known ? (
                <div style={{ padding:"16px 20px",display:"flex",flexDirection:"column",gap:14 }}>

                  {/* Battle Stats */}
                  <div>
                    <div className="px8" style={{ color:T.textDim,marginBottom:8,fontSize:"5px" }}>BATTLE STATS</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                      {[["HP",d.hp,T.coral],["SP",d.sp,T.teal],["ATK",d.atk,T.gold],["DEF",d.def,T.lavender],["INT",d.int,"#88BBFF"],["SPD",d.spd,T.mint]].map(function(s){
                        return (
                          <div key={s[0]} style={{ background:T.bgPanel,border:"1.5px solid "+T.border,padding:"6px 8px",textAlign:"center" }}>
                            <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:3 }}>{s[0]}</div>
                            <div style={{ fontSize:13,fontWeight:900,color:s[2] }}>{s[1]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Passive & Signature */}
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <div style={{ padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:4 }}>PASSIVE</div>
                      <div style={{ fontSize:11,fontWeight:700,color:T.text,lineHeight:1.5 }}>{d.passive}</div>
                    </div>
                    <div style={{ padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:4 }}>SIGNATURE MOVE</div>
                      <div style={{ fontSize:11,fontWeight:700,color:T.gold,lineHeight:1.5 }}>{d.signature}</div>
                    </div>
                  </div>

                  {/* Crest Requirement (for THIS form) */}
                  {d.crestReq && (
                    <div style={{ padding:"10px 12px",background:T.bgPanel,border:"1.5px solid "+T.border }}>
                      <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:8 }}>IDEAL CREST ALIGNMENT</div>
                      <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                        {[["Primary",d.crestReq.primary],d.crestReq.secondary?["Secondary",d.crestReq.secondary]:null].filter(Boolean).map(function(cr){
                          var ci = CREST_INFO[cr[1]];
                          return (
                            <div key={cr[0]} style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 10px",border:"1.5px solid "+(ci?ci.color:T.border),background:(ci?ci.color:"#888")+"18" }}>
                              {ci&&<span style={{ fontSize:16 }}>{ci.icon}</span>}
                              <div>
                                <div className="px8" style={{ color:T.textDim,fontSize:"4px" }}>{cr[0]}</div>
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
                    <div className="px8" style={{ color:T.textDim,marginBottom:8,fontSize:"5px" }}>DIGIVOLUTION CHAIN</div>

                    {/* Evolves From */}
                    {prevIds.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:6 }}>EVOLVES FROM</div>
                        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                          {prevIds.map(function(pid){
                            var pi = DIGIMON_MAP[pid];
                            if (!pi) return null;
                            var pKnown = allDisc.includes(pid);
                            return (
                              <div key={pid} onClick={function(e){ e.stopPropagation(); setDigidexEntry(pid); }}
                                style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T.bgPanel,border:"1.5px solid "+(pKnown?STAGE_COLOR[pi.stage]+"66":T.border),cursor:"pointer",opacity:pKnown?1:0.5 }}>
                                <DigiSprite digimonId={pid} size={32} animate={pKnown} mood="walk"/>
                                <div>
                                  <div style={{ fontSize:10,fontWeight:800,color:pKnown?T.text:T.textDim }}>{pi.name}</div>
                                  <div className="px8" style={{ color:STAGE_COLOR[pi.stage]||"#aaa",fontSize:"4px" }}>{pi.stage}</div>
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
                      <DigiSprite digimonId={digidexEntry} size={40} animate={true} mood="walk"/>
                      <div>
                        <div style={{ fontSize:12,fontWeight:900,color:T.text }}>{d.name}</div>
                        <div className="px8" style={{ color:stCol,fontSize:"4px" }}>{d.stage} • {d.type} • {d.attr}</div>
                      </div>
                      <span className="px8" style={{ marginLeft:"auto",padding:"2px 6px",background:role.color+"22",border:"1.5px solid "+role.color,color:role.color,fontSize:"4px" }}>{role.icon} {d.role}</span>
                    </div>

                    {/* Evolves To */}
                    {nextIds.length > 0 && (
                      <div>
                        <div style={{ textAlign:"center",color:T.textDim,fontSize:14,marginBottom:8 }}>↓</div>
                        <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:6 }}>EVOLVES INTO</div>
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
                                <DigiSprite digimonId={nid} size={40} animate={nKnown} mood="walk"/>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:11,fontWeight:800,color:nKnown?T.text:T.textDim }}>{ni.name}</div>
                                  <div className="px8" style={{ color:nStCol,fontSize:"4px",marginBottom:4 }}>{ni.stage}</div>
                                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                                    {nReq.level&&<span className="px8" style={{ color:T.textMid,fontSize:"4px" }}>Lv.{nReq.level}</span>}
                                    {nReq.bond&&<span className="px8" style={{ color:T.teal,fontSize:"4px" }}>Bond {nReq.bond}</span>}
                                    {nReq.crestMatch&&cr&&<span className="px8" style={{ color:CREST_INFO[cr.primary]?CREST_INFO[cr.primary].color:T.textMid,fontSize:"4px" }}>{Math.round(nReq.crestMatch*100)}% {cr.primary}</span>}
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
                  <div className="px8" style={{ fontSize:"7px",marginBottom:6 }}>UNIDENTIFIED DIGIMON</div>
                  <div style={{ fontSize:11,lineHeight:1.6,color:T.textDim }}>This Digimon has not yet been discovered. Digivolve your partner or explore to encounter new species.</div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* ── EVOLUTION OVERLAY ─────────────────────────────────────────────── */}
      {evoAnim && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"evoIn 3.2s ease" }}>
          <div style={{ fontSize:52,marginBottom:16 }}>✨</div>
          <DigiSprite digimonId={evoAnim} size={128} mood="happy"/>
          <div className="px10" style={{ marginTop:24,color:accent,letterSpacing:4 }}>DIGIVOLUTION</div>
          <div style={{ marginTop:10,fontSize:24,fontWeight:900 }}>{DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].name}</div>
          <div className="px8" style={{ marginTop:6,color:T.textMid }}>{DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].stage}</div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",background:T.bgCard,border:"2px solid "+toast.color,boxShadow:"3px 3px 0 "+toast.color,padding:"9px 20px",zIndex:300,whiteSpace:"nowrap",animation:"slideUp 0.2s ease",color:toast.color,fontWeight:700,fontSize:13 }}>
          {toast.msg}
        </div>
      )}

      {/* ── TOP NAV ───────────────────────────────────────────────────────── */}
      <nav style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 28px",background:T.bgPanel,borderBottom:"2px solid "+T.border,boxShadow:"0 2px 0 "+T.border,position:"sticky",top:0,zIndex:200,gap:12,flexWrap:"wrap" }}>
        <div className="px12" style={{ display:"flex",alignItems:"center",gap:10,color:T.text }}>
          <div style={{ width:10,height:10,background:accent,border:"2px solid "+T.border,animation:"blink 1.2s step-end infinite",display:"inline-block" }}/>
          DAILY<span style={{ color:accent }}>DIGIVOLVE</span>
        </div>
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
          {NAV.map(function(n){
            return <button key={n.id} className={"nav-pill"+(page===n.id?" active":"")} onClick={function(){ setPage(n.id); }}>{n.icon} {n.label}</button>;
          })}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div className="px8" style={{ color:T.textMid }}>LV.{activeDigi&&activeDigi.level}</div>
          <div style={{ width:34,height:34,border:"2px solid "+T.border,background:T.bgCard,display:"grid",placeItems:"center" }}>
            {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={26} animate={false}/>}
          </div>
          <span style={{ fontWeight:800,fontSize:13,cursor:"pointer",borderBottom:"1px dashed "+T.textDim }} onClick={function(){ setShowTamerProfile(true); }}>{tamerName}</span>
          <div className="px8" style={{ color:T.gold }}>🪙{bits}</div>
          <div className="px8" style={{ color:"#4ECDC4" }}>⚡{stamina}</div>
          <button onClick={function(){ supabase.auth.signOut(); }} style={{ fontFamily:"'Press Start 2P',monospace",fontSize:"6px",padding:"5px 9px",background:"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.35)",cursor:"pointer" }}>SIGN OUT</button>
        </div>
      </nav>

      {/* ── THREE COLUMN LAYOUT ───────────────────────────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"300px 1fr 260px",minHeight:"calc(100vh - 64px)",position:"relative",zIndex:1 }}>

        {/* ═══ LEFT — PET PANEL ══════════════════════════════════════════ */}
        <aside className="left-col" style={{ background:T.bgPanel,borderRight:"2px solid "+T.border,padding:"24px 20px",display:"flex",flexDirection:"column",gap:14,overflowY:"auto" }}>

          {/* Pet stage */}
          {(function(){
            var isSleeping = sleepState && sleepState.phase === 'sleeping';
            var isCountdown = sleepState && sleepState.phase === 'countdown';
            var stageBg = isSleeping
              ? "linear-gradient(160deg,#050810 0%,#080510 50%,#050810 100%)"
              : "linear-gradient(160deg,#0d1a2a 0%,#0a1520 50%,#120d20 100%)";
            return (
              <div style={{ background:stageBg,border:"2px solid "+(isSleeping?T.lavender:T.border),boxShadow:"3px 3px 0 "+(isSleeping?T.lavender:T.border),height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",position:"relative",overflow:"hidden",paddingBottom:14 }}>
                {/* Star field (always) / deeper at night */}
                <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(126,184,247,"+(isSleeping?"0.28":"0.12")+") 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none" }}/>
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
                {/* Speech bubble */}
                <div style={{ position:"absolute",top:10,left:"50%",background:T.bgCard,border:"2px solid "+(isSleeping?T.lavender:accent),boxShadow:"2px 2px 0 "+(isSleeping?T.lavender:accent),padding:"5px 10px",zIndex:4,animation:"fadeUp 0.3s ease",transform:"translateX(-50%)",maxWidth:220,whiteSpace:"normal",textAlign:"center" }}>
                  <span className="px8" style={{ color:isSleeping?T.lavender:accent,fontSize:"6px" }}>{speech}</span>
                  <div style={{ position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"6px solid "+(isSleeping?T.lavender:accent) }}/>
                </div>
                {/* Raid hit flash — pops above the sprite when a task is completed */}
                {raidHit && (function(){
                  var sc = { power:"#FF6B35",guard:"#7EB8F7",focus:"#B8A0E8",momentum:"#FFD700" }[raidHit.stat]||"#FF6B35";
                  var si = { power:"⚔",guard:"🛡",focus:"🎯",momentum:"⚡" }[raidHit.stat]||"⚔";
                  return (
                    <div style={{ position:"absolute",top:54,right:8,zIndex:5,background:"rgba(0,0,0,0.88)",border:"2px solid "+sc,boxShadow:"2px 2px 0 "+sc,padding:"4px 9px",animation:"slideUp 0.2s ease",pointerEvents:"none" }}>
                      <div className="px8" style={{ color:sc,fontSize:"6px",whiteSpace:"nowrap" }}>{si} -{raidHit.damage} VenomMyotismon</div>
                    </div>
                  );
                })()}
                {/* Sprite — walks left/right when idle, sleepy when resting */}
                <div style={{
                    position:"absolute",
                    bottom:36, zIndex:2,
                    left:"50%",
                    transform:"translateX(calc(-50% + "+petX+"px)) scaleX("+((!isSleeping&&!isCountdown&&petFacingRight)?-1:1)+")",
                    transition:isSleeping?"none":"transform 0.9s ease-in-out",
                    animation:isSleeping?"sleepBob 4s ease-in-out infinite":"bob 2s ease-in-out infinite",
                    cursor:"pointer",
                    transformOrigin:"bottom center",
                  }}
                  onClick={function(){
                    if (isSleeping || isCountdown) { handleWakeUp(sleepState, sleepLog, true); return; }
                    setSpeech(["you can do it! 💪","finish your tasks!","i believe in you ✨","getting stronger! ⚡","great job! 🔥"][Math.floor(Math.random()*5)]);
                  }}>
                  {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={84} mood={isSleeping||isCountdown?"sleepy":showFeedPanel?"eat":bond>=90?"happy":"walk"}/>}
                </div>
                {/* Ground strip */}
                <div style={{ position:"absolute",bottom:0,left:0,right:0,height:36,background:"repeating-linear-gradient(90deg,"+(isSleeping?T.lavender:T.teal)+"22 0px,"+(isSleeping?T.lavender:T.teal)+"22 16px,"+(isSleeping?T.lavender:T.teal)+"11 16px,"+(isSleeping?T.lavender:T.teal)+"11 32px)",borderTop:"2px solid "+T.border,zIndex:1 }}/>
                {/* Wake hint when sleeping */}
                {isSleeping && (
                  <div style={{ position:"absolute",bottom:42,left:0,right:0,textAlign:"center",zIndex:3 }}>
                    <span className="px8" style={{ color:T.lavender,fontSize:"5px",opacity:0.7 }}>tap to wake early</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Name + Level */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div className="px10" style={{ color:T.text }}>{activeDigi&&activeDigi.name}</div>
            <div className="px8" style={{ background:accent,border:"2px solid "+T.border,padding:"3px 8px",boxShadow:"2px 2px 0 "+T.border,color:T.bg }}>LV.{activeDigi&&activeDigi.level}</div>
          </div>

          {/* Stat bars: XP / Stamina / Bond */}
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {[
              { label:"⭐ XP",      val:activeDigi?activeDigi.exp:0,  max:activeDigi?activeDigi.expNeeded:100, color:T.gold },
              { label:"⚡ STAMINA", val:stamina,                        max:STAMINA_MAX,                         color:"#4ECDC4" },
              { label:"💗 BOND",    val:bond,                           max:100,                                 color:T.pink },
            ].map(function(s){
              return (
                <div key={s.label} style={{ display:"flex",flexDirection:"column",gap:4 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}>
                    <span className="px8" style={{ color:T.textMid,fontSize:"7px" }}>{s.label}</span>
                    <span className="px8" style={{ color:T.textMid,fontSize:"7px" }}>{Math.round(s.val)}/{s.max}</span>
                  </div>
                  <div style={{ height:10,background:T.bgCard,border:"2px solid "+T.border,overflow:"hidden" }}>
                    <div className="crest-bar-fill" style={{ width:Math.min((s.val/s.max)*100,100)+"%",background:s.color }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raid mini-widget */}
          {(function(){
            var rs2   = raidState || { totalDamage:0 };
            var frac2 = Math.min(1, (rs2.totalDamage||0) / CURRENT_RAID.bossHp);
            var phaseIdx2 = CURRENT_RAID.phases.findIndex(function(p){ return frac2 < p.threshold; });
            if (phaseIdx2 < 0) phaseIdx2 = CURRENT_RAID.phases.length - 1;
            var phase2 = CURRENT_RAID.phases[phaseIdx2];
            return (
              <div style={{ background:"linear-gradient(135deg,#0d0010,#110014)",border:"2px solid #9B59B6",padding:"10px 12px",cursor:"pointer" }}
                onClick={function(){ setPage("campaign"); }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <div className="px8" style={{ color:"#9B59B6",fontSize:"5px" }}>☠ RAID: {CURRENT_RAID.name}</div>
                  <div className="px8" style={{ color:phase2.color,fontSize:"5px" }}>{phase2.name}</div>
                </div>
                <div style={{ height:6,background:T.bgCard,border:"1.5px solid #9B59B6",overflow:"hidden",marginBottom:4 }}>
                  <div style={{ width:(frac2*100)+"%",height:"100%",background:"linear-gradient(90deg,#9B59B6,#cc0000)",transition:"width 0.4s ease" }}/>
                </div>
                <div className="px8" style={{ color:T.textDim,fontSize:"4px" }}>{(rs2.totalDamage||0).toLocaleString()} / {CURRENT_RAID.bossHp.toLocaleString()} dmg dealt — tap to view</div>
              </div>
            );
          })()}

          {/* Crest alignment mini */}
          <div style={{ background:T.bgCard,border:"2px solid "+T.border,padding:"10px 12px" }}>
            <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"7px" }}>CREST ALIGNMENT</div>
            {crestProfile.primary ? (
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{CREST_INFO[crestProfile.primary].icon}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:CREST_INFO[crestProfile.primary].color }}>{crestProfile.primary}</span>
                  <span className="px8" style={{ color:T.textDim,fontSize:"6px",marginLeft:"auto" }}>PRIMARY</span>
                </div>
                {crestProfile.secondary && (
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:12 }}>{CREST_INFO[crestProfile.secondary].icon}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:CREST_INFO[crestProfile.secondary].color }}>{crestProfile.secondary}</span>
                    <span className="px8" style={{ color:T.textDim,fontSize:"6px",marginLeft:"auto" }}>SUPPORT</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize:11,color:T.textDim,fontStyle:"italic" }}>Complete tasks to build alignment.</div>
            )}
          </div>

          {/* Pet action buttons */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
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
          </div>
          {!playAvailable && doneTasks.length < 3 && (
            <div style={{ fontSize:11,color:T.textDim,textAlign:"center",fontStyle:"italic" }}>
              Complete {3-doneTasks.length} more task{3-doneTasks.length!==1?"s":""} to unlock Play
            </div>
          )}

          {/* Evolution banner */}
          {activeInfo && (function(){
            var xpLeft = activeDigi ? (activeDigi.expNeeded - activeDigi.exp) : 0;
            if (evoTargets.length > 0) {
              var hasTrue = (activeInfo.evolvesTo||[]).some(function(id){
                var t = DIGIMON_MAP[id]; if(!t||t.fusionOf) return false;
                return checkEvoEligible(activeDigi, bond, crestProfile, id).eligible;
              });
              return (
                <div className="evo-banner" onClick={function(){ setPage("team"); }}>
                  <span style={{ fontSize:18 }}>✨</span>
                  <div style={{ flex:1 }}>
                    <div className="px8" style={{ color:T.lavender }}>{hasTrue?"EVOLUTION READY":"PARTNER VOW"}</div>
                    <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:3 }}>Go to Team to evolve!</div>
                  </div>
                  <span style={{ color:T.lavender,fontWeight:900 }}>→</span>
                </div>
              );
            }
            return (
              <div className="evo-banner" style={{ cursor:"default" }}>
                <span style={{ fontSize:18 }}>✨</span>
                <div style={{ flex:1 }}>
                  <div className="px8" style={{ color:T.lavender }}>EVOLUTION NEAR</div>
                  <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:3 }}>{xpLeft} XP · Bond {bond}/20</div>
                </div>
              </div>
            );
          })()}

        </aside>

        {/* ═══ MIDDLE — MAIN CONTENT ══════════════════════════════════════ */}
        <main className="main-content" style={{ padding:"24px 28px",display:"flex",flexDirection:"column",gap:18,overflowY:"auto" }}>
          <div key={page} className="page-in">

            {/* ── DASHBOARD ────────────────────────────────────────────── */}
            {page==="dashboard"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
                {/* Stat row */}
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                  {[
                    { icon:"🔥", val:streak,                              label:"day streak" },
                    { icon:"✅", val:doneTasks.length+"/"+tasks.length,   label:"done today" },
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

                {/* Crest alignment widget */}
                <div className="pcard" style={{ padding:16 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                    <div className="px9">CREST ALIGNMENT</div>
                    <div style={{ fontSize:11,fontWeight:700,color:T.textMid }}>14-day window</div>
                  </div>
                  {crestProfile.primary ? (
                    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                      {Object.entries(crestProfile.percentages)
                        .sort(function(a,b){ return b[1]-a[1]; })
                        .map(function([name, pct]){
                          var ci = CREST_INFO[name];
                          return (
                            <div key={name} style={{ display:"flex",alignItems:"center",gap:8 }}>
                              <span style={{ fontSize:14,width:20,textAlign:"center",flexShrink:0 }}>{ci.icon}</span>
                              <span style={{ fontSize:11,fontWeight:700,width:90,color:ci.color,flexShrink:0 }}>{name}</span>
                              <div style={{ flex:1,height:8,background:T.bgPanel,border:"1px solid "+T.border,overflow:"hidden" }}>
                                <div className="crest-bar-fill" style={{ width:pct+"%",background:ci.color }}/>
                              </div>
                              <span className="px8" style={{ color:T.textMid,fontSize:"6px",width:32,textAlign:"right",flexShrink:0 }}>{pct}%</span>
                              {(name===crestProfile.primary||name===crestProfile.secondary)&&(
                                <span className="px8" style={{ fontSize:"5px",color:name===crestProfile.primary?T.gold:T.textMid,width:30,flexShrink:0 }}>
                                  {name===crestProfile.primary?"★ PRI":"◆ SEC"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div style={{ padding:"20px 0",textAlign:"center",color:T.textDim,fontSize:12 }}>
                      Complete tasks to build your crest alignment profile.
                    </div>
                  )}
                </div>

                {/* Tasks header */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
                  <div>
                    <div className="px12">TODAY'S QUESTS</div>
                    <div style={{ fontSize:13,fontWeight:700,color:T.textMid,marginTop:4 }}>{pendTasks.length} remaining</div>
                  </div>
                  <button className="px8" onClick={function(){ setPage("tasks"); }} style={{ padding:"9px 14px",background:T.coral,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,color:"white",cursor:"pointer" }}>+ NEW TASK</button>
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
                                {cg&&<span style={{ fontSize:12 }}>{CREST_INFO[cg.primaryCrest]?.icon}</span>}
                                <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.border,color:T.textMid,background:T.bgPanel,fontSize:"6px" }}>{t.template}</span>
                                <span className="px8" style={{ padding:"2px 6px",background:"#2a2000",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"6px" }}>+{xp} XP</span>
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

                {doneTasks.length>0&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <div className="sec-label">✓ COMPLETED</div>
                    {doneTasks.map(function(t){
                      return (
                        <div key={t.id} className="task-card done tc-low">
                          <div className="task-check checked"><span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span></div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14,fontWeight:800,color:T.textMid,textDecoration:"line-through" }}>{t.title}</div>
                          </div>
                          <span className="px8" style={{ fontSize:"6px",color:T.green }}>DONE</span>
                        </div>
                      );
                    })}
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
              <WeeklyPlannerPage tasks={tasks} party={party} farm={farm} weeklyDigimon={weeklyDigimon} onAssignDigimon={assignWeeklyDigimon} onReschedule={rescheduleTask} onComplete={completeTask} accent={accent} T={T}/>
            )}

            {/* ── CRESTS ───────────────────────────────────────────────── */}
            {page==="crests"&&(
              <CrestsPage crestProfile={crestProfile} crestHistory={crestHistory} activeDigi={activeDigi} activeInfo={activeInfo} bond={bond} T={T} accent={accent} onGoTeam={function(){ setPage("team"); }}/>
            )}

            {/* ── TEAM ─────────────────────────────────────────────────── */}
            {page==="team"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">TEAM MANAGER</div>
                  <span className="px8" style={{ color:accent }}>{party.length}/{MAX_PARTY_SIZE}</span>
                </div>
                {party.map(function(digi,i){
                  var inf2 = DIGIMON_MAP[digi.speciesId];
                  var bs   = calcBattleStats(digi);
                  var role = inf2 && ROLES[inf2.role] ? ROLES[inf2.role] : ROLES.Balanced;
                  var pers = PERSONALITIES.find(function(p){ return p.id===digi.personality; });
                  // Eligible evolutions
                  var evoList = (inf2&&inf2.evolvesTo||[]).map(function(id){
                    var ti = DIGIMON_MAP[id]; if(!ti||ti.fusionOf) return null;
                    var check = checkEvoEligible(digi, bond, crestProfile, id);
                    return { id, info:ti, ...check };
                  }).filter(Boolean);

                  return (
                    <div key={digi.uid} className="pcard" style={{ padding:16,borderColor:i===0?accent:T.border,boxShadow:"3px 3px 0 "+(i===0?accent:T.border) }}>
                      <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
                        <div style={{ position:"relative" }}>
                          <DigiSprite digimonId={digi.speciesId} size={80} animate mood="walk"/>
                          {i===0&&<div style={{ position:"absolute",top:-6,right:-6,background:accent,border:"2px solid "+T.border,width:18,height:18,display:"grid",placeItems:"center",fontSize:9,color:T.bg,fontWeight:900 }}>★</div>}
                        </div>
                        <div style={{ flex:1,minWidth:160 }}>
                          {/* Name + badges */}
                          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                            <div className="px10">{digi.name}</div>
                            <div className="px8" style={{ padding:"2px 7px",border:"1.5px solid "+(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),color:(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),fontSize:"6px" }}>{inf2&&inf2.stage}</div>
                            {pers&&<div className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+pers.color,color:pers.color,fontSize:"6px" }}>{pers.label}</div>}
                          </div>
                          <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"6px" }}>Lv.{digi.level} · Bond {Math.round(bond)} · {inf2&&inf2.type}</div>

                          {/* Role */}
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                            <div className="px8" style={{ padding:"3px 8px",border:"2px solid "+role.color,color:role.color,background:role.color+"18",fontSize:"6px" }}>{role.icon} {inf2&&inf2.role||"Balanced"}</div>
                          </div>

                          {/* Battle stats: Power / Guard / Focus / Momentum */}
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10 }}>
                            {[["PWR",bs.Power,"#FF6B35"],["GRD",bs.Guard,"#7EB8F7"],["FOC",bs.Focus,"#B8A0E8"],["MTM",bs.Momentum,"#FFD700"]].map(function(s){
                              return (
                                <div key={s[0]} style={{ textAlign:"center",background:T.bgPanel,border:"1px solid "+T.border,padding:"6px 4px" }}>
                                  <div style={{ fontSize:18,fontWeight:900,color:s[2] }}>{s[1]}</div>
                                  <div className="px8" style={{ color:T.textMid,fontSize:"5px",marginTop:2 }}>{s[0]}</div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Passive + Signature */}
                          {inf2&&inf2.passive&&(
                            <div style={{ marginBottom:6 }}>
                              <div style={{ fontSize:11,fontWeight:700,color:T.textMid }}><span style={{ color:T.mint }}>Passive — </span>{inf2.passive}</div>
                            </div>
                          )}
                          {inf2&&inf2.signature&&(
                            <div style={{ marginBottom:10 }}>
                              <div style={{ fontSize:11,fontWeight:700,color:T.textMid }}><span style={{ color:T.gold }}>Signature — </span>{inf2.signature}</div>
                            </div>
                          )}

                          {/* XP bar */}
                          <div style={{ marginBottom:10 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                              <span className="px8" style={{ color:T.textMid,fontSize:"6px" }}>⭐ XP</span>
                              <span className="px8" style={{ color:T.textMid,fontSize:"6px" }}>{digi.exp}/{digi.expNeeded}</span>
                            </div>
                            <Bar value={digi.exp} max={digi.expNeeded} color={accent} h={8}/>
                          </div>

                          {/* Evolutions */}
                          {evoList.length > 0 && (
                            <div style={{ marginBottom:8 }}>
                              <div className="px8" style={{ color:T.textDim,marginBottom:6,fontSize:"5px" }}>DIGIVOLUTION</div>
                              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                                {evoList.map(function(evo){
                                  var canEvo  = evo.eligible;
                                  var canVow  = evo.vow;
                                  var ci      = evo.info.crestReq ? CREST_INFO[evo.info.crestReq.primary] : null;
                                  var ci2     = evo.info.crestReq&&evo.info.crestReq.secondary ? CREST_INFO[evo.info.crestReq.secondary] : null;
                                  var req     = EVO_REQUIREMENTS[evo.info.stage] || {};
                                  var btnCol  = canEvo ? T.gold : canVow ? T.lavender : T.textDim;
                                  return (
                                    <div key={evo.id} style={{ background:T.bgPanel,border:"1.5px solid "+(canEvo?T.gold:canVow?T.lavender:T.border),padding:"8px 10px" }}>
                                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap" }}>
                                        <DigiSprite digimonId={evo.id} size={28} animate mood="walk"/>
                                        <div>
                                          <div style={{ fontSize:12,fontWeight:900,color:btnCol }}>{evo.info.name}</div>
                                          <div className="px8" style={{ color:STAGE_COLOR[evo.info.stage]||"#aaa",fontSize:"5px" }}>{evo.info.stage} · {evo.info.type}</div>
                                        </div>
                                        {(canEvo||canVow)&&(
                                          <button className="px8"
                                            style={{ marginLeft:"auto",padding:"5px 10px",background:btnCol+"22",border:"2px solid "+btnCol,color:btnCol,cursor:"pointer",fontSize:"6px" }}
                                            onClick={function(){ evolve(digi.uid,evo.id); }}>
                                            {canVow&&!canEvo?"VOW →":"DIGIVOLVE →"}
                                          </button>
                                        )}
                                      </div>
                                      {/* Requirements row */}
                                      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                                        <span className="px8" style={{ fontSize:"5px",color:digi.level>=req.level?T.green:T.coral }}>
                                          Lv.{req.level} {digi.level>=req.level?"✓":"✗ ("+digi.level+")"}
                                        </span>
                                        {req.bond>0&&<span className="px8" style={{ fontSize:"5px",color:bond>=req.bond?T.green:T.coral }}>
                                          Bond {req.bond} {bond>=req.bond?"✓":"✗ ("+Math.round(bond)+")"}
                                        </span>}
                                        {ci&&<span className="px8" style={{ fontSize:"5px",color:T.textMid }}>
                                          {ci.icon}{ci2?" + "+ci2.icon:""} Crest {req.crestMatch?Math.round(req.crestMatch*100)+"%":""} {evo.matchPct!=null?(evo.matchPct+"% ✓"):""}
                                        </span>}
                                        {!canEvo&&evo.reason&&<span className="px8" style={{ fontSize:"5px",color:T.coral }}>{evo.reason}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Party controls */}
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                            {i>0&&<button className="px8" style={{ padding:"6px 10px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"6px" }} onClick={function(){ setLeader(digi.uid); }}>★ SET LEADER</button>}
                            {party.length>1&&<button className="px8" style={{ padding:"6px 10px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"6px" }} onClick={function(){ sendToFarm(digi.uid); }}>→ Farm</button>}
                            {(function(){
                              var allDigi2 = Object.values(DIGIMON_MAP);
                              var prevIds2 = allDigi2.filter(function(x){ return x.evolvesTo && x.evolvesTo.includes(digi.speciesId); }).map(function(x){ return x.id; });
                              if (prevIds2.length === 0) return null;
                              var prevId2 = prevIds2[0];
                              return (
                                <button className="px8" style={{ padding:"6px 10px",background:T.coral+"18",border:"2px solid "+T.coral,color:T.coral,cursor:"pointer",fontSize:"6px" }}
                                  onClick={function(){ setDedigivolveConfirm({ uid:digi.uid, prevId:prevId2, digiName:digi.name, prevName:(DIGIMON_MAP[prevId2]&&DIGIMON_MAP[prevId2].name)||prevId2 }); }}>
                                  ↩ DEDIGIVOLVE
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                          <div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"6px" }}>Lv.{d.level} · {fi&&fi.stage} · {fi&&fi.role}</div>
                        </div>
                        <button className="px8" style={{ padding:"7px 12px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"6px" }} onClick={function(){ recallFromFarm(d.uid); }}>RECALL</button>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* ── BATTLE ───────────────────────────────────────────────── */}
            {page==="battle"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">BATTLE ARENA</div>
                  <div className="px8" style={{ color:"#4ECDC4" }}>⚡ Stamina: {stamina}/{STAMINA_MAX}</div>
                </div>
                {!battleState?(
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
                          <div className="px8" style={{ color:"#4ECDC4",fontSize:"6px" }}>Costs {cost} ⚡</div>
                        </div>
                      );
                    })}
                  </div>
                ):battleState.phase==="fight"?(
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    <div className="sec-label">ENEMY TEAM — tap to attack</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                      {battleState.enemyTeam.map(function(e,i){
                        var ebs = calcBattleStats(e);
                        return (
                          <div key={i} className="battle-tile enemy" style={{ opacity:e.currentHp<=0?0.3:1 }} onClick={function(){ battleAttack(i); }}>
                            <DigiSprite digimonId={e.speciesId} size={52} mood={e.currentHp<=0?"sad":"angry"} animate={e.currentHp>0} />
                            <div className="px8" style={{ marginTop:6,marginBottom:4,fontSize:"6px" }}>{e.name}</div>
                            <Bar value={e.currentHp} max={e.maxHp} color={T.coral} h={6}/>
                            <div style={{ display:"flex",justifyContent:"space-around",marginTop:6 }}>
                              {[["PWR",ebs.Power,"#FF6B35"],["GRD",ebs.Guard,"#7EB8F7"]].map(function(s){
                                return <div key={s[0]} style={{ textAlign:"center" }}><div style={{ fontSize:12,fontWeight:900,color:s[2] }}>{s[1]}</div><div className="px8" style={{ fontSize:"5px",color:T.textDim }}>{s[0]}</div></div>;
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="sec-label">YOUR TEAM — select attacker</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                      {battleState.playerTeam.map(function(p,i){
                        var isAct = battleState.selected===i;
                        var pbs   = calcBattleStats(p);
                        var pInfo = DIGIMON_MAP[p.speciesId];
                        var role  = pInfo&&ROLES[pInfo.role]?ROLES[pInfo.role]:ROLES.Balanced;
                        return (
                          <div key={i} className={"battle-tile player"+(isAct?" active":"")} style={{ opacity:p.currentHp<=0?0.3:1 }} onClick={function(){ setBattleState(function(bs){ return Object.assign({},bs,{selected:i}); }); }}>
                            <DigiSprite digimonId={p.speciesId} size={52} mood={p.currentHp<=0?"sad":isAct?"attack":"walk"} animate={isAct&&p.currentHp>0}/>
                            <div className="px8" style={{ marginTop:6,marginBottom:4,fontSize:"6px" }}>{p.name}</div>
                            <Bar value={p.currentHp} max={p.maxHp} color={T.green} h={6}/>
                            <div style={{ display:"flex",justifyContent:"space-around",marginTop:6 }}>
                              {[["PWR",pbs.Power,"#FF6B35"],["GRD",pbs.Guard,"#7EB8F7"],["FOC",pbs.Focus,"#B8A0E8"],["MTM",pbs.Momentum,"#FFD700"]].map(function(s){
                                return <div key={s[0]} style={{ textAlign:"center" }}><div style={{ fontSize:11,fontWeight:900,color:s[2] }}>{s[1]}</div><div className="px8" style={{ fontSize:"5px",color:T.textDim }}>{s[0]}</div></div>;
                              })}
                            </div>
                            {isAct&&<div className="px8" style={{ color:accent,marginTop:4,fontSize:"6px" }}>★ ATTACKER</div>}
                            {isAct&&pInfo&&pInfo.passive&&<div style={{ fontSize:9,color:T.mint,marginTop:2,fontStyle:"italic",lineHeight:1.3 }}>{pInfo.passive.split('—')[0]}</div>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="pcard" style={{ padding:12,maxHeight:150,overflowY:"auto" }}>
                      {battleState.log.length===0
                        ? <div style={{ fontSize:12,color:T.textMid }}>Tap an enemy to attack</div>
                        : battleState.log.map(function(l,i){ return <div key={i} style={{ fontSize:12,color:i===0?T.text:T.textMid,padding:"3px 0",borderBottom:"1px solid "+T.border }}>{l}</div>; })
                      }
                    </div>
                  </div>
                ):(
                  <div className="pcard" style={{ padding:40,textAlign:"center" }}>
                    <div style={{ fontSize:42,marginBottom:12 }}>{battleState.phase==="won"?"🏆":"💀"}</div>
                    <div className="px12" style={{ color:battleState.phase==="won"?T.green:T.coral,marginBottom:8 }}>{battleState.phase==="won"?"VICTORY!":"DEFEATED"}</div>
                    <div style={{ fontSize:12,color:T.textMid,marginBottom:20 }}>{battleState.log[0]}</div>
                    <button className="px8" style={{ padding:"10px 20px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"7px" }} onClick={function(){ setBattleState(null); }}>RETURN</button>
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
                <div style={{ fontSize:12,fontWeight:700,color:T.textMid }}>Earn bits by winning Arena battles and completing tasks.</div>

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
                            <div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"6px" }}>+{food.stamina}⚡ Stamina  ·  +{food.bond}💗 Bond  ·  {food.desc}</div>
                          </div>
                          <button className="px8" style={{ padding:"7px 12px",background:ok?T.pink+"22":"transparent",border:"2px solid "+(ok?T.pink:T.textDim),color:ok?T.pink:T.textDim,cursor:ok?"pointer":"not-allowed",fontSize:"6px",boxShadow:ok?"2px 2px 0 "+T.pink:"none" }}
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
                            {item.desc&&<div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"6px" }}>{item.desc}</div>}
                          </div>
                          <button className="px8" style={{ padding:"7px 12px",background:ok?T.gold+"22":"transparent",border:"2px solid "+(ok?T.gold:T.textDim),color:ok?T.gold:T.textDim,cursor:ok?"pointer":"not-allowed",fontSize:"6px",boxShadow:ok?"2px 2px 0 "+T.gold:"none" }}
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

            {/* ── CAMPAIGN / RAID ──────────────────────────────────────── */}
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
                      {/* Boss portrait — SVG placeholder */}
                      <div style={{ width:90,height:90,flexShrink:0,position:"relative" }}>
                        <svg width={90} height={90} viewBox="0 0 90 90" style={{ display:"block" }}>
                          {/* Shadow */}
                          <ellipse cx="45" cy="87" rx="20" ry="3" fill="rgba(0,0,0,0.4)"/>
                          {/* Wings */}
                          <path d="M45 55 L8 28 L18 50 Z"  fill="#6c3483" opacity="0.9"/>
                          <path d="M45 55 L82 28 L72 50 Z" fill="#6c3483" opacity="0.9"/>
                          <path d="M45 55 L2 44 L14 58 Z"  fill="#512e78" opacity="0.7"/>
                          <path d="M45 55 L88 44 L76 58 Z" fill="#512e78" opacity="0.7"/>
                          {/* Body */}
                          <ellipse cx="45" cy="52" rx="16" ry="20" fill="#2c0033"/>
                          {/* Cloak collar */}
                          <path d="M29 48 Q45 40 61 48 L58 60 Q45 55 32 60 Z" fill="#4a0055"/>
                          {/* Head */}
                          <ellipse cx="45" cy="30" rx="13" ry="14" fill="#1a001f"/>
                          {/* Bat ears */}
                          <path d="M33 22 L28 8 L38 18 Z"  fill="#9B59B6"/>
                          <path d="M57 22 L62 8 L52 18 Z"  fill="#9B59B6"/>
                          {/* Eyes — red glow */}
                          <ellipse cx="39" cy="29" rx="4" ry="4" fill="#cc0000"/>
                          <ellipse cx="51" cy="29" rx="4" ry="4" fill="#cc0000"/>
                          <ellipse cx="39" cy="29" rx="2" ry="2" fill="#ff4444"/>
                          <ellipse cx="51" cy="29" rx="2" ry="2" fill="#ff4444"/>
                          {/* Virus mouth */}
                          <path d="M37 37 Q45 44 53 37" stroke="#9B59B6" strokeWidth="2" fill="none"/>
                          {/* Venom drip */}
                          <ellipse cx="43" cy="42" rx="2" ry="3" fill="#00cc44" opacity="0.8"/>
                          <ellipse cx="47" cy="43" rx="1.5" ry="2.5" fill="#00cc44" opacity="0.6"/>
                        </svg>
                        {!defeated && <div style={{ position:"absolute",top:-4,right:-4,width:10,height:10,background:"#cc0000",borderRadius:"50%",animation:"blink 0.8s step-end infinite" }}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div className="px8" style={{ color:"#9B59B6",fontSize:"5px",marginBottom:4 }}>COMMUNITY RAID BOSS — {raid.type} / {raid.attr}</div>
                        <div style={{ fontSize:22,fontWeight:900,color:T.text,letterSpacing:1,marginBottom:4 }}>{raid.name}</div>
                        <div style={{ fontSize:12,fontWeight:700,color:"#9B59B6",fontStyle:"italic",marginBottom:10 }}>"{raid.title}"</div>
                        <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
                          {defeated
                            ? <span className="px8" style={{ padding:"3px 10px",background:"#FFD70033",border:"2px solid #FFD700",color:"#FFD700",fontSize:"6px" }}>★ DEFEATED</span>
                            : <span className="px8" style={{ padding:"3px 10px",background:"#cc000033",border:"2px solid #cc0000",color:"#cc0000",fontSize:"6px" }}>⚡ ACTIVE RAID</span>
                          }
                          <span className="px8" style={{ color:T.textMid,fontSize:"6px" }}>{daysLeft > 0 ? daysLeft+" days remaining" : "Event ended"}</span>
                          <span className="px8" style={{ color:T.textDim,fontSize:"6px" }}>{raid.startDate} — {raid.endDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boss HP bar */}
                  <div className="pcard" style={{ padding:16 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                      <div className="px8" style={{ fontSize:"6px",color:T.textMid }}>COMMUNITY BOSS HP</div>
                      <div className="px8" style={{ color:defeated?"#FFD700":T.coral,fontSize:"7px" }}>{dmg.toLocaleString()} / {bossHp.toLocaleString()}</div>
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
                            <div className="px8" style={{ color:isActive?p.color:T.textDim,fontSize:"4px",fontWeight:isActive?900:400 }}>{p.name.toUpperCase()}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active phase callout */}
                    {!defeated && (
                      <div style={{ padding:"10px 14px",background:phase.color+"18",border:"2px solid "+phase.color,display:"flex",gap:10,alignItems:"center" }}>
                        <div style={{ fontSize:18,color:phase.color,flexShrink:0 }}>{STAT_ICONS[phase.dominant]}</div>
                        <div>
                          <div className="px8" style={{ color:phase.color,fontSize:"6px",marginBottom:3 }}>PHASE: {phase.name.toUpperCase()} — {STAT_LABELS[phase.dominant].toUpperCase()} ADVANTAGE</div>
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
                            <div className="px8" style={{ color:T.textDim,fontSize:"5px" }}>REWARD UNLOCKED</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Partner contribution stats */}
                  {activeDigi && bs && (
                    <div className="pcard" style={{ padding:16 }}>
                      <div className="px8" style={{ color:T.textDim,marginBottom:12,fontSize:"5px" }}>YOUR PARTNER'S RAID CONTRIBUTION</div>
                      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                        <DigiSprite digimonId={activeDigi.speciesId} size={44} animate mood="walk"/>
                        <div>
                          <div style={{ fontSize:13,fontWeight:800 }}>{activeDigi.name}</div>
                          <div className="px8" style={{ color:T.textMid,fontSize:"6px" }}>Lv.{activeDigi.level} · Active Partner</div>
                        </div>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        {["power","guard","focus","momentum"].map(function(s){
                          var key = s.charAt(0).toUpperCase()+s.slice(1);
                          var val = bs[key];
                          var isDominant = !defeated && phase && phase.dominant === s;
                          return (
                            <div key={s} style={{ padding:"10px",background:isDominant?STAT_COLORS[s]+"22":T.bgPanel,border:"2px solid "+(isDominant?STAT_COLORS[s]:T.border),position:"relative" }}>
                              {isDominant && <div className="px8" style={{ position:"absolute",top:4,right:4,color:STAT_COLORS[s],fontSize:"4px" }}>★ ACTIVE</div>}
                              <div style={{ fontSize:22,marginBottom:4 }}>{STAT_ICONS[s]}</div>
                              <div style={{ fontSize:20,fontWeight:900,color:STAT_COLORS[s] }}>{val}</div>
                              <div className="px8" style={{ color:T.textDim,fontSize:"5px",marginTop:2 }}>{STAT_LABELS[s].toUpperCase()}</div>
                              {isDominant && <div className="px8" style={{ color:STAT_COLORS[s],fontSize:"4px",marginTop:3 }}>+50% phase bonus</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Task type guide */}
                      <div style={{ marginTop:12,padding:"10px 12px",background:T.bgPanel,border:"1px solid "+T.border }}>
                        <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginBottom:8 }}>TASK → RAID STAT GUIDE</div>
                        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                          {[
                            ["Workout / Challenge","power"],
                            ["Deep Work / Reflection","focus"],
                            ["Maintenance / Recovery","guard"],
                            ["Social","momentum"],
                          ].map(function(row){
                            var isDom = !defeated && phase && phase.dominant === row[1];
                            return (
                              <div key={row[0]} style={{ display:"flex",alignItems:"center",gap:8,opacity:isDom?1:0.6 }}>
                                <span style={{ fontSize:12,color:STAT_COLORS[row[1]] }}>{STAT_ICONS[row[1]]}</span>
                                <span style={{ fontSize:10,fontWeight:700,color:isDom?T.text:T.textMid }}>{row[0]}</span>
                                <span className="px8" style={{ marginLeft:"auto",color:STAT_COLORS[row[1]],fontSize:"5px" }}>{STAT_LABELS[row[1]]}{ isDom?" ★":""}</span>
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
                      <div className="px8" style={{ color:T.textDim,marginBottom:10,fontSize:"5px" }}>YOUR RAID LOG</div>
                      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                        {rs.raidLog.slice(0,15).map(function(entry,i){
                          var sc = STAT_COLORS[entry.stat] || "#aaa";
                          return (
                            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.bgPanel,border:"1px solid "+T.border }}>
                              <div style={{ fontSize:14,color:sc,flexShrink:0 }}>{STAT_ICONS[entry.stat]||"⚔"}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:11,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{entry.taskTitle}</div>
                                {entry.phase && <div className="px8" style={{ color:T.textDim,fontSize:"4px",marginTop:1 }}>{entry.phase} · {entry.date}</div>}
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
              var stages = ["In-Training","Rookie","Champion","Ultimate","Mega"];
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
                    return (
                      <div key={stage}>
                        <div className="px8" style={{ color:STAGE_COLOR[stage]||"#aaa",marginBottom:10,fontSize:"7px",borderBottom:"1px solid "+T.border,paddingBottom:6 }}>
                          {stage.toUpperCase()} — {group.filter(function(d){return allDisc.includes(d.id);}).length}/{group.length}
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8 }}>
                          {group.map(function(d){
                            var known = allDisc.includes(d.id);
                            var role  = ROLES[d.role]||ROLES.Balanced;
                            var stCol = STAGE_COLOR[d.stage]||"#aaa";
                            return (
                              <div key={d.id} onClick={function(){ setDigidexEntry(d.id); }}
                                style={{ padding:10,textAlign:"center",background:T.bgCard,border:"1.5px solid "+(known?stCol+"66":T.border),cursor:"pointer",transition:"border-color 0.15s",opacity:known?1:0.45 }}>
                                <div style={{ display:"flex",justifyContent:"center",marginBottom:5,height:48,alignItems:"flex-end" }}>
                                  <DigiSprite digimonId={d.id} size={44} animate={known}/>
                                </div>
                                <div style={{ fontSize:9,fontWeight:800,color:known?T.text:T.textDim,marginBottom:2 }}>{d.name}</div>
                                <div className="px8" style={{ color:stCol,fontSize:"5px" }}>{d.stage}</div>
                                {known&&<div className="px8" style={{ color:role.color,marginTop:2,fontSize:"5px" }}>{role.icon} {d.role}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

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
                  <div style={{ width:Math.min((doneTasks.length/5)*100,100)+"%",height:"100%",background:T.coral }}/>
                </div>
                <div className="px8" style={{ color:T.gold,fontSize:"6px" }}>{doneTasks.length}/5</div>
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
                      <div className="px8" style={{ color:T.textDim,marginTop:2,fontSize:"5px" }}>{entry.time}</div>
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
                      <div className="px8" style={{ color:role.color,fontSize:"5px",marginTop:2 }}>{role.icon} {inf2&&inf2.role}</div>
                    </div>
                    {i===0&&<span className="px8" style={{ color:accent,fontSize:"6px" }}>★</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>
      </div>
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
        var lx = (cx + (r+18) * Math.cos((i/n)*2*Math.PI - Math.PI/2)).toFixed(1);
        var ly = (cy + (r+18) * Math.sin((i/n)*2*Math.PI - Math.PI/2)).toFixed(1);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill={ci.color}>
            {ci.icon}
          </text>
        );
      })}
    </svg>
  );
}

// ── CrestsPage ────────────────────────────────────────────────────────────────
function CrestsPage({ crestProfile, crestHistory, activeDigi, activeInfo, bond, T, accent, onGoTeam }) {
  var windowDays = 14;
  var today = new Date().toISOString().split('T')[0];
  var todayEntries = crestHistory.filter(function(e){ return e.date===today; });
  var todayCounts = {};
  todayEntries.forEach(function(e){
    if (e.primaryCrest) todayCounts[e.primaryCrest] = (todayCounts[e.primaryCrest]||0) + e.primary;
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
              <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"7px" }}>{slot.role.toUpperCase()}</div>
              {ci ? (
                <div>
                  <div style={{ fontSize:32,marginBottom:6 }}>{ci.icon}</div>
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

      {/* All 8 crests */}
      <div className="pcard" style={{ padding:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div className="px9">ALIGNMENT PROFILE</div>
          <div style={{ fontSize:11,color:T.textMid }}>Rolling {windowDays}-day window</div>
        </div>
        {Object.entries(crestProfile.percentages||{})
          .sort(function(a,b){ return b[1]-a[1]; })
          .map(function([name, pct]){
            var ci = CREST_INFO[name];
            var isPrim = name===crestProfile.primary;
            var isSec  = name===crestProfile.secondary;
            return (
              <div key={name} style={{ marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                  <span style={{ fontSize:16,width:22,textAlign:"center",flexShrink:0 }}>{ci.icon}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:ci.color,width:100,flexShrink:0 }}>{name}</span>
                  {isPrim&&<span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"5px" }}>★ PRIMARY</span>}
                  {isSec&&<span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.textMid,color:T.textMid,fontSize:"5px" }}>◆ SUPPORT</span>}
                  <span className="px8" style={{ color:T.textMid,fontSize:"6px",marginLeft:"auto" }}>{pct}%</span>
                </div>
                <div style={{ height:10,background:T.bgPanel,border:"2px solid "+T.border,overflow:"hidden" }}>
                  <div style={{ width:pct+"%",height:"100%",background:ci.color,transition:"width 0.8s ease",position:"relative" }}>
                    <div style={{ position:"absolute",top:2,left:3,right:3,height:3,background:"rgba(255,255,255,0.25)" }}/>
                  </div>
                </div>
                <div style={{ fontSize:10,color:T.textDim,marginTop:2 }}>{ci.desc}</div>
              </div>
            );
          })
        }
      </div>

      {/* Today's crest activity */}
      <div className="pcard" style={{ padding:14 }}>
        <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"7px" }}>TODAY'S CREST ACTIVITY</div>
        {Object.keys(todayCounts).length > 0 ? (
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            {Object.entries(todayCounts).map(function([name,pts]){
              var ci = CREST_INFO[name];
              return (
                <div key={name} style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:"1.5px solid "+ci.color,background:ci.color+"18" }}>
                  <span style={{ fontSize:14 }}>{ci.icon}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:ci.color }}>{name}</span>
                  <span className="px8" style={{ color:ci.color,fontSize:"7px" }}>+{pts}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize:11,color:T.textDim,fontStyle:"italic" }}>No crest tasks completed yet today.</div>
        )}
      </div>

      {/* Evolution path hint */}
      {activeInfo&&activeInfo.evolvesTo&&activeInfo.evolvesTo.length>0&&(
        <div className="pcard" style={{ padding:14 }}>
          <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"7px" }}>EVOLUTION PATHS FROM {(activeDigi&&activeDigi.name)||"PARTNER"}</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {activeInfo.evolvesTo.map(function(id){
              var ti = DIGIMON_MAP[id];
              if (!ti||ti.fusionOf) return null;
              var cr = ti.crestReq;
              if (!cr) return null;
              var pci = CREST_INFO[cr.primary];
              var sci = cr.secondary ? CREST_INFO[cr.secondary] : null;
              var pPct = (crestProfile.percentages&&crestProfile.percentages[cr.primary])||0;
              var sPct = sci ? ((crestProfile.percentages&&crestProfile.percentages[cr.secondary])||0) : 0;
              var matchScore = Math.round(cr.secondary ? pPct*0.7+sPct*0.3 : pPct);
              return (
                <div key={id} style={{ padding:"10px 12px",background:T.bgPanel,border:"2px solid "+T.border }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                    <DigiSprite digimonId={id} size={36} animate mood="walk"/>
                    <div>
                      <div style={{ fontSize:13,fontWeight:800 }}>{ti.name}</div>
                      <div className="px8" style={{ color:CREST_INFO[cr.primary].color,fontSize:"6px",marginTop:2 }}>{pci.icon} {cr.primary}{sci?" + "+sci.icon+" "+cr.secondary:""}</div>
                    </div>
                    <div style={{ marginLeft:"auto",textAlign:"right" }}>
                      <div style={{ fontSize:18,fontWeight:900,color:matchScore>=70?T.green:matchScore>=40?T.gold:T.coral }}>{matchScore}%</div>
                      <div className="px8" style={{ color:T.textDim,fontSize:"5px" }}>MATCH</div>
                    </div>
                  </div>
                  {/* Mini bars */}
                  <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ fontSize:10,width:16 }}>{pci.icon}</span>
                      <div style={{ flex:1,height:6,background:T.bgCard,border:"1px solid "+T.border,overflow:"hidden" }}>
                        <div style={{ width:pPct+"%",height:"100%",background:pci.color,transition:"width 0.6s ease" }}/>
                      </div>
                      <span className="px8" style={{ color:T.textMid,fontSize:"5px",width:24,textAlign:"right" }}>{pPct}%</span>
                    </div>
                    {sci&&(
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontSize:10,width:16 }}>{sci.icon}</span>
                        <div style={{ flex:1,height:6,background:T.bgCard,border:"1px solid "+T.border,overflow:"hidden" }}>
                          <div style={{ width:sPct+"%",height:"100%",background:sci.color,transition:"width 0.6s ease" }}/>
                        </div>
                        <span className="px8" style={{ color:T.textMid,fontSize:"5px",width:24,textAlign:"right" }}>{sPct}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="px8" style={{ marginTop:12,padding:"8px 14px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"6px" }} onClick={onGoTeam}>
            GO TO TEAM →
          </button>
        </div>
      )}
    </div>
  );
}

// ── TasksPage ─────────────────────────────────────────────────────────────────
function TasksPage({ tasks, onComplete, onAdd, onEdit, onDelete, onReschedule, accent, streak, T }) {
  var [filterTpl,  setFilterTpl]  = useState("All");
  var [filterType, setFilterType] = useState("All");
  var [showAdd,    setShowAdd]    = useState(false);
  var [editId,     setEditId]     = useState(null);
  var [form, setForm] = useState({ title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:"" });

  function reset(){ setForm({title:"",template:"Workout",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[],dueDate:""}); }
  function submitAdd(){ if(!form.title.trim())return; onAdd(form); reset(); setShowAdd(false); }
  function submitEdit(){ if(!editId||!form.title.trim())return; onEdit(editId,form); setEditId(null); reset(); }
  function startEdit(t){ setEditId(t.id); setForm({title:t.title,template:t.template||"Neutral",priority:t.priority,difficulty:t.difficulty,type:t.type,notes:t.notes||"",daysOfWeek:t.daysOfWeek||[],dueDate:t.dueDate||""}); }

  var typeColor = { once:T.lavender, daily:T.teal, recurring:T.mint };
  var visible = tasks
    .filter(function(t){ return (filterTpl==="All"||t.template===filterTpl)&&(filterType==="All"||t.type===filterType); })
    .sort(function(a,b){ return (a.done===b.done)?0:a.done?1:-1; });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {/* Template filters */}
      <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,width:"fit-content",flexWrap:"wrap" }}>
        {["All"].concat(["Workout","Deep Work","Recovery","Maintenance","Social","Reflection","Challenge","Neutral"]).map(function(c){
          var a=filterTpl===c;
          return <button key={c} className="task-tab" style={{ background:a?T.bg:T.bgCard,color:a?accent:T.textMid }} onClick={function(){ setFilterTpl(c); }}>{c.toUpperCase()}</button>;
        })}
      </div>
      <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"2px 2px 0 "+T.border,width:"fit-content" }}>
        {["All","once","daily","recurring"].map(function(t){
          var a=filterType===t;
          return <button key={t} className="task-tab" style={{ background:a?T.bg:T.bgCard,color:a?accent:T.textMid }} onClick={function(){ setFilterType(t); }}>{t==="once"?"ONE-TIME":t.toUpperCase()}</button>;
        })}
      </div>

      {showAdd&&!editId&&<TaskForm form={form} setForm={setForm} onSubmit={submitAdd} onCancel={function(){setShowAdd(false);reset();}} label="ADD TASK" accent={accent} T={T}/>}
      {!showAdd&&!editId&&(
        <button className="px8" style={{ padding:"11px 18px",background:T.coral,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,color:"white",cursor:"pointer",textAlign:"left",fontSize:"7px" }} onClick={function(){setShowAdd(true);}}>+ NEW TASK</button>
      )}

      {visible.length===0&&<div className="pcard" style={{ padding:40,textAlign:"center",color:T.textMid }}>No tasks found.</div>}

      {visible.map(function(t){
        var xp    = calcXpReward(t,streak);
        var cg    = calcCrestGain(t.template, t.difficulty);
        var stars = t.difficulty==="Hard"?3:t.difficulty==="Medium"?2:1;
        return (
          <div key={t.id}>
            {editId===t.id
              ? <TaskForm form={form} setForm={setForm} onSubmit={submitEdit} onCancel={function(){setEditId(null);reset();}} label="SAVE" accent={accent} T={T}/>
              : (
                <div className={"task-card tc-"+(t.priority||"low").toLowerCase()+(t.done?" done":"")}>
                  <div className={"task-check"+(t.done?" checked":"")} onClick={function(){if(!t.done)onComplete(t.id);}}>
                    {t.done&&<span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:800,textDecoration:t.done?"line-through":"none" }}>{t.title}</div>
                    {t.notes&&<div style={{ fontSize:11,color:T.textMid,marginTop:2 }}>{t.notes}</div>}
                    <div style={{ display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center" }}>
                      {/* Template badge with crest icon */}
                      {cg&&<span style={{ fontSize:12 }}>{CREST_INFO[cg.primaryCrest]?.icon}</span>}
                      <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.border,color:T.textMid,background:T.bgPanel,fontSize:"6px" }}>{t.template}</span>
                      <span className="px8" style={{ padding:"2px 6px",background:T.bgPanel,border:"1.5px solid "+(typeColor[t.type]||T.border),color:typeColor[t.type]||T.textMid,fontSize:"6px" }}>{t.type==="once"?"ONE-TIME":t.type.toUpperCase()}</span>
                      <span className="px8" style={{ padding:"2px 6px",background:"#1a1500",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"6px" }}>+{xp} XP</span>
                      {cg&&<span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+(CREST_INFO[cg.primaryCrest]?.color||T.border),color:CREST_INFO[cg.primaryCrest]?.color||T.textMid,background:T.bgPanel,fontSize:"6px" }}>+{cg.primary} {cg.primaryCrest}</span>}
                      <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+(PCOL[t.priority]||T.border),color:PCOL[t.priority]||T.text,background:T.bgPanel,fontSize:"6px" }}>{t.priority.toUpperCase()}</span>
                      {(t.streak||0)>0&&<span className="px8" style={{ color:T.coral,fontSize:"6px" }}>🔥 {t.streak}D</span>}
                      {t.dueDate&&<span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.teal,color:T.teal,background:T.bgPanel,fontSize:"6px" }}>📅 {t.dueDate}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
                    <div style={{ display:"flex",gap:2 }}>{[1,2,3,4].map(function(n){return <span key={n} style={{ fontSize:13,color:n<=stars?T.gold:T.textDim }}>★</span>;})}</div>
                    <div style={{ display:"flex",gap:4 }}>
                      <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:14,padding:"2px 4px" }} onClick={function(){startEdit(t);}}>✏</button>
                      <button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,padding:"2px 4px",lineHeight:1 }} onClick={function(){onDelete(t.id);}}>×</button>
                    </div>
                  </div>
                </div>
              )
            }
          </div>
        );
      })}
    </div>
  );
}

// ── WeeklyPlannerPage ─────────────────────────────────────────────────────────
function WeeklyPlannerPage({ tasks, party, farm, weeklyDigimon, onAssignDigimon, onReschedule, onComplete, accent, T }) {
  var today = new Date();
  var dayOfWeek = today.getDay();
  var mondayOffset = dayOfWeek===0?-6:1-dayOfWeek;
  var monday = new Date(today);
  monday.setDate(today.getDate()+mondayOffset);
  var DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var weekDates = DAYS.map(function(_,i){ var d=new Date(monday); d.setDate(monday.getDate()+i); return d; });
  var todayStr = today.toISOString().split('T')[0];
  var allDigimon = party.concat(farm);
  var BUSY_COLOR = ['#7EF797','#FFD700','#FF9940','#FF4444'];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div className="px12">WEEKLY PLANNER</div>
        <div style={{ fontSize:12,fontWeight:700,color:T.textMid }}>
          {monday.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {weekDates[6].toLocaleDateString('en-US',{month:'short',day:'numeric'})}
        </div>
      </div>
      {(function(){
        var pending = tasks.filter(function(t){ return !t.done&&t.dueDate; });
        var unscheduled = tasks.filter(function(t){ return !t.done&&!t.dueDate; });
        return (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div style={{ background:T.coral+"18",border:"2px solid "+T.coral,padding:"10px 14px" }}>
              <div className="px8" style={{ color:T.coral,marginBottom:3,fontSize:"7px" }}>📋 REMAINING THIS WEEK</div>
              <div style={{ fontSize:22,fontWeight:900 }}>{pending.length}</div>
            </div>
            <div style={{ background:T.textDim+"18",border:"2px solid "+T.border,padding:"10px 14px" }}>
              <div className="px8" style={{ color:T.textMid,marginBottom:3,fontSize:"7px" }}>📭 UNSCHEDULED</div>
              <div style={{ fontSize:22,fontWeight:900 }}>{unscheduled.length}</div>
            </div>
          </div>
        );
      })()}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,overflowX:"auto" }}>
        {weekDates.map(function(date,i){
          var dateStr   = date.toISOString().split('T')[0];
          var dayLabel  = DAYS[i];
          var isToday   = dateStr===todayStr;
          var dayTasks  = tasks.filter(function(t){ return t.dueDate===dateStr; });
          var pendCount = dayTasks.filter(function(t){ return !t.done; }).length;
          var busyColor = BUSY_COLOR[pendCount===0?0:pendCount<=2?1:pendCount<=4?2:3];
          var assignedDigi = allDigimon.find(function(d){ return d.uid===weeklyDigimon[dayLabel]; });
          return (
            <div key={dayLabel} style={{ minWidth:130,background:T.bgCard,border:"2px solid "+(isToday?accent:T.border),boxShadow:"3px 3px 0 "+(isToday?accent:T.border),display:"flex",flexDirection:"column",overflow:"hidden" }}>
              <div style={{ background:isToday?accent+"22":T.bgPanel,padding:"8px 10px",borderBottom:"2px solid "+T.border }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px8" style={{ color:isToday?accent:T.text,fontSize:"7px" }}>{dayLabel}</div>
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
                      <div className="px8" style={{ color:T.gold,fontSize:"5px" }}>⚡1.5x XP</div>
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
                {dayTasks.length===0
                  ? <div style={{ fontSize:10,color:T.textDim,fontStyle:"italic" }}>No tasks</div>
                  : dayTasks.map(function(t){
                    return (
                      <div key={t.id} style={{ background:t.done?T.bgPanel:T.bgCard,border:"1.5px solid "+(t.done?T.border:T.teal),padding:"5px 7px",opacity:t.done?0.5:1 }}>
                        <div style={{ display:"flex",alignItems:"flex-start",gap:5 }}>
                          <div style={{ width:14,height:14,border:"1.5px solid "+(t.done?T.teal:T.border),background:t.done?T.teal:"transparent",display:"grid",placeItems:"center",flexShrink:0,cursor:"pointer",marginTop:1 }} onClick={function(){ if(!t.done)onComplete(t.id); }}>
                            {t.done&&<span style={{ fontSize:9,color:"white",lineHeight:1,fontWeight:900 }}>✓</span>}
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:11,fontWeight:700,color:t.done?T.textMid:T.text,textDecoration:t.done?"line-through":"none",lineHeight:1.3,wordBreak:"break-word" }}>{t.title}</div>
                            <div style={{ fontSize:9,fontWeight:700,color:T.textDim,marginTop:2 }}>{t.template}</div>
                          </div>
                        </div>
                        {!t.done&&(
                          <input type="date" defaultValue={t.dueDate||""} onBlur={function(e){ if(e.target.value&&e.target.value!==t.dueDate) onReschedule(t.id,e.target.value); }}
                            style={{ width:"100%",marginTop:5,background:T.bgPanel,border:"1px solid "+T.border,padding:"3px 5px",color:T.textMid,fontSize:10,outline:"none",fontFamily:"'Nunito',sans-serif",colorScheme:"dark" }}/>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          );
        })}
      </div>
      {(function(){
        var unscheduled = tasks.filter(function(t){ return !t.done&&!t.dueDate; });
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
                    <span className="px8" style={{ color:T.textDim,fontSize:"6px" }}>DUE:</span>
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
  var inputSt = { background:T.bgPanel,border:"2px solid "+T.border,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",width:"100%",fontFamily:"'Nunito',sans-serif",boxSizing:"border-box" };
  var selSt   = Object.assign({},inputSt,{cursor:"pointer"});
  var TEMPLATES = ["Workout","Deep Work","Recovery","Maintenance","Social","Reflection","Challenge","Neutral"];
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
          <span style={{ fontSize:13 }}>{CREST_INFO[cg.primaryCrest]?.icon}</span>
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
          <span className="px8" style={{ color:T.textMid,fontSize:"7px" }}>DAYS:</span>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(function(d){
            var on=(form.daysOfWeek||[]).indexOf(d)>=0;
            return <button key={d} className="px8" style={{ padding:"4px 8px",border:"1.5px solid "+(on?accent:T.border),background:on?accent+"22":"transparent",color:on?accent:T.textDim,cursor:"pointer",fontSize:"6px" }}
              onClick={function(){setForm(function(f){var dw=f.daysOfWeek||[];return Object.assign({},f,{daysOfWeek:on?dw.filter(function(x){return x!==d;}):dw.concat([d])});});}}>{d}</button>;
          })}
        </div>
      )}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <span className="px8" style={{ color:T.textMid,fontSize:"7px",whiteSpace:"nowrap" }}>DUE DATE:</span>
        <input type="date" value={form.dueDate||""} onChange={function(e){setForm(function(f){return Object.assign({},f,{dueDate:e.target.value||null});});}} style={Object.assign({},inputSt,{flex:1,colorScheme:"dark"})}/>
        {form.dueDate&&<button style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:16,padding:"0 4px",flexShrink:0 }} onClick={function(){setForm(function(f){return Object.assign({},f,{dueDate:null});});}}>×</button>}
      </div>
      <textarea value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});});}} placeholder="Notes (optional)..." rows={2} style={Object.assign({},inputSt,{resize:"vertical"})}/>
      <div style={{ display:"flex",gap:8 }}>
        <button className="px8" style={{ padding:"9px 18px",background:accent,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontWeight:800,fontSize:"7px",boxShadow:"2px 2px 0 "+T.border }} onClick={onSubmit}>{label}</button>
        <button className="px8" style={{ padding:"9px 14px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"7px" }} onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

// ── REST Modal ────────────────────────────────────────────────────────────────
function RestModal({ sleepState, sleepLog, activeDigi, T, accent, onStart, onWake, onClose }) {
  var [wakeTime, setWakeTime] = useState("07:00");
  var isSleeping = sleepState && (sleepState.phase === 'sleeping' || sleepState.phase === 'countdown');

  var PRESETS = [
    { label:"5:30", val:"05:30" },
    { label:"6:00", val:"06:00" },
    { label:"6:30", val:"06:30" },
    { label:"7:00", val:"07:00" },
    { label:"7:30", val:"07:30" },
    { label:"8:00", val:"08:00" },
  ];

  function fmtDuration(mins) {
    if (mins < 60) return mins + "m";
    return Math.floor(mins/60) + "h " + (mins%60) + "m";
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
              <div className="px8" style={{ color:T.lavender,marginBottom:4,fontSize:"6px" }}>
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
            <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"6px" }}>SET WAKE-UP ALARM</div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
              <input
                type="time"
                value={wakeTime}
                onChange={function(e){ setWakeTime(e.target.value||"07:00"); }}
                style={{ fontFamily:"'Press Start 2P',monospace",fontSize:18,fontWeight:900,color:T.lavender,background:T.bgCard,border:"2px solid "+T.lavender,padding:"8px 12px",outline:"none",colorScheme:"dark",flex:1 }}
              />
            </div>
            {/* Quick presets */}
            <div className="px8" style={{ color:T.textDim,marginBottom:6,fontSize:"5px" }}>QUICK SELECT</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {PRESETS.map(function(p){
                return (
                  <button key={p.val}
                    className="px8"
                    style={{ padding:"5px 10px",background:wakeTime===p.val?T.lavender+"33":"transparent",border:"1.5px solid "+(wakeTime===p.val?T.lavender:T.border),color:wakeTime===p.val?T.lavender:T.textMid,cursor:"pointer",fontSize:"6px" }}
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
            style={{ padding:"10px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"7px" }}
            onClick={onWake}>
            ☀ WAKE UP EARLY
          </button>
        ) : (
          <button className="px8"
            style={{ padding:"10px",background:T.lavender+"22",border:"2px solid "+T.lavender,color:T.lavender,cursor:"pointer",fontSize:"7px" }}
            onClick={function(){ onStart(wakeTime); }}>
            🌙 BEGIN REST — ALARM {wakeTime}
          </button>
        )}

        {/* Sleep log */}
        {sleepLog.length > 0 && (
          <div>
            <div className="px8" style={{ color:T.textMid,marginBottom:8,fontSize:"6px" }}>SLEEP HISTORY</div>
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
                  <span className="px8" style={{ color:T.textDim,fontSize:"5px" }}>7-DAY AVG SLEEP</span>
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

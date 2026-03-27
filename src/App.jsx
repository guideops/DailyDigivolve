// ─── App.jsx — main entry, routes between pages ───────────────────────────────
// This is the slimmed-down App that imports from the correct files.
// The original digitask-full.jsx had everything in one file — this splits it out.

import { supabase } from './lib/supabase.js';
import { useState, useRef } from "react";
import DigiSprite from "./components/DigiSprite.jsx";
import { Bar, Tag, Btn } from "./components/ui.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { DIGIMON_MAP } from "./data/digimon.js";
import {
  PERSONALITIES, STAGE_COLOR, ATTR_COLOR,
  PRIORITY_COLORS, CATEGORIES, DAYS_OF_WEEK,
  MAX_PARTY_SIZE, BATTLE_REWARDS,
} from "./data/constants.js";
import {
  calcStats, calcXpReward, calcStatReward,
  applyXpGain, newDigimon, abiCap, totalBonusStats,
} from "./data/engine.js";

// ── Design tokens — dark pixel art system ─────────────────────────────────────
var T = {
  bg:         "#0d0f14",
  bgPanel:    "#111318",
  bgCard:     "#161a22",
  border:     "#2a2d3a",
  pixelBorder:"#7EB8F7",      // replaces Nomi's #3D2C1E — blue tint for dark
  pixelShadow:"rgba(126,184,247,0.25)",
  text:       "#e8eaf0",
  textMid:    "#8a90a8",
  textDim:    "#4a5070",
  coral:      "#FF6B6B",
  teal:       "#4ECDC4",
  lavender:   "#C3B1E1",
  mint:       "#A8E6CF",
  gold:       "#FFD700",
  red:        "#FF4444",
  green:      "#5CB85C",
  pink:       "#FF9EB5",
};

// Priority colour map
var PCOL = { Low:T.lavender, Medium:T.teal, High:T.coral, Urgent:T.red };

// Pixel box style — the Nomi signature
function px(accentColor) {
  accentColor = accentColor || T.pixelBorder;
  return {
    border:    "2px solid " + accentColor,
    boxShadow: "3px 3px 0 " + accentColor,
  };
}

// Nav pages
var NAV = [
  { id:"dashboard", label:"HOME",    icon:"⌂" },
  { id:"tasks",     label:"TASKS",   icon:"☑" },
  { id:"team",      label:"TEAM",    icon:"◈" },
  { id:"digifarm",  label:"FARM",    icon:"🌿" },
  { id:"battle",    label:"BATTLE",  icon:"⚔" },
  { id:"chat",      label:"CHAT",    icon:"💬" },
  { id:"store",     label:"STORE",   icon:"🛒" },
  { id:"digidex",   label:"DIGIDEX", icon:"📖" },
];

var STORE_ITEMS = [
  { id:"stat_hp",  name:"+4 HP Stat",          cost:1000, icon:"❤️" },
  { id:"stat_atk", name:"+4 ATK Stat",          cost:1000, icon:"⚔️" },
  { id:"stat_def", name:"+4 DEF Stat",           cost:1000, icon:"🛡️" },
  { id:"stat_spd", name:"+4 SPD Stat",           cost:1000, icon:"💨" },
  { id:"exp",      name:"EXP Booster +500",      cost:1000, icon:"⭐" },
  { id:"random",   name:"Random Digimon",        cost:2000, icon:"🎲" },
  { id:"xab",      name:"X-Antibody",            cost:3000, icon:"✖️" },
  { id:"pers",     name:"Personality Changer",   cost:2000, icon:"🎭" },
];

var INV_ITEMS = [
  { icon:"🍎", count:3 }, { icon:"🍰", count:1 }, { icon:"⚡", count:5 },
  { icon:"💎", count:2 }, { icon:"🧪", count:1 }, { icon:"🎀", count:4 },
  { icon:"·",  count:0 }, { icon:"·",  count:0 },
];

var PET_SPEECHES = [
  "you can do it! 💪", "finish your tasks!", "i believe in you ✨",
  "feed me please 🍎", "great job! +10 XP", "keep going!! 🔥", "i'm so proud! ⭐",
];

function makeParty() {
  var a = newDigimon("agumon",  { level:6, exp:340, abi:8,  bonusStats:{HP:4,SP:2,ATK:5,DEF:3,INT:1,SPD:3} });
  var b = newDigimon("gabumon", { level:4, exp:120, abi:5,  bonusStats:{HP:2,SP:1,ATK:3,DEF:4,INT:2,SPD:2} });
  var c = newDigimon("guilmon", { level:3, exp:60,  abi:3,  bonusStats:{HP:1,SP:0,ATK:2,DEF:1,INT:0,SPD:1} });
  return [a, b, c];
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App({ session }) {
  var [page,        setPage]        = useState("dashboard");
  const [party, setParty] = useState([])
  const [farm, setFarm] = useState([])
  const [savedStats, setSavedStats] = useState(0)
  const [bits, setBits] = useState(0)
  const [allDisc, setAllDisc] = useState([])
  const [tasks, setTasks] = useState([])
  var [speech,      setSpeech]      = useState("finish your tasks!");
  var [actLog,      setActLog]      = useState([
    { icon:"⭐", text:"DailyDigivolve started! Welcome, Tamer.", time:"JUST NOW" },
  ]);
  var [toast,       setToast]       = useState(null);
  var [evoAnim,     setEvoAnim]     = useState(null);
  var [battleState, setBattleState] = useState(null);
  var dragIdx = useRef(null);

const userId = session.user.id

// Load all data from Supabase on mount
useEffect(() => {
  async function loadData() {
    const [{ data: profile }, { data: digimonData }, { data: tasksData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('digimon').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    ])

    if (profile) {
      setBits(profile.bits || 350)
      setSavedStats(profile.saved_stats || 0)
    }

    if (digimonData && digimonData.length > 0) {
      const mapped = digimonData.map(d => ({
        uid:         d.id,
        speciesId:   d.species_id,
        name:        d.name,
        level:       d.level,
        exp:         d.exp,
        expNeeded:   d.exp_needed,
        abi:         d.abi,
        personality: d.personality,
        bonusStats:  d.bonus_stats,
        discovered:  d.discovered || [],
        inFarm:      d.in_farm,
        isXForm:     d.is_x_form,
      }))
      setParty(mapped.filter(d => !d.inFarm))
      setFarm(mapped.filter(d => d.inFarm))
      const allD = [...new Set(digimonData.flatMap(d => d.discovered || []))]
      setAllDisc(allD)
    } else {
      // First login — create starter Digimon
      const starter = newDigimon('agumon', {})
      const { data: newDigi } = await supabase.from('digimon').insert({
        user_id:     userId,
        species_id:  starter.speciesId,
        name:        starter.name,
        level:       1,
        exp:         0,
        exp_needed:  100,
        abi:         0,
        personality: starter.personality,
        bonus_stats: starter.bonusStats,
        discovered:  ['agumon'],
        in_farm:     false,
        sort_order:  0,
      }).select().single()
      if (newDigi) setParty([Object.assign({}, starter, { uid: newDigi.id })])
    }

    if (tasksData) {
      const today = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
      const visible = tasksData.filter(t => {
        if (t.type !== 'recurring') return true
        if (!t.days_of_week || t.days_of_week.length === 0) return true
        return t.days_of_week.includes(today)
      })
      setTasks(visible.map(t => ({
        id:           t.id,
        title:        t.title,
        category:     t.category,
        priority:     t.priority,
        difficulty:   t.difficulty,
        type:         t.type,
        notes:        t.notes || '',
        done:         t.done,
        streak:       t.streak || 0,
        daysOfWeek:   t.days_of_week || [],
      })))
    }
  }
  loadData()
}, [userId])
  
  // Derived
  var activeDigi = party[0];
  var activeInfo = activeDigi ? DIGIMON_MAP[activeDigi.speciesId] : null;
  var streak     = tasks.reduce(function(m,t){ return Math.max(m,t.streak||0); }, 0);
  var accent     = activeInfo ? (ATTR_COLOR[activeInfo.attr]||T.teal) : T.teal;
  var pendTasks  = tasks.filter(function(t){ return !t.done; });
  var doneTasks  = tasks.filter(function(t){ return  t.done; });
  var xpToday    = doneTasks.reduce(function(s,t){ return s + calcXpReward(t, streak); }, 0);
  var questDone  = doneTasks.length;
  var questTotal = 5;

  function addLog(icon, text) {
    setActLog(function(l){ return [{ icon:icon, text:text, time:"JUST NOW" }].concat(l.slice(0,7)); });
  }

  function toast_(msg, color) {
    setToast({ msg:msg, color:color||T.green });
    setTimeout(function(){ setToast(null); }, 2500);
  }

  function petAction(msg, logMsg) {
    setSpeech(msg);
    if (logMsg) addLog("🐾", logMsg);
  }

  async function completeTask(id) {
  const task = tasks.find(t => t.id === id)
  if (!task || task.done) return
  const xp = calcXpReward(task, streak)
  const sp = calcStatReward(task)

  // Update task in DB
  await supabase.from('tasks').update({
    done: true,
    streak: (task.streak || 0) + 1,
    last_completed_date: new Date().toISOString().split('T')[0],
  }).eq('id', id)

  // Update local state
  setTasks(ts => ts.map(t => t.id === id ? Object.assign({}, t, { done: true, streak: (t.streak||0)+1 }) : t))

  // Give XP to active Digimon
  const activeDigi = party[0]
  if (activeDigi) {
    const result = applyXpGain(activeDigi, xp)
    await supabase.from('digimon').update({
      exp:       result.exp,
      level:     result.level,
      exp_needed: result.expNeeded,
    }).eq('id', activeDigi.uid)
    setParty(p => p.map((d, i) => i === 0 ? Object.assign({}, d, result) : Object.assign({}, d, applyXpGain(d, Math.floor(xp * 0.5)))))
  }

  // Update saved stats
  const newSavedStats = (savedStats || 0) + sp
  setSavedStats(newSavedStats)
  await supabase.from('profiles').update({ saved_stats: newSavedStats }).eq('id', userId)

  setSpeech('great job! +' + xp + ' XP 🔥')
  addLog('✅', 'Completed "' + task.title + '" +' + xp + ' XP')
  toast_('Task done!  +' + xp + ' EXP  +' + sp + ' stat pts')
}

  function evolve(uid, targetId) {
    var info = DIGIMON_MAP[targetId];
    if (!info) return;
    setParty(function(p){ return p.map(function(d){
      if (d.uid!==uid) return d;
      var nd = d.discovered.indexOf(targetId)<0 ? d.discovered.concat([targetId]) : d.discovered;
      return Object.assign({},d,{speciesId:targetId,name:info.name,level:1,exp:0,expNeeded:100,abi:(d.abi||0)+Math.max(1,Math.floor(d.level/10)),discovered:nd});
    }); });
    setAllDisc(function(p){ return p.indexOf(targetId)<0?p.concat([targetId]):p; });
    setEvoAnim(targetId);
    setTimeout(function(){ setEvoAnim(null); }, 3200);
    addLog("✨", info.name+" digivolved!");
    toast_(info.name+" digivolved!","#FFD700");
  }

  function sendToFarm(uid) {
    if (party.length<=1) return;
    var d = party.find(function(x){ return x.uid===uid; });
    if (!d) return;
    setParty(function(p){ return p.filter(function(x){ return x.uid!==uid; }); });
    setFarm(function(f){ return f.concat([Object.assign({},d,{inFarm:true})]); });
    toast_(d.name+" sent to DigiFarm.");
  }

  function recallFromFarm(uid) {
    if (party.length>=MAX_PARTY_SIZE){ toast_("Party full! Max 9.","#FF8080"); return; }
    var d = farm.find(function(x){ return x.uid===uid; });
    if (!d) return;
    setFarm(function(f){ return f.filter(function(x){ return x.uid!==uid; }); });
    setParty(function(p){ return p.concat([Object.assign({},d,{inFarm:false})]); });
    toast_(d.name+" recalled!");
  }

  async function addTask(t) {
  const { data } = await supabase.from('tasks').insert({
    user_id:      userId,
    title:        t.title,
    category:     t.category,
    priority:     t.priority,
    difficulty:   t.difficulty,
    type:         t.type,
    notes:        t.notes || '',
    days_of_week: t.daysOfWeek || [],
    done:         false,
    streak:       0,
  }).select().single()

  if (data) {
    setTasks(ts => ts.concat([{
      id:         data.id,
      title:      data.title,
      category:   data.category,
      priority:   data.priority,
      difficulty: data.difficulty,
      type:       data.type,
      notes:      data.notes,
      done:       false,
      streak:     0,
      daysOfWeek: data.days_of_week || [],
    }]))
  }
  toast_('Task added!')
}
  
  async function editTask(id, updates) {
  await supabase.from('tasks').update({
    title:        updates.title,
    category:     updates.category,
    priority:     updates.priority,
    difficulty:   updates.difficulty,
    type:         updates.type,
    notes:        updates.notes,
    days_of_week: updates.daysOfWeek || [],
  }).eq('id', id)
  setTasks(ts => ts.map(t => t.id === id ? Object.assign({}, t, updates) : t))
}
  
  async function deleteTask(id) {
  await supabase.from('tasks').delete().eq('id', id)
  setTasks(ts => ts.filter(t => t.id !== id))
  toast_('Task deleted.', '#FF8080')
}

  function buyItem(item) {
    if (bits<item.cost){ toast_("Not enough bits!","#FF8080"); return; }
    setBits(function(b){ return b-item.cost; });
    toast_("Purchased: "+item.name,"#FFD700");
  }

  function startBattle(diff) {
    var candidates = Object.values(DIGIMON_MAP).filter(function(d){
      return diff==="Easy"?(d.stage==="Baby"||d.stage==="Rookie"):diff==="Medium"?(d.stage==="Rookie"||d.stage==="Champion"):(d.stage==="Champion"||d.stage==="Ultimate");
    });
    var enemies = [0,1,2].map(function(){
      var id  = candidates[Math.floor(Math.random()*candidates.length)].id;
      var lvl = diff==="Easy"?Math.ceil(Math.random()*4):diff==="Medium"?4+Math.ceil(Math.random()*5):9+Math.ceil(Math.random()*6);
      var tmp = newDigimon(id,{level:lvl}); var st=calcStats(tmp);
      return Object.assign({},tmp,{currentHp:st.HP,maxHp:st.HP,isEnemy:true});
    });
    var playerTeam = party.slice(0,3).map(function(d){ var st=calcStats(d); return Object.assign({},d,{currentHp:st.HP,maxHp:st.HP}); });
    setBattleState({ playerTeam:playerTeam, enemyTeam:enemies, log:[], phase:"fight", selected:0, difficulty:diff });
  }

  function battleAttack(idx) {
    if (!battleState||battleState.phase!=="fight") return;
    var bs = JSON.parse(JSON.stringify(battleState));
    var att=bs.playerTeam[bs.selected], def=bs.enemyTeam[idx];
    if (!att||!def||def.currentHp<=0) return;
    var dmg=Math.max(1,Math.floor(calcStats(att).ATK*1.2-calcStats(def).DEF*0.5+Math.random()*20));
    def.currentHp=Math.max(0,def.currentHp-dmg);
    bs.log=[att.name+" → "+def.name+"  −"+dmg].concat(bs.log).slice(0,6);
    var aliveE=bs.enemyTeam.filter(function(e){return e.currentHp>0;});
    if (aliveE.length>0) {
      var en=aliveE[Math.floor(Math.random()*aliveE.length)];
      var tgt=bs.playerTeam.filter(function(p){return p.currentHp>0;})[0];
      if (tgt){var edm=Math.max(1,Math.floor(calcStats(en).ATK-calcStats(tgt).DEF*0.4+Math.random()*15));tgt.currentHp=Math.max(0,tgt.currentHp-edm);bs.log=[en.name+" → "+tgt.name+"  −"+edm].concat(bs.log).slice(0,6);}
    }
    var won=bs.enemyTeam.every(function(e){return e.currentHp<=0;});
    var lost=bs.playerTeam.every(function(p){return p.currentHp<=0;});
    if (won||lost){ var r=BATTLE_REWARDS[bs.difficulty]||{win:60,loss:25}; var earn=won?r.win:r.loss; setBits(function(b){return b+earn;}); bs.log=[(won?"⚔ Victory! ":"💀 Defeated... ")+"+"+earn+"🪙"].concat(bs.log); bs.phase=won?"won":"lost"; }
    setBattleState(bs);
  }

  // ── CSS ──────────────────────────────────────────────────────────────────
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

    @keyframes bob     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fadeUp  { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes evoIn   { 0%,100%{opacity:0;transform:scale(0.75)} 35%,65%{opacity:1;transform:scale(1)} }
    @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes floatUp { from{transform:translateY(100vh) rotate(0deg);opacity:0.12} to{transform:translateY(-10vh) rotate(180deg);opacity:0} }

    .page-in { animation: slideUp 0.22s ease; }

    /* Pixel card */
    .pcard {
      background: ${T.bgCard};
      border: 2px solid ${T.border};
      box-shadow: 3px 3px 0 ${T.border};
    }
    .pcard-accent {
      border: 2px solid var(--accent);
      box-shadow: 3px 3px 0 var(--accent);
      background: ${T.bgCard};
    }

    /* Nav pill */
    .nav-pill {
      font-family:'Press Start 2P',monospace;
      font-size:7px;
      padding:7px 11px;
      border:2px solid ${T.border};
      background:transparent;
      cursor:pointer;
      color:${T.textMid};
      transition:all 0.1s;
    }
    .nav-pill:hover, .nav-pill.active {
      background:${T.bgCard};
      color:${T.text};
      transform:translate(-1px,-1px);
      box-shadow:2px 2px 0 ${T.border};
    }
    .nav-pill.active {
      border-color:var(--accent);
      color:var(--accent);
      box-shadow:2px 2px 0 var(--accent);
    }

    /* Task card */
    .task-card {
      background:${T.bgCard};
      border:2px solid ${T.border};
      box-shadow:3px 3px 0 ${T.border};
      padding:13px 14px;
      display:flex;
      align-items:center;
      gap:12px;
      cursor:pointer;
      transition:all 0.12s;
      position:relative;
      overflow:hidden;
    }
    .task-card:hover { transform:translate(-2px,-2px); box-shadow:5px 5px 0 ${T.border}; }
    .task-card.done  { opacity:0.45; }

    /* Priority left strip */
    .task-card::before { content:''; position:absolute; left:0;top:0;bottom:0; width:4px; }
    .tc-high::before   { background:${T.coral}; }
    .tc-medium::before { background:${T.teal}; }
    .tc-low::before    { background:${T.lavender}; }
    .tc-urgent::before { background:${T.red}; }

    /* Task checkbox */
    .task-check {
      width:22px; height:22px;
      border:2px solid ${T.border};
      background:${T.bgPanel};
      display:grid; place-items:center;
      flex-shrink:0; cursor:pointer;
      transition:background 0.1s;
    }
    .task-check.checked { background:${T.teal}; }

    /* Pet action buttons */
    .pet-btn {
      font-family:'Press Start 2P',monospace;
      font-size:7px;
      padding:9px 6px;
      border:2px solid ${T.border};
      cursor:pointer;
      text-align:center;
      display:flex; align-items:center; justify-content:center; gap:4px;
      transition:all 0.1s;
    }
    .pet-btn:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 ${T.border}; }
    .pet-btn:active { transform:translate(2px,2px); box-shadow:none !important; }

    /* Task tab */
    .task-tab {
      font-family:'Press Start 2P',monospace;
      font-size:7px;
      padding:8px 12px;
      cursor:pointer;
      border:none;
      border-right:2px solid ${T.border};
      background:${T.bgCard};
      color:${T.textMid};
      transition:all 0.1s;
    }
    .task-tab:last-child { border-right:none; }
    .task-tab.active { background:${T.bg}; color:var(--accent); }

    /* Inventory slot */
    .inv-slot {
      aspect-ratio:1;
      border:2px solid ${T.border};
      background:${T.bgPanel};
      display:grid; place-items:center;
      font-size:18px; cursor:pointer;
      transition:all 0.1s; position:relative;
    }
    .inv-slot:hover { transform:translate(-1px,-1px); box-shadow:2px 2px 0 ${T.border}; background:${T.bgCard}; }
    .inv-slot.empty { opacity:0.25; cursor:default; font-size:11px; color:${T.textDim}; }
    .inv-slot.empty:hover { transform:none; box-shadow:none; }

    /* Digi card in team */
    .digi-card {
      background:${T.bgCard};
      border:2px solid ${T.border};
      padding:12px;
      cursor:grab;
      transition:all 0.12s;
    }
    .digi-card:hover { border-color:var(--accent); box-shadow:2px 2px 0 var(--accent); }

    /* Battle */
    .battle-tile {
      background:${T.bgCard};
      border:2px solid ${T.border};
      padding:12px;
      text-align:center;
      cursor:pointer;
      transition:all 0.12s;
    }
    .battle-tile.enemy:hover { border-color:${T.coral}; box-shadow:2px 2px 0 ${T.coral}; }
    .battle-tile.player.active { border-color:var(--accent); box-shadow:2px 2px 0 var(--accent); }

    /* Store row */
    .store-row {
      background:${T.bgCard};
      border:2px solid ${T.border};
      padding:12px 14px;
      display:flex; align-items:center; gap:12px;
      transition:all 0.12s;
    }
    .store-row:hover { border-color:${T.gold}; box-shadow:2px 2px 0 ${T.gold}; }

    /* Floating particles */
    .particle {
      position:fixed; pointer-events:none;
      width:6px; height:6px;
      border:1.5px solid ${T.border};
      opacity:0.08;
      animation:floatUp linear infinite;
    }

    /* Section label divider (like Nomi) */
    .sec-label {
      font-family:'Press Start 2P',monospace;
      font-size:7px;
      color:${T.textDim};
      display:flex; align-items:center; gap:10px;
      padding:4px 0;
    }
    .sec-label::after { content:''; flex:1; height:1px; background:${T.border}; opacity:0.6; }

    /* Section title with divider line */
    .sec-title {
      font-family:'Press Start 2P',monospace;
      font-size:8px;
      color:${T.text};
      margin-bottom:12px;
      display:flex; align-items:center; gap:10px;
    }
    .sec-title::after { content:''; flex:1; height:2px; background:${T.border}; }

    /* Evolve banner shimmer */
    .evo-banner {
      background: linear-gradient(90deg, #1a1f3a, #1f2a3a, #1a1f3a);
      background-size:200% auto;
      animation:shimmer 3s linear infinite;
      border:2px solid ${T.lavender};
      box-shadow:3px 3px 0 ${T.lavender};
      padding:10px 14px;
      display:flex; align-items:center; gap:10px;
      cursor:pointer;
    }

    /* Responsive */
    @media (max-width:1080px) { .right-col { display:none !important; } }
    @media (max-width:700px)  { .left-col  { display:none !important; } .main-content { padding:12px; } }
  `;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Nunito',sans-serif", "--accent":accent }}>
      <style>{css}</style>

      {/* Floating pixels */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden" }} aria-hidden="true">
        {[{l:"5%",d:"12s",c:T.teal},{l:"18%",d:"9s",c:T.lavender,dd:"2s"},{l:"35%",d:"15s",c:accent,dd:"4s"},{l:"58%",d:"11s",c:T.coral,dd:"1s"},{l:"74%",d:"14s",c:T.mint,dd:"6s"},{l:"90%",d:"10s",c:T.gold,dd:"3s"}].map(function(p,i){
          return <div key={i} className="particle" style={{ left:p.l, animationDuration:p.d, animationDelay:p.dd||"0s", background:p.c }}/>;
        })}
      </div>

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
        {/* Logo */}
        <div className="px12" style={{ display:"flex",alignItems:"center",gap:10,color:T.text }}>
          <div style={{ width:10,height:10,background:accent,border:"2px solid "+T.border,animation:"blink 1.2s step-end infinite",display:"inline-block" }}/>
          DAILY<span style={{ color:accent }}>DIGIVOLVE</span>
        </div>

        {/* Nav pills */}
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
          {NAV.map(function(n){
            return (
              <button key={n.id} className={"nav-pill"+(page===n.id?" active":"")} onClick={function(){ setPage(n.id); }}>
                {n.icon} {n.label}
              </button>
            );
          })}
        </div>

        {/* User */}
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div className="px8" style={{ color:T.textMid }}>LV.{activeDigi&&activeDigi.level}</div>
          <div style={{ width:34,height:34,border:"2px solid "+T.border,background:T.bgCard,display:"grid",placeItems:"center" }}>
            {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={26} animate={false}/>}
          </div>
          <span style={{ fontWeight:800,fontSize:13 }}>Tamer</span>
          <div className="px8" style={{ color:T.gold }}>🪙{bits}</div>
          <button onClick={() => supabase.auth.signOut()}
  style={{ fontFamily:"'Press Start 2P',monospace", fontSize:"6px", padding:"5px 9px", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.35)", cursor:"pointer" }}>
  SIGN OUT
</button>
        </div>
      </nav>

      {/* ── THREE COLUMN LAYOUT ───────────────────────────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"300px 1fr 260px",minHeight:"calc(100vh - 64px)",position:"relative",zIndex:1 }}>

        {/* ═══ LEFT — PET PANEL ══════════════════════════════════════════ */}
        <aside className="left-col" style={{ background:T.bgPanel,borderRight:"2px solid "+T.border,padding:"24px 20px",display:"flex",flexDirection:"column",gap:18,overflowY:"auto" }}>

          {/* Pet stage viewport */}
          <div style={{ background:"linear-gradient(160deg,#0d1a2a 0%,#0a1520 50%,#120d20 100%)",border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,height:210,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",position:"relative",overflow:"hidden",paddingBottom:14 }}>
            {/* Dot grid bg */}
            <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(126,184,247,0.12) 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none" }}/>
            {/* Speech bubble */}
            <div style={{ position:"absolute",top:10,left:"50%",background:T.bgCard,border:"2px solid "+accent,boxShadow:"2px 2px 0 "+accent,padding:"5px 10px",whiteSpace:"nowrap",zIndex:3,animation:"fadeUp 0.3s ease",transform:"translateX(-50%)" }}>
              <span className="px8" style={{ color:accent }}>{speech}</span>
              <div style={{ position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"6px solid "+accent }}/>
            </div>
            {/* Digimon */}
            <div style={{ position:"relative",zIndex:2,animation:"bob 2s ease-in-out infinite",cursor:"pointer",transformOrigin:"bottom center" }}
              onClick={function(){ setSpeech(PET_SPEECHES[Math.floor(Math.random()*PET_SPEECHES.length)]); }}>
              {activeDigi&&<DigiSprite digimonId={activeDigi.speciesId} size={88} mood="happy"/>}
            </div>
            {/* Ground strip */}
            <div style={{ position:"absolute",bottom:0,left:0,right:0,height:36,background:"repeating-linear-gradient(90deg,"+T.teal+"22 0px,"+T.teal+"22 16px,"+T.teal+"11 16px,"+T.teal+"11 32px)",borderTop:"2px solid "+T.border,zIndex:1 }}/>
          </div>

          {/* Pet name + level */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div className="px10" style={{ color:T.text }}>{activeDigi&&activeDigi.name}</div>
            <div className="px8" style={{ background:accent,border:"2px solid "+T.border,padding:"3px 8px",boxShadow:"2px 2px 0 "+T.border,color:T.bg }}>LV.{activeDigi&&activeDigi.level}</div>
          </div>

          {/* Stat bars */}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {[
              { label:"❤️ HP",   val:activeDigi?Math.min(100,calcStats(activeDigi).HP):75, max:100,  color:T.green  },
              { label:"⭐ XP",   val:activeDigi?activeDigi.exp:0,                           max:activeDigi?activeDigi.expNeeded:100, color:T.gold  },
              { label:"😊 MOOD", val:Math.max(30,100-pendTasks.length*12),                  max:100,  color:T.pink   },
            ].map(function(s){
              return (
                <div key={s.label} style={{ display:"flex",flexDirection:"column",gap:5 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}>
                    <span className="px8" style={{ color:T.textMid }}>{s.label}</span>
                    <span className="px8" style={{ color:T.textMid }}>{Math.round(s.val)}/{s.max}</span>
                  </div>
                  <div style={{ height:12,background:T.bgCard,border:"2px solid "+T.border,overflow:"hidden" }}>
                    <div style={{ width:Math.min((s.val/s.max)*100,100)+"%",height:"100%",background:s.color,position:"relative",transition:"width 0.8s ease" }}>
                      <div style={{ position:"absolute",top:2,left:3,right:3,height:3,background:"rgba(255,255,255,0.25)" }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pet action buttons */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            {[
              { label:"🍎 FEED",  color:T.coral,    log:"nom nom nom 🍎",       logMsg:"Mochi was fed!" },
              { label:"🎮 PLAY",  color:T.teal,     log:"yay let's play! 🎮",   logMsg:"Mochi played happily!" },
              { label:"💤 REST",  color:T.lavender, log:"zzz... 💤",            logMsg:"Mochi is resting." },
              { label:"⚡ TRAIN", color:T.mint,     log:"getting stronger! ⚡", logMsg:"Mochi trained hard!" },
            ].map(function(b){
              return (
                <button key={b.label} className="pet-btn" style={{ background:b.color+"22",borderColor:b.color,color:b.color }} onClick={function(){ petAction(b.log, b.logMsg); }}>
                  {b.label}
                </button>
              );
            })}
          </div>

          {/* Evolution banner */}
          {activeInfo && (function(){
            var evoT = (activeInfo.evolvesTo||[]).filter(function(id){ var t=DIGIMON_MAP[id]; return t&&!t.fusionOf&&activeDigi.level>=10; });
            var xpLeft = (activeDigi.expNeeded - activeDigi.exp);
            return evoT.length>0 ? (
              <div className="evo-banner" onClick={function(){ setPage("team"); }}>
                <span style={{ fontSize:18 }}>✨</span>
                <div style={{ flex:1 }}>
                  <div className="px8" style={{ color:T.lavender }}>EVOLUTION READY</div>
                  <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:3 }}>Go to Team to evolve!</div>
                </div>
                <span style={{ color:T.lavender,fontWeight:900 }}>→</span>
              </div>
            ) : (
              <div className="evo-banner">
                <span style={{ fontSize:18 }}>✨</span>
                <div style={{ flex:1 }}>
                  <div className="px8" style={{ color:T.lavender }}>EVOLUTION NEAR</div>
                  <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:3 }}>{xpLeft} more XP needed!</div>
                </div>
                <span style={{ color:T.lavender }}>→</span>
              </div>
            );
          })()}

          {/* Saved stats banner */}
          {savedStats>0&&(
            <div style={{ background:T.gold+"18",border:"2px solid "+T.gold,boxShadow:"2px 2px 0 "+T.gold,padding:"10px 12px",cursor:"pointer" }} onClick={function(){setPage("team");}}>
              <div className="px8" style={{ color:T.gold }}>⭐ {savedStats} STAT PTS</div>
              <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:3 }}>Tap to allocate in Team</div>
            </div>
          )}
        </aside>

        {/* ═══ MIDDLE — MAIN CONTENT ══════════════════════════════════════ */}
        <main className="main-content" style={{ padding:"24px 28px",display:"flex",flexDirection:"column",gap:18,overflowY:"auto" }}>
          <div key={page} className="page-in">

            {/* ── DASHBOARD ────────────────────────────────────────────── */}
            {page==="dashboard"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>

                {/* Streak row */}
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                  {[
                    { icon:"🔥", val:streak,               label:"day streak" },
                    { icon:"✅", val:doneTasks.length+"/"+tasks.length, label:"done today" },
                    { icon:"⭐", val:"+"+xpToday,           label:"XP today" },
                  ].map(function(s){
                    return (
                      <div key={s.label} className="pcard" style={{ padding:14,display:"flex",alignItems:"center",gap:12 }}>
                        <div style={{ fontSize:26,lineHeight:1 }}>{s.icon}</div>
                        <div>
                          <div className="px12" style={{ color:T.text,lineHeight:1 }}>{s.val}</div>
                          <div style={{ fontSize:11,fontWeight:700,color:T.textMid,marginTop:4 }}>{s.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Header */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
                  <div>
                    <div className="px12">TODAY'S QUESTS</div>
                    <div style={{ fontSize:13,fontWeight:700,color:T.textMid,marginTop:4 }}>{pendTasks.length} tasks remaining</div>
                  </div>
                  <button className="px8" onClick={function(){setPage("tasks");}} style={{ padding:"9px 14px",background:T.coral,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,color:"white",cursor:"pointer" }}>
                    + NEW TASK
                  </button>
                </div>

                {/* Priority sections */}
                {[["High","Urgent"],["Medium"],["Low"]].map(function(pris){
                  var label = pris[0]==="High"?"⚡ HIGH / URGENT":pris[0]==="Medium"?"🌿 MEDIUM":"💜 LOW";
                  var tlist = pendTasks.filter(function(t){ return pris.indexOf(t.priority)>=0; });
                  if (tlist.length===0) return null;
                  return (
                    <div key={label} style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      <div className="sec-label">{label}</div>
                      {tlist.map(function(t){
                        var xp=calcXpReward(t,streak);
                        var stars=t.difficulty==="Hard"?3:t.difficulty==="Medium"?2:1;
                        return (
                          <div key={t.id} className={"task-card tc-"+(t.priority||"low").toLowerCase()}>
                            <div className={"task-check"+(t.done?" checked":"")} onClick={function(e){ e.stopPropagation(); completeTask(t.id); }}>
                              {t.done&&<span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span>}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:14,fontWeight:800,color:T.text }}>{t.title}</div>
                              <div style={{ display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center" }}>
                                <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.border,color:T.textMid,background:T.bgPanel,fontSize:"6px" }}>{t.category.toUpperCase()}</span>
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

                {/* Done tasks */}
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

            {/* ── TASKS FULL ───────────────────────────────────────────── */}
            {page==="tasks"&&(
              <TasksPage tasks={tasks} onComplete={completeTask} onAdd={addTask} onEdit={editTask} onDelete={deleteTask} accent={accent} streak={streak} T={T}/>
            )}

            {/* ── TEAM ─────────────────────────────────────────────────── */}
            {page==="team"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">TEAM MANAGER</div>
                  <span className="px8" style={{ color:accent }}>{party.length}/{MAX_PARTY_SIZE}</span>
                </div>
                {savedStats>0&&(
                  <div style={{ background:T.gold+"15",border:"2px solid "+T.gold,boxShadow:"3px 3px 0 "+T.gold,padding:14 }}>
                    <div className="px8" style={{ color:T.gold,marginBottom:10 }}>⭐ {savedStats} STAT POINTS</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      {["HP","SP","ATK","DEF","INT","SPD"].map(function(stat){
                        return (
                          <button key={stat} className="px8" style={{ padding:"6px 10px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"7px" }} onClick={function(){
                            if(savedStats<=0)return;
                            setParty(function(p){return p.map(function(d,i){if(i!==0)return d;if(totalBonusStats(d)>=abiCap(d)){toast_("ABI cap reached!","#FF8080");return d;}var nb=Object.assign({},d.bonusStats);nb[stat]=(nb[stat]||0)+1;return Object.assign({},d,{bonusStats:nb});});});
                            setSavedStats(function(s){return s-1;});
                          }}>+{stat}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {party.map(function(digi,i){
                  var inf2=DIGIMON_MAP[digi.speciesId]; var st2=calcStats(digi);
                  var evoT=(inf2&&inf2.evolvesTo||[]).filter(function(id){var t=DIGIMON_MAP[id];return t&&!t.fusionOf&&digi.level>=10;});
                  return (
                    <div key={digi.uid} className="pcard" style={{ padding:16,borderColor:i===0?accent:T.border,boxShadow:"3px 3px 0 "+(i===0?accent:T.border) }}>
                      <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
                        <div style={{ position:"relative" }}>
                          <DigiSprite digimonId={digi.speciesId} size={80} mood="happy"/>
                          {i===0&&<div style={{ position:"absolute",top:-6,right:-6,background:accent,border:"2px solid "+T.border,width:18,height:18,display:"grid",placeItems:"center",fontSize:9,color:T.bg,fontWeight:900 }}>★</div>}
                        </div>
                        <div style={{ flex:1,minWidth:160 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6 }}>
                            <div className="px10">{digi.name}</div>
                            <div className="px8" style={{ padding:"2px 7px",border:"1.5px solid "+(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),color:(STAGE_COLOR[inf2&&inf2.stage]||"#aaa"),fontSize:"6px" }}>{inf2&&inf2.stage}</div>
                          </div>
                          <div className="px8" style={{ color:T.textMid,marginBottom:10,fontSize:"6px" }}>Lv.{digi.level} · ABI {digi.abi} · {PERSONALITIES.find(function(p){return p.id===digi.personality;})&&PERSONALITIES.find(function(p){return p.id===digi.personality;}).label}</div>
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10 }}>
                            {[["HP",st2.HP,T.green],["ATK",st2.ATK,T.coral],["DEF",st2.DEF,T.teal],["SP",st2.SP,T.lavender],["INT",st2.INT,T.lavender],["SPD",st2.SPD,T.gold]].map(function(s){
                              return <div key={s[0]} style={{ fontSize:11,fontWeight:700,color:T.textMid }}><span style={{ color:s[2],fontWeight:900 }}>{s[1]}</span> {s[0]}</div>;
                            })}
                          </div>
                          <div style={{ marginBottom:10 }}>
                            <Bar value={digi.exp} max={digi.expNeeded} color={accent} h={8}/>
                          </div>
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                            {evoT.map(function(tid){return <button key={tid} className="px8" style={{ padding:"6px 10px",background:T.gold+"22",border:"2px solid "+T.gold,color:T.gold,cursor:"pointer",fontSize:"6px" }} onClick={function(){evolve(digi.uid,tid);}}>→ {DIGIMON_MAP[tid]&&DIGIMON_MAP[tid].name}</button>;})}
                            {party.length>1&&<button className="px8" style={{ padding:"6px 10px",background:"transparent",border:"2px solid "+T.textDim,color:T.textDim,cursor:"pointer",fontSize:"6px" }} onClick={function(){sendToFarm(digi.uid);}}>→ Farm</button>}
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
                    return (
                      <div key={d.uid} className="pcard" style={{ padding:14,display:"flex",alignItems:"center",gap:14 }}>
                        <DigiSprite digimonId={d.speciesId} size={54} animate={false}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:800,fontSize:14 }}>{d.name}</div>
                          <div className="px8" style={{ color:T.textMid,marginTop:3,fontSize:"6px" }}>Lv.{d.level} · ABI {d.abi}</div>
                        </div>
                        <button className="px8" style={{ padding:"7px 12px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"6px" }} onClick={function(){recallFromFarm(d.uid);}}>RECALL</button>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* ── BATTLE ───────────────────────────────────────────────── */}
            {page==="battle"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div className="px12">BATTLE ARENA</div>
                {!battleState?(
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                    {["Easy","Medium","Hard"].map(function(diff){
                      var r=BATTLE_REWARDS[diff]||{win:60,loss:25};
                      var c=diff==="Easy"?T.green:diff==="Medium"?T.gold:T.coral;
                      return (
                        <div key={diff} className="pcard" style={{ padding:20,textAlign:"center",cursor:"pointer",borderColor:c,boxShadow:"3px 3px 0 "+c }} onClick={function(){startBattle(diff);}}>
                          <div className="px10" style={{ color:c,marginBottom:8 }}>{diff.toUpperCase()}</div>
                          <div style={{ fontSize:11,fontWeight:700,color:T.textMid }}>Win {r.win}🪙</div>
                          <div style={{ fontSize:11,fontWeight:700,color:T.textDim }}>Loss {r.loss}🪙</div>
                        </div>
                      );
                    })}
                  </div>
                ):battleState.phase==="fight"?(
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    <div className="sec-label">ENEMY TEAM — tap to attack</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                      {battleState.enemyTeam.map(function(e,i){
                        return (
                          <div key={i} className="battle-tile enemy" style={{ opacity:e.currentHp<=0?0.3:1 }} onClick={function(){battleAttack(i);}}>
                            <DigiSprite digimonId={e.speciesId} size={52} mood={e.currentHp<=0?"sad":"angry"} animate={e.currentHp>0}/>
                            <div className="px8" style={{ marginTop:6,marginBottom:4,fontSize:"6px" }}>{e.name}</div>
                            <Bar value={e.currentHp} max={e.maxHp} color={T.coral} h={6}/>
                            <div style={{ fontSize:9,color:T.textMid,marginTop:2 }}>{e.currentHp}/{e.maxHp}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="sec-label">YOUR TEAM — select attacker</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                      {battleState.playerTeam.map(function(p,i){
                        var isAct=battleState.selected===i;
                        return (
                          <div key={i} className={"battle-tile player"+(isAct?" active":"")} style={{ opacity:p.currentHp<=0?0.3:1 }} onClick={function(){setBattleState(function(bs){return Object.assign({},bs,{selected:i});});}}>
                            <DigiSprite digimonId={p.speciesId} size={52} mood={p.currentHp<=0?"sad":isAct?"happy":"stoic"} animate={isAct&&p.currentHp>0}/>
                            <div className="px8" style={{ marginTop:6,marginBottom:4,fontSize:"6px" }}>{p.name}</div>
                            <Bar value={p.currentHp} max={p.maxHp} color={T.green} h={6}/>
                            {isAct&&<div className="px8" style={{ color:accent,marginTop:4,fontSize:"6px" }}>★ ATTACKER</div>}
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
                    <button className="px8" style={{ padding:"10px 20px",background:accent+"22",border:"2px solid "+accent,color:accent,cursor:"pointer",fontSize:"7px" }} onClick={function(){setBattleState(null);}}>RETURN</button>
                  </div>
                )}
              </div>
            )}

            {/* ── CHAT ─────────────────────────────────────────────────── */}
            {page==="chat"&&activeDigi&&(
              <ChatPage digimon={Object.assign({},activeDigi,{stage:activeInfo?activeInfo.stage:"Rookie",streak:streak,hp:75})} tasks={tasks}/>
            )}

            {/* ── STORE ────────────────────────────────────────────────── */}
            {page==="store"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">NEEMON'S SHOP</div>
                  <div className="px8" style={{ color:T.gold }}>🪙 {bits} BITS</div>
                </div>
                <div style={{ fontSize:12,fontWeight:700,color:T.textMid }}>Earn bits by winning Arena battles.</div>
                {STORE_ITEMS.map(function(item){
                  return (
                    <div key={item.id} className="store-row">
                      <span style={{ fontSize:24,flexShrink:0 }}>{item.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14,fontWeight:800 }}>{item.name}</div>
                        <div className="px8" style={{ color:T.textDim,marginTop:3,fontSize:"6px" }}>ONE-TIME USE</div>
                      </div>
                      <button className="px8" style={{ padding:"7px 12px",background:bits>=item.cost?T.gold+"22":"transparent",border:"2px solid "+(bits>=item.cost?T.gold:T.textDim),color:bits>=item.cost?T.gold:T.textDim,cursor:bits>=item.cost?"pointer":"not-allowed",fontSize:"6px",boxShadow:bits>=item.cost?"2px 2px 0 "+T.gold:"none" }} onClick={function(){buyItem(item);}}>
                        {item.cost}🪙
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── DIGIDEX ──────────────────────────────────────────────── */}
            {page==="digidex"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div className="px12">DIGIDEX</div>
                  <span className="px8" style={{ color:accent }}>{allDisc.length}/{Object.keys(DIGIMON_MAP).length}</span>
                </div>
                <Bar value={allDisc.length} max={Object.keys(DIGIMON_MAP).length} color={accent} h={8}/>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10 }}>
                  {Object.values(DIGIMON_MAP).map(function(d){
                    var known=allDisc.indexOf(d.id)>=0;
                    return (
                      <div key={d.id} className="pcard" style={{ padding:14,textAlign:"center",opacity:known?1:0.3 }}>
                        {known
                          ? <DigiSprite digimonId={d.id} size={48} animate={false}/>
                          : <div style={{ width:48,height:48,margin:"0 auto",background:T.bgPanel,border:"2px solid "+T.border,display:"grid",placeItems:"center",fontSize:18,color:T.textDim }}>?</div>
                        }
                        <div style={{ fontSize:11,fontWeight:800,marginTop:8 }}>{known?d.name:"???"}</div>
                        {known&&<div className="px8" style={{ color:STAGE_COLOR[d.stage]||"#aaa",marginTop:5,fontSize:"6px" }}>{d.stage}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ═══ RIGHT — INVENTORY + LOG ════════════════════════════════════ */}
        <aside className="right-col" style={{ background:T.bgPanel,borderLeft:"2px solid "+T.border,padding:"24px 18px",display:"flex",flexDirection:"column",gap:22,overflowY:"auto" }}>

          {/* Daily Quest */}
          <div>
            <div className="sec-title">DAILY QUEST</div>
            <div style={{ background:"linear-gradient(135deg,#1a1a00,#1f1800)",border:"2px solid "+T.gold,boxShadow:"3px 3px 0 "+T.gold,padding:14 }}>
              <div className="px8" style={{ color:T.gold,marginBottom:6 }}>🗡 PRODUCTIVITY WARRIOR</div>
              <div style={{ fontSize:12,fontWeight:700,color:T.textMid,marginBottom:10,lineHeight:1.5 }}>Complete {questTotal} tasks before midnight to earn a Rare Treat!</div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ flex:1,height:10,background:T.bgCard,border:"1.5px solid "+T.border,overflow:"hidden" }}>
                  <div style={{ width:Math.min((questDone/questTotal)*100,100)+"%",height:"100%",background:T.coral }}/>
                </div>
                <div className="px8" style={{ color:T.gold,fontSize:"6px" }}>{questDone}/{questTotal}</div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <div className="sec-title">INVENTORY</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
              {INV_ITEMS.map(function(item,i){
                return (
                  <div key={i} className={"inv-slot"+(item.count===0?" empty":"")} title={item.count>0?item.icon:""}>
                    <span>{item.icon}</span>
                    {item.count>0&&<span className="px8" style={{ position:"absolute",bottom:2,right:3,fontSize:"5px",color:T.textMid }}>{item.count}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <div className="sec-title">ACTIVITY LOG</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {actLog.map(function(entry,i){
                return (
                  <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                    <div style={{ width:24,height:24,border:"2px solid "+T.border,display:"grid",placeItems:"center",fontSize:12,flexShrink:0,background:T.bgCard }}>
                      {entry.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:T.textMid,lineHeight:1.5 }}>{entry.text}</div>
                      <div className="px8" style={{ color:T.textDim,marginTop:2,fontSize:"5px" }}>{entry.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Party quick-view */}
          <div>
            <div className="sec-title">PARTY</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {party.map(function(d,i){
                var inf2=DIGIMON_MAP[d.speciesId];
                return (
                  <div key={d.uid} className="digi-card" style={{ display:"flex",alignItems:"center",gap:10,borderColor:i===0?accent:T.border }}
                    draggable onDragStart={function(){dragIdx.current=i;}} onDrop={function(){if(dragIdx.current!==null&&dragIdx.current!==i){setParty(function(p){var a=p.slice();var tmp=a[dragIdx.current];a[dragIdx.current]=a[i];a[i]=tmp;return a;});}dragIdx.current=null;}} onDragOver={function(e){e.preventDefault();}}>
                    <DigiSprite digimonId={d.speciesId} size={32} animate={false}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:800 }}>{d.name}</div>
                      <div className="px8" style={{ color:T.textMid,fontSize:"5px",marginTop:2 }}>Lv.{d.level} · {inf2&&inf2.stage}</div>
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

// ── TasksPage ─────────────────────────────────────────────────────────────────
function TasksPage({ tasks, onComplete, onAdd, onEdit, onDelete, accent, streak, T }) {
  var [filterCat,  setFilterCat]  = useState("All");
  var [filterType, setFilterType] = useState("All");
  var [showAdd,    setShowAdd]    = useState(false);
  var [editId,     setEditId]     = useState(null);
  var [form, setForm] = useState({ title:"",category:"Work",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[] });

  function reset(){ setForm({title:"",category:"Work",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[]}); }
  function submitAdd(){ if(!form.title.trim())return; onAdd(form); reset(); setShowAdd(false); }
  function submitEdit(){ if(!editId||!form.title.trim())return; onEdit(editId,form); setEditId(null); reset(); }
  function startEdit(t){ setEditId(t.id); setForm({title:t.title,category:t.category,priority:t.priority,difficulty:t.difficulty,type:t.type,notes:t.notes||"",daysOfWeek:t.daysOfWeek||[]}); }

  var typeColor = {once:T.lavender,daily:T.teal,recurring:T.mint};
  var visible   = tasks.filter(function(t){ return (filterCat==="All"||t.category===filterCat)&&(filterType==="All"||t.type===filterType); });

  var inputSt = { background:T.bgPanel,border:"2px solid "+T.border,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",width:"100%",fontFamily:"'Nunito',sans-serif" };
  var selSt   = Object.assign({},inputSt,{cursor:"pointer"});

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {/* Category filters */}
      <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,width:"fit-content",flexWrap:"wrap" }}>
        {["All"].concat(CATEGORIES).map(function(c){
          var a=filterCat===c;
          return <button key={c} className="task-tab" style={{ background:a?T.bg:T.bgCard,color:a?accent:T.textMid,borderRight:"2px solid "+T.border }} onClick={function(){setFilterCat(c);}}>{c.toUpperCase()}</button>;
        })}
      </div>
      <div style={{ display:"flex",gap:0,border:"2px solid "+T.border,boxShadow:"2px 2px 0 "+T.border,width:"fit-content" }}>
        {["All","once","daily","recurring"].map(function(t){
          var a=filterType===t;
          return <button key={t} className="task-tab" style={{ background:a?T.bg:T.bgCard,color:a?accent:T.textMid,borderRight:"2px solid "+T.border }} onClick={function(){setFilterType(t);}}>{t==="once"?"ONE-TIME":t.toUpperCase()}</button>;
        })}
      </div>

      {showAdd&&!editId&&<TaskForm form={form} setForm={setForm} onSubmit={submitAdd} onCancel={function(){setShowAdd(false);reset();}} label="ADD TASK" accent={accent} T={T}/>}
      {!showAdd&&!editId&&(
        <button className="px8" style={{ padding:"11px 18px",background:T.coral,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,color:"white",cursor:"pointer",textAlign:"left",fontSize:"7px" }} onClick={function(){setShowAdd(true);}}>+ NEW TASK</button>
      )}

      {visible.length===0&&<div className="pcard" style={{ padding:40,textAlign:"center",color:T.textMid }}>No tasks found.</div>}

      {visible.map(function(t){
        var xp=calcXpReward(t,streak); var sp=calcStatReward(t);
        var stars=t.difficulty==="Hard"?3:t.difficulty==="Medium"?2:1;
        return (
          <div key={t.id}>
            {editId===t.id
              ? <TaskForm form={form} setForm={setForm} onSubmit={submitEdit} onCancel={function(){setEditId(null);reset();}} label="SAVE" accent={accent} T={T}/>
              : (
                <div className={"task-card tc-"+(t.priority||"low").toLowerCase()+(t.done?" done":"")} style={{ borderColor:T.border }}>
                  <div className={"task-check"+(t.done?" checked":"")} onClick={function(){if(!t.done)onComplete(t.id);}}>
                    {t.done&&<span style={{ fontSize:13,fontWeight:900,color:"white",lineHeight:1 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:800,textDecoration:t.done?"line-through":"none" }}>{t.title}</div>
                    {t.notes&&<div style={{ fontSize:11,color:T.textMid,marginTop:2 }}>{t.notes}</div>}
                    <div style={{ display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center" }}>
                      <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+T.border,color:T.textMid,background:T.bgPanel,fontSize:"6px" }}>{t.category.toUpperCase()}</span>
                      <span className="px8" style={{ padding:"2px 6px",background:T.bgPanel,border:"1.5px solid "+(typeColor[t.type]||T.border),color:typeColor[t.type]||T.textMid,fontSize:"6px" }}>{t.type==="once"?"ONE-TIME":t.type.toUpperCase()}</span>
                      <span className="px8" style={{ padding:"2px 6px",background:"#1a1500",border:"1.5px solid "+T.gold,color:T.gold,fontSize:"6px" }}>+{xp} XP</span>
                      <span className="px8" style={{ padding:"2px 6px",border:"1.5px solid "+(PCOL[t.priority]||T.border),color:PCOL[t.priority]||T.text,background:T.bgPanel,fontSize:"6px" }}>{t.priority.toUpperCase()}</span>
                      {(t.streak||0)>0&&<span className="px8" style={{ color:T.coral,fontSize:"6px" }}>🔥 {t.streak}D</span>}
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

function TaskForm({ form, setForm, onSubmit, onCancel, label, accent, T }) {
  var inputSt = { background:T.bgPanel,border:"2px solid "+T.border,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",width:"100%",fontFamily:"'Nunito',sans-serif",boxSizing:"border-box" };
  var selSt   = Object.assign({},inputSt,{cursor:"pointer"});
  return (
    <div style={{ background:T.bgCard,border:"2px solid "+accent,boxShadow:"3px 3px 0 "+accent,padding:16,display:"flex",flexDirection:"column",gap:10 }}>
      <input value={form.title} onChange={function(e){setForm(function(f){return Object.assign({},f,{title:e.target.value});});}} onKeyDown={function(e){if(e.key==="Enter")onSubmit();}} placeholder="Task title..." autoFocus style={inputSt}/>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <select value={form.type}       onChange={function(e){setForm(function(f){return Object.assign({},f,{type:e.target.value});});}}       style={Object.assign({},selSt,{flex:1,minWidth:100})}>
          <option value="once">Data-Hunt</option><option value="daily">Daily-Protocol</option><option value="recurring">Loop-Protocols</option>
        </select>
        <select value={form.category}   onChange={function(e){setForm(function(f){return Object.assign({},f,{category:e.target.value});});}}   style={Object.assign({},selSt,{flex:1,minWidth:100})}>
          {CATEGORIES.map(function(c){return <option key={c}>{c}</option>;})}
        </select>
        <select value={form.priority}   onChange={function(e){setForm(function(f){return Object.assign({},f,{priority:e.target.value});});}}   style={Object.assign({},selSt,{flex:1,minWidth:80,color:PCOL[form.priority]||T.text})}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <select value={form.difficulty} onChange={function(e){setForm(function(f){return Object.assign({},f,{difficulty:e.target.value});});}} style={Object.assign({},selSt,{flex:1,minWidth:80})}>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>
      {form.type==="recurring"&&(
        <div style={{ display:"flex",gap:4,flexWrap:"wrap",alignItems:"center" }}>
          <span className="px8" style={{ color:T.textMid,fontSize:"7px" }}>DAYS:</span>
          {DAYS_OF_WEEK.map(function(d){
            var on=(form.daysOfWeek||[]).indexOf(d)>=0;
            return <button key={d} className="px8" style={{ padding:"4px 8px",border:"1.5px solid "+(on?accent:T.border),background:on?accent+"22":"transparent",color:on?accent:T.textDim,cursor:"pointer",fontSize:"6px" }} onClick={function(){setForm(function(f){var dw=f.daysOfWeek||[];return Object.assign({},f,{daysOfWeek:on?dw.filter(function(x){return x!==d;}):dw.concat([d])});});}}>{d}</button>;
          })}
        </div>
      )}
      <textarea value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});});}} placeholder="Notes (optional)..." rows={2} style={Object.assign({},inputSt,{resize:"vertical"})}/>
      <div style={{ display:"flex",gap:8 }}>
        <button className="px8" style={{ padding:"9px 18px",background:accent,border:"2px solid "+T.border,color:T.bg,cursor:"pointer",fontWeight:800,fontSize:"7px",boxShadow:"2px 2px 0 "+T.border }} onClick={onSubmit}>{label}</button>
        <button className="px8" style={{ padding:"9px 14px",background:"transparent",border:"2px solid "+T.border,color:T.textMid,cursor:"pointer",fontSize:"7px" }} onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

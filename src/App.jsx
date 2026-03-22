// ─── App.jsx — main entry, routes between pages ───────────────────────────────
// This is the slimmed-down App that imports from the correct files.
// The original digitask-full.jsx had everything in one file — this splits it out.

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

// ── Navigation ────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"Home",    icon:"⌂" },
  { id:"tasks",     label:"Tasks",   icon:"☑" },
  { id:"team",      label:"Team",    icon:"◈" },
  { id:"digifarm",  label:"Farm",    icon:"🌿" },
  { id:"battle",    label:"Battle",  icon:"⚔" },
  { id:"chat",      label:"Chat",    icon:"💬" },
  { id:"store",     label:"Store",   icon:"🛒" },
  { id:"digidex",   label:"Digidex", icon:"📖" },
];

const STORE_ITEMS = [
  { id:"stat_hp",   name:"+4 HP Bonus Stat",       cost:1000, icon:"❤️" },
  { id:"stat_atk",  name:"+4 ATK Bonus Stat",      cost:1000, icon:"⚔️" },
  { id:"stat_def",  name:"+4 DEF Bonus Stat",       cost:1000, icon:"🛡️" },
  { id:"stat_spd",  name:"+4 SPD Bonus Stat",       cost:1000, icon:"💨" },
  { id:"exp",       name:"EXP Booster (+500)",      cost:1000, icon:"⭐" },
  { id:"random",    name:"Random Digimon Discovery",cost:2000, icon:"🎲" },
  { id:"xab",       name:"X-Antibody",              cost:3000, icon:"✖️" },
  { id:"pers",      name:"Personality Changer",     cost:2000, icon:"🎭" },
];

function makeInitialParty() {
  var a = newDigimon("agumon",  { level:6, exp:340, abi:8,  bonusStats:{HP:4,SP:2,ATK:5,DEF:3,INT:1,SPD:3} });
  var b = newDigimon("gabumon", { level:4, exp:120, abi:5,  bonusStats:{HP:2,SP:1,ATK:3,DEF:4,INT:2,SPD:2} });
  var c = newDigimon("guilmon", { level:3, exp:60,  abi:3,  bonusStats:{HP:1,SP:0,ATK:2,DEF:1,INT:0,SPD:1} });
  return [a, b, c];
}

export default function App() {
  var [page,        setPage]        = useState("dashboard");
  var [party,       setParty]       = useState(makeInitialParty);
  var [farm,        setFarm]        = useState([]);
  var [savedStats,  setSavedStats]  = useState(0);
  var [bits,        setBits]        = useState(350);
  var [allDisc,     setAllDisc]     = useState(["koromon","agumon","gabumon","guilmon","greymon"]);
  var [tasks,       setTasks]       = useState([
    { id:1, title:"Review sprint backlog",  category:"Work",   priority:"High",   difficulty:"Medium", type:"once",      done:false, streak:0, notes:"" },
    { id:2, title:"Morning workout",         category:"Health", priority:"Medium", difficulty:"Hard",   type:"daily",     done:true,  streak:4, notes:"30 min min", daysOfWeek:[] },
    { id:3, title:"Read 20 pages",           category:"Study",  priority:"Low",    difficulty:"Easy",   type:"recurring", done:false, streak:1, notes:"",           daysOfWeek:["Mon","Wed","Fri"] },
    { id:4, title:"Fix login bug",           category:"Work",   priority:"High",   difficulty:"Hard",   type:"once",      done:false, streak:0, notes:"Affects mobile" },
    { id:5, title:"Meal prep",               category:"Health", priority:"Low",    difficulty:"Easy",   type:"daily",     done:false, streak:7, notes:"",           daysOfWeek:[] },
  ]);
  var [toast,       setToast]       = useState(null);
  var [evoAnim,     setEvoAnim]     = useState(null);
  var [battleState, setBattleState] = useState(null);
  var dragIdx = useRef(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  var activeDigi  = party[0];
  var activeInfo  = activeDigi ? DIGIMON_MAP[activeDigi.speciesId] : null;
  var streak      = tasks.reduce(function(m,t){ return Math.max(m,t.streak||0); }, 0);
  var accent      = activeInfo ? (ATTR_COLOR[activeInfo.attr]||"#7EB8F7") : "#7EB8F7";
  var pending     = tasks.filter(function(t){ return !t.done; });
  var done        = tasks.filter(function(t){ return  t.done; });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toast_(msg, color) {
    setToast({ msg:msg, color:color||"#7EF797" });
    setTimeout(function(){ setToast(null); }, 2500);
  }

  function completeTask(id) {
    var task = tasks.find(function(t){ return t.id===id; });
    if (!task||task.done) return;
    setTasks(function(ts){ return ts.map(function(t){ return t.id===id ? Object.assign({},t,{done:true,streak:(t.streak||0)+1}) : t; }); });
    var xp = calcXpReward(task, streak);
    var sp = calcStatReward(task);
    setParty(function(p){ return p.map(function(d,i){ var g=i===0?xp:Math.floor(xp*0.5); return Object.assign({},d,applyXpGain(d,g)); }); });
    setSavedStats(function(s){ return s+sp; });
    toast_("Task done!  +"+xp+" EXP  +"+sp+" stat pts");
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

  function addTask(t)    { setTasks(function(ts){ return ts.concat([Object.assign({id:Date.now(),done:false,streak:0},t)]); }); toast_("Task added!"); }
  function editTask(id,u){ setTasks(function(ts){ return ts.map(function(t){ return t.id===id?Object.assign({},t,u):t; }); }); }
  function deleteTask(id){ setTasks(function(ts){ return ts.filter(function(t){ return t.id!==id; }); }); toast_("Task deleted.","#FF8080"); }

  function startBattle(diff) {
    var candidates = Object.values(DIGIMON_MAP).filter(function(d){
      return diff==="Easy"   ? (d.stage==="Baby"||d.stage==="Rookie")
           : diff==="Medium" ? (d.stage==="Rookie"||d.stage==="Champion")
           :                   (d.stage==="Champion"||d.stage==="Ultimate");
    });
    var enemies = [0,1,2].map(function(){
      var id  = candidates[Math.floor(Math.random()*candidates.length)].id;
      var lvl = diff==="Easy"?Math.ceil(Math.random()*4):diff==="Medium"?4+Math.ceil(Math.random()*5):9+Math.ceil(Math.random()*6);
      var tmp = newDigimon(id,{level:lvl});
      var st  = calcStats(tmp);
      return Object.assign({},tmp,{currentHp:st.HP,maxHp:st.HP,isEnemy:true});
    });
    var playerTeam = party.slice(0,3).map(function(d){ var st=calcStats(d); return Object.assign({},d,{currentHp:st.HP,maxHp:st.HP}); });
    setBattleState({ playerTeam:playerTeam, enemyTeam:enemies, log:[], phase:"fight", selected:0, difficulty:diff });
    setPage("battle");
  }

  function battleAttack(targetIdx) {
    if (!battleState||battleState.phase!=="fight") return;
    var bs = JSON.parse(JSON.stringify(battleState));
    var att = bs.playerTeam[bs.selected];
    var def = bs.enemyTeam[targetIdx];
    if (!att||!def||def.currentHp<=0) return;
    var dmg = Math.max(1,Math.floor(calcStats(att).ATK*1.2 - calcStats(def).DEF*0.5 + Math.random()*20));
    def.currentHp = Math.max(0,def.currentHp-dmg);
    bs.log = [att.name+" → "+def.name+"  −"+dmg+" HP"].concat(bs.log).slice(0,6);
    var aliveE = bs.enemyTeam.filter(function(e){ return e.currentHp>0; });
    if (aliveE.length>0) {
      var en  = aliveE[Math.floor(Math.random()*aliveE.length)];
      var tgt = bs.playerTeam.filter(function(p){ return p.currentHp>0; })[0];
      if (tgt) {
        var edm = Math.max(1,Math.floor(calcStats(en).ATK - calcStats(tgt).DEF*0.4 + Math.random()*15));
        tgt.currentHp = Math.max(0,tgt.currentHp-edm);
        bs.log = [en.name+" → "+tgt.name+"  −"+edm+" HP"].concat(bs.log).slice(0,6);
      }
    }
    var won  = bs.enemyTeam.every(function(e){ return e.currentHp<=0; });
    var lost = bs.playerTeam.every(function(p){ return p.currentHp<=0; });
    if (won||lost) {
      var r = BATTLE_REWARDS[bs.difficulty]||(won?60:25);
      var bitsEarned = won?(r.win||60):(r.loss||25);
      setBits(function(b){ return b+bitsEarned; });
      bs.log = [(won?"Victory! ":"Defeated... ")+"+"+ bitsEarned+"🪙"].concat(bs.log);
      bs.phase = won?"won":"lost";
    }
    setBattleState(bs);
  }

  function buyItem(item) {
    if (bits<item.cost){ toast_("Not enough bits!","#FF8080"); return; }
    setBits(function(b){ return b-item.cost; });
    toast_("Purchased: "+item.name,"#FFD700");
  }

  // ── CSS variables derived from accent ─────────────────────────────────────
  var gridPattern = "repeating-linear-gradient(0deg,transparent,transparent 19px,"+accent+"0f 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,"+accent+"0f 20px)";

  return (
    <div style={{ minHeight:"100vh", background:"#080a12", color:"#fff", fontFamily:"'Segoe UI',sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
        select option { background:#0d0f1a; color:#fff; }
        textarea, input, select, button { font-family:inherit; }

        @keyframes slideUp   { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes evoIn     { 0%,100%{opacity:0;transform:scale(0.75)} 35%,65%{opacity:1;transform:scale(1)} }
        @keyframes xpPop     { 0%{opacity:1;transform:translate(-50%,0)} 100%{opacity:0;transform:translate(-50%,-36px)} }
        @keyframes pulse     { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .page-in  { animation: slideUp 0.22s ease; }

        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px;
        }
        .card-accent {
          background: linear-gradient(135deg,${accent}1a 0%,${accent}06 100%);
          border: 1px solid ${accent}44;
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .card-accent::before {
          content:'';
          position:absolute;
          inset:0;
          background-image: ${gridPattern};
          pointer-events:none;
        }
        .digi-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid ${accent}22;
          border-radius: 12px;
          padding: 12px;
          cursor: grab;
          transition: border-color 0.15s, background 0.15s;
        }
        .digi-card:hover {
          border-color: ${accent}66;
          background: ${accent}0f;
        }
        .task-row {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 14px;
          transition: border-color 0.15s;
        }
        .task-row:hover { border-color: rgba(255,255,255,0.15); }

        .battle-enemy {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,80,80,0.2);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .battle-enemy:hover { border-color: rgba(255,80,80,0.6); background: rgba(255,50,50,0.08); }

        .battle-player {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .battle-player.active { border-color: ${accent}88; background: ${accent}10; }

        .nav-btn {
          flex: 1;
          min-width: 56px;
          padding: 10px 0 14px;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          transition: color 0.15s;
          border-top: 2px solid transparent;
        }
        .nav-btn.active {
          color: ${accent} !important;
          border-top-color: ${accent};
        }

        .stat-chip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
        }
        .store-row {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color 0.15s;
        }
        .store-row:hover { border-color: ${accent}55; }
      `}</style>

      {/* ── EVOLUTION OVERLAY ───────────────────────────────────────────── */}
      {evoAnim && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"evoIn 3.2s ease" }}>
          <div style={{ fontSize:56,marginBottom:20 }}>✨</div>
          <DigiSprite digimonId={evoAnim} size={128} mood="happy"/>
          <div style={{ marginTop:24,fontSize:11,color:accent,letterSpacing:5,fontWeight:700 }}>DIGIVOLUTION</div>
          <div style={{ marginTop:8,fontSize:26,fontWeight:900,color:"#fff" }}>
            {DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].name}
          </div>
          <div style={{ marginTop:6,fontSize:12,color:"rgba(255,255,255,0.4)" }}>
            {DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].stage}
          </div>
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:"#0d1020",border:"1px solid "+toast.color+"44",borderRadius:22,padding:"10px 20px",fontSize:13,color:toast.color,zIndex:200,whiteSpace:"nowrap",boxShadow:"0 6px 24px "+toast.color+"22",animation:"slideUp 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{ position:"sticky",top:0,background:"rgba(8,10,18,0.96)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.07)",zIndex:100,padding:"10px 16px",display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {activeDigi && <DigiSprite digimonId={activeDigi.speciesId} size={28} animate={false}/>}
          <span style={{ fontWeight:900,fontSize:18,letterSpacing:-0.5 }}>
            Daily<span style={{ color:accent }}>Digivolve</span>
          </span>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex",gap:14,alignItems:"center",fontSize:12 }}>
          <span style={{ color:"#FFD700",fontWeight:700 }}>🪙 {bits}</span>
          <span style={{ color:"rgba(255,255,255,0.4)" }}>🔥 {streak}d</span>
          <span style={{ color:accent }}>◈ {party.length}/{MAX_PARTY_SIZE}</span>
        </div>
      </div>

      {/* ── PAGE CONTENT ────────────────────────────────────────────────── */}
      <div style={{ maxWidth:800,margin:"0 auto",padding:"20px 14px 96px" }}>
        <div key={page} className="page-in">

          {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
          {page==="dashboard" && activeDigi && activeInfo && (function(){
            var st = calcStats(activeDigi);
            var persObj = PERSONALITIES.find(function(p){ return p.id===activeDigi.personality; });
            var urgentTasks = pending.filter(function(t){ return t.priority==="High"||t.priority==="Urgent"; });
            return (
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>

                {/* Hero card */}
                <div className="card-accent">
                  <div style={{ display:"flex",gap:20,alignItems:"center",position:"relative" }}>
                    <div style={{ position:"relative" }}>
                      <DigiSprite digimonId={activeDigi.speciesId} size={100} mood="happy"/>
                      <div style={{ position:"absolute",bottom:-4,left:"50%",transform:"translateX(-50%)",background:"#0d1020",borderRadius:10,padding:"2px 8px",fontSize:9,color:accent,fontWeight:700,whiteSpace:"nowrap",border:"1px solid "+accent+"44" }}>
                        LV {activeDigi.level}
                      </div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6 }}>
                        <span style={{ fontSize:20,fontWeight:900 }}>{activeDigi.name}</span>
                        <Tag color={STAGE_COLOR[activeInfo.stage]||"#aaa"}>{activeInfo.stage}</Tag>
                        <Tag color={ATTR_COLOR[activeInfo.attr]||"#aaa"}>{activeInfo.attr}</Tag>
                        {activeDigi.isXForm&&<Tag color="#FFD700">X</Tag>}
                      </div>
                      <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:12 }}>
                        {persObj&&persObj.label} personality · ABI {activeDigi.abi} · {done.length}/{tasks.length} done today
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                        <div>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                            <span style={{ fontSize:9,color:"rgba(255,255,255,0.35)" }}>EXP</span>
                            <span style={{ fontSize:9,color:accent }}>{activeDigi.exp} / {activeDigi.expNeeded}</span>
                          </div>
                          <Bar value={activeDigi.exp} max={activeDigi.expNeeded} color={accent} h={6}/>
                        </div>
                        <div>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                            <span style={{ fontSize:9,color:"rgba(255,255,255,0.35)" }}>Bonus stats</span>
                            <span style={{ fontSize:9,color:"#FFD700" }}>{totalBonusStats(activeDigi)} / {Math.floor(abiCap(activeDigi))}</span>
                          </div>
                          <Bar value={totalBonusStats(activeDigi)} max={Math.floor(abiCap(activeDigi))} color="#FFD700" h={6}/>
                        </div>
                      </div>
                      {savedStats>0&&(
                        <div style={{ marginTop:10,background:"rgba(255,215,0,0.12)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:8,padding:"6px 12px",fontSize:11,color:"#FFD700" }}>
                          ⭐ {savedStats} unallocated stat points — go to Team to assign
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stat grid */}
                <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8 }}>
                  {[["HP",st.HP,"#7EF797"],["SP",st.SP,"#5BA4CF"],["ATK",st.ATK,"#FF6B35"],["DEF",st.DEF,"#7EB8F7"],["INT",st.INT,"#B8A0E8"],["SPD",st.SPD,"#FFD700"]].map(function(s){
                    return (
                      <div key={s[0]} className="stat-chip">
                        <div style={{ fontSize:16,fontWeight:900,color:s[2] }}>{s[1]}</div>
                        <div style={{ fontSize:8,color:"rgba(255,255,255,0.35)",marginTop:2 }}>{s[0]}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary row */}
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
                  {[
                    { label:"Pending", value:pending.length,  color:"#FFB3C6", icon:"⏳" },
                    { label:"Done",    value:done.length,      color:"#7EF797", icon:"✓"  },
                    { label:"Streak",  value:streak+"d",       color:"#FFD700", icon:"🔥" },
                    { label:"Bits",    value:bits,             color:accent,    icon:"🪙" },
                  ].map(function(s){
                    return (
                      <div key={s.label} className="card" style={{ textAlign:"center",padding:"14px 8px" }}>
                        <div style={{ fontSize:20,marginBottom:4 }}>{s.icon}</div>
                        <div style={{ fontSize:20,fontWeight:900,color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:9,color:"rgba(255,255,255,0.35)" }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Urgent tasks */}
                {urgentTasks.length>0&&(
                  <div style={{ background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.25)",borderRadius:14,padding:16 }}>
                    <div style={{ fontSize:11,color:"#FF8080",fontWeight:700,marginBottom:10 }}>⚡ URGENT / HIGH PRIORITY</div>
                    {urgentTasks.map(function(t){
                      return (
                        <div key={t.id} style={{ display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                          <button onClick={function(){ completeTask(t.id); }} style={{ width:20,height:20,borderRadius:5,border:"2px solid rgba(255,100,100,0.5)",background:"transparent",cursor:"pointer",flexShrink:0 }}/>
                          <span style={{ flex:1,fontSize:13 }}>{t.title}</span>
                          <Tag color={PRIORITY_COLORS[t.priority]||"#aaa"}>{t.priority}</Tag>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Today's tasks */}
                <div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                    <span style={{ fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:1 }}>TODAY'S TASKS</span>
                    <button onClick={function(){ setPage("tasks"); }} style={{ background:"none",border:"none",color:accent,cursor:"pointer",fontSize:11 }}>View all →</button>
                  </div>
                  {pending.slice(0,4).map(function(t){
                    return (
                      <div key={t.id} className="task-row" style={{ display:"flex",gap:10,alignItems:"center",marginBottom:6,borderColor:PRIORITY_COLORS[t.priority]+"33" }}>
                        <button onClick={function(){ completeTask(t.id); }} style={{ width:20,height:20,borderRadius:5,border:"2px solid "+PRIORITY_COLORS[t.priority]+"88",background:"transparent",cursor:"pointer",flexShrink:0 }}/>
                        <span style={{ flex:1,fontSize:13 }}>{t.title}</span>
                        <Tag color={PRIORITY_COLORS[t.priority]||"#aaa"}>{t.priority}</Tag>
                        <span style={{ fontSize:9,color:"rgba(255,255,255,0.25)" }}>+{calcXpReward(t,streak)} XP</span>
                      </div>
                    );
                  })}
                </div>

                {/* Party strip */}
                <div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:1,marginBottom:10 }}>YOUR PARTY</div>
                  <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                    {party.map(function(d,i){
                      var inf2 = DIGIMON_MAP[d.speciesId];
                      return (
                        <div key={d.uid} className="digi-card" style={{ display:"flex",alignItems:"center",gap:10,minWidth:160 }}
                          draggable onDragStart={function(){ dragIdx.current=i; }} onDrop={function(){ if(dragIdx.current!==null&&dragIdx.current!==i){setParty(function(p){var a=p.slice();var tmp=a[dragIdx.current];a[dragIdx.current]=a[i];a[i]=tmp;return a;});} dragIdx.current=null; }} onDragOver={function(e){ e.preventDefault(); }}>
                          <DigiSprite digimonId={d.speciesId} size={38} animate={false}/>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12,fontWeight:700 }}>{d.name}</div>
                            <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>Lv.{d.level} · {inf2&&inf2.stage}</div>
                          </div>
                          {i===0&&<span style={{ fontSize:9,color:accent }}>★</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chat CTA */}
                <div style={{ background:"linear-gradient(135deg,rgba(126,184,247,0.1) 0%,rgba(184,160,232,0.1) 100%)",border:"1px solid rgba(126,184,247,0.2)",borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:14 }}>
                  <DigiSprite digimonId={activeDigi.speciesId} size={44} mood="happy"/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:700,marginBottom:3 }}>{activeDigi.name} wants to talk</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)" }}>AI-powered companion chat — responds based on your tasks</div>
                  </div>
                  <Btn small color={accent} onClick={function(){ setPage("chat"); }}>💬 Chat</Btn>
                </div>

              </div>
            );
          })()}

          {/* ══ TASKS ═══════════════════════════════════════════════════════ */}
          {page==="tasks"&&(
            <TasksPage tasks={tasks} onComplete={completeTask} onAdd={addTask} onEdit={editTask} onDelete={deleteTask} accent={accent} streak={streak}/>
          )}

          {/* ══ TEAM ════════════════════════════════════════════════════════ */}
          {page==="team"&&(
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>Team Manager</span>
                <Tag color={accent}>{party.length}/{MAX_PARTY_SIZE} active</Tag>
              </div>

              {savedStats>0&&(
                <div style={{ background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:14,padding:16 }}>
                  <div style={{ fontSize:12,color:"#FFD700",fontWeight:700,marginBottom:10 }}>⭐ {savedStats} stat points to allocate to active Digimon</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {["HP","SP","ATK","DEF","INT","SPD"].map(function(stat){
                      return (
                        <Btn key={stat} small color="#FFD700" onClick={function(){
                          if (savedStats<=0) return;
                          setParty(function(p){ return p.map(function(d,i){
                            if (i!==0) return d;
                            if (totalBonusStats(d)>=abiCap(d)){ toast_("ABI cap reached!","#FF8080"); return d; }
                            var nb=Object.assign({},d.bonusStats); nb[stat]=(nb[stat]||0)+1;
                            return Object.assign({},d,{bonusStats:nb});
                          }); });
                          setSavedStats(function(s){ return s-1; });
                        }}>+{stat}</Btn>
                      );
                    })}
                  </div>
                </div>
              )}

              {party.map(function(digi,i){
                var inf2 = DIGIMON_MAP[digi.speciesId];
                var st2  = calcStats(digi);
                var evoT = (inf2&&inf2.evolvesTo||[]).filter(function(id){ var t=DIGIMON_MAP[id]; return t&&!t.fusionOf&&digi.level>=10; });
                return (
                  <div key={digi.uid} className="card" style={{ borderColor:i===0?accent+"44":"rgba(255,255,255,0.08)" }}>
                    <div style={{ display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap" }}>
                      <div style={{ position:"relative" }}>
                        <DigiSprite digimonId={digi.speciesId} size={80} mood="happy"/>
                        {i===0&&<div style={{ position:"absolute",top:-6,right:-6,background:accent,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#0d0f1a",fontWeight:900 }}>★</div>}
                      </div>
                      <div style={{ flex:1,minWidth:180 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                          <span style={{ fontSize:15,fontWeight:800 }}>{digi.name}</span>
                          <Tag color={STAGE_COLOR[inf2&&inf2.stage]||"#aaa"}>{inf2&&inf2.stage}</Tag>
                          <Tag color={ATTR_COLOR[inf2&&inf2.attr]||"#aaa"}>{inf2&&inf2.attr}</Tag>
                          {digi.isXForm&&<Tag color="#FFD700">X</Tag>}
                        </div>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10 }}>
                          Lv.{digi.level} · ABI {digi.abi} · {PERSONALITIES.find(function(p){return p.id===digi.personality;})&&PERSONALITIES.find(function(p){return p.id===digi.personality;}).label}
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10 }}>
                          {[["HP",st2.HP,"#7EF797"],["ATK",st2.ATK,"#FF6B35"],["DEF",st2.DEF,"#7EB8F7"],["SP",st2.SP,"#5BA4CF"],["INT",st2.INT,"#B8A0E8"],["SPD",st2.SPD,"#FFD700"]].map(function(s){
                            var bonus=(digi.bonusStats[s[0]]||0);
                            return (
                              <div key={s[0]} style={{ fontSize:11,color:"rgba(255,255,255,0.5)" }}>
                                <span style={{ color:"#fff",fontWeight:700 }}>{s[1]}</span> {s[0]}
                                {bonus>0&&<span style={{ color:"#FFD700",fontSize:9 }}> +{bonus}</span>}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                            <span style={{ fontSize:9,color:"rgba(255,255,255,0.35)" }}>EXP</span>
                            <span style={{ fontSize:9,color:accent }}>{digi.exp}/{digi.expNeeded}</span>
                          </div>
                          <Bar value={digi.exp} max={digi.expNeeded} color={accent} h={5}/>
                        </div>
                        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                          {evoT.map(function(tid){
                            return <Btn key={tid} small color="#FFD700" onClick={function(){ evolve(digi.uid,tid); }}>→ {DIGIMON_MAP[tid]&&DIGIMON_MAP[tid].name}</Btn>;
                          })}
                          {party.length>1&&<Btn small outline color="rgba(255,255,255,0.3)" onClick={function(){ sendToFarm(digi.uid); }}>→ Farm</Btn>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ DIGIFARM ════════════════════════════════════════════════════ */}
          {page==="digifarm"&&(
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>DigiFarm</span>
                <Tag color="#7EF797">{farm.length} stored</Tag>
              </div>
              {farm.length===0
                ? <div className="card" style={{ textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)" }}>No Digimon in the farm yet.<br/>Send party members here to store them.</div>
                : farm.map(function(d){
                  var inf3=DIGIMON_MAP[d.speciesId];
                  return (
                    <div key={d.uid} className="card" style={{ display:"flex",alignItems:"center",gap:14 }}>
                      <DigiSprite digimonId={d.speciesId} size={56} animate={false}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:14 }}>{d.name}</div>
                        <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2 }}>Lv.{d.level} · {inf3&&inf3.stage} · ABI {d.abi}</div>
                      </div>
                      <Btn small color={accent} onClick={function(){ recallFromFarm(d.uid); }}>Recall</Btn>
                    </div>
                  );
                })
              }
              {/* Playground */}
              {farm.length>0&&(
                <div style={{ background:"rgba(126,184,247,0.06)",border:"1px solid rgba(126,184,247,0.2)",borderRadius:14,padding:16,marginTop:4 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"#7EB8F7",marginBottom:10 }}>Playground Mode</div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    {farm.slice(0,5).map(function(d){
                      return (
                        <div key={d.uid} style={{ textAlign:"center",cursor:"pointer" }} onClick={function(){ toast_(d.name+" plays happily! 🎉","#FFD700"); }}>
                          <DigiSprite digimonId={d.speciesId} size={48} mood="happy"/>
                          <div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:4 }}>{d.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ BATTLE ══════════════════════════════════════════════════════ */}
          {page==="battle"&&(
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <span style={{ fontSize:16,fontWeight:800 }}>Battle Arena</span>

              {!battleState ? (
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                    {["Easy","Medium","Hard"].map(function(diff){
                      var r=BATTLE_REWARDS[diff]||{win:60,loss:25};
                      var c=diff==="Easy"?"#7EF797":diff==="Medium"?"#FFB34D":"#FF8080";
                      return (
                        <div key={diff} className="card" style={{ textAlign:"center",cursor:"pointer",borderColor:c+"33",padding:20 }} onClick={function(){ startBattle(diff); }}>
                          <div style={{ fontSize:15,fontWeight:900,color:c,marginBottom:6 }}>{diff}</div>
                          <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>Win {r.win}🪙</div>
                          <div style={{ fontSize:10,color:"rgba(255,255,255,0.25)" }}>Loss {r.loss}🪙</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : battleState.phase==="fight" ? (
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:1 }}>ENEMY TEAM — tap to attack</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                    {battleState.enemyTeam.map(function(e,i){
                      return (
                        <div key={i} className="battle-enemy" style={{ opacity:e.currentHp<=0?0.3:1 }} onClick={function(){ battleAttack(i); }}>
                          <DigiSprite digimonId={e.speciesId} size={52} mood={e.currentHp<=0?"sad":"angry"} animate={e.currentHp>0}/>
                          <div style={{ fontSize:11,fontWeight:700,marginTop:6,marginBottom:4 }}>{e.name}</div>
                          <Bar value={e.currentHp} max={e.maxHp} color="#FF4444" h={4}/>
                          <div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:2 }}>{e.currentHp}/{e.maxHp}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:1 }}>YOUR TEAM — select attacker</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                    {battleState.playerTeam.map(function(p,i){
                      var isActive=battleState.selected===i;
                      return (
                        <div key={i} className={"battle-player"+(isActive?" active":"")} style={{ opacity:p.currentHp<=0?0.3:1 }} onClick={function(){ setBattleState(function(bs){ return Object.assign({},bs,{selected:i}); }); }}>
                          <DigiSprite digimonId={p.speciesId} size={52} mood={p.currentHp<=0?"sad":isActive?"happy":"stoic"} animate={isActive&&p.currentHp>0}/>
                          <div style={{ fontSize:11,fontWeight:700,marginTop:6,marginBottom:4 }}>{p.name}</div>
                          <Bar value={p.currentHp} max={p.maxHp} color="#7EF797" h={4}/>
                          <div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:2 }}>{p.currentHp}/{p.maxHp}</div>
                          {isActive&&<div style={{ fontSize:9,color:accent,marginTop:4 }}>★ Attacker</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="card" style={{ maxHeight:160,overflowY:"auto" }}>
                    {battleState.log.length===0
                      ? <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)" }}>Tap an enemy to attack</div>
                      : battleState.log.map(function(l,i){ return <div key={i} style={{ fontSize:12,color:i===0?"#fff":"rgba(255,255,255,0.4)",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>{l}</div>; })
                    }
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign:"center",padding:40 }}>
                  <div style={{ fontSize:40,marginBottom:12 }}>{battleState.phase==="won"?"🏆":"💀"}</div>
                  <div style={{ fontSize:20,fontWeight:900,color:battleState.phase==="won"?"#7EF797":"#FF8080",marginBottom:6 }}>{battleState.phase==="won"?"Victory!":"Defeated"}</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:20 }}>{battleState.log[0]}</div>
                  <Btn color={accent} onClick={function(){ setBattleState(null); }}>Return to Arena</Btn>
                </div>
              )}
            </div>
          )}

          {/* ══ CHAT ════════════════════════════════════════════════════════ */}
          {page==="chat"&&activeDigi&&(
            <ChatPage
              digimon={Object.assign({},activeDigi,{ stage:activeInfo?activeInfo.stage:"Rookie", streak:streak, hp:75 })}
              tasks={tasks}
            />
          )}

          {/* ══ STORE ═══════════════════════════════════════════════════════ */}
          {page==="store"&&(
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>Neemon's Shop</span>
                <Tag color="#FFD700">🪙 {bits} bits</Tag>
              </div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:4 }}>Earn bits by winning Arena battles. Higher difficulty = more bits.</div>
              {STORE_ITEMS.map(function(item){
                return (
                  <div key={item.id} className="store-row">
                    <span style={{ fontSize:26,flexShrink:0 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:700 }}>{item.name}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:2 }}>One-time use</div>
                    </div>
                    <Btn small color={bits>=item.cost?"#FFD700":"rgba(255,255,255,0.2)"} disabled={bits<item.cost} onClick={function(){ buyItem(item); }}>
                      {item.cost}🪙
                    </Btn>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ DIGIDEX ═════════════════════════════════════════════════════ */}
          {page==="digidex"&&(
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>Digidex</span>
                <Tag color={accent}>{allDisc.length}/{Object.keys(DIGIMON_MAP).length} discovered</Tag>
              </div>
              <div style={{ marginBottom:4 }}>
                <Bar value={allDisc.length} max={Object.keys(DIGIMON_MAP).length} color={accent} h={6}/>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10 }}>
                {Object.values(DIGIMON_MAP).map(function(d){
                  var known = allDisc.indexOf(d.id)>=0;
                  return (
                    <div key={d.id} className="card" style={{ textAlign:"center",opacity:known?1:0.3,padding:14 }}>
                      {known
                        ? <DigiSprite digimonId={d.id} size={52} animate={false}/>
                        : <div style={{ width:52,height:52,margin:"0 auto",background:"rgba(255,255,255,0.05)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"rgba(255,255,255,0.2)" }}>?</div>
                      }
                      <div style={{ fontSize:11,fontWeight:700,marginTop:8 }}>{known?d.name:"???"}</div>
                      {known&&(
                        <div style={{ display:"flex",justifyContent:"center",gap:4,marginTop:6,flexWrap:"wrap" }}>
                          <Tag color={STAGE_COLOR[d.stage]||"#aaa"}>{d.stage}</Tag>
                          {d.isX&&<Tag color="#FFD700">X</Tag>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"rgba(8,10,18,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",overflowX:"auto",zIndex:100 }}>
        {NAV.map(function(n){
          var isActive = page===n.id;
          return (
            <button key={n.id} onClick={function(){ setPage(n.id); }} className={"nav-btn"+(isActive?" active":"")}
              style={{ color:isActive?accent:"rgba(255,255,255,0.3)" }}>
              <span style={{ fontSize:18 }}>{n.icon}</span>
              <span style={{ fontSize:8 }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── TasksPage ─────────────────────────────────────────────────────────────────
function TasksPage({ tasks, onComplete, onAdd, onEdit, onDelete, accent, streak }) {
  var [filterCat, setFilterCat] = useState("All");
  var [filterType,setFilterType]= useState("All");
  var [showAdd,   setShowAdd]   = useState(false);
  var [editId,    setEditId]    = useState(null);
  var [form, setForm] = useState({ title:"",category:"Work",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[] });

  function reset(){ setForm({title:"",category:"Work",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[]}); }
  function submitAdd(){ if(!form.title.trim())return; onAdd(form); reset(); setShowAdd(false); }
  function submitEdit(){ if(!editId||!form.title.trim())return; onEdit(editId,form); setEditId(null); reset(); }
  function startEdit(t){ setEditId(t.id); setForm({title:t.title,category:t.category,priority:t.priority,difficulty:t.difficulty,type:t.type,notes:t.notes||"",daysOfWeek:t.daysOfWeek||[]}); }

  var priColor  = {Low:"#7EB8F7",Medium:"#FFD700",High:"#FF9940",Urgent:"#FF4444"};
  var diffColor = {Easy:"#7EF797",Medium:"#FFD700",Hard:"#FF8080"};
  var typeColor = {once:"#B8A0E8",daily:"#7EB8F7",recurring:"#7EF797"};

  var visible = tasks.filter(function(t){
    return (filterCat==="All"||t.category===filterCat) && (filterType==="All"||t.type===filterType);
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

      {/* Category filters */}
      <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
        {["All"].concat(CATEGORIES).map(function(c){
          var a=filterCat===c;
          return <button key={c} onClick={function(){setFilterCat(c);}} style={{ padding:"4px 12px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontSize:10,background:a?accent:"rgba(255,255,255,0.04)",color:a?"#0d0f1a":"rgba(255,255,255,0.5)",fontWeight:a?700:400 }}>{c}</button>;
        })}
      </div>

      {/* Type filters */}
      <div style={{ display:"flex",gap:4 }}>
        {["All","once","daily","recurring"].map(function(t){
          var a=filterType===t; var col=typeColor[t]||accent;
          return <button key={t} onClick={function(){setFilterType(t);}} style={{ padding:"4px 12px",borderRadius:20,border:"1px solid "+(t!=="All"?col+"44":"rgba(255,255,255,0.1)"),cursor:"pointer",fontSize:10,background:a?col:"rgba(255,255,255,0.04)",color:a?"#0d0f1a":(col||"rgba(255,255,255,0.5)"),fontWeight:a?700:400 }}>{t==="once"?"One-Time":t.charAt(0).toUpperCase()+t.slice(1)}</button>;
        })}
      </div>

      {/* Add form */}
      {showAdd&&!editId&&<TaskForm form={form} setForm={setForm} onSubmit={submitAdd} onCancel={function(){setShowAdd(false);reset();}} label="Add Task" accent={accent}/>}

      {/* Add button */}
      {!showAdd&&!editId&&(
        <button onClick={function(){setShowAdd(true);}} style={{ background:accent+"15",border:"1.5px dashed "+accent+"55",borderRadius:12,padding:"12px 20px",color:accent,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left" }}>
          + New Task
        </button>
      )}

      {visible.length===0&&<div style={{ textAlign:"center",padding:40,color:"rgba(255,255,255,0.25)",fontSize:13 }}>No tasks found.</div>}

      {visible.map(function(t){
        var xp = calcXpReward(t, streak);
        var sp = calcStatReward(t);
        return (
          <div key={t.id}>
            {editId===t.id
              ? <TaskForm form={form} setForm={setForm} onSubmit={submitEdit} onCancel={function(){setEditId(null);reset();}} label="Save" accent={accent}/>
              : (
                <div className="task-row" style={{ display:"flex",alignItems:"flex-start",gap:10,borderColor:t.done?"rgba(255,255,255,0.04)":priColor[t.priority]+"33",opacity:t.done?0.5:1 }}>
                  <button onClick={function(){if(!t.done)onComplete(t.id);}} style={{ width:22,height:22,borderRadius:6,flexShrink:0,cursor:t.done?"default":"pointer",border:"2px solid "+(t.done?"#7EF797":priColor[t.priority]||"#7EB8F7"),background:t.done?"#7EF797":"transparent",color:"#0d0f1a",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1 }}>{t.done?"✓":""}</button>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,textDecoration:t.done?"line-through":"none" }}>{t.title}</div>
                    {t.notes&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{t.notes}</div>}
                    <div style={{ display:"flex",gap:5,marginTop:6,flexWrap:"wrap" }}>
                      <Tag color={typeColor[t.type]||"#aaa"}>{t.type==="once"?"One-Time":t.type}</Tag>
                      <Tag color="rgba(255,255,255,0.2)">{t.category}</Tag>
                      <Tag color={priColor[t.priority]||"#aaa"}>{t.priority}</Tag>
                      <Tag color={diffColor[t.difficulty]||"#aaa"}>{t.difficulty}</Tag>
                      {(t.streak||0)>0&&<Tag color="#FFD700">🔥 {t.streak}d</Tag>}
                      {t.daysOfWeek&&t.daysOfWeek.length>0&&<Tag color="#B8A0E8">{t.daysOfWeek.join(" ")}</Tag>}
                    </div>
                    <div style={{ fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:4 }}>+{xp} EXP · +{sp} stat pts</div>
                  </div>
                  <div style={{ display:"flex",gap:2,flexShrink:0 }}>
                    <button onClick={function(){startEdit(t);}} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:14,padding:"2px 6px" }}>✏</button>
                    <button onClick={function(){onDelete(t.id);}} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:18,padding:"2px 4px",lineHeight:1 }}>×</button>
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

function TaskForm({ form, setForm, onSubmit, onCancel, label, accent }) {
  var priColor  = {Low:"#7EB8F7",Medium:"#FFD700",High:"#FF9940"};
  var diffColor = {Easy:"#7EF797",Medium:"#FFD700",Hard:"#FF8080"};
  var sel = { background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"7px 10px",color:"#fff",fontSize:12,cursor:"pointer",outline:"none" };
  return (
    <div style={{ background:accent+"0f",border:"1px solid "+accent+"44",borderRadius:14,padding:18,display:"flex",flexDirection:"column",gap:10 }}>
      <input value={form.title} onChange={function(e){setForm(function(f){return Object.assign({},f,{title:e.target.value});});}} onKeyDown={function(e){if(e.key==="Enter")onSubmit();}} placeholder="Task title..." autoFocus style={{ background:"rgba(0,0,0,0.25)",border:"1px solid "+accent+"55",borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:14,outline:"none",width:"100%" }}/>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <select value={form.type} onChange={function(e){setForm(function(f){return Object.assign({},f,{type:e.target.value});});}} style={sel}>
          <option value="once">One-Time</option><option value="daily">Daily</option><option value="recurring">Recurring</option>
        </select>
        <select value={form.category} onChange={function(e){setForm(function(f){return Object.assign({},f,{category:e.target.value});});}} style={sel}>
          {CATEGORIES.map(function(c){return <option key={c}>{c}</option>;})}
        </select>
        <select value={form.priority} onChange={function(e){setForm(function(f){return Object.assign({},f,{priority:e.target.value});});}} style={Object.assign({},sel,{color:priColor[form.priority]||"#fff"})}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <select value={form.difficulty} onChange={function(e){setForm(function(f){return Object.assign({},f,{difficulty:e.target.value});});}} style={Object.assign({},sel,{color:diffColor[form.difficulty]||"#fff"})}>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>
      {form.type==="recurring"&&(
        <div style={{ display:"flex",gap:4,flexWrap:"wrap",alignItems:"center" }}>
          <span style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>Days:</span>
          {DAYS_OF_WEEK.map(function(d){
            var on=(form.daysOfWeek||[]).indexOf(d)>=0;
            return <button key={d} onClick={function(){setForm(function(f){var dw=f.daysOfWeek||[];return Object.assign({},f,{daysOfWeek:on?dw.filter(function(x){return x!==d;}):dw.concat([d])});});}} style={{ padding:"3px 8px",borderRadius:6,border:"1px solid "+(on?accent:"rgba(255,255,255,0.15)"),background:on?accent+"22":"transparent",color:on?accent:"rgba(255,255,255,0.4)",fontSize:10,cursor:"pointer" }}>{d}</button>;
          })}
        </div>
      )}
      <textarea value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});});}} placeholder="Notes (optional)..." rows={2} style={{ background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",color:"#fff",fontSize:12,outline:"none",resize:"vertical",width:"100%" }}/>
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={onSubmit} style={{ background:accent,border:"none",borderRadius:8,padding:"9px 20px",color:"#0d0f1a",fontWeight:800,cursor:"pointer",fontSize:13 }}>{label}</button>
        <button onClick={onCancel} style={{ background:"rgba(255,255,255,0.07)",border:"none",borderRadius:8,padding:"9px 16px",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12 }}>Cancel</button>
      </div>
    </div>
  );
}

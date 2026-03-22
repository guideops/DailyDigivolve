// ─── App.jsx — main entry, routes between pages ───────────────────────────────
// This is the slimmed-down App that imports from the correct files.
// The original digitask-full.jsx had everything in one file — this splits it out.

import { useState, useRef } from "react";
import DigiSprite from "./components/DigiSprite.jsx";
import { Bar, Tag, Btn } from "./components/ui.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { DIGIMON_MAP, STARTERS } from "./data/digimon.js";
import {
  PERSONALITIES, STAGE_COLOR, TYPE_COLOR, ATTR_COLOR,
  PRIORITY_COLORS, CATEGORIES, DAYS_OF_WEEK,
  MAX_PARTY_SIZE, BATTLE_REWARDS,
} from "./data/constants.js";
import {
  calcStats, calcXpReward, calcStatReward,
  applyXpGain, newDigimon, calcDamage, abiCap, totalBonusStats,
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

// ── Initial state (replace with Supabase fetch later) ────────────────────────
function makeInitialParty() {
  var a = newDigimon("agumon",  { level:6, exp:340, abi:8,  bonusStats:{HP:4,SP:2,ATK:5,DEF:3,INT:1,SPD:3} });
  var b = newDigimon("gabumon", { level:4, exp:120, abi:5,  bonusStats:{HP:2,SP:1,ATK:3,DEF:4,INT:2,SPD:2} });
  var c = newDigimon("guilmon", { level:3, exp:60,  abi:3,  bonusStats:{HP:1,SP:0,ATK:2,DEF:1,INT:0,SPD:1} });
  return [a, b, c];
}

export default function App() {
  var [page,       setPage]       = useState("dashboard");
  var [darkMode,   setDarkMode]   = useState(true);
  var [party,      setParty]      = useState(makeInitialParty);
  var [farm,       setFarm]       = useState([]);
  var [savedStats, setSavedStats] = useState(0);
  var [bits,       setBits]       = useState(350);
  var [tasks,      setTasks]      = useState([
    { id:1, title:"Review sprint backlog",  category:"Work",   priority:"High",   difficulty:"Medium", type:"once",      done:false, streak:0, notes:"" },
    { id:2, title:"Morning workout",         category:"Health", priority:"Medium", difficulty:"Hard",   type:"daily",     done:true,  streak:4, notes:"30 min min", daysOfWeek:[] },
    { id:3, title:"Read 20 pages",           category:"Study",  priority:"Low",    difficulty:"Easy",   type:"recurring", done:false, streak:1, notes:"",           daysOfWeek:["Mon","Wed","Fri"] },
    { id:4, title:"Fix login bug",           category:"Work",   priority:"High",   difficulty:"Hard",   type:"once",      done:false, streak:0, notes:"Affects mobile" },
    { id:5, title:"Meal prep",               category:"Health", priority:"Low",    difficulty:"Easy",   type:"daily",     done:false, streak:7, notes:"",           daysOfWeek:[] },
  ]);
  var [allDiscovered, setAllDiscovered] = useState(["koromon","agumon","gabumon","guilmon","greymon"]);
  var [toast,      setToast]      = useState(null);
  var [evoAnim,    setEvoAnim]    = useState(null);
  var [inBattle,   setInBattle]   = useState(false);
  var [battleState,setBattleState]= useState(null);

  var dragIdx = useRef(null);

  // Derived
  var activeDigi  = party[0];
  var activeInfo  = activeDigi ? DIGIMON_MAP[activeDigi.speciesId] : null;
  var streak      = tasks.reduce(function(m,t){return Math.max(m,t.streak||0);},0);
  var accentColor = activeInfo ? (ATTR_COLOR[activeInfo.attr]||"#7EB8F7") : "#7EB8F7";
  var bg          = darkMode ? "#080a12" : "#f0f2f8";
  var fg          = darkMode ? "#ffffff" : "#1a1a2e";
  var card        = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  var border      = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  var sub         = darkMode ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.45)";

  function showToast(msg, color) {
    setToast({ msg, color: color||"#7EF797" });
    setTimeout(function(){setToast(null);}, 2500);
  }

  function completeTask(id) {
    var task = tasks.find(function(t){return t.id===id;});
    if (!task||task.done) return;
    setTasks(function(ts){return ts.map(function(t){return t.id===id?Object.assign({},t,{done:true,streak:(t.streak||0)+1}):t;});});
    var xp = calcXpReward(task, streak);
    var sp = calcStatReward(task);
    setParty(function(p){
      return p.map(function(digi, i) {
        var gain   = i===0 ? xp : Math.floor(xp*0.5);
        var result = applyXpGain(digi, gain);
        return Object.assign({},digi, result);
      });
    });
    setSavedStats(function(s){return s+sp;});
    showToast("Task done! +"+xp+" EXP  +"+sp+" stat pts");
  }

  function evolve(uid, targetId) {
    var info = DIGIMON_MAP[targetId];
    if (!info) return;
    setParty(function(p){
      return p.map(function(d){
        if (d.uid!==uid) return d;
        var newDisc = d.discovered.indexOf(targetId)<0 ? d.discovered.concat([targetId]) : d.discovered;
        return Object.assign({},d,{speciesId:targetId,name:info.name,level:1,exp:0,expNeeded:100,abi:(d.abi||0)+Math.max(1,Math.floor(d.level/10)),discovered:newDisc});
      });
    });
    setAllDiscovered(function(prev){return prev.indexOf(targetId)<0?prev.concat([targetId]):prev;});
    setEvoAnim(targetId);
    setTimeout(function(){setEvoAnim(null);},3000);
    showToast(info.name+" digivolved!","#FFD700");
  }

  function sendToFarm(uid) {
    if (party.length<=1) return;
    var digi = party.find(function(d){return d.uid===uid;});
    if (!digi) return;
    setParty(function(p){return p.filter(function(d){return d.uid!==uid;});});
    setFarm(function(f){return f.concat([Object.assign({},digi,{inFarm:true})]);});
    showToast(digi.name+" sent to farm.");
  }

  function recallFromFarm(uid) {
    if (party.length>=MAX_PARTY_SIZE){ showToast("Party full!","#FF8080"); return; }
    var digi = farm.find(function(d){return d.uid===uid;});
    if (!digi) return;
    setFarm(function(f){return f.filter(function(d){return d.uid!==uid;});});
    setParty(function(p){return p.concat([Object.assign({},digi,{inFarm:false})]);});
    showToast(digi.name+" recalled!");
  }

  function addTask(t) { setTasks(function(ts){return ts.concat([Object.assign({id:Date.now(),done:false,streak:0},t)]);});showToast("Task added!"); }
  function editTask(id,u){ setTasks(function(ts){return ts.map(function(t){return t.id===id?Object.assign({},t,u):t;});}); }
  function deleteTask(id){ setTasks(function(ts){return ts.filter(function(t){return t.id!==id;});});showToast("Task deleted.","#FF8080"); }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:bg, color:fg, fontFamily:"'Segoe UI',sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.3);border-radius:2px;}
        select option{background:#1a1a2e;}
        textarea,input{font-family:inherit;}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes evoFlash{0%,100%{opacity:0;transform:scale(0.7)}40%,60%{opacity:1;transform:scale(1)}}
        @keyframes msgIn{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes dtBounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
        .page-enter{animation:slideUp 0.25s ease;}
        .card{background:${card};border:1px solid ${border};border-radius:14px;padding:16px;}
      `}</style>

      {/* Evolution overlay */}
      {evoAnim && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"evoFlash 3s ease" }}>
          <div style={{ fontSize:48,marginBottom:16 }}>✨</div>
          <DigiSprite digimonId={evoAnim} size={120} mood="happy"/>
          <div style={{ fontSize:12,color:accentColor,letterSpacing:3,marginTop:20 }}>DIGIVOLUTION!</div>
          <div style={{ fontSize:22,fontWeight:900,color:"#fff",marginTop:8 }}>{DIGIMON_MAP[evoAnim]&&DIGIMON_MAP[evoAnim].name}</div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",bottom:85,left:"50%",transform:"translateX(-50%)",background:darkMode?"#111827":"#fff",border:"1px solid "+toast.color+"44",borderRadius:20,padding:"9px 18px",fontSize:13,color:toast.color,zIndex:100,whiteSpace:"nowrap",boxShadow:"0 4px 20px "+toast.color+"22",animation:"slideUp 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{ position:"sticky",top:0,background:darkMode?"rgba(8,10,18,0.95)":"rgba(240,242,248,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+border,zIndex:50,padding:"10px 16px",display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {activeDigi && <DigiSprite digimonId={activeDigi.speciesId} size={26} animate={false}/>}
          <span style={{ fontWeight:900,fontSize:17,color:accentColor }}>DigiTask</span>
        </div>
        <div style={{ flex:1 }}/>
        <span style={{ color:"#FFD700",fontWeight:700,fontSize:11 }}>🪙 {bits}</span>
        <span style={{ color:sub,fontSize:11 }}>🔥 {streak}d</span>
        <span style={{ color:accentColor,fontSize:11 }}>◈ {party.length}/{MAX_PARTY_SIZE}</span>
        <button onClick={function(){setDarkMode(function(d){return !d;});}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:sub }}>
          {darkMode?"☀️":"🌙"}
        </button>
      </div>

      {/* Page content */}
      <div style={{ maxWidth:780,margin:"0 auto",padding:"20px 14px 90px" }}>
        <div key={page} className="page-enter">

          {/* ── CHAT (new tab) ──────────────────────────────────────────── */}
          {page==="chat" && activeDigi && (
            <ChatPage
              digimon={Object.assign({}, activeDigi, {
                stage:   activeInfo ? activeInfo.stage : "Rookie",
                streak:  streak,
                hp:      75,
              })}
              tasks={tasks}
            />
          )}

          {/* ── DASHBOARD ───────────────────────────────────────────────── */}
          {page==="dashboard" && activeDigi && activeInfo && (
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div className="card" style={{ background:"linear-gradient(135deg,"+accentColor+"18 0%,"+accentColor+"06 100%)",border:"1px solid "+accentColor+"44",display:"flex",gap:20,alignItems:"center" }}>
                <DigiSprite digimonId={activeDigi.speciesId} size={88} mood="happy"/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                    <span style={{ fontSize:18,fontWeight:900 }}>{activeDigi.name}</span>
                    <Tag color={STAGE_COLOR[activeInfo.stage]||"#aaa"}>{activeInfo.stage}</Tag>
                    <Tag color={ATTR_COLOR[activeInfo.attr]||"#aaa"}>{activeInfo.attr}</Tag>
                  </div>
                  <div style={{ fontSize:11,color:sub,marginBottom:8 }}>
                    Lv.{activeDigi.level} · ABI {activeDigi.abi} · {PERSONALITIES.find(function(p){return p.id===activeDigi.personality;})&&PERSONALITIES.find(function(p){return p.id===activeDigi.personality;}).label}
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                    <div>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                        <span style={{ fontSize:9,color:sub }}>EXP</span>
                        <span style={{ fontSize:9,color:accentColor }}>{activeDigi.exp}/{activeDigi.expNeeded}</span>
                      </div>
                      <Bar value={activeDigi.exp} max={activeDigi.expNeeded} color={accentColor} h={5}/>
                    </div>
                  </div>
                  <div style={{ marginTop:10 }}>
                    <Btn small color={accentColor} onClick={function(){setPage("chat");}}>💬 Chat with {activeDigi.name}</Btn>
                  </div>
                </div>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
                {[
                  { label:"Pending", value:tasks.filter(function(t){return !t.done;}).length, color:"#FFB3C6", icon:"⏳" },
                  { label:"Done",    value:tasks.filter(function(t){return  t.done;}).length, color:"#7EF797", icon:"✓"  },
                  { label:"Streak",  value:streak+"d",                                         color:"#FFD700", icon:"🔥" },
                  { label:"Level",   value:activeDigi.level,                                   color:accentColor, icon:"★" },
                ].map(function(s){
                  return (
                    <div key={s.label} className="card" style={{ textAlign:"center",padding:"12px 8px" }}>
                      <div style={{ fontSize:18,marginBottom:4 }}>{s.icon}</div>
                      <div style={{ fontSize:20,fontWeight:900,color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:9,color:sub }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>

              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <span style={{ fontSize:11,color:sub }}>TODAY'S TASKS</span>
                  <button onClick={function(){setPage("tasks");}} style={{ background:"none",border:"none",color:accentColor,cursor:"pointer",fontSize:11 }}>View all →</button>
                </div>
                {tasks.filter(function(t){return !t.done;}).slice(0,4).map(function(t){
                  return (
                    <div key={t.id} className="card" style={{ display:"flex",gap:10,alignItems:"center",marginBottom:6,padding:"10px 14px",borderColor:PRIORITY_COLORS[t.priority]+"33" }}>
                      <button onClick={function(){completeTask(t.id);}} style={{ width:20,height:20,borderRadius:5,border:"2px solid "+PRIORITY_COLORS[t.priority]+"88",background:"transparent",cursor:"pointer",flexShrink:0 }}/>
                      <span style={{ flex:1,fontSize:13 }}>{t.title}</span>
                      <Tag color={PRIORITY_COLORS[t.priority]||"#aaa"}>{t.priority}</Tag>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TASKS ───────────────────────────────────────────────────── */}
          {page==="tasks" && (
            <TasksPage tasks={tasks} onComplete={completeTask} onAdd={addTask} onEdit={editTask} onDelete={deleteTask} accentColor={accentColor} sub={sub} card={card} border={border}/>
          )}

          {/* ── TEAM ─────────────────────────────────────────────────────── */}
          {page==="team" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>Team Manager</span>
                <Tag color={accentColor}>{party.length}/{MAX_PARTY_SIZE}</Tag>
              </div>
              {savedStats>0 && (
                <div className="card" style={{ borderColor:"rgba(255,215,0,0.3)" }}>
                  <div style={{ fontSize:12,color:"#FFD700",fontWeight:700,marginBottom:8 }}>⭐ {savedStats} stat points to allocate</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {["HP","SP","ATK","DEF","INT","SPD"].map(function(stat){
                      return (
                        <Btn key={stat} small color="#FFD700" onClick={function(){
                          if (savedStats<=0) return;
                          setParty(function(p){return p.map(function(d,i){
                            if (i!==0) return d;
                            if (totalBonusStats(d)>=abiCap(d)){showToast("ABI cap reached!","#FF8080");return d;}
                            var nb=Object.assign({},d.bonusStats);nb[stat]=(nb[stat]||0)+1;
                            return Object.assign({},d,{bonusStats:nb});
                          });});
                          setSavedStats(function(s){return s-1;});
                        }}>+{stat}</Btn>
                      );
                    })}
                  </div>
                </div>
              )}
              {party.map(function(digi,i){
                var info2=DIGIMON_MAP[digi.speciesId];
                var st2=calcStats(digi);
                var evoTargets=(info2&&info2.evolvesTo||[]).filter(function(id){
                  var t=DIGIMON_MAP[id];return t&&!t.fusionOf&&digi.level>=10;
                });
                return (
                  <div key={digi.uid} className="card" style={{ borderColor:i===0?accentColor+"44":border }}>
                    <div style={{ display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap" }}>
                      <DigiSprite digimonId={digi.speciesId} size={68} mood="happy"/>
                      <div style={{ flex:1,minWidth:160 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                          <span style={{ fontSize:14,fontWeight:800 }}>{digi.name}</span>
                          {i===0&&<Tag color={accentColor}>Active</Tag>}
                          <Tag color={STAGE_COLOR[info2&&info2.stage]||"#aaa"}>{info2&&info2.stage}</Tag>
                        </div>
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:8 }}>
                          {["HP","ATK","DEF","SP","INT","SPD"].map(function(s){
                            return <div key={s} style={{ fontSize:10,color:sub }}><span style={{ color:fg,fontWeight:600 }}>{st2[s]}</span> {s}</div>;
                          })}
                        </div>
                        <div style={{ marginBottom:4 }}>
                          <Bar value={digi.exp} max={digi.expNeeded} color={accentColor} h={4}/>
                        </div>
                        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:8 }}>
                          {evoTargets.map(function(tid){
                            return <Btn key={tid} small color="#FFD700" onClick={function(){evolve(digi.uid,tid);}}>→ {DIGIMON_MAP[tid]&&DIGIMON_MAP[tid].name}</Btn>;
                          })}
                          {party.length>1&&<Btn small outline color={sub} onClick={function(){sendToFarm(digi.uid);}}>→ Farm</Btn>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── DIGIFARM ─────────────────────────────────────────────────── */}
          {page==="digifarm" && (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>DigiFarm</span>
                <Tag color="#7EF797">{farm.length} stored</Tag>
              </div>
              {farm.length===0
                ? <div className="card" style={{ textAlign:"center",padding:40,color:sub }}>No Digimon in the farm yet.</div>
                : farm.map(function(digi){
                  return (
                    <div key={digi.uid} className="card" style={{ display:"flex",alignItems:"center",gap:12 }}>
                      <DigiSprite digimonId={digi.speciesId} size={48} animate={false}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{digi.name}</div>
                        <div style={{ fontSize:11,color:sub }}>Lv.{digi.level}</div>
                      </div>
                      <Btn small color={accentColor} onClick={function(){recallFromFarm(digi.uid);}}>Recall</Btn>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* ── BATTLE (simplified) ─────────────────────────────────────── */}
          {page==="battle" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <span style={{ fontSize:16,fontWeight:800 }}>Battle Arena</span>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
                {["Easy","Medium","Hard"].map(function(diff){
                  var r=BATTLE_REWARDS[diff];
                  return (
                    <div key={diff} className="card" style={{ textAlign:"center",cursor:"pointer" }} onClick={function(){showToast("Battle started! ("+diff+")","#FFB34D");}}>
                      <div style={{ fontSize:14,fontWeight:800,color:diff==="Hard"?"#FF8080":diff==="Medium"?"#FFB34D":"#7EF797" }}>{diff}</div>
                      <div style={{ fontSize:10,color:sub,marginTop:4 }}>Win {r.win}🪙 · Loss {r.loss}🪙</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STORE ─────────────────────────────────────────────────────── */}
          {page==="store" && (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>Neemon's Shop</span>
                <Tag color="#FFD700">🪙 {bits}</Tag>
              </div>
              {[
                {id:"stat",  name:"+4 Bonus Stat",      cost:1000, icon:"⭐"},
                {id:"exp",   name:"EXP Booster (500)",  cost:1000, icon:"📈"},
                {id:"random",name:"Random Digimon",     cost:2000, icon:"🎲"},
                {id:"xab",   name:"X-Antibody",         cost:3000, icon:"✖️"},
              ].map(function(item){
                return (
                  <div key={item.id} className="card" style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <span style={{ fontSize:22 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:700 }}>{item.name}</div>
                    </div>
                    <Btn small color={bits>=item.cost?"#FFD700":"#888"} disabled={bits<item.cost} onClick={function(){
                      if(bits<item.cost) return;
                      setBits(function(b){return b-item.cost;});
                      showToast("Purchased: "+item.name,"#FFD700");
                    }}>{item.cost}🪙</Btn>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── DIGIDEX ──────────────────────────────────────────────────── */}
          {page==="digidex" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:16,fontWeight:800 }}>Digidex</span>
                <Tag color={accentColor}>{allDiscovered.length} discovered</Tag>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10 }}>
                {Object.values(DIGIMON_MAP).map(function(d){
                  var known=allDiscovered.indexOf(d.id)>=0;
                  return (
                    <div key={d.id} className="card" style={{ textAlign:"center",opacity:known?1:0.3,padding:12 }}>
                      {known
                        ? <DigiSprite digimonId={d.id} size={48} animate={false}/>
                        : <div style={{ width:48,height:48,margin:"0 auto",background:"rgba(255,255,255,0.05)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:sub }}>?</div>
                      }
                      <div style={{ fontSize:11,fontWeight:700,marginTop:6 }}>{known?d.name:"???"}</div>
                      {known&&<Tag color={STAGE_COLOR[d.stage]||"#aaa"}>{d.stage}</Tag>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:darkMode?"rgba(8,10,18,0.97)":"rgba(240,242,248,0.97)",backdropFilter:"blur(16px)",borderTop:"1px solid "+border,display:"flex",overflowX:"auto",zIndex:50 }}>
        {NAV.map(function(n){
          var active=page===n.id;
          return (
            <button key={n.id} onClick={function(){setPage(n.id);}} style={{ flex:1,minWidth:56,padding:"10px 0 14px",background:"none",border:"none",cursor:"pointer",color:active?accentColor:sub,transition:"color 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:active?"2px solid "+accentColor:"2px solid transparent",fontFamily:"inherit" }}>
              <span style={{ fontSize:17 }}>{n.icon}</span>
              <span style={{ fontSize:8 }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── TasksPage component (kept in App.jsx for now, move to pages/ later) ───────
function TasksPage({ tasks, onComplete, onAdd, onEdit, onDelete, accentColor, sub, card, border }) {
  var [showAdd,   setShowAdd]   = useState(false);
  var [editId,    setEditId]    = useState(null);
  var [filterCat, setFilterCat] = useState("All");
  var [form, setForm] = useState({ title:"",category:"Work",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[] });

  function resetForm(){ setForm({title:"",category:"Work",priority:"Medium",difficulty:"Medium",type:"once",notes:"",daysOfWeek:[]}); }
  function submitAdd(){ if(!form.title.trim())return; onAdd(form); resetForm(); setShowAdd(false); }
  function submitEdit(){ if(!editId||!form.title.trim())return; onEdit(editId,form); setEditId(null); resetForm(); }
  function startEdit(t){ setEditId(t.id); setForm({title:t.title,category:t.category,priority:t.priority,difficulty:t.difficulty,type:t.type,notes:t.notes||"",daysOfWeek:t.daysOfWeek||[]}); }

  var priColor  = {Low:"#7EB8F7",Medium:"#FFD700",High:"#FF9940",Urgent:"#FF4444"};
  var diffColor = {Easy:"#7EF797",Medium:"#FFD700",Hard:"#FF8080"};
  var typeColor = {once:"#B8A0E8",daily:"#7EB8F7",recurring:"#7EF797"};
  var visible   = tasks.filter(function(t){return filterCat==="All"||t.category===filterCat;});

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
        {["All"].concat(CATEGORIES).map(function(c){
          var a=filterCat===c;
          return <button key={c} onClick={function(){setFilterCat(c);}} style={{ padding:"3px 10px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontSize:10,background:a?accentColor:"rgba(255,255,255,0.04)",color:a?"#0d0f1a":"rgba(255,255,255,0.5)",fontWeight:a?700:400,fontFamily:"inherit" }}>{c}</button>;
        })}
      </div>

      {showAdd && !editId && (
        <TaskForm form={form} setForm={setForm} onSubmit={submitAdd} onCancel={function(){setShowAdd(false);resetForm();}} label="Add Task" accentColor={accentColor} sub={sub}/>
      )}

      {!showAdd && !editId && (
        <button onClick={function(){setShowAdd(true);}} style={{ background:accentColor+"18",border:"1.5px dashed "+accentColor+"55",borderRadius:12,padding:"12px 20px",color:accentColor,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left",fontFamily:"inherit" }}>
          + New Task
        </button>
      )}

      {visible.map(function(t){
        return (
          <div key={t.id}>
            {editId===t.id
              ? <TaskForm form={form} setForm={setForm} onSubmit={submitEdit} onCancel={function(){setEditId(null);resetForm();}} label="Save" accentColor={accentColor} sub={sub}/>
              : (
                <div style={{ background:card,border:"1px solid "+(t.done?"rgba(255,255,255,0.04)":priColor[t.priority]+"33"),borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"flex-start",gap:10,opacity:t.done?0.55:1 }}>
                  <button onClick={function(){if(!t.done)onComplete(t.id);}} style={{ width:22,height:22,borderRadius:6,flexShrink:0,cursor:t.done?"default":"pointer",border:"2px solid "+(t.done?"#7EF797":priColor[t.priority]||"#7EB8F7"),background:t.done?"#7EF797":"transparent",color:"#0d0f1a",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1 }}>{t.done?"✓":""}</button>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,textDecoration:t.done?"line-through":"none" }}>{t.title}</div>
                    {t.notes&&<div style={{ fontSize:11,color:sub,marginTop:2 }}>{t.notes}</div>}
                    <div style={{ display:"flex",gap:5,marginTop:5,flexWrap:"wrap" }}>
                      <Tag color={typeColor[t.type]||"#aaa"}>{t.type==="once"?"One-Time":t.type}</Tag>
                      <Tag color="rgba(255,255,255,0.25)">{t.category}</Tag>
                      <Tag color={priColor[t.priority]||"#aaa"}>{t.priority}</Tag>
                      <Tag color={diffColor[t.difficulty]||"#aaa"}>{t.difficulty}</Tag>
                      {(t.streak||0)>0&&<Tag color="#FFD700">🔥 {t.streak}</Tag>}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                    <button onClick={function(){startEdit(t);}} style={{ background:"none",border:"none",color:sub,cursor:"pointer",fontSize:14,padding:"0 4px" }}>✏</button>
                    <button onClick={function(){onDelete(t.id);}} style={{ background:"none",border:"none",color:sub,cursor:"pointer",fontSize:18,padding:"0 4px",lineHeight:1 }}>×</button>
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

function TaskForm({ form, setForm, onSubmit, onCancel, label, accentColor, sub }) {
  var priColor = {Low:"#7EB8F7",Medium:"#FFD700",High:"#FF9940"};
  var diffColor= {Easy:"#7EF797",Medium:"#FFD700",Hard:"#FF8080"};
  return (
    <div style={{ background:accentColor+"10",border:"1px solid "+accentColor+"44",borderRadius:14,padding:16,display:"flex",flexDirection:"column",gap:10 }}>
      <input value={form.title} onChange={function(e){setForm(function(f){return Object.assign({},f,{title:e.target.value});});}} onKeyDown={function(e){if(e.key==="Enter")onSubmit();}} placeholder="Task title..." autoFocus style={{ background:"rgba(0,0,0,0.2)",border:"1px solid "+accentColor+"44",borderRadius:8,padding:"10px 14px",color:"inherit",fontSize:14,outline:"none",width:"100%",fontFamily:"inherit" }}/>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <select value={form.type} onChange={function(e){setForm(function(f){return Object.assign({},f,{type:e.target.value});});}} style={{ background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:12,cursor:"pointer" }}>
          <option value="once">One-Time</option><option value="daily">Daily</option><option value="recurring">Recurring</option>
        </select>
        <select value={form.category} onChange={function(e){setForm(function(f){return Object.assign({},f,{category:e.target.value});});}} style={{ background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:12,cursor:"pointer" }}>
          {CATEGORIES.map(function(c){return <option key={c}>{c}</option>;})}
        </select>
        <select value={form.priority} onChange={function(e){setForm(function(f){return Object.assign({},f,{priority:e.target.value});});}} style={{ background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",color:priColor[form.priority]||"#fff",fontSize:12,cursor:"pointer" }}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <select value={form.difficulty} onChange={function(e){setForm(function(f){return Object.assign({},f,{difficulty:e.target.value});});}} style={{ background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 10px",color:diffColor[form.difficulty]||"#fff",fontSize:12,cursor:"pointer" }}>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>
      <textarea value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});});}} placeholder="Notes (optional)..." rows={2} style={{ background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",color:"inherit",fontSize:12,outline:"none",resize:"vertical",width:"100%",fontFamily:"inherit" }}/>
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={onSubmit} style={{ background:accentColor,border:"none",borderRadius:8,padding:"8px 18px",color:"#0d0f1a",fontWeight:800,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>{label}</button>
        <button onClick={onCancel} style={{ background:"rgba(255,255,255,0.07)",border:"none",borderRadius:8,padding:"8px 14px",color:sub,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── HearthPage — Babamon's Hearth ────────────────────────────────────────────
// Props:
//   allDisc      — array of discovered Digimon species IDs
//   party / farm — Digimon arrays; each has { speciesId, name, discovered[], bond, personality }
//   selectedBg   — current background ID string
//   saveBackground(bgId) — persists background choice to Supabase
//   DIGIMON_MAP  — species lookup { [id]: { name, desc, stage, ... } }
//   BACKGROUNDS  — background definitions [{ id, label, url, thumb, story }]
//   tamerName    — display name string
//   loginDay     — number of login days completed (0-indexed)
//   LOGIN_REWARDS — reward schedule array [{ day, bits, material, ... }]
//   CREST_INFO   — crest definitions map

import { useState, useRef } from "react";
import DigiSprite from "../components/DigiSprite.jsx";

var HEARTH    = "#FFB347";
var HEARTH_DK = "#1a0f00";

function CrestIcon({ ci, size }) {
  if (!ci) return null;
  if (ci.img) return <img src={ci.img} alt="" style={{ width:size, height:size, objectFit:"contain", display:"inline-block", verticalAlign:"middle" }}/>;
  return <span style={{ fontSize:size }}>{ci.icon}</span>;
}

// ── Build a personal Babamon tale about the tamer's relationship with a species ─
function buildTale(speciesId, party, farm, DIGIMON_MAP, tamerName) {
  var allDigi  = (party || []).concat(farm || []);
  var partner  = allDigi.find(function(d) { return d.discovered && d.discovered.indexOf(speciesId) >= 0; });
  var info     = DIGIMON_MAP[speciesId];
  if (!info) return "Even I don't know all their stories yet, " + tamerName + ". But every Digimon has one.";

  var stage = info.stage || "Rookie";

  // No known partner — species was discovered but the Digimon has since been released or reset
  if (!partner) {
    var gone = {
      "Baby":       info.name + " came to you as a tiny, fragile Baby — all possibility, no power yet. That little one is no longer with you, but their Digicore left an impression on your journey that cannot be undone.",
      "In-Training": "You once cared for " + info.name + " in their In-Training days — stumbling, growing, learning your voice. Even now I can feel the warmth of that early bond. Some things stay with you.",
      "Rookie":     info.name + " was your Rookie partner once, " + tamerName + ". The Rookie stage is where trust is built from nothing. Whatever happened after, that foundation was real.",
      "Champion":   "A Champion form. " + info.name + " was hard-won — no Digimon reaches Champion without a Tamer who refuses to give up. I hope you remember what it cost to reach this form.",
      "Ultimate":   info.name + "... Ultimate stage. This is not a form many Tamers ever see. You saw it. That says more about you than any record I could keep.",
      "Mega":       "Mega stage. " + info.name + ". I need not say more — anyone who has stood beside a Mega understands that something in the Digital World shifted the day it happened.",
    };
    return gone[stage] || info.name + " was part of your journey once. Every form leaves a mark on the Digital World, even those no longer with us.";
  }

  var isCurrent = partner.speciesId === speciesId;
  var bond      = partner.bond || 0;
  var bondLine  = bond >= 80 ? "You two are inseparable — that kind of bond is rare, even in my long years."
                : bond >= 50 ? "The bond between you runs deep. I can see it in the way " + partner.name + " moves when you are near."
                : bond >= 20 ? "Trust is growing between you. Give it time — the best bonds are the ones that build slowly."
                :              "You are still finding each other. Every great partnership starts exactly here.";

  var partnerCurrent = DIGIMON_MAP[partner.speciesId];
  var currentStageLine = partnerCurrent ? " — who stands beside you today as " + partner.name : "";

  if (isCurrent) {
    var cur = {
      "Baby":       partner.name + " came to you as a Baby Digimon, " + tamerName + ". Helpless, new, completely trusting. Most Tamers see that and feel pressure — the good ones feel wonder. " + bondLine,
      "In-Training": "Still finding their feet when you first met. " + partner.name + " was In-Training, and so were you, in your own way. You grew together from the very beginning. " + bondLine,
      "Rookie":     "The Rookie stage is where a Tamer's story really begins. " + partner.name + " chose you — or perhaps you chose each other — and everything since has been written together. " + bondLine,
      "Champion":   "Reaching Champion takes more than strength — it takes a Tamer who believes. You believed in " + partner.name + ", and they answered. This form is proof of that. " + bondLine,
      "Ultimate":   "Ultimate stage, " + tamerName + ". Few reach this far. " + partner.name + " carries the weight of every trial you have faced side by side. " + bondLine,
      "Mega":       "Mega stage. When " + partner.name + " first reached this form, the very data of the Digital World trembled. This is not just evolution — this is your shared story written in light. " + bondLine,
    };
    return cur[stage] || partner.name + " stands with you as " + info.name + ". " + bondLine;
  }

  // Past form — a stage the current partner evolved through
  var past = {
    "Baby":       info.name + " — the very beginning" + currentStageLine + ". I watched them then: so small, so new. Did you know that Baby Digimon carry the full weight of their eventual destiny inside them from the first moment? " + partner.name + " was always going to be something extraordinary.",
    "In-Training": "When " + partner.name + " was " + info.name + ", they were still learning your voice, still learning their own name. In-Training is a quiet, precious stage. Those days shaped everything that came after" + currentStageLine + ".",
    "Rookie":     info.name + " — the Rookie form of " + partner.name + currentStageLine + ". Do you remember those days? The Rookie stage is where a Tamer earns real trust. You earned it. " + partner.name + " has never forgotten.",
    "Champion":   "Champion stage, " + info.name + ". This was the form where " + partner.name + " first showed the Digital World what you two are capable of together. A chapter of courage" + (partnerCurrent ? ", now surpassed as " + partner.name : "") + ", but never erased.",
    "Ultimate":   "Ultimate stage. " + info.name + " was a form " + partner.name + " wore with great pride" + currentStageLine + ". Every Tamer who stands beside an Ultimate is changed by it. I think you know exactly what I mean.",
    "Mega":       info.name + " — a Mega form that " + partner.name + " once carried" + currentStageLine + ". Mega stage leaves a mark on the Digital World and on the Tamer who witnesses it. Your journey carries that mark.",
  };
  return past[stage] || info.name + " is a form " + partner.name + " once wore" + currentStageLine + ". Every stage of the journey matters. This one was part of yours.";
}

export default function HearthPage({ allDisc, party, farm, selectedBg, saveBackground, DIGIMON_MAP, BACKGROUNDS, tamerName, loginDay, LOGIN_REWARDS, CREST_INFO }) {
  var [selectedDigi,  setSelectedDigi]  = useState(null);
  var [journeyOpen,   setJourneyOpen]   = useState(true);
  var [recordOpen,    setRecordOpen]    = useState(true);
  var [recordPage,    setRecordPage]    = useState(function(){ return (loginDay || 0) >= 30 ? 1 : 0; });

  var journeyRef = useRef(null);
  var recordRef  = useRef(null);
  var sceneRef   = useRef(null);
  var talesRef   = useRef(null);

  var activeBg = BACKGROUNDS.find(function(b){ return b.id === selectedBg; }) || BACKGROUNDS[0];
  var taleText = selectedDigi ? buildTale(selectedDigi, party, farm, DIGIMON_MAP, tamerName) : null;
  var taleInfo = selectedDigi ? DIGIMON_MAP[selectedDigi] : null;

  function scrollTo(ref) {
    if (ref.current) ref.current.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function selectDigi(id) {
    var next = selectedDigi === id ? null : id;
    setSelectedDigi(next);
    if (next && talesRef.current) {
      setTimeout(function(){ talesRef.current.scrollIntoView({ behavior:"smooth", block:"nearest" }); }, 80);
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Babamon Header ─────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,"+HEARTH_DK+",#1a1400)", border:"2px solid "+HEARTH+"44", padding:"20px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:HEARTH+"0d" }}/>
        <div style={{ position:"absolute", bottom:-10, left:-10, width:50, height:50, borderRadius:"50%", background:"#FFD70008" }}/>

        <div style={{ display:"flex", gap:16, alignItems:"flex-start", position:"relative" }}>
          <div style={{ width:64, height:64, flexShrink:0 }}>
            <DigiSprite digimonId="babamon" mood="walk" size={64} animate />
          </div>
          <div style={{ flex:1 }}>
            <div className="px12" style={{ color:HEARTH, marginBottom:4 }}>BABAMON'S HEARTH</div>
            <div style={{ fontSize:13, color:"#c8b89a", lineHeight:1.6, fontStyle:"italic", marginBottom:12 }}>
              "What tale shall I tell today, {tamerName}? Sit a while by the fire... I have been keeping watch over your journey."
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className="px8" onClick={function(){ scrollTo(journeyRef); }}
                style={{ padding:"5px 10px", background:HEARTH+"22", border:"1.5px solid "+HEARTH+"88", color:HEARTH, cursor:"pointer", fontSize:"10px" }}>
                📖 YOUR JOURNEY
              </button>
              <button className="px8" onClick={function(){ scrollTo(recordRef); }}
                style={{ padding:"5px 10px", background:"#FFD70022", border:"1.5px solid #FFD70088", color:"#FFD700", cursor:"pointer", fontSize:"10px" }}>
                📜 TAMER'S RECORD
              </button>
              <button className="px8" onClick={function(){ scrollTo(sceneRef); }}
                style={{ padding:"5px 10px", background:"#4ECDC422", border:"1.5px solid #4ECDC488", color:"#4ECDC4", cursor:"pointer", fontSize:"10px" }}>
                🌏 SET THE SCENE
              </button>
              {allDisc.length > 0 && (
                <button className="px8" onClick={function(){ scrollTo(talesRef); }}
                  style={{ padding:"5px 10px", background:HEARTH+"22", border:"1.5px solid "+HEARTH+"44", color:HEARTH+"cc", cursor:"pointer", fontSize:"10px" }}>
                  ✨ TALES
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Your Tamer Journey ─────────────────────────────────────────── */}
      <div ref={journeyRef}>
        {/* Collapsible header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: journeyOpen ? 8 : 0 }}>
          <div className="px8" style={{ color:"#8a90a8", fontSize:"12px" }}>
            📖 YOUR TAMER JOURNEY
            {allDisc.length > 0 && (
              <span style={{ color:"#4a5070", fontWeight:400, marginLeft:6 }}>({allDisc.length} form{allDisc.length !== 1 ? "s" : ""})</span>
            )}
          </div>
          {allDisc.length > 0 && (
            <button className="px8" onClick={function(){ setJourneyOpen(function(o){ return !o; }); }}
              style={{ padding:"3px 8px", background:"transparent", border:"1px solid #2a2d3a", color:"#4a5070", cursor:"pointer", fontSize:"10px" }}>
              {journeyOpen ? "▲ collapse" : "▼ expand"}
            </button>
          )}
        </div>

        {journeyOpen && (
          allDisc.length === 0 ? (
            <div style={{ padding:"18px 14px", background:"#111318", border:"1.5px solid #2a2d3a", fontSize:12, color:"#4a5070", fontStyle:"italic", textAlign:"center", lineHeight:1.7 }}>
              Your journey has just begun.<br/>Evolve your first Digimon to write your story.
            </div>
          ) : (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {allDisc.map(function(id){
                var di = DIGIMON_MAP[id]; if (!di) return null;
                var isActive = selectedDigi === id;
                return (
                  <div key={id} title={di.name + " — click for Babamon's tale"}
                    onClick={function(){ selectDigi(id); }}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 10px",
                      border:"2px solid "+(isActive ? HEARTH : "#2a2d3a"),
                      boxShadow:isActive ? "3px 3px 0 "+HEARTH : "none",
                      background:"#111318", cursor:"pointer",
                      transition:"border-color 0.1s, box-shadow 0.1s" }}>
                    <DigiSprite digimonId={id} size={28} animate mood="walk"/>
                    <div className="px8" style={{ color:isActive ? HEARTH : "#8a90a8", fontSize:"10px" }}>{di.name}</div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Babamon's Tales ────────────────────────────────────────────── */}
      {allDisc.length > 0 && (
        <div ref={talesRef}>
          <div className="px8" style={{ color:"#8a90a8", marginBottom:8, fontSize:"12px" }}>✨ BABAMON'S TALES</div>

          {taleInfo ? (
            <div style={{ background:"linear-gradient(135deg,"+HEARTH_DK+",#1a1400)", border:"2px solid #FFD70044", padding:"16px 18px", display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ flexShrink:0 }}>
                <DigiSprite digimonId={selectedDigi} size={52} animate mood="walk"/>
              </div>
              <div>
                <div className="px8" style={{ color:"#FFD700", marginBottom:6, fontSize:"11px" }}>✦ {taleInfo.name.toUpperCase()}</div>
                <div style={{ fontSize:12, color:"#c8b89a", lineHeight:1.7, fontStyle:"italic" }}>
                  "{taleText}"
                </div>
                <div style={{ fontSize:10, color:HEARTH+"88", marginTop:8 }}>— Babamon</div>
              </div>
            </div>
          ) : (
            <div style={{ padding:"14px", background:"#111318", border:"1.5px solid #FFD70022", fontSize:11, color:"#4a5070", fontStyle:"italic", textAlign:"center" }}>
              Select a Digimon from your journey above to hear its tale...
            </div>
          )}
        </div>
      )}

      {/* ── Tamer's Record ────────────────────────────────────────────── */}
      {LOGIN_REWARDS && (
        <div ref={recordRef}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: recordOpen ? 10 : 0 }}>
            <div>
              <div className="px8" style={{ color:"#8a90a8", fontSize:"12px" }}>
                📜 THE TAMER'S RECORD
                <span style={{ color:"#4a5070", fontWeight:400, marginLeft:6 }}>Day {loginDay || 0} / 60</span>
              </div>
            </div>
            <button className="px8" onClick={function(){ setRecordOpen(function(o){ return !o; }); }}
              style={{ padding:"3px 8px", background:"transparent", border:"1px solid #2a2d3a", color:"#4a5070", cursor:"pointer", fontSize:"10px" }}>
              {recordOpen ? "▲ collapse" : "▼ expand"}
            </button>
          </div>

          {recordOpen && (
            <div style={{ background:"linear-gradient(135deg,#1a1400,#1a1000)", border:"2px solid #FFD70033", padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
              {/* Babamon framing */}
              <div style={{ fontSize:11, color:"#c8b89a", fontStyle:"italic", lineHeight:1.6 }}>
                {(loginDay || 0) === 0
                  ? "\"Your story begins today. Every day you return, I will mark it here — and the Digital World will reward your dedication.\""
                  : (loginDay || 0) >= 60
                    ? "\"Sixty days, " + tamerName + ". You have walked the full length of this record. The Digital World has felt every one of them.\""
                    : "\"" + (loginDay || 0) + " days, " + tamerName + ". Each one marked. Each one remembered. " + (60 - (loginDay || 0)) + " remain on this scroll.\""
                }
              </div>

              {/* Page nav */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button className="px8" onClick={function(){ setRecordPage(0); }} disabled={recordPage === 0}
                  style={{ background:"transparent", border:"1.5px solid "+(recordPage===0?"#2a2d3a":"#FFD700"), color:recordPage===0?"#4a5070":"#FFD700", cursor:recordPage===0?"default":"pointer", padding:"3px 10px", fontSize:13, lineHeight:1 }}>◀</button>
                <span style={{ fontSize:10, color:"#8a90a8" }}>Days {recordPage === 0 ? "1–30" : "31–60"}</span>
                <button className="px8" onClick={function(){ setRecordPage(1); }} disabled={recordPage === 1}
                  style={{ background:"transparent", border:"1.5px solid "+(recordPage===1?"#2a2d3a":"#FFD700"), color:recordPage===1?"#4a5070":"#FFD700", cursor:recordPage===1?"default":"pointer", padding:"3px 10px", fontSize:13, lineHeight:1 }}>▶</button>
              </div>

              {/* Calendar grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4 }}>
                {LOGIN_REWARDS.filter(function(r){ return recordPage === 0 ? r.day <= 30 : r.day > 30; }).map(function(r){
                  var isPast  = r.day <= (loginDay || 0);
                  var isToday = r.day === (loginDay || 0) + 1;
                  var isMile  = r.day === 30 || r.day === 60;
                  var isWeek7 = r.day % 7 === 0;
                  var borderCol = isPast ? "#4a5070" : isToday ? "#4ECDC4" : isMile ? "#FFD700" : isWeek7 ? "#C3B1E1" : "#2a2d3a";
                  var bg        = isPast ? "#ffffff08" : isToday ? "#4ECDC418" : isMile ? "#FFD70018" : isWeek7 ? "#C3B1E112" : "#111318";
                  var iconEl = isPast
                    ? <span style={{ fontSize:13 }}>✓</span>
                    : r.digitamaSelector
                      ? <span style={{ fontSize:13 }}>🥚</span>
                      : r.armorDigi
                        ? <span style={{ fontSize:13 }}>⚔️</span>
                        : r.materialSelector
                          ? <span style={{ fontSize:13 }}>💫</span>
                          : r.material && CREST_INFO
                            ? <CrestIcon ci={CREST_INFO[r.material.crest]} size={16}/>
                            : <span style={{ fontSize:13 }}>🪙</span>;
                  return (
                    <div key={r.day} style={{ border:"1.5px solid "+borderCol, background:bg, padding:"5px 3px", textAlign:"center", opacity:isPast ? 0.45 : 1 }}>
                      <div style={{ fontSize:9, color:isPast?"#4a5070":isToday?"#4ECDC4":isMile?"#FFD700":"#8a90a8", fontWeight:isToday||isMile?900:400, marginBottom:2 }}>{r.day}</div>
                      <div style={{ lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", minHeight:16 }}>{iconEl}</div>
                      {r.bits > 0 && !isPast && <div style={{ fontSize:8, color:"#FFD700", marginTop:1 }}>+{r.bits}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[
                  { col:"#4ECDC4", label:"Today" },
                  { col:"#C3B1E1", label:"Week Bonus" },
                  { col:"#FFD700", label:"Milestone (Day 30 / 60)" },
                ].map(function(l){
                  return (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#4a5070" }}>
                      <div style={{ width:9, height:9, background:l.col+"44", border:"1px solid "+l.col }}/>
                      {l.label}
                    </div>
                  );
                })}
                <div style={{ fontSize:10, color:"#4a5070", marginLeft:"auto" }}>💫 = Pick crest · 🥚 = Choose egg</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Set the Scene ──────────────────────────────────────────────── */}
      <div ref={sceneRef}>
        <div className="px8" style={{ color:"#8a90a8", marginBottom:6, fontSize:"12px" }}>🌏 SET THE SCENE</div>
        <div style={{ fontSize:12, color:"#c8b89a", fontStyle:"italic", marginBottom:12 }}>
          "Which world do you call home today?"
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
          {BACKGROUNDS.map(function(bg){
            var isActive = selectedBg === bg.id;
            return (
              <div key={bg.id} onClick={function(){ saveBackground(bg.id); }}
                style={{ cursor:"pointer", border:"2px solid "+(isActive ? "#4ECDC4" : "#2a2d3a"),
                  boxShadow:isActive ? "3px 3px 0 #4ECDC4" : "none",
                  overflow:"hidden", width:90, flexShrink:0, transition:"border-color 0.1s, box-shadow 0.1s" }}>
                {bg.url ? (
                  <img src={bg.url} alt={bg.label} style={{ width:"100%", height:54, objectFit:"cover", display:"block" }}/>
                ) : (
                  <div style={{ width:"100%", height:54, background:"#0d0f14", display:"grid", placeItems:"center" }}>
                    <span style={{ fontSize:18 }}>🌑</span>
                  </div>
                )}
                <div className="px8" style={{ padding:"4px 5px", fontSize:"9px", color:isActive ? "#4ECDC4" : "#8a90a8", background:"#111318", textAlign:"center" }}>
                  {bg.label}
                </div>
              </div>
            );
          })}
        </div>

        {activeBg.story && (
          <div style={{ background:"linear-gradient(135deg,#0a0f1a,#0d1219)", border:"1.5px solid #4ECDC444", padding:"14px 16px" }}>
            <div className="px8" style={{ color:"#4ECDC4", marginBottom:6, fontSize:"10px" }}>✦ {activeBg.label.toUpperCase()} — BABAMON'S TALE</div>
            <div style={{ fontSize:12, color:"#c8b89a", lineHeight:1.7, fontStyle:"italic" }}>
              "{activeBg.story}"
            </div>
            <div style={{ fontSize:10, color:HEARTH+"88", marginTop:8 }}>— Babamon</div>
          </div>
        )}
      </div>

    </div>
  );
}

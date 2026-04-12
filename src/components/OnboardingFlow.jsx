// ─── OnboardingFlow ────────────────────────────────────────────────────────────
// Three-egg onboarding sequence for first-time tamers.
//
// Phase sequence:
//   welcome → quiz → result
//   → hatch_1  (Jijimon presents first determined egg — tamer presses Hatch)
//   → reveal_1 (Baby 1 appears — "But wait…")
//   → surprise  (Second egg revealed and auto-hatches as a gift)
//   → reveal_2 (Baby 2 appears — "Now choose your own…")
//   → egg_choose (free-pick from all eggs minus the 2 already given)
//   → hatch_3  (chosen egg hatches)
//   → reveal_3 (all 3 babies shown — tour begins)
//   → tour → done
//
// Props:
//   tamerName  — display name (default "Tamer")
//   onComplete — ([id1, id2, id3]: string[]) => void

import { useState, useEffect, useRef } from "react";
import DigiSprite from "./DigiSprite.jsx";
import DigiEgg from "./DigiEgg.jsx";
import { QUIZ_QUESTIONS, CREST_EGGS, CREST_INFO, ALL_EGGS } from "../data/constants.js";
import { DIGIMON_MAP } from "../data/digimon.js";

// ── Design tokens ─────────────────────────────────────────────────────────────
var T = {
  bg:"#0d0f14", bgPanel:"#111318", bgCard:"#161a22", border:"#2a2d3a",
  text:"#e8eaf0", textMid:"#8a90a8", textDim:"#4a5070",
  gold:"#FFD700", teal:"#4ECDC4", lavender:"#C3B1E1", coral:"#FF6B6B",
};

// ── Tour steps ────────────────────────────────────────────────────────────────
var TOUR = [
  {
    icon:"☑", section:"P.E.T. — TASKS",
    jijimon:"This is your P.E.T. — Personal Tamer Terminal. Every task you log here becomes real training for your partners. Complete them daily and your bonds will grow stronger with every tick!",
    baby:"Let's go! We'll all get stronger with every task we do together!",
  },
  {
    icon:"💎", section:"CRESTS",
    jijimon:"Your Crests are the soul of your evolution path. Complete tasks that match your natural strengths — Workout, Deep Work, Social — and your crest alignment will carry your partners to new heights.",
    baby:"I want to evolve! Keep our crests high and we'll show you something amazing!",
  },
  {
    icon:"⚔", section:"DARK AREA — BATTLE & RAID",
    jijimon:"When your team is ready, venture into the Dark Area. Battle wild Digimon, join Community Raids, and put your real-world progress to the ultimate test!",
    baby:"Three of us — nothing can stop us! Right, team?",
  },
  {
    icon:"🗂", section:"FILEHAVEN",
    jijimon:"FILEHAVEN holds all your Digimon data. Manage your team, send partners to the farm to train, and browse the Digidex to plan every step of every evolution path.",
    baby:"I wonder what I'll evolve into... there are so many paths! I can't wait to find out!",
  },
  {
    icon:"⭐", section:"YOUR JOURNEY BEGINS",
    jijimon:null,
    baby:"Ready, Tamer! The three of us are counting on you — let's make every day count!",
  },
];

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed) {
  speed = speed || 18;
  var [displayed, setDisplayed] = useState("");
  var [done,      setDone]      = useState(false);
  var timerRef = useRef(null);

  useEffect(function() {
    setDisplayed("");
    setDone(false);
    if (!text) { setDone(true); return; }
    var i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(function() {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timerRef.current); setDone(true); }
    }, speed);
    return function() { clearInterval(timerRef.current); };
  }, [text]);

  function skipToEnd() { clearInterval(timerRef.current); setDisplayed(text); setDone(true); }

  return { displayed, done, skipToEnd };
}

// ── Baby name helper ──────────────────────────────────────────────────────────
function babyName(id) {
  var info = id && DIGIMON_MAP[id];
  return info ? info.name : "???";
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingFlow({ tamerName, onComplete }) {
  var name = tamerName || "Tamer";

  // ── Core state ───────────────────────────────────────────────────────────────
  var [phase,       setPhase]       = useState("welcome");
  var [qIdx,        setQIdx]        = useState(0);
  var [scores,      setScores]      = useState({});
  var [topCrest,    setTopCrest]    = useState(null);
  var [det,         setDet]         = useState([]);      // determined eggs [egg1, egg2]
  var [chosenEgg,   setChosenEgg]   = useState(null);   // free-choice egg
  var [freeSearch,  setFreeSearch]  = useState("");      // filter in egg_choose grid

  // Per-egg animation phases: 'idle' | 'hatching' | 'hatched'
  var [phase1,      setPhase1]      = useState("idle");
  var [phase2,      setPhase2]      = useState("idle");
  var [phase3,      setPhase3]      = useState("idle");

  // Show baby sprites after their egg hatches
  var [show1,       setShow1]       = useState(false);
  var [show2,       setShow2]       = useState(false);
  var [show3,       setShow3]       = useState(false);

  var [flash,       setFlash]       = useState(false);
  var [tourStep,    setTourStep]    = useState(0);

  // IDs of the three hatched babies (set as each hatches)
  var [id1,         setId1]         = useState(null);
  var [id2,         setId2]         = useState(null);
  var [id3,         setId3]         = useState(null);

  // ── Crest styling ────────────────────────────────────────────────────────────
  var crestColor = topCrest && CREST_INFO[topCrest] ? CREST_INFO[topCrest].color : T.gold;
  var crestIcon  = topCrest && CREST_INFO[topCrest] ? CREST_INFO[topCrest].icon  : "✨";

  // ── Typewriter text per phase ─────────────────────────────────────────────────
  var twText = (function() {
    if (phase === "welcome")
      return "Ah... a new tamer stirs in the Digital World!\n\nI am Jijimon — I have watched over tamers since before time had a name. Before I guide you on your way, let me ask a few questions. Just a peek into what makes you, well... you.\n\nShall we begin?";
    if (phase === "result" && topCrest)
      return "I see it now...\n\nThe Crest of " + topCrest + " burns within you — " + (CREST_INFO[topCrest]?.desc || "") + ".\n\nI have found two eggs that have been waiting for a tamer like you. Both are yours to keep.";
    if (phase === "hatch_1")
      return "This is your first partner. They have waited a long time to meet you.\n\nWhen you are ready — hatch the egg.";
    if (phase === "reveal_1")
      return babyName(id1) + "! Look at that spirit — already eager to face the world.\n\nBut wait... I sense something unusual nearby. An energy I did not expect...";
    if (phase === "surprise")
      return "Ah — there it is. A second egg, drawn here by your strength. The Digital World is offering you a gift.\n\nHold on — it is already hatching!";
    if (phase === "reveal_2")
      return babyName(id1) + " and " + babyName(id2) + "... what a pair already.\n\nBut your team is not yet complete. Now comes the choice that belongs to you alone, " + name + ".";
    if (phase === "egg_choose")
      return "Every egg before you carries its own destiny. Take your time, Tamer. Browse them all — and choose the one that calls to you.";
    if (phase === "reveal_3")
      return "Three partners. A true team.\n\n" + babyName(id1) + ", " + babyName(id2) + " and " + babyName(id3) + " stand with you now. Your journey in the Digital World truly begins.";
    if (phase === "tour" && tourStep === 4)
      return "And so, Tamer " + name + ", from this day forward — every task you complete, every habit you build — your three partners feel it all.\n\nGo forward with courage. I will always be watching.";
    return "";
  })();

  var { displayed, done: textDone, skipToEnd } = useTypewriter(twText);

  // ── Quiz handler ─────────────────────────────────────────────────────────────
  function handleAnswer(crest) {
    var next = Object.assign({}, scores, { [crest]: (scores[crest] || 0) + 1 });
    setScores(next);
    if (qIdx + 1 >= QUIZ_QUESTIONS.length) {
      var maxVal  = Math.max(...Object.values(next));
      var ordered = Object.keys(CREST_INFO);
      var winner  = ordered.find(function(c) { return next[c] === maxVal; }) || "Courage";
      setTopCrest(winner);
      setDet(CREST_EGGS[winner] || CREST_EGGS.Courage);
      setPhase("result");
    } else {
      setQIdx(function(i) { return i + 1; });
    }
  }

  // ── Text-click: skip typewriter or advance phase ──────────────────────────────
  function handleTextClick() {
    if (!textDone) { skipToEnd(); return; }
    if (phase === "welcome")   setPhase("quiz");
    if (phase === "result")    setPhase("hatch_1");
    if (phase === "reveal_1")  setPhase("surprise");
    if (phase === "reveal_2")  setPhase("egg_choose");
    if (phase === "reveal_3")  setPhase("tour");
  }

  // ── Egg 1: tamer presses Hatch ────────────────────────────────────────────────
  function hatchEgg1() {
    setPhase1("hatching");
  }
  function onHatched1() {
    var hid = det[0]?.hatchId || "botamon";
    setId1(hid);
    doFlash();
    setTimeout(function() { setShow1(true); setPhase("reveal_1"); }, 700);
  }

  // ── Egg 2: auto-hatches during "surprise" phase ───────────────────────────────
  useEffect(function() {
    if (phase !== "surprise") return;
    var t1 = setTimeout(function() { setPhase2("hatching"); }, 1800);
    return function() { clearTimeout(t1); };
  }, [phase]);

  function onHatched2() {
    var hid = det[1]?.hatchId || "botamon";
    setId2(hid);
    doFlash();
    setTimeout(function() { setShow2(true); setPhase("reveal_2"); }, 700);
  }

  // ── Egg 3: tamer picks then hatches ──────────────────────────────────────────
  function hatchEgg3() {
    if (!chosenEgg) return;
    setPhase("hatch_3");
    setTimeout(function() { setPhase3("hatching"); }, 400);
  }
  function onHatched3() {
    var hid = chosenEgg?.hatchId || "botamon";
    setId3(hid);
    doFlash();
    setTimeout(function() { setShow3(true); setPhase("reveal_3"); }, 700);
  }

  // ── Flash helper ──────────────────────────────────────────────────────────────
  function doFlash() { setFlash(true); setTimeout(function() { setFlash(false); }, 600); }

  // ── Tour ──────────────────────────────────────────────────────────────────────
  function handleTourNext() {
    if (tourStep + 1 >= TOUR.length) {
      onComplete([id1, id2, id3].filter(Boolean));
    } else {
      setTourStep(function(s) { return s + 1; });
    }
  }

  // ── Free-choice egg list (exclude determined eggs by file) ────────────────────
  var usedFiles = det.map(function(e) { return e.file; });
  var freeEggs = ALL_EGGS.filter(function(e) {
    if (usedFiles.includes(e.file)) return false;
    if (!freeSearch) return true;
    return (e.label + e.crest + e.desc).toLowerCase().includes(freeSearch.toLowerCase());
  });

  // ── Shared layout helpers ─────────────────────────────────────────────────────
  function JijimonBubble({ children, wide }) {
    return (
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:24,maxWidth:wide?780:560,width:"100%",padding:"0 16px" }}>
        <div style={{ display:"flex",alignItems:"flex-end",gap:20,width:"100%" }}>
          <div style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
            <img src="/sprites/jijimon.webp" alt="Jijimon"
              style={{ height:120,imageRendering:"pixelated",filter:"drop-shadow(0 4px 12px rgba(255,215,0,0.3))" }} />
            <div style={{ fontSize:9,color:T.gold,letterSpacing:2,fontWeight:900 }}>JIJIMON</div>
          </div>
          <div onClick={handleTextClick}
            style={{ flex:1,background:T.bgCard,border:"2px solid "+T.gold,boxShadow:"4px 4px 0 "+T.gold,
              padding:"16px 18px",cursor:textDone?"pointer":"text",position:"relative",minHeight:90 }}>
            <pre style={{ margin:0,fontFamily:"'Nunito',sans-serif",fontSize:12,color:T.text,whiteSpace:"pre-wrap",lineHeight:1.7 }}>
              {displayed}
              {!textDone && <span style={{ opacity:0.6,animation:"cursorBlink 1s step-end infinite" }}>▌</span>}
            </pre>
            {textDone && (
              <div style={{ position:"absolute",bottom:8,right:12,fontSize:9,color:T.gold,letterSpacing:1 }}>
                CLICK TO CONTINUE ▶
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }

  function BabySpeech({ digiId, text }) {
    if (!digiId || !text) return null;
    return (
      <div style={{ display:"flex",alignItems:"center",gap:12,alignSelf:"flex-end" }}>
        <div style={{ background:T.bgCard,border:"2px solid "+T.teal,boxShadow:"2px 2px 0 "+T.teal,padding:"8px 14px",maxWidth:200 }}>
          <div style={{ fontSize:10,color:T.teal,lineHeight:1.55 }}>{text}</div>
        </div>
        <div style={{ animation:"floatBob 2.2s ease-in-out infinite" }}>
          <DigiSprite digimonId={digiId} mood="happy" size={56} animate={true} />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif",
      color:T.text,zIndex:9999,overflow:"auto",padding:"32px 16px" }}>

      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes eggShake    { 0%{transform:rotate(0)} 25%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} 75%{transform:rotate(-3deg)} 100%{transform:rotate(0)} }
        @keyframes flashWhite  { 0%{opacity:0} 20%{opacity:0.85} 100%{opacity:0} }
        @keyframes babyReveal  { 0%{transform:scale(0) translateY(20px);opacity:0} 60%{transform:scale(1.15) translateY(-4px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes floatBob    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes slideUp     { 0%{transform:translateY(24px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes crestPulse  { 0%,100%{box-shadow:0 0 12px var(--cc,#FFD700)} 50%{box-shadow:0 0 32px var(--cc,#FFD700)} }
        @keyframes optionIn    { 0%{transform:translateX(-12px);opacity:0} 100%{transform:translateX(0);opacity:1} }
        @keyframes tourFade    { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes surpriseIn  { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.1) rotate(2deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
      `}</style>

      {/* White flash on hatch */}
      {flash && (
        <div style={{ position:"fixed",inset:0,background:"white",pointerEvents:"none",
          animation:"flashWhite 0.6s ease-out forwards",zIndex:10000 }} />
      )}

      {/* ── WELCOME ───────────────────────────────────────────────────────────── */}
      {phase === "welcome" && (
        <JijimonBubble>
          <div style={{ textAlign:"center",animation:"slideUp 0.6s ease 0.2s both" }}>
            <div style={{ fontSize:10,color:T.textMid,letterSpacing:2 }}>DAILYDIGIVOLVE — FIRST ARRIVAL</div>
          </div>
        </JijimonBubble>
      )}

      {/* ── QUIZ ──────────────────────────────────────────────────────────────── */}
      {phase === "quiz" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:28,maxWidth:560,width:"100%" }}>
          <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:6 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:9,color:T.textMid,letterSpacing:1 }}>
              <span>JIJIMON'S QUESTIONNAIRE</span>
              <span>{qIdx+1} / {QUIZ_QUESTIONS.length}</span>
            </div>
            <div style={{ height:3,background:T.border,position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",left:0,top:0,height:"100%",background:T.gold,
                transition:"width 0.4s ease",width:(qIdx/QUIZ_QUESTIONS.length*100)+"%" }} />
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"flex-end",gap:20,width:"100%" }}>
            <img src="/sprites/jijimon.webp" alt="Jijimon"
              style={{ height:90,imageRendering:"pixelated",flexShrink:0 }} />
            <div style={{ flex:1,background:T.bgCard,border:"2px solid "+T.gold,
              boxShadow:"4px 4px 0 "+T.gold,padding:"14px 16px" }}>
              <div style={{ fontSize:13,fontWeight:900,lineHeight:1.5 }}>{QUIZ_QUESTIONS[qIdx].question}</div>
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,width:"100%" }}>
            {QUIZ_QUESTIONS[qIdx].options.map(function(opt,i) {
              return (
                <button key={i} onClick={function(){ handleAnswer(opt.crest); }}
                  style={{ background:T.bgCard,border:"2px solid "+T.border,boxShadow:"3px 3px 0 "+T.border,
                    color:T.text,textAlign:"left",padding:"12px 16px",cursor:"pointer",
                    fontFamily:"inherit",fontSize:12,fontWeight:700,lineHeight:1.4,
                    animation:"optionIn 0.25s ease "+(i*0.06)+"s both",
                    transition:"border-color 0.1s,box-shadow 0.1s,background 0.1s" }}
                  onMouseEnter={function(e){ e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.boxShadow="3px 3px 0 "+T.gold; e.currentTarget.style.background="rgba(255,215,0,0.05)"; }}
                  onMouseLeave={function(e){ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow="3px 3px 0 "+T.border; e.currentTarget.style.background=T.bgCard; }}>
                  <span style={{ color:T.gold,marginRight:8 }}>{"ABCD"[i]}.</span>{opt.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RESULT ────────────────────────────────────────────────────────────── */}
      {phase === "result" && (
        <JijimonBubble>
          {textDone && topCrest && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12,animation:"slideUp 0.5s ease both" }}>
              <div style={{ padding:"18px 32px",border:"2px solid "+crestColor,boxShadow:"4px 4px 0 "+crestColor,
                textAlign:"center",background:"rgba(0,0,0,0.3)","--cc":crestColor,
                animation:"crestPulse 2s ease-in-out infinite" }}>
                <div style={{ fontSize:28 }}>{crestIcon}</div>
                <div style={{ fontSize:9,color:crestColor,letterSpacing:3,marginTop:4 }}>YOUR CREST</div>
                <div style={{ fontSize:22,fontWeight:900,color:crestColor,marginTop:4 }}>{topCrest.toUpperCase()}</div>
                <div style={{ fontSize:10,color:T.textMid,marginTop:6 }}>{CREST_INFO[topCrest]?.desc}</div>
              </div>
              <div style={{ fontSize:10,color:T.textMid,letterSpacing:1 }}>TWO EGGS HAVE BEEN CHOSEN FOR YOU — CLICK TO CONTINUE</div>
            </div>
          )}
        </JijimonBubble>
      )}

      {/* ── HATCH 1 ───────────────────────────────────────────────────────────── */}
      {phase === "hatch_1" && det[0] && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:28 }}>
          <div style={{ display:"flex",alignItems:"flex-end",gap:20,maxWidth:560,width:"100%",padding:"0 16px" }}>
            <img src="/sprites/jijimon.webp" alt="Jijimon"
              style={{ height:90,imageRendering:"pixelated",flexShrink:0 }} />
            <div style={{ flex:1,background:T.bgCard,border:"2px solid "+crestColor,
              boxShadow:"3px 3px 0 "+crestColor,padding:"12px 16px" }}>
              <div style={{ fontSize:12,lineHeight:1.7,color:T.text }}>
                This is your first partner. They have waited a long time to meet you.<br/>
                <span style={{ color:crestColor,fontWeight:900 }}>When you are ready — hatch the egg.</span>
              </div>
            </div>
          </div>
          <div style={{ position:"relative",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div style={{ position:"absolute",inset:-48,background:"radial-gradient(circle,"+crestColor+"25 0%,transparent 70%)",
              animation:"crestPulse 1.2s ease-in-out infinite","--cc":crestColor,pointerEvents:"none" }} />
            <DigiEgg eggFile={det[0].file} label={det[0].label} desc={det[0].desc}
              phase={phase1} size={120} onHatched={onHatched1} />
          </div>
          {phase1 === "idle" && (
            <button onClick={hatchEgg1}
              style={{ background:crestColor,color:"#000",border:"2px solid "+crestColor,
                boxShadow:"4px 4px 0 rgba(0,0,0,0.5)",padding:"12px 40px",
                fontFamily:"inherit",fontSize:13,fontWeight:900,cursor:"pointer",letterSpacing:2,
                animation:"slideUp 0.4s ease both" }}>
              HATCH!
            </button>
          )}
        </div>
      )}

      {/* ── REVEAL 1 ──────────────────────────────────────────────────────────── */}
      {phase === "reveal_1" && (
        <JijimonBubble>
          {show1 && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:10,animation:"babyReveal 0.6s ease both" }}>
              <div style={{ animation:"floatBob 2.5s ease-in-out infinite" }}>
                <DigiSprite digimonId={id1} mood="happy" size={96} animate={true} />
              </div>
              <div style={{ background:T.bgCard,border:"2px solid "+crestColor,boxShadow:"3px 3px 0 "+crestColor,padding:"6px 20px" }}>
                <div style={{ fontSize:11,fontWeight:900,color:crestColor,letterSpacing:1 }}>{babyName(id1).toUpperCase()}</div>
              </div>
              {textDone && (
                <div style={{ background:T.bgCard,border:"2px solid "+T.teal,padding:"8px 14px",textAlign:"center",animation:"slideUp 0.4s ease both" }}>
                  <div style={{ fontSize:10,color:T.teal }}>Nice to meet you, {name}! I've been waiting!</div>
                </div>
              )}
            </div>
          )}
        </JijimonBubble>
      )}

      {/* ── SURPRISE (egg 2 auto-hatches) ─────────────────────────────────────── */}
      {phase === "surprise" && det[1] && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:28 }}>
          <div style={{ display:"flex",alignItems:"flex-end",gap:20,maxWidth:580,width:"100%",padding:"0 16px" }}>
            <img src="/sprites/jijimon.webp" alt="Jijimon"
              style={{ height:90,imageRendering:"pixelated",flexShrink:0 }} />
            <div style={{ flex:1,background:T.bgCard,border:"2px solid "+T.gold,
              boxShadow:"4px 4px 0 "+T.gold,padding:"14px 16px" }}>
              <div style={{ fontSize:12,lineHeight:1.7 }}>
                Ah — there it is. A second egg, drawn here by your strength.<br/>
                The Digital World is offering you a gift.<br/>
                <span style={{ color:T.gold,fontWeight:900 }}>Hold on — it is already hatching!</span>
              </div>
            </div>
          </div>
          {/* Baby 1 still visible in corner */}
          {show1 && (
            <div style={{ alignSelf:"flex-start",paddingLeft:16,display:"flex",alignItems:"center",gap:10,opacity:0.7 }}>
              <DigiSprite digimonId={id1} mood="happy" size={48} animate={true} />
              <div style={{ fontSize:9,color:T.teal }}>Huh? Another egg?!</div>
            </div>
          )}
          {/* Egg 2 auto-hatching */}
          <div style={{ position:"relative",display:"flex",alignItems:"center",justifyContent:"center",animation:"surpriseIn 0.6s ease both" }}>
            <div style={{ position:"absolute",inset:-48,background:"radial-gradient(circle,"+T.gold+"20 0%,transparent 70%)",
              animation:"crestPulse 0.9s ease-in-out infinite","--cc":T.gold,pointerEvents:"none" }} />
            <DigiEgg eggFile={det[1].file} label={det[1].label} desc={det[1].desc}
              phase={phase2} size={120} onHatched={onHatched2} />
          </div>
        </div>
      )}

      {/* ── REVEAL 2 ──────────────────────────────────────────────────────────── */}
      {phase === "reveal_2" && (
        <JijimonBubble>
          <div style={{ display:"flex",gap:24,justifyContent:"center",flexWrap:"wrap" }}>
            {show1 && (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
                <div style={{ animation:"floatBob 2.5s ease-in-out infinite" }}>
                  <DigiSprite digimonId={id1} mood="happy" size={72} animate={true} />
                </div>
                <div style={{ fontSize:9,fontWeight:900,color:crestColor,letterSpacing:1 }}>{babyName(id1).toUpperCase()}</div>
                {textDone && <div style={{ fontSize:9,color:T.teal,maxWidth:90,textAlign:"center" }}>Team is growing!</div>}
              </div>
            )}
            {show2 && (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,animation:"babyReveal 0.6s ease both" }}>
                <div style={{ animation:"floatBob 2.8s ease-in-out infinite" }}>
                  <DigiSprite digimonId={id2} mood="happy" size={72} animate={true} />
                </div>
                <div style={{ fontSize:9,fontWeight:900,color:T.gold,letterSpacing:1 }}>{babyName(id2).toUpperCase()}</div>
                {textDone && <div style={{ fontSize:9,color:T.teal,maxWidth:90,textAlign:"center" }}>Nice to meet everyone!</div>}
              </div>
            )}
          </div>
        </JijimonBubble>
      )}

      {/* ── EGG CHOOSE ────────────────────────────────────────────────────────── */}
      {phase === "egg_choose" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:20,maxWidth:700,width:"100%" }}>
          <div style={{ display:"flex",alignItems:"flex-end",gap:16,width:"100%",padding:"0 16px" }}>
            <img src="/sprites/jijimon.webp" alt="Jijimon"
              style={{ height:80,imageRendering:"pixelated",flexShrink:0 }} />
            <div style={{ flex:1,background:T.bgCard,border:"2px solid "+crestColor,
              boxShadow:"3px 3px 0 "+crestColor,padding:"12px 14px" }}>
              <div style={{ fontSize:11,fontWeight:900,color:crestColor,marginBottom:6,letterSpacing:1 }}>
                {crestIcon} YOUR CHOICE — browse all eggs and pick the one that calls to you.
              </div>
              {/* Search */}
              <input value={freeSearch} onChange={function(e){ setFreeSearch(e.target.value); }}
                placeholder="search by name or crest..."
                style={{ width:"100%",background:T.bg,border:"1px solid "+T.border,color:T.text,
                  padding:"6px 10px",fontFamily:"inherit",fontSize:11,outline:"none",boxSizing:"border-box" }} />
            </div>
          </div>
          {/* Mini current team */}
          <div style={{ display:"flex",gap:16,justifyContent:"center",opacity:0.75 }}>
            {[id1,id2].filter(Boolean).map(function(id,i){
              return (
                <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                  <DigiSprite digimonId={id} mood="happy" size={40} animate={true} />
                  <div style={{ fontSize:8,color:T.textMid }}>{babyName(id)}</div>
                </div>
              );
            })}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
              width:40,height:40,border:"2px dashed "+T.border,fontSize:18,color:T.textDim }}>?</div>
          </div>
          {/* Egg grid */}
          <div style={{ width:"100%",maxHeight:320,overflowY:"auto",padding:"0 16px" }}>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8 }}>
              {freeEggs.map(function(egg) {
                var sel = chosenEgg && chosenEgg.file === egg.file;
                return (
                  <div key={egg.file} onClick={function(){ setChosenEgg(egg); }}
                    style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                      padding:"10px 6px",background:sel?"rgba(255,215,0,0.08)":T.bgCard,
                      border:"1.5px solid "+(sel?T.gold:T.border),
                      boxShadow:sel?"0 0 10px rgba(255,215,0,0.3)":"none",
                      cursor:"pointer",transition:"all 0.12s" }}>
                    <div style={{ width:64,height:64,
                      backgroundImage:"url('/sprites/digitama/"+egg.file+".png')",
                      backgroundSize:"192px 64px", backgroundPosition:"0px 0px",
                      backgroundRepeat:"no-repeat",imageRendering:"pixelated" }} />
                    <div style={{ fontSize:8,fontWeight:900,color:sel?T.gold:T.text,textAlign:"center",letterSpacing:0.5 }}>{egg.label}</div>
                    <div style={{ fontSize:7,color:T.textMid,textAlign:"center" }}>{egg.crest}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {chosenEgg && (
            <div style={{ display:"flex",alignItems:"center",gap:16,padding:"0 16px",animation:"slideUp 0.3s ease both" }}>
              <div style={{ flex:1,background:T.bgCard,border:"1.5px solid "+T.gold,padding:"10px 14px" }}>
                <div style={{ fontSize:11,fontWeight:900,color:T.gold }}>{chosenEgg.label}</div>
                <div style={{ fontSize:10,color:T.textMid,marginTop:3 }}>{chosenEgg.desc}</div>
              </div>
              <button onClick={hatchEgg3}
                style={{ background:T.gold,color:"#000",border:"2px solid "+T.gold,
                  boxShadow:"4px 4px 0 rgba(0,0,0,0.5)",padding:"12px 24px",
                  fontFamily:"inherit",fontSize:12,fontWeight:900,cursor:"pointer",letterSpacing:2,flexShrink:0 }}>
                CHOOSE!
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── HATCH 3 ───────────────────────────────────────────────────────────── */}
      {phase === "hatch_3" && chosenEgg && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:28 }}>
          <div style={{ fontSize:11,color:T.textMid,letterSpacing:2 }}>YOUR EGG IS HATCHING...</div>
          <div style={{ position:"relative",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div style={{ position:"absolute",inset:-48,background:"radial-gradient(circle,"+crestColor+"25 0%,transparent 70%)",
              animation:"crestPulse 0.9s ease-in-out infinite","--cc":crestColor,pointerEvents:"none" }} />
            <DigiEgg eggFile={chosenEgg.file} phase={phase3} size={128} onHatched={onHatched3} />
          </div>
        </div>
      )}

      {/* ── REVEAL 3 ──────────────────────────────────────────────────────────── */}
      {phase === "reveal_3" && (
        <JijimonBubble wide>
          <div style={{ display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",width:"100%" }}>
            {[[id1,crestColor],[id2,T.gold],[id3,T.teal]].map(function(pair,i){
              var id = pair[0]; var col = pair[1];
              var visible = i === 0 ? show1 : i === 1 ? show2 : show3;
              if (!id || !visible) return null;
              return (
                <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                  animation:i===2?"babyReveal 0.7s ease both":undefined }}>
                  <div style={{ animation:"floatBob "+(2.2+i*0.3)+"s ease-in-out infinite" }}>
                    <DigiSprite digimonId={id} mood="happy" size={80} animate={true} />
                  </div>
                  <div style={{ background:T.bgCard,border:"2px solid "+col,boxShadow:"2px 2px 0 "+col,padding:"4px 14px" }}>
                    <div style={{ fontSize:9,fontWeight:900,color:col,letterSpacing:1 }}>{babyName(id).toUpperCase()}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {textDone && (
            <button onClick={function(){ setPhase("tour"); }}
              style={{ background:crestColor,color:"#000",border:"2px solid "+crestColor,
                boxShadow:"4px 4px 0 rgba(0,0,0,0.5)",padding:"12px 36px",
                fontFamily:"inherit",fontSize:13,fontWeight:900,cursor:"pointer",letterSpacing:2,
                animation:"slideUp 0.4s ease both" }}>
              BEGIN THE TOUR →
            </button>
          )}
        </JijimonBubble>
      )}

      {/* ── TOUR ──────────────────────────────────────────────────────────────── */}
      {phase === "tour" && (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:28,
          maxWidth:640,width:"100%",animation:"tourFade 0.4s ease both" }}>
          <div style={{ display:"flex",gap:6 }}>
            {TOUR.map(function(_,i){
              return <div key={i} style={{ width:i===tourStep?20:6,height:6,
                background:i===tourStep?T.gold:T.border,transition:"all 0.3s" }} />;
            })}
          </div>
          <div style={{ fontSize:9,letterSpacing:3,fontWeight:900,color:T.gold,borderBottom:"1px solid "+T.gold,paddingBottom:4 }}>
            {TOUR[tourStep].icon} {TOUR[tourStep].section}
          </div>
          <div style={{ display:"flex",alignItems:"flex-end",gap:20,width:"100%" }}>
            <img src="/sprites/jijimon.webp" alt="Jijimon"
              style={{ height:90,imageRendering:"pixelated",flexShrink:0 }} />
            <div style={{ flex:1,background:T.bgCard,border:"2px solid "+T.gold,
              boxShadow:"4px 4px 0 "+T.gold,padding:"14px 16px" }}>
              <div style={{ fontSize:12,lineHeight:1.7 }}>
                {tourStep === 4
                  ? "And so, Tamer " + name + ", from this day forward — every task you complete, every habit you build — your three partners feel it all. Go forward with courage. I will always be watching."
                  : TOUR[tourStep].jijimon}
              </div>
            </div>
          </div>
          {/* All 3 babies + speech from one of them */}
          <div style={{ display:"flex",gap:16,justifyContent:"flex-end",alignItems:"center",width:"100%" }}>
            <div style={{ background:T.bgCard,border:"2px solid "+T.teal,boxShadow:"2px 2px 0 "+T.teal,
              padding:"8px 14px",maxWidth:220 }}>
              <div style={{ fontSize:10,color:T.teal,lineHeight:1.55 }}>{TOUR[tourStep].baby}</div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              {[id1,id2,id3].filter(Boolean).map(function(id,i){
                return (
                  <div key={i} style={{ animation:"floatBob "+(2+i*0.35)+"s ease-in-out infinite" }}>
                    <DigiSprite digimonId={id} mood="happy" size={48} animate={true} />
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={handleTourNext}
            style={{ background:tourStep===TOUR.length-1?crestColor:T.bgCard,
              color:tourStep===TOUR.length-1?"#000":T.gold,
              border:"2px solid "+(tourStep===TOUR.length-1?crestColor:T.gold),
              boxShadow:"4px 4px 0 "+(tourStep===TOUR.length-1?crestColor:T.gold),
              padding:"12px 36px",fontFamily:"inherit",fontSize:12,
              fontWeight:900,cursor:"pointer",letterSpacing:2 }}>
            {tourStep===TOUR.length-1?"LET'S GO, "+name.toUpperCase()+"!":"NEXT →"}
          </button>
        </div>
      )}
    </div>
  );
}

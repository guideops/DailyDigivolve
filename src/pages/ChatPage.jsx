// ─── ChatPage — AI Digimon companion chat ─────────────────────────────────────
// Props:
//   digimon   — active party[0] Digimon object
//   tasks     — full tasks array from App state
//
// The Claude API key is called through the Cloudflare Worker at /functions/api/chat.js
// During local dev (USE_MOCK = true) no API calls are made — free testing.

import { useState, useEffect, useRef } from "react";
import DigiSprite from "../components/DigiSprite.jsx";
import {
  CHAT_PERSONALITIES,
  buildSystemPrompt,
  getOpeningMessage,
  getQuickReplies,
} from "../data/personalities.js";

// ── Toggle this to avoid API calls while testing UI ───────────────────────────
const USE_MOCK = false;

const MOCK_REPLIES = {
  lively:  "Let's GO!! You're doing amazing, Tamer!! Keep crushing those tasks!! 🔥",
  stoic:   "Noted. Continue with your objectives.",
  playful: "Quest acknowledged! Let's grind that XP~ 🎮",
  stern:   "Acknowledged. Complete your remaining tasks immediately.",
  durable: "Steady, Tamer. One task at a time. We carry this together.",
  brainy:  "Analysis complete. Recommend prioritising high-difficulty tasks for optimal stat gains.",
};

function tsNow() {
  var d = new Date();
  return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0");
}

function TypingDots({ color }) {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center", padding:"4px 0" }}>
      {[0,1,2].map(function(i) {
        return (
          <div key={i} style={{
            width:7, height:7, borderRadius:"50%",
            background: color || "#7EB8F7",
            animation: "dtBounce 1s "+(i*0.18)+"s infinite ease-in-out",
          }} />
        );
      })}
    </div>
  );
}

export default function ChatPage({ digimon, tasks }) {
  var pId    = digimon.personality || "lively";
  var pDef   = CHAT_PERSONALITIES[pId] || CHAT_PERSONALITIES.lively;
  var accent = pDef.color;

  var [messages,   setMessages]  = useState([]);
  var [input,      setInput]     = useState("");
  var [loading,    setLoading]   = useState(false);
  var [error,      setError]     = useState(null);
  var [mood,       setMood]      = useState(pDef.mood);

  var bottomRef = useRef(null);
  var inputRef  = useRef(null);

  // Opening message on mount / personality change
  useEffect(function() {
    var opening = getOpeningMessage(digimon, tasks, pId);
    setMessages([{ role:"digimon", text:opening, time:tsNow(), mood:pDef.mood }]);
    setMood(pDef.mood);
    setError(null);
  }, [pId]);

  // Auto-scroll
  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    text = (text || input).trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    var userMsg = { role:"user", text:text, time:tsNow() };
    var history = messages.concat([userMsg]);
    setMessages(history);
    setLoading(true);

    try {
      var reply;

      if (USE_MOCK) {
        // Free local testing — no API call
        await new Promise(function(r) { setTimeout(r, 800); });
        reply = MOCK_REPLIES[pId] || "...";
      } else {
        // Call through Cloudflare Worker (key is safe server-side)
        // In local dev this calls vite proxy → functions/api/chat.js
        var claudeMessages = history
          .filter(function(m) { return m.role === "user" || m.role === "digimon"; })
          .map(function(m) { return { role: m.role === "user" ? "user" : "assistant", content: m.text }; });

        // Ensure starts with user
        if (claudeMessages.length > 0 && claudeMessages[0].role === "assistant") {
          claudeMessages = claudeMessages.slice(1);
        }

        var res = await fetch("/api/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: buildSystemPrompt(digimon, tasks, pId),
            messages:     claudeMessages,
          }),
        });

        if (!res.ok) {
          var errData = await res.json().catch(function(){return {};});
          throw new Error(errData.error || "API error " + res.status);
        }

        var data = await res.json();
        reply = data.reply || "...";
      }

      // Detect mood from reply text
      var low = reply.toLowerCase();
      var replyMood = "happy";
      if (low.match(/urgent|incomplete|unacceptable|behind|overdue|disappoint/)) replyMood = "angry";
      else if (low.match(/steady|carry|endure|consistent|one step/))              replyMood = "stoic";
      else if (low.match(/proud|excellent|complete|amazing|great|fire|crush/))    replyMood = "happy";

      setMood(replyMood);
      setMessages(function(prev) {
        return prev.concat([{ role:"digimon", text:reply, time:tsNow(), mood:replyMood }]);
      });
    } catch(err) {
      setError(err.message || "Connection error");
      setMessages(function(prev) {
        return prev.concat([{
          role:"digimon",
          text:"*connection interference* ... Lost signal for a second. Try again?",
          time:tsNow(), mood:"sad",
        }]);
      });
    } finally {
      setLoading(false);
      setTimeout(function() { inputRef.current && inputRef.current.focus(); }, 100);
    }
  }

  var quickReplies = getQuickReplies(pId);
  var spriteInfo   = { stage: digimon.stage };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 120px)" }}>

      {/* Personality / status header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 0 12px", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:12, flexShrink:0 }}>
        <DigiSprite digimonId={digimon.speciesId} mood={mood} size={40} animate />
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:800 }}>{digimon.name}</span>
            <span style={{ background:accent+"22", border:"1px solid "+accent+"55", color:accent, fontSize:10, padding:"1px 7px", borderRadius:20, fontWeight:700 }}>{pDef.label}</span>
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>
            Lv.{digimon.level} · {digimon.stage} · 🔥 {digimon.streak}d streak
          </div>
        </div>
        {USE_MOCK && (
          <span style={{ fontSize:9, color:"#FFB34D", background:"rgba(255,183,77,0.15)", border:"1px solid rgba(255,183,77,0.3)", padding:"2px 8px", borderRadius:10 }}>
            MOCK MODE
          </span>
        )}
      </div>

      {/* Message feed */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10 }}>

        <div style={{ textAlign:"center", marginBottom:4 }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.04)", padding:"2px 12px", borderRadius:20 }}>Today</span>
        </div>

        {messages.map(function(msg, i) {
          var isUser = msg.role === "user";
          return (
            <div key={i} style={{ display:"flex", flexDirection:isUser?"row-reverse":"row", alignItems:"flex-end", gap:8, animation:"msgIn 0.2s ease" }}>
              {!isUser && (
                <DigiSprite digimonId={digimon.speciesId} mood={msg.mood||"happy"} size={28} animate={false} />
              )}
              <div style={{ maxWidth:"74%", display:"flex", flexDirection:"column", alignItems:isUser?"flex-end":"flex-start", gap:2 }}>
                <div style={{
                  background:   isUser ? accent : "rgba(255,255,255,0.07)",
                  border:       isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding:      "10px 14px",
                  color:        isUser ? "#0d0f1a" : "#fff",
                  fontSize:     13,
                  lineHeight:   1.55,
                  fontWeight:   isUser ? 500 : 400,
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", padding:"0 4px" }}>{msg.time}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <DigiSprite digimonId={digimon.speciesId} mood="happy" size={28} animate={false} />
            <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"18px 18px 18px 4px", padding:"10px 16px" }}>
              <TypingDots color={accent} />
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign:"center", fontSize:11, color:"#FF8080", background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:10, padding:"8px 14px" }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", padding:"10px 0 6px", flexShrink:0 }}>
        {quickReplies.map(function(qr) {
          return (
            <button key={qr} onClick={function(){sendMessage(qr);}} disabled={loading}
              style={{ padding:"6px 12px", borderRadius:20, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.65)", fontSize:11, cursor:loading?"not-allowed":"pointer", whiteSpace:"nowrap", fontFamily:"inherit", opacity:loading?0.5:1, flexShrink:0 }}>
              {qr}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", paddingTop:6, flexShrink:0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={function(e){ setInput(e.target.value); }}
          onKeyDown={function(e){ if (e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); } }}
          placeholder={"Message "+digimon.name+"..."}
          rows={1}
          disabled={loading}
          style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:22, padding:"10px 16px", color:"#fff", fontSize:13, outline:"none", maxHeight:80, overflowY:"auto", lineHeight:1.4, resize:"none", fontFamily:"inherit" }}
        />
        <button onClick={function(){sendMessage();}} disabled={loading || !input.trim()}
          style={{ width:42, height:42, borderRadius:"50%", background:input.trim()&&!loading?accent:"rgba(255,255,255,0.08)", border:"none", cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.2s" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke={input.trim()&&!loading?"#0d0f1a":"rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()&&!loading?"#0d0f1a":"rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

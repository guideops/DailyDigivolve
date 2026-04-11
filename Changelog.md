# DailyDigivolve — Project Changelog

All changes, decisions, and assistance made in this project tab.
Format: [DATE] [TYPE] Description

Types:
  FEAT     — new feature or capability added
  FIX      — bug or error resolved
  REFACTOR — code restructured without behaviour change
  DEPLOY   — deployment or infrastructure change
  DECISION — architectural or strategic decision made
  RENAME   — naming or branding change
  UI       — visual or interface change
  SECURITY — security-related change
  DOCS     — documentation added or updated

---

## Session 1 — 2026-03-22

### Strategy & Analysis

[DECISION] Assessed feasibility of building a smartwatch + mobile app integration
           for the existing DigiTask webapp at digitask-pi.vercel.app
           Verdict: Fully feasible using Vercel + Supabase + React Native stack

[DECISION] Determined phone app must be built before watch app
           Reason: watchOS and Wear OS companion apps require a paired phone app to exist first
           The watch is never a standalone app — it relays through the phone

[DECISION] Proprietary DigiVice hardware approved as long-term direction
           Stack: ESP32-S3, LVGL display, BLE GATT, 3D printed enclosure → custom PCB → ODM
           Three hardware tiers identified: Prototype ($50–200), Custom PCB ($2k–15k), ODM ($20k+)

[DECISION] Apple Watch companion app still worth building alongside DigiVice
           Reason: 33M+ existing users, validates wrist engagement cheaply before hardware investment
           These serve different customer segments — not competing products

[DECISION] Moved from Vercel to Cloudflare Pages for hosting
           Reason: Unlimited bandwidth, commercial use allowed on free tier, no overage risk
           Vercel Hobby plan blocks commercial use once DigiPass revenue starts

[DECISION] Supabase selected as database/auth layer when accounts are added
           Free tier: 50k MAU, 500MB DB. Pro: $25/mo for production use
           Architecture: Supabase as single source of truth, all interfaces sync through it

---

### Branding

[RENAME] Project renamed from "DigiTask" to "DailyDigivolve"
         Reason: "digitask" is too common and not distinctive enough for search/discovery
         New domain target: dailydigivolve.com
         Cloudflare Pages URL: dailydigivolve.pages.dev

---

### Security Audit

[SECURITY] Identified critical localStorage vulnerability in original codebase
           All game state (Digimon, XP, tasks, streaks) stored in unencrypted localStorage
           Any user can open DevTools console and set arbitrary values (infinite XP, max level)
           Fix: Move state to Supabase with server-side validation

[SECURITY] Identified missing Content Security Policy header
           Standard Vite deploy ships without CSP — XSS surface unprotected
           Fix: Add headers config to Cloudflare Pages settings

[SECURITY] Confirmed no API keys exposed in HTML shell
           No source maps being served publicly
           Git repo not publicly discoverable

[SECURITY] Claude API key moved server-side via Cloudflare Worker
           File: functions/api/chat.js
           Key stored in Cloudflare Environment Variables, never reaches browser

---

### Code — Initial Reconstruction

[FEAT] Reconstructed full DigiTask app as digitask-full.jsx from patch notes
       Features implemented:
       - 30+ Digimon across all evolution lines from patch notes
       - Full ABI system, personality system, bonus stats
       - Task system: One-Time, Daily, Recurring with priority/difficulty XP multipliers
       - Interactive turn-by-turn battle system
       - DigiFarm with Playground mode
       - Weekly Boss with two phases
       - Campaign mode (60 stages)
       - Neemon's Store with bits currency
       - Digidex with discovery tracking
       - Leaderboard and player profiles
       - Dark/light mode toggle
       - Drag-and-drop team reorder
       - Evolution with ABI gain, X-Antibody forms, DNA Digivolution

---

### Code — Project Structure Refactor

[REFACTOR] Split monolithic digitask-full.jsx into proper project structure
           Before: single 1,210-line file with everything mixed together
           After: 16 files across organised folders

           New structure:
           src/
             data/
               digimon.js       — all Digimon species data (DIGIMON_DB, DIGIMON_MAP)
               constants.js     — game constants, XP multipliers, colours
               engine.js        — pure game logic functions (no React dependency)
               personalities.js — AI chat personality definitions and prompt builders
             components/
               DigiSprite.jsx   — pixel art SVG Digimon renderer
               ui.jsx           — shared UI primitives (Bar, Tag, Btn)
             pages/
               ChatPage.jsx     — AI companion chat page
             App.jsx            — main app, navigation, all page routing
             main.jsx           — React entry point
           functions/
             api/
               chat.js          — Cloudflare Worker, proxies Claude API
           index.html
           package.json
           vite.config.js
           .gitignore
           README.md

[DOCS] README.md written — public-facing, covers:
       - What DailyDigivolve is (elevator pitch)
       - Full feature list from patch notes
       - Hardware roadmap (DigiVice tiers)
       - Tech stack table
       - Project folder structure
       - Local dev setup instructions
       - Cloudflare Pages deployment steps
       - Contributing guidelines
       - Acknowledgements (Bandai IP notice)

---

### AI Chat Feature

[FEAT] AI Digimon companion chat implemented
       File: src/pages/ChatPage.jsx
       File: src/data/personalities.js

       Features:
       - SMS-style chat interface with typing indicator
       - 6 personality types: Lively, Stoic, Playful, Stern, Durable, Brainy
       - Each personality has distinct system prompt, voice, and vocabulary
       - Claude receives live task context on every message:
         pending tasks, urgent items, streak, HP, completion rate
       - Digimon sprite mood changes based on reply content (happy/angry/stoic/sad)
       - Quick reply suggestions per personality
       - Opening message generated from personality + current game state
       - USE_MOCK = true flag for zero-cost UI testing (no API calls)
       - Calls through /api/chat Cloudflare Worker (key never in browser)

[FEAT] Cloudflare Worker created for Claude API proxy
       File: functions/api/chat.js
       Model: claude-haiku-4-5-20251001 (cheapest, fast enough for chat)
       Max tokens: 300 per reply
       Key stored in: Cloudflare Environment Variables → CLAUDE_API_KEY

---

### Cost Analysis

[DECISION] Claude API cost confirmed negligible for solo testing
           Cost per message turn: ~$0.0000033 (Sonnet) / ~$0.0000011 (Haiku)
           $5 free credits on new API account ≈ 1.5M+ messages at Haiku rates
           Production cost at 1,000 DAU × 10 messages/day: ~$1/month on Haiku

---

### Deployment

[DEPLOY] Project deployed to Cloudflare Pages
         URL: dailydigivolve.pages.dev
         Build command: npm run build
         Output directory: dist
         Framework: Vite

[FIX] Resolved Cloudflare build failure:
      Error: "Rollup failed to resolve import /src/main.jsx"
      Cause: Files uploaded flat to GitHub root, no src/ subfolder structure
      Fix: Recreated all files using GitHub's web editor with correct paths
           (typing src/main.jsx in filename box creates src/ folder automatically)

[FIX] Resolved GitHub upload issue with dotfiles (.gitignore, .dev.vars)
      Cause: GitHub's file upload UI blocks files starting with "."
      Fix: .gitignore created via GitHub web editor (Create new file → type .gitignore)
           .dev.vars NOT committed — local only, contains API key

---

### UI Overhaul

[UI] Full visual overhaul of App.jsx to match prototype aesthetic
     Changes:
     - App renamed from "DigiTask" to "DailyDigivolve" in top bar
     - Hero card: gradient background + grid dot pattern keyed to Digimon accent colour
     - Stat grid: 6 coloured chips (HP/SP/ATK/DEF/INT/SPD) on dashboard
     - Evolution overlay: larger sprite, stage name shown, cleaner animation
     - Battle system: full visual panels with HP bars and live battle log
     - Chat CTA card on dashboard prompting AI chat
     - CSS class-based styling: .card, .card-accent, .digi-card, .task-row etc.
     - Urgent tasks section with red highlight on dashboard
     - XP reward preview shown on each task row
     - Party strip on dashboard with drag-and-drop reorder

---

### Sprites

[FEAT] DigiSprite.jsx updated to use real sprite files
       File: src/components/DigiSprite.jsx
       Behaviour:
       1. Tries /sprites/{id}.gif first (animated)
       2. Falls back to /sprites/{id}.png if GIF missing
       3. Falls back to original SVG renderer if both missing
       Nothing breaks if a sprite file is missing — graceful degradation

       Sprite source: Google Drive community archive (16×16 dot sprites)
       https://drive.google.com/drive/folders/1EgoXHwlXNiurD4X_9WEgoyzm9OuWf_tf

       File naming: must match DIGIMON_DB id exactly
       Examples: agumon.gif, greymon.gif, agumon_x.gif, metalgreymon.gif
       Upload location in repo: public/sprites/

---

## Pending / Next Steps

[ ] Add Supabase — replace useState with real database
    Priority: Critical — nothing syncs until this exists

[ ] Add user accounts and auth (Supabase Auth)
    Priority: Critical — required for multi-device sync

[ ] Move game validation server-side (Cloudflare Worker)
    Priority: High — currently all XP/evolution logic runs in browser (cheatable)

[ ] Upload real sprite files to public/sprites/ in GitHub repo
    Priority: High — current fallback is SVG placeholder

[ ] Add CLAUDE_API_KEY to Cloudflare Environment Variables
    Priority: High — chat tab non-functional until this is set

[ ] Add CSP header to Cloudflare Pages config
    Priority: Medium — closes XSS surface

[ ] React Native mobile app (Expo)
    Priority: Medium — required before any watch companion app

[ ] Apple Watch / Wear OS companion app
    Priority: After mobile app exists

[ ] DigiVice ESP32 prototype
    Priority: After mobile app — funded by DigiPass revenue

[ ] Register dailydigivolve.com domain
    Priority: Soon — before going public

[ ] NZ company registration
    Priority: Before commercial revenue

---

## Session 2 — 2026-03-22 (continued)
 
[UI] Major UI overhaul — dark pixel art + Nomi three-column layout
     Decision: dark mode retained, pixel art borders added, Nomi layout adopted
     Files changed: src/App.jsx, index.html
 
     Layout changes:
     - Three-column desktop grid: 300px pet panel | flex main | 260px right panel
     - Mobile: left and right columns collapse, main content fills screen
     - Tablet (< 1080px): right column hidden
 
     Typography changes:
     - Press Start 2P imported via index.html Google Fonts link
     - Nunito imported alongside for body text
     - All labels/headings use px8/px9/px10/px12 CSS classes (Press Start 2P)
     - All body text uses Nunito 700/800
 
     Left pet panel (new):
     - Stage viewport with dot grid background, ground strip, bobbing animation
     - Speech bubble above Digimon — updates on click and on task completion
     - Pixel stat bars for HP, XP, Mood (with highlight shimmer)
     - Feed / Play / Rest / Train action buttons (pixel style)
     - Evolution near / ready banner (shimmer animation)
     - Saved stats banner linking to Team page
 
     Middle task panel (updated):
     - Streak row: three pixel stat cards (streak, done count, XP today)
     - Priority section labels separating task groups (⚡ HIGH / 🌿 MEDIUM / 💜 LOW)
     - Star difficulty rating (1–4 stars) on each task card
     - XP badge per task in gold pixel style
     - Coloured left border strip per priority level
     - Pixel tab filters for category and type
 
     Right panel (new):
     - Daily Quest card with progress bar (Complete 5 tasks = Rare Treat)
     - Inventory grid (8 slots, pixel style)
     - Activity log — updates live when tasks are completed or pet is interacted with
     - Party quick-view with drag-and-drop reorder
 
     Pixel art system:
     - Hard pixel borders: border: 2px solid + box-shadow: 3px 3px 0 (matching border colour)
     - All cards, buttons, tabs use this treatment
     - Floating pixel particle background (6 coloured squares)
     - Blink animation on nav logo dot
 
[UI] index.html updated to load Press Start 2P and Nunito from Google Fonts
 
[FEAT] Activity log now updates in real-time when:
       - Tasks are completed (logs task name and XP gained)
       - Pet actions are used (Feed/Play/Rest/Train)
       - Evolution occurs
 
[FEAT] Pet speech bubble updates on:
       - Click on Digimon sprite (random messages)
       - Task completion (shows XP gained)
       - Pet action button press
 
[DECISION] All conversations within this project tab share memory context
           Changes and decisions from all threads are referenced here
           Changelog maintained across all sessions in this tab

[FEAT] Full Supabase integration — replacing all hardcoded useState with real persistent data
[FEAT] User authentication — email/password + username, multi-user accounts
[FEAT] Data Hunt recurring tasks — day-of-week scheduling, only appear on correct day
[FEAT] Real Digimon progression — XP, evolution, ABI saved to database per user
[RENAME] Recurring tasks renamed to "Data Hunts" throughout UI and codebase
[SECURITY] All game state validation moved server-side via Cloudflare Worker

---

## Session 3 — 2026-04-11

### Crest System

[FEAT] Crest system implemented — 8 crests mapped to task templates
       Crests: Courage, Knowledge, Reliability, Care, Friendship, Sincerity, Hope, Light
       Each task template yields primary + secondary crest points on completion:
         Workout       → Courage (primary) + Care (secondary)
         Deep Work     → Knowledge + Reliability
         Recovery      → Care + Light
         Maintenance   → Reliability + Light
         Social        → Friendship + Care
         Reflection    → Sincerity + Knowledge
         Challenge     → Courage + Hope
         Neutral       → no crest points

[FEAT] Rolling 14-day crest alignment profile
       calcCrestProfile() computes weighted totals over a 60-day history (14-day active window)
       Returns: primary crest, secondary crest, percentages per crest (0–100%)
       Displayed as horizontal bars on Dashboard, left panel mini-widget, and Crests page

[FEAT] CRESTS navigation tab added (💎)
       Full-page alignment view: primary/secondary callout cards, all 8 bars, today's activity,
       evolution path hints with live match % for each eligible evolution target

[REFACTOR] Task categories replaced with task templates
           Old CATEGORIES array removed; TASK_TEMPLATES is the new source of truth
           DB column "category" retained for backward compat — templates written into it going forward
           Old task records continue to display; they contribute no crest points until re-edited

### Digivolution System Overhaul

[FEAT] Bond system replaces ABI as the partner metric
       Bond: float 0–100, earned from:
         - Daily login: +2
         - Task completion: +0.5 (max 5 task bonds/day)
         - Play interaction: +1 (max 3/day)
         - Feeding food: +food.bond
       Bond bar displayed in left panel. Persisted to profiles.bond in Supabase.

[FEAT] Evolution gating updated — bond + crest alignment replaces ABI
       EVO_REQUIREMENTS per stage:
         Champion: Lv.10, Bond 20, 50% crest match
         Ultimate: Lv.25, Bond 40, 60% crest match
         Mega:     Lv.50, Bond 60, 70% crest match
         Ultra:    Lv.70, Bond 80, 75% crest match
       Partner Vow fallback: if crest match ≥ partnerVow threshold, vow evolution is offered

[FEAT] crestReq added to every Champion+ Digimon entry
       e.g. Greymon: { primary:"Courage", secondary:"Care" }
       Drives evolution eligibility and is shown in Team page and Crests page

[FEAT] checkEvoEligible() returns { eligible, vow, reason, matchPct }
       Evolution buttons coloured gold (eligible), lavender (vow), grey (locked)

### Battle System Update

[FEAT] New 4-stat battle system: Power / Guard / Focus / Momentum
       Replaces raw HP/ATK/DEF/INT/SP/SPD display in UI (HP kept internal)
       calcBattleStats() derives stats from base values + personality battleBonus
       calcBattleDamage() uses Power vs Guard with Focus-based crit chance (up to 30%)

[FEAT] Personality system updated — each personality now has battleBonus
       e.g. Fighter: Power +7%, Defender: Guard +5% + Focus +2%, Nimble: Momentum +5% + Power +2%

[FEAT] Roles defined per Digimon: Striker / Guardian / Tactician / Support / Vanguard / Scholar / Balanced
       Role badge shown in Team page and DigiDex

[FEAT] Passive and Signature per Digimon
       Passive: always-on trait (e.g. Greymon "Aggression — Power +15% on opening attack")
       Signature: memorable special move (e.g. "Nova Blast — AoE for 70% Power")
       Displayed in Team page and on active attacker tile in Battle

### Stamina & Food System

[FEAT] Stamina bar (⚡, max 100) added to left panel and top nav
       Passive regen: 10 stamina/hour, calculated at load from last_stamina_update timestamp
       Battle costs: Easy 10 / Medium 15 / Hard 20 stamina
       Cannot start battle without sufficient stamina

[FEAT] FEED button opens food overlay — immediate buy-and-eat (no inventory state)
       FOOD_ITEMS: Apple (20⚡ +0.5💗), Onigiri (25⚡ +0.5💗), DigiCake (40⚡ +1💗), Ramen (50⚡ +1💗)
       Daily food stamina cap: 100 per day (resets at midnight)
       Food also sold directly from Store page

[FEAT] PLAY button unlocks after 3 tasks completed
       Gives +1 Bond, max 3 uses/day
       Button shows remaining plays (e.g. "PLAY (2)")

### Jijimon Help System

[FEAT] Jijimon modal — bottom-anchored dialogue overlay
       Triggered by specific in-game events:
         crest_intro  — first crest earned from a task
         evo_ready    — evolution becomes available
         partner_vow  — Partner Vow evolution offered
         first_feed   — first time food is purchased
         shop_tips    — first visit to Store
         stamina_low  — battle attempted with insufficient stamina
         neglect_warn — reserved for neglect mechanic (future)
       GOT IT: dismisses for this occurrence
       HIDE TIPS: permanently dismisses this event type (stored in localStorage)
       Sprite placeholder: div marked for <DigiSprite digimonId="jijimon" size={36}/>

### DB Migration

[DEPLOY] supabase/migrations/20260409_weekly_planner.sql
         Renamed from 20260408 to resolve version key collision with login_streak migration
         Adds: due_date (tasks), weekly_digimon (profiles)

[DEPLOY] supabase/migrations/20260410_crest_stamina_bond.sql
         Adds to profiles table:
           bond INTEGER DEFAULT 0
           stamina INTEGER DEFAULT 100
           last_stamina_update TIMESTAMPTZ
           crest_history JSONB DEFAULT '[]'
           food_stamina_today INTEGER DEFAULT 0
           bond_actions_today JSONB DEFAULT '{}'
           last_day_reset DATE
           login_streak INTEGER DEFAULT 0
           last_login_date DATE

### Pomodoro Focus Timer

[FEAT] TRAIN button now opens Pomodoro focus session modal
       Setup: pick training type (maps to a crest template) + duration (15 / 25 / 50 min)
       Live circular SVG countdown timer with partner sprite shown during session
       On completion → CLAIM REWARDS:
         XP: duration × 3 (e.g. 25 min = 75 XP)
         Bond: +1
         Bits: +75
         Crest points: equivalent to completing a Medium-difficulty task with that template
       Session can be abandoned early (no reward)
       Designed to be meaningful but not game-breaking (no daily cap — reward is time-proportional)

### Tamer Profile Modal

[FEAT] Clicking "Tamer" in the top nav opens the Tamer Profile popup
       Lore-accurate content:
         DigiDestined Since — Supabase account creation date (session.user.created_at)
         Tamer Title — derived from primary crest (e.g. "Scholar Tamer" for Knowledge)
         Current Partner + Level
         Bond Strength, Login Streak, Tasks Today, Digimon Known count
         Primary + Supporting crest callout with flavour description
         Digivolution Journey — sprite grid of all discovered Digimon
         Tamer's Oath — flavour text
       SVG radar chart (no external deps) — octagonal web showing all 8 crest alignments
         8 axes at 45° intervals, grid rings at 25/50/75/100%, crest-coloured dots

### Infrastructure Fix

[FIX] Identified that all session changes were written to DailyDigivolve/ subdirectory
      instead of root src/ — the actual project served by Vite and Cloudflare
      Root cause: Claude created a nested DailyDigivolve/ subfolder in a prior session
      and subsequent file edits targeted that folder by mistake
      Fix: All four updated files copied from DailyDigivolve/src/ to root src/
      Affected: App.jsx, data/constants.js, data/digimon.js, data/engine.js

---

## Features Pipeline

### Near-term (next sessions)

[ ] Jijimon sprite — provide image file, replace 💭 placeholder in modal
[ ] Rest mechanic — sleep tracking / next-day stamina bonus
[ ] Neglect system — if no tasks for N days, bond decay + Sukamon warning
[ ] De-digivolution — slide evolution back when crest alignment diverges significantly
[ ] DNA Digivolution — fusion evolution requiring two Digimon in party

### Medium-term

[ ] PvP sparring — async challenge between two tamers
[ ] Raid mode — coordinated multi-tamer boss battles
[ ] Campaign mode — story stages with escalating difficulty
[ ] Pomodoro sessions tracked over time — weekly focus stats on Tamer Profile
[ ] Crest Catalyst shop item — +3 to lowest active crest (1 per week)
[ ] Partner Vow shop item — enables vow evolution path

### Long-term

[ ] Mobile app (React Native / Expo) — required before watch companion
[ ] Apple Watch / Wear OS companion
[ ] DigiVice hardware prototype (ESP32-S3 + LVGL)
[ ] dailydigivolve.com domain + NZ company registration

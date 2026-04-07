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

## Session 3 — 2026-03-23 to 2026-04-08

### Sprite System

[FEAT] PNG sprite system built from scratch
       File: src/data/sprites.js, src/components/DigiSprite.jsx
       Three rendering modes:
       - "grid"   — single PNG with frames in a CSS grid (default for 16×16 sprites)
       - "sheet"  — horizontal filmstrip
       - "frames" — individual numbered PNGs (0.png, 1.png, …)
       Animation runs via setInterval cycling frame index
       Crisp pixel upscaling via imageRendering: "pixelated"
       Scale = display size / frame size (e.g. 64px / 16px = 4× upscale)

[FEAT] 44 Digimon PNG sprites added to public/sprites/
       All renamed to lowercase to match web server case-sensitivity
       Format: 48×64 grid sheet (3 cols × 4 rows of 16×16 frames)

[FEAT] DigiSprite probes for PNG existence before rendering
       Shows SVG placeholder immediately while probing (no blank flash)
       Switches to PNG if confirmed, stays on SVG if 404

[FIX] Sprite filename casing — all renamed to lowercase via node script
      Affected: Tailmon.png → tailmon.png, Cherubimon_Virtue.png → cherubimon.png,
      XV-mon.png → exveemon.png, Lilimon.png → lillymon.png, etc.

[FIX] Mode mismatch for pagumon, lopmon_it, metalgreymon, wargreymon
      Were set to mode:"frames" but sprites are single grid PNGs
      Fixed: all changed to mode:"grid"

[FEAT] spriteId field for shared sprites (lopmon_it uses lopmon's PNG)

### Digimon Database Overhaul

[FEAT] Complete DIGIMON_DB rewrite — 10 full evolution lines
       Baby → In-Training → Rookie → Champion → Ultimate → Mega
       Lines: Agumon, Patamon, Salamon, Gabumon, Tentomon, Palmon,
              Veemon, Guilmon, Lopmon, Renamon

[FEAT] Evolution requirements added to every Digimon
       evoRequires: { level, abi, stats:{} }
       Calibrated to Digimon World / Cyber Sleuth thresholds:
       - Baby → In-Training: Lv3, ABI 0
       - In-Training → Rookie: Lv6, ABI 1
       - Rookie → Champion: Lv10, ABI 5 + stat thresholds
       - Champion → Ultimate: Lv20, ABI 5
       - Ultimate → Mega: Lv30, ABI 15

[FEAT] meetsEvoReq() pure function in engine.js
       Checks level, ABI, and each stat threshold simultaneously
       Returns boolean — used to gate evolution buttons and banner

[RENAME] gatomon → tailmon (Japanese name, matches user's sprite file)
[RENAME] saviorhuckmon → cherubimon (Lopmon Mega, matches user's sprite)
[RENAME] tsumemon → tanemon (Palmon In-Training)
[RENAME] vmon → chibimon (Veemon In-Training)

[FEAT] botamon now branches to both koromon (Agumon line) and tsunomon (Gabumon line)

### Task System — Stat Categories

[FEAT] Task categories now map directly to Digimon stats (HP/SP/ATK/DEF/INT/SPD)
       Completing an HP task gives +HP bonus stat, ATK task gives +ATK, etc.
       Stat boost amount set by task difficulty (Easy=1, Medium=1, Hard=2)

[FEAT] STAT_CATEGORIES added to constants.js with icon, colour, and description per stat
       Task form and filter tabs updated to show icons and descriptions

[FEAT] ABI accrual system
       Easy=+0.1 ABI, Medium=+0.2, Hard=+0.3 per completed task
       Fractional progress stored in bonus_stats.abi_progress (JSONB, no schema change)
       Whole ABI points accumulate in the abi column

### Party System

[FEAT] Party max size changed to 3 (was 9)
       All 3 party members displayed in Team page
       Farm is unlimited

[FEAT] All party members now receive equal XP, stat boost, and ABI on task completion
       Previously only party[0] got full XP; others got 50% without DB persistence
       Now: all 3 persisted to Supabase simultaneously via Promise.all

[FEAT] "★ Set Leader" button on non-leader party members
       Swaps selected Digimon to party[0] (leader role)
       Leader is the active Digimon shown in left panel and used for AI chat
       sort_order updated in DB for persistence across sessions

[FIX] sendToFarm / recallFromFarm now persist in_farm to Supabase
      Previously local-only — Digimon placement was lost on page refresh

### Login Streak & Digitama System

[FEAT] Daily login streak tracking
       Profiles table: login_streak INTEGER, last_login_date DATE, digitama_credits INTEGER
       On login: consecutive day increments streak, missed day resets to 1
       Shown in nav bar (🔥N) and dashboard stat cards

[FEAT] Digitama egg reward at every 30-day login milestone
       8 egg types, each hatching a different Baby Digimon:
       Flame→botamon, Holy→punimon, Wind→poyomon, Beast→pabumon,
       Dragon→jyarimon, Nature→kuramon, Mystic→viximon, Shadow→pagumon
       Egg selection modal opens automatically on login when milestone hit

[FEAT] Digitama modal shows animated SVG eggs with type colours
       "SAVE FOR LATER" available only when party has ≥1 member
       If party is empty (fresh reset), modal cannot be dismissed — must choose partner

[FEAT] "↺ RESET TEAM" button in Team page
       Confirmation dialog required before executing (prevents accidental wipes)
       On confirm: deletes all Digimon, awards 1 Digitama credit, opens egg selection
       User picks their new starting partner via egg modal — no hardcoded defaults

[FEAT] Digitama credits shown as 🥚×N badge in nav bar and Team page header

### Digidex Update

[FEAT] Digidex now shows ALL Digimon regardless of discovery status
       PNG/SVG badge on each card shows which sprites are loaded vs falling back to SVG
       Undiscovered Digimon shown at 45% opacity with "undiscovered" label
       Stage label visible for all entries

### Fixes

[FIX] ABI bootstrap deadlock resolved
      Starters had abi:0; Champion required abi:5 with no way to earn it
      Fix: ABI earned from task completion (fractional, 0.1–0.3 per task)

[FIX] First-login seed now creates 3 starters: chibimon + tsunomon in party, patamon in farm
      (Triggered only on brand-new accounts with no existing Digimon)

[FIX] evolve() now persists to Supabase (was local-state only)

### Database Migration

[DEPLOY] SQL migration: supabase/migrations/20260408_login_streak.sql
         Adds login_streak, last_login_date, digitama_credits to profiles table

---

## Pipeline — Features in Development

[ ] Voice-to-text task entry
    User speaks a task, app transcribes and auto-fills the task form

[ ] AI auto-task management
    AI analyses tasks and suggests edits, completions, or new tasks
    based on chat conversation and current goals

[ ] Party max cap — review and possible increase
    Currently 3. May expand to 5 or 6 as gameplay deepens

[ ] Mobile app (React Native / Expo)
[ ] Apple Watch / Wear OS companion
[ ] DigiVice ESP32 prototype

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

## Session 4 — 2026-04-13

### Neglect System

[FEAT] Neglect system implemented — bond decay and partner corruption arc
       Triggers when no tasks completed for N consecutive days
       Two corruption paths based on behavioural fingerprint:
         Sukamon path  — tamer abandoned partner (low Care/Friendship + low bond)
         Numemon path  — tamer burned out and withdrew (low Courage/Reliability)
       Reconnection Arc: complete 3 tasks to restore bond and redeem the path
       Redemption branch: evolves to a healthy Champion form
       Non-redemption branch: Sukamon or Numemon corruption evolution locked in
       Left panel widget shows neglect level (quiet / dormant / unstable / critical)
       CORRUPTION RISK badge shown when Sukamon evo is imminent

### Campaign Raid Mode

[FEAT] BREACH page added — community boss raid event
       Current event: VenomMyotismon (Virus/Dark, 5,000,000 HP community pool)
       Three phases with phase-dominant stat bonuses:
         Corruption (Power dominant) → Rampage (Guard dominant) → Venom Burst (Focus dominant)
       Phase threshold markers on HP bar; active phase callout with description
       Partner contribution stats — your Power/Guard/Focus/Momentum shown with active phase highlight
       Task → raid stat guide: Workout/Challenge → Power, Deep Work/Reflection → Focus, etc.
       Raid log: last 15 task contributions with damage dealt, phase, and date
       Raid mini-widget on character panel: ☠ BREACH label + current phase + HP bar + damage counter
       Raid state persisted to Supabase (raid_state JSONB on profiles)
       Auto-resets if raidId doesn't match current event

### First-Run Onboarding

[FEAT] Full onboarding flow for new tamers (OnboardingFlow.jsx)
       Phase sequence:
         welcome → quiz → result → hatch_1 → reveal_1 → surprise → reveal_2 → egg_choose → reveal_3 → tour
       Jijimon quiz: 5 questions, answers map to 8 crests, highest-scoring crest wins
       Three-egg hatch sequence:
         Egg 1 — determined by quiz result (crest-matched species)
         Egg 2 — surprise gift, auto-hatches (second crest-matched species)
         Egg 3 — free choice from all available eggs
       All 3 partners join party (not farm) on completion
       App tour: 5-step walkthrough of key sections with Jijimon commentary
       allDisc seeded on complete — all 3 baby species immediately added to DigiDex

### Navigation Overhaul

[UI] Nav condensed into grouped dropdown pills
     Three dropdown groups:
       P.E.T      — TEAM / FARM / DIGIDEX
       FILEHAVEN  — TASKS / WEEK / CRESTS
       CYBERSPACE — PATCH / BREACH / STORE / NETWORK
     Standalone pills: CHAT, HOME
     Final nav order: P.E.T → FILEHAVEN → CYBERSPACE → CHAT → HOME
     Hover-to-open dropdowns with 150ms close debounce
     Active group highlighted with accent colour border

### Crest Images

[FEAT] Real crest PNG images integrated throughout the app
       8 crests added to public/crests/: courage, knowledge, reliability, care,
       friendship, sincerity, hope, light (Love.png mapped to care.png)
       CrestIcon component renders <img> with graceful emoji fallback
       Applied to: CrestsPage callout cards, alignment profile bars, today's activity badges,
       evolution path hints + mini bars, tamer profile block, FILEHAVEN crest bars,
       task cards, focus timer, Digidex crest requirements, team manager evo requirements,
       radar chart SVG labels (switched to SVG <image> elements), onboarding result phase

### UI Polish

[UI] Font sizing reverted to premium small sizes
     CSS utility classes restored: px8=8px, px9=9px, px10=10px, px12=12px
     nav-pill=7px, pet-btn=7px, task-tab=7px, sec-label=7px, sec-title=8px
     nav-drop-item kept at 8px (old 6px was illegible — preserved fix)
     All fontSize:"4px" bugs fixed to 9px (raid box, digidex detail, evo chain labels)
     Team manager party badges set to 9px (old code had 6px = unreadable)
     Right-side compact party role text: 9px

[UI] Breach mini-widget (character panel) — removed boss name, shows ☠ BREACH + phase only

[UI] Character panel stat bars — XP/Stamina/Bond labels and numbers use px8 class (no override)

[UI] Crest alignment mini box (character panel)
     Header uses px8 class; PRIMARY/SUPPORT labels use px8 class
     Crest icon sizes reduced: primary 14px, secondary 12px
     Crest name font reduced to 10px

[UI] FILEHAVEN crest alignment bars — fixed cramped PRI/SEC column
     Crest name 10px, width 80; bar height 7px; gap 6px
     Percentage and ★PRI/◆SEC labels use px8 class with tighter widths (28px each)

### Today's Crest Activity

[FEAT] CrestsPage — Today's Crest Activity now shows secondary crest gains
       Previously only showed primary crest points per task
       Each activity badge now displays:
         Primary points at full opacity (e.g. +2)
         Secondary points at 65% opacity with "sec" suffix (e.g. +1 sec)
       A crest that earned both primary and secondary points from different tasks
       shows as a single merged badge with both values

---

## Session 5 — 2026-04-13

### Jijimon Catch-Up Prompt

[FEAT] Daily catch-up popup — retroactive reward claiming for missed tasks
       Trigger conditions: local time ≥ 05:00, first open of the day (localStorage key dv_catchup_<userId>)
       Detected missed tasks:
         - Daily tasks whose last_completed_date ≠ yesterday
         - Recurring tasks scheduled for yesterday not completed yesterday
         - One-time tasks with due_date = yesterday that remain undone
       UI: Jijimon sprite portrait with speech bubble, scrollable task checklist,
           live reward preview (XP / Bond / Crest points), CLAIM REWARDS and SKIP buttons
       Tone: forgiving, non-judgmental — "Yesterday's effort still shaped who you are today"
       Dialog: 4 rotating lines picked at modal-open time (stable across re-renders via useRef)
       On claim: grants full XP, bond (respects daily 5-task cap), crest history entries dated
                 yesterday, increments streaks, updates last_completed_date in Supabase
       Inspired by Habitica's yesterday's dailies check-in mechanic

### Jijimon Sprite

[FEAT] Real Jijimon GIF sprite applied to all Jijimon modals
       Source: /sprites/jijimon.gif (already in public/sprites/)
       Applied to:
         - Jijimon tip modal header (replaced 💭 placeholder — TODO comment cleared)
         - Catch-up prompt portrait (56×56px gold-bordered frame)
       imageRendering: pixelated for crisp scaling

### Mobile Native Layout

[FEAT] Mobile-native layout added — automatic on phones, manual toggle on tablets/desktop
       Detection: JavaScript reads window.innerWidth ≤ 768px on mount + resize listener
       CSS safety net: @media (max-width:768px) mirrors all layout rules so the bottom tab
       bar and correct layout fire even before React renders (no layout flash on load)
       Manual toggle: 📱 MOBILE button added to desktop nav
         - Activates mobile layout regardless of screen width
         - Preference persisted to localStorage key dv_force_mobile
         - Button flips to 🖥 DESKTOP when active; click again to revert to auto-detect
       Exit: "SWITCH TO DESKTOP VIEW" in mobile MORE sheet (shown only when force-mobile active)

[UI] Bottom tab bar (60px fixed, zIndex 250)
     5 tabs: 🐾 PET / ✅ TASKS / 📅 WEEK / ☠ BREACH / ☰ MORE
     Active tab: accent-coloured top border + accent text
     MORE tab shows as active when viewing any secondary page (Team, Store, etc.)

[UI] PET tab — full character panel fills the screen
     Left-col shown full-width via CSS class (no JSX duplication)
     Contains: sprite stage (200px, animated), name + level, XP/Stamina/Bond bars,
     Raid mini-widget, neglect widget, crest alignment mini, Feed/Play/Rest/Train buttons
     Left-col becomes flex:1 column with internal scroll; border-right removed

[UI] Non-PET tabs — compact sticky character strip at top of content
     Sprite (42px) + name + level badge + XP bar + ⚡ Stamina + 💗 Bond
     Sticky within the main-content scroll container (position:sticky top:0)
     Hides on desktop via CSS; shows only on mobile non-pet pages

[UI] More sheet (slides up from bottom, zIndex 235)
     2-column grid of 8 secondary pages: Team, Farm, Digidex, Crests, Store, Network, Patch, Chat
     Semi-transparent backdrop dismisses sheet on tap
     Active page highlighted with accent border

[UI] Nav overflow fix
     Desktop nav button group: overflowX:auto + flexShrink:1 + minWidth:0
     Prevents horizontal page overflow on intermediate screen widths
     Nav scrolls internally rather than blowing past viewport edge

[UI] Right column hidden on mobile (already hidden at ≤1200px; reinforced in mobile layout)
[UI] Top nav hidden on mobile — replaced entirely by bottom tab bar

---

## Session 6 — 2026-04-14

### Cross-Device Sync

[FEAT] Supabase Realtime subscriptions — surgical payload handlers for profiles, tasks, digimon
       Each table change applies only the changed row directly from the event payload
       Eliminates race condition where refreshData() could overwrite optimistic local state
       Handlers: applyProfilePayload / applyTaskPayload / applyDigimonPayload

[FEAT] visibilitychange listener — re-fetches all display state when tab regains focus
       Handles switching back from mobile to desktop and vice versa
       Calls refreshData() which syncs bond, bits, stamina, tasks, party, crest history
       Does NOT re-run init-only logic (login streak, neglect detection, daily reset)

[FEAT] allTasks state — unfiltered task list for week view
       tasks state retains today-only filter for recurring tasks (correct for task list)
       allTasks stores all tasks regardless of day — passed to WeeklyPlannerPage
       Enables recurring tasks to appear on their correct days across the full week

[FIX] APP_VERSION / DV_VER cache-bust — forces PWA hard reload when app code is updated
      Version stored in localStorage key dv_ver; mismatch triggers window.location.reload()
      Increment DV_VER constant on each deploy to push fresh code to installed PWAs

### PWA Notifications

[FEAT] Pomodoro timer rebuilt on absolute endTime timestamp
       Previously: decremented timeLeft counter — paused when iOS backgrounded the PWA
       Now: stores endTime = Date.now() + totalSeconds*1000 on session start
       Remaining time recalculated as Math.floor((endTime - Date.now()) / 1000) each tick
       visibilitychange handler snaps timer to correct remaining time instantly on resume
       If endTime has passed while away, session immediately completes on return

[FEAT] Web Notifications for Pomodoro completion
       Requests Notification permission when user starts first timer session
       Fires new Notification('Session Complete! 🎉') when timer hits zero
       Works when app is backgrounded (open but not in focus) on iOS 16.4+ PWA
       Does not fire if PWA has been force-closed (JS process killed)

### Nav Fix

[FIX] Desktop nav dropdown menus not appearing
      Root cause: nav pills container had overflowX:auto which clips position:absolute children
      Fix: replaced with flexWrap:wrap — pills wrap to new line on narrow widths instead of scrolling
      Top nav already has flexWrap:wrap so this is consistent

### Week View

[FIX] Sunday timezone bug — tasks scheduled for Sunday not appearing in week view
      Root cause: date.toISOString() converts to UTC; Sunday midnight local = Saturday UTC in AEST
      Fix: localISO() helper uses getFullYear/getMonth/getDate (local time) instead of toISOString()
      Applied to both todayStr and dateStr in WeeklyPlannerPage

[FEAT] Daily tasks shown in week view across all 7 days
       Toggle: DAILY (teal) — on by default; lavender border distinguishes daily from once tasks

[FEAT] Recurring tasks shown in week view on their scheduled days
       Uses allTasks prop (unfiltered) so Wednesday tasks appear on Wednesday even on Tuesday
       Toggle: RECUR (mint) — on by default; mint border distinguishes recurring from other types

[FEAT] SHOW toggle strip — DAILY / RECUR / DONE buttons replace separate ON/OFF buttons
       Compact segmented control; each pill highlights in its own colour when active
       DONE defaults to off — clean pending-only view by default
       When DONE off and all tasks complete: column shows "✓ All done" in teal

[FEAT] Per-day done state for daily and recurring tasks
       daily/recurring tasks use t.lastCompletedDate === dateStr to determine done per column
       Completing Tuesday's daily doesn't mark it done in Wednesday's column

[FEAT] Priority sort in week view — each day column sorts pending-first, then Urgent→High→Medium→Low
       Done tasks always sink to bottom when DONE is visible

[UI] No due date shown or required for daily or recurring tasks
     dueDate badge hidden in task cards for type !== 'once'
     Reschedule date input in week column only shown for once tasks

[UI] Week view header reorganised — title + date range stacked on left; SHOW strip on right
     Cleaner layout, less horizontal clutter than inline ON/OFF buttons

### Tasks Page

[FEAT] Priority sort — pending tasks ordered Urgent→High→Medium→Low (mobile and desktop)

[FEAT] Completed tasks newest-first — sorted descending by lastCompletedDate

[UI] Template filter replaced with crest PNG images (CrestIcon, 18px)
     Uses CREST_INFO[primary_crest].img paths (/crests/*.png) already in public/crests/
     Active tab highlighted with accent outline; title tooltip shows template name on hover
     Neutral template shows ○ placeholder (no associated crest)

[UI] Type filter restored to readable text — ALL / ONE-TIME / DAILY / RECURRING

---

## Session 7 — 2026-04-14

### Persistence Fixes

[FIX] Battle bits and stamina not persisting after PATCH battles
      Root cause 1: startBattle fired a fire-and-forget Supabase stamina update; the realtime event
      from that update arrived with the full row snapshot (old bits/bond values) and overwrote the
      reward that was just applied locally
      Root cause 2: battleAttack used a stale closure value for the DB bits write
      Fix: startBattle now includes current bits+bond in its stamina update so the realtime payload
      is never stale. battleAttack is now async and awaits a single combined bits+stamina save at
      battle end using a consistent newBits variable

[FIX] Play action (bond +1) appearing to reset
      Same realtime race condition as above — resolved by including bond in the startBattle payload
      so realtime events always carry current values

[FIX] Tamer name reverting to "Tamer" after tab switch or page reload
      Root cause: refreshData() (called on visibilitychange) and applyProfilePayload (realtime handler)
      both set bits/bond/stamina but neither set tamerName — so any sync event could clobber a
      locally-set name if display_name was not in the payload or returned null
      Fix: both refreshData and applyProfilePayload now call setTamerName(profile.display_name)
      when display_name is present

### Jijimon Catch-up Modal

[FIX] Catch-up modal could reappear on a second device or browser (localStorage is device-local)
      Fix: added catchup_last_seen TEXT column to profiles table (migration 20260414_catchup_last_seen)
      On first show of the day the date is written to BOTH localStorage AND profiles.catchup_last_seen
      On load, either source being "today" prevents the modal from showing again
      Supabase migration applied to remote DB via db query --linked

[FIX] Catch-up date comparison used toISOString() (UTC) for todayISO; now uses local date components
      (getFullYear/getMonth/getDate) to match the per-column localISO() logic in WeeklyPlannerPage

### Week View — Task Completion

[FIX] Completing a task in week view moved it to the prior day column
      Root cause: completeTask used new Date().toISOString().split('T')[0] (UTC date) for
      last_completed_date. WeeklyPlannerPage computes dateStr via localISO() (local date).
      For UTC+ timezone users, UTC date can be one day behind local date — so a task completed
      on Tuesday got stamped Monday UTC and appeared done in Monday's column
      Fix: completeTask now derives a todayLocal string using getFullYear/getMonth/getDate (same
      method as WeeklyPlannerPage). todayLocal is used for last_completed_date in the DB write,
      for lastCompletedDate in both setTasks and setAllTasks state updates, and for the daily
      cap completedTodayCount filter. UTC today is kept only for bond/crest/profile-level dates

[FIX] stale check in mapTask (initial load), refreshData (visibility sync), and applyTaskPayload
      (realtime) all compared last_completed_date against UTC today — now all use local date
      so a task completed at 9am Tuesday local / Monday UTC is not wrongly flagged as stale

[FIX] Completing a task updated tasks state but not allTasks — week view received allTasks and
      showed the pre-completion lastCompletedDate until realtime arrived, causing a visible
      "wrong day" flash even when the date was correct
      Fix: both setTasks and setAllTasks now apply the same applyComplete mapper in completeTask

### Mobile UX

[FIX] iOS auto-zoom on new task input — font-size 13px triggers iOS viewport zoom on focus
      Fix: TaskForm inputSt fontSize changed 13 → 16px (iOS only zooms on inputs below 16px)
      Applies to all inputs in the form: title, notes, date

[FIX] New task modal not scrollable on mobile — fixed overlay used alignItems:center with no
      overflow handling; when the soft keyboard appeared the form was partially hidden
      Fix: overlay now uses alignItems:flex-start with overflowY:auto and WebkitOverflowScrolling:touch
      Inner content uses marginTop/Bottom:auto so it stays centred when space allows

[FIX] Feed (food) panel invisible / unscrollable on mobile
      Root cause: panel used justifyContent:flex-start and paddingLeft:320 (desktop sidebar offset)
      On mobile there is no sidebar so the panel rendered off-screen to the right
      Fix: replaced with justifyContent:center and padding:16; inner panel has maxHeight:90vh and
      overflowY:auto so it scrolls if content overflows on small screens

### Breach Page

[UI] VenomMyotismon GIF added to breach boss header
     File: public/sprites/breach_boss_venommyotismon.gif (copied from Downloads/3D Sprite/breach boss/)
     Replaces the SVG placeholder that was drawn in code
     Image is ONLY used on the BREACH page — not referenced in DigiDex or DigiSprite component

### Tasks Page

[FIX] Completed task sort — rewrote comparator to unambiguous descending form:
      da > db → return -1 (a more recent → a first); da < db → return 1 (b more recent → b first)
      Null/missing lastCompletedDate falls back to '0000-00-00' so undated tasks always sort last
      Previously used return 1 / return -1 with b-relative comparison — functionally equivalent
      but ambiguous and prone to inversion bugs

[UI] Completed tasks cap raised from 15 → 50
     Previously capped at 15 regardless of how many tasks were completed
     Footer label updated: "Showing most recent 50 completed tasks"

### Deploy

[DEPLOY] DV_VER bumped 6 → 7 — forces PWA hard reload for all installed instances
[DEPLOY] Pushed to main → Cloudflare Pages auto-deploy

---

## Session 8 — 2026-04-15

### Mobile UX

[FIX] Keyboard dismiss zoom on iOS — after confirming a new task the mobile browser was
      staying zoomed in (viewport not resetting) when the keyboard dropped.
      Root cause: React removed the form from the DOM without the browser receiving a blur
      signal first, so iOS kept the viewport in its keyboard-zoomed state.
      Fix: added `document.activeElement?.blur()` + `window.scrollTo(0,0)` before all
      form dismiss paths (submit, cancel, backdrop tap, × button) in both the quick-add
      modal and the inline tasks-page TaskForm. This lets iOS dismiss the keyboard and
      reset the viewport naturally before the UI state changes.

[DEPLOY] DV_VER bumped 7 → 8 — forces PWA hard reload for all installed instances
[DEPLOY] Pushed to main → Cloudflare Pages auto-deploy

---

## Session 9 — 2026-04-15

### Store — Adopt an Egg

[FEAT] Replaced broken "Random Digimon" shop item with "Adopt an Egg" (2000 bits)
       The old item deducted bits but did nothing. New item opens a full egg-adoption flow.

[FEAT] Egg picker modal — shows all 21 Digitama from ALL_EGGS in a scrollable grid
       Each egg uses the DigiEgg component (real sprite, idle animation, gold selection ring)
       Crest affinity shown as subtitle. Selecting an egg reveals its description + confirms.

[FEAT] Hatch animation — on HATCH EGG the DigiEgg plays its shake→hatch frame animation
       DB insert happens inside the onHatched callback so the new Digimon appears on screen
       before any state transitions.

[FEAT] Party placement logic:
       - Party has space (< 9): new Digimon added to party immediately
       - Party full: new Digimon goes to DigiFarm

[FEAT] Post-hatch Jijimon interactive prompts:
       - Party full → Jijimon asks "Want to swap them into your party?"
         YES → party-member picker (tap to swap out → goes to farm, new digi joins party)
         NO  → Digimon stays in farm
       - If new Digimon is in party → Jijimon asks "Want to make them your leader?"
         YES → promotes to party slot 0, persists sort_order to DB
         NO  → closes

[DEPLOY] DV_VER bumped 8 → 9 — forces PWA hard reload for all installed instances
[DEPLOY] Pushed to main → Cloudflare Pages auto-deploy

---

---

## Session 10 — 2026-04-19

### Party Overflow — Universal Fix

[FIX] Party capacity overflow — any Digimon could exceed the 9-slot cap on load
      Root cause: load() and refreshData() both called setParty(all in_farm:false rows) with no cap,
      so DB records with stale in_farm:false (from historical insert bugs) inflated the party on every
      app open or visibility-change sync
      Fix: self-healing overflow block added to both load() and refreshData()
        - Detects partyRows.length > MAX_PARTY_SIZE after mapping
        - Slices excess into farmRows, updates in_farm:true in DB for each overflow record
        - No user-visible disruption — corrupt state is silently repaired on next load
      Fix is universal (no Digimon-specific logic) and a no-op for clean DBs (fresh users unaffected)

[FIX] recallFromFarm stale closure — rapid double-tap could push party past 9
      Fix: capacity check now runs inside setParty functional update (reads live state, not closure)
      Secondary guard: closure check still provides fast-path rejection for the common case

### Task Templates

[FEAT] Wellness template added — 8th task template, maps to Light (primary) + Sincerity (secondary)
       Completes the full crest set: all 8 crests now have a corresponding task template
       Raid stat: guard (same as Recovery/Maintenance)
       Visible in: task form, pomodoro picker, filter tabs, week view, raid stat guide

[FIX] Challenge template crest corrected — was Courage (primary) / Hope (secondary)
      Now: Hope (primary) / Courage (secondary)

### Weekly Planner

[FEAT] Today always leftmost — week view rotates so current day is always the first column
       Prevents users having to scroll to find today (previously Sunday was always column 1)
       Rotation resets at local midnight

[FIX] Daily and recurring tasks no longer appear in the Unscheduled section
      Unscheduled filter now limited to type === 'once'; daily/recurring always have a schedule

### Pomodoro — Cross-Device Sync & Reliability

[FEAT] pomodoro_state JSONB column added to profiles table (migration 20260419_pomodoro_state.sql)
       Stores: { phase, endTime, totalSeconds, template, duration } when a session is running
       Cleared to null on reward claim or session abandon

[FEAT] Pomodoro timer persists across app kills — on load, if pomodoro_state.phase === 'running':
       - Remaining time recomputed from endTime (not a stored countdown)
       - If endTime already passed → session immediately completes, notification available
       - If time remains → timer resumes from correct position

[FEAT] Cross-device Pomodoro sync — starting on PWA now mirrors on webapp and vice versa
       Supabase realtime fires applyProfilePayload on the other device; handler reads pomodoro_state
       and either resumes the timer or marks it done (5-second grace window prevents flip-flopping)

### Service Worker — Background Notifications

[FEAT] public/sw.js — new service worker for best-effort background notifications
       Handles SCHEDULE_TIMER message: schedules setTimeout-based notification at exact endTime
       Handles CANCEL_TIMER message: clears pending timeout and closes any shown notification
       Vibration: longer alarm pattern for sleep-wake (300ms bursts), short for pomodoro
       notificationclick: focuses existing window or opens new one at /
       SW registered in main.jsx on load

[FEAT] Pomodoro notifications fire when timer completes (not only when reward is claimed)
       SW notification is scheduled whenever pomodoroState.endTime changes
       Notification brings user into app to claim rewards — no action required before they appear

[FEAT] Sleep/rest alarm notification via SW — scheduled on BEGIN REST at exact wake timestamp
       SW CANCEL_TIMER fired on handleWakeUp so alarm is cleared when app wakes naturally

### Rest / Sleep Alarm Improvements

[FEAT] Same-day nap and siesta support — rest modal now defaults to 2 hours from now
       Previous default "07:00" would push to next day for any afternoon nap
       New presets: +30m / +1h / +2h / +4h / +8h (relative to current time, calculated at modal open)
       next-day rollover only triggers when wake time is at or before sleep-start time

[FIX] Short rest notifications not firing — wake alarm polling interval was 60 seconds
      For a 2-minute nap the first poll could fire at t+3min (1 minute late)
      Fix: polling interval reduced to 15 seconds
      Fix: immediate wake check runs after countdown → sleeping phase transition
           so a rest where wake time == countdown duration triggers instantly

[FEAT] Native alarm button — Android: pre-fills Clock app via intent URL; iOS: opens Clock app
       Shown below BEGIN REST on mobile devices as a backup alarm option

[FEAT] Wake chime — three-note rising sine-wave chime plays on automatic wake (Web Audio API)
       Does not play on manual "WAKE UP EARLY" tap

### Streak System — Gap Detection

[FIX] Task streaks not resetting on skipped days
      Previous: streak always incremented by 1 regardless of last_completed_date
      Fix: yestLocal computed in local time; streak = lastCompletedDate === yestLocal ? +1 : 1
      Fresh users: lastCompletedDate is null → first completion correctly starts streak at 1
      Daily/recurring tasks: stale done resets each day but lastCompletedDate persists in DB —
      the consecutive check works correctly across the reset

[FIX] Catchup reward streaks not resetting on gaps
      Catchup tasks are credited as yesterday — streak continues only if lastCompletedDate was
      the day before yesterday (consecutive). Any earlier date resets to 1.
      lastCompletedDate field added to catchup task object so the claim function can access it

[FIX] Login streak was already correct (resets to 1 if lastLogin !== yesterday) — no change needed

### Bond — Per-Digimon

[FEAT] Bond is now unique to each tamer-digimon pair
       Migration: digimon.bond NUMERIC DEFAULT 0 (20260420_digimon_bond.sql)
       bond React state removed; replaced with derived value: party[0]?.bond ?? 0
       All bond gains write to digimon table (supabase.from('digimon').update({ bond })) via
       updateActiveBond() helper; profiles.bond kept in sync for friends leaderboard only

[FEAT] Farm digimon cannot gain bond — updateActiveBond() only ever targets party[0]
       A digimon in the farm never occupies party[0], so their bond is frozen until recalled

[FEAT] New hatches start at bond 0 — no existing bond carries over from prior partners
       All digimon INSERT paths omit the bond field; DB DEFAULT 0 applies automatically

[FEAT] Evolution eligibility per digimon — team view now passes digi.bond (not global bond)
       to checkEvoEligible() so each party member's evo requirements are checked against
       their own bond, not the active slot's bond

[FEAT] Rotation incentive — focusing attention on a specific partner grows their bond;
       benching them in the farm freezes it; swapping back resumes from where it left off

### DB Migrations (manual — run in Supabase SQL editor)

[DEPLOY] ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pomodoro_state JSONB DEFAULT NULL;
[DEPLOY] ALTER TABLE digimon ADD COLUMN IF NOT EXISTS bond NUMERIC DEFAULT 0;

### Deploy

[DEPLOY] DV_VER bumped 9 → 10 — forces PWA hard reload for all installed instances
[DEPLOY] Pushed to main → Cloudflare Pages auto-deploy

---

## Session 11 — 2026-04-19

### Crest Stage System

[FEAT] Crest Stages — crests now level up through stages (0–5) as points accumulate
       Each stage requires more total points; stage thresholds defined in CREST_STAGE_COSTS
       Stage upgrades visible in Crests page and gated on evolution eligibility
       crestStages object persisted on profiles row (JSONB)

[FEAT] Crest-gated evolution — Champion+ evolutions now require minimum crest stage levels
       CREST_STAGE_EVO_REQ defines primary/secondary stage minimums per evolution tier
       checkEvoEligible() updated to validate crestStages against requirements
       Stage shortfall shown in evo button tooltip ("Courage Stage 2 needed")

### Login Reward Calendar

[FEAT] Daily login rewards — 30-day calendar of escalating rewards
       LOGIN_REWARDS array: bits, crest materials, armor digi credits, material selectors
       Reward claimed once per calendar day via Jijimon prompt
       Calendar modal shows all 30 days, claimed days ticked, today highlighted
       Material selector rewards let tamer choose which crest material to receive
       Persisted: login_day (int), last_login_reward_date (date), crest_materials (JSONB)

### Tamer Level

[FEAT] Tamer XP and level system — separate from partner Digimon XP
       Tamer gains XP on task completion, Pomodoro sessions, and daily login
       TAMER_XP_PER_LEVEL: flat 500 XP per level (no scaling)
       TAMER_UNLOCKS: milestone features unlock at specific tamer levels
       Tamer level shown in Tamer Profile modal header

### Backgrounds

[FEAT] Background selector — tamers can pick a stage background image
       BACKGROUNDS array: Digital Dark (default), Morning Blue, Night Purple
       Selected background applied to left-panel stage viewport
       Preference persisted to profiles.selected_bg
       Unlockable backgrounds gated behind tamer level milestones (TAMER_UNLOCKS)

### Sprites

[FEAT] Additional Digimon sprites added to public/sprites/
       Grid-mode PNG spritesheets added for several Digimon lines
       sprites.js updated with new entries

### Deploy

[DEPLOY] DV_VER bumped 10 → 11 — forces PWA hard reload for all installed instances
[DEPLOY] Pushed to main → Cloudflare Pages auto-deploy

---

## Session 12 — 2026-04-20

### Battle System Overhaul

[FEAT] Auto-battler replaces manual tap-to-attack
       Rounds auto-advance every 2.2 seconds via useEffect + setTimeout
       Every 2nd round triggers a brain game minigame
       Odd rounds auto-resolve immediately
       No more tap-enemy grid — battle is now a spectator experience with optional input

[FEAT] Brain game minigames — three types, one fires each even round
       DigiCode (Focus Check):
         - 4 tiles display with symbols (★ ◈ ▲ ◆)
         - One tile glows for 900ms (reveal phase), then hides
         - Player has 2.5s to tap the correct tile
         - Success → focus_success: crit chance raised to 80% on next attack
       Momentum Burst (Timing):
         - Horizontal bar with a green zone (32–68%)
         - Animated dot slides left-to-right over 2 seconds
         - Tap to stop the dot; position calculated from timestamp delta (no animation state)
         - Hit zone → momentum_success: guaranteed double-strike next round
       Guard Wall (Direction Block):
         - 4 direction arrows (↑ ↓ ← →)
         - One glows for 900ms then hides
         - Player has 2.5s to tap the correct direction
         - Success → guard_success: incoming enemy damage reduced to 18% of normal
       Auto-fail after 2.5s with no answer → resolves round with "fail" (no bonus, no penalty)

[FEAT] All 4 battle stats now mechanically active
       Power:    base attack damage (1.2 × Power − 0.8 × defender Guard)
       Guard:    reduces incoming enemy damage (used in defender calc)
       Focus:    crit chance (Focus / 200, max 30%); DigiCode success pushes to 80%
       Momentum: double-strike chance (Momentum / 200, max 35%); Timing success guarantees it

[FEAT] Smolder passive — burn DoT applied when attacker has "smolder" in passive text
       Defender takes 12% of attacker Power per round for 3 rounds
       Burn ticks appear in battle log with 🔥 icon

[FEAT] Signature skill — fires automatically once when attacker drops below 50% HP
       Deals 2.2 × attacker Power to first alive enemy
       Logged with 💫 icon and skill name from digimon.js signature field

[FEAT] calcBattleDamage updated to return { damage, crit } with opts parameter
       opts.focusBonus: pushes crit chance to 80%
       Replaces old single-number return; all callers updated

[REFACTOR] resolveRoundLogic() — pure module-level function
           Takes battleState snapshot + mgResult string, returns new battleState
           Handles: player attack, crit, double-strike, burn DoT, enemy counter, signature, end check
           buildMinigame(type) — pure factory, returns minigame state object

### P.E.T. Compact Cards + Digimon Summary Modal

[UI] P.E.T. team page redesigned — compact card layout
     52px sprite + stage/level/personality badges + thin XP bar + INFO ▸ button
     Cards fit 3-per-row on mobile; tappable to open full summary modal

[FEAT] Digimon Summary Modal — Pokémon-style species profile popup
       Sections: PROFILE (lore description), COMBAT (all 4 stats with coloured bars),
       GROWTH (current XP / level, evolution path), DIGIVOLUTION (evo options)
       renderStatBar() used as a plain function (not React component) to avoid render-time
       component definition warnings

### Digimon Lore Descriptions

[FEAT] desc field added to digimon.js entries
       Plain-language species lore shown in:
         - Digimon Summary Modal (P.E.T. INFO button)
         - Evolution animation overlay (below hatch animation)
         - DigiDex detail modal (PROFILE section before BATTLE STATS)
       Descriptions written for fans and newcomers alike

[FEAT] Mokumon description added — ethereal smoke-body Baby, ember core, fire alignment
[FEAT] PetiMeramon description added — fierce Digicore, fire bullets, weak to Water/Ice

### Crest Visualisation

[UI] Tamer Profile crest radar replaced with Crest Compass (SVG octagonal radar)
     CrestCompass component: uses actual crest PNG icons at each axis node
     Per-crest glow filters with feGaussianBlur; polygon fill scales by alignment %
     Icons placed at outerR = 76% of half-size; polygon at 65% — icons sit outside the web
     Filter IDs scoped per-instance by appending size to prevent SVG ID collisions

[UI] Homepage crest widget replaced — was 160px CrestCompass (icons too small to read)
     Now shows Tendency Strips: horizontal bars with raw point totals, sorted by value
     Top crest bar fills 100%; all others scale relative; zero-point crests hidden

[UI] Crests page ALIGNMENT PROFILE — replaced % bars with Tendency Strips
     Shows raw point totals from crestProfile.totals (not percentages)
     Rationale: % bars always look "incomplete" since crests are relative effort scores;
     raw totals read as earned effort with no "unfilled" feeling

### Digivolution Animation

[FIX] Evo animation auto-closed after 3.2s — too fast to read the new desc text
      Fix: removed auto-timeout entirely; overlay now requires a tap to dismiss
      Entire overlay is a click target; "TAP TO CONTINUE" hint at bottom
      evoIn keyframe changed from fade loop to one-shot scale-in (forwards fill)
      New Digimon description shown below hatch animation when desc field exists

### Jijimon 5am Recap

[FIX] Jijimon catch-up recap was including tasks already completed yesterday
      Fix: incomplete task filter now only surfaces tasks with no lastCompletedDate
      matching yesterday — completed tasks are excluded from the recap list

[FIX] Jijimon in catch-up prompt used mood="happy"; changed to mood="idle" (walk frames)
      Reason: Jijimon standing alert/neutral is more appropriate for a solemn recap

### Digivolve Race Condition

[FIX] Evolution being undone — Realtime UPDATE event or refreshData() arriving during
      digivolve() overwrote the optimistic party state with stale pre-evolution data
      Fix: digiMutRef counter incremented before DB write; decremented after 3s timeout
      Both applyDigimonPayload and refreshData check digiMutRef > 0 and skip party update
      while a mutation is in flight — prevents any stale echo from reverting the evolution

### Deploy

[DEPLOY] DV_VER not yet bumped — do before next Cloudflare push
[DEPLOY] Pushed to main (commit 3c447e7) → Cloudflare Pages deploy pending

---

## Session 13 — 2026-04-28

### Bond System Fix

[FIX] Play action only updating bond for party[0], not all party members
      Root cause: updateActiveBond() used setParty(p => ...) patching only p[0],
      and supabase update targeted activeDigi.uid — both referencing the first slot only
      Fix: rewrite playAction() to map over all party members, apply +1 bond to each,
      use Promise.all() for parallel DB updates across the full party
      Result: PetitMeramon, Renamon, and any non-leader partner now gain bond correctly

### Task View — Quest Board Style

[UI] Stripped visual clutter from task cards — removed: template name, type badge,
     XP reward, crest reward tags, priority/urgency label
     Rationale: cards should communicate "what to do" not "what you'll get"

[UI] Crest icon now always visible on every task card (bottom-left)
     Crest symbol shown without label — serves as a quest board reward hint

[UI] ◈ toggle button per card — reveals full reward inline when tapped
     Expanded state shows: type badge, XP, crest+amount, priority label
     State tracked per card id in expandedCards object; does not persist on refresh

[UI] Tap card body → opens detail popup (bottom sheet)
     Popup shows: title, notes, full tag set, Complete + Edit quick actions
     detailTask state; clicking outside or × closes it

### Digimon Lore Descriptions — Batch 1

[FEAT] desc field added to all 21 Baby stage Digimon
       Mokumon description shortened from 68 words to 38 (was overflowing profile modal)
       All others: 28-36 words, 2 sentences, lore-accurate + fan-accessible tone

[FEAT] desc field added to all 26 In-Training stage Digimon
       PetitMeramon desc retained from Session 12

[FEAT] desc field added to Agumon full line (Agumon → VictoryGreymon, 9 entries)
       Betamon, Seadramon, Airdramon descs added

### Profile Modal — UX Fixes

[FIX] Digimon profile modal close button (✕) unreachable on long descriptions
      Root cause: outer backdrop was the scroll container; button scrolled off-screen
      Fix: move overflowY:auto + flex:1 to the body div inside the card;
      card itself is now display:flex + flexDirection:column + maxHeight:90vh
      Close button stays pinned at top of card regardless of content length

[UI] Modal backdrop padding adjusted for equal visual clearance
     paddingTop:68px (52px nav height + 16px matching gap)
     Bottom remains 16px — equal gap feel top and bottom
     backdrop inset:0 preserved so overlay covers nav area cleanly

### Heading

[UI] Team view section heading changed from "P.E.T. — PARTNER EVOLUTION TERMINAL"
     to "PARTNER EVOLUTION TERMINAL" — cleaner, no redundant prefix

### Deploy

[DEPLOY] Commit 57f0830 pushed to main → Cloudflare Pages auto-deploy triggered
[DEPLOY] GitHub: securityguidebook/DailyDigivolve (note: repo casing updated by GitHub)

---

## Features Pipeline

### Near-term (next sessions)

[x] Sleep wake-up notification ✅ Session 10
[x] Service worker background timer notifications ✅ Session 10
[x] Wellness task template ✅ Session 10
[x] Same-day nap/siesta support ✅ Session 10
[x] Crest stage system ✅ Session 11
[x] Login reward calendar ✅ Session 11
[x] Tamer level + unlocks ✅ Session 11
[x] Auto-battler with brain games ✅ Session 12
[x] All 4 battle stats mechanically active ✅ Session 12
[x] Crest Compass + Tendency Strips ✅ Session 12
[x] Digimon Summary Modal (P.E.T. INFO) ✅ Session 12
[x] Digimon lore descriptions (desc field) ✅ Session 12 (Mokumon + PetiMeramon; others pending)

[x] Bond fix — play action now updates all party members ✅ Session 13
[x] Task view cleanup — quest board style, crest icon always visible, ◈ expand toggle ✅ Session 13
[x] Profile modal scrollable with pinned close button ✅ Session 13
[x] Digimon lore descs — Baby + In-Training stages complete; Agumon line + Betamon/Airdramon ✅ Session 13

[ ] Roster lore descriptions — complete remaining ~80 Digimon entries
    Done: Baby (21), In-Training (26), Agumon line (9), Betamon/Seadramon/Airdramon (3)
    Remaining: full Betamon line, Gabumon, Gaomon, Guilmon, all Rookie-Mega lines

[ ] Minigame expansion — integrate brain games into PLAY button as standalone daily games
    Concept: DigiCode / Timing Burst / Guard Wall playable outside battle for small bond/bit rewards
    Future expansion: Wordle-style word game, pattern memory, reaction tests
    These could become daily mini-challenges with streak bonuses

[ ] Google Calendar export — "Add to Calendar" on scheduled once tasks (.ics or Calendar API)

[ ] Bond display per digimon in team view — individual bond bar per party member card

[ ] De-digivolution — slide evolution back when crest alignment diverges
[ ] DNA Digivolution — fusion evolution requiring two party Digimon
[ ] Pomodoro sessions tracked over time — weekly focus stats on Tamer Profile
[ ] PvP sparring — async challenge between two tamers

### Medium-term

[ ] Campaign mode — story stages with escalating difficulty (beyond single raid event)
[ ] Raid state as true community pool — shared totalDamage across all users via Supabase
[ ] Crest Catalyst shop item — +3 to lowest active crest (1 per week)
[ ] Partner Vow shop item — enables vow evolution path
[ ] Weekly focus stats — Pomodoro session history on Tamer Profile
[ ] Apple Calendar / Reminders — .ics file export (.ics is the only browser path; no direct Apple Calendar API)

### Long-term

[ ] Mobile app (React Native / Expo) — native app after PWA validates engagement
    Note: true background execution, Apple Alarm integration, and widgets require native app
[ ] Apple Watch / Wear OS companion
[ ] DigiVice hardware prototype (ESP32-S3 + LVGL)
[ ] dailydigivolve.com domain + NZ company registration

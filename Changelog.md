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

## Features Pipeline

### Near-term (next sessions)

[ ] Sleep wake-up notification — wire existing sleepState.wakeTime to a Web Notification
    Small change (~10 lines in handleSleep): setTimeout fires Notification at exact wake timestamp
    Works when PWA is backgrounded; requires notification permission (already requested by Pomodoro)

[ ] Service worker + Web Push — true background push notifications when PWA is fully closed
    Required for: reliable Pomodoro alerts, sleep alarms, 5am catch-up prompt when app not open
    Stack: VAPID key pair + Supabase Edge Function (push sender) + service worker (receiver)
    Estimated effort: one full session
    Unlocks: all notification types work even after user swipes PWA away from app switcher

[ ] Google Calendar export — "Add to Calendar" button on scheduled once tasks
    Creates Google Calendar event via Calendar API or .ics file download
    OAuth required for direct API sync; .ics file is simpler (manual import, no auth)

[ ] De-digivolution — slide evolution back when crest alignment diverges significantly
[ ] DNA Digivolution — fusion evolution requiring two Digimon in party
[ ] Pomodoro sessions tracked over time — weekly focus stats on Tamer Profile
[ ] PvP sparring — async challenge between two tamers

### Medium-term

[ ] Campaign mode — story stages with escalating difficulty (beyond single raid event)
[ ] Raid state as true community pool — shared totalDamage across all users via Supabase
[ ] Crest Catalyst shop item — +3 to lowest active crest (1 per week) [defined, not yet in Store UI]
[ ] Partner Vow shop item — enables vow evolution path [defined, not yet in Store UI]
[ ] Onboarding: Jijimon animated sprite (replace placeholder GIF)
[ ] Weekly focus stats — Pomodoro session history on Tamer Profile
[ ] Apple Calendar / Reminders — .ics file export from task due dates (no auth needed)
    Note: direct Apple Calendar API not accessible from web; .ics is the only browser path

### Long-term

[ ] Mobile app (React Native / Expo) — native app after PWA validates engagement
    Note: true background execution, Apple Alarm integration, and widgets require native app
[ ] Apple Watch / Wear OS companion
[ ] DigiVice hardware prototype (ESP32-S3 + LVGL)
[ ] dailydigivolve.com domain + NZ company registration

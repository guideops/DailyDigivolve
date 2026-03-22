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

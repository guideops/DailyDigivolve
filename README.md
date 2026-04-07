# DailyDigivolve

> **Raise a Digimon by completing your daily tasks.**
> The productivity app that makes habit-building feel like an adventure.

Live: [dailydigivolve.pages.dev](https://dailydigivolve.pages.dev)

---

## What is DailyDigivolve?

DailyDigivolve is a gamified productivity app where your real-world habits and completed tasks raise a Digimon companion. The more consistently you work, the stronger your partner grows — and the stronger it grows, the closer it gets to its next Digivolution.

It is part task manager, part virtual pet, part RPG — built for people who need more than a checkbox to stay motivated.

Your Digimon has a **personality**, a **battle system**, an **AI companion chat** that responds in character based on your actual task progress, and a full evolution chain from Baby all the way to Mega. Show up every day and it thrives.

---

## Features

### Task System
- **Three task types** — One-Time, Daily, and Recurring (set specific days of the week)
- **Priority levels** — Low, Medium, High, Urgent — each applies an XP multiplier
- **Difficulty levels** — Easy, Medium, Hard — affects XP and ABI gain
- **Stat categories** — HP / SP / ATK / DEF / INT / SPD — completing a task in a category boosts that stat directly on your Digimon
- **Streak tracking** — consecutive task completions multiply XP up to 2×
- **7-day purge** — completed one-time tasks auto-delete after 7 days

### Digimon System
- **10 full evolution lines** — Agumon, Patamon, Salamon, Gabumon, Tentomon, Palmon, Veemon, Guilmon, Lopmon, Renamon
- **Full chains** — Baby → In-Training → Rookie → Champion → Ultimate → Mega
- **Evolution requirements** calibrated to Digimon World / Cyber Sleuth:
  - Level + ABI thresholds per stage
  - Stat thresholds at Champion+ (e.g. Greymon needs ATK 120)
- **ABI system** — earned by completing tasks (Easy +0.1 / Medium +0.2 / Hard +0.3 per task)
  - Fractional progress stored in DB; whole points accumulate in abi column
  - ABI unlocks evolutions and bonus stat capacity
- **Personality system** — six personalities (Durable, Lively, Fighter, Defender, Brainy, Nimble), each boosting a different stat by 5%
- **meetsEvoReq()** — pure JS function checking all level/ABI/stat gates simultaneously

### Party System
- **Party of up to 3** active Digimon at once
- **Leader** — party[0] is shown in the left panel and used for AI chat
- **Set Leader** — promote any party member to leader; sort order persisted to DB
- **DigiFarm** — unlimited cold storage for Digimon not in active party
- **Equal XP sharing** — all 3 party members receive the same XP, stat boost, and ABI on every task completion

### Login Streak & Digitama System
- **Daily login streak** tracked — consecutive logins increment, missed day resets
- **Digitama eggs** awarded at every 30-day milestone
- **8 egg types** — each hatches a different Baby Digimon line:
  - Flame → Botamon (Agumon line)
  - Holy → Punimon (Patamon line)
  - Wind → Poyomon (Salamon line)
  - Beast → Pabumon (Gabumon line)
  - Dragon → Jyarimon (Guilmon line)
  - Nature → Kuramon (Palmon line)
  - Mystic → Viximon (Veemon/Renamon line)
  - Shadow → Pagumon (Lopmon line)
- **Reset Team** — confirmation dialog → wipes party → awards 1 Digitama to pick a new starting partner

### Sprite System
- **44 PNG sprites** — animated 16×16 pixel art sheets (48×64, 3×4 grid)
- **Three render modes** — grid sheet, horizontal strip, or individual frames
- **Graceful fallback** — SVG placeholder shown immediately while PNG loads; stays SVG if file missing
- **Digidex** — shows all Digimon with PNG/SVG badge indicating which sprites are active

### AI Companion Chat
- Each Digimon has a fully voiced AI personality powered by Claude
- The AI knows your actual task state — pending tasks, streaks, urgent items, completion rate
- Personality shapes every response
- SMS-style interface with typing indicator and quick replies
- Runs through a server-side Cloudflare Worker — API key never reaches the browser

### Battle System
- Turn-by-turn battles against wild Digimon
- Three difficulty tiers with bit rewards (Easy / Medium / Hard)
- Your full party of 3 fights together

### Digidex
- Shows all Digimon regardless of discovery status
- PNG/SVG badge on each card
- Progress bar toward full completion

### Store
- Earn bits from battles
- Spend on stat boosters and items

---

## Roadmap

### In Pipeline
- [ ] Voice-to-text task entry — speak a task, app auto-fills
- [ ] AI auto-task management — AI suggests edits, auto-completes or creates tasks from chat
- [ ] Party max cap review — may expand beyond 3

### Near Term
- [ ] Server-side game validation (XP, evolution, battles)
- [ ] React Native mobile app (iOS and Android)
- [ ] Push notifications — Digimon alerts on your phone
- [ ] DigiPass subscription tier

### Hardware — the DigiVice
DailyDigivolve is being built toward a **proprietary wearable** — a physical DigiVice that pairs with the app over Bluetooth.

- [ ] Apple Watch / Wear OS companion app
- [ ] ESP32 DigiVice prototype (3D printed, BLE)
- [ ] Custom PCB DigiVice
- [ ] Commercial DigiVice run

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 7 |
| Styling | Inline styles — no framework dependency |
| Sprites | 16×16 PNG sprite sheets + SVG fallback |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| Deployment | Cloudflare Pages |
| API proxy | Cloudflare Workers (Pages Functions) |
| AI chat | Anthropic Claude API (Haiku model) |
| Mobile *(pipeline)* | React Native + Expo |
| Hardware *(pipeline)* | ESP32-S3 + LVGL + BLE GATT |

---

## Database Schema

### `profiles`
| Column | Type | Description |
|---|---|---|
| id | uuid | Supabase auth user ID |
| bits | integer | In-game currency |
| saved_stats | integer | Unallocated stat points |
| login_streak | integer | Consecutive daily logins |
| last_login_date | date | Last login date for streak tracking |
| digitama_credits | integer | Pending egg credits (30-day rewards) |

### `digimon`
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| species_id | text | e.g. "agumon", "greymon" |
| name | text | Custom or default name |
| level | integer | Current level |
| exp / exp_needed | integer | XP progress |
| abi | integer | ABI points |
| bonus_stats | jsonb | Per-stat bonuses + abi_progress float |
| personality | text | One of 6 personality IDs |
| discovered | text[] | All species this Digimon has been |
| in_farm | boolean | True = DigiFarm, False = active party |
| sort_order | integer | Position in party (0 = leader) |

### `tasks`
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| title | text | Task description |
| category | text | HP / SP / ATK / DEF / INT / SPD |
| priority | text | Low / Medium / High / Urgent |
| difficulty | text | Easy / Medium / Hard |
| type | text | once / daily / recurring |
| days_of_week | text[] | For recurring tasks |
| done | boolean | Completion state (resets daily) |
| streak | integer | Consecutive completions |
| last_completed_date | date | For streak and reset logic |

---

## Project Structure

```
dailydigivolve/
├── functions/
│   └── api/
│       └── chat.js              ← Cloudflare Worker — Claude API proxy
├── public/
│   └── sprites/                 ← 44 PNG sprite sheets (16×16, 3×4 grid)
├── src/
│   ├── data/
│   │   ├── digimon.js           ← 10 evolution lines, all evoRequires data
│   │   ├── constants.js         ← XP, colours, STAT_CATEGORIES, MAX_PARTY_SIZE
│   │   ├── engine.js            ← Pure game logic (calcStats, meetsEvoReq, etc.)
│   │   ├── sprites.js           ← PNG sprite config per Digimon ID
│   │   └── personalities.js     ← AI chat personality prompt builders
│   ├── components/
│   │   ├── DigiSprite.jsx       ← PNG animator + SVG fallback
│   │   └── ui.jsx               ← Bar, Tag, Btn shared components
│   ├── pages/
│   │   └── ChatPage.jsx         ← AI companion chat tab
│   ├── App.jsx                  ← Main app + all page routing
│   └── main.jsx                 ← React entry point
├── supabase/
│   └── migrations/              ← SQL migration files
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier)
- A Cloudflare account (free)
- An Anthropic API key

### Local Development

```bash
git clone https://github.com/YOUR_USERNAME/dailydigivolve.git
cd dailydigivolve
npm install

# Create local secrets (already gitignored)
echo "CLAUDE_API_KEY=sk-ant-your-key-here" > .dev.vars

# Run dev server
npm run dev
```

Open `http://localhost:5173`

**Testing chat without API calls:** In `src/pages/ChatPage.jsx` set `const USE_MOCK = true`

### Supabase Setup

1. Create a project at supabase.com
2. Run the SQL migrations in `supabase/migrations/` in order
3. Add your Supabase URL and anon key to `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Enable Email Auth in Supabase → Authentication → Providers

### Deploy to Cloudflare Pages

```bash
npm run build
# Then connect GitHub repo in Cloudflare Dashboard
# Build command: npm run build
# Output dir:    dist

# Environment variable in Cloudflare:
# CLAUDE_API_KEY = sk-ant-your-key-here
```

---

## Contributing

1. Fork the repo
2. Create a feature branch — `git checkout -b feature/your-idea`
3. Make your changes
4. Open a pull request

Areas especially welcome:
- New Digimon lines and evolution paths
- Additional 16×16 PNG sprite sheets
- Mobile app (React Native / Expo)
- Hardware firmware (ESP32 / LVGL)

---

## Acknowledgements

- Digimon is a registered trademark of Bandai Namco. This is a fan-made, non-commercial application.
- Pixel sprites sourced from community archives.
- AI chat powered by [Anthropic Claude](https://anthropic.com).
- Built on [Cloudflare Pages](https://pages.cloudflare.com), [Supabase](https://supabase.com), and [Vite](https://vitejs.dev).

---

## Licence

MIT — see `LICENSE` for details.

---

*DailyDigivolve — because the best way to build habits is to make something else depend on them.*

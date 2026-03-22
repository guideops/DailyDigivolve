# DailyDigivolve

> **Raise a Digimon by completing your daily tasks.**
> The productivity app that makes habit-building feel like an adventure.

---

## What is DailyDigivolve?

DailyDigivolve is a gamified productivity app where your real-world habits and completed tasks raise a Digimon companion. The more consistently you work, the stronger your partner grows — and the stronger it grows, the closer it gets to its next Digivolution.

It is part task manager, part virtual pet, part RPG — built for people who need more than a checkbox to stay motivated.

Your Digimon has a **personality** (Lively, Stoic, Playful, Stern, Durable, or Brainy), a **battle system**, an **AI-driven chat** that responds in character based on your actual task progress, and a full evolution chain from Baby all the way to Mega. Neglect your tasks and your partner suffers. Show up every day and it thrives.

---

## Features

### Task System
- **Three task types** — One-Time, Daily, and Recurring (set specific days of the week)
- **Priority levels** — Low, Medium, High — each applies an XP multiplier
- **Difficulty levels** — Easy, Medium, Hard — affects XP gain and stat rewards
- **Streak tracking** — consecutive completions multiply XP up to 2.0x
- **Notes** — add context to any task
- **Categories** — Work, Personal, Health, Study, Creative, Social, Other

### Digimon System
- **30+ Digimon** across multiple evolution lines — Agumon, Gabumon, Guilmon, Palmon, Coronamon, and more
- **Full evolution chains** from Baby → Rookie → Champion → Ultimate → Mega
- **DNA Digivolution** — fuse two Digimon into rarer forms (Omnimon, GraceNovamon, Omnimon Alter-S)
- **X-Antibody forms** — unlock mutated variants with a 10% stat boost
- **ABI system** — evolving and devolving builds ABI, which unlocks bonus stat capacity and certain evolutions
- **Personality system** — six personalities each boost a different stat by 5%
- **Mood system** — your Digimon's expression reflects your progress

### AI Companion Chat
- Each Digimon has a fully voiced AI personality powered by Claude
- The AI knows your actual task state — pending tasks, streaks, urgent items, completion rate
- Personality shapes every response: Stoic gives cold tactical feedback, Lively shouts encouragement, Brainy analyses your productivity stats, Stern demands accountability
- SMS-style chat interface with quick replies and typing indicator
- Runs through a server-side API proxy — your key is never exposed in the browser

### Battle System
- Interactive turn-by-turn battles against wild Digimon and other players
- Visual Turn Order panel showing upcoming turns
- Type and attribute matchup multipliers visible before confirming attacks
- Auto mode available for hands-off battles
- Arena difficulty tiers (Easy / Medium / Hard) with risk/reward bit economy

### Weekly Boss
- Community effort phase (Mon–Fri): complete tasks to weaken the boss
- Battle phase (Sat–Sun): fight the boss directly
- Rotating bosses with HP shared across all players

### Campaign Mode
- 60 stages following the Digimon Adventure storyline
- Progressively harder enemy teams
- Stage-gated unlocks for the most powerful evolutions

### DigiFarm
- Store Digimon you want to keep but aren't actively using
- Unlimited farm capacity alongside the 9-slot active party
- Playground mode — interact with stored Digimon

### Digidex
- Discover and log every Digimon you encounter or evolve
- Progress bar toward full completion

### Leaderboards & Profiles
- Global leaderboard by streak and battle count
- Player profiles showing Digimon team and earned titles
- Titles unlocked through campaign progression, discoveries, and milestones

### Store
- Earn bits from Arena battles
- Spend on stat boosters, X-Antibody items, personality changers, random Digimon discovery
- Evolution items required for certain special evolutions (Armor, Spirit, X-Antibody forms)

---

## Roadmap

### Near term
- [ ] User accounts and cloud sync via Supabase
- [ ] Server-side game validation (XP, evolution, battles)
- [ ] React Native mobile app (iOS and Android)
- [ ] Push notifications — Digimon alerts on your phone
- [ ] DigiPass subscription tier

### Hardware — the DigiVice
DailyDigivolve is being built toward a **proprietary wearable** — a physical DigiVice that pairs with the app over Bluetooth. The device shows your Digimon on a circular display, delivers haptic alerts for urgent tasks, and lets you complete tasks directly from your wrist.

The watch interface is designed to be entirely different from an Apple Watch app — this is a collector's item with its own identity. A real Digivice for adults.

- [ ] Apple Watch / Wear OS companion app
- [ ] ESP32 DigiVice prototype (3D printed, BLE)
- [ ] Custom PCB DigiVice — proper form factor
- [ ] Commercial DigiVice run — injection-moulded, IP67

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Inline styles + CSS variables — no framework dependency |
| Sprites | Pure SVG — no image files, infinitely scalable |
| Deployment | Cloudflare Pages |
| API proxy | Cloudflare Workers (Pages Functions) |
| AI chat | Anthropic Claude API (Haiku model) |
| Database *(coming)* | Supabase — Postgres + Auth + Realtime |
| Mobile *(coming)* | React Native + Expo |
| Hardware *(coming)* | ESP32-S3 + LVGL + BLE GATT |

---

## Project Structure

```
dailydigivolve/
├── functions/
│   └── api/
│       └── chat.js          ← Cloudflare Worker — Claude API key lives here
├── src/
│   ├── data/
│   │   ├── digimon.js       ← All Digimon species data
│   │   ├── constants.js     ← XP multipliers, colours, game constants
│   │   ├── engine.js        ← Pure game logic (no React dependency)
│   │   └── personalities.js ← AI chat personality definitions
│   ├── components/
│   │   ├── DigiSprite.jsx   ← Pixel art SVG renderer
│   │   └── ui.jsx           ← Bar, Tag, Btn shared components
│   ├── pages/
│   │   └── ChatPage.jsx     ← AI companion chat tab
│   ├── App.jsx              ← Main app + all page routing
│   └── main.jsx             ← React entry point
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Cloudflare account (free)
- An Anthropic API key (free credits on signup at console.anthropic.com)

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/dailydigivolve.git
cd dailydigivolve

# Install dependencies
npm install

# Create local secrets file (already gitignored)
echo "CLAUDE_API_KEY=sk-ant-your-key-here" > .dev.vars

# Run with Cloudflare Workers support
npx wrangler pages dev --compatibility-date=2024-01-01 -- npm run dev
```

Open `http://localhost:5173`

**Testing without API calls (free, instant):**
In `src/pages/ChatPage.jsx` set `const USE_MOCK = true` — the chat returns hardcoded responses, no API calls made.

### Deploy to Cloudflare Pages

```bash
# Build
npm run build

# Then in Cloudflare Dashboard:
# Pages → Create application → Connect GitHub → select dailydigivolve
# Build command:  npm run build
# Output dir:     dist

# Add environment variable:
# Pages → dailydigivolve → Settings → Environment Variables
# CLAUDE_API_KEY = sk-ant-your-key-here
```

---

## Contributing

DailyDigivolve is in active development. If you want to get involved:

1. Fork the repo
2. Create a feature branch — `git checkout -b feature/your-idea`
3. Make your changes
4. Open a pull request with a clear description of what you built and why

Areas where contributions are especially welcome:
- New Digimon lines and evolution paths
- Additional dot sprites (32×32) from Digimon games
- Battle move learnsets from Cyber Sleuth
- Mobile app (React Native / Expo)
- Hardware firmware (ESP32 / LVGL)

---

## Acknowledgements

- Digimon is a registered trademark of Bandai. This project is a fan-made, non-commercial application.
- Dot sprites sourced from community archives. Credits to original sprite artists.
- AI chat powered by [Anthropic Claude](https://anthropic.com).
- Built on [Cloudflare Pages](https://pages.cloudflare.com) and [Vite](https://vitejs.dev).

---

## Licence

MIT — see `LICENSE` for details.

---

*DailyDigivolve — because the best way to build habits is to make something else depend on them.*

# WARHAMMER LEVELING

> *"In the grim darkness of the far future, there is only... productivity."*

A dark, immersive CRPG-style gamification system set in the Warhammer 40,000 universe. Turn your real-life daily tasks into missions for the God-Emperor. Complete workouts, study sessions, and personal goals to level up your character, unlock psychic powers, forge alliances, and survive the horrors of the 41st Millennium.

This isn't a to-do app with a coat of paint. This is a full role-playing experience where your discipline shapes your destiny, your sanity frays at the edges, and the Warp whispers to those who dare listen.

---

## The Imperium Demands Your Discipline

**Warhammer Leveling** merges real-life habit tracking with deep RPG mechanics inspired by *Dark Heresy* and *Warhammer 40K* tabletop games:

- **Create your Operative** from 6 origins, 8 backgrounds (including two Psyker paths), and 8 personality traits
- **Complete real-world tasks** to earn XP, level up, and gain stat points across 9 primary attributes
- **Descend into narrative** with a branching story system, typewriter text, and skill checks
- **Fight turn-based combat** with hit locations, weapon jamming, flanking, and critical hits
- **Wield psychic powers** across 5 disciplines and 5 tiers, risking Perils of the Warp
- **Watch your sanity erode** as the Unreliable Narrator system glitches the UI, spawns fake notifications, and distorts reality
- **Manage corruption** that mutates your character and warps the interface
- **Build relationships** with NPCs, unlock romances, and navigate breaking points
- **Navigate faction politics** across 7 factions with cross-faction reputation effects
- **Upgrade your quarters** from underhive hovel to spire penthouse

---

## Architecture

Built with **Clean Architecture** principles for maximum separation of concerns:

```
src/
├── domain/           # Pure business logic - zero dependencies
│   ├── models/       # 19 type-safe domain models
│   ├── engine/       # 19 game engines (combat, sanity, psychic, etc.)
│   ├── interfaces/   # Repository contracts
│   └── config.ts     # Master balance configuration
│
├── application/      # Use cases & services
│   ├── use-cases/    # 35 use cases across 8 domains
│   └── services/     # Game state aggregation, save management
│
├── infrastructure/   # External concerns
│   ├── database/     # SQLite + Drizzle ORM, 10 repositories
│   ├── data-loader/  # JSON game data pipeline
│   └── di/           # Dependency injection container
│
└── app/              # Next.js 14 App Router
    ├── api/          # 9 REST API routes
    ├── game/         # 13 game pages with sidebar navigation
    └── components/   # 32 React components (UI, game, effects)
```

**Domain Layer** (`domain/`) — Pure TypeScript, zero imports. Contains all game rules: stat calculations with diminishing returns, d100 skill checks, hit location tables, psychic phenomena, corruption thresholds, sanity decay, economy simulation, and more. Every engine is deterministic and fully testable.

**Application Layer** (`application/`) — Orchestrates domain logic through use cases. Each use case represents a single game action: create a character, complete a task, execute a combat action, use a psychic power. Services aggregate state for the UI.

**Infrastructure Layer** (`infrastructure/`) — SQLite persistence via Drizzle ORM, JSON data loading with caching, and a DI container that wires everything together per save file.

**Presentation Layer** (`app/`) — Next.js 14 with App Router, server-side API routes, client-side React components with Tailwind CSS, Framer Motion animations, and a custom gothic visual theme.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS (custom gothic theme) |
| Animation | Framer Motion |
| Validation | Zod |
| Icons | Lucide React |
| Testing | Vitest |

---

## Game Systems

### Character Creation
Eight-step creation wizard with origin worlds, backgrounds, personality traits, appearance customization, and 20 bonus stat points distributed across 9 attributes. Each choice mechanically impacts your character:

| Origin | Bonuses | Penalties |
|--------|---------|-----------|
| Hive World | AGI +5, PER +5 | FEL -5, TGH -5 |
| Forge World | INT +10, TGH +5 | FEL -10, WP -5 |
| Feral World | WS +10, STR +5 | INT -10, FEL -5 |
| Void Born | WP +5, INT +5, PER +5 | STR -5, TGH -5 |
| *...and more* | | |

### Task Engine
Real-world tasks map to in-game categories. Each completed task:
- Awards XP scaled by difficulty (1-8 scale)
- Grants fractional stat gains to primary and secondary attributes
- Tracks streaks with escalating multipliers (7-day: 1.5x, 30-day: 3x, 90-day: 5x)
- Applies diminishing returns after 3 same-category completions per day
- Can award Thrones (currency) for professional-category tasks

### Combat System
Full turn-based tactical combat:
- **d100 skill checks** against Weapon Skill / Ballistic Skill
- **Hit locations** with weighted probability (head 10%, body 30%, limbs 15% each)
- **Weapon conditions** that degrade with use (pristine → broken) affecting performance and jam chance
- **Tactical options**: aim, charge, flank, all-out attack, defensive stance
- **Critical hits** when exceeding the threshold by 30+
- **AI turn processing** for enemy combatants

### Psychic Powers
26 powers across 5 disciplines and 5 tiers:
- **Perils of the Warp** with severity rolls from negligible to catastrophic
- **Sanity-modified** peril chances that escalate as your mind breaks
- **Corruption gain** from every psychic manifestation
- Two psyker backgrounds: **Outcast Psyker** (raw, dangerous) and **Sanctioned Psyker** (disciplined, trained)

### Sanity System — The Unreliable Narrator
Your sanity isn't just a number. As it drops, the *game itself* becomes unreliable:

| State | Sanity | Effect |
|-------|--------|--------|
| Stable | 80+ | Normal gameplay |
| Stressed | 60-79 | 5% chance of fake notifications |
| Disturbed | 40-59 | 15% fake notifications, minor text glitches |
| Breaking | 20-39 | 30% fake notifications, screen distortions |
| Shattered | 1-19 | 50% fake notifications, severe glitching |
| Lost | 0 | Everything is a lie |

The UI actively works against you. Notifications you can't trust. Text that rewrites itself. A screen that fractures. Self-care tasks (meditation, exercise, rest) are your only lifeline.

### Corruption & Mutations
Corruption accumulates through psychic use, Warp exposure, and dark choices. At thresholds (26, 41, 61, 76, 91), mutations manifest — some beneficial, most horrifying. The UI reflects your taint with visual corruption effects.

### Faction Politics
7 factions with interconnected reputation:
- **Imperium, Ecclesiarchy, Inquisition** — The pillars of order
- **Mechanicus** — The seekers of knowledge
- **Chaos, Xenos** — The enemies of mankind
- **Underworld** — The shadow economy

Gaining standing with one faction ripples across all others. Befriend Chaos, and the Inquisition takes notice.

### Economy & Housing
Earn Thrones through tasks and trade. Upgrade your quarters from an **Underhive Hovel** (5 Thrones/rent) to **Spire Quarters** (300 Thrones/rent). Each housing level affects gameplay and unlocks new opportunities.

### System Evolution
The game itself evolves as you level. New mechanics unlock progressively:
- **Level 1-5**: Basic tasks, XP tracking, character sheet
- **Level 10**: Combat system, NPCs, relationships
- **Level 15**: Sanity system, psychic powers
- **Level 20**: Advanced combat, economy
- **Level 25+**: Mutations, Perils of the Warp, housing
- **Level 35+**: Romance, narrative events
- **Level 50**: Ascension

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/AcarKaan78/WarhammerLeveling.git
cd WarhammerLeveling
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and begin your service to the Emperor.

### Testing

```bash
npm test          # Watch mode
npm run test:run  # Single run (166 tests)
```

---

## Project Stats

| Metric | Count |
|--------|-------|
| Source Files | 120+ |
| Domain Models | 19 |
| Game Engines | 19 |
| Repository Interfaces | 11 |
| SQLite Repositories | 10 |
| Use Cases | 35 |
| API Routes | 9 |
| React Components | 32 |
| Custom Hooks | 5 |
| Game Pages | 14 |
| JSON Data Files | 12 |
| Test Files | 14 |
| Tests | 166 |
| Lines of TypeScript | ~10,000+ |

---

## Screenshots

*Coming soon — the Emperor protects, but screenshots take time.*

---

## Roadmap

- [ ] Expanded narrative content (story scenes, events, NPC dialogues)
- [ ] Sound effects and ambient audio
- [ ] Mobile-responsive layout
- [ ] Multiplayer warband system
- [ ] Steam/Electron desktop build
- [ ] Extended endgame content and Ascension system
- [ ] Community modding support for custom data packs

---

## License

This project is a fan-made, non-commercial work inspired by Games Workshop's Warhammer 40,000 universe. Warhammer 40,000 and all associated marks are trademarks of Games Workshop Ltd. This project is not affiliated with or endorsed by Games Workshop.

---

> *"Thought for the day: An open mind is like a fortress with its gates unbarred and unguarded."*
>
> *Now close this README and go earn your XP, Operative.*

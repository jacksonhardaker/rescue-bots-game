# Kids Open-World 3D Game Framework & AI Skills Plan

> **Status**: Future Roadmap / Architecture Blueprint (Not actively in progress)  
> **Origin**: Distilled from the proven architecture of `rescue-bots-game` (procedural cel-shaded Three.js, single-file Vite bundling, iPad-first touch controls, modular scenes, Web Audio synth FX, and automated headless Chrome visual verification).

---

## Vision

Turn the underlying engine of this game into a **zero-asset, IP-free open-world 3D game framework** shipped with a curated bundle of **AI Agent Skills** so parents (and kids!) can co-create custom 3D open-world games together — dinosaurs, pirates, rescue pups, space explorers, trains, dragons — and play them immediately on desktop or iPad via a single-file HTML export or GitHub Pages.

### Why This Architecture Works for AI-Assisted Game Making
1. **100% Procedural 3D & Vector Art**: No Blender pipelines, external `.glb` downloads, or paid asset packs — Three.js toon primitives + procedural `CanvasTexture` + custom inline SVGs let AI agents author, iterate, and visually inspect entire worlds in code.
2. **iPad-First Controls Built In**: Tap-to-move, hold-and-drag steering, tap-to-fly 3D reticles, left/right screen-half racing controls, and multi-touch-safe HUD buttons work out of the box.
3. **Single-File Distribution**: `vite-plugin-singlefile` compiles each game to a standalone `docs/index.html` that opens cleanly on any browser or iPad with zero backend required.
4. **Automated Visual Self-Verification**: Dedicated studio viewers (`character-studio.html`, `prop-studio.html`) + a headless Chrome verification command (`pnpm verify`) let AI agents inspect their own 3D rigs, HUD contrast, and scene transitions.

---

## Target Architecture

### 1. Core Engine Extraction (`@kids-world/engine`)

Decouple reusable engine mechanics from game-specific content (`Rescue Bots`, `Griffin Rock`, `Energon`, `Starship Sigma`) into four clean subsystems:

#### A. Pluggable Scene Manager (`SceneRegistry`)
Replace hardcoded `worldState.activeArea` branching in `src/game/loop.ts` with a uniform `WorldScene` interface:
- Lifecycle hooks: `build()`, `enter(params)`, `exit()`, `update(dt, now)`
- Physics & world hooks: `getSurfaceHeight(x, z)`, `isPointInWater(x, z)`, `isPointOnRoad(x, z)`, `getZoneName(x, z)`, `getGravityMultiplier()`, `resolveCollisions(entity, dt)`
- Input & map hooks: `handleCanvasTap(x, y, isInitial)`, `renderMinimap(ctx, w, h)`, `renderTacticalMap(ctx, w, h)`

Ship **4 reusable Scene Templates** out of the box:
1. **Overworld Island Template** (sculpted terrain, roads/rails, water shoreline, interactive stations, weather cycles, roaming NPCs, emergent missions)
2. **Dungeon / Cavern Maze Template** (grid-based tunnels, breakable walls, crystal caches, hidden quests)
3. **3D Flight / Space Sector Template** (zero-G hover, tap-to-fly holographic reticle, orbital objects, rings, boss encounters, landable sub-worlds)
4. **Loop Circuit Racer Template** (360° track, turbo gates, hazards, AI rival racers, lap timer & best-lap records)

#### B. Declarative Character System (`CharacterDef`)
Replace per-character `if (botType === ...)` checks in `movement.ts`, `player.ts`, and `botRigs.ts` with data-driven capability definitions:
- `id`, `name`, `role`, `palette`, `voicePitch`, `iconSvg`
- `modes`: e.g. `WALK`, `VEHICLE`, `BOAT`, `DINO`, `FLY` (each with `name`, `maxSpeed`, `offRoadSpeed`, `groundOffset`, `canTraverseWater`, `canFly`)
- `abilities`: primary & secondary action handlers + SVG icons + labels
- `rigBuilder(parts)`: pure Three.js procedural rig builder
- `unlock`: `'STARTER'` or custom discovery condition (e.g., frozen on a moon, hidden on an island)
- `catchphrases`: categorized dialog lines

#### C. Unified Controls, Physics & Persistence Layer
- **Controls**: Unified Desktop (rebindable keyboard + mouse) & iPad touch layer (`bindButton`, `bindHold`, `isUIElementTarget`, `touch-action: manipulation`, tap-to-move / tap-to-fly / canvas steering).
- **AI Buddy System**: Autonomous follower that adapts to the active scene and character capabilities.
- **Audio Synth Engine**: Parameterized Web Audio API sound effects (engines, sirens, chimes, roars, rock breaks, boosts) requiring zero external `.mp3`/`.wav` files.
- **Versioned Save System**: Namespaced `localStorage` persistence with automatic schema migration.

#### D. Config-Driven UI Shell
Generate HUD and modals dynamically from `game.config.ts` instead of hardcoding game-specific markup in `index.html`:
- Character Roster Drawer (auto-populated from `CharacterDef[]` and unlock state)
- Action Buttons & Telemetry Pill (auto-themed from active character's palette)
- Full-Screen Tactical Map & Minimap (delegated to active scene)
- Explorer Passport / Progress Log Modal
- Settings & Controls Modal (keybinds, Low/Medium/High/Ultra graphics presets, Auto-FPS Resolution Governor, audio sliders, save management)

---

### 2. Data-Driven "Game Cartridge" Layout

Parents and AI agents author everything inside a clean `game/` directory without touching engine internals:

```text
my-kids-game/
├── game.config.ts          # Title, palette, HUD labels, starter characters, weather modes
├── characters/             # 1 file per playable character (rig + modes + abilities + SVG)
├── worlds/                 # Overworld biome, caves, flight sectors, race tracks
├── stations/               # Interactive set-pieces (car wash, bounce pad, ferry, catapult)
├── missions/               # Rescues, collectibles, repair quests, bosses, unlock triggers
└── audio/                  # Custom Web Audio synth presets (optional overrides)
```

---

### 3. Accompanying AI Skills & Verification Harness

Package a dedicated plugin / `.agent/skills/` bundle alongside the template repo:

| Skill | Purpose |
| :--- | :--- |
| **`create-game`** | Interviews parent & kid (theme, 4 starter heroes, world biomes, favorite activities) and scaffolds `game.config.ts` + starter overworld. |
| **`add-character`** | Step-by-step recipe + procedural rig templates (biped, quadruped, wheeled vehicle, boat, flyer), SVG icon standard, ground-offset calibration, and Studio check. |
| **`add-world-scene`** | Scaffolds a new Overworld, Cavern, Flight Sector, or Race Circuit using the 4 built-in scene templates, with terrain hooks and safe elevation baselines. |
| **`add-station-or-mission`** | Adds interactive world landmarks (launch pads, wash stations, repair quests, bosses, or unlockable character discoveries). |
| **`ipad-ux-audit`** | Enforces WCAG AA+ solid button contrast, generous touch targets, `isUIElementTarget` registration, and custom SVG icons (zero Unicode emoji). |

#### Built-In Verification Tools
- **`character-studio.html`** (generalized from `botcheck.html`): Inspect every character across all modes with ground-contact gridlines.
- **`prop-studio.html`** (generalized from `modelcheck.html`): Inspect buildings, stations, vehicles, and landmarks in isolation.
- **`pnpm verify`**: One-command headless Chrome smoke test that boots every registered scene, checks for zero console/WebGL errors, verifies iPad touch handlers, and captures screenshots for AI visual inspection.

---

## Phased Rollout Roadmap

| Phase | Deliverables | Rough Effort |
| :--- | :--- | :--- |
| **Phase 1: Core Engine Extraction** | Extract `SceneRegistry`, `CharacterDef`, config-driven HUD/Tactical Map/Passport, and clean TypeScript interfaces (`@kids-world/engine`). | ~2–4 sessions |
| **Phase 2: IP-Free Starter Demo** | Build a lightweight, 100% original starter game (e.g., *Starlight Rangers* — 4 heroes, 1 island, 1 cavern, 1 race track) with zero licensed IP. | ~1–2 sessions |
| **Phase 3: AI Skills & `pnpm verify`** | Author the 5 AI skills (`create-game`, `add-character`, `add-world-scene`, `add-station-or-mission`, `ipad-ux-audit`) and generalized headless Chrome visual verifier. | ~1–2 sessions |
| **Phase 4: Template Repo & Docs** | Publish GitHub Template / `create-kids-world` CLI scaffolder, parent quickstart guide, and one-click GitHub Pages iPad deployment workflow. | ~1 session |

---

## Guiding Principles to Preserve
- **Kid-First Design**: Forgiving collisions, auto-assist rescues, zero fail-state frustration, immediate sandbox fun, and iPad touch parity everywhere.
- **Zero-Emoji Custom SVG Iconography**: Consistent cel-shaded vector art across macOS, iOS, Windows, and Android.
- **Safe Off-World Physics**: Keep non-ocean terrain well above `y = 0`, isolate colliders per scene, and reparent shared FX/waypoints cleanly on scene swaps.
- **Strict IP Separation**: Keep `rescue-bots-game` as the non-commercial fan-tribute reference project; ship the public framework with 100% original starter assets and templates.

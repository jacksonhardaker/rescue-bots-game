# Agent Guidelines: Rescue Bots Game

## 1. Iconography Standard: Custom SVG Icons Over Emoji

### Core Directive
**Always use custom SVG vector icons from `src/ui/icons.ts` rather than Unicode emoji in any UI element, prompt, HUD badge, button, modal, map marker, or toast notification.**

### Why Custom Icons Are Mandatory
1. **Visual Consistency**: The game has a distinct cartoon cel-shaded / ink-outlined visual identity based on *Transformers: Rescue Bots*. Handcrafted vector icons adhere to this palette and style.
2. **Cross-Platform Fidelity**: Unicode emojis render inconsistently across operating systems and browsers (macOS, iOS, Windows, Android, Linux). Custom SVGs ensure identical, crisp presentation everywhere.
3. **Resolution & Responsiveness**: SVGs scale smoothly at any DPI or UI scale factor without pixelation or layout shifts.

### Available Bot Icons in `src/ui/icons.ts` (`SVG_ICONS`)

All **11 playable bots** have handcrafted 32x32 vehicle vector artwork registered in `SVG_ICONS`:

| Bot Key | Vehicle Type | Boat Mode | Dino Mode | Primary Color Palette | SVG Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BOULDER` | Bulldozer | Channel Dredger | Triceratops | Lime / Emerald / Slate | `SVG_ICONS.BOULDER` |
| `HEATWAVE` | Fire Truck | Rescue Fireboat | Brachiosaur | Red / Slate / Cyan | `SVG_ICONS.HEATWAVE` |
| `CHASE` | Police Cruiser | Coast Guard Interceptor | Stegosaurus | Sky Blue / Navy / White | `SVG_ICONS.CHASE` |
| `BLADES` | Rescue Copter | Air-Sea Hovercraft | Pterosaur | Orange / Amber / White | `SVG_ICONS.BLADES` |
| `OPTIMUS` | Heavy Semi Cab | Command Flagship | T-Rex | Crimson / Blue / Chrome | `SVG_ICONS.OPTIMUS` |
| `BUMBLEBEE` | Sports Racer | Turbo Jetboat | Velociraptor | Yellow / Black / Cyan | `SVG_ICONS.BUMBLEBEE` |
| `BLURR` | Supersonic Speedster | Hydrofoil Racer | Gallimimus | Purple / Violet / Neon Green | `SVG_ICONS.BLURR` |
| `SALVAGE` | Recycling Compactor | Harbor Skimmer | Ankylosaur | Industrial Blue / Lime / Silver | `SVG_ICONS.SALVAGE` |
| `HIGHTIDE` | Submersible Vessel | Submersible Vessel | Plesiosaur (Amphibious) | Deep Navy / Cyan / White | `SVG_ICONS.HIGHTIDE` |
| `QUICKSHADOW` | Covert Interceptor | Stealth Speedboat | Dilophosaur | Alpine White / Dark Navy / Cyan | `SVG_ICONS.QUICKSHADOW` |
| `STARSPEED` | Dirt Bike | Cosmic Jet Ski | Spinosaurus | Cosmic Teal / White / Solar Coral / Gold | `SVG_ICONS.STARSPEED` |

### Additional Vector Icons in `SVG_ICONS`

- **Progression & Stats**: `STAR`, `MEDAL`, `PEOPLE`, `BOLT`, `TROPHY`, `CAVERN_GEM`, `CAVERN_COMPASS`
- **Navigation & Utilities**: `BUDDY`, `HQ`, `RESET`, `VIEW_WIDE`, `AUTO_SPAWN_ON`, `AUTO_SPAWN_OFF`, `DRILL`, `DRILL_UP`, `WRENCH`
- **Audio & Weather**: `SOUND_ON`, `SOUND_OFF`, `WEATHER_SUNNY`, `WEATHER_RAIN`, `WEATHER_VOLCANO`, `WEATHER_NIGHT`
- **Space & Solar System**: `ROCKET`, `PLANET`, `MOON`, `LASER`, `TRACTOR`, `ASTEROID`, `RING`, `SOLAR_SYSTEM`, `RING_RACE`, and all 10 destination icons (`PLANET_MERCURY`, `PLANET_VENUS`, `PLANET_EARTH`, `PLANET_MOON`, `PLANET_MARS`, `PLANET_JUPITER`, `PLANET_SATURN`, `PLANET_URANUS`, `PLANET_NEPTUNE`, `PLANET_PLUTO`)
- **Bot Powers & Abilities**: Unique vehicle, boat, dino & bot mode ability SVGs (e.g., `WATER_CANNON`, `QUAKE_SMASH`, `DOZER_SCOOP`, `FIREBOAT`, `TWIN_DELUGE`, `POLICE_DEPTH_SONAR`, `HOVER_AIR_JET`, etc.)

### Adding New Icons
Create clean vector SVGs inside `src/ui/icons.ts` with:
- Standard `viewBox="0 0 32 32"` (or `0 0 24 24` for utility icons) and `class="w-full h-full"`
- Specific fill/stroke colors matching the cel-shaded Rescue Bots palette
- Never use emoji strings as placeholders or fallbacks

---

## 2. UI, CSS & Contrast Standards

1. **Inline Tailwind Subset Only**: `index.html` does **not** load a full Tailwind CDN stylesheet — it defines a curated inline `<style>` subset. Before using a utility class (such as `p-4`, `gap-3`, `space-y-4`, `bg-cyan-500`), verify it exists in `index.html`'s `<style>` block, or add the utility / use explicit inline styles.
2. **Solid Button Backgrounds & WCAG AA+ Contrast**: Every `<button>` must have an explicit background color or gradient and readable high-contrast text (e.g. `#ffffff` on rich dark/saturated fills, or `#0f172a` on bright gold/cyan fills). Never leave buttons with transparent/unstyled backgrounds.
3. **Never Combine Inline `display: flex` with `.hidden`**: Because inline `style="display: flex"` overrides `.hidden { display: none; }`, always use the utility class `class="hidden flex ..."` instead of putting `display: flex` inside `style=""` on elements toggled via `classList.toggle('hidden', ...)`.
4. **Section Padding & Spacing**: Modals and settings panes must have comfortable internal padding inside cards/sections and visible vertical spacing between stacked sections (allowing scrolling when needed rather than cramping text against borders).

---

## 3. Scene & World Management Architecture

The active scene is controlled by `worldState.activeArea` in `src/state/gameState.ts` and dispatched in `src/game/loop.ts` before Griffin Rock surface logic runs:

| `worldState.activeArea` | Scene Object & Module | Gameplay & Controls |
| :--- | :--- | :--- |
| `'SURFACE'` | `scene` (`src/rendering/scene.ts`) | Griffin Rock 10x Island — Bots, Vehicles, Boats, Dinos, Emergencies, NPCs |
| `'UNDERGROUND'` | `undergroundScene` (`src/world/underground.ts`) | Subterranean Caverns, Crystal Cache, Crashed Starship Sigma repair quest |
| `'SOLAR_HUB'` | `solarHubScene` (`src/world/solarSystem.ts`) | Animated 3D Solar System orrery destination picker (10 unlocked destinations) |
| `'SPACE'` | `spaceScene` (`src/world/space.ts`) | Starship Sigma zero-G flight across 4 orbital sectors (`MOON_ORBIT`, `JUPITER`, `URANUS`, `NEPTUNE`), with asteroids, rescues, Star-Rings, Morocco Boss (`MOON_ORBIT`), and landable moon beacons (`MOON`, `EUROPA`, `MIRANDA`, `TRITON`) |
| `'MOON'` | `moonScene` (`src/world/moon.ts`) | Low-gravity (`0.35G`) Lunar Base, Lunar Rover, Flagpole, 6-Hoop Crater Stunt Course, 5 Relics |
| `'PLANET_SURFACE'` | `planetSurfaceScene` (`src/world/planetSurface.ts`) | Data-driven planetary surface engine powering `MERCURY`, `VENUS`, `MARS`, `PLUTO`, plus giant moons `EUROPA`, `MIRANDA`, and `TRITON` (where **Starspeed** is frozen solid!) |
| `'SATURN_RING_RACE'` | `saturnRaceScene` (`src/world/saturnRace.ts`) | 360° high-speed **Bot-Mode** Ring Racing Circuit around Saturn with 12 Turbo Gates & lap records |

### Critical Rules When Adding or Modifying Scenes
1. **Terrain Hooks (`src/world/terrain.ts`)**: Off-world walkable scenes register via `setUndergroundTerrainHooks`, `setMoonTerrainHooks`, or `setPlanetTerrainHooks` so `getSurfaceHeight`, `isPointOnRoad`, `isPointInWater`, and `getZoneName` work transparently with physics and Buddy AI.
2. **Safe Elevation Baseline (`>= +6.0m`)**: Always keep off-world planetary/lunar terrain well above `y = 0` (e.g. `+6.0m` baseline) so Griffin Rock's ocean-water elevation checks (`y <= -0.35`) never trigger inside craters.
3. **Collision Isolation**: In `src/physics/movement.ts` and `src/world/npcs.ts`, ensure off-world areas (`UNDERGROUND`, `MOON`, `PLANET_SURFACE`) bypass Earth's `worldColliders` so invisible island buildings/trees don't block players on other worlds.
4. **Reparenting Shared 3D Objects**:
   - When entering a non-surface scene that renders bots (`UNDERGROUND`, `MOON`, `PLANET_SURFACE`, `SATURN_RING_RACE`), reparent active `botRigs[botType].root`, `window.waypointGroup`, and particles (`setActiveParticleScene(...)`) into that scene — and restore them to `scene` when exiting.
5. **Preserve Saved Surface Position**: `savePlayerMapPosition()` in `src/game/loop.ts` automatically preserves `worldState.savedSurfacePos` whenever `activeArea !== 'SURFACE'`.
6. **Verify `sfx` Method Names**: Before calling sound effects, verify the exact method exists in `src/audio/soundFX.ts` (e.g. `playSpeechPop`, `playRankUp`, `playRelicFound`, `playStuntChime`, `playRockBreak`, `playBeaconRestore`, `playEnergyCharge`, `playVolcanoRumble`, `playWaypointTap`).

---

## 4. Controls & iPad Touch Guidelines

Every scene and interactive UI control must support **both Desktop (keyboard + mouse) and iPad (touch/tap)** as first-class citizens:

1. **Register UI Overlays in `isUIElementTarget` (`src/physics/movement.ts`)**: Whenever you add a new HUD container or modal overlay (e.g. `#solar-hub-ui`, `#saturn-race-hud`, `#space-controls-bar`), add it to `isUIElementTarget(target)` so tapping HUD buttons does not also trigger 3D world waypoints.
2. **Instant Touch Buttons (`bindButton` & `bindHold` in `src/ui/hud.ts`)**:
   - Use `bindButton(id, fn)` for tap actions (wires both `touchstart` with `e.preventDefault()` and `click`).
   - Use `bindHold(id, onDown, onUp)` for press-and-hold controls (wires explicit `touchstart`/`touchend`/`touchcancel` with `{ passive: false }` alongside non-touch `pointerdown`/`pointerup`, avoiding iPad Safari multi-touch cancellation).
   - For scrollable dock buttons (like `#solar-dest-dock`), apply `touch-action: manipulation` so iPad taps fire instantaneously without breaking horizontal swipe scrolling.
3. **Scene-Specific Tap Parity**:
   - **Surface / Caverns / Moon / Planet Surfaces**: Tap or hold-drag anywhere on the 3D ground to drop the visible yellow `waypointGroup` marker and auto-navigate. Clamp off-world taps to the active world's radius and skip Earth NPC/beacon snapping.
   - **Space Sectors (`SPACE`)**: Starship Sigma hovers at zero-G by default (does **not** auto-accelerate forward without input). Tapping anywhere on screen sets a 3D holographic reticle via `setSpaceDestinationFromScreenPoint`, snapping to moons, stations, asteroids (auto-firing cannons), satellites, pods, and Star-Rings.
   - **Solar System Hub (`SOLAR_HUB`)**: Support both direct 3D raycast tapping on orbiting planets (using enlarged invisible hit spheres for forgiving iPad taps) and tapping the bottom destination dock.
   - **Saturn Ring Race (`SATURN_RING_RACE`)**: Support both dedicated touch buttons (`INNER LANE`, `OUTER LANE`, `TURBO BOOST`) and direct canvas tap-and-hold steering (left half = inner lane, right half = outer lane, release = center).

---

## 5. How to Add a New Playable Rescue Bot

Use this checklist whenever adding a new playable bot (following the pattern of `STARSPEED` and `QUICKSHADOW`):

1. **3D Bot, Vehicle & Dino Rig (`src/bots/<botname>.ts`)**:
   - Export `build<BotName>(parts)` building Bot Mode (`parts.torso`, `head`, `leftArm`, `rightArm`, `leftForearm`, `rightForearm`, `leftLeg`, `rightLeg`), Vehicle Mode (either limb-morphing or a dedicated shell on `parts.chassis`), and Dino Mode (`parts.dinoGroup`, `dinoHead`, `dinoTail`, `dinoLeftArm`, `dinoRightArm` — note: dorsal fins/plates attach directly to `parts.dinoGroup`).
   - Call `build<BotName>Boat(parts)` and `applyCartoonInkOutlines(parts.root, 1.04, true)`.
2. **Boat Mode (`src/bots/botBoats.ts`)**:
   - Export `build<BotName>Boat(parts)` attaching meshes to `parts.boatGroup` and add a `case '<BOT_KEY>':` branch in `animateBotBoatMorph(...)`.
3. **Rig Registration & Morphing (`src/bots/botRigs.ts`)**:
   - Import `build<BotName>`, add `<BOT_KEY>: 1.0` to `BOT_SCALES`, dispatch in `buildRescueBotModel`, add any custom Vehicle/Dino morph handling in `applyBotRigMorph`, and instantiate `<BOT_KEY>: buildRescueBotModel("<BOT_KEY>")` in `initBotRigs`.
4. **Metadata & Ground Offsets (`src/bots/botMeta.ts`)**:
   - Add `<BOT_KEY>` entry to `BOT_METADATA` (`name`, `role`, `voicePitch`, `vehName`, `boatName`, `dinoName`, action icons & labels) and calibrated `{ bot, veh, dino, boat }` contact offsets to `BOT_GROUND_OFFSETS`.
5. **Custom SVG Icon & Dialog Portrait (`src/ui/icons.ts`, `src/ui/dialogs.ts`)**:
   - Add `SVG_ICONS.<BOT_KEY>` (32x32 cel-shaded vehicle vector) and register `'<BOT_KEY>': SVG_ICONS.<BOT_KEY>` in `dialogs.ts`.
6. **Progression & State (`src/progression/progression.ts`, `src/state/gameState.ts`)**:
   - Add `<botKey>Docked: false` to `progression`, add `'<BOT_KEY>'` to `ALL_PLAYABLE_BOTS` and `VALID_BOTS`, and add `<BOT_KEY>: 0` to `botPhraseCounters` in `src/state/gameState.ts`.
7. **Catchphrases, Powers, Roster & Speeds (`src/physics/player.ts`, `src/physics/movement.ts`, `src/world/saturnRace.ts`)**:
   - Add catchphrases to `BOT_CATCHPHRASES` and `_localPhraseCounters`, include `'<BOT_KEY>'` in `getUnlockedPlayableBots()` (`validAllies`) if unlockable, add primary special ability logic in `triggerPrimaryAction`, and add mode top-speeds in `src/physics/movement.ts` (plus optional Saturn Ring Race speed bonus in `src/world/saturnRace.ts`).
8. **Roster Button & Theme (`index.html`)**:
   - Add `.action-btn-<botkey>` button gradient CSS and a `<button data-bot="<BOT_KEY>" class="bot-card hidden ...">` card in `#bot-roster` using the custom SVG icon.
9. **Discovery / Unlock Trigger & Visual Check (`src/botcheck/visualCheck.ts`)**:
   - Push `'<BOT_KEY>'` into `progression.discoveredAllies`, call `saveProgression({ immediate: true })` and `updateBotRosterUI()`, and add `'<BOT_KEY>'` to `src/botcheck/visualCheck.ts` so all modes can be inspected in `botcheck.html`.

---

## 6. Progression & Save Backwards-Compatibility Rules

Saved player progress in `src/progression/progression.ts` **must always remain backwards-compatible** across releases and schema changes:

1. **Single Source of Truth (`createDefaultProgression`)**: Every persisted field in `ProgressionData` MUST be initialized with a sensible default inside `createDefaultProgression()`. Never add a field only to the interface without adding its default there.
2. **Schema-Driven Normalization Only**: `loadProgression()` and `importSaveData()` must always pass loaded data through `migrateProgressionData()` -> `normalizeProgressionData()`. Never maintain separate manual field allowlists that can drift out of sync and silently wipe new fields on reload.
3. **Versioned Sequential Migrations (`PROGRESSION_MIGRATIONS`)**:
   - **Additive fields** (new optional counters, flags, or arrays with safe defaults) are automatically preserved by `normalizeProgressionData()` without breaking existing saves.
   - **Breaking / structural changes** (renaming a key, changing a field's type or shape, splitting/merging fields, or changing valid enum values) MUST bump `CURRENT_SAVE_VERSION` by `1` and register an explicit `PROGRESSION_MIGRATIONS[oldVersion]` step (`oldVersion -> oldVersion + 1`) that transforms existing player data without data loss.
   - Never rename or drop `SAVE_STORAGE_KEY` without keeping the previous key in `LEGACY_SAVE_KEYS` so older saves migrate upward automatically.
4. **Mandatory Migration Tests**: Always run `pnpm test` (`tests/progression.test.ts`) after any change to `src/progression/progression.ts`. Whenever `CURRENT_SAVE_VERSION` is bumped, add a dedicated migration test case covering the previous schema version -> new schema version.

---

## 7. Build & Verification Workflow

- **Tests, Typecheck & Build**: Always run `pnpm test && pnpm exec tsc --noEmit && pnpm run build` after changes (runs progression migration tests and builds `docs/index.html`, `docs/botcheck.html`, and `docs/modelcheck.html`).
- **Live Browser Verification**: Verify new 3D scenes, bots, and UI changes in headless Chrome against the built `docs/index.html`, checking for **zero console/runtime errors** and inspecting captured screenshots for visual alignment, contrast, and HUD overlap.
- **Git Discipline**: Never `git commit` or `git push` unless explicitly requested by the user.

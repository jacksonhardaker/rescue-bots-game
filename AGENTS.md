# Agent Guidelines: Rescue Bots Game

## Iconography Standard: Custom SVG Icons Over Emoji

### Core Directive
**Always use the existing custom SVG vector icons from `src/ui/icons.ts` rather than Unicode emoji in any UI element, prompt, HUD badge, button, modal, or toast notification.**

### Why Custom Icons Are Mandatory
1. **Visual Consistency**: The game has a distinct cartoon cel-shaded / ink-outlined visual identity based on *Transformers: Rescue Bots*. Handcrafted vector icons adhere to this palette and style.
2. **Cross-Platform Fidelity**: Unicode emojis render inconsistently across operating systems and browsers (macOS, iOS, Windows, Android, Linux). Custom SVGs ensure identical, crisp presentation everywhere.
3. **Resolution & Responsiveness**: SVGs scale smoothly at any DPI or UI scale factor without pixelation or layout shifts.

---

### Available Bot Icons in `src/ui/icons.ts` (`SVG_ICONS`)

All 10 playable bots have handcrafted 32x32 vehicle vector artwork registered in `SVG_ICONS`:

| Bot Key | Vehicle Type | Primary Color Palette | SVG Access |
| :--- | :--- | :--- | :--- |
| `BOULDER` | Bulldozer | Lime / Emerald / Slate | `SVG_ICONS.BOULDER` |
| `HEATWAVE` | Fire Truck | Red / Slate / Cyan | `SVG_ICONS.HEATWAVE` |
| `CHASE` | Police Cruiser | Sky Blue / Navy / White | `SVG_ICONS.CHASE` |
| `BLADES` | Rescue Copter | Orange / Amber / White | `SVG_ICONS.BLADES` |
| `OPTIMUS` | Heavy Semi Cab | Crimson / Blue / Chrome | `SVG_ICONS.OPTIMUS` |
| `BUMBLEBEE` | Sports Racer | Bumblebee Yellow / Black / Cyan | `SVG_ICONS.BUMBLEBEE` |
| `BLURR` | Supersonic Speedster | Electric Purple / Violet / Neon Green | `SVG_ICONS.BLURR` |
| `SALVAGE` | Recycling Compactor | Industrial Blue / Lime / Silver | `SVG_ICONS.SALVAGE` |
| `HIGHTIDE` | Submersible Vessel | Deep Navy / Cyan / White | `SVG_ICONS.HIGHTIDE` |
| `QUICKSHADOW` | Covert Interceptor | Alpine White / Dark Navy / Cyan | `SVG_ICONS.QUICKSHADOW` |

---

### Additional Vector Icons in `SVG_ICONS`

- **Progression & Stats**: `STAR`, `MEDAL`, `PEOPLE`, `BOLT`, `TROPHY`
- **Navigation & Utilities**: `BUDDY`, `HQ`, `RESET`, `VIEW_WIDE`, `AUTO_SPAWN_ON`, `AUTO_SPAWN_OFF`
- **Audio & Weather**: `SOUND_ON`, `SOUND_OFF`, `WEATHER_SUNNY`, `WEATHER_RAIN`, `WEATHER_VOLCANO`, `WEATHER_NIGHT`
- **Bot Powers & Abilities**: Unique vehicle & bot mode ability SVGs for all bots (e.g. `WATER_CANNON`, `HYDRAULIC_CLAW`, `SONIC_SIREN`, `TIDAL_SURGE`, etc.)

---

### Implementation Patterns

#### 1. Importing the Icons
```ts
import { SVG_ICONS } from '../ui/icons.js';
```

#### 2. Injecting into HTML Elements (e.g., Dock Button, Badges)
```ts
const iconContainer = document.getElementById('dock-icon');
if (iconContainer) {
    const iconSvg = SVG_ICONS[botType] || SVG_ICONS.BOLT || '';
    if (iconContainer.innerHTML !== iconSvg) {
        iconContainer.innerHTML = iconSvg;
    }
}
```

#### 3. Standard Container Styling
Wrap icon SVGs in a container with explicit dimensions, flex centering, and drop shadows:
```html
<span class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 drop-shadow">
    <!-- SVG injected dynamically or statically here -->
</span>
```

#### 4. Adding New Icons
If a new action, bot mode, or mechanic requires an icon, create a clean vector SVG inside `src/ui/icons.ts` with:
- Standard `viewBox="0 0 32 32"` (or `0 0 24 24` for utility icons)
- `class="w-full h-full"`
- Specific fill/stroke colors matching the Rescue Bots palette
- Do not use emoji strings as placeholders or fallbacks.

// HUD Event Listeners, Button Touch Handlers & Bot Tray UI
import {
    triggerTransform, toggleHiddenVehicleMode, triggerPrimaryAction, triggerSecondaryAction,
    triggerDescendAction, toggleSiren, dockHighTideMegabot, undockHighTideMegabot,
    dockOptimusMegabot, undockOptimusMegabot, dockActiveBotMegabot, undockActiveBotMegabot,
    cycleBuddyBot, switchRescueBot
} from '../physics/player.js';
import { isBotFlyingHiddenVehicle } from '../bots/botMeta.js';
import { player, worldState } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { SVG_ICONS } from './icons.js';
import { triggerBoulderDrillTransition, exitUndergroundViaShaft, swapToSurface, triggerSigmaCavernAction } from '../world/underground.js';
import {
    enterUnderwaterWorld, exitUnderwaterWorld, triggerUnderwaterSonar,
    triggerUnderwaterBoost, setUnderwaterTouchControl
} from '../world/underwater.js';
import { enterActivePlanetCave } from '../world/planetSurface.js';
import { enterMoonCave } from '../world/moon.js';
import { exitPlanetCavernToSurface } from '../world/planetCaverns.js';
import {
    startSpaceTransition, fireSigmaCannons, triggerSpaceBoost,
    setSpaceTouchControl, landOnActiveSectorMoon, openSolarSystemHub, swapToSpace
} from '../world/space.js';
import { launchWarpToSelected, swapToSolarHub } from '../world/solarSystem.js';
import { swapToSaturnRace, setSaturnRaceTouch, triggerSaturnRaceBoost, resetSaturnRace } from '../world/saturnRace.js';
import { openGalacticLogModal, closeGalacticLogModal } from './galacticLog.js';

import { HQ_SWAP_PAD } from '../world/buildings.js';
import { waypointGroup } from '../physics/movement.js';
import { showToast } from './dialogs.js';
import { saveProgression, isBotDocked } from '../progression/progression.js';
import { beacons } from '../world/emergencies.js';
import { applyWeatherMode, currentWeatherIdx, cycleWeatherMode } from '../world/weather.js';
import { closeUtilityMenu } from '../physics/movement.js';
import { buildHazardSites } from '../world/emergencies.js';
import { buildEnergonCubes } from '../world/collectibles.js';
import { setWaypointToPatientDestination } from '../world/patients.js';
import { enterRailTunnel, exitRailTunnel, setRailTunnelTouch, triggerRailTunnelBoost } from '../world/railTunnel.js';
        export function bindButton(id: string, fn: () => void) {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', e => {
                e.preventDefault();
                e.stopPropagation();
                el.classList.add('active-press');
                fn();
            }, { passive: false });
            el.addEventListener('touchend', () => el.classList.remove('active-press'));
            el.addEventListener('click', e => {
                e.preventDefault();
                fn();
            });
        }

        export function initHUDButtons() {
        bindButton('btn-transform', triggerTransform);
        bindButton('btn-hidden-veh', toggleHiddenVehicleMode);
        bindButton('btn-action', triggerPrimaryAction);
        bindButton('btn-jump-scan', triggerSecondaryAction);
        bindButton('btn-descend', triggerDescendAction);
        bindButton('btn-siren', toggleSiren);
        bindButton('btn-drill', triggerBoulderDrillTransition);
        bindButton('btn-dive', enterUnderwaterWorld);
        bindButton('patient-transport-hud', setWaypointToPatientDestination);
        bindButton('uw-sonar-btn', triggerUnderwaterSonar);
        bindButton('uw-boost-btn', triggerUnderwaterBoost);
        bindButton('uw-transform-btn', triggerTransform);
        bindButton('uw-surface-btn', exitUnderwaterWorld);
        const uwSonarIcon = document.getElementById('uw-sonar-icon');
        if (uwSonarIcon) uwSonarIcon.innerHTML = SVG_ICONS.SONAR_WAVE;
        const uwSurfaceIcon = document.getElementById('uw-surface-icon');
        if (uwSurfaceIcon) uwSurfaceIcon.innerHTML = SVG_ICONS.SURFACE_UP;
        const diveIcon = document.getElementById('dive-icon');
        if (diveIcon) diveIcon.innerHTML = SVG_ICONS.DIVE_DOWN;
        bindButton('btn-cavern-exit', exitUndergroundViaShaft);
        bindButton('btn-planet-cave-enter', () => {
            if (worldState.activeArea === 'MOON') enterMoonCave();
            else if (worldState.activeArea === 'PLANET_SURFACE') enterActivePlanetCave();
        });
        bindButton('btn-planet-cavern-exit', exitPlanetCavernToSurface);
        const cComp = document.getElementById('cavern-compass-icon');
        if (cComp) cComp.innerHTML = SVG_ICONS.CAVERN_COMPASS;
        const cGem = document.getElementById('cavern-gem-icon');
        if (cGem) cGem.innerHTML = SVG_ICONS.CAVERN_GEM;
        const cExitIcon = document.getElementById('cavern-exit-icon');
        if (cExitIcon) cExitIcon.innerHTML = SVG_ICONS.DRILL_UP;
        const pCaveEnterIcon = document.getElementById('planet-cave-enter-icon');
        if (pCaveEnterIcon) pCaveEnterIcon.innerHTML = SVG_ICONS.CAVE_ENTRANCE;
        const pCaveExitIcon = document.getElementById('planet-cavern-exit-icon');
        if (pCaveExitIcon) pCaveExitIcon.innerHTML = SVG_ICONS.DRILL_UP;

        // Sigma Repair / Launch, Space Flight & Moon Base HUD Icons & Bindings
        const injectIcon = (id: string, svg: string | undefined) => {
            const el = document.getElementById(id);
            if (el && svg) el.innerHTML = svg;
        };
        injectIcon('space-ast-icon', SVG_ICONS.ASTEROID);
        injectIcon('space-res-icon', SVG_ICONS.TRACTOR);
        injectIcon('space-ring-icon', SVG_ICONS.RING);
        injectIcon('moon-relic-icon', SVG_ICONS.STAR);
        injectIcon('space-fire-icon', SVG_ICONS.LASER);
        injectIcon('space-boost-icon', SVG_ICONS.BOLT);
        injectIcon('space-moon-icon', SVG_ICONS.MOON);
        injectIcon('space-earth-icon', SVG_ICONS.PLANET);
        injectIcon('moon-orbit-icon', SVG_ICONS.ROCKET);
        injectIcon('moon-earth-icon', SVG_ICONS.PLANET);
        injectIcon('space-solar-icon', SVG_ICONS.SOLAR_SYSTEM);
        injectIcon('planet-solar-icon', SVG_ICONS.SOLAR_SYSTEM);
        injectIcon('saturn-solar-icon', SVG_ICONS.SOLAR_SYSTEM);
        injectIcon('saturn-race-icon', SVG_ICONS.RING_RACE);
        injectIcon('saturn-boost-icon', SVG_ICONS.BOLT);
        injectIcon('menu-galactic-icon', SVG_ICONS.SOLAR_SYSTEM);
        injectIcon('galactic-modal-icon', SVG_ICONS.SOLAR_SYSTEM);

        bindButton('btn-galactic-log', () => { closeUtilityMenu(); openGalacticLogModal(); });
        bindButton('btn-solar-hub-log', () => openGalacticLogModal());
        bindButton('btn-close-galactic-log', () => closeGalacticLogModal());
        bindButton('btn-done-galactic-log', () => closeGalacticLogModal());

        bindButton('btn-sigma-action', () => {
            if (worldState.activeArea === 'PLANET_SURFACE') {
                if (worldState.planetReturnSector) {
                    swapToSpace(true, worldState.planetReturnSector as Parameters<typeof swapToSpace>[1]);
                } else {
                    swapToSolarHub();
                }
                return;
            }
            triggerSigmaCavernAction();
        });
        bindButton('space-fire-btn', fireSigmaCannons);
        bindButton('space-boost-btn', triggerSpaceBoost);
        bindButton('space-land-moon-btn', () => landOnActiveSectorMoon());
        bindButton('space-ring-race-btn', () => swapToSaturnRace());
        bindButton('space-solar-map-btn', () => openSolarSystemHub());
        bindButton('space-return-earth-btn', () => startSpaceTransition('TO_EARTH'));
        bindButton('moon-orbit-btn', () => {
            if (worldState.activeArea === 'PLANET_SURFACE' && worldState.planetReturnSector) {
                swapToSpace(true, worldState.planetReturnSector as Parameters<typeof swapToSpace>[1]);
            } else {
                startSpaceTransition('MOON_TO_SPACE');
            }
        });
        bindButton('planet-solar-btn', () => openSolarSystemHub());
        bindButton('moon-earth-btn', () => startSpaceTransition('TO_EARTH'));
        bindButton('btn-solar-warp', () => launchWarpToSelected());
        bindButton('saturn-orbit-btn', () => swapToSpace(true, 'SATURN'));
        bindButton('saturn-solar-btn', () => openSolarSystemHub());
        bindButton('saturn-restart-btn', () => resetSaturnRace());
        bindButton('saturn-transform-btn', () => triggerTransform());
        bindButton('saturn-boost-btn', () => triggerSaturnRaceBoost());

        // Collapsible Bottom-Left Rescue Bots Roster & Buddy Drawer (Rescue Bots Logo Tab)
        injectIcon('roster-logo-icon', SVG_ICONS.RESCUE_BOTS_LOGO);
        injectIcon('enter-tunnel-icon', SVG_ICONS.RAIL_TUNNEL);
        const setRosterDrawerOpen = (open: boolean) => {
            const panel = document.getElementById('bot-roster-panel');
            const toggleBtn = document.getElementById('btn-roster-toggle');
            const chevron = document.getElementById('roster-chevron');
            if (!panel) return;
            panel.classList.toggle('hidden', !open);
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(open));
            if (chevron) chevron.textContent = open ? '▼' : '▲';
            sfx.playWaypointTap();
        };
        bindButton('btn-roster-toggle', () => {
            const panel = document.getElementById('bot-roster-panel');
            const isCurrentlyHidden = panel ? panel.classList.contains('hidden') : true;
            setRosterDrawerOpen(isCurrentlyHidden);
        });
        bindButton('btn-roster-close', () => setRosterDrawerOpen(false));

        // Mainland Express Rail Tunnel Buttons
        bindButton('btn-enter-tunnel', () => enterRailTunnel());
        bindButton('tunnel-return-btn', () => exitRailTunnel(true));
        bindButton('tunnel-boost-btn', () => triggerRailTunnelBoost());

        const bindHold = (id: string, onDown: () => void, onUp: () => void) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); el.classList.add('active-press'); onDown(); }, { passive: false });
            el.addEventListener('touchend', (e) => { e.preventDefault(); el.classList.remove('active-press'); onUp(); }, { passive: false });
            el.addEventListener('touchcancel', () => { el.classList.remove('active-press'); onUp(); });
            el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; e.preventDefault(); onDown(); });
            el.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') return; onUp(); });
            el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; onUp(); });
            el.addEventListener('pointercancel', (e) => { if (e.pointerType === 'touch') return; onUp(); });
        };
        bindHold('space-climb-up-btn', () => setSpaceTouchControl('climb', 1), () => setSpaceTouchControl('climb', 0));
        bindHold('space-climb-dn-btn', () => setSpaceTouchControl('climb', -1), () => setSpaceTouchControl('climb', 0));
        bindHold('uw-ascend-btn', () => setUnderwaterTouchControl('ascend', 1), () => setUnderwaterTouchControl('ascend', 0));
        bindHold('uw-descend-btn', () => setUnderwaterTouchControl('descend', 1), () => setUnderwaterTouchControl('descend', 0));
        bindHold('saturn-left-btn', () => setSaturnRaceTouch('LEFT', true), () => setSaturnRaceTouch('LEFT', false));
        bindHold('saturn-right-btn', () => setSaturnRaceTouch('RIGHT', true), () => setSaturnRaceTouch('RIGHT', false));
        bindHold('tunnel-fwd-btn', () => setRailTunnelTouch(1), () => setRailTunnelTouch(0));
        bindHold('tunnel-rev-btn', () => setRailTunnelTouch(-1), () => setRailTunnelTouch(0));
        bindButton('btn-dock', () => {
            dockActiveBotMegabot();
        });
        bindButton('btn-undock', () => {
            undockActiveBotMegabot();
        });

        // Bind Buddy Bot Cycle Button
        bindButton('btn-buddy-cycle', () => {
            cycleBuddyBot();
        });

        // Bind Bottom-Left 4-Bot Roster Cards
        document.querySelectorAll<HTMLElement>('.bot-card').forEach(card => {
            const botType = card.dataset.bot;
            if (!botType) return;
            card.addEventListener('touchstart', e => {
                e.preventDefault();
                e.stopPropagation();
                switchRescueBot(botType);
            }, { passive: false });
            card.addEventListener('click', e => {
                e.preventDefault();
                switchRescueBot(botType);
            });
        });

        // Hamburger Utility Menu Toggle
        bindButton('btn-menu-toggle', () => {
            const dropdown = document.getElementById('utility-menu-dropdown');
            const toggleBtn = document.getElementById('btn-menu-toggle');
            const iconBars = document.getElementById('menu-icon-bars');
            const iconClose = document.getElementById('menu-icon-close');
            if (!dropdown) return;
            const isHidden = dropdown.classList.toggle('hidden');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!isHidden));
            if (iconBars) iconBars.classList.toggle('hidden', !isHidden);
            if (iconClose) iconClose.classList.toggle('hidden', isHidden);
        });

        // Warp to Rescue Bots Headquarters Button
        bindButton('btn-hq-warp', () => {
            if (
                worldState.activeArea === 'SPACE' ||
                worldState.activeArea === 'MOON' ||
                worldState.activeArea === 'SOLAR_HUB' ||
                worldState.activeArea === 'PLANET_SURFACE' ||
                worldState.activeArea === 'SATURN_RING_RACE'
            ) {
                closeUtilityMenu();
                startSpaceTransition('TO_EARTH');
                return;
            }
            if (worldState.activeArea === 'RAIL_TUNNEL') exitRailTunnel(false);
            if (worldState.activeArea === 'UNDERGROUND') swapToSurface(true);
            if (worldState.activeArea === 'UNDERWATER') exitUnderwaterWorld();
            player.onRailwayTrack = false;
            player.pos.set(HQ_SWAP_PAD.x, getTerrainHeight(HQ_SWAP_PAD.x, HQ_SWAP_PAD.z) + 0.5, HQ_SWAP_PAD.z);
            player.heading = 0;
            player.speed = 0;
            player.hasWaypoint = false;
            const wg = waypointGroup as unknown as { visible: boolean } | null;
            if (wg) wg.visible = false;
            const isFlying = (player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) ||
                             (player.botType === 'QUICKSHADOW' && player.mode === 'VEHICLE' && isBotDocked('QUICKSHADOW')) ||
                             isBotFlyingHiddenVehicle(player.botType, player.mode);
            player.flightAlt = isFlying ? 16 : 0;
            input.camYaw = 0; // Greet player facing the bot heroically in front of HQ
            closeUtilityMenu();
            showToast("COMMAND CENTER WARP", "Arrived at Rescue Bots Firehouse HQ!");
        });

        // Dynamic Endless Emergency Spawner Toggle Button
        bindButton('btn-endless-toggle', () => {
            progression.autoSpawnEmergencies = !progression.autoSpawnEmergencies;
            saveProgression();

            const endlessIcon = document.getElementById('endless-icon');
            const endlessLabel = document.getElementById('endless-label');
            const endlessBtn = document.getElementById('btn-endless-toggle');
            if (endlessIcon) endlessIcon.innerHTML = progression.autoSpawnEmergencies ? SVG_ICONS.AUTO_SPAWN_ON : SVG_ICONS.AUTO_SPAWN_OFF;
            if (endlessLabel) endlessLabel.textContent = progression.autoSpawnEmergencies ? 'Auto-Spawn: ON' : 'Auto-Spawn: OFF';
            if (endlessBtn) {
                endlessBtn.className = progression.autoSpawnEmergencies
                    ? "bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border border-lime-400/60 text-white w-full text-left"
                    : "bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border border-slate-600/50 text-slate-300 w-full text-left";
            }

            if (progression.autoSpawnEmergencies) {
                const beaconList = beacons as Array<{ restored?: boolean }>;
                const allRestored = beaconList.length > 0 && beaconList.every(b => b.restored);
                if (allRestored) {
                    document.getElementById('victory-modal')?.classList.add('hidden');
                    buildHazardSites();
                    sfx.playSirenPulse();
                    showToast("ENDLESS DISPATCH ON!", "8 New Island Emergencies Active!");
                } else {
                    showToast("ENDLESS DISPATCH ON", "Cleared sites will dynamically re-spawn!");
                }
            } else {
                clearTimeout(window._endlessWaveTimeout);
                showToast("ENDLESS DISPATCH OFF", "Manual reset mode enabled.");
            }
        });

        bindButton('btn-time', () => {
            cycleWeatherMode(null, true);
        });

        bindButton('btn-cam', () => {
            input.camZoomMode = (input.camZoomMode + 1) % 3;
            const labels = ['View: WIDE', 'View: SKY MAP', 'View: CLOSE'];
            const camLabel = document.getElementById('cam-label');
            if (camLabel) camLabel.textContent = labels[input.camZoomMode];
        });

        bindButton('btn-sound', () => {
            sfx.enabled = !sfx.enabled;
            if (!sfx.enabled) {
                sfx.stopContinuousLoops();
            }
            if (typeof sfx.applySettingsVolumes === 'function') {
                sfx.applySettingsVolumes();
            }
            const soundIconEl = document.getElementById('sound-icon');
            if (soundIconEl) soundIconEl.innerHTML = sfx.enabled ? SVG_ICONS.SOUND_ON : SVG_ICONS.SOUND_OFF;
            const soundLabel = document.getElementById('sound-label');
            if (soundLabel) soundLabel.textContent = sfx.enabled ? 'Sounds: ON' : 'Sounds: OFF';
        });

        bindButton('btn-reset', () => {
            if (worldState.activeArea === 'UNDERGROUND') swapToSurface(true);
            if (worldState.activeArea === 'UNDERWATER') exitUnderwaterWorld();
            player.pos.set(HQ_SWAP_PAD.x, 5, HQ_SWAP_PAD.z);
            player.heading = 0;
            player.speed = 0;
            player.hasWaypoint = false;
            const wg = waypointGroup as unknown as { visible: boolean } | null;
            if (wg) wg.visible = false;
            buildHazardSites();
            buildEnergonCubes();
            closeUtilityMenu();
            showToast("ISLAND RESET", "All 8 Emergencies & Energon Cubes Respawned!");
        });

        
        // =====================================================================
        // SETTINGS MODAL INTERACTIVE LOGIC & KEY REBIND MACHINE
}

if (typeof window !== 'undefined') {
    window.bindButton = bindButton;
    window.initHUDButtons = initHUDButtons;
}

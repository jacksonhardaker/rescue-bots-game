// HUD Event Listeners, Button Touch Handlers & Bot Tray UI
import {
    triggerTransform, triggerPrimaryAction, triggerSecondaryAction,
    triggerDescendAction, toggleSiren, dockHighTideMegabot, undockHighTideMegabot,
    cycleBuddyBot, switchRescueBot
} from '../physics/player.js';
import { sfx } from '../audio/soundFX.js';
import { SVG_ICONS } from './icons.js';

        export function bindButton(id, fn) {
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
        bindButton('btn-action', triggerPrimaryAction);
        bindButton('btn-jump-scan', triggerSecondaryAction);
        bindButton('btn-descend', triggerDescendAction);
        bindButton('btn-siren', toggleSiren);
        bindButton('btn-dock', dockHighTideMegabot);
        bindButton('btn-undock', undockHighTideMegabot);

        // Bind Buddy Bot Cycle Button
        bindButton('btn-buddy-cycle', () => {
            cycleBuddyBot();
        });

        // Bind Bottom-Left 4-Bot Roster Cards
        document.querySelectorAll('.bot-card').forEach(card => {
            const botType = card.dataset.bot;
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
            const isHidden = dropdown.classList.toggle('hidden');
            toggleBtn.setAttribute('aria-expanded', String(!isHidden));
            iconBars.classList.toggle('hidden', !isHidden);
            iconClose.classList.toggle('hidden', isHidden);
        });

        // Warp to Rescue Bots Headquarters Button
        bindButton('btn-hq-warp', () => {
            player.pos.set(HQ_SWAP_PAD.x, getTerrainHeight(HQ_SWAP_PAD.x, HQ_SWAP_PAD.z) + 0.5, HQ_SWAP_PAD.z);
            player.heading = 0;
            player.speed = 0;
            player.hasWaypoint = false;
            waypointGroup.visible = false;
            player.flightAlt = player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO') ? 16 : 0;
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
                const allRestored = beacons.length > 0 && beacons.every(b => b.restored);
                if (allRestored) {
                    document.getElementById('victory-modal').classList.add('hidden');
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
            applyWeatherMode(currentWeatherIdx + 1, true);
        });

        bindButton('btn-cam', () => {
            input.camZoomMode = (input.camZoomMode + 1) % 3;
            const labels = ['View: WIDE', 'View: SKY MAP', 'View: CLOSE'];
            document.getElementById('cam-label').textContent = labels[input.camZoomMode];
        });

        bindButton('btn-sound', () => {
            sfx.enabled = !sfx.enabled;
            if (!sfx.enabled) {
                sfx.stopContinuousLoops();
            }
            const soundIconEl = document.getElementById('sound-icon');
            if (soundIconEl) soundIconEl.innerHTML = sfx.enabled ? SVG_ICONS.SOUND_ON : SVG_ICONS.SOUND_OFF;
            const soundLabel = document.getElementById('sound-label');
            if (soundLabel) soundLabel.textContent = sfx.enabled ? 'Sounds: ON' : 'Sounds: OFF';
        });

        bindButton('btn-reset', () => {
            player.pos.set(HQ_SWAP_PAD.x, 5, HQ_SWAP_PAD.z);
            player.heading = 0;
            player.speed = 0;
            player.hasWaypoint = false;
            waypointGroup.visible = false;
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

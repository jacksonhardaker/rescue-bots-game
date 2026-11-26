// Settings Modal UI Rendering, Sliders, Audio Controls & Key Rebinding
import {
    gameSettings, saveGameSettings, applyGameSettings,
    formatKeyName, ACTION_LABELS, getSceneOutlineStats
} from '../settings/settings.js';
import { exportSaveData, importSaveData, resetCareerProgress } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { bindButton } from './hud.js';
import { BOT_METADATA } from '../bots/botMeta.js';

import { getRescueStarRank, CURRENT_SAVE_VERSION, saveProgression, ALL_PLAYABLE_BOTS, getBotDockedKey, isBotDocked, progression } from '../progression/progression.js';
import { showToast } from './dialogs.js';
import { DEFAULT_SETTINGS, matchesAction } from '../settings/settings.js';
import { applyWeatherMode, currentWeatherIdx, cycleWeatherMode, toggleAutoCycle } from '../world/weather.js';
import { visitingAutobots, WORLD_MEGA_ATTACHMENTS } from '../world/allies.js';
import { openTacticalMap, closeTacticalMap } from './tacticalMap.js';
import { closeUtilityMenu } from '../physics/movement.js';
import { buildHazardSites } from '../world/emergencies.js';
import { switchRescueBot, unlockAndSwitchBot, triggerTransform, toggleHiddenVehicleMode, triggerPrimaryAction, triggerSecondaryAction, triggerDescendAction, toggleSiren, undockHighTideMegabot, dockHighTideMegabot, undockOptimusMegabot, dockOptimusMegabot, dockActiveBotMegabot, undockActiveBotMegabot, cycleBuddyBot } from '../physics/player.js';
import { toggleBumblebeeMorph } from '../world/allies.js';
import { triggerBoulderDrillTransition } from '../world/underground.js';
import { enterUnderwaterWorld, exitUnderwaterWorld, triggerUnderwaterSonar } from '../world/underwater.js';
import { isPointInWater } from '../world/terrain.js';
import { getUpcomingRailSwitch, toggleRailSwitch, type RailTrackId } from '../world/railway.js';
import { worldState } from '../state/gameState.js';
import { morbotBattle } from '../world/morbot.js';
import { highTideWorldShip, optimusWorldTrailer } from '../world/allies.js';
let activeRebindAction: string | null = null;

        export function renderSettingsControlsList() {
            const container = document.getElementById('settings-controls-list');
            if (!container) return;
            container.innerHTML = '';

            Object.keys(ACTION_LABELS).forEach(action => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs';

                const label = document.createElement('span');
                label.className = 'font-bold text-slate-200 pr-2';
                label.textContent = (ACTION_LABELS as Record<string, string>)[action] || action;
                row.appendChild(label);

                const btn = document.createElement('button');
                btn.className = 'px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition-colors shrink-0 ' +
                    (activeRebindAction === action
                        ? 'bg-amber-400 text-slate-950 border-amber-200 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-400/50');

                const keys = gameSettings.controls[action] || [];
                btn.textContent = activeRebindAction === action ? 'PRESS KEY...' : keys.map(formatKeyName).join(' / ') || 'Unbound';

                btn.onclick = (e) => {
                    e.stopPropagation();
                    activeRebindAction = action;
                    renderSettingsControlsList();
                };

                row.appendChild(btn);
                container.appendChild(row);
            });
        }

        export function syncSettingsUI() {
            // Audio Sliders
            const sMaster = document.getElementById('slider-vol-master') as HTMLInputElement | null;
            const lMaster = document.getElementById('label-vol-master');
            if (sMaster && lMaster) {
                const pct = Math.round(gameSettings.audio.masterVolume * 100);
                sMaster.value = String(pct);
                lMaster.textContent = pct + '%';
            }
            const sSfx = document.getElementById('slider-vol-sfx') as HTMLInputElement | null;
            const lSfx = document.getElementById('label-vol-sfx');
            if (sSfx && lSfx) {
                const pct = Math.round(gameSettings.audio.sfxVolume * 100);
                sSfx.value = String(pct);
                lSfx.textContent = pct + '%';
            }
            const sEngine = document.getElementById('slider-vol-engine') as HTMLInputElement | null;
            const lEngine = document.getElementById('label-vol-engine');
            if (sEngine && lEngine) {
                const pct = Math.round(gameSettings.audio.engineVolume * 100);
                sEngine.value = String(pct);
                lEngine.textContent = pct + '%';
            }
            const btnMute = document.getElementById('btn-toggle-mute');
            if (btnMute) {
                if (gameSettings.audio.muted) {
                    btnMute.textContent = 'MUTED';
                    btnMute.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500';
                } else {
                    btnMute.textContent = 'UNMUTED';
                    btnMute.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 border border-slate-700';
                }
            }

            // Graphics Outlines
            const btnOutlines = document.getElementById('btn-toggle-outlines');
            if (btnOutlines) {
                if (gameSettings.graphics.outlines) {
                    btnOutlines.textContent = 'ON';
                    btnOutlines.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400 shrink-0 cursor-pointer';
                } else {
                    btnOutlines.textContent = 'OFF';
                    btnOutlines.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 border border-slate-700 shrink-0 cursor-pointer';
                }
            }
            const btnAutoFps = document.getElementById('btn-toggle-autofps');
            if (btnAutoFps) {
                if (gameSettings.graphics.autoFpsGovernor !== false) {
                    btnAutoFps.textContent = 'ON';
                    btnAutoFps.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400 shrink-0 cursor-pointer';
                } else {
                    btnAutoFps.textContent = 'OFF';
                    btnAutoFps.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 border border-slate-700 shrink-0 cursor-pointer';
                }
            }
            const outlineStatsEl = document.getElementById('settings-outline-stats');
            if (outlineStatsEl) {
                const stats = getSceneOutlineStats();
                outlineStatsEl.textContent = `Inverted-hull cartoon edges. Currently ${stats.outlineMeshes} meshes (${stats.ratio}% of scene meshes).`;
            }

            // Graphics Preset Buttons Active Highlight
            document.querySelectorAll<HTMLElement>('.gfx-preset-btn').forEach(b => {
                const active = b.dataset.preset === gameSettings.graphics.preset;
                b.className = 'gfx-preset-btn px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ' +
                    (active
                        ? 'bg-cyan-500/30 text-white border-cyan-400'
                        : 'bg-slate-800 border-slate-700 hover:border-cyan-400 text-slate-200');
            });

            // Graphics Shadows Label & Buttons
            const labelShadows = document.getElementById('label-gfx-shadows');
            if (labelShadows) {
                const map: Record<string, string> = { off: 'Disabled', low: 'Low (180m)', medium: 'Med (280m)', high: 'High (380m)' };
                labelShadows.textContent = map[gameSettings.graphics.shadows] || 'High';
            }
            document.querySelectorAll<HTMLElement>('.gfx-opt-btn[data-opt="shadows"]').forEach(b => {
                const active = b.dataset.val === gameSettings.graphics.shadows;
                b.className = 'gfx-opt-btn px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors ' +
                    (active ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700');
            });

            // Graphics Draw Distance
            const labelDrawDist = document.getElementById('label-gfx-drawdist');
            if (labelDrawDist) {
                const map: Record<string, string> = { low: 'Near (950m)', medium: 'Med (1600m)', high: 'Far (2400m)' };
                labelDrawDist.textContent = map[gameSettings.graphics.drawDistance] || 'Far';
            }
            document.querySelectorAll<HTMLElement>('.gfx-opt-btn[data-opt="drawDistance"]').forEach(b => {
                const active = b.dataset.val === gameSettings.graphics.drawDistance;
                b.className = 'gfx-opt-btn px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors ' +
                    (active ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700');
            });

            // Graphics Resolution
            const labelRes = document.getElementById('label-gfx-res');
            if (labelRes) {
                const map: Record<string, string> = { ultralow: '0.75x Turbo', low: '1x Perf', medium: '1.35x Med', high: '2x Sharp' };
                labelRes.textContent = map[gameSettings.graphics.resolution] || '2x Sharp';
            }
            document.querySelectorAll<HTMLElement>('.gfx-opt-btn[data-opt="resolution"]').forEach(b => {
                const active = b.dataset.val === gameSettings.graphics.resolution;
                b.className = 'gfx-opt-btn px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors ' +
                    (active ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700');
            });

            // Career Save Stats
            const saveStatsEl = document.getElementById('settings-save-stats');
            if (saveStatsEl && typeof getRescueStarRank === 'function' && typeof progression !== 'undefined') {
                const rankInfo = getRescueStarRank(progression);
                saveStatsEl.innerHTML = `
                    <div class="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                        <div class="text-slate-300 text-[10px] font-semibold">RESCUE RANK</div>
                        <div class="font-bold text-amber-300 text-xs mt-0.5">${rankInfo.title} (${rankInfo.level} Star)</div>
                    </div>
                    <div class="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                        <div class="text-slate-300 text-[10px] font-semibold">HERO POINTS</div>
                        <div class="font-bold text-cyan-300 text-xs mt-0.5">${rankInfo.pts} Pts</div>
                    </div>
                    <div class="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                        <div class="text-slate-300 text-[10px] font-semibold">EMERGENCIES</div>
                        <div class="font-bold text-emerald-300 text-xs mt-0.5">${progression.totalEmergenciesResolved} Resolved</div>
                    </div>
                    <div class="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
                        <div class="text-slate-300 text-[10px] font-semibold">ENERGON CUBES</div>
                        <div class="font-bold text-yellow-300 text-xs mt-0.5">${progression.totalEnergonCubes} Collected</div>
                    </div>
                `;
            }

            renderSettingsControlsList();
        }

        // exportSaveData imported from progression.js
function _localExport() {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(progression, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `griffin-rock-save-v${CURRENT_SAVE_VERSION}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }

        // importSaveData imported from progression.js
function _localImport(file: Blob | null | undefined) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const rawResult = e.target?.result;
                    if (typeof rawResult !== 'string') return;
                    const parsed = JSON.parse(rawResult) as Record<string, unknown>;
                    if (parsed && typeof parsed === 'object') {
                        ['totalEmergenciesResolved', 'totalCitizensRescued', 'totalEnergonCubes', 'totalStuntsCompleted'].forEach(f => {
                            const val = parsed[f];
                            if (typeof val === 'number' && Number.isFinite(val)) progression[f] = Math.max(0, Math.floor(val));
                        });
                        ['discoveredLandmarks', 'collectedCrests', 'discoveredAllies'].forEach(f => {
                            if (Array.isArray(parsed[f])) progression[f] = parsed[f];
                        });
                        if (typeof parsed.playerBotType === 'string' && BOT_METADATA[parsed.playerBotType]) {
                            progression.playerBotType = parsed.playerBotType;
                        }
                        if (typeof parsed.buddyBotType === 'string' && BOT_METADATA[parsed.buddyBotType]) {
                            progression.buddyBotType = parsed.buddyBotType;
                        }
                        if (typeof parsed.playerMode === 'string' && ['BOT', 'VEHICLE', 'DINO'].includes(parsed.playerMode)) {
                            progression.playerMode = parsed.playerMode;
                        }
                        ALL_PLAYABLE_BOTS.forEach(b => {
                            const k = getBotDockedKey(b);
                            if (typeof parsed[k] === 'boolean') {
                                progression[k] = parsed[k];
                            }
                        });
                        if (parsed.playerPosition && typeof parsed.playerPosition === 'object') {
                            progression.playerPosition = parsed.playerPosition as { x: number; y: number; z: number; heading: number };
                        }
                        if (Array.isArray(parsed.completedMissions)) {
                            progression.completedMissions = parsed.completedMissions.filter((x): x is number => typeof x === 'number');
                        }
                        saveProgression();
                        showToast('SAVE IMPORTED!', 'Career progression loaded successfully!');
                        sfx.playRankUp();
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    alert('Could not read or parse save file: ' + msg);
                }
            };
            reader.readAsText(file);
        }

        // resetCareerProgress imported from progression.js
function _localReset() {
            if (confirm('Are you sure you want to reset your career progress? This will reset your emergency count, energon cubes, and rank. Your settings and keybindings will be kept.')) {
                progression.totalEmergenciesResolved = 0;
                progression.totalCitizensRescued = 0;
                progression.totalEnergonCubes = 0;
                progression.totalStuntsCompleted = 0;
                progression.discoveredLandmarks = [];
                progression.collectedCrests = [];
                progression.discoveredAllies = [];
                ALL_PLAYABLE_BOTS.forEach(b => {
                    const k = getBotDockedKey(b);
                    progression[k] = false;
                });
                progression.playerBotType = 'BOULDER';
                progression.buddyBotType = 'HEATWAVE';
                progression.playerMode = 'BOT';
                progression.playerPosition = null;
                progression.completedMissions = [];
                saveProgression();
                showToast('CAREER RESET', 'Griffin Rock progress reset to Cadet Bot.');
                setTimeout(() => window.location.reload(), 800);
            }
        }

        // Settings Modal Open/Close Buttons
        bindButton('btn-settings', () => {
            closeUtilityMenu();
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.remove('hidden');
                syncSettingsUI();
            }
        });
        bindButton('btn-close-settings', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.classList.add('hidden');
            activeRebindAction = null;
        });
        bindButton('btn-ack-settings', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.classList.add('hidden');
            activeRebindAction = null;
        });

        // Tab Navigation
        document.querySelectorAll<HTMLElement>('.settings-tab-btn').forEach(tabBtn => {
            tabBtn.onclick = () => {
                const tabKey = tabBtn.dataset.tab;
                document.querySelectorAll<HTMLElement>('.settings-tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-cyan-500/30', 'border-cyan-400', 'text-white');
                    b.classList.add('bg-slate-800/80', 'border-slate-700', 'text-slate-300');
                });
                tabBtn.classList.remove('bg-slate-800/80', 'border-slate-700', 'text-slate-300');
                tabBtn.classList.add('active', 'bg-cyan-500/30', 'border-cyan-400', 'text-white');

                ['controls', 'graphics', 'audio', 'save'].forEach(t => {
                    const pane = document.getElementById('tab-pane-' + t);
                    if (pane) pane.classList.toggle('hidden', t !== tabKey);
                });
                syncSettingsUI();
            };
        });

        // Audio Sliders
        const sMasterEl = document.getElementById('slider-vol-master') as HTMLInputElement | null;
        if (sMasterEl) {
            sMasterEl.oninput = (e) => {
                const target = e.target as HTMLInputElement | null;
                if (!target) return;
                gameSettings.audio.masterVolume = parseFloat(target.value) / 100;
                saveGameSettings();
                applyGameSettings();
            };
        }
        const sSfxEl = document.getElementById('slider-vol-sfx') as HTMLInputElement | null;
        if (sSfxEl) {
            sSfxEl.oninput = (e) => {
                const target = e.target as HTMLInputElement | null;
                if (!target) return;
                gameSettings.audio.sfxVolume = parseFloat(target.value) / 100;
                saveGameSettings();
                applyGameSettings();
            };
        }
        const sEngineEl = document.getElementById('slider-vol-engine') as HTMLInputElement | null;
        if (sEngineEl) {
            sEngineEl.oninput = (e) => {
                const target = e.target as HTMLInputElement | null;
                if (!target) return;
                gameSettings.audio.engineVolume = parseFloat(target.value) / 100;
                saveGameSettings();
                applyGameSettings();
            };
        }

        // Mute Toggle
        bindButton('btn-toggle-mute', () => {
            gameSettings.audio.muted = !gameSettings.audio.muted;
            sfx.enabled = !gameSettings.audio.muted;
            saveGameSettings();
            applyGameSettings();
        });

        // Graphics Outlines & Auto-FPS Governor Toggles
        bindButton('btn-toggle-outlines', () => {
            gameSettings.graphics.outlines = !gameSettings.graphics.outlines;
            saveGameSettings();
            applyGameSettings();
        });
        bindButton('btn-toggle-autofps', () => {
            gameSettings.graphics.autoFpsGovernor = !(gameSettings.graphics.autoFpsGovernor !== false);
            saveGameSettings();
            applyGameSettings();
        });

        // Graphics Quality Presets
        document.querySelectorAll<HTMLElement>('.gfx-preset-btn').forEach(btn => {
            btn.onclick = () => {
                const p = btn.dataset.preset;
                if (!p) return;
                gameSettings.graphics.preset = p;
                if (p === 'low') {
                    gameSettings.graphics.shadows = 'off';
                    gameSettings.graphics.outlines = false;
                    gameSettings.graphics.drawDistance = 'low';
                    gameSettings.graphics.resolution = 'ultralow';
                } else if (p === 'medium') {
                    gameSettings.graphics.shadows = 'low';
                    gameSettings.graphics.outlines = true;
                    gameSettings.graphics.drawDistance = 'medium';
                    gameSettings.graphics.resolution = 'medium';
                } else if (p === 'high') {
                    gameSettings.graphics.shadows = 'medium';
                    gameSettings.graphics.outlines = true;
                    gameSettings.graphics.drawDistance = 'high';
                    gameSettings.graphics.resolution = 'high';
                } else if (p === 'ultra') {
                    gameSettings.graphics.shadows = 'high';
                    gameSettings.graphics.outlines = true;
                    gameSettings.graphics.drawDistance = 'high';
                    gameSettings.graphics.resolution = 'high';
                }
                saveGameSettings();
                applyGameSettings();
            };
        });

        // Graphics Option Buttons (Shadows, Draw Distance, Resolution)
        document.querySelectorAll<HTMLElement>('.gfx-opt-btn').forEach(btn => {
            btn.onclick = () => {
                const opt = btn.dataset.opt;
                const val = btn.dataset.val;
                if ((opt === 'shadows' || opt === 'drawDistance' || opt === 'resolution') && val) {
                    gameSettings.graphics[opt] = val;
                    saveGameSettings();
                    applyGameSettings();
                }
            };
        });

        // Reset Controls
        bindButton('btn-reset-controls', () => {
            gameSettings.controls = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.controls));
            saveGameSettings();
            renderSettingsControlsList();
            sfx.playSpeechPop();
        });

        // Save Export / Import / Reset
        bindButton('btn-export-save', exportSaveData);
        const fileImportEl = document.getElementById('file-import-save') as HTMLInputElement | null;
        if (fileImportEl) {
            fileImportEl.onchange = (e) => {
                const target = e.target as HTMLInputElement | null;
                if (target?.files && target.files[0]) {
                    importSaveData(target.files[0]);
                }
            };
        }
        bindButton('btn-reset-career', resetCareerProgress);

        // About & Legal Notice Modal Buttons
        bindButton('btn-about-legal', () => {
            closeUtilityMenu();
            const modal = document.getElementById('about-legal-modal');
            if (modal) modal.classList.remove('hidden');
        });
        bindButton('btn-close-about', () => {
            const modal = document.getElementById('about-legal-modal');
            if (modal) modal.classList.add('hidden');
        });
        bindButton('btn-ack-about', () => {
            const modal = document.getElementById('about-legal-modal');
            if (modal) modal.classList.add('hidden');
        });

        bindButton('btn-keep-exploring', () => {
            document.getElementById('victory-modal')?.classList.add('hidden');
        });
        bindButton('btn-new-hazards', () => {
            document.getElementById('victory-modal')?.classList.add('hidden');
            buildHazardSites();
            showToast("EMERGENCY DISPATCH!", "8 New Island Emergencies Active!");
        });

        // Dr. Morocco & MorBot Boss Challenge Event Buttons
        bindButton('btn-close-morbot', () => morbotBattle.closeChallengeModal(false));
        bindButton('btn-start-morbot', () => morbotBattle.closeChallengeModal(true));
        bindButton('btn-morbot-victory-ok', () => morbotBattle.dismissVictoryModal());

        // Keyboard Shortcuts (1-5 Switch Bot, 6-0 Secret Ally Switch, WASD Move, Space Cycle Transform, E/Shift Special, Q/C Ascend/Descend)
        window.addEventListener('keydown', e => {
            // Interactive Control Remapping Interceptor
            if (activeRebindAction) {
                e.preventDefault();
                e.stopPropagation();
                if (e.code === 'Escape') {
                    activeRebindAction = null;
                    renderSettingsControlsList();
                    return;
                }
                gameSettings.controls[activeRebindAction] = [e.code];
                saveGameSettings();
                sfx.playSpeechPop();
                activeRebindAction = null;
                renderSettingsControlsList();
                return;
            }

            input.keys[e.code] = true;
            if (e.code === 'Digit1' || e.code === 'Numpad1') switchRescueBot('BOULDER');
            if (e.code === 'Digit2' || e.code === 'Numpad2') switchRescueBot('HEATWAVE');
            if (e.code === 'Digit3' || e.code === 'Numpad3') switchRescueBot('CHASE');
            if (e.code === 'Digit4' || e.code === 'Numpad4') switchRescueBot('BLADES');
            if (e.code === 'Digit5' || e.code === 'Numpad5') unlockAndSwitchBot('QUICKSHADOW');
            // Secret cheat codes: 6, 7, 8, 9, 0 unlock & deploy visiting Autobot allies!
            if (e.code === 'Digit6' || e.code === 'Numpad6') unlockAndSwitchBot('OPTIMUS');
            if (e.code === 'Digit7' || e.code === 'Numpad7') unlockAndSwitchBot('BUMBLEBEE');
            if (e.code === 'Digit8' || e.code === 'Numpad8') unlockAndSwitchBot('BLURR');
            if (e.code === 'Digit9' || e.code === 'Numpad9') unlockAndSwitchBot('SALVAGE');
            if (e.code === 'Digit0' || e.code === 'Numpad0') unlockAndSwitchBot('HIGHTIDE');
            if (e.code === 'Minus' || e.code === 'NumpadSubtract') unlockAndSwitchBot('QUICKSHADOW');

            if (matchesAction(e.code, 'transform') && !e.repeat) {
                e.preventDefault();
                triggerTransform();
            }
            if (matchesAction(e.code, 'primaryAction') && !e.repeat) {
                if (worldState.activeArea === 'UNDERWATER') {
                    triggerUnderwaterSonar();
                } else {
                    triggerPrimaryAction();
                }
            }
            if (matchesAction(e.code, 'secondaryAction') && !e.repeat) {
                triggerSecondaryAction();
            }
            if (matchesAction(e.code, 'descendAction') && !e.repeat) {
                triggerDescendAction();
            }
            if (matchesAction(e.code, 'siren') && !e.repeat) {
                toggleSiren();
            }
            if ((e.code === 'KeyE' || e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') && !e.repeat && worldState.activeArea === 'SURFACE' && player.botType === 'TOREINBOTTO' && player.mode === 'VEHICLE' && player.onRailwayTrack) {
                const up = getUpcomingRailSwitch((player.trackId as RailTrackId) || 'MAIN_LOOP', player.trackDist ?? 0, player.trackDir ?? 1, Infinity);
                if (up) {
                    const sw = toggleRailSwitch(up.sw.id);
                    if (sw) {
                        showToast(
                            sw.divert ? `SWITCHED TO ${sw.branchLabel}` : 'SWITCHED TO MAIN LINE',
                            sw.divert ? `Next junction (${Math.round(up.distAhead)}m) will divert onto ${sw.branchLabel}!` : 'Next junction set to Griffin Rock Grand Circuit!'
                        );
                    }
                }
            }
            if (e.code === 'KeyH' && !e.repeat) {
                toggleHiddenVehicleMode();
            }
            if (matchesAction(e.code, 'drillAction') && !e.repeat) {
                if (worldState.activeArea === 'SURFACE' && player.botType === 'HIGHTIDE' && isPointInWater(player.pos.x, player.pos.z)) {
                    enterUnderwaterWorld();
                } else if (worldState.activeArea === 'UNDERWATER') {
                    exitUnderwaterWorld();
                } else {
                    triggerBoulderDrillTransition();
                }
            }
            if (matchesAction(e.code, 'dock') && !e.repeat) {
                if (isBotDocked(player.botType)) {
                    undockActiveBotMegabot();
                } else {
                    const targetWorldMesh = WORLD_MEGA_ATTACHMENTS && WORLD_MEGA_ATTACHMENTS[player.botType];
                    if (targetWorldMesh && targetWorldMesh.visible && Math.hypot(player.pos.x - targetWorldMesh.position.x, player.pos.z - targetWorldMesh.position.z) < 34.0) {
                        dockActiveBotMegabot();
                    }
                }
            }
            if (matchesAction(e.code, 'buddyCycle') && !e.repeat) {
                cycleBuddyBot();
            }
            if (matchesAction(e.code, 'weatherCycle') && !e.repeat) {
                if (e.shiftKey) {
                    toggleAutoCycle(true);
                } else {
                    cycleWeatherMode(null, true);
                }
            }
            if (e.code === 'KeyR' && !e.repeat) {
                const allies = (typeof visitingAutobots !== 'undefined' ? visitingAutobots : []) as Array<{ id: string; x: number; z: number }>;
                const bee = allies.find(a => a.id === 'BUMBLEBEE');
                if (bee && Math.hypot(player.pos.x - bee.x, player.pos.z - bee.z) < 32) {
                    toggleBumblebeeMorph();
                }
            }
            if (matchesAction(e.code, 'map') && !e.repeat) {
                const modal = document.getElementById('tactical-map-modal');
                if (modal) {
                    if (modal.classList.contains('hidden')) openTacticalMap();
                    else closeTacticalMap();
                }
            }
            if (e.code === 'Escape' && !e.repeat) {
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal && !settingsModal.classList.contains('hidden')) {
                    settingsModal.classList.add('hidden');
                    activeRebindAction = null;
                    return;
                }
                const aboutModal = document.getElementById('about-legal-modal');
                if (aboutModal && !aboutModal.classList.contains('hidden')) {
                    aboutModal.classList.add('hidden');
                    return;
                }
                const modal = document.getElementById('tactical-map-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeTacticalMap();
                }
            }
        });
        window.addEventListener('keyup', e => {
            input.keys[e.code] = false;
        });

export function initSettingsModal() {
    renderSettingsControlsList();
    syncSettingsUI();
}

if (typeof window !== 'undefined') {
    window.renderSettingsControlsList = renderSettingsControlsList;
    window.syncSettingsUI = syncSettingsUI;
    window.initSettingsModal = initSettingsModal;
}

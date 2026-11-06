// Settings Modal UI Rendering, Sliders, Audio Controls & Key Rebinding
import {
    gameSettings, saveGameSettings, applyGameSettings,
    formatKeyName, ACTION_LABELS, getSceneOutlineStats
} from '../settings/settings.js';
import { exportSaveData, importSaveData, resetCareerProgress } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { bindButton } from './hud.js';
import { BOT_METADATA } from '../bots/botMeta.js';

import { getRescueStarRank, CURRENT_SAVE_VERSION, saveProgression } from '../progression/progression.js';
import { showToast } from './dialogs.js';
import { DEFAULT_SETTINGS, matchesAction } from '../settings/settings.js';
import { applyWeatherMode, currentWeatherIdx } from '../world/weather.js';
import { visitingAutobots } from '../world/allies.js';
import { openTacticalMap, closeTacticalMap } from './tacticalMap.js';
import { closeUtilityMenu } from '../physics/movement.js';
import { buildHazardSites } from '../world/emergencies.js';
import { switchRescueBot, unlockAndSwitchBot, triggerTransform, triggerPrimaryAction, triggerSecondaryAction, triggerDescendAction, toggleSiren, undockHighTideMegabot, dockHighTideMegabot, undockOptimusMegabot, dockOptimusMegabot, cycleBuddyBot } from '../physics/player.js';
import { toggleBumblebeeMorph } from '../world/allies.js';
import { morbotBattle } from '../world/morbot.js';
import { highTideWorldShip, optimusWorldTrailer } from '../world/allies.js';
let activeRebindAction = null;

        export function renderSettingsControlsList() {
            const container = document.getElementById('settings-controls-list');
            if (!container) return;
            container.innerHTML = '';

            Object.keys(ACTION_LABELS).forEach(action => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs';

                const label = document.createElement('span');
                label.className = 'font-bold text-slate-200';
                label.textContent = ACTION_LABELS[action];
                row.appendChild(label);

                const btn = document.createElement('button');
                btn.className = 'px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors ' +
                    (activeRebindAction === action
                        ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40');

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
            const sMaster = document.getElementById('slider-vol-master');
            const lMaster = document.getElementById('label-vol-master');
            if (sMaster && lMaster) {
                const pct = Math.round(gameSettings.audio.masterVolume * 100);
                sMaster.value = pct;
                lMaster.textContent = pct + '%';
            }
            const sSfx = document.getElementById('slider-vol-sfx');
            const lSfx = document.getElementById('label-vol-sfx');
            if (sSfx && lSfx) {
                const pct = Math.round(gameSettings.audio.sfxVolume * 100);
                sSfx.value = pct;
                lSfx.textContent = pct + '%';
            }
            const sEngine = document.getElementById('slider-vol-engine');
            const lEngine = document.getElementById('label-vol-engine');
            if (sEngine && lEngine) {
                const pct = Math.round(gameSettings.audio.engineVolume * 100);
                sEngine.value = pct;
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
                    btnOutlines.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400';
                } else {
                    btnOutlines.textContent = 'OFF';
                    btnOutlines.className = 'px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-400 border border-slate-700';
                }
            }
            const outlineStatsEl = document.getElementById('settings-outline-stats');
            if (outlineStatsEl) {
                const stats = getSceneOutlineStats();
                outlineStatsEl.textContent = `Inverted-hull cartoon edges. Currently ${stats.outlineMeshes} meshes (${stats.ratio}% of scene meshes).`;
            }

            // Graphics Shadows Label & Buttons
            const labelShadows = document.getElementById('label-gfx-shadows');
            if (labelShadows) {
                const map = { off: 'Disabled', low: 'Low (180m)', medium: 'Med (280m)', high: 'High (380m)' };
                labelShadows.textContent = map[gameSettings.graphics.shadows] || 'High';
            }
            document.querySelectorAll('.gfx-opt-btn[data-opt="shadows"]').forEach(b => {
                const active = b.dataset.val === gameSettings.graphics.shadows;
                b.className = 'gfx-opt-btn px-2 py-1.5 rounded-lg text-xs font-bold border ' +
                    (active ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-300');
            });

            // Graphics Draw Distance
            const labelDrawDist = document.getElementById('label-gfx-drawdist');
            if (labelDrawDist) {
                const map = { low: 'Near (1300m)', medium: 'Med (1800m)', high: 'Far (2400m)' };
                labelDrawDist.textContent = map[gameSettings.graphics.drawDistance] || 'Far';
            }
            document.querySelectorAll('.gfx-opt-btn[data-opt="drawDistance"]').forEach(b => {
                const active = b.dataset.val === gameSettings.graphics.drawDistance;
                b.className = 'gfx-opt-btn px-2 py-1.5 rounded-lg text-xs font-bold border ' +
                    (active ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-300');
            });

            // Graphics Resolution
            const labelRes = document.getElementById('label-gfx-res');
            if (labelRes) {
                const map = { low: '1x Native', medium: '1.35x Balanced', high: '2x Retina Sharp' };
                labelRes.textContent = map[gameSettings.graphics.resolution] || '2x Retina';
            }
            document.querySelectorAll('.gfx-opt-btn[data-opt="resolution"]').forEach(b => {
                const active = b.dataset.val === gameSettings.graphics.resolution;
                b.className = 'gfx-opt-btn px-2 py-1.5 rounded-lg text-xs font-bold border ' +
                    (active ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-300');
            });

            // Career Save Stats
            const saveStatsEl = document.getElementById('settings-save-stats');
            if (saveStatsEl && typeof getRescueStarRank === 'function' && typeof progression !== 'undefined') {
                const rankInfo = getRescueStarRank(progression);
                saveStatsEl.innerHTML = `
                    <div class="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                        <div class="text-slate-400 text-[10px]">RESCUE RANK</div>
                        <div class="font-bold text-amber-300 text-xs">${rankInfo.title} (${rankInfo.level}★)</div>
                    </div>
                    <div class="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                        <div class="text-slate-400 text-[10px]">HERO POINTS</div>
                        <div class="font-bold text-cyan-300 text-xs">${rankInfo.pts} Pts</div>
                    </div>
                    <div class="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                        <div class="text-slate-400 text-[10px]">EMERGENCIES</div>
                        <div class="font-bold text-emerald-300 text-xs">${progression.totalEmergenciesResolved} Resolved</div>
                    </div>
                    <div class="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                        <div class="text-slate-400 text-[10px]">ENERGON CUBES</div>
                        <div class="font-bold text-yellow-300 text-xs">${progression.totalEnergonCubes} Collected</div>
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
function _localImport(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const parsed = JSON.parse(e.target.result as string);
                    if (parsed && typeof parsed === 'object') {
                        ['totalEmergenciesResolved', 'totalCitizensRescued', 'totalEnergonCubes', 'totalStuntsCompleted'].forEach(f => {
                            if (Number.isFinite(parsed[f])) progression[f] = Math.max(0, Math.floor(parsed[f]));
                        });
                        ['discoveredLandmarks', 'collectedCrests', 'discoveredAllies'].forEach(f => {
                            if (Array.isArray(parsed[f])) progression[f] = parsed[f];
                        });
                        if (typeof parsed.buddyBotType === 'string' && BOT_METADATA[parsed.buddyBotType]) {
                            progression.buddyBotType = parsed.buddyBotType;
                        }
                        saveProgression();
                        showToast('SAVE IMPORTED!', 'Career progression loaded successfully!');
                        sfx.playRankUp();
                        setTimeout(() => window.location.reload(), 1000);
                    }
                } catch (err) {
                    alert('Could not read or parse save file: ' + err.message);
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
                progression.highTideDocked = false;
                progression.optimusDocked = false;
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
        document.querySelectorAll('.settings-tab-btn').forEach(tabBtn => {
            tabBtn.onclick = () => {
                const tabKey = tabBtn.dataset.tab;
                document.querySelectorAll('.settings-tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-cyan-500/30', 'border-cyan-400', 'text-white');
                    b.classList.add('bg-slate-800/50', 'border-transparent', 'text-slate-400');
                });
                tabBtn.classList.remove('bg-slate-800/50', 'border-transparent', 'text-slate-400');
                tabBtn.classList.add('active', 'bg-cyan-500/30', 'border-cyan-400', 'text-white');

                ['controls', 'graphics', 'audio', 'save'].forEach(t => {
                    const pane = document.getElementById('tab-pane-' + t);
                    if (pane) pane.classList.toggle('hidden', t !== tabKey);
                });
                syncSettingsUI();
            };
        });

        // Audio Sliders
        const sMasterEl = document.getElementById('slider-vol-master');
        if (sMasterEl) {
            sMasterEl.oninput = (e) => {
                gameSettings.audio.masterVolume = parseFloat(e.target.value) / 100;
                saveGameSettings();
                applyGameSettings();
            };
        }
        const sSfxEl = document.getElementById('slider-vol-sfx');
        if (sSfxEl) {
            sSfxEl.oninput = (e) => {
                gameSettings.audio.sfxVolume = parseFloat(e.target.value) / 100;
                saveGameSettings();
                applyGameSettings();
            };
        }
        const sEngineEl = document.getElementById('slider-vol-engine');
        if (sEngineEl) {
            sEngineEl.oninput = (e) => {
                gameSettings.audio.engineVolume = parseFloat(e.target.value) / 100;
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

        // Graphics Outlines Toggle
        bindButton('btn-toggle-outlines', () => {
            gameSettings.graphics.outlines = !gameSettings.graphics.outlines;
            saveGameSettings();
            applyGameSettings();
        });

        // Graphics Quality Presets
        document.querySelectorAll('.gfx-preset-btn').forEach(btn => {
            btn.onclick = () => {
                const p = btn.dataset.preset;
                gameSettings.graphics.preset = p;
                if (p === 'low') {
                    gameSettings.graphics.shadows = 'off';
                    gameSettings.graphics.outlines = false;
                    gameSettings.graphics.drawDistance = 'low';
                    gameSettings.graphics.resolution = 'low';
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
        document.querySelectorAll('.gfx-opt-btn').forEach(btn => {
            btn.onclick = () => {
                const opt = btn.dataset.opt;
                const val = btn.dataset.val;
                if (opt && val) {
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
        const fileImportEl = document.getElementById('file-import-save');
        if (fileImportEl) {
            fileImportEl.onchange = (e) => {
                if (e.target.files && e.target.files[0]) {
                    importSaveData(e.target.files[0]);
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
            document.getElementById('victory-modal').classList.add('hidden');
        });
        bindButton('btn-new-hazards', () => {
            document.getElementById('victory-modal').classList.add('hidden');
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
                triggerPrimaryAction();
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
            if (matchesAction(e.code, 'dock') && !e.repeat) {
                if (player.botType === 'HIGHTIDE') {
                    if (progression.highTideDocked) {
                        undockHighTideMegabot();
                    } else if (highTideWorldShip && Math.hypot(player.pos.x - highTideWorldShip.position.x, player.pos.z - highTideWorldShip.position.z) < 34.0) {
                        dockHighTideMegabot();
                    }
                } else if (player.botType === 'OPTIMUS') {
                    if (progression.optimusDocked) {
                        undockOptimusMegabot();
                    } else if (optimusWorldTrailer && Math.hypot(player.pos.x - optimusWorldTrailer.position.x, player.pos.z - optimusWorldTrailer.position.z) < 34.0) {
                        dockOptimusMegabot();
                    }
                }
            }
            if (matchesAction(e.code, 'buddyCycle') && !e.repeat) {
                cycleBuddyBot();
            }
            if (matchesAction(e.code, 'weatherCycle') && !e.repeat) {
                applyWeatherMode(currentWeatherIdx + 1, true);
            }
            if (e.code === 'KeyR' && !e.repeat) {
                const bee = (typeof visitingAutobots !== 'undefined') ? visitingAutobots.find(a => a.id === 'BUMBLEBEE') : null;
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

import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

// 1. src/physics/player.js
const catchphrasesPart = lines.slice(13904, 14402).join('\n');
const botSwitchingPart = lines.slice(14582, 14964).join('\n');
const playerActionsPart = lines.slice(21554, 22100).join('\n');

const playerFile = `// Active Player Controller, Bot Switching, Morph Animations & Action Triggers
import * as THREE from 'three';
import { player, buddyBot, botRigs, botPhraseCounters } from '../state/gameState.js';
import { BOT_METADATA, HQ_PARKING_SLOTS } from '../bots/botMeta.js';
import { applyBotRigMorph, getBotScale, setHighTideRigMega } from '../bots/botRigs.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech, showToast } from '../ui/dialogs.js';
import { progression, saveProgression } from '../progression/progression.js';
import { syncVisitingAutobotsVisibility } from '../world/allies.js';
import { spawnWaterCannonStream, spawnBurstParticles } from '../world/emergencies.js';

${catchphrasesPart
    .replace('const BOT_CATCHPHRASES = {', 'export const BOT_CATCHPHRASES = {')
    .replace('const botPhraseCounters = {', '// botPhraseCounters exported in gameState.js\nconst _localPhraseCounters = {')
    .replace('function speakBotCatchphrase(', 'export function speakBotCatchphrase(')
}

${botSwitchingPart
    .replace('function syncHUDToActiveBot() {', 'export function syncHUDToActiveBot() {')
    .replace('function getUnlockedPlayableBots() {', 'export function getUnlockedPlayableBots() {')
    .replace('function updateBotRosterUI() {', 'export function updateBotRosterUI() {')
    .replace('function cycleBuddyBot() {', 'export function cycleBuddyBot() {')
    .replace('function unlockAndSwitchBot(', 'export function unlockAndSwitchBot(')
    .replace('function syncVisitingAutobotsVisibility() {', '// syncVisitingAutobotsVisibility imported from allies.js\nfunction _localSyncAutobots() {')
    .replace('function setBuddyBot(', 'export function setBuddyBot(')
    .replace('function switchRescueBot(', 'export function switchRescueBot(')
    .replace('function updateAllBotTransforms(', 'export function updateAllBotTransforms(')
}

${playerActionsPart
    .replace('function setPlayerMode(', 'export function setPlayerMode(')
    .replace('function dockHighTideMegabot() {', 'export function dockHighTideMegabot() {')
    .replace('function undockHighTideMegabot() {', 'export function undockHighTideMegabot() {')
    .replace('function triggerTransform() {', 'export function triggerTransform() {')
    .replace('function checkHitMorBotWithSpecialAbility(', 'export function checkHitMorBotWithSpecialAbility(')
    .replace('function triggerPrimaryAction() {', 'export function triggerPrimaryAction() {')
    .replace('function triggerSecondaryAction() {', 'export function triggerSecondaryAction() {')
    .replace('function triggerDescendAction() {', 'export function triggerDescendAction() {')
    .replace('function toggleSiren() {', 'export function toggleSiren() {')
}

if (typeof window !== 'undefined') {
    window.speakBotCatchphrase = speakBotCatchphrase;
    window.syncHUDToActiveBot = syncHUDToActiveBot;
    window.getUnlockedPlayableBots = getUnlockedPlayableBots;
    window.updateBotRosterUI = updateBotRosterUI;
    window.cycleBuddyBot = cycleBuddyBot;
    window.unlockAndSwitchBot = unlockAndSwitchBot;
    window.setBuddyBot = setBuddyBot;
    window.switchRescueBot = switchRescueBot;
    window.updateAllBotTransforms = updateAllBotTransforms;
    window.setPlayerMode = setPlayerMode;
    window.dockHighTideMegabot = dockHighTideMegabot;
    window.undockHighTideMegabot = undockHighTideMegabot;
    window.triggerTransform = triggerTransform;
    window.triggerPrimaryAction = triggerPrimaryAction;
    window.triggerSecondaryAction = triggerSecondaryAction;
    window.triggerDescendAction = triggerDescendAction;
    window.toggleSiren = toggleSiren;
}
`;
fs.writeFileSync('src/physics/player.js', playerFile, 'utf8');
console.log('Created src/physics/player.js');

// 2. src/physics/movement.js
const waypointPart = lines.slice(14469, 14581).join('\n');
const inputRayPart = lines.slice(21278, 21553).join('\n');
const physicsPart = lines.slice(23615, 24361).join('\n');

const movementFile = `// Vehicle & Bot Physics, Collision, Helicopter Flight & Waypoint Autopilot
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight, isPointInWater, isNearWater, isPointOnRoad, getZoneName } from '../world/terrain.js';
import { player, buddyBot, botRigs, input, ramps, stateHolder, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { isActionActive } from '../settings/settings.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { spawnBurstParticles, spawnSoapSudsParticles, spawnSparkleGlints, spawnRocketExhaustParticles, spawnDinerFoodParticles, spawnEnergonLightningParticles, spawnWarpVortexParticles, spawnWaterWakeParticles, spawnMagnetSparkParticles, spawnPaintSplatParticles } from '../world/emergencies.js';
import { activeMorBot } from '../world/morbot.js';
import { speakBotCatchphrase } from './player.js';

export let waypointGroup = null;

${waypointPart
    .replace('const waypointGroup = new THREE.Group();', 'waypointGroup = new THREE.Group();')
    .replace(/scene\.add\(/g, '(typeof window !== \"undefined\" && window.scene ? window.scene.add : () => {})(')
}

${inputRayPart
    .replace('const input = {', '// input exported in gameState.js\nconst _localInput = {')
    .replace('function intersectRayWithTerrain(', 'export function intersectRayWithTerrain(')
    .replace('function setDestinationFromScreenPoint(', 'export function setDestinationFromScreenPoint(')
    .replace('function isUIElementTarget(', 'export function isUIElementTarget(')
    .replace('function closeUtilityMenu() {', 'export function closeUtilityMenu() {')
}

${physicsPart.replace('function updatePhysics(dt, now) {', 'export function updatePhysics(dt, now) {')}

if (typeof window !== 'undefined') {
    window.waypointGroup = waypointGroup;
    window.intersectRayWithTerrain = intersectRayWithTerrain;
    window.setDestinationFromScreenPoint = setDestinationFromScreenPoint;
    window.updatePhysics = updatePhysics;
}
`;
fs.writeFileSync('src/physics/movement.js', movementFile, 'utf8');
console.log('Created src/physics/movement.js');

// 2b. src/game/loop.js
const loopPart = lines.slice(24361, 25340).join('\n');
const loopFile = `// Main Render Loop & Animation Frame Dispatcher
import * as THREE from 'three';
import { player, buddyBot, botRigs, input } from '../state/gameState.js';
import { updatePhysics } from '../physics/movement.js';
import { updateAllBotTransforms } from '../physics/player.js';
import { updateIslandTrain, islandTrain } from '../world/railway.js';
import { updateLivingWorldNPCs, updateBuddyBotAI } from '../world/npcs.js';
import { updateInteractiveRoadProps } from '../world/props.js';
import { updateEmergentRescues, activeParticles } from '../world/emergencies.js';
import { updateEnergonCubes, updateGoldenCrests, updateLandmarkDiscovery } from '../world/collectibles.js';
import { updateVisitingAutobots } from '../world/allies.js';
import { updateMorBotBattle } from '../world/morbot.js';
import { updateViewportCulling } from './culling.js';
import { renderMinimap } from '../ui/tacticalMap.js';

let lastTime = performance.now();
let frameCount = 0;
let fpsTimer = 0;
let minimapTimer = 0;
let hudUpdateTimer = 0;

${loopPart
    .replace('let lastTime = 0;', '// lastTime declared above')
    .replace('let frameCount = 0;', '// frameCount declared above')
    .replace('let fpsTimer = 0;', '// fpsTimer declared above')
    .replace('let minimapTimer = 0;', '// minimapTimer declared above')
    .replace('let hudUpdateTimer = 0;', '// hudUpdateTimer declared above')
    .replace('function animate(now) {', 'export function animate(now) {')
}

if (typeof window !== 'undefined') {
    window.animate = animate;
}
`;
fs.writeFileSync('src/game/loop.js', loopFile, 'utf8');
console.log('Created src/game/loop.js');

// 3. src/ui/hud.js
const hudPart = lines.slice(22100, 22236).join('\n');
const hudFile = `// HUD Event Listeners, Button Touch Handlers & Bot Tray UI
import {
    triggerTransform, triggerPrimaryAction, triggerSecondaryAction,
    triggerDescendAction, toggleSiren, dockHighTideMegabot, undockHighTideMegabot,
    cycleBuddyBot, switchRescueBot
} from '../physics/player.js';
import { sfx } from '../audio/soundFX.js';

${hudPart
    .replace('function bindButton(', 'export function bindButton(')
    .replace("bindButton('btn-transform'", "export function initHUDButtons() {\n        bindButton('btn-transform'")
}
}

if (typeof window !== 'undefined') {
    window.bindButton = bindButton;
    window.initHUDButtons = initHUDButtons;
}
`;
fs.writeFileSync('src/ui/hud.js', hudFile, 'utf8');
console.log('Created src/ui/hud.js');

// 4. src/ui/settingsModal.js
const settingsModalPart = lines.slice(22237, 22710).join('\n');
const settingsModalFile = `// Settings Modal UI Rendering, Sliders, Audio Controls & Key Rebinding
import {
    gameSettings, saveGameSettings, applyGameSettings,
    formatKeyName, ACTION_LABELS, getSceneOutlineStats
} from '../settings/settings.js';
import { exportSaveData, importSaveData, resetCareerProgress } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { bindButton } from './hud.js';

let activeRebindAction = null;

${settingsModalPart
    .replace('function renderSettingsControlsList() {', 'export function renderSettingsControlsList() {')
    .replace('function syncSettingsUI() {', 'export function syncSettingsUI() {')
    .replace('function exportSaveData() {', '// exportSaveData imported from progression.js\nfunction _localExport() {')
    .replace('function importSaveData(', '// importSaveData imported from progression.js\nfunction _localImport(')
    .replace('function resetCareerProgress() {', '// resetCareerProgress imported from progression.js\nfunction _localReset() {')
}

export function initSettingsModal() {
    renderSettingsControlsList();
    syncSettingsUI();
}

if (typeof window !== 'undefined') {
    window.renderSettingsControlsList = renderSettingsControlsList;
    window.syncSettingsUI = syncSettingsUI;
    window.initSettingsModal = initSettingsModal;
}
`;
fs.writeFileSync('src/ui/settingsModal.js', settingsModalFile, 'utf8');
console.log('Created src/ui/settingsModal.js');

// 5. src/ui/tacticalMap.js
const tacticalMapPart = lines.slice(22787, 23614).join('\n');
const tacticalMapTapPart = lines.slice(22741, 22775).join('\n');

const tacticalMapFile = `// Minimap Radar & Full-Screen Tactical Island Map System
import { player, buddyBot } from '../state/gameState.js';
import { beacons } from '../world/emergencies.js';
import { DISCOVERY_LANDMARKS } from '../world/collectibles.js';
import { sfx } from '../audio/soundFX.js';
import { bindButton } from './hud.js';
import { waypointGroup } from '../physics/movement.js';
import { getSurfaceHeight, isPointInWater } from '../world/terrain.js';
import { spawnBurstParticles } from '../world/emergencies.js';
import { showToast } from './dialogs.js';

window.lastTacticalMapToggleTime = 0;

export function openTacticalMap() {
    const modal = document.getElementById('tactical-map-modal');
    if (!modal) return;
    window.lastTacticalMapToggleTime = performance.now();
    modal.classList.remove('hidden');
    if (sfx) {
        if (typeof sfx.playMapOpen === 'function') sfx.playMapOpen();
        else if (typeof sfx.playWaypointTap === 'function') sfx.playWaypointTap();
    }
    renderTacticalMap();
}

export function closeTacticalMap() {
    const modal = document.getElementById('tactical-map-modal');
    if (!modal) return;
    window.lastTacticalMapToggleTime = performance.now();
    modal.classList.add('hidden');
    if (sfx) {
        if (typeof sfx.playMapClose === 'function') sfx.playMapClose();
        else if (typeof sfx.playWaypointTap === 'function') sfx.playWaypointTap();
    }
}

export ${tacticalMapTapPart}

${tacticalMapPart
    .replace('function renderMinimap() {', 'export function renderMinimap() {')
    .replace('function renderTacticalMap() {', 'export function renderTacticalMap() {')
}

export function initTacticalMap() {
    const tacticalMapModal = document.getElementById('tactical-map-modal');
    const btnCloseTacticalMap = document.getElementById('btn-close-tactical-map');
    const tacticalMapCanvas = document.getElementById('tactical-map-canvas');

    bindButton('minimap-container', openTacticalMap);
    bindButton('minimap-canvas', openTacticalMap);

    if (btnCloseTacticalMap) {
        bindButton('btn-close-tactical-map', closeTacticalMap);
    }

    if (tacticalMapModal) {
        tacticalMapModal.addEventListener('click', (e) => {
            if (e.target === tacticalMapModal && (performance.now() - (window.lastTacticalMapToggleTime || 0) > 400)) {
                closeTacticalMap();
            }
        });
    }

    if (tacticalMapCanvas) {
        tacticalMapCanvas.addEventListener('click', (e) => {
            handleTacticalMapTap(e.clientX, e.clientY);
        });
        tacticalMapCanvas.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                if (e.cancelable) e.preventDefault();
                handleTacticalMapTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.openTacticalMap = openTacticalMap;
    window.closeTacticalMap = closeTacticalMap;
    window.renderMinimap = renderMinimap;
    window.renderTacticalMap = renderTacticalMap;
    window.handleTacticalMapTap = handleTacticalMapTap;
}
`;
fs.writeFileSync('src/ui/tacticalMap.js', tacticalMapFile, 'utf8');
console.log('Created src/ui/tacticalMap.js');

// 6. src/botcheck/visualCheck.js
const botCheckPart = lines.slice(25349, 25624).join('\n');
const botCheckFile = `// Visual Check Studio for Ground Clearance, Morph Inspection & TV-Show Proportions
import * as THREE from 'three';
import { buildRescueBotModel, applyBotRigMorph, setHighTideRigMega } from '../bots/botRigs.js';
import { BOT_METADATA } from '../bots/botMeta.js';

${botCheckPart.replace('function startBotCheck() {', 'export function startBotCheck() {')}

if (typeof window !== 'undefined') {
    window.startBotCheck = startBotCheck;
}
`;
fs.writeFileSync('src/botcheck/visualCheck.js', botCheckFile, 'utf8');
console.log('Created src/botcheck/visualCheck.js');

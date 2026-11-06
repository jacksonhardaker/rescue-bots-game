// Main Entry Point for Griffin Rock Rescue Bots 3D
import * as THREE from 'three';

// State & Core Systems
import { player, buddyBot, botRigs, input } from './state/gameState.js';
import { sfx } from './audio/soundFX.js';
import { gameSettings, loadGameSettings, applyGameSettings } from './settings/settings.js';
import { progression, loadProgression, saveProgression } from './progression/progression.js';
import { SVG_ICONS } from './ui/icons.js';

// Rendering & Textures
import { initScene } from './rendering/scene.js';
import * as materials from './rendering/materials.js';
import * as textures from './rendering/textures.js';

// World Systems
import { getTerrainHeight, getSurfaceHeight } from './world/terrain.js';
import { buildTerrainMesh } from './world/terrainMesh.js';
import { initRoads } from './world/roads.js';
import { initRailway } from './world/railway.js';
import { initBuildings } from './world/buildings.js';
import { buildInstancedVegetation } from './world/vegetation.js';
import { initProps } from './world/props.js';
import { initWeather, WEATHER_MODES, cycleWeatherMode } from './world/weather.js';
import { buildHazardSites, beacons, activeParticles } from './world/emergencies.js';
import { buildEnergonCubes, initGoldenCrests } from './world/collectibles.js';
import { initEmergentRescues } from './world/emergencies.js';
import { initVisitingAutobots, syncVisitingAutobotsVisibility } from './world/allies.js';
import { buildLivingWorldNPCs } from './world/npcs.js';

// Bot Rigs & Player Controls
import { initBotRigs } from './bots/botRigs.js';
import { syncHUDToActiveBot, switchRescueBot } from './physics/player.js';
import { updatePhysics } from './physics/movement.js';

// UI Systems
import { initHUDButtons } from './ui/hud.js';
import { initTacticalMap, openTacticalMap, closeTacticalMap, renderMinimap, renderTacticalMap } from './ui/tacticalMap.js';
import { initSettingsModal, renderSettingsControlsList, syncSettingsUI } from './ui/settingsModal.js';
import { showToast, triggerNPCSpeech } from './ui/dialogs.js';

// Game Loop & Bot Check Studio
import { animate } from './game/loop.js';
import { startBotCheck } from './botcheck/visualCheck.js';

// Attach singletons to window for HTML event handlers & debugging
if (typeof window !== 'undefined') {
    Object.assign(window, {
        THREE,
        player,
        buddyBot,
        botRigs,
        input,
        sfx,
        gameSettings,
        progression,
        openTacticalMap,
        closeTacticalMap,
        renderMinimap,
        renderTacticalMap,
        renderSettingsControlsList,
        syncSettingsUI,
        showToast,
        triggerNPCSpeech,
        switchRescueBot,
        startBotCheck
    });
}

export function initGame() {
    // 1. Initialize Scene & Renderer
    const { scene, camera, renderer } = initScene();

    // Check if player requested Visual Check Studio (?botcheck)
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('botcheck')) {
        startBotCheck();
        return;
    }

    // 2. Load Settings & Progression
    loadProgression();
    applyGameSettings();

    // 3. Build Island World
    buildTerrainMesh(scene);
    initRoads(scene);
    initRailway(scene);
    initBuildings(scene);
    buildInstancedVegetation(scene);
    initProps(scene);
    initWeather(scene);

    // 4. Build Bot Models
    initBotRigs(scene);

    // 5. Build Quests, Collectibles & Living World
    buildHazardSites(scene);
    buildEnergonCubes(scene);
    initGoldenCrests(scene);
    initEmergentRescues(scene);
    initVisitingAutobots(scene);
    buildLivingWorldNPCs(scene);

    // 6. Initialize UI & Event Handlers
    initHUDButtons();
    initTacticalMap();
    initSettingsModal();

    // 7. Sync Initial State
    syncHUDToActiveBot();
    syncVisitingAutobotsVisibility();
    renderMinimap();

    // 8. Apply Saved Weather
    if (progression && progression.weatherMode && typeof cycleWeatherMode === 'function') {
        cycleWeatherMode(progression.weatherMode, false);
    }

    // 9. Start Main Render & Animation Loop
    requestAnimationFrame(animate);
}

// Auto-run on DOM ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
}

import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

// 1. Emergencies
const emergSitesPart = lines.slice(14968, 15024).join('\n');
const hazardPart = lines.slice(15495, 16005).join('\n');
const missionHudPart = lines.slice(16016, 16103).join('\n');
const emergentRescuesPart = lines.slice(16663, 16821).join('\n');

const emergenciesFile = `// 8 Island-Wide Emergencies, Hazard Beacons & Particle Bursts
import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { createHumanNPCMesh } from './npcs.js';

export const activeParticles = [];
export const beacons = [];
export let activeHazardNodes = [];
export const emergentRescues = [];

${emergSitesPart
    .replace('const beacons = [];', '// beacons exported above')
    .replace('const activeParticles = [];', '// activeParticles exported above')
}

const fireConeGeo = new THREE.ConeGeometry(0.85, 2.8, 8);
const matFireCore = new THREE.MeshBasicMaterial({ color: 0xff5400 });
const matFireTip = new THREE.MeshBasicMaterial({ color: 0xffd60a });
const rockGeo = new THREE.DodecahedronGeometry(1.6, 0);
const matBoulder = new THREE.MeshToonMaterial({ color: 0x78716c, gradientMap: toonGrad3 });

${hazardPart
    .replace('const beacons = [];', 'beacons = [];')
    .replace('function spawnHazardNodesForSite(', 'export function spawnHazardNodesForSite(')
    .replace('function respawnSingleBeacon(', 'export function respawnSingleBeacon(')
    .replace('function buildHazardSites() {', 'export function buildHazardSites(scene) {')
    .replace('function spawnBurstParticles(', 'export function spawnBurstParticles(')
    .replace('function spawnSoapSudsParticles(', 'export function spawnSoapSudsParticles(')
    .replace('function spawnSparkleGlints(', 'export function spawnSparkleGlints(')
    .replace('function spawnRocketExhaustParticles(', 'export function spawnRocketExhaustParticles(')
    .replace('function spawnDinerFoodParticles(', 'export function spawnDinerFoodParticles(')
    .replace('function spawnEnergonLightningParticles(', 'export function spawnEnergonLightningParticles(')
    .replace('function spawnWarpVortexParticles(', 'export function spawnWarpVortexParticles(')
    .replace('function spawnWaterWakeParticles(', 'export function spawnWaterWakeParticles(')
    .replace('function spawnMagnetSparkParticles(', 'export function spawnMagnetSparkParticles(')
    .replace('function spawnPaintSplatParticles(', 'export function spawnPaintSplatParticles(')
    .replace('function spawnWaterCannonStream(', 'export function spawnWaterCannonStream(')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

${missionHudPart
    .replace('function updateMissionHUD() {', 'export function updateMissionHUD() {')
    .replace('function clearHazardNode(', 'export function clearHazardNode(')
}

${emergentRescuesPart
    .replace('const emergentRescues = [];', '// emergentRescues exported above')
    .replace('function initEmergentRescues() {', 'export function initEmergentRescues(scene) {')
    .replace('function updateEmergentRescues(', 'export function updateEmergentRescues(')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

if (typeof window !== 'undefined') {
    window.EMERGENCY_SITES = EMERGENCY_SITES;
    window.beacons = beacons;
    window.activeHazardNodes = activeHazardNodes;
    window.activeParticles = activeParticles;
    window.emergentRescues = emergentRescues;
    window.buildHazardSites = buildHazardSites;
    window.updateMissionHUD = updateMissionHUD;
    window.clearHazardNode = clearHazardNode;
    window.spawnBurstParticles = spawnBurstParticles;
    window.spawnWaterCannonStream = spawnWaterCannonStream;
}
`;
fs.writeFileSync('src/world/emergencies.js', emergenciesFile, 'utf8');
console.log('Created src/world/emergencies.js');

// 2. Collectibles (Energon Cubes, Golden Crests, Landmarks)
const energonPart = lines.slice(16106, 16310).join('\n');
const landmarksPart = lines.slice(16314, 16360).join('\n');
const crestsPart = lines.slice(16362, 16478).join('\n');

const collectiblesFile = `// Collectibles: Golden Energon Cubes, Golden Crests & Landmark Discoveries
import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import { player } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast } from '../ui/dialogs.js';
import { spawnBurstParticles } from './emergencies.js';

export const energonCubes = [];
export const goldenCrests = [];

${energonPart
    .replace('const energonCubes = [];', '// energonCubes exported above')
    .replace('function createEnergonCubeMesh() {', 'export function createEnergonCubeMesh() {')
    .replace('function buildEnergonCubes() {', 'export function buildEnergonCubes(scene) {')
    .replace('function spawnBonusEnergonCubes(', 'export function spawnBonusEnergonCubes(')
    .replace('function updateEnergonCubes(', 'export function updateEnergonCubes(')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

${landmarksPart
    .replace('const DISCOVERY_LANDMARKS = [', 'export const DISCOVERY_LANDMARKS = [')
    .replace('function updateLandmarkDiscovery(', 'export function updateLandmarkDiscovery(')
}

${crestsPart
    .replace('const goldenCrests = [];', '// goldenCrests exported above')
    .replace('function createGoldenCrestMesh() {', 'export function createGoldenCrestMesh() {')
    .replace('function initGoldenCrests() {', 'export function initGoldenCrests(scene) {')
    .replace('function updateGoldenCrests(', 'export function updateGoldenCrests(')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

if (typeof window !== 'undefined') {
    window.energonCubes = energonCubes;
    window.goldenCrests = goldenCrests;
    window.DISCOVERY_LANDMARKS = DISCOVERY_LANDMARKS;
    window.buildEnergonCubes = buildEnergonCubes;
    window.spawnBonusEnergonCubes = spawnBonusEnergonCubes;
    window.updateEnergonCubes = updateEnergonCubes;
    window.initGoldenCrests = initGoldenCrests;
    window.updateGoldenCrests = updateGoldenCrests;
    window.updateLandmarkDiscovery = updateLandmarkDiscovery;
}
`;
fs.writeFileSync('src/world/collectibles.js', collectiblesFile, 'utf8');
console.log('Created src/world/collectibles.js');

// 3. Visiting Allies
const alliesPart = lines.slice(16824, 17541).join('\n');
const alliesFile = `// Visiting Autobot Allies (Optimus Prime, Bumblebee, Blurr, Salvage, High Tide & Servo)
import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import { toonGrad3, toonGrad4, matHighTideWhite, matHighTideNavy, matHighTideGold } from '../rendering/materials.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { spawnBurstParticles } from './emergencies.js';

export let visitingAutobots = [];
export let servoPupRig = null;

${alliesPart
    .replace('const visitingAutobots = [', 'visitingAutobots = [')
    .replace('function buildServoPupModel() {', 'export function buildServoPupModel() {')
    .replace('function toggleBumblebeeMorph(', 'export function toggleBumblebeeMorph(')
    .replace('function discoverVisitingAutobot(', 'export function discoverVisitingAutobot(')
    .replace('function createHighTideShipMesh() {', 'export function createHighTideShipMesh() {')
    .replace('function initVisitingAutobots() {', 'export function initVisitingAutobots(scene) {')
    .replace('function updateVisitingAutobots(', 'export function updateVisitingAutobots(')
    .replace('function syncVisitingAutobotsVisibility() {', 'export function syncVisitingAutobotsVisibility() {')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

if (typeof window !== 'undefined') {
    window.visitingAutobots = visitingAutobots;
    window.servoPupRig = servoPupRig;
    window.initVisitingAutobots = initVisitingAutobots;
    window.updateVisitingAutobots = updateVisitingAutobots;
    window.syncVisitingAutobotsVisibility = syncVisitingAutobotsVisibility;
    window.discoverVisitingAutobot = discoverVisitingAutobot;
    window.toggleBumblebeeMorph = toggleBumblebeeMorph;
}
`;
fs.writeFileSync('src/world/allies.js', alliesFile, 'utf8');
console.log('Created src/world/allies.js');

// 4. Living World NPCs & Civilian Vehicles & Buddy Bot AI
const humanMeshPart = lines.slice(15401, 15494).join('\n');
const livingWorldPart = lines.slice(17557, 18791).join('\n');
const npcsFile = `// Living World NPC Citizens, Civilian Traffic AI & Buddy Bot AI
import * as THREE from 'three';
import { getTerrainHeight, isPointInWater } from './terrain.js';
import { toonGrad3, toonGrad4, matDarkSteel, matChrome, matTire } from '../rendering/materials.js';
import { texWindshieldCyan } from '../rendering/textures.js';
import { player, buddyBot, botRigs, humanNPCs, vehicleNPCs, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech } from '../ui/dialogs.js';
import { applyBotRigMorph, BOT_SCALES } from '../bots/botRigs.js';

${humanMeshPart.replace('function createHumanNPCMesh(cfg) {', 'export function createHumanNPCMesh(cfg) {')}

${livingWorldPart
    .replace('function setCivilianVehicleHeadlights(', 'export function setCivilianVehicleHeadlights(')
    .replace('function testOBBOverlap2D(', 'export function testOBBOverlap2D(')
    .replace('function getPlayerOBB() {', 'export function getPlayerOBB() {')
    .replace('function getCompassDirection(', 'export function getCompassDirection(')
    .replace('function getClosestDisasterReport(', 'export function getClosestDisasterReport(')
    .replace('function speakClosestDisasterForNPC(', 'export function speakClosestDisasterForNPC(')
    .replace('function createCivilianVehicleMesh(', 'export function createCivilianVehicleMesh(')
    .replace('function buildLivingWorldNPCs() {', 'export function buildLivingWorldNPCs(scene) {')
    .replace('function updateLivingWorldNPCs(', 'export function updateLivingWorldNPCs(')
    .replace('function updateBuddyBotAI(', 'export function updateBuddyBotAI(')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

if (typeof window !== 'undefined') {
    window.createHumanNPCMesh = createHumanNPCMesh;
    window.buildLivingWorldNPCs = buildLivingWorldNPCs;
    window.updateLivingWorldNPCs = updateLivingWorldNPCs;
    window.updateBuddyBotAI = updateBuddyBotAI;
    window.setCivilianVehicleHeadlights = setCivilianVehicleHeadlights;
}
`;
fs.writeFileSync('src/world/npcs.js', npcsFile, 'utf8');
console.log('Created src/world/npcs.js');

// 5. Dr. Morocco & MorBot Boss Battle
const morbotPart = lines.slice(19516, 21151).join('\n');
const morbotFile = `// Dr. Morocco Airship Lair & MorBot Boss Battle System
import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import {
    toonGrad3, toonGrad4,
    matMorBotBlack, matMorBotCrimson, matMorBotDarkCrimson, matMorBotDarkSteel, matMorBotSilver, matMorBotRedGlow, matMorBotCore,
    matMoroccoPurple, matMoroccoPurpleGlow, matMoroccoPurpleDark, matMoroccoGold, matMorBotGoldGlow, matMorBotGoldDark, matMorBotCyanVisor,
    matBlimpGreen, matBlimpGreenDark, matBlimpGondolaYellow, matBlimpGondolaWood, matBlimpWindowBlue, matBlimpCable, matMoroccoSkin, matMoroccoMustache,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech, showToast } from '../ui/dialogs.js';
import { spawnBurstParticles, spawnWaterCannonStream } from './emergencies.js';

export let activeMorBot = null;
export let morbotState = null;

${morbotPart
    .replace('const MORBOT_FLEET_CONFIGS = [', 'export const MORBOT_FLEET_CONFIGS = [')
    .replace('function buildMorBotModel(cfg = {}) {', 'export function buildMorBotModel(cfg = {}) {')
    .replace('function updateMorBotBattle(', 'export function updateMorBotBattle(')
    .replace(/scene\.add\(/g, '(typeof window !== \"undefined\" && window.scene ? window.scene.add : () => {})(')
}

if (typeof window !== 'undefined') {
    window.MORBOT_FLEET_CONFIGS = MORBOT_FLEET_CONFIGS;
    window.buildMorBotModel = buildMorBotModel;
    window.updateMorBotBattle = updateMorBotBattle;
}
`;
fs.writeFileSync('src/world/morbot.js', morbotFile, 'utf8');
console.log('Created src/world/morbot.js');

// 6. Viewport Frustum & Distance Rendering Culling
const cullingPart = lines.slice(21151, 21267).join('\n');
const cullingFile = `// Viewport Frustum & Distance Rendering Culler (10X World Optimizer)
import * as THREE from 'three';
import { player, cullableWorldObjects } from '../state/gameState.js';
import { sectorChunks } from '../world/vegetation.js';

${cullingPart.replace('function updateViewportCulling() {', 'export function updateViewportCulling() {')}

if (typeof window !== 'undefined') {
    window.updateViewportCulling = updateViewportCulling;
}
`;
fs.writeFileSync('src/game/culling.js', cullingFile, 'utf8');
console.log('Created src/game/culling.js');


import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

const trackPart = lines.slice(5272, 5462).join('\n');
const trainPart = lines.slice(18791, 19512).join('\n');

const file = `// Griffin Rock Island Railway Circuit & "The Griffin Rock Express" Train System
import * as THREE from 'three';
import { getTerrainHeight, getRailwayRadius, RAILWAY_LOOP_RADIUS } from './terrain.js';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';
import { registerCullableObject, player } from '../state/gameState.js';
import { createRoadRibbon } from './roads.js';
import { sfx } from '../audio/soundFX.js';

export let railroadCrossings = [];
export let centralStationGroup = null;
export let islandTrain = null;
export let railwayLoopMesh = null;

${trackPart
    .replace('const railroadCrossings = [];', 'railroadCrossings = [];')
    .replace('function createRailroadCrossing(', 'export function createRailroadCrossing(')
    .replace('function buildCentralRailwayStation() {', 'export function buildCentralRailwayStation() {')
}

${trainPart
    .replace('const islandTrain = {', 'islandTrain = {')
    .replace('function spawnTrainSteamPuff(', 'export function spawnTrainSteamPuff(')
    .replace('function makeTrainFlangedWheel(', 'export function makeTrainFlangedWheel(')
    .replace('function makeTrainBogie(', 'export function makeTrainBogie(')
    .replace('function buildIslandTrainSystem() {', 'export function buildIslandTrainSystem() {')
    .replace('function updateIslandTrain(', 'export function updateIslandTrain(')
}

export function initRailway(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    // Build tracks
    const ptsRail = [];
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.04) {
        const r = getRailwayRadius(a);
        ptsRail.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
    const railTex = makeProceduralRailroadTrackTexture();
    railwayLoopMesh = createRoadRibbon(ptsRail, 14.8, true, -1.25, -5.5, railTex, 8.0, 0.16);
    s.add(railwayLoopMesh);

    // 4 Grade Crossings
    railroadCrossings = [
        createRailroadCrossing(0, -RAILWAY_LOOP_RADIUS, true),
        createRailroadCrossing(0, RAILWAY_LOOP_RADIUS, true),
        createRailroadCrossing(-RAILWAY_LOOP_RADIUS, 25, false),
        createRailroadCrossing(RAILWAY_LOOP_RADIUS, 25, false)
    ];

    centralStationGroup = buildCentralRailwayStation();
    s.add(centralStationGroup);

    buildIslandTrainSystem();

    if (typeof window !== 'undefined') {
        window.railroadCrossings = railroadCrossings;
        window.centralStationGroup = centralStationGroup;
        window.islandTrain = islandTrain;
    }
}
`;

fs.writeFileSync('src/world/railway.js', file, 'utf8');
console.log('Created src/world/railway.js');

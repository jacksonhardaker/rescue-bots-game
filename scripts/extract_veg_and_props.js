import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

// 1. Vegetation
const vegPart = lines.slice(8524, 8871).join('\n');
const vegFile = `// Sector-Chunked Instanced Forests, Bushes & Rocks for Viewport Culling
import * as THREE from 'three';
import { getTerrainHeight, isPointInWater } from './terrain.js';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';

export let sectorChunks = [];

${vegPart
    .replace('const sectorChunks = [];', 'sectorChunks = [];')
    .replace(/scene\.add\(/g, 's.add(')
}

export function buildInstancedVegetation(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    // sectorChunks is populated by the code above
    if (typeof window !== 'undefined') {
        window.sectorChunks = sectorChunks;
    }
}
`;
fs.writeFileSync('src/world/vegetation.js', vegFile, 'utf8');
console.log('Created src/world/vegetation.js');

// 2. Props (Instanced Streetlamps + Interactive Road Props)
const lampPart = lines.slice(8871, 8956).join('\n');
const roadPropsPart = lines.slice(16481, 16660).join('\n');

const propsFile = `// Instanced Streetlamps & Interactive Road Breakables (Cones, Barricades)
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import { toonGrad3, matDarkSteel, matInkOutline } from '../rendering/materials.js';
import { player, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';

export const interactiveRoadProps = [];

${lampPart
    .replace('const streetlampCoords = [', 'export const streetlampCoords = [')
    .replace('function buildInstancedStreetlamps() {', 'export function buildInstancedStreetlamps(scene) {')
    .replace('scene.add(grp);', '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(grp);')
    .replace('buildInstancedStreetlamps();', '// buildInstancedStreetlamps called via initProps')
}

${roadPropsPart
    .replace('const interactiveRoadProps = [];', '// interactiveRoadProps exported above')
    .replace('function createTrafficConeMesh() {', 'export function createTrafficConeMesh() {')
    .replace('function createBarricadeMesh() {', 'export function createBarricadeMesh() {')
    .replace('function initInteractiveRoadProps() {', 'export function initInteractiveRoadProps(scene) {')
    .replace('function updateInteractiveRoadProps(dt) {', 'export function updateInteractiveRoadProps(dt) {')
    .replace(/scene\.add\(/g, '(scene || (typeof window !== \"undefined\" ? window.scene : null)).add(')
}

export function initProps(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    buildInstancedStreetlamps(s);
    initInteractiveRoadProps(s);

    if (typeof window !== 'undefined') {
        window.interactiveRoadProps = interactiveRoadProps;
    }
}
`;
fs.writeFileSync('src/world/props.js', propsFile, 'utf8');
console.log('Created src/world/props.js');

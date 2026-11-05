import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

// 1. Roads Network
// Line 4876 to 5029 is texture & intro
// Line 5039 to 5187 is createRoadRibbon and createRoadIntersectionPad
// Line 5188 to 5271 is the highway points and scene.add calls

const texPart = lines.slice(4876, 5029).join('\n');
const ribbonPart = lines.slice(5039, 5187).join('\n');
const highwaysPart = lines.slice(5188, 5272).join('\n');

const roadsFile = `// High-Fidelity 3D Vector Road Ribbon Network
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight, getInnerRoadRadius, getOuterRoadRadius } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';
import { registerCullableObject } from '../state/gameState.js';

${texPart.replace('function makeProceduralRoadTexture() {', 'export function makeProceduralRoadTexture() {')}

export let roadTexture = null;

${ribbonPart
    .replace('function createRoadRibbon(', 'export function createRoadRibbon(')
    .replace('function createRoadIntersectionPad(', 'export function createRoadIntersectionPad(')
}

export function initRoads(scene) {
    if (!roadTexture) {
        roadTexture = makeProceduralRoadTexture();
    }
    const currentScene = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!currentScene) return;

    // Use currentScene as scene inside roads construction
    const s = currentScene;

${highwaysPart.replace(/scene\.add\(/g, 's.add(')}
}
`;

fs.writeFileSync('src/world/roads.js', roadsFile, 'utf8');
console.log('Created src/world/roads.js');

import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

const buildingsPart = lines.slice(5482, 8185).join('\n');

const file = `// Griffin Rock Town Buildings, Firehouse HQ, Harbor & Interactive World Features
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import {
    toonGrad3, toonGrad4, toonGradGlossy,
    matInkOutline, matInkEdgeLine, applyCartoonInkOutlines,
    matBrickRed, matSteel, matDarkSteel, matChrome, matGlass, matHazardMat
} from '../rendering/materials.js';
import { texWindshieldCyan, texHelipad } from '../rendering/textures.js';
import { worldColliders, registerCullableObject, ramps, stateHolder } from '../state/gameState.js';

export const HQ_POS = { x: -48, z: -45 };
export const HQ_SWAP_PAD = { x: -48, z: -15, r: 12.5 };
export let hqGroup = null;
export let roboWashGroup = null;
export let launchPadGroup = null;
export let dinerGroup = null;
export let chargerStation = null;
export let groundbridgePortals = [];
export const stuntHoopRigs = [];
export let ferryController = null;

export function initBuildings(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

${buildingsPart
    .replace('const HQ_POS = { x: -48, z: -45 };', '// HQ_POS defined at module level')
    .replace('const HQ_SWAP_PAD = { x: -48, z: -15, r: 12.5 };', '// HQ_SWAP_PAD defined at module level')
    .replace('const hqGroup = new THREE.Group();', 'hqGroup = new THREE.Group();')
    .replace('const roboWashGroup = new THREE.Group();', 'roboWashGroup = new THREE.Group();')
    .replace('const launchPadGroup = new THREE.Group();', 'launchPadGroup = new THREE.Group();')
    .replace('const dinerGroup = new THREE.Group();', 'dinerGroup = new THREE.Group();')
    .replace('const chargerStation = new THREE.Group();', 'chargerStation = new THREE.Group();')
    .replace('const groundbridgePortals = [];', 'groundbridgePortals = [];')
    .replace('const stuntHoopRigs = [];', '// stuntHoopRigs exported above')
    .replace(/scene\.add\(/g, 's.add(')
}

    stateHolder.ferryController = ferryController;
    if (typeof window !== 'undefined') {
        window.HQ_POS = HQ_POS;
        window.HQ_SWAP_PAD = HQ_SWAP_PAD;
        window.hqGroup = hqGroup;
        window.roboWashGroup = roboWashGroup;
        window.launchPadGroup = launchPadGroup;
        window.dinerGroup = dinerGroup;
        window.chargerStation = chargerStation;
        window.groundbridgePortals = groundbridgePortals;
        window.stuntHoopRigs = stuntHoopRigs;
        window.ferryController = ferryController;
    }
}
`;

fs.writeFileSync('src/world/buildings.js', file, 'utf8');
console.log('Created src/world/buildings.js');

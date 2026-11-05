import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

// 1. Terrain Mesh
const terrainBlock = lines.slice(4576, 4852).join('\n');
const terrainFile = `// High-Fidelity Cartoon Terrain Canvas Texture, 3D Mesh & Ocean Water
import * as THREE from 'three';
import { getTerrainHeight, WORLD_SIZE } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';

export let terrainMesh = null;
export let waterMesh = null;
export let shorelineFoamRing = null;

${terrainBlock.replace('function createHighResTerrainTexture() {', 'export function createHighResTerrainTexture() {')}

export function buildTerrainMesh(scene) {
    const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 360, 360);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        posAttr.setY(i, getTerrainHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainTexture = createHighResTerrainTexture();
    terrainMesh = new THREE.Mesh(
        terrainGeo,
        new THREE.MeshToonMaterial({
            map: terrainTexture,
            gradientMap: toonGrad3
        })
    );
    terrainMesh.receiveShadow = true;
    if (scene) scene.add(terrainMesh);

    // Cel-Shaded Cartoon Ocean Water Plane + Animated White Foam Ripples (Scaled for 10X World)
    waterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(8200, 8200, 32, 32).rotateX(-Math.PI / 2),
        new THREE.MeshToonMaterial({
            color: 0x00b4d8,
            gradientMap: toonGrad3
        })
    );
    waterMesh.position.y = -0.45;
    if (scene) scene.add(waterMesh);

    // Cartoon Shoreline Foam Ring around Griffin Rock Island
    shorelineFoamRing = new THREE.Mesh(
        new THREE.RingGeometry(1635, 1665, 96).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    shorelineFoamRing.position.y = -0.25;
    if (scene) scene.add(shorelineFoamRing);

    if (typeof window !== 'undefined') {
        window.terrainMesh = terrainMesh;
        window.waterMesh = waterMesh;
        window.shorelineFoamRing = shorelineFoamRing;
    }

    return { terrainMesh, waterMesh, shorelineFoamRing };
}
`;
fs.writeFileSync('src/world/terrainMesh.js', terrainFile, 'utf8');
console.log('Created src/world/terrainMesh.js');

// 2. Roads Network
const roadsBlock = lines.slice(4876, 5272).join('\n');
const roadsFile = `// High-Fidelity 3D Vector Road Ribbon Network
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight, getInnerRoadRadius, getOuterRoadRadius } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';

export let roadMeshes = [];

${roadsBlock
    .replace('function makeProceduralRoadTexture() {', 'export function makeProceduralRoadTexture() {')
    .replace('function createRoadRibbon(', 'export function createRoadRibbon(')
    .replace('function createRoadIntersectionPad(', 'export function createRoadIntersectionPad(')
}

export function buildRoadNetwork(scene) {
    // Roads are already instantiated or added when the top-level block runs
    // If scene is passed and ribbons were created, ensure they are in scene
    if (scene) {
        // If ribbons aren't already attached, add them
        if (typeof roadRibbonGroup !== 'undefined' && roadRibbonGroup) {
            scene.add(roadRibbonGroup);
        }
    }
}
`;


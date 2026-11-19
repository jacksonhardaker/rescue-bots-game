// Sector-Chunked Instanced Forests, Bushes & Rocks for Viewport Culling
import * as THREE from 'three';
import { getTerrainHeight, isPointInWater, getRailwayRadius, isPointOnRoad } from './terrain.js';
import { toonGrad3, toonGrad4, matInkOutline } from '../rendering/materials.js';
import { registerCullableObject, worldColliders, worldState } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { showToast } from '../ui/dialogs.js';
import { progression, saveProgression } from '../progression/progression.js';
import { spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';

export let sectorChunks: any[] = [];

export interface TreeInstance {
    id: number;
    x: number;
    y: number;
    z: number;
    s: number;
    baseScale: number;
    growthFactor: number;
    rot: number;
    color: number;
    archIdx: number;
    instanceIdx: number;
    bucket: any;
    destroyed: boolean;
    collider: any;
}

export interface RockInstance {
    id: number;
    x: number;
    y: number;
    z: number;
    s: number;
    baseScale: number;
    r1: number;
    r2: number;
    color: number;
    instanceIdx: number;
    bucket: any;
    destroyed: boolean;
    collider: any;
}

export interface BushInstance {
    id: number;
    x: number;
    y: number;
    z: number;
    s: number;
    baseScale: number;
    growthFactor: number;
    rot: number;
    color: number;
    instanceIdx: number;
    bucket: any;
    destroyed: boolean;
    collider: any;
}

export const allTrees: TreeInstance[] = [];
export const allRocks: RockInstance[] = [];
export const allBushes: BushInstance[] = [];

const FOLIAGE_CELL_SIZE = 64;
const treeGrid = new Map<number, TreeInstance[]>();
const bushGrid = new Map<number, BushInstance[]>();
const rockGrid = new Map<number, RockInstance[]>();
const _nearbyTrees: TreeInstance[] = [];
const _nearbyBushes: BushInstance[] = [];
const _nearbyRocks: RockInstance[] = [];

function _foliageCellKey(cx: number, cz: number): number {
    return (((cx + 512) & 0xfff) << 12) | ((cz + 512) & 0xfff);
}

function insertFoliageGrid<T extends { x: number; z: number }>(grid: Map<number, T[]>, item: T) {
    const cx = Math.floor(item.x / FOLIAGE_CELL_SIZE);
    const cz = Math.floor(item.z / FOLIAGE_CELL_SIZE);
    const key = _foliageCellKey(cx, cz);
    let bucket = grid.get(key);
    if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
    }
    bucket.push(item);
}

function queryFoliageGrid<T>(grid: Map<number, T[]>, x: number, z: number, radius: number, outList: T[]): T[] {
    outList.length = 0;
    const minCx = Math.floor((x - radius) / FOLIAGE_CELL_SIZE);
    const maxCx = Math.floor((x + radius) / FOLIAGE_CELL_SIZE);
    const minCz = Math.floor((z - radius) / FOLIAGE_CELL_SIZE);
    const maxCz = Math.floor((z + radius) / FOLIAGE_CELL_SIZE);
    for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
            const bucket = grid.get(_foliageCellKey(cx, cz));
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
                outList.push(bucket[i]);
            }
        }
    }
    return outList;
}

const dummy = new THREE.Object3D();
const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
let lastColossalToastTime = 0;

        // =====================================================================
        // 5C. SECTOR-CHUNKED INSTANCED FORESTS, BUSHES & ROCKS FOR VIEWPORT CULLING
        //     (16 Spatial Sector Chunks across the 4x4 Island Grid -> Culled when off-screen!)
        // =====================================================================
        // =====================================================================
        // 5C. SECTOR-CHUNKED INSTANCED FORESTS, BUSHES & ROCKS FOR VIEWPORT CULLING
        //     (5 Diverse Tree Archetypes across 16 Spatial Sector Chunks with Biome Color Palettes)
        // =====================================================================
        const matTrunkPine = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });
        const matTrunkFir = new THREE.MeshToonMaterial({ color: 0x5c2410, gradientMap: toonGrad3 });
        const matTrunkOak = new THREE.MeshToonMaterial({ color: 0x451a03, gradientMap: toonGrad3 });
        const matTrunkBirch = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 });
        const matTrunkCoastal = new THREE.MeshToonMaterial({ color: 0x9a3412, gradientMap: toonGrad3 });

        // Base Foliage Toon Material (white base color allows instanced setColorAt to tint smoothly)
        const matTreeLeavesBase = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
        const matBushToon = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
        const matRockToon = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });

        const bushGeo = new THREE.DodecahedronGeometry(1.35, 0);
        const envRockGeo = new THREE.DodecahedronGeometry(1.85, 0);

        const TREE_ARCHETYPES = [
            // 0: Classic Island Spire Pine (Sharp tall conical evergreen)
            {
                name: "SPIRE_PINE",
                trunkGeo: new THREE.CylinderGeometry(0.52, 0.82, 4.4, 6),
                trunkMat: matTrunkPine,
                leavesGeo: new THREE.ConeGeometry(3.2, 10.2, 7),
                trunkY: 2.2,
                leavesY: 7.2,
                leavesScale: [1.0, 1.0, 1.0],
                outlineScale: [1.07, 1.05, 1.07],
                colors: [0x15803d, 0x166534, 0x14532d, 0x16a34a, 0x1b4332, 0x1e3a1e]
            },
            // 1: Broad Alpine Mountain Fir (Wide pyramidal mountain fir)
            {
                name: "ALPINE_FIR",
                trunkGeo: new THREE.CylinderGeometry(0.65, 0.95, 3.8, 6),
                trunkMat: matTrunkFir,
                leavesGeo: new THREE.ConeGeometry(4.6, 7.6, 7),
                trunkY: 1.9,
                leavesY: 5.6,
                leavesScale: [1.0, 1.0, 1.0],
                outlineScale: [1.07, 1.05, 1.07],
                colors: [0x0f766e, 0x047857, 0x065f46, 0x115e59, 0x166534, 0x2d6a4f]
            },
            // 2: Griffin Town Deciduous Oak (Round, fluffy, faceted low-poly crown)
            {
                name: "TOWN_OAK",
                trunkGeo: new THREE.CylinderGeometry(0.75, 1.15, 4.0, 6),
                trunkMat: matTrunkOak,
                leavesGeo: new THREE.DodecahedronGeometry(3.7, 1),
                trunkY: 2.0,
                leavesY: 5.8,
                leavesScale: [1.28, 0.95, 1.18],
                outlineScale: [1.08, 1.08, 1.08],
                colors: [0x22c55e, 0x16a34a, 0x4ade80, 0x65a30d, 0x84cc16, 0x4d7c0f]
            },
            // 3: Golden Mountain Birch / Aspen (Slender pale white trunk with radiant gold/amber crown)
            {
                name: "GOLDEN_BIRCH",
                trunkGeo: new THREE.CylinderGeometry(0.36, 0.52, 5.6, 6),
                trunkMat: matTrunkBirch,
                leavesGeo: new THREE.DodecahedronGeometry(3.0, 1),
                trunkY: 2.8,
                leavesY: 7.6,
                leavesScale: [0.88, 1.42, 0.88],
                outlineScale: [1.08, 1.06, 1.08],
                colors: [0xf59e0b, 0xeab308, 0xfacc15, 0xd97706, 0xb45309, 0xa3e635]
            },
            // 4: Coastal Island Umbrella Pine (Flared broad umbrella top, coastal harbor feel)
            {
                name: "COASTAL_UMBRELLA",
                trunkGeo: new THREE.CylinderGeometry(0.48, 0.78, 5.4, 6),
                trunkMat: matTrunkCoastal,
                leavesGeo: new THREE.ConeGeometry(5.2, 4.4, 8),
                trunkY: 2.7,
                leavesY: 6.8,
                leavesScale: [1.08, 0.92, 1.08],
                outlineScale: [1.07, 1.06, 1.07],
                colors: [0x0d9488, 0x10b981, 0x059669, 0x14b8a6, 0x34d399, 0x047857]
            }
        ];

        const SECTOR_GRID = 4;
        const SECTOR_SPAN = 3400; // Covers -1700 .. +1700 island landmass
        const SECTOR_STEP = SECTOR_SPAN / SECTOR_GRID;
        const sectorBuckets = Array.from({ length: SECTOR_GRID * SECTOR_GRID }, (_, idx) => {
            const gx = idx % SECTOR_GRID;
            const gz = Math.floor(idx / SECTOR_GRID);
            const cx = -SECTOR_SPAN / 2 + (gx + 0.5) * SECTOR_STEP;
            const cz = -SECTOR_SPAN / 2 + (gz + 0.5) * SECTOR_STEP;
            return {
                cx,
                cz,
                treeTypes: Array.from({ length: TREE_ARCHETYPES.length }, () => []),
                bushes: [],
                rocks: [],
                treeMeshes: [] as any[],
                bushMeshes: null as any,
                rockMeshes: null as any
            };
        });

        function getSectorBucket(x, z) {
            const gx = Math.max(0, Math.min(SECTOR_GRID - 1, Math.floor((x + SECTOR_SPAN / 2) / SECTOR_STEP)));
            const gz = Math.max(0, Math.min(SECTOR_GRID - 1, Math.floor((z + SECTOR_SPAN / 2) / SECTOR_STEP)));
            return sectorBuckets[gz * SECTOR_GRID + gx];
        }

        function isInsideAnyPlaza(x, z) {
            if (Math.hypot(x, z - 20) < 165) return true; // Central Town Plaza
            if (Math.hypot(x, z - 1140) < 145) return true; // South Harbor
            if (Math.hypot(x + 1120, z - 25) < 125) return true; // West Tech
            if (Math.hypot(x, z + 1120) < 125) return true; // North Observatory
            if (Math.hypot(x + 1250, z - 65) < 75) return true; // Testing Yard Proving Grounds
            if (Math.hypot(x + 110, z - 1150) < 65) return true; // Harbor Crane Yard
            if (Math.hypot(x + 750, z + 750) < 125) return true; // Dino Ridge Sanctuary
            if (Math.hypot(x + 750, z - 750) < 125) return true; // Sunny Sands Boardwalk
            if (Math.hypot(x - 1960, z - 540) < 120) return true; // Wayward Ruins Plateau
            if (Math.hypot(x - 1320, z - 60) < 55) return true; // East Lighthouse Lookout Terrace
            if (x >= 1450 && x <= 1780 && Math.abs(z - 540) < 32) return true; // Wayward Causeway Bridge Corridor
            // Dr. Morocco Cliffside Lair Access Road & Plaza (X: -820 .. -619.3, Z: -1180 .. -1083.8)
            const mLenSq = 200.7 * 200.7 + 96.2 * 96.2;
            const mRoadT = Math.max(0, Math.min(1, ((x - (-619.3)) * (-200.7) + (z - (-1083.8)) * (-96.2)) / mLenSq));
            if (Math.hypot(x - (-619.3 + mRoadT * (-200.7)), z - (-1083.8 + mRoadT * (-96.2))) < 14.0) return true;
            if (Math.hypot(x + 820, z + 1180) < 55) return true;
            // Clear trees from Griffin Rock Railway Corridor & Central Station Platform
            const rTree = Math.hypot(x, z);
            const thetaTree = Math.atan2(z, x);
            if (Math.abs(rTree - getRailwayRadius(thetaTree)) < 14.0) return true;
            if (Math.hypot(x - 765, z - 75) < 35) return true; // Central Station Depot
            // Dedicated GroundBridge turnout staging bays
            if (Math.hypot(x - (-1085), z - 62) < 24) return true;
            if (Math.hypot(x - 48, z - 1040) < 24) return true;
            if (Math.hypot(x - (-750), z - (-665)) < 24) return true;
            if (Math.hypot(x - 1895, z - 492) < 24) return true;

            // Clear all Paved Intersection Aprons & Traffic Circles from trees and rocks
            if (Math.hypot(x, z - 25) < 24.0) return true; // Central Griffin Plaza (NS x EW)
            if (Math.hypot(x - (-48), z - (-15)) < 24.0) return true; // Rescue Bots HQ Forecourt Apron
            if (Math.hypot(x, z - (-1120)) < 22.0) return true; // North Outer Junction
            if (Math.hypot(x, z - 1120) < 22.0) return true; // South Outer Junction
            if (Math.hypot(x, z - (-380)) < 22.0) return true; // North Inner Junction
            if (Math.hypot(x, z - 380) < 22.0) return true; // South Inner Junction
            if (Math.hypot(x - (-1060.8), z - 25) < 22.0) return true; // West Outer Junction
            if (Math.hypot(x - 1178.2, z - 25) < 22.0) return true; // East Outer Junction
            if (Math.hypot(x - (-355.1), z - 25) < 22.0) return true; // West Inner Junction
            if (Math.hypot(x - 402.8, z - 25) < 22.0) return true; // East Inner Junction
            if (Math.hypot(x - 1068.9, z - 540) < 22.0) return true; // Causeway Junction
            if (Math.hypot(x - 1181.5, z - 60) < 20.0) return true; // Lighthouse Junction

            return false;
        }

        const totalTrees = 1800;
        for (let attempt = 0, placed = 0; attempt < 7500 && placed < totalTrees; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 135 + Math.pow(Math.random(), 0.85) * 1450;
            const tx = Math.cos(angle) * dist;
            const tz = Math.sin(angle) * dist;
            const ty = getTerrainHeight(tx, tz);
            if (ty < 3.0 || ty > 42) continue;
            if (isPointOnRoad(tx, tz) || isInsideAnyPlaza(tx, tz)) continue;
            const scale = 0.82 + Math.random() * 0.96;

            // Biome & elevation-aware tree archetype distribution
            let typeIdx = 0;
            const rnd = Math.random();

            if (tz > 680) {
                // South Harbor & Coastal Cliffs: Coastal Umbrella Pines & Emerald Spire Firs
                if (rnd < 0.45) typeIdx = 4; // COASTAL_UMBRELLA
                else if (rnd < 0.75) typeIdx = 0; // SPIRE_PINE
                else typeIdx = 1; // ALPINE_FIR
            } else if (ty > 24 || Math.hypot(tx + 735, tz + 755) < 320 || tz < -750) {
                // Mountain Peaks, Volcano Ridge & High Ridges: Radiant Golden Birches/Aspens & Alpine Firs
                if (rnd < 0.50) typeIdx = 3; // GOLDEN_BIRCH
                else if (rnd < 0.85) typeIdx = 1; // ALPINE_FIR
                else typeIdx = 0; // SPIRE_PINE
            } else if (Math.hypot(tx, tz - 25) < 360) {
                // Town Center / Valleys: Lush Griffin Town Oaks & Mixed Woods
                if (rnd < 0.50) typeIdx = 2; // TOWN_OAK
                else if (rnd < 0.75) typeIdx = 0; // SPIRE_PINE
                else if (rnd < 0.90) typeIdx = 3; // GOLDEN_BIRCH
                else typeIdx = 1; // ALPINE_FIR
            } else {
                // General Island Forests: Balanced diverse mix of all 5 archetypes!
                if (rnd < 0.30) typeIdx = 0; // SPIRE_PINE
                else if (rnd < 0.52) typeIdx = 1; // ALPINE_FIR
                else if (rnd < 0.74) typeIdx = 2; // TOWN_OAK
                else if (rnd < 0.88) typeIdx = 3; // GOLDEN_BIRCH
                else typeIdx = 4; // COASTAL_UMBRELLA
            }

            const arch = TREE_ARCHETYPES[typeIdx];
            const colorHex = arch.colors[Math.floor(Math.random() * arch.colors.length)];

            const treeObj: TreeInstance = {
                id: placed,
                x: tx,
                y: ty,
                z: tz,
                s: scale,
                baseScale: scale,
                growthFactor: 1.0,
                rot: Math.random() * Math.PI * 2,
                color: colorHex,
                archIdx: typeIdx,
                instanceIdx: -1,
                bucket: null,
                destroyed: false,
                collider: null
            };

            getSectorBucket(tx, tz).treeTypes[typeIdx].push(treeObj);
            allTrees.push(treeObj);
            insertFoliageGrid(treeGrid, treeObj);

            const treeCollider = {
                x: tx,
                z: tz,
                r: 1.4 * scale,
                type: 'TREE',
                target: treeObj,
                destroyed: false
            };
            treeObj.collider = treeCollider;
            worldColliders.push(treeCollider);
            placed++;
        }

        const bushColors = [0x22c55e, 0x16a34a, 0x4ade80, 0x84cc16, 0x65a30d];
        const totalBushes = 1100;
        for (let attempt = 0, placed = 0; attempt < 4500 && placed < totalBushes; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 115 + Math.pow(Math.random(), 0.85) * 1480;
            const bx = Math.cos(angle) * dist;
            const bz = Math.sin(angle) * dist;
            const by = getTerrainHeight(bx, bz);
            if (by < 2.6 || by > 36) continue;
            if (isPointOnRoad(bx, bz) || isInsideAnyPlaza(bx, bz)) continue;
            const s = 0.65 + Math.random() * 0.95;
            const bColor = bushColors[Math.floor(Math.random() * bushColors.length)];

            const bushObj: BushInstance = {
                id: placed,
                x: bx,
                y: by,
                z: bz,
                s,
                baseScale: s,
                growthFactor: 1.0,
                rot: Math.random() * Math.PI,
                color: bColor,
                instanceIdx: -1,
                bucket: null,
                destroyed: false,
                collider: null
            };

            getSectorBucket(bx, bz).bushes.push(bushObj);
            allBushes.push(bushObj);
            insertFoliageGrid(bushGrid, bushObj);

            // Bush collision detection: solid obstacle in worldColliders so bots cannot drive through bushes!
            const bushCollider = {
                x: bx,
                z: bz,
                r: 1.35 * 1.2 * s * 0.75, // Scaled bush collision radius (~1.2m for s=1.0)
                type: 'BUSH',
                target: bushObj,
                destroyed: false
            };
            bushObj.collider = bushCollider;
            worldColliders.push(bushCollider);
            placed++;
        }

        const rockColors = [0x64748b, 0x475569, 0x78716c, 0x94a3b8, 0x57534e];
        const totalRocks = 520;
        for (let attempt = 0, placed = 0; attempt < 2400 && placed < totalRocks; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 135 + Math.pow(Math.random(), 0.85) * 1500;
            const rx = Math.cos(angle) * dist;
            const rz = Math.sin(angle) * dist;
            const ry = getTerrainHeight(rx, rz);
            if (ry < 0.8 || isPointOnRoad(rx, rz) || isInsideAnyPlaza(rx, rz)) continue;
            const s = 0.65 + Math.random() * 1.45;
            const rColor = rockColors[Math.floor(Math.random() * rockColors.length)];

            const rockObj: RockInstance = {
                id: placed,
                x: rx,
                y: ry,
                z: rz,
                s,
                baseScale: s,
                r1: attempt * 0.3,
                r2: attempt * 0.7,
                color: rColor,
                instanceIdx: -1,
                bucket: null,
                destroyed: false,
                collider: null
            };

            getSectorBucket(rx, rz).rocks.push(rockObj);
            allRocks.push(rockObj);
            insertFoliageGrid(rockGrid, rockObj);

            // Rock collision detection: solid obstacle in worldColliders so bots cannot drive through rocks!
            const rockCollider = {
                x: rx,
                z: rz,
                r: 1.85 * 1.35 * s * 0.75, // Scaled rock collision radius (~1.9m for s=1.0)
                type: 'ROCK',
                target: rockObj,
                destroyed: false
            };
            rockObj.collider = rockCollider;
            worldColliders.push(rockCollider);
            placed++;
        }

export function buildInstancedVegetation(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    const tmpColor = new THREE.Color();

    sectorBuckets.forEach(bucket => {
        const sectorGroup = new THREE.Group();

        TREE_ARCHETYPES.forEach((arch, archIdx) => {
            const list = bucket.treeTypes[archIdx];
            if (!list || list.length === 0) return;
            const n = list.length;

            const iTrunks = new THREE.InstancedMesh(arch.trunkGeo, arch.trunkMat, n);
            const iLeaves = new THREE.InstancedMesh(arch.leavesGeo, matTreeLeavesBase, n);
            const iOutline = new THREE.InstancedMesh(arch.leavesGeo, matInkOutline, n);
            iTrunks.castShadow = true;
            iLeaves.castShadow = true;
            bucket.treeMeshes[archIdx] = { iTrunks, iLeaves, iOutline };

            for (let i = 0; i < n; i++) {
                const t = list[i];
                t.instanceIdx = i;
                t.bucket = bucket;

                // Trunk transform
                dummy.position.set(t.x, t.y + arch.trunkY * t.s, t.z);
                dummy.scale.set(t.s, t.s, t.s);
                dummy.rotation.set(0, t.rot, 0);
                dummy.updateMatrix();
                iTrunks.setMatrixAt(i, dummy.matrix);

                // Leaves transform
                dummy.position.set(t.x, t.y + arch.leavesY * t.s, t.z);
                dummy.scale.set(t.s * arch.leavesScale[0], t.s * arch.leavesScale[1], t.s * arch.leavesScale[2]);
                dummy.rotation.set(0, t.rot, 0);
                dummy.updateMatrix();
                iLeaves.setMatrixAt(i, dummy.matrix);

                // Cartoon ink outline transform
                dummy.scale.set(
                    t.s * arch.leavesScale[0] * arch.outlineScale[0],
                    t.s * arch.leavesScale[1] * arch.outlineScale[1],
                    t.s * arch.leavesScale[2] * arch.outlineScale[2]
                );
                dummy.updateMatrix();
                iOutline.setMatrixAt(i, dummy.matrix);

                // Leaves instance color
                tmpColor.setHex(t.color);
                iLeaves.setColorAt(i, tmpColor);
            }

            if (iLeaves.instanceColor) iLeaves.instanceColor.needsUpdate = true;
            sectorGroup.add(iTrunks, iLeaves, iOutline);
        });

        if (bucket.bushes.length > 0) {
            const n = bucket.bushes.length;
            const iBushes = new THREE.InstancedMesh(bushGeo, matBushToon, n);
            const iBushOut = new THREE.InstancedMesh(bushGeo, matInkOutline, n);
            iBushes.castShadow = true;
            iBushes.receiveShadow = true;
            bucket.bushMeshes = { iBushes, iBushOut };

            for (let i = 0; i < n; i++) {
                const b = bucket.bushes[i];
                b.instanceIdx = i;
                b.bucket = bucket;

                dummy.position.set(b.x, b.y + 0.55 * b.s, b.z);
                dummy.scale.set(b.s * 1.25, b.s * 0.78, b.s * 1.15);
                dummy.rotation.set(0, b.rot, 0);
                dummy.updateMatrix();
                iBushes.setMatrixAt(i, dummy.matrix);

                dummy.scale.set(b.s * 1.25 * 1.09, b.s * 0.78 * 1.09, b.s * 1.15 * 1.09);
                dummy.updateMatrix();
                iBushOut.setMatrixAt(i, dummy.matrix);

                tmpColor.setHex(b.color);
                iBushes.setColorAt(i, tmpColor);
            }
            if (iBushes.instanceColor) iBushes.instanceColor.needsUpdate = true;
            sectorGroup.add(iBushes, iBushOut);
        }

        if (bucket.rocks.length > 0) {
            const n = bucket.rocks.length;
            const iRocks = new THREE.InstancedMesh(envRockGeo, matRockToon, n);
            const iRockOut = new THREE.InstancedMesh(envRockGeo, matInkOutline, n);
            iRocks.castShadow = true;
            iRocks.receiveShadow = true;
            bucket.rockMeshes = { iRocks, iRockOut };

            for (let i = 0; i < n; i++) {
                const r = bucket.rocks[i];
                r.instanceIdx = i;
                r.bucket = bucket;

                // Position rocks to sit firmly on the terrain and cast prominent 3D shadows
                dummy.position.set(r.x, r.y + 0.92 * r.s, r.z);
                dummy.scale.set(r.s * 1.35, r.s * 1.15, r.s * 1.25);
                dummy.rotation.set(r.r1, r.r2, 0);
                dummy.updateMatrix();
                iRocks.setMatrixAt(i, dummy.matrix);

                dummy.scale.set(r.s * 1.35 * 1.08, r.s * 1.15 * 1.08, r.s * 1.25 * 1.08);
                dummy.updateMatrix();
                iRockOut.setMatrixAt(i, dummy.matrix);

                tmpColor.setHex(r.color);
                iRocks.setColorAt(i, tmpColor);
            }
            if (iRocks.instanceColor) iRocks.instanceColor.needsUpdate = true;
            sectorGroup.add(iRocks, iRockOut);
        }

        s.add(sectorGroup);
        registerCullableObject(sectorGroup, bucket.cx, 12, bucket.cz, SECTOR_STEP * 0.78);
    });

    sectorChunks = sectorBuckets;
    if (typeof window !== 'undefined') {
        window.sectorChunks = sectorChunks;
        (window as any).allTrees = allTrees;
        (window as any).allRocks = allRocks;
        (window as any).allBushes = allBushes;
    }
}

// ---------------------------------------------------------------------
// Interactivity: Boulder Scoop Demolition & Heatwave Tree/Bush Growth
// ---------------------------------------------------------------------

export function explodeRock(rock: RockInstance) {
    if (!rock || rock.destroyed) return;
    rock.destroyed = true;
    if (rock.collider) {
        rock.collider.destroyed = true;
        rock.collider.r = 0;
    }

    if (rock.bucket && rock.bucket.rockMeshes) {
        const { iRocks, iRockOut } = rock.bucket.rockMeshes;
        iRocks.setMatrixAt(rock.instanceIdx, zeroMatrix);
        iRockOut.setMatrixAt(rock.instanceIdx, zeroMatrix);
        iRocks.instanceMatrix.needsUpdate = true;
        iRockOut.instanceMatrix.needsUpdate = true;
    }

    sfx.playRockBreak();
    sfx.playSmash();
    spawnBurstParticles(rock.x, rock.y + 0.9 * rock.s, rock.z, rock.color || 0x64748b, 22, 2.2);
    spawnBurstParticles(rock.x, rock.y + 1.4 * rock.s, rock.z, 0x94a3b8, 16, 2.4);
    spawnBurstParticles(rock.x, rock.y + 0.6 * rock.s, rock.z, 0xfacc15, 14, 1.8);

    progression.heroPoints = (progression.heroPoints || 0) + 5;
    saveProgression();

    showToast("BOULDER DOZER SMASH", "Rock Demolished! +5 Hero Pts");
    sfx.playDiscoveryChime();
}

export function explodeTree(tree: TreeInstance) {
    if (!tree || tree.destroyed) return;
    tree.destroyed = true;
    if (tree.collider) {
        tree.collider.destroyed = true;
        tree.collider.r = 0;
    }

    if (tree.bucket && tree.bucket.treeMeshes && tree.bucket.treeMeshes[tree.archIdx]) {
        const { iTrunks, iLeaves, iOutline } = tree.bucket.treeMeshes[tree.archIdx];
        iTrunks.setMatrixAt(tree.instanceIdx, zeroMatrix);
        iLeaves.setMatrixAt(tree.instanceIdx, zeroMatrix);
        iOutline.setMatrixAt(tree.instanceIdx, zeroMatrix);
        iTrunks.instanceMatrix.needsUpdate = true;
        iLeaves.instanceMatrix.needsUpdate = true;
        iOutline.instanceMatrix.needsUpdate = true;
    }

    const arch = TREE_ARCHETYPES[tree.archIdx];
    sfx.playRockBreak();
    sfx.playSmash();
    // Wood splinters + foliage burst!
    spawnBurstParticles(tree.x, tree.y + arch.trunkY * tree.s, tree.z, 0x78350f, 24, 2.2);
    spawnBurstParticles(tree.x, tree.y + arch.leavesY * tree.s, tree.z, tree.color || 0x22c55e, 28, 2.5);
    spawnBurstParticles(tree.x, tree.y + 1.2, tree.z, 0xfacc15, 14, 1.8);

    progression.heroPoints = (progression.heroPoints || 0) + 5;
    saveProgression();

    showToast("TIMBERRRR", "Tree Cleared by Dozer Scoop! +5 Hero Pts");
    sfx.playDiscoveryChime();
}

export function explodeBush(bush: BushInstance) {
    if (!bush || bush.destroyed) return;
    bush.destroyed = true;
    if (bush.collider) {
        bush.collider.destroyed = true;
        bush.collider.r = 0;
    }

    if (bush.bucket && bush.bucket.bushMeshes) {
        const { iBushes, iBushOut } = bush.bucket.bushMeshes;
        iBushes.setMatrixAt(bush.instanceIdx, zeroMatrix);
        iBushOut.setMatrixAt(bush.instanceIdx, zeroMatrix);
        iBushes.instanceMatrix.needsUpdate = true;
        iBushOut.instanceMatrix.needsUpdate = true;
    }

    sfx.playRockBreak();
    sfx.playSmash();
    spawnBurstParticles(bush.x, bush.y + 0.55 * bush.s, bush.z, bush.color || 0x22c55e, 22, 1.8);
    spawnBurstParticles(bush.x, bush.y + 0.8 * bush.s, bush.z, 0x84cc16, 16, 1.6);
    spawnBurstParticles(bush.x, bush.y + 0.3 * bush.s, bush.z, 0xfacc15, 12, 1.4);

    progression.heroPoints = (progression.heroPoints || 0) + 5;
    saveProgression();

    showToast("DOZER SCOOP SMASH", "Bush Cleared by Boulder! +5 Hero Pts");
    sfx.playDiscoveryChime();
}

export function waterTree(tree: TreeInstance, growthDelta: number) {
    if (!tree || tree.destroyed || tree.growthFactor >= 5.0) return false;

    const prevFactor = tree.growthFactor;
    tree.growthFactor = Math.min(5.0, tree.growthFactor + growthDelta);
    const currentScale = tree.baseScale * tree.growthFactor;
    tree.s = currentScale;

    // Update collider radius so tree trunk becomes wider as it grows
    if (tree.collider) {
        tree.collider.r = 1.4 * currentScale;
    }

    // Update instance transforms
    if (tree.bucket && tree.bucket.treeMeshes && tree.bucket.treeMeshes[tree.archIdx]) {
        const arch = TREE_ARCHETYPES[tree.archIdx];
        const { iTrunks, iLeaves, iOutline } = tree.bucket.treeMeshes[tree.archIdx];

        // Trunk
        dummy.position.set(tree.x, tree.y + arch.trunkY * currentScale, tree.z);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.rotation.set(0, tree.rot, 0);
        dummy.updateMatrix();
        iTrunks.setMatrixAt(tree.instanceIdx, dummy.matrix);

        // Leaves
        dummy.position.set(tree.x, tree.y + arch.leavesY * currentScale, tree.z);
        dummy.scale.set(currentScale * arch.leavesScale[0], currentScale * arch.leavesScale[1], currentScale * arch.leavesScale[2]);
        dummy.rotation.set(0, tree.rot, 0);
        dummy.updateMatrix();
        iLeaves.setMatrixAt(tree.instanceIdx, dummy.matrix);

        // Outline
        dummy.scale.set(
            currentScale * arch.leavesScale[0] * arch.outlineScale[0],
            currentScale * arch.leavesScale[1] * arch.outlineScale[1],
            currentScale * arch.leavesScale[2] * arch.outlineScale[2]
        );
        dummy.updateMatrix();
        iOutline.setMatrixAt(tree.instanceIdx, dummy.matrix);

        iTrunks.instanceMatrix.needsUpdate = true;
        iLeaves.instanceMatrix.needsUpdate = true;
        iOutline.instanceMatrix.needsUpdate = true;
    }

    // Gentle growth particles
    if (Math.random() < 0.35) {
        spawnSparkleGlints(tree.x, tree.y + TREE_ARCHETYPES[tree.archIdx].leavesY * currentScale, tree.z, 6);
        spawnBurstParticles(tree.x, tree.y + TREE_ARCHETYPES[tree.archIdx].trunkY * currentScale, tree.z, 0x4ade80, 5, 0.8);
    }

    // Reached max size (5x)
    if (prevFactor < 5.0 && tree.growthFactor >= 5.0) {
        const arch = TREE_ARCHETYPES[tree.archIdx];
        spawnSparkleGlints(tree.x, tree.y + arch.leavesY * currentScale, tree.z, 24);
        spawnBurstParticles(tree.x, tree.y + arch.leavesY * currentScale, tree.z, 0x22c55e, 26, 1.8);
        sfx.playDiscoveryChime();

        const now = performance.now();
        if (now - lastColossalToastTime > 6000) {
            lastColossalToastTime = now;
            showToast("COLOSSAL REDWOOD", "Tree watered to 5x maximum size! +10 Hero Pts");
        }
        progression.heroPoints = (progression.heroPoints || 0) + 10;
        saveProgression();
    }

    return true;
}

export function waterBush(bush: BushInstance, growthDelta: number) {
    if (!bush || bush.destroyed || bush.growthFactor >= 5.0) return false;

    const prevFactor = bush.growthFactor;
    bush.growthFactor = Math.min(5.0, bush.growthFactor + growthDelta);
    const currentScale = bush.baseScale * bush.growthFactor;
    bush.s = currentScale;

    // Update collider radius so bush becomes wider as it grows
    if (bush.collider) {
        bush.collider.r = 1.35 * 1.2 * currentScale * 0.75;
    }

    // Update instance transforms
    if (bush.bucket && bush.bucket.bushMeshes) {
        const { iBushes, iBushOut } = bush.bucket.bushMeshes;

        dummy.position.set(bush.x, bush.y + 0.55 * currentScale, bush.z);
        dummy.scale.set(currentScale * 1.25, currentScale * 0.78, currentScale * 1.15);
        dummy.rotation.set(0, bush.rot, 0);
        dummy.updateMatrix();
        iBushes.setMatrixAt(bush.instanceIdx, dummy.matrix);

        dummy.scale.set(currentScale * 1.25 * 1.09, currentScale * 0.78 * 1.09, currentScale * 1.15 * 1.09);
        dummy.updateMatrix();
        iBushOut.setMatrixAt(bush.instanceIdx, dummy.matrix);

        iBushes.instanceMatrix.needsUpdate = true;
        iBushOut.instanceMatrix.needsUpdate = true;
    }

    // Gentle growth particles
    if (Math.random() < 0.35) {
        spawnSparkleGlints(bush.x, bush.y + 0.8 * currentScale, bush.z, 6);
        spawnBurstParticles(bush.x, bush.y + 0.5 * currentScale, bush.z, 0x4ade80, 5, 0.8);
    }

    // Reached max size (5x)
    if (prevFactor < 5.0 && bush.growthFactor >= 5.0) {
        spawnSparkleGlints(bush.x, bush.y + 1.2 * currentScale, bush.z, 24);
        spawnBurstParticles(bush.x, bush.y + 0.9 * currentScale, bush.z, 0x22c55e, 26, 1.8);
        sfx.playDiscoveryChime();

        const now = performance.now();
        if (now - lastColossalToastTime > 6000) {
            lastColossalToastTime = now;
            showToast("COLOSSAL BUSH", "Bush watered to 5x maximum size! +10 Hero Pts");
        }
        progression.heroPoints = (progression.heroPoints || 0) + 10;
        saveProgression();
    }

    return true;
}

export function checkBoulderScoopAttack(x: number, y: number, z: number, heading: number, radius = 7.5) {
    if (worldState.activeArea === 'UNDERGROUND') return;
    const frontX = x + Math.sin(heading) * 4.5;
    const frontZ = z + Math.cos(heading) * 4.5;
    const queryRadius = radius + 16;

    // Check nearby rocks
    const nearbyRocks = queryFoliageGrid(rockGrid, x, z, queryRadius, _nearbyRocks);
    for (let i = 0; i < nearbyRocks.length; i++) {
        const r = nearbyRocks[i];
        if (r.destroyed) continue;
        const rockRadius = 1.85 * 1.35 * r.s * 0.85;
        const dfx = frontX - r.x;
        const dfz = frontZ - r.z;
        const dcx = x - r.x;
        const dcz = z - r.z;
        const rFront = radius + rockRadius;
        const rCenter = 3.6 + rockRadius;
        if ((dfx * dfx + dfz * dfz) < rFront * rFront || (dcx * dcx + dcz * dcz) < rCenter * rCenter) {
            explodeRock(r);
        }
    }

    // Check nearby trees
    const nearbyTrees = queryFoliageGrid(treeGrid, x, z, queryRadius, _nearbyTrees);
    for (let i = 0; i < nearbyTrees.length; i++) {
        const t = nearbyTrees[i];
        if (t.destroyed) continue;
        const treeRadius = 1.4 * t.s;
        const dfx = frontX - t.x;
        const dfz = frontZ - t.z;
        const dcx = x - t.x;
        const dcz = z - t.z;
        const rFront = radius + treeRadius;
        const rCenter = 3.6 + treeRadius;
        if ((dfx * dfx + dfz * dfz) < rFront * rFront || (dcx * dcx + dcz * dcz) < rCenter * rCenter) {
            explodeTree(t);
        }
    }

    // Check nearby bushes
    const nearbyBushes = queryFoliageGrid(bushGrid, x, z, queryRadius, _nearbyBushes);
    for (let i = 0; i < nearbyBushes.length; i++) {
        const b = nearbyBushes[i];
        if (b.destroyed) continue;
        const bushRadius = 1.35 * 1.2 * b.s * 0.85;
        const dfx = frontX - b.x;
        const dfz = frontZ - b.z;
        const dcx = x - b.x;
        const dcz = z - b.z;
        const rFront = radius + bushRadius;
        const rCenter = 3.6 + bushRadius;
        if ((dfx * dfx + dfz * dfz) < rFront * rFront || (dcx * dcx + dcz * dcz) < rCenter * rCenter) {
            explodeBush(b);
        }
    }
}

export function checkWaterCannonFoliage(originX: number, originZ: number, heading: number, aimX: number, aimZ: number, dt: number) {
    if (worldState.activeArea === 'UNDERGROUND') return;
    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const maxOriginSq = 28.0 * 28.0;
    const minOriginSq = 5.0 * 5.0;
    const maxAimSq = 14.0 * 14.0;

    // Check nearby trees
    const nearbyTrees = queryFoliageGrid(treeGrid, originX, originZ, 32.0, _nearbyTrees);
    for (let i = 0; i < nearbyTrees.length; i++) {
        const t = nearbyTrees[i];
        if (t.destroyed || t.growthFactor >= 5.0) continue;

        const dx = t.x - originX;
        const dz = t.z - originZ;
        const distOriginSq = dx * dx + dz * dz;
        if (distOriginSq > maxOriginSq) continue;

        let inStream = false;
        if (distOriginSq < minOriginSq) {
            inStream = true;
        } else {
            const distOrigin = Math.sqrt(distOriginSq);
            const dot = (dx * fwdX + dz * fwdZ) / distOrigin;
            const dax = t.x - aimX;
            const daz = t.z - aimZ;
            if (dot > 0.68 || (dax * dax + daz * daz) < maxAimSq) {
                inStream = true;
            }
        }

        if (inStream) {
            waterTree(t, dt * 2.5);
        }
    }

    // Check nearby bushes
    const nearbyBushes = queryFoliageGrid(bushGrid, originX, originZ, 32.0, _nearbyBushes);
    for (let i = 0; i < nearbyBushes.length; i++) {
        const b = nearbyBushes[i];
        if (b.destroyed || b.growthFactor >= 5.0) continue;

        const dx = b.x - originX;
        const dz = b.z - originZ;
        const distOriginSq = dx * dx + dz * dz;
        if (distOriginSq > maxOriginSq) continue;

        let inStream = false;
        if (distOriginSq < minOriginSq) {
            inStream = true;
        } else {
            const distOrigin = Math.sqrt(distOriginSq);
            const dot = (dx * fwdX + dz * fwdZ) / distOrigin;
            const dax = b.x - aimX;
            const daz = b.z - aimZ;
            if (dot > 0.68 || (dax * dax + daz * daz) < maxAimSq) {
                inStream = true;
            }
        }

        if (inStream) {
            waterBush(b, dt * 2.5);
        }
    }
}

if (typeof window !== 'undefined') {
    (window as any).allTrees = allTrees;
    (window as any).allRocks = allRocks;
    (window as any).allBushes = allBushes;
    (window as any).explodeRock = explodeRock;
    (window as any).explodeTree = explodeTree;
    (window as any).explodeBush = explodeBush;
    (window as any).waterTree = waterTree;
    (window as any).waterBush = waterBush;
    (window as any).checkBoulderScoopAttack = checkBoulderScoopAttack;
    (window as any).checkWaterCannonFoliage = checkWaterCannonFoliage;
}


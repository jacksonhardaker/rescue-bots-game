// Griffin Rock Island Railway Circuit & "The Griffin Rock Express" Train System
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight, getRailwayRadius, RAILWAY_LOOP_RADIUS } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';
import { registerCullableObject, player } from '../state/gameState.js';
import { mergeStaticMeshesInGroup, freezeStaticHierarchy } from '../rendering/meshOptimizer.js';
import { createRoadRibbon } from './roads.js';
import { sfx } from '../audio/soundFX.js';
import {
    matCrossRedOff,
    matCrossRedOn,
    makeTrainFlangedWheel,
    makeTrainBogie,
    buildRailroadCrossingMesh,
    buildCentralRailwayStationMesh,
    buildTrainLocomotiveMesh,
    buildTrainTenderMesh,
    buildTrainCommuterCoachMesh,
    buildTrainDomeCoachMesh,
    buildTrainDiningCoachMesh,
    buildTrainFlatcarMesh,
    buildTrainCabooseMesh
} from './railwayModels.js';

export { makeTrainFlangedWheel, makeTrainBogie };

export interface RailroadCrossingLamp {
    mesh: THREE.Mesh;
    phase: number;
}

export interface RailroadCrossingEntry {
    x: number;
    z: number;
    gy: number;
    isNSHighway: boolean;
    lamps: RailroadCrossingLamp[];
    isFlashing: boolean;
    group?: THREE.Group;
}

export interface TrainCarEntry {
    name: string;
    root: THREE.Group;
    length: number;
    halfLength: number;
    width: number;
    halfWidth: number;
    height: number;
    mass: number;
    offset: number;
    wheelRadius: number;
    wheels: THREE.Object3D[];
    connectingRods?: THREE.Object3D[];
    x: number;
    y: number;
    z: number;
    heading: number;
    pitch: number;
}

export interface IslandTrainState {
    cars: TrainCarEntry[];
    progress: number;
    speed: number;
    chugTimer: number;
    bellTimer: number;
    whistleCooldown: number;
    steamTimer: number;
}

export interface RailwayPoint {
    x: number;
    z: number;
    dist: number;
    theta: number;
}

interface TrainSteamPuff {
    mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshToonMaterial>;
    active: boolean;
    life: number;
    maxLife: number;
    startScale: number;
    endScale: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
}

export let railroadCrossings: RailroadCrossingEntry[] = [];
export let centralStationGroup: THREE.Group | null = null;
export let islandTrain: IslandTrainState = {
    cars: [],
    progress: 350.0,
    speed: 18.5,
    chugTimer: 0,
    bellTimer: 0,
    whistleCooldown: 0,
    steamTimer: 0
};
export let railwayLoopMesh: THREE.Mesh | null = null;

        /***********************************************************************
         * 5C. GRIFFIN ROCK ISLAND RAILWAY CIRCUIT & CENTRAL STATION
         ***********************************************************************/
export function makeProceduralRailTrackTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;

    // 1. Granite/Gravel Ballast Roadbed Base (#334155 / #475569)
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    // Ballast stone texture aggregate speckles
    ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
    for (let i = 0; i < 550; i++) {
        ctx.fillRect((i * 197.3) % 512, (i * 311.7) % 512, 3, 3);
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    for (let i = 0; i < 550; i++) {
        ctx.fillRect((i * 131.9) % 512, (i * 241.1) % 512, 3, 3);
    }

    // Ballast tapered shoulders with subtle shading
    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    ctx.fillRect(0, 0, 36, 512);
    ctx.fillRect(476, 0, 36, 512);

    // 2. Heavy Timber Railroad Ties (Sleepers) spaced every 32px along V
    for (let y = 0; y < 512; y += 32) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
        ctx.fillRect(52, y + 20, 408, 6);
        ctx.fillStyle = '#2d1810';
        ctx.fillRect(56, y + 4, 400, 18);
        ctx.fillStyle = '#452618';
        ctx.fillRect(58, y + 6, 396, 6);
        [176, 336].forEach(rx => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(rx - 18, y + 2, 36, 22);
            ctx.fillStyle = '#475569';
            ctx.fillRect(rx - 15, y + 4, 30, 18);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(rx - 12, y + 6, 4, 4);
            ctx.fillRect(rx + 8, y + 6, 4, 4);
            ctx.fillRect(rx - 12, y + 14, 4, 4);
            ctx.fillRect(rx + 8, y + 14, 4, 4);
        });
    }

    // 3. Continuous Gleaming Dual Steel Rails
    [176, 336].forEach(rx => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(rx - 12, 0, 24, 512);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(rx - 8, 0, 16, 512);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(rx - 5, 0, 10, 512);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 2, 0, 4, 512);
    });

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = (typeof window !== 'undefined' && window.renderer && window.renderer.capabilities) ? window.renderer.capabilities.getMaxAnisotropy() : 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
}

export let sharedRailTrackTexture: THREE.Texture | null = null;
export let ptsRailway: RailwayPoint[] = [];
export let railwayTotalDist = 0;
export let railwayMesh: THREE.Mesh | null = null;

const railwaySteps = 540;
let prevRailPt: { x: number; z: number } | null = null;
for (let i = 0; i < railwaySteps; i++) {
    const theta = (i / railwaySteps) * Math.PI * 2;
    const r = getRailwayRadius(theta);
    const rx = Math.cos(theta) * r;
    const rz = Math.sin(theta) * r;
    if (i > 0 && prevRailPt) {
        railwayTotalDist += Math.hypot(rx - prevRailPt.x, rz - prevRailPt.z);
    }
    ptsRailway.push({ x: rx, z: rz, dist: railwayTotalDist, theta });
    prevRailPt = { x: rx, z: rz };
}
if (prevRailPt) {
    railwayTotalDist += Math.hypot(ptsRailway[0].x - prevRailPt.x, ptsRailway[0].z - prevRailPt.z);
}

export function getTrackPointAtDist(targetDist: number) {
    const d = ((targetDist % railwayTotalDist) + railwayTotalDist) % railwayTotalDist;
    let low = 0, high = ptsRailway.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (ptsRailway[mid].dist < d) low = mid + 1;
        else high = mid - 1;
    }
    const idx = Math.max(0, Math.min(ptsRailway.length - 2, high));
    const p0 = ptsRailway[idx];
    const p1 = ptsRailway[idx + 1] || ptsRailway[0];
    const segLen = (p1.dist > p0.dist ? p1.dist - p0.dist : (railwayTotalDist - p0.dist)) || 0.001;
    const t = Math.max(0, Math.min(1, (d - p0.dist) / segLen));
    return {
        x: p0.x + (p1.x - p0.x) * t,
        z: p0.z + (p1.z - p0.z) * t
    };
}

export interface NearestRailwayResult {
    distOnTrack: number;
    x: number;
    z: number;
    heading: number;
    distanceToTrack: number;
}

export function findNearestRailwayPoint(wx: number, wz: number): NearestRailwayResult {
    let bestDistSq = Infinity;
    let bestArcDist = 0;
    let bestX = 0;
    let bestZ = 0;
    let bestHeading = 0;

    const n = ptsRailway.length;
    for (let i = 0; i < n; i++) {
        const p0 = ptsRailway[i];
        const p1 = ptsRailway[(i + 1) % n];
        const sx = p1.x - p0.x;
        const sz = p1.z - p0.z;
        const segLenSq = sx * sx + sz * sz || 1e-6;
        const t = Math.max(0, Math.min(1, ((wx - p0.x) * sx + (wz - p0.z) * sz) / segLenSq));
        const px = p0.x + sx * t;
        const pz = p0.z + sz * t;
        const dx = wx - px;
        const dz = wz - pz;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            const segLen = Math.sqrt(segLenSq);
            bestArcDist = (p0.dist + segLen * t) % railwayTotalDist;
            bestX = px;
            bestZ = pz;
            bestHeading = Math.atan2(sx, sz);
        }
    }

    return {
        distOnTrack: bestArcDist,
        x: bestX,
        z: bestZ,
        heading: bestHeading,
        distanceToTrack: Math.sqrt(bestDistSq)
    };
}

export function isNearRailwayTrack(wx: number, wz: number, maxDist = 26.0): boolean {
    if (typeof window !== 'undefined' && window.worldState && window.worldState.activeArea !== 'SURFACE') {
        return false;
    }
    return findNearestRailwayPoint(wx, wz).distanceToTrack <= maxDist;
}

export function getRailwayPoseAtDist(targetDist: number, dir = 1) {
    const sign = dir >= 0 ? 1 : -1;
    const p = getTrackPointAtDist(targetDist);
    const pFwd = getTrackPointAtDist(targetDist + 2.5 * sign);
    const pBwd = getTrackPointAtDist(targetDist - 2.5 * sign);
    const heading = Math.atan2(pFwd.x - pBwd.x, pFwd.z - pBwd.z);
    const groundY = getSurfaceHeight(p.x, p.z);
    const yFwd = getSurfaceHeight(pFwd.x, pFwd.z);
    const yBwd = getSurfaceHeight(pBwd.x, pBwd.z);
    const pitch = Math.atan2(yFwd - yBwd, 5.0);
    return {
        x: p.x,
        y: groundY + 0.22,
        z: p.z,
        heading,
        pitch
    };
}

// Mainland Express Rail Tunnel Portal location (scenic NW ridge curve along Griffin Rock Railway)
export const RAIL_TUNNEL_PORTAL_DIST = railwayTotalDist * 0.58;
const _portalPt = getTrackPointAtDist(RAIL_TUNNEL_PORTAL_DIST);
const _portalFwd = getTrackPointAtDist(RAIL_TUNNEL_PORTAL_DIST + 3.0);
export const RAIL_TUNNEL_PORTAL_POS = {
    x: _portalPt.x,
    z: _portalPt.z,
    heading: Math.atan2(_portalFwd.x - _portalPt.x, _portalFwd.z - _portalPt.z),
    dist: RAIL_TUNNEL_PORTAL_DIST
};
export let railTunnelPortalGroup: THREE.Group | null = null;

export function buildRailTunnelPortal() {
    const px = RAIL_TUNNEL_PORTAL_POS.x;
    const pz = RAIL_TUNNEL_PORTAL_POS.z;
    const py = getSurfaceHeight(px, pz);

    const g = new THREE.Group();
    const matConcrete = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });
    const matCobalt = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matPortalCurtain = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
    });

    // Twin Heavy Concrete Portal Abutments flanking the 14.8m track bed (clear 9.6m center opening!)
    [-5.8, 5.8].forEach(sx => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 10.5, 6.2), matConcrete);
        pillar.position.set(sx, 5.25, 0);
        pillar.castShadow = true;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.72, 1.1, 6.3), matCobalt);
        stripe.position.set(sx, 8.6, 0);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), matCyanGlow);
        lamp.position.set(sx, 10.8, 2.8);
        lamp.userData.noOutline = true;
        g.add(pillar, stripe, lamp);
    });

    // Grand Overhead Arch Header & Glowing Shinkansen Chevron Ring
    const header = new THREE.Mesh(new THREE.BoxGeometry(14.6, 2.6, 6.4), matConcrete);
    header.position.set(0, 10.6, 0);
    header.castShadow = true;
    const archTrim = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.55, 6.6), matGold);
    archTrim.position.set(0, 9.25, 0);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.65, 0.45), matCobalt);
    signBoard.position.set(0, 10.7, 3.25);
    const signGlowBar = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.42, 0.18), matGold);
    signGlowBar.position.set(0, 10.7, 3.50);
    signGlowBar.userData.noOutline = true;

    const signBoardBack = signBoard.clone();
    signBoardBack.position.z = -3.25;
    const signGlowBack = signGlowBar.clone();
    signGlowBack.position.z = -3.50;

    // Holographic Cyan Express Tunnel Portal Shimmer Ring
    const portalArch = new THREE.Mesh(
        new THREE.TorusGeometry(4.6, 0.24, 10, 28, Math.PI),
        matCyanGlow
    );
    portalArch.position.set(0, 4.4, 0);
    portalArch.userData.noOutline = true;

    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 8.6), matPortalCurtain);
    curtain.position.set(0, 4.5, 0);
    curtain.userData.noOutline = true;

    g.add(header, archTrim, signBoard, signGlowBar, signBoardBack, signGlowBack, portalArch, curtain);
    g.position.set(px, py, pz);
    g.rotation.y = RAIL_TUNNEL_PORTAL_POS.heading;

    scene.add(g);
    registerCullableObject(g, px, py + 5, pz, 48);
    railTunnelPortalGroup = g;
    return g;
}

        // 4 Grade Crossing Signals & Paved Rubber Flange Aprons (at NS & EW Highways)
        railroadCrossings = [];

        export function createRailroadCrossing(cx: number, cz: number, isNSHighway: boolean) {
            const gy = getSurfaceHeight(cx, cz);
            const { root: crossG, lamps } = buildRailroadCrossingMesh(isNSHighway);
            crossG.position.set(cx, gy, cz);

            scene.add(crossG);
            registerCullableObject(crossG, cx, gy + 2, cz, 32);

            const crossingData: RailroadCrossingEntry = { x: cx, z: cz, gy, isNSHighway, lamps, isFlashing: false, group: crossG };
            railroadCrossings.push(crossingData);
            return crossingData;
        }

        // Griffin Rock Central Passenger Railway Station (aligned cleanly beside & tangent to the East Railway spline!)
        export function buildCentralRailwayStation() {
            const nearest = findNearestRailwayPoint(765, 75);
            const stX = nearest.x;
            const stZ = nearest.z;
            const stY = getSurfaceHeight(stX, stZ);
            const { root: stationG } = buildCentralRailwayStationMesh();
            stationG.position.set(stX, stY, stZ);
            stationG.rotation.y = nearest.heading;

            scene.add(stationG);
            registerCullableObject(stationG, stX, stY + 3, stZ, 45);
            return stationG;
        }

        /***********************************************************************
         * 5D. GRIFFIN ROCK ISLAND RAILWAY TRAIN SYSTEM ("THE GRIFFIN ROCK EXPRESS")
         ***********************************************************************/
        islandTrain = {
            cars: [],
            progress: 350.0,
            speed: 18.5,
            chugTimer: 0,
            bellTimer: 0,
            whistleCooldown: 0,
            steamTimer: 0
        };

        const trainSteamPuffs: TrainSteamPuff[] = [];
        const trainSteamGeo = new THREE.SphereGeometry(1, 8, 8);
        const trainSteamMat = new THREE.MeshToonMaterial({
            color: 0xf1f5f9,
            gradientMap: toonGrad3,
            transparent: true,
            opacity: 0.75
        });

        export function spawnTrainSteamPuff(wx: number, wy: number, wz: number, heading: number, speed: number) {
            let puff: TrainSteamPuff | null = null;
            for (let i = 0; i < trainSteamPuffs.length; i++) {
                if (!trainSteamPuffs[i].active) {
                    puff = trainSteamPuffs[i];
                    break;
                }
            }
            if (!puff) {
                if (trainSteamPuffs.length >= 24) return;
                const mesh = new THREE.Mesh(trainSteamGeo, trainSteamMat.clone());
                scene.add(mesh);
                puff = { mesh, active: false, life: 0, maxLife: 1.5, startScale: 0.55, endScale: 2.6, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
                trainSteamPuffs.push(puff);
            }
            puff.active = true;
            puff.mesh.visible = true;
            puff.life = 0;
            puff.maxLife = 1.35 + Math.random() * 0.35;
            puff.startScale = 0.55;
            puff.endScale = 2.6 + Math.random() * 0.6;
            puff.x = wx;
            puff.y = wy;
            puff.z = wz;
            const driftSpeed = speed * 0.35;
            puff.vx = -Math.sin(heading) * driftSpeed + (Math.random() - 0.5) * 1.4;
            puff.vy = 3.6 + Math.random() * 1.2;
            puff.vz = -Math.cos(heading) * driftSpeed + (Math.random() - 0.5) * 1.4;
            puff.mesh.position.set(wx, wy, wz);
            puff.mesh.scale.setScalar(puff.startScale);
            puff.mesh.material.opacity = 0.72;
        }

        export function buildIslandTrainSystem() {
            const loco = buildTrainLocomotiveMesh(true);
            scene.add(loco.root);
            islandTrain.cars.push({
                name: 'Locomotive',
                root: loco.root,
                length: 14.5,
                halfLength: 7.25,
                width: 3.6,
                halfWidth: 1.8,
                height: 4.8,
                mass: 95000,
                offset: 0.0,
                wheelRadius: 0.88,
                wheels: loco.wheels,
                connectingRods: loco.connectingRods,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            const specs = [
                { name: 'Tender', build: buildTrainTenderMesh, length: 9.5, halfLength: 4.75, width: 3.4, halfWidth: 1.7, height: 3.6, mass: 45000, offset: 13.20 },
                { name: 'Coach 1', build: buildTrainCommuterCoachMesh, length: 15.0, halfLength: 7.50, width: 3.5, halfWidth: 1.75, height: 4.0, mass: 42000, offset: 26.65 },
                { name: 'Coach 2 Dome', build: buildTrainDomeCoachMesh, length: 15.0, halfLength: 7.50, width: 3.5, halfWidth: 1.75, height: 4.6, mass: 44000, offset: 42.85 },
                { name: 'Coach 3 Diner', build: buildTrainDiningCoachMesh, length: 15.0, halfLength: 7.50, width: 3.5, halfWidth: 1.75, height: 4.0, mass: 42000, offset: 59.05 },
                { name: 'Flatcar', build: buildTrainFlatcarMesh, length: 13.0, halfLength: 6.50, width: 3.4, halfWidth: 1.70, height: 3.2, mass: 38000, offset: 74.25 },
                { name: 'Caboose', build: buildTrainCabooseMesh, length: 12.5, halfLength: 6.25, width: 3.4, halfWidth: 1.70, height: 4.5, mass: 32000, offset: 88.20 }
            ];

            specs.forEach(s => {
                const carBuilt = s.build();
                scene.add(carBuilt.root);
                islandTrain.cars.push({
                    name: s.name,
                    root: carBuilt.root,
                    length: s.length,
                    halfLength: s.halfLength,
                    width: s.width,
                    halfWidth: s.halfWidth,
                    height: s.height,
                    mass: s.mass,
                    offset: s.offset,
                    wheelRadius: 0.52,
                    wheels: carBuilt.wheels,
                    x: 0, y: 0, z: 0, heading: 0, pitch: 0
                });
            });
        }

        export function updateIslandTrain(dt: number, now: number) {
            islandTrain.progress = (islandTrain.progress + islandTrain.speed * dt) % railwayTotalDist;

            const locoCar = islandTrain.cars[0];
            const cabooseCar = islandTrain.cars[islandTrain.cars.length - 1];

            // 1. Spline positioning & articulation for all 7 cars
            for (let i = 0; i < islandTrain.cars.length; i++) {
                const car = islandTrain.cars[i];
                const carDist = ((islandTrain.progress - car.offset) % railwayTotalDist + railwayTotalDist) % railwayTotalDist;
                const p = getTrackPointAtDist(carDist);
                const pFwd = getTrackPointAtDist(carDist + 2.5);
                const pBwd = getTrackPointAtDist(carDist - 2.5);

                const dx = pFwd.x - pBwd.x;
                const dz = pFwd.z - pBwd.z;
                const heading = Math.atan2(dx, dz);

                const groundY = getSurfaceHeight(p.x, p.z);
                const yFwd = getSurfaceHeight(pFwd.x, pFwd.z);
                const yBwd = getSurfaceHeight(pBwd.x, pBwd.z);
                const pitch = Math.atan2(yFwd - yBwd, 5.0);

                car.x = p.x;
                car.y = groundY + 0.65;
                car.z = p.z;
                car.heading = heading;
                car.pitch = pitch;

                car.root.position.set(car.x, car.y, car.z);
                car.root.rotation.set(pitch, heading, 0, 'YXZ');

                const spin = (islandTrain.speed * dt) / (car.wheelRadius || 0.52);
                for (let w = 0; w < car.wheels.length; w++) {
                    car.wheels[w].rotation.x += spin;
                }

                if (car.connectingRods) {
                    const crankAngle = (carDist / 0.88);
                    const rodOffsetY = Math.sin(crankAngle) * 0.32;
                    const rodOffsetZ = Math.cos(crankAngle) * 0.32;
                    car.connectingRods.forEach(cr => {
                        cr.position.set(cr.userData.baseX, cr.userData.baseY + rodOffsetY, cr.userData.baseZ + rodOffsetZ);
                    });
                }
            }

            // 2. Locomotive Smokestack Cartoon Steam Puffs
            if (locoCar) {
                const fwdX = Math.sin(locoCar.heading);
                const fwdZ = Math.cos(locoCar.heading);
                const stackWorldX = locoCar.x + fwdX * 5.2;
                const stackWorldY = locoCar.y + 5.15;
                const stackWorldZ = locoCar.z + fwdZ * 5.2;

                if (!islandTrain.steamTimer) islandTrain.steamTimer = 0;
                islandTrain.steamTimer -= dt;
                if (islandTrain.steamTimer <= 0) {
                    islandTrain.steamTimer = 0.16;
                    spawnTrainSteamPuff(stackWorldX, stackWorldY, stackWorldZ, locoCar.heading, islandTrain.speed);
                }
            }

            for (let i = 0; i < trainSteamPuffs.length; i++) {
                const puff = trainSteamPuffs[i];
                if (!puff.active) continue;
                puff.life += dt;
                if (puff.life >= puff.maxLife) {
                    puff.active = false;
                    puff.mesh.visible = false;
                    continue;
                }
                const frac = puff.life / puff.maxLife;
                puff.x += puff.vx * dt;
                puff.y += puff.vy * dt;
                puff.z += puff.vz * dt;
                puff.mesh.position.set(puff.x, puff.y, puff.z);
                puff.mesh.scale.setScalar(puff.startScale + frac * (puff.endScale - puff.startScale));
                puff.mesh.material.opacity = Math.max(0, 0.75 * (1 - frac));
            }

            // 3. Steam Chug Audio
            islandTrain.chugTimer -= dt;
            if (islandTrain.chugTimer <= 0) {
                islandTrain.chugTimer = 0.32;
                const distToPlayer = Math.hypot(player.pos.x - locoCar.x, player.pos.z - locoCar.z);
                if (distToPlayer < 120.0) {
                    sfx.playTrainChug();
                }
            }

            // 4. Highway Grade Crossing Signal Activation & Bell Ding
            if (!islandTrain.bellTimer) islandTrain.bellTimer = 0;
            islandTrain.bellTimer -= dt;
            if (islandTrain.whistleCooldown > 0) islandTrain.whistleCooldown -= dt;

            for (let cIdx = 0; cIdx < railroadCrossings.length; cIdx++) {
                const rc = railroadCrossings[cIdx];
                const dLoco = Math.hypot(locoCar.x - rc.x, locoCar.z - rc.z);

                let isTrainOnPad = false;
                for (let k = 0; k < islandTrain.cars.length; k++) {
                    const c = islandTrain.cars[k];
                    if (Math.hypot(c.x - rc.x, c.z - rc.z) < 14.0) {
                        isTrainOnPad = true;
                        break;
                    }
                }

                const locoFwdX = Math.sin(locoCar.heading);
                const locoFwdZ = Math.cos(locoCar.heading);
                const dotApproach = (rc.x - locoCar.x) * locoFwdX + (rc.z - locoCar.z) * locoFwdZ;
                const isApproaching = (dotApproach > 0 && dLoco < 85.0);

                // Also activate crossing signals when Toreinbotto approaches in Train Mode on the rails!
                const isToreinbottoOnRail = player.botType === 'TOREINBOTTO' && player.mode === 'VEHICLE' && Boolean(player.onRailwayTrack);
                const dPlayer = isToreinbottoOnRail ? Math.hypot(player.pos.x - rc.x, player.pos.z - rc.z) : 9999;
                const isToreinbottoApproaching = isToreinbottoOnRail && dPlayer < 85.0;

                const shouldBeActive = isTrainOnPad || isApproaching || isToreinbottoApproaching;
                rc.isFlashing = shouldBeActive;

                if (rc.lamps) {
                    const flashPhase = Math.floor(now / 200) % 2;
                    for (let l = 0; l < rc.lamps.length; l++) {
                        const lamp = rc.lamps[l];
                        if (shouldBeActive) {
                            lamp.mesh.material = (flashPhase === lamp.phase) ? matCrossRedOn : matCrossRedOff;
                        } else {
                            lamp.mesh.material = matCrossRedOff;
                        }
                    }
                }

                if (shouldBeActive) {
                    const distCrossingToPlayer = Math.hypot(player.pos.x - rc.x, player.pos.z - rc.z);
                    if (distCrossingToPlayer < 110.0 && islandTrain.bellTimer <= 0) {
                        islandTrain.bellTimer = 0.44;
                        sfx.playCrossingBell();
                    }

                    if (isApproaching && dLoco < 75.0 && islandTrain.whistleCooldown <= 0) {
                        islandTrain.whistleCooldown = 18.0;
                        sfx.playTrainWhistle();
                    }
                }
            }
        }


export function initRailway(scene?: THREE.Scene | null) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    // Build tracks with dense vertex sampling (~4.8m per segment) to closely follow
    // terrain curvature and grade crossings, preventing tracks from clipping beneath terrain
    const ptsRail = [];
    const railSteps = 960;
    for (let i = 0; i < railSteps; i++) {
        const a = (i / railSteps) * Math.PI * 2;
        const r = getRailwayRadius(a);
        ptsRail.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
    sharedRailTrackTexture = makeProceduralRailTrackTexture();
    const railTex = sharedRailTrackTexture;
    railwayLoopMesh = createRoadRibbon(ptsRail, 14.8, true, -1.25, -5.5, railTex, 8.0, 0.22);
    freezeStaticHierarchy(railwayLoopMesh);
    s.add(railwayLoopMesh);

    // 4 Grade Crossings (snapped to exact railway spline centerlines)
    railroadCrossings.length = 0;
    const eastCross = findNearestRailwayPoint(770, 25);
    const westCross = findNearestRailwayPoint(-770, 25);
    createRailroadCrossing(0, 620, true);                        // South NS Highway Crossing
    createRailroadCrossing(0, -730, true);                       // North NS Highway Crossing
    createRailroadCrossing(eastCross.x, eastCross.z, false);     // East EW Highway Crossing
    createRailroadCrossing(westCross.x, westCross.z, false);     // West EW Highway Crossing
    railroadCrossings.forEach((cr) => {
        if (cr.group) {
            mergeStaticMeshesInGroup(cr.group, (cr.lamps || []).map((l) => l.mesh));
        }
    });

    centralStationGroup = buildCentralRailwayStation();
    if (centralStationGroup) {
        mergeStaticMeshesInGroup(centralStationGroup);
    }

    buildRailTunnelPortal();
    buildIslandTrainSystem();

    if (typeof window !== 'undefined') {
        window.railroadCrossings = railroadCrossings;
        window.centralStationGroup = centralStationGroup;
        window.islandTrain = islandTrain;
    }
}

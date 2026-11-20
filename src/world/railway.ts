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

export let railroadCrossings = [];
export let centralStationGroup = null;
export let islandTrain = null;
export let railwayLoopMesh = null;

        /***********************************************************************
         * 5C. GRIFFIN ROCK ISLAND RAILWAY CIRCUIT & CENTRAL STATION
         ***********************************************************************/
export function makeProceduralRailTrackTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

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

export let sharedRailTrackTexture = null;
export let ptsRailway = [];
export let railwayTotalDist = 0;
export let railwayMesh = null;

const railwaySteps = 540;
let prevRailPt = null;
for (let i = 0; i < railwaySteps; i++) {
    const theta = (i / railwaySteps) * Math.PI * 2;
    const r = getRailwayRadius(theta);
    const rx = Math.cos(theta) * r;
    const rz = Math.sin(theta) * r;
    if (i > 0) {
        railwayTotalDist += Math.hypot(rx - prevRailPt.x, rz - prevRailPt.z);
    }
    ptsRailway.push({ x: rx, z: rz, dist: railwayTotalDist, theta });
    prevRailPt = { x: rx, z: rz };
}
railwayTotalDist += Math.hypot(ptsRailway[0].x - prevRailPt.x, ptsRailway[0].z - prevRailPt.z);

export function getTrackPointAtDist(targetDist) {
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

        // 4 Grade Crossing Signals & Paved Rubber Flange Aprons (at NS & EW Highways)
        railroadCrossings = [];

        export function createRailroadCrossing(cx, cz, isNSHighway) {
            const gy = getSurfaceHeight(cx, cz);
            const { root: crossG, lamps } = buildRailroadCrossingMesh(isNSHighway);
            crossG.position.set(cx, gy, cz);

            scene.add(crossG);
            registerCullableObject(crossG, cx, gy + 2, cz, 32);

            const crossingData = { x: cx, z: cz, gy, isNSHighway, lamps, isFlashing: false };
            railroadCrossings.push(crossingData);
            return crossingData;
        }

        // Griffin Rock Central Passenger Railway Station (at X = 765, Z = 75, near East Highway crossing)
        export function buildCentralRailwayStation() {
            const stX = 765, stZ = 75;
            const stY = getSurfaceHeight(stX, stZ);
            const { root: stationG } = buildCentralRailwayStationMesh();
            stationG.position.set(stX, stY, stZ);

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

        const trainSteamPuffs = [];
        const trainSteamGeo = new THREE.SphereGeometry(1, 8, 8);
        const trainSteamMat = new THREE.MeshToonMaterial({
            color: 0xf1f5f9,
            gradientMap: toonGrad3,
            transparent: true,
            opacity: 0.75
        });

        export function spawnTrainSteamPuff(wx, wy, wz, heading, speed) {
            let puff = null;
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
                puff = { mesh, active: false };
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

        export function updateIslandTrain(dt, now) {
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

                const shouldBeActive = isTrainOnPad || isApproaching;
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


export function initRailway(scene) {
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

    // 4 Grade Crossings
    railroadCrossings.length = 0;
    createRailroadCrossing(0, 620, true);       // South NS Highway Crossing
    createRailroadCrossing(0, -730, true);      // North NS Highway Crossing
    createRailroadCrossing(765, 25, false);     // East EW Highway Crossing
    createRailroadCrossing(-765, 25, false);    // West EW Highway Crossing
    railroadCrossings.forEach((cr: any) => {
        if (cr.group) {
            mergeStaticMeshesInGroup(cr.group, (cr.lamps || []).map((l: any) => l.mesh));
        }
    });

    centralStationGroup = buildCentralRailwayStation();
    if (centralStationGroup) {
        mergeStaticMeshesInGroup(centralStationGroup);
    }

    buildIslandTrainSystem();

    if (typeof window !== 'undefined') {
        window.railroadCrossings = railroadCrossings;
        window.centralStationGroup = centralStationGroup;
        window.islandTrain = islandTrain;
    }
}

// Griffin Rock Island Railway Circuit & "The Griffin Rock Express" Train System
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight, getRailwayRadius, RAILWAY_LOOP_RADIUS } from './terrain.js';
import { toonGrad3, toonGrad4, matNPCHeadlightOn, matNPCBeam, matNPCBeamPool, applyCartoonInkOutlines } from '../rendering/materials.js';
import { registerCullableObject, player } from '../state/gameState.js';
import { createRoadRibbon } from './roads.js';
import { sfx } from '../audio/soundFX.js';

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
        const matHazardYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
        railroadCrossings = [];
        const matCrossRedOff = new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGrad3 });
        const matCrossRedOn = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const matCrossPole = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 });
        const matCrossSign = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });

        export function createRailroadCrossing(cx, cz, isNSHighway) {
            const gy = getSurfaceHeight(cx, cz);
            const crossG = new THREE.Group();
            crossG.position.set(cx, gy, cz);

            // 1. Rubberized Asphalt Level Crossing Pad
            const padW = isNSHighway ? 20.0 : 16.0;
            const padL = isNSHighway ? 16.0 : 20.0;
            const padMesh = new THREE.Mesh(
                new THREE.BoxGeometry(padW, 0.40, padL),
                new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3, polygonOffset: true, polygonOffsetFactor: -1.2, polygonOffsetUnits: -5.0 })
            );
            padMesh.position.set(0, 0.18, 0);
            padMesh.receiveShadow = true;
            crossG.add(padMesh);

            // 2. Dual Warning Crossbuck Mast Signals (one on each highway approach)
            const lamps = [];
            const masts = isNSHighway ? [-11.5, 11.5] : [-11.5, 11.5];

            masts.forEach(mSide => {
                const mastG = new THREE.Group();
                if (isNSHighway) mastG.position.set(mSide, 0, mSide > 0 ? -5.5 : 5.5);
                else mastG.position.set(mSide > 0 ? -5.5 : 5.5, 0, mSide);

                // Base with yellow hazard stripes
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), matHazardYellow);
                base.position.set(0, 0.3, 0);
                mastG.add(base);

                // Striped white/black signal mast
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.8, 8), matCrossPole);
                pole.position.set(0, 2.7, 0);
                mastG.add(pole);

                // Crossbuck "X" Sign
                [-Math.PI / 4, Math.PI / 4].forEach(rot => {
                    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.26, 0.08), matCrossSign);
                    arm.position.set(0, 4.4, 0.12);
                    arm.rotation.z = rot;
                    mastG.add(arm);
                });

                // Dual Alternating Flashing Red LED Signal Lamps
                const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), matCrossSign);
                crossbar.position.set(0, 3.8, 0.12);
                mastG.add(crossbar);

                [-0.65, 0.65].forEach((lx, lIdx) => {
                    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 10).rotateX(Math.PI / 2), matCrossSign);
                    hood.position.set(lx, 3.8, 0.16);
                    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), matCrossRedOff);
                    lamp.position.set(lx, 3.8, 0.24);
                    mastG.add(hood, lamp);
                    lamps.push({ mesh: lamp, phase: lIdx });
                });

                crossG.add(mastG);
            });

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
            const stationG = new THREE.Group();
            stationG.position.set(stX, stY, stZ);

            // 1. Raised Concrete/Brick Passenger Platform (46m long alongside the rails)
            const platGeo = new THREE.BoxGeometry(7.5, 1.25, 46.0);
            const matPlat = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
            const platform = new THREE.Mesh(platGeo, matPlat);
            platform.position.set(7.5, 0.62, 0);
            platform.receiveShadow = true;
            stationG.add(platform);

            // Tactile yellow safety edge strip
            const edgeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 46.0), matHazardYellow);
            edgeStrip.position.set(3.9, 1.27, 0);
            stationG.add(edgeStrip);

            // 2. Victorian Chalet Station Canopy Roof
            const matCanopyRoof = new THREE.MeshToonMaterial({ color: 0x166534, gradientMap: toonGrad4 }); // Deep forest green
            const matWoodPillar = new THREE.MeshToonMaterial({ color: 0x5c3a21, gradientMap: toonGrad3 });
            const matGoldLetter = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            const matNavySign = new THREE.MeshToonMaterial({ color: 0x1e3a8a, gradientMap: toonGrad3 });

            // Support pillars & trusses
            [-16, 0, 16].forEach(pz => {
                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.4, 0.45), matWoodPillar);
                pillar.position.set(9.0, 2.8, pz);
                stationG.add(pillar);
            });

            // Sloped Gabled Canopy Roof
            const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.28, 42.0).rotateZ(0.24), matCanopyRoof);
            roofLeft.position.set(8.5, 5.2, 0);
            stationG.add(roofLeft);

            // 3. Station Sign: "GRIFFIN ROCK CENTRAL STATION"
            const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 14.5), matNavySign);
            signBoard.position.set(4.8, 4.2, 0);
            const signText = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 13.8), matGoldLetter);
            signText.position.set(4.8, 4.2, 0);
            stationG.add(signBoard, signText);

            // 4. Station Clock Tower
            const clockTower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 1.6), matWoodPillar);
            clockTower.position.set(10.5, 6.2, 0);
            const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            clockFace.position.set(9.65, 6.8, 0);
            stationG.add(clockTower, clockFace);

            // 5. Wooden Passenger Benches on Platform
            [-10, 10].forEach(bz => {
                const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 3.8), matWoodPillar);
                bench.position.set(9.2, 1.55, bz);
                stationG.add(bench);
            });

            applyCartoonInkOutlines(stationG, 1.045, true);
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

        // Reusable Train Materials
        const matTrainLocoBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
        const matTrainLocoGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
        const matTrainLocoRed = new THREE.MeshToonMaterial({ color: 0xb91c1c, gradientMap: toonGrad4 });
        const matTrainDark = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
        const matTrainWheelHub = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
        const matTrainWheelRim = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad4 });
        const matTrainCoachBody = new THREE.MeshToonMaterial({ color: 0x1e40af, gradientMap: toonGrad4 });
        const matTrainCoachStripe = new THREE.MeshToonMaterial({ color: 0xfef08a, gradientMap: toonGrad3 });
        const matTrainCoachRoof = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
        const matTrainWindow = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const matTrainDomeGlass = new THREE.MeshToonMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 });
        const matTrainCabooseRed = new THREE.MeshToonMaterial({ color: 0xc2410c, gradientMap: toonGrad4 });
        const matTrainTailRed = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const matTrainHeadlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const matTrainBeam = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
        const matEnergonCanister = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const matWoodDeck = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });

        export function makeTrainFlangedWheel(radius, width = 0.28) {
            const wGroup = new THREE.Group();
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16).rotateZ(Math.PI / 2), matTrainWheelRim);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.04, 16).rotateZ(Math.PI / 2), matTrainWheelHub);
            const flange = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, 0.06, 16).rotateZ(Math.PI / 2), matTrainWheelRim);
            flange.position.x = 0.12;
            wGroup.add(tire, hub, flange);
            return wGroup;
        }

        export function makeTrainBogie(wheelbase = 3.2, trackGauge = 3.2, wheelRadius = 0.52) {
            const bogie = new THREE.Group();
            const wheels = [];
            const halfG = trackGauge * 0.5;
            const halfWb = wheelbase * 0.5;

            [-halfG - 0.22, halfG + 0.22].forEach(fx => {
                const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, wheelbase + 0.8), matTrainDark);
                frame.position.set(fx, wheelRadius, 0);
                bogie.add(frame);
            });
            const bolster = new THREE.Mesh(new THREE.BoxGeometry(trackGauge + 0.3, 0.32, 0.6), matTrainDark);
            bolster.position.set(0, wheelRadius + 0.15, 0);
            bogie.add(bolster);

            [-halfWb, halfWb].forEach(wz => {
                const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, trackGauge, 8).rotateZ(Math.PI / 2), matTrainWheelHub);
                axle.position.set(0, wheelRadius, wz);
                bogie.add(axle);

                const wL = makeTrainFlangedWheel(wheelRadius);
                wL.position.set(-halfG, wheelRadius, wz);
                bogie.add(wL);
                wheels.push(wL);

                const wR = makeTrainFlangedWheel(wheelRadius);
                wR.rotation.y = Math.PI;
                wR.position.set(halfG, wheelRadius, wz);
                bogie.add(wR);
                wheels.push(wR);
            });

            return { group: bogie, wheels };
        }

        export function buildIslandTrainSystem() {
            // 1. LOCOMOTIVE ("THE GRIFFIN ROCK TITAN", NO. 401)
            const locoRoot = new THREE.Group();
            const locoWheels = [];
            const connectingRods = [];

            const locoChassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.48, 14.0), matTrainDark);
            locoChassis.position.set(0, 1.05, 0);
            locoRoot.add(locoChassis);

            const cowcatcher = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.72, 1.4), matTrainLocoRed);
            cowcatcher.position.set(0, 0.72, 6.7);
            const cowStripes = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.18, 1.45), matHazardYellow);
            cowStripes.position.set(0, 0.52, 6.7);
            locoRoot.add(cowcatcher, cowStripes);

            const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 7.2, 20).rotateX(Math.PI / 2), matTrainLocoBlue);
            boiler.position.set(0, 2.65, 0.8);
            locoRoot.add(boiler);

            [-1.8, -0.4, 1.0, 2.4].forEach(bz => {
                const band = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 0.12, 20).rotateX(Math.PI / 2), matTrainLocoGold);
                band.position.set(0, 2.65, 0.8 + bz);
                locoRoot.add(band);
            });

            const smokebox = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 2.2, 20).rotateX(Math.PI / 2), matTrainDark);
            smokebox.position.set(0, 2.65, 5.3);
            const smokeDoor = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.25, 20).rotateX(Math.PI / 2), matTrainDark);
            smokeDoor.position.set(0, 2.65, 6.45);
            const smokestack = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 1.4, 14), matTrainDark);
            smokestack.position.set(0, 4.4, 5.2);
            locoRoot.add(smokebox, smokeDoor, smokestack);

            const steamDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), matTrainLocoGold);
            steamDome.position.set(0, 4.05, 2.6);
            const sandDome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), matTrainLocoGold);
            sandDome.position.set(0, 4.05, -0.5);
            const whistle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 8), matTrainLocoGold);
            whistle.position.set(0.65, 4.5, -2.4);
            locoRoot.add(steamDome, sandDome, whistle);

            const cab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.5, 4.4), matTrainLocoBlue);
            cab.position.set(0, 2.7, -4.4);
            const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.35, 4.6), matTrainDark);
            cabRoof.position.set(0, 4.05, -4.4);
            locoRoot.add(cab, cabRoof);

            [-1.82, 1.82].forEach(wx => {
                const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 2.2), matTrainWindow);
                sideWin.position.set(wx, 3.1, -4.4);
                locoRoot.add(sideWin);
            });
            [-0.9, 0.9].forEach(wx => {
                const fwdWin = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.08), matTrainWindow);
                fwdWin.position.set(wx, 3.1, -2.18);
                locoRoot.add(fwdWin);
            });

            // Locomotive Front Headlight & Ditch Lights (matching other vehicles)
            const hLightCase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.6, 16).rotateX(Math.PI / 2), matTrainDark);
            hLightCase.position.set(0, 3.8, 6.6);
            const hLightLens = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), matNPCHeadlightOn);
            hLightLens.position.set(0, 3.8, 6.95);
            hLightLens.userData.noOutline = true;
            locoRoot.add(hLightCase, hLightLens);

            // Dual lower ditch headlights on buffer beam (matching civilian vehicles)
            [-1.25, 1.25].forEach(lx => {
                const ditchCase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.35), matTrainDark);
                ditchCase.position.set(lx, 1.22, 6.65);
                const ditchLens = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.15), matNPCHeadlightOn);
                ditchLens.position.set(lx, 1.22, 6.84);
                ditchLens.userData.noOutline = true;
                locoRoot.add(ditchCase, ditchLens);
            });

            // Dual Projected Cartoon Headlight Beams & Track Light Pools (matching other vehicles, no solid black cone)
            const trainBeamGroup = new THREE.Group();
            [-1.15, 1.15].forEach(lx => {
                const beamGeo = new THREE.BufferGeometry();
                const posArr = new Float32Array([
                    lx * 0.4, 1.22, 6.8,
                    lx * 0.8, 1.22, 6.8,
                    lx - 2.4, 0.16, 28.0,

                    lx * 0.8, 1.22, 6.8,
                    lx + 2.4, 0.16, 28.0,
                    lx - 2.4, 0.16, 28.0
                ]);
                beamGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
                beamGeo.computeVertexNormals();
                const beamMesh = new THREE.Mesh(beamGeo, matNPCBeam);
                beamMesh.userData.noOutline = true;
                trainBeamGroup.add(beamMesh);

                const poolGeo = new THREE.PlaneGeometry(4.4, 18.0);
                poolGeo.rotateX(-Math.PI / 2);
                const poolMesh = new THREE.Mesh(poolGeo, matNPCBeamPool);
                poolMesh.position.set(lx * 0.85, 0.12, 18.0);
                poolMesh.userData.noOutline = true;
                trainBeamGroup.add(poolMesh);
            });
            locoRoot.add(trainBeamGroup);

            [-1.85, 1.85].forEach(rx => {
                const runBoard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 13.8), matTrainDark);
                runBoard.position.set(rx, 1.25, 0);
                locoRoot.add(runBoard);
            });

            const driveAxleZ = [-1.5, 0.8, 3.1];
            driveAxleZ.forEach(wz => {
                const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8).rotateZ(Math.PI / 2), matTrainWheelHub);
                axle.position.set(0, 0.88, wz);
                locoRoot.add(axle);

                const wL = makeTrainFlangedWheel(0.88, 0.35);
                wL.position.set(-1.6, 0.88, wz);
                locoRoot.add(wL);
                locoWheels.push(wL);

                const wR = makeTrainFlangedWheel(0.88, 0.35);
                wR.rotation.y = Math.PI;
                wR.position.set(1.6, 0.88, wz);
                locoRoot.add(wR);
                locoWheels.push(wR);
            });

            [-1.82, 1.82].forEach(rx => {
                const rod = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 4.8), matTrainWheelRim);
                rod.position.set(rx, 0.88, 0.8);
                rod.userData.baseX = rx;
                rod.userData.baseY = 0.88;
                rod.userData.baseZ = 0.8;
                locoRoot.add(rod);
                connectingRods.push(rod);
            });

            const pilotBogie = makeTrainBogie(1.8, 3.2, 0.52);
            pilotBogie.group.position.set(0, 0, 5.6);
            locoRoot.add(pilotBogie.group);
            locoWheels.push(...pilotBogie.wheels);

            applyCartoonInkOutlines(locoRoot, 1.035, true);
            scene.add(locoRoot);

            islandTrain.cars.push({
                name: "Locomotive",
                root: locoRoot,
                length: 14.5,
                halfLength: 7.25,
                width: 3.6,
                halfWidth: 1.8,
                height: 4.8,
                mass: 95000,
                offset: 0.0,
                wheelRadius: 0.88,
                wheels: locoWheels,
                connectingRods,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            // 2. COAL & ENERGON BOOSTER TENDER
            const tenderRoot = new THREE.Group();
            const tenderWheels = [];

            const tenderChassis = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 9.2), matTrainDark);
            tenderChassis.position.set(0, 0.95, 0);
            const tenderBody = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.2, 8.8), matTrainLocoBlue);
            tenderBody.position.set(0, 2.2, 0);
            tenderRoot.add(tenderChassis, tenderBody);

            const coalPile = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 4.6), matTrainDark);
            coalPile.position.set(0, 3.5, -1.2);
            tenderRoot.add(coalPile);

            [-0.75, 0.75].forEach(cx => {
                const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 12), matEnergonCanister);
                canister.position.set(cx, 3.8, 2.2);
                tenderRoot.add(canister);
            });

            [-2.6, 2.6].forEach(bz => {
                const bogie = makeTrainBogie(2.4, 3.2, 0.52);
                bogie.group.position.set(0, 0, bz);
                tenderRoot.add(bogie.group);
                tenderWheels.push(...bogie.wheels);
            });

            applyCartoonInkOutlines(tenderRoot, 1.035, true);
            scene.add(tenderRoot);

            islandTrain.cars.push({
                name: "Tender",
                root: tenderRoot,
                length: 9.5,
                halfLength: 4.75,
                width: 3.4,
                halfWidth: 1.7,
                height: 3.6,
                mass: 45000,
                offset: 13.20,
                wheelRadius: 0.52,
                wheels: tenderWheels,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            // 3. PASSENGER COACH 1 ("GRIFFIN ROCK COMMUTER")
            const coach1Root = new THREE.Group();
            const coach1Wheels = [];

            const coach1Chassis = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.45, 14.6), matTrainDark);
            coach1Chassis.position.set(0, 0.95, 0);
            const coach1Body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 14.2), matTrainCoachBody);
            coach1Body.position.set(0, 2.35, 0);
            const coach1Stripe = new THREE.Mesh(new THREE.BoxGeometry(3.44, 0.25, 14.25), matTrainCoachStripe);
            coach1Stripe.position.set(0, 1.7, 0);
            const coach1Roof = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.4, 14.3), matTrainCoachRoof);
            coach1Roof.position.set(0, 3.7, 0);
            coach1Root.add(coach1Chassis, coach1Body, coach1Stripe, coach1Roof);

            [-1.72, 1.72].forEach(wx => {
                for (let wz = -5.0; wz <= 5.0; wz += 1.65) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 1.15), matTrainWindow);
                    win.position.set(wx, 2.65, wz);
                    coach1Root.add(win);
                }
            });

            [-5.0, 5.0].forEach(bz => {
                const bogie = makeTrainBogie(3.0, 3.2, 0.52);
                bogie.group.position.set(0, 0, bz);
                coach1Root.add(bogie.group);
                coach1Wheels.push(...bogie.wheels);
            });

            applyCartoonInkOutlines(coach1Root, 1.035, true);
            scene.add(coach1Root);

            islandTrain.cars.push({
                name: "Coach 1",
                root: coach1Root,
                length: 15.0,
                halfLength: 7.50,
                width: 3.5,
                halfWidth: 1.75,
                height: 4.0,
                mass: 42000,
                offset: 26.65,
                wheelRadius: 0.52,
                wheels: coach1Wheels,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            // 4. PASSENGER COACH 2 ("COASTAL PANORAMA DOME")
            const coach2Root = new THREE.Group();
            const coach2Wheels = [];

            const coach2Chassis = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.45, 14.6), matTrainDark);
            coach2Chassis.position.set(0, 0.95, 0);
            const coach2Body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 14.2), matTrainCoachBody);
            coach2Body.position.set(0, 2.35, 0);
            const coach2Stripe = new THREE.Mesh(new THREE.BoxGeometry(3.44, 0.25, 14.25), matTrainCoachStripe);
            coach2Stripe.position.set(0, 1.7, 0);
            const coach2Roof = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.4, 14.3), matTrainCoachRoof);
            coach2Roof.position.set(0, 3.7, 0);
            coach2Root.add(coach2Chassis, coach2Body, coach2Stripe, coach2Roof);

            const domeBase = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.35, 6.8), matTrainDark);
            domeBase.position.set(0, 3.95, 0);
            const domeGlass = new THREE.Mesh(
                new THREE.CylinderGeometry(1.65, 1.65, 6.6, 16, 1, false, 0, Math.PI).rotateX(-Math.PI / 2).rotateZ(-Math.PI / 2),
                matTrainDomeGlass
            );
            domeGlass.position.set(0, 4.15, 0);
            coach2Root.add(domeBase, domeGlass);

            [-1.72, 1.72].forEach(wx => {
                [-5.0, -3.5, 3.5, 5.0].forEach(wz => {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 1.15), matTrainWindow);
                    win.position.set(wx, 2.65, wz);
                    coach2Root.add(win);
                });
            });

            [-5.0, 5.0].forEach(bz => {
                const bogie = makeTrainBogie(3.0, 3.2, 0.52);
                bogie.group.position.set(0, 0, bz);
                coach2Root.add(bogie.group);
                coach2Wheels.push(...bogie.wheels);
            });

            applyCartoonInkOutlines(coach2Root, 1.035, true);
            scene.add(coach2Root);

            islandTrain.cars.push({
                name: "Coach 2 Dome",
                root: coach2Root,
                length: 15.0,
                halfLength: 7.50,
                width: 3.5,
                halfWidth: 1.75,
                height: 4.6,
                mass: 44000,
                offset: 42.85,
                wheelRadius: 0.52,
                wheels: coach2Wheels,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            // 5. PASSENGER COACH 3 ("ISLAND DINING LOUNGE")
            const coach3Root = new THREE.Group();
            const coach3Wheels = [];

            const coach3Chassis = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.45, 14.6), matTrainDark);
            coach3Chassis.position.set(0, 0.95, 0);
            const coach3Body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 14.2), matTrainCoachBody);
            coach3Body.position.set(0, 2.35, 0);
            const coach3Stripe = new THREE.Mesh(new THREE.BoxGeometry(3.44, 0.25, 14.25), matTrainCoachStripe);
            coach3Stripe.position.set(0, 1.7, 0);
            const coach3Roof = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.4, 14.3), matTrainCoachRoof);
            coach3Roof.position.set(0, 3.7, 0);
            coach3Root.add(coach3Chassis, coach3Body, coach3Stripe, coach3Roof);

            [-1.72, 1.72].forEach(wx => {
                for (let wz = -4.8; wz <= 4.8; wz += 2.4) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.8), matTrainWindow);
                    win.position.set(wx, 2.65, wz);
                    coach3Root.add(win);
                }
            });

            [-5.0, 5.0].forEach(bz => {
                const bogie = makeTrainBogie(3.0, 3.2, 0.52);
                bogie.group.position.set(0, 0, bz);
                coach3Root.add(bogie.group);
                coach3Wheels.push(...bogie.wheels);
            });

            applyCartoonInkOutlines(coach3Root, 1.035, true);
            scene.add(coach3Root);

            islandTrain.cars.push({
                name: "Coach 3 Diner",
                root: coach3Root,
                length: 15.0,
                halfLength: 7.50,
                width: 3.5,
                halfWidth: 1.75,
                height: 4.0,
                mass: 42000,
                offset: 59.05,
                wheelRadius: 0.52,
                wheels: coach3Wheels,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            // 6. INDUSTRIAL FREIGHT FLATCAR
            const flatcarRoot = new THREE.Group();
            const flatcarWheels = [];

            const flatcarChassis = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 12.6), matTrainDark);
            flatcarChassis.position.set(0, 0.95, 0);
            const timberDeck = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.18, 12.4), matWoodDeck);
            timberDeck.position.set(0, 1.25, 0);
            flatcarRoot.add(flatcarChassis, timberDeck);

            const crate1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 3.2), matWoodDeck);
            crate1.position.set(0, 2.15, -3.4);
            const crate2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 2.6), matWoodDeck);
            crate2.position.set(0, 2.05, 3.4);

            const energonCrate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.2), matTrainDark);
            energonCrate.position.set(0, 2.25, 0);
            const energonCore = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 2.25), matEnergonCanister);
            energonCore.position.set(0, 2.25, 0);
            flatcarRoot.add(crate1, crate2, energonCrate, energonCore);

            [-4.4, 4.4].forEach(bz => {
                const bogie = makeTrainBogie(2.8, 3.2, 0.52);
                bogie.group.position.set(0, 0, bz);
                flatcarRoot.add(bogie.group);
                flatcarWheels.push(...bogie.wheels);
            });

            applyCartoonInkOutlines(flatcarRoot, 1.035, true);
            scene.add(flatcarRoot);

            islandTrain.cars.push({
                name: "Flatcar",
                root: flatcarRoot,
                length: 13.0,
                halfLength: 6.50,
                width: 3.4,
                halfWidth: 1.70,
                height: 3.2,
                mass: 38000,
                offset: 74.25,
                wheelRadius: 0.52,
                wheels: flatcarWheels,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            // 7. OBSERVATION CABOOSE
            const cabooseRoot = new THREE.Group();
            const cabooseWheels = [];

            const cabooseChassis = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 12.2), matTrainDark);
            cabooseChassis.position.set(0, 0.95, 0);
            const cabooseBody = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.3, 9.6), matTrainCabooseRed);
            cabooseBody.position.set(0, 2.3, 0.8);
            const cupola = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 3.4), matTrainCabooseRed);
            cupola.position.set(0, 3.8, 0.8);
            const cupolaRoof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 3.6), matTrainDark);
            cupolaRoof.position.set(0, 4.45, 0.8);
            cabooseRoot.add(cabooseChassis, cabooseBody, cupola, cupolaRoof);

            const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 2.2), matWoodDeck);
            balconyDeck.position.set(0, 1.25, -4.8);
            const balconyRailing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 0.08), matTrainDark);
            balconyRailing.position.set(0, 1.75, -5.8);
            cabooseRoot.add(balconyDeck, balconyRailing);

            [-1.45, 1.45].forEach(lx => {
                const markerLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), matTrainTailRed);
                markerLamp.position.set(lx, 2.2, -5.6);
                cabooseRoot.add(markerLamp);
            });

            [-3.8, 3.8].forEach(bz => {
                const bogie = makeTrainBogie(2.8, 3.2, 0.52);
                bogie.group.position.set(0, 0, bz);
                cabooseRoot.add(bogie.group);
                cabooseWheels.push(...bogie.wheels);
            });

            applyCartoonInkOutlines(cabooseRoot, 1.035, true);
            scene.add(cabooseRoot);

            islandTrain.cars.push({
                name: "Caboose",
                root: cabooseRoot,
                length: 12.5,
                halfLength: 6.25,
                width: 3.4,
                halfWidth: 1.70,
                height: 4.5,
                mass: 32000,
                offset: 88.20,
                wheelRadius: 0.52,
                wheels: cabooseWheels,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
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
    s.add(railwayLoopMesh);

    // 4 Grade Crossings
    railroadCrossings.length = 0;
    createRailroadCrossing(0, 620, true);       // South NS Highway Crossing
    createRailroadCrossing(0, -730, true);      // North NS Highway Crossing
    createRailroadCrossing(765, 25, false);     // East EW Highway Crossing
    createRailroadCrossing(-765, 25, false);    // West EW Highway Crossing

    centralStationGroup = buildCentralRailwayStation();

    buildIslandTrainSystem();

    if (typeof window !== 'undefined') {
        window.railroadCrossings = railroadCrossings;
        window.centralStationGroup = centralStationGroup;
        window.islandTrain = islandTrain;
    }
}

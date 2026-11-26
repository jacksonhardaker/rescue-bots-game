// Pure Zero-Side-Effect 3D Builders for Griffin Rock Island Railway, Crossings, Station & 7-Car Train
import * as THREE from 'three';
import {
    toonGrad3,
    toonGrad4,
    matNPCHeadlightOn,
    matNPCBeam,
    matNPCBeamPool,
    applyCartoonInkOutlines
} from '../rendering/materials.js';

export const matHazardYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
export const matCrossRedOff = new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGrad3 });
export const matCrossRedOn = new THREE.MeshBasicMaterial({ color: 0xff0033 });
export const matCrossPole = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 });
export const matCrossSign = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });

export const matTrainLocoBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
export const matTrainLocoGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
export const matTrainLocoRed = new THREE.MeshToonMaterial({ color: 0xb91c1c, gradientMap: toonGrad4 });
export const matTrainDark = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
export const matTrainWheelHub = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
export const matTrainWheelRim = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad4 });
export const matTrainCoachBody = new THREE.MeshToonMaterial({ color: 0x1e40af, gradientMap: toonGrad4 });
export const matTrainCoachStripe = new THREE.MeshToonMaterial({ color: 0xfef08a, gradientMap: toonGrad3 });
export const matTrainCoachRoof = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
export const matTrainWindow = new THREE.MeshBasicMaterial({ color: 0xfef08a });
export const matTrainDomeGlass = new THREE.MeshToonMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 });
export const matTrainCabooseRed = new THREE.MeshToonMaterial({ color: 0xc2410c, gradientMap: toonGrad4 });
export const matTrainTailRed = new THREE.MeshBasicMaterial({ color: 0xff0033 });
export const matTrainHeadlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
export const matTrainBeam = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
export const matEnergonCanister = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
export const matWoodDeck = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });

export function makeTrainFlangedWheel(radius: number, width = 0.28) {
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
    const wheels: THREE.Group[] = [];
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

export function buildRailroadCrossingMesh(isNSHighway = true) {
    const crossG = new THREE.Group();

    const padW = isNSHighway ? 20.0 : 16.0;
    const padL = isNSHighway ? 16.0 : 20.0;
    const padMesh = new THREE.Mesh(
        new THREE.BoxGeometry(padW, 0.22, padL),
        new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3, polygonOffset: true, polygonOffsetFactor: -0.6, polygonOffsetUnits: -2.0 })
    );
    padMesh.position.set(0, 0.08, 0);
    padMesh.receiveShadow = true;
    crossG.add(padMesh);

    const lamps: Array<{ mesh: THREE.Mesh; phase: number }> = [];
    const masts = [-11.5, 11.5];

    masts.forEach(mSide => {
        const mastG = new THREE.Group();
        if (isNSHighway) mastG.position.set(mSide, 0, mSide > 0 ? -5.5 : 5.5);
        else mastG.position.set(mSide > 0 ? -5.5 : 5.5, 0, mSide);

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), matHazardYellow);
        base.position.set(0, 0.3, 0);
        mastG.add(base);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.8, 8), matCrossPole);
        pole.position.set(0, 2.7, 0);
        mastG.add(pole);

        [-Math.PI / 4, Math.PI / 4].forEach(rot => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.26, 0.08), matCrossSign);
            arm.position.set(0, 4.4, 0.12);
            arm.rotation.z = rot;
            mastG.add(arm);
        });

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

    applyCartoonInkOutlines(crossG, 1.035, true);
    return { root: crossG, lamps };
}

export function buildCentralRailwayStationMesh() {
    const stationG = new THREE.Group();

    const platGeo = new THREE.BoxGeometry(7.5, 1.25, 46.0);
    const matPlat = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
    const platform = new THREE.Mesh(platGeo, matPlat);
    platform.position.set(11.3, 0.62, 0);
    platform.receiveShadow = true;
    stationG.add(platform);

    const edgeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 46.0), matHazardYellow);
    edgeStrip.position.set(7.7, 1.27, 0);
    stationG.add(edgeStrip);

    const matCanopyRoof = new THREE.MeshToonMaterial({ color: 0x166534, gradientMap: toonGrad4 });
    const matWoodPillar = new THREE.MeshToonMaterial({ color: 0x5c3a21, gradientMap: toonGrad3 });
    const matGoldLetter = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const matNavySign = new THREE.MeshToonMaterial({ color: 0x1e3a8a, gradientMap: toonGrad3 });

    [-16, 0, 16].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.4, 0.45), matWoodPillar);
        pillar.position.set(12.8, 2.8, pz);
        stationG.add(pillar);
    });

    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.28, 42.0).rotateZ(0.24), matCanopyRoof);
    roofLeft.position.set(12.3, 5.2, 0);
    stationG.add(roofLeft);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 14.5), matNavySign);
    signBoard.position.set(8.6, 4.2, 0);
    const signText = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 13.8), matGoldLetter);
    signText.position.set(8.6, 4.2, 0);
    stationG.add(signBoard, signText);

    const clockTower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 1.6), matWoodPillar);
    clockTower.position.set(14.3, 6.2, 0);
    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    clockFace.position.set(13.45, 6.8, 0);
    stationG.add(clockTower, clockFace);

    [-10, 10].forEach(bz => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 3.8), matWoodPillar);
        bench.position.set(13.0, 1.55, bz);
        stationG.add(bench);
    });

    applyCartoonInkOutlines(stationG, 1.045, true);
    return { root: stationG };
}

// 1. LOCOMOTIVE ("THE GRIFFIN ROCK TITAN", NO. 401)
export function buildTrainLocomotiveMesh(includeBeams = true) {
    const locoRoot = new THREE.Group();
    const wheels: THREE.Group[] = [];
    const connectingRods: THREE.Mesh[] = [];

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

    const hLightCase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.6, 16).rotateX(Math.PI / 2), matTrainDark);
    hLightCase.position.set(0, 3.8, 6.6);
    const hLightLens = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), matNPCHeadlightOn);
    hLightLens.position.set(0, 3.8, 6.95);
    hLightLens.userData.noOutline = true;
    locoRoot.add(hLightCase, hLightLens);

    [-1.25, 1.25].forEach(lx => {
        const ditchCase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.35), matTrainDark);
        ditchCase.position.set(lx, 1.22, 6.65);
        const ditchLens = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.15), matNPCHeadlightOn);
        ditchLens.position.set(lx, 1.22, 6.84);
        ditchLens.userData.noOutline = true;
        locoRoot.add(ditchCase, ditchLens);
    });

    const trainBeamGroup = new THREE.Group();
    if (includeBeams) {
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
    }

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
        wheels.push(wL);

        const wR = makeTrainFlangedWheel(0.88, 0.35);
        wR.rotation.y = Math.PI;
        wR.position.set(1.6, 0.88, wz);
        locoRoot.add(wR);
        wheels.push(wR);
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
    wheels.push(...pilotBogie.wheels);

    applyCartoonInkOutlines(locoRoot, 1.035, true);
    return { root: locoRoot, wheels, connectingRods, beamGroup: trainBeamGroup };
}

// 2. COAL & ENERGON BOOSTER TENDER
export function buildTrainTenderMesh() {
    const tenderRoot = new THREE.Group();
    const wheels: THREE.Group[] = [];

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
        wheels.push(...bogie.wheels);
    });

    applyCartoonInkOutlines(tenderRoot, 1.035, true);
    return { root: tenderRoot, wheels };
}

// 3. PASSENGER COACH 1 ("GRIFFIN ROCK COMMUTER")
export function buildTrainCommuterCoachMesh() {
    const coach1Root = new THREE.Group();
    const wheels: THREE.Group[] = [];

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
        wheels.push(...bogie.wheels);
    });

    applyCartoonInkOutlines(coach1Root, 1.035, true);
    return { root: coach1Root, wheels };
}

// 4. PASSENGER COACH 2 ("COASTAL PANORAMA DOME")
export function buildTrainDomeCoachMesh() {
    const coach2Root = new THREE.Group();
    const wheels: THREE.Group[] = [];

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
        wheels.push(...bogie.wheels);
    });

    applyCartoonInkOutlines(coach2Root, 1.035, true);
    return { root: coach2Root, wheels };
}

// 5. PASSENGER COACH 3 ("ISLAND DINING LOUNGE")
export function buildTrainDiningCoachMesh() {
    const coach3Root = new THREE.Group();
    const wheels: THREE.Group[] = [];

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
        wheels.push(...bogie.wheels);
    });

    applyCartoonInkOutlines(coach3Root, 1.035, true);
    return { root: coach3Root, wheels };
}

// 6. INDUSTRIAL FREIGHT FLATCAR
export function buildTrainFlatcarMesh() {
    const flatcarRoot = new THREE.Group();
    const wheels: THREE.Group[] = [];

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
        wheels.push(...bogie.wheels);
    });

    applyCartoonInkOutlines(flatcarRoot, 1.035, true);
    return { root: flatcarRoot, wheels };
}

// 7. OBSERVATION CABOOSE
export function buildTrainCabooseMesh() {
    const cabooseRoot = new THREE.Group();
    const wheels: THREE.Group[] = [];

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
        wheels.push(...bogie.wheels);
    });

    applyCartoonInkOutlines(cabooseRoot, 1.035, true);
    return { root: cabooseRoot, wheels };
}

// Pure Zero-Side-Effect 3D Builders for Allied Bots, Servo & Mega Gear Trailers
import * as THREE from 'three';
import {
    toonGrad4, matHighTideWhite, matHighTideNavy, matHighTideBlue, matHighTideGold, matHighTideCyanGlow,
    matMegaHullWhite, matMegaDeckRed, matMegaKneeGold, matMegaHullBadge, matMegaWindowBlue, matMegaScreenCyan,
    matMegaCraneYellow, matMegaClawCharcoal, matMegaTrailerSilver, matMegaTrailerStripe,
    matChrome, matDarkSteel, matSirenRed, matOptimusGold, applyCartoonInkOutlines,
    matHazardMat, matTire, matVisorGold,
    matBeeYellow, matBeeBlack, matBeeGlowCyan,
    matBlurrPurple, matBlurrNeonGreen, matBlurrViolet,
    matSalvageSteel, matSalvageOrange, matSalvageLime,
    matQuickDark, matQuickCyan, matQuickSilver
} from '../rendering/materials.js';
import { createWheelAssembly } from '../bots/botHelpers.js';

// SERVO (High Tide's Faithful Cyber-Dog Companion)
export function buildServoPupModel() {
    const root = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.45, 10).rotateX(Math.PI / 2), matHighTideWhite);
    body.position.y = 0.85;
    body.castShadow = true;
    root.add(body);

    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.95), matHighTideNavy);
    saddle.position.set(0, 1.38, 0);
    root.add(saddle);

    const head = new THREE.Group();
    head.position.set(0, 1.25, 0.85);
    root.add(head);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), matHighTideWhite);
    skull.position.y = 0.35;
    head.add(skull);

    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.55), matHighTideWhite);
    muzzle.position.set(0, 0.22, 0.58);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), matHighTideNavy);
    nose.position.set(0, 0.35, 0.86);
    head.add(muzzle, nose);

    const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.12), matBeeGlowCyan);
    eyeVisor.position.set(0, 0.48, 0.44);
    eyeVisor.userData.noOutline = true;
    head.add(eyeVisor);

    const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.35), matHighTideNavy);
    leftEar.position.set(-0.48, 0.45, -0.05);
    leftEar.rotation.z = 0.3;
    const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.35), matHighTideNavy);
    rightEar.position.set(0.48, 0.45, -0.05);
    rightEar.rotation.z = -0.3;
    head.add(leftEar, rightEar);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 10).rotateX(Math.PI / 2), matHighTideGold);
    collar.position.set(0, 1.05, 0.65);
    root.add(collar);

    [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.32), matHighTideNavy);
        leg.position.set(px, 0.35, pz);
        const paw = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.45), matChrome);
        paw.position.set(px, 0.11, pz + 0.08);
        root.add(leg, paw);
    });

    const tail = new THREE.Group();
    tail.position.set(0, 1.05, -0.75);
    const tailStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8), matChrome);
    tailStem.position.set(0, 0.25, -0.2);
    tailStem.rotation.x = -0.75;
    const tailBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), matBeeGlowCyan);
    tailBulb.position.set(0, 0.48, -0.42);
    tailBulb.userData.noOutline = true;
    tail.add(tailStem, tailBulb);
    root.add(tail);

    applyCartoonInkOutlines(root, 1.06, true);
    return { root, head, leftEar, rightEar, tail };
}

// HIGH TIDE CYBERTRONIAN OCEANIC RESCUE VESSEL
export function createHighTideShipMesh() {
    const ship = new THREE.Group();

    const hullMid = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.6, 22.0), matMegaHullWhite);
    hullMid.position.set(0, 1.2, -1.0);
    hullMid.castShadow = true;
    ship.add(hullMid);

    const bowProw = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.8, 10.0), matMegaHullWhite);
    bowProw.position.set(0, 1.3, 11.0);
    bowProw.castShadow = true;
    ship.add(bowProw);

    const bowNose = new THREE.Mesh(new THREE.ConeGeometry(4.8, 7.5, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4), matMegaHullWhite);
    bowNose.position.set(0, 1.2, 16.5);
    bowNose.scale.set(1.1, 0.72, 1.0);
    bowNose.castShadow = true;
    ship.add(bowNose);

    [-1, 1].forEach(side => {
        const redStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 11.5), matMegaDeckRed);
        redStripe.position.set(side * 5.32, 1.8, 3.5);
        redStripe.rotation.z = side * 0.05;
        ship.add(redStripe);

        const goldPort = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.22, 16).rotateZ(Math.PI / 2), matMegaKneeGold);
        goldPort.position.set(side * 5.33, 0.6, 8.5);
        const portCore = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16).rotateZ(Math.PI / 2), matHighTideCyanGlow);
        portCore.position.set(side * 5.34, 0.6, 8.5);
        portCore.userData.noOutline = true;

        const portFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 4.2), matMegaKneeGold);
        portFin.position.set(side * 5.33, 0.6, 5.8);
        ship.add(goldPort, portCore, portFin);

        const anchorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 2.2), matMegaHullBadge);
        anchorPlate.position.set(side * 5.33, 1.5, 12.5);
        anchorPlate.userData.noOutline = true;
        ship.add(anchorPlate);
    });

    const keel = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 26.0, 16).rotateX(Math.PI / 2), matHighTideNavy);
    keel.position.set(0, -0.6, 0.5);
    keel.scale.set(1.2, 0.65, 1.0);
    ship.add(keel);

    const bulbDome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), matHighTideNavy);
    bulbDome.position.set(0, -0.6, 13.8);
    bulbDome.scale.set(1.1, 0.7, 1.5);
    ship.add(bulbDome);

    const bridgeBase = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.4, 8.5), matMegaHullWhite);
    bridgeBase.position.set(0, 3.7, -1.0);
    ship.add(bridgeBase);

    const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.2, 6.8), matMegaDeckRed);
    bridgeTower.position.set(0, 6.2, -1.0);
    bridgeTower.castShadow = true;
    ship.add(bridgeTower);

    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.6, 0.2), matMegaWindowBlue);
    frontWindow.position.set(0, 7.1, 2.45);
    frontWindow.userData.noOutline = true;
    ship.add(frontWindow);

    [-1, 1].forEach(side => {
        const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 4.2), matMegaWindowBlue);
        sideWindow.position.set(side * 3.65, 7.1, -0.8);
        sideWindow.userData.noOutline = true;
        ship.add(sideWindow);
    });

    const bridgeCrest = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 0.18), matMegaScreenCyan);
    bridgeCrest.position.set(0, 5.2, 2.45);
    bridgeCrest.userData.noOutline = true;
    ship.add(bridgeCrest);

    const helmDome = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.5), matHighTideBlue);
    helmDome.position.set(0, 8.8, -1.0);
    const helmVisor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.5), matHighTideCyanGlow);
    helmVisor.position.set(0, 8.8, -0.3);
    helmVisor.userData.noOutline = true;
    const helmGoldLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12).rotateX(Math.PI / 2), matHighTideGold);
    helmGoldLamp.position.set(0, 9.4, -0.2);
    ship.add(helmDome, helmVisor, helmGoldLamp);

    const railMat = matMegaCraneYellow;
    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.7, 0.1), railMat);
    frontRail.position.set(0, 8.5, 2.4);
    ship.add(frontRail);

    const cranes: any[] = [];
    [-1, 1].forEach(side => {
        const craneBase = new THREE.Group();
        craneBase.position.set(side * 4.6, 3.2, 4.5);

        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.4, 16), matMegaHullWhite);
        turret.position.y = 0.7;
        const turretRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 8, 16).rotateX(Math.PI / 2), railMat);
        turretRing.position.y = 1.4;
        craneBase.add(turret, turretRing);

        const boomPivot = new THREE.Group();
        boomPivot.position.set(0, 1.5, 0);

        const lowerBoom = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.8, 0.85), matMegaCraneYellow);
        lowerBoom.position.set(0, 2.2, 0);
        lowerBoom.castShadow = true;

        const hydroCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 3.2, 10), matQuickSilver);
        hydroCyl.position.set(side * 0.45, 1.8, 0);
        hydroCyl.userData.noOutline = true;

        const elbowHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.95, 16).rotateZ(Math.PI / 2), matMegaCraneYellow);
        elbowHinge.position.set(0, 4.6, 0);

        const upperBoom = new THREE.Mesh(new THREE.BoxGeometry(0.68, 4.2, 0.75), matMegaCraneYellow);
        upperBoom.position.set(0, 6.2, 1.2);
        upperBoom.rotation.x = 0.55;
        upperBoom.castShadow = true;

        const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.45, 12), matMegaClawCharcoal);
        wrist.position.set(0, 7.8, 2.3);

        const clawGroup = new THREE.Group();
        clawGroup.position.set(0, 8.0, 2.3);
        for (let j = 0; j < 3; j++) {
            const jawAng = (j * Math.PI * 2) / 3;
            const clawJaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.4, 0.45), matMegaClawCharcoal);
            clawJaw.position.set(Math.cos(jawAng) * 0.6, 0.6, Math.sin(jawAng) * 0.6);
            clawJaw.rotation.z = Math.cos(jawAng) * 0.35;
            clawJaw.rotation.x = Math.sin(jawAng) * 0.35;
            clawGroup.add(clawJaw);
        }

        boomPivot.add(lowerBoom, hydroCyl, elbowHinge, upperBoom, wrist, clawGroup);
        boomPivot.rotation.z = side * -0.25;
        boomPivot.rotation.y = side * 0.35;
        craneBase.add(boomPivot);
        ship.add(craneBase);
        cranes.push({ base: craneBase, boom: boomPivot, claws: clawGroup });
    });
    ship.userData.cranes = cranes;

    const thrusters: any[] = [];
    [-2.6, 2.6].forEach(tx => {
        const duct = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 3.8, 16).rotateX(Math.PI / 2), matMegaHullWhite);
        duct.position.set(tx, 0.4, -12.5);
        const goldCowl = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.45, 16).rotateX(Math.PI / 2), matMegaKneeGold);
        goldCowl.position.set(tx, 0.4, -10.6);
        ship.add(duct, goldCowl);

        const propHub = new THREE.Group();
        propHub.position.set(tx, 0.4, -14.4);
        for (let b = 0; b < 4; b++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 0.12), matMegaKneeGold);
            blade.rotation.z = (b * Math.PI) / 2;
            blade.position.y = 0.5;
            propHub.add(blade);
        }
        const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 12).rotateX(-Math.PI / 2), matHighTideNavy);
        propHub.add(noseCone);
        ship.add(propHub);
        thrusters.push(propHub);
    });
    ship.userData.thrusters = thrusters;

    applyCartoonInkOutlines(ship, 1.035, true);
    return ship;
}

// OPTIMUS PRIME APEX COMMAND TRAILER
export function createOptimusTrailerMesh() {
    const trailer = new THREE.Group();

    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.92, 3.25, 12.5), matMegaTrailerSilver);
    hull.position.set(0, 2.385, 0);
    hull.castShadow = true;
    trailer.add(hull);

    [-1.48, 1.48].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 12.2), matMegaTrailerStripe);
        stripe.position.set(sx, 2.385, 0);
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 12.0), matDarkSteel);
        skirt.position.set(sx, 0.96, 0);
        const starDecal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 1.0), matOptimusGold);
        starDecal.position.set(sx * 1.01, 2.385, 2.55);
        starDecal.userData.noOutline = true;
        trailer.add(stripe, skirt, starDecal);
    });

    [3.55, -1.95].forEach(tz => {
        const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.70, 0.30, 14), matDarkSteel);
        tBase.position.set(0, 4.16, tz);
        const tBoom = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.40, 1.5), matMegaTrailerSilver);
        tBoom.position.set(0, 4.41, tz + 0.3);
        [-0.20, 0.20].forEach(nx => {
            const tNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 1.6, 10).rotateX(Math.PI / 2), matChrome);
            tNozzle.position.set(nx, 4.41, tz + 1.1);
            trailer.add(tNozzle);
        });
        trailer.add(tBase, tBoom);
    });

    const trBumper = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.45, 0.35), matDarkSteel);
    trBumper.position.set(0, 0.96, -6.3);
    trailer.add(trBumper);
    [-1.05, 1.05].forEach(tx => {
        const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.20, 0.12), matSirenRed);
        tailL.position.set(tx, 0.96, -6.47);
        tailL.userData.noOutline = true;
        trailer.add(tailL);
    });

    [-2.15, -4.15].forEach(wz => {
        [-1.52, 1.52].forEach(wx => {
            const wheel = createWheelAssembly(0.76, 0.52);
            wheel.position.set(wx, 0.76, wz);
            trailer.add(wheel);
        });
    });

    [-1.05, 1.05].forEach(lx => {
        const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.74, 8), matDarkSteel);
        legPost.position.set(lx, 0.43, 3.8);
        const legFoot = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.48), matDarkSteel);
        legFoot.position.set(lx, 0.06, 3.8);
        trailer.add(legPost, legFoot);
    });

    const kingpin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 10), matChrome);
    kingpin.position.set(0, 0.65, 5.2);
    trailer.add(kingpin);

    applyCartoonInkOutlines(trailer, 1.035, true);
    return trailer;
}

// Boulder Heavy Dump Truck Bucket
export function createBoulderBucketMesh() {
    const bucket = new THREE.Group();
    const matYellow = new THREE.MeshToonMaterial({ color: 0xffcc00, gradientMap: toonGrad4 });
    const matGreen = new THREE.MeshToonMaterial({ color: 0x76d31b, gradientMap: toonGrad4 });

    const subframe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 5.0), matDarkSteel);
    subframe.position.set(0, 0.6, 0);
    subframe.castShadow = true;
    bucket.add(subframe);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.35, 4.8), matYellow);
    floor.position.set(0, 1.0, 0);
    floor.castShadow = true;
    bucket.add(floor);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.85, 0.35), matYellow);
    headboard.position.set(0, 2.05, 2.3);
    const cabOverhang = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.28, 1.8), matGreen);
    cabOverhang.position.set(0, 2.95, 1.5);
    cabOverhang.rotation.x = -0.15;
    bucket.add(headboard, cabOverhang);

    [-1.35, 1.35].forEach(sx => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.6, 4.8), matYellow);
        wall.position.set(sx, 1.95, 0);
        wall.castShadow = true;
        bucket.add(wall);
        for (let r = -1.8; r <= 1.8; r += 0.9) {
            const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.22), matDarkSteel);
            rib.position.set(sx * 1.06, 1.95, r);
            bucket.add(rib);
        }
    });

    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.5, 0.28), matYellow);
    tailgate.position.set(0, 1.95, -2.35);
    const hazardPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.12), matHazardMat);
    hazardPlate.position.set(0, 1.55, -2.48);
    hazardPlate.userData.noOutline = true;
    bucket.add(tailgate, hazardPlate);

    [-0.8, -2.4].forEach(wz => {
        [-1.55, 1.55].forEach(wx => {
            const wheel = createWheelAssembly(0.85, 0.58);
            wheel.position.set(wx, 0.85, wz);
            bucket.add(wheel);
        });
    });

    applyCartoonInkOutlines(bucket, 1.035, true);
    return bucket;
}

// Chase Police Command Trailer
export function createChaseTrailerMesh() {
    const trailer = new THREE.Group();
    const matBlue = new THREE.MeshToonMaterial({ color: 0x1648b8, gradientMap: toonGrad4 });
    const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });

    const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.75, 3.1, 10.5), matBlue);
    trHull.position.set(0, 2.3, 0);
    trHull.castShadow = true;
    trailer.add(trHull);

    [-1.39, 1.39].forEach(sx => {
        const whitePanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 9.8), matWhite);
        whitePanel.position.set(sx, 2.3, 0);
        const goldBadge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.9), matOptimusGold);
        goldBadge.position.set(sx * 1.01, 2.3, 2.0);
        goldBadge.userData.noOutline = true;
        trailer.add(whitePanel, goldBadge);
    });

    const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.3, 12), matDarkSteel);
    radarBase.position.set(0, 4.0, 2.5);
    const radarDish = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45).rotateX(-Math.PI * 0.4), matChrome);
    radarDish.position.set(0, 4.5, 2.5);
    trailer.add(radarBase, radarDish);

    [-1.9, -1.9].forEach(wz => {
        [-1.42, 1.42].forEach(wx => {
            const wheel = createWheelAssembly(0.74, 0.48);
            wheel.position.set(wx, 0.74, wz);
            trailer.add(wheel);
        });
    });

    [-1.0, 1.0].forEach(lx => {
        const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.74, 8), matDarkSteel);
        legPost.position.set(lx, 0.43, 3.8);
        trailer.add(legPost);
    });

    applyCartoonInkOutlines(trailer, 1.035, true);
    return trailer;
}

// Heatwave Aerial Ladder Trailer
export function createHeatwaveTrailerMesh() {
    const trailer = new THREE.Group();
    const matRed = new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad4 });

    const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.85, 2.8, 11.5), matRed);
    trHull.position.set(0, 2.2, 0);
    trHull.castShadow = true;
    trailer.add(trHull);

    [-1.44, 1.44].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 10.8), matChrome);
        stripe.position.set(sx, 2.65, 0);
        trailer.add(stripe);
    });

    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.45, 16), matDarkSteel);
    turntable.position.set(0, 3.8, 3.3);
    trailer.add(turntable);

    const ladderBoom = new THREE.Group();
    ladderBoom.position.set(0, 4.1, 3.3);
    trailer.add(ladderBoom);

    [-0.48, 0.48].forEach(lx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 8.5), matChrome);
        rail.position.set(lx, 0.15, -3.8);
        ladderBoom.add(rail);
        for (let r = -7.5; r <= 0; r += 0.85) {
            const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 6).rotateZ(Math.PI / 2), matChrome);
            rung.position.set(0, 0.15, r);
            ladderBoom.add(rung);
        }
    });

    [-2.1, -4.0].forEach(wz => {
        [-1.48, 1.48].forEach(wx => {
            const wheel = createWheelAssembly(0.76, 0.52);
            wheel.position.set(wx, 0.76, wz);
            trailer.add(wheel);
        });
    });

    [-1.0, 1.0].forEach(lx => {
        const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.76, 8), matDarkSteel);
        legPost.position.set(lx, 0.42, 3.8);
        const legFoot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), matDarkSteel);
        legFoot.position.set(lx, 0.04, 3.8);
        trailer.add(legPost, legFoot);
    });

    applyCartoonInkOutlines(trailer, 1.035, true);
    return trailer;
}

// Quickshadow Stealth Bomber Airframe
export function createQuickshadowBomberMesh() {
    const bomber = new THREE.Group();

    const centerFuselage = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 3.8), matQuickDark);
    centerFuselage.position.set(0, 1.2, 0);
    centerFuselage.castShadow = true;
    bomber.add(centerFuselage);

    [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 0.22, 2.8).rotateY(side * 0.35),
            matQuickDark
        );
        wing.position.set(side * 4.3, 1.2, -0.4);
        wing.castShadow = true;

        const leadingEdge = new THREE.Mesh(
            new THREE.BoxGeometry(4.6, 0.12, 0.25).rotateY(side * 0.35),
            matQuickCyan
        );
        leadingEdge.position.set(side * 4.3, 1.25, 0.9);
        leadingEdge.userData.noOutline = true;

        const intake = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 1.8), matQuickSilver);
        intake.position.set(side * 2.9, 1.55, -0.2);

        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.8, 8).rotateX(Math.PI / 2), matDarkSteel);
        exhaust.position.set(side * 2.9, 1.55, -1.5);

        bomber.add(wing, leadingEdge, intake, exhaust);
    });

    [[-1.8, -1.0], [1.8, -1.0], [0, 1.4]].forEach(([gx, gz]) => {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), matDarkSteel);
        strut.position.set(gx, 0.6, gz);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8).rotateZ(Math.PI / 2), matDarkSteel);
        wheel.position.set(gx, 0.25, gz);
        bomber.add(strut, wheel);
    });

    applyCartoonInkOutlines(bomber, 1.035, true);
    return bomber;
}

// Bumblebee Monster Truck Shell
export function createBumblebeeMonsterMesh() {
    const monster = new THREE.Group();

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 4.2), matBeeBlack);
    frame.position.set(0, 1.5, 0);
    frame.castShadow = true;
    monster.add(frame);

    [-1.25, 1.25].forEach(rx => {
        const barA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8).rotateX(0.25), matBeeYellow);
        barA.position.set(rx, 2.7, 0.6);
        const barB = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8).rotateX(-0.25), matBeeYellow);
        barB.position.set(rx, 2.7, -0.8);
        monster.add(barA, barB);
    });

    [-0.9, -0.3, 0.3, 0.9].forEach(lx => {
        const lightHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 10).rotateX(Math.PI / 2), matChrome);
        lightHousing.position.set(lx, 3.9, 0.5);
        const lightLens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10).rotateX(Math.PI / 2), matVisorGold);
        lightLens.position.set(lx, 3.9, 0.62);
        lightLens.userData.noOutline = true;
        monster.add(lightHousing, lightLens);
    });

    [[-1.85, 1.45], [1.85, 1.45], [-1.85, -1.55], [1.85, -1.55]].forEach(([wx, wz]) => {
        const tireMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.1, 18).rotateZ(Math.PI / 2), matTire);
        tireMesh.position.set(wx, 1.3, wz);
        tireMesh.castShadow = true;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.14, 12).rotateZ(Math.PI / 2), matBeeYellow);
        hub.position.set(wx, 1.3, wz);
        monster.add(tireMesh, hub);
    });

    applyCartoonInkOutlines(monster, 1.035, true);
    return monster;
}

// Blurr Speed Monster Shell
export function createBlurrMonsterMesh() {
    const speedMonster = new THREE.Group();

    const speedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 4.4), matBlurrViolet);
    speedFrame.position.set(0, 1.5, 0);
    speedFrame.castShadow = true;
    speedMonster.add(speedFrame);

    const blowerBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.4), matChrome);
    blowerBase.position.set(0, 3.1, 1.2);
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.9), matBlurrPurple);
    scoop.position.set(0, 3.65, 1.1);
    speedMonster.add(blowerBase, scoop);

    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.2), matBlurrPurple);
    mainWing.position.set(0, 3.8, -2.55);
    speedMonster.add(mainWing);

    [[-1.85, 1.45], [1.85, 1.45], [-1.85, -1.55], [1.85, -1.55]].forEach(([wx, wz]) => {
        const tireMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.1, 18).rotateZ(Math.PI / 2), matTire);
        tireMesh.position.set(wx, 1.3, wz);
        tireMesh.castShadow = true;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.14, 12).rotateZ(Math.PI / 2), matBlurrNeonGreen);
        hub.position.set(wx, 1.3, wz);
        speedMonster.add(tireMesh, hub);
    });

    applyCartoonInkOutlines(speedMonster, 1.035, true);
    return speedMonster;
}

// Salvage Industrial Dumpster
export function createSalvageDumpsterMesh() {
    const dumpster = new THREE.Group();

    const dumpsterBox = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 5.4), matSalvageSteel);
    dumpsterBox.position.set(0, 2.0, 0);
    dumpsterBox.castShadow = true;
    dumpster.add(dumpsterBox);

    [-1.62, 1.62].forEach(fx => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 2.8), matSalvageOrange);
        arm.position.set(fx, 1.2, 3.4);
        const fork = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), matSalvageOrange);
        fork.position.set(fx, 1.6, 4.6);
        dumpster.add(arm, fork);
    });

    const compactorDoor = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.0, 0.35), matSalvageLime);
    compactorDoor.position.set(0, 2.0, -2.8);
    const hazardStrip = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.12), matHazardMat);
    hazardStrip.position.set(0, 1.25, -3.0);
    hazardStrip.userData.noOutline = true;
    dumpster.add(compactorDoor, hazardStrip);

    [0.6, -1.4].forEach(wz => {
        [-1.65, 1.65].forEach(wx => {
            const wheel = createWheelAssembly(0.82, 0.55);
            wheel.position.set(wx, 0.82, wz);
            dumpster.add(wheel);
        });
    });

    applyCartoonInkOutlines(dumpster, 1.035, true);
    return dumpster;
}

// Blades Heavy Sky-Crane Cargo Pod
export function createBladesCargoMesh() {
    const cargo = new THREE.Group();
    const matOrange = new THREE.MeshToonMaterial({ color: 0xff6414, gradientMap: toonGrad4 });
    const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });

    const spineBoom = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 6.2), matOrange);
    spineBoom.position.set(0, 2.8, 0);
    spineBoom.castShadow = true;
    cargo.add(spineBoom);

    const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 4.6), matWhite);
    cargoBox.position.set(0, 1.4, 0.2);
    cargoBox.castShadow = true;
    cargo.add(cargoBox);

    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.4, 10), matWhite);
    pylon.position.set(0, 3.9, 2.4);
    [-1, 1].forEach(side => {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 4.8), matDarkSteel);
        blade.position.set(0, 4.6, 2.4 + side * 2.2);
        cargo.add(blade);
    });
    cargo.add(pylon);

    [-1.4, 1.4].forEach(sx => {
        const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.2, 8).rotateX(Math.PI / 2), matChrome);
        skid.position.set(sx, 0.35, 0.2);
        cargo.add(skid);
    });

    applyCartoonInkOutlines(cargo, 1.035, true);
    return cargo;
}

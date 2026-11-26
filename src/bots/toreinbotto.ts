// 3D Cel-Shaded Model & Morph Builder for TOREINBOTTO (Shouki-Inspired Shinkansen Rescue Trainbot)
// Modes: Bot Mode | Shinkansen 0-Series Bullet Train (Track-Only Vehicle) | Express Rail-Ferry Catamaran (Boat) | Sonic-Crest Parasaurolophus (Dino)
import * as THREE from 'three';
import {
    toonGrad3, toonGrad4, matDarkSteel, matChrome,
    matVisorCyan, applyCartoonInkOutlines
} from '../rendering/materials.js';
import { texWindshieldCyan } from '../rendering/textures.js';
import { makeTrainBogie } from '../world/railwayModels.js';
import { buildToreinbottoBoat } from './botBoats.js';
import type { BotRig } from '../types/game.js';

export function buildToreinbotto(parts: BotRig) {
    // Classic Trainbot Shouki / Tokaido Shinkansen 0-Series Palette
    const matWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
    const matCobalt = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
    const matSkyBlue = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad3 });
    const matCrimson = new THREE.MeshToonMaterial({ color: 0xef4444, gradientMap: toonGrad3 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const matSilverFace = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad3 });
    const matCabGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });
    const matHeadlight = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const matTailRed = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // =========================================================================
    // 1. HEROIC TRAINBOT TORSO (Shinkansen Bullet Nose Chest & Pantograph Pack)
    // =========================================================================
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.35, 1.95), matWhite);
    chest.castShadow = true;
    parts.torso.add(chest);

    // Classic Tokaido Blue horizontal chest band
    const chestBlueBand = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.56, 2.02), matCobalt);
    chestBlueBand.position.set(0, 0.25, 0);
    parts.torso.add(chestBlueBand);

    // Sculpted Shinkansen Bullet Nose Cone integrated into upper chest
    const chestNose = new THREE.Mesh(new THREE.SphereGeometry(0.86, 14, 12), matWhite);
    chestNose.scale.set(1.15, 0.72, 0.65);
    chestNose.position.set(0, 0.58, 0.94);
    parts.torso.add(chestNose);

    // Wraparound Shinkansen Engineer Cab Windshield across chest brow
    const chestVisor = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.42, 0.24), matCabGlass);
    chestVisor.position.set(0, 0.88, 0.95);
    chestVisor.rotation.x = -0.18;
    chestVisor.userData.noOutline = true;
    parts.torso.add(chestVisor);

    // Twin Chest Headlamps & Gold Express Emblem
    [-0.68, 0.68].forEach(hx => {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 10).rotateX(Math.PI / 2), matHeadlight);
        lamp.position.set(hx, 0.32, 1.08);
        lamp.userData.noOutline = true;
        parts.torso.add(lamp);
    });
    const centerEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.18), matCrimson);
    centerEmblem.position.set(0, -0.38, 0.98);
    const emblemTrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.22), matGold);
    emblemTrim.position.set(0, -0.38, 1.0);
    parts.torso.add(centerEmblem, emblemTrim);

    // Waist & Pelvis
    const waist = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 1.75), matCobalt);
    waist.position.set(0, -1.08, 0);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.68, 1.56), matDarkSteel);
    pelvis.position.set(0, -1.48, 0);
    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.36, 0.22), matGold);
    beltBuckle.position.set(0, -1.10, 0.88);
    parts.torso.add(waist, pelvis, beltBuckle);

    // Rear Roof-Pantograph Backpack & Twin Express Thruster Vents
    const backPack = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.95, 0.88), matWhite);
    backPack.position.set(0, 0.22, -1.20);
    backPack.castShadow = true;
    const backStripe = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.44, 0.92), matCobalt);
    backStripe.position.set(0, 0.22, -1.20);
    parts.torso.add(backPack, backStripe);

    // Shoulder-Rising Diamond Pantograph Fins
    [-0.78, 0.78].forEach(px => {
        const pantoStrut = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.15, 0.16), matChrome);
        pantoStrut.position.set(px, 1.48, -1.18);
        pantoStrut.rotation.z = px < 0 ? 0.22 : -0.22;
        const pantoCap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.22), matGold);
        pantoCap.position.set(px * 1.12, 2.02, -1.18);
        parts.torso.add(pantoStrut, pantoCap);
    });

    // =========================================================================
    // 2. HEROIC TRAINBOT HEAD (Cobalt Helmet + Gold Crest + Cyan Visor)
    // =========================================================================
    const helm = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.24, 1.28), matCobalt);
    helm.castShadow = true;
    parts.head.add(helm);

    const browCrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 1.16), matWhite);
    browCrest.position.set(0, 0.74, 0.04);
    const goldWingL = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.18), matGold);
    goldWingL.position.set(-0.34, 0.68, 0.62);
    goldWingL.rotation.z = -0.35;
    const goldWingR = goldWingL.clone();
    goldWingR.position.x = 0.34;
    goldWingR.rotation.z = 0.35;
    parts.head.add(browCrest, goldWingL, goldWingR);

    const facePlate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.88, 0.22), matSilverFace);
    facePlate.position.set(0, -0.06, 0.58);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.26, 0.18), matVisorCyan);
    visor.position.set(0, 0.14, 0.66);
    visor.userData.noOutline = true;
    const mouthGuard = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.24, 0.16), matCobalt);
    mouthGuard.position.set(0, -0.28, 0.66);
    parts.head.add(facePlate, visor, mouthGuard);

    // =========================================================================
    // 3. ARMS & RAIL-COUPLER FOREARMS
    // =========================================================================
    const buildArm = (armGroup: THREE.Group, forearmGroup: THREE.Group, side: number) => {
        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.12, 1.32), matWhite);
        pauldron.position.set(side * 0.12, 0.18, 0);
        pauldron.castShadow = true;
        const pauldronStripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.28, 1.36), matCobalt);
        pauldronStripe.position.set(side * 0.12, 0.18, 0);
        const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.05, 0.82), matDarkSteel);
        upperArm.position.set(0, -0.78, 0);
        armGroup.add(pauldron, pauldronStripe, upperArm);

        const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.48, 0.96), matCobalt);
        forearm.position.set(0, -0.68, 0.04);
        forearm.castShadow = true;
        const wristGuard = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.42, 1.04), matWhite);
        wristGuard.position.set(0, -1.12, 0.08);
        const railFist = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.56, 0.68), matDarkSteel);
        railFist.position.set(0, -1.58, 0.04);
        forearmGroup.add(forearm, wristGuard, railFist);
    };
    buildArm(parts.leftArm, parts.leftForearm, -1);
    buildArm(parts.rightArm, parts.rightForearm, 1);

    // =========================================================================
    // 4. LOCOMOTIVE LEG GREAVES & FLANGED ANKLE WHEELS
    // =========================================================================
    const buildLeg = (legGroup: THREE.Group, footGroup: THREE.Group, side: number) => {
        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.25, 0.96), matDarkSteel);
        thigh.position.set(0, -0.58, 0);
        const kneeCap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.56, 0.48), matGold);
        kneeCap.position.set(0, -1.16, 0.44);
        const shin = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.65, 1.28), matWhite);
        shin.position.set(0, -1.85, 0.05);
        shin.castShadow = true;
        const shinStripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.34, 1.32), matCobalt);
        shinStripe.position.set(0, -1.65, 0.05);
        const ankleWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 12).rotateZ(Math.PI / 2), matChrome);
        ankleWheel.position.set(side * 0.64, -2.32, -0.08);
        legGroup.add(thigh, kneeCap, shin, shinStripe, ankleWheel);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.52, 1.78), matCobalt);
        foot.position.set(0, -0.18, 0.28);
        const toeGuard = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.34, 0.48), matCrimson);
        toeGuard.position.set(0, -0.22, 1.05);
        footGroup.add(foot, toeGuard);
    };
    buildLeg(parts.leftLeg, parts.leftFoot, -1);
    buildLeg(parts.rightLeg, parts.rightFoot, 1);

    // =========================================================================
    // 5. VEHICLE MODE: SHINKANSEN 0-SERIES BULLET TRAIN (Track-Only Shell!)
    //    Fits Griffin Rock's exact 3.2m rail gauge via makeTrainBogie()
    // =========================================================================
    const trainShell = new THREE.Group();
    trainShell.visible = false;
    parts.chassis.add(trainShell);
    parts.toreinbottoTrainShell = trainShell;

    // Underframe Steel Chassis (elevated above 0.48m flanged bogie wheels)
    const underframe = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.44, 11.4), matDarkSteel);
    underframe.position.set(0, 0.92, 0);
    trainShell.add(underframe);

    // Front & Rear Rail Bogies (exact 3.2m gauge matching Griffin Rock railway!)
    const frontBogie = makeTrainBogie(1.75, 3.2, 0.48);
    frontBogie.group.position.set(0, 0, 3.35);
    trainShell.add(frontBogie.group);
    parts.wheels.push(...frontBogie.wheels);

    const rearBogie = makeTrainBogie(1.75, 3.2, 0.48);
    rearBogie.group.position.set(0, 0, -3.35);
    trainShell.add(rearBogie.group);
    parts.wheels.push(...rearBogie.wheels);

    // Main Aerodynamic White Shinkansen Coach Body
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(3.48, 2.25, 9.6), matWhite);
    mainBody.position.set(0, 2.22, -0.55);
    mainBody.castShadow = true;
    trainShell.add(mainBody);

    // Rounded Roof Crown
    const roofCrown = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.74, 9.6, 14, 1, false, -Math.PI * 0.5, Math.PI).rotateX(Math.PI / 2), matWhite);
    roofCrown.scale.set(1.0, 0.42, 1.0);
    roofCrown.position.set(0, 3.32, -0.55);
    trainShell.add(roofCrown);

    // Iconic Tokaido Cobalt-Blue Side Stripe & Window Band
    const blueWindowBand = new THREE.Mesh(new THREE.BoxGeometry(3.54, 0.96, 9.65), matCobalt);
    blueWindowBand.position.set(0, 2.38, -0.55);
    const blueSkirtStripe = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.34, 9.65), matCobalt);
    blueSkirtStripe.position.set(0, 1.32, -0.55);
    const goldAccentLine = new THREE.Mesh(new THREE.BoxGeometry(3.56, 0.12, 9.68), matGold);
    goldAccentLine.position.set(0, 1.78, -0.55);
    trainShell.add(blueWindowBand, blueSkirtStripe, goldAccentLine);

    // Illuminated Side Passenger Windows (both flanks)
    [-3.6, -2.0, -0.4, 1.2, 2.8].forEach(wz => {
        [-1.79, 1.79].forEach(wx => {
            const pWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 1.05), matCabGlass);
            pWin.position.set(wx, 2.42, wz);
            pWin.userData.noOutline = true;
            trainShell.add(pWin);
        });
    });

    // Iconic Shinkansen 0-Series Rounded Bullet Nose Cone (+Z forward!)
    const noseLower = new THREE.Mesh(new THREE.SphereGeometry(1.72, 18, 14), matWhite);
    noseLower.scale.set(1.01, 0.78, 1.55);
    noseLower.position.set(0, 1.98, 4.25);
    noseLower.castShadow = true;
    trainShell.add(noseLower);

    // Iconic Nose Dome Cap (classic rounded ivory/white 0-series nose tip!)
    const noseCap = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 12), matGold);
    noseCap.scale.set(1.05, 0.85, 0.92);
    noseCap.position.set(0, 1.78, 6.45);
    trainShell.add(noseCap);

    // Blue Swept Nose Stripe & Snowplow Cowcatcher Skirt
    const noseBand = new THREE.Mesh(new THREE.CylinderGeometry(1.76, 1.76, 0.42, 18, 1, true, -Math.PI * 0.5, Math.PI), matCobalt);
    noseBand.position.set(0, 1.65, 4.25);
    noseBand.scale.set(1.0, 1.0, 1.48);
    const cowcatcher = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.62, 1.35), matCobalt);
    cowcatcher.position.set(0, 0.88, 5.45);
    const cowTrim = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.16, 1.40), matCrimson);
    cowTrim.position.set(0, 0.62, 5.48);
    trainShell.add(noseBand, cowcatcher, cowTrim);

    // Wraparound Shinkansen Engineer Cab Windshield
    const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.78, 1.45), matCabGlass);
    cabWindshield.position.set(0, 2.92, 4.35);
    cabWindshield.rotation.x = 0.34;
    cabWindshield.userData.noOutline = true;
    const cabRoofHood = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.48, 1.85), matWhite);
    cabRoofHood.position.set(0, 3.36, 3.85);
    cabRoofHood.rotation.x = 0.22;
    trainShell.add(cabWindshield, cabRoofHood);

    // Twin Bright Shinkansen Headlamps (flanking the bullet nose)
    [-1.08, 1.08].forEach(lx => {
        const hlCase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.36, 12).rotateX(Math.PI / 2), matDarkSteel);
        hlCase.position.set(lx, 1.98, 5.95);
        const hlLens = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), matHeadlight);
        hlLens.position.set(lx, 1.98, 6.12);
        hlLens.userData.noOutline = true;
        trainShell.add(hlCase, hlLens);
    });

    // Overhead Diamond Rail Pantograph + Insulators on Roof
    const pantoBase = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 1.65), matDarkSteel);
    pantoBase.position.set(0, 3.92, -1.65);
    const pantoArmF = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.10, 0.14), matChrome);
    pantoArmF.position.set(0, 4.38, -1.25);
    pantoArmF.rotation.x = -0.58;
    const pantoArmR = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.10, 0.14), matChrome);
    pantoArmR.position.set(0, 4.38, -2.05);
    pantoArmR.rotation.x = 0.58;
    const pantoContactBar = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.12, 0.24), matGold);
    pantoContactBar.position.set(0, 4.78, -1.65);
    trainShell.add(pantoBase, pantoArmF, pantoArmR, pantoContactBar);

    // Rear End-Wall, Coupler & Red Tail Lamps
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(3.42, 2.2, 0.35), matCobalt);
    rearWall.position.set(0, 2.22, -5.38);
    const rearCoupler = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.85), matDarkSteel);
    rearCoupler.position.set(0, 1.05, -5.85);
    trainShell.add(rearWall, rearCoupler);
    [-1.15, 1.15].forEach(tx => {
        const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.18), matTailRed);
        tailLamp.position.set(tx, 1.85, -5.56);
        tailLamp.userData.noOutline = true;
        trainShell.add(tailLamp);
    });

    // =========================================================================
    // 5B. TRAILING SHINKANSEN EXPRESS CARS (Car 1: Passenger Coach, Car 2: Bullet Tail Car)
    //     Articulated along Griffin Rock's curved railway spline in Train Mode!
    // =========================================================================
    const buildTrailingCoach = (isTailCar: boolean): THREE.Group => {
        const car = new THREE.Group();
        const bodyLen = isTailCar ? 9.4 : 10.4;
        const bodyZ = isTailCar ? 0.45 : 0;

        // Underframe Steel Chassis
        const carUnder = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.44, isTailCar ? 10.8 : 10.6), matDarkSteel);
        carUnder.position.set(0, 0.92, isTailCar ? 0.1 : 0);
        car.add(carUnder);

        // Front & Rear 3.2m-gauge Rail Bogies (wheels pushed to parts.wheels so they spin!)
        const fBogie = makeTrainBogie(1.75, 3.2, 0.48);
        fBogie.group.position.set(0, 0, 3.35);
        car.add(fBogie.group);
        parts.wheels.push(...fBogie.wheels);

        const rBogie = makeTrainBogie(1.75, 3.2, 0.48);
        rBogie.group.position.set(0, 0, -3.35);
        car.add(rBogie.group);
        parts.wheels.push(...rBogie.wheels);

        // Front Accordion Vestibule Diaphragm connecting to preceding car
        const bellows = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.05, 1.15), matDarkSteel);
        bellows.position.set(0, 2.18, bodyZ + bodyLen * 0.5 + 0.52);
        car.add(bellows);

        // Main White Shinkansen Coach Body & Rounded Roof Crown
        const cBody = new THREE.Mesh(new THREE.BoxGeometry(3.48, 2.25, bodyLen), matWhite);
        cBody.position.set(0, 2.22, bodyZ);
        cBody.castShadow = true;
        const cRoof = new THREE.Mesh(
            new THREE.CylinderGeometry(1.72, 1.74, bodyLen, 14, 1, false, -Math.PI * 0.5, Math.PI).rotateX(Math.PI / 2),
            matWhite
        );
        cRoof.scale.set(1.0, 0.42, 1.0);
        cRoof.position.set(0, 3.32, bodyZ);
        car.add(cBody, cRoof);

        // Iconic Tokaido Cobalt-Blue Side Stripe, Skirt & Gold Accent Line
        const cWinBand = new THREE.Mesh(new THREE.BoxGeometry(3.54, 0.96, bodyLen + 0.05), matCobalt);
        cWinBand.position.set(0, 2.38, bodyZ);
        const cSkirt = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.34, bodyLen + 0.05), matCobalt);
        cSkirt.position.set(0, 1.32, bodyZ);
        const cGold = new THREE.Mesh(new THREE.BoxGeometry(3.56, 0.12, bodyLen + 0.08), matGold);
        cGold.position.set(0, 1.78, bodyZ);
        car.add(cWinBand, cSkirt, cGold);

        // Illuminated Side Passenger Windows (both flanks)
        const winZs = isTailCar ? [-2.6, -1.0, 0.6, 2.2, 3.8] : [-3.8, -2.2, -0.6, 1.0, 2.6, 4.2];
        winZs.forEach(wz => {
            [-1.79, 1.79].forEach(wx => {
                const pWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 1.05), matCabGlass);
                pWin.position.set(wx, 2.42, wz);
                pWin.userData.noOutline = true;
                car.add(pWin);
            });
        });

        // Roof HVAC Equipment Pods
        [-2.2, 2.2].forEach(hz => {
            const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.34, 2.15), matSilverFace);
            hvac.position.set(0, 3.92, hz + bodyZ * 0.5);
            car.add(hvac);
        });

        if (!isTailCar) {
            // Rear End-Wall & Coupler on Middle Passenger Coach
            const rWall = new THREE.Mesh(new THREE.BoxGeometry(3.42, 2.2, 0.32), matCobalt);
            rWall.position.set(0, 2.22, -bodyLen * 0.5 - 0.12);
            const rCoup = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.85), matDarkSteel);
            rCoup.position.set(0, 1.05, -bodyLen * 0.5 - 0.55);
            car.add(rWall, rCoup);
        } else {
            // Streamlined Rear Bullet Observation Tail Cone (-Z)
            const tCone = new THREE.Mesh(new THREE.SphereGeometry(1.72, 18, 14), matWhite);
            tCone.scale.set(1.01, 0.78, 1.55);
            tCone.position.set(0, 1.98, -4.25);
            tCone.castShadow = true;
            const tCap = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 12), matGold);
            tCap.scale.set(1.05, 0.85, 0.92);
            tCap.position.set(0, 1.78, -6.45);
            const tGlass = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.78, 1.45), matCabGlass);
            tGlass.position.set(0, 2.92, -4.35);
            tGlass.rotation.x = -0.34;
            tGlass.userData.noOutline = true;
            const tSkirt = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.62, 1.35), matCobalt);
            tSkirt.position.set(0, 0.88, -5.45);
            car.add(tCone, tCap, tGlass, tSkirt);

            // Twin Bright Red Shinkansen Rear Tail Lamps
            [-1.08, 1.08].forEach(lx => {
                const tl = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), matTailRed);
                tl.position.set(lx, 1.98, -6.12);
                tl.userData.noOutline = true;
                car.add(tl);
            });
        }

        return car;
    };

    const coachCar = buildTrailingCoach(false);
    coachCar.position.set(0, 0, -12.1);
    const tailCar = buildTrailingCoach(true);
    tailCar.position.set(0, 0, -23.7);
    trainShell.add(coachCar, tailCar);
    parts.toreinbottoTrainCars = [
        { group: coachCar, offset: 12.1 },
        { group: tailCar, offset: 23.7 }
    ];

    // =========================================================================
    // 6. DINO MODE: SONIC-CREST PARASAUROLOPHUS (Free-Roaming Off-Track Dino!)
    // =========================================================================
    const dinoTorso = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.95, 3.45), matWhite);
    dinoTorso.position.set(0, 2.15, -0.1);
    dinoTorso.castShadow = true;
    const dinoBlueSaddle = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.68, 2.85), matCobalt);
    dinoBlueSaddle.position.set(0, 2.55, -0.1);
    const dinoDorsalRidge = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 3.1), matGold);
    dinoDorsalRidge.position.set(0, 3.22, -0.15);
    parts.dinoGroup.add(dinoTorso, dinoBlueSaddle, dinoDorsalRidge);

    // Neck & Head with Iconic Swept-Back Shinkansen Sonic Crest!
    parts.dinoHead.position.set(0, 3.15, 1.85);
    const dinoNeck = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.45, 1.25), matWhite);
    dinoNeck.position.set(0, -0.35, -0.25);
    dinoNeck.rotation.x = 0.45;
    const dinoSkull = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.96, 1.45), matCobalt);
    dinoSkull.position.set(0, 0.55, 0.45);
    // Duck-billed Parasaurolophus Snout
    const dinoSnout = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 1.25), matWhite);
    dinoSnout.position.set(0, 0.36, 1.42);
    const dinoJaw = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 1.15), matDarkSteel);
    dinoJaw.position.set(0, 0.02, 1.25);
    parts.dinoLowerJaw = dinoJaw;

    // Iconic Long Swept-Back Bullet-Train Cranial Sonic Crest!
    const sonicCrestMain = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 2.65), matWhite);
    sonicCrestMain.position.set(0, 1.18, -0.68);
    sonicCrestMain.rotation.x = 0.38;
    const sonicCrestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 2.45), matCobalt);
    sonicCrestStripe.position.set(0, 1.18, -0.68);
    sonicCrestStripe.rotation.x = 0.38;
    const sonicCrestTip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.45), matGold);
    sonicCrestTip.position.set(0, 1.68, -1.92);
    sonicCrestTip.rotation.x = 0.38;
    parts.dinoHead.add(dinoNeck, dinoSkull, dinoSnout, dinoJaw, sonicCrestMain, sonicCrestStripe, sonicCrestTip);

    [-0.62, 0.62].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.34), matCyanGlow);
        eye.position.set(ex, 0.66, 0.68);
        eye.userData.noOutline = true;
        parts.dinoHead.add(eye);
    });

    // Articulated Dino Tail with Express Fin Tip
    parts.dinoTail.position.set(0, 2.18, -1.85);
    const tailSeg1 = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.18, 1.75), matWhite);
    tailSeg1.position.set(0, -0.1, -0.82);
    const tailSeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 1.75), matCobalt);
    tailSeg2.position.set(0, -0.22, -2.35);
    const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 1.25), matGold);
    tailTip.position.set(0, -0.26, -3.55);
    parts.dinoTail.add(tailSeg1, tailSeg2, tailTip);

    // Compact Parasaurolophus Forearms
    [-1, 1].forEach(side => {
        const dArm = side < 0 ? parts.dinoLeftArm : parts.dinoRightArm;
        dArm.position.set(side * 1.28, 1.95, 1.15);
        const foreLimb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.15, 0.58), matSkyBlue);
        foreLimb.position.set(0, -0.48, 0.18);
        foreLimb.rotation.x = -0.35;
        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.62), matDarkSteel);
        claw.position.set(0, -1.02, 0.38);
        dArm.add(foreLimb, claw);
    });

    // =========================================================================
    // 7. BOAT MODE: EXPRESS RAIL-FERRY CATAMARAN
    // =========================================================================
    buildToreinbottoBoat(parts);

    // Apply cel-shaded cartoon ink outlines across all modes
    applyCartoonInkOutlines(parts.root, 1.04, true);
}

// 3D Cel-Shaded Boat Mode Builder & Morph Animation System for All Rescue Bots
import * as THREE from 'three';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';
import type { BotRig } from '../types/game.js';

interface BoatBotRig extends BotRig {
    chaseBoatHull?: THREE.Object3D;
    chaseBridgeGroup?: THREE.Object3D;
    chaseRadarScanner?: THREE.Object3D;
    bladesHoverSkirt?: THREE.Object3D;
    bladesHoverDeck?: THREE.Object3D;
    bladesLeftFanRotor?: THREE.Object3D;
    bladesRightFanRotor?: THREE.Object3D;
    boulderBargeHull?: THREE.Object3D;
    boulderPushKnees?: THREE.Object3D;
    boulderDredgeGantry?: THREE.Object3D;
    boulderPilothouse?: THREE.Object3D;
    boulderLeftPropRotor?: THREE.Object3D;
    boulderRightPropRotor?: THREE.Object3D;
    optimusFlagshipHull?: THREE.Object3D;
    optimusBridge?: THREE.Object3D;
    optimusDelugeTurrets?: THREE.Object3D;
    optimusLatticeMast?: THREE.Object3D;
    optimusNavRadar?: THREE.Object3D;
    bumblebeeRacingHull?: THREE.Object3D;
    bumblebeeCockpit?: THREE.Object3D;
    bumblebeeRacingWing?: THREE.Object3D;
    blurrFuselage?: THREE.Object3D;
    blurrBowFoil?: THREE.Object3D;
    blurrSternFoil?: THREE.Object3D;
    blurrTurbines?: THREE.Object3D;
    salvageCatamaranHulls?: THREE.Object3D;
    salvageConveyor?: THREE.Object3D;
    salvageHopper?: THREE.Object3D;
    salvageLeftPaddlewheel?: THREE.Object3D;
    salvageRightPaddlewheel?: THREE.Object3D;
    quickshadowStealthHull?: THREE.Object3D;
    quickshadowDeckhouse?: THREE.Object3D;
    quickshadowExhaust?: THREE.Object3D;
    starspeedJetSkiHull?: THREE.Object3D;
    starspeedJetSkiBars?: THREE.Object3D;
    ratchetBoatHull?: THREE.Object3D;
    ratchetMedCabin?: THREE.Object3D;
    ratchetBoatRedPod?: THREE.Object3D;
    ratchetBoatWhitePod?: THREE.Object3D;
    toreinbottoBoatHulls?: THREE.Object3D;
    toreinbottoBoatBridge?: THREE.Object3D;
}

// Reusable Shared Materials
const matChrome = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad4 });
const matDarkSteel = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
const matRubberSkirt = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
const matBrass = new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad4 });
const matSirenRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
const matSirenBlue = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
const matNeonGreenGlow = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
const matYellowStripe = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
const matOrangeSafety = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad4 });
const matTintedGlass = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });

// ---------------------------------------------------------------------
// 1. CHASE: COAST GUARD INTERCEPTOR (RB-M / Defender-Class Response Boat)
// ---------------------------------------------------------------------
export function buildChaseBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matChaseBlue = new THREE.MeshToonMaterial({ color: 0x1648b8, gradientMap: toonGrad4 });
    const matChaseNavy = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
    const matChaseWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });

    // 1. Full Deep-V Naval Hull Base (Wraps around and completely masks lower chassis & wheels)
    const hullGroup = new THREE.Group();
    hullGroup.position.set(0, 0.45, 0.1);

    // Deep-V bottom keel
    const keel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 5.8), matChaseNavy);
    keel.castShadow = true;
    hullGroup.add(keel);

    // Flared main hull sides
    const mainHull = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.82, 5.6), matChaseBlue);
    mainHull.position.y = 0.25;
    mainHull.castShadow = true;
    hullGroup.add(mainHull);

    // Flared Bow Cutwater Wedge
    const bowCutwater = new THREE.Mesh(new THREE.ConeGeometry(1.55, 2.2, 4), matChaseBlue);
    bowCutwater.rotation.x = Math.PI * 0.5;
    bowCutwater.rotation.y = Math.PI * 0.25;
    bowCutwater.scale.set(1.0, 1.0, 0.65);
    bowCutwater.position.set(0, 0.35, 3.25);
    hullGroup.add(bowCutwater);

    // Chrome Bow Stem Cutwater Plate
    const bowPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 1.8), matChrome);
    bowPlate.position.set(0, 0.45, 3.35);
    hullGroup.add(bowPlate);

    // 2. High-Visibility Flotation Collar (Orange & White Coast Guard Fendering)
    const collarGroup = new THREE.Group();
    collarGroup.position.set(0, 0.68, 0.1);
    const collarL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 5.8, 10).rotateX(Math.PI * 0.5), matOrangeSafety);
    collarL.position.set(-1.62, 0, 0);
    const collarR = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 5.8, 10).rotateX(Math.PI * 0.5), matOrangeSafety);
    collarR.position.set(1.62, 0, 0);
    const collarBowL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.2, 10).rotateZ(0.55).rotateX(Math.PI * 0.5), matOrangeSafety);
    collarBowL.position.set(-0.85, 0, 3.2);
    const collarBowR = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.2, 10).rotateZ(-0.55).rotateX(Math.PI * 0.5), matOrangeSafety);
    collarBowR.position.set(0.85, 0, 3.2);
    collarGroup.add(collarL, collarR, collarBowL, collarBowR);
    hullGroup.add(collarGroup);

    // 3. Stern Kamewa Waterjet Cowlings
    [-0.75, 0.75].forEach(jx => {
        const jetCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.85, 8).rotateX(Math.PI * 0.5), matDarkSteel);
        jetCowl.position.set(jx, 0.15, -3.15);
        const jetCore = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), matCyanGlow);
        jetCore.position.z = -0.44;
        jetCore.rotation.y = Math.PI;
        jetCowl.add(jetCore);
        hullGroup.add(jetCowl);
    });

    boatGroup.add(hullGroup);
    parts.chaseBoatHull = hullGroup;

    // 4. Enclosed Coast Guard Pilothouse & Bridge Deck
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 1.45, 0.4);

    const house = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.15, 2.6), matChaseWhite);
    house.position.y = 0.55;
    bridgeGroup.add(house);

    // Forward-Canted Anti-Reflective Marine Windows
    const marineWindscreen = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.65, 0.18), matTintedGlass);
    marineWindscreen.position.set(0, 0.75, 1.32);
    marineWindscreen.rotation.x = -0.25;
    bridgeGroup.add(marineWindscreen);

    // Side Windows
    [-1.16, 1.16].forEach(wx => {
        const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 1.8), matTintedGlass);
        sideWin.position.set(wx, 0.75, 0);
        bridgeGroup.add(sideWin);
    });

    // Roof Police Beacon Bar
    const roofBar = new THREE.Group();
    roofBar.position.set(0, 1.25, 0.6);
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.35), matDarkSteel);
    const strobeB = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.32), matSirenBlue);
    strobeB.position.set(0.45, 0.15, 0);
    const strobeR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.32), matSirenRed);
    strobeR.position.set(-0.45, 0.15, 0);
    roofBar.add(barBase, strobeB, strobeR);
    bridgeGroup.add(roofBar);

    // Steerable Roof Searchlight
    const searchlight = new THREE.Group();
    searchlight.position.set(0, 1.35, 1.2);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.4, 8).rotateX(Math.PI * 0.5), matChrome);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), matCyanGlow);
    lens.position.z = 0.21;
    lamp.add(lens);
    searchlight.add(lamp);
    bridgeGroup.add(searchlight);

    // Aft Radar Arch with Spinning Scanner & FLIR Pod
    const arch = new THREE.Group();
    arch.position.set(0, 1.1, -1.25);
    const archPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.25), matChaseWhite);
    archPillarL.position.set(-1.05, 0.7, 0);
    archPillarL.rotation.z = -0.15;
    const archPillarR = archPillarL.clone();
    archPillarR.position.x = 1.05;
    archPillarR.rotation.z = 0.15;
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.18, 0.45), matChaseWhite);
    archTop.position.y = 1.4;
    arch.add(archPillarL, archPillarR, archTop);

    // Spinning Radar Scanner
    const radarScanner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.22), matDarkSteel);
    radarScanner.position.set(0, 1.55, 0);
    arch.add(radarScanner);
    parts.chaseRadarScanner = radarScanner;

    // FLIR Infrared Thermal Camera
    const flirPod = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), matDarkSteel);
    flirPod.position.set(0.65, 1.55, 0);
    arch.add(flirPod);

    bridgeGroup.add(arch);
    boatGroup.add(bridgeGroup);
    parts.chaseBridgeGroup = bridgeGroup;
}

// ---------------------------------------------------------------------
// 2. BLADES: AIR-SEA RESCUE HOVERCRAFT (Griffon 2000TD / AP1-88 Style)
// ---------------------------------------------------------------------
export function buildBladesBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad4 });
    const matBladesWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });

    // 1. Massive Continuous Rubberized Hovercraft Skirt (Wide Oval Footprint)
    const skirtGroup = new THREE.Group();
    skirtGroup.position.set(0, 0.45, 0.2);

    // Oval Perimeter Skirt Bags
    const skirtMain = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.95, 6.4), matRubberSkirt);
    skirtGroup.add(skirtMain);

    // Curved Front & Rear Bow Skirt Cushions
    const skirtBow = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.95, 16, 1, false, 0, Math.PI), matRubberSkirt);
    skirtBow.rotation.x = Math.PI * 0.5;
    skirtBow.rotation.z = Math.PI;
    skirtBow.position.set(0, 0, 3.2);
    const skirtStern = skirtBow.clone();
    skirtStern.rotation.z = 0;
    skirtStern.position.set(0, 0, -3.2);
    skirtGroup.add(skirtBow, skirtStern);

    // Individual Pressure Finger Ribs along skirt sides
    for (let f = -2.6; f <= 2.6; f += 0.65) {
        const fingerL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.92, 0.48), matDarkSteel);
        fingerL.position.set(-2.25, -0.05, f);
        const fingerR = fingerL.clone();
        fingerR.position.x = 2.25;
        skirtGroup.add(fingerL, fingerR);
    }

    boatGroup.add(skirtGroup);
    parts.bladesHoverSkirt = skirtGroup;

    // 2. Wide Aluminum Hovercraft Deck
    const deckGroup = new THREE.Group();
    deckGroup.position.set(0, 0.95, 0.2);

    const deckSlab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 6.2), matOrange);
    deckGroup.add(deckSlab);

    // Perimeter Walkway Safety Railings
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 5.6), matChrome);
    railL.position.set(-2.05, 0.35, 0);
    const railR = railL.clone();
    railR.position.x = 2.05;
    deckGroup.add(railL, railR);

    // 3. Enclosed Aerodynamic Pilot & MEDIVAC Rescue Cabin
    const cabin = new THREE.Group();
    cabin.position.set(0, 0.85, 0.6);

    const cabinBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.25, 3.2), matBladesWhite);
    cabinBody.position.y = 0.4;
    cabin.add(cabinBody);

    // Wrap-around Panoramic Windscreen
    const panoWin = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.65, 0.25), matTintedGlass);
    panoWin.position.set(0, 0.65, 1.62);
    panoWin.rotation.x = -0.32;
    cabin.add(panoWin);

    // Roof Emergency Strobe & Dual Searchlights
    const strobe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.3), matSirenRed);
    strobe.position.set(0, 1.15, 0.8);
    cabin.add(strobe);

    [-0.85, 0.85].forEach(sx => {
        const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.3, 8).rotateX(Math.PI * 0.5), matChrome);
        spot.position.set(sx, 1.15, 1.4);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), matCyanGlow);
        lens.position.z = 0.16;
        spot.add(lens);
        cabin.add(spot);
    });

    deckGroup.add(cabin);

    // 4. Twin Giant Stern Ducted Thrust Fans with Directional Air Rudders
    const createDuctedFan = (isRight = false) => {
        const fanGroup = new THREE.Group();
        // Cylindrical Aerodynamic Duct Cowling
        const duct = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.85, 16, 1, true), matOrange);
        duct.rotation.x = Math.PI * 0.5;
        fanGroup.add(duct);

        // Outer Dark Trim
        const ductRim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 16), matDarkSteel);
        ductRim.position.z = 0.42;
        fanGroup.add(ductRim);

        // Center Spinner Hub & 6 Fan Blades
        const rotorHub = new THREE.Group();
        const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 8), matChrome);
        spinner.rotation.x = Math.PI * 0.5;
        rotorHub.add(spinner);
        for (let i = 0; i < 6; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.85, 0.05), matBladesWhite);
            blade.position.y = 0.52;
            blade.rotation.x = 0.25;
            const pivot = new THREE.Group();
            pivot.rotation.z = (Math.PI * 2 / 6) * i;
            pivot.add(blade);
            rotorHub.add(pivot);
        }
        fanGroup.add(rotorHub);

        // Dual Directional Air Steering Rudders behind Duct
        [-0.32, 0.32].forEach(rx => {
            const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.65), matBladesWhite);
            rudder.position.set(rx, 0, -0.65);
            fanGroup.add(rudder);
        });

        return { fanGroup, rotorHub };
    };

    const leftFan = createDuctedFan(false);
    leftFan.fanGroup.position.set(-1.35, 1.65, -2.15);
    deckGroup.add(leftFan.fanGroup);
    parts.bladesLeftFan = leftFan.fanGroup;
    parts.bladesLeftFanRotor = leftFan.rotorHub;

    const rightFan = createDuctedFan(true);
    rightFan.fanGroup.position.set(1.35, 1.65, -2.15);
    deckGroup.add(rightFan.fanGroup);
    parts.bladesRightFan = rightFan.fanGroup;
    parts.bladesRightFanRotor = rightFan.rotorHub;

    // 5. Foredeck Emergency Gear: Dual Life Rings and Liferaft Pods
    [-1.25, 1.25].forEach(rx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.12, 8, 16), matOrange);
        ring.rotation.x = -Math.PI * 0.5;
        ring.position.set(rx, 0.25, 2.45);
        deckGroup.add(ring);
    });

    boatGroup.add(deckGroup);
    parts.bladesHoverDeck = deckGroup;
}

// ---------------------------------------------------------------------
// 3. BOULDER: CHANNEL DREDGER (Heavy Push-Boat & Dredging Barge)
// ---------------------------------------------------------------------
export function buildBoulderBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matGreen = new THREE.MeshToonMaterial({ color: 0x15803d, gradientMap: toonGrad4 });

    // 1. Heavy Industrial Flat-Bottom Dredger Barge Hull
    const hull = new THREE.Group();
    hull.position.set(0, 0.55, 0.1);

    const bargeBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 6.8), matDarkSteel);
    bargeBody.castShadow = true;
    hull.add(bargeBody);

    // Deck Armor Plating
    const deckPlate = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 7.0), matGreen);
    deckPlate.position.y = 0.65;
    hull.add(deckPlate);

    // Yellow/Black Hazard Stripes along Gunwales
    [-2.22, 2.22].forEach(hx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 6.8), matYellowStripe);
        stripe.position.set(hx, 0.45, 0);
        hull.add(stripe);
    });

    boatGroup.add(hull);
    parts.boulderBargeHull = hull;

    // 2. Heavy Bow Push-Knees (Twin Vertical Padded Timber/Steel Rams)
    const pushKnees = new THREE.Group();
    pushKnees.position.set(0, 1.45, 3.45);
    [-1.25, 1.25].forEach(px => {
        const knee = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.4, 0.65), matDarkSteel);
        knee.position.x = px;
        knee.castShadow = true;
        // Hazard chevrons on knees
        for (let y = -0.75; y <= 0.75; y += 0.5) {
            const chevron = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.68), matYellowStripe);
            chevron.position.set(px, y, 0);
            pushKnees.add(chevron);
        }
        pushKnees.add(knee);
    });
    boatGroup.add(pushKnees);
    parts.boulderPushKnees = pushKnees;

    // 3. Heavy Hydraulic Dredge Gantry (A-Frame Crane with Clamshell Dredging Jaws)
    const gantry = new THREE.Group();
    gantry.position.set(0, 1.6, 2.4);

    // Dual A-Frame Structural Steel Beams
    const beamL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 0.35), matGreen);
    beamL.position.set(-1.1, 1.0, 0.6);
    beamL.rotation.x = -0.35;
    const beamR = beamL.clone();
    beamR.position.x = 1.1;
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.35), matDarkSteel);
    topBar.position.set(0, 2.2, 1.05);
    gantry.add(beamL, beamR, topBar);

    // Hydraulic Clamshell Dredging Jaws
    const clamJawL = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.85), matDarkSteel);
    clamJawL.position.set(-0.5, 0.65, 1.65);
    const clamJawR = clamJawL.clone();
    clamJawR.position.x = 0.5;
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 0.25), matYellowStripe);
    teeth.position.set(0, 0.2, 1.95);
    gantry.add(clamJawL, clamJawR, teeth);

    boatGroup.add(gantry);
    parts.boulderDredgeGantry = gantry;

    // 4. Elevated Pilothouse Operator Tower (360-Degree Panoramic View)
    const pilothouse = new THREE.Group();
    pilothouse.position.set(0, 2.45, -0.6);

    const houseBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.45, 2.2), matGreen);
    pilothouse.add(houseBase);

    // Wrap-around Operator Windows
    const towerWin = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.55, 2.25), matTintedGlass);
    towerWin.position.y = 0.35;
    pilothouse.add(towerWin);

    // Roof Spotlight & Search Mast
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 8).rotateX(Math.PI * 0.5), matChrome);
    spot.position.set(0, 1.1, 0.85);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.20, 8), matCyanGlow);
    lens.position.z = 0.18;
    spot.add(lens);
    pilothouse.add(spot);

    boatGroup.add(pilothouse);
    parts.boulderPilothouse = pilothouse;

    // 5. Heavy Twin Stern Kort-Nozzle Propellers
    const createKortProp = () => {
        const group = new THREE.Group();
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.6, 12, 1, true), matDarkSteel);
        nozzle.rotation.x = Math.PI * 0.5;
        group.add(nozzle);

        const propHub = new THREE.Group();
        const hub = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), matBrass);
        propHub.add(hub);
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.05), matBrass);
            blade.position.y = 0.32;
            blade.rotation.x = 0.35;
            const pivot = new THREE.Group();
            pivot.rotation.z = (Math.PI * 0.5) * i;
            pivot.add(blade);
            propHub.add(pivot);
        }
        group.add(propHub);
        return { group, propHub };
    };

    const leftProp = createKortProp();
    leftProp.group.position.set(-1.25, 0.35, -3.45);
    boatGroup.add(leftProp.group);
    parts.boulderLeftProp = leftProp.group;
    parts.boulderLeftPropRotor = leftProp.propHub;

    const rightProp = createKortProp();
    rightProp.group.position.set(1.25, 0.35, -3.45);
    boatGroup.add(rightProp.group);
    parts.boulderRightProp = rightProp.group;
    parts.boulderRightPropRotor = rightProp.propHub;
}

// ---------------------------------------------------------------------
// 4. OPTIMUS PRIME: OFFSHORE COMMAND FLAGSHIP (Heavy Naval Cutter)
// ---------------------------------------------------------------------
export function buildOptimusBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matCrimson = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
    const matNavalBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });

    // 1. High-Freeboard Naval Icebreaker Hull
    const hull = new THREE.Group();
    hull.position.set(0, 0.75, 0.3);

    // Main Naval Hull (Covers cab lower half & wheels completely)
    const hullBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.65, 7.8), matNavalBlue);
    hullBody.castShadow = true;
    hull.add(hullBody);

    // White Waterline Boot-Top Stripe
    const bootTop = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.22, 7.82), matChrome);
    bootTop.position.y = -0.35;
    hull.add(bootTop);

    // Raked Icebreaker Bow Stem Prow
    const prow = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.8, 4), matCrimson);
    prow.rotation.x = Math.PI * 0.5;
    prow.rotation.y = Math.PI * 0.25;
    prow.scale.set(1.0, 1.0, 0.75);
    prow.position.set(0, 0.25, 4.4);
    hull.add(prow);

    // Heavy Chrome Cutwater Stem & Anchor Hawseholes
    const stemIron = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 2.4), matChrome);
    stemIron.position.set(0, 0.45, 4.4);
    hull.add(stemIron);

    [-1.6, 1.6].forEach(ax => {
        const anchorPocket = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 8).rotateZ(Math.PI * 0.5), matDarkSteel);
        anchorPocket.position.set(ax, 0.35, 3.6);
        hull.add(anchorPocket);
    });

    boatGroup.add(hull);
    parts.optimusFlagshipHull = hull;

    // 2. Multi-Tier Command Superstructure Bridge
    const bridge = new THREE.Group();
    bridge.position.set(0, 2.25, 0.4);

    // Lower Command Deck
    const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.35, 3.4), matNavalBlue);
    bridge.add(lowerDeck);

    // Upper Navigation Bridge with Bridge Wings
    const navBridge = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 2.4), matCrimson);
    navBridge.position.y = 1.15;
    const bridgeWingL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 1.2), matCrimson);
    bridgeWingL.position.set(-1.75, 1.0, 0.2);
    const bridgeWingR = bridgeWingL.clone();
    bridgeWingR.position.x = 1.75;
    bridge.add(navBridge, bridgeWingL, bridgeWingR);

    // Forward-Canted Bridge Windows
    const bridgeWin = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.55, 0.22), matTintedGlass);
    bridgeWin.position.set(0, 1.25, 1.22);
    bridgeWin.rotation.x = -0.22;
    bridge.add(bridgeWin);

    boatGroup.add(bridge);
    parts.optimusBridge = bridge;

    // 3. Forward Heavy Armored Deluge Gun Turrets
    const delugeTurrets = new THREE.Group();
    delugeTurrets.position.set(0, 1.65, 2.4);
    [-1.25, 1.25].forEach(tx => {
        const turret = new THREE.Group();
        turret.position.x = tx;
        const barbette = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.45, 10), matDarkSteel);
        const gunHousing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.95), matCrimson);
        gunHousing.position.y = 0.35;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.2, 8).rotateX(Math.PI * 0.5), matChrome);
        barrel.position.set(0, 0.35, 0.95);
        const nozzleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.35, 8).rotateX(Math.PI * 0.5), matBrass);
        nozzleTip.position.set(0, 0.35, 2.05);
        turret.add(barbette, gunHousing, barrel, nozzleTip);
        delugeTurrets.add(turret);
    });
    boatGroup.add(delugeTurrets);
    parts.optimusDelugeTurrets = delugeTurrets;

    // 4. Naval Communications Lattice Mast with Spinning Radar
    const mast = new THREE.Group();
    mast.position.set(0, 3.85, 0.2);

    const mainSpar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.35), matDarkSteel);
    const yardArm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), matDarkSteel);
    yardArm.position.y = 0.85;
    mast.add(mainSpar, yardArm);

    // Spinning Navigational Radar Antenna
    const radar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.22), matChrome);
    radar.position.y = 1.45;
    mast.add(radar);
    parts.optimusNavRadar = radar;

    boatGroup.add(mast);
    parts.optimusLatticeMast = mast;

    // 5. Aft Stern Helipad Flight Deck
    const helipad = new THREE.Group();
    helipad.position.set(0, 1.62, -2.6);
    const padDeck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.4), matDarkSteel);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 16).rotateX(-Math.PI * 0.5), matYellowStripe);
    ring.position.y = 0.08;
    helipad.add(padDeck, ring);
    boatGroup.add(helipad);
}

// ---------------------------------------------------------------------
// 5. BUMBLEBEE: HIGH-SPEED OFFSHORE JET BOAT (Cigarette / Donzi Racing Boat)
// ---------------------------------------------------------------------
export function buildBumblebeeBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matBeeYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad4 });
    const matBeeBlack = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });

    // 1. Razor-Sharp Deep-V Offshore Racing Hull
    const hull = new THREE.Group();
    hull.position.set(0, 0.45, 0.2);

    // Deep-V Lower Keel & Chine
    const mainHull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.75, 6.6), matBeeYellow);
    mainHull.castShadow = true;
    hull.add(mainHull);

    // Needle-Sharp Prow Cutwater (Sharp Offshore Racing Wedge)
    const prow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 4), matBeeYellow);
    prow.rotation.x = Math.PI * 0.5;
    prow.rotation.y = Math.PI * 0.25;
    prow.scale.set(1.0, 1.0, 0.55);
    prow.position.set(0, 0.15, 3.8);
    hull.add(prow);

    // Dual Black Racing Stripes
    [-0.45, 0.45].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.78, 6.8), matBeeBlack);
        stripe.position.set(sx, 0.02, 0.3);
        hull.add(stripe);
    });

    // Continuous Chrome Rub Rail
    const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.6, 8).rotateX(Math.PI * 0.5), matChrome);
    railL.position.set(-1.62, 0.38, 0);
    const railR = railL.clone();
    railR.position.x = 1.62;
    hull.add(railL, railR);

    // Twin High-Thrust Waterjet Nozzles (Rooster-Tail Jets)
    [-0.65, 0.65].forEach(jx => {
        const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.85, 8).rotateX(Math.PI * 0.45), matChrome);
        jetNozzle.position.set(jx, 0.15, -3.45);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), matCyanGlow);
        glow.position.z = -0.44;
        glow.rotation.y = Math.PI;
        jetNozzle.add(glow);
        hull.add(jetNozzle);
    });

    boatGroup.add(hull);
    parts.bumblebeeRacingHull = hull;

    // 2. Low-Profile Bubble Canopy & Cockpit Coaming
    const cockpit = new THREE.Group();
    cockpit.position.set(0, 0.95, 0.6);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 2.6), matTintedGlass);
    canopy.position.y = 0.25;
    cockpit.add(canopy);

    const windDeflector = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.15), matCyanGlow);
    windDeflector.position.set(0, 0.45, 1.32);
    windDeflector.rotation.x = -0.35;
    cockpit.add(windDeflector);

    boatGroup.add(cockpit);
    parts.bumblebeeCockpit = cockpit;

    // 3. Aft Racing Engine Hatch with Exposed Chrome Blowers
    const engineDeck = new THREE.Group();
    engineDeck.position.set(0, 0.95, -1.2);

    const cowl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 2.4), matBeeYellow);
    engineDeck.add(cowl);

    // Twin Polished Chrome Air Blower Scoops
    [-0.55, 0.55].forEach(bx => {
        const blower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.85), matChrome);
        blower.position.set(bx, 0.35, 0.2);
        const scoopInlet = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), matDarkSteel);
        scoopInlet.position.set(0, 0, 0.44);
        blower.add(scoopInlet);
        engineDeck.add(blower);
    });

    boatGroup.add(engineDeck);

    // 4. High Aerodynamic Racing Wing Spoiler on Transom
    const spoiler = new THREE.Group();
    spoiler.position.set(0, 1.35, -2.4);

    const pylonL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.45), matBeeBlack);
    pylonL.position.set(-1.15, 0.4, 0);
    pylonL.rotation.x = -0.25;
    const pylonR = pylonL.clone();
    pylonR.position.x = 1.15;

    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.75), matBeeBlack);
    wing.position.y = 0.85;
    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.82), matBeeYellow);
    endplateL.position.set(-1.7, 0.85, 0);
    const endplateR = endplateL.clone();
    endplateR.position.x = 1.7;

    spoiler.add(pylonL, pylonR, wing, endplateL, endplateR);
    boatGroup.add(spoiler);
    parts.bumblebeeRacingWing = spoiler;
}

// ---------------------------------------------------------------------
// 6. BLURR: SUPERSONIC FOIL-BORNE HYDROFOIL RACER (SailGP F50 Style)
// ---------------------------------------------------------------------
export function buildBlurrBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matPurple = new THREE.MeshToonMaterial({ color: 0x9333ea, gradientMap: toonGrad4 });
    const matDarkViolet = new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGrad3 });

    // 1. Ultra-Streamlined Hydroplane Fuselage
    const fuselage = new THREE.Group();
    fuselage.position.set(0, 0.55, 0.2);

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 6.8), matPurple);
    body.castShadow = true;
    fuselage.add(body);

    // Needle-Sharp Supersonic Bow Cone
    const needleNose = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.6, 4), matPurple);
    needleNose.rotation.x = Math.PI * 0.5;
    needleNose.rotation.y = Math.PI * 0.25;
    needleNose.scale.set(1.0, 1.0, 0.5);
    needleNose.position.set(0, 0.12, 3.8);
    fuselage.add(needleNose);

    // Neon Green Aerodynamic Accent Streaks
    const streakL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 6.2), matNeonGreenGlow);
    streakL.position.set(-1.32, 0.15, 0.2);
    const streakR = streakL.clone();
    streakR.position.x = 1.32;
    fuselage.add(streakL, streakR);

    // Cockpit Bubble Canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 2.8), matTintedGlass);
    canopy.position.set(0, 0.45, 0.6);
    fuselage.add(canopy);

    boatGroup.add(fuselage);
    parts.blurrFuselage = fuselage;

    // 2. High-Stance Inverted T-Foil Struts (Extending down beneath water surface!)
    const bowFoil = new THREE.Group();
    bowFoil.position.set(0, 0.1, 2.2);

    // Center Strut extending down
    const bowStrut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.35), matDarkSteel);
    bowStrut.position.y = -0.8;
    // Horizontal Submerged Hydrofoil Wing
    const bowWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.55), matPurple);
    bowWing.position.y = -1.6;
    // Winglet Dihedral Tips
    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.58), matNeonGreenGlow);
    tipL.position.set(-1.8, -1.4, 0);
    const tipR = tipL.clone();
    tipR.position.x = 1.8;
    bowFoil.add(bowStrut, bowWing, tipL, tipR);
    boatGroup.add(bowFoil);
    parts.blurrBowFoil = bowFoil;

    // 3. Stern Hydrofoil Wing Assembly
    const sternFoil = new THREE.Group();
    sternFoil.position.set(0, 0.1, -2.4);

    [-1.15, 1.15].forEach(sx => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.35), matDarkSteel);
        strut.position.set(sx, -0.8, 0);
        sternFoil.add(strut);
    });
    const sternWing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.55), matPurple);
    sternWing.position.y = -1.6;
    sternFoil.add(sternWing);
    boatGroup.add(sternFoil);
    parts.blurrSternFoil = sternFoil;

    // 4. Supersonic Hydro-Turbine Pods
    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(0, 0.45, -3.2);

    [-0.75, 0.75].forEach(tx => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.1, 10).rotateX(Math.PI * 0.5), matDarkViolet);
        pod.position.x = tx;
        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 6, 12), matNeonGreenGlow);
        glowRing.position.z = -0.55;
        pod.add(glowRing);
        turbineGroup.add(pod);
    });

    boatGroup.add(turbineGroup);
    parts.blurrTurbines = turbineGroup;
}

// ---------------------------------------------------------------------
// 7. SALVAGE: TRASH COLLECTOR CATAMARAN (Mr. Trash Wheel / Skimmer Style)
// ---------------------------------------------------------------------
export function buildSalvageBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matSalvageBlue = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad4 });
    const matSalvageLime = new THREE.MeshToonMaterial({ color: 0x84cc16, gradientMap: toonGrad4 });

    // 1. Twin Catamaran Sponsons with Open Center Skimming Channel
    const hulls = new THREE.Group();
    hulls.position.set(0, 0.45, 0.1);

    [-1.65, 1.65].forEach(hx => {
        const sponson = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 6.4), matSalvageBlue);
        sponson.position.set(hx, 0, 0);
        sponson.castShadow = true;
        // Heavy Rubber D-Fendering
        const fendering = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 6.42), matDarkSteel);
        fendering.position.set(hx, 0.25, 0);
        // Tapered Bow Prore
        const prow = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.8, 4), matSalvageLime);
        prow.rotation.x = Math.PI * 0.5;
        prow.rotation.y = Math.PI * 0.25;
        prow.position.set(hx, 0, 3.8);
        hulls.add(sponson, fendering, prow);
    });

    boatGroup.add(hulls);
    parts.salvageCatamaranHulls = hulls;

    // 2. Central Debris Skimming Conveyor Scoop (Dipping into center water channel)
    const conveyor = new THREE.Group();
    conveyor.position.set(0, 0.55, 1.8);

    // Inclined Conveyor Frame
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 3.2), matDarkSteel);
    frameL.position.set(-0.95, -0.2, 0.4);
    frameL.rotation.x = 0.45;
    const frameR = frameL.clone();
    frameR.position.x = 0.95;
    conveyor.add(frameL, frameR);

    // Conveyor Belt / Flight Bars
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 3.1), matRubberSkirt);
    belt.position.set(0, -0.2, 0.4);
    belt.rotation.x = 0.45;
    conveyor.add(belt);

    // Forward Collection Rake Tines
    const rakeBar = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.25, 0.25), matYellowStripe);
    rakeBar.position.set(0, -0.85, 1.65);
    conveyor.add(rakeBar);

    boatGroup.add(conveyor);
    parts.salvageConveyor = conveyor;

    // 3. Central Mesh Debris Storage Hopper
    const hopper = new THREE.Group();
    hopper.position.set(0, 1.15, -0.4);

    const hopperWalls = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 2.6), matDarkSteel);
    const limeTrim = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.15, 2.68), matSalvageLime);
    limeTrim.position.y = 0.65;
    hopper.add(hopperWalls, limeTrim);

    boatGroup.add(hopper);
    parts.salvageHopper = hopper;

    // 4. Large Side Working Paddlewheels (Mr. Trash Wheel Style)
    const paddleGroup = new THREE.Group();
    paddleGroup.position.set(0, 0.65, -0.6);

    const createPaddlewheel = (isRight = false) => {
        const wheel = new THREE.Group();
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 8).rotateZ(Math.PI * 0.5), matDarkSteel);
        wheel.add(axle);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 16).rotateY(Math.PI * 0.5), matSalvageLime);
        wheel.add(rim);

        for (let i = 0; i < 8; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.05), matYellowStripe);
            blade.position.y = 0.95;
            const pivot = new THREE.Group();
            pivot.rotation.x = (Math.PI * 2 / 8) * i;
            pivot.add(blade);
            wheel.add(pivot);
        }
        return wheel;
    };

    const leftWheel = createPaddlewheel(false);
    leftWheel.position.x = -2.15;
    paddleGroup.add(leftWheel);
    parts.salvageLeftPaddlewheel = leftWheel;

    const rightWheel = createPaddlewheel(true);
    rightWheel.position.x = 2.15;
    paddleGroup.add(rightWheel);
    parts.salvageRightPaddlewheel = rightWheel;

    boatGroup.add(paddleGroup);

    // 5. Starboard Operator Wheelhouse
    const wheelhouse = new THREE.Group();
    wheelhouse.position.set(1.45, 1.45, 0.8);
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 1.2), matSalvageBlue);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.45, 1.15), matTintedGlass);
    win.position.y = 0.25;
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), matOrangeSafety);
    beacon.position.y = 0.72;
    wheelhouse.add(house, win, beacon);
    boatGroup.add(wheelhouse);
}

// ---------------------------------------------------------------------
// 8. QUICKSHADOW: STEALTH WAVE-PIERCING INTERCEPTOR (M80 Stiletto Style)
// ---------------------------------------------------------------------
export function buildQuickshadowBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });
    const matMidnightNavy = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });

    // 1. Faceted Carbon Pentamaran Stealth Hull
    const hull = new THREE.Group();
    hull.position.set(0, 0.52, 0.2);

    // Main Faceted Tumblehome Center Body
    const centerHull = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.82, 6.8), matWhite);
    centerHull.castShadow = true;
    hull.add(centerHull);

    // Razor-Sharp Wave-Piercing Center Knife Prow
    const knife = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.8, 4), matWhite);
    knife.rotation.x = Math.PI * 0.5;
    knife.rotation.y = Math.PI * 0.25;
    knife.scale.set(1.0, 1.0, 0.5);
    knife.position.set(0, 0.15, 4.2);
    hull.add(knife);

    // Center Knife Carbon Spine
    const knifeSpine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 3.6), matMidnightNavy);
    knifeSpine.position.set(0, 0.35, 4.0);
    hull.add(knifeSpine);

    // Outer Faceted Stealth Chine Sponsons (Radar-Deflecting Inward Angle)
    [-1.75, 1.75].forEach((sx, idx) => {
        const outerSponson = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.82, 6.6), matMidnightNavy);
        outerSponson.position.set(sx, 0.05, 0);
        outerSponson.rotation.z = (idx === 0 ? 0.22 : -0.22);
        hull.add(outerSponson);
    });

    // Subtle Cyan Energon Running Chine Trim
    [-1.9, 1.9].forEach(cx => {
        const chineLight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 6.2), matCyanGlow);
        chineLight.position.set(cx, -0.15, 0);
        hull.add(chineLight);
    });

    boatGroup.add(hull);
    parts.quickshadowStealthHull = hull;

    // 2. Low-Profile Faceted Stealth Deckhouse & Slit Windows
    const deckhouse = new THREE.Group();
    deckhouse.position.set(0, 0.95, 0.4);

    const houseFaceted = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 3.2), matMidnightNavy);
    houseFaceted.position.y = 0.25;
    deckhouse.add(houseFaceted);

    // Narrow Obsidian Radar-Deflecting Windshield Slit
    const slitWin = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.25, 0.25), matCyanGlow);
    slitWin.position.set(0, 0.38, 1.55);
    slitWin.rotation.x = -0.45;
    deckhouse.add(slitWin);

    boatGroup.add(deckhouse);
    parts.quickshadowDeckhouse = deckhouse;

    // 3. Flush Transom Stealth Pump-Jet Exhausts
    const exhaust = new THREE.Group();
    exhaust.position.set(0, 0.35, -3.25);

    [-0.85, 0.85].forEach(ex => {
        const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.45), matDarkSteel);
        nozzle.position.x = ex;
        const glow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), matCyanGlow);
        glow.position.z = -0.24;
        glow.rotation.y = Math.PI;
        nozzle.add(glow);
        exhaust.add(nozzle);
    });

    boatGroup.add(exhaust);
    parts.quickshadowExhaust = exhaust;
}

// ---------------------------------------------------------------------
// 9. ANIMATE BOAT MORPH TRANSFORMATION FOR ALL BOTS
// ---------------------------------------------------------------------
export function animateBotBoatMorph(rig: BoatBotRig, boatMorph: number, now: number, _dt: number) {
    if (!rig || rig.botType === 'HIGHTIDE') return;

    const b = Math.max(0, Math.min(1, boatMorph));
    const inBoat = (b > 0.001);

    if (rig.boatGroup) {
        rig.boatGroup.visible = inBoat;
    }

    if (!inBoat) {
        // Reset to standard land vehicle transforms when dry on land
        if (rig.leftArmWheelMount) {
            rig.leftArmWheelMount.scale.setScalar(1.0);
            rig.leftArmWheelMount.visible = !rig.isMega;
        }
        if (rig.rightArmWheelMount) {
            rig.rightArmWheelMount.scale.setScalar(1.0);
            rig.rightArmWheelMount.visible = !rig.isMega;
        }
        if (rig.leftLegWheelMount) {
            rig.leftLegWheelMount.scale.setScalar(1.0);
            rig.leftLegWheelMount.visible = !rig.isMega;
        }
        if (rig.rightLegWheelMount) {
            rig.rightLegWheelMount.scale.setScalar(1.0);
            rig.rightLegWheelMount.visible = !rig.isMega;
        }
        if (rig.wheels && Array.isArray(rig.wheels) && !rig.isMega) {
            rig.wheels.forEach((w: THREE.Object3D) => {
                if (w && !w.userData?.isBoatPart) {
                    w.scale.setScalar(1.0);
                    w.visible = true;
                }
            });
        }
        if (rig.botType === 'BLADES') {
            if (rig.leftSkidMount) rig.leftSkidMount.visible = true;
            if (rig.rightSkidMount) rig.rightSkidMount.visible = true;
            if (rig.rotors) rig.rotors.visible = true;
            if (rig.tailRotor) rig.tailRotor.visible = true;
            if (rig.backAttachment) rig.backAttachment.visible = true;
        } else if (rig.botType === 'BOULDER') {
            if (rig.frontAttachment) rig.frontAttachment.visible = true;
        } else if (rig.botType === 'SALVAGE') {
            if (rig.frontAttachment) rig.frontAttachment.visible = true;
        }
        return;
    }

    // Smooth deployment scale factors
    const tDeploy = THREE.MathUtils.smoothstep(b, 0.0, 0.85);

    // Universal Wheel Mount Tucking & Road Wheel Retraction for ALL bots
    const wheelScale = THREE.MathUtils.lerp(1.0, 0.01, THREE.MathUtils.smoothstep(b, 0.15, 0.82));
    const wheelVisible = (b < 0.82);

    if (rig.leftArmWheelMount) {
        rig.leftArmWheelMount.scale.setScalar(wheelScale);
        rig.leftArmWheelMount.visible = wheelVisible;
    }
    if (rig.rightArmWheelMount) {
        rig.rightArmWheelMount.scale.setScalar(wheelScale);
        rig.rightArmWheelMount.visible = wheelVisible;
    }
    if (rig.leftLegWheelMount) {
        rig.leftLegWheelMount.scale.setScalar(wheelScale);
        rig.leftLegWheelMount.visible = wheelVisible;
    }
    if (rig.rightLegWheelMount) {
        rig.rightLegWheelMount.scale.setScalar(wheelScale);
        rig.rightLegWheelMount.visible = wheelVisible;
    }
    if (rig.wheels && Array.isArray(rig.wheels)) {
        rig.wheels.forEach((w: THREE.Object3D) => {
            if (w && !w.userData?.isBoatPart) {
                w.scale.setScalar(wheelScale);
                w.visible = wheelVisible;
            }
        });
    }

    // Hide or Retract Land-Specific Vehicle Attachments when entering boat mode
    const landAttachmentVis = (b < 0.25);
    if (rig.botType === 'BLADES') {
        if (rig.leftSkidMount) rig.leftSkidMount.visible = landAttachmentVis;
        if (rig.rightSkidMount) rig.rightSkidMount.visible = landAttachmentVis;
        if (rig.rotors) rig.rotors.visible = landAttachmentVis;
        if (rig.tailRotor) rig.tailRotor.visible = landAttachmentVis;
        if (rig.backAttachment) rig.backAttachment.visible = landAttachmentVis;
    } else if (rig.botType === 'BOULDER') {
        if (rig.frontAttachment) rig.frontAttachment.visible = landAttachmentVis;
    } else if (rig.botType === 'SALVAGE') {
        if (rig.frontAttachment) rig.frontAttachment.visible = landAttachmentVis;
    }

    if (!inBoat) return;

    // Bot-Specific Boat Part Animations & Rotations
    switch (rig.botType) {
        case 'CHASE': {
            if (rig.chaseBoatHull) {
                rig.chaseBoatHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.chaseBridgeGroup) {
                rig.chaseBridgeGroup.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.2, 0.9)));
            }
            if (rig.chaseRadarScanner) {
                rig.chaseRadarScanner.rotation.y = (now * 0.005) % (Math.PI * 2);
            }
            break;
        }

        case 'BLADES': {
            if (rig.bladesHoverSkirt) {
                rig.bladesHoverSkirt.scale.set(
                    THREE.MathUtils.lerp(0.01, 1.0, tDeploy),
                    THREE.MathUtils.lerp(0.01, 1.0, tDeploy),
                    THREE.MathUtils.lerp(0.01, 1.0, tDeploy)
                );
            }
            if (rig.bladesHoverDeck) {
                rig.bladesHoverDeck.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.15, 0.85)));
            }
            // Spin dual thrust fan rotors
            if (rig.bladesLeftFanRotor) {
                rig.bladesLeftFanRotor.rotation.z = (now * 0.018) % (Math.PI * 2);
            }
            if (rig.bladesRightFanRotor) {
                rig.bladesRightFanRotor.rotation.z = (now * 0.018) % (Math.PI * 2);
            }
            break;
        }

        case 'BOULDER': {
            if (rig.boulderBargeHull) {
                rig.boulderBargeHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.boulderPushKnees) {
                rig.boulderPushKnees.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.boulderDredgeGantry) {
                rig.boulderDredgeGantry.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.25, 0.9)));
            }
            if (rig.boulderPilothouse) {
                rig.boulderPilothouse.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.3, 0.95)));
            }
            if (rig.boulderLeftPropRotor) {
                rig.boulderLeftPropRotor.rotation.z = (now * 0.012) % (Math.PI * 2);
            }
            if (rig.boulderRightPropRotor) {
                rig.boulderRightPropRotor.rotation.z = -(now * 0.012) % (Math.PI * 2);
            }
            break;
        }

        case 'OPTIMUS': {
            if (rig.optimusFlagshipHull) {
                rig.optimusFlagshipHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.optimusBridge) {
                rig.optimusBridge.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.2, 0.88)));
            }
            if (rig.optimusDelugeTurrets) {
                rig.optimusDelugeTurrets.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.25, 0.92)));
            }
            if (rig.optimusLatticeMast) {
                rig.optimusLatticeMast.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.35, 0.95)));
            }
            if (rig.optimusNavRadar) {
                rig.optimusNavRadar.rotation.y = (now * 0.004) % (Math.PI * 2);
            }
            break;
        }

        case 'BUMBLEBEE': {
            if (rig.bumblebeeRacingHull) {
                rig.bumblebeeRacingHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.bumblebeeCockpit) {
                rig.bumblebeeCockpit.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.15, 0.85)));
            }
            if (rig.bumblebeeRacingWing) {
                rig.bumblebeeRacingWing.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.25, 0.92)));
            }
            break;
        }

        case 'BLURR': {
            if (rig.blurrFuselage) {
                rig.blurrFuselage.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            // Hydrofoil struts deploy downward
            const foilDeploy = THREE.MathUtils.smoothstep(b, 0.15, 0.9);
            if (rig.blurrBowFoil) {
                rig.blurrBowFoil.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, foilDeploy));
            }
            if (rig.blurrSternFoil) {
                rig.blurrSternFoil.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, foilDeploy));
            }
            if (rig.blurrTurbines) {
                rig.blurrTurbines.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, foilDeploy));
            }
            break;
        }

        case 'SALVAGE': {
            if (rig.salvageCatamaranHulls) {
                rig.salvageCatamaranHulls.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.salvageConveyor) {
                rig.salvageConveyor.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.2, 0.9)));
            }
            if (rig.salvageHopper) {
                rig.salvageHopper.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.25, 0.92)));
            }
            // Rotate side paddlewheels
            if (rig.salvageLeftPaddlewheel) {
                rig.salvageLeftPaddlewheel.rotation.x = (now * 0.005) % (Math.PI * 2);
            }
            if (rig.salvageRightPaddlewheel) {
                rig.salvageRightPaddlewheel.rotation.x = (now * 0.005) % (Math.PI * 2);
            }
            break;
        }

        case 'QUICKSHADOW': {
            if (rig.quickshadowStealthHull) {
                rig.quickshadowStealthHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.quickshadowDeckhouse) {
                rig.quickshadowDeckhouse.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.2, 0.9)));
            }
            if (rig.quickshadowExhaust) {
                rig.quickshadowExhaust.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.25, 0.92)));
            }
            break;
        }

        case 'STARSPEED': {
            if (rig.starspeedJetSkiHull) {
                rig.starspeedJetSkiHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.starspeedJetSkiBars) {
                rig.starspeedJetSkiBars.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.2, 0.9)));
            }
            break;
        }

        case 'RATCHET': {
            if (rig.ratchetBoatHull) {
                rig.ratchetBoatHull.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.ratchetMedCabin) {
                rig.ratchetMedCabin.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.18, 0.92)));
            }
            const flash = Math.floor(now / 110) % 2 === 0;
            if (rig.ratchetBoatRedPod) rig.ratchetBoatRedPod.scale.setScalar(flash ? 1.32 : 0.88);
            if (rig.ratchetBoatWhitePod) rig.ratchetBoatWhitePod.scale.setScalar(!flash ? 1.32 : 0.88);
            break;
        }

        case 'TOREINBOTTO': {
            if (rig.toreinbottoBoatHulls) {
                rig.toreinbottoBoatHulls.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.toreinbottoBoatBridge) {
                rig.toreinbottoBoatBridge.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, THREE.MathUtils.smoothstep(b, 0.18, 0.92)));
            }
            break;
        }
    }
}

// 9. STARSPEED: COSMIC HYDRO JET SKI
export function buildStarspeedBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matTeal = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
    const matWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
    const matCoral = new THREE.MeshToonMaterial({ color: 0xf43f5e, gradientMap: toonGrad3 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfde047, gradientMap: toonGrad3 });
    const matDark = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
    const matJetGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Sleek Personal Watercraft V-Hull
    const hullGroup = new THREE.Group();
    const mainHull = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 3.8), matWhite);
    mainHull.position.set(0, -0.35, 0);
    mainHull.castShadow = true;

    const bowNose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.85, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4), matTeal);
    bowNose.scale.set(1.05, 0.55, 1.0);
    bowNose.position.set(0, -0.25, 2.55);

    const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 3.2), matTeal);
    upperDeck.position.set(0, 0.08, -0.1);

    const sideStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 3.2), matCoral);
    sideStripeL.position.set(-0.88, -0.05, 0.0);
    const sideStripeR = sideStripeL.clone();
    sideStripeR.position.x = 0.88;

    const saddleSeat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.48, 1.75), matDark);
    saddleSeat.position.set(0, 0.48, -0.55);

    const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.75, 12).rotateX(Math.PI / 2), matDark);
    jetNozzle.position.set(0, -0.3, -2.05);
    const jetCore = new THREE.Mesh(new THREE.CircleGeometry(0.24, 12).rotateY(Math.PI), matJetGlow);
    jetCore.position.set(0, -0.3, -2.44);
    jetCore.userData.noOutline = true;

    hullGroup.add(mainHull, bowNose, upperDeck, sideStripeL, sideStripeR, saddleSeat, jetNozzle, jetCore);
    parts.starspeedJetSkiHull = hullGroup;
    boatGroup.add(hullGroup);

    // Raised Jet Ski Steering Column, Wind Deflector & Handlebars
    const barsGroup = new THREE.Group();
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.65, 1.05).rotateX(-0.35), matCoral);
    cowl.position.set(0, 0.68, 0.95);
    const windScreen = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.36, 0.14).rotateX(-0.55), matJetGlow);
    windScreen.position.set(0, 1.02, 1.25);
    windScreen.userData.noOutline = true;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.72, 10), matDark);
    stem.position.set(0, 0.92, 0.65);
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.65, 10).rotateZ(Math.PI / 2), matGold);
    handlebar.position.set(0, 1.24, 0.55);
    [-0.78, 0.78].forEach(gx => {
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 10).rotateZ(Math.PI / 2), matDark);
        grip.position.set(gx, 1.24, 0.55);
        barsGroup.add(grip);
    });
    barsGroup.add(cowl, windScreen, stem, handlebar);
    parts.starspeedJetSkiBars = barsGroup;
    boatGroup.add(barsGroup);

    applyCartoonInkOutlines(boatGroup, 1.04, true);
}

// 10. RATCHET: WATER AMBULANCE / MARINE EMERGENCY RESCUE CRAFT
export function buildRatchetBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matMedWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
    const matMedRed = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
    const matBeaconWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. High-Buoyancy RIB Medical Rescue Hull with Bright Red Inflatable Rescue Tubes
    const hullGroup = new THREE.Group();
    hullGroup.position.set(0, 0.48, 0.1);

    const lowerKeel = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.68, 5.7), matDarkSteel);
    lowerKeel.castShadow = true;
    hullGroup.add(lowerKeel);

    const whiteHull = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.72, 5.5), matMedWhite);
    whiteHull.position.y = 0.28;
    whiteHull.castShadow = true;
    hullGroup.add(whiteHull);

    // Pointed Rescue Bow Wedge + Boarding Platform
    const bowWedge = new THREE.Mesh(new THREE.ConeGeometry(1.55, 2.25, 4), matMedWhite);
    bowWedge.rotation.x = Math.PI * 0.5;
    bowWedge.rotation.y = Math.PI * 0.25;
    bowWedge.scale.set(1.02, 1.0, 0.60);
    bowWedge.position.set(0, 0.34, 3.25);
    hullGroup.add(bowWedge);

    // Bright Emergency Red Inflatable Perimeter Rescue Collar
    [-1.66, 1.66].forEach(sx => {
        const sideTube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.36, 0.36, 5.55, 10).rotateX(Math.PI * 0.5),
            matMedRed
        );
        sideTube.position.set(sx, 0.64, 0.05);
        hullGroup.add(sideTube);

        const bowTube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.34, 0.35, 2.35, 10).rotateX(Math.PI * 0.5).rotateY(sx < 0 ? 0.58 : -0.58),
            matMedRed
        );
        bowTube.position.set(sx * 0.58, 0.64, 3.45);
        hullGroup.add(bowTube);
    });
    const bowNoseCap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), matMedRed);
    bowNoseCap.position.set(0, 0.64, 4.38);
    hullGroup.add(bowNoseCap);

    // Twin Stern Marine Hydro-Jet Nozzles
    [-0.78, 0.78].forEach(jx => {
        const jetHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.85, 10).rotateX(Math.PI * 0.5), matDarkSteel);
        jetHousing.position.set(jx, 0.14, -3.12);
        const jetCore = new THREE.Mesh(new THREE.CircleGeometry(0.24, 10), matCyanGlow);
        jetCore.position.z = -0.44;
        jetCore.rotation.y = Math.PI;
        jetCore.userData.noOutline = true;
        jetHousing.add(jetCore);
        hullGroup.add(jetHousing);
    });

    boatGroup.add(hullGroup);
    parts.ratchetBoatHull = hullGroup;

    // 2. Enclosed White & Red Water-Ambulance Triage Cabin + Flashing Strobe Lightbar
    const medCabin = new THREE.Group();
    medCabin.position.set(0, 1.24, -0.35);

    const cabinBox = new THREE.Mesh(new THREE.BoxGeometry(2.68, 1.56, 3.45), matMedWhite);
    cabinBox.position.y = 0.78;
    cabinBox.castShadow = true;
    const cabinRedBelt = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.36, 3.50), matMedRed);
    cabinRedBelt.position.y = 0.42;
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.20, 3.32), matMedRed);
    cabinRoof.position.y = 1.62;
    medCabin.add(cabinBox, cabinRedBelt, cabinRoof);

    // Forward Canted Marine Bridge Windscreen & Side Triage Windows
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.66, 0.16), matCyanGlow);
    frontGlass.position.set(0, 1.08, 1.74);
    frontGlass.rotation.x = -0.22;
    frontGlass.userData.noOutline = true;
    medCabin.add(frontGlass);

    // Red Medical Crosses on Cabin Roof and Both Flanks
    const roofCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 1.18), matMedWhite);
    roofCrossV.position.set(0, 1.75, -0.28);
    roofCrossV.userData.noOutline = true;
    const roofCrossH = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.08, 0.38), matMedWhite);
    roofCrossH.position.set(0, 1.75, -0.28);
    roofCrossH.userData.noOutline = true;
    medCabin.add(roofCrossV, roofCrossH);

    [-1.38, 1.38].forEach(fx => {
        const sV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.24), matMedRed);
        sV.position.set(fx, 1.05, -0.35);
        sV.userData.noOutline = true;
        const sH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.72), matMedRed);
        sH.position.set(fx, 1.05, -0.35);
        sH.userData.noOutline = true;
        medCabin.add(sV, sH);

        // Orange Rescue Life-Ring Mounted on Aft Cabin Bulkhead
        const lifeRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.10, 8, 14).rotateY(Math.PI / 2), matOrangeSafety);
        lifeRing.position.set(fx * 1.02, 0.92, -1.32);
        medCabin.add(lifeRing);
    });

    // Flashing Marine Emergency Strobe Bar on Cabin Roof
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.14, 0.36), matDarkSteel);
    barBase.position.set(0, 1.78, 1.05);
    const boatRedPod = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.28, 0.34), matSirenRed);
    boatRedPod.position.set(-0.56, 1.94, 1.05);
    boatRedPod.userData.noOutline = true;
    const boatWhitePod = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.28, 0.34), matBeaconWhite);
    boatWhitePod.position.set(0.56, 1.94, 1.05);
    boatWhitePod.userData.noOutline = true;
    medCabin.add(barBase, boatRedPod, boatWhitePod);

    parts.ratchetMedCabin = medCabin;
    parts.ratchetBoatRedPod = boatRedPod;
    parts.ratchetBoatWhitePod = boatWhitePod;
    boatGroup.add(medCabin);

    applyCartoonInkOutlines(boatGroup, 1.04, true);
}

// 11. TOREINBOTTO: EXPRESS RAIL-FERRY CATAMARAN (Twin White & Cobalt Shinkansen Hydro Hulls)
export function buildToreinbottoBoat(parts: BotRig) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
    const matCobalt = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const matCrimson = new THREE.MeshToonMaterial({ color: 0xef4444, gradientMap: toonGrad3 });
    const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Twin Streamlined Catamaran Pontoons + Cross-Deck
    const hullsGroup = new THREE.Group();
    [-1.48, 1.48].forEach(hx => {
        const pontoon = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.92, 6.8), matWhite);
        pontoon.position.set(hx, 0.25, 0);
        pontoon.castShadow = true;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.28, 6.85), matCobalt);
        stripe.position.set(hx, 0.34, 0);
        const bowNose = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.2, 8).rotateX(Math.PI * 0.5), matWhite);
        bowNose.position.set(hx, 0.28, 4.45);
        const bowTip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), matGold);
        bowTip.position.set(hx, 0.28, 5.45);
        const sternJet = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.7, 10).rotateX(Math.PI * 0.5), matDarkSteel);
        sternJet.position.set(hx, 0.16, -3.55);
        const jetGlow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), matCyanGlow);
        jetGlow.position.set(hx, 0.16, -3.92);
        jetGlow.rotation.y = Math.PI;
        jetGlow.userData.noOutline = true;
        hullsGroup.add(pontoon, stripe, bowNose, bowTip, sternJet, jetGlow);
    });

    // Center Rail-Ferry Deck with Dual Mini Steel Rails!
    const ferryDeck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 6.2), matDarkSteel);
    ferryDeck.position.set(0, 0.78, -0.15);
    const bowBridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.24, 1.0), matCobalt);
    bowBridgeBeam.position.set(0, 0.72, 3.1);
    hullsGroup.add(ferryDeck, bowBridgeBeam);
    [-0.65, 0.65].forEach(rx => {
        const deckRail = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 5.8), matChrome);
        deckRail.position.set(rx, 0.98, -0.15);
        hullsGroup.add(deckRail);
    });

    boatGroup.add(hullsGroup);
    parts.toreinbottoBoatHulls = hullsGroup;

    // Aerodynamic Shinkansen Ferry Bridge Cabin
    const bridge = new THREE.Group();
    bridge.position.set(0, 1.05, 0.35);

    const cabinMain = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.35, 3.65), matWhite);
    cabinMain.position.y = 0.68;
    cabinMain.castShadow = true;
    const cabinBand = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.38, 3.70), matCobalt);
    cabinBand.position.y = 0.68;
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.24, 3.4), matWhite);
    cabinRoof.position.y = 1.44;
    const cabinWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.56, 0.20), matCyanGlow);
    cabinWindshield.position.set(0, 0.96, 1.84);
    cabinWindshield.rotation.x = -0.22;
    cabinWindshield.userData.noOutline = true;
    const roofBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.38), matGold);
    roofBeacon.position.set(0, 1.66, 0.85);
    const sternFlag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.52), matCrimson);
    sternFlag.position.set(0, 1.88, -1.25);
    bridge.add(cabinMain, cabinBand, cabinRoof, cabinWindshield, roofBeacon, sternFlag);

    boatGroup.add(bridge);
    parts.toreinbottoBoatBridge = bridge;

    applyCartoonInkOutlines(boatGroup, 1.04, true);
}

// 3D Cel-Shaded Boat Mode Builder & Morph Animation System for All Rescue Bots
import * as THREE from 'three';
import { toonGrad3, toonGrad4, matInkOutline } from '../rendering/materials.js';

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

// ---------------------------------------------------------------------
// 1. CHASE: COAST GUARD INTERCEPTOR
// ---------------------------------------------------------------------
export function buildChaseBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matChaseBlue = new THREE.MeshToonMaterial({ color: 0x1648b8, gradientMap: toonGrad4 });
    const matChaseWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });

    // Deep-V Patrol Sponsons (Left & Right)
    const createPatrolSponson = (isRight = false) => {
        const group = new THREE.Group();
        const hull = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 3.8), matChaseBlue);
        hull.position.y = 0.36;
        hull.castShadow = true;
        group.add(hull);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 3.82), matChaseWhite);
        stripe.position.y = 0.45;
        group.add(stripe);

        // Forward Wave Cutwater Prow
        const prow = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.2, 4), matChaseBlue);
        prow.rotation.x = Math.PI * 0.5;
        prow.rotation.y = Math.PI * 0.25;
        prow.position.set(0, 0.36, 2.2);
        group.add(prow);

        // Stern Water Jet Pump Nozzle
        const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8), matDarkSteel);
        jetNozzle.rotation.x = Math.PI * 0.5;
        jetNozzle.position.set(0, 0.36, -2.1);
        const jetCore = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), matCyanGlow);
        jetCore.position.z = -0.31;
        jetCore.rotation.y = Math.PI;
        jetNozzle.add(jetCore);
        group.add(jetNozzle);

        return { group, jetNozzle };
    };

    const left = createPatrolSponson(false);
    left.group.position.set(-1.42, 0.15, 0.2);
    boatGroup.add(left.group);
    parts.leftChaseSponson = left.group;

    const right = createPatrolSponson(true);
    right.group.position.set(1.42, 0.15, 0.2);
    boatGroup.add(right.group);
    parts.rightChaseSponson = right.group;

    // Marine Radar Arch with Blue/Red Emergency Strobes
    const arch = new THREE.Group();
    arch.position.set(0, 1.35, -1.2);
    const archBar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 0.45), matChaseWhite);
    archBar.position.y = 1.1;
    const archPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 1.2, 6), matChrome);
    archPostL.position.set(-1.15, 0.55, 0);
    const archPostR = archPostL.clone();
    archPostR.position.x = 1.15;
    const radarStrobeB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.35), matSirenBlue);
    radarStrobeB.position.set(0.65, 1.28, 0);
    const radarStrobeR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.35), matSirenRed);
    radarStrobeR.position.set(-0.65, 1.28, 0);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.6, 6), matChrome);
    antenna.position.set(1.1, 1.8, 0);
    arch.add(archBar, archPostL, archPostR, radarStrobeB, radarStrobeR, antenna);
    boatGroup.add(arch);
    parts.chaseRadarArch = arch;

    // Bow Searchlight
    const searchlight = new THREE.Group();
    searchlight.position.set(0, 1.1, 2.1);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 8), matChrome);
    lamp.rotation.x = Math.PI * 0.5;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.20, 8), matCyanGlow);
    lens.position.z = 0.18;
    lamp.add(lens);
    searchlight.add(lamp);
    boatGroup.add(searchlight);
    parts.chaseSearchlight = searchlight;
}

// ---------------------------------------------------------------------
// 2. BLADES: AIR-SEA RESCUE HOVERCRAFT
// ---------------------------------------------------------------------
export function buildBladesBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad4 });
    const matBladesWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });

    // Perimeter Inflatable Rubber Air-Cushion Skirt
    const skirt = new THREE.Group();
    skirt.position.set(0, 0.35, 0.2);
    // Outer Torus Ring Skirt
    const skirtFront = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.6, 12).rotateZ(Math.PI * 0.5), matRubberSkirt);
    skirtFront.position.set(0, 0, 2.4);
    const skirtBack = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.6, 12).rotateZ(Math.PI * 0.5), matRubberSkirt);
    skirtBack.position.set(0, 0, -2.4);
    const skirtL = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 4.4, 12).rotateX(Math.PI * 0.5), matRubberSkirt);
    skirtL.position.set(-1.45, 0, 0);
    const skirtR = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 4.4, 12).rotateX(Math.PI * 0.5), matRubberSkirt);
    skirtR.position.set(1.45, 0, 0);
    skirt.add(skirtFront, skirtBack, skirtL, skirtR);
    boatGroup.add(skirt);
    parts.bladesHoverSkirt = skirt;

    // Twin Ducted Rear Aerial Thrust Fans with Rotating Propeller Blades
    const createDuctedFan = (isRight = false) => {
        const fanGroup = new THREE.Group();
        const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.65, 16, 1, true), matOrange);
        duct.rotation.x = Math.PI * 0.5;
        fanGroup.add(duct);

        // Center Spinner Hub & 3 Fan Blades
        const rotorHub = new THREE.Group();
        const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 8), matChrome);
        spinner.rotation.x = Math.PI * 0.5;
        rotorHub.add(spinner);
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.04), matBladesWhite);
            blade.position.y = 0.32;
            const pivot = new THREE.Group();
            pivot.rotation.z = (Math.PI * 2 / 3) * i;
            pivot.add(blade);
            rotorHub.add(pivot);
        }
        fanGroup.add(rotorHub);

        // Vertical Steering Rudder behind Duct
        const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.4), matBladesWhite);
        rudder.position.set(0, 0, -0.45);
        fanGroup.add(rudder);

        return { fanGroup, rotorHub, rudder };
    };

    const leftFan = createDuctedFan(false);
    leftFan.fanGroup.position.set(-1.15, 1.45, -1.85);
    boatGroup.add(leftFan.fanGroup);
    parts.bladesLeftFan = leftFan.fanGroup;
    parts.bladesLeftFanRotor = leftFan.rotorHub;

    const rightFan = createDuctedFan(true);
    rightFan.fanGroup.position.set(1.15, 1.45, -1.85);
    boatGroup.add(rightFan.fanGroup);
    parts.bladesRightFan = rightFan.fanGroup;
    parts.bladesRightFanRotor = rightFan.rotorHub;

    // Foredeck Lifebuoys (Pair of Red & White Torus Life Rings)
    const lifeRings = new THREE.Group();
    lifeRings.position.set(0, 1.05, 1.85);
    [-0.75, 0.75].forEach(rx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.10, 8, 16), matOrange);
        ring.rotation.x = -Math.PI * 0.5;
        ring.position.x = rx;
        lifeRings.add(ring);
    });
    boatGroup.add(lifeRings);
    parts.bladesLifeRings = lifeRings;
}

// ---------------------------------------------------------------------
// 3. BOULDER: CHANNEL DREDGER
// ---------------------------------------------------------------------
export function buildBoulderBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matGreen = new THREE.MeshToonMaterial({ color: 0x15803d, gradientMap: toonGrad4 });

    // 1. Heavy Industrial Bow Push-Knees (Twin Vertical Padded Timber/Steel Rams)
    const pushKnees = new THREE.Group();
    pushKnees.position.set(0, 0.95, 2.65);
    [-0.95, 0.95].forEach(px => {
        const knee = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.95, 0.55), matDarkSteel);
        knee.position.x = px;
        knee.castShadow = true;
        // Safety yellow chevron stripes on knees
        const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.22, 0.57), matYellowStripe);
        stripe1.position.set(px, 0.45, 0);
        const stripe2 = stripe1.clone();
        stripe2.position.y = -0.45;
        pushKnees.add(knee, stripe1, stripe2);
    });
    boatGroup.add(pushKnees);
    parts.boulderPushKnees = pushKnees;

    // 2. Heavy Dredge Arms along Gunwales
    const dredgeArms = new THREE.Group();
    dredgeArms.position.set(0, 0.82, 0);
    [-1.52, 1.52].forEach(ax => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 3.8), matGreen);
        arm.position.x = ax;
        dredgeArms.add(arm);
    });
    boatGroup.add(dredgeArms);
    parts.boulderDredgeArms = dredgeArms;

    // 3. Stern Twin Brass Screw Propellers in Kort Nozzles
    const createKortProp = () => {
        const group = new THREE.Group();
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.42, 12, 1, true), matDarkSteel);
        nozzle.rotation.x = Math.PI * 0.5;
        group.add(nozzle);

        const propHub = new THREE.Group();
        const hub = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), matBrass);
        propHub.add(hub);
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.04), matBrass);
            blade.position.y = 0.20;
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
    leftProp.group.position.set(-0.95, 0.35, -2.35);
    boatGroup.add(leftProp.group);
    parts.boulderLeftProp = leftProp.group;
    parts.boulderLeftPropRotor = leftProp.propHub;

    const rightProp = createKortProp();
    rightProp.group.position.set(0.95, 0.35, -2.35);
    boatGroup.add(rightProp.group);
    parts.boulderRightProp = rightProp.group;
    parts.boulderRightPropRotor = rightProp.propHub;
}

// ---------------------------------------------------------------------
// 4. OPTIMUS PRIME: OFFSHORE COMMAND FLAGSHIP
// ---------------------------------------------------------------------
export function buildOptimusBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matCrimson = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
    const matNavalBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });

    // 1. Reinforced Heavy Icebreaker Bow Prow (Crimson & Chrome Wedge)
    const bowProw = new THREE.Group();
    bowProw.position.set(0, 0.75, 2.8);
    const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.2, 4), matCrimson);
    wedge.rotation.x = Math.PI * 0.5;
    wedge.rotation.y = Math.PI * 0.25;
    wedge.scale.set(1.45, 1.2, 0.85);
    const bowCap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.45, 2.1), matChrome);
    bowCap.position.y = 0.2;
    bowProw.add(wedge, bowCap);
    boatGroup.add(bowProw);
    parts.optimusBowProw = bowProw;

    // 2. Twin High-Pressure Naval Deluge Monitor Turrets
    const delugeTurrets = new THREE.Group();
    delugeTurrets.position.set(0, 1.45, 1.6);
    [-0.95, 0.95].forEach(tx => {
        const turret = new THREE.Group();
        turret.position.x = tx;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.40, 0.32, 8), matNavalBlue);
        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8), matChrome);
        cannon.rotation.x = Math.PI * 0.5;
        cannon.position.set(0, 0.22, 0.65);
        const nozzleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.25, 8), matYellowStripe);
        nozzleTip.rotation.x = Math.PI * 0.5;
        nozzleTip.position.set(0, 0.22, 1.45);
        turret.add(base, cannon, nozzleTip);
        delugeTurrets.add(turret);
    });
    boatGroup.add(delugeTurrets);
    parts.optimusDelugeTurrets = delugeTurrets;

    // 3. Command Communications Antenna Mast
    const mast = new THREE.Group();
    mast.position.set(0, 2.4, -0.6);
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.6, 6), matChrome);
    const radarDish = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.10, 0.18, 8), matChrome);
    radarDish.rotation.x = Math.PI * 0.4;
    radarDish.position.set(0, 1.1, 0);
    mast.add(spar, radarDish);
    boatGroup.add(mast);
    parts.optimusCommandMast = mast;
}

// ---------------------------------------------------------------------
// 5. BUMBLEBEE: HIGH-SPEED JET BOAT
// ---------------------------------------------------------------------
export function buildBumblebeeBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matBeeYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad4 });
    const matBeeBlack = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });

    // Twin Aerodynamic Jet Sponsons with Black Racing Stripes
    const createJetSponson = (isRight = false) => {
        const group = new THREE.Group();
        const hull = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 3.4), matBeeYellow);
        hull.position.y = 0.28;
        group.add(hull);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.20, 3.42), matBeeBlack);
        stripe.position.y = 0.35;
        group.add(stripe);

        // Sharp Wave-Cutter Tip
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.95, 4), matBeeYellow);
        tip.rotation.x = Math.PI * 0.5;
        tip.rotation.y = Math.PI * 0.25;
        tip.position.set(0, 0.28, 1.95);
        group.add(tip);

        // High-Thrust Chrome Water Jet Nozzle with Cyan Ring
        const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.55, 8), matChrome);
        jetNozzle.rotation.x = Math.PI * 0.5;
        jetNozzle.position.set(0, 0.28, -1.85);
        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), matCyanGlow);
        glowRing.position.z = -0.28;
        jetNozzle.add(glowRing);
        group.add(jetNozzle);

        return group;
    };

    const left = createJetSponson(false);
    left.position.set(-1.25, 0.15, 0.1);
    boatGroup.add(left);
    parts.bumblebeeLeftSponson = left;

    const right = createJetSponson(true);
    right.position.set(1.25, 0.15, 0.1);
    boatGroup.add(right);
    parts.bumblebeeRightSponson = right;

    // Rear Aerodynamic Hydrofoil Spoiler Wing
    const spoiler = new THREE.Group();
    spoiler.position.set(0, 1.15, -1.45);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.65), matBeeBlack);
    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.72), matBeeYellow);
    endplateL.position.set(-1.3, 0.12, 0);
    const endplateR = endplateL.clone();
    endplateR.position.x = 1.3;
    spoiler.add(wing, endplateL, endplateR);
    boatGroup.add(spoiler);
    parts.bumblebeeHydroSpoiler = spoiler;
}

// ---------------------------------------------------------------------
// 6. BLURR: SUPERSONIC FOIL-BORNE HYDROFOIL RACER
// ---------------------------------------------------------------------
export function buildBlurrBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matPurple = new THREE.MeshToonMaterial({ color: 0x9333ea, gradientMap: toonGrad4 });

    // 1. Forward V-Foil Hydrofoil Wing
    const bowFoil = new THREE.Group();
    bowFoil.position.set(0, -0.45, 1.6);
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.25), matDarkSteel);
    strutL.rotation.z = -0.35;
    strutL.position.set(-0.75, 0, 0);
    const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.25), matDarkSteel);
    strutR.rotation.z = 0.35;
    strutR.position.set(0.75, 0, 0);
    const vWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.45), matPurple);
    vWing.position.y = -0.55;
    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.46), matNeonGreenGlow);
    tipL.position.set(-1.2, -0.55, 0);
    const tipR = tipL.clone();
    tipR.position.x = 1.2;
    bowFoil.add(strutL, strutR, vWing, tipL, tipR);
    boatGroup.add(bowFoil);
    parts.blurrBowFoil = bowFoil;

    // 2. Rear Inverted-T Stabilizing Hydrofoil
    const sternFoil = new THREE.Group();
    sternFoil.position.set(0, -0.45, -1.6);
    const centerStrut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.30), matDarkSteel);
    const tWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.40), matPurple);
    tWing.position.y = -0.55;
    sternFoil.add(centerStrut, tWing);
    boatGroup.add(sternFoil);
    parts.blurrSternFoil = sternFoil;

    // 3. Supersonic Hydro-Impeller Nozzle
    const impeller = new THREE.Group();
    impeller.position.set(0, 0.35, -2.1);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.7, 8), matDarkSteel);
    nozzle.rotation.x = Math.PI * 0.5;
    const neonRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 6, 12), matNeonGreenGlow);
    neonRing.position.z = -0.35;
    nozzle.add(neonRing);
    impeller.add(nozzle);
    boatGroup.add(impeller);
    parts.blurrImpeller = impeller;
}

// ---------------------------------------------------------------------
// 7. SALVAGE: TRASH COLLECTOR CATAMARAN
// ---------------------------------------------------------------------
export function buildSalvageBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matSalvageBlue = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad4 });
    const matSalvageLime = new THREE.MeshToonMaterial({ color: 0x84cc16, gradientMap: toonGrad4 });

    // Twin Catamaran Floats
    [-1.48, 1.48].forEach(fx => {
        const float = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 3.8), matSalvageBlue);
        float.position.set(fx, 0.38, 0);
        float.castShadow = true;
        const rubRail = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.22, 3.82), matSalvageLime);
        rubRail.position.set(fx, 0.55, 0);
        boatGroup.add(float, rubRail);
    });

    // Central Hydraulic Ocean Debris Scoop Basket
    const scoopBasket = new THREE.Group();
    scoopBasket.position.set(0, 0.45, 2.2);
    const basketFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 1.6), matDarkSteel);
    const intakeTeeth = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.25, 0.25), matYellowStripe);
    intakeTeeth.position.z = 0.85;
    const grillBar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6).rotateZ(Math.PI * 0.5), matChrome);
    grillBar1.position.set(0, 0.35, 0.2);
    const grillBar2 = grillBar1.clone();
    grillBar2.position.z = -0.4;
    scoopBasket.add(basketFloor, intakeTeeth, grillBar1, grillBar2);
    boatGroup.add(scoopBasket);
    parts.salvageOceanScoop = scoopBasket;

    // Dual Rear Paddlewheels / Weedless Drive Screws
    const paddlewheels = new THREE.Group();
    paddlewheels.position.set(0, 0.35, -2.1);
    [-1.0, 1.0].forEach(px => {
        const wheel = new THREE.Group();
        wheel.position.x = px;
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 6).rotateZ(Math.PI * 0.5), matDarkSteel);
        wheel.add(axle);
        for (let i = 0; i < 6; i++) {
            const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.04), matSalvageLime);
            paddle.position.y = 0.25;
            const pivot = new THREE.Group();
            pivot.rotation.x = (Math.PI * 2 / 6) * i;
            pivot.add(paddle);
            wheel.add(pivot);
        }
        paddlewheels.add(wheel);
    });
    boatGroup.add(paddlewheels);
    parts.salvagePaddlewheels = paddlewheels;
}

// ---------------------------------------------------------------------
// 8. QUICKSHADOW: STEALTH WAVE-PIERCING INTERCEPTOR SPEEDBOAT
// ---------------------------------------------------------------------
export function buildQuickshadowBoat(parts: any) {
    const boatGroup = new THREE.Group();
    boatGroup.userData.isBoatPart = true;
    boatGroup.visible = false;
    parts.boatGroup = boatGroup;
    parts.chassis.add(boatGroup);

    const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });
    const matMidnightNavy = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });

    // 1. Faceted Wave-Piercing Bow Knife
    const bowKnife = new THREE.Group();
    bowKnife.position.set(0, 0.65, 2.65);
    const knife = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 4), matWhite);
    knife.rotation.x = Math.PI * 0.5;
    knife.rotation.y = Math.PI * 0.25;
    knife.scale.set(1.4, 1.0, 0.65);
    const navyChine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 2.3), matMidnightNavy);
    navyChine.position.y = 0.15;
    bowKnife.add(knife, navyChine);
    boatGroup.add(bowKnife);
    parts.quickshadowBowKnife = bowKnife;

    // 2. Faceted Stealth Sponsons with Sealing Well Covers
    [-1.35, 1.35].forEach((sx, idx) => {
        const sponson = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.62, 3.8), matWhite);
        sponson.position.set(sx, 0.35, 0.1);
        sponson.rotation.z = (idx === 0 ? 0.15 : -0.15);
        sponson.castShadow = true;
        const underChine = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 3.82), matMidnightNavy);
        underChine.position.set(sx, 0.08, 0.1);
        boatGroup.add(sponson, underChine);
    });

    // 3. Submerged Silent Pump-Jet Thrusters with Cyan Underglow
    const pumpJets = new THREE.Group();
    pumpJets.position.set(0, 0.25, -2.15);
    [-0.75, 0.75].forEach(jx => {
        const jet = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.75), matDarkSteel);
        jet.position.x = jx;
        const glow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), matCyanGlow);
        glow.position.z = -0.38;
        glow.rotation.y = Math.PI;
        jet.add(glow);
        pumpJets.add(jet);
    });
    boatGroup.add(pumpJets);
    parts.quickshadowPumpJets = pumpJets;
}

// ---------------------------------------------------------------------
// 9. ANIMATE BOAT MORPH TRANSFORMATION FOR ALL BOTS
// ---------------------------------------------------------------------
export function animateBotBoatMorph(rig: any, boatMorph: number, now: number, dt: number) {
    if (!rig || rig.botType === 'HIGHTIDE') return;

    const b = Math.max(0, Math.min(1, boatMorph));
    const inBoat = (b > 0.001);

    if (rig.boatGroup) {
        rig.boatGroup.visible = inBoat;
    }

    if (!inBoat) return;

    // Smooth deployment factor
    const tDeploy = THREE.MathUtils.smoothstep(b, 0.0, 0.85);

    // Common wheel retraction & scaling: road wheels tuck inward and shrink away
    if (rig.wheels && Array.isArray(rig.wheels)) {
        const wheelScale = THREE.MathUtils.lerp(1.0, 0.01, THREE.MathUtils.smoothstep(b, 0.2, 0.85));
        const wheelVis = (b < 0.85);
        rig.wheels.forEach((w: any) => {
            if (w && w.userData && !w.userData.isBoatPart) {
                w.scale.setScalar(wheelScale);
                w.visible = wheelVis;
            }
        });
    }

    // Bot-Specific Boat Articulations
    switch (rig.botType) {
        case 'CHASE': {
            const spX = THREE.MathUtils.lerp(0.85, 1.42, tDeploy);
            if (rig.leftChaseSponson) rig.leftChaseSponson.position.x = -spX;
            if (rig.rightChaseSponson) rig.rightChaseSponson.position.x = spX;
            if (rig.chaseRadarArch) {
                rig.chaseRadarArch.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            break;
        }

        case 'BLADES': {
            if (rig.bladesHoverSkirt) {
                rig.bladesHoverSkirt.scale.set(
                    THREE.MathUtils.lerp(0.5, 1.0, tDeploy),
                    THREE.MathUtils.lerp(0.2, 1.0, tDeploy),
                    THREE.MathUtils.lerp(0.5, 1.0, tDeploy)
                );
            }
            if (rig.bladesLeftFan) rig.bladesLeftFan.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            if (rig.bladesRightFan) rig.bladesRightFan.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            // Rotate ducted fan rotors continuously when in boat mode
            const fanSpin = now * 0.035;
            if (rig.bladesLeftFanRotor) rig.bladesLeftFanRotor.rotation.z = fanSpin;
            if (rig.bladesRightFanRotor) rig.bladesRightFanRotor.rotation.z = -fanSpin;
            break;
        }

        case 'BOULDER': {
            if (rig.boulderPushKnees) {
                rig.boulderPushKnees.position.z = THREE.MathUtils.lerp(1.2, 2.65, tDeploy);
                rig.boulderPushKnees.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.boulderDredgeArms) {
                rig.boulderDredgeArms.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            // Spin brass Kort nozzle props
            const propSpin = now * 0.025;
            if (rig.boulderLeftPropRotor) rig.boulderLeftPropRotor.rotation.z = propSpin;
            if (rig.boulderRightPropRotor) rig.boulderRightPropRotor.rotation.z = -propSpin;
            break;
        }

        case 'OPTIMUS': {
            if (rig.optimusBowProw) {
                rig.optimusBowProw.position.z = THREE.MathUtils.lerp(1.5, 2.8, tDeploy);
                rig.optimusBowProw.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.optimusDelugeTurrets) {
                rig.optimusDelugeTurrets.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.optimusCommandMast) {
                rig.optimusCommandMast.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            break;
        }

        case 'BUMBLEBEE': {
            const spX = THREE.MathUtils.lerp(0.75, 1.25, tDeploy);
            if (rig.bumblebeeLeftSponson) rig.bumblebeeLeftSponson.position.x = -spX;
            if (rig.bumblebeeRightSponson) rig.bumblebeeRightSponson.position.x = spX;
            if (rig.bumblebeeHydroSpoiler) {
                rig.bumblebeeHydroSpoiler.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            break;
        }

        case 'BLURR': {
            // Drop submerged hydrofoils beneath chassis
            if (rig.blurrBowFoil) {
                rig.blurrBowFoil.position.y = THREE.MathUtils.lerp(0.2, -0.45, tDeploy);
                rig.blurrBowFoil.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.blurrSternFoil) {
                rig.blurrSternFoil.position.y = THREE.MathUtils.lerp(0.2, -0.45, tDeploy);
                rig.blurrSternFoil.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            break;
        }

        case 'SALVAGE': {
            if (rig.salvageOceanScoop) {
                rig.salvageOceanScoop.position.z = THREE.MathUtils.lerp(1.0, 2.2, tDeploy);
                rig.salvageOceanScoop.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            // Rotate rear paddlewheels
            const paddleSpin = now * 0.018;
            if (rig.salvagePaddlewheels) {
                rig.salvagePaddlewheels.children.forEach((pw: any) => {
                    pw.rotation.x = paddleSpin;
                });
            }
            break;
        }

        case 'QUICKSHADOW': {
            if (rig.quickshadowBowKnife) {
                rig.quickshadowBowKnife.position.z = THREE.MathUtils.lerp(1.2, 2.65, tDeploy);
                rig.quickshadowBowKnife.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            if (rig.quickshadowPumpJets) {
                rig.quickshadowPumpJets.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.0, tDeploy));
            }
            break;
        }
    }
}

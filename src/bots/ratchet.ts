// 3D Cel-Shaded Model & Morph Builder for RATCHET (Autobot Chief Medical Officer)
// Modes: Bot Mode | Emergency Ambulance (Vehicle) | Water Ambulance (Boat) | Medic Triceratops (Dino)
import * as THREE from 'three';
import {
    toonGrad3, toonGrad4, matDarkSteel, matChrome, matTire,
    matSirenRed, matVisorCyan, applyCartoonInkOutlines
} from '../rendering/materials.js';
import { texFaceRatchet, texRatchetMedPanel, texWindshieldCyan, texGrille } from '../rendering/textures.js';
import { createWheelAssembly } from './botHelpers.js';
import { buildRatchetBoat } from './botBoats.js';
import type { BotRig } from '../types/game.js';

function addMedicalCross(parent: THREE.Object3D, x: number, y: number, z: number, size: number, thickness: number, mat: THREE.Material, rotY = 0) {
    const cross = new THREE.Group();
    cross.position.set(x, y, z);
    cross.rotation.y = rotY;
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(size * 0.34, size, thickness), mat);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.34, thickness), mat);
    vBar.userData.noOutline = true;
    hBar.userData.noOutline = true;
    cross.add(vBar, hBar);
    parent.add(cross);
    return cross;
}

export function buildRatchet(parts: BotRig) {
    // Classic Rescue Bots / Aligned Ratchet Palette: Clinical White, Emergency Rescue Red, Slate Frame, Cyan Optics
    const matWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
    const matRed = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
    const matCrimson = new THREE.MeshToonMaterial({ color: 0xb91c1c, gradientMap: toonGrad3 });
    const matFace = new THREE.MeshBasicMaterial({ map: texFaceRatchet });
    const matMedPanel = new THREE.MeshBasicMaterial({ map: texRatchetMedPanel });
    const matCabGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });
    const matGrilleTex = new THREE.MeshBasicMaterial({ map: texGrille });
    const matBeaconWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const matScanGlow = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    // =========================================================================
    // 1. HEROIC AUTOBOT MEDIC TORSO (White & Red Armored Chest + Cardiogram Trim)
    // =========================================================================
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.35, 1.95), matWhite);
    chest.castShadow = true;
    parts.torso.add(chest);

    // Sculpted Red Ambulance-Windshield Chest Armor Plates (Classic Ratchet Chest!)
    [-0.64, 0.64].forEach(cx => {
        const chestGlass = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.78, 0.24), matCabGlass);
        chestGlass.position.set(cx, 0.56, 0.94);
        chestGlass.rotation.x = -0.14;
        chestGlass.userData.noOutline = true;
        parts.torso.add(chestGlass);

        const chestRedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.92, 0.16), matRed);
        chestRedFrame.position.set(cx, 0.56, 0.90);
        chestRedFrame.rotation.x = -0.14;
        parts.torso.add(chestRedFrame);
    });

    // Center White Crest Badge + Bold Red Medical Cross on Chest
    const badgePlate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.24), matWhite);
    badgePlate.position.set(0, -0.34, 0.92);
    parts.torso.add(badgePlate);
    addMedicalCross(parts.torso, 0, -0.34, 1.06, 0.56, 0.08, matRed);

    // Red Emergency Waist Stripe & Dark Steel Pelvis
    const waistStripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.36, 1.88), matRed);
    waistStripe.position.set(0, -1.08, 0);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.68, 1.55), matDarkSteel);
    pelvis.position.set(0, -1.48, 0);
    parts.torso.add(waistStripe, pelvis);

    // Compact Ambulance Medical Backpack with Twin Shoulder Lightbar Pods
    const medPack = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.85, 0.85), matWhite);
    medPack.position.set(0, 0.25, -1.18);
    medPack.castShadow = true;
    const packStripe = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.38, 0.88), matRed);
    packStripe.position.set(0, -0.1, -1.18);
    parts.torso.add(medPack, packStripe);

    [-0.78, 0.78].forEach(bx => {
        const backPod = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.38), matSirenRed);
        backPod.position.set(bx, 1.32, -1.12);
        backPod.userData.noOutline = true;
        parts.torso.add(backPod);
    });

    // =========================================================================
    // 2. EXPRESSIVE RATCHET HEAD (Red Helmet + Iconic White V-Crest Horns!)
    // =========================================================================
    const helm = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.24, 1.30), matRed);
    helm.castShadow = true;
    parts.head.add(helm);

    // Classic Ratchet White Central Helmet Crest
    const centerCrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 1.12), matWhite);
    centerCrest.position.set(0, 0.72, 0.04);
    parts.head.add(centerCrest);

    // Iconic Twin Angled V-Horns / Medic Head-Fins
    [-1, 1].forEach(side => {
        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.38), matWhite);
        horn.position.set(side * 0.56, 0.78, 0.22);
        horn.rotation.z = side * -0.34;
        horn.rotation.x = -0.15;
        parts.head.add(horn);

        const earPod = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 10).rotateZ(Math.PI / 2), matChrome);
        earPod.position.set(side * 0.72, 0.05, 0.02);
        parts.head.add(earPod);
    });

    // Expressive Faceplate
    const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.94, 1.34), matFace);
    faceMesh.position.set(0, -0.04, 0.03);
    faceMesh.userData.noOutline = true;
    parts.head.add(faceMesh);

    // =========================================================================
    // 3. MEDIC ARMS & FOREARM MED-SCANNER EMITTER
    // =========================================================================
    [-1, 1].forEach(side => {
        const armG = side === -1 ? parts.leftArm : parts.rightArm;
        const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

        // Broad White & Red Ambulance Shoulder Pauldron with Medical Cross
        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.16, 1.24), matWhite);
        pauldron.castShadow = true;
        const pauldronTop = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.26, 1.28), matRed);
        pauldronTop.position.y = 0.54;
        const bicep = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.68), matDarkSteel);
        bicep.position.y = -0.82;
        armG.add(pauldron, pauldronTop, bicep);
        addMedicalCross(armG, side * 0.60, 0.02, 0, 0.52, 0.06, matRed, Math.PI / 2);

        forearmG.position.set(0, -1.25, 0.04);
        armG.add(forearmG);

        const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.24, 0.96), matRed);
        gauntlet.castShadow = true;
        const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 1.00), matWhite);
        cuff.position.y = 0.36;
        forearmG.add(gauntlet, cuff);

        const handG = side === -1 ? parts.leftHand : parts.rightHand;
        handG.position.set(0, -0.58, 0.02);
        forearmG.add(handG);
        const fist = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.76), matDarkSteel);
        fist.position.set(0, -0.20, 0);
        handG.add(fist);

        // Right Wrist Glowing Cyan Med-Scanner Projector
        if (side === 1) {
            const scannerHousing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.64, 0.44), matChrome);
            scannerHousing.position.set(0.56, -0.18, 0.14);
            const scannerLens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10).rotateX(Math.PI / 2), matScanGlow);
            scannerLens.position.set(0.56, -0.18, 0.40);
            scannerLens.userData.noOutline = true;
            forearmG.add(scannerHousing, scannerLens);
        }
    });

    // =========================================================================
    // 4. STURDY MEDIC LEGS (White Greaves, Articulated Knees & Ankles, Chrome Trims)
    // =========================================================================
    [-1, 1].forEach(side => {
        const legG = side === -1 ? parts.leftLeg : parts.rightLeg;
        const lowerLegG = side === -1 ? parts.leftLowerLeg : parts.rightLowerLeg;
        const footG = side === -1 ? parts.leftFoot : parts.rightFoot;

        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.38, 1.12), matDarkSteel);
        thigh.position.y = -0.52;
        legG.add(thigh);

        lowerLegG.position.set(0, -0.96, 0);
        legG.add(lowerLegG);

        const shin = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.56, 1.32), matWhite);
        shin.position.set(0, -0.56, 0.06);
        shin.castShadow = true;
        const kneeGuard = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.54, 0.42), matRed);
        kneeGuard.position.set(0, 0.04, 0.62);
        const shinStripe = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.30, 1.36), matRed);
        shinStripe.position.set(0, -0.82, 0.06);
        lowerLegG.add(shin, kneeGuard, shinStripe);

        footG.position.set(0, -1.46, 0.24);
        const boot = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.56, 1.82), matCrimson);
        boot.castShadow = true;
        const toeCap = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.36, 0.42), matChrome);
        toeCap.position.set(0, -0.06, 0.84);
        footG.add(boot, toeCap);
        lowerLegG.add(footG);
    });

    // =========================================================================
    // 5. VEHICLE MODE: CLASSIC RESCUE BOTS EMERGENCY AMBULANCE SHELL
    // =========================================================================
    const ambShell = new THREE.Group();
    ambShell.visible = false;
    parts.ratchetAmbulanceShell = ambShell;
    parts.chassis.add(ambShell);

    // Lower Dark Steel Chassis Underbody & Bumpers
    const underbody = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.55, 6.85), matDarkSteel);
    underbody.position.set(0, 0.72, 0);
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.56, 0.54), matChrome);
    frontBumper.position.set(0, 0.74, 3.55);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.52, 0.52), matChrome);
    rearBumper.position.set(0, 0.72, -3.52);
    ambShell.add(underbody, frontBumper, rearBumper);

    // Forward Ambulance Cab Hood, Grille, Headlights & Wrap-Around Windshield
    const cabHood = new THREE.Mesh(new THREE.BoxGeometry(3.26, 1.18, 1.75), matWhite);
    cabHood.position.set(0, 1.48, 2.55);
    cabHood.castShadow = true;
    const hoodRedStripe = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.36, 1.78), matRed);
    hoodRedStripe.position.set(0, 1.24, 2.55);
    const hoodCenterCross = addMedicalCross(ambShell, 0, 2.10, 2.58, 0.85, 0.08, matRed);
    hoodCenterCross.rotation.x = Math.PI / 2;

    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.72, 0.16), matGrilleTex);
    frontGrille.position.set(0, 1.38, 3.44);
    frontGrille.userData.noOutline = true;

    [-1.22, 1.22].forEach(hx => {
        const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.18), matAmberGlow);
        headlight.position.set(hx, 1.42, 3.44);
        headlight.userData.noOutline = true;
        ambShell.add(headlight);
    });

    // Cab Cabin Pillars & Cyan Windshield
    const cabUpper = new THREE.Mesh(new THREE.BoxGeometry(3.24, 1.22, 1.65), matWhite);
    cabUpper.position.set(0, 2.52, 1.38);
    cabUpper.castShadow = true;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.96, 0.18), matCabGlass);
    windshield.position.set(0, 2.56, 2.22);
    windshield.rotation.x = -0.22;
    windshield.userData.noOutline = true;
    [-1.63, 1.63].forEach(wx => {
        const sideCabWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.84, 1.18), matCabGlass);
        sideCabWin.position.set(wx, 2.56, 1.42);
        sideCabWin.userData.noOutline = true;
        ambShell.add(sideCabWin);
    });
    ambShell.add(cabHood, hoodRedStripe, frontGrille, cabUpper, windshield);

    // Tall Boxy Paramedic Rear Ambulance Patient Module
    const medBox = new THREE.Mesh(new THREE.BoxGeometry(3.52, 2.52, 4.38), matWhite);
    medBox.position.set(0, 2.18, -1.24);
    medBox.castShadow = true;
    const medRoofCap = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.28, 4.24), matRed);
    medRoofCap.position.set(0, 3.52, -1.24);
    ambShell.add(medBox, medRoofCap);

    // Textured Left & Right Side Medical Cardiogram / Ambulance Panels
    [-1.78, 1.78].forEach(sx => {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.12, 2.18), matMedPanel);
        panel.position.set(sx, 2.18, -1.24);
        panel.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        panel.userData.noOutline = true;
        ambShell.add(panel);
    });

    // Rear Double Ambulance Doors with Medical Crosses & High Emergency Flashers
    const rearSeam = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.28, 0.14), matDarkSteel);
    rearSeam.position.set(0, 2.12, -3.44);
    const rearRedBand = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.54, 0.12), matRed);
    rearRedBand.position.set(0, 1.56, -3.44);
    [-0.86, 0.86].forEach(rx => {
        const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 0.14), matCabGlass);
        rearWin.position.set(rx, 2.74, -3.44);
        rearWin.userData.noOutline = true;
        const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.14), matSirenRed);
        tailLight.position.set(rx * 1.45, 1.24, -3.45);
        tailLight.userData.noOutline = true;
        const highFlasher = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.14), matSirenRed);
        highFlasher.position.set(rx * 1.38, 3.30, -3.45);
        highFlasher.userData.noOutline = true;
        ambShell.add(rearWin, tailLight, highFlasher);
    });
    addMedicalCross(ambShell, 0, 2.08, -3.48, 0.76, 0.08, matRed);
    ambShell.add(rearSeam, rearRedBand);

    // Top Roof Medical Cross & Emergency Red/White Strobe Lightbar (registered on parts.lightbar!)
    const roofCross = addMedicalCross(ambShell, 0, 3.68, -1.35, 1.65, 0.08, matWhite);
    roofCross.rotation.x = Math.PI / 2;

    const lbGroup = new THREE.Group();
    lbGroup.position.set(0, 3.76, 1.35);
    const lbBase = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.16, 0.48), matDarkSteel);
    const redPod = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.34, 0.44), matSirenRed);
    redPod.position.set(-0.74, 0.22, 0);
    redPod.userData.noOutline = true;
    const bluePod = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.34, 0.44), matBeaconWhite);
    bluePod.position.set(0.74, 0.22, 0);
    bluePod.userData.noOutline = true;
    const centerPod = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.28, 0.40), matSirenRed);
    centerPod.position.set(0, 0.20, 0);
    centerPod.userData.noOutline = true;
    lbGroup.add(lbBase, redPod, bluePod, centerPod);
    ambShell.add(lbGroup);
    parts.lightbar = {
        group: lbGroup,
        red: redPod,
        blue: bluePod,
        redMat: matSirenRed,
        blueMat: matBeaconWhite,
        redPod,
        bluePod
    };

    // 4 Chunky Ambulance Wheels (Bottom of tires at y = 0.0 inside ambShell!)
    [
        [-1.68, 0.78, 2.22],
        [1.68, 0.78, 2.22],
        [-1.68, 0.78, -1.96],
        [1.68, 0.78, -1.96]
    ].forEach(([wx, wy, wz]) => {
        const wheel = createWheelAssembly(0.78, 0.50);
        wheel.position.set(wx, wy, wz);
        ambShell.add(wheel);
        parts.wheels.push(wheel);
    });

    // =========================================================================
    // 6. DINO MODE: MEDIC TRICERATOPS (Distinct White, Emergency Red & Chrome!)
    // =========================================================================
    // Dorsal Armored Medical Spine & Emergency Strobe Ridge along Triceratops Back
    const dinoBackArmor = new THREE.Group();
    const backShell = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.82, 3.15), matWhite);
    backShell.position.set(0, 2.86, -0.08);
    backShell.castShadow = true;
    const backRedStripe = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.28, 3.18), matRed);
    backRedStripe.position.set(0, 2.74, -0.08);
    const backRoofCross = addMedicalCross(dinoBackArmor, 0, 3.30, -0.15, 1.15, 0.10, matRed);
    backRoofCross.rotation.x = Math.PI / 2;

    // Dorsal Triceratops Mini-Strobe Bar
    const dinoStrobeBar = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.26, 0.36), matSirenRed);
    dinoStrobeBar.position.set(0, 3.42, 0.85);
    dinoStrobeBar.userData.noOutline = true;
    dinoBackArmor.add(backShell, backRedStripe, dinoStrobeBar);
    parts.dinoGroup.add(dinoBackArmor);

    // Sculpted Triceratops Skull + Iconic Sweeping White & Red Medical Shield Frill!
    const triSkull = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.24, 1.82), matWhite);
    triSkull.position.set(0, 0.15, 0.65);
    triSkull.castShadow = true;
    const triBeak = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.78, 1.05), matRed);
    triBeak.position.set(0, -0.08, 1.72);
    const triJaw = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.34, 1.15), matChrome);
    triJaw.position.set(0, -0.54, 1.38);

    // Glowing Cyan Triceratops Diagnostic Optics
    [-0.68, 0.68].forEach(ex => {
        const dEye = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.42), matVisorCyan);
        dEye.position.set(ex, 0.34, 1.18);
        dEye.userData.noOutline = true;
        parts.dinoHead.add(dEye);
    });

    // Sweeping Wide White & Red Medical Shield Frill with Cyan Scanner Trim
    const frillMain = new THREE.Mesh(new THREE.BoxGeometry(3.25, 2.38, 0.38), matWhite);
    frillMain.position.set(0, 1.05, -0.18);
    frillMain.rotation.x = -0.34;
    frillMain.castShadow = true;

    const frillRedRim = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.42, 0.44), matRed);
    frillRedRim.position.set(0, 2.02, -0.52);
    frillRedRim.rotation.x = -0.34;

    const frillCyanTrim = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.16, 0.44), matScanGlow);
    frillCyanTrim.position.set(0, 1.66, -0.38);
    frillCyanTrim.rotation.x = -0.34;
    frillCyanTrim.userData.noOutline = true;

    const frillCross = addMedicalCross(parts.dinoHead, 0, 1.16, -0.02, 1.02, 0.12, matRed);
    frillCross.rotation.x = -0.34;

    // 5 Chrome Frill Crown Spikes along Top Rim
    for (let s = -2; s <= 2; s++) {
        const fSpike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 6), matChrome);
        fSpike.position.set(s * 0.72, 2.36, -0.64);
        fSpike.rotation.x = -0.34;
        parts.dinoHead.add(fSpike);
    }

    // Twin Long Chrome Brow Horns + Emergency Red Nose Horn!
    [-0.56, 0.56].forEach(hx => {
        const browHorn = new THREE.Mesh(
            new THREE.ConeGeometry(0.22, 2.45, 8).rotateX(Math.PI * 0.38),
            matChrome
        );
        browHorn.position.set(hx, 0.92, 1.68);
        parts.dinoHead.add(browHorn);
    });
    const noseHorn = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 1.12, 8).rotateX(Math.PI * 0.18),
        matRed
    );
    noseHorn.position.set(0, 0.54, 2.08);

    parts.dinoHead.add(triSkull, triBeak, triJaw, frillMain, frillRedRim, frillCyanTrim, noseHorn);

    // Armored White & Red Segmented Triceratops Tail
    const triTailBase = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.04, 1.62), matWhite);
    triTailBase.position.set(0, 0, -0.78);
    const triTailBand = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.32, 0.68), matRed);
    triTailBand.position.set(0, 0.08, -0.82);
    const triTailTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.64, 2.15, 6).rotateX(-Math.PI / 2),
        matRed
    );
    triTailTip.position.set(0, -0.04, -2.35);
    parts.dinoTail.add(triTailBase, triTailBand, triTailTip);

    // =========================================================================
    // 7. BOAT MODE: WATER AMBULANCE / MARINE EMERGENCY RESCUE BOAT
    // =========================================================================
    buildRatchetBoat(parts);
    applyCartoonInkOutlines(parts.root, 1.04, true);
}

export default buildRatchet;

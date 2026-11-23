// 3D Cel-Shaded Model & Morph Builder for STARSPEED
// Modes: Bot Mode | Dirt Bike (Vehicle) | Jet Ski (Boat) | Spinosaurus (Dino)
import * as THREE from 'three';
import { toonGrad3, matDarkSteel, matChrome, applyCartoonInkOutlines } from '../rendering/materials.js';
import { buildStarspeedBoat } from './botBoats.js';
import type { BotRig } from '../types/game.js';

function createKnobbyBikeWheel(radius = 0.92, width = 0.42): THREE.Group {
    const wg = new THREE.Group();
    const matTire = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matRim = new THREE.MeshToonMaterial({ color: 0xfde047, gradientMap: toonGrad3 });
    const matHub = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });

    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, width, 16).rotateZ(Math.PI / 2),
        matTire
    );
    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.04, 14).rotateZ(Math.PI / 2),
        matRim
    );
    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, width + 0.1, 10).rotateZ(Math.PI / 2),
        matHub
    );
    wg.add(tire, rim, hub);

    // Knobby motocross tread lugs around circumference
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const lug = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.16, 0.18), matTire);
        lug.position.set(0, Math.cos(a) * (radius + 0.04), Math.sin(a) * (radius + 0.04));
        lug.rotation.x = a;
        wg.add(lug);
    }
    return wg;
}

export function buildStarspeed(parts: BotRig) {
    const matTeal = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
    const matDeepTeal = new THREE.MeshToonMaterial({ color: 0x0e7490, gradientMap: toonGrad3 });
    const matWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
    const matCoral = new THREE.MeshToonMaterial({ color: 0xf43f5e, gradientMap: toonGrad3 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfde047, gradientMap: toonGrad3 });
    const matVisor = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const matGlowCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // 1. Torso: Sleek Cosmic Motocross Core
    const chest = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.2, 1.75), matTeal);
    chest.castShadow = true;
    const chestArmor = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.35, 0.35), matWhite);
    chestArmor.position.set(0, 0.25, 0.88);
    const starCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), matGold);
    starCrest.scale.set(1, 1, 0.35);
    starCrest.position.set(0, 0.3, 1.08);
    starCrest.userData.noOutline = true;

    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 1.45), matCoral);
    belt.position.set(0, -1.25, 0);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.72, 1.25), matDeepTeal);
    pelvis.position.set(0, -1.62, 0);
    parts.torso.add(chest, chestArmor, starCrest, belt, pelvis);

    // Back Twin Exhaust Boosters (Bot Mode)
    [-0.55, 0.55].forEach(bx => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.65, 10), matChrome);
        pipe.position.set(bx, 0.65, -1.02);
        pipe.rotation.x = -0.22;
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), matGlowCyan);
        glow.position.set(bx, 1.45, -1.2);
        glow.userData.noOutline = true;
        parts.torso.add(pipe, glow);
    });

    // 2. Head: Aerodynamic Motocross Helmet with Glowing Starlight Visor
    const helm = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.18, 1.28), matTeal);
    helm.castShadow = true;
    const helmPeak = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.72).rotateX(0.18), matCoral);
    helmPeak.position.set(0, 0.52, 0.58);
    const helmCrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 1.18), matWhite);
    helmCrest.position.set(0, 0.65, 0.02);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.42, 0.2), matVisor);
    visor.position.set(0, 0.08, 0.62);
    visor.userData.noOutline = true;
    const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.36), matWhite);
    chinGuard.position.set(0, -0.34, 0.58);
    parts.head.add(helm, helmPeak, helmCrest, visor, chinGuard);

    // 3. Arms: Motocross Pauldrons & Agile Forearms
    [-1, 1].forEach(side => {
        const armG = side === -1 ? parts.leftArm : parts.rightArm;
        const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.15, 1.25), matCoral);
        pauldron.castShadow = true;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 1.2), matWhite);
        cap.position.y = 0.62;
        const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.68, 10), matDarkSteel);
        bicep.position.y = -0.78;
        armG.add(pauldron, cap, bicep);

        forearmG.position.set(0, -1.2, 0);
        armG.add(forearmG);
        const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.28, 0.84), matTeal);
        gauntlet.position.set(0, -0.45, 0.04);
        const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 0.9), matGold);
        cuff.position.set(0, -0.22, 0.04);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), matDarkSteel);
        hand.position.set(0, -1.14, 0.04);
        forearmG.add(gauntlet, cuff, hand);
    });

    // 4. Legs: Tall Agile Shins & Motocross Boots
    [-1, 1].forEach(side => {
        const legG = side === -1 ? parts.leftLeg : parts.rightLeg;
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 10), matDarkSteel);
        thigh.position.set(-side * 0.04, -0.48, 0);
        const shin = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.25, 1.38), matTeal);
        shin.position.set(-side * 0.06, -1.72, 0.04);
        shin.castShadow = true;
        const kneeGuard = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.34), matGold);
        kneeGuard.position.set(-side * 0.06, -0.95, 0.72);
        const boot = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.48, 1.75), matWhite);
        boot.position.set(-side * 0.06, -2.85, 0.28);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 1.45), matCoral);
        stripe.position.set(-side * 0.06, -2.25, 0.04);
        legG.add(thigh, shin, kneeGuard, boot, stripe);
    });

    // 5. VEHICLE MODE: SLEEK OFF-ROAD DIRT BIKE SHELL (Morphs smoothly when morph > 0!)
    const bikeShell = new THREE.Group();
    bikeShell.visible = false;
    parts.starspeedBikeShell = bikeShell;
    parts.chassis.add(bikeShell);

    // Narrow Tubular Motocross Frame & Engine Block
    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.95, 1.55), matDarkSteel);
    engineBlock.position.set(0, -0.38, -0.1);
    const frameSpine = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.45, 2.65).rotateX(-0.18), matWhite);
    frameSpine.position.set(0, 0.38, 0.05);
    const fuelTank = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 1.35).rotateX(-0.22), matTeal);
    fuelTank.position.set(0, 0.78, 0.55);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 1.65).rotateX(0.08), matDarkSteel);
    seat.position.set(0, 0.72, -0.68);
    const tailFender = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 1.35).rotateX(-0.28), matCoral);
    tailFender.position.set(0, 0.86, -1.82);

    // Side Number Fairings
    [-0.56, 0.56].forEach(sx => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 1.45), matCoral);
        panel.position.set(sx, 0.42, -0.45);
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.65, 10).rotateX(Math.PI / 2 - 0.18), matChrome);
        exhaust.position.set(sx * 0.95, 0.25, -1.35);
        bikeShell.add(panel, exhaust);
    });

    // Telescopic Front Forks, High Motocross Fender, Headlight Plate & Wide Handlebars
    [-0.32, 0.32].forEach(fx => {
        const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.35, 10).rotateX(-0.34), matGold);
        fork.position.set(fx, 0.22, 1.52);
        bikeShell.add(fork);
    });
    const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 1.45).rotateX(-0.14), matCoral);
    frontFender.position.set(0, 0.68, 1.98);
    const numberPlate = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.75, 0.22).rotateX(-0.28), matWhite);
    numberPlate.position.set(0, 1.28, 1.48);
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.12), matVisor);
    headlight.position.set(0, 1.24, 1.62);
    headlight.userData.noOutline = true;
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.95, 10).rotateZ(Math.PI / 2), matChrome);
    handlebar.position.set(0, 1.65, 1.15);
    [-0.92, 0.92].forEach(hx => {
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.32), matTeal);
        handguard.position.set(hx, 1.65, 1.25);
        bikeShell.add(handguard);
    });

    // Front & Rear Knobby Motocross Wheels!
    const frontWheel = createKnobbyBikeWheel(0.95, 0.42);
    frontWheel.position.set(0, -0.58, 2.02);
    const rearWheel = createKnobbyBikeWheel(0.95, 0.48);
    rearWheel.position.set(0, -0.58, -1.78);
    parts.wheels.push(frontWheel, rearWheel);

    bikeShell.add(
        engineBlock, frameSpine, fuelTank, seat, tailFender,
        frontFender, numberPlate, headlight, handlebar, frontWheel, rearWheel
    );

    // 6. DINO MODE: SPINOSAURUS (Iconic Massive Dorsal Sail Fin + Elongated Crocodilian Snout + Swimming Tail!)
    // Elongated Spinosaurus Neck & Crocodilian Snout on `parts.dinoHead`
    const spinoNeck = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.25, 1.45).rotateX(0.32), matTeal);
    spinoNeck.position.set(0, 0.65, 0.32);
    parts.dinoHead.add(spinoNeck);

    const spinoHeadGroup = new THREE.Group();
    spinoHeadGroup.position.set(0, 1.38, 0.85);
    parts.dinoHead.add(spinoHeadGroup);

    const skullBack = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.85, 1.15), matTeal);
    skullBack.position.set(0, 0.08, 0.15);
    const snoutUpper = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.44, 1.85), matTeal);
    snoutUpper.position.set(0, 0.05, 1.35);
    const snoutTip = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.52), matCoral);
    snoutTip.position.set(0, 0.04, 2.38);
    const nasalCrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.85).rotateX(-0.22), matGold);
    nasalCrest.position.set(0, 0.44, 0.72);
    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 1.95), matWhite);
    lowerJaw.position.set(0, -0.26, 1.3);
    const spinoOptics = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.24, 0.42), matVisor);
    spinoOptics.position.set(0, 0.22, 0.45);
    spinoOptics.userData.noOutline = true;

    // Crisp White Conical Teeth along Snout
    for (let t = 0; t < 4; t++) {
        [-0.25, 0.25].forEach(tx => {
            const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4).rotateX(Math.PI), matWhite);
            tooth.position.set(tx, -0.14, 0.78 + t * 0.42);
            spinoHeadGroup.add(tooth);
        });
    }
    spinoHeadGroup.add(skullBack, snoutUpper, snoutTip, nasalCrest, lowerJaw, spinoOptics);

    // ICONIC MASSIVE SPINOSAURUS DORSAL SAIL FIN on `parts.dinoGroup`!
    const sailGroup = new THREE.Group();
    sailGroup.position.set(0, 2.75, -0.35);
    const sailWeb = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 2.15, 0.22, 18, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2),
        matCoral
    );
    sailWeb.scale.set(1.0, 1.15, 1.12);
    sailGroup.add(sailWeb);

    // Radiating Starlight-Gold Dorsal Spines across the Sail!
    for (let sp = -3; sp <= 3; sp++) {
        const ang = (sp / 3.6) * (Math.PI * 0.44);
        const h = 2.45 - Math.abs(sp) * 0.24;
        const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, h, 6), matGold);
        spine.position.set(0, Math.cos(ang) * (h * 0.52), Math.sin(ang) * (h * 0.52));
        spine.rotation.x = ang;
        sailGroup.add(spine);
    }
    parts.dinoGroup.add(sailGroup);

    // Clawed Spinosaurus Forelimbs
    [-1, 1].forEach(side => {
        const armG = side === -1 ? parts.dinoLeftArm : parts.dinoRightArm;
        armG.position.set(side * 0.82, 1.85, 0.75);
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.82, 0.28).rotateX(0.45), matTeal);
        upper.position.set(0, -0.35, 0);
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 4).rotateX(Math.PI / 2), matGold);
        claw.position.set(0, -0.72, 0.24);
        armG.add(upper, claw);
    });

    // Long Articulated Spinosaurus Paddle Tail
    let prevTail = parts.dinoTail;
    for (let s = 0; s < 5; s++) {
        const seg = new THREE.Group();
        seg.position.set(0, 0, -0.88);
        const sz = 1.05 - s * 0.16;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.85, 0.98), matTeal);
        mesh.position.set(0, 0, -0.44);
        // Paddle fin crest along top of Spinosaurus tail!
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55 - s * 0.06, 0.96), matCoral);
        fin.position.set(0, sz * 0.52, -0.44);
        seg.add(mesh, fin);
        prevTail.add(seg);
        prevTail = seg;
    }

    // 7. BOAT MODE: COSMIC HYDRO JET SKI
    buildStarspeedBoat(parts);
    applyCartoonInkOutlines(parts.root, 1.04, true);
}

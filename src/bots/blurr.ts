// 3D Cel-Shaded Model & Morph Builder for BLURR
import * as THREE from 'three';
import { createBlurrTurbineWheel } from './botHelpers.js';

export function buildBlurr(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Blurr: Royal Purple (#7c3aed) Le Mans Hyper-Speedster with Crisp White Center Racing Stripe,
                // Cyan Bubble Cockpit Canopy, White Shoulder Lightning Bolts, Neon-Green Turbine Fan Wheels,
                // Triple Segmented Shin Speedbars, and High Rear Black GT Racing Spoiler!

                // 1. Torso: Aerodynamic Le Mans Speedster Cockpit Core
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.3, 1.95), matBlurrPurple);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Front Chest Panel with Cyan Cockpit Canopy, Center White Stripe & Autobot Crest
                const chestFace = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.15, 0.22), matBlurrChest);
                chestFace.position.set(0, 0.02, 0.98);
                chestFace.userData.noOutline = true;
                parts.torso.add(chestFace);

                // Crisp White Collar Yoke wrapping over shoulders & around neck
                const collarYoke = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.36, 1.55), matBlurrWhite);
                collarYoke.position.set(0, 1.15, -0.05);
                parts.torso.add(collarYoke);

                // Lower Torso / Pelvis: Purple Belt Band with Crisp White Trim & Inverted Chevron Buckle
                const beltBand = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 1.55), matBlurrPurple);
                beltBand.position.set(0, -1.25, 0);
                const beltTrim = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 1.58), matBlurrWhite);
                beltTrim.position.set(0, -1.14, 0);
                const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.22), matBlurrWhite);
                beltBuckle.position.set(0, -1.28, 0.78);
                const groinPlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.25), matBlurrPurple);
                groinPlate.position.set(0, -1.6, 0);
                parts.torso.add(beltBand, beltTrim, beltBuckle, groinPlate);

                // High Rear Black GT Racing Spoiler (Mounted on Twin Upright Stanchions Behind Head)
                [-0.85, 0.85].forEach(sx => {
                    const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.28), matBlurrBlack);
                    stanchion.position.set(sx, 1.62, -1.05);
                    stanchion.castShadow = true;
                    parts.torso.add(stanchion);
                });
                const gtWing = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.16, 0.78), matBlurrBlack);
                gtWing.position.set(0, 2.48, -1.05);
                gtWing.castShadow = true;
                parts.torso.add(gtWing);

                [-1.58, 1.58].forEach(wx => {
                    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.88), matBlurrBlack);
                    endplate.position.set(wx, 2.48, -1.05);
                    parts.torso.add(endplate);
                });

                // Front Ground-Effects Splitter with Neon-Green Winglets on `parts.frontAttachment`
                const noseLip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.85), matBlurrBlack);
                noseLip.position.set(0, 0.05, 0.35);
                parts.frontAttachment.add(noseLip);

                [-1.35, 1.35].forEach(nx => {
                    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.95), matBlurrNeonGreen);
                    winglet.position.set(nx, 0.08, 0.35);
                    parts.frontAttachment.add(winglet);
                });

                // 2. Head: Purple Helmet with Twin Neon-Green Racing Stripes, Silver Center Vent & Visor
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.25, 1.22), matBlurrPurple);
                helm.castShadow = true;
                parts.head.add(helm);

                const crownDome = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.58, 0.62, 1.22, 16).rotateZ(Math.PI / 2),
                    matBlurrPurple
                );
                crownDome.position.set(0, 0.62, 0);
                parts.head.add(crownDome);

                // Center Silver Crest Slat
                const crestSlat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 1.05), matBlurrWhite);
                crestSlat.position.set(0, 0.68, 0.05);
                parts.head.add(crestSlat);

                // Twin Neon-Green Racing Stripes running along top of helmet
                [-0.22, 0.22].forEach(hx => {
                    const hStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 1.05), matBlurrNeonGreen);
                    hStripe.position.set(hx, 0.68, 0.05);
                    parts.head.add(hStripe);
                });

                // Cylindrical Silver Ear Communication Pods (Left & Right)
                [-0.64, 0.64].forEach(ex => {
                    const ear = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.26, 0.26, 0.18, 14).rotateZ(Math.PI / 2),
                        matBlurrWhite
                    );
                    ear.position.set(ex, 0.05, 0);
                    parts.head.add(ear);
                });

                // Face Mesh with glowing optics visor and smile
                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1.02, 1.24), matBlurrFace);
                faceMesh.position.set(0, -0.04, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // 3. Arms: Broad Rounded Shoulders with White Lightning Bolts, Side Turbine Wheels, & Neon-Green Cuffs
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    // Rounded Shoulder Pauldron
                    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.35, 1.45), matBlurrPurple);
                    pauldron.castShadow = true;
                    armG.add(pauldron);

                    // White Shoulder Top Racing Cap
                    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.18, 1.38), matBlurrWhite);
                    cap.position.set(0, 0.72, 0);
                    armG.add(cap);

                    // Front White Speed Lightning Bolt Graphic Panel
                    const lightningPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.26, 0.12), matBlurrShoulder);
                    lightningPanel.position.set(0, 0, 0.74);
                    lightningPanel.userData.noOutline = true;
                    armG.add(lightningPanel);

                    // Front Turbine Fan Wheel mounted on outer side of shoulder
                    const wheel = createBlurrTurbineWheel(0.68, 0.44);
                    wheel.position.set(side * 0.58, -0.15, 0.05);
                    armG.add(wheel);
                    parts.wheels.push(wheel);

                    // Gunmetal Steel Bicep Cylinder
                    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.65, 12), matBlurrSteel);
                    bicep.position.set(0, -0.85, 0);
                    armG.add(bicep);

                    // Forearm & Hand Group
                    forearmG.position.set(0, -1.25, 0);
                    armG.add(forearmG);

                    // Purple Gauntlet
                    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.35, 0.96), matBlurrPurple);
                    gauntlet.position.set(0, -0.45, 0.05);
                    gauntlet.castShadow = true;

                    // Neon-Green Digital Speedometer Cuff Band (TV Show Detail!)
                    const speedoCuff = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.32, 1.02), matBlurrNeonGreen);
                    speedoCuff.position.set(0, -0.22, 0.05);

                    // Gunmetal Charcoal Hand
                    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), matBlurrSteel);
                    hand.position.set(0, -1.18, 0.05);

                    forearmG.add(gauntlet, speedoCuff, hand);
                });

                // 4. Legs: Gunmetal Thighs, Aerodynamic Shins with Triple Neon-Green Lightbars, Rear Turbine Wheels, & White Toes
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    // Gunmetal Steel Cylindrical Thigh
                    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.15, 12), matBlurrSteel);
                    thigh.position.set(-side * 0.05, -0.48, 0);
                    thigh.castShadow = true;
                    legG.add(thigh);

                    // Articulated Knee Joint Disc
                    const kneeDisc = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.35, 0.35, 0.35, 12).rotateZ(Math.PI / 2),
                        matBlurrSteel
                    );
                    kneeDisc.position.set(-side * 0.05, -1.05, 0.05);
                    legG.add(kneeDisc);

                    // Aerodynamic Flared Shin / Fender
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.38, 2.35, 1.65), matBlurrPurple);
                    shin.position.set(-side * 0.08, -1.75, 0.05);
                    shin.castShadow = true;
                    legG.add(shin);

                    // Front of Shin: Triple Vertical Neon-Green Speed Lightbars
                    const shinBars = new THREE.Mesh(new THREE.BoxGeometry(1.22, 2.15, 0.14), matBlurrShin);
                    shinBars.position.set(-side * 0.08, -1.75, 0.89);
                    shinBars.userData.noOutline = true;
                    legG.add(shinBars);

                    // Rear Turbine Wheel Mount (Outer lower shin)
                    const wheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;
                    wheelMount.position.set(side * 0.58, 0, -0.1);
                    legG.add(wheelMount);

                    const rw = createBlurrTurbineWheel(0.68, 0.44);
                    rw.position.set(0, -1.82, 0);
                    wheelMount.add(rw);
                    parts.wheels.push(rw);

                    // Foot: Purple Heel + Sloped Crisp White Racing Toe
                    const heel = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.45, 1.1), matBlurrPurple);
                    heel.position.set(-side * 0.08, -2.85, -0.2);
                    heel.castShadow = true;

                    const whiteToe = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.42, 1.15), matBlurrWhite);
                    whiteToe.position.set(-side * 0.08, -2.87, 0.62);
                    whiteToe.castShadow = true;

                    // Neon-Green Aerodynamic Side Splitter Winglet (Extending from outer foot)
                    const sideSplitter = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 1.45), matBlurrNeonGreen);
                    sideSplitter.position.set(side * 0.65 - side * 0.08, -3.0, 0.35);

                    legG.add(heel, whiteToe, sideSplitter);
                });

                // 6. Gallimimus Dinobot Mode (Aerodynamic S-Neck, Slender Head, Avian Forelimbs & Counterbalance Tail)
                const galliNeckLower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 1.8, 10).rotateX(0.28), matBlurrPurple);
                galliNeckLower.position.set(0, 0.85, 0.25);
                parts.dinoHead.add(galliNeckLower);

                const galliNeckStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.82, 0.48), matBlurrWhite);
                galliNeckStripe.position.set(0, 0.85, 0.26);
                parts.dinoHead.add(galliNeckStripe);

                const galliHeadGroup = new THREE.Group();
                galliHeadGroup.position.set(0, 1.85, 0.65);
                parts.dinoHead.add(galliHeadGroup);

                const galliSkull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.68, 1.45), matBlurrPurple);
                galliSkull.position.set(0, 0, 0.35);
                galliHeadGroup.add(galliSkull);

                const galliStripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 1.48), matBlurrWhite);
                galliStripe.position.set(0, 0, 0.35);
                galliHeadGroup.add(galliStripe);

                [-0.32, 0.32].forEach(cx => {
                    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 1.1).rotateX(-0.35), matBlurrNeonGreen);
                    crest.position.set(cx, 0.38, 0.05);
                    galliHeadGroup.add(crest);
                });

                const galliVisor = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 0.55), matBlurrCyanGlow);
                galliVisor.position.set(0, 0.08, 0.65);
                galliVisor.userData.noOutline = true;
                galliHeadGroup.add(galliVisor);

                const galliBeak = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4), matBlurrBlack);
                galliBeak.position.set(0, -0.08, 1.45);
                galliHeadGroup.add(galliBeak);

                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.dinoLeftArm : parts.dinoRightArm;
                    armG.position.set(side * 0.75, 2.1, 0.65);
                    const armUpper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22).rotateX(0.45), matBlurrPurple);
                    armUpper.position.set(0, -0.28, 0);
                    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4).rotateX(Math.PI / 2), matBlurrNeonGreen);
                    claw.position.set(0, -0.58, 0.18);
                    armG.add(armUpper, claw);
                });

                let prevTail = parts.dinoTail;
                for (let s = 0; s < 5; s++) {
                    const seg = new THREE.Group();
                    seg.position.set(0, 0, -0.85);
                    const sz = 0.95 - s * 0.16;
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.82, 0.95), matBlurrPurple);
                    mesh.position.set(0, 0, -0.42);
                    const dorsal = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.96), matBlurrWhite);
                    dorsal.position.set(0, sz * 0.42, -0.42);
                    seg.add(mesh, dorsal);
                    if (s === 4) {
                        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.65, 4).rotateX(-Math.PI / 2), matBlurrNeonGreen);
                        tip.position.set(0, 0, -0.95);
                        seg.add(tip);
                    }
                    prevTail.add(seg);
                    prevTail = seg;
                }

                // =============================================================
                // MEGA BOT: BLURR AERO SPEED MONSTER TRUCK CONVERSION
                // =============================================================
                // 1. Vehicle Mode: Aero Speed Monster Chassis with Chrome Blower & Giant Turbine Monster Tires
                const megaMonsterShell = new THREE.Group();
                megaMonsterShell.userData.isMegaPart = true;
                megaMonsterShell.visible = false;
                parts.megaMonsterShell = megaMonsterShell;
                parts.chassis.add(megaMonsterShell);

                // Lifted Aero Frame Chassis
                const speedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 4.4), matBlurrViolet);
                speedFrame.position.set(0, -0.2, 0);
                speedFrame.castShadow = true;
                megaMonsterShell.add(speedFrame);

                // Chrome High-Rise Supercharger Blower with Cyan Butterflies
                const blowerBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.4), matChrome);
                blowerBase.position.set(0, 1.4, 1.2);
                blowerBase.castShadow = true;
                const scoop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.9), matBlurrPurple);
                scoop.position.set(0, 1.95, 1.1);
                [-0.4, 0, 0.4].forEach(bx => {
                    const butterfly = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10).rotateX(Math.PI / 2), matBlurrCyanGlow);
                    butterfly.position.set(bx, 1.95, 1.58);
                    butterfly.userData.noOutline = true;
                    megaMonsterShell.add(butterfly);
                });
                megaMonsterShell.add(blowerBase, scoop);

                // High-Downforce Carbon GT Mega Wing at Rear
                const wingGroup = new THREE.Group();
                wingGroup.position.set(0, 1.6, -2.4);
                [-1.1, 1.1].forEach(px => {
                    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.6).rotateX(0.2), matDarkSteel);
                    pylon.position.set(px, 0.4, 0);
                    wingGroup.add(pylon);
                });
                const mainWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.2), matBlurrPurple);
                mainWing.position.set(0, 1.0, -0.15);
                const wingEndL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 1.4), matBlurrNeonGreen);
                wingEndL.position.set(-1.8, 1.0, -0.15);
                const wingEndR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 1.4), matBlurrNeonGreen);
                wingEndR.position.set(1.8, 1.0, -0.15);
                wingGroup.add(mainWing, wingEndL, wingEndR);
                megaMonsterShell.add(wingGroup);

                // 4 Giant 2.6m Speed Monster Tires with Neon-Green Turbine Beadlocks
                [[-1.85, 1.45], [1.85, 1.45], [-1.85, -1.55], [1.85, -1.55]].forEach(([wx, wz]) => {
                    const wheelGroup = new THREE.Group();
                    wheelGroup.position.set(wx, -0.35, wz);

                    const tireMesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.3, 1.3, 1.1, 18).rotateZ(Math.PI / 2),
                        matTire
                    );
                    tireMesh.castShadow = true;

                    const hubMesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.72, 0.72, 1.14, 12).rotateZ(Math.PI / 2),
                        matBlurrNeonGreen
                    );
                    const centerCap = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.35, 0.35, 1.2, 10).rotateZ(Math.PI / 2),
                        matBlurrCyanGlow
                    );
                    centerCap.userData.noOutline = true;

                    const shockSpring = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8),
                        matBlurrPurple
                    );
                    shockSpring.position.set(-Math.sign(wx) * 0.45, 0.8, 0);

                    wheelGroup.add(tireMesh, hubMesh, centerCap, shockSpring);
                    megaMonsterShell.add(wheelGroup);
                    parts.wheels.push(wheelGroup);
                });

                // 2. Bot Mode: High-Velocity Supersonic Turbine Back Pack
                const megaBackPack = new THREE.Group();
                megaBackPack.userData.isMegaPart = true;
                megaBackPack.visible = false;
                parts.megaBackPack = megaBackPack;
                parts.backAttachment.add(megaBackPack);

                const turbinePod = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 1.2), matBlurrPurple);
                turbinePod.position.set(0, 0.2, 0.2);
                turbinePod.castShadow = true;
                [-0.8, 0.8].forEach(tx => {
                    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.4, 12).rotateX(Math.PI / 2), matDarkSteel);
                    nozzle.position.set(tx, 0.2, 0.9);
                    const flame = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10).rotateX(Math.PI / 2), matBlurrCyanGlow);
                    flame.position.set(tx, 0.2, 1.6);
                    flame.userData.noOutline = true;
                    turbinePod.add(nozzle, flame);
                });
                megaBackPack.add(turbinePod);

                // 3. Dino Mode: Gallimimus Aerodynamic Fin Armor
                const megaDinoArmor = new THREE.Group();
                megaDinoArmor.userData.isMegaPart = true;
                megaDinoArmor.visible = false;
                parts.megaDinoArmor = megaDinoArmor;
                parts.dinoGroup.add(megaDinoArmor);

                const galliFin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 2.8), matBlurrNeonGreen);
                galliFin.position.set(0, 3.2, -0.4);
                megaDinoArmor.add(galliFin);

                // Initialize visibility matching current docked status
                const isCurrentMega = Boolean(typeof window !== 'undefined' && (window as any).progression && (window as any).progression.blurrDocked);
                if (typeof (window as any).setBotRigMega === 'function') {
                    (window as any).setBotRigMega(parts, isCurrentMega);
                }
}

export default buildBlurr;

// 3D Cel-Shaded Model & Morph Builder for QUICKSHADOW
import * as THREE from 'three';
import { createQuickshadowWheel } from './botHelpers.js';

export function buildQuickshadow(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Quickshadow: Sleek, stylish British covert operations specialist!
                // Elegant, athletic feminine silhouette: slender hourglass waist, flared hip armor,
                // long slender legs with signature turbine pods, delicate hands, and swept-back winglets!

                // 1. Torso: Sculpted Feminine Upper Chest (Bust), Narrow Cyber-Waist & Flared Hips
                // A. Upper Chest (Bust) - Sculpted aerodynamic sports coupe hood
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.45, 1.45), matQuickWhite);
                chest.position.set(0, 0.42, 0);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Sloped Hood Front Panel with Custom Painted Texture (Autobot Crest & Vents)
                const hoodPlate = new THREE.Mesh(new THREE.BoxGeometry(1.92, 1.35, 0.14), matQuickChest);
                hoodPlate.position.set(0, 0.42, 0.74);
                hoodPlate.userData.noOutline = true;
                parts.torso.add(hoodPlate);

                // Angled Windshield Cowl / Collar at Top of Bust
                const collar = new THREE.Mesh(
                    new THREE.BoxGeometry(1.65, 0.42, 0.32).rotateX(0.28),
                    matQuickDark
                );
                collar.position.set(0, 1.12, 0.35);
                parts.torso.add(collar);

                // Twin Aerodynamic Sky-Blue Side Fender Scoops framing the Bust
                [-1.08, 1.08].forEach(side => {
                    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 1.42), matQuickCyan);
                    cowl.position.set(side, 0.42, 0);
                    parts.torso.add(cowl);
                });

                // B. Slender Cyber-Midriff / Corset Waist (The quintessential fembot hourglass feature!)
                const midriff = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.95), matQuickDark);
                midriff.position.set(0, -0.65, 0);
                midriff.castShadow = true;
                parts.torso.add(midriff);

                // Cyber-Abdominal Plating
                const absPlate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.12), matQuickSilver);
                absPlate.position.set(0, -0.65, 0.48);
                parts.torso.add(absPlate);

                [-0.60, 0.60].forEach(sx => {
                    const waistPill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.85), matQuickCyan);
                    waistPill.position.set(sx, -0.65, 0);
                    parts.torso.add(waistPill);
                });

                // C. Pelvis with Flared Feminine Hip Armor (Tassets)
                const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.55, 1.05), matQuickDark);
                pelvis.position.set(0, -1.25, 0);
                parts.torso.add(pelvis);

                // Curved Sky-Blue Flared Hip Armor Plates (Wrap down over the upper thighs)
                [-0.82, 0.82].forEach(hx => {
                    const hipArmor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.82, 1.15), matQuickCyan);
                    hipArmor.position.set(hx, -1.30, 0.05);
                    hipArmor.rotation.z = (hx < 0 ? 0.18 : -0.18);
                    parts.torso.add(hipArmor);

                    // Circular Cyan Hip Pivot Jewel
                    const hipDisc = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.22, 0.22, 0.15, 16).rotateZ(Math.PI / 2),
                        matQuickVisor
                    );
                    hipDisc.position.set(hx * 1.15, -1.25, 0.12);
                    parts.torso.add(hipDisc);
                });

                // 2. High Swept-Back GT Winglets / Spoilers (Mounted on Back Attachment)
                [-0.78, 0.78].forEach(sx => {
                    const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.75, 0.26), matQuickDark);
                    stanchion.position.set(sx, 1.35, -0.65);
                    stanchion.rotation.x = -0.32;
                    stanchion.rotation.z = (sx < 0 ? 0.22 : -0.22);
                    parts.backAttachment.add(stanchion);

                    const stanchionTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 0.12), matQuickCyan);
                    stanchionTrim.position.set(sx, 1.38, -0.58);
                    stanchionTrim.rotation.x = -0.32;
                    stanchionTrim.rotation.z = (sx < 0 ? 0.22 : -0.22);
                    parts.backAttachment.add(stanchionTrim);
                });
                const gtWing = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.12, 0.55), matQuickDark);
                gtWing.position.set(0, 2.15, -0.92);
                gtWing.castShadow = true;
                parts.backAttachment.add(gtWing);

                // Sky-Blue Endplate Winglets on GT Wing
                [-1.38, 1.38].forEach(wx => {
                    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.75), matQuickCyan);
                    endplate.position.set(wx, 2.15, -0.92);
                    parts.backAttachment.add(endplate);
                });

                // Front Ground-Effects Splitter on `parts.frontAttachment`
                const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.10, 0.65), matQuickDark);
                frontSplitter.position.set(0, 0.05, 0.35);
                parts.frontAttachment.add(frontSplitter);

                // 3. Head & Feminine Cyber-Neck:
                // Slender Cyber-Neck
                const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.52, 12), matQuickSilver);
                neck.position.set(0, -0.45, 0);
                parts.head.add(neck);

                // Rounded Feminine Helmet
                const helm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.95, 0.98), matQuickDark);
                helm.castShadow = true;
                parts.head.add(helm);

                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.88, 1.02), matQuickFace);
                faceMesh.position.set(0, -0.04, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // Tapered Feminine Chin Guard / Jawline
                const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.35), matQuickSilver);
                chinGuard.position.set(0, -0.46, 0.44);
                parts.head.add(chinGuard);

                // Arched Sky-Blue Brow Tiara with Glowing Center Jewel
                const tiara = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.18, 0.24).rotateX(0.22), matQuickCyan);
                tiara.position.set(0, 0.42, 0.46);
                const tiaraJewel = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.14, 8).rotateX(Math.PI / 2), matQuickVisor);
                tiaraJewel.position.set(0, 0.42, 0.54);
                parts.head.add(tiara, tiaraJewel);

                // Swept-Back High Ear Winglet Fins (Feline/Cat-Ear Fembot Silhouette!)
                [-0.52, 0.52].forEach(ex => {
                    const earFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.52), matQuickDark);
                    earFin.position.set(ex, 0.48, -0.22);
                    earFin.rotation.x = -0.35;
                    earFin.rotation.z = (ex < 0 ? 0.26 : -0.26);
                    parts.head.add(earFin);

                    const finTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.12), matQuickCyan);
                    finTrim.position.set(ex, 0.50, -0.04);
                    finTrim.rotation.x = -0.35;
                    finTrim.rotation.z = (ex < 0 ? 0.26 : -0.26);
                    parts.head.add(finTrim);
                });

                // 4. Arms: Rounded White Pauldrons, Slender Silver Biceps, Tapered Gauntlets & Delicate Charcoal Hands
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    // Rounded Aerodynamic White Pauldron (More compact & feminine)
                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 1.08), matQuickWhite);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    const shoulderTrim = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 1.10), matQuickCyan);
                    shoulderTrim.position.set(0, 0.24, 0);
                    armG.add(shoulderTrim);

                    // Front Sports Wheel mounted flush on outer shoulder
                    const wheel = createQuickshadowWheel(0.60, 0.36);
                    wheel.position.set(side * 0.46, -0.10, 0.04);
                    armG.add(wheel);
                    parts.wheels.push(wheel);

                    // Slender Silver Bicep
                    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.68, 12), matQuickSilver);
                    bicep.position.set(0, -0.72, 0);
                    armG.add(bicep);

                    // Forearm & Delicate Hand
                    forearmG.position.set(0, -1.12, 0);
                    armG.add(forearmG);

                    // Tapered White Gauntlet
                    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.15, 0.72), matQuickWhite);
                    gauntlet.position.set(0, -0.38, 0.04);
                    gauntlet.castShadow = true;

                    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.20, 0.78), matQuickCyan);
                    cuff.position.set(0, -0.16, 0.04);

                    // Slender Charcoal Hand with Delicate Fingers
                    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.36), matQuickDark);
                    hand.position.set(0, -1.02, 0.04);

                    forearmG.add(gauntlet, cuff, hand);
                });

                // 5. Legs: Slender Silver Thighs, Prominent Circular Knee Discs, Dramatically Flared White Shins,
                // Signature Sky-Blue Turbine Pods & Sleek Wedge Racing Boots
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    // Slender, Elongated Silver Thigh
                    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 1.45, 12), matQuickSilver);
                    thigh.position.set(-side * 0.05, -0.55, 0);
                    thigh.castShadow = true;
                    legG.add(thigh);

                    // Prominent Sky-Blue Circular Knee Disc Joint (Iconic Quickshadow Bio Feature!)
                    const kneeDisc = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.28, 0.28, 0.22, 16).rotateZ(Math.PI / 2),
                        matQuickCyan
                    );
                    kneeDisc.position.set(side * 0.26, -1.22, 0.08);
                    const kneeJewel = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.18, 0.18, 0.24, 12).rotateZ(Math.PI / 2),
                        matQuickVisor
                    );
                    kneeJewel.position.set(side * 0.26, -1.22, 0.08);
                    legG.add(kneeDisc, kneeJewel);

                    // Beautifully Flared White Bell-Bottom Shin
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.35, 1.35), matQuickWhite);
                    shin.position.set(-side * 0.08, -1.82, 0.05);
                    shin.castShadow = true;

                    // Flared Lower Ankle Flare Over Boots
                    const ankleCuff = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.48, 1.45), matQuickWhite);
                    ankleCuff.position.set(-side * 0.08, -2.62, 0.08);
                    legG.add(shin, ankleCuff);

                    // Signature Large Sky-Blue Turbine / Air Intake Pod on Outer Calf
                    const intakePod = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.18, 18).rotateZ(Math.PI / 2), matQuickCyan);
                    intakePod.position.set(side * 0.58, -1.65, 0.05);
                    const intakeVents = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.20, 12).rotateZ(Math.PI / 2), matQuickDark);
                    intakeVents.position.set(side * 0.58, -1.65, 0.05);
                    legG.add(intakePod, intakeVents);

                    // Rear Sports Wheel Mount (Outer lower shin)
                    const wheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;
                    wheelMount.position.set(side * 0.55, 0, -0.1);
                    legG.add(wheelMount);

                    const rw = createQuickshadowWheel(0.66, 0.40);
                    rw.position.set(0, -1.95, 0);
                    wheelMount.add(rw);
                    parts.wheels.push(rw);

                    // Sleek Feminine Racing Boot: Charcoal Wedge Heel + Sloped Sky-Blue Toe Guard
                    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.38, 1.45), matQuickDark);
                    boot.position.set(-side * 0.08, -2.88, 0.12);
                    boot.castShadow = true;

                    // Wedge Heel Riser
                    const heelWedge = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.55), matQuickDark);
                    heelWedge.position.set(-side * 0.08, -2.82, -0.32);

                    const toeAccent = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.20, 0.52), matQuickCyan);
                    toeAccent.position.set(-side * 0.08, -2.84, 0.58);

                    legG.add(boot, heelWedge, toeAccent);
                });

                // 6. Dilophosaurus Dinobot Mode (Twin Aerodynamic Crests, Predatory Head, Raptor Arms & Whip Tail)
                const diloSkull = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.75, 1.65), matQuickWhite);
                diloSkull.position.set(0, 0.25, 0.45);
                parts.dinoHead.add(diloSkull);

                const diloJaw = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 1.55), matQuickDark);
                diloJaw.position.set(0, -0.22, 0.55);
                parts.dinoHead.add(diloJaw);

                [-0.32, 0.32].forEach(cx => {
                    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 1.45).rotateX(-0.18), matQuickCyan);
                    crest.position.set(cx, 0.65, 0.35);
                    const crestBorder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 1.48).rotateX(-0.18), matQuickWhite);
                    crestBorder.position.set(cx, 0.95, 0.35);
                    parts.dinoHead.add(crest, crestBorder);
                });

                const diloVisor = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.22, 0.45), matQuickCyan);
                diloVisor.position.set(0, 0.32, 0.75);
                diloVisor.userData.noOutline = true;
                parts.dinoHead.add(diloVisor);

                [-0.45, 0.45].forEach(fx => {
                    const frillVane = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.85).rotateY(fx * 0.35), matQuickCyan);
                    frillVane.position.set(fx, 0, -0.15);
                    parts.dinoHead.add(frillVane);
                });

                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.dinoLeftArm : parts.dinoRightArm;
                    armG.position.set(side * 0.72, 2.05, 0.65);

                    const armUpper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24).rotateX(0.42), matQuickWhite);
                    armUpper.position.set(0, -0.28, 0);

                    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 4).rotateX(Math.PI / 2), matQuickSilver);
                    claw.position.set(0, -0.58, 0.18);
                    armG.add(armUpper, claw);
                });

                let prevDiloTail = parts.dinoTail;
                for (let s = 0; s < 5; s++) {
                    const seg = new THREE.Group();
                    seg.position.set(0, 0, -0.85);
                    const sz = 0.92 - s * 0.15;
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.8, 0.95), matQuickWhite);
                    mesh.position.set(0, 0, -0.42);
                    [-1, 1].forEach(finSide => {
                        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.75), matQuickCyan);
                        fin.position.set(finSide * (sz * 0.55 + 0.08), 0, -0.42);
                        seg.add(fin);
                    });
                    seg.add(mesh);
                    prevDiloTail.add(seg);
                    prevDiloTail = seg;
                }
}

export default buildQuickshadow;

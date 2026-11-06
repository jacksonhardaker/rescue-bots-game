// 3D Cel-Shaded Model & Morph Builder for BUMBLEBEE
import * as THREE from 'three';
import { createWheelAssembly } from './botHelpers.js';

export function buildBumblebee(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Bumblebee: Screen-accurate Bright Yellow Sports Speedster & Velociraptor Dinobot Mode
                // 1. Torso: Central Sports Car Body (Hood, Aerodynamic Windshield, Roof, Midriff & Pelvis)
                // Lower Chassis Base connecting front and rear with zero gaps
                const chassisBase = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.48, 3.4), matBeeYellow);
                chassisBase.position.set(0, -0.22, 0.10);
                chassisBase.castShadow = true;
                parts.torso.add(chassisBase);

                // Main Chest / Sports Car Hood
                const chestMatArray = [matBeeYellow, matBeeYellow, matBeeYellow, matBeeYellow, matBeeChest, matBeeYellow];
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.85, 2.15), chestMatArray);
                chest.position.set(0, 0.45, 0.35);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Raised central cowl induction scoop with silver louvers on hood
                const cowlScoop = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.22, 1.55), matBeeYellow);
                cowlScoop.position.set(0, 1.38, 0.45);
                parts.torso.add(cowlScoop);

                // Twin matte black hood racing stripes flanking cowl scoop
                [-0.62, 0.62].forEach(sx => {
                    const hStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.23, 1.85), matBeeBlack);
                    hStripe.position.set(sx, 1.37, 0.40);
                    parts.torso.add(hStripe);
                });

                // Silver cooling louvers inside cowl scoop
                [-0.35, -0.05, 0.25, 0.55].forEach(lz => {
                    const louver = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.10), matChrome);
                    louver.position.set(0, 1.48, 0.45 + lz);
                    parts.torso.add(louver);
                });

                // Aerodynamic Sloped Cyan Windshield
                const windshield = new THREE.Mesh(
                    new THREE.BoxGeometry(2.32, 0.72, 0.16).rotateX(-0.52),
                    matBeeGlowCyan
                );
                windshield.position.set(0, 1.15, -0.32);
                windshield.userData.noOutline = true;
                parts.torso.add(windshield);

                // Yellow Sports Car Roof
                const roof = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.16, 1.45), matBeeYellow);
                roof.position.set(0, 1.42, -0.75);
                parts.torso.add(roof);

                // Twin black racing stripes continuing over the roof
                [-0.62, 0.62].forEach(sx => {
                    const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 1.46), matBeeBlack);
                    roofStripe.position.set(sx, 1.42, -0.75);
                    parts.torso.add(roofStripe);
                });

                // Fastback rear window glass
                const rearWindow = new THREE.Mesh(
                    new THREE.BoxGeometry(2.15, 0.55, 0.15).rotateX(0.55),
                    matBeeGlowCyan
                );
                rearWindow.position.set(0, 1.16, -1.35);
                rearWindow.userData.noOutline = true;
                parts.torso.add(rearWindow);

                // Sculpted light grey midriff & black ribbed abdominal tuck (for Bot Mode)
                const midriff = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.82, 1.45), matBeeGrey);
                midriff.position.set(0, -1.18, 0);
                parts.torso.add(midriff);

                const abVent = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.52, 1.52), matBeeBlack);
                abVent.position.set(0, -1.18, 0.04);
                parts.torso.add(abVent);

                const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 1.55), matBeeYellow);
                pelvis.position.set(0, -1.65, 0);
                parts.torso.add(pelvis);

                // 2. Soaring Yellow Door Wings (Stand tall behind shoulders in Bot Mode, fold flush into car flanks in Vehicle Mode!)
                [-1, 1].forEach(side => {
                    const wingG = side === -1 ? parts.leftDoorWing : parts.rightDoorWing;
                    wingG.position.set(side * 1.32, 1.25, -0.65);

                    // Door body panel (aligned along Z = 2.15 length, Y = 0.88 height, X = 0.18 thickness)
                    const doorMaterials = [matBeeYellow, matBeeYellow, matBeeYellow, matBeeYellow, matBeeWing, matBeeWing];
                    const doorBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.88, 2.15), doorMaterials);
                    doorBody.castShadow = true;
                    wingG.add(doorBody);

                    // Matte black side racing stripe
                    const doorStripe = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 2.15), matBeeBlack);
                    doorStripe.position.set(0, -0.05, 0);
                    wingG.add(doorStripe);

                    // Lower black rocker skirt panel
                    const rockerSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 2.15), matBeeBlack);
                    rockerSkirt.position.set(0, -0.42, 0);
                    wingG.add(rockerSkirt);

                    // Tinted cyan coupe window glass along top of door
                    const doorWin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 1.45), matBeeGlowCyan);
                    doorWin.position.set(0, 0.46, -0.15);
                    doorWin.userData.noOutline = true;
                    wingG.add(doorWin);

                    // Aerodynamic swept winglet end tip (serves as wingtip in bot mode, rear flare in car mode)
                    const wingTip = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.38, 0.55), matBeeYellow);
                    wingTip.position.set(0, 0.62, 0.85);
                    wingG.add(wingTip);

                    parts.torso.add(wingG);
                });

                // 3. Front Attachment: Aggressive Muscle Bumper, Silver Slat Grille, Dual Headlights, Twin Amber Fog Lamps, & Hood Bridge
                // Muscular Front Bumper
                const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.52, 0.85), matBeeYellow);
                bumper.position.set(0, 0, 0);
                bumper.castShadow = true;
                parts.frontAttachment.add(bumper);

                // Low-slung matte black chin splitter / air dam
                const airDam = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.14, 0.92), matBeeBlack);
                airDam.position.set(0, -0.26, 0.02);
                parts.frontAttachment.add(airDam);

                // Broad curved silver radiator grille bar across front fascia
                const grille = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.38, 0.22), matChrome);
                grille.position.set(0, 0.04, 0.43);
                grille.userData.noOutline = true;
                parts.frontAttachment.add(grille);

                // Grille vertical black divider slats
                [-0.60, -0.20, 0.20, 0.60].forEach(gx => {
                    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.24), matBeeBlack);
                    slat.position.set(gx, 0.04, 0.43);
                    parts.frontAttachment.add(slat);
                });

                // Dual inward-angled cyan headlights
                [-1.08, 1.08].forEach(hx => {
                    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.18), matBeeGlowCyan);
                    hl.position.set(hx, 0.16, 0.44);
                    hl.userData.noOutline = true;
                    parts.frontAttachment.add(hl);
                });

                // Twin circular amber fog lamps with chrome bezels in lower chin
                const fogMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
                [-0.68, 0.68].forEach(fx => {
                    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.14, 14).rotateX(Math.PI / 2), matChrome);
                    bezel.position.set(fx, -0.16, 0.44);
                    const fogLight = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 14).rotateX(Math.PI / 2), fogMat);
                    fogLight.position.set(fx, -0.16, 0.45);
                    fogLight.userData.noOutline = true;
                    parts.frontAttachment.add(bezel, fogLight);
                });

                // Seamless Hood Nose Bridge (spans backward into torso chest, eliminating any gap!)
                const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.42, 1.15), matBeeYellow);
                noseBridge.position.set(0, 0.18, -0.55);
                noseBridge.castShadow = true;
                parts.frontAttachment.add(noseBridge);

                [-0.62, 0.62].forEach(nx => {
                    const noseStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 1.16), matBeeBlack);
                    noseStripe.position.set(nx, 0.18, -0.55);
                    parts.frontAttachment.add(noseStripe);
                });

                // 4. Back Attachment: High Rear GT Spoiler Wing, Rear Deck Extension, Exhaust & Taillights
                // Seamless Rear Deck Bridge
                const rearDeckBridge = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.42, 1.15), matBeeYellow);
                rearDeckBridge.position.set(0, 0.05, 0.45);
                rearDeckBridge.castShadow = true;
                parts.backAttachment.add(rearDeckBridge);

                [-0.62, 0.62].forEach(rx => {
                    const deckStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 1.16), matBeeBlack);
                    deckStripe.position.set(rx, 0.05, 0.45);
                    parts.backAttachment.add(deckStripe);
                });

                // Rear Bumper & Diffuser Valance
                const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.52, 0.75), matBeeYellow);
                rearBumper.position.set(0, 0.10, 0.85);
                parts.backAttachment.add(rearBumper);

                const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.14, 0.78), matBeeBlack);
                diffuser.position.set(0, -0.22, 0.86);
                parts.backAttachment.add(diffuser);

                // Dual polished chrome round exhaust tips
                [-0.65, 0.65].forEach(px => {
                    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 12).rotateX(Math.PI / 2), matChrome);
                    pipe.position.set(px, -0.16, 1.15);
                    parts.backAttachment.add(pipe);
                });

                // Dual Glowing Red Taillights
                const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
                [-0.95, 0.95].forEach(tx => {
                    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.12), tailLightMat);
                    tl.position.set(tx, 0.22, 1.22);
                    tl.userData.noOutline = true;
                    parts.backAttachment.add(tl);
                });

                // GT Spoiler Wing Stanchions & Blade
                [-0.85, 0.85].forEach(sx => {
                    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.68, 0.22), matBeeBlack);
                    post.position.set(sx, 0.42, 0.55);
                    parts.backAttachment.add(post);
                });

                const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.14, 0.62), matBeeYellow);
                wingBlade.position.set(0, 0.76, 0.55);
                parts.backAttachment.add(wingBlade);

                const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.64), matBeeBlack);
                wingStripe.position.set(0, 0.76, 0.55);
                parts.backAttachment.add(wingStripe);

                [-1.34, 1.34].forEach(ex => {
                    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.72), matBeeYellow);
                    endplate.position.set(ex, 0.86, 0.55);
                    parts.backAttachment.add(endplate);
                });

                // 5. Head: Rounded Yellow Helmet, Twin Black Crown Stripes, Ear Pods with 3 Louvers, Faceplate & Chin Guard
                const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.45, 12), matBeeGrey);
                neck.position.set(0, -0.55, 0);
                parts.head.add(neck);

                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.25, 1.24), matBeeYellow);
                helm.castShadow = true;
                parts.head.add(helm);

                [-0.26, 0.26].forEach(sx => {
                    const hStripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 1.26), matBeeBlack);
                    hStripe.position.set(sx, 0.62, 0);
                    parts.head.add(hStripe);
                });

                [-0.66, 0.66].forEach(side => {
                    const earPod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.55), matBeeYellow);
                    earPod.position.set(side, 0.05, 0.05);
                    parts.head.add(earPod);

                    [-0.18, 0.05, 0.25].forEach(ly => {
                        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.42), matBeeBlack);
                        louver.position.set(side, 0.05 + ly, 0.05);
                        parts.head.add(louver);
                    });
                });

                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.95, 1.26), matBeeFace);
                faceMesh.position.set(0, -0.05, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.28), matBeeYellow);
                chinGuard.position.set(0, -0.48, 0.55);
                parts.head.add(chinGuard);

                // 6. Arms: Yellow Pauldrons with 5-Spoke Front Wheels, Silver Biceps & Wrist Armor Flare Fins
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.25, 1.28), matBeeYellow);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    const wheel = createWheelAssembly(0.68, 0.44);
                    wheel.position.set(side * 0.52, -0.15, 0.22);
                    armG.add(wheel);
                    parts.wheels.push(wheel);

                    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.85, 12), matBeeGrey);
                    bicep.position.set(0, -0.65, 0);
                    armG.add(bicep);

                    const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10), matBeeBlack);
                    elbow.position.set(0, -1.05, 0);
                    armG.add(elbow);

                    forearmG.position.set(0, -1.15, 0);
                    armG.add(forearmG);

                    const fore = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.35, 1.05), matBeeYellow);
                    fore.position.set(0, -0.45, 0.05);
                    fore.castShadow = true;
                    forearmG.add(fore);

                    // Pointed wrist armor flare fin extending backwards/outwards from gauntlet (signature TV detail!)
                    const wristFin = new THREE.Mesh(
                        new THREE.ConeGeometry(0.24, 0.85, 4).rotateZ(side * -0.65).rotateX(0.2),
                        matBeeYellow
                    );
                    wristFin.position.set(side * 0.58, -0.32, -0.18);
                    forearmG.add(wristFin);

                    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.58), matBeeBlack);
                    hand.position.set(0, -1.12, 0.05);
                    forearmG.add(hand);
                });

                // 7. Legs: Cylindrical Silver Thighs, Knee Hubs, 3-Louver Shin Vents & Boots + Outer Rear Wheels
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 1.25, 12), matBeeGrey);
                    thigh.position.set(-side * 0.05, -0.48, 0);
                    legG.add(thigh);

                    const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.35, 12).rotateZ(Math.PI / 2), matChrome);
                    knee.position.set(-side * 0.05, -0.92, 0.45);
                    legG.add(knee);

                    const shinMats = [matBeeYellow, matBeeYellow, matBeeYellow, matBeeYellow, matBeeShin, matBeeYellow];
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.35, 1.55), shinMats);
                    shin.position.set(-side * 0.08, -1.45, 0.05);
                    shin.castShadow = true;
                    legG.add(shin);

                    const boot = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.55, 1.95), matBeeYellow);
                    boot.position.set(-side * 0.08, -2.48, 0.22);
                    boot.castShadow = true;
                    legG.add(boot);

                    const sole = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.22, 0.65), matBeeBlack);
                    sole.position.set(-side * 0.08, -2.65, 0.85);
                    legG.add(sole);

                    const wheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;
                    wheelMount.position.set(side * 0.72, 0, -0.05);
                    legG.add(wheelMount);

                    const w = createWheelAssembly(0.72, 0.46);
                    w.position.set(0, -1.55, 0);
                    wheelMount.add(w);
                    parts.wheels.push(w);
                });

                // 8. Velociraptor Dinosaur Head & Segmented Tail
                const raptorSkull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.9), matBeeYellow);
                raptorSkull.position.set(0, 0.35, 0.6);
                parts.dinoHead.add(raptorSkull);

                const raptorSnout = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 1.1), matBeeYellow);
                raptorSnout.position.set(0, 0.25, 1.8);
                parts.dinoHead.add(raptorSnout);

                [-0.72, 0.72].forEach(side => {
                    const eyePupil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 10).rotateZ(Math.PI / 2), matBeeGlowCyan);
                    eyePupil.position.set(side * 1.02, 0.45, 0.6);
                    eyePupil.userData.noOutline = true;
                    parts.dinoHead.add(eyePupil);
                });

                const raptorJaw = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.45, 2.1), matChrome);
                raptorJaw.position.set(0, -0.22, 1.25);
                parts.dinoHead.add(raptorJaw);

                let prevTail = parts.dinoTail;
                for (let s = 0; s < 4; s++) {
                    const seg = new THREE.Group();
                    seg.position.set(0, 0, -0.85);
                    const sz = 1.1 - s * 0.22;
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.85, 0.95), matBeeYellow);
                    mesh.position.set(0, 0, -0.42);
                    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.8), matBeeBlack);
                    spine.position.set(0, sz * 0.5, -0.42);
                    seg.add(mesh, spine);
                    prevTail.add(seg);
                    prevTail = seg;
                }

                // =============================================================
                // MEGA BOT: BUMBLEBEE OFF-ROAD MONSTER TRUCK CONVERSION
                // =============================================================
                // 1. Vehicle Mode: Lifted Tubular Roll Cage & 4 Giant 2.6m Monster Tires
                const megaMonsterShell = new THREE.Group();
                megaMonsterShell.userData.isMegaPart = true;
                megaMonsterShell.visible = false;
                parts.megaMonsterShell = megaMonsterShell;
                parts.chassis.add(megaMonsterShell);

                // Heavy Lift Subframe Chassis
                const liftChassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 4.2), matBeeBlack);
                liftChassis.position.set(0, -0.2, 0);
                liftChassis.castShadow = true;
                megaMonsterShell.add(liftChassis);

                // Raised Tubular Roll Cage with Roof KC Fog Spotlights
                const rollCage = new THREE.Group();
                rollCage.position.set(0, 0.4, 0);
                megaMonsterShell.add(rollCage);

                [-1.25, 1.25].forEach(rx => {
                    const barA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8).rotateX(0.25), matBeeYellow);
                    barA.position.set(rx, 1.2, 0.6);
                    const barB = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8).rotateX(-0.25), matBeeYellow);
                    barB.position.set(rx, 1.2, -0.8);
                    rollCage.add(barA, barB);
                });

                // Roof Light Bar with 4 Large Round KC Spotlights
                [-0.9, -0.3, 0.3, 0.9].forEach(lx => {
                    const lightHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 10).rotateX(Math.PI / 2), matChrome);
                    lightHousing.position.set(lx, 2.4, 0.5);
                    const lightLens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10).rotateX(Math.PI / 2), matVisorGold);
                    lightLens.position.set(lx, 2.4, 0.62);
                    lightLens.userData.noOutline = true;
                    rollCage.add(lightHousing, lightLens);
                });

                // 4 Giant 2.6m Off-Road Monster Truck Tires with Yellow Beadlock Hubs
                [[-1.85, 1.45], [1.85, 1.45], [-1.85, -1.55], [1.85, -1.55]].forEach(([wx, wz]) => {
                    const wheelGroup = new THREE.Group();
                    wheelGroup.position.set(wx, -0.35, wz);

                    // Massive 2.6m tire (radius 1.3, width 1.1)
                    const tireMesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.3, 1.3, 1.1, 18).rotateZ(Math.PI / 2),
                        matTire
                    );
                    tireMesh.castShadow = true;

                    // Bold Yellow Beadlock Hub
                    const hubMesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.72, 0.72, 1.14, 12).rotateZ(Math.PI / 2),
                        matBeeYellow
                    );
                    const centerCap = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.35, 0.35, 1.2, 10).rotateZ(Math.PI / 2),
                        matChrome
                    );

                    // Heavy Duty Yellow Coilover Suspension Shock
                    const shockSpring = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8),
                        matBeeYellow
                    );
                    shockSpring.position.set(-Math.sign(wx) * 0.45, 0.8, 0);

                    wheelGroup.add(tireMesh, hubMesh, centerCap, shockSpring);
                    megaMonsterShell.add(wheelGroup);
                    parts.wheels.push(wheelGroup);
                });

                // 2. Bot Mode: High-Output Monster Power Pack on Back
                const megaBackPack = new THREE.Group();
                megaBackPack.userData.isMegaPart = true;
                megaBackPack.visible = false;
                parts.megaBackPack = megaBackPack;
                parts.backAttachment.add(megaBackPack);

                const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 1.2), matBeeBlack);
                engineBlock.position.set(0, 0.2, 0.2);
                engineBlock.castShadow = true;
                const chromeHeaders = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.8), matChrome);
                chromeHeaders.position.set(0, 0.8, 0.4);
                megaBackPack.add(engineBlock, chromeHeaders);

                // 3. Dino Mode: Raptor Titan Roll-Cage Armor
                const megaDinoArmor = new THREE.Group();
                megaDinoArmor.userData.isMegaPart = true;
                megaDinoArmor.visible = false;
                parts.megaDinoArmor = megaDinoArmor;
                parts.dinoGroup.add(megaDinoArmor);

                const raptorRollCage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 2.6), matBeeBlack);
                raptorRollCage.position.set(0, 2.8, 0.2);
                raptorRollCage.castShadow = true;
                megaDinoArmor.add(raptorRollCage);

                // Initialize visibility matching current docked status
                const isCurrentMega = Boolean(typeof window !== 'undefined' && (window as any).progression && (window as any).progression.bumblebeeDocked);
                if (typeof (window as any).setBotRigMega === 'function') {
                    (window as any).setBotRigMega(parts, isCurrentMega);
                }
}

export default buildBumblebee;

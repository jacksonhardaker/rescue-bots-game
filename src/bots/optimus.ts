// 3D Cel-Shaded Model & Morph Builder for OPTIMUS
import * as THREE from 'three';
import { createWheelAssembly } from './botHelpers.js';

export function buildOptimus(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline,
        matOptimusRed, matOptimusBlue, matOptimusGold, matOptimusFace,
        matMegaTrailerSilver, matMegaTrailerStripe,
        matEnergonAxeCyan, matEnergonAxeGlow
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Optimus Prime: Supreme Commander Heavy Cab-over Semi-Truck
                // Torso: Heavy Cab Chest
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.88, 2.45, 2.22), matOptimusRed);
                chest.castShadow = true;
                parts.torso.add(chest);

                const visorBrow = new THREE.Mesh(new THREE.BoxGeometry(2.78, 0.32, 0.72), matOptimusRed);
                visorBrow.position.set(0, 0.98, 0.82);
                parts.torso.add(visorBrow);

                [-0.72, 0.72].forEach(wx => {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.96, 0.16), matCabGlass);
                    win.position.set(wx, 0.42, 1.12);
                    win.userData.noOutline = true;
                    parts.torso.add(win);
                });

                [-0.62, 0, 0.62].forEach(lx => {
                    const light = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.22), matOptimusGold);
                    light.position.set(lx, 1.24, 0.72);
                    parts.torso.add(light);
                });

                const grille = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.08, 0.18), matGrille);
                grille.position.set(0, -0.58, 1.12);
                grille.userData.noOutline = true;
                parts.torso.add(grille);

                const crest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.14), matEmblem);
                crest.position.set(0, 0.14, 1.13);
                crest.userData.noOutline = true;
                parts.torso.add(crest);

                const pelvis = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.64, 1.72), matOptimusRed);
                pelvis.position.set(0, -1.22, 0);
                parts.torso.add(pelvis);

                [-1.18, 1.18].forEach(tx => {
                    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.15, 10).rotateZ(Math.PI / 2), matChrome);
                    tank.position.set(tx, -1.22, 0);
                    parts.torso.add(tank);
                });

                // Head: Blue Helmet with Center Crest & Side Antennae
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 1.25), matOptimusBlue);
                helm.castShadow = true;
                parts.head.add(helm);

                const headFin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.75, 0.8), matOptimusBlue);
                headFin.position.set(0, 0.95, 0.05);
                parts.head.add(headFin);

                [-0.75, 0.75].forEach(ax => {
                    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), matOptimusBlue);
                    ant.position.set(ax, 0.35, 0);
                    parts.head.add(ant);
                });

                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.98, 1.28), matOptimusFace);
                faceMesh.position.set(0, -0.05, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // Back: Dual Chrome Smokestacks & Fifth Wheel
                const fifthWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.35, 12), matChrome);
                fifthWheel.userData.isStandardOnlyPart = true;
                parts.backAttachment.add(fifthWheel);

                [-1.25, 1.25].forEach(sx => {
                    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.9, 10), matChrome);
                    stack.position.set(sx, 1.2, -0.2);
                    parts.backAttachment.add(stack);
                });

                // Arms: Red Shoulders, Blue Forearms + Front Wheels
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.25, 1.25), matOptimusRed);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    const wheel = createWheelAssembly(0.76, 0.52);
                    wheel.position.set(side * 0.52, -0.25, 0.28);
                    armG.add(wheel);
                    parts.wheels.push(wheel);

                    forearmG.position.set(0, -1.15, 0);
                    armG.add(forearmG);

                    const bicep = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 0.72), matChrome);
                    bicep.position.set(0, 0.25, 0);
                    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.25, 0.96), matOptimusBlue);
                    forearm.position.set(0, -0.48, 0.08);
                    forearm.castShadow = true;
                    forearmG.add(bicep, forearm);
                });

                // Legs: Chrome Thighs, Blue Shins + Dual Tandem Rear Wheels
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    const thigh = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.35, 1.25), matChrome);
                    thigh.position.set(-side * 0.05, -0.48, 0);
                    thigh.castShadow = true;
                    legG.add(thigh);

                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.35, 1.75), matOptimusBlue);
                    shin.position.set(-side * 0.08, -1.45, 0.08);
                    shin.castShadow = true;
                    legG.add(shin);

                    const kneeCap = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.44, 0.36), matChrome);
                    kneeCap.position.set(-side * 0.08, -0.85, 0.96);
                    legG.add(kneeCap);

                    const boot = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.56, 1.95), matOptimusBlue);
                    boot.position.set(-side * 0.08, -2.52, 0.18);
                    boot.castShadow = true;
                    legG.add(boot);

                    const wheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;
                    wheelMount.position.set(side * 0.58, 0, -0.05);
                    legG.add(wheelMount);

                    [-0.86, -2.14].forEach(wy => {
                        const w = createWheelAssembly(0.76, 0.52);
                        w.position.set(0, wy, 0);
                        wheelMount.add(w);
                        parts.wheels.push(w);
                    });
                });

                // =============================================================
                // DINOBOT MODE: OPTIMUS PRIME T-REX (Tyrannosaurus Rex)
                // Source Image: media_1793754738745_10dc5229.jpg
                // Chiseled Red T-Rex Skull, Blue Helmet Crown & Brow Ridges,
                // Glowing Amber-Yellow Predator Optics, Dual Silver Smokestacks on Jaw Hinges,
                // Hinged Serrated Lower Jaw, Ribbed Underbelly Plating,
                // Articulated Small Mechanical Forearms, Talon Boot Claws & Segmented Tail with Chevron Drill Tip
                // =============================================================

                // 1. Dinosaur Body / Armor Overlay in dinoGroup
                const tRexBackShell = new THREE.Mesh(new THREE.BoxGeometry(2.96, 1.35, 3.1), matOptimusRed);
                tRexBackShell.position.set(0, 2.75, -0.05);
                tRexBackShell.castShadow = true;
                parts.dinoGroup.add(tRexBackShell);

                // Blue & Silver Dorsal Ridge along Spine
                const tRexSpine = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.45, 2.95), matOptimusBlue);
                tRexSpine.position.set(0, 3.48, -0.05);
                parts.dinoGroup.add(tRexSpine);

                // Cyan Windshield / Canopy on T-Rex Back (echoing truck cab)
                const tRexGlass = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.55, 1.45), matCabGlass);
                tRexGlass.position.set(0, 3.25, 0.45);
                tRexGlass.userData.noOutline = true;
                parts.dinoGroup.add(tRexGlass);

                // Ribbed Silver/Chrome Underbelly Armor Leading from Collar to Pelvis
                const underbellyGroup = new THREE.Group();
                underbellyGroup.position.set(0, 2.15, 0.35);
                const bellyBase = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.65, 2.65), matChrome);
                underbellyGroup.add(bellyBase);
                for (let b = 0; b < 5; b++) {
                    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.18, 0.36), matOptimusRed);
                    rib.position.set(0, -0.28, -0.85 + b * 0.44);
                    underbellyGroup.add(rib);
                }
                parts.dinoGroup.add(underbellyGroup);

                // 2. Small T-Rex Forearms on Upper Chest Sides
                [-1, 1].forEach(side => {
                    const arm = side === -1 ? parts.dinoLeftArm : parts.dinoRightArm;
                    arm.position.set(side * 1.32, 2.35, 1.35);

                    // Red Ball Shoulder Joint
                    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), matOptimusRed);
                    arm.add(shoulderBall);

                    // Red Upper Arm Strut
                    const bicep = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.28), matOptimusRed);
                    bicep.position.set(0, -0.26, 0.12);
                    bicep.rotation.x = 0.35;
                    arm.add(bicep);

                    // Silver Elbow Joint
                    const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 8).rotateZ(Math.PI / 2), matChrome);
                    elbow.position.set(0, -0.48, 0.28);
                    arm.add(elbow);

                    // Silver Forearm Strut
                    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.24), matChrome);
                    forearm.position.set(0, -0.68, 0.42);
                    forearm.rotation.x = -0.55;
                    arm.add(forearm);

                    // Blue Two-Clawed Mechanical T-Rex Hand
                    const handBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), matOptimusBlue);
                    handBase.position.set(0, -0.88, 0.58);
                    arm.add(handBase);

                    [-0.1, 0.1].forEach(cx => {
                        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.16), matOptimusBlue);
                        claw.position.set(cx, -1.02, 0.68);
                        claw.rotation.x = 0.45;
                        arm.add(claw);
                    });
                });

                // 3. T-Rex Head Assembly (Mounted on parts.dinoHead)
                // Red Cranium / Main Skull
                const skull = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.45, 2.05), matOptimusRed);
                skull.position.set(0, 0.45, 0.72);
                skull.castShadow = true;
                parts.dinoHead.add(skull);

                // Sloped Red Snout
                const snout = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.15, 1.75), matOptimusRed);
                snout.position.set(0, 0.32, 2.25);
                snout.castShadow = true;
                parts.dinoHead.add(snout);

                // Snout Tip & Nostrils
                const noseCap = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 0.65), matOptimusRed);
                noseCap.position.set(0, 0.24, 3.15);
                parts.dinoHead.add(noseCap);

                [-0.28, 0.28].forEach(nx => {
                    const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), matChrome);
                    nostril.position.set(nx, 0.48, 3.45);
                    parts.dinoHead.add(nostril);
                });

                // Iconic Blue Central Helmet Crest along top of T-Rex Skull
                const tRexCrown = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.45, 3.4), matOptimusBlue);
                tRexCrown.position.set(0, 1.18, 1.75);
                tRexCrown.castShadow = true;
                parts.dinoHead.add(tRexCrown);

                const crownFin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 1.1), matOptimusBlue);
                crownFin.position.set(0, 1.52, 0.75);
                parts.dinoHead.add(crownFin);

                // Angled Blue Brow Ridges & Glowing Yellow Optics
                const matDinoEyeYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
                [-1, 1].forEach(side => {
                    // Blue Eyebrow Armor
                    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.45), matOptimusBlue);
                    brow.position.set(side * 0.88, 0.92, 1.45);
                    brow.rotation.z = side * -0.15;
                    brow.rotation.y = side * 0.12;
                    parts.dinoHead.add(brow);

                    // Angled Predator Eye Inset
                    const eyeHousing = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.68), matChrome);
                    eyeHousing.position.set(side * 0.92, 0.62, 1.42);
                    parts.dinoHead.add(eyeHousing);

                    const eyeLens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.52), matDinoEyeYellow);
                    eyeLens.position.set(side * 0.98, 0.62, 1.42);
                    eyeLens.userData.noOutline = true;
                    parts.dinoHead.add(eyeLens);

                    // Side-Mounted Truck Smokestacks on Jaw/Temple Hinges!
                    const stackBracket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matChrome);
                    stackBracket.position.set(side * 1.05, 0.55, 0.35);
                    parts.dinoHead.add(stackBracket);

                    const stackPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.35, 10), matChrome);
                    stackPipe.position.set(side * 1.18, 1.45, 0.35);
                    parts.dinoHead.add(stackPipe);

                    // Perforated Exhaust Heat Shield / Cap
                    const stackCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 10), matOptimusRed);
                    stackCap.position.set(side * 1.18, 2.25, 0.35);
                    parts.dinoHead.add(stackCap);
                });

                // Upper Teeth (Sharp Triangular Chrome / White Fangs along Upper Jaw Rim)
                const upperTeethRow = new THREE.Group();
                upperTeethRow.position.set(0, -0.22, 2.15);
                for (let t = 0; t < 6; t++) {
                    const zPos = -0.75 + t * 0.32;
                    [-0.62, 0.62].forEach(tx => {
                        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 4).rotateX(Math.PI), matChrome);
                        fang.position.set(tx, 0, zPos);
                        upperTeethRow.add(fang);
                    });
                }
                parts.dinoHead.add(upperTeethRow);

                // Articulated Lower Jaw
                const lowerJaw = new THREE.Group();
                lowerJaw.position.set(0, -0.32, 0.95);
                parts.dinoHead.add(lowerJaw);
                parts.dinoLowerJaw = lowerJaw;

                const jawChin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.48, 2.35), matOptimusRed);
                jawChin.position.set(0, -0.15, 0.95);
                jawChin.castShadow = true;
                lowerJaw.add(jawChin);

                const innerMaw = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 2.15), matOptimusBlue);
                innerMaw.position.set(0, 0.08, 0.95);
                lowerJaw.add(innerMaw);

                // Lower Teeth
                for (let t = 0; t < 6; t++) {
                    const zPos = 0.22 + t * 0.32;
                    [-0.56, 0.56].forEach(tx => {
                        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 4), matChrome);
                        fang.position.set(tx, 0.28, zPos);
                        lowerJaw.add(fang);
                    });
                }

                // 4. Segmented Heavy T-Rex Counterbalance Tail with Chevron Drill Tip
                let prevOptTail = parts.dinoTail;
                const tailSegs = [
                    { w: 1.85, h: 1.55, l: 1.15, color: matOptimusRed },
                    { w: 1.55, h: 1.35, l: 1.15, color: matChrome },
                    { w: 1.25, h: 1.15, l: 1.15, color: matOptimusRed },
                    { w: 0.95, h: 0.92, l: 1.15, color: matOptimusRed },
                    { w: 0.72, h: 0.72, l: 1.05, color: matChrome }
                ];
                tailSegs.forEach(segData => {
                    const seg = new THREE.Group();
                    seg.position.set(0, 0, -1.02);
                    const segMesh = new THREE.Mesh(new THREE.BoxGeometry(segData.w, segData.h, segData.l), segData.color);
                    segMesh.position.set(0, 0, -0.48);
                    segMesh.castShadow = true;
                    seg.add(segMesh);

                    // Spine ridge
                    const spineRidge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, segData.l), matOptimusBlue);
                    spineRidge.position.set(0, segData.h * 0.5 + 0.1, -0.48);
                    seg.add(spineRidge);

                    prevOptTail.add(seg);
                    prevOptTail = seg;
                });

                // Tail Tip: Iconic Chevron Drill Tail Tip
                const tailTip = new THREE.Group();
                tailTip.position.set(0, 0, -1.05);
                const tipBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.45), matChrome);
                tipBase.position.set(0, 0, -0.22);
                tailTip.add(tipBase);

                // Blue Chevron Flukes
                const tipDrill = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.25, 4).rotateX(-Math.PI / 2), matOptimusBlue);
                tipDrill.position.set(0, 0, -0.85);
                tailTip.add(tipDrill);

                [-1, 1].forEach(side => {
                    const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.85), matOptimusBlue);
                    fluke.position.set(side * 0.45, 0, -0.65);
                    fluke.rotation.y = side * 0.35;
                    tailTip.add(fluke);
                });
                prevOptTail.add(tailTip);

                // 5. Dinosaur Talon Claws on Boots (Front 3 Claws + Rear Spur)
                [parts.leftLeg, parts.rightLeg].forEach((legG, legIdx) => {
                    const side = legIdx === 0 ? -1 : 1;
                    const talonsGroup = new THREE.Group();
                    talonsGroup.position.set(-side * 0.08, -2.52, 0.95);
                    legG.add(talonsGroup);

                    // 3 Forward Dinosaur Talon Claws
                    [-0.42, 0, 0.42].forEach(tx => {
                        const talon = new THREE.Mesh(
                            new THREE.ConeGeometry(0.18, 0.75, 5).rotateX(Math.PI / 2 + 0.25),
                            matChrome
                        );
                        talon.position.set(tx, -0.15, 0.35);
                        talon.castShadow = true;
                        talonsGroup.add(talon);
                    });

                    // Rear Heel Claw
                    const rearClaw = new THREE.Mesh(
                        new THREE.ConeGeometry(0.16, 0.55, 5).rotateX(-Math.PI / 2 - 0.25),
                        matChrome
                    );
                    rearClaw.position.set(0, -0.15, -1.65);
                    talonsGroup.add(rearClaw);
                });

                // =============================================================
                // MEGA BOT: OPTIMUS PRIME APEX SUPER RIG & COMMAND TRAILER
                // =============================================================

                // 1. Bot Mode: Heavy Back Battle Platform with Over-Shoulder Water Cannons
                const megaBackPack = new THREE.Group();
                megaBackPack.userData.isMegaPart = true;
                megaBackPack.visible = false;
                parts.megaBackPack = megaBackPack;
                parts.backAttachment.add(megaBackPack);

                const bpBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 1.8), matMegaTrailerSilver);
                bpBase.position.set(0, 0.2, 0.2);
                bpBase.castShadow = true;
                megaBackPack.add(bpBase);

                const bpPlate = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 0.4), matOptimusRed);
                bpPlate.position.set(0, 0.2, 1.05);
                const bpStar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.2), matOptimusGold);
                bpStar.position.set(0, 0.2, 1.26);
                bpStar.userData.noOutline = true;
                megaBackPack.add(bpPlate, bpStar);

                // Twin Over-Shoulder Heavy Deluge Cannons
                [-1.55, 1.55].forEach(cx => {
                    const cMount = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 1.2), matDarkSteel);
                    cMount.position.set(cx, 1.6, -0.1);
                    const cBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 3.6, 12).rotateX(Math.PI / 2), matChrome);
                    cBarrel.position.set(cx, 2.1, 1.2);
                    cBarrel.castShadow = true;
                    const cMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.6, 12).rotateX(Math.PI / 2), matDarkSteel);
                    cMuzzle.position.set(cx, 2.1, 3.1);
                    const cEmitter = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 12).rotateX(Math.PI / 2), matEnergonAxeCyan);
                    cEmitter.position.set(cx, 2.1, 3.38);
                    cEmitter.userData.noOutline = true;
                    megaBackPack.add(cMount, cBarrel, cMuzzle, cEmitter);

                    // Side Stabilizer Wings
                    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 1.4), matMegaTrailerStripe);
                    wing.position.set(cx * 1.25, 0.15, -0.2);
                    megaBackPack.add(wing);
                });

                // 2. Bot Mode Weapon: Glowing Cyan Energon Battle Axe (Mounted on Right Forearm)
                const megaAxe = new THREE.Group();
                megaAxe.userData.isMegaPart = true;
                megaAxe.visible = false;
                parts.megaAxe = megaAxe;
                parts.rightForearm.add(megaAxe);

                const axeSocket = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), matDarkSteel);
                axeSocket.position.set(0, -0.65, 0.6);
                const axeCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 10), matChrome);
                axeCollar.position.set(0, -0.65, 1.1);
                axeCollar.rotation.x = Math.PI / 2;

                const axeCore = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 2.2), matEnergonAxeCyan);
                axeCore.position.set(0, -0.65, 2.1);
                axeCore.userData.noOutline = true;

                const axeEdge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.3, 2.6), matEnergonAxeGlow);
                axeEdge.position.set(0, -0.65, 2.2);
                axeEdge.userData.noOutline = true;

                const axeTopSpike = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.9, 4).rotateX(Math.PI / 2), matChrome);
                axeTopSpike.position.set(0, -0.65, 3.7);

                megaAxe.add(axeSocket, axeCollar, axeCore, axeEdge, axeTopSpike);

                // 3. Bot Mode Weapon: Command Riot Shield (Mounted on Left Forearm)
                const megaShield = new THREE.Group();
                megaShield.userData.isMegaPart = true;
                megaShield.visible = false;
                parts.megaShield = megaShield;
                parts.leftForearm.add(megaShield);

                const shieldMount = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.1), matDarkSteel);
                shieldMount.position.set(0, -0.5, 0.5);
                const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.8, 2.4), matMegaTrailerSilver);
                shieldPlate.position.set(-0.65, -0.5, 0.6);
                shieldPlate.castShadow = true;

                const shieldChevron = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.2, 0.8), matOptimusRed);
                shieldChevron.position.set(-0.67, -0.5, 0.6);

                const shieldViewport = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.4), matEnergonAxeCyan);
                shieldViewport.position.set(-0.68, 0.65, 0.6);
                shieldViewport.userData.noOutline = true;

                const shieldInsignia = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.8, 0.8), matOptimusGold);
                shieldInsignia.position.set(-0.69, -0.65, 0.6);
                shieldInsignia.userData.noOutline = true;

                megaShield.add(shieldMount, shieldPlate, shieldChevron, shieldViewport, shieldInsignia);

                // 4. Vehicle Mode: Elongated 12.5m Command Trailer with Articulated Fifth-Wheel Hitch
                const trailerHitch = new THREE.Group();
                trailerHitch.userData.isMegaPart = true;
                parts.trailerHitch = trailerHitch;
                parts.backAttachment.add(trailerHitch);

                const megaTrailer = new THREE.Group();
                megaTrailer.userData.isMegaPart = true;
                megaTrailer.visible = false;
                parts.megaTrailer = megaTrailer;
                trailerHitch.add(megaTrailer);

                // Main Trailer Hull Box: 12.5m length, 2.92m width, 3.25m height
                const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.92, 3.25, 12.5), matMegaTrailerSilver);
                trHull.position.set(0, 0.975, -7.05);
                trHull.castShadow = true;
                megaTrailer.add(trHull);

                // Flank Blue Racing Stripes & Underbody Hazard Skirts
                [-1.48, 1.48].forEach(sx => {
                    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 12.2), matMegaTrailerStripe);
                    stripe.position.set(sx, 0.975, -7.05);
                    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 12.0), matDarkSteel);
                    skirt.position.set(sx, -0.45, -7.05);
                    const starDecal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 1.0), matOptimusGold);
                    starDecal.position.set(sx * 1.01, 0.975, -4.5);
                    starDecal.userData.noOutline = true;
                    megaTrailer.add(stripe, skirt, starDecal);
                });

                // Dual Heavy Roof Deluge Water Cannon Turrets
                [-3.5, -9.0].forEach(tz => {
                    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.70, 0.30, 14), matDarkSteel);
                    tBase.position.set(0, 2.75, tz);
                    const tBoom = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.40, 1.5), matMegaTrailerSilver);
                    tBoom.position.set(0, 3.0, tz + 0.3);
                    [-0.20, 0.20].forEach(nx => {
                        const tNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 1.6, 10).rotateX(Math.PI / 2), matChrome);
                        tNozzle.position.set(nx, 3.0, tz + 1.1);
                        megaTrailer.add(tNozzle);
                    });
                    megaTrailer.add(tBase, tBoom);
                });

                // Rear Bumper & Dual Taillights
                const trBumper = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.45, 0.35), matDarkSteel);
                trBumper.position.set(0, -0.45, -13.35);
                megaTrailer.add(trBumper);
                [-1.05, 1.05].forEach(tx => {
                    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.20, 0.12), matSirenRed);
                    tailL.position.set(tx, -0.45, -13.52);
                    tailL.userData.noOutline = true;
                    megaTrailer.add(tailL);
                });

                // 4 Heavy Tandem Rear Wheels (Functional Wheel Assemblies in parts.wheels!)
                [-9.2, -11.2].forEach(wz => {
                    [-1.52, 1.52].forEach(wx => {
                        const trWheel = createWheelAssembly(0.76, 0.52);
                        trWheel.position.set(wx, -1.434, wz);
                        megaTrailer.add(trWheel);
                        parts.wheels.push(trWheel);
                    });
                });

                // 5. Dino Mode: Heavy Dorsal Scute Armor & Neck Assault Cannons
                const megaDinoArmor = new THREE.Group();
                megaDinoArmor.userData.isMegaPart = true;
                megaDinoArmor.visible = false;
                parts.megaDinoArmor = megaDinoArmor;
                parts.dinoGroup.add(megaDinoArmor);

                // 4 Folded Trailer Scute Plates along Spine
                for (let s = 0; s < 4; s++) {
                    const scute = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.15 - s * 0.12, 1.25).rotateX(0.35), matMegaTrailerSilver);
                    scute.position.set(0, 3.65 - s * 0.1, 0.8 - s * 1.05);
                    scute.castShadow = true;
                    const scuteCrest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 1.05).rotateX(0.35), matOptimusRed);
                    scuteCrest.position.set(0, 3.9 - s * 0.1, 0.8 - s * 1.05);
                    megaDinoArmor.add(scute, scuteCrest);
                }

                // Twin Flanking Neck Assault Cannons
                [-1.65, 1.65].forEach(cx => {
                    const cannonMount = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 1.2), matDarkSteel);
                    cannonMount.position.set(cx, 3.35, 0.85);
                    const cannonPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 2.6, 12).rotateX(Math.PI / 2), matChrome);
                    cannonPipe.position.set(cx, 3.35, 2.15);
                    cannonPipe.castShadow = true;
                    const cannonTip = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.5, 12).rotateX(Math.PI / 2), matOptimusRed);
                    cannonTip.position.set(cx, 3.35, 3.45);
                    megaDinoArmor.add(cannonMount, cannonPipe, cannonTip);
                });

                // 6. Dino Mode: Spiked Titanium Seismic Mace Tail Tip
                const megaDinoTail = new THREE.Group();
                megaDinoTail.userData.isMegaPart = true;
                megaDinoTail.visible = false;
                parts.megaDinoTail = megaDinoTail;
                prevOptTail.add(megaDinoTail);

                const maceCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.8, 10).rotateX(Math.PI / 2), matMegaTrailerSilver);
                maceCollar.position.set(0, 0, -1.05);
                const maceBall = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), matDarkSteel);
                maceBall.position.set(0, 0, -1.85);
                maceBall.castShadow = true;

                const maceCore = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), matEnergonAxeCyan);
                maceCore.position.set(0, 0, -1.85);
                maceCore.userData.noOutline = true;

                megaDinoTail.add(maceCollar, maceBall, maceCore);

                // 6 Spikes radiating out around the mace
                for (let i = 0; i < 6; i++) {
                    const ang = (i / 6) * Math.PI * 2;
                    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 5).rotateZ(ang + Math.PI / 2), matChrome);
                    spike.position.set(Math.cos(ang) * 0.95, Math.sin(ang) * 0.95, -1.85);
                    spike.castShadow = true;
                    megaDinoTail.add(spike);
                }

                // Initialize rig part visibility to match current docked status
                const isCurrentMega = Boolean(typeof window !== 'undefined' && (window as any).progression && (window as any).progression.optimusDocked);
                if (typeof (window as any).setOptimusRigMega === 'function') {
                    (window as any).setOptimusRigMega(parts, isCurrentMega);
                }
}

export default buildOptimus;

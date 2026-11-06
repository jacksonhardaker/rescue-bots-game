// 3D Cel-Shaded Model & Morph Builder for HIGHTIDE
import * as THREE from 'three';

import { setHighTideRigMega } from './botRigs.js';
export function buildHighTide(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show High Tide: Maritime Search & Rescue Submersible Autobot!
                // Primary Royal Blue (#1d4ed8), Warm Yellow/Gold (#f59e0b), Scuba Black (#0f172a), Marine White & Cyan Dome Canopy!

                // 1. Torso: Heavy Royal Blue Submarine Hull with Domed Aqua Cockpit Canopy & Scuba Rebreather Tubes
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.85, 2.35, 2.15), matHighTideBlue);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Central Cockpit Bubble Canopy Panel with Autobot crest & golden bulkhead frame
                const canopyPlate = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.85, 0.16), matHighTideChest);
                canopyPlate.position.set(0, 0.12, 1.10);
                canopyPlate.userData.noOutline = true;
                parts.torso.add(canopyPlate);

                // Curved Submersible Cockpit Dome Glass (physical 3D glass bubble)
                const canopyDome = new THREE.Mesh(
                    new THREE.SphereGeometry(0.82, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
                    matHighTideCanopy
                );
                canopyDome.rotation.x = Math.PI / 2;
                canopyDome.position.set(0, 0.15, 1.12);
                canopyDome.scale.set(1.15, 0.42, 1.35);
                canopyDome.userData.noOutline = true;
                parts.torso.add(canopyDome);

                // Golden Bulkhead Arch Frame Collar
                const collarArch = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 0.32), matHighTideGold);
                collarArch.position.set(0, 1.12, 0.95);
                parts.torso.add(collarArch);

                // Dual Heavy Black Scuba / Rebreather Tubes looping from collar over the shoulders
                [-1.15, 1.15].forEach(tx => {
                    const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.55, 10), matHighTideDark);
                    tube1.position.set(tx, 0.85, 0.35);
                    tube1.rotation.x = 0.55;
                    parts.torso.add(tube1);

                    const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.45, 10), matHighTideDark);
                    tube2.position.set(tx, 0.55, -0.65);
                    tube2.rotation.x = -0.42;
                    parts.torso.add(tube2);
                });

                // Abdomen: Silver/White Lower Torso Deck
                const lowerAbs = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 1.55), matHighTideWhite);
                lowerAbs.position.set(0, -0.95, 0.12);
                parts.torso.add(lowerAbs);

                // Naval Belt with Royal Blue Center Buckle
                const belt = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.32, 1.62), matHighTideWhite);
                belt.position.set(0, -1.25, 0);
                const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.22), matHighTideBlue);
                buckle.position.set(0, -1.25, 0.82);
                const groin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.65, 1.25), matHighTideDark);
                groin.position.set(0, -1.55, 0);
                parts.torso.add(belt, buckle, groin);

                // 2. Head: Royal Blue Helmet, Golden Diving Headlamp, Ear Horns, Cyan Eyes & Vocoder Beard
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.25, 1.22), matHighTideBlue);
                helm.castShadow = true;
                parts.head.add(helm);

                // Center Forehead Golden Diving Searchlight (High Tide's signature headlamp!)
                const lampHousing = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.32, 0.32, 0.24, 16).rotateX(Math.PI / 2),
                    matHighTideGold
                );
                lampHousing.position.set(0, 0.72, 0.62);
                const lampLens = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.24, 0.24, 0.26, 16).rotateX(Math.PI / 2),
                    matHighTideLamp
                );
                lampLens.position.set(0, 0.72, 0.63);
                lampLens.userData.noOutline = true;
                parts.head.add(lampHousing, lampLens);

                // Twin Blue Angled Ear Horn Fins
                [-0.68, 0.68].forEach(hx => {
                    const earHorn = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.42), matHighTideBlue);
                    earHorn.position.set(hx, 0.62, 0.05);
                    earHorn.rotation.z = hx < 0 ? 0.25 : -0.25;
                    parts.head.add(earHorn);
                });

                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.96, 1.24), matHighTideFace);
                faceMesh.position.set(0, -0.04, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // 3. Back Attachment: Twin Ducted Hydro-Jet Propulsion Pods & Central Dorsal Stabilizer Fin
                const propGroup = new THREE.Group();
                parts.rotors = propGroup;
                parts.backAttachment.add(propGroup);

                // Central Royal Blue Dorsal Rudder / Sail Fin
                const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.65, 1.85), matHighTideBlue);
                dorsalFin.position.set(0, 0.65, -0.65);
                dorsalFin.castShadow = true;
                parts.backAttachment.add(dorsalFin);

                [-1.55, 1.55].forEach(side => {
                    // Ducted Hydro-Jet Thruster Pod Casing
                    const pod = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.55, 0.55, 2.35, 16).rotateX(Math.PI / 2),
                        matHighTideBlue
                    );
                    pod.position.set(side, 0.25, -0.75);
                    pod.castShadow = true;

                    // Golden Forward Intake Cowl Ring
                    const intakeRing = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.62, 0.58, 0.25, 16).rotateX(Math.PI / 2),
                        matHighTideGold
                    );
                    intakeRing.position.set(side, 0.25, 0.38);

                    // Golden Aft Exhaust Nozzle Ring
                    const exhaustRing = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.48, 0.58, 0.28, 16).rotateX(Math.PI / 2),
                        matHighTideGold
                    );
                    exhaustRing.position.set(side, 0.25, -1.88);

                    parts.backAttachment.add(pod, intakeRing, exhaustRing);

                    // Spinning 3-Blade Propeller Turbine inside Ducted Shroud
                    const spinner = new THREE.Group();
                    spinner.position.set(side, 0.25, -1.95);
                    for (let b = 0; b < 3; b++) {
                        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.08), matHighTideGold);
                        blade.rotation.z = (b * Math.PI * 2) / 3;
                        blade.position.y = 0.32;
                        spinner.add(blade);
                    }
                    const hub = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 10).rotateX(-Math.PI / 2), matHighTideDark);
                    spinner.add(hub);
                    propGroup.add(spinner);
                });

                // 4. Arms: Royal Blue Pauldrons with Golden Anchors, Dark Biceps, Forearm Fin Blades & Golden Cuffs
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    // Rounded Royal Blue Shoulder Pauldron
                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.32, 1.35), matHighTideBlue);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    // Golden Anchor Emblem on outer shoulder
                    const anchorBadge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 1.05), matHighTideShoulder);
                    anchorBadge.position.set(side * 0.65, 0, 0);
                    anchorBadge.userData.noOutline = true;
                    armG.add(anchorBadge);

                    // Black Bicep Joint Cylinder
                    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.65, 10), matHighTideDark);
                    bicep.position.set(0, -0.78, 0);
                    armG.add(bicep);

                    forearmG.position.set(0, -1.18, 0);
                    armG.add(forearmG);

                    // Royal Blue Forearm Gauntlet
                    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.32, 1.08), matHighTideBlue);
                    gauntlet.position.set(0, -0.42, 0.04);
                    gauntlet.castShadow = true;

                    // Flared Outer Hydrofoil Fin Blade extending from forearm/elbow
                    const armFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.15, 0.65), matHighTideBlue);
                    armFin.position.set(side * 0.65, -0.35, -0.25);
                    armFin.rotation.y = side * 0.25;

                    // Chunky Golden Wrist Cuff
                    const cuff = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), matHighTideGold);
                    cuff.position.set(0, -0.88, 0.04);

                    // Dark Charcoal Hand
                    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.58), matHighTideDark);
                    hand.position.set(0, -1.22, 0.04);

                    forearmG.add(gauntlet, armFin, cuff, hand);
                });

                // 5. Legs: Charcoal Thighs, White Knees & Upper Shins, Flared Blue Calves with Hydro Ports, & Massive Flipper Feet!
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    // Charcoal Upper Thigh Cylinder
                    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.15, 12), matHighTideDark);
                    thigh.position.set(-side * 0.05, -0.48, 0);
                    thigh.castShadow = true;
                    legG.add(thigh);

                    // White Knee Armor Cap & Upper Shin
                    const knee = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.95, 1.25), matHighTideWhite);
                    knee.position.set(-side * 0.06, -1.02, 0.06);
                    knee.castShadow = true;
                    legG.add(knee);

                    // Flared Royal Blue Lower Shin / Calf Armor
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.85, 1.55), matHighTideBlue);
                    shin.position.set(-side * 0.08, -1.82, 0.05);
                    shin.castShadow = true;
                    legG.add(shin);

                    // Outer Cylindrical Hydro-Thruster Port / Intake Nacelle
                    const portRing = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.38, 0.38, 0.18, 16).rotateZ(Math.PI / 2),
                        matHighTideGold
                    );
                    portRing.position.set(side * 0.68, -1.82, 0.05);
                    const portCore = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.28, 0.28, 0.22, 16).rotateZ(Math.PI / 2),
                        matHighTideDark
                    );
                    portCore.position.set(side * 0.68, -1.82, 0.05);
                    portCore.userData.noOutline = true;
                    legG.add(portRing, portCore);

                    // Iconic Massive White Nautical Flipper / Webbed Diving Foot with 3 Toe Claws
                    const flipperBoot = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.45, 2.15), matHighTideWhite);
                    flipperBoot.position.set(-side * 0.08, -2.82, 0.28);
                    flipperBoot.castShadow = true;

                    // 3 Clawed Toe Prongs / Diving Flukes on front of flipper
                    [-0.42, 0, 0.42].forEach(tx => {
                        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.65), matHighTideWhite);
                        claw.position.set(tx, -0.06, 1.15);
                        flipperBoot.add(claw);
                    });

                    // Side Hydrofoil Stabilizer Fin on outer heel
                    const heelFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.85), matHighTideGold);
                    heelFin.position.set(side * 0.75, -2.75, -0.35);

                    legG.add(flipperBoot, heelFin);
                });

                // 5. Plesiosaur Dinobot Mode (Graceful Marine Neck, Hydrofoil Flippers & Rudder Tail)
                const plesioNeckBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 1.6, 12).rotateX(0.25), matHighTideBlue);
                plesioNeckBase.position.set(0, 0.85, 0.15);
                parts.dinoHead.add(plesioNeckBase);

                const plesioCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.35, 12).rotateX(0.25), matHighTideGold);
                plesioCollar.position.set(0, 1.35, 0.28);
                parts.dinoHead.add(plesioCollar);

                const plesioNeckUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.6, 12).rotateX(0.12), matHighTideWhite);
                plesioNeckUpper.position.set(0, 2.15, 0.45);
                parts.dinoHead.add(plesioNeckUpper);

                const plesioHeadGroup = new THREE.Group();
                plesioHeadGroup.position.set(0, 2.95, 0.65);
                parts.dinoHead.add(plesioHeadGroup);

                const plesioSkull = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.78, 1.65), matHighTideBlue);
                plesioSkull.position.set(0, 0, 0.42);
                plesioHeadGroup.add(plesioSkull);

                const plesioCrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 1.2).rotateX(-0.15), matHighTideGold);
                plesioCrest.position.set(0, 0.42, 0.25);
                plesioHeadGroup.add(plesioCrest);

                const plesioVisor = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.55), matHighTideCyanGlow);
                plesioVisor.position.set(0, 0.12, 0.75);
                plesioVisor.userData.noOutline = true;
                plesioHeadGroup.add(plesioVisor);

                const plesioJaw = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.35, 1.45), matHighTideWhite);
                plesioJaw.position.set(0, -0.28, 0.55);
                plesioHeadGroup.add(plesioJaw);

                [-1, 1].forEach(side => {
                    const wingG = side === -1 ? parts.dinoLeftWing : parts.dinoRightWing;
                    wingG.position.set(side * 1.65, 2.0, 0.25);

                    const flipper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.16, 0.88), matHighTideBlue);
                    flipper.position.set(side * 0.95, 0, 0);
                    flipper.rotation.y = side * 0.22;

                    const flipperTrim = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.18, 0.22), matHighTideWhite);
                    flipperTrim.position.set(side * 0.95, 0, 0.35);
                    flipperTrim.rotation.y = side * 0.22;

                    wingG.add(flipper, flipperTrim);
                });

                [-1, 1].forEach(side => {
                    const rearFlipper = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.14, 0.65), matHighTideBlue);
                    rearFlipper.position.set(side * 1.95, 1.85, -1.25);
                    rearFlipper.rotation.y = side * -0.28;
                    parts.dinoGroup.add(rearFlipper);
                });

                let prevPlesioTail = parts.dinoTail;
                for (let s = 0; s < 4; s++) {
                    const seg = new THREE.Group();
                    seg.position.set(0, 0, -0.85);
                    const sz = 1.05 - s * 0.18;
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.75, 0.95), matHighTideBlue);
                    mesh.position.set(0, 0, -0.42);
                    const keel = new THREE.Mesh(new THREE.BoxGeometry(0.12, sz * 0.95, 0.95), matHighTideGold);
                    keel.position.set(0, 0, -0.42);
                    seg.add(mesh, keel);
                    prevPlesioTail.add(seg);
                    prevPlesioTail = seg;
                }
                const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.95), matHighTideWhite);
                tailFin.position.set(0, 0, -0.85);
                                prevPlesioTail.add(tailFin);

                // Tag all standard sub-geometry as standard parts.
                // Skip structural rig joints (e.g. dinoHead / dinoTail / forearms nested inside other groups):
                // they host BOTH standard and Megabot geometry, so hiding them would hide the mega parts too.
                const rigJointSet = new Set(Object.values(parts as Record<string, any>).filter(v => v && v.isObject3D));
                [parts.torso, parts.head, parts.frontAttachment, parts.backAttachment, parts.leftArm, parts.rightArm, parts.leftForearm, parts.rightForearm, parts.leftLeg, parts.rightLeg, parts.dinoHead, parts.dinoLeftWing, parts.dinoRightWing, parts.dinoGroup, parts.dinoTail].forEach(grp => {
                    grp.children.forEach(child => {
                        if (rigJointSet.has(child)) return;
                        child.userData.isStandardPart = true;
                    });
                });

                // =============================================================
                // MEGABOT EXO-ARMOR GEOMETRY (Canonical TV Show / Bio Images 1-4)
                // =============================================================
                // 1. Megabot Torso: Massive White Armored Naval Hull with Glowing Cyan Autobot Screen & Blue Waist
                const megaTorso = new THREE.Group();
                megaTorso.userData.isMegaPart = true;
                parts.torso.add(megaTorso);

                // Main Naval White Armored Chest Block
                const mChest = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.65, 2.45), matMegaHullWhite);
                mChest.castShadow = true;
                megaTorso.add(mChest);

                // Top Collar Deck Arch
                const mCollarDeck = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.42, 2.55), matMegaHullWhite);
                mCollarDeck.position.set(0, 1.25, 0);
                const mCollarGold = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 0.35), matHighTideGold);
                mCollarGold.position.set(0, 1.35, 1.05);
                megaTorso.add(mCollarDeck, mCollarGold);

                // Central Glowing Cyan Autobot Screen Frame & Screen (Images 3 & 4)
                const mScreenFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.05, 0.16), matMegaKneeGold);
                mScreenFrame.position.set(0, 0.15, 1.22);
                const mScreen = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.85, 0.18), matMegaScreenCyan);
                mScreen.position.set(0, 0.15, 1.24);
                mScreen.userData.noOutline = true;
                megaTorso.add(mScreenFrame, mScreen);

                // Side Naval Air Intakes
                [-1.68, 1.68].forEach(sx => {
                    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.35, 0.65), matHighTideDark);
                    intake.position.set(sx, 0.15, 0.45);
                    megaTorso.add(intake);
                });

                // 5 Dorsal Armored Crocodile Scutes / Shark Spines (Mosasaur apex-predator dorsal ridge)
                // Mounted on the torso's back plate (local -Z), which faces skyward once the torso pitches horizontal in Dino mode.
                // Visibility is driven by applyBotRigMorph so the ridge only appears in Mega Dino mode (never on the robot's back or the ship).
                const megaDinoScutes = new THREE.Group();
                megaDinoScutes.visible = false;
                parts.megaDinoScutes = megaDinoScutes;
                megaTorso.add(megaDinoScutes);
                for (let s = 0; s < 5; s++) {
                    const h = 0.72 - s * 0.08;
                    const scute = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.62, h).rotateX(0.35), matMegaDeckRed);
                    scute.position.set(0, 1.1 - s * 0.55, -1.22 - h * 0.5);
                    const scuteTip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.42).rotateX(0.35), matHighTideGold);
                    scuteTip.position.set(0, 1.0 - s * 0.55, -1.22 - h - 0.12);
                    megaDinoScutes.add(scute, scuteTip);
                }

                // Heavy Royal Blue Waist Ring (Images 2 & 4)
                const mWaist = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.68, 24), matHighTideBlue);
                mWaist.position.set(0, -1.25, 0);
                // Lower Naval Groin Deck & Codpiece
                const mGroin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.55), matMegaHullWhite);
                mGroin.position.set(0, -1.55, 0);
                const mCod = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.78, 0.48), matMegaHullWhite);
                mCod.position.set(0, -1.55, 0.88);
                megaTorso.add(mWaist, mGroin, mCod);

                // 2. Megabot Bow Wedge & Forward Naval Hull on parts.frontAttachment (Reference Images 1 & 3)
                // In Vehicle Mode, extends forward creating the elongated Cybertronian naval vessel with sharp wedge prow!
                const megaBow = new THREE.Group();
                megaBow.userData.isMegaPart = true;
                parts.frontAttachment.add(megaBow);

                // A. Main Forward Hull Section
                const bowBlock = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.55, 3.4), matMegaHullWhite);
                bowBlock.position.set(0, 0, 1.7);
                bowBlock.castShadow = true;

                // B. Tapered Prow Wedge
                const bowWedge = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.5, 3.2), matMegaHullWhite);
                bowWedge.position.set(0, 0, 4.8);
                bowWedge.castShadow = true;

                // C. High Flared Bow Cutwater Nose (Images 1 & 3)
                const bowProw = new THREE.Mesh(
                    new THREE.ConeGeometry(1.48, 2.6, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4),
                    matMegaHullWhite
                );
                bowProw.position.set(0, 0, 7.4);
                bowProw.castShadow = true;

                // D. Golden Cutwater Anchor Crest & Leading Spine
                const cutwaterPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.8), matHighTideGold);
                cutwaterPlate.position.set(0, 0.1, 8.5);

                // E. Red Angular Hull Graphics & Gold Side Portholes (Reference Images 1 & 3)
                [-1, 1].forEach(side => {
                    // Bold Red Naval Flank Graphic
                    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 4.4), matMegaDeckRed);
                    redStripe.position.set(side * 1.68, 0.45, 3.6);
                    redStripe.rotation.z = side * 0.04;

                    // Gold Thruster / Porthole with Glowing Cyan Core
                    const goldPort = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.14, 16).rotateZ(Math.PI / 2), matMegaKneeGold);
                    goldPort.position.set(side * 1.69, -0.35, 4.2);
                    const portCore = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16).rotateZ(Math.PI / 2), matHighTideCyanGlow);
                    portCore.position.set(side * 1.70, -0.35, 4.2);
                    portCore.userData.noOutline = true;

                    // Horizontal Golden Accent Spar
                    const portFin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 2.4), matMegaKneeGold);
                    portFin.position.set(side * 1.69, -0.35, 2.8);

                    // Anchor Badge Decal on Forward Hull
                    const anchorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.95), matMegaHullBadge);
                    anchorPlate.position.set(side * 1.52, 0.25, 5.8);
                    anchorPlate.userData.noOutline = true;

                    megaBow.add(redStripe, goldPort, portCore, portFin, anchorPlate);
                });

                // F. Red Bulbous Keel & Sonar Dome
                const keelBulb = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 7.8, 16).rotateX(Math.PI / 2), matMegaDeckRed);
                keelBulb.position.set(0, -1.15, 3.8);
                const sonarDome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12), matMegaDeckRed);
                sonarDome.position.set(0, -1.15, 7.6);
                sonarDome.scale.set(1.0, 0.8, 1.25);

                // G. Forward Observation / Helipad Deck & Yellow Handrails
                const bowDeck = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.16, 7.2), matMegaHullWhite);
                bowDeck.position.set(0, 1.32, 3.6);
                const bowRailFront = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 0.08), matMegaCraneYellow);
                bowRailFront.position.set(0, 1.55, 7.1);
                [-1, 1].forEach(side => {
                    const bowRailSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 6.8), matMegaCraneYellow);
                    bowRailSide.position.set(side * 1.52, 1.55, 3.6);
                    megaBow.add(bowRailSide);
                });

                // H. Deck Windlass Bollards / Mooring Winch
                const winchBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.32, 0.85), matMegaClawCharcoal);
                winchBase.position.set(0, 1.48, 5.5);
                const winchSpool = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.95, 12).rotateZ(Math.PI / 2), matHighTideGold);
                winchSpool.position.set(0, 1.62, 5.5);

                megaBow.add(bowBlock, bowWedge, bowProw, cutwaterPlate, keelBulb, sonarDome, bowDeck, bowRailFront, winchBase, winchSpool);

                // 2. Megabot Head: Blue Helmet, Golden Diving Lamp, Vocoder Chin Beard & Cyan Visor
                const megaHead = new THREE.Group();
                megaHead.userData.isMegaPart = true;
                parts.head.add(megaHead);

                const mHelm = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.32, 1.28), matHighTideBlue);
                mHelm.castShadow = true;
                megaHead.add(mHelm);

                // Golden Forehead Diving Searchlight
                const mLampBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16).rotateX(Math.PI / 2), matHighTideGold);
                mLampBezel.position.set(0, 0.76, 0.65);
                const mLampLens = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.30, 16).rotateX(Math.PI / 2), matHighTideLamp);
                mLampLens.position.set(0, 0.76, 0.66);
                mLampLens.userData.noOutline = true;
                megaHead.add(mLampBezel, mLampLens);

                // Twin Blue Angled Antenna Fins
                [-0.72, 0.72].forEach(hx => {
                    const horn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.88, 0.45), matHighTideBlue);
                    horn.position.set(hx, 0.65, 0.05);
                    horn.rotation.z = hx < 0 ? 0.26 : -0.26;
                    megaHead.add(horn);
                });

                // Glowing Cyan Visor & Golden Chin Guard
                const mVisor = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.32, 0.38), matHighTideCyanGlow);
                mVisor.position.set(0, 0.12, 0.62);
                mVisor.userData.noOutline = true;
                const mBeard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.44, 0.38), matHighTideGold);
                mBeard.position.set(0, -0.34, 0.60);
                const mFace = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.98, 1.26), matHighTideFace);
                mFace.position.set(0, -0.04, 0.04);
                mFace.userData.noOutline = true;
                megaHead.add(mVisor, mBeard, mFace);

                // 3. Megabot Back: Dual Yellow Crane Boom Arms over Shoulders + Ship Superstructure Bridge
                const megaBack = new THREE.Group();
                megaBack.userData.isMegaPart = true;
                parts.backAttachment.add(megaBack);

                // Rear Ship Bridge Superstructure in Autobot Red (Images 1 & 3)
                const mBridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.6, 1.5), matMegaHullWhite);
                mBridgeDeck.position.set(0, 0.3, -0.75);
                const mBridgeTower = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 1.3), matMegaDeckRed);
                mBridgeTower.position.set(0, 1.3, -0.95);
                const mBridgeWindows = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 0.15), matMegaWindowBlue);
                mBridgeWindows.position.set(0, 1.7, -0.25);
                mBridgeWindows.userData.noOutline = true;
                megaBack.add(mBridgeDeck, mBridgeTower, mBridgeWindows);

                // Twin Giant Articulated Yellow Deck Crane Arms (Images 1, 2, 3, 4)
                parts.megaCranes = [];
                [-1.85, 1.85].forEach((cx, idx) => {
                    const craneTurret = new THREE.Group();
                    craneTurret.position.set(cx, 1.3, -0.65);

                    // Turret Base
                    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.55, 16), matMegaHullWhite);
                    const tRail = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.04, 8, 16).rotateX(Math.PI / 2), matMegaCraneYellow);
                    tRail.position.y = 0.28;
                    craneTurret.add(tBase, tRail);

                    // Articulated Crane Boom Pivot
                    const boomPivot = new THREE.Group();
                    boomPivot.position.set(0, 0.35, 0);

                    // Lower Yellow Boom (sweeps upward)
                    const lowBoom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.7, 0.48), matMegaCraneYellow);
                    lowBoom.position.set(0, 1.25, 0);
                    lowBoom.castShadow = true;

                    // Hydraulic Actuator
                    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 10), matQuickSilver);
                    piston.position.set((idx === 0 ? -1 : 1) * 0.25, 1.0, 0);
                    piston.userData.noOutline = true;

                    // Elbow Hinge Joint
                    const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.52, 16).rotateZ(Math.PI / 2), matMegaCraneYellow);
                    elbow.position.set(0, 2.6, 0);

                    // Upper Yellow Boom (curves forward over shoulders)
                    const upBoom = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.4, 0.44), matMegaCraneYellow);
                    upBoom.position.set(0, 3.4, 0.95);
                    upBoom.rotation.x = 0.58;
                    upBoom.castShadow = true;

                    // Wrist Joint & 3 Mechanical Grabber Claws
                    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 12), matMegaClawCharcoal);
                    wrist.position.set(0, 4.3, 1.95);

                    const clawG = new THREE.Group();
                    clawG.position.set(0, 4.45, 1.95);
                    for (let c = 0; c < 3; c++) {
                        const ang = (c * Math.PI * 2) / 3;
                        const clawJaw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.88, 0.28), matMegaClawCharcoal);
                        clawJaw.position.set(Math.cos(ang) * 0.38, 0.42, Math.sin(ang) * 0.38);
                        clawJaw.rotation.z = Math.cos(ang) * 0.32;
                        clawJaw.rotation.x = Math.sin(ang) * 0.32;
                        clawG.add(clawJaw);
                    }

                    boomPivot.add(lowBoom, piston, elbow, upBoom, wrist, clawG);
                    craneTurret.add(boomPivot);
                    megaBack.add(craneTurret);
                    parts.megaCranes.push(boomPivot);
                });

                // Dual Stern Hydro-Jet Ducted Thrusters
                [-1.5, 1.5].forEach(tx => {
                    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2.4, 16).rotateX(Math.PI / 2), matMegaHullWhite);
                    duct.position.set(tx, 0.15, -1.8);
                    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.3, 16).rotateX(Math.PI / 2), matMegaKneeGold);
                    cowl.position.set(tx, 0.15, -0.65);
                    megaBack.add(duct, cowl);
                });

                // 4. Megabot Arms: White Pauldrons with Red Chevrons, Red Forearms & Blue Claws (Images 2, 3, 4)
                [-1, 1].forEach((side, idx) => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    const megaArm = new THREE.Group();
                    megaArm.userData.isMegaPart = true;
                    armG.add(megaArm);

                    // Massive White Flared Shoulder Pauldron
                    const pShoulder = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.68, 1.78), matMegaHullWhite);
                    pShoulder.castShadow = true;
                    // Angled Top Armor Crown
                    const pCrown = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.42, 1.82), matMegaHullWhite);
                    pCrown.position.set(0, 0.88, 0);
                    pCrown.rotation.z = side * -0.22;

                    // Bold Red Naval Chevron Stripes (Images 2, 3, 4)
                    const pChevron = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 1.45), matMegaShoulderChevron);
                    pChevron.position.set(side * 0.88, 0.08, 0);
                    pChevron.userData.noOutline = true;

                    // Charcoal Bicep
                    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.85, 12), matHighTideDark);
                    bicep.position.set(0, -0.85, 0);

                    megaArm.add(pShoulder, pCrown, pChevron, bicep);

                    // Forearm: Crimson Red & White Hull with Blue Grabber Claw Hands
                    const megaForearm = new THREE.Group();
                    megaForearm.userData.isMegaPart = true;
                    forearmG.add(megaForearm);

                    // Upper Crimson Red Gauntlet
                    const redGauntlet = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.48, 1.42), matMegaDeckRed);
                    redGauntlet.position.set(0, -0.45, 0.04);
                    redGauntlet.castShadow = true;

                    // Lower White Hull Plating
                    const whiteGauntlet = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.75, 1.48), matMegaHullWhite);
                    whiteGauntlet.position.set(0, -0.88, 0.04);

                    // Side Charcoal Heat Sinks
                    const heatSink = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.65), matHighTideDark);
                    heatSink.position.set(side * 0.76, -0.45, 0.04);

                    // Golden Wrist Cuff
                    const cuff = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.32, 1.54), matHighTideGold);
                    cuff.position.set(0, -1.08, 0.04);

                    // Massive Royal Blue Hydraulic Claw Hand (Images 2, 3, 4)
                    const handBlock = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.85), matHighTideBlue);
                    handBlock.position.set(0, -1.38, 0.04);

                    const palmLens = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 16), matHighTideCyanGlow);
                    palmLens.position.set(0, -1.62, 0.04);
                    palmLens.userData.noOutline = true;

                    // 3 Hydraulic Claws
                    const claws = new THREE.Group();
                    claws.position.set(0, -1.45, 0.04);
                    [-0.32, 0, 0.32].forEach((cx, cIdx) => {
                        const clawF = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.35), matHighTideBlue);
                        clawF.position.set(cx, -0.45, cIdx === 1 ? -0.28 : 0.28);
                        clawF.rotation.x = cIdx === 1 ? -0.28 : 0.28;
                        claws.add(clawF);
                    });

                    megaForearm.add(redGauntlet, whiteGauntlet, heatSink, cuff, handBlock, palmLens, claws);
                });

                // 5. Megabot Legs: Charcoal Thighs, Yellow Knee Discs with Cyan Lenses, Flared White Shins & Blue Boots (Images 2, 3, 4)
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    const megaLeg = new THREE.Group();
                    megaLeg.userData.isMegaPart = true;
                    // Elevate Megabot leg hierarchy to ensure boot soles rest firmly flush on the terrain surface (no sinking into ground)
                    megaLeg.position.y = 0.88;
                    legG.add(megaLeg);

                    // Charcoal Upper Thigh
                    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.35, 12), matHighTideDark);
                    thigh.position.set(-side * 0.05, -0.5, 0);
                    thigh.castShadow = true;

                    // Iconic Round Yellow Knee Disc with Cyan Glass Dome Lens (Images 2, 3, 4)
                    const kneeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.28, 20).rotateX(Math.PI / 2), matMegaKneeGold);
                    kneeDisc.position.set(-side * 0.06, -1.15, 0.72);

                    const kneeLens = new THREE.Mesh(
                        new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).rotateX(Math.PI / 2),
                        matMegaKneeLens
                    );
                    kneeLens.position.set(-side * 0.06, -1.15, 0.86);
                    kneeLens.userData.noOutline = true;

                    // Flared White Heavy Shin Armor
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 2.15, 1.85), matMegaHullWhite);
                    shin.position.set(-side * 0.08, -1.95, 0.05);
                    shin.castShadow = true;

                    // Red Inner Calf Scoop Channel
                    const calfScoop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.75, 0.95), matMegaDeckRed);
                    calfScoop.position.set(side * 0.72, -1.95, 0.08);

                    // Massive Royal Blue Naval Boots
                    const boot = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.55, 2.65), matHighTideBlue);
                    boot.position.set(-side * 0.08, -2.95, 0.35);
                    boot.castShadow = true;

                    // Diving Fluke Claws on boot front
                    [-0.52, 0, 0.52].forEach(tx => {
                        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.75), matMegaHullWhite);
                        claw.position.set(tx, -0.08, 1.45);
                        boot.add(claw);
                    });

                    megaLeg.add(thigh, kneeDisc, kneeLens, shin, calfScoop, boot);
                });

                // 6. Megabot Dino Mode: True Prehistoric Mosasaur Apex Predator
                const megaDinoHead = new THREE.Group();
                megaDinoHead.userData.isMegaPart = true;
                parts.dinoHead.add(megaDinoHead);

                // A. Muscular Cyber-Neck Cowl (connecting skull directly to torso - eliminates slender plesiosaur swan-neck!)
                const neckCowl = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.95, 2.2), matMegaHullWhite);
                neckCowl.position.set(0, 0.1, -0.75);
                neckCowl.castShadow = true;
                // Neck Gill Vents / Heat Exchangers
                [-1.42, 1.42].forEach(gx => {
                    for (let g = 0; g < 3; g++) {
                        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.35), matHighTideDark);
                        vent.position.set(gx, 0.1, -1.2 + g * 0.55);
                        neckCowl.add(vent);
                    }
                });

                // B. Skull Base: Broad crocodile temporal cranium
                const skullBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.45, 2.5), matMegaHullWhite);
                skullBase.position.set(0, 0.22, 1.2);
                skullBase.castShadow = true;

                // C. Snout Midsection: Tapered crocodile predatory snout
                const snoutMid = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.15, 2.6), matMegaHullWhite);
                snoutMid.position.set(0, 0.15, 3.4);
                snoutMid.castShadow = true;

                // D. Snout Tip: Pointed wedge predatory rostrum
                const snoutTip = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 2.2), matMegaHullWhite);
                snoutTip.position.set(0, 0.08, 5.4);
                snoutTip.castShadow = true;

                // E. Cutwater Nose: Sharp armored prow tip
                const cutwaterNose = new THREE.Mesh(
                    new THREE.ConeGeometry(0.68, 1.4, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4),
                    matHighTideBlue
                );
                cutwaterNose.position.set(0, 0.08, 6.9);
                cutwaterNose.castShadow = true;

                // F. Dorsal Crest: Multi-segmented predatory crest running along the skull
                const mosasaurCrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 4.6).rotateX(-0.06), matHighTideGold);
                mosasaurCrest.position.set(0, 0.95, 2.8);

                // G. Nostrils / Maritime Blowholes
                [-0.35, 0.35].forEach(nx => {
                    const nostril = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8).rotateX(0.2), matHighTideDark);
                    nostril.position.set(nx, 0.72, 4.2);
                    megaDinoHead.add(nostril);
                });

                // H. Angular Predatory Brow Ridges & Glowing Cyan Visors
                [-1.15, 1.15].forEach(side => {
                    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.6).rotateZ(side * -0.25), matMegaHullWhite);
                    brow.position.set(side * 1.05, 0.72, 1.5);
                    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 1.25).rotateY(side * 0.08), matHighTideCyanGlow);
                    visor.position.set(side * 1.18, 0.38, 1.4);
                    visor.userData.noOutline = true;
                    megaDinoHead.add(brow, visor);
                });

                // I. Upper Chrome Teeth: Interlocking conical razor teeth along upper jaw margins
                for (let t = 0; t < 7; t++) {
                    const toothZ = 2.4 + t * 0.58;
                    const toothX = 0.92 - t * 0.065;
                    [-1, 1].forEach(side => {
                        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.36, 6).rotateX(Math.PI), matChrome);
                        tooth.position.set(side * toothX, -0.42, toothZ);
                        tooth.rotation.z = side * 0.12;
                        megaDinoHead.add(tooth);
                    });
                }

                megaDinoHead.add(neckCowl, skullBase, snoutMid, snoutTip, cutwaterNose, mosasaurCrest);

                // J. Articulated Kinetic Lower Jaw (snaps open on smash / chomp attacks!)
                const megaLowerJaw = new THREE.Group();
                megaLowerJaw.position.set(0, -0.42, 0.2); // hinge pivot
                megaLowerJaw.userData.isMegaPart = true;
                parts.dinoLowerJaw = megaLowerJaw;
                megaDinoHead.add(megaLowerJaw);

                const jawBase = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.54, 2.2), matMegaDeckRed);
                jawBase.position.set(0, 0, 1.0);
                const jawMid = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.48, 2.5), matMegaDeckRed);
                jawMid.position.set(0, -0.03, 3.0);
                const jawTip = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 2.1), matMegaDeckRed);
                jawTip.position.set(0, -0.06, 5.0);
                const chinKeel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 4.2), matHighTideGold);
                chinKeel.position.set(0, -0.35, 3.2);

                // Lower Chrome Teeth: Interlocking razor teeth pointing upward
                for (let t = 0; t < 7; t++) {
                    const toothZ = 2.1 + t * 0.58;
                    const toothX = 0.78 - t * 0.055;
                    [-1, 1].forEach(side => {
                        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.36, 6), matChrome);
                        tooth.position.set(side * toothX, 0.26, toothZ);
                        tooth.rotation.z = side * -0.12;
                        megaLowerJaw.add(tooth);
                    });
                }
                megaLowerJaw.add(jawBase, jawMid, jawTip, chinKeel);

                // Heavy Mosasaur Hydrofoil Pectoral Flippers with Hyperphalangeal Digits
                [-1, 1].forEach(side => {
                    const wingG = side === -1 ? parts.dinoLeftWing : parts.dinoRightWing;
                    const megaWing = new THREE.Group();
                    megaWing.userData.isMegaPart = true;
                    wingG.add(megaWing);

                    // Swept Predatory Hydrofoil
                    const flipper = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 1.65), matHighTideBlue);
                    flipper.position.set(side * 2.2, 0, -0.2);
                    flipper.rotation.y = side * 0.38;
                    flipper.castShadow = true;

                    // Flared White Leading Edge
                    const flipperLeading = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.26, 0.35), matMegaHullWhite);
                    flipperLeading.position.set(side * 2.2, 0, 0.65);
                    flipperLeading.rotation.y = side * 0.38;

                    // 4 Golden Hyperphalangeal Digit Spars
                    for (let d = 0; d < 4; d++) {
                        const spar = new THREE.Mesh(new THREE.BoxGeometry(3.6 - d * 0.45, 0.25, 0.12), matHighTideGold);
                        spar.position.set(side * (1.9 + d * 0.1), 0.02, 0.35 - d * 0.38);
                        spar.rotation.y = side * (0.35 - d * 0.04);
                        megaWing.add(spar);
                    }

                    megaWing.add(flipper, flipperLeading);
                });

                // Armored Mosasaur Two-Lobed Hypocercal Caudal Crescent Fin (Authentic prehistoric marine lizard tail!)
                const megaTail = new THREE.Group();
                megaTail.userData.isMegaPart = true;
                parts.dinoTail.add(megaTail);

                // Thick Muscular Tail Peduncle
                const peduncle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.65, 2.4), matHighTideBlue);
                peduncle.position.set(0, 0, -1.0);
                peduncle.castShadow = true;

                // Upper Fluke Lobe (sweeps up and back at +42 degrees)
                const upperLobe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 1.4).rotateX(0.42), matMegaDeckRed);
                upperLobe.position.set(0, 1.45, -2.2);
                upperLobe.castShadow = true;
                const upperTrim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.65, 0.28).rotateX(0.42), matHighTideGold);
                upperTrim.position.set(0, 1.45, -1.6);

                // Lower Fluke Lobe (sweeps down and back at -55 degrees - classic hypocercal mosasaur fluke!)
                const lowerLobe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.6, 1.8).rotateX(-0.55), matMegaHullWhite);
                lowerLobe.position.set(0, -1.25, -2.6);
                lowerLobe.castShadow = true;
                const lowerLeadingRed = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.65, 0.35).rotateX(-0.55), matMegaDeckRed);
                lowerLeadingRed.position.set(0, -1.25, -1.8);

                // Caudal Keel Fairing
                const tailKeel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.4, 2.6), matHighTideNavy);
                tailKeel.position.set(0, -0.3, -1.3);

                megaTail.add(peduncle, upperLobe, upperTrim, lowerLobe, lowerLeadingRed, tailKeel);

                // Initialize rig part visibility to match current docked status
                const isCurrentMega = Boolean(typeof progression !== 'undefined' && progression.highTideDocked);
                if (typeof setHighTideRigMega === 'function') {
                    setHighTideRigMega(parts, isCurrentMega);
                } else if (typeof window !== 'undefined' && typeof window.setHighTideRigMega === 'function') {
                    window.setHighTideRigMega(parts, isCurrentMega);
                }
}

export default buildHighTide;

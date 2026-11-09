// 3D Cel-Shaded Model & Morph Builder for HEATWAVE
import * as THREE from 'three';
import { texFaceHeatwave } from '../rendering/textures.js';
import { createLightbar, createWheelAssembly } from './botHelpers.js';

export function buildHeatwave(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Heatwave: Vivid Fire-Engine Red (#e81e25), Gold Accent (#ffcc00) & Silver Faceplate
                const matRed = new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad4 });
                const matCrimson = new THREE.MeshToonMaterial({ color: 0xb91c1c, gradientMap: toonGrad4 });
                const matGold = new THREE.MeshToonMaterial({ color: 0xffcc00, gradientMap: toonGrad4 });
                const matFace = new THREE.MeshBasicMaterial({ map: texFaceHeatwave });

                // Full Fire-Engine Cab Chest (In Vehicle Mode, His Chest IS the Complete Front Cab!)
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.92, 2.54, 2.38), matRed);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Yellow Fire-Stripe Waist Trim wraps around Cab
                const goldStripe = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.36, 2.42), matGold);
                goldStripe.position.set(0, -0.82, 0);
                parts.torso.add(goldStripe);

                // Wrap-Around Front & Side Cab Windows
                const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.96, 2.42), matCabGlass);
                windshield.position.set(0, 0.54, 0.04);
                windshield.userData.noOutline = true;
                parts.torso.add(windshield);

                const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(2.98, 0.88, 1.56), matCabGlass);
                sideWindows.position.set(0, 0.54, 0.16);
                sideWindows.userData.noOutline = true;
                parts.torso.add(sideWindows);

                // Front Radiator Grille & Rescue Bots Fire Badge
                const grille = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.98, 2.44), matGrille);
                grille.position.set(0, -0.46, 0.04);
                grille.userData.noOutline = true;
                parts.torso.add(grille);

                const badge = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 2.48), matEmblem);
                badge.position.set(0, -0.42, 0.05);
                badge.userData.noOutline = true;
                parts.torso.add(badge);

                // Cab Headlights & Chrome Side Mirrors on Full Cab Chest
                [-1.02, 1.02].forEach(hx => {
                    const hLight = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.16), matVisorGold);
                    hLight.position.set(hx, -0.46, 1.2);
                    hLight.userData.noOutline = true;
                    parts.torso.add(hLight);
                });
                [-1.56, 1.56].forEach(mx => {
                    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.28), matChrome);
                    mirror.position.set(mx, 0.54, 0.92);
                    parts.torso.add(mirror);
                });

                // Emergency Lightbar on Cab Roof
                const lb = createLightbar(2.35);
                lb.group.position.set(0, 1.42, 0.42);
                parts.torso.add(lb.group);
                parts.lightbar = lb;

                // Commander Helmet Head with Firefighter Front Brim, Shield Badge & Cyan Visor (Matching Cartoon)
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.28, 1.34), matRed);
                helm.castShadow = true;
                parts.head.add(helm);

                // Protruding Firefighter Front Brim (Angles forward over his brow)
                const frontBrim = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.16, 0.62), matCrimson);
                frontBrim.position.set(0, 0.44, 0.54);
                frontBrim.rotation.x = -0.15;
                parts.head.add(frontBrim);

                // Rear Neck Guard Brim
                const rearBrim = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.14, 0.48), matCrimson);
                rearBrim.position.set(0, 0.18, -0.58);
                parts.head.add(rearBrim);

                // Central Firefighter Helmet Spine Crest
                const crest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 1.48), matRed);
                crest.position.set(0, 0.72, 0.04);
                parts.head.add(crest);

                // Gold Firefighter Shield Emblem on Front of Crest
                const shieldBadge = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.16), matGold);
                shieldBadge.position.set(0, 0.64, 0.74);
                shieldBadge.rotation.x = -0.18;
                parts.head.add(shieldBadge);

                // Side Protective Cheek Flaps (Frame his jaw)
                [-0.68, 0.68].forEach(sx => {
                    const cheekGuard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.52), matCrimson);
                    cheekGuard.position.set(sx, -0.12, 0.32);
                    parts.head.add(cheekGuard);
                });

                // Expressive Cartoon Face Mesh
                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.94, 1.38), matFace);
                faceMesh.position.set(0, -0.04, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // Back Articulated Fire Ladder Turret & High-Pressure Water Cannon
                const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.98, 0.72, 12), matChrome);
                parts.backAttachment.add(turretBase);

                const ladderBoom = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.68, 4.25), matChrome);
                ladderBoom.position.set(0, 0.68, -0.6);
                ladderBoom.castShadow = true;
                parts.backAttachment.add(ladderBoom);

                const waterMonitor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.45, 10).rotateX(Math.PI / 2), matGold);
                waterMonitor.position.set(0, 1.18, 1.35);
                parts.backAttachment.add(waterMonitor);

                parts.nozzleTip.position.set(0, 1.18, 2.25);
                parts.backAttachment.add(parts.nozzleTip);

                // Arms that Wrap Around the Front of the Cab (Provide Front Wheels + Fingers Join as Front Bumper!)
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.34, 1.36), matRed);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    // Front Cab Wheel mounted on Upper Arm (sits flush under cab fender when arm pitches forward)
                    const wheel = createWheelAssembly(0.76, 0.52);
                    wheel.position.set(side * 0.48, -0.22, 0.38);
                    armG.add(wheel);
                    parts.wheels.push(wheel);

                    // Articulated Elbow & Forearm that swings 90° inward across the front of the Cab
                    forearmG.position.set(0, -1.16, 0.0);
                    armG.add(forearmG);

                    const forearm = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.18, 0.96), matCrimson);
                    forearm.position.set(0, -0.42, 0);
                    forearm.castShadow = true;
                    forearmG.add(forearm);

                    // Chrome Hand & Interlocking Finger Bars that form Half of the Front Fire Bumper!
                    const bumperPalm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.68, 0.82), matChrome);
                    bumperPalm.position.set(-side * 0.18, -1.12, 0.06);
                    bumperPalm.castShadow = true;
                    forearmG.add(bumperPalm);

                    // 3 Sculpted Chrome Fingers (Interlock at the centerline to form the full front chrome bumper)
                    [-0.22, 0, 0.22].forEach(fz => {
                        const fingerBar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.62, 0.19), matChrome);
                        fingerBar.position.set(-side * 0.14, -1.46, fz + 0.06);
                        fingerBar.castShadow = true;
                        forearmG.add(fingerBar);
                    });

                    // Yellow & Black Hazard Fog-Light Strip on the Bumper Knuckles
                    const bumperAmber = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.86), matGold);
                    bumperAmber.position.set(side * 0.22, -1.18, 0.06);
                    forearmG.add(bumperAmber);
                });

                // Legs that Fold Up Behind the Cab to Form the Rear Fire Truck Body & Provide Two Wheels on Each Side!
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    // Upper Leg / Chrome Equipment Locker Deck
                    const thigh = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.42, 1.48), matChrome);
                    thigh.position.set(-side * 0.08, -0.52, 0);
                    thigh.castShadow = true;
                    legG.add(thigh);

                    // Lower Leg / Full Rear Fire Engine Tanker Half-Body (Joins flush with opposite leg in Vehicle Mode)
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.38, 1.88), matRed);
                    shin.position.set(-side * 0.12, -1.48, 0.08);
                    shin.castShadow = true;
                    legG.add(shin);

                    // Roll-up Silver Equipment Compartment Shutters & Gold Fire Trim along Rear Body
                    const lockerShutter = new THREE.Mesh(new THREE.BoxGeometry(1.58, 1.56, 0.92), matChrome);
                    lockerShutter.position.set(-side * 0.12, -1.42, 0.36);
                    legG.add(lockerShutter);

                    const rearGoldStripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.98, 0.32), matGold);
                    rearGoldStripe.position.set(-side * 0.12, -1.48, -0.32);
                    legG.add(rearGoldStripe);

                    // Two Rear Tandem Fire-Engine Wheels on a Sliding Mount (Shifts during transformation so both wheels sit flush on the ground!)
                    const wheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;
                    wheelMount.position.set(side * 0.58, 0, -0.05);
                    legG.add(wheelMount);

                    [-0.86, -2.14].forEach(wy => {
                        const w = createWheelAssembly(0.74, 0.5);
                        w.position.set(0, wy, 0);
                        wheelMount.add(w);
                        parts.wheels.push(w);
                    });

                    // Rear Tailgate Boot & Taillights
                    const boot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.56, 1.96), matCrimson);
                    boot.position.set(-side * 0.12, -2.52, 0.18);
                    boot.castShadow = true;
                    legG.add(boot);

                    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.36), matVisorGold);
                    tailLight.position.set(side * 0.24, -2.62, 0.55);
                    tailLight.userData.noOutline = true;
                    legG.add(tailLight);
                });

                // DINOBOT MODE: HEATWAVE BRACHIOSAURUS (Towering Articulated Neck, Crested Head & Water-Cannon Snout)
                const brachShell = new THREE.Mesh(new THREE.BoxGeometry(2.92, 1.15, 3.15), matRed);
                brachShell.position.set(0, 2.75, -0.1);
                brachShell.castShadow = true;
                parts.dinoGroup.add(brachShell);

                const brachGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.36, 2.65), matGold);
                brachGoldTrim.position.set(0, 2.65, -0.1);
                parts.dinoGroup.add(brachGoldTrim);

                // Towering Brachiosaurus Neck + Head Assembly (attached to parts.dinoHead pivot)
                const neckLower = new THREE.Mesh(new THREE.BoxGeometry(1.38, 2.25, 1.38), matRed);
                neckLower.position.set(0, 0.95, 0.22);
                neckLower.rotation.x = 0.18;
                neckLower.castShadow = true;
                parts.dinoHead.add(neckLower);

                const neckUpper = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.35, 1.18), matCrimson);
                neckUpper.position.set(0, 2.85, 0.55);
                neckUpper.rotation.x = 0.12;
                neckUpper.castShadow = true;
                parts.dinoHead.add(neckUpper);

                // Gold Neck Armor Segments
                [0.65, 1.65, 2.65].forEach((ny, idx) => {
                    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.34, 0.42), matGold);
                    plate.position.set(0, ny, 0.82 + idx * 0.14);
                    parts.dinoHead.add(plate);
                });

                // Brachiosaurus Domed Skull, Gold Nasal Crest & Water-Cannon Snout
                const brachSkull = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.18, 1.85), matRed);
                brachSkull.position.set(0, 4.15, 1.05);
                brachSkull.castShadow = true;
                parts.dinoHead.add(brachSkull);

                const brachCrest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 1.35), matGold);
                brachCrest.position.set(0, 4.88, 0.95);
                parts.dinoHead.add(brachCrest);

                const brachEyes = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.36, 0.58), matVisorGold);
                brachEyes.position.set(0, 4.3, 1.25);
                brachEyes.userData.noOutline = true;
                parts.dinoHead.add(brachEyes);

                const brachSnout = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.62, 1.15), matChrome);
                brachSnout.position.set(0, 3.88, 1.95);
                parts.dinoHead.add(brachSnout);

                const dinoNozzle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.28, 0.36, 0.75, 10).rotateX(Math.PI / 2),
                    matGold
                );
                dinoNozzle.position.set(0, 3.88, 2.55);
                parts.dinoHead.add(dinoNozzle);

                parts.dinoNozzleTip.position.set(0, 3.88, 3.05);
                parts.dinoHead.add(parts.dinoNozzleTip);

                // Sweeping Brachiosaurus Counterbalance Tail
                const brachTailBase = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.05, 1.95), matRed);
                brachTailBase.position.set(0, 0, -0.85);
                parts.dinoTail.add(brachTailBase);
                const brachTailTip = new THREE.Mesh(
                    new THREE.ConeGeometry(0.68, 2.75, 6).rotateX(-Math.PI / 2),
                    matCrimson
                );
                brachTailTip.position.set(0, -0.1, -2.85);
                parts.dinoTail.add(brachTailTip);

                // =============================================================
                // MEGA BOT: HEATWAVE SEMI LADDER FIRE ENGINE TRAILER CONVERSION
                // =============================================================
                // 1. Vehicle Mode: Articulated Aerial Ladder Fire Trailer
                const trailerHitch = new THREE.Group();
                trailerHitch.userData.isMegaPart = true;
                parts.trailerHitch = trailerHitch;
                parts.backAttachment.add(trailerHitch);

                const megaTrailer = new THREE.Group();
                megaTrailer.userData.isMegaPart = true;
                megaTrailer.visible = false;
                parts.megaTrailer = megaTrailer;
                trailerHitch.add(megaTrailer);

                // Main Fire Apparatus Body (11.5m long, 2.85m wide, 3.0m high)
                const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.85, 2.8, 11.5), matRed);
                trHull.position.set(0, 0.9, -6.5);
                trHull.castShadow = true;
                megaTrailer.add(trHull);

                // White Side Rescue Stripes & Chrome Diamond Plate Compartments
                [-1.44, 1.44].forEach(sx => {
                    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 10.8), matChrome);
                    stripe.position.set(sx, 1.35, -6.5);
                    const compLower = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 10.5), matDarkSteel);
                    compLower.position.set(sx, 0.35, -6.5);
                    megaTrailer.add(stripe, compLower);
                });

                // Heavy 360-Degree Aerial Ladder Turntable Platform
                const turntable = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.45, 16), matDarkSteel);
                turntable.position.set(0, 2.45, -3.2);
                megaTrailer.add(turntable);

                // Massive 8.5m Chrome Aerial Rescue Ladder Bed
                const megaLadderBoom = new THREE.Group();
                megaLadderBoom.position.set(0, 2.75, -3.2);
                megaTrailer.add(megaLadderBoom);

                [-0.48, 0.48].forEach(lx => {
                    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 8.5), matChrome);
                    rail.position.set(lx, 0.15, -3.8);
                    megaLadderBoom.add(rail);
                    for (let r = -7.5; r <= 0; r += 0.85) {
                        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 6).rotateZ(Math.PI / 2), matChrome);
                        rung.position.set(0, 0.15, r);
                        megaLadderBoom.add(rung);
                    }
                });

                // Tip Water Cannons on Ladder Boom
                [-0.32, 0.32].forEach(nx => {
                    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 8).rotateX(Math.PI / 2), matGold);
                    nozzle.position.set(nx, 0.35, -8.2);
                    megaLadderBoom.add(nozzle);
                });

                // Rear Step Tailgate & Strobe Lights
                const rBumper = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.45, 0.35), matDarkSteel);
                rBumper.position.set(0, -0.35, -12.35);
                megaTrailer.add(rBumper);
                [-1.1, 1.1].forEach(tx => {
                    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), matSirenRed);
                    tail.position.set(tx, -0.35, -12.52);
                    tail.userData.noOutline = true;
                    megaTrailer.add(tail);
                });

                // Tandem Heavy Wheels (Functional Wheel Assemblies)
                [-8.6, -10.5].forEach(wz => {
                    [-1.48, 1.48].forEach(wx => {
                        const trWheel = createWheelAssembly(0.76, 0.52);
                        trWheel.position.set(wx, -0.9, wz);
                        megaTrailer.add(trWheel);
                        parts.wheels.push(trWheel);
                    });
                });

                // 2. Bot Mode: Heavy Over-Shoulder Deluge Turret Backpack
                const megaBackPack = new THREE.Group();
                megaBackPack.userData.isMegaPart = true;
                megaBackPack.visible = false;
                parts.megaBackPack = megaBackPack;
                parts.backAttachment.add(megaBackPack);

                const bpBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 1.6), matRed);
                bpBase.position.set(0, 0.2, 0.2);
                bpBase.castShadow = true;
                megaBackPack.add(bpBase);

                [-1.4, 1.4].forEach(cx => {
                    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 3.2, 10).rotateX(Math.PI / 2), matChrome);
                    barrel.position.set(cx, 1.9, 1.1);
                    barrel.castShadow = true;
                    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.5, 10).rotateX(Math.PI / 2), matGold);
                    tip.position.set(cx, 1.9, 2.8);
                    megaBackPack.add(barrel, tip);
                });

                // 3. Dino Mode: Aerial Ladder Spine Armor for Brachiosaurus
                const megaDinoArmor = new THREE.Group();
                megaDinoArmor.userData.isMegaPart = true;
                megaDinoArmor.visible = false;
                parts.megaDinoArmor = megaDinoArmor;
                parts.dinoGroup.add(megaDinoArmor);

                const spineArmor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 4.2), matChrome);
                spineArmor.position.set(0, 3.4, -0.4);
                megaDinoArmor.add(spineArmor);

                // =============================================================
                // HEATWAVE BOAT MODE: RESCUE FIREBOAT CATAMARAN
                // (Dual Sponsons, Life Rings, Twin Deck Cannons, Jet Thrusters)
                // =============================================================
                const boatGroup = new THREE.Group();
                boatGroup.userData.isBoatPart = true;
                boatGroup.visible = false;
                parts.boatGroup = boatGroup;
                parts.chassis.add(boatGroup);

                const matCyanTrim = new THREE.MeshToonMaterial({ color: 0x00d2ff, gradientMap: toonGrad4 });
                const matWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
                const matThruster = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
                const matJetGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

                // 1. Dual Catamaran Outrigger Sponsons
                [-1.72, 1.72].forEach((sx, idx) => {
                    const sponsonGroup = new THREE.Group();
                    sponsonGroup.position.set(sx, 0.82, 0.1);

                    // Main Sponson Hull
                    const spHull = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.92, 5.6), matRed);
                    spHull.castShadow = true;
                    sponsonGroup.add(spHull);

                    // Wave-Piercing Angled Bow Wedge
                    const bowWedge = new THREE.Mesh(
                        new THREE.ConeGeometry(0.72, 1.8, 4).rotateX(-Math.PI / 2).rotateY(Math.PI / 4),
                        matRed
                    );
                    bowWedge.position.set(0, -0.05, 3.5);
                    bowWedge.scale.set(1.1, 0.8, 1.2);
                    bowWedge.castShadow = true;
                    sponsonGroup.add(bowWedge);

                    // Vibrant Cyan Chine Bumper Trim running along outer edge
                    const chineTrim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 6.8), matCyanTrim);
                    chineTrim.position.set(Math.sign(sx) * 0.58, 0.28, 0.4);
                    chineTrim.userData.noOutline = true;
                    sponsonGroup.add(chineTrim);

                    // Sponson Upper Deck Accent (Gold / Yellow Fire Striping)
                    const deckStripe = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 3.8), matGold);
                    deckStripe.position.set(0, 0.48, 0.6);
                    sponsonGroup.add(deckStripe);

                    // Sponson Side Portals / Indicator Nodes
                    [-0.8, 0.2, 1.2].forEach(pz => {
                        const portal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8).rotateZ(Math.PI / 2), matVisorGold);
                        portal.position.set(Math.sign(sx) * 0.58, 0.05, pz);
                        portal.userData.noOutline = true;
                        sponsonGroup.add(portal);
                    });

                    // Rear High-Power Waterjet Thruster Cowling & Exhaust
                    const jetCowling = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 1.2, 12).rotateX(Math.PI / 2), matThruster);
                    jetCowling.position.set(0, 0.08, -3.15);
                    jetCowling.castShadow = true;
                    const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.4, 12).rotateX(Math.PI / 2), matChrome);
                    jetNozzle.position.set(0, 0.08, -3.8);
                    const jetGlow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), matJetGlow);
                    jetGlow.position.set(0, 0.08, -4.01);
                    jetGlow.rotation.y = Math.PI;
                    jetGlow.userData.noOutline = true;
                    sponsonGroup.add(jetCowling, jetNozzle, jetGlow);

                    // High-Pressure Yellow Deck Deluge Cannon
                    const cannonBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.4, 10), matGold);
                    cannonBase.position.set(0, 0.65, 1.5);
                    const cannonPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.8, 8).rotateX(Math.PI / 2), matGold);
                    cannonPipe.position.set(0, 0.95, 2.1);
                    const cannonNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.45, 8).rotateX(Math.PI / 2), matChrome);
                    cannonNozzle.position.set(0, 0.95, 3.1);
                    cannonNozzle.userData.noOutline = true;
                    sponsonGroup.add(cannonBase, cannonPipe, cannonNozzle);

                    // Nozzle world anchor for twin aimed deluge water streams!
                    const nozzleTip = new THREE.Object3D();
                    nozzleTip.position.set(0, 0.95, 3.4);
                    sponsonGroup.add(nozzleTip);
                    if (idx === 0) parts.leftBoatNozzle = nozzleTip;
                    else parts.rightBoatNozzle = nozzleTip;

                    boatGroup.add(sponsonGroup);
                });

                // 2. Central Bridging Bridge Deck & Forward Hull Center
                const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.42, 4.8), matRed);
                bridgeDeck.position.set(0, 0.95, 0.2);
                bridgeDeck.castShadow = true;
                boatGroup.add(bridgeDeck);

                // Lower Forward Bumper / Wave Deflector Plate
                const fwdPlate = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.48, 0.8), matChrome);
                fwdPlate.position.set(0, 0.65, 2.65);
                boatGroup.add(fwdPlate);

                // Front Catamaran Trim Lip
                const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), matCyanTrim);
                frontTrim.position.set(0, 1.05, 2.65);
                frontTrim.userData.noOutline = true;
                boatGroup.add(frontTrim);

                // 3. Central Cockpit Wraparound Canopy (Tinted Cyan Glass)
                const boatCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.85, 2.4), matCabGlass);
                boatCanopy.position.set(0, 1.58, 0.5);
                boatCanopy.userData.noOutline = true;
                boatGroup.add(boatCanopy);

                // Canopy Roof Cap
                const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.22, 2.2), matRed);
                canopyRoof.position.set(0, 2.05, 0.45);
                canopyRoof.castShadow = true;
                boatGroup.add(canopyRoof);

                // Gold Rescue Bots Fire Crest on Brow above windshield
                const boatCrest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.16), matEmblem);
                boatCrest.position.set(0, 1.95, 1.62);
                boatCrest.rotation.x = -0.22;
                boatCrest.userData.noOutline = true;
                boatGroup.add(boatCrest);

                // 4. Two Yellow & White Life Ring Buoys on the Foredeck
                [-0.68, 0.68].forEach(lx => {
                    const lifeBuoyGroup = new THREE.Group();
                    lifeBuoyGroup.position.set(lx, 1.22, 1.85);
                    lifeBuoyGroup.rotation.x = -Math.PI / 2;

                    // Main Life Ring Torus (Yellow Base)
                    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 8, 16), matGold);
                    ringMesh.castShadow = true;
                    lifeBuoyGroup.add(ringMesh);

                    // 4 White Safety Straps across the ring
                    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(ang => {
                        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.12), matWhite);
                        strap.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, 0);
                        strap.rotation.z = ang;
                        strap.userData.noOutline = true;
                        lifeBuoyGroup.add(strap);
                    });

                    boatGroup.add(lifeBuoyGroup);
                });

                // 5. Rear Gantry Arch / Spoiler with Dual Emergency Beacons
                const gantryArch = new THREE.Group();
                gantryArch.position.set(0, 1.25, -1.8);

                // Vertical Support Pylons
                [-1.85, 1.85].forEach(px => {
                    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.35, 0.28), matDarkSteel);
                    pylon.position.set(px, 0.65, 0);
                    gantryArch.add(pylon);
                });

                // Transverse Aerodynamic Spoiler Bar
                const gantryBar = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.22, 0.55), matDarkSteel);
                gantryBar.position.set(0, 1.35, 0);
                gantryBar.castShadow = true;
                gantryArch.add(gantryBar);

                // Dual Emergency Strobes: Red on Port (Left), Cyan/Blue on Starboard (Right)
                const strobeRed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 0.35), matSirenRed);
                strobeRed.position.set(-1.15, 1.55, 0);
                strobeRed.userData.noOutline = true;

                const strobeBlue = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 0.35), matSirenBlue);
                strobeBlue.position.set(1.15, 1.55, 0);
                strobeBlue.userData.noOutline = true;

                gantryArch.add(strobeRed, strobeBlue);
                boatGroup.add(gantryArch);

                // Initialize visibility matching current docked status
                const isCurrentMega = Boolean(typeof window !== 'undefined' && (window as any).progression && (window as any).progression.heatwaveDocked);
                if (typeof (window as any).setBotRigMega === 'function') {
                    (window as any).setBotRigMega(parts, isCurrentMega);
                }
}

export default buildHeatwave;

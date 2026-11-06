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
}

export default buildHeatwave;

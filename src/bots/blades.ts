// 3D Cel-Shaded Model & Morph Builder for BLADES
import * as THREE from 'three';
import { texFaceBlades } from '../rendering/textures.js';

export function buildBlades(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show & Playskool Heroes Blades: Crisp White, Vivid Rescue Orange (#ff6414) & Bright Cyan Cockpit
                const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });
                const matOrange = new THREE.MeshToonMaterial({ color: 0xff6414, gradientMap: toonGrad4 });
                const matFace = new THREE.MeshBasicMaterial({ map: texFaceBlades });

                // 1. Torso: Clean Robotic Chest Plate in Bot mode (In Helicopter mode, pitches +90° so the Split Collar Cockpit expands around his Head as the Nose!)
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.34, 2.26, 2.08), matWhite);
                chest.castShadow = true;
                parts.torso.add(chest);

                const orangeStripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.82, 2.12), matOrange);
                orangeStripe.position.set(0, 0.32, 0);
                parts.torso.add(orangeStripe);

                const chestCollar = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.42, 2.16), matChrome);
                chestCollar.position.set(0, 0.92, 0);
                parts.torso.add(chestCollar);

                // Rescue Bots Badge centered cleanly on Blades' Chest
                const badge = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.84, 0.22), matEmblem);
                badge.position.set(0, 0.28, 1.06);
                badge.userData.noOutline = true;
                parts.torso.add(badge);

                // Lower Abdominal Vent Grille & Rescue Winch Hook (Sits on lower torso -> Becomes Underside Belly Winch in Helicopter Mode!)
                const bellyGrille = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.68, 0.2), matGrille);
                bellyGrille.position.set(0, -0.58, 1.06);
                bellyGrille.userData.noOutline = true;
                parts.torso.add(bellyGrille);

                const winchHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.56, 10).rotateZ(Math.PI / 2), matChrome);
                winchHousing.position.set(0, -0.15, 1.18);
                parts.torso.add(winchHousing);

                const winchHook = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 12, Math.PI * 1.4), matVisorGold);
                winchHook.position.set(0, -0.15, 1.42);
                parts.torso.add(winchHook);

                // Twin Overhead Turbine Intakes on Upper Back Collar (Sit on top of Helicopter Cabin in Vehicle Mode!)
                [-0.68, 0.68].forEach(tx => {
                    const intakeHousing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.92, 0.62), matOrange);
                    intakeHousing.position.set(tx, 0.86, -0.76);
                    intakeHousing.castShadow = true;
                    parts.torso.add(intakeHousing);

                    const intakeVent = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.96, 10), matTire);
                    intakeVent.position.set(tx, 0.88, -0.76);
                    parts.torso.add(intakeVent);
                });

                // Retractable/Expandable Clamshell Helicopter Cockpit Shells around Blades' Head!
                // (In Bot mode: retracted open to the sides of his collar framing his head; in Helicopter mode: expand & close together around his head to form the Nose & Bubble Canopy!)
                [-1, 1].forEach(side => {
                    const shellG = side === -1 ? parts.leftCockpitShell : parts.rightCockpitShell;
                    shellG.position.set(side * 1.02, 1.25, 0.05);
                    parts.torso.add(shellG);

                    // Orange Nose Fuselage Half
                    const noseHalf = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1.68, 1.88), matOrange);
                    noseHalf.position.set(-side * 0.12, 0.42, 0.06);
                    noseHalf.castShadow = true;
                    shellG.add(noseHalf);

                    // Cyan Bubble Windshield Canopy Half
                    const canopyHalf = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.32, 1.34), matCabGlass);
                    canopyHalf.position.set(-side * 0.10, 0.36, -0.28);
                    canopyHalf.rotation.x = -0.18;
                    canopyHalf.userData.noOutline = true;
                    shellG.add(canopyHalf);

                    // White Aerodynamic Nose Tip Half
                    const noseConeHalf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.72, 1.38), matWhite);
                    noseConeHalf.position.set(-side * 0.10, 1.32, 0.22);
                    noseConeHalf.castShadow = true;
                    shellG.add(noseConeHalf);

                    // Nose Searchlight Lens on Front Tip
                    const noseLight = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.32), matVisorGold);
                    noseLight.position.set(side * 0.08, 1.68, 0.48);
                    noseLight.userData.noOutline = true;
                    shellG.add(noseLight);
                });

                // 2. Flight Helmet Head with Twin Orange Ear-Fins, Aviator Visor & Headset Pods (Matching Cartoon)
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.26, 1.20, 1.26), matWhite);
                helm.castShadow = true;
                parts.head.add(helm);

                // Signature Pointed Orange Flight Ear-Fins (Angled Upward & Outward Matching Cartoon)
                [-0.62, 0.62].forEach(fx => {
                    const earFin = new THREE.Mesh(
                        new THREE.ConeGeometry(0.20, 0.88, 4),
                        matOrange
                    );
                    earFin.position.set(fx, 0.76, 0.06);
                    earFin.rotation.z = fx > 0 ? -0.28 : 0.28;
                    earFin.rotation.y = Math.PI / 4;
                    parts.head.add(earFin);
                });

                // Central White Flight Helmet Crest
                const flightCrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.95), matWhite);
                flightCrest.position.set(0, 0.68, 0.05);
                parts.head.add(flightCrest);

                // Orange Brow Trim
                const browTrim = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.16, 0.42), matOrange);
                browTrim.position.set(0, 0.42, 0.50);
                parts.head.add(browTrim);

                // Cylindrical Aviator Headset Ear Cushions
                [-0.66, 0.66].forEach(ex => {
                    const headsetPod = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.26, 0.26, 0.20, 12).rotateZ(Math.PI / 2),
                        matOrange
                    );
                    headsetPod.position.set(ex, 0.04, 0.04);
                    parts.head.add(headsetPod);

                    const headsetInner = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.16, 0.16, 0.24, 12).rotateZ(Math.PI / 2),
                        matWhite
                    );
                    headsetInner.position.set(ex, 0.04, 0.04);
                    parts.head.add(headsetInner);
                });

                // Expressive Cartoon Face Mesh (With Neon Cyan-Green Visor)
                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.92, 1.32), matFace);
                faceMesh.position.set(0, -0.02, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // 3. Spinning 4-Blade Main Rotor Assembly (Folds flat against his back in Bot mode -> Hinges upright on top in Helicopter mode!)
                const rotorMast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.2, 10), matChrome);
                rotorMast.position.set(0, 0.9, 0);
                parts.backAttachment.add(rotorMast);

                const rotorHub = new THREE.Group();
                rotorHub.position.set(0, 1.5, 0);
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.32, 12), matTire);
                rotorHub.add(cap);
                for (let b = 0; b < 4; b++) {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.1, 0.45), matTire);
                    blade.rotation.y = (b * Math.PI) / 2;
                    rotorHub.add(blade);
                    const tip = new THREE.Mesh(new THREE.BoxGeometry(9.85, 0.11, 0.16), matVisorGold);
                    tip.rotation.y = (b * Math.PI) / 2;
                    tip.userData.noOutline = true;
                    rotorHub.add(tip);
                }
                parts.backAttachment.add(rotorHub);
                parts.rotors = rotorHub;

                // 4. Arms with Side Sponsons/Pontoons & Exhaust Turbines (Fold up & tuck along Fuselage sides in Helicopter mode!)
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.24, 1.32), matOrange);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.75, 10).rotateX(Math.PI / 2), matChrome);
                    turbine.position.set(side * 0.48, 0.22, -0.08);
                    armG.add(turbine);

                    // Sculpted White & Orange Side Pontoon / Sponson Fairing on Outer Forearm
                    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.44, 1.16), matWhite);
                    forearm.position.set(0, -1.28, 0.08);
                    forearm.castShadow = true;
                    armG.add(forearm);

                    const pontoonPod = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.68, 0.88), matOrange);
                    pontoonPod.position.set(side * 0.48, -1.18, 0.12);
                    pontoonPod.castShadow = true;
                    armG.add(pontoonPod);
                });

                // 5. Legs: Split Helicopter Tail Boom, Vertical Fin, Tail Rotor & Sliding Landing Skids!
                // (In Bot mode: split down the middle as two legs; in Helicopter mode: fold back +90° & zip together into a unified Tail Boom!)
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;
                    const skidMount = side === -1 ? parts.leftSkidMount : parts.rightSkidMount;

                    // Upper Leg / Forward Tail Boom Half (Offset slightly inward so left & right halves fuse seamlessly in Helicopter mode!)
                    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.52, 1.18), matWhite);
                    thigh.position.set(-side * 0.16, -0.52, 0);
                    thigh.castShadow = true;
                    legG.add(thigh);

                    // Lower Leg / Tapered Rear Tail Boom Half
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.88, 1.02), matOrange);
                    shin.position.set(-side * 0.22, -1.62, 0.04);
                    shin.castShadow = true;
                    legG.add(shin);

                    const tailStripe = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 1.06), matWhite);
                    tailStripe.position.set(-side * 0.22, -1.45, 0.04);
                    legG.add(tailStripe);

                    // Rear Stabilizer Boot & Split Vertical Tail Fin (Stands upright when legs rotate +90° backward!)
                    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 1.38), matWhite);
                    boot.position.set(-side * 0.24, -2.52, -0.18);
                    boot.castShadow = true;
                    legG.add(boot);

                    const verticalFinHalf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.78, 1.46), matOrange);
                    verticalFinHalf.position.set(-side * 0.42, -2.68, -0.48);
                    verticalFinHalf.rotation.x = 0.26;
                    verticalFinHalf.castShadow = true;
                    legG.add(verticalFinHalf);

                    // Horizontal Tail Stabilizer Winglet on each Ankle
                    const horizStabilizer = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.36, 0.16), matWhite);
                    horizStabilizer.position.set(side * 0.22, -2.35, -0.12);
                    legG.add(horizStabilizer);

                    // Helicopter Landing Skids on Sliding Mount (Shifts forward & downward under the Fuselage in Helicopter mode!)
                    skidMount.position.set(side * 0.56, -1.55, 0.25);
                    legG.add(skidMount);

                    const skidTube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.6, 8), matChrome);
                    skidMount.add(skidTube);

                    [-0.95, 0.95].forEach(sy => {
                        const skidStrut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.72), matChrome);
                        skidStrut.position.set(-side * 0.18, sy, -0.32);
                        skidMount.add(skidStrut);
                    });

                    // Spinning 4-Blade Tail Rotor on the Rear Fin Tip
                    if (side === 1) {
                        const tailRotorGroup = new THREE.Group();
                        tailRotorGroup.position.set(0.05, -2.75, -0.72);
                        const trHub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.24, 8).rotateZ(Math.PI / 2), matChrome);
                        tailRotorGroup.add(trHub);
                        const trBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.75, 0.24), matTire);
                        const trBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 1.75), matTire);
                        tailRotorGroup.add(trBlade1, trBlade2);
                        legG.add(tailRotorGroup);
                        parts.tailRotor = tailRotorGroup;
                    }
                });

                // DINOBOT MODE: BLADES PTEROSAUR (Crested Pteranodon Head, Long Beak & Articulated Flapping Wings)
                const pteroBack = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.95, 2.75), matOrange);
                pteroBack.position.set(0, 2.45, 0.05);
                pteroBack.castShadow = true;
                parts.dinoGroup.add(pteroBack);

                // Pterosaur Crested Head & Pointed Beak
                const pteroSkull = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.05, 1.58), matWhite);
                pteroSkull.position.set(0, 0.15, 0.55);
                pteroSkull.castShadow = true;
                parts.dinoHead.add(pteroSkull);

                const pteroEyes = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.55), matVisorCyan);
                pteroEyes.position.set(0, 0.32, 0.78);
                pteroEyes.userData.noOutline = true;
                parts.dinoHead.add(pteroEyes);

                // Backward-Swept Pteranodon Cranial Crest
                const pteroCrest = new THREE.Mesh(
                    new THREE.ConeGeometry(0.45, 2.35, 4).rotateX(-Math.PI * 0.42).rotateZ(Math.PI / 4),
                    matOrange
                );
                pteroCrest.position.set(0, 0.72, -0.78);
                pteroCrest.castShadow = true;
                parts.dinoHead.add(pteroCrest);

                // Long Aerodynamic Pterosaur Beak
                const pteroUpperBeak = new THREE.Mesh(
                    new THREE.ConeGeometry(0.56, 2.55, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4),
                    matOrange
                );
                pteroUpperBeak.position.set(0, 0.08, 2.35);
                pteroUpperBeak.castShadow = true;
                parts.dinoHead.add(pteroUpperBeak);

                const pteroLowerJaw = new THREE.Mesh(
                    new THREE.ConeGeometry(0.38, 1.95, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4),
                    matVisorGold
                );
                pteroLowerJaw.position.set(0, -0.22, 2.05);
                parts.dinoHead.add(pteroLowerJaw);

                // Articulated Left & Right Pterosaur Wings (11-unit total wingspan)
                [-1, 1].forEach(side => {
                    const wingG = side === -1 ? parts.dinoLeftWing : parts.dinoRightWing;
                    const spar = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.24, 0.46), matOrange);
                    spar.position.set(side * 2.6, 0, 0.45);
                    spar.castShadow = true;
                    wingG.add(spar);

                    const membrane = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 2.25), matWhite);
                    membrane.position.set(side * 2.5, -0.04, -0.55);
                    membrane.castShadow = true;
                    wingG.add(membrane);

                    const wingTip = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.16, 2.3), matOrange);
                    wingTip.position.set(side * 4.45, 0, -0.55);
                    wingG.add(wingTip);

                    const wingClaw = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 6).rotateX(Math.PI / 2), matChrome);
                    wingClaw.position.set(side * 2.6, 0.1, 0.85);
                    wingG.add(wingClaw);
                });

                // Pterosaur Rudder Tail Vane
                const pteroTailShaft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 1.85), matWhite);
                pteroTailShaft.position.set(0, 0, -0.85);
                parts.dinoTail.add(pteroTailShaft);

                const pteroTailVane = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 1.25), matOrange);
                pteroTailVane.position.set(0, 0, -1.95);
                parts.dinoTail.add(pteroTailVane);

                // =============================================================
                // MEGA BOT: BLADES TANDEM SKY-CRANE & CARGO POD CONVERSION
                // =============================================================
                // 1. Vehicle Mode: Heavy Sky-Crane Fuselage Extension & Underslung Cargo Pod
                const megaCargoPod = new THREE.Group();
                megaCargoPod.userData.isMegaPart = true;
                megaCargoPod.visible = false;
                parts.megaCargoPod = megaCargoPod;
                parts.backAttachment.add(megaCargoPod);

                // Main Sky-Crane Fuselage Spine
                const spineBoom = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 6.2), matOrange);
                spineBoom.position.set(0, 0.8, -3.2);
                spineBoom.castShadow = true;
                megaCargoPod.add(spineBoom);

                // Underslung Evac Rescue Cargo Container Pod
                const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 4.6), matWhite);
                cargoBox.position.set(0, -0.6, -3.0);
                cargoBox.castShadow = true;
                const evacStripe = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.45, 4.4), matOrange);
                evacStripe.position.set(0, -0.6, -3.0);
                megaCargoPod.add(cargoBox, evacStripe);

                // Forward Tandem Rotor Pylon & Counter-rotating Rotor
                const forwardPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.4, 10), matWhite);
                forwardPylon.position.set(0, 1.9, -0.8);
                const rotorHub2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), matChrome);
                rotorHub2.position.set(0, 2.6, -0.8);
                [-1, 1].forEach(side => {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 4.8), matDarkSteel);
                    blade.position.set(0, 2.6, -0.8 + side * 2.2);
                    megaCargoPod.add(blade);
                });
                megaCargoPod.add(forwardPylon, rotorHub2);

                // 2. Bot Mode: High-Altitude Turbine Evac Pack
                const megaBackPack = new THREE.Group();
                megaBackPack.userData.isMegaPart = true;
                megaBackPack.visible = false;
                parts.megaBackPack = megaBackPack;
                parts.backAttachment.add(megaBackPack);

                const bpUnit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 1.2), matOrange);
                bpUnit.position.set(0, 0.2, 0.2);
                bpUnit.castShadow = true;
                megaBackPack.add(bpUnit);

                // 3. Dino Mode: Pterosaur Titan Wing Turbines & Flight Harness
                const megaDinoArmor = new THREE.Group();
                megaDinoArmor.userData.isMegaPart = true;
                megaDinoArmor.visible = false;
                parts.megaDinoArmor = megaDinoArmor;
                parts.dinoGroup.add(megaDinoArmor);

                [-1.8, 1.8].forEach(tx => {
                    const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 12).rotateX(Math.PI / 2), matOrange);
                    turbine.position.set(tx, 2.8, -0.2);
                    megaDinoArmor.add(turbine);
                });

                // Initialize visibility matching current docked status
                const isCurrentMega = Boolean(typeof window !== 'undefined' && (window as any).progression && (window as any).progression.bladesDocked);
                if (typeof (window as any).setBotRigMega === 'function') {
                    (window as any).setBotRigMega(parts, isCurrentMega);
                }
}

export default buildBlades;

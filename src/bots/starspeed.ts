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
    const matFanBlade = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad3 });

    // Outer tire ring (torus so the interior stays open for VTOL turbine fan blades!)
    const tire = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.84, radius * 0.2, 10, 20).rotateY(Math.PI / 2),
        matTire
    );
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.64, radius * 0.08, 8, 18).rotateY(Math.PI / 2),
        matRim
    );
    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, width + 0.08, 10).rotateZ(Math.PI / 2),
        matHub
    );
    wg.add(tire, rim, hub);

    // 8 Angled Turbine Spokes / VTOL Downward-Lift Fan Blades inside the wheel rim
    for (let b = 0; b < 8; b++) {
        const a = (b / 8) * Math.PI * 2;
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.56, radius * 0.48, 0.14),
            matFanBlade
        );
        blade.position.set(0, Math.cos(a) * (radius * 0.42), Math.sin(a) * (radius * 0.42));
        blade.rotation.x = a;
        blade.rotation.y = 0.36; // Pitched aerofoil angle for downward VTOL thrust!
        wg.add(blade);
    }

    // Knobby motocross tread lugs around circumference
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const lug = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.14, 0.16), matTire);
        lug.position.set(0, Math.cos(a) * (radius + 0.02), Math.sin(a) * (radius + 0.02));
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
        forearmG.add(gauntlet, cuff);

        const handG = side === -1 ? parts.leftHand : parts.rightHand;
        handG.position.set(0, -0.94, 0.04);
        forearmG.add(handG);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), matDarkSteel);
        hand.position.set(0, -0.20, 0);
        handG.add(hand);
    });

    // 4. Legs: Tall Agile Shins, Articulated Knees & Ankles, & Motocross Boots
    [-1, 1].forEach(side => {
        const legG = side === -1 ? parts.leftLeg : parts.rightLeg;
        const lowerLegG = side === -1 ? parts.leftLowerLeg : parts.rightLowerLeg;
        const footG = side === -1 ? parts.leftFoot : parts.rightFoot;

        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 10), matDarkSteel);
        thigh.position.set(-side * 0.04, -0.48, 0);
        legG.add(thigh);

        lowerLegG.position.set(0, -0.95, 0);
        legG.add(lowerLegG);

        const shin = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.25, 1.38), matTeal);
        shin.position.set(-side * 0.06, -0.77, 0.04);
        shin.castShadow = true;
        const kneeGuard = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.34), matGold);
        kneeGuard.position.set(-side * 0.06, 0, 0.72);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 1.45), matCoral);
        stripe.position.set(-side * 0.06, -1.30, 0.04);
        lowerLegG.add(shin, kneeGuard, stripe);

        footG.position.set(0, -1.66, 0);
        lowerLegG.add(footG);

        const boot = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.48, 1.75), matWhite);
        boot.position.set(-side * 0.06, -0.24, 0.28);
        footG.add(boot);
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

    // Front & Rear Knobby Motocross Wheels (Mounted on articulated pivots so they rotate out into VTOL Wing Lift Fans!)
    const frontWheelPivot = new THREE.Group();
    frontWheelPivot.position.set(0, -0.58, 2.02);
    frontWheelPivot.visible = false;
    const frontWheel = createKnobbyBikeWheel(0.95, 0.42);
    frontWheelPivot.add(frontWheel);

    const rearWheelPivot = new THREE.Group();
    rearWheelPivot.position.set(0, -0.58, -1.78);
    rearWheelPivot.visible = false;
    const rearWheel = createKnobbyBikeWheel(0.95, 0.48);
    rearWheelPivot.add(rearWheel);

    parts.chassis.add(frontWheelPivot, rearWheelPivot);
    parts.starspeedFrontWheelPivot = frontWheelPivot;
    parts.starspeedRearWheelPivot = rearWheelPivot;
    parts.wheels.push(frontWheel, rearWheel);

    bikeShell.add(
        engineBlock, frameSpine, fuelTank, seat, tailFender,
        frontFender, numberPlate, headlight, handlebar
    );

    // 5B. HIDDEN VEHICLE MODE: VTOL HOVER FIGHTER JET (Quinjet-inspired Stealth Delta with Wing Lift-Fan Bays!)
    const jetShell = new THREE.Group();
    jetShell.visible = false;
    parts.hiddenVehicleShell = jetShell;
    parts.chassis.add(jetShell);

    const matStealthDark = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matCanopyGlass = new THREE.MeshToonMaterial({ color: 0x0f172a, emissive: 0x0284c7, emissiveIntensity: 0.35, gradientMap: toonGrad3 });
    const matCanopyGlint = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const matAfterburner = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matThrustRing = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.78, side: THREE.DoubleSide });

    // Central Chined Stealth Fuselage Deck
    const mainFuselage = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.88, 3.65), matTeal);
    mainFuselage.position.set(0, 0.42, -0.35);
    const dorsalSpine = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.34, 3.15), matDeepTeal);
    dorsalSpine.position.set(0, 0.92, -0.55);
    const bellyArmor = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.35, 3.45), matStealthDark);
    bellyArmor.position.set(0, -0.05, -0.25);

    // Subtle White Dorsal Rescue Stripe & Hatch Markings (homage to reference silhouette)
    const dorsalHatchStripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.56), matWhite);
    dorsalHatchStripe.position.set(0, 1.11, 0.15);
    dorsalHatchStripe.userData.noOutline = true;

    // Forward Pointed Nose Cone + Pitot Sensor Probe
    const noseMid = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.76, 1.65), matTeal);
    noseMid.position.set(0, 0.34, 1.85);
    const noseTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.74, 1.85, 6).rotateY(Math.PI / 6).rotateX(Math.PI / 2),
        matDeepTeal
    );
    noseTip.scale.set(1.0, 0.58, 1.0);
    noseTip.position.set(0, 0.24, 3.25);
    const pitotProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.65, 6).rotateX(Math.PI / 2), matChrome);
    pitotProbe.position.set(0, 0.22, 4.35);

    // Tandem Glazed Fighter Cockpit (Forward Bubble Canopy + Raised Upper Skylight Glass with Dark Armored Frame)
    const lowerCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.56, 1.38).rotateX(0.24), matCanopyGlass);
    lowerCanopy.position.set(0, 0.74, 2.15);
    const lowerGlint = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.14, 0.42).rotateX(0.24), matCanopyGlint);
    lowerGlint.position.set(0, 0.94, 2.32);
    lowerGlint.userData.noOutline = true;
    const canopyDivider = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.18, 0.24), matStealthDark);
    canopyDivider.position.set(0, 0.92, 1.56);
    const upperSkylight = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.44, 1.12).rotateX(0.1), matCanopyGlass);
    upperSkylight.position.set(0, 0.98, 1.04);
    const upperGlint = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.12, 0.34).rotateX(0.1), matCanopyGlint);
    upperGlint.position.set(0, 1.16, 1.16);
    upperGlint.userData.noOutline = true;
    const noseAccent = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 1.15), matCoral);
    noseAccent.position.set(0, 0.56, 2.92);

    jetShell.add(
        mainFuselage, dorsalSpine, bellyArmor, dorsalHatchStripe,
        noseMid, noseTip, pitotProbe,
        lowerCanopy, lowerGlint, canopyDivider, upperSkylight, upperGlint, noseAccent
    );

    // Swept Delta Wings Framing Two Open Circular VTOL Lift-Fan Bays + Angled Wingtip Winglets
    const jetThrustRings: THREE.Mesh[] = [];
    const jetFlames: THREE.Mesh[] = [];

    [-1, 1].forEach(side => {
        // Backward-Swept Delta Leading-Edge Wing Strake (from cockpit cheek out to angled wingtip!)
        const leadStrake = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.28, 0.78), matTeal);
        leadStrake.position.set(side * 2.12, 0.36, 0.62);
        leadStrake.rotation.y = side * 0.46;
        jetShell.add(leadStrake);

        const leadTrim = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.14, 0.18), matCoral);
        leadTrim.position.set(side * 2.18, 0.42, 0.96);
        leadTrim.rotation.y = side * 0.46;
        jetShell.add(leadTrim);

        // Rear Swept Trailing-Edge Wing Spar
        const rearSpar = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.26, 0.62), matDeepTeal);
        rearSpar.position.set(side * 2.15, 0.36, -1.08);
        rearSpar.rotation.y = side * -0.18;
        jetShell.add(rearSpar);

        // Outer Wing Bridge Connecting Leading Strake & Rear Spar
        const outerBridge = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 1.75), matWhite);
        outerBridge.position.set(side * 3.22, 0.36, -0.32);
        jetShell.add(outerBridge);

        // Circular Open VTOL Fan Shroud Ring (Wheels rotate horizontally right inside this ring!)
        const fanShroud = new THREE.Mesh(
            new THREE.TorusGeometry(1.06, 0.15, 10, 24).rotateX(Math.PI / 2),
            matStealthDark
        );
        fanShroud.position.set(side * 2.05, 0.36, -0.18);
        jetShell.add(fanShroud);

        const fanGoldRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.12, 0.05, 8, 24).rotateX(Math.PI / 2),
            matGold
        );
        fanGoldRing.position.set(side * 2.05, 0.47, -0.18);
        fanGoldRing.userData.noOutline = true;
        jetShell.add(fanGoldRing);

        // Diagonal Aerodynamic Top Louver Strut across Fan Bay (iconic Quinjet wing detail)
        const topVane = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.1, 0.16), matWhite);
        topVane.position.set(side * 2.05, 0.58, -0.18);
        topVane.rotation.y = side * -0.35;
        jetShell.add(topVane);

        // Glowing Cyan VTOL Downward-Thrust Ring Underneath Fan Bay
        const thrustRing = new THREE.Mesh(
            new THREE.RingGeometry(0.45, 0.96, 20).rotateX(Math.PI / 2),
            matThrustRing
        );
        thrustRing.position.set(side * 2.05, 0.02, -0.18);
        thrustRing.userData.noOutline = true;
        jetShell.add(thrustRing);
        jetThrustRings.push(thrustRing);

        // Cantilevered Angled Wingtip Endplate Winglet
        const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 2.05), matCoral);
        winglet.position.set(side * 3.58, 0.46, -0.45);
        winglet.rotation.z = side * -0.32;
        winglet.rotation.y = side * -0.14;
        const wingletStripe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 1.85), matWhite);
        wingletStripe.position.set(side * 3.58, 0.56, -0.45);
        wingletStripe.rotation.z = side * -0.32;
        wingletStripe.rotation.y = side * -0.14;
        jetShell.add(winglet, wingletStripe);

        // Twin Dorsal Jet Engine Nacelles + Intakes + Exhausts + Canted V-Tail Fins
        const intakeBox = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.62, 0.85), matStealthDark);
        intakeBox.position.set(side * 0.98, 0.82, -1.25);
        const intakeVoid = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.12), matDarkSteel);
        intakeVoid.position.set(side * 0.98, 0.82, -0.82);
        intakeVoid.userData.noOutline = true;

        const enginePod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.36, 0.44, 1.75, 12).rotateX(Math.PI / 2),
            matDeepTeal
        );
        enginePod.position.set(side * 0.98, 0.78, -2.18);

        const nozzleRing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.36, 0.38, 12).rotateX(Math.PI / 2),
            matChrome
        );
        nozzleRing.position.set(side * 0.98, 0.78, -3.12);

        const afterburner = new THREE.Mesh(
            new THREE.ConeGeometry(0.28, 1.25, 10).rotateX(-Math.PI / 2),
            matAfterburner
        );
        afterburner.position.set(side * 0.98, 0.78, -3.72);
        afterburner.userData.noOutline = true;
        jetFlames.push(afterburner);

        // Outward-Canted V-Tail Vertical Stabilizer Fin
        const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.38, 1.12), matTeal);
        vTail.position.set(side * 1.18, 1.48, -2.32);
        vTail.rotation.z = side * -0.34;
        vTail.rotation.x = -0.22;

        // Small Rear Horizontal Stabilizer
        const hTail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.75), matWhite);
        hTail.position.set(side * 1.62, 0.62, -2.62);
        hTail.rotation.y = side * 0.25;

        jetShell.add(intakeBox, intakeVoid, enginePod, nozzleRing, afterburner, vTail, hTail);
    });

    parts.starspeedJetThrustRings = jetThrustRings;
    parts.starspeedJetFlames = jetFlames;

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

    // Articulated Clawed Spinosaurus Forelimbs (Shoulder -> Elbow -> Wrist)
    [-1, 1].forEach(side => {
        const armG = side === -1 ? parts.dinoLeftArm : parts.dinoRightArm;
        const dForearm = side === -1 ? parts.dinoLeftForearm : parts.dinoRightForearm;
        const dHand = side === -1 ? parts.dinoLeftHand : parts.dinoRightHand;
        armG.position.set(side * 0.82, 1.85, 0.75);
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.56, 0.28).rotateX(0.38), matTeal);
        upper.position.set(0, -0.26, 0);
        armG.add(upper);

        dForearm.position.set(0, -0.48, 0.12);
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.24), matWhite);
        lower.position.set(0, -0.18, 0.08);
        dForearm.add(lower);

        dHand.position.set(0, -0.34, 0.14);
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 4).rotateX(Math.PI / 2), matGold);
        claw.position.set(0, -0.02, 0.12);
        dHand.add(claw);
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

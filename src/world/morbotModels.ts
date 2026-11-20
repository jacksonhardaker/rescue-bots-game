// Pure Zero-Side-Effect 3D Builders for Dr. Morocco's Blimp Airship, Escape Rocket & MorBots
import * as THREE from 'three';
import {
    matMorBotBlack, matMorBotCrimson, matMorBotDarkCrimson, matMorBotDarkSteel, matMorBotSilver,
    matMorBotRedGlow, matMorBotCore, matMoroccoPurple, matMoroccoPurpleGlow, matMoroccoPurpleDark,
    matMoroccoGold, matMorBotGoldGlow, matMorBotGoldDark, matMorBotCyanVisor,
    matBlimpGreen, matBlimpGondolaYellow, matBlimpGondolaWood, matBlimpWindowBlue, matBlimpCable,
    matMoroccoSkin, matTire, applyCartoonInkOutlines
} from '../rendering/materials.js';

export const MORBOT_FLEET_CONFIGS = [
    {
        name: 'MORBOT ALPHA',
        tag: 'SCOUT',
        theme: 'crimson',
        pursuitHp: 4,
        robotHp: 4,
        speed: 24.0,
        scale: 1.0,
        matMain: matMorBotBlack,
        matAccent: matMorBotCrimson,
        matDarkAccent: matMorBotDarkCrimson,
        matCore: matMorBotCore,
        matVisor: matMorBotRedGlow,
        accentColorHex: 0xdc2626
    },
    {
        name: 'MORBOT BETA',
        tag: 'SPEEDSTER',
        theme: 'purple',
        pursuitHp: 5,
        robotHp: 5,
        speed: 26.5,
        scale: 1.05,
        matMain: matMorBotBlack,
        matAccent: matMoroccoPurple,
        matDarkAccent: matMoroccoPurpleDark,
        matCore: matMoroccoPurpleGlow,
        matVisor: matMorBotCyanVisor,
        accentColorHex: 0xa855f7
    },
    {
        name: 'MORBOT GAMMA',
        tag: 'TITAN',
        theme: 'gold',
        pursuitHp: 6,
        robotHp: 6,
        speed: 23.0,
        scale: 1.18,
        matMain: matMorBotDarkSteel,
        matAccent: matMoroccoGold,
        matDarkAccent: matMorBotGoldDark,
        matCore: matMorBotGoldGlow,
        matVisor: matMorBotGoldGlow,
        accentColorHex: 0xf59e0b
    }
];

export function buildMorBotModel(cfg: Record<string, any> = {}) {
    const root = new THREE.Group();

    const mMain = cfg.matMain || matMorBotBlack;
    const mAccent = cfg.matAccent || matMorBotCrimson;
    const mDarkAccent = cfg.matDarkAccent || matMorBotDarkCrimson;
    const mCore = cfg.matCore || matMorBotCore;
    const mVisor = cfg.matVisor || matMorBotRedGlow;

    // 1. VEHICLE MODE: Sinister Matte Supercar Coupe
    const vGroup = new THREE.Group();
    root.add(vGroup);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 7.4), mMain);
    chassis.position.y = 1.0;
    chassis.castShadow = true;
    vGroup.add(chassis);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.22, 1.6), mAccent);
    splitter.position.set(0, 0.55, 3.7);
    vGroup.add(splitter);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.95, 3.6), matMorBotDarkSteel);
    cabin.position.set(0, 1.9, -0.4);
    vGroup.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.2), mVisor);
    windshield.position.set(0, 1.95, 1.42);
    vGroup.add(windshield);

    const hoodCoreHousing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.8), mDarkAccent);
    hoodCoreHousing.position.set(0, 1.6, 1.8);
    vGroup.add(hoodCoreHousing);

    const vCore = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), mCore);
    vCore.position.set(0, 1.68, 1.8);
    vGroup.add(vCore);

    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 0.9), mMain);
    wingBlade.position.set(0, 2.5, -3.3);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 1.1), mAccent);
    wingL.position.set(-1.85, 2.3, -3.3);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 1.1), mAccent);
    wingR.position.set(1.85, 2.3, -3.3);
    const wingStrutL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.2), matMorBotSilver);
    wingStrutL.position.set(-0.9, 1.85, -3.3);
    const wingStrutR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.2), matMorBotSilver);
    wingStrutR.position.set(0.9, 1.85, -3.3);
    vGroup.add(wingBlade, wingL, wingR, wingStrutL, wingStrutR);

    [-0.7, 0.7].forEach(tx => {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.8, 12).rotateX(Math.PI / 2), matMorBotDarkSteel);
        nozzle.position.set(tx, 1.1, -3.8);
        const flameGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.05, 0.6, 8).rotateX(Math.PI / 2), mVisor);
        flameGlow.position.set(tx, 1.1, -4.2);
        vGroup.add(nozzle, flameGlow);
    });

    const wheels: THREE.Group[] = [];
    [[-1.85, 2.1], [1.85, 2.1], [-1.85, -2.1], [1.85, -2.1]].forEach(([wx, wz]) => {
        const wG = new THREE.Group();
        wG.position.set(wx, 0.85, wz);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.65, 16).rotateZ(Math.PI / 2), matTire);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 12).rotateZ(Math.PI / 2), mAccent);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.74, 8).rotateZ(Math.PI / 2), mMain);
        wG.add(tire, rim, hub);
        vGroup.add(wG);
        wheels.push(wG);
    });

    // 2. ROBOT MODE: Imposing Robotic Villain with Verne Core & Claw Gauntlets
    const rGroup = new THREE.Group();
    root.add(rGroup);
    rGroup.visible = false;

    const rTorso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 2.2), mMain);
    rTorso.position.y = 5.2;
    rTorso.castShadow = true;
    rGroup.add(rTorso);

    const rChestPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.4), mAccent);
    rChestPlate.position.set(0, 5.6, 1.2);
    rGroup.add(rChestPlate);

    const rCore = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16).rotateX(Math.PI / 2), mCore);
    rCore.position.set(0, 5.5, 1.45);
    rGroup.add(rCore);

    const rHeadGroup = new THREE.Group();
    rHeadGroup.position.set(0, 7.6, 0.15);
    rGroup.add(rHeadGroup);

    const rHelmet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.5), mMain);
    const rCrest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 1.7), mAccent);
    rCrest.position.set(0, 0.9, 0);
    const rVisor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.35, 0.25), mVisor);
    rVisor.position.set(0, 0.05, 0.76);
    rHeadGroup.add(rHelmet, rCrest, rVisor);

    const leftArm = new THREE.Group();
    leftArm.position.set(-2.4, 6.2, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(2.4, 6.2, 0);
    rGroup.add(leftArm, rightArm);

    [leftArm, rightArm].forEach((armG, idx) => {
        const sSign = idx === 0 ? -1 : 1;
        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.8), mAccent);
        pauldron.position.set(sSign * 0.3, 0.2, 0);
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 4).rotateZ(sSign * -0.6), matMorBotSilver);
        spike.position.set(sSign * 1.1, 0.8, 0);

        const bicep = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 1.0), matMorBotDarkSteel);
        bicep.position.set(0, -1.2, 0);

        const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.0, 1.3), mMain);
        gauntlet.position.set(0, -2.8, 0.2);

        const claw1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.4), matMorBotSilver);
        claw1.position.set(-0.35, -4.0, 0.2);
        const claw2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.4), matMorBotSilver);
        claw2.position.set(0.35, -4.0, 0.2);
        const claw3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.2), matMorBotSilver);
        claw3.position.set(0, -4.0, -0.2);

        armG.add(pauldron, spike, bicep, gauntlet, claw1, claw2, claw3);
    });

    const hip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.8), matMorBotDarkSteel);
    hip.position.y = 3.2;
    rGroup.add(hip);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-1.1, 2.8, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(1.1, 2.8, 0);
    rGroup.add(leftLeg, rightLeg);

    [leftLeg, rightLeg].forEach(legG => {
        const thigh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 1.2), mMain);
        thigh.position.y = -0.9;

        const shin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.5), mAccent);
        shin.position.set(0, -2.6, 0.15);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.4), mMain);
        foot.position.set(0, -3.9, 0.5);

        const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.2, 10).rotateX(0.2), matMorBotSilver);
        thruster.position.set(0, -2.6, -0.8);

        legG.add(thigh, shin, foot, thruster);
    });

    if (cfg.scale && cfg.scale !== 1.0) {
        root.scale.setScalar(cfg.scale);
    }

    applyCartoonInkOutlines(root, 1.03, true);

    return {
        root,
        vGroup,
        rGroup,
        wheels,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        rHeadGroup,
        vCore,
        rCore,
        setMode(isRobot: boolean) {
            vGroup.visible = !isRobot;
            rGroup.visible = isRobot;
        }
    };
}

// DR. MOROCCO'S STEAMPUNK BLIMP AIRSHIP & BIRDCAGE ELEVATOR
export function buildMoroccoBlimpMesh() {
    const root = new THREE.Group();

    const blimpRoot = new THREE.Group();
    const envelopeG = new THREE.Group();
    envelopeG.position.set(0, 21.0, 0);

    const hullCenter = new THREE.Mesh(new THREE.SphereGeometry(9.0, 32, 24), matMoroccoPurple);
    hullCenter.scale.set(1.0, 1.0, 2.65);
    hullCenter.castShadow = true;
    envelopeG.add(hullCenter);

    const hullTop = new THREE.Mesh(
        new THREE.SphereGeometry(9.12, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.38),
        matBlimpGreen
    );
    hullTop.scale.set(1.0, 1.0, 2.65);
    hullTop.castShadow = true;
    envelopeG.add(hullTop);

    const hullBottom = new THREE.Mesh(
        new THREE.SphereGeometry(9.08, 32, 18, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38),
        matBlimpGreen
    );
    hullBottom.scale.set(1.0, 1.0, 2.65);
    hullBottom.castShadow = true;
    envelopeG.add(hullBottom);

    [3.5, -3.5].forEach(ty => {
        const band = new THREE.Mesh(
            new THREE.TorusGeometry(8.3, 0.22, 10, 36).rotateX(Math.PI / 2),
            matMoroccoGold
        );
        band.scale.set(1.0, 2.62, 1.0);
        band.position.y = ty;
        envelopeG.add(band);
    });

    [0, Math.PI / 4, Math.PI / 2, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75].forEach(ang => {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(8.95, 0.12, 8, 36), matMoroccoGold);
        rib.scale.set(1.0, 2.64, 1.0);
        rib.rotation.y = ang;
        envelopeG.add(rib);
    });

    const tailG = new THREE.Group();
    tailG.position.set(0, 0, -20.5);

    const finDefs = [
        { w: 0.45, h: 8.5, len: 10.0, dy: 7.2, dx: 0, isVert: true },
        { w: 0.45, h: 8.5, len: 10.0, dy: -7.2, dx: 0, isVert: true },
        { w: 8.5, h: 0.45, len: 10.0, dy: 0, dx: 7.2, isVert: false },
        { w: 8.5, h: 0.45, len: 10.0, dy: 0, dx: -7.2, isVert: false }
    ];

    finDefs.forEach(fd => {
        const finBlade = new THREE.Mesh(new THREE.BoxGeometry(fd.w, fd.h, fd.len), matMoroccoPurple);
        finBlade.position.set(fd.dx, fd.dy, 0);
        tailG.add(finBlade);

        const ladderBar = new THREE.Mesh(new THREE.BoxGeometry(fd.w + 0.15, fd.h + 0.2, 0.5), matMoroccoGold);
        ladderBar.position.set(fd.dx, fd.dy, -4.8);
        tailG.add(ladderBar);

        for (let r = -3.5; r <= 3.5; r += 1.8) {
            const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), matMoroccoGold);
            if (!fd.isVert) rung.rotation.z = Math.PI / 2;
            rung.position.set(fd.dx, fd.dy, r);
            tailG.add(rung);
        }
    });
    envelopeG.add(tailG);

    const blimpProps: THREE.Group[] = [];
    [-11.2, 11.2].forEach(posX => {
        const engineG = new THREE.Group();
        engineG.position.set(posX, -2.5, -3.0);

        const strut = new THREE.Mesh(
            new THREE.BoxGeometry(Math.abs(posX) * 0.45, 0.4, 6.5),
            matMoroccoGold
        );
        strut.position.x = posX > 0 ? -2.2 : 2.2;
        engineG.add(strut);

        const nacelle = new THREE.Mesh(
            new THREE.CylinderGeometry(1.65, 1.8, 8.0, 16).rotateX(Math.PI / 2),
            matMorBotGoldDark
        );
        nacelle.castShadow = true;
        const noseSpinner = new THREE.Mesh(
            new THREE.ConeGeometry(1.65, 2.5, 16).rotateX(-Math.PI / 2),
            matMoroccoGold
        );
        noseSpinner.position.z = 4.8;
        const exhaustFunnel = new THREE.Mesh(
            new THREE.CylinderGeometry(1.4, 1.7, 1.8, 16).rotateX(Math.PI / 2),
            matMorBotDarkSteel
        );
        exhaustFunnel.position.z = -4.5;
        engineG.add(nacelle, noseSpinner, exhaustFunnel);

        const propG = new THREE.Group();
        propG.position.z = -5.4;
        const propHub = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), matMoroccoGold);
        propG.add(propHub);
        [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(pAng => {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 0.08), matMoroccoGold);
            blade.position.set(Math.sin(pAng) * 1.6, Math.cos(pAng) * 1.6, 0);
            blade.rotation.z = -pAng + 0.35;
            propG.add(blade);
        });
        engineG.add(propG);
        blimpProps.push(propG);
        envelopeG.add(engineG);
    });

    const gondolaG = new THREE.Group();
    gondolaG.position.set(0, -9.5, 1.5);

    const bridgeUpper = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.8, 17.0), matBlimpGondolaWood);
    bridgeUpper.position.y = 1.9;
    bridgeUpper.castShadow = true;
    gondolaG.add(bridgeUpper);

    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.2, 0.4), matBlimpWindowBlue);
    frontWindow.position.set(0, 2.2, 8.52);
    const frontWindowRoofBrim = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.4, 1.2), matMoroccoGold);
    frontWindowRoofBrim.position.set(0, 3.7, 8.8);
    gondolaG.add(frontWindow, frontWindowRoofBrim);

    const fuselageLower = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.2, 15.5), matBlimpGondolaYellow);
    fuselageLower.position.y = -1.2;
    fuselageLower.castShadow = true;
    const bellyCurve = new THREE.Mesh(
        new THREE.CylinderGeometry(3.3, 3.3, 15.5, 16, 1, false, 0, Math.PI).rotateZ(-Math.PI / 2),
        matBlimpGondolaYellow
    );
    bellyCurve.position.y = -2.8;
    gondolaG.add(fuselageLower, bellyCurve);

    [-6.0, -3.0, 0, 3.0, 6.0].forEach(pz => {
        [-3.32, 3.32].forEach(px => {
            const porthole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7, 0.7, 0.12, 14).rotateZ(Math.PI / 2),
                matBlimpWindowBlue
            );
            porthole.position.set(px, -1.0, pz);
            const rim = new THREE.Mesh(
                new THREE.TorusGeometry(0.72, 0.08, 8, 14).rotateY(Math.PI / 2),
                matMoroccoGold
            );
            rim.position.set(px, -1.0, pz);
            gondolaG.add(porthole, rim);
        });
    });

    [-4.0, 2.0].forEach(cz => {
        const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.8, 10), matMoroccoGold);
        chimney.position.set(2.4, 4.3, cz);
        gondolaG.add(chimney);
    });

    [-3.6, 3.6].forEach(lx => {
        const skid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 17.5), matMoroccoGold);
        skid.position.set(lx, -10.8, 0);
        skid.castShadow = true;
        gondolaG.add(skid);

        [-5.5, 0, 5.5].forEach(lz => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 8.5, 8), matMoroccoGold);
            leg.position.set(lx, -6.6, lz);
            leg.rotation.z = lx > 0 ? 0.08 : -0.08;
            gondolaG.add(leg);
        });
    });

    envelopeG.add(gondolaG);
    blimpRoot.add(envelopeG);
    root.add(blimpRoot);

    const winchG = new THREE.Group();
    winchG.position.set(0, 11.5, 5.0);

    const winchHousing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 3.2), matBlimpGondolaWood);
    winchHousing.position.y = -0.9;
    winchG.add(winchHousing);

    const hoistCable = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.8, 8), matBlimpCable);
    hoistCable.position.y = -4.8;
    winchG.add(hoistCable);

    const cageG = new THREE.Group();
    cageG.position.set(0, -9.0, 0);

    const cageBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.5, 24), matMoroccoGold);
    cageBase.position.y = 0.25;
    cageBase.castShadow = true;

    const cageRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.4, 0.45, 24), matMoroccoGold);
    cageRoof.position.y = 3.6;
    const roofDome = new THREE.Mesh(
        new THREE.SphereGeometry(2.4, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.3),
        matMoroccoGold
    );
    roofDome.position.y = 3.8;
    const topEyelet = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 16), matMoroccoGold);
    topEyelet.position.y = 4.7;

    cageG.add(cageBase, cageRoof, roofDome, topEyelet);

    const numBars = 16;
    for (let i = 0; i < numBars; i++) {
        const ang = (i / numBars) * Math.PI * 2;
        if (ang > Math.PI * 0.38 && ang < Math.PI * 0.62) continue;
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), matMoroccoGold);
        bar.position.set(Math.cos(ang) * 2.3, 1.9, Math.sin(ang) * 2.3);
        cageG.add(bar);
    }

    const cageRail = new THREE.Mesh(
        new THREE.TorusGeometry(2.15, 0.08, 8, 24).rotateX(Math.PI / 2),
        matMoroccoGold
    );
    cageRail.position.y = 1.45;
    cageG.add(cageRail);

    const moroccoG = new THREE.Group();
    moroccoG.position.set(0, 0.5, 0.2);
    moroccoG.rotation.y = Math.PI;

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.35), matMorBotDarkSteel);
    legL.position.set(-0.25, 0.42, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.35), matMorBotDarkSteel);
    legR.position.set(0.25, 0.42, 0);
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.5), matMorBotBlack);
    bootL.position.set(-0.25, 0.12, 0.08);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.5), matMorBotBlack);
    bootR.position.set(0.25, 0.12, 0.08);
    moroccoG.add(legL, legR, bootL, bootR);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.55), matMoroccoPurpleDark);
    torso.position.y = 1.35;
    const coatTails = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.75, 0.3), matMoroccoPurple);
    coatTails.position.set(0, 0.85, -0.22);
    moroccoG.add(torso, coatTails);

    const shirtCollar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.15), matMorBotSilver);
    shirtCollar.position.set(0, 1.65, 0.25);
    const ascotTie = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.12), matMoroccoPurple);
    ascotTie.position.set(0, 1.45, 0.28);
    const verneCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), matMorBotCore);
    verneCore.position.set(0, 1.32, 0.32);
    moroccoG.add(shirtCollar, ascotTie, verneCore);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), matMoroccoPurpleDark);
    armL.position.set(-0.55, 1.35, 0.2);
    armL.rotation.x = -0.4;
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), matMoroccoPurpleDark);
    armR.position.set(0.55, 1.45, 0.15);
    armR.rotation.x = -0.7;
    armR.rotation.z = 0.3;
    moroccoG.add(armL, armR);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.62, 12), matMoroccoSkin);
    head.position.y = 2.06;
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.16), matMoroccoSkin);
    nose.position.set(0, 2.02, 0.28);

    const hairDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.31, 14, 12).scale(1.02, 0.95, 1.15),
        matMorBotBlack
    );
    hairDome.position.set(0, 2.22, -0.04);
    const widowPeak = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.18, 6).rotateX(Math.PI),
        matMorBotBlack
    );
    widowPeak.position.set(0, 2.24, 0.28);

    [-0.28, 0.28].forEach((wx, idx) => {
        const wing = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.25, 6).rotateZ(idx === 0 ? 1.25 : -1.25),
            matMorBotBlack
        );
        wing.position.set(wx, 2.22, -0.06);
        hairDome.add(wing);
    });

    [-0.27, 0.27].forEach((ex, idx) => {
        const ear = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.16, 6).rotateZ(idx === 0 ? -0.8 : 0.8),
            matMoroccoSkin
        );
        ear.position.set(ex, 2.08, 0.02);
        moroccoG.add(ear);
    });

    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.08), matMorBotBlack);
    mustache.position.set(0, 1.94, 0.26);

    const monocleRim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 16), matMoroccoGold);
    monocleRim.position.set(-0.11, 2.12, 0.26);
    const monocleGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.09, 14),
        new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    monocleGlass.position.set(-0.11, 2.12, 0.265);
    monocleGlass.userData.noOutline = true;

    const monocleCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), matMorBotBlack);
    monocleCord.position.set(-0.16, 1.88, 0.24);
    monocleCord.rotation.z = -0.3;

    const verneBrooch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12).rotateX(Math.PI / 2),
        matMoroccoGold
    );
    verneBrooch.position.set(0, 1.55, 0.32);
    const verneGem = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), matMoroccoPurpleGlow);
    verneGem.position.set(0, 1.55, 0.34);

    moroccoG.add(head, nose, hairDome, widowPeak, mustache, monocleRim, monocleGlass, monocleCord, verneBrooch, verneGem);
    cageG.add(moroccoG);

    winchG.add(cageG);
    root.add(winchG);

    // Ground Mooring Anchors with glowing Moroccan Purple Pylons
    [-24, 24].forEach(px => {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 3.2, 10), matMorBotDarkSteel);
        pylon.position.set(px, 1.6, 15);
        const pylonCap = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), matMoroccoPurpleGlow);
        pylonCap.position.set(px, 3.2, 15);
        const mooringCable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 22.0, 6), matBlimpCable);
        mooringCable.position.set(px * 0.5, 11.5, 8);
        mooringCable.rotation.z = px > 0 ? 0.75 : -0.75;
        mooringCable.rotation.x = -0.3;
        root.add(pylon, pylonCap, mooringCable);
    });

    applyCartoonInkOutlines(root, 1.03, true);
    return { root, blimpRoot, envelopeG, blimpProps, cageG };
}

// DR. MOROCCO'S ESCAPE ROCKET LAUNCH PAD & GANTRY
export function buildMoroccoRocketMesh() {
    const root = new THREE.Group();

    const padPlinth = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 2.0, 16), matMorBotDarkSteel);
    padPlinth.position.set(0, 1.0, 0);
    const padRing = new THREE.Mesh(new THREE.RingGeometry(7.0, 8.2, 16).rotateX(-Math.PI / 2), matMorBotRedGlow);
    padRing.position.set(0, 2.05, 0);
    padRing.userData.noOutline = true;
    root.add(padPlinth, padRing);

    const gantry = new THREE.Mesh(new THREE.BoxGeometry(3.0, 26, 3.0), matMorBotBlack);
    gantry.position.set(-3, 13, 0);
    root.add(gantry);

    const rocketG = new THREE.Group();
    rocketG.position.set(0, 2.2, 0);

    const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 18, 16), matMorBotSilver);
    rocketBody.position.y = 9.0;
    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6.0, 16), matMorBotCrimson);
    noseCone.position.y = 21.0;
    const rocketCockpit = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10), matMoroccoPurpleGlow);
    rocketCockpit.position.set(0, 15.5, 1.5);

    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(ang => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.0, 2.4), matMoroccoGold);
        fin.position.set(Math.sin(ang) * 2.2, 4.0, Math.cos(ang) * 2.2);
        fin.rotation.y = ang;
        rocketG.add(fin);
    });

    rocketG.add(rocketBody, noseCone, rocketCockpit);
    root.add(rocketG);

    applyCartoonInkOutlines(root, 1.03, true);
    return { root, rocketG };
}

// Pure Zero-Side-Effect 3D Builders for Griffin Rock Town Buildings, HQ, Harbor & Landmarks
import * as THREE from 'three';
import {
    toonGrad3,
    matBrickRed,
    matSteel,
    matDarkSteel,
    matChrome,
    matGlass,
    matHazardYellow,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { texWindshieldCyan, texHelipad, texEmblem, texHazard } from '../rendering/textures.js';

const matCraneYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
const matContainerRed = new THREE.MeshToonMaterial({ color: 0xe11d48, gradientMap: toonGrad3 });
const matContainerBlue = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad3 });
const matContainerGreen = new THREE.MeshToonMaterial({ color: 0x16a34a, gradientMap: toonGrad3 });
const matContainerOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 });
const matPiling = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });
const matBasalt = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
const matTechCyan = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
const matTechPurple = new THREE.MeshToonMaterial({ color: 0xa855f7, gradientMap: toonGrad3 });
const matFerryRed = new THREE.MeshToonMaterial({ color: 0xe11d48, gradientMap: toonGrad3 });
const matFerryWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
const matFerryDeck = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 });

// 1. RESCUE BOTS FIREHOUSE HEADQUARTERS
export function buildFirehouseHQMesh() {
    const hqGroup = new THREE.Group();

    const hqApron = new THREE.Mesh(
        new THREE.BoxGeometry(64, 0.45, 56),
        new THREE.MeshToonMaterial({
            color: 0x334155,
            gradientMap: toonGrad3,
            polygonOffset: true,
            polygonOffsetFactor: -1.2,
            polygonOffsetUnits: -5.0
        })
    );
    hqApron.position.set(3, 0.22, 18);
    hqApron.receiveShadow = true;
    hqGroup.add(hqApron);

    const hqBackWall = new THREE.Mesh(new THREE.BoxGeometry(38, 15, 1.6), matBrickRed);
    hqBackWall.position.set(0, 7.5, -11.2);
    hqBackWall.castShadow = true;
    hqBackWall.receiveShadow = true;
    hqGroup.add(hqBackWall);

    const hqLeftWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 15, 24), matBrickRed);
    hqLeftWall.position.set(-18.2, 7.5, 0);
    hqLeftWall.castShadow = true;
    hqLeftWall.receiveShadow = true;
    const hqRightWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 15, 24), matBrickRed);
    hqRightWall.position.set(18.2, 7.5, 0);
    hqRightWall.castShadow = true;
    hqRightWall.receiveShadow = true;
    hqGroup.add(hqLeftWall, hqRightWall);

    const hqCeiling = new THREE.Mesh(new THREE.BoxGeometry(38, 1.2, 24), matBrickRed);
    hqCeiling.position.set(0, 14.4, 0);
    hqGroup.add(hqCeiling);

    const hqInteriorFloor = new THREE.Mesh(
        new THREE.BoxGeometry(36, 0.35, 22),
        new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 })
    );
    hqInteriorFloor.position.set(0, 0.18, 0);
    hqInteriorFloor.receiveShadow = true;
    hqGroup.add(hqInteriorFloor);

    const hqFrontHeader = new THREE.Mesh(new THREE.BoxGeometry(38, 4.5, 1.4), matBrickRed);
    hqFrontHeader.position.set(0, 12.75, 11.3);
    hqFrontHeader.castShadow = true;
    hqGroup.add(hqFrontHeader);

    const hqPillarL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10.5, 1.4), matBrickRed);
    hqPillarL.position.set(-17.25, 5.25, 11.3);
    const hqPillarR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10.5, 1.4), matBrickRed);
    hqPillarR.position.set(17.25, 5.25, 11.3);
    hqGroup.add(hqPillarL, hqPillarR);

    const hqDividerL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 10.5, 1.4), matBrickRed);
    hqDividerL.position.set(-5.5, 5.25, 11.3);
    const hqDividerR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 10.5, 1.4), matBrickRed);
    hqDividerR.position.set(5.5, 5.25, 11.3);
    hqGroup.add(hqDividerL, hqDividerR);

    const hqRoofTrim = new THREE.Mesh(new THREE.BoxGeometry(40, 1.8, 26), matSteel);
    hqRoofTrim.position.set(0, 15.5, 0);
    hqGroup.add(hqRoofTrim);

    const matBayGlass = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    [-11, 0, 11].forEach(bayX => {
        const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 10.5, 1.2), matSteel);
        frameL.position.set(bayX - 3.95, 5.25, 12.0);
        const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 10.5, 1.2), matSteel);
        frameR.position.set(bayX + 3.95, 5.25, 12.0);
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.7, 1.2), matSteel);
        frameTop.position.set(bayX, 10.15, 12.0);
        hqGroup.add(frameL, frameR, frameTop);

        const bayGlass = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 9.6), matBayGlass);
        bayGlass.position.set(bayX, 4.9, 12.05);
        bayGlass.userData.noOutline = true;
        bayGlass.renderOrder = 1;
        hqGroup.add(bayGlass);

        [2.4, 4.8, 7.2].forEach(my => {
            const horizMullion = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.12, 0.14), matSteel);
            horizMullion.position.set(bayX, my, 12.08);
            horizMullion.userData.noOutline = true;
            hqGroup.add(horizMullion);
        });
        const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 9.4, 0.14), matSteel);
        vertMullion.position.set(bayX, 4.9, 12.08);
        vertMullion.userData.noOutline = true;
        hqGroup.add(vertMullion);

        const bayLight = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 0.6, 1.4),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        bayLight.position.set(bayX, 9.8, 12.15);
        hqGroup.add(bayLight);

        const interiorLight = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 0.2, 8.0),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        interiorLight.position.set(bayX, 14.1, 3.5);
        hqGroup.add(interiorLight);

        const bayConsole = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.6), matDarkSteel);
        bayConsole.position.set(bayX, 1.6, -10.2);
        const consoleScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        consoleScreen.position.set(bayX, 2.2, -9.88);
        consoleScreen.userData.noOutline = true;
        hqGroup.add(bayConsole, consoleScreen);
    });

    const hqSign = new THREE.Mesh(
        new THREE.BoxGeometry(7.5, 7.5, 0.8),
        new THREE.MeshBasicMaterial({ map: texEmblem })
    );
    hqSign.position.set(0, 16.8, 13.0);
    hqSign.userData.noOutline = true;
    hqGroup.add(hqSign);

    const hqTower = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.2, 28, 12), matDarkSteel);
    hqTower.position.set(15, 14, -4);
    hqTower.castShadow = true;
    hqGroup.add(hqTower);

    const hqTowerGlass = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 7.5, 12), matGlass);
    hqTowerGlass.position.set(15, 22, -4);
    hqGroup.add(hqTowerGlass);

    const hqRadarPivot = new THREE.Group();
    hqRadarPivot.position.set(15, 29.5, -4);
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 3.5, 8), matSteel);
    hqRadarPivot.add(radarMast);
    const radarDish = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.2, 12, 1, true), matSteel);
    radarDish.rotation.x = Math.PI / 3;
    radarDish.position.set(0, 2.2, 1.2);
    hqRadarPivot.add(radarDish);
    hqGroup.add(hqRadarPivot);

    const helipadDeck = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.6, 18),
        new THREE.MeshBasicMaterial({ map: texHelipad })
    );
    helipadDeck.position.set(-8, 16.5, 0);
    helipadDeck.userData.noOutline = true;
    hqGroup.add(helipadDeck);

    const swapPadGroup = new THREE.Group();
    swapPadGroup.position.set(0, 0.15, 30);
    const swapPadBase = new THREE.Mesh(
        new THREE.CylinderGeometry(11.5, 12.5, 0.45, 32),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 })
    );
    swapPadGroup.add(swapPadBase);

    const swapPadRing = new THREE.Mesh(
        new THREE.RingGeometry(9.5, 11.4, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    swapPadRing.position.y = 0.28;
    swapPadRing.userData.noOutline = true;
    swapPadGroup.add(swapPadRing);

    const swapPadHolo = new THREE.Mesh(
        new THREE.CylinderGeometry(10.5, 10.5, 5.5, 24, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    swapPadHolo.userData.noOutline = true;
    swapPadHolo.position.y = 2.8;
    swapPadGroup.add(swapPadHolo);
    hqGroup.add(swapPadGroup);

    applyCartoonInkOutlines(hqGroup, 1.03, true);
    return { root: hqGroup, hqRadarPivot, swapPadRing };
}

// 2. FIREHOUSE ROBO-WASH
export function buildRoboWashMesh() {
    const roboWashGroup = new THREE.Group();

    const rwSlab = new THREE.Mesh(
        new THREE.BoxGeometry(13, 0.4, 20),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15, metalness: 0.65 })
    );
    rwSlab.position.set(0, 0.2, 0);
    rwSlab.receiveShadow = true;
    roboWashGroup.add(rwSlab);

    [-6.0, 6.0].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 19.5), matHazardYellow);
        rail.position.set(rx, 0.65, 0);
        rail.castShadow = true;
        roboWashGroup.add(rail);
    });

    [-9, 9].forEach(az => {
        const archGroup = new THREE.Group();
        archGroup.position.set(0, 0, az);

        [-6.0, 6.0].forEach(px => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.8, 1.4), matHazardYellow);
            post.position.set(px, 4.9, 0);
            post.castShadow = true;
            archGroup.add(post);
        });

        const crossbar = new THREE.Mesh(new THREE.BoxGeometry(13.4, 1.6, 1.6), matHazardYellow);
        crossbar.position.set(0, 9.8, 0);
        crossbar.castShadow = true;
        archGroup.add(crossbar);

        if (az === 9) {
            const signBg = new THREE.Mesh(new THREE.BoxGeometry(10.5, 2.6, 0.8), matBrickRed);
            signBg.position.set(0, 11.2, 0.2);
            archGroup.add(signBg);

            const cSign = document.createElement('canvas');
            cSign.width = 512;
            cSign.height = 128;
            const cCtx = cSign.getContext('2d')!;
            cCtx.fillStyle = '#0284c7';
            cCtx.fillRect(0, 0, 512, 128);
            cCtx.fillStyle = '#facc15';
            cCtx.font = 'bold 50px Arial, sans-serif';
            cCtx.textAlign = 'center';
            cCtx.textBaseline = 'middle';
            cCtx.fillText('ROBO-WASH', 256, 64);
            const texSign = new THREE.CanvasTexture(cSign);
            const signFace = new THREE.Mesh(
                new THREE.PlaneGeometry(9.8, 2.2),
                new THREE.MeshBasicMaterial({ map: texSign })
            );
            signFace.position.set(0, 11.2, 0.65);
            signFace.userData.noOutline = true;
            archGroup.add(signFace);
        }

        roboWashGroup.add(archGroup);
    });

    const rwCanopy = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.4, 18.2), matGlass);
    rwCanopy.position.set(0, 9.6, 0);
    roboWashGroup.add(rwCanopy);

    const matBrushCyan = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
    const matBrushPink = new THREE.MeshToonMaterial({ color: 0xec4899, gradientMap: toonGrad3 });
    const matBrushYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const matBrushOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 });

    function createVerticalBrush(bx: number, bz: number, matA: THREE.Material, matB: THREE.Material) {
        const bGroup = new THREE.Group();
        bGroup.position.set(bx, 0.5, bz);
        const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.2, 8), matDarkSteel);
        spindle.position.y = 4.1;
        bGroup.add(spindle);
        for (let d = 0; d < 10; d++) {
            const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.72, 10), d % 2 === 0 ? matA : matB);
            disc.position.y = 0.6 + d * 0.78;
            disc.castShadow = true;
            bGroup.add(disc);
        }
        return bGroup;
    }

    const rwLeftBrush = createVerticalBrush(-3.8, 0, matBrushCyan, matBrushPink);
    const rwRightBrush = createVerticalBrush(3.8, 0, matBrushPink, matBrushCyan);
    roboWashGroup.add(rwLeftBrush, rwRightBrush);

    const rwTopBrush = new THREE.Group();
    rwTopBrush.position.set(0, 7.8, 0);
    const topSpindle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.8, 8).rotateZ(Math.PI / 2), matDarkSteel);
    rwTopBrush.add(topSpindle);
    for (let d = -4; d <= 4; d++) {
        const tDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(1.35, 1.35, 0.85, 10).rotateZ(Math.PI / 2),
            d % 2 === 0 ? matBrushYellow : matBrushOrange
        );
        tDisc.position.x = d * 0.95;
        tDisc.castShadow = true;
        rwTopBrush.add(tDisc);
    }
    roboWashGroup.add(rwTopBrush);

    [-2.8, 2.8].forEach(nx => {
        [-4.5, 4.5].forEach(nz => {
            const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 8), matSteel);
            nozzle.position.set(nx, 9.3, nz);
            nozzle.rotation.x = Math.PI;
            roboWashGroup.add(nozzle);
        });
    });

    applyCartoonInkOutlines(roboWashGroup, 1.03, true);
    return { root: roboWashGroup, rwLeftBrush, rwRightBrush, rwTopBrush };
}

// 3. FIREHOUSE HQ SUPER CATAPULT LAUNCH PAD
export function buildSuperCatapultMesh() {
    const catapultGroup = new THREE.Group();

    const catSlab = new THREE.Mesh(
        new THREE.BoxGeometry(13, 0.45, 22),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.6 })
    );
    catSlab.position.set(0, 0.22, 0);
    catSlab.receiveShadow = true;
    catapultGroup.add(catSlab);

    [-5.8, 5.8].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 21.5), matHazardYellow);
        rail.position.set(rx, 0.8, 0);
        rail.castShadow = true;
        catapultGroup.add(rail);
    });

    const blastShield = new THREE.Mesh(
        new THREE.BoxGeometry(12.5, 5.5, 1.4),
        new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 })
    );
    blastShield.position.set(0, 2.75, -10.2);
    blastShield.rotation.x = -0.2;
    blastShield.castShadow = true;
    catapultGroup.add(blastShield);

    const catArch = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.4, 1.4), matHazardYellow);
    catArch.position.set(0, 8.8, -9.8);
    catapultGroup.add(catArch);

    [-5.8, 5.8].forEach(px => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8.8, 1.2), matHazardYellow);
        post.position.set(px, 4.4, -9.8);
        post.castShadow = true;
        catapultGroup.add(post);
    });

    const cSignCat = document.createElement('canvas');
    cSignCat.width = 512;
    cSignCat.height = 128;
    const cCtxCat = cSignCat.getContext('2d')!;
    cCtxCat.fillStyle = '#dc2626';
    cCtxCat.fillRect(0, 0, 512, 128);
    cCtxCat.fillStyle = '#facc15';
    cCtxCat.font = 'bold 44px Arial, sans-serif';
    cCtxCat.textAlign = 'center';
    cCtxCat.textBaseline = 'middle';
    cCtxCat.fillText('HQ CATAPULT', 256, 64);
    const texSignCat = new THREE.CanvasTexture(cSignCat);
    const catSignFace = new THREE.Mesh(
        new THREE.PlaneGeometry(9.6, 2.2),
        new THREE.MeshBasicMaterial({ map: texSignCat })
    );
    catSignFace.position.set(0, 8.8, -9.05);
    catSignFace.userData.noOutline = true;
    catapultGroup.add(catSignFace);

    const catapultCarriage = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.5, 8.5),
        new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 })
    );
    catapultCarriage.position.set(0, 0.45, -3.5);
    catapultCarriage.castShadow = true;
    catapultGroup.add(catapultCarriage);

    [-2.8, 2.8].forEach(px => {
        [-6.5, -0.5].forEach(pz => {
            const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.6, 8), matChrome);
            piston.position.set(px, 0.8, pz);
            catapultGroup.add(piston);
        });
    });

    const catapultStrobes: THREE.Mesh[] = [];
    [-5.2, 5.2].forEach(lx => {
        for (let lz = -8; lz <= 8; lz += 4) {
            const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.5, 8), matDarkSteel);
            sBase.position.set(lx, 0.7, lz);
            catapultGroup.add(sBase);

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.32, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            bulb.position.set(lx, 1.05, lz);
            bulb.userData.noOutline = true;
            catapultGroup.add(bulb);
            catapultStrobes.push(bulb);
        }
    });

    applyCartoonInkOutlines(catapultGroup, 1.03, true);
    return { root: catapultGroup, catapultCarriage, catapultStrobes };
}

// 4. GRIFFIN ROCK DRIVE-THRU DINER
export function buildGriffinDinerMesh() {
    const dinerGroup = new THREE.Group();

    const dinerPlinth = new THREE.Mesh(
        new THREE.BoxGeometry(26, 0.45, 26),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
    );
    dinerPlinth.position.y = 0.22;
    dinerPlinth.receiveShadow = true;
    dinerGroup.add(dinerPlinth);

    [-12.2, -4.8].forEach(cx => {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 25), matHazardYellow);
        curb.position.set(cx, 0.5, 0);
        dinerGroup.add(curb);
    });

    const matDinerTeal = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
    const matDinerPink = new THREE.MeshToonMaterial({ color: 0xf43f5e, gradientMap: toonGrad3 });
    const dinerBody = new THREE.Mesh(new THREE.BoxGeometry(15, 8.5, 18), matDinerTeal);
    dinerBody.position.set(4.2, 4.5, 0);
    dinerBody.castShadow = true;
    dinerBody.receiveShadow = true;
    dinerGroup.add(dinerBody);

    const dinerTrim = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.8, 18.4), matChrome);
    dinerTrim.position.set(4.2, 5.5, 0);
    dinerGroup.add(dinerTrim);

    const dinerWinFront = new THREE.Mesh(new THREE.BoxGeometry(13.5, 3.2, 0.3), matGlass);
    dinerWinFront.position.set(4.2, 4.2, 9.1);
    dinerWinFront.userData.noOutline = true;
    dinerGroup.add(dinerWinFront);

    const dinerWinDrive = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 4.5), matGlass);
    dinerWinDrive.position.set(-3.35, 4.2, -2.5);
    dinerWinDrive.userData.noOutline = true;
    dinerGroup.add(dinerWinDrive);

    const pickupCounter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 5.2), matSteel);
    pickupCounter.position.set(-3.8, 2.7, -2.5);
    dinerGroup.add(pickupCounter);

    const pickupAwning = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 6.2), matDinerPink);
    pickupAwning.position.set(-4.8, 6.8, -2.5);
    pickupAwning.rotation.z = -0.2;
    dinerGroup.add(pickupAwning);

    const intercomGroup = new THREE.Group();
    intercomGroup.position.set(-10.5, 0, 6.5);
    const intercomPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 8), matDarkSteel);
    intercomPillar.position.y = 1.6;
    intercomGroup.add(intercomPillar);
    const intercomBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.2), matHazardYellow);
    intercomBox.position.y = 3.6;
    intercomGroup.add(intercomBox);
    const intercomScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    intercomScreen.position.set(0.81, 3.6, 0);
    intercomScreen.rotation.y = Math.PI / 2;
    intercomScreen.userData.noOutline = true;
    intercomGroup.add(intercomScreen);
    dinerGroup.add(intercomGroup);

    const cSignDin = document.createElement('canvas');
    cSignDin.width = 512;
    cSignDin.height = 128;
    const cCtxDin = cSignDin.getContext('2d')!;
    cCtxDin.fillStyle = '#f43f5e';
    cCtxDin.fillRect(0, 0, 512, 128);
    cCtxDin.fillStyle = '#fef08a';
    cCtxDin.font = 'bold 46px Arial, sans-serif';
    cCtxDin.textAlign = 'center';
    cCtxDin.textBaseline = 'middle';
    cCtxDin.fillText('GRIFFIN DINER', 256, 64);
    const texSignDin = new THREE.CanvasTexture(cSignDin);
    const dinSignFace = new THREE.Mesh(
        new THREE.PlaneGeometry(11.5, 2.4),
        new THREE.MeshBasicMaterial({ map: texSignDin })
    );
    dinSignFace.position.set(4.2, 9.8, 9.1);
    dinSignFace.userData.noOutline = true;
    dinerGroup.add(dinSignFace);

    const dinerBurgerGroup = new THREE.Group();
    dinerBurgerGroup.position.set(4.2, 11.2, 0);

    const burgerSpindle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 2.4, 8), matDarkSteel);
    burgerSpindle.position.y = -1.2;
    dinerBurgerGroup.add(burgerSpindle);

    const matBun = new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad3 });
    const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.3, 0.85, 16), matBun);
    bottomBun.position.y = 0.42;
    bottomBun.castShadow = true;
    dinerBurgerGroup.add(bottomBun);

    const matPatty = new THREE.MeshToonMaterial({ color: 0x581c10, gradientMap: toonGrad3 });
    const beefPatty = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.75, 16), matPatty);
    beefPatty.position.y = 1.2;
    beefPatty.castShadow = true;
    dinerBurgerGroup.add(beefPatty);

    const matCheese = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const cheeseSlice = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.22, 5.8), matCheese);
    cheeseSlice.position.y = 1.68;
    cheeseSlice.rotation.y = Math.PI / 4;
    cheeseSlice.castShadow = true;
    dinerBurgerGroup.add(cheeseSlice);

    const matLettuce = new THREE.MeshToonMaterial({ color: 0x22c55e, gradientMap: toonGrad3 });
    const lettuceDisc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.0, 0.35, 16), matLettuce);
    lettuceDisc.position.y = 1.95;
    lettuceDisc.castShadow = true;
    dinerBurgerGroup.add(lettuceDisc);

    const matTomato = new THREE.MeshToonMaterial({ color: 0xef4444, gradientMap: toonGrad3 });
    [-1.3, 1.3].forEach(tx => {
        const tomato = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 12), matTomato);
        tomato.position.set(tx, 2.25, 0);
        dinerBurgerGroup.add(tomato);
    });

    const topBun = new THREE.Mesh(
        new THREE.SphereGeometry(3.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        matBun
    );
    topBun.position.y = 2.3;
    topBun.scale.set(1.0, 0.65, 1.0);
    topBun.castShadow = true;
    dinerBurgerGroup.add(topBun);

    const matSesame = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let s = 0; s < 18; s++) {
        const seed = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4), matSesame);
        const ang = (s / 18) * Math.PI * 2 + (s % 3) * 0.14;
        const dist = 0.9 + ((s * 0.37) % 1) * 2.1;
        seed.position.set(Math.cos(ang) * dist, 2.9 + ((s * 0.53) % 1) * 0.4, Math.sin(ang) * dist);
        seed.userData.noOutline = true;
        dinerBurgerGroup.add(seed);
    }

    dinerGroup.add(dinerBurgerGroup);
    applyCartoonInkOutlines(dinerGroup, 1.03, true);
    return { root: dinerGroup, dinerBurgerGroup };
}

// 5. DOC GREENE'S ENERGON TURBO-CHARGER STATION
export function buildEnergonChargerMesh() {
    const chargerGroup = new THREE.Group();

    const matTechBase = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.7 });
    const chargerSlab = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 20), matTechBase);
    chargerSlab.position.y = 0.25;
    chargerSlab.receiveShadow = true;
    chargerGroup.add(chargerSlab);

    const padGlow = new THREE.Mesh(
        new THREE.BoxGeometry(9.5, 0.55, 14.5),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    padGlow.position.y = 0.26;
    padGlow.userData.noOutline = true;
    chargerGroup.add(padGlow);

    const energonCoilRings: THREE.Mesh[] = [];
    const energonOrbs: THREE.Mesh[] = [];

    [-6.5, 6.5].forEach(cx => {
        const coilGroup = new THREE.Group();
        coilGroup.position.set(cx, 0.5, 0);

        const pBase = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 1.2, 8), matDarkSteel);
        pBase.position.y = 0.6;
        pBase.castShadow = true;
        coilGroup.add(pBase);

        const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 9.5, 12), matChrome);
        spindle.position.y = 5.35;
        spindle.castShadow = true;
        coilGroup.add(spindle);

        for (let r = 0; r < 5; r++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.65 - r * 0.12, 0.32, 8, 16),
                r % 2 === 0 ? matTechCyan : matTechPurple
            );
            ring.position.y = 2.0 + r * 1.5;
            ring.rotation.x = Math.PI / 2;
            ring.castShadow = true;
            coilGroup.add(ring);
            energonCoilRings.push(ring);
        }

        const orbCore = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 12),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        orbCore.position.y = 10.6;
        orbCore.userData.noOutline = true;
        coilGroup.add(orbCore);
        energonOrbs.push(orbCore);

        const orbAura = new THREE.Mesh(
            new THREE.SphereGeometry(1.9, 16, 12),
            new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.45 })
        );
        orbAura.position.y = 10.6;
        orbAura.userData.noOutline = true;
        coilGroup.add(orbAura);
        energonOrbs.push(orbAura);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.5, 8), matChrome);
        antenna.position.y = 12.8;
        coilGroup.add(antenna);

        chargerGroup.add(coilGroup);
    });

    const gantryArch = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.4, 2.0), matDarkSteel);
    gantryArch.position.set(0, 11.2, 0);
    gantryArch.castShadow = true;
    chargerGroup.add(gantryArch);

    const emitter = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 8), matChrome);
    emitter.position.set(0, 9.6, 0);
    emitter.rotation.x = Math.PI;
    chargerGroup.add(emitter);

    const emitterBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    emitterBulb.position.set(0, 8.4, 0);
    emitterBulb.userData.noOutline = true;
    chargerGroup.add(emitterBulb);

    const cSignChg = document.createElement('canvas');
    cSignChg.width = 512;
    cSignChg.height = 128;
    const cCtxChg = cSignChg.getContext('2d')!;
    cCtxChg.fillStyle = '#1e3a8a';
    cCtxChg.fillRect(0, 0, 512, 128);
    cCtxChg.fillStyle = '#38bdf8';
    cCtxChg.font = 'bold 36px Arial, sans-serif';
    cCtxChg.textAlign = 'center';
    cCtxChg.textBaseline = 'middle';
    cCtxChg.fillText('ENERGON CHARGER', 256, 64);
    const texSignChg = new THREE.CanvasTexture(cSignChg);
    const chgSignFace = new THREE.Mesh(
        new THREE.PlaneGeometry(10.5, 2.2),
        new THREE.MeshBasicMaterial({ map: texSignChg })
    );
    chgSignFace.position.set(0, 12.4, 1.05);
    chgSignFace.userData.noOutline = true;
    chargerGroup.add(chgSignFace);

    applyCartoonInkOutlines(chargerGroup, 1.03, true);
    return { root: chargerGroup, energonCoilRings, energonOrbs };
}

// 6. DOC GREENE'S GROUNDBRIDGE TELEPORTER PORTAL
export function buildGroundbridgePortalMesh(portalId = 'A') {
    const gbGroup = new THREE.Group();

    const apronMesh = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.45, 28),
        new THREE.MeshToonMaterial({
            color: 0x1e293b,
            gradientMap: toonGrad3,
            polygonOffset: true,
            polygonOffsetFactor: -1.2,
            polygonOffsetUnits: -5.0
        })
    );
    apronMesh.position.set(0, 0.22, 0);
    apronMesh.receiveShadow = true;
    gbGroup.add(apronMesh);

    [-8.5, 8.5].forEach(px => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 4.2), matDarkSteel);
        pylon.position.set(px, 1.6, 0);
        pylon.castShadow = true;
        gbGroup.add(pylon);

        const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 8), matTechCyan);
        conduit.position.set(px, 1.4, 1.8);
        gbGroup.add(conduit);
    });

    const archFrame = new THREE.Mesh(new THREE.TorusGeometry(7.8, 1.25, 8, 16), matDarkSteel);
    archFrame.position.set(0, 8.2, 0);
    archFrame.castShadow = true;
    gbGroup.add(archFrame);

    const irisRing1 = new THREE.Mesh(new THREE.TorusGeometry(7.0, 0.42, 6, 24), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    irisRing1.position.set(0, 8.2, 0);
    irisRing1.userData.noOutline = true;
    gbGroup.add(irisRing1);

    const irisRing2 = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.38, 6, 20), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
    irisRing2.position.set(0, 8.2, 0.15);
    irisRing2.userData.noOutline = true;
    gbGroup.add(irisRing2);

    const irisRing3 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.35, 6, 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    irisRing3.position.set(0, 8.2, -0.15);
    irisRing3.userData.noOutline = true;
    gbGroup.add(irisRing3);

    const vortexDisc = new THREE.Mesh(
        new THREE.CircleGeometry(6.6, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    vortexDisc.position.set(0, 8.2, 0);
    vortexDisc.userData.noOutline = true;
    gbGroup.add(vortexDisc);

    const cSignGb = document.createElement('canvas');
    cSignGb.width = 512;
    cSignGb.height = 128;
    const cCtxGb = cSignGb.getContext('2d')!;
    cCtxGb.fillStyle = '#0f172a';
    cCtxGb.fillRect(0, 0, 512, 128);
    cCtxGb.fillStyle = '#38bdf8';
    cCtxGb.font = 'bold 42px Arial, sans-serif';
    cCtxGb.textAlign = 'center';
    cCtxGb.textBaseline = 'middle';
    cCtxGb.fillText('GROUNDBRIDGE ' + portalId, 256, 64);
    const texSignGb = new THREE.CanvasTexture(cSignGb);
    const gbSignFace = new THREE.Mesh(
        new THREE.PlaneGeometry(8.2, 1.8),
        new THREE.MeshBasicMaterial({ map: texSignGb })
    );
    gbSignFace.position.set(0, 16.4, 0.7);
    gbSignFace.userData.noOutline = true;
    gbGroup.add(gbSignFace);

    applyCartoonInkOutlines(gbGroup, 1.03, true);
    return { root: gbGroup, irisRing1, irisRing2, irisRing3, vortexDisc };
}

// 7. GRIFFIN TOWN BUILDING ARCHETYPE
export function buildTownBuildingMesh(w = 15, h = 14, d = 14, roofColor = 0x1d4ed8, wallColor = 0xf8fafc) {
    const group = new THREE.Group();

    const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(w + 4.4, 0.55, d + 4.4),
        new THREE.MeshToonMaterial({ color: 0xcbd5e1, gradientMap: toonGrad3 })
    );
    plinth.position.y = 0.27;
    plinth.receiveShadow = true;
    group.add(plinth);

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshToonMaterial({ color: wallColor, gradientMap: toonGrad3 })
    );
    body.position.y = h / 2 + 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.76, 4.8, 4),
        new THREE.MeshToonMaterial({ color: roofColor, gradientMap: toonGrad3 })
    );
    roof.position.y = h + 2.85;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    const winMat = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, h * 0.45, d + 0.25), winMat);
    win.position.y = h * 0.55 + 0.45;
    win.userData.noOutline = true;
    group.add(win);

    applyCartoonInkOutlines(group, 1.04, true);
    return { root: group };
}

// 8. COASTAL LIGHTHOUSE ON EAST PENINSULA
export function buildEastLighthouseMesh(includeBeams = true) {
    const lighthouseGroup = new THREE.Group();

    const lhBase = new THREE.Mesh(
        new THREE.CylinderGeometry(5.5, 8.2, 38, 14),
        new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 })
    );
    lhBase.position.y = 19;
    lhBase.castShadow = true;
    lighthouseGroup.add(lhBase);

    const lhStripe = new THREE.Mesh(
        new THREE.CylinderGeometry(6.2, 7.1, 11, 14),
        new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad3 })
    );
    lhStripe.position.y = 19;
    lighthouseGroup.add(lhStripe);

    const lhLantern = new THREE.Mesh(
        new THREE.CylinderGeometry(4.8, 4.8, 6, 12),
        new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    lhLantern.position.y = 41.0;
    lhLantern.userData.noOutline = true;
    lighthouseGroup.add(lhLantern);

    const lhRoof = new THREE.Mesh(
        new THREE.ConeGeometry(6.5, 6.5, 14),
        new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad3 })
    );
    lhRoof.position.y = 46.8;
    lighthouseGroup.add(lhRoof);

    applyCartoonInkOutlines(lighthouseGroup, 1.045, false);

    const lhBeamPivot = new THREE.Group();
    if (includeBeams) {
        const matLhBeam = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
        const beamLen = 130;
        const lhBeam = new THREE.Mesh(new THREE.ConeGeometry(16, beamLen, 16, 1, true), matLhBeam);
        lhBeam.rotation.z = Math.PI / 2;
        lhBeam.position.set(62, 41.0, 0);
        lhBeam.userData.noOutline = true;

        const lhBeamOpposite = new THREE.Mesh(new THREE.ConeGeometry(16, beamLen, 16, 1, true), matLhBeam);
        lhBeamOpposite.rotation.z = -Math.PI / 2;
        lhBeamOpposite.position.set(-62, 41.0, 0);
        lhBeamOpposite.userData.noOutline = true;

        lhBeamPivot.add(lhBeam, lhBeamOpposite);
        lighthouseGroup.add(lhBeamPivot);
    }

    return { root: lighthouseGroup, lhBeamPivot };
}

// 9. SOUTH HARBOR PIER DOCK (centered at 0,0,0 -> in world at z=1228)
export function buildHarborPierMesh() {
    const pierGroup = new THREE.Group();

    const pierDeck = new THREE.Mesh(
        new THREE.BoxGeometry(32, 4.0, 96),
        new THREE.MeshToonMaterial({ color: 0x9a3412, gradientMap: toonGrad3 })
    );
    pierDeck.position.set(0, 1.4, 0);
    pierDeck.receiveShadow = true;
    pierDeck.castShadow = true;
    applyCartoonInkOutlines(pierDeck, 1.03, true);
    pierGroup.add(pierDeck);

    for (let pz = -36; pz <= 40; pz += 15.2) {
        [-13, 13].forEach(px => {
            const piling = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 12, 8), matPiling);
            piling.position.set(px, -2.5, pz);
            pierGroup.add(piling);
        });
    }

    const matBollard = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    for (let bz = -32; bz <= 38; bz += 17.5) {
        [-15, 15].forEach(bx => {
            const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.4, 8), matBollard);
            bollard.position.set(bx, 3.8, bz);
            pierGroup.add(bollard);
        });
    }

    return { root: pierGroup };
}

// 10. STATIC DOCK CARGO GANTRY CRANE
export function buildDockCargoCraneMesh() {
    const craneGroup = new THREE.Group();

    [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 24, 1.4), matCraneYellow);
        leg.position.set(lx, 12, lz);
        leg.castShadow = true;
        craneGroup.add(leg);
    });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 12), matCraneYellow);
    platform.position.y = 24.5;
    craneGroup.add(platform);
    const opCab = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.2, 5.5), matSteel);
    opCab.position.set(0, 27.5, 2.0);
    craneGroup.add(opCab);
    const opGlass = new THREE.Mesh(new THREE.BoxGeometry(5.7, 2.4, 4.2), matGlass);
    opGlass.position.set(0, 27.8, 2.5);
    craneGroup.add(opGlass);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 38), matCraneYellow);
    boom.position.set(0, 29.8, 10);
    boom.castShadow = true;
    craneGroup.add(boom);
    const hoistCable = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12, 8), matDarkSteel);
    hoistCable.position.set(0, 22.5, 22);
    craneGroup.add(hoistCable);
    const slungContainer = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.2, 11.5), matContainerBlue);
    slungContainer.position.set(0, 14.5, 22);
    slungContainer.castShadow = true;
    craneGroup.add(slungContainer);

    applyCartoonInkOutlines(craneGroup, 1.035, true);
    return { root: craneGroup };
}

// 11. INTERACTIVE HIGH-FLYING MAGNETIC GANTRY CRANE
export function buildMagneticGantryCraneMesh() {
    const craneGroup = new THREE.Group();

    [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 24, 1.4), matCraneYellow);
        leg.position.set(lx, 12, lz);
        leg.castShadow = true;
        craneGroup.add(leg);
    });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 12), matCraneYellow);
    platform.position.y = 24.5;
    craneGroup.add(platform);
    const opCab = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.2, 5.5), matSteel);
    opCab.position.set(0, 27.5, 2.0);
    craneGroup.add(opCab);
    const opGlass = new THREE.Mesh(new THREE.BoxGeometry(5.7, 2.4, 4.2), matGlass);
    opGlass.position.set(0, 27.8, 2.5);
    craneGroup.add(opGlass);

    const boomPivot = new THREE.Group();
    boomPivot.position.set(0, 29.8, 0);

    const boom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 48), matCraneYellow);
    boom.castShadow = true;
    boomPivot.add(boom);

    const cableMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 22, 8), matDarkSteel);
    cableMesh.position.set(0, -11, -24);
    boomPivot.add(cableMesh);

    const magnetGroup = new THREE.Group();
    magnetGroup.position.set(0, -21.5, -24);

    const magnetPlate = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 1.1, 16), matDarkSteel);
    magnetGroup.add(magnetPlate);

    const magnetGlow = new THREE.Mesh(
        new THREE.TorusGeometry(1.8, 0.35, 8, 20),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    magnetGlow.rotation.x = Math.PI / 2;
    magnetGlow.position.y = -0.45;
    magnetGlow.userData.noOutline = true;
    magnetGroup.add(magnetGlow);

    const magnetBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    magnetBulb.position.y = 0.8;
    magnetBulb.userData.noOutline = true;
    magnetGroup.add(magnetBulb);

    boomPivot.add(magnetGroup);
    craneGroup.add(boomPivot);

    applyCartoonInkOutlines(craneGroup, 1.035, true);
    return { root: craneGroup, boomPivot, cableMesh, magnetGroup };
}

// 12. CARGO SHIPPING CONTAINER STACK
export function buildCargoContainerYardMesh(variantIdx = 0) {
    const yardGroup = new THREE.Group();
    const containerMats = [matContainerRed, matContainerBlue, matContainerGreen, matContainerOrange, matCraneYellow];

    for (let row = 0; row < 2; row++) {
        const levels = row === 0 ? 3 : 2;
        for (let lvl = 0; lvl < levels; lvl++) {
            const cMesh = new THREE.Mesh(
                new THREE.BoxGeometry(5.6, 5.2, 13.5),
                containerMats[(variantIdx + row * 2 + lvl) % containerMats.length]
            );
            cMesh.position.set((row - 0.5) * 6.4, 2.6 + lvl * 5.25, 0);
            cMesh.castShadow = true;
            cMesh.receiveShadow = true;
            yardGroup.add(cMesh);
        }
    }

    applyCartoonInkOutlines(yardGroup, 1.04, true);
    return { root: yardGroup };
}

// 13. RIDEABLE SOUTH HARBOR RESCUE FERRY BOAT
export function buildHarborFerryMesh() {
    const harborFerryGroup = new THREE.Group();

    const ferryHull = new THREE.Mesh(new THREE.BoxGeometry(16, 5.2, 42), matFerryRed);
    ferryHull.position.y = 2.2;
    ferryHull.castShadow = true;
    harborFerryGroup.add(ferryHull);

    const ferryBow = new THREE.Mesh(
        new THREE.ConeGeometry(11.2, 14, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4),
        matFerryRed
    );
    ferryBow.scale.set(1.0, 0.48, 1.0);
    ferryBow.position.set(0, 2.2, 27.5);
    harborFerryGroup.add(ferryBow);

    const ferryCarDeck = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.5, 36), matFerryDeck);
    ferryCarDeck.position.set(0, 4.8, 0);
    ferryCarDeck.receiveShadow = true;
    harborFerryGroup.add(ferryCarDeck);

    for (let lz = -14; lz <= 14; lz += 4.5) {
        const stripe = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 2.5).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        stripe.position.set(0, 5.08, lz);
        stripe.userData.noOutline = true;
        harborFerryGroup.add(stripe);
    }

    [-5.8, 5.8].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 35), matHazardYellow);
        rail.position.set(rx, 5.7, 0);
        harborFerryGroup.add(rail);
    });

    [-5.0, 5.0].forEach(tx => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 20), matFerryWhite);
        tower.position.set(tx, 6.7, 0);
        tower.castShadow = true;
        harborFerryGroup.add(tower);

        [-6, 0, 6].forEach(wz => {
            const porthole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.65, 0.65, 0.35, 12).rotateZ(Math.PI / 2),
                matGlass
            );
            porthole.position.set(tx > 0 ? tx + 1.15 : tx - 1.15, 6.8, wz);
            harborFerryGroup.add(porthole);
        });
    });

    const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.5, 22), matFerryDeck);
    upperDeck.position.set(0, 8.65, 0);
    upperDeck.receiveShadow = true;
    harborFerryGroup.add(upperDeck);

    [-6.0, 6.0].forEach(rx => {
        const uRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 21.6), matFerryWhite);
        uRail.position.set(rx, 9.45, 0);
        harborFerryGroup.add(uRail);
    });

    const ferryBridge = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.2, 8.6), matFerryWhite);
    ferryBridge.position.set(0, 10.5, 3.5);
    ferryBridge.castShadow = true;
    harborFerryGroup.add(ferryBridge);

    const ferryGlass = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.6, 6.8), matGlass);
    ferryGlass.position.set(0, 10.9, 4.2);
    harborFerryGroup.add(ferryGlass);

    const bridgeRoof = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.4, 9.0), matFerryWhite);
    bridgeRoof.position.set(0, 12.2, 3.5);
    harborFerryGroup.add(bridgeRoof);

    const helipadDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.2, 0.25, 24),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    helipadDisc.position.set(0, 12.52, 3.5);
    helipadDisc.userData.noOutline = true;
    harborFerryGroup.add(helipadDisc);

    const helipadRing = new THREE.Mesh(
        new THREE.RingGeometry(3.4, 3.9, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    helipadRing.position.set(0, 12.67, 3.5);
    helipadRing.userData.noOutline = true;
    harborFerryGroup.add(helipadRing);

    const matHWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2).rotateX(-Math.PI / 2), matHWhite);
    hBar1.position.set(-1.0, 12.68, 3.5);
    hBar1.userData.noOutline = true;
    const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2).rotateX(-Math.PI / 2), matHWhite);
    hBar2.position.set(1.0, 12.68, 3.5);
    hBar2.userData.noOutline = true;
    const hCross = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7).rotateX(-Math.PI / 2), matHWhite);
    hCross.position.set(0, 12.68, 3.5);
    hCross.userData.noOutline = true;
    harborFerryGroup.add(hBar1, hBar2, hCross);

    const funnelBase = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.2, 4.5), matFerryWhite);
    funnelBase.position.set(0, 9.5, -5.2);
    funnelBase.castShadow = true;
    harborFerryGroup.add(funnelBase);

    [-2.8, 2.8].forEach(stackX => {
        const funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 4.5, 12), matCraneYellow);
        funnel.position.set(stackX, 12.2, -5.2);
        funnel.castShadow = true;
        harborFerryGroup.add(funnel);

        const funnelRim = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.45, 12), matDarkSteel);
        funnelRim.position.set(stackX, 14.5, -5.2);
        harborFerryGroup.add(funnelRim);
    });

    const ferryRampPivot = new THREE.Group();
    ferryRampPivot.position.set(0, 4.8, -18);
    const rampSlab = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.45, 9.5), matFerryDeck);
    rampSlab.position.set(0, 0, -4.75);
    rampSlab.receiveShadow = true;
    ferryRampPivot.add(rampSlab);
    harborFerryGroup.add(ferryRampPivot);

    applyCartoonInkOutlines(harborFerryGroup, 1.035, true);
    return { root: harborFerryGroup, ferryRampPivot };
}

// 14. FERRY BOARDING BRIDGE & GANGWAY ARCH (centered around x=26, z=1221.5)
export function buildFerryBoardingBridgeMesh() {
    const boardingBridgeGroup = new THREE.Group();
    const ox = -26.0;
    const oz = -1221.5;

    const rampLengthX = 22.0;
    const rampWidthZ = 14.0;
    const bridgeRamp = new THREE.Mesh(
        new THREE.BoxGeometry(rampLengthX, 0.75, rampWidthZ),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
    );
    bridgeRamp.position.set(26.0 + ox, 4.1, 1211.0 + oz);
    bridgeRamp.rotation.z = -0.068;
    bridgeRamp.receiveShadow = true;
    boardingBridgeGroup.add(bridgeRamp);

    const hazardStripe1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 13.5).rotateX(-Math.PI / 2), matHazardYellow);
    hazardStripe1.position.set(16.2 + ox, 3.82, 1211.0 + oz);
    hazardStripe1.userData.noOutline = true;
    const hazardStripe2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 13.5).rotateX(-Math.PI / 2), matHazardYellow);
    hazardStripe2.position.set(35.5 + ox, 5.22, 1211.0 + oz);
    hazardStripe2.userData.noOutline = true;
    boardingBridgeGroup.add(hazardStripe1, hazardStripe2);

    [-6.6, 6.6].forEach(rz => {
        const guardRail = new THREE.Mesh(new THREE.BoxGeometry(rampLengthX, 1.2, 0.45), matHazardYellow);
        guardRail.position.set(26.0 + ox, 5.0, 1211.0 + rz + oz);
        guardRail.rotation.z = -0.068;
        boardingBridgeGroup.add(guardRail);
    });

    [19.0, 26.0, 33.0].forEach(px => {
        [-5.5, 5.5].forEach(pz => {
            const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 12, 8), matPiling);
            pile.position.set(px + ox, -2.0, 1211.0 + pz + oz);
            boardingBridgeGroup.add(pile);
        });
    });

    const sideGangway = new THREE.Mesh(
        new THREE.BoxGeometry(14.0, 0.65, 8.0),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35 })
    );
    sideGangway.position.set(23.0 + ox, 4.1, 1232.0 + oz);
    sideGangway.rotation.z = -0.08;
    sideGangway.receiveShadow = true;
    boardingBridgeGroup.add(sideGangway);

    [-3.6, 3.6].forEach(sgz => {
        const sRail = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.2, 0.35), matHazardYellow);
        sRail.position.set(23.0 + ox, 4.9, 1232.0 + sgz + oz);
        sRail.rotation.z = -0.08;
        boardingBridgeGroup.add(sRail);
    });

    const archGroup = new THREE.Group();
    archGroup.position.set(16.5 + ox, 3.4, 1211.0 + oz);
    [-6.5, 6.5].forEach(az => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.5, 0.7), matCraneYellow);
        post.position.set(0, 3.75, az);
        archGroup.add(post);

        const amberBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        amberBeacon.position.set(0, 7.8, az);
        amberBeacon.userData.noOutline = true;
        archGroup.add(amberBeacon);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 13.7), matCraneYellow);
    crossBeam.position.set(0, 7.5, 0);
    archGroup.add(crossBeam);

    const signPlate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 9.5), matFerryRed);
    signPlate.position.set(0, 7.5, 0);
    archGroup.add(signPlate);
    boardingBridgeGroup.add(archGroup);

    applyCartoonInkOutlines(boardingBridgeGroup, 1.03, true);
    return { root: boardingBridgeGroup };
}

// 15. DOC GREENE'S ANTI-GRAVITY TESTING YARD
export function buildAntiGravTestYardMesh() {
    const testYardGroup = new THREE.Group();

    const testPlinth = new THREE.Mesh(
        new THREE.BoxGeometry(86, 0.5, 60),
        new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 })
    );
    testPlinth.position.y = 0.25;
    testPlinth.receiveShadow = true;
    testYardGroup.add(testPlinth);

    const pBorder = new THREE.Mesh(new THREE.BoxGeometry(87.5, 0.65, 1.2), matHazardYellow);
    pBorder.position.set(0, 0.45, -29.5);
    testYardGroup.add(pBorder);

    const cSignTy = document.createElement('canvas');
    cSignTy.width = 1024;
    cSignTy.height = 128;
    const cCtxTy = cSignTy.getContext('2d')!;
    cCtxTy.fillStyle = '#0f172a';
    cCtxTy.fillRect(0, 0, 1024, 128);
    cCtxTy.strokeStyle = '#84cc16';
    cCtxTy.lineWidth = 6;
    cCtxTy.strokeRect(6, 6, 1012, 116);
    cCtxTy.fillStyle = '#84cc16';
    cCtxTy.font = 'bold 44px Arial, sans-serif';
    cCtxTy.textAlign = 'center';
    cCtxTy.textBaseline = 'middle';
    cCtxTy.fillText("DOC GREENE'S TESTING YARD", 512, 64);
    const texSignTy = new THREE.CanvasTexture(cSignTy);

    const signGroup = new THREE.Group();
    signGroup.position.set(0, 0, -28.5);

    [-10.5, 10.5].forEach(postX => {
        const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 0.6, 8), matDarkSteel);
        footing.position.set(postX, 0.3, 0);
        footing.castShadow = true;
        signGroup.add(footing);

        const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 8.5, 0.7), matSteel);
        post.position.set(postX, 4.25, 0);
        post.castShadow = true;
        signGroup.add(post);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), new THREE.MeshBasicMaterial({ color: 0x84cc16 }));
        beacon.position.set(postX, 8.7, 0);
        beacon.userData.noOutline = true;
        signGroup.add(beacon);
    });

    [4.2, 6.2].forEach(barY => {
        const crossbar = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.32, 0.45), matSteel);
        crossbar.position.set(0, barY, -0.15);
        signGroup.add(crossbar);
    });

    const signBackboard = new THREE.Mesh(new THREE.BoxGeometry(23.6, 3.8, 0.45), matDarkSteel);
    signBackboard.position.set(0, 7.5, 0);
    signBackboard.castShadow = true;
    signGroup.add(signBackboard);

    const tySignFace = new THREE.Mesh(
        new THREE.PlaneGeometry(23.0, 3.4),
        new THREE.MeshBasicMaterial({ map: texSignTy })
    );
    tySignFace.position.set(0, 7.5, 0.24);
    tySignFace.userData.noOutline = true;
    signGroup.add(tySignFace);
    testYardGroup.add(signGroup);

    const bounceGroup = new THREE.Group();
    bounceGroup.position.set(0, 0.5, -7);

    const bounceRim = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.4, 0.85, 16), matDarkSteel);
    bounceRim.position.y = 0.42;
    bounceGroup.add(bounceRim);

    const bounceMembrane = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.2, 0.45, 16),
        new THREE.MeshToonMaterial({ color: 0x84cc16, gradientMap: toonGrad3 })
    );
    bounceMembrane.position.y = 0.85;
    bounceGroup.add(bounceMembrane);

    const bounceRingGlow = new THREE.Mesh(
        new THREE.RingGeometry(3.8, 4.8, 20).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
    );
    bounceRingGlow.position.y = 1.09;
    bounceRingGlow.userData.noOutline = true;
    bounceGroup.add(bounceRingGlow);
    testYardGroup.add(bounceGroup);

    const stripMesh = new THREE.Mesh(
        new THREE.BoxGeometry(80, 0.45, 7.0),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25 })
    );
    stripMesh.position.set(0, 0.48, 19);
    stripMesh.receiveShadow = true;
    testYardGroup.add(stripMesh);

    const chevronMats = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7];
    for (let cx = -34; cx <= 34; cx += 8) {
        const chev = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 4.8).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: chevronMats[Math.abs(cx) % chevronMats.length] })
        );
        chev.position.set(cx, 0.72, 19);
        chev.userData.noOutline = true;
        testYardGroup.add(chev);
    }

    const targetDefs = [
        { id: 0, name: 'Pink Splat Target', lx: 25, lz: -17, color: 0xf43f5e },
        { id: 1, name: 'Cyan Splat Target', lx: -25, lz: -17, color: 0x06b6d4 },
        { id: 2, name: 'Lime Splat Target', lx: 25, lz: 7, color: 0x84cc16 },
        { id: 3, name: 'Orange Splat Target', lx: -25, lz: 7, color: 0xf97316 }
    ];

    const targetEntries: Array<{
        id: number; name: string; lx: number; lz: number; color: number; mesh: THREE.Group;
    }> = [];

    targetDefs.forEach(td => {
        const tGroup = new THREE.Group();
        tGroup.position.set(td.lx, 0.5, td.lz);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.5, 8), matDarkSteel);
        post.position.y = 2.25;
        tGroup.add(post);

        const discOuter = new THREE.Mesh(
            new THREE.CylinderGeometry(2.4, 2.4, 0.45, 16).rotateX(Math.PI / 2),
            new THREE.MeshToonMaterial({ color: td.color, gradientMap: toonGrad3 })
        );
        discOuter.position.y = 4.5;
        tGroup.add(discOuter);

        const discInner = new THREE.Mesh(
            new THREE.CylinderGeometry(1.4, 1.4, 0.5, 16).rotateX(Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        discInner.position.y = 4.5;
        discInner.userData.noOutline = true;
        tGroup.add(discInner);

        const discBull = new THREE.Mesh(
            new THREE.CylinderGeometry(0.65, 0.65, 0.55, 16).rotateX(Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: td.color })
        );
        discBull.position.y = 4.5;
        discBull.userData.noOutline = true;
        tGroup.add(discBull);

        testYardGroup.add(tGroup);
        targetEntries.push({ id: td.id, name: td.name, lx: td.lx, lz: td.lz, color: td.color, mesh: tGroup });
    });

    applyCartoonInkOutlines(testYardGroup, 1.03, true);
    return { root: testYardGroup, bounceMembrane, targetEntries };
}

// 16. VOLCANO RIDGE CALDERA
export function buildVolcanoCalderaMesh() {
    const volcanoGroup = new THREE.Group();

    for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const r = 24 + (i % 2) * 2.5;
        const rimRock = new THREE.Mesh(new THREE.DodecahedronGeometry(5.5 + (i % 3) * 1.5, 0), matBasalt);
        rimRock.position.set(Math.cos(ang) * r, 2.2, Math.sin(ang) * r);
        rimRock.scale.set(1.2, 0.85, 1.1);
        rimRock.castShadow = true;
        volcanoGroup.add(rimRock);
    }

    const volcanoLavaPool = new THREE.Group();
    volcanoLavaPool.position.y = 1.6;
    const lavaOuter = new THREE.Mesh(
        new THREE.CircleGeometry(22.5, 28).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xff4500 })
    );
    lavaOuter.userData.noOutline = true;
    const lavaInner = new THREE.Mesh(
        new THREE.CircleGeometry(14.5, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffbe0b })
    );
    lavaInner.position.y = 0.12;
    lavaInner.userData.noOutline = true;
    volcanoLavaPool.add(lavaOuter, lavaInner);
    volcanoGroup.add(volcanoLavaPool);

    [[-28, 18], [26, -20], [18, 28]].forEach(([vx, vz]) => {
        const ventCone = new THREE.Mesh(new THREE.ConeGeometry(5.2, 7.5, 8, 1, true), matBasalt);
        ventCone.position.set(vx, 3.5, vz);
        volcanoGroup.add(ventCone);
        const ventGlow = new THREE.Mesh(
            new THREE.CircleGeometry(2.6, 12).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xff6b00 })
        );
        ventGlow.position.set(vx, 6.2, vz);
        ventGlow.userData.noOutline = true;
        volcanoGroup.add(ventGlow);
    });

    const volcanoSmokePuffs: THREE.Mesh[] = [];
    const matSmoke = new THREE.MeshToonMaterial({ color: 0x64748b, transparent: true, opacity: 0.72, gradientMap: toonGrad3 });
    for (let i = 0; i < 6; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), matSmoke);
        puff.userData.noOutline = true;
        puff.userData.phase = i / 6;
        volcanoGroup.add(puff);
        volcanoSmokePuffs.push(puff);
    }

    applyCartoonInkOutlines(volcanoGroup, 1.04, false);
    return { root: volcanoGroup, volcanoLavaPool, volcanoSmokePuffs };
}

// 17. NORTH OBSERVATORY & SOLAR ARRAYS
export function buildNorthObservatoryMesh() {
    const observatoryGroup = new THREE.Group();

    const obsBase = new THREE.Mesh(
        new THREE.CylinderGeometry(15.5, 16.8, 12, 16),
        new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 })
    );
    obsBase.position.y = 6.0;
    obsBase.castShadow = true;
    obsBase.receiveShadow = true;
    observatoryGroup.add(obsBase);

    const obsAccentRing = new THREE.Mesh(
        new THREE.CylinderGeometry(16.0, 16.0, 1.8, 16),
        new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad3 })
    );
    obsAccentRing.position.y = 11.5;
    observatoryGroup.add(obsAccentRing);

    const observatoryDomePivot = new THREE.Group();
    observatoryDomePivot.position.y = 12.0;

    const obsDome = new THREE.Mesh(
        new THREE.SphereGeometry(15.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
        matChrome
    );
    obsDome.castShadow = true;
    observatoryDomePivot.add(obsDome);

    const obsSlot = new THREE.Mesh(new THREE.BoxGeometry(4.6, 12.5, 15.8), matDarkSteel);
    obsSlot.position.set(0, 6.2, 4.5);
    observatoryDomePivot.add(obsSlot);

    const telescopeBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(2.1, 2.6, 17, 14).rotateX(Math.PI * 0.32),
        matSteel
    );
    telescopeBarrel.position.set(0, 9.5, 9.5);
    telescopeBarrel.castShadow = true;
    observatoryDomePivot.add(telescopeBarrel);

    const telescopeLens = new THREE.Mesh(
        new THREE.CylinderGeometry(1.9, 1.9, 0.6, 14).rotateX(Math.PI * 0.32),
        matGlass
    );
    telescopeLens.position.set(0, 14.0, 16.5);
    observatoryDomePivot.add(telescopeLens);

    observatoryGroup.add(observatoryDomePivot);

    [-30, 30].forEach(sx => {
        [-12, 12].forEach(sz => {
            const solarPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 4.5, 8), matDarkSteel);
            solarPedestal.position.set(sx, 2.25, sz);
            observatoryGroup.add(solarPedestal);

            const solarPanel = new THREE.Mesh(
                new THREE.BoxGeometry(10.5, 0.35, 6.8),
                new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 })
            );
            solarPanel.position.set(sx, 4.6, sz);
            solarPanel.rotation.x = 0.38;
            solarPanel.castShadow = true;
            observatoryGroup.add(solarPanel);
        });
    });

    applyCartoonInkOutlines(observatoryGroup, 1.035, true);
    return { root: observatoryGroup, observatoryDomePivot };
}

// 18. WIND TURBINE TOWER
export function buildWindTurbineMesh() {
    const turbineGroup = new THREE.Group();

    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 2.2, 34, 12),
        new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 })
    );
    tower.position.y = 17;
    tower.castShadow = true;
    turbineGroup.add(tower);

    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 5.8), matSteel);
    nacelle.position.set(0, 34, 1.0);
    turbineGroup.add(nacelle);

    const rotorHub = new THREE.Group();
    rotorHub.position.set(0, 34, 4.2);
    for (let b = 0; b < 3; b++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b / 3) * Math.PI * 2;
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 13.5, 0.35),
            new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 })
        );
        blade.position.y = 6.8;
        blade.castShadow = true;
        const bladeTip = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.6, 0.38), matContainerRed);
        bladeTip.position.y = 12.2;
        bladePivot.add(blade, bladeTip);
        rotorHub.add(bladePivot);
    }
    turbineGroup.add(rotorHub);

    applyCartoonInkOutlines(turbineGroup, 1.035, true);
    return { root: turbineGroup, rotorHub };
}

// 19. DOC GREENE'S WEST TECH GEODESIC LAB DOME (+ optional turbines)
export function buildWestTechLabMesh(includeTurbines = true) {
    const techLabGroup = new THREE.Group();

    const labRingBase = new THREE.Mesh(
        new THREE.CylinderGeometry(17.5, 18.5, 6.5, 20),
        new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 })
    );
    labRingBase.position.y = 3.25;
    labRingBase.castShadow = true;
    techLabGroup.add(labRingBase);

    const labGlassDome = new THREE.Mesh(
        new THREE.SphereGeometry(16.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
    );
    labGlassDome.position.y = 6.2;
    labGlassDome.userData.noOutline = true;
    techLabGroup.add(labGlassDome);

    const labGeodesicCage = new THREE.Mesh(
        new THREE.SphereGeometry(16.4, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
        new THREE.MeshBasicMaterial({ color: 0xe2e8f0, wireframe: true })
    );
    labGeodesicCage.position.y = 6.2;
    labGeodesicCage.userData.noOutline = true;
    techLabGroup.add(labGeodesicCage);

    const labCorePillar = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 15, 14),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    labCorePillar.position.y = 9.5;
    labCorePillar.userData.noOutline = true;
    techLabGroup.add(labCorePillar);

    applyCartoonInkOutlines(techLabGroup, 1.035, true);

    const rotors: THREE.Group[] = [];
    if (includeTurbines) {
        [[-22, -48], [-28, 0], [-22, 48]].forEach(([wx, wz]) => {
            const turbine = buildWindTurbineMesh();
            turbine.root.position.set(wx, 0, wz);
            techLabGroup.add(turbine.root);
            rotors.push(turbine.rotorHub);
        });
    }

    return { root: techLabGroup, rotors };
}

// 20. SKY ARRAY COMMUNICATIONS TOWER
export function buildSkyCommsArrayMesh() {
    const arrayGroup = new THREE.Group();
    const arrTower = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 5.2, 34, 8), matSteel);
    arrTower.position.y = 17;
    arrTower.castShadow = true;
    arrayGroup.add(arrTower);
    applyCartoonInkOutlines(arrayGroup, 1.04, true);
    return { root: arrayGroup };
}

// 21. DINO RIDGE SANCTUARY ARCH, AMBER SPIRE & BABY DINOS
export function buildDinoRidgeMesh() {
    const dinoRidgeGroup = new THREE.Group();

    const matBone = new THREE.MeshToonMaterial({ color: 0xfef08a, gradientMap: toonGrad3 });
    const archRibGroup = new THREE.Group();
    archRibGroup.position.set(0, 0, 48);

    [-12, 12].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 14, 8), matBone);
        pillar.position.set(px, 7, 0);
        pillar.castShadow = true;
        archRibGroup.add(pillar);
    });
    const topSkull = new THREE.Mesh(new THREE.BoxGeometry(26, 3.2, 4.2), matBone);
    topSkull.position.set(0, 14.5, 0);
    topSkull.castShadow = true;
    archRibGroup.add(topSkull);

    const cSignDr = document.createElement('canvas');
    cSignDr.width = 512;
    cSignDr.height = 128;
    const cCtxDr = cSignDr.getContext('2d')!;
    cCtxDr.fillStyle = '#15803d';
    cCtxDr.fillRect(0, 0, 512, 128);
    cCtxDr.fillStyle = '#fef08a';
    cCtxDr.font = 'bold 44px Arial, sans-serif';
    cCtxDr.textAlign = 'center';
    cCtxDr.textBaseline = 'middle';
    cCtxDr.fillText('DINO RIDGE', 256, 64);
    const texSignDr = new THREE.CanvasTexture(cSignDr);
    const drSignFace = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.2), new THREE.MeshBasicMaterial({ map: texSignDr }));
    drSignFace.position.set(0, 17.2, 0.4);
    drSignFace.userData.noOutline = true;
    archRibGroup.add(drSignFace);
    dinoRidgeGroup.add(archRibGroup);

    const amberSpire = new THREE.Mesh(
        new THREE.OctahedronGeometry(4.8, 0),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    amberSpire.position.set(0, 9.5, 0);
    amberSpire.scale.set(1.0, 2.2, 1.0);
    dinoRidgeGroup.add(amberSpire);

    const amberPedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.8, 5.5, 8), matBasalt);
    amberPedestal.position.set(0, 2.75, 0);
    dinoRidgeGroup.add(amberPedestal);

    const babyDinos: Array<{
        group: THREE.Group; headPivot: THREE.Group; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh;
        tail: THREE.Mesh; phase: number; lx: number; lz: number; name: string;
    }> = [];

    const dinoConfigs = [
        { name: 'Baby Rex', color: 0x22c55e, lx: -22, lz: -12, type: 'TREX' },
        { name: 'Baby Trike', color: 0x0284c7, lx: 22, lz: -12, type: 'TRIKE' },
        { name: 'Baby Bronto', color: 0xf97316, lx: 0, lz: -32, type: 'BRONTO' }
    ];

    dinoConfigs.forEach((cfg, idx) => {
        const dGroup = new THREE.Group();
        dGroup.position.set(cfg.lx, 0, cfg.lz);
        const matDino = new THREE.MeshToonMaterial({ color: cfg.color, gradientMap: toonGrad3 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.2, 5.2), matDino);
        body.position.y = 3.2;
        body.castShadow = true;
        dGroup.add(body);

        const headPivot = new THREE.Group();
        if (cfg.type === 'BRONTO') {
            headPivot.position.set(0, 4.8, 2.2);
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 4.2, 8), matDino);
            neck.position.set(0, 1.8, 0.8);
            neck.rotation.x = -0.3;
            headPivot.add(neck);
            const head = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 2.8), matDino);
            head.position.set(0, 3.8, 1.8);
            headPivot.add(head);
        } else if (cfg.type === 'TRIKE') {
            headPivot.position.set(0, 3.4, 2.8);
            const head = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 3.0), matDino);
            headPivot.add(head);
            const frill = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.5, 8).rotateX(Math.PI / 2), matDino);
            frill.position.set(0, 1.2, -0.6);
            headPivot.add(frill);
            const matHorn = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
            [-0.9, 0.9].forEach(hx => {
                const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6).rotateX(Math.PI / 4), matHorn);
                horn.position.set(hx, 1.4, 1.2);
                headPivot.add(horn);
            });
        } else {
            headPivot.position.set(0, 3.8, 2.6);
            const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 3.8), matDino);
            head.position.set(0, 0.6, 0.6);
            headPivot.add(head);
        }

        const matEyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const matPupil = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        [-1.1, 1.1].forEach(ex => {
            const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), matEyeWhite);
            eyeW.position.set(ex, cfg.type === 'BRONTO' ? 4.0 : 0.8, cfg.type === 'BRONTO' ? 2.6 : 1.8);
            eyeW.userData.noOutline = true;
            const eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), matPupil);
            eyeP.position.set(ex * 1.1, cfg.type === 'BRONTO' ? 4.0 : 0.8, cfg.type === 'BRONTO' ? 2.9 : 2.1);
            eyeP.userData.noOutline = true;
            headPivot.add(eyeW, eyeP);
        });
        dGroup.add(headPivot);

        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.3), matDino);
        leftLeg.position.set(-1.4, 1.1, 0);
        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.3), matDino);
        rightLeg.position.set(1.4, 1.1, 0);
        dGroup.add(leftLeg, rightLeg);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.2, 6).rotateX(-Math.PI / 2.3), matDino);
        tail.position.set(0, 2.8, -3.2);
        dGroup.add(tail);

        dinoRidgeGroup.add(dGroup);
        babyDinos.push({
            group: dGroup,
            headPivot,
            leftLeg,
            rightLeg,
            tail,
            phase: idx * 2.1,
            lx: cfg.lx,
            lz: cfg.lz,
            name: cfg.name
        });
    });

    applyCartoonInkOutlines(dinoRidgeGroup, 1.035, true);
    return { root: dinoRidgeGroup, amberSpire, babyDinos };
}

// 22. SUNNY SANDS BOARDWALK & GIANT FERRIS WHEEL
export function buildBoardwalkMesh() {
    const boardwalkGroup = new THREE.Group();

    const matDeck = new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad3 });
    const bwDeck = new THREE.Mesh(new THREE.BoxGeometry(120, 1.8, 90), matDeck);
    bwDeck.position.set(0, 0.9, 0);
    bwDeck.receiveShadow = true;
    boardwalkGroup.add(bwDeck);

    const matWheelA = new THREE.MeshToonMaterial({ color: 0xef4444, gradientMap: toonGrad3 });
    const matWheelB = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });

    [-7.5, 7.5].forEach(sx => {
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 32, 8).rotateZ(sx > 0 ? -0.22 : 0.22), matWheelA);
        leg1.position.set(sx, 16, -12);
        leg1.castShadow = true;
        boardwalkGroup.add(leg1);
    });

    const ferrisWheelPivot = new THREE.Group();
    ferrisWheelPivot.position.set(0, 31, -12);

    [-1.8, 1.8].forEach(rz => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(18, 0.45, 8, 32), matWheelB);
        rim.position.z = rz;
        ferrisWheelPivot.add(rim);
    });

    const ferrisGondolas: THREE.Group[] = [];
    const gondolaColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899];
    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 36, 0.5), matWheelB);
        spoke.rotation.z = ang;
        ferrisWheelPivot.add(spoke);

        const gPivot = new THREE.Group();
        gPivot.position.set(Math.cos(ang) * 17.5, Math.sin(ang) * 17.5, 0);

        const gMat = new THREE.MeshToonMaterial({ color: gondolaColors[i], gradientMap: toonGrad3 });
        const gCab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.2), gMat);
        gCab.position.y = -1.6;
        gCab.castShadow = true;
        gPivot.add(gCab);

        const gRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4).rotateY(Math.PI / 4), matWheelA);
        gRoof.position.y = 0.6;
        gPivot.add(gRoof);

        ferrisWheelPivot.add(gPivot);
        ferrisGondolas.push(gPivot);
    }
    boardwalkGroup.add(ferrisWheelPivot);

    [[-32, 22], [32, 22], [-32, -22], [32, -22]].forEach(([ux, uz], uIdx) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6.5, 8), matDarkSteel);
        pole.position.set(ux, 4.25, uz);
        boardwalkGroup.add(pole);

        const uMat = new THREE.MeshToonMaterial({ color: gondolaColors[(uIdx * 2) % gondolaColors.length], gradientMap: toonGrad3 });
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.0, 12), uMat);
        canopy.position.set(ux, 7.5, uz);
        canopy.castShadow = true;
        boardwalkGroup.add(canopy);

        const table = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.35, 12), matDeck);
        table.position.set(ux, 3.2, uz);
        boardwalkGroup.add(table);
    });

    applyCartoonInkOutlines(boardwalkGroup, 1.035, true);
    return { root: boardwalkGroup, ferrisWheelPivot, ferrisGondolas };
}

// 23. WAYWARD ISLAND SUSPENSION CAUSEWAY BRIDGE (centered at local 0,0,0 -> in world at 1620, 0, 540)
export function buildSuspensionCausewayMesh() {
    const causewayGroup = new THREE.Group();

    const bridgeDeck = new THREE.Mesh(
        new THREE.BoxGeometry(280, 2.2, 17.5),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
    );
    bridgeDeck.position.set(0, 6.4, 0);
    bridgeDeck.receiveShadow = true;
    causewayGroup.add(bridgeDeck);

    const matBridgeRed = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad3 });
    [-8.2, 8.2].forEach(rz => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(280, 1.4, 0.8), matBridgeRed);
        rail.position.set(0, 8.2, rz);
        causewayGroup.add(rail);
    });

    const matPylonWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
    [-90, 90].forEach(lx => {
        const pGroup = new THREE.Group();
        pGroup.position.set(lx, 0, 0);

        [-8.5, 8.5].forEach(tz => {
            const col = new THREE.Mesh(new THREE.BoxGeometry(3.6, 54, 3.6), matPylonWhite);
            col.position.set(0, 24, tz);
            col.castShadow = true;
            pGroup.add(col);
        });

        const subBeam = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 18), matBridgeRed);
        subBeam.position.set(0, 4.5, 0);
        pGroup.add(subBeam);

        [28, 42, 50].forEach(cy => {
            const cbar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 18), matBridgeRed);
            cbar.position.set(0, cy, 0);
            pGroup.add(cbar);
        });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.set(0, 52, 0);
        beacon.userData.noOutline = true;
        pGroup.add(beacon);

        causewayGroup.add(pGroup);
    });

    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    [-8.5, 8.5].forEach(cz => {
        const cableCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-140, 9, cz),
            new THREE.Vector3(-90, 48, cz),
            new THREE.Vector3(0, 11, cz),
            new THREE.Vector3(90, 48, cz),
            new THREE.Vector3(140, 9, cz)
        ]);
        const cableTube = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 32, 0.45, 6, false), cableMat);
        cableTube.userData.noOutline = true;
        causewayGroup.add(cableTube);
    });

    applyCartoonInkOutlines(causewayGroup, 1.025, false);
    return { root: causewayGroup };
}

// 24. WAYWARD ANCIENT CYBERTRONIAN TEMPLE RUINS
export function buildWaywardRuinsMesh() {
    const ruinsGroup = new THREE.Group();
    const matStone = new THREE.MeshToonMaterial({ color: 0x78716c, gradientMap: toonGrad3 });
    const matGlowingGlyph = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const px = Math.cos(ang) * 26;
        const pz = Math.sin(ang) * 26;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 16, 8), matStone);
        col.position.set(px, 8, pz);
        col.castShadow = true;
        ruinsGroup.add(col);

        const capital = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, 5.2), matStone);
        capital.position.set(px, 16.5, pz);
        ruinsGroup.add(capital);

        const rune = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.5).rotateY(ang + Math.PI / 2), matGlowingGlyph);
        rune.position.set(px * 0.95, 8, pz * 0.95);
        rune.userData.noOutline = true;
        ruinsGroup.add(rune);
    }

    [0, 2, 4].forEach(idx => {
        const ang1 = (idx / 8) * Math.PI * 2;
        const ang2 = ((idx + 1) / 8) * Math.PI * 2;
        const midX = (Math.cos(ang1) + Math.cos(ang2)) * 13;
        const midZ = (Math.sin(ang1) + Math.sin(ang2)) * 13;
        const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 22), matStone);
        beam.position.set(midX, 17.5, midZ);
        beam.rotation.y = -(ang1 + ang2) / 2;
        beam.castShadow = true;
        ruinsGroup.add(beam);
    });

    const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 8.2, 3.5, 8), matStone);
    altarBase.position.y = 1.75;
    ruinsGroup.add(altarBase);

    const waywardEnergonShard = new THREE.Mesh(
        new THREE.OctahedronGeometry(5.2, 0),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    waywardEnergonShard.position.y = 7.5;
    waywardEnergonShard.scale.set(1.0, 1.8, 1.0);
    ruinsGroup.add(waywardEnergonShard);

    applyCartoonInkOutlines(ruinsGroup, 1.03, true);
    return { root: ruinsGroup, waywardEnergonShard };
}

// 25. WAYWARD ISLAND SHIPWRECK HULL
export function buildWaywardShipwreckMesh() {
    const shipGroup = new THREE.Group();
    const matShipWood = new THREE.MeshToonMaterial({ color: 0x713f12, gradientMap: toonGrad3 });

    for (let r = -4; r <= 4; r++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.75, 6, 16, Math.PI), matShipWood);
        rib.position.x = r * 4.5;
        rib.rotation.y = Math.PI / 2;
        rib.castShadow = true;
        shipGroup.add(rib);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 28, 8), matShipWood);
    mast.position.set(2, 12, 0);
    mast.rotation.z = -0.35;
    mast.castShadow = true;
    shipGroup.add(mast);

    applyCartoonInkOutlines(shipGroup, 1.03, true);
    return { root: shipGroup };
}

// 26. WAYWARD ISLAND SEA CRYSTAL GROTTO
export function buildWaywardGrottoMesh() {
    const grottoGroup = new THREE.Group();
    const matGrottoRock = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });

    const archLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 24, 16), matGrottoRock);
    archLeft.position.set(-14, 12, 0);
    grottoGroup.add(archLeft);
    const archRight = new THREE.Mesh(new THREE.BoxGeometry(8, 24, 16), matGrottoRock);
    archRight.position.set(14, 12, 0);
    grottoGroup.add(archRight);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(36, 8, 16), matGrottoRock);
    archTop.position.set(0, 24, 0);
    grottoGroup.add(archTop);

    const caveFloor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 1.2, 16), matGrottoRock);
    caveFloor.position.set(0, 0.6, -18);
    grottoGroup.add(caveFloor);

    const matPurpleCrystal = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const matCyanCrystal = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let c = 0; c < 7; c++) {
        const cAng = (c / 7) * Math.PI * 2;
        const crMat = c % 2 === 0 ? matPurpleCrystal : matCyanCrystal;
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.4 + (c % 3) * 0.8, 0), crMat);
        crystal.position.set(Math.cos(cAng) * 16, 2.5 + (c % 3), -18 + Math.sin(cAng) * 16);
        crystal.scale.set(0.6, 2.2, 0.6);
        crystal.userData.noOutline = true;
        grottoGroup.add(crystal);
    }

    applyCartoonInkOutlines(grottoGroup, 1.03, true);
    return { root: grottoGroup };
}

// 27. WAYWARD ISLAND SCENIC T-DOCK PIER
export function buildWaywardPierMesh() {
    const waywardPierGroup = new THREE.Group();

    const matPierWood = new THREE.MeshToonMaterial({ color: 0xb45309, gradientMap: toonGrad3 });
    const matPierDark = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });
    const matPierLantern = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const waywardPierDeck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 64), matPierWood);
    waywardPierDeck.position.set(0, 2.2, 0);
    waywardPierDeck.receiveShadow = true;
    waywardPierGroup.add(waywardPierDeck);

    const tDockDeck = new THREE.Mesh(new THREE.BoxGeometry(34, 1.6, 14), matPierWood);
    tDockDeck.position.set(0, 2.2, 28);
    tDockDeck.receiveShadow = true;
    waywardPierGroup.add(tDockDeck);

    [-8.2, 8.2].forEach(rx => {
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 56), matPierDark);
        topRail.position.set(rx, 3.6, -2);
        waywardPierGroup.add(topRail);
    });

    for (let pz = -26; pz <= 30; pz += 9.5) {
        [-7.2, 7.2].forEach(px => {
            const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 16, 8), matPierDark);
            pile.position.set(px, -4.5, pz);
            waywardPierGroup.add(pile);
        });
    }
    [-15.5, 15.5].forEach(px => {
        [-5, 5].forEach(pzOff => {
            const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 16, 8), matPierDark);
            pile.position.set(px, -4.5, 28 + pzOff);
            waywardPierGroup.add(pile);
        });
    });

    for (let pz = -22; pz <= 26; pz += 16) {
        [-8.2, 8.2].forEach(px => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 0.4), matPierDark);
            post.position.set(px, 3.2, pz);
            waywardPierGroup.add(post);

            const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.65), matPierLantern);
            lantern.position.set(px, 4.4, pz);
            lantern.userData.noOutline = true;
            waywardPierGroup.add(lantern);
        });
    }

    applyCartoonInkOutlines(waywardPierGroup, 1.025, true);
    return { root: waywardPierGroup };
}

// 28. STUNT RAMP WEDGE
export function buildStuntRampMesh(
    w = 12,
    l = 18,
    rampHeight = 3.2,
    cornerOffsets = { el: 0, er: 0, ll: 0, lr: 0, minOffset: -1.8 }
) {
    const hw = w * 0.5;
    const hl = l * 0.5;
    const lyEL = cornerOffsets.el;
    const lyER = cornerOffsets.er;
    const lyLL = cornerOffsets.ll + rampHeight;
    const lyLR = cornerOffsets.lr + rampHeight;
    const lyBottom = cornerOffsets.minOffset;

    const P0: [number, number, number] = [-hw, lyEL, -hl];
    const P1: [number, number, number] = [hw, lyER, -hl];
    const P2: [number, number, number] = [hw, lyLR, hl];
    const P3: [number, number, number] = [-hw, lyLL, hl];
    const P4: [number, number, number] = [-hw, lyBottom, -hl];
    const P5: [number, number, number] = [hw, lyBottom, -hl];
    const P6: [number, number, number] = [hw, lyBottom, hl];
    const P7: [number, number, number] = [-hw, lyBottom, hl];

    const faces = [
        { pts: [P0, P2, P1], uvs: [[0, 0], [1, 3], [1, 0]] },
        { pts: [P0, P3, P2], uvs: [[0, 0], [0, 3], [1, 3]] },
        { pts: [P3, P6, P2], uvs: [[0, 1], [1, 0], [1, 1]] },
        { pts: [P3, P7, P6], uvs: [[0, 1], [0, 0], [1, 0]] },
        { pts: [P0, P7, P3], uvs: [[0, 0], [3, 0], [3, 1]] },
        { pts: [P0, P4, P7], uvs: [[0, 0], [0, 0], [3, 0]] },
        { pts: [P1, P2, P6], uvs: [[0, 0], [3, 1], [3, 0]] },
        { pts: [P1, P6, P5], uvs: [[0, 0], [3, 0], [0, 0]] },
        { pts: [P1, P4, P0], uvs: [[1, 0.2], [0, 0], [0, 0.2]] },
        { pts: [P1, P5, P4], uvs: [[1, 0.2], [1, 0], [0, 0]] },
        { pts: [P4, P6, P7], uvs: [[0, 0], [1, 1], [0, 1]] },
        { pts: [P4, P5, P6], uvs: [[0, 0], [1, 0], [1, 1]] }
    ];

    const positions = new Float32Array(36 * 3);
    const uvs = new Float32Array(36 * 2);
    let pIdx = 0;
    let uIdx = 0;
    for (let f = 0; f < faces.length; f++) {
        const face = faces[f];
        for (let i = 0; i < 3; i++) {
            positions[pIdx++] = face.pts[i][0];
            positions[pIdx++] = face.pts[i][1];
            positions[pIdx++] = face.pts[i][2];
            uvs[uIdx++] = face.uvs[i][0];
            uvs[uIdx++] = face.uvs[i][1];
        }
    }

    const rampGeo = new THREE.BufferGeometry();
    rampGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rampGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    rampGeo.computeVertexNormals();

    const ramp = new THREE.Mesh(rampGeo, new THREE.MeshToonMaterial({ map: texHazard, gradientMap: toonGrad3 }));
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    applyCartoonInkOutlines(ramp, 1.03, true);
    return { root: ramp };
}

// 29. SKY STUNT HOOP RING
export function buildSkyStuntHoopMesh(radius = 6.5, color = 0x38bdf8) {
    const hGroup = new THREE.Group();

    const torusGeo = new THREE.TorusGeometry(radius, 0.48, 12, 36);
    const torusMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.userData.noOutline = true;
    hGroup.add(torusMesh);

    const haloGeo = new THREE.RingGeometry(radius * 0.94, radius * 1.06, 32);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.userData.noOutline = true;
    hGroup.add(haloMesh);

    const starPivot = new THREE.Group();
    for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const chev = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.0, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        chev.position.set(Math.cos(ang) * (radius - 1.1), Math.sin(ang) * (radius - 1.1), 0);
        chev.rotation.z = ang - Math.PI / 2;
        chev.userData.noOutline = true;
        starPivot.add(chev);
    }
    hGroup.add(starPivot);

    return { root: hGroup, torusMesh, haloMesh, starPivot };
}

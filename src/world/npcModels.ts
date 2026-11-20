// Pure Zero-Side-Effect 3D Builders for Griffin Rock Citizens & Civilian Vehicles
import * as THREE from 'three';
import {
    toonGrad3,
    matChrome,
    matTire,
    matNPCHeadlightOff,
    matNPCTaillightOff,
    matNPCBeam,
    matNPCBeamPool,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { texWindshieldCyan } from '../rendering/textures.js';

export function createHumanNPCMesh(cfg: Record<string, any> = {}) {
    const root = new THREE.Group();

    const matSkin = new THREE.MeshToonMaterial({ color: cfg.skinColor || 0xfde047, gradientMap: toonGrad3 });
    const matShirt = new THREE.MeshToonMaterial({ color: cfg.shirtColor || 0x2563eb, gradientMap: toonGrad3 });
    const matPants = new THREE.MeshToonMaterial({ color: cfg.pantsColor || 0x1e293b, gradientMap: toonGrad3 });
    const matHair = new THREE.MeshToonMaterial({ color: cfg.hairColor || 0x78350f, gradientMap: toonGrad3 });
    const matIndicator = new THREE.MeshBasicMaterial({ color: cfg.indicatorColor || 0x38bdf8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.68), matShirt);
    torso.position.y = 2.15;
    torso.castShadow = true;
    root.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), matSkin);
    head.position.y = 3.45;
    head.castShadow = true;
    root.add(head);

    const eyeGeo = new THREE.BoxGeometry(0.14, 0.16, 0.08);
    const matEye = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(eyeGeo, matEye);
    leftEye.position.set(-0.22, 0.1, 0.48);
    leftEye.userData.noOutline = true;
    const rightEye = new THREE.Mesh(eyeGeo, matEye);
    rightEye.position.set(0.22, 0.1, 0.48);
    rightEye.userData.noOutline = true;
    const smile = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.08), matEye);
    smile.position.set(0, -0.18, 0.48);
    smile.userData.noOutline = true;
    head.add(leftEye, rightEye, smile);

    const hairCap = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.36, 1.08), matHair);
    hairCap.position.set(0, 0.44, 0);
    head.add(hairCap);
    if (cfg.hasVisorHat) {
        const brim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.12, 0.45), matHair);
        brim.position.set(0, 0.32, 0.62);
        head.add(brim);
    }

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.78, 2.75, 0);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.25, 0.38), matShirt);
    leftArm.position.y = -0.52;
    leftArmPivot.add(leftArm);
    root.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.78, 2.75, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.25, 0.38), matShirt);
    rightArm.position.y = -0.52;
    rightArmPivot.add(rightArm);
    root.add(rightArmPivot);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.32, 1.42, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.38, 0.46), matPants);
    leftLeg.position.y = -0.68;
    leftLegPivot.add(leftLeg);
    root.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.32, 1.42, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.38, 0.46), matPants);
    rightLeg.position.y = -0.68;
    rightLegPivot.add(rightLeg);
    root.add(rightLegPivot);

    const radioGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), matIndicator);
    radioGem.position.y = 4.85;
    root.add(radioGem);

    root.scale.setScalar(1.22);
    applyCartoonInkOutlines(root, 1.06, false);

    return {
        root,
        head,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
        radioGem
    };
}

export function createCivilianVehicleMesh(vType: string, bodyColorHex: number) {
    const root = new THREE.Group();
    const matBody = new THREE.MeshToonMaterial({ color: bodyColorHex, gradientMap: toonGrad3 });
    const matCabinGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });
    const matBumper = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad3 });

    const wheels: THREE.Group[] = [];
    function addWheelPair(zPos: number, radius = 0.85, xSpread = 2.05) {
        [-xSpread, xSpread].forEach(xSide => {
            const wGroup = new THREE.Group();
            wGroup.position.set(xSide, radius, zPos);
            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, 0.65, 12).rotateZ(Math.PI / 2),
                matTire
            );
            const hub = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, 0.70, 10).rotateZ(Math.PI / 2),
                matChrome
            );
            wGroup.add(tire, hub);
            root.add(wGroup);
            wheels.push(wGroup);
        });
    }

    if (vType === 'BUS') {
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.3, 10.2), matBody);
        chassis.position.set(0, 2.35, 0);
        chassis.castShadow = true;
        root.add(chassis);

        const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(3.9, 1.45, 0.2), matCabinGlass);
        frontGlass.position.set(0, 2.85, 5.12);
        root.add(frontGlass);

        const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(4.48, 1.25, 8.2), matCabinGlass);
        sideWindows.position.set(0, 2.85, -0.2);
        root.add(sideWindows);

        addWheelPair(3.2, 0.98, 2.15);
        addWheelPair(-3.2, 0.98, 2.15);
    } else if (vType === 'VAN') {
        const lower = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 7.2), matBody);
        lower.position.set(0, 1.85, 0);
        lower.castShadow = true;
        root.add(lower);

        const windshield = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.2, 1.8), matCabinGlass);
        windshield.position.set(0, 2.55, 2.4);
        root.add(windshield);

        addWheelPair(2.2, 0.85, 1.9);
        addWheelPair(-2.2, 0.85, 1.9);
    } else if (vType === 'PICKUP') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.35, 7.4), matBody);
        body.position.set(0, 1.45, 0);
        body.castShadow = true;
        root.add(body);

        const cab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.35, 3.1), matBody);
        cab.position.set(0, 2.65, 0.75);
        cab.castShadow = true;
        root.add(cab);

        const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(3.58, 0.95, 2.5), matCabinGlass);
        cabGlass.position.set(0, 2.7, 0.85);
        root.add(cabGlass);

        addWheelPair(2.3, 0.92, 1.95);
        addWheelPair(-2.2, 0.92, 1.95);
    } else {
        const lower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.15, 6.6), matBody);
        lower.position.set(0, 1.25, 0);
        lower.castShadow = true;
        root.add(lower);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.15, 3.5), matBody);
        cabin.position.set(0, 2.25, -0.2);
        cabin.castShadow = true;
        root.add(cabin);

        const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.85, 2.9), matCabinGlass);
        cabinGlass.position.set(0, 2.28, -0.15);
        root.add(cabinGlass);

        addWheelPair(2.0, 0.82, 1.82);
        addWheelPair(-2.0, 0.82, 1.82);
    }

    const frontZ = vType === 'BUS' ? 5.15 : (vType === 'PICKUP' ? 3.72 : (vType === 'VAN' ? 3.62 : 3.32));
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.38, 0.35), matBumper);
    bumper.position.set(0, 0.85, frontZ);
    root.add(bumper);

    const headlights: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];

    [-1.25, 1.25].forEach(lx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.2), matNPCHeadlightOff);
        hl.position.set(lx, 1.35, frontZ + 0.05);
        root.add(hl);
        headlights.push(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.2), matNPCTaillightOff);
        tl.position.set(lx, 1.35, -frontZ - 0.05);
        root.add(tl);
        taillights.push(tl);
    });

    const beamGroup = new THREE.Group();
    [-1.25, 1.25].forEach(lx => {
        const beamGeo = new THREE.BufferGeometry();
        const posArr = new Float32Array([
            lx - 0.35, 1.35, frontZ,
            lx + 0.35, 1.35, frontZ,
            lx - 1.75, 0.14, frontZ + 18.0,

            lx + 0.35, 1.35, frontZ,
            lx + 1.75, 0.14, frontZ + 18.0,
            lx - 1.75, 0.14, frontZ + 18.0
        ]);
        beamGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        beamGeo.computeVertexNormals();
        const beamMesh = new THREE.Mesh(beamGeo, matNPCBeam);
        beamMesh.userData.noOutline = true;
        beamGroup.add(beamMesh);

        const poolGeo = new THREE.PlaneGeometry(3.6, 13.0);
        poolGeo.rotateX(-Math.PI / 2);
        const poolMesh = new THREE.Mesh(poolGeo, matNPCBeamPool);
        poolMesh.position.set(lx * 0.9, 0.10, frontZ + 9.5);
        poolMesh.userData.noOutline = true;
        beamGroup.add(poolMesh);
    });
    beamGroup.visible = false;
    root.add(beamGroup);

    applyCartoonInkOutlines(root, 1.055, true);
    return { root, wheels, headlights, taillights, beamGroup };
}

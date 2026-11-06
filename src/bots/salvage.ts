// 3D Cel-Shaded Model & Morph Builder for SALVAGE
import * as THREE from 'three';

export function buildSalvage(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Salvage: Electric Lime-Green Cab & Helmet, Royal Blue Shoulders & Hopper, Safety Orange Loader Arms, Charcoal Steel Chassis & Stacked Dual Leg Tires!
                // 1. Torso: Electric Lime Cab Chest with Split Aqua Windshields & Iconic Green Recycling Symbol
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.95, 2.35, 2.15), matSalvageLime);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Two Safety Orange Angled Beacons/Fins on Rear Roof Corners
                [-0.86, 0.86].forEach(bx => {
                    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.65), matSalvageOrange);
                    beacon.position.set(bx, 1.25, -0.45);
                    beacon.rotation.x = -0.32;
                    parts.torso.add(beacon);
                });

                // Dual Aqua Windshields
                [-0.72, 0.72].forEach(wx => {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.88, 0.14), matCabGlass);
                    win.position.set(wx, 0.52, 1.10);
                    win.userData.noOutline = true;
                    parts.torso.add(win);
                });

                // Center Lime Windshield Pillar
                const winPost = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.94, 0.16), matSalvageLime);
                winPost.position.set(0, 0.52, 1.11);
                parts.torso.add(winPost);

                // Center Chest Panel with Universal 3-Arrow Green Recycling Symbol ♻
                const recycleBadge = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.92, 0.16), matSalvageRecycle);
                recycleBadge.position.set(0, -0.25, 1.12);
                recycleBadge.userData.noOutline = true;
                parts.torso.add(recycleBadge);

                // Charcoal Grey Heavy Bumper with 4 Round Blue Headlights & Blue Side Louvers
                const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.78, 0.55), matSalvageSteel);
                bumper.position.set(0, -0.88, 1.05);
                parts.torso.add(bumper);

                // 4 Round Cyan/Blue Fog Headlights (2 on left, 2 on right)
                [-1.05, -0.72, 0.72, 1.05].forEach(lx => {
                    const light = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.16, 0.16, 0.15, 12).rotateX(Math.PI / 2),
                        matSalvageAqua
                    );
                    light.position.set(lx, -0.72, 1.34);
                    light.userData.noOutline = true;
                    parts.torso.add(light);
                });

                // Royal Blue Cooling Louvers on Lower Flanks
                [-1.48, 1.48].forEach(lx => {
                    const louvers = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.85), matSalvageBlue);
                    louvers.position.set(lx, -0.72, 0.45);
                    parts.torso.add(louvers);
                });

                // Pelvis: Charcoal Radiator Core with 3 Vertical Slats
                const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.65, 1.45), matSalvageSteel);
                pelvis.position.set(0, -1.22, 0);
                parts.torso.add(pelvis);

                [-0.42, 0, 0.42].forEach(px => {
                    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.16), matSalvageLightSteel);
                    slat.position.set(px, -1.22, 0.75);
                    parts.torso.add(slat);
                });

                // 2. Head: Lime Helmet, Silver Brow & Ears, Amber Optics & Lime Chin Guard
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.36, 1.28), matSalvageLime);
                helm.castShadow = true;
                parts.head.add(helm);

                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.98, 1.29), matSalvageFace);
                faceMesh.position.set(0, 0.05, 0.05);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // Silver Brow Cap
                const browCap = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.22, 0.45), matSalvageLightSteel);
                browCap.position.set(0, 0.58, 0.54);
                parts.head.add(browCap);

                // Cylindrical Ear Communication Pods
                [-0.72, 0.72].forEach(ex => {
                    const ear = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.22, 0.22, 0.18, 12).rotateZ(Math.PI / 2),
                        matSalvageLightSteel
                    );
                    ear.position.set(ex, 0.08, 0.04);
                    parts.head.add(ear);
                });

                // Sculpted Lime Chin / Scoop Jaw Guard
                const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.42, 0.42), matSalvageLime);
                chinGuard.position.set(0, -0.46, 0.58);
                parts.head.add(chinGuard);

                // 3. Back Attachment: Royal Blue Recycling Hopper Backpack with Orange Forklift Loader Arms!
                const hopper = new THREE.Mesh(new THREE.BoxGeometry(2.85, 2.35, 1.75), matSalvageBlue);
                hopper.position.set(0, 0.28, -0.85);
                hopper.castShadow = true;
                parts.backAttachment.add(hopper);

                // Curved Hopper Roof Ridges
                [-0.55, 0, 0.55].forEach(rx => {
                    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 1.65), matSalvageBlue);
                    rib.position.set(rx, 1.48, -0.85);
                    parts.backAttachment.add(rib);
                });

                // Articulated Safety Orange Hydraulic Loader Arms (The iconic dumpster lifting arms!)
                [-1.52, 1.52].forEach(side => {
                    const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 10).rotateZ(Math.PI / 2), matSalvageOrange);
                    armBase.position.set(side * 1.52, 0.25, -0.65);

                    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.55, 0.38), matSalvageOrange);
                    upperArm.position.set(side * 1.52, 0.72, -0.35);
                    upperArm.rotation.x = -0.42;

                    const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 10).rotateZ(Math.PI / 2), matSalvageOrange);
                    elbow.position.set(side * 1.52, 1.35, -0.05);

                    const reachArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 1.65), matSalvageOrange);
                    reachArm.position.set(side * 1.52, 1.25, 0.65);
                    reachArm.rotation.x = 0.12;

                    // Front Forklift Lifting Prongs
                    const prong = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.72), matSalvageOrange);
                    prong.position.set(side * 1.52, 1.15, 1.62);
                    prong.rotation.x = 0.28;

                    parts.backAttachment.add(armBase, upperArm, elbow, reachArm, prong);
                });

                // 4. Arms: Royal Blue Pauldrons, Steel Biceps & Royal Blue Heavy Gauntlets (Image 1)
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;

                    // Massive Royal Blue Shoulder Pauldrons
                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.35, 1.35), matSalvageBlue);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    // Charcoal side exhaust vent
                    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.85), matSalvageSteel);
                    vent.position.set(side * 0.68, 0, 0);
                    armG.add(vent);

                    forearmG.position.set(0, -1.15, 0);
                    armG.add(forearmG);

                    // Steel Bicep Joint
                    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.75, 10), matSalvageSteel);
                    bicep.position.set(0, 0.25, 0);

                    // Heavy Royal Blue Forearm Gauntlet
                    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.35, 1.18), matSalvageBlue);
                    gauntlet.position.set(0, -0.48, 0.05);
                    gauntlet.castShadow = true;

                    // Charcoal Steel Fist
                    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.58, 0.82), matSalvageSteel);
                    fist.position.set(0, -1.18, 0.05);

                    forearmG.add(bicep, gauntlet, fist);
                });

                // 5. Legs: STACKED DUAL BLACK TIRES ON THIGHS & SHINS + LIME-GREEN BOOTS (Exact Image 1)
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;

                    // Charcoal Heavy Structural Leg Frame
                    const thighFrame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.35, 1.15), matSalvageSteel);
                    thighFrame.position.set(-side * 0.05, -0.48, -0.15);
                    legG.add(thighFrame);

                    const shinFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.35, 1.25), matSalvageSteel);
                    shinFrame.position.set(-side * 0.08, -1.45, -0.15);
                    shinFrame.castShadow = true;
                    legG.add(shinFrame);

                    // Bright Electric Lime-Green Boots (Image 1) with Grooved Toecaps
                    const boot = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.58, 1.95), matSalvageLime);
                    boot.position.set(-side * 0.08, -2.52, 0.22);
                    boot.castShadow = true;

                    const toeGroove = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 0.65), matSalvageLime);
                    toeGroove.position.set(-side * 0.08, -2.48, 0.95);
                    legG.add(boot, toeGroove);

                    // Wheel Mount carrying the stacked tires
                    const wheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;
                    wheelMount.position.set(side * 0.45, 0, 0.35);
                    legG.add(wheelMount);

                    // 2 Stacked Massive Truck Tires per leg (1 on Thigh, 1 on Shin)
                    // Exactly as shown in Reference Image 1!
                    [-0.55, -1.75].forEach(wy => {
                        const tireAssembly = new THREE.Group();
                        tireAssembly.position.set(0, wy, 0);

                        const tire = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.72, 0.72, 0.62, 16).rotateZ(Math.PI / 2),
                            matTire
                        );
                        tire.castShadow = true;

                        const hub = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.42, 0.42, 0.66, 12).rotateZ(Math.PI / 2),
                            matSalvageLightSteel
                        );
                        tireAssembly.add(tire, hub);

                        wheelMount.add(tireAssembly);
                        parts.wheels.push(tireAssembly);
                    });
                });

                // 5. Ankylosaurus Dinobot Mode (Heavy Armored Carapace, Spiked Skull & Heavy Wrecking Club Tail)
                const ankyShell = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.45, 2.85), matSalvageLime);
                ankyShell.position.set(0, 2.55, 0);
                parts.dinoGroup.add(ankyShell);

                [-1.15, 0, 1.15].forEach(sx => {
                    [-1.0, 0, 1.0].forEach(sz => {
                        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 4).rotateZ(sx * -0.2), matSalvageSteel);
                        spike.position.set(sx, 2.85, sz);
                        parts.dinoGroup.add(spike);
                    });
                });

                const ankySkull = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.15, 1.85), matSalvageLime);
                ankySkull.position.set(0, 0.15, 0.65);
                parts.dinoHead.add(ankySkull);

                const ankyPlate = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.35, 1.45), matSalvageBlue);
                ankyPlate.position.set(0, 0.65, 0.45);
                parts.dinoHead.add(ankyPlate);

                [-0.85, 0.85].forEach(hx => {
                    const topHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 4).rotateX(-0.45).rotateZ(hx * -0.35), matSalvageSteel);
                    topHorn.position.set(hx, 0.65, 0.05);
                    const cheekHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 4).rotateZ(hx * -Math.PI / 2), matSalvageSteel);
                    cheekHorn.position.set(hx * 1.1, 0, 0.35);
                    parts.dinoHead.add(topHorn, cheekHorn);
                });

                const ankyVisor = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.28, 0.45), matSalvageAqua);
                ankyVisor.position.set(0, 0.28, 0.95);
                ankyVisor.userData.noOutline = true;
                const ankyBeak = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 0.65), matSalvageSteel);
                ankyBeak.position.set(0, -0.15, 1.55);
                parts.dinoHead.add(ankyVisor, ankyBeak);

                let prevAnkyTail = parts.dinoTail;
                for (let s = 0; s < 4; s++) {
                    const seg = new THREE.Group();
                    seg.position.set(0, 0, -0.75);
                    const sz = 1.25 - s * 0.18;
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.85, 0.85), matSalvageLime);
                    mesh.position.set(0, 0, -0.38);
                    const band = new THREE.Mesh(new THREE.BoxGeometry(sz * 1.05, 0.18, 0.45), matSalvageSteel);
                    band.position.set(0, sz * 0.4, -0.38);
                    seg.add(mesh, band);
                    prevAnkyTail.add(seg);
                    prevAnkyTail = seg;
                }

                const clubGroup = new THREE.Group();
                clubGroup.position.set(0, 0, -0.95);
                [-0.45, 0.45].forEach(lx => {
                    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), matSalvageSteel);
                    lobe.scale.set(1.15, 0.75, 1.35);
                    lobe.position.set(lx, 0, 0);
                    clubGroup.add(lobe);
                });
                const clubCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.25, 8).rotateZ(Math.PI / 2), matSalvageLightSteel);
                clubGroup.add(clubCenter);
                prevAnkyTail.add(clubGroup);
}

export default buildSalvage;

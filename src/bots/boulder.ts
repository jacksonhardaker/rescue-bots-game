// 3D Cel-Shaded Model & Morph Builder for BOULDER
import * as THREE from 'three';
import { texFaceBoulder } from '../rendering/textures.js';

export function buildBoulder(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show Boulder: Vibrant Chartreuse-Lime Green (#76d31b), Construction Yellow (#ffcc00) & Silver Trim
                const matGreen = new THREE.MeshToonMaterial({ color: 0x76d31b, gradientMap: toonGrad4 });
                const matYellow = new THREE.MeshToonMaterial({ color: 0xffcc00, gradientMap: toonGrad4 });
                const matFace = new THREE.MeshBasicMaterial({ map: texFaceBoulder });

                // 1. Stocky Heroic Torso & Main Bulldozer Frame
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.82, 2.38, 2.15), matGreen);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Sculpted Yellow & Dark-Steel Waist / Pelvis Block
                const waistBlock = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.48, 1.92), matYellow);
                waistBlock.position.set(0, -1.25, 0);
                parts.torso.add(waistBlock);

                // Silver-White TV Show Chest Stripe & Rescue Bots Emblem
                const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.42, 2.18), matChrome);
                chestStripe.position.set(0, -0.35, 0);
                parts.torso.add(chestStripe);

                const emblemPlate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 2.22), matEmblem);
                emblemPlate.position.set(0, 0.28, 0);
                emblemPlate.userData.noOutline = true;
                parts.torso.add(emblemPlate);

                // 2. Sliding Bulldozer Operator Cab (`dozerCabMount`) on Upper Back/Collar
                //    (Retracted behind Boulder's collar in Bot mode -> Slides up & forward over his retracted head in Bulldozer mode!)
                parts.torso.add(parts.dozerCabMount);
                const cabPillars = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.38, 1.48), matGreen);
                cabPillars.castShadow = true;
                parts.dozerCabMount.add(cabPillars);

                const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(1.94, 1.06, 1.22), matCabGlass);
                cabWindshield.position.set(0, 0.08, 0.04);
                cabWindshield.userData.noOutline = true;
                parts.dozerCabMount.add(cabWindshield);

                // ROPS Yellow Roof Canopy & 4 Floodlights
                const cabRoofCap = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.24, 1.62), matYellow);
                cabRoofCap.position.set(0, 0.74, 0);
                cabRoofCap.castShadow = true;
                parts.dozerCabMount.add(cabRoofCap);

                [-0.62, -0.22, 0.22, 0.62].forEach(lx => {
                    const cabLight = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.22), matVisorGold);
                    cabLight.position.set(lx, 0.82, 0.78);
                    parts.dozerCabMount.add(cabLight);
                });

                // Chrome ROPS Grab Rails on Cab Sides
                [-0.98, 0.98].forEach(rx => {
                    const grabRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.15, 8), matChrome);
                    grabRail.position.set(rx, 0.05, 0.58);
                    parts.dozerCabMount.add(grabRail);
                });

                // 3. Rear Engine Deck, Counterweight & Articulated Exhaust Stacks (`parts.backAttachment`)
                //    (Compact backpack with shoulder smokestacks in Bot mode -> Shifts back into the Rear Bulldozer Engine Bay & Counterweight in Vehicle mode!)
                const rearEngineBay = new THREE.Mesh(new THREE.BoxGeometry(2.58, 1.44, 1.68), matGreen);
                rearEngineBay.castShadow = true;
                parts.backAttachment.add(rearEngineBay);

                const rearRadiatorVent = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.96, 1.72), matGrille);
                rearRadiatorVent.position.set(0, 0.08, -0.02);
                rearRadiatorVent.userData.noOutline = true;
                parts.backAttachment.add(rearRadiatorVent);

                const rearCounterweight = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.78, 0.56), matYellow);
                rearCounterweight.position.set(0, -0.38, -0.82);
                rearCounterweight.castShadow = true;
                parts.backAttachment.add(rearCounterweight);

                const rearHazardStrip = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.34, 0.60), matHazardMat);
                rearHazardStrip.position.set(0, -0.38, -0.84);
                rearHazardStrip.userData.noOutline = true;
                parts.backAttachment.add(rearHazardStrip);

                [-0.96, 0.96].forEach(tx => {
                    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.16), matSirenRed);
                    tailLight.position.set(tx, 0.28, -0.84);
                    parts.backAttachment.add(tailLight);
                });

                // Articulated Dual Chrome Exhaust Stacks (shift from behind shoulders to beside the front cab hood!)
                parts.backAttachment.add(parts.exhaustStacks);
                [-1.08, 1.08].forEach(sx => {
                    const mufflerBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 1.35, 10), matChrome);
                    mufflerBarrel.position.set(sx, 0, 0);
                    parts.exhaustStacks.add(mufflerBarrel);

                    const upperPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.15, 10), matChrome);
                    upperPipe.position.set(sx, 1.12, 0);
                    parts.exhaustStacks.add(upperPipe);

                    const rainCap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.38), matChrome);
                    rainCap.position.set(sx, 1.72, -0.04);
                    rainCap.rotation.x = 0.25;
                    parts.exhaustStacks.add(rainCap);
                });

                // 4. Front Sloped Radiator Grille & Engine Nose Hood (`parts.frontAttachment`)
                const noseBlock = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.34, 1.65), matGreen);
                noseBlock.castShadow = true;
                parts.frontAttachment.add(noseBlock);

                const noseTopSlope = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.32, 1.52), matYellow);
                noseTopSlope.position.set(0, 0.68, -0.02);
                parts.frontAttachment.add(noseTopSlope);

                const noseGrille = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.92, 0.24), matGrille);
                noseGrille.position.set(0, -0.04, 0.74);
                noseGrille.userData.noOutline = true;
                parts.frontAttachment.add(noseGrille);

                [-0.86, 0.86].forEach(hx => {
                    const noseLight = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.22), matVisorGold);
                    noseLight.position.set(hx, 0.22, 0.78);
                    parts.frontAttachment.add(noseLight);
                });

                // 5. Clean Expressive Robot Head (`parts.head` - TV Show Accurate with Triple Silver Crown)
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.28, 1.34), matGreen);
                helm.castShadow = true;
                parts.head.add(helm);

                // Triple-Crested Silver Rock-Splitter Crown on Top of Helmet (Matching Cartoon)
                const centerCrest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.96), matChrome);
                centerCrest.position.set(0, 0.78, 0);
                parts.head.add(centerCrest);
                [-0.38, 0.38].forEach(cx => {
                    const sideCrest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.82), matChrome);
                    sideCrest.position.set(cx, 0.71, 0);
                    parts.head.add(sideCrest);
                });

                // Yellow Construction Brow Rim
                const brim = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.22, 0.52), matYellow);
                brim.position.set(0, 0.46, 0.48);
                parts.head.add(brim);

                // Cylindrical Construction Ear Mufflers / Side Bumpers
                [-0.80, 0.80].forEach(ex => {
                    const earMuffler = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12).rotateZ(Math.PI / 2),
                        matYellow
                    );
                    earMuffler.position.set(ex, 0.04, 0.08);
                    parts.head.add(earMuffler);
                });

                // Expressive Cartoon Face Mesh
                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.96, 1.38), matFace);
                faceMesh.position.set(0, -0.04, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // Heavy Silver Chin Guard
                const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.28, 0.52), matChrome);
                chinGuard.position.set(0, -0.54, 0.48);
                parts.head.add(chinGuard);

                // 6. Chunky Cartoon Arms with Sliding Caterpillar Tread Mounts (`leftArmWheelMount` / `rightArmWheelMount`)
                //    & Articulated Forearms (`leftForearm` / `rightForearm`) that Tuck Inward!
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const forearmG = side === -1 ? parts.leftForearm : parts.rightForearm;
                    const treadMount = side === -1 ? parts.leftArmWheelMount : parts.rightArmWheelMount;

                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.18, 1.24), matGreen);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    // Sliding Caterpillar Tread Assembly on Outer Arm
                    armG.add(treadMount);
                    const trackPod = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.25, 1.68), matTire);
                    trackPod.position.set(side * 0.54, -0.65, 0);
                    trackPod.castShadow = true;
                    treadMount.add(trackPod);

                    // Rounded Front Idler & Elevated Rear Drive Sprocket Drums
                    [-2.22, 0.92].forEach(ty => {
                        const trackEnd = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.84, 0.84, 0.92, 14).rotateZ(Math.PI / 2),
                            matTire
                        );
                        trackEnd.position.set(side * 0.54, ty, 0);
                        trackEnd.castShadow = true;
                        treadMount.add(trackEnd);
                    });

                    // Heavy Lime-Green & Yellow Bogie Suspension Frame Rail
                    const trackRail = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.55, 0.62), matGreen);
                    trackRail.position.set(side * 0.54, -0.65, 0);
                    treadMount.add(trackRail);

                    const trackBogieBar = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.15, 0.28), matYellow);
                    trackBogieBar.position.set(side * 0.54, -0.65, 0);
                    treadMount.add(trackBogieBar);

                    // 4 Spinning Yellow Caterpillar Track Rollers & Sprockets
                    [-2.05, -1.12, -0.18, 0.75].forEach(ry => {
                        const roller = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.42, 0.42, 1.04, 12).rotateZ(Math.PI / 2),
                            matYellow
                        );
                        roller.position.set(side * 0.54, ry, 0);
                        treadMount.add(roller);
                        parts.wheels.push(roller);
                    });

                    // Articulated Forearm & Fist (folds inward inside the tread hull in Bulldozer mode!)
                    forearmG.position.set(0, -1.25, 0.08);
                    armG.add(forearmG);

                    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.18, 1.08), matYellow);
                    forearm.castShadow = true;
                    forearmG.add(forearm);

                    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.65, 0.84), matDarkSteel);
                    fist.position.set(0, -0.78, 0.04);
                    forearmG.add(fist);
                });

                // 7. Heavy Legs with Articulated Bulldozer Blade Linkage (`leftLegWheelMount` / `rightLegWheelMount`)
                //    & Interlocking Split Front Bulldozer Blade (`leftFoot` / `rightFoot`)!
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;
                    const footG = side === -1 ? parts.leftFoot : parts.rightFoot;
                    const bladeLinkage = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;

                    const thigh = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.48, 1.24), matTire);
                    thigh.position.y = -0.55;
                    legG.add(thigh);

                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.48, 1.48), matGreen);
                    shin.position.set(0, -1.45, 0.08);
                    shin.castShadow = true;
                    legG.add(shin);

                    // Articulated Hydraulic Lift Cylinder & Yellow C-Frame Push-Arm Linkage
                    legG.add(bladeLinkage);
                    const liftCylinderSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.95, 10), matYellow);
                    liftCylinderSleeve.position.set(side * 0.36, -0.95, -0.52);
                    bladeLinkage.add(liftCylinderSleeve);

                    const liftPistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.45, 8), matChrome);
                    liftPistonRod.position.set(side * 0.36, -1.45, -0.52);
                    bladeLinkage.add(liftPistonRod);

                    const pushBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.75, 0.38), matYellow);
                    pushBeam.position.set(side * 0.68, -1.35, 0.22);
                    pushBeam.castShadow = true;
                    bladeLinkage.add(pushBeam);

                    // Articulated Foot / Half-Bulldozer Curved Moldboard Blade Assembly
                    // (When legs slide together to X = ±0.88 in Bulldozer mode, the two 1.82m halves lock flush at X = 0!)
                    footG.position.set(0, -2.12, 0.24);
                    legG.add(footG);

                    const inwardOffset = -side * 0.03;
                    const bucketFootBase = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.74, 1.84), matYellow);
                    bucketFootBase.position.set(inwardOffset, 0, 0);
                    bucketFootBase.castShadow = true;
                    footG.add(bucketFootBase);

                    // Curved Outer Moldboard Cheek Wing & Reinforcement Rib
                    const bucketSideWing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.98, 1.92), matYellow);
                    bucketSideWing.position.set(side * 0.82, -0.10, 0);
                    bucketSideWing.castShadow = true;
                    footG.add(bucketSideWing);

                    // Hazard-Stripe Upper Spill Guard Rim (Toe in Bot mode -> Top spill guard of Bulldozer Blade in Vehicle mode!)
                    const bucketHazardRim = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.42, 0.46), matHazardMat);
                    bucketHazardRim.position.set(inwardOffset, -0.24, 0.72);
                    bucketHazardRim.rotation.x = 0.22;
                    bucketHazardRim.userData.noOutline = true;
                    footG.add(bucketHazardRim);

                    // Beveled Chrome Bottom Scraper Cutting Edge (Heel in Bot mode -> Bottom scraper edge of Dozer Blade in Vehicle mode!)
                    const bucketCuttingEdge = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.44, 0.36), matChrome);
                    bucketCuttingEdge.position.set(inwardOffset, -0.28, -0.78);
                    bucketCuttingEdge.rotation.x = -0.22;
                    footG.add(bucketCuttingEdge);

                    // Concave Chrome-Steel Moldboard Scoop Plate (Sole in Bot mode -> Curved front dozer face in Vehicle mode!)
                    const bucketScoopFace = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.22, 1.32), matChrome);
                    bucketScoopFace.position.set(inwardOffset, -0.36, -0.02);
                    footG.add(bucketScoopFace);
                });

                // DINOBOT MODE: BOULDER TRICERATOPS (Armored Frill Shield, 3 Horns, Saddle & Tail)
                const triSaddle = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.95, 2.95), matGreen);
                triSaddle.position.set(0, 2.65, -0.05);
                triSaddle.castShadow = true;
                parts.dinoGroup.add(triSaddle);

                const triSpine = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.35, 2.8), matYellow);
                triSpine.position.set(0, 3.2, -0.05);
                parts.dinoGroup.add(triSpine);

                // Triceratops Frill Shield & 3-Horned Skull
                const frillOuter = new THREE.Mesh(
                    new THREE.CylinderGeometry(2.15, 1.65, 0.38, 8).rotateX(Math.PI * 0.38),
                    matYellow
                );
                frillOuter.position.set(0, 0.95, -0.25);
                frillOuter.castShadow = true;
                parts.dinoHead.add(frillOuter);

                const frillInner = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.75, 1.35, 0.44, 8).rotateX(Math.PI * 0.38),
                    matGreen
                );
                frillInner.position.set(0, 0.95, -0.22);
                parts.dinoHead.add(frillInner);

                // Chrome Frill Crown Studs
                [-1.3, -0.68, 0, 0.68, 1.3].forEach((fx, idx) => {
                    const stud = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.52, 6).rotateX(-0.35), matChrome);
                    stud.position.set(fx, 2.15 - Math.abs(idx - 2) * 0.22, -0.65);
                    parts.dinoHead.add(stud);
                });

                const triSkull = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.32, 1.95), matGreen);
                triSkull.position.set(0, 0.15, 0.65);
                triSkull.castShadow = true;
                parts.dinoHead.add(triSkull);

                const triEyes = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.36, 0.58), matVisorCyan);
                triEyes.position.set(0, 0.38, 0.85);
                triEyes.userData.noOutline = true;
                parts.dinoHead.add(triEyes);

                const triBeak = new THREE.Mesh(
                    new THREE.ConeGeometry(0.78, 1.25, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4),
                    matYellow
                );
                triBeak.position.set(0, -0.05, 1.95);
                parts.dinoHead.add(triBeak);

                // Two Long Chrome Brow Horns + Nose Horn
                [-0.58, 0.58].forEach(hx => {
                    const browHorn = new THREE.Mesh(
                        new THREE.ConeGeometry(0.24, 2.35, 8).rotateX(Math.PI * 0.38),
                        matChrome
                    );
                    browHorn.position.set(hx, 0.92, 1.65);
                    parts.dinoHead.add(browHorn);
                });
                const noseHorn = new THREE.Mesh(
                    new THREE.ConeGeometry(0.22, 1.05, 8).rotateX(Math.PI * 0.18),
                    matYellow
                );
                noseHorn.position.set(0, 0.55, 2.05);
                parts.dinoHead.add(noseHorn);

                // Triceratops Heavy Segmented Tail
                const triTailBase = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.08, 1.65), matGreen);
                triTailBase.position.set(0, 0, -0.75);
                parts.dinoTail.add(triTailBase);
                const triTailTip = new THREE.Mesh(
                    new THREE.ConeGeometry(0.68, 2.1, 6).rotateX(-Math.PI / 2),
                    matYellow
                );
                triTailTip.position.set(0, -0.05, -2.35);
                parts.dinoTail.add(triTailTip);
}

export default buildBoulder;

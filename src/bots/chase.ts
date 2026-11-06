// 3D Cel-Shaded Model & Morph Builder for CHASE
import * as THREE from 'three';
import { texFaceChase } from '../rendering/textures.js';
import { createLightbar, createWheelAssembly } from './botHelpers.js';

export function buildChase(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = ((typeof window !== 'undefined' ? window : {}) as any);

    // TV Show & Legacy United Chase: Deep Police Cobalt Blue (#1648b8), Crisp White Doors, Gold Police Badge
                const matBlue = new THREE.MeshToonMaterial({ color: 0x1648b8, gradientMap: toonGrad4 });
                const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });
                const matBlack = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
                const matGold = new THREE.MeshToonMaterial({ color: 0xffcc00, gradientMap: toonGrad4 });
                const matRedTail = new THREE.MeshBasicMaterial({ color: 0xef4444 });
                const matFace = new THREE.MeshBasicMaterial({ map: texFaceChase });

                // 1. Torso: Police Cruiser Cabin Roof & Raked Front Windshield (Pitches backward +90° in Vehicle mode so chest becomes the Roof!)
                const chest = new THREE.Mesh(new THREE.BoxGeometry(2.42, 2.28, 1.88), matBlue);
                chest.castShadow = true;
                parts.torso.add(chest);

                // Raked Front Police Windshield on Upper Chest (Becomes the sloped front windshield in Cruiser mode)
                const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.96, 1.94), matCabGlass);
                windshield.position.set(0, 0.56, 0.05);
                windshield.rotation.x = -0.18;
                windshield.userData.noOutline = true;
                parts.torso.add(windshield);

                // Side Cabin Windows & White Police Roof Pillar Trim
                const cabinSideGlass = new THREE.Mesh(new THREE.BoxGeometry(2.48, 1.15, 0.86), matCabGlass);
                cabinSideGlass.position.set(0, 0.12, 0.34);
                cabinSideGlass.userData.noOutline = true;
                parts.torso.add(cabinSideGlass);

                const roofWhitePanel = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.08, 0.24), matWhite);
                roofWhitePanel.position.set(0, -0.32, 0.88);
                parts.torso.add(roofWhitePanel);

                // Rescue Bots Police Badge on Chest Roof Panel
                const badge = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.28), matEmblem);
                badge.position.set(0, -0.32, 0.92);
                badge.userData.noOutline = true;
                parts.torso.add(badge);

                // Rear Backlight Window & Trunk Spoiler Deck at Lower Torso (Becomes the rear trunk/spoiler when torso pitches +90°!)
                const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.62, 1.86), matBlue);
                rearDeck.position.set(0, -1.16, -0.02);
                rearDeck.castShadow = true;
                parts.torso.add(rearDeck);

                const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.22, 0.52), matBlack);
                spoilerWing.position.set(0, -1.42, 0.72);
                parts.torso.add(spoilerWing);

                // Rear Cruiser Taillights on Lower Torso Edge
                [-0.82, 0.82].forEach(tx => {
                    const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.34), matRedTail);
                    tailLamp.position.set(tx, -1.44, 0.18);
                    tailLamp.userData.noOutline = true;
                    parts.torso.add(tailLamp);
                });

                // Police Siren Lightbar (Sits immediately behind Chase's head in Bot mode -> Shifts onto the Roof in Cruiser mode!)
                const lb = createLightbar(1.94);
                lb.group.position.set(0, 1.32, -0.38);
                parts.torso.add(lb.group);
                parts.lightbar = lb;

                // 2. Police Officer Helmet & Cartoon Cyan Optics with Gold Star Badge & Audio Ear Pods (Matching Cartoon)
                const helm = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.20, 1.24), matBlue);
                helm.castShadow = true;
                parts.head.add(helm);

                // Gold Police Star Shield Badge Centered on Forehead
                const policeBadge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.14), matGold);
                policeBadge.position.set(0, 0.46, 0.64);
                parts.head.add(policeBadge);

                // Dark Police Cap Visor Brim
                const capVisor = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.16, 0.46), matBlack);
                capVisor.position.set(0, 0.38, 0.54);
                capVisor.rotation.x = -0.12;
                parts.head.add(capVisor);

                // Cylindrical Ear Communications Pods on Left & Right
                [-0.65, 0.65].forEach(ex => {
                    const earOuter = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.26, 0.26, 0.16, 12).rotateZ(Math.PI / 2),
                        matWhite
                    );
                    earOuter.position.set(ex, 0.05, 0.04);
                    parts.head.add(earOuter);

                    const earCore = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12).rotateZ(Math.PI / 2),
                        matBlue
                    );
                    earCore.position.set(ex, 0.05, 0.04);
                    parts.head.add(earCore);
                });

                // White Side Jaw / Cheek Panels
                [-0.58, 0.58].forEach(jx => {
                    const jawPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.64, 0.44), matWhite);
                    jawPanel.position.set(jx, -0.12, 0.34);
                    parts.head.add(jawPanel);
                });

                // Expressive Cartoon Face Mesh
                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.90, 1.28), matFace);
                faceMesh.position.set(0, -0.04, 0.04);
                faceMesh.userData.noOutline = true;
                parts.head.add(faceMesh);

                // 3. Arms with Articulated White Police Doors & Sliding Rear Cruiser Wheels
                [-1, 1].forEach(side => {
                    const armG = side === -1 ? parts.leftArm : parts.rightArm;
                    const doorWingG = side === -1 ? parts.leftDoorWing : parts.rightDoorWing;
                    const armWheelMount = side === -1 ? parts.leftArmWheelMount : parts.rightArmWheelMount;

                    // Broad Police Shoulder Guard (Rear Quarter Panel in Cruiser Mode)
                    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.26, 1.34), matBlue);
                    shoulder.castShadow = true;
                    armG.add(shoulder);

                    const shoulderGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 1.38), matGold);
                    shoulderGoldTrim.position.set(0, 0.48, 0);
                    armG.add(shoulderGoldTrim);

                    // Articulated White Police Door Panel (Angles outward as Shoulder Door-Wings in Bot mode -> Folds flat as Side Doors in Cruiser mode!)
                    doorWingG.position.set(side * 0.56, -0.35, 0.08);
                    doorWingG.rotation.z = side * -0.38;
                    armG.add(doorWingG);

                    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.92, 1.24), matWhite);
                    doorPanel.castShadow = true;
                    doorWingG.add(doorPanel);

                    const doorBlackStripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.88, 0.36), matBlack);
                    doorBlackStripe.position.set(side * 0.02, 0, -0.18);
                    doorWingG.add(doorBlackStripe);

                    const doorGoldShield = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.46), matGold);
                    doorGoldShield.position.set(side * 0.03, -0.1, 0.22);
                    doorWingG.add(doorGoldShield);

                    // Rear Cruiser Wheel on Sliding Mount (Shifts downward in Vehicle mode so Rear Tires touch the ground!)
                    armWheelMount.position.set(side * 0.54, -0.22, -0.05);
                    armG.add(armWheelMount);

                    const rearWheel = createWheelAssembly(0.68, 0.46);
                    armWheelMount.add(rearWheel);
                    parts.wheels.push(rearWheel);

                    // White Forearm & Police Gauntlet
                    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.32, 1.12), matWhite);
                    forearm.position.set(0, -1.32, 0.06);
                    forearm.castShadow = true;
                    armG.add(forearm);

                    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.42, 1.16), matBlack);
                    cuff.position.set(0, -1.85, 0.06);
                    armG.add(cuff);
                });

                // 4. Legs & Headlight Feet (Extend & Press Together in Front to Form the Front Hood, Fenders, Front Wheels & Bullbar Bumper!)
                [-1, 1].forEach(side => {
                    const legG = side === -1 ? parts.leftLeg : parts.rightLeg;
                    const footG = side === -1 ? parts.leftFoot : parts.rightFoot;
                    const legWheelMount = side === -1 ? parts.leftLegWheelMount : parts.rightLegWheelMount;

                    // White Upper Thigh / Cowl
                    const thigh = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.36, 1.24), matWhite);
                    thigh.position.set(-side * 0.06, -0.52, 0);
                    legG.add(thigh);

                    // Cobalt Blue Lower Leg / Split Front Cruiser Hood & Front Fender Half
                    const shin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.62, 1.56), matBlue);
                    shin.position.set(-side * 0.08, -1.42, 0.12);
                    shin.castShadow = true;
                    legG.add(shin);

                    // White Hood Stripe & Center Intake Scoop on Front of Shins (Forms the Police Hood when legs swing forward!)
                    const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.48, 0.34), matWhite);
                    hoodStripe.position.set(-side * 0.08, -1.42, 0.76);
                    legG.add(hoodStripe);

                    const hoodGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.42, 0.38), matGold);
                    hoodGoldTrim.position.set(-side * 0.48, -1.42, 0.78);
                    legG.add(hoodGoldTrim);

                    // Front Cruiser Wheel on Sliding Shin Mount (Shifts downward in Vehicle mode so Front Tires touch the ground!)
                    legWheelMount.position.set(side * 0.56, -1.48, 0.05);
                    legG.add(legWheelMount);

                    const frontWheel = createWheelAssembly(0.68, 0.46);
                    legWheelMount.add(frontWheel);
                    parts.wheels.push(frontWheel);

                    // Articulated Police Foot with Headlights & Push-Bar Bullbar Bumper right on his Feet!
                    footG.position.set(-side * 0.08, -2.18, 0.22);
                    legG.add(footG);

                    const boot = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.62, 1.82), matBlack);
                    boot.castShadow = true;
                    footG.add(boot);

                    // Glowing Police Headlight Lens on Toe/Sole of Foot (Faces straight forward when legs swing to -90°!)
                    const headlightLens = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.42), matVisorGold);
                    headlightLens.position.set(side * 0.22, -0.18, 0.66);
                    headlightLens.userData.noOutline = true;
                    footG.add(headlightLens);

                    // Chrome Front Grille Half on Inward Side of Foot
                    const footGrille = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.54), matGrille);
                    footGrille.position.set(-side * 0.34, -0.18, 0.62);
                    footGrille.userData.noOutline = true;
                    footG.add(footGrille);

                    // Police Push-Bar Bullbar Guard on Bottom of Foot (Forms the front Police Push-Bumper in Cruiser Mode!)
                    const bullbarBumper = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.28, 0.88), matBlack);
                    bullbarBumper.position.set(0, -0.34, 0.42);
                    bullbarBumper.castShadow = true;
                    footG.add(bullbarBumper);

                    const bullbarUpright = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.96), matChrome);
                    bullbarUpright.position.set(-side * 0.24, -0.36, 0.48);
                    footG.add(bullbarUpright);
                });

                // DINOBOT MODE: CHASE STEGOSAURUS (Double Row of Dorsal Plates, Police Dino Head & Spiked Thagomizer Tail)
                const stegoBack = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.15, 3.1), matBlue);
                stegoBack.position.set(0, 2.55, -0.05);
                stegoBack.castShadow = true;
                parts.dinoGroup.add(stegoBack);

                const stegoFlank = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.55, 2.35), matWhite);
                stegoFlank.position.set(0, 2.45, -0.05);
                parts.dinoGroup.add(stegoFlank);

                // Iconic Double Row of Alternating Stegosaurus Dorsal Plates
                const plateZPositions = [-1.35, -0.8, -0.25, 0.3, 0.85, 1.35];
                plateZPositions.forEach((pz, idx) => {
                    const side = idx % 2 === 0 ? -1 : 1;
                    const plateSize = idx === 2 || idx === 3 ? 1.25 : (idx === 1 || idx === 4 ? 1.05 : 0.82);
                    const plateGroup = new THREE.Group();
                    plateGroup.position.set(side * 0.44, 3.25 + (plateSize - 0.8) * 0.35, pz);
                    plateGroup.rotation.z = side * -0.18;

                    const outerPlate = new THREE.Mesh(
                        new THREE.BoxGeometry(0.22, plateSize, plateSize),
                        matGold
                    );
                    outerPlate.rotation.x = Math.PI / 4;
                    outerPlate.castShadow = true;
                    plateGroup.add(outerPlate);

                    const innerCore = new THREE.Mesh(
                        new THREE.BoxGeometry(0.26, plateSize * 0.62, plateSize * 0.62),
                        matVisorCyan
                    );
                    innerCore.rotation.x = Math.PI / 4;
                    innerCore.userData.noOutline = true;
                    plateGroup.add(innerCore);

                    parts.dinoGroup.add(plateGroup);
                });

                // Low-Slung Armored Stegosaurus Head
                const stegoSkull = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.98, 1.75), matBlue);
                stegoSkull.position.set(0, 0.05, 0.65);
                stegoSkull.castShadow = true;
                parts.dinoHead.add(stegoSkull);

                const stegoCrest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 1.45), matGold);
                stegoCrest.position.set(0, 0.58, 0.55);
                parts.dinoHead.add(stegoCrest);

                const stegoEyes = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.32, 0.52), matVisorCyan);
                stegoEyes.position.set(0, 0.2, 0.85);
                stegoEyes.userData.noOutline = true;
                parts.dinoHead.add(stegoEyes);

                const stegoSnout = new THREE.Mesh(
                    new THREE.ConeGeometry(0.62, 1.25, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4),
                    matChrome
                );
                stegoSnout.position.set(0, -0.04, 1.85);
                parts.dinoHead.add(stegoSnout);

                // Spiked Thagomizer Tail (4 Chrome/Gold Spikes)
                const stegoTailBase = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.95, 1.85), matBlue);
                stegoTailBase.position.set(0, 0, -0.8);
                parts.dinoTail.add(stegoTailBase);

                const stegoTailTip = new THREE.Mesh(
                    new THREE.ConeGeometry(0.58, 2.05, 6).rotateX(-Math.PI / 2),
                    matWhite
                );
                stegoTailTip.position.set(0, 0.05, -2.45);
                parts.dinoTail.add(stegoTailTip);

                [-1, 1].forEach(side => {
                    [-2.15, -2.75].forEach((sz, sIdx) => {
                        const spike = new THREE.Mesh(
                            new THREE.ConeGeometry(0.18, 1.35, 6).rotateZ(side * -Math.PI * 0.36),
                            sIdx === 0 ? matGold : matChrome
                        );
                        spike.position.set(side * 0.68, 0.32, sz);
                        parts.dinoTail.add(spike);
                    });
                });

                // =============================================================
                // MEGA BOT: CHASE POLICE MOBILE COMMAND TRAILER & SEMI CONVERSION
                // =============================================================
                // 1. Vehicle Mode: Tactical Police Command Trailer with Articulated Hitch
                const trailerHitch = new THREE.Group();
                trailerHitch.userData.isMegaPart = true;
                parts.trailerHitch = trailerHitch;
                parts.backAttachment.add(trailerHitch);

                const megaTrailer = new THREE.Group();
                megaTrailer.userData.isMegaPart = true;
                megaTrailer.visible = false;
                parts.megaTrailer = megaTrailer;
                trailerHitch.add(megaTrailer);

                // Main Tactical Trailer Hull (10.5m long, 2.75m wide, 3.1m high)
                const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.75, 3.1, 10.5), matBlue);
                trHull.position.set(0, 0.9, -6.0);
                trHull.castShadow = true;
                megaTrailer.add(trHull);

                // Crisp White Flank Center Panels with Police Decal
                [-1.39, 1.39].forEach(sx => {
                    const whitePanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 9.8), matWhite);
                    whitePanel.position.set(sx, 0.9, -6.0);
                    const goldBadge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.9), matGold);
                    goldBadge.position.set(sx * 1.01, 0.9, -4.0);
                    goldBadge.userData.noOutline = true;
                    megaTrailer.add(whitePanel, goldBadge);
                });

                // Tactical Roof Radar Dish & Communications Mast
                const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.3, 12), matDarkSteel);
                radarBase.position.set(0, 2.6, -3.5);
                const radarDish = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45).rotateX(-Math.PI * 0.4), matChrome);
                radarDish.position.set(0, 3.1, -3.5);
                megaTrailer.add(radarBase, radarDish);

                // Dual Emergency Police Lightbars on Trailer Roof
                [-2.0, -9.5].forEach(lz => {
                    const lb = createLightbar(1.85);
                    lb.group.position.set(0, 2.6, lz);
                    megaTrailer.add(lb.group);
                });

                // Rear Step Bumper & Taillights
                const rBumper = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 0.3), matDarkSteel);
                rBumper.position.set(0, -0.45, -11.35);
                megaTrailer.add(rBumper);
                [-1.0, 1.0].forEach(tx => {
                    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.1), matRedTail);
                    tail.position.set(tx, -0.45, -11.52);
                    tail.userData.noOutline = true;
                    megaTrailer.add(tail);
                });

                // Tandem Heavy Wheels (Functional Wheel Assemblies)
                [-7.8, -9.6].forEach(wz => {
                    [-1.42, 1.42].forEach(wx => {
                        const trWheel = createWheelAssembly(0.74, 0.48);
                        trWheel.position.set(wx, -0.9, wz);
                        megaTrailer.add(trWheel);
                        parts.wheels.push(trWheel);
                    });
                });

                // 2. Bot Mode: Heavy Tactical Ballistic Riot Shield on Left Forearm
                const megaShield = new THREE.Group();
                megaShield.userData.isMegaPart = true;
                megaShield.visible = false;
                parts.megaShield = megaShield;
                parts.leftForearm.add(megaShield);

                const shieldMount = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.0), matDarkSteel);
                shieldMount.position.set(0, 0.35, 0.5);
                const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.6, 2.2), matBlue);
                shieldPlate.position.set(-0.6, 0.35, 0.6);
                shieldPlate.castShadow = true;
                const shieldCenterWhite = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.0, 0.9), matWhite);
                shieldCenterWhite.position.set(-0.62, 0.35, 0.6);
                const shieldStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.25, 1.6), matSirenBlue);
                shieldStrobe.position.set(-0.64, 2.0, 0.6);
                shieldStrobe.userData.noOutline = true;
                megaShield.add(shieldMount, shieldPlate, shieldCenterWhite, shieldStrobe);

                // 3. Bot Mode: Tactical Back Communications Pack
                const megaBackPack = new THREE.Group();
                megaBackPack.userData.isMegaPart = true;
                megaBackPack.visible = false;
                parts.megaBackPack = megaBackPack;
                parts.backAttachment.add(megaBackPack);

                const commPack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 1.2), matBlue);
                commPack.position.set(0, 0.2, 0.2);
                commPack.castShadow = true;
                const commAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), matChrome);
                commAntenna.position.set(0.9, 1.8, 0.2);
                megaBackPack.add(commPack, commAntenna);

                // 4. Dino Mode: Glowing Police Siren Stego Dorsal Plates & Thagomizer Enhancements
                const megaDinoArmor = new THREE.Group();
                megaDinoArmor.userData.isMegaPart = true;
                megaDinoArmor.visible = false;
                parts.megaDinoArmor = megaDinoArmor;
                parts.dinoGroup.add(megaDinoArmor);

                // 4 Alternating Flashing Red/Blue Stego Spine Scutes
                for (let i = 0; i < 4; i++) {
                    const scuteMat = i % 2 === 0 ? matSirenBlue : matSirenRed;
                    const scute = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4 - i * 0.1, 1.1).rotateX(0.25), scuteMat);
                    const sideX = (i % 2 === 0 ? -0.45 : 0.45);
                    scute.position.set(sideX, 3.2 - i * 0.12, 0.6 - i * 0.95);
                    scute.userData.noOutline = true;
                    megaDinoArmor.add(scute);
                }

                // Initialize visibility matching current docked status
                const isCurrentMega = Boolean(typeof window !== 'undefined' && (window as any).progression && (window as any).progression.chaseDocked);
                if (typeof (window as any).setBotRigMega === 'function') {
                    (window as any).setBotRigMega(parts, isCurrentMega);
                }
}

export default buildChase;

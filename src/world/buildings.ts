// Griffin Rock Town Buildings, Firehouse HQ, Harbor & Interactive World Features
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import {
    toonGrad3, toonGrad4, toonGradGlossy,
    matInkOutline, matInkEdgeLine, applyCartoonInkOutlines,
    matBrickRed, matSteel, matDarkSteel, matChrome, matGlass, matHazardMat, matHazardYellow
} from '../rendering/materials.js';
import { texWindshieldCyan, texHelipad } from '../rendering/textures.js';
import { worldColliders, registerCullableObject, ramps, stateHolder } from '../state/gameState.js';

import { texEmblem, texHazard } from '../rendering/textures.js';
export const HQ_POS = { x: -48, z: -45 };
export const HQ_SWAP_PAD = { x: -48, z: -15, r: 12.5 };
export let hqGroup = null;
export let roboWashGroup = null;
export let launchPadGroup = null;
export let dinerGroup = null;
export let chargerStation = null;
export let groundbridgePortals = [];
export const stuntHoopRigs = [];
export let ferryController = null;

// Animated Landmark References
export let hqRadarPivot = null;
export let swapPadRing = null;
export const outpostPadRings = [];
export let lhBeamPivot = null;
export let observatoryDomePivot = null;
export const windTurbineRotors = [];
export let volcanoLavaPool = null;
export const volcanoSmokePuffs = [];

// Interactive Feature State & Positions
export const ROBO_WASH_POS = { x: -92, z: -15 };
export let rwY = 0;
export let rwLeftBrush = null;
export let rwRightBrush = null;
export let rwTopBrush = null;

export const CATAPULT_POS = { x: 36, z: -45 };
export let catY = 0;
export let catapultCarriage = null;
export const catapultStrobes = [];

export const DINER_POS = { x: 78, z: -15 };
export let dinerY = 0;
export let dinerBurgerGroup = null;

export const CHARGER_POS = { x: -1110, z: -42 };
export let chargerY = 0;
export const energonCoilRings = [];
export const energonOrbs = [];

export const groundBridgePortals = [];
export let harborFerryGroup = null;
export let craneInteractive = null;
export let testYard = null;
export let ferrisWheelPivot: any = null;
export const ferrisGondolas: any[] = [];
export const bwX = -825, bwZ = 825;
export const babyDinos: any[] = [];
export let amberSpire: any = null;
export const drX = -750, drZ = -750;
export let waywardEnergonShard: any = null;

export function initBuildings(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

        // =====================================================================
        // 5A. ICONIC RESCUE BOTS FIREHOUSE HEADQUARTERS (At X: -48, Z: -45 - Set safely West of NS Highway)
        // =====================================================================
        // HQ_POS defined at module level
        // HQ_SWAP_PAD defined at module level
        hqGroup = new THREE.Group();
        const hqY = getTerrainHeight(HQ_POS.x, HQ_POS.z);
        hqGroup.position.set(HQ_POS.x, hqY, HQ_POS.z);

        const matBrickRed = new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad3 });
        const matSteel = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad4 });
        const matDarkSteel = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
        const matChrome = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGradGlossy });
        const matGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });

        // Paved Firehouse Apron & Driveway Forecourt (Connecting HQ bays & Swap Pad seamlessly to NS Highway)
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

        // Main Firehouse 3-Bay Apparatus Hall (Hollow interior so parked bots are fully visible inside)
        // 1. Back Wall
        const hqBackWall = new THREE.Mesh(new THREE.BoxGeometry(38, 15, 1.6), matBrickRed);
        hqBackWall.position.set(0, 7.5, -11.2);
        hqBackWall.castShadow = true;
        hqBackWall.receiveShadow = true;
        hqGroup.add(hqBackWall);

        // 2. Left & Right Side Walls
        const hqLeftWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 15, 24), matBrickRed);
        hqLeftWall.position.set(-18.2, 7.5, 0);
        hqLeftWall.castShadow = true;
        hqLeftWall.receiveShadow = true;
        const hqRightWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 15, 24), matBrickRed);
        hqRightWall.position.set(18.2, 7.5, 0);
        hqRightWall.castShadow = true;
        hqRightWall.receiveShadow = true;
        hqGroup.add(hqLeftWall, hqRightWall);

        // 3. Hall Ceiling & Concrete Interior Floor
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

        // 4. Front Wall Panels (Header Beam & Vertical Brick Pillars between the 3 Bays)
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

        // White Steel Trim Roof Cornice
        const hqRoofTrim = new THREE.Mesh(new THREE.BoxGeometry(40, 1.8, 26), matSteel);
        hqRoofTrim.position.set(0, 15.5, 0);
        hqGroup.add(hqRoofTrim);

        // Transparent Bay Door Glass Material (Crisp cartoon cyan tint, depthWrite: false so interior bots show clearly)
        const matBayGlass = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // 3 Illuminated Vehicle Apparatus Bays with Transparent Glass Roll-Up Doors on South Front Face (Z = +12.0)
        [-11, 0, 11].forEach(bayX => {
            // White Steel Outer Door Jambs & Header Frame (leaving open transparent doorway)
            const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 10.5, 1.2), matSteel);
            frameL.position.set(bayX - 3.95, 5.25, 12.0);
            const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 10.5, 1.2), matSteel);
            frameR.position.set(bayX + 3.95, 5.25, 12.0);
            const frameTop = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.7, 1.2), matSteel);
            frameTop.position.set(bayX, 10.15, 12.0);
            hqGroup.add(frameL, frameR, frameTop);

            // Transparent Glass Roll-Up Garage Door
            const bayGlass = new THREE.Mesh(
                new THREE.PlaneGeometry(7.2, 9.6),
                matBayGlass
            );
            bayGlass.position.set(bayX, 4.9, 12.05);
            bayGlass.userData.noOutline = true;
            bayGlass.renderOrder = 1;
            hqGroup.add(bayGlass);

            // Steel Mullions / Struts across the glass door (Modern 4x2 firehouse glass roll-up panes)
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

            // Overhead Exterior Bay Header Light (glowing cyan)
            const bayLight = new THREE.Mesh(
                new THREE.BoxGeometry(6.5, 0.6, 1.4),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
            );
            bayLight.position.set(bayX, 9.8, 12.15);
            hqGroup.add(bayLight);

            // Interior Overhead Bay Illumination Light Strip
            const interiorLight = new THREE.Mesh(
                new THREE.BoxGeometry(3.2, 0.2, 8.0),
                new THREE.MeshBasicMaterial({ color: 0xfef08a })
            );
            interiorLight.position.set(bayX, 14.1, 3.5);
            hqGroup.add(interiorLight);

            // Interior Rear Diagnostic / Charging Terminal Console on back wall
            const bayConsole = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.6), matDarkSteel);
            bayConsole.position.set(bayX, 1.6, -10.2);
            const consoleScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            consoleScreen.position.set(bayX, 2.2, -9.88);
            consoleScreen.userData.noOutline = true;
            hqGroup.add(bayConsole, consoleScreen);
        });

        // Rescue Bots Emblem Sign above Center Bay
        const hqSign = new THREE.Mesh(
            new THREE.BoxGeometry(7.5, 7.5, 0.8),
            new THREE.MeshBasicMaterial({ map: texEmblem })
        );
        hqSign.position.set(0, 16.8, 13.0);
        hqGroup.add(hqSign);

        // Glass Observation & Command Tower (East Wing)
        const hqTower = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.2, 28, 12), matDarkSteel);
        hqTower.position.set(15, 14, -4);
        hqTower.castShadow = true;
        hqGroup.add(hqTower);

        const hqTowerGlass = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 7.5, 12), matGlass);
        hqTowerGlass.position.set(15, 22, -4);
        hqGroup.add(hqTowerGlass);

        // Rotating HQ Communications Radar Dish on Tower Roof
        hqRadarPivot = new THREE.Group();
        hqRadarPivot.position.set(15, 29.5, -4);
        const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 3.5, 8), matSteel);
        hqRadarPivot.add(radarMast);
        const radarDish = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.2, 12, 1, true), matSteel);
        radarDish.rotation.x = Math.PI / 3;
        radarDish.position.set(0, 2.2, 1.2);
        hqRadarPivot.add(radarDish);
        hqGroup.add(hqRadarPivot);

        // Rooftop Helipad for Blades (West Roof Deck, Y = 16.5)
        const helipadDeck = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.6, 18),
            new THREE.MeshBasicMaterial({ map: texHelipad })
        );
        helipadDeck.position.set(-8, 16.5, 0);
        hqGroup.add(helipadDeck);

        // Glowing Cyan/Gold Character Swap Bay Pad in front of HQ (World Z = -15)
        const swapPadGroup = new THREE.Group();
        swapPadGroup.position.set(0, 0.15, 30); // Relative to HQ at Z=-45 -> World Z=-15
        const swapPadBase = new THREE.Mesh(
            new THREE.CylinderGeometry(11.5, 12.5, 0.45, 32),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 })
        );
        swapPadGroup.add(swapPadBase);

        swapPadRing = new THREE.Mesh(
            new THREE.RingGeometry(9.5, 11.4, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        swapPadRing.position.y = 0.28;
        swapPadGroup.add(swapPadRing);

        const swapPadHolo = new THREE.Mesh(
            new THREE.CylinderGeometry(10.5, 10.5, 5.5, 24, 1, true),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
        );
        swapPadHolo.userData.noOutline = true;
        swapPadHolo.position.y = 2.8;
        swapPadGroup.add(swapPadHolo);
        swapPadRing.userData.noOutline = true;
        helipadDeck.userData.noOutline = true;
        hqSign.userData.noOutline = true;
        hqGroup.add(swapPadGroup);

        // Apply Bold Cartoon Ink Outlines to the Firehouse HQ
        applyCartoonInkOutlines(hqGroup, 1.03, true);

        s.add(hqGroup);
        registerCullableObject(hqGroup, HQ_POS.x, hqY + 12, HQ_POS.z, 55);
        worldColliders.push({ x: HQ_POS.x, z: HQ_POS.z, r: 19.5 });

        // =====================================================================
        // 5A-2. FIREHOUSE ROBO-WASH (Interactive Drive-Through Car Wash Bay)
        //       Located at X: -92, Z: -15 in West Town Plaza
        // =====================================================================
        roboWashGroup = new THREE.Group();
        rwY = getTerrainHeight(ROBO_WASH_POS.x, ROBO_WASH_POS.z);
        roboWashGroup.position.set(ROBO_WASH_POS.x, rwY, ROBO_WASH_POS.z);

        // Shiny Wet Drainage Slab on the ground
        const rwSlab = new THREE.Mesh(
            new THREE.BoxGeometry(13, 0.4, 20),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15, metalness: 0.65 })
        );
        rwSlab.position.set(0, 0.2, 0);
        rwSlab.receiveShadow = true;
        roboWashGroup.add(rwSlab);

        // Yellow & Black Safety Guide Rails flanking the entrance & exit
        [-6.0, 6.0].forEach(rx => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 19.5), matHazardYellow);
            rail.position.set(rx, 0.65, 0);
            rail.castShadow = true;
            roboWashGroup.add(rail);
        });

        // 2 Big Portal Arches (Front entrance at z=+9, Rear exit at z=-9)
        [-9, 9].forEach(az => {
            const archGroup = new THREE.Group();
            archGroup.position.set(0, 0, az);

            // Left & Right Portal Posts
            [-6.0, 6.0].forEach(px => {
                const post = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.8, 1.4), matHazardYellow);
                post.position.set(px, 4.9, 0);
                post.castShadow = true;
                archGroup.add(post);
            });

            // Top Crossbar Arch
            const crossbar = new THREE.Mesh(new THREE.BoxGeometry(13.4, 1.6, 1.6), matHazardYellow);
            crossbar.position.set(0, 9.8, 0);
            crossbar.castShadow = true;
            archGroup.add(crossbar);

            // Signboard on Front Arch
            if (az === 9) {
                const signBg = new THREE.Mesh(new THREE.BoxGeometry(10.5, 2.6, 0.8), matBrickRed);
                signBg.position.set(0, 11.2, 0.2);
                archGroup.add(signBg);

                const cSign = document.createElement('canvas');
                cSign.width = 512;
                cSign.height = 128;
                const cCtx = cSign.getContext('2d');
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
                archGroup.add(signFace);
            }

            roboWashGroup.add(archGroup);
        });

        // Overhead Glass Roof Canopy
        const rwCanopy = new THREE.Mesh(
            new THREE.BoxGeometry(13.2, 0.4, 18.2),
            matGlass
        );
        rwCanopy.position.set(0, 9.6, 0);
        roboWashGroup.add(rwCanopy);

        // 2 Big Vertical Foam Roller Brushes (Cyan & Magenta foam discs)
        const matBrushCyan = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
        const matBrushPink = new THREE.MeshToonMaterial({ color: 0xec4899, gradientMap: toonGrad3 });
        const matBrushYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
        const matBrushOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 });

        function createVerticalBrush(bx, bz, matA, matB) {
            const bGroup = new THREE.Group();
            bGroup.position.set(bx, 0.5, bz);

            const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.2, 8), matDarkSteel);
            spindle.position.y = 4.1;
            bGroup.add(spindle);

            const discCount = 10;
            for (let d = 0; d < discCount; d++) {
                const discMat = d % 2 === 0 ? matA : matB;
                const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.72, 10), discMat);
                disc.position.y = 0.6 + d * 0.78;
                disc.castShadow = true;
                bGroup.add(disc);
            }
            return bGroup;
        }

        rwLeftBrush = createVerticalBrush(-3.8, 0, matBrushCyan, matBrushPink);
        rwRightBrush = createVerticalBrush(3.8, 0, matBrushPink, matBrushCyan);
        roboWashGroup.add(rwLeftBrush);
        roboWashGroup.add(rwRightBrush);

        // 1 Horizontal Overhead Roller Brush (Yellow & Orange foam discs)
        rwTopBrush = new THREE.Group();
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

        // 4 Overhead Soap Mist Spray Nozzles
        [-2.8, 2.8].forEach(nx => {
            [-4.5, 4.5].forEach(nz => {
                const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 8), matSteel);
                nozzle.position.set(nx, 9.3, nz);
                nozzle.rotation.x = Math.PI;
                roboWashGroup.add(nozzle);
            });
        });

        applyCartoonInkOutlines(roboWashGroup, 1.03, true);
        s.add(roboWashGroup);
        registerCullableObject(roboWashGroup, ROBO_WASH_POS.x, rwY + 5, ROBO_WASH_POS.z, 28);
        worldColliders.push({ x: ROBO_WASH_POS.x - 6.2, z: ROBO_WASH_POS.z, r: 2.2 });
        worldColliders.push({ x: ROBO_WASH_POS.x + 6.2, z: ROBO_WASH_POS.z, r: 2.2 });

        // =====================================================================
        // 5A-3. FIREHOUSE HQ SUPER CATAPULT LAUNCH PAD
        //       Located at X: 36, Z: -45 mirroring Robo-Wash on Firehouse Apron
        // =====================================================================
        const catapultGroup = new THREE.Group();
        catY = getTerrainHeight(CATAPULT_POS.x, CATAPULT_POS.z);
        catapultGroup.position.set(CATAPULT_POS.x, catY, CATAPULT_POS.z);

        // Foundation slab with launch marks
        const catSlab = new THREE.Mesh(
            new THREE.BoxGeometry(13, 0.45, 22),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.6 })
        );
        catSlab.position.set(0, 0.22, 0);
        catSlab.receiveShadow = true;
        catapultGroup.add(catSlab);

        // Heavy Hazard Yellow & Black Guide Rails
        [-5.8, 5.8].forEach(rx => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 21.5), matHazardYellow);
            rail.position.set(rx, 0.8, 0);
            rail.castShadow = true;
            catapultGroup.add(rail);
        });

        // Rear Blast Shield Deflector at z = -10.2
        const blastShield = new THREE.Mesh(
            new THREE.BoxGeometry(12.5, 5.5, 1.4),
            new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 })
        );
        blastShield.position.set(0, 2.75, -10.2);
        blastShield.rotation.x = -0.2; // tilted deflector
        blastShield.castShadow = true;
        catapultGroup.add(blastShield);

        // Archway over rear with HQ CATAPULT Signboard
        const catArch = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.4, 1.4), matHazardYellow);
        catArch.position.set(0, 8.8, -9.8);
        catapultGroup.add(catArch);

        [-5.8, 5.8].forEach(px => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8.8, 1.2), matHazardYellow);
            post.position.set(px, 4.4, -9.8);
            post.castShadow = true;
            catapultGroup.add(post);
        });

        // Signboard
        const cSignCat = document.createElement('canvas');
        cSignCat.width = 512;
        cSignCat.height = 128;
        const cCtxCat = cSignCat.getContext('2d');
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
        catapultGroup.add(catSignFace);

        // Hydraulic Catapult Launch Shuttle Plate in Center
        catapultCarriage = new THREE.Mesh(
            new THREE.BoxGeometry(7.2, 0.5, 8.5),
            new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 })
        );
        catapultCarriage.position.set(0, 0.45, -3.5);
        catapultCarriage.castShadow = true;
        catapultGroup.add(catapultCarriage);

        // 4 Hydraulic Steel Pistons under carriage
        [-2.8, 2.8].forEach(px => {
            [-6.5, -0.5].forEach(pz => {
                const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.6, 8), matChrome);
                piston.position.set(px, 0.8, pz);
                catapultGroup.add(piston);
            });
        });

        // Runway Strobe Light Fixtures (Flashing White & Yellow along rails)
        catapultStrobes.length = 0;
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
        s.add(catapultGroup);
        registerCullableObject(catapultGroup, CATAPULT_POS.x, catY + 5, CATAPULT_POS.z, 28);
        worldColliders.push({ x: CATAPULT_POS.x - 6.2, z: CATAPULT_POS.z, r: 2.2 });
        worldColliders.push({ x: CATAPULT_POS.x + 6.2, z: CATAPULT_POS.z, r: 2.2 });
        worldColliders.push({ x: CATAPULT_POS.x, z: CATAPULT_POS.z - 10.5, r: 3.5 });

        // =====================================================================
        // 5A-4. GRIFFIN ROCK DRIVE-THRU DINER
        //       Located at X: 78, Z: -15 in East Town Plaza
        // =====================================================================
        dinerGroup = new THREE.Group();
        dinerY = getTerrainHeight(DINER_POS.x, DINER_POS.z);
        dinerGroup.position.set(DINER_POS.x, dinerY, DINER_POS.z);

        // Ground Plinth & Drive-Thru Asphalt Bay
        const dinerPlinth = new THREE.Mesh(
            new THREE.BoxGeometry(26, 0.45, 26),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
        );
        dinerPlinth.position.y = 0.22;
        dinerPlinth.receiveShadow = true;
        dinerGroup.add(dinerPlinth);

        // Drive-Thru Lane Guide Curbs (Drive-thru on West side at x ~ -8.5)
        [-12.2, -4.8].forEach(cx => {
            const curb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 25), matHazardYellow);
            curb.position.set(cx, 0.5, 0);
            dinerGroup.add(curb);
        });

        // Main Diner Restaurant Building (offset slightly to East side at x = +4.2)
        const matDinerTeal = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
        const matDinerPink = new THREE.MeshToonMaterial({ color: 0xf43f5e, gradientMap: toonGrad3 });
        const dinerBody = new THREE.Mesh(
            new THREE.BoxGeometry(15, 8.5, 18),
            matDinerTeal
        );
        dinerBody.position.set(4.2, 4.5, 0);
        dinerBody.castShadow = true;
        dinerBody.receiveShadow = true;
        dinerGroup.add(dinerBody);

        // Chrome Art-Deco Trim Band around diner
        const dinerTrim = new THREE.Mesh(
            new THREE.BoxGeometry(15.4, 0.8, 18.4),
            matChrome
        );
        dinerTrim.position.set(4.2, 5.5, 0);
        dinerGroup.add(dinerTrim);

        // Large Panoramic Glass Windows on front and sides
        const dinerWinFront = new THREE.Mesh(
            new THREE.BoxGeometry(13.5, 3.2, 0.3),
            matGlass
        );
        dinerWinFront.position.set(4.2, 4.2, 9.1);
        dinerWinFront.userData.noOutline = true;
        dinerGroup.add(dinerWinFront);

        // Drive-Thru Service Pickup Window on West wall (facing lane at x = -3.3)
        const dinerWinDrive = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 3.2, 4.5),
            matGlass
        );
        dinerWinDrive.position.set(-3.35, 4.2, -2.5);
        dinerWinDrive.userData.noOutline = true;
        dinerGroup.add(dinerWinDrive);

        // Drive-Thru Pickup Counter Shelf & Canopy
        const pickupCounter = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.3, 5.2),
            matSteel
        );
        pickupCounter.position.set(-3.8, 2.7, -2.5);
        dinerGroup.add(pickupCounter);

        const pickupAwning = new THREE.Mesh(
            new THREE.BoxGeometry(3.6, 0.5, 6.2),
            matDinerPink
        );
        pickupAwning.position.set(-4.8, 6.8, -2.5);
        pickupAwning.rotation.z = -0.2;
        dinerGroup.add(pickupAwning);

        // Drive-Thru Order Intercom Post (at local x: -10.5, z: 6.5)
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
        intercomGroup.add(intercomScreen);
        dinerGroup.add(intercomGroup);

        // Diner Roof Sign: "GRIFFIN DINER"
        const cSignDin = document.createElement('canvas');
        cSignDin.width = 512;
        cSignDin.height = 128;
        const cCtxDin = cSignDin.getContext('2d');
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
        dinerGroup.add(dinSignFace);

        // Giant 3D Animated Cheeseburger on Roof
        dinerBurgerGroup = new THREE.Group();
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
            const ang = (s / 18) * Math.PI * 2 + Math.random() * 0.3;
            const dist = 0.8 + Math.random() * 2.2;
            seed.position.set(Math.cos(ang) * dist, 2.85 + Math.random() * 0.45, Math.sin(ang) * dist);
            seed.userData.noOutline = true;
            dinerBurgerGroup.add(seed);
        }

        dinerGroup.add(dinerBurgerGroup);

        applyCartoonInkOutlines(dinerGroup, 1.03, true);
        s.add(dinerGroup);
        registerCullableObject(dinerGroup, DINER_POS.x, dinerY + 6, DINER_POS.z, 32);
        worldColliders.push({ x: DINER_POS.x + 4.2, z: DINER_POS.z, r: 8.5 });
        worldColliders.push({ x: DINER_POS.x - 12.5, z: DINER_POS.z, r: 1.5 });

        // =====================================================================
        // 5A-5. DOC GREENE'S ENERGON TURBO-CHARGER STATION
        //       Located at X: -1110, Z: -42 in West Tech Village
        // =====================================================================
        const chargerGroup = new THREE.Group();
        chargerY = getTerrainHeight(CHARGER_POS.x, CHARGER_POS.z);
        chargerGroup.position.set(CHARGER_POS.x, chargerY, CHARGER_POS.z);

        const matTechBase = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.7 });
        const matTechCyan = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
        const matTechPurple = new THREE.MeshToonMaterial({ color: 0xa855f7, gradientMap: toonGrad3 });
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

        energonCoilRings.length = 0;
        energonOrbs.length = 0;
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
                const ringMat = r % 2 === 0 ? matTechCyan : matTechPurple;
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(1.65 - r * 0.12, 0.32, 8, 16),
                    ringMat
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
        const cCtxChg = cSignChg.getContext('2d');
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
        chargerGroup.add(chgSignFace);

        applyCartoonInkOutlines(chargerGroup, 1.03, true);
        s.add(chargerGroup);
        registerCullableObject(chargerGroup, CHARGER_POS.x, chargerY + 6, CHARGER_POS.z, 30);
        worldColliders.push({ x: CHARGER_POS.x - 6.5, z: CHARGER_POS.z, r: 2.8 });
        worldColliders.push({ x: CHARGER_POS.x + 6.5, z: CHARGER_POS.z, r: 2.8 });

        // =====================================================================
        // 5A-6. DOC GREENE'S GROUNDBRIDGE TELEPORTER TUNNEL NETWORK
        //       Portal A: West Tech Outpost (-1085, 62) facing North-South (rotY = 0)
        //       Portal B: South Harbor Staging Bay (48, 1040) facing North-South (rotY = 0)
        //       Portal C: Dino Ridge Sanctuary Gateway (-750, -665) facing North-South (rotY = 0)
        //       Portal D: Wayward Island Ruins Terrace (1895, 492) facing East-West (rotY = PI/2)
        // =====================================================================
        const GROUNDBRIDGE_CONFIGS = [
            { id: 'A', name: 'West Tech GroundBridge', x: -1085, z: 62, rotY: 0, dest: { x: -750, z: -682, heading: 0 } },
            { id: 'B', name: 'South Harbor GroundBridge', x: 48, z: 1040, rotY: 0, dest: { x: 1912, z: 492, heading: Math.PI / 2 } },
            { id: 'C', name: 'Dino Ridge GroundBridge', x: -750, z: -665, rotY: 0, dest: { x: 48, z: 1058, heading: 0 } },
            { id: 'D', name: 'Wayward Island GroundBridge', x: 1895, z: 492, rotY: Math.PI / 2, dest: { x: -1085, z: 44, heading: Math.PI } }
        ];

        groundBridgePortals.length = 0;

        GROUNDBRIDGE_CONFIGS.forEach(cfg => {
            const gbGroup = new THREE.Group();
            const gbY = getTerrainHeight(cfg.x, cfg.z);
            gbGroup.position.set(cfg.x, gbY, cfg.z);
            gbGroup.rotation.y = cfg.rotY;

            // Paved GroundBridge Turnout Staging Apron & Access Pad
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

            const ringRadius = 7.8;
            const archFrame = new THREE.Mesh(
                new THREE.TorusGeometry(ringRadius, 1.25, 8, 16),
                matDarkSteel
            );
            archFrame.position.set(0, 8.2, 0);
            archFrame.castShadow = true;
            gbGroup.add(archFrame);

            const matGlowCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
            const matGlowPurple = new THREE.MeshBasicMaterial({ color: 0xc084fc });
            const matGlowBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

            const irisRing1 = new THREE.Mesh(
                new THREE.TorusGeometry(7.0, 0.42, 6, 24),
                matGlowCyan
            );
            irisRing1.position.set(0, 8.2, 0);
            irisRing1.userData.noOutline = true;
            gbGroup.add(irisRing1);

            const irisRing2 = new THREE.Mesh(
                new THREE.TorusGeometry(5.6, 0.38, 6, 20),
                matGlowPurple
            );
            irisRing2.position.set(0, 8.2, 0.15);
            irisRing2.userData.noOutline = true;
            gbGroup.add(irisRing2);

            const irisRing3 = new THREE.Mesh(
                new THREE.TorusGeometry(4.2, 0.35, 6, 16),
                matGlowBlue
            );
            irisRing3.position.set(0, 8.2, -0.15);
            irisRing3.userData.noOutline = true;
            gbGroup.add(irisRing3);

            const vortexDisc = new THREE.Mesh(
                new THREE.CircleGeometry(6.6, 24),
                new THREE.MeshBasicMaterial({
                    color: 0x38bdf8,
                    transparent: true,
                    opacity: 0.65,
                    side: THREE.DoubleSide
                })
            );
            vortexDisc.position.set(0, 8.2, 0);
            vortexDisc.userData.noOutline = true;
            gbGroup.add(vortexDisc);

            const cSignGb = document.createElement('canvas');
            cSignGb.width = 512;
            cSignGb.height = 128;
            const cCtxGb = cSignGb.getContext('2d');
            cCtxGb.fillStyle = '#0f172a';
            cCtxGb.fillRect(0, 0, 512, 128);
            cCtxGb.fillStyle = '#38bdf8';
            cCtxGb.font = 'bold 42px Arial, sans-serif';
            cCtxGb.textAlign = 'center';
            cCtxGb.textBaseline = 'middle';
            cCtxGb.fillText('GROUNDBRIDGE ' + cfg.id, 256, 64);
            const texSignGb = new THREE.CanvasTexture(cSignGb);
            const gbSignFace = new THREE.Mesh(
                new THREE.PlaneGeometry(8.2, 1.8),
                new THREE.MeshBasicMaterial({ map: texSignGb })
            );
            gbSignFace.position.set(0, 16.4, 0.7);
            gbGroup.add(gbSignFace);

            applyCartoonInkOutlines(gbGroup, 1.03, true);
            s.add(gbGroup);
            registerCullableObject(gbGroup, cfg.x, gbY + 8, cfg.z, 28);

            if (cfg.rotY !== 0) {
                worldColliders.push({ x: cfg.x, z: cfg.z - 8.5, r: 2.2 });
                worldColliders.push({ x: cfg.x, z: cfg.z + 8.5, r: 2.2 });
            } else {
                worldColliders.push({ x: cfg.x - 8.5, z: cfg.z, r: 2.2 });
                worldColliders.push({ x: cfg.x + 8.5, z: cfg.z, r: 2.2 });
            }

            groundBridgePortals.push({
                cfg,
                group: gbGroup,
                irisRing1,
                irisRing2,
                irisRing3,
                vortexDisc,
                baseY: gbY
            });
        });

        // =====================================================================
        // 5B. GRIFFIN TOWN BUILDINGS, REGIONAL VILLAGES, LIGHTHOUSE & SKY ARRAY
        // =====================================================================
        function createTownBuilding(x, z, w, h, d, roofColor, wallColor, rotY = 0) {
            const group = new THREE.Group();
            const gy = getTerrainHeight(x, z);
            group.position.set(x, gy, z);
            group.rotation.y = rotY;

            // 3D Raised Sidewalk Foundation Curb Plinth under each Town Building
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

            s.add(group);
            registerCullableObject(group, x, gy + h * 0.5, z, Math.max(w, d, h) + 12);
            worldColliders.push({ x, z, r: Math.max(w, d) * 0.58 });
        }

        // 1. Central Griffin Town Plaza (Vibrant TV-Show Cartoon Palette)
        // Spaced out generously across the enlarged plaza (X: -135..+135, Z: -105..+135), completely clear of roads
        createTownBuilding(-52, 72, 14, 13, 14, 0x1d4ed8, 0xffffff, 0.1);   // Police Precinct (North-West Plaza)
        createTownBuilding(52, 72, 15, 14, 14, 0x16a34a, 0xf8fafc, -0.1);   // Doc Greene's Lab (North-East Plaza)
        createTownBuilding(-95, 72, 12, 10, 12, 0xf97316, 0xfef08a, 0.25);  // Town Bakery (West North-Avenue)
        createTownBuilding(95, 72, 14, 15, 14, 0x0284c7, 0xf0f9ff, -0.05); // Griffin Bank (East North-Avenue)
        createTownBuilding(-95, -72, 14, 11, 14, 0xe81e25, 0xffffff, 0.05);  // Municipal Garage (South-West Plaza)
        createTownBuilding(52, 115, 15, 14, 15, 0x9333ea, 0xfaf5ff, -0.2);   // Town Hall & Clock Tower (Far North Head)

        // 2. South Harbor Port District
        // Set back generously on north inland gateway and south seaward waterfront plazas, >43m clear of all roads
        createTownBuilding(-62, 1072, 16, 12, 14, 0x0284c7, 0xf8fafc, 0.08);  // North-West Harbor Logistics Office
        createTownBuilding(62, 1072, 16, 13, 14, 0xe81e25, 0xfef08a, -0.08);  // North-East Harbor Fishery & Cafe
        createTownBuilding(-62, 1162, 16, 11, 14, 0xf97316, 0xffffff, 0.15);  // South-West Harbor Customs House
        createTownBuilding(62, 1162, 16, 14, 14, 0x16a34a, 0xf0fdf4, -0.15);  // South-East Ferry Terminal & Harbor Master

        // 3. West Tech & Industrial Village (around -1120, 25)
        // Set back along north and south tech village plazas, clear of East-West Highway & Outer Ring
        createTownBuilding(-1160, -75, 16, 15, 15, 0x0284c7, 0xffffff, 0.12);
        createTownBuilding(-1120, -75, 15, 13, 15, 0x9333ea, 0xfaf5ff, -0.1);
        createTownBuilding(-1160, 115, 16, 12, 15, 0x16a34a, 0xf8fafc, -0.08);
        createTownBuilding(-1080, 115, 15, 14, 15, 0xf97316, 0xfef08a, 0.14);

        // 4. North Observatory Research Outpost (around 0, -1120)
        // Clustered safely on observatory campus, away from the diagonal Outer Ring curve and NS road
        createTownBuilding(-55, -1180, 16, 14, 15, 0x1d4ed8, 0xf8fafc, 0.1);
        createTownBuilding(55, -1180, 16, 15, 15, 0x0284c7, 0xffffff, -0.1);
        createTownBuilding(-55, -1060, 14, 12, 14, 0x16a34a, 0xf0fdf4, -0.12);
        createTownBuilding(55, -1060, 14, 12, 14, 0xe81e25, 0xfef2f2, 0.12);

        // Coastal Lighthouse on East Peninsula Lookout (1320, 60)
        const lhX = 1320, lhZ = 60;
        const lighthouseGroup = new THREE.Group();
        const lhY = getTerrainHeight(lhX, lhZ);
        lighthouseGroup.position.set(lhX, lhY, lhZ);
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

        const matLhBeam = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
        const lhBeam = new THREE.Mesh(
            new THREE.ConeGeometry(16, 130, 16, 1, true),
            matLhBeam
        );
        lhBeam.rotation.z = Math.PI / 2;
        lhBeam.position.set(62, 41.0, 0);

        const lhBeamOpposite = new THREE.Mesh(
            new THREE.ConeGeometry(16, 130, 16, 1, true),
            matLhBeam
        );
        lhBeamOpposite.rotation.z = -Math.PI / 2;
        lhBeamOpposite.position.set(-62, 41.0, 0);

        lhBeamPivot = new THREE.Group();
        lhBeamPivot.add(lhBeam);
        lhBeamPivot.add(lhBeamOpposite);
        lighthouseGroup.add(lhBeamPivot);
        s.add(lighthouseGroup);
        registerCullableObject(lighthouseGroup, lhX, lhY + 24, lhZ, 95);
        worldColliders.push({ x: lhX, z: lhZ, r: 8.5 });

        // South Harbor Seawall Bulkhead along the concrete quay apron (z = 1183.5)
        const harborSeawall = new THREE.Mesh(
            new THREE.BoxGeometry(212, 7.5, 4.2),
            new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 })
        );
        harborSeawall.position.set(0, -0.4, 1183.5);
        harborSeawall.receiveShadow = true;
        applyCartoonInkOutlines(harborSeawall, 1.02, true);
        s.add(harborSeawall);
        registerCullableObject(harborSeawall, 0, 1, 1184, 115);

        // South Harbor Pier Dock extending out over South Harbor Bay Water (z = 1180 to 1276)
        const pierGroup = new THREE.Group();
        const pierDeck = new THREE.Mesh(
            new THREE.BoxGeometry(32, 4.0, 96),
            new THREE.MeshToonMaterial({ color: 0x9a3412, gradientMap: toonGrad3 })
        );
        pierDeck.position.set(0, 1.4, 1228);
        pierDeck.receiveShadow = true;
        pierDeck.castShadow = true;
        applyCartoonInkOutlines(pierDeck, 1.03, true);
        pierGroup.add(pierDeck);

        // Marine Wooden / Concrete Support Pilings under the Pier
        const matPiling = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });
        for (let pz = 1192; pz <= 1268; pz += 15.2) {
            [-13, 13].forEach(px => {
                const piling = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 12, 8), matPiling);
                piling.position.set(px, -2.5, pz);
                pierGroup.add(piling);
            });
        }

        // Yellow Mooring Cleats / Bollards along Pier edges
        const matBollard = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
        for (let bz = 1196; bz <= 1266; bz += 17.5) {
            [-15, 15].forEach(bx => {
                const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.4, 8), matBollard);
                bollard.position.set(bx, 3.8, bz);
                pierGroup.add(bollard);
            });
        }
        s.add(pierGroup);
        registerCullableObject(pierGroup, 0, 2, 1228, 65);

        // 1A. South Harbor Gantry Cargo Cranes & Interactive High-Flying Magnet Crane
        const matCraneYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
        const matContainerRed = new THREE.MeshToonMaterial({ color: 0xe11d48, gradientMap: toonGrad3 });
        const matContainerBlue = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad3 });
        const matContainerGreen = new THREE.MeshToonMaterial({ color: 0x16a34a, gradientMap: toonGrad3 });
        const matContainerOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 });

        // East Static Cargo Gantry Crane (x: 32, z: 1172)
        {
            const craneX = 32, craneZ = 1172;
            const cy = Math.max(0.5, getTerrainHeight(craneX, craneZ));
            const craneGroup = new THREE.Group();
            craneGroup.position.set(craneX, cy, craneZ);

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
            s.add(craneGroup);
            registerCullableObject(craneGroup, craneX, cy + 16, craneZ + 8, 42);
            worldColliders.push({ x: craneX, z: craneZ, r: 6.5 });
        }

        // =====================================================================
        // INTERACTIVE HIGH-FLYING MAGNETIC GANTRY CRANE (At X: -110, Z: 1150)
        // =====================================================================
        craneInteractive = {
            craneX: -105,
            craneZ: 1162,
            padX: -105,
            padZ: 1142,
            dropX: -105,
            dropZ: 1176,
            state: 'IDLE', // 'IDLE', 'LOCKING', 'HOISTING', 'SWINGING', 'RELEASING', 'RESETTING'
            timer: 0,
            cooldown: 0,
            boomPivot: null,
            cableMesh: null,
            magnetGroup: null,
            padLights: []
        };

        {
            const cy = Math.max(0.5, getTerrainHeight(craneInteractive.craneX, craneInteractive.craneZ));
            const craneGroup = new THREE.Group();
            craneGroup.position.set(craneInteractive.craneX, cy, craneInteractive.craneZ);

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

            // Rotating Upper Boom Pivot
            const boomPivot = new THREE.Group();
            boomPivot.position.set(0, 29.8, 0);

            const boom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 48), matCraneYellow);
            boom.position.set(0, 0, 0);
            boom.castShadow = true;
            boomPivot.add(boom);

            const cableMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 22, 8), matDarkSteel);
            cableMesh.position.set(0, -11, -24);
            boomPivot.add(cableMesh);

            const magnetGroup = new THREE.Group();
            magnetGroup.position.set(0, -21.5, -24);

            const magnetPlate = new THREE.Mesh(
                new THREE.CylinderGeometry(2.4, 2.6, 1.1, 16),
                matDarkSteel
            );
            magnetGroup.add(magnetPlate);

            const magnetGlow = new THREE.Mesh(
                new THREE.TorusGeometry(1.8, 0.35, 8, 20),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
            );
            magnetGlow.rotation.x = Math.PI / 2;
            magnetGlow.position.y = -0.45;
            magnetGroup.add(magnetGlow);

            const magnetBulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.65, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            magnetBulb.position.y = 0.8;
            magnetGroup.add(magnetBulb);

            boomPivot.add(magnetGroup);
            craneGroup.add(boomPivot);

            craneInteractive.boomPivot = boomPivot;
            craneInteractive.cableMesh = cableMesh;
            craneInteractive.magnetGroup = magnetGroup;

            applyCartoonInkOutlines(craneGroup, 1.035, true);
            s.add(craneGroup);
            registerCullableObject(craneGroup, craneInteractive.craneX, cy + 16, craneInteractive.craneZ, 48);
            worldColliders.push({ x: craneInteractive.craneX, z: craneInteractive.craneZ, r: 6.5 });
        }

        // Ground Target Pickup Pad for Crane Magnet at (-32, 1148)
        {
            const padY = Math.max(0.5, getTerrainHeight(craneInteractive.padX, craneInteractive.padZ));
            const padMesh = new THREE.Mesh(
                new THREE.BoxGeometry(9.0, 0.35, 9.0),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
            );
            padMesh.position.set(craneInteractive.padX, padY + 0.18, craneInteractive.padZ);
            padMesh.receiveShadow = true;
            s.add(padMesh);

            const padBorder = new THREE.Mesh(
                new THREE.RingGeometry(3.2, 4.1, 24).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
            );
            padBorder.position.set(craneInteractive.padX, padY + 0.37, craneInteractive.padZ);
            s.add(padBorder);

            [[-3.8, -3.8], [3.8, -3.8], [-3.8, 3.8], [3.8, 3.8]].forEach(([ox, oz]) => {
                const bulb = new THREE.Mesh(
                    new THREE.SphereGeometry(0.35, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
                );
                bulb.position.set(craneInteractive.padX + ox, padY + 0.5, craneInteractive.padZ + oz);
                bulb.userData.noOutline = true;
                s.add(bulb);
                craneInteractive.padLights.push(bulb);
            });
        }

        // 1B. Stacked Colorful Shipping Containers in South Harbor Yard
        // Grouped neatly in dedicated west and east port cargo staging berths, completely clear of roads
        const containerMats = [matContainerRed, matContainerBlue, matContainerGreen, matContainerOrange, matCraneYellow];
        [
            { x: -102, z: 1150, rotY: 0.05 },
            { x: 102, z: 1150, rotY: -0.05 },
            { x: -130, z: 1150, rotY: 0.12 },
            { x: 130, z: 1150, rotY: -0.12 }
        ].forEach((yard, yIdx) => {
            const yardGroup = new THREE.Group();
            const yy = Math.max(0.5, getTerrainHeight(yard.x, yard.z));
            yardGroup.position.set(yard.x, yy, yard.z);
            yardGroup.rotation.y = yard.rotY;

            for (let row = 0; row < 2; row++) {
                const levels = row === 0 ? 3 : 2;
                for (let lvl = 0; lvl < levels; lvl++) {
                    const cMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(5.6, 5.2, 13.5),
                        containerMats[(yIdx + row * 2 + lvl) % containerMats.length]
                    );
                    cMesh.position.set((row - 0.5) * 6.4, 2.6 + lvl * 5.25, 0);
                    cMesh.castShadow = true;
                    cMesh.receiveShadow = true;
                    yardGroup.add(cMesh);
                }
            }
            applyCartoonInkOutlines(yardGroup, 1.04, true);
            s.add(yardGroup);
            registerCullableObject(yardGroup, yard.x, yy + 8, yard.z, 24);
            worldColliders.push({ x: yard.x, z: yard.z, r: 9.5 });
        });

        // =====================================================================
        // 1C. RIDEABLE SOUTH HARBOR RESCUE FERRY BOAT
        // =====================================================================
        ferryController = {
            state: 'DOCKED', // 'DOCKED', 'BOARDING', 'CRUISING', 'DOCKING'
            timeInState: 0,
            cruiseTime: 0,
            boardingCooldown: 0,
            dockPos: new THREE.Vector3(36, -0.2, 1232),
            dockRotY: 0,
            currentPos: new THREE.Vector3(36, -0.2, 1232),
            prevPos: new THREE.Vector3(36, -0.2, 1232),
            currentRotY: 0,
            prevRotY: 0,
            rampMesh: null,
            rampAngle: 0.42,
            lastCommentTime: 0,
            waypoints: [
                { x: 36, z: 1232 }, // Mooring slip
                { x: 36, z: 1310 }, // Reverse out of harbor slip into open deep water
                { x: -30, z: 1410 }, // South-west bay open water
                { x: -120, z: 1510 }, // Outer bay west reach
                { x: -80, z: 1610 }, // Outer bay scenic turn
                { x: 40, z: 1580 }, // Bay center crossing
                { x: 110, z: 1460 }, // East bay curve (clear of shoreline by >100m)
                { x: 70, z: 1330 }, // Aligning with harbor channel
                { x: 36, z: 1232 } // Safe docking return
            ]
        };

        harborFerryGroup = new THREE.Group();
        harborFerryGroup.position.copy(ferryController.dockPos);

        const matFerryRed = new THREE.MeshToonMaterial({ color: 0xe11d48, gradientMap: toonGrad3 });
        const matFerryWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
        const matFerryDeck = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 });

        // Red Main Hull (Y: -0.4 to 4.8)
        const ferryHull = new THREE.Mesh(new THREE.BoxGeometry(16, 5.2, 42), matFerryRed);
        ferryHull.position.y = 2.2;
        ferryHull.castShadow = true;
        harborFerryGroup.add(ferryHull);

        // Hydrodynamic Bow Wedge
        const ferryBow = new THREE.Mesh(
            new THREE.ConeGeometry(11.2, 14, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4),
            matFerryRed
        );
        ferryBow.scale.set(1.0, 0.48, 1.0);
        ferryBow.position.set(0, 2.2, 27.5);
        harborFerryGroup.add(ferryBow);

        // Dark Non-Slip Car Deck (Top surface at Y = 5.05)
        const ferryCarDeck = new THREE.Mesh(
            new THREE.BoxGeometry(12.4, 0.5, 36),
            matFerryDeck
        );
        ferryCarDeck.position.set(0, 4.8, 0);
        ferryCarDeck.receiveShadow = true;
        harborFerryGroup.add(ferryCarDeck);

        // Center Yellow Parking & Driving Lane Stripes
        for (let lz = -14; lz <= 14; lz += 4.5) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(0.7, 2.5).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            stripe.position.set(0, 5.08, lz);
            harborFerryGroup.add(stripe);
        }

        // Port & Starboard Safety Bulwarks / Railings
        [-5.8, 5.8].forEach(rx => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 35), matHazardYellow);
            rail.position.set(rx, 5.7, 0);
            harborFerryGroup.add(rail);
        });

        // -------------------------------------------------------------
        // TIER 1: Solid Lower Superstructure Bulkhead Towers & Drive-Through Archway
        // Firmly anchors the upper bridge down onto the car deck with ZERO air gaps!
        // -------------------------------------------------------------
        [-5.0, 5.0].forEach(tx => {
            const tower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 20), matFerryWhite);
            tower.position.set(tx, 6.7, 0);
            tower.castShadow = true;
            harborFerryGroup.add(tower);

            // Circular porthole cabin windows
            [-6, 0, 6].forEach(wz => {
                const porthole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.65, 0.65, 0.35, 12).rotateZ(Math.PI / 2),
                    matGlass
                );
                porthole.position.set(tx > 0 ? tx + 1.15 : tx - 1.15, 6.8, wz);
                harborFerryGroup.add(porthole);
            });
        });

        // Upper Observation Deck Floor Platform (Y: 8.65, Top surface at 8.9)
        const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.5, 22), matFerryDeck);
        upperDeck.position.set(0, 8.65, 0);
        upperDeck.receiveShadow = true;
        harborFerryGroup.add(upperDeck);

        // Upper deck perimeter safety handrails
        [-6.0, 6.0].forEach(rx => {
            const uRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 21.6), matFerryWhite);
            uRail.position.set(rx, 9.45, 0);
            harborFerryGroup.add(uRail);
        });

        // -------------------------------------------------------------
        // TIER 2: Navigation Bridge / Wheelhouse (Seated flush on Upper Deck at Y = 8.9)
        // -------------------------------------------------------------
        const ferryBridge = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.2, 8.6), matFerryWhite);
        ferryBridge.position.set(0, 10.5, 3.5);
        ferryBridge.castShadow = true;
        harborFerryGroup.add(ferryBridge);

        // Panoramic Cyan Windshield
        const ferryGlass = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.6, 6.8), matGlass);
        ferryGlass.position.set(0, 10.9, 4.2);
        harborFerryGroup.add(ferryGlass);

        // Bridge Roof Cap
        const bridgeRoof = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.4, 9.0), matFerryWhite);
        bridgeRoof.position.set(0, 12.2, 3.5);
        harborFerryGroup.add(bridgeRoof);

        // -------------------------------------------------------------
        // TIER 3: Helipad on Roof & Funnels on Upper Deck
        // -------------------------------------------------------------
        const helipadDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(4.2, 4.2, 0.25, 24),
            new THREE.MeshBasicMaterial({ color: 0x0284c7 })
        );
        helipadDisc.position.set(0, 12.52, 3.5);
        harborFerryGroup.add(helipadDisc);

        const helipadRing = new THREE.Mesh(
            new THREE.RingGeometry(3.4, 3.9, 24).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
        );
        helipadRing.position.set(0, 12.67, 3.5);
        harborFerryGroup.add(helipadRing);

        const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        hBar1.position.set(-1.0, 12.68, 3.5);
        harborFerryGroup.add(hBar1);
        const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        hBar2.position.set(1.0, 12.68, 3.5);
        harborFerryGroup.add(hBar2);
        const hCross = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        hCross.position.set(0, 12.68, 3.5);
        harborFerryGroup.add(hCross);

        // Funnel Pedestal / Engine Casing sitting solidly on upper deck
        const funnelBase = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.2, 4.5), matFerryWhite);
        funnelBase.position.set(0, 9.5, -5.2);
        funnelBase.castShadow = true;
        harborFerryGroup.add(funnelBase);

        // Twin Rescue Yellow Funnels resting flush on the pedestal
        [-2.8, 2.8].forEach(stackX => {
            const funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 4.5, 12), matCraneYellow);
            funnel.position.set(stackX, 12.2, -5.2);
            funnel.castShadow = true;
            harborFerryGroup.add(funnel);

            const funnelRim = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.45, 12), matDarkSteel);
            funnelRim.position.set(stackX, 14.5, -5.2);
            harborFerryGroup.add(funnelRim);
        });

        // Articulated Stern Tailgate Boarding Ramp
        const ferryRampPivot = new THREE.Group();
        ferryRampPivot.position.set(0, 4.8, -18);
        const rampSlab = new THREE.Mesh(
            new THREE.BoxGeometry(10.8, 0.45, 9.5),
            matFerryDeck
        );
        rampSlab.position.set(0, 0, -4.75);
        rampSlab.receiveShadow = true;
        ferryRampPivot.add(rampSlab);
        harborFerryGroup.add(ferryRampPivot);
        ferryController.rampMesh = ferryRampPivot;

        // Fixed Pier Boarding Bridge connecting South Harbor Pier Deck to Ferry Mooring Slip
        const boardingBridgeGroup = new THREE.Group();

        // Main Boarding Ramp connecting Pier (X: 16, Y: 3.4, Z: 1204..1218) to Ferry Stern Ramp (X: 36, Y: 4.8, Z: 1206..1218)
        const rampLengthX = 22.0;
        const rampWidthZ = 14.0;
        const bridgeRamp = new THREE.Mesh(
            new THREE.BoxGeometry(rampLengthX, 0.75, rampWidthZ),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
        );
        bridgeRamp.position.set(26.0, 4.1, 1211.0);
        bridgeRamp.rotation.z = -0.068; // exact slope from y=3.4 at x=15 to y=4.8 at x=36
        bridgeRamp.receiveShadow = true;
        boardingBridgeGroup.add(bridgeRamp);

        // Warning Chevron hazard stripes along bridge entrance
        const hazardStripe1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 13.5).rotateX(-Math.PI / 2), matHazardYellow);
        hazardStripe1.position.set(16.2, 3.82, 1211.0);
        boardingBridgeGroup.add(hazardStripe1);

        const hazardStripe2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 13.5).rotateX(-Math.PI / 2), matHazardYellow);
        hazardStripe2.position.set(35.5, 5.22, 1211.0);
        boardingBridgeGroup.add(hazardStripe2);

        // Heavy-Duty Safety Guardrails along both sides of the bridge ramp
        [-6.6, 6.6].forEach(rz => {
            const guardRail = new THREE.Mesh(new THREE.BoxGeometry(rampLengthX, 1.2, 0.45), matHazardYellow);
            guardRail.position.set(26.0, 5.0, 1211.0 + rz);
            guardRail.rotation.z = -0.068;
            boardingBridgeGroup.add(guardRail);
        });

        // Marine Concrete Pilings supporting the boarding bridge
        [19.0, 26.0, 33.0].forEach(px => {
            [-5.5, 5.5].forEach(pz => {
                const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 12, 8), matPiling);
                pile.position.set(px, -2.0, 1211.0 + pz);
                boardingBridgeGroup.add(pile);
            });
        });

        // Direct Pedestrian Side Gangway connecting Pier Deck to Ferry Starboard Side (Z: 1228..1236, X: 16..30)
        const sideGangway = new THREE.Mesh(
            new THREE.BoxGeometry(14.0, 0.65, 8.0),
            new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35 })
        );
        sideGangway.position.set(23.0, 4.1, 1232.0);
        sideGangway.rotation.z = -0.08;
        sideGangway.receiveShadow = true;
        boardingBridgeGroup.add(sideGangway);

        [-3.6, 3.6].forEach(sgz => {
            const sRail = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.2, 0.35), matHazardYellow);
            sRail.position.set(23.0, 4.9, 1232.0 + sgz);
            sRail.rotation.z = -0.08;
            boardingBridgeGroup.add(sRail);
        });

        // Overhead "FERRY BOARDING" Welcome Arch at the entrance of the bridge on the pier
        const archGroup = new THREE.Group();
        archGroup.position.set(16.5, 3.4, 1211.0);
        [-6.5, 6.5].forEach(az => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.5, 0.7), matCraneYellow);
            post.position.set(0, 3.75, az);
            archGroup.add(post);

            const amberBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
            amberBeacon.position.set(0, 7.8, az);
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
        s.add(boardingBridgeGroup);
        registerCullableObject(boardingBridgeGroup, 26, 4, 1220, 35);

        applyCartoonInkOutlines(harborFerryGroup, 1.035, true);
        harborFerryGroup.traverse(child => {
            child.frustumCulled = false;
        });
        s.add(harborFerryGroup);

        // =====================================================================
        // 1D. DOC GREENE'S ANTI-GRAVITY TESTING YARD (X: -1250, Z: 65)
        // =====================================================================
        testYard = {
            baseX: -1250,
            baseZ: 65,
            bouncePad: { x: -1250, z: 58, radius: 5.5, mesh: null },
            speedStrip: { minX: -1290, maxX: -1210, z: 84, width: 7.0 },
            targets: []
        };

        const testYardGroup = new THREE.Group();
        const testYardY = Math.max(0.5, getTerrainHeight(testYard.baseX, testYard.baseZ));
        testYard.baseY = testYardY;
        testYardGroup.position.set(testYard.baseX, testYardY, testYard.baseZ);

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
        const cCtxTy = cSignTy.getContext('2d');
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

        // Ground-Supported Signboard Gantry Structure
        const signGroup = new THREE.Group();
        signGroup.position.set(0, 0, -28.5);

        // 1. Dual Heavy Structural Steel Support Pylons with Concrete Bases
        [-10.5, 10.5].forEach(postX => {
            const footing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.9, 1.2, 0.6, 8),
                matDarkSteel
            );
            footing.position.set(postX, 0.3, 0);
            footing.castShadow = true;
            signGroup.add(footing);

            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 8.5, 0.7),
                matSteel
            );
            post.position.set(postX, 4.25, 0);
            post.castShadow = true;
            signGroup.add(post);

            // High-Tech Science Beacon Dome
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), beaconMat);
            beacon.position.set(postX, 8.7, 0);
            beacon.userData.noOutline = true;
            signGroup.add(beacon);
        });

        // Horizontal Steel Structural Crossbars
        [4.2, 6.2].forEach(barY => {
            const crossbar = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.32, 0.45), matSteel);
            crossbar.position.set(0, barY, -0.15);
            signGroup.add(crossbar);
        });

        // 2. Solid Dark Steel Backing Board Frame
        const signBackboard = new THREE.Mesh(
            new THREE.BoxGeometry(23.6, 3.8, 0.45),
            matDarkSteel
        );
        signBackboard.position.set(0, 7.5, 0);
        signBackboard.castShadow = true;
        signGroup.add(signBackboard);

        // 3. Wide Front Sign Face (Shows 100% of the text without clipping)
        const tySignFace = new THREE.Mesh(
            new THREE.PlaneGeometry(23.0, 3.4),
            new THREE.MeshBasicMaterial({ map: texSignTy })
        );
        tySignFace.position.set(0, 7.5, 0.24);
        tySignFace.userData.noOutline = true;
        signGroup.add(tySignFace);

        testYardGroup.add(signGroup);

        // 1. Super Mega-Bounce Pad at local (0, -7) => world (-1170, 88)
        const bounceGroup = new THREE.Group();
        bounceGroup.position.set(0, 0.5, -7);

        const bounceRim = new THREE.Mesh(
            new THREE.CylinderGeometry(5.8, 6.4, 0.85, 16),
            matDarkSteel
        );
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
        bounceGroup.add(bounceRingGlow);

        testYard.bouncePad.mesh = bounceMembrane;
        testYardGroup.add(bounceGroup);

        // 2. Supersonic Rainbow Speed Strip at local z: 19 => world z: 114
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
            testYardGroup.add(chev);
        }

        // 3. 4 Interactive Color Splat Targets
        const targetDefs = [
            { id: 0, name: "Pink Splat Target", lx: 25, lz: -17, color: 0xf43f5e },
            { id: 1, name: "Cyan Splat Target", lx: -25, lz: -17, color: 0x06b6d4 },
            { id: 2, name: "Lime Splat Target", lx: 25, lz: 7, color: 0x84cc16 },
            { id: 3, name: "Orange Splat Target", lx: -25, lz: 7, color: 0xf97316 }
        ];

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
            tGroup.add(discInner);

            const discBull = new THREE.Mesh(
                new THREE.CylinderGeometry(0.65, 0.65, 0.55, 16).rotateX(Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: td.color })
            );
            discBull.position.y = 4.5;
            tGroup.add(discBull);

            testYardGroup.add(tGroup);

            testYard.targets.push({
                id: td.id,
                name: td.name,
                x: testYard.baseX + td.lx,
                z: testYard.baseZ + td.lz,
                color: td.color,
                mesh: tGroup,
                wobble: 0,
                cooldown: 0
            });
        });

        applyCartoonInkOutlines(testYardGroup, 1.03, true);
        s.add(testYardGroup);
        registerCullableObject(testYardGroup, testYard.baseX, testYardY + 5, testYard.baseZ, 55);
        worldColliders.push({ x: testYard.baseX - 35, z: testYard.baseZ, r: 2.5 });
        worldColliders.push({ x: testYard.baseX + 35, z: testYard.baseZ, r: 2.5 });

        // 2. Volcano Ridge Caldera (-735, -755): Glowing Animated Lava Pool, Lava Vents & Rising Smoke Plumes
        const volcanoGroup = new THREE.Group();
        const volcX = -735, volcZ = -755;
        const volcY = getTerrainHeight(volcX, volcZ);
        volcanoGroup.position.set(volcX, volcY, volcZ);

        // Basalt Crater Rim Boulders ringing the Lava Pool
        const matBasalt = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
        for (let i = 0; i < 14; i++) {
            const ang = (i / 14) * Math.PI * 2;
            const r = 24 + (i % 2) * 2.5;
            const rimRock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(5.5 + (i % 3) * 1.5, 0),
                matBasalt
            );
            rimRock.position.set(Math.cos(ang) * r, 2.2, Math.sin(ang) * r);
            rimRock.scale.set(1.2, 0.85, 1.1);
            rimRock.castShadow = true;
            volcanoGroup.add(rimRock);
        }

        // Glowing Animated Molten Lava Pool inside the Caldera
        volcanoLavaPool = new THREE.Group();
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

        // 3 Glowing Lava Vents / Fumarole Cones around Volcano Ridge
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

        // Rising Volcanic Smoke Plume Puffs
        volcanoSmokePuffs.length = 0;
        const matSmoke = new THREE.MeshToonMaterial({ color: 0x64748b, transparent: true, opacity: 0.72, gradientMap: toonGrad3 });
        for (let i = 0; i < 6; i++) {
            const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), matSmoke);
            puff.userData.noOutline = true;
            puff.userData.phase = i / 6;
            volcanoGroup.add(puff);
            volcanoSmokePuffs.push(puff);
        }

        applyCartoonInkOutlines(volcanoGroup, 1.04, false);
        s.add(volcanoGroup);
        registerCullableObject(volcanoGroup, volcX, volcY + 25, volcZ, 68);
        worldColliders.push({ x: volcX, z: volcZ, r: 24.0 });

        // 3. North Observatory (0, -1165): Giant Rotating Silver Telescope Dome & Solar Panel Arrays
        const obsX = 0, obsZ = -1165;
        const obsY = getTerrainHeight(obsX, obsZ);
        const observatoryGroup = new THREE.Group();
        observatoryGroup.position.set(obsX, obsY, obsZ);

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

        // Rotating Silver Hemisphere Dome & Protruding Deep-Space Telescope
        observatoryDomePivot = new THREE.Group();
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

        // Flanking Solar Panel Arrays at North Observatory
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
        s.add(observatoryGroup);
        registerCullableObject(observatoryGroup, obsX, obsY + 15, obsZ, 55);
        worldColliders.push({ x: obsX, z: obsZ, r: 17.5 });

        // 4. West Tech Park (-1175, 25): Doc Greene's Geodesic Glass Laboratory Dome & Spinning Wind Turbines
        const techX = -1175, techZ = 25;
        const techY = getTerrainHeight(techX, techZ);
        const techLabGroup = new THREE.Group();
        techLabGroup.position.set(techX, techY, techZ);

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

        // Glowing Energon Core Column inside Doc Greene's Lab Dome
        const labCorePillar = new THREE.Mesh(
            new THREE.CylinderGeometry(2.6, 2.6, 15, 14),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        labCorePillar.position.y = 9.5;
        labCorePillar.userData.noOutline = true;
        techLabGroup.add(labCorePillar);

        // 3 Towering Spinning Wind Turbines behind Doc Greene's Lab
        windTurbineRotors.length = 0;
        [[-22, -48], [-28, 0], [-22, 48]].forEach(([wx, wz]) => {
            const turbineGroup = new THREE.Group();
            turbineGroup.position.set(wx, 0, wz);

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
                const bladeTip = new THREE.Mesh(
                    new THREE.BoxGeometry(1.32, 2.6, 0.38),
                    matContainerRed
                );
                bladeTip.position.y = 12.2;
                bladePivot.add(blade, bladeTip);
                rotorHub.add(bladePivot);
            }
            turbineGroup.add(rotorHub);
            windTurbineRotors.push(rotorHub);
            techLabGroup.add(turbineGroup);
        });

        applyCartoonInkOutlines(techLabGroup, 1.035, true);
        s.add(techLabGroup);
        registerCullableObject(techLabGroup, techX - 10, techY + 20, techZ, 78);
        worldColliders.push({ x: techX, z: techZ, r: 19.0 });

        // Sky Array Communications Tower on North-East Peak (780, -780)
        const arrayGroup = new THREE.Group();
        const arrY = getTerrainHeight(780, -780);
        arrayGroup.position.set(780, arrY, -780);
        const arrTower = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 5.2, 34, 8), matSteel);
        arrTower.position.y = 17;
        arrayGroup.add(arrTower);
        applyCartoonInkOutlines(arrayGroup, 1.04, true);
        s.add(arrayGroup);
        registerCullableObject(arrayGroup, 780, arrY + 18, -780, 48);
        worldColliders.push({ x: 780, z: -780, r: 6.0 });

        // =====================================================================
        // 5. DINO RIDGE & MOUNT MAGMA SANCTUARY (-750, -750)
        // =====================================================================
        const dinoRidgeGroup = new THREE.Group();
        // drX, drZ exported at module level
        const drY = getTerrainHeight(drX, drZ);
        dinoRidgeGroup.position.set(drX, drY, drZ);

        // Grand Fossil Archway at Entrance (z = 48)
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

        // Sign on Archway
        const cSignDr = document.createElement('canvas');
        cSignDr.width = 512;
        cSignDr.height = 128;
        const cCtxDr = cSignDr.getContext('2d');
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
        archRibGroup.add(drSignFace);
        dinoRidgeGroup.add(archRibGroup);

        // Central Amber Energon Spire
        const matAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        amberSpire = new THREE.Mesh(new THREE.OctahedronGeometry(4.8, 0), matAmber);
        amberSpire.position.set(0, 9.5, 0);
        amberSpire.scale.set(1.0, 2.2, 1.0);
        dinoRidgeGroup.add(amberSpire);

        const amberPedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.8, 5.5, 8), matBasalt);
        amberPedestal.position.set(0, 2.75, 0);
        dinoRidgeGroup.add(amberPedestal);

        // 3 Animated Friendly Baby Dinos
        babyDinos.length = 0;
        const dinoConfigs = [
            { name: "Baby Rex", color: 0x22c55e, lx: -22, lz: -12, type: 'TREX' },
            { name: "Baby Trike", color: 0x0284c7, lx: 22, lz: -12, type: 'TRIKE' },
            { name: "Baby Bronto", color: 0xf97316, lx: 0, lz: -32, type: 'BRONTO' }
        ];

        dinoConfigs.forEach(cfg => {
            const dGroup = new THREE.Group();
            dGroup.position.set(cfg.lx, 0, cfg.lz);
            const matDino = new THREE.MeshToonMaterial({ color: cfg.color, gradientMap: toonGrad3 });

            // Body
            const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.2, 5.2), matDino);
            body.position.y = 3.2;
            body.castShadow = true;
            dGroup.add(body);

            // Head Pivot
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
                // Horns
                const matHorn = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
                [-0.9, 0.9].forEach(hx => {
                    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6).rotateX(Math.PI / 4), matHorn);
                    horn.position.set(hx, 1.4, 1.2);
                    headPivot.add(horn);
                });
            } else {
                // TREX
                headPivot.position.set(0, 3.8, 2.6);
                const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 3.8), matDino);
                head.position.set(0, 0.6, 0.6);
                headPivot.add(head);
            }

            // Big friendly cartoon eyes
            const matEyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const matPupil = new THREE.MeshBasicMaterial({ color: 0x0f172a });
            [-1.1, 1.1].forEach(ex => {
                const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), matEyeWhite);
                eyeW.position.set(ex, cfg.type === 'BRONTO' ? 4.0 : 0.8, cfg.type === 'BRONTO' ? 2.6 : 1.8);
                const eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), matPupil);
                eyeP.position.set(ex * 1.1, cfg.type === 'BRONTO' ? 4.0 : 0.8, cfg.type === 'BRONTO' ? 2.9 : 2.1);
                headPivot.add(eyeW, eyeP);
            });
            dGroup.add(headPivot);

            // Legs
            const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.3), matDino);
            leftLeg.position.set(-1.4, 1.1, 0);
            const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.3), matDino);
            rightLeg.position.set(1.4, 1.1, 0);
            dGroup.add(leftLeg, rightLeg);

            // Tail
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
                phase: Math.random() * Math.PI * 2,
                worldX: drX + cfg.lx,
                worldZ: drZ + cfg.lz,
                name: cfg.name
            });
        });

        applyCartoonInkOutlines(dinoRidgeGroup, 1.035, true);
        s.add(dinoRidgeGroup);
        registerCullableObject(dinoRidgeGroup, drX, drY + 12, drZ, 85);
        worldColliders.push({ x: drX, z: drZ, r: 16 });
        worldColliders.push({ x: drX - 12, z: drZ + 48, r: 2.5 });
        worldColliders.push({ x: drX + 12, z: drZ + 48, r: 2.5 });

        // =====================================================================
        // 6. SUNNY SANDS BOARDWALK & AMUSEMENT PIER (-825, 825 - Beside Coastal Highway)
        // =====================================================================
        const boardwalkGroup = new THREE.Group();
        // bwX, bwZ exported at module level
        const bwY = getTerrainHeight(bwX, bwZ);
        boardwalkGroup.position.set(bwX, bwY, bwZ);

        // Striped Boardwalk Pier Deck
        const matDeck = new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad3 });
        const bwDeck = new THREE.Mesh(new THREE.BoxGeometry(120, 1.8, 90), matDeck);
        bwDeck.position.set(0, 0.9, 0);
        bwDeck.receiveShadow = true;
        boardwalkGroup.add(bwDeck);

        // Giant Rotating Ferris Wheel at (0, 0, -12)
        const matWheelA = new THREE.MeshToonMaterial({ color: 0xef4444, gradientMap: toonGrad3 });
        const matWheelB = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });

        // Wheel Support Towers (A-frames)
        [-7.5, 7.5].forEach(sx => {
            const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 32, 8).rotateZ(sx > 0 ? -0.22 : 0.22), matWheelA);
            leg1.position.set(sx, 16, -12);
            leg1.castShadow = true;
            boardwalkGroup.add(leg1);
        });

        ferrisWheelPivot = new THREE.Group();
        ferrisWheelPivot.position.set(0, 31, -12);

        // Dual Outer Wheel Rims
        [-1.8, 1.8].forEach(rz => {
            const rim = new THREE.Mesh(new THREE.TorusGeometry(18, 0.45, 8, 32), matWheelB);
            rim.position.z = rz;
            ferrisWheelPivot.add(rim);
        });

        // 8 Radial Spokes & Swinging Gondolas
        ferrisGondolas.length = 0;
        const gondolaColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899];
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            // Spokes
            const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 36, 0.5), matWheelB);
            spoke.rotation.z = ang;
            ferrisWheelPivot.add(spoke);

            // Gondola Pivot at radius 17.5
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

        // 4 Colorful Candy-Striped Boardwalk Umbrellas & Tables
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
        s.add(boardwalkGroup);
        registerCullableObject(boardwalkGroup, bwX, bwY + 22, bwZ, 85);
        worldColliders.push({ x: bwX, z: bwZ - 12, r: 12 });

        // =====================================================================
        // 7. WAYWARD ISLAND EXPANSION & SUSPENSION CAUSEWAY (1960, 540)
        // =====================================================================
        const waywardIslandGroup = new THREE.Group();
        const wiX = 1960, wiZ = 540;
        const wiY = getTerrainHeight(wiX, wiZ);
        waywardIslandGroup.position.set(wiX, wiY, wiZ);

        // A. Grand Suspension Causeway Bridge over Ocean Channel (Mainland X: 1480 to Island X: 1760 at Z: 540)
        const causewayGroup = new THREE.Group();
        const bridgeDeck = new THREE.Mesh(
            new THREE.BoxGeometry(280, 2.2, 17.5),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
        );
        bridgeDeck.position.set(1620 - wiX, 6.4 - wiY, 0);
        bridgeDeck.receiveShadow = true;
        causewayGroup.add(bridgeDeck);

        // Bridge Red Safety Barrier Guardrails
        const matBridgeRed = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad3 });
        [-8.2, 8.2].forEach(rz => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(280, 1.4, 0.8), matBridgeRed);
            rail.position.set(1620 - wiX, 8.2 - wiY, rz);
            causewayGroup.add(rail);
        });

        // 2 Soaring Suspension Pylons at X = 1530 and X = 1710
        const matPylonWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
        [1530, 1710].forEach(tx => {
            const pGroup = new THREE.Group();
            pGroup.position.set(tx - wiX, 0 - wiY, 0);

            // Left & Right Tower Columns (at Z = 540 - 8.5 and 540 + 8.5)
            [-8.5, 8.5].forEach(tz => {
                const col = new THREE.Mesh(new THREE.BoxGeometry(3.6, 54, 3.6), matPylonWhite);
                col.position.set(0, 24, tz);
                col.castShadow = true;
                pGroup.add(col);
            });

            // Substructure Cross-Beam underneath the bridge deck (Y = 4.5, 3m below the deck at 7.5m)
            const subBeam = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 18), matBridgeRed);
            subBeam.position.set(0, 4.5, 0);
            pGroup.add(subBeam);

            // High Soaring Overhead Portal Crossbars above the roadway (Y = 28, 42, 50 - 20.5m of overhead clearance!)
            [28, 42, 50].forEach(cy => {
                const cbar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 18), matBridgeRed);
                cbar.position.set(0, cy, 0);
                pGroup.add(cbar);
            });
            // Top Aircraft Warning Light
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
            beacon.position.set(0, 52, 0);
            pGroup.add(beacon);

            causewayGroup.add(pGroup);
        });

        // Suspension Cables (curved aesthetic catenary curve)
        const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        [-8.5, 8.5].forEach(cz => {
            const cableCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(1480 - wiX, 9 - wiY, cz),
                new THREE.Vector3(1530 - wiX, 48 - wiY, cz),
                new THREE.Vector3(1620 - wiX, 11 - wiY, cz),
                new THREE.Vector3(1710 - wiX, 48 - wiY, cz),
                new THREE.Vector3(1760 - wiX, 9 - wiY, cz)
            ]);
            const cableTube = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 32, 0.45, 6, false), cableMat);
            causewayGroup.add(cableTube);
        });
        waywardIslandGroup.add(causewayGroup);

        // B. Ancient Cybertronian Temple Ruins on Wayward Plateau (local 0, 0)
        const ruinsGroup = new THREE.Group();
        const matStone = new THREE.MeshToonMaterial({ color: 0x78716c, gradientMap: toonGrad3 });
        const matGlowingGlyph = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

        // 8 Ancient Megalithic Columns ringing the Temple Court
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

            // Glowing Cybertronian Rune Inlay
            const rune = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.5).rotateY(ang + Math.PI / 2), matGlowingGlyph);
            rune.position.set(px * 0.95, 8, pz * 0.95);
            ruinsGroup.add(rune);
        }

        // Broken Architrave Lintel Beams spanning between columns
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

        // Ancient Cavern Altar with Prismatic Rainbow Energon Shard
        const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 8.2, 3.5, 8), matStone);
        altarBase.position.y = 1.75;
        ruinsGroup.add(altarBase);

        waywardEnergonShard = new THREE.Mesh(
            new THREE.OctahedronGeometry(5.2, 0),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        waywardEnergonShard.position.y = 7.5;
        waywardEnergonShard.scale.set(1.0, 1.8, 1.0);
        ruinsGroup.add(waywardEnergonShard);

        waywardIslandGroup.add(ruinsGroup);

        // D. Shipwreck Cove on East Reef (X: 2180, Z: 620 => local: 220, 80)
        const shipGroup = new THREE.Group();
        shipGroup.position.set(220, -18, 80); // in shallow surf
        shipGroup.rotation.z = 0.28;
        shipGroup.rotation.y = 0.45;

        const matShipWood = new THREE.MeshToonMaterial({ color: 0x713f12, gradientMap: toonGrad3 });
        // Broken Hull Ribs
        for (let r = -4; r <= 4; r++) {
            const rib = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.75, 6, 16, Math.PI), matShipWood);
            rib.position.x = r * 4.5;
            rib.rotation.y = Math.PI / 2;
            rib.castShadow = true;
            shipGroup.add(rib);
        }
        // Broken Mast Timber
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 28, 8), matShipWood);
        mast.position.set(2, 12, 0);
        mast.rotation.z = -0.35;
        mast.castShadow = true;
        shipGroup.add(mast);

        waywardIslandGroup.add(shipGroup);

        // E. Hidden Cybertronian Sea Grotto (local: 80, -180 => World: 2040, 360)
        const grottoGroup = new THREE.Group();
        grottoGroup.position.set(80, -4, -180);
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

        // Grotto Interior Chamber floor
        const caveFloor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 1.2, 16), matGrottoRock);
        caveFloor.position.set(0, 0.6, -18);
        grottoGroup.add(caveFloor);

        // Glowing Purple & Cyan Crystal Clusters inside Grotto
        const matPurpleCrystal = new THREE.MeshBasicMaterial({ color: 0xc084fc });
        const matCyanCrystal = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        for (let c = 0; c < 7; c++) {
            const cAng = (c / 7) * Math.PI * 2;
            const crMat = c % 2 === 0 ? matPurpleCrystal : matCyanCrystal;
            const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.4 + (c % 3) * 0.8, 0), crMat);
            crystal.position.set(Math.cos(cAng) * 16, 2.5 + (c % 3), -18 + Math.sin(cAng) * 16);
            crystal.scale.set(0.6, 2.2, 0.6);
            grottoGroup.add(crystal);
        }
        waywardIslandGroup.add(grottoGroup);

        // F. Wayward Island Scenic Pier & Ferry Overlook (World: 1802, 2.2, 306)
        // Extends gracefully from the sandy beach road out over the ocean water channel!
        const waywardPierGroup = new THREE.Group();
        const pierCenterX = 1802, pierCenterZ = 306;
        const pierRotY = -2.548;
        waywardPierGroup.position.set(pierCenterX, 0, pierCenterZ);
        waywardPierGroup.rotation.y = pierRotY;

        const matPierWood = new THREE.MeshToonMaterial({ color: 0xb45309, gradientMap: toonGrad3 });
        const matPierDark = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });
        const matPierLantern = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        // Main Straight Pier Boardwalk Deck (extends 64m from shore to deep water)
        const waywardPierDeck = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 64), matPierWood);
        waywardPierDeck.position.set(0, 2.2, 0);
        waywardPierDeck.receiveShadow = true;
        waywardPierGroup.add(waywardPierDeck);

        // Seaward T-Dock Scenic Overlook Platform (wide lookout platform over open sea)
        const tDockDeck = new THREE.Mesh(new THREE.BoxGeometry(34, 1.6, 14), matPierWood);
        tDockDeck.position.set(0, 2.2, 28);
        tDockDeck.receiveShadow = true;
        waywardPierGroup.add(tDockDeck);

        // Wooden Safety Railings along both sides of the boardwalk
        [-8.2, 8.2].forEach(rx => {
            const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 56), matPierDark);
            topRail.position.set(rx, 3.6, -2);
            waywardPierGroup.add(topRail);
        });

        // Pilings driven deep down through water into ocean seabed
        for (let pz = -26; pz <= 30; pz += 9.5) {
            [-7.2, 7.2].forEach(px => {
                const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 16, 8), matPierDark);
                pile.position.set(px, -4.5, pz);
                waywardPierGroup.add(pile);
            });
        }
        // Extra pilings under outer T-dock wings
        [-15.5, 15.5].forEach(px => {
            [-5, 5].forEach(pzOff => {
                const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 16, 8), matPierDark);
                pile.position.set(px, -4.5, 28 + pzOff);
                waywardPierGroup.add(pile);
            });
        });

        // Mooring Cleats & Warm Nautical Lantern Posts along the pier
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
        s.add(waywardPierGroup);
        registerCullableObject(waywardPierGroup, pierCenterX, 2.2, pierCenterZ, 70);

        applyCartoonInkOutlines(waywardIslandGroup, 1.035, true);
        s.add(waywardIslandGroup);
        registerCullableObject(waywardIslandGroup, wiX, wiY + 20, wiZ, 450);
        worldColliders.push({ x: wiX, z: wiZ, r: 28 });
        // Tower Column Colliders (flanking the road at Z = 540 ± 8.5, keeping road at Z = 540 completely clear!)
        worldColliders.push({ x: 1530, z: 540 - 8.5, r: 2.2 });
        worldColliders.push({ x: 1530, z: 540 + 8.5, r: 2.2 });
        worldColliders.push({ x: 1710, z: 540 - 8.5, r: 2.2 });
        worldColliders.push({ x: 1710, z: 540 + 8.5, r: 2.2 });

        // Stunt Ramps across the 10X Island
        // Builds a solid, terrain-adaptive wedge ramp that seamlessly matches ground elevation at its entrance
        function createStuntRamp(x, z, rotY, w = 12, l = 18, rampHeight = 3.2) {
            const hw = w * 0.5;
            const hl = l * 0.5;
            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const gyCenter = getTerrainHeight(x, z);

            // Sample ground elevation at the 4 ramp corners in world space
            const cornerWorld = (lx, lz) => {
                const wx = x + lx * cosY + lz * sinY;
                const wz = z - lx * sinY + lz * cosY;
                return getTerrainHeight(wx, wz);
            };

            const gyEL = cornerWorld(-hw, -hl);
            const gyER = cornerWorld(hw, -hl);
            const gyLL = cornerWorld(-hw, hl);
            const gyLR = cornerWorld(hw, hl);

            // Local coordinates relative to (x, gyCenter, z)
            const lyEL = gyEL - gyCenter;
            const lyER = gyER - gyCenter;
            const lyLL = gyLL - gyCenter + rampHeight;
            const lyLR = gyLR - gyCenter + rampHeight;
            // Underground foundation skirt: extends deeply into terrain so base never hovers or floats
            const lyBottom = Math.min(gyEL, gyER, gyLL, gyLR) - gyCenter - 1.8;

            const P0 = [-hw, lyEL, -hl];      // Entrance Left (flush with terrain)
            const P1 = [ hw, lyER, -hl];      // Entrance Right (flush with terrain)
            const P2 = [ hw, lyLR,  hl];      // Launch Right (elevated)
            const P3 = [-hw, lyLL,  hl];      // Launch Left (elevated)
            const P4 = [-hw, lyBottom, -hl];  // Foundation Entrance Left
            const P5 = [ hw, lyBottom, -hl];  // Foundation Entrance Right
            const P6 = [ hw, lyBottom,  hl];  // Foundation Launch Right
            const P7 = [-hw, lyBottom,  hl];  // Foundation Launch Left

            const faces = [
                // Top driving ramp surface (slopes up smoothly from ground level to launch height)
                { pts: [P0, P2, P1], uvs: [[0, 0], [1, 3], [1, 0]] },
                { pts: [P0, P3, P2], uvs: [[0, 0], [0, 3], [1, 3]] },
                // Back vertical launch wall
                { pts: [P3, P6, P2], uvs: [[0, 1], [1, 0], [1, 1]] },
                { pts: [P3, P7, P6], uvs: [[0, 1], [0, 0], [1, 0]] },
                // Left side wall
                { pts: [P0, P7, P3], uvs: [[0, 0], [3, 0], [3, 1]] },
                { pts: [P0, P4, P7], uvs: [[0, 0], [0, 0], [3, 0]] },
                // Right side wall
                { pts: [P1, P2, P6], uvs: [[0, 0], [3, 1], [3, 0]] },
                { pts: [P1, P6, P5], uvs: [[0, 0], [3, 0], [0, 0]] },
                // Front entrance ground skirt (buried into terrain)
                { pts: [P1, P4, P0], uvs: [[1, 0.2], [0, 0], [0, 0.2]] },
                { pts: [P1, P5, P4], uvs: [[1, 0.2], [1, 0], [0, 0]] },
                // Bottom ground base
                { pts: [P4, P6, P7], uvs: [[0, 0], [1, 1], [0, 1]] },
                { pts: [P4, P5, P6], uvs: [[0, 0], [1, 0], [1, 1]] }
            ];

            const positions = new Float32Array(36 * 3);
            const uvs = new Float32Array(36 * 2);
            let pIdx = 0, uIdx = 0;
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

            const ramp = new THREE.Mesh(
                rampGeo,
                new THREE.MeshToonMaterial({ map: texHazard, gradientMap: toonGrad3 })
            );
            ramp.position.set(x, gyCenter, z);
            ramp.rotation.y = rotY;
            ramp.castShadow = true;
            ramp.receiveShadow = true;
            applyCartoonInkOutlines(ramp, 1.03, true);
            s.add(ramp);
            registerCullableObject(ramp, x, gyCenter + 2, z, 20);

            ramps.push({
                x, z, rotY,
                w, l, height: rampHeight,
                cosY, sinY,
                r: Math.hypot(w, l) * 0.65
            });
        }

        // Accurately aligned on roads, plazas, and terrain features across Griffin Rock
        createStuntRamp(0, 218, 0.0);                   // 1. South Highway HQ Stunt Ramp (aligned on road facing South)
        createStuntRamp(-220, 25, -Math.PI / 2);        // 2. West Tech Leap (aligned on East-West Highway facing West)
        createStuntRamp(304, -178, 1.05);               // 3. Cliffside Overlook (aligned on Inner Highway Loop)
        createStuntRamp(0, 740, 0.0);                   // 4. South Highway Outer Ramp (aligned on road facing South)
        createStuntRamp(-680, 25, -Math.PI / 2);        // 5. Outer West Highway Ramp (aligned on East-West Highway)
        createStuntRamp(680, 25, Math.PI / 2);          // 6. Outer East Highway Ramp (aligned on East-West Highway)

        // =====================================================================
        // 5B-3. SKY STUNT HOOPS (Interactive Aerial Rings across Griffin Rock)
        // =====================================================================
        const STUNT_HOOPS = [
            { id: 1, name: "HQ Ramp Stunt Launch", x: 0, y: 15.5, z: 238, rotY: 0.0, radius: 6.2, color: 0x38bdf8 },
            { id: 2, name: "Town Plaza Sky Ring", x: 0, y: 25.0, z: -15, rotY: 0, radius: 7.2, color: 0xfacc15 },
            { id: 3, name: "West Tech Leap", x: -240, y: 16.5, z: 25, rotY: -Math.PI / 2, radius: 6.2, color: 0xa855f7 },
            { id: 4, name: "Cliffside Overlook", x: 318, y: 18.5, z: -166, rotY: 1.05, radius: 6.5, color: 0xf43f5e },
            { id: 5, name: "Volcano Caldera Flight Ring", x: -735, y: 68.0, z: -755, rotY: 0.4, radius: 8.0, color: 0xf97316 },
            { id: 6, name: "South Harbor Ocean Bay Ring", x: 0, y: 16.0, z: 1250, rotY: 0, radius: 7.2, color: 0x06b6d4 }
        ];

        // stuntHoopRigs exported above

        STUNT_HOOPS.forEach((hDef, idx) => {
            const hGroup = new THREE.Group();
            hGroup.position.set(hDef.x, hDef.y, hDef.z);
            hGroup.rotation.y = hDef.rotY;

            // Outer Glowing Torus Hoop
            const torusGeo = new THREE.TorusGeometry(hDef.radius, 0.48, 12, 36);
            const torusMat = new THREE.MeshBasicMaterial({ color: hDef.color, transparent: true, opacity: 0.92 });
            const torusMesh = new THREE.Mesh(torusGeo, torusMat);
            torusMesh.userData.noOutline = true;
            hGroup.add(torusMesh);

            // Halo Sparkle Ring
            const haloGeo = new THREE.RingGeometry(hDef.radius * 0.94, hDef.radius * 1.06, 32);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide
            });
            const haloMesh = new THREE.Mesh(haloGeo, haloMat);
            haloMesh.userData.noOutline = true;
            hGroup.add(haloMesh);

            // Inner Rotating 4-Pointed Star / Chevrons
            const starPivot = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                const ang = (i / 4) * Math.PI * 2;
                const chev = new THREE.Mesh(
                    new THREE.ConeGeometry(0.7, 2.0, 4),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
                chev.position.set(Math.cos(ang) * (hDef.radius - 1.1), Math.sin(ang) * (hDef.radius - 1.1), 0);
                chev.rotation.z = ang - Math.PI / 2;
                chev.userData.noOutline = true;
                starPivot.add(chev);
            }
            hGroup.add(starPivot);

            s.add(hGroup);
            registerCullableObject(hGroup, hDef.x, hDef.y, hDef.z, hDef.radius * 2.5);

            stuntHoopRigs.push({
                def: hDef,
                group: hGroup,
                torusMesh,
                haloMesh,
                starPivot,
                baseY: hDef.y,
                cooldown: 0,
                flashTimer: 0
            });
        });


    stateHolder.ferryController = ferryController;
    if (typeof window !== 'undefined') {
        window.HQ_POS = HQ_POS;
        window.HQ_SWAP_PAD = HQ_SWAP_PAD;
        window.hqGroup = hqGroup;
        window.roboWashGroup = roboWashGroup;
        window.launchPadGroup = launchPadGroup;
        window.dinerGroup = dinerGroup;
        window.chargerStation = chargerStation;
        window.groundbridgePortals = groundbridgePortals;
        window.stuntHoopRigs = stuntHoopRigs;
        window.ferryController = ferryController;
    }
}

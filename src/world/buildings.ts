// Griffin Rock Town Buildings, Firehouse HQ, Harbor & Interactive World Features
import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import { toonGrad3, applyCartoonInkOutlines } from '../rendering/materials.js';
import { mergeStaticMeshesInGroup, freezeStaticHierarchy } from '../rendering/meshOptimizer.js';
import { worldColliders, registerCullableObject, ramps, stateHolder } from '../state/gameState.js';
import {
    buildFirehouseHQMesh,
    buildRoboWashMesh,
    buildSuperCatapultMesh,
    buildGriffinDinerMesh,
    buildEnergonChargerMesh,
    buildGroundbridgePortalMesh,
    buildTownBuildingMesh,
    buildEastLighthouseMesh,
    buildHarborPierMesh,
    buildDockCargoCraneMesh,
    buildMagneticGantryCraneMesh,
    buildCargoContainerYardMesh,
    buildHarborFerryMesh,
    buildFerryBoardingBridgeMesh,
    buildAntiGravTestYardMesh,
    buildVolcanoCalderaMesh,
    buildNorthObservatoryMesh,
    buildWestTechLabMesh,
    buildSkyCommsArrayMesh,
    buildDinoRidgeMesh,
    buildBoardwalkMesh,
    buildSuspensionCausewayMesh,
    buildWaywardRuinsMesh,
    buildWaywardShipwreckMesh,
    buildWaywardGrottoMesh,
    buildWaywardPierMesh,
    buildStuntRampMesh,
    buildSkyStuntHoopMesh,
    buildHospitalMesh
} from './buildingModels.js';

export interface GroundBridgePortalEntry {
    cfg: { id: string; name: string; x: number; z: number; rotY: number; dest: { x: number; z: number; heading: number } };
    group: THREE.Group;
    irisRing1: THREE.Mesh;
    irisRing2: THREE.Mesh;
    irisRing3: THREE.Mesh;
    vortexDisc: THREE.Mesh;
    baseY: number;
}

export interface StuntHoopRigEntry {
    def: { id: number; name: string; x: number; y: number; z: number; rotY: number; radius: number; color: number };
    group: THREE.Group;
    torusMesh: THREE.Mesh;
    haloMesh: THREE.Mesh;
    starPivot: THREE.Object3D;
    baseY: number;
    cooldown: number;
    flashTimer: number;
}

export interface FerryControllerState {
    state: string;
    timeInState: number;
    cruiseTime: number;
    boardingCooldown: number;
    dockPos: THREE.Vector3;
    dockRotY: number;
    currentPos: THREE.Vector3;
    prevPos: THREE.Vector3;
    currentRotY: number;
    prevRotY: number;
    rampMesh: THREE.Object3D | null;
    rampAngle: number;
    lastCommentTime: number;
    waypoints: Array<{ x: number; z: number }>;
}

export interface CraneInteractiveState {
    craneX: number;
    craneZ: number;
    padX: number;
    padZ: number;
    dropX: number;
    dropZ: number;
    state: string;
    timer: number;
    cooldown: number;
    boomPivot: THREE.Object3D | null;
    cableMesh: THREE.Object3D | null;
    magnetGroup: THREE.Object3D | null;
    padLights: THREE.Object3D[];
}

export interface TestYardState {
    baseX: number;
    baseZ: number;
    baseY?: number;
    bouncePad: { x: number; z: number; radius: number; mesh: THREE.Object3D | null };
    speedStrip: { minX: number; maxX: number; z: number; width: number };
    targets: Array<{
        id: number;
        name: string;
        x: number;
        z: number;
        color: number;
        mesh: THREE.Object3D;
        wobble: number;
        cooldown: number;
    }>;
}

export interface BabyDinoEntry {
    group: THREE.Group;
    headPivot: THREE.Object3D;
    leftLeg: THREE.Object3D;
    rightLeg: THREE.Object3D;
    tail: THREE.Object3D;
    phase: number;
    worldX: number;
    worldZ: number;
    name: string;
}

export const HQ_POS = { x: -48, z: -45 };
export const HQ_SWAP_PAD = { x: -48, z: -15, r: 12.5 };
export const HOSPITAL_POS = { x: 96, z: -86 };
export const HOSPITAL_AMBULANCE_BAY_POS = { x: 80, z: -84 };
export const HOSPITAL_DROPOFF_PAD = { x: 102, z: -64, r: 16.0 };
export let hqGroup: THREE.Group | null = null;
export let hospitalGroup: THREE.Group | null = null;
export let hospitalDropRing: THREE.Mesh | null = null;
export const hospitalBayStrobes: THREE.Mesh[] = [];
export const hospitalHelipadBeacons: THREE.Mesh[] = [];
export let roboWashGroup: THREE.Group | null = null;
export let launchPadGroup: THREE.Group | null = null;
export let dinerGroup: THREE.Group | null = null;
export let chargerStation: THREE.Group | null = null;
export let groundbridgePortals: GroundBridgePortalEntry[] = [];
export const stuntHoopRigs: StuntHoopRigEntry[] = [];
export let ferryController: FerryControllerState | null = null;

// Animated Landmark References
export let hqRadarPivot: THREE.Object3D | null = null;
export let swapPadRing: THREE.Object3D | null = null;
export const outpostPadRings: THREE.Object3D[] = [];
export let lhBeamPivot: THREE.Object3D | null = null;
export let observatoryDomePivot: THREE.Object3D | null = null;
export const windTurbineRotors: THREE.Object3D[] = [];
export let volcanoLavaPool: THREE.Object3D | null = null;
export const volcanoSmokePuffs: THREE.Mesh[] = [];

// Interactive Feature State & Positions
export const ROBO_WASH_POS = { x: -92, z: -15 };
export let rwY = 0;
export let rwLeftBrush: THREE.Object3D | null = null;
export let rwRightBrush: THREE.Object3D | null = null;
export let rwTopBrush: THREE.Object3D | null = null;

export const CATAPULT_POS = { x: 36, z: -45 };
export let catY = 0;
export let catapultCarriage: THREE.Object3D | null = null;
export const catapultStrobes: THREE.Mesh[] = [];

export const DINER_POS = { x: 78, z: -15 };
export let dinerY = 0;
export let dinerBurgerGroup: THREE.Object3D | null = null;

export const CHARGER_POS = { x: -1110, z: -42 };
export let chargerY = 0;
export const energonCoilRings: THREE.Mesh[] = [];
export const energonOrbs: THREE.Mesh[] = [];

export const groundBridgePortals: GroundBridgePortalEntry[] = [];
export let harborFerryGroup: THREE.Group | null = null;
export let craneInteractive: CraneInteractiveState | null = null;
export let testYard: TestYardState | null = null;
export let ferrisWheelPivot: THREE.Object3D | null = null;
export const ferrisGondolas: THREE.Object3D[] = [];
export const bwX = -825, bwZ = 825;
export const babyDinos: BabyDinoEntry[] = [];
export let amberSpire: THREE.Object3D | null = null;
export const drX = -750, drZ = -750;
export let waywardEnergonShard: THREE.Object3D | null = null;

export function initBuildings(scene?: THREE.Scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;
    const targetScene: THREE.Scene = s;

    // =========================================================================
    // 5A. ICONIC RESCUE BOTS FIREHOUSE HEADQUARTERS (At X: -48, Z: -45)
    // =========================================================================
    const hqRes = buildFirehouseHQMesh();
    hqGroup = hqRes.root;
    hqRadarPivot = hqRes.hqRadarPivot;
    swapPadRing = hqRes.swapPadRing;
    const hqY = getTerrainHeight(HQ_POS.x, HQ_POS.z);
    hqGroup.position.set(HQ_POS.x, hqY, HQ_POS.z);
    mergeStaticMeshesInGroup(hqGroup, [hqRadarPivot, swapPadRing]);
    s.add(hqGroup);
    registerCullableObject(hqGroup, HQ_POS.x, hqY + 12, HQ_POS.z, 55);
    worldColliders.push({ x: HQ_POS.x, z: HQ_POS.z, r: 19.5 });

    // =========================================================================
    // 5A-1B. GRIFFIN ROCK GENERAL HOSPITAL (Multi-Stage Medical Center + Ratchet Ambulance Bay)
    // =========================================================================
    const hospRes = buildHospitalMesh();
    hospitalGroup = hospRes.root;
    hospitalDropRing = hospRes.hospitalDropRing;
    hospitalBayStrobes.length = 0;
    hospitalBayStrobes.push(...hospRes.bayStrobes);
    hospitalHelipadBeacons.length = 0;
    hospitalHelipadBeacons.push(...hospRes.helipadBeacons);
    const hospY = getTerrainHeight(HOSPITAL_POS.x, HOSPITAL_POS.z);
    hospitalGroup.position.set(HOSPITAL_POS.x, hospY, HOSPITAL_POS.z);
    mergeStaticMeshesInGroup(hospitalGroup, [hospitalDropRing, ...hospitalBayStrobes, ...hospitalHelipadBeacons]);
    s.add(hospitalGroup);
    registerCullableObject(hospitalGroup, HOSPITAL_POS.x, hospY + 22, HOSPITAL_POS.z, 76);
    // Solid gap-free AABB wall colliders around Main Hospital Wing, Ambulance Bay outer walls, and ER Canopy pillars —
    // keeping the open-front Ambulance Bay (x = -16, z = +2) and ER Drop-Off Pad (x = +6, z = +22) 100% open & driveable!
    worldColliders.push({ x: HOSPITAL_POS.x + 8, z: HOSPITAL_POS.z - 2, r: 16.5, halfW: 16.5, halfD: 13.5, type: 'BUILDING' });
    worldColliders.push({ x: HOSPITAL_POS.x - 16, z: HOSPITAL_POS.z - 11.2, r: 8.4, halfW: 8.4, halfD: 1.1, type: 'BUILDING' });
    worldColliders.push({ x: HOSPITAL_POS.x - 24.2, z: HOSPITAL_POS.z, r: 11.2, halfW: 1.1, halfD: 11.2, type: 'BUILDING' });
    worldColliders.push({ x: HOSPITAL_POS.x - 0.6, z: HOSPITAL_POS.z + 16.2, r: 0.75, type: 'BUILDING' });
    worldColliders.push({ x: HOSPITAL_POS.x + 12.6, z: HOSPITAL_POS.z + 16.2, r: 0.75, type: 'BUILDING' });

    // =========================================================================
    // 5A-2. FIREHOUSE ROBO-WASH (Interactive Drive-Through Car Wash Bay)
    // =========================================================================
    const rwRes = buildRoboWashMesh();
    roboWashGroup = rwRes.root;
    rwLeftBrush = rwRes.rwLeftBrush;
    rwRightBrush = rwRes.rwRightBrush;
    rwTopBrush = rwRes.rwTopBrush;
    rwY = getTerrainHeight(ROBO_WASH_POS.x, ROBO_WASH_POS.z);
    roboWashGroup.position.set(ROBO_WASH_POS.x, rwY, ROBO_WASH_POS.z);
    mergeStaticMeshesInGroup(roboWashGroup, [rwLeftBrush, rwRightBrush, rwTopBrush]);
    s.add(roboWashGroup);
    registerCullableObject(roboWashGroup, ROBO_WASH_POS.x, rwY + 5, ROBO_WASH_POS.z, 28);
    worldColliders.push({ x: ROBO_WASH_POS.x - 6.2, z: ROBO_WASH_POS.z, r: 2.2 });
    worldColliders.push({ x: ROBO_WASH_POS.x + 6.2, z: ROBO_WASH_POS.z, r: 2.2 });

    // =========================================================================
    // 5A-3. FIREHOUSE HQ SUPER CATAPULT LAUNCH PAD
    // =========================================================================
    const catRes = buildSuperCatapultMesh();
    const catapultGroup = catRes.root;
    catapultCarriage = catRes.catapultCarriage;
    catapultStrobes.length = 0;
    catapultStrobes.push(...catRes.catapultStrobes);
    catY = getTerrainHeight(CATAPULT_POS.x, CATAPULT_POS.z);
    catapultGroup.position.set(CATAPULT_POS.x, catY, CATAPULT_POS.z);
    mergeStaticMeshesInGroup(catapultGroup, [catapultCarriage, ...catapultStrobes]);
    s.add(catapultGroup);
    registerCullableObject(catapultGroup, CATAPULT_POS.x, catY + 5, CATAPULT_POS.z, 28);
    worldColliders.push({ x: CATAPULT_POS.x - 6.2, z: CATAPULT_POS.z, r: 2.2 });
    worldColliders.push({ x: CATAPULT_POS.x + 6.2, z: CATAPULT_POS.z, r: 2.2 });
    worldColliders.push({ x: CATAPULT_POS.x, z: CATAPULT_POS.z - 10.5, r: 3.5 });

    // =========================================================================
    // 5A-4. GRIFFIN ROCK DRIVE-THRU DINER
    // =========================================================================
    const dinerRes = buildGriffinDinerMesh();
    dinerGroup = dinerRes.root;
    dinerBurgerGroup = dinerRes.dinerBurgerGroup;
    dinerY = getTerrainHeight(DINER_POS.x, DINER_POS.z);
    dinerGroup.position.set(DINER_POS.x, dinerY, DINER_POS.z);
    mergeStaticMeshesInGroup(dinerGroup, [dinerBurgerGroup]);
    s.add(dinerGroup);
    registerCullableObject(dinerGroup, DINER_POS.x, dinerY + 6, DINER_POS.z, 32);
    worldColliders.push({ x: DINER_POS.x + 4.2, z: DINER_POS.z, r: 8.5 });
    worldColliders.push({ x: DINER_POS.x - 12.5, z: DINER_POS.z, r: 1.5 });

    // =========================================================================
    // 5A-5. DOC GREENE'S ENERGON TURBO-CHARGER STATION
    // =========================================================================
    const chgRes = buildEnergonChargerMesh();
    const chargerGroup = chgRes.root;
    chargerStation = chargerGroup;
    energonCoilRings.length = 0;
    energonCoilRings.push(...chgRes.energonCoilRings);
    energonOrbs.length = 0;
    energonOrbs.push(...chgRes.energonOrbs);
    chargerY = getTerrainHeight(CHARGER_POS.x, CHARGER_POS.z);
    chargerGroup.position.set(CHARGER_POS.x, chargerY, CHARGER_POS.z);
    mergeStaticMeshesInGroup(chargerGroup, [...energonCoilRings, ...energonOrbs]);
    s.add(chargerGroup);
    registerCullableObject(chargerGroup, CHARGER_POS.x, chargerY + 6, CHARGER_POS.z, 30);
    worldColliders.push({ x: CHARGER_POS.x - 6.5, z: CHARGER_POS.z, r: 2.8 });
    worldColliders.push({ x: CHARGER_POS.x + 6.5, z: CHARGER_POS.z, r: 2.8 });

    // =========================================================================
    // 5A-6. DOC GREENE'S GROUNDBRIDGE TELEPORTER TUNNEL NETWORK
    // =========================================================================
    const GROUNDBRIDGE_CONFIGS = [
        { id: 'A', name: 'West Tech GroundBridge', x: -1085, z: 62, rotY: 0, dest: { x: -750, z: -682, heading: 0 } },
        { id: 'B', name: 'South Harbor GroundBridge', x: 48, z: 1040, rotY: 0, dest: { x: 1912, z: 492, heading: Math.PI / 2 } },
        { id: 'C', name: 'Dino Ridge GroundBridge', x: -750, z: -665, rotY: 0, dest: { x: 48, z: 1058, heading: 0 } },
        { id: 'D', name: 'Wayward Island GroundBridge', x: 1895, z: 492, rotY: Math.PI / 2, dest: { x: -1085, z: 44, heading: Math.PI } }
    ];

    groundBridgePortals.length = 0;
    GROUNDBRIDGE_CONFIGS.forEach(cfg => {
        const gbRes = buildGroundbridgePortalMesh(cfg.id);
        const gbGroup = gbRes.root;
        const gbY = getTerrainHeight(cfg.x, cfg.z);
        gbGroup.position.set(cfg.x, gbY, cfg.z);
        gbGroup.rotation.y = cfg.rotY;
        mergeStaticMeshesInGroup(gbGroup, [gbRes.irisRing1, gbRes.irisRing2, gbRes.irisRing3, gbRes.vortexDisc]);
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
            irisRing1: gbRes.irisRing1,
            irisRing2: gbRes.irisRing2,
            irisRing3: gbRes.irisRing3,
            vortexDisc: gbRes.vortexDisc,
            baseY: gbY
        });
    });

    // =========================================================================
    // 5B. GRIFFIN TOWN BUILDINGS, REGIONAL VILLAGES, LIGHTHOUSE & SKY ARRAY
    // =========================================================================
    function createTownBuilding(x: number, z: number, w: number, h: number, d: number, roofColor: number, wallColor: number, rotY = 0) {
        const { root: group } = buildTownBuildingMesh(w, h, d, roofColor, wallColor);
        const gy = getTerrainHeight(x, z);
        group.position.set(x, gy, z);
        group.rotation.y = rotY;
        mergeStaticMeshesInGroup(group);
        targetScene.add(group);
        registerCullableObject(group, x, gy + h * 0.5, z, Math.max(w, d, h) + 12);
        worldColliders.push({ x, z, r: Math.max(w, d) * 0.58 });
    }

    // 1. Central Griffin Town Plaza
    createTownBuilding(-52, 72, 14, 13, 14, 0x1d4ed8, 0xffffff, 0.1);
    createTownBuilding(52, 72, 15, 14, 14, 0x16a34a, 0xf8fafc, -0.1);
    createTownBuilding(-95, 72, 12, 10, 12, 0xf97316, 0xfef08a, 0.25);
    createTownBuilding(95, 72, 14, 15, 14, 0x0284c7, 0xf0f9ff, -0.05);
    createTownBuilding(-95, -72, 14, 11, 14, 0xe81e25, 0xffffff, 0.05);
    createTownBuilding(52, 115, 15, 14, 15, 0x9333ea, 0xfaf5ff, -0.2);

    // 2. South Harbor Port District
    createTownBuilding(-62, 1072, 16, 12, 14, 0x0284c7, 0xf8fafc, 0.08);
    createTownBuilding(62, 1072, 16, 13, 14, 0xe81e25, 0xfef08a, -0.08);
    createTownBuilding(-62, 1162, 16, 11, 14, 0xf97316, 0xffffff, 0.15);
    createTownBuilding(62, 1162, 16, 14, 14, 0x16a34a, 0xf0fdf4, -0.15);

    // 3. West Tech & Industrial Village
    createTownBuilding(-1160, -75, 16, 15, 15, 0x0284c7, 0xffffff, 0.12);
    createTownBuilding(-1120, -75, 15, 13, 15, 0x9333ea, 0xfaf5ff, -0.1);
    createTownBuilding(-1160, 115, 16, 12, 15, 0x16a34a, 0xf8fafc, -0.08);
    createTownBuilding(-1080, 115, 15, 14, 15, 0xf97316, 0xfef08a, 0.14);

    // 4. North Observatory Research Outpost
    createTownBuilding(-55, -1180, 16, 14, 15, 0x1d4ed8, 0xf8fafc, 0.1);
    createTownBuilding(55, -1180, 16, 15, 15, 0x0284c7, 0xffffff, -0.1);
    createTownBuilding(-55, -1060, 14, 12, 14, 0x16a34a, 0xf0fdf4, -0.12);
    createTownBuilding(55, -1060, 14, 12, 14, 0xe81e25, 0xfef2f2, 0.12);

    // Coastal Lighthouse on East Peninsula Lookout (1320, 60)
    const lhX = 1320, lhZ = 60;
    const lhRes = buildEastLighthouseMesh(true);
    const lighthouseGroup = lhRes.root;
    lhBeamPivot = lhRes.lhBeamPivot;
    const lhY = getTerrainHeight(lhX, lhZ);
    lighthouseGroup.position.set(lhX, lhY, lhZ);
    mergeStaticMeshesInGroup(lighthouseGroup, [lhBeamPivot]);
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
    mergeStaticMeshesInGroup(harborSeawall);
    s.add(harborSeawall);
    registerCullableObject(harborSeawall, 0, 1, 1184, 115);

    // South Harbor Pier Dock (centered around local 0,0,0 -> placed at z = 1228)
    const { root: pierGroup } = buildHarborPierMesh();
    pierGroup.position.set(0, 0, 1228);
    mergeStaticMeshesInGroup(pierGroup);
    s.add(pierGroup);
    registerCullableObject(pierGroup, 0, 2, 1228, 65);

    // East Static Cargo Gantry Crane (x: 32, z: 1172)
    {
        const craneX = 32, craneZ = 1172;
        const cy = Math.max(0.5, getTerrainHeight(craneX, craneZ));
        const { root: craneGroup } = buildDockCargoCraneMesh();
        craneGroup.position.set(craneX, cy, craneZ);
        mergeStaticMeshesInGroup(craneGroup);
        s.add(craneGroup);
        registerCullableObject(craneGroup, craneX, cy + 16, craneZ + 8, 42);
        worldColliders.push({ x: craneX, z: craneZ, r: 6.5 });
    }

    // =========================================================================
    // INTERACTIVE HIGH-FLYING MAGNETIC GANTRY CRANE (At X: -105, Z: 1162)
    // =========================================================================
    const craneState: CraneInteractiveState = {
        craneX: -105,
        craneZ: 1162,
        padX: -105,
        padZ: 1142,
        dropX: -105,
        dropZ: 1176,
        state: 'IDLE',
        timer: 0,
        cooldown: 0,
        boomPivot: null,
        cableMesh: null,
        magnetGroup: null,
        padLights: []
    };
    craneInteractive = craneState;

    {
        const cy = Math.max(0.5, getTerrainHeight(craneState.craneX, craneState.craneZ));
        const magCraneRes = buildMagneticGantryCraneMesh();
        const craneGroup = magCraneRes.root;
        craneGroup.position.set(craneState.craneX, cy, craneState.craneZ);
        craneState.boomPivot = magCraneRes.boomPivot;
        craneState.cableMesh = magCraneRes.cableMesh;
        craneState.magnetGroup = magCraneRes.magnetGroup;
        mergeStaticMeshesInGroup(craneGroup, [magCraneRes.boomPivot]);
        targetScene.add(craneGroup);
        registerCullableObject(craneGroup, craneState.craneX, cy + 16, craneState.craneZ, 48);
        worldColliders.push({ x: craneState.craneX, z: craneState.craneZ, r: 6.5 });
    }

    // Ground Target Pickup Pad for Crane Magnet
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
            bulb.position.set(craneState.padX + ox, padY + 0.5, craneState.padZ + oz);
            bulb.userData.noOutline = true;
            targetScene.add(bulb);
            craneState.padLights.push(bulb);
        });
    }

    // 1B. Stacked Colorful Shipping Containers in South Harbor Yard
    [
        { x: -102, z: 1150, rotY: 0.05 },
        { x: 102, z: 1150, rotY: -0.05 },
        { x: -130, z: 1150, rotY: 0.12 },
        { x: 130, z: 1150, rotY: -0.12 }
    ].forEach((yard, yIdx) => {
        const yy = Math.max(0.5, getTerrainHeight(yard.x, yard.z));
        const { root: yardGroup } = buildCargoContainerYardMesh(yIdx);
        yardGroup.position.set(yard.x, yy, yard.z);
        yardGroup.rotation.y = yard.rotY;
        mergeStaticMeshesInGroup(yardGroup);
        s.add(yardGroup);
        registerCullableObject(yardGroup, yard.x, yy + 8, yard.z, 24);
        worldColliders.push({ x: yard.x, z: yard.z, r: 9.5 });
    });

    // =========================================================================
    // 1C. RIDEABLE SOUTH HARBOR RESCUE FERRY BOAT
    // =========================================================================
    ferryController = {
        state: 'DOCKED',
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
            { x: 36, z: 1232 },
            { x: 36, z: 1310 },
            { x: -30, z: 1410 },
            { x: -120, z: 1510 },
            { x: -80, z: 1610 },
            { x: 40, z: 1580 },
            { x: 110, z: 1460 },
            { x: 70, z: 1330 },
            { x: 36, z: 1232 }
        ]
    };

    const ferryRes = buildHarborFerryMesh();
    harborFerryGroup = ferryRes.root;
    harborFerryGroup.position.copy(ferryController.dockPos);
    ferryController.rampMesh = ferryRes.ferryRampPivot;
    mergeStaticMeshesInGroup(harborFerryGroup, [ferryRes.ferryRampPivot]);
    harborFerryGroup.matrixAutoUpdate = true;
    harborFerryGroup.traverse((child: THREE.Object3D) => {
        child.frustumCulled = false;
    });
    s.add(harborFerryGroup);

    // Fixed Pier Boarding Bridge connecting South Harbor Pier Deck to Ferry Mooring Slip
    const { root: boardingBridgeGroup } = buildFerryBoardingBridgeMesh();
    boardingBridgeGroup.position.set(26, 0, 1221.5);
    mergeStaticMeshesInGroup(boardingBridgeGroup);
    s.add(boardingBridgeGroup);
    registerCullableObject(boardingBridgeGroup, 26, 4, 1220, 35);

    // =========================================================================
    // 1D. DOC GREENE'S ANTI-GRAVITY TESTING YARD (X: -1250, Z: 65)
    // =========================================================================
    const tyState: TestYardState = {
        baseX: -1250,
        baseZ: 65,
        bouncePad: { x: -1250, z: 58, radius: 5.5, mesh: null },
        speedStrip: { minX: -1290, maxX: -1210, z: 84, width: 7.0 },
        targets: []
    };
    testYard = tyState;

    const tyRes = buildAntiGravTestYardMesh();
    const testYardGroup = tyRes.root;
    const testYardY = Math.max(0.5, getTerrainHeight(tyState.baseX, tyState.baseZ));
    tyState.baseY = testYardY;
    testYardGroup.position.set(tyState.baseX, testYardY, tyState.baseZ);
    tyState.bouncePad.mesh = tyRes.bounceMembrane;
    tyRes.targetEntries.forEach(td => {
        tyState.targets.push({
            id: td.id,
            name: td.name,
            x: tyState.baseX + td.lx,
            z: tyState.baseZ + td.lz,
            color: td.color,
            mesh: td.mesh,
            wobble: 0,
            cooldown: 0
        });
    });
    mergeStaticMeshesInGroup(testYardGroup, [tyRes.bounceMembrane, ...tyRes.targetEntries.map(t => t.mesh)]);
    targetScene.add(testYardGroup);
    registerCullableObject(testYardGroup, tyState.baseX, testYardY + 5, tyState.baseZ, 55);
    worldColliders.push({ x: tyState.baseX - 35, z: tyState.baseZ, r: 2.5 });
    worldColliders.push({ x: tyState.baseX + 35, z: tyState.baseZ, r: 2.5 });

    // 2. Volcano Ridge Caldera (-735, -755)
    const volcX = -735, volcZ = -755;
    const volcY = getTerrainHeight(volcX, volcZ);
    const volcRes = buildVolcanoCalderaMesh();
    const volcanoGroup = volcRes.root;
    volcanoLavaPool = volcRes.volcanoLavaPool;
    volcanoSmokePuffs.length = 0;
    volcanoSmokePuffs.push(...volcRes.volcanoSmokePuffs);
    volcanoGroup.position.set(volcX, volcY, volcZ);
    mergeStaticMeshesInGroup(volcanoGroup, [volcanoLavaPool, ...volcanoSmokePuffs]);
    s.add(volcanoGroup);
    registerCullableObject(volcanoGroup, volcX, volcY + 25, volcZ, 68);
    worldColliders.push({ x: volcX, z: volcZ, r: 24.0 });

    // 3. North Observatory (0, -1165)
    const obsX = 0, obsZ = -1165;
    const obsY = getTerrainHeight(obsX, obsZ);
    const obsRes = buildNorthObservatoryMesh();
    const observatoryGroup = obsRes.root;
    observatoryDomePivot = obsRes.observatoryDomePivot;
    observatoryGroup.position.set(obsX, obsY, obsZ);
    mergeStaticMeshesInGroup(observatoryGroup, [observatoryDomePivot]);
    s.add(observatoryGroup);
    registerCullableObject(observatoryGroup, obsX, obsY + 15, obsZ, 55);
    worldColliders.push({ x: obsX, z: obsZ, r: 17.5 });

    // 4. West Tech Park (-1175, 25): Geodesic Glass Laboratory Dome & Spinning Wind Turbines
    const techX = -1175, techZ = 25;
    const techY = getTerrainHeight(techX, techZ);
    const techRes = buildWestTechLabMesh(true);
    const techLabGroup = techRes.root;
    windTurbineRotors.length = 0;
    windTurbineRotors.push(...techRes.rotors);
    techLabGroup.position.set(techX, techY, techZ);
    mergeStaticMeshesInGroup(techLabGroup, windTurbineRotors);
    s.add(techLabGroup);
    registerCullableObject(techLabGroup, techX - 10, techY + 20, techZ, 78);
    worldColliders.push({ x: techX, z: techZ, r: 19.0 });

    // Sky Array Communications Tower on North-East Peak (780, -780)
    const arrY = getTerrainHeight(780, -780);
    const { root: arrayGroup } = buildSkyCommsArrayMesh();
    arrayGroup.position.set(780, arrY, -780);
    mergeStaticMeshesInGroup(arrayGroup);
    s.add(arrayGroup);
    registerCullableObject(arrayGroup, 780, arrY + 18, -780, 48);
    worldColliders.push({ x: 780, z: -780, r: 6.0 });

    // =========================================================================
    // 5. DINO RIDGE & MOUNT MAGMA SANCTUARY (-750, -750)
    // =========================================================================
    const drY = getTerrainHeight(drX, drZ);
    const drRes = buildDinoRidgeMesh();
    const dinoRidgeGroup = drRes.root;
    amberSpire = drRes.amberSpire;
    babyDinos.length = 0;
    drRes.babyDinos.forEach(bd => {
        babyDinos.push({
            group: bd.group,
            headPivot: bd.headPivot,
            leftLeg: bd.leftLeg,
            rightLeg: bd.rightLeg,
            tail: bd.tail,
            phase: Math.random() * Math.PI * 2,
            worldX: drX + bd.lx,
            worldZ: drZ + bd.lz,
            name: bd.name
        });
    });
    dinoRidgeGroup.position.set(drX, drY, drZ);
    mergeStaticMeshesInGroup(dinoRidgeGroup, [amberSpire, ...babyDinos.map(bd => bd.group)]);
    s.add(dinoRidgeGroup);
    registerCullableObject(dinoRidgeGroup, drX, drY + 12, drZ, 85);
    worldColliders.push({ x: drX, z: drZ, r: 16 });
    worldColliders.push({ x: drX - 12, z: drZ + 48, r: 2.5 });
    worldColliders.push({ x: drX + 12, z: drZ + 48, r: 2.5 });

    // =========================================================================
    // 6. SUNNY SANDS BOARDWALK & AMUSEMENT PIER (-825, 825)
    // =========================================================================
    const bwY = getTerrainHeight(bwX, bwZ);
    const bwRes = buildBoardwalkMesh();
    const boardwalkGroup = bwRes.root;
    ferrisWheelPivot = bwRes.ferrisWheelPivot;
    ferrisGondolas.length = 0;
    ferrisGondolas.push(...bwRes.ferrisGondolas);
    boardwalkGroup.position.set(bwX, bwY, bwZ);
    mergeStaticMeshesInGroup(boardwalkGroup, [ferrisWheelPivot]);
    s.add(boardwalkGroup);
    registerCullableObject(boardwalkGroup, bwX, bwY + 22, bwZ, 85);
    worldColliders.push({ x: bwX, z: bwZ - 12, r: 12 });

    // =========================================================================
    // 7. WAYWARD ISLAND EXPANSION & SUSPENSION CAUSEWAY (1960, 540)
    // =========================================================================
    const waywardIslandGroup = new THREE.Group();
    const wiX = 1960, wiZ = 540;
    const wiY = getTerrainHeight(wiX, wiZ);
    waywardIslandGroup.position.set(wiX, wiY, wiZ);

    // A. Grand Suspension Causeway Bridge over Ocean Channel (centered at local 0,0,0 -> placed at 1620 - wiX, -wiY, 0)
    const { root: causewayGroup } = buildSuspensionCausewayMesh();
    causewayGroup.position.set(1620 - wiX, -wiY, 0);
    waywardIslandGroup.add(causewayGroup);

    // B. Ancient Cybertronian Temple Ruins on Wayward Plateau
    const ruinsRes = buildWaywardRuinsMesh();
    waywardEnergonShard = ruinsRes.waywardEnergonShard;
    waywardIslandGroup.add(ruinsRes.root);

    // D. Shipwreck Cove on East Reef (local: 220, -18, 80)
    const { root: shipGroup } = buildWaywardShipwreckMesh();
    shipGroup.position.set(220, -18, 80);
    shipGroup.rotation.z = 0.28;
    shipGroup.rotation.y = 0.45;
    waywardIslandGroup.add(shipGroup);

    // E. Hidden Cybertronian Sea Grotto (local: 80, -4, -180)
    const { root: grottoGroup } = buildWaywardGrottoMesh();
    grottoGroup.position.set(80, -4, -180);
    waywardIslandGroup.add(grottoGroup);

    // F. Wayward Island Scenic Pier & Ferry Overlook (World: 1802, 0, 306)
    const pierCenterX = 1802, pierCenterZ = 306;
    const { root: waywardPierGroup } = buildWaywardPierMesh();
    waywardPierGroup.position.set(pierCenterX, 0, pierCenterZ);
    waywardPierGroup.rotation.y = -2.548;
    mergeStaticMeshesInGroup(waywardPierGroup);
    s.add(waywardPierGroup);
    registerCullableObject(waywardPierGroup, pierCenterX, 2.2, pierCenterZ, 70);

    // Note: all 4 Wayward sub-assemblies already include ink outlines from buildingModels.ts
    mergeStaticMeshesInGroup(waywardIslandGroup, [waywardEnergonShard]);
    s.add(waywardIslandGroup);
    registerCullableObject(waywardIslandGroup, wiX, wiY + 20, wiZ, 450);
    worldColliders.push({ x: wiX, z: wiZ, r: 28 });
    worldColliders.push({ x: 1530, z: 540 - 8.5, r: 2.2 });
    worldColliders.push({ x: 1530, z: 540 + 8.5, r: 2.2 });
    worldColliders.push({ x: 1710, z: 540 - 8.5, r: 2.2 });
    worldColliders.push({ x: 1710, z: 540 + 8.5, r: 2.2 });

    // =========================================================================
    // STUNT RAMPS ACROSS THE 10X ISLAND
    // =========================================================================
    function createStuntRamp(x: number, z: number, rotY: number, w = 12, l = 18, rampHeight = 3.2) {
        const hw = w * 0.5;
        const hl = l * 0.5;
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const gyCenter = getTerrainHeight(x, z);

        const cornerWorld = (lx: number, lz: number) => {
            const wx = x + lx * cosY + lz * sinY;
            const wz = z - lx * sinY + lz * cosY;
            return getTerrainHeight(wx, wz);
        };

        const gyEL = cornerWorld(-hw, -hl);
        const gyER = cornerWorld(hw, -hl);
        const gyLL = cornerWorld(-hw, hl);
        const gyLR = cornerWorld(hw, hl);

        const { root: ramp } = buildStuntRampMesh(w, l, rampHeight, {
            el: gyEL - gyCenter,
            er: gyER - gyCenter,
            ll: gyLL - gyCenter,
            lr: gyLR - gyCenter,
            minOffset: Math.min(gyEL, gyER, gyLL, gyLR) - gyCenter - 1.8
        });
        ramp.position.set(x, gyCenter, z);
        ramp.rotation.y = rotY;
        freezeStaticHierarchy(ramp);
        targetScene.add(ramp);
        registerCullableObject(ramp, x, gyCenter + 2, z, 20);

        ramps.push({
            x, z,
            w, l, height: rampHeight,
            cosY, sinY,
            r: Math.hypot(w, l) * 0.65
        });
    }

    createStuntRamp(0, 218, 0.0);
    createStuntRamp(-220, 25, -Math.PI / 2);
    createStuntRamp(304, -178, 1.05);
    createStuntRamp(0, 740, 0.0);
    createStuntRamp(-680, 25, -Math.PI / 2);
    createStuntRamp(680, 25, Math.PI / 2);

    // =========================================================================
    // 5B-3. SKY STUNT HOOPS (Interactive Aerial Rings across Griffin Rock)
    // =========================================================================
    const STUNT_HOOPS = [
        { id: 1, name: 'HQ Ramp Stunt Launch', x: 0, y: 15.5, z: 238, rotY: 0.0, radius: 6.2, color: 0x38bdf8 },
        { id: 2, name: 'Town Plaza Sky Ring', x: 0, y: 25.0, z: -15, rotY: 0, radius: 7.2, color: 0xfacc15 },
        { id: 3, name: 'West Tech Leap', x: -240, y: 16.5, z: 25, rotY: -Math.PI / 2, radius: 6.2, color: 0xa855f7 },
        { id: 4, name: 'Cliffside Overlook', x: 318, y: 18.5, z: -166, rotY: 1.05, radius: 6.5, color: 0xf43f5e },
        { id: 5, name: 'Volcano Caldera Flight Ring', x: -735, y: 68.0, z: -755, rotY: 0.4, radius: 8.0, color: 0xf97316 },
        { id: 6, name: 'South Harbor Ocean Bay Ring', x: 0, y: 16.0, z: 1250, rotY: 0, radius: 7.2, color: 0x06b6d4 }
    ];

    STUNT_HOOPS.forEach(hDef => {
        const hoopRes = buildSkyStuntHoopMesh(hDef.radius, hDef.color);
        const hGroup = hoopRes.root;
        hGroup.position.set(hDef.x, hDef.y, hDef.z);
        hGroup.rotation.y = hDef.rotY;
        s.add(hGroup);
        registerCullableObject(hGroup, hDef.x, hDef.y, hDef.z, hDef.radius * 2.5);

        stuntHoopRigs.push({
            def: hDef,
            group: hGroup,
            torusMesh: hoopRes.torusMesh,
            haloMesh: hoopRes.haloMesh,
            starPivot: hoopRes.starPivot,
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

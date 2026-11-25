// Griffin Rock 3D Underwater Environment (worldState.activeArea === 'UNDERWATER')
// Accessible by High Tide when in the ocean water surrounding Griffin Rock.
import * as THREE from 'three';
import { scene, camera } from '../rendering/scene.js';
import {
    toonGrad3, matDarkSteel, matChrome, matOptimusGold, matOptimusRed,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs, input, worldState } from '../state/gameState.js';
import { progression, saveProgression } from '../progression/progression.js';
import { applyBotRigMorph } from '../bots/botRigs.js';
import { syncHUDToActiveBot } from '../physics/player.js';
import { setActiveParticleScene, spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';
import { isActionActive } from '../settings/settings.js';

export const underwaterScene = new THREE.Scene();
export const UNDERWATER_RADIUS = 480;
export const UNDERWATER_SURFACE_Y = 76;
const SURFACE_BREACH_Y = 72.5;

interface UnderwaterLandmarkDef {
    id: string;
    name: string;
    subtitle: string;
    x: number;
    y: number;
    z: number;
    color: string;
    speaker: string;
    speakerRole: string;
    speech: string;
}

interface UnderwaterLandmarkRuntime extends UnderwaterLandmarkDef {
    discovered: boolean;
    group: THREE.Group;
}

interface UnderwaterRelicRuntime {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    mesh: THREE.Group;
    collected: boolean;
}

interface UnderwaterCrystalRuntime {
    x: number;
    y: number;
    z: number;
    mesh: THREE.Mesh;
    collected: boolean;
}

interface UnderwaterRingRuntime {
    x: number;
    y: number;
    z: number;
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
}

interface MethaneVentRuntime {
    x: number;
    y: number;
    z: number;
    plume: THREE.Mesh;
}

interface BubbleParticle {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
}

export const underwaterSub = {
    pos: new THREE.Vector3(0, 52, 0),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    speed: 0,
    boostTimer: 0,
    sonarTimer: 0,
    waypoint: new THREE.Vector3(),
    hasWaypoint: false,
    touchAscend: 0,
    touchDescend: 0,
    activeRingIdx: 0,
    ringsHitInLap: 0
};

let _built = false;
let _exitCooldown = 0;
let _surfaceMesh: THREE.Mesh | null = null;
let _waypointGroup: THREE.Group | null = null;
let _sonarWaveMesh: THREE.Mesh | null = null;
let _sonarWaveMat: THREE.MeshBasicMaterial | null = null;
let _triangleAnomalyRing: THREE.Mesh | null = null;
let _giantSquidGroup: THREE.Group | null = null;
let _giantSquidMat: THREE.MeshToonMaterial | null = null;
let _giantSquidAngle = 0;
let _mechSharkGroup: THREE.Group | null = null;
let _mechSharkAngle = 0;
let _mechSharkSpookTimer = 0;
let _moroccoBuoyMesh: THREE.Mesh | null = null;
let _moroccoBuoyMat: THREE.MeshBasicMaterial | null = null;
let _moroccoBuoyDisabled = false;
let _bubbleSpawnTimer = 0;

const _landmarks: UnderwaterLandmarkRuntime[] = [];
const _relics: UnderwaterRelicRuntime[] = [];
const _crystals: UnderwaterCrystalRuntime[] = [];
const _rings: UnderwaterRingRuntime[] = [];
const _vents: MethaneVentRuntime[] = [];
const _whales: Array<{ group: THREE.Group; radius: number; height: number; speed: number; angle: number }> = [];
const _kelpStalks: Array<{ mesh: THREE.Mesh; phase: number }> = [];
const _bubbles: BubbleParticle[] = [];

const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _tmpVec = new THREE.Vector3();

const MOROCCO_BUOY_POS = new THREE.Vector3(-162, 24, -158);

export function getUnderwaterFloorHeight(x: number, z: number): number {
    // Keep seabed strictly above y = 4.0m so Earth surface water checks never interfere
    const base = 14.5 + Math.sin(x * 0.014) * 3.8 + Math.cos(z * 0.015) * 3.4;
    // Abyssal Trench in the North / Northeast (Midgard & Methane Vents)
    const dTrench = Math.hypot(x - 75, z + 235);
    const trenchDrop = dTrench < 155 ? (1 - dTrench / 155) * 9.5 : 0;
    // Raised Kelp Reef Plateau in the West (Chompy Reef)
    const dReef = Math.hypot(x + 210, z - 125);
    const reefLift = dReef < 130 ? (1 - dReef / 130) * 8.5 : 0;
    // Perimeter ocean canyon walls
    const r = Math.hypot(x, z);
    const wallLift = r > UNDERWATER_RADIUS - 70 ? Math.pow((r - (UNDERWATER_RADIUS - 70)) / 70, 2) * 32 : 0;
    return Math.max(4.5, base - trenchDrop + reefLift + wallLift);
}

function addHorizonBeacon(parent: THREE.Object3D, colorHex: number, height = 52) {
    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 2.5, height, 10, 1, true),
        new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    beam.position.y = height * 0.5;
    parent.add(beam);
}

function buildMidgardLab(x: number, z: number): THREE.Group {
    const g = new THREE.Group();
    const y = getUnderwaterFloorHeight(x, z);
    g.position.set(x, y, z);

    const matHull = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    const matDome = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.68 });
    const matGlow = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });

    // Central Foundation & Multi-Dome Undersea Research Habitat (Professor Anna Baranova's Midgard)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(18, 22, 6, 12), matHull);
    base.position.y = 3;
    const mainDome = new THREE.Mesh(
        new THREE.SphereGeometry(14, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
        matDome
    );
    mainDome.position.y = 5.5;
    const domeRing = new THREE.Mesh(
        new THREE.TorusGeometry(14.2, 1.1, 8, 28).rotateX(Math.PI / 2),
        matOptimusGold
    );
    domeRing.position.y = 6.0;
    g.add(base, mainDome, domeRing);

    // 3 Connecting Research Pods & Airlock Tunnel
    [0, 2.1, 4.2].forEach((ang) => {
        const px = Math.cos(ang) * 20;
        const pz = Math.sin(ang) * 20;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 12, 10), matDarkSteel);
        tube.position.set(px * 0.55, 4.5, pz * 0.55);
        tube.rotation.z = Math.PI / 2;
        tube.rotation.y = -ang;
        const pod = new THREE.Mesh(new THREE.SphereGeometry(6.5, 14, 12), matHull);
        pod.position.set(px, 5.2, pz);
        const porthole = new THREE.Mesh(new THREE.CircleGeometry(2.4, 14), matGlow);
        porthole.position.set(px + Math.cos(ang) * 6.6, 5.5, pz + Math.sin(ang) * 6.6);
        porthole.lookAt(px + Math.cos(ang) * 20, 5.5, pz + Math.sin(ang) * 20);
        g.add(tube, pod, porthole);
    });

    addHorizonBeacon(g, 0x38bdf8, 56);
    applyCartoonInkOutlines(g, 1.03, true);
    return g;
}

function buildTriangleShipwreck(x: number, z: number): THREE.Group {
    const g = new THREE.Group();
    const y = getUnderwaterFloorHeight(x, z);
    g.position.set(x, y, z);

    const matWood = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });
    const matSail = new THREE.MeshToonMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide, gradientMap: toonGrad3 });

    // Classic Sunken Maine Schooner tilted on the seabed
    const hull = new THREE.Mesh(new THREE.BoxGeometry(11, 6.5, 32), matWood);
    hull.position.set(0, 3.2, 0);
    hull.rotation.set(0.08, 0.35, 0.24);
    const prow = new THREE.Mesh(new THREE.ConeGeometry(5.8, 11, 4).rotateX(Math.PI / 2), matWood);
    prow.position.set(5.5, 4.5, 18);
    prow.rotation.y = 0.35;
    const mast1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.85, 22, 8), matWood);
    mast1.position.set(-1.5, 13.5, 2);
    mast1.rotation.z = 0.24;
    const mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 16, 8), matWood);
    mast2.position.set(1.5, 10.5, -9);
    mast2.rotation.z = 0.32;
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), matSail);
    sail.position.set(-3.5, 16, 2.5);
    sail.rotation.y = 0.45;
    g.add(hull, prow, mast1, mast2, sail);

    // Swirling Griffin Rock Triangle Anomaly Ring hovering above the wreck!
    const triRing = new THREE.Mesh(
        new THREE.TorusGeometry(19, 1.05, 8, 3),
        new THREE.MeshBasicMaterial({ color: 0x2dd4bf })
    );
    triRing.position.set(0, 22, 0);
    triRing.rotation.x = Math.PI / 2;
    g.add(triRing);
    _triangleAnomalyRing = triRing;

    addHorizonBeacon(g, 0x2dd4bf, 54);
    applyCartoonInkOutlines(g, 1.03, true);
    return g;
}

function buildMoroccoSharkSub(x: number, z: number): THREE.Group {
    const g = new THREE.Group();
    const y = getUnderwaterFloorHeight(x, z);
    g.position.set(x, y, z);

    const matSub = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    const matGlass = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    // Dr. Morocco's Shark-Shaped Submersible resting on the ridge
    const body = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.2, 22, 12).rotateX(Math.PI / 2), matSub);
    body.position.set(0, 5.8, 0);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(4.4, 9.5, 10).rotateX(Math.PI / 2), matSub);
    nose.position.set(0, 5.8, 15.5);
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(2.8, 9.0, 4), matOptimusRed);
    dorsal.position.set(0, 12.2, -1);
    dorsal.rotation.x = -0.35;
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 10.5, 6.2), matSub);
    tailFin.position.set(0, 6.5, -13.5);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 10), matGlass);
    cockpit.position.set(0, 7.6, 7.2);
    cockpit.scale.set(1.1, 0.7, 1.5);
    g.add(body, nose, dorsal, tailFin, cockpit);

    // Interactive Sonic Control Buoy (disabled via High Tide's Sonar Pulse!)
    const buoyOffset = new THREE.Vector3(MOROCCO_BUOY_POS.x - x, MOROCCO_BUOY_POS.y - y, MOROCCO_BUOY_POS.z - z);
    const tether = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, Math.max(4, buoyOffset.y), 6), matChrome);
    tether.position.set(buoyOffset.x, buoyOffset.y * 0.5, buoyOffset.z);
    _moroccoBuoyMat = new THREE.MeshBasicMaterial({ color: _moroccoBuoyDisabled ? 0x4ade80 : 0xef4444 });
    _moroccoBuoyMesh = new THREE.Mesh(new THREE.OctahedronGeometry(3.6, 0), _moroccoBuoyMat);
    _moroccoBuoyMesh.position.copy(buoyOffset);
    g.add(tether, _moroccoBuoyMesh);

    addHorizonBeacon(g, _moroccoBuoyDisabled ? 0x4ade80 : 0xf43f5e, 52);
    applyCartoonInkOutlines(g, 1.03, true);
    return g;
}

function buildGiantSquid(): THREE.Group {
    const g = new THREE.Group();
    _giantSquidMat = new THREE.MeshToonMaterial({
        color: _moroccoBuoyDisabled ? 0x06b6d4 : 0xbe123c,
        gradientMap: toonGrad3
    });
    const mantle = new THREE.Mesh(new THREE.ConeGeometry(4.2, 16, 10).rotateX(Math.PI / 2), _giantSquidMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 10), _giantSquidMat);
    head.position.z = 7.5;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-2.4, 2.4].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), eyeMat);
        eye.position.set(ex, 0.8, 8.8);
        g.add(eye);
    });
    // 6 trailing tentacles
    for (let t = 0; t < 6; t++) {
        const ang = (t / 6) * Math.PI * 2;
        const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.25, 15, 6).rotateX(Math.PI / 2), _giantSquidMat);
        tent.position.set(Math.cos(ang) * 2.2, Math.sin(ang) * 2.2, 15.5);
        g.add(tent);
    }
    g.add(mantle, head);
    applyCartoonInkOutlines(g, 1.04, true);
    return g;
}

function buildMechShark(): THREE.Group {
    const g = new THREE.Group();
    const matSteel = new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 });
    const matJaw = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.8, 12, 10).rotateX(Math.PI / 2), matSteel);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5.2, 8).rotateX(Math.PI / 2), matSteel);
    snout.position.z = 8.4;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4.8, 4), matOptimusGold);
    fin.position.set(0, 3.6, 0);
    fin.rotation.x = -0.35;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.2, 3.8), matSteel);
    tail.position.set(0, 0.4, -7.8);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), matJaw);
    eyeL.position.set(-1.5, 0.8, 6.2);
    const eyeR = eyeL.clone();
    eyeR.position.x = 1.5;
    g.add(body, snout, fin, tail, eyeL, eyeR);
    applyCartoonInkOutlines(g, 1.04, true);
    return g;
}

function buildSpermWhale(): THREE.Group {
    const g = new THREE.Group();
    const matWhale = new THREE.MeshToonMaterial({ color: 0x1e3a8a, gradientMap: toonGrad3 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6.2, 13.5), matWhale);
    head.position.z = 5.5;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 1.6, 16, 10).rotateX(Math.PI / 2), matWhale);
    body.position.z = -7.5;
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.8, 4.5), matWhale);
    fluke.position.z = -16.0;
    const flipperL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.7, 3.2), matWhale);
    flipperL.position.set(-4.6, -1.8, 2.0);
    flipperL.rotation.z = 0.25;
    const flipperR = flipperL.clone();
    flipperR.position.x = 4.6;
    flipperR.rotation.z = -0.25;
    g.add(head, body, fluke, flipperL, flipperR);
    applyCartoonInkOutlines(g, 1.03, true);
    return g;
}

function buildUnderwaterWorld() {
    if (_built) return;
    _built = true;

    _moroccoBuoyDisabled = Boolean(progression.underwaterMoroccoCalmed);

    underwaterScene.background = new THREE.Color(0x052e4a);
    underwaterScene.fog = new THREE.FogExp2(0x063b5c, 0.0029);

    // Underwater Lighting (bright sunlit surface above, deep navy ambient below)
    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x082f49, 1.25);
    const sun = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    sun.position.set(80, 140, 60);
    underwaterScene.add(hemi, sun);

    // Sculpted Ocean Seabed Terrain (strictly y >= 4.5m)
    const floorGeo = new THREE.PlaneGeometry(UNDERWATER_RADIUS * 2.15, UNDERWATER_RADIUS * 2.15, 72, 72);
    floorGeo.rotateX(-Math.PI / 2);
    const posAttr = floorGeo.attributes.position;
    const colors: number[] = [];
    const cShallow = new THREE.Color(0x0e7490);
    const cMid = new THREE.Color(0x0f4c5c);
    const cDeep = new THREE.Color(0x082f49);
    const cTmp = new THREE.Color();
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const vy = getUnderwaterFloorHeight(vx, vz);
        posAttr.setY(i, vy);
        const t = THREE.MathUtils.clamp((vy - 5) / 22, 0, 1);
        cTmp.copy(cDeep).lerp(t > 0.5 ? cShallow : cMid, t);
        colors.push(cTmp.r, cTmp.g, cTmp.b);
    }
    floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    floorGeo.computeVertexNormals();
    const floorMesh = new THREE.Mesh(
        floorGeo,
        new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGrad3 })
    );
    underwaterScene.add(floorMesh);

    // Shimmering Ocean Surface Overhead at y = UNDERWATER_SURFACE_Y
    _surfaceMesh = new THREE.Mesh(
        new THREE.CircleGeometry(UNDERWATER_RADIUS * 1.15, 48).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide
        })
    );
    _surfaceMesh.position.y = UNDERWATER_SURFACE_Y;
    underwaterScene.add(_surfaceMesh);

    // Sunlit Caustic God-Ray Cones descending from the surface
    const rayMat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const dist = 60 + ((i * 83) % 290);
        const ray = new THREE.Mesh(new THREE.CylinderGeometry(8, 22, 64, 10, 1, true), rayMat);
        ray.position.set(Math.cos(ang) * dist, 44, Math.sin(ang) * dist);
        ray.rotation.z = 0.14;
        underwaterScene.add(ray);
    }

    // 5 Show-Accurate Landmarks
    const foundList: string[] = Array.isArray(progression.underwaterLandmarksFound)
        ? progression.underwaterLandmarksFound
        : [];
    const defs: UnderwaterLandmarkDef[] = [
        {
            id: 'MIDGARD',
            name: 'The Midgard Undersea Lab',
            subtitle: 'Professor Anna Baranova’s Abyssal Station',
            x: 145, y: getUnderwaterFloorHeight(145, -185) + 12, z: -185,
            color: '#38bdf8',
            speaker: 'HIGHTIDE',
            speakerRole: 'Maritime Rescue Veteran',
            speech: 'Well blow me down! That’s Professor Baranova’s Midgard Lab right down in the Griffin Rock Trench!'
        },
        {
            id: 'TRIANGLE_SHIPWRECK',
            name: 'Griffin Rock Triangle Wreck',
            subtitle: 'Sunken Maine Schooner & Magnetic Anomaly',
            x: 185, y: getUnderwaterFloorHeight(185, 160) + 14, z: 160,
            color: '#2dd4bf',
            speaker: 'HIGHTIDE',
            speakerRole: 'Maritime Rescue Veteran',
            speech: 'Aye, the Griffin Rock Triangle! Many a schooner vanished here before the Rescue Bots cracked the mystery!'
        },
        {
            id: 'MOROCCO_SUB',
            name: 'Dr. Morocco’s Shark Sub',
            subtitle: 'Sunken Submersible & Sonic Control Buoy',
            x: -175, y: getUnderwaterFloorHeight(-175, -170) + 12, z: -170,
            color: '#f43f5e',
            speaker: 'HIGHTIDE',
            speakerRole: 'Maritime Rescue Veteran',
            speech: 'Shiver me thrusters—Dr. Morocco’s Shark Sub! Hit that red Sonic Buoy with a SONAR pulse to calm the Giant Squid!'
        },
        {
            id: 'CHOMPY_REEF',
            name: 'Mechanical Shark Kelp Reef',
            subtitle: 'Patrolled by the Tech-Eating Robotic Shark',
            x: -210, y: getUnderwaterFloorHeight(-210, 125) + 14, z: 125,
            color: '#4ade80',
            speaker: 'HIGHTIDE',
            speakerRole: 'Maritime Rescue Veteran',
            speech: 'Keep your hull plates clear, matey! That robotic shark from Deep Trouble is patrolling this kelp forest!'
        },
        {
            id: 'METHANE_TRENCH',
            name: 'Offshore Pilings & Methane Vents',
            subtitle: 'Doc Greene’s Research Platform & Thermal Plumes',
            x: 0, y: getUnderwaterFloorHeight(0, -295) + 14, z: -295,
            color: '#facc15',
            speaker: 'HIGHTIDE',
            speakerRole: 'Maritime Rescue Veteran',
            speech: 'Doc Greene’s offshore pilings! Ride those rising methane bubble vents for a free boost back toward the surface!'
        }
    ];

    // Build Landmark Meshes
    const midgardGrp = buildMidgardLab(145, -185);
    const wreckGrp = buildTriangleShipwreck(185, 160);
    const moroccoGrp = buildMoroccoSharkSub(-175, -170);

    // Chompy Reef Coral Arch
    const reefGrp = new THREE.Group();
    const reefY = getUnderwaterFloorHeight(-210, 125);
    reefGrp.position.set(-210, reefY, 125);
    const coralArch = new THREE.Mesh(
        new THREE.TorusGeometry(18, 3.6, 8, 22, Math.PI),
        new THREE.MeshToonMaterial({ color: 0xf472b6, gradientMap: toonGrad3 })
    );
    coralArch.position.y = 2;
    reefGrp.add(coralArch);
    addHorizonBeacon(reefGrp, 0x4ade80, 52);
    applyCartoonInkOutlines(reefGrp, 1.03, true);

    // Offshore Platform Pilings & 6 Bubbling Methane Vents
    const trenchGrp = new THREE.Group();
    const trenchY = getUnderwaterFloorHeight(0, -295);
    trenchGrp.position.set(0, trenchY, -295);
    [[-16, -16], [16, -16], [-16, 16], [16, 16]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 72, 10), matDarkSteel);
        leg.position.set(px, 34, pz);
        trenchGrp.add(leg);
    });
    addHorizonBeacon(trenchGrp, 0xfacc15, 56);
    applyCartoonInkOutlines(trenchGrp, 1.03, true);

    const groups = [midgardGrp, wreckGrp, moroccoGrp, reefGrp, trenchGrp];
    defs.forEach((def, idx) => {
        const grp = groups[idx];
        underwaterScene.add(grp);
        _landmarks.push({
            ...def,
            discovered: foundList.includes(def.id),
            group: grp
        });
    });

    // 6 Geothermal / Methane Vents emitting upward currents
    const ventCoords = [
        [0, -295], [-26, -275], [28, -280], [95, -225], [125, -245], [-42, -310]
    ];
    const matVent = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matPlume = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
    ventCoords.forEach(([vx, vz]) => {
        const vy = getUnderwaterFloorHeight(vx, vz);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(4.2, 7.5, 8), matVent);
        cone.position.set(vx, vy + 3.2, vz);
        const plume = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 1.8, 44, 10, 1, true), matPlume);
        plume.position.set(vx, vy + 25, vz);
        underwaterScene.add(cone, plume);
        _vents.push({ x: vx, y: vy, z: vz, plume });
    });

    // Swaying Kelp Forest Clusters
    const matKelp = new THREE.MeshToonMaterial({ color: 0x15803d, gradientMap: toonGrad3 });
    for (let k = 0; k < 65; k++) {
        const ang = (k / 65) * Math.PI * 2 + 0.12;
        const dist = 55 + ((k * 71) % 345);
        const kx = Math.cos(ang) * dist;
        const kz = Math.sin(ang) * dist;
        const ky = getUnderwaterFloorHeight(kx, kz);
        const h = 14 + (k % 5) * 4.5;
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, h, 5), matKelp);
        stalk.position.set(kx, ky + h * 0.5, kz);
        underwaterScene.add(stalk);
        _kelpStalks.push({ mesh: stalk, phase: k * 0.65 });
    }

    // Animated Show Creatures: Giant Squid, Mechanical Shark ("Chompy"), and Pod of 3 Sperm Whales
    _giantSquidGroup = buildGiantSquid();
    _giantSquidGroup.position.set(-140, 32, -145);
    underwaterScene.add(_giantSquidGroup);

    _mechSharkGroup = buildMechShark();
    _mechSharkGroup.position.set(-210, 34, 125);
    underwaterScene.add(_mechSharkGroup);

    for (let w = 0; w < 3; w++) {
        const whale = buildSpermWhale();
        const radius = 145 + w * 55;
        const height = 46 + w * 5.5;
        const angle = w * 2.1;
        whale.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        underwaterScene.add(whale);
        _whales.push({ group: whale, radius, height, speed: 0.14 + w * 0.03, angle });
    }

    // High Tide's 8-Ring Deep-Sea Rescue Training Course ("Turning the Tide")
    const ringPts: Array<[number, number, number]> = [
        [0, 42, -55], [75, 34, -110], [135, 28, -45], [140, 36, 75],
        [65, 44, 135], [-55, 38, 120], [-135, 30, 35], [-95, 40, -65]
    ];
    ringPts.forEach(([rx, ry, rz], idx) => {
        const mat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0xfacc15 : 0x38bdf8 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(11.5, 1.0, 10, 28), mat);
        ring.position.set(rx, ry, rz);
        const next = ringPts[(idx + 1) % ringPts.length];
        ring.lookAt(next[0], next[1], next[2]);
        underwaterScene.add(ring);
        _rings.push({ x: rx, y: ry, z: rz, mesh: ring, mat });
    });

    // 5 Collectible Deep-Sea Relics
    const foundRelics: string[] = Array.isArray(progression.underwaterRelicsFound)
        ? progression.underwaterRelicsFound
        : [];
    const relicDefs = [
        { id: 'UW_MIDGARD_LOG', name: 'Baranova’s Midgard Data Core', x: 168, y: 24, z: -175 },
        { id: 'UW_TRIANGLE_COMPASS', name: 'Griffin Rock Brass Sextant', x: 202, y: 20, z: 175 },
        { id: 'UW_MOROCCO_KEY', name: 'Morocco Sub Cipher Key', x: -192, y: 22, z: -185 },
        { id: 'UW_SHARK_TOOTH', name: 'Robotic Shark Titanium Tooth', x: -232, y: 28, z: 142 },
        { id: 'UW_ABYSSAL_PEARL', name: 'Abyssal Energon Pearl', x: 16, y: 18, z: -315 }
    ];
    relicDefs.forEach((rd) => {
        const collected = foundRelics.includes(rd.id);
        const rg = new THREE.Group();
        rg.position.set(rd.x, Math.max(getUnderwaterFloorHeight(rd.x, rd.z) + 5, rd.y), rd.z);
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), matOptimusGold);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.28, 8, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        rg.add(core, halo);
        addHorizonBeacon(rg, 0xfacc15, 36);
        rg.visible = !collected;
        underwaterScene.add(rg);
        _relics.push({ ...rd, y: rg.position.y, mesh: rg, collected });
    });

    // 12 Sunken Energon Crystals
    const matCrys = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    for (let c = 0; c < 12; c++) {
        const ang = (c / 12) * Math.PI * 2 + 0.25;
        const dist = 110 + (c % 3) * 85;
        const cx = Math.cos(ang) * dist;
        const cz = Math.sin(ang) * dist;
        const cy = getUnderwaterFloorHeight(cx, cz) + 6.5 + (c % 3) * 6;
        const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.75, 0), matCrys);
        mesh.position.set(cx, cy, cz);
        underwaterScene.add(mesh);
        _crystals.push({ x: cx, y: cy, z: cz, mesh, collected: false });
    }

    // 3D Underwater Waypoint Marker (for iPad/mouse tap-to-swim)
    _waypointGroup = new THREE.Group();
    const wpRing = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.45, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    const wpCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.8, 0),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    _waypointGroup.add(wpRing, wpCore);
    _waypointGroup.visible = false;
    underwaterScene.add(_waypointGroup);

    // Expanding 3D Sonar Pulse Wave
    _sonarWaveMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    _sonarWaveMesh = new THREE.Mesh(new THREE.RingGeometry(2.5, 4.2, 36).rotateX(-Math.PI / 2), _sonarWaveMat);
    _sonarWaveMesh.visible = false;
    underwaterScene.add(_sonarWaveMesh);
}

function spawnBubble(pos: THREE.Vector3) {
    if (_bubbles.length > 55) return;
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.45 + Math.random() * 0.45, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65 })
    );
    mesh.position.set(
        pos.x + (Math.random() - 0.5) * 2.5,
        pos.y + (Math.random() - 0.5) * 1.5,
        pos.z + (Math.random() - 0.5) * 2.5
    );
    underwaterScene.add(mesh);
    _bubbles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 2.5, 5.5 + Math.random() * 4.5, (Math.random() - 0.5) * 2.5),
        life: 1.8,
        maxLife: 1.8
    });
}

export function updateUnderwaterHUD() {
    if (typeof document === 'undefined') return;
    const isUw = worldState.activeArea === 'UNDERWATER';
    const pill = document.getElementById('underwater-hud-pill');
    const bar = document.getElementById('underwater-controls-bar');
    if (pill) pill.classList.toggle('hidden', !isUw);
    if (bar) bar.classList.toggle('hidden', !isUw);
    if (!isUw) return;

    const depthMeters = Math.max(0, Math.round(UNDERWATER_SURFACE_Y - underwaterSub.pos.y));
    const depthEl = document.getElementById('uw-stat-depth');
    const lmEl = document.getElementById('uw-stat-landmarks');
    const relEl = document.getElementById('uw-stat-relics');
    const ringEl = document.getElementById('uw-stat-rings');
    const foundLm = _landmarks.filter((l) => l.discovered).length;
    const foundRel = _relics.filter((r) => r.collected).length;

    if (depthEl) depthEl.textContent = `${depthMeters}m`;
    if (lmEl) lmEl.textContent = `${foundLm}/${_landmarks.length}`;
    if (relEl) relEl.textContent = `${foundRel}/${_relics.length}`;
    if (ringEl) ringEl.textContent = `${underwaterSub.ringsHitInLap}/${_rings.length}`;

    const surfaceBtn = document.getElementById('uw-surface-btn');
    if (surfaceBtn) {
        surfaceBtn.classList.toggle('ring-2', worldState.nearUnderwaterSurface);
        surfaceBtn.classList.toggle('ring-emerald-300', worldState.nearUnderwaterSurface);
    }
}

export function enterUnderwaterWorld() {
    if (worldState.activeArea !== 'SURFACE' || player.botType !== 'HIGHTIDE') return;
    buildUnderwaterWorld();

    // Preserve High Tide's exact Griffin Rock ocean coordinates
    worldState.savedOceanPos.copy(player.pos);
    worldState.savedOceanHeading = player.heading;
    worldState.savedSurfacePos.copy(player.pos);
    worldState.savedSurfaceHeading = player.heading;
    worldState.activeArea = 'UNDERWATER';
    worldState.nearUnderwaterSurface = false;
    _exitCooldown = 2.0;

    // Default into Submersible Vehicle mode if currently in Bot mode (keep Dino if already Plesiosaur)
    if (player.mode === 'BOT') {
        player.mode = 'VEHICLE';
        player.targetMorph = 1.0;
        player.morph = 1.0;
    }

    // Reparent High Tide rig into underwaterScene
    if (botRigs?.HIGHTIDE?.root) {
        underwaterScene.add(botRigs.HIGHTIDE.root);
    }
    setActiveParticleScene(underwaterScene);

    // Spawn just beneath the sunlit surface looking out toward the trench
    underwaterSub.pos.set(0, 56, 20);
    underwaterSub.vel.set(0, 0, 0);
    underwaterSub.yaw = Math.PI;
    underwaterSub.pitch = -0.08;
    underwaterSub.speed = 0;
    underwaterSub.hasWaypoint = false;
    if (_waypointGroup) _waypointGroup.visible = false;

    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.add('hidden');
    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = 'GRIFFIN ROCK ABYSS — DEEP OCEAN';

    updateUnderwaterHUD();
    if (typeof window.renderMinimap === 'function') window.renderMinimap();
    sfx.playDiveSubmerge();
    showToast(
        'DIVING BENEATH GRIFFIN ROCK!',
        'WASD / Tap to Swim in 3D • E/Q Ascend & Descend • F Sonar Pulse!'
    );
    triggerNPCSpeech(
        'HIGHTIDE',
        'Maritime Rescue Veteran',
        'All hands, dive! Let’s chart the Griffin Rock Triangle, check on the Midgard Lab, and watch out for Dr. Morocco’s tricks!',
        player as unknown as SpeechTarget,
        true
    );
}

export function exitUnderwaterWorld() {
    if (worldState.activeArea !== 'UNDERWATER') return;
    worldState.activeArea = 'SURFACE';
    worldState.nearUnderwaterSurface = false;
    underwaterSub.hasWaypoint = false;
    if (_waypointGroup) _waypointGroup.visible = false;

    if (botRigs?.HIGHTIDE?.root) {
        botRigs.HIGHTIDE.root.rotation.set(0, 0, 0);
        scene.add(botRigs.HIGHTIDE.root);
    }
    setActiveParticleScene(scene);

    // Restore High Tide to the saved ocean position on Griffin Rock
    player.pos.copy(worldState.savedOceanPos);
    player.pos.y = 0.25;
    player.heading = worldState.savedOceanHeading;
    player.speed = 0;
    player.vy = 0;
    player.hasWaypoint = false;
    player.onRailwayTrack = false;

    // Never surface into open ocean stranded in Bot Mode — auto-transform into Submarine / Boat Mode!
    if (player.mode === 'BOT' || (player.botType !== 'HIGHTIDE' && player.mode !== 'VEHICLE')) {
        player.mode = 'VEHICLE';
        player.targetMorph = 1.0;
        player.morph = 1.0;
        player.targetDinoMorph = 0.0;
        player.dinoMorph = 0.0;
        player.targetHiddenMorph = 0.0;
        player.hiddenMorph = 0.0;
        player.targetBoatMorph = player.botType === 'HIGHTIDE' ? 0.0 : 1.0;
        player.boatMorph = player.targetBoatMorph;
    }

    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.remove('hidden');
    updateUnderwaterHUD();
    syncHUDToActiveBot();
    if (typeof window.renderMinimap === 'function') window.renderMinimap();
    sfx.playSurfaceBreach();
    showToast('SURFACED AT GRIFFIN ROCK!', 'Back on the open ocean waves!');
}

export function triggerUnderwaterBoost() {
    if (worldState.activeArea !== 'UNDERWATER') return;
    underwaterSub.boostTimer = 2.6;
    sfx.playEnergyCharge();
    spawnBurstParticles(underwaterSub.pos.x, underwaterSub.pos.y, underwaterSub.pos.z, 0x38bdf8, 12, 1.0);
}

export function triggerUnderwaterSonar() {
    if (worldState.activeArea !== 'UNDERWATER') return;
    underwaterSub.sonarTimer = 1.6;
    sfx.playSonarPing();
    if (_sonarWaveMesh && _sonarWaveMat) {
        _sonarWaveMesh.position.copy(underwaterSub.pos);
        _sonarWaveMesh.scale.setScalar(1);
        _sonarWaveMesh.visible = true;
        _sonarWaveMat.opacity = 0.9;
    }

    // Check if near Dr. Morocco's Sonic Control Buoy!
    if (!_moroccoBuoyDisabled && underwaterSub.pos.distanceTo(MOROCCO_BUOY_POS) < 75) {
        _moroccoBuoyDisabled = true;
        progression.underwaterMoroccoCalmed = true;
        progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 8;
        progression.totalEmergenciesResolved = (progression.totalEmergenciesResolved || 0) + 1;
        saveProgression({ immediate: true });
        if (_moroccoBuoyMat) _moroccoBuoyMat.color.setHex(0x4ade80);
        if (_giantSquidMat) _giantSquidMat.color.setHex(0x06b6d4);
        spawnSparkleGlints(MOROCCO_BUOY_POS.x, MOROCCO_BUOY_POS.y, MOROCCO_BUOY_POS.z, 26);
        sfx.playRankUp();
        showToast('MOROCCO SONIC BUOY DISABLED!', 'The Giant Squid is calm again! +8 Energon & Hero Rescue!');
        triggerNPCSpeech(
            'HIGHTIDE',
            'Maritime Rescue Veteran',
            'Bullseye! That counter-sonar scrambled Dr. Morocco’s buoy—the Giant Squid is swimming free!',
            player as unknown as SpeechTarget,
            true
        );
        return;
    }

    // Spook the Mechanical Shark playfully if nearby
    if (_mechSharkGroup && underwaterSub.pos.distanceTo(_mechSharkGroup.position) < 85) {
        _mechSharkSpookTimer = 4.0;
        showToast('MECHANICAL SHARK PINGED!', 'The tech-eating shark darted away from High Tide’s sonar!');
        return;
    }

    const nearest = getNearestUnderwaterDiscovery();
    if (nearest) {
        showToast('SONAR ECHO DETECTED!', `${nearest.name} — ${Math.round(nearest.dist)}m away!`);
    } else {
        showToast('SONAR PULSE CLEAR!', 'All Griffin Rock deep-sea mysteries discovered!');
    }
}

export function setUnderwaterTouchControl(kind: 'ascend' | 'descend', val: number) {
    if (kind === 'ascend') underwaterSub.touchAscend = val;
    if (kind === 'descend') underwaterSub.touchDescend = val;
}

export function setUnderwaterWaypointWorld(wx: number, wy: number, wz: number) {
    underwaterSub.waypoint.set(wx, wy, wz);
    underwaterSub.hasWaypoint = true;
    if (_waypointGroup) {
        _waypointGroup.position.copy(underwaterSub.waypoint);
        _waypointGroup.visible = true;
    }
}

export function setUnderwaterDestinationFromScreenPoint(clientX: number, clientY: number, playChime = false) {
    if (worldState.activeArea !== 'UNDERWATER') return;
    _ndc.x = (clientX / window.innerWidth) * 2 - 1;
    _ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    _raycaster.setFromCamera(_ndc, camera);
    const ray = _raycaster.ray;

    let bestTarget: THREE.Vector3 | null = null;
    let bestScore = Infinity;

    const consider = (pt: THREE.Vector3, snapRadius: number) => {
        const toPt = _tmpVec.copy(pt).sub(ray.origin);
        const along = toPt.dot(ray.direction);
        if (along < 6 || along > 560) return;
        const distToRay = ray.distanceToPoint(pt);
        if (distToRay < snapRadius && distToRay < bestScore) {
            bestScore = distToRay;
            bestTarget = pt.clone();
        }
    };

    _landmarks.forEach((lm) => consider(new THREE.Vector3(lm.x, lm.y, lm.z), 34));
    _relics.forEach((r) => { if (!r.collected) consider(new THREE.Vector3(r.x, r.y, r.z), 20); });
    _crystals.forEach((c) => { if (!c.collected) consider(new THREE.Vector3(c.x, c.y, c.z), 16); });
    const activeRing = _rings[underwaterSub.activeRingIdx];
    if (activeRing) consider(new THREE.Vector3(activeRing.x, activeRing.y, activeRing.z), 26);
    if (!_moroccoBuoyDisabled) consider(MOROCCO_BUOY_POS, 26);

    if (!bestTarget) {
        bestTarget = ray.origin.clone().addScaledVector(ray.direction, 120);
    }

    const horizR = Math.hypot(bestTarget.x, bestTarget.z);
    if (horizR > UNDERWATER_RADIUS - 25) {
        bestTarget.x *= (UNDERWATER_RADIUS - 25) / horizR;
        bestTarget.z *= (UNDERWATER_RADIUS - 25) / horizR;
    }
    const minFloor = getUnderwaterFloorHeight(bestTarget.x, bestTarget.z) + 4.5;
    bestTarget.y = THREE.MathUtils.clamp(bestTarget.y, minFloor, UNDERWATER_SURFACE_Y - 3.5);

    setUnderwaterWaypointWorld(bestTarget.x, bestTarget.y, bestTarget.z);
    if (playChime && sfx.playWaypointTap) sfx.playWaypointTap();
}

export function getNearestUnderwaterDiscovery(): { name: string; kind: string; x: number; z: number; dist: number; color: string } | null {
    if (worldState.activeArea !== 'UNDERWATER') return null;
    const candidates: Array<{ name: string; kind: string; x: number; z: number; dist: number; color: string }> = [];

    if (!_moroccoBuoyDisabled) {
        candidates.push({
            name: 'Morocco Sonic Buoy (Use Sonar)',
            kind: 'RESCUE',
            x: MOROCCO_BUOY_POS.x,
            z: MOROCCO_BUOY_POS.z,
            dist: underwaterSub.pos.distanceTo(MOROCCO_BUOY_POS),
            color: '#f43f5e'
        });
    }
    _landmarks.forEach((lm) => {
        if (!lm.discovered) {
            candidates.push({
                name: lm.name,
                kind: 'LANDMARK',
                x: lm.x,
                z: lm.z,
                dist: Math.hypot(lm.x - underwaterSub.pos.x, lm.z - underwaterSub.pos.z),
                color: lm.color
            });
        }
    });
    _relics.forEach((r) => {
        if (!r.collected) {
            candidates.push({
                name: r.name,
                kind: 'RELIC',
                x: r.x,
                z: r.z,
                dist: Math.hypot(r.x - underwaterSub.pos.x, r.z - underwaterSub.pos.z),
                color: '#facc15'
            });
        }
    });
    const activeRing = _rings[underwaterSub.activeRingIdx];
    if (activeRing && candidates.length === 0) {
        candidates.push({
            name: `Training Ring ${underwaterSub.activeRingIdx + 1}/${_rings.length}`,
            kind: 'RING',
            x: activeRing.x,
            z: activeRing.z,
            dist: Math.hypot(activeRing.x - underwaterSub.pos.x, activeRing.z - underwaterSub.pos.z),
            color: '#38bdf8'
        });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0];
}

export function updateUnderwater(dt: number, now: number) {
    if (worldState.activeArea !== 'UNDERWATER') return;
    const nowSec = now * 0.001;
    if (_exitCooldown > 0) _exitCooldown -= dt;

    // 1. Read 3D Swim Controls (Keyboard + Touch)
    const fwd = ((isActionActive('forward') || input.keys['KeyW'] || input.keys['ArrowUp']) ? 1 : 0)
        - ((isActionActive('backward') || input.keys['KeyS'] || input.keys['ArrowDown']) ? 1 : 0);
    const turn = ((isActionActive('left') || input.keys['KeyA'] || input.keys['ArrowLeft']) ? 1 : 0)
        - ((isActionActive('right') || input.keys['KeyD'] || input.keys['ArrowRight']) ? 1 : 0);
    const climb = ((isActionActive('secondaryAction') || input.keys['KeyE'] || input.keys['Space']) ? 1 : 0) + underwaterSub.touchAscend
        - (((isActionActive('descendAction') || input.keys['KeyQ'] || input.keys['KeyC']) ? 1 : 0) + underwaterSub.touchDescend);

    if (input.keys['ShiftLeft'] || input.keys['ShiftRight']) {
        if (underwaterSub.boostTimer <= 0.1) triggerUnderwaterBoost();
    }
    if (underwaterSub.boostTimer > 0) underwaterSub.boostTimer = Math.max(0, underwaterSub.boostTimer - dt);

    const hasManualInput = fwd !== 0 || turn !== 0 || climb !== 0;
    if (hasManualInput && underwaterSub.hasWaypoint) {
        underwaterSub.hasWaypoint = false;
        if (_waypointGroup) _waypointGroup.visible = false;
    }

    const maxSpeed = underwaterSub.boostTimer > 0 ? 74 : 44;

    if (underwaterSub.hasWaypoint) {
        const toWp = _tmpVec.copy(underwaterSub.waypoint).sub(underwaterSub.pos);
        const dist = toWp.length();
        if (dist < 7.5) {
            underwaterSub.hasWaypoint = false;
            if (_waypointGroup) _waypointGroup.visible = false;
        } else {
            const desiredYaw = Math.atan2(toWp.x, toWp.z);
            let diff = desiredYaw - underwaterSub.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            underwaterSub.yaw += THREE.MathUtils.clamp(diff, -dt * 2.8, dt * 2.8);
            const targetPitch = THREE.MathUtils.clamp(Math.atan2(toWp.y, Math.hypot(toWp.x, toWp.z)), -0.65, 0.65);
            underwaterSub.pitch = THREE.MathUtils.lerp(underwaterSub.pitch, targetPitch, Math.min(1, dt * 4));
            const moveSpd = Math.min(maxSpeed, Math.max(18, dist * 1.4));
            underwaterSub.vel.copy(toWp.normalize().multiplyScalar(moveSpd));
            underwaterSub.speed = moveSpd;
        }
    } else {
        underwaterSub.yaw += turn * dt * 2.1;
        const targetSpeed = fwd * maxSpeed;
        underwaterSub.speed = THREE.MathUtils.lerp(underwaterSub.speed, targetSpeed, Math.min(1, dt * 4.5));
        const targetPitch = THREE.MathUtils.clamp(climb * 0.45, -0.55, 0.55);
        underwaterSub.pitch = THREE.MathUtils.lerp(underwaterSub.pitch, targetPitch, Math.min(1, dt * 5));

        const dirX = Math.sin(underwaterSub.yaw);
        const dirZ = Math.cos(underwaterSub.yaw);
        underwaterSub.vel.x = dirX * underwaterSub.speed;
        underwaterSub.vel.z = dirZ * underwaterSub.speed;
        underwaterSub.vel.y = THREE.MathUtils.lerp(underwaterSub.vel.y, climb * (underwaterSub.boostTimer > 0 ? 34 : 24), Math.min(1, dt * 5.0));
    }

    // Apply Methane Vent upward thermal buoyancy currents
    for (let i = 0; i < _vents.length; i++) {
        const v = _vents[i];
        const hd = Math.hypot(underwaterSub.pos.x - v.x, underwaterSub.pos.z - v.z);
        if (hd < 12 && underwaterSub.pos.y < v.y + 48) {
            underwaterSub.vel.y += 18 * dt;
        }
        v.plume.scale.set(1 + Math.sin(nowSec * 3.5 + i) * 0.12, 1, 1 + Math.cos(nowSec * 3.5 + i) * 0.12);
    }

    // Integrate Position & Clamp to Ocean Basin
    underwaterSub.pos.addScaledVector(underwaterSub.vel, dt);
    const r = Math.hypot(underwaterSub.pos.x, underwaterSub.pos.z);
    if (r > UNDERWATER_RADIUS - 20) {
        underwaterSub.pos.x *= (UNDERWATER_RADIUS - 20) / r;
        underwaterSub.pos.z *= (UNDERWATER_RADIUS - 20) / r;
    }
    const minY = getUnderwaterFloorHeight(underwaterSub.pos.x, underwaterSub.pos.z) + 3.2;
    if (underwaterSub.pos.y < minY) {
        underwaterSub.pos.y = minY;
        if (underwaterSub.vel.y < 0) underwaterSub.vel.y = 0;
    }
    if (underwaterSub.pos.y > UNDERWATER_SURFACE_Y - 1.5) {
        underwaterSub.pos.y = UNDERWATER_SURFACE_Y - 1.5;
    }

    // Sync High Tide's 3D Rig & Player State
    player.pos.copy(underwaterSub.pos);
    player.heading = underwaterSub.yaw;
    player.speed = Math.abs(underwaterSub.speed);
    player.morph = THREE.MathUtils.lerp(player.morph, player.targetMorph, Math.min(1, dt * 7));
    player.dinoMorph = THREE.MathUtils.lerp(player.dinoMorph, player.targetDinoMorph, Math.min(1, dt * 7));

    const rig = botRigs?.HIGHTIDE;
    if (rig?.root) {
        rig.root.position.copy(underwaterSub.pos);
        rig.root.rotation.order = 'YXZ';
        rig.root.rotation.set(-underwaterSub.pitch, underwaterSub.yaw, -turn * 0.22);
        applyBotRigMorph(rig, player.morph, player.dinoMorph, nowSec * 4, Math.abs(underwaterSub.speed), 0, now, 0, 0, 0, 0);
    }

    // Emit bubble stream behind High Tide when moving
    _bubbleSpawnTimer += dt;
    if ((Math.abs(underwaterSub.speed) > 4 || Math.abs(underwaterSub.vel.y) > 4) && _bubbleSpawnTimer > 0.08) {
        _bubbleSpawnTimer = 0;
        spawnBubble(underwaterSub.pos);
    }

    // Update Bubbles
    for (let i = _bubbles.length - 1; i >= 0; i--) {
        const b = _bubbles[i];
        b.life -= dt;
        if (b.life <= 0 || b.mesh.position.y >= UNDERWATER_SURFACE_Y) {
            underwaterScene.remove(b.mesh);
            _bubbles.splice(i, 1);
        } else {
            b.mesh.position.addScaledVector(b.vel, dt);
        }
    }

    // Animate Expanding Sonar Wave
    if (underwaterSub.sonarTimer > 0 && _sonarWaveMesh && _sonarWaveMat) {
        underwaterSub.sonarTimer = Math.max(0, underwaterSub.sonarTimer - dt);
        const prog = 1 - underwaterSub.sonarTimer / 1.6;
        _sonarWaveMesh.scale.setScalar(1 + prog * 28);
        _sonarWaveMat.opacity = (1 - prog) * 0.85;
        if (underwaterSub.sonarTimer <= 0) _sonarWaveMesh.visible = false;
    }

    // Animate Show Landmarks & Sea Creatures
    if (_triangleAnomalyRing) {
        _triangleAnomalyRing.rotation.z += dt * 1.1;
    }
    if (_moroccoBuoyMesh) {
        _moroccoBuoyMesh.rotation.y += dt * 2.2;
        _moroccoBuoyMesh.position.y += Math.sin(nowSec * 3) * dt * 0.5;
    }
    if (_giantSquidGroup) {
        _giantSquidAngle += dt * (_moroccoBuoyDisabled ? 0.25 : 0.65);
        const sqR = _moroccoBuoyDisabled ? 62 : 34;
        const nx = -165 + Math.cos(_giantSquidAngle) * sqR;
        const nz = -160 + Math.sin(_giantSquidAngle) * sqR;
        const ny = 34 + Math.sin(nowSec * 1.8) * 6;
        _giantSquidGroup.lookAt(nx, ny, nz);
        _giantSquidGroup.position.set(nx, ny, nz);
    }
    if (_mechSharkGroup) {
        if (_mechSharkSpookTimer > 0) _mechSharkSpookTimer -= dt;
        _mechSharkAngle += dt * (_mechSharkSpookTimer > 0 ? 1.45 : 0.48);
        const shR = _mechSharkSpookTimer > 0 ? 95 : 46;
        const sx = -210 + Math.cos(_mechSharkAngle) * shR;
        const sz = 125 + Math.sin(_mechSharkAngle) * shR;
        const sy = 32 + Math.sin(nowSec * 2.1) * 4;
        _mechSharkGroup.lookAt(sx, sy, sz);
        _mechSharkGroup.position.set(sx, sy, sz);
    }
    for (let i = 0; i < _whales.length; i++) {
        const wh = _whales[i];
        wh.angle += dt * wh.speed;
        const wx = Math.cos(wh.angle) * wh.radius;
        const wz = Math.sin(wh.angle) * wh.radius;
        const wy = wh.height + Math.sin(nowSec * 0.9 + i) * 3;
        wh.group.lookAt(wx, wy, wz);
        wh.group.position.set(wx, wy, wz);
    }
    for (let i = 0; i < _kelpStalks.length; i++) {
        const k = _kelpStalks[i];
        k.mesh.rotation.z = Math.sin(nowSec * 1.6 + k.phase) * 0.14;
    }
    if (_waypointGroup && _waypointGroup.visible) {
        _waypointGroup.rotation.y += dt * 2.2;
    }

    // Landmark Discovery Proximity Checks
    for (let i = 0; i < _landmarks.length; i++) {
        const lm = _landmarks[i];
        if (lm.discovered) continue;
        if (Math.hypot(underwaterSub.pos.x - lm.x, underwaterSub.pos.z - lm.z) < 42) {
            lm.discovered = true;
            if (!Array.isArray(progression.underwaterLandmarksFound)) progression.underwaterLandmarksFound = [];
            if (!progression.underwaterLandmarksFound.includes(lm.id)) {
                progression.underwaterLandmarksFound.push(lm.id);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 5;
                saveProgression({ immediate: true });
            }
            sfx.playRelicFound();
            spawnSparkleGlints(lm.x, lm.y, lm.z, 22);
            showToast(`DISCOVERED: ${lm.name.toUpperCase()}!`, `${lm.subtitle} • +5 Energon!`);
            triggerNPCSpeech(lm.speaker, lm.speakerRole, lm.speech, player as unknown as SpeechTarget, true);
        }
    }

    // Deep-Sea Relics Pickup
    for (let i = 0; i < _relics.length; i++) {
        const rel = _relics[i];
        if (rel.collected) continue;
        rel.mesh.rotation.y += dt * 1.8;
        if (underwaterSub.pos.distanceTo(rel.mesh.position) < 10.5) {
            rel.collected = true;
            rel.mesh.visible = false;
            if (!Array.isArray(progression.underwaterRelicsFound)) progression.underwaterRelicsFound = [];
            if (!progression.underwaterRelicsFound.includes(rel.id)) {
                progression.underwaterRelicsFound.push(rel.id);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 6;
                saveProgression({ immediate: true });
            }
            sfx.playRelicFound();
            spawnSparkleGlints(rel.x, rel.y, rel.z, 20);
            showToast('DEEP-SEA RELIC FOUND!', `${rel.name} • +6 Energon!`);
        }
    }

    // Sunken Energon Crystals Pickup
    for (let i = 0; i < _crystals.length; i++) {
        const c = _crystals[i];
        if (c.collected) continue;
        c.mesh.rotation.y += dt * 2.4;
        if (underwaterSub.pos.distanceTo(c.mesh.position) < 9.5) {
            c.collected = true;
            c.mesh.visible = false;
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 2;
            saveProgression();
            sfx.playGemChime();
            spawnSparkleGlints(c.x, c.y, c.z, 10);
        }
    }

    // High Tide's 8-Ring Deep-Sea Rescue Training Course
    const activeRing = _rings[underwaterSub.activeRingIdx];
    if (activeRing) {
        activeRing.mesh.scale.setScalar(1 + Math.sin(nowSec * 4) * 0.08);
        if (underwaterSub.pos.distanceTo(activeRing.mesh.position) < 14.5) {
            activeRing.mat.color.setHex(0x4ade80);
            underwaterSub.ringsHitInLap++;
            underwaterSub.activeRingIdx = (underwaterSub.activeRingIdx + 1) % _rings.length;
            _rings[underwaterSub.activeRingIdx].mat.color.setHex(0xfacc15);
            sfx.playStuntChime();
            spawnSparkleGlints(activeRing.x, activeRing.y, activeRing.z, 14);
            if (underwaterSub.ringsHitInLap >= _rings.length) {
                underwaterSub.ringsHitInLap = 0;
                progression.underwaterRingsCompleted = (progression.underwaterRingsCompleted || 0) + 1;
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 10;
                saveProgression({ immediate: true });
                sfx.playRankUp();
                showToast('HIGH TIDE TRAINING COMPLETE!', 'All 8 Deep-Sea Rescue Rings cleared! +10 Energon!');
                _rings.forEach((rg, idx) => rg.mat.color.setHex(idx === 0 ? 0xfacc15 : 0x38bdf8));
            } else {
                showToast(`RESCUE RING ${underwaterSub.ringsHitInLap}/${_rings.length}!`, 'Follow the golden ring to the next depth!');
            }
        }
    }

    // Surface Breach Auto-Exit when swimming all the way up
    worldState.nearUnderwaterSurface = underwaterSub.pos.y >= SURFACE_BREACH_Y - 5.5;
    if (_exitCooldown <= 0 && underwaterSub.pos.y >= SURFACE_BREACH_Y && (climb > 0 || underwaterSub.vel.y > 4)) {
        exitUnderwaterWorld();
        return;
    }

    // Smooth 3D Chase Camera behind High Tide
    const backX = -Math.sin(underwaterSub.yaw) * 24;
    const backZ = -Math.cos(underwaterSub.yaw) * 24;
    _camGoal.set(
        underwaterSub.pos.x + backX,
        THREE.MathUtils.clamp(underwaterSub.pos.y + 8.5 - underwaterSub.pitch * 10, minY + 2, UNDERWATER_SURFACE_Y - 2),
        underwaterSub.pos.z + backZ
    );
    camera.position.lerp(_camGoal, Math.min(1, dt * 5.5));
    _lookGoal.set(
        underwaterSub.pos.x + Math.sin(underwaterSub.yaw) * 18,
        underwaterSub.pos.y + underwaterSub.pitch * 12,
        underwaterSub.pos.z + Math.cos(underwaterSub.yaw) * 18
    );
    camera.lookAt(_lookGoal);

    updateUnderwaterHUD();
}

export function getUnderwaterMapData() {
    return {
        radius: UNDERWATER_RADIUS,
        surfaceY: UNDERWATER_SURFACE_Y,
        subPos: underwaterSub.pos,
        subHeading: underwaterSub.yaw,
        landmarks: _landmarks.map((l) => ({
            id: l.id, name: l.name, x: l.x, y: l.y, z: l.z, discovered: l.discovered, color: l.color
        })),
        relics: _relics.map((r) => ({
            id: r.id, name: r.name, x: r.x, y: r.y, z: r.z, collected: r.collected
        })),
        crystals: _crystals.map((c) => ({
            x: c.x, y: c.y, z: c.z, collected: c.collected
        })),
        rings: _rings.map((rg) => ({ x: rg.x, y: rg.y, z: rg.z })),
        activeRingIdx: underwaterSub.activeRingIdx,
        moroccoBuoy: {
            x: MOROCCO_BUOY_POS.x,
            y: MOROCCO_BUOY_POS.y,
            z: MOROCCO_BUOY_POS.z,
            disabled: _moroccoBuoyDisabled
        }
    };
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        underwaterScene,
        underwaterSub,
        enterUnderwaterWorld,
        exitUnderwaterWorld,
        triggerUnderwaterSonar,
        triggerUnderwaterBoost,
        setUnderwaterTouchControl,
        setUnderwaterDestinationFromScreenPoint,
        setUnderwaterWaypointWorld,
        getUnderwaterMapData
    });
}

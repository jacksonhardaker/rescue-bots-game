// Space Flight Scene, Prolonged Launch Cinematic & Orbital Activities (worldState.activeArea === 'SPACE')
import * as THREE from 'three';
import { scene, camera, renderer } from '../rendering/scene.js';
import {
    toonGrad3, toonGrad4, matDarkSteel, matChrome,
    matOptimusRed, matOptimusGold, matOptimusBlue,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs, input, worldState } from '../state/gameState.js';
import { progression, saveProgression } from '../progression/progression.js';
import { buildCrashedSpaceshipSigma, type SigmaAnimatedEntry } from './spaceshipSigma.js';
import { swapToMoon, updateMoonHUD } from './moon.js';
import { swapToPlanetSurface, LandablePlanetId } from './planetSurface.js';
import { swapToSaturnRace } from './saturnRace.js';
import { swapToSurface, setSigmaLaunchHandler, updateCavernHUD } from './underground.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';
import { isActionActive } from '../settings/settings.js';

export const spaceScene = new THREE.Scene();
export const launchScene = new THREE.Scene();

export const SPACE_BOUNDS = 460;
export const SPACE_MOON_POS = new THREE.Vector3(0, 45, -320);
export const SPACE_MOON_LANDING_POS = new THREE.Vector3(0, 45, -238);
export const SPACE_STATION_POS = new THREE.Vector3(190, 22, -70);
export const SPACE_MOROCCO_POS = new THREE.Vector3(-195, 38, -165);
export const SPACE_SATURN_RACE_GATE_POS = new THREE.Vector3(185, 38, -165);

interface MoroccoRelay {
    group: THREE.Group;
    beam: THREE.Mesh;
    pos: THREE.Vector3;
    angle: number;
    hp: number;
    alive: boolean;
}

const _moroccoStation = {
    group: null as THREE.Group | null,
    dishPivot: null as THREE.Group | null,
    shieldDome: null as THREE.Mesh | null,
    coreMat: null as THREE.MeshBasicMaterial | null,
    pos: SPACE_MOROCCO_POS.clone(),
    hp: 6,
    maxHp: 6,
    defeated: false,
    relays: [] as MoroccoRelay[]
};

export function buildAutobotOrbitalStationMesh(): THREE.Group {
    const stationGroup = new THREE.Group();
    const stCore = new THREE.Mesh(new THREE.CylinderGeometry(12, 14, 28, 12), matChrome);
    const stRing = new THREE.Mesh(new THREE.TorusGeometry(26, 3.2, 10, 28).rotateX(Math.PI / 2), matOptimusBlue);
    const stTrim = new THREE.Mesh(new THREE.TorusGeometry(26, 3.4, 8, 28).rotateX(Math.PI / 2), matOptimusRed);
    stTrim.scale.set(1, 0.32, 1);
    const stBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(5.5, 14, 12),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 })
    );
    stBeacon.position.y = 18;
    const dockRing = new THREE.Mesh(
        new THREE.TorusGeometry(36, 0.9, 8, 36).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.72 })
    );
    stationGroup.add(stCore, stRing, stTrim, stBeacon, dockRing);
    applyCartoonInkOutlines(stCore, 1.03, true);
    return stationGroup;
}

export function buildOrbitalSatelliteMesh(repaired = false): { group: THREE.Group; beaconMat: THREE.MeshBasicMaterial } {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.5, 10), matChrome);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4.2), matOptimusBlue);
    wingL.position.x = -9.5;
    const wingR = wingL.clone();
    wingR.position.x = 9.5;
    const beaconMat = new THREE.MeshBasicMaterial({ color: repaired ? 0x22d3ee : 0xef4444 });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 10), beaconMat);
    beacon.position.y = 5.4;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.45, 8, 24), beaconMat);
    g.add(body, wingL, wingR, beacon, halo);
    applyCartoonInkOutlines(body, 1.04, true);
    return { group: g, beaconMat };
}

export function buildStrandedPodMesh(): THREE.Group {
    const g = new THREE.Group();
    const capsule = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 7.5, 10), matOptimusRed);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), matChrome);
    cap.position.y = 3.8;
    const beacon = new THREE.Mesh(
        new THREE.TorusGeometry(5.2, 0.38, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    g.add(capsule, cap, beacon);
    applyCartoonInkOutlines(capsule, 1.04, true);
    return g;
}

export function buildMoroccoOrbitalStationMesh() {
    const root = new THREE.Group();
    const matMoroccoPlum = new THREE.MeshToonMaterial({ color: 0x3b0764, gradientMap: toonGrad3 });
    const matMoroccoBrass = new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad3 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });

    // Victorian Steampunk Fortress Core & Spires
    const body = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 26, 10), matMoroccoPlum);
    const spireTop = new THREE.Mesh(new THREE.ConeGeometry(8.5, 14, 10), matMoroccoBrass);
    spireTop.position.y = 20;
    const spireBot = new THREE.Mesh(new THREE.ConeGeometry(7.5, 12, 10).rotateX(Math.PI), matMoroccoBrass);
    spireBot.position.y = -19;
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(22, 2.6, 10, 24).rotateX(Math.PI / 2), matMoroccoPlum);
    const ringBrass = new THREE.Mesh(new THREE.TorusGeometry(22, 2.8, 8, 24).rotateX(Math.PI / 2), matMoroccoBrass);
    ringBrass.scale.set(1, 0.35, 1);

    const verneCore = new THREE.Mesh(new THREE.OctahedronGeometry(6.5, 1), coreMat);
    const shieldDome = new THREE.Mesh(
        new THREE.SphereGeometry(18.5, 20, 16),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.25, wireframe: true })
    );

    // Rotating Verne Laser Dish + Sweeping Purple Beam
    const dishPivot = new THREE.Group();
    dishPivot.position.y = 4;
    const dish = new THREE.Mesh(new THREE.ConeGeometry(5.5, 3.2, 12, 1, true).rotateX(Math.PI / 2), matMoroccoBrass);
    dish.position.z = 13.5;
    const laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 2.8, 72, 10, 1, true).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false })
    );
    laserBeam.position.z = 49.5;
    dishPivot.add(dish, laserBeam);

    root.add(body, spireTop, spireBot, ringOuter, ringBrass, verneCore, shieldDome, dishPivot);
    applyCartoonInkOutlines(body, 1.03, true);
    return { root, dishPivot, shieldDome, coreMat };
}

interface AsteroidItem {
    mesh: THREE.Mesh;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    rotVel: THREE.Vector3;
    radius: number;
    hp: number;
    alive: boolean;
    respawnTimer: number;
}

interface LaserBolt {
    mesh: THREE.Mesh;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
}

interface SpaceBurst {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
}

interface OrbitalSatellite {
    id: string;
    name: string;
    group: THREE.Group;
    beaconMat: THREE.MeshBasicMaterial;
    pos: THREE.Vector3;
    repaired: boolean;
    repairProgress: number;
}

interface StrandedPod {
    id: string;
    name: string;
    group: THREE.Group;
    pos: THREE.Vector3;
    towed: boolean;
    rescued: boolean;
}

interface StarRing {
    mesh: THREE.Mesh;
    innerMesh: THREE.Mesh;
    pos: THREE.Vector3;
    mat: THREE.MeshBasicMaterial;
}

interface SpaceComet {
    group: THREE.Group;
    pos: THREE.Vector3;
    orbitRadius: number;
    orbitSpeed: number;
    angle: number;
    yBase: number;
    cooldown: number;
}

// Space Flight Player Ship State
export const sigmaShip = {
    pos: new THREE.Vector3(0, 24, 110),
    yaw: 0,      // 0 faces -Z toward the Moon
    pitch: 0,
    roll: 0,
    speed: 0,
    boostTimer: 0,
    fireCooldown: 0,
    towedPod: null as StrandedPod | null,
    activeRingIdx: 0,
    ringsHitInLap: 0,
    waypoint: new THREE.Vector3(0, 24, 110),
    hasWaypoint: false
};

// Space Scene Objects
let _spaceBuilt = false;
let _launchBuilt = false;
let _spaceSigmaRoot: THREE.Group | null = null;
let _launchSigmaRoot: THREE.Group | null = null;
let _launchSkyColor = new THREE.Color(0x0f172a);
let _launchSpeedLines: THREE.Group | null = null;
let _launchCloudRings: THREE.Group[] = [];
let _launchShockRing: THREE.Mesh | null = null;
let _launchEarthDisk: THREE.Mesh | null = null;
let _launchStars: THREE.Points | null = null;

let _spaceStationPivot: THREE.Object3D | null = null;
let _spaceEarthGroup: THREE.Group | null = null;
let _spaceEarthMesh: THREE.Mesh | null = null;
let _spaceMoonGroup: THREE.Group | null = null;
let _spaceMoonBeaconRing: THREE.Mesh | null = null;
let _tractorBeamMesh: THREE.Mesh | null = null;
let _spaceWaypointGroup: THREE.Group | null = null;
let _spaceWaypointLockedToTarget = false;
let _solarHubHandler: (() => void) | null = null;

export type SpaceSectorId = 'MOON_ORBIT' | 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE';

interface SectorMoonRuntime {
    id: string;
    name: string;
    pos: THREE.Vector3;
    landingPos: THREE.Vector3;
    radius: number;
    landablePlanetId: LandablePlanetId | null;
    group: THREE.Group;
    beaconRing: THREE.Mesh | null;
}

let _activeSectorId: SpaceSectorId = 'MOON_ORBIT';
let _sectorBackdropGroup: THREE.Group | null = null;
let _giantBackdropPos = new THREE.Vector3(0, -290, 130);
let _giantBackdropRadius = 185;
let _gasWarningCooldown = 0;
const _sectorMoons: SectorMoonRuntime[] = [];

export function setSolarHubHandler(fn: () => void) {
    _solarHubHandler = fn;
}

export function openSolarSystemHub() {
    if (_solarHubHandler) {
        _solarHubHandler();
    }
}
const _spaceRaycaster = new THREE.Raycaster();
const _spacePointerNDC = new THREE.Vector2();

const _spaceAnimated: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];
const _asteroids: AsteroidItem[] = [];
const _laserBolts: LaserBolt[] = [];
const _bursts: SpaceBurst[] = [];
const _satellites: OrbitalSatellite[] = [];
const _pods: StrandedPod[] = [];
const _starRings: StarRing[] = [];
const _comets: SpaceComet[] = [];

// Touch / Button Inputs for Space Flight
const _spaceTouch = {
    fire: false,
    boost: false,
    climb: 0,
    beam: false
};

const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _tmpForward = new THREE.Vector3();
const _tmpRight = new THREE.Vector3();
const _tmpCamGoal = new THREE.Vector3();
const _tmpLookGoal = new THREE.Vector3();

function createStarfieldPoints(count: number, minR: number, maxR: number, size = 2.6): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = minR + Math.random() * (maxR - minR);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi);
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        const cPick = Math.random();
        const col = cPick < 0.18
            ? new THREE.Color(0x7dd3fc)
            : (cPick < 0.32 ? new THREE.Color(0xfef08a) : (cPick < 0.4 ? new THREE.Color(0xc084fc) : new THREE.Color(0xffffff)));
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(
        geo,
        new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: 0.95, fog: false })
    );
}

function createEarthTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.ellipse(120, 105, 62, 42, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(310, 120, 82, 50, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(230, 185, 45, 26, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(440, 92, 42, 32, 0.4, 0, Math.PI * 2); ctx.fill();

    // Griffin Rock glowing cyan dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(256, 118, 7, 0, Math.PI * 2); ctx.fill();

    // Polar caps & cloud streaks
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillRect(0, 0, 512, 20);
    ctx.fillRect(0, 236, 512, 20);
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.ellipse((i * 57) % 512, 45 + (i * 19) % 165, 44 + (i % 3) * 18, 7, 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(c);
}

function createMoonSphereTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 60; i++) {
        const x = (i * 89) % 512;
        const y = 24 + ((i * 53) % 208);
        const r = 8 + (i % 18);
        ctx.fillStyle = i % 2 === 0 ? '#94a3b8' : '#64748b';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r * 0.92, 0, Math.PI * 2); ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
}

function buildLaunchScene() {
    if (_launchBuilt) return;
    _launchBuilt = true;

    launchScene.background = _launchSkyColor;
    launchScene.add(new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 1.0));
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sun.position.set(80, 120, 90);
    launchScene.add(sun);

    _launchStars = createStarfieldPoints(900, 140, 340, 2.4);
    (_launchStars.material as THREE.PointsMaterial).opacity = 0;
    launchScene.add(_launchStars);

    // Starship Sigma centered in launch scene, pitched straight up along +Y
    const animDummy: SigmaAnimatedEntry[] = [];
    _launchSigmaRoot = buildCrashedSpaceshipSigma(launchScene, animDummy, null, {
        originX: 0,
        originZ: 0,
        includeDiorama: false,
        flatLevel: true
    });
    if (_launchSigmaRoot.userData?.sigmaControl) {
        _launchSigmaRoot.userData.sigmaControl.setRepairStage(3);
        _launchSigmaRoot.userData.sigmaControl.setThrusterPower(1.8, true);
        _launchSigmaRoot.userData.sigmaControl.launchPadRing.visible = false;
    }

    // Expanding Mach Shockwave Cone around nose
    _launchShockRing = new THREE.Mesh(
        new THREE.TorusGeometry(9.5, 0.55, 10, 32).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.0 })
    );
    launchScene.add(_launchShockRing);

    // Rushing Cloud & Atmosphere Rings
    _launchCloudRings = [];
    for (let i = 0; i < 6; i++) {
        const ring = new THREE.Group();
        for (let p = 0; p < 8; p++) {
            const ang = (p / 8) * Math.PI * 2 + i * 0.4;
            const puff = new THREE.Mesh(
                new THREE.DodecahedronGeometry(6.5 + (p % 3) * 2.4, 0),
                new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.55 })
            );
            puff.position.set(Math.cos(ang) * (24 + (p % 2) * 8), 0, Math.sin(ang) * (24 + (p % 2) * 8));
            ring.add(puff);
        }
        ring.position.y = 45 + i * 32;
        launchScene.add(ring);
        _launchCloudRings.push(ring);
    }

    // High-speed Vertical Star/Air Streak Lines
    _launchSpeedLines = new THREE.Group();
    const streakMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2;
        const r = 16 + (i % 5) * 7.5;
        const streak = new THREE.Mesh(new THREE.BoxGeometry(0.28, 12 + (i % 4) * 5, 0.28), streakMat);
        streak.position.set(Math.cos(ang) * r, (i * 9) % 140 - 60, Math.sin(ang) * r);
        _launchSpeedLines.add(streak);
    }
    launchScene.add(_launchSpeedLines);

    // Glowing Curved Earth Horizon Below During Orbital Insertion
    _launchEarthDisk = new THREE.Mesh(
        new THREE.SphereGeometry(120, 28, 20),
        new THREE.MeshBasicMaterial({ map: createEarthTexture() })
    );
    _launchEarthDisk.position.set(0, -170, 0);
    launchScene.add(_launchEarthDisk);
}

function spawnSpaceBurst(pos: THREE.Vector3, colorHex: number, count = 12) {
    const geo = new THREE.DodecahedronGeometry(1.1, 0);
    for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(pos);
        const v = new THREE.Vector3(
            (Math.random() - 0.5) * 44,
            (Math.random() - 0.5) * 44,
            (Math.random() - 0.5) * 44
        );
        spaceScene.add(m);
        _bursts.push({ mesh: m, vel: v, life: 0.75 + Math.random() * 0.4, maxLife: 1.15 });
    }
}

function buildSpaceWorld() {
    if (_spaceBuilt) return;
    _spaceBuilt = true;

    spaceScene.background = new THREE.Color(0x030712);
    spaceScene.add(new THREE.HemisphereLight(0x93c5fd, 0x1e1b4b, 0.95));
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sun.position.set(220, 180, 160);
    spaceScene.add(sun);

    // 360 Starfield
    spaceScene.add(createStarfieldPoints(1600, 480, 760, 3.0));

    // Subtle Nebula Glow Ribbons in Deep Background
    const nebMat1 = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
    const nebMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
    const neb1 = new THREE.Mesh(new THREE.RingGeometry(360, 490, 48), nebMat1);
    neb1.rotation.set(0.6, 0.2, 0.3);
    const neb2 = new THREE.Mesh(new THREE.RingGeometry(390, 520, 48), nebMat2);
    neb2.rotation.set(-0.5, 0.8, -0.4);
    spaceScene.add(neb1, neb2);

    // Planet Earth Below (with Griffin Rock Orbital Beacon)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -290, 130);
    _spaceEarthMesh = new THREE.Mesh(
        new THREE.SphereGeometry(185, 36, 24),
        new THREE.MeshBasicMaterial({ map: createEarthTexture() })
    );
    const earthAtmo = new THREE.Mesh(
        new THREE.SphereGeometry(194, 32, 20),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, side: THREE.BackSide })
    );
    earthGroup.add(_spaceEarthMesh, earthAtmo);
    _spaceEarthGroup = earthGroup;
    spaceScene.add(earthGroup);

    // Sculpted Moon Ahead + Glowing Lunar Landing Zone Ring
    const moonGroup = new THREE.Group();
    moonGroup.position.copy(SPACE_MOON_POS);
    const moonSphere = new THREE.Mesh(
        new THREE.SphereGeometry(62, 32, 24),
        new THREE.MeshToonMaterial({ color: 0xe2e8f0, map: createMoonSphereTexture(), gradientMap: toonGrad4 })
    );
    moonGroup.add(moonSphere);
    _spaceMoonGroup = moonGroup;
    spaceScene.add(moonGroup);

    // Lunar Landing Zone Beacon Ring (fly into it or click LAND ON MOON!)
    _spaceMoonBeaconRing = new THREE.Mesh(
        new THREE.TorusGeometry(22, 1.35, 10, 36),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    _spaceMoonBeaconRing.position.copy(SPACE_MOON_LANDING_POS);
    const landingInner = new THREE.Mesh(
        new THREE.RingGeometry(15, 20, 32),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    _spaceMoonBeaconRing.add(landingInner);
    spaceScene.add(_spaceMoonBeaconRing);

    // Autobot Orbital Station (Drop-off Hub for Stranded Rescue Pods)
    const stationGroup = buildAutobotOrbitalStationMesh();
    stationGroup.position.copy(SPACE_STATION_POS);
    _spaceStationPivot = stationGroup;
    spaceScene.add(stationGroup);

    // Dr. Morocco's Orbital Laser Station Boss Encounter (-195, 38, -165)
    const mBuilt = buildMoroccoOrbitalStationMesh();
    mBuilt.root.position.copy(SPACE_MOROCCO_POS);
    spaceScene.add(mBuilt.root);
    _moroccoStation.group = mBuilt.root;
    _moroccoStation.dishPivot = mBuilt.dishPivot;
    _moroccoStation.shieldDome = mBuilt.shieldDome;
    _moroccoStation.coreMat = mBuilt.coreMat;
    _moroccoStation.pos.copy(SPACE_MOROCCO_POS);
    _moroccoStation.hp = 6;
    _moroccoStation.maxHp = 6;
    _moroccoStation.defeated = false;
    _moroccoStation.relays = [];

    const relayBeamMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55 });
    for (let r = 0; r < 3; r++) {
        const ang = (r / 3) * Math.PI * 2;
        const rg = new THREE.Group();
        const rCore = new THREE.Mesh(
            new THREE.OctahedronGeometry(3.8, 0),
            new THREE.MeshBasicMaterial({ color: 0xe879f9 })
        );
        const rRing = new THREE.Mesh(
            new THREE.TorusGeometry(5.4, 0.5, 8, 20),
            new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad3 })
        );
        rg.add(rCore, rRing);
        const rPos = new THREE.Vector3(
            SPACE_MOROCCO_POS.x + Math.cos(ang) * 38,
            SPACE_MOROCCO_POS.y + (r - 1) * 8,
            SPACE_MOROCCO_POS.z + Math.sin(ang) * 38
        );
        rg.position.copy(rPos);
        spaceScene.add(rg);

        const beamGeo = new THREE.CylinderGeometry(0.45, 0.45, 38, 6).rotateX(Math.PI / 2);
        const beamMesh = new THREE.Mesh(beamGeo, relayBeamMat);
        spaceScene.add(beamMesh);

        _moroccoStation.relays.push({
            group: rg,
            beam: beamMesh,
            pos: rPos,
            angle: ang,
            hp: 2,
            alive: true
        });
    }

    // Player-Piloted Starship Sigma (scaled cleanly for space combat/flight)
    _spaceSigmaRoot = buildCrashedSpaceshipSigma(spaceScene, _spaceAnimated, null, {
        originX: 0,
        originZ: 0,
        includeDiorama: false,
        flatLevel: true
    });
    _spaceSigmaRoot.scale.setScalar(0.55);
    if (_spaceSigmaRoot.userData?.sigmaControl) {
        _spaceSigmaRoot.userData.sigmaControl.setRepairStage(3);
        _spaceSigmaRoot.userData.sigmaControl.setThrusterPower(0.85, false);
        _spaceSigmaRoot.userData.sigmaControl.launchPadRing.visible = false;
    }

    // Glowing Cyan Tractor / Repair Beam (dynamically stretched between Sigma and target)
    const beamGeo = new THREE.CylinderGeometry(0.65, 2.2, 1, 10, 1, true);
    beamGeo.translate(0, 0.5, 0);
    beamGeo.rotateX(Math.PI / 2);
    _tractorBeamMesh = new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
    );
    _tractorBeamMesh.visible = false;
    spaceScene.add(_tractorBeamMesh);

    // 3D Tap-to-Fly Holographic Space Waypoint Reticle (iPad & Mouse Tap Controls)
    _spaceWaypointGroup = new THREE.Group();
    const wpRingOuter = new THREE.Mesh(
        new THREE.TorusGeometry(6.8, 0.45, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 })
    );
    const wpRingInner = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.3, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 })
    );
    const wpCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.5, 0),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    _spaceWaypointGroup.add(wpRingOuter, wpRingInner, wpCore);
    _spaceWaypointGroup.visible = false;
    spaceScene.add(_spaceWaypointGroup);

    // Activity 1: 14 Drifting Magma-Veined Asteroids
    _asteroids.length = 0;
    const astMat = new THREE.MeshToonMaterial({ color: 0x78716c, gradientMap: toonGrad3 });
    const astCoreMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    for (let i = 0; i < 14; i++) {
        const radius = 5.5 + (i % 4) * 2.2;
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), astMat);
        const vein = new THREE.Mesh(new THREE.OctahedronGeometry(radius * 0.78, 0), astCoreMat);
        mesh.add(vein);
        applyCartoonInkOutlines(mesh, 1.04, true);

        const ang = (i / 14) * Math.PI * 2;
        const dist = 120 + (i % 3) * 70;
        const pos = new THREE.Vector3(Math.cos(ang) * dist, (i % 5 - 2) * 26, -60 + Math.sin(ang) * dist);
        mesh.position.copy(pos);
        spaceScene.add(mesh);

        _asteroids.push({
            mesh,
            pos,
            vel: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 14),
            rotVel: new THREE.Vector3(0.4 + Math.random() * 0.8, 0.4 + Math.random() * 0.8, 0.3),
            radius,
            hp: 2,
            alive: true,
            respawnTimer: 0
        });
    }

    // Activity 2A: 3 Malfunctioning Dr. Greene Satellites
    _satellites.length = 0;
    const satDefs = [
        { id: 'SAT_WEATHER', name: 'Griffin Weather Sat-1', pos: new THREE.Vector3(-145, 34, -40) },
        { id: 'SAT_COMMS', name: 'Autobot Relay Sat-2', pos: new THREE.Vector3(115, 58, -195) },
        { id: 'SAT_SOLAR', name: 'Dr. Greene Solar Sat-3', pos: new THREE.Vector3(-125, -18, -210) }
    ];
    satDefs.forEach(def => {
        const { group: g, beaconMat } = buildOrbitalSatelliteMesh(false);
        g.position.copy(def.pos);
        spaceScene.add(g);
        _satellites.push({
            id: def.id,
            name: def.name,
            group: g,
            beaconMat,
            pos: def.pos.clone(),
            repaired: false,
            repairProgress: 0
        });
    });

    // Activity 2B: 2 Stranded Orbital Rescue Pods (Tow to Autobot Orbital Station!)
    _pods.length = 0;
    const podDefs = [
        { id: 'POD_ALPHA', name: 'Stranded Probe Alpha', pos: new THREE.Vector3(-85, 12, 15) },
        { id: 'POD_BETA', name: 'Stranded Probe Beta', pos: new THREE.Vector3(65, -24, -140) }
    ];
    podDefs.forEach(def => {
        const g = buildStrandedPodMesh();
        g.position.copy(def.pos);
        spaceScene.add(g);
        _pods.push({
            id: def.id,
            name: def.name,
            group: g,
            pos: def.pos.clone(),
            towed: false,
            rescued: false
        });
    });

    // Activity 3: 8-Ring Star-Slalom Boost Course Looping Around Orbit
    _starRings.length = 0;
    const ringPoints: Array<[number, number, number]> = [
        [0, 26, 20],
        [-58, 34, -55],
        [-105, 42, -145],
        [-52, 54, -225],
        [45, 58, -220],
        [118, 42, -150],
        [102, 26, -40],
        [52, 22, 48]
    ];
    ringPoints.forEach(([rx, ry, rz], idx) => {
        const mat = new THREE.MeshBasicMaterial({
            color: idx === 0 ? 0xfbbf24 : 0x22d3ee,
            transparent: true,
            opacity: idx === 0 ? 0.95 : 0.45
        });
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(15, 1.1, 10, 32), mat);
        mesh.position.set(rx, ry, rz);
        const nextPt = ringPoints[(idx + 1) % ringPoints.length];
        mesh.lookAt(nextPt[0], nextPt[1], nextPt[2]);

        const innerMesh = new THREE.Mesh(
            new THREE.TorusGeometry(11.5, 0.35, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
        );
        mesh.add(innerMesh);
        spaceScene.add(mesh);

        _starRings.push({
            mesh,
            innerMesh,
            pos: new THREE.Vector3(rx, ry, rz),
            mat
        });
    });

    // Activity 4: 3 Orbiting Energon Comets (Chase & Catch for +3 Energon!)
    _comets.length = 0;
    for (let ci = 0; ci < 3; ci++) {
        const cg = new THREE.Group();
        const head = new THREE.Mesh(
            new THREE.OctahedronGeometry(4.6, 1),
            new THREE.MeshBasicMaterial({ color: ci % 2 === 0 ? 0x22d3ee : 0xfde047 })
        );
        const tail = new THREE.Mesh(
            new THREE.ConeGeometry(3.8, 22, 10).rotateX(Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.48 })
        );
        tail.position.z = -12;
        cg.add(head, tail);
        spaceScene.add(cg);
        _comets.push({
            group: cg,
            pos: new THREE.Vector3(),
            orbitRadius: 155 + ci * 55,
            orbitSpeed: 0.24 + ci * 0.06,
            angle: ci * 2.1,
            yBase: -12 + ci * 28,
            cooldown: 0
        });
    }
}

function repositionStarRingsForSector(sectorId: SpaceSectorId) {
    if (_starRings.length < 8) return;
    const layouts: Record<SpaceSectorId, Array<[number, number, number]>> = {
        MOON_ORBIT: [
            [0, 26, 20], [-58, 34, -55], [-105, 42, -145], [-52, 54, -225],
            [45, 58, -220], [118, 42, -150], [102, 26, -40], [52, 22, 48]
        ],
        JUPITER: [
            [0, 28, 30], [-105, 42, -45], [-165, 52, -135], [-92, 54, -225],
            [0, 52, -238], [115, 58, -195], [165, 48, -110], [82, 30, 15]
        ],
        SATURN: [
            [0, 28, 32], [-100, 40, -45], [-155, 50, -130], [-85, 56, -215],
            [15, 54, -230], [115, 52, -185], [150, 44, -95], [78, 28, 18]
        ],
        URANUS: [
            [0, 28, 35], [-68, 56, -40], [-125, 84, -125], [-54, 70, -210],
            [48, 35, -225], [122, 12, -135], [88, 18, -35], [40, 22, 55]
        ],
        NEPTUNE: [
            [0, 25, 40], [-95, 36, -35], [-135, 58, -130], [-65, 76, -220],
            [65, 68, -215], [135, 44, -125], [96, 22, -20], [42, 20, 62]
        ]
    };
    const pts = layouts[sectorId] || layouts.MOON_ORBIT;
    for (let i = 0; i < _starRings.length; i++) {
        const pt = pts[i % pts.length];
        const nextPt = pts[(i + 1) % pts.length];
        _starRings[i].pos.set(pt[0], pt[1], pt[2]);
        _starRings[i].mesh.position.copy(_starRings[i].pos);
        _starRings[i].mesh.lookAt(nextPt[0], nextPt[1], nextPt[2]);
    }
    sigmaShip.activeRingIdx = 0;
    sigmaShip.ringsHitInLap = 0;
}

export function setLaunchBanner(visible: boolean, title = '', subtitle = '') {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('space-launch-banner');
    const titleEl = document.getElementById('space-launch-title');
    const subEl = document.getElementById('space-launch-sub');
    if (!el) return;
    if (visible) {
        el.classList.remove('hidden');
        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = subtitle;
    } else {
        el.classList.add('hidden');
    }
}

function createGiantTexture(kind: 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE'): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    if (kind === 'JUPITER') {
        const bands = ['#c2410c', '#fef3c7', '#d97706', '#fde68a', '#9a3412', '#fef9c3', '#b45309', '#fed7aa', '#7c2d12'];
        bands.forEach((col, i) => {
            ctx.fillStyle = col;
            ctx.fillRect(0, (i / bands.length) * 256, 512, 256 / bands.length + 2);
        });
        // Great Red Spot
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.ellipse(290, 152, 48, 26, -0.06, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(290, 152, 52, 30, -0.06, 0, Math.PI * 2); ctx.stroke();
    } else if (kind === 'SATURN') {
        const bands = ['#a16207', '#fef08a', '#eab308', '#fde047', '#ca8a04', '#fef9c3', '#b45309'];
        bands.forEach((col, i) => {
            ctx.fillStyle = col;
            ctx.fillRect(0, (i / bands.length) * 256, 512, 256 / bands.length + 2);
        });
    } else if (kind === 'URANUS') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#a5f3fc');
        grad.addColorStop(0.5, '#22d3ee');
        grad.addColorStop(1, '#0891b2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(0, 72, 512, 18);
        ctx.fillRect(0, 168, 512, 14);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#1d4ed8');
        grad.addColorStop(0.5, '#2563eb');
        grad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = 'rgba(147,197,253,0.35)';
        ctx.fillRect(0, 62, 512, 14);
        ctx.fillRect(0, 175, 512, 18);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.ellipse(220, 134, 38, 20, 0, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(c);
}

let _saturnRaceGateGroup: THREE.Group | null = null;
let _saturnRaceRingMesh: THREE.Mesh | null = null;
let _nearSaturnRaceGate = false;

function configureSpaceSector(sectorId: SpaceSectorId) {
    _activeSectorId = sectorId;
    worldState.activeSpaceSector = sectorId;
    _nearSaturnRaceGate = false;
    const isMoonOrbit = sectorId === 'MOON_ORBIT';

    if (_spaceEarthGroup) _spaceEarthGroup.visible = isMoonOrbit;
    if (_spaceMoonGroup) _spaceMoonGroup.visible = isMoonOrbit;
    if (_spaceMoonBeaconRing) _spaceMoonBeaconRing.visible = isMoonOrbit;
    if (_moroccoStation.group) _moroccoStation.group.visible = isMoonOrbit;
    _moroccoStation.relays.forEach(r => {
        r.group.visible = isMoonOrbit && r.alive;
        r.beam.visible = isMoonOrbit && r.alive;
    });

    // Clear previous giant backdrop & moons
    if (_sectorBackdropGroup) {
        spaceScene.remove(_sectorBackdropGroup);
        _sectorBackdropGroup = null;
    }
    _saturnRaceGateGroup = null;
    _saturnRaceRingMesh = null;
    _sectorMoons.length = 0;

    if (isMoonOrbit) {
        repositionStarRingsForSector(sectorId);
        return;
    }

    repositionStarRingsForSector(sectorId);

    _sectorBackdropGroup = new THREE.Group();
    spaceScene.add(_sectorBackdropGroup);

    const addSectorMoon = (
        id: string,
        name: string,
        pos: THREE.Vector3,
        radius: number,
        color: number,
        landablePlanetId: LandablePlanetId | null
    ) => {
        const mg = new THREE.Group();
        mg.position.copy(pos);
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 28, 22),
            new THREE.MeshToonMaterial({ color, map: createMoonSphereTexture(), gradientMap: toonGrad4 })
        );
        mg.add(sphere);

        // Landing beacon ring if this moon is landable!
        let beaconRing: THREE.Mesh | null = null;
        const landingPos = pos.clone().add(new THREE.Vector3(0, 0, radius + 22));
        if (landablePlanetId) {
            beaconRing = new THREE.Mesh(
                new THREE.TorusGeometry(19, 1.25, 10, 32),
                new THREE.MeshBasicMaterial({ color: 0x22d3ee })
            );
            beaconRing.position.copy(landingPos);
            const inner = new THREE.Mesh(
                new THREE.RingGeometry(13, 17, 28),
                new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
            );
            beaconRing.add(inner);
            _sectorBackdropGroup!.add(beaconRing);
        }

        _sectorBackdropGroup!.add(mg);
        _sectorMoons.push({ id, name, pos: pos.clone(), landingPos, radius, landablePlanetId, group: mg, beaconRing });
    };

    if (sectorId === 'JUPITER') {
        // Massive banded Jupiter looming below/ahead (unlandable gas giant!)
        _giantBackdropPos.set(0, -295, -80);
        _giantBackdropRadius = 215;
        const jup = new THREE.Mesh(
            new THREE.SphereGeometry(_giantBackdropRadius, 42, 32),
            new THREE.MeshBasicMaterial({ map: createGiantTexture('JUPITER') })
        );
        jup.position.copy(_giantBackdropPos);
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(_giantBackdropRadius + 10, 32, 24),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.16, side: THREE.BackSide })
        );
        halo.position.copy(_giantBackdropPos);
        _sectorBackdropGroup.add(jup, halo);

        // Populate with Jupiter's 4 iconic Galilean Moons (Io, Europa Water Planet & Ganymede are landable!)
        addSectorMoon('IO', 'Io (Volcanic Moon)', new THREE.Vector3(-210, 48, -140), 34, 0xfde047, 'IO');
        addSectorMoon('EUROPA', 'Europa (Water Planet)', new THREE.Vector3(0, 45, -295), 42, 0x38bdf8, 'EUROPA');
        addSectorMoon('GANYMEDE', 'Ganymede (Giant Moon)', new THREE.Vector3(215, 56, -180), 48, 0xcbd5e1, 'GANYMEDE');
        addSectorMoon('CALLISTO', 'Callisto (Crater Moon)', new THREE.Vector3(-165, 22, 130), 38, 0x94a3b8, null);
    } else if (sectorId === 'SATURN') {
        // Giant golden-amber ringed Saturn backdrop
        _giantBackdropPos.set(0, -290, -105);
        _giantBackdropRadius = 185;
        const sat = new THREE.Mesh(
            new THREE.SphereGeometry(_giantBackdropRadius, 36, 28),
            new THREE.MeshBasicMaterial({ map: createGiantTexture('SATURN') })
        );
        sat.position.copy(_giantBackdropPos);
        const outerRing = new THREE.Mesh(
            new THREE.RingGeometry(230, 345, 72),
            new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
        );
        outerRing.position.copy(_giantBackdropPos);
        outerRing.rotation.set(Math.PI * 0.44, 0.12, -0.1);
        const innerRing = new THREE.Mesh(
            new THREE.RingGeometry(205, 226, 64),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
        );
        innerRing.position.copy(_giantBackdropPos);
        innerRing.rotation.copy(outerRing.rotation);
        _sectorBackdropGroup.add(sat, outerRing, innerRing);

        // Saturn's giant hazy amber moon Titan (Landable!)
        addSectorMoon('TITAN', 'Titan (Golden Dunes Moon)', new THREE.Vector3(-190, 44, -175), 42, 0xf59e0b, 'TITAN');

        // Saturn Ring Grand Prix Portal Gate (East Ring Sector)
        const gateGrp = new THREE.Group();
        gateGrp.position.copy(SPACE_SATURN_RACE_GATE_POS);
        const gateTorus = new THREE.Mesh(
            new THREE.TorusGeometry(20, 1.8, 12, 36),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        const gateInner = new THREE.Mesh(
            new THREE.TorusGeometry(15.5, 0.85, 8, 32),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        const gateCore = new THREE.Mesh(
            new THREE.CircleGeometry(14.5, 28),
            new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
        );
        const gateBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 4.5, 95, 12, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
        );
        gateBeam.position.y = 42;
        gateGrp.add(gateTorus, gateInner, gateCore, gateBeam);
        _sectorBackdropGroup.add(gateGrp);
        _saturnRaceGateGroup = gateGrp;
        _saturnRaceRingMesh = gateTorus;
    } else if (sectorId === 'URANUS') {
        // Tilted pale-cyan Uranus with dramatic vertical translucent rings
        _giantBackdropPos.set(0, -275, -110);
        _giantBackdropRadius = 185;
        const ura = new THREE.Mesh(
            new THREE.SphereGeometry(_giantBackdropRadius, 36, 28),
            new THREE.MeshBasicMaterial({ map: createGiantTexture('URANUS') })
        );
        ura.position.copy(_giantBackdropPos);
        const vRing = new THREE.Mesh(
            new THREE.RingGeometry(215, 278, 64),
            new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
        );
        vRing.position.copy(_giantBackdropPos);
        vRing.rotation.set(0.15, Math.PI * 0.44, 0.08);
        _sectorBackdropGroup.add(ura, vRing);

        // Uranus Moons: Miranda & Titania (Both Landable!)
        addSectorMoon('MIRANDA', 'Miranda (Canyon Moon)', new THREE.Vector3(0, 44, -290), 38, 0xcffafe, 'MIRANDA');
        addSectorMoon('TITANIA', 'Titania (Frost Moon)', new THREE.Vector3(-195, 54, -135), 42, 0xe2e8f0, 'TITANIA');
    } else if (sectorId === 'NEPTUNE') {
        // Deep-azure stormy Neptune
        _giantBackdropPos.set(0, -280, -105);
        _giantBackdropRadius = 190;
        const nep = new THREE.Mesh(
            new THREE.SphereGeometry(_giantBackdropRadius, 36, 28),
            new THREE.MeshBasicMaterial({ map: createGiantTexture('NEPTUNE') })
        );
        nep.position.copy(_giantBackdropPos);
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(_giantBackdropRadius + 10, 32, 24),
            new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2, side: THREE.BackSide })
        );
        halo.position.copy(_giantBackdropPos);
        _sectorBackdropGroup.add(nep, halo);

        // Neptune's giant retrograde moon Triton (Landable!)
        addSectorMoon('TRITON', 'Triton (Cryo-Geyser Moon)', new THREE.Vector3(0, 46, -292), 44, 0xe2d4e8, 'TRITON');
    }
}

function getNearestLandableSectorMoon(): SectorMoonRuntime | null {
    let best: SectorMoonRuntime | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < _sectorMoons.length; i++) {
        const m = _sectorMoons[i];
        if (!m.landablePlanetId) continue;
        const d = sigmaShip.pos.distanceTo(m.landingPos);
        if (d < bestDist) {
            bestDist = d;
            best = m;
        }
    }
    return best;
}

export function landOnActiveSectorMoon() {
    if (worldState.activeArea !== 'SPACE') return;
    if (_activeSectorId === 'MOON_ORBIT') {
        startSpaceTransition('TO_MOON');
        return;
    }
    const landable = getNearestLandableSectorMoon();
    if (landable && landable.landablePlanetId) {
        swapToPlanetSurface(landable.landablePlanetId, _activeSectorId);
    }
}

export function updateSpaceHUD() {
    if (typeof document === 'undefined') return;
    const isSpace = worldState.activeArea === 'SPACE' && !worldState.spaceLaunch?.active;
    const spacePill = document.getElementById('space-hud-pill');
    const spaceBar = document.getElementById('space-controls-bar');
    const astEl = document.getElementById('space-stat-asteroids');
    const resEl = document.getElementById('space-stat-rescues');
    const ringEl = document.getElementById('space-stat-rings');
    const moonLandBtn = document.getElementById('space-land-moon-btn');
    const moonLandLabel = moonLandBtn?.querySelector('span:last-child');

    if (spacePill) spacePill.classList.toggle('hidden', !isSpace);
    if (spaceBar) spaceBar.classList.toggle('hidden', !isSpace);
    if (astEl) astEl.textContent = String(progression.spaceAsteroidsCleared || 0);
    if (resEl) resEl.textContent = String(progression.spaceRescuesDone || 0);
    if (ringEl) ringEl.textContent = `${sigmaShip.ringsHitInLap}/${_starRings.length || 8}`;

    if (moonLandBtn) {
        if (moonLandLabel) {
            if (_activeSectorId === 'MOON_ORBIT') {
                moonLandLabel.textContent = 'LAND ON MOON';
            } else {
                const nearest = getNearestLandableSectorMoon();
                moonLandLabel.textContent = nearest?.landablePlanetId ? `LAND ON ${nearest.landablePlanetId}` : 'LAND ON MOON';
            }
        }
        moonLandBtn.classList.toggle('ring-2', Boolean(worldState.nearMoonLanding));
        moonLandBtn.classList.toggle('ring-cyan-300', Boolean(worldState.nearMoonLanding));
    }

    const ringRaceBtn = document.getElementById('space-ring-race-btn');
    if (ringRaceBtn) {
        ringRaceBtn.classList.toggle('hidden', !(isSpace && _activeSectorId === 'SATURN'));
        ringRaceBtn.classList.toggle('ring-2', _nearSaturnRaceGate);
        ringRaceBtn.classList.toggle('ring-yellow-300', _nearSaturnRaceGate);
    }
}

export function swapToSpace(fromMoon = false, sectorId: SpaceSectorId = 'MOON_ORBIT') {
    buildSpaceWorld();
    configureSpaceSector(sectorId);
    if (renderer && camera) {
        try {
            renderer.compile(spaceScene, camera);
        } catch (e) {
            console.warn('Space shader pre-compile skipped:', e);
        }
    }

    worldState.activeArea = 'SPACE';
    worldState.activePlanetId = sectorId === 'MOON_ORBIT' ? 'MOON' : sectorId;
    worldState.nearSigmaShip = false;
    worldState.nearExitShaft = false;
    worldState.nearMoonLanding = false;

    // Record visited sector in progression
    if (!Array.isArray(progression.visitedPlanets)) progression.visitedPlanets = [];
    const visitKey = sectorId === 'MOON_ORBIT' ? 'MOON' : sectorId;
    if (!progression.visitedPlanets.includes(visitKey)) {
        progression.visitedPlanets.push(visitKey);
        saveProgression({ immediate: true });
    }

    if (fromMoon) {
        sigmaShip.pos.set(0, 50, -195);
        sigmaShip.yaw = Math.PI;
    } else {
        sigmaShip.pos.set(0, 24, 110);
        sigmaShip.yaw = 0;
    }
    sigmaShip.pitch = 0;
    sigmaShip.roll = 0;
    sigmaShip.speed = 0;
    sigmaShip.boostTimer = 0;
    sigmaShip.towedPod = null;
    sigmaShip.hasWaypoint = false;
    _spaceWaypointLockedToTarget = false;
    _spaceTouch.fire = false;
    _spaceTouch.boost = false;
    _spaceTouch.climb = 0;
    _spaceTouch.beam = false;
    ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'KeyQ', 'KeyR', 'KeyC', 'ShiftLeft', 'ShiftRight', 'Space'].forEach(k => {
        input.keys[k] = false;
    });
    if (_spaceWaypointGroup) _spaceWaypointGroup.visible = false;

    // Hide standard bot controls & other area panels; show Space Flight HUD
    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.add('hidden');
    const cavernPill = document.getElementById('cavern-hud-pill');
    if (cavernPill) cavernPill.classList.add('hidden');
    const moonPill = document.getElementById('moon-hud-pill');
    if (moonPill) moonPill.classList.add('hidden');
    const solarUi = document.getElementById('solar-hub-ui');
    if (solarUi) solarUi.classList.add('hidden');
    const saturnHud = document.getElementById('saturn-race-hud');
    if (saturnHud) saturnHud.classList.add('hidden');
    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn) sigmaBtn.classList.add('hidden');
    const moonOrbitBtn = document.getElementById('moon-orbit-btn');
    if (moonOrbitBtn) moonOrbitBtn.classList.add('hidden');
    const moonEarthBtn = document.getElementById('moon-earth-btn');
    if (moonEarthBtn) moonEarthBtn.classList.add('hidden');
    const planetSolarBtn = document.getElementById('planet-solar-btn');
    if (planetSolarBtn) planetSolarBtn.classList.add('hidden');

    const zEl = document.getElementById('zone-label');
    if (zEl) {
        if (sectorId === 'JUPITER') zEl.textContent = 'JUPITER ORBIT — GALILEAN MOONS';
        else if (sectorId === 'SATURN') zEl.textContent = 'SATURN ORBIT — RINGS & TITAN SECTOR';
        else if (sectorId === 'URANUS') zEl.textContent = 'URANUS ORBIT — VERTICAL RINGS';
        else if (sectorId === 'NEPTUNE') zEl.textContent = 'NEPTUNE ORBIT — TRITON SECTOR';
        else zEl.textContent = 'GRIFFIN ROCK ORBIT — THE MOON';
    }

    updateCavernHUD();
    updateMoonHUD();
    updateSpaceHUD();
    if (typeof window.renderMinimap === 'function') window.renderMinimap();

    if (sectorId === 'JUPITER') {
        showToast(
            'JUPITER ORBIT — GAS GIANT SECTOR!',
            'Explore Io, Europa, Ganymede & Callisto! Jupiter is a gas giant (no landing), but you can land on EUROPA!'
        );
    } else if (sectorId === 'SATURN') {
        showToast(
            'SATURN ORBIT — RING GRAND PRIX & TITAN!',
            'Fly to the Golden Ring Gate (East) to race Saturn’s rings, or fly to TITAN (West) to land!'
        );
    } else if (sectorId === 'URANUS') {
        showToast(
            'URANUS ORBIT — ICE GIANT SECTOR!',
            'Fly through Uranus’s tilted vertical rings, clear icy comets, or land on MIRANDA!'
        );
    } else if (sectorId === 'NEPTUNE') {
        showToast(
            'NEPTUNE ORBIT — DEEP SPACE SECTOR!',
            'Complete orbital rescues around stormy Neptune, or descend onto TRITON!'
        );
    } else {
        showToast(
            'WELCOME TO EARTH/MOON ORBIT!',
            'TAP SCREEN or WASD to Fly • CANNONS Fire • Fly through the Moon Beacon to land!'
        );
    }
}

export function setSpaceWaypointWorld(wx: number, wy: number, wz: number) {
    sigmaShip.waypoint.set(wx, wy, wz);
    sigmaShip.hasWaypoint = true;
    _spaceWaypointLockedToTarget = true;
    if (_spaceWaypointGroup) {
        _spaceWaypointGroup.position.set(wx, wy, wz);
        _spaceWaypointGroup.visible = true;
    }
}

export function clearSpaceWaypoint(onlyIfUnlocked = false) {
    if (onlyIfUnlocked && _spaceWaypointLockedToTarget) return;
    sigmaShip.hasWaypoint = false;
    _spaceWaypointLockedToTarget = false;
    if (_spaceWaypointGroup) _spaceWaypointGroup.visible = false;
}

export function setSpaceDestinationFromScreenPoint(clientX: number, clientY: number, playChime = false) {
    if (!_spaceBuilt || worldState.activeArea !== 'SPACE' || worldState.spaceLaunch?.active) return;
    _spacePointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
    _spacePointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    _spaceRaycaster.setFromCamera(_spacePointerNDC, camera);

    const ray = _spaceRaycaster.ray;
    let bestTarget: THREE.Vector3 | null = null;
    let bestPerpDist = Infinity;
    let tappedAsteroid = false;

    const considerTarget = (pos: THREE.Vector3, snapRadius: number, isAst = false) => {
        const toPt = _tmpVecA.copy(pos).sub(ray.origin);
        const along = toPt.dot(ray.direction);
        if (along < 12 || along > 560) return;
        const closest = _tmpVecB.copy(ray.origin).addScaledVector(ray.direction, along);
        const perp = closest.distanceTo(pos);
        if (perp < snapRadius && perp < bestPerpDist) {
            bestPerpDist = perp;
            bestTarget = pos.clone();
            tappedAsteroid = isAst;
        }
    };

    // Snap cleanly to tapped Moon Landing Zone, Orbital Station, Morocco Boss, Active Ring, Satellites, Pods or Asteroids
    if (_activeSectorId === 'MOON_ORBIT') {
        considerTarget(SPACE_MOON_LANDING_POS, 34);
        if (!_moroccoStation.defeated) {
            _moroccoStation.relays.forEach(rel => { if (rel.alive) considerTarget(rel.pos, 18, true); });
            considerTarget(_moroccoStation.pos, 32, true);
        }
    } else {
        _sectorMoons.forEach(m => {
            considerTarget(m.beaconRing ? m.landingPos : m.pos, m.radius + 16);
        });
        if (_activeSectorId === 'SATURN') {
            considerTarget(SPACE_SATURN_RACE_GATE_POS, 46);
        }
    }
    considerTarget(SPACE_STATION_POS, 42);
    const activeRing = _starRings[sigmaShip.activeRingIdx];
    if (activeRing) considerTarget(activeRing.pos, 26);
    _satellites.forEach(s => { if (!s.repaired) considerTarget(s.pos, 22); });
    _pods.forEach(p => { if (!p.rescued && !p.towed) considerTarget(p.pos, 22); });
    _asteroids.forEach(a => { if (a.alive) considerTarget(a.pos, a.radius + 14, true); });

    const lockedToTarget = Boolean(bestTarget);
    if (!bestTarget) {
        bestTarget = ray.origin.clone().addScaledVector(ray.direction, 155);
    }

    // Clamp waypoint inside safe orbital bounds
    if (bestTarget.length() > SPACE_BOUNDS - 15) {
        bestTarget.multiplyScalar((SPACE_BOUNDS - 15) / bestTarget.length());
    }
    bestTarget.y = THREE.MathUtils.clamp(bestTarget.y, -88, 158);

    sigmaShip.waypoint.copy(bestTarget);
    sigmaShip.hasWaypoint = true;
    _spaceWaypointLockedToTarget = lockedToTarget;
    if (_spaceWaypointGroup) {
        _spaceWaypointGroup.position.copy(bestTarget);
        _spaceWaypointGroup.visible = true;
    }
    if (playChime) {
        sfx.playWaypointTap?.();
    }
    if (tappedAsteroid && playChime) {
        fireSigmaCannons();
    }
}

export function startSpaceTransition(mode: 'TO_SPACE' | 'TO_MOON' | 'MOON_TO_SPACE' | 'TO_EARTH') {
    if (worldState.spaceLaunch?.active) return;
    buildLaunchScene();

    const durations: Record<string, number> = {
        TO_SPACE: 7.0,
        TO_MOON: 3.2,
        MOON_TO_SPACE: 3.2,
        TO_EARTH: 3.4
    };

    worldState.spaceLaunch = {
        active: true,
        mode,
        timer: 0,
        duration: durations[mode] || 5.0,
        swapped: false
    };

    // Hide contextual prompts during cinematic
    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn) sigmaBtn.classList.add('hidden');
    const spaceBar = document.getElementById('space-controls-bar');
    if (spaceBar) spaceBar.classList.add('hidden');
    const moonOrbitBtn = document.getElementById('moon-orbit-btn');
    if (moonOrbitBtn) moonOrbitBtn.classList.add('hidden');
    const moonEarthBtn = document.getElementById('moon-earth-btn');
    if (moonEarthBtn) moonEarthBtn.classList.add('hidden');

    if (mode === 'TO_SPACE') {
        sfx.playSigmaLaunchSequence();
        setLaunchBanner(true, 'STARSHIP SIGMA — LAUNCH SEQUENCE', 'IGNITING FTL ENERGON THRUSTERS...');
    } else if (mode === 'TO_MOON') {
        sfx.playVolcanoRumble();
        sfx.playRankUp();
        setLaunchBanner(true, 'LUNAR DESCENT INITIATED', 'APPROACHING LUNAR OUTPOST ALPHA...');
    } else if (mode === 'MOON_TO_SPACE') {
        sfx.playVolcanoRumble();
        sfx.playRankUp();
        setLaunchBanner(true, 'LUNAR LIFTOFF', 'RETURNING TO GRIFFIN ROCK ORBIT...');
    } else {
        sfx.playVolcanoRumble();
        sfx.playRankUp();
        setLaunchBanner(true, 'ATMOSPHERIC RE-ENTRY', 'DESCENDING TO GRIFFIN ROCK HQ...');
    }
}

export function updateSpaceLaunchTransition(dt: number, now: number): boolean {
    const anim = worldState.spaceLaunch;
    if (!anim || !anim.active) return false;

    buildLaunchScene();
    anim.timer += dt;
    const t = Math.min(1, anim.timer / anim.duration);

    if (_launchSigmaRoot && _launchSigmaRoot.userData?.sigmaControl) {
        const ctrl = _launchSigmaRoot.userData.sigmaControl;
        if (anim.mode === 'TO_SPACE') {
            // Prolonged 3-Phase Launch Cinematic (7.0s)
            if (t < 0.28) {
                // Phase 1: Ignition & Cavern Liftoff (0.0 -> 2.0s)
                const p = t / 0.28;
                _launchSkyColor.setRGB(0.05 + p * 0.08, 0.08 + p * 0.16, 0.14 + p * 0.28);
                setLaunchBanner(true, 'STARSHIP SIGMA — LIFTOFF!', 'MAIN THRUSTERS AT FULL POWER — BLASTING THROUGH CAVERN SHAFT!');
                _launchSigmaRoot.position.set(0, -14 + p * 18, 0);
                _launchSigmaRoot.rotation.set(-Math.PI * 0.48, p * 0.35, 0);
                ctrl.setThrusterPower(1.2 + p * 1.4, true);
                if (_launchShockRing) {
                    (_launchShockRing.material as THREE.MeshBasicMaterial).opacity = 0;
                }
                if (_launchStars) (_launchStars.material as THREE.PointsMaterial).opacity = 0;
                if (_launchEarthDisk) _launchEarthDisk.position.y = -210;

                const shake = (1 - p * 0.4) * 0.85;
                camera.position.set(
                    24 - p * 4 + (Math.random() - 0.5) * shake,
                    -6 + p * 14 + (Math.random() - 0.5) * shake,
                    28 - p * 4
                );
                camera.lookAt(0, _launchSigmaRoot.position.y + 4, 0);
            } else if (t < 0.66) {
                // Phase 2: Sky Breakout & Stratosphere Ascent (2.0 -> 4.6s)
                const p = (t - 0.28) / 0.38;
                // Bright Griffin Rock sky blue -> deep stratosphere cobalt
                const r = THREE.MathUtils.lerp(0.24, 0.03, p);
                const g = THREE.MathUtils.lerp(0.68, 0.09, p);
                const b = THREE.MathUtils.lerp(0.95, 0.26, p);
                _launchSkyColor.setRGB(r, g, b);
                setLaunchBanner(
                    true,
                    p < 0.5 ? 'SKY BREAKOUT — MACH 3!' : 'STRATOSPHERE BREACH — MAX Q!',
                    p < 0.5 ? 'CLIMBING ABOVE GRIFFIN ROCK CLOUDS!' : 'ENTERING UPPER ATMOSPHERE...'
                );

                _launchSigmaRoot.position.set(0, 4 + Math.sin(now * 0.03) * 0.45, 0);
                _launchSigmaRoot.rotation.set(-Math.PI * 0.48, 0.35 + p * 1.2, Math.sin(p * Math.PI) * 0.22);
                ctrl.setThrusterPower(2.4 + Math.sin(now * 0.04) * 0.35, true);

                // Rush clouds & speed lines downward past the ship
                _launchCloudRings.forEach((ring, idx) => {
                    ring.visible = p < 0.72;
                    ring.position.y -= dt * 155;
                    if (ring.position.y < -65) ring.position.y = 110 + idx * 14;
                });
                if (_launchShockRing) {
                    const shockPulse = Math.sin(p * Math.PI);
                    (_launchShockRing.material as THREE.MeshBasicMaterial).opacity = shockPulse * 0.72;
                    _launchShockRing.position.set(0, 14, 0);
                    _launchShockRing.scale.setScalar(0.85 + shockPulse * 0.7);
                }
                if (_launchStars) (_launchStars.material as THREE.PointsMaterial).opacity = Math.max(0, (p - 0.45) * 1.6);
                if (_launchEarthDisk) _launchEarthDisk.position.y = -185 - p * 25;

                const shake = 0.45;
                camera.position.set(
                    22 * Math.cos(p * 1.1) + (Math.random() - 0.5) * shake,
                    -6 + p * 12 + (Math.random() - 0.5) * shake,
                    26 * Math.sin(p * 1.1 + 0.8)
                );
                camera.lookAt(0, 6, 0);
            } else {
                // Phase 3: Orbital Insertion & Level-Off (4.6 -> 7.0s)
                const p = (t - 0.66) / 0.34;
                const smooth = p * p * (3 - 2 * p);
                _launchSkyColor.setRGB(
                    THREE.MathUtils.lerp(0.03, 0.012, smooth),
                    THREE.MathUtils.lerp(0.09, 0.027, smooth),
                    THREE.MathUtils.lerp(0.26, 0.07, smooth)
                );
                setLaunchBanner(true, 'ORBITAL INSERTION COMPLETE!', 'ENGAGING SIGMA SPACE FLIGHT CONTROLS...');

                _launchCloudRings.forEach(ring => { ring.visible = false; });
                if (_launchShockRing) (_launchShockRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - p * 3) * 0.5);
                if (_launchStars) (_launchStars.material as THREE.PointsMaterial).opacity = 0.95;
                if (_launchEarthDisk) _launchEarthDisk.position.y = -145 - smooth * 18;

                _launchSigmaRoot.position.set(0, 4, 0);
                _launchSigmaRoot.rotation.set(
                    THREE.MathUtils.lerp(-Math.PI * 0.48, 0, smooth),
                    THREE.MathUtils.lerp(1.55, 0, smooth),
                    0
                );
                ctrl.setThrusterPower(THREE.MathUtils.lerp(2.2, 0.95, smooth), p < 0.45);

                camera.position.set(
                    THREE.MathUtils.lerp(18, 0, smooth),
                    THREE.MathUtils.lerp(8, 12, smooth),
                    THREE.MathUtils.lerp(22, 34, smooth)
                );
                camera.lookAt(0, 4, -20 * smooth);
            }
        } else {
            // Shorter 3.0-3.4s cinematics for TO_MOON, MOON_TO_SPACE, TO_EARTH
            const smooth = t * t * (3 - 2 * t);
            _launchCloudRings.forEach(ring => { ring.visible = anim.mode === 'TO_EARTH' && t > 0.45; });
            if (_launchShockRing) {
                (_launchShockRing.material as THREE.MeshBasicMaterial).opacity = anim.mode === 'TO_EARTH' ? Math.sin(t * Math.PI) * 0.75 : 0;
                _launchShockRing.position.set(0, 0, 12);
                _launchShockRing.rotation.x = 0;
            }
            if (_launchStars) (_launchStars.material as THREE.PointsMaterial).opacity = anim.mode === 'TO_EARTH' ? (1 - smooth) : 0.95;
            if (anim.mode === 'TO_EARTH') {
                _launchSkyColor.setRGB(
                    THREE.MathUtils.lerp(0.02, 0.32, smooth),
                    THREE.MathUtils.lerp(0.04, 0.72, smooth),
                    THREE.MathUtils.lerp(0.10, 0.96, smooth)
                );
            } else {
                _launchSkyColor.setHex(0x030712);
            }
            if (_launchEarthDisk) {
                _launchEarthDisk.position.y = anim.mode === 'TO_EARTH' ? -210 + smooth * 70 : -240;
            }

            _launchSigmaRoot.position.set(0, 0, 0);
            if (anim.mode === 'TO_MOON') {
                _launchSigmaRoot.rotation.set(0.32 * (1 - smooth), Math.PI, 0);
                ctrl.setThrusterPower(0.8, false);
            } else if (anim.mode === 'MOON_TO_SPACE') {
                _launchSigmaRoot.rotation.set(-Math.PI * 0.42 * (1 - smooth), 0, 0);
                ctrl.setThrusterPower(2.0, true);
            } else {
                _launchSigmaRoot.rotation.set(0.42, 0, Math.sin(t * Math.PI * 2) * 0.12);
                ctrl.setThrusterPower(1.6, true);
            }
            camera.position.set(16 * (1 - smooth * 0.4), 9, 28);
            camera.lookAt(0, 0, 0);
        }
    }

    // Animate speed-streaks during launch
    if (_launchSpeedLines) {
        _launchSpeedLines.children.forEach(line => {
            line.position.y -= dt * 135;
            if (line.position.y < -65) line.position.y = 75;
        });
    }

    if (renderer) renderer.render(launchScene, camera);

    if (t >= 1) {
        anim.active = false;
        setLaunchBanner(false);
        if (anim.mode === 'TO_SPACE') {
            if (_solarHubHandler) {
                _solarHubHandler();
            } else {
                swapToSpace(false, 'MOON_ORBIT');
            }
        } else if (anim.mode === 'MOON_TO_SPACE') {
            swapToSpace(true, _activeSectorId || 'MOON_ORBIT');
        } else if (anim.mode === 'TO_MOON') {
            swapToMoon();
        } else if (anim.mode === 'TO_EARTH') {
            // Return cleanly to Griffin Rock HQ on the Surface!
            const spaceBar = document.getElementById('space-controls-bar');
            if (spaceBar) spaceBar.classList.add('hidden');
            const spacePill = document.getElementById('space-hud-pill');
            if (spacePill) spacePill.classList.add('hidden');
            const moonPill = document.getElementById('moon-hud-pill');
            if (moonPill) moonPill.classList.add('hidden');
            const solarUi = document.getElementById('solar-hub-ui');
            if (solarUi) solarUi.classList.add('hidden');
            const saturnHud = document.getElementById('saturn-race-hud');
            if (saturnHud) saturnHud.classList.add('hidden');
            const planetSolarBtn = document.getElementById('planet-solar-btn');
            if (planetSolarBtn) planetSolarBtn.classList.add('hidden');
            const botControls = document.getElementById('bottom-controls-bar');
            if (botControls) botControls.classList.remove('hidden');

            worldState.savedSurfacePos.set(0, 5, -15);
            worldState.savedSurfaceHeading = 0;
            swapToSurface(true);
            updateMoonHUD();
            updateSpaceHUD();
            showToast('WELCOME BACK TO GRIFFIN ROCK!', 'Touchdown at Rescue Bots HQ!');
        }
    }
    return true;
}

export function fireSigmaCannons() {
    if (worldState.activeArea !== 'SPACE' || worldState.spaceLaunch?.active) return;
    if (sigmaShip.fireCooldown > 0) return;
    sigmaShip.fireCooldown = 0.22;

    // Forward direction from yaw & pitch (ship nose points along -Z at yaw=0)
    const cosP = Math.cos(sigmaShip.pitch);
    _tmpForward.set(-Math.sin(sigmaShip.yaw) * cosP, Math.sin(sigmaShip.pitch), -Math.cos(sigmaShip.yaw) * cosP).normalize();
    _tmpRight.set(Math.cos(sigmaShip.yaw), 0, -Math.sin(sigmaShip.yaw)).normalize();

    const boltGeo = new THREE.CylinderGeometry(0.42, 0.42, 6.2, 8).rotateX(Math.PI / 2);
    const boltMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    [-5.5, 5.5].forEach(sideOffset => {
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        const startPos = sigmaShip.pos.clone()
            .addScaledVector(_tmpRight, sideOffset)
            .addScaledVector(_tmpForward, 8.5);
        bolt.position.copy(startPos);
        bolt.lookAt(startPos.clone().add(_tmpForward));
        spaceScene.add(bolt);
        _laserBolts.push({
            mesh: bolt,
            pos: startPos,
            vel: _tmpForward.clone().multiplyScalar(230 + sigmaShip.speed),
            life: 2.2
        });
    });

    sfx.playEnergyCharge();
}

export function triggerSpaceBoost() {
    if (worldState.activeArea !== 'SPACE') return;
    sigmaShip.boostTimer = 2.4;
    sfx.playStuntChime();
}

export function setSpaceTouchControl(kind: 'fire' | 'boost' | 'climb' | 'beam', val: boolean | number) {
    if (kind === 'climb') _spaceTouch.climb = Number(val) || 0;
    else _spaceTouch[kind] = Boolean(val);
}

export function updateSpace(dt: number, now: number) {
    if (!_spaceBuilt || worldState.activeArea !== 'SPACE') return;
    const nowSec = now * 0.001;

    if (sigmaShip.fireCooldown > 0) sigmaShip.fireCooldown = Math.max(0, sigmaShip.fireCooldown - dt);
    if (sigmaShip.boostTimer > 0) sigmaShip.boostTimer = Math.max(0, sigmaShip.boostTimer - dt);

    // 1. Arcade 3D Space Flight Controls
    let turnInput = 0;
    let throttleInput = 0;
    let climbInput = _spaceTouch.climb;

    if (isActionActive('left') || input.keys['KeyA'] || input.keys['ArrowLeft']) turnInput += 1;
    if (isActionActive('right') || input.keys['KeyD'] || input.keys['ArrowRight']) turnInput -= 1;
    if (isActionActive('forward') || input.keys['KeyW'] || input.keys['ArrowUp']) throttleInput += 1;
    if (isActionActive('backward') || input.keys['KeyS'] || input.keys['ArrowDown']) throttleInput -= 1;
    if (input.keys['KeyE'] || input.keys['KeyR']) climbInput += 1;
    if (input.keys['KeyQ'] || input.keys['KeyC']) climbInput -= 1;

    const wantsBoost = _spaceTouch.boost || Boolean(input.keys['ShiftLeft'] || input.keys['ShiftRight']);
    const wantsFire = _spaceTouch.fire || Boolean(input.keys['Space']);
    if (wantsBoost) sigmaShip.boostTimer = Math.max(sigmaShip.boostTimer, 0.25);
    if (wantsFire) fireSigmaCannons();

    // Cancel tap-to-fly waypoint immediately if manual keyboard steering/throttle is used
    const hasManualMove = turnInput !== 0 || throttleInput !== 0 || climbInput !== 0;
    if (hasManualMove && sigmaShip.hasWaypoint) {
        clearSpaceWaypoint();
    }

    let targetSpeed = 0;
    if (sigmaShip.hasWaypoint) {
        // iPad / Tap-to-Fly 3D Autopilot toward the tapped Space Waypoint!
        const toWp = _tmpVecA.copy(sigmaShip.waypoint).sub(sigmaShip.pos);
        const distWp = toWp.length();
        if (distWp < 16.0) {
            clearSpaceWaypoint();
            targetSpeed = 0;
        } else {
            const horiz = Math.max(0.001, Math.hypot(toWp.x, toWp.z));
            // Forward is (-sin(yaw), sin(pitch), -cos(yaw))
            const desiredYaw = Math.atan2(-toWp.x, -toWp.z);
            const desiredPitch = THREE.MathUtils.clamp(Math.atan2(toWp.y, horiz), -0.68, 0.68);
            let yawDiff = desiredYaw - sigmaShip.yaw;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;

            const maxYawStep = 2.4 * dt;
            const yawStep = Math.sign(yawDiff) * Math.min(Math.abs(yawDiff), maxYawStep);
            sigmaShip.yaw += yawStep;
            sigmaShip.pitch = THREE.MathUtils.lerp(sigmaShip.pitch, desiredPitch, Math.min(1, dt * 3.8));
            const desiredRoll = THREE.MathUtils.clamp(yawDiff * 0.65, -0.5, 0.5);
            sigmaShip.roll = THREE.MathUtils.lerp(sigmaShip.roll, desiredRoll, Math.min(1, dt * 6.5));

            const alignFactor = Math.max(0.25, Math.cos(Math.min(Math.PI * 0.5, Math.abs(yawDiff))));
            const approachFactor = THREE.MathUtils.clamp((distWp - 12) / 36, 0.2, 1.0);
            const cruiseMax = sigmaShip.boostTimer > 0 ? 138 : 82;
            targetSpeed = cruiseMax * alignFactor * approachFactor;
        }
    } else {
        // Manual Keyboard / Button Flight (Zero-G hover at speed 0 when no input is pressed!)
        sigmaShip.yaw += turnInput * 1.65 * dt;
        if (Math.abs(climbInput) > 0.05) {
            sigmaShip.pitch = THREE.MathUtils.clamp(sigmaShip.pitch + climbInput * 1.15 * dt, -0.68, 0.68);
        } else {
            sigmaShip.pitch = THREE.MathUtils.lerp(sigmaShip.pitch, 0, Math.min(1, dt * 1.8));
        }
        const targetRoll = turnInput * 0.45;
        sigmaShip.roll = THREE.MathUtils.lerp(sigmaShip.roll, targetRoll, Math.min(1, dt * 6.5));

        targetSpeed = sigmaShip.boostTimer > 0
            ? 138
            : (throttleInput > 0 ? 84 : (throttleInput < 0 ? -30 : 0));
    }

    sigmaShip.speed = THREE.MathUtils.lerp(sigmaShip.speed, targetSpeed, Math.min(1, dt * 4.2));

    // Animate 3D Space Waypoint Reticle
    if (_spaceWaypointGroup && _spaceWaypointGroup.visible) {
        _spaceWaypointGroup.lookAt(camera.position);
        _spaceWaypointGroup.children[0].rotation.z += dt * 1.6;
        _spaceWaypointGroup.children[1].rotation.z -= dt * 2.4;
        const wpPulse = 1.0 + Math.sin(nowSec * 5.0) * 0.12;
        _spaceWaypointGroup.scale.setScalar(wpPulse);
    }

    const cosP = Math.cos(sigmaShip.pitch);
    _tmpForward.set(-Math.sin(sigmaShip.yaw) * cosP, Math.sin(sigmaShip.pitch), -Math.cos(sigmaShip.yaw) * cosP).normalize();
    sigmaShip.pos.addScaledVector(_tmpForward, sigmaShip.speed * dt);

    // Keep within orbital arena bounds (gently steer back inside)
    const distOrigin = sigmaShip.pos.length();
    if (distOrigin > SPACE_BOUNDS) {
        sigmaShip.pos.multiplyScalar(SPACE_BOUNDS / distOrigin);
    }
    sigmaShip.pos.y = THREE.MathUtils.clamp(sigmaShip.pos.y, -95, 165);

    // Keep ship outside solid Moon core (MOON_ORBIT) or Giant-Sector Moons & Gas Giant atmosphere
    if (_activeSectorId === 'MOON_ORBIT') {
        const distMoonCenter = sigmaShip.pos.distanceTo(SPACE_MOON_POS);
        if (distMoonCenter < 72) {
            _tmpVecA.copy(sigmaShip.pos).sub(SPACE_MOON_POS).normalize();
            sigmaShip.pos.copy(SPACE_MOON_POS).addScaledVector(_tmpVecA, 72);
        }
    } else {
        if (_gasWarningCooldown > 0) _gasWarningCooldown -= dt;
        const distGiant = sigmaShip.pos.distanceTo(_giantBackdropPos);
        if (distGiant < _giantBackdropRadius + 38) {
            _tmpVecA.copy(sigmaShip.pos).sub(_giantBackdropPos).normalize();
            sigmaShip.pos.copy(_giantBackdropPos).addScaledVector(_tmpVecA, _giantBackdropRadius + 38);
            if (_gasWarningCooldown <= 0) {
                _gasWarningCooldown = 4.5;
                const giantType = _activeSectorId === 'JUPITER' ? 'Gas Giant' : 'Ice Giant';
                showToast(`${_activeSectorId} — NO SOLID SURFACE!`, `${_activeSectorId} is a ${giantType}! Explore its moons & orbital missions instead!`);
            }
        }
        for (let i = 0; i < _sectorMoons.length; i++) {
            const sm = _sectorMoons[i];
            sm.group.rotation.y += dt * 0.14;
            if (sm.beaconRing) {
                sm.beaconRing.rotation.z += dt * 1.25;
                const sc = 1.0 + Math.sin(nowSec * 3.2) * 0.08;
                sm.beaconRing.scale.setScalar(sc);
            }
            const dm = sigmaShip.pos.distanceTo(sm.pos);
            if (dm < sm.radius + 10) {
                _tmpVecA.copy(sigmaShip.pos).sub(sm.pos).normalize();
                sigmaShip.pos.copy(sm.pos).addScaledVector(_tmpVecA, sm.radius + 10);
            }
            // Track Jupiter Galilean Moon Tour discovery!
            if (_activeSectorId === 'JUPITER' && dm < sm.radius + 58) {
                if (!Array.isArray(progression.jupiterMoonsVisited)) progression.jupiterMoonsVisited = [];
                if (!progression.jupiterMoonsVisited.includes(sm.id)) {
                    progression.jupiterMoonsVisited.push(sm.id);
                    saveProgression({ immediate: true });
                    sfx.playRelicFound();
                    showToast(
                        `DISCOVERED ${sm.name.toUpperCase()}!`,
                        `Jupiter Moon Tour: ${progression.jupiterMoonsVisited.length}/4 Galilean Moons charted! +3 Hero Points!`
                    );
                }
            }
        }
    }

    // Apply Sigma Mesh Transform & Thruster Plumes
    sfx.updateContinuousLoops('SIGMA', 'SPACE', sigmaShip.speed, false, sigmaShip.boostTimer, now);
    if (_spaceSigmaRoot) {
        _spaceSigmaRoot.position.copy(sigmaShip.pos);
        // Model nose faces +Z in local space, while flight forward is -Z -> rotate Y by yaw + PI
        _spaceSigmaRoot.rotation.order = 'YXZ';
        _spaceSigmaRoot.rotation.set(-sigmaShip.pitch, sigmaShip.yaw + Math.PI, -sigmaShip.roll);
        if (_spaceSigmaRoot.userData?.sigmaControl) {
            const absSpd = Math.abs(sigmaShip.speed);
            const power = sigmaShip.boostTimer > 0
                ? 2.4
                : (absSpd > 8 ? 0.45 + (absSpd / 84) * 1.05 : 0.22);
            _spaceSigmaRoot.userData.sigmaControl.setThrusterPower(power, sigmaShip.boostTimer > 0);
        }
    }

    // Smooth Chase Camera with Dynamic Warp FOV
    const desiredFov = sigmaShip.boostTimer > 0 ? 74 : 60;
    if (Math.abs(camera.fov - desiredFov) > 0.2) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, Math.min(1, dt * 5));
        camera.updateProjectionMatrix();
    }
    _tmpCamGoal.copy(sigmaShip.pos)
        .addScaledVector(_tmpForward, -30)
        .add(new THREE.Vector3(0, 9.5, 0));
    camera.position.lerp(_tmpCamGoal, Math.min(1, dt * 7.5));
    _tmpLookGoal.copy(sigmaShip.pos).addScaledVector(_tmpForward, 36);
    camera.lookAt(_tmpLookGoal);

    // Animate Background Earth, Station, Morocco Boss & Moon Landing Beacon
    if (_spaceEarthMesh) _spaceEarthMesh.rotation.y += dt * 0.025;
    if (_spaceStationPivot) _spaceStationPivot.rotation.y += dt * 0.22;
    if (_moroccoStation.group && !_moroccoStation.defeated) {
        if (_moroccoStation.dishPivot) _moroccoStation.dishPivot.rotation.y += dt * 0.75;
        _moroccoStation.relays.forEach((rel, idx) => {
            if (!rel.alive) return;
            rel.angle += dt * 0.85;
            rel.pos.set(
                SPACE_MOROCCO_POS.x + Math.cos(rel.angle) * 38,
                SPACE_MOROCCO_POS.y + Math.sin(nowSec * 1.8 + idx) * 7,
                SPACE_MOROCCO_POS.z + Math.sin(rel.angle) * 38
            );
            rel.group.position.copy(rel.pos);
            rel.group.rotation.y += dt * 2.2;
            rel.beam.position.copy(rel.pos).lerp(SPACE_MOROCCO_POS, 0.5);
            rel.beam.lookAt(SPACE_MOROCCO_POS);
        });
    }
    if (_spaceMoonBeaconRing) {
        _spaceMoonBeaconRing.rotation.z += dt * 1.2;
        const sc = 1.0 + Math.sin(nowSec * 3.2) * 0.08;
        _spaceMoonBeaconRing.scale.setScalar(sc);
    }

    // Check Moon / Giant-Moon Landing Beacon Proximity
    if (_activeSectorId === 'MOON_ORBIT') {
        const distMoonLanding = sigmaShip.pos.distanceTo(SPACE_MOON_LANDING_POS);
        const nearMoon = distMoonLanding < 65;
        if (worldState.nearMoonLanding !== nearMoon) {
            worldState.nearMoonLanding = nearMoon;
            updateSpaceHUD();
        }
        // Flying directly through the glowing Lunar Landing Ring auto-lands on the Moon!
        if (distMoonLanding < 21) {
            startSpaceTransition('TO_MOON');
            return;
        }
    } else {
        const nearestLandable = getNearestLandableSectorMoon();
        if (nearestLandable && nearestLandable.landablePlanetId) {
            const distLand = sigmaShip.pos.distanceTo(nearestLandable.landingPos);
            const nearMoon = distLand < 65;
            const changedId = worldState.nearLandableMoonId !== nearestLandable.landablePlanetId;
            worldState.nearLandableMoonId = nearestLandable.landablePlanetId;
            if (worldState.nearMoonLanding !== nearMoon || changedId) {
                worldState.nearMoonLanding = nearMoon;
                updateSpaceHUD();
            }
            if (distLand < 21) {
                swapToPlanetSurface(nearestLandable.landablePlanetId, _activeSectorId);
                return;
            }
        }
        if (_activeSectorId === 'SATURN') {
            if (_saturnRaceGateGroup) {
                _saturnRaceGateGroup.rotation.y += dt * 0.7;
            }
            if (_saturnRaceRingMesh) {
                _saturnRaceRingMesh.scale.setScalar(1.0 + Math.sin(nowSec * 3.5) * 0.08);
            }
            const distRace = sigmaShip.pos.distanceTo(SPACE_SATURN_RACE_GATE_POS);
            const nearRace = distRace < 65;
            if (_nearSaturnRaceGate !== nearRace) {
                _nearSaturnRaceGate = nearRace;
                updateSpaceHUD();
            }
            if (distRace < 22) {
                swapToSaturnRace();
                return;
            }
        }
        // Track Uranus moons visited when flying near Miranda or Titania
        if (_activeSectorId === 'URANUS') {
            _sectorMoons.forEach((m) => {
                if (sigmaShip.pos.distanceTo(m.pos) < m.radius + 70) {
                    if (!Array.isArray(progression.uranusMoonsVisited)) progression.uranusMoonsVisited = [];
                    if (!progression.uranusMoonsVisited.includes(m.id)) {
                        progression.uranusMoonsVisited.push(m.id);
                        saveProgression();
                    }
                }
            });
        }
    }

    // 3. Update Laser Bolts & Asteroid Defense
    for (let i = _laserBolts.length - 1; i >= 0; i--) {
        const bolt = _laserBolts[i];
        bolt.life -= dt;
        bolt.pos.addScaledVector(bolt.vel, dt);
        bolt.mesh.position.copy(bolt.pos);

        let hit = false;
        for (let a = 0; a < _asteroids.length; a++) {
            const ast = _asteroids[a];
            if (!ast.alive) continue;
            if (bolt.pos.distanceTo(ast.pos) < ast.radius + 3.2) {
                hit = true;
                ast.hp -= (sigmaShip.boostTimer > 0 ? 2 : 1);
                spawnSpaceBurst(bolt.pos, 0x22d3ee, 6);
                if (ast.hp <= 0) {
                    ast.alive = false;
                    ast.mesh.visible = false;
                    ast.respawnTimer = 10.0;
                    spawnSpaceBurst(ast.pos, 0xf97316, 16);
                    progression.spaceAsteroidsCleared = (progression.spaceAsteroidsCleared || 0) + 1;
                    progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
                    saveProgression();
                    sfx.playRockBreak(ast.pos.x, ast.pos.z);
                    updateSpaceHUD();
                }
                break;
            }
        }

        // Check laser bolt hits against Dr. Morocco's Orbital Laser Station & 3 Shield Relays!
        if (!hit && !_moroccoStation.defeated) {
            for (let r = 0; r < _moroccoStation.relays.length; r++) {
                const rel = _moroccoStation.relays[r];
                if (!rel.alive) continue;
                if (bolt.pos.distanceTo(rel.pos) < 8.5) {
                    hit = true;
                    rel.hp -= (sigmaShip.boostTimer > 0 ? 2 : 1);
                    spawnSpaceBurst(bolt.pos, 0xe879f9, 8);
                    if (rel.hp <= 0) {
                        rel.alive = false;
                        rel.group.visible = false;
                        rel.beam.visible = false;
                        spawnSpaceBurst(rel.pos, 0xf59e0b, 18);
                        sfx.playRockBreak();
                        const aliveCount = _moroccoStation.relays.filter(x => x.alive).length;
                        if (aliveCount === 0) {
                            if (_moroccoStation.shieldDome) _moroccoStation.shieldDome.visible = false;
                            if (_moroccoStation.coreMat) _moroccoStation.coreMat.color.setHex(0xfacc15);
                            showToast('MOROCCO SHIELDS DOWN!', 'All 3 Shield Relays destroyed! Blast the central Verne Laser Core!');
                        } else {
                            showToast('SHIELD RELAY DESTROYED!', `${aliveCount} orbiting Shield Relay${aliveCount > 1 ? 's' : ''} remaining!`);
                        }
                    }
                    break;
                }
            }
            if (!hit && bolt.pos.distanceTo(_moroccoStation.pos) < 20.0) {
                hit = true;
                const aliveRelays = _moroccoStation.relays.filter(x => x.alive).length;
                if (aliveRelays > 0) {
                    spawnSpaceBurst(bolt.pos, 0xa855f7, 6);
                    showToast('ORBITAL SHIELD ACTIVE!', `Destroy the ${aliveRelays} orbiting purple Shield Relay${aliveRelays > 1 ? 's' : ''} first!`);
                } else {
                    _moroccoStation.hp -= (sigmaShip.boostTimer > 0 ? 2 : 1);
                    spawnSpaceBurst(bolt.pos, 0xf59e0b, 12);
                    sfx.playRockBreak();
                    if (_moroccoStation.hp <= 0) {
                        _moroccoStation.defeated = true;
                        if (_moroccoStation.dishPivot) _moroccoStation.dishPivot.visible = false;
                        if (_moroccoStation.coreMat) _moroccoStation.coreMat.color.setHex(0x475569);
                        spawnSpaceBurst(_moroccoStation.pos, 0xfacc15, 28);
                        progression.spaceMoroccoDefeated = true;
                        progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 15;
                        saveProgression({ immediate: true });
                        sfx.playRankUp();
                        showToast('MOROCCO ORBITAL STATION DISABLED!', '+20 Hero Points & +15 Energon Cubes! The orbital laser is offline!');
                        triggerNPCSpeech(
                            'DR. MOROCCO',
                            'Arch-Nemesis',
                            'Curse you, Rescue Bots! My orbital weather-disruptor satellite took months to launch!',
                            player as unknown as SpeechTarget,
                            true
                        );
                        updateSpaceHUD();
                    } else {
                        showToast('VERNE CORE HIT!', `Dr. Morocco's Orbital Station: ${_moroccoStation.hp}/${_moroccoStation.maxHp} HP remaining!`);
                    }
                }
            }
        }

        if (hit || bolt.life <= 0) {
            spaceScene.remove(bolt.mesh);
            _laserBolts.splice(i, 1);
        }
    }

    // Update Asteroids
    for (let i = 0; i < _asteroids.length; i++) {
        const ast = _asteroids[i];
        if (!ast.alive) {
            ast.respawnTimer -= dt;
            if (ast.respawnTimer <= 0) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 160 + Math.random() * 140;
                ast.pos.set(Math.cos(ang) * dist, (Math.random() - 0.5) * 90, -60 + Math.sin(ang) * dist);
                ast.hp = 2;
                ast.alive = true;
                ast.mesh.visible = true;
            }
            continue;
        }
        ast.pos.addScaledVector(ast.vel, dt);
        if (ast.pos.length() > SPACE_BOUNDS - 30) ast.vel.negate();
        ast.mesh.position.copy(ast.pos);
        ast.mesh.rotation.x += ast.rotVel.x * dt;
        ast.mesh.rotation.y += ast.rotVel.y * dt;
    }

    // 4. Activity 2A & 2B: Repair Beam (Satellites) & Tractor Beam (Stranded Pods)
    let beamTarget: THREE.Vector3 | null = null;

    for (let i = 0; i < _satellites.length; i++) {
        const sat = _satellites[i];
        sat.group.rotation.y += dt * (sat.repaired ? 0.35 : 1.6);
        if (sat.repaired) continue;

        const d = sigmaShip.pos.distanceTo(sat.pos);
        if (d < 56) {
            beamTarget = sat.pos;
            sat.repairProgress += dt;
            if (sat.repairProgress >= 1.6) {
                sat.repaired = true;
                sat.beaconMat.color.setHex(0x22d3ee);
                progression.spaceRescuesDone = (progression.spaceRescuesDone || 0) + 1;
                saveProgression({ immediate: true });
                spawnSpaceBurst(sat.pos, 0x22d3ee, 18);
                sfx.playBeaconRestore();
                showToast('SATELLITE REPAIRED!', `${sat.name} is back online! +5 Hero Points!`);
                updateSpaceHUD();
            }
        }
    }

    for (let i = 0; i < _pods.length; i++) {
        const pod = _pods[i];
        pod.group.rotation.y += dt * 1.1;
        if (pod.rescued) continue;

        if (!pod.towed && !sigmaShip.towedPod && sigmaShip.pos.distanceTo(pod.pos) < 44) {
            pod.towed = true;
            sigmaShip.towedPod = pod;
            sfx.playEnergyCharge();
            showToast('TRACTOR BEAM LOCKED!', `Towing ${pod.name} — fly to the Autobot Orbital Station!`);
        }

        if (pod.towed) {
            // Pull pod smoothly behind Sigma
            _tmpVecB.copy(sigmaShip.pos).addScaledVector(_tmpForward, -22);
            pod.pos.lerp(_tmpVecB, Math.min(1, dt * 4.2));
            pod.group.position.copy(pod.pos);
            beamTarget = pod.pos;

            if (pod.pos.distanceTo(SPACE_STATION_POS) < 55) {
                pod.towed = false;
                pod.rescued = true;
                pod.group.visible = false;
                sigmaShip.towedPod = null;
                progression.spaceRescuesDone = (progression.spaceRescuesDone || 0) + 1;
                saveProgression({ immediate: true });
                spawnSpaceBurst(SPACE_STATION_POS, 0x4ade80, 22);
                sfx.playRankUp();
                showToast('ORBITAL POD DELIVERED!', `${pod.name} safely docked at Autobot Orbital Station! +5 Hero Points!`);
                updateSpaceHUD();
            }
        }
    }

    if (_tractorBeamMesh) {
        if (beamTarget) {
            _tractorBeamMesh.visible = true;
            _tractorBeamMesh.position.copy(sigmaShip.pos);
            _tractorBeamMesh.lookAt(beamTarget);
            const dist = sigmaShip.pos.distanceTo(beamTarget);
            _tractorBeamMesh.scale.set(1, 1, Math.max(1, dist));
        } else {
            _tractorBeamMesh.visible = false;
        }
    }

    // 5. Activity 3: Star-Ring Slalom Course
    for (let i = 0; i < _starRings.length; i++) {
        const ring = _starRings[i];
        const isActive = i === sigmaShip.activeRingIdx;
        ring.innerMesh.rotation.z += dt * (isActive ? 2.4 : 0.7);
        ring.mat.color.setHex(isActive ? 0xfbbf24 : 0x22d3ee);
        ring.mat.opacity = isActive ? 0.96 : 0.38;
        if (isActive) {
            const pulse = 1.0 + Math.sin(nowSec * 5.0) * 0.08;
            ring.mesh.scale.setScalar(pulse);
            if (sigmaShip.pos.distanceTo(ring.pos) < 19.5) {
                sigmaShip.ringsHitInLap++;
                sigmaShip.activeRingIdx = (sigmaShip.activeRingIdx + 1) % _starRings.length;
                sigmaShip.boostTimer = 1.8;
                spawnSpaceBurst(ring.pos, 0xfbbf24, 12);
                sfx.playStuntChime();
                if (sigmaShip.ringsHitInLap >= _starRings.length) {
                    sigmaShip.ringsHitInLap = 0;
                    progression.spaceRingsCompleted = (progression.spaceRingsCompleted || 0) + 1;
                    saveProgression({ immediate: true });
                    sfx.playRankUp();
                    showToast('STAR-RING COURSE COMPLETE!', '+8 Hero Points! Warp boost engaged!');
                }
                updateSpaceHUD();
            }
        } else {
            ring.mesh.scale.setScalar(1.0);
        }
    }

    // 5B. Activity 4: Orbiting Energon Comets (Catch for +3 Energon Cubes!)
    for (let i = 0; i < _comets.length; i++) {
        const cm = _comets[i];
        cm.angle += dt * cm.orbitSpeed;
        const cx = Math.cos(cm.angle) * cm.orbitRadius;
        const cz = -60 + Math.sin(cm.angle) * cm.orbitRadius;
        const cy = cm.yBase + Math.sin(nowSec * 1.4 + i) * 14;
        cm.pos.set(cx, cy, cz);
        cm.group.position.copy(cm.pos);
        cm.group.lookAt(
            Math.cos(cm.angle + 0.1) * cm.orbitRadius,
            cy,
            -60 + Math.sin(cm.angle + 0.1) * cm.orbitRadius
        );
        if (cm.cooldown > 0) {
            cm.cooldown -= dt;
            cm.group.visible = false;
            continue;
        }
        cm.group.visible = true;
        if (sigmaShip.pos.distanceTo(cm.pos) < 18.0) {
            cm.cooldown = 12.0;
            sigmaShip.boostTimer = 2.0;
            progression.spaceCometsCaught = (progression.spaceCometsCaught || 0) + 1;
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 3;
            saveProgression({ immediate: true });
            spawnSpaceBurst(cm.pos, 0x22d3ee, 20);
            sfx.playGemChime();
            showToast('ENERGON COMET CAUGHT!', `+3 Energon Cubes! Total Comets: ${progression.spaceCometsCaught}`);
        }
    }

    // 6. Update Space Burst Particles
    for (let i = _bursts.length - 1; i >= 0; i--) {
        const b = _bursts[i];
        b.life -= dt;
        if (b.life <= 0) {
            spaceScene.remove(b.mesh);
            _bursts.splice(i, 1);
            continue;
        }
        b.mesh.position.addScaledVector(b.vel, dt);
        const s = Math.max(0.05, b.life / b.maxLife);
        b.mesh.scale.setScalar(s);
        (b.mesh.material as THREE.MeshBasicMaterial).opacity = s;
    }
}

export function getSpaceMapData() {
    return {
        sectorId: _activeSectorId,
        sectorMoons: _sectorMoons,
        bounds: SPACE_BOUNDS,
        ship: sigmaShip,
        moonPos: SPACE_MOON_POS,
        moonLandingPos: SPACE_MOON_LANDING_POS,
        saturnRaceGatePos: _activeSectorId === 'SATURN' ? SPACE_SATURN_RACE_GATE_POS : null,
        stationPos: SPACE_STATION_POS,
        moroccoStation: _moroccoStation,
        asteroids: _asteroids,
        satellites: _satellites,
        pods: _pods,
        starRings: _starRings
    };
}

// Register launch handler with underground.ts (deferred via microtask to avoid circular-import TDZ)
queueMicrotask(() => {
    setSigmaLaunchHandler(() => startSpaceTransition('TO_SPACE'));
});

if (typeof window !== 'undefined') {
    Object.assign(window, {
        spaceScene,
        launchScene,
        sigmaShip,
        startSpaceTransition,
        swapToSpace,
        landOnActiveSectorMoon,
        openSolarSystemHub,
        fireSigmaCannons,
        triggerSpaceBoost,
        setSpaceTouchControl,
        setSpaceDestinationFromScreenPoint,
        setSpaceWaypointWorld,
        clearSpaceWaypoint,
        getSpaceMapData
    });
}

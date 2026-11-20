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
import { buildCrashedSpaceshipSigma } from './spaceshipSigma.js';
import { swapToMoon, updateMoonHUD } from './moon.js';
import { swapToSurface, setSigmaLaunchHandler, updateCavernHUD } from './underground.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { isActionActive } from '../settings/settings.js';

export const spaceScene = new THREE.Scene();
export const launchScene = new THREE.Scene();

export const SPACE_BOUNDS = 460;
export const SPACE_MOON_POS = new THREE.Vector3(0, 45, -320);
export const SPACE_MOON_LANDING_POS = new THREE.Vector3(0, 45, -238);
export const SPACE_STATION_POS = new THREE.Vector3(190, 22, -70);

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
let _spaceEarthMesh: THREE.Mesh | null = null;
let _spaceMoonBeaconRing: THREE.Mesh | null = null;
let _tractorBeamMesh: THREE.Mesh | null = null;
let _spaceWaypointGroup: THREE.Group | null = null;
const _spaceRaycaster = new THREE.Raycaster();
const _spacePointerNDC = new THREE.Vector2();

const _spaceAnimated: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];
const _asteroids: AsteroidItem[] = [];
const _laserBolts: LaserBolt[] = [];
const _bursts: SpaceBurst[] = [];
const _satellites: OrbitalSatellite[] = [];
const _pods: StrandedPod[] = [];
const _starRings: StarRing[] = [];

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
    const animDummy: any[] = [];
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
    spaceScene.add(earthGroup);

    // Sculpted Moon Ahead + Glowing Lunar Landing Zone Ring
    const moonGroup = new THREE.Group();
    moonGroup.position.copy(SPACE_MOON_POS);
    const moonSphere = new THREE.Mesh(
        new THREE.SphereGeometry(62, 32, 24),
        new THREE.MeshToonMaterial({ color: 0xe2e8f0, map: createMoonSphereTexture(), gradientMap: toonGrad4 })
    );
    moonGroup.add(moonSphere);
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
    const stationGroup = new THREE.Group();
    stationGroup.position.copy(SPACE_STATION_POS);
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
    _spaceStationPivot = stationGroup;
    spaceScene.add(stationGroup);

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
        const g = new THREE.Group();
        g.position.copy(def.pos);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.5, 10), matChrome);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4.2), matOptimusBlue);
        wingL.position.x = -9.5;
        const wingR = wingL.clone();
        wingR.position.x = 9.5;
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 10), beaconMat);
        beacon.position.y = 5.4;
        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(9.5, 0.45, 8, 24),
            beaconMat
        );
        g.add(body, wingL, wingR, beacon, halo);
        applyCartoonInkOutlines(body, 1.04, true);
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
        const g = new THREE.Group();
        g.position.copy(def.pos);
        const capsule = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 7.5, 10), matOptimusRed);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), matChrome);
        cap.position.y = 3.8;
        const beacon = new THREE.Mesh(
            new THREE.TorusGeometry(5.2, 0.38, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
        );
        g.add(capsule, cap, beacon);
        applyCartoonInkOutlines(capsule, 1.04, true);
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

export function updateSpaceHUD() {
    if (typeof document === 'undefined') return;
    const isSpace = worldState.activeArea === 'SPACE' && !worldState.spaceLaunch?.active;
    const spacePill = document.getElementById('space-hud-pill');
    const spaceBar = document.getElementById('space-controls-bar');
    const astEl = document.getElementById('space-stat-asteroids');
    const resEl = document.getElementById('space-stat-rescues');
    const ringEl = document.getElementById('space-stat-rings');
    const moonLandBtn = document.getElementById('space-land-moon-btn');

    if (spacePill) spacePill.classList.toggle('hidden', !isSpace);
    if (spaceBar) spaceBar.classList.toggle('hidden', !isSpace);
    if (astEl) astEl.textContent = String(progression.spaceAsteroidsCleared || 0);
    if (resEl) resEl.textContent = String(progression.spaceRescuesDone || 0);
    if (ringEl) ringEl.textContent = `${sigmaShip.ringsHitInLap}/${_starRings.length || 8}`;

    if (moonLandBtn) {
        moonLandBtn.classList.toggle('ring-2', Boolean(worldState.nearMoonLanding));
        moonLandBtn.classList.toggle('ring-cyan-300', Boolean(worldState.nearMoonLanding));
    }
}

export function swapToSpace(fromMoon = false) {
    buildSpaceWorld();
    if (renderer && camera) {
        try {
            renderer.compile(spaceScene, camera);
        } catch (e) {
            console.warn('Space shader pre-compile skipped:', e);
        }
    }

    worldState.activeArea = 'SPACE';
    worldState.nearSigmaShip = false;
    worldState.nearExitShaft = false;
    worldState.nearMoonLanding = false;

    if (fromMoon) {
        sigmaShip.pos.set(0, 50, -195);
        sigmaShip.yaw = Math.PI; // Facing away from Moon back toward orbital hub
    } else {
        sigmaShip.pos.set(0, 24, 110);
        sigmaShip.yaw = 0; // Facing -Z toward the Star-Rings & Moon
    }
    sigmaShip.pitch = 0;
    sigmaShip.roll = 0;
    sigmaShip.speed = 0;
    sigmaShip.boostTimer = 0;
    sigmaShip.towedPod = null;
    sigmaShip.hasWaypoint = false;
    if (_spaceWaypointGroup) _spaceWaypointGroup.visible = false;

    // Hide standard bot controls & cavern/moon pills; show Space Flight HUD
    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.add('hidden');
    const cavernPill = document.getElementById('cavern-hud-pill');
    if (cavernPill) cavernPill.classList.add('hidden');
    const moonPill = document.getElementById('moon-hud-pill');
    if (moonPill) moonPill.classList.add('hidden');
    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn) sigmaBtn.classList.add('hidden');
    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = 'GRIFFIN ROCK ORBIT';

    updateCavernHUD();
    updateMoonHUD();
    updateSpaceHUD();
    if (typeof (window as any).renderMinimap === 'function') (window as any).renderMinimap();

    showToast(
        'WELCOME TO ORBIT — STARSHIP SIGMA!',
        'TAP SCREEN or WASD to Fly • SPACE / CANNONS Fire • SHIFT Warp Boost • Fly to the Moon to land!'
    );
}

export function clearSpaceWaypoint() {
    sigmaShip.hasWaypoint = false;
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

    // Snap cleanly to tapped Moon Landing Zone, Orbital Station, Active Ring, Satellites, Pods or Asteroids
    considerTarget(SPACE_MOON_LANDING_POS, 34);
    considerTarget(SPACE_STATION_POS, 42);
    const activeRing = _starRings[sigmaShip.activeRingIdx];
    if (activeRing) considerTarget(activeRing.pos, 26);
    _satellites.forEach(s => { if (!s.repaired) considerTarget(s.pos, 22); });
    _pods.forEach(p => { if (!p.rescued && !p.towed) considerTarget(p.pos, 22); });
    _asteroids.forEach(a => { if (a.alive) considerTarget(a.pos, a.radius + 14, true); });

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

    sfx.playVolcanoRumble();
    sfx.playRankUp();
    if (mode === 'TO_SPACE') {
        setLaunchBanner(true, 'STARSHIP SIGMA — LAUNCH SEQUENCE', 'IGNITING FTL ENERGON THRUSTERS...');
    } else if (mode === 'TO_MOON') {
        setLaunchBanner(true, 'LUNAR DESCENT INITIATED', 'APPROACHING LUNAR OUTPOST ALPHA...');
    } else if (mode === 'MOON_TO_SPACE') {
        setLaunchBanner(true, 'LUNAR LIFTOFF', 'RETURNING TO GRIFFIN ROCK ORBIT...');
    } else {
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
            swapToSpace(false);
        } else if (anim.mode === 'MOON_TO_SPACE') {
            swapToSpace(true);
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

    // Keep ship outside solid Moon core
    const distMoonCenter = sigmaShip.pos.distanceTo(SPACE_MOON_POS);
    if (distMoonCenter < 72) {
        _tmpVecA.copy(sigmaShip.pos).sub(SPACE_MOON_POS).normalize();
        sigmaShip.pos.copy(SPACE_MOON_POS).addScaledVector(_tmpVecA, 72);
    }

    // Apply Sigma Mesh Transform & Thruster Plumes
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

    // 2. Animate Background Earth, Station & Moon Landing Beacon
    if (_spaceEarthMesh) _spaceEarthMesh.rotation.y += dt * 0.025;
    if (_spaceStationPivot) _spaceStationPivot.rotation.y += dt * 0.22;
    if (_spaceMoonBeaconRing) {
        _spaceMoonBeaconRing.rotation.z += dt * 1.2;
        const sc = 1.0 + Math.sin(nowSec * 3.2) * 0.08;
        _spaceMoonBeaconRing.scale.setScalar(sc);
    }

    // Check Moon Landing Beacon Proximity
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
                    sfx.playRockBreak();
                    updateSpaceHUD();
                }
                break;
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
        bounds: SPACE_BOUNDS,
        ship: sigmaShip,
        moonPos: SPACE_MOON_POS,
        stationPos: SPACE_STATION_POS,
        asteroids: _asteroids,
        satellites: _satellites,
        pods: _pods,
        starRings: _starRings
    };
}

// Register launch handler with underground.ts so clicking LAUNCH SIGMA launches cleanly
setSigmaLaunchHandler(() => startSpaceTransition('TO_SPACE'));

if (typeof window !== 'undefined') {
    Object.assign(window, {
        spaceScene,
        launchScene,
        sigmaShip,
        startSpaceTransition,
        swapToSpace,
        fireSigmaCannons,
        triggerSpaceBoost,
        setSpaceTouchControl,
        setSpaceDestinationFromScreenPoint,
        clearSpaceWaypoint,
        getSpaceMapData
    });
}

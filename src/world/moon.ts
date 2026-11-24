// Low-Gravity Moon Base Scene (worldState.activeArea === 'MOON')
import * as THREE from 'three';
import { scene, camera, renderer } from '../rendering/scene.js';
import {
    toonGrad3, toonGrad4, matDarkSteel, matChrome,
    matOptimusRed, matOptimusGold, matOptimusBlue, matEmblem,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs, worldState } from '../state/gameState.js';
import { progression, saveProgression } from '../progression/progression.js';
import { setMoonTerrainHooks } from './terrain.js';
import { setActiveParticleScene, spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import { buildCrashedSpaceshipSigma } from './spaceshipSigma.js';
import { buildSurfaceCaveEntranceMesh } from './planetSurface.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';
import { SVG_ICONS } from '../ui/icons.js';

export const moonScene = new THREE.Scene();
export const MOON_WORLD_RADIUS = 580;
export const MOON_SIGMA_POS = { x: 0, z: -28 };
export const MOON_FLAG_POS = { x: 20, z: 6 };
export const MOON_CAVE_POS = { x: -56, z: 22 };

interface CraterDef {
    x: number;
    z: number;
    r: number;
    depth: number;
    rim: number;
}

const MOON_CRATERS: CraterDef[] = [
    { x: -168, z: -156, r: 46, depth: 4.5, rim: 2.8 },
    { x: 196, z: -164, r: 52, depth: 5.0, rim: 3.1 },
    { x: -204, z: 168, r: 54, depth: 5.2, rim: 3.2 },
    { x: 188, z: 188, r: 46, depth: 4.4, rim: 2.8 },
    { x: 0, z: 318, r: 56, depth: 5.4, rim: 3.4 },
    { x: -330, z: -22, r: 44, depth: 4.0, rim: 2.5 },
    { x: 334, z: 34, r: 48, depth: 4.4, rim: 2.7 },
    { x: -32, z: -315, r: 48, depth: 4.4, rim: 2.7 },
    { x: 330, z: -275, r: 42, depth: 4.0, rim: 2.5 }
];

export interface MoonRelicDef {
    id: string;
    name: string;
    x: number;
    z: number;
}

export const MOON_RELIC_DEFS: MoonRelicDef[] = [
    { id: 'TYCHO_CRYSTAL', name: 'Tycho Energon Shard', x: -168, z: -156 },
    { id: 'TRANQUILITY_CORE', name: 'Tranquility Star Core', x: 196, z: -164 },
    { id: 'LUNAR_CREST', name: 'Cybertronian Lunar Crest', x: -204, z: 168 },
    { id: 'ORBITAL_PRISM', name: 'Moonbeam Energon Prism', x: 188, z: 188 },
    { id: 'POLAR_BEACON', name: 'South Rim Star Relic', x: 0, z: 318 }
];

const MOON_JUMP_PADS = [
    { x: -42, z: -22 },
    { x: 58, z: -44 },
    { x: -64, z: 72 },
    { x: 54, z: 76 },
    { x: -156, z: -20 },
    { x: 160, z: 18 }
];

interface MoonRelicRuntime extends MoonRelicDef {
    group: THREE.Group;
    spinner: THREE.Group;
    collected: boolean;
}

interface MoonRockRuntime {
    mesh: THREE.Mesh;
    crystal?: THREE.Mesh;
    x: number;
    y: number;
    z: number;
    r: number;
    destroyed: boolean;
}

interface MoonHoopRuntime {
    x: number;
    y: number;
    z: number;
    group: THREE.Group;
    ringMat: THREE.MeshBasicMaterial;
    cleared: boolean;
}

const MOON_HOOP_COORDS = [
    { x: -42, z: -22, h: 12 },
    { x: 58, z: -44, h: 12 },
    { x: -64, z: 72, h: 12 },
    { x: 54, z: 76, h: 12 },
    { x: -108, z: -64, h: 10 },
    { x: 126, z: -68, h: 10 },
    { x: -156, z: -20, h: 12 },
    { x: 160, z: 18, h: 12 },
    { x: -72, z: 160, h: 10 },
    { x: 72, z: 165, h: 10 }
];

interface MoonMonolith {
    id: string;
    name: string;
    x: number;
    z: number;
    beaconMat: THREE.MeshBasicMaterial;
    scanned: boolean;
}

const _moonAnimated: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];
const _moonRelics: MoonRelicRuntime[] = [];
const _moonRocks: MoonRockRuntime[] = [];
const _moonHoops: MoonHoopRuntime[] = [];
const _moonMonoliths: MoonMonolith[] = [];
const _moonColliders: Array<{ x: number; z: number; r: number }> = [];
let _moonBuilt = false;
let _moonSigmaRoot: THREE.Group | null = null;
let _moonFlagBanner: THREE.Mesh | null = null;
let _moonCommsDish: THREE.Object3D | null = null;
let _moonRoverGroup: THREE.Group | null = null;
let _moonRoverWheels: THREE.Mesh[] = [];
const _moonRoverPos = new THREE.Vector3(18, 6, -16);
let _inLunarRover = false;
let _roverToggleCooldown = 0;
let _moonJumpCooldown = 0;
let _moonCaveCooldown = 0;
let _moonCaveEnterHandler: (() => void) | null = null;

export function setMoonCaveEnterHandler(fn: () => void) {
    _moonCaveEnterHandler = fn;
}

export function setMoonCaveCooldown(sec = 2.0) {
    _moonCaveCooldown = Math.max(_moonCaveCooldown, sec);
}

export function enterMoonCave() {
    if (_moonCaveEnterHandler && _moonCaveCooldown <= 0) {
        _moonCaveCooldown = 2.0;
        _moonCaveEnterHandler();
    }
}

export function buildLunarOutpostMesh() {
    const outpostGroup = new THREE.Group();
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.2, 2.2, 16), matDarkSteel);
    domeBase.position.y = 1.1;
    const domeShell = new THREE.Mesh(
        new THREE.SphereGeometry(9.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 })
    );
    domeShell.position.y = 1.8;
    const domeStripe = new THREE.Mesh(new THREE.CylinderGeometry(9.75, 9.75, 1.1, 16), matOptimusRed);
    domeStripe.position.y = 2.4;
    const airlock = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.4, 6.2), matChrome);
    airlock.position.set(-10.2, 2.2, 0);
    const airlockDoor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 2.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    airlockDoor.position.set(-12.7, 1.9, 0);
    airlockDoor.userData.noOutline = true;

    [-1, 1].forEach(side => {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5.2, 8), matChrome);
        mast.position.set(0, 2.6, side * 13.5);
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(8.2, 0.22, 3.6),
            new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 })
        );
        panel.position.set(0, 5.2, side * 13.5);
        panel.rotation.x = side * 0.25;
        outpostGroup.add(mast, panel);
    });

    const dishPivot = new THREE.Group();
    dishPivot.position.set(0, 11.6, 0);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.5, 14, 1, true), matChrome);
    dish.rotation.x = Math.PI * 0.65;
    const dishTip = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    dishTip.position.set(0, 0.8, 1.6);
    dishTip.userData.noOutline = true;
    dishPivot.add(dish, dishTip);

    outpostGroup.add(domeBase, domeShell, domeStripe, airlock, airlockDoor, dishPivot);
    applyCartoonInkOutlines(outpostGroup, 1.03, true);
    return { outpostGroup, dishPivot };
}

export function buildLunarRoverMesh() {
    const rover = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    const matFoilGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
    const matRoverWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.85, 6.2), matFoilGold);
    chassis.position.y = 1.25;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.9, 2.2), matRoverWhite);
    hood.position.set(0, 1.9, 1.8);
    const rollBar = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.16, 8, 16, Math.PI), matChrome);
    rollBar.position.set(0, 2.1, -0.5);
    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), matChrome);
    dishMast.position.set(1.3, 2.6, -2.2);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.55, 12, 1, true).rotateX(-Math.PI * 0.35), matChrome);
    dish.position.set(1.3, 3.7, -2.2);

    const wheelGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.72, 14).rotateZ(Math.PI / 2);
    [-2.1, 2.1].forEach(wx => {
        [-2.2, 0, 2.2].forEach(wz => {
            const w = new THREE.Mesh(wheelGeo, matDarkSteel);
            w.position.set(wx, 0.95, wz);
            rover.add(w);
            wheels.push(w);
        });
    });

    rover.add(chassis, hood, rollBar, dishMast, dish);
    applyCartoonInkOutlines(rover, 1.04, true);
    return { rover, wheels };
}

export function buildLunarStuntHoopMesh() {
    const group = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.55, 10, 28), ringMat);
    const inner = new THREE.Mesh(
        new THREE.TorusGeometry(4.4, 0.22, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 })
    );
    group.add(ring, inner);
    return { group, ringMat };
}

export function getMoonSurfaceHeight(x: number, z: number): number {
    // Keep central Landing Pad & Lunar Outpost area smoothly level
    const centerDist = Math.hypot(x, z + 10);
    const flatBlend = THREE.MathUtils.clamp((centerDist - 36) / 22, 0, 1);

    let h = (Math.sin(x * 0.025) * Math.cos(z * 0.025) * 1.6 + Math.sin(x * 0.06 + z * 0.05) * 0.55) * flatBlend;

    for (let i = 0; i < MOON_CRATERS.length; i++) {
        const c = MOON_CRATERS[i];
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < c.r * 1.45) {
            const norm = d / c.r;
            if (norm < 1.0) {
                // Smooth bowl interior
                h -= c.depth * Math.cos(norm * Math.PI * 0.5);
            }
            // Raised crater rim ring near norm = 1.0
            const rimDelta = (norm - 1.0) / 0.24;
            h += c.rim * Math.exp(-rimDelta * rimDelta);
        }
    }

    // Gentle outer crater basin wall near edge of playable moon plateau
    const edgeDist = Math.hypot(x, z);
    if (edgeDist > MOON_WORLD_RADIUS - 26) {
        const t = THREE.MathUtils.clamp((edgeDist - (MOON_WORLD_RADIUS - 26)) / 26, 0, 1);
        h += t * t * 14.0;
    }

    // Keep lunar terrain baseline well above y=0 so surface ocean water checks never trigger in craters
    return h + 6.0;
}

function createMoonRegolithTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle regolith patches & micro-craters
    for (let i = 0; i < 95; i++) {
        const rx = ((i * 73) % 512);
        const ry = ((i * 137) % 512);
        const rad = 6 + (i % 18);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(100, 116, 139, 0.35)' : 'rgba(203, 213, 225, 0.26)';
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fill();
        if (i % 3 === 0) {
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rx, ry, rad * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    return tex;
}

function buildMoonWorld() {
    if (_moonBuilt) return;
    _moonBuilt = true;

    moonScene.background = new THREE.Color(0x030712);
    moonScene.fog = new THREE.FogExp2(0x050b18, 0.0016);

    // Crisp Lunar Sunlight + Cool Earthshine Ambient
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x334155, 0.85);
    moonScene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sun.position.set(140, 180, -110);
    moonScene.add(sun);

    // Deep Space Starfield Dome
    const starCount = 1100;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(0.05 + Math.random() * 0.95);
        const rad = 520 + Math.random() * 140;
        starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * rad;
        starPositions[i * 3 + 1] = Math.cos(phi) * rad;
        starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * rad;
        const tint = Math.random();
        const col = tint < 0.2 ? new THREE.Color(0x7dd3fc) : (tint < 0.35 ? new THREE.Color(0xfef08a) : new THREE.Color(0xffffff));
        starColors[i * 3] = col.r;
        starColors[i * 3 + 1] = col.g;
        starColors[i * 3 + 2] = col.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ size: 2.8, vertexColors: true, transparent: true, opacity: 0.95, fog: false })
    );
    moonScene.add(stars);

    // Dramatic Earthrise Hanging in the Lunar Sky
    const earthGroup = new THREE.Group();
    earthGroup.position.set(-140, 165, -340);
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 256;
    earthCanvas.height = 128;
    const ectx = earthCanvas.getContext('2d')!;
    ectx.fillStyle = '#0284c7';
    ectx.fillRect(0, 0, 256, 128);
    ectx.fillStyle = '#22c55e';
    ectx.beginPath(); ectx.ellipse(72, 52, 34, 22, 0.3, 0, Math.PI * 2); ectx.fill();
    ectx.beginPath(); ectx.ellipse(165, 62, 42, 26, -0.2, 0, Math.PI * 2); ectx.fill();
    ectx.beginPath(); ectx.ellipse(122, 92, 22, 14, 0.1, 0, Math.PI * 2); ectx.fill();
    ectx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ectx.fillRect(0, 0, 256, 14);
    ectx.fillRect(0, 114, 256, 14);
    ectx.beginPath(); ectx.ellipse(105, 44, 48, 8, 0.12, 0, Math.PI * 2); ectx.fill();
    ectx.beginPath(); ectx.ellipse(190, 78, 36, 7, -0.1, 0, Math.PI * 2); ectx.fill();
    const earthTex = new THREE.CanvasTexture(earthCanvas);

    const earthSphere = new THREE.Mesh(
        new THREE.SphereGeometry(54, 28, 20),
        new THREE.MeshBasicMaterial({ map: earthTex, fog: false })
    );
    const earthHalo = new THREE.Mesh(
        new THREE.SphereGeometry(58, 24, 18),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2, side: THREE.BackSide, fog: false })
    );
    earthGroup.add(earthSphere, earthHalo);
    moonScene.add(earthGroup);
    _moonAnimated.push({ obj: earthSphere, kind: 'SLOW_SPIN', baseY: 0, phase: 0 });

    // Sculpted Lunar Terrain Mesh
    const segs = 96;
    const size = MOON_WORLD_RADIUS * 2.2;
    const terrainGeo = new THREE.PlaneGeometry(size, size, segs, segs);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        posAttr.setY(i, getMoonSurfaceHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();
    const matMoonGround = new THREE.MeshToonMaterial({
        color: 0xdbeafe,
        map: createMoonRegolithTexture(),
        gradientMap: toonGrad4
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, matMoonGround);
    moonScene.add(terrainMesh);

    // Sigma Lunar Landing Pad & Parked Starship Sigma
    const padGroup = new THREE.Group();
    const padY = getMoonSurfaceHeight(MOON_SIGMA_POS.x, MOON_SIGMA_POS.z);
    padGroup.position.set(MOON_SIGMA_POS.x, padY, MOON_SIGMA_POS.z);
    const padBase = new THREE.Mesh(
        new THREE.CylinderGeometry(18.5, 20.5, 0.6, 32),
        matDarkSteel
    );
    padBase.position.y = 0.25;
    const padGlow = new THREE.Mesh(
        new THREE.RingGeometry(15.2, 17.6, 36).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
    );
    padGlow.position.y = 0.58;
    padGroup.add(padBase, padGlow);
    applyCartoonInkOutlines(padBase, 1.02, true);
    moonScene.add(padGroup);

    _moonSigmaRoot = buildCrashedSpaceshipSigma(moonScene, _moonAnimated, _moonColliders, {
        originX: MOON_SIGMA_POS.x,
        originZ: MOON_SIGMA_POS.z,
        includeDiorama: false,
        flatLevel: true
    });
    _moonSigmaRoot.position.y = padY + 0.5;
    if (_moonSigmaRoot.userData?.sigmaControl) {
        _moonSigmaRoot.userData.sigmaControl.setRepairStage(3);
    }

    // Griffin Rock Lunar Outpost (Geodesic Dome + Solar Wings + Comms Dish)
    const outX = 36;
    const outZ = -8;
    const outY = getMoonSurfaceHeight(outX, outZ);
    const { outpostGroup, dishPivot } = buildLunarOutpostMesh();
    outpostGroup.position.set(outX, outY, outZ);
    _moonCommsDish = dishPivot;
    moonScene.add(outpostGroup);
    _moonColliders.push({ x: outX, z: outZ, r: 12.0 });

    // Driveable Griffin Rock Lunar Rover parked beside Lunar Outpost
    const roverBuilt = buildLunarRoverMesh();
    _moonRoverGroup = roverBuilt.rover;
    _moonRoverWheels = roverBuilt.wheels;
    _moonRoverPos.set(20, getMoonSurfaceHeight(20, -18), -18);
    _moonRoverGroup.position.copy(_moonRoverPos);
    moonScene.add(_moonRoverGroup);

    // 6-Hoop Low-Gravity Crater Stunt Course
    _moonHoops.length = 0;
    MOON_HOOP_COORDS.forEach(hc => {
        const hy = getMoonSurfaceHeight(hc.x, hc.z) + hc.h;
        const { group, ringMat } = buildLunarStuntHoopMesh();
        group.position.set(hc.x, hy, hc.z);
        group.lookAt(0, hy, 0);
        moonScene.add(group);
        _moonHoops.push({ x: hc.x, y: hy, z: hc.z, group, ringMat, cleared: false });
    });

    // Interactive Rescue Bots Lunar Flagpole
    const flagGroup = new THREE.Group();
    const flagY = getMoonSurfaceHeight(MOON_FLAG_POS.x, MOON_FLAG_POS.z);
    flagGroup.position.set(MOON_FLAG_POS.x, flagY, MOON_FLAG_POS.z);
    const flagBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 0.6, 12), matDarkSteel);
    flagBase.position.y = 0.3;
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10.5, 8), matChrome);
    flagPole.position.y = 5.25;
    const flagBanner = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.7, 0.14), matEmblem);
    flagBanner.position.set(2.4, progression.moonFlagPlanted ? 8.8 : 2.8, 0);
    _moonFlagBanner = flagBanner;
    const flagRing = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 3.4, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    flagRing.position.y = 0.16;
    flagGroup.add(flagBase, flagPole, flagBanner, flagRing);
    applyCartoonInkOutlines(flagPole, 1.04, true);
    moonScene.add(flagGroup);

    // 4 Low-Gravity Crater Jump Pads
    MOON_JUMP_PADS.forEach((pad, idx) => {
        const py = getMoonSurfaceHeight(pad.x, pad.z);
        const jp = new THREE.Group();
        jp.position.set(pad.x, py, pad.z);
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(3.8, 4.4, 0.45, 20),
            matDarkSteel
        );
        disc.position.y = 0.22;
        const glow = new THREE.Mesh(
            new THREE.RingGeometry(1.6, 3.4, 24).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
        );
        glow.position.y = 0.48;
        const chev = new THREE.Mesh(
            new THREE.TorusGeometry(2.4, 0.14, 8, 20).rotateX(Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.7 })
        );
        chev.position.y = 1.4;
        jp.add(disc, glow, chev);
        moonScene.add(jp);
        _moonAnimated.push({ obj: chev, kind: 'SPIN_PULSE', baseY: 1.4, phase: idx * 1.1 });
    });

    // Modeled 3D Lunar Cave Entrance (Basalt Arch Tunnel into Tranquility Caverns)
    const caveY = getMoonSurfaceHeight(MOON_CAVE_POS.x, MOON_CAVE_POS.z);
    const moonCaveMesh = buildSurfaceCaveEntranceMesh(0x64748b, 0x38bdf8, false);
    moonCaveMesh.position.set(MOON_CAVE_POS.x, caveY, MOON_CAVE_POS.z);
    moonCaveMesh.rotation.y = Math.atan2(-MOON_CAVE_POS.x, -MOON_CAVE_POS.z); // Faces directly toward central landing zone!
    const moonCaveBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 1.4, 38, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    moonCaveBeam.position.set(0, 21, 1.5);
    moonCaveBeam.userData.noOutline = true;
    moonCaveMesh.add(moonCaveBeam);
    moonScene.add(moonCaveMesh);
    _moonColliders.push({ x: MOON_CAVE_POS.x - 5.2, z: MOON_CAVE_POS.z - 3.2, r: 2.8 });
    _moonColliders.push({ x: MOON_CAVE_POS.x + 2.6, z: MOON_CAVE_POS.z - 5.2, r: 2.8 });

    // 2 Scanable Lunar Monoliths
    _moonMonoliths.length = 0;
    const scannedMono: string[] = Array.isArray(progression.planetMonolithsScanned) ? progression.planetMonolithsScanned : [];
    [
        { id: 'MOON_MONO_1', name: 'Apollo-Sigma Tranquility Plaque', x: -116, z: -26 },
        { id: 'MOON_MONO_2', name: 'Cybertronian Lunar Obelisk', x: 124, z: 74 }
    ].forEach(mc => {
        const my = getMoonSurfaceHeight(mc.x, mc.z);
        const mg = new THREE.Group();
        mg.position.set(mc.x, my, mc.z);
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 0.8, 8), matDarkSteel);
        plinth.position.y = 0.4;
        const obelisk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10.5, 1.4), matDarkSteel);
        obelisk.position.y = 5.6;
        const already = scannedMono.includes(mc.id);
        const beaconMat = new THREE.MeshBasicMaterial({ color: already ? 0x4ade80 : 0x38bdf8 });
        const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.2, 1.56), beaconMat);
        glyph.position.y = 5.4;
        glyph.userData.noOutline = true;
        mg.add(plinth, obelisk, glyph);
        applyCartoonInkOutlines(obelisk, 1.03, true);
        moonScene.add(mg);
        _moonColliders.push({ x: mc.x, z: mc.z, r: 2.6 });
        _moonMonoliths.push({ id: mc.id, name: mc.name, x: mc.x, z: mc.z, beaconMat, scanned: already });
    });

    // Scattered Lunar Boulders & Glowing Crystal Clusters (solid colliders, destroyable by Boulder!)
    _moonRocks.length = 0;
    const matMoonRock = new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 });
    const matMoonCrystal = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 68; i++) {
        const ang = (i / 68) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 62 + ((i * 43) % 250);
        const rx = Math.cos(ang) * dist;
        const rz = Math.sin(ang) * dist;
        if (Math.hypot(rx - MOON_CAVE_POS.x, rz - MOON_CAVE_POS.z) < 16) continue;
        const ry = getMoonSurfaceHeight(rx, rz);
        const rad = 1.4 + (i % 4) * 0.7;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), matMoonRock);
        rock.position.set(rx, ry + rad * 0.55, rz);
        rock.rotation.set(i * 0.4, i * 0.9, 0.2);
        applyCartoonInkOutlines(rock, 1.04, true);
        moonScene.add(rock);
        let crystal: THREE.Mesh | undefined;
        if (i % 6 === 0) {
            crystal = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.8, 5), matMoonCrystal);
            crystal.position.set(rx + 1.4, ry + 1.3, rz + 0.8);
            crystal.rotation.z = 0.22;
            moonScene.add(crystal);
        }
        _moonRocks.push({
            mesh: rock,
            crystal,
            x: rx,
            y: ry,
            z: rz,
            r: rad * 0.95,
            destroyed: false
        });
    }

    // 5 Collectible Lunar Relics
    _moonRelics.length = 0;
    const foundRelics: string[] = Array.isArray(progression.moonRelicsFound) ? progression.moonRelicsFound : [];
    MOON_RELIC_DEFS.forEach((def, idx) => {
        const ry = getMoonSurfaceHeight(def.x, def.z);
        const grp = new THREE.Group();
        grp.position.set(def.x, ry, def.z);

        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.8, 28, 12, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
        );
        beam.position.y = 14.0;

        const spinner = new THREE.Group();
        spinner.position.y = 2.8;
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 0), matOptimusGold);
        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(2.0, 0.15, 8, 20),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        spinner.add(star, halo);
        grp.add(beam, spinner);

        const isFound = foundRelics.includes(def.id);
        grp.visible = !isFound;
        moonScene.add(grp);
        _moonRelics.push({
            ...def,
            group: grp,
            spinner,
            collected: isFound
        });
        _moonAnimated.push({ obj: spinner, kind: 'SPIN_PULSE', baseY: 2.8, phase: idx * 0.9 });
    });
}

export function syncMoonBotRigs() {
    const rigs = botRigs;
    if (!rigs) return;
    if (worldState.activeArea === 'MOON') {
        Object.keys(rigs).forEach(k => {
            const rig = rigs[k];
            if (!rig || !rig.root) return;
            const keepOnMoon = (k === player.botType || k === buddyBot.botType);
            if (keepOnMoon && rig.root.parent !== moonScene) {
                moonScene.add(rig.root);
            } else if (!keepOnMoon && rig.root.parent !== scene) {
                rig.root.visible = false;
                scene.add(rig.root);
            }
        });
    } else if (worldState.activeArea === 'SURFACE') {
        Object.keys(rigs).forEach(k => {
            const rig = rigs[k];
            if (rig && rig.root && rig.root.parent !== scene) {
                scene.add(rig.root);
            }
        });
    }
}

export function updateMoonHUD() {
    if (typeof document === 'undefined') return;
    const isMoon = worldState.activeArea === 'MOON';
    const moonPill = document.getElementById('moon-hud-pill');
    const relicEl = document.getElementById('moon-stat-relics');
    const moonOrbitBtn = document.getElementById('moon-orbit-btn');
    const moonEarthBtn = document.getElementById('moon-earth-btn');
    const planetSolarBtn = document.getElementById('planet-solar-btn');

    if (worldState.activeArea !== 'PLANET_SURFACE') {
        if (moonPill) moonPill.classList.toggle('hidden', !isMoon);
        if (moonOrbitBtn) {
            moonOrbitBtn.classList.toggle('hidden', !(isMoon && !worldState.spaceLaunch?.active));
            const span = moonOrbitBtn.querySelector('span:last-child');
            if (isMoon && span) span.textContent = 'LAUNCH TO ORBIT';
        }
        if (moonEarthBtn) {
            moonEarthBtn.classList.toggle('hidden', !(isMoon && !worldState.spaceLaunch?.active));
        }
        if (planetSolarBtn) {
            planetSolarBtn.classList.toggle('hidden', !(isMoon && !worldState.spaceLaunch?.active));
        }
    }
    if (relicEl && isMoon) {
        const count = Array.isArray(progression.moonRelicsFound) ? progression.moonRelicsFound.length : 0;
        relicEl.textContent = `${count} / ${MOON_RELIC_DEFS.length}`;
        const gravEl = document.getElementById('moon-stat-gravity');
        if (gravEl) gravEl.textContent = '0.35G';
    }
}

export function swapToMoon() {
    buildMoonWorld();
    if (renderer && camera) {
        try {
            renderer.compile(moonScene, camera);
        } catch (e) {
            console.warn('Moon shader pre-compile skipped:', e);
        }
    }

    worldState.activeArea = 'MOON';
    worldState.nearSigmaShip = false;
    worldState.nearMoonLanding = false;

    const spawnX = 0;
    const spawnZ = 4;
    const spawnY = getMoonSurfaceHeight(spawnX, spawnZ);
    player.pos.set(spawnX, spawnY, spawnZ);
    player.heading = 0;
    player.speed = 0;
    player.vy = 0;
    player.flightAlt = 0;
    player.grounded = true;
    player.hasWaypoint = false;
    player.boatMorph = 0;
    player.targetBoatMorph = 0;

    if (buddyBot && buddyBot.pos) {
        const by = getMoonSurfaceHeight(spawnX + 6, spawnZ + 4);
        buddyBot.pos.set(spawnX + 6, by, spawnZ + 4);
        buddyBot.heading = 0;
        buddyBot.speed = 0;
        buddyBot.flightAlt = 0;
    }

    syncMoonBotRigs();
    const wp = window.waypointGroup;
    if (wp) {
        moonScene.add(wp);
        wp.visible = false;
    }
    setActiveParticleScene(moonScene);

    if (camera) {
        camera.position.set(0, spawnY + 14, spawnZ + 28);
        camera.lookAt(spawnX, spawnY + 3.2, spawnZ);
    }

    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = 'LUNAR OUTPOST ALPHA';

    // Hide space flight bar & cavern pill, show regular bot HUD
    const spaceBar = document.getElementById('space-controls-bar');
    if (spaceBar) spaceBar.classList.add('hidden');
    const spacePill = document.getElementById('space-hud-pill');
    if (spacePill) spacePill.classList.add('hidden');
    const cavernPill = document.getElementById('cavern-hud-pill');
    if (cavernPill) cavernPill.classList.add('hidden');
    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn) sigmaBtn.classList.add('hidden');
    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.remove('hidden');

    updateMoonHUD();
    if (typeof window.syncHUDToActiveBot === 'function') (window.syncHUDToActiveBot as () => void)();
    if (typeof window.renderMinimap === 'function') window.renderMinimap();

    showToast('TOUCHDOWN ON THE MOON!', 'Low-gravity 0.35G active! Jump high, explore craters & find 5 Lunar Relics!');
    triggerNPCSpeech(
        'BLADES',
        'Aerial Recon',
        'Whoa! We are on the Moon! Try jumping—the low gravity lets us soar right over craters!',
        player as unknown as SpeechTarget,
        true
    );
}

function destroyMoonRock(rock: MoonRockRuntime) {
    if (rock.destroyed) return;
    rock.destroyed = true;
    rock.mesh.visible = false;
    if (rock.crystal) {
        rock.crystal.visible = false;
        progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
        saveProgression();
        spawnSparkleGlints(rock.x, rock.y + 1.8, rock.z, 14);
    }
    sfx.playRockBreak();
    spawnBurstParticles(rock.x, rock.y + 1.4, rock.z, 0x94a3b8, 14, 0.55);
}

export function checkMoonBoulderStrike(x: number, y: number, z: number, heading: number, radius = 10.5): number {
    if (!_moonBuilt || worldState.activeArea !== 'MOON') return 0;
    const fx = x + Math.sin(heading) * 3.5;
    const fz = z + Math.cos(heading) * 3.5;
    let shattered = 0;
    for (let i = 0; i < _moonRocks.length; i++) {
        const rock = _moonRocks[i];
        if (rock.destroyed) continue;
        const distSelf = Math.hypot(x - rock.x, z - rock.z);
        const distFront = Math.hypot(fx - rock.x, fz - rock.z);
        if (Math.min(distSelf, distFront) <= radius + rock.r) {
            destroyMoonRock(rock);
            shattered++;
        }
    }
    if (shattered > 0) {
        showToast('LUNAR BOULDER SMASHED!', `Boulder crushed ${shattered} moon rock${shattered > 1 ? 's' : ''}!`);
    }
    return shattered;
}

export function resolveMoonCollisions(pos: THREE.Vector3, radius: number, isPlayer = false) {
    // Clamp inside Moon playable plateau
    const dist = Math.hypot(pos.x, pos.z);
    const maxR = MOON_WORLD_RADIUS - 6;
    if (dist > maxR) {
        const s = maxR / dist;
        pos.x *= s;
        pos.z *= s;
    }
    // 2-pass resolution against Starship Sigma (fuselage + swept wings) & Lunar Outpost Alpha
    for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < _moonColliders.length; i++) {
            const c = _moonColliders[i];
            const groundY = getMoonSurfaceHeight(c.x, c.z);
            if (pos.y > groundY + 11.5) continue;
            const dx = pos.x - c.x;
            const dz = pos.z - c.z;
            const minDist = c.r + radius;
            const dSq = dx * dx + dz * dz;
            if (dSq < minDist * minDist) {
                const d = dSq > 1e-4 ? Math.sqrt(dSq) : 0;
                const nx = d > 0 ? dx / d : 0;
                const nz = d > 0 ? dz / d : 1;
                const push = minDist - d;
                pos.x += nx * push;
                pos.z += nz * push;
                if (isPlayer && pass === 0) {
                    if (player.hasWaypoint) {
                        const wpDist = Math.hypot(player.waypoint.x - c.x, player.waypoint.z - c.z);
                        if (wpDist <= c.r + radius) {
                            player.hasWaypoint = false;
                            if (window.waypointGroup) window.waypointGroup.visible = false;
                            player.speed = 0;
                        } else {
                            pos.x += -nz * 0.14;
                            pos.z += nx * 0.14;
                        }
                    } else if (player.speed > 4.0) {
                        player.speed *= 0.65;
                    }
                }
            }
        }
    }
    // Collide against lunar boulders (and shatter on Boulder Scoop/Smash impact!)
    const canSmash = isPlayer && player.botType === 'BOULDER' && (player.scoopTimer > 0 || player.smashTimer > 0);
    for (let i = 0; i < _moonRocks.length; i++) {
        const rock = _moonRocks[i];
        if (rock.destroyed) continue;
        // Allow jumping cleanly over rocks when airborne
        if (pos.y > rock.y + rock.r * 1.9 + 0.6) continue;
        const dx = pos.x - rock.x;
        const dz = pos.z - rock.z;
        const minDist = rock.r + radius;
        const dSq = dx * dx + dz * dz;
        if (dSq < minDist * minDist && dSq > 1e-4) {
            if (canSmash) {
                destroyMoonRock(rock);
                continue;
            }
            const d = Math.sqrt(dSq);
            const push = minDist - d;
            pos.x += (dx / d) * push;
            pos.z += (dz / d) * push;
        }
    }
}

export function updateMoon(dt: number, now: number) {
    if (!_moonBuilt || worldState.activeArea !== 'MOON') return;
    const nowSec = now * 0.001;
    if (_moonJumpCooldown > 0) _moonJumpCooldown = Math.max(0, _moonJumpCooldown - dt);

    // Animate Earthrise, comms dish, jump pads & relics
    if (_moonCommsDish) _moonCommsDish.rotation.y += dt * 0.65;
    for (let i = 0; i < _moonAnimated.length; i++) {
        const am = _moonAnimated[i];
        if (am.kind === 'SPIN_PULSE') {
            am.obj.rotation.y += dt * 1.5;
            am.obj.position.y = am.baseY + Math.sin(nowSec * 2.8 + am.phase) * 0.45;
        } else if (am.kind === 'SLOW_SPIN') {
            am.obj.rotation.y += dt * 0.04;
        } else if (am.kind === 'FLICKER') {
            const sc = 0.85 + Math.sin(nowSec * 14.0 + am.phase) * 0.15;
            am.obj.scale.setScalar(sc);
        }
    }

    // Smoothly raise flag if planted
    if (_moonFlagBanner) {
        const targetY = progression.moonFlagPlanted ? 8.8 : 2.8;
        _moonFlagBanner.position.y = THREE.MathUtils.lerp(_moonFlagBanner.position.y, targetY, Math.min(1, dt * 4.5));
    }

    // Check Flagpole Planting Interaction
    const distFlag = Math.hypot(player.pos.x - MOON_FLAG_POS.x, player.pos.z - MOON_FLAG_POS.z);
    if (!progression.moonFlagPlanted && distFlag < 8.5) {
        progression.moonFlagPlanted = true;
        saveProgression({ immediate: true });
        sfx.playRankUp();
        spawnSparkleGlints(MOON_FLAG_POS.x, getMoonSurfaceHeight(MOON_FLAG_POS.x, MOON_FLAG_POS.z) + 6, MOON_FLAG_POS.z, 26);
        showToast('RESCUE BOTS FLAG PLANTED!', '+6 Hero Points! Griffin Rock Lunar Outpost is officially claimed!');
        triggerNPCSpeech(
            'OPTIMUS',
            'Autobot Commander',
            'One giant leap for Griffin Rock and all Rescue Bots!',
            player as unknown as SpeechTarget,
            true
        );
    }

    // Check Low-Gravity Crater Jump Pads
    if (_moonJumpCooldown <= 0) {
        for (let i = 0; i < MOON_JUMP_PADS.length; i++) {
            const pad = MOON_JUMP_PADS[i];
            if (Math.hypot(player.pos.x - pad.x, player.pos.z - pad.z) < 4.5) {
                player.vy = 26.0;
                player.grounded = false;
                _moonJumpCooldown = 1.2;
                sfx.playStuntChime();
                spawnBurstParticles(pad.x, player.pos.y + 0.8, pad.z, 0x22d3ee, 14, 0.55);
                showToast('LUNAR SUPER-BOOST!', 'Soaring in 0.35G low gravity!');
                break;
            }
        }
    }

    // Check Collectible Lunar Relics
    for (let i = 0; i < _moonRelics.length; i++) {
        const relic = _moonRelics[i];
        if (relic.collected) continue;
        if (Math.hypot(player.pos.x - relic.x, player.pos.z - relic.z) < 6.5) {
            relic.collected = true;
            relic.group.visible = false;
            if (!Array.isArray(progression.moonRelicsFound)) progression.moonRelicsFound = [];
            if (!progression.moonRelicsFound.includes(relic.id)) {
                progression.moonRelicsFound.push(relic.id);
            }
            saveProgression({ immediate: true });
            sfx.playRelicFound();
            spawnSparkleGlints(relic.x, getMoonSurfaceHeight(relic.x, relic.z) + 3.0, relic.z, 24);
            const cnt = progression.moonRelicsFound.length;
            showToast(
                `LUNAR RELIC FOUND (${cnt}/${MOON_RELIC_DEFS.length})!`,
                `${relic.name} collected! +5 Hero Points!`
            );
            updateMoonHUD();
        }
    }

    // Modeled 3D Lunar Cave Entrance Check
    if (_moonCaveCooldown > 0) _moonCaveCooldown -= dt;
    const distCave = Math.hypot(player.pos.x - MOON_CAVE_POS.x, player.pos.z - MOON_CAVE_POS.z);
    worldState.nearPlanetCaveEntrance = distCave < 14.0;
    if (_moonCaveCooldown <= 0 && distCave < 5.6 && _moonCaveEnterHandler) {
        _moonCaveCooldown = 2.2;
        _moonCaveEnterHandler();
        return;
    }

    // Scanable Lunar Monoliths
    for (let i = 0; i < _moonMonoliths.length; i++) {
        const m = _moonMonoliths[i];
        if (m.scanned) continue;
        if (Math.hypot(player.pos.x - m.x, player.pos.z - m.z) < 9.5) {
            m.scanned = true;
            m.beaconMat.color.setHex(0x4ade80);
            if (!Array.isArray(progression.planetMonolithsScanned)) progression.planetMonolithsScanned = [];
            if (!progression.planetMonolithsScanned.includes(m.id)) {
                progression.planetMonolithsScanned.push(m.id);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 4;
                saveProgression({ immediate: true });
            }
            sfx.playCavernDiscovery();
            spawnSparkleGlints(m.x, player.pos.y + 4, m.z, 20);
            showToast('LUNAR MONOLITH SCANNED!', `${m.name} logged in Galactic Passport! +4 Energon!`);
            triggerNPCSpeech('CHASE', 'Recon Specialist', `Lunar scan complete! ${m.name} archived in our Galactic Log!`, player as unknown as SpeechTarget, true);
        }
    }

    // Proximity to Parked Sigma for Launch-to-Orbit highlight
    const distSigma = Math.hypot(player.pos.x - MOON_SIGMA_POS.x, player.pos.z - MOON_SIGMA_POS.z);
    worldState.nearMoonSigma = distSigma < 28.0;

    // Driveable Lunar Rover Boarding & Riding
    if (_roverToggleCooldown > 0) _roverToggleCooldown = Math.max(0, _roverToggleCooldown - dt);
    if (_moonRoverGroup) {
        if (!_inLunarRover) {
            const dRover = Math.hypot(player.pos.x - _moonRoverPos.x, player.pos.z - _moonRoverPos.z);
            if (_roverToggleCooldown <= 0 && dRover < 5.5) {
                _inLunarRover = true;
                _roverToggleCooldown = 2.5;
                sfx.playStuntChime();
                showToast('LUNAR ROVER BOARDED!', 'Cruising the Moon in the 6-wheel Griffin Rock Lunar Rover!');
            }
        } else {
            _moonRoverPos.set(player.pos.x, player.pos.y, player.pos.z);
            _moonRoverGroup.position.copy(_moonRoverPos);
            _moonRoverGroup.rotation.y = player.heading;
            player.energonBoostTimer = Math.max(player.energonBoostTimer || 0, 0.15);
            for (let w = 0; w < _moonRoverWheels.length; w++) {
                _moonRoverWheels[w].rotation.x += player.speed * dt * 0.8;
            }
            if (_roverToggleCooldown <= 0 && distSigma < 22.0) {
                _inLunarRover = false;
                _roverToggleCooldown = 2.5;
                _moonRoverPos.set(18, getMoonSurfaceHeight(18, -18), -18);
                _moonRoverGroup.position.copy(_moonRoverPos);
                showToast('LUNAR ROVER PARKED', 'Returned Lunar Rover to Outpost berth.');
            }
        }
    }

    // 6-Hoop Low-Gravity Crater Stunt Course
    for (let i = 0; i < _moonHoops.length; i++) {
        const hp = _moonHoops[i];
        hp.group.children[1].rotation.z += dt * 1.8;
        if (!hp.cleared) {
            const d3 = Math.hypot(player.pos.x - hp.x, player.pos.y - hp.y, player.pos.z - hp.z);
            if (d3 < 7.2) {
                hp.cleared = true;
                hp.ringMat.color.setHex(0x4ade80);
                progression.totalStuntsCompleted = (progression.totalStuntsCompleted || 0) + 1;
                progression.moonHoopsCleared = (progression.moonHoopsCleared || 0) + 1;
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 2;
                saveProgression();
                sfx.playStuntChime();
                spawnSparkleGlints(hp.x, hp.y, hp.z, 18);
                showToast('LUNAR SKY STUNT!', '+2 Energon Cubes & +2 Hero Points!');
            }
        }
    }
}

export function getNearestMoonDiscovery() {
    const candidates: Array<{ name: string; kind: string; x: number; z: number; color: string }> = [];
    _moonRelics.forEach(r => {
        if (!r.collected) candidates.push({ name: r.name, kind: 'RELIC', x: r.x, z: r.z, color: '#fbbf24' });
    });
    _moonMonoliths.forEach(m => {
        if (!m.scanned) candidates.push({ name: m.name, kind: 'MONOLITH', x: m.x, z: m.z, color: '#c084fc' });
    });
    candidates.push({ name: 'Lunar Cave Entrance', kind: 'CAVE', x: MOON_CAVE_POS.x, z: MOON_CAVE_POS.z, color: '#f97316' });
    let best: { name: string; kind: string; x: number; z: number; dist: number; color: string } | null = null;
    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z);
        if (!best || d < best.dist) best = { ...c, dist: d };
    }
    return best;
}

export function getMoonMapData() {
    return {
        radius: MOON_WORLD_RADIUS,
        craters: MOON_CRATERS,
        sigmaPos: MOON_SIGMA_POS,
        cavePos: MOON_CAVE_POS,
        flagPos: MOON_FLAG_POS,
        roverPos: _moonRoverPos,
        hoops: _moonHoops,
        relics: _moonRelics,
        monoliths: _moonMonoliths,
        jumpPads: MOON_JUMP_PADS
    };
}

setMoonTerrainHooks({
    isActive: () => worldState.activeArea === 'MOON',
    getSurfaceHeight: (x: number, z: number) => getMoonSurfaceHeight(x, z),
    getZoneName: (x: number, z: number) => {
        if (Math.hypot(x - MOON_SIGMA_POS.x, z - MOON_SIGMA_POS.z) < 30) return 'SIGMA LUNAR PAD';
        if (Math.hypot(x - 36, z + 8) < 28) return 'LUNAR OUTPOST ALPHA';
        return 'TRANQUILITY CRATER BASIN';
    }
});

if (typeof window !== 'undefined') {
    Object.assign(window, {
        moonScene,
        swapToMoon,
        getMoonSurfaceHeight,
        getMoonMapData,
        checkMoonBoulderStrike,
        enterMoonCave,
        getMoonRocks: () => _moonRocks
    });
}

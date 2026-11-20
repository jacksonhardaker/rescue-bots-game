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
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { SVG_ICONS } from '../ui/icons.js';

export const moonScene = new THREE.Scene();
export const MOON_WORLD_RADIUS = 185;
export const MOON_SIGMA_POS = { x: 0, z: -28 };
export const MOON_FLAG_POS = { x: 20, z: 6 };

interface CraterDef {
    x: number;
    z: number;
    r: number;
    depth: number;
    rim: number;
}

const MOON_CRATERS: CraterDef[] = [
    { x: -68, z: -56, r: 28, depth: 3.4, rim: 2.1 },
    { x: 76, z: -64, r: 32, depth: 3.8, rim: 2.4 },
    { x: -82, z: 64, r: 34, depth: 4.0, rim: 2.5 },
    { x: 64, z: 78, r: 26, depth: 3.2, rim: 2.0 },
    { x: 0, z: 112, r: 30, depth: 3.6, rim: 2.2 },
    { x: -124, z: -4, r: 22, depth: 2.6, rim: 1.7 },
    { x: 126, z: 12, r: 24, depth: 2.8, rim: 1.8 }
];

export interface MoonRelicDef {
    id: string;
    name: string;
    x: number;
    z: number;
}

export const MOON_RELIC_DEFS: MoonRelicDef[] = [
    { id: 'TYCHO_CRYSTAL', name: 'Tycho Energon Shard', x: -68, z: -56 },
    { id: 'TRANQUILITY_CORE', name: 'Tranquility Star Core', x: 76, z: -64 },
    { id: 'LUNAR_CREST', name: 'Cybertronian Lunar Crest', x: -82, z: 64 },
    { id: 'ORBITAL_PRISM', name: 'Moonbeam Energon Prism', x: 64, z: 78 },
    { id: 'POLAR_BEACON', name: 'South Rim Star Relic', x: 0, z: 112 }
];

const MOON_JUMP_PADS = [
    { x: -34, z: -18 },
    { x: 42, z: -34 },
    { x: -42, z: 42 },
    { x: 36, z: 48 }
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

const _moonAnimated: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];
const _moonRelics: MoonRelicRuntime[] = [];
const _moonRocks: MoonRockRuntime[] = [];
const _moonColliders: Array<{ x: number; z: number; r: number }> = [];
let _moonBuilt = false;
let _moonSigmaRoot: THREE.Group | null = null;
let _moonFlagBanner: THREE.Mesh | null = null;
let _moonCommsDish: THREE.Object3D | null = null;
let _moonJumpCooldown = 0;

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
    const outpostGroup = new THREE.Group();
    const outX = 36;
    const outZ = -8;
    const outY = getMoonSurfaceHeight(outX, outZ);
    outpostGroup.position.set(outX, outY, outZ);

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

    // Solar Wing Arrays
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

    // Rotating Comms Dish
    const dishPivot = new THREE.Group();
    dishPivot.position.set(0, 11.6, 0);
    const dish = new THREE.Mesh(
        new THREE.ConeGeometry(3.4, 1.5, 14, 1, true),
        matChrome
    );
    dish.rotation.x = Math.PI * 0.65;
    const dishTip = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    dishTip.position.set(0, 0.8, 1.6);
    dishTip.userData.noOutline = true;
    dishPivot.add(dish, dishTip);
    _moonCommsDish = dishPivot;

    outpostGroup.add(domeBase, domeShell, domeStripe, airlock, airlockDoor, dishPivot);
    applyCartoonInkOutlines(outpostGroup, 1.03, true);
    moonScene.add(outpostGroup);
    _moonColliders.push({ x: outX, z: outZ, r: 12.0 });

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

    // Scattered Lunar Boulders & Glowing Crystal Clusters (solid colliders, destroyable by Boulder!)
    _moonRocks.length = 0;
    const matMoonRock = new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 });
    const matMoonCrystal = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 42; i++) {
        const ang = (i / 42) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 46 + ((i * 29) % 120);
        const rx = Math.cos(ang) * dist;
        const rz = Math.sin(ang) * dist;
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
    if (!botRigs) return;
    if (worldState.activeArea === 'MOON') {
        Object.keys(botRigs).forEach(k => {
            const rig = botRigs[k];
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
        Object.keys(botRigs).forEach(k => {
            const rig = botRigs[k];
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

    if (moonPill) moonPill.classList.toggle('hidden', !isMoon);
    if (relicEl) {
        const count = Array.isArray(progression.moonRelicsFound) ? progression.moonRelicsFound.length : 0;
        relicEl.textContent = `${count} / ${MOON_RELIC_DEFS.length}`;
    }
    if (moonOrbitBtn) {
        moonOrbitBtn.classList.toggle('hidden', !(isMoon && !worldState.spaceLaunch?.active));
    }
    if (moonEarthBtn) {
        moonEarthBtn.classList.toggle('hidden', !(isMoon && !worldState.spaceLaunch?.active));
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
    if (typeof (window as any).syncHUDToActiveBot === 'function') (window as any).syncHUDToActiveBot();
    if (typeof (window as any).renderMinimap === 'function') (window as any).renderMinimap();

    showToast('TOUCHDOWN ON THE MOON!', 'Low-gravity 0.35G active! Jump high, explore craters & find 5 Lunar Relics!');
    triggerNPCSpeech(
        'BLADES',
        'Aerial Recon',
        'Whoa! We are on the Moon! Try jumping—the low gravity lets us soar right over craters!',
        player,
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
    for (let i = 0; i < _moonColliders.length; i++) {
        const c = _moonColliders[i];
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minDist = c.r + radius;
        const dSq = dx * dx + dz * dz;
        if (dSq < minDist * minDist && dSq > 1e-4) {
            const d = Math.sqrt(dSq);
            const push = minDist - d;
            pos.x += (dx / d) * push;
            pos.z += (dz / d) * push;
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
            player,
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

    // Proximity to Parked Sigma for Launch-to-Orbit highlight
    const distSigma = Math.hypot(player.pos.x - MOON_SIGMA_POS.x, player.pos.z - MOON_SIGMA_POS.z);
    worldState.nearMoonSigma = distSigma < 28.0;
}

export function getMoonMapData() {
    return {
        radius: MOON_WORLD_RADIUS,
        craters: MOON_CRATERS,
        sigmaPos: MOON_SIGMA_POS,
        flagPos: MOON_FLAG_POS,
        relics: _moonRelics,
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
        getMoonRocks: () => _moonRocks
    });
}

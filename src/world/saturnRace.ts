// Saturn Ring Racing Circuit in Bot Mode (worldState.activeArea === 'SATURN_RING_RACE')
import * as THREE from 'three';
import type { BotRig } from '../types/game.js';
import { scene, camera, renderer } from '../rendering/scene.js';
import { toonGrad3, applyCartoonInkOutlines } from '../rendering/materials.js';
import { player, buddyBot, botRigs, input, worldState } from '../state/gameState.js';
import { updateAllBotTransforms } from '../physics/player.js';
import { buildRescueBotModel, applyBotRigMorph } from '../bots/botRigs.js';
import { progression, saveProgression } from '../progression/progression.js';
import { setActiveParticleScene, spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';
import { isActionActive } from '../settings/settings.js';

export const saturnRaceScene = new THREE.Scene();

export const SATURN_TRACK_RADIUS = 240;
export const SATURN_TRACK_HALF_WIDTH = 17.5;
const NUM_GATES = 12;
const TOTAL_LAPS = 3;

interface RingGate {
    angle: number;
    group: THREE.Group;
    archMat: THREE.MeshBasicMaterial;
    passed: boolean;
}

interface IceMoonlet {
    angle: number;
    radialOffset: number;
    radius: number;
    mesh: THREE.Mesh;
    rotSpeed: number;
    hitCooldown: number;
}

interface RivalRacer {
    botType: string;
    rig: BotRig;
    angle: number;
    totalAngle: number;
    radialOffset: number;
    targetLane: number;
    laneTimer: number;
    baseSpeed: number;
    walkCycle: number;
    colorHex: string;
}

export const saturnRaceState = {
    angle: 0,           // Current angular position along ring (radians)
    totalAngle: 0,      // Cumulative angle for 1st-4th placement
    radialOffset: 0,    // -HALF_WIDTH (inner) .. +HALF_WIDTH (outer)
    speed: 44,          // Linear speed along ring (m/s)
    radialVel: 0,
    boostTimer: 0,
    rockSlowTimer: 0,   // Substantial slowdown after hitting an ice-moonlet
    jumpY: 0,
    jumpVy: 0,
    lap: 1,
    rank: 1,            // 1..4 Grand Prix placement
    nextGateIdx: 1,
    lapStartTime: 0,
    currentLapTime: 0,
    bestLapTime: null as number | null,
    finished: false,
    touchSteer: 0,      // -1 left (outer lane), +1 right (inner lane)
    touchBoost: false
};

let _saturnBuilt = false;
let _saturnPlanetMesh: THREE.Mesh | null = null;
const _gates: RingGate[] = [];
const _moonlets: IceMoonlet[] = [];
const _rivals: RivalRacer[] = [];
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();

function createSaturnTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const bands = [
        '#ca8a04', '#eab308', '#fef08a', '#d97706',
        '#facc15', '#fef9c3', '#ca8a04', '#eab308',
        '#b45309', '#fde047', '#ca8a04'
    ];
    bands.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(0, (i / bands.length) * 256, 512, 256 / bands.length + 2);
    });
    return new THREE.CanvasTexture(c);
}

function createIceTrackTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.15, '#bae6fd');
    grad.addColorStop(0.5, '#f0f9ff');
    grad.addColorStop(0.85, '#bae6fd');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle glowing racing lane chevrons
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.55)';
    ctx.lineWidth = 4;
    for (let y = 32; y < 256; y += 64) {
        ctx.beginPath();
        ctx.moveTo(64, y + 18);
        ctx.lineTo(128, y);
        ctx.lineTo(192, y + 18);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 36);
    return tex;
}

function buildSaturnRaceScene() {
    if (_saturnBuilt) return;
    _saturnBuilt = true;

    saturnRaceScene.background = new THREE.Color(0x040714);
    saturnRaceScene.add(new THREE.HemisphereLight(0xfef3c7, 0x1e293b, 1.05));
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.55);
    sun.position.set(180, 220, 140);
    saturnRaceScene.add(sun);

    // Starfield
    const starCount = 1600;
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 620 + Math.random() * 260;
        sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        sPos[i * 3 + 1] = r * Math.cos(ph);
        sPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    saturnRaceScene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.8, fog: false })));

    // Massive Banded Saturn right at the center of the Ring Track!
    _saturnPlanetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(128, 40, 32),
        new THREE.MeshToonMaterial({ map: createSaturnTexture(), gradientMap: toonGrad3 })
    );
    _saturnPlanetMesh.position.set(0, -14, 0);
    saturnRaceScene.add(_saturnPlanetMesh);

    // Warm Golden Atmospheric Halo around Saturn
    const satHalo = new THREE.Mesh(
        new THREE.SphereGeometry(134, 32, 24),
        new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.14, side: THREE.BackSide })
    );
    satHalo.position.copy(_saturnPlanetMesh.position);
    saturnRaceScene.add(satHalo);

    // Decorative Inner & Outer Translucent Ring Bands
    const innerDecor = new THREE.Mesh(
        new THREE.RingGeometry(152, SATURN_TRACK_RADIUS - SATURN_TRACK_HALF_WIDTH - 4, 72).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
    );
    innerDecor.position.y = -0.35;
    saturnRaceScene.add(innerDecor);

    const outerDecor = new THREE.Mesh(
        new THREE.RingGeometry(SATURN_TRACK_RADIUS + SATURN_TRACK_HALF_WIDTH + 4, 345, 72).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    outerDecor.position.y = -0.35;
    saturnRaceScene.add(outerDecor);

    // Playable Luminous Icy Ring Highway Track
    const trackGeo = new THREE.RingGeometry(
        SATURN_TRACK_RADIUS - SATURN_TRACK_HALF_WIDTH,
        SATURN_TRACK_RADIUS + SATURN_TRACK_HALF_WIDTH,
        96,
        2
    );
    trackGeo.rotateX(-Math.PI / 2);
    const trackMesh = new THREE.Mesh(
        trackGeo,
        new THREE.MeshToonMaterial({
            map: createIceTrackTexture(),
            color: 0xe0f2fe,
            gradientMap: toonGrad3,
            side: THREE.DoubleSide
        })
    );
    saturnRaceScene.add(trackMesh);

    // Glowing Energy Guard Rails on Inner & Outer Edges
    const innerRail = new THREE.Mesh(
        new THREE.TorusGeometry(SATURN_TRACK_RADIUS - SATURN_TRACK_HALF_WIDTH, 0.45, 8, 96).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    innerRail.position.y = 0.6;
    const outerRail = new THREE.Mesh(
        new THREE.TorusGeometry(SATURN_TRACK_RADIUS + SATURN_TRACK_HALF_WIDTH, 0.45, 8, 96).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    outerRail.position.y = 0.6;
    saturnRaceScene.add(innerRail, outerRail);

    // 12 Sequential Turbo Boost Gates around the 360-degree Ring
    for (let i = 0; i < NUM_GATES; i++) {
        const ang = (i / NUM_GATES) * Math.PI * 2;
        const g = new THREE.Group();
        const gx = Math.cos(ang) * SATURN_TRACK_RADIUS;
        const gz = Math.sin(ang) * SATURN_TRACK_RADIUS;
        g.position.set(gx, 0, gz);
        // Align arch radially across the ring track
        g.rotation.y = -ang;

        const isStartFinish = i === 0;
        const archMat = new THREE.MeshBasicMaterial({
            color: isStartFinish ? 0x4ade80 : 0x38bdf8,
            transparent: true,
            opacity: 0.75
        });
        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(13.5, 0.85, 8, 24, Math.PI),
            archMat
        );
        arch.position.y = 0.5;
        const postL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.0, 14, 8),
            new THREE.MeshToonMaterial({ color: isStartFinish ? 0x22c55e : 0xf59e0b, gradientMap: toonGrad3 })
        );
        postL.position.set(-13.5, 7, 0);
        const postR = postL.clone();
        postR.position.x = 13.5;

        g.add(arch, postL, postR);
        saturnRaceScene.add(g);
        _gates.push({ angle: ang, group: g, archMat, passed: false });
    }

    // Tumbling Ice-Moonlets scattered across lanes
    const iceMat = new THREE.MeshToonMaterial({ color: 0xbae6fd, gradientMap: toonGrad3 });
    for (let i = 0; i < 26; i++) {
        const ang = ((i + 0.5) / 26) * Math.PI * 2;
        // Keep start line clear
        if (ang < 0.22 || ang > Math.PI * 2 - 0.22) continue;
        const radialOffset = ((i % 3) - 1) * 10.5;
        const rad = 2.0 + (i % 3) * 0.65;
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), iceMat);
        const r = SATURN_TRACK_RADIUS + radialOffset;
        mesh.position.set(Math.cos(ang) * r, rad * 0.9, Math.sin(ang) * r);
        applyCartoonInkOutlines(mesh, 1.05, true);
        saturnRaceScene.add(mesh);
        _moonlets.push({
            angle: ang,
            radialOffset,
            radius: rad,
            mesh,
            rotSpeed: (i % 2 === 0 ? 1 : -1) * (1.2 + (i % 4) * 0.35),
            hitCooldown: 0
        });
    }
}

export function setSaturnRaceTouch(action: 'LEFT' | 'RIGHT' | 'BOOST', active: boolean) {
    if (action === 'LEFT') saturnRaceState.touchSteer = active ? -1 : (saturnRaceState.touchSteer === -1 ? 0 : saturnRaceState.touchSteer);
    if (action === 'RIGHT') saturnRaceState.touchSteer = active ? 1 : (saturnRaceState.touchSteer === 1 ? 0 : saturnRaceState.touchSteer);
    if (action === 'BOOST') {
        saturnRaceState.touchBoost = active;
        if (active && saturnRaceState.boostTimer <= 0.1) {
            triggerSaturnRaceBoost();
        }
    }
}

export function triggerSaturnRaceBoost() {
    if (worldState.activeArea !== 'SATURN_RING_RACE') return;
    saturnRaceState.boostTimer = Math.max(saturnRaceState.boostTimer, 1.6);
    sfx.playEnergyCharge();
}

function spawnSaturnRivals() {
    _rivals.forEach(rv => {
        if (rv.rig?.root) saturnRaceScene.remove(rv.rig.root);
    });
    _rivals.length = 0;

    const allies: string[] = Array.isArray(progression.discoveredAllies) ? progression.discoveredAllies : [];
    const pool = ['BLURR', 'BUMBLEBEE', 'QUICKSHADOW', 'CHASE', 'HEATWAVE'];
    if (allies.includes('STARSPEED')) pool.unshift('STARSPEED');
    const chosen = pool.filter(b => b !== player.botType).slice(0, 3);
    const colors: Record<string, string> = {
        STARSPEED: '#06b6d4',
        BLURR: '#a855f7',
        BUMBLEBEE: '#facc15',
        QUICKSHADOW: '#38bdf8',
        CHASE: '#3b82f6',
        HEATWAVE: '#ef4444'
    };

    chosen.forEach((botType, idx) => {
        const rig = buildRescueBotModel(botType);
        applyBotRigMorph(rig, 1, 0, 0, 0, 0, 0, 0, 0, 0);
        saturnRaceScene.add(rig.root);
        const startAng = 0.03 + idx * 0.025;
        const lane = (idx - 1) * 8.5;
        _rivals.push({
            botType,
            rig,
            angle: startAng,
            totalAngle: startAng,
            radialOffset: lane,
            targetLane: lane,
            laneTimer: 1.5 + idx * 0.9,
            baseSpeed: 54 + idx * 3.8,
            walkCycle: idx * 1.3,
            colorHex: colors[botType] || '#f472b6'
        });
    });
}

export function resetSaturnRace() {
    saturnRaceState.angle = 0;
    saturnRaceState.totalAngle = 0;
    saturnRaceState.radialOffset = 0;
    saturnRaceState.speed = 46;
    saturnRaceState.radialVel = 0;
    saturnRaceState.boostTimer = 0;
    saturnRaceState.rockSlowTimer = 0;
    saturnRaceState.jumpY = 0;
    saturnRaceState.jumpVy = 0;
    saturnRaceState.lap = 1;
    saturnRaceState.rank = 4;
    saturnRaceState.nextGateIdx = 1;
    saturnRaceState.lapStartTime = performance.now() * 0.001;
    saturnRaceState.currentLapTime = 0;
    saturnRaceState.finished = false;
    saturnRaceState.touchSteer = 0;
    saturnRaceState.touchBoost = false;
    saturnRaceState.bestLapTime = typeof progression.saturnBestLapSec === 'number' ? progression.saturnBestLapSec : null;
    spawnSaturnRivals();
    updateSaturnRaceHUD();
}

export function updateSaturnRaceHUD() {
    const hud = document.getElementById('saturn-race-hud');
    const active = worldState.activeArea === 'SATURN_RING_RACE';
    if (hud) hud.classList.toggle('hidden', !active);
    if (!active) return;

    const lapEl = document.getElementById('saturn-lap-text');
    const posEl = document.getElementById('saturn-pos-text');
    const timeEl = document.getElementById('saturn-time-text');
    const bestEl = document.getElementById('saturn-best-text');
    const speedEl = document.getElementById('saturn-speed-text');

    if (lapEl) {
        lapEl.textContent = saturnRaceState.finished
            ? `FREE RUN • LAP ${saturnRaceState.lap}`
            : `LAP ${saturnRaceState.lap} / ${TOTAL_LAPS}`;
    }
    if (posEl) {
        const suffix = saturnRaceState.rank === 1 ? 'ST' : (saturnRaceState.rank === 2 ? 'ND' : (saturnRaceState.rank === 3 ? 'RD' : 'TH'));
        posEl.textContent = `${saturnRaceState.rank}${suffix} / ${_rivals.length + 1}`;
    }
    if (timeEl) timeEl.textContent = `${saturnRaceState.currentLapTime.toFixed(1)}s`;
    if (bestEl) bestEl.textContent = saturnRaceState.bestLapTime ? `BEST ${saturnRaceState.bestLapTime.toFixed(1)}s` : 'BEST --.-s';
    if (speedEl) speedEl.textContent = `${Math.round(saturnRaceState.speed * 4.2)} KM/H`;
}

export function swapToSaturnRace() {
    buildSaturnRaceScene();

    worldState.activeArea = 'SATURN_RING_RACE';
    worldState.activePlanetId = 'SATURN';

    // Record Saturn visited
    if (!Array.isArray(progression.visitedPlanets)) progression.visitedPlanets = [];
    if (!progression.visitedPlanets.includes('SATURN')) {
        progression.visitedPlanets.push('SATURN');
        saveProgression({ immediate: true });
    }

    // Default to Vehicle Mode for Saturn Ring Race (player can still transform freely via Space or TRANSFORM button!)
    player.mode = 'VEHICLE';
    player.morph = 1;
    player.targetMorph = 1;
    player.dinoMorph = 0;
    player.targetDinoMorph = 0;
    player.boatMorph = 0;
    player.targetBoatMorph = 0;
    player.hasWaypoint = false;
    player.flightAlt = 0;

    // Attach active Rescue Bot rig to saturnRaceScene
    if (botRigs) {
        const pRig = botRigs[player.botType]?.root;
        Object.values(botRigs).forEach((r) => {
            if (r?.root && r.root.parent === saturnRaceScene && r.root !== pRig) {
                scene.add(r.root);
            }
        });
        if (pRig) saturnRaceScene.add(pRig);
    }
    setActiveParticleScene(saturnRaceScene);

    resetSaturnRace();

    // Hide unrelated HUD panels
    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.add('hidden');
    const spaceBar = document.getElementById('space-controls-bar');
    if (spaceBar) spaceBar.classList.add('hidden');
    const spacePill = document.getElementById('space-hud-pill');
    if (spacePill) spacePill.classList.add('hidden');
    const moonPill = document.getElementById('moon-hud-pill');
    if (moonPill) moonPill.classList.add('hidden');
    const solarUi = document.getElementById('solar-hub-ui');
    if (solarUi) solarUi.classList.add('hidden');
    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn) sigmaBtn.classList.add('hidden');
    const moonOrbitBtn = document.getElementById('moon-orbit-btn');
    if (moonOrbitBtn) moonOrbitBtn.classList.add('hidden');
    const moonEarthBtn = document.getElementById('moon-earth-btn');
    if (moonEarthBtn) moonEarthBtn.classList.add('hidden');
    const planetSolarBtn = document.getElementById('planet-solar-btn');
    if (planetSolarBtn) planetSolarBtn.classList.add('hidden');

    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = 'SATURN — ICY RING CIRCUIT';

    updateSaturnRaceHUD();
    showToast(
        'SATURN RING GRAND PRIX!',
        'A/D or Left/Right (or Tap Left/Right) to steer • SPACE to Transform • SHIFT / BOOST for Turbo!'
    );
    triggerNPCSpeech(
        'BLURR',
        'Ring Speedster',
        'Welcome to Saturn’s icy rings! Race in Vehicle Mode (or transform anytime!) through the golden Turbo Gates — and dodge those ice rocks!',
        player as unknown as SpeechTarget,
        true
    );
}

export function restoreRigsFromSaturnRace() {
    if (botRigs) {
        Object.values(botRigs).forEach((r) => {
            if (r?.root && r.root.parent === saturnRaceScene) {
                scene.add(r.root);
            }
        });
    }
    setActiveParticleScene(scene);
}

export function updateSaturnRace(dt: number, now: number) {
    if (worldState.activeArea !== 'SATURN_RING_RACE') return;
    const nowSec = now * 0.001;

    // Smoothly animate Vehicle / Bot / Dino morph transitions while racing!
    player.morph = THREE.MathUtils.lerp(player.morph, player.targetMorph, Math.min(1, dt * 6.0));
    player.dinoMorph = THREE.MathUtils.lerp(player.dinoMorph, player.targetDinoMorph, Math.min(1, dt * 6.0));
    player.boatMorph = 0;
    player.targetBoatMorph = 0;

    // Keep active bot rig synced if player switches bots in the roster
    const pRig = botRigs?.[player.botType]?.root;
    if (botRigs) {
        Object.values(botRigs).forEach((r) => {
            if (r?.root && r.root.parent === saturnRaceScene && r.root !== pRig) {
                scene.add(r.root);
            }
        });
        if (pRig && pRig.parent !== saturnRaceScene) saturnRaceScene.add(pRig);
    }

    // Rotate Saturn gently
    if (_saturnPlanetMesh) _saturnPlanetMesh.rotation.y += dt * 0.04;

    // Gather steering, throttle & boost inputs (matching e.code keys & settings action names!)
    const steerLeft = isActionActive('left', input.keys) || Boolean(input.keys['ArrowLeft']) || Boolean(input.keys['KeyA']) || saturnRaceState.touchSteer < 0;
    const steerRight = isActionActive('right', input.keys) || Boolean(input.keys['ArrowRight']) || Boolean(input.keys['KeyD']) || saturnRaceState.touchSteer > 0;
    const accel = isActionActive('forward', input.keys) || Boolean(input.keys['ArrowUp']) || Boolean(input.keys['KeyW']);
    const brake = isActionActive('backward', input.keys) || Boolean(input.keys['ArrowDown']) || Boolean(input.keys['KeyS']);
    const boostKey = isActionActive('primaryAction', input.keys) || Boolean(input.keys['ShiftLeft']) || Boolean(input.keys['ShiftRight']) || saturnRaceState.touchBoost;

    if (boostKey && saturnRaceState.boostTimer <= 0.1) {
        triggerSaturnRaceBoost();
    }
    if (saturnRaceState.boostTimer > 0) saturnRaceState.boostTimer = Math.max(0, saturnRaceState.boostTimer - dt);
    if (saturnRaceState.rockSlowTimer > 0) saturnRaceState.rockSlowTimer = Math.max(0, saturnRaceState.rockSlowTimer - dt);

    // Base cruise speed + throttle + turbo boost (and substantial drag if recovering from an ice-rock hit!)
    const botBonus = player.botType === 'BLURR' ? 8 : (player.botType === 'STARSPEED' ? 7 : (player.botType === 'BUMBLEBEE' || player.botType === 'QUICKSHADOW' ? 4 : 0));
    const modeBonus = player.mode === 'VEHICLE' ? 8 : (player.mode === 'DINO' ? 4 : 0);
    let targetSpeed = 50 + botBonus + modeBonus;
    if (accel) targetSpeed += 18;
    if (brake) targetSpeed -= 24;
    if (saturnRaceState.boostTimer > 0) targetSpeed += 38;
    if (saturnRaceState.rockSlowTimer > 0) targetSpeed = Math.min(targetSpeed, 18);
    const speedLerp = saturnRaceState.rockSlowTimer > 0 ? 2.2 : 4.5;
    saturnRaceState.speed = THREE.MathUtils.lerp(saturnRaceState.speed, Math.max(12, targetSpeed), Math.min(1, dt * speedLerp));

    // Lateral lane weaving across the icy ring track:
    // Moving LEFT (A / ArrowLeft / Tap Left) -> OUTER lane (+radialOffset)
    // Moving RIGHT (D / ArrowRight / Tap Right) -> INNER lane (-radialOffset)
    let steerVisual = 0; // -1 = left on screen, +1 = right on screen
    if (steerLeft) steerVisual -= 1;
    if (steerRight) steerVisual += 1;
    const radialDir = -steerVisual; // Left (-1) => +1 (outer), Right (+1) => -1 (inner)
    saturnRaceState.radialVel = THREE.MathUtils.lerp(saturnRaceState.radialVel, radialDir * 30.0, Math.min(1, dt * 8.0));
    saturnRaceState.radialOffset = THREE.MathUtils.clamp(
        saturnRaceState.radialOffset + saturnRaceState.radialVel * dt,
        -(SATURN_TRACK_HALF_WIDTH - 2.2),
        SATURN_TRACK_HALF_WIDTH - 2.2
    );

    // Advance angle counter-clockwise around Saturn
    const curRadius = SATURN_TRACK_RADIUS + saturnRaceState.radialOffset;
    const dAng = (saturnRaceState.speed / curRadius) * dt;
    saturnRaceState.angle = (saturnRaceState.angle + dAng) % (Math.PI * 2);
    saturnRaceState.totalAngle += dAng;
    saturnRaceState.currentLapTime = Math.max(0, nowSec - saturnRaceState.lapStartTime);

    // Update 3 AI Rescue Bot Rivals with rubber-banded competitive pacing!
    let aheadCount = 0;
    for (let rIdx = 0; rIdx < _rivals.length; rIdx++) {
        const rv = _rivals[rIdx];
        const gap = saturnRaceState.totalAngle - rv.totalAngle; // positive if player ahead
        const rubberBand = THREE.MathUtils.clamp(gap * 14, -10, 14);
        const rvSpeed = Math.max(36, rv.baseSpeed + rubberBand);
        rv.laneTimer -= dt;
        if (rv.laneTimer <= 0) {
            rv.laneTimer = 2.0 + Math.random() * 2.4;
            rv.targetLane = (Math.random() - 0.5) * (SATURN_TRACK_HALF_WIDTH * 1.45);
        }
        rv.radialOffset = THREE.MathUtils.lerp(rv.radialOffset, rv.targetLane, Math.min(1, dt * 2.2));
        const rvR = SATURN_TRACK_RADIUS + rv.radialOffset;
        const rvDAng = (rvSpeed / rvR) * dt;
        rv.angle = (rv.angle + rvDAng) % (Math.PI * 2);
        rv.totalAngle += rvDAng;
        rv.walkCycle += dt * (rvSpeed * 0.34);

        const rx = Math.cos(rv.angle) * rvR;
        const rz = Math.sin(rv.angle) * rvR;
        const rtx = -Math.sin(rv.angle);
        const rtz = Math.cos(rv.angle);
        if (rv.rig?.root) {
            rv.rig.root.position.set(rx, 0, rz);
            rv.rig.root.rotation.y = Math.atan2(rtx, rtz);
            applyBotRigMorph(rv.rig, 1, 0, rv.walkCycle, rvSpeed * 0.5, 0, now, 0, 0, 0);
        }
        if (rv.totalAngle > saturnRaceState.totalAngle) aheadCount++;
    }
    saturnRaceState.rank = aheadCount + 1;

    // Compute 3D world position & forward tangent heading
    const wx = Math.cos(saturnRaceState.angle) * curRadius;
    const wz = Math.sin(saturnRaceState.angle) * curRadius;
    const tangentX = -Math.sin(saturnRaceState.angle);
    const tangentZ = Math.cos(saturnRaceState.angle);
    const heading = Math.atan2(tangentX, tangentZ);

    player.pos.set(wx, saturnRaceState.jumpY, wz);
    player.heading = heading - steerVisual * 0.22;
    player.speed = saturnRaceState.speed * 0.55;
    player.walkCycle += dt * (saturnRaceState.speed * 0.34);

    if (pRig) {
        pRig.position.copy(player.pos);
        pRig.rotation.y = player.heading;
        pRig.rotation.z = -steerVisual * 0.16;
    }
    updateAllBotTransforms(dt, now);

    if (saturnRaceState.boostTimer > 0 && Math.random() < 0.55) {
        spawnSparkleGlints(wx, 2.2, wz, 2);
    }

    // Check Gates
    for (let i = 0; i < _gates.length; i++) {
        const g = _gates[i];
        const isNext = i === saturnRaceState.nextGateIdx;
        g.archMat.color.setHex(isNext ? 0xfacc15 : (i === 0 ? 0x4ade80 : 0x38bdf8));
        g.archMat.opacity = isNext ? 0.96 : 0.42;

        if (isNext) {
            const angDiff = Math.abs(Math.atan2(Math.sin(saturnRaceState.angle - g.angle), Math.cos(saturnRaceState.angle - g.angle)));
            if (angDiff < 0.085) {
                saturnRaceState.boostTimer = Math.max(saturnRaceState.boostTimer, 1.35);
                sfx.playStuntChime();
                spawnBurstParticles(wx, 3.2, wz, 0xfacc15, 10, 0.9);
                saturnRaceState.nextGateIdx = (saturnRaceState.nextGateIdx + 1) % NUM_GATES;

                // Completed a full lap when passing Gate 0!
                if (i === 0) {
                    const lapTime = saturnRaceState.currentLapTime;
                    if (!saturnRaceState.bestLapTime || lapTime < saturnRaceState.bestLapTime) {
                        saturnRaceState.bestLapTime = lapTime;
                        progression.saturnBestLapSec = Math.round(lapTime * 100) / 100;
                        saveProgression({ immediate: true });
                    }
                    saturnRaceState.lapStartTime = nowSec;
                    if (!saturnRaceState.finished && saturnRaceState.lap >= TOTAL_LAPS) {
                        saturnRaceState.finished = true;
                        progression.saturnRacesCompleted = (progression.saturnRacesCompleted || 0) + 1;
                        if (saturnRaceState.rank === 1) {
                            progression.saturnWins = (progression.saturnWins || 0) + 1;
                        }
                        const reward = saturnRaceState.rank === 1 ? 15 : 10;
                        progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + reward;
                        saveProgression({ immediate: true });
                        sfx.playRankUp();
                        const placeLabel = saturnRaceState.rank === 1 ? '1ST PLACE CHAMPION!' : `${saturnRaceState.rank}${saturnRaceState.rank === 2 ? 'ND' : (saturnRaceState.rank === 3 ? 'RD' : 'TH')} PLACE FINISH!`;
                        showToast(`SATURN RING GRAND PRIX — ${placeLabel}`, `Best Lap: ${saturnRaceState.bestLapTime.toFixed(1)}s • +${reward} Energon!`);
                    } else {
                        saturnRaceState.lap++;
                        showToast(`LAP ${saturnRaceState.lap}!`, `Last lap: ${lapTime.toFixed(1)}s • Keep sprinting!`);
                    }
                }
            }
        }
    }

    // Check Ice-Moonlets
    for (let i = 0; i < _moonlets.length; i++) {
        const m = _moonlets[i];
        m.mesh.rotation.x += dt * m.rotSpeed;
        m.mesh.rotation.y += dt * m.rotSpeed * 0.7;
        if (m.hitCooldown > 0) {
            m.hitCooldown -= dt;
            if (m.hitCooldown <= 0) m.mesh.visible = true;
            continue;
        }
        const dist = player.pos.distanceTo(m.mesh.position);
        if (dist < m.radius + 2.5) {
            m.hitCooldown = 6.0;
            m.mesh.visible = false;
            sfx.playRockBreak();
            spawnBurstParticles(m.mesh.position.x, 2.0, m.mesh.position.z, 0xbae6fd, 18, 1.2);
            // Substantial rock impact slowdown! (Cancels boost and imposes heavy drag recovery)
            saturnRaceState.boostTimer = 0;
            if (player.botType === 'BOULDER') {
                // Boulder's heavy armor takes a lighter jolt & still earns +1 Energon
                saturnRaceState.speed = Math.max(22, saturnRaceState.speed * 0.55);
                saturnRaceState.rockSlowTimer = 0.85;
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
                saveProgression();
            } else {
                saturnRaceState.speed = Math.max(12, saturnRaceState.speed * 0.28);
                saturnRaceState.rockSlowTimer = 1.9;
                showToast('ICE ROCK IMPACT!', 'Heavy slowdown — weave around the ice moonlets!');
            }
        }
    }

    // Dynamic Chase Camera behind the sprinting Rescue Bot with Saturn gleaming to the inner left!
    _camGoal.set(
        wx - tangentX * 16.5 + Math.cos(saturnRaceState.angle) * 3.5,
        8.2 + (saturnRaceState.boostTimer > 0 ? 1.2 : 0),
        wz - tangentZ * 16.5 + Math.sin(saturnRaceState.angle) * 3.5
    );
    camera.position.lerp(_camGoal, Math.min(1, dt * 6.5));
    _lookGoal.set(wx + tangentX * 22, 3.2, wz + tangentZ * 22);
    camera.lookAt(_lookGoal);

    updateSaturnRaceHUD();
}

export function getSaturnRaceMapData() {
    return {
        trackRadius: SATURN_TRACK_RADIUS,
        angle: saturnRaceState.angle,
        radialOffset: saturnRaceState.radialOffset,
        nextGateIdx: saturnRaceState.nextGateIdx,
        gates: _gates,
        rivals: _rivals.map(r => ({ angle: r.angle, colorHex: r.colorHex, botType: r.botType }))
    };
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        saturnRaceScene,
        saturnRaceState,
        swapToSaturnRace,
        resetSaturnRace,
        setSaturnRaceTouch,
        triggerSaturnRaceBoost,
        getSaturnRaceMapData
    });
}

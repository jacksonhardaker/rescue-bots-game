// Multi-Planet & Giant-Moon Landable Surface Engine (worldState.activeArea === 'PLANET_SURFACE')
// Supports Mercury, Venus, Mars, Pluto, plus landable giant moons: Europa (Jupiter), Miranda (Uranus), Triton (Neptune).
import * as THREE from 'three';
import { scene, camera, renderer } from '../rendering/scene.js';
import {
    toonGrad3, matDarkSteel, matChrome, matOptimusRed, matOptimusGold,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs, worldState } from '../state/gameState.js';
import { progression, saveProgression } from '../progression/progression.js';
import { setPlanetTerrainHooks } from './terrain.js';
import { setActiveParticleScene, spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import { buildCrashedSpaceshipSigma } from './spaceshipSigma.js';
import { buildRescueBotModel, applyBotRigMorph } from '../bots/botRigs.js';
import { updateBotRosterUI } from '../physics/player.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';

export const planetSurfaceScene = new THREE.Scene();
export const PLANET_WORLD_RADIUS = 175;
export const PLANET_SIGMA_POS = { x: 0, z: -26 };

export type LandablePlanetId = 'MERCURY' | 'VENUS' | 'MARS' | 'PLUTO' | 'EUROPA' | 'MIRANDA' | 'TRITON';

export interface PlanetRelicDef {
    id: string;
    name: string;
    x: number;
    z: number;
}

export interface PlanetConfig {
    id: LandablePlanetId;
    name: string;
    zoneLabel: string;
    gravity: number;       // Multiplier relative to Earth (1.0)
    gravityLabel: string;
    skyColor: number;
    fogColor: number | null;
    fogDensity: number;
    hemiSky: number;
    hemiGround: number;
    sunColor: number;
    sunIntensity: number;
    groundBaseHex: string;
    groundAccentHex: string;
    groundCraterHex: string;
    rockColor: number;
    ventColor: number;
    relicColor: number;
    backdropKind: 'HUGE_SUN' | 'VENUS_CLOUDS' | 'MARS_SUN' | 'CHARON' | 'JUPITER' | 'URANUS' | 'NEPTUNE';
    returnSector: string | null; // Non-null for giant moons (returns to giant's orbit)
    welcomeToast: string;
    craters: Array<{ x: number; z: number; r: number; depth: number; rim: number }>;
    vents: Array<{ x: number; z: number; label: string }>;
    relics: PlanetRelicDef[];
}

export const PLANET_CONFIGS: Record<LandablePlanetId, PlanetConfig> = {
    MERCURY: {
        id: 'MERCURY',
        name: 'MERCURY',
        zoneLabel: 'MERCURY — CALORIS BASIN',
        gravity: 0.38,
        gravityLabel: '0.38G',
        skyColor: 0x09080f,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xfef3c7,
        hemiGround: 0x57534e,
        sunColor: 0xfffbeb,
        sunIntensity: 1.85,
        groundBaseHex: '#9c948c',
        groundAccentHex: '#78716c',
        groundCraterHex: '#57534e',
        rockColor: 0x78716c,
        ventColor: 0xf97316,
        relicColor: 0xfbbf24,
        backdropKind: 'HUGE_SUN',
        returnSector: null,
        welcomeToast: '0.38G Low Gravity • Ride Solar Thermal Vents & Collect 3 Solar Relics!',
        craters: [
            { x: -64, z: -50, r: 28, depth: 3.2, rim: 2.2 },
            { x: 72, z: -48, r: 30, depth: 3.6, rim: 2.4 },
            { x: 0, z: 96, r: 34, depth: 3.8, rim: 2.5 }
        ],
        vents: [
            { x: -34, z: -12, label: 'Solar Geyser' },
            { x: 38, z: -20, label: 'Solar Geyser' },
            { x: 0, z: 54, label: 'Caloris Vent' }
        ],
        relics: [
            { id: 'MERCURY_1', name: 'Caloris Solar Core', x: -64, z: -50 },
            { id: 'MERCURY_2', name: 'Sunflare Prism', x: 72, z: -48 },
            { id: 'MERCURY_3', name: 'Hermes Alloy Shard', x: 0, z: 96 }
        ]
    },
    VENUS: {
        id: 'VENUS',
        name: 'VENUS',
        zoneLabel: 'VENUS — MAXWELL VOLCANIC RIDGE',
        gravity: 0.90,
        gravityLabel: '0.90G',
        skyColor: 0xd97706,
        fogColor: 0xd97706,
        fogDensity: 0.0042,
        hemiSky: 0xfde68a,
        hemiGround: 0x78350f,
        sunColor: 0xfef08a,
        sunIntensity: 1.45,
        groundBaseHex: '#b45309',
        groundAccentHex: '#92400e',
        groundCraterHex: '#451a03',
        rockColor: 0x57534e,
        ventColor: 0xfacc15,
        relicColor: 0x38bdf8,
        backdropKind: 'VENUS_CLOUDS',
        returnSector: null,
        welcomeToast: '0.90G Sulfuric Clouds • Ride Volcanic Updrafts & Recover 3 Venusian Relics!',
        craters: [
            { x: -66, z: -44, r: 26, depth: 2.8, rim: 2.8 },
            { x: 68, z: -52, r: 28, depth: 3.0, rim: 3.0 },
            { x: -12, z: 92, r: 32, depth: 3.2, rim: 3.2 }
        ],
        vents: [
            { x: -32, z: 18, label: 'Sulfur Thermal Vent' },
            { x: 36, z: 24, label: 'Basalt Updraft' },
            { x: 0, z: -76, label: 'Maxwell Plume' }
        ],
        relics: [
            { id: 'VENUS_1', name: 'Aphrodite Thermal Gem', x: -66, z: -44 },
            { id: 'VENUS_2', name: 'Sulfur Cloud Probe', x: 68, z: -52 },
            { id: 'VENUS_3', name: 'Maxwell Basalt Core', x: -12, z: 92 }
        ]
    },
    MARS: {
        id: 'MARS',
        name: 'MARS',
        zoneLabel: 'MARS — OLYMPUS OUTPOST',
        gravity: 0.38,
        gravityLabel: '0.38G',
        skyColor: 0xc2410c,
        fogColor: 0xb45309,
        fogDensity: 0.0028,
        hemiSky: 0xfdba74,
        hemiGround: 0x7c2d12,
        sunColor: 0xffedd5,
        sunIntensity: 1.5,
        groundBaseHex: '#c2410c',
        groundAccentHex: '#9a3412',
        groundCraterHex: '#7c2d12',
        rockColor: 0x9a3412,
        ventColor: 0xfdba74,
        relicColor: 0x22d3ee,
        backdropKind: 'MARS_SUN',
        returnSector: null,
        welcomeToast: '0.38G Martian Gravity • Ride Dust-Devil Updrafts & Find 3 Martian Relics!',
        craters: [
            { x: -72, z: -54, r: 30, depth: 3.5, rim: 2.5 },
            { x: 74, z: -44, r: 28, depth: 3.2, rim: 2.4 },
            { x: 14, z: 98, r: 34, depth: 4.0, rim: 2.6 }
        ],
        vents: [
            { x: -36, z: -14, label: 'Mars Dust Devil' },
            { x: 40, z: 16, label: 'Mars Dust Devil' },
            { x: -16, z: 58, label: 'Canyon Updraft' }
        ],
        relics: [
            { id: 'MARS_1', name: 'Olympus Energon Core', x: -72, z: -54 },
            { id: 'MARS_2', name: 'Valles Marineris Prism', x: 74, z: -44 },
            { id: 'MARS_3', name: 'Red Planet Beacon', x: 14, z: 98 }
        ]
    },
    PLUTO: {
        id: 'PLUTO',
        name: 'PLUTO',
        zoneLabel: 'PLUTO — TOMBAUGH HEART BASIN',
        gravity: 0.18,
        gravityLabel: '0.18G',
        skyColor: 0x050816,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xc7d2fe,
        hemiGround: 0x334155,
        sunColor: 0xe0e7ff,
        sunIntensity: 1.25,
        groundBaseHex: '#cbd5e1',
        groundAccentHex: '#94a3b8',
        groundCraterHex: '#64748b',
        rockColor: 0x94a3b8,
        ventColor: 0x38bdf8,
        relicColor: 0xc084fc,
        backdropKind: 'CHARON',
        returnSector: null,
        welcomeToast: '0.18G Super-Floaty Gravity • Giant leaps under Charon & 3 Kuiper Ice Relics!',
        craters: [
            { x: -62, z: -52, r: 28, depth: 3.0, rim: 2.0 },
            { x: 66, z: -52, r: 28, depth: 3.0, rim: 2.0 },
            { x: 0, z: 92, r: 34, depth: 3.4, rim: 2.2 }
        ],
        vents: [
            { x: -32, z: 12, label: 'Nitrogen Cryo-Vent' },
            { x: 34, z: 12, label: 'Nitrogen Cryo-Vent' },
            { x: 0, z: 48, label: 'Heart Basin Geyser' }
        ],
        relics: [
            { id: 'PLUTO_1', name: 'Tombaugh Heart Crystal', x: -62, z: -52 },
            { id: 'PLUTO_2', name: 'Charon Starlight Shard', x: 66, z: -52 },
            { id: 'PLUTO_3', name: 'Kuiper Belt Core', x: 0, z: 92 }
        ]
    },
    EUROPA: {
        id: 'EUROPA',
        name: 'EUROPA',
        zoneLabel: 'EUROPA — JUPITER ICE PLAINS',
        gravity: 0.22,
        gravityLabel: '0.22G',
        skyColor: 0x040714,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xbae6fd,
        hemiGround: 0x1e3a8a,
        sunColor: 0xe0f2fe,
        sunIntensity: 1.35,
        groundBaseHex: '#e0f2fe',
        groundAccentHex: '#7dd3fc',
        groundCraterHex: '#0284c7',
        rockColor: 0x7dd3fc,
        ventColor: 0x22d3ee,
        relicColor: 0xfacc15,
        backdropKind: 'JUPITER',
        returnSector: 'JUPITER',
        welcomeToast: '0.22G Ice-Moon Gravity • Jupiter looms overhead! Find 3 Europa Ocean Relics!',
        craters: [
            { x: -66, z: -48, r: 26, depth: 2.8, rim: 1.8 },
            { x: 68, z: -48, r: 28, depth: 3.0, rim: 2.0 },
            { x: 0, z: 94, r: 32, depth: 3.2, rim: 2.1 }
        ],
        vents: [
            { x: -34, z: 14, label: 'Ocean Ice Plume' },
            { x: 36, z: 14, label: 'Ocean Ice Plume' },
            { x: 0, z: 54, label: 'Europa Geyser' }
        ],
        relics: [
            { id: 'EUROPA_1', name: 'Sub-Ice Energon Pearl', x: -66, z: -48 },
            { id: 'EUROPA_2', name: 'Jovian Frost Core', x: 68, z: -48 },
            { id: 'EUROPA_3', name: 'Galilean Ocean Shard', x: 0, z: 94 }
        ]
    },
    MIRANDA: {
        id: 'MIRANDA',
        name: 'MIRANDA',
        zoneLabel: 'MIRANDA — VERONA RUPES CANYON',
        gravity: 0.16,
        gravityLabel: '0.16G',
        skyColor: 0x040916,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xa5f3fc,
        hemiGround: 0x1e293b,
        sunColor: 0xcffafe,
        sunIntensity: 1.25,
        groundBaseHex: '#cbd5e1',
        groundAccentHex: '#67e8f9',
        groundCraterHex: '#334155',
        rockColor: 0x64748b,
        ventColor: 0x22d3ee,
        relicColor: 0x38bdf8,
        backdropKind: 'URANUS',
        returnSector: 'URANUS',
        welcomeToast: '0.16G Ultra-Low Gravity • Uranus rises overhead! Collect 3 Miranda Rift Relics!',
        craters: [
            { x: -62, z: -50, r: 28, depth: 3.4, rim: 2.6 },
            { x: 66, z: -46, r: 28, depth: 3.2, rim: 2.6 },
            { x: 0, z: 90, r: 32, depth: 3.6, rim: 2.8 }
        ],
        vents: [
            { x: -32, z: 16, label: 'Rift Updraft' },
            { x: 34, z: 16, label: 'Rift Updraft' },
            { x: 0, z: 50, label: 'Verona Cliff Vent' }
        ],
        relics: [
            { id: 'MIRANDA_1', name: 'Verona Cliff Crystal', x: -62, z: -50 },
            { id: 'MIRANDA_2', name: 'Uranian Ring Shard', x: 66, z: -46 },
            { id: 'MIRANDA_3', name: 'Ice-Giant Beacon', x: 0, z: 90 }
        ]
    },
    TRITON: {
        id: 'TRITON',
        name: 'TRITON',
        zoneLabel: 'TRITON — NEPTUNE CRYO-GEYSERS',
        gravity: 0.20,
        gravityLabel: '0.20G',
        skyColor: 0x030718,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0x93c5fd,
        hemiGround: 0x312e81,
        sunColor: 0xdbeafe,
        sunIntensity: 1.25,
        groundBaseHex: '#e2d4e8',
        groundAccentHex: '#a5b4fc',
        groundCraterHex: '#4338ca',
        rockColor: 0x818cf8,
        ventColor: 0x60a5fa,
        relicColor: 0xf472b6,
        backdropKind: 'NEPTUNE',
        returnSector: 'NEPTUNE',
        welcomeToast: '0.20G Cryo-Moon Gravity • Investigate the Frozen Bot Signal on Triton & find 3 Relics!',
        craters: [
            { x: -64, z: -46, r: 26, depth: 3.0, rim: 2.2 },
            { x: 68, z: -48, r: 28, depth: 3.0, rim: 2.2 },
            { x: 0, z: 92, r: 32, depth: 3.4, rim: 2.4 }
        ],
        vents: [
            { x: -34, z: 14, label: 'Nitrogen Cryo-Geyser' },
            { x: 36, z: 14, label: 'Nitrogen Cryo-Geyser' },
            { x: 0, z: 52, label: 'Triton Frost Plume' }
        ],
        relics: [
            { id: 'TRITON_1', name: 'Neptunian Cryo Core', x: -64, z: -46 },
            { id: 'TRITON_2', name: 'Azure Storm Prism', x: 68, z: -48 },
            { id: 'TRITON_3', name: 'Geyser Star Shard', x: 0, z: 92 }
        ]
    }
};

interface PlanetRelicRuntime extends PlanetRelicDef {
    group: THREE.Group;
    spinner: THREE.Group;
    collected: boolean;
}

interface PlanetRockRuntime {
    mesh: THREE.Mesh;
    x: number;
    y: number;
    z: number;
    r: number;
    destroyed: boolean;
}

let _activeConfig: PlanetConfig = PLANET_CONFIGS.MARS;
let _builtPlanetId: LandablePlanetId | null = null;
let _worldGroup: THREE.Group | null = null;
let _planetSigmaRoot: THREE.Group | null = null;
let _frozenStarspeedGroup: THREE.Group | null = null;
let _frozenStarspeedRing: THREE.Mesh | null = null;
let _frozenStarspeedFreed = false;
const TRITON_FROZEN_POS = { x: -34, z: -42 };
const _planetRelics: PlanetRelicRuntime[] = [];
const _planetRocks: PlanetRockRuntime[] = [];
const _planetAnimated: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];
let _ventCooldown = 0;

export function getActivePlanetGravity(): number {
    return _activeConfig ? _activeConfig.gravity : 0.38;
}

export function getPlanetSurfaceHeight(x: number, z: number): number {
    const cfg = _activeConfig;
    // Keep baseline well above y = 0 so Earth ocean water checks never trigger
    let h = 6.0 + Math.sin(x * 0.024) * Math.cos(z * 0.022) * 1.65 + Math.sin(x * 0.065 + z * 0.05) * 0.48;

    // Flatten central landing zone around Starship Sigma
    const dCenter = Math.hypot(x, z + 10);
    if (dCenter < 42) {
        const t = Math.max(0, Math.min(1, (dCenter - 22) / 20));
        h = THREE.MathUtils.lerp(6.0, h, t);
    }

    for (let i = 0; i < cfg.craters.length; i++) {
        const c = cfg.craters[i];
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < c.r * 1.45) {
            if (d < c.r) {
                const u = d / c.r;
                h -= (1 - u * u) * c.depth;
            }
            const rimDist = Math.abs(d - c.r);
            if (rimDist < c.r * 0.35) {
                const rt = 1 - rimDist / (c.r * 0.35);
                h += rt * rt * c.rim;
            }
        }
    }

    const r = Math.hypot(x, z);
    if (r > PLANET_WORLD_RADIUS - 28) {
        const edgeT = (r - (PLANET_WORLD_RADIUS - 28)) / 28;
        h += edgeT * edgeT * 14.0;
    }
    return h;
}

export function getPlanetZoneName(x: number, z: number): string {
    if (Math.hypot(x - PLANET_SIGMA_POS.x, z - PLANET_SIGMA_POS.z) < 26) {
        return `${_activeConfig.name} — SIGMA LANDING PAD`;
    }
    return _activeConfig.zoneLabel;
}

function createPlanetGroundTexture(cfg: PlanetConfig): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = cfg.groundBaseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Surface marbling / strata streaks
    ctx.fillStyle = cfg.groundAccentHex;
    for (let i = 0; i < 42; i++) {
        const x = (i * 71) % 512;
        const y = (i * 97) % 512;
        ctx.globalAlpha = 0.32;
        ctx.beginPath();
        ctx.ellipse(x, y, 22 + (i % 28), 8 + (i % 14), (i % 6) * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Crater rings
    for (let i = 0; i < 55; i++) {
        const x = (i * 93) % 512;
        const y = (i * 61) % 512;
        const r = 6 + (i % 20);
        ctx.fillStyle = cfg.groundCraterHex;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cfg.groundBaseHex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(7, 7);
    return tex;
}

function createBackdropBody(kind: PlanetConfig['backdropKind']): THREE.Group {
    const g = new THREE.Group();
    if (kind === 'HUGE_SUN') {
        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(72, 24, 18),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        const corona = new THREE.Mesh(
            new THREE.SphereGeometry(84, 24, 18),
            new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.28 })
        );
        g.add(sun, corona);
        g.position.set(140, 125, -240);
    } else if (kind === 'VENUS_CLOUDS') {
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(48, 20, 16),
            new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.65 })
        );
        g.add(glow);
        g.position.set(-120, 145, -230);
    } else if (kind === 'MARS_SUN') {
        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(18, 18, 14),
            new THREE.MeshBasicMaterial({ color: 0xffedd5 })
        );
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(28, 18, 14),
            new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.3 })
        );
        g.add(sun, halo);
        g.position.set(110, 130, -250);
    } else if (kind === 'CHARON') {
        const charon = new THREE.Mesh(
            new THREE.SphereGeometry(46, 22, 18),
            new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 })
        );
        g.add(charon);
        g.position.set(-90, 135, -210);
    } else if (kind === 'JUPITER') {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 128;
        const ctx = c.getContext('2d')!;
        const bands = ['#d97706', '#fef3c7', '#b45309', '#fde68a', '#c2410c', '#fef3c7', '#92400e'];
        bands.forEach((col, idx) => {
            ctx.fillStyle = col;
            ctx.fillRect(0, (idx / bands.length) * 128, 256, 128 / bands.length + 2);
        });
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.ellipse(155, 78, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
        const jup = new THREE.Mesh(
            new THREE.SphereGeometry(95, 28, 22),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
        );
        g.add(jup);
        g.position.set(85, 130, -240);
    } else if (kind === 'URANUS') {
        const ura = new THREE.Mesh(
            new THREE.SphereGeometry(74, 24, 20),
            new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
        );
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(94, 118, 40),
            new THREE.MeshBasicMaterial({ color: 0xcffafe, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
        );
        ring.rotation.y = Math.PI * 0.42;
        g.add(ura, ring);
        g.position.set(-80, 128, -235);
    } else if (kind === 'NEPTUNE') {
        const nep = new THREE.Mesh(
            new THREE.SphereGeometry(78, 24, 20),
            new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(84, 24, 20),
            new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.22 })
        );
        g.add(nep, halo);
        g.position.set(75, 128, -235);
    }
    return g;
}

function buildPlanetSurfaceWorld(cfg: PlanetConfig) {
    if (_builtPlanetId === cfg.id && _worldGroup) return;
    _activeConfig = cfg;
    _builtPlanetId = cfg.id;

    // Clear previous planet geometry while keeping active bot rigs re-attachable
    if (_worldGroup) {
        planetSurfaceScene.remove(_worldGroup);
    }
    _planetRelics.length = 0;
    _planetRocks.length = 0;
    _planetAnimated.length = 0;
    _planetSigmaRoot = null;
    _frozenStarspeedGroup = null;
    _frozenStarspeedRing = null;

    planetSurfaceScene.background = new THREE.Color(cfg.skyColor);
    planetSurfaceScene.fog = cfg.fogColor !== null
        ? new THREE.FogExp2(cfg.fogColor, cfg.fogDensity)
        : null;

    _worldGroup = new THREE.Group();
    planetSurfaceScene.add(_worldGroup);

    // Lighting
    _worldGroup.add(new THREE.HemisphereLight(cfg.hemiSky, cfg.hemiGround, 0.95));
    const sun = new THREE.DirectionalLight(cfg.sunColor, cfg.sunIntensity);
    sun.position.set(110, 145, 75);
    _worldGroup.add(sun);

    // Starfield dome (for airless / thin-atmosphere worlds)
    if (cfg.fogColor === null || cfg.id === 'MARS') {
        const starCount = cfg.id === 'MARS' ? 400 : 1200;
        const pos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.48;
            const r = 420 + Math.random() * 140;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = 25 + r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        const sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        _worldGroup.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, fog: false })));
    }

    // Iconic Sky Backdrop (Huge Sun, Jupiter, Uranus, Neptune, Charon)
    _worldGroup.add(createBackdropBody(cfg.backdropKind));

    // Sculpted Planetary Terrain
    const segs = 76;
    const terrainGeo = new THREE.PlaneGeometry(PLANET_WORLD_RADIUS * 2.2, PLANET_WORLD_RADIUS * 2.2, segs, segs);
    terrainGeo.rotateX(-Math.PI / 2);
    const vPos = terrainGeo.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
        const vx = vPos.getX(i);
        const vz = vPos.getZ(i);
        vPos.setY(i, getPlanetSurfaceHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();
    const terrainMesh = new THREE.Mesh(
        terrainGeo,
        new THREE.MeshToonMaterial({ map: createPlanetGroundTexture(cfg), gradientMap: toonGrad3 })
    );
    terrainMesh.receiveShadow = true;
    _worldGroup.add(terrainMesh);

    // Parked Starship Sigma on illuminated Landing Pad
    const sigmaY = getPlanetSurfaceHeight(PLANET_SIGMA_POS.x, PLANET_SIGMA_POS.z);
    const padRing = new THREE.Mesh(
        new THREE.RingGeometry(12.5, 16.0, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    padRing.position.set(PLANET_SIGMA_POS.x, sigmaY + 0.14, PLANET_SIGMA_POS.z);
    _worldGroup.add(padRing);

    _planetSigmaRoot = buildCrashedSpaceshipSigma(_worldGroup as any, _planetAnimated, null, {
        originX: PLANET_SIGMA_POS.x,
        originZ: PLANET_SIGMA_POS.z,
        includeDiorama: false,
        flatLevel: true
    });
    _planetSigmaRoot.position.set(PLANET_SIGMA_POS.x, sigmaY + 2.2, PLANET_SIGMA_POS.z);
    _planetSigmaRoot.rotation.set(0, Math.PI, 0);
    _planetSigmaRoot.scale.setScalar(1.0);
    if (_planetSigmaRoot.userData?.sigmaControl) {
        _planetSigmaRoot.userData.sigmaControl.setRepairStage(3);
        _planetSigmaRoot.userData.sigmaControl.setThrusterPower(0.32, false);
        if (_planetSigmaRoot.userData.sigmaControl.launchPadRing) {
            _planetSigmaRoot.userData.sigmaControl.launchPadRing.visible = false;
        }
    }

    // Outpost Beacon Tower near Landing Pad
    const beaconX = 22, beaconZ = -10;
    const beaconY = getPlanetSurfaceHeight(beaconX, beaconZ);
    const tower = new THREE.Group();
    tower.position.set(beaconX, beaconY, beaconZ);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.4, 2.2, 10), matDarkSteel);
    base.position.y = 1.1;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 11, 8), matChrome);
    mast.position.y = 6.5;
    const orb = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 12, 10),
        new THREE.MeshBasicMaterial({ color: cfg.relicColor })
    );
    orb.position.y = 12.6;
    tower.add(base, mast, orb);
    applyCartoonInkOutlines(base, 1.04, true);
    _worldGroup.add(tower);

    // Geyser / Dust-Devil Jump Vents
    cfg.vents.forEach((v, idx) => {
        const vy = getPlanetSurfaceHeight(v.x, v.z);
        const ventGroup = new THREE.Group();
        ventGroup.position.set(v.x, vy + 0.2, v.z);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(4.4, 0.45, 8, 24).rotateX(Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: cfg.ventColor })
        );
        const plume = new THREE.Mesh(
            new THREE.ConeGeometry(3.2, 10.5, 12, 1, true),
            new THREE.MeshBasicMaterial({ color: cfg.ventColor, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
        );
        plume.position.y = 5.2;
        ventGroup.add(ring, plume);
        _worldGroup!.add(ventGroup);
        _planetAnimated.push({ obj: plume, kind: 'VENT', baseY: 5.2, phase: idx * 1.4 });
    });

    // Collectible Planetary Relics
    const foundList: string[] = Array.isArray(progression.planetRelicsFound) ? progression.planetRelicsFound : [];
    cfg.relics.forEach((rd, idx) => {
        const ry = getPlanetSurfaceHeight(rd.x, rd.z);
        const collected = foundList.includes(rd.id);
        const rg = new THREE.Group();
        rg.position.set(rd.x, ry + 2.8, rd.z);
        const spinner = new THREE.Group();
        const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(2.1, 0),
            new THREE.MeshToonMaterial({ color: cfg.relicColor, gradientMap: toonGrad3 })
        );
        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(3.1, 0.22, 8, 22),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        spinner.add(gem, halo);
        applyCartoonInkOutlines(gem, 1.05, true);
        rg.add(spinner);
        rg.visible = !collected;
        _worldGroup!.add(rg);
        _planetRelics.push({ ...rd, group: rg, spinner, collected });
        _planetAnimated.push({ obj: spinner, kind: 'RELIC', baseY: 0, phase: idx * 1.1 });
    });

    // Smashable Planetary Rocks (Boulder can smash them for Energon!)
    const rockMat = new THREE.MeshToonMaterial({ color: cfg.rockColor, gradientMap: toonGrad3 });
    for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2 + 0.15;
        const dist = 48 + (i % 5) * 23;
        const rx = Math.cos(ang) * dist;
        const rz = Math.sin(ang) * dist;
        const ry = getPlanetSurfaceHeight(rx, rz);
        const rRad = 2.6 + (i % 3) * 1.1;
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(rRad, 0), rockMat);
        mesh.position.set(rx, ry + rRad * 0.65, rz);
        mesh.rotation.set(i * 0.4, i * 0.9, 0);
        applyCartoonInkOutlines(mesh, 1.05, true);
        _worldGroup.add(mesh);
        _planetRocks.push({ mesh, x: rx, y: ry + rRad * 0.65, z: rz, r: rRad, destroyed: false });
    }

    // Special Discovery on Neptune's Moon TRITON: STARSPEED Frozen Solid in a Cryo-Ice Crystal Block!
    if (cfg.id === 'TRITON') {
        const allies: string[] = Array.isArray(progression.discoveredAllies) ? progression.discoveredAllies : [];
        _frozenStarspeedFreed = allies.includes('STARSPEED');
        if (!_frozenStarspeedFreed) {
            const fx = TRITON_FROZEN_POS.x;
            const fz = TRITON_FROZEN_POS.z;
            const fy = getPlanetSurfaceHeight(fx, fz);

            const tomb = new THREE.Group();
            tomb.position.set(fx, fy, fz);

            // Actual 3D Starspeed Bot frozen in a heroic upright pose inside the ice!
            const frozenRig = buildRescueBotModel('STARSPEED');
            applyBotRigMorph(frozenRig, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            frozenRig.root.position.set(0, 0.25, 0);
            frozenRig.root.rotation.y = 0.55;
            tomb.add(frozenRig.root);

            // Faceted Translucent Cryo-Ice Block encasing Starspeed
            const iceMat = new THREE.MeshToonMaterial({
                color: 0x7dd3fc,
                gradientMap: toonGrad3,
                transparent: true,
                opacity: 0.58
            });
            const iceBlock = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.6, 8.6, 7), iceMat);
            iceBlock.position.y = 4.2;
            const iceCap = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.8, 7), iceMat);
            iceCap.position.y = 9.9;
            tomb.add(iceBlock, iceCap);

            // Jagged Frost Crystal Spires around the Base
            const spireMat = new THREE.MeshToonMaterial({ color: 0xbae6fd, gradientMap: toonGrad3, transparent: true, opacity: 0.8 });
            for (let s = 0; s < 6; s++) {
                const a = (s / 6) * Math.PI * 2;
                const spire = new THREE.Mesh(new THREE.ConeGeometry(0.95, 3.8 + (s % 2) * 1.4, 5), spireMat);
                spire.position.set(Math.cos(a) * 4.4, 1.8, Math.sin(a) * 4.4);
                spire.rotation.z = -Math.cos(a) * 0.35;
                spire.rotation.x = Math.sin(a) * 0.35;
                tomb.add(spire);
            }

            // Pulsing Cyan-Gold Rescue Beacon Ring on the ground
            _frozenStarspeedRing = new THREE.Mesh(
                new THREE.TorusGeometry(6.8, 0.38, 8, 32).rotateX(Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0x22d3ee })
            );
            _frozenStarspeedRing.position.y = 0.25;
            tomb.add(_frozenStarspeedRing);

            _frozenStarspeedGroup = tomb;
            _worldGroup.add(tomb);
        }
    }
}

export function updatePlanetSurfaceHUD() {
    const pill = document.getElementById('moon-hud-pill');
    const txt = document.getElementById('moon-stat-relics');
    const orbitBtn = document.getElementById('moon-orbit-btn');
    const earthBtn = document.getElementById('moon-earth-btn');
    const solarBtn = document.getElementById('planet-solar-btn');

    const active = worldState.activeArea === 'PLANET_SURFACE';
    if (worldState.activeArea !== 'MOON') {
        if (pill) pill.classList.toggle('hidden', !active);
        if (orbitBtn) {
            orbitBtn.classList.toggle('hidden', !active || !_activeConfig.returnSector);
            const span = orbitBtn.querySelector('span:last-child');
            if (active && span) {
                span.textContent = _activeConfig.returnSector ? `LAUNCH TO ${_activeConfig.returnSector} ORBIT` : 'LAUNCH TO ORBIT';
            }
        }
        if (earthBtn) earthBtn.classList.toggle('hidden', !active);
    }
    if (solarBtn) {
        const showSolar = active || worldState.activeArea === 'MOON';
        solarBtn.classList.toggle('hidden', !showSolar);
    }
    if (!active) return;

    const foundList: string[] = Array.isArray(progression.planetRelicsFound) ? progression.planetRelicsFound : [];
    const foundHere = _activeConfig.relics.filter(r => foundList.includes(r.id)).length;
    if (txt) {
        txt.textContent = `${foundHere} / ${_activeConfig.relics.length}`;
    }
    const gravEl = document.getElementById('moon-stat-gravity');
    if (gravEl) {
        gravEl.textContent = _activeConfig.gravityLabel;
    }
}

export function swapToPlanetSurface(planetId: LandablePlanetId, returnSector: string | null = null) {
    const cfg = PLANET_CONFIGS[planetId] || PLANET_CONFIGS.MARS;
    buildPlanetSurfaceWorld(cfg);

    worldState.activeArea = 'PLANET_SURFACE';
    worldState.activePlanetId = cfg.id;
    worldState.planetReturnSector = returnSector ?? cfg.returnSector;
    worldState.nearPlanetSigma = false;

    // Record visited planet in progression
    if (!Array.isArray(progression.visitedPlanets)) progression.visitedPlanets = [];
    if (!progression.visitedPlanets.includes(cfg.id)) {
        progression.visitedPlanets.push(cfg.id);
        saveProgression({ immediate: true });
    }

    // Move active player & buddy rigs into planetSurfaceScene
    const pRig = botRigs[player.botType]?.root;
    const bRig = botRigs[buddyBot.botType]?.root;
    Object.values(botRigs).forEach((r: any) => {
        if (r?.root && r.root.parent === planetSurfaceScene && r.root !== pRig && r.root !== bRig) {
            scene.add(r.root);
        }
    });
    if (pRig) planetSurfaceScene.add(pRig);
    if (bRig) planetSurfaceScene.add(bRig);
    const wp = (window as any).waypointGroup;
    if (wp) {
        planetSurfaceScene.add(wp);
        wp.visible = false;
    }
    setActiveParticleScene(planetSurfaceScene);

    // Spawn safely near Starship Sigma
    const spawnX = 0, spawnZ = 6;
    const spawnY = getPlanetSurfaceHeight(spawnX, spawnZ);
    player.pos.set(spawnX, spawnY, spawnZ);
    player.heading = 0;
    player.speed = 0;
    player.vy = 0;
    player.flightAlt = 0;
    player.grounded = true;
    player.hasWaypoint = false;
    buddyBot.pos.set(-7, getPlanetSurfaceHeight(-7, 10), 10);
    buddyBot.heading = 0;

    // Show standard bot controls; hide Space / Solar Hub / Saturn Race overlays
    const botControls = document.getElementById('bottom-controls-bar');
    if (botControls) botControls.classList.remove('hidden');
    const spaceBar = document.getElementById('space-controls-bar');
    if (spaceBar) spaceBar.classList.add('hidden');
    const spacePill = document.getElementById('space-hud-pill');
    if (spacePill) spacePill.classList.add('hidden');
    const solarUi = document.getElementById('solar-hub-ui');
    if (solarUi) solarUi.classList.add('hidden');
    const saturnHud = document.getElementById('saturn-race-hud');
    if (saturnHud) saturnHud.classList.add('hidden');
    const cavernPill = document.getElementById('cavern-hud-pill');
    if (cavernPill) cavernPill.classList.add('hidden');

    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = cfg.zoneLabel;

    updatePlanetSurfaceHUD();
    if (typeof (window as any).renderMinimap === 'function') (window as any).renderMinimap();

    showToast(`LANDED ON ${cfg.name}!`, cfg.welcomeToast);
    triggerNPCSpeech(
        'CHIEF BURNS',
        'Mission Control',
        `Touchdown confirmed on ${cfg.name}! Watch the ${cfg.gravityLabel} gravity and scan for Energon Relics!`,
        player,
        true
    );
}

export function restoreRigsFromPlanetSurface() {
    Object.values(botRigs).forEach((r: any) => {
        if (r?.root && r.root.parent === planetSurfaceScene) {
            scene.add(r.root);
        }
    });
    const wp = (window as any).waypointGroup;
    if (wp && wp.parent === planetSurfaceScene) {
        scene.add(wp);
        wp.visible = false;
    }
    setActiveParticleScene(scene);
}

export function updatePlanetSurface(dt: number, now: number) {
    if (worldState.activeArea !== 'PLANET_SURFACE') return;
    const nowSec = now * 0.001;

    // Keep active player & buddy rigs attached if user switched bots from roster
    const pRig = botRigs[player.botType]?.root;
    const bRig = botRigs[buddyBot.botType]?.root;
    if (pRig && pRig.parent !== planetSurfaceScene) planetSurfaceScene.add(pRig);
    if (bRig && bRig.parent !== planetSurfaceScene) planetSurfaceScene.add(bRig);

    // Clamp player within planetary crater rim
    const pDist = Math.hypot(player.pos.x, player.pos.z);
    if (pDist > PLANET_WORLD_RADIUS - 10) {
        const sc = (PLANET_WORLD_RADIUS - 10) / pDist;
        player.pos.x *= sc;
        player.pos.z *= sc;
    }

    // Animate vents & relics
    for (let i = 0; i < _planetAnimated.length; i++) {
        const a = _planetAnimated[i];
        if (a.kind === 'RELIC') {
            a.obj.rotation.y += dt * 1.9;
            a.obj.position.y = Math.sin(nowSec * 3.0 + a.phase) * 0.65;
        } else if (a.kind === 'VENT') {
            a.obj.rotation.y += dt * 3.2;
            const pulse = 0.88 + Math.sin(nowSec * 5.0 + a.phase) * 0.16;
            a.obj.scale.set(pulse, 0.9 + Math.sin(nowSec * 6.0 + a.phase) * 0.2, pulse);
        }
    }

    // Check Vent Updraft Jump Launch
    if (_ventCooldown > 0) _ventCooldown -= dt;
    for (let i = 0; i < _activeConfig.vents.length; i++) {
        const v = _activeConfig.vents[i];
        if (_ventCooldown <= 0 && Math.hypot(player.pos.x - v.x, player.pos.z - v.z) < 5.5) {
            player.vy = 24.0;
            player.grounded = false;
            _ventCooldown = 1.6;
            sfx.playStuntChime();
            spawnBurstParticles(v.x, player.pos.y + 1, v.z, _activeConfig.ventColor, 14, 1.1);
            showToast(`${v.label.toUpperCase()} BOOST!`, `Soaring in ${_activeConfig.gravityLabel} gravity!`);
        }
    }

    // Check Planetary Relic Collection
    for (let i = 0; i < _planetRelics.length; i++) {
        const rel = _planetRelics[i];
        if (rel.collected) continue;
        if (Math.hypot(player.pos.x - rel.x, player.pos.z - rel.z) < 6.5) {
            rel.collected = true;
            rel.group.visible = false;
            if (!Array.isArray(progression.planetRelicsFound)) progression.planetRelicsFound = [];
            if (!progression.planetRelicsFound.includes(rel.id)) {
                progression.planetRelicsFound.push(rel.id);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 5;
                saveProgression({ immediate: true });
            }
            sfx.playRelicFound();
            spawnSparkleGlints(rel.x, player.pos.y + 3, rel.z, 18);
            showToast('PLANETARY RELIC FOUND!', `${rel.name} collected on ${_activeConfig.name}! +5 Hero Points!`);
            updatePlanetSurfaceHUD();
        }
    }

    // Planetary Rock Collision & Boulder Smash
    const isBoulderSmashing = player.botType === 'BOULDER' && (player.smashTimer > 0 || player.scoopTimer > 0 || player.speed > 20);
    for (let i = 0; i < _planetRocks.length; i++) {
        const rock = _planetRocks[i];
        if (rock.destroyed) continue;
        const dx = player.pos.x - rock.x;
        const dz = player.pos.z - rock.z;
        const dist = Math.hypot(dx, dz);
        const minDist = rock.r + 2.4;
        if (dist < minDist + (isBoulderSmashing ? 3.0 : 0)) {
            if (isBoulderSmashing) {
                rock.destroyed = true;
                rock.mesh.visible = false;
                sfx.playRockBreak();
                spawnBurstParticles(rock.x, rock.y, rock.z, _activeConfig.rockColor, 14, 1.0);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
                saveProgression();
            } else if (dist > 0.01) {
                const push = (minDist - dist) / dist;
                player.pos.x += dx * push;
                player.pos.z += dz * push;
                player.speed *= 0.5;
            }
        }
    }

    // Check Frozen STARSPEED Discovery & Thaw on Neptune's Moon Triton!
    if (_activeConfig.id === 'TRITON' && _frozenStarspeedGroup && !_frozenStarspeedFreed) {
        if (_frozenStarspeedRing) {
            const p = 1.0 + Math.sin(nowSec * 4.5) * 0.1;
            _frozenStarspeedRing.scale.setScalar(p);
        }
        const distFrozen = Math.hypot(player.pos.x - TRITON_FROZEN_POS.x, player.pos.z - TRITON_FROZEN_POS.z);
        if (distFrozen < 11.5) {
            _frozenStarspeedFreed = true;
            _frozenStarspeedGroup.visible = false;
            if (!Array.isArray(progression.discoveredAllies)) progression.discoveredAllies = [];
            if (!progression.discoveredAllies.includes('STARSPEED')) {
                progression.discoveredAllies.push('STARSPEED');
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 10;
                saveProgression({ immediate: true });
            }
            updateBotRosterUI();
            sfx.playRockBreak();
            sfx.playRankUp();
            const fy = getPlanetSurfaceHeight(TRITON_FROZEN_POS.x, TRITON_FROZEN_POS.z);
            spawnBurstParticles(TRITON_FROZEN_POS.x, fy + 3.5, TRITON_FROZEN_POS.z, 0x7dd3fc, 28, 1.8);
            spawnSparkleGlints(TRITON_FROZEN_POS.x, fy + 4.5, TRITON_FROZEN_POS.z, 22);
            showToast(
                'NEW RESCUE BOT UNLOCKED: STARSPEED!',
                'Thawed out on Triton! Dirt Bike, Cosmic Jet Ski & Spinosaurus modes now in your Bot Roster!'
            );
            triggerNPCSpeech(
                'STARSPEED',
                'Deep-Space Motocross Scout',
                'Brrr! Thanks for thawing me out on Triton! Starspeed is unlocked — Dirt Bike, Jet Ski & Spinosaurus modes ready to roll!',
                player,
                true
            );
        }
    }

    // Proximity to Parked Starship Sigma
    const nearSigma = Math.hypot(player.pos.x - PLANET_SIGMA_POS.x, player.pos.z - PLANET_SIGMA_POS.z) < 18.5;
    worldState.nearPlanetSigma = nearSigma;
    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn && worldState.activeArea === 'PLANET_SURFACE') {
        if (nearSigma) {
            sigmaBtn.classList.remove('hidden');
            const sub = document.getElementById('sigma-action-sub');
            const lbl = document.getElementById('sigma-action-label');
            if (sub) sub.textContent = `${_activeConfig.name} LANDING PAD`;
            if (lbl) lbl.textContent = _activeConfig.returnSector ? `LAUNCH TO ${_activeConfig.returnSector} ORBIT` : 'OPEN SOLAR SYSTEM MAP';
        } else {
            sigmaBtn.classList.add('hidden');
        }
    }
}

export function getPlanetSurfaceMapData() {
    return {
        config: _activeConfig,
        radius: PLANET_WORLD_RADIUS,
        sigmaPos: PLANET_SIGMA_POS,
        relics: _planetRelics,
        vents: _activeConfig.vents
    };
}

// Register with terrain.ts so physics, Bot/Vehicle/Dino movement, and Buddy AI work seamlessly
setPlanetTerrainHooks({
    isActive: () => worldState.activeArea === 'PLANET_SURFACE',
    getSurfaceHeight: getPlanetSurfaceHeight,
    getZoneName: getPlanetZoneName
});

if (typeof window !== 'undefined') {
    Object.assign(window, {
        planetSurfaceScene,
        PLANET_CONFIGS,
        swapToPlanetSurface,
        getPlanetSurfaceMapData
    });
}

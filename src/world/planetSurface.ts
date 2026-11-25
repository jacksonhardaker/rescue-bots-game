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
import { buildCrashedSpaceshipSigma, type SigmaColliderEntry } from './spaceshipSigma.js';
import { buildRescueBotModel, applyBotRigMorph } from '../bots/botRigs.js';
import { updateBotRosterUI } from '../physics/player.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';

export const planetSurfaceScene = new THREE.Scene();
export const PLANET_WORLD_RADIUS = 560;
export const EUROPA_WORLD_RADIUS = 680;
export const PLANET_SIGMA_POS = { x: 0, z: -26 };
export const PLANET_CAVE_POS = { x: 52, z: 24 };

export function getActivePlanetRadius(): number {
    return _activeConfig?.id === 'EUROPA' ? EUROPA_WORLD_RADIUS : PLANET_WORLD_RADIUS;
}

export type LandablePlanetId =
    | 'MERCURY'
    | 'VENUS'
    | 'MARS'
    | 'PLUTO'
    | 'EUROPA'
    | 'IO'
    | 'GANYMEDE'
    | 'TITAN'
    | 'MIRANDA'
    | 'TITANIA'
    | 'TRITON';

export interface PlanetRelicDef {
    id: string;
    name: string;
    x: number;
    z: number;
}

export interface PlanetIslandDef {
    x: number;
    z: number;
    r: number;
    height: number;
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
    backdropKind: 'HUGE_SUN' | 'VENUS_CLOUDS' | 'MARS_SUN' | 'CHARON' | 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE';
    returnSector: string | null; // Non-null for giant moons (returns to giant's orbit)
    welcomeToast: string;
    waterLevel?: number;
    islands?: PlanetIslandDef[];
    volcanoes?: Array<{ x: number; z: number; scale?: number }>;
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
        volcanoes: [
            { x: -210, z: 120, scale: 1.15 },
            { x: 220, z: -130, scale: 1.0 }
        ],
        craters: [
            { x: -164, z: -140, r: 44, depth: 4.2, rim: 2.8 },
            { x: 172, z: -138, r: 46, depth: 4.4, rim: 3.0 },
            { x: 0, z: 236, r: 52, depth: 4.8, rim: 3.2 }
        ],
        vents: [
            { x: -58, z: -22, label: 'Solar Geyser' },
            { x: 64, z: -30, label: 'Solar Geyser' },
            { x: 0, z: 108, label: 'Caloris Vent' }
        ],
        relics: [
            { id: 'MERCURY_1', name: 'Caloris Solar Core', x: -164, z: -140 },
            { id: 'MERCURY_2', name: 'Sunflare Prism', x: 172, z: -138 },
            { id: 'MERCURY_3', name: 'Hermes Alloy Shard', x: 0, z: 236 }
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
        welcomeToast: '0.90G Sulfuric Clouds • Watch the Erupting Volcanoes & Recover 3 Venusian Relics!',
        volcanoes: [
            { x: -175, z: -165, scale: 1.25 },
            { x: 185, z: 140, scale: 1.1 },
            { x: 0, z: -245, scale: 1.3 }
        ],
        craters: [
            { x: -166, z: -114, r: 42, depth: 3.8, rim: 3.4 },
            { x: 168, z: -132, r: 44, depth: 4.0, rim: 3.6 },
            { x: -24, z: 222, r: 48, depth: 4.2, rim: 3.8 }
        ],
        vents: [
            { x: -54, z: 28, label: 'Sulfur Thermal Vent' },
            { x: 66, z: 34, label: 'Basalt Updraft' },
            { x: 0, z: -136, label: 'Maxwell Plume' }
        ],
        relics: [
            { id: 'VENUS_1', name: 'Aphrodite Thermal Gem', x: -166, z: -114 },
            { id: 'VENUS_2', name: 'Sulfur Cloud Probe', x: 168, z: -132 },
            { id: 'VENUS_3', name: 'Maxwell Basalt Core', x: -24, z: 222 }
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
        welcomeToast: '0.38G Martian Gravity • Explore Olympus Mons & Mars’s Underground Ocean!',
        volcanoes: [
            { x: -240, z: -180, scale: 1.45 }
        ],
        craters: [
            { x: -172, z: -124, r: 46, depth: 4.5, rim: 3.2 },
            { x: 174, z: -114, r: 44, depth: 4.2, rim: 3.0 },
            { x: 24, z: 238, r: 50, depth: 4.8, rim: 3.4 }
        ],
        vents: [
            { x: -66, z: -24, label: 'Mars Dust Devil' },
            { x: 70, z: 26, label: 'Mars Dust Devil' },
            { x: -26, z: 118, label: 'Canyon Updraft' }
        ],
        relics: [
            { id: 'MARS_1', name: 'Olympus Energon Core', x: -172, z: -124 },
            { id: 'MARS_2', name: 'Valles Marineris Prism', x: 174, z: -114 },
            { id: 'MARS_3', name: 'Red Planet Beacon', x: 24, z: 238 }
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
        zoneLabel: 'EUROPA — SUB-GLACIAL OCEAN ARCHIPELAGO',
        gravity: 0.22,
        gravityLabel: '0.22G',
        skyColor: 0x04091a,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xbae6fd,
        hemiGround: 0x0c4a6e,
        sunColor: 0xe0f2fe,
        sunIntensity: 1.4,
        groundBaseHex: '#e0f2fe',
        groundAccentHex: '#7dd3fc',
        groundCraterHex: '#0284c7',
        rockColor: 0x7dd3fc,
        ventColor: 0x22d3ee,
        relicColor: 0xfacc15,
        backdropKind: 'JUPITER',
        returnSector: 'JUPITER',
        welcomeToast: '0.22G Vast Ocean Moon! Sail the Sub-Glacial Sea in Boat Mode or High Tide Submarine!',
        waterLevel: 5.6,
        islands: [
            { x: 0, z: -12, r: 58, height: 7.4 },       // Central Sigma Ice-Shelf Island
            { x: 52, z: 24, r: 28, height: 7.4 },       // East Cave Peninsula
            { x: -240, z: -195, r: 54, height: 9.2 },   // Far North-West Ice Floe
            { x: 245, z: -185, r: 56, height: 9.4 },    // Far North-East Ice Floe
            { x: -230, z: 215, r: 52, height: 8.8 },    // Far South-West Ice Floe
            { x: 225, z: 235, r: 58, height: 9.6 },     // Far South-East Ice Floe
            { x: 0, z: 340, r: 54, height: 9.0 }        // Southern Polar Ice Shelf
        ],
        craters: [
            { x: -240, z: -195, r: 24, depth: 1.4, rim: 2.2 },
            { x: 245, z: -185, r: 26, depth: 1.4, rim: 2.2 },
            { x: 225, z: 235, r: 26, depth: 1.4, rim: 2.4 }
        ],
        vents: [
            { x: -240, z: -195, label: 'Ice Floe Geyser' },
            { x: 245, z: -185, label: 'Ocean Ice Plume' },
            { x: -230, z: 215, label: 'Europa Thermal Vent' }
        ],
        relics: [
            { id: 'EUROPA_1', name: 'Sub-Ice Energon Pearl', x: -240, z: -195 },
            { id: 'EUROPA_2', name: 'Jovian Frost Core', x: 245, z: -185 },
            { id: 'EUROPA_3', name: 'Galilean Ocean Shard', x: 0, z: 340 }
        ]
    },
    IO: {
        id: 'IO',
        name: 'IO',
        zoneLabel: 'IO — LOKI PATERA VOLCANIC PLAINS',
        gravity: 0.25,
        gravityLabel: '0.25G',
        skyColor: 0x160a05,
        fogColor: 0x2a1205,
        fogDensity: 0.0014,
        hemiSky: 0xfef08a,
        hemiGround: 0x7c2d12,
        sunColor: 0xfde047,
        sunIntensity: 1.5,
        groundBaseHex: '#eab308',
        groundAccentHex: '#ea580c',
        groundCraterHex: '#7c2d12',
        rockColor: 0x78350f,
        ventColor: 0xf97316,
        relicColor: 0x38bdf8,
        backdropKind: 'JUPITER',
        returnSector: 'JUPITER',
        welcomeToast: '0.25G Volcanic Moon • Watch Erupting Lava Volcanoes under Jupiter & find 3 Io Relics!',
        volcanoes: [
            { x: -190, z: -145, scale: 1.35 },
            { x: 195, z: -135, scale: 1.25 },
            { x: 15, z: 255, scale: 1.4 }
        ],
        craters: [
            { x: -160, z: -120, r: 46, depth: 4.5, rim: 3.4 },
            { x: 170, z: -115, r: 44, depth: 4.2, rim: 3.2 },
            { x: 10, z: 225, r: 50, depth: 4.8, rim: 3.6 }
        ],
        vents: [
            { x: -65, z: 28, label: 'Sulfur Plume' },
            { x: 75, z: -32, label: 'Loki Magma Vent' },
            { x: -15, z: 110, label: 'Volcanic Geyser' }
        ],
        relics: [
            { id: 'IO_1', name: 'Loki Caldera Crystal', x: -130, z: -110 },
            { id: 'IO_2', name: 'Sulfur Plasma Core', x: 140, z: -95 },
            { id: 'IO_3', name: 'Jovian Spark Beacon', x: 10, z: 185 }
        ]
    },
    GANYMEDE: {
        id: 'GANYMEDE',
        name: 'GANYMEDE',
        zoneLabel: 'GANYMEDE — GALILEO MAGNETOSPHERE BASIN',
        gravity: 0.24,
        gravityLabel: '0.24G',
        skyColor: 0x050918,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xc7d2fe,
        hemiGround: 0x334155,
        sunColor: 0xe0e7ff,
        sunIntensity: 1.35,
        groundBaseHex: '#94a3b8',
        groundAccentHex: '#64748b',
        groundCraterHex: '#334155',
        rockColor: 0x475569,
        ventColor: 0xa855f7,
        relicColor: 0x22d3ee,
        backdropKind: 'JUPITER',
        returnSector: 'JUPITER',
        welcomeToast: '0.24G Giant Moon • Explore the largest moon in the Solar System & find 3 Relics!',
        craters: [
            { x: -140, z: -105, r: 44, depth: 4.2, rim: 2.8 },
            { x: 135, z: -115, r: 42, depth: 4.0, rim: 2.6 },
            { x: 0, z: 190, r: 50, depth: 4.6, rim: 3.0 }
        ],
        vents: [
            { x: -62, z: -24, label: 'Magnetic Pulse Vent' },
            { x: 68, z: 24, label: 'Aurora Updraft' },
            { x: 0, z: 105, label: 'Galileo Geyser' }
        ],
        relics: [
            { id: 'GANYMEDE_1', name: 'Magnetosphere Prism', x: -140, z: -105 },
            { id: 'GANYMEDE_2', name: 'Galileo Grooved Core', x: 135, z: -115 },
            { id: 'GANYMEDE_3', name: 'Jovian Aurora Shard', x: 0, z: 190 }
        ]
    },
    TITAN: {
        id: 'TITAN',
        name: 'TITAN',
        zoneLabel: 'TITAN — SHANGRI-LA AMBER DUNES',
        gravity: 0.20,
        gravityLabel: '0.20G',
        skyColor: 0x92400e,
        fogColor: 0xb45309,
        fogDensity: 0.0024,
        hemiSky: 0xfde68a,
        hemiGround: 0x78350f,
        sunColor: 0xfef3c7,
        sunIntensity: 1.4,
        groundBaseHex: '#d97706',
        groundAccentHex: '#b45309',
        groundCraterHex: '#78350f',
        rockColor: 0x92400e,
        ventColor: 0xfde047,
        relicColor: 0x22d3ee,
        backdropKind: 'SATURN',
        returnSector: null,
        welcomeToast: '0.20G Golden Haze Moon • Cruise Saturn-lit dunes & collect 3 Titan Relics!',
        craters: [
            { x: -125, z: -100, r: 38, depth: 3.8, rim: 2.5 },
            { x: 132, z: -98, r: 40, depth: 3.8, rim: 2.5 },
            { x: -10, z: 180, r: 44, depth: 4.2, rim: 2.8 }
        ],
        vents: [
            { x: -58, z: 22, label: 'Cryo-Methane Plume' },
            { x: 64, z: -18, label: 'Dune Thermal Vent' },
            { x: 0, z: 98, label: 'Kraken Mare Vent' }
        ],
        relics: [
            { id: 'TITAN_1', name: 'Shangri-La Amber Gem', x: -125, z: -100 },
            { id: 'TITAN_2', name: 'Huygens Beacon Core', x: 132, z: -98 },
            { id: 'TITAN_3', name: 'Saturnian Ring Shard', x: -10, z: 180 }
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
            { x: -122, z: -96, r: 38, depth: 4.0, rim: 3.0 },
            { x: 130, z: -90, r: 38, depth: 3.8, rim: 3.0 },
            { x: 0, z: 175, r: 44, depth: 4.2, rim: 3.2 }
        ],
        vents: [
            { x: -56, z: 24, label: 'Rift Updraft' },
            { x: 60, z: 20, label: 'Rift Updraft' },
            { x: 0, z: 96, label: 'Verona Cliff Vent' }
        ],
        relics: [
            { id: 'MIRANDA_1', name: 'Verona Cliff Crystal', x: -122, z: -96 },
            { id: 'MIRANDA_2', name: 'Uranian Ring Shard', x: 130, z: -90 },
            { id: 'MIRANDA_3', name: 'Ice-Giant Beacon', x: 0, z: 175 }
        ]
    },
    TITANIA: {
        id: 'TITANIA',
        name: 'TITANIA',
        zoneLabel: 'TITANIA — GERTRUDE FROST CHASMS',
        gravity: 0.19,
        gravityLabel: '0.19G',
        skyColor: 0x050a18,
        fogColor: null,
        fogDensity: 0,
        hemiSky: 0xe0f2fe,
        hemiGround: 0x1e293b,
        sunColor: 0xf0f9ff,
        sunIntensity: 1.3,
        groundBaseHex: '#e2e8f0',
        groundAccentHex: '#94a3b8',
        groundCraterHex: '#475569',
        rockColor: 0x64748b,
        ventColor: 0x67e8f9,
        relicColor: 0xfbbf24,
        backdropKind: 'URANUS',
        returnSector: 'URANUS',
        welcomeToast: '0.19G Frost-Canyon Moon • Soar over Uranus ice chasms & find 3 Titania Relics!',
        craters: [
            { x: -128, z: -102, r: 40, depth: 4.0, rim: 2.8 },
            { x: 126, z: -104, r: 40, depth: 4.0, rim: 2.8 },
            { x: 8, z: 182, r: 46, depth: 4.4, rim: 3.0 }
        ],
        vents: [
            { x: -60, z: -16, label: 'Frost Chasm Jet' },
            { x: 64, z: 22, label: 'Uranian Cryo-Vent' },
            { x: 0, z: 102, label: 'Gertrude Plume' }
        ],
        relics: [
            { id: 'TITANIA_1', name: 'Gertrude Frost Core', x: -128, z: -102 },
            { id: 'TITANIA_2', name: 'Messina Chasm Prism', x: 126, z: -104 },
            { id: 'TITANIA_3', name: 'Crown Ice Beacon', x: 8, z: 182 }
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

interface PlanetLandmarkNode {
    kind: 'MERCURY_MIRROR' | 'VENUS_PROBE' | 'MARS_RAMP' | 'PLUTO_SLIDE';
    x: number;
    z: number;
    group: THREE.Group;
    beaconMat?: THREE.MeshBasicMaterial;
    pivot?: THREE.Object3D;
    activated: boolean;
    cooldown: number;
}

interface PlanetSlalomGate {
    x: number;
    y: number;
    z: number;
    mesh: THREE.Group;
    ringMat: THREE.MeshBasicMaterial;
    cleared: boolean;
}

interface PlanetMonolith {
    id: string;
    name: string;
    x: number;
    z: number;
    group: THREE.Group;
    beaconMat: THREE.MeshBasicMaterial;
    scanned: boolean;
}

interface EruptingVolcano {
    x: number;
    y: number;
    z: number;
    scale: number;
    lavaMat: THREE.MeshBasicMaterial;
    plumeGroup: THREE.Group;
    eruptTimer: number;
    nextEruptIn: number;
}

const _planetVolcanoes: EruptingVolcano[] = [];

let _activeConfig: PlanetConfig = PLANET_CONFIGS.MARS;
let _builtPlanetId: LandablePlanetId | null = null;
let _worldGroup: THREE.Group | null = null;
let _planetSigmaRoot: THREE.Group | null = null;
let _planetWaterMesh: THREE.Mesh | null = null;
let _frozenStarspeedGroup: THREE.Group | null = null;
let _frozenStarspeedRing: THREE.Mesh | null = null;
let _frozenStarspeedFreed = false;
const TRITON_FROZEN_POS = { x: -54, z: -62 };
const _planetRelics: PlanetRelicRuntime[] = [];
const _planetRocks: PlanetRockRuntime[] = [];
const _planetColliders: SigmaColliderEntry[] = [];
const _planetLandmarks: PlanetLandmarkNode[] = [];
const _planetGates: PlanetSlalomGate[] = [];
const _planetMonoliths: PlanetMonolith[] = [];
const _planetAnimated: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];
let _ventCooldown = 0;
let _caveEnterCooldown = 0;
let _planetCavernEnterHandler: ((planetId: LandablePlanetId) => void) | null = null;

export function setPlanetCavernEnterHandler(fn: (planetId: LandablePlanetId) => void) {
    _planetCavernEnterHandler = fn;
}

export function enterActivePlanetCave() {
    if (_planetCavernEnterHandler && _caveEnterCooldown <= 0) {
        _caveEnterCooldown = 2.0;
        _planetCavernEnterHandler(_activeConfig.id);
    }
}

export function setPlanetCaveCooldown(sec = 2.0) {
    _caveEnterCooldown = Math.max(_caveEnterCooldown, sec);
}

export function buildSurfaceCaveEntranceMesh(rockColor: number, accentColor: number, isIce = false): THREE.Group {
    const g = new THREE.Group();
    const matRock = new THREE.MeshToonMaterial({
        color: rockColor,
        gradientMap: toonGrad3,
        transparent: isIce,
        opacity: isIce ? 0.92 : 1.0
    });
    const matDarkTunnel = new THREE.MeshBasicMaterial({ color: 0x010205 });
    const matLanternGlow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const matCrystal = new THREE.MeshBasicMaterial({ color: accentColor });

    // Rugged hillside mound behind the cave mouth (kept well behind z = -1.6 so the black mouth is never occluded!)
    const hillMound = new THREE.Mesh(new THREE.DodecahedronGeometry(9.0, 1), matRock);
    hillMound.scale.set(1.42, 0.96, 0.72);
    hillMound.position.set(0, 3.8, -8.2);
    g.add(hillMound);

    // Side rock/ice arch pillars flanking the wide dark cave opening
    [-5.3, 5.3].forEach((px, idx) => {
        const pillar = new THREE.Mesh(new THREE.DodecahedronGeometry(2.7, 0), matRock);
        pillar.scale.set(0.88, 1.95, 1.15);
        pillar.position.set(px, 2.8, 0.4);
        pillar.rotation.y = idx === 0 ? 0.35 : -0.35;
        g.add(pillar);
    });

    // Keystone boulders forming the cave arch lintel above the dark mouth
    [
        { x: -3.2, y: 6.3, r: 2.1 },
        { x: 0, y: 7.2, r: 2.4 },
        { x: 3.2, y: 6.3, r: 2.1 }
    ].forEach(b => {
        const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(b.r, 0), matRock);
        cap.scale.set(1.25, 0.85, 1.1);
        cap.position.set(b.x, b.y, 0.5);
        g.add(cap);
    });

    // Deep pitch-black cave mouth (tall, wide & unobscured from the front!)
    const tunnelBox = new THREE.Mesh(new THREE.BoxGeometry(7.6, 5.8, 5.2), matDarkTunnel);
    tunnelBox.position.set(0, 2.8, -1.35);
    tunnelBox.userData.noOutline = true;
    const tunnelArch = new THREE.Mesh(
        new THREE.CylinderGeometry(3.8, 3.8, 5.2, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2),
        matDarkTunnel
    );
    tunnelArch.position.set(0, 5.0, -1.35);
    tunnelArch.userData.noOutline = true;
    g.add(tunnelBox, tunnelArch);

    // Hanging stalactites along top cave lip
    [-2.4, -0.8, 0.8, 2.4].forEach((sx, idx) => {
        const len = 1.25 + (idx % 2) * 0.55;
        const stal = new THREE.Mesh(new THREE.ConeGeometry(0.38, len, 5).rotateX(Math.PI), matRock);
        stal.position.set(sx, 5.75 - len * 0.4, 1.35);
        g.add(stal);
    });

    // Rocky threshold apron leading into the cave
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.2, 0.35, 12), matDarkSteel);
    apron.position.set(0, 0.16, 2.2);
    g.add(apron);

    // Two expedition lantern posts + subtle accent crystal cluster flanking the mouth
    [-5.1, 5.1].forEach(lx => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.2, 8), matDarkSteel);
        post.position.set(lx, 1.6, 2.8);
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), matLanternGlow);
        lantern.position.set(lx, 3.35, 2.8);
        lantern.userData.noOutline = true;
        g.add(post, lantern);
    });

    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.9, 5), matCrystal);
    crystal.position.set(-6.2, 1.2, 1.6);
    crystal.rotation.z = 0.28;
    crystal.userData.noOutline = true;
    g.add(crystal);

    applyCartoonInkOutlines(g, 1.03, true);
    return g;
}

export function getActivePlanetConfig(): PlanetConfig {
    return _activeConfig;
}

export function isPlanetPointInWater(x: number, z: number): boolean {
    if (worldState.activeArea !== 'PLANET_SURFACE') return false;
    if (_activeConfig.waterLevel === undefined) return false;
    return getPlanetSurfaceHeight(x, z) < _activeConfig.waterLevel - 0.15;
}

export function getActivePlanetGravity(): number {
    return _activeConfig ? _activeConfig.gravity : 0.38;
}

export function getPlanetSurfaceHeight(x: number, z: number): number {
    const cfg = _activeConfig;
    const r = Math.hypot(x, z);

    // Water-world island/ocean bathymetry (e.g. Europa)
    if (cfg.waterLevel !== undefined && cfg.islands) {
        let h = 3.1 + Math.sin(x * 0.028) * Math.cos(z * 0.028) * 0.45;
        for (let i = 0; i < cfg.islands.length; i++) {
            const isl = cfg.islands[i];
            const d = Math.hypot(x - isl.x, z - isl.z);
            if (d < isl.r + 22) {
                const t = Math.max(0, Math.min(1, 1 - (d - isl.r * 0.55) / (isl.r * 0.45 + 22)));
                const smooth = t * t * (3 - 2 * t);
                h = Math.max(h, THREE.MathUtils.lerp(3.1, isl.height, smooth));
            }
        }
        // Keep central Sigma landing pad and Cave Entrance island level
        const dSigma = Math.hypot(x - PLANET_SIGMA_POS.x, z - PLANET_SIGMA_POS.z);
        if (dSigma < 32) {
            const t = Math.max(0, Math.min(1, (dSigma - 20) / 12));
            h = THREE.MathUtils.lerp(7.2, h, t);
        }
        const dCave = Math.hypot(x - PLANET_CAVE_POS.x, z - PLANET_CAVE_POS.z);
        if (dCave < 18) {
            const t = Math.max(0, Math.min(1, (dCave - 10) / 8));
            h = THREE.MathUtils.lerp(7.2, h, t);
        }
        const radiusLimit = getActivePlanetRadius();
        if (r > radiusLimit - 32) {
            const edgeT = (r - (radiusLimit - 32)) / 32;
            h += edgeT * edgeT * 14.0;
        }
        return h;
    }

    // Keep baseline well above y = 0 so Earth ocean water checks never trigger
    let h = 6.0 + Math.sin(x * 0.016) * Math.cos(z * 0.016) * 2.4 + Math.sin(x * 0.048 + z * 0.042) * 0.72;

    // Flatten central landing zone around Starship Sigma
    const dCenter = Math.hypot(x, z + 10);
    if (dCenter < 48) {
        const t = Math.max(0, Math.min(1, (dCenter - 26) / 22));
        h = THREE.MathUtils.lerp(6.0, h, t);
    }

    // Flatten Cave Entrance threshold
    const dCave = Math.hypot(x - PLANET_CAVE_POS.x, z - PLANET_CAVE_POS.z);
    if (dCave < 22) {
        const t = Math.max(0, Math.min(1, (dCave - 12) / 10));
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

    const radiusLimit = getActivePlanetRadius();
    if (r > radiusLimit - 36) {
        const edgeT = (r - (radiusLimit - 36)) / 36;
        h += edgeT * edgeT * 18.0;
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
    } else if (kind === 'SATURN') {
        const sat = new THREE.Mesh(
            new THREE.SphereGeometry(72, 26, 20),
            new THREE.MeshBasicMaterial({ color: 0xeab308 })
        );
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(94, 148, 48),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.58 })
        );
        ring.rotation.set(Math.PI * 0.36, 0.2, 0.14);
        g.add(sat, ring);
        g.position.set(85, 134, -245);
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
    _planetColliders.length = 0;
    _planetLandmarks.length = 0;
    _planetGates.length = 0;
    _planetMonoliths.length = 0;
    _planetVolcanoes.length = 0;
    _planetAnimated.length = 0;
    _planetSigmaRoot = null;
    _planetWaterMesh = null;
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

    // Sculpted Planetary Terrain (Expanded 560m / 680m for Europa!)
    const activeRadius = getActivePlanetRadius();
    const segs = 112;
    const terrainGeo = new THREE.PlaneGeometry(activeRadius * 2.2, activeRadius * 2.2, segs, segs);
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

    // Water-Planet Ocean Surface (e.g. Vast Europa Sub-Glacial Ocean Archipelago!)
    if (cfg.waterLevel !== undefined) {
        const oceanGeo = new THREE.CircleGeometry(activeRadius + 50, 72).rotateX(-Math.PI / 2);
        const oceanMat = new THREE.MeshToonMaterial({
            color: 0x0284c7,
            emissive: 0x0369a1,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.84,
            gradientMap: toonGrad3
        });
        _planetWaterMesh = new THREE.Mesh(oceanGeo, oceanMat);
        _planetWaterMesh.position.y = cfg.waterLevel;
        _worldGroup.add(_planetWaterMesh);

        // Shoreline ice-foam rings around each island
        cfg.islands?.forEach((isl) => {
            const foam = new THREE.Mesh(
                new THREE.RingGeometry(isl.r * 0.72, isl.r * 0.86, 36).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
            );
            foam.position.set(isl.x, cfg.waterLevel! + 0.08, isl.z);
            _worldGroup!.add(foam);
        });

        // Floating Crystalline Icebergs & Glowing Ocean Trench Rings across the Vast Sea
        const matIceberg = new THREE.MeshToonMaterial({ color: 0xbae6fd, gradientMap: toonGrad3 });
        for (let ib = 0; ib < 18; ib++) {
            const ang = (ib / 18) * Math.PI * 2 + 0.2;
            const dist = 105 + ((ib * 67) % 390);
            const ix = Math.cos(ang) * dist;
            const iz = Math.sin(ang) * dist;
            if (getPlanetSurfaceHeight(ix, iz) >= cfg.waterLevel - 0.3) continue;
            const sz = 4.5 + (ib % 3) * 2.8;
            const berg = new THREE.Mesh(new THREE.ConeGeometry(sz, sz * 1.9, 6), matIceberg);
            berg.position.set(ix, cfg.waterLevel + sz * 0.35, iz);
            berg.rotation.y = ib * 0.7;
            applyCartoonInkOutlines(berg, 1.03, true);
            _worldGroup.add(berg);
            _planetColliders.push({ x: ix, z: iz, r: sz * 0.82 });
        }
    }

    // Parked Starship Sigma on illuminated Landing Pad
    const sigmaY = getPlanetSurfaceHeight(PLANET_SIGMA_POS.x, PLANET_SIGMA_POS.z);
    const padRing = new THREE.Mesh(
        new THREE.RingGeometry(12.5, 16.0, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    padRing.position.set(PLANET_SIGMA_POS.x, sigmaY + 0.14, PLANET_SIGMA_POS.z);
    _worldGroup.add(padRing);

    _planetSigmaRoot = buildCrashedSpaceshipSigma(_worldGroup, _planetAnimated, _planetColliders, {
        originX: PLANET_SIGMA_POS.x,
        originZ: PLANET_SIGMA_POS.z,
        includeDiorama: false,
        flatLevel: true,
        rotationY: Math.PI
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

    // Modeled 3D Surface Cave Entrance (rock/ice/volcanic arch tunnel leading to PLANET_CAVERN)
    const caveY = getPlanetSurfaceHeight(PLANET_CAVE_POS.x, PLANET_CAVE_POS.z);
    const isIceCave = cfg.id === 'EUROPA' || cfg.id === 'TRITON' || cfg.id === 'MIRANDA' || cfg.id === 'TITANIA' || cfg.id === 'PLUTO';
    const caveMesh = buildSurfaceCaveEntranceMesh(cfg.rockColor, cfg.relicColor, isIceCave);
    caveMesh.position.set(PLANET_CAVE_POS.x, caveY, PLANET_CAVE_POS.z);
    caveMesh.rotation.y = Math.atan2(-PLANET_CAVE_POS.x, -PLANET_CAVE_POS.z); // Faces directly toward central landing zone!
    // Tall amber horizon beacon above the Cave Entrance so explorers can spot it from afar
    const caveBeacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 1.4, 38, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    caveBeacon.position.set(0, 21, 1.5);
    caveBeacon.userData.noOutline = true;
    caveMesh.add(caveBeacon);
    _worldGroup.add(caveMesh);
    // Solid rock flank colliders around cave pillars while leaving the tunnel mouth open!
    _planetColliders.push({ x: PLANET_CAVE_POS.x - 5.2, z: PLANET_CAVE_POS.z - 3.0, r: 2.8 });
    _planetColliders.push({ x: PLANET_CAVE_POS.x + 3.0, z: PLANET_CAVE_POS.z - 5.2, r: 2.8 });

    // Actively Erupting Volcanoes (Io, Mercury, Venus, Mars Olympus Mons)
    if (cfg.volcanoes && cfg.volcanoes.length > 0) {
        const matBasalt = new THREE.MeshToonMaterial({ color: 0x292524, gradientMap: toonGrad3 });
        const matSmoke = new THREE.MeshBasicMaterial({ color: 0x78716c, transparent: true, opacity: 0.45 });
        cfg.volcanoes.forEach((vc, idx) => {
            const vy = getPlanetSurfaceHeight(vc.x, vc.z);
            const sc = vc.scale ?? 1.0;
            const vg = new THREE.Group();
            vg.position.set(vc.x, vy - 0.5, vc.z);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(24 * sc, 30 * sc, 12, 1, true), matBasalt);
            cone.position.y = 14.5 * sc;
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(6.2 * sc, 24 * sc, 29 * sc, 12), matBasalt);
            cap.position.y = 14.5 * sc;
            const lavaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const lavaPool = new THREE.Mesh(new THREE.CircleGeometry(5.6 * sc, 16).rotateX(-Math.PI / 2), lavaMat);
            lavaPool.position.y = 29.1 * sc;
            // Magma fissures streaming down flanks
            for (let f = 0; f < 4; f++) {
                const fa = (f / 4) * Math.PI * 2 + idx;
                const fissure = new THREE.Mesh(new THREE.BoxGeometry(1.1 * sc, 22 * sc, 0.9 * sc), lavaMat);
                fissure.position.set(Math.cos(fa) * 11 * sc, 14 * sc, Math.sin(fa) * 11 * sc);
                fissure.rotation.z = Math.cos(fa) * 0.48;
                fissure.rotation.x = -Math.sin(fa) * 0.48;
                vg.add(fissure);
            }
            const plumeGroup = new THREE.Group();
            plumeGroup.position.y = 30 * sc;
            for (let sp = 0; sp < 5; sp++) {
                const puff = new THREE.Mesh(new THREE.DodecahedronGeometry((3.2 + sp * 0.8) * sc, 0), matSmoke);
                puff.position.set(Math.sin(sp) * 2.2, sp * 5.5 * sc, Math.cos(sp) * 2.2);
                plumeGroup.add(puff);
            }
            vg.add(cap, cone, lavaPool, plumeGroup);
            applyCartoonInkOutlines(cap, 1.02, true);
            _worldGroup!.add(vg);
            _planetColliders.push({ x: vc.x, z: vc.z, r: 21 * sc });
            _planetVolcanoes.push({
                x: vc.x,
                y: vy + 29 * sc,
                z: vc.z,
                scale: sc,
                lavaMat,
                plumeGroup,
                eruptTimer: 0,
                nextEruptIn: 2.0 + idx * 1.8
            });
        });
    }

    // 2 Scanable Ancient Monoliths per World (with tall purple horizon beacons!)
    const isWaterWorld = cfg.waterLevel !== undefined;
    const scannedMonoliths: string[] = Array.isArray(progression.planetMonolithsScanned) ? progression.planetMonolithsScanned : [];
    const monoCoords = isWaterWorld
        ? [
            { id: `${cfg.id}_MONO_1`, name: `${cfg.name} Alpha Monolith`, x: -240, z: -155 },
            { id: `${cfg.id}_MONO_2`, name: `${cfg.name} Ridge Obelisk`, x: 225, z: 195 }
        ]
        : [
            { id: `${cfg.id}_MONO_1`, name: `${cfg.name} Alpha Monolith`, x: -136, z: -42 },
            { id: `${cfg.id}_MONO_2`, name: `${cfg.name} Ridge Obelisk`, x: 148, z: 112 }
        ];
    monoCoords.forEach((mc) => {
        const my = getPlanetSurfaceHeight(mc.x, mc.z);
        const mg = new THREE.Group();
        mg.position.set(mc.x, my, mc.z);
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.0, 0.9, 8), matDarkSteel);
        plinth.position.y = 0.45;
        const obelisk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 12.0, 1.5), matDarkSteel);
        obelisk.position.y = 6.4;
        const already = scannedMonoliths.includes(mc.id);
        const beaconMat = new THREE.MeshBasicMaterial({ color: already ? 0x4ade80 : cfg.relicColor });
        const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.2, 1.65), beaconMat);
        glyph.position.y = 6.0;
        glyph.userData.noOutline = true;
        const skyBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 1.2, 42, 8, 1, true),
            new THREE.MeshBasicMaterial({ color: already ? 0x4ade80 : 0xa855f7, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
        );
        skyBeam.position.y = 26;
        skyBeam.userData.noOutline = true;
        mg.add(plinth, obelisk, glyph, skyBeam);
        applyCartoonInkOutlines(obelisk, 1.03, true);
        _worldGroup!.add(mg);
        _planetColliders.push({ x: mc.x, z: mc.z, r: 2.8 });
        _planetMonoliths.push({ id: mc.id, name: mc.name, x: mc.x, z: mc.z, group: mg, beaconMat, scanned: already });
    });

    // Surface Slalom / Vast Europa 12-Buoy Ocean Course
    const gateCount = isWaterWorld ? 12 : 8;
    const gateRadius = isWaterWorld ? 195 : 138;
    for (let gi = 0; gi < gateCount; gi++) {
        const ang = (gi / gateCount) * Math.PI * 2 + 0.35;
        const gx = Math.cos(ang) * gateRadius;
        const gz = Math.sin(ang) * gateRadius + 24;
        const gy = isWaterWorld ? (cfg.waterLevel! + 1.8) : (getPlanetSurfaceHeight(gx, gz) + 3.2);
        const gateGrp = new THREE.Group();
        gateGrp.position.set(gx, gy, gz);
        gateGrp.lookAt(0, gy, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: isWaterWorld ? 0x38bdf8 : 0xfbbf24 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.46, 8, 24), ringMat);
        gateGrp.add(ring);
        if (isWaterWorld) {
            const buoy = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 8), matOptimusRed);
            buoy.position.y = -4.6;
            gateGrp.add(buoy);
        }
        _worldGroup.add(gateGrp);
        _planetGates.push({ x: gx, y: gy, z: gz, mesh: gateGrp, ringMat, cleared: false });
    }

    // Outpost Beacon Tower near Landing Pad
    const beaconX = 22, beaconZ = -10;
    _planetColliders.push({ x: beaconX, z: beaconZ, r: 4.4 });
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
        const relicBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.65, 1.6, 52, 10, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
        );
        relicBeam.position.y = 26;
        relicBeam.userData.noOutline = true;
        rg.add(spinner, relicBeam);
        rg.visible = !collected;
        _worldGroup!.add(rg);
        _planetRelics.push({ ...rd, group: rg, spinner, collected });
        _planetAnimated.push({ obj: spinner, kind: 'RELIC', baseY: 0, phase: idx * 1.1 });
    });

    // Smashable Planetary Rocks (Boulder can smash them for Energon!)
    const rockMat = new THREE.MeshToonMaterial({ color: cfg.rockColor, gradientMap: toonGrad3 });
    for (let i = 0; i < 38; i++) {
        const ang = (i / 38) * Math.PI * 2 + 0.15;
        const dist = 58 + (i % 6) * 44;
        const rx = Math.cos(ang) * dist;
        const rz = Math.sin(ang) * dist;
        const ry = getPlanetSurfaceHeight(rx, rz);
        if (cfg.waterLevel !== undefined && ry < cfg.waterLevel + 0.3) continue; // Keep Europa ocean channels clear!
        if (Math.hypot(rx - PLANET_CAVE_POS.x, rz - PLANET_CAVE_POS.z) < 16) continue;
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

    // Signature Interactive Landmarks for Mercury, Venus, Mars & Pluto!
    if (cfg.id === 'MERCURY') {
        // 3 Solar Mirror Collectors to align toward the giant blazing Sun
        const coords = [{ x: -46, z: 24 }, { x: 46, z: 22 }, { x: 0, z: -68 }];
        coords.forEach(pt => {
            const py = getPlanetSurfaceHeight(pt.x, pt.z);
            const g = new THREE.Group();
            g.position.set(pt.x, py, pt.z);
            const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 3.2, 10), matDarkSteel);
            ped.position.y = 1.6;
            const pivot = new THREE.Group();
            pivot.position.y = 4.2;
            pivot.rotation.x = 0.55;
            const dish = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.2, 0.35), matOptimusGold);
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), beaconMat);
            core.position.z = 0.45;
            pivot.add(dish, core);
            g.add(ped, pivot);
            applyCartoonInkOutlines(ped, 1.04, true);
            _worldGroup!.add(g);
            _planetLandmarks.push({ kind: 'MERCURY_MIRROR', x: pt.x, z: pt.z, group: g, pivot, beaconMat, activated: false, cooldown: 0 });
        });
    } else if (cfg.id === 'VENUS') {
        // 3 Atmospheric Weather Probes to repair
        const coords = [{ x: -48, z: -18 }, { x: 48, z: -16 }, { x: 12, z: 60 }];
        coords.forEach((pt, idx) => {
            const py = getPlanetSurfaceHeight(pt.x, pt.z);
            const g = new THREE.Group();
            g.position.set(pt.x, py + 3.2, pt.z);
            const body = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 10), matChrome);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.35, 8, 22).rotateX(Math.PI / 2), matOptimusRed);
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const light = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), beaconMat);
            light.position.y = 2.8;
            g.add(body, ring, light);
            applyCartoonInkOutlines(body, 1.04, true);
            _worldGroup!.add(g);
            _planetAnimated.push({ obj: g, kind: 'RELIC', baseY: py + 3.2, phase: idx * 1.5 });
            _planetLandmarks.push({ kind: 'VENUS_PROBE', x: pt.x, z: pt.z, group: g, beaconMat, activated: false, cooldown: 0 });
        });
    } else if (cfg.id === 'MARS') {
        // 2 Olympus Mega-Stunt Launch Ramps
        const coords = [{ x: -24, z: 34, rot: 0.4 }, { x: 34, z: -22, rot: -0.6 }];
        coords.forEach(pt => {
            const py = getPlanetSurfaceHeight(pt.x, pt.z);
            const g = new THREE.Group();
            g.position.set(pt.x, py, pt.z);
            g.rotation.y = pt.rot;
            const wedge = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.2, 14).rotateX(-0.26), matDarkSteel);
            wedge.position.y = 1.6;
            const strip = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 13.5).rotateX(-0.26), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
            strip.position.y = 2.28;
            g.add(wedge, strip);
            _worldGroup!.add(g);
            _planetLandmarks.push({ kind: 'MARS_RAMP', x: pt.x, z: pt.z, group: g, activated: false, cooldown: 0 });
        });
    } else if (cfg.id === 'PLUTO') {
        // Charon Glacier Super-Slide Ice Runway
        const py = getPlanetSurfaceHeight(0, 48);
        const g = new THREE.Group();
        g.position.set(0, py + 0.35, 48);
        const runway = new THREE.Mesh(
            new THREE.BoxGeometry(11, 0.4, 46),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.78 })
        );
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 46), new THREE.MeshBasicMaterial({ color: 0xe0f2fe }));
        railL.position.set(-5.6, 0.45, 0);
        const railR = railL.clone();
        railR.position.x = 5.6;
        g.add(runway, railL, railR);
        _worldGroup!.add(g);
        _planetLandmarks.push({ kind: 'PLUTO_SLIDE', x: 0, z: 48, group: g, activated: false, cooldown: 0 });
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
    const rigs = botRigs;
    if (rigs) {
        const pRig = rigs[player.botType]?.root;
        const bRig = rigs[buddyBot.botType]?.root;
        Object.values(rigs).forEach((r) => {
            if (r?.root && r.root.parent === planetSurfaceScene && r.root !== pRig && r.root !== bRig) {
                scene.add(r.root);
            }
        });
        if (pRig) planetSurfaceScene.add(pRig);
        if (bRig) planetSurfaceScene.add(bRig);
    }
    const wp = window.waypointGroup;
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
    player.onRailwayTrack = false;
    player.boatMorph = 0;
    player.targetBoatMorph = 0;
    if (typeof window.enforceEnvironmentModeRules === 'function') (window.enforceEnvironmentModeRules as (imm?: boolean) => void)(true);
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
    if (typeof window.renderMinimap === 'function') window.renderMinimap();

    showToast(`LANDED ON ${cfg.name}!`, cfg.welcomeToast);
    triggerNPCSpeech(
        'CHIEF BURNS',
        'Mission Control',
        `Touchdown confirmed on ${cfg.name}! Watch the ${cfg.gravityLabel} gravity and scan for Energon Relics!`,
        player as unknown as SpeechTarget,
        true
    );
}

export function restoreRigsFromPlanetSurface() {
    if (botRigs) {
        Object.values(botRigs).forEach((r) => {
            if (r?.root && r.root.parent === planetSurfaceScene) {
                scene.add(r.root);
            }
        });
    }
    const wp = window.waypointGroup;
    if (wp && wp.parent === planetSurfaceScene) {
        scene.add(wp);
        wp.visible = false;
    }
    setActiveParticleScene(scene);
}

export function resolvePlanetSurfaceCollisions(pos: THREE.Vector3, radius = 2.3, isPlayer = false) {
    if (worldState.activeArea !== 'PLANET_SURFACE') return;

    // Clamp within planetary crater rim
    const pDist = Math.hypot(pos.x, pos.z);
    const maxR = getActivePlanetRadius() - 12;
    if (pDist > maxR) {
        const sc = maxR / pDist;
        pos.x *= sc;
        pos.z *= sc;
    }

    // 2-pass resolution against Starship Sigma (fuselage + swept wings) & Outpost Beacon Tower
    for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < _planetColliders.length; i++) {
            const c = _planetColliders[i];
            const groundY = getPlanetSurfaceHeight(c.x, c.z);
            if (pos.y > groundY + 12.5) continue;
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

    // Planetary Rock Collision & Boulder Smash
    const isBoulderSmashing = isPlayer && player.botType === 'BOULDER' && (player.smashTimer > 0 || player.scoopTimer > 0 || player.speed > 20);
    for (let i = 0; i < _planetRocks.length; i++) {
        const rock = _planetRocks[i];
        if (rock.destroyed) continue;
        if (pos.y > rock.y + rock.r * 1.9 + 0.6) continue;
        const dx = pos.x - rock.x;
        const dz = pos.z - rock.z;
        const dist = Math.hypot(dx, dz);
        const minDist = rock.r + radius;
        if (dist < minDist + (isBoulderSmashing ? 3.0 : 0)) {
            if (isBoulderSmashing) {
                rock.destroyed = true;
                rock.mesh.visible = false;
                sfx.playRockBreak(rock.x, rock.z);
                spawnBurstParticles(rock.x, rock.y, rock.z, _activeConfig.rockColor, 14, 1.0);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
                saveProgression();
            } else if (dist > 0.01) {
                const push = (minDist - dist) / dist;
                pos.x += dx * push;
                pos.z += dz * push;
                if (isPlayer) player.speed *= 0.5;
            }
        }
    }
}

export function updatePlanetSurface(dt: number, now: number) {
    if (worldState.activeArea !== 'PLANET_SURFACE') return;
    const nowSec = now * 0.001;

    // Keep active player & buddy rigs attached if user switched bots from roster
    const pRig = botRigs?.[player.botType]?.root;
    const bRig = botRigs?.[buddyBot.botType]?.root;
    if (pRig && pRig.parent !== planetSurfaceScene) planetSurfaceScene.add(pRig);
    if (bRig && bRig.parent !== planetSurfaceScene) planetSurfaceScene.add(bRig);

    resolvePlanetSurfaceCollisions(player.pos, 2.3, true);

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

    // Animate Actively Erupting Volcanoes!
    for (let i = 0; i < _planetVolcanoes.length; i++) {
        const vc = _planetVolcanoes[i];
        vc.plumeGroup.rotation.y += dt * 0.45;
        vc.plumeGroup.children.forEach((puff, pIdx) => {
            puff.position.y = ((puff.position.y + dt * 5.2) % (28 * vc.scale));
            const s = 0.8 + (puff.position.y / (28 * vc.scale)) * 1.4;
            puff.scale.setScalar(s);
            puff.position.x = Math.sin(nowSec * 1.2 + pIdx) * 2.5;
        });
        vc.nextEruptIn -= dt;
        if (vc.nextEruptIn <= 0) {
            vc.nextEruptIn = 4.2 + Math.random() * 3.5;
            vc.eruptTimer = 1.6;
            spawnBurstParticles(vc.x, vc.y + 1.5, vc.z, 0xf97316, 22, 2.8);
            spawnBurstParticles(vc.x, vc.y + 2.5, vc.z, 0xfacc15, 14, 3.2);
            if (Math.hypot(player.pos.x - vc.x, player.pos.z - vc.z) < 185) {
                sfx.playVolcanoRumble();
            }
        }
        if (vc.eruptTimer > 0) {
            vc.eruptTimer -= dt;
            vc.lavaMat.color.setHex(Math.sin(nowSec * 22) > 0 ? 0xfacc15 : 0xf97316);
        } else {
            vc.lavaMat.color.setHex(0xf97316);
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
                player as unknown as SpeechTarget,
                true
            );
        }
    }

    // Check Signature Planetary Interactive Landmarks (Mercury Mirrors, Venus Probes, Mars Ramps, Pluto Ice Slide)
    for (let i = 0; i < _planetLandmarks.length; i++) {
        const lm = _planetLandmarks[i];
        if (lm.cooldown > 0) lm.cooldown -= dt;
        const dist = Math.hypot(player.pos.x - lm.x, player.pos.z - lm.z);

        if (lm.kind === 'MERCURY_MIRROR' && !lm.activated && dist < 9.5) {
            lm.activated = true;
            if (lm.pivot) lm.pivot.rotation.x = -0.35;
            if (lm.beaconMat) lm.beaconMat.color.setHex(0xfef08a);
            sfx.playBeaconRestore();
            spawnBurstParticles(lm.x, player.pos.y + 4, lm.z, 0xfef08a, 16, 1.2);
            const doneCount = _planetLandmarks.filter(x => x.kind === 'MERCURY_MIRROR' && x.activated).length;
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + (doneCount === 3 ? 10 : 3);
            saveProgression();
            showToast(
                doneCount === 3 ? 'ALL MERCURY SOLAR MIRRORS ALIGNED!' : `SOLAR MIRROR ALIGNED (${doneCount}/3)!`,
                doneCount === 3 ? '+10 Energon Bonus! Caloris Solar Array at 100% power!' : '+3 Energon! Align all 3 mirrors toward the Sun!'
            );
        } else if (lm.kind === 'VENUS_PROBE' && !lm.activated && dist < 9.5) {
            lm.activated = true;
            if (lm.beaconMat) lm.beaconMat.color.setHex(0x22d3ee);
            sfx.playBeaconRestore();
            spawnBurstParticles(lm.x, player.pos.y + 3, lm.z, 0x22d3ee, 16, 1.2);
            const doneCount = _planetLandmarks.filter(x => x.kind === 'VENUS_PROBE' && x.activated).length;
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + (doneCount === 3 ? 10 : 3);
            saveProgression();
            showToast(
                doneCount === 3 ? 'ALL VENUS WEATHER PROBES ONLINE!' : `WEATHER PROBE REPAIRED (${doneCount}/3)!`,
                doneCount === 3 ? '+10 Energon Bonus! Sulfuric storm telemetry restored!' : '+3 Energon! Repair all 3 atmospheric probes!'
            );
        } else if (lm.kind === 'MARS_RAMP' && lm.cooldown <= 0 && dist < 8.5) {
            lm.cooldown = 2.0;
            player.vy = 28.0;
            player.grounded = false;
            player.energonBoostTimer = 2.4;
            sfx.playStuntChime();
            spawnBurstParticles(lm.x, player.pos.y + 2, lm.z, 0x22d3ee, 16, 1.2);
            showToast('OLYMPUS MEGA-LAUNCH!', 'Soaring over the Martian canyons in 0.38G!');
        } else if (lm.kind === 'PLUTO_SLIDE' && lm.cooldown <= 0 && Math.abs(player.pos.x - lm.x) < 6.0 && Math.abs(player.pos.z - lm.z) < 22.0) {
            lm.cooldown = 1.4;
            player.boostTimer = 2.2;
            player.speed = Math.max(player.speed, 62);
            sfx.playEnergyCharge();
            spawnSparkleGlints(player.pos.x, player.pos.y + 1.2, player.pos.z, 10);
        }
    }

    // Proximity to Modeled 3D Cave Entrance -> Enter Planetary Underground Caverns!
    if (_caveEnterCooldown > 0) _caveEnterCooldown -= dt;
    const distCave = Math.hypot(player.pos.x - PLANET_CAVE_POS.x, player.pos.z - PLANET_CAVE_POS.z);
    const nearCave = distCave < 14.0;
    worldState.nearPlanetCaveEntrance = nearCave;
    if (_caveEnterCooldown <= 0 && distCave < 5.6 && _planetCavernEnterHandler) {
        _caveEnterCooldown = 2.2;
        _planetCavernEnterHandler(_activeConfig.id);
        return;
    }

    // Scanable Ancient Monoliths
    for (let i = 0; i < _planetMonoliths.length; i++) {
        const m = _planetMonoliths[i];
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
            showToast('ANCIENT MONOLITH SCANNED!', `${m.name} logged in Galactic Passport! +4 Energon!`);
            triggerNPCSpeech('CHASE', 'Recon Specialist', `Data uplink complete! ${m.name} archived in our Galactic Log!`, player as unknown as SpeechTarget, true);
        }
    }

    // 8-Gate Surface Slalom / Europa Ocean Buoy Course
    let gatesClearedCount = 0;
    for (let i = 0; i < _planetGates.length; i++) {
        const gt = _planetGates[i];
        if (gt.cleared) {
            gatesClearedCount++;
            continue;
        }
        if (Math.hypot(player.pos.x - gt.x, player.pos.z - gt.z) < 7.2) {
            gt.cleared = true;
            gatesClearedCount++;
            gt.ringMat.color.setHex(0x4ade80);
            sfx.playStuntChime();
            spawnSparkleGlints(gt.x, gt.y, gt.z, 14);
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
            if (gatesClearedCount === _planetGates.length) {
                if (!Array.isArray(progression.planetCoursesCompleted)) progression.planetCoursesCompleted = [];
                if (!progression.planetCoursesCompleted.includes(_activeConfig.id)) {
                    progression.planetCoursesCompleted.push(_activeConfig.id);
                }
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 8;
                saveProgression({ immediate: true });
                sfx.playRankUp();
                showToast(
                    `${_activeConfig.name} COURSE COMPLETE!`,
                    `All 8 ${_activeConfig.waterLevel !== undefined ? 'Ocean Buoys' : 'Slalom Gates'} cleared! +8 Energon Bonus!`
                );
            } else {
                saveProgression();
                showToast(
                    `${_activeConfig.waterLevel !== undefined ? 'OCEAN BUOY' : 'SLALOM GATE'} ${gatesClearedCount}/8!`,
                    '+1 Energon Cube!'
                );
            }
        }
    }

    // Proximity to Parked Starship Sigma
    const nearSigma = Math.hypot(player.pos.x - PLANET_SIGMA_POS.x, player.pos.z - PLANET_SIGMA_POS.z) < 26.0;
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

export function getNearestPlanetDiscovery() {
    const candidates: Array<{ name: string; kind: string; x: number; z: number; color: string }> = [];
    _planetRelics.forEach(r => {
        if (!r.collected) candidates.push({ name: r.name, kind: 'RELIC', x: r.x, z: r.z, color: '#fbbf24' });
    });
    _planetMonoliths.forEach(m => {
        if (!m.scanned) candidates.push({ name: m.name, kind: 'MONOLITH', x: m.x, z: m.z, color: '#c084fc' });
    });
    candidates.push({ name: `${_activeConfig.name} Cave Entrance`, kind: 'CAVE', x: PLANET_CAVE_POS.x, z: PLANET_CAVE_POS.z, color: '#f97316' });
    const nextGate = _planetGates.find(g => !g.cleared);
    if (nextGate) {
        candidates.push({
            name: _activeConfig.waterLevel !== undefined ? 'Ocean Buoy Gate' : 'Slalom Gate',
            kind: 'COURSE',
            x: nextGate.x,
            z: nextGate.z,
            color: '#38bdf8'
        });
    }
    let best: { name: string; kind: string; x: number; z: number; dist: number; color: string } | null = null;
    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z);
        if (!best || d < best.dist) {
            best = { ...c, dist: d };
        }
    }
    return best;
}

export function getPlanetSurfaceMapData() {
    return {
        config: _activeConfig,
        radius: getActivePlanetRadius(),
        sigmaPos: PLANET_SIGMA_POS,
        cavePos: PLANET_CAVE_POS,
        craters: _activeConfig.craters,
        islands: _activeConfig.islands,
        volcanoes: _activeConfig.volcanoes,
        isWaterWorld: _activeConfig.waterLevel !== undefined,
        relics: _planetRelics,
        monoliths: _planetMonoliths,
        gates: _planetGates,
        vents: _activeConfig.vents,
        frozenStarspeed: _activeConfig.id === 'TRITON' && !_frozenStarspeedFreed
            ? { x: TRITON_FROZEN_POS.x, z: TRITON_FROZEN_POS.z }
            : null
    };
}

// Register with terrain.ts so physics, Bot/Vehicle/Dino movement, Europa Ocean, and Buddy AI work seamlessly
setPlanetTerrainHooks({
    isActive: () => worldState.activeArea === 'PLANET_SURFACE',
    getSurfaceHeight: getPlanetSurfaceHeight,
    getZoneName: getPlanetZoneName,
    isPointInWater: isPlanetPointInWater,
    getWaterLevel: () => _activeConfig.waterLevel ?? -0.45
});

if (typeof window !== 'undefined') {
    Object.assign(window, {
        planetSurfaceScene,
        PLANET_CONFIGS,
        swapToPlanetSurface,
        getPlanetSurfaceMapData,
        enterActivePlanetCave
    });
}

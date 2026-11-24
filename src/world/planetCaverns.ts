// Themed Underground Caverns for Every Landable Planet & Moon (worldState.activeArea === 'PLANET_CAVERN')
import * as THREE from 'three';
import { scene, camera } from '../rendering/scene.js';
import { toonGrad3, matDarkSteel, matOptimusGold, applyCartoonInkOutlines } from '../rendering/materials.js';
import { player, buddyBot, botRigs, worldState } from '../state/gameState.js';
import { progression, saveProgression } from '../progression/progression.js';
import { setPlanetCavernTerrainHooks } from './terrain.js';
import { setActiveParticleScene, spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import {
    LandablePlanetId,
    planetSurfaceScene,
    setPlanetCavernEnterHandler,
    setPlanetCaveCooldown,
    getPlanetSurfaceHeight,
    updatePlanetSurfaceHUD
} from './planetSurface.js';
import { moonScene, setMoonCaveEnterHandler, setMoonCaveCooldown, getMoonSurfaceHeight, updateMoonHUD } from './moon.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';

export type CavernWorldId = 'MOON' | LandablePlanetId;

interface CavernTheme {
    id: CavernWorldId;
    name: string;
    cavernTitle: string;
    skyColor: number;
    fogColor: number;
    wallColor: number;
    floorHex: string;
    crystalColor: number;
    relicId: string;
    relicName: string;
    hasWaterLagoon?: boolean;
    hasLavaGlow?: boolean;
}

export const PLANET_CAVERN_THEMES: Record<CavernWorldId, CavernTheme> = {
    MOON: {
        id: 'MOON',
        name: 'THE MOON',
        cavernTitle: 'TRANQUILITY BASALT CAVERNS',
        skyColor: 0x090d1a,
        fogColor: 0x0f172a,
        wallColor: 0x475569,
        floorHex: '#334155',
        crystalColor: 0x38bdf8,
        relicId: 'CAV_MOON_1',
        relicName: 'Lunar Basalt Geode'
    },
    MERCURY: {
        id: 'MERCURY',
        name: 'MERCURY',
        cavernTitle: 'CALORIS MAGMA TUBES',
        skyColor: 0x1a0b06,
        fogColor: 0x291108,
        wallColor: 0x57534e,
        floorHex: '#44403c',
        crystalColor: 0xf97316,
        relicId: 'CAV_MERCURY_1',
        relicName: 'Solar Forge Amber',
        hasLavaGlow: true
    },
    VENUS: {
        id: 'VENUS',
        name: 'VENUS',
        cavernTitle: 'MAXWELL SULFUR GROTTO',
        skyColor: 0x1c1205,
        fogColor: 0x2d1d08,
        wallColor: 0x78350f,
        floorHex: '#451a03',
        crystalColor: 0xfacc15,
        relicId: 'CAV_VENUS_1',
        relicName: 'Venusian Topaz Prism'
    },
    MARS: {
        id: 'MARS',
        name: 'MARS',
        cavernTitle: 'SUBTERRANEAN ANCIENT OCEAN',
        skyColor: 0x091622,
        fogColor: 0x102838,
        wallColor: 0x7c2d12,
        floorHex: '#0f3d4c',
        crystalColor: 0x22d3ee,
        relicId: 'CAV_MARS_1',
        relicName: 'Martian Ancient Fossil',
        hasWaterLagoon: true
    },
    PLUTO: {
        id: 'PLUTO',
        name: 'PLUTO',
        cavernTitle: 'KUIPER NITROGEN ICE VAULTS',
        skyColor: 0x060a1c,
        fogColor: 0x0f172a,
        wallColor: 0x64748b,
        floorHex: '#334155',
        crystalColor: 0xc084fc,
        relicId: 'CAV_PLUTO_1',
        relicName: 'Heart Basin Cryo-Gem'
    },
    EUROPA: {
        id: 'EUROPA',
        name: 'EUROPA',
        cavernTitle: 'SUB-GLACIAL BIOLUMINESCENT OCEAN GROTTO',
        skyColor: 0x031024,
        fogColor: 0x08203e,
        wallColor: 0x0284c7,
        floorHex: '#0c4a6e',
        crystalColor: 0x22d3ee,
        relicId: 'CAV_EUROPA_1',
        relicName: 'Abyssal Leviathan Pearl',
        hasWaterLagoon: true
    },
    IO: {
        id: 'IO',
        name: 'IO',
        cavernTitle: 'LOKI MOLTEN CRYSTAL CHAMBERS',
        skyColor: 0x1c0a04,
        fogColor: 0x311206,
        wallColor: 0x78350f,
        floorHex: '#451a03',
        crystalColor: 0xfb923c,
        relicId: 'CAV_IO_1',
        relicName: 'Io Pyroclastic Core',
        hasLavaGlow: true
    },
    GANYMEDE: {
        id: 'GANYMEDE',
        name: 'GANYMEDE',
        cavernTitle: 'GALILEO MAGNETITE VAULTS',
        skyColor: 0x080c20,
        fogColor: 0x121938,
        wallColor: 0x475569,
        floorHex: '#1e293b',
        crystalColor: 0xa855f7,
        relicId: 'CAV_GANYMEDE_1',
        relicName: 'Magnetite Lodestar'
    },
    TITAN: {
        id: 'TITAN',
        name: 'TITAN',
        cavernTitle: 'SHANGRI-LA AMBER CAVERNS',
        skyColor: 0x1b1104,
        fogColor: 0x2d1b06,
        wallColor: 0x92400e,
        floorHex: '#451a03',
        crystalColor: 0xfbbf24,
        relicId: 'CAV_TITAN_1',
        relicName: 'Hydrocarbon Amber Relic'
    },
    MIRANDA: {
        id: 'MIRANDA',
        name: 'MIRANDA',
        cavernTitle: 'VERONA RIFT CHASM CAVES',
        skyColor: 0x050e1c,
        fogColor: 0x0b1d36,
        wallColor: 0x334155,
        floorHex: '#1e293b',
        crystalColor: 0x38bdf8,
        relicId: 'CAV_MIRANDA_1',
        relicName: 'Verona Rift Diamond'
    },
    TITANIA: {
        id: 'TITANIA',
        name: 'TITANIA',
        cavernTitle: 'GERTRUDE FROST-SPIRE CAVERNS',
        skyColor: 0x070d1e,
        fogColor: 0x0f1a36,
        wallColor: 0x64748b,
        floorHex: '#334155',
        crystalColor: 0x67e8f9,
        relicId: 'CAV_TITANIA_1',
        relicName: 'Titania Glacial Crown'
    },
    TRITON: {
        id: 'TRITON',
        name: 'TRITON',
        cavernTitle: 'NEPTUNIAN DEEP-FREEZE CAVERNS',
        skyColor: 0x05081d,
        fogColor: 0x11153b,
        wallColor: 0x4338ca,
        floorHex: '#1e1b4b',
        crystalColor: 0xf472b6,
        relicId: 'CAV_TRITON_1',
        relicName: 'Triton Cryo-Heart'
    }
};

export const planetCavernScene = new THREE.Scene();
export const PLANET_CAVERN_RADIUS = 320;
const CAVERN_WATER_LEVEL = 5.6;

interface CavernRockRuntime {
    mesh: THREE.Mesh;
    x: number;
    y: number;
    z: number;
    r: number;
    destroyed: boolean;
}

interface CavernGemRuntime {
    x: number;
    z: number;
    mesh: THREE.Group;
    collected: boolean;
}

interface ResonanceNode {
    x: number;
    z: number;
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    activated: boolean;
}

let _activeTheme: CavernTheme = PLANET_CAVERN_THEMES.MOON;
let _builtCavernId: CavernWorldId | null = null;
let _cavernGroup: THREE.Group | null = null;
let _returnArea: 'MOON' | 'PLANET_SURFACE' = 'MOON';
let _cavernRelicMesh: THREE.Group | null = null;
let _cavernRelicPos = { x: 0, z: -108 };
let _cavernRelicCollected = false;
let _vaultChestGroup: THREE.Group | null = null;
let _vaultUnlocked = false;
let _exitCooldown = 0;

const _cavernColliders: Array<{ x: number; z: number; r: number }> = [];
const _cavernRocks: CavernRockRuntime[] = [];
const _cavernGems: CavernGemRuntime[] = [];
const _resonanceNodes: ResonanceNode[] = [];
const _cavernAnimated: Array<{ obj: THREE.Object3D; phase: number }> = [];

export function getPlanetCavernSurfaceHeight(x: number, z: number): number {
    // Massive subterranean ocean basin on Europa and Mars (West & South-West expanse)
    if (_activeTheme.hasWaterLagoon) {
        const dLagoon = Math.hypot(x + 95, z - 55);
        if (dLagoon < 165) {
            const t = Math.max(0, Math.min(1, (dLagoon - 125) / 40));
            return THREE.MathUtils.lerp(3.0, 6.4, t * t * (3 - 2 * t));
        }
    }
    return 6.2 + Math.sin(x * 0.03) * Math.cos(z * 0.03) * 0.85;
}

export function isPlanetCavernPointInWater(x: number, z: number): boolean {
    if (worldState.activeArea !== 'PLANET_CAVERN') return false;
    if (!_activeTheme.hasWaterLagoon) return false;
    return getPlanetCavernSurfaceHeight(x, z) < CAVERN_WATER_LEVEL - 0.15;
}

export function getPlanetCavernZoneName(): string {
    return `${_activeTheme.name} — ${_activeTheme.cavernTitle}`;
}

function buildPlanetCavernWorld(theme: CavernTheme) {
    if (_builtCavernId === theme.id && _cavernGroup) return;
    _activeTheme = theme;
    _builtCavernId = theme.id;

    if (_cavernGroup) {
        planetCavernScene.remove(_cavernGroup);
    }
    _cavernColliders.length = 0;
    _cavernRocks.length = 0;
    _cavernGems.length = 0;
    _resonanceNodes.length = 0;
    _cavernAnimated.length = 0;
    _cavernRelicMesh = null;
    _vaultChestGroup = null;
    _vaultUnlocked = false;

    planetCavernScene.background = new THREE.Color(theme.skyColor);
    planetCavernScene.fog = new THREE.FogExp2(theme.fogColor, 0.0028);

    _cavernGroup = new THREE.Group();
    planetCavernScene.add(_cavernGroup);

    _cavernGroup.add(new THREE.HemisphereLight(theme.crystalColor, theme.skyColor, 1.15));
    const pt = new THREE.PointLight(theme.crystalColor, 1.8, 520, 0.4);
    pt.position.set(0, 38, 0);
    _cavernGroup.add(pt);

    // Cavern Floor
    const floorGeo = new THREE.PlaneGeometry(PLANET_CAVERN_RADIUS * 2.1, PLANET_CAVERN_RADIUS * 2.1, 64, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const vPos = floorGeo.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
        vPos.setY(i, getPlanetCavernSurfaceHeight(vPos.getX(i), vPos.getZ(i)));
    }
    floorGeo.computeVertexNormals();
    const floorMesh = new THREE.Mesh(
        floorGeo,
        new THREE.MeshToonMaterial({ color: theme.floorHex, gradientMap: toonGrad3 })
    );
    _cavernGroup.add(floorMesh);

    // Massive Subterranean Ocean (Europa & Mars) or Magma Lake (Io / Mercury)
    if (theme.hasWaterLagoon) {
        const lagoon = new THREE.Mesh(
            new THREE.CircleGeometry(165, 48).rotateX(-Math.PI / 2),
            new THREE.MeshToonMaterial({
                color: 0x06b6d4,
                emissive: 0x0284c7,
                emissiveIntensity: 0.45,
                transparent: true,
                opacity: 0.86,
                gradientMap: toonGrad3
            })
        );
        lagoon.position.set(-95, CAVERN_WATER_LEVEL, 55);
        _cavernGroup.add(lagoon);
    } else if (theme.hasLavaGlow) {
        const lava = new THREE.Mesh(
            new THREE.CircleGeometry(58, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 })
        );
        lava.position.set(-95, 6.35, 55);
        _cavernGroup.add(lava);
    }

    // Cavern Dome Ceiling + Hanging Stalactites
    const matWall = new THREE.MeshToonMaterial({ color: theme.wallColor, gradientMap: toonGrad3 });
    const ceiling = new THREE.Mesh(
        new THREE.SphereGeometry(PLANET_CAVERN_RADIUS + 14, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
        new THREE.MeshToonMaterial({ color: theme.wallColor, side: THREE.BackSide, gradientMap: toonGrad3 })
    );
    ceiling.position.y = 8;
    _cavernGroup.add(ceiling);

    // Outer Cavern Perimeter Boulders & Towering Cathedral Pillars
    const matCrystal = new THREE.MeshBasicMaterial({ color: theme.crystalColor });
    for (let i = 0; i < 56; i++) {
        const ang = (i / 56) * Math.PI * 2;
        const bx = Math.cos(ang) * (PLANET_CAVERN_RADIUS - 6);
        const bz = Math.sin(ang) * (PLANET_CAVERN_RADIUS - 6);
        const pillar = new THREE.Mesh(new THREE.DodecahedronGeometry(18 + (i % 4) * 4, 0), matWall);
        pillar.position.set(bx, 18, bz);
        pillar.scale.set(1.5, 3.2, 1.5);
        _cavernGroup.add(pillar);
    }

    // 14 Interior Structural Pillars creating grand cavern halls (kept clear of center & underground ocean)
    const pillarCoords = [
        { x: -55, z: -65, r: 8.5 },
        { x: 55, z: -65, r: 8.5 },
        { x: 65, z: 55, r: 8.5 },
        { x: -135, z: -135, r: 10.0 },
        { x: 135, z: -135, r: 10.0 },
        { x: 145, z: 125, r: 10.0 },
        { x: -205, z: -120, r: 11.0 },
        { x: 205, z: -120, r: 11.0 },
        { x: 215, z: 145, r: 11.0 },
        { x: 0, z: -155, r: 9.5 },
        { x: 155, z: 0, r: 9.5 },
        { x: 0, z: 175, r: 9.5 }
    ];
    pillarCoords.forEach((p, idx) => {
        if (theme.hasWaterLagoon && Math.hypot(p.x + 95, p.z - 55) < 168) return;
        const py = getPlanetCavernSurfaceHeight(p.x, p.z);
        const col = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.82, p.r * 1.18, 42, 7), matWall);
        col.position.set(p.x, py + 18, p.z);
        applyCartoonInkOutlines(col, 1.03, true);
        _cavernGroup!.add(col);
        _cavernColliders.push({ x: p.x, z: p.z, r: p.r });

        // Glowing crystal spire cluster attached to pillar
        const crys = new THREE.Mesh(new THREE.ConeGeometry(1.8, 7.5, 5), matCrystal);
        crys.position.set(p.x + (idx % 2 === 0 ? p.r : -p.r), py + 4.8, p.z);
        crys.rotation.z = idx % 2 === 0 ? -0.45 : 0.45;
        _cavernGroup!.add(crys);
    });

    // Glowing Bioluminescent Crystal Flora Clusters
    for (let f = 0; f < 30; f++) {
        const ang = (f / 30) * Math.PI * 2 + 0.15;
        const dist = 42 + ((f * 53) % 240);
        const fx = Math.cos(ang) * dist;
        const fz = Math.sin(ang) * dist;
        if (theme.hasWaterLagoon && Math.hypot(fx + 95, fz - 55) < 155) continue;
        const fy = getPlanetCavernSurfaceHeight(fx, fz);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(1.1 + (f % 3) * 0.45, 5.2 + (f % 4) * 1.8, 5), matCrystal);
        spire.position.set(fx, fy + 2.4, fz);
        spire.rotation.set((f % 3 - 1) * 0.12, f * 0.7, ((f + 1) % 3 - 1) * 0.12);
        _cavernGroup.add(spire);
    }

    // Hanging Ceiling Stalactites
    for (let s = 0; s < 50; s++) {
        const ang = (s / 50) * Math.PI * 2;
        const r = 36 + ((s * 47) % 245);
        const sx = Math.cos(ang) * r;
        const sz = Math.sin(ang) * r;
        const stal = new THREE.Mesh(new THREE.ConeGeometry(1.8 + (s % 4) * 0.6, 10 + (s % 5) * 3.5, 5).rotateX(Math.PI), matWall);
        stal.position.set(sx, 44.0, sz);
        _cavernGroup.add(stal);
    }

    // Sunlit Surface Exit Shaft at (0, 0)
    const exitY = getPlanetCavernSurfaceHeight(0, 0);
    const exitGroup = new THREE.Group();
    exitGroup.position.set(0, exitY, 0);
    const exitPad = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.6, 0.4, 20), matDarkSteel);
    exitPad.position.y = 0.2;
    const exitRing = new THREE.Mesh(
        new THREE.TorusGeometry(5.6, 0.42, 8, 28).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    exitRing.position.y = 0.45;
    const exitBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(3.4, 5.2, 26, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
    );
    exitBeam.position.y = 13.0;
    exitGroup.add(exitPad, exitRing, exitBeam);
    _cavernGroup.add(exitGroup);

    // 16 Collectible Cavern Energon Gems spread across the 320m cavern
    const gemCoords = [
        { x: 0, z: -72 }, { x: 82, z: 0 }, { x: 0, z: 86 }, { x: -78, z: 0 },
        { x: 96, z: -145 }, { x: -96, z: -145 }, { x: 165, z: 86 }, { x: -165, z: -96 },
        { x: 235, z: -35 }, { x: -235, z: 35 }, { x: 120, z: 225 }, { x: -120, z: 225 },
        { x: -135, z: 105 }, { x: -55, z: 85 }, { x: 185, z: -195 }, { x: -185, z: -195 }
    ];
    gemCoords.forEach((gc, idx) => {
        const gy = Math.max(getPlanetCavernSurfaceHeight(gc.x, gc.z), theme.hasWaterLagoon ? CAVERN_WATER_LEVEL : 0);
        const gg = new THREE.Group();
        gg.position.set(gc.x, gy + 2.4, gc.z);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), matCrystal);
        gg.add(gem);
        _cavernGroup!.add(gg);
        _cavernGems.push({ x: gc.x, z: gc.z, mesh: gg, collected: false });
        _cavernAnimated.push({ obj: gg, phase: idx * 0.9 });
    });

    // Smashable Cavern Rocks
    for (let r = 0; r < 35; r++) {
        const ang = (r / 35) * Math.PI * 2 + 0.2;
        const dist = 34 + ((r * 41) % 245);
        const rx = Math.cos(ang) * dist;
        const rz = Math.sin(ang) * dist;
        if (Math.hypot(rx, rz) < 18) continue;
        const ry = getPlanetCavernSurfaceHeight(rx, rz);
        if (theme.hasWaterLagoon && ry < CAVERN_WATER_LEVEL + 0.3) continue;
        const rad = 2.4 + (r % 3) * 0.9;
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), matWall);
        mesh.position.set(rx, ry + rad * 0.6, rz);
        applyCartoonInkOutlines(mesh, 1.04, true);
        _cavernGroup.add(mesh);
        _cavernRocks.push({ mesh, x: rx, y: ry + rad * 0.6, z: rz, r: rad, destroyed: false });
    }

    // Hidden Subterranean Relic / Fossil in Deep North Chamber (0, -245)
    _cavernRelicPos = { x: 0, z: -245 };
    const foundCavRelics: string[] = Array.isArray(progression.planetCavernRelicsFound) ? progression.planetCavernRelicsFound : [];
    _cavernRelicCollected = foundCavRelics.includes(theme.relicId);
    const relY = getPlanetCavernSurfaceHeight(_cavernRelicPos.x, _cavernRelicPos.z);
    const relGrp = new THREE.Group();
    relGrp.position.set(_cavernRelicPos.x, relY + 2.6, _cavernRelicPos.z);
    const relCore = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), matOptimusGold);
    const relHalo = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.24, 8, 22), matCrystal);
    const relBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 2.6, 36, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
    );
    relBeam.position.y = 18;
    relGrp.add(relCore, relHalo, relBeam);
    relGrp.visible = !_cavernRelicCollected;
    _cavernGroup.add(relGrp);
    _cavernRelicMesh = relGrp;
    _cavernAnimated.push({ obj: relGrp, phase: 2.2 });

    // Cavern Mini-Game: 5 Resonance Crystals -> Unlocks Secret Energon Vault in East Chamber (225, 0)
    const resCoords = [
        { x: -215, z: -65 },
        { x: 0, z: 235 },
        { x: 185, z: -165 },
        { x: 225, z: 95 },
        { x: -155, z: -210 }
    ];
    resCoords.forEach((rc, idx) => {
        const ry = Math.max(getPlanetCavernSurfaceHeight(rc.x, rc.z), theme.hasWaterLagoon ? CAVERN_WATER_LEVEL : 0);
        const rMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const crystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 0), rMat);
        crystalMesh.position.set(rc.x, ry + 3.2, rc.z);
        const resBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.8, 30, 10, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
        );
        resBeam.position.y = 14;
        crystalMesh.add(resBeam);
        _cavernGroup!.add(crystalMesh);
        _resonanceNodes.push({ x: rc.x, z: rc.z, mesh: crystalMesh, mat: rMat, activated: false });
        _cavernAnimated.push({ obj: crystalMesh, phase: idx * 1.4 });
    });

    const vaultY = getPlanetCavernSurfaceHeight(225, 0);
    const vaultGrp = new THREE.Group();
    vaultGrp.position.set(225, vaultY, 0);
    const vaultBase = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.0, 4.8), matOptimusGold);
    vaultBase.position.y = 2.0;
    vaultBase.visible = false;
    vaultGrp.add(vaultBase);
    _cavernGroup.add(vaultGrp);
    _vaultChestGroup = vaultGrp;
}

export function swapToPlanetCavern(worldId: CavernWorldId) {
    const theme = PLANET_CAVERN_THEMES[worldId] || PLANET_CAVERN_THEMES.MOON;

    // Save current surface position & area for clean return
    _returnArea = worldState.activeArea === 'MOON' ? 'MOON' : 'PLANET_SURFACE';
    worldState.savedPlanetPos.copy(player.pos);
    worldState.savedPlanetHeading = player.heading;

    buildPlanetCavernWorld(theme);
    worldState.activeArea = 'PLANET_CAVERN';
    worldState.activePlanetId = theme.id;
    worldState.nearPlanetCaveEntrance = false;
    worldState.nearPlanetCavernExit = false;
    _exitCooldown = 2.0;

    // Reparent bot rigs into planetCavernScene
    if (botRigs) {
        const pRig = botRigs[player.botType]?.root;
        const bRig = botRigs[buddyBot.botType]?.root;
        Object.values(botRigs).forEach((r) => {
            if (r?.root && r.root.parent === planetCavernScene && r.root !== pRig && r.root !== bRig) {
                scene.add(r.root);
            }
        });
        if (pRig) planetCavernScene.add(pRig);
        if (bRig) planetCavernScene.add(bRig);
    }
    const wp = window.waypointGroup;
    if (wp) {
        planetCavernScene.add(wp);
        wp.visible = false;
    }
    setActiveParticleScene(planetCavernScene);

    // Spawn just south of the Exit Shaft
    const sy = getPlanetCavernSurfaceHeight(0, 14);
    player.pos.set(0, sy, 14);
    player.heading = Math.PI;
    player.speed = 0;
    player.vy = 0;
    player.flightAlt = 0;
    player.grounded = true;
    player.hasWaypoint = false;
    buddyBot.pos.set(-5, getPlanetCavernSurfaceHeight(-5, 16), 16);
    buddyBot.heading = Math.PI;

    const sigmaBtn = document.getElementById('sigma-action-btn');
    if (sigmaBtn) sigmaBtn.classList.add('hidden');
    const caveEnterBtn = document.getElementById('cavern-enter-prompt');
    if (caveEnterBtn) caveEnterBtn.classList.add('hidden');
    const cavernExitBtn = document.getElementById('planet-cavern-exit-prompt');
    if (cavernExitBtn) cavernExitBtn.classList.remove('hidden');

    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = getPlanetCavernZoneName();
    if (typeof window.renderMinimap === 'function') window.renderMinimap();

    sfx.playCavernDiscovery();
    const oceanNote = theme.hasWaterLagoon ? ' Subterranean ocean detected — Boat & Submarine ready!' : '';
    showToast(`${theme.name} CAVERNS!`, `Exploring ${theme.cavernTitle}! Find ${theme.relicName} & attune 5 Resonance Crystals!${oceanNote}`);
    triggerNPCSpeech(
        'BOULDER',
        'Geology Specialist',
        `Whoa, look at these ${theme.name} crystal formations! Watch for ancient fossils and resonance crystals!`,
        player as unknown as SpeechTarget,
        true
    );
}

export function exitPlanetCavernToSurface() {
    if (worldState.activeArea !== 'PLANET_CAVERN') return;
    _exitCooldown = 2.0;

    const targetScene = _returnArea === 'MOON' ? moonScene : planetSurfaceScene;
    if (botRigs) {
        const pRig = botRigs[player.botType]?.root;
        const bRig = botRigs[buddyBot.botType]?.root;
        if (pRig) targetScene.add(pRig);
        if (bRig) targetScene.add(bRig);
    }
    const wp = window.waypointGroup;
    if (wp) {
        targetScene.add(wp);
        wp.visible = false;
    }
    setActiveParticleScene(targetScene);

    const cavernExitBtn = document.getElementById('planet-cavern-exit-prompt');
    if (cavernExitBtn) cavernExitBtn.classList.add('hidden');

    if (_returnArea === 'MOON') {
        worldState.activeArea = 'MOON';
        worldState.activePlanetId = 'MOON';
        setMoonCaveCooldown(2.5);
        const rx = worldState.savedPlanetPos.x;
        const rz = worldState.savedPlanetPos.z + 9;
        const ry = getMoonSurfaceHeight(rx, rz);
        player.pos.set(rx, ry, rz);
        buddyBot.pos.set(rx - 5, getMoonSurfaceHeight(rx - 5, rz + 3), rz + 3);
        updateMoonHUD();
    } else {
        worldState.activeArea = 'PLANET_SURFACE';
        worldState.activePlanetId = _activeTheme.id;
        setPlanetCaveCooldown(2.5);
        const rx = worldState.savedPlanetPos.x;
        const rz = worldState.savedPlanetPos.z + 9;
        const ry = getPlanetSurfaceHeight(rx, rz);
        player.pos.set(rx, ry, rz);
        buddyBot.pos.set(rx - 5, getPlanetSurfaceHeight(rx - 5, rz + 3), rz + 3);
        updatePlanetSurfaceHUD();
    }
    player.speed = 0;
    player.vy = 0;
    player.hasWaypoint = false;
    sfx.playWarpWhoosh();
    if (typeof window.renderMinimap === 'function') window.renderMinimap();
    showToast(`RETURNED TO ${_activeTheme.name} SURFACE`, 'Back out under the alien sky!');
}

export function restoreRigsFromPlanetCavern() {
    if (botRigs) {
        Object.values(botRigs).forEach((r) => {
            if (r?.root && r.root.parent === planetCavernScene) {
                scene.add(r.root);
            }
        });
    }
    const wp = window.waypointGroup;
    if (wp && wp.parent === planetCavernScene) {
        scene.add(wp);
        wp.visible = false;
    }
    const cavernExitBtn = document.getElementById('planet-cavern-exit-prompt');
    if (cavernExitBtn) cavernExitBtn.classList.add('hidden');
    setActiveParticleScene(scene);
}

export function resolvePlanetCavernCollisions(pos: THREE.Vector3, radius = 2.3, isPlayer = false) {
    if (worldState.activeArea !== 'PLANET_CAVERN') return;
    const dist = Math.hypot(pos.x, pos.z);
    const maxR = PLANET_CAVERN_RADIUS - 14;
    if (dist > maxR) {
        const s = maxR / dist;
        pos.x *= s;
        pos.z *= s;
    }
    for (let i = 0; i < _cavernColliders.length; i++) {
        const c = _cavernColliders[i];
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
    const isBoulderSmashing = isPlayer && player.botType === 'BOULDER' && (player.smashTimer > 0 || player.scoopTimer > 0 || player.speed > 20);
    for (let i = 0; i < _cavernRocks.length; i++) {
        const rock = _cavernRocks[i];
        if (rock.destroyed) continue;
        const dx = pos.x - rock.x;
        const dz = pos.z - rock.z;
        const d = Math.hypot(dx, dz);
        const minDist = rock.r + radius;
        if (d < minDist + (isBoulderSmashing ? 3.0 : 0)) {
            if (isBoulderSmashing) {
                rock.destroyed = true;
                rock.mesh.visible = false;
                sfx.playRockBreak(rock.x, rock.z);
                spawnBurstParticles(rock.x, rock.y, rock.z, _activeTheme.crystalColor, 14, 1.0);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
                saveProgression();
            } else if (d > 0.01) {
                const push = (minDist - d) / d;
                pos.x += dx * push;
                pos.z += dz * push;
                if (isPlayer) player.speed *= 0.5;
            }
        }
    }
}

export function updatePlanetCavern(dt: number, now: number) {
    if (worldState.activeArea !== 'PLANET_CAVERN') return;
    const nowSec = now * 0.001;

    const pRig = botRigs?.[player.botType]?.root;
    const bRig = botRigs?.[buddyBot.botType]?.root;
    if (pRig && pRig.parent !== planetCavernScene) planetCavernScene.add(pRig);
    if (bRig && bRig.parent !== planetCavernScene) planetCavernScene.add(bRig);

    resolvePlanetCavernCollisions(player.pos, 2.3, true);

    for (let i = 0; i < _cavernAnimated.length; i++) {
        const a = _cavernAnimated[i];
        a.obj.rotation.y += dt * 1.8;
        a.obj.position.y += Math.sin(nowSec * 3.0 + a.phase) * 0.006;
    }

    // Collect Cavern Gems
    for (let i = 0; i < _cavernGems.length; i++) {
        const g = _cavernGems[i];
        if (g.collected) continue;
        if (Math.hypot(player.pos.x - g.x, player.pos.z - g.z) < 5.5) {
            g.collected = true;
            g.mesh.visible = false;
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 1;
            saveProgression();
            sfx.playGemChime();
            spawnSparkleGlints(g.x, player.pos.y + 2.2, g.z, 12);
        }
    }

    // Collect Subterranean Relic / Fossil
    if (!_cavernRelicCollected && _cavernRelicMesh) {
        if (Math.hypot(player.pos.x - _cavernRelicPos.x, player.pos.z - _cavernRelicPos.z) < 6.8) {
            _cavernRelicCollected = true;
            _cavernRelicMesh.visible = false;
            if (!Array.isArray(progression.planetCavernRelicsFound)) progression.planetCavernRelicsFound = [];
            if (!progression.planetCavernRelicsFound.includes(_activeTheme.relicId)) {
                progression.planetCavernRelicsFound.push(_activeTheme.relicId);
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 6;
                saveProgression({ immediate: true });
            }
            sfx.playRelicFound();
            spawnSparkleGlints(_cavernRelicPos.x, player.pos.y + 3, _cavernRelicPos.z, 22);
            showToast('SUBTERRANEAN RELIC FOUND!', `${_activeTheme.relicName} discovered in ${_activeTheme.name} Caverns! +6 Energon!`);
        }
    }

    // 3 Resonance Crystals Mini-Game
    let activeResCount = 0;
    for (let i = 0; i < _resonanceNodes.length; i++) {
        const rn = _resonanceNodes[i];
        if (rn.activated) {
            activeResCount++;
            continue;
        }
        if (Math.hypot(player.pos.x - rn.x, player.pos.z - rn.z) < 6.5) {
            rn.activated = true;
            activeResCount++;
            rn.mat.color.setHex(0x4ade80);
            sfx.playGemChime();
            spawnSparkleGlints(rn.x, player.pos.y + 3, rn.z, 16);
            if (activeResCount === _resonanceNodes.length && !_vaultUnlocked) {
                _vaultUnlocked = true;
                if (_vaultChestGroup && _vaultChestGroup.children[0]) {
                    _vaultChestGroup.children[0].visible = true;
                }
                progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 10;
                saveProgression({ immediate: true });
                sfx.playRankUp();
                showToast('CAVERN RESONANCE UNLOCKED!', `All ${_resonanceNodes.length} Resonance Crystals attuned! +10 Bonus Energon!`);
            } else {
                showToast(`RESONANCE CRYSTAL ${activeResCount}/${_resonanceNodes.length}!`, `Attune all ${_resonanceNodes.length} cavern crystals!`);
            }
        }
    }

    // Sunlit Surface Exit Shaft Proximity
    if (_exitCooldown > 0) _exitCooldown -= dt;
    const distExit = Math.hypot(player.pos.x, player.pos.z);
    worldState.nearPlanetCavernExit = distExit < 12.0;
    if (_exitCooldown <= 0 && distExit < 5.2) {
        exitPlanetCavernToSurface();
    }
}

export function getNearestCavernDiscovery(): { name: string; kind: string; x: number; z: number; dist: number; color: string } | null {
    if (worldState.activeArea !== 'PLANET_CAVERN') return null;
    const candidates: Array<{ name: string; kind: string; x: number; z: number; dist: number; color: string }> = [];
    if (!_cavernRelicCollected) {
        candidates.push({
            name: _activeTheme.relicName,
            kind: 'RELIC',
            x: _cavernRelicPos.x,
            z: _cavernRelicPos.z,
            dist: Math.hypot(_cavernRelicPos.x - player.pos.x, _cavernRelicPos.z - player.pos.z),
            color: '#facc15'
        });
    }
    _resonanceNodes.forEach((rn, idx) => {
        if (!rn.activated) {
            candidates.push({
                name: `Resonance Crystal #${idx + 1}`,
                kind: 'CRYSTAL',
                x: rn.x,
                z: rn.z,
                dist: Math.hypot(rn.x - player.pos.x, rn.z - player.pos.z),
                color: '#f43f5e'
            });
        }
    });
    _cavernGems.forEach((g, idx) => {
        if (!g.collected) {
            candidates.push({
                name: `Energon Gem #${idx + 1}`,
                kind: 'GEM',
                x: g.x,
                z: g.z,
                dist: Math.hypot(g.x - player.pos.x, g.z - player.pos.z),
                color: '#22d3ee'
            });
        }
    });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0];
}

export function getPlanetCavernMapData() {
    return {
        theme: _activeTheme,
        radius: PLANET_CAVERN_RADIUS,
        colliders: _cavernColliders,
        gems: _cavernGems,
        relicPos: _cavernRelicPos,
        relicCollected: _cavernRelicCollected,
        resonanceNodes: _resonanceNodes
    };
}

// Register cave entrance callbacks on planetSurface.ts and moon.ts (deferred via microtask to avoid circular-import TDZ)
queueMicrotask(() => {
    setPlanetCavernEnterHandler((planetId) => swapToPlanetCavern(planetId));
    setMoonCaveEnterHandler(() => swapToPlanetCavern('MOON'));
});

// Register terrain hooks with terrain.ts
setPlanetCavernTerrainHooks({
    isActive: () => worldState.activeArea === 'PLANET_CAVERN',
    getSurfaceHeight: getPlanetCavernSurfaceHeight,
    getZoneName: getPlanetCavernZoneName,
    isPointInWater: isPlanetCavernPointInWater,
    getWaterLevel: () => CAVERN_WATER_LEVEL
});

if (typeof window !== 'undefined') {
    Object.assign(window, {
        planetCavernScene,
        swapToPlanetCavern,
        exitPlanetCavernToSurface,
        getPlanetCavernMapData
    });
}

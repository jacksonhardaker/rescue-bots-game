// Underground Cavern & Braided Tunnel System Game Mode
import * as THREE from 'three';
import { scene, camera, renderer } from '../rendering/scene.js';
import { toonGrad3, matInkOutline, applyCartoonInkOutlines } from '../rendering/materials.js';
import { player, buddyBot, botRigs, worldState } from '../state/gameState.js';
import { progression, saveProgression, isBotDocked } from '../progression/progression.js';
import { setUndergroundTerrainHooks, getZoneName } from './terrain.js';
import {
    setActiveParticleScene, spawnBurstParticles,
    spawnSparkleGlints, spawnEnergonLightningParticles
} from './emergencies.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { BOT_METADATA } from '../bots/botMeta.js';
import { SVG_ICONS } from '../ui/icons.js';
import { buildCrashedSpaceshipSigma } from './spaceshipSigma.js';
import {
    DinoSpecies, DinoSphereOffset,
    buildEnergonCacheMesh, buildMagmaBridgeMesh, buildDinobotShrineMesh,
    buildMoroccoMineMesh, buildBoulderGalleryMesh, createCavernDinoMesh
} from './cavernModels.js';

export const GRID_SIZE = 13;
export const CELL_SIZE = 36;
export const HALF_WORLD = (GRID_SIZE * CELL_SIZE) / 2; // 234m
export const WALL_THICK = 7.6;
export const HALF_WALL = WALL_THICK * 0.5;
export const CEILING_Y = 29.0;

export const undergroundScene = new THREE.Scene();
undergroundScene.background = new THREE.Color(0x0b0f1e);
undergroundScene.fog = new THREE.FogExp2(0x0b0f1e, 0.0058);

// Elevate all dry underground geometry +1.0m above surface water threshold (y < 0.25)
const cavernWorldGroup = new THREE.Group();
cavernWorldGroup.position.y = 1.0;
undergroundScene.add(cavernWorldGroup);

let _built = false;
let _reparentSharedFX: ((targetScene: THREE.Scene) => void) | null = null;
let _getWaypointGroup: (() => THREE.Object3D | null) | null = null;
let _boreholeDecal: THREE.Group | null = null;
let _transitionLock = false;

interface WallEdge {
    id: string;
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    horizontal: boolean; // true = separates south (r1) and north (r1+1), spans X
    x: number;
    z: number;
    halfX: number;
    halfZ: number;
    open: boolean;
    cracked: boolean;
    broken: boolean;
    mesh?: THREE.Group;
}

interface CrackedWallEntry {
    id: string;
    edge: WallEdge;
    x: number;
    z: number;
    horizontal: boolean;
    group: THREE.Group;
    broken: boolean;
}

interface CavernGem {
    x: number;
    z: number;
    mesh: THREE.Group;
    collected: boolean;
    phase: number;
}

interface CavernBoulder {
    id: number;
    x: number;
    z: number;
    r: number;
    mesh: THREE.Group;
    destroyed: boolean;
}

interface CavernCollider {
    x: number;
    z: number;
    r: number;
}

interface CavernDiscovery {
    id: string;
    name: string;
    subtitle: string;
    speechSpeaker: string;
    speechRole: string;
    speechLine: string;
    x: number;
    z: number;
    radius: number;
    color: string;
    rewardCubes?: number;
}

interface CavernDino {
    id: string;
    species: DinoSpecies;
    name: string;
    isBig: boolean;
    x: number;
    z: number;
    heading: number;
    speed: number;
    baseSpeed: number;
    curR: number;
    curC: number;
    prevR: number;
    prevC: number;
    targetR: number;
    targetC: number;
    targetX: number;
    targetZ: number;
    stuckTimer: number;
    walkCycle: number;
    phase: number;
    roarTimer: number;
    spheres: DinoSphereOffset[];
    wallSpheres: DinoSphereOffset[];
    homeCells: Array<{ r: number; c: number }>;
    root: THREE.Group;
    headPivot: THREE.Object3D;
    tailPivot: THREE.Object3D;
    legs: THREE.Object3D[];
}

interface ExitShaft {
    id: string;
    name: string;
    r: number;
    c: number;
    x: number;
    z: number;
    beamMesh: THREE.Mesh;
    ringMesh: THREE.Mesh;
}

// Maze & World Data
const _cellChamber: number[][] = [];
const _edges = new Map<string, WallEdge>();
const _crackedWalls: CrackedWallEntry[] = [];
const _gems: CavernGem[] = [];
const _boulders: CavernBoulder[] = [];
const _staticColliders: CavernCollider[] = [];
const _dinos: CavernDino[] = [];
const _exitShafts: ExitShaft[] = [];
const _animatedMeshes: Array<{ obj: THREE.Object3D; kind: string; baseY: number; phase: number }> = [];

// Lagoon & Magma Coordinates
const LAGOON_CENTER = { x: 144, z: 126, rx: 32, rz: 20 };
const MAGMA_CENTER = { x: 0, z: -198, r: 28 };
const GALLERY_CELLS = [
    { r: 11, c: 5 }, { r: 11, c: 6 }, { r: 11, c: 7 },
    { r: 12, c: 5 }, { r: 12, c: 6 }, { r: 12, c: 7 }
];

export const CAVERN_DISCOVERIES: CavernDiscovery[] = [
    {
        id: 'ENERGON_CACHE',
        name: 'Great Energon Crystal Cache',
        subtitle: '+5 Energon Cubes & Hyper-Charge Boost!',
        speechSpeaker: 'BOULDER',
        speechRole: 'Geology Specialist',
        speechLine: 'Unbelievable! A pure vein of glowing Cybertronian Energon crystals deep beneath Griffin Rock!',
        x: 126,
        z: -126,
        radius: 26,
        color: '#22d3ee',
        rewardCubes: 5
    },
    {
        id: 'CRASHED_SPACESHIP',
        name: 'Crashed Rescue Starship Sigma',
        subtitle: 'Original Autobot Landing Vessel Located!',
        speechSpeaker: 'HEATWAVE',
        speechRole: 'Rescue Bots Leader',
        speechLine: 'Wait a minute... that hull insignia! That is the Sigma—the starship that brought us to Earth!',
        x: -144,
        z: -162,
        radius: 38,
        color: '#ef4444'
    },
    {
        id: 'CRYSTAL_LAGOON',
        name: 'Bioluminescent Crystal Lagoon',
        subtitle: 'Subterranean Oasis — Boat Mode Active in Water!',
        speechSpeaker: 'HIGHTIDE',
        speechRole: 'Ocean Explorer',
        speechLine: 'By the tides of Cybertron! A glowing underground lagoon! Boats and submarines can cruise right in!',
        x: LAGOON_CENTER.x,
        z: LAGOON_CENTER.z,
        radius: 30,
        color: '#06b6d4'
    },
    {
        id: 'MAGMA_CORE',
        name: 'Mt. Griffin Magma Core Bridge',
        subtitle: 'Geothermal Lava River Deep Under Volcano!',
        speechSpeaker: 'CHASE',
        speechRole: 'Tactical Unit',
        speechLine: 'Sensors confirm we are directly beneath Mt. Griffin’s volcanic chamber. Stay on the basalt bridge!',
        x: MAGMA_CENTER.x,
        z: MAGMA_CENTER.z,
        radius: 28,
        color: '#f97316'
    },
    {
        id: 'DINOBOT_SHRINE',
        name: 'Ancient Fossilized Dinobot Shrine',
        subtitle: 'Prehistoric Cybertronian Fossils Found!',
        speechSpeaker: 'OPTIMUS',
        speechRole: 'Autobot Commander',
        speechLine: 'Remarkable. Even millennia ago, prehistoric titans walked the hidden vaults beneath this island.',
        x: -198,
        z: -18,
        radius: 26,
        color: '#4ade80'
    },
    {
        id: 'MOROCCO_MINE',
        name: "Dr. Morocco's Abandoned Mine",
        subtitle: 'Victorian Steam Rails & Prototype Vault!',
        speechSpeaker: 'BLADES',
        speechRole: 'Aerial Recon',
        speechLine: 'Spooky! Rusty minecarts, brass lanterns, and dusty blueprints... Dr. Morocco must have dug down here decades ago!',
        x: -162,
        z: 162,
        radius: 26,
        color: '#a855f7'
    },
    {
        id: 'BOULDER_GALLERY',
        name: "Boulder's Secret Sculpture Alcove",
        subtitle: 'Hidden Crystal Grotto Beyond Cracked Wall!',
        speechSpeaker: 'BOULDER',
        speechRole: 'Earth Sculptor',
        speechLine: 'Look at those natural crystal formations and giant mushrooms! What a masterpiece of Earth geology!',
        x: 0,
        z: 198,
        radius: 26,
        color: '#eab308'
    }
];

function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function cellCenterX(c: number): number {
    return -HALF_WORLD + (c + 0.5) * CELL_SIZE;
}

export function cellCenterZ(r: number): number {
    return -HALF_WORLD + (r + 0.5) * CELL_SIZE;
}

export function worldToCell(x: number, z: number): { r: number; c: number } {
    const c = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((x + HALF_WORLD) / CELL_SIZE)));
    const r = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((z + HALF_WORLD) / CELL_SIZE)));
    return { r, c };
}

function edgeKey(r1: number, c1: number, r2: number, c2: number): string {
    if (r1 < r2 || (r1 === r2 && c1 < c2)) {
        return `${r1},${c1}_${r2},${c2}`;
    }
    return `${r2},${c2}_${r1},${c1}`;
}

function isGalleryCell(r: number, c: number): boolean {
    return r >= 11 && r <= 12 && c >= 5 && c <= 7;
}

// =========================================================================
// TERRAIN & ZONE HOOKS
// =========================================================================
export function getUndergroundSurfaceHeight(x: number, z: number): number {
    // 1. Crystal Lagoon water bowl (navigable Boat Mode basin!)
    const ldx = (x - LAGOON_CENTER.x) / LAGOON_CENTER.rx;
    const ldz = (z - LAGOON_CENTER.z) / LAGOON_CENTER.rz;
    const lDistSq = ldx * ldx + ldz * ldz;
    if (lDistSq < 1.05) {
        const d = Math.sqrt(lDistSq);
        if (d < 0.72) return -2.2;
        const shoreT = (d - 0.72) / 0.33;
        return THREE.MathUtils.lerp(-2.2, 1.0, Math.min(1, Math.max(0, shoreT)));
    }

    // 2. Magma Core Chamber: solid Basalt Stone Bridge spanning E-W over sunken magma pit
    const mDist = Math.hypot(x - MAGMA_CENTER.x, z - MAGMA_CENTER.z);
    if (mDist < MAGMA_CENTER.r) {
        if (Math.abs(z - MAGMA_CENTER.z) <= 8.6) {
            // Smooth ramp onto bridge
            const xDist = Math.abs(x - MAGMA_CENTER.x);
            if (xDist > 20) {
                const rampT = 1.0 - Math.min(1, (xDist - 20) / 8);
                return THREE.MathUtils.lerp(1.0, 1.45, rampT);
            }
            return 1.45;
        }
        return -1.4;
    }

    return 1.0;
}

export function isUndergroundPointInWater(x: number, z: number): boolean {
    const ldx = (x - LAGOON_CENTER.x) / (LAGOON_CENTER.rx * 0.92);
    const ldz = (z - LAGOON_CENTER.z) / (LAGOON_CENTER.rz * 0.92);
    return (ldx * ldx + ldz * ldz) < 1.0;
}

export function getUndergroundZoneName(x: number, z: number): string {
    for (let i = 0; i < CAVERN_DISCOVERIES.length; i++) {
        const d = CAVERN_DISCOVERIES[i];
        if (Math.hypot(x - d.x, z - d.z) < d.radius + 10) {
            return d.name.toUpperCase();
        }
    }
    if (Math.hypot(x, z) < 28) return 'GRIFFIN DRILL SHAFT HUB';
    for (let i = 0; i < _exitShafts.length; i++) {
        const s = _exitShafts[i];
        if (Math.hypot(x - s.x, z - s.z) < 16) return s.name.toUpperCase();
    }
    return 'SUBTERRANEAN TUNNELS';
}

// =========================================================================
// DETERMINISTIC 13x13 BRAIDED CAVERN MAZE GENERATOR
// =========================================================================
function generateMaze() {
    _edges.clear();
    _cellChamber.length = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        _cellChamber.push(new Array(GRID_SIZE).fill(0));
    }

    const rand = mulberry32(0x52424341);

    // Assign named chamber regions (non-overlapping)
    const assignCells = (cells: Array<[number, number]>, id: number) => {
        cells.forEach(([r, c]) => { _cellChamber[r][c] = id; });
    };
    assignCells([[6, 6]], 1); // Entry Hub
    assignCells([[2, 9], [2, 10], [3, 9], [3, 10]], 2); // Energon Cache
    assignCells([[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]], 3); // Crashed Spaceship
    assignCells([[9, 9], [9, 10], [9, 11], [10, 9], [10, 10], [10, 11]], 4); // Crystal Lagoon
    assignCells([[0, 5], [0, 6], [0, 7], [1, 5], [1, 6], [1, 7]], 5); // Magma Core
    assignCells([[5, 0], [5, 1], [6, 0], [6, 1]], 6); // Dinobot Shrine
    assignCells([[10, 1], [10, 2], [11, 1], [11, 2]], 7); // Dr. Morocco Mine
    GALLERY_CELLS.forEach(gc => { _cellChamber[gc.r][gc.c] = 8; }); // Boulder Secret Gallery

    // Build all internal wall edges
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (r + 1 < GRID_SIZE) {
                const k = edgeKey(r, c, r + 1, c);
                _edges.set(k, {
                    id: k,
                    r1: r, c1: c, r2: r + 1, c2: c,
                    horizontal: true,
                    x: cellCenterX(c),
                    z: -HALF_WORLD + (r + 1) * CELL_SIZE,
                    halfX: CELL_SIZE * 0.5 + HALF_WALL,
                    halfZ: HALF_WALL,
                    open: false,
                    cracked: false,
                    broken: false
                });
            }
            if (c + 1 < GRID_SIZE) {
                const k = edgeKey(r, c, r, c + 1);
                _edges.set(k, {
                    id: k,
                    r1: r, c1: c, r2: r, c2: c + 1,
                    horizontal: false,
                    x: -HALF_WORLD + (c + 1) * CELL_SIZE,
                    z: cellCenterZ(r),
                    halfX: HALF_WALL,
                    halfZ: CELL_SIZE * 0.5 + HALF_WALL,
                    open: false,
                    cracked: false,
                    broken: false
                });
            }
        }
    }

    // Open all internal walls inside each multi-cell chamber
    _edges.forEach(e => {
        const ch1 = _cellChamber[e.r1][e.c1];
        const ch2 = _cellChamber[e.r2][e.c2];
        if (ch1 > 0 && ch1 === ch2) {
            e.open = true;
        }
    });

    // Helper: check if crossing an edge should be prevented (e.g., Magma Pit north/south entrance directly into lava)
    const isRestrictedEdge = (e: WallEdge): boolean => {
        if (isGalleryCell(e.r1, e.c1) !== isGalleryCell(e.r2, e.c2)) return true;
        // Keep Magma Core accessible from West/East approaches onto the basalt bridge (keep south edge row 1<->2 col 6 closed so players enter bridge from E/W sides cleanly!)
        if ((e.r1 === 1 && e.c1 === 6 && e.r2 === 2 && e.c2 === 6) || (e.r1 === 1 && e.c1 === 5 && e.r2 === 1 && e.c2 === 6 && false)) {
            return true;
        }
        return false;
    };

    // Seeded Recursive Backtracker (treats multi-cell chambers as already linked internally so chambers don't block backtracker)
    const visited: boolean[][] = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(false));
    const stack: Array<[number, number]> = [[6, 6]];
    visited[6][6] = true;

    const dirs: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    while (stack.length > 0) {
        const [cr, cc] = stack[stack.length - 1];
        const neighbors: Array<{ nr: number; nc: number; edge: WallEdge; sameChamber: boolean }> = [];
        for (const [dr, dc] of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
            if (visited[nr][nc] || isGalleryCell(nr, nc)) continue;
            const edge = _edges.get(edgeKey(cr, cc, nr, nc));
            if (!edge || isRestrictedEdge(edge)) continue;
            const chCur = _cellChamber[cr][cc];
            const chNext = _cellChamber[nr][nc];
            const sameChamber = chCur > 0 && chCur === chNext;
            neighbors.push({ nr, nc, edge, sameChamber });
        }
        if (neighbors.length === 0) {
            stack.pop();
            continue;
        }
        const pick = neighbors[Math.floor(rand() * neighbors.length)];
        pick.edge.open = true;
        visited[pick.nr][pick.nc] = true;
        stack.push([pick.nr, pick.nc]);
    }

    // Braided loops: remove ~18 dead-end/corridor walls for smooth exploration
    const closedCandidates: WallEdge[] = [];
    _edges.forEach(e => {
        if (!e.open && !isGalleryCell(e.r1, e.c1) && !isGalleryCell(e.r2, e.c2)) {
            if (!(e.r1 === 1 && e.c1 === 6 && e.r2 === 2 && e.c2 === 6)) {
                closedCandidates.push(e);
            }
        }
    });
    for (let i = closedCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = closedCandidates[i];
        closedCandidates[i] = closedCandidates[j];
        closedCandidates[j] = tmp;
    }

    // Open all 4 cardinal exits around Griffin Shaft (6,6) + 18 braided loops
    for (const [dr, dc] of dirs) {
        const hubEdge = _edges.get(edgeKey(6, 6, 6 + dr, 6 + dc));
        if (hubEdge) hubEdge.open = true;
    }
    let loopsOpened = 0;
    for (let i = 0; i < closedCandidates.length && loopsOpened < 18; i++) {
        closedCandidates[i].open = true;
        loopsOpened++;
    }

    // Designate Breakable Cracked Rock Walls!
    // 1. Primary Secret Entrance into Boulder's Secret Sculpture Alcove at (10,6) <-> (11,6)
    const galleryGate = _edges.get(edgeKey(10, 6, 11, 6));
    if (galleryGate) {
        galleryGate.cracked = true;
    }

    // 2. Ensure (10,6) is open to main maze & select 6 additional tactical cracked shortcut walls
    const remainingWalls: WallEdge[] = [];
    _edges.forEach(e => {
        if (!e.open && !e.cracked && !isGalleryCell(e.r1, e.c1) && !isGalleryCell(e.r2, e.c2)) {
            if (!(e.r1 === 1 && e.c1 === 6 && e.r2 === 2 && e.c2 === 6)) {
                remainingWalls.push(e);
            }
        }
    });
    let shortcutsAdded = 0;
    for (let i = 0; i < remainingWalls.length && shortcutsAdded < 6; i += Math.max(1, Math.floor(remainingWalls.length / 7))) {
        remainingWalls[i].cracked = true;
        shortcutsAdded++;
    }

    // Apply previously broken walls from persistent save data
    const brokenList: string[] = Array.isArray(progression.brokenCavernWalls) ? progression.brokenCavernWalls : [];
    _edges.forEach(e => {
        if (e.cracked && brokenList.includes(e.id)) {
            e.broken = true;
        }
    });

    // Verify BFS reachability for main maze + secret gallery
    const bfsReach = (allowGalleryGate: boolean): Set<number> => {
        const seen = new Set<number>([6 * GRID_SIZE + 6]);
        const q: number[] = [6 * GRID_SIZE + 6];
        while (q.length > 0) {
            const idx = q.shift()!;
            const r = Math.floor(idx / GRID_SIZE);
            const c = idx % GRID_SIZE;
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
                const nIdx = nr * GRID_SIZE + nc;
                if (seen.has(nIdx)) continue;
                const edge = _edges.get(edgeKey(r, c, nr, nc));
                if (!edge) continue;
                const passable = edge.open || (allowGalleryGate && edge === galleryGate);
                if (passable) {
                    seen.add(nIdx);
                    q.push(nIdx);
                }
            }
        }
        return seen;
    };

    const mainReach = bfsReach(false);
    // Guarantee every non-gallery cell is connected
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (isGalleryCell(r, c)) continue;
            if (!mainReach.has(r * GRID_SIZE + c)) {
                for (const [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || isGalleryCell(nr, nc)) continue;
                    const e = _edges.get(edgeKey(r, c, nr, nc));
                    if (e && mainReach.has(nr * GRID_SIZE + nc)) {
                        e.open = true;
                        break;
                    }
                }
            }
        }
    }
}

// =========================================================================
// BUILD UNDERGROUND SCENE GEOMETRY (INSTANCED ROCK, CRYSTALS, LANDMARKS)
// =========================================================================
function createCavernTextureSet() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 12); ctx.lineTo(52, 64); ctx.lineTo(28, 118);
    ctx.moveTo(96, 8); ctx.lineTo(66, 54); ctx.lineTo(116, 108);
    ctx.moveTo(18, 72); ctx.lineTo(105, 58);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createCavernRockTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const rand = mulberry32(0x43415645);

    // Neutral light slate base so per-instance rock tints read vividly under toon shading
    ctx.fillStyle = '#b6c3d6';
    ctx.fillRect(0, 0, 256, 256);

    // Horizontal sedimentary strata bands
    for (let y = 0; y < 256; y += 26) {
        const shade = rand() > 0.5 ? 'rgba(226, 232, 240, 0.28)' : 'rgba(51, 65, 85, 0.22)';
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 32; x <= 256; x += 32) {
            ctx.lineTo(x, y + (rand() - 0.5) * 10);
        }
        ctx.lineTo(256, y + 20);
        ctx.lineTo(0, y + 20);
        ctx.closePath();
        ctx.fill();
    }

    // Angular cel-shaded mineral facets
    for (let i = 0; i < 36; i++) {
        const cx = rand() * 256;
        const cy = rand() * 256;
        const rx = 14 + rand() * 26;
        const ry = 8 + rand() * 18;
        ctx.fillStyle = rand() > 0.45 ? 'rgba(241, 245, 249, 0.22)' : 'rgba(30, 41, 59, 0.22)';
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy);
        ctx.lineTo(cx - rx * 0.2, cy - ry);
        ctx.lineTo(cx + rx, cy - ry * 0.25);
        ctx.lineTo(cx + rx * 0.4, cy + ry);
        ctx.closePath();
        ctx.fill();
    }

    // Crisp comic-ink geological fracture cracks
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.52)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 20; i++) {
        let px = rand() * 256;
        let py = rand() * 256;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const segs = 3 + Math.floor(rand() * 3);
        for (let s = 0; s < segs; s++) {
            px += (rand() - 0.3) * 42;
            py += (rand() - 0.5) * 32;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createCavernFloorTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const rand = mulberry32(0x464c4f52);

    ctx.fillStyle = '#d4dce8';
    ctx.fillRect(0, 0, 256, 256);

    // Broad flagstone & basalt bedrock plates
    for (let i = 0; i < 42; i++) {
        const cx = rand() * 256;
        const cy = rand() * 256;
        const rad = 12 + rand() * 26;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(248, 250, 252, 0.25)' : 'rgba(51, 65, 85, 0.16)';
        ctx.beginPath();
        for (let v = 0; v < 6; v++) {
            const ang = (v / 6) * Math.PI * 2;
            const r = rad * (0.65 + rand() * 0.55);
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Cracked cavern floor fissures & small outlined pebbles
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 18; i++) {
        let px = rand() * 256;
        let py = rand() * 256;
        ctx.beginPath();
        ctx.moveTo(px, py);
        for (let s = 0; s < 4; s++) {
            px += (rand() - 0.5) * 44;
            py += (rand() - 0.5) * 44;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    for (let i = 0; i < 28; i++) {
        const px = rand() * 256;
        const py = rand() * 256;
        const rr = 3 + rand() * 5;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(203, 213, 225, 0.55)' : 'rgba(100, 116, 139, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(26, 26);
    return tex;
}

function createCraggyWallGeometry(): THREE.BufferGeometry {
    const base = new THREE.BoxGeometry(1, 1, 1, 10, 5, 2);
    const pos = base.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        let nx = vx;
        let ny = vy;
        let nz = vz;

        if (Math.abs(vz) > 0.45) {
            const sideSign = Math.sign(vz);
            const strata = Math.sin(vy * 13.0 + vx * 3.5) * 0.055;
            const crag = Math.sin(vx * 18.0 + vy * 6.5) * 0.11 + Math.cos(vx * 31.0 - vy * 11.0) * 0.055;
            const footing = Math.max(0, -vy - 0.15) * 0.36;
            const overhang = Math.max(0, vy - 0.22) * 0.28;
            const disp = Math.max(-0.07, strata + crag) + footing + overhang;
            nz = vz + sideSign * disp;
        }
        if (Math.abs(vx) > 0.45 && Math.abs(vz) < 0.44) {
            nx = vx + Math.sign(vx) * (Math.sin(vy * 11.0 + vz * 9.0) * 0.025);
        }
        if (Math.abs(vy) < 0.46) {
            ny = vy + Math.sin(vx * 14.0 + vz * 12.0) * 0.018;
        }
        pos.setXYZ(i, nx, ny, nz);
    }
    const geo = base.toNonIndexed();
    geo.computeVertexNormals();
    return geo;
}

function createCraggyButtressGeometry(): THREE.BufferGeometry {
    const base = new THREE.CylinderGeometry(0.68, 1.24, 1.0, 7, 5);
    const pos = base.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const r = Math.hypot(vx, vz);
        if (r > 0.05) {
            const ang = Math.atan2(vz, vx);
            const factor = 1.0 + Math.sin(vy * 9.0 + ang * 3.0) * 0.2 + Math.cos(vy * 17.0 - ang * 2.0) * 0.14;
            pos.setXYZ(i, vx * factor, vy, vz * factor);
        }
    }
    const geo = base.toNonIndexed();
    geo.computeVertexNormals();
    return geo;
}

function createCraggyBoulderSkirtGeometry(): THREE.BufferGeometry {
    const base = new THREE.DodecahedronGeometry(1.0, 1);
    const pos = base.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        let vy = pos.getY(i);
        const vz = pos.getZ(i);
        const crag = 0.96 + Math.sin(vx * 7.3 + vz * 5.9 + vy * 4.1) * 0.16 + Math.cos(vx * 11.1 - vy * 8.3) * 0.08;
        if (vy < -0.25) vy = -0.25;
        pos.setXYZ(i, vx * crag, vy * crag, vz * crag);
    }
    const geo = base.toNonIndexed();
    geo.computeVertexNormals();
    return geo;
}

function createCraggySpireGeometry(): THREE.BufferGeometry {
    const base = new THREE.ConeGeometry(1.0, 1.0, 6, 4);
    const pos = base.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const r = Math.hypot(vx, vz);
        if (r > 0.03) {
            const ang = Math.atan2(vz, vx);
            const factor = 1.0 + Math.sin(vy * 12.0 + ang * 3.0) * 0.18;
            const lean = (vy + 0.5) * 0.08;
            pos.setXYZ(i, vx * factor + lean, vy, vz * factor - lean * 0.5);
        }
    }
    const geo = base.toNonIndexed();
    geo.computeVertexNormals();
    return geo;
}

function buildCavernArchitecture(rand: () => number) {
    // 1. Lighting & Atmosphere
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.05);
    undergroundScene.add(hemi);

    const rimDir = new THREE.DirectionalLight(0xe0e7ff, 0.72);
    rimDir.position.set(120, 220, 90);
    undergroundScene.add(rimDir);

    // Subtle colored chamber accent point lights (capped radius so zero GPU strain on iPad)
    const chamberLights = [
        { x: 0, y: 16, z: 0, color: 0x38bdf8, intensity: 1.5, dist: 75 },
        { x: 126, y: 14, z: -126, color: 0x22d3ee, intensity: 2.2, dist: 95 },
        { x: -144, y: 15, z: -162, color: 0xf87171, intensity: 1.8, dist: 95 },
        { x: LAGOON_CENTER.x, y: 15, z: LAGOON_CENTER.z, color: 0x2dd4bf, intensity: 2.0, dist: 95 },
        { x: MAGMA_CENTER.x, y: 14, z: MAGMA_CENTER.z, color: 0xf97316, intensity: 2.4, dist: 95 },
        { x: -198, y: 14, z: -18, color: 0x4ade80, intensity: 1.8, dist: 85 },
        { x: -162, y: 14, z: 162, color: 0xfbbf24, intensity: 1.8, dist: 85 },
        { x: 0, y: 14, z: 198, color: 0xc084fc, intensity: 2.0, dist: 85 }
    ];
    chamberLights.forEach(cl => {
        const pt = new THREE.PointLight(cl.color, cl.intensity, cl.dist, 1.4);
        pt.position.set(cl.x, cl.y, cl.z);
        cavernWorldGroup.add(pt);
    });

    const rockTex = createCavernRockTexture();
    rockTex.repeat.set(3, 2);
    const ceilTex = createCavernRockTexture();
    ceilTex.repeat.set(18, 18);
    const floorTex = createCavernFloorTexture();

    // 2. Craggy Textured Cavern Floor Plane (displaced for Lagoon & Magma pit!)
    const floorGeo = new THREE.PlaneGeometry(520, 520, 96, 96);
    floorGeo.rotateX(-Math.PI / 2);
    const posAttr = floorGeo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);
    const colBase = new THREE.Color(0x414e6b);
    const colMoss = new THREE.Color(0x236f82);
    const colWarm = new THREE.Color(0x6b2710);
    const colShrineMoss = new THREE.Color(0x2d5a46);
    const colMineEarth = new THREE.Color(0x5b4636);
    const tmpCol = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const ldx = (vx - LAGOON_CENTER.x) / LAGOON_CENTER.rx;
        const ldz = (vz - LAGOON_CENTER.z) / LAGOON_CENTER.rz;
        const lDist = Math.hypot(ldx, ldz);
        const mDist = Math.hypot(vx - MAGMA_CENTER.x, vz - MAGMA_CENTER.z);

        let vy = 0.0;
        tmpCol.copy(colBase);
        if (lDist < 1.05) {
            vy = lDist < 0.72 ? -3.2 : THREE.MathUtils.lerp(-3.2, 0.0, (lDist - 0.72) / 0.33);
            tmpCol.lerp(colMoss, 0.78);
        } else if (mDist < MAGMA_CENTER.r) {
            vy = mDist < MAGMA_CENTER.r - 4 ? -2.4 : THREE.MathUtils.lerp(-2.4, 0.0, (mDist - (MAGMA_CENTER.r - 4)) / 4);
            tmpCol.lerp(colWarm, 0.85);
        } else {
            const n = Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 0.5 + 0.5;
            tmpCol.offsetHSL(0, 0, (n - 0.5) * 0.06);
            const dShrine = Math.hypot(vx + 198, vz + 18);
            if (dShrine < 54) tmpCol.lerp(colShrineMoss, (1 - dShrine / 54) * 0.55);
            const dMine = Math.hypot(vx + 162, vz - 162);
            if (dMine < 54) tmpCol.lerp(colMineEarth, (1 - dMine / 54) * 0.55);
            if (mDist < 54) tmpCol.lerp(colWarm, (1 - mDist / 54) * 0.45);
        }
        posAttr.setY(i, vy);
        colors[i * 3] = tmpCol.r;
        colors[i * 3 + 1] = tmpCol.g;
        colors[i * 3 + 2] = tmpCol.b;
    }
    floorGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    floorGeo.computeVertexNormals();
    const floorMat = new THREE.MeshToonMaterial({ vertexColors: true, map: floorTex, gradientMap: toonGrad3 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    cavernWorldGroup.add(floorMesh);

    // 3. Faceted Craggy Cavern Ceiling Roof (with deep cavern dome ridges)
    const ceilBaseGeo = new THREE.PlaneGeometry(520, 520, 32, 32);
    ceilBaseGeo.rotateX(Math.PI / 2);
    const ceilPos = ceilBaseGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < ceilPos.count; i++) {
        const vx = ceilPos.getX(i);
        const vz = ceilPos.getZ(i);
        const ridge = Math.sin(vx * 0.045) * Math.cos(vz * 0.045) * 2.4
            + Math.sin(vx * 0.14 + vz * 0.11) * 1.4
            + Math.cos(vx * 0.23 - vz * 0.19) * 0.75;
        ceilPos.setY(i, CEILING_Y + ridge);
    }
    const ceilGeo = ceilBaseGeo.toNonIndexed();
    ceilGeo.computeVertexNormals();
    const ceilMat = new THREE.MeshToonMaterial({ color: 0x243247, map: ceilTex, gradientMap: toonGrad3 });
    cavernWorldGroup.add(new THREE.Mesh(ceilGeo, ceilMat));

    // 4. Instanced Craggy Faceted Maze Walls & Outer Cavern Perimeter
    interface SolidWallSpec {
        x: number;
        z: number;
        len: number;
        sy: number;
        thick: number;
        rotY: number;
        horizontal: boolean;
    }
    const solidWalls: SolidWallSpec[] = [];
    _edges.forEach(e => {
        if (e.open || e.cracked) return;
        const len = CELL_SIZE + WALL_THICK * 0.9;
        const flip = rand() > 0.5 ? Math.PI : 0;
        solidWalls.push({
            x: e.x,
            z: e.z,
            len,
            sy: 25 + rand() * 4,
            thick: WALL_THICK,
            rotY: (e.horizontal ? 0 : Math.PI / 2) + flip,
            horizontal: e.horizontal
        });
    });

    // Outer perimeter rock boundary around [-234, +234]
    for (let i = 0; i < GRID_SIZE; i++) {
        const coord = -HALF_WORLD + (i + 0.5) * CELL_SIZE;
        solidWalls.push({ x: coord, z: -HALF_WORLD - HALF_WALL, len: CELL_SIZE + 9, sy: 30, thick: 9.4, rotY: 0, horizontal: true });
        solidWalls.push({ x: coord, z: HALF_WORLD + HALF_WALL, len: CELL_SIZE + 9, sy: 30, thick: 9.4, rotY: Math.PI, horizontal: true });
        solidWalls.push({ x: -HALF_WORLD - HALF_WALL, z: coord, len: CELL_SIZE + 9, sy: 30, thick: 9.4, rotY: Math.PI / 2, horizontal: false });
        solidWalls.push({ x: HALF_WORLD + HALF_WALL, z: coord, len: CELL_SIZE + 9, sy: 30, thick: 9.4, rotY: Math.PI * 1.5, horizontal: false });
    }

    const wallCragGeo = createCraggyWallGeometry();
    const matRockWall = new THREE.MeshToonMaterial({ color: 0xffffff, map: rockTex, gradientMap: toonGrad3 });
    const matRockAccent = new THREE.MeshToonMaterial({ color: 0xffffff, map: rockTex, gradientMap: toonGrad3 });

    const wallInst = new THREE.InstancedMesh(wallCragGeo, matRockWall, solidWalls.length);
    const dummy = new THREE.Object3D();
    const wallColorTmp = new THREE.Color();

    const pickRockBiomeColor = (x: number, z: number, brightnessShift = 0): THREE.Color => {
        const toneRoll = Math.abs(Math.sin(x * 0.13 + z * 0.17));
        const base = toneRoll > 0.66 ? 0x5c6e8e : (toneRoll > 0.33 ? 0x4b5c7a : 0x3d4b66);
        wallColorTmp.setHex(base);
        const dMagma = Math.hypot(x - MAGMA_CENTER.x, z - MAGMA_CENTER.z);
        if (dMagma < 86) wallColorTmp.lerp(colWarm, (1 - dMagma / 86) * 0.55);
        const dLagoon = Math.hypot(x - LAGOON_CENTER.x, z - LAGOON_CENTER.z);
        if (dLagoon < 80) wallColorTmp.lerp(colMoss, (1 - dLagoon / 80) * 0.48);
        const dShrine = Math.hypot(x + 198, z + 18);
        if (dShrine < 70) wallColorTmp.lerp(colShrineMoss, (1 - dShrine / 70) * 0.42);
        if (brightnessShift !== 0) wallColorTmp.offsetHSL(0, 0, brightnessShift);
        return wallColorTmp;
    };

    solidWalls.forEach((w, idx) => {
        dummy.position.set(w.x, w.sy * 0.5 - 0.5, w.z);
        dummy.rotation.set(0, w.rotY, 0);
        dummy.scale.set(w.len, w.sy, w.thick);
        dummy.updateMatrix();
        wallInst.setMatrixAt(idx, dummy.matrix);
        wallInst.setColorAt(idx, pickRockBiomeColor(w.x, w.z, (rand() - 0.5) * 0.06));
    });
    wallInst.instanceMatrix.needsUpdate = true;
    if (wallInst.instanceColor) wallInst.instanceColor.needsUpdate = true;
    cavernWorldGroup.add(wallInst);

    // 4B. Craggy Corner & Mid-Wall Rock Buttresses (seals all 90-degree corners & adds deep rock contours)
    interface ButtressSpec { x: number; z: number; r: number; h: number; rotY: number; shift: number }
    const buttresses: ButtressSpec[] = [];
    for (let gr = 0; gr <= GRID_SIZE; gr++) {
        for (let gc = 0; gc <= GRID_SIZE; gc++) {
            const onOuter = gr === 0 || gr === GRID_SIZE || gc === 0 || gc === GRID_SIZE;
            let hasClosed = onOuter;
            if (!hasClosed) {
                if (gr > 0 && gr < GRID_SIZE && gc < GRID_SIZE) {
                    const eHRight = _edges.get(edgeKey(gr - 1, gc, gr, gc));
                    if (eHRight && !eHRight.open && !eHRight.cracked) hasClosed = true;
                }
                if (gr > 0 && gr < GRID_SIZE && gc > 0) {
                    const eHLeft = _edges.get(edgeKey(gr - 1, gc - 1, gr, gc - 1));
                    if (eHLeft && !eHLeft.open && !eHLeft.cracked) hasClosed = true;
                }
                if (gc > 0 && gc < GRID_SIZE && gr < GRID_SIZE) {
                    const eVDown = _edges.get(edgeKey(gr, gc - 1, gr, gc));
                    if (eVDown && !eVDown.open && !eVDown.cracked) hasClosed = true;
                }
                if (gc > 0 && gc < GRID_SIZE && gr > 0) {
                    const eVUp = _edges.get(edgeKey(gr - 1, gc - 1, gr - 1, gc));
                    if (eVUp && !eVUp.open && !eVUp.cracked) hasClosed = true;
                }
            }
            if (!hasClosed) continue;
            const vx = -HALF_WORLD + gc * CELL_SIZE;
            const vz = -HALF_WORLD + gr * CELL_SIZE;
            if (isUndergroundPointInWater(vx, vz) || Math.hypot(vx - MAGMA_CENTER.x, vz - MAGMA_CENTER.z) < MAGMA_CENTER.r + 3.0) {
                continue;
            }
            buttresses.push({
                x: vx,
                z: vz,
                r: 3.7 + rand() * 0.9,
                h: 25.5 + rand() * 4.5,
                rotY: rand() * Math.PI * 2,
                shift: -0.04
            });
        }
    }

    // Mid-wall rock ribs tucked strictly inside the non-walkable wall skirt zone
    solidWalls.forEach((w, idx) => {
        if (idx % 2 === 1 && w.sy < 29) return;
        const count = w.sy >= 29 ? 2 : 1;
        for (let k = 0; k < count; k++) {
            const along = (rand() - 0.5) * 16.0;
            const side = rand() > 0.5 ? 1 : -1;
            const perp = side * (w.thick * 0.28);
            const bx = w.x + (w.horizontal ? along : perp);
            const bz = w.z + (w.horizontal ? perp : along);
            if (isUndergroundPointInWater(bx, bz) || Math.hypot(bx - MAGMA_CENTER.x, bz - MAGMA_CENTER.z) < MAGMA_CENTER.r + 3.0) continue;
            buttresses.push({
                x: bx,
                z: bz,
                r: 2.35 + rand() * 0.85,
                h: 13 + rand() * 13,
                rotY: rand() * Math.PI * 2,
                shift: 0.03
            });
        }
    });

    const buttressGeo = createCraggyButtressGeometry();
    const buttressInst = new THREE.InstancedMesh(buttressGeo, matRockAccent, buttresses.length);
    buttresses.forEach((b, i) => {
        dummy.position.set(b.x, b.h * 0.5 - 0.4, b.z);
        dummy.rotation.set(0, b.rotY, 0);
        dummy.scale.set(b.r, b.h, b.r);
        dummy.updateMatrix();
        buttressInst.setMatrixAt(i, dummy.matrix);
        buttressInst.setColorAt(i, pickRockBiomeColor(b.x, b.z, b.shift));
    });
    buttressInst.instanceMatrix.needsUpdate = true;
    if (buttressInst.instanceColor) buttressInst.instanceColor.needsUpdate = true;
    cavernWorldGroup.add(buttressInst);

    // 4C. Floor-Edge Rocky Rubble Skirts (breaks up the wall-to-floor seam without obstructing paths)
    interface RubbleSpec { x: number; z: number; sx: number; sy: number; sz: number; rotY: number }
    const rubbleSpecs: RubbleSpec[] = [];
    for (let i = 0; i < solidWalls.length && rubbleSpecs.length < 240; i++) {
        const w = solidWalls[i];
        const rocksOnWall = w.sy >= 29 ? 2 : 1;
        for (let k = 0; k < rocksOnWall; k++) {
            const along = (rand() - 0.5) * (w.len - 10);
            const side = rand() > 0.5 ? 1 : -1;
            const perp = side * (w.thick * 0.5 + 0.5 + rand() * 0.5);
            const rx = w.x + (w.horizontal ? along : perp);
            const rz = w.z + (w.horizontal ? perp : along);
            if (isUndergroundPointInWater(rx, rz)) continue;
            if (Math.hypot(rx - MAGMA_CENTER.x, rz - MAGMA_CENTER.z) < MAGMA_CENTER.r + 3.5) continue;
            if (Math.hypot(rx, rz) < 18) continue;
            if (collidesWithStatic(rx, rz, 3.0)) continue;
            rubbleSpecs.push({
                x: rx,
                z: rz,
                sx: 1.5 + rand() * 1.1,
                sy: 0.75 + rand() * 0.65,
                sz: 1.2 + rand() * 0.9,
                rotY: rand() * Math.PI * 2
            });
        }
    }
    if (rubbleSpecs.length > 0) {
        const rubbleGeo = createCraggyBoulderSkirtGeometry();
        const rubbleInst = new THREE.InstancedMesh(rubbleGeo, matRockWall, rubbleSpecs.length);
        const rubbleOutInst = new THREE.InstancedMesh(rubbleGeo, matInkOutline, rubbleSpecs.length);
        rubbleSpecs.forEach((rb, i) => {
            dummy.position.set(rb.x, rb.sy * 0.25, rb.z);
            dummy.rotation.set(0, rb.rotY, 0);
            dummy.scale.set(rb.sx, rb.sy, rb.sz);
            dummy.updateMatrix();
            rubbleInst.setMatrixAt(i, dummy.matrix);
            rubbleInst.setColorAt(i, pickRockBiomeColor(rb.x, rb.z, 0.05));

            dummy.scale.set(rb.sx * 1.07, rb.sy * 1.07, rb.sz * 1.07);
            dummy.updateMatrix();
            rubbleOutInst.setMatrixAt(i, dummy.matrix);
        });
        rubbleInst.instanceMatrix.needsUpdate = true;
        if (rubbleInst.instanceColor) rubbleInst.instanceColor.needsUpdate = true;
        rubbleOutInst.instanceMatrix.needsUpdate = true;
        cavernWorldGroup.add(rubbleInst, rubbleOutInst);
    }

    // 5. Faceted Stalactites Overhead, Wall-Hugging Stalagmites & Overhead Cave Ribs
    const spireUpGeo = createCraggySpireGeometry();
    const spireDownGeo = spireUpGeo.clone().rotateX(Math.PI);

    const stalCount = 200;
    const stalInst = new THREE.InstancedMesh(spireDownGeo, matRockAccent, stalCount);
    const stalPositions: Array<{ x: number; z: number; scale: number }> = [];
    for (let i = 0; i < stalCount; i++) {
        const sx = (rand() - 0.5) * 440;
        const sz = (rand() - 0.5) * 440;
        if (Math.hypot(sx, sz) < 20) continue;
        const sc = 0.8 + rand() * 1.4;
        const h = 4.5 + rand() * 6.5;
        dummy.position.set(sx, CEILING_Y - h * 0.35, sz);
        dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);
        dummy.scale.set(sc * 1.05, h, sc * 1.05);
        dummy.updateMatrix();
        stalInst.setMatrixAt(stalPositions.length, dummy.matrix);
        stalInst.setColorAt(stalPositions.length, pickRockBiomeColor(sx, sz, -0.05));
        stalPositions.push({ x: sx, z: sz, scale: sc });
    }
    stalInst.count = stalPositions.length;
    stalInst.instanceMatrix.needsUpdate = true;
    if (stalInst.instanceColor) stalInst.instanceColor.needsUpdate = true;
    cavernWorldGroup.add(stalInst);

    // Wall-hugging stalagmites rising beside solid wall skirts (never blocking paths)
    const stagSpecs: Array<{ x: number; z: number; r: number; h: number; rotY: number }> = [];
    for (let i = 0; i < solidWalls.length && stagSpecs.length < 75; i++) {
        if (i % 2 === 1) continue;
        const w = solidWalls[i];
        const along = (rand() - 0.5) * (w.len - 12);
        const side = rand() > 0.5 ? 1 : -1;
        const perp = side * (w.thick * 0.5 + 0.45);
        const px = w.x + (w.horizontal ? along : perp);
        const pz = w.z + (w.horizontal ? perp : along);
        if (isUndergroundPointInWater(px, pz)) continue;
        if (Math.hypot(px - MAGMA_CENTER.x, pz - MAGMA_CENTER.z) < MAGMA_CENTER.r + 3.5) continue;
        if (Math.hypot(px, pz) < 18) continue;
        stagSpecs.push({ x: px, z: pz, r: 0.95 + rand() * 0.55, h: 3.0 + rand() * 3.4, rotY: rand() * Math.PI * 2 });
    }
    if (stagSpecs.length > 0) {
        const stagInst = new THREE.InstancedMesh(spireUpGeo, matRockAccent, stagSpecs.length);
        const stagOutInst = new THREE.InstancedMesh(spireUpGeo, matInkOutline, stagSpecs.length);
        stagSpecs.forEach((st, i) => {
            dummy.position.set(st.x, st.h * 0.45, st.z);
            dummy.rotation.set(0, st.rotY, 0);
            dummy.scale.set(st.r, st.h, st.r);
            dummy.updateMatrix();
            stagInst.setMatrixAt(i, dummy.matrix);
            stagInst.setColorAt(i, pickRockBiomeColor(st.x, st.z, 0.04));

            dummy.scale.set(st.r * 1.07, st.h * 1.03, st.r * 1.07);
            dummy.updateMatrix();
            stagOutInst.setMatrixAt(i, dummy.matrix);
        });
        stagInst.instanceMatrix.needsUpdate = true;
        if (stagInst.instanceColor) stagInst.instanceColor.needsUpdate = true;
        stagOutInst.instanceMatrix.needsUpdate = true;
        cavernWorldGroup.add(stagInst, stagOutInst);
    }

    // Overhead craggy stone cave ceiling arches/ribs high above corridors
    const ribSpecs: Array<{ x: number; z: number; sx: number; sy: number; sz: number; rotY: number }> = [];
    for (let r = 0; r < GRID_SIZE && ribSpecs.length < 65; r += 2) {
        for (let c = (r % 4 === 0 ? 0 : 1); c < GRID_SIZE && ribSpecs.length < 65; c += 2) {
            const cx = cellCenterX(c);
            const cz = cellCenterZ(r);
            if (Math.hypot(cx, cz) < 28) continue;
            ribSpecs.push({
                x: cx,
                z: cz,
                sx: CELL_SIZE * 0.95,
                sy: 3.2 + rand() * 2.2,
                sz: 3.6 + rand() * 2.0,
                rotY: rand() > 0.5 ? 0 : Math.PI / 2
            });
        }
    }
    if (ribSpecs.length > 0) {
        const ribInst = new THREE.InstancedMesh(wallCragGeo, matRockAccent, ribSpecs.length);
        ribSpecs.forEach((rb, i) => {
            dummy.position.set(rb.x, CEILING_Y - 1.2, rb.z);
            dummy.rotation.set(0, rb.rotY, 0);
            dummy.scale.set(rb.sx, rb.sy, rb.sz);
            dummy.updateMatrix();
            ribInst.setMatrixAt(i, dummy.matrix);
            ribInst.setColorAt(i, pickRockBiomeColor(rb.x, rb.z, -0.06));
        });
        ribInst.instanceMatrix.needsUpdate = true;
        if (ribInst.instanceColor) ribInst.instanceColor.needsUpdate = true;
        cavernWorldGroup.add(ribInst);
    }

    // Instanced glowing wall crystal clusters attached directly onto craggy maze walls
    const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
    const gemColors = [0xc084fc, 0x34d399, 0xfb7185, 0x38bdf8, 0xfbbf24];
    const gemMats = gemColors.map(col => new THREE.MeshBasicMaterial({ color: col }));
    const perMatLists: THREE.Matrix4[][] = gemColors.map(() => []);

    solidWalls.forEach((w, idx) => {
        if (idx % 2 === 1 && w.sy < 29) return;
        for (let k = 0; k < 2; k++) {
            const cIdx = Math.floor(rand() * gemColors.length);
            const along = (rand() - 0.5) * Math.max(4, w.len - 10);
            const sideSign = k === 0 ? 1 : -1;
            const px = w.x + (w.horizontal ? along : sideSign * (w.thick * 0.52));
            const pz = w.z + (w.horizontal ? sideSign * (w.thick * 0.52) : along);
            const py = 2.6 + rand() * 10.0;
            const sc = 0.85 + rand() * 1.1;

            // Primary crystal shard
            const matA = new THREE.Matrix4();
            dummy.position.set(px, py, pz);
            dummy.rotation.set((rand() - 0.5) * 0.65, rand() * Math.PI * 2, (rand() - 0.5) * 0.65);
            dummy.scale.set(sc * 0.68, sc * 1.9, sc * 0.68);
            dummy.updateMatrix();
            matA.copy(dummy.matrix);
            perMatLists[cIdx].push(matA);

            // Secondary angled companion shard
            const matB = new THREE.Matrix4();
            dummy.position.set(px + (rand() - 0.5) * 1.2, py - 0.4, pz + (rand() - 0.5) * 1.2);
            dummy.rotation.set((rand() - 0.5) * 1.0, rand() * Math.PI * 2, (rand() - 0.5) * 1.0);
            dummy.scale.set(sc * 0.48, sc * 1.35, sc * 0.48);
            dummy.updateMatrix();
            matB.copy(dummy.matrix);
            perMatLists[cIdx].push(matB);
        }
    });

    perMatLists.forEach((mats, idx) => {
        if (mats.length === 0) return;
        const inst = new THREE.InstancedMesh(crystalGeo, gemMats[idx], mats.length);
        mats.forEach((m, i) => inst.setMatrixAt(i, m));
        inst.instanceMatrix.needsUpdate = true;
        cavernWorldGroup.add(inst);
    });

    // 6. Breakable Cracked Rock Walls (fissured amber-cracked boulders blocking secret doors & shortcuts!)
    const crackTex = createCavernTextureSet();
    const matCrackedRock = new THREE.MeshToonMaterial({ map: crackTex, gradientMap: toonGrad3 });
    const matAmberSeam = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    _crackedWalls.length = 0;
    _edges.forEach(e => {
        if (!e.cracked) return;
        const wallGroup = new THREE.Group();
        wallGroup.position.set(e.x, 0, e.z);
        if (!e.horizontal) wallGroup.rotation.y = Math.PI / 2;

        // Cluster of interlocking cracked boulders filling the 29m wide doorway
        const segOffsets = [-10.5, -3.5, 3.5, 10.5];
        segOffsets.forEach((ox, idx) => {
            const h = 11.5 + (idx % 2) * 3.0;
            const block = new THREE.Mesh(new THREE.DodecahedronGeometry(4.6, 0), matCrackedRock);
            block.position.set(ox, h * 0.42, 0);
            block.scale.set(1.1, 1.35, 0.95);
            block.rotation.y = idx * 0.8;
            wallGroup.add(block);

            const seam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 7.4), matAmberSeam);
            seam.position.set(ox, 3.2 + (idx % 2) * 1.4, 0);
            seam.rotation.z = idx % 2 === 0 ? 0.35 : -0.35;
            seam.userData.noOutline = true;
            wallGroup.add(seam);
        });

        applyCartoonInkOutlines(wallGroup, 1.04, true);
        wallGroup.visible = !e.broken;
        cavernWorldGroup.add(wallGroup);

        _crackedWalls.push({
            id: e.id,
            edge: e,
            x: e.x,
            z: e.z,
            horizontal: e.horizontal,
            group: wallGroup,
            broken: e.broken
        });
    });

    // 7. Three Sunlit Surface Exit Shafts
    const shaftLocations = [
        { id: 'SHAFT_HUB', name: 'Griffin Shaft Surface Lift', r: 6, c: 6, x: -12, z: -12 },
        { id: 'SHAFT_EAST', name: 'East Quarry Exit Shaft', r: 4, c: 11, x: cellCenterX(11), z: cellCenterZ(4) },
        { id: 'SHAFT_SW', name: 'Timber Creek Exit Shaft', r: 8, c: 3, x: cellCenterX(3), z: cellCenterZ(8) }
    ];
    _exitShafts.length = 0;
    const matShaftBeam = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const matShaftRing = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const matShaftPad = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });

    shaftLocations.forEach(sh => {
        const g = new THREE.Group();
        g.position.set(sh.x, 0.05, sh.z);

        const pad = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.8, 0.35, 16), matShaftPad);
        pad.position.y = 0.15;
        g.add(pad);

        const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 6.4, 24).rotateX(-Math.PI / 2), matShaftRing);
        ring.position.y = 0.38;
        g.add(ring);

        const beam = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.6, CEILING_Y, 16, 1, true), matShaftBeam);
        beam.position.y = CEILING_Y * 0.5;
        g.add(beam);

        cavernWorldGroup.add(g);
        _exitShafts.push({
            id: sh.id,
            name: sh.name,
            r: sh.r,
            c: sh.c,
            x: sh.x,
            z: sh.z,
            beamMesh: beam,
            ringMesh: ring
        });
    });
}

// =========================================================================
// BUILD ALL 7 HIDDEN DISCOVERIES IN THE CAVERNS
// =========================================================================
function buildHiddenDiscoveries() {
    _staticColliders.length = 0;
    _animatedMeshes.length = 0;

    // -----------------------------------------------------------------
    // 1. GREAT ENERGON CRYSTAL CACHE (126, -126)
    // -----------------------------------------------------------------
    {
        const g = buildEnergonCacheMesh(_animatedMeshes);
        g.position.set(126, 0, -126);
        cavernWorldGroup.add(g);
        _staticColliders.push({ x: 126, z: -126, r: 9.2 });
    }

    // -----------------------------------------------------------------
    // 2. CRASHED RESCUE BOTS STARSHIP: THE SIGMA (-144, -162)
    // -----------------------------------------------------------------
    buildCrashedSpaceshipSigma(cavernWorldGroup, _animatedMeshes, _staticColliders);

    // -----------------------------------------------------------------
    // 3. BIOLUMINESCENT UNDERGROUND LAGOON (144, 126)
    // -----------------------------------------------------------------
    {
        const waterGeo = new THREE.CircleGeometry(1, 40);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.78,
            side: THREE.DoubleSide
        });
        const lagoonWater = new THREE.Mesh(waterGeo, waterMat);
        lagoonWater.position.set(LAGOON_CENTER.x, -0.45, LAGOON_CENTER.z);
        lagoonWater.scale.set(LAGOON_CENTER.rx, 1, LAGOON_CENTER.rz);
        undergroundScene.add(lagoonWater);

        // Glowing Waterfall Pouring From North Chamber Ceiling into Lagoon
        const waterfallGeo = new THREE.CylinderGeometry(3.5, 6.0, CEILING_Y + 2.5, 14, 1, true);
        const waterfallMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.62,
            side: THREE.DoubleSide
        });
        const waterfall = new THREE.Mesh(waterfallGeo, waterfallMat);
        waterfall.position.set(LAGOON_CENTER.x + 12, (CEILING_Y - 1.5) * 0.5, LAGOON_CENTER.z - 12);
        cavernWorldGroup.add(waterfall);
        _animatedMeshes.push({ obj: waterfall, kind: 'WATERFALL', baseY: (CEILING_Y - 1.5) * 0.5, phase: 0 });

        // Glowing Teal Lily-Crystal Rim Stones along shore
        const matPad = new THREE.MeshToonMaterial({ color: 0x2dd4bf, gradientMap: toonGrad3 });
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            const px = LAGOON_CENTER.x + Math.cos(ang) * 28;
            const pz = LAGOON_CENTER.z + Math.sin(ang) * 18;
            const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 0), matPad);
            stone.position.set(px, 0.4, pz);
            stone.scale.set(1.2, 0.55, 1.2);
            cavernWorldGroup.add(stone);
        }
    }

    // -----------------------------------------------------------------
    // 4. MT. GRIFFIN MAGMA CORE CHAMBER & BASALT BRIDGE (0, -198)
    // -----------------------------------------------------------------
    {
        const magmaGroup = buildMagmaBridgeMesh(_animatedMeshes, MAGMA_CENTER.r, -0.95);
        magmaGroup.position.set(MAGMA_CENTER.x, 0, MAGMA_CENTER.z);
        cavernWorldGroup.add(magmaGroup);

        // Curb colliders preventing falling off bridge sides into magma pit
        for (let cx = -24; cx <= 24; cx += 6) {
            _staticColliders.push({ x: MAGMA_CENTER.x + cx, z: MAGMA_CENTER.z - 9.8, r: 2.8 });
            _staticColliders.push({ x: MAGMA_CENTER.x + cx, z: MAGMA_CENTER.z + 9.8, r: 2.8 });
        }
    }

    // -----------------------------------------------------------------
    // 5. ANCIENT FOSSILIZED DINOBOT SHRINE (-198, -18)
    // -----------------------------------------------------------------
    {
        const shrine = buildDinobotShrineMesh();
        shrine.position.set(-206, 0, -18);
        shrine.rotation.y = Math.PI / 2;
        cavernWorldGroup.add(shrine);
        _staticColliders.push({ x: -206, z: -18, r: 9.8 });
    }

    // -----------------------------------------------------------------
    // 6. DR. MOROCCO'S ABANDONED VICTORIAN MINE (-162, 162)
    // -----------------------------------------------------------------
    {
        const mine = buildMoroccoMineMesh();
        mine.position.set(-162, 0, 162);
        cavernWorldGroup.add(mine);
        _staticColliders.push({ x: -162, z: 158, r: 4.5 });
        _staticColliders.push({ x: -153.5, z: 167.5, r: 3.8 });
    }

    // -----------------------------------------------------------------
    // 7. BOULDER'S SECRET CRYSTAL SCULPTURE ALCOVE (0, 198)
    // -----------------------------------------------------------------
    {
        const gallery = buildBoulderGalleryMesh(_animatedMeshes);
        gallery.position.set(0, 0, 198);
        cavernWorldGroup.add(gallery);
        _staticColliders.push({ x: 0, z: 198, r: 6.2 });
    }
}

// =========================================================================
// INTERACTIVE COLLECTIBLE GEMS & SMASHABLE FLOOR BOULDERS
// =========================================================================
function buildGemsAndBoulders(rand: () => number) {
    _gems.length = 0;
    _boulders.length = 0;

    const gemColors = [0xc084fc, 0x38bdf8, 0x34d399, 0xf43f5e, 0xfbbf24];
    const gemMats = gemColors.map(c => new THREE.MeshBasicMaterial({ color: c }));
    const matStone = new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 });
    const gemRingMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.7, side: THREE.DoubleSide });

    let gemIdx = 0;
    let boulderIdx = 0;

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cx = cellCenterX(c);
            const cz = cellCenterZ(r);
            // Skip Entry Hub center, Lagoon water, and Magma pit
            if (r === 6 && c === 6) continue;
            if (isUndergroundPointInWater(cx, cz)) continue;
            if (Math.hypot(cx - MAGMA_CENTER.x, cz - MAGMA_CENTER.z) < MAGMA_CENTER.r + 4) continue;

            const isChamber = _cellChamber[r][c] > 0;
            const roll = rand();

            // Place collectible gem outcrop in ~26% of corridor cells + gallery
            if ((roll < 0.27 || isGalleryCell(r, c)) && _gems.length < 44) {
                const gx = cx + (rand() - 0.5) * 14;
                const gz = cz + (rand() - 0.5) * 14;
                if (!isUndergroundPointInWater(gx, gz) && !collidesWithStatic(gx, gz, 4.5)) {
                    const gGrp = new THREE.Group();
                    gGrp.position.set(gx, 0, gz);
                    const gMat = gemMats[gemIdx % gemMats.length];

                    const mainCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.55, 0), gMat);
                    mainCrystal.position.y = 2.0;
                    mainCrystal.scale.set(0.85, 1.55, 0.85);
                    gGrp.add(mainCrystal);

                    const sideCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), gMat);
                    sideCrystal.position.set(1.1, 1.2, 0.5);
                    sideCrystal.rotation.z = -0.35;
                    sideCrystal.scale.set(0.75, 1.4, 0.75);
                    gGrp.add(sideCrystal);

                    const baseRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 16).rotateX(-Math.PI / 2), gemRingMat);
                    baseRing.position.y = 0.12;
                    gGrp.add(baseRing);

                    cavernWorldGroup.add(gGrp);
                    _gems.push({ x: gx, z: gz, mesh: gGrp, collected: false, phase: gemIdx * 0.7 });
                    gemIdx++;
                }
            } else if (!isChamber && roll > 0.72 && _boulders.length < 30) {
                // Smashable Cavern Floor Boulders along corridors (Boulder can Smash/Drill through them!)
                const bx = cx + (rand() - 0.5) * 14;
                const bz = cz + (rand() - 0.5) * 14;
                const br = 2.2 + rand() * 0.9;
                if (!isUndergroundPointInWater(bx, bz) && !collidesWithStatic(bx, bz, br + 3.0)) {
                    const bGrp = new THREE.Group();
                    bGrp.position.set(bx, 0, bz);
                    const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(br, 0), matStone);
                    rockMesh.position.y = br * 0.72;
                    rockMesh.rotation.set(rand() * 2, rand() * 2, 0);
                    bGrp.add(rockMesh);
                    applyCartoonInkOutlines(bGrp, 1.05, true);
                    cavernWorldGroup.add(bGrp);
                    _boulders.push({ id: boulderIdx++, x: bx, z: bz, r: br, mesh: bGrp, destroyed: false });
                }
            }
        }
    }
}

function collidesWithStatic(x: number, z: number, r: number): boolean {
    for (let i = 0; i < _staticColliders.length; i++) {
        const sc = _staticColliders[i];
        if (Math.hypot(x - sc.x, z - sc.z) < sc.r + r) return true;
    }
    return false;
}

// Roaming underground dinosaurs built via pure createCavernDinoMesh() in cavernModels.ts
function isCellSafeForDino(r: number, c: number, isBig: boolean): boolean {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (isGalleryCell(r, c)) return false;
    const cx = cellCenterX(c);
    const cz = cellCenterZ(r);
    const waterMargin = isBig ? 7.0 : 4.0;
    const ldx = (cx - LAGOON_CENTER.x) / (LAGOON_CENTER.rx + waterMargin);
    const ldz = (cz - LAGOON_CENTER.z) / (LAGOON_CENTER.rz + waterMargin);
    if (ldx * ldx + ldz * ldz < 1.0) return false;
    if (Math.hypot(cx - MAGMA_CENTER.x, cz - MAGMA_CENTER.z) < MAGMA_CENTER.r + 8.0) return false;
    if (collidesWithStatic(cx, cz, isBig ? 7.0 : 4.2)) return false;
    return true;
}

function resolveDinoAgainstWorld(d: CavernDino) {
    for (let pass = 0; pass < 2; pass++) {
        const sinH = Math.sin(d.heading);
        const cosH = Math.cos(d.heading);
        for (let s = 0; s < d.wallSpheres.length; s++) {
            const sp = d.wallSpheres[s];
            const ox = d.x + sinH * sp.forward;
            const oz = d.z + cosH * sp.forward;
            const spPos = { x: ox, z: oz };
            resolveMazeWallAndProps(spPos, sp.r);

            for (let bIdx = 0; bIdx < _boulders.length; bIdx++) {
                const b = _boulders[bIdx];
                if (!b.destroyed) pushOutCircle(spPos, sp.r, b.x, b.z, b.r);
            }

            const ldx = (spPos.x - LAGOON_CENTER.x) / (LAGOON_CENTER.rx * 0.92 + sp.r);
            const ldz = (spPos.z - LAGOON_CENTER.z) / (LAGOON_CENTER.rz * 0.92 + sp.r);
            if (ldx * ldx + ldz * ldz < 1.0) {
                const vx = spPos.x - LAGOON_CENTER.x;
                const vz = spPos.z - LAGOON_CENTER.z;
                const vLen = Math.hypot(vx, vz) || 1;
                spPos.x += (vx / vLen) * 1.5;
                spPos.z += (vz / vLen) * 1.5;
            }

            const mDist = Math.hypot(spPos.x - MAGMA_CENTER.x, spPos.z - MAGMA_CENTER.z);
            const mMin = MAGMA_CENTER.r + 3.0 + sp.r;
            if (mDist < mMin) {
                const push = mMin - mDist;
                const vLen = mDist || 1;
                spPos.x += ((spPos.x - MAGMA_CENTER.x) / vLen) * push;
                spPos.z += ((spPos.z - MAGMA_CENTER.z) / vLen) * push;
            }

            d.x += spPos.x - ox;
            d.z += spPos.z - oz;
        }
    }
}

let _dinoPickCounter = 1;
function pickNextAdjacentDinoCell(d: CavernDino, preferNonPrev: boolean) {
    const cur = worldToCell(d.x, d.z);
    d.curR = cur.r;
    d.curC = cur.c;

    const dirs: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const openAdj: Array<{ r: number; c: number }> = [];
    for (const [dr, dc] of dirs) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;
        if (!isCellSafeForDino(nr, nc, d.isBig)) continue;
        const edge = _edges.get(edgeKey(cur.r, cur.c, nr, nc));
        if (edge && (edge.open || (edge.cracked && edge.broken))) {
            openAdj.push({ r: nr, c: nc });
        }
    }

    if (openAdj.length === 0) {
        d.prevR = cur.r;
        d.prevC = cur.c;
        d.targetR = cur.r;
        d.targetC = cur.c;
        d.targetX = cellCenterX(cur.c);
        d.targetZ = cellCenterZ(cur.r);
        return;
    }

    const nonPrev = preferNonPrev
        ? openAdj.filter(n => n.r !== d.prevR || n.c !== d.prevC)
        : openAdj;
    const pool = nonPrev.length > 0 ? nonPrev : openAdj;
    const pick = pool[(_dinoPickCounter++ + Math.floor(d.phase * 17)) % pool.length];

    d.prevR = cur.r;
    d.prevC = cur.c;
    d.targetR = pick.r;
    d.targetC = pick.c;
    d.targetX = cellCenterX(pick.c);
    d.targetZ = cellCenterZ(pick.r);
}

function buildRoamingDinos(rand: () => number) {
    _dinos.length = 0;

    const specs: Array<{ species: CavernDino['species']; name: string; isBig: boolean; r: number; c: number; speed: number }> = [
        // Big Patrolling Dinosaurs (multi-sphere collision + playful bump nudge!)
        { species: 'TREX', name: 'Cavern T-Rex', isBig: true, r: 2, c: 9, speed: 9.0 },
        { species: 'TREX', name: 'Grotto T-Rex', isBig: true, r: 5, c: 1, speed: 8.5 },
        { species: 'TREX', name: 'Deep Fang T-Rex', isBig: true, r: 8, c: 7, speed: 9.2 },

        { species: 'BRONTO', name: 'Cavern Brontosaurus', isBig: true, r: 2, c: 3, speed: 6.5 },
        { species: 'BRONTO', name: 'Oasis Brontosaurus', isBig: true, r: 9, c: 9, speed: 6.2 },
        { species: 'BRONTO', name: 'Echo Dome Bronto', isBig: true, r: 4, c: 5, speed: 6.4 },

        { species: 'STEGO', name: 'Crystal Stegosaurus', isBig: true, r: 3, c: 7, speed: 7.5 },
        { species: 'STEGO', name: 'Shard Stegosaurus', isBig: true, r: 8, c: 5, speed: 7.2 },
        { species: 'STEGO', name: 'Amethyst Stego', isBig: true, r: 10, c: 4, speed: 7.8 },

        { species: 'TRIKE', name: 'Armored Triceratops', isBig: true, r: 4, c: 2, speed: 8.0 },
        { species: 'TRIKE', name: 'Basalt Triceratops', isBig: true, r: 2, c: 6, speed: 7.6 },
        { species: 'TRIKE', name: 'Quarry Triceratops', isBig: true, r: 7, c: 10, speed: 8.2 },

        // Speedy Tunnel Raptors
        { species: 'RAPTOR', name: 'Cavern Raptor Dash', isBig: false, r: 5, c: 7, speed: 12.0 },
        { species: 'RAPTOR', name: 'Neon Raptor Scout', isBig: false, r: 7, c: 4, speed: 12.5 },
        { species: 'RAPTOR', name: 'Shadow Raptor', isBig: false, r: 4, c: 9, speed: 11.8 },
        { species: 'RAPTOR', name: 'Grotto Raptor', isBig: false, r: 9, c: 2, speed: 12.2 }
    ];

    specs.forEach((sp, idx) => {
        const rig = createCavernDinoMesh(sp.species);
        const sx = cellCenterX(sp.c);
        const sz = cellCenterZ(sp.r);

        // Compute connected walkable patrol cells (BFS depth <= 3)
        const homeCells: Array<{ r: number; c: number }> = [];
        const visited = new Set<number>([sp.r * GRID_SIZE + sp.c]);
        const q: Array<{ r: number; c: number; d: number }> = [{ r: sp.r, c: sp.c, d: 0 }];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        while (q.length > 0) {
            const cur = q.shift()!;
            homeCells.push({ r: cur.r, c: cur.c });
            if (cur.d >= 3) continue;
            for (const [dr, dc] of dirs) {
                const nr = cur.r + dr, nc = cur.c + dc;
                if (!isCellSafeForDino(nr, nc, sp.isBig)) continue;
                const edge = _edges.get(edgeKey(cur.r, cur.c, nr, nc));
                if (!edge || !edge.open) continue;
                const key = nr * GRID_SIZE + nc;
                if (!visited.has(key)) {
                    visited.add(key);
                    q.push({ r: nr, c: nc, d: cur.d + 1 });
                }
            }
        }

        const dino: CavernDino = {
            id: `DINO_${idx}`,
            species: sp.species,
            name: sp.name,
            isBig: sp.isBig,
            x: sx,
            z: sz,
            heading: 0,
            speed: sp.speed,
            baseSpeed: sp.speed,
            curR: sp.r,
            curC: sp.c,
            prevR: sp.r,
            prevC: sp.c,
            targetR: sp.r,
            targetC: sp.c,
            targetX: sx,
            targetZ: sz,
            stuckTimer: 0,
            walkCycle: rand() * 10,
            phase: rand() * Math.PI * 2,
            roarTimer: 0,
            spheres: rig.spheres,
            wallSpheres: rig.wallSpheres,
            homeCells,
            root: rig.root,
            headPivot: rig.headPivot,
            tailPivot: rig.tailPivot,
            legs: rig.legs
        };

        pickNextAdjacentDinoCell(dino, false);
        dino.heading = Math.atan2(dino.targetX - dino.x, dino.targetZ - dino.z);
        resolveDinoAgainstWorld(dino);

        rig.root.position.set(dino.x, 0, dino.z);
        rig.root.rotation.y = dino.heading;
        cavernWorldGroup.add(rig.root);
        _dinos.push(dino);
    });
}

// =========================================================================
// SCENE LAZY INIT & BUILD
// =========================================================================
function initExploredSet() {
    if (_exploredInitialized) return;
    _exploredInitialized = true;
    if (Array.isArray(progression.exploredCavernCells)) {
        progression.exploredCavernCells.forEach((id: number) => _exploredSet.add(id));
    }
}

function ensureBuilt() {
    if (_built) return;
    _built = true;
    initExploredSet();
    generateMaze();
    const rand = mulberry32(0x77129A);
    buildCavernArchitecture(rand);
    buildHiddenDiscoveries();
    buildGemsAndBoulders(rand);
    buildRoamingDinos(rand);
}

export function initUnderground(
    customRenderer?: THREE.WebGLRenderer,
    customCamera?: THREE.PerspectiveCamera,
    options?: {
        reparentSharedFX?: (targetScene: THREE.Scene) => void;
        getWaypointGroup?: () => THREE.Object3D | null;
    }
) {
    if (options?.reparentSharedFX) _reparentSharedFX = options.reparentSharedFX;
    if (options?.getWaypointGroup) _getWaypointGroup = options.getWaypointGroup;

    setUndergroundTerrainHooks({
        isActive: () => worldState.activeArea === 'UNDERGROUND',
        getSurfaceHeight: getUndergroundSurfaceHeight,
        isPointInWater: isUndergroundPointInWater,
        getZoneName: getUndergroundZoneName
    });

    // Defer building the 3D cavern scene until first drill entry so surface boot time stays instant;
    // but pre-generate the deterministic maze structure if needed for saves
    if (customRenderer && customCamera && progression.exploredCavernCells?.length > 0) {
        // Keep ready
    }
}

export function registerUndergroundFXCallbacks(
    reparentSharedFX: (targetScene: THREE.Scene) => void,
    getWaypointGroup: () => THREE.Object3D | null
) {
    _reparentSharedFX = reparentSharedFX;
    _getWaypointGroup = getWaypointGroup;
}

// =========================================================================
// COLLISION DETECTION (MAZE WALLS, CRACKED WALLS, BOULDERS & MULTI-SPHERE DINOS)
// =========================================================================
function pushOutAABB(
    pos: { x: number; z: number },
    radius: number,
    ax: number,
    az: number,
    halfX: number,
    halfZ: number
): boolean {
    const minX = ax - halfX;
    const maxX = ax + halfX;
    const minZ = az - halfZ;
    const maxZ = az + halfZ;
    const closestX = Math.max(minX, Math.min(maxX, pos.x));
    const closestZ = Math.max(minZ, Math.min(maxZ, pos.z));
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq >= radius * radius) return false;

    if (distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
    } else {
        // Inside AABB: push out along minimum penetration axis
        const penLeft = Math.abs(pos.x - minX);
        const penRight = Math.abs(maxX - pos.x);
        const penTop = Math.abs(pos.z - minZ);
        const penBottom = Math.abs(maxZ - pos.z);
        const m = Math.min(penLeft, penRight, penTop, penBottom);
        if (m === penLeft) pos.x = minX - radius;
        else if (m === penRight) pos.x = maxX + radius;
        else if (m === penTop) pos.z = minZ - radius;
        else pos.z = maxZ + radius;
    }
    return true;
}

function pushOutCircle(pos: { x: number; z: number }, pr: number, cx: number, cz: number, cr: number): { hit: boolean; nx: number; nz: number } {
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const minDist = pr + cr;
    const distSq = dx * dx + dz * dz;
    if (distSq >= minDist * minDist || distSq < 1e-8) return { hit: false, nx: 0, nz: 0 };
    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const nz = dz / dist;
    const overlap = minDist - dist;
    pos.x += nx * overlap;
    pos.z += nz * overlap;
    return { hit: true, nx, nz };
}

function resolveMazeWallAndProps(pos: { x: number; z: number }, radius: number) {
    // 1. Clamp inside outer perimeter walls
    const lim = HALF_WORLD - radius - 0.5;
    if (pos.x < -lim) pos.x = -lim;
    if (pos.x > lim) pos.x = lim;
    if (pos.z < -lim) pos.z = -lim;
    if (pos.z > lim) pos.z = lim;

    // 2. Check nearby cell wall edges (3x3 cell neighborhood)
    const { r: pr, c: pc } = worldToCell(pos.x, pos.z);
    for (let r = Math.max(0, pr - 1); r <= Math.min(GRID_SIZE - 1, pr + 1); r++) {
        for (let c = Math.max(0, pc - 1); c <= Math.min(GRID_SIZE - 1, pc + 1); c++) {
            const south = _edges.get(edgeKey(r, c, r + 1, c));
            if (south && !south.open && !(south.cracked && south.broken)) {
                pushOutAABB(pos, radius, south.x, south.z, south.halfX, south.halfZ);
            }
            const east = _edges.get(edgeKey(r, c, r, c + 1));
            if (east && !east.open && !(east.cracked && east.broken)) {
                pushOutAABB(pos, radius, east.x, east.z, east.halfX, east.halfZ);
            }
        }
    }

    // 3. Landmark static colliders & magma bridge safety guard
    for (let i = 0; i < _staticColliders.length; i++) {
        const sc = _staticColliders[i];
        pushOutCircle(pos, radius, sc.x, sc.z, sc.r);
    }

    // Keep players safely out of the open North & South magma lava basins flanking the basalt bridge
    pushOutAABB(pos, radius, MAGMA_CENTER.x, MAGMA_CENTER.z - 16.5, 22, 8.0);
    pushOutAABB(pos, radius, MAGMA_CENTER.x, MAGMA_CENTER.z + 16.5, 22, 8.0);
}

export function resolveUndergroundPointCollision(pos: { x: number; z: number }, radius: number) {
    if (!_built) return;
    resolveMazeWallAndProps(pos, radius);

    for (let i = 0; i < _boulders.length; i++) {
        const b = _boulders[i];
        if (!b.destroyed) pushOutCircle(pos, radius, b.x, b.z, b.r);
    }

    for (let i = 0; i < _dinos.length; i++) {
        const d = _dinos[i];
        const sinH = Math.sin(d.heading);
        const cosH = Math.cos(d.heading);
        for (let s = 0; s < d.spheres.length; s++) {
            const sp = d.spheres[s];
            pushOutCircle(pos, radius, d.x + sinH * sp.forward, d.z + cosH * sp.forward, sp.r);
        }
    }
}

export function resolveUndergroundCollisions(p: any, dt: number, now: number) {
    if (!_built) return;
    const playerRadius = (p.mode === 'VEHICLE') ? 2.8 : 2.4;

    resolveMazeWallAndProps(p.pos, playerRadius);

    // Intact Floor Boulders (Boulder destroys them if Scoop/Smash/Drill is active!)
    for (let i = 0; i < _boulders.length; i++) {
        const b = _boulders[i];
        if (b.destroyed) continue;
        const dx = p.pos.x - b.x;
        const dz = p.pos.z - b.z;
        const minDist = playerRadius + b.r;
        if (dx * dx + dz * dz < minDist * minDist) {
            if (p.botType === 'BOULDER' && (p.scoopTimer > 0 || p.smashTimer > 0 || p.drillEquipTimer > 0)) {
                shatterCavernBoulder(b);
            } else {
                pushOutCircle(p.pos, playerRadius, b.x, b.z, b.r);
            }
        }
    }

    // Roaming Dinosaurs: Full Multi-Sphere Solid Collision + Big Dino Playful Bump Nudge!
    if (p.dinoNudgeCooldown > 0) p.dinoNudgeCooldown = Math.max(0, p.dinoNudgeCooldown - dt);

    for (let i = 0; i < _dinos.length; i++) {
        const d = _dinos[i];
        const sinH = Math.sin(d.heading);
        const cosH = Math.cos(d.heading);

        for (let s = 0; s < d.spheres.length; s++) {
            const sp = d.spheres[s];
            const sx = d.x + sinH * sp.forward;
            const sz = d.z + cosH * sp.forward;
            const hit = pushOutCircle(p.pos, playerRadius, sx, sz, sp.r);
            if (hit.hit) {
                if (d.roarTimer <= 0) {
                    d.roarTimer = 2.4;
                    sfx.playDinoRoar(d.species === 'TREX' ? 'OPTIMUS' : (d.species === 'RAPTOR' ? 'BUMBLEBEE' : 'BOULDER'));
                }
                if (d.isBig && p.dinoNudgeCooldown <= 0) {
                    p.dinoNudgeCooldown = 1.1;
                    p.knockbackVx = hit.nx * 16.5;
                    p.knockbackVz = hit.nz * 16.5;
                    p.speed *= 0.35;
                    spawnBurstParticles(p.pos.x, p.pos.y + 1.4, p.pos.z, 0xfacc15, 10, 1.1);
                    if (!p._lastDinoNudgeToast || now - p._lastDinoNudgeToast > 4000) {
                        p._lastDinoNudgeToast = now;
                        showToast(`${d.name.toUpperCase()} NUDGE!`, `Whoa! That friendly giant gave you a playful dino bump!`);
                    }
                }
            }
        }
    }

    // Re-clamp against walls in case dino pushed player toward a wall
    resolveMazeWallAndProps(p.pos, playerRadius);
}

// =========================================================================
// BOULDER STRIKE (SMASH CRACKED WALLS / BOULDERS) & DINO GREETINGS
// =========================================================================
function shatterCavernBoulder(b: CavernBoulder) {
    if (b.destroyed) return;
    b.destroyed = true;
    b.mesh.visible = false;
    sfx.playRockBreak();
    spawnBurstParticles(b.x, 2.5, b.z, 0x94a3b8, 16, 1.4);
    spawnBurstParticles(b.x, 3.0, b.z, 0xfacc15, 8, 1.1);
}

function collectGem(gem: CavernGem) {
    if (gem.collected) return;
    gem.collected = true;
    gem.mesh.visible = false;
    sfx.playGemChime();
    spawnSparkleGlints(gem.x, 2.8, gem.z, 18);
    progression.cavernGemsCollected = (progression.cavernGemsCollected || 0) + 1;
    saveProgression();
    updateCavernHUD();
    showToast('CAVERN GEM COLLECTED!', `Subterranean Crystals Found: ${progression.cavernGemsCollected}`);
}

export function checkUndergroundBoulderStrike(x: number, y: number, z: number, heading: number) {
    if (!_built || worldState.activeArea !== 'UNDERGROUND') return;

    const hitX = x + Math.sin(heading) * 4.5;
    const hitZ = z + Math.cos(heading) * 4.5;

    // 1. Blast Cracked Breakable Rock Walls within 11m
    let brokeAnyWall = false;
    for (let i = 0; i < _crackedWalls.length; i++) {
        const cw = _crackedWalls[i];
        if (cw.broken) continue;
        const dist = Math.min(Math.hypot(x - cw.x, z - cw.z), Math.hypot(hitX - cw.x, hitZ - cw.z));
        // Wall spans ~14.5m half-width along its major axis
        const dx = Math.abs(x - cw.x);
        const dz = Math.abs(z - cw.z);
        const nearWall = cw.horizontal ? (dx < 16 && dz < 11.5) : (dz < 16 && dx < 11.5);
        if (dist < 13.5 || nearWall) {
            cw.broken = true;
            cw.edge.broken = true;
            cw.group.visible = false;
            brokeAnyWall = true;

            if (!Array.isArray(progression.brokenCavernWalls)) {
                progression.brokenCavernWalls = [];
            }
            if (!progression.brokenCavernWalls.includes(cw.id)) {
                progression.brokenCavernWalls.push(cw.id);
            }
            saveProgression();
            sfx.playRockCrack();
            spawnBurstParticles(cw.x, 4.0, cw.z, 0x94a3b8, 22, 1.8);
            spawnBurstParticles(cw.x, 4.5, cw.z, 0xfacc15, 16, 1.5);

            const isGalleryDoor = cw.id === edgeKey(10, 6, 11, 6);
            showToast(
                isGalleryDoor ? 'SECRET VAULT OPENED!' : 'SECRET TUNNEL OPENED!',
                isGalleryDoor
                    ? 'Boulder shattered the cracked wall into a secret glowing chamber!'
                    : 'Boulder blasted a brand new tunnel shortcut through solid rock!'
            );
            triggerNPCSpeech('BOULDER', 'Excavation Bot', 'Ha-ha! Nothing stands in the way of my rotary drill and dozer blade!', player, true);
        }
    }

    // 2. Shatter loose floor boulders within 10m
    for (let i = 0; i < _boulders.length; i++) {
        const b = _boulders[i];
        if (!b.destroyed && (Math.hypot(x - b.x, z - b.z) < 10.5 || Math.hypot(hitX - b.x, hitZ - b.z) < 9.5)) {
            shatterCavernBoulder(b);
        }
    }

    // 3. Collect nearby gems within 10m
    for (let i = 0; i < _gems.length; i++) {
        const g = _gems[i];
        if (!g.collected && Math.hypot(x - g.x, z - g.z) < 10.0) {
            collectGem(g);
        }
    }

    if (brokeAnyWall && typeof (window as any).renderMinimap === 'function') {
        (window as any).renderMinimap();
    }
}

export function triggerNearbyDinoReaction(x: number, z: number) {
    if (!_built || worldState.activeArea !== 'UNDERGROUND') return;
    for (let i = 0; i < _dinos.length; i++) {
        const d = _dinos[i];
        if (Math.hypot(x - d.x, z - d.z) < 22.0) {
            d.roarTimer = 2.0;
            d.heading = Math.atan2(x - d.x, z - d.z);
            sfx.playDinoRoar(d.species === 'TREX' ? 'OPTIMUS' : (d.species === 'RAPTOR' ? 'BUMBLEBEE' : 'BOULDER'));
            spawnSparkleGlints(d.x, 5.5, d.z, player.mode === 'DINO' ? 18 : 8);
            if (player.mode === 'DINO') {
                showToast('DINOBOT GREETING!', `${d.name} roared happily to your Dinobot Mode!`);
            } else {
                showToast('CAVERN DINOSAUR!', `${d.name} let out a booming subterranean roar!`);
            }
            break;
        }
    }
}

// =========================================================================
// CAMERA RAY CLAMPING (KEEPS THIRD-PERSON VIEW INSIDE TUNNELS)
// =========================================================================
export function getUndergroundCameraClamp(playerPos: THREE.Vector3, idealCamPos: THREE.Vector3) {
    if (!_built) return;
    // Clamp ceiling below roof plane (y = 30m world)
    idealCamPos.y = Math.min(24.5, Math.max(playerPos.y + 3.0, idealCamPos.y));

    const dx = idealCamPos.x - playerPos.x;
    const dz = idealCamPos.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.0) return;

    const steps = 8;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sx = playerPos.x + dx * t;
        const sz = playerPos.z + dz * t;

        // Outer boundary check
        if (Math.abs(sx) > HALF_WORLD - 2.5 || Math.abs(sz) > HALF_WORLD - 2.5) {
            const safeT = Math.max(0.28, (i - 1) / steps);
            idealCamPos.x = playerPos.x + dx * safeT;
            idealCamPos.z = playerPos.z + dz * safeT;
            return;
        }

        // Check wall intersections along camera sight ray
        const { r, c } = worldToCell(sx, sz);
        for (let rr = Math.max(0, r - 1); rr <= Math.min(GRID_SIZE - 1, r + 1); rr++) {
            for (let cc = Math.max(0, c - 1); cc <= Math.min(GRID_SIZE - 1, c + 1); cc++) {
                const south = _edges.get(edgeKey(rr, cc, rr + 1, cc));
                if (south && !south.open && !(south.cracked && south.broken)) {
                    if (Math.abs(sx - south.x) <= south.halfX + 1.5 && Math.abs(sz - south.z) <= south.halfZ + 1.5) {
                        const safeT = Math.max(0.32, (i - 1) / steps);
                        idealCamPos.x = playerPos.x + dx * safeT;
                        idealCamPos.z = playerPos.z + dz * safeT;
                        return;
                    }
                }
                const east = _edges.get(edgeKey(rr, cc, rr, cc + 1));
                if (east && !east.open && !(east.cracked && east.broken)) {
                    if (Math.abs(sx - east.x) <= east.halfX + 1.5 && Math.abs(sz - east.z) <= east.halfZ + 1.5) {
                        const safeT = Math.max(0.32, (i - 1) / steps);
                        idealCamPos.x = playerPos.x + dx * safeT;
                        idealCamPos.z = playerPos.z + dz * safeT;
                        return;
                    }
                }
            }
        }
    }
}

// =========================================================================
// BOULDER DRILL ANIMATION & SCENE SWAPPING
// =========================================================================
function ensureBoreholeDecal(targetScene: THREE.Scene) {
    if (!_boreholeDecal) {
        _boreholeDecal = new THREE.Group();
        const pit = new THREE.Mesh(
            new THREE.CircleGeometry(3.2, 20).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x05070e })
        );
        pit.position.y = 0.08;
        const rim = new THREE.Mesh(
            new THREE.RingGeometry(3.0, 4.4, 20).rotateX(-Math.PI / 2),
            new THREE.MeshToonMaterial({ color: 0x57534e, gradientMap: toonGrad3, side: THREE.DoubleSide })
        );
        rim.position.y = 0.10;
        const glow = new THREE.Mesh(
            new THREE.RingGeometry(1.6, 2.8, 20).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
        );
        glow.position.y = 0.09;
        _boreholeDecal.add(pit, rim, glow);
    }
    if (_boreholeDecal.parent !== targetScene) {
        targetScene.add(_boreholeDecal);
    }
    _boreholeDecal.visible = true;
}

function setTransitionOverlay(visible: boolean, direction: 'DOWN' | 'UP') {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('cavern-transition-overlay');
    const title = document.getElementById('cavern-transition-title');
    const sub = document.getElementById('cavern-transition-sub');
    const icon = document.getElementById('cavern-transition-icon');
    if (title) title.textContent = direction === 'DOWN' ? 'DRILLING INTO CAVERNS...' : 'DRILLING TO GRIFFIN ROCK...';
    if (sub) sub.textContent = direction === 'DOWN' ? 'Descending into Subterranean Tunnels' : 'Bursting back up to Island Surface';
    if (icon) icon.innerHTML = direction === 'DOWN' ? SVG_ICONS.DRILL : SVG_ICONS.DRILL_UP;
    if (overlay) {
        if (visible) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100');
        } else {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            overlay.classList.remove('opacity-100');
        }
    }
}

export function syncUndergroundBotRigs(oldBotType?: string, newBotType?: string) {
    if (!botRigs) return;
    if (worldState.activeArea === 'UNDERGROUND') {
        Object.keys(botRigs).forEach(k => {
            const rig = botRigs[k];
            if (!rig || !rig.root) return;
            const keepInUnderground = (k === player.botType || k === buddyBot.botType);
            if (keepInUnderground && rig.root.parent !== undergroundScene) {
                undergroundScene.add(rig.root);
            } else if (!keepInUnderground && rig.root.parent !== scene) {
                rig.root.visible = false;
                scene.add(rig.root);
            }
        });
    } else {
        Object.keys(botRigs).forEach(k => {
            const rig = botRigs[k];
            if (rig && rig.root && rig.root.parent !== scene) {
                scene.add(rig.root);
            }
        });
    }
}

export function updateCavernHUD() {
    if (typeof document === 'undefined') return;
    const pill = document.getElementById('cavern-hud-pill');
    const discEl = document.getElementById('cavern-stat-discoveries');
    const gemEl = document.getElementById('cavern-stat-gems');
    const exitEl = document.getElementById('cavern-exit-prompt');
    if (pill) {
        if (worldState.activeArea === 'UNDERGROUND') pill.classList.remove('hidden');
        else pill.classList.add('hidden');
    }
    const discCount = Array.isArray(progression.discoveredCavernLandmarks) ? progression.discoveredCavernLandmarks.length : 0;
    if (discEl) discEl.textContent = `${discCount} / ${CAVERN_DISCOVERIES.length}`;
    if (gemEl) gemEl.textContent = String(progression.cavernGemsCollected || 0);

    if (exitEl) {
        if (worldState.activeArea === 'UNDERGROUND' && worldState.nearExitShaft && !worldState.drillAnim?.active) {
            exitEl.classList.remove('hidden');
        } else {
            exitEl.classList.add('hidden');
        }
    }
}

export function swapToUnderground() {
    ensureBuilt();
    if (renderer && camera) {
        try {
            renderer.compile(undergroundScene, camera);
        } catch (e) {
            console.warn('Underground shader pre-compile skipped:', e);
        }
    }

    // Save exact surface coordinates to restore upon returning (unless captured pre-bore in startDrillAnimation)
    if (!worldState.drillAnim?.active) {
        worldState.savedSurfacePos.copy(player.pos);
        worldState.savedSurfaceHeading = player.heading;
    }
    worldState.activeArea = 'UNDERGROUND';
    worldState.hasVisitedUnderground = true;

    // Position player cleanly in the central Griffin Drill Shaft Hub (6, 6)
    player.pos.set(0, 1.0, 6);
    player.heading = Math.PI; // Facing deeper into north cavern corridors or open center
    player.speed = 0;
    player.vy = 0;
    player.flightAlt = 0;
    player.grounded = true;
    player.hasWaypoint = false;
    player.boatMorph = 0;
    player.targetBoatMorph = 0;
    player.knockbackVx = 0;
    player.knockbackVz = 0;

    if (buddyBot && buddyBot.pos) {
        buddyBot.pos.set(6, 1.0, 10);
        buddyBot.heading = Math.PI;
        buddyBot.speed = 0;
        buddyBot.flightAlt = 0;
    }

    syncUndergroundBotRigs();
    setActiveParticleScene(undergroundScene);
    if (_reparentSharedFX) _reparentSharedFX(undergroundScene);
    const wp = _getWaypointGroup ? _getWaypointGroup() : (window as any).waypointGroup;
    if (wp) wp.visible = false;

    if (_boreholeDecal) _boreholeDecal.visible = false;

    if (camera) {
        camera.position.set(0, 13, 30);
        camera.lookAt(0, 4.2, 6);
    }

    if (typeof document !== 'undefined') {
        const zEl = document.getElementById('zone-label');
        if (zEl) zEl.textContent = getUndergroundZoneName(player.pos.x, player.pos.z);
    }

    updateCavernHUD();
    if (typeof (window as any).syncHUDToActiveBot === 'function') (window as any).syncHUDToActiveBot();
    if (typeof (window as any).renderMinimap === 'function') (window as any).renderMinimap();
}

export function swapToSurface(immediate = false) {
    worldState.savedUndergroundPos.copy(player.pos);
    worldState.savedUndergroundHeading = player.heading;
    worldState.activeArea = 'SURFACE';
    worldState.nearExitShaft = false;

    const sx = worldState.savedSurfacePos?.x ?? 0;
    const sz = worldState.savedSurfacePos?.z ?? -15;
    const terrainSurfY = (window as any).getSurfaceHeight?.(sx, sz) ?? 5;
    const sy = Math.max(worldState.savedSurfacePos?.y ?? 5, terrainSurfY);
    player.pos.set(sx, sy, sz);
    player.heading = worldState.savedSurfaceHeading || 0;
    player.speed = 0;
    player.vy = 0;
    player.flightAlt = 0;
    player.grounded = true;
    player.hasWaypoint = false;
    player.boatMorph = 0;
    player.targetBoatMorph = 0;
    player.knockbackVx = 0;
    player.knockbackVz = 0;

    if (buddyBot && buddyBot.pos) {
        buddyBot.pos.set(sx - 6, sy, sz - 6);
        buddyBot.heading = player.heading;
        buddyBot.speed = 0;
        buddyBot.flightAlt = 0;
    }

    syncUndergroundBotRigs();
    setActiveParticleScene(scene);
    if (_reparentSharedFX) _reparentSharedFX(scene);
    const wp = _getWaypointGroup ? _getWaypointGroup() : (window as any).waypointGroup;
    if (wp) wp.visible = false;
    if (_boreholeDecal) _boreholeDecal.visible = false;

    if (immediate && camera) {
        camera.position.set(sx + Math.sin(player.heading) * 28, sy + 14, sz + Math.cos(player.heading) * 28);
        camera.lookAt(sx, sy + 3.2, sz);
    }

    if (typeof document !== 'undefined') {
        const zEl = document.getElementById('zone-label');
        if (zEl) zEl.textContent = getZoneName(sx, sz);
    }

    updateCavernHUD();
    if (typeof (window as any).syncHUDToActiveBot === 'function') (window as any).syncHUDToActiveBot();
    if (typeof (window as any).renderMinimap === 'function') (window as any).renderMinimap();
}

export function triggerBoulderDrillTransition() {
    if (_transitionLock || worldState.drillAnim?.active) return;

    if (player.botType !== 'BOULDER') {
        showToast('BOULDER REQUIRED', 'Switch to Boulder to use the rotary ground drill!');
        sfx.playSpeechPop();
        return;
    }

    if (worldState.activeArea === 'SURFACE') {
        // Check surface water via global terrain helper (never check underground lagoon coords on surface!)
        const isSurfaceWater = (window as any).isPointInWater?.(player.pos.x, player.pos.z);
        const surfY = (window as any).getSurfaceHeight?.(player.pos.x, player.pos.z) ?? player.pos.y;
        if (isSurfaceWater || player.targetBoatMorph > 0.3 || surfY < 0.25) {
            showToast('SOLID GROUND REQUIRED', 'Drive onto dry land before drilling into the underground caverns!');
            sfx.playSpeechPop();
            return;
        }
        // Revert from Dino mode to Bot or Vehicle so the rotary drill rig is mounted visibly
        if (player.mode === 'DINO') {
            player.mode = 'BOT';
            player.targetDinoMorph = 0;
            player.dinoMorph = 0;
            player.targetMorph = 0;
            player.morph = 0;
        }
        startDrillAnimation('DOWN');
    } else {
        if (isUndergroundPointInWater(player.pos.x, player.pos.z)) {
            showToast('SOLID CAVERN FLOOR REQUIRED', 'Steer out of the Crystal Lagoon before drilling back to the surface!');
            sfx.playSpeechPop();
            return;
        }
        if (player.mode === 'DINO') {
            player.mode = 'BOT';
            player.targetDinoMorph = 0;
            player.dinoMorph = 0;
            player.targetMorph = 0;
            player.morph = 0;
        }
        startDrillAnimation('UP');
    }
}

export function exitUndergroundViaShaft() {
    if (worldState.activeArea !== 'UNDERGROUND' || worldState.drillAnim?.active) return;
    _transitionLock = true;
    setTransitionOverlay(true, 'UP');
    sfx.playWarpWhoosh();
    setTimeout(() => {
        swapToSurface(true);
        setTransitionOverlay(false, 'UP');
        _transitionLock = false;
        showToast('BACK ON GRIFFIN ROCK!', 'Returned via Sunlit Cavern Exit Shaft!');
        triggerNPCSpeech('HEATWAVE', 'Rescue Bots Leader', 'Welcome back to the surface! Ready for island patrol!', player, true);
    }, 450);
}

function startDrillAnimation(direction: 'DOWN' | 'UP') {
    _transitionLock = true;
    if (direction === 'DOWN') {
        worldState.savedSurfacePos.copy(player.pos);
        worldState.savedSurfaceHeading = player.heading;
    }
    const anim = worldState.drillAnim;
    anim.active = true;
    anim.direction = direction;
    anim.timer = 0;
    anim.duration = 1.95;
    anim.swapped = false;
    anim.startX = player.pos.x;
    anim.startY = player.pos.y;
    anim.startZ = player.pos.z;
    anim.lastParticleTime = 0;

    player.hasWaypoint = false;
    player.speed = 0;
    player.drillEquipTimer = 2.0;

    // Show rotary auger drill immediately from frame 0
    const boulderRig = botRigs?.BOULDER;
    if (boulderRig) {
        const isVeh = player.mode === 'VEHICLE' || player.morph >= 0.5;
        if (boulderRig.botDrillAssembly) {
            boulderRig.botDrillAssembly.visible = !isVeh;
            if (!isVeh) boulderRig.botDrillAssembly.scale.setScalar(1.0);
        }
        if (boulderRig.vehDrillAssembly) {
            boulderRig.vehDrillAssembly.visible = isVeh;
            if (isVeh) boulderRig.vehDrillAssembly.scale.setScalar(1.22);
        }
    }

    ensureBoreholeDecal(worldState.activeArea === 'UNDERGROUND' ? undergroundScene : scene);
    if (_boreholeDecal) {
        _boreholeDecal.position.set(anim.startX, Math.max(0, anim.startY), anim.startZ);
        _boreholeDecal.scale.setScalar(0.55);
    }

    sfx.playDrillBore();
    if (direction === 'DOWN') {
        showToast('ROTARY DRILL ENGAGED!', 'Boulder is boring down into the Griffin Rock Caverns!');
        triggerNPCSpeech('BOULDER', 'Excavation Bot', 'Rotary auger online! Drilling straight down into the deep caverns!', player, true);
    } else {
        showToast('DRILLING TO SURFACE!', 'Boulder is punching back through the cavern roof!');
    }
}

export function updateDrillTransition(dt: number, now: number) {
    const anim = worldState.drillAnim;
    if (!anim || !anim.active) return;

    anim.timer += dt;
    const progress = Math.min(1.0, anim.timer / anim.duration);

    // Phase 1 (0 -> 0.58): Bore downward into ground with expanding borehole & rock bursts; fade overlay in around 0.48
    if (progress < 0.58) {
        const boreT = progress / 0.58;
        if (_boreholeDecal) {
            _boreholeDecal.scale.setScalar(0.2 + boreT * 1.15);
        }
        if (anim.direction === 'DOWN') {
            player.pos.set(anim.startX, anim.startY - boreT * 6.5, anim.startZ);
        } else {
            player.pos.set(anim.startX, anim.startY + boreT * 9.5, anim.startZ);
        }

        if (now - anim.lastParticleTime > 75) {
            anim.lastParticleTime = now;
            spawnBurstParticles(anim.startX, anim.startY + 0.6, anim.startZ, 0x78716c, 6, 1.3);
            spawnBurstParticles(anim.startX, anim.startY + 0.8, anim.startZ, 0xfacc15, 4, 1.0);
        }

        if (progress > 0.42) {
            setTransitionOverlay(true, anim.direction);
        }
    } else {
        // Phase 2 (0.58 -> 1.0): Swap active world behind faded overlay, then burst out!
        if (!anim.swapped) {
            anim.swapped = true;
            if (anim.direction === 'DOWN') {
                swapToUnderground();
            } else {
                swapToSurface(false);
            }
            anim.startX = player.pos.x;
            anim.startY = player.pos.y;
            anim.startZ = player.pos.z;
            ensureBoreholeDecal(worldState.activeArea === 'UNDERGROUND' ? undergroundScene : scene);
            if (_boreholeDecal) {
                _boreholeDecal.position.set(anim.startX, Math.max(0, anim.startY), anim.startZ);
                _boreholeDecal.scale.setScalar(1.25);
            }
            setTransitionOverlay(false, anim.direction);
            sfx.playRockCrack();
            spawnBurstParticles(anim.startX, anim.startY + 1.0, anim.startZ, 0x94a3b8, 16, 1.6);
            spawnSparkleGlints(anim.startX, anim.startY + 1.5, anim.startZ, 12);
        }

        const emergeT = (progress - 0.58) / 0.42;
        if (anim.direction === 'DOWN') {
            // Drop cleanly from cavern ceiling shaft onto floor
            player.pos.set(anim.startX, THREE.MathUtils.lerp(8.5, anim.startY, Math.min(1, emergeT * 1.25)), anim.startZ);
        } else {
            // Burst upward out of surface borehole onto Griffin Rock!
            player.pos.set(anim.startX, THREE.MathUtils.lerp(anim.startY - 4.5, anim.startY, Math.min(1, emergeT * 1.25)), anim.startZ);
        }
        if (_boreholeDecal) {
            _boreholeDecal.scale.setScalar(Math.max(0.05, 1.25 * (1.0 - emergeT)));
        }
    }

    if (progress >= 1.0) {
        anim.active = false;
        _transitionLock = false;
        player.pos.y = anim.startY;
        player.drillEquipTimer = 0.6;
        if (_boreholeDecal) _boreholeDecal.visible = false;

        if (worldState.activeArea === 'UNDERGROUND') {
            showToast('GRIFFIN ROCK CAVERNS!', 'Explore the maze, find 7 secrets & watch for roaming dinosaurs!');
        } else {
            showToast('BACK ON GRIFFIN ROCK!', 'Boulder emerged safely onto the island surface!');
        }
        updateCavernHUD();
    }
}

// =========================================================================
// PER-FRAME UNDERGROUND UPDATE (DINOS, GEMS, LANDMARKS, FOG-OF-WAR)
// =========================================================================
const _exploredSet = new Set<number>();
let _exploredInitialized = false;

function markCellsExplored(x: number, z: number) {
    initExploredSet();
    const { r, c } = worldToCell(x, z);
    let added = false;
    for (let rr = Math.max(0, r - 1); rr <= Math.min(GRID_SIZE - 1, r + 1); rr++) {
        for (let cc = Math.max(0, c - 1); cc <= Math.min(GRID_SIZE - 1, c + 1); cc++) {
            const idx = rr * GRID_SIZE + cc;
            if (!_exploredSet.has(idx)) {
                _exploredSet.add(idx);
                added = true;
            }
        }
    }
    if (added) {
        progression.exploredCavernCells = Array.from(_exploredSet);
        saveProgression();
    }
}

export function updateUnderground(dt: number, now: number) {
    if (!_built || worldState.activeArea !== 'UNDERGROUND') return;
    const nowSec = now * 0.001;

    // 1. Mark Fog-of-War explored maze cells
    markCellsExplored(player.pos.x, player.pos.z);

    // 2. Check Collectible Gem Pickup
    for (let i = 0; i < _gems.length; i++) {
        const gem = _gems[i];
        if (gem.collected) continue;
        gem.mesh.rotation.y += dt * 1.6;
        gem.mesh.position.y = Math.sin(nowSec * 3.0 + gem.phase) * 0.25;
        if (Math.hypot(player.pos.x - gem.x, player.pos.z - gem.z) < 4.6) {
            collectGem(gem);
        }
    }

    // 3. Animate Landmarks & Exit Shafts
    for (let i = 0; i < _animatedMeshes.length; i++) {
        const am = _animatedMeshes[i];
        if (am.kind === 'SPIN_PULSE') {
            am.obj.rotation.y += dt * 1.4;
            am.obj.position.y = am.baseY + Math.sin(nowSec * 2.8 + am.phase) * 0.5;
        } else if (am.kind === 'FLICKER') {
            const sc = 0.85 + Math.sin(nowSec * 14.0 + am.phase) * 0.15;
            am.obj.scale.setScalar(sc);
        } else if (am.kind === 'WATERFALL') {
            am.obj.scale.x = 0.96 + Math.sin(nowSec * 6.0) * 0.05;
            am.obj.scale.z = 0.96 + Math.cos(nowSec * 5.0) * 0.05;
        } else if (am.kind === 'LAVA_PULSE') {
            am.obj.position.y = am.baseY + Math.sin(nowSec * 2.5) * 0.12;
        }
    }

    let nearShaft = false;
    for (let i = 0; i < _exitShafts.length; i++) {
        const sh = _exitShafts[i];
        sh.ringMesh.rotation.z += dt * 1.2;
        if (Math.hypot(player.pos.x - sh.x, player.pos.z - sh.z) < 10.5) {
            nearShaft = true;
        }
    }
    if (worldState.nearExitShaft !== nearShaft) {
        worldState.nearExitShaft = nearShaft;
        updateCavernHUD();
    }

    // 4. Update Roaming Dinosaurs (Cell-to-cell patrol + full multi-sphere wall clearance)
    for (let i = 0; i < _dinos.length; i++) {
        const d = _dinos[i];
        if (d.roarTimer > 0) d.roarTimer = Math.max(0, d.roarTimer - dt);

        const cur = worldToCell(d.x, d.z);
        d.curR = cur.r;
        d.curC = cur.c;

        const manhattan = Math.abs(d.targetR - cur.r) + Math.abs(d.targetC - cur.c);
        const tEdge = manhattan === 1 ? _edges.get(edgeKey(cur.r, cur.c, d.targetR, d.targetC)) : undefined;
        const targetValid =
            (manhattan === 0 && isCellSafeForDino(d.targetR, d.targetC, d.isBig)) ||
            (manhattan === 1 && Boolean(tEdge && (tEdge.open || (tEdge.cracked && tEdge.broken))) && isCellSafeForDino(d.targetR, d.targetC, d.isBig));

        const preDist = Math.hypot(d.targetX - d.x, d.targetZ - d.z);
        if (!targetValid || preDist < 5.0) {
            pickNextAdjacentDinoCell(d, true);
        }

        const toTargetX = d.targetX - d.x;
        const toTargetZ = d.targetZ - d.z;
        const distTarget = Math.hypot(toTargetX, toTargetZ);
        const desiredHeading = distTarget > 0.25 ? Math.atan2(toTargetX, toTargetZ) : d.heading;

        let hDiff = desiredHeading - d.heading;
        while (hDiff < -Math.PI) hDiff += Math.PI * 2;
        while (hDiff > Math.PI) hDiff -= Math.PI * 2;
        const turnRate = (d.isBig ? 2.8 : 4.0) * dt;
        d.heading += Math.sign(hDiff) * Math.min(Math.abs(hDiff), turnRate);

        const turnThrottle = Math.max(0.12, Math.cos(Math.min(Math.PI * 0.5, Math.abs(hDiff))));
        const stepLen = d.speed * turnThrottle * dt;
        const prevX = d.x;
        const prevZ = d.z;
        d.x += Math.sin(d.heading) * stepLen;
        d.z += Math.cos(d.heading) * stepLen;

        resolveDinoAgainstWorld(d);

        const movedDist = Math.hypot(d.x - prevX, d.z - prevZ);
        if (stepLen > 0.01 && movedDist < stepLen * 0.25) {
            d.stuckTimer += dt;
            if (d.stuckTimer > 0.75) {
                d.stuckTimer = 0;
                pickNextAdjacentDinoCell(d, false);
            }
        } else {
            d.stuckTimer = Math.max(0, d.stuckTimer - dt * 2.0);
        }
    }

    // Gentle dino-to-dino separation followed by post-separation wall re-clamp
    for (let i = 0; i < _dinos.length; i++) {
        const d = _dinos[i];
        for (let j = i + 1; j < _dinos.length; j++) {
            const other = _dinos[j];
            const minSep = (d.isBig ? 5.2 : 2.8) + (other.isBig ? 5.2 : 2.8);
            const dx = d.x - other.x;
            const dz = d.z - other.z;
            const dSq = dx * dx + dz * dz;
            if (dSq < minSep * minSep && dSq > 1e-4) {
                const dist = Math.sqrt(dSq);
                const push = (minSep - dist) * 0.5;
                d.x += (dx / dist) * push;
                d.z += (dz / dist) * push;
                other.x -= (dx / dist) * push;
                other.z -= (dz / dist) * push;
                resolveDinoAgainstWorld(d);
                resolveDinoAgainstWorld(other);
            }
        }
    }

    // Apply resolved transforms & walk animation
    for (let i = 0; i < _dinos.length; i++) {
        const d = _dinos[i];
        d.walkCycle += dt * d.speed * 0.65;
        d.root.position.set(d.x, Math.abs(Math.sin(d.walkCycle)) * 0.28, d.z);
        d.root.rotation.y = d.heading;

        const legSwing = Math.sin(d.walkCycle) * 0.45;
        for (let l = 0; l < d.legs.length; l++) {
            d.legs[l].rotation.x = (l % 2 === 0 ? legSwing : -legSwing);
        }
        d.tailPivot.rotation.y = Math.sin(nowSec * 3.8 + d.phase) * 0.35;
        d.headPivot.rotation.x = (d.roarTimer > 0 ? -0.35 + Math.sin(nowSec * 18) * 0.15 : Math.sin(nowSec * 2.5 + d.phase) * 0.12);
    }

    // 5. Check 7 Hidden Landmarks Discovery
    for (let i = 0; i < CAVERN_DISCOVERIES.length; i++) {
        const disc = CAVERN_DISCOVERIES[i];
        if (Math.hypot(player.pos.x - disc.x, player.pos.z - disc.z) < disc.radius) {
            if (!Array.isArray(progression.discoveredCavernLandmarks)) {
                progression.discoveredCavernLandmarks = [];
            }
            if (!progression.discoveredCavernLandmarks.includes(disc.id)) {
                progression.discoveredCavernLandmarks.push(disc.id);
                if (disc.rewardCubes) {
                    progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + disc.rewardCubes;
                    player.energonBoostTimer = Math.max(player.energonBoostTimer || 0, 18.0);
                    spawnEnergonLightningParticles(player.pos.x, player.pos.y + 2, player.pos.z, 24);
                }
                saveProgression();
                updateCavernHUD();
                sfx.playCavernDiscovery();
                spawnSparkleGlints(disc.x, 5.0, disc.z, 24);
                spawnBurstParticles(disc.x, 5.0, disc.z, 0xfacc15, 18, 1.5);
                showToast(`DISCOVERY (${progression.discoveredCavernLandmarks.length}/${CAVERN_DISCOVERIES.length}): ${disc.name.toUpperCase()}`, disc.subtitle);
                triggerNPCSpeech(disc.speechSpeaker, disc.speechRole, disc.speechLine, player, true);
            }
        }
    }
}

// =========================================================================
// MAP DATA PROVIDER FOR SUBTERRANEAN SONAR & TACTICAL MAP
// =========================================================================
export function getUndergroundMapData() {
    if (!_built) ensureBuilt();
    return {
        gridSize: GRID_SIZE,
        cellSize: CELL_SIZE,
        halfWorld: HALF_WORLD,
        edges: _edges,
        crackedWalls: _crackedWalls,
        discoveries: CAVERN_DISCOVERIES,
        dinos: _dinos,
        exitShafts: _exitShafts,
        gems: _gems,
        lagoon: LAGOON_CENTER,
        magma: MAGMA_CENTER,
        exploredSet: _exploredSet
    };
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        undergroundScene,
        triggerBoulderDrillTransition,
        exitUndergroundViaShaft,
        swapToUnderground,
        swapToSurface,
        getUndergroundMapData
    });
}

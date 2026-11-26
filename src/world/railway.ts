// Griffin Rock Island Railway Circuit & "The Griffin Rock Express" Train System
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight, getRailwayRadius, isPointOnRoad, setRailwayBridgeHeightHook, RAILWAY_LOOP_RADIUS } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';
import { registerCullableObject, player } from '../state/gameState.js';
import { mergeStaticMeshesInGroup, freezeStaticHierarchy } from '../rendering/meshOptimizer.js';
import { createRoadRibbon } from './roads.js';
import { sfx } from '../audio/soundFX.js';
import {
    matCrossRedOff,
    matCrossRedOn,
    makeTrainFlangedWheel,
    makeTrainBogie,
    buildRailroadCrossingMesh,
    buildCentralRailwayStationMesh,
    buildTrainLocomotiveMesh,
    buildTrainTenderMesh,
    buildTrainCommuterCoachMesh,
    buildTrainDomeCoachMesh,
    buildTrainDiningCoachMesh,
    buildTrainFlatcarMesh,
    buildTrainCabooseMesh
} from './railwayModels.js';

export { makeTrainFlangedWheel, makeTrainBogie };

export interface RailroadCrossingLamp {
    mesh: THREE.Mesh;
    phase: number;
}

export interface RailroadCrossingEntry {
    x: number;
    z: number;
    gy: number;
    isNSHighway: boolean;
    lamps: RailroadCrossingLamp[];
    isFlashing: boolean;
    group?: THREE.Group;
}

export interface TrainCarEntry {
    name: string;
    root: THREE.Group;
    length: number;
    halfLength: number;
    width: number;
    halfWidth: number;
    height: number;
    mass: number;
    offset: number;
    wheelRadius: number;
    wheels: THREE.Object3D[];
    connectingRods?: THREE.Object3D[];
    x: number;
    y: number;
    z: number;
    heading: number;
    pitch: number;
}

export interface IslandTrainState {
    cars: TrainCarEntry[];
    progress: number;
    speed: number;
    chugTimer: number;
    bellTimer: number;
    whistleCooldown: number;
    steamTimer: number;
}

export interface RailwayPoint {
    x: number;
    z: number;
    dist: number;
    theta: number;
}

interface TrainSteamPuff {
    mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshToonMaterial>;
    active: boolean;
    life: number;
    maxLife: number;
    startScale: number;
    endScale: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
}

export let railroadCrossings: RailroadCrossingEntry[] = [];
export let centralStationGroup: THREE.Group | null = null;
export let islandTrain: IslandTrainState = {
    cars: [],
    progress: 350.0,
    speed: 18.5,
    chugTimer: 0,
    bellTimer: 0,
    whistleCooldown: 0,
    steamTimer: 0
};
export let railwayLoopMesh: THREE.Mesh | null = null;

        /***********************************************************************
         * 5C. GRIFFIN ROCK ISLAND RAILWAY CIRCUIT & CENTRAL STATION
         ***********************************************************************/
export function makeProceduralRailTrackTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;

    // 1. Granite/Gravel Ballast Roadbed Base (#334155 / #475569)
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    // Ballast stone texture aggregate speckles
    ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
    for (let i = 0; i < 550; i++) {
        ctx.fillRect((i * 197.3) % 512, (i * 311.7) % 512, 3, 3);
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    for (let i = 0; i < 550; i++) {
        ctx.fillRect((i * 131.9) % 512, (i * 241.1) % 512, 3, 3);
    }

    // Ballast tapered shoulders with subtle shading
    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    ctx.fillRect(0, 0, 36, 512);
    ctx.fillRect(476, 0, 36, 512);

    // 2. Heavy Timber Railroad Ties (Sleepers) spaced every 32px along V
    for (let y = 0; y < 512; y += 32) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
        ctx.fillRect(52, y + 20, 408, 6);
        ctx.fillStyle = '#2d1810';
        ctx.fillRect(56, y + 4, 400, 18);
        ctx.fillStyle = '#452618';
        ctx.fillRect(58, y + 6, 396, 6);
        [176, 336].forEach(rx => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(rx - 18, y + 2, 36, 22);
            ctx.fillStyle = '#475569';
            ctx.fillRect(rx - 15, y + 4, 30, 18);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(rx - 12, y + 6, 4, 4);
            ctx.fillRect(rx + 8, y + 6, 4, 4);
            ctx.fillRect(rx - 12, y + 14, 4, 4);
            ctx.fillRect(rx + 8, y + 14, 4, 4);
        });
    }

    // 3. Continuous Gleaming Dual Steel Rails
    [176, 336].forEach(rx => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(rx - 12, 0, 24, 512);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(rx - 8, 0, 16, 512);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(rx - 5, 0, 10, 512);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 2, 0, 4, 512);
    });

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = (typeof window !== 'undefined' && window.renderer && window.renderer.capabilities) ? window.renderer.capabilities.getMaxAnisotropy() : 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
}

export let sharedRailTrackTexture: THREE.Texture | null = null;
export let ptsRailway: RailwayPoint[] = [];
export let railwayTotalDist = 0;
export let railwayMesh: THREE.Mesh | null = null;

const railwaySteps = 540;
let prevRailPt: { x: number; z: number } | null = null;
for (let i = 0; i < railwaySteps; i++) {
    const theta = (i / railwaySteps) * Math.PI * 2;
    const r = getRailwayRadius(theta);
    const rx = Math.cos(theta) * r;
    const rz = Math.sin(theta) * r;
    if (i > 0 && prevRailPt) {
        railwayTotalDist += Math.hypot(rx - prevRailPt.x, rz - prevRailPt.z);
    }
    ptsRailway.push({ x: rx, z: rz, dist: railwayTotalDist, theta });
    prevRailPt = { x: rx, z: rz };
}
if (prevRailPt) {
    railwayTotalDist += Math.hypot(ptsRailway[0].x - prevRailPt.x, ptsRailway[0].z - prevRailPt.z);
}

export function getTrackPointAtDist(targetDist: number) {
    const d = ((targetDist % railwayTotalDist) + railwayTotalDist) % railwayTotalDist;
    let low = 0, high = ptsRailway.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (ptsRailway[mid].dist < d) low = mid + 1;
        else high = mid - 1;
    }
    const idx = Math.max(0, Math.min(ptsRailway.length - 2, high));
    const p0 = ptsRailway[idx];
    const p1 = ptsRailway[idx + 1] || ptsRailway[0];
    const segLen = (p1.dist > p0.dist ? p1.dist - p0.dist : (railwayTotalDist - p0.dist)) || 0.001;
    const t = Math.max(0, Math.min(1, (d - p0.dist) / segLen));
    return {
        x: p0.x + (p1.x - p0.x) * t,
        z: p0.z + (p1.z - p0.z) * t
    };
}

export type RailTrackId =
    | 'MAIN_LOOP'
    | 'TOWN_LOOP'
    | 'SKY_PEAK_LOOP'
    | 'VOLCANO_LOOP'
    | 'HARBOR_LOOP'
    | 'MAINLAND_SPUR';

export interface RailTrackDef {
    id: RailTrackId;
    name: string;
    closed: boolean;
    colorHex: string;
    pts: Array<{ x: number; y: number; z: number; dist: number }>;
    totalDist: number;
}

export interface RailSwitchDef {
    id: string;
    name: string;
    mainTrackId: RailTrackId;
    mainDist: number;
    branchTrackId: RailTrackId;
    branchDist: number;
    branchLabel: string;
    x: number;
    z: number;
    heading: number;
    divert: boolean;
    lanternMat?: THREE.MeshBasicMaterial;
    arrowPivot?: THREE.Group;
}

export interface NearestRailwayResult {
    trackId: RailTrackId;
    distOnTrack: number;
    x: number;
    z: number;
    heading: number;
    distanceToTrack: number;
}

function computeSmoothedTrackElevations(
    rawPts: Array<{ x: number; z: number; dist: number }>,
    closed: boolean,
    pinJunctionY?: number
): Array<{ x: number; y: number; z: number; dist: number }> {
    const n = rawPts.length;
    const rawY = new Float64Array(n);
    const smoothY = new Float64Array(n);
    const totalLen = n > 0 ? rawPts[n - 1].dist : 1;
    const halfW = 7.6;
    for (let i = 0; i < n; i++) {
        const p = rawPts[i];
        const prev = rawPts[(i - 1 + n) % n];
        const next = rawPts[(i + 1) % n];
        const tx = (!closed && i === 0) ? (next.x - p.x) : ((!closed && i === n - 1) ? (p.x - prev.x) : (next.x - prev.x));
        const tz = (!closed && i === 0) ? (next.z - p.z) : ((!closed && i === n - 1) ? (p.z - prev.z) : (next.z - prev.z));
        const len = Math.hypot(tx, tz) || 1;
        const nx = -tz / len;
        const nz = tx / len;

        // Sample full track width (center + both edges + forward midpoint) so hillside cross-slopes never poke through!
        const gyCenter = getSurfaceHeight(p.x, p.z);
        const gyL = getSurfaceHeight(p.x - nx * halfW, p.z - nz * halfW);
        const gyR = getSurfaceHeight(p.x + nx * halfW, p.z + nz * halfW);
        const mx = 0.5 * (p.x + next.x);
        const mz = 0.5 * (p.z + next.z);
        const gyMid = (!closed && i === n - 1) ? gyCenter : getSurfaceHeight(mx, mz);
        const gyMax = Math.max(gyCenter, gyL, gyR, gyMid) + 0.22;

        rawY[i] = gyMax;
        // Over any lake, pond, or water inlet (gyCenter < 2.2), elevate track onto a +3.8m water bridge!
        smoothY[i] = gyCenter < 2.2 ? Math.max(3.8, gyMax) : gyMax;
    }

    const isPinnedJunction = (i: number): boolean => {
        if (pinJunctionY === undefined) return false;
        const d = rawPts[i].dist;
        return d < 52 || (closed && totalLen - d < 52);
    };

    // Pin branch junction lead-in/lead-out flush to MAIN_LOOP elevation so switches are 100% level!
    if (pinJunctionY !== undefined) {
        for (let i = 0; i < n; i++) {
            if (isPinnedJunction(i)) {
                smoothY[i] = pinJunctionY;
                rawY[i] = pinJunctionY;
            }
        }
    }

    // Upper-envelope bridge relaxation: lifts track smoothly across steep canyons, lakes & road cuts
    // without ever lifting pinned junction throats!
    const iters = 48;
    for (let it = 0; it < iters; it++) {
        for (let i = 0; i < n; i++) {
            if ((!closed && (i === 0 || i === n - 1)) || isPinnedJunction(i)) continue;
            const prevIdx = (i - 1 + n) % n;
            const nextIdx = (i + 1) % n;
            const chordY = 0.5 * (smoothY[prevIdx] + smoothY[nextIdx]);
            if (chordY > smoothY[i]) {
                smoothY[i] = chordY;
            }
        }
    }
    // Light smoothing pass to round bridge approaches while keeping junctions pinned & water >= 3.8m
    for (let s = 0; s < 3; s++) {
        const copy = Float64Array.from(smoothY);
        for (let i = 0; i < n; i++) {
            if ((!closed && (i === 0 || i === n - 1)) || isPinnedJunction(i)) continue;
            const prevIdx = (i - 1 + n) % n;
            const nextIdx = (i + 1) % n;
            const minElev = rawY[i] < 2.2 ? 3.8 : rawY[i];
            smoothY[i] = Math.max(minElev, 0.25 * copy[prevIdx] + 0.5 * copy[i] + 0.25 * copy[nextIdx]);
        }
    }
    return rawPts.map((p, i) => ({ x: p.x, y: smoothY[i], z: p.z, dist: p.dist }));
}

function sampleCatmullTrack(
    id: RailTrackId,
    name: string,
    colorHex: string,
    controlPts: Array<[number, number]>,
    closed: boolean,
    samples: number,
    pinJunctionY?: number
): RailTrackDef {
    const vecs = controlPts.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(vecs, closed, 'centripetal', 0.5);
    const rawPts: Array<{ x: number; z: number; dist: number }> = [];
    let totalDist = 0;
    let prev: THREE.Vector3 | null = null;
    const count = closed ? samples : samples + 1;
    for (let i = 0; i < count; i++) {
        const u = i / samples;
        const p = curve.getPoint(Math.min(1, u));
        if (prev) {
            totalDist += Math.hypot(p.x - prev.x, p.z - prev.z);
        }
        rawPts.push({ x: p.x, z: p.z, dist: totalDist });
        prev = p;
    }
    if (closed && prev && rawPts.length > 0) {
        totalDist += Math.hypot(rawPts[0].x - prev.x, rawPts[0].z - prev.z);
    }
    const pts = computeSmoothedTrackElevations(rawPts, closed, pinJunctionY);
    return { id, name, closed, colorHex, pts, totalDist };
}

function getMainDistForTheta(theta: number): number {
    const norm = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const idx = Math.floor((norm / (Math.PI * 2)) * ptsRailway.length) % ptsRailway.length;
    return ptsRailway[idx].dist;
}

function makeTangentControl(mainDist: number, aheadMeters: number): [number, number] {
    const p = getTrackPointAtDist(mainDist + aheadMeters);
    return [p.x, p.z];
}

function makeOffsetFromMain(mainDist: number, alongMeters: number, radialOffsetMeters: number): [number, number] {
    const p = getTrackPointAtDist(mainDist + alongMeters);
    const r = Math.hypot(p.x, p.z) || 1;
    return [p.x + (p.x / r) * radialOffsetMeters, p.z + (p.z / r) * radialOffsetMeters];
}

// Compute exact junction points on MAIN_LOOP for all 4 branch loops + Mainland Mountain Tunnel Spur
const TOWN_JCT_DIST = getMainDistForTheta(0.42 * Math.PI);
const HARBOR_JCT_DIST = getMainDistForTheta(0.58 * Math.PI);
const VOLCANO_JCT_DIST = getMainDistForTheta(1.22 * Math.PI);
const MAINLAND_JCT_DIST = getMainDistForTheta(1.33 * Math.PI);
const SKY_PEAK_JCT_DIST = getMainDistForTheta(1.74 * Math.PI);

const _mainLoopPts = computeSmoothedTrackElevations(ptsRailway.map(p => ({ x: p.x, z: p.z, dist: p.dist })), true);
function getMainLoopYAtDist(dist: number): number {
    const d = ((dist % railwayTotalDist) + railwayTotalDist) % railwayTotalDist;
    const idx = Math.min(_mainLoopPts.length - 1, Math.max(0, Math.floor((d / railwayTotalDist) * _mainLoopPts.length)));
    return _mainLoopPts[idx].y;
}

export const RAIL_TRACKS: Record<RailTrackId, RailTrackDef> = {
    MAIN_LOOP: {
        id: 'MAIN_LOOP',
        name: 'Griffin Rock Grand Circuit',
        closed: true,
        colorHex: '#f59e0b',
        pts: _mainLoopPts,
        totalDist: railwayTotalDist
    },
    TOWN_LOOP: sampleCatmullTrack(
        'TOWN_LOOP',
        'Town Center Inner Loop',
        '#38bdf8',
        [
            makeOffsetFromMain(TOWN_JCT_DIST, 0, 0),
            makeOffsetFromMain(TOWN_JCT_DIST, 45, 0),
            makeOffsetFromMain(TOWN_JCT_DIST, 110, -45),
            [-220, 420],
            [-330, 90],
            [-260, -245],
            [0, -345],
            [260, -235],
            [330, 120],
            [260, 440],
            makeOffsetFromMain(TOWN_JCT_DIST, -110, -45),
            makeOffsetFromMain(TOWN_JCT_DIST, -45, 0)
        ],
        true,
        360,
        getMainLoopYAtDist(TOWN_JCT_DIST)
    ),
    HARBOR_LOOP: sampleCatmullTrack(
        'HARBOR_LOOP',
        'South Harbor Coastal Loop',
        '#22d3ee',
        [
            makeOffsetFromMain(HARBOR_JCT_DIST, 0, 0),
            makeOffsetFromMain(HARBOR_JCT_DIST, 45, 0),
            makeOffsetFromMain(HARBOR_JCT_DIST, 110, 45),
            [-320, 840],
            [-160, 975],
            [75, 980],
            [225, 845],
            makeOffsetFromMain(HARBOR_JCT_DIST, -110, 45),
            makeOffsetFromMain(HARBOR_JCT_DIST, -45, 0)
        ],
        true,
        240,
        getMainLoopYAtDist(HARBOR_JCT_DIST)
    ),
    VOLCANO_LOOP: sampleCatmullTrack(
        'VOLCANO_LOOP',
        'Dino Ridge & Volcano Loop',
        '#f97316',
        [
            makeOffsetFromMain(VOLCANO_JCT_DIST, 0, 0),
            makeOffsetFromMain(VOLCANO_JCT_DIST, 45, 0),
            makeOffsetFromMain(VOLCANO_JCT_DIST, 110, 48),
            [-560, -785],
            [-735, -960],
            [-925, -915],
            [-940, -715],
            [-750, -545],
            makeOffsetFromMain(VOLCANO_JCT_DIST, -110, 48),
            makeOffsetFromMain(VOLCANO_JCT_DIST, -45, 0)
        ],
        true,
        260,
        getMainLoopYAtDist(VOLCANO_JCT_DIST)
    ),
    SKY_PEAK_LOOP: sampleCatmullTrack(
        'SKY_PEAK_LOOP',
        'Sky Array Mountain Loop',
        '#a855f7',
        [
            makeOffsetFromMain(SKY_PEAK_JCT_DIST, 0, 0),
            makeOffsetFromMain(SKY_PEAK_JCT_DIST, 45, 0),
            makeOffsetFromMain(SKY_PEAK_JCT_DIST, 110, 48),
            [795, -560],
            [935, -765],
            [835, -970],
            [595, -930],
            [475, -755],
            makeOffsetFromMain(SKY_PEAK_JCT_DIST, -110, 48),
            makeOffsetFromMain(SKY_PEAK_JCT_DIST, -45, 0)
        ],
        true,
        260,
        getMainLoopYAtDist(SKY_PEAK_JCT_DIST)
    ),
    MAINLAND_SPUR: sampleCatmullTrack(
        'MAINLAND_SPUR',
        'Mainland Tunnel Mountain Spur',
        '#34d399',
        [
            makeOffsetFromMain(MAINLAND_JCT_DIST, 0, 0),
            makeOffsetFromMain(MAINLAND_JCT_DIST, 45, 0),
            makeOffsetFromMain(MAINLAND_JCT_DIST, 105, 45),
            [-335, -840],
            [-385, -935]
        ],
        false,
        120,
        getMainLoopYAtDist(MAINLAND_JCT_DIST)
    )
};

function makeSwitchDef(
    id: string,
    name: string,
    mainDist: number,
    branchTrackId: RailTrackId,
    branchLabel: string,
    defaultDivert = false
): RailSwitchDef {
    const p = getTrackPointAtDist(mainDist);
    const pFwd = getTrackPointAtDist(mainDist + 3.0);
    return {
        id,
        name,
        mainTrackId: 'MAIN_LOOP',
        mainDist,
        branchTrackId,
        branchDist: 0,
        branchLabel,
        x: p.x,
        z: p.z,
        heading: Math.atan2(pFwd.x - p.x, pFwd.z - p.z),
        divert: defaultDivert
    };
}

export const RAIL_SWITCHES: RailSwitchDef[] = [
    makeSwitchDef('SW_TOWN', 'Town Center Switch', TOWN_JCT_DIST, 'TOWN_LOOP', 'TOWN LOOP'),
    makeSwitchDef('SW_HARBOR', 'South Harbor Switch', HARBOR_JCT_DIST, 'HARBOR_LOOP', 'HARBOR LOOP'),
    makeSwitchDef('SW_VOLCANO', 'Dino Volcano Switch', VOLCANO_JCT_DIST, 'VOLCANO_LOOP', 'VOLCANO LOOP'),
    makeSwitchDef('SW_MAINLAND', 'Mainland Tunnel Switch', MAINLAND_JCT_DIST, 'MAINLAND_SPUR', 'MAINLAND TUNNEL'),
    makeSwitchDef('SW_SKYPEAK', 'Sky Peak Switch', SKY_PEAK_JCT_DIST, 'SKY_PEAK_LOOP', 'SKY PEAK LOOP')
];

export function getTrackPointOnTrack(trackId: RailTrackId, targetDist: number) {
    const track = RAIL_TRACKS[trackId] || RAIL_TRACKS.MAIN_LOOP;
    const pts = track.pts;
    const len = track.totalDist || 1;
    const d = track.closed
        ? ((targetDist % len) + len) % len
        : Math.max(0, Math.min(len, targetDist));
    let low = 0;
    let high = pts.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (pts[mid].dist < d) low = mid + 1;
        else high = mid - 1;
    }
    const idx = Math.max(0, Math.min(pts.length - 2, high));
    const p0 = pts[idx];
    const p1 = track.closed ? (pts[idx + 1] || pts[0]) : pts[Math.min(pts.length - 1, idx + 1)];
    const segLen = (p1.dist > p0.dist ? p1.dist - p0.dist : (len - p0.dist)) || 0.001;
    const t = Math.max(0, Math.min(1, (d - p0.dist) / segLen));
    return {
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t,
        z: p0.z + (p1.z - p0.z) * t
    };
}

export function getTrackPoseOnTrack(trackId: RailTrackId, targetDist: number, dir = 1) {
    const track = RAIL_TRACKS[trackId] || RAIL_TRACKS.MAIN_LOOP;
    const sign = dir >= 0 ? 1 : -1;
    const p = getTrackPointOnTrack(trackId, targetDist);
    const fwdDist = track.closed ? targetDist + 2.5 * sign : Math.max(0, Math.min(track.totalDist, targetDist + 2.5 * sign));
    const bwdDist = track.closed ? targetDist - 2.5 * sign : Math.max(0, Math.min(track.totalDist, targetDist - 2.5 * sign));
    const pFwd = getTrackPointOnTrack(trackId, fwdDist);
    const pBwd = getTrackPointOnTrack(trackId, bwdDist);
    const heading = Math.atan2(pFwd.x - pBwd.x, pFwd.z - pBwd.z);
    const pitch = Math.atan2(pFwd.y - pBwd.y, Math.max(1.0, Math.hypot(pFwd.x - pBwd.x, pFwd.z - pBwd.z)));
    return {
        x: p.x,
        y: p.y + 0.22,
        z: p.z,
        heading,
        pitch
    };
}

export function getUpcomingRailSwitch(
    trackId: RailTrackId,
    trackDist: number,
    trackDir: number,
    maxAhead = Infinity
): { sw: RailSwitchDef; distAhead: number; onBranch: boolean } | null {
    const track = RAIL_TRACKS[trackId] || RAIL_TRACKS.MAIN_LOOP;
    const len = track.totalDist || 1;
    const sign = trackDir >= 0 ? 1 : -1;
    let best: { sw: RailSwitchDef; distAhead: number; onBranch: boolean } | null = null;

    for (let i = 0; i < RAIL_SWITCHES.length; i++) {
        const sw = RAIL_SWITCHES[i];
        let jctDist = -1;
        let onBranch = false;
        if (trackId === sw.mainTrackId) {
            jctDist = sw.mainDist;
            onBranch = false;
        } else if (trackId === sw.branchTrackId) {
            jctDist = sw.branchDist;
            onBranch = true;
        } else {
            continue;
        }

        let ahead = (jctDist - trackDist) * sign;
        if (track.closed) {
            ahead = ((ahead % len) + len) % len;
        }
        if (ahead >= 0 && ahead <= maxAhead) {
            if (!best || ahead < best.distAhead) {
                best = { sw, distAhead: ahead, onBranch };
            }
        }
    }
    return best;
}

export function toggleRailSwitch(switchId: string): RailSwitchDef | null {
    const sw = RAIL_SWITCHES.find(s => s.id === switchId);
    if (!sw) return null;
    sw.divert = !sw.divert;
    if (sw.lanternMat) {
        sw.lanternMat.color.setHex(sw.divert ? 0xfacc15 : 0x22c55e);
    }
    if (sw.arrowPivot) {
        sw.arrowPivot.rotation.y = sw.divert ? 0.55 : 0;
    }
    sfx.playCrossingBell();
    return sw;
}

export function findNearestRailwayPoint(wx: number, wz: number): NearestRailwayResult {
    let bestTrackId: RailTrackId = 'MAIN_LOOP';
    let bestDistSq = Infinity;
    let bestArcDist = 0;
    let bestX = 0;
    let bestZ = 0;
    let bestHeading = 0;

    const trackIds = Object.keys(RAIL_TRACKS) as RailTrackId[];
    for (let ti = 0; ti < trackIds.length; ti++) {
        const track = RAIL_TRACKS[trackIds[ti]];
        const pts = track.pts;
        const n = track.closed ? pts.length : pts.length - 1;
        for (let i = 0; i < n; i++) {
            const p0 = pts[i];
            const p1 = pts[(i + 1) % pts.length];
            const sx = p1.x - p0.x;
            const sz = p1.z - p0.z;
            const segLenSq = sx * sx + sz * sz || 1e-6;
            const t = Math.max(0, Math.min(1, ((wx - p0.x) * sx + (wz - p0.z) * sz) / segLenSq));
            const px = p0.x + sx * t;
            const pz = p0.z + sz * t;
            const dx = wx - px;
            const dz = wz - pz;
            const dSq = dx * dx + dz * dz;
            if (dSq < bestDistSq) {
                bestTrackId = track.id;
                bestDistSq = dSq;
                const segLen = Math.sqrt(segLenSq);
                bestArcDist = track.closed ? (p0.dist + segLen * t) % track.totalDist : (p0.dist + segLen * t);
                bestX = px;
                bestZ = pz;
                bestHeading = Math.atan2(sx, sz);
            }
        }
    }

    return {
        trackId: bestTrackId,
        distOnTrack: bestArcDist,
        x: bestX,
        z: bestZ,
        heading: bestHeading,
        distanceToTrack: Math.sqrt(bestDistSq)
    };
}

export function isPointNearAnyRailway(x: number, z: number, margin = 17.0): boolean {
    // Also clear trees/rocks from the Mainland Tunnel Mountain Cliff massif
    if (Math.hypot(x - RAIL_TUNNEL_PORTAL_POS.x, z - RAIL_TUNNEL_PORTAL_POS.z) < 48.0) {
        return true;
    }
    const marginSq = margin * margin;
    const trackIds = Object.keys(RAIL_TRACKS) as RailTrackId[];
    for (let ti = 0; ti < trackIds.length; ti++) {
        const track = RAIL_TRACKS[trackIds[ti]];
        const pts = track.pts;
        const n = track.closed ? pts.length : pts.length - 1;
        for (let i = 0; i < n; i++) {
            const p0 = pts[i];
            const p1 = pts[(i + 1) % pts.length];
            const sx = p1.x - p0.x;
            const sz = p1.z - p0.z;
            const segLenSq = sx * sx + sz * sz || 1e-6;
            const t = Math.max(0, Math.min(1, ((x - p0.x) * sx + (z - p0.z) * sz) / segLenSq));
            const dx = x - (p0.x + sx * t);
            const dz = z - (p0.z + sz * t);
            if (dx * dx + dz * dz < marginSq) return true;
        }
    }
    return false;
}

export function isNearRailwayTrack(wx: number, wz: number, maxDist = 26.0): boolean {
    if (typeof window !== 'undefined' && window.worldState && window.worldState.activeArea !== 'SURFACE') {
        return false;
    }
    return findNearestRailwayPoint(wx, wz).distanceToTrack <= maxDist;
}

export function getRailwayPoseAtDist(targetDist: number, dir = 1) {
    const sign = dir >= 0 ? 1 : -1;
    const p = getTrackPointAtDist(targetDist);
    const pFwd = getTrackPointAtDist(targetDist + 2.5 * sign);
    const pBwd = getTrackPointAtDist(targetDist - 2.5 * sign);
    const heading = Math.atan2(pFwd.x - pBwd.x, pFwd.z - pBwd.z);
    const groundY = getSurfaceHeight(p.x, p.z);
    const yFwd = getSurfaceHeight(pFwd.x, pFwd.z);
    const yBwd = getSurfaceHeight(pBwd.x, pBwd.z);
    const pitch = Math.atan2(yFwd - yBwd, 5.0);
    return {
        x: p.x,
        y: groundY + 0.22,
        z: p.z,
        heading,
        pitch
    };
}

// Mainland Express Rail Tunnel Portal embedded right against the NW Mountain Cliff at the end of MAINLAND_SPUR!
export const RAIL_TUNNEL_PORTAL_DIST = RAIL_TRACKS.MAINLAND_SPUR.totalDist - 8;
const _portalPt = getTrackPointOnTrack('MAINLAND_SPUR', RAIL_TUNNEL_PORTAL_DIST);
const _portalPrev = getTrackPointOnTrack('MAINLAND_SPUR', Math.max(0, RAIL_TUNNEL_PORTAL_DIST - 4.0));
export const RAIL_TUNNEL_PORTAL_POS = {
    x: _portalPt.x,
    z: _portalPt.z,
    heading: Math.atan2(_portalPt.x - _portalPrev.x, _portalPt.z - _portalPrev.z),
    dist: RAIL_TUNNEL_PORTAL_DIST
};
export let railTunnelPortalGroup: THREE.Group | null = null;

export function buildRailTunnelPortal() {
    const px = RAIL_TUNNEL_PORTAL_POS.x;
    const pz = RAIL_TUNNEL_PORTAL_POS.z;
    const py = getSurfaceHeight(px, pz);

    const g = new THREE.Group();
    const matConcrete = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });
    const matMountain = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    const matMountainDark = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matSnowCap = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad3 });
    const matCobalt = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matVoidBlack = new THREE.MeshBasicMaterial({ color: 0x05080f });

    // Sculpted Rocky Mountain Cliff Massif strictly BEHIND the tunnel portal (+Z >= +7m so the portal & black bore are 100% visible!)
    const mainPeak = new THREE.Mesh(new THREE.DodecahedronGeometry(20, 1), matMountain);
    mainPeak.position.set(0, 21, 24);
    mainPeak.scale.set(1.3, 1.35, 0.82);
    mainPeak.castShadow = true;
    const leftRidge = new THREE.Mesh(new THREE.DodecahedronGeometry(15, 0), matMountainDark);
    leftRidge.position.set(-18, 11, 16);
    leftRidge.scale.set(1.05, 1.0, 0.85);
    const rightRidge = new THREE.Mesh(new THREE.DodecahedronGeometry(15, 0), matMountainDark);
    rightRidge.position.set(18, 12, 16);
    rightRidge.scale.set(1.05, 1.05, 0.85);
    const snowSummit = new THREE.Mesh(new THREE.ConeGeometry(12, 12, 7), matSnowCap);
    snowSummit.position.set(0, 44, 24);
    g.add(mainPeak, leftRidge, rightRidge, snowSummit);

    // Twin Heavy Concrete Portal Abutments protruding cleanly in front of the cliff face
    [-5.8, 5.8].forEach(sx => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 10.8, 7.6), matConcrete);
        pillar.position.set(sx, 5.4, 0.2);
        pillar.castShadow = true;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.92, 1.1, 7.7), matCobalt);
        stripe.position.set(sx, 8.8, 0.2);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 10), matCyanGlow);
        lamp.position.set(sx, 11.0, -3.7);
        lamp.userData.noOutline = true;
        g.add(pillar, stripe, lamp);
    });

    // Grand Overhead Arch Header & Glowing Shinkansen Signboard facing approaching trains (-Z)
    const header = new THREE.Mesh(new THREE.BoxGeometry(15.2, 2.8, 7.8), matConcrete);
    header.position.set(0, 10.8, 0.2);
    header.castShadow = true;
    const archTrim = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.55, 8.0), matGold);
    archTrim.position.set(0, 9.35, 0.2);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.65, 0.45), matCobalt);
    signBoard.position.set(0, 10.9, -3.85);
    const signGlowBar = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.42, 0.18), matGold);
    signGlowBar.position.set(0, 10.9, -4.12);
    signGlowBar.userData.noOutline = true;

    // Deep Pitch-Black Tunnel Bore Mouth recessed cleanly inside the arch (100% visible in front of the cliff!)
    const tunnelMouth = new THREE.Mesh(new THREE.BoxGeometry(9.2, 9.2, 2.4), matVoidBlack);
    tunnelMouth.position.set(0, 4.6, 1.2);
    tunnelMouth.userData.noOutline = true;

    const portalArch = new THREE.Mesh(
        new THREE.TorusGeometry(4.6, 0.26, 10, 28, Math.PI),
        matCyanGlow
    );
    portalArch.position.set(0, 4.4, -3.4);
    portalArch.userData.noOutline = true;

    g.add(header, archTrim, signBoard, signGlowBar, tunnelMouth, portalArch);
    g.position.set(px, py, pz);
    g.rotation.y = RAIL_TUNNEL_PORTAL_POS.heading;

    scene.add(g);
    registerCullableObject(g, px, py + 12, pz, 85);
    railTunnelPortalGroup = g;
    return g;
}

        // 4 Grade Crossing Signals & Paved Rubber Flange Aprons (at NS & EW Highways)
        railroadCrossings = [];

        export function createRailroadCrossing(cx: number, cz: number, isNSHighway: boolean) {
            const gy = getSurfaceHeight(cx, cz);
            const { root: crossG, lamps } = buildRailroadCrossingMesh(isNSHighway);
            crossG.position.set(cx, gy, cz);

            scene.add(crossG);
            registerCullableObject(crossG, cx, gy + 2, cz, 32);

            const crossingData: RailroadCrossingEntry = { x: cx, z: cz, gy, isNSHighway, lamps, isFlashing: false, group: crossG };
            railroadCrossings.push(crossingData);
            return crossingData;
        }

        // Griffin Rock Central Passenger Railway Station (aligned cleanly beside & tangent to the East Railway spline!)
        export function buildCentralRailwayStation() {
            const nearest = findNearestRailwayPoint(765, 75);
            const stPt = getTrackPointOnTrack(nearest.trackId, nearest.distOnTrack);
            const stX = nearest.x;
            const stZ = nearest.z;
            const stY = Math.min(stPt.y, getSurfaceHeight(stX, stZ));
            const { root: stationG } = buildCentralRailwayStationMesh();
            stationG.position.set(stX, stY, stZ);
            stationG.rotation.y = nearest.heading;

            scene.add(stationG);
            registerCullableObject(stationG, stX, stY + 3, stZ, 45);
            return stationG;
        }

        /***********************************************************************
         * 5D. GRIFFIN ROCK ISLAND RAILWAY TRAIN SYSTEM ("THE GRIFFIN ROCK EXPRESS")
         ***********************************************************************/
        islandTrain = {
            cars: [],
            progress: 350.0,
            speed: 18.5,
            chugTimer: 0,
            bellTimer: 0,
            whistleCooldown: 0,
            steamTimer: 0
        };

        const trainSteamPuffs: TrainSteamPuff[] = [];
        const trainSteamGeo = new THREE.SphereGeometry(1, 8, 8);
        const trainSteamMat = new THREE.MeshToonMaterial({
            color: 0xf1f5f9,
            gradientMap: toonGrad3,
            transparent: true,
            opacity: 0.75
        });

        export function spawnTrainSteamPuff(wx: number, wy: number, wz: number, heading: number, speed: number) {
            let puff: TrainSteamPuff | null = null;
            for (let i = 0; i < trainSteamPuffs.length; i++) {
                if (!trainSteamPuffs[i].active) {
                    puff = trainSteamPuffs[i];
                    break;
                }
            }
            if (!puff) {
                if (trainSteamPuffs.length >= 24) return;
                const mesh = new THREE.Mesh(trainSteamGeo, trainSteamMat.clone());
                scene.add(mesh);
                puff = { mesh, active: false, life: 0, maxLife: 1.5, startScale: 0.55, endScale: 2.6, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
                trainSteamPuffs.push(puff);
            }
            puff.active = true;
            puff.mesh.visible = true;
            puff.life = 0;
            puff.maxLife = 1.35 + Math.random() * 0.35;
            puff.startScale = 0.55;
            puff.endScale = 2.6 + Math.random() * 0.6;
            puff.x = wx;
            puff.y = wy;
            puff.z = wz;
            const driftSpeed = speed * 0.35;
            puff.vx = -Math.sin(heading) * driftSpeed + (Math.random() - 0.5) * 1.4;
            puff.vy = 3.6 + Math.random() * 1.2;
            puff.vz = -Math.cos(heading) * driftSpeed + (Math.random() - 0.5) * 1.4;
            puff.mesh.position.set(wx, wy, wz);
            puff.mesh.scale.setScalar(puff.startScale);
            puff.mesh.material.opacity = 0.72;
        }

        export function buildIslandTrainSystem() {
            const loco = buildTrainLocomotiveMesh(true);
            scene.add(loco.root);
            islandTrain.cars.push({
                name: 'Locomotive',
                root: loco.root,
                length: 14.5,
                halfLength: 7.25,
                width: 3.6,
                halfWidth: 1.8,
                height: 4.8,
                mass: 95000,
                offset: 0.0,
                wheelRadius: 0.88,
                wheels: loco.wheels,
                connectingRods: loco.connectingRods,
                x: 0, y: 0, z: 0, heading: 0, pitch: 0
            });

            const specs = [
                { name: 'Tender', build: buildTrainTenderMesh, length: 9.5, halfLength: 4.75, width: 3.4, halfWidth: 1.7, height: 3.6, mass: 45000, offset: 13.20 },
                { name: 'Coach 1', build: buildTrainCommuterCoachMesh, length: 15.0, halfLength: 7.50, width: 3.5, halfWidth: 1.75, height: 4.0, mass: 42000, offset: 26.65 },
                { name: 'Coach 2 Dome', build: buildTrainDomeCoachMesh, length: 15.0, halfLength: 7.50, width: 3.5, halfWidth: 1.75, height: 4.6, mass: 44000, offset: 42.85 },
                { name: 'Coach 3 Diner', build: buildTrainDiningCoachMesh, length: 15.0, halfLength: 7.50, width: 3.5, halfWidth: 1.75, height: 4.0, mass: 42000, offset: 59.05 },
                { name: 'Flatcar', build: buildTrainFlatcarMesh, length: 13.0, halfLength: 6.50, width: 3.4, halfWidth: 1.70, height: 3.2, mass: 38000, offset: 74.25 },
                { name: 'Caboose', build: buildTrainCabooseMesh, length: 12.5, halfLength: 6.25, width: 3.4, halfWidth: 1.70, height: 4.5, mass: 32000, offset: 88.20 }
            ];

            specs.forEach(s => {
                const carBuilt = s.build();
                scene.add(carBuilt.root);
                islandTrain.cars.push({
                    name: s.name,
                    root: carBuilt.root,
                    length: s.length,
                    halfLength: s.halfLength,
                    width: s.width,
                    halfWidth: s.halfWidth,
                    height: s.height,
                    mass: s.mass,
                    offset: s.offset,
                    wheelRadius: 0.52,
                    wheels: carBuilt.wheels,
                    x: 0, y: 0, z: 0, heading: 0, pitch: 0
                });
            });
        }

        export function updateIslandTrain(dt: number, now: number) {
            islandTrain.progress = (islandTrain.progress + islandTrain.speed * dt) % railwayTotalDist;

            const locoCar = islandTrain.cars[0];
            const cabooseCar = islandTrain.cars[islandTrain.cars.length - 1];

            // 1. Spline positioning & articulation for all 7 cars
            for (let i = 0; i < islandTrain.cars.length; i++) {
                const car = islandTrain.cars[i];
                const carDist = ((islandTrain.progress - car.offset) % railwayTotalDist + railwayTotalDist) % railwayTotalDist;
                const p = getTrackPointAtDist(carDist);
                const pFwd = getTrackPointAtDist(carDist + 2.5);
                const pBwd = getTrackPointAtDist(carDist - 2.5);

                const dx = pFwd.x - pBwd.x;
                const dz = pFwd.z - pBwd.z;
                const heading = Math.atan2(dx, dz);

                const groundY = getSurfaceHeight(p.x, p.z);
                const yFwd = getSurfaceHeight(pFwd.x, pFwd.z);
                const yBwd = getSurfaceHeight(pBwd.x, pBwd.z);
                const pitch = Math.atan2(yFwd - yBwd, 5.0);

                car.x = p.x;
                car.y = groundY + 0.65;
                car.z = p.z;
                car.heading = heading;
                car.pitch = pitch;

                car.root.position.set(car.x, car.y, car.z);
                car.root.rotation.set(pitch, heading, 0, 'YXZ');

                const spin = (islandTrain.speed * dt) / (car.wheelRadius || 0.52);
                for (let w = 0; w < car.wheels.length; w++) {
                    car.wheels[w].rotation.x += spin;
                }

                if (car.connectingRods) {
                    const crankAngle = (carDist / 0.88);
                    const rodOffsetY = Math.sin(crankAngle) * 0.32;
                    const rodOffsetZ = Math.cos(crankAngle) * 0.32;
                    car.connectingRods.forEach(cr => {
                        cr.position.set(cr.userData.baseX, cr.userData.baseY + rodOffsetY, cr.userData.baseZ + rodOffsetZ);
                    });
                }
            }

            // 2. Locomotive Smokestack Cartoon Steam Puffs
            if (locoCar) {
                const fwdX = Math.sin(locoCar.heading);
                const fwdZ = Math.cos(locoCar.heading);
                const stackWorldX = locoCar.x + fwdX * 5.2;
                const stackWorldY = locoCar.y + 5.15;
                const stackWorldZ = locoCar.z + fwdZ * 5.2;

                if (!islandTrain.steamTimer) islandTrain.steamTimer = 0;
                islandTrain.steamTimer -= dt;
                if (islandTrain.steamTimer <= 0) {
                    islandTrain.steamTimer = 0.16;
                    spawnTrainSteamPuff(stackWorldX, stackWorldY, stackWorldZ, locoCar.heading, islandTrain.speed);
                }
            }

            for (let i = 0; i < trainSteamPuffs.length; i++) {
                const puff = trainSteamPuffs[i];
                if (!puff.active) continue;
                puff.life += dt;
                if (puff.life >= puff.maxLife) {
                    puff.active = false;
                    puff.mesh.visible = false;
                    continue;
                }
                const frac = puff.life / puff.maxLife;
                puff.x += puff.vx * dt;
                puff.y += puff.vy * dt;
                puff.z += puff.vz * dt;
                puff.mesh.position.set(puff.x, puff.y, puff.z);
                puff.mesh.scale.setScalar(puff.startScale + frac * (puff.endScale - puff.startScale));
                puff.mesh.material.opacity = Math.max(0, 0.75 * (1 - frac));
            }

            // 3. Steam Chug Audio
            islandTrain.chugTimer -= dt;
            if (islandTrain.chugTimer <= 0) {
                islandTrain.chugTimer = 0.32;
                const distToPlayer = Math.hypot(player.pos.x - locoCar.x, player.pos.z - locoCar.z);
                if (distToPlayer < 120.0) {
                    sfx.playTrainChug();
                }
            }

            // 4. Highway Grade Crossing Signal Activation & Bell Ding
            if (!islandTrain.bellTimer) islandTrain.bellTimer = 0;
            islandTrain.bellTimer -= dt;
            if (islandTrain.whistleCooldown > 0) islandTrain.whistleCooldown -= dt;

            for (let cIdx = 0; cIdx < railroadCrossings.length; cIdx++) {
                const rc = railroadCrossings[cIdx];
                const dLoco = Math.hypot(locoCar.x - rc.x, locoCar.z - rc.z);

                let isTrainOnPad = false;
                for (let k = 0; k < islandTrain.cars.length; k++) {
                    const c = islandTrain.cars[k];
                    if (Math.hypot(c.x - rc.x, c.z - rc.z) < 14.0) {
                        isTrainOnPad = true;
                        break;
                    }
                }

                const locoFwdX = Math.sin(locoCar.heading);
                const locoFwdZ = Math.cos(locoCar.heading);
                const dotApproach = (rc.x - locoCar.x) * locoFwdX + (rc.z - locoCar.z) * locoFwdZ;
                const isApproaching = (dotApproach > 0 && dLoco < 85.0);

                // Also activate crossing signals when Toreinbotto approaches in Train Mode on the rails!
                const isToreinbottoOnRail = player.botType === 'TOREINBOTTO' && player.mode === 'VEHICLE' && Boolean(player.onRailwayTrack);
                const dPlayer = isToreinbottoOnRail ? Math.hypot(player.pos.x - rc.x, player.pos.z - rc.z) : 9999;
                const isToreinbottoApproaching = isToreinbottoOnRail && dPlayer < 85.0;

                const shouldBeActive = isTrainOnPad || isApproaching || isToreinbottoApproaching;
                rc.isFlashing = shouldBeActive;

                if (rc.lamps) {
                    const flashPhase = Math.floor(now / 200) % 2;
                    for (let l = 0; l < rc.lamps.length; l++) {
                        const lamp = rc.lamps[l];
                        if (shouldBeActive) {
                            lamp.mesh.material = (flashPhase === lamp.phase) ? matCrossRedOn : matCrossRedOff;
                        } else {
                            lamp.mesh.material = matCrossRedOff;
                        }
                    }
                }

                if (shouldBeActive) {
                    const distCrossingToPlayer = Math.hypot(player.pos.x - rc.x, player.pos.z - rc.z);
                    if (distCrossingToPlayer < 110.0 && islandTrain.bellTimer <= 0) {
                        islandTrain.bellTimer = 0.44;
                        sfx.playCrossingBell();
                    }

                    if (isApproaching && dLoco < 75.0 && islandTrain.whistleCooldown <= 0) {
                        islandTrain.whistleCooldown = 18.0;
                        sfx.playTrainWhistle();
                    }
                }
            }
        }


interface RailBridgeSpan {
    x0: number;
    y0: number;
    z0: number;
    x1: number;
    y1: number;
    z1: number;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}
const _railBridgeSpans: RailBridgeSpan[] = [];

export function getRailBridgeSurfaceHeight(x: number, z: number): number | null {
    let bestY: number | null = null;
    const maxLatSq = 7.6 * 7.6;
    for (let i = 0; i < _railBridgeSpans.length; i++) {
        const s = _railBridgeSpans[i];
        if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue;
        const sx = s.x1 - s.x0;
        const sz = s.z1 - s.z0;
        const segLenSq = sx * sx + sz * sz || 1e-6;
        const t = Math.max(0, Math.min(1, ((x - s.x0) * sx + (z - s.z0) * sz) / segLenSq));
        const px = s.x0 + sx * t;
        const pz = s.z0 + sz * t;
        const dx = x - px;
        const dz = z - pz;
        if (dx * dx + dz * dz <= maxLatSq) {
            const deckY = s.y0 + (s.y1 - s.y0) * t + 0.28;
            if (bestY === null || deckY > bestY) {
                bestY = deckY;
            }
        }
    }
    return bestY;
}

function buildElevatedRailTrackAndBridges(track: RailTrackDef, railTex: THREE.Texture, yBias = 0.24): THREE.Group {
    const grp = new THREE.Group();
    const pts = track.pts;
    const n = pts.length;
    const segCount = track.closed ? n : n - 1;
    const halfW = 7.4;

    // 1. Elevated Track Surface Ribbon following smoothed bridge elevations (p.y)!
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let cumDist = 0;

    for (let i = 0; i <= segCount; i++) {
        const idx = i % n;
        const p = pts[idx];
        const prev = pts[(idx - 1 + n) % n];
        const next = pts[(idx + 1) % n];
        let tx: number;
        let tz: number;
        if (!track.closed && i === 0) {
            tx = next.x - p.x;
            tz = next.z - p.z;
        } else if (!track.closed && i === segCount) {
            tx = p.x - prev.x;
            tz = p.z - prev.z;
        } else {
            tx = next.x - prev.x;
            tz = next.z - prev.z;
        }
        const len = Math.hypot(tx, tz) || 1;
        const nx = -tz / len;
        const nz = tx / len;

        if (i > 0) {
            const pPrev = pts[(i - 1) % n];
            cumDist += Math.hypot(p.x - pPrev.x, p.z - pPrev.z);
        }
        const yTop = p.y + yBias;
        positions.push(p.x - nx * halfW, yTop, p.z - nz * halfW);
        positions.push(p.x + nx * halfW, yTop, p.z + nz * halfW);
        const v = cumDist / 8.0;
        uvs.push(0, v, 1, v);

        if (i < segCount) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const matRail = new THREE.MeshLambertMaterial({
        map: railTex,
        polygonOffset: true,
        polygonOffsetFactor: -1.25,
        polygonOffsetUnits: -5.5
    });
    const ribbon = new THREE.Mesh(geo, matRail);
    ribbon.receiveShadow = true;
    grp.add(ribbon);

    // 2. Automatic 3D Concrete & Steel Viaduct Bridges wherever track spans above a canyon/dip!
    const matBridgeDeck = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });
    const matBridgeRail = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 });
    const matBridgePier = new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 });
    let lastPierDist = -100;

    for (let i = 0; i < segCount; i++) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % n];
        const mx = 0.5 * (p0.x + p1.x);
        const my = 0.5 * (p0.y + p1.y);
        const mz = 0.5 * (p0.z + p1.z);
        const groundY = getSurfaceHeight(mx, mz);
        const clearance = my - groundY;
        const isOverWater = groundY < 1.2;
        if (clearance < 0.75 && !isOverWater) continue;

        // Register solid bridge surface span so non-train bots & vehicles drive cleanly across!
        const pad = 7.8;
        _railBridgeSpans.push({
            x0: p0.x, y0: p0.y, z0: p0.z,
            x1: p1.x, y1: p1.y, z1: p1.z,
            minX: Math.min(p0.x, p1.x) - pad,
            maxX: Math.max(p0.x, p1.x) + pad,
            minZ: Math.min(p0.z, p1.z) - pad,
            maxZ: Math.max(p0.z, p1.z) + pad
        });
        if (clearance < 1.35 && !isOverWater) continue;

        const segLen = Math.hypot(p1.x - p0.x, p1.z - p0.z);
        const heading = Math.atan2(p1.x - p0.x, p1.z - p0.z);
        const pitch = Math.atan2(p1.y - p0.y, Math.max(0.5, segLen));

        const onRoadCenter = isPointOnRoad(mx, mz);
        // On low-clearance road crossings (< 2.2m), keep it a flush grade crossing without a thick deck slab
        if (!(onRoadCenter && clearance < 2.2)) {
            const deck = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.5, segLen + 0.6), matBridgeDeck);
            deck.position.set(mx, my - 0.6, mz);
            deck.rotation.order = 'YXZ';
            deck.rotation.set(-pitch, heading, 0);
            grp.add(deck);
        }

        // Suppress side guardrails near any switch junction, close to MAIN_LOOP, or on low-clearance road crossings (< 6.0m)
        // so barriers NEVER cross or visually break a highway!
        const nearAnySwitch = RAIL_SWITCHES.some((sw) => Math.hypot(mx - sw.x, mz - sw.z) < 42.0);
        const nearMainLoop = track.id !== 'MAIN_LOOP' && Math.abs(Math.hypot(mx, mz) - getRailwayRadius(Math.atan2(mz, mx))) < 22.0;
        const lowRoadCrossing = clearance < 6.0 && onRoadCenter;
        if (!nearAnySwitch && !nearMainLoop && !lowRoadCrossing) {
            [-7.35, 7.35].forEach((sideX) => {
                const gx = mx + Math.cos(heading) * sideX;
                const gz = mz - Math.sin(heading) * sideX;
                if (clearance < 6.0 && isPointOnRoad(gx, gz)) return;
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.65, segLen + 0.6), matBridgeRail);
                rail.position.set(gx, my + 0.85, gz);
                rail.rotation.order = 'YXZ';
                rail.rotation.set(-pitch, heading, 0);
                grp.add(rail);
            });
        }

        // Concrete Viaduct Support Piers every ~28m (top tucked cleanly UNDER the deck at my - 1.2m!)
        if (p0.dist - lastPierDist >= 28 && clearance > 2.2 && !isPointOnRoad(mx, mz)) {
            lastPierDist = p0.dist;
            const pierBottom = groundY - 2.5;
            const pierTop = my - 1.2;
            const pierH = Math.max(0.5, pierTop - pierBottom);
            const pier = new THREE.Mesh(new THREE.BoxGeometry(9.6, pierH, 3.2), matBridgePier);
            pier.position.set(mx, (pierBottom + pierTop) * 0.5, mz);
            pier.rotation.y = heading;
            grp.add(pier);
        }
    }

    freezeStaticHierarchy(grp);
    return grp;
}

export function initRailway(scene?: THREE.Scene | null) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    sharedRailTrackTexture = makeProceduralRailTrackTexture();
    const railTex = sharedRailTrackTexture;
    _railBridgeSpans.length = 0;

    // Build ALL 5 Loops + Mainland Mountain Tunnel Spur with smoothed bridge elevations & automatic viaducts!
    const mainTrackGroup = buildElevatedRailTrackAndBridges(RAIL_TRACKS.MAIN_LOOP, railTex, 0.22);
    railwayLoopMesh = mainTrackGroup.children[0] as THREE.Mesh;
    s.add(mainTrackGroup);

    (['TOWN_LOOP', 'HARBOR_LOOP', 'VOLCANO_LOOP', 'SKY_PEAK_LOOP', 'MAINLAND_SPUR'] as RailTrackId[]).forEach((tid) => {
        const track = RAIL_TRACKS[tid];
        const branchGroup = buildElevatedRailTrackAndBridges(track, railTex, 0.27);
        s.add(branchGroup);
    });
    setRailwayBridgeHeightHook(getRailBridgeSurfaceHeight);

    // Build 3D Illuminated Railway Switch Stands + Junction Frog Plates beside each switch
    const matSwitchPost = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    const matSwitchBase = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    const matFrogPlate = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    RAIL_SWITCHES.forEach((sw) => {
        const rightX = Math.cos(sw.heading);
        const rightZ = -Math.sin(sw.heading);
        const sx = sw.x + rightX * 9.8;
        const sz = sw.z + rightZ * 9.8;
        const jctPt = getTrackPointOnTrack('MAIN_LOOP', sw.mainDist);
        const sy = getSurfaceHeight(sx, sz);

        // Clean Steel Switch Frog Plate flush on the junction rails
        const frogPlate = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.16, 12.0), matFrogPlate);
        frogPlate.position.set(sw.x, jctPt.y + 0.19, sw.z);
        frogPlate.rotation.y = sw.heading;
        s.add(frogPlate);

        const stand = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.8), matSwitchBase);
        base.position.y = 0.4;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 6.2, 8), matSwitchPost);
        post.position.y = 3.5;
        const lanternMat = new THREE.MeshBasicMaterial({ color: sw.divert ? 0xfacc15 : 0x22c55e });
        const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), lanternMat);
        lantern.position.y = 7.0;
        const arrowPivot = new THREE.Group();
        arrowPivot.position.y = 5.4;
        const arrowBar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 2.8), lanternMat);
        const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.4, 4).rotateX(Math.PI / 2), lanternMat);
        arrowHead.position.z = 1.8;
        arrowPivot.add(arrowBar, arrowHead);
        arrowPivot.rotation.y = sw.divert ? 0.55 : 0;

        stand.add(base, post, lantern, arrowPivot);
        stand.position.set(sx, sy, sz);
        stand.rotation.y = sw.heading;
        sw.lanternMat = lanternMat;
        sw.arrowPivot = arrowPivot;
        s.add(stand);
        registerCullableObject(stand, sx, sy + 4, sz, 32);
    });

    // 4 Grade Crossings (snapped to exact railway spline centerlines)
    railroadCrossings.length = 0;
    const eastCross = findNearestRailwayPoint(770, 25);
    const westCross = findNearestRailwayPoint(-770, 25);
    createRailroadCrossing(0, 620, true);                        // South NS Highway Crossing
    createRailroadCrossing(0, -730, true);                       // North NS Highway Crossing
    createRailroadCrossing(eastCross.x, eastCross.z, false);     // East EW Highway Crossing
    createRailroadCrossing(westCross.x, westCross.z, false);     // West EW Highway Crossing
    railroadCrossings.forEach((cr) => {
        if (cr.group) {
            mergeStaticMeshesInGroup(cr.group, (cr.lamps || []).map((l) => l.mesh));
        }
    });

    centralStationGroup = buildCentralRailwayStation();
    if (centralStationGroup) {
        mergeStaticMeshesInGroup(centralStationGroup);
    }

    buildRailTunnelPortal();
    buildIslandTrainSystem();

    if (typeof window !== 'undefined') {
        window.railroadCrossings = railroadCrossings;
        window.centralStationGroup = centralStationGroup;
        window.islandTrain = islandTrain;
    }
}

// Minimap Radar & Full-Screen Tactical Island Map System
import { player, buddyBot, worldState } from '../state/gameState.js';
import { progression } from '../progression/progression.js';
import { getUndergroundMapData } from '../world/underground.js';
import { getPlanetCavernMapData } from '../world/planetCaverns.js';
import { beacons } from '../world/emergencies.js';
import { DISCOVERY_LANDMARKS } from '../world/collectibles.js';
import { sfx } from '../audio/soundFX.js';
import { bindButton } from './hud.js';
import { waypointGroup } from '../physics/movement.js';
import {
    getSurfaceHeight, isPointInWater, getRailwayRadius,
    getInnerRoadRadius, getOuterRoadRadius, INNER_LOOP_RADIUS, OUTER_LOOP_RADIUS
} from '../world/terrain.js';
import { spawnBurstParticles } from '../world/emergencies.js';
import { showToast } from './dialogs.js';

import { islandTrain, findNearestRailwayPoint, RAIL_TUNNEL_PORTAL_POS } from '../world/railway.js';
import { HQ_SWAP_PAD, HOSPITAL_POS, HOSPITAL_DROPOFF_PAD, bwX, bwZ, testYard } from '../world/buildings.js';
import { getPatientsMapData } from '../world/patients.js';
import { visitingAutobots, WORLD_MEGA_LOCATIONS } from '../world/allies.js';
import { morbotBattle } from '../world/morbot.js';
import { isBotDocked } from '../progression/progression.js';

interface BeaconEntry {
    id: number;
    name: string;
    x: number;
    z: number;
    type: string;
    restored: boolean;
}

interface TrainCarEntry {
    x: number;
    z: number;
    heading?: number;
}

interface TrainData {
    cars: TrainCarEntry[];
}

interface VisitingAutobotEntry {
    id: string;
    name: string;
    x: number;
    z: number;
    badgeColor?: string;
}

interface WaypointGroupRef {
    visible: boolean;
    position: { set(x: number, y: number, z: number): void };
}

interface MoonHoopEntry {
    x: number;
    z: number;
    cleared?: boolean;
}

type MoonMapDataExtended = NonNullable<ReturnType<NonNullable<Window['getMoonMapData']>>> & {
    hoops?: MoonHoopEntry[];
};

interface UndergroundEdge {
    open?: boolean;
    r1: number;
    c1: number;
    r2: number;
    c2: number;
    cracked?: boolean;
    broken?: boolean;
    x: number;
    z: number;
    horizontal?: boolean;
}

interface UndergroundShaft {
    x: number;
    z: number;
}

interface UndergroundGem {
    x: number;
    z: number;
    collected?: boolean;
}

interface UndergroundDiscovery {
    id: string;
    name: string;
    x: number;
    z: number;
    color: string;
}

interface UndergroundDino {
    x: number;
    z: number;
    isBig?: boolean;
}

interface UndergroundSigmaPart {
    name: string;
    x: number;
    z: number;
    collected?: boolean;
}

function setWaypointMarkerPos(x: number, y: number, z: number) {
    const wg = waypointGroup as unknown as WaypointGroupRef | null;
    if (wg) {
        wg.position.set(x, y, z);
        wg.visible = true;
    }
}

const MEGA_ATTACHMENT_META: Record<string, { name: string, color: string }> = {
    HEATWAVE:    { name: 'HEATWAVE LADDER',    color: '#ef4444' },
    OPTIMUS:     { name: 'OPTIMUS SUPER RIG',  color: '#dc2626' },
    BOULDER:     { name: 'BOULDER BUCKET',     color: '#84cc16' },
    CHASE:       { name: 'CHASE TRAILER',      color: '#3b82f6' },
    BLADES:      { name: 'BLADES SKY-CRANE',   color: '#f97316' },
    BUMBLEBEE:   { name: 'BUMBLEBEE MONSTER',  color: '#facc15' },
    BLURR:       { name: 'BLURR SPEED RIG',    color: '#a855f7' },
    SALVAGE:     { name: 'SALVAGE DUMPSTER',   color: '#65a30d' },
    QUICKSHADOW: { name: 'QUICKSHADOW BOMBER', color: '#0ea5e9' },
    HIGHTIDE:    { name: 'HIGH TIDE RIG',      color: '#06b6d4' }
};
window.lastTacticalMapToggleTime = 0;

export let minimapCanvas: HTMLCanvasElement | null = null;
export let mCtx: CanvasRenderingContext2D | null = null;
export let tacticalMapCanvas: HTMLCanvasElement | null = null;
export let tCtx: CanvasRenderingContext2D | null = null;

export function ensureMapCanvases() {
    if (!minimapCanvas && typeof document !== 'undefined') {
        minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement | null;
        if (minimapCanvas) mCtx = minimapCanvas.getContext('2d');
    }
    if (!tacticalMapCanvas && typeof document !== 'undefined') {
        tacticalMapCanvas = document.getElementById('tactical-map-canvas') as HTMLCanvasElement | null;
        if (tacticalMapCanvas) tCtx = tacticalMapCanvas.getContext('2d');
    }
}

export function openTacticalMap() {
    const modal = document.getElementById('tactical-map-modal');
    if (!modal) return;
    window.lastTacticalMapToggleTime = performance.now();
    modal.classList.remove('hidden');
    if (sfx) {
        if (typeof sfx.playMapOpen === 'function') sfx.playMapOpen();
        else if (typeof sfx.playWaypointTap === 'function') sfx.playWaypointTap();
    }
    renderTacticalMap();
}

export function closeTacticalMap() {
    const modal = document.getElementById('tactical-map-modal');
    if (!modal) return;
    window.lastTacticalMapToggleTime = performance.now();
    modal.classList.add('hidden');
    if (sfx) {
        if (typeof sfx.playMapClose === 'function') sfx.playMapClose();
        else if (typeof sfx.playWaypointTap === 'function') sfx.playWaypointTap();
    }
}

export function handleTacticalMapTap(clientX: number, clientY: number) {
    ensureMapCanvases();
    if (!tacticalMapCanvas || performance.now() - (window.lastTacticalMapToggleTime || 0) < 300) return;
                const rect = tacticalMapCanvas.getBoundingClientRect();
                const canvasX = (clientX - rect.left) * (tacticalMapCanvas.width / rect.width);
                const canvasY = (clientY - rect.top) * (tacticalMapCanvas.height / rect.height);
                const cx = tacticalMapCanvas.width / 2;
                const cy = tacticalMapCanvas.height / 2;

                if (worldState.activeArea === 'SPACE') {
                    const sp = window.getSpaceMapData?.();
                    if (sp) {
                        const spScale = (cx * 0.84) / (sp.bounds || 460);
                        let wx = Math.max(-sp.bounds + 20, Math.min(sp.bounds - 20, (canvasX - cx) / spScale));
                        let wz = Math.max(-sp.bounds + 20, Math.min(sp.bounds - 20, (canvasY - cy) / spScale));
                        let wy = sp.ship.pos.y;
                        let snapLabel = `(${Math.round(wx)}, ${Math.round(wz)})`;
                        // Snap to nearest orbital target if tapped within 45m
                        const checkSnap = (tx: number, ty: number, tz: number, label: string, r = 45) => {
                            if (Math.hypot(wx - tx, wz - tz) < r) {
                                wx = tx; wy = ty; wz = tz; snapLabel = label;
                            }
                        };
                        if (sp.sectorId === 'MOON_ORBIT' || !sp.sectorId) {
                            checkSnap(sp.moonLandingPos?.x ?? 0, sp.moonLandingPos?.y ?? 45, sp.moonLandingPos?.z ?? -238, 'Lunar Landing Zone', 55);
                            if (sp.moroccoStation && !sp.moroccoStation.defeated) {
                                checkSnap(sp.moroccoStation.pos.x, sp.moroccoStation.pos.y, sp.moroccoStation.pos.z, "Dr. Morocco's Orbital Station", 55);
                            }
                        } else {
                            sp.sectorMoons?.forEach(m => {
                                const pt = m.beaconRing ? m.landingPos : m.pos;
                                checkSnap(pt.x, pt.y, pt.z, m.name, 55);
                            });
                            if (sp.saturnRaceGatePos) {
                                checkSnap(sp.saturnRaceGatePos.x, sp.saturnRaceGatePos.y, sp.saturnRaceGatePos.z, 'Saturn Ring Grand Prix Gate', 55);
                            }
                        }
                        checkSnap(sp.stationPos.x, sp.stationPos.y, sp.stationPos.z, 'Autobot Orbital Station', 55);
                        sp.satellites?.forEach(s => { if (!s.repaired) checkSnap(s.pos.x, s.pos.y, s.pos.z, s.name, 42); });
                        sp.pods?.forEach(p => { if (!p.rescued) checkSnap(p.pos.x, p.pos.y, p.pos.z, p.name, 42); });
                        const activeRing = sp.starRings?.[sp.ship.activeRingIdx];
                        if (activeRing) checkSnap(activeRing.pos.x, activeRing.pos.y, activeRing.pos.z, 'Active Star-Ring Gate', 42);

                        if (typeof window.setSpaceWaypointWorld === 'function') {
                            window.setSpaceWaypointWorld(wx, wy, wz);
                        } else {
                            sp.ship.waypoint.set(wx, wy, wz);
                            sp.ship.hasWaypoint = true;
                        }
                        if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                        showToast('ORBITAL COURSE LOCKED', `Starship Sigma flying to ${snapLabel}`);
                    }
                    closeTacticalMap();
                    return;
                }

                if (worldState.activeArea === 'UNDERWATER') {
                    const uw = window.getUnderwaterMapData?.();
                    const uR = uw?.radius || 480;
                    const uScale = (cx * 0.84) / uR;
                    let wx = (canvasX - cx) / uScale;
                    let wz = (canvasY - cy) / uScale;
                    let wy = uw ? uw.subPos.y : 34;
                    let snapLabel = `(${Math.round(wx)}, ${Math.round(wz)})`;
                    if (uw) {
                        const checkUwSnap = (tx: number, ty: number, tz: number, label: string, r = 55) => {
                            if (Math.hypot(wx - tx, wz - tz) < r) {
                                wx = tx; wy = ty; wz = tz; snapLabel = label;
                            }
                        };
                        uw.landmarks.forEach((lm) => checkUwSnap(lm.x, lm.y, lm.z, lm.name, 55));
                        uw.relics.forEach((rel) => { if (!rel.collected) checkUwSnap(rel.x, rel.y, rel.z, rel.name, 42); });
                        if (!uw.moroccoBuoy.disabled) {
                            checkUwSnap(uw.moroccoBuoy.x, uw.moroccoBuoy.y, uw.moroccoBuoy.z, 'Dr. Morocco Sonic Buoy', 55);
                        }
                        const activeRg = uw.rings[uw.activeRingIdx];
                        if (activeRg) checkUwSnap(activeRg.x, activeRg.y, activeRg.z, 'Active Training Ring', 42);
                    }
                    const d = Math.hypot(wx, wz);
                    if (d > uR - 25) {
                        wx *= (uR - 25) / d;
                        wz *= (uR - 25) / d;
                    }
                    window.setUnderwaterWaypointWorld?.(wx, wy, wz);
                    if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                    showToast('DEEP-SEA COURSE LOCKED', `High Tide swimming to ${snapLabel}`);
                    closeTacticalMap();
                    return;
                }

                if (worldState.activeArea === 'PLANET_CAVERN') {
                    const pc = getPlanetCavernMapData();
                    const cR = pc.radius || 320;
                    const cScale = (cx * 0.84) / cR;
                    let wx = (canvasX - cx) / cScale;
                    let wz = (canvasY - cy) / cScale;
                    const d = Math.hypot(wx, wz);
                    if (d > cR - 14) {
                        wx *= (cR - 14) / d;
                        wz *= (cR - 14) / d;
                    }
                    const ty = getSurfaceHeight(wx, wz);
                    player.waypoint.set(wx, ty, wz);
                    player.hasWaypoint = true;
                    setWaypointMarkerPos(wx, ty, wz);
                    if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                    spawnBurstParticles(wx, ty + 0.5, wz, 0xfacc15, 6, 0.8);
                    showToast(`${pc.theme.name} CAVERN WAYPOINT`, `Navigating to (${Math.round(wx)}, ${Math.round(wz)})`);
                    closeTacticalMap();
                    return;
                }

                if (worldState.activeArea === 'PLANET_SURFACE') {
                    const pd = window.getPlanetSurfaceMapData?.();
                    const pR = pd?.radius || 560;
                    const pScale = (cx * 0.84) / pR;
                    let wx = (canvasX - cx) / pScale;
                    let wz = (canvasY - cy) / pScale;
                    const d = Math.hypot(wx, wz);
                    if (d > pR - 10) {
                        wx *= (pR - 10) / d;
                        wz *= (pR - 10) / d;
                    }
                    const ty = getSurfaceHeight(wx, wz);
                    player.waypoint.set(wx, ty, wz);
                    player.hasWaypoint = true;
                    setWaypointMarkerPos(wx, ty, wz);
                    if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                    spawnBurstParticles(wx, ty + 0.5, wz, 0xfacc15, 6, 0.8);
                    showToast(`${pd?.config?.name || 'PLANET'} WAYPOINT SET`, `Navigating to (${Math.round(wx)}, ${Math.round(wz)})`);
                    closeTacticalMap();
                    return;
                }

                if (worldState.activeArea === 'SATURN_RING_RACE' || worldState.activeArea === 'SOLAR_HUB') {
                    closeTacticalMap();
                    return;
                }

                if (worldState.activeArea === 'MOON') {
                    const md = window.getMoonMapData?.() as MoonMapDataExtended | undefined;
                    const moonR = md?.radius || 185;
                    const moonScale = (cx * 0.84) / moonR;
                    let wx = (canvasX - cx) / moonScale;
                    let wz = (canvasY - cy) / moonScale;
                    const d = Math.hypot(wx, wz);
                    if (d > moonR - 8) {
                        wx *= (moonR - 8) / d;
                        wz *= (moonR - 8) / d;
                    }
                    const ty = getSurfaceHeight(wx, wz);
                    player.waypoint.set(wx, ty, wz);
                    player.hasWaypoint = true;
                    setWaypointMarkerPos(wx, ty, wz);
                    if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                    spawnBurstParticles(wx, ty + 0.5, wz, 0xfacc15, 6, 0.8);
                    showToast('LUNAR WAYPOINT SET', `Navigating across Moon to (${Math.round(wx)}, ${Math.round(wz)})`);
                    closeTacticalMap();
                    return;
                }

                if (worldState.activeArea === 'UNDERGROUND') {
                    const ug = getUndergroundMapData();
                    const ugScale = (cx * 0.84) / ug.halfWorld;
                    let worldX = Math.max(-ug.halfWorld + 6, Math.min(ug.halfWorld - 6, (canvasX - cx) / ugScale));
                    let worldZ = Math.max(-ug.halfWorld + 6, Math.min(ug.halfWorld - 6, (canvasY - cy) / ugScale));
                    const ty = getSurfaceHeight(worldX, worldZ);
                    const isWaterPt = isPointInWater(worldX, worldZ);
                    const markerY = isWaterPt ? -0.45 : Math.max(0.0, ty);
                    player.waypoint.set(worldX, markerY, worldZ);
                    player.hasWaypoint = true;
                    setWaypointMarkerPos(worldX, markerY, worldZ);
                    if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                    spawnBurstParticles(worldX, markerY + 0.5, worldZ, 0xfacc15, 6, 0.8);
                    showToast("CAVERN WAYPOINT SET", `Navigating tunnels to (${Math.round(worldX)}, ${Math.round(worldZ)})`);
                    closeTacticalMap();
                    return;
                }

                const mapScale = (cx * 0.82) / 2200;
                let worldX = (canvasX - cx) / mapScale;
                let worldZ = (canvasY - cy) / mapScale;

                // Snap to nearest active beacon if tapped within 120m
                (beacons as unknown as BeaconEntry[]).forEach(b => {
                    if (!b.restored && Math.hypot(worldX - b.x, worldZ - b.z) < 120) {
                        worldX = b.x;
                        worldZ = b.z;
                    }
                });

                const isWaterPoint = isPointInWater(worldX, worldZ) || getSurfaceHeight(worldX, worldZ) < 0.25;
                const canTraverseWater = (player.botType !== 'HIGHTIDE' && player.mode === 'VEHICLE') ||
                                         (player.botType === 'HIGHTIDE' && (player.mode === 'VEHICLE' || player.mode === 'DINO'));
                let ty = getSurfaceHeight(worldX, worldZ);
                if (!canTraverseWater && ty < -0.25) {
                    // Land-only bots cannot traverse water: clamp target point to nearest shoreline / dry land
                    const r = Math.hypot(worldX, worldZ);
                    const angle = Math.atan2(worldZ, worldX);
                    for (let testDist = Math.min(r, 1620); testDist > 50; testDist -= 20) {
                        const tx = Math.cos(angle) * testDist;
                        const tz = Math.sin(angle) * testDist;
                        const testY = getSurfaceHeight(tx, tz);
                        if (testY >= -0.5) {
                            worldX = tx;
                            worldZ = tz;
                            ty = testY;
                            break;
                        }
                    }
                }
                let destLabel = `(${Math.round(worldX)}, ${Math.round(worldZ)})`;
                if (player.botType === 'TOREINBOTTO' && player.mode === 'VEHICLE' && player.onRailwayTrack) {
                    const nearestRail = findNearestRailwayPoint(worldX, worldZ);
                    worldX = nearestRail.x;
                    worldZ = nearestRail.z;
                    ty = getSurfaceHeight(worldX, worldZ) + 0.35;
                    if (Math.hypot(worldX - RAIL_TUNNEL_PORTAL_POS.x, worldZ - RAIL_TUNNEL_PORTAL_POS.z) < 75) {
                        worldX = RAIL_TUNNEL_PORTAL_POS.x;
                        worldZ = RAIL_TUNNEL_PORTAL_POS.z;
                        destLabel = 'Mainland Express Rail Tunnel Portal';
                    } else {
                        destLabel = 'Griffin Rock Railway Track';
                    }
                } else if (Math.hypot(worldX - HOSPITAL_POS.x, worldZ - HOSPITAL_POS.z) < 85) {
                    worldX = HOSPITAL_DROPOFF_PAD.x;
                    worldZ = HOSPITAL_DROPOFF_PAD.z;
                    ty = getSurfaceHeight(worldX, worldZ);
                    destLabel = 'Griffin Rock General Hospital';
                }
                const markerY = (canTraverseWater && isWaterPoint && !player.onRailwayTrack) ? -0.45 : Math.max(0.0, ty);

                player.waypoint.set(worldX, markerY, worldZ);
                player.hasWaypoint = true;
                setWaypointMarkerPos(worldX, markerY, worldZ);

                if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                spawnBurstParticles(worldX, markerY + 0.5, worldZ, 0xfacc15, 6, 0.8);
                showToast("AUTOPILOT SET", `Navigating to ${destLabel}`);
                closeTacticalMap();
            }


let minimapBgCanvas: HTMLCanvasElement | null = null;
let minimapBgW = 0;
let minimapBgH = 0;
let _lastNearestHintText = '';
let _nearestHintEl: HTMLElement | null = null;

function ensureMinimapBgCache(w: number, h: number) {
    if (minimapBgCanvas && minimapBgW === w && minimapBgH === h) return;
    minimapBgCanvas = document.createElement('canvas');
    minimapBgCanvas.width = w;
    minimapBgCanvas.height = h;
    minimapBgW = w;
    minimapBgH = h;

    const bgCtx = minimapBgCanvas.getContext('2d');
    if (!bgCtx) return;

    const cx = w / 2;
    const cy = h / 2;
    const mapScale = (cx * 0.70) / 1950;

    // Deep Ocean background
    bgCtx.fillStyle = '#082f49';
    bgCtx.beginPath();
    bgCtx.arc(cx, cy, cx, 0, Math.PI * 2);
    bgCtx.fill();

    // Main Island landmass
    bgCtx.fillStyle = '#166534';
    bgCtx.beginPath();
    bgCtx.arc(cx, cy, 1650 * mapScale, 0, Math.PI * 2);
    bgCtx.fill();

    // Wayward Island landmass
    const wix = cx + 1960 * mapScale;
    const wiz = cy + 540 * mapScale;
    bgCtx.fillStyle = '#14532d';
    bgCtx.beginPath();
    bgCtx.arc(wix, wiz, 340 * mapScale, 0, Math.PI * 2);
    bgCtx.fill();

    // Wayward Causeway Highway and Suspension Bridge
    bgCtx.strokeStyle = '#f59e0b';
    bgCtx.lineWidth = 2.4;
    bgCtx.beginPath();
    bgCtx.moveTo(cx + 1120 * mapScale, cy + 540 * mapScale);
    bgCtx.lineTo(cx + 1780 * mapScale, cy + 540 * mapScale);
    bgCtx.stroke();

    // Inner & Outer Coastal Highway Loops + Arterials
    bgCtx.strokeStyle = '#475569';
    bgCtx.lineWidth = 2.0;
    bgCtx.beginPath();
    bgCtx.arc(cx, cy, INNER_LOOP_RADIUS * mapScale, 0, Math.PI * 2);
    bgCtx.stroke();

    bgCtx.beginPath();
    bgCtx.arc(cx, cy, OUTER_LOOP_RADIUS * mapScale, 0, Math.PI * 2);
    bgCtx.stroke();

    bgCtx.beginPath();
    bgCtx.moveTo(cx, cy - 1140 * mapScale);
    bgCtx.lineTo(cx, cy + 1140 * mapScale);
    bgCtx.moveTo(cx - 1120 * mapScale, cy + 25 * mapScale);
    bgCtx.lineTo(cx + 1180 * mapScale, cy + 25 * mapScale);
    bgCtx.moveTo(cx + 1180 * mapScale, cy + 60 * mapScale);
    bgCtx.lineTo(cx + 1320 * mapScale, cy + 60 * mapScale);
    bgCtx.stroke();

    // Griffin Rock Island Railway Circuit Track
    bgCtx.save();
    bgCtx.strokeStyle = '#94a3b8';
    bgCtx.lineWidth = 1.6;
    bgCtx.setLineDash([4, 3]);
    bgCtx.beginPath();
    for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        const r = getRailwayRadius(theta) * mapScale;
        const mx = cx + Math.cos(theta) * r;
        const my = cy + Math.sin(theta) * r;
        if (i === 0) bgCtx.moveTo(mx, my);
        else bgCtx.lineTo(mx, my);
    }
    bgCtx.stroke();
    bgCtx.restore();

    // Rescue Bots HQ
    const hqx = cx + (typeof HQ_SWAP_PAD !== 'undefined' ? HQ_SWAP_PAD.x : 0) * mapScale;
    const hqz = cy + (typeof HQ_SWAP_PAD !== 'undefined' ? HQ_SWAP_PAD.z : -15) * mapScale;
    bgCtx.fillStyle = '#38bdf8';
    bgCtx.fillRect(hqx - 3.5, hqz - 3.5, 7, 7);
    bgCtx.strokeStyle = '#ffffff';
    bgCtx.lineWidth = 1;
    bgCtx.strokeRect(hqx - 3.5, hqz - 3.5, 7, 7);
}

        function drawMapChevron(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, size: number, fill: string, stroke?: string) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-heading + Math.PI);
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.moveTo(0, -size * 1.25);
            ctx.lineTo(size, size * 1.1);
            ctx.lineTo(0, size * 0.55);
            ctx.lineTo(-size, size * 1.1);
            ctx.closePath();
            ctx.fill();
            if (stroke) {
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1.4;
                ctx.stroke();
            }
            ctx.restore();
        }

        function setNearestHintText(hintText: string) {
            if (!_nearestHintEl) _nearestHintEl = document.getElementById('nearest-hazard-hint');
            if (_nearestHintEl && hintText !== _lastNearestHintText) {
                _lastNearestHintText = hintText;
                _nearestHintEl.textContent = hintText;
            }
        }

        function renderUndergroundRadar(
            ctx: CanvasRenderingContext2D,
            w: number,
            h: number,
            mapScale: number,
            isFullMap: boolean
        ) {
            const ug = getUndergroundMapData();
            const cx = w / 2;
            const cy = h / 2;
            const now = performance.now();
            const discIds: string[] = Array.isArray(progression.discoveredCavernLandmarks) ? progression.discoveredCavernLandmarks : [];

            // Background
            ctx.fillStyle = isFullMap ? '#050814' : '#0b1024';
            ctx.fillRect(0, 0, w, h);

            const cs = ug.cellSize * mapScale;

            // Fog-of-war explored 13x13 cavern cells
            for (let r = 0; r < ug.gridSize; r++) {
                for (let c = 0; c < ug.gridSize; c++) {
                    const idx = r * ug.gridSize + c;
                    const explored = ug.exploredSet.has(idx);
                    const cellLeft = cx + (-ug.halfWorld + c * ug.cellSize) * mapScale;
                    const cellTop = cy + (-ug.halfWorld + r * ug.cellSize) * mapScale;
                    ctx.fillStyle = explored ? '#1e293b' : '#090e1d';
                    ctx.fillRect(cellLeft + 0.5, cellTop + 0.5, cs - 1, cs - 1);
                }
            }

            // Underground Lagoon & Magma Core overlays
            const lcx = cx + ug.lagoon.x * mapScale;
            const lcz = cy + ug.lagoon.z * mapScale;
            ctx.fillStyle = 'rgba(6, 182, 212, 0.55)';
            ctx.beginPath();
            ctx.ellipse(lcx, lcz, ug.lagoon.rx * mapScale, ug.lagoon.rz * mapScale, 0, 0, Math.PI * 2);
            ctx.fill();

            const mcx = cx + ug.magma.x * mapScale;
            const mcz = cy + ug.magma.z * mapScale;
            ctx.fillStyle = 'rgba(249, 115, 22, 0.6)';
            ctx.beginPath();
            ctx.arc(mcx, mcz, ug.magma.r * mapScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#475569';
            ctx.fillRect(mcx - ug.magma.r * mapScale, mcz - 8 * mapScale, ug.magma.r * 2 * mapScale, 16 * mapScale);

            // Solid Maze Wall Edges (shown clearly around explored regions, subtle silhouette outside)
            ctx.lineCap = 'round';
            ug.edges.forEach(e => {
                if (e.open) return;
                const exploredNear = ug.exploredSet.has(e.r1 * ug.gridSize + e.c1) || ug.exploredSet.has(e.r2 * ug.gridSize + e.c2);
                if (e.cracked) {
                    if (e.broken) return;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = isFullMap ? 4.0 : 2.2;
                } else {
                    ctx.strokeStyle = exploredNear ? '#64748b' : 'rgba(51, 65, 85, 0.35)';
                    ctx.lineWidth = isFullMap ? 2.6 : 1.4;
                }
                const ex = cx + e.x * mapScale;
                const ez = cy + e.z * mapScale;
                ctx.beginPath();
                if (e.horizontal) {
                    ctx.moveTo(ex - cs * 0.5, ez);
                    ctx.lineTo(ex + cs * 0.5, ez);
                } else {
                    ctx.moveTo(ex, ez - cs * 0.5);
                    ctx.lineTo(ex, ez + cs * 0.5);
                }
                ctx.stroke();
            });

            // Outer Cavern Perimeter Frame
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = isFullMap ? 3.0 : 1.6;
            const boxSize = ug.halfWorld * 2 * mapScale;
            ctx.strokeRect(cx - boxSize * 0.5, cy - boxSize * 0.5, boxSize, boxSize);

            // Sunlit Exit Shafts (Gold Rings)
            (ug.exitShafts as UndergroundShaft[]).forEach(sh => {
                const sx = cx + sh.x * mapScale;
                const sz = cy + sh.z * mapScale;
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = isFullMap ? 2.2 : 1.3;
                ctx.beginPath();
                ctx.arc(sx, sz, isFullMap ? 8.5 : 4.2, 0, Math.PI * 2);
                ctx.stroke();
                if (isFullMap) {
                    ctx.fillStyle = '#fde047';
                    ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('EXIT SHAFT', sx, sz + 17);
                }
            });

            // Underground Hurt Citizens (Pulsing White & Red Medical Cross Markers)
            const ugPatients = getPatientsMapData().underground;
            ugPatients.forEach(pt => {
                const px = cx + pt.x * mapScale;
                const pz = cy + pt.z * mapScale;
                const r = isFullMap ? 6.5 : 3.8;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, pz, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = pt.category === 'MATERNITY' ? '#ec4899' : '#dc2626';
                ctx.lineWidth = isFullMap ? 1.8 : 1.1;
                ctx.stroke();
                ctx.fillStyle = pt.category === 'MATERNITY' ? '#ec4899' : '#dc2626';
                const arm = r * 0.62;
                const thick = r * 0.32;
                ctx.fillRect(px - thick * 0.5, pz - arm, thick, arm * 2);
                ctx.fillRect(px - arm, pz - thick * 0.5, arm * 2, thick);
                if (isFullMap) {
                    ctx.font = 'bold 8px Fredoka, sans-serif';
                    const lbl = pt.shortLabel.toUpperCase();
                    const tw = ctx.measureText(lbl).width;
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                    ctx.fillRect(px - tw / 2 - 3, pz - 19, tw + 6, 12);
                    ctx.fillStyle = '#fecaca';
                    ctx.textAlign = 'center';
                    ctx.fillText(lbl, px, pz - 10);
                }
            });

            // Collectible Gems inside explored corridors
            if (isFullMap) {
                (ug.gems as UndergroundGem[]).forEach(gem => {
                    if (gem.collected) return;
                    const gCellR = Math.floor((gem.z + ug.halfWorld) / ug.cellSize);
                    const gCellC = Math.floor((gem.x + ug.halfWorld) / ug.cellSize);
                    if (!ug.exploredSet.has(gCellR * ug.gridSize + gCellC)) return;
                    ctx.fillStyle = '#c084fc';
                    ctx.beginPath();
                    ctx.arc(cx + gem.x * mapScale, cy + gem.z * mapScale, 2.8, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // 7 Hidden Discoveries
            (ug.discoveries as UndergroundDiscovery[]).forEach(disc => {
                const found = discIds.includes(disc.id);
                const dx = cx + disc.x * mapScale;
                const dz = cy + disc.z * mapScale;
                if (!found && !isFullMap) return;
                ctx.fillStyle = found ? disc.color : 'rgba(148, 163, 184, 0.55)';
                ctx.beginPath();
                ctx.arc(dx, dz, isFullMap ? 6.0 : 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = isFullMap ? 1.5 : 0.9;
                ctx.stroke();

                if (isFullMap) {
                    const label = found ? disc.name : '???';
                    ctx.font = 'bold 9px "JetBrains Mono", monospace';
                    const lw = ctx.measureText(label).width;
                    ctx.fillStyle = 'rgba(11, 15, 30, 0.9)';
                    ctx.fillRect(dx - lw * 0.5 - 4, dz - 20, lw + 8, 13);
                    ctx.fillStyle = found ? disc.color : '#cbd5e1';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, dx, dz - 10);
                }
            });

            // Roaming Dinosaurs (sonar ping blips)
            (ug.dinos as UndergroundDino[]).forEach(d => {
                const dR = Math.floor((d.z + ug.halfWorld) / ug.cellSize);
                const dC = Math.floor((d.x + ug.halfWorld) / ug.cellSize);
                const nearPlayer = Math.hypot(d.x - player.pos.x, d.z - player.pos.z) < 95;
                if (!ug.exploredSet.has(dR * ug.gridSize + dC) && !nearPlayer) return;
                ctx.fillStyle = d.isBig ? '#fb7185' : '#4ade80';
                ctx.beginPath();
                ctx.arc(cx + d.x * mapScale, cy + d.z * mapScale, isFullMap ? (d.isBig ? 4.8 : 3.4) : 2.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Active Waypoint Marker
            if (player.hasWaypoint && isFullMap) {
                const wx = cx + player.waypoint.x * mapScale;
                const wz = cy + player.waypoint.z * mapScale;
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(wx, wz, 8 + Math.sin(now * 0.01) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw Uncollected Sigma Repair Parts (pulsing cyan/amber beacons!)
            if (Array.isArray(ug.sigmaParts)) {
                (ug.sigmaParts as UndergroundSigmaPart[]).forEach(part => {
                    if (part.collected) return;
                    const px = cx + part.x * mapScale;
                    const pz = cy + part.z * mapScale;
                    const pulse = 1 + Math.sin(now * 0.008) * 0.25;
                    ctx.fillStyle = '#22d3ee';
                    ctx.beginPath();
                    ctx.arc(px, pz, (isFullMap ? 6 : 3.6) * pulse, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = isFullMap ? 2 : 1.2;
                    ctx.stroke();
                    if (isFullMap) {
                        ctx.font = '700 10px Fredoka, sans-serif';
                        ctx.fillStyle = '#67e8f9';
                        ctx.textAlign = 'center';
                        ctx.fillText(part.name, px, pz - 10);
                    }
                });
            }

            // Buddy & Player Chevrons
            if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                drawMapChevron(ctx, cx + buddyBot.pos.x * mapScale, cy + buddyBot.pos.z * mapScale, buddyBot.heading, isFullMap ? 7 : 4.2, '#38bdf8', '#ffffff');
            }
            drawMapChevron(ctx, cx + player.pos.x * mapScale, cy + player.pos.z * mapScale, player.heading, isFullMap ? 9 : 5.2, '#facc15', '#ffffff');

            if (!isFullMap) {
                setNearestHintText(`Secrets: ${discIds.length}/${ug.discoveries.length} • Gems: ${progression.cavernGemsCollected || 0}`);
            } else {
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                const countEl = document.getElementById('tactical-active-emergencies-count');
                if (titleEl) titleEl.textContent = 'GRIFFIN ROCK CAVERNS SONAR';
                if (subEl) subEl.textContent = 'Subterranean Maze Mapping • Tap anywhere to navigate tunnels';
                if (pillEl) pillEl.textContent = 'SONAR ACTIVE';
                if (gridEl) gridEl.textContent = 'DEPTH: -120M // 13x13 GRID';
                if (countEl) countEl.textContent = `SECRETS: ${discIds.length} / ${ug.discoveries.length}`;
            }
        }

        // 10A. CLEAN & UNCLUTTERED HUD MINIMAP (160x160 circular dial)
        // =====================================================================
        export function renderMinimap() {
            ensureMapCanvases();
            if (!mCtx || !minimapCanvas) return;
            const ctx = mCtx;
            const w = minimapCanvas.width;
            const h = minimapCanvas.height;
            const cx = w / 2;
            const cy = h / 2;

            if (worldState.activeArea === 'UNDERGROUND') {
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                const ugMiniScale = (cx * 0.80) / 234;
                renderUndergroundRadar(ctx, w, h, ugMiniScale, false);
                ctx.restore();
                return;
            }

            if (worldState.activeArea === 'SPACE') {
                const sp = window.getSpaceMapData?.();
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = '#020617';
                ctx.fillRect(0, 0, w, h);
                // Radar grid rings
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
                ctx.lineWidth = 1;
                [0.32, 0.62, 0.9].forEach(r => {
                    ctx.beginPath();
                    ctx.arc(cx, cy, cx * r, 0, Math.PI * 2);
                    ctx.stroke();
                });
                if (sp) {
                    const sc = (cx * 0.85) / (sp.bounds || 460);
                    // Moon
                    ctx.fillStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.arc(cx + sp.moonPos.x * sc, cy + sp.moonPos.z * sc, 9, 0, Math.PI * 2);
                    ctx.fill();
                    if (sp.sectorId === 'MOON_ORBIT' || !sp.sectorId) {
                        ctx.strokeStyle = '#22d3ee';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    } else {
                        sp.sectorMoons?.forEach((m) => {
                            ctx.fillStyle = m.landablePlanetId ? '#38bdf8' : '#cbd5e1';
                            ctx.beginPath();
                            ctx.arc(cx + m.pos.x * sc, cy + m.pos.z * sc, m.landablePlanetId ? 6.5 : 5, 0, Math.PI * 2);
                            ctx.fill();
                            if (m.landablePlanetId) {
                                ctx.strokeStyle = '#fbbf24';
                                ctx.lineWidth = 1.6;
                                ctx.stroke();
                            }
                        });
                        if (sp.saturnRaceGatePos) {
                            ctx.fillStyle = '#facc15';
                            ctx.beginPath();
                            ctx.arc(cx + sp.saturnRaceGatePos.x * sc, cy + sp.saturnRaceGatePos.z * sc, 5.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    // Autobot Orbital Station
                    ctx.fillStyle = '#4ade80';
                    ctx.fillRect(cx + sp.stationPos.x * sc - 4, cy + sp.stationPos.z * sc - 4, 8, 8);
                    // Satellites & Stranded Pods
                    sp.satellites?.forEach((s) => {
                        ctx.fillStyle = s.repaired ? '#22d3ee' : '#ef4444';
                        ctx.beginPath();
                        ctx.arc(cx + s.pos.x * sc, cy + s.pos.z * sc, 3, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    sp.pods?.forEach((p) => {
                        if (p.rescued) return;
                        ctx.fillStyle = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(cx + p.pos.x * sc, cy + p.pos.z * sc, 3.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    // Active Star-Ring
                    const activeRing = sp.starRings?.[sp.ship.activeRingIdx];
                    if (activeRing) {
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + activeRing.pos.x * sc, cy + activeRing.pos.z * sc, 5, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    // Starship Sigma Chevron
                    drawMapChevron(ctx, cx + sp.ship.pos.x * sc, cy + sp.ship.pos.z * sc, sp.ship.yaw + Math.PI, 5.5, '#38bdf8', '#ffffff');
                }
                ctx.restore();
                const hint = sp?.sectorId === 'JUPITER'
                    ? 'Jupiter Orbit • Explore 4 Moons & Land on Europa!'
                    : (sp?.sectorId === 'URANUS'
                        ? 'Uranus Orbit • Fly Vertical Rings & Land on Miranda!'
                        : (sp?.sectorId === 'NEPTUNE'
                            ? 'Neptune Orbit • Land on Triton to Rescue Starspeed!'
                            : 'Orbit: Blast Asteroids • Repair Sats • Land on Moon!'));
                setNearestHintText(hint);
                return;
            }

            if (worldState.activeArea === 'SOLAR_HUB') {
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = '#030712';
                ctx.fillRect(0, 0, w, h);
                [0.24, 0.42, 0.62, 0.82].forEach(f => {
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cx * f, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(cx, cy, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                setNearestHintText('3D Solar System Hub • Tap any planet to warp!');
                return;
            }

            if (worldState.activeArea === 'SATURN_RING_RACE') {
                const sr = window.getSaturnRaceMapData?.();
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = '#040714';
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(cx, cy, cx * 0.36, 0, Math.PI * 2);
                ctx.fill();
                const rPx = cx * 0.72;
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
                ctx.stroke();
                if (sr) {
                    const nextG = sr.gates?.[sr.nextGateIdx];
                    if (nextG) {
                        ctx.fillStyle = '#facc15';
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(nextG.angle) * rPx, cy + Math.sin(nextG.angle) * rPx, 4.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    sr.rivals?.forEach((rv) => {
                        ctx.fillStyle = rv.colorHex || '#f472b6';
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(rv.angle) * rPx, cy + Math.sin(rv.angle) * rPx, 3.4, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    const px = cx + Math.cos(sr.angle) * rPx;
                    const py = cy + Math.sin(sr.angle) * rPx;
                    drawMapChevron(ctx, px, py, player.heading, 5.2, '#22d3ee', '#ffffff');
                }
                ctx.restore();
                setNearestHintText('Saturn Ring Race • Sprint through all 12 Turbo Gates!');
                return;
            }

            if (worldState.activeArea === 'UNDERWATER') {
                const uw = window.getUnderwaterMapData?.();
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = '#052e4a';
                ctx.fillRect(0, 0, w, h);
                if (uw) {
                    const sc = (cx * 0.85) / uw.radius;
                    uw.landmarks.forEach((lm) => {
                        ctx.fillStyle = lm.color;
                        ctx.beginPath();
                        ctx.arc(cx + lm.x * sc, cy + lm.z * sc, 4.5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    uw.relics.forEach((rel) => {
                        if (rel.collected) return;
                        ctx.fillStyle = '#facc15';
                        ctx.beginPath();
                        ctx.arc(cx + rel.x * sc, cy + rel.z * sc, 3.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    const activeRg = uw.rings[uw.activeRingIdx];
                    if (activeRg) {
                        ctx.strokeStyle = '#facc15';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + activeRg.x * sc, cy + activeRg.z * sc, 4.5, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    drawMapChevron(ctx, cx + uw.subPos.x * sc, cy + uw.subPos.z * sc, uw.subHeading, 5.5, '#38bdf8', '#ffffff');
                }
                ctx.restore();
                setNearestHintText('Griffin Rock Deep Ocean • Tap Sonar (F) to ping landmarks!');
                return;
            }

            if (worldState.activeArea === 'PLANET_CAVERN') {
                const pc = getPlanetCavernMapData();
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = pc.theme.floorHex || '#0f172a';
                ctx.fillRect(0, 0, w, h);
                const sc = (cx * 0.85) / pc.radius;
                if (pc.theme.hasWaterLagoon) {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.55)';
                    ctx.beginPath();
                    ctx.arc(cx + (-95) * sc, cy + 55 * sc, 160 * sc, 0, Math.PI * 2);
                    ctx.fill();
                }
                pc.colliders.forEach(c => {
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
                    ctx.beginPath();
                    ctx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                    ctx.fill();
                });
                pc.gems.forEach(g => {
                    if (g.collected) return;
                    ctx.fillStyle = '#22d3ee';
                    ctx.beginPath();
                    ctx.arc(cx + g.x * sc, cy + g.z * sc, 2.4, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
                ctx.fill();
                if (!pc.relicCollected) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(cx + pc.relicPos.x * sc, cy + pc.relicPos.z * sc, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                drawMapChevron(ctx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 5.2, '#22d3ee', '#ffffff');
                ctx.restore();
                setNearestHintText(`${pc.theme.name} Caverns • ${pc.theme.cavernTitle}`);
                return;
            }

            if (worldState.activeArea === 'PLANET_SURFACE') {
                const pd = window.getPlanetSurfaceMapData?.() as (ReturnType<NonNullable<typeof window.getPlanetSurfaceMapData>> & {
                    cavePos?: { x: number; z: number };
                    islands?: Array<{ x: number; z: number; r: number }>;
                    volcanoes?: Array<{ name: string; x: number; z: number; radius: number }>;
                    isWaterWorld?: boolean;
                }) | undefined;
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = pd?.isWaterWorld ? '#0369a1' : (pd?.config?.groundAccentHex || '#1e293b');
                ctx.fillRect(0, 0, w, h);
                if (pd) {
                    const sc = (cx * 0.85) / (pd.radius || 560);
                    if (pd.isWaterWorld && pd.islands) {
                        pd.islands.forEach((isl) => {
                            ctx.fillStyle = '#bae6fd';
                            ctx.beginPath();
                            ctx.arc(cx + isl.x * sc, cy + isl.z * sc, isl.r * sc, 0, Math.PI * 2);
                            ctx.fill();
                        });
                    }
                    pd.volcanoes?.forEach((v) => {
                        ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
                        ctx.strokeStyle = '#f97316';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.arc(cx + v.x * sc, cy + v.z * sc, Math.max(4, v.radius * 0.45 * sc), 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    });
                    pd.craters?.forEach((c) => {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    ctx.fillStyle = '#22d3ee';
                    ctx.beginPath();
                    ctx.arc(cx + pd.sigmaPos.x * sc, cy + pd.sigmaPos.z * sc, 5, 0, Math.PI * 2);
                    ctx.fill();
                    if (pd.cavePos) {
                        ctx.fillStyle = '#d97706';
                        ctx.beginPath();
                        ctx.arc(cx + pd.cavePos.x * sc, cy + pd.cavePos.z * sc, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    pd.relics?.forEach((r) => {
                        if (r.collected) return;
                        ctx.fillStyle = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(cx + r.x * sc, cy + r.z * sc, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    if (pd.frozenStarspeed) {
                        ctx.fillStyle = '#38bdf8';
                        ctx.strokeStyle = '#facc15';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + pd.frozenStarspeed.x * sc, cy + pd.frozenStarspeed.z * sc, 5.2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                    drawMapChevron(ctx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 5.2, '#facc15', '#ffffff');
                }
                ctx.restore();
                setNearestHintText(`${pd?.config?.name || 'Planet'} • ${pd?.config?.gravityLabel || ''}${pd?.frozenStarspeed ? ' • SOS Signal Detected!' : ''}`);
                return;
            }

            if (worldState.activeArea === 'MOON') {
                const md = window.getMoonMapData?.();
                ctx.clearRect(0, 0, w, h);
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, cx, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 0, w, h);
                if (md) {
                    const sc = (cx * 0.85) / (md.radius || 580);
                    md.craters?.forEach((c) => {
                        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    // Sigma Pad
                    ctx.fillStyle = '#22d3ee';
                    ctx.beginPath();
                    ctx.arc(cx + md.sigmaPos.x * sc, cy + md.sigmaPos.z * sc, 5, 0, Math.PI * 2);
                    ctx.fill();
                    // Uncollected Lunar Relics
                    md.relics?.forEach((r) => {
                        if (r.collected) return;
                        ctx.fillStyle = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(cx + r.x * sc, cy + r.z * sc, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    drawMapChevron(ctx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 5.2, '#facc15', '#ffffff');
                }
                ctx.restore();
                setNearestHintText(`Moon Base • Relics: ${(progression.moonRelicsFound || []).length}/5 • 0.35G`);
                return;
            }

            const mapScale = (cx * 0.70) / 1950;

            ensureMinimapBgCache(w, h);
            ctx.clearRect(0, 0, w, h);
            if (minimapBgCanvas) {
                ctx.drawImage(minimapBgCanvas, 0, 0);
            }

            // Moving Griffin Rock Express Train
            const miniTrain = islandTrain as unknown as TrainData | null | undefined;
            if (miniTrain && miniTrain.cars.length > 0) {
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                for (let i = 0; i < miniTrain.cars.length; i++) {
                    const car = miniTrain.cars[i];
                    const cmx = cx + car.x * mapScale;
                    const cmy = cy + car.z * mapScale;
                    if (i === 0) ctx.moveTo(cmx, cmy);
                    else ctx.lineTo(cmx, cmy);
                }
                ctx.stroke();

                const loco = miniTrain.cars[0];
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(cx + loco.x * mapScale, cy + loco.z * mapScale, 3.2, 0, Math.PI * 2);
                ctx.fill();

                const caboose = miniTrain.cars[miniTrain.cars.length - 1];
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(cx + caboose.x * mapScale, cy + caboose.z * mapScale, 2.6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Live MorBot Radar Blip when Boss Battle is Active
            if (typeof morbotBattle !== 'undefined' && morbotBattle && (morbotBattle.state === 'PURSUIT' || morbotBattle.state === 'ROBOT')) {
                const mbx = cx + morbotBattle.pos.x * mapScale;
                const mbz = cy + morbotBattle.pos.z * mapScale;
                const pulseRing = 5.0 + Math.sin(performance.now() * 0.008) * 3.0;

                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(mbx, mbz, pulseRing, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(mbx, mbz, 4.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }

            // Draw 8 Emergency Beacons (High-Contrast, Clean Dots)
            let nearestDist = Infinity;
            let nearestName = "All Clear!";
            const miniBeacons = beacons as unknown as BeaconEntry[];

            for (let bIdx = 0; bIdx < miniBeacons.length; bIdx++) {
                const b = miniBeacons[bIdx];
                const bx = cx + b.x * mapScale;
                const bz = cy + b.z * mapScale;

                if (!b.restored) {
                    const d = Math.hypot(player.pos.x - b.x, player.pos.z - b.z);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearestName = `${b.name} (${Math.round(d)}m)`;
                    }
                }

                ctx.fillStyle = b.restored ? '#4ade80' : (b.type === 'FIRE' ? '#fb923c' : (b.type === 'TEAMUP' ? '#38bdf8' : '#f43f5e'));
                ctx.beginPath();
                ctx.arc(bx, bz, b.restored ? 2.8 : 4.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }

            if (!_nearestHintEl) _nearestHintEl = document.getElementById('nearest-hazard-hint');
            if (_nearestHintEl) {
                const hintText = nearestDist < Infinity ? `Nearest: ${nearestName}` : `All 8 Emergencies Resolved!`;
                if (hintText !== _lastNearestHintText) {
                    _lastNearestHintText = hintText;
                    _nearestHintEl.textContent = hintText;
                }
            }

            // Draw Undocked Mega Mode Attachments on Minimap
            if (typeof WORLD_MEGA_LOCATIONS !== 'undefined') {
                const megaLocations = WORLD_MEGA_LOCATIONS as Record<string, { x: number; z: number; rotY: number } | undefined>;
                for (const botKey in megaLocations) {
                    const loc = megaLocations[botKey];
                    if (!loc || isBotDocked(botKey)) continue;
                    const mx = cx + loc.x * mapScale;
                    const mz = cy + loc.z * mapScale;
                    const meta = MEGA_ATTACHMENT_META[botKey];
                    ctx.fillStyle = meta ? meta.color : '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(mx, mz, 2.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 0.9;
                    ctx.stroke();
                }
            }

            // Draw Griffin Rock General Hospital (+ Medical Emblem) & Waiting Hurt Citizens on Surface Minimap
            {
                const pData = getPatientsMapData();
                const hx = cx + pData.hospitalPos.x * mapScale;
                const hz = cy + pData.hospitalPos.z * mapScale;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(hx - 4.2, hz - 4.2, 8.4, 8.4);
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(hx - 4.2, hz - 4.2, 8.4, 8.4);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(hx - 1.1, hz - 2.9, 2.2, 5.8);
                ctx.fillRect(hx - 2.9, hz - 1.1, 5.8, 2.2);

                pData.surface.forEach(pt => {
                    const px = cx + pt.x * mapScale;
                    const pz = cy + pt.z * mapScale;
                    const col = pt.category === 'MATERNITY' ? '#ec4899' : '#ef4444';
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px, pz, 3.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = col;
                    ctx.lineWidth = 1.0;
                    ctx.stroke();
                    ctx.fillStyle = col;
                    ctx.fillRect(px - 0.7, pz - 2.0, 1.4, 4.0);
                    ctx.fillRect(px - 2.0, pz - 0.7, 4.0, 1.4);
                });
            }

            // Draw Buddy Bot Arrow (Cyan Wingman Chevron)
            if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                const bx = cx + buddyBot.pos.x * mapScale;
                const bz = cy + buddyBot.pos.z * mapScale;
                ctx.save();
                ctx.translate(bx, bz);
                ctx.rotate(-buddyBot.heading + Math.PI);
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.moveTo(0, -5.5);
                ctx.lineTo(4.5, 5);
                ctx.lineTo(0, 2.5);
                ctx.lineTo(-4.5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Draw Active Player Arrow (Bright Gold Chevron)
            const px = cx + player.pos.x * mapScale;
            const pz = cy + player.pos.z * mapScale;
            ctx.save();
            ctx.translate(px, pz);
            ctx.rotate(-player.heading + Math.PI);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(5.5, 6);
            ctx.lineTo(0, 3);
            ctx.lineTo(-5.5, 6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // =====================================================================
        // 10B. HIGH-RESOLUTION TACTICAL ISLAND MAP OVERLAY RENDERER (720x720)
        // =====================================================================
        export function renderTacticalMap() {
            ensureMapCanvases();
            if (!tCtx || !tacticalMapCanvas) return;
            const ctx = tCtx;
            const w = tacticalMapCanvas.width;
            const h = tacticalMapCanvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const now = performance.now();

            // Clear Canvas
            ctx.clearRect(0, 0, w, h);

            if (worldState.activeArea === 'UNDERGROUND') {
                const ugFullScale = (cx * 0.84) / 234;
                renderUndergroundRadar(ctx, w, h, ugFullScale, true);
                return;
            }

            if (worldState.activeArea === 'SPACE') {
                const sp = window.getSpaceMapData?.();
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                const countEl = document.getElementById('tactical-active-emergencies-count');
                if (titleEl) titleEl.textContent = 'GRIFFIN ROCK ORBITAL COMMAND RADAR';
                if (subEl) subEl.textContent = 'Deep-Space Telemetry • Tap any station, satellite, ring or coordinate to auto-fly';
                if (pillEl) pillEl.textContent = 'ORBITAL SCAN';
                if (gridEl) gridEl.textContent = 'SECTOR: SOL-3 // ORBIT';
                if (countEl) countEl.textContent = `ASTEROIDS: ${progression.spaceAsteroidsCleared || 0} • RESCUES: ${progression.spaceRescuesDone || 0}`;

                const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, cx * 1.05);
                bgGrad.addColorStop(0, '#07142b');
                bgGrad.addColorStop(0.7, '#030917');
                bgGrad.addColorStop(1, '#01040a');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                const sc = (cx * 0.84) / (sp?.bounds || 460);
                // Radar range rings
                [150, 300, 450].forEach(dist => {
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
                    ctx.setLineDash([4, 6]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, dist * sc, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
                    ctx.font = 'bold 9px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${dist}M`, cx, cy - dist * sc - 4);
                });
                ctx.setLineDash([]);

                if (sp) {
                    const drawPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        ctx.fillStyle = col;
                        ctx.beginPath();
                        ctx.arc(px, pz, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = ctx.measureText(label).width;
                        ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        ctx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        ctx.fillStyle = '#f8fafc';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, px, pz + r + 14);
                    };

                    // Star-Ring Course Loop
                    if (Array.isArray(sp.starRings) && sp.starRings.length > 0) {
                        ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        sp.starRings.forEach((r, idx: number) => {
                            const rx = cx + r.pos.x * sc;
                            const rz = cy + r.pos.z * sc;
                            if (idx === 0) ctx.moveTo(rx, rz);
                            else ctx.lineTo(rx, rz);
                        });
                        ctx.closePath();
                        ctx.stroke();
                        ctx.setLineDash([]);

                        sp.starRings.forEach((r, idx: number) => {
                            const isAct = idx === sp.ship.activeRingIdx;
                            const rx = cx + r.pos.x * sc;
                            const rz = cy + r.pos.z * sc;
                            ctx.strokeStyle = isAct ? '#fbbf24' : '#22d3ee';
                            ctx.lineWidth = isAct ? 2.5 : 1.3;
                            ctx.beginPath();
                            ctx.arc(rx, rz, isAct ? 8 : 5, 0, Math.PI * 2);
                            ctx.stroke();
                        });
                    }

                    // Asteroids
                    sp.asteroids?.forEach((a) => {
                        if (!a.alive) return;
                        ctx.fillStyle = '#78716c';
                        ctx.beginPath();
                        ctx.arc(cx + a.pos.x * sc, cy + a.pos.z * sc, 3.2, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    // Moon & Lunar Landing Ring OR Gas/Ice Giant Sector Moons
                    if (sp.sectorId === 'MOON_ORBIT' || !sp.sectorId) {
                        drawPin(sp.moonPos.x, sp.moonPos.z, 26, '#94a3b8', 'THE MOON');
                        drawPin(sp.moonLandingPos?.x ?? 0, sp.moonLandingPos?.z ?? -238, 8, '#22d3ee', 'LUNAR LANDING ZONE');
                        if (sp.moroccoStation) {
                            const ms = sp.moroccoStation;
                            drawPin(
                                ms.pos.x,
                                ms.pos.z,
                                11,
                                ms.defeated ? '#64748b' : '#a855f7',
                                ms.defeated ? "MOROCCO STATION (DISABLED)" : `MOROCCO LASER STATION (${ms.hp}/${ms.maxHp} HP)`
                            );
                        }
                    } else {
                        const titleEl = document.getElementById('tactical-map-title');
                        if (titleEl) titleEl.textContent = `${sp.sectorId} ORBITAL SECTOR CHART`;
                        sp.sectorMoons?.forEach((m) => {
                            drawPin(m.pos.x, m.pos.z, m.landablePlanetId ? 15 : 11, m.landablePlanetId ? '#38bdf8' : '#cbd5e1', m.name.toUpperCase());
                            if (m.beaconRing) {
                                drawPin(m.landingPos.x, m.landingPos.z, 7, '#fbbf24', `LAND ON ${m.id}`);
                            }
                        });
                        if (sp.saturnRaceGatePos) {
                            drawPin(sp.saturnRaceGatePos.x, sp.saturnRaceGatePos.z, 10, '#facc15', 'SATURN RING GRAND PRIX');
                        }
                    }

                    // Autobot Orbital Station
                    drawPin(sp.stationPos.x, sp.stationPos.z, 10, '#4ade80', 'AUTOBOT ORBITAL STATION');

                    // Satellites & Pods
                    sp.satellites?.forEach((s) => {
                        drawPin(s.pos.x, s.pos.z, 5.5, s.repaired ? '#38bdf8' : '#ef4444', s.name);
                    });
                    sp.pods?.forEach((p) => {
                        if (!p.rescued) drawPin(p.pos.x, p.pos.z, 5.5, '#fbbf24', p.name);
                    });

                    // Starship Sigma Chevron
                    drawMapChevron(ctx, cx + sp.ship.pos.x * sc, cy + sp.ship.pos.z * sc, sp.ship.yaw + Math.PI, 9.5, '#38bdf8', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'UNDERWATER') {
                const uw = window.getUnderwaterMapData?.();
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                const countEl = document.getElementById('tactical-active-emergencies-count');
                if (titleEl) titleEl.textContent = 'GRIFFIN ROCK DEEP-SEA SONAR CHART';
                if (subEl) subEl.textContent = 'High Tide 3D Underwater Exploration • Tap any landmark to swim there';
                if (pillEl) pillEl.textContent = 'UNDERWATER';
                if (gridEl) gridEl.textContent = `DEPTH: ${uw ? Math.max(0, Math.round(uw.surfaceY - uw.subPos.y)) : 0}m`;
                const foundLm = uw ? uw.landmarks.filter((l) => l.discovered).length : 0;
                if (countEl) countEl.textContent = `SITES: ${foundLm} / ${uw?.landmarks.length || 5}`;

                const bgGrad = ctx.createRadialGradient(cx, cy, 35, cx, cy, cx * 1.05);
                bgGrad.addColorStop(0, '#0c4a6e');
                bgGrad.addColorStop(0.7, '#062c47');
                bgGrad.addColorStop(1, '#021627');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                if (uw) {
                    const sc = (cx * 0.84) / uw.radius;
                    // Depth contour rings
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
                    ctx.lineWidth = 1.5;
                    [160, 310, 440].forEach((rad) => {
                        ctx.beginPath();
                        ctx.arc(cx, cy, rad * sc, 0, Math.PI * 2);
                        ctx.stroke();
                    });

                    const drawUwPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        ctx.fillStyle = col;
                        ctx.beginPath();
                        ctx.arc(px, pz, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = ctx.measureText(label).width;
                        ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        ctx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        ctx.fillStyle = '#f8fafc';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, px, pz + r + 14);
                    };

                    uw.crystals.forEach((c) => {
                        if (c.collected) return;
                        ctx.fillStyle = '#22d3ee';
                        ctx.beginPath();
                        ctx.arc(cx + c.x * sc, cy + c.z * sc, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    uw.landmarks.forEach((lm) => {
                        drawUwPin(lm.x, lm.z, 8.5, lm.color, lm.name.toUpperCase());
                    });
                    uw.relics.forEach((rel) => {
                        if (!rel.collected) drawUwPin(rel.x, rel.z, 5.5, '#facc15', rel.name.toUpperCase());
                    });
                    const activeRg = uw.rings[uw.activeRingIdx];
                    if (activeRg) {
                        drawUwPin(activeRg.x, activeRg.z, 7, '#facc15', `TRAINING RING ${uw.activeRingIdx + 1}/${uw.rings.length}`);
                    }
                    drawMapChevron(ctx, cx + uw.subPos.x * sc, cy + uw.subPos.z * sc, uw.subHeading, 9.5, '#38bdf8', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'PLANET_CAVERN') {
                const pc = getPlanetCavernMapData();
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                const countEl = document.getElementById('tactical-active-emergencies-count');
                if (titleEl) titleEl.textContent = `${pc.theme.name} — ${pc.theme.cavernTitle}`;
                if (subEl) subEl.textContent = 'Subterranean Cavern Network • Tap anywhere to navigate';
                if (pillEl) pillEl.textContent = 'UNDERGROUND';
                if (gridEl) gridEl.textContent = `CAVERN: ${pc.theme.id}`;
                if (countEl) countEl.textContent = pc.relicCollected ? 'RELIC: 1 / 1' : 'RELIC: 0 / 1';

                ctx.fillStyle = pc.theme.floorHex || '#0f172a';
                ctx.fillRect(0, 0, w, h);
                const sc = (cx * 0.84) / pc.radius;
                if (pc.theme.hasWaterLagoon) {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
                    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(cx + (-95) * sc, cy + 55 * sc, 160 * sc, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                pc.colliders.forEach(c => {
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
                    ctx.beginPath();
                    ctx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                    ctx.fill();
                });
                pc.gems.forEach((g) => {
                    if (g.collected) return;
                    ctx.fillStyle = '#22d3ee';
                    ctx.beginPath();
                    ctx.arc(cx + g.x * sc, cy + g.z * sc, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
                const drawCavPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                    const px = cx + wx * sc;
                    const pz = cy + wz * sc;
                    ctx.fillStyle = col;
                    ctx.beginPath();
                    ctx.arc(px, pz, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.font = 'bold 9.5px Fredoka, sans-serif';
                    const tw = ctx.measureText(label).width;
                    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                    ctx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                    ctx.fillStyle = '#f8fafc';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, px, pz + r + 14);
                };
                drawCavPin(0, 0, 8.5, '#facc15', 'SURFACE EXIT SHAFT');
                if (!pc.relicCollected) drawCavPin(pc.relicPos.x, pc.relicPos.z, 7.5, '#fbbf24', pc.theme.relicName.toUpperCase());
                pc.resonanceNodes.forEach((rn, idx) => {
                    if (!rn.activated) drawCavPin(rn.x, rn.z, 6, '#f43f5e', `RESONANCE CRYSTAL ${idx + 1}`);
                });
                drawMapChevron(ctx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 9.5, '#22d3ee', '#ffffff');
                return;
            }

            if (worldState.activeArea === 'PLANET_SURFACE') {
                const pd = window.getPlanetSurfaceMapData?.() as (ReturnType<NonNullable<typeof window.getPlanetSurfaceMapData>> & {
                    cavePos?: { x: number; z: number };
                    islands?: Array<{ x: number; z: number; r: number }>;
                    volcanoes?: Array<{ name: string; x: number; z: number; radius: number }>;
                    isWaterWorld?: boolean;
                    monoliths?: Array<{ name: string; x: number; z: number; scanned: boolean }>;
                }) | undefined;
                const cfg = pd?.config;
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                const countEl = document.getElementById('tactical-active-emergencies-count');
                if (titleEl) titleEl.textContent = `${cfg?.name || 'PLANET'} TACTICAL SURVEY MAP`;
                if (subEl) subEl.textContent = `${cfg?.zoneLabel || 'Planetary Surface'} • Tap anywhere to navigate`;
                if (pillEl) pillEl.textContent = `${cfg?.gravityLabel || '0.38G'} SURFACE`;
                if (gridEl) gridEl.textContent = `WORLD: ${cfg?.id || 'PLANET'}`;
                const foundHere = (pd?.relics || []).filter((r) => r.collected).length;
                if (countEl) countEl.textContent = `RELICS: ${foundHere} / ${(pd?.relics || []).length}`;

                if (pd?.isWaterWorld) {
                    ctx.fillStyle = '#0369a1';
                    ctx.fillRect(0, 0, w, h);
                } else {
                    const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, cx * 1.05);
                    bgGrad.addColorStop(0, cfg?.groundBaseHex || '#334155');
                    bgGrad.addColorStop(0.8, cfg?.groundAccentHex || '#1e293b');
                    bgGrad.addColorStop(1, '#0f172a');
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, 0, w, h);
                }

                const sc = (cx * 0.84) / (pd?.radius || 560);
                if (pd) {
                    if (pd.isWaterWorld && pd.islands) {
                        pd.islands.forEach((isl) => {
                            ctx.fillStyle = '#e0f2fe';
                            ctx.strokeStyle = '#7dd3fc';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.arc(cx + isl.x * sc, cy + isl.z * sc, isl.r * sc, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        });
                    }
                    pd.craters?.forEach((c) => {
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
                        ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    });

                    const drawPlanetaryPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        ctx.fillStyle = col;
                        ctx.beginPath();
                        ctx.arc(px, pz, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = ctx.measureText(label).width;
                        ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        ctx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        ctx.fillStyle = '#f8fafc';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, px, pz + r + 14);
                    };

                    drawPlanetaryPin(pd.sigmaPos.x, pd.sigmaPos.z, 9, '#22d3ee', 'STARSHIP SIGMA PAD');
                    if (pd.cavePos) drawPlanetaryPin(pd.cavePos.x, pd.cavePos.z, 7.5, '#d97706', 'CAVE ENTRANCE');
                    pd.volcanoes?.forEach((v) => {
                        drawPlanetaryPin(v.x, v.z, 7.5, '#ef4444', v.name.toUpperCase());
                    });
                    pd.monoliths?.forEach((m) => {
                        if (!m.scanned) drawPlanetaryPin(m.x, m.z, 6, '#a855f7', m.name.toUpperCase());
                    });
                    pd.vents?.forEach((v) => {
                        drawPlanetaryPin(v.x, v.z, 5.5, '#f97316', v.label.toUpperCase());
                    });
                    pd.relics?.forEach((r) => {
                        if (!r.collected) drawPlanetaryPin(r.x, r.z, 6.5, '#fbbf24', r.name.toUpperCase());
                    });
                    if (pd.frozenStarspeed) {
                        drawPlanetaryPin(pd.frozenStarspeed.x, pd.frozenStarspeed.z, 9, '#38bdf8', 'FROZEN SOS SIGNAL (STARSPEED)');
                    }
                    drawMapChevron(ctx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 9.5, '#facc15', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'SATURN_RING_RACE') {
                const sr = window.getSaturnRaceMapData?.();
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                if (titleEl) titleEl.textContent = 'SATURN ICY RING CIRCUIT RADAR';
                if (subEl) subEl.textContent = '360° Bot-Mode Ring Highway • 12 Sequential Turbo Boost Gates';
                if (pillEl) pillEl.textContent = 'RING RACE';
                if (gridEl) gridEl.textContent = 'SECTOR: SATURN-R1';

                ctx.fillStyle = '#040714';
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(cx, cy, cx * 0.34, 0, Math.PI * 2);
                ctx.fill();
                const rPx = cx * 0.72;
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
                ctx.lineWidth = 18;
                ctx.beginPath();
                ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
                ctx.stroke();
                if (sr) {
                    sr.gates?.forEach((g, idx: number) => {
                        const isNext = idx === sr.nextGateIdx;
                        ctx.fillStyle = isNext ? '#facc15' : (idx === 0 ? '#4ade80' : '#38bdf8');
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(g.angle) * rPx, cy + Math.sin(g.angle) * rPx, isNext ? 8 : 4.5, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    sr.rivals?.forEach((rv) => {
                        ctx.fillStyle = rv.colorHex || '#f472b6';
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(rv.angle) * rPx, cy + Math.sin(rv.angle) * rPx, 6.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    const px = cx + Math.cos(sr.angle) * rPx;
                    const py = cy + Math.sin(sr.angle) * rPx;
                    drawMapChevron(ctx, px, py, player.heading, 10, '#22d3ee', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'MOON') {
                const md = window.getMoonMapData?.() as MoonMapDataExtended | undefined;
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                const countEl = document.getElementById('tactical-active-emergencies-count');
                if (titleEl) titleEl.textContent = 'LUNAR OUTPOST TACTICAL SURVEY MAP';
                if (subEl) subEl.textContent = 'Tranquility Crater Basin • Tap anywhere to navigate across the Moon';
                if (pillEl) pillEl.textContent = '0.35G LUNAR';
                if (gridEl) gridEl.textContent = 'SECTOR: LUNA-01';
                if (countEl) countEl.textContent = `RELICS: ${(progression.moonRelicsFound || []).length} / 5`;

                const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, cx * 1.05);
                bgGrad.addColorStop(0, '#334155');
                bgGrad.addColorStop(0.75, '#1e293b');
                bgGrad.addColorStop(1, '#0f172a');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                const sc = (cx * 0.84) / (md?.radius || 185);
                if (md) {
                    md.craters?.forEach((c) => {
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
                        ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    });

                    const drawLunarPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        ctx.fillStyle = col;
                        ctx.beginPath();
                        ctx.arc(px, pz, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = ctx.measureText(label).width;
                        ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        ctx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        ctx.fillStyle = '#f8fafc';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, px, pz + r + 14);
                    };

                    drawLunarPin(md.sigmaPos.x, md.sigmaPos.z, 9, '#22d3ee', 'STARSHIP SIGMA PAD');
                    drawLunarPin(36, -8, 8.5, '#f8fafc', 'LUNAR OUTPOST ALPHA');
                    if (md.roverPos) {
                        drawLunarPin(md.roverPos.x, md.roverPos.z, 6, '#facc15', 'LUNAR ROVER');
                    }
                    md.jumpPads?.forEach((jp) => {
                        ctx.strokeStyle = '#22d3ee';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + jp.x * sc, cy + jp.z * sc, 5, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    md.hoops?.forEach((hp) => {
                        ctx.strokeStyle = hp.cleared ? '#4ade80' : '#f59e0b';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx + hp.x * sc, cy + hp.z * sc, 6, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    md.relics?.forEach((rel) => {
                        if (!rel.collected) drawLunarPin(rel.x, rel.z, 6, '#fbbf24', rel.name);
                    });

                    if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                        drawMapChevron(ctx, cx + buddyBot.pos.x * sc, cy + buddyBot.pos.z * sc, buddyBot.heading, 7.5, '#38bdf8', '#ffffff');
                    }
                    drawMapChevron(ctx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 9.5, '#facc15', '#ffffff');
                }
                return;
            }

            // Ensure surface Tactical Map header text is active
            const titleEl = document.getElementById('tactical-map-title');
            const subEl = document.getElementById('tactical-map-subtitle');
            const pillEl = document.getElementById('tactical-map-status-pill');
            const gridEl = document.getElementById('tactical-map-grid-pill');
            if (titleEl && titleEl.textContent !== 'GRIFFIN ROCK TACTICAL MAP') titleEl.textContent = 'GRIFFIN ROCK TACTICAL MAP';
            if (subEl && subEl.textContent !== 'Island Aerial Surveillance • Real-Time Positioning System') subEl.textContent = 'Island Aerial Surveillance • Real-Time Positioning System';
            if (pillEl && pillEl.textContent !== 'LIVE RADAR') pillEl.textContent = 'LIVE RADAR';
            if (gridEl && gridEl.textContent !== 'GRID: GR-01 // 1:4000') gridEl.textContent = 'GRID: GR-01 // 1:4000';

            // Layer 1: Oceanic Slate Radar Background
            const oceanGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, cx * 1.05);
            oceanGrad.addColorStop(0, '#09253c');
            oceanGrad.addColorStop(0.65, '#051827');
            oceanGrad.addColorStop(1, '#020b12');
            ctx.fillStyle = oceanGrad;
            ctx.fillRect(0, 0, w, h);

            const mapScale = (cx * 0.82) / 2200;

            // Layer 2: Tactical Radar Range Rings & Crosshairs
            const rangeDistances = [500, 1000, 1500, 2000];
            ctx.lineWidth = 1.0;
            rangeDistances.forEach(dist => {
                const r = dist * mapScale;
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${dist}M`, cx, cy - r - 3);
            });

            // Crosshair Axes (N-S, E-W, 45-degree diagonals)
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.10)';
            ctx.setLineDash([3, 8]);
            ctx.beginPath();
            ctx.moveTo(cx, 16); ctx.lineTo(cx, h - 16);
            ctx.moveTo(16, cy); ctx.lineTo(w - 16, cy);
            ctx.moveTo(cx - 240, cy - 240); ctx.lineTo(cx + 240, cy + 240);
            ctx.moveTo(cx - 240, cy + 240); ctx.lineTo(cx + 240, cy - 240);
            ctx.stroke();
            ctx.setLineDash([]);

            // Rotating Radar Sweep Beam
            const sweepAngle = (now * 0.00065) % (Math.PI * 2);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(sweepAngle);
            const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, cx * 0.95);
            sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            sweepGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.04)');
            sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
            ctx.fillStyle = sweepGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, cx * 0.95, -0.26, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(cx * 0.95, 0);
            ctx.stroke();
            ctx.restore();

            // Layer 3: Island Landmasses & Shaded Relief Contours
            // Main Island Coastal Shelf
            ctx.fillStyle = '#0e4259';
            ctx.beginPath();
            ctx.arc(cx, cy, 1720 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            // Main Island Sandy Beach Rim
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath();
            ctx.arc(cx, cy, 1670 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            // Main Island Lush Interior
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(cx, cy, 1630 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            // Highlands & Mountain Plateau Contours
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(cx, cy, 1150 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.arc(cx, cy, 750 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            // Volcano Ridge Shaded Massif (NW)
            ctx.fillStyle = '#052e16';
            ctx.beginPath();
            ctx.ellipse(cx - 680 * mapScale, cy - 650 * mapScale, 280 * mapScale, 220 * mapScale, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Wayward Island (East Off-Coast)
            const wix = cx + 1960 * mapScale;
            const wiz = cy + 540 * mapScale;
            ctx.fillStyle = '#0e4259';
            ctx.beginPath();
            ctx.arc(wix, wiz, 380 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ca8a04';
            ctx.beginPath();
            ctx.arc(wix, wiz, 355 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.arc(wix, wiz, 335 * mapScale, 0, Math.PI * 2);
            ctx.fill();

            // Wayward Causeway Highway & Suspension Bridge
            const cbStartX = cx + 1120 * mapScale;
            const cbEndX = cx + 1780 * mapScale;
            const cbY = cy + 540 * mapScale;
            // Bridge deck
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 7.0;
            ctx.beginPath();
            ctx.moveTo(cbStartX, cbY);
            ctx.lineTo(cbEndX, cbY);
            ctx.stroke();

            // Bridge center line
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(cbStartX, cbY);
            ctx.lineTo(cbEndX, cbY);
            ctx.stroke();

            // Bridge Towers
            [cbStartX + (cbEndX - cbStartX) * 0.35, cbStartX + (cbEndX - cbStartX) * 0.65].forEach(tx => {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(tx - 2, cbY - 7, 4, 14);
            });

            // Layer 4: Multi-Ring Highway Network
            // Outer Highway Ribbon
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 6.0;
            ctx.beginPath();
            for (let i = 0; i <= 96; i++) {
                const theta = (i / 96) * Math.PI * 2;
                const r = getOuterRoadRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) ctx.moveTo(mx, my);
                else ctx.lineTo(mx, my);
            }
            ctx.stroke();

            // Outer Highway Centerline
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Inner Highway Ribbon
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 5.0;
            ctx.beginPath();
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                const r = getInnerRoadRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) ctx.moveTo(mx, my);
                else ctx.lineTo(mx, my);
            }
            ctx.stroke();

            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.0;
            ctx.setLineDash([3, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Cross-Island Arterials
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 5.0;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 1140 * mapScale);
            ctx.lineTo(cx, cy + 1140 * mapScale);
            ctx.moveTo(cx - 1120 * mapScale, cy + 25 * mapScale);
            ctx.lineTo(cx + 1180 * mapScale, cy + 25 * mapScale);
            ctx.moveTo(cx + 1180 * mapScale, cy + 60 * mapScale);
            ctx.lineTo(cx + 1320 * mapScale, cy + 60 * mapScale);
            ctx.stroke();

            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.0;
            ctx.setLineDash([3, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Layer 5: Island Railway Circuit Track
            // Ballast bed
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            for (let i = 0; i <= 96; i++) {
                const theta = (i / 96) * Math.PI * 2;
                const r = getRailwayRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) ctx.moveTo(mx, my);
                else ctx.lineTo(mx, my);
            }
            ctx.stroke();

            // Track rails
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2.0;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // The Griffin Rock Express Train (All 7 cars drawn with orientation)
            const tactTrain = islandTrain as unknown as TrainData | null | undefined;
            if (tactTrain && tactTrain.cars.length > 0) {
                for (let i = 0; i < tactTrain.cars.length; i++) {
                    const car = tactTrain.cars[i];
                    const carX = cx + car.x * mapScale;
                    const carY = cy + car.z * mapScale;
                    const heading = car.heading || 0;

                    ctx.save();
                    ctx.translate(carX, carY);
                    ctx.rotate(-heading + Math.PI / 2);

                    const carW = i === 0 ? 5.5 : 4.5;
                    const carL = i === 0 ? 9.5 : (i === 1 ? 6.5 : 8.5);

                    if (i === 0) {
                        // Locomotive: Sky Blue with Gold Cab
                        ctx.fillStyle = '#0284c7';
                        ctx.fillRect(-carW / 2, -carL / 2, carW, carL);
                        ctx.fillStyle = '#facc15';
                        ctx.fillRect(-carW / 2, carL / 2 - 3.5, carW, 3.5);
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.0;
                        ctx.strokeRect(-carW / 2, -carL / 2, carW, carL);

                        // Headlight Beam
                        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
                        ctx.beginPath();
                        ctx.moveTo(0, -carL / 2);
                        ctx.lineTo(-12, -carL / 2 - 24);
                        ctx.lineTo(12, -carL / 2 - 24);
                        ctx.closePath();
                        ctx.fill();
                    } else if (i === tactTrain.cars.length - 1) {
                        // Caboose: Bright Red
                        ctx.fillStyle = '#ef4444';
                        ctx.fillRect(-carW / 2, -carL / 2, carW, carL);
                        ctx.strokeStyle = '#fecaca';
                        ctx.lineWidth = 1.0;
                        ctx.strokeRect(-carW / 2, -carL / 2, carW, carL);
                        // Flashing lantern
                        const flash = Math.sin(now * 0.01) > 0 ? '#facc15' : '#b91c1c';
                        ctx.fillStyle = flash;
                        ctx.beginPath();
                        ctx.arc(0, carL / 2, 2.0, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Passenger coaches & tender
                        ctx.fillStyle = '#0369a1';
                        ctx.fillRect(-carW / 2, -carL / 2, carW, carL);
                        ctx.strokeStyle = '#bae6fd';
                        ctx.lineWidth = 0.8;
                        ctx.strokeRect(-carW / 2, -carL / 2, carW, carL);
                    }
                    ctx.restore();
                }

                // Train Name Banner
                const loco = tactTrain.cars[0];
                const lx = cx + loco.x * mapScale;
                const ly = cy + loco.z * mapScale;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(lx - 55, ly - 22, 110, 15);
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
                ctx.lineWidth = 1;
                ctx.strokeRect(lx - 55, ly - 22, 110, 15);
                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('GRIFFIN ROCK EXPRESS', lx, ly - 11);
            }

            // Layer 6: Key Island Landmarks with Badges
            const landmarks = [
                { name: "RESCUE BOTS HQ", x: HQ_SWAP_PAD.x, z: HQ_SWAP_PAD.z, color: '#06b6d4' },
                { name: "GRIFFIN HOSPITAL", x: HOSPITAL_POS.x, z: HOSPITAL_POS.z, color: '#dc2626' },
                { name: "DINO RIDGE", x: -750, z: -750, color: '#22c55e' },
                { name: "BOARDWALK", x: bwX, z: bwZ, color: '#f59e0b' },
                { name: "DR. GREENE'S LAB", x: testYard?.baseX ?? 0, z: testYard?.baseZ ?? 0, color: '#38bdf8' },
                { name: "EAST LIGHTHOUSE", x: 1320, z: 60, color: '#f43f5e' },
                { name: "WAYWARD RUINS", x: 1960, z: 540, color: '#c084fc' },
                { name: "MOROCCO'S LAIR", x: -820, z: -1180, color: '#a855f7' }
            ];

            landmarks.forEach(lm => {
                const lx = cx + lm.x * mapScale;
                const lz = cy + lm.z * mapScale;

                if (lm.name === 'GRIFFIN HOSPITAL') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(lx - 6.5, lz - 6.5, 13, 13);
                    ctx.strokeStyle = '#dc2626';
                    ctx.lineWidth = 1.8;
                    ctx.strokeRect(lx - 6.5, lz - 6.5, 13, 13);
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(lx - 1.7, lz - 4.4, 3.4, 8.8);
                    ctx.fillRect(lx - 4.4, lz - 1.7, 8.8, 3.4);
                } else {
                    ctx.fillStyle = lm.color;
                    ctx.beginPath();
                    ctx.arc(lx, lz, 5.0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.4;
                    ctx.stroke();
                }

                // Labeled Pill
                ctx.font = 'bold 9px Fredoka, sans-serif';
                const textW = ctx.measureText(lm.name).width;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(lx - textW / 2 - 4, lz + 8, textW + 8, 14);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.lineWidth = 0.8;
                ctx.strokeRect(lx - textW / 2 - 4, lz + 8, textW + 8, 14);
                ctx.fillStyle = '#f8fafc';
                ctx.textAlign = 'center';
                ctx.fillText(lm.name, lx, lz + 18);
            });

            // Layer 6.5: Active Hurt Citizens Needing Ratchet Ambulance Transport
            const surfPatients = getPatientsMapData().surface;
            surfPatients.forEach(pt => {
                const px = cx + pt.x * mapScale;
                const pz = cy + pt.z * mapScale;
                const col = pt.category === 'MATERNITY' ? '#ec4899' : '#ef4444';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, pz, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = col;
                ctx.lineWidth = 1.6;
                ctx.stroke();
                ctx.fillStyle = col;
                ctx.fillRect(px - 1.2, pz - 3.4, 2.4, 6.8);
                ctx.fillRect(px - 3.4, pz - 1.2, 6.8, 2.4);

                ctx.font = 'bold 7.5px Fredoka, sans-serif';
                const lbl = pt.shortLabel.toUpperCase();
                const tw = ctx.measureText(lbl).width;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.fillRect(px - tw / 2 - 3, pz - 18, tw + 6, 11);
                ctx.fillStyle = '#fecaca';
                ctx.textAlign = 'center';
                ctx.fillText(lbl, px, pz - 10);
            });

            // Layer 7: Discovered Visiting Autobots
            const alliesList = (typeof visitingAutobots !== 'undefined' ? visitingAutobots : []) as unknown as VisitingAutobotEntry[];
            if (alliesList.length > 0) {
                alliesList.forEach(ally => {
                    const isOccupied = (player.botType === ally.id) || (buddyBot && buddyBot.botType === ally.id);
                    if (isOccupied) return;
                    const isDiscovered = Array.isArray(progression.discoveredAllies) && progression.discoveredAllies.includes(ally.id);
                    if (!isDiscovered) return;

                    const ax = cx + ally.x * mapScale;
                    const az = cy + ally.z * mapScale;

                    ctx.fillStyle = ally.badgeColor || '#a855f7';
                    ctx.beginPath();
                    ctx.arc(ax, az, 5.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
                    const nameW = ctx.measureText(ally.name).width;
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                    ctx.fillRect(ax - nameW / 2 - 3, az - 18, nameW + 6, 13);
                    ctx.fillStyle = ally.badgeColor || '#a855f7';
                    ctx.textAlign = 'center';
                    ctx.fillText(ally.name, ax, az - 8);
                });
            }

            // Layer 7.5: Undocked Mega Mode Attachments Across Griffin Rock
            if (typeof WORLD_MEGA_LOCATIONS !== 'undefined') {
                Object.entries(WORLD_MEGA_LOCATIONS).forEach(([botKey, loc]) => {
                    if (!loc || isBotDocked(botKey)) return;
                    const ax = cx + loc.x * mapScale;
                    const az = cy + loc.z * mapScale;
                    const meta = MEGA_ATTACHMENT_META[botKey] || { name: `${botKey} RIG`, color: '#f59e0b' };

                    // Radar pulse halo
                    const aPulse = Math.sin(now * 0.005 + loc.x * 0.01) * 2.2;
                    ctx.strokeStyle = meta.color;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.arc(ax, az, 7.5 + aPulse, 0, Math.PI * 2);
                    ctx.stroke();

                    // Central diamond / circle badge
                    ctx.fillStyle = meta.color;
                    ctx.beginPath();
                    ctx.arc(ax, az, 5.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.4;
                    ctx.stroke();

                    // Label callout badge
                    const isCurrentBot = player.botType === botKey;
                    const labelText = meta.name;
                    ctx.font = isCurrentBot ? 'bold 9.2px "JetBrains Mono", monospace' : 'bold 8.2px "JetBrains Mono", monospace';
                    const lw = ctx.measureText(labelText).width;
                    ctx.fillStyle = isCurrentBot ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.88)';
                    ctx.fillRect(ax - lw / 2 - 4, az + 8, lw + 8, 14);
                    ctx.strokeStyle = isCurrentBot ? '#facc15' : meta.color;
                    ctx.lineWidth = isCurrentBot ? 1.4 : 0.9;
                    ctx.strokeRect(ax - lw / 2 - 4, az + 8, lw + 8, 14);

                    ctx.fillStyle = isCurrentBot ? '#facc15' : '#f8fafc';
                    ctx.textAlign = 'center';
                    ctx.fillText(labelText, ax, az + 18);
                });
            }

            // Layer 8: 8 Emergency Beacons with Pulse Radar Rings & Callout Badges
            let activeEmergencyCount = 0;
            let nearestActiveDist = Infinity;
            let nearestActiveBeacon: BeaconEntry | null = null;

            for (const b of beacons as unknown as BeaconEntry[]) {
                const bx = cx + b.x * mapScale;
                const bz = cy + b.z * mapScale;
                const distFromPlayer = Math.round(Math.hypot(player.pos.x - b.x, player.pos.z - b.z));

                if (!b.restored) {
                    activeEmergencyCount++;
                    if (distFromPlayer < nearestActiveDist) {
                        nearestActiveDist = distFromPlayer;
                        nearestActiveBeacon = b;
                    }

                    // Pulsing Radar Rings
                    const pulse = Math.sin(now * 0.006 + b.id) * 3.5;
                    const ringColor = b.type === 'FIRE' ? 'rgba(251, 146, 60, 0.45)' : (b.type === 'TEAMUP' ? 'rgba(56, 189, 248, 0.55)' : 'rgba(244, 63, 94, 0.45)');
                    ctx.strokeStyle = ringColor;
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.arc(bx, bz, 11 + pulse, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = ringColor;
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.arc(bx, bz, 18 + pulse * 1.5, 0, Math.PI * 2);
                    ctx.stroke();

                    // Beacon Core
                    ctx.fillStyle = b.type === 'FIRE' ? '#ea580c' : (b.type === 'TEAMUP' ? '#0284c7' : '#e11d48');
                    ctx.beginPath();
                    ctx.arc(bx, bz, 6.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.8;
                    ctx.stroke();

                    // Emergency Badge Callout
                    const labelText = `${b.name} (${distFromPlayer}m)`;
                    ctx.font = 'bold 9.5px Fredoka, sans-serif';
                    const lw = ctx.measureText(labelText).width;
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
                    ctx.fillRect(bx - lw / 2 - 5, bz - 21, lw + 10, 16);
                    ctx.strokeStyle = b.type === 'FIRE' ? '#fb923c' : (b.type === 'TEAMUP' ? '#38bdf8' : '#f43f5e');
                    ctx.lineWidth = 1.2;
                    ctx.strokeRect(bx - lw / 2 - 5, bz - 21, lw + 10, 16);

                    ctx.fillStyle = b.type === 'FIRE' ? '#fdba74' : (b.type === 'TEAMUP' ? '#7dd3fc' : '#fda4af');
                    ctx.textAlign = 'center';
                    ctx.fillText(labelText, bx, bz - 9);
                } else {
                    // Cleared Beacon (Emerald Dot)
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.arc(bx, bz, 4.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();

                    ctx.font = 'bold 8px Fredoka, sans-serif';
                    ctx.fillStyle = '#86efac';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${b.name} ✓`, bx, bz + 12);
                }
            }

            // Update Tactical Emergencies Header Count
            const emergCountEl = document.getElementById('tactical-active-emergencies-count');
            if (emergCountEl) {
                emergCountEl.textContent = activeEmergencyCount === 0 ? 'ALL CLEAR (0 ACTIVE)' : `EMERGENCIES: ${activeEmergencyCount} ACTIVE`;
            }

            // Layer 9: Dashed Tactical Navigation Vector to Nearest Active Emergency
            const px = cx + player.pos.x * mapScale;
            const pz = cy + player.pos.z * mapScale;

            if (nearestActiveBeacon) {
                const nbx = cx + nearestActiveBeacon.x * mapScale;
                const nbz = cy + nearestActiveBeacon.z * mapScale;

                ctx.save();
                ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
                ctx.lineWidth = 1.6;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(px, pz);
                ctx.lineTo(nbx, nbz);
                ctx.stroke();
                ctx.restore();

                // Distance readout along vector
                const midX = (px + nbx) / 2;
                const midY = (pz + nbz) / 2;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
                ctx.fillRect(midX - 22, midY - 8, 44, 15);
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 1.0;
                ctx.strokeRect(midX - 22, midY - 8, 44, 15);
                ctx.fillStyle = '#fde047';
                ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${nearestActiveDist}m`, midX, midY + 3);
            }

            // Layer 10: Buddy Bot (Cyan Wingman Chevron + Callout)
            if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                const bx = cx + buddyBot.pos.x * mapScale;
                const bz = cy + buddyBot.pos.z * mapScale;

                ctx.save();
                ctx.translate(bx, bz);
                ctx.rotate(-buddyBot.heading + Math.PI);
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(7.5, 8);
                ctx.lineTo(0, 3.5);
                ctx.lineTo(-7.5, 8);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.4;
                ctx.stroke();
                ctx.restore();

                // Buddy Label Pill
                const bLabel = `${buddyBot.botType} (BUDDY)`;
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                const bw = ctx.measureText(bLabel).width;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.fillRect(bx - bw / 2 - 4, bz + 11, bw + 8, 14);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1.0;
                ctx.strokeRect(bx - bw / 2 - 4, bz + 11, bw + 8, 14);
                ctx.fillStyle = '#7dd3fc';
                ctx.textAlign = 'center';
                ctx.fillText(bLabel, bx, bz + 21);
            }

            // Layer 11: Active Player Bot (Golden Chevron + Pulsing Ring + HUD Label)
            ctx.save();
            // Pulsing aura ring
            const pPulse = Math.sin(now * 0.008) * 3.5;
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(px, pz, 13 + pPulse, 0, Math.PI * 2);
            ctx.stroke();

            // Player Chevron
            ctx.translate(px, pz);
            ctx.rotate(-player.heading + Math.PI);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(0, -11);
            ctx.lineTo(9.0, 9.5);
            ctx.lineTo(0, 4.5);
            ctx.lineTo(-9.0, 9.5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.restore();

            // Player Label Pill with Speed
            const pSpeedKmH = Math.round(Math.abs(player.speed) * 3.6);
            const pLabel = `${player.botType} (YOU) • ${pSpeedKmH} km/h`;
            ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
            const pw = ctx.measureText(pLabel).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.fillRect(px - pw / 2 - 5, pz - 25, pw + 10, 15);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(px - pw / 2 - 5, pz - 25, pw + 10, 15);
            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'center';
            ctx.fillText(pLabel, px, pz - 14);

            // Layer 12: Tactical Compass Rose (Upper Right)
            const compassX = w - 52;
            const compassY = 52;
            ctx.save();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(compassX, compassY, 26, 0, Math.PI * 2);
            ctx.stroke();

            // North Arrow Pointer
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(compassX, compassY - 22);
            ctx.lineTo(compassX + 5, compassY - 5);
            ctx.lineTo(compassX, compassY);
            ctx.lineTo(compassX - 5, compassY - 5);
            ctx.closePath();
            ctx.fill();

            // South Pointer
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(compassX, compassY + 22);
            ctx.lineTo(compassX + 4, compassY + 5);
            ctx.lineTo(compassX, compassY);
            ctx.lineTo(compassX - 4, compassY + 5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('N', compassX, compassY - 28);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('S', compassX, compassY + 37);
            ctx.fillText('W', compassX - 35, compassY + 3.5);
            ctx.fillText('E', compassX + 35, compassY + 3.5);
            ctx.restore();

            // Layer 13: Tactical Scale Bar (Lower Left)
            const sbX = 28;
            const sbY = h - 26;
            const barLength = 500 * mapScale;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(sbX, sbY);
            ctx.lineTo(sbX + barLength, sbY);
            ctx.moveTo(sbX, sbY - 4);
            ctx.lineTo(sbX, sbY + 4);
            ctx.moveTo(sbX + barLength, sbY - 4);
            ctx.lineTo(sbX + barLength, sbY + 4);
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('0', sbX - 2, sbY - 6);
            ctx.textAlign = 'right';
            ctx.fillText('500M', sbX + barLength + 2, sbY - 6);
        }

        /***********************************************************************
         * 11. MAIN PHYSICS, AUTO-PILOT WAYPOINT STEERING & WIDE CAMERA LOOP
         ***********************************************************************/
        let lastTime = performance.now();
        let frameCount = 0;
        let fpsTimer = 0;

export function initTacticalMap() {
    ensureMapCanvases();
    const tacticalMapModal = document.getElementById('tactical-map-modal');
    const btnCloseTacticalMap = document.getElementById('btn-close-tactical-map');

    bindButton('minimap-container', openTacticalMap);
    bindButton('minimap-canvas', openTacticalMap);

    if (btnCloseTacticalMap) {
        bindButton('btn-close-tactical-map', closeTacticalMap);
    }

    if (tacticalMapModal) {
        tacticalMapModal.addEventListener('click', (e) => {
            if (e.target === tacticalMapModal && (performance.now() - (window.lastTacticalMapToggleTime || 0) > 400)) {
                closeTacticalMap();
            }
        });
    }

    if (tacticalMapCanvas) {
        tacticalMapCanvas.addEventListener('click', (e) => {
            handleTacticalMapTap(e.clientX, e.clientY);
        });
        tacticalMapCanvas.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                if (e.cancelable) e.preventDefault();
                handleTacticalMapTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.openTacticalMap = openTacticalMap;
    window.closeTacticalMap = closeTacticalMap;
    window.renderMinimap = renderMinimap;
    window.renderTacticalMap = renderTacticalMap;
    window.handleTacticalMapTap = handleTacticalMapTap;
}

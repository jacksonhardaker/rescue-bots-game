// Minimap Radar & Full-Screen Tactical Island Map System
import { player, buddyBot, worldState } from '../state/gameState.js';
import { progression } from '../progression/progression.js';
import { getUndergroundMapData } from '../world/underground.js';
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

import { islandTrain } from '../world/railway.js';
import { HQ_SWAP_PAD, bwX, bwZ, testYard } from '../world/buildings.js';
import { visitingAutobots, WORLD_MEGA_LOCATIONS } from '../world/allies.js';
import { morbotBattle } from '../world/morbot.js';
import { isBotDocked } from '../progression/progression.js';

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

export let minimapCanvas = null;
export let mCtx = null;
export let tacticalMapCanvas = null;
export let tCtx = null;

export function ensureMapCanvases() {
    if (!minimapCanvas && typeof document !== 'undefined') {
        minimapCanvas = document.getElementById('minimap-canvas');
        if (minimapCanvas) mCtx = minimapCanvas.getContext('2d');
    }
    if (!tacticalMapCanvas && typeof document !== 'undefined') {
        tacticalMapCanvas = document.getElementById('tactical-map-canvas');
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

export function handleTacticalMapTap(clientX, clientY) {
    ensureMapCanvases();
    if (!tacticalMapCanvas || performance.now() - (window.lastTacticalMapToggleTime || 0) < 300) return;
                const rect = tacticalMapCanvas.getBoundingClientRect();
                const canvasX = (clientX - rect.left) * (tacticalMapCanvas.width / rect.width);
                const canvasY = (clientY - rect.top) * (tacticalMapCanvas.height / rect.height);
                const cx = tacticalMapCanvas.width / 2;
                const cy = tacticalMapCanvas.height / 2;

                if (worldState.activeArea === 'SPACE') {
                    const sp = (window as any).getSpaceMapData?.();
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
                            sp.sectorMoons?.forEach((m: any) => {
                                const pt = m.beaconRing ? m.landingPos : m.pos;
                                checkSnap(pt.x, pt.y, pt.z, m.name, 55);
                            });
                        }
                        checkSnap(sp.stationPos.x, sp.stationPos.y, sp.stationPos.z, 'Autobot Orbital Station', 55);
                        sp.satellites?.forEach((s: any) => { if (!s.repaired) checkSnap(s.pos.x, s.pos.y, s.pos.z, s.name, 42); });
                        sp.pods?.forEach((p: any) => { if (!p.rescued) checkSnap(p.pos.x, p.pos.y, p.pos.z, p.name, 42); });
                        const activeRing = sp.starRings?.[sp.ship.activeRingIdx];
                        if (activeRing) checkSnap(activeRing.pos.x, activeRing.pos.y, activeRing.pos.z, 'Active Star-Ring Gate', 42);

                        if (typeof (window as any).setSpaceWaypointWorld === 'function') {
                            (window as any).setSpaceWaypointWorld(wx, wy, wz);
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

                if (worldState.activeArea === 'PLANET_SURFACE') {
                    const pd = (window as any).getPlanetSurfaceMapData?.();
                    const pR = pd?.radius || 175;
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
                    waypointGroup.position.set(wx, ty, wz);
                    waypointGroup.visible = true;
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
                    const md = (window as any).getMoonMapData?.();
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
                    waypointGroup.position.set(wx, ty, wz);
                    waypointGroup.visible = true;
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
                    waypointGroup.position.set(worldX, markerY, worldZ);
                    waypointGroup.visible = true;
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
                beacons.forEach(b => {
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
                const markerY = (canTraverseWater && isWaterPoint) ? -0.45 : Math.max(0.0, ty);

                player.waypoint.set(worldX, markerY, worldZ);
                player.hasWaypoint = true;
                waypointGroup.position.set(worldX, markerY, worldZ);
                waypointGroup.visible = true;

                if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                spawnBurstParticles(worldX, markerY + 0.5, worldZ, 0xfacc15, 6, 0.8);
                showToast("AUTOPILOT SET", `Navigating to (${Math.round(worldX)}, ${Math.round(worldZ)})`);
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
            ug.edges.forEach((e: any) => {
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
            ug.exitShafts.forEach((sh: any) => {
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

            // Collectible Gems inside explored corridors
            if (isFullMap) {
                ug.gems.forEach((gem: any) => {
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
            ug.discoveries.forEach((disc: any) => {
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
            ug.dinos.forEach((d: any) => {
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
                ug.sigmaParts.forEach((part: any) => {
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
            const w = minimapCanvas.width;
            const h = minimapCanvas.height;
            const cx = w / 2;
            const cy = h / 2;

            if (worldState.activeArea === 'UNDERGROUND') {
                mCtx.clearRect(0, 0, w, h);
                mCtx.save();
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
                mCtx.clip();
                const ugMiniScale = (cx * 0.80) / 234;
                renderUndergroundRadar(mCtx, w, h, ugMiniScale, false);
                mCtx.restore();
                return;
            }

            if (worldState.activeArea === 'SPACE') {
                const sp = (window as any).getSpaceMapData?.();
                mCtx.clearRect(0, 0, w, h);
                mCtx.save();
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
                mCtx.clip();
                mCtx.fillStyle = '#020617';
                mCtx.fillRect(0, 0, w, h);
                // Radar grid rings
                mCtx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
                mCtx.lineWidth = 1;
                [0.32, 0.62, 0.9].forEach(r => {
                    mCtx.beginPath();
                    mCtx.arc(cx, cy, cx * r, 0, Math.PI * 2);
                    mCtx.stroke();
                });
                if (sp) {
                    const sc = (cx * 0.85) / (sp.bounds || 460);
                    // Moon
                    mCtx.fillStyle = '#cbd5e1';
                    mCtx.beginPath();
                    mCtx.arc(cx + sp.moonPos.x * sc, cy + sp.moonPos.z * sc, 9, 0, Math.PI * 2);
                    mCtx.fill();
                    if (sp.sectorId === 'MOON_ORBIT' || !sp.sectorId) {
                        mCtx.strokeStyle = '#22d3ee';
                        mCtx.lineWidth = 1.5;
                        mCtx.stroke();
                    } else {
                        sp.sectorMoons?.forEach((m: any) => {
                            mCtx.fillStyle = m.landablePlanetId ? '#38bdf8' : '#cbd5e1';
                            mCtx.beginPath();
                            mCtx.arc(cx + m.pos.x * sc, cy + m.pos.z * sc, m.landablePlanetId ? 6.5 : 5, 0, Math.PI * 2);
                            mCtx.fill();
                            if (m.landablePlanetId) {
                                mCtx.strokeStyle = '#fbbf24';
                                mCtx.lineWidth = 1.6;
                                mCtx.stroke();
                            }
                        });
                    }
                    // Autobot Orbital Station
                    mCtx.fillStyle = '#4ade80';
                    mCtx.fillRect(cx + sp.stationPos.x * sc - 4, cy + sp.stationPos.z * sc - 4, 8, 8);
                    // Satellites & Stranded Pods
                    sp.satellites?.forEach((s: any) => {
                        mCtx.fillStyle = s.repaired ? '#22d3ee' : '#ef4444';
                        mCtx.beginPath();
                        mCtx.arc(cx + s.pos.x * sc, cy + s.pos.z * sc, 3, 0, Math.PI * 2);
                        mCtx.fill();
                    });
                    sp.pods?.forEach((p: any) => {
                        if (p.rescued) return;
                        mCtx.fillStyle = '#fbbf24';
                        mCtx.beginPath();
                        mCtx.arc(cx + p.pos.x * sc, cy + p.pos.z * sc, 3.2, 0, Math.PI * 2);
                        mCtx.fill();
                    });
                    // Active Star-Ring
                    const activeRing = sp.starRings?.[sp.ship.activeRingIdx];
                    if (activeRing) {
                        mCtx.strokeStyle = '#fbbf24';
                        mCtx.lineWidth = 2;
                        mCtx.beginPath();
                        mCtx.arc(cx + activeRing.pos.x * sc, cy + activeRing.pos.z * sc, 5, 0, Math.PI * 2);
                        mCtx.stroke();
                    }
                    // Starship Sigma Chevron
                    drawMapChevron(mCtx, cx + sp.ship.pos.x * sc, cy + sp.ship.pos.z * sc, sp.ship.yaw + Math.PI, 5.5, '#38bdf8', '#ffffff');
                }
                mCtx.restore();
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
                mCtx.clearRect(0, 0, w, h);
                mCtx.save();
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
                mCtx.clip();
                mCtx.fillStyle = '#030712';
                mCtx.fillRect(0, 0, w, h);
                [0.24, 0.42, 0.62, 0.82].forEach(f => {
                    mCtx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
                    mCtx.lineWidth = 1;
                    mCtx.beginPath();
                    mCtx.arc(cx, cy, cx * f, 0, Math.PI * 2);
                    mCtx.stroke();
                });
                mCtx.fillStyle = '#facc15';
                mCtx.beginPath();
                mCtx.arc(cx, cy, 7, 0, Math.PI * 2);
                mCtx.fill();
                mCtx.restore();
                setNearestHintText('3D Solar System Hub • Tap any planet to warp!');
                return;
            }

            if (worldState.activeArea === 'SATURN_RING_RACE') {
                const sr = (window as any).getSaturnRaceMapData?.();
                mCtx.clearRect(0, 0, w, h);
                mCtx.save();
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
                mCtx.clip();
                mCtx.fillStyle = '#040714';
                mCtx.fillRect(0, 0, w, h);
                mCtx.fillStyle = '#eab308';
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx * 0.36, 0, Math.PI * 2);
                mCtx.fill();
                const rPx = cx * 0.72;
                mCtx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
                mCtx.lineWidth = 7;
                mCtx.beginPath();
                mCtx.arc(cx, cy, rPx, 0, Math.PI * 2);
                mCtx.stroke();
                if (sr) {
                    const nextG = sr.gates?.[sr.nextGateIdx];
                    if (nextG) {
                        mCtx.fillStyle = '#facc15';
                        mCtx.beginPath();
                        mCtx.arc(cx + Math.cos(nextG.angle) * rPx, cy + Math.sin(nextG.angle) * rPx, 4.5, 0, Math.PI * 2);
                        mCtx.fill();
                    }
                    sr.rivals?.forEach((rv: any) => {
                        mCtx.fillStyle = rv.colorHex || '#f472b6';
                        mCtx.beginPath();
                        mCtx.arc(cx + Math.cos(rv.angle) * rPx, cy + Math.sin(rv.angle) * rPx, 3.4, 0, Math.PI * 2);
                        mCtx.fill();
                    });
                    const px = cx + Math.cos(sr.angle) * rPx;
                    const py = cy + Math.sin(sr.angle) * rPx;
                    drawMapChevron(mCtx, px, py, player.heading, 5.2, '#22d3ee', '#ffffff');
                }
                mCtx.restore();
                setNearestHintText('Saturn Ring Race • Sprint through all 12 Turbo Gates!');
                return;
            }

            if (worldState.activeArea === 'PLANET_SURFACE') {
                const pd = (window as any).getPlanetSurfaceMapData?.();
                mCtx.clearRect(0, 0, w, h);
                mCtx.save();
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
                mCtx.clip();
                mCtx.fillStyle = pd?.config?.groundAccentHex || '#1e293b';
                mCtx.fillRect(0, 0, w, h);
                if (pd) {
                    const sc = (cx * 0.85) / (pd.radius || 175);
                    pd.craters?.forEach((c: any) => {
                        mCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                        mCtx.lineWidth = 1.2;
                        mCtx.beginPath();
                        mCtx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        mCtx.stroke();
                    });
                    mCtx.fillStyle = '#22d3ee';
                    mCtx.beginPath();
                    mCtx.arc(cx + pd.sigmaPos.x * sc, cy + pd.sigmaPos.z * sc, 5, 0, Math.PI * 2);
                    mCtx.fill();
                    pd.relics?.forEach((r: any) => {
                        if (r.collected) return;
                        mCtx.fillStyle = '#fbbf24';
                        mCtx.beginPath();
                        mCtx.arc(cx + r.x * sc, cy + r.z * sc, 3.5, 0, Math.PI * 2);
                        mCtx.fill();
                    });
                    if (pd.frozenStarspeed) {
                        mCtx.fillStyle = '#38bdf8';
                        mCtx.strokeStyle = '#facc15';
                        mCtx.lineWidth = 2;
                        mCtx.beginPath();
                        mCtx.arc(cx + pd.frozenStarspeed.x * sc, cy + pd.frozenStarspeed.z * sc, 5.2, 0, Math.PI * 2);
                        mCtx.fill();
                        mCtx.stroke();
                    }
                    drawMapChevron(mCtx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 5.2, '#facc15', '#ffffff');
                }
                mCtx.restore();
                setNearestHintText(`${pd?.config?.name || 'Planet'} • ${pd?.config?.gravityLabel || ''}${pd?.frozenStarspeed ? ' • SOS Signal Detected!' : ''}`);
                return;
            }

            if (worldState.activeArea === 'MOON') {
                const md = (window as any).getMoonMapData?.();
                mCtx.clearRect(0, 0, w, h);
                mCtx.save();
                mCtx.beginPath();
                mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
                mCtx.clip();
                mCtx.fillStyle = '#1e293b';
                mCtx.fillRect(0, 0, w, h);
                if (md) {
                    const sc = (cx * 0.85) / (md.radius || 185);
                    md.craters?.forEach((c: any) => {
                        mCtx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
                        mCtx.lineWidth = 1.2;
                        mCtx.beginPath();
                        mCtx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        mCtx.stroke();
                    });
                    // Sigma Pad
                    mCtx.fillStyle = '#22d3ee';
                    mCtx.beginPath();
                    mCtx.arc(cx + md.sigmaPos.x * sc, cy + md.sigmaPos.z * sc, 5, 0, Math.PI * 2);
                    mCtx.fill();
                    // Uncollected Lunar Relics
                    md.relics?.forEach((r: any) => {
                        if (r.collected) return;
                        mCtx.fillStyle = '#fbbf24';
                        mCtx.beginPath();
                        mCtx.arc(cx + r.x * sc, cy + r.z * sc, 3.5, 0, Math.PI * 2);
                        mCtx.fill();
                    });
                    drawMapChevron(mCtx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 5.2, '#facc15', '#ffffff');
                }
                mCtx.restore();
                setNearestHintText(`Moon Base • Relics: ${(progression.moonRelicsFound || []).length}/5 • 0.35G`);
                return;
            }

            const mapScale = (cx * 0.70) / 1950;

            ensureMinimapBgCache(w, h);
            mCtx.clearRect(0, 0, w, h);
            if (minimapBgCanvas) {
                mCtx.drawImage(minimapBgCanvas, 0, 0);
            }

            // Moving Griffin Rock Express Train
            if (typeof islandTrain !== 'undefined' && islandTrain && islandTrain.cars.length > 0) {
                mCtx.strokeStyle = '#38bdf8';
                mCtx.lineWidth = 2.2;
                mCtx.beginPath();
                for (let i = 0; i < islandTrain.cars.length; i++) {
                    const car = islandTrain.cars[i];
                    const cmx = cx + car.x * mapScale;
                    const cmy = cy + car.z * mapScale;
                    if (i === 0) mCtx.moveTo(cmx, cmy);
                    else mCtx.lineTo(cmx, cmy);
                }
                mCtx.stroke();

                const loco = islandTrain.cars[0];
                mCtx.fillStyle = '#facc15';
                mCtx.beginPath();
                mCtx.arc(cx + loco.x * mapScale, cy + loco.z * mapScale, 3.2, 0, Math.PI * 2);
                mCtx.fill();

                const caboose = islandTrain.cars[islandTrain.cars.length - 1];
                mCtx.fillStyle = '#ef4444';
                mCtx.beginPath();
                mCtx.arc(cx + caboose.x * mapScale, cy + caboose.z * mapScale, 2.6, 0, Math.PI * 2);
                mCtx.fill();
            }

            // Live MorBot Radar Blip when Boss Battle is Active
            if (typeof morbotBattle !== 'undefined' && morbotBattle && (morbotBattle.state === 'PURSUIT' || morbotBattle.state === 'ROBOT')) {
                const mbx = cx + morbotBattle.pos.x * mapScale;
                const mbz = cy + morbotBattle.pos.z * mapScale;
                const pulseRing = 5.0 + Math.sin(performance.now() * 0.008) * 3.0;

                mCtx.strokeStyle = '#ef4444';
                mCtx.lineWidth = 1.4;
                mCtx.beginPath();
                mCtx.arc(mbx, mbz, pulseRing, 0, Math.PI * 2);
                mCtx.stroke();

                mCtx.fillStyle = '#dc2626';
                mCtx.beginPath();
                mCtx.arc(mbx, mbz, 4.0, 0, Math.PI * 2);
                mCtx.fill();
                mCtx.strokeStyle = '#ffffff';
                mCtx.lineWidth = 1.0;
                mCtx.stroke();
            }

            // Draw 8 Emergency Beacons (High-Contrast, Clean Dots)
            let nearestDist = Infinity;
            let nearestName = "All Clear!";

            for (let bIdx = 0; bIdx < beacons.length; bIdx++) {
                const b = beacons[bIdx];
                const bx = cx + b.x * mapScale;
                const bz = cy + b.z * mapScale;

                if (!b.restored) {
                    const d = Math.hypot(player.pos.x - b.x, player.pos.z - b.z);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearestName = `${b.name} (${Math.round(d)}m)`;
                    }
                }

                mCtx.fillStyle = b.restored ? '#4ade80' : (b.type === 'FIRE' ? '#fb923c' : (b.type === 'TEAMUP' ? '#38bdf8' : '#f43f5e'));
                mCtx.beginPath();
                mCtx.arc(bx, bz, b.restored ? 2.8 : 4.4, 0, Math.PI * 2);
                mCtx.fill();
                mCtx.strokeStyle = '#ffffff';
                mCtx.lineWidth = 1.0;
                mCtx.stroke();
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
                for (const botKey in WORLD_MEGA_LOCATIONS) {
                    const loc = WORLD_MEGA_LOCATIONS[botKey];
                    if (!loc || isBotDocked(botKey)) continue;
                    const mx = cx + loc.x * mapScale;
                    const mz = cy + loc.z * mapScale;
                    const meta = MEGA_ATTACHMENT_META[botKey];
                    mCtx.fillStyle = meta ? meta.color : '#f59e0b';
                    mCtx.beginPath();
                    mCtx.arc(mx, mz, 2.8, 0, Math.PI * 2);
                    mCtx.fill();
                    mCtx.strokeStyle = '#ffffff';
                    mCtx.lineWidth = 0.9;
                    mCtx.stroke();
                }
            }

            // Draw Buddy Bot Arrow (Cyan Wingman Chevron)
            if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                const bx = cx + buddyBot.pos.x * mapScale;
                const bz = cy + buddyBot.pos.z * mapScale;
                mCtx.save();
                mCtx.translate(bx, bz);
                mCtx.rotate(-buddyBot.heading + Math.PI);
                mCtx.fillStyle = '#38bdf8';
                mCtx.beginPath();
                mCtx.moveTo(0, -5.5);
                mCtx.lineTo(4.5, 5);
                mCtx.lineTo(0, 2.5);
                mCtx.lineTo(-4.5, 5);
                mCtx.closePath();
                mCtx.fill();
                mCtx.restore();
            }

            // Draw Active Player Arrow (Bright Gold Chevron)
            const px = cx + player.pos.x * mapScale;
            const pz = cy + player.pos.z * mapScale;
            mCtx.save();
            mCtx.translate(px, pz);
            mCtx.rotate(-player.heading + Math.PI);
            mCtx.fillStyle = '#facc15';
            mCtx.beginPath();
            mCtx.moveTo(0, -7);
            mCtx.lineTo(5.5, 6);
            mCtx.lineTo(0, 3);
            mCtx.lineTo(-5.5, 6);
            mCtx.closePath();
            mCtx.fill();
            mCtx.restore();
        }

        // =====================================================================
        // 10B. HIGH-RESOLUTION TACTICAL ISLAND MAP OVERLAY RENDERER (720x720)
        // =====================================================================
        export function renderTacticalMap() {
            ensureMapCanvases();
            if (!tCtx || !tacticalMapCanvas) return;
            const w = tacticalMapCanvas.width;
            const h = tacticalMapCanvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const now = performance.now();

            // Clear Canvas
            tCtx.clearRect(0, 0, w, h);

            if (worldState.activeArea === 'UNDERGROUND') {
                const ugFullScale = (cx * 0.84) / 234;
                renderUndergroundRadar(tCtx, w, h, ugFullScale, true);
                return;
            }

            if (worldState.activeArea === 'SPACE') {
                const sp = (window as any).getSpaceMapData?.();
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

                const bgGrad = tCtx.createRadialGradient(cx, cy, 40, cx, cy, cx * 1.05);
                bgGrad.addColorStop(0, '#07142b');
                bgGrad.addColorStop(0.7, '#030917');
                bgGrad.addColorStop(1, '#01040a');
                tCtx.fillStyle = bgGrad;
                tCtx.fillRect(0, 0, w, h);

                const sc = (cx * 0.84) / (sp?.bounds || 460);
                // Radar range rings
                [150, 300, 450].forEach(dist => {
                    tCtx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
                    tCtx.setLineDash([4, 6]);
                    tCtx.beginPath();
                    tCtx.arc(cx, cy, dist * sc, 0, Math.PI * 2);
                    tCtx.stroke();
                    tCtx.fillStyle = 'rgba(56, 189, 248, 0.5)';
                    tCtx.font = 'bold 9px "JetBrains Mono", monospace';
                    tCtx.textAlign = 'center';
                    tCtx.fillText(`${dist}M`, cx, cy - dist * sc - 4);
                });
                tCtx.setLineDash([]);

                if (sp) {
                    const drawPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        tCtx.fillStyle = col;
                        tCtx.beginPath();
                        tCtx.arc(px, pz, r, 0, Math.PI * 2);
                        tCtx.fill();
                        tCtx.strokeStyle = '#ffffff';
                        tCtx.lineWidth = 1.5;
                        tCtx.stroke();
                        tCtx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = tCtx.measureText(label).width;
                        tCtx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        tCtx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        tCtx.fillStyle = '#f8fafc';
                        tCtx.textAlign = 'center';
                        tCtx.fillText(label, px, pz + r + 14);
                    };

                    // Star-Ring Course Loop
                    if (Array.isArray(sp.starRings) && sp.starRings.length > 0) {
                        tCtx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
                        tCtx.setLineDash([5, 5]);
                        tCtx.beginPath();
                        sp.starRings.forEach((r: any, idx: number) => {
                            const rx = cx + r.pos.x * sc;
                            const rz = cy + r.pos.z * sc;
                            if (idx === 0) tCtx.moveTo(rx, rz);
                            else tCtx.lineTo(rx, rz);
                        });
                        tCtx.closePath();
                        tCtx.stroke();
                        tCtx.setLineDash([]);

                        sp.starRings.forEach((r: any, idx: number) => {
                            const isAct = idx === sp.ship.activeRingIdx;
                            const rx = cx + r.pos.x * sc;
                            const rz = cy + r.pos.z * sc;
                            tCtx.strokeStyle = isAct ? '#fbbf24' : '#22d3ee';
                            tCtx.lineWidth = isAct ? 2.5 : 1.3;
                            tCtx.beginPath();
                            tCtx.arc(rx, rz, isAct ? 8 : 5, 0, Math.PI * 2);
                            tCtx.stroke();
                        });
                    }

                    // Asteroids
                    sp.asteroids?.forEach((a: any) => {
                        if (!a.alive) return;
                        tCtx.fillStyle = '#78716c';
                        tCtx.beginPath();
                        tCtx.arc(cx + a.pos.x * sc, cy + a.pos.z * sc, 3.2, 0, Math.PI * 2);
                        tCtx.fill();
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
                        sp.sectorMoons?.forEach((m: any) => {
                            drawPin(m.pos.x, m.pos.z, m.landablePlanetId ? 15 : 11, m.landablePlanetId ? '#38bdf8' : '#cbd5e1', m.name.toUpperCase());
                            if (m.beaconRing) {
                                drawPin(m.landingPos.x, m.landingPos.z, 7, '#fbbf24', `LAND ON ${m.id}`);
                            }
                        });
                    }

                    // Autobot Orbital Station
                    drawPin(sp.stationPos.x, sp.stationPos.z, 10, '#4ade80', 'AUTOBOT ORBITAL STATION');

                    // Satellites & Pods
                    sp.satellites?.forEach((s: any) => {
                        drawPin(s.pos.x, s.pos.z, 5.5, s.repaired ? '#38bdf8' : '#ef4444', s.name);
                    });
                    sp.pods?.forEach((p: any) => {
                        if (!p.rescued) drawPin(p.pos.x, p.pos.z, 5.5, '#fbbf24', p.name);
                    });

                    // Starship Sigma Chevron
                    drawMapChevron(tCtx, cx + sp.ship.pos.x * sc, cy + sp.ship.pos.z * sc, sp.ship.yaw + Math.PI, 9.5, '#38bdf8', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'PLANET_SURFACE') {
                const pd = (window as any).getPlanetSurfaceMapData?.();
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
                const foundHere = (pd?.relics || []).filter((r: any) => r.collected).length;
                if (countEl) countEl.textContent = `RELICS: ${foundHere} / ${(pd?.relics || []).length}`;

                const bgGrad = tCtx.createRadialGradient(cx, cy, 40, cx, cy, cx * 1.05);
                bgGrad.addColorStop(0, cfg?.groundBaseHex || '#334155');
                bgGrad.addColorStop(0.8, cfg?.groundAccentHex || '#1e293b');
                bgGrad.addColorStop(1, '#0f172a');
                tCtx.fillStyle = bgGrad;
                tCtx.fillRect(0, 0, w, h);

                const sc = (cx * 0.84) / (pd?.radius || 175);
                if (pd) {
                    pd.craters?.forEach((c: any) => {
                        tCtx.fillStyle = 'rgba(15, 23, 42, 0.28)';
                        tCtx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
                        tCtx.lineWidth = 2;
                        tCtx.beginPath();
                        tCtx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        tCtx.fill();
                        tCtx.stroke();
                    });

                    const drawPlanetaryPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        tCtx.fillStyle = col;
                        tCtx.beginPath();
                        tCtx.arc(px, pz, r, 0, Math.PI * 2);
                        tCtx.fill();
                        tCtx.strokeStyle = '#ffffff';
                        tCtx.lineWidth = 1.5;
                        tCtx.stroke();
                        tCtx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = tCtx.measureText(label).width;
                        tCtx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        tCtx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        tCtx.fillStyle = '#f8fafc';
                        tCtx.textAlign = 'center';
                        tCtx.fillText(label, px, pz + r + 14);
                    };

                    drawPlanetaryPin(pd.sigmaPos.x, pd.sigmaPos.z, 9, '#22d3ee', 'STARSHIP SIGMA PAD');
                    pd.vents?.forEach((v: any) => {
                        drawPlanetaryPin(v.x, v.z, 5.5, '#f97316', v.label.toUpperCase());
                    });
                    pd.relics?.forEach((r: any) => {
                        if (!r.collected) drawPlanetaryPin(r.x, r.z, 6.5, '#fbbf24', r.name.toUpperCase());
                    });
                    if (pd.frozenStarspeed) {
                        drawPlanetaryPin(pd.frozenStarspeed.x, pd.frozenStarspeed.z, 9, '#38bdf8', 'FROZEN SOS SIGNAL (STARSPEED)');
                    }
                    drawMapChevron(tCtx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 9.5, '#facc15', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'SATURN_RING_RACE') {
                const sr = (window as any).getSaturnRaceMapData?.();
                const titleEl = document.getElementById('tactical-map-title');
                const subEl = document.getElementById('tactical-map-subtitle');
                const pillEl = document.getElementById('tactical-map-status-pill');
                const gridEl = document.getElementById('tactical-map-grid-pill');
                if (titleEl) titleEl.textContent = 'SATURN ICY RING CIRCUIT RADAR';
                if (subEl) subEl.textContent = '360° Bot-Mode Ring Highway • 12 Sequential Turbo Boost Gates';
                if (pillEl) pillEl.textContent = 'RING RACE';
                if (gridEl) gridEl.textContent = 'SECTOR: SATURN-R1';

                tCtx.fillStyle = '#040714';
                tCtx.fillRect(0, 0, w, h);
                tCtx.fillStyle = '#eab308';
                tCtx.beginPath();
                tCtx.arc(cx, cy, cx * 0.34, 0, Math.PI * 2);
                tCtx.fill();
                const rPx = cx * 0.72;
                tCtx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
                tCtx.lineWidth = 18;
                tCtx.beginPath();
                tCtx.arc(cx, cy, rPx, 0, Math.PI * 2);
                tCtx.stroke();
                if (sr) {
                    sr.gates?.forEach((g: any, idx: number) => {
                        const isNext = idx === sr.nextGateIdx;
                        tCtx.fillStyle = isNext ? '#facc15' : (idx === 0 ? '#4ade80' : '#38bdf8');
                        tCtx.beginPath();
                        tCtx.arc(cx + Math.cos(g.angle) * rPx, cy + Math.sin(g.angle) * rPx, isNext ? 8 : 4.5, 0, Math.PI * 2);
                        tCtx.fill();
                    });
                    sr.rivals?.forEach((rv: any) => {
                        tCtx.fillStyle = rv.colorHex || '#f472b6';
                        tCtx.beginPath();
                        tCtx.arc(cx + Math.cos(rv.angle) * rPx, cy + Math.sin(rv.angle) * rPx, 6.2, 0, Math.PI * 2);
                        tCtx.fill();
                    });
                    const px = cx + Math.cos(sr.angle) * rPx;
                    const py = cy + Math.sin(sr.angle) * rPx;
                    drawMapChevron(tCtx, px, py, player.heading, 10, '#22d3ee', '#ffffff');
                }
                return;
            }

            if (worldState.activeArea === 'MOON') {
                const md = (window as any).getMoonMapData?.();
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

                const bgGrad = tCtx.createRadialGradient(cx, cy, 40, cx, cy, cx * 1.05);
                bgGrad.addColorStop(0, '#334155');
                bgGrad.addColorStop(0.75, '#1e293b');
                bgGrad.addColorStop(1, '#0f172a');
                tCtx.fillStyle = bgGrad;
                tCtx.fillRect(0, 0, w, h);

                const sc = (cx * 0.84) / (md?.radius || 185);
                if (md) {
                    md.craters?.forEach((c: any) => {
                        tCtx.fillStyle = 'rgba(15, 23, 42, 0.35)';
                        tCtx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
                        tCtx.lineWidth = 2;
                        tCtx.beginPath();
                        tCtx.arc(cx + c.x * sc, cy + c.z * sc, c.r * sc, 0, Math.PI * 2);
                        tCtx.fill();
                        tCtx.stroke();
                    });

                    const drawLunarPin = (wx: number, wz: number, r: number, col: string, label: string) => {
                        const px = cx + wx * sc;
                        const pz = cy + wz * sc;
                        tCtx.fillStyle = col;
                        tCtx.beginPath();
                        tCtx.arc(px, pz, r, 0, Math.PI * 2);
                        tCtx.fill();
                        tCtx.strokeStyle = '#ffffff';
                        tCtx.lineWidth = 1.5;
                        tCtx.stroke();
                        tCtx.font = 'bold 9.5px Fredoka, sans-serif';
                        const tw = tCtx.measureText(label).width;
                        tCtx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                        tCtx.fillRect(px - tw / 2 - 4, pz + r + 4, tw + 8, 14);
                        tCtx.fillStyle = '#f8fafc';
                        tCtx.textAlign = 'center';
                        tCtx.fillText(label, px, pz + r + 14);
                    };

                    drawLunarPin(md.sigmaPos.x, md.sigmaPos.z, 9, '#22d3ee', 'STARSHIP SIGMA PAD');
                    drawLunarPin(36, -8, 8.5, '#f8fafc', 'LUNAR OUTPOST ALPHA');
                    if (md.roverPos) {
                        drawLunarPin(md.roverPos.x, md.roverPos.z, 6, '#facc15', 'LUNAR ROVER');
                    }
                    md.jumpPads?.forEach((jp: any) => {
                        tCtx.strokeStyle = '#22d3ee';
                        tCtx.lineWidth = 2;
                        tCtx.beginPath();
                        tCtx.arc(cx + jp.x * sc, cy + jp.z * sc, 5, 0, Math.PI * 2);
                        tCtx.stroke();
                    });
                    md.hoops?.forEach((hp: any) => {
                        tCtx.strokeStyle = hp.cleared ? '#4ade80' : '#f59e0b';
                        tCtx.lineWidth = 2;
                        tCtx.beginPath();
                        tCtx.arc(cx + hp.x * sc, cy + hp.z * sc, 6, 0, Math.PI * 2);
                        tCtx.stroke();
                    });
                    md.relics?.forEach((rel: any) => {
                        if (!rel.collected) drawLunarPin(rel.x, rel.z, 6, '#fbbf24', rel.name);
                    });

                    if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                        drawMapChevron(tCtx, cx + buddyBot.pos.x * sc, cy + buddyBot.pos.z * sc, buddyBot.heading, 7.5, '#38bdf8', '#ffffff');
                    }
                    drawMapChevron(tCtx, cx + player.pos.x * sc, cy + player.pos.z * sc, player.heading, 9.5, '#facc15', '#ffffff');
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
            const oceanGrad = tCtx.createRadialGradient(cx, cy, 60, cx, cy, cx * 1.05);
            oceanGrad.addColorStop(0, '#09253c');
            oceanGrad.addColorStop(0.65, '#051827');
            oceanGrad.addColorStop(1, '#020b12');
            tCtx.fillStyle = oceanGrad;
            tCtx.fillRect(0, 0, w, h);

            const mapScale = (cx * 0.82) / 2200;

            // Layer 2: Tactical Radar Range Rings & Crosshairs
            const rangeDistances = [500, 1000, 1500, 2000];
            tCtx.lineWidth = 1.0;
            rangeDistances.forEach(dist => {
                const r = dist * mapScale;
                tCtx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
                tCtx.setLineDash([4, 6]);
                tCtx.beginPath();
                tCtx.arc(cx, cy, r, 0, Math.PI * 2);
                tCtx.stroke();

                tCtx.fillStyle = 'rgba(6, 182, 212, 0.45)';
                tCtx.font = 'bold 9px "JetBrains Mono", monospace';
                tCtx.textAlign = 'center';
                tCtx.fillText(`${dist}M`, cx, cy - r - 3);
            });

            // Crosshair Axes (N-S, E-W, 45-degree diagonals)
            tCtx.strokeStyle = 'rgba(6, 182, 212, 0.10)';
            tCtx.setLineDash([3, 8]);
            tCtx.beginPath();
            tCtx.moveTo(cx, 16); tCtx.lineTo(cx, h - 16);
            tCtx.moveTo(16, cy); tCtx.lineTo(w - 16, cy);
            tCtx.moveTo(cx - 240, cy - 240); tCtx.lineTo(cx + 240, cy + 240);
            tCtx.moveTo(cx - 240, cy + 240); tCtx.lineTo(cx + 240, cy - 240);
            tCtx.stroke();
            tCtx.setLineDash([]);

            // Rotating Radar Sweep Beam
            const sweepAngle = (now * 0.00065) % (Math.PI * 2);
            tCtx.save();
            tCtx.translate(cx, cy);
            tCtx.rotate(sweepAngle);
            const sweepGrad = tCtx.createRadialGradient(0, 0, 0, 0, 0, cx * 0.95);
            sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            sweepGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.04)');
            sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
            tCtx.fillStyle = sweepGrad;
            tCtx.beginPath();
            tCtx.moveTo(0, 0);
            tCtx.arc(0, 0, cx * 0.95, -0.26, 0);
            tCtx.closePath();
            tCtx.fill();
            tCtx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
            tCtx.lineWidth = 1.2;
            tCtx.beginPath();
            tCtx.moveTo(0, 0);
            tCtx.lineTo(cx * 0.95, 0);
            tCtx.stroke();
            tCtx.restore();

            // Layer 3: Island Landmasses & Shaded Relief Contours
            // Main Island Coastal Shelf
            tCtx.fillStyle = '#0e4259';
            tCtx.beginPath();
            tCtx.arc(cx, cy, 1720 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            // Main Island Sandy Beach Rim
            tCtx.fillStyle = '#ca8a04';
            tCtx.beginPath();
            tCtx.arc(cx, cy, 1670 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            // Main Island Lush Interior
            tCtx.fillStyle = '#15803d';
            tCtx.beginPath();
            tCtx.arc(cx, cy, 1630 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            // Highlands & Mountain Plateau Contours
            tCtx.fillStyle = '#166534';
            tCtx.beginPath();
            tCtx.arc(cx, cy, 1150 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            tCtx.fillStyle = '#14532d';
            tCtx.beginPath();
            tCtx.arc(cx, cy, 750 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            // Volcano Ridge Shaded Massif (NW)
            tCtx.fillStyle = '#052e16';
            tCtx.beginPath();
            tCtx.ellipse(cx - 680 * mapScale, cy - 650 * mapScale, 280 * mapScale, 220 * mapScale, Math.PI / 4, 0, Math.PI * 2);
            tCtx.fill();

            // Wayward Island (East Off-Coast)
            const wix = cx + 1960 * mapScale;
            const wiz = cy + 540 * mapScale;
            tCtx.fillStyle = '#0e4259';
            tCtx.beginPath();
            tCtx.arc(wix, wiz, 380 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            tCtx.fillStyle = '#ca8a04';
            tCtx.beginPath();
            tCtx.arc(wix, wiz, 355 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            tCtx.fillStyle = '#14532d';
            tCtx.beginPath();
            tCtx.arc(wix, wiz, 335 * mapScale, 0, Math.PI * 2);
            tCtx.fill();

            // Wayward Causeway Highway & Suspension Bridge
            const cbStartX = cx + 1120 * mapScale;
            const cbEndX = cx + 1780 * mapScale;
            const cbY = cy + 540 * mapScale;
            // Bridge deck
            tCtx.strokeStyle = '#334155';
            tCtx.lineWidth = 7.0;
            tCtx.beginPath();
            tCtx.moveTo(cbStartX, cbY);
            tCtx.lineTo(cbEndX, cbY);
            tCtx.stroke();

            // Bridge center line
            tCtx.strokeStyle = '#f59e0b';
            tCtx.lineWidth = 1.8;
            tCtx.beginPath();
            tCtx.moveTo(cbStartX, cbY);
            tCtx.lineTo(cbEndX, cbY);
            tCtx.stroke();

            // Bridge Towers
            [cbStartX + (cbEndX - cbStartX) * 0.35, cbStartX + (cbEndX - cbStartX) * 0.65].forEach(tx => {
                tCtx.fillStyle = '#f8fafc';
                tCtx.fillRect(tx - 2, cbY - 7, 4, 14);
            });

            // Layer 4: Multi-Ring Highway Network
            // Outer Highway Ribbon
            tCtx.strokeStyle = '#334155';
            tCtx.lineWidth = 6.0;
            tCtx.beginPath();
            for (let i = 0; i <= 96; i++) {
                const theta = (i / 96) * Math.PI * 2;
                const r = getOuterRoadRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) tCtx.moveTo(mx, my);
                else tCtx.lineTo(mx, my);
            }
            tCtx.stroke();

            // Outer Highway Centerline
            tCtx.strokeStyle = '#fde047';
            tCtx.lineWidth = 1.2;
            tCtx.setLineDash([4, 4]);
            tCtx.stroke();
            tCtx.setLineDash([]);

            // Inner Highway Ribbon
            tCtx.strokeStyle = '#334155';
            tCtx.lineWidth = 5.0;
            tCtx.beginPath();
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                const r = getInnerRoadRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) tCtx.moveTo(mx, my);
                else tCtx.lineTo(mx, my);
            }
            tCtx.stroke();

            tCtx.strokeStyle = '#fde047';
            tCtx.lineWidth = 1.0;
            tCtx.setLineDash([3, 4]);
            tCtx.stroke();
            tCtx.setLineDash([]);

            // Cross-Island Arterials
            tCtx.strokeStyle = '#334155';
            tCtx.lineWidth = 5.0;
            tCtx.beginPath();
            tCtx.moveTo(cx, cy - 1140 * mapScale);
            tCtx.lineTo(cx, cy + 1140 * mapScale);
            tCtx.moveTo(cx - 1120 * mapScale, cy + 25 * mapScale);
            tCtx.lineTo(cx + 1180 * mapScale, cy + 25 * mapScale);
            tCtx.moveTo(cx + 1180 * mapScale, cy + 60 * mapScale);
            tCtx.lineTo(cx + 1320 * mapScale, cy + 60 * mapScale);
            tCtx.stroke();

            tCtx.strokeStyle = '#fde047';
            tCtx.lineWidth = 1.0;
            tCtx.setLineDash([3, 4]);
            tCtx.stroke();
            tCtx.setLineDash([]);

            // Layer 5: Island Railway Circuit Track
            // Ballast bed
            tCtx.strokeStyle = '#1e293b';
            tCtx.lineWidth = 4.5;
            tCtx.beginPath();
            for (let i = 0; i <= 96; i++) {
                const theta = (i / 96) * Math.PI * 2;
                const r = getRailwayRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) tCtx.moveTo(mx, my);
                else tCtx.lineTo(mx, my);
            }
            tCtx.stroke();

            // Track rails
            tCtx.strokeStyle = '#cbd5e1';
            tCtx.lineWidth = 2.0;
            tCtx.setLineDash([4, 3]);
            tCtx.stroke();
            tCtx.setLineDash([]);

            // The Griffin Rock Express Train (All 7 cars drawn with orientation)
            if (typeof islandTrain !== 'undefined' && islandTrain && islandTrain.cars.length > 0) {
                for (let i = 0; i < islandTrain.cars.length; i++) {
                    const car = islandTrain.cars[i];
                    const carX = cx + car.x * mapScale;
                    const carY = cy + car.z * mapScale;
                    const heading = car.heading || 0;

                    tCtx.save();
                    tCtx.translate(carX, carY);
                    tCtx.rotate(-heading + Math.PI / 2);

                    const carW = i === 0 ? 5.5 : 4.5;
                    const carL = i === 0 ? 9.5 : (i === 1 ? 6.5 : 8.5);

                    if (i === 0) {
                        // Locomotive: Sky Blue with Gold Cab
                        tCtx.fillStyle = '#0284c7';
                        tCtx.fillRect(-carW / 2, -carL / 2, carW, carL);
                        tCtx.fillStyle = '#facc15';
                        tCtx.fillRect(-carW / 2, carL / 2 - 3.5, carW, 3.5);
                        tCtx.strokeStyle = '#ffffff';
                        tCtx.lineWidth = 1.0;
                        tCtx.strokeRect(-carW / 2, -carL / 2, carW, carL);

                        // Headlight Beam
                        tCtx.fillStyle = 'rgba(250, 204, 21, 0.35)';
                        tCtx.beginPath();
                        tCtx.moveTo(0, -carL / 2);
                        tCtx.lineTo(-12, -carL / 2 - 24);
                        tCtx.lineTo(12, -carL / 2 - 24);
                        tCtx.closePath();
                        tCtx.fill();
                    } else if (i === islandTrain.cars.length - 1) {
                        // Caboose: Bright Red
                        tCtx.fillStyle = '#ef4444';
                        tCtx.fillRect(-carW / 2, -carL / 2, carW, carL);
                        tCtx.strokeStyle = '#fecaca';
                        tCtx.lineWidth = 1.0;
                        tCtx.strokeRect(-carW / 2, -carL / 2, carW, carL);
                        // Flashing lantern
                        const flash = Math.sin(now * 0.01) > 0 ? '#facc15' : '#b91c1c';
                        tCtx.fillStyle = flash;
                        tCtx.beginPath();
                        tCtx.arc(0, carL / 2, 2.0, 0, Math.PI * 2);
                        tCtx.fill();
                    } else {
                        // Passenger coaches & tender
                        tCtx.fillStyle = '#0369a1';
                        tCtx.fillRect(-carW / 2, -carL / 2, carW, carL);
                        tCtx.strokeStyle = '#bae6fd';
                        tCtx.lineWidth = 0.8;
                        tCtx.strokeRect(-carW / 2, -carL / 2, carW, carL);
                    }
                    tCtx.restore();
                }

                // Train Name Banner
                const loco = islandTrain.cars[0];
                const lx = cx + loco.x * mapScale;
                const ly = cy + loco.z * mapScale;
                tCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                tCtx.fillRect(lx - 55, ly - 22, 110, 15);
                tCtx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
                tCtx.lineWidth = 1;
                tCtx.strokeRect(lx - 55, ly - 22, 110, 15);
                tCtx.fillStyle = '#38bdf8';
                tCtx.font = 'bold 8.5px "JetBrains Mono", monospace';
                tCtx.textAlign = 'center';
                tCtx.fillText('GRIFFIN ROCK EXPRESS', lx, ly - 11);
            }

            // Layer 6: Key Island Landmarks with Badges
            const landmarks = [
                { name: "RESCUE BOTS HQ", x: HQ_SWAP_PAD.x, z: HQ_SWAP_PAD.z, color: '#06b6d4' },
                { name: "DINO RIDGE", x: -750, z: -750, color: '#22c55e' },
                { name: "BOARDWALK", x: bwX, z: bwZ, color: '#f59e0b' },
                { name: "DR. GREENE'S LAB", x: testYard.baseX, z: testYard.baseZ, color: '#38bdf8' },
                { name: "EAST LIGHTHOUSE", x: 1320, z: 60, color: '#f43f5e' },
                { name: "WAYWARD RUINS", x: 1960, z: 540, color: '#c084fc' },
                { name: "MOROCCO'S LAIR", x: -820, z: -1180, color: '#a855f7' }
            ];

            landmarks.forEach(lm => {
                const lx = cx + lm.x * mapScale;
                const lz = cy + lm.z * mapScale;

                tCtx.fillStyle = lm.color;
                tCtx.beginPath();
                tCtx.arc(lx, lz, 5.0, 0, Math.PI * 2);
                tCtx.fill();
                tCtx.strokeStyle = '#ffffff';
                tCtx.lineWidth = 1.4;
                tCtx.stroke();

                // Labeled Pill
                tCtx.font = 'bold 9px Fredoka, sans-serif';
                const textW = tCtx.measureText(lm.name).width;
                tCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                tCtx.fillRect(lx - textW / 2 - 4, lz + 7, textW + 8, 14);
                tCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                tCtx.lineWidth = 0.8;
                tCtx.strokeRect(lx - textW / 2 - 4, lz + 7, textW + 8, 14);
                tCtx.fillStyle = '#f8fafc';
                tCtx.textAlign = 'center';
                tCtx.fillText(lm.name, lx, lz + 17);
            });

            // Layer 7: Discovered Visiting Autobots
            if (typeof visitingAutobots !== 'undefined' && visitingAutobots.length > 0) {
                visitingAutobots.forEach(ally => {
                    const isOccupied = (player.botType === ally.id) || (buddyBot && buddyBot.botType === ally.id);
                    if (isOccupied) return;
                    const isDiscovered = Array.isArray(progression.discoveredAllies) && progression.discoveredAllies.includes(ally.id);
                    if (!isDiscovered) return;

                    const ax = cx + ally.x * mapScale;
                    const az = cy + ally.z * mapScale;

                    tCtx.fillStyle = ally.badgeColor || '#a855f7';
                    tCtx.beginPath();
                    tCtx.arc(ax, az, 5.5, 0, Math.PI * 2);
                    tCtx.fill();
                    tCtx.strokeStyle = '#ffffff';
                    tCtx.lineWidth = 1.5;
                    tCtx.stroke();

                    tCtx.font = 'bold 8.5px "JetBrains Mono", monospace';
                    const nameW = tCtx.measureText(ally.name).width;
                    tCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                    tCtx.fillRect(ax - nameW / 2 - 3, az - 18, nameW + 6, 13);
                    tCtx.fillStyle = ally.badgeColor || '#a855f7';
                    tCtx.textAlign = 'center';
                    tCtx.fillText(ally.name, ax, az - 8);
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
                    tCtx.strokeStyle = meta.color;
                    tCtx.lineWidth = 1.2;
                    tCtx.beginPath();
                    tCtx.arc(ax, az, 7.5 + aPulse, 0, Math.PI * 2);
                    tCtx.stroke();

                    // Central diamond / circle badge
                    tCtx.fillStyle = meta.color;
                    tCtx.beginPath();
                    tCtx.arc(ax, az, 5.2, 0, Math.PI * 2);
                    tCtx.fill();
                    tCtx.strokeStyle = '#ffffff';
                    tCtx.lineWidth = 1.4;
                    tCtx.stroke();

                    // Label callout badge
                    const isCurrentBot = player.botType === botKey;
                    const labelText = meta.name;
                    tCtx.font = isCurrentBot ? 'bold 9.2px "JetBrains Mono", monospace' : 'bold 8.2px "JetBrains Mono", monospace';
                    const lw = tCtx.measureText(labelText).width;
                    tCtx.fillStyle = isCurrentBot ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.88)';
                    tCtx.fillRect(ax - lw / 2 - 4, az + 8, lw + 8, 14);
                    tCtx.strokeStyle = isCurrentBot ? '#facc15' : meta.color;
                    tCtx.lineWidth = isCurrentBot ? 1.4 : 0.9;
                    tCtx.strokeRect(ax - lw / 2 - 4, az + 8, lw + 8, 14);

                    tCtx.fillStyle = isCurrentBot ? '#facc15' : '#f8fafc';
                    tCtx.textAlign = 'center';
                    tCtx.fillText(labelText, ax, az + 18);
                });
            }

            // Layer 8: 8 Emergency Beacons with Pulse Radar Rings & Callout Badges
            let activeEmergencyCount = 0;
            let nearestActiveDist = Infinity;
            let nearestActiveBeacon = null;

            beacons.forEach(b => {
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
                    tCtx.strokeStyle = ringColor;
                    tCtx.lineWidth = 1.8;
                    tCtx.beginPath();
                    tCtx.arc(bx, bz, 11 + pulse, 0, Math.PI * 2);
                    tCtx.stroke();

                    tCtx.strokeStyle = ringColor;
                    tCtx.lineWidth = 1.0;
                    tCtx.beginPath();
                    tCtx.arc(bx, bz, 18 + pulse * 1.5, 0, Math.PI * 2);
                    tCtx.stroke();

                    // Beacon Core
                    tCtx.fillStyle = b.type === 'FIRE' ? '#ea580c' : (b.type === 'TEAMUP' ? '#0284c7' : '#e11d48');
                    tCtx.beginPath();
                    tCtx.arc(bx, bz, 6.5, 0, Math.PI * 2);
                    tCtx.fill();
                    tCtx.strokeStyle = '#ffffff';
                    tCtx.lineWidth = 1.8;
                    tCtx.stroke();

                    // Emergency Badge Callout
                    const labelText = `${b.name} (${distFromPlayer}m)`;
                    tCtx.font = 'bold 9.5px Fredoka, sans-serif';
                    const lw = tCtx.measureText(labelText).width;
                    tCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
                    tCtx.fillRect(bx - lw / 2 - 5, bz - 21, lw + 10, 16);
                    tCtx.strokeStyle = b.type === 'FIRE' ? '#fb923c' : (b.type === 'TEAMUP' ? '#38bdf8' : '#f43f5e');
                    tCtx.lineWidth = 1.2;
                    tCtx.strokeRect(bx - lw / 2 - 5, bz - 21, lw + 10, 16);

                    tCtx.fillStyle = b.type === 'FIRE' ? '#fdba74' : (b.type === 'TEAMUP' ? '#7dd3fc' : '#fda4af');
                    tCtx.textAlign = 'center';
                    tCtx.fillText(labelText, bx, bz - 9);
                } else {
                    // Cleared Beacon (Emerald Dot)
                    tCtx.fillStyle = '#22c55e';
                    tCtx.beginPath();
                    tCtx.arc(bx, bz, 4.2, 0, Math.PI * 2);
                    tCtx.fill();
                    tCtx.strokeStyle = '#ffffff';
                    tCtx.lineWidth = 1.2;
                    tCtx.stroke();

                    tCtx.font = 'bold 8px Fredoka, sans-serif';
                    tCtx.fillStyle = '#86efac';
                    tCtx.textAlign = 'center';
                    tCtx.fillText(`${b.name} ✓`, bx, bz + 12);
                }
            });

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

                tCtx.save();
                tCtx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
                tCtx.lineWidth = 1.6;
                tCtx.setLineDash([5, 4]);
                tCtx.beginPath();
                tCtx.moveTo(px, pz);
                tCtx.lineTo(nbx, nbz);
                tCtx.stroke();
                tCtx.restore();

                // Distance readout along vector
                const midX = (px + nbx) / 2;
                const midY = (pz + nbz) / 2;
                tCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
                tCtx.fillRect(midX - 22, midY - 8, 44, 15);
                tCtx.strokeStyle = '#facc15';
                tCtx.lineWidth = 1.0;
                tCtx.strokeRect(midX - 22, midY - 8, 44, 15);
                tCtx.fillStyle = '#fde047';
                tCtx.font = 'bold 8.5px "JetBrains Mono", monospace';
                tCtx.textAlign = 'center';
                tCtx.fillText(`${nearestActiveDist}m`, midX, midY + 3);
            }

            // Layer 10: Buddy Bot (Cyan Wingman Chevron + Callout)
            if (buddyBot && buddyBot.botType && buddyBot.botType !== player.botType) {
                const bx = cx + buddyBot.pos.x * mapScale;
                const bz = cy + buddyBot.pos.z * mapScale;

                tCtx.save();
                tCtx.translate(bx, bz);
                tCtx.rotate(-buddyBot.heading + Math.PI);
                tCtx.fillStyle = '#38bdf8';
                tCtx.beginPath();
                tCtx.moveTo(0, -9);
                tCtx.lineTo(7.5, 8);
                tCtx.lineTo(0, 3.5);
                tCtx.lineTo(-7.5, 8);
                tCtx.closePath();
                tCtx.fill();
                tCtx.strokeStyle = '#ffffff';
                tCtx.lineWidth = 1.4;
                tCtx.stroke();
                tCtx.restore();

                // Buddy Label Pill
                const bLabel = `${buddyBot.botType} (BUDDY)`;
                tCtx.font = 'bold 9px "JetBrains Mono", monospace';
                const bw = tCtx.measureText(bLabel).width;
                tCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                tCtx.fillRect(bx - bw / 2 - 4, bz + 11, bw + 8, 14);
                tCtx.strokeStyle = '#38bdf8';
                tCtx.lineWidth = 1.0;
                tCtx.strokeRect(bx - bw / 2 - 4, bz + 11, bw + 8, 14);
                tCtx.fillStyle = '#7dd3fc';
                tCtx.textAlign = 'center';
                tCtx.fillText(bLabel, bx, bz + 21);
            }

            // Layer 11: Active Player Bot (Golden Chevron + Pulsing Ring + HUD Label)
            tCtx.save();
            // Pulsing aura ring
            const pPulse = Math.sin(now * 0.008) * 3.5;
            tCtx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
            tCtx.lineWidth = 2.0;
            tCtx.beginPath();
            tCtx.arc(px, pz, 13 + pPulse, 0, Math.PI * 2);
            tCtx.stroke();

            // Player Chevron
            tCtx.translate(px, pz);
            tCtx.rotate(-player.heading + Math.PI);
            tCtx.fillStyle = '#facc15';
            tCtx.beginPath();
            tCtx.moveTo(0, -11);
            tCtx.lineTo(9.0, 9.5);
            tCtx.lineTo(0, 4.5);
            tCtx.lineTo(-9.0, 9.5);
            tCtx.closePath();
            tCtx.fill();
            tCtx.strokeStyle = '#ffffff';
            tCtx.lineWidth = 1.6;
            tCtx.stroke();
            tCtx.restore();

            // Player Label Pill with Speed
            const pSpeedKmH = Math.round(Math.abs(player.speed) * 3.6);
            const pLabel = `${player.botType} (YOU) • ${pSpeedKmH} km/h`;
            tCtx.font = 'bold 9.5px "JetBrains Mono", monospace';
            const pw = tCtx.measureText(pLabel).width;
            tCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            tCtx.fillRect(px - pw / 2 - 5, pz - 25, pw + 10, 15);
            tCtx.strokeStyle = '#facc15';
            tCtx.lineWidth = 1.2;
            tCtx.strokeRect(px - pw / 2 - 5, pz - 25, pw + 10, 15);
            tCtx.fillStyle = '#fef08a';
            tCtx.textAlign = 'center';
            tCtx.fillText(pLabel, px, pz - 14);

            // Layer 12: Tactical Compass Rose (Upper Right)
            const compassX = w - 52;
            const compassY = 52;
            tCtx.save();
            tCtx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
            tCtx.lineWidth = 1.5;
            tCtx.beginPath();
            tCtx.arc(compassX, compassY, 26, 0, Math.PI * 2);
            tCtx.stroke();

            // North Arrow Pointer
            tCtx.fillStyle = '#facc15';
            tCtx.beginPath();
            tCtx.moveTo(compassX, compassY - 22);
            tCtx.lineTo(compassX + 5, compassY - 5);
            tCtx.lineTo(compassX, compassY);
            tCtx.lineTo(compassX - 5, compassY - 5);
            tCtx.closePath();
            tCtx.fill();

            // South Pointer
            tCtx.fillStyle = '#64748b';
            tCtx.beginPath();
            tCtx.moveTo(compassX, compassY + 22);
            tCtx.lineTo(compassX + 4, compassY + 5);
            tCtx.lineTo(compassX, compassY);
            tCtx.lineTo(compassX - 4, compassY + 5);
            tCtx.closePath();
            tCtx.fill();

            tCtx.fillStyle = '#facc15';
            tCtx.font = 'bold 10px "JetBrains Mono", monospace';
            tCtx.textAlign = 'center';
            tCtx.fillText('N', compassX, compassY - 28);
            tCtx.fillStyle = '#94a3b8';
            tCtx.fillText('S', compassX, compassY + 37);
            tCtx.fillText('W', compassX - 35, compassY + 3.5);
            tCtx.fillText('E', compassX + 35, compassY + 3.5);
            tCtx.restore();

            // Layer 13: Tactical Scale Bar (Lower Left)
            const sbX = 28;
            const sbY = h - 26;
            const barLength = 500 * mapScale;
            tCtx.strokeStyle = '#38bdf8';
            tCtx.lineWidth = 2.0;
            tCtx.beginPath();
            tCtx.moveTo(sbX, sbY);
            tCtx.lineTo(sbX + barLength, sbY);
            tCtx.moveTo(sbX, sbY - 4);
            tCtx.lineTo(sbX, sbY + 4);
            tCtx.moveTo(sbX + barLength, sbY - 4);
            tCtx.lineTo(sbX + barLength, sbY + 4);
            tCtx.stroke();

            tCtx.fillStyle = '#38bdf8';
            tCtx.font = 'bold 9px "JetBrains Mono", monospace';
            tCtx.textAlign = 'left';
            tCtx.fillText('0', sbX - 2, sbY - 6);
            tCtx.textAlign = 'right';
            tCtx.fillText('500M', sbX + barLength + 2, sbY - 6);
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

// Minimap Radar & Full-Screen Tactical Island Map System
import { player, buddyBot } from '../state/gameState.js';
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

                const isHighTideWaterWaypoint = (player.botType === 'HIGHTIDE' && (player.mode === 'VEHICLE' || (player.mode === 'DINO' && isPointInWater(worldX, worldZ))));
                let ty = getSurfaceHeight(worldX, worldZ);
                const markerY = isHighTideWaterWaypoint ? -0.45 : Math.max(0.0, ty);

                player.waypoint.set(worldX, markerY, worldZ);
                player.hasWaypoint = true;
                waypointGroup.position.set(worldX, markerY, worldZ);
                waypointGroup.visible = true;

                if (typeof sfx !== 'undefined' && sfx.playWaypointTap) sfx.playWaypointTap();
                spawnBurstParticles(worldX, markerY + 0.5, worldZ, 0xfacc15, 6, 0.8);
                showToast("AUTOPILOT SET", `Navigating to (${Math.round(worldX)}, ${Math.round(worldZ)})`);
                closeTacticalMap();
            }


        // 10A. CLEAN & UNCLUTTERED HUD MINIMAP (160x160 circular dial)
        // =====================================================================
        export function renderMinimap() {
            ensureMapCanvases();
            if (!mCtx) return;
            const w = minimapCanvas.width;
            const h = minimapCanvas.height;
            const cx = w / 2;
            const cy = h / 2;

            mCtx.clearRect(0, 0, w, h);

            // Deep Ocean background
            mCtx.fillStyle = '#082f49';
            mCtx.beginPath();
            mCtx.arc(cx, cy, cx, 0, Math.PI * 2);
            mCtx.fill();

            const mapScale = (cx * 0.70) / 1950;

            // Main Island landmass
            mCtx.fillStyle = '#166534';
            mCtx.beginPath();
            mCtx.arc(cx, cy, 1650 * mapScale, 0, Math.PI * 2);
            mCtx.fill();

            // Wayward Island landmass
            const wix = cx + 1960 * mapScale;
            const wiz = cy + 540 * mapScale;
            mCtx.fillStyle = '#14532d';
            mCtx.beginPath();
            mCtx.arc(wix, wiz, 340 * mapScale, 0, Math.PI * 2);
            mCtx.fill();

            // Wayward Causeway Highway and Suspension Bridge
            mCtx.strokeStyle = '#f59e0b';
            mCtx.lineWidth = 2.4;
            mCtx.beginPath();
            mCtx.moveTo(cx + 1120 * mapScale, cy + 540 * mapScale);
            mCtx.lineTo(cx + 1780 * mapScale, cy + 540 * mapScale);
            mCtx.stroke();

            // Inner & Outer Coastal Highway Loops + Arterials
            mCtx.strokeStyle = '#475569';
            mCtx.lineWidth = 2.0;
            mCtx.beginPath();
            mCtx.arc(cx, cy, INNER_LOOP_RADIUS * mapScale, 0, Math.PI * 2);
            mCtx.stroke();

            mCtx.beginPath();
            mCtx.arc(cx, cy, OUTER_LOOP_RADIUS * mapScale, 0, Math.PI * 2);
            mCtx.stroke();

            mCtx.beginPath();
            mCtx.moveTo(cx, cy - 1140 * mapScale);
            mCtx.lineTo(cx, cy + 1140 * mapScale);
            mCtx.moveTo(cx - 1120 * mapScale, cy + 25 * mapScale);
            mCtx.lineTo(cx + 1180 * mapScale, cy + 25 * mapScale);
            mCtx.moveTo(cx + 1180 * mapScale, cy + 60 * mapScale);
            mCtx.lineTo(cx + 1320 * mapScale, cy + 60 * mapScale);
            mCtx.stroke();

            // Griffin Rock Island Railway Circuit Track
            mCtx.save();
            mCtx.strokeStyle = '#94a3b8';
            mCtx.lineWidth = 1.6;
            mCtx.setLineDash([4, 3]);
            mCtx.beginPath();
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                const r = getRailwayRadius(theta) * mapScale;
                const mx = cx + Math.cos(theta) * r;
                const my = cy + Math.sin(theta) * r;
                if (i === 0) mCtx.moveTo(mx, my);
                else mCtx.lineTo(mx, my);
            }
            mCtx.stroke();
            mCtx.restore();

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

            // Rescue Bots HQ
            const hqx = cx + (typeof HQ_SWAP_PAD !== 'undefined' ? HQ_SWAP_PAD.x : 0) * mapScale;
            const hqz = cy + (typeof HQ_SWAP_PAD !== 'undefined' ? HQ_SWAP_PAD.z : -15) * mapScale;
            mCtx.fillStyle = '#38bdf8';
            mCtx.fillRect(hqx - 3.5, hqz - 3.5, 7, 7);
            mCtx.strokeStyle = '#ffffff';
            mCtx.lineWidth = 1;
            mCtx.strokeRect(hqx - 3.5, hqz - 3.5, 7, 7);

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

            beacons.forEach(b => {
                const bx = cx + b.x * mapScale;
                const bz = cy + b.z * mapScale;

                if (!b.restored) {
                    const d = Math.hypot(player.pos.x - b.x, player.pos.z - b.z);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearestName = `${b.name} (${Math.round(d)}m)`;
                    }
                }

                mCtx.fillStyle = b.restored ? '#4ade80' : (b.type === 'FIRE' ? '#fb923c' : '#f43f5e');
                mCtx.beginPath();
                mCtx.arc(bx, bz, b.restored ? 2.8 : 4.4, 0, Math.PI * 2);
                mCtx.fill();
                mCtx.strokeStyle = '#ffffff';
                mCtx.lineWidth = 1.0;
                mCtx.stroke();
            });

            const hintEl = document.getElementById('nearest-hazard-hint');
            if (hintEl) {
                hintEl.textContent = nearestDist < Infinity ? `Nearest: ${nearestName}` : `All 8 Emergencies Resolved!`;
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
                { name: "RESCUE BOTS HQ", x: HQ_SWAP_PAD.x, z: HQ_SWAP_PAD.z, color: '#06b6d4', icon: '🏛️' },
                { name: "DINO RIDGE", x: -750, z: -750, color: '#22c55e', icon: '🦖' },
                { name: "BOARDWALK", x: bwX, z: bwZ, color: '#f59e0b', icon: '🎡' },
                { name: "DR. GREENE'S LAB", x: testYard.baseX, z: testYard.baseZ, color: '#38bdf8', icon: '⚡' },
                { name: "EAST LIGHTHOUSE", x: 1320, z: 60, color: '#f43f5e', icon: '🚨' },
                { name: "WAYWARD RUINS", x: 1960, z: 540, color: '#c084fc', icon: '🗿' },
                { name: "MOROCCO'S LAIR", x: -820, z: -1180, color: '#a855f7', icon: '🛸' }
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
                    const ringColor = b.type === 'FIRE' ? 'rgba(251, 146, 60, 0.45)' : 'rgba(244, 63, 94, 0.45)';
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
                    tCtx.fillStyle = b.type === 'FIRE' ? '#ea580c' : '#e11d48';
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
                    tCtx.strokeStyle = b.type === 'FIRE' ? '#fb923c' : '#f43f5e';
                    tCtx.lineWidth = 1.2;
                    tCtx.strokeRect(bx - lw / 2 - 5, bz - 21, lw + 10, 16);

                    tCtx.fillStyle = b.type === 'FIRE' ? '#fdba74' : '#fda4af';
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

// Dedicated 3D Scene: Sub-Oceanic Mainland Express Rail Tunnel (Griffin Rock <-> Mainland Terminal)
// While inside the tunnel, Toreinbotto is locked in Shinkansen Train Mode on the rails (no bot-switching or transforming).
import * as THREE from 'three';
import { scene, camera } from '../rendering/scene.js';
import { player, buddyBot, botRigs, worldState } from '../state/gameState.js';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';
import { applyBotRigMorph } from '../bots/botRigs.js';
import { sfx } from '../audio/soundFX.js';
import { isActionActive } from '../settings/settings.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { progression, saveProgression, syncProgressionHUD } from '../progression/progression.js';
import { setActiveParticleScene, spawnBurstParticles } from './emergencies.js';
import { createHumanNPCMesh } from './npcModels.js';
import {
    makeProceduralRailTrackTexture,
    RAIL_TUNNEL_PORTAL_DIST,
    getRailwayPoseAtDist,
    railwayTotalDist
} from './railway.js';

export const RAIL_TUNNEL_LENGTH = 1800;
const TERMINAL_Z = 1745;

export let railTunnelScene: THREE.Scene | null = null;
let _tunnelBuilt = false;

interface TunnelRing {
    mesh: THREE.Mesh;
    z: number;
    collected: boolean;
}

interface SeaCreature {
    group: THREE.Group;
    baseX: number;
    baseY: number;
    baseZ: number;
    speed: number;
    ampX: number;
    phase: number;
}

interface TerminalCitizen {
    rig: ReturnType<typeof createHumanNPCMesh>;
    baseY: number;
    phase: number;
}

const _rings: TunnelRing[] = [];
const _seaCreatures: SeaCreature[] = [];
const _citizens: TerminalCitizen[] = [];
let _terminalPadRing: THREE.Mesh | null = null;

// Runtime state inside tunnel
let _tunnelZ = 24;
let _tunnelSpeed = 0;
let _tunnelBoostTimer = 0;
let _tunnelWheelCycle = 0;
let _tunnelChugTimer = 0;
let _arrivedMainland = false;
let _touchDir = 0; // +1 forward, -1 reverse, 0 coast

export function setRailTunnelTouch(dir: number) {
    _touchDir = dir;
}

export function triggerRailTunnelBoost() {
    if (worldState.activeArea !== 'RAIL_TUNNEL') return;
    _tunnelBoostTimer = 2.6;
    if (_tunnelSpeed >= -2) {
        _tunnelSpeed = Math.max(_tunnelSpeed + 22, 68);
    } else {
        _tunnelSpeed = Math.min(_tunnelSpeed - 22, -62);
    }
    sfx.playTrainWhistle();
    spawnBurstParticles(0, 2.2, _tunnelZ - 5.5, 0x38bdf8, 18, 1.8);
    spawnBurstParticles(0, 2.2, _tunnelZ - 5.5, 0xfacc15, 14, 1.5);
}

function buildSeaCreature(kind: 'FISH' | 'MANTA' | 'WHALE'): THREE.Group {
    const g = new THREE.Group();
    if (kind === 'WHALE') {
        const matWhale = new THREE.MeshToonMaterial({ color: 0x0369a1, gradientMap: toonGrad3 });
        const matBelly = new THREE.MeshToonMaterial({ color: 0xbae6fd, gradientMap: toonGrad3 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(4.2, 14, 12), matWhale);
        body.scale.set(0.85, 0.72, 2.5);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(3.8, 12, 10), matBelly);
        belly.scale.set(0.75, 0.42, 2.2);
        belly.position.y = -1.1;
        const finL = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 2.4), matWhale);
        finL.position.set(-4.6, -0.4, 1.2);
        finL.rotation.z = -0.25;
        const finR = finL.clone();
        finR.position.x = 4.6;
        finR.rotation.z = 0.25;
        const tail = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.45, 2.4), matWhale);
        tail.position.set(0, 0.2, -10.4);
        g.add(body, belly, finL, finR, tail);
    } else if (kind === 'MANTA') {
        const matManta = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad3 });
        const wing = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4.6, 4).rotateX(Math.PI / 2), matManta);
        wing.scale.set(1.65, 0.14, 1.0);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.2, 6).rotateX(Math.PI / 2), matManta);
        tail.position.z = -3.8;
        g.add(wing, tail);
    } else {
        const colors = [0x38bdf8, 0xfacc15, 0xf472b6, 0x34d399];
        const matFish = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), matFish);
        body.scale.set(0.6, 0.75, 1.7);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4).rotateX(-Math.PI / 2), matFish);
        tail.position.z = -1.25;
        g.add(body, tail);
    }
    return g;
}

function buildRailTunnelScene() {
    if (_tunnelBuilt && railTunnelScene) return;
    _tunnelBuilt = true;

    railTunnelScene = new THREE.Scene();
    railTunnelScene.background = new THREE.Color(0x061326);
    railTunnelScene.fog = new THREE.FogExp2(0x061326, 0.0042);

    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.05);
    railTunnelScene.add(hemi);
    const dir = new THREE.DirectionalLight(0xe0f2fe, 1.15);
    dir.position.set(12, 34, 40);
    railTunnelScene.add(dir);

    // Continuous Gleaming Dual Steel Railway Track Bed (1,820m straight express corridor)
    const railTex = makeProceduralRailTrackTexture();
    railTex.repeat.set(1, 220);
    const trackGeo = new THREE.PlaneGeometry(14.8, RAIL_TUNNEL_LENGTH + 40);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshLambertMaterial({ map: railTex });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.set(0, 0, RAIL_TUNNEL_LENGTH * 0.5);
    railTunnelScene.add(trackMesh);

    // Concrete Side Walkways flanking the tracks
    const matConcrete = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    const matCobalt = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 });
    const matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matRock = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matCrystal = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    [-9.2, 9.2].forEach(wx => {
        const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.4, RAIL_TUNNEL_LENGTH + 40), matConcrete);
        ledge.position.set(wx, 0.7, RAIL_TUNNEL_LENGTH * 0.5);
        railTunnelScene!.add(ledge);
    });

    // =========================================================================
    // SECTION 1: GRIFFIN ROCK MOUNTAIN BORE (z = 0..550m)
    // =========================================================================
    const boreTubeGeo = new THREE.CylinderGeometry(12.2, 12.2, 560, 18, 1, true, 0, Math.PI);
    boreTubeGeo.rotateZ(Math.PI / 2);
    boreTubeGeo.rotateY(Math.PI / 2);
    const boreMat = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3, side: THREE.BackSide });
    const boreShell = new THREE.Mesh(boreTubeGeo, boreMat);
    boreShell.position.set(0, 0.5, 275);
    railTunnelScene.add(boreShell);

    // Steel Rib Arches + Warm Amber Tunnel Lights + Energon Crystal Niches
    const ribGeo = new THREE.TorusGeometry(11.6, 0.42, 8, 22, Math.PI);
    const lightBarGeo = new THREE.BoxGeometry(4.2, 0.25, 2.2);
    const crystalGeo = new THREE.OctahedronGeometry(1.15, 0);
    for (let z = 20; z <= 540; z += 36) {
        const rib = new THREE.Mesh(ribGeo, matConcrete);
        rib.position.set(0, 0.5, z);
        railTunnelScene.add(rib);

        const light = new THREE.Mesh(lightBarGeo, matAmberGlow);
        light.position.set(0, 11.4, z);
        railTunnelScene.add(light);

        if (z % 72 === 20) {
            [-9.4, 9.4].forEach(cx => {
                const cr = new THREE.Mesh(crystalGeo, matCrystal);
                cr.position.set(cx, 2.6, z + 14);
                cr.rotation.set(0.3, z * 0.1, 0.2);
                railTunnelScene!.add(cr);
            });
        }
    }

    // =========================================================================
    // SECTION 2: SUB-OCEANIC GLASS VIEWING TUBE (z = 550..1250m)
    // =========================================================================
    const glassGeo = new THREE.CylinderGeometry(12.4, 12.4, 700, 20, 1, true, 0, Math.PI);
    glassGeo.rotateZ(Math.PI / 2);
    glassGeo.rotateY(Math.PI / 2);
    const glassMat = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
    });
    const glassTube = new THREE.Mesh(glassGeo, glassMat);
    glassTube.position.set(0, 0.5, 900);
    railTunnelScene.add(glassTube);

    // Outer Deep-Sea Backdrop Dome enclosing the viewing tube
    const oceanDomeGeo = new THREE.CylinderGeometry(42, 42, 740, 18, 1, true, 0, Math.PI);
    oceanDomeGeo.rotateZ(Math.PI / 2);
    oceanDomeGeo.rotateY(Math.PI / 2);
    const oceanDomeMat = new THREE.MeshBasicMaterial({ color: 0x072646, side: THREE.BackSide });
    const oceanDome = new THREE.Mesh(oceanDomeGeo, oceanDomeMat);
    oceanDome.position.set(0, -1, 900);
    railTunnelScene.add(oceanDome);

    // Cobalt Glass-Tube Structural Ribs + Cyan Undersea Lighting
    const seaRibGeo = new THREE.TorusGeometry(12.1, 0.35, 8, 24, Math.PI);
    for (let z = 560; z <= 1240; z += 40) {
        const rib = new THREE.Mesh(seaRibGeo, matCobalt);
        rib.position.set(0, 0.5, z);
        railTunnelScene.add(rib);

        const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 22), matCyanGlow);
        stripL.position.set(-10.8, 1.9, z);
        const stripR = stripL.clone();
        stripR.position.x = 10.8;
        railTunnelScene.add(stripL, stripR);
    }

    // Animated Sea Creatures swimming outside the glass tube!
    _seaCreatures.length = 0;
    const whale = buildSeaCreature('WHALE');
    whale.position.set(-12, 20, 880);
    railTunnelScene.add(whale);
    _seaCreatures.push({ group: whale, baseX: -6, baseY: 20, baseZ: 880, speed: 0.42, ampX: 16, phase: 0.2 });

    for (let m = 0; m < 4; m++) {
        const manta = buildSeaCreature('MANTA');
        const mz = 620 + m * 165;
        railTunnelScene.add(manta);
        _seaCreatures.push({
            group: manta,
            baseX: (m % 2 === 0 ? -16 : 16),
            baseY: 14 + (m % 3) * 3.5,
            baseZ: mz,
            speed: 0.75 + m * 0.12,
            ampX: 12,
            phase: m * 1.6
        });
    }
    for (let f = 0; f < 16; f++) {
        const fish = buildSeaCreature('FISH');
        const fz = 590 + f * 39;
        railTunnelScene.add(fish);
        _seaCreatures.push({
            group: fish,
            baseX: (f % 2 === 0 ? -16 : 16),
            baseY: 6.5 + (f % 4) * 3.2,
            baseZ: fz,
            speed: 1.4 + (f % 3) * 0.35,
            ampX: 7.5,
            phase: f * 0.9
        });
    }

    // =========================================================================
    // SECTION 3: MAINLAND APPROACH & MAINLAND EXPRESS TERMINAL (z = 1250..1800m)
    // =========================================================================
    const mainBoreGeo = new THREE.CylinderGeometry(13.5, 13.5, 570, 20, 1, true, 0, Math.PI);
    mainBoreGeo.rotateZ(Math.PI / 2);
    mainBoreGeo.rotateY(Math.PI / 2);
    const mainBoreMat = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad4, side: THREE.BackSide });
    const mainBore = new THREE.Mesh(mainBoreGeo, mainBoreMat);
    mainBore.position.set(0, 0.5, 1530);
    railTunnelScene.add(mainBore);

    // Bright Modern Concourse Arches
    for (let z = 1280; z <= 1780; z += 40) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(13.1, 0.36, 8, 24, Math.PI), matCobalt);
        rib.position.set(0, 0.5, z);
        const light = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 3.2), matAmberGlow);
        light.position.set(0, 12.8, z);
        railTunnelScene.add(rib, light);
    }

    // Mainland Express Terminal Platforms (z = 1660..1790)
    const matPlat = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad4 });
    const matGold = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
    [-9.4, 9.4].forEach(px => {
        const plat = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.2, 135), matPlat);
        plat.position.set(px, 1.1, 1725);
        const safetyLine = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 135), matGold);
        safetyLine.position.set(px > 0 ? px - 2.4 : px + 2.4, 2.24, 1725);
        railTunnelScene!.add(plat, safetyLine);
    });

    // Overhead Mainland Terminal Welcome Gantry & Glowing Turnaround Buffer Wall
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(19.5, 2.4, 1.2), matCobalt);
    gantry.position.set(0, 8.8, 1705);
    const gantryTrim = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.65, 1.35), matGold);
    gantryTrim.position.set(0, 8.8, 1705);
    railTunnelScene.add(gantry, gantryTrim);

    const endBuffer = new THREE.Mesh(new THREE.BoxGeometry(16, 8.5, 2.2), matRock);
    endBuffer.position.set(0, 4.25, 1795);
    const bufferGlow = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.8, 0.4), matGold);
    bufferGlow.position.set(0, 3.4, 1793.6);
    railTunnelScene.add(endBuffer, bufferGlow);

    // Glowing Express Turnaround Ring on the Terminal Tracks
    _terminalPadRing = new THREE.Mesh(
        new THREE.RingGeometry(4.2, 5.4, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
    );
    _terminalPadRing.position.set(0, 0.25, TERMINAL_Z);
    railTunnelScene.add(_terminalPadRing);

    // Cheering Mainland Terminal Citizens (using the standard Griffin Rock citizen rig!)
    _citizens.length = 0;
    const skinColors = [0xfde047, 0xfcd34d, 0xfdba74, 0xfef08a];
    const shirtColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0xa855f7, 0xec4899];
    const pantsColors = [0x1e293b, 0x334155, 0x1d4ed8, 0x3f3f46];
    const hairColors = [0x78350f, 0x1e293b, 0x92400e, 0xb45309, 0x0f172a];
    for (let i = 0; i < 12; i++) {
        const side = i % 2 === 0 ? -8.4 : 8.4;
        const cz = 1690 + Math.floor(i / 2) * 15;
        const rig = createHumanNPCMesh({
            skinColor: skinColors[i % skinColors.length],
            shirtColor: shirtColors[i % shirtColors.length],
            pantsColor: pantsColors[i % pantsColors.length],
            hairColor: hairColors[i % hairColors.length],
            hasVisorHat: i % 3 === 0
        });
        rig.radioGem.visible = false;
        rig.root.position.set(side, 2.2, cz);
        rig.root.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        railTunnelScene.add(rig.root);
        _citizens.push({ rig, baseY: 2.2, phase: i * 0.7 });
    }

    // =========================================================================
    // INTERACTIVE SHINKANSEN TURBO RINGS ALONG THE TUNNEL
    // =========================================================================
    _rings.length = 0;
    const ringGeo = new THREE.TorusGeometry(4.3, 0.24, 10, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let z = 140; z <= 1600; z += 112) {
        const mesh = new THREE.Mesh(ringGeo, ringMat.clone());
        mesh.position.set(0, 3.6, z);
        railTunnelScene.add(mesh);
        _rings.push({ mesh, z, collected: false });
    }
}

function setSurfaceHUDForTunnel(inTunnel: boolean) {
    const hideIds = [
        'bot-roster', 'bottom-controls-bar', 'btn-transform', 'btn-hidden-veh', 'btn-action',
        'btn-jump-scan', 'btn-descend', 'btn-siren', 'btn-drill',
        'btn-dive', 'btn-undock', 'btn-enter-tunnel', 'patient-transport-hud'
    ];
    hideIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (inTunnel) {
            el.classList.add('hidden');
        }
    });
    const tunnelHud = document.getElementById('rail-tunnel-hud');
    if (tunnelHud) tunnelHud.classList.toggle('hidden', !inTunnel);
}

export function enterRailTunnel() {
    if (worldState.activeArea === 'RAIL_TUNNEL') return;
    if (player.botType !== 'TOREINBOTTO' || player.mode !== 'VEHICLE') {
        showToast('TRAIN MODE REQUIRED', 'Transform Toreinbotto into Bullet Train Mode on the tracks to enter the Mainland Express Tunnel!');
        return;
    }

    buildRailTunnelScene();
    if (!railTunnelScene) return;

    // Save surface position & switch active area
    worldState.savedSurfacePos.copy(player.pos);
    worldState.savedSurfaceHeading = player.heading;
    worldState.activeArea = 'RAIL_TUNNEL';
    worldState.nearRailTunnel = false;

    // Reset tunnel run state
    _tunnelZ = 24;
    _tunnelSpeed = 42;
    _tunnelBoostTimer = 0;
    _tunnelWheelCycle = 0;
    _arrivedMainland = false;
    _touchDir = 0;
    _rings.forEach(r => {
        r.collected = false;
        r.mesh.visible = true;
    });

    // Reparent Toreinbotto rig & particles into railTunnelScene
    const rig = botRigs?.['TOREINBOTTO'];
    if (rig) {
        railTunnelScene.add(rig.root);
        rig.root.visible = true;
        rig.root.position.set(0, 0.22, _tunnelZ);
        rig.root.rotation.set(0, 0, 0);
        rig.chassis.rotation.set(0, 0, 0);
    }
    camera.position.set(0, 6.2, _tunnelZ - 17.5);
    camera.lookAt(0, 2.8, _tunnelZ + 18);
    setActiveParticleScene(railTunnelScene);
    setSurfaceHUDForTunnel(true);

    const returnBtn = document.getElementById('tunnel-return-btn');
    if (returnBtn) returnBtn.classList.add('hidden');

    sfx.playTrainWhistle();
    showToast('MAINLAND EXPRESS TUNNEL', 'All aboard! Bot switching & transforming locked inside the undersea tunnel!');
    triggerNPCSpeech('TOREINBOTTO', 'Shinkansen Express Rail Hero', 'Entering the Sub-Oceanic Mainland Express Tunnel! Full speed to Mainland Terminal!', 0.96, true);
}

export function exitRailTunnel(fromMainland = false) {
    if (worldState.activeArea !== 'RAIL_TUNNEL') return;

    worldState.activeArea = 'SURFACE';
    _touchDir = 0;

    // Restore Toreinbotto rig & particles to Griffin Rock surface scene
    const rig = botRigs?.['TOREINBOTTO'];
    if (rig) {
        scene.add(rig.root);
        rig.root.visible = true;
    }
    setActiveParticleScene(scene);
    setSurfaceHUDForTunnel(false);

    // Restore Bot Roster & Action HUD visibility
    const restoreVisible = ['bot-roster', 'bottom-controls-bar', 'btn-transform', 'btn-action', 'btn-jump-scan'];
    restoreVisible.forEach(id => document.getElementById(id)?.classList.remove('hidden'));

    // Place Toreinbotto smoothly back on Griffin Rock railway tracks just clear of the portal
    const exitDir = fromMainland ? 1 : -1;
    const exitDist = ((RAIL_TUNNEL_PORTAL_DIST + exitDir * 44) % railwayTotalDist + railwayTotalDist) % railwayTotalDist;
    const pose = getRailwayPoseAtDist(exitDist, exitDir);
    player.pos.set(pose.x, pose.y, pose.z);
    player.heading = pose.heading;
    player.onRailwayTrack = true;
    player.trackDist = exitDist;
    player.trackDir = exitDir;
    player.speed = 24;
    player.railTunnelCooldown = 6.5;
    player.hasWaypoint = false;

    // Keep Buddy Bot nearby
    buddyBot.pos.set(pose.x + 8, pose.y + 0.5, pose.z + 8);

    if (typeof window.syncHUDToActiveBot === 'function') {
        window.syncHUDToActiveBot();
    }

    sfx.playTrainWhistle();
    showToast(
        fromMainland ? 'RETURNED FROM MAINLAND!' : 'EXITED RAIL TUNNEL',
        'Back on the Griffin Rock Island Railway Circuit!'
    );
}

export function updateRailTunnel(dt: number, now: number) {
    if (worldState.activeArea !== 'RAIL_TUNNEL' || !railTunnelScene) return;

    // Input: Desktop keyboard + iPad hold buttons
    let throttle = _touchDir;
    if (isActionActive('forward')) throttle += 1;
    if (isActionActive('backward')) throttle -= 1;
    throttle = Math.max(-1, Math.min(1, throttle));

    if (_tunnelBoostTimer > 0) {
        _tunnelBoostTimer = Math.max(0, _tunnelBoostTimer - dt);
    }

    const maxFwd = _tunnelBoostTimer > 0 ? 78 : 54;
    const maxRev = 42;
    let targetSpd = 0;
    if (throttle > 0) targetSpd = maxFwd;
    else if (throttle < 0) targetSpd = -maxRev;
    else if (_tunnelBoostTimer > 0) targetSpd = maxFwd;

    const accel = throttle !== 0 ? 3.8 : 1.6;
    _tunnelSpeed = THREE.MathUtils.lerp(_tunnelSpeed, targetSpd, Math.min(1, dt * accel));
    _tunnelZ += _tunnelSpeed * dt;

    // Reverse exit back onto Griffin Rock railway tracks
    if (_tunnelZ <= 6 && _tunnelSpeed < -1.0) {
        exitRailTunnel(false);
        return;
    }

    // Clamp at Mainland Express Terminal buffer
    if (_tunnelZ >= TERMINAL_Z) {
        _tunnelZ = TERMINAL_Z;
        if (_tunnelSpeed > 0) _tunnelSpeed = 0;
        if (!_arrivedMainland) {
            _arrivedMainland = true;
            sfx.playTrainWhistle();
            if (typeof sfx.playRankUp === 'function') sfx.playRankUp();
            spawnBurstParticles(0, 3.0, TERMINAL_Z, 0x34d399, 28, 2.2);
            spawnBurstParticles(0, 3.5, TERMINAL_Z, 0xfacc15, 22, 1.8);

            const isFirst = !progression.mainlandTunnelVisited;
            progression.mainlandTunnelVisited = true;
            progression.totalStuntsCompleted = (progression.totalStuntsCompleted || 0) + (isFirst ? 3 : 1);
            saveProgression({ immediate: true });
            syncProgressionHUD();

            showToast(
                'MAINLAND TERMINAL REACHED!',
                isFirst ? 'First Express Run complete! +3 Hero Stars! Tap Return or reverse back to Griffin Rock!' : 'Express Run complete! Tap Return or reverse back to Griffin Rock!'
            );
            triggerNPCSpeech('TOREINBOTTO', 'Shinkansen Express Rail Hero', 'Welcome to Mainland Express Terminal! What an incredible undersea journey!', 0.96, true);

            const returnBtn = document.getElementById('tunnel-return-btn');
            if (returnBtn) returnBtn.classList.remove('hidden');
        }
    }

    // Update Toreinbotto rig inside the tunnel
    _tunnelWheelCycle += dt * Math.abs(_tunnelSpeed) * 0.55;
    const rig = botRigs?.['TOREINBOTTO'];
    if (rig) {
        rig.root.position.set(0, 0.22, _tunnelZ);
        rig.root.rotation.set(0, 0, 0);
        rig.chassis.rotation.set(0, 0, 0);
        applyBotRigMorph(rig, 1.0, 0, _tunnelWheelCycle, _tunnelSpeed, 0, now, 0, 0, 0, 0);
    }

    // Train chug audio
    _tunnelChugTimer -= dt;
    if (_tunnelChugTimer <= 0 && Math.abs(_tunnelSpeed) > 6) {
        _tunnelChugTimer = Math.max(0.16, 0.34 - Math.abs(_tunnelSpeed) * 0.0025);
        sfx.playTrainChug();
    }

    // Interactive Shinkansen Turbo Rings
    for (let i = 0; i < _rings.length; i++) {
        const r = _rings[i];
        if (r.collected) continue;
        r.mesh.rotation.z = now * 0.002 + i * 0.4;
        if (Math.abs(_tunnelZ - r.z) < 6.5) {
            r.collected = true;
            r.mesh.visible = false;
            _tunnelBoostTimer = Math.max(_tunnelBoostTimer, 2.0);
            if (_tunnelSpeed >= 0) _tunnelSpeed = Math.max(_tunnelSpeed, 72);
            sfx.playStuntChime();
            spawnBurstParticles(0, 3.2, r.z, 0xfacc15, 16, 1.8);
        }
    }

    // Animate Undersea Creatures outside the Glass Tube
    for (let i = 0; i < _seaCreatures.length; i++) {
        const c = _seaCreatures[i];
        const t = now * 0.001 * c.speed + c.phase;
        c.group.position.set(
            c.baseX + Math.sin(t) * c.ampX,
            c.baseY + Math.cos(t * 0.8) * 1.6,
            c.baseZ + Math.cos(t * 0.35) * 18
        );
        c.group.rotation.y = Math.atan2(Math.cos(t) * c.ampX, -Math.sin(t * 0.35) * 18);
    }

    // Animate Cheering Terminal Citizens & Turnaround Pad
    for (let i = 0; i < _citizens.length; i++) {
        const ct = _citizens[i];
        const wave = Math.sin(now * 0.008 + ct.phase);
        ct.rig.root.position.y = ct.baseY + Math.abs(Math.sin(now * 0.006 + ct.phase)) * 0.55;
        ct.rig.leftArmPivot.rotation.x = -Math.PI * 0.78 + wave * 0.35;
        ct.rig.rightArmPivot.rotation.x = -Math.PI * 0.78 - wave * 0.35;
    }
    if (_terminalPadRing) {
        const s = 1.0 + Math.sin(now * 0.005) * 0.08;
        _terminalPadRing.scale.setScalar(s);
    }

    // Smooth Chase Camera inside the tunnel
    const camZ = _tunnelZ - 17.5;
    const camY = 6.2;
    camera.position.lerp(new THREE.Vector3(0, camY, camZ), Math.min(1, dt * 8));
    camera.lookAt(0, 2.8, _tunnelZ + 18);

    // Update Rail Tunnel HUD
    const pct = Math.max(0, Math.min(100, (_tunnelZ / TERMINAL_Z) * 100));
    const fillEl = document.getElementById('tunnel-progress-fill');
    if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
    const speedEl = document.getElementById('tunnel-speed-readout');
    if (speedEl) speedEl.textContent = `${Math.round(Math.abs(_tunnelSpeed) * 2.2)} KM/H`;
    const zoneEl = document.getElementById('tunnel-zone-label');
    if (zoneEl) {
        if (_tunnelZ < 550) zoneEl.textContent = 'GRIFFIN ROCK MOUNTAIN BORE';
        else if (_tunnelZ < 1250) zoneEl.textContent = 'SUB-OCEANIC GLASS VIEWING TUBE';
        else if (_tunnelZ < 1680) zoneEl.textContent = 'MAINLAND EXPRESS APPROACH';
        else zoneEl.textContent = 'MAINLAND EXPRESS TERMINAL';
    }
}

if (typeof window !== 'undefined') {
    window.enterRailTunnel = enterRailTunnel;
    window.exitRailTunnel = exitRailTunnel;
}

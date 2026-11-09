// Griffin Rock Island Dynamic Weather & Environmental Systems
import * as THREE from 'three';
import { scene, hemiLight, sunLight } from '../rendering/scene.js';
import { SVG_ICONS } from '../ui/icons.js';
import { progression, saveProgression } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { player } from '../state/gameState.js';
import { showToast } from '../ui/dialogs.js';
import { speakBotCatchphrase } from '../physics/player.js';
import { matStreetlampBulb } from './props.js';
import { initWeatherHazards, updateWeatherHazards } from './weatherHazards.js';

export let rainSystem: any = null;
export let volcanoEmberSystem: any = null;
export let starField: any = null;
export let auroraMesh: THREE.Mesh | null = null;
export let currentWeatherIdx = 0;
export let lightningFlashTimer = 0;

// Dynamic Day/Night Cycle State
export let timeOfDay = 9.5; // 09:30 AM (Morning daylight)
export let isAutoCycle = true;
export const TIME_SPEED = 24.0 / 480.0; // 480 real seconds (8 min) per 24 game hours
export let targetHeadlightIntensity = 0.0;
let lastFoghornTime = 0;
let lastAutoWeatherChangeTime = 0;

// 1. Procedural Rain Particle System
export function createRainSystem() {
    const rainCount = 240;
    const rainGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 4);
    const rainMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.68 });
    const rainGroup = new THREE.Group();
    const rainDrops: Array<{ mesh: THREE.Mesh; speed: number }> = [];

    for (let i = 0; i < rainCount; i++) {
        const drop = new THREE.Mesh(rainGeo, rainMat);
        drop.userData.noOutline = true;
        drop.position.set(
            (Math.random() - 0.5) * 115,
            Math.random() * 50,
            (Math.random() - 0.5) * 115
        );
        const speed = 40 + Math.random() * 24;
        drop.userData.fallSpeed = speed;
        rainDrops.push({ mesh: drop, speed });
        rainGroup.add(drop);
    }

    rainGroup.visible = false;
    return { group: rainGroup, drops: rainDrops };
}

// 2. Volcano Ash & Molten Ember Particle System
export function createVolcanoEmberSystem() {
    const emberCount = 150;
    const emberGeo = new THREE.DodecahedronGeometry(0.42, 0);
    const emberMats = [
        new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
        new THREE.MeshBasicMaterial({ color: 0xff9500 }),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    ];
    const emberGroup = new THREE.Group();
    const embers: Array<{ mesh: THREE.Mesh; vy: number; driftFreq: number; driftAmp: number; phase: number }> = [];

    for (let i = 0; i < emberCount; i++) {
        const mesh = new THREE.Mesh(emberGeo, emberMats[i % emberMats.length]);
        mesh.userData.noOutline = true;
        mesh.position.set(
            -735 + (Math.random() - 0.5) * 260,
            12 + Math.random() * 55,
            -755 + (Math.random() - 0.5) * 260
        );
        const vy = 4 + Math.random() * 8;
        embers.push({
            mesh,
            vy,
            driftFreq: 1 + Math.random(),
            driftAmp: 2 + Math.random() * 3,
            phase: Math.random() * Math.PI * 2
        });
        emberGroup.add(mesh);
    }

    emberGroup.visible = false;
    return { group: emberGroup, embers };
}

// 3. Starry Night Ops Constellations & Glowing Cartoon Moon
export function createStarField() {
    const starGroup = new THREE.Group();
    const starCount = 420;
    const starGeo = new THREE.OctahedronGeometry(2.4, 0);
    const starColors = [0xffffff, 0xfef08a, 0xbae6fd, 0xfbcfe8, 0x67e8f9];
    const starMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = 0.12 + Math.random() * 1.33;
        const dist = 1100 + Math.random() * 450;

        const x = dist * Math.cos(theta) * Math.cos(phi);
        const y = dist * Math.sin(phi);
        const z = dist * Math.sin(theta) * Math.cos(phi);

        const c = starColors[i % starColors.length];
        const mat = new THREE.MeshBasicMaterial({
            color: c,
            transparent: true,
            opacity: 0.85
        });
        const star = new THREE.Mesh(starGeo, mat);
        star.position.set(x, y, z);
        star.userData.noOutline = true;
        star.userData.twinkleSpeed = 1.2 + Math.random() * 3.5;
        star.userData.phase = Math.random() * Math.PI * 2;
        star.userData.baseScale = 1.0;
        starGroup.add(star);
        starMeshes.push(star);
    }

    // Glowing Cartoon Moon
    const moonGroup = new THREE.Group();
    moonGroup.position.set(420, 520, -780);
    const moonGeo = new THREE.SphereGeometry(32, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.userData.noOutline = true;
    moonGroup.add(moonMesh);

    const haloGeo = new THREE.RingGeometry(34, 48, 24);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
    });
    const moonHalo = new THREE.Mesh(haloGeo, haloMat);
    moonHalo.lookAt(0, 0, 0);
    moonHalo.userData.noOutline = true;
    moonGroup.add(moonHalo);

    starGroup.add(moonGroup);
    starGroup.visible = false;
    return { group: starGroup, stars: starMeshes, haloMesh: moonHalo, moonGroup };
}

// 4. Starry Night Ops Auroral Ribbon
export function createAuroraMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 512, 0);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        grad.addColorStop(0.2, 'rgba(34, 197, 94, 0.72)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.85)');
        grad.addColorStop(0.8, 'rgba(168, 85, 247, 0.72)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 128);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;

    const auroraGeo = new THREE.CylinderGeometry(950, 950, 160, 32, 1, true, -Math.PI * 0.75, Math.PI * 0.5);
    const auroraMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false
    });
    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.position.set(0, 260, -950);
    aurora.userData.noOutline = true;
    aurora.visible = false;
    return aurora;
}

// Weather Modes Definition
export const WEATHER_MODES = [
    {
        id: 'SUNNY',
        name: 'Sunny Day',
        skyColor: 0x5ec5ff,
        fogColor: 0x5ec5ff,
        fogDensity: 0.00042,
        sunColor: 0xfff7e6,
        sunIntensity: 1.25,
        hemiIntensity: 0.82,
        headlightIntensity: 0.0,
        banner: "SUNNY DAY!",
        desc: "Bright blue skies & warm sunshine across Griffin Rock!"
    },
    {
        id: 'SUNSET',
        name: 'Golden Sunset',
        skyColor: 0xfce7b3,
        fogColor: 0xfce7b3,
        fogDensity: 0.00042,
        sunColor: 0xfffbeb,
        sunIntensity: 1.18,
        hemiIntensity: 0.74,
        headlightIntensity: 2.0,
        banner: "GOLDEN SUNSET!",
        desc: "Warm gentle golden sunshine & dusk approaching across Griffin Rock!"
    },
    {
        id: 'RAIN',
        name: 'Summer Rainstorm',
        skyColor: 0x334155,
        fogColor: 0x334155,
        fogDensity: 0.00055,
        sunColor: 0x94a3b8,
        sunIntensity: 0.55,
        hemiIntensity: 0.48,
        headlightIntensity: 2.8,
        banner: "SUMMER RAINSTORM!",
        desc: "Thunder rumbling, slick wet roads & surging ocean waves!"
    },
    {
        id: 'FOG',
        name: 'Coastal Sea Fog',
        skyColor: 0x64748b,
        fogColor: 0x94a3b8,
        fogDensity: 0.0028,
        sunColor: 0xcfd8dc,
        sunIntensity: 0.45,
        hemiIntensity: 0.42,
        headlightIntensity: 3.2,
        banner: "COASTAL SEA FOG!",
        desc: "Dense maritime mist rolls in! Distant foghorns sound across the harbor."
    },
    {
        id: 'VOLCANO',
        name: 'Volcano Ash Glow',
        skyColor: 0x431407,
        fogColor: 0x7c2d12,
        fogDensity: 0.00062,
        sunColor: 0xf97316,
        sunIntensity: 0.88,
        hemiIntensity: 0.52,
        headlightIntensity: 2.8,
        banner: "VOLCANO ASH GLOW!",
        desc: "Fiery twilight & floating molten magma debris from the caldera!"
    },
    {
        id: 'NIGHT',
        name: 'Starry Night Ops',
        skyColor: 0x0b132b,
        fogColor: 0x0b132b,
        fogDensity: 0.00042,
        sunColor: 0x93c5fd,
        sunIntensity: 0.35,
        hemiIntensity: 0.38,
        headlightIntensity: 3.5,
        banner: "STARRY NIGHT OPS!",
        desc: "Twinkling cartoon stars, auroras & blazing rescue headlights!"
    }
];

export function getFormattedTime(hours: number): string {
    const norm = ((hours % 24) + 24) % 24;
    const h = Math.floor(norm);
    const m = Math.floor((norm - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const padM = m < 10 ? '0' + m : `${m}`;
    const padH = displayH < 10 ? '0' + displayH : `${displayH}`;
    return `${padH}:${padM} ${period}`;
}

export function getTimePhase(hours: number): string {
    const norm = ((hours % 24) + 24) % 24;
    if (norm >= 5.0 && norm < 7.0) return 'DAWN';
    if (norm >= 7.0 && norm < 17.0) return 'DAY';
    if (norm >= 17.0 && norm < 19.5) return 'DUSK';
    return 'NIGHT';
}

export function applyWeatherMode(idx: number, announce = true) {
    currentWeatherIdx = ((idx % WEATHER_MODES.length) + WEATHER_MODES.length) % WEATHER_MODES.length;
    const w = WEATHER_MODES[currentWeatherIdx];

    // Set matching time of day for the chosen weather mode if manually activated
    if (w.id === 'SUNNY') timeOfDay = 12.0;
    else if (w.id === 'SUNSET') timeOfDay = 18.2;
    else if (w.id === 'NIGHT') timeOfDay = 22.0;
    else if (w.id === 'RAIN') timeOfDay = 14.5;
    else if (w.id === 'FOG') timeOfDay = 6.5;
    else if (w.id === 'VOLCANO') timeOfDay = 19.0;

    if (typeof window !== 'undefined') {
        (window as any).currentWeatherIdx = currentWeatherIdx;
        (window as any).timeOfDay = timeOfDay;
    }

    applyVisualWeatherState(w);

    progression.weatherMode = w.id;
    saveProgression();

    if (announce) {
        showToast(w.banner, w.desc);
        if (w.id === 'RAIN') sfx.playThunderRumble();
        else if (w.id === 'VOLCANO') sfx.playVolcanoRumble();
        else if (w.id === 'FOG') sfx.playFoghorn();
        else if (w.id === 'SUNNY') sfx.playStuntChime();
        speakBotCatchphrase(player.botType, 'WEATHER_' + w.id);
    }
}

export function toggleAutoCycle(announce = true) {
    isAutoCycle = !isAutoCycle;
    if (announce) {
        const title = isAutoCycle ? "AUTO DAY/NIGHT & WEATHER ON" : "MANUAL WEATHER LOCK";
        const desc = isAutoCycle
            ? "Dynamic 24-hour sun cycle & rolling Griffin Rock weather active!"
            : "Weather locked to current mode. Press T or click to cycle.";
        showToast(title, desc);
        sfx.playDiscoveryChime();
    }
    updateHUDTimeWidget();
}

export function cycleWeatherMode(targetId: string | null = null, announce = true) {
    if (targetId) {
        const found = WEATHER_MODES.findIndex(m => m.id === targetId);
        if (found !== -1) {
            applyWeatherMode(found, announce);
            return;
        }
    }
    applyWeatherMode(currentWeatherIdx + 1, announce);
}

function applyVisualWeatherState(w: typeof WEATHER_MODES[0]) {
    if (scene) {
        if (scene.background) (scene.background as THREE.Color).setHex(w.skyColor);
        if (scene.fog) {
            (scene.fog as THREE.FogExp2).color.setHex(w.fogColor);
            (scene.fog as THREE.FogExp2).density = w.fogDensity;
        }
    }
    if (hemiLight) hemiLight.intensity = w.hemiIntensity;
    if (sunLight) {
        sunLight.intensity = w.sunIntensity;
        sunLight.color.setHex(w.sunColor);
    }

    if (rainSystem && rainSystem.group) rainSystem.group.visible = (w.id === 'RAIN');
    if (volcanoEmberSystem && volcanoEmberSystem.group) volcanoEmberSystem.group.visible = (w.id === 'VOLCANO');
    if (auroraMesh) auroraMesh.visible = (w.id === 'NIGHT');
    if (starField && starField.group) starField.group.visible = (w.id === 'NIGHT');

    targetHeadlightIntensity = w.headlightIntensity;
    (window as any).targetHeadlightIntensity = targetHeadlightIntensity;
    (window as any).currentWeatherId = w.id;

    // Streetlamps & Civilian Headlights
    const isDark = targetHeadlightIntensity > 0 || timeOfDay >= 18.0 || timeOfDay < 6.0;
    if (matStreetlampBulb) {
        matStreetlampBulb.color.setHex(isDark ? 0xfef08a : 0x94a3b8);
    }
    if (typeof (window as any).setCivilianVehicleHeadlights === 'function') {
        (window as any).setCivilianVehicleHeadlights(isDark);
    }

    updateHUDTimeWidget();
}

export function updateHUDTimeWidget() {
    const w = WEATHER_MODES[currentWeatherIdx];
    const timeIcon = document.getElementById('time-icon');
    const timeLabel = document.getElementById('time-label');

    const formattedTime = getFormattedTime(timeOfDay);
    const autoBadge = isAutoCycle ? "" : " (LOCKED)";

    if (timeIcon) {
        const iconKey = 'WEATHER_' + w.id;
        if (SVG_ICONS[iconKey]) {
            timeIcon.innerHTML = SVG_ICONS[iconKey];
        }
    }
    if (timeLabel) {
        timeLabel.textContent = `${formattedTime} • ${w.name}${autoBadge}`;
    }
}

// Per-frame environmental animation loop
export function updateWeather(dt: number, now: number, playerRef: any) {
    const currentMode = WEATHER_MODES[currentWeatherIdx] || WEATHER_MODES[0];
    (window as any).currentWeatherId = currentMode.id;

    // 1. Advance Time of Day when in Auto-Cycle
    if (isAutoCycle) {
        timeOfDay = (timeOfDay + dt * TIME_SPEED) % 24.0;

        // Check for periodic natural weather shifts (every ~130 seconds)
        if (now - lastAutoWeatherChangeTime > 130000) {
            lastAutoWeatherChangeTime = now;
            const phase = getTimePhase(timeOfDay);
            if (phase === 'NIGHT' && currentMode.id !== 'NIGHT') {
                applyWeatherMode(WEATHER_MODES.findIndex(m => m.id === 'NIGHT'), true);
            } else if (phase === 'DUSK' && currentMode.id !== 'SUNSET') {
                applyWeatherMode(WEATHER_MODES.findIndex(m => m.id === 'SUNSET'), true);
            } else if (phase === 'DAY') {
                // Daytime weather roll: 70% Sunny, 18% Rain, 12% Fog
                const roll = Math.random();
                const nextId = roll < 0.70 ? 'SUNNY' : (roll < 0.88 ? 'RAIN' : 'FOG');
                if (currentMode.id !== nextId) {
                    applyWeatherMode(WEATHER_MODES.findIndex(m => m.id === nextId), true);
                }
            }
        }
    }

    // 2. Diurnal Sun & Moon Orbital Position
    const sunAngle = ((timeOfDay - 6.0) / 24.0) * Math.PI * 2;
    const sunDist = 300;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.max(25, Math.sin(sunAngle) * 340);
    const sunZ = 130 + Math.sin(sunAngle) * 70;

    const snapX = Math.round(playerRef.pos.x / 2) * 2;
    const snapZ = Math.round(playerRef.pos.z / 2) * 2;
    sunLight.position.set(snapX + sunX, playerRef.pos.y + sunY, snapZ + sunZ);
    sunLight.target.position.set(snapX, playerRef.pos.y, snapZ);
    sunLight.target.updateMatrixWorld();

    // 3. Smooth Day/Night Lighting and Fog Blending
    const phase = getTimePhase(timeOfDay);
    const isNightOrDusk = (phase === 'NIGHT' || phase === 'DUSK' || currentMode.headlightIntensity > 0);
    targetHeadlightIntensity = isNightOrDusk ? Math.max(2.4, currentMode.headlightIntensity) : currentMode.headlightIntensity;
    (window as any).targetHeadlightIntensity = targetHeadlightIntensity;

    if (matStreetlampBulb) {
        matStreetlampBulb.color.setHex(isNightOrDusk ? 0xfef08a : 0x94a3b8);
    }
    if (typeof (window as any).setCivilianVehicleHeadlights === 'function') {
        (window as any).setCivilianVehicleHeadlights(isNightOrDusk);
    }

    // 4. Foghorn in Coastal Sea Fog
    if (currentMode.id === 'FOG' && now - lastFoghornTime > 26000) {
        lastFoghornTime = now;
        sfx.playFoghorn();
    }

    // 5. Update Active Weather Hazards
    updateWeatherHazards(dt, now, currentMode.id);

    // 6. Update HUD clock every frame
    updateHUDTimeWidget();
}

export const OUTPOST_PADS = [
    { name: "Rescue Bots HQ", x: 0, z: -10, r: 14.0, isHQ: true }
];

export function initWeather(sceneNode: THREE.Scene) {
    const s = sceneNode || scene;
    if (!s) return;

    if (!rainSystem) rainSystem = createRainSystem();
    if (!volcanoEmberSystem) volcanoEmberSystem = createVolcanoEmberSystem();
    if (!starField) starField = createStarField();
    if (!auroraMesh) auroraMesh = createAuroraMesh();

    s.add(rainSystem.group);
    s.add(volcanoEmberSystem.group);
    s.add(starField.group);
    s.add(auroraMesh);

    initWeatherHazards(s);

    if (typeof window !== 'undefined') {
        window.rainSystem = rainSystem;
        window.volcanoEmberSystem = volcanoEmberSystem;
        window.starFieldGroup = starField.group;
        window.auroraMesh = auroraMesh;
        window.WEATHER_MODES = WEATHER_MODES;
        window.currentWeatherIdx = currentWeatherIdx;
        window.cycleWeatherMode = cycleWeatherMode;
        window.applyWeatherMode = applyWeatherMode;
        window.toggleAutoCycle = toggleAutoCycle;
        window.timeOfDay = timeOfDay;
    }
}

if (typeof window !== 'undefined') {
    window.WEATHER_MODES = WEATHER_MODES;
    window.currentWeatherIdx = currentWeatherIdx;
    window.cycleWeatherMode = cycleWeatherMode;
    window.applyWeatherMode = applyWeatherMode;
    window.toggleAutoCycle = toggleAutoCycle;
}

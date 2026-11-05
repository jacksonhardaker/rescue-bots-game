// Griffin Rock Island Dynamic Weather & Environmental Systems
import * as THREE from 'three';
import { scene, hemiLight, sunLight } from '../rendering/scene.js';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';
import { SVG_ICONS } from '../ui/icons.js';
import { progression, saveProgression } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { player } from '../state/gameState.js';
import { showToast } from '../ui/dialogs.js';
import { speakBotCatchphrase } from '../physics/player.js';

export let rainSystem = null;
export let volcanoEmberSystem = null;
export let starField = null;
export let auroraMesh = null;
export let currentWeatherIdx = 0;
export let lightningFlashTimer = 0;

// 1. Procedural Rain Particle System
export function createRainSystem() {
    const rainCount = 220;
    const rainGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 4);
    const rainMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.68 });
    const rainGroup = new THREE.Group();
    const rainDrops = [];

    for (let i = 0; i < rainCount; i++) {
        const drop = new THREE.Mesh(rainGeo, rainMat);
        drop.userData.noOutline = true;
        drop.position.set(
            (Math.random() - 0.5) * 110,
            Math.random() * 45,
            (Math.random() - 0.5) * 110
        );
        drop.userData.fallSpeed = 38 + Math.random() * 22;
        rainDrops.push(drop);
        rainGroup.add(drop);
    }

    rainGroup.visible = false;
    return { group: rainGroup, drops: rainDrops };
}

// 2. Volcano Ash & Molten Ember Particle System
export function createVolcanoEmberSystem() {
    const emberCount = 140;
    const emberGeo = new THREE.DodecahedronGeometry(0.42, 0);
    const emberMats = [
        new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
        new THREE.MeshBasicMaterial({ color: 0xff9500 }),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    ];
    const emberGroup = new THREE.Group();
    const embers = [];

    for (let i = 0; i < emberCount; i++) {
        const mesh = new THREE.Mesh(emberGeo, emberMats[i % emberMats.length]);
        mesh.userData.noOutline = true;
        mesh.position.set(
            -735 + (Math.random() - 0.5) * 260,
            12 + Math.random() * 55,
            -755 + (Math.random() - 0.5) * 260
        );
        mesh.userData.vx = (Math.random() - 0.5) * 6;
        mesh.userData.vy = 4 + Math.random() * 8;
        mesh.userData.vz = (Math.random() - 0.5) * 6;
        mesh.userData.baseY = mesh.position.y;
        embers.push(mesh);
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
    const starMeshes = [];

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
    return { group: starGroup, stars: starMeshes };
}

// 4. Starry Night Ops Auroral Ribbon
export function createAuroraMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
    grad.addColorStop(0.2, 'rgba(34, 197, 94, 0.72)');
    grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.85)');
    grad.addColorStop(0.8, 'rgba(168, 85, 247, 0.72)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 128);

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
        icon: '☀️',
        skyColor: 0x5ec5ff,
        fogColor: 0x5ec5ff,
        sunColor: 0xfff7e6,
        sunIntensity: 1.25,
        hemiIntensity: 0.82,
        headlightIntensity: 0,
        banner: "☀️ SUNNY DAY!",
        desc: "Bright blue skies & warm sunshine across Griffin Rock!"
    },
    {
        id: 'RAIN',
        name: 'Summer Rainstorm',
        icon: '🌧️',
        skyColor: 0x334155,
        fogColor: 0x334155,
        sunColor: 0x94a3b8,
        sunIntensity: 0.58,
        hemiIntensity: 0.48,
        headlightIntensity: 2.2,
        banner: "🌧️ SUMMER RAINSTORM!",
        desc: "Pitter-patter rain, wipers active & distant thunder!"
    },
    {
        id: 'VOLCANO',
        name: 'Volcano Ash Glow',
        icon: '🌋',
        skyColor: 0x431407,
        fogColor: 0x7c2d12,
        sunColor: 0xf97316,
        sunIntensity: 0.88,
        hemiIntensity: 0.52,
        headlightIntensity: 2.8,
        banner: "🌋 VOLCANO ASH GLOW!",
        desc: "Fiery twilight & floating molten embers from the caldera!"
    },
    {
        id: 'NIGHT',
        name: 'Starry Night Ops',
        icon: '🌙',
        skyColor: 0x0b132b,
        fogColor: 0x0b132b,
        sunColor: 0x93c5fd,
        sunIntensity: 0.35,
        hemiIntensity: 0.38,
        headlightIntensity: 3.5,
        banner: "🌙 STARRY NIGHT OPS!",
        desc: "Twinkling cartoon stars, auroras & blazing rescue headlights!"
    }
];

export function applyWeatherMode(idx, announce = true) {
    currentWeatherIdx = ((idx % WEATHER_MODES.length) + WEATHER_MODES.length) % WEATHER_MODES.length;
    const w = WEATHER_MODES[currentWeatherIdx];

    if (scene) {
        if (scene.background) scene.background.setHex(w.skyColor);
        if (scene.fog) scene.fog.color.setHex(w.fogColor);
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

    const timeIcon = document.getElementById('time-icon');
    const timeLabel = document.getElementById('time-label');
    if (timeIcon && SVG_ICONS['WEATHER_' + w.id]) timeIcon.innerHTML = SVG_ICONS['WEATHER_' + w.id];
    if (timeLabel) timeLabel.textContent = w.name;

    progression.weatherMode = w.id;
    saveProgression();

    if (announce) {
        showToast(w.banner, w.desc);
        if (w.id === 'RAIN') sfx.playThunderRumble();
        else if (w.id === 'VOLCANO') sfx.playVolcanoRumble();
        else if (w.id === 'SUNNY') sfx.playStuntChime();
        speakBotCatchphrase(player.botType, 'WEATHER_' + w.id);
    }
}

export function cycleWeatherMode(targetId = null, announce = true) {
    if (targetId) {
        const found = WEATHER_MODES.findIndex(m => m.id === targetId);
        if (found !== -1) {
            applyWeatherMode(found, announce);
            return;
        }
    }
    applyWeatherMode(currentWeatherIdx + 1, announce);
}

export const OUTPOST_PADS = [
    { name: "Rescue Bots HQ", x: 0, z: -10, r: 14.0, isHQ: true }
];

export function initWeather(sceneNode) {
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

    if (typeof window !== 'undefined') {
        window.rainSystem = rainSystem;
        window.volcanoEmberSystem = volcanoEmberSystem;
        window.starFieldGroup = starField.group;
        window.auroraMesh = auroraMesh;
        window.WEATHER_MODES = WEATHER_MODES;
        window.currentWeatherIdx = currentWeatherIdx;
        window.cycleWeatherMode = cycleWeatherMode;
        window.applyWeatherMode = applyWeatherMode;
    }
}

if (typeof window !== 'undefined') {
    window.WEATHER_MODES = WEATHER_MODES;
    window.currentWeatherIdx = currentWeatherIdx;
    window.cycleWeatherMode = cycleWeatherMode;
    window.applyWeatherMode = applyWeatherMode;
}

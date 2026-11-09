// Weather Hazards & Environmental Crisis Mechanics for Griffin Rock
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { toonGrad3, toonGrad4, matInkOutline } from '../rendering/materials.js';
import { getTerrainHeight } from './terrain.js';
import { sfx } from '../audio/soundFX.js';
import { showToast } from '../ui/dialogs.js';
import { progression, saveProgression } from '../progression/progression.js';
import { player, buddyBot } from '../state/gameState.js';

export interface MagmaDebris {
    id: number;
    group: THREE.Group;
    mesh: THREE.Mesh;
    coreMesh: THREE.Mesh;
    x: number;
    y: number;
    z: number;
    radius: number;
    active: boolean;
    quenched: boolean;
    quenchTimer: number;
}

export let activeMagmaDebris: MagmaDebris[] = [];
export let lightningStrikeMesh: THREE.Line | null = null;
export let lightningStrikeTimer = 0;
export let nextLightningTime = 12.0;

// Shared Materials for Volcanic Debris
const matVolcanoRock = new THREE.MeshToonMaterial({ color: 0x1c1917, gradientMap: toonGrad3 });
const matVolcanoQuenched = new THREE.MeshToonMaterial({ color: 0x44403c, gradientMap: toonGrad3 });
const matMoltenCore = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
const matMoltenVeins = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

// Steam & Particle Pool
interface WeatherParticle {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    rotSpeed: number;
}

const activeSteamParticles: WeatherParticle[] = [];
const steamPuffGeo = new THREE.DodecahedronGeometry(0.75, 0);
const matSteam = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.72 });
const steamGroup = new THREE.Group();

// Mountain Highway Debris Spawn Anchors
const MAGMA_SPAWN_COORDS = [
    { x: -745, z: -695 },
    { x: -785, z: -625 },
    { x: -710, z: -650 },
    { x: -825, z: -535 },
    { x: -865, z: -430 },
    { x: -695, z: -785 },
    { x: -645, z: -725 },
    { x: -770, z: -740 }
];

export function initWeatherHazards(sceneNode: THREE.Scene) {
    const s = sceneNode || scene;
    if (!s) return;

    s.add(steamGroup);

    // Build initial volcanic hazard debris
    activeMagmaDebris.length = 0;
    MAGMA_SPAWN_COORDS.forEach((pos, idx) => {
        const h = getTerrainHeight(pos.x, pos.z);
        const debris = createMagmaDebrisNode(idx, pos.x, h, pos.z);
        activeMagmaDebris.push(debris);
        s.add(debris.group);
    });

    if (typeof window !== 'undefined') {
        (window as any).activeMagmaDebris = activeMagmaDebris;
    }
}

function createMagmaDebrisNode(id: number, x: number, y: number, z: number): MagmaDebris {
    const group = new THREE.Group();
    group.position.set(x, y + 0.8, z);

    // Main jagged basalt rock
    const rockGeo = new THREE.DodecahedronGeometry(1.85, 0);
    const rockMesh = new THREE.Mesh(rockGeo, matVolcanoRock);
    rockMesh.castShadow = true;
    group.add(rockMesh);

    // Glowing molten magma fissures inside the crevices
    const coreGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const coreMesh = new THREE.Mesh(coreGeo, matMoltenCore);
    coreMesh.userData.noOutline = true;
    group.add(coreMesh);

    // Ink outline for cartoon aesthetic
    const outline = new THREE.Mesh(rockGeo, matInkOutline);
    outline.scale.setScalar(1.08);
    group.add(outline);

    return {
        id,
        group,
        mesh: rockMesh,
        coreMesh,
        x,
        y,
        z,
        radius: 2.5,
        active: true,
        quenched: false,
        quenchTimer: 0
    };
}

export function spawnSteamBurst(x: number, y: number, z: number, count = 16) {
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(steamPuffGeo, matSteam);
        mesh.userData.noOutline = true;
        mesh.position.set(
            x + (Math.random() - 0.5) * 2.2,
            y + Math.random() * 1.5,
            z + (Math.random() - 0.5) * 2.2
        );
        const s = 0.6 + Math.random() * 0.8;
        mesh.scale.setScalar(s);
        steamGroup.add(mesh);

        activeSteamParticles.push({
            mesh,
            vx: (Math.random() - 0.5) * 2.5,
            vy: 2.8 + Math.random() * 3.5,
            vz: (Math.random() - 0.5) * 2.5,
            life: 0,
            maxLife: 0.8 + Math.random() * 0.6,
            rotSpeed: (Math.random() - 0.5) * 2.0
        });
    }
}

export function triggerLightningStrike(sceneNode: THREE.Scene, origin: { x: number; y: number; z: number }) {
    const s = sceneNode || scene;
    if (!s) return;

    // Pick strike point 45-85m away from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 45 + Math.random() * 40;
    const strikeX = origin.x + Math.cos(angle) * dist;
    const strikeZ = origin.z + Math.sin(angle) * dist;
    const strikeY = getTerrainHeight(strikeX, strikeZ);

    // Build jagged procedural lightning bolt
    const points: THREE.Vector3[] = [];
    const segments = 10;
    const topY = strikeY + 160;

    let currX = strikeX + (Math.random() - 0.5) * 25;
    let currZ = strikeZ + (Math.random() - 0.5) * 25;
    points.push(new THREE.Vector3(currX, topY, currZ));

    for (let i = 1; i < segments; i++) {
        const frac = i / segments;
        const targetY = topY - frac * 160;
        currX += (Math.random() - 0.5) * 16;
        currZ += (Math.random() - 0.5) * 16;
        points.push(new THREE.Vector3(currX, targetY, currZ));
    }
    points.push(new THREE.Vector3(strikeX, strikeY, strikeZ));

    if (lightningStrikeMesh) {
        s.remove(lightningStrikeMesh);
        lightningStrikeMesh.geometry.dispose();
    }

    const boltGeo = new THREE.BufferGeometry().setFromPoints(points);
    const boltMat = new THREE.LineBasicMaterial({ color: 0xe0f2fe, linewidth: 3 });
    lightningStrikeMesh = new THREE.Line(boltGeo, boltMat);
    lightningStrikeMesh.userData.noOutline = true;
    s.add(lightningStrikeMesh);
    lightningStrikeTimer = 0.14;

    sfx.playLightningStrike();
    spawnSteamBurst(strikeX, strikeY + 0.5, strikeZ, 8);
}

export function updateWeatherHazards(dt: number, now: number, activeWeatherId: string) {
    // 1. Animate Steam Particles
    for (let i = activeSteamParticles.length - 1; i >= 0; i--) {
        const p = activeSteamParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
            steamGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
            activeSteamParticles.splice(i, 1);
            continue;
        }
        const frac = p.life / p.maxLife;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.y += p.rotSpeed * dt;
        const scale = (1.0 + frac * 2.2);
        p.mesh.scale.setScalar(scale);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.72 * (1 - frac);
    }

    // 2. Animate Lightning Bolt Flash
    if (lightningStrikeTimer > 0) {
        lightningStrikeTimer -= dt;
        if (lightningStrikeTimer <= 0 && lightningStrikeMesh) {
            scene.remove(lightningStrikeMesh);
            lightningStrikeMesh.geometry.dispose();
            lightningStrikeMesh = null;
        }
    }

    // 3. Periodic Lightning in Rainstorms
    if (activeWeatherId === 'RAIN') {
        nextLightningTime -= dt;
        if (nextLightningTime <= 0) {
            nextLightningTime = 11.0 + Math.random() * 12.0;
            triggerLightningStrike(scene, player.pos);
        }
    }

    // 4. Volcanic Magma Debris Emissive Pulse & Interactions
    const isVolcanoActive = activeWeatherId === 'VOLCANO';
    for (let i = 0; i < activeMagmaDebris.length; i++) {
        const d = activeMagmaDebris[i];
        if (!d.active) continue;

        if (!d.quenched) {
            // Molten core glows & pulses
            const pulse = 0.85 + Math.sin(now * 0.006 + d.id * 1.5) * 0.25;
            d.coreMesh.scale.setScalar(pulse);
            if (isVolcanoActive && Math.random() < 0.04) {
                // Occasional tiny spark
                spawnSteamBurst(d.x, d.y + 1.2, d.z, 1);
            }
        }

        // Distance to Player Bot
        const dx = player.pos.x - d.x;
        const dz = player.pos.z - d.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);

        // A. Water Extinguish Check (Heatwave Water Cannon / High Tide Hydro Jet)
        const isWaterBot = (player.botType === 'HEATWAVE' || player.botType === 'HIGHTIDE');
        const isWaterActive = player.isActionActive || player.mode === 'BOAT';
        if (!d.quenched && distToPlayer < 18.0 && isWaterBot && isWaterActive) {
            quenchMagmaDebris(d, 'WATER');
        }

        // B. Dozer Scoop / Ram Smash Check (Boulder or Megabot)
        const isBoulderScooping = (player.botType === 'BOULDER' && (player.scoopTimer > 0 || player.smashTimer > 0));
        const isHeavyRam = Math.abs(player.speed) > 14.0 || player.isMega;
        if (distToPlayer < 4.8) {
            if (isBoulderScooping || isHeavyRam) {
                smashMagmaDebris(d, isBoulderScooping ? 'BOULDER' : 'RAM');
            } else if (!d.quenched && Math.abs(player.speed) > 4.0) {
                // Bump into hot molten rock -> slight slowdown and warning toast
                player.speed *= -0.35;
                sfx.playConeKnock();
                showToast("🔥 MOLTEN ROCK HAZARD!", "Extinguish with Heatwave's Water Cannon or smash with Boulder!");
            }
        }
    }
}

export function quenchMagmaDebris(debris: MagmaDebris, method: string) {
    if (debris.quenched) return;
    debris.quenched = true;
    debris.mesh.material = matVolcanoQuenched;
    debris.coreMesh.visible = false;

    spawnSteamBurst(debris.x, debris.y + 0.8, debris.z, 24);
    sfx.playSteamHiss();

    progression.heroPoints = (progression.heroPoints || 0) + 5;
    saveProgression();

    showToast("🌋 MOLTEN ROCK EXTINGUISHED!", "+5 Hero Pts • Basalt Cooled & Highway Cleared!");
    sfx.playDiscoveryChime();
}

export function smashMagmaDebris(debris: MagmaDebris, method: string) {
    if (!debris.active) return;
    debris.active = false;
    debris.group.visible = false;

    spawnSteamBurst(debris.x, debris.y + 0.8, debris.z, 14);
    sfx.playRockBreak();

    progression.heroPoints = (progression.heroPoints || 0) + 5;
    saveProgression();

    const title = method === 'BOULDER' ? "🚜 BOULDER DOZER CLEARANCE!" : "💥 HEAVY IMPACT SMASH!";
    showToast(title, "+5 Hero Pts • Road Hazard Demolished!");
    sfx.playDiscoveryChime();
}

if (typeof window !== 'undefined') {
    (window as any).activeMagmaDebris = activeMagmaDebris;
    (window as any).quenchMagmaDebris = quenchMagmaDebris;
    (window as any).smashMagmaDebris = smashMagmaDebris;
    (window as any).triggerLightningStrike = triggerLightningStrike;
}

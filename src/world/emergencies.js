// 8 Island-Wide Emergencies, Hazard Beacons & Particle Bursts
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import { toonGrad3, toonGrad4, matDarkSteel, matChrome, matInkOutline } from '../rendering/materials.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { createHumanNPCMesh } from './npcs.js';
import { BOT_METADATA } from '../bots/botMeta.js';

export const activeParticles = [];
export const beacons = [];
export let activeHazardNodes = [];
export const emergentRescues = [];

        const EMERGENCY_SITES = [
            {
                id: 0, name: "Harbor Dock Rockslide", type: "ROCKSLIDE", x: 0, z: 1080,
                citizenName: "Dockworker Pete", citizenRole: "Stranded Dock Crew",
                helpCall: "Help! Rescue Bots! We're trapped by the rockslide at the Harbor Dock!",
                shirtColor: 0xf59e0b, hairColor: 0x451a03, voicePitch: 0.96
            },
            {
                id: 1, name: "Town East Blaze", type: "FIRE", x: 145, z: 25,
                citizenName: "Baker Jerry", citizenRole: "Trapped Shopkeeper",
                helpCall: "Help! Heatwave! The Town East Blaze is surrounding our bakery!",
                shirtColor: 0xec4899, hairColor: 0x78350f, voicePitch: 1.08
            },
            {
                id: 2, name: "Lighthouse Cliff Slide", type: "ROCKSLIDE", x: 1090, z: 55,
                citizenName: "Keeper Clara", citizenRole: "Stranded Watcher",
                helpCall: "Help! We're trapped by the boulder slide on Lighthouse Cliff!",
                shirtColor: 0x06b6d4, hairColor: 0xb45309, voicePitch: 1.16
            },
            {
                id: 3, name: "Volcano Ridge Inferno", type: "FIRE", x: -680, z: -700,
                citizenName: "Vulcanologist Marco", citizenRole: "Trapped Scientist",
                helpCall: "Help! We're cut off by the Volcano Ridge Inferno! Bring the Water Cannon!",
                shirtColor: 0xf97316, hairColor: 0x1e293b, voicePitch: 0.94
            },
            {
                id: 4, name: "Quarry Canyon Collapse", type: "ROCKSLIDE", x: -920, z: -480,
                citizenName: "Foreman Cole", citizenRole: "Pinned Quarry Crew",
                helpCall: "Help! We're trapped by the Quarry Canyon Collapse! Scoop these boulders clear!",
                shirtColor: 0xeab308, hairColor: 0x475569, voicePitch: 0.90
            },
            {
                id: 5, name: "Sky Array Dish Outage", type: "SKY_RESCUE", x: 780, z: -780,
                citizenName: "Engineer Chloe", citizenRole: "Stranded Tower Crew",
                helpCall: "Help! Blades! We're stranded at the Sky Array Dish! Lower your Rescue Winch!",
                shirtColor: 0x38bdf8, hairColor: 0x9a3412, voicePitch: 1.18
            },
            {
                id: 6, name: "North Observatory Fire", type: "FIRE", x: 65, z: -1060,
                citizenName: "Dr. Elena Vance", citizenRole: "Trapped Astronomer",
                helpCall: "Help! The North Observatory Fire has blocked our exit! Please extinguish the flames!",
                shirtColor: 0xa855f7, hairColor: 0x0f172a, voicePitch: 1.14
            },
            {
                id: 7, name: "West Tech Highway Pileup", type: "ROCKSLIDE", x: -1050, z: 25,
                citizenName: "Commuter Toby", citizenRole: "Stranded Driver",
                helpCall: "Help! Chase! We're pinned by the West Tech Highway Pileup! Deploy your Tow Winch!",
                shirtColor: 0x22c55e, hairColor: 0x78350f, voicePitch: 1.02
            }
        ];

        // beacons exported above
        // activeParticles exported above // Unified pool for Rock Debris, Water Cannon Stream & Fire Sparks
        let lastGlobalVoiceTime = -99;



const fireConeGeo = new THREE.ConeGeometry(0.85, 2.8, 8);
const matFireCore = new THREE.MeshBasicMaterial({ color: 0xff5400 });
const matFireTip = new THREE.MeshBasicMaterial({ color: 0xffd60a });
const boulderGeo = new THREE.DodecahedronGeometry(2.3, 0);
const rockGeo = new THREE.DodecahedronGeometry(1.6, 0);
const matBoulder = new THREE.MeshToonMaterial({ color: 0x78716c, gradientMap: toonGrad3 });
const matBeaconRed = new THREE.MeshBasicMaterial({ color: 0xff1e42 });
const matBeaconOrange = new THREE.MeshBasicMaterial({ color: 0xff6414 });
const matBeaconGreen = new THREE.MeshBasicMaterial({ color: 0x38b000 });

        export function spawnHazardNodesForSite(site, idx) {
            const siteNodes = [];
            for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 + (idx * 0.4);
                const dist = 4.5 + (i % 2) * 2.0;
                const nx = site.x + Math.cos(ang) * dist;
                const nz = site.z + Math.sin(ang) * dist;
                const ny = getTerrainHeight(nx, nz);

                let nodeMesh;
                const s = 0.9 + (i % 3) * 0.3;

                if (site.type === 'FIRE') {
                    nodeMesh = new THREE.Group();
                    const outerFlame = new THREE.Mesh(fireConeGeo, matFireCore);
                    outerFlame.position.y = 2.4;
                    nodeMesh.add(outerFlame);
                    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.0, 6), matFireTip);
                    innerFlame.position.y = 1.8;
                    nodeMesh.add(innerFlame);
                    const flameOutline = new THREE.Mesh(fireConeGeo, matInkOutline);
                    flameOutline.position.y = 2.4;
                    flameOutline.scale.setScalar(1.09);
                    nodeMesh.add(flameOutline);
                    nodeMesh.position.set(nx, ny, nz);
                    nodeMesh.scale.setScalar(s);
                } else {
                    nodeMesh = new THREE.Mesh(boulderGeo, matBoulder);
                    nodeMesh.scale.set(s * 1.2, s * 0.95, s);
                    nodeMesh.position.set(nx, ny + s * 1.1, nz);
                    nodeMesh.rotation.set(i, i * 1.3, 0);
                    nodeMesh.castShadow = true;
                    nodeMesh.receiveShadow = true;
                    applyCartoonInkOutlines(nodeMesh, 1.075, true);
                }
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(nodeMesh);

                siteNodes.push({
                    mesh: nodeMesh,
                    type: site.type,
                    x: nx,
                    y: ny,
                    z: nz,
                    r: s * 2.1,
                    cleared: false
                });
            }
            return siteNodes;
        }

        export function respawnSingleBeacon(beacon, announceToast = true) {
            if (!beacon) return;
            beacon.nodes.forEach(n => scene.remove(n.mesh));
            const site = EMERGENCY_SITES[beacon.id] || EMERGENCY_SITES[0];
            beacon.nodes = spawnHazardNodesForSite(site, beacon.id);
            beacon.restored = false;
            beacon.restoredAtTime = -1;
            beacon.orb.material = beacon.type === 'FIRE' ? matBeaconOrange : matBeaconRed;
            beacon.skyBeam.material.color.setHex(beacon.type === 'FIRE' ? 0xf97316 : 0xf43f5e);
            beacon.skyBeam.material.opacity = 0.28;
            if (beacon.strandedCitizens) {
                beacon.strandedCitizens.forEach(sc => {
                    sc.rig.radioGem.material.color.setHex(0xff1e42);
                });
            }
            updateMissionHUD();
            renderMinimap();
            if (announceToast) {
                sfx.playSirenPulse();
                showToast("NEW EMERGENCY DISPATCH!", `${beacon.name} Active Again!`);
            }
        }

        export function buildHazardSites(scene) {
            clearTimeout(window._endlessWaveTimeout);
            beacons.forEach(b => {
                scene.remove(b.group);
                b.nodes.forEach(n => scene.remove(n.mesh));
                if (b.strandedCitizens) {
                    b.strandedCitizens.forEach(sc => scene.remove(sc.rig.root));
                }
            });
            beacons.length = 0;

            // Initialize 8 HUD Pip indicators spanning full width
            const pipsContainer = document.getElementById('beacon-pips');
            pipsContainer.innerHTML = '';
            for (let i = 0; i < EMERGENCY_SITES.length; i++) {
                const site = EMERGENCY_SITES[i];
                const pip = document.createElement('div');
                const isFire = site.type === 'FIRE';
                pip.className = `mission-pip ${isFire ? 'mission-pip-fire' : 'mission-pip-hazard'}`;
                pipsContainer.appendChild(pip);
            }

            EMERGENCY_SITES.forEach((site, idx) => {
                const gy = getTerrainHeight(site.x, site.z);
                const group = new THREE.Group();
                group.position.set(site.x, gy, site.z);

                const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.1, 1.4, 8), matDarkSteel);
                base.position.y = 0.7;
                group.add(base);

                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 8), matChrome);
                pole.position.y = 5.0;
                group.add(pole);

                const orb = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 12, 12),
                    site.type === 'FIRE' ? matBeaconOrange : matBeaconRed
                );
                orb.position.y = 10.0;
                group.add(orb);

                const skyBeam = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.9, 0.9, 95, 8, 1, true),
                    new THREE.MeshBasicMaterial({
                        color: site.type === 'FIRE' ? 0xf97316 : 0xf43f5e,
                        transparent: true,
                        opacity: 0.28,
                        side: THREE.DoubleSide
                    })
                );
                skyBeam.position.y = 52;
                group.add(skyBeam);

                (scene || (typeof window !== "undefined" ? window.scene : null)).add(group);

                // Spawn 6 Interactive Hazard Nodes around the Beacon (Boulders or Roaring Flames)
                const siteNodes = spawnHazardNodesForSite(site, idx);

                // Spawn 2 Stranded Citizens at the Emergency Site waving & calling out for rescue!
                const strandedCitizens = [];
                for (let c = 0; c < 2; c++) {
                    const cAng = idx * 0.8 + c * Math.PI * 0.65 + 0.35;
                    const cx = site.x + Math.cos(cAng) * 9.2;
                    const cz = site.z + Math.sin(cAng) * 9.2;
                    const cy = Math.max(0.2, getTerrainHeight(cx, cz));
                    const cRig = createHumanNPCMesh({
                        shirtColor: c === 0 ? site.shirtColor : 0xfacc15,
                        pantsColor: 0x1e293b,
                        hairColor: site.hairColor,
                        hasVisorHat: c === 0,
                        indicatorColor: 0xff1e42
                    });
                    cRig.root.position.set(cx, cy, cz);
                    (scene || (typeof window !== "undefined" ? window.scene : null)).add(cRig.root);
                    strandedCitizens.push({
                        name: site.citizenName,
                        role: site.citizenRole,
                        helpCall: site.helpCall,
                        voicePitch: site.voicePitch,
                        x: cx,
                        y: cy,
                        z: cz,
                        lastCallTime: -99,
                        rig: cRig
                    });
                }

                beacons.push({
                    id: site.id,
                    name: site.name,
                    type: site.type,
                    x: site.x,
                    z: site.z,
                    group,
                    orb,
                    skyBeam,
                    nodes: siteNodes,
                    strandedCitizens,
                    restored: false,
                    restoredAtTime: -1
                });
            });

            updateMissionHUD();
        }

        export function spawnBurstParticles(x, y, z, colorHex = 0x78716c, count = 10, speedScale = 1) {
            for (let i = 0; i < count; i++) {
                const pGroup = new THREE.Group();
                const pGeo = new THREE.OctahedronGeometry(0.55 + Math.random() * 0.45, 0);
                const pMesh = new THREE.Mesh(
                    pGeo,
                    new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffd60a : colorHex })
                );
                const pOutline = new THREE.Mesh(pGeo, matInkOutline);
                pOutline.scale.setScalar(1.18);
                pGroup.add(pMesh);
                pGroup.add(pOutline);

                pGroup.position.set(x, y + 1.2, z);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(pGroup);
                const angle = Math.random() * Math.PI * 2;
                const spd = (5 + Math.random() * 12) * speedScale;
                activeParticles.push({
                    mesh: pGroup,
                    vx: Math.cos(angle) * spd,
                    vy: (7 + Math.random() * 11) * speedScale,
                    vz: Math.sin(angle) * spd,
                    gravity: 28,
                    life: 0.95
                });
            }
        }

        export function spawnSoapSudsParticles(x, y, z, count = 6) {
            const bubbleColors = [0xffffff, 0xbae6fd, 0xfbcfe8, 0xfef08a, 0xa5f3fc];
            for (let i = 0; i < count; i++) {
                const radius = 0.45 + Math.random() * 0.75;
                const bGeo = new THREE.SphereGeometry(radius, 8, 8);
                const bMesh = new THREE.Mesh(
                    bGeo,
                    new THREE.MeshBasicMaterial({
                        color: bubbleColors[i % bubbleColors.length],
                        transparent: true,
                        opacity: 0.85
                    })
                );
                bMesh.userData.noOutline = true;
                bMesh.position.set(
                    x + (Math.random() - 0.5) * 3.6,
                    y + Math.random() * 2.2,
                    z + (Math.random() - 0.5) * 3.6
                );
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(bMesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 2.0 + Math.random() * 4.5;
                activeParticles.push({
                    mesh: bMesh,
                    vx: Math.cos(ang) * spd,
                    vy: 2.2 + Math.random() * 3.8,
                    vz: Math.sin(ang) * spd,
                    gravity: -1.2,
                    life: 0.95 + Math.random() * 0.45
                });
            }
        }

        export function spawnSparkleGlints(x, y, z, count = 12) {
            for (let i = 0; i < count; i++) {
                const gGeo = new THREE.OctahedronGeometry(0.45 + Math.random() * 0.4, 0);
                const gMesh = new THREE.Mesh(
                    gGeo,
                    new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffffff : 0xfacc15, transparent: true, opacity: 0.95 })
                );
                gMesh.scale.set(0.65, 1.85, 0.65);
                gMesh.userData.noOutline = true;
                gMesh.position.set(
                    x + (Math.random() - 0.5) * 3.6,
                    y + 0.8 + Math.random() * 2.6,
                    z + (Math.random() - 0.5) * 3.6
                );
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(gMesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 3.5 + Math.random() * 6.5;
                activeParticles.push({
                    mesh: gMesh,
                    vx: Math.cos(ang) * spd,
                    vy: 3.5 + Math.random() * 5.5,
                    vz: Math.sin(ang) * spd,
                    gravity: 12.0,
                    life: 0.85 + Math.random() * 0.35
                });
            }
        }

        export function spawnRocketExhaustParticles(x, y, z, count = 28) {
            const fireColors = [0xff4500, 0xf97316, 0xfacc15, 0xffffff, 0x94a3b8];
            for (let i = 0; i < count; i++) {
                const pGeo = new THREE.OctahedronGeometry(0.5 + Math.random() * 0.7, 0);
                const pMesh = new THREE.Mesh(
                    pGeo,
                    new THREE.MeshBasicMaterial({ color: fireColors[i % fireColors.length] })
                );
                pMesh.position.set(x + (Math.random() - 0.5) * 3.5, y + 0.5, z + (Math.random() - 0.5) * 3.5);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(pMesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 6.0 + Math.random() * 12.0;
                activeParticles.push({
                    mesh: pMesh,
                    vx: Math.cos(ang) * spd,
                    vy: 4.0 + Math.random() * 10.0,
                    vz: Math.sin(ang) * spd - 8.0,
                    gravity: 14.0,
                    life: 1.1 + Math.random() * 0.4
                });
            }
        }

        export function spawnDinerFoodParticles(x, y, z, count = 16) {
            const foodColors = [0xd97706, 0x22c55e, 0xef4444, 0xfacc15, 0x78350f, 0x38bdf8];
            for (let i = 0; i < count; i++) {
                const geo = i % 2 === 0 ? new THREE.BoxGeometry(0.7, 0.35, 0.7) : new THREE.SphereGeometry(0.45, 6, 6);
                const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({ color: foodColors[i % foodColors.length] })
                );
                mesh.position.set(x + (Math.random() - 0.5) * 3.2, y + 0.6 + Math.random() * 1.5, z + (Math.random() - 0.5) * 3.2);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 2.0 + Math.random() * 4.0;
                activeParticles.push({
                    mesh,
                    vx: Math.cos(ang) * spd,
                    vy: 3.5 + Math.random() * 4.5,
                    vz: Math.sin(ang) * spd,
                    gravity: 3.0,
                    life: 1.2 + Math.random() * 0.4
                });
            }
        }

        export function spawnEnergonLightningParticles(x, y, z, count = 22) {
            const colors = [0x22d3ee, 0x06b6d4, 0xfacc15, 0xa855f7, 0xffffff];
            for (let i = 0; i < count; i++) {
                const geo = new THREE.OctahedronGeometry(0.5 + Math.random() * 0.5, 0);
                const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
                );
                mesh.scale.set(0.4, 2.2, 0.4);
                mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                mesh.position.set(x + (Math.random() - 0.5) * 5.0, y + 1.2 + Math.random() * 3.0, z + (Math.random() - 0.5) * 5.0);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 4.0 + Math.random() * 9.0;
                activeParticles.push({
                    mesh,
                    vx: Math.cos(ang) * spd,
                    vy: (Math.random() - 0.2) * 8.0,
                    vz: Math.sin(ang) * spd,
                    gravity: 4.0,
                    life: 0.75 + Math.random() * 0.35
                });
            }
        }

        export function spawnWarpVortexParticles(x, y, z, count = 26) {
            const portalColors = [0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899, 0xffffff];
            for (let i = 0; i < count; i++) {
                const geo = new THREE.SphereGeometry(0.45 + Math.random() * 0.4, 6, 6);
                const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({ color: portalColors[i % portalColors.length], transparent: true, opacity: 0.9 })
                );
                mesh.position.set(x + (Math.random() - 0.5) * 4.0, y + 1.5 + Math.random() * 3.5, z + (Math.random() - 0.5) * 4.0);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 3.0 + Math.random() * 7.0;
                activeParticles.push({
                    mesh,
                    vx: Math.cos(ang) * spd,
                    vy: (Math.random() - 0.5) * 6.0,
                    vz: Math.sin(ang) * spd,
                    gravity: -0.5,
                    life: 1.0 + Math.random() * 0.4
                });
            }
        }

        export function spawnWaterWakeParticles(x, y, z, count = 16) {
            const foamColors = [0xffffff, 0xe0f2fe, 0xbae6fd, 0x7dd3fc];
            for (let i = 0; i < count; i++) {
                const geo = new THREE.CylinderGeometry(0.6 + Math.random() * 0.8, 0.8 + Math.random() * 0.9, 0.2, 8);
                const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({ color: foamColors[i % foamColors.length], transparent: true, opacity: 0.85 })
                );
                mesh.position.set(x + (Math.random() - 0.5) * 4.5, -0.1, z + (Math.random() - 0.5) * 5.0);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 3.5;
                activeParticles.push({
                    mesh,
                    vx: Math.cos(ang) * spd,
                    vy: 0.4 + Math.random() * 0.8,
                    vz: Math.sin(ang) * spd - 3.5, // push outward behind ferry
                    gravity: 1.2,
                    life: 1.2 + Math.random() * 0.5
                });
            }
        }

        export function spawnMagnetSparkParticles(x, y, z, count = 18) {
            const sparkColors = [0x38bdf8, 0x0284c7, 0xfacc15, 0xffffff];
            for (let i = 0; i < count; i++) {
                const geo = new THREE.OctahedronGeometry(0.35 + Math.random() * 0.3, 0);
                const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({ color: sparkColors[i % sparkColors.length] })
                );
                mesh.position.set(x + (Math.random() - 0.5) * 4.0, y + (Math.random() - 0.5) * 2.0, z + (Math.random() - 0.5) * 4.0);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 3.5 + Math.random() * 6.0;
                activeParticles.push({
                    mesh,
                    vx: Math.cos(ang) * spd,
                    vy: (Math.random() - 0.5) * 5.0,
                    vz: Math.sin(ang) * spd,
                    gravity: 3.5,
                    life: 0.65 + Math.random() * 0.35
                });
            }
        }

        export function spawnPaintSplatParticles(x, y, z, colorHex = 0xf43f5e, count = 22) {
            for (let i = 0; i < count; i++) {
                const geo = i % 2 === 0 ? new THREE.SphereGeometry(0.45 + Math.random() * 0.45, 6, 6) : new THREE.DodecahedronGeometry(0.5, 0);
                const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({ color: colorHex })
                );
                mesh.position.set(x, y, z);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                const ang = Math.random() * Math.PI * 2;
                const spd = 4.0 + Math.random() * 9.0;
                activeParticles.push({
                    mesh,
                    vx: Math.cos(ang) * spd,
                    vy: 2.0 + Math.random() * 8.0,
                    vz: Math.sin(ang) * spd,
                    gravity: 16.0,
                    life: 1.1 + Math.random() * 0.4
                });
            }
        }

        // Aimed High-Pressure Ballistic Water Cannon Arc for Heatwave (Automatically targets nearest active Fire/Hazard!)
        export function spawnWaterCannonStream(sourceRig = botRigs.HEATWAVE, sourceOrigin = null, sourceHeading = player.heading) {
            const rig = sourceRig;
            const nozzleWorldPos = new THREE.Vector3();
            if (sourceOrigin) {
                nozzleWorldPos.copy(sourceOrigin);
            } else {
                const activeNozzle = player.mode === 'DINO' ? rig.dinoNozzleTip : rig.nozzleTip;
                activeNozzle.getWorldPosition(nozzleWorldPos);
            }

            // Find closest uncleared hazard node within 34m to aim the Water Cannon arc directly onto the flames!
            let targetNode = null;
            let bestDist = 34.0;
            beacons.forEach(beacon => {
                if (beacon.restored) return;
                beacon.nodes.forEach(n => {
                    if (n.cleared) return;
                    const d = Math.hypot(n.x - nozzleWorldPos.x, n.z - nozzleWorldPos.z);
                    if (d < bestDist) {
                        bestDist = d;
                        targetNode = n;
                    }
                });
            });

            let baseVx, baseVy, baseVz;
            const gravity = 24;

            if (targetNode) {
                const dx = targetNode.x - nozzleWorldPos.x;
                const dz = targetNode.z - nozzleWorldPos.z;
                const dy = (targetNode.y + 1.6) - nozzleWorldPos.y;
                const horizDist = Math.max(4.0, Math.hypot(dx, dz));
                const flightTime = THREE.MathUtils.clamp(horizDist / 38.0, 0.22, 0.78);

                baseVx = dx / flightTime;
                baseVz = dz / flightTime;
                // High ballistic arc that peaks in the middle and lands squarely on the target fire!
                baseVy = (dy + 0.5 * gravity * flightTime * flightTime) / flightTime;

                // Rotate Heatwave's roof ladder turret toward the targeted fire!
                const worldAimYaw = Math.atan2(dx, dz);
                rig.backAttachment.rotation.y = worldAimYaw - sourceHeading;
            } else {
                rig.backAttachment.rotation.y = 0;
                const jetSpeed = 42;
                baseVx = Math.sin(sourceHeading) * jetSpeed;
                baseVz = Math.cos(sourceHeading) * jetSpeed;
                baseVy = 9.5;
            }

            for (let i = 0; i < 3; i++) {
                const dropGroup = new THREE.Group();
                const dropGeo = new THREE.SphereGeometry(0.52 + Math.random() * 0.35, 8, 8);
                const drop = new THREE.Mesh(
                    dropGeo,
                    new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00b4d8 : 0xffffff })
                );
                const dropOutline = new THREE.Mesh(dropGeo, matInkOutline);
                dropOutline.scale.setScalar(1.16);
                dropGroup.add(drop);
                dropGroup.add(dropOutline);

                dropGroup.position.copy(nozzleWorldPos);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(dropGroup);

                activeParticles.push({
                    mesh: dropGroup,
                    vx: baseVx + (Math.random() - 0.5) * 3.8,
                    vy: baseVy + (Math.random() - 0.5) * 2.4,
                    vz: baseVz + (Math.random() - 0.5) * 3.8,
                    gravity,
                    isWater: true,
                    life: 0.88
                });
            }
        }


        export function updateMissionHUD() {
            const restoredCount = beacons.filter(b => b.restored).length;
            document.getElementById('mission-status-text').textContent = `Emergencies Resolved: ${restoredCount} / ${beacons.length}`;
            const pips = document.getElementById('beacon-pips').children;
            beacons.forEach((b, idx) => {
                if (!pips[idx]) return;
                if (b.restored) {
                    pips[idx].className = "mission-pip mission-pip-resolved";
                } else {
                    const isFire = b.type === 'FIRE';
                    pips[idx].className = `mission-pip ${isFire ? 'mission-pip-fire' : 'mission-pip-hazard'}`;
                }
            });

            if (restoredCount === beacons.length && beacons.length > 0) {
                if (progression.autoSpawnEmergencies) {
                    clearTimeout(window._endlessWaveTimeout);
                    window._endlessWaveTimeout = setTimeout(() => {
                        buildHazardSites();
                        sfx.playSirenPulse();
                        showToast("ENDLESS DISPATCH!", "8 New Island Emergencies Active!");
                        triggerNPCSpeech(
                            "Chief Charlie Burns",
                            "Police Chief",
                            "Rescue Bots! Chief Burns here! New emergencies just broke out across Griffin Rock! Roll to the rescue!",
                            0.88,
                            true
                        );
                    }, 5800);
                } else {
                    document.getElementById('victory-modal').classList.remove('hidden');
                }
            }
        }

        export function clearHazardNode(beacon, node) {
            if (node.cleared) return;
            node.cleared = true;
            sfx.playRockBreak();
            const burstColor = node.type === 'FIRE' ? 0x38bdf8 : 0x8c827a;
            spawnBurstParticles(node.x, node.y + 1.5, node.z, burstColor, 10);
            scene.remove(node.mesh);

            const remaining = beacon.nodes.filter(n => !n.cleared).length;
            if (remaining === 0 && !beacon.restored) {
                beacon.restored = true;
                beacon.restoredAtTime = performance.now() * 0.001;
                beacon.orb.material = matBeaconGreen;
                beacon.skyBeam.material.color.setHex(0x22c55e);
                beacon.skyBeam.material.opacity = 0.15;
                sfx.playBeaconRestore();
                spawnBurstParticles(beacon.x, beacon.group.position.y + 9, beacon.z, 0xa3e635, 18, 1.3);

                // Increment & Persist Lifetime Career Progression in localStorage!
                const rescuedHere = (beacon.strandedCitizens && beacon.strandedCitizens.length > 0) ? beacon.strandedCitizens.length : 2;
                progression.totalEmergenciesResolved += 1;
                progression.totalCitizensRescued += rescuedHere;
                saveProgression();

                // Pop out 3 Bonus Golden Energon Cubes around the resolved emergency site!
                spawnBonusEnergonCubes(beacon.x, beacon.z, 3);

                showToast("CITIZENS RESCUED!", `${beacon.name} Cleared by ${player.botType}!`);

                // Have the active Rescue Bot speak an iconic victory catchphrase & turn Stranded Citizens' gems green!
                speakBotCatchphrase(player.botType, 'RESCUE');
                if (beacon.strandedCitizens && beacon.strandedCitizens.length > 0) {
                    beacon.strandedCitizens.forEach(sc => {
                        sc.rig.radioGem.material.color.setHex(0x22c55e);
                    });
                    const speaker = beacon.strandedCitizens[0];
                    const botName = BOT_METADATA[player.botType] ? BOT_METADATA[player.botType].name : player.botType;
                    clearTimeout(window._citizenThankTimeout);
                    window._citizenThankTimeout = setTimeout(() => {
                        triggerNPCSpeech(
                            speaker.name,
                            "Rescued Citizen",
                            `Hooray! Thank you, ${botName}! You saved us at the ${beacon.name}!`,
                            speaker,
                            true
                        );
                    }, 3600);
                }
                updateMissionHUD();
            }
        }


        // emergentRescues exported above

        export function initEmergentRescues(scene) {
            // 1. Overheated Delivery Van on Mountain Pass shoulder
            const vanGrp = new THREE.Group();
            const matVanBody = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad3 });
            const matVanWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
            const vanBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 7.8), matVanBody);
            vanBody.position.y = 2.0;
            vanGrp.add(vanBody);
            const vanCab = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 3.2), matVanWhite);
            vanCab.position.set(0, 1.8, 3.5);
            vanGrp.add(vanCab);
            const vanY = getSurfaceHeight(180, 120);
            vanGrp.position.set(180, vanY, 120);
            vanGrp.rotation.y = 0.6;
            (scene || (typeof window !== "undefined" ? window.scene : null)).add(vanGrp);
            registerCullableObject(vanGrp, 180, vanY, 120, 26);

            emergentRescues.push({
                id: "emergent_van",
                name: "Overheated Mountain Van",
                x: 180, z: 120, y: vanY,
                radius: 18.0,
                type: "VAN",
                solved: false,
                grp: vanGrp
            });

            // 2. Causeway Rockslide
            const rockGrp = new THREE.Group();
            [-2.4, 0, 2.6].forEach((rx, idx) => {
                const rock = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(2.2 + idx * 0.4, 0),
                    matBoulder
                );
                rock.position.set(rx, 1.8, (idx - 1) * 1.5);
                rock.castShadow = true;
                applyCartoonInkOutlines(rock, 1.05, true);
                rockGrp.add(rock);
            });
            const rockY = getSurfaceHeight(640, 270);
            rockGrp.position.set(640, rockY, 270);
            (scene || (typeof window !== "undefined" ? window.scene : null)).add(rockGrp);
            registerCullableObject(rockGrp, 640, rockY, 270, 28);

            emergentRescues.push({
                id: "emergent_rocks",
                name: "Causeway Highway Rockslide",
                x: 640, z: 270, y: rockY,
                radius: 18.0,
                type: "ROCKS",
                solved: false,
                grp: rockGrp
            });

            // 3. Griffin Harbor Slipway Oil Slick
            const oilGrp = new THREE.Group();
            const slick = new THREE.Mesh(
                new THREE.CircleGeometry(6.5, 24).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
            );
            slick.position.y = 0.12;
            oilGrp.add(slick);
            const oilY = getSurfaceHeight(-370, 120);
            oilGrp.position.set(-370, oilY, 120);
            (scene || (typeof window !== "undefined" ? window.scene : null)).add(oilGrp);
            registerCullableObject(oilGrp, -370, oilY, 120, 22);

            emergentRescues.push({
                id: "emergent_oil",
                name: "Harbor Slipway Oil Slick",
                x: -370, z: 120, y: oilY,
                radius: 16.0,
                type: "OIL",
                solved: false,
                grp: oilGrp
            });

            // 4. Mount Griffin Cliff Hiker
            const hikerGrp = new THREE.Group();
            const hikerRig = createHumanNPCMesh({
                name: "Stranded Hiker",
                shirtColor: 0xf97316,
                pantsColor: 0x1e293b,
                hairColor: 0x78350f,
                indicatorColor: 0xff3b30
            });
            hikerGrp.add(hikerRig.root);
            const hikerY = getTerrainHeight(-250, 310) + 1.2;
            hikerGrp.position.set(-250, hikerY, 310);
            (scene || (typeof window !== "undefined" ? window.scene : null)).add(hikerGrp);
            registerCullableObject(hikerGrp, -250, hikerY, 310, 20);

            emergentRescues.push({
                id: "emergent_hiker",
                name: "Mount Griffin Stranded Hiker",
                x: -250, z: 310, y: hikerY,
                radius: 16.0,
                type: "HIKER",
                solved: false,
                grp: hikerGrp,
                rig: hikerRig
            });
        }

        let emergentCheckCooldown = 0;
        export function updateEmergentRescues(dt, now) {
            emergentCheckCooldown++;
            const nowSec = now * 0.001;

            for (let i = 0; i < emergentRescues.length; i++) {
                const ev = emergentRescues[i];
                if (ev.solved) continue;

                if (ev.type === 'VAN') {
                    if (emergentCheckCooldown % 20 === 0) {
                        spawnBurstParticles(ev.x, ev.y + 2.8, ev.z + 3.2, 0xffffff, 4, 0.4);
                    }
                } else if (ev.type === 'HIKER' && ev.rig) {
                    const waveAng = Math.sin(nowSec * 5.5) * 0.65;
                    if (ev.rig.leftArmPivot) ev.rig.leftArmPivot.rotation.z = 2.2 + waveAng;
                    if (ev.rig.rightArmPivot) ev.rig.rightArmPivot.rotation.z = -2.2 - waveAng;
                }

                const dist2D = Math.hypot(player.pos.x - ev.x, player.pos.z - ev.z);
                const isClose = dist2D <= ev.radius;

                if (isClose) {
                    const actionTriggered = player.activeActionDuration > 0 || Math.abs(player.speed) > 2.0;
                    if (actionTriggered) {
                        ev.solved = true;
                        progression.totalEmergenciesResolved++;
                        if (ev.type === 'HIKER') progression.totalCitizensRescued++;

                        sfx.playRankUp();
                        spawnBurstParticles(ev.x, ev.y + 2.5, ev.z, 0x22c55e, 26, 1.6);
                        spawnSoapSudsParticles(ev.x, ev.y + 1.5, ev.z, 14);

                        if (ev.type === 'VAN') {
                            showToast("VAN RESCUED!", "Radiator cooled & driver assisted safely! (+3 Hero Pts)");
                        } else if (ev.type === 'ROCKS') {
                            showToast("ROCKSLIDE CLEARED!", "Causeway highway reopened for island traffic! (+3 Hero Pts)");
                            scene.remove(ev.grp);
                        } else if (ev.type === 'OIL') {
                            showToast("OIL SLICK NEUTRALIZED!", "Griffin Harbor slipway made safe! (+3 Hero Pts)");
                            scene.remove(ev.grp);
                        } else if (ev.type === 'HIKER') {
                            showToast("HIKER AIRLIFTED!", "Mountain hiker safely brought down to trail! (+3 Hero Pts)");
                            spawnSparkleGlints(ev.x, ev.y + 1.5, ev.z, 18);
                        }

                        saveProgression();
                    }
                }
            }
        }


if (typeof window !== 'undefined') {
    window.EMERGENCY_SITES = EMERGENCY_SITES;
    window.beacons = beacons;
    window.activeHazardNodes = activeHazardNodes;
    window.activeParticles = activeParticles;
    window.emergentRescues = emergentRescues;
    window.buildHazardSites = buildHazardSites;
    window.updateMissionHUD = updateMissionHUD;
    window.clearHazardNode = clearHazardNode;
    window.spawnBurstParticles = spawnBurstParticles;
    window.spawnWaterCannonStream = spawnWaterCannonStream;
}

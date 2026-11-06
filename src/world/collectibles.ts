// Collectibles: Golden Energon Cubes, Golden Crests & Landmark Discoveries
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight } from './terrain.js';
import { player } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast } from '../ui/dialogs.js';
import { spawnBurstParticles } from './emergencies.js';

export const energonCubes = [];
export const goldenCrests = [];

        // energonCubes exported above
        const energonCoreGeo = new THREE.OctahedronGeometry(1.05, 0);
        const energonShellGeo = new THREE.BoxGeometry(1.75, 1.75, 1.75);
        const energonRingGeo = new THREE.RingGeometry(1.35, 1.85, 20).rotateX(-Math.PI / 2);
        const matEnergonCore = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const matEnergonGold = new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide
        });
        const matEnergonRing = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
        });
        const RAINBOW_TRAIL_COLORS = [0xef4444, 0xf97316, 0xfacc15, 0x4ade80, 0x38bdf8, 0xa855f7];
        let rainbowTrailIdx = 0;

        export function createEnergonCubeMesh() {
            const root = new THREE.Group();
            const cubePivot = new THREE.Group();
            cubePivot.position.y = 2.4;

            const core = new THREE.Mesh(energonCoreGeo, matEnergonCore);
            const shell = new THREE.Mesh(energonShellGeo, matEnergonGold);
            const outline = new THREE.Mesh(energonShellGeo, matInkOutline);
            outline.scale.setScalar(1.09);

            cubePivot.add(core, shell, outline);
            root.add(cubePivot);

            const baseRing = new THREE.Mesh(energonRingGeo, matEnergonRing);
            baseRing.position.y = 0.28;
            root.add(baseRing);

            return { root, cubePivot, baseRing };
        }

        const ENERGON_SPAWN_SITES = [
            // Immediate HQ & Town Square Ring (Easy instant pickups right from the start for the 3-year-old!)
            { x: 0, z: 8, alt: 0 },
            { x: -28, z: 25, alt: 0 },
            { x: 28, z: 25, alt: 0 },
            { x: 0, z: 54, alt: 0 },
            { x: -64, z: 25, alt: 0 },
            { x: 64, z: 25, alt: 0 },
            // Stunt Ramp Apex Cubes (Jump the ramp or drive past to magnet-scoop!)
            { x: 246, z: -135, alt: 3.8 },
            { x: -55, z: 48, alt: 2.8 },
            { x: 0, z: 227, alt: 3.8 },
            { x: -229, z: 25, alt: 3.8 },
            { x: 225, z: 25, alt: 3.2 },
            { x: 0, z: -240, alt: 3.2 },
            // Highway & Coastal Ring Cubes
            { x: 0, z: 375, alt: 0 },
            { x: 375, z: 0, alt: 0 },
            { x: 0, z: -375, alt: 0 },
            { x: -375, z: 0, alt: 0 },
            { x: 0, z: 749, alt: 3.8 },
            { x: 689, z: 25, alt: 3.8 },
            { x: 0, z: -740, alt: 0 },
            { x: -689, z: 25, alt: 3.8 },
            // Outer District Landmark Treasures
            { x: 36, z: 1230, alt: 8.5 },    // Aboard the South Harbor Rescue Ferry deck!
            { x: 35, z: 1155, alt: 0 },      // Under the South Harbor Gantry Crane
            { x: -705, z: -725, alt: 0 },    // Volcano Ridge Rim
            { x: 0, z: -1125, alt: 0 },      // North Observatory Courtyard
            { x: -1140, z: 25, alt: 0 },     // Doc Greene's West Tech Dome Plaza
            { x: 1125, z: 25, alt: 0 },      // East Lighthouse Overlook
            // High-Altitude Sky Energon Cubes for Blades (Helicopter & Pterosaur Flight!)
            { x: 0, z: -15, alt: 22 },
            { x: 0, z: 140, alt: 24 },
            { x: 150, z: -120, alt: 26 },
            { x: -160, z: -140, alt: 26 },
            { x: 760, z: -760, alt: 28 },
            { x: 0, z: 1160, alt: 26 }
        ];

        export function buildEnergonCubes(scene?: any) {
            energonCubes.forEach(c => scene.remove(c.mesh.root));
            energonCubes.length = 0;

            ENERGON_SPAWN_SITES.forEach((pt, idx) => {
                const mesh = createEnergonCubeMesh();
                const gy = Math.max(0.0, getTerrainHeight(pt.x, pt.z));
                const baseY = gy + (pt.alt || 0);
                mesh.root.position.set(pt.x, baseY, pt.z);
                if (pt.alt && pt.alt > 8) {
                    mesh.baseRing.visible = false; // Floating sky cube
                }
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh.root);
                energonCubes.push({
                    homeX: pt.x,
                    homeY: baseY,
                    homeZ: pt.z,
                    x: pt.x,
                    y: baseY,
                    z: pt.z,
                    phase: idx * 0.75,
                    collected: false,
                    collectedAtTime: -1,
                    isBonusDrop: false,
                    mesh
                });
            });
        }

        export function spawnBonusEnergonCubes(centerX, centerZ, count = 3) {
            for (let i = 0; i < count; i++) {
                const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
                const dist = 6.5 + Math.random() * 3.5;
                const cx = centerX + Math.cos(ang) * dist;
                const cz = centerZ + Math.sin(ang) * dist;
                const cy = Math.max(0.2, getTerrainHeight(cx, cz));
                const mesh = createEnergonCubeMesh();
                mesh.root.position.set(cx, cy, cz);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh.root);
                energonCubes.push({
                    homeX: cx,
                    homeY: cy,
                    homeZ: cz,
                    x: cx,
                    y: cy,
                    z: cz,
                    phase: i * 1.4,
                    collected: false,
                    collectedAtTime: -1,
                    isBonusDrop: true,
                    mesh
                });
            }
        }

        export function updateEnergonCubes(dt, now) {
            const nowSec = now * 0.001;
            for (let i = energonCubes.length - 1; i >= 0; i--) {
                const c = energonCubes[i];
                if (c.collected) {
                    // Respawn world Energon Cubes after 45s once the player moves >110m away
                    if (!c.isBonusDrop && (nowSec - c.collectedAtTime) > 45.0) {
                        const distFromHome = Math.hypot(player.pos.x - c.homeX, player.pos.z - c.homeZ);
                        if (distFromHome > 110.0) {
                            c.collected = false;
                            c.x = c.homeX;
                            c.y = c.homeY;
                            c.z = c.homeZ;
                            c.mesh.root.position.set(c.x, c.y, c.z);
                            c.mesh.root.visible = true;
                        }
                    }
                    continue;
                }

                // Spin & bob the glowing crystal cube
                c.mesh.cubePivot.rotation.y += dt * 2.2;
                c.mesh.cubePivot.rotation.x = Math.sin(nowSec * 2.5 + c.phase) * 0.35;
                c.mesh.cubePivot.position.y = 2.4 + Math.sin(nowSec * 3.8 + c.phase) * 0.45;
                const ringPulse = 1.0 + Math.sin(nowSec * 4.5 + c.phase) * 0.14;
                c.mesh.baseRing.scale.setScalar(ringPulse);

                // Generous 16.5m 3D Magnetic Attraction so a 3-year-old easily scoops cubes by driving/flying nearby!
                const dx = player.pos.x - c.x;
                const dy = (player.pos.y + 1.5) - (c.y + 2.0);
                const dz = player.pos.z - c.z;
                const dist3D = Math.hypot(dx, dy, dz);

                if (dist3D < 16.5) {
                    const pullSpeed = THREE.MathUtils.lerp(18.0, 42.0, 1.0 - Math.min(1.0, dist3D / 16.5));
                    c.x += (dx / Math.max(0.1, dist3D)) * pullSpeed * dt;
                    c.y += (dy / Math.max(0.1, dist3D)) * pullSpeed * dt;
                    c.z += (dz / Math.max(0.1, dist3D)) * pullSpeed * dt;
                    c.mesh.root.position.set(c.x, c.y, c.z);

                    if (dist3D < 4.6) {
                        // Collected Golden Energon Cube!
                        sfx.playEnergonCollect();
                        spawnBurstParticles(c.x, c.y + 2.0, c.z, 0xfacc15, 14, 1.25);

                        // Grant 4.5s Rainbow Energon Turbo & Super-Jump Boost (no forced auto-propulsion)!
                        player.energonBoostTimer = 4.5;

                        progression.totalEnergonCubes += 1;
                        saveProgression();

                        if (c.isBonusDrop) {
                            scene.remove(c.mesh.root);
                            energonCubes.splice(i, 1);
                        } else {
                            c.collected = true;
                            c.collectedAtTime = nowSec;
                            c.mesh.root.visible = false;
                        }
                    }
                } else {
                    // Gently return to home position if player drove past without collecting
                    c.x = THREE.MathUtils.lerp(c.x, c.homeX, Math.min(1, dt * 3.0));
                    c.y = THREE.MathUtils.lerp(c.y, c.homeY, Math.min(1, dt * 3.0));
                    c.z = THREE.MathUtils.lerp(c.z, c.homeZ, Math.min(1, dt * 3.0));
                    c.mesh.root.position.set(c.x, c.y, c.z);
                }
            }
        }

        export const DISCOVERY_LANDMARKS = [
            { id: "firehouse_hq", name: "Firehouse HQ", x: 0, z: -45, r: 65 },
            { id: "griffin_lighthouse", name: "Griffin Rock Lighthouse", x: 1250, z: 60, r: 65 },
            { id: "ocean_causeway", name: "Causeway Bridge Landing", x: 1120, z: 540, r: 75 },
            { id: "wayward_ruins", name: "Wayward Alien Ruins", x: 1960, z: 540, r: 75 },
            { id: "wayward_grotto", name: "Wayward Sea Grotto", x: 2040, z: 360, r: 60 },
            { id: "wayward_pier", name: "Wayward Scenic Pier", x: 1802, z: 306, r: 65 },
            { id: "high_quarry", name: "High Rock Quarry", x: -750, z: -750, r: 75 },
            { id: "sky_observatory", name: "Mountain Observatory Peak", x: 0, z: -1080, r: 70 },
            { id: "wind_farm", name: "Wind Turbine Ridge", x: 762, z: -780, r: 75 },
            { id: "south_harbor", name: "Griffin Rock Harbor Docks", x: 0, z: 1140, r: 75 },
            { id: "west_tech_plaza", name: "West Tech Outpost", x: -1080, z: 30, r: 70 },
            { id: "downtown_clocktower", name: "Civic Center Clocktower", x: -140, z: 120, r: 60 },
            { id: "mt_griffin_peak", name: "Mount Griffin Volcano Apex", x: -650, z: 650, r: 80 },
            { id: "pine_campground", name: "Pine Valley Campsite", x: -350, z: -350, r: 65 },
            { id: "coastal_beach", name: "Sandy Cove Beach", x: 450, z: -450, r: 65 },
            { id: "ferry_terminal", name: "Ferry Slip Terminal", x: 0, z: 1230, r: 65 },
            { id: "morocco_lair", name: "Dr. Morocco's Airship Lair", x: -820, z: -1180, r: 75 }
        ];

        let landmarkCheckCooldown = 0;
        export function updateLandmarkDiscovery(px, pz) {
            landmarkCheckCooldown++;
            if (landmarkCheckCooldown % 15 !== 0) return;
            if (!Array.isArray(progression.discoveredLandmarks)) {
                progression.discoveredLandmarks = [];
            }
            for (let i = 0; i < DISCOVERY_LANDMARKS.length; i++) {
                const lm = DISCOVERY_LANDMARKS[i];
                if (!progression.discoveredLandmarks.includes(lm.id)) {
                    const dist = Math.hypot(px - lm.x, pz - lm.z);
                    if (dist <= lm.r) {
                        progression.discoveredLandmarks.push(lm.id);
                        sfx.playDiscoveryChime();
                        spawnBurstParticles(player.pos.x, player.pos.y + 3.0, player.pos.z, 0x38bdf8, 20, 1.4);
                        showToast(
                            "🗺️ LANDMARK DISCOVERED!",
                            `${lm.name} (${progression.discoveredLandmarks.length}/${DISCOVERY_LANDMARKS.length}) +2 Hero Pts`
                        );
                        saveProgression();
                        break;
                    }
                }
            }
        }


        // =====================================================================
        const GOLDEN_CREST_DEFS = [
            { id: "crest_hq_roof", name: "HQ Helipad Crest", x: 0, y: 17.5, z: -45 },
            { id: "crest_lighthouse", name: "Lighthouse Lantern Crest", x: 1250, y: 44.5, z: 60 },
            { id: "crest_observatory", name: "Observatory Dome Crest", x: 0, y: 42.0, z: -1080 },
            { id: "crest_bridge_tower", name: "Causeway Bridge Tower Crest", x: 1530, y: 36.0, z: 540 },
            { id: "crest_wayward_grotto", name: "Sea Grotto Crystal Crest", x: 2040, y: 3.5, z: 360 },
            { id: "crest_wayward_ruins", name: "Ancient Temple Relic", x: 1960, y: 18.0, z: 540 },
            { id: "crest_quarry_crane", name: "High Quarry Crane Apex", x: -750, y: 28.0, z: -750 },
            { id: "crest_harbor_pier", name: "Harbor Ferry Pier Crest", x: 0, y: 7.5, z: 1230 },
            { id: "crest_wind_ridge", name: "Wind Turbine Plateau Crest", x: 760, y: 32.0, z: -780 },
            { id: "crest_volcano_rim", name: "Mount Griffin Rim Crest", x: -650, y: 48.0, z: 650 }
        ];

        // goldenCrests exported above
        export function createGoldenCrestMesh() {
            const grp = new THREE.Group();
            const matGold = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.88,
                roughness: 0.22,
                emissive: 0x785600,
                emissiveIntensity: 0.35
            });
            const matSilverTrim = new THREE.MeshStandardMaterial({
                color: 0xf1f5f9,
                metalness: 0.92,
                roughness: 0.15
            });

            const shield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.45), matGold);
            shield.castShadow = true;
            grp.add(shield);

            const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.4, 4), matGold);
            tip.rotation.y = Math.PI / 4;
            tip.rotation.x = Math.PI;
            tip.position.y = -1.6;
            grp.add(tip);

            [-0.26, 0.26].forEach(zPos => {
                const emblemCenter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.18), matSilverTrim);
                emblemCenter.position.set(0, 0.2, zPos);
                grp.add(emblemCenter);

                const emblemBrow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.18), matSilverTrim);
                emblemBrow.position.set(0, 0.9, zPos);
                grp.add(emblemBrow);

                const emblemNose = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.18), matSilverTrim);
                emblemNose.position.set(0, -0.4, zPos);
                grp.add(emblemNose);
            });

            const halo = new THREE.Mesh(
                new THREE.TorusGeometry(2.2, 0.12, 8, 24),
                new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.75 })
            );
            halo.rotation.x = Math.PI / 2;
            grp.add(halo);

            return grp;
        }

        export function initGoldenCrests(scene) {
            if (!Array.isArray(progression.collectedCrests)) {
                progression.collectedCrests = [];
            }
            GOLDEN_CREST_DEFS.forEach(def => {
                const mesh = createGoldenCrestMesh();
                mesh.position.set(def.x, def.y, def.z);
                const isCollected = progression.collectedCrests.includes(def.id);
                mesh.visible = !isCollected;
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                registerCullableObject(mesh, def.x, def.y, def.z, 22);
                goldenCrests.push({
                    def,
                    mesh,
                    collected: isCollected,
                    baseY: def.y,
                    phase: Math.random() * Math.PI * 2
                });
            });
        }

        export function updateGoldenCrests(dt, now) {
            const nowSec = now * 0.001;
            for (let i = 0; i < goldenCrests.length; i++) {
                const c = goldenCrests[i];
                if (c.collected || !c.mesh.visible) continue;

                c.mesh.rotation.y += dt * 1.8;
                c.mesh.position.y = c.baseY + Math.sin(nowSec * 2.8 + c.phase) * 0.45;

                const dx = player.pos.x - c.def.x;
                const dy = (player.pos.y + 2.0) - c.mesh.position.y;
                const dz = player.pos.z - c.def.z;
                const dist3D = Math.hypot(dx, dy, dz);

                if (dist3D < 6.5) {
                    c.collected = true;
                    c.mesh.visible = false;
                    if (!progression.collectedCrests.includes(c.def.id)) {
                        progression.collectedCrests.push(c.def.id);
                    }
                    sfx.playRelicFound();
                    spawnBurstParticles(c.def.x, c.mesh.position.y, c.def.z, 0xffd700, 28, 1.8);
                    showToast(
                        "⭐ GOLDEN AUTOBOT RELIC!",
                        `${c.def.name} (${progression.collectedCrests.length}/${GOLDEN_CREST_DEFS.length}) +5 Hero Pts`
                    );
                    saveProgression();
                }
            }
        }


if (typeof window !== 'undefined') {
    window.energonCubes = energonCubes;
    window.goldenCrests = goldenCrests;
    window.DISCOVERY_LANDMARKS = DISCOVERY_LANDMARKS;
    window.buildEnergonCubes = buildEnergonCubes;
    window.spawnBonusEnergonCubes = spawnBonusEnergonCubes;
    window.updateEnergonCubes = updateEnergonCubes;
    window.initGoldenCrests = initGoldenCrests;
    window.updateGoldenCrests = updateGoldenCrests;
    window.updateLandmarkDiscovery = updateLandmarkDiscovery;
}

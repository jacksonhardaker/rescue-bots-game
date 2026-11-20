// Instanced Streetlamps & Interactive Road Breakables (Cones, Barricades)
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import { toonGrad3, matDarkSteel, matInkOutline, OUTLINE_LAYER } from '../rendering/materials.js';
import { player, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import {
    streetlampGeos,
    matStreetlampBulb,
    createTrafficConeMesh,
    createBarricadeMesh
} from './propModels.js';

export { createTrafficConeMesh, createBarricadeMesh, matStreetlampBulb };

export const interactiveRoadProps = [];

        export const streetlampCoords = [
            // North-South Central Avenue (x = ±14, safely clear of EW Highway at z=25)
            [-14, -30], [14, -30],
            [-14, -10], [14, -10],
            [-14, 42],  [14, 42],
            [-14, 64],  [14, 64],

            // East-West Central Avenue (z = 10 and z = 40, safely flanking the 24m road corridor)
            [-38, 10],  [38, 10],
            [-65, 10],  [65, 10],
            [-38, 40],  [38, 40],
            [-65, 40],  [65, 40],

            // South Harbor
            [-14, 1110], [14, 1110], [-14, 1150], [14, 1150],
            // West Tech
            [-1135, 10], [-1105, 10], [-1135, 40], [-1105, 40],
            // North Observatory
            [-14, -1145], [14, -1145], [-14, -1095], [14, -1095]
        ];

        if (typeof window !== 'undefined') (window as any).matStreetlampBulb = matStreetlampBulb;

        export function buildInstancedStreetlamps(scene) {
            const count = streetlampCoords.length;
            const { postGeo, bulbGeo, capGeo } = streetlampGeos;

            const iPosts = new THREE.InstancedMesh(postGeo, matDarkSteel, count);
            const iBulbs = new THREE.InstancedMesh(bulbGeo, matStreetlampBulb, count);
            const iCaps = new THREE.InstancedMesh(capGeo, matDarkSteel, count);
            const iOutlines = new THREE.InstancedMesh(postGeo, matInkOutline, count);
            const iCapOutlines = new THREE.InstancedMesh(capGeo, matInkOutline, count);
            iOutlines.userData.isOutline = true;
            iOutlines.layers.set(OUTLINE_LAYER);
            iCapOutlines.userData.isOutline = true;
            iCapOutlines.layers.set(OUTLINE_LAYER);

            iPosts.castShadow = true;
            iCaps.castShadow = true;

            const dummy = new THREE.Object3D();
            for (let i = 0; i < count; i++) {
                const [lx, lz] = streetlampCoords[i];
                const ly = getTerrainHeight(lx, lz);

                // Post
                dummy.position.set(lx, ly + 3.6, lz);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                iPosts.setMatrixAt(i, dummy.matrix);

                dummy.scale.set(1.08, 1.01, 1.08);
                dummy.updateMatrix();
                iOutlines.setMatrixAt(i, dummy.matrix);

                // Bulb
                dummy.position.set(lx, ly + 7.4, lz);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                iBulbs.setMatrixAt(i, dummy.matrix);

                // Cap
                dummy.position.set(lx, ly + 7.95, lz);
                dummy.updateMatrix();
                iCaps.setMatrixAt(i, dummy.matrix);

                dummy.scale.setScalar(1.08);
                dummy.updateMatrix();
                iCapOutlines.setMatrixAt(i, dummy.matrix);
            }

            iPosts.instanceMatrix.needsUpdate = true;
            iBulbs.instanceMatrix.needsUpdate = true;
            iCaps.instanceMatrix.needsUpdate = true;
            iOutlines.instanceMatrix.needsUpdate = true;
            iCapOutlines.instanceMatrix.needsUpdate = true;

            const grp = new THREE.Group();
            grp.add(iPosts);
            grp.add(iBulbs);
            grp.add(iCaps);
            grp.add(iOutlines);
            grp.add(iCapOutlines);
            (scene || (typeof window !== "undefined" ? window.scene : null)).add(grp);
        }
        // buildInstancedStreetlamps called via initProps


        // interactiveRoadProps exported above

        export function initInteractiveRoadProps(scene) {
            const coneSpawns = [
                { x: 1125, z: 536 }, { x: 1135, z: 536 }, { x: 1145, z: 536 },
                { x: 1125, z: 544 }, { x: 1135, z: 544 }, { x: 1145, z: 544 },
                { x: 1780, z: 536 }, { x: 1790, z: 536 }, { x: 1800, z: 536 },
                { x: 1780, z: 544 }, { x: 1790, z: 544 }, { x: 1800, z: 544 },
                { x: 160, z: 100 }, { x: 170, z: 105 }, { x: 180, z: 110 },
                { x: -350, z: 95 }, { x: -360, z: 100 }, { x: -370, z: 105 }
            ];

            coneSpawns.forEach(p => {
                const mesh = createTrafficConeMesh();
                const groundY = getSurfaceHeight(p.x, p.z);
                mesh.position.set(p.x, groundY, p.z);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                registerCullableObject(mesh, p.x, groundY, p.z, 14);
                interactiveRoadProps.push({
                    mesh,
                    origX: p.x, origY: groundY, origZ: p.z,
                    x: p.x, y: groundY, z: p.z,
                    vx: 0, vy: 0, vz: 0,
                    rxv: 0, ryv: 0, rzv: 0,
                    isCone: true,
                    knocked: false,
                    radius: 1.2
                });
            });

            const barricadeSpawns = [
                { x: 1120, z: 540, rotY: 0 },
                { x: 1810, z: 540, rotY: 0 },
                { x: 150, z: 95, rotY: 0.4 },
                { x: 195, z: 125, rotY: -0.3 },
                { x: -340, z: 90, rotY: 1.2 },
                { x: -380, z: 110, rotY: 1.1 },
                { x: 620, z: 270, rotY: 0.8 },
                { x: 660, z: 270, rotY: 0.8 }
            ];

            barricadeSpawns.forEach(p => {
                const mesh = createBarricadeMesh();
                const groundY = getSurfaceHeight(p.x, p.z);
                mesh.position.set(p.x, groundY, p.z);
                mesh.rotation.y = p.rotY || 0;
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(mesh);
                registerCullableObject(mesh, p.x, groundY, p.z, 18);
                interactiveRoadProps.push({
                    mesh,
                    origX: p.x, origY: groundY, origZ: p.z,
                    x: p.x, y: groundY, z: p.z,
                    vx: 0, vy: 0, vz: 0,
                    rxv: 0, ryv: 0, rzv: 0,
                    isCone: false,
                    knocked: false,
                    radius: 2.2
                });
            });
        }

        export function updateInteractiveRoadProps(dt) {
            const playerSpeed = Math.abs(player.speed);
            const playerHeading = player.heading;

            for (let i = 0; i < interactiveRoadProps.length; i++) {
                const prop = interactiveRoadProps[i];

                const dx = player.pos.x - prop.x;
                const dz = player.pos.z - prop.z;
                const dist2D = Math.hypot(dx, dz);
                const hitThreshold = prop.radius + (player.mode === 'VEHICLE' ? 2.8 : 2.2);

                if (dist2D < hitThreshold && playerSpeed > 1.2) {
                    const launchSpeed = Math.max(7.0, playerSpeed * 1.35);
                    prop.vx = Math.sin(playerHeading) * launchSpeed + (Math.random() - 0.5) * 6;
                    prop.vz = Math.cos(playerHeading) * launchSpeed + (Math.random() - 0.5) * 6;
                    prop.vy = 4.5 + Math.random() * 4.0;
                    prop.rxv = (Math.random() - 0.5) * 16;
                    prop.rzv = (Math.random() - 0.5) * 16;
                    prop.ryv = (Math.random() - 0.5) * 12;

                    if (!prop.knocked) {
                        prop.knocked = true;
                        sfx.playConeKnock();
                        spawnBurstParticles(prop.x, prop.y + 0.6, prop.z, prop.isCone ? 0xff6b00 : 0xffa500, 7, 0.8);
                    }
                }

                if (prop.knocked) {
                    prop.vy -= 24.0 * dt;
                    prop.x += prop.vx * dt;
                    prop.y += prop.vy * dt;
                    prop.z += prop.vz * dt;

                    prop.mesh.rotation.x += prop.rxv * dt;
                    prop.mesh.rotation.y += prop.ryv * dt;
                    prop.mesh.rotation.z += prop.rzv * dt;

                    const groundY = getSurfaceHeight(prop.x, prop.z);
                    if (prop.y < groundY) {
                        prop.y = groundY;
                        prop.vy = -prop.vy * 0.35;
                        prop.vx *= 0.82;
                        prop.vz *= 0.82;
                        prop.rxv *= 0.75;
                        prop.rzv *= 0.75;
                        prop.ryv *= 0.75;

                        if (Math.abs(prop.vy) < 0.6) {
                            prop.vy = 0;
                        }
                    }

                    prop.mesh.position.set(prop.x, prop.y, prop.z);
                }
            }
        }


export function initProps(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

    buildInstancedStreetlamps(s);
    initInteractiveRoadProps(s);

    if (typeof window !== 'undefined') {
        window.interactiveRoadProps = interactiveRoadProps;
    }
}

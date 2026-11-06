// Instanced Streetlamps & Interactive Road Breakables (Cones, Barricades)
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import { toonGrad3, matDarkSteel, matInkOutline } from '../rendering/materials.js';
import { player, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';

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

        export function buildInstancedStreetlamps(scene) {
            const count = streetlampCoords.length;
            const postGeo = new THREE.CylinderGeometry(0.18, 0.28, 7.2, 8);
            const bulbGeo = new THREE.SphereGeometry(0.68, 8, 8);
            const capGeo = new THREE.ConeGeometry(0.95, 0.55, 8);
            const matBulb = new THREE.MeshBasicMaterial({ color: 0xfef08a });

            const iPosts = new THREE.InstancedMesh(postGeo, matDarkSteel, count);
            const iBulbs = new THREE.InstancedMesh(bulbGeo, matBulb, count);
            const iCaps = new THREE.InstancedMesh(capGeo, matDarkSteel, count);
            const iOutlines = new THREE.InstancedMesh(postGeo, matInkOutline, count);
            const iCapOutlines = new THREE.InstancedMesh(capGeo, matInkOutline, count);

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

        export function createTrafficConeMesh() {
            const grp = new THREE.Group();
            const matBase = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
            const matCone = new THREE.MeshToonMaterial({ color: 0xff6b00, gradientMap: toonGrad3 });
            const matWhiteStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });

            const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 1.2), matBase);
            base.position.y = 0.08;
            grp.add(base);

            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.5, 12), matCone);
            cone.position.y = 0.83;
            grp.add(cone);

            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.33, 0.36, 12), matWhiteStripe);
            band.position.y = 0.78;
            grp.add(band);

            return grp;
        }

        export function createBarricadeMesh() {
            const grp = new THREE.Group();
            const matLegs = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
            const matBoard = new THREE.MeshToonMaterial({ color: 0xffa500, gradientMap: toonGrad3 });
            const matBlackStripe = new THREE.MeshBasicMaterial({ color: 0x0f172a });

            [-1.3, 1.3].forEach(lx => {
                const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.14), matLegs);
                legL.rotation.z = 0.18;
                legL.position.set(lx - 0.12, 0.8, 0);
                grp.add(legL);

                const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.14), matLegs);
                legR.rotation.z = -0.18;
                legR.position.set(lx + 0.12, 0.8, 0);
                grp.add(legR);
            });

            const board = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.14), matBoard);
            board.position.set(0, 1.15, 0);
            grp.add(board);

            [-1.0, -0.4, 0.2, 0.8].forEach(sx => {
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.16), matBlackStripe);
                stripe.rotation.z = -0.45;
                stripe.position.set(sx, 1.15, 0);
                grp.add(stripe);
            });

            const amberLight = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.22, 0.28, 10),
                new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            );
            amberLight.position.set(0, 1.58, 0);
            grp.add(amberLight);

            return grp;
        }

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

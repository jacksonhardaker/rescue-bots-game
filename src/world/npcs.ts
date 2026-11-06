// Living World NPC Citizens, Civilian Traffic AI & Buddy Bot AI
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight, isPointInWater } from './terrain.js';
import {
    toonGrad3, toonGrad4, matDarkSteel, matChrome, matTire,
    matNPCHeadlightOn, matNPCHeadlightOff, matNPCTaillightOn, matNPCTaillightOff,
    matNPCBeam, matNPCBeamPool
} from '../rendering/materials.js';
import { texWindshieldCyan } from '../rendering/textures.js';
import { player, buddyBot, botRigs, humanNPCs, vehicleNPCs, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech } from '../ui/dialogs.js';
import { applyBotRigMorph, BOT_SCALES } from '../bots/botRigs.js';
import { WEATHER_MODES, currentWeatherIdx } from './weather.js';
import { BOT_METADATA } from '../bots/botMeta.js';

import { beacons } from './emergencies.js';
import { railroadCrossings } from './railway.js';
import { getBotScale } from '../bots/botRigs.js';
import { getInnerRoadRadius, getOuterRoadRadius } from './terrain.js';
import { spawnWaterCannonStream } from './emergencies.js';
        export function createHumanNPCMesh(cfg) {
            const root = new THREE.Group();

            const matSkin = new THREE.MeshToonMaterial({ color: cfg.skinColor || 0xfde047, gradientMap: toonGrad3 });
            const matShirt = new THREE.MeshToonMaterial({ color: cfg.shirtColor || 0x2563eb, gradientMap: toonGrad3 });
            const matPants = new THREE.MeshToonMaterial({ color: cfg.pantsColor || 0x1e293b, gradientMap: toonGrad3 });
            const matHair = new THREE.MeshToonMaterial({ color: cfg.hairColor || 0x78350f, gradientMap: toonGrad3 });
            const matIndicator = new THREE.MeshBasicMaterial({ color: cfg.indicatorColor || 0x38bdf8 });

            // Torso
            const torso = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.68), matShirt);
            torso.position.y = 2.15;
            torso.castShadow = true;
            root.add(torso);

            // Head
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), matSkin);
            head.position.y = 3.45;
            head.castShadow = true;
            root.add(head);

            // Eyes & Smile on Front (+Z) of Head
            const eyeGeo = new THREE.BoxGeometry(0.14, 0.16, 0.08);
            const matEye = new THREE.MeshBasicMaterial({ color: 0x0f172a });
            const leftEye = new THREE.Mesh(eyeGeo, matEye);
            leftEye.position.set(-0.22, 0.1, 0.48);
            leftEye.userData.noOutline = true;
            const rightEye = new THREE.Mesh(eyeGeo, matEye);
            rightEye.position.set(0.22, 0.1, 0.48);
            rightEye.userData.noOutline = true;
            const smile = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.08), matEye);
            smile.position.set(0, -0.18, 0.48);
            smile.userData.noOutline = true;
            head.add(leftEye, rightEye, smile);

            // Hair or Hat/Helmet
            const hairCap = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.36, 1.08), matHair);
            hairCap.position.set(0, 0.44, 0);
            head.add(hairCap);
            if (cfg.hasVisorHat) {
                const brim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.12, 0.45), matHair);
                brim.position.set(0, 0.32, 0.62);
                head.add(brim);
            }

            // Articulated Arms
            const leftArmPivot = new THREE.Group();
            leftArmPivot.position.set(-0.78, 2.75, 0);
            const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.25, 0.38), matShirt);
            leftArm.position.y = -0.52;
            leftArmPivot.add(leftArm);
            root.add(leftArmPivot);

            const rightArmPivot = new THREE.Group();
            rightArmPivot.position.set(0.78, 2.75, 0);
            const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.25, 0.38), matShirt);
            rightArm.position.y = -0.52;
            rightArmPivot.add(rightArm);
            root.add(rightArmPivot);

            // Articulated Legs
            const leftLegPivot = new THREE.Group();
            leftLegPivot.position.set(-0.32, 1.42, 0);
            const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.38, 0.46), matPants);
            leftLeg.position.y = -0.68;
            leftLegPivot.add(leftLeg);
            root.add(leftLegPivot);

            const rightLegPivot = new THREE.Group();
            rightLegPivot.position.set(0.32, 1.42, 0);
            const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.38, 0.46), matPants);
            rightLeg.position.y = -0.68;
            rightLegPivot.add(rightLeg);
            root.add(rightLegPivot);

            // Floating Speech/SOS Gem Indicator above NPC head
            const radioGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), matIndicator);
            radioGem.position.y = 4.85;
            root.add(radioGem);

            root.scale.setScalar(1.22);
            applyCartoonInkOutlines(root, 1.06, false);

            return {
                root,
                head,
                leftArmPivot,
                rightArmPivot,
                leftLegPivot,
                rightLegPivot,
                radioGem
            };
        }

        // Dynamic Civilian Vehicle Headlight Materials & Projection Beams imported from materials.js

        export function setCivilianVehicleHeadlights(active) {
            if (!vehicleNPCs || vehicleNPCs.length === 0) return;
            for (let i = 0; i < vehicleNPCs.length; i++) {
                const v = vehicleNPCs[i];
                if (v.beamGroup) v.beamGroup.visible = active;
                if (v.headlights) {
                    for (let j = 0; j < v.headlights.length; j++) {
                        v.headlights[j].material = active ? matNPCHeadlightOn : matNPCHeadlightOff;
                    }
                }
                if (v.taillights) {
                    for (let j = 0; j < v.taillights.length; j++) {
                        v.taillights[j].material = active ? matNPCTaillightOn : matNPCTaillightOff;
                    }
                }
            }
        }

        // Physical Dimensions & Weight Specifications for Civilian Vehicles
        const CIVILIAN_VEHICLE_SPECS = {
            SEDAN: {
                width: 3.6,
                length: 6.6,
                halfWidth: 1.8,
                halfLength: 3.3,
                mass: 1600 // 1.6 metric tons
            },
            PICKUP: {
                width: 3.8,
                length: 7.4,
                halfWidth: 1.9,
                halfLength: 3.7,
                mass: 2400 // 2.4 metric tons
            },
            VAN: {
                width: 3.8,
                length: 7.2,
                halfWidth: 1.9,
                halfLength: 3.6,
                mass: 3800 // 3.8 metric tons
            },
            BUS: {
                width: 4.4,
                length: 10.2,
                halfWidth: 2.2,
                halfLength: 5.1,
                mass: 14000 // 14.0 metric tons
            }
        };

        // Physical Dimensions & Weight Specifications for Playable Rescue Bots
        const BOT_PHYSICS_SPECS = {
            BOULDER: {
                mass: 28000, // 28 tons - Heavy Armored Bulldozer / Triceratops
                vehicle: { halfWidth: 2.2, halfLength: 3.8 },
                dino: { halfWidth: 2.0, halfLength: 3.6 },
                bot: { halfWidth: 1.8, halfLength: 1.8 }
            },
            HEATWAVE: {
                mass: 22000, // 22 tons - Heavy Fire Engine / Brachiosaur
                vehicle: { halfWidth: 2.1, halfLength: 4.4 },
                dino: { halfWidth: 2.1, halfLength: 4.5 },
                bot: { halfWidth: 1.8, halfLength: 1.8 }
            },
            OPTIMUS: {
                mass: 32000, // 32 tons - Supreme Commander Heavy Semi-Truck Cab / Primal T-Rex (Scaled 1.25x)
                vehicle: { halfWidth: 2.5, halfLength: 5.6 },
                dino: { halfWidth: 2.5, halfLength: 5.4 },
                bot: { halfWidth: 2.3, halfLength: 2.3 }
            },
            SALVAGE: {
                mass: 20000, // 20 tons - Heavy Waste & Recycling Truck / Ankylosaur
                vehicle: { halfWidth: 2.1, halfLength: 4.0 },
                dino: { halfWidth: 2.0, halfLength: 3.8 },
                bot: { halfWidth: 1.8, halfLength: 1.8 }
            },
            HIGHTIDE: {
                mass: 34000, // 34 tons - Titan Deep-Ocean Armored Submersible / Giant Plesiosaur (Scaled 1.30x)
                vehicle: { halfWidth: 2.6, halfLength: 5.2 },
                dino: { halfWidth: 2.5, halfLength: 5.0 },
                bot: { halfWidth: 2.3, halfLength: 2.3 }
            },
            CHASE: {
                mass: 4800, // 4.8 tons - Police Interceptor / Stegosaur
                vehicle: { halfWidth: 1.85, halfLength: 3.5 },
                dino: { halfWidth: 1.8, halfLength: 3.4 },
                bot: { halfWidth: 1.6, halfLength: 1.6 }
            },
            BLADES: {
                mass: 4500, // 4.5 tons - Rescue Helicopter / Pterosaur
                vehicle: { halfWidth: 1.9, halfLength: 3.8 },
                dino: { halfWidth: 1.8, halfLength: 3.4 },
                bot: { halfWidth: 1.6, halfLength: 1.6 }
            },
            BLURR: {
                mass: 3200, // 3.2 tons - High-Speed Racecar / Gallimimus
                vehicle: { halfWidth: 1.8, halfLength: 3.4 },
                dino: { halfWidth: 1.6, halfLength: 3.2 },
                bot: { halfWidth: 1.5, halfLength: 1.5 }
            },
            BUMBLEBEE: {
                mass: 3200, // 3.2 tons - Sports Speedster / Velociraptor
                vehicle: { halfWidth: 1.8, halfLength: 3.5 },
                dino: { halfWidth: 1.6, halfLength: 3.2 },
                bot: { halfWidth: 1.5, halfLength: 1.5 }
            },
            QUICKSHADOW: {
                mass: 3100, // 3.1 tons - Covert Luxury Coupe / Dilophosaur
                vehicle: { halfWidth: 1.75, halfLength: 3.4 },
                dino: { halfWidth: 1.6, halfLength: 3.2 },
                bot: { halfWidth: 1.5, halfLength: 1.5 }
            }
        };

        // 2D Oriented Bounding Box (OBB) Separating Axis Theorem (SAT) Overlap Test
        export function testOBBOverlap2D(boxA, boxB) {
            const dx = boxB.x - boxA.x;
            const dz = boxB.z - boxA.z;

            // Unit axes for Box A (Forward: [sinA, cosA], Right: [cosA, -sinA])
            const sinA = Math.sin(boxA.heading);
            const cosA = Math.cos(boxA.heading);
            const rAx = cosA, rAz = -sinA;
            const fAx = sinA, fAz = cosA;

            // Unit axes for Box B
            const sinB = Math.sin(boxB.heading);
            const cosB = Math.cos(boxB.heading);
            const rBx = cosB, rBz = -sinB;
            const fBx = sinB, fBz = cosB;

            const axes = [
                { x: rAx, z: rAz },
                { x: fAx, z: fAz },
                { x: rBx, z: rBz },
                { x: fBx, z: fBz }
            ];

            let minOverlap = Infinity;
            let bestAxis = null;

            for (let i = 0; i < 4; i++) {
                const ax = axes[i].x;
                const az = axes[i].z;

                // Half-extent projection of Box A onto axis
                const rA = boxA.halfWidth * Math.abs(rAx * ax + rAz * az) +
                           boxA.halfLength * Math.abs(fAx * ax + fAz * az);

                // Half-extent projection of Box B onto axis
                const rB = boxB.halfWidth * Math.abs(rBx * ax + rBz * az) +
                           boxB.halfLength * Math.abs(fBx * ax + fBz * az);

                const dist = Math.abs(dx * ax + dz * az);
                const overlap = (rA + rB) - dist;
                if (overlap <= 0.0001) return null; // Separating axis found -> No collision

                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    bestAxis = { x: ax, z: az };
                }
            }

            // Orient Minimum Translation Vector (MTV) pointing from Box A toward Box B
            if (dx * bestAxis.x + dz * bestAxis.z < 0) {
                bestAxis.x = -bestAxis.x;
                bestAxis.z = -bestAxis.z;
            }

            return {
                depth: minOverlap,
                mtv: { x: bestAxis.x * minOverlap, z: bestAxis.z * minOverlap }
            };
        }

        export function getPlayerOBB() {
            const spec = BOT_PHYSICS_SPECS[player.botType] || {
                mass: 5000,
                vehicle: { halfWidth: 1.8, halfLength: 3.5 },
                dino: { halfWidth: 1.8, halfLength: 3.5 },
                bot: { halfWidth: 1.6, halfLength: 1.6 }
            };
            let dims;
            if (player.mode === 'VEHICLE') dims = spec.vehicle;
            else if (player.mode === 'DINO') dims = spec.dino;
            else dims = spec.bot;

            return {
                x: player.pos.x,
                z: player.pos.z,
                heading: player.heading,
                halfWidth: dims.halfWidth,
                halfLength: dims.halfLength,
                mass: spec.mass
            };
        }

        export function getCompassDirection(dx, dz) {
            // In world coords: -Z is North, +Z is South, +X is East, -X is West
            const angle = Math.atan2(dx, -dz); // 0 = North, PI/2 = East, PI = South, -PI/2 = West
            const deg = ((angle * 180 / Math.PI) + 360) % 360;
            const dirs = [
                "North", "North-East", "East", "South-East",
                "South", "South-West", "West", "North-West"
            ];
            return dirs[Math.round(deg / 45) % 8];
        }

        export function getClosestDisasterReport(fromX, fromZ) {
            let closestBeacon = null;
            let closestDist = Infinity;

            beacons.forEach(b => {
                if (!b.restored) {
                    const d = Math.hypot(b.x - fromX, b.z - fromZ);
                    if (d < closestDist) {
                        closestDist = d;
                        closestBeacon = b;
                    }
                }
            });

            if (!closestBeacon) {
                return {
                    hasDisaster: false,
                    speechText: "Thank you, Rescue Bots! Every single emergency on Griffin Rock is resolved! Our island is safe!",
                    bannerText: `"Thank you, Rescue Bots! Every single emergency on Griffin Rock is resolved! Our island is safe!"`
                };
            }

            const distMeters = Math.max(10, Math.round(closestDist / 10) * 10);
            const compass = getCompassDirection(closestBeacon.x - fromX, closestBeacon.z - fromZ);
            const botCallName = BOT_METADATA[player.botType] ? BOT_METADATA[player.botType].name : "Rescue Bot";
            const speechText = `${botCallName}! The closest disaster is the ${closestBeacon.name}, about ${distMeters} meters to the ${compass}!`;

            return {
                hasDisaster: true,
                beacon: closestBeacon,
                distMeters,
                compass,
                speechText,
                bannerText: `"${speechText}"`
            };
        }

        export function speakClosestDisasterForNPC(npc, forceSpeak = false) {
            const nowSec = performance.now() * 0.001;
            if (!forceSpeak && nowSec - (npc.lastSpokeTime || -99) < 24.0) return;

            const report = getClosestDisasterReport(npc.x, npc.z);
            const spoke = triggerNPCSpeech(npc.name, npc.role, report.speechText, npc, forceSpeak);
            if (spoke) {
                npc.lastSpokeTime = nowSec;
                npc.waveTimer = 4.5;
            }
        }

        // Build 3D Cel-Shaded Civilian Vehicle NPC Mesh (Sedan, Pickup, Van, Island Bus)
        export function createCivilianVehicleMesh(vType, bodyColorHex) {
            const root = new THREE.Group();
            const matBody = new THREE.MeshToonMaterial({ color: bodyColorHex, gradientMap: toonGrad3 });
            const matCabinGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });
            const matBumper = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad3 });

            const wheels = [];
            function addWheelPair(zPos, radius = 0.85, xSpread = 2.05) {
                [-xSpread, xSpread].forEach(xSide => {
                    const wGroup = new THREE.Group();
                    wGroup.position.set(xSide, radius, zPos);
                    const tire = new THREE.Mesh(
                        new THREE.CylinderGeometry(radius, radius, 0.65, 12).rotateZ(Math.PI / 2),
                        matTire
                    );
                    const hub = new THREE.Mesh(
                        new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, 0.70, 10).rotateZ(Math.PI / 2),
                        matChrome
                    );
                    wGroup.add(tire, hub);
                    root.add(wGroup);
                    wheels.push(wGroup);
                });
            }

            if (vType === 'BUS') {
                const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.3, 10.2), matBody);
                chassis.position.set(0, 2.35, 0);
                chassis.castShadow = true;
                root.add(chassis);

                const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(3.9, 1.45, 0.2), matCabinGlass);
                frontGlass.position.set(0, 2.85, 5.12);
                root.add(frontGlass);

                const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(4.48, 1.25, 8.2), matCabinGlass);
                sideWindows.position.set(0, 2.85, -0.2);
                root.add(sideWindows);

                addWheelPair(3.2, 0.98, 2.15);
                addWheelPair(-3.2, 0.98, 2.15);
            } else if (vType === 'VAN') {
                const lower = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 7.2), matBody);
                lower.position.set(0, 1.85, 0);
                lower.castShadow = true;
                root.add(lower);

                const windshield = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.2, 1.8), matCabinGlass);
                windshield.position.set(0, 2.55, 2.4);
                root.add(windshield);

                addWheelPair(2.2, 0.85, 1.9);
                addWheelPair(-2.2, 0.85, 1.9);
            } else if (vType === 'PICKUP') {
                const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.35, 7.4), matBody);
                body.position.set(0, 1.45, 0);
                body.castShadow = true;
                root.add(body);

                const cab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.35, 3.1), matBody);
                cab.position.set(0, 2.65, 0.75);
                cab.castShadow = true;
                root.add(cab);

                const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(3.58, 0.95, 2.5), matCabinGlass);
                cabGlass.position.set(0, 2.7, 0.85);
                root.add(cabGlass);

                addWheelPair(2.3, 0.92, 1.95);
                addWheelPair(-2.2, 0.92, 1.95);
            } else {
                // SEDAN
                const lower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.15, 6.6), matBody);
                lower.position.set(0, 1.25, 0);
                lower.castShadow = true;
                root.add(lower);

                const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.15, 3.5), matBody);
                cabin.position.set(0, 2.25, -0.2);
                cabin.castShadow = true;
                root.add(cabin);

                const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.85, 2.9), matCabinGlass);
                cabinGlass.position.set(0, 2.28, -0.15);
                root.add(cabinGlass);

                addWheelPair(2.0, 0.82, 1.82);
                addWheelPair(-2.0, 0.82, 1.82);
            }

            // Front Bumpers & Headlights
            const frontZ = vType === 'BUS' ? 5.15 : (vType === 'PICKUP' ? 3.72 : (vType === 'VAN' ? 3.62 : 3.32));
            const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.38, 0.35), matBumper);
            bumper.position.set(0, 0.85, frontZ);
            root.add(bumper);

            const headlights = [];
            const taillights = [];

            [-1.25, 1.25].forEach(lx => {
                const hl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.2), matNPCHeadlightOff);
                hl.position.set(lx, 1.35, frontZ + 0.05);
                root.add(hl);
                headlights.push(hl);

                const tl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.2), matNPCTaillightOff);
                tl.position.set(lx, 1.35, -frontZ - 0.05);
                root.add(tl);
                taillights.push(tl);
            });

            // Dual Projected Cartoon Headlight Beams & Road Light Pools
            const beamGroup = new THREE.Group();
            [-1.25, 1.25].forEach(lx => {
                const beamGeo = new THREE.BufferGeometry();
                const posArr = new Float32Array([
                    lx - 0.35, 1.35, frontZ,
                    lx + 0.35, 1.35, frontZ,
                    lx - 1.75, 0.14, frontZ + 18.0,

                    lx + 0.35, 1.35, frontZ,
                    lx + 1.75, 0.14, frontZ + 18.0,
                    lx - 1.75, 0.14, frontZ + 18.0
                ]);
                beamGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
                beamGeo.computeVertexNormals();
                const beamMesh = new THREE.Mesh(beamGeo, matNPCBeam);
                beamMesh.userData.noOutline = true;
                beamGroup.add(beamMesh);

                const poolGeo = new THREE.PlaneGeometry(3.6, 13.0);
                poolGeo.rotateX(-Math.PI / 2);
                const poolMesh = new THREE.Mesh(poolGeo, matNPCBeamPool);
                poolMesh.position.set(lx * 0.9, 0.10, frontZ + 9.5);
                poolMesh.userData.noOutline = true;
                beamGroup.add(poolMesh);
            });
            beamGroup.visible = false;
            root.add(beamGroup);

            applyCartoonInkOutlines(root, 1.055, true);
            return { root, wheels, headlights, taillights, beamGroup };
        }

        export function buildLivingWorldNPCs(scene) {
            humanNPCs.length = 0;
            vehicleNPCs.length = 0;
            // 1. Spawn 24 Human NPCs across Griffin Rock (Named Show Characters + Citizens in all 4 Plazas)
            const humanConfigs = [
                { name: "Chief Charlie Burns", role: "Police Chief", x: 16, z: -24, patrolR: 12, shirtColor: 0x1d4ed8, pantsColor: 0x0f172a, hairColor: 0x475569, hasVisorHat: true, voicePitch: 0.88 },
                { name: "Cody Burns", role: "Rescue Comms", x: -18, z: -22, patrolR: 14, shirtColor: 0xf97316, pantsColor: 0x1e3a8a, hairColor: 0xfacc15, hasVisorHat: false, voicePitch: 1.25 },
                { name: "Dani Burns", role: "Air Rescue Pilot", x: 28, z: 14, patrolR: 18, shirtColor: 0xe11d48, pantsColor: 0x1e293b, hairColor: 0x9a3412, hasVisorHat: false, voicePitch: 1.18 },
                { name: "Kade Burns", role: "Firefighter", x: 64, z: 14, patrolR: 18, shirtColor: 0xdc2626, pantsColor: 0x1e293b, hairColor: 0xb45309, hasVisorHat: true, voicePitch: 0.96 },
                { name: "Graham Burns", role: "Engineer", x: -58, z: 14, patrolR: 18, shirtColor: 0x16a34a, pantsColor: 0x334155, hairColor: 0x78350f, hasVisorHat: false, voicePitch: 1.0 },
                { name: "Doc Ezra Greene", role: "Chief Scientist", x: -30, z: 38, patrolR: 15, shirtColor: 0xf8fafc, pantsColor: 0x334155, hairColor: 0x9333ea, hasVisorHat: false, voicePitch: 1.08 },
                { name: "Frankie Greene", role: "Junior Scientist", x: 32, z: 38, patrolR: 16, shirtColor: 0xa855f7, pantsColor: 0x1e3a8a, hairColor: 0x451a03, hasVisorHat: false, voicePitch: 1.22 },
                { name: "Mayor Luskey", role: "Griffin Rock Mayor", x: -12, z: 72, patrolR: 14, shirtColor: 0x4f46e5, pantsColor: 0x0f172a, hairColor: 0xfef08a, hasVisorHat: true, voicePitch: 0.92 },
                { name: "uxley Prescott", role: "TV Reporter", x: 92, z: 14, patrolR: 20, shirtColor: 0x0284c7, pantsColor: 0x1e293b, hairColor: 0x1e293b, hasVisorHat: false, voicePitch: 1.05 },
                { name: "Mrs. Neederlander", role: "Town Citizen", x: -92, z: 36, patrolR: 18, shirtColor: 0xec4899, pantsColor: 0x334155, hairColor: 0xe2e8f0, hasVisorHat: false, voicePitch: 1.15 },
                // South Harbor Port Citizens
                { name: "Captain Shaw", role: "Harbor Master", x: -24, z: 1105, patrolR: 22, shirtColor: 0x0284c7, pantsColor: 0x0f172a, hairColor: 0x94a3b8, hasVisorHat: true, voicePitch: 0.9 },
                { name: "Dockworker Sam", role: "Harbor Crew", x: 35, z: 1125, patrolR: 24, shirtColor: 0xf59e0b, pantsColor: 0x1e3a8a, hairColor: 0x451a03, hasVisorHat: true, voicePitch: 0.95 },
                { name: "Sailor Maya", role: "Coast Patrol", x: -65, z: 1150, patrolR: 22, shirtColor: 0x14b8a6, pantsColor: 0x1e293b, hairColor: 0x78350f, hasVisorHat: false, voicePitch: 1.14 },
                { name: "Harbor Engineer Leo", role: "Port Technician", x: 72, z: 1155, patrolR: 20, shirtColor: 0xf97316, pantsColor: 0x334155, hairColor: 0x1e293b, hasVisorHat: true, voicePitch: 1.0 },
                // West Tech Village Citizens
                { name: "Lab Researcher Dennis", role: "Tech Researcher", x: -1085, z: 12, patrolR: 22, shirtColor: 0x6366f1, pantsColor: 0x0f172a, hairColor: 0xe2e8f0, hasVisorHat: false, voicePitch: 0.92 },
                { name: "Tech Specialist Ava", role: "Lab Engineer", x: -1135, z: 42, patrolR: 22, shirtColor: 0x06b6d4, pantsColor: 0x1e293b, hairColor: 0x9a3412, hasVisorHat: false, voicePitch: 1.16 },
                { name: "Grid Operator Ben", role: "Power Crew", x: -1155, z: -15, patrolR: 20, shirtColor: 0xeab308, pantsColor: 0x1e3a8a, hairColor: 0x451a03, hasVisorHat: true, voicePitch: 0.98 },
                // North Observatory Citizens
                { name: "Ranger Taylor", role: "Forest Ranger", x: -25, z: -1090, patrolR: 24, shirtColor: 0x15803d, pantsColor: 0x451a03, hairColor: 0x78350f, hasVisorHat: true, voicePitch: 1.02 },
                { name: "Astronomer Lin", role: "Sky Watcher", x: 35, z: -1125, patrolR: 22, shirtColor: 0x8b5cf6, pantsColor: 0x1e293b, hairColor: 0x0f172a, hasVisorHat: false, voicePitch: 1.15 },
                { name: "Outpost Medic Noah", role: "North Rescue", x: -60, z: -1140, patrolR: 20, shirtColor: 0xef4444, pantsColor: 0xf8fafc, hairColor: 0xb45309, hasVisorHat: true, voicePitch: 1.0 },
                // Highway & Landmark Outposts
                { name: "Lighthouse Keeper Gus", role: "East Coast Watch", x: 1135, z: 42, patrolR: 18, shirtColor: 0xfacc15, pantsColor: 0x1e293b, hairColor: 0xcbd5e1, hasVisorHat: true, voicePitch: 0.88 },
                { name: "Geologist Sofia", role: "Volcano Monitor", x: -580, z: -580, patrolR: 24, shirtColor: 0xf97316, pantsColor: 0x334155, hairColor: 0x451a03, hasVisorHat: true, voicePitch: 1.12 },
                { name: "Comms Tech Ryan", role: "Sky Array Crew", x: 690, z: -690, patrolR: 22, shirtColor: 0x38bdf8, pantsColor: 0x0f172a, hairColor: 0x78350f, hasVisorHat: true, voicePitch: 1.04 },
                { name: "Officer Jerry", role: "Highway Patrol", x: 12, z: 375, patrolR: 20, shirtColor: 0x2563eb, pantsColor: 0x0f172a, hairColor: 0x451a03, hasVisorHat: true, voicePitch: 0.96 }
            ];

            humanConfigs.forEach((cfg, idx) => {
                if (cfg.name === "uxley Prescott") cfg.name = "Huxley Prescott";
                const rig = createHumanNPCMesh(cfg);
                const gy = getTerrainHeight(cfg.x, cfg.z);
                rig.root.position.set(cfg.x, gy, cfg.z);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(rig.root);

                humanNPCs.push({
                    isHuman: true,
                    name: cfg.name,
                    role: cfg.role,
                    homeX: cfg.x,
                    homeZ: cfg.z,
                    x: cfg.x,
                    y: gy,
                    z: cfg.z,
                    patrolR: cfg.patrolR,
                    phase: idx * 1.35,
                    speed: 3.4 + (idx % 3) * 0.65,
                    heading: 0,
                    waveTimer: 0,
                    voicePitch: cfg.voicePitch,
                    lastSpokeTime: -99,
                    rig
                });
            });

            // 2. Spawn 28 Civilian Vehicle NPCs driving around Griffin Island's Highways
            const vehiclePalette = [
                0xef4444, 0x3b82f6, 0xeab308, 0x10b981, 0xa855f7,
                0xf97316, 0x06b6d4, 0xec4899, 0x84cc16, 0x6366f1
            ];
            const vehicleTypes = ['SEDAN', 'PICKUP', 'VAN', 'BUS'];
            const driverNames = [
                "Island Commuter", "Delivery Van Driver", "Harbor Shuttle", "Griffin Tour Bus",
                "Town Cruiser", "Tech Park Courier", "Observatory Van", "Coastal Pickup",
                "Island Taxi", "Bakery Delivery", "Science Shuttle", "Beach Cruiser"
            ];

            // 10 Vehicles on Inner Ring Highway (5 CW, 5 CCW)
            for (let i = 0; i < 10; i++) {
                const vType = vehicleTypes[i % vehicleTypes.length];
                const color = vehiclePalette[i % vehiclePalette.length];
                const meshData = createCivilianVehicleMesh(vType, color);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(meshData.root);
                const dir = i % 2 === 0 ? 1 : -1;
                const laneOffset = dir > 0 ? 6.0 : -6.0;
                const spec = CIVILIAN_VEHICLE_SPECS[vType];
                const cruiseSpd = 24 + (i % 4) * 3.5;
                vehicleNPCs.push({
                    isVehicle: true,
                    name: driverNames[i % driverNames.length],
                    role: "Inner Highway Driver",
                    vType,
                    mass: spec.mass,
                    halfWidth: spec.halfWidth,
                    halfLength: spec.halfLength,
                    routeType: 'INNER_RING',
                    theta: (i / 10) * Math.PI * 2,
                    dir,
                    laneOffset,
                    baseLaneOffset: laneOffset,
                    speed: cruiseSpd,
                    cruiseSpeed: cruiseSpd,
                    currentSpeed: cruiseSpd,
                    targetSpeed: cruiseSpd,
                    isBraking: false,
                    stoppedTimer: 0,
                    honkCooldown: 0,
                    x: 0, y: 4, z: 0,
                    heading: 0,
                    voicePitch: 0.95 + (i % 5) * 0.05,
                    lastSpokeTime: -99,
                    root: meshData.root,
                    wheels: meshData.wheels,
                    headlights: meshData.headlights,
                    taillights: meshData.taillights,
                    beamGroup: meshData.beamGroup
                });
            }

            // 12 Vehicles on Outer Coastal Ring Highway (6 CW, 6 CCW)
            for (let i = 0; i < 12; i++) {
                const vType = vehicleTypes[(i + 1) % vehicleTypes.length];
                const color = vehiclePalette[(i + 3) % vehiclePalette.length];
                const meshData = createCivilianVehicleMesh(vType, color);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(meshData.root);
                const dir = i % 2 === 0 ? 1 : -1;
                const laneOffset = dir > 0 ? 6.5 : -6.5;
                const spec = CIVILIAN_VEHICLE_SPECS[vType];
                const cruiseSpd = 32 + (i % 4) * 4.0;
                vehicleNPCs.push({
                    isVehicle: true,
                    name: driverNames[(i + 4) % driverNames.length],
                    role: "Coastal Highway Driver",
                    vType,
                    mass: spec.mass,
                    halfWidth: spec.halfWidth,
                    halfLength: spec.halfLength,
                    routeType: 'OUTER_RING',
                    theta: (i / 12) * Math.PI * 2,
                    dir,
                    laneOffset,
                    baseLaneOffset: laneOffset,
                    speed: cruiseSpd,
                    cruiseSpeed: cruiseSpd,
                    currentSpeed: cruiseSpd,
                    targetSpeed: cruiseSpd,
                    isBraking: false,
                    stoppedTimer: 0,
                    honkCooldown: 0,
                    x: 0, y: 4, z: 0,
                    heading: 0,
                    voicePitch: 0.94 + (i % 5) * 0.05,
                    lastSpokeTime: -99,
                    root: meshData.root,
                    wheels: meshData.wheels,
                    headlights: meshData.headlights,
                    taillights: meshData.taillights,
                    beamGroup: meshData.beamGroup
                });
            }

            // 6 Vehicles on Grand North-South & East-West Highways
            for (let i = 0; i < 6; i++) {
                const vType = vehicleTypes[(i + 2) % vehicleTypes.length];
                const color = vehiclePalette[(i + 5) % vehiclePalette.length];
                const meshData = createCivilianVehicleMesh(vType, color);
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(meshData.root);
                const isNS = i < 3;
                const spec = CIVILIAN_VEHICLE_SPECS[vType];
                const cruiseSpd = 28 + (i % 3) * 4.5;
                vehicleNPCs.push({
                    isVehicle: true,
                    name: driverNames[(i + 7) % driverNames.length],
                    role: isNS ? "North-South Express" : "East-West Express",
                    vType,
                    mass: spec.mass,
                    halfWidth: spec.halfWidth,
                    halfLength: spec.halfLength,
                    routeType: isNS ? 'NS_HIGHWAY' : 'EW_HIGHWAY',
                    progress: -950 + (i % 3) * 850,
                    dir: i % 2 === 0 ? 1 : -1,
                    laneOffset: 5.8,
                    baseLaneOffset: 5.8,
                    speed: cruiseSpd,
                    cruiseSpeed: cruiseSpd,
                    currentSpeed: cruiseSpd,
                    targetSpeed: cruiseSpd,
                    isBraking: false,
                    stoppedTimer: 0,
                    honkCooldown: 0,
                    x: 0, y: 4, z: 0,
                    heading: 0,
                    voicePitch: 0.98 + (i % 4) * 0.05,
                    lastSpokeTime: -99,
                    root: meshData.root,
                    wheels: meshData.wheels,
                    headlights: meshData.headlights,
                    taillights: meshData.taillights,
                    beamGroup: meshData.beamGroup
                });
            }

            // Sync NPC headlights with initial active weather mode
            const curMode = (WEATHER_MODES && WEATHER_MODES[currentWeatherIdx]) || (WEATHER_MODES && WEATHER_MODES[0]) || { headlightIntensity: 0 };
            setCivilianVehicleHeadlights(curMode.headlightIntensity > 0);
        }

        export function updateLivingWorldNPCs(dt, now) {
            const nowSec = now * 0.001;

            // 1. Update Human Citizens (Patrol sidewalks, wave at Rescue Bot, and speak when approached)
            for (let i = 0; i < humanNPCs.length; i++) {
                const npc = humanNPCs[i];
                const distToPlayer = Math.hypot(player.pos.x - npc.x, player.pos.z - npc.z);

                if (npc.waveTimer > 0) npc.waveTimer = Math.max(0, npc.waveTimer - dt);

                if (distToPlayer < 22.0) {
                    // Stop walking, face the Rescue Bot, and wave!
                    const targetYaw = Math.atan2(player.pos.x - npc.x, player.pos.z - npc.z);
                    npc.heading = targetYaw;
                    npc.rig.root.rotation.y = npc.heading;

                    // Enthusiastic right-arm wave animation
                    npc.rig.rightArmPivot.rotation.x = -Math.PI * 0.78;
                    npc.rig.rightArmPivot.rotation.z = Math.sin(nowSec * 10.0) * 0.38 - 0.25;
                    npc.rig.leftArmPivot.rotation.x = 0;
                    npc.rig.leftLegPivot.rotation.x = 0;
                    npc.rig.rightLegPivot.rotation.x = 0;

                    if (distToPlayer < 14.5) {
                        speakClosestDisasterForNPC(npc, false);
                    }
                } else {
                    // Stroll along a gentle figure-8 / circular plaza sidewalk path
                    npc.phase += (npc.speed / Math.max(8, npc.patrolR)) * dt;
                    const nextX = npc.homeX + Math.cos(npc.phase) * npc.patrolR;
                    const nextZ = npc.homeZ + Math.sin(npc.phase * 2) * (npc.patrolR * 0.55);
                    const dx = nextX - npc.x;
                    const dz = nextZ - npc.z;
                    if (Math.hypot(dx, dz) > 0.001) {
                        npc.heading = Math.atan2(dx, dz);
                    }
                    npc.x = nextX;
                    npc.z = nextZ;
                    npc.y = Math.max(0.2, getTerrainHeight(npc.x, npc.z));
                    npc.rig.root.position.set(npc.x, npc.y, npc.z);
                    npc.rig.root.rotation.y = npc.heading;

                    // Walking arm & leg swing
                    const walkSwing = Math.sin(nowSec * 6.5 + i) * 0.55;
                    npc.rig.leftLegPivot.rotation.x = walkSwing;
                    npc.rig.rightLegPivot.rotation.x = -walkSwing;
                    npc.rig.leftArmPivot.rotation.x = -walkSwing * 0.75;
                    npc.rig.rightArmPivot.rotation.x = walkSwing * 0.75;
                    npc.rig.rightArmPivot.rotation.z = 0;
                }

                // Spin floating radio crystal above NPC head
                npc.rig.radioGem.rotation.y += dt * 2.6;
                npc.rig.radioGem.position.y = 4.85 + Math.sin(nowSec * 3.5 + i) * 0.22;
            }

            // 1B. Update Stranded Citizens at the 8 Emergency Sites (Wave both arms & call out for rescue in English!)
            for (let bIdx = 0; bIdx < beacons.length; bIdx++) {
                const b = beacons[bIdx];
                if (!b.strandedCitizens) continue;
                const distToSite = Math.hypot(player.pos.x - b.x, player.pos.z - b.z);

                for (let cIdx = 0; cIdx < b.strandedCitizens.length; cIdx++) {
                    const sc = b.strandedCitizens[cIdx];
                    const targetYaw = Math.atan2(player.pos.x - sc.x, player.pos.z - sc.z);
                    sc.rig.root.rotation.y = targetYaw;

                    if (!b.restored) {
                        // Frantic two-handed overhead SOS wave & distress hop!
                        const waveOsc = Math.sin(nowSec * 12.0 + cIdx * 1.8) * 0.42;
                        sc.rig.leftArmPivot.rotation.x = -Math.PI * 0.84;
                        sc.rig.rightArmPivot.rotation.x = -Math.PI * 0.84;
                        sc.rig.leftArmPivot.rotation.z = waveOsc + 0.25;
                        sc.rig.rightArmPivot.rotation.z = -waveOsc - 0.25;
                        sc.rig.root.position.y = sc.y + Math.abs(Math.sin(nowSec * 7.5 + cIdx)) * 0.42;

                        // Pulse red/amber SOS distress gem
                        sc.rig.radioGem.rotation.y += dt * 5.0;
                        sc.rig.radioGem.scale.setScalar(1.0 + Math.sin(nowSec * 10.0) * 0.25);

                        // Call out for help in English when the Rescue Bot approaches within 36m!
                        if (distToSite < 36.0 && cIdx === 0 && (nowSec - sc.lastCallTime > 20.0)) {
                            if (triggerNPCSpeech(sc.name, sc.role, sc.helpCall, sc, false)) {
                                sc.lastCallTime = nowSec;
                            }
                        }
                    } else {
                        // Rescued! Happy celebration wave & green gem!
                        sc.rig.leftArmPivot.rotation.x = 0;
                        sc.rig.leftArmPivot.rotation.z = 0;
                        sc.rig.rightArmPivot.rotation.x = -Math.PI * 0.78;
                        sc.rig.rightArmPivot.rotation.z = Math.sin(nowSec * 8.0 + cIdx) * 0.35 - 0.2;
                        sc.rig.root.position.y = sc.y;
                        sc.rig.radioGem.rotation.y += dt * 2.5;
                        sc.rig.radioGem.scale.setScalar(1.0);
                    }
                }
            }

            // 2. Update Civilian Vehicles along Inner Ring, Outer Ring, N-S, and E-W Highways
            for (let i = 0; i < vehicleNPCs.length; i++) {
                const v = vehicleNPCs[i];
                const distToPlayer = Math.hypot(player.pos.x - v.x, player.pos.z - v.z);

                if (v.honkCooldown > 0) v.honkCooldown = Math.max(0, v.honkCooldown - dt);

                // Dynamic Siren Response & Polite Shoulder Pull-Over
                const isSirenOn = !!(player.sirenActive || player.boostTimer > 0);
                const inSirenRange = isSirenOn && distToPlayer < 95.0;

                // When siren sounds, vehicles steer toward the outer road shoulder
                const baseOffset = v.baseLaneOffset || v.laneOffset;
                const shoulderOffset = baseOffset > 0 ? baseOffset + 3.2 : baseOffset - 3.2;
                const targetOffset = inSirenRange ? shoulderOffset : baseOffset;
                v.laneOffset = THREE.MathUtils.lerp(v.laneOffset, targetOffset, Math.min(1.0, dt * 2.5));

                // FORWARD FOLLOW-DISTANCE & OBSTACLE DETECTION (Other vehicles, traffic queue, or player in lane)
                const fwdX = Math.sin(v.heading);
                const fwdZ = Math.cos(v.heading);
                const rightX = Math.cos(v.heading);
                const rightZ = -Math.sin(v.heading);

                let closestClearDist = Infinity;

                // Check against other civilian vehicles ahead in the lane corridor
                for (let j = 0; j < vehicleNPCs.length; j++) {
                    if (i === j) continue;
                    const o = vehicleNPCs[j];
                    const odx = o.x - v.x;
                    const odz = o.z - v.z;
                    if (odx * odx + odz * odz > 1024) continue; // > 32m away

                    const odFwd = odx * fwdX + odz * fwdZ;
                    if (odFwd <= 0 || odFwd > 30.0) continue; // Must be ahead and within 30m

                    const odLat = Math.abs(odx * rightX + odz * rightZ);
                    const corridorLimit = (v.halfWidth || 1.8) + (o.halfWidth || 1.8) + 1.1;
                    if (odLat < corridorLimit) {
                        const clearDist = odFwd - ((v.halfLength || 3.3) + (o.halfLength || 3.3));
                        if (clearDist < closestClearDist) {
                            closestClearDist = clearDist;
                        }
                    }
                }

                // Check against active Railroad Crossings on NS / EW Highways
                if ((v.routeType === 'NS_HIGHWAY' || v.routeType === 'EW_HIGHWAY') && typeof railroadCrossings !== 'undefined') {
                    for (let cIdx = 0; cIdx < railroadCrossings.length; cIdx++) {
                        const rc = railroadCrossings[cIdx];
                        if (!rc.isFlashing) continue;
                        const isHighwayMatch = (v.routeType === 'NS_HIGHWAY' && rc.isNSHighway) || (v.routeType === 'EW_HIGHWAY' && !rc.isNSHighway);
                        if (!isHighwayMatch) continue;

                        const rcdx = rc.x - v.x;
                        const rcdz = rc.z - v.z;
                        const rcFwd = rcdx * fwdX + rcdz * fwdZ;
                        if (rcFwd > 0 && rcFwd < 32.0) {
                            const stopDist = Math.max(0, rcFwd - 12.0);
                            if (stopDist < closestClearDist) {
                                closestClearDist = stopDist;
                            }
                        }
                    }
                }

                // Check against player if player is on or near the roadway
                const playerGroundY = getSurfaceHeight(player.pos.x, player.pos.z);
                const playerClearance = player.pos.y - playerGroundY;
                if (!player.inCrane && playerClearance < 6.0 && Math.abs(player.pos.y - v.y) < 5.0) {
                    const pdx = player.pos.x - v.x;
                    const pdz = player.pos.z - v.z;
                    if (pdx * pdx + pdz * pdz < 1024) {
                        const pdFwd = pdx * fwdX + pdz * fwdZ;
                        if (pdFwd > 0 && pdFwd < 30.0) {
                            const pdLat = Math.abs(pdx * rightX + pdz * rightZ);
                            const pOBB = getPlayerOBB();
                            const pCorridorLimit = (v.halfWidth || 1.8) + pOBB.halfWidth + 1.1;
                            if (pdLat < pCorridorLimit) {
                                const pClearDist = pdFwd - ((v.halfLength || 3.3) + pOBB.halfLength);
                                if (pClearDist < closestClearDist) {
                                    closestClearDist = pClearDist;
                                }
                            }
                        }
                    }
                }

                // Calculate target speed factor based on follow distance & emergency sirens
                let targetFactor = 1.0;
                if (closestClearDist <= 4.8) {
                    // Standoff buffer: come to a smooth, complete halt behind vehicle/player
                    targetFactor = 0.0;
                } else if (closestClearDist < 18.0) {
                    // Smooth linear deceleration curve into following distance
                    targetFactor = (closestClearDist - 4.8) / (18.0 - 4.8);
                } else {
                    targetFactor = 1.0;
                }

                if (inSirenRange) {
                    const sirenFactor = distToPlayer < 70.0 ? 0.0 : 0.35;
                    targetFactor = Math.min(targetFactor, sirenFactor);
                }

                const baseSpd = v.cruiseSpeed || v.speed || 24;
                v.targetSpeed = baseSpd * targetFactor;
                if (v.currentSpeed === undefined) v.currentSpeed = baseSpd;

                // Braking decelerates faster than cruising acceleration
                const accelRate = (v.targetSpeed < v.currentSpeed) ? 5.5 : 2.2;
                v.currentSpeed = THREE.MathUtils.lerp(v.currentSpeed, v.targetSpeed, Math.min(1.0, dt * accelRate));
                if (v.currentSpeed < 0.05) v.currentSpeed = 0.0;

                v.isBraking = (v.targetSpeed < baseSpd * 0.85) || (v.currentSpeed < 1.0);

                // Polite honk when stalled in traffic for more than 3.2 seconds
                if (v.currentSpeed < 0.5 && closestClearDist < 12.0) {
                    v.stoppedTimer = (v.stoppedTimer || 0) + dt;
                    if (v.stoppedTimer > 3.2 && (v.honkCooldown || 0) <= 0) {
                        v.stoppedTimer = 0;
                        v.honkCooldown = 7.0 + Math.random() * 5.0;
                        if (sfx.playCarHonk && distToPlayer < 90.0) {
                            sfx.playCarHonk(v.voicePitch || 1.0);
                        }
                    }
                } else {
                    v.stoppedTimer = 0;
                }

                // Taillights illumination (bright red when braking or stopped; hazard flashing during siren yield)
                const isNightOrDark = (WEATHER_MODES && WEATHER_MODES[currentWeatherIdx] ? WEATHER_MODES[currentWeatherIdx].headlightIntensity : 0) > 0;
                if (v.taillights) {
                    for (let t = 0; t < v.taillights.length; t++) {
                        if (inSirenRange) {
                            const hazardOn = Math.floor(now / 220) % 2 === 0;
                            v.taillights[t].material = hazardOn ? matNPCTaillightOn : matNPCTaillightOff;
                        } else if (v.isBraking || isNightOrDark) {
                            v.taillights[t].material = matNPCTaillightOn;
                        } else {
                            v.taillights[t].material = matNPCTaillightOff;
                        }
                    }
                }

                if (distToPlayer < 16.5 && Math.abs(player.speed) < 25) {
                    speakClosestDisasterForNPC(v, false);
                }

                const effSpeed = v.currentSpeed;

                if (v.routeType === 'INNER_RING' || v.routeType === 'OUTER_RING') {
                    const baseR = v.routeType === 'INNER_RING' ? getInnerRoadRadius(v.theta) : getOuterRoadRadius(v.theta);
                    const laneR = baseR + v.laneOffset;
                    const dTheta = (effSpeed / Math.max(120, laneR)) * v.dir * dt;
                    v.theta = (v.theta + dTheta) % (Math.PI * 2);

                    const nextTheta = v.theta + 0.03 * v.dir;
                    const nextBaseR = v.routeType === 'INNER_RING' ? getInnerRoadRadius(nextTheta) : getOuterRoadRadius(nextTheta);
                    const nextR = nextBaseR + v.laneOffset;

                    const curX = Math.cos(v.theta) * laneR;
                    const curZ = Math.sin(v.theta) * laneR;
                    const nxtX = Math.cos(nextTheta) * nextR;
                    const nxtZ = Math.sin(nextTheta) * nextR;

                    v.x = curX;
                    v.z = curZ;
                    v.y = Math.max(0.5, getTerrainHeight(curX, curZ));
                    v.heading = Math.atan2(nxtX - curX, nxtZ - curZ);
                } else if (v.routeType === 'NS_HIGHWAY') {
                    v.progress += effSpeed * v.dir * dt;
                    if (v.progress > 1060) { v.progress = 1060; v.dir = -1; }
                    if (v.progress < -1060) { v.progress = -1060; v.dir = 1; }
                    v.x = v.dir > 0 ? -v.laneOffset : v.laneOffset;
                    v.z = v.progress;
                    v.y = Math.max(0.5, getTerrainHeight(v.x, v.z));
                    v.heading = v.dir > 0 ? 0 : Math.PI;
                } else {
                    // EW_HIGHWAY (along z = 25)
                    v.progress += effSpeed * v.dir * dt;
                    if (v.progress > 1060) { v.progress = 1060; v.dir = -1; }
                    if (v.progress < -1060) { v.progress = -1060; v.dir = 1; }
                    v.x = v.progress;
                    v.z = 25 + (v.dir > 0 ? v.laneOffset : -v.laneOffset);
                    v.y = Math.max(0.5, getTerrainHeight(v.x, v.z));
                    v.heading = v.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
                }

                // Smooth terrain suspension and pitch alignment for civilian traffic
                const vFrontX = v.x + Math.sin(v.heading) * 2.0;
                const vFrontZ = v.z + Math.cos(v.heading) * 2.0;
                const vRearX = v.x - Math.sin(v.heading) * 2.0;
                const vRearZ = v.z - Math.cos(v.heading) * 2.0;
                const vFrontY = Math.max(0.5, getSurfaceHeight(vFrontX, vFrontZ));
                const vRearY = Math.max(0.5, getSurfaceHeight(vRearX, vRearZ));
                const vTargetY = (vFrontY + vRearY) * 0.5;
                v.y = THREE.MathUtils.lerp(v.y || vTargetY, vTargetY, Math.min(1.0, dt * 18.0));
                const vTargetPitch = Math.max(-0.6, Math.min(0.6, Math.atan2(vFrontY - vRearY, 4.0)));
                v.pitch = THREE.MathUtils.lerp(v.pitch || 0, vTargetPitch, Math.min(1.0, dt * 14.0));

                v.root.position.set(v.x, v.y, v.z);
                v.root.rotation.y = v.heading;
                v.root.rotation.x = -v.pitch;

                // Spin wheels when moving
                if (effSpeed > 0.1) {
                    const wheelRot = effSpeed * dt * 1.1;
                    for (let w = 0; w < v.wheels.length; w++) {
                        v.wheels[w].rotation.x += wheelRot;
                    }
                }
            }

            // 2B. Civilian Vehicle vs Civilian Vehicle OBB Physical Separation
            for (let i = 0; i < vehicleNPCs.length; i++) {
                const vA = vehicleNPCs[i];
                for (let j = i + 1; j < vehicleNPCs.length; j++) {
                    const vB = vehicleNPCs[j];
                    const dx = vB.x - vA.x;
                    const dz = vB.z - vA.z;
                    if (dx * dx + dz * dz > 144) continue; // > 12m away

                    const col = testOBBOverlap2D(vA, vB);
                    if (col) {
                        const totalM = (vA.mass || 2000) + (vB.mass || 2000);
                        const wA = (vB.mass || 2000) / totalM;
                        const wB = (vA.mass || 2000) / totalM;

                        vA.x -= col.mtv.x * wA;
                        vA.z -= col.mtv.z * wA;
                        vB.x += col.mtv.x * wB;
                        vB.z += col.mtv.z * wB;

                        vA.root.position.x = vA.x;
                        vA.root.position.z = vA.z;
                        vB.root.position.x = vB.x;
                        vB.root.position.z = vB.z;

                        vA.currentSpeed = Math.max(0, (vA.currentSpeed || 0) * 0.4);
                        vB.currentSpeed = Math.max(0, (vB.currentSpeed || 0) * 0.4);
                        vA.isBraking = true;
                        vB.isBraking = true;
                    }
                }
            }
        }

        export function updateBuddyBotAI(dt, now) {
            if (!buddyBot.botType || buddyBot.botType === player.botType) return;
            const bRig = botRigs[buddyBot.botType];
            if (!bRig) return;

            const isBlades = buddyBot.botType === 'BLADES';
            const isFlying = isBlades && (player.mode === 'VEHICLE' || player.mode === 'DINO');

            // High Tide in water check: Buddy bot must remain stuck safely on dry land!
            const isPlayerHighTideInWater = (
                player.botType === 'HIGHTIDE' &&
                (isPointInWater(player.pos.x, player.pos.z) || player.mode === 'VEHICLE' || player.pos.y < 0.25)
            );

            // Dynamic target formation slot (trails slightly to the rear-left or rear-right of player)
            const followDist = isFlying ? 12.0 : 8.0;
            const sideOffset = -5.0; // Left flank
            let targetX = player.pos.x - Math.sin(player.heading) * followDist - Math.cos(player.heading) * sideOffset;
            let targetZ = player.pos.z - Math.cos(player.heading) * followDist + Math.sin(player.heading) * sideOffset;

            if (isPlayerHighTideInWater) {
                // If formation slot would be in water, lock target to current buddy position on land
                if (isPointInWater(targetX, targetZ) || getSurfaceHeight(targetX, targetZ) < 0.35) {
                    targetX = buddyBot.pos.x;
                    targetZ = buddyBot.pos.z;
                }
            }

            const dx = targetX - buddyBot.pos.x;
            const dz = targetZ - buddyBot.pos.z;
            const distToSlot = Math.hypot(dx, dz);
            const distToPlayer = Math.hypot(player.pos.x - buddyBot.pos.x, player.pos.z - buddyBot.pos.z);

            // Turn smoothly toward formation slot or face player out in water
            if (isPlayerHighTideInWater) {
                // Turn to face High Tide out in the ocean and watch from the shore
                const lookAngle = Math.atan2(player.pos.x - buddyBot.pos.x, player.pos.z - buddyBot.pos.z);
                let diff = lookAngle - buddyBot.heading;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                buddyBot.heading += Math.sign(diff) * Math.min(Math.abs(diff), 4.5 * dt);
            } else if (distToSlot > 1.2) {
                const desiredHeading = Math.atan2(dx, dz);
                let diff = desiredHeading - buddyBot.heading;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                buddyBot.heading += Math.sign(diff) * Math.min(Math.abs(diff), 5.5 * dt);
            } else {
                let diff = player.heading - buddyBot.heading;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                buddyBot.heading += Math.sign(diff) * Math.min(Math.abs(diff), 4.0 * dt);
            }

            // Speed matching with rubber-banding so Buddy never gets lost
            let targetSpeed = 0;
            if (isPlayerHighTideInWater) {
                targetSpeed = 0;
            } else if (distToSlot > 1.5) {
                const catchupMult = distToSlot > 25 ? 1.75 : (distToSlot > 12 ? 1.35 : 1.05);
                targetSpeed = Math.max(player.speed * catchupMult, Math.min(75, distToSlot * 4.0));
            } else if (Math.abs(player.speed) > 1.0) {
                targetSpeed = player.speed;
            }

            // If player boosted ahead, give Buddy a burst
            if (player.boostTimer > 0 || player.energonBoostTimer > 0) {
                if (!isPlayerHighTideInWater) targetSpeed = Math.max(targetSpeed, 65);
            }

            buddyBot.speed = THREE.MathUtils.lerp(buddyBot.speed, targetSpeed, Math.min(1, dt * 7.0));

            // Articulated Semi-Trailer Kinematics (Buddy Bot Mega Optimus)
            if (buddyBot.trailerAngle === undefined) {
                buddyBot.trailerAngle = buddyBot.heading;
            }
            if (buddyBot.botType === 'OPTIMUS' && (buddyBot.targetMorph > 0.1 || buddyBot.morph > 0.1)) {
                const L = 8.5;
                let bHeadingDiff = buddyBot.heading - buddyBot.trailerAngle;
                while (bHeadingDiff < -Math.PI) bHeadingDiff += Math.PI * 2;
                while (bHeadingDiff > Math.PI) bHeadingDiff -= Math.PI * 2;

                const bTurnStep = (buddyBot.speed / L) * Math.sin(bHeadingDiff) * dt;
                buddyBot.trailerAngle += bTurnStep;

                let bArtic = buddyBot.trailerAngle - buddyBot.heading;
                while (bArtic < -Math.PI) bArtic += Math.PI * 2;
                while (bArtic > Math.PI) bArtic -= Math.PI * 2;

                const maxArtic = 1.25;
                if (bArtic > maxArtic) {
                    bArtic = maxArtic;
                    buddyBot.trailerAngle = buddyBot.heading + maxArtic;
                } else if (bArtic < -maxArtic) {
                    bArtic = -maxArtic;
                    buddyBot.trailerAngle = buddyBot.heading - maxArtic;
                }

                buddyBot.trailerArticAngle = bArtic;
            } else {
                buddyBot.trailerAngle = THREE.MathUtils.lerp(buddyBot.trailerAngle ?? buddyBot.heading, buddyBot.heading, Math.min(1.0, dt * 6.0));
                buddyBot.trailerArticAngle = THREE.MathUtils.lerp(buddyBot.trailerArticAngle ?? 0, 0, Math.min(1.0, dt * 6.0));
            }

            const nextBx = buddyBot.pos.x + Math.sin(buddyBot.heading) * buddyBot.speed * dt;
            const nextBz = buddyBot.pos.z + Math.cos(buddyBot.heading) * buddyBot.speed * dt;
            const nextInWater = isPointInWater(nextBx, nextBz) || getSurfaceHeight(nextBx, nextBz) < 0.45;

            // Instant rescue teleport catch-up if separated by >160m (keeps it 100% kid-friendly and frustration-free)
            if (distToPlayer > 160) {
                if (!isPlayerHighTideInWater) {
                    buddyBot.pos.set(targetX, player.pos.y, targetZ);
                    buddyBot.heading = player.heading;
                    buddyBot.speed = player.speed;
                } else {
                    buddyBot.speed = 0;
                }
            } else if (isPlayerHighTideInWater) {
                if (nextInWater) {
                    buddyBot.speed = 0;
                } else {
                    buddyBot.pos.x = nextBx;
                    buddyBot.pos.z = nextBz;
                }
            } else {
                buddyBot.pos.x = nextBx;
                buddyBot.pos.z = nextBz;
            }

            // If buddy bot ever gets caught in water while High Tide is in ocean, gently steer buddy up onto dry land
            if (isPlayerHighTideInWater && (isPointInWater(buddyBot.pos.x, buddyBot.pos.z) || getSurfaceHeight(buddyBot.pos.x, buddyBot.pos.z) < 0.35)) {
                const testAngles = [0, Math.PI * 0.5, Math.PI, -Math.PI * 0.5, Math.PI * 0.25, -Math.PI * 0.25, Math.PI * 0.75, -Math.PI * 0.75];
                let bestH = -999;
                let bestDx = 0, bestDz = 0;
                for (let a = 0; a < testAngles.length; a++) {
                    const tx = buddyBot.pos.x + Math.sin(testAngles[a]) * 6.0;
                    const tz = buddyBot.pos.z + Math.cos(testAngles[a]) * 6.0;
                    const h = getSurfaceHeight(tx, tz);
                    if (h > bestH) {
                        bestH = h;
                        bestDx = Math.sin(testAngles[a]);
                        bestDz = Math.cos(testAngles[a]);
                    }
                }
                buddyBot.pos.x += bestDx * 6.0 * dt;
                buddyBot.pos.z += bestDz * 6.0 * dt;
            }

            // Shore Watch Dialogue when player enters water with High Tide
            if (isPlayerHighTideInWater) {
                if (!buddyBot.lastShoreWatchTime || now - buddyBot.lastShoreWatchTime > 26000) {
                    buddyBot.lastShoreWatchTime = now;
                    const bMeta = BOT_METADATA[buddyBot.botType];
                    const shoreQuotes = [
                        `I can't swim! I'll keep watch from the shore, High Tide!`,
                        `Holding down the fort on land! Be careful in deep water, High Tide!`,
                        `Standing by on the beach! Griffin Rock coastline is secure!`
                    ];
                    const quote = shoreQuotes[Math.floor(Math.random() * shoreQuotes.length)];
                    triggerNPCSpeech(bMeta.name, "Shore Watch", quote, buddyBot, false);
                }
            }

            // Sample terrain for buddy bot smooth suspension & pitch/roll
            const buddyScale = getBotScale(buddyBot.botType);
            const bSinH = Math.sin(buddyBot.heading);
            const bCosH = Math.cos(buddyBot.heading);
            const bFx = buddyBot.pos.x + bSinH * (2.2 * buddyScale);
            const bFz = buddyBot.pos.z + bCosH * (2.2 * buddyScale);
            const bRx = buddyBot.pos.x - bSinH * (2.2 * buddyScale);
            const bRz = buddyBot.pos.z - bCosH * (2.2 * buddyScale);
            const bFrontY = Math.max(0.0, getSurfaceHeight(bFx, bFz));
            const bRearY = Math.max(0.0, getSurfaceHeight(bRx, bRz));
            const bLeftY = Math.max(0.0, getSurfaceHeight(buddyBot.pos.x - bCosH * (1.3 * buddyScale), buddyBot.pos.z + bSinH * (1.3 * buddyScale)));
            const bRightY = Math.max(0.0, getSurfaceHeight(buddyBot.pos.x + bCosH * (1.3 * buddyScale), buddyBot.pos.z - bSinH * (1.3 * buddyScale)));
            const bCenterY = Math.max(0.0, getSurfaceHeight(buddyBot.pos.x, buddyBot.pos.z));
            const bTargetGroundY = Math.max((bFrontY + bRearY) * 0.5, bCenterY);

            const bTargetPitch = Math.max(-0.7, Math.min(0.7, Math.atan2(bFrontY - bRearY, 4.4 * buddyScale)));
            const bTargetRoll = Math.max(-0.45, Math.min(0.45, Math.atan2(bRightY - bLeftY, 2.6 * buddyScale)));
            buddyBot.pitch = THREE.MathUtils.lerp(buddyBot.pitch || 0, bTargetPitch, Math.min(1.0, dt * 14.0));
            buddyBot.roll = THREE.MathUtils.lerp(buddyBot.roll || 0, bTargetRoll, Math.min(1.0, dt * 14.0));

            const isHighTideBuddyWaterMode = (buddyBot.botType === 'HIGHTIDE' && (buddyBot.targetMorph > 0.5 || buddyBot.targetDinoMorph > 0.5));
            if (isFlying && !isPlayerHighTideInWater) {
                const targetAlt = Math.max(14, player.flightAlt + Math.sin(now * 0.003) * 1.5);
                buddyBot.pos.y = THREE.MathUtils.lerp(buddyBot.pos.y, bCenterY + targetAlt, Math.min(1.0, dt * 4.5));
            } else if (isHighTideBuddyWaterMode && isPointInWater(buddyBot.pos.x, buddyBot.pos.z)) {
                const subSwell = Math.sin(now * 0.003 + 1.2) * 0.12;
                const waterTargetY = -0.45 - (buddyBot.targetDinoMorph > 0.5 ? 0.35 : 0.22) + subSwell;
                buddyBot.pos.y = THREE.MathUtils.lerp(buddyBot.pos.y, waterTargetY, Math.min(1.0, dt * 16.0));
            } else {
                buddyBot.pos.y = THREE.MathUtils.lerp(buddyBot.pos.y, Math.max(0.5, bTargetGroundY), Math.min(1.0, dt * 20.0));
            }

            if (Math.abs(buddyBot.speed) > 0.4) {
                buddyBot.walkCycle += dt * Math.abs(buddyBot.speed) * 0.55;
            }

            // Autonomous Buddy Rescue Assistance at Emergency Sites!
            if (buddyBot.actionCooldown > 0) {
                buddyBot.actionCooldown -= dt;
            }
            if (buddyBot.smashTimer > 0) buddyBot.smashTimer = Math.max(0, buddyBot.smashTimer - dt);
            if (buddyBot.scoopTimer > 0) buddyBot.scoopTimer = Math.max(0, buddyBot.scoopTimer - dt);
            if (buddyBot.waterTimer > 0) {
                buddyBot.waterTimer = Math.max(0, buddyBot.waterTimer - dt);
                if (buddyBot.botType === 'HEATWAVE') {
                    spawnWaterCannonStream(bRig, new THREE.Vector3(buddyBot.pos.x, buddyBot.pos.y + 3.2, buddyBot.pos.z), buddyBot.heading);
                }
            }

            // Find nearest uncleared hazard node to the Buddy Bot
            let nearestHazard = null;
            let nearestDist = 20.0;
            let targetBeacon = null;
            for (let bIdx = 0; bIdx < beacons.length; bIdx++) {
                const b = beacons[bIdx];
                if (b.restored) continue;
                for (let nIdx = 0; nIdx < b.nodes.length; nIdx++) {
                    const n = b.nodes[nIdx];
                    if (n.cleared) continue;
                    const d = Math.hypot(buddyBot.pos.x - n.x, buddyBot.pos.z - n.z);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearestHazard = n;
                        targetBeacon = b;
                    }
                }
            }

            // Buddy uses their signature powers when near an emergency!
            if (nearestHazard && buddyBot.actionCooldown <= 0) {
                buddyBot.actionCooldown = 1.6;
                if (buddyBot.botType === 'HEATWAVE') {
                    buddyBot.waterTimer = 1.4;
                    sfx.playWaterSpray();
                    clearHazardNode(targetBeacon, nearestHazard);
                } else if (buddyBot.botType === 'BOULDER') {
                    buddyBot.scoopTimer = 0.8;
                    buddyBot.smashTimer = 0.4;
                    sfx.playSmash();
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0xfacc15, 8, 1.1);
                } else if (buddyBot.botType === 'CHASE') {
                    buddyBot.smashTimer = 0.4;
                    sfx.playSirenPulse();
                    clearHazardNode(targetBeacon, nearestHazard);
                } else if (buddyBot.botType === 'BLADES') {
                    buddyBot.smashTimer = 0.4;
                    sfx.playSmash();
                    clearHazardNode(targetBeacon, nearestHazard);
                } else if (buddyBot.botType === 'OPTIMUS') {
                    buddyBot.smashTimer = 0.55;
                    if (player.mode === 'DINO') {
                        sfx.playDinoRoar('OPTIMUS');
                    } else {
                        sfx.playSmash();
                    }
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0xdc2626, 12, 1.3);
                } else if (buddyBot.botType === 'BUMBLEBEE') {
                    buddyBot.smashTimer = 0.45;
                    if (player.mode === 'DINO') sfx.playDinoRoar('BUMBLEBEE');
                    else sfx.playStuntChime();
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0xfacc15, 12, 1.2);
                } else if (buddyBot.botType === 'BLURR') {
                    buddyBot.smashTimer = 0.45;
                    if (player.mode === 'DINO') sfx.playDinoRoar('BLURR');
                    else sfx.playStuntChime();
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0xa855f7, 12, 1.2);
                } else if (buddyBot.botType === 'SALVAGE') {
                    buddyBot.smashTimer = 0.55;
                    if (player.mode === 'DINO') sfx.playDinoRoar('SALVAGE');
                    else sfx.playRockBreak();
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0x84cc16, 12, 1.2);
                } else if (buddyBot.botType === 'HIGHTIDE') {
                    buddyBot.waterTimer = 1.4;
                    if (player.mode === 'DINO') sfx.playDinoRoar('HIGHTIDE');
                    sfx.playWaterSpray();
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0x38bdf8, 12, 1.2);
                } else if (buddyBot.botType === 'QUICKSHADOW') {
                    buddyBot.smashTimer = 0.45;
                    if (player.mode === 'DINO') sfx.playDinoRoar('QUICKSHADOW');
                    else sfx.playStuntChime();
                    clearHazardNode(targetBeacon, nearestHazard);
                    spawnBurstParticles(nearestHazard.x, nearestHazard.y + 1.2, nearestHazard.z, 0x38bdf8, 12, 1.2);
                }
            }
        }

if (typeof window !== 'undefined') {
    window.createHumanNPCMesh = createHumanNPCMesh;
    window.getPlayerOBB = getPlayerOBB;
    window.testOBBOverlap2D = testOBBOverlap2D;
    window.buildLivingWorldNPCs = buildLivingWorldNPCs;
    window.updateLivingWorldNPCs = updateLivingWorldNPCs;
    window.updateBuddyBotAI = updateBuddyBotAI;
    window.setCivilianVehicleHeadlights = setCivilianVehicleHeadlights;
}

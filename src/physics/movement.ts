// Vehicle & Bot Physics, Collision, Helicopter Flight & Waypoint Autopilot
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight, isPointInWater, isNearWater, isPointOnRoad, getZoneName } from '../world/terrain.js';
import { player, buddyBot, botRigs, input, ramps, stateHolder, worldColliders } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { isActionActive } from '../settings/settings.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { spawnBurstParticles, spawnSoapSudsParticles, spawnSparkleGlints, spawnRocketExhaustParticles, spawnDinerFoodParticles, spawnEnergonLightningParticles, spawnWarpVortexParticles, spawnWaterWakeParticles, spawnMagnetSparkParticles, spawnPaintSplatParticles } from '../world/emergencies.js';
import { activeMorBot } from '../world/morbot.js';
import { speakBotCatchphrase } from './player.js';
import { BOT_METADATA } from '../bots/botMeta.js';
import { getPlayerOBB, testOBBOverlap2D } from '../world/npcs.js';

import { humanNPCs, vehicleNPCs } from '../state/gameState.js';
import { beacons, activeParticles } from '../world/emergencies.js';
import { getBotScale } from '../bots/botRigs.js';
import { islandTrain } from '../world/railway.js';
import { sunLight } from '../rendering/scene.js';
import { speakClosestDisasterForNPC } from '../world/npcs.js';
import { triggerPrimaryAction, checkHitMorBotWithSpecialAbility } from './player.js';
import { spawnWaterCannonStream } from '../world/emergencies.js';

const RAINBOW_TRAIL_COLORS = [0xef4444, 0xf97316, 0xfacc15, 0x4ade80, 0x38bdf8, 0xa855f7];
let rainbowTrailIdx = 0;
import { morbotBattle } from '../world/morbot.js';
export let waypointGroup = null;
export let wpOuterRing = null;
export let wpArrowCone = null;

        waypointGroup = new THREE.Group();
        waypointGroup.visible = false;

        wpOuterRing = new THREE.Mesh(
            new THREE.RingGeometry(2.2, 3.3, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
        );
        wpOuterRing.position.y = 0.35;
        waypointGroup.add(wpOuterRing);

        const wpInnerDisk = new THREE.Mesh(
            new THREE.CircleGeometry(1.5, 24).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
        );
        wpInnerDisk.position.y = 0.32;
        waypointGroup.add(wpInnerDisk);

        wpArrowCone = new THREE.Mesh(
            new THREE.ConeGeometry(1.45, 3.2, 12).rotateX(Math.PI),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        wpArrowCone.position.y = 4.2;
        waypointGroup.add(wpArrowCone);

        const wpBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 1.3, 18, 12, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
        );
        wpBeam.position.y = 9.0;
        waypointGroup.add(wpBeam);

        scene.add(waypointGroup);

        // Headlight Spotlights attached to active player & Buddy Bot wingman
        const headlight = new THREE.SpotLight(0xfffbeb, 0, 95, Math.PI / 3.5, 0.45, 1.2);
        scene.add(headlight);
        scene.add(headlight.target);

        const buddyHeadlight = new THREE.SpotLight(0xfffbeb, 0, 80, Math.PI / 3.6, 0.45, 1.2);
        scene.add(buddyHeadlight);
        scene.add(buddyHeadlight.target);

        // Sonar / EMP Shockwave Ring Mesh
        const sonarGeo = new THREE.RingGeometry(1.4, 2.2, 36).rotateX(-Math.PI / 2);
        const sonarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0, side: THREE.DoubleSide });
        const sonarMesh = new THREE.Mesh(sonarGeo, sonarMat);
        scene.add(sonarMesh);

        // Blades' Helicopter Rescue Winch (Retractable Hoist Cable + Rescue Hook & Airlift Basket)
        const winchGroup = new THREE.Group();
        winchGroup.visible = false;
        const winchDrum = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10).rotateZ(Math.PI / 2),
            new THREE.MeshToonMaterial({ color: 0xff6b00, gradientMap: toonGrad3 })
        );
        winchGroup.add(winchDrum);

        const winchCableGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.0, 8);
        winchCableGeo.translate(0, -0.5, 0); // Origin at top of cable so scale.y extends straight down!
        const winchCableMesh = new THREE.Mesh(
            winchCableGeo,
            new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
        );
        winchGroup.add(winchCableMesh);

        const winchHookAssembly = new THREE.Group();
        const winchHarnessRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.25, 0.22, 10, 20).rotateX(Math.PI / 2),
            new THREE.MeshToonMaterial({ color: 0xffbe0b, gradientMap: toonGrad3 })
        );
        const winchHook = new THREE.Mesh(
            new THREE.TorusGeometry(0.55, 0.15, 8, 14, Math.PI * 1.45),
            matChrome
        );
        winchHook.position.y = 0.45;
        const winchGlowRing = new THREE.Mesh(
            new THREE.RingGeometry(1.4, 2.3, 24).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
        );
        winchGlowRing.position.y = -0.15;
        winchHookAssembly.add(winchHarnessRing, winchHook, winchGlowRing);
        winchGroup.add(winchHookAssembly);
        scene.add(winchGroup);

        // Chase's Police Energy Net & Tow Winch Tether
        const energyNetGroup = new THREE.Group();
        energyNetGroup.visible = false;

        const towTetherGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8);
        towTetherGeo.rotateX(Math.PI / 2);
        towTetherGeo.translate(0, 0, 0.5); // Origin at start so lookAt() + scale.z stretches to target!
        const towTetherMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
        const towTetherMesh = new THREE.Mesh(towTetherGeo, towTetherMat);
        energyNetGroup.add(towTetherMesh);

        const energyNetDome = new THREE.Group();
        const netWireMesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(3.4, 1),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.92 })
        );
        const netInnerCore = new THREE.Mesh(
            new THREE.IcosahedronGeometry(3.2, 1),
            new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.26, side: THREE.DoubleSide })
        );
        const netBaseRing = new THREE.Mesh(
            new THREE.RingGeometry(2.8, 3.6, 24).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
        );
        netBaseRing.position.y = 0.2;
        energyNetDome.add(netWireMesh, netInnerCore, netBaseRing);
        energyNetGroup.add(energyNetDome);
        scene.add(energyNetGroup);

        document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
        document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
        document.addEventListener('touchmove', e => {
            if (e.scale !== undefined && e.scale !== 1) e.preventDefault();
        }, { passive: false });

        const raycaster = new THREE.Raycaster();
        const pointerNDC = new THREE.Vector2();
        const fallbackPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4.0);
        const _rayHitPoint = new THREE.Vector3();
        let activePointerDown = false;
        let pointerScreenX = 0;
        let pointerScreenY = 0;
        let lastHoldWaypointTime = 0;

        // Ultra-fast analytical ray-heightfield intersection (~25 math steps vs 131,072 triangle tests on terrainMesh!)
        export function intersectRayWithTerrain(ray, outVec) {
            const ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z;
            const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z;

            // If ray points near or above the horizon, project 95m forward from player
            if (dy >= -0.015) {
                const horizLen = Math.hypot(dx, dz) || 1;
                outVec.set(
                    player.pos.x + (dx / horizLen) * 95,
                    player.pos.y,
                    player.pos.z + (dz / horizLen) * 95
                );
                return outVec;
            }

            // Coarse march along ray from camera to ocean level (y = -2.0), capped at 900m distance
            const maxT = Math.min(900, Math.max(20, (oy - (-2.0)) / (-dy)));
            const steps = 20;
            const dtStep = maxT / steps;
            let prevT = 0;

            for (let i = 1; i <= steps; i++) {
                const t = i * dtStep;
                const rx = ox + dx * t;
                const ry = oy + dy * t;
                const rz = oz + dz * t;
                const th = Math.max(-0.5, getSurfaceHeight(rx, rz));
                if (ry <= th) {
                    // 5-step binary search refinement for exact surface hit
                    let lo = prevT, hi = t;
                    for (let b = 0; b < 5; b++) {
                        const mid = (lo + hi) * 0.5;
                        const my = oy + dy * mid;
                        const mth = Math.max(-0.5, getSurfaceHeight(ox + dx * mid, oz + dz * mid));
                        if (my <= mth) hi = mid;
                        else lo = mid;
                    }
                    const finalT = (lo + hi) * 0.5;
                    outVec.set(ox + dx * finalT, oy + dy * finalT, oz + dz * finalT);
                    return outVec;
                }
                prevT = t;
            }

            // Fallback to horizontal plane intersection if ray didn't cross before maxT
            if (ray.intersectPlane(fallbackPlane, outVec)) {
                return outVec;
            }
            const horizLen = Math.hypot(dx, dz) || 1;
            outVec.set(
                player.pos.x + (dx / horizLen) * 95,
                player.pos.y,
                player.pos.z + (dz / horizLen) * 95
            );
            return outVec;
        }

        export function setDestinationFromScreenPoint(clientX, clientY, playChime = false) {
            pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
            pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(pointerNDC, camera);

            const hitPoint = intersectRayWithTerrain(raycaster.ray, _rayHitPoint);
            if (!hitPoint) return;

            // Clamp within playable 10x island & Wayward Island boundary
            const maxRadius = 1720;
            const r = Math.hypot(hitPoint.x, hitPoint.z);
            const isWayward = Math.hypot(hitPoint.x - 1960, hitPoint.z - 540) < 360 ||
                              (hitPoint.x >= 1120 && hitPoint.x <= 1780 && Math.abs(hitPoint.z - 540) < 40);
            if (!isWayward && r > maxRadius) {
                hitPoint.x = (hitPoint.x / r) * maxRadius;
                hitPoint.z = (hitPoint.z / r) * maxRadius;
            }

            // If child taps near a Human or Vehicle NPC, have that NPC immediately speak the closest disaster location!
            if (playChime) {
                let tappedNPC = null;
                let bestNPCDist = 18.0;
                for (let i = 0; i < humanNPCs.length; i++) {
                    const d = Math.hypot(hitPoint.x - humanNPCs[i].x, hitPoint.z - humanNPCs[i].z);
                    if (d < bestNPCDist) { bestNPCDist = d; tappedNPC = humanNPCs[i]; }
                }
                for (let i = 0; i < vehicleNPCs.length; i++) {
                    const d = Math.hypot(hitPoint.x - vehicleNPCs[i].x, hitPoint.z - vehicleNPCs[i].z);
                    if (d < bestNPCDist) { bestNPCDist = d; tappedNPC = vehicleNPCs[i]; }
                }
                if (tappedNPC) {
                    speakClosestDisasterForNPC(tappedNPC, true);
                } else {
                    for (let bIdx = 0; bIdx < beacons.length; bIdx++) {
                        const b = beacons[bIdx];
                        if (b.strandedCitizens && Math.hypot(hitPoint.x - b.x, hitPoint.z - b.z) < 24.0) {
                            const sc = b.strandedCitizens[0];
                            if (!b.restored) {
                                triggerNPCSpeech(sc.name, sc.role, sc.helpCall, sc, true);
                            } else {
                                const botName = BOT_METADATA[player.botType] ? BOT_METADATA[player.botType].name : player.botType;
                                triggerNPCSpeech(sc.name, "Rescued Citizen", `Thank you, ${botName}! You saved us at the ${b.name}!`, sc, true);
                            }
                            break;
                        }
                    }
                }
            }

            // Snap to nearest active emergency beacon if child taps close to one (generous 28m magnet!)
            beacons.forEach(b => {
                if (!b.restored && Math.hypot(hitPoint.x - b.x, hitPoint.z - b.z) < 28) {
                    hitPoint.x = b.x;
                    hitPoint.z = b.z;
                }
            });

            // High Tide submarine and plesiosaur move in water; Blades flies freely; other bots stay on land
            const isHighTideWaterMode = (player.botType === 'HIGHTIDE' && (player.mode === 'VEHICLE' || player.mode === 'DINO'));
            const isFlyingCopter = (player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO'));
            let ty = getSurfaceHeight(hitPoint.x, hitPoint.z);
            if (isHighTideWaterMode) {
                // High Tide submarine and plesiosaur move in water: if tapped on dry land, find nearest water point along line towards player
                if (!isPointInWater(hitPoint.x, hitPoint.z)) {
                    for (let step = 0; step <= 1.0; step += 0.05) {
                        const tx = THREE.MathUtils.lerp(hitPoint.x, player.pos.x, step);
                        const tz = THREE.MathUtils.lerp(hitPoint.z, player.pos.z, step);
                        if (isPointInWater(tx, tz)) {
                            hitPoint.x = tx;
                            hitPoint.z = tz;
                            ty = getSurfaceHeight(tx, tz);
                            break;
                        }
                    }
                }
            } else if (!isFlyingCopter && ty < -1.0) {
                const angle = Math.atan2(hitPoint.z, hitPoint.x);
                for (let testDist = Math.min(r, 1620); testDist > 50; testDist -= 20) {
                    const tx = Math.cos(angle) * testDist;
                    const tz = Math.sin(angle) * testDist;
                    const testY = getSurfaceHeight(tx, tz);
                    if (testY >= -0.5) {
                        hitPoint.x = tx;
                        hitPoint.z = tz;
                        ty = testY;
                        break;
                    }
                }
            }

            const markerY = isHighTideWaterMode ? -0.45 : Math.max(0.0, ty);
            player.waypoint.set(hitPoint.x, markerY, hitPoint.z);
            player.hasWaypoint = true;

            waypointGroup.position.set(hitPoint.x, markerY, hitPoint.z);
            waypointGroup.visible = true;

            if (playChime) {
                sfx.playWaypointTap();
                spawnBurstParticles(hitPoint.x, markerY + 0.5, hitPoint.z, 0xfacc15, 5, 0.55);
            }
        }

        export function isUIElementTarget(target) {
            if (!target) return false;
            return Boolean(
                target.closest('button') ||
                target.closest('header') ||
                target.closest('#bot-roster') ||
                target.closest('#about-legal-modal') ||
                target.closest('#victory-modal') ||
                target.closest('#morocco-modal') ||
                target.closest('#morbot-victory-modal') ||
                target.closest('#tactical-map-modal') ||
                target.closest('#minimap-container')
            );
        }

        export function closeUtilityMenu() {
            const dropdown = document.getElementById('utility-menu-dropdown');
            const toggleBtn = document.getElementById('btn-menu-toggle');
            const iconBars = document.getElementById('menu-icon-bars');
            const iconClose = document.getElementById('menu-icon-close');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                if (iconBars) iconBars.classList.remove('hidden');
                if (iconClose) iconClose.classList.add('hidden');
            }
        }

        // Touch Anywhere on Screen to Move (Supports Single Tap or Hold-and-Drag Steering)
        window.addEventListener('touchstart', e => {
            if (!e.target.closest('#utility-menu-container')) {
                closeUtilityMenu();
            }
            if (isUIElementTarget(e.target)) return;
            e.preventDefault();
            sfx.init();
            if (e.touches.length > 0) {
                activePointerDown = true;
                const t = e.touches[0];
                pointerScreenX = t.clientX;
                pointerScreenY = t.clientY;
                lastHoldWaypointTime = performance.now();
                setDestinationFromScreenPoint(pointerScreenX, pointerScreenY, true);
            }
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (!activePointerDown || isUIElementTarget(e.target)) return;
            e.preventDefault();
            if (e.touches.length > 0) {
                const t = e.touches[0];
                pointerScreenX = t.clientX;
                pointerScreenY = t.clientY;
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            activePointerDown = false;
            sfx.init();
        }, { passive: false });

        window.addEventListener('touchcancel', () => {
            activePointerDown = false;
        }, { passive: false });

        // Mouse Click or Hold-Drag Anywhere to Move (Desktop & iPad Trackpad)
        window.addEventListener('mousedown', e => {
            if (!e.target.closest('#utility-menu-container')) {
                closeUtilityMenu();
            }
            if (e.button !== 0 || isUIElementTarget(e.target)) return;
            sfx.init();
            activePointerDown = true;
            pointerScreenX = e.clientX;
            pointerScreenY = e.clientY;
            lastHoldWaypointTime = performance.now();
            setDestinationFromScreenPoint(pointerScreenX, pointerScreenY, true);
        });

        window.addEventListener('mousemove', e => {
            if (!activePointerDown) return;
            pointerScreenX = e.clientX;
            pointerScreenY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            activePointerDown = false;
        });
        window.addEventListener('blur', () => {
            activePointerDown = false;
            sfx.stopContinuousLoops();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                activePointerDown = false;
                sfx.stopContinuousLoops();
            }
        });


        export function updatePhysics(dt, now) {
            let moveY = 0;
            let moveX = 0;

            if (isActionActive('forward')) moveY += 1;
            if (isActionActive('backward')) moveY -= 1;
            if (isActionActive('left')) moveX -= 1;
            if (isActionActive('right')) moveX += 1;

            // Cancel tap-waypoint if manual keyboard keys are pressed
            if (moveY !== 0 || moveX !== 0) {
                player.hasWaypoint = false;
                waypointGroup.visible = false;
                activePointerDown = false;
            } else if (activePointerDown && now - lastHoldWaypointTime >= 50) {
                // Throttled 20Hz waypoint update during continuous click-and-hold / drag
                lastHoldWaypointTime = now;
                setDestinationFromScreenPoint(pointerScreenX, pointerScreenY, false);
            }

            if (player.smashTimer > 0) player.smashTimer = Math.max(0, player.smashTimer - dt);
            if (player.scoopTimer > 0) player.scoopTimer = Math.max(0, player.scoopTimer - dt);
            if (player.winchTimer > 0) player.winchTimer = Math.max(0, player.winchTimer - dt);
            if (player.netTimer > 0) player.netTimer = Math.max(0, player.netTimer - dt);
            if (player.boostTimer > 0) player.boostTimer = Math.max(0, player.boostTimer - dt);
            if (player.energonBoostTimer > 0) {
                player.energonBoostTimer = Math.max(0, player.energonBoostTimer - dt);
                // Spawn a cheerful Rainbow Energon Sparkle Trail behind the Rescue Bot!
                if (Math.random() < 0.65) {
                    const trailColor = RAINBOW_TRAIL_COLORS[(rainbowTrailIdx++) % RAINBOW_TRAIL_COLORS.length];
                    const behindX = player.pos.x - Math.sin(player.heading) * 2.6 + (Math.random() - 0.5) * 1.4;
                    const behindZ = player.pos.z - Math.cos(player.heading) * 2.6 + (Math.random() - 0.5) * 1.4;
                    spawnBurstParticles(behindX, player.pos.y + 0.8, behindZ, trailColor, 1, 0.35);
                }
            }
            if (player.autoActionCooldown > 0) player.autoActionCooldown = Math.max(0, player.autoActionCooldown - dt);
            if (player.turboGlazeTimer > 0) {
                player.turboGlazeTimer = Math.max(0, player.turboGlazeTimer - dt);
                if (Math.random() < 0.45) {
                    spawnSparkleGlints(player.pos.x, player.pos.y + 0.6, player.pos.z, 1);
                }
            }

            const isFlyingCopter = (player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO'));
            const isHighTideWaterVeh = (player.botType === 'HIGHTIDE' && player.mode === 'VEHICLE');
            const isHighTideAmphibiousDino = (player.botType === 'HIGHTIDE' && player.mode === 'DINO');
            const onRoad = isPointOnRoad(player.pos.x, player.pos.z);

            // Top Speed per Rescue Bot & Mode (Bot, Vehicle, and Dinobot!)
            let maxSpeed = 26; // Bot walking speed
            const hasBoost = (player.boostTimer > 0 || player.energonBoostTimer > 0);
            if (player.mode === 'VEHICLE') {
                if (player.botType === 'BLURR') maxSpeed = hasBoost ? 88 : (onRoad ? 72 : 54);
                else if (player.botType === 'QUICKSHADOW') maxSpeed = hasBoost ? 84 : (onRoad ? 68 : 50);
                else if (player.botType === 'HIGHTIDE') maxSpeed = hasBoost ? 82 : 62; // Hydro-thruster submarine
                else if (player.botType === 'CHASE') maxSpeed = hasBoost ? 74 : (onRoad ? 58 : 44);
                else if (player.botType === 'BLADES') maxSpeed = hasBoost ? 78 : 62;
                else if (player.botType === 'HEATWAVE') maxSpeed = hasBoost ? 58 : (onRoad ? 46 : 36);
                else maxSpeed = hasBoost ? 54 : (onRoad ? 42 : 34); // Boulder
            } else if (player.mode === 'DINO') {
                // Dinobots excel off-road as well as on highways!
                if (player.botType === 'BLURR') maxSpeed = hasBoost ? 86 : 68; // Gallimimus supersonic sprint!
                else if (player.botType === 'QUICKSHADOW') maxSpeed = hasBoost ? 82 : 64; // Dilophosaur stealth sprint
                else if (player.botType === 'HIGHTIDE') maxSpeed = hasBoost ? 80 : 62; // Plesiosaur marine glide
                else if (player.botType === 'SALVAGE') maxSpeed = hasBoost ? 62 : 44; // Ankylosaur armored march
                else if (player.botType === 'BLADES') maxSpeed = hasBoost ? 80 : 64; // Pterosaur flight
                else if (player.botType === 'OPTIMUS') maxSpeed = hasBoost ? 82 : 60; // T-Rex primal charge
                else if (player.botType === 'BUMBLEBEE') maxSpeed = hasBoost ? 78 : 58; // Velociraptor sprint
                else if (player.botType === 'CHASE') maxSpeed = hasBoost ? 68 : 48; // Stegosaurus charge
                else if (player.botType === 'BOULDER') maxSpeed = hasBoost ? 64 : 45; // Triceratops stampede
                else maxSpeed = hasBoost ? 58 : 42; // Heatwave Brachiosaurus stride
            }
            if (player.turboGlazeTimer > 0) {
                maxSpeed *= 1.25;
            }

            const turnRate = isFlyingCopter ? 3.2 : (player.mode === 'VEHICLE' ? 3.0 : (player.mode === 'DINO' ? 3.5 : 4.2));

            // Automatic Tap-to-Move Steering & Throttle
            if (player.hasWaypoint) {
                const dx = player.waypoint.x - player.pos.x;
                const dz = player.waypoint.z - player.pos.z;
                const distToWP = Math.hypot(dx, dz);

                if (distToWP < 3.6) {
                    // Arrived at tapped destination!
                    player.hasWaypoint = false;
                    waypointGroup.visible = false;
                    moveY = 0;
                } else {
                    const desiredHeading = Math.atan2(dx, dz);
                    let headingDiff = desiredHeading - player.heading;
                    while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
                    while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;

                    // Smoothly turn toward the tapped waypoint
                    const maxTurnStep = turnRate * 1.45 * dt;
                    if (Math.abs(headingDiff) <= maxTurnStep) {
                        player.heading = desiredHeading;
                    } else {
                        player.heading += Math.sign(headingDiff) * maxTurnStep;
                    }

                    // Slow down slightly while turning sharply, then full speed ahead
                    const alignment = Math.max(0.35, Math.cos(headingDiff));
                    const arrivalSlowdown = Math.min(1.0, distToWP / 9.0);
                    moveY = alignment * Math.max(0.45, arrivalSlowdown);
                }
            } else {
                player.heading -= moveX * turnRate * dt;
            }

            const targetSpeed = moveY * maxSpeed;
            const accel = player.mode === 'VEHICLE' ? 8.5 : (player.mode === 'DINO' ? 10.5 : 13.0);
            player.speed = THREE.MathUtils.lerp(player.speed, targetSpeed, Math.min(1, dt * accel));

            if (player.boostTimer > 0 && (player.mode === 'VEHICLE' || player.mode === 'DINO')) {
                player.speed = maxSpeed;
            }

            if (Math.abs(player.speed) > 0.4) {
                player.walkCycle += dt * Math.abs(player.speed) * 0.55;
            }

            if (player.inCrane) {
                player.speed = 0;
            } else {
                const nextX = player.pos.x + Math.sin(player.heading) * player.speed * dt;
                const nextZ = player.pos.z + Math.cos(player.heading) * player.speed * dt;
                const nextGroundY = getSurfaceHeight(nextX, nextZ);

                if (isHighTideWaterVeh) {
                    // High Tide in Submarine / Ship mode moves in water only: cannot cross onto dry land
                    const inWater = isPointInWater(nextX, nextZ);
                    if (inWater || nextGroundY < 0.25) {
                        player.pos.x = Math.max(-2380, Math.min(2380, nextX));
                        player.pos.z = Math.max(-2380, Math.min(2380, nextZ));
                    } else {
                        player.speed *= -0.4;
                        player.hasWaypoint = false;
                        waypointGroup.visible = false;
                        if (!player.lastShorelineToast || now - player.lastShorelineToast > 3500) {
                            player.lastShorelineToast = now;
                            showToast(`⚓ SUBMARINE AT SHORELINE`, `High Tide's Submarine moves in water only! Transform to Amphibious Dino or Bot Mode to walk on land!`);
                            sfx.playSpeechPop();
                        }
                    }
                } else if (isFlyingCopter || isHighTideAmphibiousDino || nextGroundY > -1.5) {
                    // Blades Helicopter can fly freely; High Tide Dino Mode is fully AMPHIBIOUS (moves seamlessly across land and ocean!); Ground bots stay on land
                    player.pos.x = Math.max(-2380, Math.min(2380, nextX));
                    player.pos.z = Math.max(-2380, Math.min(2380, nextZ));
                } else {
                    player.speed *= -0.4;
                    player.hasWaypoint = false;
                    waypointGroup.visible = false;
                }
            }

            // Sample terrain footprint for vehicle suspension & pitch/roll slope conform
            const isVehicleOrDino = player.mode === 'VEHICLE' || player.mode === 'DINO';
            const currentBotScale = getBotScale(player.botType);
            const halfWheelbase = (isVehicleOrDino ? 2.3 : 0.8) * currentBotScale;
            const halfTrack = (isVehicleOrDino ? 1.35 : 0.7) * currentBotScale;
            const noseReach = (isVehicleOrDino ? 3.2 : 1.2) * currentBotScale;

            const sinH = Math.sin(player.heading);
            const cosH = Math.cos(player.heading);

            // Front & Rear contact points
            const fx = player.pos.x + sinH * halfWheelbase;
            const fz = player.pos.z + cosH * halfWheelbase;
            const rx = player.pos.x - sinH * halfWheelbase;
            const rz = player.pos.z - cosH * halfWheelbase;

            // Anticipatory front nose point (prevents bumper clipping into incoming hills)
            const nx = player.pos.x + sinH * noseReach;
            const nz = player.pos.z + cosH * noseReach;

            // Left & Right side points
            const lx = player.pos.x - cosH * halfTrack;
            const lz = player.pos.z + sinH * halfTrack;
            const rxSide = player.pos.x + cosH * halfTrack;
            const rzSide = player.pos.z - sinH * halfTrack;

            const frontY = Math.max(-0.5, getSurfaceHeight(fx, fz));
            const rearY = Math.max(-0.5, getSurfaceHeight(rx, rz));
            const noseY = Math.max(-0.5, getSurfaceHeight(nx, nz));
            const leftY = Math.max(-0.5, getSurfaceHeight(lx, lz));
            const rightY = Math.max(-0.5, getSurfaceHeight(rxSide, rzSide));
            const centerGroundY = Math.max(-0.5, getSurfaceHeight(player.pos.x, player.pos.z));

            // Target ground height under the chassis
            let targetGroundY = Math.max((frontY + rearY) * 0.5, centerGroundY);

            // Griffin Rock Express Train Car Roof & Flatbed Riding Detection
            let onTrainRoof = false;
            let ridingTrainCar = null;
            if (typeof islandTrain !== 'undefined' && islandTrain.cars.length > 0) {
                for (let i = 0; i < islandTrain.cars.length; i++) {
                    const car = islandTrain.cars[i];
                    const cdx = player.pos.x - car.x;
                    const cdz = player.pos.z - car.z;
                    if (cdx * cdx + cdz * cdz > 144) continue;

                    const cosH = Math.cos(car.heading);
                    const sinH = Math.sin(car.heading);
                    const lx = cdx * cosH - cdz * sinH;
                    const lz = cdx * sinH + cdz * cosH;

                    if (Math.abs(lx) <= car.halfWidth + 0.35 && Math.abs(lz) <= car.halfLength + 0.35) {
                        const carRoofY = car.y + car.height;
                        if (player.pos.y >= carRoofY - 0.75) {
                            targetGroundY = Math.max(targetGroundY, carRoofY);
                            onTrainRoof = true;
                            ridingTrainCar = car;
                            break;
                        }
                    }
                }
            }
            const isHighTideFloatingInWater = (
                player.botType === 'HIGHTIDE' &&
                (player.mode === 'VEHICLE' || player.mode === 'DINO') &&
                (isPointInWater(player.pos.x, player.pos.z) || centerGroundY < 0.25)
            );
            if (isHighTideFloatingInWater) {
                // High Tide Submarine and swimming Plesiosaur cruise on the water surface with gentle marine swell bobbing
                const subSwell = Math.sin(now * 0.003) * 0.12;
                const waterTargetY = -0.45 - (player.mode === 'DINO' ? 0.35 : 0.22) + subSwell;
                targetGroundY = Math.max(targetGroundY, waterTargetY);
            } else if (isVehicleOrDino && player.speed > 1.0 && noseY > frontY) {
                // Moving forward towards an uphill slope: gently elevate front suspension to prevent bumper clipping
                const leadClimbY = (noseY + rearY) * 0.5 - (0.15 * currentBotScale);
                targetGroundY = Math.max(targetGroundY, leadClimbY);
            }

            // Target pitch & roll angles
            let targetPitch = 0;
            let targetRoll = 0;
            if (isVehicleOrDino) {
                targetPitch = Math.atan2(frontY - rearY, halfWheelbase * 2.0);
                targetRoll = Math.atan2(rightY - leftY, halfTrack * 2.0);
                targetPitch = Math.max(-0.7, Math.min(0.7, targetPitch));
                targetRoll = Math.max(-0.45, Math.min(0.45, targetRoll));
                if (isHighTideFloatingInWater) {
                    targetPitch += Math.sin(now * 0.0028) * 0.04;
                    targetRoll += Math.cos(now * 0.0022) * 0.05;
                }
            } else {
                targetPitch = Math.atan2(frontY - rearY, 3.2) * 0.35;
                targetRoll = Math.atan2(rightY - leftY, 2.2) * 0.35;
            }

            // Buttery-smooth suspension damping for pitch and roll
            const pitchDampSpeed = isVehicleOrDino ? 16.0 : 10.0;
            player.pitch = THREE.MathUtils.lerp(player.pitch || 0, targetPitch, Math.min(1.0, dt * pitchDampSpeed));
            player.roll = THREE.MathUtils.lerp(player.roll || 0, targetRoll, Math.min(1.0, dt * pitchDampSpeed));

            // If riding atop the train, impart train velocity to keep player stationary relative to car roof
            if (onTrainRoof && ridingTrainCar) {
                const trainVx = Math.sin(ridingTrainCar.heading) * islandTrain.speed;
                const trainVz = Math.cos(ridingTrainCar.heading) * islandTrain.speed;
                player.pos.x += trainVx * dt;
                player.pos.z += trainVz * dt;
            }

            // Ground Collision against Buildings & Trees (Slide smoothly around obstacles during Tap-to-Move)
            const currentClearance = player.pos.y - targetGroundY;

            if (!player.inCrane && currentClearance < 12) {
                const playerRadius = 2.4;
                for (let i = 0; i < worldColliders.length; i++) {
                    const c = worldColliders[i];
                    const dx = player.pos.x - c.x;
                    const dz = player.pos.z - c.z;
                    const dist = Math.hypot(dx, dz);
                    const minDist = playerRadius + c.r;
                    if (dist < minDist && dist > 0.001) {
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const nz = dz / dist;
                        player.pos.x += nx * overlap;
                        player.pos.z += nz * overlap;
                        // Nudge tangential slide if auto-piloting around a building or tree
                        if (player.hasWaypoint) {
                            player.pos.x += -nz * dt * 8;
                            player.pos.z += nx * dt * 8;
                        }
                    }
                }

                // Solid Dynamic Collision against MorBot Boss (Cannot drive or walk through MorBot!)
                if (typeof morbotBattle !== 'undefined' && morbotBattle && morbotBattle.rig && morbotBattle.rig.root && morbotBattle.rig.root.visible && morbotBattle.state !== 'VICTORY' && morbotBattle.state !== 'DEFEATED') {
                    const morbotR = (morbotBattle.state === 'ROBOT') ? 3.4 : 3.6;
                    const playerR = (player.mode === 'VEHICLE') ? 2.8 : 2.4;
                    const mdx = player.pos.x - morbotBattle.pos.x;
                    const mdz = player.pos.z - morbotBattle.pos.z;
                    const mDist = Math.hypot(mdx, mdz);
                    const mMinDist = playerR + morbotR;
                    if (mDist < mMinDist && mDist > 0.001) {
                        const overlap = mMinDist - mDist;
                        const nx = mdx / mDist;
                        const nz = mdz / mDist;

                        // Hard physical pushback: instantly separates player so you NEVER clip or ghost through
                        player.pos.x += nx * overlap;
                        player.pos.z += nz * overlap;

                        // MorBot also receives physical impulse if bumped
                        if (morbotBattle.state === 'PURSUIT') {
                            morbotBattle.pos.x -= nx * overlap * 0.4;
                            morbotBattle.pos.z -= nz * overlap * 0.4;
                        }

                        const impactSpeed = Math.abs(player.speed);
                        spawnBurstParticles(
                            player.pos.x - nx * 1.6,
                            player.pos.y + 1.2,
                            player.pos.z - nz * 1.6,
                            0xff2222,
                            16,
                            1.4
                        );
                        spawnMagnetSparkParticles(player.pos.x - nx * 1.2, player.pos.y + 1.0, player.pos.z - nz * 1.2, 14);
                        sfx.playSmash();

                        // Gentle bumper bounce: dampens speed slightly so player stays close on MorBot bumper
                        if (player.speed > 8.0) {
                            player.speed *= 0.75;
                        }

                        // High-speed Ramming tackle damages MorBot:
                        if (Math.abs(player.speed) >= 9.5) {
                            morbotBattle.damageMorBot(1, "RAMMING TACKLE");
                        }
                    }
                }

                // Griffin Rock Express Heavy Train 2D OBB Collision
                const playerOBB = getPlayerOBB();
                if (typeof islandTrain !== 'undefined' && !onTrainRoof && islandTrain.cars.length > 0) {
                    if (!player.trainImpactCooldown) player.trainImpactCooldown = 0;
                    if (player.trainImpactCooldown > 0) player.trainImpactCooldown -= dt;

                    for (let i = 0; i < islandTrain.cars.length; i++) {
                        const car = islandTrain.cars[i];
                        const cdx = player.pos.x - car.x;
                        const cdz = player.pos.z - car.z;
                        if (cdx * cdx + cdz * cdz > 144) continue;
                        if (player.pos.y > car.y + car.height + 0.2) continue;

                        const carOBB = {
                            x: car.x,
                            z: car.z,
                            heading: car.heading,
                            halfWidth: car.halfWidth,
                            halfLength: car.halfLength,
                            mass: car.mass
                        };

                        const col = testOBBOverlap2D(playerOBB, carOBB);
                        if (col) {
                            // Firmly push player out along the collision MTV with safety margin
                            player.pos.x -= col.mtv.x * 1.06;
                            player.pos.z -= col.mtv.z * 1.06;
                            playerOBB.x = player.pos.x;
                            playerOBB.z = player.pos.z;

                            // Debounce impact FX: only play audio and spawn particles on initial strike
                            if (player.trainImpactCooldown <= 0) {
                                player.trainImpactCooldown = 0.45;
                                sfx.playSmash();
                                spawnBurstParticles(player.pos.x, player.pos.y + 1.2, player.pos.z, 0xfacc15, 8, 1.2);
                                spawnMagnetSparkParticles(player.pos.x, player.pos.y + 0.9, player.pos.z, 6);
                                player.speed = -player.speed * 0.35;
                                console.log('[TRAIN IMPACT]', {
                                    car: car.name,
                                    carIdx: i,
                                    speed: player.speed.toFixed(1),
                                    mtv: { x: col.mtv.x.toFixed(2), z: col.mtv.z.toFixed(2) },
                                    pos: { x: player.pos.x.toFixed(1), y: player.pos.y.toFixed(1), z: player.pos.z.toFixed(1) }
                                });
                            } else {
                                // Smooth velocity damping while brushing along moving train
                                player.speed *= 0.88;
                            }
                            break;
                        }
                    }
                }

                // Dynamic 2D OBB Collision against Civilian Vehicle NPCs (Weight-based mass separation & impact physics)
                for (let i = 0; i < vehicleNPCs.length; i++) {
                    const v = vehicleNPCs[i];
                    const dx = player.pos.x - v.x;
                    const dz = player.pos.z - v.z;
                    if (dx * dx + dz * dz > 256) continue; // Broadphase squared distance > 16m

                    const vOBB = {
                        x: v.x,
                        z: v.z,
                        heading: v.heading,
                        halfWidth: v.halfWidth || 1.8,
                        halfLength: v.halfLength || 3.3,
                        mass: v.mass || 2000
                    };

                    const col = testOBBOverlap2D(playerOBB, vOBB);
                    if (col) {
                        const totalMass = playerOBB.mass + vOBB.mass;
                        const playerDispFactor = vOBB.mass / totalMass;
                        const vehicleDispFactor = playerOBB.mass / totalMass;

                        // Separate positions along MTV inversely proportional to mass
                        player.pos.x -= col.mtv.x * playerDispFactor;
                        player.pos.z -= col.mtv.z * playerDispFactor;
                        playerOBB.x = player.pos.x;
                        playerOBB.z = player.pos.z;

                        v.x += col.mtv.x * vehicleDispFactor;
                        v.z += col.mtv.z * vehicleDispFactor;
                        v.root.position.x = v.x;
                        v.root.position.z = v.z;

                        // Nudge vehicle route progress/theta so it doesn't instantly snap back
                        if (v.routeType === 'INNER_RING' || v.routeType === 'OUTER_RING') {
                            v.theta = (Math.atan2(v.z, v.x) + Math.PI * 2) % (Math.PI * 2);
                        } else if (v.routeType === 'NS_HIGHWAY') {
                            v.progress = v.z;
                        } else if (v.routeType === 'EW_HIGHWAY') {
                            v.progress = v.x;
                        }

                        // Physical impact impulses & audio/visual feedback
                        const impactSpeed = Math.abs(player.speed);
                        if (impactSpeed > 2.5) {
                            if (playerOBB.mass >= 20000 || vOBB.mass >= 10000) {
                                sfx.playSmash();
                            } else {
                                sfx.playDockClank();
                            }
                            if (sfx.playCarHonk && Math.random() < 0.65) {
                                sfx.playCarHonk(v.voicePitch || 1.0);
                            }
                            spawnBurstParticles(
                                (player.pos.x + v.x) * 0.5,
                                player.pos.y + 1.1,
                                (player.pos.z + v.z) * 0.5,
                                0xffcc00,
                                12,
                                1.3
                            );
                            spawnMagnetSparkParticles(
                                (player.pos.x + v.x) * 0.5,
                                player.pos.y + 0.9,
                                (player.pos.z + v.z) * 0.5,
                                10
                            );

                            // Player speed loss scaled by vehicle mass vs player mass
                            const massResistance = Math.min(0.85, (vOBB.mass / playerOBB.mass) * 0.55);
                            player.speed *= (1.0 - massResistance);

                            // Civilian vehicle is jarred, brakes, and triggers brake lights
                            v.currentSpeed = Math.max(0, (v.currentSpeed || v.speed || 24) - 8.0);
                            v.isBraking = true;
                        } else {
                            // Gentle bumper contact
                            player.speed *= 0.82;
                            v.currentSpeed = Math.max(0, (v.currentSpeed || v.speed || 24) * 0.6);
                            v.isBraking = true;
                        }

                        // Slide tangential path if player is on autopilot waypoint navigation
                        if (player.hasWaypoint) {
                            const tangX = -col.mtv.z;
                            const tangZ = col.mtv.x;
                            player.pos.x += tangX * dt * 4;
                            player.pos.z += tangZ * dt * 4;
                        }
                    }
                }
            }

            // Continuous Hold Ascend/Descend keys for Blades Helicopter
            if (player.inCrane) {
                player.grounded = false;
                player.vy = 0;
            } else if (isFlyingCopter) {
                if (isActionActive('secondaryAction')) player.flightAlt = Math.min(95, player.flightAlt + 28 * dt);
                if (isActionActive('descendAction')) player.flightAlt = Math.max(2, player.flightAlt - 28 * dt);
                const targetHoverY = centerGroundY + player.flightAlt + Math.sin(now * 0.004) * 0.45;
                player.pos.y = THREE.MathUtils.lerp(player.pos.y, targetHoverY, Math.min(1, dt * 5.5));
                player.vy = 0;
                player.grounded = false;
                document.getElementById('altitude-readout').textContent = `ALT: ${String(Math.round(player.pos.y - centerGroundY)).padStart(2, '0')}m`;
            } else {
                // Standard Ground & Jump Gravity
                ramps.forEach(r => {
                    const dx = player.pos.x - r.x;
                    const dz = player.pos.z - r.z;
                    if (Math.abs(dx) < r.r && Math.abs(dz) < r.r) {
                        const lx = dx * r.cosY - dz * r.sinY;
                        const lz = dx * r.sinY + dz * r.cosY;
                        if (Math.abs(lx) <= r.w * 0.6 && lz >= -1.0 && lz <= r.l * 0.65 && Math.abs(player.speed) > 13 && player.grounded) {
                            player.vy = 18 + Math.abs(player.speed) * 0.36;
                            player.grounded = false;
                        }
                    }
                });

                if (!player.grounded || player.pos.y > targetGroundY + 0.35) {
                    player.vy -= 44 * dt;
                    player.pos.y += player.vy * dt;
                    if (player.pos.y <= targetGroundY) {
                        player.pos.y = targetGroundY;
                        player.vy = 0;
                        player.grounded = true;
                    }
                } else {
                    // Gradual level adjustment as car drives up a hill or over a bump
                    const suspensionFollowSpeed = player.pos.y < targetGroundY ? 24.0 : 18.0;
                    player.pos.y = THREE.MathUtils.lerp(player.pos.y, targetGroundY, Math.min(1.0, dt * suspensionFollowSpeed));
                    player.vy = 0;
                    player.grounded = true;
                }
            }

            // High Tide Submarine & Plesiosaur twin water spray & foaming wake (when actively floating in water!)
            if (isHighTideFloatingInWater && Math.abs(player.speed) > 1.2 && Math.random() < 0.45) {
                const sinH = Math.sin(player.heading);
                const cosH = Math.cos(player.heading);
                const wakeX = player.pos.x - sinH * 2.8 + (Math.random() - 0.5) * 1.6;
                const wakeZ = player.pos.z - cosH * 2.8 + (Math.random() - 0.5) * 1.6;
                spawnWaterWakeParticles(wakeX, -0.45, wakeZ, 3);
            }

            // KID-FRIENDLY SMART AUTO-RESCUE: Automatically trigger rescue powers when arriving near any emergency!
            let nearActiveHazard = false;
            beacons.forEach(beacon => {
                if (beacon.restored) return;
                beacon.nodes.forEach(n => {
                    if (n.cleared) return;
                    const distToHazard = Math.hypot(player.pos.x - n.x, player.pos.z - n.z);
                    if (distToHazard < 13.5) {
                        nearActiveHazard = true;
                    }
                });
            });

            // Note: Auto-attack on MorBot proximity is intentionally disabled to keep boss battles active & challenging.

            if (nearActiveHazard && player.autoActionCooldown <= 0) {
                player.autoActionCooldown = 0.85;
                triggerPrimaryAction();
            }

            // Heatwave Aimed High-Pressure Water Cannon Arc & Fire Extinguishing
            if (player.waterTimer > 0 && player.botType === 'HEATWAVE') {
                player.waterTimer = Math.max(0, player.waterTimer - dt);
                spawnWaterCannonStream();
                if (Math.random() < 0.25) sfx.playWaterSpray();

                // Check MorBot hit from continuous water cannon stream
                if (typeof checkHitMorBotWithSpecialAbility === 'function') {
                    checkHitMorBotWithSpecialAbility(48.0, "WATER CANNON");
                }

                // Extinguish any hazard node within 30m of Heatwave or along his forward arc
                const aimX = player.pos.x + Math.sin(player.heading) * 14;
                const aimZ = player.pos.z + Math.cos(player.heading) * 14;
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && (Math.hypot(aimX - n.x, aimZ - n.z) < 18.5 || Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 28.0)) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
            }

            // Animate Blades' Helicopter Rescue Winch Cable & Airlift Hook
            if (player.winchTimer > 0 && player.botType === 'BLADES') {
                winchGroup.visible = true;
                const winchTopY = player.pos.y + 1.1;
                winchGroup.position.set(player.pos.x, winchTopY, player.pos.z);

                const maxDrop = Math.max(3.2, winchTopY - centerGroundY - 0.35);
                // Smoothly extend cable down to ground and hoist back up!
                const winchPhase = Math.sin((1.0 - player.winchTimer / 1.65) * Math.PI);
                const curLen = Math.max(1.2, maxDrop * Math.min(1.0, winchPhase * 1.35));
                winchCableMesh.scale.y = curLen;
                winchHookAssembly.position.y = -curLen;
                winchHookAssembly.rotation.y = now * 0.008;
            } else {
                winchGroup.visible = false;
            }

            // Animate Chase's Police Energy Net & Tow Winch Tether
            if (player.netTimer > 0 && player.botType === 'CHASE') {
                energyNetGroup.visible = true;
                const startX = player.pos.x + Math.sin(player.heading) * 2.2;
                const startY = player.pos.y + 1.6;
                const startZ = player.pos.z + Math.cos(player.heading) * 2.2;

                towTetherMesh.position.set(startX, startY, startZ);
                towTetherMesh.lookAt(player.netTarget);
                const tetherDist = Math.max(1.0, towTetherMesh.position.distanceTo(player.netTarget));
                const netProgress = 1.0 - (player.netTimer / 1.35);
                const extendFactor = Math.min(1.0, netProgress * 3.5);
                towTetherMesh.scale.set(1, 1, tetherDist * extendFactor);

                energyNetDome.position.copy(player.netTarget);
                const domeScale = Math.sin(Math.min(1.0, netProgress * 1.4) * Math.PI * 0.85) * 1.15;
                energyNetDome.scale.setScalar(Math.max(0.1, domeScale));
                energyNetDome.rotation.y = now * 0.006;
            } else {
                energyNetGroup.visible = false;
            }

            // Direct Contact / Ramming Hazard Nodes (Cleared easily when driving or walking up to them!)
            beacons.forEach(beacon => {
                beacon.nodes.forEach(n => {
                    if (n.cleared) return;
                    const dx = player.pos.x - n.x;
                    const dz = player.pos.z - n.z;
                    const dy = Math.abs(player.pos.y - n.y);
                    const dist = Math.hypot(dx, dz);
                    if (dist < 3.4 + n.r && dy < 12.0) {
                        clearHazardNode(beacon, n);
                    }
                });
            });


            // Dynamic Shadow Tracking across the 10X Island (Texel-snapped to prevent shadow edge swimming)
            const snapX = Math.round(player.pos.x / 2) * 2;
            const snapZ = Math.round(player.pos.z / 2) * 2;
            sunLight.target.position.set(snapX, player.pos.y, snapZ);
            sunLight.position.set(snapX + 160, player.pos.y + 260, snapZ + 130);
            sunLight.target.updateMatrixWorld();

            // Update Headlight Spotlights & Sonar Ring for Player & Buddy Bot (Aligned with vehicle terrain pitch)
            headlight.position.set(player.pos.x, player.pos.y + 3.5, player.pos.z);
            headlight.target.position.set(
                player.pos.x + Math.sin(player.heading) * 22,
                player.pos.y + 0.5 - Math.sin(player.pitch || 0) * 22,
                player.pos.z + Math.cos(player.heading) * 22
            );

            if (buddyBot.botType) {
                buddyHeadlight.position.set(buddyBot.pos.x, buddyBot.pos.y + 3.2, buddyBot.pos.z);
                buddyHeadlight.target.position.set(
                    buddyBot.pos.x + Math.sin(buddyBot.heading) * 20,
                    buddyBot.pos.y + 0.5 - Math.sin(buddyBot.pitch || 0) * 20,
                    buddyBot.pos.z + Math.cos(buddyBot.heading) * 20
                );
            }

            if (player.sonarTimer > 0) {
                player.sonarTimer = Math.max(0, player.sonarTimer - dt);
                const progress = 1 - (player.sonarTimer / 1.5);
                sonarMesh.position.set(player.pos.x, player.pos.y + 1.0, player.pos.z);
                sonarMesh.scale.setScalar(1 + progress * 34);
                sonarMat.opacity = (1 - progress) * 0.85;
            } else {
                sonarMat.opacity = 0;
            }

            // Update Active Particles (Debris & Water Stream)
            for (let i = activeParticles.length - 1; i >= 0; i--) {
                const p = activeParticles[i];
                p.life -= dt;
                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    activeParticles.splice(i, 1);
                } else {
                    p.vy -= p.gravity * dt;
                    p.mesh.position.x += p.vx * dt;
                    p.mesh.position.y += p.vy * dt;
                    p.mesh.position.z += p.vz * dt;
                    p.mesh.scale.setScalar(Math.max(0.1, p.life));
                }
            }

            // Wider, Further-Back Third-Person Camera for 3-Year-Old Visibility & Easy Far-Tapping
            // Camera starts facing the bot heroically in front; as soon as movement begins, smoothly orbits behind!
            const isMoving = Math.abs(player.speed) > 0.4 || player.hasWaypoint ||
                (input.keys['KeyW'] || input.keys['KeyS'] || input.keys['ArrowUp'] || input.keys['ArrowDown'] ||
                 input.keys['KeyA'] || input.keys['KeyD'] || input.keys['ArrowLeft'] || input.keys['ArrowRight']);
            if (input.autoCam && isMoving) {
                const targetYaw = player.heading + Math.PI;
                let diff = targetYaw - input.camYaw;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                if (Math.abs(Math.abs(diff) - Math.PI) < 0.05) {
                    diff = Math.PI - 0.05;
                }
                input.camYaw += diff * Math.min(1.0, dt * 2.2);
            }

            // Camera Distance & Pitch per View Mode (Default Mode 0 is significantly pulled back & elevated)
            let baseDist = isFlyingCopter ? 44.0 : (player.mode === 'VEHICLE' || player.mode === 'DINO' ? 39.0 : 34.0);
            const botScaleFactor = getBotScale(player.botType);
            baseDist *= (1.0 + (botScaleFactor - 1.0) * 0.75);
            let activePitch = 0.48;
            if (input.camZoomMode === 1) {
                // Extra-Wide Sky Map View
                baseDist = 64.0;
                activePitch = 0.64;
            } else if (input.camZoomMode === 2) {
                // Closer Action View
                baseDist = 23.0;
                activePitch = 0.36;
            }

            // Facing Factor: 1.0 when facing the bot directly from front, 0.0 when behind
            const frontFactor = Math.max(0, Math.cos(input.camYaw - player.heading));
            const activeDist = baseDist * (1.0 - frontFactor * 0.28);
            const dynamicPitch = activePitch * (1.0 - frontFactor * 0.38);

            const camHeight = Math.sin(dynamicPitch) * activeDist;
            const camHoriz = Math.cos(dynamicPitch) * activeDist;

            const idealCamX = player.pos.x + Math.sin(input.camYaw) * camHoriz;
            const idealCamZ = player.pos.z + Math.cos(input.camYaw) * camHoriz;
            const minGroundCamY = getSurfaceHeight(idealCamX, idealCamZ) + 4.5;
            const idealCamY = Math.max(minGroundCamY, player.pos.y + camHeight + 4.5 * (1.0 - frontFactor * 0.55));

            camera.position.lerp(new THREE.Vector3(idealCamX, idealCamY, idealCamZ), Math.min(1, dt * 8));

            // While facing the bot from front, center directly on the bot's chest.
            // As the camera shifts behind the bot, smoothly transition the look target ahead of the bot.
            const rearAlignment = Math.max(0, -Math.cos(input.camYaw - player.heading));
            const lookAheadDist = rearAlignment * 4.5;
            const lookAheadX = player.pos.x + Math.sin(player.heading) * lookAheadDist;
            const lookAheadZ = player.pos.z + Math.cos(player.heading) * lookAheadDist;
            camera.lookAt(lookAheadX, player.pos.y + (3.2 * botScaleFactor), lookAheadZ);

            const kmh = Math.round(Math.abs(player.speed) * 2.2);
            document.getElementById('speed-readout').textContent = `${String(kmh).padStart(2, '0')} KM/H`;
            document.getElementById('zone-label').textContent = getZoneName(player.pos.x, player.pos.z);

            // Update Continuous Speed-Reactive Engine, Helicopter Rotor Chop & Emergency Siren Loops
            sfx.updateContinuousLoops(player.botType, player.mode, player.speed, player.sirenActive, player.boostTimer, now);
        }


if (typeof window !== 'undefined') {
    window.waypointGroup = waypointGroup;
    window.intersectRayWithTerrain = intersectRayWithTerrain;
    window.setDestinationFromScreenPoint = setDestinationFromScreenPoint;
    window.updatePhysics = updatePhysics;
}

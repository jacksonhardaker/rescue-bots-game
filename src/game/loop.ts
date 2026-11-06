// Main Render Loop & Animation Frame Dispatcher
import * as THREE from 'three';
import { renderer, scene, camera, sunLight } from '../rendering/scene.js';
import { player, buddyBot, botRigs, input } from '../state/gameState.js';
import { updatePhysics, waypointGroup, wpOuterRing, wpArrowCone } from '../physics/movement.js';
import { updateAllBotTransforms, speakBotCatchphrase } from '../physics/player.js';
import { updateIslandTrain, islandTrain } from '../world/railway.js';
import {
    hqRadarPivot, swapPadRing, outpostPadRings, lhBeamPivot, observatoryDomePivot,
    windTurbineRotors, volcanoLavaPool, volcanoSmokePuffs,
    ROBO_WASH_POS, rwY, rwLeftBrush, rwRightBrush, rwTopBrush,
    CATAPULT_POS, catY, catapultCarriage, catapultStrobes,
    DINER_POS, dinerY, dinerBurgerGroup,
    CHARGER_POS, chargerY, energonCoilRings, energonOrbs,
    groundBridgePortals, harborFerryGroup, ferryController,
    craneInteractive, testYard, stuntHoopRigs,
    ferrisWheelPivot, ferrisGondolas, bwX, bwZ, babyDinos, amberSpire, drX, drZ, waywardEnergonShard
} from '../world/buildings.js';
import { getTerrainHeight } from '../world/terrain.js';
import { triggerNPCSpeech, showToast, activeSpeech } from '../ui/dialogs.js';
import { progression, saveProgression, getRescueStarRank, lastKnownRankLevel, setLastKnownRankLevel } from '../progression/progression.js';
import {
    spawnSoapSudsParticles, spawnSparkleGlints, spawnRocketExhaustParticles,
    spawnDinerFoodParticles, spawnEnergonLightningParticles, spawnWarpVortexParticles,
    spawnWaterWakeParticles, spawnMagnetSparkParticles, spawnBurstParticles,
    spawnPaintSplatParticles, respawnSingleBeacon
} from '../world/emergencies.js';
import { updateLivingWorldNPCs, updateBuddyBotAI } from '../world/npcs.js';
import { updateInteractiveRoadProps } from '../world/props.js';
import { beacons, updateEmergentRescues, activeParticles } from '../world/emergencies.js';
import { updateEnergonCubes, updateGoldenCrests, updateLandmarkDiscovery } from '../world/collectibles.js';
import { updateVisitingAutobots } from '../world/allies.js';
import { updateMorBotBattle } from '../world/morbot.js';
import { updateViewportCulling } from './culling.js';
import { renderMinimap, renderTacticalMap } from '../ui/tacticalMap.js';
import { WEATHER_MODES, currentWeatherIdx, rainSystem, volcanoEmberSystem, starField, auroraMesh } from '../world/weather.js';
import { waterMesh, shorelineFoamRing } from '../world/terrainMesh.js';
import { sfx } from '../audio/soundFX.js';

let lastTime = performance.now();
let frameCount = 0;
let fpsTimer = 0;
let minimapTimer = 0;
let hudUpdateTimer = 0;
let lightningFlashTimer = 0;
let lightningTimer = 0;

        export function animate(now) {
            requestAnimationFrame(animate);

            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            const isFlyingCopter = (player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO'));

            frameCount++;
            fpsTimer += dt;
            if (fpsTimer >= 0.5) {
                const fps = Math.round(frameCount / fpsTimer);
                document.getElementById('fps-counter').textContent = `${fps} FPS`;
                frameCount = 0;
                fpsTimer = 0;
            }

            renderMinimap();
            if ((() => { const m = document.getElementById('tactical-map-modal'); return !!m && !m.classList.contains('hidden'); })()) {
                renderTacticalMap();
            }

            // Animate 3D Tap Waypoint Marker (Pulsing Ring & Bouncing Arrow)
            if (waypointGroup && waypointGroup.visible && wpOuterRing && wpArrowCone) {
                const wpPulse = 1.0 + Math.sin(now * 0.01) * 0.18;
                wpOuterRing.scale.setScalar(wpPulse);
                wpOuterRing.rotation.z += dt * 1.8;
                wpArrowCone.position.y = 4.2 + Math.sin(now * 0.012) * 1.1;
                wpArrowCone.rotation.y += dt * 3.0;
            }

            // Animate HQ Radar Dish, Outpost Rings, Lighthouse Beam, Regional Landmarks, Ocean Waves & Flickering Fires
            if (hqRadarPivot) hqRadarPivot.rotation.y += dt * 1.4;
            if (swapPadRing) swapPadRing.rotation.z += dt * 0.8;
            if (outpostPadRings) {
                for (let i = 0; i < outpostPadRings.length; i++) {
                    outpostPadRings[i].rotation.z += dt * 0.8;
                }
            }
            if (lhBeamPivot) lhBeamPivot.rotation.y += dt * 1.1;
            if (observatoryDomePivot) observatoryDomePivot.rotation.y += dt * 0.35;
            if (windTurbineRotors) {
                for (let i = 0; i < windTurbineRotors.length; i++) {
                    windTurbineRotors[i].rotation.z += dt * (1.8 + i * 0.25);
                }
            }
            if (volcanoLavaPool) {
                volcanoLavaPool.rotation.y += dt * 0.25;
                volcanoLavaPool.scale.setScalar(1.0 + Math.sin(now * 0.005) * 0.04);
            }
            if (volcanoSmokePuffs) {
                for (let i = 0; i < volcanoSmokePuffs.length; i++) {
                    const puff = volcanoSmokePuffs[i];
                    const p = (puff.userData.phase + now * 0.00018) % 1.0;
                    puff.position.set(
                        Math.sin(p * 6.0 + i) * (4.0 + p * 8.0),
                        6.0 + p * 46.0,
                        Math.cos(p * 5.0 + i) * (4.0 + p * 8.0)
                    );
                    puff.scale.setScalar(0.65 + p * 2.1);
                }
            }
            if (waterMesh) waterMesh.position.y = -0.45 + Math.sin(now * 0.0025) * 0.22;
            if (shorelineFoamRing) shorelineFoamRing.scale.setScalar(1.0 + Math.sin(now * 0.003) * 0.008);

            // Animate Active Weather System & Island Events
            const currentMode = (WEATHER_MODES && WEATHER_MODES[currentWeatherIdx]) || { id: 'SUNNY' };
            if (currentMode && currentMode.id === 'RAIN' && rainSystem && rainSystem.group) {
                rainSystem.group.position.set(player.pos.x, player.pos.y, player.pos.z);
                const drops = rainSystem.drops;
                for (let i = 0; i < drops.length; i++) {
                    const d = drops[i];
                    d.mesh.position.y -= d.speed * dt;
                    if (d.mesh.position.y < -5) {
                        d.mesh.position.y = 55 + Math.random() * 8;
                        d.mesh.position.x = (Math.random() - 0.5) * 115;
                        d.mesh.position.z = (Math.random() - 0.5) * 115;
                    }
                }

                // Distant Lightning & Thunder
                lightningTimer -= dt;
                if (lightningTimer <= 0) {
                    lightningTimer = 8.0 + Math.random() * 9.0;
                    lightningFlashTimer = 0.12;
                    sunLight.intensity = 2.8;
                    scene.background.setHex(0xdbeafe);
                    setTimeout(() => {
                        if (WEATHER_MODES[currentWeatherIdx].id === 'RAIN') {
                            sfx.playThunderRumble();
                        }
                    }, 280);
                }
                if (lightningFlashTimer > 0) {
                    lightningFlashTimer -= dt;
                    if (lightningFlashTimer <= 0 && WEATHER_MODES[currentWeatherIdx].id === 'RAIN') {
                        scene.background.setHex(WEATHER_MODES[currentWeatherIdx].skyColor);
                        sunLight.intensity = WEATHER_MODES[currentWeatherIdx].sunIntensity;
                    }
                }
            } else if (currentMode.id === 'VOLCANO') {
                volcanoEmberSystem.group.position.set(player.pos.x, player.pos.y, player.pos.z);
                const embers = volcanoEmberSystem.embers;
                for (let i = 0; i < embers.length; i++) {
                    const e = embers[i];
                    e.mesh.position.y += e.vy * dt;
                    e.mesh.position.x += Math.sin(now * 0.002 * e.driftFreq + e.phase) * e.driftAmp * dt;
                    if (e.mesh.position.y > 50) {
                        e.mesh.position.y = -2;
                        e.mesh.position.x = (Math.random() - 0.5) * 120;
                        e.mesh.position.z = (Math.random() - 0.5) * 120;
                    }
                }
                if (volcanoLavaPool) volcanoLavaPool.scale.setScalar(1.0 + Math.sin(now * 0.008) * 0.08);
            } else if (currentMode.id === 'NIGHT') {
                if (auroraMesh) {
                    auroraMesh.rotation.z = Math.sin(now * 0.001) * 0.035;
                    auroraMesh.position.y = 260 + Math.sin(now * 0.0016) * 12;
                }
                auroraMesh.material.opacity = 0.65 + Math.sin(now * 0.0025) * 0.12;

                // Animate twinkling diamond stars & pulsing moon halo
                const stars = starField.stars;
                for (let i = 0; i < stars.length; i++) {
                    const s = stars[i];
                    const sc = s.userData.baseScale * (1.0 + Math.sin(now * 0.0022 * s.userData.twinkleSpeed + s.userData.phase) * 0.38);
                    s.scale.set(sc * 0.65, sc * 1.85, sc * 0.65);
                }
                starField.haloMesh.scale.setScalar(1.0 + Math.sin(now * 0.002) * 0.08);
            }

            // Spin Robo-Wash Roller Brushes
            const washActive = player.inCarWash || buddyBot.inCarWash;
            const brushSpeed = washActive ? 16.0 : 3.2;
            if (rwLeftBrush) rwLeftBrush.rotation.y += dt * brushSpeed;
            if (rwRightBrush) rwRightBrush.rotation.y -= dt * brushSpeed;
            if (rwTopBrush) rwTopBrush.rotation.x += dt * brushSpeed;

            // Firehouse Robo-Wash Detection
            const dwX = Math.abs(player.pos.x - ROBO_WASH_POS.x);
            const dwZ = Math.abs(player.pos.z - ROBO_WASH_POS.z);
            const insideWash = dwX < 4.8 && dwZ < 7.8 && player.pos.y < rwY + 8.5;

            if (insideWash) {
                if (!player.inCarWash) {
                    player.inCarWash = true;
                    sfx.playSoapSuds();
                }
                if (Math.random() < 0.7) {
                    spawnSoapSudsParticles(player.pos.x, player.pos.y + 1.2, player.pos.z, 2);
                }
                if (now - (player.lastWashSoundTime || 0) > 170) {
                    player.lastWashSoundTime = now;
                    sfx.playSoapSuds();
                }
            } else if (player.inCarWash) {
                player.inCarWash = false;
                player.turboGlazeTimer = 5.0;
                player.boostTimer = Math.max(player.boostTimer, 3.5);
                sfx.playStuntChime();
                spawnSparkleGlints(player.pos.x, player.pos.y + 1.8, player.pos.z, 18);
                showToast("🧼 ROBO-WASH!", "Squeaky Clean & Turbo Glazed!");
                speakBotCatchphrase(player.botType, 'WASH');
            }

            if (buddyBot.botType) {
                const bdwX = Math.abs(buddyBot.pos.x - ROBO_WASH_POS.x);
                const bdwZ = Math.abs(buddyBot.pos.z - ROBO_WASH_POS.z);
                const bInsideWash = bdwX < 5.0 && bdwZ < 8.0 && buddyBot.pos.y < rwY + 8.5;
                if (bInsideWash && !buddyBot.inCarWash) {
                    buddyBot.inCarWash = true;
                } else if (!bInsideWash && buddyBot.inCarWash) {
                    buddyBot.inCarWash = false;
                    spawnSparkleGlints(buddyBot.pos.x, buddyBot.pos.y + 1.8, buddyBot.pos.z, 14);
                }
            }

            // =================================================================
            // ANIMATE & CHECK FIREHOUSE HQ SUPER CATAPULT
            // =================================================================
            if (player.catapultCooldown > 0) player.catapultCooldown -= dt;

            const strobeInterval = player.catapultTimer > 0 ? 80 : 380;
            const strobeLit = Math.floor(now / strobeInterval) % 2 === 0;
            if (catapultStrobes) {
                catapultStrobes.forEach((strobe, idx) => {
                    const isLit = player.catapultTimer > 0 ? ((idx + Math.floor(now / 80)) % 2 === 0) : strobeLit;
                    strobe.material.color.setHex(isLit ? 0xffffff : 0xfacc15);
                });
            }

            if (player.catapultTimer > 0) {
                player.catapultTimer -= dt;
                player.speed = 0;
                player.pos.x = CATAPULT_POS.x;
                player.pos.z = CATAPULT_POS.z - 3.5;
                player.heading = 0; // Point South towards town avenue
                if (catapultCarriage) catapultCarriage.position.z = -3.5 + Math.sin(now * 0.05) * 0.15;

                if (player.catapultTimer <= 0) {
                    sfx.playCatapultBlast();
                    spawnRocketExhaustParticles(CATAPULT_POS.x, catY + 0.8, CATAPULT_POS.z - 3.5, 36);
                    player.heading = 0;
                    player.speed = 48.0;
                    player.vy = 42.0;
                    player.grounded = false;
                    player.boostTimer = Math.max(player.boostTimer, 4.5);
                    showToast("🚀 CATAPULT LAUNCH!", "Full Throttle Blastoff!");
                    speakBotCatchphrase(player.botType, 'CATAPULT');
                    player.catapultCooldown = 3.5;
                    if (catapultCarriage) catapultCarriage.position.z = 4.5;
                }
            } else if (catapultCarriage) {
                catapultCarriage.position.z = THREE.MathUtils.lerp(catapultCarriage.position.z, -3.5, dt * 2.5);

                const dCatX = Math.abs(player.pos.x - CATAPULT_POS.x);
                const dCatZ = Math.abs(player.pos.z - (CATAPULT_POS.z - 3.5));
                const onCatPad = dCatX < 4.2 && dCatZ < 4.5 && player.pos.y < catY + 5.5;

                if (onCatPad && player.catapultCooldown <= 0 && player.grounded && player.catapultTimer <= 0) {
                    player.catapultTimer = 0.65;
                    sfx.playCatapultCountdown();
                    triggerNPCSpeech("Cody Burns", "Communications Officer", "Catapult lock engaged! 3... 2... 1... LAUNCH!", { x: CATAPULT_POS.x, z: CATAPULT_POS.z }, true);
                }
            }

            // =================================================================
            // ANIMATE & CHECK GRIFFIN ROCK DRIVE-THRU DINER
            // =================================================================
            if (dinerBurgerGroup) dinerBurgerGroup.rotation.y += dt * 0.85;

            const dDinLaneX = Math.abs(player.pos.x - (DINER_POS.x - 8.5));
            const inDinZRange = player.pos.z >= (DINER_POS.z - 12) && player.pos.z <= (DINER_POS.z + 12);
            const inDriveThru = dDinLaneX < 4.2 && inDinZRange && player.pos.y < dinerY + 6.0;

            if (inDriveThru) {
                const distToIntercom = Math.hypot(player.pos.x - (DINER_POS.x - 10.5), player.pos.z - (DINER_POS.z + 6.5));
                if (distToIntercom < 5.5 && (now - player.lastDinerOrderTime > 14000)) {
                    player.lastDinerOrderTime = now;
                    sfx.playDinerDing();
                    triggerNPCSpeech("Griffin Diner", "Drive-Thru Intercom", "Welcome to Griffin Diner! What can we get for you, Rescue Bot?", { x: DINER_POS.x - 10.5, y: dinerY + 3.6, z: DINER_POS.z + 6.5 }, true);
                }

                const distToPickup = Math.hypot(player.pos.x - (DINER_POS.x - 6.0), player.pos.z - (DINER_POS.z - 2.5));
                if (distToPickup < 5.5 && (now - player.lastDinerPickupTime > 14000)) {
                    player.lastDinerPickupTime = now;
                    sfx.playStuntChime();
                    spawnDinerFoodParticles(player.pos.x, player.pos.y + 1.6, player.pos.z, 18);
                    spawnSparkleGlints(player.pos.x, player.pos.y + 1.6, player.pos.z, 14);
                    player.boostTimer = Math.max(player.boostTimer, 4.0);
                    showToast("🍔 GRIFFIN DINER!", "Energon Burger & High-Octane Shake Served!");
                    speakBotCatchphrase(player.botType, 'DINER');
                }
            }

            // =================================================================
            // ANIMATE & CHECK DOC GREENE'S ENERGON TURBO-CHARGER
            // =================================================================
            if (player.chargerCooldown > 0) player.chargerCooldown -= dt;

            const dChgX = Math.abs(player.pos.x - CHARGER_POS.x);
            const dChgZ = Math.abs(player.pos.z - CHARGER_POS.z);
            const inChargingBay = dChgX < 6.8 && dChgZ < 8.2 && player.pos.y < chargerY + 7.0;

            const coilSpinSpeed = inChargingBay ? 14.0 : 2.5;
            if (energonCoilRings) {
                energonCoilRings.forEach((r, rIdx) => {
                    r.rotation.z += (rIdx % 2 === 0 ? 1 : -1) * dt * coilSpinSpeed;
                });
            }
            if (energonOrbs) {
                const orbPulse = 1.0 + Math.sin(now * (inChargingBay ? 0.015 : 0.004)) * (inChargingBay ? 0.22 : 0.08);
                energonOrbs.forEach(orb => orb.scale.setScalar(orbPulse));
            }

            if (inChargingBay && player.chargerCooldown <= 0) {
                player.chargerCooldown = 7.0;
                sfx.playEnergyCharge();
                spawnEnergonLightningParticles(player.pos.x, player.pos.y + 1.2, player.pos.z, 28);
                player.energonBoostTimer = 10.0;
                player.boostTimer = 10.0;
                player.speed = Math.max(player.speed + 16, 56);
                showToast("⚡ ENERGON TURBO-CHARGED!", "Doc Greene's Overdrive: 10s Super Turbo!");
                triggerNPCSpeech("Doc Greene", "Lead Scientist", "Fascinating! The Energon Turbo-Charger is operating at one hundred and twenty percent efficiency!", { x: CHARGER_POS.x, y: chargerY + 5.0, z: CHARGER_POS.z }, true);
                speakBotCatchphrase(player.botType, 'CHARGER');
            }

            // =================================================================
            // ANIMATE & CHECK DOC GREENE'S GROUNDBRIDGE TELEPORTERS
            // =================================================================
            if (player.portalCooldown > 0) player.portalCooldown -= dt;

            if (groundBridgePortals) {
                groundBridgePortals.forEach(portal => {
                portal.irisRing1.rotation.z += dt * 2.2;
                portal.irisRing2.rotation.z -= dt * 2.8;
                portal.irisRing3.rotation.z += dt * 3.4;
                portal.vortexDisc.material.opacity = 0.55 + Math.sin(now * 0.005) * 0.18;

                if (player.portalCooldown <= 0) {
                    const distToPortal = Math.hypot(player.pos.x - portal.cfg.x, player.pos.z - portal.cfg.z);
                    if (distToPortal < 6.8 && player.pos.y < portal.baseY + 12.0) {
                        player.portalCooldown = 4.0;
                        sfx.playWarpWhoosh();
                        spawnWarpVortexParticles(player.pos.x, player.pos.y + 2.0, player.pos.z, 28);

                        const dest = portal.cfg.dest;
                        const destY = getTerrainHeight(dest.x, dest.z);
                        player.pos.set(dest.x, destY + 0.6, dest.z);
                        player.heading = dest.heading;
                        player.speed = Math.max(player.speed, 42.0);

                        spawnWarpVortexParticles(dest.x, destY + 2.0, dest.z, 28);
                        showToast("🌀 GROUNDBRIDGE TELEPORT!", `Warped via ${portal.cfg.name}!`);
                        triggerNPCSpeech("Doc Greene", "Lead Scientist", "GroundBridge connection stable! Instant transit across Griffin Rock!", { x: dest.x, y: destY + 4, z: dest.z }, true);
                        speakBotCatchphrase(player.botType, 'GROUNDBRIDGE');

                        if (buddyBot.botType) {
                            buddyBot.pos.set(dest.x - 3.5, destY + 0.6, dest.z - 4.5);
                            buddyBot.heading = dest.heading;
                            buddyBot.speed = player.speed;
                            spawnWarpVortexParticles(buddyBot.pos.x, destY + 2.0, buddyBot.pos.z, 16);
                        }
                    }
                }
            });
            }

            // =================================================================
            // 1C. ANIMATE & UPDATE SOUTH HARBOR RESCUE FERRY BOAT
            // =================================================================
            if (typeof ferryController !== 'undefined' && ferryController) {
                ferryController.timeInState += dt;
                ferryController.prevPos.copy(ferryController.currentPos);
                ferryController.prevRotY = ferryController.currentRotY;

                if (ferryController.state === 'DOCKED') {
                    if (ferryController.boardingCooldown > 0) {
                        ferryController.boardingCooldown -= dt;
                    }
                    ferryController.rampAngle = THREE.MathUtils.lerp(ferryController.rampAngle, 0.42, dt * 2.5);

                    // Transform player into boat local coordinates
                    const fdx = player.pos.x - ferryController.currentPos.x;
                    const fdz = player.pos.z - ferryController.currentPos.z;
                    const cosR = Math.cos(-ferryController.currentRotY);
                    const sinR = Math.sin(-ferryController.currentRotY);
                    const lx = fdx * cosR - fdz * sinR;
                    const lz = fdx * sinR + fdz * cosR;

                    const onCarDeck = Math.abs(lx) <= 6.2 && Math.abs(lz) <= 18.5 && player.pos.y >= ferryController.currentPos.y + 3.0 && player.pos.y <= ferryController.currentPos.y + 9.0;

                    if (onCarDeck) {
                        if (ferryController.boardingCooldown <= 0) {
                            if (!player.onFerry) {
                                player.onFerry = true;
                                sfx.playDockClank();
                                showToast("🚢 S.S. GRIFFIN ROCK", "Welcome aboard the Rescue Ferry!");
                                speakBotCatchphrase(player.botType, 'FERRY');
                                triggerNPCSpeech("Captain Shaw", "Harbor Master", "Welcome aboard the Rescue Ferry! All aboard for the South Harbor cruise!", { x: 36, y: 5.5, z: 1232 }, true);
                            }
                            if (ferryController.timeInState > 3.0) {
                                ferryController.state = 'CRUISING';
                                ferryController.timeInState = 0;
                                ferryController.cruiseTime = 0;
                                sfx.playShipHorn();
                                showToast("🚢 CAST OFF!", "Ferry sailing across South Harbor Bay!");
                            }
                        }
                    } else if (player.onFerry && (lz < -18.5 || Math.abs(lx) > 7.0 || player.pos.x < 24.0)) {
                        // Player walked off the ramp/gangway back onto pier
                        player.onFerry = false;
                    }
                } else if (ferryController.state === 'CRUISING') {
                    ferryController.rampAngle = THREE.MathUtils.lerp(ferryController.rampAngle, -0.65, dt * 2.5);
                    ferryController.cruiseTime += dt * 0.035; // ~28s scenic harbor bay cruise

                    const wps = ferryController.waypoints;
                    const totalLegs = wps.length - 1;
                    const progress = Math.min(0.999, ferryController.cruiseTime) * totalLegs;
                    const legIdx = Math.floor(progress);
                    const legFrac = progress - legIdx;
                    const p0 = wps[legIdx];
                    const p1 = wps[legIdx + 1];

                    const curX = THREE.MathUtils.lerp(p0.x, p1.x, legFrac);
                    const curZ = THREE.MathUtils.lerp(p0.z, p1.z, legFrac);
                    const targetHeading = Math.atan2(p1.x - p0.x, p1.z - p0.z);

                    ferryController.currentPos.x = curX;
                    ferryController.currentPos.z = curZ;

                    // Smooth angular heading interpolation
                    let angleDiff = (targetHeading - ferryController.currentRotY) % (Math.PI * 2);
                    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    ferryController.currentRotY += angleDiff * Math.min(1.0, dt * 2.4);

                    // Captain Shaw scenic cruise commentary
                    if (now - ferryController.lastCommentTime > 8500) {
                        ferryController.lastCommentTime = now;
                        const quotes = [
                            "Enjoy the fresh ocean sea spray, Rescue Bots! The bay is beautiful today.",
                            "Look at the scenic shoreline cliffs of Griffin Rock! What a view!",
                            "Smooth sailing across deep bay waters! Steady as she goes!"
                        ];
                        const q = quotes[Math.floor(Math.random() * quotes.length)];
                        triggerNPCSpeech("Captain Shaw", "Harbor Master", q, { x: ferryController.currentPos.x, y: 5.5, z: ferryController.currentPos.z }, true);
                    }

                    if (ferryController.cruiseTime >= 1.0) {
                        ferryController.state = 'DOCKED';
                        ferryController.timeInState = 0;
                        ferryController.boardingCooldown = 8.0; // 8s cooldown before next boarding/departure
                        ferryController.rampAngle = 0.42;
                        ferryController.currentPos.copy(ferryController.dockPos);
                        ferryController.currentRotY = ferryController.dockRotY;

                        // Forcibly offload player and buddy bot safely onto South Harbor Pier deck
                        if (player.onFerry) {
                            player.onFerry = false;
                            player.pos.set(8.0, 3.4, 1211.0);
                            player.heading = -Math.PI / 2; // Facing west toward mainland
                            player.speed = 0;
                            player.hasWaypoint = false;
                            if (typeof waypointGroup !== 'undefined') waypointGroup.visible = false;
                        }

                        if (buddyBot.botType) {
                            buddyBot.onFerry = false;
                            buddyBot.pos.set(8.0, 3.4, 1216.0);
                            buddyBot.heading = -Math.PI / 2;
                        }

                        sfx.playDockClank();
                        showToast("🚢 ALL ASHORE!", "Disembarked safely onto South Harbor Pier!");
                        triggerNPCSpeech("Captain Shaw", "Harbor Master", "All ashore at South Harbor! Safe travels across Griffin Rock, Rescue Bots!", { x: 36, y: 5.5, z: 1232 }, true);
                    }

                    // Periodic water wake particles behind the stern
                    if (Math.random() < 0.35) {
                        const sternX = ferryController.currentPos.x - Math.sin(ferryController.currentRotY) * 20;
                        const sternZ = ferryController.currentPos.z - Math.cos(ferryController.currentRotY) * 20;
                        spawnWaterWakeParticles(sternX, 0, sternZ, 4);
                    }
                }

                // Natural wave bobbing & rocking motion
                const ferryWaveY = -0.2 + Math.sin(now * 0.0028) * 0.28;
                const ferryRoll = Math.sin(now * 0.0022) * 0.025;
                const ferryPitch = Math.cos(now * 0.0019) * 0.018;

                ferryController.currentPos.y = ferryWaveY;
                harborFerryGroup.position.copy(ferryController.currentPos);
                harborFerryGroup.rotation.set(ferryPitch, ferryController.currentRotY, ferryRoll);
                if (ferryController.rampMesh) {
                    ferryController.rampMesh.rotation.x = ferryController.rampAngle;
                }

                // Rotational and translational displacement for riding bots
                const fDeltaRot = ferryController.currentRotY - ferryController.prevRotY;
                const cosDR = Math.cos(fDeltaRot);
                const sinDR = Math.sin(fDeltaRot);

                if (player.onFerry) {
                    if (isFlyingCopter && player.pos.y > 15) {
                        player.onFerry = false;
                    } else {
                        // 1. Rotate player position around previous ferry center by fDeltaRot
                        const relX = player.pos.x - ferryController.prevPos.x;
                        const relZ = player.pos.z - ferryController.prevPos.z;
                        const rotX = relX * cosDR - relZ * sinDR;
                        const rotZ = relX * sinDR + relZ * cosDR;

                        // 2. Translate with ferry displacement
                        player.pos.x = ferryController.currentPos.x + rotX;
                        player.pos.z = ferryController.currentPos.z + rotZ;
                        player.heading += fDeltaRot;
                        player.pos.y = ferryController.currentPos.y + 5.0;

                        // 3. Contain player securely within car deck railings during cruising
                        if (ferryController.state === 'CRUISING') {
                            const fdx = player.pos.x - ferryController.currentPos.x;
                            const fdz = player.pos.z - ferryController.currentPos.z;
                            const cosR = Math.cos(-ferryController.currentRotY);
                            const sinR = Math.sin(-ferryController.currentRotY);
                            let lx = fdx * cosR - fdz * sinR;
                            let lz = fdx * sinR + fdz * cosR;

                            const maxLx = 5.6;
                            const maxLz = 17.5;
                            if (Math.abs(lx) > maxLx || Math.abs(lz) > maxLz) {
                                lx = Math.max(-maxLx, Math.min(maxLx, lx));
                                lz = Math.max(-maxLz, Math.min(maxLz, lz));
                                const worldSin = Math.sin(ferryController.currentRotY);
                                const worldCos = Math.cos(ferryController.currentRotY);
                                player.pos.x = ferryController.currentPos.x + (lx * worldCos + lz * worldSin);
                                player.pos.z = ferryController.currentPos.z + (-lx * worldSin + lz * worldCos);
                            }
                        }
                    }
                }

                // Keep buddy bot smoothly riding along beside the player on the deck
                if (buddyBot.botType) {
                    if (player.onFerry && !buddyBot.flightAlt) {
                        buddyBot.onFerry = true;
                        const bDistToFerry = Math.hypot(buddyBot.pos.x - ferryController.currentPos.x, buddyBot.pos.z - ferryController.currentPos.z);
                        if (bDistToFerry > 22) {
                            // Position buddy bot on car deck behind player
                            buddyBot.pos.x = player.pos.x - Math.cos(ferryController.currentRotY) * 2.5;
                            buddyBot.pos.z = player.pos.z + Math.sin(ferryController.currentRotY) * 2.5;
                            buddyBot.pos.y = ferryController.currentPos.y + 5.0;
                        } else {
                            const bRelX = buddyBot.pos.x - ferryController.prevPos.x;
                            const bRelZ = buddyBot.pos.z - ferryController.prevPos.z;
                            const bRotX = bRelX * cosDR - bRelZ * sinDR;
                            const bRotZ = bRelX * sinDR + bRelZ * cosDR;
                            buddyBot.pos.x = ferryController.currentPos.x + bRotX;
                            buddyBot.pos.z = ferryController.currentPos.z + bRotZ;
                            buddyBot.heading += fDeltaRot;
                            buddyBot.pos.y = ferryController.currentPos.y + 5.0;

                            if (ferryController.state === 'CRUISING') {
                                const bFdx = buddyBot.pos.x - ferryController.currentPos.x;
                                const bFdz = buddyBot.pos.z - ferryController.currentPos.z;
                                const cosR = Math.cos(-ferryController.currentRotY);
                                const sinR = Math.sin(-ferryController.currentRotY);
                                let bLx = bFdx * cosR - bFdz * sinR;
                                let bLz = bFdx * sinR + bFdz * cosR;

                                const maxLx = 5.4;
                                const maxLz = 17.0;
                                if (Math.abs(bLx) > maxLx || Math.abs(bLz) > maxLz) {
                                    bLx = Math.max(-maxLx, Math.min(maxLx, bLx));
                                    bLz = Math.max(-maxLz, Math.min(maxLz, bLz));
                                    const worldSin = Math.sin(ferryController.currentRotY);
                                    const worldCos = Math.cos(ferryController.currentRotY);
                                    buddyBot.pos.x = ferryController.currentPos.x + (bLx * worldCos + bLz * worldSin);
                                    buddyBot.pos.z = ferryController.currentPos.z + (-bLx * worldSin + bLz * worldCos);
                                }
                            }
                        }
                    } else if (!player.onFerry) {
                        buddyBot.onFerry = false;
                    }
                }
            }

            // =================================================================
            // 3. ANIMATE & UPDATE HIGH-FLYING MAGNETIC GANTRY CRANE
            // =================================================================
            if (typeof craneInteractive !== 'undefined' && craneInteractive) {
                if (craneInteractive.cooldown > 0) craneInteractive.cooldown -= dt;

                // Animate Ground Pickup Pad Amber/Cyan Strobes
                craneInteractive.padLights.forEach((light, lIdx) => {
                    const strobeCycle = (Math.floor(now / 130) + lIdx) % 2 === 0;
                    light.material.color.setHex(strobeCycle ? 0xfacc15 : 0x38bdf8);
                });

                if (craneInteractive.state === 'IDLE') {
                    craneInteractive.boomPivot.rotation.y = THREE.MathUtils.lerp(craneInteractive.boomPivot.rotation.y, 0, dt * 2.0);
                    craneInteractive.cableMesh.scale.y = THREE.MathUtils.lerp(craneInteractive.cableMesh.scale.y, 1.0, dt * 3.0);
                    craneInteractive.cableMesh.position.y = -11;
                    craneInteractive.magnetGroup.position.y = -21.5;

                    const distToCranePad = Math.hypot(player.pos.x - craneInteractive.padX, player.pos.z - craneInteractive.padZ);
                    if (distToCranePad < 4.5 && player.grounded && craneInteractive.cooldown <= 0 && !player.inCrane) {
                        player.inCrane = true;
                        player.speed = 0;
                        craneInteractive.state = 'LOCKING';
                        craneInteractive.timer = 0.75;
                        sfx.playMagnetZap();
                        spawnMagnetSparkParticles(craneInteractive.padX, player.pos.y + 1.5, craneInteractive.padZ, 22);
                        showToast("🧲 GANTRY CRANE!", "Electromagnet locked onto Rescue Bot!");
                        speakBotCatchphrase(player.botType, 'CRANE');
                        triggerNPCSpeech("Graham Burns", "Chief Engineer", "Magnetic hoist engaged! Fasten your gears for a high-flying swing!", { x: craneInteractive.craneX, y: 28, z: craneInteractive.craneZ }, true);
                    }
                } else if (craneInteractive.state === 'LOCKING') {
                    craneInteractive.timer -= dt;
                    player.pos.x = craneInteractive.padX;
                    player.pos.z = craneInteractive.padZ;
                    player.speed = 0;
                    if (craneInteractive.timer <= 0) {
                        craneInteractive.state = 'HOISTING';
                        craneInteractive.timer = 1.35;
                        sfx.playWarpWhoosh();
                    }
                } else if (craneInteractive.state === 'HOISTING') {
                    craneInteractive.timer -= dt;
                    const hoistFrac = 1.0 - Math.max(0, craneInteractive.timer / 1.35);
                    const hoistY = THREE.MathUtils.lerp(2.0, 24.0, hoistFrac);
                    player.pos.x = craneInteractive.padX;
                    player.pos.z = craneInteractive.padZ;
                    player.pos.y = hoistY;
                    player.speed = 0;

                    const cableLen = Math.max(2.0, 26.0 - hoistY);
                    craneInteractive.cableMesh.scale.y = cableLen / 22.0;
                    craneInteractive.cableMesh.position.y = -cableLen * 0.5;
                    craneInteractive.magnetGroup.position.y = -cableLen - 0.4;

                    if (Math.random() < 0.3) {
                        spawnMagnetSparkParticles(player.pos.x, player.pos.y + 1.2, player.pos.z, 4);
                    }

                    if (craneInteractive.timer <= 0) {
                        craneInteractive.state = 'SWINGING';
                        craneInteractive.timer = 1.6;
                    }
                } else if (craneInteractive.state === 'SWINGING') {
                    craneInteractive.timer -= dt;
                    const swingFrac = 1.0 - Math.max(0, craneInteractive.timer / 1.6);
                    const swingAngle = swingFrac * Math.PI; // 180 degree rotation from north pad to south drop
                    craneInteractive.boomPivot.rotation.y = swingAngle;

                    const boomRadius = 24.0;
                    const rad = -Math.PI * 0.5 + swingAngle;
                    const curBx = craneInteractive.craneX + Math.cos(rad) * boomRadius;
                    const curBz = craneInteractive.craneZ - Math.sin(rad) * boomRadius;

                    player.pos.x = curBx;
                    player.pos.z = curBz;
                    player.pos.y = 24.5;
                    player.heading = swingAngle;
                    player.speed = 0;

                    if (craneInteractive.timer <= 0) {
                        craneInteractive.state = 'RELEASING';
                        craneInteractive.timer = 0.1;
                    }
                } else if (craneInteractive.state === 'RELEASING') {
                    player.inCrane = false;
                    craneInteractive.cooldown = 4.5;
                    craneInteractive.state = 'RESETTING';
                    craneInteractive.timer = 1.8;

                    sfx.playDockClank();
                    sfx.playMagnetZap();
                    spawnMagnetSparkParticles(player.pos.x, player.pos.y, player.pos.z, 28);

                    player.heading = 0; // Launch towards South Harbor bay stunt jump
                    player.speed = 46.0;
                    player.vy = 24.0;
                    player.grounded = false;
                    player.boostTimer = Math.max(player.boostTimer, 4.0);

                    showToast("🚀 CRANE LAUNCH!", "Super Sky Launch across South Harbor!");
                    speakBotCatchphrase(player.botType, 'STUNT');
                } else if (craneInteractive.state === 'RESETTING') {
                    craneInteractive.timer -= dt;
                    craneInteractive.boomPivot.rotation.y = THREE.MathUtils.lerp(craneInteractive.boomPivot.rotation.y, 0, dt * 2.2);
                    craneInteractive.cableMesh.scale.y = THREE.MathUtils.lerp(craneInteractive.cableMesh.scale.y, 1.0, dt * 2.5);
                    craneInteractive.cableMesh.position.y = -11;
                    craneInteractive.magnetGroup.position.y = -21.5;

                    if (craneInteractive.timer <= 0) {
                        craneInteractive.state = 'IDLE';
                    }
                }
            }

            // =================================================================
            // 4. ANIMATE & UPDATE DOC GREENE'S ANTI-GRAVITY TESTING YARD
            // =================================================================
            if (typeof testYard !== 'undefined' && testYard) {
                if (player.bounceCooldown > 0) player.bounceCooldown -= dt;
                const tyBaseY = testYard.baseY || 0.5;

                // 1. Super Mega-Bounce Pad at (-1170, 88)
                const distToBounce = Math.hypot(player.pos.x - testYard.bouncePad.x, player.pos.z - testYard.bouncePad.z);
                if (distToBounce < testYard.bouncePad.radius && player.pos.y < tyBaseY + 4.5 && player.bounceCooldown <= 0) {
                    player.bounceCooldown = 1.1;
                    player.grounded = false;
                    player.vy = 52.0; // Launches 50m high into orbit!
                    player.speed = Math.max(player.speed + 12.0, 42.0);
                    player.boostTimer = Math.max(player.boostTimer, 3.5);

                    sfx.playBoingSound();
                    spawnBurstParticles(testYard.bouncePad.x, tyBaseY + 1.2, testYard.bouncePad.z, 0x84cc16, 26, 1.6);
                    spawnSparkleGlints(testYard.bouncePad.x, tyBaseY + 1.5, testYard.bouncePad.z, 20);

                    if (testYard.bouncePad.mesh) {
                        testYard.bouncePad.mesh.scale.set(1.3, 0.35, 1.3);
                    }

                    showToast("🧪 MEGA BOUNCE PAD!", "50-Meter Orbital Super Bounce!");
                    speakBotCatchphrase(player.botType, 'BOUNCE');
                    triggerNPCSpeech("Frankie Greene", "Cadet", "Woohoo! Look at that orbital hangtime! High altitude test complete!", { x: testYard.baseX, y: tyBaseY + 4, z: testYard.baseZ }, true);
                }
                if (testYard.bouncePad.mesh) {
                    testYard.bouncePad.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 6.0);
                }

                // 2. Supersonic Rainbow Speed Strip at x: [-1210, -1130], z: 114
                const inSpeedStrip = (player.pos.x >= testYard.speedStrip.minX && player.pos.x <= testYard.speedStrip.maxX &&
                                      Math.abs(player.pos.z - testYard.speedStrip.z) < (testYard.speedStrip.width * 0.5) &&
                                      player.pos.y < tyBaseY + 4.5);
                if (inSpeedStrip) {
                    player.speed = Math.min(84.0, player.speed + 46.0 * dt);
                    player.boostTimer = Math.max(player.boostTimer, 2.5);
                    if (Math.random() < 0.45) {
                        spawnSparkleGlints(player.pos.x, player.pos.y + 0.8, player.pos.z, 4);
                    }
                }

                // 3. 4 Interactive Color Splat Targets
                const hwAimX = player.pos.x + Math.sin(player.heading) * 14;
                const hwAimZ = player.pos.z + Math.cos(player.heading) * 14;
                const waterShooting = player.waterTimer > 0 && player.botType === 'HEATWAVE';

                testYard.targets.forEach(tgt => {
                    if (tgt.cooldown > 0) tgt.cooldown -= dt;
                    if (tgt.wobble > 0) {
                        tgt.wobble -= dt * 4.5;
                        tgt.mesh.rotation.z = Math.sin(tgt.wobble * 12.0) * 0.35;
                        tgt.mesh.rotation.y = Math.cos(tgt.wobble * 10.0) * 0.25;
                    } else {
                        tgt.mesh.rotation.z = 0;
                        tgt.mesh.rotation.y = 0;
                    }

                    if (tgt.cooldown <= 0) {
                        const distToTgt = Math.hypot(player.pos.x - tgt.x, player.pos.z - tgt.z);
                        const hitByRam = distToTgt < 4.2 && Math.abs(player.pos.y - (tyBaseY + 4.5)) < 4.2;
                        const hitByWater = waterShooting && (Math.hypot(hwAimX - tgt.x, hwAimZ - tgt.z) < 12.0 || distToTgt < 14.0);

                        if (hitByRam || hitByWater) {
                            tgt.cooldown = 1.4;
                            tgt.wobble = 1.0;
                            sfx.playTargetSplat();
                            spawnPaintSplatParticles(tgt.x, tyBaseY + 4.5, tgt.z, tgt.color, 24);
                            showToast("🎯 TARGET HIT!", `${tgt.name} Splatted!`);

                            progression.totalStuntsCompleted = (progression.totalStuntsCompleted || 0) + 1;
                            saveProgression();

                            const newRank = getRescueStarRank();
                            if (newRank.level > lastKnownRankLevel) {
                                setLastKnownRankLevel(newRank.level);
                                sfx.playRankUp();
                                spawnBurstParticles(player.pos.x, player.pos.y + 3.5, player.pos.z, 0xfacc15, 22, 1.45);
                                showToast(`RANK UP! ${newRank.level}★`, `${newRank.title} Achieved!`);
                                speakBotCatchphrase(player.botType, 'RESCUE');
                            }
                        }
                    }
                });
            }

            // Animate Sunny Sands Ferris Wheel
            if (typeof ferrisWheelPivot !== 'undefined' && ferrisWheelPivot) {
                ferrisWheelPivot.rotation.z += dt * 0.45;
                if (typeof ferrisGondolas !== 'undefined') {
                    for (let i = 0; i < ferrisGondolas.length; i++) {
                        ferrisGondolas[i].rotation.z = -ferrisWheelPivot.rotation.z;
                    }
                }
                const distToWheel = Math.hypot(player.pos.x - bwX, player.pos.z - (bwZ - 12));
                if (distToWheel < 32 && (now - (player.lastBoardwalkSoundTime || 0) > 16000)) {
                    player.lastBoardwalkSoundTime = now;
                    sfx.playCarnivalChime();
                    showToast("🎡 SUNNY SANDS BOARDWALK!", "Carnival Music & Ocean Breeze!");
                    speakBotCatchphrase(player.botType, 'STUNT');
                }
            }

            // Animate Dino Ridge Baby Dinos & Amber Spire
            if (typeof babyDinos !== 'undefined' && babyDinos.length > 0) {
                const nowSecDino = now * 0.001;
                babyDinos.forEach(bd => {
                    const stomp = Math.sin(nowSecDino * 6.0 + bd.phase);
                    bd.leftLeg.rotation.x = stomp * 0.45;
                    bd.rightLeg.rotation.x = -stomp * 0.45;
                    bd.headPivot.rotation.x = Math.sin(nowSecDino * 4.0 + bd.phase) * 0.22;
                    bd.tail.rotation.y = Math.sin(nowSecDino * 8.0 + bd.phase) * 0.35;
                });
                if (typeof amberSpire !== 'undefined' && amberSpire) {
                    amberSpire.rotation.y += dt * 1.2;
                }
                const distToDinos = Math.hypot(player.pos.x - drX, player.pos.z - drZ);
                if (distToDinos < 28 && (now - (player.lastDinoSoundTime || 0) > 15000)) {
                    player.lastDinoSoundTime = now;
                    sfx.playBabyDinoRoar();
                    showToast("🦖 DINO RIDGE SANCTUARY!", "Baby Dinos happily greeted your Rescue Bot!");
                    speakBotCatchphrase(player.botType, 'DINO');
                }
            }

            // Animate Wayward Island Ancient Energon Shard
            if (typeof waywardEnergonShard !== 'undefined' && waywardEnergonShard) {
                waywardEnergonShard.rotation.y += dt * 0.85;
                const shardPulse = 1.0 + Math.sin(now * 0.004) * 0.15;
                waywardEnergonShard.scale.set(shardPulse, 1.8 * shardPulse, shardPulse);
            }

            // Animate & Check Sky Stunt Hoops
            stuntHoopRigs.forEach((rig, idx) => {
                if (rig.cooldown > 0) rig.cooldown -= dt;
                rig.starPivot.rotation.z += dt * 2.2;
                rig.group.position.y = rig.baseY + Math.sin(now * 0.003 + idx) * 0.55;

                if (rig.flashTimer > 0) {
                    rig.flashTimer -= dt;
                    const flashVal = Math.floor(now / 70) % 2 === 0 ? 0xffffff : 0xfacc15;
                    rig.torusMesh.material.color.setHex(flashVal);
                    rig.haloMesh.scale.setScalar(1.25 + Math.sin(now * 0.02) * 0.15);
                } else {
                    rig.torusMesh.material.color.setHex(rig.def.color);
                    rig.haloMesh.scale.setScalar(1.0 + Math.sin(now * 0.005 + idx) * 0.05);
                }

                if (rig.cooldown <= 0) {
                    const distToHoop = Math.hypot(
                        player.pos.x - rig.def.x,
                        player.pos.y - rig.group.position.y,
                        player.pos.z - rig.def.z
                    );
                    if (distToHoop < rig.def.radius) {
                        rig.cooldown = 4.0;
                        rig.flashTimer = 1.0;
                        sfx.playStuntChime();
                        spawnBurstParticles(rig.def.x, rig.group.position.y, rig.def.z, 0xfacc15, 20, 1.4);
                        spawnSparkleGlints(rig.def.x, rig.group.position.y, rig.def.z, 16);

                        player.speed = Math.max(player.speed + 22, isFlyingCopter ? 78 : 65);
                        player.boostTimer = Math.max(player.boostTimer, 2.5);

                        progression.totalStuntsCompleted = (progression.totalStuntsCompleted || 0) + 1;
                        saveProgression();

                        showToast("⭐ SKY STUNT!", `${rig.def.name} Cleared! (${progression.totalStuntsCompleted} Total)`);
                        speakBotCatchphrase(player.botType, 'STUNT');

                        const newRank = getRescueStarRank();
                        if (newRank.level > lastKnownRankLevel) {
                            setLastKnownRankLevel(newRank.level);
                            sfx.playRankUp();
                            spawnBurstParticles(player.pos.x, player.pos.y + 3.5, player.pos.z, 0xfacc15, 22, 1.45);
                            showToast(`RANK UP! ${newRank.level}★`, `${newRank.title} Achieved!`);
                            speakBotCatchphrase(player.botType, 'RESCUE');
                        }
                    }
                }
            });

            const nowSec = now * 0.001;
            const restoredCount = beacons.filter(b => b.restored).length;

            beacons.forEach(b => {
                if (!b.restored) {
                    const pulse = 1 + Math.sin(now * 0.008) * 0.18;
                    b.orb.scale.setScalar(pulse);
                    if (b.type === 'FIRE') {
                        b.nodes.forEach((n, idx) => {
                            if (!n.cleared) {
                                n.mesh.scale.y = 0.85 + Math.sin(now * 0.015 + idx) * 0.28;
                                n.mesh.rotation.y += dt * 2.5;
                            }
                        });
                    }
                } else if (
                    progression.autoSpawnEmergencies &&
                    restoredCount >= 2 &&
                    restoredCount < beacons.length &&
                    b.restoredAtTime > 0 &&
                    (nowSec - b.restoredAtTime) > 65.0 &&
                    Math.hypot(player.pos.x - b.x, player.pos.z - b.z) > 220.0
                ) {
                    // Dynamically re-dispatch distant resolved sites after 65s so the island stays perpetually alive!
                    respawnSingleBeacon(b, true);
                }
            });

            const _perfT0 = performance.now();
            updatePhysics(dt, now);
            const _perfTPhys = performance.now() - _perfT0;

            updateBuddyBotAI(dt, now);
            updateEnergonCubes(dt, now);
            updateGoldenCrests(dt, now);
            updateInteractiveRoadProps(dt);
            updateEmergentRescues(dt, now);
            updateVisitingAutobots(dt, now);
            updateLandmarkDiscovery(player.pos.x, player.pos.z);
            updateAllBotTransforms(dt, now);

            const _perfT1 = performance.now();
            updateIslandTrain(dt, now);
            const _perfTTrain = performance.now() - _perfT1;

            const _perfT2 = performance.now();
            updateLivingWorldNPCs(dt, now);
            const _perfTNPC = performance.now() - _perfT2;

            updateMorBotBattle(dt, now);
            updateViewportCulling();

            // Update 3D Comic Speech Bubble Screen Projection
            if (activeSpeech && activeSpeech.visible) {
                activeSpeech.timer -= dt;
                if (activeSpeech.timer <= 0) {
                    activeSpeech.visible = false;
                    const bubbleEl = document.getElementById('npc-world-bubble');
                    if (bubbleEl) bubbleEl.classList.add('hidden');
                } else {
                    const bubbleEl = document.getElementById('npc-world-bubble');
                    const bubbleTail = document.getElementById('world-bubble-tail');
                    if (bubbleEl) {
                        let wx = 0, wy = 0, wz = 0;
                        const s = activeSpeech.source;
                        if (s) {
                            if (s.pos) {
                                wx = s.pos.x; wy = s.pos.y; wz = s.pos.z;
                            } else if (s.rig && s.rig.root) {
                                wx = s.rig.root.position.x;
                                wy = s.rig.root.position.y;
                                wz = s.rig.root.position.z;
                            } else if (s.x !== undefined) {
                                wx = s.x;
                                wy = s.y !== undefined ? s.y : getTerrainHeight(s.x, s.z);
                                wz = s.z;
                            }
                        }

                        let curYOffset = activeSpeech.yOffset;
                        if (s === player || s === buddyBot) {
                            curYOffset = (player.mode === 'VEHICLE') ? 4.2 : 7.2;
                        }

                        const bubbleWorldPos = new THREE.Vector3(wx, wy + curYOffset, wz);
                        const distToCam = camera.position.distanceTo(bubbleWorldPos);

                        bubbleWorldPos.project(camera);
                        const inFront = bubbleWorldPos.z < 1.0;

                        if (inFront && distToCam < 95.0) {
                            const screenX = (bubbleWorldPos.x * 0.5 + 0.5) * window.innerWidth;
                            const screenY = (-bubbleWorldPos.y * 0.5 + 0.5) * window.innerHeight;

                            const clampX = Math.max(150, Math.min(window.innerWidth - 150, screenX));
                            const clampY = Math.max(75, Math.min(window.innerHeight - 85, screenY));

                            const scale = THREE.MathUtils.clamp(1.0 - (distToCam - 14) * 0.004, 0.82, 1.12);

                            bubbleEl.style.left = `${clampX}px`;
                            bubbleEl.style.top = `${clampY}px`;
                            bubbleEl.style.transform = `translate(-50%, -100%) scale(${scale})`;
                            bubbleEl.style.opacity = '1';

                            if (bubbleTail) {
                                bubbleTail.style.display = 'flex';
                                const tailOffset = Math.max(-95, Math.min(95, screenX - clampX));
                                bubbleTail.style.transform = `translateX(${tailOffset}px)`;
                            }
                        } else {
                            // Distant caller or behind camera: Dock at top-center as an incoming radio call
                            bubbleEl.style.left = '50%';
                            bubbleEl.style.top = '95px';
                            bubbleEl.style.transform = 'translate(-50%, 0) scale(1.0)';
                            bubbleEl.style.opacity = '1';
                            if (bubbleTail) bubbleTail.style.display = 'none';
                        }
                    }
                }
            }

            const _perfTRender0 = performance.now();
            renderer.render(scene, camera);
            const _perfTRender = performance.now() - _perfTRender0;

            const _perfTotalMs = performance.now() - _perfT0;
            if (_perfTotalMs > 24.0) {
                let distToTrain = 999;
                if (typeof islandTrain !== 'undefined' && islandTrain.cars.length > 0) {
                    distToTrain = Math.hypot(player.pos.x - islandTrain.cars[0].x, player.pos.z - islandTrain.cars[0].z);
                }
                console.warn('[FRAME LAG SPIKE]', {
                    frameMs: _perfTotalMs.toFixed(1),
                    physicsMs: _perfTPhys.toFixed(1),
                    trainMs: _perfTTrain.toFixed(1),
                    npcMs: _perfTNPC.toFixed(1),
                    renderMs: _perfTRender.toFixed(1),
                    particles: activeParticles.length,
                    distToTrain: Math.round(distToTrain),
                    botSpeed: player.speed ? player.speed.toFixed(1) : 0
                });
            }
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });


if (typeof window !== 'undefined') {
    window.animate = animate;
}

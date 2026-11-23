// Visiting Autobot Allies (Optimus Prime, Bumblebee, Blurr, Salvage, High Tide & Servo)
import * as THREE from 'three';
import type { BotRig } from '../types/game.js';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import {
    toonGrad3, matHighTideGold, matChrome, applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs, registerCullableObject } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression, isBotDocked } from '../progression/progression.js';
import { showToast, triggerNPCSpeech, type SpeechTarget } from '../ui/dialogs.js';
import { spawnBurstParticles } from './emergencies.js';

import { applyBotRigMorph, buildRescueBotModel } from '../bots/botRigs.js';
import { syncProgressionHUD } from '../progression/progression.js';
import { spawnSparkleGlints } from './emergencies.js';
import { updateBotRosterUI, syncHUDToActiveBot } from '../physics/player.js';
import { texHelipad } from '../rendering/textures.js';
import { SVG_ICONS } from '../ui/icons.js';
import {
    buildServoPupModel,
    createHighTideShipMesh,
    createOptimusTrailerMesh,
    createBoulderBucketMesh,
    createChaseTrailerMesh,
    createHeatwaveTrailerMesh,
    createQuickshadowBomberMesh,
    createBumblebeeMonsterMesh,
    createBlurrMonsterMesh,
    createSalvageDumpsterMesh,
    createBladesCargoMesh
} from './allyModels.js';

export {
    buildServoPupModel,
    createHighTideShipMesh,
    createOptimusTrailerMesh,
    createBoulderBucketMesh,
    createChaseTrailerMesh,
    createHeatwaveTrailerMesh,
    createQuickshadowBomberMesh,
    createBumblebeeMonsterMesh,
    createBlurrMonsterMesh,
    createSalvageDumpsterMesh,
    createBladesCargoMesh
};

export type ServoPupRig = ReturnType<typeof buildServoPupModel>;

export interface VisitingAutobotEntry {
    id: string;
    name: string;
    role: string;
    voicePitch: number;
    badgeColor: string;
    x: number;
    y: number;
    z: number;
    rotY: number;
    dialogues: string[];
    root: THREE.Group;
    charRig: BotRig;
    isRaptor: boolean;
    servo: ServoPupRig | null;
    holoGlobe: THREE.Mesh | null;
    holoProjector: THREE.Mesh | null;
    lastSpeechTime: number;
}

export let visitingAutobots: VisitingAutobotEntry[] = [];
export let servoPupRig: ServoPupRig | null = null;

export function syncVisitingAutobotsVisibility() {
    if (typeof visitingAutobots === 'undefined' || !visitingAutobots) return;
    for (let i = 0; i < visitingAutobots.length; i++) {
        const ally = visitingAutobots[i];
        const isOccupied = (player.botType === ally.id) || (buddyBot && buddyBot.botType === ally.id);
        if (ally.charRig && ally.charRig.root) {
            ally.charRig.root.visible = !isOccupied;
        }
        if (ally.holoGlobe) ally.holoGlobe.visible = !isOccupied;
        if (ally.holoProjector) ally.holoProjector.visible = !isOccupied;
        if (ally.servo && ally.servo.root) ally.servo.root.visible = !isOccupied;
    }
}

        const matOceanPlatformSteel = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });

        // =====================================================================
        // VISITING AUTOBOTS REGISTRY & ENVIRONMENT INTEGRATION
        // =====================================================================
        const VISITING_AUTOBOTS_CONFIG = [
            {
                id: 'OPTIMUS',
                name: 'OPTIMUS PRIME',
                role: 'Autobot Supreme Commander',
                voicePitch: 0.72,
                badgeColor: '#dc2626',
                x: 762,
                y: 68.0,
                z: -780,
                rotY: -2.35,
                dialogues: [
                    "Greetings, Rescue Bots. Griffin Rock is safe in your capable hands. Freedom is the right of all sentient beings.",
                    "Chief Burns and the Burns family have proven that teamwork between humans and Autobots is the key to true heroism.",
                    "Stand tall, heroes. You embody the finest ideals of the Autobot Rescue Force. Roll to the rescue!"
                ]
            },
            {
                id: 'BUMBLEBEE',
                name: 'BUMBLEBEE',
                role: 'Autobot Scout & Dinobot Ally',
                voicePitch: 1.14,
                badgeColor: '#facc15',
                x: 2020,
                y: 18.62,
                z: 510,
                rotY: 1.8,
                dialogues: [
                    "Hey, partner! Awesome to see you! Check out my new Dinobot Raptor mode! Rescue Bots, ROAR!",
                    "Griffin Rock is an amazing island. Don't worry, if you ever need high-speed backup on a rescue, I'm right here!",
                    "Blades helped me tune my raptor roar! Remember: true heroes never back down! Let's save the day!"
                ]
            },
            {
                id: 'BLURR',
                name: 'BLURR',
                role: 'Hyper-Speed Rescue Specialist',
                voicePitch: 1.28,
                badgeColor: '#8b5cf6',
                x: -1180,
                y: 5.2,
                z: 84,
                rotY: 1.57,
                dialogues: [
                    "Whoa-whoa-whoa! Did you see that radar speed trap?! Two hundred and fifty miles an hour and I wasn't even in top gear!",
                    "Doc Greene said this speed strip has the lowest friction coefficient on the entire East Coast! You wanna race?!",
                    "Emergency at the other side of Griffin Rock?! Just say the word, I'll be there before the sirens finish warming up!"
                ]
            },
            {
                id: 'SALVAGE',
                name: 'SALVAGE',
                role: 'Reclamation & Recycling Hero',
                voicePitch: 0.82,
                badgeColor: '#84cc16',
                x: -54,
                y: 3.0,
                z: 1140,
                rotY: 0.35,
                dialogues: [
                    "One bot's scrap is another bot's treasure! I'm helping keep Griffin Rock's harbors and waterways spotless.",
                    "Always remember: reuse, recycle, and rescue! Everything can be repaired with a little care and a good wrench.",
                    "You're doing great out there, Rescue Bot. Every piece of debris cleared makes this island safer for everyone!"
                ]
            },
            {
                id: 'HIGHTIDE',
                name: 'HIGH TIDE',
                role: 'Deep-Ocean Rescue Commander',
                voicePitch: 0.76,
                badgeColor: '#1d4ed8',
                x: -60,
                y: 1.0,
                z: 1480,
                rotY: -1.2,
                dialogues: [
                    "Attention on deck, Rescue Bots! The ocean forgives no mistakes. Discipline and swift response save lives at sea!",
                    "Servo and I run offshore deep-water patrol. If a tidal surge or marine storm hits South Harbor, we're ready!",
                    "You've proven your mettle on land, bots. Keep that same steadfast resolve, and Griffin Rock will always stand strong!"
                ]
            },
            {
                id: 'QUICKSHADOW',
                name: 'QUICKSHADOW',
                role: 'Covert Operations Specialist',
                voicePitch: 1.22,
                badgeColor: '#0284c7',
                x: 24,
                y: 6.0,
                z: -1105,
                rotY: 3.14,
                dialogues: [
                    "I am where you don't think I am! Quickshadow, covert operations specialist. Keeping Griffin Rock secure from the shadows.",
                    "Discretion and precision are everything. When a mission requires high stealth and surgical speed, I take the wheel.",
                    "Impressive reflexes, darling! A skilled agent knows that true strength lies in knowing exactly when and where to strike."
                ]
            }
        ];

        visitingAutobots = [];

        export function toggleBumblebeeMorph(toRaptor: boolean | null = null) {
            const bee = visitingAutobots.find(a => a.id === 'BUMBLEBEE');
            if (!bee || !bee.charRig) return;
            const nextState = (toRaptor !== null) ? toRaptor : !bee.isRaptor;
            if (bee.isRaptor === nextState) return;

            bee.isRaptor = nextState;
            sfx.playTransform(!nextState);
            if (nextState) {
                sfx.playBabyDinoRoar();
            }
            spawnBurstParticles(bee.x, bee.y + 2.8, bee.z, 0xfacc15, 28, 1.8);
            spawnSparkleGlints(bee.x, bee.y + 2.4, bee.z, 20);

            applyBotRigMorph(bee.charRig, 0, bee.isRaptor ? 1.0 : 0, 0, 0, 0, 0);

            if (bee.isRaptor) {
                showToast("🦖 DINOBOT RAPTOR MODE!", "Bumblebee shifted to Velociraptor Form!");
                triggerNPCSpeech("Bumblebee", "Dinobot Raptor Ally", "RAWR! Check out my Raptor Mode! Ready to pounce on every hazard across Griffin Rock!", bee.root as unknown as SpeechTarget, true);
            } else {
                showToast("🏎️ AUTOBOT BOT MODE!", "Bumblebee transformed into Heroic Bot Form!");
                triggerNPCSpeech("Bumblebee", "Autobot Scout", "Back in Bot Mode and ready to roll! Teamwork saves the day!", bee.root as unknown as SpeechTarget, true);
            }
        }

        export function discoverVisitingAutobot(ally: VisitingAutobotEntry) {
            if (!Array.isArray(progression.discoveredAllies)) {
                progression.discoveredAllies = [];
            }
            if (progression.discoveredAllies.includes(ally.id)) return;

            progression.discoveredAllies.push(ally.id);
            progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + 50;
            saveProgression();
            syncProgressionHUD();
            updateBotRosterUI();
            syncHUDToActiveBot();

            sfx.playRankUp();
            spawnBurstParticles(ally.x, ally.y + 4.0, ally.z, 0xfacc15, 34, 2.2);
            spawnSparkleGlints(ally.x, ally.y + 2.5, ally.z, 26);

            showToast(`⭐ ${ally.name.toUpperCase()} UNLOCKED!`, `Added to Rescue Roster! (+50 Energon)`);
            triggerNPCSpeech(ally.name, ally.role, ally.dialogues[0], ally.root as unknown as SpeechTarget, true);

            if (ally.id === 'BUMBLEBEE') {
                setTimeout(() => {
                    toggleBumblebeeMorph(true);
                }, 1400);
            }
        }

        // =====================================================================
        // HIGH TIDE CYBERTRONIAN OCEANIC RESCUE VESSEL & WORLD MEGA ATTACHMENTS
        // =====================================================================
        export let highTideWorldShip: THREE.Group | null = null;
        export let optimusWorldTrailer: THREE.Group | null = null;

        export const WORLD_MEGA_ATTACHMENTS: Record<string, THREE.Group | null> = {
            BOULDER: null,
            HEATWAVE: null,
            CHASE: null,
            BLADES: null,
            OPTIMUS: null,
            BUMBLEBEE: null,
            BLURR: null,
            SALVAGE: null,
            QUICKSHADOW: null,
            HIGHTIDE: null
        };

        export const WORLD_MEGA_LOCATIONS: Record<string, { x: number; z: number; rotY: number }> = {
            BOULDER:     { x: -74,  z: -16,  rotY: 0.2 },
            HEATWAVE:    { x: -64,  z: -28,  rotY: 0.0 },
            CHASE:       { x: -80,  z: -50,  rotY: 0.0 },
            BLADES:      { x: -70,  z: 80,   rotY: 0.4 },
            OPTIMUS:     { x: -22,  z: -38,  rotY: 0.0 },
            BUMBLEBEE:   { x: 1980, z: 505,  rotY: 1.57 },
            BLURR:       { x: -1160,z: 80,   rotY: 1.57 },
            SALVAGE:     { x: -68,  z: 1135, rotY: 0.4 },
            QUICKSHADOW: { x: 42,   z: -1100,rotY: 3.14 },
            HIGHTIDE:    { x: -95,  z: 1480, rotY: 0.35 }
        };

        export function initVisitingAutobots(scene?: THREE.Scene | null) {
            if (!Array.isArray(progression.discoveredAllies)) {
                progression.discoveredAllies = [];
            }
            const sceneRef = (scene || (typeof window !== "undefined" ? window.scene : null));

            // High Tide Cybertronian Oceanic Rescue Vessel moored in South Harbor Bay (X: -95, Z: 1480)
            if (!highTideWorldShip) {
                highTideWorldShip = createHighTideShipMesh();
                highTideWorldShip.position.set(-95, -0.45, 1480);
                highTideWorldShip.rotation.y = 0.35;
                if (sceneRef) sceneRef.add(highTideWorldShip);
                const isPlayerHighTideMega = (player.botType === 'HIGHTIDE' && Boolean(progression.highTideDocked));
                highTideWorldShip.visible = !isPlayerHighTideMega;
                if (typeof window !== 'undefined') window.highTideWorldShip = highTideWorldShip;
            }
            WORLD_MEGA_ATTACHMENTS.HIGHTIDE = highTideWorldShip;

            // Optimus Prime Apex Command Trailer parked at Rescue HQ swap pad area (X: -22, Z: -38)
            if (!optimusWorldTrailer) {
                optimusWorldTrailer = createOptimusTrailerMesh();
                const trailerGroundY = getSurfaceHeight(-22, -38);
                optimusWorldTrailer.position.set(-22, trailerGroundY, -38);
                optimusWorldTrailer.rotation.y = 0;
                if (sceneRef) sceneRef.add(optimusWorldTrailer);
                const isPlayerOptimusMega = (player.botType === 'OPTIMUS' && Boolean(progression.optimusDocked));
                optimusWorldTrailer.visible = !isPlayerOptimusMega;
                if (typeof window !== 'undefined') window.optimusWorldTrailer = optimusWorldTrailer;
            }
            WORLD_MEGA_ATTACHMENTS.OPTIMUS = optimusWorldTrailer;

            // Initialize all other playable bot mega attachments across the island
            const BUILDERS: Record<string, () => THREE.Group> = {
                BOULDER: createBoulderBucketMesh,
                HEATWAVE: createHeatwaveTrailerMesh,
                CHASE: createChaseTrailerMesh,
                BLADES: createBladesCargoMesh,
                BUMBLEBEE: createBumblebeeMonsterMesh,
                BLURR: createBlurrMonsterMesh,
                SALVAGE: createSalvageDumpsterMesh,
                QUICKSHADOW: createQuickshadowBomberMesh
            };

            Object.entries(BUILDERS).forEach(([botKey, builderFn]) => {
                if (!WORLD_MEGA_ATTACHMENTS[botKey]) {
                    const mesh = builderFn();
                    const loc = WORLD_MEGA_LOCATIONS[botKey];
                    const gy = getSurfaceHeight(loc.x, loc.z);
                    mesh.position.set(loc.x, gy, loc.z);
                    mesh.rotation.y = loc.rotY || 0;
                    if (sceneRef) sceneRef.add(mesh);
                    mesh.visible = !(player.botType === botKey && isBotDocked(botKey));
                    WORLD_MEGA_ATTACHMENTS[botKey] = mesh;
                    if (typeof window !== 'undefined') window[`${botKey.toLowerCase()}WorldAttachment`] = mesh;
                }
            });

            VISITING_AUTOBOTS_CONFIG.forEach(cfg => {
                const grp = new THREE.Group();
                grp.position.set(cfg.x, cfg.y, cfg.z);
                grp.rotation.y = cfg.rotY;

                const charRig = buildRescueBotModel(cfg.id);
                applyBotRigMorph(charRig, 0, 0, 0, 0, 0, 0);
                grp.add(charRig.root);

                let servoModel = null;
                let holoGlobe = null;
                let holoProjector = null;

                if (cfg.id === 'OPTIMUS') {
                    // Holographic Earth / Griffin Rock Projector directly on helipad surface
                    holoProjector = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.4, 12), matChrome);
                    holoProjector.position.set(0, 0.2, 2.8);
                    holoGlobe = new THREE.Mesh(
                        new THREE.SphereGeometry(0.75, 12, 12),
                        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.65 })
                    );
                    holoGlobe.position.set(0, 1.45, 2.8);
                    holoGlobe.userData.noOutline = true;
                    grp.add(holoProjector, holoGlobe);

                } else if (cfg.id === 'BUMBLEBEE') {
                    // Wayward Island Ancient Cybertronian Ruins Dais
                    const dais = new THREE.Mesh(
                        new THREE.CylinderGeometry(4.0, 4.5, 0.9, 10),
                        new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 })
                    );
                    dais.position.y = -0.45;
                    const energonPillars = new THREE.Group();
                    [-2.6, 2.6].forEach(px => {
                        const crystal = new THREE.Mesh(
                            new THREE.ConeGeometry(0.45, 2.2, 5),
                            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
                        );
                        crystal.position.set(px, 1.1, 0);
                        crystal.userData.noOutline = true;
                        energonPillars.add(crystal);
                    });
                    dais.add(energonPillars);
                    grp.add(dais);

                } else if (cfg.id === 'BLURR') {
                    // Testing Yard Speed Strip Staging Pad & Telemetry Radar Tower
                    const speedPad = new THREE.Mesh(
                        new THREE.BoxGeometry(6.5, 0.35, 9.5),
                        new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 })
                    );
                    speedPad.position.y = -0.15;
                    const startLine = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.05, 0.6), matVisorGold);
                    startLine.position.set(0, 0.2, 3.8);
                    startLine.userData.noOutline = true;

                    // Telemetry Tower with Warning Lights
                    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.5, 0.5), matChrome);
                    tower.position.set(3.4, 2.6, -1.5);
                    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), matBeeGlowCyan);
                    beacon.position.set(3.4, 5.5, -1.5);
                    beacon.userData.noOutline = true;
                    speedPad.add(startLine, tower, beacon);
                    grp.add(speedPad);

                } else if (cfg.id === 'SALVAGE') {
                    // Stands in open harbor storage yard

                } else if (cfg.id === 'HIGHTIDE') {
                    // Faithful Companion Pup Servo
                    servoModel = buildServoPupModel();
                    servoModel.root.position.set(3.2, 0, 1.2);
                    grp.add(servoModel.root);

                    // Offshore Marine Rig Training Platform in South Harbor Bay
                    // 24m x 24m floating platform with helipad, safety rails, lifebuoys & marine beacons
                    const platform = new THREE.Group();
                    platform.position.y = -0.55;

                    const deck = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 24), matOceanPlatformSteel);
                    deck.castShadow = true;
                    platform.add(deck);

                    // Helipad Target Marking on Rig
                    const heliPadMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(14, 0.08, 14),
                        new THREE.MeshBasicMaterial({ map: texHelipad })
                    );
                    heliPadMesh.position.y = 0.62;
                    heliPadMesh.userData.noOutline = true;
                    platform.add(heliPadMesh);

                    // Yellow Perimeter Safety Rails & Marine Light Pylons
                    const railMat = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
                    [[-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5]].forEach(([cx, cz], idx) => {
                        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8), matChrome);
                        pylon.position.set(cx, 1.6, cz);
                        const beaconMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0x22c55e : 0xef4444 });
                        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), beaconMat);
                        beacon.position.set(cx, 3.4, cz);
                        beacon.userData.noOutline = true;
                        platform.add(pylon, beacon);
                    });

                    // Perimeter Handrail Tubes
                    [[-11.6, 0, 0, 23.2], [11.6, 0, 0, 23.2], [0, 0, -11.6, 23.2], [0, 0, 11.6, 23.2]].forEach(([rx, ry, rz, len], idx) => {
                        const railTube = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.12, 0.12, len, 8).rotateZ(idx >= 2 ? Math.PI / 2 : 0).rotateX(idx < 2 ? Math.PI / 2 : 0),
                            railMat
                        );
                        railTube.position.set(rx, 1.8, rz);
                        platform.add(railTube);
                    });

                    grp.add(platform);

                } else if (cfg.id === 'QUICKSHADOW') {
                    // North Observatory Research Plaza Covert Ops Staging Pad
                    const pad = new THREE.Mesh(
                        new THREE.CylinderGeometry(4.2, 4.6, 0.4, 16),
                        new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 })
                    );
                    pad.position.y = -0.2;
                    const neonRing = new THREE.Mesh(
                        new THREE.RingGeometry(3.6, 3.9, 24).rotateX(-Math.PI / 2),
                        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
                    );
                    neonRing.position.y = 0.22;
                    neonRing.userData.noOutline = true;
                    pad.add(neonRing);
                    grp.add(pad);
                }

                if (sceneRef) sceneRef.add(grp);
                registerCullableObject(grp, cfg.x, cfg.y, cfg.z, 36);

                visitingAutobots.push({
                    id: cfg.id,
                    name: cfg.name,
                    role: cfg.role,
                    voicePitch: cfg.voicePitch,
                    badgeColor: cfg.badgeColor,
                    x: cfg.x,
                    y: cfg.y,
                    z: cfg.z,
                    rotY: cfg.rotY,
                    dialogues: cfg.dialogues,
                    root: grp,
                    charRig,
                    isRaptor: false,
                    servo: servoModel,
                    holoGlobe,
                    holoProjector,
                    lastSpeechTime: 0
                });
            });

            syncVisitingAutobotsVisibility();
        }

        export function updateVisitingAutobots(dt: number, now: number) {
            const nowSec = now * 0.001;
            if (!visitingAutobots || visitingAutobots.length === 0) return;

            for (let i = 0; i < visitingAutobots.length; i++) {
                const ally = visitingAutobots[i];
                const isOccupied = (player.botType === ally.id) || (buddyBot && buddyBot.botType === ally.id);

                // Disappear in world if the player or buddy is this character
                if (ally.charRig && ally.charRig.root) {
                    ally.charRig.root.visible = !isOccupied;
                }
                if (ally.holoGlobe) ally.holoGlobe.visible = !isOccupied;
                if (ally.holoProjector) ally.holoProjector.visible = !isOccupied;
                if (ally.servo && ally.servo.root) ally.servo.root.visible = !isOccupied;

                if (isOccupied) continue;
                if (!ally.root.visible) continue;

                // 1. Idle Breathing Animation / Morph Update
                if (ally.id === 'BUMBLEBEE' && ally.isRaptor) {
                    applyBotRigMorph(ally.charRig, 0, 1.0, 0, 0, 0, now);
                } else if (ally.charRig && ally.charRig.torso) {
                    const breath = Math.sin(nowSec * 2.5 + (i * 1.3)) * 0.04;
                    ally.charRig.torso.position.y = 3.65 + breath;
                }

                // 2. Head Tracking towards Player (< 35m)
                const dx = player.pos.x - ally.x;
                const dz = player.pos.z - ally.z;
                const dist = Math.hypot(dx, dz);
                const activeHead = ally.charRig ? ally.charRig.head : null;
                if (activeHead && dist < 35.0) {
                    const targetAngle = Math.atan2(dx, dz) - ally.rotY;
                    const clampedAngle = THREE.MathUtils.clamp(targetAngle, -1.2, 1.2);
                    activeHead.rotation.y = THREE.MathUtils.lerp(activeHead.rotation.y, clampedAngle, dt * 4.0);
                } else if (activeHead) {
                    activeHead.rotation.y = THREE.MathUtils.lerp(activeHead.rotation.y, 0, dt * 2.0);
                }

                // 3. Character Specific Idles
                if (ally.id === 'OPTIMUS') {
                    if (ally.holoGlobe) {
                        ally.holoGlobe.rotation.y += dt * 0.75;
                        ally.holoGlobe.rotation.x = Math.sin(nowSec * 1.5) * 0.15;
                    }
                } else if (ally.id === 'HIGHTIDE') {
                    const propellers = ally.charRig?.propellers as THREE.Object3D[] | undefined;
                    if (propellers) {
                        propellers.forEach((p: THREE.Object3D) => {
                            p.rotation.z += dt * 3.5;
                        });
                    }
                    if (ally.servo) {
                        if (ally.servo.tail) {
                            ally.servo.tail.rotation.y = Math.sin(nowSec * 12.0) * 0.45;
                        }
                        if (ally.servo.leftEar && ally.servo.rightEar) {
                            const bounce = Math.sin(nowSec * 6.0) * 0.18;
                            ally.servo.leftEar.rotation.z = 0.3 + bounce;
                            ally.servo.rightEar.rotation.z = -0.3 - bounce;
                        }
                        if (ally.servo.head && dist < 25.0) {
                            const sdx = player.pos.x - (ally.x + 3.2);
                            const sdz = player.pos.z - (ally.z + 1.2);
                            ally.servo.head.rotation.y = Math.atan2(sdx, sdz) - ally.rotY;
                        }
                    }
                }

                // 4. Proximity Discovery & Voiced Dialogue
                const isDiscovered = Array.isArray(progression.discoveredAllies) && progression.discoveredAllies.includes(ally.id);
                if (!isDiscovered && dist < 16.0) {
                    discoverVisitingAutobot(ally);
                } else if (isDiscovered && dist < 10.0 && (nowSec - ally.lastSpeechTime > 14.0)) {
                    ally.lastSpeechTime = nowSec;
                    const randomDialogue = ally.dialogues[Math.floor(Math.random() * ally.dialogues.length)];
                    triggerNPCSpeech(ally.name, ally.role, randomDialogue, ally.root as unknown as SpeechTarget, false);
                }
            }

            // High Tide Cybertronian Oceanic Rescue Vessel: Gentle water swell bobbing & visibility
            if (highTideWorldShip) {
                highTideWorldShip.position.y = -0.45 + Math.sin(nowSec * 1.8) * 0.12;
                highTideWorldShip.rotation.z = Math.sin(nowSec * 1.2) * 0.02;
                highTideWorldShip.rotation.x = Math.cos(nowSec * 1.5) * 0.015;
                const shipCranes = highTideWorldShip.userData?.cranes as Array<{ boom: THREE.Object3D }> | undefined;
                if (shipCranes) {
                    shipCranes.forEach((crane, i) => {
                        crane.boom.rotation.x = Math.sin(nowSec * 2.0 + i * Math.PI) * 0.06;
                    });
                }
                const shipThrusters = highTideWorldShip.userData?.thrusters as THREE.Object3D[] | undefined;
                if (shipThrusters) {
                    shipThrusters.forEach((prop) => {
                        prop.rotation.z += dt * 3.5;
                    });
                }

                // If player is High Tide AND in Megabot mode, hide the standalone boat!
                // If player switches to another bot, both High Tide and the boat appear in the world!
                const isPlayerHighTideMega = (player.botType === 'HIGHTIDE' && Boolean(progression.highTideDocked));
                highTideWorldShip.visible = !isPlayerHighTideMega;
            }

            // Sync all world attachments visibility & ground heights
            Object.entries(WORLD_MEGA_ATTACHMENTS).forEach(([botKey, mesh]) => {
                if (!mesh) return;
                const isCurrentPlayerMega = (player.botType === botKey && isBotDocked(botKey));
                mesh.visible = !isCurrentPlayerMega;
                if (mesh.position.y < 1.0 && botKey !== 'HIGHTIDE') {
                    mesh.position.y = getSurfaceHeight(mesh.position.x, mesh.position.z);
                }
            });

            // Megabot Docking Prompt (Floats in middle of screen when near active bot's attachment)
            const dockPromptEl = document.getElementById('hightide-dock-prompt');
            if (dockPromptEl) {
                const targetWorldMesh = WORLD_MEGA_ATTACHMENTS[player.botType];
                const isDocked = isBotDocked(player.botType);
                const isNearAttachment = (!isDocked && targetWorldMesh && targetWorldMesh.visible &&
                    Math.hypot(player.pos.x - targetWorldMesh.position.x, player.pos.z - targetWorldMesh.position.z) < 34.0);

                if (isNearAttachment) {
                    const dockIcon = document.getElementById('dock-icon') || dockPromptEl.querySelector('#dock-icon');
                    const dockSub = document.getElementById('dock-sub') || dockPromptEl.querySelector('div span:first-child');
                    const dockMain = document.getElementById('dock-main') || dockPromptEl.querySelector('div span:last-child');
                    if (dockIcon) {
                        const iconSvg = SVG_ICONS[player.botType] || SVG_ICONS.BOLT || '';
                        if (dockIcon.innerHTML !== iconSvg) {
                            dockIcon.innerHTML = iconSvg;
                        }
                    }
                    if (dockSub) dockSub.textContent = 'MEGA MODE READY';
                    if (dockMain) dockMain.textContent = 'DOCK MEGABOT';
                    dockPromptEl.classList.remove('hidden');
                } else {
                    dockPromptEl.classList.add('hidden');
                }
            }
        }

if (typeof window !== 'undefined') {
    window.visitingAutobots = visitingAutobots;
    window.servoPupRig = servoPupRig;
    window.highTideWorldShip = highTideWorldShip;
    window.optimusWorldTrailer = optimusWorldTrailer;
    window.WORLD_MEGA_ATTACHMENTS = WORLD_MEGA_ATTACHMENTS;
    window.WORLD_MEGA_LOCATIONS = WORLD_MEGA_LOCATIONS;
    window.createHighTideShipMesh = createHighTideShipMesh;
    window.createOptimusTrailerMesh = createOptimusTrailerMesh;
    window.initVisitingAutobots = initVisitingAutobots;
    window.updateVisitingAutobots = updateVisitingAutobots;
    window.syncVisitingAutobotsVisibility = syncVisitingAutobotsVisibility;
    window.discoverVisitingAutobot = discoverVisitingAutobot;
    window.toggleBumblebeeMorph = toggleBumblebeeMorph;
}

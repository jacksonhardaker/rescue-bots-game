// Visiting Autobot Allies (Optimus Prime, Bumblebee, Blurr, Salvage, High Tide & Servo)
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import {
    toonGrad3, toonGrad4, matHighTideWhite, matHighTideNavy, matHighTideGold,
    matMegaTrailerSilver, matMegaTrailerStripe, matChrome, matDarkSteel,
    matSirenRed, matOptimusGold, applyCartoonInkOutlines
} from '../rendering/materials.js';
import { createWheelAssembly } from '../bots/botHelpers.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { spawnBurstParticles } from './emergencies.js';

import { applyBotRigMorph, buildRescueBotModel } from '../bots/botRigs.js';
import { syncProgressionHUD } from '../progression/progression.js';
import { spawnSparkleGlints } from './emergencies.js';
import { updateBotRosterUI, syncHUDToActiveBot } from '../physics/player.js';
import { texHelipad } from '../rendering/textures.js';
export let visitingAutobots = [];
export let servoPupRig = null;

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

        // SERVO (High Tide's Faithful Cyber-Dog Companion)
        export function buildServoPupModel() {
            const root = new THREE.Group();

            // Pup Body
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.45, 10).rotateX(Math.PI / 2), matHighTideWhite);
            body.position.y = 0.85;
            body.castShadow = true;
            root.add(body);

            // Blue Saddle Back
            const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.95), matHighTideNavy);
            saddle.position.set(0, 1.38, 0);
            root.add(saddle);

            // Articulated Head
            const head = new THREE.Group();
            head.position.set(0, 1.25, 0.85);
            root.add(head);

            const skull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), matHighTideWhite);
            skull.position.y = 0.35;
            head.add(skull);

            const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.55), matHighTideWhite);
            muzzle.position.set(0, 0.22, 0.58);
            const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), matHighTideNavy);
            nose.position.set(0, 0.35, 0.86);
            head.add(muzzle, nose);

            // Glowing Cyan Cyber Eye Visor
            const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.12), matBeeGlowCyan);
            eyeVisor.position.set(0, 0.48, 0.44);
            eyeVisor.userData.noOutline = true;
            head.add(eyeVisor);

            // Floppy Navy Blue Cyber-Ears
            const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.35), matHighTideNavy);
            leftEar.position.set(-0.48, 0.45, -0.05);
            leftEar.rotation.z = 0.3;
            const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.35), matHighTideNavy);
            rightEar.position.set(0.48, 0.45, -0.05);
            rightEar.rotation.z = -0.3;
            head.add(leftEar, rightEar);

            // Golden Rescue Collar
            const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 10).rotateX(Math.PI / 2), matHighTideGold);
            collar.position.set(0, 1.05, 0.65);
            root.add(collar);

            // 4 Cyber-Paws
            [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45]].forEach(([px, pz]) => {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.32), matHighTideNavy);
                leg.position.set(px, 0.35, pz);
                const paw = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.45), matChrome);
                paw.position.set(px, 0.11, pz + 0.08);
                root.add(leg, paw);
            });

            // Wagging Antenna Tail
            const tail = new THREE.Group();
            tail.position.set(0, 1.05, -0.75);
            const tailStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8), matChrome);
            tailStem.position.set(0, 0.25, -0.2);
            tailStem.rotation.x = -0.75;
            const tailBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), matBeeGlowCyan);
            tailBulb.position.set(0, 0.48, -0.42);
            tailBulb.userData.noOutline = true;
            tail.add(tailStem, tailBulb);
            root.add(tail);

            return { root, head, leftEar, rightEar, tail };
        }

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

        export function toggleBumblebeeMorph(toRaptor = null) {
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
                triggerNPCSpeech("Bumblebee", "Dinobot Raptor Ally", "RAWR! Check out my Raptor Mode! Ready to pounce on any hazard across Griffin Rock!", bee.root, true);
            } else {
                showToast("🏎️ AUTOBOT BOT MODE!", "Bumblebee transformed into Heroic Bot Form!");
                triggerNPCSpeech("Bumblebee", "Autobot Scout", "Back in Bot Mode and ready to roll! Teamwork saves the day!", bee.root, true);
            }
        }

        export function discoverVisitingAutobot(ally) {
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
            triggerNPCSpeech(ally.name, ally.role, ally.dialogues[0], ally.root, true);

            if (ally.id === 'BUMBLEBEE') {
                setTimeout(() => {
                    toggleBumblebeeMorph(true);
                }, 1400);
            }
        }

        // =====================================================================
        // HIGH TIDE CYBERTRONIAN OCEANIC RESCUE VESSEL (Reference Images 1 & 3)
        // =====================================================================
        export let highTideWorldShip: any = null;

        export function createHighTideShipMesh() {
            const ship = new THREE.Group();

            // 1. Main Naval Hull: White beveled hull with angled bow
            const hullMid = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.6, 22.0), matMegaHullWhite);
            hullMid.position.set(0, 1.2, -1.0);
            hullMid.castShadow = true;
            ship.add(hullMid);

            // Angled Bow Wedge: White forward prow
            const bowProw = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.8, 10.0), matMegaHullWhite);
            bowProw.position.set(0, 1.3, 11.0);
            bowProw.castShadow = true;
            ship.add(bowProw);

            // Bow Flare Cap / Cutwater Nose
            const bowNose = new THREE.Mesh(new THREE.ConeGeometry(4.8, 7.5, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4), matMegaHullWhite);
            bowNose.position.set(0, 1.2, 16.5);
            bowNose.scale.set(1.1, 0.72, 1.0);
            bowNose.castShadow = true;
            ship.add(bowNose);

            // Slanted Red Hull Flank Markings & Red Autobot Anchor Badges (Images 1 & 3)
            [-1, 1].forEach(side => {
                const redStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 11.5), matMegaDeckRed);
                redStripe.position.set(side * 5.32, 1.8, 3.5);
                redStripe.rotation.z = side * 0.05;
                ship.add(redStripe);

                // Circular gold intake / thruster port with fin trim
                const goldPort = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.22, 16).rotateZ(Math.PI / 2), matMegaKneeGold);
                goldPort.position.set(side * 5.33, 0.6, 8.5);
                const portCore = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16).rotateZ(Math.PI / 2), matHighTideCyanGlow);
                portCore.position.set(side * 5.34, 0.6, 8.5);
                portCore.userData.noOutline = true;

                const portFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 4.2), matMegaKneeGold);
                portFin.position.set(side * 5.33, 0.6, 5.8);
                ship.add(goldPort, portCore, portFin);

                // Anchor Decal Plate on forward flank
                const anchorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 2.2), matMegaHullBadge);
                anchorPlate.position.set(side * 5.33, 1.5, 12.5);
                anchorPlate.userData.noOutline = true;
                ship.add(anchorPlate);
            });

            // Lower Submarine Blue Keel beneath waterline
            const keel = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 26.0, 16).rotateX(Math.PI / 2), matHighTideNavy);
            keel.position.set(0, -0.6, 0.5);
            keel.scale.set(1.2, 0.65, 1.0);
            ship.add(keel);

            // Bulbous Bow Sonar Dome
            const bulbDome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), matHighTideNavy);
            bulbDome.position.set(0, -0.6, 13.8);
            bulbDome.scale.set(1.1, 0.7, 1.5);
            ship.add(bulbDome);

            // 2. Command Bridge Superstructure (Autobot Red with Cyan windows and Autobot Crest)
            const bridgeBase = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.4, 8.5), matMegaHullWhite);
            bridgeBase.position.set(0, 3.7, -1.0);
            ship.add(bridgeBase);

            // Red Command Bridge Tower
            const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.2, 6.8), matMegaDeckRed);
            bridgeTower.position.set(0, 6.2, -1.0);
            bridgeTower.castShadow = true;
            ship.add(bridgeTower);

            // Panoramic Cyan Observation Windows
            const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.6, 0.2), matMegaWindowBlue);
            frontWindow.position.set(0, 7.1, 2.45);
            frontWindow.userData.noOutline = true;
            ship.add(frontWindow);

            [-1, 1].forEach(side => {
                const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 4.2), matMegaWindowBlue);
                sideWindow.position.set(side * 3.65, 7.1, -0.8);
                sideWindow.userData.noOutline = true;
                ship.add(sideWindow);
            });

            // Autobot Insignia Screen on front face of Bridge Tower
            const bridgeCrest = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 0.18), matMegaScreenCyan);
            bridgeCrest.position.set(0, 5.2, 2.45);
            bridgeCrest.userData.noOutline = true;
            ship.add(bridgeCrest);

            // High Tide Helmet Dome at top center of Bridge Roof
            const helmDome = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.5), matHighTideBlue);
            helmDome.position.set(0, 8.8, -1.0);
            const helmVisor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.5), matHighTideCyanGlow);
            helmVisor.position.set(0, 8.8, -0.3);
            helmVisor.userData.noOutline = true;
            const helmGoldLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12).rotateX(Math.PI / 2), matHighTideGold);
            helmGoldLamp.position.set(0, 9.4, -0.2);
            ship.add(helmDome, helmVisor, helmGoldLamp);

            // Yellow Catwalk Handrails around Bridge
            const railMat = matMegaCraneYellow;
            const frontRail = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.7, 0.1), railMat);
            frontRail.position.set(0, 8.5, 2.4);
            ship.add(frontRail);

            // 3. Twin Heavy Articulated Yellow Deck Crane Arms (Images 1 & 3)
            const cranes = [];
            [-1, 1].forEach((side, idx) => {
                const craneBase = new THREE.Group();
                craneBase.position.set(side * 4.6, 3.2, 4.5);

                const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.4, 16), matMegaHullWhite);
                turret.position.y = 0.7;
                const turretRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 8, 16).rotateX(Math.PI / 2), railMat);
                turretRing.position.y = 1.4;
                craneBase.add(turret, turretRing);

                const boomPivot = new THREE.Group();
                boomPivot.position.set(0, 1.5, 0);

                const lowerBoom = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.8, 0.85), matMegaCraneYellow);
                lowerBoom.position.set(0, 2.2, 0);
                lowerBoom.castShadow = true;

                const hydroCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 3.2, 10), matQuickSilver);
                hydroCyl.position.set(side * 0.45, 1.8, 0);
                hydroCyl.userData.noOutline = true;

                const elbowHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.95, 16).rotateZ(Math.PI / 2), matMegaCraneYellow);
                elbowHinge.position.set(0, 4.6, 0);

                const upperBoom = new THREE.Mesh(new THREE.BoxGeometry(0.68, 4.2, 0.75), matMegaCraneYellow);
                upperBoom.position.set(0, 6.2, 1.2);
                upperBoom.rotation.x = 0.55;
                upperBoom.castShadow = true;

                const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.45, 12), matMegaClawCharcoal);
                wrist.position.set(0, 7.8, 2.3);

                const clawGroup = new THREE.Group();
                clawGroup.position.set(0, 8.0, 2.3);
                for (let j = 0; j < 3; j++) {
                    const jawAng = (j * Math.PI * 2) / 3;
                    const clawJaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.4, 0.45), matMegaClawCharcoal);
                    clawJaw.position.set(Math.cos(jawAng) * 0.6, 0.6, Math.sin(jawAng) * 0.6);
                    clawJaw.rotation.z = Math.cos(jawAng) * 0.35;
                    clawJaw.rotation.x = Math.sin(jawAng) * 0.35;
                    clawGroup.add(clawJaw);
                }

                boomPivot.add(lowerBoom, hydroCyl, elbowHinge, upperBoom, wrist, clawGroup);
                boomPivot.rotation.z = side * -0.25;
                boomPivot.rotation.y = side * 0.35;
                craneBase.add(boomPivot);
                ship.add(craneBase);
                cranes.push({ base: craneBase, boom: boomPivot, claws: clawGroup });
            });
            ship.userData.cranes = cranes;

            // 4. Stern Propulsion: Dual Ducted Hydro-Jet Thrusters with Spinning Golden Propellers
            const thrusters = [];
            [-2.6, 2.6].forEach(tx => {
                const duct = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 3.8, 16).rotateX(Math.PI / 2), matMegaHullWhite);
                duct.position.set(tx, 0.4, -12.5);
                const goldCowl = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.45, 16).rotateX(Math.PI / 2), matMegaKneeGold);
                goldCowl.position.set(tx, 0.4, -10.6);
                ship.add(duct, goldCowl);

                const propHub = new THREE.Group();
                propHub.position.set(tx, 0.4, -14.4);
                for (let b = 0; b < 4; b++) {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 0.12), matMegaKneeGold);
                    blade.rotation.z = (b * Math.PI) / 2;
                    blade.position.y = 0.5;
                    propHub.add(blade);
                }
                const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 12).rotateX(-Math.PI / 2), matHighTideNavy);
                propHub.add(noseCone);
                ship.add(propHub);
                thrusters.push(propHub);
            });
            ship.userData.thrusters = thrusters;

            applyCartoonInkOutlines(ship, 1.035, true);
            return ship;
        }

        // =====================================================================
        // OPTIMUS PRIME APEX COMMAND TRAILER (Parked at Rescue HQ: X: -22, Z: -38)
        // =====================================================================
        export let optimusWorldTrailer: any = null;

        export function createOptimusTrailerMesh() {
            const trailer = new THREE.Group();

            // Main Trailer Hull Box (Dimensions: 12.5m long, 2.92m wide, 3.25m tall)
            const hull = new THREE.Mesh(new THREE.BoxGeometry(2.92, 3.25, 12.5), matMegaTrailerSilver);
            hull.position.set(0, 2.385, 0);
            hull.castShadow = true;
            trailer.add(hull);

            // Flank Blue Command Stripes & Skirts
            [-1.48, 1.48].forEach(sx => {
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 12.2), matMegaTrailerStripe);
                stripe.position.set(sx, 2.385, 0);
                const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 12.0), matDarkSteel);
                skirt.position.set(sx, 0.96, 0);
                const starDecal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 1.0), matOptimusGold);
                starDecal.position.set(sx * 1.01, 2.385, 2.55);
                starDecal.userData.noOutline = true;
                trailer.add(stripe, skirt, starDecal);
            });

            // Dual Heavy Roof Deluge Water Cannon Turrets
            [3.55, -1.95].forEach(tz => {
                const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.70, 0.30, 14), matDarkSteel);
                tBase.position.set(0, 4.16, tz);
                const tBoom = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.40, 1.5), matMegaTrailerSilver);
                tBoom.position.set(0, 4.41, tz + 0.3);
                [-0.20, 0.20].forEach(nx => {
                    const tNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 1.6, 10).rotateX(Math.PI / 2), matChrome);
                    tNozzle.position.set(nx, 4.41, tz + 1.1);
                    trailer.add(tNozzle);
                });
                trailer.add(tBase, tBoom);
            });

            // Rear Bumper & Dual Taillights
            const trBumper = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.45, 0.35), matDarkSteel);
            trBumper.position.set(0, 0.96, -6.3);
            trailer.add(trBumper);
            [-1.05, 1.05].forEach(tx => {
                const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.20, 0.12), matSirenRed);
                tailL.position.set(tx, 0.96, -6.47);
                tailL.userData.noOutline = true;
                trailer.add(tailL);
            });

            // 4 Tandem Rear Wheels
            [-2.15, -4.15].forEach(wz => {
                [-1.52, 1.52].forEach(wx => {
                    const wheel = createWheelAssembly(0.76, 0.52);
                    wheel.position.set(wx, 0.76, wz);
                    trailer.add(wheel);
                });
            });

            // Front Landing Gear / Support Legs (when uncoupled and parked)
            [-1.05, 1.05].forEach(lx => {
                const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.74, 8), matDarkSteel);
                legPost.position.set(lx, 0.43, 3.8);
                const legFoot = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.48), matDarkSteel);
                legFoot.position.set(lx, 0.06, 3.8);
                trailer.add(legPost, legFoot);
            });

            // Kingpin Hitch at front
            const kingpin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 10), matChrome);
            kingpin.position.set(0, 0.65, 5.2);
            trailer.add(kingpin);

            applyCartoonInkOutlines(trailer, 1.035, true);
            return trailer;
        }

        export function initVisitingAutobots(scene) {
            if (!Array.isArray(progression.discoveredAllies)) {
                progression.discoveredAllies = [];
            }

            // High Tide Cybertronian Oceanic Rescue Vessel moored in South Harbor Bay (X: -95, Z: 1480)
            if (!highTideWorldShip) {
                highTideWorldShip = createHighTideShipMesh();
                highTideWorldShip.position.set(-95, -0.45, 1480);
                highTideWorldShip.rotation.y = 0.35;
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(highTideWorldShip);
                const isPlayerHighTideMega = (player.botType === 'HIGHTIDE' && Boolean(progression.highTideDocked));
                highTideWorldShip.visible = !isPlayerHighTideMega;
                if (typeof window !== 'undefined') window.highTideWorldShip = highTideWorldShip;
            }

            // Optimus Prime Apex Command Trailer parked at Rescue HQ swap pad area (X: -22, Z: -38)
            if (!optimusWorldTrailer) {
                optimusWorldTrailer = createOptimusTrailerMesh();
                const trailerGroundY = getSurfaceHeight(-22, -38);
                optimusWorldTrailer.position.set(-22, trailerGroundY, -38);
                optimusWorldTrailer.rotation.y = 0;
                (scene || (typeof window !== "undefined" ? window.scene : null)).add(optimusWorldTrailer);
                const isPlayerOptimusMega = (player.botType === 'OPTIMUS' && Boolean(progression.optimusDocked));
                optimusWorldTrailer.visible = !isPlayerOptimusMega;
                if (typeof window !== 'undefined') window.optimusWorldTrailer = optimusWorldTrailer;
            }

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
                    applyCartoonInkOutlines(servoModel.root, 1.06, true);
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

                (scene || (typeof window !== "undefined" ? window.scene : null)).add(grp);
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

        export function updateVisitingAutobots(dt, now) {
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
                    if (ally.charRig && ally.charRig.propellers) {
                        ally.charRig.propellers.forEach(p => {
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
                    triggerNPCSpeech(ally.name, ally.role, randomDialogue, ally.root, false);
                }
            }

            // High Tide Cybertronian Oceanic Rescue Vessel: Gentle water swell bobbing & visibility
            if (highTideWorldShip) {
                highTideWorldShip.position.y = -0.45 + Math.sin(nowSec * 1.8) * 0.12;
                highTideWorldShip.rotation.z = Math.sin(nowSec * 1.2) * 0.02;
                highTideWorldShip.rotation.x = Math.cos(nowSec * 1.5) * 0.015;
                if (highTideWorldShip.userData && highTideWorldShip.userData.cranes) {
                    highTideWorldShip.userData.cranes.forEach((crane, i) => {
                        crane.boom.rotation.x = Math.sin(nowSec * 2.0 + i * Math.PI) * 0.06;
                    });
                }
                if (highTideWorldShip.userData && highTideWorldShip.userData.thrusters) {
                    highTideWorldShip.userData.thrusters.forEach(prop => {
                        prop.rotation.z += dt * 3.5;
                    });
                }

                // If player is High Tide AND in Megabot mode, hide the standalone boat!
                // If player switches to another bot, both High Tide and the boat appear in the world!
                const isPlayerHighTideMega = (player.botType === 'HIGHTIDE' && Boolean(progression.highTideDocked));
                highTideWorldShip.visible = !isPlayerHighTideMega;
            }

            // Optimus Prime Trailer Visibility & Ground Height Sync
            if (optimusWorldTrailer) {
                const isPlayerOptimusMega = (player.botType === 'OPTIMUS' && Boolean(progression.optimusDocked));
                optimusWorldTrailer.visible = !isPlayerOptimusMega;
                if (optimusWorldTrailer.position.y < 1.0) {
                    optimusWorldTrailer.position.y = getSurfaceHeight(optimusWorldTrailer.position.x, optimusWorldTrailer.position.z);
                }
            }

            // Megabot Docking Prompt (Floats in middle of screen when near High Tide ship or Optimus trailer)
            const dockPromptEl = document.getElementById('hightide-dock-prompt');
            if (dockPromptEl) {
                const isNearHighTideShip = (player.botType === 'HIGHTIDE' && !progression.highTideDocked && highTideWorldShip && highTideWorldShip.visible &&
                    Math.hypot(player.pos.x - highTideWorldShip.position.x, player.pos.z - highTideWorldShip.position.z) < 34.0);
                const isNearOptimusTrailer = (player.botType === 'OPTIMUS' && !progression.optimusDocked && optimusWorldTrailer && optimusWorldTrailer.visible &&
                    Math.hypot(player.pos.x - optimusWorldTrailer.position.x, player.pos.z - optimusWorldTrailer.position.z) < 32.0);

                if (isNearHighTideShip || isNearOptimusTrailer) {
                    const dockIcon = document.getElementById('dock-icon') || dockPromptEl.querySelector('span.text-xl');
                    const dockSub = document.getElementById('dock-sub') || dockPromptEl.querySelector('div span:first-child');
                    const dockMain = document.getElementById('dock-main') || dockPromptEl.querySelector('div span:last-child');
                    if (dockIcon) dockIcon.textContent = isNearOptimusTrailer ? '🚚' : '⚓';
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
    window.createHighTideShipMesh = createHighTideShipMesh;
    window.createOptimusTrailerMesh = createOptimusTrailerMesh;
    window.initVisitingAutobots = initVisitingAutobots;
    window.updateVisitingAutobots = updateVisitingAutobots;
    window.syncVisitingAutobotsVisibility = syncVisitingAutobotsVisibility;
    window.discoverVisitingAutobot = discoverVisitingAutobot;
    window.toggleBumblebeeMorph = toggleBumblebeeMorph;
}

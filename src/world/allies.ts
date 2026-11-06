// Visiting Autobot Allies (Optimus Prime, Bumblebee, Blurr, Salvage, High Tide & Servo)
import * as THREE from 'three';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import {
    toonGrad3, toonGrad4, matHighTideWhite, matHighTideNavy, matHighTideGold,
    matMegaTrailerSilver, matMegaTrailerStripe, matChrome, matDarkSteel,
    matSirenRed, matSirenBlue, matOptimusGold, applyCartoonInkOutlines,
    matHazardMat, matTire, matVisorCyan, matVisorGold,
    matBeeYellow, matBeeBlack, matBlurrPurple, matBlurrNeonGreen, matBlurrViolet, matBlurrCyanGlow,
    matSalvageSteel, matSalvageLightSteel, matSalvageOrange, matSalvageLime,
    matQuickDark, matQuickCyan, matQuickSilver, matQuickVisor
} from '../rendering/materials.js';
import { createWheelAssembly, createLightbar } from '../bots/botHelpers.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { progression, saveProgression, isBotDocked } from '../progression/progression.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { spawnBurstParticles } from './emergencies.js';

import { applyBotRigMorph, buildRescueBotModel } from '../bots/botRigs.js';
import { syncProgressionHUD } from '../progression/progression.js';
import { spawnSparkleGlints } from './emergencies.js';
import { updateBotRosterUI, syncHUDToActiveBot } from '../physics/player.js';
import { texHelipad } from '../rendering/textures.js';
import { SVG_ICONS } from '../ui/icons.js';
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

        // Boulder Heavy Dump Truck Bucket (Quarry: X: -380, Z: -120)
        export function createBoulderBucketMesh() {
            const bucket = new THREE.Group();
            const matYellow = new THREE.MeshToonMaterial({ color: 0xffcc00, gradientMap: toonGrad4 });
            const matGreen = new THREE.MeshToonMaterial({ color: 0x76d31b, gradientMap: toonGrad4 });

            // Subframe & Floor
            const subframe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 5.0), matDarkSteel);
            subframe.position.set(0, 0.6, 0);
            subframe.castShadow = true;
            bucket.add(subframe);

            const floor = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.35, 4.8), matYellow);
            floor.position.set(0, 1.0, 0);
            floor.castShadow = true;
            bucket.add(floor);

            const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.85, 0.35), matYellow);
            headboard.position.set(0, 2.05, 2.3);
            const cabOverhang = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.28, 1.8), matGreen);
            cabOverhang.position.set(0, 2.95, 1.5);
            cabOverhang.rotation.x = -0.15;
            bucket.add(headboard, cabOverhang);

            [-1.35, 1.35].forEach(sx => {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.6, 4.8), matYellow);
                wall.position.set(sx, 1.95, 0);
                wall.castShadow = true;
                bucket.add(wall);
                for (let r = -1.8; r <= 1.8; r += 0.9) {
                    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.22), matDarkSteel);
                    rib.position.set(sx * 1.06, 1.95, r);
                    bucket.add(rib);
                }
            });

            const tailgate = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.5, 0.28), matYellow);
            tailgate.position.set(0, 1.95, -2.35);
            const hazardPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.12), matHazardMat);
            hazardPlate.position.set(0, 1.55, -2.48);
            hazardPlate.userData.noOutline = true;
            bucket.add(tailgate, hazardPlate);

            [-0.8, -2.4].forEach(wz => {
                [-1.55, 1.55].forEach(wx => {
                    const wheel = createWheelAssembly(0.85, 0.58);
                    wheel.position.set(wx, 0.85, wz);
                    bucket.add(wheel);
                });
            });

            applyCartoonInkOutlines(bucket, 1.035, true);
            return bucket;
        }

        // Chase Police Command Trailer (Police Station: X: -80, Z: -50)
        export function createChaseTrailerMesh() {
            const trailer = new THREE.Group();
            const matBlue = new THREE.MeshToonMaterial({ color: 0x1648b8, gradientMap: toonGrad4 });
            const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });

            const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.75, 3.1, 10.5), matBlue);
            trHull.position.set(0, 2.3, 0);
            trHull.castShadow = true;
            trailer.add(trHull);

            [-1.39, 1.39].forEach(sx => {
                const whitePanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 9.8), matWhite);
                whitePanel.position.set(sx, 2.3, 0);
                const goldBadge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.9), matOptimusGold);
                goldBadge.position.set(sx * 1.01, 2.3, 2.0);
                goldBadge.userData.noOutline = true;
                trailer.add(whitePanel, goldBadge);
            });

            const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.3, 12), matDarkSteel);
            radarBase.position.set(0, 4.0, 2.5);
            const radarDish = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45).rotateX(-Math.PI * 0.4), matChrome);
            radarDish.position.set(0, 4.5, 2.5);
            trailer.add(radarBase, radarDish);

            [-1.9, -1.9].forEach(wz => {
                [-1.42, 1.42].forEach(wx => {
                    const wheel = createWheelAssembly(0.74, 0.48);
                    wheel.position.set(wx, 0.74, wz);
                    trailer.add(wheel);
                });
            });

            [-1.0, 1.0].forEach(lx => {
                const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.74, 8), matDarkSteel);
                legPost.position.set(lx, 0.43, 3.8);
                trailer.add(legPost);
            });

            applyCartoonInkOutlines(trailer, 1.035, true);
            return trailer;
        }

        // Heatwave Aerial Ladder Trailer (Firehouse Bay: X: -36, Z: -55)
        export function createHeatwaveTrailerMesh() {
            const trailer = new THREE.Group();
            const matRed = new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad4 });

            const trHull = new THREE.Mesh(new THREE.BoxGeometry(2.85, 2.8, 11.5), matRed);
            trHull.position.set(0, 2.2, 0);
            trHull.castShadow = true;
            trailer.add(trHull);

            [-1.44, 1.44].forEach(sx => {
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 10.8), matChrome);
                stripe.position.set(sx, 2.65, 0);
                trailer.add(stripe);
            });

            const turntable = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.45, 16), matDarkSteel);
            turntable.position.set(0, 3.8, 3.3);
            trailer.add(turntable);

            const ladderBoom = new THREE.Group();
            ladderBoom.position.set(0, 4.1, 3.3);
            trailer.add(ladderBoom);

            [-0.48, 0.48].forEach(lx => {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 8.5), matChrome);
                rail.position.set(lx, 0.15, -3.8);
                ladderBoom.add(rail);
                for (let r = -7.5; r <= 0; r += 0.85) {
                    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 6).rotateZ(Math.PI / 2), matChrome);
                    rung.position.set(0, 0.15, r);
                    ladderBoom.add(rung);
                }
            });

            [-2.1, -4.0].forEach(wz => {
                [-1.48, 1.48].forEach(wx => {
                    const wheel = createWheelAssembly(0.76, 0.52);
                    wheel.position.set(wx, 0.76, wz);
                    trailer.add(wheel);
                });
            });

            [-1.0, 1.0].forEach(lx => {
                const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.76, 8), matDarkSteel);
                legPost.position.set(lx, 0.42, 3.8);
                const legFoot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), matDarkSteel);
                legFoot.position.set(lx, 0.04, 3.8);
                trailer.add(legPost, legFoot);
            });

            applyCartoonInkOutlines(trailer, 1.035, true);
            return trailer;
        }

        // Quickshadow Stealth Bomber Airframe (Airfield: X: 420, Z: -350)
        export function createQuickshadowBomberMesh() {
            const bomber = new THREE.Group();

            const centerFuselage = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 3.8), matQuickDark);
            centerFuselage.position.set(0, 1.2, 0);
            centerFuselage.castShadow = true;
            bomber.add(centerFuselage);

            [-1, 1].forEach(side => {
                const wing = new THREE.Mesh(
                    new THREE.BoxGeometry(4.5, 0.22, 2.8).rotateY(side * 0.35),
                    matQuickDark
                );
                wing.position.set(side * 4.3, 1.2, -0.4);
                wing.castShadow = true;

                const leadingEdge = new THREE.Mesh(
                    new THREE.BoxGeometry(4.6, 0.12, 0.25).rotateY(side * 0.35),
                    matQuickCyan
                );
                leadingEdge.position.set(side * 4.3, 1.25, 0.9);
                leadingEdge.userData.noOutline = true;

                const intake = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 1.8), matQuickSilver);
                intake.position.set(side * 2.9, 1.55, -0.2);

                const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.8, 8).rotateX(Math.PI / 2), matDarkSteel);
                exhaust.position.set(side * 2.9, 1.55, -1.5);

                bomber.add(wing, leadingEdge, intake, exhaust);
            });

            // Tripod Landing Gear
            [[-1.8, -1.0], [1.8, -1.0], [0, 1.4]].forEach(([gx, gz]) => {
                const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), matDarkSteel);
                strut.position.set(gx, 0.6, gz);
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8).rotateZ(Math.PI / 2), matDarkSteel);
                wheel.position.set(gx, 0.25, gz);
                bomber.add(strut, wheel);
            });

            applyCartoonInkOutlines(bomber, 1.035, true);
            return bomber;
        }

        // Bumblebee Monster Truck Shell (Workshop: X: 180, Z: 120)
        export function createBumblebeeMonsterMesh() {
            const monster = new THREE.Group();

            const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 4.2), matBeeBlack);
            frame.position.set(0, 1.5, 0);
            frame.castShadow = true;
            monster.add(frame);

            [-1.25, 1.25].forEach(rx => {
                const barA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8).rotateX(0.25), matBeeYellow);
                barA.position.set(rx, 2.7, 0.6);
                const barB = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8).rotateX(-0.25), matBeeYellow);
                barB.position.set(rx, 2.7, -0.8);
                monster.add(barA, barB);
            });

            [-0.9, -0.3, 0.3, 0.9].forEach(lx => {
                const lightHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 10).rotateX(Math.PI / 2), matChrome);
                lightHousing.position.set(lx, 3.9, 0.5);
                const lightLens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10).rotateX(Math.PI / 2), matVisorGold);
                lightLens.position.set(lx, 3.9, 0.62);
                lightLens.userData.noOutline = true;
                monster.add(lightHousing, lightLens);
            });

            [[-1.85, 1.45], [1.85, 1.45], [-1.85, -1.55], [1.85, -1.55]].forEach(([wx, wz]) => {
                const tireMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.1, 18).rotateZ(Math.PI / 2), matTire);
                tireMesh.position.set(wx, 1.3, wz);
                tireMesh.castShadow = true;
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.14, 12).rotateZ(Math.PI / 2), matBeeYellow);
                hub.position.set(wx, 1.3, wz);
                monster.add(tireMesh, hub);
            });

            applyCartoonInkOutlines(monster, 1.035, true);
            return monster;
        }

        // Blurr Speed Monster Shell (Raceway: X: -250, Z: 420)
        export function createBlurrMonsterMesh() {
            const speedMonster = new THREE.Group();

            const speedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 4.4), matBlurrViolet);
            speedFrame.position.set(0, 1.5, 0);
            speedFrame.castShadow = true;
            speedMonster.add(speedFrame);

            const blowerBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.4), matChrome);
            blowerBase.position.set(0, 3.1, 1.2);
            const scoop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.9), matBlurrPurple);
            scoop.position.set(0, 3.65, 1.1);
            speedMonster.add(blowerBase, scoop);

            const mainWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.2), matBlurrPurple);
            mainWing.position.set(0, 3.8, -2.55);
            speedMonster.add(mainWing);

            [[-1.85, 1.45], [1.85, 1.45], [-1.85, -1.55], [1.85, -1.55]].forEach(([wx, wz]) => {
                const tireMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.1, 18).rotateZ(Math.PI / 2), matTire);
                tireMesh.position.set(wx, 1.3, wz);
                tireMesh.castShadow = true;
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.14, 12).rotateZ(Math.PI / 2), matBlurrNeonGreen);
                hub.position.set(wx, 1.3, wz);
                speedMonster.add(tireMesh, hub);
            });

            applyCartoonInkOutlines(speedMonster, 1.035, true);
            return speedMonster;
        }

        // Salvage Industrial Dumpster (Recycling Yard: X: -120, Z: -320)
        export function createSalvageDumpsterMesh() {
            const dumpster = new THREE.Group();

            const dumpsterBox = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 5.4), matSalvageSteel);
            dumpsterBox.position.set(0, 2.0, 0);
            dumpsterBox.castShadow = true;
            dumpster.add(dumpsterBox);

            [-1.62, 1.62].forEach(fx => {
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 2.8), matSalvageOrange);
                arm.position.set(fx, 1.2, 3.4);
                const fork = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), matSalvageOrange);
                fork.position.set(fx, 1.6, 4.6);
                dumpster.add(arm, fork);
            });

            const compactorDoor = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.0, 0.35), matSalvageLime);
            compactorDoor.position.set(0, 2.0, -2.8);
            const hazardStrip = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.12), matHazardMat);
            hazardStrip.position.set(0, 1.25, -3.0);
            hazardStrip.userData.noOutline = true;
            dumpster.add(compactorDoor, hazardStrip);

            [0.6, -1.4].forEach(wz => {
                [-1.65, 1.65].forEach(wx => {
                    const wheel = createWheelAssembly(0.82, 0.55);
                    wheel.position.set(wx, 0.82, wz);
                    dumpster.add(wheel);
                });
            });

            applyCartoonInkOutlines(dumpster, 1.035, true);
            return dumpster;
        }

        // Blades Heavy Sky-Crane Cargo Pod (Helipad / Mountain: X: -70, Z: 80)
        export function createBladesCargoMesh() {
            const cargo = new THREE.Group();
            const matOrange = new THREE.MeshToonMaterial({ color: 0xff6414, gradientMap: toonGrad4 });
            const matWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });

            const spineBoom = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 6.2), matOrange);
            spineBoom.position.set(0, 2.8, 0);
            spineBoom.castShadow = true;
            cargo.add(spineBoom);

            const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 4.6), matWhite);
            cargoBox.position.set(0, 1.4, 0.2);
            cargoBox.castShadow = true;
            cargo.add(cargoBox);

            const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.4, 10), matWhite);
            pylon.position.set(0, 3.9, 2.4);
            [-1, 1].forEach(side => {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 4.8), matDarkSteel);
                blade.position.set(0, 4.6, 2.4 + side * 2.2);
                cargo.add(blade);
            });
            cargo.add(pylon);

            [-1.4, 1.4].forEach(sx => {
                const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.2, 8).rotateX(Math.PI / 2), matChrome);
                skid.position.set(sx, 0.35, 0.2);
                cargo.add(skid);
            });

            applyCartoonInkOutlines(cargo, 1.035, true);
            return cargo;
        }

        export const WORLD_MEGA_ATTACHMENTS: Record<string, any> = {
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

        export const WORLD_MEGA_LOCATIONS = {
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

        export function initVisitingAutobots(scene) {
            if (!Array.isArray(progression.discoveredAllies)) {
                progression.discoveredAllies = [];
            }
            const sceneRef = (scene || (typeof window !== "undefined" ? (window as any).scene : null));

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
                    const loc = (WORLD_MEGA_LOCATIONS as any)[botKey];
                    const gy = getSurfaceHeight(loc.x, loc.z);
                    mesh.position.set(loc.x, gy, loc.z);
                    mesh.rotation.y = loc.rotY || 0;
                    if (sceneRef) sceneRef.add(mesh);
                    mesh.visible = !(player.botType === botKey && isBotDocked(botKey));
                    WORLD_MEGA_ATTACHMENTS[botKey] = mesh;
                    if (typeof window !== 'undefined') (window as any)[`${botKey.toLowerCase()}WorldAttachment`] = mesh;
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

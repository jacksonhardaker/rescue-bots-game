// Bot Rigs Model Builder & Universal Morph Articulation System
import * as THREE from "three";
import { BOT_GROUND_OFFSETS, HQ_PARKING_SLOTS } from "./botMeta.js";
import { applyCartoonInkOutlines } from "../rendering/materials.js";

import { buildBoulder } from "./boulder.js";
import { buildHeatwave } from "./heatwave.js";
import { buildChase } from "./chase.js";
import { buildBlades } from "./blades.js";
import { buildOptimus } from "./optimus.js";
import { buildBumblebee } from "./bumblebee.js";
import { buildBlurr } from "./blurr.js";
import { buildSalvage } from "./salvage.js";
import { buildHighTide } from "./hightide.js";
import { buildQuickshadow } from "./quickshadow.js";

export const BOT_SCALES = {
    BOULDER: 1.0,
    HEATWAVE: 1.0,
    CHASE: 1.0,
    BLADES: 1.0,
    OPTIMUS: 1.25,
    BUMBLEBEE: 1.0,
    BLURR: 1.0,
    SALVAGE: 1.0,
    HIGHTIDE: 1.30,
    QUICKSHADOW: 1.0
};

export function getBotScale(botType) {
    if (botType === "HIGHTIDE" && typeof window !== "undefined" && window.progression && window.progression.highTideDocked) {
        return 3.85;
    }
    return BOT_SCALES[botType] || 1.0;
}

export function setHighTideRigMega(rig, isMega) {
            if (!rig || rig.botType !== 'HIGHTIDE') return;
            rig.isMega = Boolean(isMega);
            const scale = rig.isMega ? 3.85 : 1.30;
            rig.root.scale.setScalar(scale);
            rig.root.traverse(child => {
                if (child.userData && child.userData.isStandardPart !== undefined) {
                    child.visible = !rig.isMega;
                }
                if (child.userData && child.userData.isMegaPart !== undefined) {
                    child.visible = rig.isMega;
                }
            });
        }

export function buildRescueBotModel(botType) {
    const root = new THREE.Group();
            const bScale = (typeof BOT_SCALES !== 'undefined' && BOT_SCALES[botType]) || 1.0;
            root.scale.setScalar(bScale);
            const chassis = new THREE.Group();
            root.add(chassis);

            const parts = {
                botType,
                root,
                chassis,
                torso: new THREE.Group(),
                head: new THREE.Group(),
                frontAttachment: new THREE.Group(), // Engine nose / Bumper / Cockpit nose
                backAttachment: new THREE.Group(),  // Fire ladder & water cannon / Helicopter rotors / Exhaust
                leftArm: new THREE.Group(),
                rightArm: new THREE.Group(),
                leftForearm: new THREE.Group(),
                rightForearm: new THREE.Group(),
                leftLeg: new THREE.Group(),
                rightLeg: new THREE.Group(),
                leftFoot: new THREE.Group(),
                rightFoot: new THREE.Group(),
                leftLegWheelMount: new THREE.Group(),
                rightLegWheelMount: new THREE.Group(),
                leftArmWheelMount: new THREE.Group(),
                rightArmWheelMount: new THREE.Group(),
                leftDoorWing: new THREE.Group(),
                rightDoorWing: new THREE.Group(),
                leftSkidMount: new THREE.Group(),
                rightSkidMount: new THREE.Group(),
                leftCockpitShell: new THREE.Group(),
                rightCockpitShell: new THREE.Group(),
                dozerCabMount: new THREE.Group(),
                exhaustStacks: new THREE.Group(),
                dinoGroup: new THREE.Group(),
                dinoHead: new THREE.Group(),
                dinoTail: new THREE.Group(),
                dinoLeftWing: new THREE.Group(),
                dinoRightWing: new THREE.Group(),
                dinoLeftArm: new THREE.Group(),
                dinoRightArm: new THREE.Group(),
                dinoLowerJaw: null,
                wheels: [],
                rotors: null,
                tailRotor: null,
                lightbar: null,
                nozzleTip: new THREE.Object3D(),
                dinoNozzleTip: new THREE.Object3D()
            };

            chassis.add(parts.torso);
            chassis.add(parts.head);
            chassis.add(parts.frontAttachment);
            chassis.add(parts.backAttachment);
            chassis.add(parts.leftArm);
            chassis.add(parts.rightArm);
            chassis.add(parts.leftLeg);
            chassis.add(parts.rightLeg);
            chassis.add(parts.dinoGroup);
            parts.dinoGroup.add(parts.dinoHead);
            parts.dinoGroup.add(parts.dinoTail);
            parts.dinoGroup.add(parts.dinoLeftWing);
            parts.dinoGroup.add(parts.dinoRightWing);
            parts.dinoGroup.add(parts.dinoLeftArm);
            parts.dinoGroup.add(parts.dinoRightArm);

    if (botType === "BOULDER") buildBoulder(parts);
    else if (botType === "HEATWAVE") buildHeatwave(parts);
    else if (botType === "CHASE") buildChase(parts);
    else if (botType === "BLADES") buildBlades(parts);
    else if (botType === "OPTIMUS") buildOptimus(parts);
    else if (botType === "BUMBLEBEE") buildBumblebee(parts);
    else if (botType === "BLURR") buildBlurr(parts);
    else if (botType === "SALVAGE") buildSalvage(parts);
    else if (botType === "HIGHTIDE") buildHighTide(parts);
    else if (botType === "QUICKSHADOW") buildQuickshadow(parts);

    applyCartoonInkOutlines(root, 1.06, true);
    return parts;
}

export function applyBotRigMorph(rig, m, d, walkCycle, speed, smashTimer, now, scoopTimer = 0) {
            // Apply mode-dependent ground elevation so the bot's ground contact surface stays flush on terrain
            const bKey = (rig.botType === 'HIGHTIDE' && rig.isMega) ? 'HIGHTIDE_MEGA' : rig.botType;
            const gOffsets = BOT_GROUND_OFFSETS[bKey] || { bot: 0, veh: 0, dino: 0 };
            const groundLiftY = gOffsets.bot * (1 - m - d) + gOffsets.veh * m + gOffsets.dino * d;
            if (rig.chassis) {
                rig.chassis.position.y = groundLiftY;
            }

            const walkSin = Math.sin(walkCycle);
            const isMoving = Math.abs(speed) > 0.5;
            const smashOffset = smashTimer > 0 ? Math.sin((smashTimer / 0.45) * Math.PI) : 0;
            // Bulldozer Scoop Wave: dips blade low in first 30%, then lifts hydraulic arms & curls blade high!
            const scoopProgress = scoopTimer > 0 ? (1.0 - scoopTimer / 0.85) : 0;
            const scoopLift = scoopTimer > 0 ? Math.sin(scoopProgress * Math.PI) : 0;
            const scoopCurl = scoopTimer > 0 ? Math.sin((scoopProgress - 0.18) * Math.PI * 1.2) : 0;
            const isPtero = rig.botType === 'BLADES';

            // 1. Torso (Upright in Bot, Low Chassis in Vehicle, Horizontal Dinosaur Core in Dinobot)
            const botTorsoY = 3.65 + (isMoving ? Math.abs(walkSin) * 0.22 : 0) - smashOffset * 0.5;
            const dinoTorsoY = (rig.botType === 'HEATWAVE' || rig.botType === 'BUMBLEBEE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE' || rig.botType === 'HIGHTIDE' ? 2.45 : 2.15) + (isMoving && !isPtero ? Math.abs(walkSin) * 0.18 : 0);
            const vehTorsoY = (rig.botType === 'BOULDER') ? 1.56
                : (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') ? 1.78
                : (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') ? 1.35
                : (rig.botType === 'CHASE') ? 1.42
                : (rig.botType === 'HIGHTIDE') ? 1.58 : 1.72;
            const vehTorsoZ = (rig.botType === 'BOULDER') ? -0.18
                : (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') ? 1.15
                : (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') ? 0.35
                : (rig.botType === 'CHASE') ? -0.42
                : (rig.botType === 'HIGHTIDE') ? 0.35 : 0.95;
            rig.torso.position.set(
                0,
                botTorsoY * (1 - m - d) + vehTorsoY * m + dinoTorsoY * d,
                vehTorsoZ * m + (rig.botType === 'OPTIMUS' ? 0.22 : 0.05) * d
            );
            const vehTorsoRotX = (rig.botType === 'CHASE' || rig.botType === 'BLADES') ? (Math.PI / 2) * m : 0;
            const dinoTorsoRotX = (rig.botType === 'OPTIMUS' || rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW') ? (Math.PI * 0.22) : (Math.PI * 0.48);
            rig.torso.rotation.x = smashOffset * 0.4 * (1 - m - d) + vehTorsoRotX + dinoTorsoRotX * d;

            // For Chase, his police lightbar sits immediately behind his head in Bot mode, then shifts onto the cruiser roof in Vehicle mode!
            if (rig.botType === 'CHASE' && rig.lightbar) {
                rig.lightbar.group.position.set(
                    0,
                    1.32 * (1 - m) + 0.18 * m,
                    -0.38 * (1 - m) + 1.05 * m
                );
                rig.lightbar.group.rotation.x = -(Math.PI / 2) * m;
            }

            // 2. Head & Cab Assemblies:
            // - Boulder: Head retracts straight down into his chest while his ROPS Bulldozer Operator Cab (`dozerCabMount`) slides up & forward from his collar!
            // - Heatwave / Optimus / Salvage / High Tide: Retracts straight down into Full Cab Chest!
            // - Chase / Blurr: Tucks down inside Cabin Roof Chest!
            // - Bumblebee: Retracts into sports hood in Vehicle mode, and tucks away in Dinobot mode (raptor head deploys)
            if (rig.botType === 'BOULDER') {
                rig.head.position.set(
                    0,
                    (5.45 - smashOffset * 0.35) * (1 - m - d) + 1.52 * m + 1.95 * d,
                    0.08 * (1 - m - d) - 0.18 * m + 0.15 * d
                );
                rig.head.rotation.x = 0;
                const boulderHeadScale = 1.0 * (1 - m - d) + 0.25 * m + 0.22 * d;
                rig.head.scale.setScalar(boulderHeadScale);

                // Slide Boulder's ROPS Bulldozer Operator Cab from behind his collar up onto the Bulldozer deck!
                if (rig.dozerCabMount) {
                    rig.dozerCabMount.position.set(
                        0,
                        0.55 * (1 - m - d) + 1.55 * m + 0.25 * d,
                        -0.92 * (1 - m - d) - 0.08 * m - 0.35 * d
                    );
                    rig.dozerCabMount.rotation.x = -0.28 * (1 - m);
                    const cabScale = 0.72 * (1 - m - d) + 1.0 * m + 0.22 * d;
                    rig.dozerCabMount.scale.setScalar(Math.max(0.01, cabScale));
                }
            } else if (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE' || rig.botType === 'HIGHTIDE') {
                rig.head.position.set(
                    0,
                    (5.45 - smashOffset * 0.35) * (1 - m - d) + 1.68 * m + 1.95 * d,
                    0.06 * (1 - m - d) + 1.15 * m + 0.15 * d
                );
                rig.head.rotation.x = 0;
                const hwHeadScale = (rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE' || rig.botType === 'HIGHTIDE')
                    ? (1.0 * (1 - m) + 0.25 * m) * (1.0 - d)
                    : (1.0 * (1 - m - d) + 0.25 * m + 0.22 * d);
                rig.head.scale.setScalar(Math.max(0.001, hwHeadScale));
            } else if (rig.botType === 'CHASE') {
                rig.head.position.set(
                    0,
                    (5.45 - smashOffset * 0.35) * (1 - m - d) + 1.38 * m + 1.95 * d,
                    0.06 * (1 - m - d) - 0.42 * m + 0.15 * d
                );
                rig.head.rotation.x = 0;
                const chaseHeadScale = 1.0 * (1 - m - d) + 0.25 * m + 0.22 * d;
                rig.head.scale.setScalar(chaseHeadScale);
            } else if (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW') {
                rig.head.position.set(
                    0,
                    (5.45 - smashOffset * 0.35) * (1 - m - d) + 1.25 * m + 1.95 * d,
                    0.06 * (1 - m - d) + 0.35 * m + 0.15 * d
                );
                rig.head.rotation.x = 0;
                const quickHeadScale = (1.0 * (1 - m) + 0.12 * m) * (1.0 - d);
                rig.head.scale.setScalar(Math.max(0.001, quickHeadScale));
            } else if (rig.botType === 'BUMBLEBEE') {
                rig.head.position.set(
                    0,
                    (5.45 - smashOffset * 0.35) * (1 - m - d) + 1.15 * m + 1.95 * d,
                    0.06 * (1 - m - d) + 0.25 * m + 0.15 * d
                );
                rig.head.rotation.x = 0;
                const beeHeadScale = (1.0 * (1 - m) + 0.05 * m) * (1.0 - d);
                rig.head.scale.setScalar(Math.max(0.001, beeHeadScale));
            } else {
                // BLADES: Head sits between the retracted collar cockpit halves in Bot mode, then tucks into the expanding Helicopter Cockpit Nose in Vehicle mode!
                rig.head.position.set(
                    0,
                    (5.45 - smashOffset * 0.35) * (1 - m - d) + 1.72 * m + 1.95 * d,
                    0.06 * (1 - m - d) + 1.55 * m + 0.15 * d
                );
                rig.head.rotation.x = (Math.PI * 0.38) * m;
                const bladesHeadScale = 1.0 * (1 - m - d) + 0.42 * m + 0.22 * d;
                rig.head.scale.setScalar(bladesHeadScale);

                // Expand / Retract the Split Helicopter Cockpit Shells around Blades' Head!
                if (rig.leftCockpitShell && rig.rightCockpitShell) {
                    const shellX = 1.05 * (1 - m) + 0.44 * m;
                    const shellY = 0.85 * (1 - m) + 1.32 * m;
                    const shellZ = -0.35 * (1 - m) + 0.02 * m;
                    const shellScale = 0.52 * (1 - m - d) + 1.0 * m + 0.15 * d;
                    const shellRotZ = 0.42 * (1 - m);

                    rig.leftCockpitShell.position.set(-shellX, shellY, shellZ);
                    rig.rightCockpitShell.position.set(shellX, shellY, shellZ);
                    rig.leftCockpitShell.rotation.z = shellRotZ;
                    rig.rightCockpitShell.rotation.z = -shellRotZ;
                    rig.leftCockpitShell.scale.setScalar(Math.max(0.01, shellScale));
                    rig.rightCockpitShell.scale.setScalar(Math.max(0.01, shellScale));
                }
            }

            // 3. Front Attachment (Sloped Engine Nose & Louvered Radiator Grille for Boulder / Copter Nose for Blades)
            if (rig.botType === 'BOULDER') {
                rig.frontAttachment.position.set(
                    0,
                    2.85 * (1 - m - d) + 1.48 * m + 1.65 * d,
                    0.45 * (1 - m - d) + 1.28 * m + 1.15 * d
                );
                rig.frontAttachment.rotation.x = 0;
                const boulderNoseScale = 0.65 * (1 - m - d) + 1.0 * m + 0.35 * d;
                rig.frontAttachment.scale.setScalar(Math.max(0.01, boulderNoseScale));
            } else if (rig.botType === 'BLADES') {
                rig.frontAttachment.position.set(
                    0,
                    3.65 * (1 - m - d) + 1.55 * m + 1.95 * d,
                    0.85 * (1 - m - d) + 2.05 * m + 0.95 * d
                );
            } else if (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') {
                rig.frontAttachment.position.set(
                    0,
                    2.15 * (1 - m - d) + 0.38 * m + 1.55 * d,
                    0.95 * (1 - m - d) + 2.35 * m + 1.35 * d
                );
            } else if (rig.botType === 'HIGHTIDE') {
                if (rig.isMega) {
                    // Megabot Boat Mode: Wedge Bow smoothly extends forward from torso hull
                    // In Bot Mode (m = 0) and Dino Mode (d = 1), scale to 0.001 to clear chest & mosasaur head
                    const bowScale = Math.max(0.001, m);
                    rig.frontAttachment.position.set(
                        0,
                        0.55 * (1 - m) + 1.58 * m,
                        1.2 * (1 - m) + 1.58 * m
                    );
                    rig.frontAttachment.rotation.x = 0;
                    rig.frontAttachment.scale.setScalar(bowScale);
                } else {
                    rig.frontAttachment.position.set(0, 0, 0);
                    rig.frontAttachment.scale.setScalar(0.001);
                }
            } else {
                rig.frontAttachment.position.set(
                    0,
                    2.75 * (1 - m - d) + 0.72 * m + 1.55 * d,
                    1.05 * (1 - m - d) + 2.45 * m + 1.35 * d
                );
            }

            // 4. Back Attachment (Bulldozer Rear Engine Deck & Exhaust Stacks / Fire Ladder & Water Cannon / Helicopter Rotors / Smokestacks)
            if (rig.botType === 'BOULDER') {
                rig.backAttachment.position.set(
                    0,
                    3.85 * (1 - m - d) + 1.42 * m + 2.05 * d,
                    -1.18 * (1 - m - d) - 1.65 * m - 0.65 * d
                );
                rig.backAttachment.rotation.x = -0.15 * (1 - m - d);
                const deckScale = 0.78 * (1 - m - d) + 1.0 * m + 0.35 * d;
                rig.backAttachment.scale.setScalar(Math.max(0.01, deckScale));

                // Shift Boulder's Dual Chrome Exhaust Stacks from behind his robot shoulders to beside the Bulldozer Cab hood!
                if (rig.exhaustStacks) {
                    rig.exhaustStacks.position.set(
                        0,
                        1.15 * (1 - m) + 1.08 * m,
                        0.22 * (1 - m) + 1.65 * m
                    );
                }
            } else if (rig.botType === 'HEATWAVE') {
                rig.backAttachment.position.set(
                    0,
                    4.2 * (1 - m - d) + 2.45 * m + 2.15 * d,
                    -1.25 * (1 - m - d) - 1.35 * m - 0.55 * d
                );
                rig.backAttachment.rotation.x = -0.35 * (1 - m - d);
                rig.backAttachment.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.45, d));
            } else if (rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') {
                rig.backAttachment.position.set(
                    0,
                    3.85 * (1 - m - d) + 1.65 * m + 2.05 * d,
                    -1.15 * (1 - m - d) - 1.25 * m - 0.45 * d
                );
                rig.backAttachment.rotation.x = 0;
            } else if (rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') {
                rig.backAttachment.position.set(
                    0,
                    3.85 * (1 - m - d) + 1.45 * m + 2.05 * d,
                    -1.15 * (1 - m - d) - 1.85 * m - 0.45 * d
                );
                rig.backAttachment.rotation.x = 0;
                rig.backAttachment.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.4, d));
            } else if (rig.botType === 'HIGHTIDE') {
                rig.backAttachment.position.set(
                    0,
                    3.85 * (1 - m - d) + 1.55 * m + 2.05 * d,
                    -1.15 * (1 - m - d) - 0.85 * m - 0.45 * d
                );
            } else if (rig.botType === 'BLADES') {
                rig.backAttachment.position.set(
                    0,
                    4.4 * (1 - m - d) + 2.15 * m + 2.1 * d,
                    -1.1 * (1 - m - d) + 0.1 * m - 0.4 * d
                );
                rig.backAttachment.rotation.x = -1.25 * (1 - m);
            }

            // 5. Left & Right Arms
            const armSwingL = isMoving ? walkSin * 0.65 : 0;
            const armSwingR = isMoving ? -walkSin * 0.65 : 0;
            const dinoArmX = isPtero ? 1.15 : 1.45;
            const dinoArmY = 2.25;
            const dinoArmZ = isPtero ? 0.25 : 1.18;
            const dinoArmRotL = isPtero ? Math.PI / 2 : armSwingL * 0.75;
            const dinoArmRotR = isPtero ? Math.PI / 2 : armSwingR * 0.75;

            const vehArmX = (rig.botType === 'BOULDER') ? 1.46
                : (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') ? 1.36
                : (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') ? 1.32
                : (rig.botType === 'CHASE') ? 0.92
                : (rig.botType === 'HIGHTIDE') ? 1.25 : 1.16;
            const vehArmY = (rig.botType === 'BOULDER') ? 1.08
                : (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') ? 1.14
                : (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') ? 0.95
                : (rig.botType === 'CHASE') ? 1.02
                : (rig.botType === 'HIGHTIDE') ? 1.18 : 1.48;
            const vehArmZ = (rig.botType === 'BOULDER') ? -0.35
                : (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') ? 1.42
                : (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') ? 1.35
                : (rig.botType === 'CHASE') ? -1.18
                : (rig.botType === 'HIGHTIDE') ? 0.65 : 1.25;

            const armScaleDino = (rig.botType === 'BUMBLEBEE' || rig.botType === 'OPTIMUS' || rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'HIGHTIDE') ? (1.0 - d * 0.88) : 1.0;
            rig.leftArm.scale.setScalar(armScaleDino);
            rig.rightArm.scale.setScalar(armScaleDino);

            rig.leftArm.position.set(
                -1.78 * (1 - m - d) - vehArmX * m - dinoArmX * d,
                4.2 * (1 - m - d) + vehArmY * m + dinoArmY * d,
                vehArmZ * m + dinoArmZ * d
            );
            rig.rightArm.position.set(
                1.78 * (1 - m - d) + vehArmX * m + dinoArmX * d,
                4.2 * (1 - m - d) + vehArmY * m + dinoArmY * d,
                vehArmZ * m + dinoArmZ * d
            );
            rig.leftArm.rotation.x = (armSwingL - smashOffset * 1.4) * (1 - m - d) + (Math.PI / 2) * m + dinoArmRotL * d;
            rig.rightArm.rotation.x = (armSwingR - smashOffset * 1.4) * (1 - m - d) + (Math.PI / 2) * m + dinoArmRotR * d;

            if (rig.leftDoorWing && rig.rightDoorWing) {
                if (rig.botType === 'BUMBLEBEE') {
                    // Robot mode: Soaring door wings standing tall behind shoulders!
                    // Vehicle mode: Fold flush along sports car flanks (parallel to car length, zero perpendicular gaps!)
                    // Dino mode: Tuck neatly along raptor sides
                    const wingFlareX = -Math.PI / 2 + 0.18;
                    rig.leftDoorWing.position.set(
                        -1.32 * (1 - m - d) - 1.30 * m - 0.72 * d,
                        1.25 * (1 - m - d) - 0.38 * m + 0.22 * d,
                        -0.65 * (1 - m - d) - 0.10 * m - 0.45 * d
                    );
                    rig.leftDoorWing.rotation.set(
                        wingFlareX * (1 - m - d) + 0 * m - 0.25 * d,
                        0.15 * (1 - m - d) + 0 * m + 0.35 * d,
                        -0.28 * (1 - m - d) + 0 * m - 0.15 * d
                    );
                    rig.rightDoorWing.position.set(
                        1.32 * (1 - m - d) + 1.30 * m + 0.72 * d,
                        1.25 * (1 - m - d) - 0.38 * m + 0.22 * d,
                        -0.65 * (1 - m - d) - 0.10 * m - 0.45 * d
                    );
                    rig.rightDoorWing.rotation.set(
                        wingFlareX * (1 - m - d) + 0 * m - 0.25 * d,
                        -0.15 * (1 - m - d) + 0 * m - 0.35 * d,
                        0.28 * (1 - m - d) + 0 * m + 0.15 * d
                    );
                    const wingScale = THREE.MathUtils.lerp(1.0, 0.65, d);
                    rig.leftDoorWing.scale.setScalar(wingScale);
                    rig.rightDoorWing.scale.setScalar(wingScale);
                } else {
                    rig.leftDoorWing.rotation.z = 0.38 * (1 - m);
                    rig.rightDoorWing.rotation.z = -0.38 * (1 - m);
                }
            }

            if (rig.botType === 'BOULDER') {
                if (rig.leftArmWheelMount && rig.rightArmWheelMount) {
                    const treadGroundShiftZ = -0.06 * (1 - m) + 0.24 * m;
                    rig.leftArmWheelMount.position.z = treadGroundShiftZ;
                    rig.rightArmWheelMount.position.z = treadGroundShiftZ;
                }
                if (rig.leftForearm && rig.rightForearm) {
                    rig.leftForearm.rotation.z = 0.65 * m;
                    rig.rightForearm.rotation.z = -0.65 * m;
                }
            }
            if ((rig.botType === 'HEATWAVE' || rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') && rig.leftForearm && rig.rightForearm) {
                rig.leftForearm.rotation.z = (Math.PI / 2) * m;
                rig.rightForearm.rotation.z = -(Math.PI / 2) * m;
            }
            if (rig.botType === 'CHASE') {
                if (rig.leftDoorWing && rig.rightDoorWing) {
                    rig.leftDoorWing.position.y = -0.35 * (1 - m) - 0.85 * m;
                    rig.rightDoorWing.position.y = -0.35 * (1 - m) - 0.85 * m;
                }
                if (rig.leftArmWheelMount && rig.rightArmWheelMount) {
                    const armWheelZ = -0.05 * (1 - m) + 0.32 * m;
                    rig.leftArmWheelMount.position.z = armWheelZ;
                    rig.rightArmWheelMount.position.z = armWheelZ;
                }
            }

            // 6. Left & Right Legs
            const dinoLegX = isPtero ? 0.72 : 1.18;
            const dinoLegY = isPtero ? 1.85 : 2.25;
            const dinoLegZ = isPtero ? -1.05 : -1.18;
            const dinoLegRotL = isPtero ? -Math.PI * 0.36 : -armSwingL * 0.75;
            const dinoLegRotR = isPtero ? -Math.PI * 0.36 : -armSwingR * 0.75;

            if (rig.botType === 'BOULDER') {
                const dozerLiftY = (smashOffset * 0.38 + scoopLift * 0.78) * m;
                rig.leftLeg.position.set(
                    -0.96 * (1 - m - d) - 0.88 * m - dinoLegX * d,
                    2.35 * (1 - m - d) + (0.94 + dozerLiftY) * m + dinoLegY * d,
                    (0.72 + scoopLift * 0.25) * m + dinoLegZ * d
                );
                rig.rightLeg.position.set(
                    0.96 * (1 - m - d) + 0.88 * m + dinoLegX * d,
                    2.35 * (1 - m - d) + (0.94 + dozerLiftY) * m + dinoLegY * d,
                    (0.72 + scoopLift * 0.25) * m + dinoLegZ * d
                );
                const legScoopPitch = (smashOffset * 0.25 + scoopLift * 0.38) * m;
                rig.leftLeg.rotation.x = (-armSwingL * 0.85 - smashOffset * 0.45) * (1 - m - d) - (Math.PI / 2 - legScoopPitch) * m + dinoLegRotL * d;
                rig.rightLeg.rotation.x = (-armSwingR * 0.85 - smashOffset * 0.45) * (1 - m - d) - (Math.PI / 2 - legScoopPitch) * m + dinoLegRotR * d;

                if (rig.leftLegWheelMount && rig.rightLegWheelMount) {
                    const linkageShiftZ = (-0.18 - scoopLift * 0.28) * m;
                    rig.leftLegWheelMount.position.set(-0.18 * m, (-0.15 - scoopLift * 0.22) * m, linkageShiftZ);
                    rig.rightLegWheelMount.position.set(0.18 * m, (-0.15 - scoopLift * 0.22) * m, linkageShiftZ);
                }

                if (rig.leftFoot && rig.rightFoot) {
                    const bucketTilt = (-0.18 + smashOffset * 0.48 + scoopCurl * 0.72) * m + (scoopCurl * 0.35) * (1 - m - d);
                    rig.leftFoot.rotation.x = bucketTilt;
                    rig.rightFoot.rotation.x = bucketTilt;
                }
            } else if (rig.botType === 'HEATWAVE' || rig.botType === 'OPTIMUS' || rig.botType === 'SALVAGE') {
                rig.leftLeg.position.set(
                    -0.88 * (1 - m - d) - 0.88 * m - dinoLegX * d,
                    2.35 * (1 - m - d) + 1.12 * m + dinoLegY * d,
                    -0.42 * m + dinoLegZ * d
                );
                rig.rightLeg.position.set(
                    0.88 * (1 - m - d) + 0.88 * m + dinoLegX * d,
                    2.35 * (1 - m - d) + 1.12 * m + dinoLegY * d,
                    -0.42 * m + dinoLegZ * d
                );
                rig.leftLeg.rotation.x = (-armSwingL * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotL * d;
                rig.rightLeg.rotation.x = (-armSwingR * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotR * d;

                if (rig.leftLegWheelMount && rig.rightLegWheelMount) {
                    const wheelGroundShiftZ = -0.05 * (1 - m) + 0.36 * m;
                    rig.leftLegWheelMount.position.z = wheelGroundShiftZ;
                    rig.rightLegWheelMount.position.z = wheelGroundShiftZ;
                }
            } else if (rig.botType === 'BLURR' || rig.botType === 'QUICKSHADOW' || rig.botType === 'BUMBLEBEE') {
                rig.leftLeg.position.set(
                    -0.88 * (1 - m - d) - 0.92 * m - dinoLegX * d,
                    2.35 * (1 - m - d) + 0.95 * m + dinoLegY * d,
                    -0.85 * m + dinoLegZ * d
                );
                rig.rightLeg.position.set(
                    0.88 * (1 - m - d) + 0.92 * m + dinoLegX * d,
                    2.35 * (1 - m - d) + 0.95 * m + dinoLegY * d,
                    -0.85 * m + dinoLegZ * d
                );
                rig.leftLeg.rotation.x = (-armSwingL * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotL * d;
                rig.rightLeg.rotation.x = (-armSwingR * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotR * d;

                if (rig.leftLegWheelMount && rig.rightLegWheelMount) {
                    const wheelGroundShiftZ = -0.05 * (1 - m) + 0.38 * m;
                    rig.leftLegWheelMount.position.z = wheelGroundShiftZ;
                    rig.rightLegWheelMount.position.z = wheelGroundShiftZ;
                }
            } else if (rig.botType === 'CHASE') {
                const legPitchVeh = -(Math.PI / 2);
                rig.leftLeg.position.set(
                    -0.82 * (1 - m - d) - 0.74 * m - dinoLegX * d,
                    2.35 * (1 - m - d) + 0.86 * m + dinoLegY * d,
                    -0.05 * m + dinoLegZ * d
                );
                rig.rightLeg.position.set(
                    0.82 * (1 - m - d) + 0.74 * m + dinoLegX * d,
                    2.35 * (1 - m - d) + 0.86 * m + dinoLegY * d,
                    -0.05 * m + dinoLegZ * d
                );
                rig.leftLeg.rotation.x = (-armSwingL * 0.85) * (1 - m - d) + legPitchVeh * m + dinoLegRotL * d;
                rig.rightLeg.rotation.x = (-armSwingR * 0.85) * (1 - m - d) + legPitchVeh * m + dinoLegRotR * d;

                if (rig.leftLegWheelMount && rig.rightLegWheelMount) {
                    const wheelZ = 0.05 * (1 - m) - 0.16 * m;
                    rig.leftLegWheelMount.position.z = wheelZ;
                    rig.rightLegWheelMount.position.z = wheelZ;
                }
            } else if (rig.botType === 'HIGHTIDE') {
                rig.leftLeg.position.set(
                    -0.82 * (1 - m - d) - 0.74 * m - dinoLegX * d,
                    2.35 * (1 - m - d) + 0.95 * m + dinoLegY * d,
                    -0.15 * m + dinoLegZ * d
                );
                rig.rightLeg.position.set(
                    0.82 * (1 - m - d) + 0.74 * m + dinoLegX * d,
                    2.35 * (1 - m - d) + 0.95 * m + dinoLegY * d,
                    -0.15 * m + dinoLegZ * d
                );
                rig.leftLeg.rotation.x = (-armSwingL * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotL * d;
                rig.rightLeg.rotation.x = (-armSwingR * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotR * d;
            } else {
                // BLADES: In Helicopter mode, legs fold backward (+PI/2) and press tightly together into a single unified Tail Boom!
                rig.leftLeg.position.set(
                    -0.78 * (1 - m - d) - 0.42 * m - dinoLegX * d,
                    2.35 * (1 - m - d) + 1.55 * m + dinoLegY * d,
                    -0.25 * m + dinoLegZ * d
                );
                rig.rightLeg.position.set(
                    0.78 * (1 - m - d) + 0.42 * m + dinoLegX * d,
                    2.35 * (1 - m - d) + 1.55 * m + dinoLegY * d,
                    -0.25 * m + dinoLegZ * d
                );
                rig.leftLeg.rotation.x = (-armSwingL * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotL * d;
                rig.rightLeg.rotation.x = (-armSwingR * 0.85) * (1 - m - d) + (Math.PI / 2) * m + dinoLegRotR * d;

                if (rig.leftSkidMount && rig.rightSkidMount) {
                    rig.leftSkidMount.position.set(-0.56 * (1 - m) - 0.72 * m, -1.55 * (1 - m) + 0.85 * m, 0.25 * (1 - m) + 1.25 * m);
                    rig.rightSkidMount.position.set(0.56 * (1 - m) + 0.72 * m, -1.55 * (1 - m) + 0.85 * m, 0.25 * (1 - m) + 1.25 * m);
                }
            }

            // 7. Dinobot Anatomy Group (Triceratops, Brachiosaurus, Stegosaurus, Pterosaur, Velociraptor)
            if (rig.dinoGroup) {
                rig.dinoGroup.visible = d > 0.02;
                const dScale = Math.max(0.001, d);
                rig.dinoGroup.scale.setScalar(dScale);

                if (rig.botType === 'BOULDER') {
                    rig.dinoHead.position.set(0, 2.25 - smashOffset * 0.45, 1.55 + smashOffset * 0.95);
                    rig.dinoHead.rotation.x = smashOffset * 0.38 + (isMoving ? Math.sin(walkCycle * 2) * 0.06 : 0);
                    rig.dinoTail.position.set(0, 2.25, -1.55);
                    rig.dinoTail.rotation.y = isMoving ? walkSin * 0.32 : Math.sin(now * 0.003) * 0.12;
                } else if (rig.botType === 'HEATWAVE') {
                    rig.dinoHead.position.set(0, 2.35, 1.15);
                    rig.dinoHead.rotation.x = (isMoving ? Math.sin(walkCycle) * 0.08 : Math.sin(now * 0.0025) * 0.05) + smashOffset * 0.25;
                    rig.dinoTail.position.set(0, 2.2, -1.55);
                    rig.dinoTail.rotation.y = isMoving ? walkSin * 0.35 : Math.sin(now * 0.003) * 0.14;
                } else if (rig.botType === 'CHASE') {
                    rig.dinoHead.position.set(0, 2.1, 1.55);
                    rig.dinoHead.rotation.y = isMoving ? walkSin * 0.12 : 0;
                    rig.dinoTail.position.set(0, 2.25, -1.5);
                    rig.dinoTail.rotation.y = (isMoving ? walkSin * 0.42 : Math.sin(now * 0.0035) * 0.16) + smashOffset * 0.95;
                } else if (rig.botType === 'BUMBLEBEE') {
                    rig.dinoHead.position.set(0, 2.35, 1.45);
                    rig.dinoHead.rotation.x = (isMoving ? Math.sin(walkCycle) * 0.12 : 0) + smashOffset * 0.35;
                    rig.dinoTail.position.set(0, 2.15, -1.55);
                    rig.dinoTail.rotation.y = isMoving ? walkSin * 0.38 : Math.sin(now * 0.003) * 0.15;
                } else if (rig.botType === 'BLADES') {
                    rig.dinoHead.position.set(0, 2.35, 1.35);
                    rig.dinoHead.rotation.x = isMoving ? 0.12 : 0;
                    rig.dinoTail.position.set(0, 2.25, -1.45);
                    rig.dinoLeftWing.position.set(-1.15, 2.45, 0.15);
                    rig.dinoRightWing.position.set(1.15, 2.45, 0.15);
                    const flapAngle = Math.sin(now * (isMoving ? 0.015 : 0.008)) * (isMoving ? 0.52 : 0.28);
                    rig.dinoLeftWing.rotation.z = flapAngle;
                    rig.dinoRightWing.rotation.z = -flapAngle;
                } else if (rig.botType === 'OPTIMUS') {
                    // Optimus Prime T-Rex: Predatory head, articulated jaw chomp, small arms, and heavy counterbalance tail
                    const chompAngle = smashOffset * 0.52;
                    rig.dinoHead.position.set(0, 3.45 + (isMoving ? Math.sin(walkCycle) * 0.12 : 0), 1.65);
                    rig.dinoHead.rotation.x = (isMoving ? Math.sin(walkCycle * 2) * 0.08 : Math.sin(now * 0.0025) * 0.04) - smashOffset * 0.25;
                    if (rig.dinoLowerJaw) {
                        rig.dinoLowerJaw.rotation.x = chompAngle + Math.sin(now * 0.004) * 0.05;
                    }
                    if (rig.dinoLeftArm && rig.dinoRightArm) {
                        const armGrasp = Math.sin(now * 0.005) * 0.15 + smashOffset * 0.6;
                        rig.dinoLeftArm.rotation.x = 0.35 + armGrasp;
                        rig.dinoRightArm.rotation.x = 0.35 - armGrasp * 0.5;
                        rig.dinoLeftArm.rotation.z = -0.15;
                        rig.dinoRightArm.rotation.z = 0.15;
                    }
                    rig.dinoTail.position.set(0, 2.15, -1.65);
                    rig.dinoTail.rotation.y = (isMoving ? walkSin * 0.38 : Math.sin(now * 0.003) * 0.14) + smashOffset * 0.15;
                    rig.dinoTail.rotation.x = -0.12 + Math.sin(now * 0.002) * 0.04;
                } else if (rig.botType === 'BLURR') {
                    // Blurr Gallimimus: Rapid running head bob, folded avian arms, and long counterbalance tail
                    rig.dinoHead.position.set(0, 2.55 + (isMoving ? Math.sin(walkCycle * 2) * 0.12 : 0), 1.45);
                    rig.dinoHead.rotation.x = (isMoving ? Math.sin(walkCycle * 2) * 0.14 : Math.sin(now * 0.003) * 0.05) - smashOffset * 0.22;
                    if (rig.dinoLeftArm && rig.dinoRightArm) {
                        rig.dinoLeftArm.rotation.x = isMoving ? -walkSin * 0.35 : 0;
                        rig.dinoRightArm.rotation.x = isMoving ? walkSin * 0.35 : 0;
                    }
                    rig.dinoTail.position.set(0, 2.15, -1.55);
                    rig.dinoTail.rotation.y = isMoving ? walkSin * 0.42 : Math.sin(now * 0.003) * 0.12;
                } else if (rig.botType === 'SALVAGE') {
                    // Salvage Ankylosaurus: Low armored posture, heavy head, and sweeping tail club
                    rig.dinoHead.position.set(0, 1.95 - smashOffset * 0.25, 1.65);
                    rig.dinoHead.rotation.x = isMoving ? Math.sin(walkCycle) * 0.08 : 0;
                    rig.dinoTail.position.set(0, 1.95, -1.65);
                    rig.dinoTail.rotation.y = (isMoving ? walkSin * 0.35 : Math.sin(now * 0.002) * 0.1) + smashOffset * 1.35;
                } else if (rig.botType === 'HIGHTIDE') {
                    if (rig.megaDinoScutes) {
                        rig.megaDinoScutes.visible = Boolean(rig.isMega) && d > 0.02;
                        rig.megaDinoScutes.scale.setScalar(Math.max(0.001, d));
                    }
                    if (rig.isMega) {
                        // High Tide Megabot Titan Mosasaur: Low aggressive predatory stance, snapping chrome jaws, sweeping hydrofoils, and undulating crescent fluke
                        const chompAngle = smashOffset * 0.65;
                        rig.dinoHead.position.set(0, 1.85, 2.45);
                        rig.dinoHead.rotation.x = (isMoving ? Math.sin(walkCycle * 2) * 0.08 : Math.sin(now * 0.0025) * 0.04) - smashOffset * 0.25;
                        rig.dinoHead.rotation.y = (isMoving ? Math.sin(now * 0.004) * 0.12 : Math.sin(now * 0.0015) * 0.06);
                        if (rig.dinoLowerJaw) {
                            rig.dinoLowerJaw.rotation.x = chompAngle + Math.sin(now * 0.004) * 0.06;
                        }
                        if (rig.dinoLeftWing && rig.dinoRightWing) {
                            const paddleSweep = Math.sin(now * (isMoving ? 0.007 : 0.003)) * (isMoving ? 0.48 : 0.25);
                            rig.dinoLeftWing.rotation.z = paddleSweep;
                            rig.dinoRightWing.rotation.z = -paddleSweep;
                            rig.dinoLeftWing.rotation.y = -paddleSweep * 0.45;
                            rig.dinoRightWing.rotation.y = paddleSweep * 0.45;
                        }
                        rig.dinoTail.position.set(0, 1.85, -1.65);
                        rig.dinoTail.rotation.y = (isMoving ? Math.sin(now * 0.007) * 0.48 : Math.sin(now * 0.0025) * 0.18) + smashOffset * 0.22;
                    } else {
                        // High Tide Plesiosaur: Towering periscope marine neck sway, rhythmic flipper paddle strokes, and rudder tail
                        rig.dinoHead.position.set(0, 2.75, 1.35);
                        rig.dinoHead.rotation.x = Math.sin(now * 0.002) * 0.08 + (isMoving ? 0.12 : 0);
                        rig.dinoHead.rotation.y = Math.sin(now * 0.0015) * 0.14;
                        if (rig.dinoLeftWing && rig.dinoRightWing) {
                            const paddleAngle = Math.sin(now * (isMoving ? 0.008 : 0.003)) * 0.45;
                            rig.dinoLeftWing.rotation.z = paddleAngle;
                            rig.dinoRightWing.rotation.z = -paddleAngle;
                            rig.dinoLeftWing.rotation.y = -paddleAngle * 0.5;
                            rig.dinoRightWing.rotation.y = paddleAngle * 0.5;
                        }
                        rig.dinoTail.position.set(0, 2.15, -1.55);
                        rig.dinoTail.rotation.y = isMoving ? Math.sin(now * 0.006) * 0.35 : Math.sin(now * 0.002) * 0.12;
                    }
                } else if (rig.botType === 'QUICKSHADOW') {
                    // Quickshadow Dilophosaurus: Sleek low prowl, predatory head, articulated jaw, stealth raptor arms, and agile whip tail
                    rig.dinoHead.position.set(0, 2.45 + (isMoving ? Math.sin(walkCycle) * 0.08 : 0), 1.55);
                    rig.dinoHead.rotation.x = (isMoving ? Math.sin(walkCycle) * 0.1 : 0) - smashOffset * 0.28;
                    if (rig.dinoLeftArm && rig.dinoRightArm) {
                        rig.dinoLeftArm.rotation.x = 0.45 + smashOffset * 0.7;
                        rig.dinoRightArm.rotation.x = 0.45 + smashOffset * 0.7;
                    }
                    rig.dinoTail.position.set(0, 2.15, -1.55);
                    rig.dinoTail.rotation.y = (isMoving ? walkSin * 0.42 : Math.sin(now * 0.003) * 0.14) + smashOffset * 0.6;
                }
            }

            // Spin Wheels & Propellers & Flash Emergency Lightbars
            rig.wheels.forEach(w => {
                w.rotation.x += speed * 0.016;
            });
            if (rig.rotors) {
                if (rig.botType === 'BLADES') {
                    const spinRate = m > 0.3 ? 0.032 : 0.004;
                    rig.rotors.rotation.y = now * spinRate;
                    const bladeScale = (0.48 * (1 - m) + 1.0 * m) * (1 - d * 0.75);
                    rig.rotors.scale.set(bladeScale, 1, bladeScale);
                } else if (rig.botType === 'HIGHTIDE') {
                    const propSpin = m > 0.3 ? 0.045 : 0.008;
                    rig.rotors.rotation.z = now * propSpin;
                    // Megabot articulated yellow crane arms motion!
                    if (rig.isMega && rig.megaCranes && rig.megaCranes.length > 0) {
                        const craneSmashLunge = smashOffset * 0.95;
                        const craneIdleSway = Math.sin(now * 0.0025) * 0.06;
                        rig.megaCranes.forEach((crane, idx) => {
                            const sideFactor = idx === 0 ? -1 : 1;
                            if (m > 0.5) {
                                // Vehicle (Rescue Ship) mode: deck crane elevated ready for salvage
                                crane.rotation.x = -0.35 + Math.sin(now * 0.002 + idx) * 0.04;
                                crane.rotation.z = sideFactor * -0.22;
                            } else if (d > 0.5) {
                                // Dino (Leviathan) mode: crane arms reach forward as crushing side mandibles
                                crane.rotation.x = 0.55 + Math.sin(now * 0.003 + idx) * 0.08;
                                crane.rotation.z = sideFactor * 0.15;
                            } else {
                                // Bot mode: menacing over-shoulder posture with idle sway and smash lunge!
                                crane.rotation.x = craneIdleSway + craneSmashLunge;
                                crane.rotation.z = sideFactor * -0.12;
                            }
                        });
                    }
                }
            }
            if (rig.tailRotor) {
                rig.tailRotor.rotation.x = now * 0.04;
            }
            if (rig.lightbar) {
                const isSirenFlashing = (rig.botType === player.botType && (player.sirenActive || player.boostTimer > 0));
                const flash = Math.floor(now / (isSirenFlashing ? 95 : 140)) % 2 === 0;
                const highScale = isSirenFlashing ? 1.38 : 1.18;
                const lowScale = isSirenFlashing ? 0.84 : 0.92;
                rig.lightbar.redPod.scale.setScalar(flash ? highScale : lowScale);
                rig.lightbar.bluePod.scale.setScalar(!flash ? highScale : lowScale);
            }
        }

export let botRigs = null;

export function initBotRigs(scene) {
    botRigs = {
        BOULDER: buildRescueBotModel("BOULDER"),
        HEATWAVE: buildRescueBotModel("HEATWAVE"),
        CHASE: buildRescueBotModel("CHASE"),
        BLADES: buildRescueBotModel("BLADES"),
        OPTIMUS: buildRescueBotModel("OPTIMUS"),
        BUMBLEBEE: buildRescueBotModel("BUMBLEBEE"),
        BLURR: buildRescueBotModel("BLURR"),
        SALVAGE: buildRescueBotModel("SALVAGE"),
        HIGHTIDE: buildRescueBotModel("HIGHTIDE"),
        QUICKSHADOW: buildRescueBotModel("QUICKSHADOW")
    };

    if (scene) {
        Object.values(botRigs).forEach(r => scene.add(r.root));
    }
    window.botRigs = botRigs;
    return botRigs;
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        buildRescueBotModel,
        applyBotRigMorph,
        setHighTideRigMega,
        getBotScale
    });
}

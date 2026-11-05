// Dr. Morocco Airship Lair & MorBot Boss Battle System
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight } from './terrain.js';
import {
    toonGrad3, toonGrad4,
    matMorBotBlack, matMorBotCrimson, matMorBotDarkCrimson, matMorBotDarkSteel, matMorBotSilver, matMorBotRedGlow, matMorBotCore,
    matMoroccoPurple, matMoroccoPurpleGlow, matMoroccoPurpleDark, matMoroccoGold, matMorBotGoldGlow, matMorBotGoldDark, matMorBotCyanVisor,
    matBlimpGreen, matBlimpGreenDark, matBlimpGondolaYellow, matBlimpGondolaWood, matBlimpWindowBlue, matBlimpCable, matMoroccoSkin, matMoroccoMustache,
    applyCartoonInkOutlines
} from '../rendering/materials.js';
import { player, buddyBot, botRigs } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech, showToast } from '../ui/dialogs.js';
import { spawnBurstParticles, spawnWaterCannonStream } from './emergencies.js';

export let activeMorBot = null;
export let morbotState = null;

        export const MORBOT_FLEET_CONFIGS = [
            {
                name: "MORBOT ALPHA",
                tag: "SCOUT",
                theme: "crimson",
                pursuitHp: 4,
                robotHp: 4,
                speed: 24.0,
                scale: 1.0,
                matMain: matMorBotBlack,
                matAccent: matMorBotCrimson,
                matDarkAccent: matMorBotDarkCrimson,
                matCore: matMorBotCore,
                matVisor: matMorBotRedGlow,
                accentColorHex: 0xdc2626
            },
            {
                name: "MORBOT BETA",
                tag: "SPEEDSTER",
                theme: "purple",
                pursuitHp: 5,
                robotHp: 5,
                speed: 26.5,
                scale: 1.05,
                matMain: matMorBotBlack,
                matAccent: matMoroccoPurple,
                matDarkAccent: matMoroccoPurpleDark,
                matCore: matMoroccoPurpleGlow,
                matVisor: matMorBotCyanVisor,
                accentColorHex: 0xa855f7
            },
            {
                name: "MORBOT GAMMA",
                tag: "TITAN",
                theme: "gold",
                pursuitHp: 6,
                robotHp: 6,
                speed: 23.0,
                scale: 1.18,
                matMain: matMorBotDarkSteel,
                matAccent: matMoroccoGold,
                matDarkAccent: matMorBotGoldDark,
                matCore: matMorBotGoldGlow,
                matVisor: matMorBotGoldGlow,
                accentColorHex: 0xf59e0b
            }
        ];

        export function buildMorBotModel(cfg = {}) {
            const root = new THREE.Group();

            const mMain = cfg.matMain || matMorBotBlack;
            const mAccent = cfg.matAccent || matMorBotCrimson;
            const mDarkAccent = cfg.matDarkAccent || matMorBotDarkCrimson;
            const mCore = cfg.matCore || matMorBotCore;
            const mVisor = cfg.matVisor || matMorBotRedGlow;

            // 1. VEHICLE MODE: Sinister Matte Supercar Coupe
            const vGroup = new THREE.Group();
            root.add(vGroup);

            // Low wedge chassis
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 7.4), mMain);
            chassis.position.y = 1.0;
            chassis.castShadow = true;
            vGroup.add(chassis);

            // Aerodynamic accent side skirts and front splitter
            const splitter = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.22, 1.6), mAccent);
            splitter.position.set(0, 0.55, 3.7);
            vGroup.add(splitter);

            // Slanted cabin greenhouse
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.95, 3.6), matMorBotDarkSteel);
            cabin.position.set(0, 1.9, -0.4);
            vGroup.add(cabin);

            // Mono-visor windshield strip
            const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.2), mVisor);
            windshield.position.set(0, 1.95, 1.42);
            vGroup.add(windshield);

            // Hood chevron & clear vent housing glowing Verne Device core
            const hoodCoreHousing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.8), mDarkAccent);
            hoodCoreHousing.position.set(0, 1.6, 1.8);
            vGroup.add(hoodCoreHousing);

            const vCore = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), mCore);
            vCore.position.set(0, 1.68, 1.8);
            vGroup.add(vCore);

            // Aggressive GT rear wing with accent endplates
            const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 0.9), mMain);
            wingBlade.position.set(0, 2.5, -3.3);
            const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 1.1), mAccent);
            wingL.position.set(-1.85, 2.3, -3.3);
            const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 1.1), mAccent);
            wingR.position.set(1.85, 2.3, -3.3);
            const wingStrutL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.2), matMorBotSilver);
            wingStrutL.position.set(-0.9, 1.85, -3.3);
            const wingStrutR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.2), matMorBotSilver);
            wingStrutR.position.set(0.9, 1.85, -3.3);
            vGroup.add(wingBlade, wingL, wingR, wingStrutL, wingStrutR);

            // Dual jet thrusters
            [-0.7, 0.7].forEach(tx => {
                const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.8, 12).rotateX(Math.PI / 2), matMorBotDarkSteel);
                nozzle.position.set(tx, 1.1, -3.8);
                const flameGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.05, 0.6, 8).rotateX(Math.PI / 2), mVisor);
                flameGlow.position.set(tx, 1.1, -4.2);
                vGroup.add(nozzle, flameGlow);
            });

            // 4 Sports Wheels with Accent Rims
            const wheels = [];
            [[-1.85, 2.1], [1.85, 2.1], [-1.85, -2.1], [1.85, -2.1]].forEach(([wx, wz]) => {
                const wG = new THREE.Group();
                wG.position.set(wx, 0.85, wz);
                const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.65, 16).rotateZ(Math.PI / 2), matTire);
                const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 12).rotateZ(Math.PI / 2), mAccent);
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.74, 8).rotateZ(Math.PI / 2), mMain);
                wG.add(tire, rim, hub);
                vGroup.add(wG);
                wheels.push(wG);
            });

            // 2. ROBOT MODE: Imposing Robotic Villain with Verne Core & Claw Gauntlets
            const rGroup = new THREE.Group();
            root.add(rGroup);
            rGroup.visible = false;

            // Chest & Torso
            const rTorso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 2.2), mMain);
            rTorso.position.y = 5.2;
            rTorso.castShadow = true;
            rGroup.add(rTorso);

            // Chest Accent Chevron Plate
            const rChestPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.4), mAccent);
            rChestPlate.position.set(0, 5.6, 1.2);
            rGroup.add(rChestPlate);

            // Pulsing Verne Device Core in chest center
            const rCore = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16).rotateX(Math.PI / 2), mCore);
            rCore.position.set(0, 5.5, 1.45);
            rGroup.add(rCore);

            // Sinister Robotic Head with Mono-Visor
            const rHeadGroup = new THREE.Group();
            rHeadGroup.position.set(0, 7.6, 0.15);
            rGroup.add(rHeadGroup);

            const rHelmet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.5), mMain);
            const rCrest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 1.7), mAccent);
            rCrest.position.set(0, 0.9, 0);
            const rVisor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.35, 0.25), mVisor);
            rVisor.position.set(0, 0.05, 0.76);
            rHeadGroup.add(rHelmet, rCrest, rVisor);

            // Massive Angular Shoulders & Arms with Claw Gauntlets
            const leftArm = new THREE.Group();
            leftArm.position.set(-2.4, 6.2, 0);
            const rightArm = new THREE.Group();
            rightArm.position.set(2.4, 6.2, 0);
            rGroup.add(leftArm, rightArm);

            [leftArm, rightArm].forEach((armG, idx) => {
                const sSign = idx === 0 ? -1 : 1;
                const pauldron = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.8), mAccent);
                pauldron.position.set(sSign * 0.3, 0.2, 0);
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 4).rotateZ(sSign * -0.6), matMorBotSilver);
                spike.position.set(sSign * 1.1, 0.8, 0);

                const bicep = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 1.0), matMorBotDarkSteel);
                bicep.position.set(0, -1.2, 0);

                const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.0, 1.3), mMain);
                gauntlet.position.set(0, -2.8, 0.2);

                // Claw prongs
                const claw1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.4), matMorBotSilver);
                claw1.position.set(-0.35, -4.0, 0.2);
                const claw2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.4), matMorBotSilver);
                claw2.position.set(0.35, -4.0, 0.2);
                const claw3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.2), matMorBotSilver);
                claw3.position.set(0, -4.0, -0.2);

                armG.add(pauldron, spike, bicep, gauntlet, claw1, claw2, claw3);
            });

            // Hip & Armored Legs
            const hip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.8), matMorBotDarkSteel);
            hip.position.y = 3.2;
            rGroup.add(hip);

            const leftLeg = new THREE.Group();
            leftLeg.position.set(-1.1, 2.8, 0);
            const rightLeg = new THREE.Group();
            rightLeg.position.set(1.1, 2.8, 0);
            rGroup.add(leftLeg, rightLeg);

            [leftLeg, rightLeg].forEach(legG => {
                const thigh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 1.2), mMain);
                thigh.position.y = -0.9;

                const shin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.5), mAccent);
                shin.position.set(0, -2.6, 0.15);

                const foot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.4), mMain);
                foot.position.set(0, -3.9, 0.5);

                const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.2, 10).rotateX(0.2), matMorBotSilver);
                thruster.position.set(0, -2.6, -0.8);

                legG.add(thigh, shin, foot, thruster);
            });

            if (cfg.scale && cfg.scale !== 1.0) {
                root.scale.setScalar(cfg.scale);
            }

            applyCartoonInkOutlines(root, 1.03, true);

            return {
                root,
                vGroup,
                rGroup,
                wheels,
                leftArm,
                rightArm,
                leftLeg,
                rightLeg,
                rHeadGroup,
                vCore,
                rCore,
                setMode(isRobot) {
                    vGroup.visible = !isRobot;
                    rGroup.visible = isRobot;
                }
            };
        }

        const morbotBattle = {
            state: 'IDLE', // 'IDLE', 'PURSUIT', 'ROBOT', 'INTERMISSION', 'VICTORY', 'DEFEATED'
            fleetIndex: 0,
            hp: 4,
            maxHp: 4,
            pos: new THREE.Vector3(-820, 11.5, -1170),
            heading: 0,
            pitch: 0,
            speed: 0,
            triggerCooldown: 0,
            invulnerableTimer: 0,
            staggerTimer: 0,
            hitFlashTimer: 0,
            pursuitWobbleTimer: 0,
            attackTimer: 0,
            sparkTimer: 0,
            rocketLaunchY: 0,
            rocketSpeed: 0,
            battlefieldRocket: null,
            battlefieldRocketY: 0,
            battlefieldRocketSpeed: 0,
            sparkHazards: [],
            // Highway pursuit route
            pursuitTheta: 4.2,
            pursuitLaneOffset: 3.2,
            // 3D Objects
            rigs: [],
            rig: null,
            lairGroup: null,
            rocketMesh: null,
            triggerRingMesh: null,
            triggerRingGlow: null,
            teslaArcs: [],
            blimpEnvelopeG: null,
            blimpProps: [],
            blimpCage: null,
            // 3D World Overhead Health Bar Billboard
            overheadCanvas: null,
            overheadCtx: null,
            overheadTex: null,
            overheadMesh: null,

            getCurrentConfig() {
                return MORBOT_FLEET_CONFIGS[this.fleetIndex] || MORBOT_FLEET_CONFIGS[0];
            },

            init() {
                // 1. Build Dr. Morocco's Secret Cliffside Airship Blimp Lair & Rocket Pad at (-820, -1180)
                const lairG = new THREE.Group();
                const lairBaseY = 11.5;
                lairG.position.set(-820, lairBaseY, -1180);

                // --- DR. MOROCCO'S ICONIC STEAMPUNK BLIMP AIRSHIP ---
                const blimpRoot = new THREE.Group();
                blimpRoot.position.set(0, 0, 0);

                // Floating Envelope Group (with buoyancy bobbing)
                const envelopeG = new THREE.Group();
                envelopeG.position.set(0, 21.0, 0);

                // 1. Airship Gasbag Envelope: Tri-color striped bands matching cartoon reference
                // Center Broad Stripe: Moroccan Imperial Purple
                const hullCenter = new THREE.Mesh(
                    new THREE.SphereGeometry(9.0, 32, 24),
                    matMoroccoPurple
                );
                hullCenter.scale.set(1.0, 1.0, 2.65);
                hullCenter.castShadow = true;
                envelopeG.add(hullCenter);

                // Upper Hull Dome: Muted Avocado/Olive Green
                const hullTop = new THREE.Mesh(
                    new THREE.SphereGeometry(9.12, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.38),
                    matBlimpGreen
                );
                hullTop.scale.set(1.0, 1.0, 2.65);
                hullTop.castShadow = true;
                envelopeG.add(hullTop);

                // Lower Hull Keel: Muted Avocado/Olive Green
                const hullBottom = new THREE.Mesh(
                    new THREE.SphereGeometry(9.08, 32, 18, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38),
                    matBlimpGreen
                );
                hullBottom.scale.set(1.0, 1.0, 2.65);
                hullBottom.castShadow = true;
                envelopeG.add(hullBottom);

                // Golden Separator Trim Bands between Purple & Green
                [3.5, -3.5].forEach(ty => {
                    const band = new THREE.Mesh(
                        new THREE.TorusGeometry(8.3, 0.22, 10, 36).rotateX(Math.PI / 2),
                        matMoroccoGold
                    );
                    band.scale.set(1.0, 2.62, 1.0);
                    band.position.y = ty;
                    envelopeG.add(band);
                });

                // Longitudinal Golden Framework Ribs
                [0, Math.PI / 4, Math.PI / 2, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75].forEach(ang => {
                    const rib = new THREE.Mesh(
                        new THREE.TorusGeometry(8.95, 0.12, 8, 36),
                        matMoroccoGold
                    );
                    rib.scale.set(1.0, 2.64, 1.0);
                    rib.rotation.y = ang;
                    envelopeG.add(rib);
                });

                // Tail Fins (Cruciform Empennage at Stern: z = -20.5)
                const tailG = new THREE.Group();
                tailG.position.set(0, 0, -20.5);

                const finDefs = [
                    { w: 0.45, h: 8.5, len: 10.0, dy: 7.2, dx: 0, isVert: true },   // Top dorsal fin
                    { w: 0.45, h: 8.5, len: 10.0, dy: -7.2, dx: 0, isVert: true },  // Bottom ventral fin
                    { w: 8.5, h: 0.45, len: 10.0, dy: 0, dx: 7.2, isVert: false }, // Starboard fin
                    { w: 8.5, h: 0.45, len: 10.0, dy: 0, dx: -7.2, isVert: false } // Port fin
                ];

                finDefs.forEach(fd => {
                    const finBlade = new THREE.Mesh(
                        new THREE.BoxGeometry(fd.w, fd.h, fd.len),
                        matMoroccoPurple
                    );
                    finBlade.position.set(fd.dx, fd.dy, 0);
                    tailG.add(finBlade);

                    // Golden framework ladder trim on trailing edge
                    const ladderBar = new THREE.Mesh(
                        new THREE.BoxGeometry(fd.w + 0.15, fd.h + 0.2, 0.5),
                        matMoroccoGold
                    );
                    ladderBar.position.set(fd.dx, fd.dy, -4.8);
                    tailG.add(ladderBar);

                    // Golden ladder rungs
                    for (let r = -3.5; r <= 3.5; r += 1.8) {
                        const rungLen = fd.isVert ? 1.4 : 1.4;
                        const rung = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.12, 0.12, rungLen, 6),
                            matMoroccoGold
                        );
                        if (!fd.isVert) rung.rotation.z = Math.PI / 2;
                        rung.position.set(fd.dx, fd.dy, r);
                        tailG.add(rung);
                    }
                });
                envelopeG.add(tailG);

                // Twin Propulsion Engine Pods (Outriggers Port & Starboard)
                this.blimpProps = [];
                [-11.2, 11.2].forEach(posX => {
                    const engineG = new THREE.Group();
                    engineG.position.set(posX, -2.5, -3.0);

                    // Outrigger golden lattice strut catwalk to hull
                    const strut = new THREE.Mesh(
                        new THREE.BoxGeometry(Math.abs(posX) * 0.45, 0.4, 6.5),
                        matMoroccoGold
                    );
                    strut.position.x = posX > 0 ? -2.2 : 2.2;
                    engineG.add(strut);

                    // Cylindrical brass engine nacelle
                    const nacelle = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.65, 1.8, 8.0, 16).rotateX(Math.PI / 2),
                        matMorBotGoldDark
                    );
                    nacelle.castShadow = true;
                    const noseSpinner = new THREE.Mesh(
                        new THREE.ConeGeometry(1.65, 2.5, 16).rotateX(-Math.PI / 2),
                        matMoroccoGold
                    );
                    noseSpinner.position.z = 4.8;
                    const exhaustFunnel = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.4, 1.7, 1.8, 16).rotateX(Math.PI / 2),
                        matMorBotDarkSteel
                    );
                    exhaustFunnel.position.z = -4.5;
                    engineG.add(nacelle, noseSpinner, exhaustFunnel);

                    // 3-Blade Golden Propeller
                    const propG = new THREE.Group();
                    propG.position.z = -5.4;
                    const propHub = new THREE.Mesh(
                        new THREE.SphereGeometry(0.65, 12, 12),
                        matMoroccoGold
                    );
                    propG.add(propHub);
                    [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(pAng => {
                        const blade = new THREE.Mesh(
                            new THREE.BoxGeometry(0.35, 3.4, 0.08),
                            matMoroccoGold
                        );
                        blade.position.set(Math.sin(pAng) * 1.6, Math.cos(pAng) * 1.6, 0);
                        blade.rotation.z = -pAng + 0.35;
                        propG.add(blade);
                    });
                    engineG.add(propG);
                    this.blimpProps.push(propG);

                    envelopeG.add(engineG);
                });

                // 2. The Gondola (Main Steampunk Cabin) suspended under envelope
                const gondolaG = new THREE.Group();
                gondolaG.position.set(0, -9.5, 1.5);

                // Upper Bridge / Deck in Rich Mahogany Wood
                const bridgeUpper = new THREE.Mesh(
                    new THREE.BoxGeometry(7.5, 3.8, 17.0),
                    matBlimpGondolaWood
                );
                bridgeUpper.position.y = 1.9;
                bridgeUpper.castShadow = true;
                gondolaG.add(bridgeUpper);

                // Front Bridge Observation Windows (curved cyan glass)
                const frontWindow = new THREE.Mesh(
                    new THREE.BoxGeometry(6.6, 2.2, 0.4),
                    matBlimpWindowBlue
                );
                frontWindow.position.set(0, 2.2, 8.52);
                const frontWindowRoofBrim = new THREE.Mesh(
                    new THREE.BoxGeometry(7.8, 0.4, 1.2),
                    matMoroccoGold
                );
                frontWindowRoofBrim.position.set(0, 3.7, 8.8);
                gondolaG.add(frontWindow, frontWindowRoofBrim);

                // Lower Fuselage in Warm Golden Yellow
                const fuselageLower = new THREE.Mesh(
                    new THREE.BoxGeometry(6.6, 3.2, 15.5),
                    matBlimpGondolaYellow
                );
                fuselageLower.position.y = -1.2;
                fuselageLower.castShadow = true;
                const bellyCurve = new THREE.Mesh(
                    new THREE.CylinderGeometry(3.3, 3.3, 15.5, 16, 1, false, 0, Math.PI).rotateZ(-Math.PI / 2),
                    matBlimpGondolaYellow
                );
                bellyCurve.position.y = -2.8;
                gondolaG.add(fuselageLower, bellyCurve);

                // Circular Portholes along Port & Starboard Sides
                [-6.0, -3.0, 0, 3.0, 6.0].forEach(pz => {
                    [-3.32, 3.32].forEach(px => {
                        const porthole = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.7, 0.7, 0.12, 14).rotateZ(Math.PI / 2),
                            matBlimpWindowBlue
                        );
                        porthole.position.set(px, -1.0, pz);
                        const rim = new THREE.Mesh(
                            new THREE.TorusGeometry(0.72, 0.08, 8, 14).rotateY(Math.PI / 2),
                            matMoroccoGold
                        );
                        rim.position.set(px, -1.0, pz);
                        gondolaG.add(porthole, rim);
                    });
                });

                // Steampunk Brass Chimneys & Pressure Valves on Gondola Roof
                [-4.0, 2.0].forEach(cz => {
                    const chimney = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.35, 0.45, 1.8, 10),
                        matMoroccoGold
                    );
                    chimney.position.set(2.4, 4.3, cz);
                    gondolaG.add(chimney);
                });

                // Landing Gear Struts & Pontoon Skids resting on plateau
                [-3.6, 3.6].forEach(lx => {
                    const skid = new THREE.Mesh(
                        new THREE.BoxGeometry(1.4, 0.6, 17.5),
                        matMoroccoGold
                    );
                    skid.position.set(lx, -10.8, 0);
                    skid.castShadow = true;
                    gondolaG.add(skid);

                    // Angled golden truss legs
                    [-5.5, 0, 5.5].forEach(lz => {
                        const leg = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.18, 0.22, 8.5, 8),
                            matMoroccoGold
                        );
                        leg.position.set(lx, -6.6, lz);
                        leg.rotation.z = lx > 0 ? 0.08 : -0.08;
                        gondolaG.add(leg);
                    });
                });

                envelopeG.add(gondolaG);
                blimpRoot.add(envelopeG);
                this.blimpEnvelopeG = envelopeG;

                // 3. Dr. Morocco's Suspended Birdcage Elevator & Figurine
                const winchG = new THREE.Group();
                winchG.position.set(0, 11.5, 5.0);

                const winchHousing = new THREE.Mesh(
                    new THREE.BoxGeometry(3.2, 1.8, 3.2),
                    matBlimpGondolaWood
                );
                winchHousing.position.y = -0.9;
                winchG.add(winchHousing);

                // Heavy vertical suspension cable dropping to ground
                const hoistCable = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.12, 0.12, 7.8, 8),
                    matBlimpCable
                );
                hoistCable.position.y = -4.8;
                winchG.add(hoistCable);

                // Birdcage Elevator Cage Platform at ground level
                const cageG = new THREE.Group();
                cageG.position.set(0, -9.0, 0);

                // Circular Golden Base Plinth
                const cageBase = new THREE.Mesh(
                    new THREE.CylinderGeometry(2.4, 2.5, 0.5, 24),
                    matMoroccoGold
                );
                cageBase.position.y = 0.25;
                cageBase.castShadow = true;

                // Circular Golden Domed Roof Ring
                const cageRoof = new THREE.Mesh(
                    new THREE.CylinderGeometry(2.5, 2.4, 0.45, 24),
                    matMoroccoGold
                );
                cageRoof.position.y = 3.6;
                const roofDome = new THREE.Mesh(
                    new THREE.SphereGeometry(2.4, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.3),
                    matMoroccoGold
                );
                roofDome.position.y = 3.8;
                const topEyelet = new THREE.Mesh(
                    new THREE.TorusGeometry(0.4, 0.1, 8, 16),
                    matMoroccoGold
                );
                topEyelet.position.y = 4.7;

                cageG.add(cageBase, cageRoof, roofDome, topEyelet);

                // Golden Vertical Cage Bars (leaving entrance doorway facing south)
                const numBars = 16;
                for (let i = 0; i < numBars; i++) {
                    const ang = (i / numBars) * Math.PI * 2;
                    // Leave door opening at front (near ang ~ Math.PI / 2)
                    if (ang > Math.PI * 0.38 && ang < Math.PI * 0.62) continue;
                    const bar = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8),
                        matMoroccoGold
                    );
                    bar.position.set(Math.cos(ang) * 2.3, 1.9, Math.sin(ang) * 2.3);
                    cageG.add(bar);
                }

                // Interior golden safety railing
                const cageRail = new THREE.Mesh(
                    new THREE.TorusGeometry(2.15, 0.08, 8, 24).rotateX(Math.PI / 2),
                    matMoroccoGold
                );
                cageRail.position.y = 1.45;
                cageG.add(cageRail);

                // --- 3D FIGURINE: DR. MOROCCO INSIDE THE BIRDCAGE ---
                const moroccoG = new THREE.Group();
                moroccoG.position.set(0, 0.5, 0.2); // standing on cage floor
                moroccoG.rotation.y = Math.PI; // facing south towards approaching player

                // Legs & Boots
                const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.35), matMorBotDarkSteel);
                legL.position.set(-0.25, 0.42, 0);
                const legR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.35), matMorBotDarkSteel);
                legR.position.set(0.25, 0.42, 0);
                const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.5), matMorBotBlack);
                bootL.position.set(-0.25, 0.12, 0.08);
                const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.5), matMorBotBlack);
                bootR.position.set(0.25, 0.12, 0.08);
                moroccoG.add(legL, legR, bootL, bootR);

                // Torso & Waistcoat in Moroccan Imperial Purple
                const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.55), matMoroccoPurpleDark);
                torso.position.y = 1.35;
                const coatTails = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.75, 0.3), matMoroccoPurple);
                coatTails.position.set(0, 0.85, -0.22);
                moroccoG.add(torso, coatTails);

                // Ascot Tie & Verne Device Crystal on Chest
                const shirtCollar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.15), matMorBotSilver);
                shirtCollar.position.set(0, 1.65, 0.25);
                const ascotTie = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.12), matMoroccoPurple);
                ascotTie.position.set(0, 1.45, 0.28);
                const verneCore = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.18),
                    matMorBotCore
                );
                verneCore.position.set(0, 1.32, 0.32);
                moroccoG.add(shirtCollar, ascotTie, verneCore);

                // Arms: Dramatic villain pose (one arm grasping railing, one gesturing haughtily)
                const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), matMoroccoPurpleDark);
                armL.position.set(-0.55, 1.35, 0.2);
                armL.rotation.x = -0.4;
                const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), matMoroccoPurpleDark);
                armR.position.set(0.55, 1.45, 0.15);
                armR.rotation.x = -0.7;
                armR.rotation.z = 0.3;
                moroccoG.add(armL, armR);

                // Head, Sleek Black Swept-Back Hair, Pencil Mustache & Gold Monocle (Show-Accurate)
                const head = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.62, 12), matMoroccoSkin);
                head.position.y = 2.06;
                const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.16), matMoroccoSkin);
                nose.position.set(0, 2.02, 0.28);

                // Sleek Black Swept-Back Hair with Widow's Peak & Wings
                const hairDome = new THREE.Mesh(
                    new THREE.SphereGeometry(0.31, 14, 12).scale(1.02, 0.95, 1.15),
                    matMorBotBlack
                );
                hairDome.position.set(0, 2.22, -0.04);
                const widowPeak = new THREE.Mesh(
                    new THREE.ConeGeometry(0.09, 0.18, 6).rotateX(Math.PI),
                    matMorBotBlack
                );
                widowPeak.position.set(0, 2.24, 0.28);

                // Swept-back side wings
                [-0.28, 0.28].forEach((wx, idx) => {
                    const wing = new THREE.Mesh(
                        new THREE.ConeGeometry(0.08, 0.25, 6).rotateZ(idx === 0 ? 1.25 : -1.25),
                        matMorBotBlack
                    );
                    wing.position.set(wx, 2.22, -0.06);
                    hairDome.add(wing);
                });

                // Pointed Ears
                [-0.27, 0.27].forEach((ex, idx) => {
                    const ear = new THREE.Mesh(
                        new THREE.ConeGeometry(0.06, 0.16, 6).rotateZ(idx === 0 ? -0.8 : 0.8),
                        matMoroccoSkin
                    );
                    ear.position.set(ex, 2.08, 0.02);
                    moroccoG.add(ear);
                });

                // Trim Black Pencil Mustache
                const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.08), matMorBotBlack);
                mustache.position.set(0, 1.94, 0.26);

                // Gold Monocle on Right Eye with Purple Tinted Glass
                const monocleRim = new THREE.Mesh(
                    new THREE.TorusGeometry(0.1, 0.022, 8, 16),
                    matMoroccoGold
                );
                monocleRim.position.set(-0.11, 2.12, 0.26);
                const monocleGlass = new THREE.Mesh(
                    new THREE.CircleGeometry(0.09, 14),
                    new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
                );
                monocleGlass.position.set(-0.11, 2.12, 0.265);

                // Hanging Monocle Cord down to Lapel Pin
                const monocleCord = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6),
                    matMorBotBlack
                );
                monocleCord.position.set(-0.16, 1.88, 0.24);
                monocleCord.rotation.z = -0.3;

                // Gold Verne Device Oval Brooch on Shirt Collar
                const verneBrooch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12).rotateX(Math.PI / 2),
                    matMoroccoGold
                );
                verneBrooch.position.set(0, 1.55, 0.32);
                const verneGem = new THREE.Mesh(
                    new THREE.SphereGeometry(0.06, 10, 10),
                    matMoroccoPurpleGlow
                );
                verneGem.position.set(0, 1.55, 0.34);

                moroccoG.add(head, nose, hairDome, widowPeak, mustache, monocleRim, monocleGlass, monocleCord, verneBrooch, verneGem);
                cageG.add(moroccoG);

                winchG.add(cageG);
                lairG.add(winchG);
                this.blimpCage = cageG;

                // Ground Mooring Anchors with glowing Moroccan Purple Pylons
                [-24, 24].forEach(px => {
                    const pylon = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.6, 0.9, 3.2, 10),
                        matMorBotDarkSteel
                    );
                    pylon.position.set(px, 1.6, 15);
                    const pylonCap = new THREE.Mesh(
                        new THREE.SphereGeometry(0.7, 10, 10),
                        matMoroccoPurpleGlow
                    );
                    pylonCap.position.set(px, 3.2, 15);
                    const mooringCable = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.08, 0.08, 22.0, 6),
                        matBlimpCable
                    );
                    mooringCable.position.set(px * 0.5, 11.5, 8);
                    mooringCable.rotation.z = px > 0 ? 0.75 : -0.75;
                    mooringCable.rotation.x = -0.3;
                    lairG.add(pylon, pylonCap, mooringCable);
                });

                lairG.add(blimpRoot);

                // Dr. Morocco's Escape Rocket Launch Pad at (-855, -1195)
                const padPlinth = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 2.0, 16), matMorBotDarkSteel);
                padPlinth.position.set(-35, 1.0, -15);
                const padRing = new THREE.Mesh(new THREE.RingGeometry(7.0, 8.2, 16).rotateX(-Math.PI / 2), matMorBotRedGlow);
                padRing.position.set(-35, 2.05, -15);
                lairG.add(padPlinth, padRing);

                // Rocket Lattice Gantry Tower
                const gantry = new THREE.Mesh(new THREE.BoxGeometry(3.0, 26, 3.0), matMorBotBlack);
                gantry.position.set(-38, 13, -15);
                lairG.add(gantry);

                // Dr. Morocco Escape Rocket (pad rocket at lair)
                const rocketG = new THREE.Group();
                rocketG.position.set(-35, 2.2, -15);

                const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 18, 16), matMorBotSilver);
                rocketBody.position.y = 9.0;
                const noseCone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6.0, 16), matMorBotCrimson);
                noseCone.position.y = 21.0;
                const rocketCockpit = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10), matMoroccoPurpleGlow);
                rocketCockpit.position.set(0, 15.5, 1.5);

                // 4 Aerodynamic Golden Fins
                [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(ang => {
                    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.0, 2.4), matMoroccoGold);
                    fin.position.set(Math.sin(ang) * 2.2, 4.0, Math.cos(ang) * 2.2);
                    fin.rotation.y = ang;
                    rocketG.add(fin);
                });

                rocketG.add(rocketBody, noseCone, rocketCockpit);
                lairG.add(rocketG);
                this.rocketMesh = rocketG;

                // 2. Holographic Challenge Trigger Ring at Entrance (X: -820, Z: -1140)
                const triggerG = new THREE.Group();
                triggerG.position.set(0, 0.12, 40); // 40m south in front of gate, right on the road entrance!

                const ringMesh = new THREE.Mesh(
                    new THREE.RingGeometry(6.5, 8.5, 32).rotateX(-Math.PI / 2),
                    new THREE.MeshBasicMaterial({ color: 0x9333ea, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
                );
                const glowRing = new THREE.Mesh(
                    new THREE.RingGeometry(5.2, 6.5, 32).rotateX(-Math.PI / 2),
                    new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
                );
                const iconGear = new THREE.Mesh(
                    new THREE.CylinderGeometry(2.4, 2.4, 0.3, 10).rotateX(Math.PI / 2),
                    matMoroccoGold
                );
                iconGear.position.y = 0.2;

                triggerG.add(ringMesh, glowRing, iconGear);
                lairG.add(triggerG);
                this.triggerRingMesh = ringMesh;
                this.triggerRingGlow = glowRing;

                applyCartoonInkOutlines(lairG, 1.03, true);
                scene.add(lairG);
                this.lairGroup = lairG;
                registerCullableObject(lairG, -820, lairBaseY + 12, -1180, 75);

                // Register Solid Physical Colliders for Dr. Morocco's Blimp Lair & Rocket Pad
                if (typeof worldColliders !== 'undefined' && Array.isArray(worldColliders)) {
                    worldColliders.push({ x: -820, z: -1180, r: 16.0 }); // Blimp Fuselage & Landing Skids
                    worldColliders.push({ x: -820, z: -1175, r: 4.5 });  // Dr. Morocco Suspended Birdcage Elevator
                    worldColliders.push({ x: -855, z: -1195, r: 11.5 }); // Escape Rocket Pad & Gantry
                    worldColliders.push({ x: -844, z: -1165, r: 3.5 });  // West Mooring Pylon
                    worldColliders.push({ x: -796, z: -1165, r: 3.5 });  // East Mooring Pylon
                }

                // 3. Build MorBot Models for each Fleet member (Alpha, Beta, Gamma)
                this.rigs = MORBOT_FLEET_CONFIGS.map(cfg => {
                    const r = buildMorBotModel(cfg);
                    r.root.position.copy(this.pos);
                    r.root.visible = false;
                    scene.add(r.root);
                    return r;
                });
                this.fleetIndex = 0;
                this.rig = this.rigs[0];

                // 4. Build 3D Overhead Health Bar Billboard
                this.buildOverheadHealthBar();
            },

            buildOverheadHealthBar() {
                const c = document.createElement('canvas');
                c.width = 512;
                c.height = 128;
                this.overheadCanvas = c;
                this.overheadCtx = c.getContext('2d');
                this.overheadTex = new THREE.CanvasTexture(c);
                this.overheadTex.minFilter = THREE.LinearFilter;

                const mat = new THREE.MeshBasicMaterial({
                    map: this.overheadTex,
                    transparent: true,
                    depthTest: false,
                    side: THREE.DoubleSide
                });

                const geo = new THREE.PlaneGeometry(8.2, 2.05);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(0, 6.2, 0);
                mesh.renderOrder = 999;
                mesh.visible = false;
                scene.add(mesh);
                this.overheadMesh = mesh;
                this.redrawOverheadBar();
            },

            drawSafeRoundRect(ctx, x, y, w, h, r) {
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, r);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.lineTo(x + w - r, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                    ctx.lineTo(x + w, y + h - r);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                    ctx.lineTo(x + r, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                    ctx.lineTo(x, y + r);
                    ctx.quadraticCurveTo(x, y, x + r, y);
                    ctx.closePath();
                }
            },

            redrawOverheadBar(badgeText = "") {
                if (!this.overheadCtx) return;
                try {
                    const ctx = this.overheadCtx;
                    const cfg = this.getCurrentConfig();
                    ctx.clearRect(0, 0, 512, 128);

                    // Dark Cartoon Tech Container with Accent Border
                    ctx.fillStyle = 'rgba(10, 15, 29, 0.94)';
                    ctx.strokeStyle = this.state === 'ROBOT' ? '#c084fc' : (cfg.accentColorHex ? `#${cfg.accentColorHex.toString(16).padStart(6, '0')}` : '#ef4444');
                    ctx.lineWidth = 6;
                    this.drawSafeRoundRect(ctx, 10, 10, 492, 108, 22);
                    ctx.fill();
                    ctx.stroke();

                    // Title
                    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
                    ctx.fillStyle = this.state === 'ROBOT' ? '#e879f9' : (cfg.theme === 'gold' ? '#fde047' : (cfg.theme === 'purple' ? '#c084fc' : '#f87171'));
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 8;
                    ctx.fillText(`DR. MOROCCO: ${cfg.name}`, 26, 42);
                    ctx.shadowBlur = 0;

                    // Subtitle / Phase Tag
                    ctx.font = '800 16px system-ui, sans-serif';
                    ctx.fillStyle = '#facc15';
                    const phaseLabel = this.state === 'PURSUIT' ? `PHASE 1: PURSUIT (${this.fleetIndex + 1}/3)` : (this.state === 'ROBOT' ? `PHASE 2: ROBOT SHOWDOWN` : (this.state === 'VICTORY' || this.state === 'DEFEATED' ? '🏆 DEFEATED' : 'INTERMISSION'));
                    ctx.fillText(phaseLabel, 305, 42);

                    // Solid Filled Health Segments
                    const barY = 56;
                    const barH = 34;
                    const numBars = this.maxHp || 4;
                    const totalW = 460;
                    const gap = 10;
                    const barW = (totalW - gap * (numBars - 1)) / numBars;
                    const startX = 26;

                    for (let i = 0; i < numBars; i++) {
                        const bx = startX + i * (barW + gap);
                        const isFilled = (i + 1) <= this.hp;

                        // Slot Background
                        ctx.fillStyle = '#0f172a';
                        this.drawSafeRoundRect(ctx, bx, barY, barW, barH, 6);
                        ctx.fill();

                        if (isFilled) {
                            // Solid filled gradient with white border
                            const grad = ctx.createLinearGradient(bx, barY, bx, barY + barH);
                            if (this.state === 'ROBOT') {
                                grad.addColorStop(0, '#f0abfc');
                                grad.addColorStop(0.5, '#c026d3');
                                grad.addColorStop(1, '#701a75');
                            } else if (cfg.theme === 'gold') {
                                grad.addColorStop(0, '#fef08a');
                                grad.addColorStop(0.5, '#eab308');
                                grad.addColorStop(1, '#854d0e');
                            } else if (cfg.theme === 'purple') {
                                grad.addColorStop(0, '#e9d5ff');
                                grad.addColorStop(0.5, '#9333ea');
                                grad.addColorStop(1, '#581c87');
                            } else {
                                grad.addColorStop(0, '#fca5a5');
                                grad.addColorStop(0.5, '#ef4444');
                                grad.addColorStop(1, '#991b1b');
                            }
                            ctx.fillStyle = grad;
                            this.drawSafeRoundRect(ctx, bx + 2, barY + 2, barW - 4, barH - 4, 4);
                            ctx.fill();

                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 2.4;
                            ctx.stroke();
                        } else {
                            ctx.strokeStyle = '#334155';
                            ctx.lineWidth = 1.4;
                            this.drawSafeRoundRect(ctx, bx + 2, barY + 2, barW - 4, barH - 4, 4);
                            ctx.stroke();
                        }
                    }

                    // Optional floating text badge (e.g. "💥 -1 HP! CRITICAL HIT!")
                    if (badgeText) {
                        ctx.font = '900 22px system-ui, sans-serif';
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = '#facc15';
                        ctx.shadowBlur = 10;
                        ctx.fillText(badgeText, 140, 114);
                        ctx.shadowBlur = 0;
                    }

                    this.overheadTex.needsUpdate = true;
                } catch (e) {
                    console.warn("Error drawing overhead bar:", e);
                }
            },

            openChallengeModal() {
                if (this.state !== 'IDLE') return;
                const modal = document.getElementById('morocco-modal');
                if (modal) modal.classList.remove('hidden');
            },

            closeChallengeModal(startBattle) {
                const modal = document.getElementById('morocco-modal');
                if (modal) modal.classList.add('hidden');

                if (!startBattle) {
                    this.triggerCooldown = 8.0; // Grace period to drive away
                    return;
                }

                // START BOSS BATTLE WITH FIRST BOT: MORBOT ALPHA!
                this.fleetIndex = 0;
                this.spawnBot(0, true);
            },

            spawnBot(index, isFirst = false) {
                this.fleetIndex = index;
                const cfg = this.getCurrentConfig();

                // Hide all rigs and select the active bot rig
                this.rigs.forEach((r, idx) => {
                    if (r && r.root) r.root.visible = (idx === index);
                });
                this.rig = this.rigs[index] || this.rigs[0];

                this.state = 'PURSUIT';
                this.hp = cfg.pursuitHp;
                this.maxHp = cfg.pursuitHp;
                this.invulnerableTimer = isFirst ? 0 : 1.2;
                this.staggerTimer = 0;
                this.pursuitWobbleTimer = 0;
                this.hitFlashTimer = 0;

                const hud = document.getElementById('morbot-boss-hud');
                if (hud) hud.classList.remove('hidden');

                const title = document.getElementById('morbot-boss-title');
                if (title) title.textContent = `${cfg.name} (${index + 1}/3) • PHASE 1: HIGH-SPEED PURSUIT`;
                const sub = document.getElementById('morbot-boss-subtitle');
                if (sub) sub.textContent = `Pursue ${cfg.name} along the island highway & strike!`;

                // Spawn MorBot onto the road ahead
                this.rig.setMode(false);
                if (this.rig.rHeadGroup) this.rig.rHeadGroup.rotation.x = 0;
                if (this.rig.leftArm) this.rig.leftArm.rotation.x = 0;
                if (this.rig.rightArm) this.rig.rightArm.rotation.x = 0;
                if (this.rig.leftLeg) this.rig.leftLeg.rotation.x = 0;
                if (this.rig.rightLeg) this.rig.rightLeg.rotation.x = 0;
                this.rig.root.visible = true;
                if (this.overheadMesh) this.overheadMesh.visible = true;

                this.speed = cfg.speed;

                if (isFirst) {
                    this.pursuitTheta = Math.atan2(-1140, -640);
                } else {
                    // Place the next bot ahead on the highway relative to player
                    const playerTheta = Math.atan2(player.pos.z, player.pos.x);
                    this.pursuitTheta = (playerTheta + 0.12) % (Math.PI * 2);
                }

                const r = getOuterRoadRadius(this.pursuitTheta);
                this.pos.set(Math.cos(this.pursuitTheta) * r, getTerrainHeight(Math.cos(this.pursuitTheta) * r, Math.sin(this.pursuitTheta) * r), Math.sin(this.pursuitTheta) * r);
                this.heading = this.pursuitTheta + Math.PI / 2;
                this.rig.root.position.copy(this.pos);
                this.rig.root.rotation.y = this.heading;

                this.updateHPHUD();

                sfx.playMorbotAlert();
                showToast(`🚨 ${cfg.name} DEPLOYED! (${index + 1}/3)`, `Pursue ${cfg.name} along the highway and use your bot powers!`);
            },

            updateHPHUD() {
                try {
                    const pipsContainer = document.getElementById('morbot-hp-pips');
                    const cfg = this.getCurrentConfig();
                    if (pipsContainer) {
                        let html = '';
                        for (let i = 1; i <= this.maxHp; i++) {
                            const isFilled = i <= this.hp;
                            let bg, border, glow, pipClass;
                            if (isFilled) {
                                if (this.state === 'ROBOT') {
                                    bg = 'linear-gradient(180deg, #f0abfc 0%, #a855f7 100%)';
                                    border = '#f5d0fe';
                                    glow = '0 0 10px rgba(168, 85, 247, 0.95)';
                                    pipClass = 'pip-purple';
                                } else if (cfg.theme === 'gold') {
                                    bg = 'linear-gradient(180deg, #fef08a 0%, #ca8a04 100%)';
                                    border = '#fef9c3';
                                    glow = '0 0 10px rgba(234, 179, 8, 0.95)';
                                    pipClass = 'pip-gold';
                                } else if (cfg.theme === 'purple') {
                                    bg = 'linear-gradient(180deg, #f0abfc 0%, #7e22ce 100%)';
                                    border = '#f5d0fe';
                                    glow = '0 0 10px rgba(168, 85, 247, 0.95)';
                                    pipClass = 'pip-purple';
                                } else {
                                    bg = 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)';
                                    border = '#fecaca';
                                    glow = '0 0 10px rgba(239, 68, 68, 0.95)';
                                    pipClass = 'pip-crimson';
                                }
                            } else {
                                bg = '#090d16';
                                border = '#334155';
                                glow = 'none';
                                pipClass = 'pip-empty';
                            }
                            const opacity = isFilled ? '1.0' : '0.35';
                            html += `<div class="morbot-pip ${pipClass}" style="width:24px; height:16px; border-radius:4px; background:${bg} !important; border:2px solid ${border} !important; box-shadow:${glow} !important; opacity:${opacity} !important; display:inline-block; transition:all 0.25s ease;" data-pip="${i}"></div>`;
                        }
                        pipsContainer.innerHTML = html;
                    }
                    const hpText = document.getElementById('morbot-hp-text');
                    if (hpText) hpText.textContent = `${this.hp}/${this.maxHp} HP`;
                    this.redrawOverheadBar();
                } catch (e) {
                    console.warn("Error updating HUD:", e);
                }
            },

            damageMorBot(amount = 1, attackName = "") {
                if (this.invulnerableTimer > 0) return;
                if (this.state === 'VICTORY' || this.state === 'DEFEATED' || this.state === 'INTERMISSION') return;

                const cfg = this.getCurrentConfig();
                this.hp = Math.max(0, this.hp - amount);
                this.invulnerableTimer = 1.0;
                this.staggerTimer = 0.85;
                this.hitFlashTimer = 0.45;
                this.updateHPHUD();
                sfx.playMorbotHit();

                // Spark burst particles
                spawnBurstParticles(this.pos.x, this.pos.y + 2.5, this.pos.z, cfg.accentColorHex || 0xff1111, 32, 2.0);
                spawnEnergonLightningParticles(this.pos.x, this.pos.y + 2.0, this.pos.z, 24);
                spawnMagnetSparkParticles(this.pos.x, this.pos.y + 1.5, this.pos.z, 24);

                const hitLabel = attackName ? `${attackName} HIT!` : "CRITICAL HIT!";
                showToast("💥 " + hitLabel, `${cfg.name} took damage! (${this.hp}/${this.maxHp} HP remaining)`);
                this.redrawOverheadBar("💥 -1 HP! " + (attackName || "DIRECT HIT!"));
                setTimeout(() => {
                    if (this.overheadCtx && (this.state === 'PURSUIT' || this.state === 'ROBOT')) {
                        this.redrawOverheadBar("");
                    }
                }, 1200);

                // --- PHASE 1: HIGHWAY PURSUIT ---
                if (this.state === 'PURSUIT') {
                    if (this.hp > 0) {
                        // Pursuit reactions: wobble and tire smoke
                        this.speed = Math.max(14.0, this.speed - 3.0);
                        this.pursuitWobbleTimer = 1.2;
                        sfx.playSmash();
                        if (this.hp === 2) {
                            showToast("🚨 HEAVY DAMAGE!", `${cfg.name}'s engine is failing! Strike again to force him into Robot mode!`);
                        }
                    } else {
                        // PHASE 1 CLEARED! Bot spins out, halts on the road, and transforms into giant Robot!
                        this.state = 'ROBOT';
                        this.speed = 0;
                        this.hp = cfg.robotHp;
                        this.maxHp = cfg.robotHp;
                        this.invulnerableTimer = 1.8;
                        this.rig.setMode(true);
                        if (this.rig.rHeadGroup) this.rig.rHeadGroup.rotation.x = 0;
                        if (this.rig.leftArm) this.rig.leftArm.rotation.x = 0;
                        if (this.rig.rightArm) this.rig.rightArm.rotation.x = 0;
                        if (this.rig.leftLeg) this.rig.leftLeg.rotation.x = 0;
                        if (this.rig.rightLeg) this.rig.rightLeg.rotation.x = 0;

                        sfx.playTransform(false); // transformation sound
                        sfx.playMorbotAlert();

                        // Transformation shockwave
                        spawnBurstParticles(this.pos.x, this.pos.y + 2.5, this.pos.z, 0xa855f7, 48, 3.0);
                        spawnEnergonLightningParticles(this.pos.x, this.pos.y + 3.0, this.pos.z, 36);

                        const title = document.getElementById('morbot-boss-title');
                        if (title) title.textContent = `${cfg.name} (${this.fleetIndex + 1}/3) • PHASE 2: ROBOT SHOWDOWN`;
                        const sub = document.getElementById('morbot-boss-subtitle');
                        if (sub) sub.textContent = `Battle giant Robot ${cfg.name}! Use Bot Powers & Dinobot attacks to defeat him!`;

                        this.updateHPHUD();
                        this.redrawOverheadBar("⚠️ ROBOT SHOWDOWN!");
                        showToast(`⚠️ ${cfg.name} TRANSFORMED!`, `${cfg.name} entered giant Robot combat mode! Deliver the final blows!`);
                    }
                    return;
                }

                // --- PHASE 2: ROBOT SHOWDOWN ---
                if (this.state === 'ROBOT') {
                    if (this.hp <= 0) {
                        this.onBotDefeated();
                    } else {
                        sfx.playSmash();
                        if (this.hp === 2) {
                            showToast("⚡ VERNE DEVICE FAILING!", `${cfg.name} is overheating! One more strike will shut him down!`);
                        }
                    }
                }
            },

            onBotDefeated() {
                const cfg = this.getCurrentConfig();

                // Slump robot in deactivated shutdown pose
                if (this.rig) {
                    this.rig.setMode(true);
                    if (this.rig.rHeadGroup) this.rig.rHeadGroup.rotation.x = 0.55;
                    if (this.rig.leftArm) this.rig.leftArm.rotation.x = 0.35;
                    if (this.rig.rightArm) this.rig.rightArm.rotation.x = 0.35;
                }

                // Explosions on current MorBot
                spawnBurstParticles(this.pos.x, this.pos.y + 2.0, this.pos.z, 0xf59e0b, 35, 2.2);
                spawnEnergonLightningParticles(this.pos.x, this.pos.y + 3.0, this.pos.z, 28);
                sfx.playSmash();

                // Check if more bots remain in the 3-bot fleet:
                if (this.fleetIndex < 2) {
                    this.state = 'INTERMISSION';
                    const nextIndex = this.fleetIndex + 1;
                    const nextCfg = MORBOT_FLEET_CONFIGS[nextIndex];

                    sfx.playMorbotAlert();
                    showToast(`💥 ${cfg.name} DEFEATED! (${this.fleetIndex + 1}/3)`, `Dr. Morocco: "Deploy ${nextCfg.name} immediately!"`);

                    const title = document.getElementById('morbot-boss-title');
                    if (title) title.textContent = `⚠️ INCOMING: ${nextCfg.name} (${nextIndex + 1}/3)`;
                    const sub = document.getElementById('morbot-boss-subtitle');
                    if (sub) sub.textContent = `Prepare for ${nextCfg.name}!`;

                    setTimeout(() => {
                        this.spawnBot(nextIndex, false);
                    }, 1800);
                } else {
                    // ALL 3 MORBOTS DEFEATED! FINAL VICTORY!
                    this.defeatMorBotFleet();
                }
            },

            defeatMorBotFleet() {
                this.state = 'VICTORY';
                this.hp = 0;
                this.speed = 0;
                sfx.playMorbotDefeat();

                // Slump final bot (Gamma)
                if (this.rig) {
                    this.rig.setMode(true);
                    if (this.rig.rHeadGroup) this.rig.rHeadGroup.rotation.x = 0.6;
                    if (this.rig.leftArm) this.rig.leftArm.rotation.x = 0.4;
                    if (this.rig.rightArm) this.rig.rightArm.rotation.x = 0.4;
                }

                // Massive fireworks & glints across the battlefield
                spawnBurstParticles(this.pos.x, this.pos.y + 2.5, this.pos.z, 0xf59e0b, 55, 3.2);
                spawnEnergonLightningParticles(this.pos.x, this.pos.y + 3.0, this.pos.z, 40);
                spawnSparkleGlints(player.pos.x, player.pos.y + 3.0, player.pos.z, 45);

                const title = document.getElementById('morbot-boss-title');
                if (title) title.textContent = "🏆 MORBOT FLEET NEUTRALIZED!";
                const sub = document.getElementById('morbot-boss-subtitle');
                if (sub) sub.textContent = "Dr. Morocco is escaping in his rocket! Griffin Rock is saved!";

                this.updateHPHUD();
                this.redrawOverheadBar("🏆 [ FLEET DEFEATED ]");

                // 1. Create Battlefield Escape Rocket Capsule shooting out from MorBot Gamma into space!
                if (!this.battlefieldRocket) {
                    const podG = new THREE.Group();
                    const podBody = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 7.5, 16), matMorBotSilver);
                    podBody.position.y = 3.75;
                    const podNose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.0, 16), matMorBotCrimson);
                    podNose.position.y = 8.5;
                    const podCockpit = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), matMoroccoPurpleGlow);
                    podCockpit.position.set(0, 5.8, 0.7);

                    // 3 Golden Booster Fins
                    [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(ang => {
                        const f = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 1.5), matMoroccoGold);
                        f.position.set(Math.sin(ang) * 1.2, 2.0, Math.cos(ang) * 1.2);
                        f.rotation.y = ang;
                        podG.add(f);
                    });

                    // Flame booster cone
                    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.2, 12).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
                    flame.position.y = -1.1;

                    podG.add(podBody, podNose, podCockpit, flame);
                    applyCartoonInkOutlines(podG, 1.03, true);
                    podG.position.set(this.pos.x, this.pos.y + 6.0, this.pos.z);
                    scene.add(podG);
                    this.battlefieldRocket = podG;
                    this.battlefieldRocketY = 0;
                    this.battlefieldRocketSpeed = 48.0;
                }

                // 2. Also Launch the Cliff Rocket Pad Rocket!
                this.rocketSpeed = 45.0;

                // 3. Award +75 Energon Cubes
                progression.energonCubesCollected = (progression.energonCubesCollected || 0) + 75;
                saveProgression();
                updateMissionHUD();

                showToast("🏆 INVASION STOPPED!", "All 3 MorBots defeated! Dr. Morocco escaped in his rocket! +75 Energon awarded!");

                // Show Victory Modal after 2.4s (giving time to watch the rocket launch)
                setTimeout(() => {
                    const vicModal = document.getElementById('morbot-victory-modal');
                    if (vicModal) vicModal.classList.remove('hidden');
                }, 2400);
            },

            dismissVictoryModal() {
                const vicModal = document.getElementById('morbot-victory-modal');
                if (vicModal) vicModal.classList.add('hidden');
                const hud = document.getElementById('morbot-boss-hud');
                if (hud) hud.classList.add('hidden');

                this.state = 'DEFEATED';
                this.triggerCooldown = 60.0; // Available again in 60s

                // Clean up battlefield rocket pod
                if (this.battlefieldRocket) {
                    scene.remove(this.battlefieldRocket);
                    this.battlefieldRocket = null;
                }
                this.battlefieldRocketY = 0;
                this.battlefieldRocketSpeed = 0;

                // Hide all bot rigs
                if (this.rigs) {
                    this.rigs.forEach(r => {
                        if (r && r.root) r.root.visible = false;
                    });
                } else if (this.rig && this.rig.root) {
                    this.rig.root.visible = false;
                }

                if (this.overheadMesh) this.overheadMesh.visible = false;

                // Reset cliff rocket position
                if (this.rocketMesh) {
                    this.rocketMesh.position.set(-35, 2.2, -15);
                }
                this.rocketLaunchY = 0;
                this.rocketSpeed = 0;
            },

            spawnSparkHazard(x, y, z) {
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.75, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true })
                );
                mesh.position.set(x, y + 0.35, z);
                scene.add(mesh);
                this.sparkHazards.push({ mesh, x, y, z, life: 7.0 });
                if (this.sparkHazards.length > 8) {
                    const old = this.sparkHazards.shift();
                    scene.remove(old.mesh);
                }
            }
        };

        export function updateMorBotBattle(dt, now) {
            if (morbotBattle.triggerCooldown > 0) {
                morbotBattle.triggerCooldown -= dt;
            }
            if (morbotBattle.invulnerableTimer > 0) {
                morbotBattle.invulnerableTimer -= dt;
            }
            if (morbotBattle.staggerTimer > 0) {
                morbotBattle.staggerTimer -= dt;
            }

            // Position and orient 3D Overhead Health Bar directly above MorBot
            if (morbotBattle.overheadMesh) {
                if (morbotBattle.state === 'PURSUIT' || morbotBattle.state === 'ROBOT') {
                    morbotBattle.overheadMesh.visible = true;
                    const barYOffset = (morbotBattle.state === 'ROBOT') ? 10.5 : 5.8;
                    morbotBattle.overheadMesh.position.set(
                        morbotBattle.pos.x,
                        morbotBattle.pos.y + barYOffset,
                        morbotBattle.pos.z
                    );
                    morbotBattle.overheadMesh.quaternion.copy(camera.quaternion);
                } else {
                    morbotBattle.overheadMesh.visible = false;
                }
            }

            // Flashing hit reaction on core devices
            if (morbotBattle.hitFlashTimer > 0) {
                morbotBattle.hitFlashTimer -= dt;
                const isFlash = Math.sin(morbotBattle.hitFlashTimer * 30) > 0;
                if (morbotBattle.rig) {
                    if (morbotBattle.rig.vCore) morbotBattle.rig.vCore.material.color.setHex(isFlash ? 0xffffff : 0x22c55e);
                    if (morbotBattle.rig.rCore) morbotBattle.rig.rCore.material.color.setHex(isFlash ? 0xffffff : 0x22c55e);
                }
            }

            // Animate Dr. Morocco's Steampunk Blimp (Spinning Propellers & Floating Buoyancy)
            if (morbotBattle.blimpProps && morbotBattle.blimpProps.length > 0) {
                morbotBattle.blimpProps.forEach(p => {
                    p.rotation.z += dt * 8.5;
                });
            }
            if (morbotBattle.blimpEnvelopeG) {
                morbotBattle.blimpEnvelopeG.position.y = 21.0 + Math.sin(now * 0.0016) * 0.7;
            }
            if (morbotBattle.blimpCage) {
                morbotBattle.blimpCage.rotation.z = Math.sin(now * 0.002) * 0.035;
                morbotBattle.blimpCage.rotation.x = Math.cos(now * 0.0017) * 0.02;
            }

            // Animate Tesla Coil Arcs if present
            if (morbotBattle.teslaArcs && morbotBattle.teslaArcs.length > 0) {
                const arcPulse = 1.0 + Math.sin(now * 0.012) * 0.15;
                morbotBattle.teslaArcs.forEach((ring, idx) => {
                    ring.rotation.z += dt * (2.0 + idx);
                    ring.scale.set(arcPulse, arcPulse, 1.0);
                });
            }

            // Animate Trigger Ring at Lair Entrance
            if (morbotBattle.triggerRingMesh && morbotBattle.triggerRingGlow) {
                const glowPulse = 0.75 + Math.sin(now * 0.005) * 0.25;
                morbotBattle.triggerRingGlow.scale.set(glowPulse, glowPulse, 1.0);
                morbotBattle.triggerRingMesh.rotation.z += dt * 0.6;
            }

            // STATE: IDLE -> Proximity Check to Lair Entrance Trigger Pad
            if (morbotBattle.state === 'IDLE' && morbotBattle.triggerCooldown <= 0) {
                const triggerX = -820;
                const triggerZ = -1140;
                const distToTrigger = Math.hypot(player.pos.x - triggerX, player.pos.z - triggerZ);
                if (distToTrigger <= 18.0) {
                    morbotBattle.openChallengeModal();
                }
            } else if (morbotBattle.state === 'DEFEATED' && morbotBattle.triggerCooldown <= 0) {
                morbotBattle.state = 'IDLE';
            }

            // STATE: PURSUIT (Phase 1)
            if (morbotBattle.state === 'PURSUIT') {
                const distToPlayer = Math.hypot(player.pos.x - morbotBattle.pos.x, player.pos.z - morbotBattle.pos.z);
                // Kid-friendly adaptive pursuit speed:
                let targetSpeed = 26.0;
                if (morbotBattle.hp === 2) {
                    targetSpeed = 16.0; // Slowed down after damage!
                } else if (distToPlayer > 55.0) {
                    targetSpeed = 18.0; // Wait up if player falls behind
                } else if (distToPlayer > 25.0) {
                    targetSpeed = 24.0;
                } else {
                    targetSpeed = 27.0;
                }
                morbotBattle.speed = THREE.MathUtils.lerp(morbotBattle.speed, targetSpeed, dt * 2.0);

                const outerR = getOuterRoadRadius(morbotBattle.pursuitTheta);
                const laneR = outerR + morbotBattle.pursuitLaneOffset;
                const dTheta = (morbotBattle.speed / Math.max(120, laneR)) * dt;
                morbotBattle.pursuitTheta = (morbotBattle.pursuitTheta + dTheta) % (Math.PI * 2);

                const nextTheta = morbotBattle.pursuitTheta + 0.04;
                const nextOuterR = getOuterRoadRadius(nextTheta);
                const nextR = nextOuterR + morbotBattle.pursuitLaneOffset;

                const curX = Math.cos(morbotBattle.pursuitTheta) * laneR;
                const curZ = Math.sin(morbotBattle.pursuitTheta) * laneR;
                const nxtX = Math.cos(nextTheta) * nextR;
                const nxtZ = Math.sin(nextTheta) * nextR;

                morbotBattle.pos.x = curX;
                morbotBattle.pos.z = curZ;
                morbotBattle.pos.y = Math.max(0.5, getSurfaceHeight(curX, curZ));
                morbotBattle.heading = Math.atan2(nxtX - curX, nxtZ - curZ);

                // Smooth terrain pitch
                const fY = getSurfaceHeight(curX + Math.sin(morbotBattle.heading) * 2.5, curZ + Math.cos(morbotBattle.heading) * 2.5);
                const rY = getSurfaceHeight(curX - Math.sin(morbotBattle.heading) * 2.5, curZ - Math.cos(morbotBattle.heading) * 2.5);
                morbotBattle.pitch = Math.atan2(fY - rY, 5.0);

                // Fishtail wobble and tire smoke after hit
                if (morbotBattle.pursuitWobbleTimer > 0) {
                    morbotBattle.pursuitWobbleTimer -= dt;
                    const wobble = Math.sin(now * 0.025) * 0.28;
                    morbotBattle.heading += wobble;
                    if (Math.random() < 0.35) {
                        spawnBurstParticles(morbotBattle.pos.x, morbotBattle.pos.y + 0.5, morbotBattle.pos.z, 0x94a3b8, 4, 0.6);
                    }
                }

                if (morbotBattle.rig && morbotBattle.rig.root) {
                    morbotBattle.rig.root.position.copy(morbotBattle.pos);
                    morbotBattle.rig.root.rotation.y = morbotBattle.heading;
                    morbotBattle.rig.root.rotation.x = -morbotBattle.pitch;

                    // Spin wheels
                    const wheelRot = morbotBattle.speed * dt * 1.2;
                    morbotBattle.rig.wheels.forEach(w => {
                        w.rotation.x += wheelRot;
                    });
                }

                // Drop electrical spark hazard every 2.4s
                morbotBattle.sparkTimer += dt;
                if (morbotBattle.sparkTimer >= 2.4) {
                    morbotBattle.sparkTimer = 0;
                    morbotBattle.spawnSparkHazard(morbotBattle.pos.x, morbotBattle.pos.y, morbotBattle.pos.z);
                }
            }

            // STATE: ROBOT SHOWDOWN (Phase 2)
            if (morbotBattle.state === 'ROBOT') {
                const toPx = player.pos.x - morbotBattle.pos.x;
                const toPz = player.pos.z - morbotBattle.pos.z;
                const distToPlayer = Math.hypot(toPx, toPz);

                const targetHeading = Math.atan2(toPx, toPz);
                let diffH = targetHeading - morbotBattle.heading;
                while (diffH < -Math.PI) diffH += Math.PI * 2;
                while (diffH > Math.PI) diffH -= Math.PI * 2;
                morbotBattle.heading += Math.sign(diffH) * Math.min(Math.abs(diffH), 3.5 * dt);

                // Walk menacingly toward player if not staggering
                if (morbotBattle.staggerTimer <= 0) {
                    if (distToPlayer > 8.0) {
                        morbotBattle.pos.x += Math.sin(morbotBattle.heading) * 12.0 * dt;
                        morbotBattle.pos.z += Math.cos(morbotBattle.heading) * 12.0 * dt;

                        // Animate walking limbs
                        const walkSwing = Math.sin(now * 0.008) * 0.45;
                        if (morbotBattle.rig && morbotBattle.rig.leftLeg) morbotBattle.rig.leftLeg.rotation.x = walkSwing;
                        if (morbotBattle.rig && morbotBattle.rig.rightLeg) morbotBattle.rig.rightLeg.rotation.x = -walkSwing;
                        if (morbotBattle.rig && morbotBattle.rig.leftArm) morbotBattle.rig.leftArm.rotation.x = -walkSwing * 0.8;
                        if (morbotBattle.rig && morbotBattle.rig.rightArm) morbotBattle.rig.rightArm.rotation.x = walkSwing * 0.8;
                    } else {
                        // In striking range: swipe claw gauntlet!
                        const clawStrike = Math.sin(now * 0.014) * 0.6;
                        if (morbotBattle.rig && morbotBattle.rig.leftArm) morbotBattle.rig.leftArm.rotation.x = 0.5 + clawStrike;
                    }
                } else {
                    // Stagger backwards
                    morbotBattle.pos.x -= Math.sin(morbotBattle.heading) * 8.0 * dt;
                    morbotBattle.pos.z -= Math.cos(morbotBattle.heading) * 8.0 * dt;
                    if (morbotBattle.rig && morbotBattle.rig.leftArm) morbotBattle.rig.leftArm.rotation.x = -0.8;
                    if (morbotBattle.rig && morbotBattle.rig.rightArm) morbotBattle.rig.rightArm.rotation.x = -0.8;
                }

                morbotBattle.pos.y = Math.max(0.5, getSurfaceHeight(morbotBattle.pos.x, morbotBattle.pos.z));
                if (morbotBattle.rig && morbotBattle.rig.root) {
                    morbotBattle.rig.root.position.copy(morbotBattle.pos);
                    morbotBattle.rig.root.rotation.y = morbotBattle.heading;
                    morbotBattle.rig.root.rotation.x = 0;
                }
            }

            // STATE: VICTORY -> Slumped robot pose & Dual Rocket Launch
            if (morbotBattle.state === 'VICTORY') {
                if (morbotBattle.rig && morbotBattle.rig.root) {
                    morbotBattle.rig.root.position.copy(morbotBattle.pos);
                    morbotBattle.rig.root.rotation.y = morbotBattle.heading;
                    morbotBattle.rig.root.rotation.x = 0;
                }
                if (Math.random() < 0.25) {
                    spawnBurstParticles(morbotBattle.pos.x, morbotBattle.pos.y + 2.0, morbotBattle.pos.z, 0x64748b, 3, 0.4);
                }

                // Animate Battlefield Rocket Escape Pod (flying directly out of MorBot into the clouds!)
                if (morbotBattle.battlefieldRocket) {
                    morbotBattle.battlefieldRocketY += morbotBattle.battlefieldRocketSpeed * dt;
                    morbotBattle.battlefieldRocketSpeed += dt * 32.0; // Accelerates upward!
                    morbotBattle.battlefieldRocket.position.y = morbotBattle.pos.y + 6.0 + morbotBattle.battlefieldRocketY;

                    // Intense flaming exhaust and smoke
                    spawnRocketExhaustParticles(
                        morbotBattle.pos.x,
                        morbotBattle.battlefieldRocket.position.y - 1.2,
                        morbotBattle.pos.z,
                        6
                    );
                    spawnBurstParticles(
                        morbotBattle.pos.x,
                        morbotBattle.battlefieldRocket.position.y - 1.0,
                        morbotBattle.pos.z,
                        0xf97316,
                        3,
                        1.0
                    );
                }

                // Animate Cliffside Lair Rocket Pad Rocket (visible across the island)
                if (morbotBattle.rocketMesh) {
                    morbotBattle.rocketLaunchY += morbotBattle.rocketSpeed * dt;
                    morbotBattle.rocketMesh.position.y = 2.2 + morbotBattle.rocketLaunchY;
                    spawnRocketExhaustParticles(
                        -820 - 35,
                        11.5 + morbotBattle.rocketMesh.position.y,
                        -1180 - 15,
                        6
                    );
                }
            }

            // Update Road Hazard Sparks
            for (let i = morbotBattle.sparkHazards.length - 1; i >= 0; i--) {
                const sp = morbotBattle.sparkHazards[i];
                sp.life -= dt;
                sp.mesh.rotation.y += dt * 4.0;
                sp.mesh.scale.setScalar(0.8 + Math.sin(now * 0.02 + i) * 0.3);

                // Check collision with player
                const dP = Math.hypot(player.pos.x - sp.x, player.pos.z - sp.z);
                if (dP < 3.8) {
                    player.speed *= 0.72; // EMP shock slows bot slightly
                    spawnMagnetSparkParticles(sp.x, sp.y + 1.0, sp.z, 8);
                    scene.remove(sp.mesh);
                    morbotBattle.sparkHazards.splice(i, 1);
                    continue;
                }

                if (sp.life <= 0) {
                    scene.remove(sp.mesh);
                    morbotBattle.sparkHazards.splice(i, 1);
                }
            }
        }

        morbotBattle.init();


if (typeof window !== 'undefined') {
    window.MORBOT_FLEET_CONFIGS = MORBOT_FLEET_CONFIGS;
    window.buildMorBotModel = buildMorBotModel;
    window.updateMorBotBattle = updateMorBotBattle;
}

// Standalone Visual Check Studio for All Unique Set-Piece, Building, Vehicle, Ally, Villain & Creature Models
import * as THREE from 'three';
import { matInkOutline, matInkEdgeLine, OUTLINE_LAYER } from '../rendering/materials.js';
import { buildCrashedSpaceshipSigma } from '../world/spaceshipSigma.js';
import {
    buildAutobotOrbitalStationMesh,
    buildMoroccoOrbitalStationMesh,
    buildOrbitalSatelliteMesh,
    buildStrandedPodMesh,
    buildLunarOutpostMesh,
    buildLunarRoverMesh,
    buildLunarStuntHoopMesh
} from '../world/spaceModels.js';
import {
    CavernAnimatedEntry,
    DinoSpecies,
    buildEnergonCacheMesh,
    buildMagmaBridgeMesh,
    buildDinobotShrineMesh,
    buildMoroccoMineMesh,
    buildBoulderGalleryMesh,
    createCavernDinoMesh
} from '../world/cavernModels.js';
import {
    buildFirehouseHQMesh,
    buildRoboWashMesh,
    buildSuperCatapultMesh,
    buildGriffinDinerMesh,
    buildEnergonChargerMesh,
    buildGroundbridgePortalMesh,
    buildTownBuildingMesh,
    buildEastLighthouseMesh,
    buildHarborPierMesh,
    buildDockCargoCraneMesh,
    buildMagneticGantryCraneMesh,
    buildCargoContainerYardMesh,
    buildHarborFerryMesh,
    buildFerryBoardingBridgeMesh,
    buildAntiGravTestYardMesh,
    buildVolcanoCalderaMesh,
    buildNorthObservatoryMesh,
    buildWindTurbineMesh,
    buildWestTechLabMesh,
    buildSkyCommsArrayMesh,
    buildDinoRidgeMesh,
    buildBoardwalkMesh,
    buildSuspensionCausewayMesh,
    buildWaywardRuinsMesh,
    buildWaywardShipwreckMesh,
    buildWaywardGrottoMesh,
    buildWaywardPierMesh,
    buildStuntRampMesh,
    buildSkyStuntHoopMesh
} from '../world/buildingModels.js';
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
} from '../world/allyModels.js';
import {
    MORBOT_FLEET_CONFIGS,
    buildMorBotModel,
    buildMoroccoBlimpMesh,
    buildMoroccoRocketMesh
} from '../world/morbotModels.js';
import {
    matCrossRedOff,
    matCrossRedOn,
    buildRailroadCrossingMesh,
    buildCentralRailwayStationMesh,
    buildTrainLocomotiveMesh,
    buildTrainTenderMesh,
    buildTrainCommuterCoachMesh,
    buildTrainDomeCoachMesh,
    buildTrainDiningCoachMesh,
    buildTrainFlatcarMesh,
    buildTrainCabooseMesh
} from '../world/railwayModels.js';
import { createHumanNPCMesh, createCivilianVehicleMesh } from '../world/npcModels.js';
import {
    createStreetlampMesh,
    createTrafficConeMesh,
    createBarricadeMesh,
    createDumpsterMesh,
    createEnergonCubeMesh,
    createGoldenCrestMesh,
    createHazardFireMesh,
    createHazardRockslideMesh,
    createMagmaDebrisMesh,
    createTreeArchetypeMesh,
    createBushMesh,
    createIslandRockMesh
} from '../world/propModels.js';
import { SVG_ICONS } from '../ui/icons.js';

export const MODEL_CATEGORIES = [
    'Starship & Space',
    'Cavern Landmarks',
    'Cavern Dinosaurs',
    'Town & HQ Landmarks',
    'Island Districts & Wayward',
    'Allies & Mega Gear',
    'Dr. Morocco Villains',
    'Island Railway',
    'Citizens & Traffic',
    'Props, Collectibles & Nature'
] as const;

type ModelCategory = typeof MODEL_CATEGORIES[number];
type CategoryFilter = 'ALL' | ModelCategory;
type EnvPreset = 'studio' | 'cavern' | 'dark';

interface DinoAnimRig {
    headPivot: THREE.Object3D;
    tailPivot: THREE.Object3D;
    legs: THREE.Object3D[];
    phase: number;
}

interface BuiltModelResult {
    root: THREE.Group;
    animatedEntries: CavernAnimatedEntry[];
    dinoRig?: DinoAnimRig;
    onAnimate?: (dt: number, nowSec: number) => void;
}

interface ModelCatalogEntry {
    id: string;
    name: string;
    category: ModelCategory;
    defaultYawDeg: number;
    defaultPitch: number;
    gridSpanX: number;
    gridSpanZ: number;
    build: () => BuiltModelResult;
}

interface ModelCell {
    spec: ModelCatalogEntry;
    gridPos: THREE.Vector3;
    holder: THREE.Group | null;
    label: HTMLDivElement | null;
    animatedEntries: CavernAnimatedEntry[];
    dinoRig?: DinoAnimRig;
    onAnimate?: (dt: number, nowSec: number) => void;
    _center: THREE.Vector3;
    _size: THREE.Vector3;
    _minY: number;
    _meshCount: number;
    _triCount: number;
    _boundsReady: boolean;
    _lastTransform: string;
    _lastLabelHtml: string;
    _lastLabelVisible: boolean;
}

function liftMinYToFloor(obj: THREE.Object3D, clearance = 0): THREE.Group {
    const wrap = new THREE.Group();
    wrap.add(obj);
    wrap.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();
    wrap.traverse((o: THREE.Object3D) => {
        if (o instanceof THREE.Mesh && !o.userData?.isOutline && o.geometry) {
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            if (o.geometry.boundingBox) {
                tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
                box.union(tmp);
            }
        }
    });
    if (!box.isEmpty() && box.min.y < clearance) {
        obj.position.y += clearance - box.min.y;
    }
    return wrap;
}

function buildSingleDino(species: DinoSpecies, phase: number): BuiltModelResult {
    const res = createCavernDinoMesh(species);
    return {
        root: res.root,
        animatedEntries: [],
        dinoRig: {
            headPivot: res.headPivot,
            tailPivot: res.tailPivot,
            legs: res.legs,
            phase
        }
    };
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
    // =========================================================================
    // 1. STARSHIP & SPACE (2)
    // =========================================================================
    {
        id: 'SIGMA_CRASHED',
        name: 'Starship Sigma (Crash Diorama)',
        category: 'Starship & Space',
        defaultYawDeg: 42,
        defaultPitch: 0.34,
        gridSpanX: 50,
        gridSpanZ: 46,
        build: () => {
            const container = new THREE.Group();
            const anims: CavernAnimatedEntry[] = [];
            buildCrashedSpaceshipSigma(container, anims, null, {
                originX: 0,
                originZ: 0,
                includeDiorama: true,
                flatLevel: false
            });
            return { root: container, animatedEntries: anims };
        }
    },
    {
        id: 'SIGMA_LEVEL',
        name: 'Starship Sigma (Level Flight)',
        category: 'Starship & Space',
        defaultYawDeg: 40,
        defaultPitch: 0.28,
        gridSpanX: 50,
        gridSpanZ: 46,
        build: () => {
            const container = new THREE.Group();
            const anims: CavernAnimatedEntry[] = [];
            buildCrashedSpaceshipSigma(container, anims, null, {
                originX: 0,
                originZ: 0,
                includeDiorama: false,
                flatLevel: true
            });
            return { root: container, animatedEntries: anims };
        }
    },
    {
        id: 'SPACE_AUTOBOT_STATION',
        name: 'Autobot Orbital Station',
        category: 'Starship & Space',
        defaultYawDeg: 35,
        defaultPitch: 0.32,
        gridSpanX: 78,
        gridSpanZ: 78,
        build: () => {
            const root = liftMinYToFloor(buildAutobotOrbitalStationMesh(), 0.2);
            return { root, animatedEntries: [] };
        }
    },
    {
        id: 'SPACE_MOROCCO_STATION',
        name: "Dr. Morocco's Orbital Laser Station",
        category: 'Starship & Space',
        defaultYawDeg: 32,
        defaultPitch: 0.30,
        gridSpanX: 78,
        gridSpanZ: 112,
        build: () => {
            const { root: station, dishPivot } = buildMoroccoOrbitalStationMesh();
            const root = liftMinYToFloor(station, 0.2);
            return {
                root,
                animatedEntries: [{ obj: dishPivot, kind: 'SPIN_Y', baseY: dishPivot.position.y, phase: 0 }]
            };
        }
    },
    {
        id: 'SPACE_GREENE_SATELLITE',
        name: 'Dr. Greene Orbital Satellite',
        category: 'Starship & Space',
        defaultYawDeg: 38,
        defaultPitch: 0.30,
        gridSpanX: 30,
        gridSpanZ: 24,
        build: () => {
            const { group } = buildOrbitalSatelliteMesh(true);
            const root = liftMinYToFloor(group, 0.2);
            return { root, animatedEntries: [] };
        }
    },
    {
        id: 'SPACE_RESCUE_POD',
        name: 'Stranded Orbital Rescue Pod',
        category: 'Starship & Space',
        defaultYawDeg: 34,
        defaultPitch: 0.30,
        gridSpanX: 20,
        gridSpanZ: 20,
        build: () => {
            const root = liftMinYToFloor(buildStrandedPodMesh(), 0.2);
            return { root, animatedEntries: [] };
        }
    },
    {
        id: 'MOON_LUNAR_OUTPOST',
        name: 'Griffin Rock Lunar Outpost Alpha',
        category: 'Starship & Space',
        defaultYawDeg: 36,
        defaultPitch: 0.32,
        gridSpanX: 36,
        gridSpanZ: 36,
        build: () => {
            const { outpostGroup, dishPivot } = buildLunarOutpostMesh();
            return {
                root: outpostGroup,
                animatedEntries: [{ obj: dishPivot, kind: 'SPIN_Y', baseY: dishPivot.position.y, phase: 0 }]
            };
        }
    },
    {
        id: 'MOON_LUNAR_ROVER',
        name: 'Griffin Rock 6-Wheel Lunar Rover',
        category: 'Starship & Space',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 16,
        gridSpanZ: 16,
        build: () => {
            const { rover } = buildLunarRoverMesh();
            return { root: rover, animatedEntries: [] };
        }
    },
    {
        id: 'MOON_CRATER_HOOP',
        name: 'Low-Gravity Lunar Stunt Hoop',
        category: 'Starship & Space',
        defaultYawDeg: 30,
        defaultPitch: 0.28,
        gridSpanX: 18,
        gridSpanZ: 18,
        build: () => {
            const { group } = buildLunarStuntHoopMesh();
            const root = liftMinYToFloor(group, 0.2);
            return { root, animatedEntries: [] };
        }
    },

    // =========================================================================
    // 2. CAVERN LANDMARKS (5)
    // =========================================================================
    {
        id: 'ENERGON_CACHE',
        name: 'Great Energon Crystal Cache',
        category: 'Cavern Landmarks',
        defaultYawDeg: 35,
        defaultPitch: 0.35,
        gridSpanX: 30,
        gridSpanZ: 30,
        build: () => {
            const anims: CavernAnimatedEntry[] = [];
            return { root: liftMinYToFloor(buildEnergonCacheMesh(anims), 0), animatedEntries: anims };
        }
    },
    {
        id: 'DINOBOT_SHRINE',
        name: 'Ancient Fossilized Dinobot Shrine',
        category: 'Cavern Landmarks',
        defaultYawDeg: 30,
        defaultPitch: 0.32,
        gridSpanX: 30,
        gridSpanZ: 30,
        build: () => ({ root: buildDinobotShrineMesh(), animatedEntries: [] })
    },
    {
        id: 'MOROCCO_MINE',
        name: "Dr. Morocco's Abandoned Mine",
        category: 'Cavern Landmarks',
        defaultYawDeg: 38,
        defaultPitch: 0.34,
        gridSpanX: 36,
        gridSpanZ: 40,
        build: () => ({ root: buildMoroccoMineMesh(), animatedEntries: [] })
    },
    {
        id: 'BOULDER_GALLERY',
        name: "Boulder's Crystal Sculpture Alcove",
        category: 'Cavern Landmarks',
        defaultYawDeg: 32,
        defaultPitch: 0.32,
        gridSpanX: 42,
        gridSpanZ: 32,
        build: () => {
            const anims: CavernAnimatedEntry[] = [];
            return { root: buildBoulderGalleryMesh(anims), animatedEntries: anims };
        }
    },
    {
        id: 'MAGMA_BRIDGE',
        name: 'Mt. Griffin Magma Core Bridge',
        category: 'Cavern Landmarks',
        defaultYawDeg: 45,
        defaultPitch: 0.42,
        gridSpanX: 64,
        gridSpanZ: 60,
        build: () => {
            const anims: CavernAnimatedEntry[] = [];
            return { root: buildMagmaBridgeMesh(anims, 28, 0.25), animatedEntries: anims };
        }
    },

    // =========================================================================
    // 3. CAVERN DINOSAURS (5)
    // =========================================================================
    {
        id: 'DINO_TREX',
        name: 'Cavern T-Rex',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 45,
        defaultPitch: 0.28,
        gridSpanX: 20,
        gridSpanZ: 20,
        build: () => buildSingleDino('TREX', 0.2)
    },
    {
        id: 'DINO_BRONTO',
        name: 'Cavern Brontosaurus',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 50,
        defaultPitch: 0.28,
        gridSpanX: 22,
        gridSpanZ: 22,
        build: () => buildSingleDino('BRONTO', 1.1)
    },
    {
        id: 'DINO_STEGO',
        name: 'Crystal Stegosaurus',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 52,
        defaultPitch: 0.28,
        gridSpanX: 18,
        gridSpanZ: 18,
        build: () => buildSingleDino('STEGO', 2.2)
    },
    {
        id: 'DINO_TRIKE',
        name: 'Armored Triceratops',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 42,
        defaultPitch: 0.28,
        gridSpanX: 18,
        gridSpanZ: 18,
        build: () => buildSingleDino('TRIKE', 3.1)
    },
    {
        id: 'DINO_RAPTOR',
        name: 'Cavern Velociraptor',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 48,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 14,
        build: () => buildSingleDino('RAPTOR', 4.3)
    },

    // =========================================================================
    // 4. TOWN & HQ LANDMARKS (10)
    // =========================================================================
    {
        id: 'FIREHOUSE_HQ',
        name: 'Firehouse Headquarters',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 35,
        defaultPitch: 0.34,
        gridSpanX: 68,
        gridSpanZ: 60,
        build: () => {
            const res = buildFirehouseHQMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.hqRadarPivot.rotation.y += dt * 1.4;
                    res.swapPadRing.rotation.y = nowSec * 0.6;
                }
            };
        }
    },
    {
        id: 'ROBO_WASH',
        name: 'Firehouse Robo-Wash Bay',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 36,
        defaultPitch: 0.30,
        gridSpanX: 20,
        gridSpanZ: 26,
        build: () => {
            const res = buildRoboWashMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.rwLeftBrush.rotation.y += dt * 4.0;
                    res.rwRightBrush.rotation.y -= dt * 4.0;
                    res.rwTopBrush.rotation.x += dt * 3.5;
                }
            };
        }
    },
    {
        id: 'SUPER_CATAPULT',
        name: 'HQ Super Catapult Pad',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 38,
        defaultPitch: 0.32,
        gridSpanX: 20,
        gridSpanZ: 28,
        build: () => {
            const res = buildSuperCatapultMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.catapultCarriage.position.z = -3.5 + (Math.sin(nowSec * 1.8) * 0.5 + 0.5) * 6.5;
                }
            };
        }
    },
    {
        id: 'GRIFFIN_DINER',
        name: 'Griffin Drive-Thru Diner',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 38,
        defaultPitch: 0.30,
        gridSpanX: 32,
        gridSpanZ: 32,
        build: () => {
            const res = buildGriffinDinerMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.dinerBurgerGroup.rotation.y += dt * 0.9;
                }
            };
        }
    },
    {
        id: 'ENERGON_CHARGER',
        name: 'Energon Turbo-Charger Station',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 36,
        defaultPitch: 0.32,
        gridSpanX: 24,
        gridSpanZ: 26,
        build: () => {
            const res = buildEnergonChargerMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.energonCoilRings.forEach((ring, i) => {
                        const s = 1 + Math.sin(nowSec * 4 + i * 0.6) * 0.06;
                        ring.scale.set(s, s, 1);
                    });
                    res.energonOrbs.forEach((orb, i) => {
                        const s = 0.92 + Math.sin(nowSec * 5 + i) * 0.12;
                        orb.scale.setScalar(s);
                    });
                }
            };
        }
    },
    {
        id: 'GROUNDBRIDGE_PORTAL',
        name: 'GroundBridge Teleporter Portal',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 32,
        defaultPitch: 0.28,
        gridSpanX: 28,
        gridSpanZ: 32,
        build: () => {
            const res = buildGroundbridgePortalMesh('A');
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.irisRing1.rotation.z += dt * 1.1;
                    res.irisRing2.rotation.z -= dt * 1.6;
                    res.irisRing3.rotation.z += dt * 2.2;
                    const ps = 0.94 + Math.sin(nowSec * 3.2) * 0.06;
                    res.vortexDisc.scale.setScalar(ps);
                }
            };
        }
    },
    {
        id: 'TOWN_BUILDING',
        name: 'Griffin Town Building',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 38,
        defaultPitch: 0.30,
        gridSpanX: 24,
        gridSpanZ: 24,
        build: () => ({
            root: buildTownBuildingMesh(16, 15, 14, 0x1d4ed8, 0xf8fafc).root,
            animatedEntries: []
        })
    },
    {
        id: 'ANTI_GRAV_YARD',
        name: "Doc Greene's Anti-Grav Yard",
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 38,
        defaultPitch: 0.36,
        gridSpanX: 90,
        gridSpanZ: 66,
        build: () => {
            const res = buildAntiGravTestYardMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.bounceMembrane.position.y = 0.85 + Math.sin(nowSec * 4.5) * 0.14;
                }
            };
        }
    },
    {
        id: 'STUNT_RAMP',
        name: 'Griffin Rock Stunt Ramp',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 45,
        defaultPitch: 0.30,
        gridSpanX: 18,
        gridSpanZ: 24,
        build: () => ({
            root: liftMinYToFloor(
                buildStuntRampMesh(12, 18, 3.2, { el: 0, er: 0, ll: 0, lr: 0, minOffset: 0 }).root,
                0
            ),
            animatedEntries: []
        })
    },
    {
        id: 'SKY_STUNT_HOOP',
        name: 'Sky Stunt Launch Hoop',
        category: 'Town & HQ Landmarks',
        defaultYawDeg: 32,
        defaultPitch: 0.25,
        gridSpanX: 20,
        gridSpanZ: 12,
        build: () => {
            const res = buildSkyStuntHoopMesh(6.5, 0x38bdf8);
            const root = liftMinYToFloor(res.root, 1.5);
            return {
                root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.starPivot.rotation.z += dt * 1.6;
                }
            };
        }
    },

    // =========================================================================
    // 5. ISLAND DISTRICTS & WAYWARD (19)
    // =========================================================================
    {
        id: 'EAST_LIGHTHOUSE',
        name: 'East Peninsula Lighthouse',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 40,
        defaultPitch: 0.30,
        gridSpanX: 24,
        gridSpanZ: 24,
        build: () => {
            const res = buildEastLighthouseMesh(false);
            return { root: res.root, animatedEntries: [] };
        }
    },
    {
        id: 'HARBOR_FERRY',
        name: 'S.S. Griffin Rock Rescue Ferry',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 45,
        defaultPitch: 0.30,
        gridSpanX: 26,
        gridSpanZ: 58,
        build: () => {
            const res = buildHarborFerryMesh();
            const root = liftMinYToFloor(res.root, 0);
            return {
                root,
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.ferryRampPivot.rotation.x = 0.25 + Math.sin(nowSec * 1.3) * 0.2;
                }
            };
        }
    },
    {
        id: 'FERRY_BOARDING_BRIDGE',
        name: 'Ferry Boarding Bridge & Arch',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 42,
        defaultPitch: 0.32,
        gridSpanX: 30,
        gridSpanZ: 38,
        build: () => ({
            root: liftMinYToFloor(buildFerryBoardingBridgeMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'MAGNET_GANTRY_CRANE',
        name: 'Interactive Magnetic Crane',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 48,
        defaultPitch: 0.30,
        gridSpanX: 26,
        gridSpanZ: 54,
        build: () => {
            const res = buildMagneticGantryCraneMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.boomPivot.rotation.y = Math.sin(nowSec * 0.65) * 0.65;
                }
            };
        }
    },
    {
        id: 'CARGO_CONTAINER_YARD',
        name: 'Harbor Cargo Container Stack',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 40,
        defaultPitch: 0.32,
        gridSpanX: 20,
        gridSpanZ: 20,
        build: () => ({
            root: buildCargoContainerYardMesh(0).root,
            animatedEntries: []
        })
    },
    {
        id: 'HARBOR_PIER',
        name: 'South Harbor Main Pier',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 48,
        defaultPitch: 0.34,
        gridSpanX: 38,
        gridSpanZ: 102,
        build: () => ({
            root: liftMinYToFloor(buildHarborPierMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'DOCK_CARGO_CRANE',
        name: 'Static Dock Gantry Crane',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 48,
        defaultPitch: 0.30,
        gridSpanX: 20,
        gridSpanZ: 44,
        build: () => ({
            root: buildDockCargoCraneMesh().root,
            animatedEntries: []
        })
    },
    {
        id: 'VOLCANO_CALDERA',
        name: 'Mt. Griffin Volcano Caldera',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 35,
        defaultPitch: 0.38,
        gridSpanX: 66,
        gridSpanZ: 66,
        build: () => {
            const res = buildVolcanoCalderaMesh();
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.volcanoLavaPool.position.y = 1.6 + Math.sin(nowSec * 2.4) * 0.14;
                    res.volcanoSmokePuffs.forEach(puff => {
                        puff.userData.phase = (puff.userData.phase + dt * 0.25) % 1;
                        const ph = puff.userData.phase;
                        puff.position.set(
                            Math.sin(ph * Math.PI * 2) * 3.5,
                            4 + ph * 34,
                            Math.cos(ph * Math.PI * 2) * 3.5
                        );
                        puff.scale.setScalar(0.6 + ph * 1.4);
                    });
                }
            };
        }
    },
    {
        id: 'NORTH_OBSERVATORY',
        name: 'North Telescope Observatory',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 38,
        defaultPitch: 0.34,
        gridSpanX: 78,
        gridSpanZ: 44,
        build: () => {
            const res = buildNorthObservatoryMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.observatoryDomePivot.rotation.y += dt * 0.45;
                }
            };
        }
    },
    {
        id: 'WEST_TECH_LAB',
        name: "Doc Greene's Geodesic Tech Lab",
        category: 'Island Districts & Wayward',
        defaultYawDeg: 40,
        defaultPitch: 0.34,
        gridSpanX: 44,
        gridSpanZ: 44,
        build: () => ({
            root: buildWestTechLabMesh(false).root,
            animatedEntries: []
        })
    },
    {
        id: 'WIND_TURBINE',
        name: 'West Tech Wind Turbine',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 36,
        defaultPitch: 0.28,
        gridSpanX: 34,
        gridSpanZ: 20,
        build: () => {
            const res = buildWindTurbineMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.rotorHub.rotation.z -= dt * 2.2;
                }
            };
        }
    },
    {
        id: 'SKY_COMMS_ARRAY',
        name: 'Sky Comms Relay Tower',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 16,
        gridSpanZ: 16,
        build: () => ({
            root: buildSkyCommsArrayMesh().root,
            animatedEntries: []
        })
    },
    {
        id: 'DINO_RIDGE',
        name: 'Dino Ridge Sanctuary & Baby Dinos',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 38,
        defaultPitch: 0.36,
        gridSpanX: 58,
        gridSpanZ: 96,
        build: () => {
            const res = buildDinoRidgeMesh();
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.amberSpire.rotation.y += dt * 0.8;
                    res.babyDinos.forEach(bd => {
                        const c = nowSec * 4.5 + bd.phase;
                        bd.leftLeg.rotation.x = Math.sin(c) * 0.35;
                        bd.rightLeg.rotation.x = -Math.sin(c) * 0.35;
                        bd.headPivot.rotation.x = Math.sin(nowSec * 2.4 + bd.phase) * 0.14;
                    });
                }
            };
        }
    },
    {
        id: 'SUNNY_SANDS_BOARDWALK',
        name: 'Sunny Sands Boardwalk & Ferris Wheel',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 38,
        defaultPitch: 0.36,
        gridSpanX: 128,
        gridSpanZ: 98,
        build: () => {
            const res = buildBoardwalkMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.ferrisWheelPivot.rotation.z += dt * 0.35;
                    res.ferrisGondolas.forEach(g => {
                        g.rotation.z = -res.ferrisWheelPivot.rotation.z;
                    });
                }
            };
        }
    },
    {
        id: 'SUSPENSION_CAUSEWAY',
        name: 'Wayward Suspension Causeway Bridge',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 52,
        defaultPitch: 0.34,
        gridSpanX: 288,
        gridSpanZ: 30,
        build: () => ({
            root: liftMinYToFloor(buildSuspensionCausewayMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'WAYWARD_RUINS',
        name: 'Wayward Ancient Cybertronian Ruins',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 38,
        defaultPitch: 0.35,
        gridSpanX: 60,
        gridSpanZ: 60,
        build: () => {
            const res = buildWaywardRuinsMesh();
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.waywardEnergonShard.rotation.y += dt * 1.2;
                    res.waywardEnergonShard.position.y = 7.5 + Math.sin(nowSec * 2.5) * 0.45;
                }
            };
        }
    },
    {
        id: 'WAYWARD_SHIPWRECK',
        name: 'Wayward Reef Shipwreck Hull',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 40,
        defaultPitch: 0.32,
        gridSpanX: 44,
        gridSpanZ: 24,
        build: () => ({
            root: liftMinYToFloor(buildWaywardShipwreckMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'WAYWARD_GROTTO',
        name: 'Wayward Sea Crystal Grotto',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 42,
        defaultPitch: 0.34,
        gridSpanX: 54,
        gridSpanZ: 46,
        build: () => ({
            root: liftMinYToFloor(buildWaywardGrottoMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'WAYWARD_PIER',
        name: 'Wayward Scenic T-Dock Pier',
        category: 'Island Districts & Wayward',
        defaultYawDeg: 46,
        defaultPitch: 0.34,
        gridSpanX: 40,
        gridSpanZ: 72,
        build: () => ({
            root: liftMinYToFloor(buildWaywardPierMesh().root, 0),
            animatedEntries: []
        })
    },

    // =========================================================================
    // 6. ALLIES & MEGA GEAR (11)
    // =========================================================================
    {
        id: 'SERVO_PUP',
        name: 'Servo Robotic Rescue Dog',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 42,
        defaultPitch: 0.25,
        gridSpanX: 10,
        gridSpanZ: 10,
        build: () => {
            const res = buildServoPupModel();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.tail.rotation.z = Math.sin(nowSec * 9.0) * 0.45;
                    res.head.rotation.y = Math.sin(nowSec * 2.0) * 0.18;
                    res.leftEar.rotation.z = Math.sin(nowSec * 5.0) * 0.12;
                    res.rightEar.rotation.z = -Math.sin(nowSec * 5.0) * 0.12;
                }
            };
        }
    },
    {
        id: 'HIGHTIDE_SHIP',
        name: "High Tide's Ocean Rescue Rig",
        category: 'Allies & Mega Gear',
        defaultYawDeg: 45,
        defaultPitch: 0.32,
        gridSpanX: 28,
        gridSpanZ: 56,
        build: () => ({
            root: liftMinYToFloor(createHighTideShipMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'OPTIMUS_TRAILER',
        name: 'Optimus Mega Trailer',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 24,
        build: () => ({
            root: liftMinYToFloor(createOptimusTrailerMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'BOULDER_BUCKET',
        name: 'Boulder Dozer Loader Bucket',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 42,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 14,
        build: () => ({
            root: liftMinYToFloor(createBoulderBucketMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'CHASE_TRAILER',
        name: 'Chase Patrol Gear Trailer',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 18,
        build: () => ({
            root: liftMinYToFloor(createChaseTrailerMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'HEATWAVE_TRAILER',
        name: 'Heatwave Hydro Tank Trailer',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 18,
        build: () => ({
            root: liftMinYToFloor(createHeatwaveTrailerMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'QUICKSHADOW_BOMBER',
        name: 'Quickshadow Stealth Wing Pack',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 42,
        defaultPitch: 0.30,
        gridSpanX: 16,
        gridSpanZ: 18,
        build: () => ({
            root: liftMinYToFloor(createQuickshadowBomberMesh(), 0.3),
            animatedEntries: []
        })
    },
    {
        id: 'BUMBLEBEE_MONSTER',
        name: 'Bumblebee Monster Stunt Rig',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 16,
        build: () => ({
            root: liftMinYToFloor(createBumblebeeMonsterMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'BLURR_MONSTER',
        name: 'Blurr Sonic Booster Chassis',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 16,
        build: () => ({
            root: liftMinYToFloor(createBlurrMonsterMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'SALVAGE_DUMPSTER',
        name: 'Salvage Recycling Compactor Trailer',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 16,
        build: () => ({
            root: liftMinYToFloor(createSalvageDumpsterMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'BLADES_CARGO',
        name: 'Blades Heavy Rescue Pod',
        category: 'Allies & Mega Gear',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 16,
        build: () => ({
            root: liftMinYToFloor(createBladesCargoMesh(), 0),
            animatedEntries: []
        })
    },

    // =========================================================================
    // 7. DR. MOROCCO VILLAINS (4)
    // =========================================================================
    {
        id: 'MOROCCO_BLIMP',
        name: "Dr. Morocco's Steampunk Blimp",
        category: 'Dr. Morocco Villains',
        defaultYawDeg: 48,
        defaultPitch: 0.32,
        gridSpanX: 56,
        gridSpanZ: 48,
        build: () => {
            const res = buildMoroccoBlimpMesh();
            const root = liftMinYToFloor(res.root, 0);
            return {
                root,
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.envelopeG.position.y = 21.5 + Math.sin(nowSec * 1.4) * 0.45;
                    res.blimpProps.forEach(p => {
                        p.rotation.z += dt * 16;
                    });
                    res.cageG.rotation.z = Math.sin(nowSec * 1.8) * 0.06;
                }
            };
        }
    },
    {
        id: 'MOROCCO_ROCKET',
        name: "Dr. Morocco's Escape Rocket",
        category: 'Dr. Morocco Villains',
        defaultYawDeg: 42,
        defaultPitch: 0.28,
        gridSpanX: 24,
        gridSpanZ: 24,
        build: () => ({
            root: liftMinYToFloor(buildMoroccoRocketMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'MORBOT_ROBOT',
        name: 'MorBot Sentinel (Robot Mode)',
        category: 'Dr. Morocco Villains',
        defaultYawDeg: 38,
        defaultPitch: 0.26,
        gridSpanX: 12,
        gridSpanZ: 12,
        build: () => {
            const res = buildMorBotModel(MORBOT_FLEET_CONFIGS[0]);
            res.setMode(true);
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    res.leftArm.rotation.x = Math.sin(nowSec * 2.4) * 0.18;
                    res.rightArm.rotation.x = -Math.sin(nowSec * 2.4) * 0.18;
                    res.rHeadGroup.rotation.y = Math.sin(nowSec * 1.6) * 0.25;
                }
            };
        }
    },
    {
        id: 'MORBOT_VEHICLE',
        name: 'MorBot Patrol Jet (Vehicle Mode)',
        category: 'Dr. Morocco Villains',
        defaultYawDeg: 44,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 14,
        build: () => {
            const res = buildMorBotModel(MORBOT_FLEET_CONFIGS[0]);
            res.setMode(false);
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: []
            };
        }
    },

    // =========================================================================
    // 8. ISLAND RAILWAY (9)
    // =========================================================================
    {
        id: 'RAILWAY_STATION',
        name: 'Central Railway Depot Station',
        category: 'Island Railway',
        defaultYawDeg: 40,
        defaultPitch: 0.34,
        gridSpanX: 32,
        gridSpanZ: 48,
        build: () => ({
            root: liftMinYToFloor(buildCentralRailwayStationMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'RAILROAD_CROSSING',
        name: 'Grade Railroad Crossing Gate',
        category: 'Island Railway',
        defaultYawDeg: 42,
        defaultPitch: 0.32,
        gridSpanX: 26,
        gridSpanZ: 22,
        build: () => {
            const res = buildRailroadCrossingMesh(true);
            let lastFlash = -1;
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    const phase = Math.floor(nowSec * 3.0) % 2;
                    if (phase !== lastFlash) {
                        lastFlash = phase;
                        res.lamps.forEach(l => {
                            l.mesh.material = l.phase === phase ? matCrossRedOn : matCrossRedOff;
                        });
                    }
                }
            };
        }
    },
    {
        id: 'TRAIN_LOCO',
        name: 'Steam-Energon Locomotive',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 24,
        build: () => {
            const res = buildTrainLocomotiveMesh(false);
            let angle = 0;
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: dt => {
                    angle += dt * 3.5;
                    res.wheels.forEach(w => { w.rotation.x = angle; });
                    res.connectingRods.forEach(r => {
                        r.position.y = (r.userData.baseY || 0.88) + Math.sin(angle) * 0.26;
                        r.position.z = (r.userData.baseZ || 0.8) + Math.cos(angle) * 0.26;
                    });
                }
            };
        }
    },
    {
        id: 'TRAIN_TENDER',
        name: 'Coal & Energon Booster Tender',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 20,
        build: () => {
            const res = buildTrainTenderMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 3.5; });
                }
            };
        }
    },
    {
        id: 'TRAIN_COMMUTER',
        name: 'Griffin Commuter Passenger Coach',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 24,
        build: () => {
            const res = buildTrainCommuterCoachMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 3.5; });
                }
            };
        }
    },
    {
        id: 'TRAIN_DOME',
        name: 'Vista Glass Dome Observation Car',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 24,
        build: () => {
            const res = buildTrainDomeCoachMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 3.5; });
                }
            };
        }
    },
    {
        id: 'TRAIN_DINING',
        name: 'Grand Emerald Dining Car',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 24,
        build: () => {
            const res = buildTrainDiningCoachMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 3.5; });
                }
            };
        }
    },
    {
        id: 'TRAIN_FLATCAR',
        name: 'Heavy Rescue Energon Flatcar',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 22,
        build: () => {
            const res = buildTrainFlatcarMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 3.5; });
                }
            };
        }
    },
    {
        id: 'TRAIN_CABOOSE',
        name: 'Crimson Cupola Caboose',
        category: 'Island Railway',
        defaultYawDeg: 46,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 20,
        build: () => {
            const res = buildTrainCabooseMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 3.5; });
                }
            };
        }
    },

    // =========================================================================
    // 9. CITIZENS & TRAFFIC (6)
    // =========================================================================
    {
        id: 'NPC_CHIEF_BURNS',
        name: 'Citizen — Chief Charlie Burns',
        category: 'Citizens & Traffic',
        defaultYawDeg: 32,
        defaultPitch: 0.22,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => {
            const res = createHumanNPCMesh({
                shirtColor: 0x1d4ed8,
                pantsColor: 0x1e293b,
                hairColor: 0x78350f,
                skinColor: 0xf1c27d,
                indicatorColor: 0x38bdf8,
                hasVisorHat: true
            });
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    const s = Math.sin(nowSec * 4.5) * 0.35;
                    res.leftArmPivot.rotation.x = s;
                    res.rightArmPivot.rotation.x = -s;
                    res.leftLegPivot.rotation.x = -s;
                    res.rightLegPivot.rotation.x = s;
                }
            };
        }
    },
    {
        id: 'NPC_DOC_GREENE',
        name: 'Citizen — Dr. Morocco / Doc Greene Style',
        category: 'Citizens & Traffic',
        defaultYawDeg: 32,
        defaultPitch: 0.22,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => {
            const res = createHumanNPCMesh({
                shirtColor: 0xf8fafc,
                pantsColor: 0x334155,
                hairColor: 0x94a3b8,
                skinColor: 0xf1c27d,
                indicatorColor: 0x22c55e,
                hasVisorHat: false
            });
            return {
                root: liftMinYToFloor(res.root, 0),
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    const s = Math.sin(nowSec * 4.0 + 1.0) * 0.32;
                    res.leftArmPivot.rotation.x = s;
                    res.rightArmPivot.rotation.x = -s;
                    res.leftLegPivot.rotation.x = -s;
                    res.rightLegPivot.rotation.x = s;
                }
            };
        }
    },
    {
        id: 'CIV_SEDAN',
        name: 'Civilian Traffic Sedan',
        category: 'Citizens & Traffic',
        defaultYawDeg: 42,
        defaultPitch: 0.26,
        gridSpanX: 10,
        gridSpanZ: 12,
        build: () => {
            const res = createCivilianVehicleMesh('SEDAN', 0xef4444);
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 4.5; });
                }
            };
        }
    },
    {
        id: 'CIV_PICKUP',
        name: 'Civilian Utility Pickup Truck',
        category: 'Citizens & Traffic',
        defaultYawDeg: 42,
        defaultPitch: 0.26,
        gridSpanX: 10,
        gridSpanZ: 14,
        build: () => {
            const res = createCivilianVehicleMesh('PICKUP', 0x2563eb);
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 4.5; });
                }
            };
        }
    },
    {
        id: 'CIV_VAN',
        name: 'Civilian Delivery Van',
        category: 'Citizens & Traffic',
        defaultYawDeg: 42,
        defaultPitch: 0.26,
        gridSpanX: 10,
        gridSpanZ: 14,
        build: () => {
            const res = createCivilianVehicleMesh('VAN', 0x10b981);
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 4.5; });
                }
            };
        }
    },
    {
        id: 'CIV_BUS',
        name: 'Griffin Rock Transit Bus',
        category: 'Citizens & Traffic',
        defaultYawDeg: 45,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 18,
        build: () => {
            const res = createCivilianVehicleMesh('BUS', 0xfacc15);
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: dt => {
                    res.wheels.forEach(w => { w.rotation.x += dt * 4.0; });
                }
            };
        }
    },

    // =========================================================================
    // 10. PROPS, COLLECTIBLES & NATURE (16)
    // =========================================================================
    {
        id: 'PROP_DUMPSTER',
        name: 'Recycling Dumpster Container',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => ({
            root: liftMinYToFloor(createDumpsterMesh().root, 0),
            animatedEntries: []
        })
    },
    {
        id: 'PROP_ENERGON_CUBE',
        name: 'Collectible Energon Cube',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 35,
        defaultPitch: 0.30,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => {
            const res = createEnergonCubeMesh();
            return {
                root: res.root,
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    res.cubePivot.rotation.y += dt * 1.5;
                    res.cubePivot.rotation.x += dt * 0.7;
                    res.cubePivot.position.y = 2.4 + Math.sin(nowSec * 3.0) * 0.35;
                }
            };
        }
    },
    {
        id: 'PROP_GOLDEN_CREST',
        name: 'Collectible Rescue Bot Golden Crest',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 28,
        defaultPitch: 0.25,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => {
            const mesh = createGoldenCrestMesh();
            const root = liftMinYToFloor(mesh, 0.5);
            return {
                root,
                animatedEntries: [],
                onAnimate: (dt, nowSec) => {
                    mesh.rotation.y += dt * 1.2;
                    mesh.position.y = 2.6 + Math.sin(nowSec * 2.8) * 0.25;
                }
            };
        }
    },
    {
        id: 'PROP_STREETLAMP',
        name: 'Griffin Rock Boulevard Streetlamp',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 35,
        defaultPitch: 0.24,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => ({
            root: liftMinYToFloor(createStreetlampMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'PROP_TRAFFIC_CONE',
        name: 'Safety Traffic Cone',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 35,
        defaultPitch: 0.30,
        gridSpanX: 6,
        gridSpanZ: 6,
        build: () => ({
            root: liftMinYToFloor(createTrafficConeMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'PROP_BARRICADE',
        name: 'Hazard Street Barricade',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => ({
            root: liftMinYToFloor(createBarricadeMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'HAZARD_FIRE',
        name: 'Rescue Fire Hazard Plume',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 35,
        defaultPitch: 0.28,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => {
            const grp = createHazardFireMesh();
            return {
                root: liftMinYToFloor(grp, 0),
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    const s = 0.92 + Math.sin(nowSec * 12) * 0.1;
                    grp.scale.set(s, 1 + Math.sin(nowSec * 15) * 0.14, s);
                }
            };
        }
    },
    {
        id: 'HAZARD_ROCKSLIDE',
        name: 'Rockslide Hazard Boulder',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 40,
        defaultPitch: 0.30,
        gridSpanX: 10,
        gridSpanZ: 10,
        build: () => ({
            root: liftMinYToFloor(createHazardRockslideMesh(1.0, 0.4, 0.8), 0),
            animatedEntries: []
        })
    },
    {
        id: 'HAZARD_MAGMA_DEBRIS',
        name: 'Volcanic Magma Rock Debris',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 40,
        defaultPitch: 0.30,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => {
            const res = createMagmaDebrisMesh();
            return {
                root: liftMinYToFloor(res.group, 0),
                animatedEntries: [],
                onAnimate: (_dt, nowSec) => {
                    const sc = 0.94 + Math.sin(nowSec * 5.0) * 0.08;
                    res.coreMesh.scale.setScalar(sc);
                }
            };
        }
    },
    {
        id: 'TREE_SPIRE_PINE',
        name: 'Nature — Towering Spire Pine',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.26,
        gridSpanX: 12,
        gridSpanZ: 12,
        build: () => ({
            root: liftMinYToFloor(createTreeArchetypeMesh(0), 0),
            animatedEntries: []
        })
    },
    {
        id: 'TREE_ALPINE_FIR',
        name: 'Nature — Alpine Snow-Peak Fir',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.26,
        gridSpanX: 12,
        gridSpanZ: 12,
        build: () => ({
            root: liftMinYToFloor(createTreeArchetypeMesh(1), 0),
            animatedEntries: []
        })
    },
    {
        id: 'TREE_TOWN_OAK',
        name: 'Nature — Leafy Town Oak',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 14,
        build: () => ({
            root: liftMinYToFloor(createTreeArchetypeMesh(2), 0),
            animatedEntries: []
        })
    },
    {
        id: 'TREE_GOLDEN_BIRCH',
        name: 'Nature — Golden Meadow Birch',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 12,
        gridSpanZ: 12,
        build: () => ({
            root: liftMinYToFloor(createTreeArchetypeMesh(3), 0),
            animatedEntries: []
        })
    },
    {
        id: 'TREE_COASTAL_UMBRELLA',
        name: 'Nature — Coastal Umbrella Tree',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 14,
        build: () => ({
            root: liftMinYToFloor(createTreeArchetypeMesh(4), 0),
            animatedEntries: []
        })
    },
    {
        id: 'NATURE_BUSH',
        name: 'Nature — Island Shrub Bush',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 35,
        defaultPitch: 0.30,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => ({
            root: liftMinYToFloor(createBushMesh(), 0),
            animatedEntries: []
        })
    },
    {
        id: 'NATURE_ROCK',
        name: 'Nature — Granite Island Boulder',
        category: 'Props, Collectibles & Nature',
        defaultYawDeg: 38,
        defaultPitch: 0.30,
        gridSpanX: 8,
        gridSpanZ: 8,
        build: () => ({
            root: liftMinYToFloor(createIslandRockMesh(), 0),
            animatedEntries: []
        })
    }
];

export function startModelCheck(canvasEl?: HTMLCanvasElement | null) {
    const params = new URLSearchParams(location.search);
    const catalogIds = MODEL_CATALOG.map(m => m.id);
    const ENV_PRESETS: Record<EnvPreset, {
        label: string;
        bg: number;
        ground: number;
        hemiSky: number;
        hemiGround: number;
        hemiInt: number;
        sunColor: number;
        sunInt: number;
        fillInt: number;
    }> = {
        studio: {
            label: 'Studio Day',
            bg: 0xdbeafe,
            ground: 0x94a3b8,
            hemiSky: 0xffffff,
            hemiGround: 0x64748b,
            hemiInt: 0.72,
            sunColor: 0xfffbeb,
            sunInt: 0.85,
            fillInt: 0.30
        },
        cavern: {
            label: 'Cavern Mood',
            bg: 0x0b0f1e,
            ground: 0x0f172a,
            hemiSky: 0x818cf8,
            hemiGround: 0x1e293b,
            hemiInt: 0.95,
            sunColor: 0xc7d2fe,
            sunInt: 0.72,
            fillInt: 0.45
        },
        dark: {
            label: 'Dark Showcase',
            bg: 0x1e293b,
            ground: 0x0f172a,
            hemiSky: 0xe2e8f0,
            hemiGround: 0x334155,
            hemiInt: 0.9,
            sunColor: 0xf8fafc,
            sunInt: 0.95,
            fillInt: 0.4
        }
    };

    const isMobile = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
    );
    let canvas = canvasEl || (document.getElementById('modelcheck-canvas') as HTMLCanvasElement | null);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'modelcheck-canvas';
        canvas.style.cssText = 'display:block;width:100vw;height:100vh;touch-action:none;';
        document.body.appendChild(canvas);
    }

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    const initialCatRaw = params.get('category') || 'ALL';
    const initialCategory: CategoryFilter = (MODEL_CATEGORIES as readonly string[]).includes(initialCatRaw)
        ? (initialCatRaw as ModelCategory)
        : 'ALL';

    const initialModelId = catalogIds.includes(params.get('model') || '')
        ? (params.get('model') as string)
        : 'SIGMA_CRASHED';
    const initialSpec = MODEL_CATALOG.find(m => m.id === initialModelId) || MODEL_CATALOG[0];
    const initialEnv: EnvPreset = (params.get('env') === 'cavern' || params.get('env') === 'dark')
        ? (params.get('env') as EnvPreset)
        : 'studio';

    const state = {
        view: params.get('view') === 'grid' ? 'grid' : 'focus',
        category: initialCategory as CategoryFilter,
        model: initialSpec.id,
        env: initialEnv,
        spin: params.has('spin') ? params.get('spin') !== '0' : !params.has('angle'),
        anim: params.get('anim') !== '0',
        grid: params.get('grid') !== '0',
        outlines: params.get('outlines') !== '0',
        wireframe: params.get('wireframe') === '1',
        yaw: THREE.MathUtils.degToRad(parseFloat(params.get('angle') || String(initialSpec.defaultYawDeg))),
        pitch: params.has('pitch') ? THREE.MathUtils.clamp(parseFloat(params.get('pitch') || '0.34') || 0.34, -0.45, 1.45) : initialSpec.defaultPitch,
        zoom: params.has('zoom') ? THREE.MathUtils.clamp(parseFloat(params.get('zoom') || '1') || 1, 0.2, 3.5) : 1
    };

    // --- Standalone Scene & Lighting ---
    const mcScene = new THREE.Scene();
    const mcHemi = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.85);
    mcScene.add(mcHemi);

    const mcSun = new THREE.DirectionalLight(0xfffbeb, 1.05);
    mcSun.position.set(70, 130, 90);
    mcSun.castShadow = true;
    const shadowSize = isMobile ? 1024 : 2048;
    mcSun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(mcSun.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 1, far: 550 });
    mcSun.shadow.bias = -0.0004;
    mcScene.add(mcSun);

    const mcFill = new THREE.DirectionalLight(0x93c5fd, 0.35);
    mcFill.position.set(-80, 50, -90);
    mcScene.add(mcFill);

    const groundMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(3600, 3600).rotateX(-Math.PI / 2),
        groundMat
    );
    ground.receiveShadow = true;
    mcScene.add(ground);

    const gridHelper = new THREE.GridHelper(2400, 480, 0x334155, 0x64748b);
    gridHelper.position.y = 0.03;
    mcScene.add(gridHelper);

    const mcCamera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 10000);
    mcCamera.layers.enable(OUTLINE_LAYER);

    function applyEnvironment(env: EnvPreset) {
        const cfg = ENV_PRESETS[env] || ENV_PRESETS.studio;
        mcScene.background = new THREE.Color(cfg.bg);
        groundMat.color.setHex(cfg.ground);
        mcHemi.color.setHex(cfg.hemiSky);
        mcHemi.groundColor.setHex(cfg.hemiGround);
        mcHemi.intensity = cfg.hemiInt;
        mcSun.color.setHex(cfg.sunColor);
        mcSun.intensity = cfg.sunInt;
        mcFill.intensity = cfg.fillInt;
        gridHelper.visible = state.grid;
    }

    function applyOutlineToggle(enabled: boolean) {
        if (enabled) mcCamera.layers.enable(OUTLINE_LAYER);
        else mcCamera.layers.disable(OUTLINE_LAYER);
        if (matInkOutline) matInkOutline.visible = enabled;
        if (matInkEdgeLine) matInkEdgeLine.visible = enabled;
    }

    const _wireframeTouched = new Set<THREE.Material>();
    function applyWireframeToTree(root: THREE.Object3D, enabled: boolean) {
        root.traverse((obj: THREE.Object3D) => {
            if (!(obj instanceof THREE.Mesh) || obj.userData?.isOutline) return;
            const mats: THREE.Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: THREE.Material) => {
                if (m && 'wireframe' in m && typeof (m as THREE.MeshBasicMaterial).wireframe === 'boolean' && (enabled || _wireframeTouched.has(m))) {
                    const wfMat = m as THREE.MeshBasicMaterial;
                    if (wfMat.userData?.baseWireframe === undefined) {
                        wfMat.userData = wfMat.userData || {};
                        wfMat.userData.baseWireframe = wfMat.wireframe;
                    }
                    wfMat.wireframe = enabled ? true : Boolean(wfMat.userData.baseWireframe);
                    _wireframeTouched.add(m);
                }
            });
        });
    }

    // --- Label Overlay ---
    const labelLayer = document.createElement('div');
    labelLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;font:600 11px/1.2 system-ui,sans-serif;z-index:20;';
    document.body.appendChild(labelLayer);

    // --- Lazy Grid Layout grouped cleanly by category ---
    const cells: ModelCell[] = MODEL_CATALOG.map(spec => ({
        spec,
        gridPos: new THREE.Vector3(),
        holder: null,
        label: null,
        animatedEntries: [],
        _center: new THREE.Vector3(),
        _size: new THREE.Vector3(),
        _minY: 0,
        _meshCount: 0,
        _triCount: 0,
        _boundsReady: false,
        _lastTransform: '',
        _lastLabelHtml: '',
        _lastLabelVisible: true
    }));

    const gridBoundsCenter = new THREE.Vector3();
    let gridDepth = 60;
    let maxRowHalfW = 40;

    function rebuildGridLayout() {
        const activeCategories: readonly ModelCategory[] = state.category === 'ALL'
            ? MODEL_CATEGORIES
            : [state.category];

        let curZ = 0;
        let nextMaxHalfW = 20;

        activeCategories.forEach(cat => {
            const catCells = cells.filter(c => c.spec.category === cat);
            if (catCells.length === 0) return;

            const isCompactCat = cat === 'Cavern Dinosaurs' || cat === 'Citizens & Traffic' || cat === 'Props, Collectibles & Nature';
            const maxPerRow = isCompactCat ? 5 : 3;
            const minColSlot = cat === 'Props, Collectibles & Nature' ? 16 : (isCompactCat ? 22 : 34);
            const colGap = isCompactCat ? 12 : 18;
            const rowGap = isCompactCat ? 16 : 22;
            const maxRowWidthLimit = 220;

            let idx = 0;
            while (idx < catCells.length) {
                const row: ModelCell[] = [];
                let accWidth = 0;
                while (idx < catCells.length && row.length < maxPerRow) {
                    const cell = catCells[idx];
                    const slotW = Math.max(cell.spec.gridSpanX, minColSlot);
                    const nextW = row.length === 0 ? slotW : accWidth + colGap + slotW;
                    if (row.length > 0 && nextW > maxRowWidthLimit) break;
                    row.push(cell);
                    accWidth = nextW;
                    idx++;
                }

                const rowMaxZ = row.reduce((acc, c) => Math.max(acc, c.spec.gridSpanZ), 14);
                curZ += rowMaxZ * 0.52;

                nextMaxHalfW = Math.max(nextMaxHalfW, accWidth * 0.5);
                let curX = -accWidth * 0.5;

                row.forEach(cell => {
                    const slotW = Math.max(cell.spec.gridSpanX, minColSlot);
                    const centerX = curX + slotW * 0.5;
                    curX += slotW + colGap;
                    cell.gridPos.set(centerX, 0, curZ);
                    if (cell.holder && state.view === 'grid') {
                        cell.holder.position.copy(cell.gridPos);
                    }
                });

                curZ += rowMaxZ * 0.52 + rowGap;
            }
        });

        gridDepth = Math.max(36, curZ);
        maxRowHalfW = nextMaxHalfW;
        // Slight -X offset keeps the full grid clear of the left studio control panel
        gridBoundsCenter.set(-14, 4, gridDepth * 0.52);
    }

    rebuildGridLayout();

    window.__modelCheckCatalog = MODEL_CATALOG.map(({ id, name, category }) => ({ id, name, category }));
    window.__modelCheckCells = cells;

    const _box = new THREE.Box3();
    const _tmpBox = new THREE.Box3();
    function measureVisibleMetrics(root: THREE.Object3D) {
        _box.makeEmpty();
        root.updateMatrixWorld(true);
        let meshCount = 0;
        let triCount = 0;
        root.traverse((o: THREE.Object3D) => {
            if (!o.visible) return;
            if (o instanceof THREE.Mesh && !o.userData?.isOutline && o.geometry) {
                meshCount++;
                const geo = o.geometry;
                const idx = geo.getIndex();
                if (idx) triCount += Math.floor(idx.count / 3);
                else if (geo.attributes?.position) triCount += Math.floor(geo.attributes.position.count / 3);
                if (!geo.boundingBox) geo.computeBoundingBox();
                if (geo.boundingBox) {
                    _tmpBox.copy(geo.boundingBox).applyMatrix4(o.matrixWorld);
                    _box.union(_tmpBox);
                }
            }
        });
        return { box: _box, meshCount, triCount };
    }

    function ensureCellBuilt(c: ModelCell) {
        if (c.holder && c.label) return;
        const built = c.spec.build();
        built.root.traverse((o: THREE.Object3D) => {
            if (o instanceof THREE.Mesh && !o.userData?.isOutline) {
                o.castShadow = true;
            }
        });

        const holder = new THREE.Group();
        holder.position.copy(c.gridPos);
        holder.add(built.root);
        mcScene.add(holder);

        const label = document.createElement('div');
        label.style.cssText = 'position:absolute;left:0;top:0;max-width:168px;white-space:normal;text-align:center;font:600 10px/1.22 system-ui,sans-serif;padding:3px 7px;border-radius:6px;background:rgba(15,23,42,.85);color:#f8fafc;border:1px solid rgba(56,189,248,.35);box-shadow:0 2px 6px rgba(0,0,0,.25);will-change:transform;contain:layout style;';
        labelLayer.appendChild(label);

        c.holder = holder;
        c.label = label;
        c.animatedEntries = built.animatedEntries;
        c.dinoRig = built.dinoRig;
        c.onAnimate = built.onAnimate;
        c._boundsReady = false;
        applyWireframeToTree(holder, state.wireframe);
    }

    // --- UI Studio Panel (custom SVGs from icons.ts, zero emoji) ---
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:12px;left:12px;z-index:30;width:296px;max-height:calc(100vh - 24px);overflow-y:auto;padding:12px;border-radius:12px;background:rgba(15,23,42,.92);color:#e2e8f0;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.32);border:1px solid rgba(148,163,184,.22);';

    const categoryOptionsMarkup =
        `<option value="ALL">All Categories (${MODEL_CATALOG.length})</option>` +
        MODEL_CATEGORIES.map(cat => {
            const count = MODEL_CATALOG.filter(m => m.category === cat).length;
            return `<option value="${cat}">${cat} (${count})</option>`;
        }).join('');

    function buildModelOptionsMarkup(categoryFilter: CategoryFilter): string {
        const activeCats: readonly ModelCategory[] = categoryFilter === 'ALL' ? MODEL_CATEGORIES : [categoryFilter];
        return activeCats.map(cat => {
            const opts = MODEL_CATALOG.filter(m => m.category === cat)
                .map(m => `<option value="${m.id}">${m.name}</option>`)
                .join('');
            return `<optgroup label="${cat}">${opts}</optgroup>`;
        }).join('');
    }

    const presetBtnCss = 'padding:3px 7px;border-radius:6px;background:#334155;color:#e2e8f0;border:1px solid #475569;font-size:11px;cursor:pointer;';

    panel.innerHTML = `
        <div style="font-weight:700;font-size:15px;margin-bottom:8px;display:flex;align-items:center;gap:7px;">
            <span data-header-icon style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${SVG_ICONS.CAVERN_COMPASS}</span>
            <span>Model Visual Check</span>
        </div>
        <label style="display:block;margin-bottom:6px;">View
            <select data-k="view" style="width:100%;color:#0f172a;border-radius:6px;padding:4px;margin-top:2px;">
                <option value="focus">Focus (single model)</option>
                <option value="grid">Grid (category / all models)</option>
            </select>
        </label>
        <label style="display:block;margin-bottom:6px;">Category
            <select data-k="category" style="width:100%;color:#0f172a;border-radius:6px;padding:4px;margin-top:2px;">${categoryOptionsMarkup}</select>
        </label>
        <div data-focus>
            <label style="display:block;margin-bottom:6px;"><span data-model-label>Model (${MODEL_CATALOG.length} unique)</span>
                <div style="display:flex;gap:4px;margin-top:2px;">
                    <select data-k="model" style="flex:1;min-width:0;color:#0f172a;border-radius:6px;padding:4px;">${buildModelOptionsMarkup(state.category)}</select>
                    <button data-prev type="button" style="${presetBtnCss}" title="Previous model">Prev</button>
                    <button data-next type="button" style="${presetBtnCss}" title="Next model">Next</button>
                </div>
            </label>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                <button data-cam="bow" type="button" style="${presetBtnCss}">3/4 Bow</button>
                <button data-cam="stern" type="button" style="${presetBtnCss}">Stern</button>
                <button data-cam="side" type="button" style="${presetBtnCss}">Side</button>
                <button data-cam="top" type="button" style="${presetBtnCss}">Top</button>
                <button data-cam="reset" type="button" style="${presetBtnCss}">Reset</button>
            </div>
        </div>
        <label style="display:block;margin-bottom:8px;">Environment Lighting
            <select data-k="env" style="width:100%;color:#0f172a;border-radius:6px;padding:4px;margin-top:2px;">
                <option value="studio">Studio Day</option>
                <option value="cavern">Cavern Mood</option>
                <option value="dark">Dark Showcase</option>
            </select>
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;margin-bottom:8px;font-size:12px;">
            <label><input data-k="spin" type="checkbox"> Turntable</label>
            <label><input data-k="anim" type="checkbox"> Animate</label>
            <label><input data-k="grid" type="checkbox"> Grid Floor</label>
            <label><input data-k="outlines" type="checkbox"> Outlines</label>
            <label><input data-k="wireframe" type="checkbox"> Wireframe</label>
        </div>
        <div data-telemetry style="margin-top:6px;padding:8px;border-radius:8px;background:rgba(30,41,59,.85);font:11px/1.45 ui-monospace,monospace;color:#cbd5e1;"></div>
        <div style="margin-top:8px;color:#94a3b8;font-size:11px;">
            Drag orbit · Right/Shift+drag pan · Wheel zoom<br>
            <a href="./botcheck.html" style="color:#7dd3fc;">bot check</a> · <a href="./index.html" style="color:#7dd3fc;">back to game</a>
        </div>`;
    document.body.appendChild(panel);
    const q = <T extends HTMLElement = HTMLElement>(sel: string): T | null => panel.querySelector<T>(sel);
    const stateMap = state as unknown as Record<string, string | number | boolean>;

    const _panOffset = new THREE.Vector3();
    let needsBoundsRefresh = true;

    function getFilteredCatalog(): ModelCatalogEntry[] {
        return state.category === 'ALL'
            ? MODEL_CATALOG
            : MODEL_CATALOG.filter(m => m.category === state.category);
    }

    function syncUrl() {
        const p = new URLSearchParams({
            view: state.view,
            category: state.category,
            model: state.model,
            env: state.env,
            angle: THREE.MathUtils.radToDeg(state.yaw).toFixed(0),
            pitch: state.pitch.toFixed(2),
            zoom: state.zoom.toFixed(2),
            spin: state.spin ? '1' : '0'
        });
        history.replaceState(null, '', '?' + p.toString());
    }

    function syncControlsToState() {
        panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-k]').forEach((el) => {
            const k = el.dataset.k;
            if (!k) return;
            if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = Boolean(stateMap[k]);
            else el.value = String(stateMap[k] ?? '');
        });
    }

    function selectModel(nextId: string) {
        const spec = MODEL_CATALOG.find(m => m.id === nextId);
        if (!spec) return;
        state.model = spec.id;
        state.yaw = THREE.MathUtils.degToRad(spec.defaultYawDeg);
        state.pitch = spec.defaultPitch;
        state.zoom = 1;
        _panOffset.set(0, 0, 0);
        needsBoundsRefresh = true;
        syncControlsToState();
        syncUrl();
    }

    function rebuildModelDropdown() {
        const filtered = getFilteredCatalog();
        const modelSel = q('[data-k=model]') as HTMLSelectElement | null;
        if (modelSel) {
            modelSel.innerHTML = buildModelOptionsMarkup(state.category);
        }
        const labelEl = q('[data-model-label]');
        if (labelEl) {
            labelEl.textContent = state.category === 'ALL'
                ? `Model (${MODEL_CATALOG.length} unique)`
                : `Model (${filtered.length} in category)`;
        }
        if (filtered.length > 0 && !filtered.some(m => m.id === state.model)) {
            selectModel(filtered[0].id);
        } else {
            syncControlsToState();
        }
    }

    panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-k]').forEach((el) => {
        const k = el.dataset.k;
        if (!k) return;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = Boolean(stateMap[k]);
        else el.value = String(stateMap[k] ?? '');
        el.addEventListener('input', () => {
            if (k === 'model') {
                selectModel(el.value);
                return;
            }
            if (k === 'category') {
                state.category = el.value as CategoryFilter;
                _panOffset.set(0, 0, 0);
                rebuildModelDropdown();
                rebuildGridLayout();
                needsBoundsRefresh = true;
                syncUrl();
                return;
            }
            stateMap[k] = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
            if (k === 'env' || k === 'grid') applyEnvironment(state.env);
            if (k === 'outlines') applyOutlineToggle(state.outlines);
            if (k === 'wireframe') {
                cells.forEach(c => { if (c.holder) applyWireframeToTree(c.holder, state.wireframe); });
            }
            if (k === 'view') {
                _panOffset.set(0, 0, 0);
                if (state.view === 'grid') rebuildGridLayout();
            }
            needsBoundsRefresh = true;
            syncUrl();
        });
    });

    q('[data-prev]')?.addEventListener('click', () => {
        const filteredIds = getFilteredCatalog().map(m => m.id);
        if (filteredIds.length === 0) return;
        const idx = Math.max(0, filteredIds.indexOf(state.model));
        selectModel(filteredIds[(idx - 1 + filteredIds.length) % filteredIds.length]);
    });
    q('[data-next]')?.addEventListener('click', () => {
        const filteredIds = getFilteredCatalog().map(m => m.id);
        if (filteredIds.length === 0) return;
        const idx = Math.max(0, filteredIds.indexOf(state.model));
        selectModel(filteredIds[(idx + 1) % filteredIds.length]);
    });

    panel.querySelectorAll<HTMLElement>('[data-cam]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.cam;
            state.spin = false;
            if (preset === 'bow') {
                state.yaw = THREE.MathUtils.degToRad(40);
                state.pitch = 0.34;
            } else if (preset === 'stern') {
                state.yaw = THREE.MathUtils.degToRad(215);
                state.pitch = 0.30;
            } else if (preset === 'side') {
                state.yaw = THREE.MathUtils.degToRad(90);
                state.pitch = 0.20;
            } else if (preset === 'top') {
                state.yaw = 0;
                state.pitch = 1.35;
            } else if (preset === 'reset') {
                const spec = MODEL_CATALOG.find(m => m.id === state.model) || MODEL_CATALOG[0];
                state.yaw = THREE.MathUtils.degToRad(spec.defaultYawDeg);
                state.pitch = spec.defaultPitch;
                state.zoom = 1;
                _panOffset.set(0, 0, 0);
            }
            syncControlsToState();
            syncUrl();
        });
    });

    // Ensure dropdown matches URL-initialized category
    rebuildModelDropdown();

    // Expose programmatic switcher helper for testing
    window.__setModelCheckState = (patch: Partial<typeof state>) => {
        const categoryChanged = patch.category !== undefined && patch.category !== state.category;
        Object.assign(state, patch);
        if (categoryChanged) {
            _panOffset.set(0, 0, 0);
            rebuildModelDropdown();
            rebuildGridLayout();
        } else if (patch.view === 'grid') {
            rebuildGridLayout();
        }
        applyEnvironment(state.env);
        applyOutlineToggle(state.outlines);
        cells.forEach(c => { if (c.holder) applyWireframeToTree(c.holder, state.wireframe); });
        needsBoundsRefresh = true;
        syncControlsToState();
        syncUrl();
    };

    // --- Orbit + Right/Shift Pan + Wheel Zoom Controls ---
    let dragMode: 'none' | 'orbit' | 'pan' = 'none';
    let lastX = 0;
    let lastY = 0;
    const _panRight = new THREE.Vector3();
    const _panUp = new THREE.Vector3();

    renderer.domElement.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
    renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (e.button === 2 || e.shiftKey) {
            dragMode = 'pan';
        } else {
            dragMode = 'orbit';
            state.spin = false;
            const spinInput = q<HTMLInputElement>('[data-k=spin]');
            if (spinInput) spinInput.checked = false;
        }
    });
    window.addEventListener('pointerup', () => { dragMode = 'none'; });
    window.addEventListener('pointermove', (e: PointerEvent) => {
        if (dragMode === 'none') return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        if (dragMode === 'orbit') {
            state.yaw -= dx * 0.008;
            state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.006, -0.45, 1.45);
        } else {
            const panScale = 0.06 * state.zoom;
            mcCamera.updateMatrixWorld();
            _panRight.setFromMatrixColumn(mcCamera.matrixWorld, 0);
            _panUp.setFromMatrixColumn(mcCamera.matrixWorld, 1);
            _panOffset.addScaledVector(_panRight, -dx * panScale);
            _panOffset.addScaledVector(_panUp, dy * panScale);
        }
    });
    renderer.domElement.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        state.zoom = THREE.MathUtils.clamp(state.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.2, 3.5);
    }, { passive: false });
    window.addEventListener('resize', () => {
        mcCamera.aspect = window.innerWidth / window.innerHeight;
        mcCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    applyEnvironment(state.env);
    applyOutlineToggle(state.outlines);

    const _v = new THREE.Vector3();
    const _center = new THREE.Vector3();
    const _size = new THREE.Vector3();
    const _camTarget = new THREE.Vector3();
    const _camDir = new THREE.Vector3();
    window.__modelCheckCamera = mcCamera;
    window.__modelCheckCamTarget = _camTarget;
    let lastNow = performance.now();
    let telemetryTimer = 0;

    function animateCellEffects(c: ModelCell, dt: number, nowSec: number) {
        if (!state.anim) return;
        for (let i = 0; i < c.animatedEntries.length; i++) {
            const am = c.animatedEntries[i];
            if (am.kind === 'SPIN_PULSE') {
                am.obj.rotation.y += dt * 1.4;
                am.obj.position.y = am.baseY + Math.sin(nowSec * 2.8 + am.phase) * 0.5;
            } else if (am.kind === 'FLICKER') {
                const sc = 0.85 + Math.sin(nowSec * 14.0 + am.phase) * 0.15;
                am.obj.scale.setScalar(sc);
            } else if (am.kind === 'LAVA_PULSE') {
                am.obj.position.y = am.baseY + Math.sin(nowSec * 2.5 + am.phase) * 0.08;
            }
        }
        if (c.dinoRig) {
            const dr = c.dinoRig;
            const cyc = nowSec * 4.5 + dr.phase;
            const swing = Math.sin(cyc) * 0.35;
            for (let l = 0; l < dr.legs.length; l++) {
                dr.legs[l].rotation.x = (l % 2 === 0 ? swing : -swing);
            }
            dr.tailPivot.rotation.y = Math.sin(nowSec * 3.4 + dr.phase) * 0.3;
            dr.headPivot.rotation.x = Math.sin(nowSec * 2.4 + dr.phase) * 0.1;
        }
        if (c.onAnimate) {
            c.onAnimate(dt, nowSec);
        }
    }

    function frame(now: number) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - lastNow) / 1000);
        lastNow = now;
        const nowSec = now * 0.001;
        if (state.spin) state.yaw += dt * 0.32;

        const isFocus = state.view === 'focus';
        const focusEl = q('[data-focus]');
        if (focusEl) focusEl.style.display = isFocus ? '' : 'none';

        telemetryTimer -= dt;
        const updateTelemetry = telemetryTimer <= 0;
        if (updateTelemetry) telemetryTimer = 0.25;

        let focusCell: ModelCell | null = null;
        let builtCount = 0;
        let activeCategoryCount = 0;

        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            const inCategory = state.category === 'ALL' || c.spec.category === state.category;
            if (inCategory) activeCategoryCount++;
            const show = isFocus ? (c.spec.id === state.model) : inCategory;
            if (!show) {
                if (c.holder) c.holder.visible = false;
                if (c.label && c._lastLabelVisible) {
                    c.label.style.display = 'none';
                    c._lastLabelVisible = false;
                }
                continue;
            }

            ensureCellBuilt(c);
            builtCount++;
            const holder = c.holder!;
            holder.visible = true;

            if (!isFocus) {
                holder.position.copy(c.gridPos);
                holder.rotation.y = state.spin ? nowSec * 0.28 : 0;
            } else {
                holder.position.set(0, 0, 0);
                holder.rotation.y = 0;
                focusCell = c;
            }

            animateCellEffects(c, dt, nowSec);

            if (needsBoundsRefresh || !c._boundsReady) {
                const { box, meshCount, triCount } = measureVisibleMetrics(holder);
                if (!box.isEmpty()) {
                    box.getCenter(_center);
                    box.getSize(_size);
                    c._center.copy(_center);
                    c._size.copy(_size);
                    c._minY = box.min.y;
                } else {
                    c._center.copy(holder.position);
                    c._size.set(6, 6, 6);
                    c._minY = 0;
                }
                c._meshCount = meshCount;
                c._triCount = triCount;
                c._boundsReady = true;
            }
        }
        needsBoundsRefresh = false;

        // Camera Positioning
        if (!isFocus) {
            _camTarget.copy(gridBoundsCenter).add(_panOffset);
            const span = Math.max(gridDepth * 1.15, (maxRowHalfW * 2) / Math.max(0.95, mcCamera.aspect * 0.92));
            const dist = span * 1.05 * state.zoom;
            const pitchClamped = THREE.MathUtils.clamp(state.pitch + 0.42, 0.16, 1.45);
            mcCamera.position.set(
                _camTarget.x + Math.sin(state.spin ? 0 : state.yaw) * Math.cos(pitchClamped) * dist,
                _camTarget.y + Math.sin(pitchClamped) * dist,
                _camTarget.z + Math.cos(state.spin ? 0 : state.yaw) * Math.cos(pitchClamped) * dist
            );
            mcCamera.lookAt(_camTarget);
        } else if (focusCell) {
            _camTarget.copy(focusCell._center).add(_panOffset);
            const dist = Math.max(4.5, focusCell._size.length() * 1.25) * state.zoom;
            mcCamera.position.set(
                _camTarget.x + Math.sin(state.yaw) * Math.cos(state.pitch) * dist,
                _camTarget.y + Math.sin(state.pitch) * dist,
                _camTarget.z + Math.cos(state.yaw) * Math.cos(state.pitch) * dist
            );
            mcCamera.lookAt(_camTarget);
        }
        mcCamera.updateMatrixWorld(true);
        mcCamera.matrixWorldInverse.copy(mcCamera.matrixWorld).invert();

        _camDir.set(mcCamera.position.x - _camTarget.x, 0, mcCamera.position.z - _camTarget.z);
        if (_camDir.lengthSq() > 1e-6) _camDir.normalize();
        else _camDir.set(0, 0, 1);

        const vw = renderer.domElement.clientWidth || window.innerWidth;
        const vh = renderer.domElement.clientHeight || window.innerHeight;

        // Floating Labels (GPU-composited transform, cached DOM writes, synchronized camera matrix)
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (!c.holder || !c.holder.visible || !c.label) continue;
            if (isFocus) {
                if (c._lastLabelVisible) {
                    c.label.style.display = 'none';
                    c._lastLabelVisible = false;
                }
                continue;
            }
            const anchorR = Math.max(2.2, Math.max(c._size.x, c._size.z) * 0.48);
            _v.set(
                c.holder.position.x + _camDir.x * anchorR,
                -0.4,
                c.holder.position.z + _camDir.z * anchorR
            ).project(mcCamera);
            const onScreen = _v.z >= -1 && _v.z < 1 && Math.abs(_v.x) < 1.15 && Math.abs(_v.y) < 1.15;
            if (!onScreen) {
                if (c._lastLabelVisible) {
                    c.label.style.display = 'none';
                    c._lastLabelVisible = false;
                }
                continue;
            }
            if (!c._lastLabelVisible) {
                c.label.style.display = '';
                c._lastLabelVisible = true;
            }
            const sx = (_v.x + 1) * 0.5 * vw;
            const sy = (1 - _v.y) * 0.5 * vh;
            const tr = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, 0)`;
            if (tr !== c._lastTransform) {
                c.label.style.transform = tr;
                c._lastTransform = tr;
            }
            const nextHtml = `${c.spec.name}<br><span style="color:#94a3b8;font-weight:500;">${c._size.x.toFixed(0)}×${c._size.y.toFixed(0)}×${c._size.z.toFixed(0)} m</span>`;
            if (nextHtml !== c._lastLabelHtml) {
                c.label.innerHTML = nextHtml;
                c._lastLabelHtml = nextHtml;
            }
        }

        if (updateTelemetry) {
            const activeCell = focusCell;
            let totalMeshes = 0;
            let totalTris = 0;
            cells.forEach(c => {
                if (c.holder && c.holder.visible) {
                    totalMeshes += c._meshCount;
                    totalTris += c._triCount;
                }
            });
            const telemetryEl = q('[data-telemetry]');
            if (telemetryEl) {
                if (isFocus && activeCell) {
                    const s = activeCell._size;
                    telemetryEl.innerHTML =
                        `<div><b>${activeCell.spec.name}</b></div>` +
                        `<div style="color:#7dd3fc;">${activeCell.spec.category}</div>` +
                        `<div>Size: ${s.x.toFixed(1)} × ${s.y.toFixed(1)} × ${s.z.toFixed(1)} m</div>` +
                        `<div>Ground minY: ${activeCell._minY >= 0 ? '+' : ''}${activeCell._minY.toFixed(2)} m</div>` +
                        `<div>Meshes: ${activeCell._meshCount} | Tris: ${activeCell._triCount.toLocaleString()}</div>`;
                } else {
                    const catLabel = state.category === 'ALL' ? 'All Categories' : state.category;
                    telemetryEl.innerHTML =
                        `<div><b>Grid Mode: ${builtCount} / ${activeCategoryCount} (${catLabel})</b></div>` +
                        `<div>Catalog Total: ${cells.length} Models</div>` +
                        `<div>Visible Meshes: ${totalMeshes}</div>` +
                        `<div>Visible Tris: ${totalTris.toLocaleString()}</div>`;
                }
            }
            window.__modelCheckStats = {
                builtCount,
                activeCategoryCount,
                totalCatalog: cells.length,
                view: state.view,
                category: state.category,
                env: state.env,
                activeId: state.model,
                meshes: isFocus && activeCell ? activeCell._meshCount : totalMeshes,
                triangles: isFocus && activeCell ? activeCell._triCount : totalTris,
                size: isFocus && activeCell ? { x: activeCell._size.x, y: activeCell._size.y, z: activeCell._size.z } : null,
                minY: isFocus && activeCell ? activeCell._minY : null
            };
        }

        renderer.render(mcScene, mcCamera);
    }
    requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') {
    window.startModelCheck = startModelCheck;
}

// Shared Strict TypeScript Interfaces for Rescue Bots 3D
import * as THREE from 'three';

export type BotType =
    | 'BOULDER'
    | 'HEATWAVE'
    | 'CHASE'
    | 'BLADES'
    | 'OPTIMUS'
    | 'BUMBLEBEE'
    | 'BLURR'
    | 'SALVAGE'
    | 'HIGHTIDE'
    | 'QUICKSHADOW'
    | 'STARSPEED';

export type BotMode = 'BOT' | 'VEHICLE' | 'DINO' | 'HIDDEN_VEHICLE';

export type ActiveArea =
    | 'SURFACE'
    | 'UNDERGROUND'
    | 'UNDERWATER'
    | 'SOLAR_HUB'
    | 'SPACE'
    | 'MOON'
    | 'PLANET_SURFACE'
    | 'PLANET_CAVERN'
    | 'SATURN_RING_RACE';

export interface HiddenVehicleModeConfig {
    name: string;
    buttonLabel: string;
    buttonIcon: string;
    actionIcon: string;
    actionLabel: string;
    canFly: boolean;
    defaultFlightAlt?: number;
    maxSpeed: number;
    boostSpeed: number;
    groundOffset?: number;
    toastTitle?: string;
    toastSubtitle?: string;
}

export interface BotMetaEntry {
    name: string;
    role: string;
    scale?: number;
    voicePitch: number;
    vehName: string;
    boatName: string;
    dinoName: string;
    colorClass: string;
    dotClass: string;
    btnActionBg: string;
    botActionIcon: string;
    botActionLabel: string;
    vehActionIcon: string;
    vehActionLabel: string;
    boatActionIcon: string;
    boatActionLabel: string;
    dinoActionIcon: string;
    dinoActionLabel: string;
    hiddenVehicleMode?: HiddenVehicleModeConfig | null;
}

export interface GroundOffsetEntry {
    bot: number;
    veh: number;
    dino: number;
    boat?: number;
    hiddenVeh?: number;
}

export interface LightbarAssembly {
    group: THREE.Group;
    red: THREE.Mesh;
    blue: THREE.Mesh;
    redMat: THREE.MeshBasicMaterial;
    blueMat: THREE.MeshBasicMaterial;
}

export interface BotRig {
    botType: string;
    isMega?: boolean;
    root: THREE.Group;
    chassis: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    frontAttachment: THREE.Group;
    backAttachment: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftForearm: THREE.Group;
    rightForearm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftFoot: THREE.Group;
    rightFoot: THREE.Group;
    leftLegWheelMount: THREE.Group;
    rightLegWheelMount: THREE.Group;
    leftArmWheelMount: THREE.Group;
    rightArmWheelMount: THREE.Group;
    leftDoorWing: THREE.Group;
    rightDoorWing: THREE.Group;
    leftSkidMount: THREE.Group;
    rightSkidMount: THREE.Group;
    leftCockpitShell: THREE.Group;
    rightCockpitShell: THREE.Group;
    dozerCabMount: THREE.Group;
    exhaustStacks: THREE.Group;
    dinoGroup: THREE.Group;
    dinoHead: THREE.Group;
    dinoTail: THREE.Group;
    dinoLeftWing: THREE.Group;
    dinoRightWing: THREE.Group;
    dinoLeftArm: THREE.Group;
    dinoRightArm: THREE.Group;
    dinoLowerJaw: THREE.Object3D | null;
    wheels: THREE.Object3D[];
    rotors: THREE.Object3D | null;
    tailRotor: THREE.Object3D | null;
    lightbar: LightbarAssembly | null;
    nozzleTip: THREE.Object3D;
    dinoNozzleTip: THREE.Object3D;
    boatGroup?: THREE.Group;
    hiddenVehicleShell?: THREE.Group;
    // Bot-specific optional sub-assemblies
    [key: string]: unknown;
}

export interface PlayerState {
    botType: string;
    mode: string;
    morph: number;
    targetMorph: number;
    dinoMorph: number;
    targetDinoMorph: number;
    boatMorph?: number;
    targetBoatMorph?: number;
    hiddenMorph?: number;
    targetHiddenMorph?: number;
    pos: THREE.Vector3;
    heading: number;
    speed: number;
    vy: number;
    flightAlt: number;
    ascendInput: number;
    grounded: boolean;
    walkCycle: number;
    smashTimer: number;
    scoopTimer: number;
    winchTimer: number;
    netTimer: number;
    netTarget: THREE.Vector3;
    sirenActive: boolean;
    boostTimer: number;
    energonBoostTimer: number;
    waterTimer: number;
    sonarTimer: number;
    autoActionCooldown: number;
    waypoint: THREE.Vector3;
    hasWaypoint: boolean;
    inCarWash: boolean;
    lastWashSoundTime: number;
    turboGlazeTimer: number;
    catapultTimer: number;
    catapultCooldown: number;
    inDinerLane: boolean;
    lastDinerOrderTime: number;
    lastDinerPickupTime: number;
    portalCooldown: number;
    chargerCooldown: number;
    onFerry: boolean;
    inCrane: boolean;
    craneTimer: number;
    craneCooldown: number;
    bounceCooldown: number;
    lastSplatTime: number;
    dumpsterTimer: number;
    activeDumpster: unknown;
    drillEquipTimer: number;
    drillSpin: number;
    dinoNudgeCooldown: number;
    knockbackVx: number;
    knockbackVz: number;
    trailerAngle: number;
    trailerArticAngle: number;
    _lastNearWater?: boolean;
    _lastNearDumpster?: boolean;
    _wasInWater?: boolean;
    _wasBoatMode?: boolean;
    _dinoWaterWarned?: boolean;
}

export interface BuddyBotState {
    botType: string;
    pos: THREE.Vector3;
    heading: number;
    speed: number;
    vy: number;
    flightAlt: number;
    morph: number;
    targetMorph: number;
    dinoMorph: number;
    targetDinoMorph: number;
    boatMorph?: number;
    targetBoatMorph?: number;
    hiddenMorph?: number;
    targetHiddenMorph?: number;
    walkCycle: number;
    smashTimer: number;
    scoopTimer: number;
    waterTimer: number;
    sonarTimer?: number;
    boostTimer?: number;
    actionCooldown: number;
    autoActionCooldown?: number;
    inCarWash: boolean;
    trailerAngle: number;
    trailerArticAngle: number;
    lastSpeechTime?: number;
    _shoreWaitSpeechTime?: number;
}

export interface DrillAnimState {
    active: boolean;
    direction: 'DOWN' | 'UP';
    timer: number;
    duration: number;
    swapped: boolean;
    startX: number;
    startY: number;
    startZ: number;
    lastParticleTime: number;
}

export interface SpaceLaunchState {
    active: boolean;
    mode: 'TO_SPACE' | 'TO_MOON' | 'MOON_TO_SPACE' | 'TO_EARTH' | string;
    timer: number;
    duration: number;
    swapped: boolean;
}

export interface WorldState {
    activeArea: ActiveArea;
    activePlanetId: string;
    activeSpaceSector: string;
    planetReturnSector: string | null;
    savedSurfacePos: THREE.Vector3;
    savedSurfaceHeading: number;
    savedUndergroundPos: THREE.Vector3;
    savedUndergroundHeading: number;
    savedPlanetPos: THREE.Vector3;
    savedPlanetHeading: number;
    savedOceanPos: THREE.Vector3;
    savedOceanHeading: number;
    hasVisitedUnderground: boolean;
    nearUnderwaterSurface: boolean;
    nearExitShaft: boolean;
    nearSigmaShip: boolean;
    sigmaActionMode: string;
    nearMoonLanding: boolean;
    nearLandableMoonId: string;
    nearMoonSigma: boolean;
    nearMoonFlag: boolean;
    nearPlanetSigma: boolean;
    nearPlanetCaveEntrance: boolean;
    nearPlanetCavernExit: boolean;
    drillAnim: DrillAnimState;
    spaceLaunch: SpaceLaunchState;
}

export interface InputState {
    keys: Record<string, boolean>;
    camZoomMode: number;
    camYaw: number;
    camPitch: number;
    autoCam?: boolean;
    isDraggingCam?: boolean;
    lastPointerX?: number;
    lastPointerY?: number;
    joyX?: number;
    joyY?: number;
    joyActive?: boolean;
}

export interface ProgressionState {
    saveVersion: number;
    releaseVersion: string;
    totalEmergenciesResolved: number;
    totalCitizensRescued: number;
    totalEnergonCubes: number;
    totalStuntsCompleted: number;
    discoveredLandmarks: string[];
    collectedCrests: string[];
    discoveredAllies: string[];
    autoSpawnEmergencies: boolean;
    playerBotType: string;
    buddyBotType: string;
    playerMode: string;
    highTideDocked: boolean;
    optimusDocked: boolean;
    boulderDocked: boolean;
    heatwaveDocked: boolean;
    chaseDocked: boolean;
    bladesDocked: boolean;
    bumblebeeDocked: boolean;
    blurrDocked: boolean;
    salvageDocked: boolean;
    quickshadowDocked: boolean;
    starspeedDocked: boolean;
    weatherMode: string;
    playerPosition: { x: number; y: number; z: number; heading: number } | null;
    completedMissions: string[];
    discoveredCavernLandmarks: string[];
    cavernGemsCollected: number;
    exploredCavernCells: string[];
    brokenCavernWalls: string[];
    sigmaPartsFound: string[];
    sigmaInstalledParts: string[];
    sigmaRepaired: boolean;
    spaceAsteroidsCleared: number;
    spaceRescuesDone: number;
    spaceRingsCompleted: number;
    spaceMoroccoDefeated: boolean;
    moonRelicsFound: string[];
    moonFlagPlanted: boolean;
    moonHoopsCleared: number;
    visitedPlanets: string[];
    planetRelicsFound: string[];
    jupiterMoonsVisited: string[];
    saturnBestLapSec: number | null;
    saturnRacesCompleted: number;
    saturnWins: number;
    [key: string]: unknown;
}

export interface ColliderItem {
    x: number;
    z: number;
    r: number;
    type?: string;
    target?: unknown;
    destroyed?: boolean;
    _qStamp?: number;
}

export interface CullableEntry {
    obj: THREE.Object3D;
    x: number;
    y: number;
    z: number;
    radius: number;
}

export interface HumanNPCEntry {
    name: string;
    role: string;
    x: number;
    y: number;
    z: number;
    heading: number;
    group: THREE.Group;
    [key: string]: unknown;
}

export interface VehicleNPCEntry {
    name: string;
    role: string;
    x: number;
    y: number;
    z: number;
    heading: number;
    group: THREE.Group;
    [key: string]: unknown;
}

export interface RampItem {
    x: number;
    z: number;
    w: number;
    l: number;
    height: number;
    r: number;
    cosY: number;
    sinY: number;
}

export interface AnimatedItem {
    obj: THREE.Object3D;
    kind: string;
    baseY: number;
    phase: number;
    [key: string]: unknown;
}

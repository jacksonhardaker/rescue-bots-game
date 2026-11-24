// Global Game State Singletons
import * as THREE from 'three';
import type {
    PlayerState, BuddyBotState, WorldState, InputState,
    RampItem, ColliderItem, CullableEntry, HumanNPCEntry, VehicleNPCEntry
} from '../types/game.js';

export const player: PlayerState = {
    botType: 'BOULDER',
    mode: 'BOT',          // 'BOT', 'VEHICLE', or 'DINO'
    morph: 0,             // Vehicle morph (0 -> 1)
    targetMorph: 0,
    dinoMorph: 0,         // Dinobot morph (0 -> 1)
    targetDinoMorph: 0,
    hiddenMorph: 0,       // Hidden special vehicle mode morph (0 -> 1)
    targetHiddenMorph: 0,
    pos: new THREE.Vector3(0, 5, -15), // Starts on the Rescue HQ Swap Pad
    heading: 0,
    speed: 0,
    vy: 0,
    flightAlt: 0,         // Vertical flight offset when Blades is in Helicopter or Pterosaur Mode
    ascendInput: 0,       // +1 Ascend, -1 Descend
    grounded: true,
    walkCycle: 0,
    smashTimer: 0,
    scoopTimer: 0,        // Boulder Bulldozer Scoop & Hydraulic Lift cycle
    winchTimer: 0,        // Blades Helicopter Rescue Winch deployment
    netTimer: 0,          // Chase Police Energy Net & Tow Winch deployment
    netTarget: new THREE.Vector3(),
    sirenActive: false,   // Optional continuous Siren Toggle for Heatwave & Chase
    boostTimer: 0,
    energonBoostTimer: 0, // Rainbow Energon Turbo & Super-Jump Boost timer
    waterTimer: 0,
    sonarTimer: 0,
    autoActionCooldown: 0,
    waypoint: new THREE.Vector3(0, 5, -15),
    hasWaypoint: false,
    inCarWash: false,
    lastWashSoundTime: 0,
    turboGlazeTimer: 0,   // Squeaky Clean Robo-Wash speed shine buff
    catapultTimer: 0,     // Catapult launch countdown
    catapultCooldown: 0,  // Prevents re-triggering catapult immediately
    inDinerLane: false,
    lastDinerOrderTime: 0,
    lastDinerPickupTime: 0,
    portalCooldown: 0,    // GroundBridge teleport cooldown
    chargerCooldown: 0,   // Energon Turbo-Charger cooldown
    onFerry: false,       // Riding South Harbor Rescue Ferry
    inCrane: false,       // Hoisted by Magnetic Gantry Crane
    craneTimer: 0,
    craneCooldown: 0,
    bounceCooldown: 0,    // Anti-gravity bounce pad cooldown
    lastSplatTime: 0,
    dumpsterTimer: 0,     // Salvage Dumpster Hopper Dump animation timer
    activeDumpster: null, // Currently gripped / dumped dumpster instance
    drillEquipTimer: 0,   // Boulder rotary auger drill equipment animation timer
    drillSpin: 0,
    dinoNudgeCooldown: 0, // Prevents repeated big-dino knockback impulses
    knockbackVx: 0,
    knockbackVz: 0,
    trailerAngle: 0,
    trailerArticAngle: 0
};

export const worldState: WorldState = {
    activeArea: 'SURFACE', // 'SURFACE' | 'UNDERGROUND' | 'SOLAR_HUB' | 'SPACE' | 'MOON' | 'PLANET_SURFACE' | 'SATURN_RING_RACE'
    activePlanetId: 'MOON', // 'MOON' | 'MERCURY' | 'VENUS' | 'EARTH' | 'MARS' | 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE' | 'PLUTO' | 'EUROPA' | 'MIRANDA' | 'TRITON'
    activeSpaceSector: 'MOON_ORBIT', // 'MOON_ORBIT' | 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE'
    planetReturnSector: null as string | null, // If landed on Europa/Miranda/Triton, returns to that giant's orbit
    savedSurfacePos: new THREE.Vector3(0, 5, -15),
    savedSurfaceHeading: 0,
    savedUndergroundPos: new THREE.Vector3(0, 1.0, 6),
    savedUndergroundHeading: 0,
    savedPlanetPos: new THREE.Vector3(0, 6.5, 6),
    savedPlanetHeading: 0,
    hasVisitedUnderground: false,
    nearExitShaft: false,
    nearSigmaShip: false,
    sigmaActionMode: '', // '' | 'NEED_PARTS' | 'INSTALL_PART' | 'LAUNCH'
    nearMoonLanding: false,
    nearLandableMoonId: '' as string, // '' | 'MOON' | 'EUROPA' | 'IO' | 'GANYMEDE' | 'TITAN' | 'MIRANDA' | 'TITANIA' | 'TRITON'
    nearMoonSigma: false,
    nearMoonFlag: false,
    nearPlanetSigma: false,
    nearPlanetCaveEntrance: false,
    nearPlanetCavernExit: false,
    drillAnim: {
        active: false,
        direction: 'DOWN', // 'DOWN' | 'UP'
        timer: 0,
        duration: 1.9,
        swapped: false,
        startX: 0,
        startY: 0,
        startZ: 0,
        lastParticleTime: 0
    },
    spaceLaunch: {
        active: false,
        mode: 'TO_SPACE', // 'TO_SPACE' | 'TO_MOON' | 'MOON_TO_SPACE' | 'TO_EARTH'
        timer: 0,
        duration: 7.0,
        swapped: false
    }
};

export const buddyBot: BuddyBotState = {
    botType: 'HEATWAVE',
    pos: new THREE.Vector3(-6, 5, -18),
    heading: 0,
    speed: 0,
    vy: 0,
    flightAlt: 0,
    morph: 0,
    targetMorph: 0,
    dinoMorph: 0,
    targetDinoMorph: 0,
    hiddenMorph: 0,
    targetHiddenMorph: 0,
    walkCycle: 0,
    smashTimer: 0,
    scoopTimer: 0,
    waterTimer: 0,
    actionCooldown: 0,
    inCarWash: false,
    trailerAngle: 0,
    trailerArticAngle: 0
};

export const input: InputState = {
    keys: {},
    camYaw: 0,
    camPitch: 0.48,
    camZoomMode: 0,
    autoCam: true
};

export const ramps: RampItem[] = [];

export const worldColliders: ColliderItem[] = [];
const COLLIDER_CELL_SIZE = 48;
const _colliderGrid = new Map<number, ColliderItem[]>();
let _indexedColliderCount = 0;
let _colliderQueryStamp = 0;

function _cellKey(cx: number, cz: number): number {
    return (((cx + 512) & 0xfff) << 12) | ((cz + 512) & 0xfff);
}

function _indexCollider(c: ColliderItem) {
    if (!c) return;
    const r = Math.max(c.r || 0, 1);
    const minCx = Math.floor((c.x - r) / COLLIDER_CELL_SIZE);
    const maxCx = Math.floor((c.x + r) / COLLIDER_CELL_SIZE);
    const minCz = Math.floor((c.z - r) / COLLIDER_CELL_SIZE);
    const maxCz = Math.floor((c.z + r) / COLLIDER_CELL_SIZE);
    for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
            const key = _cellKey(cx, cz);
            let bucket = _colliderGrid.get(key);
            if (!bucket) {
                bucket = [];
                _colliderGrid.set(key, bucket);
            }
            bucket.push(c);
        }
    }
}

export function queryNearbyColliders(x: number, z: number, radius: number, outList: ColliderItem[] = []): ColliderItem[] {
    if (_indexedColliderCount > worldColliders.length) {
        _colliderGrid.clear();
        _indexedColliderCount = 0;
    }
    while (_indexedColliderCount < worldColliders.length) {
        _indexCollider(worldColliders[_indexedColliderCount++]);
    }
    outList.length = 0;
    _colliderQueryStamp++;
    const pad = radius + 24;
    const minCx = Math.floor((x - pad) / COLLIDER_CELL_SIZE);
    const maxCx = Math.floor((x + pad) / COLLIDER_CELL_SIZE);
    const minCz = Math.floor((z - pad) / COLLIDER_CELL_SIZE);
    const maxCz = Math.floor((z + pad) / COLLIDER_CELL_SIZE);
    for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
            const bucket = _colliderGrid.get(_cellKey(cx, cz));
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
                const c = bucket[i];
                if (c._qStamp === _colliderQueryStamp || c.destroyed || c.r <= 0) continue;
                c._qStamp = _colliderQueryStamp;
                outList.push(c);
            }
        }
    }
    return outList;
}
export const cullableWorldObjects: CullableEntry[] = []; // Viewport & Distance Frustum Culling Registry
export const humanNPCs: HumanNPCEntry[] = [];
export const vehicleNPCs: VehicleNPCEntry[] = [];
export { botRigs } from '../bots/botRigs.js';

export function registerCullableObject(obj: THREE.Object3D, x: number, y: number, z: number, radius = 28) {
    obj.userData.cullCenter = new THREE.Vector3(x, y, z);
    obj.userData.cullRadius = radius;
    cullableWorldObjects.push({ obj, x, y, z, radius });
}

export const stateHolder: { ferryController: { currentPos: THREE.Vector3; currentRotY: number; state: string } | null } = {
    ferryController: null
};

export const botPhraseCounters: Record<string, number> = {
    BOULDER: 0,
    HEATWAVE: 0,
    CHASE: 0,
    BLADES: 0,
    OPTIMUS: 0,
    BUMBLEBEE: 0,
    BLURR: 0,
    SALVAGE: 0,
    HIGHTIDE: 0,
    QUICKSHADOW: 0,
    STARSPEED: 0
};

if (typeof window !== 'undefined') {
    window.player = player;
    window.buddyBot = buddyBot;
    window.worldState = worldState;
    window.input = input;
    window.ramps = ramps;
    window.worldColliders = worldColliders;
    window.queryNearbyColliders = queryNearbyColliders;
    window.cullableWorldObjects = cullableWorldObjects;
    window.humanNPCs = humanNPCs;
    window.vehicleNPCs = vehicleNPCs;
    window.registerCullableObject = registerCullableObject;
    window.botPhraseCounters = botPhraseCounters;
}

// Global Game State Singletons
import * as THREE from 'three';

export const player: Record<string, any> = {
    botType: 'BOULDER',
    mode: 'BOT',          // 'BOT', 'VEHICLE', or 'DINO'
    morph: 0,             // Vehicle morph (0 -> 1)
    targetMorph: 0,
    dinoMorph: 0,         // Dinobot morph (0 -> 1)
    targetDinoMorph: 0,
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
    trailerAngle: 0,
    trailerArticAngle: 0
};

export const buddyBot: Record<string, any> = {
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
    walkCycle: 0,
    smashTimer: 0,
    scoopTimer: 0,
    waterTimer: 0,
    actionCooldown: 0,
    inCarWash: false,
    trailerAngle: 0,
    trailerArticAngle: 0
};

export const input: Record<string, any> = {
    keys: {},
    camYaw: 0,
    camPitch: 0.48,
    camZoomMode: 0,
    autoCam: true
};

export const ramps: any[] = [];

export const worldColliders: any[] = [];
export const cullableWorldObjects: any[] = []; // Viewport & Distance Frustum Culling Registry
export const humanNPCs: any[] = [];
export const vehicleNPCs: any[] = [];
export { botRigs } from '../bots/botRigs.js';

export function registerCullableObject(obj, x, y, z, radius = 28) {
    obj.userData.cullCenter = new THREE.Vector3(x, y, z);
    obj.userData.cullRadius = radius;
    cullableWorldObjects.push({ obj, x, y, z, radius });
}

export const stateHolder = {
    ferryController: null
};

export const botPhraseCounters = {
    BOULDER: 0,
    HEATWAVE: 0,
    CHASE: 0,
    BLADES: 0,
    OPTIMUS: 0,
    BUMBLEBEE: 0,
    BLURR: 0,
    SALVAGE: 0,
    HIGHTIDE: 0,
    QUICKSHADOW: 0
};

if (typeof window !== 'undefined') {
    window.player = player;
    window.buddyBot = buddyBot;
    window.input = input;
    window.ramps = ramps;
    window.worldColliders = worldColliders;
    window.cullableWorldObjects = cullableWorldObjects;
    window.humanNPCs = humanNPCs;
    window.vehicleNPCs = vehicleNPCs;
    window.registerCullableObject = registerCullableObject;
    window.botPhraseCounters = botPhraseCounters;
}

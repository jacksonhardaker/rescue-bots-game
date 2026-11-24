// Global TypeScript declarations for Rescue Bots 3D (Zero `any`!)
import * as THREE from 'three';
import type {
    BotRig, PlayerState, BuddyBotState, InputState, ProgressionState,
    ColliderItem, BotMetaEntry, GroundOffsetEntry, WorldState
} from './game.js';

type ToonMat = THREE.MeshToonMaterial;
type BasicMat = THREE.MeshBasicMaterial;
type Mat = THREE.Material;

declare global {
  interface Window {
    // Core singletons & rendering
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    player?: PlayerState;
    buddyBot?: BuddyBotState;
    botRigs?: Record<string, BotRig>;
    input?: InputState;
    worldState?: WorldState;
    progression?: ProgressionState;
    BOT_METADATA?: Record<string, BotMetaEntry>;
    BOT_GROUND_OFFSETS?: Record<string, GroundOffsetEntry>;
    SVG_ICONS?: Record<string, string>;
    waypointGroup?: THREE.Group | null;
    lastTacticalMapToggleTime?: number;
    _endlessWaveTimeout?: ReturnType<typeof setTimeout>;

    // Dynamic cross-module hooks exposed on window
    renderMinimap?: () => void;
    renderTacticalMap?: () => void;
    openTacticalMap?: () => void;
    closeTacticalMap?: () => void;
    isBotDocked?: (botType: string) => boolean;
    getSpaceMapData?: () => {
      sectorId?: string;
      sectorMoons?: Array<{
        id: string;
        name: string;
        pos: THREE.Vector3;
        landingPos: THREE.Vector3;
        radius: number;
        landablePlanetId: string | null;
        beaconRing: THREE.Mesh | null;
      }>;
      bounds: number;
      ship: { pos: THREE.Vector3; yaw: number; activeRingIdx: number; waypoint: THREE.Vector3; hasWaypoint: boolean };
      moonPos: THREE.Vector3;
      moonLandingPos?: THREE.Vector3;
      saturnRaceGatePos?: THREE.Vector3 | null;
      stationPos: THREE.Vector3;
      moroccoStation?: { pos: THREE.Vector3; hp: number; maxHp: number; defeated: boolean };
      asteroids?: Array<{ alive: boolean; pos: THREE.Vector3 }>;
      satellites?: Array<{ name: string; pos: THREE.Vector3; repaired: boolean }>;
      pods?: Array<{ name: string; pos: THREE.Vector3; rescued: boolean }>;
      starRings?: Array<{ pos: THREE.Vector3 }>;
    };
    getUnderwaterMapData?: () => {
      radius: number;
      surfaceY: number;
      subPos: THREE.Vector3;
      subHeading: number;
      landmarks: Array<{ id: string; name: string; x: number; y: number; z: number; discovered: boolean; color: string }>;
      relics: Array<{ id: string; name: string; x: number; y: number; z: number; collected: boolean }>;
      crystals: Array<{ x: number; y: number; z: number; collected: boolean }>;
      rings: Array<{ x: number; y: number; z: number }>;
      activeRingIdx: number;
      moroccoBuoy: { x: number; y: number; z: number; disabled: boolean };
    };
    setUnderwaterWaypointWorld?: (wx: number, wy: number, wz: number) => void;
    getMoonMapData?: () => {
      radius: number;
      sigmaPos: { x: number; z: number };
      roverPos?: { x: number; z: number };
      craters?: Array<{ x: number; z: number; r: number }>;
      jumpPads?: Array<{ x: number; z: number }>;
      relics?: Array<{ x: number; z: number; name: string; collected: boolean }>;
    };
    getPlanetSurfaceMapData?: () => {
      config: { id: string; name: string; zoneLabel: string; gravityLabel: string; groundBaseHex: string; groundAccentHex: string };
      radius: number;
      sigmaPos: { x: number; z: number };
      craters?: Array<{ x: number; z: number; r: number }>;
      relics?: Array<{ x: number; z: number; name: string; collected: boolean }>;
      vents?: Array<{ x: number; z: number; label: string }>;
      frozenStarspeed?: { x: number; z: number } | null;
    };
    getSaturnRaceMapData?: () => {
      trackRadius: number;
      angle: number;
      radialOffset: number;
      nextGateIdx: number;
      gates?: Array<{ angle: number }>;
      rivals?: Array<{ angle: number; colorHex: string; botType: string }>;
    };
    setSpaceWaypointWorld?: (wx: number, wy: number, wz: number) => void;
    webkitAudioContext?: typeof AudioContext;
    [key: string]: unknown;
  }

  var scene: THREE.Scene;
  var camera: THREE.PerspectiveCamera;
  var renderer: THREE.WebGLRenderer;
  var player: PlayerState;
  var buddyBot: BuddyBotState;
  var botRigs: Record<string, BotRig>;
  var input: InputState;
  var progression: ProgressionState;

  var toonGrad3: THREE.DataTexture;
  var toonGrad4: THREE.DataTexture;
  var toonGradGlossy: THREE.DataTexture;
  var matInkOutline: BasicMat;
  var matInkEdgeLine: THREE.LineBasicMaterial;
  var applyCartoonInkOutlines: (root: THREE.Object3D, scale?: number, useEdges?: boolean) => void;
  var matBrickRed: ToonMat;
  var matSteel: ToonMat;
  var matDarkSteel: ToonMat;
  var matChrome: ToonMat;
  var matGlass: ToonMat;
  var matGrille: ToonMat;
  var matTire: ToonMat;
  var matCabGlass: ToonMat;
  var matVisorCyan: BasicMat;
  var matVisorGold: BasicMat;
  var matSirenRed: BasicMat;
  var matSirenBlue: BasicMat;
  var matEmblem: Mat;
  var matHazardMat: Mat;
  var matHazardYellow: ToonMat;

  var matOptimusRed: ToonMat;
  var matOptimusBlue: ToonMat;
  var matOptimusGold: ToonMat;
  var matOptimusFace: Mat;

  var matBeeYellow: ToonMat;
  var matBeeBlack: ToonMat;
  var matBeeGrey: ToonMat;
  var matBeeFace: Mat;
  var matBeeChest: Mat;
  var matBeeWing: Mat;
  var matBeeShin: Mat;
  var matBeeWheel: Mat;
  var matBeeGlowCyan: BasicMat;

  var matBlurrPurple: ToonMat;
  var matBlurrViolet: ToonMat;
  var matBlurrWhite: ToonMat;
  var matBlurrNeonGreen: ToonMat;
  var matBlurrCyan: ToonMat;
  var matBlurrCyanGlow: BasicMat;
  var matBlurrBlack: ToonMat;
  var matBlurrSteel: ToonMat;
  var matBlurrFace: Mat;
  var matBlurrChest: Mat;
  var matBlurrShoulder: Mat;
  var matBlurrShin: Mat;
  var matBlurrTurbine: Mat;

  var matSalvageLime: ToonMat;
  var matSalvageBlue: ToonMat;
  var matSalvageOrange: ToonMat;
  var matSalvageSteel: ToonMat;
  var matSalvageLightSteel: ToonMat;
  var matSalvageAqua: ToonMat;
  var matAqua: ToonMat;
  var matSalvageRecycle: Mat;
  var matSalvageFace: Mat;

  var matHighTideNavy: ToonMat;
  var matHighTideBlue: ToonMat;
  var matHighTideWhite: ToonMat;
  var matHighTideGold: ToonMat;
  var matHighTideDark: ToonMat;
  var matHighTideCanopy: ToonMat;
  var matHighTideCyanGlow: BasicMat;
  var matHighTideLamp: BasicMat;
  var matHighTideFace: Mat;
  var matHighTideChest: Mat;
  var matHighTideShoulder: Mat;

  var matMegaHullWhite: ToonMat;
  var matMegaDeckRed: ToonMat;
  var matMegaCraneYellow: ToonMat;
  var matMegaClawCharcoal: ToonMat;
  var matMegaScreenCyan: BasicMat;
  var matMegaWindowBlue: ToonMat;
  var matMegaKneeGold: ToonMat;
  var matMegaKneeLens: BasicMat;
  var matMegaShoulderChevron: Mat;
  var matMegaHullBadge: Mat;
  var matMegaTrailerSilver: ToonMat;
  var matMegaTrailerStripe: ToonMat;
  var matEnergonAxeCyan: ToonMat;
  var matEnergonAxeGlow: BasicMat;

  var matQuickWhite: ToonMat;
  var matQuickCyan: ToonMat;
  var matQuickDark: ToonMat;
  var matQuickSilver: ToonMat;
  var matQuickFace: Mat;
  var matQuickChest: Mat;
  var matQuickVisor: BasicMat;
  var matQuickCyanGlow: BasicMat;
  var matQuickLightSteel: ToonMat;

  var matMorBotBlack: ToonMat;
  var matMorBotCrimson: ToonMat;
  var matMorBotDarkCrimson: ToonMat;
  var matMorBotDarkSteel: ToonMat;
  var matMorBotSilver: ToonMat;
  var matMorBotRedGlow: BasicMat;
  var matMorBotCore: BasicMat;
  var matMoroccoPurple: ToonMat;
  var matMoroccoPurpleGlow: BasicMat;
  var matMoroccoPurpleDark: ToonMat;
  var matMoroccoGold: ToonMat;
  var matMorBotGoldGlow: BasicMat;
  var matMorBotGoldDark: ToonMat;
  var matMorBotCyanVisor: BasicMat;
  var matBlimpGreen: ToonMat;
  var matBlimpGreenDark: ToonMat;
  var matBlimpGondolaYellow: ToonMat;
  var matBlimpGondolaWood: ToonMat;
  var matBlimpWindowBlue: ToonMat;
  var matBlimpCable: ToonMat;
  var matMoroccoSkin: ToonMat;
  var matMoroccoMustache: ToonMat;

  var isPointOnRoad: (x: number, z: number) => boolean;
  var isInsideAnyPlaza: (x: number, z: number) => boolean;
  var worldColliders: ColliderItem[];
  var spawnBurstParticles: (x: number, y: number, z: number, colorHex: number, count?: number, speed?: number) => void;
  var getSurfaceHeight: (x: number, z: number) => number;
  var getTerrainHeight: (x: number, z: number) => number;
  var highTideWorldShip: THREE.Object3D | null;
  var optimusWorldTrailer: THREE.Object3D | null;
  var setHighTideRigMega: (rig: BotRig, isMega: boolean) => void;
  var setOptimusRigMega: (rig: BotRig, isMega: boolean) => void;
  var setBotRigMega: (rig: BotRig, isMega: boolean) => void;
  var dockHighTideMegabot: () => void;
  var undockHighTideMegabot: () => void;
  var dockOptimusMegabot: () => void;
  var undockOptimusMegabot: () => void;
  var dockBotMegabot: (botType: string) => void;
  var undockBotMegabot: (botType: string) => void;
  var dockActiveBotMegabot: () => void;
  var undockActiveBotMegabot: () => void;
  var WORLD_MEGA_ATTACHMENTS: Record<string, THREE.Object3D | null>;
  var WORLD_MEGA_LOCATIONS: Record<string, { x: number; z: number; rotY: number }>;
}

export {};

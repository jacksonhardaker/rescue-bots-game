// Global TypeScript declarations for Rescue Bots 3D
import * as THREE from 'three';

declare global {
  interface Window {
    [key: string]: any;
  }
  // Loose DOM typing: the game manipulates DOM nodes dynamically via ids/datasets
  interface Element { [key: string]: any; }
  interface EventTarget { [key: string]: any; }
  interface TouchEvent { [key: string]: any; }

  var scene: any;
  var camera: any;
  var renderer: any;
  var player: any;
  var buddyBot: any;
  var botRigs: any;
  var input: any;
  var sfx: any;
  var gameSettings: any;
  var progression: any;

  var toonGrad3: any;
  var toonGrad4: any;
  var toonGradGlossy: any;
  var matInkOutline: any;
  var matInkEdgeLine: any;
  var applyCartoonInkOutlines: any;
  var matBrickRed: any;
  var matSteel: any;
  var matDarkSteel: any;
  var matChrome: any;
  var matGlass: any;
  var matGrille: any;
  var matTire: any;
  var matCabGlass: any;
  var matVisorCyan: any;
  var matVisorGold: any;
  var matSirenRed: any;
  var matSirenBlue: any;
  var matEmblem: any;
  var matHazardMat: any;
  var matHazardYellow: any;

  var matOptimusRed: any;
  var matOptimusBlue: any;
  var matOptimusGold: any;
  var matOptimusFace: any;

  var matBeeYellow: any;
  var matBeeBlack: any;
  var matBeeGrey: any;
  var matBeeFace: any;
  var matBeeChest: any;
  var matBeeWing: any;
  var matBeeShin: any;
  var matBeeWheel: any;
  var matBeeGlowCyan: any;

  var matBlurrPurple: any;
  var matBlurrViolet: any;
  var matBlurrWhite: any;
  var matBlurrNeonGreen: any;
  var matBlurrCyan: any;
  var matBlurrCyanGlow: any;
  var matBlurrBlack: any;
  var matBlurrSteel: any;
  var matBlurrFace: any;
  var matBlurrChest: any;
  var matBlurrShoulder: any;
  var matBlurrShin: any;
  var matBlurrTurbine: any;

  var matSalvageLime: any;
  var matSalvageBlue: any;
  var matSalvageOrange: any;
  var matSalvageSteel: any;
  var matSalvageLightSteel: any;
  var matSalvageAqua: any;
  var matAqua: any;
  var matSalvageRecycle: any;
  var matSalvageFace: any;

  var matHighTideNavy: any;
  var matHighTideBlue: any;
  var matHighTideWhite: any;
  var matHighTideGold: any;
  var matHighTideDark: any;
  var matHighTideCanopy: any;
  var matHighTideCyanGlow: any;
  var matHighTideLamp: any;
  var matHighTideFace: any;
  var matHighTideChest: any;
  var matHighTideShoulder: any;

  var matMegaHullWhite: any;
  var matMegaDeckRed: any;
  var matMegaCraneYellow: any;
  var matMegaClawCharcoal: any;
  var matMegaScreenCyan: any;
  var matMegaWindowBlue: any;
  var matMegaKneeGold: any;
  var matMegaKneeLens: any;
  var matMegaShoulderChevron: any;
  var matMegaHullBadge: any;

  var matQuickWhite: any;
  var matQuickCyan: any;
  var matQuickDark: any;
  var matQuickSilver: any;
  var matQuickFace: any;
  var matQuickChest: any;
  var matQuickVisor: any;
  var matQuickCyanGlow: any;
  var matQuickLightSteel: any;

  var matMorBotBlack: any;
  var matMorBotCrimson: any;
  var matMorBotDarkCrimson: any;
  var matMorBotDarkSteel: any;
  var matMorBotSilver: any;
  var matMorBotRedGlow: any;
  var matMorBotCore: any;
  var matMoroccoPurple: any;
  var matMoroccoPurpleGlow: any;
  var matMoroccoPurpleDark: any;
  var matMoroccoGold: any;
  var matMorBotGoldGlow: any;
  var matMorBotGoldDark: any;
  var matMorBotCyanVisor: any;
  var matBlimpGreen: any;
  var matBlimpGreenDark: any;
  var matBlimpGondolaYellow: any;
  var matBlimpGondolaWood: any;
  var matBlimpWindowBlue: any;
  var matBlimpCable: any;
  var matMoroccoSkin: any;
  var matMoroccoMustache: any;

  var isPointOnRoad: any;
  var isInsideAnyPlaza: any;
  var worldColliders: any;
  var spawnBurstParticles: any;
  var clearHazardNode: any;
  var registerCullableObject: any;
  var getSurfaceHeight: any;
  var getTerrainHeight: any;
}

declare module 'three' {
  interface Object3D {
    [key: string]: any;
  }
  interface Material {
    [key: string]: any;
  }
  interface BufferGeometry {
    [key: string]: any;
  }
  interface Color {
    [key: string]: any;
  }
  interface Texture {
    [key: string]: any;
  }
}

export {};

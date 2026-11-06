// Cel-Shading Stepped Gradient Maps & Cartoon Ink Outlines
import * as THREE from "three";
import {
    texGrille, texHazard, texEmblem, texWindshieldCyan,
    texFaceOptimus, texFaceBumblebee, texBeeChest, texBeeWing, texBeeShin, texBeeWheel,
    texFaceBlurr, texBlurrChest, texBlurrShoulder, texBlurrShin, texBlurrTurbine,
    texFaceSalvage, texSalvageChest, texFaceHighTide, texChestHighTide, texShoulderHighTide,
    texMegaBotChest, texMegaShoulderChevron, texMegaShipHull,
    texFaceQuickshadow, texChestQuickshadow
} from "./textures.js";

// Crisp 3-band & 4-band Stepped Toon Gradient Textures (NearestFilter for hard cel-shaded steps)
export function createToonGradientMap(steps = [95, 195, 255]) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = steps.length;
    c.height = 1;
    const ctx = c.getContext('2d');
    steps.forEach((val, i) => {
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(i, 0, 1, 1);
    });
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
}

export const toonGrad3 = createToonGradientMap([110, 205, 255]);
export const toonGrad4 = createToonGradientMap([88, 158, 222, 255]);
export const toonGradGlossy = createToonGradientMap([105, 185, 225, 255]);

export const matInkOutline = new THREE.MeshBasicMaterial({
    color: 0x0b0f19,
    side: THREE.BackSide
});
export const matInkEdgeLine = new THREE.LineBasicMaterial({
    color: 0x0b0f19,
    linewidth: 2
});

// Helper to apply Saturday-Morning Cartoon Ink Outlines + Panel Crease Lines to a 3D hierarchy
export function applyCartoonInkOutlines(rootObj, scaleThickness = 1.055, addCreaseLines = true) {
    const meshes = [];
    rootObj.traverse(child => {
        if (child.isMesh && !child.userData.isOutline && !child.userData.noOutline) {
            meshes.push(child);
        }
    });

    meshes.forEach(mesh => {
        // 1. Inverted-Hull Black Ink Silhouette
        const outlineMesh = new THREE.Mesh(mesh.geometry, matInkOutline);
        outlineMesh.userData.isOutline = true;
        outlineMesh.scale.setScalar(scaleThickness);
        mesh.add(outlineMesh);

        // 2. Crisp Black Comic Edge Creases on Box/Cylinder Panels
        if (addCreaseLines && mesh.geometry) {
            const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 32);
            const line = new THREE.LineSegments(edgesGeo, matInkEdgeLine);
            line.userData.isOutline = true;
            mesh.add(line);
        }
    });
}

// Common Shared Materials
export const matBrickRed = new THREE.MeshToonMaterial({ color: 0xe81e25, gradientMap: toonGrad3 });
export const matSteel = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad4 });
export const matDarkSteel = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
export const matChrome = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGradGlossy });
export const matGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });

export const matGrille = new THREE.MeshBasicMaterial({ map: texGrille });
export const matTire = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
export const matCabGlass = new THREE.MeshBasicMaterial({ map: texWindshieldCyan });
export const matVisorCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
export const matVisorGold = new THREE.MeshBasicMaterial({ color: 0xffd60a });
export const matSirenRed = new THREE.MeshBasicMaterial({ color: 0xff1133 });
export const matSirenBlue = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
export const matEmblem = new THREE.MeshBasicMaterial({ map: texEmblem });
export const matHazardMat = new THREE.MeshBasicMaterial({ map: texHazard });
export const matHazardYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });

// Visiting Autobots & Allies Materials
export const matOptimusRed = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
export const matOptimusBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
export const matOptimusGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
export const matOptimusFace = new THREE.MeshBasicMaterial({ map: texFaceOptimus });

export const matBeeYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad4 });
export const matBeeBlack = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
export const matBeeGrey = new THREE.MeshToonMaterial({ color: 0xcbd5e1, gradientMap: toonGrad3 });
export const matBeeFace = new THREE.MeshBasicMaterial({ map: texFaceBumblebee });
export const matBeeChest = new THREE.MeshBasicMaterial({ map: texBeeChest });
export const matBeeWing = new THREE.MeshBasicMaterial({ map: texBeeWing });
export const matBeeShin = new THREE.MeshBasicMaterial({ map: texBeeShin });
export const matBeeWheel = new THREE.MeshBasicMaterial({ map: texBeeWheel });
export const matBeeGlowCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

export const matBlurrPurple = new THREE.MeshToonMaterial({ color: 0x7c3aed, gradientMap: toonGrad4 });
export const matBlurrViolet = new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGrad4 });
export const matBlurrWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
export const matBlurrNeonGreen = new THREE.MeshToonMaterial({ color: 0x22c55e, gradientMap: toonGrad3 });
export const matBlurrCyan = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
export const matBlurrCyanGlow = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
export const matBlurrBlack = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
export const matBlurrSteel = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
export const matBlurrFace = new THREE.MeshBasicMaterial({ map: texFaceBlurr });
export const matBlurrChest = new THREE.MeshBasicMaterial({ map: texBlurrChest });
export const matBlurrShoulder = new THREE.MeshBasicMaterial({ map: texBlurrShoulder });
export const matBlurrShin = new THREE.MeshBasicMaterial({ map: texBlurrShin });
export const matBlurrTurbine = new THREE.MeshBasicMaterial({ map: texBlurrTurbine });

export const matSalvageLime = new THREE.MeshToonMaterial({ color: 0xcbf827, gradientMap: toonGrad4 });
export const matSalvageBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
export const matSalvageOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad4 });
export const matSalvageSteel = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
export const matSalvageLightSteel = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
export const matSalvageAqua = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
export const matAqua = matSalvageAqua;
export const matSalvageRecycle = new THREE.MeshBasicMaterial({ map: texSalvageChest });
export const matSalvageFace = new THREE.MeshBasicMaterial({ map: texFaceSalvage });

export const matHighTideNavy = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad4 });
export const matHighTideBlue = new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad4 });
export const matHighTideWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
export const matHighTideGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
export const matHighTideDark = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
export const matHighTideCanopy = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
export const matHighTideCyanGlow = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
export const matHighTideLamp = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
export const matHighTideFace = new THREE.MeshBasicMaterial({ map: texFaceHighTide });
export const matHighTideChest = new THREE.MeshBasicMaterial({ map: texChestHighTide });
export const matHighTideShoulder = new THREE.MeshBasicMaterial({ map: texShoulderHighTide });

// High Tide Megabot Exo-Armor & Cybertronian Naval Ship Materials
export const matMegaHullWhite = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad4 });
export const matMegaDeckRed = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
export const matMegaCraneYellow = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: toonGrad3 });
export const matMegaClawCharcoal = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
export const matMegaScreenCyan = new THREE.MeshBasicMaterial({ map: texMegaBotChest });
export const matMegaWindowBlue = new THREE.MeshToonMaterial({ color: 0x38bdf8, gradientMap: toonGrad3 });
export const matMegaKneeGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
export const matMegaKneeLens = new THREE.MeshToonMaterial({ color: 0x06b6d4, gradientMap: toonGrad3 });
export const matMegaShoulderChevron = new THREE.MeshBasicMaterial({ map: texMegaShoulderChevron });
export const matMegaHullBadge = new THREE.MeshBasicMaterial({ map: texMegaShipHull });

// Optimus Prime Mega Apex Rig & Command Trailer Materials
export const matMegaTrailerSilver = new THREE.MeshToonMaterial({ color: 0xe2e8f0, gradientMap: toonGrad4 });
export const matMegaTrailerStripe = new THREE.MeshToonMaterial({ color: 0x2563eb, gradientMap: toonGrad3 });
export const matEnergonAxeCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
export const matEnergonAxeGlow = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });

export const matQuickWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad4 });
export const matQuickCyan = new THREE.MeshToonMaterial({ color: 0x0284c7, gradientMap: toonGrad4 });
export const matQuickDark = new THREE.MeshToonMaterial({ color: 0x0f172a, gradientMap: toonGrad3 });
export const matQuickSilver = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
export const matQuickFace = new THREE.MeshBasicMaterial({ map: texFaceQuickshadow });
export const matQuickChest = new THREE.MeshBasicMaterial({ map: texChestQuickshadow });
export const matQuickVisor = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
export const matQuickCyanGlow = matQuickVisor;
export const matQuickLightSteel = new THREE.MeshToonMaterial({ color: 0xcbd5e1, gradientMap: toonGrad3 });

// Dr. Morocco & MorBot Villain Materials
export const matMorBotBlack = new THREE.MeshToonMaterial({ color: 0x09090b, gradientMap: toonGrad4 });
export const matMorBotCrimson = new THREE.MeshToonMaterial({ color: 0xdc2626, gradientMap: toonGrad4 });
export const matMorBotDarkCrimson = new THREE.MeshToonMaterial({ color: 0x7f1d1d, gradientMap: toonGrad4 });
export const matMorBotDarkSteel = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
export const matMorBotSilver = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
export const matMorBotRedGlow = new THREE.MeshBasicMaterial({ color: 0xff1111 });
export const matMorBotCore = new THREE.MeshBasicMaterial({ color: 0x22c55e });
export const matMoroccoPurple = new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGrad4 });
export const matMoroccoPurpleGlow = new THREE.MeshBasicMaterial({ color: 0xc084fc });
export const matMoroccoPurpleDark = new THREE.MeshToonMaterial({ color: 0x3b0764, gradientMap: toonGrad4 });
export const matMoroccoGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
export const matMorBotGoldGlow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
export const matMorBotGoldDark = new THREE.MeshToonMaterial({ color: 0xb45309, gradientMap: toonGrad3 });
export const matMorBotCyanVisor = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

// Dr. Morocco Steampunk Blimp Lair Materials
export const matBlimpGreen = new THREE.MeshToonMaterial({ color: 0x759352, gradientMap: toonGrad4 });
export const matBlimpGreenDark = new THREE.MeshToonMaterial({ color: 0x556e3b, gradientMap: toonGrad4 });
export const matBlimpGondolaYellow = new THREE.MeshToonMaterial({ color: 0xdeb841, gradientMap: toonGrad3 });
export const matBlimpGondolaWood = new THREE.MeshToonMaterial({ color: 0x5c3a21, gradientMap: toonGrad3 });
export const matBlimpWindowBlue = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
export const matBlimpCable = new THREE.MeshToonMaterial({ color: 0x27272a, gradientMap: toonGrad3 });
export const matMoroccoSkin = new THREE.MeshToonMaterial({ color: 0xfbcfe8, gradientMap: toonGrad3 });
export const matMoroccoMustache = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });

// NPC & Train Vehicle Headlight & Taillight Materials
export const matNPCHeadlightOn = new THREE.MeshBasicMaterial({ color: 0xfff08a });
export const matNPCHeadlightOff = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
export const matNPCTaillightOn = new THREE.MeshBasicMaterial({ color: 0xff1744 });
export const matNPCTaillightOff = new THREE.MeshToonMaterial({ color: 0x881337, gradientMap: toonGrad3 });
export const matNPCBeam = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false
});
export const matNPCBeamPool = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false
});

// Attach all materials to window for interoperability
if (typeof window !== 'undefined') {
    Object.assign(window, {
        toonGrad3, toonGrad4, toonGradGlossy,
        matInkOutline, matInkEdgeLine, applyCartoonInkOutlines,
        matBrickRed, matSteel, matDarkSteel, matChrome, matGlass,
        matGrille, matTire, matCabGlass, matVisorCyan, matVisorGold,
        matSirenRed, matSirenBlue, matEmblem, matHazardMat, matHazardYellow,
        matOptimusRed, matOptimusBlue, matOptimusGold, matOptimusFace,
        matBeeYellow, matBeeBlack, matBeeGrey, matBeeFace, matBeeChest, matBeeWing, matBeeShin, matBeeWheel, matBeeGlowCyan,
        matBlurrPurple, matBlurrViolet, matBlurrWhite, matBlurrNeonGreen, matBlurrCyan, matBlurrCyanGlow, matBlurrBlack, matBlurrSteel, matBlurrFace, matBlurrChest, matBlurrShoulder, matBlurrShin, matBlurrTurbine,
        matSalvageLime, matSalvageBlue, matSalvageOrange, matSalvageSteel, matSalvageLightSteel, matSalvageAqua, matAqua, matSalvageRecycle, matSalvageFace,
        matHighTideNavy, matHighTideBlue, matHighTideWhite, matHighTideGold, matHighTideDark, matHighTideCanopy, matHighTideCyanGlow, matHighTideLamp, matHighTideFace, matHighTideChest, matHighTideShoulder,
        matMegaHullWhite, matMegaDeckRed, matMegaCraneYellow, matMegaClawCharcoal, matMegaScreenCyan, matMegaWindowBlue, matMegaKneeGold, matMegaKneeLens, matMegaShoulderChevron, matMegaHullBadge,
        matMegaTrailerSilver, matMegaTrailerStripe, matEnergonAxeCyan, matEnergonAxeGlow,
        matQuickWhite, matQuickCyan, matQuickDark, matQuickSilver, matQuickFace, matQuickChest, matQuickVisor, matQuickCyanGlow, matQuickLightSteel,
        matMorBotBlack, matMorBotCrimson, matMorBotDarkCrimson, matMorBotDarkSteel, matMorBotSilver, matMorBotRedGlow, matMorBotCore,
        matMoroccoPurple, matMoroccoPurpleGlow, matMoroccoPurpleDark, matMoroccoGold, matMorBotGoldGlow, matMorBotGoldDark, matMorBotCyanVisor,
        matBlimpGreen, matBlimpGreenDark, matBlimpGondolaYellow, matBlimpGondolaWood, matBlimpWindowBlue, matBlimpCable, matMoroccoSkin, matMoroccoMustache
    });
}

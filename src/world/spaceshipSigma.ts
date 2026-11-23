// High-Fidelity Crashed Rescue Starship "The Sigma" Diorama (Rescue Force Sigma-17)
import * as THREE from 'three';
import {
    toonGrad3, toonGrad4, matDarkSteel, matChrome, matHazardMat,
    matOptimusRed, matOptimusBlue, matOptimusGold, matEmblem,
    applyCartoonInkOutlines
} from '../rendering/materials.js';

export interface SigmaAnimatedEntry {
    obj: THREE.Object3D;
    kind: string;
    baseY: number;
    phase: number;
}

export interface SigmaColliderEntry {
    x: number;
    z: number;
    r: number;
}

export interface SigmaBuildOptions {
    originX?: number;
    originZ?: number;
    includeDiorama?: boolean;
    flatLevel?: boolean;
    rotationY?: number;
}

/**
 * Recomputes planar [0, 1] UVs across X/Z (or X/Y) bounds so textures map crisply
 * onto ExtrudeGeometry wings and hull plates instead of tiling in raw world units.
 */
function normalizePlanarUVs(
    geo: THREE.BufferGeometry,
    axisA: 'x' | 'y' | 'z',
    axisB: 'x' | 'y' | 'z',
    flipA = false
) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const minA = bb.min[axisA];
    const spanA = Math.max(0.001, bb.max[axisA] - minA);
    const minB = bb.min[axisB];
    const spanB = Math.max(0.001, bb.max[axisB] - minB);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
        const a = axisA === 'x' ? pos.getX(i) : (axisA === 'y' ? pos.getY(i) : pos.getZ(i));
        const b = axisB === 'x' ? pos.getX(i) : (axisB === 'y' ? pos.getY(i) : pos.getZ(i));
        const u = (a - minA) / spanA;
        uvs[i * 2] = flipA ? 1 - u : u;
        uvs[i * 2 + 1] = (b - minB) / spanB;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

function createSigmaHullTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;

    // Brushed titanium-white Cybertronian hull armor base
    ctx.fillStyle = '#e8eef5';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle tonal armor block variations
    const panels: Array<[number, number, number, number, string]> = [
        [0, 0, 256, 128, '#dce5ef'],
        [256, 128, 256, 128, '#d4dfe9'],
        [128, 256, 256, 128, '#dfe7f1'],
        [0, 384, 192, 128, '#cfdbe8']
    ];
    panels.forEach(([x, y, w, h, col]) => {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, w, h);
    });

    // Twin crimson & gold Rescue Force fuselage livery band
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 212, 512, 22);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 234, 512, 7);

    // Thin cyan Cybertronian Energon conduit trace
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(0, 245, 512, 4);

    // Panel grid seams & rivets
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    for (let y = 0; y <= 512; y += 128) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }
    for (let x = 0; x <= 512; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
    }

    // Diagonal armored bulkhead ribs & cooling louvers
    ctx.fillStyle = '#475569';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(28 + i * 16, 48, 9, 44);
        ctx.fillRect(300 + i * 16, 304, 9, 44);
    }

    // Subtle re-entry scorch streaks from the crash landing
    const scorch = ctx.createLinearGradient(0, 320, 140, 500);
    scorch.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    scorch.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = scorch;
    ctx.fillRect(0, 320, 220, 192);

    // Corner rivets
    ctx.fillStyle = '#64748b';
    for (let y = 12; y < 512; y += 128) {
        for (let x = 12; x < 512; x += 128) {
            ctx.fillRect(x, y, 5, 5);
            ctx.fillRect(x + 100, y, 5, 5);
            ctx.fillRect(x, y + 100, 5, 5);
        }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createSigmaCanopyTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;

    // Deep glossy amber-gold Cybertronian bridge glass gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(0.45, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Interior holographic tactical instrument shimmer
    ctx.fillStyle = 'rgba(56, 189, 248, 0.34)';
    ctx.fillRect(28, 160, 200, 38);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.beginPath();
    ctx.moveTo(22, 18);
    ctx.lineTo(136, 18);
    ctx.lineTo(74, 128);
    ctx.lineTo(18, 128);
    ctx.closePath();
    ctx.fill();

    // Heavy armored viewport mullions
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 246);
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.moveTo(0, 148);
    ctx.lineTo(256, 148);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(c);
    return tex;
}

function createSigmaWingMarkingTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 256, 256);

    // Light titanium inner wing panel field
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(34, 64, 178, 146);

    // Crisp gold-and-navy leading edge rescue stripes (v=1 -> canvas y=0)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 26, 256, 20);
    ctx.fillStyle = '#1e293b';
    for (let x = 0; x < 256; x += 36) {
        ctx.fillRect(x, 8, 18, 18);
    }

    // Wing flap seam & panel lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 64, 178, 146);
    ctx.beginPath();
    ctx.moveTo(34, 138);
    ctx.lineTo(212, 138);
    ctx.moveTo(124, 64);
    ctx.lineTo(124, 210);
    ctx.stroke();

    // Bold stencil lettering
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('SIGMA-17', 58, 114);

    const tex = new THREE.CanvasTexture(c);
    return tex;
}

export function buildCrashedSpaceshipSigma(
    cavernWorldGroup: THREE.Object3D,
    animatedMeshes: SigmaAnimatedEntry[],
    staticColliders?: SigmaColliderEntry[] | null,
    options: SigmaBuildOptions = {}
): THREE.Group {
    const originX = options.originX ?? -144;
    const originZ = options.originZ ?? -162;
    const includeDiorama = options.includeDiorama !== false;
    const flatLevel = Boolean(options.flatLevel);

    const sigmaRoot = new THREE.Group();
    sigmaRoot.position.set(originX, 0, originZ);

    const shipTex = createSigmaHullTexture();
    const canopyTex = createSigmaCanopyTexture();
    const wingTex = createSigmaWingMarkingTexture();

    const matHullArmor = new THREE.MeshToonMaterial({ color: 0xffffff, map: shipTex, gradientMap: toonGrad4 });
    const matHullWhite = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad4 });
    const matHullSlate = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });
    const matBellyCharcoal = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matWingLivery = new THREE.MeshToonMaterial({ color: 0xffffff, map: wingTex, gradientMap: toonGrad4 });
    const matCanopyGlass = new THREE.MeshBasicMaterial({ map: canopyTex });
    const matThrusterCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matConduitCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const matFloodLight = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const matBeaconRed = new THREE.MeshBasicMaterial({ color: 0xff2244 });
    const matBeaconGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const matStasisOrange = new THREE.MeshToonMaterial({ color: 0xf97316, gradientMap: toonGrad3 });
    const matStasisGreen = new THREE.MeshToonMaterial({ color: 0x84cc16, gradientMap: toonGrad3 });

    const shipGroup = new THREE.Group();
    shipGroup.position.set(0, flatLevel ? 3.4 : 2.2, 0);
    if (flatLevel) {
        shipGroup.rotation.set(0, 0, 0);
    } else {
        // Dramatic half-buried nose-down crash tilt facing South-East into the chamber
        shipGroup.rotation.set(0.20, 0.62, -0.26);
    }

    // -----------------------------------------------------------------
    // 1. SCULPTED CHINED FUSELAGE + ARMORED BELLY HEAT SHIELD
    // -----------------------------------------------------------------
    const hullProfile = new THREE.Shape();
    hullProfile.moveTo(-4.8, -1.3);
    hullProfile.lineTo(4.8, -1.3);
    hullProfile.lineTo(5.6, 0.4);
    hullProfile.lineTo(4.1, 2.5);
    hullProfile.lineTo(2.4, 3.05);
    hullProfile.lineTo(-2.4, 3.05);
    hullProfile.lineTo(-4.1, 2.5);
    hullProfile.lineTo(-5.6, 0.4);
    hullProfile.closePath();

    const fuselageGeo = new THREE.ExtrudeGeometry(hullProfile, {
        depth: 22.0,
        bevelEnabled: true,
        bevelThickness: 0.45,
        bevelSize: 0.42,
        bevelSegments: 2
    });
    fuselageGeo.translate(0, 0, -11.5);
    normalizePlanarUVs(fuselageGeo, 'z', 'y');
    const mainHull = new THREE.Mesh(fuselageGeo, matHullArmor);
    shipGroup.add(mainHull);

    // Ribbed Ventral Re-Entry Heat Shield Keel
    const bellyKeel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.35, 22.8), matBellyCharcoal);
    bellyKeel.position.set(0, -1.9, -0.5);
    shipGroup.add(bellyKeel);
    for (let rz = -9; rz <= 9; rz += 3.0) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.35, 0.9), matDarkSteel);
        rib.position.set(0, -2.55, rz);
        shipGroup.add(rib);
    }

    // Port & Starboard Armored Side Cheek Sponsons + Crimson Intake Scoops
    [-1, 1].forEach(side => {
        const sponson = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 16.5), matHullSlate);
        sponson.position.set(side * 5.75, 0.3, -1.2);
        shipGroup.add(sponson);

        const scoopCowl = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.35, 2.4), matOptimusRed);
        scoopCowl.position.set(side * 5.85, 0.4, 7.6);
        shipGroup.add(scoopCowl);

        const scoopGlow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.25), matConduitCyan);
        scoopGlow.position.set(side * 5.85, 0.4, 8.82);
        scoopGlow.userData.noOutline = true;
        shipGroup.add(scoopGlow);

        // Lateral Crimson Armor Collar Bands
        [-5.2, 1.8].forEach(bz => {
            const collar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.4, 2.0), matOptimusRed);
            collar.position.set(side * 6.85, 0.3, bz);
            shipGroup.add(collar);
        });
    });

    // -----------------------------------------------------------------
    // 2. SCULPTED ARMORED BOW PROW, SPLITTER & FORWARD FLOODLIGHTS
    // -----------------------------------------------------------------
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.1, 10.6);

    const bowUpper = new THREE.Mesh(
        new THREE.ConeGeometry(4.4, 8.8, 6).rotateY(Math.PI / 6).rotateX(Math.PI / 2),
        matOptimusRed
    );
    bowUpper.position.set(0, 0.45, 3.6);
    bowUpper.scale.set(1.18, 0.56, 1.0);
    bowGroup.add(bowUpper);

    // Lower Armored Chrome Bow Jaw Splitter
    const bowSplitter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.05, 5.2), matHullSlate);
    bowSplitter.position.set(0, -0.85, 2.2);
    bowSplitter.rotation.x = 0.08;
    bowGroup.add(bowSplitter);

    // Crimson Dorsal Nose Crest & Gold Cheek Vents
    const noseCrest = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.05, 7.2), matOptimusRed);
    noseCrest.position.set(0, 1.55, 2.4);
    noseCrest.rotation.x = 0.18;
    bowGroup.add(noseCrest);

    const forwardBadge = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 2.1), matEmblem);
    forwardBadge.position.set(0, 2.12, 1.6);
    forwardBadge.rotation.x = 0.18;
    forwardBadge.userData.noOutline = true;
    bowGroup.add(forwardBadge);

    [-2.5, 2.5].forEach(fx => {
        const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.78, 1.4, 8).rotateX(Math.PI / 2), matDarkSteel);
        lampHousing.position.set(fx, -0.1, 3.1);
        const lampLens = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.25, 8).rotateX(Math.PI / 2), matFloodLight);
        lampLens.position.set(fx, -0.1, 3.82);
        lampLens.userData.noOutline = true;
        bowGroup.add(lampHousing, lampLens);
    });
    shipGroup.add(bowGroup);

    // -----------------------------------------------------------------
    // 3. COMMAND BRIDGE SUPERSTRUCTURE, CANOPY & COMMS ARRAY
    // -----------------------------------------------------------------
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 3.15, 4.8);

    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.35, 8.2), matHullWhite);
    bridgeDeck.position.set(0, 0.45, -0.4);
    bridgeGroup.add(bridgeDeck);

    const bridgeArmorFrame = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.05, 5.2), matHullSlate);
    bridgeArmorFrame.position.set(0, 1.45, -0.6);
    bridgeGroup.add(bridgeArmorFrame);

    // Sloped Multi-Pane Amber Bridge Canopy Glass
    const mainCanopy = new THREE.Mesh(new THREE.BoxGeometry(5.1, 1.75, 4.4), matCanopyGlass);
    mainCanopy.position.set(0, 1.55, 1.15);
    mainCanopy.rotation.x = -0.34;
    mainCanopy.userData.noOutline = true;
    bridgeGroup.add(mainCanopy);

    // Side Glazed Cheek Viewports
    [-2.62, 2.62].forEach(cx => {
        const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.05, 3.4), matCanopyGlass);
        sideWin.position.set(cx, 1.5, -0.2);
        sideWin.userData.noOutline = true;
        bridgeGroup.add(sideWin);
    });

    // Armored Canopy Roof Visor Cap + Dorsal Deep-Space Sensor Array
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.55, 4.8), matOptimusRed);
    roofCap.position.set(0, 2.58, -1.0);
    bridgeGroup.add(roofCap);

    // Subspace Radar Dish & Comms Mast
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.2, 8), matChrome);
    radarMast.position.set(-1.3, 3.55, -1.8);
    const radarDish = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 0.35, 0.65, 12).rotateX(Math.PI * 0.38), matChrome);
    radarDish.position.set(-1.3, 4.65, -1.5);
    radarDish.rotation.z = 0.25;
    bridgeGroup.add(radarMast, radarDish);

    [0.9, 1.6].forEach((ax, idx) => {
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 3.2 - idx * 0.7, 6), matChrome);
        antenna.position.set(ax, 4.0 - idx * 0.3, -2.4);
        antenna.rotation.x = -0.22;
        bridgeGroup.add(antenna);
    });
    shipGroup.add(bridgeGroup);

    // -----------------------------------------------------------------
    // 4. DORSAL SPINE, OPEN STASIS POD BAY & RESCUE BOTS INSIGNIA
    // -----------------------------------------------------------------
    const dorsalDeck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.85, 10.6), matHullSlate);
    dorsalDeck.position.set(0, 3.25, -4.4);
    shipGroup.add(dorsalDeck);

    // Glowing Cyan Energon Dorsal Power Conduits
    [-3.1, 3.1].forEach(cx => {
        const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 12.0), matConduitCyan);
        conduit.position.set(cx, 3.45, -3.8);
        conduit.userData.noOutline = true;
        shipGroup.add(conduit);
    });

    // Recessed Open Dorsal Stasis Pod Bay (4 Rescue Bot Crew Pods Visible Inside!)
    const bayRecess = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 5.2), matBellyCharcoal);
    bayRecess.position.set(0, 3.42, -3.0);
    shipGroup.add(bayRecess);

    const podMaterials = [matOptimusRed, matOptimusBlue, matStasisGreen, matStasisOrange];
    const podOffsets: Array<[number, number]> = [[-1.1, -1.6], [1.1, -1.6], [-1.1, -4.4], [1.1, -4.4]];
    podOffsets.forEach(([px, pz], idx) => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 2.0, 10).rotateX(Math.PI / 2), podMaterials[idx]);
        pod.position.set(px, 3.85, pz);
        const podGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 1.1, 8).rotateX(Math.PI / 2), matThrusterCyan);
        podGlass.position.set(px, 4.05, pz);
        podGlass.userData.noOutline = true;
        shipGroup.add(pod, podGlass);
    });

    // Wedged-Ajar Bay Hatch Doors
    [-1, 1].forEach(side => {
        const hatch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 5.4), matHullWhite);
        hatch.position.set(side * 2.9, 4.15, -3.0);
        hatch.rotation.z = side * -0.78;
        shipGroup.add(hatch);
    });

    // -----------------------------------------------------------------
    // 5. CRASH-DAMAGED HULL BREACH WITH EXPOSED RIBS & SPARKING CONDUITS
    // -----------------------------------------------------------------
    const breachGroup = new THREE.Group();
    breachGroup.position.set(-4.95, 1.15, 2.0);

    const breachPit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.1, 5.8), matBellyCharcoal);
    breachGroup.add(breachPit);
    [-1.8, 0, 1.8].forEach(rz => {
        const frameRib = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.0, 0.38), matDarkSteel);
        frameRib.position.set(0.05, 0, rz);
        breachGroup.add(frameRib);
    });
    const brokenWire = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 4.8), matConduitCyan);
    brokenWire.position.set(-0.28, 0.25, 0);
    brokenWire.rotation.x = 0.25;
    brokenWire.userData.noOutline = true;
    breachGroup.add(brokenWire);

    const tornArmor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.85, 3.4), matOptimusGold);
    tornArmor.position.set(-0.75, -0.45, -1.6);
    tornArmor.rotation.set(0.28, -0.32, -0.42);
    breachGroup.add(tornArmor);
    shipGroup.add(breachGroup);

    // -----------------------------------------------------------------
    // 6. SCULPTED SWEPT AIRFOIL WINGS, FLAPS & WINGTIP STABILIZERS
    // -----------------------------------------------------------------
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 5.4);
    wingShape.lineTo(13.8, -1.8);
    wingShape.lineTo(13.8, -6.2);
    wingShape.lineTo(0, -4.6);
    wingShape.closePath();

    const rightWingGeo = new THREE.ExtrudeGeometry(wingShape, {
        depth: 0.72,
        bevelEnabled: true,
        bevelThickness: 0.22,
        bevelSize: 0.22,
        bevelSegments: 2
    });
    rightWingGeo.translate(0, 0, -0.36);
    rightWingGeo.rotateX(Math.PI / 2);
    normalizePlanarUVs(rightWingGeo, 'x', 'z', true);

    const wingPivots: THREE.Group[] = [];
    [-1, 1].forEach(side => {
        const wingPivot = new THREE.Group();
        wingPivot.position.set(side * 5.2, -0.25, -2.0);
        // Crash-bent starboard/port tilt difference (straightened when flatLevel or repaired)
        wingPivot.rotation.z = flatLevel ? 0 : (side === -1 ? -0.14 : -0.05);
        wingPivot.rotation.x = flatLevel ? 0 : (side === -1 ? 0.08 : 0.0);
        wingPivots.push(wingPivot);

        const wingGeo = side === 1 ? rightWingGeo : (() => {
            const mirrorShape = new THREE.Shape();
            mirrorShape.moveTo(0, 5.4);
            mirrorShape.lineTo(-13.8, -1.8);
            mirrorShape.lineTo(-13.8, -6.2);
            mirrorShape.lineTo(0, -4.6);
            mirrorShape.closePath();
            const g = new THREE.ExtrudeGeometry(mirrorShape, {
                depth: 0.72,
                bevelEnabled: true,
                bevelThickness: 0.22,
                bevelSize: 0.22,
                bevelSegments: 2
            });
            g.translate(0, 0, -0.36);
            g.rotateX(Math.PI / 2);
            normalizePlanarUVs(g, 'x', 'z', true);
            return g;
        })();

        const wingMesh = new THREE.Mesh(wingGeo, matWingLivery);
        wingPivot.add(wingMesh);

        // Underwing Structural Pylon & Thruster Pod
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.75, 2.2), matHullSlate);
        pylon.position.set(side * 3.4, -0.58, -0.4);
        wingPivot.add(pylon);

        // Rescue Bots Wing Emblem
        const wingEmblem = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 2.6), matEmblem);
        wingEmblem.position.set(side * 6.5, 0.62, -1.2);
        wingEmblem.userData.noOutline = true;
        wingPivot.add(wingEmblem);

        // Trailing-Edge Control Flaps
        const flap = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.42, 1.3), matHullSlate);
        flap.position.set(side * 6.5, -0.05, -5.3);
        flap.rotation.y = side * 0.14;
        flap.rotation.x = -0.22;
        wingPivot.add(flap);

        // Upturned Wingtip Vertical Fin + Navigation Beacon Pod welded flush to wingtip
        const tipFin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 4.4), matOptimusBlue);
        tipFin.position.set(side * 13.55, 1.45, -4.0);
        tipFin.rotation.z = side * -0.22;
        tipFin.rotation.x = -0.25;
        wingPivot.add(tipFin);

        const navPod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.55, 1.8, 8).rotateX(Math.PI / 2),
            side === -1 ? matBeaconRed : matBeaconGreen
        );
        navPod.position.set(side * 13.95, 3.1, -3.8);
        navPod.userData.noOutline = true;
        wingPivot.add(navPod);

        shipGroup.add(wingPivot);
    });

    // -----------------------------------------------------------------
    // 7. HIGH-FIDELITY FTL ENGINE NACELLES & VECTORING EXHAUST NOZZLES
    // -----------------------------------------------------------------
    const thrusterFlames: Array<{
        group: THREE.Group;
        outerMat: THREE.MeshBasicMaterial;
        innerMat: THREE.MeshBasicMaterial;
    }> = [];
    [-1, 1].forEach(side => {
        const nacGroup = new THREE.Group();
        nacGroup.position.set(side * 6.4, 2.1, -9.2);

        // Strut linking upper hull to giant FTL nacelle
        const strut = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.35, 5.2), matHullSlate);
        strut.position.set(side * -2.2, -0.65, 0);
        strut.rotation.z = side * 0.35;
        nacGroup.add(strut);

        // Main Cylindrical Nacelle Housing
        const core = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.45, 10.6, 12).rotateX(Math.PI / 2), matHullSlate);
        nacGroup.add(core);

        // Armored Top/Side Heat-Sink Ribs & Crimson Trim Ring
        const collarRing = new THREE.Mesh(new THREE.CylinderGeometry(2.48, 2.48, 1.4, 12).rotateX(Math.PI / 2), matOptimusRed);
        collarRing.position.z = 1.8;
        nacGroup.add(collarRing);

        [-0.8, 0, 0.8].forEach(fx => {
            const vane = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 7.6), matHullWhite);
            vane.position.set(fx, 2.35, -0.4);
            nacGroup.add(vane);
        });

        // Forward Recessed Intake Ring + Glowing Cyan Collector Core
        const intakeRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.42, 8, 16), matChrome);
        intakeRing.position.z = 5.35;
        const intakeCone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.2, 10).rotateX(Math.PI / 2), matDarkSteel);
        intakeCone.position.z = 5.2;
        const intakeGlow = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.16, 6, 16), matConduitCyan);
        intakeGlow.position.z = 5.2;
        intakeGlow.userData.noOutline = true;
        nacGroup.add(intakeRing, intakeCone, intakeGlow);

        // Aft Vectoring Nozzle Petals (8 Radial Exhaust Flaps)
        for (let p = 0; p < 8; p++) {
            const ang = (p / 8) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 1.8), matDarkSteel);
            petal.position.set(Math.cos(ang) * 1.95, Math.sin(ang) * 1.95, -5.8);
            petal.rotation.z = ang + Math.PI / 2;
            nacGroup.add(petal);
        }

        // Animated Flickering Plasma Core + Inner White-Hot Afterburner Ring
        const exhaustCore = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.25, 0.65, 12).rotateX(Math.PI / 2), matThrusterCyan);
        exhaustCore.position.set(0, 0, -5.65);
        exhaustCore.userData.noOutline = true;
        nacGroup.add(exhaustCore);
        animatedMeshes.push({ obj: exhaustCore, kind: 'FLICKER', baseY: 0, phase: side });

        // Dynamic Flight / Launch Plasma Exhaust Plumes (scaled by setThrusterPower)
        const flameGroup = new THREE.Group();
        flameGroup.position.set(0, 0, -5.85);
        flameGroup.visible = false;
        const outerFlameGeo = new THREE.ConeGeometry(1.65, 8.5, 12);
        outerFlameGeo.rotateX(-Math.PI / 2);
        outerFlameGeo.translate(0, 0, -4.25);
        const outerFlameMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.78,
            depthWrite: false
        });
        const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
        outerFlame.userData.noOutline = true;

        const innerFlameGeo = new THREE.ConeGeometry(0.95, 5.6, 10);
        innerFlameGeo.rotateX(-Math.PI / 2);
        innerFlameGeo.translate(0, 0, -2.8);
        const innerFlameMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.92,
            depthWrite: false
        });
        const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
        innerFlame.userData.noOutline = true;

        flameGroup.add(outerFlame, innerFlame);
        nacGroup.add(flameGroup);
        thrusterFlames.push({ group: flameGroup, outerMat: outerFlameMat, innerMat: innerFlameMat });

        shipGroup.add(nacGroup);

        // Twin Smaller Auxiliary Maneuvering Thrusters flanking Aft Ramp
        const auxThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 3.2, 10).rotateX(Math.PI / 2), matDarkSteel);
        auxThruster.position.set(side * 2.5, -0.35, -12.6);
        const auxGlow = new THREE.Mesh(new THREE.CircleGeometry(0.72, 10).rotateY(Math.PI), matFloodLight);
        auxGlow.position.set(side * 2.5, -0.35, -14.24);
        auxGlow.userData.noOutline = true;
        shipGroup.add(auxThruster, auxGlow);
    });

    // -----------------------------------------------------------------
    // 8. BEVELED DORSAL TAIL FIN, TWIN ANGLERS & AFT BOARDING RAMP
    // -----------------------------------------------------------------
    const finShape = new THREE.Shape();
    finShape.moveTo(4.2, 0);
    finShape.lineTo(-3.5, 0);
    finShape.lineTo(-5.4, 6.8);
    finShape.lineTo(-1.4, 6.8);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, {
        depth: 0.9,
        bevelEnabled: true,
        bevelThickness: 0.22,
        bevelSize: 0.2,
        bevelSegments: 2
    });
    finGeo.translate(0, 0, -0.45);
    finGeo.rotateY(-Math.PI / 2);

    const dorsalFin = new THREE.Mesh(finGeo, matOptimusBlue);
    dorsalFin.position.set(0, 3.35, -8.8);
    shipGroup.add(dorsalFin);

    const finStripe = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.1, 4.6), matOptimusGold);
    finStripe.position.set(0, 7.2, -12.0);
    finStripe.rotation.x = -0.26;
    shipGroup.add(finStripe);

    const tailBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), matBeaconRed);
    tailBeacon.position.set(0, 10.35, -12.2);
    tailBeacon.userData.noOutline = true;
    shipGroup.add(tailBeacon);

    // Twin Canted Lower Tail Stabilizer Fins
    [-1, 1].forEach(side => {
        const cantFin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 4.4), matOptimusRed);
        cantFin.position.set(side * 2.6, 2.2, -12.0);
        cantFin.rotation.z = side * -0.58;
        cantFin.rotation.x = -0.22;
        shipGroup.add(cantFin);
    });

    // Lowered Aft Cargo / Boarding Ramp with Hazard Rails & Tread Ribs
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, -1.75, -13.6);
    rampGroup.rotation.x = 0.44;
    const rampDeck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.42, 7.2), matHullSlate);
    rampGroup.add(rampDeck);
    for (let tr = -2.7; tr <= 2.7; tr += 0.9) {
        const tread = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.16, 0.25), matDarkSteel);
        tread.position.set(0, 0.24, tr);
        rampGroup.add(tread);
    }
    [-2.15, 2.15].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.72, 7.0), matHazardMat);
        rail.position.set(rx, 0.45, 0);
        rail.userData.noOutline = true;
        rampGroup.add(rail);
    });
    shipGroup.add(rampGroup);

    applyCartoonInkOutlines(shipGroup, 1.028, true);
    sigmaRoot.add(shipGroup);

    // -----------------------------------------------------------------
    // 9. GROUNDED CRASH-SITE DIORAMA & HOLOGRAPHIC DISTRESS BEACON
    // -----------------------------------------------------------------
    if (includeDiorama) {
        const dioramaGroup = new THREE.Group();

        // Dark Scorched Skid Trail Marks Aft & Under Ship
        const matScorch = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.62 });
        const skidTrail = new THREE.Mesh(new THREE.PlaneGeometry(14, 34).rotateX(-Math.PI / 2), matScorch);
        skidTrail.position.set(-4, 0.06, -4);
        skidTrail.rotation.y = 0.62;
        skidTrail.userData.noOutline = true;
        dioramaGroup.add(skidTrail);

        // Displaced Faceted Impact Boulders Bermed Around Buried Bow & Lower Port Wing
        const matImpactRock = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: toonGrad3 });
        const impactBoulders: Array<[number, number, number, number, number]> = [
            [8, 12, 2.4, 1.35, 0.4],
            [4, 15, 1.9, 1.1, 1.2],
            [-2, 15, 2.2, 1.25, 2.1],
            [-7, 10, 2.6, 1.45, 0.8],
            [-10, 3, 2.3, 1.2, 1.9],
            [-12, -4, 2.5, 1.3, 2.7],
            [11, 6, 1.7, 0.95, 0.5],
            [3, -11, 2.1, 1.15, 1.4]
        ];
        impactBoulders.forEach(([bx, bz, r, sy, rot]) => {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), matImpactRock);
            rock.position.set(bx, r * sy * 0.45, bz);
            rock.scale.set(1.15, sy * 0.72, 1.05);
            rock.rotation.set(rot * 0.4, rot, 0.2);
            dioramaGroup.add(rock);
        });

        // Ejected Cybertronian Stasis Pod Resting on Starboard-Aft Floor
        const ejectedPod = new THREE.Group();
        ejectedPod.position.set(18, 1.25, -4);
        ejectedPod.rotation.set(0.18, -0.45, 1.32);
        const podBody = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 4.6, 10), matHullWhite);
        const podCapTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.5, 1.1, 10), matOptimusRed);
        podCapTop.position.y = 2.6;
        const podCapBot = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 0.9, 10), matHullSlate);
        podCapBot.position.y = -2.5;
        const podWindow = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 2.2, 10, 1, false, -0.9, 1.8), matThrusterCyan);
        podWindow.userData.noOutline = true;
        ejectedPod.add(podBody, podCapTop, podCapBot, podWindow);
        dioramaGroup.add(ejectedPod);

        // Torn Armor Hull Shard & Supply Crate Nearby
        const armorShard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 2.6), matOptimusRed);
        armorShard.position.set(-10, 0.75, 20);
        armorShard.rotation.set(0.32, 0.48, -0.25);
        const supplyCrate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 2.6), matHullSlate);
        supplyCrate.position.set(-6, 1.0, 21);
        supplyCrate.rotation.y = 0.28;
        const crateTrim = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.38, 2.72), matOptimusGold);
        crateTrim.position.set(-6, 1.0, 21);
        crateTrim.rotation.y = 0.28;
        dioramaGroup.add(armorShard, supplyCrate, crateTrim);

        applyCartoonInkOutlines(dioramaGroup, 1.035, true);
        sigmaRoot.add(dioramaGroup);

        // 10. UPGRADED HOLOGRAPHIC DISTRESS BEACON
        const beaconMount = new THREE.Group();
        beaconMount.position.set(14, 0, 16);

        const tripodBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 0.75, 6), matHullSlate);
        tripodBase.position.y = 0.38;
        const emitterCap = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 0.5, 8), matChrome);
        emitterCap.position.y = 0.9;
        beaconMount.add(tripodBase, emitterCap);
        applyCartoonInkOutlines(beaconMount, 1.04, true);

        const beamCone = new THREE.Mesh(
            new THREE.ConeGeometry(2.6, 7.2, 16, 1, true).rotateX(Math.PI),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
        );
        beamCone.position.y = 4.5;
        beaconMount.add(beamCone);

        const holoSpinner = new THREE.Group();
        holoSpinner.position.set(14, 5.4, 16);
        const beaconOrb = new THREE.Mesh(
            new THREE.OctahedronGeometry(1.45, 0),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
        );
        const holoRing = new THREE.Mesh(
            new THREE.TorusGeometry(2.05, 0.08, 6, 24).rotateX(Math.PI * 0.36),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        holoSpinner.add(beaconOrb, holoRing);

        sigmaRoot.add(beaconMount, holoSpinner);
        animatedMeshes.push({ obj: holoSpinner, kind: 'SPIN_PULSE', baseY: 5.4, phase: 1.2 });
    }

    // Flight-Ready Launch Pad Ring (activated when all 3 Sigma parts are installed)
    const launchPadRing = new THREE.Group();
    launchPadRing.visible = false;
    const outerPadRing = new THREE.Mesh(
        new THREE.RingGeometry(16.5, 19.2, 48).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    outerPadRing.position.y = 0.16;
    const innerPadRing = new THREE.Mesh(
        new THREE.RingGeometry(12.2, 13.4, 36).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    innerPadRing.position.y = 0.18;
    const padBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(14.5, 16.5, 36, 28, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
    );
    padBeam.position.y = 18.0;
    launchPadRing.add(outerPadRing, innerPadRing, padBeam);
    sigmaRoot.add(launchPadRing);

    const setThrusterPower = (power: number, warpMode = false) => {
        const clamped = Math.max(0, power);
        thrusterFlames.forEach(({ group, outerMat, innerMat }) => {
            group.visible = clamped > 0.02;
            if (group.visible) {
                const widthScale = 0.65 + Math.min(1.1, clamped * 0.45);
                const lenScale = 0.45 + clamped * 1.15;
                group.scale.set(widthScale, widthScale, lenScale);
                outerMat.color.setHex(warpMode ? 0xf59e0b : 0x38bdf8);
                innerMat.color.setHex(warpMode ? 0xffffff : 0xfef08a);
                outerMat.opacity = Math.min(0.95, 0.45 + clamped * 0.35);
            }
        });
    };

    const setRepairStage = (stage: number) => {
        const s = Math.max(0, Math.min(3, Math.floor(stage)));
        if (!flatLevel) {
            if (s === 0) {
                shipGroup.position.set(0, 2.2, 0);
                shipGroup.rotation.set(0.20, 0.62, -0.26);
                wingPivots.forEach((wp, idx) => {
                    wp.rotation.z = idx === 0 ? -0.14 : -0.05;
                    wp.rotation.x = idx === 0 ? 0.08 : 0.0;
                });
            } else if (s === 1) {
                shipGroup.position.set(0, 2.75, 0);
                shipGroup.rotation.set(0.13, 0.62, -0.17);
                wingPivots.forEach((wp, idx) => {
                    wp.rotation.z = idx === 0 ? -0.09 : -0.03;
                    wp.rotation.x = idx === 0 ? 0.04 : 0.0;
                });
            } else if (s === 2) {
                shipGroup.position.set(0, 3.35, 0);
                shipGroup.rotation.set(0.06, 0.62, -0.07);
                wingPivots.forEach(wp => wp.rotation.set(0, 0, 0));
            } else {
                // Stage 3: Fully repaired, leveled & flight-ready!
                shipGroup.position.set(0, 4.1, 0);
                shipGroup.rotation.set(0, 0.62, 0);
                wingPivots.forEach(wp => wp.rotation.set(0, 0, 0));
            }
        }
        matThrusterCyan.color.setHex(s === 0 ? 0x1e3a5f : (s === 1 ? 0x0284c7 : (s === 2 ? 0x38bdf8 : 0x7dd3fc)));
        matConduitCyan.color.setHex(s === 0 ? 0x155e75 : (s >= 2 ? 0x22d3ee : 0x0ea5e9));
        matFloodLight.color.setHex(s === 0 ? 0x94a3b8 : 0xfef08a);
        launchPadRing.visible = s >= 3;
        setThrusterPower(s >= 3 ? 0.55 : (s === 2 ? 0.2 : 0), false);
    };

    sigmaRoot.userData.sigmaControl = {
        shipGroup,
        launchPadRing,
        thrusterFlames,
        setRepairStage,
        setThrusterPower
    };

    cavernWorldGroup.add(sigmaRoot);
    if (options.rotationY !== undefined) {
        sigmaRoot.rotation.y = options.rotationY;
    }

    if (staticColliders) {
        // Multi-circle hull & swept-wing collision footprint matching Sigma's actual 3D orientation
        const rotY = flatLevel ? (options.rotationY ?? 0) : 0.62;
        const cosR = Math.cos(rotY);
        const sinR = Math.sin(rotY);
        const localParts: Array<{ lx: number; lz: number; r: number }> = [
            { lx: 0, lz: 0, r: 7.5 },        // Mid fuselage & armored side sponsons
            { lx: 0, lz: 9.0, r: 6.6 },      // Forward bow prow & command bridge
            { lx: 0, lz: -9.0, r: 6.6 },     // Aft engine nacelles & dorsal thruster bay
            { lx: -9.5, lz: -2.8, r: 5.2 },  // Port inner swept wing
            { lx: 9.5, lz: -2.8, r: 5.2 },   // Starboard inner swept wing
            { lx: -15.2, lz: -4.6, r: 4.2 }, // Port outer wingtip & vertical stabilizer
            { lx: 15.2, lz: -4.6, r: 4.2 }   // Starboard outer wingtip & vertical stabilizer
        ];
        for (let i = 0; i < localParts.length; i++) {
            const p = localParts[i];
            staticColliders.push({
                x: originX + p.lx * cosR + p.lz * sinR,
                z: originZ - p.lx * sinR + p.lz * cosR,
                r: p.r
            });
        }
        if (includeDiorama) {
            staticColliders.push({ x: originX + 18, z: originZ - 4, r: 3.2 });
        }
    }

    return sigmaRoot;
}

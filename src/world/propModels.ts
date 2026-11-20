// Pure Zero-Side-Effect 3D Builders for Street Props, Collectibles, Dumpsters, Hazards & Nature
import * as THREE from 'three';
import {
    toonGrad3,
    matDarkSteel,
    matInkOutline,
    OUTLINE_LAYER,
    applyCartoonInkOutlines
} from '../rendering/materials.js';

// --- STREETLAMPS, CONES & BARRICADES ---
export const streetlampGeos = {
    postGeo: new THREE.CylinderGeometry(0.18, 0.28, 7.2, 8),
    bulbGeo: new THREE.SphereGeometry(0.68, 8, 8),
    capGeo: new THREE.ConeGeometry(0.95, 0.55, 8)
};
export const matStreetlampBulb = new THREE.MeshBasicMaterial({ color: 0xfef08a });

export function createStreetlampMesh() {
    const root = new THREE.Group();

    const post = new THREE.Mesh(streetlampGeos.postGeo, matDarkSteel);
    post.position.y = 3.6;
    post.castShadow = true;
    const postOut = new THREE.Mesh(streetlampGeos.postGeo, matInkOutline);
    postOut.position.y = 3.6;
    postOut.scale.set(1.08, 1.01, 1.08);
    postOut.userData.isOutline = true;
    postOut.layers.set(OUTLINE_LAYER);

    const bulb = new THREE.Mesh(streetlampGeos.bulbGeo, matStreetlampBulb);
    bulb.position.y = 7.4;
    bulb.userData.noOutline = true;

    const cap = new THREE.Mesh(streetlampGeos.capGeo, matDarkSteel);
    cap.position.y = 7.95;
    cap.castShadow = true;
    const capOut = new THREE.Mesh(streetlampGeos.capGeo, matInkOutline);
    capOut.position.y = 7.95;
    capOut.scale.setScalar(1.08);
    capOut.userData.isOutline = true;
    capOut.layers.set(OUTLINE_LAYER);

    root.add(post, postOut, bulb, cap, capOut);
    return root;
}

export function createTrafficConeMesh() {
    const grp = new THREE.Group();
    const matBase = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matCone = new THREE.MeshToonMaterial({ color: 0xff6b00, gradientMap: toonGrad3 });
    const matWhiteStripe = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 1.2), matBase);
    base.position.y = 0.08;
    grp.add(base);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.5, 12), matCone);
    cone.position.y = 0.83;
    grp.add(cone);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.33, 0.36, 12), matWhiteStripe);
    band.position.y = 0.78;
    band.userData.noOutline = true;
    grp.add(band);

    return grp;
}

export function createBarricadeMesh() {
    const grp = new THREE.Group();
    const matLegs = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
    const matBoard = new THREE.MeshToonMaterial({ color: 0xffa500, gradientMap: toonGrad3 });
    const matBlackStripe = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    [-1.3, 1.3].forEach(lx => {
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.14), matLegs);
        legL.rotation.z = 0.18;
        legL.position.set(lx - 0.12, 0.8, 0);
        grp.add(legL);

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.14), matLegs);
        legR.rotation.z = -0.18;
        legR.position.set(lx + 0.12, 0.8, 0);
        grp.add(legR);
    });

    const board = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.14), matBoard);
    board.position.set(0, 1.15, 0);
    grp.add(board);

    [-1.0, -0.4, 0.2, 0.8].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.16), matBlackStripe);
        stripe.rotation.z = -0.45;
        stripe.position.set(sx, 1.15, 0);
        grp.add(stripe);
    });

    const amberLight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.28, 10),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    amberLight.position.set(0, 1.58, 0);
    grp.add(amberLight);

    return grp;
}

// --- COMMERCIAL RECYCLING DUMPSTER ---
const matDumpsterGreen = new THREE.MeshToonMaterial({ color: 0x15803d, gradientMap: toonGrad3 });
const matDumpsterLid = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
const matDumpsterPocket = new THREE.MeshToonMaterial({ color: 0xea580c, gradientMap: toonGrad3 });
const matDumpsterStripe = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
const matDumpsterDecal = new THREE.MeshBasicMaterial({ color: 0x84cc16 });

export function createDumpsterMesh() {
    const root = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(2.75, 1.75, 1.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, matDumpsterGreen);
    bodyMesh.position.y = 1.15;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);

    const outline = new THREE.Mesh(bodyGeo, matInkOutline);
    outline.position.y = 1.15;
    outline.scale.set(1.05, 1.05, 1.05);
    outline.userData.isOutline = true;
    outline.layers.set(OUTLINE_LAYER);
    root.add(outline);

    [-1.44, 1.44].forEach(px => {
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 1.98), matDumpsterPocket);
        pocket.position.set(px, 1.15, 0);
        pocket.castShadow = true;
        root.add(pocket);

        const flange = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.14), matDumpsterPocket);
        flange.position.set(px, 1.15, 1.0);
        root.add(flange);
    });

    [-0.85, 0, 0.85].forEach(rx => {
        const strake = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.12), matDarkSteel);
        strake.position.set(rx, 1.15, 1.0);
        root.add(strake);
    });

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.18, 0.08), matDumpsterStripe);
    stripe.position.set(0, 1.88, 1.0);
    stripe.userData.noOutline = true;
    root.add(stripe);

    const recyclePlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.08), matDumpsterDecal);
    recyclePlate.position.set(0, 1.25, 1.01);
    recyclePlate.userData.noOutline = true;
    root.add(recyclePlate);

    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 2.05, -0.98);

    [-0.72, 0.72].forEach(lx => {
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.12, 1.95), matDumpsterLid);
        lid.position.set(lx, 0.06, 0.98);
        lid.rotation.x = -0.06;
        lid.castShadow = true;

        const lidOutline = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.12, 1.95), matInkOutline);
        lidOutline.position.set(lx, 0.06, 0.98);
        lidOutline.scale.set(1.06, 1.18, 1.06);
        lidOutline.userData.isOutline = true;
        lidOutline.layers.set(OUTLINE_LAYER);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.14), matDarkSteel);
        handle.position.set(lx, 0.18, 1.88);

        lidGroup.add(lid, lidOutline, handle);
    });
    root.add(lidGroup);

    const trashGroup = new THREE.Group();
    trashGroup.position.set(0, 1.2, 0);

    const scrapColors = [0x38bdf8, 0xef4444, 0xfacc15, 0x84cc16, 0xd97706, 0xa855f7];
    for (let i = 0; i < 8; i++) {
        const cGeo = i % 2 === 0 ? new THREE.CylinderGeometry(0.18, 0.18, 0.55, 6) : new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const cMat = new THREE.MeshBasicMaterial({ color: scrapColors[i % scrapColors.length] });
        const item = new THREE.Mesh(cGeo, cMat);
        const px = ((i * 0.37) % 1 - 0.5) * 1.6;
        const pz = ((i * 0.61) % 1 - 0.5) * 1.1;
        item.position.set(px, 0.12 + (i % 3) * 0.14, pz);
        item.rotation.set(i * 0.7, i * 1.1, 0);
        item.userData.noOutline = true;
        trashGroup.add(item);
    }
    root.add(trashGroup);

    [[-1.15, -0.75], [1.15, -0.75], [-1.15, 0.75], [1.15, 0.75]].forEach(([cx, cz]) => {
        const caster = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.22, 10).rotateZ(Math.PI / 2),
            matDarkSteel
        );
        caster.position.set(cx, 0.18, cz);
        root.add(caster);
    });

    return { root, bodyMesh, lidGroup, trashGroup };
}

// --- COLLECTIBLES: GOLDEN ENERGON CUBE & GOLDEN CREST ---
const energonCoreGeo = new THREE.OctahedronGeometry(1.05, 0);
const energonShellGeo = new THREE.BoxGeometry(1.75, 1.75, 1.75);
const energonRingGeo = new THREE.RingGeometry(1.35, 1.85, 20).rotateX(-Math.PI / 2);
const matEnergonCore = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
const matEnergonGold = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide
});
const matEnergonRing = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
});

export function createEnergonCubeMesh() {
    const root = new THREE.Group();
    const cubePivot = new THREE.Group();
    cubePivot.position.y = 2.4;

    const core = new THREE.Mesh(energonCoreGeo, matEnergonCore);
    const shell = new THREE.Mesh(energonShellGeo, matEnergonGold);
    const outline = new THREE.Mesh(energonShellGeo, matInkOutline);
    outline.scale.setScalar(1.09);
    outline.userData.isOutline = true;
    outline.layers.set(OUTLINE_LAYER);

    cubePivot.add(core, shell, outline);
    root.add(cubePivot);

    const baseRing = new THREE.Mesh(energonRingGeo, matEnergonRing);
    baseRing.position.y = 0.28;
    baseRing.userData.noOutline = true;
    root.add(baseRing);

    return { root, cubePivot, baseRing };
}

export function createGoldenCrestMesh() {
    const grp = new THREE.Group();
    const matGold = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.88,
        roughness: 0.22,
        emissive: 0x785600,
        emissiveIntensity: 0.35
    });
    const matSilverTrim = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.92,
        roughness: 0.15
    });

    const shield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.45), matGold);
    shield.castShadow = true;
    grp.add(shield);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.4, 4), matGold);
    tip.rotation.y = Math.PI / 4;
    tip.rotation.x = Math.PI;
    tip.position.y = -1.6;
    grp.add(tip);

    [-0.26, 0.26].forEach(zPos => {
        const emblemCenter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.18), matSilverTrim);
        emblemCenter.position.set(0, 0.2, zPos);
        grp.add(emblemCenter);

        const emblemBrow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.18), matSilverTrim);
        emblemBrow.position.set(0, 0.9, zPos);
        grp.add(emblemBrow);

        const emblemNose = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.18), matSilverTrim);
        emblemNose.position.set(0, -0.4, zPos);
        grp.add(emblemNose);
    });

    const halo = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.12, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.75 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.userData.noOutline = true;
    grp.add(halo);

    return grp;
}

// --- HAZARDS: FIRE NODE, ROCKSLIDE BOULDER, VOLCANO MAGMA DEBRIS ---
const fireConeGeo = new THREE.ConeGeometry(0.85, 2.8, 8);
const matFireCore = new THREE.MeshBasicMaterial({ color: 0xff5400 });
const matFireTip = new THREE.MeshBasicMaterial({ color: 0xffd60a });
export const boulderGeo = new THREE.DodecahedronGeometry(2.3, 0);
export const matBoulder = new THREE.MeshToonMaterial({ color: 0x78716c, gradientMap: toonGrad3 });

export function createHazardFireMesh() {
    const nodeMesh = new THREE.Group();
    const outerFlame = new THREE.Mesh(fireConeGeo, matFireCore);
    outerFlame.position.y = 2.4;
    nodeMesh.add(outerFlame);
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.0, 6), matFireTip);
    innerFlame.position.y = 1.8;
    nodeMesh.add(innerFlame);
    const flameOutline = new THREE.Mesh(fireConeGeo, matInkOutline);
    flameOutline.position.y = 2.4;
    flameOutline.scale.setScalar(1.09);
    flameOutline.userData.isOutline = true;
    flameOutline.layers.set(OUTLINE_LAYER);
    nodeMesh.add(flameOutline);
    return nodeMesh;
}

export function createHazardRockslideMesh(s = 1.0, rotX = 0.4, rotY = 0.8) {
    const nodeMesh = new THREE.Mesh(boulderGeo, matBoulder);
    nodeMesh.scale.set(s * 1.2, s * 0.95, s);
    nodeMesh.position.set(0, s * 2.1, 0);
    nodeMesh.rotation.set(rotX, rotY, 0);
    nodeMesh.castShadow = true;
    nodeMesh.receiveShadow = true;
    applyCartoonInkOutlines(nodeMesh, 1.075, true);
    return nodeMesh;
}

export const matVolcanoRock = new THREE.MeshToonMaterial({ color: 0x1c1917, gradientMap: toonGrad3 });
export const matVolcanoQuenched = new THREE.MeshToonMaterial({ color: 0x44403c, gradientMap: toonGrad3 });
export const matMoltenCore = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
export const matMoltenVeins = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

export function createMagmaDebrisMesh() {
    const group = new THREE.Group();

    const rockGeo = new THREE.DodecahedronGeometry(1.85, 0);
    const rockMesh = new THREE.Mesh(rockGeo, matVolcanoRock);
    rockMesh.castShadow = true;
    group.add(rockMesh);

    const coreGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const coreMesh = new THREE.Mesh(coreGeo, matMoltenCore);
    coreMesh.userData.noOutline = true;
    group.add(coreMesh);

    const outline = new THREE.Mesh(rockGeo, matInkOutline);
    outline.scale.setScalar(1.08);
    outline.userData.isOutline = true;
    outline.layers.set(OUTLINE_LAYER);
    group.add(outline);

    return { group, mesh: rockMesh, coreMesh };
}

// --- ISLAND NATURE: 5 TREE ARCHETYPES, BUSH, ROCK ---
const matTrunkPine = new THREE.MeshToonMaterial({ color: 0x78350f, gradientMap: toonGrad3 });
const matTrunkFir = new THREE.MeshToonMaterial({ color: 0x5c2410, gradientMap: toonGrad3 });
const matTrunkOak = new THREE.MeshToonMaterial({ color: 0x451a03, gradientMap: toonGrad3 });
const matTrunkBirch = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 });
const matTrunkCoastal = new THREE.MeshToonMaterial({ color: 0x9a3412, gradientMap: toonGrad3 });

export const matTreeLeavesBase = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
export const matBushToon = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });
export const matRockToon = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad3 });

export const bushGeo = new THREE.DodecahedronGeometry(1.35, 0);
export const envRockGeo = new THREE.DodecahedronGeometry(1.85, 0);

export const TREE_ARCHETYPES = [
    {
        name: 'SPIRE_PINE',
        trunkGeo: new THREE.CylinderGeometry(0.52, 0.82, 4.4, 6),
        trunkMat: matTrunkPine,
        leavesGeo: new THREE.ConeGeometry(3.2, 10.2, 7),
        trunkY: 2.2,
        leavesY: 7.2,
        leavesScale: [1.0, 1.0, 1.0],
        outlineScale: [1.07, 1.05, 1.07],
        colors: [0x15803d, 0x166534, 0x14532d, 0x16a34a, 0x1b4332, 0x1e3a1e]
    },
    {
        name: 'ALPINE_FIR',
        trunkGeo: new THREE.CylinderGeometry(0.65, 0.95, 3.8, 6),
        trunkMat: matTrunkFir,
        leavesGeo: new THREE.ConeGeometry(4.6, 7.6, 7),
        trunkY: 1.9,
        leavesY: 5.6,
        leavesScale: [1.0, 1.0, 1.0],
        outlineScale: [1.07, 1.05, 1.07],
        colors: [0x0f766e, 0x047857, 0x065f46, 0x115e59, 0x166534, 0x2d6a4f]
    },
    {
        name: 'TOWN_OAK',
        trunkGeo: new THREE.CylinderGeometry(0.75, 1.15, 4.0, 6),
        trunkMat: matTrunkOak,
        leavesGeo: new THREE.DodecahedronGeometry(3.7, 1),
        trunkY: 2.0,
        leavesY: 5.8,
        leavesScale: [1.28, 0.95, 1.18],
        outlineScale: [1.08, 1.08, 1.08],
        colors: [0x22c55e, 0x16a34a, 0x4ade80, 0x65a30d, 0x84cc16, 0x4d7c0f]
    },
    {
        name: 'GOLDEN_BIRCH',
        trunkGeo: new THREE.CylinderGeometry(0.36, 0.52, 5.6, 6),
        trunkMat: matTrunkBirch,
        leavesGeo: new THREE.DodecahedronGeometry(3.0, 1),
        trunkY: 2.8,
        leavesY: 7.6,
        leavesScale: [0.88, 1.42, 0.88],
        outlineScale: [1.08, 1.06, 1.08],
        colors: [0xf59e0b, 0xeab308, 0xfacc15, 0xd97706, 0xb45309, 0xa3e635]
    },
    {
        name: 'COASTAL_UMBRELLA',
        trunkGeo: new THREE.CylinderGeometry(0.48, 0.78, 5.4, 6),
        trunkMat: matTrunkCoastal,
        leavesGeo: new THREE.ConeGeometry(5.2, 4.4, 8),
        trunkY: 2.7,
        leavesY: 6.8,
        leavesScale: [1.08, 0.92, 1.08],
        outlineScale: [1.07, 1.06, 1.07],
        colors: [0x0d9488, 0x10b981, 0x059669, 0x14b8a6, 0x34d399, 0x047857]
    }
];

export function createTreeArchetypeMesh(archIdx: number) {
    const arch = TREE_ARCHETYPES[archIdx] || TREE_ARCHETYPES[0];
    const grp = new THREE.Group();

    const trunk = new THREE.Mesh(arch.trunkGeo, arch.trunkMat);
    trunk.position.y = arch.trunkY;
    trunk.castShadow = true;

    const leafMat = new THREE.MeshToonMaterial({ color: arch.colors[0], gradientMap: toonGrad3 });
    const leaves = new THREE.Mesh(arch.leavesGeo, leafMat);
    leaves.position.y = arch.leavesY;
    leaves.scale.set(arch.leavesScale[0], arch.leavesScale[1], arch.leavesScale[2]);
    leaves.castShadow = true;

    const outline = new THREE.Mesh(arch.leavesGeo, matInkOutline);
    outline.position.y = arch.leavesY;
    outline.scale.set(
        arch.leavesScale[0] * arch.outlineScale[0],
        arch.leavesScale[1] * arch.outlineScale[1],
        arch.leavesScale[2] * arch.outlineScale[2]
    );
    outline.userData.isOutline = true;
    outline.layers.set(OUTLINE_LAYER);

    grp.add(trunk, leaves, outline);
    return grp;
}

export function createBushMesh() {
    const grp = new THREE.Group();
    const mat = new THREE.MeshToonMaterial({ color: 0x22c55e, gradientMap: toonGrad3 });
    const bush = new THREE.Mesh(bushGeo, mat);
    bush.position.y = 0.65;
    bush.scale.set(1.25, 0.78, 1.15);
    bush.castShadow = true;

    const out = new THREE.Mesh(bushGeo, matInkOutline);
    out.position.y = 0.65;
    out.scale.set(1.25 * 1.09, 0.78 * 1.09, 1.15 * 1.09);
    out.userData.isOutline = true;
    out.layers.set(OUTLINE_LAYER);

    grp.add(bush, out);
    return grp;
}

export function createIslandRockMesh() {
    const grp = new THREE.Group();
    const mat = new THREE.MeshToonMaterial({ color: 0x64748b, gradientMap: toonGrad3 });
    const rock = new THREE.Mesh(envRockGeo, mat);
    rock.position.y = 1.45;
    rock.scale.set(1.35, 1.15, 1.25);
    rock.castShadow = true;

    const out = new THREE.Mesh(envRockGeo, matInkOutline);
    out.position.y = 1.45;
    out.scale.set(1.35 * 1.08, 1.15 * 1.08, 1.25 * 1.08);
    out.userData.isOutline = true;
    out.layers.set(OUTLINE_LAYER);

    grp.add(rock, out);
    return grp;
}

// Pure Zero-Side-Effect Cavern Landmarks & Roaming Dinosaur 3D Builders
import * as THREE from 'three';
import {
    toonGrad3, toonGrad4, matDarkSteel,
    matMoroccoPurple, matMoroccoGold, matBlimpGondolaWood,
    applyCartoonInkOutlines
} from '../rendering/materials.js';

export interface CavernAnimatedEntry {
    obj: THREE.Object3D;
    kind: string;
    baseY: number;
    phase: number;
}

export interface DinoSphereOffset {
    forward: number;
    r: number;
}

export type DinoSpecies = 'TREX' | 'BRONTO' | 'STEGO' | 'TRIKE' | 'RAPTOR';

// -------------------------------------------------------------------------
// 1. GREAT ENERGON CRYSTAL CACHE
// -------------------------------------------------------------------------
export function buildEnergonCacheMesh(animatedMeshes?: CavernAnimatedEntry[]): THREE.Group {
    const g = new THREE.Group();

    const matEnerCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const matEnerGold = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const matStoneBase = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 12.0, 1.4, 12), matStoneBase);
    dais.position.y = 0.7;
    g.add(dais);

    const spireCenter = new THREE.Mesh(new THREE.OctahedronGeometry(4.2, 0), matEnerCyan);
    spireCenter.position.set(0, 7.8, 0);
    spireCenter.scale.set(0.85, 2.2, 0.85);
    g.add(spireCenter);
    animatedMeshes?.push({ obj: spireCenter, kind: 'SPIN_PULSE', baseY: 7.8, phase: 0 });

    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const r = 6.2 + (i % 2) * 1.4;
        const spire = new THREE.Mesh(
            new THREE.OctahedronGeometry(1.75, 0),
            i % 3 === 0 ? matEnerGold : matEnerCyan
        );
        spire.position.set(Math.cos(ang) * r, 3.2 + (i % 2) * 0.8, Math.sin(ang) * r);
        spire.scale.set(0.65, 2.1, 0.65);
        spire.rotation.set(Math.sin(ang) * 0.28, ang, -Math.cos(ang) * 0.28);
        g.add(spire);
    }

    const halo = new THREE.Mesh(
        new THREE.RingGeometry(10.5, 11.8, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
    );
    halo.position.y = 0.25;
    halo.userData.noOutline = true;
    g.add(halo);

    applyCartoonInkOutlines(dais, 1.04, true);
    return g;
}

// -------------------------------------------------------------------------
// 2. MT. GRIFFIN MAGMA CORE CHAMBER & BASALT BRIDGE
// -------------------------------------------------------------------------
export function buildMagmaBridgeMesh(
    animatedMeshes?: CavernAnimatedEntry[],
    magmaRadius = 28,
    lavaY = -0.95
): THREE.Group {
    const root = new THREE.Group();

    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const lavaMesh = new THREE.Mesh(new THREE.CircleGeometry(magmaRadius - 1.5, 32).rotateX(-Math.PI / 2), lavaMat);
    lavaMesh.position.set(0, lavaY, 0);
    lavaMesh.userData.noOutline = true;
    root.add(lavaMesh);
    animatedMeshes?.push({ obj: lavaMesh, kind: 'LAVA_PULSE', baseY: lavaY, phase: 0 });

    const matBasalt = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: toonGrad3 });
    const matMagmaVein = new THREE.MeshBasicMaterial({ color: 0xfb923c });

    const bridgeGroup = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(58, 1.2, 17.5), matBasalt);
    deck.position.set(0, lavaY >= 0 ? 0.62 : -0.15, 0);
    bridgeGroup.add(deck);

    [-8.4, 8.4].forEach(cz => {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(56, 1.5, 1.2), matBasalt);
        curb.position.set(0, lavaY >= 0 ? 1.5 : 0.9, cz);
        bridgeGroup.add(curb);

        for (let px = -24; px <= 24; px += 12) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 2.0), matBasalt);
            post.position.set(px, lavaY >= 0 ? 2.4 : 1.8, cz);
            const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), matMagmaVein);
            cap.position.set(px, lavaY >= 0 ? 4.7 : 4.1, cz);
            cap.userData.noOutline = true;
            bridgeGroup.add(post, cap);
        }
    });

    applyCartoonInkOutlines(bridgeGroup, 1.03, true);
    root.add(bridgeGroup);
    return root;
}

// -------------------------------------------------------------------------
// 3. ANCIENT FOSSILIZED DINOBOT SHRINE
// -------------------------------------------------------------------------
export function buildDinobotShrineMesh(): THREE.Group {
    const shrine = new THREE.Group();

    const matFossil = new THREE.MeshToonMaterial({ color: 0xe7e5e4, gradientMap: toonGrad3 });
    const matGlyphGlow = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const matSlate = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: toonGrad3 });

    const altar = new THREE.Mesh(new THREE.BoxGeometry(20, 2.4, 14), matSlate);
    altar.position.y = 1.2;
    shrine.add(altar);

    // Giant Fossilized Dino Skull mounted on Altar
    const skull = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.2, 9.2), matFossil);
    skull.position.set(0, 6.2, 1.2);
    shrine.add(skull);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.8, 7.6), matFossil);
    jaw.position.set(0, 2.9, 1.4);
    jaw.rotation.x = 0.16;
    shrine.add(jaw);

    [-2.2, 2.2].forEach(ex => {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 10), matGlyphGlow);
        socket.position.set(ex, 6.6, 5.5);
        socket.userData.noOutline = true;
        shrine.add(socket);
    });

    // Curved Fossilized Rib Archways behind Skull
    for (let i = -2; i <= 2; i++) {
        const ribL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 10.5, 1.4), matFossil);
        ribL.position.set(-7.5, 6.5, i * 3.0 - 2.0);
        ribL.rotation.z = -0.35;
        const ribR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 10.5, 1.4), matFossil);
        ribR.position.set(7.5, 6.5, i * 3.0 - 2.0);
        ribR.rotation.z = 0.35;
        shrine.add(ribL, ribR);
    }

    // Backlit Cybertronian Glyph Obelisks
    [-9.0, 9.0].forEach(ox => {
        const ob = new THREE.Mesh(new THREE.BoxGeometry(2.6, 12.0, 2.6), matSlate);
        ob.position.set(ox, 6.0, 4.0);
        const rune = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8.0, 2.8), matGlyphGlow);
        rune.position.set(ox, 6.0, 4.0);
        rune.userData.noOutline = true;
        shrine.add(ob, rune);
    });

    applyCartoonInkOutlines(shrine, 1.03, true);
    return shrine;
}

// -------------------------------------------------------------------------
// 4. DR. MOROCCO'S ABANDONED VICTORIAN MINE
// -------------------------------------------------------------------------
export function buildMoroccoMineMesh(): THREE.Group {
    const mine = new THREE.Group();

    const matWood = matBlimpGondolaWood || new THREE.MeshToonMaterial({ color: 0x5c3a21, gradientMap: toonGrad3 });
    const matBrass = matMoroccoGold || new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
    const matLanternGlow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const matMorPurple = matMoroccoPurple || new THREE.MeshToonMaterial({ color: 0x581c87, gradientMap: toonGrad3 });

    // Victorian Timber Mine Frames (3 Heavy Arch Gates)
    [-10, 0, 10].forEach(mz => {
        const postL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 12.5, 1.4), matWood);
        postL.position.set(-12, 6.25, mz);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 12.5, 1.4), matWood);
        postR.position.set(12, 6.25, mz);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 1.6), matWood);
        beam.position.set(0, 12.6, mz);
        mine.add(postL, postR, beam);

        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.2, 8), matLanternGlow);
        lantern.position.set(-10.5, 10.6, mz);
        lantern.userData.noOutline = true;
        mine.add(lantern);
    });

    // Twin Iron Minecart Rails along floor
    [-2.2, 2.2].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 34), matDarkSteel);
        rail.position.set(rx, 0.2, 0);
        mine.add(rail);
    });

    // Tilted Vintage Brass & Purple Minecart + Forgotten Prototype Crate
    const cart = new THREE.Group();
    cart.position.set(0, 2.1, -4.0);
    cart.rotation.set(0.18, 0.3, 0.14);
    const cartTub = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.4, 6.2), matMorPurple);
    cart.add(cartTub);
    const gearRim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.35, 8, 12), matBrass);
    gearRim.position.set(0.4, 1.5, 0);
    cart.add(gearRim);
    mine.add(cart);

    // Dust-covered Victorian Steam-Clock Blueprint Pedestal
    const crate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 4.2), matWood);
    crate.position.set(8.5, 1.6, 5.5);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 2.4, 12), matBrass);
    dome.position.set(8.5, 4.2, 5.5);
    const glassLens = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), matLanternGlow);
    glassLens.position.set(8.5, 5.5, 5.5);
    glassLens.userData.noOutline = true;
    mine.add(crate, dome, glassLens);

    applyCartoonInkOutlines(mine, 1.03, true);
    return mine;
}

// -------------------------------------------------------------------------
// 5. BOULDER'S SECRET CRYSTAL SCULPTURE ALCOVE
// -------------------------------------------------------------------------
export function buildBoulderGalleryMesh(animatedMeshes?: CavernAnimatedEntry[]): THREE.Group {
    const gallery = new THREE.Group();

    const matMushroomStem = new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 });
    const matMushroomCapGlow = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const matShroomSpots = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matSculpt = new THREE.MeshToonMaterial({ color: 0x84cc16, gradientMap: toonGrad4 });
    const matGoldTrim = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Central Geometric Crystal & Balanced Cairn Monument
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 7.0, 1.6, 8), matDarkSteel);
    pedestal.position.y = 0.8;
    gallery.add(pedestal);

    for (let tier = 0; tier < 4; tier++) {
        const r = 2.6 - tier * 0.55;
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), tier === 3 ? matGoldTrim : matSculpt);
        stone.position.set((tier % 2 === 0 ? 0.25 : -0.25), 2.8 + tier * 2.3, 0);
        stone.rotation.y = tier * 0.7;
        gallery.add(stone);
        if (tier === 3) {
            animatedMeshes?.push({ obj: stone, kind: 'SPIN_PULSE', baseY: 2.8 + tier * 2.3, phase: 2.1 });
        }
    }

    // Giant Glowing Bioluminescent Mushrooms around Alcove
    const shroomSpots = [
        { x: -16, z: -6, s: 1.3 }, { x: 16, z: -6, s: 1.2 },
        { x: -12, z: 10, s: 1.5 }, { x: 12, z: 10, s: 1.1 }
    ];
    shroomSpots.forEach(sp => {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * sp.s, 1.3 * sp.s, 6.2 * sp.s, 10), matMushroomStem);
        stem.position.set(sp.x, 3.1 * sp.s, sp.z);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(3.8 * sp.s, 2.8 * sp.s, 12), matMushroomCapGlow);
        cap.position.set(sp.x, 6.4 * sp.s, sp.z);
        cap.userData.noOutline = true;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.6 * sp.s, 8, 8), matShroomSpots);
        dot.position.set(sp.x + 1.4 * sp.s, 6.3 * sp.s, sp.z);
        dot.userData.noOutline = true;
        gallery.add(stem, cap, dot);
    });

    applyCartoonInkOutlines(gallery, 1.03, true);
    return gallery;
}

// -------------------------------------------------------------------------
// 6. ROAMING UNDERGROUND DINOSAURS (CEL-SHADED + MULTI-SPHERE COLLISION)
// -------------------------------------------------------------------------
export function createCavernDinoMesh(species: DinoSpecies): {
    root: THREE.Group;
    headPivot: THREE.Object3D;
    tailPivot: THREE.Object3D;
    legs: THREE.Object3D[];
    spheres: DinoSphereOffset[];
    wallSpheres: DinoSphereOffset[];
} {
    const root = new THREE.Group();
    const legs: THREE.Object3D[] = [];
    const headPivot = new THREE.Group();
    const tailPivot = new THREE.Group();

    const palette: Record<DinoSpecies, { main: number; accent: number; belly: number }> = {
        TREX: { main: 0x16a34a, accent: 0xfacc15, belly: 0x86efac },
        BRONTO: { main: 0xea580c, accent: 0x38bdf8, belly: 0xfdba74 },
        STEGO: { main: 0x0284c7, accent: 0xc084fc, belly: 0x7dd3fc },
        TRIKE: { main: 0xd97706, accent: 0xfef08a, belly: 0xfde68a },
        RAPTOR: { main: 0x7c3aed, accent: 0x22d3ee, belly: 0xd8b4fe }
    };
    const p = palette[species];
    const matBody = new THREE.MeshToonMaterial({ color: p.main, gradientMap: toonGrad4 });
    const matAccent = new THREE.MeshBasicMaterial({ color: p.accent });
    const matHorn = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
    const matEyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matPupil = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const addEyes = (target: THREE.Group, ex: number, ey: number, ez: number, eyeR = 0.42) => {
        [-ex, ex].forEach(sx => {
            const ew = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 8), matEyeW);
            ew.position.set(sx, ey, ez);
            ew.userData.noOutline = true;
            const ep = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.52, 8, 8), matPupil);
            ep.position.set(sx * 1.05, ey, ez + eyeR * 0.55);
            ep.userData.noOutline = true;
            target.add(ew, ep);
        });
    };

    let spheres: DinoSphereOffset[] = [{ forward: 0, r: 2.5 }];
    let wallSpheres: DinoSphereOffset[] = [{ forward: 0, r: 2.6 }];

    if (species === 'TREX') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.2, 6.8), matBody);
        body.position.set(0, 5.2, 0);
        root.add(body);

        headPivot.position.set(0, 6.4, 3.2);
        const skull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.0, 5.0), matBody);
        skull.position.set(0, 0.8, 1.4);
        const snoutTeeth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.6, 3.2), matHorn);
        snoutTeeth.position.set(0, -0.5, 2.0);
        headPivot.add(skull, snoutTeeth);
        addEyes(headPivot, 1.45, 1.4, 2.4, 0.48);
        root.add(headPivot);

        tailPivot.position.set(0, 4.8, -3.2);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6.5, 6).rotateX(-Math.PI / 2), matBody);
        tail.position.set(0, 0, -2.8);
        tailPivot.add(tail);
        root.add(tailPivot);

        [-1.8, 1.8].forEach(lx => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.6, 1.8), matBody);
            leg.position.set(lx, 1.8, -0.4);
            root.add(leg);
            legs.push(leg);
        });
        spheres = [{ forward: 2.8, r: 2.6 }, { forward: 0, r: 3.1 }, { forward: -3.2, r: 2.2 }];
        wallSpheres = [{ forward: 5.2, r: 2.6 }, { forward: 0, r: 3.4 }, { forward: -5.4, r: 2.2 }];
    } else if (species === 'BRONTO') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.5, 8.6), matBody);
        body.position.set(0, 5.4, 0);
        root.add(body);

        headPivot.position.set(0, 6.6, 3.6);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 9.2, 8), matBody);
        neck.position.set(0, 3.8, 1.6);
        neck.rotation.x = 0.35;
        const head = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 3.8), matBody);
        head.position.set(0, 8.0, 3.4);
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 2.2), matAccent);
        crest.position.set(0, 9.1, 3.2);
        crest.userData.noOutline = true;
        headPivot.add(neck, head, crest);
        addEyes(headPivot, 1.25, 8.2, 4.3, 0.42);
        root.add(headPivot);

        tailPivot.position.set(0, 4.6, -4.0);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(1.4, 8.2, 6).rotateX(-Math.PI / 2), matBody);
        tail.position.set(0, -0.4, -3.8);
        tailPivot.add(tail);
        root.add(tailPivot);

        [[-2.0, 2.6], [2.0, 2.6], [-2.0, -2.6], [2.0, -2.6]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.6, 1.6), matBody);
            leg.position.set(lx, 1.8, lz);
            root.add(leg);
            legs.push(leg);
        });
        spheres = [{ forward: 3.4, r: 2.7 }, { forward: 0, r: 3.4 }, { forward: -3.8, r: 2.4 }];
        wallSpheres = [{ forward: 6.2, r: 2.8 }, { forward: 0, r: 3.8 }, { forward: -6.4, r: 2.4 }];
    } else if (species === 'STEGO') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 6.8), matBody);
        body.position.set(0, 3.8, 0);
        root.add(body);

        [-2.2, -0.8, 0.8, 2.2].forEach(pz => {
            const plateL = new THREE.Mesh(new THREE.OctahedronGeometry(1.25, 0), matAccent);
            plateL.position.set(-0.9, 6.0, pz);
            plateL.scale.set(0.35, 1.35, 1.0);
            plateL.userData.noOutline = true;
            const plateR = new THREE.Mesh(new THREE.OctahedronGeometry(1.25, 0), matAccent);
            plateR.position.set(0.9, 6.0, pz);
            plateR.scale.set(0.35, 1.35, 1.0);
            plateR.userData.noOutline = true;
            root.add(plateL, plateR);
        });

        headPivot.position.set(0, 3.8, 3.2);
        const head = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 2.8), matBody);
        head.position.set(0, 0, 1.2);
        headPivot.add(head);
        addEyes(headPivot, 0.95, 0.3, 1.7, 0.35);
        root.add(headPivot);

        tailPivot.position.set(0, 3.4, -3.2);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(1.0, 4.8, 6).rotateX(-Math.PI / 2), matBody);
        tail.position.set(0, 0, -2.2);
        tailPivot.add(tail);
        [-0.7, 0.7].forEach(sx => {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 5).rotateZ(sx > 0 ? -0.6 : 0.6), matHorn);
            spike.position.set(sx, 0.6, -3.4);
            tailPivot.add(spike);
        });
        root.add(tailPivot);

        [[-1.6, 2.0], [1.6, 2.0], [-1.6, -2.0], [1.6, -2.0]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1.4), matBody);
            leg.position.set(lx, 1.3, lz);
            root.add(leg);
            legs.push(leg);
        });
        spheres = [{ forward: 2.2, r: 2.5 }, { forward: -1.8, r: 2.6 }];
        wallSpheres = [{ forward: 4.4, r: 2.5 }, { forward: 0, r: 3.2 }, { forward: -5.0, r: 2.4 }];
    } else if (species === 'TRIKE') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.6, 6.4), matBody);
        body.position.set(0, 3.8, 0);
        root.add(body);

        headPivot.position.set(0, 4.0, 3.2);
        const frill = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 2.6, 0.6, 8).rotateX(Math.PI * 0.42), matBody);
        frill.position.set(0, 1.4, -0.3);
        const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 3.4), matBody);
        head.position.set(0, 0, 1.2);
        [-1.0, 1.0].forEach(hx => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.36, 2.8, 7).rotateX(Math.PI * 0.42), matHorn);
            horn.position.set(hx, 1.1, 2.6);
            headPivot.add(horn);
        });
        const noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 6).rotateX(0.3), matHorn);
        noseHorn.position.set(0, 0.6, 2.8);
        headPivot.add(frill, head, noseHorn);
        addEyes(headPivot, 1.3, 0.35, 1.8, 0.38);
        root.add(headPivot);

        tailPivot.position.set(0, 3.4, -3.0);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.4, 6).rotateX(-Math.PI / 2), matBody);
        tail.position.set(0, 0, -2.0);
        tailPivot.add(tail);
        root.add(tailPivot);

        [[-1.7, 1.9], [1.7, 1.9], [-1.7, -1.9], [1.7, -1.9]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.6, 1.4), matBody);
            leg.position.set(lx, 1.3, lz);
            root.add(leg);
            legs.push(leg);
        });
        spheres = [{ forward: 2.4, r: 2.7 }, { forward: -1.6, r: 2.6 }];
        wallSpheres = [{ forward: 5.0, r: 2.8 }, { forward: 0, r: 3.4 }, { forward: -4.6, r: 2.3 }];
    } else {
        // RAPTOR (Smaller agile cavern prowler)
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 3.8), matBody);
        body.position.set(0, 2.8, 0);
        root.add(body);

        headPivot.position.set(0, 3.4, 1.9);
        const skull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 2.6), matBody);
        skull.position.set(0, 0.4, 0.8);
        const feather = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 1.6), matAccent);
        feather.position.set(0, 1.3, 0.4);
        feather.userData.noOutline = true;
        headPivot.add(skull, feather);
        addEyes(headPivot, 0.72, 0.55, 1.4, 0.28);
        root.add(headPivot);

        tailPivot.position.set(0, 2.7, -1.8);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.75, 4.2, 6).rotateX(-Math.PI / 2), matBody);
        tail.position.set(0, 0, -1.9);
        tailPivot.add(tail);
        root.add(tailPivot);

        [-0.9, 0.9].forEach(lx => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.0, 1.0), matBody);
            leg.position.set(lx, 1.0, -0.2);
            root.add(leg);
            legs.push(leg);
        });
        spheres = [{ forward: 0.4, r: 1.9 }];
        wallSpheres = [{ forward: 2.8, r: 1.8 }, { forward: 0, r: 2.2 }, { forward: -3.2, r: 1.6 }];
    }

    applyCartoonInkOutlines(root, 1.035, true);
    return { root, headPivot, tailPivot, legs, spheres, wallSpheres };
}

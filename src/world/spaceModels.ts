// Pure 3D Mesh Builders for Space & Moon Set-Pieces, Stations, Satellites, Outposts & Vehicles
import * as THREE from 'three';
import {
    toonGrad3, matDarkSteel, matChrome,
    matOptimusRed, matOptimusBlue,
    applyCartoonInkOutlines
} from '../rendering/materials.js';

export function buildAutobotOrbitalStationMesh(): THREE.Group {
    const stationGroup = new THREE.Group();
    const stCore = new THREE.Mesh(new THREE.CylinderGeometry(12, 14, 28, 12), matChrome);
    const stRing = new THREE.Mesh(new THREE.TorusGeometry(26, 3.2, 10, 28).rotateX(Math.PI / 2), matOptimusBlue);
    const stTrim = new THREE.Mesh(new THREE.TorusGeometry(26, 3.4, 8, 28).rotateX(Math.PI / 2), matOptimusRed);
    stTrim.scale.set(1, 0.32, 1);
    const stBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(5.5, 14, 12),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 })
    );
    stBeacon.position.y = 18;
    const dockRing = new THREE.Mesh(
        new THREE.TorusGeometry(36, 0.9, 8, 36).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.72 })
    );
    stationGroup.add(stCore, stRing, stTrim, stBeacon, dockRing);
    applyCartoonInkOutlines(stCore, 1.03, true);
    return stationGroup;
}

export function buildOrbitalSatelliteMesh(repaired = false): { group: THREE.Group; beaconMat: THREE.MeshBasicMaterial } {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.5, 10), matChrome);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4.2), matOptimusBlue);
    wingL.position.x = -9.5;
    const wingR = wingL.clone();
    wingR.position.x = 9.5;
    const beaconMat = new THREE.MeshBasicMaterial({ color: repaired ? 0x22d3ee : 0xef4444 });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 10), beaconMat);
    beacon.position.y = 5.4;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.45, 8, 24), beaconMat);
    g.add(body, wingL, wingR, beacon, halo);
    applyCartoonInkOutlines(body, 1.04, true);
    return { group: g, beaconMat };
}

export function buildStrandedPodMesh(): THREE.Group {
    const g = new THREE.Group();
    const capsule = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 7.5, 10), matOptimusRed);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), matChrome);
    cap.position.y = 3.8;
    const beacon = new THREE.Mesh(
        new THREE.TorusGeometry(5.2, 0.38, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    g.add(capsule, cap, beacon);
    applyCartoonInkOutlines(capsule, 1.04, true);
    return g;
}

export function buildMoroccoOrbitalStationMesh() {
    const root = new THREE.Group();
    const matMoroccoPlum = new THREE.MeshToonMaterial({ color: 0x3b0764, gradientMap: toonGrad3 });
    const matMoroccoBrass = new THREE.MeshToonMaterial({ color: 0xd97706, gradientMap: toonGrad3 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 26, 10), matMoroccoPlum);
    const spireTop = new THREE.Mesh(new THREE.ConeGeometry(8.5, 14, 10), matMoroccoBrass);
    spireTop.position.y = 20;
    const spireBot = new THREE.Mesh(new THREE.ConeGeometry(7.5, 12, 10).rotateX(Math.PI), matMoroccoBrass);
    spireBot.position.y = -19;
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(22, 2.6, 10, 24).rotateX(Math.PI / 2), matMoroccoPlum);
    const ringBrass = new THREE.Mesh(new THREE.TorusGeometry(22, 2.8, 8, 24).rotateX(Math.PI / 2), matMoroccoBrass);
    ringBrass.scale.set(1, 0.35, 1);

    const verneCore = new THREE.Mesh(new THREE.OctahedronGeometry(6.5, 1), coreMat);
    const shieldDome = new THREE.Mesh(
        new THREE.SphereGeometry(18.5, 20, 16),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.25, wireframe: true })
    );

    const dishPivot = new THREE.Group();
    dishPivot.position.y = 4;
    const dish = new THREE.Mesh(new THREE.ConeGeometry(5.5, 3.2, 12, 1, true).rotateX(Math.PI / 2), matMoroccoBrass);
    dish.position.z = 13.5;
    const laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 2.8, 72, 10, 1, true).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false })
    );
    laserBeam.position.z = 49.5;
    dishPivot.add(dish, laserBeam);

    root.add(body, spireTop, spireBot, ringOuter, ringBrass, verneCore, shieldDome, dishPivot);
    applyCartoonInkOutlines(body, 1.03, true);
    return { root, dishPivot, shieldDome, coreMat };
}

export function buildLunarOutpostMesh() {
    const outpostGroup = new THREE.Group();
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.2, 2.2, 16), matDarkSteel);
    domeBase.position.y = 1.1;
    const domeShell = new THREE.Mesh(
        new THREE.SphereGeometry(9.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 })
    );
    domeShell.position.y = 1.8;
    const domeStripe = new THREE.Mesh(new THREE.CylinderGeometry(9.75, 9.75, 1.1, 16), matOptimusRed);
    domeStripe.position.y = 2.4;
    const airlock = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.4, 6.2), matChrome);
    airlock.position.set(-10.2, 2.2, 0);
    const airlockDoor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 2.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    airlockDoor.position.set(-12.7, 1.9, 0);
    airlockDoor.userData.noOutline = true;

    [-1, 1].forEach(side => {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5.2, 8), matChrome);
        mast.position.set(0, 2.6, side * 13.5);
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(8.2, 0.22, 3.6),
            new THREE.MeshToonMaterial({ color: 0x1d4ed8, gradientMap: toonGrad3 })
        );
        panel.position.set(0, 5.2, side * 13.5);
        panel.rotation.x = side * 0.25;
        outpostGroup.add(mast, panel);
    });

    const dishPivot = new THREE.Group();
    dishPivot.position.set(0, 11.6, 0);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.5, 14, 1, true), matChrome);
    dish.rotation.x = Math.PI * 0.65;
    const dishTip = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    dishTip.position.set(0, 0.8, 1.6);
    dishTip.userData.noOutline = true;
    dishPivot.add(dish, dishTip);

    outpostGroup.add(domeBase, domeShell, domeStripe, airlock, airlockDoor, dishPivot);
    applyCartoonInkOutlines(outpostGroup, 1.03, true);
    return { outpostGroup, dishPivot };
}

export function buildLunarRoverMesh() {
    const rover = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    const matFoilGold = new THREE.MeshToonMaterial({ color: 0xf59e0b, gradientMap: toonGrad3 });
    const matRoverWhite = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.85, 6.2), matFoilGold);
    chassis.position.y = 1.25;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.9, 2.2), matRoverWhite);
    hood.position.set(0, 1.9, 1.8);
    const rollBar = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.16, 8, 16, Math.PI), matChrome);
    rollBar.position.set(0, 2.1, -0.5);
    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), matChrome);
    dishMast.position.set(1.3, 2.6, -2.2);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.55, 12, 1, true).rotateX(-Math.PI * 0.35), matChrome);
    dish.position.set(1.3, 3.7, -2.2);

    const wheelGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.72, 14).rotateZ(Math.PI / 2);
    [-2.1, 2.1].forEach(wx => {
        [-2.2, 0, 2.2].forEach(wz => {
            const w = new THREE.Mesh(wheelGeo, matDarkSteel);
            w.position.set(wx, 0.95, wz);
            rover.add(w);
            wheels.push(w);
        });
    });

    rover.add(chassis, hood, rollBar, dishMast, dish);
    applyCartoonInkOutlines(rover, 1.04, true);
    return { rover, wheels };
}

export function buildLunarStuntHoopMesh() {
    const group = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.55, 10, 28), ringMat);
    const inner = new THREE.Mesh(
        new THREE.TorusGeometry(4.4, 0.22, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 })
    );
    group.add(ring, inner);
    return { group, ringMat };
}

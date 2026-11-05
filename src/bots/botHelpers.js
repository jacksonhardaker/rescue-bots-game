// Bot Wheel Assemblies, Lightbars & Common Visual Rig Helpers
import * as THREE from "three";
import { matTire, matChrome, matSirenRed, matSirenBlue } from "../rendering/materials.js";

export function createQuickshadowWheel(radius = 0.64, width = 0.42) {
            const wg = new THREE.Group();
            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, width, 24).rotateZ(Math.PI / 2),
                matTire
            );
            tire.castShadow = true;
            wg.add(tire);
            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.74, radius * 0.74, width + 0.02, 24).rotateZ(Math.PI / 2),
                matQuickCyan
            );
            wg.add(rim);
            const hub = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, width + 0.04, 16).rotateZ(Math.PI / 2),
                matQuickDark
            );
            wg.add(hub);
            return wg;
        }

        export function createWheelAssembly(radius = 0.72, width = 0.52) {
            const wg = new THREE.Group();
            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, width, 16).rotateZ(Math.PI / 2),
                matTire
            );
            tire.castShadow = true;
            wg.add(tire);
            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.54, radius * 0.54, width + 0.05, 12).rotateZ(Math.PI / 2),
                matChrome
            );
            wg.add(rim);
            return wg;
        }

        // Blurr Multi-Blade Turbine Fan Wheel Assembly (Black Tire + Neon Green Rim Lip & Center Hub)
        export function createBlurrTurbineWheel(radius = 0.68, width = 0.44) {
            const wg = new THREE.Group();
            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, width, 24).rotateZ(Math.PI / 2),
                matTire
            );
            tire.castShadow = true;
            wg.add(tire);

            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, width + 0.02, 24).rotateZ(Math.PI / 2),
                matBlurrNeonGreen
            );
            wg.add(rim);

            const discGeom = new THREE.CircleGeometry(radius * 0.76, 24);
            const discMat = matBlurrTurbine;

            const discMeshOuter = new THREE.Mesh(discGeom, discMat);
            discMeshOuter.rotation.y = Math.PI / 2;
            discMeshOuter.position.x = width / 2 + 0.02;
            wg.add(discMeshOuter);

            const discMeshInner = new THREE.Mesh(discGeom, discMat);
            discMeshInner.rotation.y = -Math.PI / 2;
            discMeshInner.position.x = -width / 2 - 0.02;
            wg.add(discMeshInner);

            return wg;
        }

        export function createLightbar(width = 1.8) {
            const lb = new THREE.Group();
            const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, 0.44), matChrome);
            lb.add(base);
            const redPod = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, 0.26, 0.38), matSirenRed);
            redPod.position.set(-width * 0.25, 0.13, 0);
            lb.add(redPod);
            const bluePod = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, 0.26, 0.38), matSirenBlue);
            bluePod.position.set(width * 0.25, 0.13, 0);
            lb.add(bluePod);
            return { group: lb, redPod, bluePod };
        }

if (typeof window !== 'undefined') {
    Object.assign(window, {
        createQuickshadowWheel,
        createWheelAssembly,
        createBlurrTurbineWheel,
        createLightbar
    });
}

        // Proportional Character Scale Specifications
        // Optimus Prime (1.25x Autobot Supreme Commander) and High Tide (1.30x Deep-Ocean Titan)

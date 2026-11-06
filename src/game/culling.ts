// Viewport Frustum & Distance Rendering Culler (10X World Optimizer)
import * as THREE from 'three';
import { camera } from '../rendering/scene.js';
import { player, cullableWorldObjects, humanNPCs, vehicleNPCs, input } from '../state/gameState.js';
import { sectorChunks } from '../world/vegetation.js';
import { islandTrain } from '../world/railway.js';
import { beacons } from '../world/emergencies.js';

        /***********************************************************************
         * 8C. VIEWPORT FRUSTUM & DISTANCE RENDERING CULLER (10X WORLD OPTIMIZER)
         ***********************************************************************/
        const _cullFrustum = new THREE.Frustum();
        const _cullProjScreenMatrix = new THREE.Matrix4();
        const _cullSphere = new THREE.Sphere();

        export function updateViewportCulling() {
            camera.updateMatrixWorld();
            _cullProjScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            _cullFrustum.setFromProjectionMatrix(_cullProjScreenMatrix);

            const camX = camera.position.x;
            const camY = camera.position.y;
            const camZ = camera.position.z;
            const maxWorldDrawDist = input.camZoomMode === 1 ? 1350 : 1050;

            // 1. Cull Static Buildings, Landmarks, Streetlamps & 16 Spatial Vegetation Sectors
            for (let i = 0; i < cullableWorldObjects.length; i++) {
                const item = cullableWorldObjects[i];
                const dx = item.x - camX;
                const dy = item.y - camY;
                const dz = item.z - camZ;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist - item.radius > maxWorldDrawDist) {
                    item.obj.visible = false;
                    continue;
                }
                // Always keep objects immediately around the camera visible so shadows & nearby roofs never pop
                if (dist < item.radius + 55) {
                    item.obj.visible = true;
                    continue;
                }
                _cullSphere.center.set(item.x, item.y, item.z);
                _cullSphere.radius = item.radius;
                item.obj.visible = _cullFrustum.intersectsSphere(_cullSphere);
            }

            // 2. Cull Human NPCs outside camera frustum or beyond 520m
            for (let i = 0; i < humanNPCs.length; i++) {
                const npc = humanNPCs[i];
                const dist = Math.hypot(npc.x - camX, npc.z - camZ);
                if (dist > 520) {
                    npc.rig.root.visible = false;
                    continue;
                }
                if (dist < 45) {
                    npc.rig.root.visible = true;
                    continue;
                }
                _cullSphere.center.set(npc.x, npc.y + 2.5, npc.z);
                _cullSphere.radius = 6.5;
                npc.rig.root.visible = _cullFrustum.intersectsSphere(_cullSphere);
            }

            // 3B. Cull Griffin Rock Island Train Cars outside camera frustum or beyond 750m
            if (typeof islandTrain !== 'undefined' && islandTrain.cars.length > 0) {
                for (let i = 0; i < islandTrain.cars.length; i++) {
                    const car = islandTrain.cars[i];
                    const dist = Math.hypot(car.x - camX, car.z - camZ);
                    if (dist > 750) {
                        car.root.visible = false;
                        continue;
                    }
                    if (dist < 55) {
                        car.root.visible = true;
                        continue;
                    }
                    _cullSphere.center.set(car.x, car.y + 2.5, car.z);
                    _cullSphere.radius = car.halfLength + 2.5;
                    car.root.visible = _cullFrustum.intersectsSphere(_cullSphere);
                }
            }

            // 3. Cull Civilian Vehicle NPCs outside camera frustum or beyond 680m
            for (let i = 0; i < vehicleNPCs.length; i++) {
                const v = vehicleNPCs[i];
                const dist = Math.hypot(v.x - camX, v.z - camZ);
                if (dist > 680) {
                    v.root.visible = false;
                    continue;
                }
                if (dist < 50) {
                    v.root.visible = true;
                    continue;
                }
                _cullSphere.center.set(v.x, v.y + 2.0, v.z);
                _cullSphere.radius = 9.0;
                v.root.visible = _cullFrustum.intersectsSphere(_cullSphere);
            }

            // 4. Cull Emergency Beacon Hazard Nodes when off-screen (keep Sky Beams visible up to 1750m when in frustum)
            for (let i = 0; i < beacons.length; i++) {
                const b = beacons[i];
                _cullSphere.center.set(b.x, 45, b.z);
                _cullSphere.radius = 95;
                const beaconInView = _cullFrustum.intersectsSphere(_cullSphere);
                b.group.visible = beaconInView;

                const distToBeacon = Math.hypot(b.x - camX, b.z - camZ);
                const showNodes = beaconInView && distToBeacon < 750;
                for (let j = 0; j < b.nodes.length; j++) {
                    const n = b.nodes[j];
                    if (!n.cleared) {
                        n.mesh.visible = showNodes;
                    }
                }
                if (b.strandedCitizens) {
                    for (let c = 0; c < b.strandedCitizens.length; c++) {
                        b.strandedCitizens[c].rig.root.visible = showNodes;
                    }
                }
            }
        }


if (typeof window !== 'undefined') {
    window.updateViewportCulling = updateViewportCulling;
}

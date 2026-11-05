// High-Fidelity 3D Vector Road Ribbon Network
import * as THREE from 'three';
import { scene } from '../rendering/scene.js';
import { getTerrainHeight, getSurfaceHeight, getInnerRoadRadius, getOuterRoadRadius } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';
import { registerCullableObject } from '../state/gameState.js';

        export function makeProceduralRoadTexture() {
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 512;
            const ctx = c.getContext('2d');

            // 1. Dark Charcoal-Slate Asphalt Base (#334155)
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, 0, 512, 512);

            // Subtle cartoon asphalt aggregate flecks
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            for (let i = 0; i < 300; i++) {
                ctx.fillRect((i * 137.5) % 512, (i * 269.3) % 512, 2, 2);
            }
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
            for (let i = 0; i < 300; i++) {
                ctx.fillRect((i * 211.7) % 512, (i * 173.1) % 512, 2, 2);
            }

            // 2. Concrete Sidewalk Curbs on Left and Right Shoulders
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(0, 0, 46, 512);
            ctx.fillRect(466, 0, 46, 512);

            // Curb bevel shading
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(38, 0, 8, 512);
            ctx.fillRect(466, 0, 8, 512);

            // Outer cartoon black ink border
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 10, 512);
            ctx.fillRect(502, 0, 10, 512);

            // Inner curb ink crease line
            ctx.fillRect(44, 0, 4, 512);
            ctx.fillRect(464, 0, 4, 512);

            // Concrete curb joint expansion seams every 64 pixels along V
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            for (let y = 0; y < 512; y += 64) {
                ctx.fillRect(0, y, 46, 2);
                ctx.fillRect(466, y, 46, 2);
            }

            // 3. Crisp Bold Yellow Dashed Highway Centerline (Cartoon Saturday-Morning Look)
            // Centered at 256. Dash length: 224px, Gap: 288px (repeats every 12 meters in world space)
            ctx.fillStyle = '#b45309'; // Warm shadow/outline around yellow dash
            ctx.fillRect(244, 14, 24, 228);
            ctx.fillStyle = '#facc15'; // Vibrant cartoon yellow core
            ctx.fillRect(246, 16, 20, 224);

            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = (typeof window !== 'undefined' && window.renderer && window.renderer.capabilities) ? window.renderer.capabilities.getMaxAnisotropy() : 4;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = true;
            tex.needsUpdate = true;
            return tex;
        }

        const sharedRoadTexture = makeProceduralRoadTexture();

        // Cel-Shaded Railway Track Ballast, Wooden Ties & Gleaming Steel Rails Texture
        function makeProceduralRailTrackTexture() {
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 512;
            const ctx = c.getContext('2d');

            // 1. Granite/Gravel Ballast Roadbed Base (#334155 / #475569)
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, 0, 512, 512);

            // Ballast stone texture aggregate speckles
            ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
            for (let i = 0; i < 550; i++) {
                ctx.fillRect((i * 197.3) % 512, (i * 311.7) % 512, 3, 3);
            }
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            for (let i = 0; i < 550; i++) {
                ctx.fillRect((i * 131.9) % 512, (i * 241.1) % 512, 3, 3);
            }

            // Ballast tapered shoulders with subtle shading
            ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
            ctx.fillRect(0, 0, 36, 512);
            ctx.fillRect(476, 0, 36, 512);

            // 2. Heavy Timber Railroad Ties (Sleepers) spaced every 32px along V
            for (let y = 0; y < 512; y += 32) {
                // Drop shadow under tie
                ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
                ctx.fillRect(52, y + 20, 408, 6);

                // Dark Weathered Wood Base
                ctx.fillStyle = '#2d1810';
                ctx.fillRect(56, y + 4, 400, 18);

                // Woodgrain highlight
                ctx.fillStyle = '#452618';
                ctx.fillRect(58, y + 6, 396, 6);

                // Steel tie-plates under the dual rails (at X=176 and X=336)
                [176, 336].forEach(rx => {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(rx - 18, y + 2, 36, 22);
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(rx - 15, y + 4, 30, 18);
                    // 4 Iron Spikes per plate
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(rx - 12, y + 6, 4, 4);
                    ctx.fillRect(rx + 8, y + 6, 4, 4);
                    ctx.fillRect(rx - 12, y + 14, 4, 4);
                    ctx.fillRect(rx + 8, y + 14, 4, 4);
                });
            }

            // 3. Continuous Gleaming Dual Steel Rails (Left rail @ 176, Right rail @ 336)
            [176, 336].forEach(rx => {
                // Rail base shadow & web
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(rx - 12, 0, 24, 512);

                // Rail steel head
                ctx.fillStyle = '#64748b';
                ctx.fillRect(rx - 8, 0, 16, 512);

                // Polished steel contact crown
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(rx - 5, 0, 10, 512);

                // Specular chrome reflection highlight
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(rx - 2, 0, 4, 512);
            });

            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.anisotropy = (typeof window !== 'undefined' && window.renderer && window.renderer.capabilities) ? window.renderer.capabilities.getMaxAnisotropy() : 4;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = true;
            tex.needsUpdate = true;
            return tex;
        }

        export let sharedRailTrackTexture = null;


export let roadTexture = null;

        export function createRoadRibbon(points, width = 18.2, isLoop = false, polyOffsetFactor = -1.0, polyOffsetUnits = -4.0, customTexture = null, vRepeatPeriod = 12.0, yLift = 0.12) {
            const N = points.length;
            const segments = isLoop ? N : N - 1;
            const numVerts = N * 3;
            const positions = new Float32Array(numVerts * 3);
            const uvs = new Float32Array(numVerts * 2);
            const indices = [];

            const halfW = width * 0.5;
            let accumDist = 0;

            for (let i = 0; i < N; i++) {
                const curr = points[i];
                let next, prev;
                if (isLoop) {
                    next = points[(i + 1) % N];
                    prev = points[(i - 1 + N) % N];
                } else {
                    next = points[Math.min(i + 1, N - 1)];
                    prev = points[Math.max(0, i - 1)];
                }

                const dx = next.x - prev.x;
                const dz = next.z - prev.z;
                const len = Math.hypot(dx, dz) || 1.0;
                const tx = dx / len;
                const tz = dz / len;

                // Perpendicular vector pointing rightwards
                const nx = -tz;
                const nz = tx;

                if (i > 0) {
                    const stepDist = Math.hypot(curr.x - points[i - 1].x, curr.z - points[i - 1].z);
                    accumDist += stepDist;
                }

                const v = accumDist / vRepeatPeriod;

                const lx = curr.x - nx * halfW;
                const lz = curr.z - nz * halfW;
                const cx = curr.x;
                const cz = curr.z;
                const rx = curr.x + nx * halfW;
                const rz = curr.z + nz * halfW;

                const ly = getSurfaceHeight(lx, lz) + yLift;
                const cy = getSurfaceHeight(cx, cz) + yLift + 0.05; // Road/track crown prevents concave terrain punch-through
                const ry = getSurfaceHeight(rx, rz) + yLift;

                const baseIdx = i * 3;

                // Left vertex (U = 0.0)
                positions[baseIdx * 3] = lx;
                positions[baseIdx * 3 + 1] = ly;
                positions[baseIdx * 3 + 2] = lz;
                uvs[baseIdx * 2] = 0.0;
                uvs[baseIdx * 2 + 1] = v;

                // Center vertex (U = 0.5)
                positions[(baseIdx + 1) * 3] = cx;
                positions[(baseIdx + 1) * 3 + 1] = cy;
                positions[(baseIdx + 1) * 3 + 2] = cz;
                uvs[(baseIdx + 1) * 2] = 0.5;
                uvs[(baseIdx + 1) * 2 + 1] = v;

                // Right vertex (U = 1.0)
                positions[(baseIdx + 2) * 3] = rx;
                positions[(baseIdx + 2) * 3 + 1] = ry;
                positions[(baseIdx + 2) * 3 + 2] = rz;
                uvs[(baseIdx + 2) * 2] = 1.0;
                uvs[(baseIdx + 2) * 2 + 1] = v;
            }

            for (let i = 0; i < segments; i++) {
                const nextI = (i + 1) % N;
                const cL = i * 3 + 0;
                const cC = i * 3 + 1;
                const cR = i * 3 + 2;
                const nL = nextI * 3 + 0;
                const nC = nextI * 3 + 1;
                const nR = nextI * 3 + 2;

                // Left quad
                indices.push(cL, cC, nC);
                indices.push(cL, nC, nL);

                // Right quad
                indices.push(cC, cR, nR);
                indices.push(cC, nR, nC);
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            geo.setIndex(indices);
            geo.computeVertexNormals();

            const roadMat = new THREE.MeshToonMaterial({
                map: customTexture || sharedRoadTexture,
                gradientMap: toonGrad3,
                polygonOffset: true,
                polygonOffsetFactor: polyOffsetFactor,
                polygonOffsetUnits: polyOffsetUnits,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geo, roadMat);
            mesh.receiveShadow = true;
            return mesh;
        }

        export function createRoadIntersectionPad(cx, cz, radius = 18.5) {
            const gy = getSurfaceHeight(cx, cz);
            const padG = new THREE.Group();
            padG.position.set(cx, gy + 0.16, cz);

            // Dark Asphalt Paved Apron
            const padMesh = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 32).rotateX(-Math.PI / 2),
                new THREE.MeshToonMaterial({
                    color: 0x334155,
                    gradientMap: toonGrad3,
                    polygonOffset: true,
                    polygonOffsetFactor: -1.35,
                    polygonOffsetUnits: -6.0
                })
            );
            padMesh.receiveShadow = true;
            padG.add(padMesh);

            // Outer Paved Transition Ring
            const curbMesh = new THREE.Mesh(
                new THREE.RingGeometry(radius - 0.75, radius, 32).rotateX(-Math.PI / 2),
                new THREE.MeshToonMaterial({
                    color: 0x64748b,
                    gradientMap: toonGrad3,
                    polygonOffset: true,
                    polygonOffsetFactor: -1.4,
                    polygonOffsetUnits: -6.5
                })
            );
            padG.add(curbMesh);

            scene.add(padG);
            registerCullableObject(padG, cx, gy + 1, cz, radius * 1.5);
            return padG;
        }

export function initRoads(scene) {
    if (!roadTexture) {
        roadTexture = makeProceduralRoadTexture();
    }
    const currentScene = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!currentScene) return;

    // Use currentScene as scene inside roads construction
    const s = currentScene;

        // 1. Grand North-South Highway (North Observatory outpost at Z = -1136 to South Harbor Pier at Z = 1180)
        const ptsNS = [];
        for (let z = -1136; z <= 1180; z += 5) ptsNS.push({ x: 0, z: z });
        s.add(createRoadRibbon(ptsNS, 18.2, false, -1.0, -4.0));

        // 2. Grand East-West Highway (West Tech Village at X = -1144 to East Coast at X = 1205)
        const ptsEW = [];
        for (let x = -1144; x <= 1205; x += 5) ptsEW.push({ x: x, z: 25 });
        s.add(createRoadRibbon(ptsEW, 18.2, false, -1.05, -4.5));

        // 3. Wayward Island Causeway Highway, Suspension Bridge Deck & Ancient Ruins Road
        // Starts directly at Outer Loop junction (X = 1068, Z = 540) to bridge gap completely
        const ptsWayward = [];
        for (let x = 1068; x <= 1915; x += 5) ptsWayward.push({ x: x, z: 540 });
        s.add(createRoadRibbon(ptsWayward, 18.2, false, -1.1, -5.0));

        // 3b. Wayward Island Scenic Coastal Trail Loop (Beaches, Sea Grotto, Pier & Ruins)
        const ptsWaywardLoop = [];
        const wCenterX = 1960, wCenterZ = 540;
        for (let a = Math.PI; a >= -Math.PI; a -= 0.1) {
            const rOffset = Math.sin(a * 2) * 22 + Math.cos(a * 3) * 16;
            const rx = wCenterX + Math.cos(a) * (205 + rOffset);
            const rz = wCenterZ + Math.sin(a) * (205 + rOffset);
            ptsWaywardLoop.push({ x: rx, z: rz });
        }
        s.add(createRoadRibbon(ptsWaywardLoop, 14.5, true, -1.05, -4.5));

        // 4. Scenic East Lighthouse Access Road (Connects seamlessly to Outer Loop at X = 1175 to Lighthouse Lookout at X = 1300)
        const ptsLighthouse = [];
        for (let x = 1175; x <= 1300; x += 4) ptsLighthouse.push({ x: x, z: 60 });
        s.add(createRoadRibbon(ptsLighthouse, 14.0, false, -1.15, -5.5));

        // 4b. Dr. Morocco Lair Access Road (Connects Outer Ring Highway at -619.3, -1083.8 to Lair at -820, -1180)
        const ptsMorocco = [];
        for (let t = 0; t <= 1.0; t += 0.02) {
            ptsMorocco.push({
                x: -619.3 + t * (-820 - (-619.3)),
                z: -1083.8 + t * (-1180 - (-1083.8))
            });
        }
        s.add(createRoadRibbon(ptsMorocco, 14.0, false, -1.15, -5.5));

        // 5. Inner Highway Ring Loop
        const ptsInnerRing = [];
        const innerRingSteps = 320;
        for (let i = 0; i < innerRingSteps; i++) {
            const theta = (i / innerRingSteps) * Math.PI * 2;
            const r = getInnerRoadRadius(theta);
            ptsInnerRing.push({ x: Math.cos(theta) * r, z: Math.sin(theta) * r });
        }
        s.add(createRoadRibbon(ptsInnerRing, 18.2, true, -1.2, -6.0));

        // 6. Outer Highway Ring Loop
        const ptsOuterRing = [];
        const outerRingSteps = 480;
        for (let i = 0; i < outerRingSteps; i++) {
            const theta = (i / outerRingSteps) * Math.PI * 2;
            const r = getOuterRoadRadius(theta);
            ptsOuterRing.push({ x: Math.cos(theta) * r, z: Math.sin(theta) * r });
        }
        s.add(createRoadRibbon(ptsOuterRing, 18.2, true, -1.25, -6.5));

        // 7. Paved Intersection Junction Aprons (Smooths crossings & eliminates line-clipping)
        createRoadIntersectionPad(0, 25, 19.5);                 // Central Griffin Plaza (NS x EW)
        createRoadIntersectionPad(-48, -15, 14.5);              // Rescue Bots HQ Forecourt Apron Junction
        createRoadIntersectionPad(0, -1120, 18.5);              // North Outer Junction (NS x Outer Ring)
        createRoadIntersectionPad(0, -1136, 17.5);              // North Observatory Terminal Apron
        createRoadIntersectionPad(0, 1120, 18.5);               // South Outer Junction (NS x Outer Ring)
        createRoadIntersectionPad(0, -380, 18.0);               // North Inner Junction (NS x Inner Ring)
        createRoadIntersectionPad(0, 380, 18.0);                // South Inner Junction (NS x Inner Ring)
        createRoadIntersectionPad(-1060.8, 25, 18.5);           // West Outer Junction (EW x Outer Ring)
        createRoadIntersectionPad(-1144, 25, 18.5);             // West Tech Lab Entrance Plaza
        createRoadIntersectionPad(1178.2, 25, 18.5);            // East Outer Junction (EW x Outer Ring)
        createRoadIntersectionPad(-355.1, 25, 18.5);            // West Inner Junction (EW x Inner Ring)
        createRoadIntersectionPad(402.8, 25, 18.5);             // East Inner Junction (EW x Inner Ring)
        createRoadIntersectionPad(1068.9, 540, 17.5);           // Wayward Causeway Junction (Causeway x Outer Ring)
        createRoadIntersectionPad(1915, 540, 18.5);             // Wayward Causeway Ruins Terminal Apron
        createRoadIntersectionPad(1181.5, 60, 16.5);            // East Lighthouse Junction (Lighthouse Road x Outer Ring)
        createRoadIntersectionPad(1300, 60, 15.5);              // East Lighthouse Lookout Terminal Apron
        createRoadIntersectionPad(-619.3, -1083.8, 19.5);       // Dr. Morocco Lair Junction (Morocco Road x Outer Ring)
        createRoadIntersectionPad(-820, -1180, 22.0);            // Dr. Morocco Lair Plateau Terminal Apron
        createRoadIntersectionPad(-1085, 42, 16.0);             // West GroundBridge Turnout Apron (connects EW Highway to Portal A)
        createRoadIntersectionPad(24, 1040, 16.0);              // South Harbor GroundBridge Turnout Apron (connects NS Highway to Portal B)

}

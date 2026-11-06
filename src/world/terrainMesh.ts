// High-Fidelity Cartoon Terrain Canvas Texture, 3D Mesh & Ocean Water
import * as THREE from 'three';
import { getTerrainHeight, getInnerRoadRadius, getOuterRoadRadius, WORLD_SIZE } from './terrain.js';
import { toonGrad3 } from '../rendering/materials.js';

export let terrainMesh = null;
export let waterMesh = null;
export let shorelineFoamRing = null;

        export function createHighResTerrainTexture() {
            const TEX_SIZE = 4096;
            const c = document.createElement('canvas');
            c.width = TEX_SIZE;
            c.height = TEX_SIZE;
            const ctx = c.getContext('2d');

            // 1. Base Biome Pixel Map (Meadow Grass, Highland, Mountain Slate, Volcano & Golden Sand)
            const BASE_SIZE = 512;
            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = BASE_SIZE;
            baseCanvas.height = BASE_SIZE;
            const bCtx = baseCanvas.getContext('2d');
            const imgData = bCtx.createImageData(BASE_SIZE, BASE_SIZE);
            const data = imgData.data;

            for (let py = 0; py < BASE_SIZE; py++) {
                const wz = (py / BASE_SIZE - 0.5) * WORLD_SIZE;
                for (let px = 0; px < BASE_SIZE; px++) {
                    const wx = (px / BASE_SIZE - 0.5) * WORLD_SIZE;
                    const wy = getTerrainHeight(wx, wz);
                    const distVolcano = Math.hypot(wx + 820, wz + 840);

                    let r = 74, g = 175, b = 42; // Rich Saturday-Morning Cartoon Meadow Green

                    if (wy < -0.2) {
                        // Shallow coastal water / shoreline foam tint
                        r = 56; g = 189; b = 248;
                    } else if (wy < 0.65) {
                        // Wet golden shoreline sand
                        r = 217; g = 155; b = 38;
                    } else if (wy < 2.2) {
                        // Warm golden beach sand
                        r = 245; g = 208; b = 92;
                    } else if (distVolcano < 72 && wy > 56) {
                        // Volcano molten lava rim
                        r = 249; g = 95; b = 22;
                    } else if (distVolcano < 340 && wy > 24) {
                        // Dark volcanic basalt rock
                        const band = Math.sin(wy * 0.45) > 0 ? 0 : 12;
                        r = 71 + band; g = 85 + band; b = 105 + band;
                    } else if (wy > 34) {
                        // Highland cliff slate rock with cel-shaded contour bands
                        const band = Math.sin(wy * 0.5) > 0 ? 14 : 0;
                        r = 100 + band; g = 116 + band; b = 139 + band;
                    } else if (wy > 16) {
                        // Lush upland forest green
                        const patch = Math.sin(wx * 0.025) * Math.cos(wz * 0.025) > 0 ? 10 : 0;
                        r = 52 + patch; g = 148 + patch; b = 34 + patch;
                    } else {
                        // Rolling meadow check-pattern & organic clover patches
                        const wave = Math.sin(wx * 0.022) * Math.cos(wz * 0.022);
                        if (wave > 0.15) {
                            r = 82; g = 183; b = 46;
                        } else if (wave < -0.25) {
                            r = 64; g = 160; b = 35;
                        }
                    }

                    const idx = (py * BASE_SIZE + px) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 255;
                }
            }
            bCtx.putImageData(imgData, 0, 0);

            // Upscale base biome map smoothly onto the 2048x2048 master canvas
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(baseCanvas, 0, 0, TEX_SIZE, TEX_SIZE);

            // Transform canvas coordinate system directly to World Coordinates (-WORLD_SIZE/2 .. +WORLD_SIZE/2)
            ctx.save();
            ctx.scale(TEX_SIZE / WORLD_SIZE, TEX_SIZE / WORLD_SIZE);
            ctx.translate(WORLD_SIZE / 2, WORLD_SIZE / 2);

            // 2. Hand-Drawn Cartoon Topographic Contour Lines & Grass Texture Strokes
            ctx.strokeStyle = 'rgba(20, 83, 45, 0.22)';
            ctx.lineWidth = 2.2;
            for (let i = 0; i < 2400; i++) {
                const ang = (i * 1.6180339) * Math.PI * 2;
                const rad = 110 + (i / 2400) * 1450;
                const gx = Math.cos(ang) * rad;
                const gz = Math.sin(ang) * rad;
                const gy = getTerrainHeight(gx, gz);
                if (gy > 2.5 && gy < 32) {
                    ctx.beginPath();
                    ctx.moveTo(gx - 3.6, gz + 2.0);
                    ctx.lineTo(gx, gz - 3.8);
                    ctx.lineTo(gx + 3.6, gz + 2.0);
                    ctx.stroke();
                }
            }

            // 3. Crisp Paved Town Plazas across the 10X Island
            function drawPavedPlaza(cx, cz, w, h, radius) {
                const x0 = cx - w / 2;
                const z0 = cz - h / 2;

                // Outer cartoon black ink curb border
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.roundRect(x0 - 3.0, z0 - 3.0, w + 6.0, h + 6.0, radius + 3);
                ctx.fill();

                // Outer concrete curb rim
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.roundRect(x0, z0, w, h, radius);
                ctx.fill();

                // Inner warm slate stone plaza floor (prevents blinding white blowout!)
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.roundRect(x0 + 4.5, z0 + 4.5, w - 9, h - 9, Math.max(2, radius - 2));
                ctx.fill();

                // Crisp architectural pavement tile grid
                ctx.save();
                ctx.clip();
                ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
                ctx.lineWidth = 1.1;
                const tileStep = 14;
                for (let tx = x0; tx <= x0 + w; tx += tileStep) {
                    ctx.beginPath();
                    ctx.moveTo(tx, z0);
                    ctx.lineTo(tx, z0 + h);
                    ctx.stroke();
                }
                for (let tz = z0; tz <= z0 + h; tz += tileStep) {
                    ctx.beginPath();
                    ctx.moveTo(x0, tz);
                    ctx.lineTo(x0 + w, tz);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Griffin Town & Firehouse HQ Central Plaza (Spacious multi-quadrant civic plaza)
            drawPavedPlaza(0, 15, 270, 240, 24);
            // South Harbor Cargo Port Concrete Apron (meeting South Harbor Bay Quay at z = 1186)
            drawPavedPlaza(0, 1133, 270, 110, 16);
            // West Tech & Industrial Village Plaza
            drawPavedPlaza(-1120, 25, 190, 160, 16);
            // Testing Yard Proving Grounds
            drawPavedPlaza(-1250, 65, 120, 90, 12);
            // North Observatory Research Plaza
            drawPavedPlaza(0, -1120, 170, 140, 16);
            // Dino Ridge Sanctuary Gateway Plaza
            drawPavedPlaza(-750, -750, 140, 140, 20);
            // Sunny Sands Boardwalk Seaside Plaza
            drawPavedPlaza(-750, 750, 150, 130, 18);
            // Wayward Island Ancient Ruins Plateau
            drawPavedPlaza(1960, 540, 160, 140, 22);
            // East Lighthouse Scenic Lookout Terrace
            drawPavedPlaza(1320, 60, 65, 65, 16);
            // Dr. Morocco's Secret Cliffside Lair Plaza
            drawPavedPlaza(-820, -1180, 85, 85, 18);

            // 4. Crisp Vector Inner & Outer Ring Highways + Grand Arterials
            function traceHighwayLoopPath() {
                const steps = 320;
                ctx.beginPath();
                for (let i = 0; i <= steps; i++) {
                    const theta = (i / steps) * Math.PI * 2;
                    const r = getInnerRoadRadius(theta);
                    const rx = Math.cos(theta) * r;
                    const rz = Math.sin(theta) * r;
                    if (i === 0) ctx.moveTo(rx, rz);
                    else ctx.lineTo(rx, rz);
                }
                ctx.closePath();

                for (let i = 0; i <= steps; i++) {
                    const theta = (i / steps) * Math.PI * 2;
                    const r = getOuterRoadRadius(theta);
                    const rx = Math.cos(theta) * r;
                    const rz = Math.sin(theta) * r;
                    if (i === 0) ctx.moveTo(rx, rz);
                    else ctx.lineTo(rx, rz);
                }
                ctx.closePath();
            }

            function traceTownRoadsPath() {
                ctx.beginPath();
                // Grand North-South Highway (from North Observatory at Z=-1160 to South Harbor at Z=1160)
                ctx.moveTo(0, -1160);
                ctx.lineTo(0, 1160);
                // Grand East-West Highway (from West Tech Village at X=-1160 to East Coast Highway at X=1190)
                ctx.moveTo(-1160, 25);
                ctx.lineTo(1190, 25);
                // Scenic East Lighthouse Access Road (from Outer Ring Highway at X=1180 to East Lighthouse at X=1310)
                ctx.moveTo(1180, 60);
                ctx.lineTo(1310, 60);
                // Wayward Causeway Highway, Ocean Bridge, and Island Road (from Outer Ring Highway at X=1120 to Wayward Ruins at X=1900)
                ctx.moveTo(1120, 540);
                ctx.lineTo(1900, 540);
                // Dr. Morocco Lair Access Road (from Outer Ring Highway at -619.3, -1083.8 to Morocco Cliffside Lair at -820, -1180)
                ctx.moveTo(-619.3, -1083.8);
                ctx.lineTo(-820, -1180);
            }

            // Layer 4A: Outer Black Ink Road Curb Outline
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 28.0;
            traceHighwayLoopPath();
            ctx.stroke();
            traceTownRoadsPath();
            ctx.stroke();

            // Layer 4B: Light Concrete Sidewalk / Shoulder Curbs
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 24.5;
            traceHighwayLoopPath();
            ctx.stroke();
            traceTownRoadsPath();
            ctx.stroke();

            // Layer 4C: Inner Curb Ink Line
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 20.2;
            traceHighwayLoopPath();
            ctx.stroke();
            traceTownRoadsPath();
            ctx.stroke();

            // Layer 4D: Rich Charcoal-Slate Asphalt Roadway
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 18.2;
            traceHighwayLoopPath();
            ctx.stroke();
            traceTownRoadsPath();
            ctx.stroke();

            // Layer 4E: Crisp Dashed Yellow Highway Centerlines
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.6;
            ctx.setLineDash([9.0, 9.0]);
            traceHighwayLoopPath();
            ctx.stroke();
            traceTownRoadsPath();
            ctx.stroke();
            ctx.setLineDash([]);

            // Layer 4F: Crisp White Pedestrian Zebra Crosswalks in Griffin Town & HQ
            function drawCrosswalk(cx, cz, horizontal) {
                ctx.fillStyle = '#f8fafc';
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 0.35;
                for (let s = -5.5; s <= 5.5; s += 2.2) {
                    if (horizontal) {
                        ctx.fillRect(cx + s - 0.65, cz - 2.2, 1.3, 4.4);
                        ctx.strokeRect(cx + s - 0.65, cz - 2.2, 1.3, 4.4);
                    } else {
                        ctx.fillRect(cx - 2.2, cz + s - 0.65, 4.4, 1.3);
                        ctx.strokeRect(cx - 2.2, cz + s - 0.65, 4.4, 1.3);
                    }
                }
            }
            drawCrosswalk(0, 12, true);
            drawCrosswalk(0, 38, true);
            drawCrosswalk(-14, 25, false);
            drawCrosswalk(14, 25, false);

            ctx.restore();

            const tex = new THREE.CanvasTexture(c);
            tex.anisotropy = (typeof window !== 'undefined' && window.renderer && window.renderer.capabilities) ? window.renderer.capabilities.getMaxAnisotropy() : 4;
            tex.needsUpdate = true;
            return tex;
        }


export function buildTerrainMesh(scene) {
    const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 360, 360);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        posAttr.setY(i, getTerrainHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainTexture = createHighResTerrainTexture();
    terrainMesh = new THREE.Mesh(
        terrainGeo,
        new THREE.MeshToonMaterial({
            map: terrainTexture,
            gradientMap: toonGrad3
        })
    );
    terrainMesh.receiveShadow = true;
    if (scene) scene.add(terrainMesh);

    // Cel-Shaded Cartoon Ocean Water Plane + Animated White Foam Ripples (Scaled for 10X World)
    waterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(8200, 8200, 32, 32).rotateX(-Math.PI / 2),
        new THREE.MeshToonMaterial({
            color: 0x00b4d8,
            gradientMap: toonGrad3
        })
    );
    waterMesh.position.y = -0.45;
    if (scene) scene.add(waterMesh);

    // Cartoon Shoreline Foam Ring around Griffin Rock Island
    shorelineFoamRing = new THREE.Mesh(
        new THREE.RingGeometry(1635, 1665, 96).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    shorelineFoamRing.position.y = -0.25;
    if (scene) scene.add(shorelineFoamRing);

    if (typeof window !== 'undefined') {
        window.terrainMesh = terrainMesh;
        window.waterMesh = waterMesh;
        window.shorelineFoamRing = shorelineFoamRing;
    }

    return { terrainMesh, waterMesh, shorelineFoamRing };
}

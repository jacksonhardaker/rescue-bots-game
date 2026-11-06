// Procedural Canvas Textures for Cel-Shaded Rescue Bots & World Assets
import * as THREE from "three";

export function makeHazardStripeTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 64;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = '#0f172a';
            for (let x = -64; x < 320; x += 32) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + 18, 0);
                ctx.lineTo(x - 14, 64);
                ctx.lineTo(x - 32, 64);
                ctx.closePath();
                ctx.fill();
            }
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.strokeRect(0, 0, 256, 64);
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        export function makeGrilleTexture() {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = '#0f172a';
            for (let y = 16; y < 112; y += 16) {
                ctx.fillRect(14, y, 100, 8);
            }
            // Cartoon highlight slash
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.moveTo(20, 12);
            ctx.lineTo(44, 12);
            ctx.lineTo(24, 116);
            ctx.lineTo(14, 116);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 118, 118);
            return new THREE.CanvasTexture(c);
        }

        // TV-Show Accurate Rescue Bots Autobot/Cog Shield Sigil with Bold Ink Outlines
        export function makeRescueEmblemTexture(bgHex = '#e81e25', accentHex = '#ffcc00') {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = bgHex;
            ctx.fillRect(0, 0, 128, 128);

            // Outer Cartoon Cog / Shield
            ctx.fillStyle = accentHex;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.arc(64, 64, 52, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner Crisp White Disc
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(64, 64, 38, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Bold Red Rescue Star / Cross with Ink Border
            ctx.fillStyle = '#e81e25';
            ctx.fillRect(52, 30, 24, 68);
            ctx.fillRect(30, 52, 68, 24);
            ctx.strokeRect(52, 30, 24, 68);
            ctx.strokeRect(30, 52, 68, 24);
            ctx.fillRect(55, 33, 18, 62);
            ctx.fillRect(33, 55, 62, 18);

            // Outer Panel Border
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 120, 120);
            return new THREE.CanvasTexture(c);
        }

        export function makeHelipadTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 14;
            ctx.strokeRect(7, 7, 242, 242);

            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(128, 128, 98, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(128, 128, 105, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(76, 64, 26, 128);
            ctx.fillRect(154, 64, 26, 128);
            ctx.fillRect(76, 115, 104, 26);
            return new THREE.CanvasTexture(c);
        }

        // TV Show Accurate Cartoon Visor & Faceplate Textures for the 4 Rescue Bots
        export function makeBoulderFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Silver-gray metallic faceplate base
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(0, 0, 256, 256);

            // Chartreuse / Lime Green Upper Forehead Band
            ctx.fillStyle = '#76d31b';
            ctx.fillRect(0, 0, 256, 42);
            ctx.fillStyle = '#15803d';
            ctx.fillRect(0, 40, 256, 6);

            // Dark Charcoal Eye Visor Socket Recess
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(18, 54, 220, 84, 16); else ctx.rect(18, 54, 220, 84);
            ctx.fill();

            // Friendly Rounded Cyan-Blue Cartoon Optics (Matching TV Show)
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(80, 96, 32, 0, Math.PI * 2);
            ctx.arc(176, 96, 32, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(80, 96, 26, 0, Math.PI * 2);
            ctx.arc(176, 96, 26, 0, Math.PI * 2);
            ctx.fill();

            // Cartoon White Glint Reflections
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(72, 86, 10, 0, Math.PI * 2);
            ctx.arc(168, 86, 10, 0, Math.PI * 2);
            ctx.arc(90, 106, 4, 0, Math.PI * 2);
            ctx.arc(186, 106, 4, 0, Math.PI * 2);
            ctx.fill();

            // Friendly Warm Cartoon Smile
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(68, 178);
            ctx.quadraticCurveTo(128, 206, 188, 178);
            ctx.stroke();

            // Smile Corner Creases
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(64, 172); ctx.lineTo(70, 184);
            ctx.moveTo(192, 172); ctx.lineTo(186, 184);
            ctx.stroke();

            // Rounded Chin Guard Plate Line
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(84, 224, 88, 28, 8); else ctx.rect(84, 224, 88, 28);
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Outer Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeHeatwaveFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Silver metallic faceplate
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(0, 0, 256, 256);

            // Dark Crimson Helmet Under-Brim Shadow
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(0, 0, 256, 46);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 44, 256, 8);

            // Angled Dark Slate Visor Frame
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(14, 52);
            ctx.lineTo(242, 52);
            ctx.lineTo(230, 134);
            ctx.lineTo(128, 142);
            ctx.lineTo(26, 134);
            ctx.closePath();
            ctx.fill();

            // Glowing Cartoon Cyan-Blue Visor! (Accurate to Cartoon Source Image)
            const grad = ctx.createLinearGradient(0, 58, 0, 132);
            grad.addColorStop(0, '#22d3ee');
            grad.addColorStop(0.5, '#06b6d4');
            grad.addColorStop(1, '#0284c7');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(22, 60);
            ctx.lineTo(234, 60);
            ctx.lineTo(224, 126);
            ctx.lineTo(128, 134);
            ctx.lineTo(32, 126);
            ctx.closePath();
            ctx.fill();

            // Sharp Diagonal White Toon Visor Reflections
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.moveTo(56, 60); ctx.lineTo(88, 60);
            ctx.lineTo(64, 128); ctx.lineTo(36, 128);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(102, 60); ctx.lineTo(118, 60);
            ctx.lineTo(96, 132); ctx.lineTo(82, 132);
            ctx.closePath();
            ctx.fill();

            // Heroic Mouthplate with 3 Distinct Horizontal Vent Slots (Matching Cartoon)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(64, 160, 128, 62);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.strokeRect(64, 160, 128, 62);

            ctx.fillStyle = '#0f172a';
            [170, 185, 200].forEach(vy => {
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(76, vy, 104, 8, 4); else ctx.rect(76, vy, 104, 8);
                ctx.fill();
            });

            // Heroic Chin Guard
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(96, 230); ctx.lineTo(160, 230);
            ctx.stroke();

            // Outer Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeChaseFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Crisp White-Silver Police Faceplate
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, 256, 256);

            // Police Blue Helmet Brow Band & Gold Trim
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(0, 0, 256, 42);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(0, 40, 256, 6);

            // Dark Charcoal Visor Housing
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(22, 54, 212, 78, 10); else ctx.rect(22, 54, 212, 78);
            ctx.fill();

            // Police Blue / Cyan Visor Bar
            const grad = ctx.createLinearGradient(0, 60, 0, 124);
            grad.addColorStop(0, '#60a5fa');
            grad.addColorStop(0.4, '#38bdf8');
            grad.addColorStop(1, '#0284c7');
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(30, 62, 196, 62, 8); else ctx.rect(30, 62, 196, 62);
            ctx.fill();

            // White Toon Glints
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.moveTo(60, 62); ctx.lineTo(95, 62);
            ctx.lineTo(72, 124); ctx.lineTo(42, 124);
            ctx.closePath();
            ctx.fill();

            // Disciplined Serious Police Mouth Line
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(76, 186); ctx.lineTo(180, 186);
            ctx.stroke();

            // Subdued Chin Cleft & Officer Jaw Seams
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(128, 196); ctx.lineTo(128, 228);
            ctx.moveTo(88, 230); ctx.lineTo(168, 230);
            ctx.stroke();

            // Outer Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeBladesFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Light Silver Metallic Faceplate
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(0, 0, 256, 256);

            // Orange Flight Helmet Brow Band
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(0, 0, 256, 42);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 40, 256, 6);

            // Dark Goggle Frame
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(16, 52, 224, 88, 22); else ctx.rect(16, 52, 224, 88);
            ctx.fill();

            // Neon Cyan-Green Aviator Visor Goggles! (Accurate to Cartoon Source Image)
            const grad = ctx.createLinearGradient(0, 58, 0, 134);
            grad.addColorStop(0, '#34d399');
            grad.addColorStop(0.5, '#2dd4bf');
            grad.addColorStop(1, '#0d9488');
            ctx.fillStyle = grad;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(24, 60, 208, 72, 16); else ctx.rect(24, 60, 208, 72);
            ctx.fill();

            // Dual Bright White Aviator Glints
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.moveTo(56, 60); ctx.lineTo(90, 60);
            ctx.lineTo(66, 132); ctx.lineTo(38, 132);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(150, 60); ctx.lineTo(184, 60);
            ctx.lineTo(160, 132); ctx.lineTo(132, 132);
            ctx.closePath();
            ctx.fill();

            // Eager Youthful Friendly Smile
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(74, 182);
            ctx.quadraticCurveTo(128, 212, 182, 182);
            ctx.stroke();

            // Smile dimples / creases
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(70, 176); ctx.lineTo(76, 188);
            ctx.moveTo(186, 176); ctx.lineTo(180, 188);
            ctx.stroke();

            // Clean Youthful Chin Plate
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(102, 226); ctx.lineTo(154, 226);
            ctx.stroke();

            // Outer Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        // Cartoon glossy windshield with diagonal white toon reflection band
        export function makeCartoonWindshieldTexture(tintHex = '#38bdf8') {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = tintHex;
            ctx.fillRect(8, 8, 112, 112);

            // Diagonal Cartoon Glass Glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.beginPath();
            ctx.moveTo(22, 8);
            ctx.lineTo(54, 8);
            ctx.lineTo(24, 120);
            ctx.lineTo(8, 120);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(66, 8);
            ctx.lineTo(80, 8);
            ctx.lineTo(50, 120);
            ctx.lineTo(36, 120);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(4, 4, 120, 120);
            return new THREE.CanvasTexture(c);
        }

        // Canonical TV Show Cartoon Face Textures for Visiting Autobot Allies
        export function makeOptimusFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Deep Metallic Blue Helmet Faceplate Backing
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(0, 0, 256, 256);

            // Silver Forehead Crest & Central Fin
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(108, 0); ctx.lineTo(148, 0);
            ctx.lineTo(140, 56); ctx.lineTo(116, 56);
            ctx.closePath();
            ctx.fill();

            // Dark Brow Frame
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(36, 52, 184, 18);

            // Iconic Glowing Cyan Optics / Visor
            const eyeGrad = ctx.createLinearGradient(0, 68, 0, 112);
            eyeGrad.addColorStop(0, '#67e8f9');
            eyeGrad.addColorStop(1, '#06b6d4');
            ctx.fillStyle = eyeGrad;
            // Dual angled optics
            ctx.beginPath();
            ctx.moveTo(46, 72); ctx.lineTo(114, 72);
            ctx.lineTo(108, 106); ctx.lineTo(52, 106);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(142, 72); ctx.lineTo(210, 72);
            ctx.lineTo(204, 106); ctx.lineTo(148, 106);
            ctx.closePath();
            ctx.fill();

            // Bright White Optical Glints
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(58, 76, 18, 10);
            ctx.fillRect(154, 76, 18, 10);

            // Iconic Silver Battle Mask / Faceplate
            const maskGrad = ctx.createLinearGradient(0, 116, 0, 256);
            maskGrad.addColorStop(0, '#f8fafc');
            maskGrad.addColorStop(0.5, '#cbd5e1');
            maskGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = maskGrad;
            ctx.beginPath();
            ctx.moveTo(38, 118);
            ctx.lineTo(218, 118);
            ctx.lineTo(198, 240);
            ctx.lineTo(128, 252);
            ctx.lineTo(58, 240);
            ctx.closePath();
            ctx.fill();

            // Central Vertical Mask Ridge
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(128, 118);
            ctx.lineTo(128, 250);
            ctx.stroke();

            // Sloped Cheek Vent Grooves
            ctx.lineWidth = 4;
            [145, 175, 205].forEach(y => {
                ctx.beginPath();
                ctx.moveTo(76, y); ctx.lineTo(112, y + 8);
                ctx.moveTo(180, y); ctx.lineTo(144, y + 8);
                ctx.stroke();
            });

            // Outer Dark Cartoon Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeBumblebeeFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Vibrant Bumblebee Yellow Helmet Face Backing
            const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
            bgGrad.addColorStop(0, '#fde047');
            bgGrad.addColorStop(0.4, '#facc15');
            bgGrad.addColorStop(1, '#eab308');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Double Curved Black Racing Stripes down Helmet Forehead & Crown
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(86, 0); ctx.lineTo(112, 0);
            ctx.lineTo(108, 64); ctx.lineTo(82, 64);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(144, 0); ctx.lineTo(170, 0);
            ctx.lineTo(174, 64); ctx.lineTo(148, 64);
            ctx.closePath();
            ctx.fill();

            // Ear Pods on Left & Right with 3 Horizontal Black Louver Slats
            [-1, 1].forEach(side => {
                const ex = side === -1 ? 0 : 220;
                ctx.fillStyle = '#eab308';
                ctx.fillRect(ex, 90, 36, 75);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3;
                ctx.strokeRect(ex, 90, 36, 75);

                ctx.fillStyle = '#0f172a';
                [102, 122, 142].forEach(ly => {
                    ctx.fillRect(ex + 4, ly, 28, 6);
                });
            });

            // Smooth Pale Silver / Light Grey Faceplate
            const faceGrad = ctx.createLinearGradient(0, 64, 0, 230);
            faceGrad.addColorStop(0, '#f8fafc');
            faceGrad.addColorStop(0.5, '#e2e8f0');
            faceGrad.addColorStop(1, '#cbd5e1');
            ctx.fillStyle = faceGrad;
            ctx.beginPath();
            ctx.moveTo(40, 68); ctx.lineTo(216, 68);
            ctx.lineTo(200, 204); ctx.lineTo(128, 240); ctx.lineTo(56, 204);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Expressive Large Inward-Slanted Cyan Optics with Black Mask Borders
            [-1, 1].forEach(side => {
                const ox = 128 + side * 44;
                const oy = 118;

                // Black outer almond/trapezoid eye mask
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.moveTo(ox - side * 28, oy - 18);
                ctx.lineTo(ox + side * 26, oy - 12);
                ctx.lineTo(ox + side * 22, oy + 22);
                ctx.lineTo(ox - side * 24, oy + 16);
                ctx.closePath();
                ctx.fill();

                // Luminous Cyan Pupil Iris
                const eyeGrad = ctx.createRadialGradient(ox - side * 4, oy - 2, 2, ox, oy, 20);
                eyeGrad.addColorStop(0, '#a5f3fc');
                eyeGrad.addColorStop(0.5, '#22d3ee');
                eyeGrad.addColorStop(1, '#0891b2');
                ctx.fillStyle = eyeGrad;
                ctx.beginPath();
                ctx.arc(ox, oy, 16, 0, Math.PI * 2);
                ctx.fill();

                // Bright White Highlight Glints
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ox - 5, oy - 5, 5.5, 0, Math.PI * 2);
                ctx.arc(ox + 5, oy + 5, 2.8, 0, Math.PI * 2);
                ctx.fill();
            });

            // Prominent Yellow Chevron Chin-Guard / Jaw Framing
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(68, 172);
            ctx.lineTo(128, 198);
            ctx.lineTo(188, 172);
            ctx.lineTo(194, 212);
            ctx.lineTo(128, 248);
            ctx.lineTo(62, 212);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Black Triangular Mouth Vent
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(112, 192);
            ctx.lineTo(144, 192);
            ctx.lineTo(128, 218);
            ctx.closePath();
            ctx.fill();

            // Outer Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 250, 250);
            return new THREE.CanvasTexture(c);
        }

        export function makeBumblebeeChestTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Bright Yellow Hood
            const hoodGrad = ctx.createLinearGradient(0, 0, 0, 256);
            hoodGrad.addColorStop(0, '#fde047');
            hoodGrad.addColorStop(0.5, '#facc15');
            hoodGrad.addColorStop(1, '#eab308');
            ctx.fillStyle = hoodGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Arched Cyan Windshield Header at Top
            const glassGrad = ctx.createLinearGradient(0, 0, 0, 52);
            glassGrad.addColorStop(0, '#67e8f9');
            glassGrad.addColorStop(0.6, '#06b6d4');
            glassGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.moveTo(16, 48);
            ctx.quadraticCurveTo(128, 10, 240, 48);
            ctx.lineTo(246, 12);
            ctx.quadraticCurveTo(128, -8, 10, 12);
            ctx.closePath();
            ctx.fill();

            // Central Black Windshield Divider Pillar with Yellow Trim
            ctx.fillStyle = '#facc15';
            ctx.fillRect(120, 0, 16, 56);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(123, 0, 10, 56);

            // Bold Twin Black Racing Stripes down Hood (Screen Accurate to Rescue Bots Image 2!)
            ctx.fillStyle = '#0f172a';
            // Left racing stripe
            ctx.beginPath();
            ctx.moveTo(42, 50); ctx.lineTo(82, 50);
            ctx.lineTo(88, 220); ctx.lineTo(36, 220);
            ctx.closePath();
            ctx.fill();

            // Right racing stripe
            ctx.beginPath();
            ctx.moveTo(174, 50); ctx.lineTo(214, 50);
            ctx.lineTo(220, 220); ctx.lineTo(168, 220);
            ctx.closePath();
            ctx.fill();

            // Center Raised Cowl Induction Scoop with Horizontal Silver Louvers
            ctx.fillStyle = '#fde047';
            ctx.fillRect(92, 52, 72, 138);
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(92, 52, 72, 138);

            // Silver cooling louvers inside scoop
            [68, 86, 104, 122, 140, 158].forEach(ly => {
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(98, ly, 60, 6);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(98, ly + 6, 60, 3);
            });

            // Bold Red Autobot Shield Insignia centered at front of hood
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(128, 206, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(128, 206, 17, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(116, 194); ctx.lineTo(140, 194);
            ctx.lineTo(140, 210); ctx.lineTo(134, 216);
            ctx.lineTo(128, 222); ctx.lineTo(122, 216);
            ctx.lineTo(116, 210);
            ctx.closePath();
            ctx.fill();
            // Optics cutouts
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(119, 199, 4, 6);
            ctx.fillRect(133, 199, 4, 6);
            ctx.fillRect(126, 202, 4, 12);

            // Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 250, 250);
            return new THREE.CanvasTexture(c);
        }

        export function makeBumblebeeWingTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Bright Yellow Car Door Body
            const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
            bgGrad.addColorStop(0, '#fde047');
            bgGrad.addColorStop(0.5, '#facc15');
            bgGrad.addColorStop(1, '#eab308');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Inset Tinted Cyan Coupe Window
            const winGrad = ctx.createLinearGradient(0, 15, 0, 130);
            winGrad.addColorStop(0, '#67e8f9');
            winGrad.addColorStop(0.5, '#0284c7');
            winGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = winGrad;
            ctx.beginPath();
            ctx.moveTo(35, 20);
            ctx.lineTo(225, 45);
            ctx.lineTo(225, 130);
            ctx.lineTo(35, 130);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Matte Black Racing Stripe along side flank
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(20, 142, 216, 38);

            // Chrome door handle
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(175, 150, 42, 8);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.strokeRect(175, 150, 42, 8);

            // Matte Black Lower Rocker Skirt
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 228, 256, 28);

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 250, 250);
            return new THREE.CanvasTexture(c);
        }

        export function makeBumblebeeShinTexture() {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 256;
            const ctx = c.getContext('2d');

            // Bright Yellow Shin Armor
            ctx.fillStyle = '#facc15';
            ctx.fillRect(0, 0, 128, 256);

            // Silver Knee Top Section
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(16, 12, 96, 28);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.strokeRect(16, 12, 96, 28);

            // 3 Recessed Black Louver Vent Slats
            const louverY = [70, 115, 160];
            louverY.forEach(ly => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.moveTo(24, ly);
                ctx.lineTo(104, ly);
                ctx.lineTo(96, ly + 28);
                ctx.lineTo(32, ly + 28);
                ctx.closePath();
                ctx.fill();

                // Chrome slat edge
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(30, ly + 4, 68, 4);
                ctx.fillRect(34, ly + 14, 60, 4);
            });

            // Lower Boot Trim
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(12, 224, 104, 24);

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.strokeRect(2, 2, 124, 252);
            return new THREE.CanvasTexture(c);
        }

        export function makeBumblebeeWheelTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Dark Charcoal Tire Rubber
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(128, 128, 124, 0, Math.PI * 2);
            ctx.fill();

            // Tire Tread Grooves
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(128, 128, 112, 0, Math.PI * 2);
            ctx.stroke();

            // Silver Mag Wheel Rim
            const rimGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 96);
            rimGrad.addColorStop(0, '#ffffff');
            rimGrad.addColorStop(0.5, '#cbd5e1');
            rimGrad.addColorStop(1, '#64748b');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(128, 128, 96, 0, Math.PI * 2);
            ctx.fill();

            // 5-Spoke Star Design
            ctx.fillStyle = '#0f172a';
            for (let i = 0; i < 5; i++) {
                const a1 = (i / 5) * Math.PI * 2 + 0.15;
                const a2 = ((i + 1) / 5) * Math.PI * 2 - 0.15;
                ctx.beginPath();
                ctx.moveTo(128, 128);
                ctx.arc(128, 128, 85, a1, a2);
                ctx.closePath();
                ctx.fill();
            }

            // Center Wheel Cap & Lug Nuts
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(128, 128, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(128, 128, 8, 0, Math.PI * 2);
            ctx.fill();

            return new THREE.CanvasTexture(c);
        }

        export function makeBlurrFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Purple Speedster Helmet Frame
            const helmGrad = ctx.createLinearGradient(0, 0, 0, 256);
            helmGrad.addColorStop(0, '#8b5cf6');
            helmGrad.addColorStop(0.3, '#7c3aed');
            helmGrad.addColorStop(1, '#6d28d9');
            ctx.fillStyle = helmGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Silver Trapezoid Vent in Center Crown (As seen in Reference Photo 4)
            const ventGrad = ctx.createLinearGradient(0, 0, 0, 52);
            ventGrad.addColorStop(0, '#ffffff');
            ventGrad.addColorStop(1, '#cbd5e1');
            ctx.fillStyle = ventGrad;
            ctx.beginPath();
            ctx.moveTo(116, 2); ctx.lineTo(140, 2);
            ctx.lineTo(134, 48); ctx.lineTo(122, 48);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Slat cutouts in center vent
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            [14, 26, 38].forEach(vy => {
                ctx.beginPath();
                ctx.moveTo(122, vy); ctx.lineTo(134, vy);
                ctx.stroke();
            });

            // Twin Bright Neon-Green Racing Pinstripes Flanking Center Vent (Exact TV Show Look!)
            const stripeGrad = ctx.createLinearGradient(0, 0, 0, 56);
            stripeGrad.addColorStop(0, '#4ade80');
            stripeGrad.addColorStop(1, '#22c55e');

            [-1, 1].forEach(side => {
                const sx = 128 + side * 42;
                ctx.fillStyle = stripeGrad;
                ctx.beginPath();
                ctx.moveTo(sx - 10, 0); ctx.lineTo(sx + 10, 0);
                ctx.lineTo(sx + 8, 54); ctx.lineTo(sx - 8, 54);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3.5;
                ctx.stroke();
            });

            // Cylindrical Silver Ear Communication Pods (Left & Right)
            [-1, 1].forEach(side => {
                const ex = side === -1 ? 16 : 240;
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.arc(ex, 102, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.arc(ex, 102, 6, 0, Math.PI * 2);
                ctx.fill();
            });

            // Sleek Swept Visor Frame
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(24, 52); ctx.lineTo(232, 52);
            ctx.lineTo(214, 134); ctx.lineTo(42, 134);
            ctx.closePath();
            ctx.fill();

            // Wide Curved Cyan Visor Lens
            const visGrad = ctx.createLinearGradient(0, 56, 0, 130);
            visGrad.addColorStop(0, '#a5f3fc');
            visGrad.addColorStop(0.3, '#38bdf8');
            visGrad.addColorStop(0.8, '#06b6d4');
            visGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = visGrad;
            ctx.beginPath();
            ctx.moveTo(32, 58); ctx.lineTo(224, 58);
            ctx.lineTo(208, 128); ctx.lineTo(48, 128);
            ctx.closePath();
            ctx.fill();

            // Glowing Amber/Cyan Eye Optics Visible Behind Translucent Visor (TV Show Detail!)
            [-1, 1].forEach(side => {
                const ox = 128 + side * 44;
                const eyeGrad = ctx.createRadialGradient(ox, 94, 2, ox, 94, 18);
                eyeGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
                eyeGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.7)');
                eyeGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
                ctx.fillStyle = eyeGrad;
                ctx.beginPath();
                ctx.ellipse(ox, 94, 18, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            });

            // Speed Glare Diagonal Flares across Visor
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.moveTo(82, 58); ctx.lineTo(108, 58); ctx.lineTo(84, 128); ctx.lineTo(58, 128);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(172, 58); ctx.lineTo(196, 58); ctx.lineTo(174, 128); ctx.lineTo(150, 128);
            ctx.closePath();
            ctx.fill();

            // Silver Sculpted Faceplate & Jaw (Sharp Speedster Chin)
            const jawGrad = ctx.createLinearGradient(0, 132, 0, 248);
            jawGrad.addColorStop(0, '#f8fafc');
            jawGrad.addColorStop(0.65, '#e2e8f0');
            jawGrad.addColorStop(1, '#cbd5e1');
            ctx.fillStyle = jawGrad;
            ctx.beginPath();
            ctx.moveTo(50, 134); ctx.lineTo(206, 134);
            ctx.lineTo(184, 236); ctx.lineTo(128, 248); ctx.lineTo(72, 236);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Enthusiastic Speedster Smile
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(88, 182);
            ctx.quadraticCurveTo(128, 216, 168, 182);
            ctx.quadraticCurveTo(128, 196, 88, 182);
            ctx.closePath();
            ctx.fill();

            // White Teeth Flash
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(96, 184);
            ctx.lineTo(160, 184);
            ctx.quadraticCurveTo(128, 195, 96, 184);
            ctx.closePath();
            ctx.fill();

            // Chin Notch Crease
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(128, 222); ctx.lineTo(128, 242);
            ctx.stroke();

            // Heavy Cartoon Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        // Blurr Chest Panel: Royal Purple with Crisp White Racing Stripe, White Collar & Oval Cyan Canopy Window
        export function makeBlurrChestTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Purple Chest Panel
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(0, 0, 256, 256);

            // Bold Crisp White Center Racing Stripe
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(106, 0, 44, 256);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.strokeRect(106, 0, 44, 256);

            // White Collar Yoke Arch at Top
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(16, 0); ctx.lineTo(240, 0);
            ctx.lineTo(218, 44); ctx.quadraticCurveTo(128, 62, 38, 44);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Green Autobot Shield Badge
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.moveTo(128, 38);
            ctx.lineTo(144, 48);
            ctx.lineTo(138, 72);
            ctx.lineTo(128, 80);
            ctx.lineTo(118, 72);
            ctx.lineTo(112, 48);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Oval / Capsule Cyan Cockpit Canopy Window
            const cy = 168;
            const rx = 62;
            const ry = 54;
            // Outer White Trim
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(128, cy, rx + 10, ry + 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Cyan Cockpit Glass
            const glassGrad = ctx.createRadialGradient(114, cy - 18, 8, 128, cy, rx);
            glassGrad.addColorStop(0, '#a5f3fc');
            glassGrad.addColorStop(0.35, '#38bdf8');
            glassGrad.addColorStop(0.75, '#06b6d4');
            glassGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.ellipse(128, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Curved Glare Highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.ellipse(116, cy - 20, 32, 14, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Heavy Cartoon Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        // Blurr Shoulder: Royal Purple with Bold Crisp White Speed Lightning Bolt
        export function makeBlurrShoulderTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Purple Shoulder Background
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(0, 0, 256, 256);

            // Bold White Speed Lightning Bolt (Exact TV Show Graphic!)
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 7;
            ctx.lineJoin = 'miter';
            ctx.beginPath();
            ctx.moveTo(148, 18);
            ctx.lineTo(84, 122);
            ctx.lineTo(136, 122);
            ctx.lineTo(92, 240);
            ctx.lineTo(184, 108);
            ctx.lineTo(138, 108);
            ctx.lineTo(180, 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner Lightning Highlight Accent
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.moveTo(148, 30);
            ctx.lineTo(100, 116);
            ctx.lineTo(132, 116);
            ctx.lineTo(106, 205);
            ctx.lineTo(168, 114);
            ctx.lineTo(138, 114);
            ctx.lineTo(166, 30);
            ctx.closePath();
            ctx.fill();

            // Heavy Cartoon Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        // Blurr Shin: Royal Purple with Triple Segmented Neon-Green Speed Lightbars
        export function makeBlurrShinTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Purple Shin Panel
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(0, 0, 256, 256);

            // Angled Cyan / Silver Speed Housing Frame
            const frameGrad = ctx.createLinearGradient(0, 20, 0, 236);
            frameGrad.addColorStop(0, '#38bdf8');
            frameGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = frameGrad;
            ctx.beginPath();
            ctx.moveTo(42, 24); ctx.lineTo(214, 24);
            ctx.lineTo(228, 228); ctx.lineTo(28, 228);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Inner Charcoal Lamp Housing Cavity
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(56, 34); ctx.lineTo(200, 34);
            ctx.lineTo(214, 218); ctx.lineTo(42, 218);
            ctx.closePath();
            ctx.fill();

            // Triple Segmented Glowing Neon-Green Speed Lightbars
            const segY = [44, 102, 160];
            const segH = 46;
            segY.forEach((sy, idx) => {
                const segGrad = ctx.createLinearGradient(0, sy, 0, sy + segH);
                segGrad.addColorStop(0, '#bbf7d0');
                segGrad.addColorStop(0.3, '#4ade80');
                segGrad.addColorStop(1, '#16a34a');
                ctx.fillStyle = segGrad;
                const inset = idx * 4;
                ctx.fillRect(64 - inset, sy, 128 + inset * 2, segH);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 4;
                ctx.strokeRect(64 - inset, sy, 128 + inset * 2, segH);

                // Glow Core
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(74 - inset, sy + 6, 24, 12);
            });

            // Heavy Cartoon Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        // Blurr Multi-Blade Turbine Fan Wheel Texture (Neon Green Rims & Hubs)
        export function makeBlurrTurbineWheelTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Dark Charcoal Tire Recess
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 256, 256);

            // Electric Neon-Green Outer Rim Lip Ring
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.arc(128, 128, 110, 0, Math.PI * 2);
            ctx.stroke();

            // Black Inset Ring
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(128, 128, 100, 0, Math.PI * 2);
            ctx.stroke();

            // Recessed Dark Steel Cavity
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(128, 128, 98, 0, Math.PI * 2);
            ctx.fill();

            // 10 Radial Angled Multi-Blade Turbine Fan Blades (Exact TV Show Look!)
            const numBlades = 10;
            for (let i = 0; i < numBlades; i++) {
                const angle = (i * 2 * Math.PI) / numBlades;
                ctx.save();
                ctx.translate(128, 128);
                ctx.rotate(angle);

                // Turbine blade polygon
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.moveTo(0, -32);
                ctx.lineTo(24, -94);
                ctx.lineTo(44, -92);
                ctx.lineTo(12, -32);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Blade highlight
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.moveTo(8, -32);
                ctx.lineTo(28, -93);
                ctx.lineTo(34, -93);
                ctx.lineTo(12, -32);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            // Neon-Green Center Turbine Hub
            const hubGrad = ctx.createRadialGradient(122, 122, 4, 128, 128, 36);
            hubGrad.addColorStop(0, '#86efac');
            hubGrad.addColorStop(0.5, '#22c55e');
            hubGrad.addColorStop(1, '#15803d');
            ctx.fillStyle = hubGrad;
            ctx.beginPath();
            ctx.arc(128, 128, 34, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Silver Center Bullet Dome
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(128, 128, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.stroke();

            return new THREE.CanvasTexture(c);
        }

        export function makeSalvageFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Helmet Crown & Frame: Vibrant Electric Lime-Green / Chartreuse (Matches TV Show)
            ctx.fillStyle = '#cbf827';
            ctx.fillRect(0, 0, 256, 256);

            // Silver / Light Steel Brow Band
            const browGrad = ctx.createLinearGradient(0, 18, 0, 74);
            browGrad.addColorStop(0, '#f1f5f9');
            browGrad.addColorStop(0.5, '#cbd5e1');
            browGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = browGrad;
            ctx.fillRect(20, 24, 216, 48);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.strokeRect(20, 24, 216, 48);

            // Center Brow Notch
            ctx.fillStyle = '#64748b';
            ctx.fillRect(116, 32, 24, 32);

            // Dark Charcoal Eye Visor Socket
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(26, 76, 204, 56);

            // Glowing Warm Amber/Orange Optics (Show-Accurate Salvage Eyes)
            const eyeGrad = ctx.createLinearGradient(0, 80, 0, 126);
            eyeGrad.addColorStop(0, '#fef08a');
            eyeGrad.addColorStop(0.35, '#f59e0b');
            eyeGrad.addColorStop(1, '#d97706');

            [-1, 1].forEach(side => {
                const ex = 128 + side * 46;
                ctx.fillStyle = eyeGrad;
                ctx.fillRect(ex - 28, 82, 56, 44);

                // Bright cartoon eye glint
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ex - 12, 88, 14, 14);
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(ex + 4, 96, 8, 8);
            });

            // Metallic Silver Face Plate & Sculpted Nose Bridge
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(116, 132); ctx.lineTo(140, 132);
            ctx.lineTo(134, 154); ctx.lineTo(122, 154);
            ctx.closePath();
            ctx.fill();

            // Silver Steel Mouthplate
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(48, 148, 160, 40);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            [158, 170, 182].forEach(my => {
                ctx.beginPath();
                ctx.moveTo(68, my); ctx.lineTo(188, my);
                ctx.stroke();
            });

            // Massive Electric Lime-Green Chin Guard / Jaw Frame
            ctx.fillStyle = '#cbf827';
            ctx.beginPath();
            ctx.moveTo(24, 178); ctx.lineTo(232, 178);
            ctx.lineTo(216, 248); ctx.lineTo(40, 248);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Center Chin Slats
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(104, 196, 48, 44);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.strokeRect(104, 196, 48, 44);
            [210, 226].forEach(cy => {
                ctx.beginPath();
                ctx.moveTo(112, cy); ctx.lineTo(144, cy);
                ctx.stroke();
            });

            // Outer Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        // Chest Plate Texture: Electric Lime-Green with Iconic 3-Arrow Universal Recycling Symbol
        export function makeSalvageChestTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Vibrant Electric Lime-Green Background
            ctx.fillStyle = '#cbf827';
            ctx.fillRect(0, 0, 256, 256);

            // Dark Green Triangular Recycling Arrows (Universal Recycling Symbol ♻)
            ctx.fillStyle = '#15803d';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 142px sans-serif';
            ctx.fillText('♻', 128, 134);

            // Subtle green border accents
            ctx.strokeStyle = '#4d7c0f';
            ctx.lineWidth = 6;
            ctx.strokeRect(12, 12, 232, 232);

            // Heavy Cartoon Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeHighTideFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Blue Maritime Autobot Helmet
            const helmGrad = ctx.createLinearGradient(0, 0, 0, 256);
            helmGrad.addColorStop(0, '#2563eb');
            helmGrad.addColorStop(0.4, '#1d4ed8');
            helmGrad.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = helmGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Center Forehead Golden Diving Searchlight Bezel & Optic
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(128, 38, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glowing Amber-Yellow Diving Searchlight Optic Lens
            const lampGrad = ctx.createRadialGradient(128, 38, 4, 128, 38, 22);
            lampGrad.addColorStop(0, '#ffffff');
            lampGrad.addColorStop(0.3, '#fef08a');
            lampGrad.addColorStop(0.7, '#facc15');
            lampGrad.addColorStop(1, '#eab308');
            ctx.fillStyle = lampGrad;
            ctx.beginPath();
            ctx.arc(128, 38, 22, 0, Math.PI * 2);
            ctx.fill();

            // Golden Brow Arch & Helmet Trim
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(34, 76); ctx.lineTo(128, 64); ctx.lineTo(222, 76);
            ctx.lineTo(214, 88); ctx.lineTo(128, 76); ctx.lineTo(42, 88);
            ctx.closePath();
            ctx.fill();

            // Recessed Optic Housing
            ctx.fillStyle = '#020617';
            ctx.fillRect(40, 88, 176, 52);

            // Stern Cyan Ocular Sensors
            const eyeGrad = ctx.createLinearGradient(0, 92, 0, 132);
            eyeGrad.addColorStop(0, '#67e8f9');
            eyeGrad.addColorStop(0.5, '#38bdf8');
            eyeGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = eyeGrad;
            // Left & Right angled oculars
            ctx.beginPath();
            ctx.moveTo(50, 98); ctx.lineTo(112, 104); ctx.lineTo(108, 130); ctx.lineTo(54, 126);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(206, 98); ctx.lineTo(144, 104); ctx.lineTo(148, 130); ctx.lineTo(202, 126);
            ctx.closePath();
            ctx.fill();

            // High-Glint Optical Flares
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(62, 104, 16, 9);
            ctx.fillRect(158, 104, 16, 9);

            // Grizzled Maritime Silver Acoustic Vocoder Beard-Plate
            const beardGrad = ctx.createLinearGradient(0, 140, 0, 256);
            beardGrad.addColorStop(0, '#f8fafc');
            beardGrad.addColorStop(0.5, '#cbd5e1');
            beardGrad.addColorStop(1, '#64748b');
            ctx.fillStyle = beardGrad;
            ctx.beginPath();
            ctx.moveTo(48, 140); ctx.lineTo(208, 140);
            ctx.lineTo(194, 238); ctx.lineTo(128, 254); ctx.lineTo(62, 238);
            ctx.closePath();
            ctx.fill();

            // Acoustic Vocoder Slats / Beard Vents
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 4;
            [160, 178, 196, 214].forEach(vy => {
                ctx.beginPath();
                ctx.moveTo(88, vy); ctx.lineTo(168, vy);
                ctx.stroke();
            });

            // Outer Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeHighTideChestTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Blue Torso Hull
            const hullGrad = ctx.createLinearGradient(0, 0, 0, 256);
            hullGrad.addColorStop(0, '#1d4ed8');
            hullGrad.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = hullGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Oval Submarine Cockpit Bubble Canopy
            const canopyGrad = ctx.createLinearGradient(0, 40, 0, 210);
            canopyGrad.addColorStop(0, '#67e8f9');
            canopyGrad.addColorStop(0.35, '#06b6d4');
            canopyGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = canopyGrad;
            ctx.beginPath();
            ctx.ellipse(128, 128, 86, 78, 0, 0, Math.PI * 2);
            ctx.fill();

            // Thick Golden Bulkhead Rim Frame
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 14;
            ctx.stroke();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Vertical Center Golden Window Bar
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(122, 52, 12, 152);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.strokeRect(122, 52, 12, 152);

            // Cockpit Glass Glare Highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.ellipse(92, 94, 34, 18, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Red Autobot Shield Crest on Upper Collar
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(128, 8);
            ctx.lineTo(146, 18); ctx.lineTo(142, 42); ctx.lineTo(128, 52); ctx.lineTo(114, 42); ctx.lineTo(110, 18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Golden Rivets around Bulkhead Frame
            ctx.fillStyle = '#fef08a';
            for (let i = 0; i < 8; i++) {
                const ang = (i / 8) * Math.PI * 2;
                const rx = 128 + Math.cos(ang) * 86;
                const ry = 128 + Math.sin(ang) * 78;
                ctx.beginPath();
                ctx.arc(rx, ry, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Outer Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 248, 248);
            return new THREE.CanvasTexture(c);
        }

        export function makeHighTideShoulderTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Royal Blue Shoulder Armor
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(0, 0, 256, 256);

            // Bold Golden/Yellow Anchor Insignia
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 4;

            // Anchor Ring / Eyelet
            ctx.beginPath();
            ctx.arc(128, 48, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.arc(128, 48, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Anchor Stock (Crossbar)
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(58, 76, 140, 18, 6);
            ctx.fill();
            ctx.stroke();

            // Anchor Shank (Central Shaft)
            ctx.fillRect(117, 60, 22, 140);
            ctx.strokeRect(117, 60, 22, 140);

            // Curved Flukes & Crown
            ctx.beginPath();
            ctx.arc(128, 175, 75, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.lineWidth = 22;
            ctx.strokeStyle = '#f59e0b';
            ctx.stroke();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#78350f';
            ctx.stroke();

            // Left & Right Arrowhead Fluke Tips
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(60, 205); ctx.lineTo(40, 160); ctx.lineTo(82, 172);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(196, 205); ctx.lineTo(216, 160); ctx.lineTo(174, 172);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Outer Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 248, 248);
            return new THREE.CanvasTexture(c);
        }

        export function makeMegaBotChestTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Naval White Armored Bezel Background
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, 256, 256);

            // Chamfered Bezel Inner Plate
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(16, 16, 224, 224);

            // Glowing Cyan Tactical Monitor Screen (Images 3 & 4)
            const screenGrad = ctx.createLinearGradient(0, 24, 0, 232);
            screenGrad.addColorStop(0, '#67e8f9');
            screenGrad.addColorStop(0.4, '#06b6d4');
            screenGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = screenGrad;
            ctx.fillRect(24, 24, 208, 208);

            // Subtle Cybertronian Grid Lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 2;
            for (let g = 48; g < 232; g += 26) {
                ctx.beginPath();
                ctx.moveTo(24, g); ctx.lineTo(232, g);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(g, 24); ctx.lineTo(g, 232);
                ctx.stroke();
            }

            // Prominent Bold Dark Navy / Metallic Blue Autobot Insignia (Images 3 & 4)
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            // Outer Shield Crest
            ctx.moveTo(68, 64); ctx.lineTo(188, 64);
            ctx.lineTo(188, 140); ctx.lineTo(162, 175);
            ctx.lineTo(128, 208); ctx.lineTo(94, 175);
            ctx.lineTo(68, 140);
            ctx.closePath();
            ctx.fill();

            // Inner Cyan Cutouts & Brow
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(82, 80, 92, 14);
            ctx.fillRect(78, 102, 28, 32);
            ctx.fillRect(150, 102, 28, 32);
            ctx.fillRect(116, 102, 24, 60);

            // Lower Cheeks & Chin
            ctx.beginPath();
            ctx.moveTo(94, 145); ctx.lineTo(110, 145); ctx.lineTo(104, 168);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(162, 145); ctx.lineTo(146, 145); ctx.lineTo(152, 168);
            ctx.closePath();
            ctx.fill();

            // Outer Ink Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeMegaBotShoulderTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Pure Naval White Shoulder Armor
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 256, 256);

            // Bold Red Naval Hazard Chevron Stripes (Images 2, 3, 4)
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;

            // 3 Stacked Angular Chevrons pointing forward / upward
            [55, 115, 175].forEach(cy => {
                ctx.beginPath();
                ctx.moveTo(35, cy + 30);
                ctx.lineTo(128, cy - 25);
                ctx.lineTo(221, cy + 30);
                ctx.lineTo(205, cy + 48);
                ctx.lineTo(128, cy);
                ctx.lineTo(51, cy + 48);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });

            // Outer Ink Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 248, 248);
            return new THREE.CanvasTexture(c);
        }

        export function makeMegaShipHullTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Crisp White Hull Plate
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 256, 256);

            // Bold Red Autobot Anchor Insignia (Images 1 & 3)
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;

            // Anchor Crown / Ring
            ctx.beginPath();
            ctx.arc(128, 52, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(128, 52, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Crossbar & Central Shank
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(65, 82, 126, 18);
            ctx.strokeRect(65, 82, 126, 18);
            ctx.fillRect(116, 70, 24, 135);
            ctx.strokeRect(116, 70, 24, 135);

            // Curved Bottom Flukes
            ctx.beginPath();
            ctx.arc(128, 170, 68, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.lineWidth = 20;
            ctx.strokeStyle = '#dc2626';
            ctx.stroke();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#0f172a';
            ctx.stroke();

            // Fluke Arrow Tips
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(68, 198); ctx.lineTo(46, 156); ctx.lineTo(88, 168);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(188, 198); ctx.lineTo(210, 156); ctx.lineTo(168, 168);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Outer Ink Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 248, 248);
            return new THREE.CanvasTexture(c);
        }

        export function makeQuickshadowFaceTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Sleek Glossy Charcoal-Black Helmet Frame
            const helmGrad = ctx.createLinearGradient(0, 0, 0, 256);
            helmGrad.addColorStop(0, '#1e293b');
            helmGrad.addColorStop(0.3, '#0f172a');
            helmGrad.addColorStop(1, '#020617');
            ctx.fillStyle = helmGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Sky-Blue Aerodynamic Helmet Forehead Arch & Tiara
            const archGrad = ctx.createLinearGradient(0, 0, 0, 64);
            archGrad.addColorStop(0, '#38bdf8');
            archGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = archGrad;
            ctx.beginPath();
            ctx.moveTo(34, 46);
            ctx.quadraticCurveTo(128, 16, 222, 46);
            ctx.lineTo(214, 62);
            ctx.quadraticCurveTo(128, 36, 42, 62);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Central Forehead Crest Jewel
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(128, 38, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(126, 36, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Recessed Visor Housing
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.moveTo(42, 64); ctx.lineTo(214, 64);
            ctx.lineTo(198, 122); ctx.lineTo(128, 134); ctx.lineTo(58, 122);
            ctx.closePath();
            ctx.fill();

            // Glowing Cyan / Sky-Blue Visor Optics with Cat-Eye Angle
            const visorGrad = ctx.createLinearGradient(0, 64, 0, 130);
            visorGrad.addColorStop(0, '#67e8f9');
            visorGrad.addColorStop(0.5, '#38bdf8');
            visorGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = visorGrad;
            ctx.beginPath();
            ctx.moveTo(48, 70); ctx.lineTo(208, 70);
            ctx.lineTo(192, 116); ctx.lineTo(128, 128); ctx.lineTo(64, 116);
            ctx.closePath();
            ctx.fill();

            // Almond Cat-Eye Visor Highlights & Eyelash Accents
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(48, 69); ctx.lineTo(112, 72);
            ctx.moveTo(208, 69); ctx.lineTo(144, 72);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(88, 86, 18, 5, -0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(168, 86, 18, 5, 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Feminine Silver Sculpted Faceplate & Cheeks (Tapered Jawline)
            const faceGrad = ctx.createLinearGradient(0, 128, 0, 256);
            faceGrad.addColorStop(0, '#ffffff');
            faceGrad.addColorStop(0.4, '#e2e8f0');
            faceGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = faceGrad;
            ctx.beginPath();
            ctx.moveTo(76, 126); ctx.lineTo(180, 126);
            ctx.lineTo(172, 182); ctx.lineTo(144, 232); ctx.lineTo(128, 246); ctx.lineTo(112, 232); ctx.lineTo(84, 182);
            ctx.closePath();
            ctx.fill();

            // Cheek Shading / Contours
            ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.beginPath();
            ctx.moveTo(78, 138); ctx.lineTo(98, 178); ctx.lineTo(84, 182);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(178, 138); ctx.lineTo(158, 178); ctx.lineTo(172, 182);
            ctx.closePath();
            ctx.fill();

            // Slender Nose Bridge
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(128, 134); ctx.lineTo(128, 170);
            ctx.lineTo(123, 178); ctx.lineTo(133, 178);
            ctx.stroke();

            // Feminine Metallic Lips & Confident Spy Smirk
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(112, 202);
            ctx.quadraticCurveTo(128, 198, 144, 200);
            ctx.quadraticCurveTo(128, 208, 112, 202);
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(110, 202);
            ctx.quadraticCurveTo(128, 207, 146, 200);
            ctx.stroke();

            // Outer Outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 246);
            return new THREE.CanvasTexture(c);
        }

        export function makeQuickshadowChestTexture() {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Pearlescent White Sculpted Bust
            const hoodGrad = ctx.createLinearGradient(0, 0, 0, 256);
            hoodGrad.addColorStop(0, '#ffffff');
            hoodGrad.addColorStop(0.6, '#f1f5f9');
            hoodGrad.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = hoodGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Aerodynamic Sky-Blue Hourglass Bust-Flank Curves (Left & Right)
            const scoopGrad = ctx.createLinearGradient(0, 0, 0, 256);
            scoopGrad.addColorStop(0, '#38bdf8');
            scoopGrad.addColorStop(0.5, '#0284c7');
            scoopGrad.addColorStop(1, '#0369a1');
            ctx.fillStyle = scoopGrad;
            // Left curve
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(52, 0);
            ctx.bezierCurveTo(46, 70, 26, 140, 48, 256);
            ctx.lineTo(0, 256);
            ctx.closePath();
            ctx.fill();
            // Right curve
            ctx.beginPath();
            ctx.moveTo(256, 0); ctx.lineTo(204, 0);
            ctx.bezierCurveTo(210, 70, 230, 140, 208, 256);
            ctx.lineTo(256, 256);
            ctx.closePath();
            ctx.fill();

            // Dark Charcoal Windshield Collar at Top
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(38, 0); ctx.lineTo(218, 0);
            ctx.lineTo(194, 38); ctx.lineTo(62, 38);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Twin Charcoal Sports Heat Louvers
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(76, 52, 28, 44);
            ctx.fillRect(152, 52, 28, 44);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(76, 52, 28, 44);
            ctx.strokeRect(152, 52, 28, 44);

            // Vented Slats
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            [62, 74, 86].forEach(vy => {
                ctx.beginPath();
                ctx.moveTo(80, vy); ctx.lineTo(100, vy);
                ctx.moveTo(156, vy); ctx.lineTo(176, vy);
                ctx.stroke();
            });

            // Center Red Autobot Shield Insignia (Heroic Fembot Badge)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(128, 122);
            ctx.lineTo(154, 134); ctx.lineTo(148, 180); ctx.lineTo(128, 202); ctx.lineTo(108, 180); ctx.lineTo(102, 134);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Inner Crest Markings
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(128, 130); ctx.lineTo(128, 166);
            ctx.moveTo(114, 146); ctx.lineTo(142, 146);
            ctx.moveTo(118, 164); ctx.lineTo(138, 164);
            ctx.stroke();

            // Lower Waist Taper Band
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(48, 226); ctx.lineTo(208, 226);
            ctx.lineTo(188, 256); ctx.lineTo(68, 256);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 248, 248);
            return new THREE.CanvasTexture(c);
        }

        export const texHazard = makeHazardStripeTexture();
        export const texGrille = makeGrilleTexture();
        export const texEmblem = makeRescueEmblemTexture();
        export const texHelipad = makeHelipadTexture();
        export const texWindshieldCyan = makeCartoonWindshieldTexture('#38bdf8');
        export const texWindshieldDark = makeCartoonWindshieldTexture('#1e3a8a');

        export const texFaceBoulder = makeBoulderFaceTexture();
        export const texFaceHeatwave = makeHeatwaveFaceTexture();
        export const texFaceChase = makeChaseFaceTexture();
        export const texFaceBlades = makeBladesFaceTexture();

        export const texFaceOptimus = makeOptimusFaceTexture();
        export const texFaceBumblebee = makeBumblebeeFaceTexture();
        export const texBeeChest = makeBumblebeeChestTexture();
        export const texBeeWing = makeBumblebeeWingTexture();
        export const texBeeShin = makeBumblebeeShinTexture();
        export const texBeeWheel = makeBumblebeeWheelTexture();
        export const texFaceBlurr = makeBlurrFaceTexture();
        export const texBlurrChest = makeBlurrChestTexture();
        export const texBlurrShoulder = makeBlurrShoulderTexture();
        export const texBlurrShin = makeBlurrShinTexture();
        export const texBlurrTurbine = makeBlurrTurbineWheelTexture();
        export const texFaceSalvage = makeSalvageFaceTexture();
        export const texSalvageChest = makeSalvageChestTexture();
        export const texFaceHighTide = makeHighTideFaceTexture();
        export const texChestHighTide = makeHighTideChestTexture();
        export const texShoulderHighTide = makeHighTideShoulderTexture();
        export const texMegaBotChest = makeMegaBotChestTexture();
        export const texMegaShoulderChevron = makeMegaBotShoulderTexture();
        export const texMegaShipHull = makeMegaShipHullTexture();
        export const texFaceQuickshadow = makeQuickshadowFaceTexture();
        export const texChestQuickshadow = makeQuickshadowChestTexture();

if (typeof window !== 'undefined') {
    Object.assign(window, {
        texHazard, texGrille, texEmblem, texHelipad, texWindshieldCyan, texWindshieldDark,
        texFaceBoulder, texFaceHeatwave, texFaceChase, texFaceBlades,
        texFaceOptimus, texFaceBumblebee, texBeeChest, texBeeWing, texBeeShin, texBeeWheel,
        texFaceBlurr, texBlurrChest, texBlurrShoulder, texBlurrShin, texBlurrTurbine,
        texFaceSalvage, texSalvageChest, texFaceHighTide, texChestHighTide, texShoulderHighTide,
        texMegaBotChest, texMegaShoulderChevron, texMegaShipHull,
        texFaceQuickshadow, texChestQuickshadow
    });
}
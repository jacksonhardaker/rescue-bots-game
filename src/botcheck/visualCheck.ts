// Visual Check Studio for Ground Clearance, Morph Inspection & TV-Show Proportions
import * as THREE from 'three';
import { renderer } from '../rendering/scene.js';
import { buildRescueBotModel, applyBotRigMorph, setHighTideRigMega } from '../bots/botRigs.js';
import { BOT_METADATA } from '../bots/botMeta.js';

        export function startBotCheck() {
            const params = new URLSearchParams(location.search);
            const BOT_IDS = ['BOULDER', 'HEATWAVE', 'CHASE', 'BLADES', 'OPTIMUS', 'BUMBLEBEE', 'BLURR', 'SALVAGE', 'HIGHTIDE', 'HIGHTIDE_MEGA', 'QUICKSHADOW'];
            const MODES = ['bot', 'vehicle', 'dino'];

            // Hide every game HUD element; keep only the WebGL canvas
            Array.from(document.body.children).forEach(el => {
                if (el.tagName !== 'SCRIPT' && !el.contains(renderer.domElement)) el.style.display = 'none';
            });
            let node = renderer.domElement.parentElement;
            while (node && node !== document.body) {
                Array.from(node.children as any as any[]).forEach((el: any) => { if (!el.contains(renderer.domElement)) el.style.display = 'none'; });
                node = node.parentElement;
            }

            const state = {
                view: params.get('view') === 'focus' ? 'focus' : 'grid',
                bot: BOT_IDS.includes(params.get('bot')) ? params.get('bot') : 'HIGHTIDE_MEGA',
                mode: MODES.includes(params.get('mode')) ? params.get('mode') : 'bot',
                morph: params.has('morph') ? THREE.MathUtils.clamp(parseFloat(params.get('morph')) || 0, 0, 1) : 1,
                spin: params.get('spin') !== '0',
                anim: params.get('anim') !== '0',
                walk: false,
                yaw: THREE.MathUtils.degToRad(parseFloat(params.get('angle') || '35')),
                pitch: 0.32,
                zoom: 1
            };
            if (params.has('angle')) state.spin = false;

            // --- Scene ---
            const bcScene = new THREE.Scene();
            bcScene.background = new THREE.Color(0xdbeafe);
            bcScene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.8));
            const bcSun = new THREE.DirectionalLight(0xfffbeb, 1.1);
            bcSun.position.set(60, 120, 80);
            bcSun.castShadow = true;
            bcSun.shadow.mapSize.set(2048, 2048);
            Object.assign(bcSun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 1, far: 400 });
            bcSun.shadow.bias = -0.0004;
            bcScene.add(bcSun);

            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2),
                new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 })
            );
            ground.receiveShadow = true;
            bcScene.add(ground);
            const grid = new THREE.GridHelper(600, 300, 0x94a3b8, 0xcbd5e1);
            grid.position.y = 0.01;
            bcScene.add(grid);

            const bcCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 2000);

            // --- Build fresh rigs: one per (bot, mode) cell ---
            function makeRig(id) {
                const rig = buildRescueBotModel(id === 'HIGHTIDE_MEGA' ? 'HIGHTIDE' : id);
                if (rig.botType === 'HIGHTIDE') setHighTideRigMega(rig, id === 'HIGHTIDE_MEGA');
                rig.root.traverse(o => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
                return rig;
            }
            const cells = []; // { id, mode, rig, holder, label }
            const labelLayer = document.createElement('div');
            labelLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;font:600 11px/1.2 system-ui,sans-serif;z-index:20;';
            document.body.appendChild(labelLayer);

            // Grid layout: rows = bots, columns = modes. Mega row gets extra room.
            let rowZ = 0;
            BOT_IDS.forEach(id => {
                const isMega = id === 'HIGHTIDE_MEGA';
                const colGap = isMega ? 58 : 16;
                const rowGap = isMega ? 62 : 16;
                rowZ += rowGap / 2;
                MODES.forEach((mode, ci) => {
                    const rig = makeRig(id);
                    const holder = new THREE.Group();
                    holder.userData.gridPos = new THREE.Vector3((ci - 1) * colGap, 0, rowZ);
                    holder.add(rig.root);
                    bcScene.add(holder);
                    const label = document.createElement('div');
                    label.style.cssText = 'position:absolute;transform:translate(-50%,0);white-space:nowrap;padding:2px 6px;border-radius:6px;background:rgba(15,23,42,.78);color:#fff;';
                    labelLayer.appendChild(label);
                    cells.push({ id, mode, rig, holder, label, isMega });
                });
                rowZ += rowGap / 2;
            });
            const gridDepth = rowZ;

            // Measure the lowest point of VISIBLE (non-outline) geometry => ground contact check
            const _box = new THREE.Box3();
            const _tmp = new THREE.Box3();
            function visibleBounds(obj) {
                _box.makeEmpty();
                obj.updateMatrixWorld(true);
                (function walk(o) {
                    if (!o.visible) return;
                    if (o.isMesh && !o.userData.isOutline && o.geometry) {
                        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
                        _tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
                        _box.union(_tmp);
                    }
                    o.children.forEach(walk);
                })(obj);
                return _box;
            }

            // --- UI panel ---
            const panel = document.createElement('div');
            panel.style.cssText = 'position:fixed;top:12px;left:12px;z-index:30;width:270px;padding:12px;border-radius:12px;background:rgba(15,23,42,.9);color:#e2e8f0;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);';
            panel.innerHTML = `
                <div style="font-weight:700;font-size:15px;margin-bottom:8px;">🔧 Bot Visual Check</div>
                <label style="display:block;margin-bottom:6px;">View
                    <select data-k="view" style="width:100%;color:#0f172a;border-radius:6px;padding:3px;">
                        <option value="grid">Grid (all bots × modes)</option>
                        <option value="focus">Focus (single bot)</option>
                    </select></label>
                <div data-focus>
                    <label style="display:block;margin-bottom:6px;">Bot
                        <select data-k="bot" style="width:100%;color:#0f172a;border-radius:6px;padding:3px;">
                            ${BOT_IDS.map(b => `<option value="${b}">${b === 'HIGHTIDE_MEGA' ? 'HIGH TIDE (MEGABOT)' : b}</option>`).join('')}
                        </select></label>
                    <label style="display:block;margin-bottom:6px;">Target mode
                        <select data-k="mode" style="width:100%;color:#0f172a;border-radius:6px;padding:3px;">
                            <option value="bot">Bot</option><option value="vehicle">Vehicle</option><option value="dino">Dino</option>
                        </select></label>
                    <label style="display:block;margin-bottom:6px;">Morph from Bot → target: <span data-morphval></span>
                        <input data-k="morph" type="range" min="0" max="1" step="0.01" style="width:100%;"></label>
                    <label style="margin-right:10px;"><input data-k="walk" type="checkbox"> Walk</label>
                    <button data-smash style="padding:2px 8px;border-radius:6px;background:#f97316;color:#fff;">Smash</button>
                </div>
                <div style="margin-top:6px;">
                    <label style="margin-right:10px;"><input data-k="spin" type="checkbox"> Turntable</label>
                    <label><input data-k="anim" type="checkbox"> Idle anim</label>
                </div>
                <div data-report style="margin-top:8px;max-height:220px;overflow:auto;font:11px/1.35 ui-monospace,monospace;"></div>
                <div style="margin-top:6px;color:#94a3b8;font-size:11px;">Drag to orbit · wheel to zoom · <a href="./index.html" style="color:#7dd3fc;">back to game</a></div>`;
            document.body.appendChild(panel);
            const q = sel => panel.querySelector(sel);
            panel.querySelectorAll('[data-k]').forEach(el => {
                const k = el.dataset.k;
                if (el.type === 'checkbox') el.checked = state[k]; else el.value = state[k];
                el.addEventListener('input', () => {
                    state[k] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? parseFloat(el.value) : el.value);
                    syncUrl();
                });
            });
            let smashT = 0;
            q('[data-smash]').addEventListener('click', () => { smashT = 0.45; });
            function syncUrl() {
                const p = new URLSearchParams({ botcheck: '', view: state.view, bot: state.bot, mode: state.mode, morph: state.morph.toFixed(2) });
                history.replaceState(null, '', '?' + p.toString().replace('botcheck=', 'botcheck'));
            }

            // --- Orbit controls ---
            let dragging = false, lastX = 0, lastY = 0;
            renderer.domElement.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; state.spin = false; q('[data-k=spin]').checked = false; });
            window.addEventListener('pointerup', () => { dragging = false; });
            window.addEventListener('pointermove', e => {
                if (!dragging) return;
                state.yaw -= (e.clientX - lastX) * 0.008;
                state.pitch = THREE.MathUtils.clamp(state.pitch + (e.clientY - lastY) * 0.006, 0.02, 1.45);
                lastX = e.clientX; lastY = e.clientY;
            });
            renderer.domElement.addEventListener('wheel', e => {
                e.preventDefault();
                state.zoom = THREE.MathUtils.clamp(state.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.15, 4);
            }, { passive: false });
            window.addEventListener('resize', () => {
                bcCamera.aspect = window.innerWidth / window.innerHeight;
                bcCamera.updateProjectionMatrix();
            });

            const _v = new THREE.Vector3();
            const _center = new THREE.Vector3();
            const _size = new THREE.Vector3();
            let lastNow = performance.now();
            let walkCycle = 0;
            let reportTimer = 0;

            function frame(now) {
                requestAnimationFrame(frame);
                const dt = Math.min(0.05, (now - lastNow) / 1000);
                lastNow = now;
                const t = state.anim ? now : 0;
                if (state.spin) state.yaw += dt * 0.35;
                if (smashT > 0) smashT = Math.max(0, smashT - dt);
                if (state.walk) walkCycle += dt * 9;

                q('[data-focus]').style.display = state.view === 'focus' ? '' : 'none';
                q('[data-morphval]').textContent = state.morph.toFixed(2);

                const issues = [];
                let focusCell = null;
                cells.forEach(c => {
                    let show, m = 0, d = 0, walk = 0, speed = 0, smash = 0;
                    if (state.view === 'grid') {
                        show = true;
                        if (c.mode === 'vehicle') m = 1;
                        if (c.mode === 'dino') d = 1;
                        c.holder.position.copy(c.holder.userData.gridPos);
                    } else {
                        // Focus view uses the "bot" cell of the chosen bot and morphs it toward the target mode
                        show = c.id === state.bot && c.mode === 'bot';
                        if (state.mode === 'vehicle') m = state.morph;
                        if (state.mode === 'dino') d = state.morph;
                        walk = walkCycle; speed = state.walk ? 12 : 0; smash = smashT;
                        c.holder.position.set(0, 0, 0);
                        if (show) focusCell = c;
                    }
                    c.holder.visible = show;
                    c.label.style.display = show ? '' : 'none';
                    if (!show) return;
                    applyBotRigMorph(c.rig, m, d, walk, speed, smash, t);
                    if (state.view === 'grid') c.holder.rotation.y = state.spin ? state.yaw * 0.6 : 0;
                    else c.holder.rotation.y = 0;

                    // Ground-contact check (vehicles/dinos should rest on y≈0; bots stand on feet)
                    const b = visibleBounds(c.holder);
                    const minY = b.isEmpty() ? 0 : b.min.y;
                    const flag = minY < -0.15 ? '⚠ sinks' : (minY > 0.6 && !(c.id === 'BLADES' && c.mode === 'vehicle') ? '⚠ floats' : '');
                    if (flag) issues.push(`${c.id} ${state.view === 'grid' ? c.mode : state.mode}: minY ${minY.toFixed(2)} ${flag}`);
                    c._minY = minY; c._flag = flag;
                    b.getCenter(_center); b.getSize(_size);
                    c._center = _center.clone(); c._size = _size.clone();
                });

                // Camera
                let target, dist;
                if (state.view === 'grid') {
                    target = new THREE.Vector3(0, 2, gridDepth / 2);
                    dist = gridDepth * 0.95 * state.zoom;
                    const yaw = state.spin ? 0 : state.yaw;
                    bcCamera.position.set(
                        target.x + Math.sin(yaw) * Math.cos(state.pitch + 0.45) * dist,
                        target.y + Math.sin(state.pitch + 0.45) * dist,
                        target.z + Math.cos(yaw) * Math.cos(state.pitch + 0.45) * dist
                    );
                } else if (focusCell) {
                    target = focusCell._center.clone();
                    dist = Math.max(8, focusCell._size.length() * 1.25) * state.zoom;
                    bcCamera.position.set(
                        target.x + Math.sin(state.yaw) * Math.cos(state.pitch) * dist,
                        target.y + Math.sin(state.pitch) * dist,
                        target.z + Math.cos(state.yaw) * Math.cos(state.pitch) * dist
                    );
                }
                if (target) bcCamera.lookAt(target);

                // Labels
                cells.forEach(c => {
                    if (!c.holder.visible) return;
                    _v.set(c.holder.position.x, -0.5, c.holder.position.z + (c.isMega ? 6 : 3)).project(bcCamera);
                    const onScreen = _v.z < 1 && Math.abs(_v.x) < 1.1 && Math.abs(_v.y) < 1.1;
                    c.label.style.display = onScreen ? '' : 'none';
                    c.label.style.left = ((_v.x + 1) / 2 * window.innerWidth) + 'px';
                    c.label.style.top = ((1 - _v.y) / 2 * window.innerHeight) + 'px';
                    const modeName = state.view === 'grid' ? c.mode : `${state.mode} ${state.morph.toFixed(2)}`;
                    c.label.textContent = `${c.id === 'HIGHTIDE_MEGA' ? 'MEGA HIGH TIDE' : c.id} · ${modeName}${c._flag ? ' ' + c._flag : ''}`;
                    c.label.style.background = c._flag ? 'rgba(220,38,38,.9)' : 'rgba(15,23,42,.78)';
                });

                reportTimer -= dt;
                if (reportTimer <= 0) {
                    reportTimer = 0.5;
                    console.log('[BOTCHECK_REPORT]', JSON.stringify(issues));
                    q('[data-report]').innerHTML = issues.length
                        ? `<div style="color:#fca5a5;font-weight:700;">${issues.length} ground-contact issue(s):</div>` + issues.map(s => `<div>${s}</div>`).join('')
                        : '<div style="color:#86efac;">✔ No ground-contact issues in view</div>';
                    window.__botCheckIssues = issues.slice();
                }

                renderer.render(bcScene, bcCamera);
            }
            requestAnimationFrame(frame);
        }


if (typeof window !== 'undefined') {
    window.startBotCheck = startBotCheck;
}

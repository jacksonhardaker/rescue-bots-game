// Standalone Visual Check Studio for Ground Clearance, Morph Inspection & Boat Mode Verification
import * as THREE from 'three';
import { buildRescueBotModel, applyBotRigMorph, setBotRigMega } from '../bots/botRigs.js';
import { toonGrad3, OUTLINE_LAYER } from '../rendering/materials.js';
import { SVG_ICONS } from '../ui/icons.js';

export function startBotCheck(canvasEl?: HTMLCanvasElement | null) {
    const params = new URLSearchParams(location.search);
    const BOT_IDS = [
        'BOULDER', 'BOULDER_MEGA',
        'HEATWAVE', 'HEATWAVE_MEGA',
        'CHASE', 'CHASE_MEGA',
        'BLADES', 'BLADES_MEGA',
        'OPTIMUS', 'OPTIMUS_MEGA',
        'BUMBLEBEE', 'BUMBLEBEE_MEGA',
        'BLURR', 'BLURR_MEGA',
        'SALVAGE', 'SALVAGE_MEGA',
        'HIGHTIDE', 'HIGHTIDE_MEGA',
        'QUICKSHADOW', 'QUICKSHADOW_MEGA',
        'STARSPEED'
    ];
    const MODES = ['bot', 'vehicle', 'boat', 'dino'];

    // Standalone lightweight WebGLRenderer (completely decoupled from world scene)
    const isMobile = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
    );
    let canvas = canvasEl || (document.getElementById('botcheck-canvas') as HTMLCanvasElement | null);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'botcheck-canvas';
        canvas.style.cssText = 'display:block;width:100vw;height:100vh;touch-action:none;';
        document.body.appendChild(canvas);
    }

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    const state = {
        view: params.get('view') === 'focus' ? 'focus' : 'grid',
        bot: BOT_IDS.includes(params.get('bot') || '') ? (params.get('bot') as string) : 'HIGHTIDE_MEGA',
        mode: MODES.includes(params.get('mode') || '') ? (params.get('mode') as string) : 'bot',
        morph: params.has('morph') ? THREE.MathUtils.clamp(parseFloat(params.get('morph') || '1') || 0, 0, 1) : 1,
        spin: params.get('spin') !== '0',
        anim: params.get('anim') !== '0',
        walk: false,
        yaw: THREE.MathUtils.degToRad(parseFloat(params.get('angle') || '35')),
        pitch: 0.32,
        zoom: 1
    };
    if (params.has('angle')) state.spin = false;

    // --- Standalone Scene ---
    const bcScene = new THREE.Scene();
    bcScene.background = new THREE.Color(0xdbeafe);
    bcScene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.8));
    const bcSun = new THREE.DirectionalLight(0xfffbeb, 1.1);
    bcSun.position.set(60, 120, 80);
    bcSun.castShadow = true;
    const shadowSize = isMobile ? 1024 : 2048;
    bcSun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(bcSun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 1, far: 400 });
    bcSun.shadow.bias = -0.0004;
    bcScene.add(bcSun);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1200, 1200).rotateX(-Math.PI / 2),
        new THREE.MeshToonMaterial({ color: 0xf1f5f9, gradientMap: toonGrad3 })
    );
    ground.receiveShadow = true;
    bcScene.add(ground);
    const grid = new THREE.GridHelper(1200, 240, 0x94a3b8, 0xcbd5e1);
    grid.position.y = 0.01;
    bcScene.add(grid);

    const bcCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 4000);
    bcCamera.layers.enable(OUTLINE_LAYER);

    // --- Lazy Rig Construction: build only visible cell(s) ---
    function makeRig(id: string) {
        const isMega = id.endsWith('_MEGA');
        const baseType = isMega ? id.replace('_MEGA', '') : id;
        const rig = buildRescueBotModel(baseType);
        setBotRigMega(rig, isMega);
        rig.root.traverse((o: any) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
        return rig;
    }

    const labelLayer = document.createElement('div');
    labelLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;font:600 11px/1.2 system-ui,sans-serif;z-index:20;';
    document.body.appendChild(labelLayer);

    interface BotCheckCell {
        id: string;
        mode: string;
        isMega: boolean;
        gridPos: THREE.Vector3;
        rig: any | null;
        holder: THREE.Group | null;
        label: HTMLDivElement | null;
        _center: THREE.Vector3;
        _size: THREE.Vector3;
        _minY: number;
        _flag: string;
        _boundsReady: boolean;
        _lastTransform: string;
        _lastLabelText: string;
        _lastLabelBg: string;
        _lastLabelVisible: boolean;
    }

    const cells: BotCheckCell[] = [];
    let builtRigCount = 0;

    function ensureCellBuilt(c: BotCheckCell) {
        if (c.rig && c.holder && c.label) return;
        const rig = makeRig(c.id);
        const holder = new THREE.Group();
        holder.position.copy(c.gridPos);
        holder.add(rig.root);
        bcScene.add(holder);

        const label = document.createElement('div');
        label.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;padding:2px 6px;border-radius:6px;background:rgba(15,23,42,.78);color:#fff;will-change:transform;contain:layout style;';
        labelLayer.appendChild(label);

        c.rig = rig;
        c.holder = holder;
        c.label = label;
        builtRigCount++;
        (window as any).__botCheckBuiltRigs = builtRigCount;
    }

    // Grid layout: rows = bots, columns = modes. Boat mode included for all amphibious bots (all except High Tide).
    let rowZ = 0;
    BOT_IDS.forEach(id => {
        const isMega = id.endsWith('_MEGA');
        const isHighTideMega = id === 'HIGHTIDE_MEGA';
        const colGap = isHighTideMega ? 58 : (isMega ? 28 : 16);
        const rowGap = isHighTideMega ? 62 : (isMega ? 28 : 16);
        rowZ += rowGap / 2;
        const hasBoat = !id.startsWith('HIGHTIDE');
        const botModes = hasBoat ? ['bot', 'vehicle', 'boat', 'dino'] : ['bot', 'vehicle', 'dino'];
        botModes.forEach((mode, ci) => {
            const offsetIndex = ci - (botModes.length - 1) / 2;
            cells.push({
                id,
                mode,
                isMega,
                gridPos: new THREE.Vector3(offsetIndex * colGap, 0, rowZ),
                rig: null,
                holder: null,
                label: null,
                _center: new THREE.Vector3(),
                _size: new THREE.Vector3(),
                _minY: 0,
                _flag: '',
                _boundsReady: false,
                _lastTransform: '',
                _lastLabelText: '',
                _lastLabelBg: '',
                _lastLabelVisible: true
            });
        });
        rowZ += rowGap / 2;
    });
    const gridDepth = rowZ;

    (window as any).__botCheckCells = cells;
    (window as any).__botCheckBuiltRigs = builtRigCount;

    // Measure the lowest point of VISIBLE (non-outline) geometry => ground contact check
    const _box = new THREE.Box3();
    const _tmp = new THREE.Box3();
    function visibleBounds(obj: THREE.Object3D) {
        _box.makeEmpty();
        obj.updateMatrixWorld(true);
        (function walk(o: any) {
            if (!o.visible) return;
            if (o.isMesh && !o.userData.isOutline && o.geometry) {
                if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
                _tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
                _box.union(_tmp);
            }
            if (o.children) o.children.forEach(walk);
        })(obj);
        return _box;
    }

    // --- UI panel ---
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:12px;left:12px;z-index:30;width:270px;padding:12px;border-radius:12px;background:rgba(15,23,42,.9);color:#e2e8f0;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);';
    panel.innerHTML = `
        <div style="font-weight:700;font-size:15px;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;">${SVG_ICONS.BOLT}</span>
            <span>Bot Visual Check</span>
        </div>
        <label style="display:block;margin-bottom:6px;">View
            <select data-k="view" style="width:100%;color:#0f172a;border-radius:6px;padding:3px;">
                <option value="grid">Grid (all bots × modes)</option>
                <option value="focus">Focus (single bot)</option>
            </select></label>
        <div data-focus>
            <label style="display:block;margin-bottom:6px;">Bot
                <select data-k="bot" style="width:100%;color:#0f172a;border-radius:6px;padding:3px;">
                    ${BOT_IDS.map(b => `<option value="${b}">${b.endsWith('_MEGA') ? `${b.replace('_MEGA', '')} (MEGA)` : b}</option>`).join('')}
                </select></label>
            <label style="display:block;margin-bottom:6px;">Target mode
                <select data-k="mode" style="width:100%;color:#0f172a;border-radius:6px;padding:3px;">
                    <option value="bot">Bot</option><option value="vehicle">Vehicle</option><option value="boat">Boat</option><option value="dino">Dino</option>
                </select></label>
            <label style="display:block;margin-bottom:6px;"><span data-morphlabel>Morph from Bot → target:</span> <span data-morphval></span>
                <input data-k="morph" type="range" min="0" max="1" step="0.01" style="width:100%;"></label>
            <label style="margin-right:10px;"><input data-k="walk" type="checkbox"> Walk</label>
            <button data-smash style="padding:2px 8px;border-radius:6px;background:#f97316;color:#fff;">Smash</button>
        </div>
        <div style="margin-top:6px;">
            <label style="margin-right:10px;"><input data-k="spin" type="checkbox"> Turntable</label>
            <label><input data-k="anim" type="checkbox"> Idle anim</label>
        </div>
        <div data-report style="margin-top:8px;max-height:220px;overflow:auto;font:11px/1.35 ui-monospace,monospace;"></div>
        <div style="margin-top:6px;color:#94a3b8;font-size:11px;">Drag to orbit · wheel to zoom · <a href="./modelcheck.html" style="color:#7dd3fc;">model check</a> · <a href="./index.html" style="color:#7dd3fc;">back to game</a></div>`;
    document.body.appendChild(panel);
    const q = (sel: string): any => panel.querySelector(sel);

    let needsBoundsRefresh = true;
    panel.querySelectorAll('[data-k]').forEach((el: any) => {
        const k = el.dataset.k;
        if (el.type === 'checkbox') el.checked = (state as any)[k];
        else el.value = (state as any)[k];
        el.addEventListener('input', () => {
            (state as any)[k] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? parseFloat(el.value) : el.value);
            needsBoundsRefresh = true;
            syncUrl();
        });
    });

    let smashT = 0;
    q('[data-smash]').addEventListener('click', () => {
        smashT = 0.45;
        needsBoundsRefresh = true;
    });

    function syncUrl() {
        const p = new URLSearchParams({
            view: state.view,
            bot: state.bot,
            mode: state.mode,
            morph: state.morph.toFixed(2)
        });
        history.replaceState(null, '', '?' + p.toString());
    }

    // --- Orbit controls ---
    let dragging = false, lastX = 0, lastY = 0;
    renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        state.spin = false;
        q('[data-k=spin]').checked = false;
    });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointermove', (e: PointerEvent) => {
        if (!dragging) return;
        state.yaw -= (e.clientX - lastX) * 0.008;
        state.pitch = THREE.MathUtils.clamp(state.pitch + (e.clientY - lastY) * 0.006, 0.02, 1.45);
        lastX = e.clientX;
        lastY = e.clientY;
    });
    renderer.domElement.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        state.zoom = THREE.MathUtils.clamp(state.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.15, 4);
    }, { passive: false });
    window.addEventListener('resize', () => {
        bcCamera.aspect = window.innerWidth / window.innerHeight;
        bcCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const _v = new THREE.Vector3();
    const _center = new THREE.Vector3();
    const _size = new THREE.Vector3();
    const _camTarget = new THREE.Vector3();
    const _camDir = new THREE.Vector3();
    (window as any).__botCheckCamera = bcCamera;
    (window as any).__botCheckCamTarget = _camTarget;
    let lastNow = performance.now();
    let walkCycle = 0;
    let reportTimer = 0;

    function frame(now: number) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - lastNow) / 1000);
        lastNow = now;
        const t = state.anim ? now : 0;
        if (state.spin) state.yaw += dt * 0.35;
        if (smashT > 0) smashT = Math.max(0, smashT - dt);
        if (state.walk) walkCycle += dt * 9;

        const isFocus = state.view === 'focus';
        q('[data-focus]').style.display = isFocus ? '' : 'none';
        q('[data-morphval]').textContent = state.morph.toFixed(2);
        const morphLabelEl = q('[data-morphlabel]');
        if (morphLabelEl) {
            if (state.mode === 'boat') {
                morphLabelEl.textContent = state.bot.startsWith('HIGHTIDE')
                    ? 'Morph Bot -> Submarine:'
                    : 'Morph Vehicle -> Boat:';
            } else {
                morphLabelEl.textContent = 'Morph from Bot → target:';
            }
        }

        reportTimer -= dt;
        const emitReport = reportTimer <= 0;
        if (emitReport) {
            reportTimer = 0.5;
        }

        const issues: string[] = [];
        let focusCell: BotCheckCell | null = null;
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            let show = false;
            let m = 0, d = 0, bm = 0, walk = 0, speed = 0, smash = 0;

            if (!isFocus) {
                show = true;
                if (c.mode === 'vehicle') m = 1;
                if (c.mode === 'boat') { m = 1; bm = 1; }
                if (c.mode === 'dino') d = 1;
            } else {
                // Focus view uses the "bot" cell of the chosen bot and morphs it toward the target mode
                show = c.id === state.bot && c.mode === 'bot';
                if (state.mode === 'vehicle') m = state.morph;
                if (state.mode === 'boat') {
                    if (c.id.startsWith('HIGHTIDE')) {
                        m = state.morph;
                    } else {
                        m = 1;
                        bm = state.morph;
                    }
                }
                if (state.mode === 'dino') d = state.morph;
                walk = walkCycle;
                speed = state.walk ? 12 : 0;
                smash = smashT;
            }

            if (!show) {
                if (c.holder) c.holder.visible = false;
                if (c.label && c._lastLabelVisible) {
                    c.label.style.display = 'none';
                    c._lastLabelVisible = false;
                }
                continue;
            }

            ensureCellBuilt(c);
            const holder = c.holder!;
            const label = c.label!;
            holder.visible = true;

            if (!isFocus) {
                holder.position.copy(c.gridPos);
                holder.rotation.y = state.spin ? state.yaw * 0.6 : 0;
            } else {
                holder.position.set(0, 0, 0);
                holder.rotation.y = 0;
                focusCell = c;
            }

            applyBotRigMorph(c.rig, m, d, walk, speed, smash, t, 0, bm);

            const refreshFullBounds = needsBoundsRefresh || !c._boundsReady;
            if (refreshFullBounds || emitReport) {
                const b = visibleBounds(holder);
                const minY = b.isEmpty() ? 0 : b.min.y;
                const activeMode = isFocus ? state.mode : c.mode;
                const isFlightVehicle = (c.id === 'BLADES' || c.id === 'BLADES_MEGA' || c.id === 'QUICKSHADOW_MEGA') && activeMode === 'vehicle';
                const flag = minY < -0.15 ? '[SINK]' : (minY > 0.6 && !isFlightVehicle ? '[FLOAT]' : '');
                c._minY = minY;
                c._flag = flag;
                if (refreshFullBounds) {
                    b.getCenter(_center);
                    b.getSize(_size);
                    c._center.copy(_center);
                    c._size.copy(_size);
                    c._boundsReady = true;
                }
            }

            if (c._flag) {
                issues.push(`${c.id} ${isFocus ? state.mode : c.mode}: minY ${c._minY.toFixed(2)} ${c._flag}`);
            }
        }
        needsBoundsRefresh = false;

        // Camera
        let hasTarget = false;
        if (!isFocus) {
            _camTarget.set(0, 2, gridDepth / 2);
            const dist = gridDepth * 0.95 * state.zoom;
            const yaw = state.spin ? 0 : state.yaw;
            bcCamera.position.set(
                _camTarget.x + Math.sin(yaw) * Math.cos(state.pitch + 0.45) * dist,
                _camTarget.y + Math.sin(state.pitch + 0.45) * dist,
                _camTarget.z + Math.cos(yaw) * Math.cos(state.pitch + 0.45) * dist
            );
            hasTarget = true;
        } else if (focusCell) {
            _camTarget.copy(focusCell._center);
            const dist = Math.max(8, focusCell._size.length() * 1.25) * state.zoom;
            bcCamera.position.set(
                _camTarget.x + Math.sin(state.yaw) * Math.cos(state.pitch) * dist,
                _camTarget.y + Math.sin(state.pitch) * dist,
                _camTarget.z + Math.cos(state.yaw) * Math.cos(state.pitch) * dist
            );
            hasTarget = true;
        }
        if (hasTarget) bcCamera.lookAt(_camTarget);
        bcCamera.updateMatrixWorld(true);
        bcCamera.matrixWorldInverse.copy(bcCamera.matrixWorld).invert();

        _camDir.set(bcCamera.position.x - _camTarget.x, 0, bcCamera.position.z - _camTarget.z);
        if (_camDir.lengthSq() > 1e-6) _camDir.normalize();
        else _camDir.set(0, 0, 1);

        const vw = renderer.domElement.clientWidth || window.innerWidth;
        const vh = renderer.domElement.clientHeight || window.innerHeight;

        // Labels (GPU-composited transform, cached DOM writes, synchronized camera matrix)
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (!c.holder || !c.holder.visible || !c.label) continue;
            const anchorR = c.isMega ? 5.6 : 2.8;
            _v.set(
                c.holder.position.x + _camDir.x * anchorR,
                -0.45,
                c.holder.position.z + _camDir.z * anchorR
            ).project(bcCamera);
            const onScreen = _v.z >= -1 && _v.z < 1 && Math.abs(_v.x) < 1.15 && Math.abs(_v.y) < 1.15;
            if (!onScreen) {
                if (c._lastLabelVisible) {
                    c.label.style.display = 'none';
                    c._lastLabelVisible = false;
                }
                continue;
            }
            if (!c._lastLabelVisible) {
                c.label.style.display = '';
                c._lastLabelVisible = true;
            }
            const sx = (_v.x + 1) * 0.5 * vw;
            const sy = (1 - _v.y) * 0.5 * vh;
            const tr = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, 0)`;
            if (tr !== c._lastTransform) {
                c.label.style.transform = tr;
                c._lastTransform = tr;
            }
            const modeName = !isFocus ? c.mode : `${state.mode} ${state.morph.toFixed(2)}`;
            const displayName = c.id.endsWith('_MEGA') ? `${c.id.replace('_MEGA', '')} (MEGA)` : c.id;
            const nextText = `${displayName} · ${modeName}${c._flag ? ' ' + c._flag : ''}`;
            if (nextText !== c._lastLabelText) {
                c.label.textContent = nextText;
                c._lastLabelText = nextText;
            }
            const nextBg = c._flag ? 'rgba(220,38,38,.9)' : 'rgba(15,23,42,.78)';
            if (nextBg !== c._lastLabelBg) {
                c.label.style.background = nextBg;
                c._lastLabelBg = nextBg;
            }
        }

        if (emitReport) {
            console.log('[BOTCHECK_REPORT]', JSON.stringify(issues));
            q('[data-report]').innerHTML = issues.length
                ? `<div style="color:#fca5a5;font-weight:700;">${issues.length} ground-contact issue(s):</div>` + issues.map(s => `<div>${s}</div>`).join('')
                : '<div style="color:#86efac;">OK: No ground-contact issues in view</div>';
            (window as any).__botCheckIssues = issues.slice();
        }

        renderer.render(bcScene, bcCamera);
    }
    requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') {
    (window as any).startBotCheck = startBotCheck;
}

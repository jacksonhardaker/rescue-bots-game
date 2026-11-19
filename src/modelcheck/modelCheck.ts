// Standalone Visual Check Studio for Unique Set-Piece & Creature Models (Starship Sigma, Landmarks, Dinosaurs)
import * as THREE from 'three';
import { matInkOutline, matInkEdgeLine, toonGrad3 } from '../rendering/materials.js';
import { buildCrashedSpaceshipSigma } from '../world/spaceshipSigma.js';
import {
    CavernAnimatedEntry,
    DinoSpecies,
    buildEnergonCacheMesh,
    buildMagmaBridgeMesh,
    buildDinobotShrineMesh,
    buildMoroccoMineMesh,
    buildBoulderGalleryMesh,
    createCavernDinoMesh
} from '../world/cavernModels.js';
import { SVG_ICONS } from '../ui/icons.js';

type ModelCategory = 'Starship & Space' | 'Cavern Landmarks' | 'Cavern Dinosaurs';
type EnvPreset = 'studio' | 'cavern' | 'dark';

interface DinoAnimRig {
    headPivot: THREE.Object3D;
    tailPivot: THREE.Object3D;
    legs: THREE.Object3D[];
    phase: number;
}

interface BuiltModelResult {
    root: THREE.Group;
    animatedEntries: CavernAnimatedEntry[];
    dinoRig?: DinoAnimRig;
}

interface ModelCatalogEntry {
    id: string;
    name: string;
    category: ModelCategory;
    defaultYawDeg: number;
    defaultPitch: number;
    gridSpanX: number;
    gridSpanZ: number;
    build: () => BuiltModelResult;
}

interface ModelCell {
    spec: ModelCatalogEntry;
    gridPos: THREE.Vector3;
    holder: THREE.Group | null;
    label: HTMLDivElement | null;
    animatedEntries: CavernAnimatedEntry[];
    dinoRig?: DinoAnimRig;
    _center: THREE.Vector3;
    _size: THREE.Vector3;
    _minY: number;
    _meshCount: number;
    _triCount: number;
    _boundsReady: boolean;
}

function buildSingleDino(species: DinoSpecies, phase: number): BuiltModelResult {
    const res = createCavernDinoMesh(species);
    return {
        root: res.root,
        animatedEntries: [],
        dinoRig: {
            headPivot: res.headPivot,
            tailPivot: res.tailPivot,
            legs: res.legs,
            phase
        }
    };
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
    {
        id: 'SIGMA_CRASHED',
        name: 'Starship Sigma (Crash Diorama)',
        category: 'Starship & Space',
        defaultYawDeg: 42,
        defaultPitch: 0.34,
        gridSpanX: 50,
        gridSpanZ: 46,
        build: () => {
            const container = new THREE.Group();
            const anims: CavernAnimatedEntry[] = [];
            buildCrashedSpaceshipSigma(container, anims, null, {
                originX: 0,
                originZ: 0,
                includeDiorama: true,
                flatLevel: false
            });
            return { root: container, animatedEntries: anims };
        }
    },
    {
        id: 'SIGMA_LEVEL',
        name: 'Starship Sigma (Level Flight)',
        category: 'Starship & Space',
        defaultYawDeg: 40,
        defaultPitch: 0.28,
        gridSpanX: 50,
        gridSpanZ: 46,
        build: () => {
            const container = new THREE.Group();
            const anims: CavernAnimatedEntry[] = [];
            buildCrashedSpaceshipSigma(container, anims, null, {
                originX: 0,
                originZ: 0,
                includeDiorama: false,
                flatLevel: true
            });
            return { root: container, animatedEntries: anims };
        }
    },
    {
        id: 'ENERGON_CACHE',
        name: 'Great Energon Crystal Cache',
        category: 'Cavern Landmarks',
        defaultYawDeg: 35,
        defaultPitch: 0.35,
        gridSpanX: 30,
        gridSpanZ: 30,
        build: () => {
            const anims: CavernAnimatedEntry[] = [];
            return { root: buildEnergonCacheMesh(anims), animatedEntries: anims };
        }
    },
    {
        id: 'DINOBOT_SHRINE',
        name: 'Ancient Fossilized Dinobot Shrine',
        category: 'Cavern Landmarks',
        defaultYawDeg: 30,
        defaultPitch: 0.32,
        gridSpanX: 30,
        gridSpanZ: 30,
        build: () => ({ root: buildDinobotShrineMesh(), animatedEntries: [] })
    },
    {
        id: 'MOROCCO_MINE',
        name: "Dr. Morocco's Abandoned Mine",
        category: 'Cavern Landmarks',
        defaultYawDeg: 38,
        defaultPitch: 0.34,
        gridSpanX: 36,
        gridSpanZ: 40,
        build: () => ({ root: buildMoroccoMineMesh(), animatedEntries: [] })
    },
    {
        id: 'BOULDER_GALLERY',
        name: "Boulder's Crystal Sculpture Alcove",
        category: 'Cavern Landmarks',
        defaultYawDeg: 32,
        defaultPitch: 0.32,
        gridSpanX: 42,
        gridSpanZ: 32,
        build: () => {
            const anims: CavernAnimatedEntry[] = [];
            return { root: buildBoulderGalleryMesh(anims), animatedEntries: anims };
        }
    },
    {
        id: 'MAGMA_BRIDGE',
        name: 'Mt. Griffin Magma Core Bridge',
        category: 'Cavern Landmarks',
        defaultYawDeg: 45,
        defaultPitch: 0.42,
        gridSpanX: 64,
        gridSpanZ: 60,
        build: () => {
            const anims: CavernAnimatedEntry[] = [];
            return { root: buildMagmaBridgeMesh(anims, 28, 0.25), animatedEntries: anims };
        }
    },
    {
        id: 'DINO_TREX',
        name: 'Cavern T-Rex',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 45,
        defaultPitch: 0.28,
        gridSpanX: 20,
        gridSpanZ: 20,
        build: () => buildSingleDino('TREX', 0.2)
    },
    {
        id: 'DINO_BRONTO',
        name: 'Cavern Brontosaurus',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 50,
        defaultPitch: 0.28,
        gridSpanX: 22,
        gridSpanZ: 22,
        build: () => buildSingleDino('BRONTO', 1.1)
    },
    {
        id: 'DINO_STEGO',
        name: 'Crystal Stegosaurus',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 52,
        defaultPitch: 0.28,
        gridSpanX: 18,
        gridSpanZ: 18,
        build: () => buildSingleDino('STEGO', 2.2)
    },
    {
        id: 'DINO_TRIKE',
        name: 'Armored Triceratops',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 42,
        defaultPitch: 0.28,
        gridSpanX: 18,
        gridSpanZ: 18,
        build: () => buildSingleDino('TRIKE', 3.1)
    },
    {
        id: 'DINO_RAPTOR',
        name: 'Cavern Velociraptor',
        category: 'Cavern Dinosaurs',
        defaultYawDeg: 48,
        defaultPitch: 0.28,
        gridSpanX: 14,
        gridSpanZ: 14,
        build: () => buildSingleDino('RAPTOR', 4.3)
    }
];

export function startModelCheck(canvasEl?: HTMLCanvasElement | null) {
    const params = new URLSearchParams(location.search);
    const catalogIds = MODEL_CATALOG.map(m => m.id);
    const ENV_PRESETS: Record<EnvPreset, {
        label: string;
        bg: number;
        ground: number;
        hemiSky: number;
        hemiGround: number;
        hemiInt: number;
        sunColor: number;
        sunInt: number;
        fillInt: number;
    }> = {
        studio: {
            label: 'Studio Day',
            bg: 0xdbeafe,
            ground: 0x94a3b8,
            hemiSky: 0xffffff,
            hemiGround: 0x64748b,
            hemiInt: 0.72,
            sunColor: 0xfffbeb,
            sunInt: 0.85,
            fillInt: 0.30
        },
        cavern: {
            label: 'Cavern Mood',
            bg: 0x0b0f1e,
            ground: 0x0f172a,
            hemiSky: 0x818cf8,
            hemiGround: 0x1e293b,
            hemiInt: 0.95,
            sunColor: 0xc7d2fe,
            sunInt: 0.72,
            fillInt: 0.45
        },
        dark: {
            label: 'Dark Showcase',
            bg: 0x1e293b,
            ground: 0x0f172a,
            hemiSky: 0xe2e8f0,
            hemiGround: 0x334155,
            hemiInt: 0.9,
            sunColor: 0xf8fafc,
            sunInt: 0.95,
            fillInt: 0.4
        }
    };

    const isMobile = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
    );
    let canvas = canvasEl || (document.getElementById('modelcheck-canvas') as HTMLCanvasElement | null);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'modelcheck-canvas';
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

    const initialModelId = catalogIds.includes(params.get('model') || '')
        ? (params.get('model') as string)
        : 'SIGMA_CRASHED';
    const initialSpec = MODEL_CATALOG.find(m => m.id === initialModelId) || MODEL_CATALOG[0];
    const initialEnv: EnvPreset = (params.get('env') === 'cavern' || params.get('env') === 'dark')
        ? (params.get('env') as EnvPreset)
        : 'studio';

    const state = {
        view: params.get('view') === 'grid' ? 'grid' : 'focus',
        model: initialSpec.id,
        env: initialEnv,
        spin: params.has('spin') ? params.get('spin') !== '0' : !params.has('angle'),
        anim: params.get('anim') !== '0',
        grid: params.get('grid') !== '0',
        outlines: params.get('outlines') !== '0',
        wireframe: params.get('wireframe') === '1',
        yaw: THREE.MathUtils.degToRad(parseFloat(params.get('angle') || String(initialSpec.defaultYawDeg))),
        pitch: params.has('pitch') ? THREE.MathUtils.clamp(parseFloat(params.get('pitch') || '0.34') || 0.34, -0.45, 1.45) : initialSpec.defaultPitch,
        zoom: params.has('zoom') ? THREE.MathUtils.clamp(parseFloat(params.get('zoom') || '1') || 1, 0.2, 3.5) : 1
    };

    // --- Standalone Scene & Lighting ---
    const mcScene = new THREE.Scene();
    const mcHemi = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.85);
    mcScene.add(mcHemi);

    const mcSun = new THREE.DirectionalLight(0xfffbeb, 1.05);
    mcSun.position.set(70, 130, 90);
    mcSun.castShadow = true;
    const shadowSize = isMobile ? 1024 : 2048;
    mcSun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(mcSun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 1, far: 450 });
    mcSun.shadow.bias = -0.0004;
    mcScene.add(mcSun);

    const mcFill = new THREE.DirectionalLight(0x93c5fd, 0.35);
    mcFill.position.set(-80, 50, -90);
    mcScene.add(mcFill);

    const groundMat = new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 });
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2),
        groundMat
    );
    ground.receiveShadow = true;
    mcScene.add(ground);

    const gridHelper = new THREE.GridHelper(600, 120, 0x334155, 0x64748b);
    gridHelper.position.y = 0.03;
    mcScene.add(gridHelper);

    const mcCamera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 4000);

    function applyEnvironment(env: EnvPreset) {
        const cfg = ENV_PRESETS[env] || ENV_PRESETS.studio;
        mcScene.background = new THREE.Color(cfg.bg);
        groundMat.color.setHex(cfg.ground);
        mcHemi.color.setHex(cfg.hemiSky);
        mcHemi.groundColor.setHex(cfg.hemiGround);
        mcHemi.intensity = cfg.hemiInt;
        mcSun.color.setHex(cfg.sunColor);
        mcSun.intensity = cfg.sunInt;
        mcFill.intensity = cfg.fillInt;
        gridHelper.visible = state.grid;
    }

    function applyOutlineToggle(enabled: boolean) {
        if (matInkOutline) matInkOutline.visible = enabled;
        if (matInkEdgeLine) matInkEdgeLine.visible = enabled;
    }

    const _wireframeTouched = new Set<THREE.Material>();
    function applyWireframeToTree(root: THREE.Object3D, enabled: boolean) {
        root.traverse((obj: any) => {
            if (!obj.isMesh || obj.userData?.isOutline) return;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m: any) => {
                if (m && typeof m.wireframe === 'boolean' && (enabled || _wireframeTouched.has(m))) {
                    if (m.userData?.baseWireframe === undefined) {
                        m.userData = m.userData || {};
                        m.userData.baseWireframe = m.wireframe;
                    }
                    m.wireframe = enabled ? true : Boolean(m.userData.baseWireframe);
                    _wireframeTouched.add(m);
                }
            });
        });
    }

    // --- Label Overlay ---
    const labelLayer = document.createElement('div');
    labelLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;font:600 11px/1.2 system-ui,sans-serif;z-index:20;';
    document.body.appendChild(labelLayer);

    // --- Lazy Grid Layout grouped cleanly by category ---
    const cells: ModelCell[] = [];
    const categories: ModelCategory[] = ['Starship & Space', 'Cavern Landmarks', 'Cavern Dinosaurs'];
    let curZ = 0;
    const gridBoundsCenter = new THREE.Vector3();
    let maxRowHalfW = 0;

    categories.forEach(cat => {
        const items = MODEL_CATALOG.filter(m => m.category === cat);
        if (items.length === 0) return;

        // Fit all 5 dinosaurs cleanly onto one row; landmarks & ships max 3 per row with generous pill breathing room
        const maxPerRow = cat === 'Cavern Dinosaurs' ? 5 : 3;
        const minColSlot = cat === 'Cavern Dinosaurs' ? 36 : 48;
        const colGap = cat === 'Cavern Dinosaurs' ? 12 : 18;
        const rowGap = 20;

        for (let start = 0; start < items.length; start += maxPerRow) {
            const row = items.slice(start, start + maxPerRow);
            const rowMaxZ = row.reduce((acc, m) => Math.max(acc, m.gridSpanZ), 20);
            curZ += rowMaxZ * 0.52;

            const slotWidths = row.map(m => Math.max(m.gridSpanX, minColSlot));
            const totalW = slotWidths.reduce((acc, w) => acc + w + colGap, -colGap);
            maxRowHalfW = Math.max(maxRowHalfW, totalW * 0.5);
            let curX = -totalW * 0.5;

            row.forEach((spec, idx) => {
                const slotW = slotWidths[idx];
                const centerX = curX + slotW * 0.5;
                curX += slotW + colGap;
                cells.push({
                    spec,
                    gridPos: new THREE.Vector3(centerX, 0, curZ),
                    holder: null,
                    label: null,
                    animatedEntries: [],
                    _center: new THREE.Vector3(),
                    _size: new THREE.Vector3(),
                    _minY: 0,
                    _meshCount: 0,
                    _triCount: 0,
                    _boundsReady: false
                });
            });

            curZ += rowMaxZ * 0.52 + rowGap;
        }
    });
    const gridDepth = Math.max(40, curZ);
    // Slight -X offset keeps the full grid clear of the left studio control panel
    gridBoundsCenter.set(-14, 4, gridDepth * 0.52);

    (window as any).__modelCheckCatalog = MODEL_CATALOG.map(({ id, name, category }) => ({ id, name, category }));
    (window as any).__modelCheckCells = cells;

    const _box = new THREE.Box3();
    const _tmpBox = new THREE.Box3();
    function measureVisibleMetrics(root: THREE.Object3D) {
        _box.makeEmpty();
        root.updateMatrixWorld(true);
        let meshCount = 0;
        let triCount = 0;
        root.traverse((o: any) => {
            if (!o.visible) return;
            if (o.isMesh && !o.userData?.isOutline && o.geometry) {
                meshCount++;
                const geo = o.geometry;
                const idx = geo.getIndex();
                if (idx) triCount += Math.floor(idx.count / 3);
                else if (geo.attributes?.position) triCount += Math.floor(geo.attributes.position.count / 3);
                if (!geo.boundingBox) geo.computeBoundingBox();
                _tmpBox.copy(geo.boundingBox).applyMatrix4(o.matrixWorld);
                _box.union(_tmpBox);
            }
        });
        return { box: _box, meshCount, triCount };
    }

    function ensureCellBuilt(c: ModelCell) {
        if (c.holder && c.label) return;
        const built = c.spec.build();
        built.root.traverse((o: any) => {
            if (o.isMesh && !o.userData?.isOutline) {
                o.castShadow = true;
            }
        });

        const holder = new THREE.Group();
        holder.position.copy(c.gridPos);
        holder.add(built.root);
        mcScene.add(holder);

        const label = document.createElement('div');
        label.style.cssText = 'position:absolute;transform:translate(-50%,0);max-width:168px;white-space:normal;text-align:center;font:600 10px/1.22 system-ui,sans-serif;padding:3px 7px;border-radius:6px;background:rgba(15,23,42,.85);color:#f8fafc;border:1px solid rgba(56,189,248,.35);box-shadow:0 2px 6px rgba(0,0,0,.25);';
        labelLayer.appendChild(label);

        c.holder = holder;
        c.label = label;
        c.animatedEntries = built.animatedEntries;
        c.dinoRig = built.dinoRig;
        c._boundsReady = false;
        applyWireframeToTree(holder, state.wireframe);
    }

    // --- UI Studio Panel (custom SVGs from icons.ts, zero emoji) ---
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:12px;left:12px;z-index:30;width:292px;max-height:calc(100vh - 24px);overflow-y:auto;padding:12px;border-radius:12px;background:rgba(15,23,42,.92);color:#e2e8f0;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.32);border:1px solid rgba(148,163,184,.22);';

    const optionsMarkup = categories.map(cat => {
        const opts = MODEL_CATALOG.filter(m => m.category === cat)
            .map(m => `<option value="${m.id}">${m.name}</option>`)
            .join('');
        return `<optgroup label="${cat}">${opts}</optgroup>`;
    }).join('');

    const presetBtnCss = 'padding:3px 7px;border-radius:6px;background:#334155;color:#e2e8f0;border:1px solid #475569;font-size:11px;cursor:pointer;';

    panel.innerHTML = `
        <div style="font-weight:700;font-size:15px;margin-bottom:8px;display:flex;align-items:center;gap:7px;">
            <span data-header-icon style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;">${SVG_ICONS.CAVERN_COMPASS}</span>
            <span>Model Visual Check</span>
        </div>
        <label style="display:block;margin-bottom:6px;">View
            <select data-k="view" style="width:100%;color:#0f172a;border-radius:6px;padding:4px;margin-top:2px;">
                <option value="focus">Focus (single model)</option>
                <option value="grid">Grid (all unique models)</option>
            </select>
        </label>
        <div data-focus>
            <label style="display:block;margin-bottom:6px;">Model (${MODEL_CATALOG.length} unique)
                <div style="display:flex;gap:4px;margin-top:2px;">
                    <select data-k="model" style="flex:1;min-width:0;color:#0f172a;border-radius:6px;padding:4px;">${optionsMarkup}</select>
                    <button data-prev type="button" style="${presetBtnCss}" title="Previous model">Prev</button>
                    <button data-next type="button" style="${presetBtnCss}" title="Next model">Next</button>
                </div>
            </label>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                <button data-cam="bow" type="button" style="${presetBtnCss}">3/4 Bow</button>
                <button data-cam="stern" type="button" style="${presetBtnCss}">Stern</button>
                <button data-cam="side" type="button" style="${presetBtnCss}">Side</button>
                <button data-cam="top" type="button" style="${presetBtnCss}">Top</button>
                <button data-cam="reset" type="button" style="${presetBtnCss}">Reset</button>
            </div>
        </div>
        <label style="display:block;margin-bottom:8px;">Environment Lighting
            <select data-k="env" style="width:100%;color:#0f172a;border-radius:6px;padding:4px;margin-top:2px;">
                <option value="studio">Studio Day</option>
                <option value="cavern">Cavern Mood</option>
                <option value="dark">Dark Showcase</option>
            </select>
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;margin-bottom:8px;font-size:12px;">
            <label><input data-k="spin" type="checkbox"> Turntable</label>
            <label><input data-k="anim" type="checkbox"> Animate</label>
            <label><input data-k="grid" type="checkbox"> Grid Floor</label>
            <label><input data-k="outlines" type="checkbox"> Outlines</label>
            <label><input data-k="wireframe" type="checkbox"> Wireframe</label>
        </div>
        <div data-telemetry style="margin-top:6px;padding:8px;border-radius:8px;background:rgba(30,41,59,.85);font:11px/1.45 ui-monospace,monospace;color:#cbd5e1;"></div>
        <div style="margin-top:8px;color:#94a3b8;font-size:11px;">
            Drag orbit · Right/Shift+drag pan · Wheel zoom<br>
            <a href="./botcheck.html" style="color:#7dd3fc;">bot check</a> · <a href="./index.html" style="color:#7dd3fc;">back to game</a>
        </div>`;
    document.body.appendChild(panel);
    const q = (sel: string): any => panel.querySelector(sel);

    const _panOffset = new THREE.Vector3();
    let needsBoundsRefresh = true;

    function syncUrl() {
        const p = new URLSearchParams({
            view: state.view,
            model: state.model,
            env: state.env,
            angle: THREE.MathUtils.radToDeg(state.yaw).toFixed(0),
            pitch: state.pitch.toFixed(2),
            zoom: state.zoom.toFixed(2),
            spin: state.spin ? '1' : '0'
        });
        history.replaceState(null, '', '?' + p.toString());
    }

    function syncControlsToState() {
        panel.querySelectorAll('[data-k]').forEach((el: any) => {
            const k = el.dataset.k;
            if (el.type === 'checkbox') el.checked = (state as any)[k];
            else el.value = (state as any)[k];
        });
    }

    function selectModel(nextId: string) {
        const spec = MODEL_CATALOG.find(m => m.id === nextId);
        if (!spec) return;
        state.model = spec.id;
        state.yaw = THREE.MathUtils.degToRad(spec.defaultYawDeg);
        state.pitch = spec.defaultPitch;
        state.zoom = 1;
        _panOffset.set(0, 0, 0);
        needsBoundsRefresh = true;
        syncControlsToState();
        syncUrl();
    }

    panel.querySelectorAll('[data-k]').forEach((el: any) => {
        const k = el.dataset.k;
        if (el.type === 'checkbox') el.checked = (state as any)[k];
        else el.value = (state as any)[k];
        el.addEventListener('input', () => {
            if (k === 'model') {
                selectModel(el.value);
                return;
            }
            (state as any)[k] = el.type === 'checkbox' ? el.checked : el.value;
            if (k === 'env' || k === 'grid') applyEnvironment(state.env);
            if (k === 'outlines') applyOutlineToggle(state.outlines);
            if (k === 'wireframe') {
                cells.forEach(c => { if (c.holder) applyWireframeToTree(c.holder, state.wireframe); });
            }
            if (k === 'view') _panOffset.set(0, 0, 0);
            needsBoundsRefresh = true;
            syncUrl();
        });
    });

    q('[data-prev]')?.addEventListener('click', () => {
        const idx = Math.max(0, catalogIds.indexOf(state.model));
        selectModel(catalogIds[(idx - 1 + catalogIds.length) % catalogIds.length]);
    });
    q('[data-next]')?.addEventListener('click', () => {
        const idx = Math.max(0, catalogIds.indexOf(state.model));
        selectModel(catalogIds[(idx + 1) % catalogIds.length]);
    });

    panel.querySelectorAll('[data-cam]').forEach((btn: any) => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.cam;
            state.spin = false;
            if (preset === 'bow') {
                state.yaw = THREE.MathUtils.degToRad(40);
                state.pitch = 0.34;
            } else if (preset === 'stern') {
                state.yaw = THREE.MathUtils.degToRad(215);
                state.pitch = 0.30;
            } else if (preset === 'side') {
                state.yaw = THREE.MathUtils.degToRad(90);
                state.pitch = 0.20;
            } else if (preset === 'top') {
                state.yaw = 0;
                state.pitch = 1.35;
            } else if (preset === 'reset') {
                const spec = MODEL_CATALOG.find(m => m.id === state.model) || MODEL_CATALOG[0];
                state.yaw = THREE.MathUtils.degToRad(spec.defaultYawDeg);
                state.pitch = spec.defaultPitch;
                state.zoom = 1;
                _panOffset.set(0, 0, 0);
            }
            syncControlsToState();
            syncUrl();
        });
    });

    // Expose programmatic switcher helper for testing
    (window as any).__setModelCheckState = (patch: Partial<typeof state>) => {
        Object.assign(state, patch);
        applyEnvironment(state.env);
        applyOutlineToggle(state.outlines);
        cells.forEach(c => { if (c.holder) applyWireframeToTree(c.holder, state.wireframe); });
        needsBoundsRefresh = true;
        syncControlsToState();
        syncUrl();
    };

    // --- Orbit + Right/Shift Pan + Wheel Zoom Controls ---
    let dragMode: 'none' | 'orbit' | 'pan' = 'none';
    let lastX = 0;
    let lastY = 0;
    const _panRight = new THREE.Vector3();
    const _panUp = new THREE.Vector3();

    renderer.domElement.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());
    renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (e.button === 2 || e.shiftKey) {
            dragMode = 'pan';
        } else {
            dragMode = 'orbit';
            state.spin = false;
            q('[data-k=spin]').checked = false;
        }
    });
    window.addEventListener('pointerup', () => { dragMode = 'none'; });
    window.addEventListener('pointermove', (e: PointerEvent) => {
        if (dragMode === 'none') return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        if (dragMode === 'orbit') {
            state.yaw -= dx * 0.008;
            state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.006, -0.45, 1.45);
        } else {
            const panScale = 0.06 * state.zoom;
            mcCamera.updateMatrixWorld();
            _panRight.setFromMatrixColumn(mcCamera.matrixWorld, 0);
            _panUp.setFromMatrixColumn(mcCamera.matrixWorld, 1);
            _panOffset.addScaledVector(_panRight, -dx * panScale);
            _panOffset.addScaledVector(_panUp, dy * panScale);
        }
    });
    renderer.domElement.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        state.zoom = THREE.MathUtils.clamp(state.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.2, 3.5);
    }, { passive: false });
    window.addEventListener('resize', () => {
        mcCamera.aspect = window.innerWidth / window.innerHeight;
        mcCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    applyEnvironment(state.env);
    applyOutlineToggle(state.outlines);

    const _v = new THREE.Vector3();
    const _center = new THREE.Vector3();
    const _size = new THREE.Vector3();
    const _camTarget = new THREE.Vector3();
    let lastNow = performance.now();
    let telemetryTimer = 0;

    function animateCellEffects(c: ModelCell, dt: number, nowSec: number) {
        if (!state.anim) return;
        for (let i = 0; i < c.animatedEntries.length; i++) {
            const am = c.animatedEntries[i];
            if (am.kind === 'SPIN_PULSE') {
                am.obj.rotation.y += dt * 1.4;
                am.obj.position.y = am.baseY + Math.sin(nowSec * 2.8 + am.phase) * 0.5;
            } else if (am.kind === 'FLICKER') {
                const sc = 0.85 + Math.sin(nowSec * 14.0 + am.phase) * 0.15;
                am.obj.scale.setScalar(sc);
            } else if (am.kind === 'LAVA_PULSE') {
                am.obj.position.y = am.baseY + Math.sin(nowSec * 2.5 + am.phase) * 0.08;
            }
        }
        if (c.dinoRig) {
            const dr = c.dinoRig;
            const cyc = nowSec * 4.5 + dr.phase;
            const swing = Math.sin(cyc) * 0.35;
            for (let l = 0; l < dr.legs.length; l++) {
                dr.legs[l].rotation.x = (l % 2 === 0 ? swing : -swing);
            }
            dr.tailPivot.rotation.y = Math.sin(nowSec * 3.4 + dr.phase) * 0.3;
            dr.headPivot.rotation.x = Math.sin(nowSec * 2.4 + dr.phase) * 0.1;
        }
    }

    function frame(now: number) {
        requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - lastNow) / 1000);
        lastNow = now;
        const nowSec = now * 0.001;
        if (state.spin) state.yaw += dt * 0.32;

        const isFocus = state.view === 'focus';
        q('[data-focus]').style.display = isFocus ? '' : 'none';

        telemetryTimer -= dt;
        const updateTelemetry = telemetryTimer <= 0;
        if (updateTelemetry) telemetryTimer = 0.25;

        let focusCell: ModelCell | null = null;
        let builtCount = 0;

        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            const show = !isFocus || c.spec.id === state.model;
            if (!show) {
                if (c.holder) c.holder.visible = false;
                if (c.label) c.label.style.display = 'none';
                continue;
            }

            ensureCellBuilt(c);
            builtCount++;
            const holder = c.holder!;
            const label = c.label!;
            holder.visible = true;
            label.style.display = '';

            if (!isFocus) {
                holder.position.copy(c.gridPos);
                holder.rotation.y = state.spin ? nowSec * 0.28 : 0;
            } else {
                holder.position.set(0, 0, 0);
                holder.rotation.y = 0;
                focusCell = c;
            }

            animateCellEffects(c, dt, nowSec);

            if (needsBoundsRefresh || !c._boundsReady) {
                const { box, meshCount, triCount } = measureVisibleMetrics(holder);
                if (!box.isEmpty()) {
                    box.getCenter(_center);
                    box.getSize(_size);
                    c._center.copy(_center);
                    c._size.copy(_size);
                    c._minY = box.min.y;
                } else {
                    c._center.copy(holder.position);
                    c._size.set(6, 6, 6);
                    c._minY = 0;
                }
                c._meshCount = meshCount;
                c._triCount = triCount;
                c._boundsReady = true;
            }
        }
        needsBoundsRefresh = false;

        // Camera Positioning
        if (!isFocus) {
            _camTarget.copy(gridBoundsCenter).add(_panOffset);
            const span = Math.max(gridDepth * 1.15, (maxRowHalfW * 2) / Math.max(0.95, mcCamera.aspect * 0.92));
            const dist = span * 1.05 * state.zoom;
            const pitchClamped = THREE.MathUtils.clamp(state.pitch + 0.42, 0.16, 1.45);
            mcCamera.position.set(
                _camTarget.x + Math.sin(state.spin ? 0 : state.yaw) * Math.cos(pitchClamped) * dist,
                _camTarget.y + Math.sin(pitchClamped) * dist,
                _camTarget.z + Math.cos(state.spin ? 0 : state.yaw) * Math.cos(pitchClamped) * dist
            );
            mcCamera.lookAt(_camTarget);
        } else if (focusCell) {
            _camTarget.copy(focusCell._center).add(_panOffset);
            const dist = Math.max(12, focusCell._size.length() * 1.15) * state.zoom;
            mcCamera.position.set(
                _camTarget.x + Math.sin(state.yaw) * Math.cos(state.pitch) * dist,
                _camTarget.y + Math.sin(state.pitch) * dist,
                _camTarget.z + Math.cos(state.yaw) * Math.cos(state.pitch) * dist
            );
            mcCamera.lookAt(_camTarget);
        }

        // Floating Labels
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (!c.holder || !c.holder.visible || !c.label) continue;
            if (isFocus) {
                c.label.style.display = 'none';
                continue;
            }
            _v.set(c.holder.position.x, -0.5, c.holder.position.z + c.spec.gridSpanZ * 0.46).project(mcCamera);
            const onScreen = _v.z < 1 && Math.abs(_v.x) < 1.15 && Math.abs(_v.y) < 1.15;
            c.label.style.display = onScreen ? '' : 'none';
            if (!onScreen) continue;
            c.label.style.left = ((_v.x + 1) / 2 * window.innerWidth) + 'px';
            c.label.style.top = ((1 - _v.y) / 2 * window.innerHeight) + 'px';
            c.label.innerHTML = `${c.spec.name}<br><span style="color:#94a3b8;font-weight:500;">${c._size.x.toFixed(0)}×${c._size.y.toFixed(0)}×${c._size.z.toFixed(0)} m</span>`;
        }

        if (updateTelemetry) {
            const activeCell = focusCell;
            let totalMeshes = 0;
            let totalTris = 0;
            cells.forEach(c => {
                if (c.holder && c.holder.visible) {
                    totalMeshes += c._meshCount;
                    totalTris += c._triCount;
                }
            });
            const telemetryEl = q('[data-telemetry]');
            if (telemetryEl) {
                if (isFocus && activeCell) {
                    const s = activeCell._size;
                    telemetryEl.innerHTML =
                        `<div><b>${activeCell.spec.name}</b></div>` +
                        `<div style="color:#7dd3fc;">${activeCell.spec.category}</div>` +
                        `<div>Size: ${s.x.toFixed(1)} × ${s.y.toFixed(1)} × ${s.z.toFixed(1)} m</div>` +
                        `<div>Ground minY: ${activeCell._minY >= 0 ? '+' : ''}${activeCell._minY.toFixed(2)} m</div>` +
                        `<div>Meshes: ${activeCell._meshCount} | Tris: ${activeCell._triCount.toLocaleString()}</div>`;
                } else {
                    telemetryEl.innerHTML =
                        `<div><b>Grid Mode: ${builtCount} / ${cells.length} Models</b></div>` +
                        `<div>Visible Meshes: ${totalMeshes}</div>` +
                        `<div>Visible Tris: ${totalTris.toLocaleString()}</div>`;
                }
            }
            (window as any).__modelCheckStats = {
                builtCount,
                totalCatalog: cells.length,
                view: state.view,
                env: state.env,
                activeId: state.model,
                meshes: isFocus && activeCell ? activeCell._meshCount : totalMeshes,
                triangles: isFocus && activeCell ? activeCell._triCount : totalTris,
                size: isFocus && activeCell ? { x: activeCell._size.x, y: activeCell._size.y, z: activeCell._size.z } : null,
                minY: isFocus && activeCell ? activeCell._minY : null
            };
        }

        renderer.render(mcScene, mcCamera);
    }
    requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') {
    (window as any).startModelCheck = startModelCheck;
}

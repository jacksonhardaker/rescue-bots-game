// Persistent Game Settings & Control Remapping
// Stored in `rescue_bots_settings_v1` - persists independently across game releases
import * as THREE from 'three';
import { isMobileDevice } from '../rendering/scene.js';
import { OUTLINE_LAYER } from '../rendering/materials.js';

export const SETTINGS_STORAGE_KEY = 'rescue_bots_settings_v1';

export interface AudioSettings {
    masterVolume: number;
    sfxVolume: number;
    engineVolume: number;
    muted: boolean;
}

export interface GraphicsSettings {
    preset: string;
    shadows: string;
    outlines: boolean;
    drawDistance: string;
    resolution: string;
    autoFpsGovernor: boolean;
}

export interface ControlBindings {
    forward: string[];
    backward: string[];
    left: string[];
    right: string[];
    transform: string[];
    primaryAction: string[];
    secondaryAction: string[];
    descendAction: string[];
    siren: string[];
    drillAction: string[];
    dock: string[];
    buddyCycle: string[];
    weatherCycle: string[];
    map: string[];
    [key: string]: string[];
}

export interface GameSettings {
    version: number;
    audio: AudioSettings;
    graphics: GraphicsSettings;
    controls: ControlBindings;
}

export interface ApplyGameSettingsOptions {
    sfx?: { applySettingsVolumes?: () => void } | null;
    renderer?: THREE.WebGLRenderer | null;
    sunLight?: THREE.DirectionalLight | null;
    camera?: THREE.PerspectiveCamera | null;
    scene?: THREE.Scene | null;
    matInkOutline?: THREE.Material | null;
    matInkEdgeLine?: THREE.Material | null;
}

export const DEFAULT_SETTINGS: GameSettings = {
    version: 1,
    audio: {
        masterVolume: 1.0,
        sfxVolume: 1.0,
        engineVolume: 0.75,
        muted: false
    },
    graphics: {
        preset: 'high',
        shadows: 'high', // 'off' | 'low' | 'medium' | 'high'
        outlines: true,
        drawDistance: 'high', // 'low' (1300) | 'medium' (1800) | 'high' (2400)
        resolution: 'high', // 'ultralow' (0.75x) | 'low' (1x) | 'medium' (1.35x) | 'high' (2x)
        autoFpsGovernor: true
    },
    controls: {
        forward: ['KeyW', 'ArrowUp'],
        backward: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight'],
        transform: ['Space'],
        primaryAction: ['KeyE', 'ShiftLeft', 'ShiftRight'],
        secondaryAction: ['KeyQ', 'KeyF'],
        descendAction: ['KeyC'],
        siren: ['KeyH'],
        drillAction: ['KeyG'],
        dock: ['KeyX'],
        buddyCycle: ['KeyB'],
        weatherCycle: ['KeyT'],
        map: ['KeyM']
    }
};

export const ACTION_LABELS = {
    forward: 'Drive Forward / Ascend Flight',
    backward: 'Reverse / Brake',
    left: 'Steer Left',
    right: 'Steer Right',
    transform: 'Transform (Bot / Vehicle / Dino)',
    primaryAction: 'Primary Special (Water/Drill/Winch)',
    secondaryAction: 'Secondary Action / Ascend Flight',
    descendAction: 'Descend Flight (Helicopter)',
    siren: 'Toggle Siren & Beacons',
    drillAction: 'Boulder Ground Drill (Enter / Exit Caverns)',
    dock: 'Dock / Undock Megabot (Optimus & High Tide)',
    buddyCycle: 'Switch Partner Buddy Bot',
    weatherCycle: 'Cycle Island Weather',
    map: 'Open Island Tactical Map'
};

export function loadGameSettings(): GameSettings {
    let s: Partial<GameSettings> | null = null;
    let raw: string | null = null;
    try {
        raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) s = JSON.parse(raw) as Partial<GameSettings>;
    } catch (e) {
        console.warn('Could not read settings from localStorage', e);
    }
    if (!s || typeof s !== 'object') s = {};
    const defaultGraphics: GraphicsSettings = !raw && isMobileDevice
        ? { preset: 'medium', shadows: 'low', outlines: true, drawDistance: 'medium', resolution: 'medium', autoFpsGovernor: true }
        : DEFAULT_SETTINGS.graphics;
    return {
        version: 1,
        audio: { ...DEFAULT_SETTINGS.audio, ...(s.audio || {}) },
        graphics: { ...defaultGraphics, ...(s.graphics || {}) },
        controls: { ...DEFAULT_SETTINGS.controls, ...(s.controls || {}) }
    };
}

export let gameSettings: GameSettings = loadGameSettings();
export let activeRebindAction: string | null = null;

export function setActiveRebindAction(action: string | null) {
    activeRebindAction = action;
}

export function saveGameSettings() {
    try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(gameSettings));
    } catch (e) {
        console.warn('Could not save settings to localStorage', e);
    }
}

export function formatKeyName(code: string | null | undefined): string {
    if (!code) return 'None';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    if (code === 'Space') return 'Space';
    if (code === 'ArrowUp') return '↑ Up';
    if (code === 'ArrowDown') return '↓ Down';
    if (code === 'ArrowLeft') return '← Left';
    if (code === 'ArrowRight') return '→ Right';
    if (code === 'ShiftLeft') return 'L-Shift';
    if (code === 'ShiftRight') return 'R-Shift';
    return code;
}

export function isActionActive(action: string, inputKeys?: Record<string, boolean>): boolean {
    if (!gameSettings || !gameSettings.controls) return false;
    const list = gameSettings.controls[action];
    if (!list) return false;
    const keys: Record<string, boolean> = inputKeys || (window.input && window.input.keys) || {};
    for (let i = 0; i < list.length; i++) {
        if (keys[list[i]]) return true;
    }
    return false;
}

export function matchesAction(eventCode: string, action: string): boolean {
    if (!gameSettings || !gameSettings.controls) return false;
    const list = gameSettings.controls[action];
    return Boolean(list && list.includes(eventCode));
}

export function getSceneOutlineStats(scene?: THREE.Scene | null, matInkOutline?: THREE.Material | null, matInkEdgeLine?: THREE.Material | null) {
    let totalMeshes = 0;
    let outlineMeshes = 0;
    const sc = scene || window.scene;
    const mo = matInkOutline || (window.matInkOutline as THREE.Material | undefined);
    const me = matInkEdgeLine || (window.matInkEdgeLine as THREE.Material | undefined);
    if (sc) {
        sc.traverse((node: THREE.Object3D) => {
            const mesh = node as THREE.Mesh & { isInstancedMesh?: boolean };
            if (mesh.isMesh || mesh.isInstancedMesh) {
                totalMeshes++;
                if (mesh.material === mo || mesh.material === me || (node.userData && node.userData.isOutline)) {
                    outlineMeshes++;
                }
            }
        });
    }
    const ratio = Math.round((outlineMeshes / (totalMeshes || 1)) * 100);
    return { totalMeshes, outlineMeshes, ratio };
}

export function applyGameSettings(options: ApplyGameSettingsOptions = {}) {
    const sfx = options.sfx || (window.sfx as { applySettingsVolumes?: () => void } | undefined);
    const renderer = options.renderer || window.renderer;
    const sunLight = options.sunLight || (window.sunLight as THREE.DirectionalLight | undefined);
    const camera = options.camera || window.camera;
    const scene = options.scene || window.scene;
    const matInkOutline = options.matInkOutline || (window.matInkOutline as THREE.Material | undefined);
    const matInkEdgeLine = options.matInkEdgeLine || (window.matInkEdgeLine as THREE.Material | undefined);

    // 1. Audio Volumes
    if (sfx && typeof sfx.applySettingsVolumes === 'function') {
        sfx.applySettingsVolumes();
    }
    const soundLabel = document.getElementById('sound-label');
    if (soundLabel) {
        soundLabel.textContent = gameSettings.audio.muted ? 'Sounds: OFF' : 'Sounds: ON';
    }

    // 2. Outlines Material Visibility & Camera Layer Culling (skips outline nodes completely when OFF)
    const showOutlines = Boolean(gameSettings.graphics.outlines);
    if (camera && camera.layers) {
        if (showOutlines) camera.layers.enable(OUTLINE_LAYER);
        else camera.layers.disable(OUTLINE_LAYER);
    }
    if (matInkOutline && matInkEdgeLine) {
        matInkOutline.visible = showOutlines;
        matInkEdgeLine.visible = showOutlines;
    }

    // 3. Directional Shadows
    if (renderer && sunLight) {
        const sh = gameSettings.graphics.shadows;
        if (sh === 'off') {
            renderer.shadowMap.enabled = false;
            sunLight.castShadow = false;
        } else {
            renderer.shadowMap.enabled = true;
            sunLight.castShadow = true;
            let mapSize = isMobileDevice ? 2048 : 4096;
            let radius = isMobileDevice ? 320 : 380;
            if (sh === 'low') {
                mapSize = 1024;
                radius = 180;
            } else if (sh === 'medium') {
                mapSize = isMobileDevice ? 1024 : 2048;
                radius = isMobileDevice ? 240 : 280;
            }
            if (sunLight.shadow.mapSize.width !== mapSize || sunLight.shadow.mapSize.height !== mapSize) {
                sunLight.shadow.mapSize.set(mapSize, mapSize);
                const shadowMap = sunLight.shadow.map as THREE.WebGLRenderTarget | null;
                if (shadowMap) {
                    shadowMap.dispose();
                    (sunLight.shadow as unknown as { map: THREE.WebGLRenderTarget | null }).map = null;
                }
                renderer.shadowMap.needsUpdate = true;
            }
            sunLight.shadow.camera.left = -radius;
            sunLight.shadow.camera.right = radius;
            sunLight.shadow.camera.top = radius;
            sunLight.shadow.camera.bottom = -radius;
            sunLight.shadow.camera.updateProjectionMatrix();
        }
    }

    // 4. Scenery Draw Distance & Fog
    if (camera && scene) {
        const dd = gameSettings.graphics.drawDistance;
        let far = 2400;
        let fogD = 0.00038;
        if (dd === 'low') {
            far = 950;
            fogD = 0.00105;
        } else if (dd === 'medium') {
            far = 1600;
            fogD = 0.00055;
        }
        camera.far = far;
        camera.updateProjectionMatrix();
        if (scene.fog && 'density' in scene.fog) {
            scene.fog.density = fogD;
        }
    }

    // 5. Internal Resolution
    if (renderer) {
        const res = gameSettings.graphics.resolution;
        const rawDpr = window.devicePixelRatio || 1;
        let pr = Math.min(rawDpr, isMobileDevice ? 1.5 : 2.0);
        if (res === 'ultralow') {
            pr = 0.75;
        } else if (res === 'low') {
            pr = 1.0;
        } else if (res === 'medium') {
            pr = Math.min(rawDpr, isMobileDevice ? 1.25 : 1.35);
        }
        renderer.setPixelRatio(pr);
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (typeof window.syncSettingsUI === 'function') {
        window.syncSettingsUI();
    }
}

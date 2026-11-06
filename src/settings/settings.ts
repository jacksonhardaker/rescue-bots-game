// Persistent Game Settings & Control Remapping
// Stored in `rescue_bots_settings_v1` - persists independently across game releases

export const SETTINGS_STORAGE_KEY = 'rescue_bots_settings_v1';

export const DEFAULT_SETTINGS = {
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
        resolution: 'high' // 'low' (1x) | 'medium' (1.35x) | 'high' (2x)
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
    dock: 'Dock / Undock Megabot (Optimus & High Tide)',
    buddyCycle: 'Switch Partner Buddy Bot',
    weatherCycle: 'Cycle Island Weather',
    map: 'Open Island Tactical Map'
};

export function loadGameSettings() {
    let s = null;
    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) s = JSON.parse(raw);
    } catch (e) {
        console.warn('Could not read settings from localStorage', e);
    }
    if (!s || typeof s !== 'object') s = {};
    return {
        version: 1,
        audio: { ...DEFAULT_SETTINGS.audio, ...(s.audio || {}) },
        graphics: { ...DEFAULT_SETTINGS.graphics, ...(s.graphics || {}) },
        controls: { ...DEFAULT_SETTINGS.controls, ...(s.controls || {}) }
    };
}

export let gameSettings = loadGameSettings();
export let activeRebindAction = null;

export function setActiveRebindAction(action) {
    activeRebindAction = action;
}

export function saveGameSettings() {
    try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(gameSettings));
    } catch (e) {
        console.warn('Could not save settings to localStorage', e);
    }
}

export function formatKeyName(code) {
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

export function isActionActive(action: string, inputKeys?: any) {
    if (!gameSettings || !gameSettings.controls) return false;
    const list = gameSettings.controls[action];
    if (!list) return false;
    const keys = inputKeys || (window.input && window.input.keys) || {};
    for (let i = 0; i < list.length; i++) {
        if (keys[list[i]]) return true;
    }
    return false;
}

export function matchesAction(eventCode, action) {
    if (!gameSettings || !gameSettings.controls) return false;
    const list = gameSettings.controls[action];
    return Boolean(list && list.includes(eventCode));
}

export function getSceneOutlineStats(scene?: any, matInkOutline?: any, matInkEdgeLine?: any) {
    let totalMeshes = 0;
    let outlineMeshes = 0;
    const sc = scene || window.scene;
    const mo = matInkOutline || window.matInkOutline;
    const me = matInkEdgeLine || window.matInkEdgeLine;
    if (sc) {
        sc.traverse(node => {
            if (node.isMesh || node.isInstancedMesh) {
                totalMeshes++;
                if (node.material === mo || node.material === me || (node.userData && node.userData.isOutline)) {
                    outlineMeshes++;
                }
            }
        });
    }
    const ratio = Math.round((outlineMeshes / (totalMeshes || 1)) * 100);
    return { totalMeshes, outlineMeshes, ratio };
}

export function applyGameSettings(options: Record<string, any> = {}) {
    const sfx = options.sfx || window.sfx;
    const renderer = options.renderer || window.renderer;
    const sunLight = options.sunLight || window.sunLight;
    const camera = options.camera || window.camera;
    const scene = options.scene || window.scene;
    const matInkOutline = options.matInkOutline || window.matInkOutline;
    const matInkEdgeLine = options.matInkEdgeLine || window.matInkEdgeLine;

    // 1. Audio Volumes
    if (sfx && typeof sfx.applySettingsVolumes === 'function') {
        sfx.applySettingsVolumes();
    }
    const soundLabel = document.getElementById('sound-label');
    if (soundLabel) {
        soundLabel.textContent = gameSettings.audio.muted ? 'Sounds: OFF' : 'Sounds: ON';
    }

    // 2. Outlines Material Visibility
    if (matInkOutline && matInkEdgeLine) {
        matInkOutline.visible = Boolean(gameSettings.graphics.outlines);
        matInkEdgeLine.visible = Boolean(gameSettings.graphics.outlines);
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
            let mapSize = 4096;
            let radius = 380;
            if (sh === 'low') {
                mapSize = 1024;
                radius = 180;
            } else if (sh === 'medium') {
                mapSize = 2048;
                radius = 280;
            }
            sunLight.shadow.mapSize.set(mapSize, mapSize);
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
            far = 1300;
            fogD = 0.00065;
        } else if (dd === 'medium') {
            far = 1800;
            fogD = 0.00048;
        }
        camera.far = far;
        camera.updateProjectionMatrix();
        if (scene.fog) {
            scene.fog.density = fogD;
        }
    }

    // 5. Internal Resolution
    if (renderer) {
        const res = gameSettings.graphics.resolution;
        let pr = Math.min(window.devicePixelRatio || 1, 2.0);
        if (res === 'low') {
            pr = 1.0;
        } else if (res === 'medium') {
            pr = Math.min(window.devicePixelRatio || 1, 1.35);
        }
        renderer.setPixelRatio(pr);
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (typeof window.syncSettingsUI === 'function') {
        window.syncSettingsUI();
    }
}

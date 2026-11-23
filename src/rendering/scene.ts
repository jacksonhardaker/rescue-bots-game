// Three.js Scene, WebGLRenderer, Perspective Camera & Directional Sun Lighting
import * as THREE from 'three';
import { OUTLINE_LAYER } from './materials.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4cc9f0);
scene.fog = new THREE.FogExp2(0x4cc9f0, 0.00042);

export const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.6, 2200);
camera.layers.enable(OUTLINE_LAYER);
camera.position.set(0, 14.5, 8.5);
camera.lookAt(0, 8.2, -15);

export const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.72);
scene.add(hemiLight);

export const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
sunLight.position.set(220, 340, 180);
sunLight.castShadow = true;
export const isMobileDevice = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1));
const shadowDim = isMobileDevice ? 1024 : 4096;
sunLight.shadow.mapSize.width = shadowDim;
sunLight.shadow.mapSize.height = shadowDim;
sunLight.shadow.camera.near = 20;
sunLight.shadow.camera.far = 950;
const shadowD = 380;
sunLight.shadow.camera.left = -shadowD;
sunLight.shadow.camera.right = shadowD;
sunLight.shadow.camera.top = shadowD;
sunLight.shadow.camera.bottom = -shadowD;
sunLight.shadow.bias = 0.0003;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);
scene.add(sunLight.target);

export let canvas: HTMLCanvasElement | null = null;
export let renderer: THREE.WebGLRenderer | null = null;

if (typeof window !== 'undefined') {
    window.scene = scene;
    window.camera = camera;
    window.sunLight = sunLight;
    window.hemiLight = hemiLight;
    window.isMobileDevice = isMobileDevice;
}

export function initScene(customCanvas?: HTMLCanvasElement | null) {
    if (typeof document === 'undefined') return { scene, camera, renderer, canvas };

    const targetCanvas = customCanvas || (document.getElementById('game-canvas') as HTMLCanvasElement | null);
    if (!targetCanvas) {
        console.warn('Canvas game-canvas not found, creating virtual canvas');
        canvas = document.createElement('canvas');
    } else {
        canvas = targetCanvas;
    }

    let preferAntialias = true;
    try {
        const raw = window.localStorage.getItem('rescue_bots_settings_v1');
        if (raw) {
            const parsed = JSON.parse(raw) as { graphics?: { preset?: string; resolution?: string } } | null;
            if (parsed?.graphics?.preset === 'low' || parsed?.graphics?.resolution === 'ultralow') {
                preferAntialias = false;
            }
        }
    } catch {}

    const activeRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: preferAntialias,
        powerPreference: 'high-performance'
    });
    renderer = activeRenderer;
    activeRenderer.setSize(window.innerWidth, window.innerHeight);
    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.5 : 2));
    activeRenderer.shadowMap.enabled = true;
    activeRenderer.shadowMap.type = isMobileDevice ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    activeRenderer.shadowMap.autoUpdate = !isMobileDevice;
    activeRenderer.outputEncoding = THREE.sRGBEncoding;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (typeof window !== 'undefined') {
        window.renderer = activeRenderer;
    }

    return { canvas, renderer, scene, camera, hemiLight, sunLight };
}

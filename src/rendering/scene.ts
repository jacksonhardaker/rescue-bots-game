// Three.js Scene, WebGLRenderer, Perspective Camera & Directional Sun Lighting
import * as THREE from 'three';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4cc9f0);
scene.fog = new THREE.FogExp2(0x4cc9f0, 0.00042);

export const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.6, 2200);
camera.position.set(0, 14.5, 8.5);
camera.lookAt(0, 8.2, -15);

export const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.72);
scene.add(hemiLight);

export const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
sunLight.position.set(220, 340, 180);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 20;
sunLight.shadow.camera.far = 950;
const shadowD = 380;
sunLight.shadow.camera.left = -shadowD;
sunLight.shadow.camera.right = shadowD;
sunLight.shadow.camera.top = shadowD;
sunLight.shadow.camera.bottom = -shadowD;
sunLight.shadow.bias = -0.0003;
sunLight.shadow.normalBias = 0.04;
scene.add(sunLight);
scene.add(sunLight.target);

export let canvas = null;
export let renderer = null;

if (typeof window !== 'undefined') {
    window.scene = scene;
    window.camera = camera;
    window.sunLight = sunLight;
    window.hemiLight = hemiLight;
}

export function initScene(customCanvas?: any) {
    if (typeof document === 'undefined') return { scene, camera, renderer, canvas };

    canvas = customCanvas || document.getElementById('game-canvas');
    if (!canvas) {
        console.warn('Canvas game-canvas not found, creating virtual canvas');
        canvas = document.createElement('canvas');
    }

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (typeof window !== 'undefined') {
        window.renderer = renderer;
    }

    return { canvas, renderer, scene, camera, hemiLight, sunLight };
}

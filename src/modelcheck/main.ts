// Standalone Entry Point for Model Visual Check Studio (modelcheck.html)
import * as THREE from 'three';
import { startModelCheck } from './modelCheck.js';

if (typeof window !== 'undefined') {
    (window as any).THREE = THREE;
    const boot = () => startModelCheck(document.getElementById('modelcheck-canvas') as HTMLCanvasElement | null);
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}

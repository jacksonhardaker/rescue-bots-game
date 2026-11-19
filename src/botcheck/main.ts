// Standalone Entry Point for Bot Visual Check Studio (botcheck.html)
import * as THREE from 'three';
import { startBotCheck } from './visualCheck.js';

if (typeof window !== 'undefined') {
    (window as any).THREE = THREE;
    const boot = () => startBotCheck(document.getElementById('botcheck-canvas') as HTMLCanvasElement | null);
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}

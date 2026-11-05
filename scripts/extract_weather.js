import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const script = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const lines = script.split('\n');

const weatherPart = lines.slice(8246, 8524).join('\n');

const file = `// Griffin Rock Island Dynamic Weather & Environmental Systems
import * as THREE from 'three';
import { toonGrad3, toonGrad4 } from '../rendering/materials.js';
import { SVG_ICONS } from '../ui/icons.js';
import { progression, saveProgression } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { player } from '../state/gameState.js';

export let rainSystem = null;
export let volcanoEmberSystem = null;
export let starFieldGroup = null;
export let auroraMesh = null;
export let OUTPOST_PADS = [];
export let outpostPadRings = [];
export let WEATHER_MODES = [];
export let cycleWeatherMode = null;

export function initWeather(scene) {
    const s = scene || (typeof window !== 'undefined' ? window.scene : null);
    if (!s) return;

${weatherPart
    .replace('const rainSystem = createRainSystem();', 'rainSystem = createRainSystem();')
    .replace('const volcanoEmberSystem = createVolcanoEmberSystem();', 'volcanoEmberSystem = createVolcanoEmberSystem();')
    .replace('const starFieldGroup = createStarField();', 'starFieldGroup = createStarField();')
    .replace('const auroraMesh = createAuroraMesh();', 'auroraMesh = createAuroraMesh();')
    .replace('const OUTPOST_PADS = [', 'OUTPOST_PADS = [')
    .replace('const WEATHER_MODES = [', 'WEATHER_MODES = [')
    .replace('function cycleWeatherMode(', 'cycleWeatherMode = function(')
    .replace(/scene\.add\(/g, 's.add(')
}

    if (typeof window !== 'undefined') {
        window.rainSystem = rainSystem;
        window.volcanoEmberSystem = volcanoEmberSystem;
        window.starFieldGroup = starFieldGroup;
        window.auroraMesh = auroraMesh;
        window.cycleWeatherMode = cycleWeatherMode;
        window.OUTPOST_PADS = OUTPOST_PADS;
        window.WEATHER_MODES = WEATHER_MODES;
    }
}
`;

fs.writeFileSync('src/world/weather.js', file, 'utf8');
console.log('Created src/world/weather.js');

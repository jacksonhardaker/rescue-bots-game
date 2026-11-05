import fs from 'fs';

const src = fs.readFileSync('index.monolithic.html', 'utf8');

const startBuilder = src.indexOf('function buildRescueBotModel(botType) {');
const endBuilder = src.indexOf('const botRigs = {');
const builderBody = src.substring(startBuilder, endBuilder);

const botConfigs = [
    { name: 'boulder', type: 'BOULDER', fn: 'buildBoulder' },
    { name: 'heatwave', type: 'HEATWAVE', fn: 'buildHeatwave' },
    { name: 'chase', type: 'CHASE', fn: 'buildChase' },
    { name: 'blades', type: 'BLADES', fn: 'buildBlades' },
    { name: 'optimus', type: 'OPTIMUS', fn: 'buildOptimus' },
    { name: 'bumblebee', type: 'BUMBLEBEE', fn: 'buildBumblebee' },
    { name: 'blurr', type: 'BLURR', fn: 'buildBlurr' },
    { name: 'salvage', type: 'SALVAGE', fn: 'buildSalvage' },
    { name: 'hightide', type: 'HIGHTIDE', fn: 'buildHighTide' },
    { name: 'quickshadow', type: 'QUICKSHADOW', fn: 'buildQuickshadow' }
];

const offsets = botConfigs.map(c => ({
    ...c,
    idx: builderBody.indexOf(`if (botType === '${c.type}')`)
}));

for (let i = 0; i < offsets.length; i++) {
    const cur = offsets[i];
    const nextIdx = (i < offsets.length - 1) ? offsets[i+1].idx : builderBody.indexOf('applyCartoonInkOutlines(root');
    let block = builderBody.substring(cur.idx, nextIdx).trim();

    // Strip leading `if (botType === '...') {` and trailing `}`
    const firstBrace = block.indexOf('{');
    const lastBrace = block.lastIndexOf('}');
    const innerCode = block.substring(firstBrace + 1, lastBrace).trim();

    const fileContent = `// 3D Cel-Shaded Model & Morph Builder for ${cur.type}
import * as THREE from 'three';

export function ${cur.fn}(parts, materials = {}, textures = {}) {
    const {
        toonGrad3, toonGrad4, toonGradGlossy,
        matChrome, matDarkSteel, matTire, matCabGlass,
        matVisorCyan, matVisorGold, matSirenRed, matSirenBlue,
        matEmblem, matHazardMat, matGrille, matInkOutline
    } = (typeof window !== 'undefined' ? window : {});

    ${innerCode}
}

export default ${cur.fn};
`;

    fs.writeFileSync(`src/bots/${cur.name}.js`, fileContent, 'utf8');
    console.log(`Generated src/bots/${cur.name}.js (${innerCode.split('\n').length} lines)`);
}

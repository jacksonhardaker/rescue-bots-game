// Adds missing imports reported by tsc (TS2304/TS2552) when exactly one src module exports the name.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let out = '';
try { execSync('pnpm exec tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' }); } catch (e) { out = e.stdout || ''; }

const missing = new Map(); // file -> Set(names)
for (const line of out.split('\n')) {
    const m = line.match(/^([^(]+)\(\d+,\d+\): error TS(?:2304|2552): Cannot find name '([^']+)'/);
    if (!m) continue;
    if (!missing.has(m[1])) missing.set(m[1], new Set());
    missing.get(m[1]).add(m[2]);
}

const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') && !p.endsWith('.d.ts') && files.push(p); } })('src');

const exporters = new Map(); // name -> [files]
for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/^[ \t]*export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm)) {
        if (!exporters.has(m[1])) exporters.set(m[1], []);
        exporters.get(m[1]).push(f);
    }
}

const unresolved = [];
for (const [file, names] of missing) {
    const byModule = new Map();
    for (const n of names) {
        const cands = (exporters.get(n) || []).filter(c => c !== file);
        if (cands.length !== 1) { unresolved.push(`${file}: ${n} (${cands.length} candidates)`); continue; }
        if (!byModule.has(cands[0])) byModule.set(cands[0], []);
        byModule.get(cands[0]).push(n);
    }
    if (!byModule.size) continue;
    let src = fs.readFileSync(file, 'utf8');
    let imports = '';
    for (const [mod, ns] of byModule) {
        let rel = path.relative(path.dirname(file), mod).replace(/\\/g, '/').replace(/\.ts$/, '.js');
        if (!rel.startsWith('.')) rel = './' + rel;
        imports += `import { ${ns.join(', ')} } from '${rel}';\n`;
    }
    // insert after the last top-level import statement
    const all = [...src.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm)];
    const idx = all.length ? all[all.length - 1].index + all[all.length - 1][0].length : 0;
    src = src.slice(0, idx) + '\n' + imports.trimEnd() + src.slice(idx);
    fs.writeFileSync(file, src);
    console.log('patched', file, [...byModule.values()].flat().join(', '));
}
console.log('\nUNRESOLVED:\n' + unresolved.join('\n'));

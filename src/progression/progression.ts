// Persistent Save Data & Progression Architecture (V4 Migration Pipeline)
// Preserves progress across V1-V3 formats and release version bumps.

export const RELEASE_VERSION = '2026.11.02.6';
export const CURRENT_SAVE_VERSION = 4;
export const SAVE_STORAGE_KEY = 'rescue_bots_save_v4';
export const LEGACY_SAVE_KEYS = ['rescue_bots_save_v3', 'rescue_bots_save_v2', 'rescue_bots_save_v1'];
export const PROGRESSION_STORAGE_PREFIX = 'rescue_bots_progression_';
export const PROGRESSION_STORAGE_KEY = `${PROGRESSION_STORAGE_PREFIX}${RELEASE_VERSION}`;

export const progression: Record<string, any> = {
    saveVersion: CURRENT_SAVE_VERSION,
    releaseVersion: RELEASE_VERSION,
    totalEmergenciesResolved: 0,
    totalCitizensRescued: 0,
    totalEnergonCubes: 0,
    totalStuntsCompleted: 0,
    discoveredLandmarks: [],
    collectedCrests: [],
    discoveredAllies: [],
    autoSpawnEmergencies: true,
    playerBotType: 'BOULDER',
    buddyBotType: 'HEATWAVE',
    playerMode: 'BOT',
    highTideDocked: false,
    optimusDocked: false,
    weatherMode: 'SUNNY',
    playerPosition: null,
    completedMissions: []
};

export const RESCUE_STAR_RANKS = [
    { level: 1, minPts: 0,   title: 'CADET BOT',            nextPts: 10 },
    { level: 2, minPts: 10,  title: 'JUNIOR RESPONDER',     nextPts: 25 },
    { level: 3, minPts: 25,  title: 'ISLAND SPECIALIST',    nextPts: 50 },
    { level: 4, minPts: 50,  title: 'GRIFFIN ROCK CAPTAIN', nextPts: 90 },
    { level: 5, minPts: 90,  title: 'PRIME RESCUE HERO',    nextPts: null }
];

export let lastKnownRankLevel = 1;
export function setLastKnownRankLevel(val) {
    lastKnownRankLevel = val;
}

export function renderStarSVGs(count) {
    const starSvg = `<svg viewBox="0 0 24 24" style="width:13px;height:13px;display:inline-block;" class="fill-amber-400 stroke-amber-500 drop-shadow" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;
    let out = '';
    for (let i = 0; i < count; i++) {
        out += starSvg;
    }
    return out;
}

export function getHeroPoints(prog = progression) {
    const landmarkPts = (Array.isArray(prog.discoveredLandmarks) ? prog.discoveredLandmarks.length * 2 : 0);
    const crestPts = (Array.isArray(prog.collectedCrests) ? prog.collectedCrests.length * 5 : 0);
    const allyPts = (Array.isArray(prog.discoveredAllies) ? prog.discoveredAllies.length * 10 : 0);
    return (prog.totalEnergonCubes || 0) + (prog.totalEmergenciesResolved || 0) * 3 + (prog.totalStuntsCompleted || 0) + landmarkPts + crestPts + allyPts;
}

export function getRescueStarRank(prog = progression) {
    const pts = getHeroPoints(prog);
    let current = RESCUE_STAR_RANKS[0];
    for (let i = 0; i < RESCUE_STAR_RANKS.length; i++) {
        if (pts >= RESCUE_STAR_RANKS[i].minPts) {
            current = RESCUE_STAR_RANKS[i];
        }
    }
    return { ...current, pts };
}

export function loadProgression(options: Record<string, any> = {}) {
    const BOT_METADATA = options.BOT_METADATA || window.BOT_METADATA || {};
    const player = options.player || window.player || { botType: 'BOULDER' };
    const buddyBot = options.buddyBot || window.buddyBot || { botType: 'HEATWAVE' };

    let target: Record<string, any> = {};
    try {
        const rawV4 = window.localStorage.getItem(SAVE_STORAGE_KEY);
        if (rawV4) {
            target = JSON.parse(rawV4) || {};
        }
    } catch (e) {
        console.warn('Error reading V4 save:', e);
    }

    // Upward Migration Pipeline: Inspect legacy save formats V3, V2, V1, and release-scoped keys
    const candidates = [];
    try {
        for (const k of LEGACY_SAVE_KEYS) {
            const raw = window.localStorage.getItem(k);
            if (raw) {
                try { candidates.push(JSON.parse(raw)); } catch(e){}
            }
        }
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(PROGRESSION_STORAGE_PREFIX)) {
                const raw = window.localStorage.getItem(k);
                if (raw) {
                    try { candidates.push(JSON.parse(raw)); } catch(e){}
                }
            }
        }
    } catch (e) {
        console.warn('Error scanning legacy saves:', e);
    }

    // Merge highest progress without wiping anything
    candidates.forEach(data => {
        if (!data) return;
        ['totalEmergenciesResolved', 'totalCitizensRescued', 'totalEnergonCubes', 'totalStuntsCompleted'].forEach(f => {
            if (Number.isFinite(data[f]) && data[f] > (target[f] || 0)) {
                target[f] = Math.floor(data[f]);
            }
        });
        ['discoveredLandmarks', 'collectedCrests', 'discoveredAllies'].forEach(f => {
            if (Array.isArray(data[f])) {
                const s = new Set(target[f] || []);
                data[f].forEach(x => {
                    if (typeof x === 'string' || typeof x === 'number') s.add(x);
                });
                target[f] = Array.from(s);
            }
        });
        if (typeof data.autoSpawnEmergencies === 'boolean' && target.autoSpawnEmergencies === undefined) {
            target.autoSpawnEmergencies = data.autoSpawnEmergencies;
        }
        if (typeof data.playerBotType === 'string' && (BOT_METADATA[data.playerBotType] || !target.playerBotType)) {
            target.playerBotType = data.playerBotType;
        }
        if (typeof data.buddyBotType === 'string' && BOT_METADATA[data.buddyBotType] && !target.buddyBotType) {
            target.buddyBotType = data.buddyBotType;
        }
        if (typeof data.playerMode === 'string' && !target.playerMode) {
            target.playerMode = data.playerMode;
        }
        if (typeof data.weatherMode === 'string' && !target.weatherMode) {
            target.weatherMode = data.weatherMode;
        }
        if (typeof data.highTideDocked === 'boolean' && target.highTideDocked === undefined) {
            target.highTideDocked = data.highTideDocked;
        }
        if (typeof data.optimusDocked === 'boolean' && target.optimusDocked === undefined) {
            target.optimusDocked = data.optimusDocked;
        }
        if (data.playerPosition && typeof data.playerPosition === 'object' && !target.playerPosition) {
            target.playerPosition = data.playerPosition;
        }
        if (Array.isArray(data.completedMissions)) {
            const s = new Set(target.completedMissions || []);
            data.completedMissions.forEach(x => {
                if (typeof x === 'number') s.add(x);
            });
            target.completedMissions = Array.from(s);
        }
    });

    if (Number.isFinite(target.totalEmergenciesResolved) && target.totalEmergenciesResolved >= 0) {
        progression.totalEmergenciesResolved = Math.floor(target.totalEmergenciesResolved);
    }
    if (Number.isFinite(target.totalCitizensRescued) && target.totalCitizensRescued >= 0) {
        progression.totalCitizensRescued = Math.floor(target.totalCitizensRescued);
    }
    if (Number.isFinite(target.totalEnergonCubes) && target.totalEnergonCubes >= 0) {
        progression.totalEnergonCubes = Math.floor(target.totalEnergonCubes);
    }
    if (Number.isFinite(target.totalStuntsCompleted) && target.totalStuntsCompleted >= 0) {
        progression.totalStuntsCompleted = Math.floor(target.totalStuntsCompleted);
    }
    if (Array.isArray(target.discoveredLandmarks)) {
        progression.discoveredLandmarks = target.discoveredLandmarks.filter(x => typeof x === 'string');
    }
    if (Array.isArray(target.collectedCrests)) {
        progression.collectedCrests = target.collectedCrests.filter(x => typeof x === 'string' || typeof x === 'number');
    }
    if (Array.isArray(target.discoveredAllies)) {
        progression.discoveredAllies = target.discoveredAllies.filter(x => typeof x === 'string');
    }
    if (typeof target.autoSpawnEmergencies === 'boolean') {
        progression.autoSpawnEmergencies = target.autoSpawnEmergencies;
    }
    const VALID_BOTS = ['BOULDER', 'HEATWAVE', 'CHASE', 'BLADES', 'OPTIMUS', 'BUMBLEBEE', 'BLURR', 'SALVAGE', 'HIGHTIDE', 'QUICKSHADOW'];
    if (typeof target.playerBotType === 'string' && (BOT_METADATA[target.playerBotType] || VALID_BOTS.includes(target.playerBotType))) {
        progression.playerBotType = target.playerBotType;
    }
    if (typeof target.buddyBotType === 'string' && (BOT_METADATA[target.buddyBotType] || VALID_BOTS.includes(target.buddyBotType))) {
        progression.buddyBotType = target.buddyBotType;
    }
    if (typeof target.playerMode === 'string' && ['BOT', 'VEHICLE', 'DINO'].includes(target.playerMode)) {
        progression.playerMode = target.playerMode;
    }
    if (typeof target.weatherMode === 'string') {
        progression.weatherMode = target.weatherMode;
    }
    if (typeof target.highTideDocked === 'boolean') {
        progression.highTideDocked = target.highTideDocked;
    }
    if (typeof target.optimusDocked === 'boolean') {
        progression.optimusDocked = target.optimusDocked;
    }
    if (target.playerPosition && typeof target.playerPosition === 'object') {
        if (Number.isFinite(target.playerPosition.x) && Number.isFinite(target.playerPosition.z)) {
            progression.playerPosition = {
                x: target.playerPosition.x,
                y: Number.isFinite(target.playerPosition.y) ? target.playerPosition.y : 5.0,
                z: target.playerPosition.z,
                heading: Number.isFinite(target.playerPosition.heading) ? target.playerPosition.heading : 0
            };
        }
    }
    if (Array.isArray(target.completedMissions)) {
        progression.completedMissions = target.completedMissions.filter(x => typeof x === 'number');
    }

    progression.saveVersion = CURRENT_SAVE_VERSION;
    progression.releaseVersion = RELEASE_VERSION;

    try {
        window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progression));
        window.localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(progression));
    } catch(e){}

    lastKnownRankLevel = getRescueStarRank(progression).level;
    if (progression.buddyBotType && BOT_METADATA[progression.buddyBotType] && progression.buddyBotType !== player.botType) {
        buddyBot.botType = progression.buddyBotType;
    } else {
        buddyBot.botType = player.botType === 'HEATWAVE' ? 'BOULDER' : 'HEATWAVE';
    }
    syncProgressionHUD();
    if (typeof window.syncHUDToActiveBot === 'function') {
        window.syncHUDToActiveBot();
    }
}

export function saveProgression(options: Record<string, any> = {}) {
    const sfx = options.sfx || window.sfx;
    const player = options.player || window.player;
    const spawnBurstParticles = options.spawnBurstParticles || window.spawnBurstParticles;
    const showToast = options.showToast || window.showToast;
    const triggerNPCSpeech = options.triggerNPCSpeech || window.triggerNPCSpeech;

    const newRank = getRescueStarRank(progression);
    const rankedUp = newRank.level > lastKnownRankLevel;
    lastKnownRankLevel = newRank.level;

    try {
        progression.saveVersion = CURRENT_SAVE_VERSION;
        progression.releaseVersion = RELEASE_VERSION;
        window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progression));
        window.localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(progression));
    } catch (err) {
        // Ignore storage quota / private mode restrictions
    }
    syncProgressionHUD();

    if (rankedUp) {
        if (sfx && sfx.playRankUp) sfx.playRankUp();
        if (spawnBurstParticles && player) spawnBurstParticles(player.pos.x, player.pos.y + 3.5, player.pos.z, 0xfacc15, 22, 1.45);
        if (showToast) showToast(`RANK UP! (${newRank.level} Star)`, `Promoted to ${newRank.title}!`);
        if (triggerNPCSpeech) {
            triggerNPCSpeech(
                "Chief Charlie Burns",
                "Rescue Command",
                `Congratulations, Rescue Bots! You've been promoted to ${newRank.title}! Griffin Rock is proud of you!`,
                0.88,
                true
            );
        }
    }
}

export function syncProgressionHUD() {
    const totalEmEl = document.getElementById('stat-total-emergencies');
    const totalCitEl = document.getElementById('stat-total-citizens');
    const totalEnEl = document.getElementById('stat-total-energon');
    const totalLandmarksEl = document.getElementById('stat-total-landmarks');
    const totalCrestsEl = document.getElementById('stat-total-crests');
    const totalAlliesEl = document.getElementById('stat-total-allies');
    if (totalEmEl) totalEmEl.textContent = String(progression.totalEmergenciesResolved);
    if (totalCitEl) totalCitEl.textContent = String(progression.totalCitizensRescued);
    if (totalEnEl) totalEnEl.textContent = String(progression.totalEnergonCubes);
    if (totalLandmarksEl) totalLandmarksEl.textContent = String(Array.isArray(progression.discoveredLandmarks) ? progression.discoveredLandmarks.length : 0);
    if (totalCrestsEl) totalCrestsEl.textContent = String(Array.isArray(progression.collectedCrests) ? progression.collectedCrests.length : 0);
    if (totalAlliesEl) {
        const count = Array.isArray(progression.discoveredAllies) ? progression.discoveredAllies.length : 0;
        totalAlliesEl.textContent = String(count);
        totalAlliesEl.className = count >= 6 ? 'text-emerald-400 font-extrabold' : 'text-purple-300 font-bold';
    }

    const rankInfo = getRescueStarRank(progression);
    const rankBadgeEl = document.getElementById('stat-rank-badge');
    const rankStarsEl = document.getElementById('stat-rank-stars');
    const rankTitleEl = document.getElementById('stat-rank-title');
    if (rankStarsEl && rankTitleEl) {
        rankStarsEl.innerHTML = renderStarSVGs(rankInfo.level);
        rankTitleEl.textContent = rankInfo.title;
    } else if (rankBadgeEl) {
        rankBadgeEl.innerHTML = `<span id="stat-rank-stars" class="flex items-center gap-0.5">${renderStarSVGs(rankInfo.level)}</span><span id="stat-rank-title">${rankInfo.title}</span>`;
    }
}

export function exportSaveData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(progression, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `griffin-rock-save-v${CURRENT_SAVE_VERSION}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

export function importSaveData(file: any, onComplete?: () => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const parsed = JSON.parse(e.target.result as string);
            if (parsed && typeof parsed === 'object') {
                ['totalEmergenciesResolved', 'totalCitizensRescued', 'totalEnergonCubes', 'totalStuntsCompleted'].forEach(f => {
                    if (Number.isFinite(parsed[f])) progression[f] = Math.max(0, Math.floor(parsed[f]));
                });
                ['discoveredLandmarks', 'collectedCrests', 'discoveredAllies'].forEach(f => {
                    if (Array.isArray(parsed[f])) progression[f] = parsed[f];
                });
                if (typeof parsed.buddyBotType === 'string' && (window.BOT_METADATA ? window.BOT_METADATA[parsed.buddyBotType] : true)) {
                    progression.buddyBotType = parsed.buddyBotType;
                }
                saveProgression();
                if (onComplete) onComplete();
                else window.location.reload();
            }
        } catch (err) {
            alert('Could not read or parse save file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

export function resetCareerProgress(onComplete) {
    if (confirm('Are you sure you want to reset your career progress? This will reset your emergency count, energon cubes, and rank. Your settings and keybindings will be kept.')) {
        progression.totalEmergenciesResolved = 0;
        progression.totalCitizensRescued = 0;
        progression.totalEnergonCubes = 0;
        progression.totalStuntsCompleted = 0;
        progression.discoveredLandmarks = [];
        progression.collectedCrests = [];
        progression.discoveredAllies = [];
        progression.highTideDocked = false;
        progression.optimusDocked = false;
        progression.playerBotType = 'BOULDER';
        progression.buddyBotType = 'HEATWAVE';
        progression.playerMode = 'BOT';
        progression.playerPosition = null;
        progression.completedMissions = [];
        saveProgression();
        if (onComplete) onComplete();
        else window.location.reload();
    }
}

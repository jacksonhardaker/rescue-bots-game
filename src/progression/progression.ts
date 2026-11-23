// Persistent Save Data & Progression Architecture (V4 Migration Pipeline)
// Preserves progress across V1-V3 formats and release version bumps.
import type { BotMetaEntry, PlayerState, BuddyBotState } from '../types/game.js';

export const RELEASE_VERSION = '2026.11.02.6';
export const CURRENT_SAVE_VERSION = 4;
export const SAVE_STORAGE_KEY = 'rescue_bots_save_v4';
export const LEGACY_SAVE_KEYS = ['rescue_bots_save_v3', 'rescue_bots_save_v2', 'rescue_bots_save_v1'];
export const PROGRESSION_STORAGE_PREFIX = 'rescue_bots_progression_';
export const PROGRESSION_STORAGE_KEY = `${PROGRESSION_STORAGE_PREFIX}${RELEASE_VERSION}`;

export interface ProgressionData {
    saveVersion: number;
    releaseVersion: string;
    totalEmergenciesResolved: number;
    totalCitizensRescued: number;
    totalEnergonCubes: number;
    totalStuntsCompleted: number;
    discoveredLandmarks: string[];
    collectedCrests: Array<string | number>;
    discoveredAllies: string[];
    autoSpawnEmergencies: boolean;
    playerBotType: string;
    buddyBotType: string;
    playerMode: string;
    highTideDocked: boolean;
    optimusDocked: boolean;
    boulderDocked: boolean;
    heatwaveDocked: boolean;
    chaseDocked: boolean;
    bladesDocked: boolean;
    bumblebeeDocked: boolean;
    blurrDocked: boolean;
    salvageDocked: boolean;
    quickshadowDocked: boolean;
    starspeedDocked: boolean;
    weatherMode: string;
    playerPosition: { x: number; y: number; z: number; heading: number } | null;
    completedMissions: number[];
    discoveredCavernLandmarks: string[];
    cavernGemsCollected: number;
    exploredCavernCells: number[];
    brokenCavernWalls: string[];
    sigmaPartsFound: string[];
    sigmaInstalledParts: string[];
    sigmaRepaired: boolean;
    spaceAsteroidsCleared: number;
    spaceRescuesDone: number;
    spaceRingsCompleted: number;
    spaceMoroccoDefeated: boolean;
    moonRelicsFound: string[];
    moonFlagPlanted: boolean;
    moonHoopsCleared: number;
    visitedPlanets: string[];
    planetRelicsFound: string[];
    planetCavernRelicsFound: string[];
    planetMonolithsScanned: string[];
    planetCoursesCompleted: string[];
    jupiterMoonsVisited: string[];
    uranusMoonsVisited: string[];
    spaceCometsCaught: number;
    saturnBestLapSec: number | null;
    saturnRacesCompleted: number;
    saturnWins: number;
    [key: string]: unknown;
}

export interface LoadProgressionOptions {
    BOT_METADATA?: Record<string, BotMetaEntry>;
    player?: Pick<PlayerState, 'botType'>;
    buddyBot?: Pick<BuddyBotState, 'botType'>;
}

export interface SaveProgressionOptions {
    immediate?: boolean;
    sfx?: { playRankUp?: () => void } | null;
    player?: Pick<PlayerState, 'pos'> | null;
    spawnBurstParticles?: (x: number, y: number, z: number, colorHex: number, count?: number, speed?: number) => void;
    showToast?: (subtitle: string, title: string) => void;
    triggerNPCSpeech?: (speakerName: string, speakerRole: string, speechText: string, targetOrPitch?: number | object | null, isDirectPlayerLine?: boolean, isEmergencyCall?: boolean) => void;
}

export const progression: ProgressionData = {
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
    boulderDocked: false,
    heatwaveDocked: false,
    chaseDocked: false,
    bladesDocked: false,
    bumblebeeDocked: false,
    blurrDocked: false,
    salvageDocked: false,
    quickshadowDocked: false,
    starspeedDocked: false,
    weatherMode: 'SUNNY',
    playerPosition: null,
    completedMissions: [],
    discoveredCavernLandmarks: [],
    cavernGemsCollected: 0,
    exploredCavernCells: [],
    brokenCavernWalls: [],
    sigmaPartsFound: [],
    sigmaInstalledParts: [],
    sigmaRepaired: false,
    spaceAsteroidsCleared: 0,
    spaceRescuesDone: 0,
    spaceRingsCompleted: 0,
    spaceMoroccoDefeated: false,
    moonRelicsFound: [],
    moonFlagPlanted: false,
    moonHoopsCleared: 0,
    visitedPlanets: [],
    planetRelicsFound: [],
    planetCavernRelicsFound: [],
    planetMonolithsScanned: [],
    planetCoursesCompleted: [],
    jupiterMoonsVisited: [],
    uranusMoonsVisited: [],
    spaceCometsCaught: 0,
    saturnBestLapSec: null,
    saturnRacesCompleted: 0,
    saturnWins: 0
};

export const ALL_PLAYABLE_BOTS = ['BOULDER', 'HEATWAVE', 'CHASE', 'BLADES', 'OPTIMUS', 'BUMBLEBEE', 'BLURR', 'SALVAGE', 'HIGHTIDE', 'QUICKSHADOW', 'STARSPEED'];

export function getBotDockedKey(botType: string): string {
    if (botType === 'HIGHTIDE') return 'highTideDocked';
    if (botType === 'OPTIMUS') return 'optimusDocked';
    if (botType === 'QUICKSHADOW') return 'quickshadowDocked';
    if (botType === 'BUMBLEBEE') return 'bumblebeeDocked';
    return `${botType.toLowerCase()}Docked`;
}

export function isBotDocked(botType: string): boolean {
    const k = getBotDockedKey(botType);
    return Boolean(progression[k]);
}

export function setBotDocked(botType: string, val: boolean) {
    const k = getBotDockedKey(botType);
    progression[k] = Boolean(val);
}

export const RESCUE_STAR_RANKS = [
    { level: 1, minPts: 0,   title: 'CADET BOT',            nextPts: 10 },
    { level: 2, minPts: 10,  title: 'JUNIOR RESPONDER',     nextPts: 25 },
    { level: 3, minPts: 25,  title: 'ISLAND SPECIALIST',    nextPts: 50 },
    { level: 4, minPts: 50,  title: 'GRIFFIN ROCK CAPTAIN', nextPts: 90 },
    { level: 5, minPts: 90,  title: 'PRIME RESCUE HERO',    nextPts: null }
];

export let lastKnownRankLevel = 1;
export function setLastKnownRankLevel(val: number) {
    lastKnownRankLevel = val;
}

export function renderStarSVGs(count: number): string {
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
    const cavernLandmarkPts = (Array.isArray(prog.discoveredCavernLandmarks) ? prog.discoveredCavernLandmarks.length * 4 : 0);
    const cavernGemPts = Math.floor((prog.cavernGemsCollected || 0) / 3);
    const sigmaPts = (prog.sigmaRepaired ? 12 : 0) + (Array.isArray(prog.sigmaInstalledParts) ? prog.sigmaInstalledParts.length * 3 : 0);
    const spacePts = (prog.spaceAsteroidsCleared || 0) + (prog.spaceRescuesDone || 0) * 5 + (prog.spaceRingsCompleted || 0) * 8 + (prog.spaceMoroccoDefeated ? 20 : 0);
    const moonPts = (Array.isArray(prog.moonRelicsFound) ? prog.moonRelicsFound.length * 5 : 0) + (prog.moonFlagPlanted ? 6 : 0) + (prog.moonHoopsCleared || 0) * 2;
    const solarPts = (Array.isArray(prog.visitedPlanets) ? prog.visitedPlanets.length * 3 : 0)
        + (Array.isArray(prog.planetRelicsFound) ? prog.planetRelicsFound.length * 5 : 0)
        + (Array.isArray(prog.jupiterMoonsVisited) ? prog.jupiterMoonsVisited.length * 3 : 0)
        + (prog.saturnRacesCompleted || 0) * 10;
    return (prog.totalEnergonCubes || 0) + (prog.totalEmergenciesResolved || 0) * 3 + (prog.totalStuntsCompleted || 0) + landmarkPts + crestPts + allyPts + cavernLandmarkPts + cavernGemPts + sigmaPts + spacePts + moonPts + solarPts;
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

export function loadProgression(options: LoadProgressionOptions = {}) {
    const BOT_METADATA = options.BOT_METADATA || window.BOT_METADATA || {};
    const player = options.player || window.player || { botType: 'BOULDER' };
    const buddyBot = options.buddyBot || window.buddyBot || { botType: 'HEATWAVE' };

    let target: Record<string, unknown> = {};
    try {
        const rawV4 = window.localStorage.getItem(SAVE_STORAGE_KEY);
        if (rawV4) {
            target = (JSON.parse(rawV4) as Record<string, unknown>) || {};
        }
    } catch (e) {
        console.warn('Error reading V4 save:', e);
    }

    // Upward Migration Pipeline: Inspect legacy save formats V3, V2, V1, and release-scoped keys
    const candidates: Array<Record<string, unknown> | null> = [];
    try {
        for (const k of LEGACY_SAVE_KEYS) {
            const raw = window.localStorage.getItem(k);
            if (raw) {
                try { candidates.push(JSON.parse(raw) as Record<string, unknown>); } catch(e){}
            }
        }
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(PROGRESSION_STORAGE_PREFIX)) {
                const raw = window.localStorage.getItem(k);
                if (raw) {
                    try { candidates.push(JSON.parse(raw) as Record<string, unknown>); } catch(e){}
                }
            }
        }
    } catch (e) {
        console.warn('Error scanning legacy saves:', e);
    }

    // Merge highest progress without wiping anything
    candidates.forEach(data => {
        if (!data) return;
        ['totalEmergenciesResolved', 'totalCitizensRescued', 'totalEnergonCubes', 'totalStuntsCompleted', 'cavernGemsCollected'].forEach(f => {
            const val = data[f];
            const prev = typeof target[f] === 'number' ? (target[f] as number) : 0;
            if (typeof val === 'number' && Number.isFinite(val) && val > prev) {
                target[f] = Math.floor(val);
            }
        });
        ['discoveredLandmarks', 'collectedCrests', 'discoveredAllies', 'discoveredCavernLandmarks', 'brokenCavernWalls'].forEach(f => {
            const arr = data[f];
            if (Array.isArray(arr)) {
                const existing = Array.isArray(target[f]) ? (target[f] as Array<string | number>) : [];
                const s = new Set<string | number>(existing);
                arr.forEach((x: unknown) => {
                    if (typeof x === 'string' || typeof x === 'number') s.add(x);
                });
                target[f] = Array.from(s);
            }
        });
        if (Array.isArray(data.exploredCavernCells)) {
            const existing = Array.isArray(target.exploredCavernCells) ? (target.exploredCavernCells as number[]) : [];
            const s = new Set<number>(existing);
            data.exploredCavernCells.forEach((x: unknown) => {
                if (typeof x === 'number' && Number.isFinite(x)) s.add(x);
            });
            target.exploredCavernCells = Array.from(s);
        }
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
        ALL_PLAYABLE_BOTS.forEach(b => {
            const k = getBotDockedKey(b);
            if (typeof data[k] === 'boolean' && target[k] === undefined) {
                target[k] = data[k];
            }
        });
        if (data.playerPosition && typeof data.playerPosition === 'object' && !target.playerPosition) {
            target.playerPosition = data.playerPosition;
        }
        if (Array.isArray(data.completedMissions)) {
            const existing = Array.isArray(target.completedMissions) ? (target.completedMissions as number[]) : [];
            const s = new Set<number>(existing);
            data.completedMissions.forEach((x: unknown) => {
                if (typeof x === 'number') s.add(x);
            });
            target.completedMissions = Array.from(s);
        }
    });

    if (typeof target.totalEmergenciesResolved === 'number' && Number.isFinite(target.totalEmergenciesResolved) && target.totalEmergenciesResolved >= 0) {
        progression.totalEmergenciesResolved = Math.floor(target.totalEmergenciesResolved);
    }
    if (typeof target.totalCitizensRescued === 'number' && Number.isFinite(target.totalCitizensRescued) && target.totalCitizensRescued >= 0) {
        progression.totalCitizensRescued = Math.floor(target.totalCitizensRescued);
    }
    if (typeof target.totalEnergonCubes === 'number' && Number.isFinite(target.totalEnergonCubes) && target.totalEnergonCubes >= 0) {
        progression.totalEnergonCubes = Math.floor(target.totalEnergonCubes);
    }
    if (typeof target.totalStuntsCompleted === 'number' && Number.isFinite(target.totalStuntsCompleted) && target.totalStuntsCompleted >= 0) {
        progression.totalStuntsCompleted = Math.floor(target.totalStuntsCompleted);
    }
    if (Array.isArray(target.discoveredLandmarks)) {
        progression.discoveredLandmarks = target.discoveredLandmarks.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(target.collectedCrests)) {
        progression.collectedCrests = target.collectedCrests.filter((x): x is string | number => typeof x === 'string' || typeof x === 'number');
    }
    if (Array.isArray(target.discoveredAllies)) {
        progression.discoveredAllies = target.discoveredAllies.filter((x): x is string => typeof x === 'string');
    }
    if (typeof target.autoSpawnEmergencies === 'boolean') {
        progression.autoSpawnEmergencies = target.autoSpawnEmergencies;
    }
    const VALID_BOTS = ['BOULDER', 'HEATWAVE', 'CHASE', 'BLADES', 'OPTIMUS', 'BUMBLEBEE', 'BLURR', 'SALVAGE', 'HIGHTIDE', 'QUICKSHADOW', 'STARSPEED'];
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
    ALL_PLAYABLE_BOTS.forEach(b => {
        const k = getBotDockedKey(b);
        if (typeof target[k] === 'boolean') {
            progression[k] = target[k];
        }
    });
    if (target.playerPosition && typeof target.playerPosition === 'object') {
        const pos = target.playerPosition as { x?: unknown; y?: unknown; z?: unknown; heading?: unknown };
        if (typeof pos.x === 'number' && Number.isFinite(pos.x) && typeof pos.z === 'number' && Number.isFinite(pos.z)) {
            progression.playerPosition = {
                x: pos.x,
                y: typeof pos.y === 'number' && Number.isFinite(pos.y) ? pos.y : 5.0,
                z: pos.z,
                heading: typeof pos.heading === 'number' && Number.isFinite(pos.heading) ? pos.heading : 0
            };
        }
    }
    if (Array.isArray(target.completedMissions)) {
        progression.completedMissions = target.completedMissions.filter((x): x is number => typeof x === 'number');
    }
    if (typeof target.cavernGemsCollected === 'number' && Number.isFinite(target.cavernGemsCollected) && target.cavernGemsCollected >= 0) {
        progression.cavernGemsCollected = Math.floor(target.cavernGemsCollected);
    }
    if (Array.isArray(target.discoveredCavernLandmarks)) {
        progression.discoveredCavernLandmarks = target.discoveredCavernLandmarks.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(target.exploredCavernCells)) {
        progression.exploredCavernCells = target.exploredCavernCells.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
    }
    if (Array.isArray(target.brokenCavernWalls)) {
        progression.brokenCavernWalls = target.brokenCavernWalls.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(target.sigmaPartsFound)) {
        progression.sigmaPartsFound = target.sigmaPartsFound.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(target.sigmaInstalledParts)) {
        progression.sigmaInstalledParts = target.sigmaInstalledParts.filter((x): x is string => typeof x === 'string');
    }
    if (typeof target.sigmaRepaired === 'boolean') {
        progression.sigmaRepaired = target.sigmaRepaired;
    }
    if (typeof target.spaceAsteroidsCleared === 'number' && Number.isFinite(target.spaceAsteroidsCleared) && target.spaceAsteroidsCleared >= 0) {
        progression.spaceAsteroidsCleared = Math.floor(target.spaceAsteroidsCleared);
    }
    if (typeof target.spaceRescuesDone === 'number' && Number.isFinite(target.spaceRescuesDone) && target.spaceRescuesDone >= 0) {
        progression.spaceRescuesDone = Math.floor(target.spaceRescuesDone);
    }
    if (typeof target.spaceRingsCompleted === 'number' && Number.isFinite(target.spaceRingsCompleted) && target.spaceRingsCompleted >= 0) {
        progression.spaceRingsCompleted = Math.floor(target.spaceRingsCompleted);
    }
    if (Array.isArray(target.moonRelicsFound)) {
        progression.moonRelicsFound = target.moonRelicsFound.filter((x): x is string => typeof x === 'string');
    }
    if (typeof target.moonFlagPlanted === 'boolean') {
        progression.moonFlagPlanted = target.moonFlagPlanted;
    }
    if (typeof target.spaceMoroccoDefeated === 'boolean') {
        progression.spaceMoroccoDefeated = target.spaceMoroccoDefeated;
    }
    if (typeof target.moonHoopsCleared === 'number' && Number.isFinite(target.moonHoopsCleared) && target.moonHoopsCleared >= 0) {
        progression.moonHoopsCleared = Math.floor(target.moonHoopsCleared);
    }

    progression.saveVersion = CURRENT_SAVE_VERSION;
    progression.releaseVersion = RELEASE_VERSION;

    try {
        window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progression));
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

let _saveDirty = false;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 5000;

export function flushProgressionSave() {
    if (!_saveDirty) return;
    if (_saveTimer) {
        clearTimeout(_saveTimer);
        _saveTimer = null;
    }
    _saveDirty = false;
    try {
        progression.saveVersion = CURRENT_SAVE_VERSION;
        progression.releaseVersion = RELEASE_VERSION;
        window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progression));
    } catch (err) {
        // Ignore storage quota / private mode restrictions
    }
}

export function saveProgression(options: SaveProgressionOptions = {}) {
    const sfx = options.sfx || (window.sfx as { playRankUp?: () => void } | undefined);
    const player = options.player || window.player;
    const spawnBurstParticles = options.spawnBurstParticles || (window.spawnBurstParticles as SaveProgressionOptions['spawnBurstParticles']);
    const showToast = options.showToast || (window.showToast as SaveProgressionOptions['showToast']);
    const triggerNPCSpeech = options.triggerNPCSpeech || (window.triggerNPCSpeech as SaveProgressionOptions['triggerNPCSpeech']);

    const newRank = getRescueStarRank(progression);
    const rankedUp = newRank.level > lastKnownRankLevel;
    lastKnownRankLevel = newRank.level;

    progression.saveVersion = CURRENT_SAVE_VERSION;
    progression.releaseVersion = RELEASE_VERSION;
    _saveDirty = true;

    if (options.immediate === true) {
        flushProgressionSave();
    } else if (!_saveTimer) {
        _saveTimer = setTimeout(() => flushProgressionSave(), SAVE_DEBOUNCE_MS);
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

let _lastHudSnap: {
    em: number;
    cit: number;
    en: number;
    landmarks: number;
    crests: number;
    allies: number;
    rankLevel: number;
    rankTitle: string;
} | null = null;
let _hudEls: Record<string, HTMLElement | null> | null = null;

export function syncProgressionHUD() {
    if (typeof document === 'undefined') return;
    if (!_hudEls) {
        _hudEls = {
            em: document.getElementById('stat-total-emergencies'),
            cit: document.getElementById('stat-total-citizens'),
            en: document.getElementById('stat-total-energon'),
            landmarks: document.getElementById('stat-total-landmarks'),
            crests: document.getElementById('stat-total-crests'),
            allies: document.getElementById('stat-total-allies'),
            rankBadge: document.getElementById('stat-rank-badge'),
            rankStars: document.getElementById('stat-rank-stars'),
            rankTitle: document.getElementById('stat-rank-title')
        };
    }

    const em = progression.totalEmergenciesResolved || 0;
    const cit = progression.totalCitizensRescued || 0;
    const en = progression.totalEnergonCubes || 0;
    const landmarks = Array.isArray(progression.discoveredLandmarks) ? progression.discoveredLandmarks.length : 0;
    const crests = Array.isArray(progression.collectedCrests) ? progression.collectedCrests.length : 0;
    const allies = Array.isArray(progression.discoveredAllies) ? progression.discoveredAllies.length : 0;
    const rankInfo = getRescueStarRank(progression);

    const prev = _lastHudSnap;
    if (
        prev &&
        prev.em === em &&
        prev.cit === cit &&
        prev.en === en &&
        prev.landmarks === landmarks &&
        prev.crests === crests &&
        prev.allies === allies &&
        prev.rankLevel === rankInfo.level &&
        prev.rankTitle === rankInfo.title
    ) {
        return;
    }

    if (!prev || prev.em !== em) {
        if (_hudEls.em) _hudEls.em.textContent = String(em);
    }
    if (!prev || prev.cit !== cit) {
        if (_hudEls.cit) _hudEls.cit.textContent = String(cit);
    }
    if (!prev || prev.en !== en) {
        if (_hudEls.en) _hudEls.en.textContent = String(en);
    }
    if (!prev || prev.landmarks !== landmarks) {
        if (_hudEls.landmarks) _hudEls.landmarks.textContent = String(landmarks);
    }
    if (!prev || prev.crests !== crests) {
        if (_hudEls.crests) _hudEls.crests.textContent = String(crests);
    }
    if (!prev || prev.allies !== allies) {
        if (_hudEls.allies) {
            _hudEls.allies.textContent = String(allies);
            _hudEls.allies.className = allies >= 6 ? 'text-emerald-400 font-extrabold' : 'text-purple-300 font-bold';
        }
    }

    if (!prev || prev.rankLevel !== rankInfo.level || prev.rankTitle !== rankInfo.title) {
        if (_hudEls.rankStars && _hudEls.rankTitle) {
            _hudEls.rankStars.innerHTML = renderStarSVGs(rankInfo.level);
            _hudEls.rankTitle.textContent = rankInfo.title;
        } else if (_hudEls.rankBadge) {
            _hudEls.rankBadge.innerHTML = `<span id="stat-rank-stars" class="flex items-center gap-0.5">${renderStarSVGs(rankInfo.level)}</span><span id="stat-rank-title">${rankInfo.title}</span>`;
            _hudEls.rankStars = document.getElementById('stat-rank-stars');
            _hudEls.rankTitle = document.getElementById('stat-rank-title');
        }
    }

    _lastHudSnap = {
        em,
        cit,
        en,
        landmarks,
        crests,
        allies,
        rankLevel: rankInfo.level,
        rankTitle: rankInfo.title
    };
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

export function importSaveData(file: Blob | null | undefined, onComplete?: () => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const rawResult = e.target?.result;
            if (typeof rawResult !== 'string') return;
            const parsed = JSON.parse(rawResult) as Record<string, unknown>;
            if (parsed && typeof parsed === 'object') {
                ['totalEmergenciesResolved', 'totalCitizensRescued', 'totalEnergonCubes', 'totalStuntsCompleted', 'cavernGemsCollected'].forEach(f => {
                    const val = parsed[f];
                    if (typeof val === 'number' && Number.isFinite(val)) progression[f] = Math.max(0, Math.floor(val));
                });
                ['discoveredLandmarks', 'collectedCrests', 'discoveredAllies', 'discoveredCavernLandmarks', 'exploredCavernCells', 'brokenCavernWalls'].forEach(f => {
                    if (Array.isArray(parsed[f])) progression[f] = parsed[f];
                });
                if (typeof parsed.buddyBotType === 'string' && (window.BOT_METADATA ? window.BOT_METADATA[parsed.buddyBotType] : true)) {
                    progression.buddyBotType = parsed.buddyBotType;
                }
                saveProgression({ immediate: true });
                if (onComplete) onComplete();
                else window.location.reload();
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            alert('Could not read or parse save file: ' + msg);
        }
    };
    reader.readAsText(file);
}

export function resetCareerProgress(onComplete?: () => void) {
    if (confirm('Are you sure you want to reset your career progress? This will reset your emergency count, energon cubes, and rank. Your settings and keybindings will be kept.')) {
        progression.totalEmergenciesResolved = 0;
        progression.totalCitizensRescued = 0;
        progression.totalEnergonCubes = 0;
        progression.totalStuntsCompleted = 0;
        progression.discoveredLandmarks = [];
        progression.collectedCrests = [];
        progression.discoveredAllies = [];
        ALL_PLAYABLE_BOTS.forEach(b => {
            const k = getBotDockedKey(b);
            progression[k] = false;
        });
        progression.playerBotType = 'BOULDER';
        progression.buddyBotType = 'HEATWAVE';
        progression.playerMode = 'BOT';
        progression.playerPosition = null;
        progression.completedMissions = [];
        progression.discoveredCavernLandmarks = [];
        progression.cavernGemsCollected = 0;
        progression.exploredCavernCells = [];
        progression.brokenCavernWalls = [];
        try {
            for (const k of LEGACY_SAVE_KEYS) {
                window.localStorage.removeItem(k);
            }
            const toRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const k = window.localStorage.key(i);
                if (k && k.startsWith(PROGRESSION_STORAGE_PREFIX)) toRemove.push(k);
            }
            toRemove.forEach(k => window.localStorage.removeItem(k));
        } catch (e) {}
        saveProgression({ immediate: true });
        if (onComplete) onComplete();
        else window.location.reload();
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => flushProgressionSave());
    window.addEventListener('beforeunload', () => flushProgressionSave());
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) flushProgressionSave();
        });
    }
    Object.assign(window, {
        progression,
        loadProgression,
        saveProgression,
        flushProgressionSave,
        getRescueStarRank,
        getBotDockedKey,
        isBotDocked,
        setBotDocked,
        ALL_PLAYABLE_BOTS
    });
}

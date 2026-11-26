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
    ratchetDocked: boolean;
    toreinbottoDocked: boolean;
    mainlandTunnelVisited: boolean;
    totalPatientsDelivered: number;
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
    underwaterLandmarksFound: string[];
    underwaterRelicsFound: string[];
    underwaterMoroccoCalmed: boolean;
    underwaterRingsCompleted: number;
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

export function createDefaultProgression(): ProgressionData {
    return {
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
        ratchetDocked: false,
        toreinbottoDocked: false,
        mainlandTunnelVisited: false,
        totalPatientsDelivered: 0,
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
        saturnWins: 0,
        underwaterLandmarksFound: [],
        underwaterRelicsFound: [],
        underwaterMoroccoCalmed: false,
        underwaterRingsCompleted: 0
    };
}

export const progression: ProgressionData = createDefaultProgression();

export const ALL_PLAYABLE_BOTS = ['BOULDER', 'HEATWAVE', 'CHASE', 'BLADES', 'OPTIMUS', 'BUMBLEBEE', 'BLURR', 'SALVAGE', 'HIGHTIDE', 'QUICKSHADOW', 'STARSPEED', 'RATCHET', 'TOREINBOTTO'];
export const VALID_PLAYER_MODES = ['BOT', 'VEHICLE', 'DINO', 'HIDDEN_VEHICLE'] as const;

export type ProgressionMigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Sequential schema migration registry.
 * Key `v` migrates a save object from schema version `v` to `v + 1`.
 * Whenever `CURRENT_SAVE_VERSION` is bumped, a corresponding `PROGRESSION_MIGRATIONS[N]`
 * entry MUST be added (enforced by tests/progression.test.ts).
 */
export const PROGRESSION_MIGRATIONS: Record<number, ProgressionMigrationFn> = {
    // v1 -> v2: Core island progression, allies, weather & missions
    1: (data) => {
        const next: Record<string, unknown> = { ...data };
        if (!Array.isArray(next.discoveredLandmarks)) next.discoveredLandmarks = [];
        if (!Array.isArray(next.collectedCrests)) next.collectedCrests = [];
        if (!Array.isArray(next.discoveredAllies)) next.discoveredAllies = [];
        if (!Array.isArray(next.completedMissions)) next.completedMissions = [];
        if (typeof next.autoSpawnEmergencies !== 'boolean') next.autoSpawnEmergencies = true;
        if (typeof next.weatherMode !== 'string') next.weatherMode = 'SUNNY';
        next.saveVersion = 2;
        return next;
    },
    // v2 -> v3: Underground Caverns, Starship Sigma repair quest & megabot dock states
    2: (data) => {
        const next: Record<string, unknown> = { ...data };
        if (!Array.isArray(next.discoveredCavernLandmarks)) next.discoveredCavernLandmarks = [];
        if (typeof next.cavernGemsCollected !== 'number') next.cavernGemsCollected = 0;
        if (!Array.isArray(next.exploredCavernCells)) next.exploredCavernCells = [];
        if (!Array.isArray(next.brokenCavernWalls)) next.brokenCavernWalls = [];
        if (!Array.isArray(next.sigmaPartsFound)) next.sigmaPartsFound = [];
        if (!Array.isArray(next.sigmaInstalledParts)) next.sigmaInstalledParts = [];
        if (typeof next.sigmaRepaired !== 'boolean') next.sigmaRepaired = false;
        next.saveVersion = 3;
        return next;
    },
    // v3 -> v4: Space sectors, Solar System worlds, Saturn Ring Race, Underwater, Hospital & Mainland Tunnel
    3: (data) => {
        const next: Record<string, unknown> = { ...data };
        const defaults = createDefaultProgression();
        for (const key of Object.keys(defaults)) {
            if (next[key] === undefined) {
                const defVal = defaults[key];
                next[key] = Array.isArray(defVal) ? [...defVal] : defVal;
            }
        }
        next.saveVersion = 4;
        return next;
    }
};

const NUMBER_ARRAY_FIELDS = new Set(['completedMissions', 'exploredCavernCells']);
const MIXED_ID_ARRAY_FIELDS = new Set(['collectedCrests']);

/**
 * Schema-driven normalizer: iterates every key in `createDefaultProgression()` so
 * newly added fields are automatically validated & preserved without a manual allowlist.
 */
export function normalizeProgressionData(
    raw: Record<string, unknown>,
    options: { BOT_METADATA?: Record<string, BotMetaEntry> } = {}
): ProgressionData {
    const defaults = createDefaultProgression();
    const out: ProgressionData = createDefaultProgression();
    const botMeta = options.BOT_METADATA || (typeof window !== 'undefined' ? window.BOT_METADATA : undefined) || {};

    for (const key of Object.keys(defaults)) {
        if (key === 'saveVersion' || key === 'releaseVersion') continue;
        const defVal = defaults[key];
        const rawVal = raw[key];

        if (key === 'playerBotType' || key === 'buddyBotType') {
            if (typeof rawVal === 'string' && (botMeta[rawVal] || ALL_PLAYABLE_BOTS.includes(rawVal))) {
                out[key] = rawVal;
            }
            continue;
        }
        if (key === 'playerMode') {
            if (typeof rawVal === 'string' && (VALID_PLAYER_MODES as readonly string[]).includes(rawVal)) {
                out.playerMode = rawVal;
            }
            continue;
        }
        if (key === 'playerPosition') {
            if (rawVal && typeof rawVal === 'object') {
                const pos = rawVal as { x?: unknown; y?: unknown; z?: unknown; heading?: unknown };
                if (typeof pos.x === 'number' && Number.isFinite(pos.x) && typeof pos.z === 'number' && Number.isFinite(pos.z)) {
                    out.playerPosition = {
                        x: pos.x,
                        y: typeof pos.y === 'number' && Number.isFinite(pos.y) ? pos.y : 5.0,
                        z: pos.z,
                        heading: typeof pos.heading === 'number' && Number.isFinite(pos.heading) ? pos.heading : 0
                    };
                }
            }
            continue;
        }
        if (key === 'saturnBestLapSec') {
            if (typeof rawVal === 'number' && Number.isFinite(rawVal) && rawVal > 0) {
                out.saturnBestLapSec = rawVal;
            }
            continue;
        }
        if (typeof defVal === 'boolean') {
            if (typeof rawVal === 'boolean') out[key] = rawVal;
            continue;
        }
        if (typeof defVal === 'number') {
            if (typeof rawVal === 'number' && Number.isFinite(rawVal) && rawVal >= 0) {
                out[key] = Math.floor(rawVal);
            }
            continue;
        }
        if (typeof defVal === 'string') {
            if (typeof rawVal === 'string') out[key] = rawVal;
            continue;
        }
        if (Array.isArray(defVal)) {
            if (Array.isArray(rawVal)) {
                if (NUMBER_ARRAY_FIELDS.has(key)) {
                    out[key] = rawVal.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
                } else if (MIXED_ID_ARRAY_FIELDS.has(key)) {
                    out[key] = rawVal.filter((x): x is string | number => typeof x === 'string' || (typeof x === 'number' && Number.isFinite(x)));
                } else {
                    out[key] = rawVal.filter((x): x is string => typeof x === 'string');
                }
            }
            continue;
        }
    }

    out.saveVersion = CURRENT_SAVE_VERSION;
    out.releaseVersion = RELEASE_VERSION;
    return out;
}

/**
 * Runs all sequential schema migrations from the save's version up to `CURRENT_SAVE_VERSION`,
 * then normalizes every field against the current schema defaults.
 */
export function migrateProgressionData(
    raw: Record<string, unknown>,
    options: { BOT_METADATA?: Record<string, BotMetaEntry> } = {}
): ProgressionData {
    let current: Record<string, unknown> = { ...raw };
    const rawVer = current.saveVersion;
    const startVer = (typeof rawVer === 'number' && Number.isFinite(rawVer) && rawVer >= 1)
        ? Math.floor(rawVer)
        : 1;

    for (let v = startVer; v < CURRENT_SAVE_VERSION; v++) {
        const step = PROGRESSION_MIGRATIONS[v];
        if (!step) {
            throw new Error(`Missing progression schema migration for v${v} -> v${v + 1}`);
        }
        current = step(current);
    }

    return normalizeProgressionData(current, options);
}

export function applyProgressionData(next: ProgressionData) {
    for (const key of Object.keys(next)) {
        progression[key] = next[key];
    }
}

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
    const hospitalPts = (prog.totalPatientsDelivered || 0) * 5;
    return (prog.totalEnergonCubes || 0) + (prog.totalEmergenciesResolved || 0) * 3 + (prog.totalStuntsCompleted || 0) + landmarkPts + crestPts + allyPts + cavernLandmarkPts + cavernGemPts + sigmaPts + spacePts + moonPts + solarPts + hospitalPts;
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
    const win = typeof window !== 'undefined' ? window : undefined;
    const BOT_METADATA = options.BOT_METADATA || win?.BOT_METADATA || {};
    const player = options.player || win?.player || { botType: 'BOULDER' };
    const buddyBot = options.buddyBot || win?.buddyBot || { botType: 'HEATWAVE' };

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

    const migrated = migrateProgressionData(target, { BOT_METADATA });
    applyProgressionData(migrated);

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progression));
        }
    } catch(e){}

    lastKnownRankLevel = getRescueStarRank(progression).level;
    if (progression.buddyBotType && BOT_METADATA[progression.buddyBotType] && progression.buddyBotType !== player.botType) {
        buddyBot.botType = progression.buddyBotType;
    } else {
        buddyBot.botType = player.botType === 'HEATWAVE' ? 'BOULDER' : 'HEATWAVE';
    }
    if (typeof document !== 'undefined') {
        syncProgressionHUD();
    }
    if (typeof window !== 'undefined' && typeof window.syncHUDToActiveBot === 'function') {
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

export function applyImportedSaveObject(parsed: Record<string, unknown>): ProgressionData {
    const migrated = migrateProgressionData(parsed);
    applyProgressionData(migrated);
    return migrated;
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
                applyImportedSaveObject(parsed);
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

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    CURRENT_SAVE_VERSION,
    RELEASE_VERSION,
    SAVE_STORAGE_KEY,
    PROGRESSION_MIGRATIONS,
    createDefaultProgression,
    migrateProgressionData,
    normalizeProgressionData,
    applyImportedSaveObject,
    applyProgressionData,
    loadProgression,
    progression,
    type ProgressionData
} from '../src/progression/progression.ts';

function createMockLocalStorage() {
    const store = new Map<string, string>();
    return {
        get length() {
            return store.size;
        },
        key(index: number) {
            return Array.from(store.keys())[index] ?? null;
        },
        getItem(key: string) {
            return store.has(key) ? store.get(key)! : null;
        },
        setItem(key: string, value: string) {
            store.set(key, String(value));
        },
        removeItem(key: string) {
            store.delete(key);
        },
        clear() {
            store.clear();
        }
    };
}

function buildPopulatedNonDefaultSave(): ProgressionData {
    const defaults = createDefaultProgression();
    const populated: ProgressionData = createDefaultProgression();
    let counter = 11;

    for (const key of Object.keys(defaults)) {
        if (key === 'saveVersion' || key === 'releaseVersion') continue;
        const defVal = defaults[key];

        if (key === 'playerBotType') {
            populated.playerBotType = 'TOREINBOTTO';
        } else if (key === 'buddyBotType') {
            populated.buddyBotType = 'STARSPEED';
        } else if (key === 'playerMode') {
            populated.playerMode = 'HIDDEN_VEHICLE';
        } else if (key === 'weatherMode') {
            populated.weatherMode = 'NIGHT';
        } else if (key === 'playerPosition') {
            populated.playerPosition = { x: 123.5, y: 8.25, z: -456.75, heading: 1.75 };
        } else if (key === 'saturnBestLapSec') {
            populated.saturnBestLapSec = 41.25;
        } else if (typeof defVal === 'boolean') {
            populated[key] = !defVal;
        } else if (typeof defVal === 'number') {
            populated[key] = counter++;
        } else if (typeof defVal === 'string') {
            populated[key] = `custom_${key}`;
        } else if (Array.isArray(defVal)) {
            if (key === 'completedMissions' || key === 'exploredCavernCells') {
                populated[key] = [counter++, counter++];
            } else if (key === 'collectedCrests') {
                populated[key] = ['CREST_ALPHA', 42];
            } else {
                populated[key] = [`${key}_A`, `${key}_B`];
            }
        }
    }

    populated.saveVersion = CURRENT_SAVE_VERSION;
    populated.releaseVersion = RELEASE_VERSION;
    return populated;
}

describe('Progression Schema Migrations & Backwards Compatibility', () => {
    beforeEach(() => {
        applyProgressionData(createDefaultProgression());
    });

    it('registers a sequential migration function for every schema version up to CURRENT_SAVE_VERSION', () => {
        for (let v = 1; v < CURRENT_SAVE_VERSION; v++) {
            assert.equal(
                typeof PROGRESSION_MIGRATIONS[v],
                'function',
                `Missing migration function PROGRESSION_MIGRATIONS[${v}] for v${v} -> v${v + 1}`
            );
        }
    });

    it('migrates an unversioned / v1 save cleanly through v1 -> v2 -> v3 -> v4 without losing progress', () => {
        const legacyV1: Record<string, unknown> = {
            totalEmergenciesResolved: 7,
            totalCitizensRescued: 19,
            totalEnergonCubes: 34,
            totalStuntsCompleted: 5,
            playerBotType: 'HEATWAVE',
            buddyBotType: 'CHASE'
        };

        const migrated = migrateProgressionData(legacyV1);
        assert.equal(migrated.saveVersion, CURRENT_SAVE_VERSION);
        assert.equal(migrated.totalEmergenciesResolved, 7);
        assert.equal(migrated.totalCitizensRescued, 19);
        assert.equal(migrated.totalEnergonCubes, 34);
        assert.equal(migrated.totalStuntsCompleted, 5);
        assert.equal(migrated.playerBotType, 'HEATWAVE');
        assert.equal(migrated.buddyBotType, 'CHASE');
        assert.deepEqual(migrated.discoveredLandmarks, []);
        assert.deepEqual(migrated.visitedPlanets, []);
        assert.deepEqual(migrated.underwaterLandmarksFound, []);
        assert.equal(migrated.mainlandTunnelVisited, false);
    });

    it('migrates a v2 save cleanly to v4 preserving landmarks, crests, allies, and missions', () => {
        const saveV2: Record<string, unknown> = {
            saveVersion: 2,
            totalEmergenciesResolved: 12,
            discoveredLandmarks: ['HQ', 'VOLCANO'],
            collectedCrests: ['CREST_1', 2],
            discoveredAllies: ['OPTIMUS', 'BUMBLEBEE'],
            completedMissions: [1, 2, 3],
            weatherMode: 'RAIN',
            autoSpawnEmergencies: false
        };

        const migrated = migrateProgressionData(saveV2);
        assert.equal(migrated.saveVersion, CURRENT_SAVE_VERSION);
        assert.equal(migrated.totalEmergenciesResolved, 12);
        assert.deepEqual(migrated.discoveredLandmarks, ['HQ', 'VOLCANO']);
        assert.deepEqual(migrated.collectedCrests, ['CREST_1', 2]);
        assert.deepEqual(migrated.discoveredAllies, ['OPTIMUS', 'BUMBLEBEE']);
        assert.deepEqual(migrated.completedMissions, [1, 2, 3]);
        assert.equal(migrated.weatherMode, 'RAIN');
        assert.equal(migrated.autoSpawnEmergencies, false);
        assert.equal(migrated.sigmaRepaired, false);
    });

    it('migrates a v3 save cleanly to v4 preserving cavern & Sigma quest progress', () => {
        const saveV3: Record<string, unknown> = {
            saveVersion: 3,
            totalEnergonCubes: 88,
            discoveredCavernLandmarks: ['CRYSTAL_CACHE', 'SIGMA_CRASH'],
            cavernGemsCollected: 14,
            exploredCavernCells: [10, 11, 12],
            brokenCavernWalls: ['WALL_1'],
            sigmaPartsFound: ['CORE', 'THRUSTER'],
            sigmaInstalledParts: ['CORE'],
            sigmaRepaired: true,
            highTideDocked: true,
            optimusDocked: true
        };

        const migrated = migrateProgressionData(saveV3);
        assert.equal(migrated.saveVersion, CURRENT_SAVE_VERSION);
        assert.equal(migrated.totalEnergonCubes, 88);
        assert.deepEqual(migrated.discoveredCavernLandmarks, ['CRYSTAL_CACHE', 'SIGMA_CRASH']);
        assert.equal(migrated.cavernGemsCollected, 14);
        assert.deepEqual(migrated.exploredCavernCells, [10, 11, 12]);
        assert.deepEqual(migrated.brokenCavernWalls, ['WALL_1']);
        assert.deepEqual(migrated.sigmaPartsFound, ['CORE', 'THRUSTER']);
        assert.deepEqual(migrated.sigmaInstalledParts, ['CORE']);
        assert.equal(migrated.sigmaRepaired, true);
        assert.equal(migrated.highTideDocked, true);
        assert.equal(migrated.optimusDocked, true);
        assert.equal(migrated.underwaterMoroccoCalmed, false);
        assert.equal(migrated.totalPatientsDelivered, 0);
    });

    it('preserves EVERY single field in ProgressionData across migrate, import, and localStorage load round-trips', () => {
        const fullSave = buildPopulatedNonDefaultSave();
        const rawJson = JSON.parse(JSON.stringify(fullSave)) as Record<string, unknown>;

        // 1. Direct migration + normalization round-trip
        const migrated = migrateProgressionData(rawJson);
        assert.deepEqual(migrated, fullSave);

        // 2. JSON import round-trip
        const imported = applyImportedSaveObject(rawJson);
        assert.deepEqual(imported, fullSave);
        assert.deepEqual(progression, fullSave);

        // 3. Full localStorage loadProgression() round-trip
        const mockStorage = createMockLocalStorage();
        mockStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(fullSave));
        const prevWindow = (globalThis as Record<string, unknown>).window;
        (globalThis as Record<string, unknown>).window = { localStorage: mockStorage };
        try {
            applyProgressionData(createDefaultProgression());
            loadProgression();
            assert.deepEqual(progression, fullSave);
        } finally {
            if (prevWindow === undefined) {
                delete (globalThis as Record<string, unknown>).window;
            } else {
                (globalThis as Record<string, unknown>).window = prevWindow;
            }
        }
    });

    it('merges legacy localStorage v3 save into v4 without losing either version’s progress', () => {
        const mockStorage = createMockLocalStorage();
        mockStorage.setItem('rescue_bots_save_v3', JSON.stringify({
            saveVersion: 3,
            totalEnergonCubes: 95,
            discoveredLandmarks: ['LEGACY_SITE'],
            discoveredAllies: ['OPTIMUS']
        }));
        mockStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify({
            saveVersion: 4,
            totalEnergonCubes: 50,
            discoveredLandmarks: ['NEW_SITE'],
            visitedPlanets: ['MARS', 'EUROPA'],
            underwaterMoroccoCalmed: true,
            mainlandTunnelVisited: true
        }));

        const prevWindow = (globalThis as Record<string, unknown>).window;
        (globalThis as Record<string, unknown>).window = { localStorage: mockStorage };
        try {
            loadProgression();
            assert.equal(progression.totalEnergonCubes, 95);
            assert.ok(progression.discoveredLandmarks.includes('LEGACY_SITE'));
            assert.ok(progression.discoveredLandmarks.includes('NEW_SITE'));
            assert.ok(progression.discoveredAllies.includes('OPTIMUS'));
            assert.deepEqual(progression.visitedPlanets, ['MARS', 'EUROPA']);
            assert.equal(progression.underwaterMoroccoCalmed, true);
            assert.equal(progression.mainlandTunnelVisited, true);
        } finally {
            if (prevWindow === undefined) {
                delete (globalThis as Record<string, unknown>).window;
            } else {
                (globalThis as Record<string, unknown>).window = prevWindow;
            }
        }
    });

    it('recovers gracefully from corrupted or invalid field types while preserving valid sibling progress', () => {
        const corrupted: Record<string, unknown> = {
            saveVersion: 4,
            totalEnergonCubes: 42,
            totalEmergenciesResolved: -99,
            totalCitizensRescued: 'not-a-number',
            playerBotType: 'NON_EXISTENT_BOT',
            playerMode: 'INVALID_MODE',
            saturnBestLapSec: -5,
            visitedPlanets: ['MARS', 123, null, 'PLUTO'],
            completedMissions: [1, 'bad', 3],
            underwaterMoroccoCalmed: true
        };

        const normalized = normalizeProgressionData(corrupted);
        assert.equal(normalized.totalEnergonCubes, 42);
        assert.equal(normalized.totalEmergenciesResolved, 0);
        assert.equal(normalized.totalCitizensRescued, 0);
        assert.equal(normalized.playerBotType, 'BOULDER');
        assert.equal(normalized.playerMode, 'BOT');
        assert.equal(normalized.saturnBestLapSec, null);
        assert.deepEqual(normalized.visitedPlanets, ['MARS', 'PLUTO']);
        assert.deepEqual(normalized.completedMissions, [1, 3]);
        assert.equal(normalized.underwaterMoroccoCalmed, true);
    });
});

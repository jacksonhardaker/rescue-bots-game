// Galactic Explorer Log (Solar System Passport Modal)
import { progression } from '../progression/progression.js';
import { SOLAR_DESTINATIONS } from '../world/solarSystem.js';
import { SVG_ICONS } from './icons.js';
import { sfx } from '../audio/soundFX.js';

export function renderGalacticLogModal() {
    const grid = document.getElementById('galactic-log-planets');
    const milestones = document.getElementById('galactic-log-milestones');
    const summaryEl = document.getElementById('galactic-log-summary');
    const barEl = document.getElementById('galactic-log-bar');
    if (!grid || !milestones) return;

    const visited: string[] = Array.isArray(progression.visitedPlanets) ? progression.visitedPlanets : [];
    const planetRelics: string[] = Array.isArray(progression.planetRelicsFound) ? progression.planetRelicsFound : [];
    const moonRelics: string[] = Array.isArray(progression.moonRelicsFound) ? progression.moonRelicsFound : [];
    const jupMoons: string[] = Array.isArray(progression.jupiterMoonsVisited) ? progression.jupiterMoonsVisited : [];
    const cavRelics: string[] = Array.isArray(progression.planetCavernRelicsFound) ? progression.planetCavernRelicsFound : [];
    const monoliths: string[] = Array.isArray(progression.planetMonolithsScanned) ? progression.planetMonolithsScanned : [];
    const coursesDone: string[] = Array.isArray(progression.planetCoursesCompleted) ? progression.planetCoursesCompleted : [];
    const cometsCaught = progression.spaceCometsCaught || 0;
    const allies: string[] = Array.isArray(progression.discoveredAllies) ? progression.discoveredAllies : [];
    const starspeedUnlocked = allies.includes('STARSPEED');
    const bestLap = typeof progression.saturnBestLapSec === 'number' ? `${progression.saturnBestLapSec.toFixed(1)}s` : '--.-s';
    const saturnWins = progression.saturnWins || 0;

    // Count relics per destination
    const countRelicsFor = (prefix: string) => planetRelics.filter(id => id.startsWith(prefix + '_')).length;

    let visitedCount = 0;
    grid.innerHTML = '';
    SOLAR_DESTINATIONS.forEach(d => {
        const isVisited = d.id === 'EARTH' || visited.includes(d.id);
        if (isVisited) visitedCount++;

        let statLine = 'Orbit Explored';
        if (d.id === 'EARTH') statLine = 'Griffin Rock HQ';
        else if (d.id === 'MOON') statLine = `Relics: ${moonRelics.length}/5 • Caverns: ${cavRelics.includes('CAV_MOON_1') ? '1/1' : '0/1'}`;
        else if (d.id === 'JUPITER') statLine = `Moons: ${jupMoons.length}/4 • Europa Water: ${countRelicsFor('EUROPA')}/3`;
        else if (d.id === 'SATURN') statLine = `Best Lap: ${bestLap} • Wins: ${saturnWins}`;
        else if (d.id === 'TITAN') statLine = `Relics: ${countRelicsFor('TITAN')}/3 • Caverns: ${cavRelics.includes('CAV_TITAN_1') ? '1/1' : '0/1'}`;
        else if (d.id === 'URANUS') statLine = `Miranda: ${countRelicsFor('MIRANDA')}/3 • Titania: ${countRelicsFor('TITANIA')}/3`;
        else if (d.id === 'NEPTUNE') statLine = `Triton Relics: ${countRelicsFor('TRITON')}/3`;
        else statLine = `Relics: ${countRelicsFor(d.id)}/3 • Caverns: ${cavRelics.includes(`CAV_${d.id}_1`) ? '1/1' : '0/1'}`;

        const card = document.createElement('div');
        card.style.cssText = `
            padding: 12px;
            border-radius: 16px;
            background: ${isVisited ? 'rgba(14, 116, 144, 0.22)' : 'rgba(15, 23, 42, 0.78)'};
            border: 1.5px solid ${isVisited ? 'rgba(56, 189, 248, 0.65)' : 'rgba(71, 85, 105, 0.65)'};
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        card.innerHTML = `
            <span style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${SVG_ICONS[d.iconKey] || SVG_ICONS.SOLAR_SYSTEM}
            </span>
            <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <span class="text-xs font-black text-white uppercase">${d.name}</span>
                    <span style="font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 999px; background: ${isVisited ? '#4ade80' : '#334155'}; color: ${isVisited ? '#0f172a' : '#cbd5e1'};">
                        ${isVisited ? 'VISITED' : 'NEW'}
                    </span>
                </div>
                <div class="text-[10px] text-cyan-200 font-bold" style="margin-top: 3px;">${statLine}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Special Galactic Milestones
    const milestoneItems = [
        {
            icon: SVG_ICONS.STARSPEED,
            title: 'Starspeed Triton Rescue',
            status: starspeedUnlocked ? 'THAWED & UNLOCKED!' : 'Frozen on Triton (Neptune)',
            done: starspeedUnlocked
        },
        {
            icon: SVG_ICONS.PLANET_JUPITER,
            title: 'Jupiter Galilean Moon Tour',
            status: `${jupMoons.length} / 4 Moons Charted`,
            done: jupMoons.length >= 4
        },
        {
            icon: SVG_ICONS.RING_RACE,
            title: 'Saturn Ring Grand Prix',
            status: saturnWins > 0 ? `${saturnWins} Win${saturnWins > 1 ? 's' : ''} • Best ${bestLap}` : `Races: ${progression.saturnRacesCompleted || 0} • Best ${bestLap}`,
            done: saturnWins > 0
        },
        {
            icon: SVG_ICONS.CAVE_ENTRANCE,
            title: 'Planetary & Lunar Caverns',
            status: `${cavRelics.length} / 12 Subterranean Relics Discovered`,
            done: cavRelics.length >= 12
        },
        {
            icon: SVG_ICONS.MONOLITH,
            title: 'Ancient Monoliths & Surface Courses',
            status: `${monoliths.length} Monoliths Scanned • ${coursesDone.length} Courses Cleared`,
            done: monoliths.length >= 6
        },
        {
            icon: SVG_ICONS.COMET,
            title: 'Energon Comet Hunter',
            status: `${cometsCaught} Orbiting Energon Comet${cometsCaught === 1 ? '' : 's'} Caught`,
            done: cometsCaught >= 3
        },
        {
            icon: SVG_ICONS.LASER,
            title: "Dr. Morocco's Orbital Station",
            status: progression.spaceMoroccoDefeated ? 'ORBITAL LASER DISABLED!' : 'Active in Moon Orbit',
            done: Boolean(progression.spaceMoroccoDefeated)
        }
    ];

    milestones.innerHTML = '';
    milestoneItems.forEach(m => {
        const row = document.createElement('div');
        row.style.cssText = `
            padding: 12px 14px;
            border-radius: 14px;
            background: ${m.done ? 'rgba(22, 163, 74, 0.2)' : 'rgba(15, 23, 42, 0.8)'};
            border: 1.5px solid ${m.done ? 'rgba(74, 222, 128, 0.65)' : 'rgba(71, 85, 105, 0.65)'};
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        row.innerHTML = `
            <span style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${m.icon || SVG_ICONS.STAR}</span>
            <div style="flex: 1; min-width: 0;">
                <div class="text-xs font-black text-white">${m.title}</div>
                <div class="text-[11px] font-bold" style="color: ${m.done ? '#86efac' : '#94a3b8'}; margin-top: 2px;">${m.status}</div>
            </div>
        `;
        milestones.appendChild(row);
    });

    const totalRelicsFound = moonRelics.length + planetRelics.length + cavRelics.length;
    const totalRelicsMax = 5 + 11 * 3 + 12; // 5 Moon + 33 across 11 Planet/Moon surfaces + 12 Cavern relics
    const totalDests = SOLAR_DESTINATIONS.length;
    const pct = Math.min(100, Math.round(((visitedCount / totalDests) * 0.45 + (totalRelicsFound / totalRelicsMax) * 0.40 + (starspeedUnlocked ? 0.15 : 0)) * 100));
    if (summaryEl) {
        summaryEl.textContent = `${visitedCount}/${totalDests} Worlds Visited • ${totalRelicsFound}/${totalRelicsMax} Relics • ${pct}% Complete`;
    }
    if (barEl) {
        barEl.style.width = `${pct}%`;
    }
}

export function openGalacticLogModal() {
    const modal = document.getElementById('galactic-log-modal');
    if (!modal) return;
    renderGalacticLogModal();
    modal.classList.remove('hidden');
    sfx.playWaypointTap?.();
}

export function closeGalacticLogModal() {
    const modal = document.getElementById('galactic-log-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    sfx.playWaypointTap?.();
}

if (typeof window !== 'undefined') {
    Object.assign(window, { openGalacticLogModal, closeGalacticLogModal, renderGalacticLogModal });
}
